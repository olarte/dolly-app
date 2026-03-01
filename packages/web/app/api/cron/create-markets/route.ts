import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { supabase } from '@/lib/supabase'
import { publicClient, getWalletClient, currencyPairToBytes32 } from '@/lib/viem-server'
import { getCurrentPrice, priceToOnChain } from '@/lib/price-source'
import { MARKET_FACTORY_ABI, MARKET_FACTORY_ADDRESS } from '@/lib/contracts'
import { STABLECOINS } from '@/lib/stablecoins'
import {
  isBusinessDay,
  getNextBusinessDay,
  getFirstBusinessDayOfMonth,
  getLastBusinessDayOfMonth,
  getLatestTRM,
  getTRM,
} from '@/lib/trm'

// Active currency pairs for market creation
const ACTIVE_PAIRS = ['USD/COP']

// Market types (must match Solidity enum)
const MARKET_TYPE_DAILY = 0
const MARKET_TYPE_WEEKLY = 1
const MARKET_TYPE_MONTHLY = 2

// 5 PM COT = 22:00 UTC
const RESOLUTION_HOUR_UTC = 22

interface MarketResult {
  pair: string
  type?: string
  market?: string
  error?: string
  skipped?: boolean
  reason?: string
}

// Get current time in Colombia (COT = UTC-5)
function getColombiaNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }))
}

function isWeekend(): boolean {
  const now = new Date()
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = nyTime.getDay()
  return day === 0 || day === 6
}

export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  if (MARKET_FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return NextResponse.json({ error: 'MARKET_FACTORY_ADDRESS not set' }, { status: 500 })
  }

  const results: MarketResult[] = []
  const today = getColombiaNow()

  for (const pair of ACTIVE_PAIRS) {
    // Daily market: only on business days
    if (!isWeekend() && isBusinessDay(today)) {
      try {
        const result = await createDailyMarket(pair)
        results.push({ ...result, type: 'daily' })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        results.push({ pair, type: 'daily', error: message })
      }
    } else {
      results.push({ pair, type: 'daily', skipped: true, reason: 'Not a business day' })
    }

    // Weekly market: create on Monday (or next business day if Monday is holiday)
    try {
      const result = await createWeeklyMarketIfNeeded(pair, today)
      results.push({ ...result, type: 'weekly' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      results.push({ pair, type: 'weekly', error: message })
    }

    // Monthly market: create on 1st business day of the month
    try {
      const result = await createMonthlyMarketIfNeeded(pair, today)
      results.push({ ...result, type: 'monthly' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      results.push({ pair, type: 'monthly', error: message })
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() })
}

// --- Shared helpers ---

function extractMarketAddress(receipt: { logs: Array<{ topics: readonly string[] }> }): string | undefined {
  for (const log of receipt.logs) {
    if (log.topics.length >= 2) {
      const addr = '0x' + log.topics[1]?.slice(26)
      if (addr && addr.length === 42) {
        return addr.toLowerCase()
      }
    }
  }
  return undefined
}

async function checkExistingMarketDB(
  pair: string,
  marketType: number,
  startDateStr: string,
): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('markets')
    .select('id')
    .eq('currency_pair', pair)
    .eq('market_type', marketType)
    .gte('start_date', `${startDateStr}T00:00:00Z`)
    .lte('start_date', `${startDateStr}T23:59:59Z`)
    .limit(1)
  return data && data.length > 0 ? data[0].id : null
}

async function deployMarket(
  pair: string,
  marketType: number,
  startTimestamp: number,
  endTimestamp: number,
): Promise<string> {
  const pairHash = currencyPairToBytes32(pair)
  const walletClient = getWalletClient()
  const allowedTokens = [
    STABLECOINS.cUSD.tokenAddress,
    STABLECOINS.USDC.tokenAddress,
    STABLECOINS.USDT.tokenAddress,
  ]

  const hash = await walletClient.writeContract({
    address: MARKET_FACTORY_ADDRESS,
    abi: MARKET_FACTORY_ABI,
    functionName: 'createMarket',
    args: [
      pairHash,
      marketType,
      BigInt(startTimestamp),
      BigInt(endTimestamp),
      300n, // 3% rake
      allowedTokens,
    ],
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  const marketAddress = extractMarketAddress(receipt)
  if (!marketAddress) throw new Error('Market created but address not found in logs')
  return marketAddress
}

async function storeMarketDB(
  marketAddress: string,
  pair: string,
  marketType: number,
  startTimestamp: number,
  endTimestamp: number,
  openingPrice: number,
): Promise<void> {
  if (!supabase) return
  const bettingCloseTime = new Date((endTimestamp - 600) * 1000)
  await supabase.from('markets').upsert({
    id: marketAddress,
    currency_pair: pair,
    market_type: marketType,
    contract_address: marketAddress,
    start_date: new Date(startTimestamp * 1000).toISOString(),
    end_date: new Date(endTimestamp * 1000).toISOString(),
    betting_close_time: bettingCloseTime.toISOString(),
    opening_price: openingPrice,
    outcome: 0,
    status: 'active',
  })
}

// --- Daily market (unchanged logic, extracted) ---

async function createDailyMarket(pair: string): Promise<MarketResult> {
  const pairHash = currencyPairToBytes32(pair)
  const now = Math.floor(Date.now() / 1000)
  const todayUTC = new Date()
  todayUTC.setUTCHours(RESOLUTION_HOUR_UTC, 0, 0, 0)
  let endDate = Math.floor(todayUTC.getTime() / 1000)
  if (endDate <= now) {
    endDate += 86400
  }

  // Check on-chain
  try {
    const existing = await publicClient.readContract({
      address: MARKET_FACTORY_ADDRESS,
      abi: MARKET_FACTORY_ABI,
      functionName: 'getMarket',
      args: [pairHash, MARKET_TYPE_DAILY, BigInt(now)],
    })
    if (existing && existing !== '0x0000000000000000000000000000000000000000') {
      return { pair, skipped: true, market: existing as string }
    }
  } catch {
    // No existing market
  }

  // Check DB
  const todayStr = new Date().toISOString().slice(0, 10)
  const existingDB = await checkExistingMarketDB(pair, MARKET_TYPE_DAILY, todayStr)
  if (existingDB) return { pair, skipped: true, market: existingDB }

  const openingPrice = await getCurrentPrice(pair)
  const marketAddress = await deployMarket(pair, MARKET_TYPE_DAILY, now, endDate)
  await storeMarketDB(marketAddress, pair, MARKET_TYPE_DAILY, now, endDate, openingPrice)
  return { pair, market: marketAddress }
}

// --- Weekly market ---
// Created on Monday (or next business day if Monday is a holiday).
// Resolves Friday at 5 PM COT. Opening TRM = Monday's TRM.

async function createWeeklyMarketIfNeeded(pair: string, today: Date): Promise<MarketResult> {
  const dayOfWeek = today.getDay() // 0=Sun, 6=Sat

  // Only attempt creation on weekdays
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { pair, skipped: true, reason: 'Weekend — no weekly market creation' }
  }

  // Find Monday of this week
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)

  // Determine the start day: Monday or next business day if Monday is a holiday
  const startDay = isBusinessDay(monday) ? monday : getNextBusinessDay(monday)

  // Only create on the start day itself
  const todayStr = formatDateLocal(today)
  const startStr = formatDateLocal(startDay)
  if (todayStr !== startStr) {
    return { pair, skipped: true, reason: `Weekly market starts on ${startStr}, today is ${todayStr}` }
  }

  // Check DB for existing weekly market this week
  const existingDB = await checkExistingMarketDB(pair, MARKET_TYPE_WEEKLY, startStr)
  if (existingDB) return { pair, skipped: true, market: existingDB }

  // Find Friday of this week (or previous business day if Friday is a holiday)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const endDay = isBusinessDay(friday) ? friday : (() => {
    // Walk back from Friday to find the last business day of the week
    const d = new Date(friday)
    while (!isBusinessDay(d) && d > startDay) {
      d.setDate(d.getDate() - 1)
    }
    return d
  })()

  // End time: 5 PM COT = 22:00 UTC on the end day
  const endDateUTC = new Date(endDay)
  endDateUTC.setUTCHours(RESOLUTION_HOUR_UTC, 0, 0, 0)

  const startTimestamp = Math.floor(Date.now() / 1000)
  const endTimestamp = Math.floor(endDateUTC.getTime() / 1000)

  // Fetch opening TRM
  let openingPrice: number
  try {
    openingPrice = await getTRM(startDay)
  } catch {
    // TRM may not be published yet today — use latest available
    const latest = await getLatestTRM()
    openingPrice = latest.rate
  }

  const marketAddress = await deployMarket(pair, MARKET_TYPE_WEEKLY, startTimestamp, endTimestamp)
  await storeMarketDB(marketAddress, pair, MARKET_TYPE_WEEKLY, startTimestamp, endTimestamp, openingPrice)
  return { pair, market: marketAddress }
}

