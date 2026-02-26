import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { publicClient, currencyPairToBytes32 } from '@/lib/viem-server'
import { MARKET_FACTORY_ABI, MARKET_FACTORY_ADDRESS, MARKET_ABI } from '@/lib/contracts'
import { formatUnits, type Address } from 'viem'

export async function GET(request: NextRequest) {
  const currency = request.nextUrl.searchParams.get('currency') || 'COP'
  const pair = `USD/${currency}`

  // Strategy: try on-chain first (always authoritative), supplement with DB metadata
  try {
    const markets = await getMarketsFromChain(pair)

    // Enrich with DB metadata if supabase is available
    if (supabase && markets.length > 0) {
      const addresses = markets.map((m) => m.address)
      const { data: dbMarkets } = await supabase
        .from('markets')
        .select('*')
        .in('id', addresses)

      const dbMap = new Map(dbMarkets?.map((m) => [m.id, m]) ?? [])

      for (const market of markets) {
        const dbData = dbMap.get(market.address)
        if (dbData) {
          market.openingPrice = dbData.opening_price
          market.marketType = dbData.market_type
          market.status = dbData.status
        }
      }
    }

    return NextResponse.json({ markets, pair })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

interface MarketInfo {
  address: string
  totalUp: number
  totalDown: number
  totalPool: number
  multiplierUp: number
  multiplierDown: number
  outcome: number
  resolved: boolean
  bettingClosed: boolean
  bettingCloseTime: string
  openingPrice: number | null
  marketType: number
  status: string
}

async function getMarketsFromChain(pair: string): Promise<MarketInfo[]> {
  if (MARKET_FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return []
  }

  const pairHash = currencyPairToBytes32(pair)

  const addresses = await publicClient.readContract({
    address: MARKET_FACTORY_ADDRESS,
    abi: MARKET_FACTORY_ABI,
    functionName: 'getMarketsByCurrency',
    args: [pairHash],
  }) as Address[]

  if (!addresses || addresses.length === 0) return []

  // Batch-read key data for each market
  const results: MarketInfo[] = []

  for (const addr of addresses.slice(-10)) { // last 10 most recent
    try {
      const data = await publicClient.multicall({
        contracts: [
          { address: addr, abi: MARKET_ABI, functionName: 'totalUp' },
          { address: addr, abi: MARKET_ABI, functionName: 'totalDown' },
          { address: addr, abi: MARKET_ABI, functionName: 'getMultiplier', args: [0] },
          { address: addr, abi: MARKET_ABI, functionName: 'getMultiplier', args: [1] },
          { address: addr, abi: MARKET_ABI, functionName: 'outcome' },
          { address: addr, abi: MARKET_ABI, functionName: 'resolved' },
          { address: addr, abi: MARKET_ABI, functionName: 'bettingClosed' },
          { address: addr, abi: MARKET_ABI, functionName: 'bettingCloseTime' },
        ],
      })

      const val = (i: number): bigint =>
        data[i].status === 'success' ? (data[i].result as bigint) : 0n
      const bool = (i: number): boolean =>
        data[i].status === 'success' ? (data[i].result as boolean) : false

      const totalUp = parseFloat(formatUnits(val(0), 18))
      const totalDown = parseFloat(formatUnits(val(1), 18))

      results.push({
        address: addr.toLowerCase(),
        totalUp,
        totalDown,
        totalPool: totalUp + totalDown,
        multiplierUp: val(2) > 0n ? parseFloat(formatUnits(val(2), 18)) : 1,
        multiplierDown: val(3) > 0n ? parseFloat(formatUnits(val(3), 18)) : 1,
        outcome: Number(val(4)),
        resolved: bool(5),
        bettingClosed: bool(6),
        bettingCloseTime: new Date(Number(val(7)) * 1000).toISOString(),
        openingPrice: null,
        marketType: 0,
        status: bool(5) ? 'resolved' : bool(6) ? 'closed' : 'active',
      })
    } catch {
      // Skip markets that fail to read (e.g. self-destructed)
      continue
    }
  }

  return results
}
