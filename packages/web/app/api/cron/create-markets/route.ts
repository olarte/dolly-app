import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { supabase } from '@/lib/supabase'
import { publicClient, getWalletClient, currencyPairToBytes32 } from '@/lib/viem-server'
import { getCurrentPrice, priceToOnChain } from '@/lib/price-source'
import { MARKET_FACTORY_ABI, MARKET_FACTORY_ADDRESS } from '@/lib/contracts'
import { STABLECOINS } from '@/lib/stablecoins'

// Active currency pairs for market creation
const ACTIVE_PAIRS = ['USD/COP']

// Market type: 0 = daily
const MARKET_TYPE_DAILY = 0

export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  if (MARKET_FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return NextResponse.json({ error: 'MARKET_FACTORY_ADDRESS not set' }, { status: 500 })
  }

  const results: Array<{ pair: string; market?: string; error?: string; skipped?: boolean }> = []

  for (const pair of ACTIVE_PAIRS) {
    try {
      const result = await createDailyMarket(pair)
      results.push(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      results.push({ pair, error: message })
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() })
}

async function createDailyMarket(pair: string): Promise<{
  pair: string
  market?: string
  error?: string
  skipped?: boolean
}> {
  const pairHash = currencyPairToBytes32(pair)

  // Determine market times
  // Daily market: starts now, betting closes 10 min before resolution,
  // resolution at 5 PM Colombia time (22:00 UTC)
  const now = Math.floor(Date.now() / 1000)
  const todayUTC = new Date()
  todayUTC.setUTCHours(22, 0, 0, 0) // 5 PM COT = 22:00 UTC
  let endDate = Math.floor(todayUTC.getTime() / 1000)
  if (endDate <= now) {
    endDate += 86400 // push to tomorrow
  }

  // Check if market already exists on-chain for this date
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
    // getMarket may revert if no market exists — that's fine, we'll create one
  }

  // Also check DB for idempotency
  if (supabase) {
    const todayStr = new Date().toISOString().slice(0, 10)
    const { data: existing } = await supabase
      .from('markets')
      .select('id')
      .eq('currency_pair', pair)
      .eq('market_type', MARKET_TYPE_DAILY)
      .gte('start_date', `${todayStr}T00:00:00Z`)
      .lte('start_date', `${todayStr}T23:59:59Z`)
      .limit(1)

    if (existing && existing.length > 0) {
      return { pair, skipped: true, market: existing[0].id }
    }
  }

  // Fetch opening price
  const openingPrice = await getCurrentPrice(pair)

  // Create market on-chain
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
      MARKET_TYPE_DAILY,
      BigInt(now),
      BigInt(endDate),
      300n, // 3% rake
      allowedTokens,
    ],
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  // Extract created market address from MarketCreated event
  const marketCreatedLog = receipt.logs.find((log) => {
    try {
      return log.topics[0] === '0x' + 'MarketCreated' // We'll match by structure
    } catch {
      return false
    }
  })

  // The market address is the first indexed topic in MarketCreated event
  let marketAddress: string | undefined
  for (const log of receipt.logs) {
    if (log.topics.length >= 2) {
      // MarketCreated(address indexed market, ...)
      // topic[0] = event sig, topic[1] = market address (indexed)
      const addr = '0x' + log.topics[1]?.slice(26)
      if (addr && addr.length === 42) {
        marketAddress = addr.toLowerCase()
        break
      }
    }
  }

  if (!marketAddress) {
    return { pair, error: 'Market created but address not found in logs' }
  }

  // Store in database
  if (supabase) {
    const bettingCloseTime = new Date((endDate - 600) * 1000) // 10 min before end

    await supabase.from('markets').upsert({
      id: marketAddress,
      currency_pair: pair,
      market_type: MARKET_TYPE_DAILY,
      contract_address: marketAddress,
      start_date: new Date(now * 1000).toISOString(),
      end_date: new Date(endDate * 1000).toISOString(),
      betting_close_time: bettingCloseTime.toISOString(),
      opening_price: openingPrice,
      outcome: 0,
      status: 'active',
    })
  }

  return { pair, market: marketAddress }
}
