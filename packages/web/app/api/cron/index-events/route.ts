import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { supabase } from '@/lib/supabase'
import { publicClient } from '@/lib/viem-server'
import { MARKET_ABI } from '@/lib/contracts'
import { calculateWagerXp, calculateWinBonusXp, normalizeToWei } from '@/lib/xp'
import { parseAbiItem, type Address } from 'viem'

const MAX_BLOCKS_PER_RUN = 2000

// Deposited(address indexed user, uint8 side, address token, uint256 amount)
const DEPOSITED_EVENT = parseAbiItem(
  'event Deposited(address indexed user, uint8 side, address token, uint256 amount)'
)

// Claimed(address indexed user, address token, uint256 payout)
const CLAIMED_EVENT = parseAbiItem(
  'event Claimed(address indexed user, address token, uint256 payout)'
)

export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    // Get all active/closed market contracts to index
    const { data: markets } = await supabase
      .from('markets')
      .select('id, contract_address')

    if (!markets || markets.length === 0) {
      return NextResponse.json({ message: 'No markets to index', processed: 0 })
    }

    const currentBlock = await publicClient.getBlockNumber()
    let totalProcessed = 0

    for (const market of markets) {
      const addr = market.contract_address as Address

      // Get last indexed block for this contract
      const { data: state } = await supabase
        .from('indexer_state')
        .select('last_block')
        .eq('contract_address', addr)
        .single()

      const fromBlock = BigInt((state?.last_block ?? 0) + 1)
      const toBlock = fromBlock + BigInt(MAX_BLOCKS_PER_RUN) > currentBlock
        ? currentBlock
        : fromBlock + BigInt(MAX_BLOCKS_PER_RUN)

      if (fromBlock > currentBlock) continue

      // Fetch Deposited events
      const depositLogs = await publicClient.getLogs({
        address: addr,
        event: DEPOSITED_EVENT,
        fromBlock,
        toBlock,
      })

      for (const log of depositLogs) {
        if (!log.args.user || !log.args.token || !log.args.amount) continue

        const normalized = normalizeToWei(log.args.amount, log.args.token)
        const xp = calculateWagerXp(normalized)

        if (xp > 0) {
          await supabase.from('xp_ledger').upsert(
            {
              user_address: log.args.user.toLowerCase(),
              amount: xp,
              reason: 'WAGER',
              market_id: addr.toLowerCase(),
              tx_hash: log.transactionHash,
            },
            { onConflict: 'tx_hash,reason' }
          )

          // Ensure user exists
          await supabase.from('users').upsert(
            { address: log.args.user.toLowerCase() },
            { onConflict: 'address', ignoreDuplicates: true }
          )

          totalProcessed++
        }
      }

      // Fetch Claimed events
      const claimLogs = await publicClient.getLogs({
        address: addr,
        event: CLAIMED_EVENT,
        fromBlock,
        toBlock,
      })

      for (const log of claimLogs) {
        if (!log.args.user || !log.args.payout) continue

        // For WIN_BONUS, we need the user's original wager XP
        // Look it up from the WAGER entry for this market
        const { data: wagerEntry } = await supabase
          .from('xp_ledger')
          .select('amount')
          .eq('user_address', log.args.user.toLowerCase())
          .eq('market_id', addr.toLowerCase())
          .eq('reason', 'WAGER')
          .single()

        const wagerXp = wagerEntry?.amount ?? 0
        const bonusXp = calculateWinBonusXp(wagerXp)

        if (bonusXp > 0) {
          await supabase.from('xp_ledger').upsert(
            {
              user_address: log.args.user.toLowerCase(),
              amount: bonusXp,
              reason: 'WIN_BONUS',
              market_id: addr.toLowerCase(),
              tx_hash: log.transactionHash,
            },
            { onConflict: 'tx_hash,reason' }
          )

          totalProcessed++
        }
      }

      // Update indexer state
      await supabase.from('indexer_state').upsert({
        contract_address: addr,
        last_block: Number(toBlock),
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      processed: totalProcessed,
      currentBlock: Number(currentBlock),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
