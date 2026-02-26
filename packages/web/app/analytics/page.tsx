'use client'

import BackHeader from '@/components/layout/BackHeader'
import BottomNav from '@/components/layout/BottomNav'
import PriceChart from '@/components/analytics/PriceChart'
import NewsFeed from '@/components/analytics/NewsFeed'
import { useMockAnalyticsData } from '@/hooks/useMockAnalyticsData'
import { formatCurrency } from '@/lib/utils'
import { UI } from '@/lib/strings'

export default function AnalyticsPage() {
  const data = useMockAnalyticsData()

  return (
    <>
      <BackHeader
        price={formatCurrency(data.price)}
        priceUp={data.priceUp}
      />

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
            <span className="text-sube-green text-lg font-bold">↗</span>
            <span className="text-[34px] font-bold tabular-nums text-text-primary leading-none">
              {formatCurrency(data.price)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[13px] text-text-muted tabular-nums">
              {UI.analytics.opening} {formatCurrency(data.openingPrice)}
            </span>
            <span className="text-[13px] text-sube-green font-semibold tabular-nums">
              {data.changePercent}
            </span>
          </div>
        </section>

        {/* Price Chart */}
        <PriceChart data={data.priceHistory} volume="$89M" />

        {/* News Feed */}
        <NewsFeed news={data.news} />
      </main>

      <BottomNav />
    </>
  )
}
