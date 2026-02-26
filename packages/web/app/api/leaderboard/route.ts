import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getTier, TIER_THRESHOLDS } from '@/lib/xp'

export async function GET(request: NextRequest) {
  const userAddress = request.nextUrl.searchParams.get('user')?.toLowerCase()
  const weekly = request.nextUrl.searchParams.get('weekly') === 'true'

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    // Build XP aggregation query
    let query = supabase
      .from('xp_ledger')
      .select('user_address, amount')

    // Weekly filter: only XP from the last 7 days
    if (weekly) {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('created_at', weekAgo.toISOString())
    }

    const { data: ledger, error } = await query

    if (error) throw error

    // Aggregate XP per user
    const xpMap = new Map<string, number>()
    for (const entry of ledger ?? []) {
      const current = xpMap.get(entry.user_address) ?? 0
      xpMap.set(entry.user_address, current + entry.amount)
    }

    // Sort by XP descending
    const ranked = Array.from(xpMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([address, xp], i) => ({
        rank: i + 1,
        address,
        xp,
        tier: getTier(xp).name,
      }))

    // Enrich with user profiles
    const addresses = ranked.map((r) => r.address)
    const { data: users } = addresses.length > 0
      ? await supabase.from('users').select('*').in('address', addresses)
      : { data: [] }

    const userMap = new Map(users?.map((u) => [u.address, u]) ?? [])

    const enriched = ranked.map((r) => {
      const profile = userMap.get(r.address)
      return {
        ...r,
        name: profile?.username ?? `@${r.address.slice(0, 6)}`,
        flag: getFlagForCountry(profile?.country_code ?? 'CO'),
        bets: 0, // Could count from xp_ledger WAGER entries
      }
    })

    // Count bets per user
    if (addresses.length > 0) {
      const { data: betCounts } = await supabase
        .from('xp_ledger')
        .select('user_address')
        .eq('reason', 'WAGER')
        .in('user_address', addresses)

      const betMap = new Map<string, number>()
      for (const b of betCounts ?? []) {
        betMap.set(b.user_address, (betMap.get(b.user_address) ?? 0) + 1)
      }
      for (const e of enriched) {
        e.bets = betMap.get(e.address) ?? 0
      }
    }

    // Group by tier
    const topThree = enriched.slice(0, 3)
    const goats = enriched.filter((u) => u.xp >= TIER_THRESHOLDS[4].minXp)
    const diamond = enriched.filter(
      (u) => u.xp >= TIER_THRESHOLDS[3].minXp && u.xp < TIER_THRESHOLDS[4].minXp
    )

    // Current user's XP
    let userXp = 0
    let userTier = 'Bronze'
    if (userAddress) {
      userXp = xpMap.get(userAddress) ?? 0
      userTier = getTier(userXp).name
    }

    return NextResponse.json({
      userXp,
      userTier,
      topThree,
      goats: goats.slice(3), // exclude top 3
      diamond,
      total: enriched.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function getFlagForCountry(code: string): string {
  const flags: Record<string, string> = {
    CO: '🇨🇴',
    NG: '🇳🇬',
    EG: '🇪🇬',
    KE: '🇰🇪',
    AR: '🇦🇷',
    US: '🇺🇸',
  }
  return flags[code] ?? '🌍'
}
