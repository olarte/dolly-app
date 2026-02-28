'use client'

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import BackHeader from '@/components/layout/BackHeader'
import BottomNav from '@/components/layout/BottomNav'
import TierProgressBar from '@/components/leaderboard/TierProgressBar'
import TopThreePodium from '@/components/leaderboard/TopThreePodium'
import TierSection from '@/components/leaderboard/TierSection'
import PullToRefresh from '@/components/shared/PullToRefresh'
import ErrorState from '@/components/shared/ErrorState'
import EmptyState from '@/components/shared/EmptyState'
import { SkeletonLeaderboard } from '@/components/shared/Skeleton'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { usePrice } from '@/hooks/usePrice'
import { formatCurrency } from '@/lib/utils'
import { UI } from '@/lib/strings'

export default function LeaderboardPage() {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { userXp, userTier, topThree, goats, diamond, isLoading, isError, refetch } =
    useLeaderboard(address)
  const priceData = usePrice('USD/COP')

  const price = priceData.price > 0 ? formatCurrency(priceData.price) : '$3,648.87'
  const priceUp = priceData.price > 0 ? priceData.direction === 'up' : true

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
      queryClient.invalidateQueries({ queryKey: ['price'] }),
    ])
  }, [queryClient])

  return (
    <>
      <BackHeader price={price} priceUp={priceUp} />

      <PullToRefresh onRefresh={handleRefresh}>
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

          {isLoading ? (
            <SkeletonLeaderboard />
          ) : isError ? (
            <ErrorState message={UI.errors.network} onRetry={() => refetch()} />
          ) : topThree.length === 0 ? (
            <EmptyState message={UI.empty.noPlayers} icon="🏆" />
          ) : (
            <>
              {/* Tier Progress */}
              <TierProgressBar userXp={userXp} userTier={userTier} />

              {/* Top 3 Podium — only render if 3 entries */}
              {topThree.length >= 3 && (
                <TopThreePodium
                  users={topThree as [typeof topThree[0], typeof topThree[1], typeof topThree[2]]}
                />
              )}

              {/* Divider */}
              <div className="mt-8 border-t border-black/[0.06]" />

              {/* GOATS tier */}
              {goats.length > 0 && (
                <TierSection icon="🐐" label="GOATS" users={goats} />
              )}

              {/* DIAMOND tier */}
              {diamond.length > 0 && (
                <TierSection icon="💎" label="DIAMOND" users={diamond} />
              )}
            </>
          )}
        </main>
      </PullToRefresh>

      <BottomNav />
    </>
  )
}
