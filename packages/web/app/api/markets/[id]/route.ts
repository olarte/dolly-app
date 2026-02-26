import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { publicClient } from '@/lib/viem-server'
import { MARKET_ABI } from '@/lib/contracts'
import { formatUnits, type Address } from 'viem'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const marketAddress = params.id.toLowerCase() as Address

  try {
    // Read on-chain state
    const data = await publicClient.multicall({
      contracts: [
        { address: marketAddress, abi: MARKET_ABI, functionName: 'totalUp' },
        { address: marketAddress, abi: MARKET_ABI, functionName: 'totalDown' },
        { address: marketAddress, abi: MARKET_ABI, functionName: 'getMultiplier', args: [0] },
        { address: marketAddress, abi: MARKET_ABI, functionName: 'getMultiplier', args: [1] },
        { address: marketAddress, abi: MARKET_ABI, functionName: 'outcome' },
        { address: marketAddress, abi: MARKET_ABI, functionName: 'resolved' },
        { address: marketAddress, abi: MARKET_ABI, functionName: 'bettingClosed' },
        { address: marketAddress, abi: MARKET_ABI, functionName: 'bettingCloseTime' },
        { address: marketAddress, abi: MARKET_ABI, functionName: 'resolutionTime' },
        { address: marketAddress, abi: MARKET_ABI, functionName: 'rakeBps' },
        { address: marketAddress, abi: MARKET_ABI, functionName: 'currencyPair' },
      ],
    })

    const val = (i: number): bigint =>
      data[i].status === 'success' ? (data[i].result as bigint) : 0n
    const bool = (i: number): boolean =>
      data[i].status === 'success' ? (data[i].result as boolean) : false

    const totalUp = parseFloat(formatUnits(val(0), 18))
    const totalDown = parseFloat(formatUnits(val(1), 18))

    const market = {
      address: marketAddress,
      totalUp,
      totalDown,
      totalPool: totalUp + totalDown,
      multiplierUp: val(2) > 0n ? parseFloat(formatUnits(val(2), 18)) : 1,
      multiplierDown: val(3) > 0n ? parseFloat(formatUnits(val(3), 18)) : 1,
      outcome: Number(val(4)),
      resolved: bool(5),
      bettingClosed: bool(6),
      bettingCloseTime: new Date(Number(val(7)) * 1000).toISOString(),
      resolutionTime: new Date(Number(val(8)) * 1000).toISOString(),
      rakeBps: Number(val(9)),
      currencyPairHash: data[10].status === 'success' ? data[10].result : null,
      openingPrice: null as number | null,
      closingPrice: null as number | null,
      marketType: 0,
      activity: [] as Array<{ user: string; side: string; amount: number; txHash: string; createdAt: string }>,
    }

    // Enrich with DB data if available
    if (supabase) {
      const { data: dbMarket } = await supabase
        .from('markets')
        .select('*')
        .eq('id', marketAddress)
        .single()

      if (dbMarket) {
        market.openingPrice = dbMarket.opening_price
        market.closingPrice = dbMarket.closing_price
        market.marketType = dbMarket.market_type
      }

      // Recent activity from xp_ledger (last 20 deposits)
      const { data: activity } = await supabase
        .from('xp_ledger')
        .select('user_address, amount, reason, tx_hash, created_at')
        .eq('market_id', marketAddress)
        .eq('reason', 'WAGER')
        .order('created_at', { ascending: false })
        .limit(20)

      if (activity) {
        market.activity = activity.map((a) => ({
          user: a.user_address,
          side: 'unknown', // XP ledger doesn't track side — would need event log
          amount: a.amount,
          txHash: a.tx_hash,
          createdAt: a.created_at,
        }))
      }
    }

    return NextResponse.json(market)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