// --- Monthly market ---
// Created on 1st business day of month. Resolves on last business day at 5 PM COT.

async function createMonthlyMarketIfNeeded(pair: string, today: Date): Promise<MarketResult> {
  const dayOfWeek = today.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { pair, skipped: true, reason: 'Weekend — no monthly market creation' }
  }

  const year = today.getFullYear()
  const month = today.getMonth()

  const firstBizDay = getFirstBusinessDayOfMonth(year, month)
  const todayStr = formatDateLocal(today)
  const firstStr = formatDateLocal(firstBizDay)

  // Only create on the first business day
  if (todayStr !== firstStr) {
    return { pair, skipped: true, reason: `Monthly market starts on ${firstStr}, today is ${todayStr}` }
  }

  // Check DB
  const existingDB = await checkExistingMarketDB(pair, MARKET_TYPE_MONTHLY, firstStr)
  if (existingDB) return { pair, skipped: true, market: existingDB }

  const lastBizDay = getLastBusinessDayOfMonth(year, month)

  // End time: 5 PM COT on last business day
  const endDateUTC = new Date(lastBizDay)
  endDateUTC.setUTCHours(RESOLUTION_HOUR_UTC, 0, 0, 0)

  const startTimestamp = Math.floor(Date.now() / 1000)
  const endTimestamp = Math.floor(endDateUTC.getTime() / 1000)

  // Fetch opening TRM
  let openingPrice: number
  try {
    openingPrice = await getTRM(firstBizDay)
  } catch {
    const latest = await getLatestTRM()
    openingPrice = latest.rate
  }

  const marketAddress = await deployMarket(pair, MARKET_TYPE_MONTHLY, startTimestamp, endTimestamp)
  await storeMarketDB(marketAddress, pair, MARKET_TYPE_MONTHLY, startTimestamp, endTimestamp, openingPrice)
  return { pair, market: marketAddress }
}

function formatDateLocal(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
