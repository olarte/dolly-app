'use client'

import BackHeader from '@/components/layout/BackHeader'
import BottomNav from '@/components/layout/BottomNav'
import TierProgressBar from '@/components/leaderboard/TierProgressBar'
import TopThreePodium from '@/components/leaderboard/TopThreePodium'
import TierSection from '@/components/leaderboard/TierSection'
import { useMockLeaderboardData } from '@/hooks/useMockLeaderboardData'
import { UI } from '@/lib/strings'

export default function LeaderboardPage() {
  const { userXp, userTier, topThree, goats, diamond } = useMockLeaderboardData()

  return (
    <>
      <BackHeader price="$3,648.87" priceUp />

      <main className="px-5 pb-28">
        {/* Title + Illustration */}
        <section className="mt-1 text-center">
          <div className="text-[40px] leading-none mb-2 select-none">
            🏆💰🎯
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-wide">
            {UI.leaderboard.title}
          </h1>
        </section>

        {/* Tier Progress */}
        <TierProgressBar userXp={userXp} userTier={userTier} />

        {/* Top 3 Podium */}
        <TopThreePodium users={topThree} />

        {/* Divider */}
        <div className="mt-8 border-t border-black/[0.06]" />

        {/* GOATS tier */}
        <TierSection icon="🐐" label="GOATS" users={goats} />

        {/* DIAMOND tier */}
        <TierSection icon="💎" label="DIAMOND" users={diamond} />
      </main>

      <BottomNav />
    </>
  )
}
