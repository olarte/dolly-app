import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { supabase } from '@/lib/supabase'
import { publicClient, getWalletClient } from '@/lib/viem-server'
import { getClosePrice, priceToOnChain } from '@/lib/price-source'
import { MARKET_ABI } from '@/lib/contracts'
import type { Address } from 'viem'

export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const now = new Date()
  const results: Array<{ market: string; action: string; error?: string }> = []

  try {
    // 1. Close betting on markets past bettingCloseTime that are still active
    const { data: marketsToClose } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'active')
      .lte('betting_close_time', now.toISOString())

    for (const market of marketsToClose ?? []) {
      try {
        const isClosed = await publicClient.readContract({
          address: market.contract_address as Address,
          abi: MARKET_ABI,
          functionName: 'bettingClosed',
        })

        if (!isClosed) {
          const walletClient = getWalletClient()
          const hash = await walletClient.writeContract({
            address: market.contract_address as Address,
            abi: MARKET_ABI,
            functionName: 'closeBetting',
          })
          await publicClient.waitForTransactionReceipt({ hash })

          await supabase
            .from('markets')
            .update({ status: 'closed' })
            .eq('id', market.id)

          results.push({ market: market.id, action: 'closed_betting' })
        } else {
          // Already closed on-chain, sync DB
          await supabase
            .from('markets')
            .update({ status: 'closed' })
            .eq('id', market.id)

          results.push({ market: market.id, action: 'synced_closed_status' })
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown'
        results.push({ market: market.id, action: 'close_betting', error: msg })
      }
    }

    // 2. Resolve markets past endDate that are closed but not resolved
    const { data: marketsToResolve } = await supabase
      .from('markets')
      .select('*')
      .in('status', ['active', 'closed'])
      .lte('end_date', now.toISOString())

    for (const market of marketsToResolve ?? []) {
      try {
        // Check if already resolved on-chain
        const isResolved = await publicClient.readContract({
          address: market.contract_address as Address,
          abi: MARKET_ABI,
          functionName: 'resolved',
        })

        if (isResolved) {
          // Sync DB
          const outcome = await publicClient.readContract({
            address: market.contract_address as Address,
            abi: MARKET_ABI,
            functionName: 'outcome',
          })

          await supabase
            .from('markets')
            .update({ status: 'resolved', outcome: Number(outcome) })
            .eq('id', market.id)

          results.push({ market: market.id, action: 'synced_resolved_status' })
          continue
        }

        // Ensure betting is closed first
        const isClosed = await publicClient.readContract({
          address: market.contract_address as Address,
          abi: MARKET_ABI,
          functionName: 'bettingClosed',
        })

        if (!isClosed) {
          const walletClient = getWalletClient()
          const hash = await walletClient.writeContract({
            address: market.contract_address as Address,
            abi: MARKET_ABI,
            functionName: 'closeBetting',
          })
          await publicClient.waitForTransactionReceipt({ hash })
        }

        // Fetch close price
        const closePrice = await getClosePrice(market.currency_pair)
        const openingPrice = market.opening_price ?? closePrice

        // Determine outcome: UP if close > open, DOWN otherwise
        // On-chain enum: 1 = UP, 2 = DOWN
        const outcome = closePrice > openingPrice ? 1 : 2

        const walletClient = getWalletClient()
        const hash = await walletClient.writeContract({
          address: market.contract_address as Address,
          abi: MARKET_ABI,
          functionName: 'resolve',
          args: [
            outcome,
            priceToOnChain(openingPrice),
            priceToOnChain(closePrice),
            `open.er-api.com/${new Date().toISOString().slice(0, 10)}`,
          ],
        })
        await publicClient.waitForTransactionReceipt({ hash })

        // Update database
        await supabase
          .from('markets')
          .update({
            status: 'resolved',
            outcome,
            closing_price: closePrice,
          })
          .eq('id', market.id)

        results.push({ market: market.id, action: 'resolved' })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown'
        results.push({ market: market.id, action: 'resolve', error: msg })
      }
    }

    return NextResponse.json({ results, timestamp: now.toISOString() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
