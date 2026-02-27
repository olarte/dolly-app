'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import BackHeader from '@/components/layout/BackHeader'
import BottomNav from '@/components/layout/BottomNav'
import PriceChart from '@/components/analytics/PriceChart'
import NewsFeed from '@/components/analytics/NewsFeed'
import PullToRefresh from '@/components/shared/PullToRefresh'
import ErrorState from '@/components/shared/ErrorState'
import EmptyState from '@/components/shared/EmptyState'
import { SkeletonChart, SkeletonNewsFeed } from '@/components/shared/Skeleton'
import { usePrice, usePriceHistory } from '@/hooks/usePrice'
import { useNews } from '@/hooks/useNews'
import { useMockAnalyticsData } from '@/hooks/useMockAnalyticsData'
import { formatCurrency } from '@/lib/utils'
import { UI } from '@/lib/strings'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('1D')
  const queryClient = useQueryClient()
  const mockData = useMockAnalyticsData()

  // Live data hooks
  const priceData = usePrice('USD/COP')
  const historyData = usePriceHistory('USD/COP', period)
  const newsData = useNews('CO')

  // Use live price or fall back to mock
  const price = priceData.price > 0 ? priceData.price : mockData.price
  const priceUp = priceData.price > 0 ? priceData.priceUp : mockData.priceUp
  const openingPrice = priceData.openingPrice > 0 ? priceData.openingPrice : mockData.openingPrice
  const changePercent = priceData.price > 0 ? priceData.changePercent : mockData.changePercent

  // Use live history or mock
  const chartData = historyData.data.length > 0 ? historyData.data : mockData.priceHistory

  // Use live news or mock
  const news = newsData.news.length > 0 ? newsData.news : mockData.news

  const allError = priceData.isError && historyData.isError && newsData.isError

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['price'] }),
      queryClient.invalidateQueries({ queryKey: ['priceHistory'] }),
      queryClient.invalidateQueries({ queryKey: ['news'] }),
    ])
  }, [queryClient])

  const handleRangeChange = useCallback((range: string) => {
    setPeriod(range)
  }, [])

  if (allError) {
    return (
      <>
        <BackHeader price={formatCurrency(mockData.price)} priceUp={mockData.priceUp} />
        <main className="px-5 pb-28">
          <ErrorState
            message={UI.errors.network}
            onRetry={() => {
              priceData.refetch()
            }}
          />
        </main>
        <BottomNav />
      </>
    )
  }

  return (
    <>
      <BackHeader
        price={formatCurrency(price)}
        priceUp={priceUp}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="px-5 pb-28">
          {/* Title */}
          <section className="mt-2">
            <p className="text-xs font-semibold text-text-secondary tracking-wider text-center">
              {UI.analytics.title}
            </p>
          </section>

          {/* Live Price */}
          <section className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-lg font-bold ${priceUp ? 'text-sube-green' : 'text-baja-red'}`}>
                {priceUp ? '↗' : '↘'}
              </span>
              <span className="text-[34px] font-bold tabular-nums text-text-primary leading-none">
                {formatCurrency(price)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[13px] text-text-muted tabular-nums">
                {UI.analytics.opening} {formatCurrency(openingPrice)}
              </span>
              <span className={`text-[13px] font-semibold tabular-nums ${priceUp ? 'text-sube-green' : 'text-baja-red'}`}>
                {changePercent}
              </span>
            </div>
          </section>

          {/* Price Chart */}
          {historyData.isLoading && historyData.data.length === 0 ? (
            <SkeletonChart />
          ) : (
            <PriceChart
              data={chartData}
              volume="$89M"
              onRangeChange={handleRangeChange}
              isLoading={historyData.isLoading}
            />
          )}

          {/* News Feed */}
          {newsData.isLoading && newsData.news.length === 0 ? (
            <SkeletonNewsFeed />
          ) : news.length === 0 ? (
            <EmptyState message={UI.empty.noNews} icon="📰" />
          ) : (
            <NewsFeed news={news} />
          )}
        </main>
      </PullToRefresh>

      <BottomNav />
    </>
  )
}
