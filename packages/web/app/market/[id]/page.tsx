'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import BackHeader from '@/components/layout/BackHeader'
import BottomNav from '@/components/layout/BottomNav'
import MarketHeader from '@/components/market/MarketHeader'
import ProbabilityChart from '@/components/market/ProbabilityChart'
import MultiplierCards from '@/components/home/MultiplierCards'
import RulesSection from '@/components/market/RulesSection'
import HoldersTab from '@/components/market/HoldersTab'
import ActivityTab from '@/components/market/ActivityTab'
import { useMockMarketDetail } from '@/hooks/useMockMarketDetail'
import { formatCurrency } from '@/lib/utils'
import { UI } from '@/lib/strings'

export default function MarketDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'monthly-1'
  const data = useMockMarketDetail(id)
  const [activeTab, setActiveTab] = useState<'holders' | 'activity'>('holders')

  return (
    <>
      <BackHeader
        price={formatCurrency(data.price)}
        priceUp={data.priceUp}
      />

      <main className="px-5 pb-28">
        {/* Market Type Badge */}
        <MarketHeader
          icon={data.icon}
          typeLabel={data.typeLabel}
          dateLabel={data.dateLabel}
        />

        {/* Market Question */}
        <h1 className="text-[22px] font-bold text-text-primary leading-tight mt-4">
          {data.question}
        </h1>

        {/* Reference Price */}
        <p className="text-[13px] text-text-muted mt-1.5">
          {data.referenceLabel}:{' '}
          <span className={data.referencePriceUp ? 'text-sube-green' : 'text-baja-red'}>
            {data.referencePriceUp ? '↗' : '↘'}
          </span>
          <span className="font-semibold text-text-secondary tabular-nums">
            {formatCurrency(data.referencePrice)}
          </span>
        </p>

        {/* Probability Chart */}
        <ProbabilityChart
          data={data.probabilityData}
          subePercent={data.subePercent}
          bajaPercent={data.bajaPercent}
          volume={data.volume}
        />

        {/* SUBE / BAJA Multiplier Cards — reuse home component */}
        <MultiplierCards sube={data.sube} baja={data.baja} />

        {/* Rules Section */}
        <RulesSection rules={data.rules} />

        {/* Holders / Activity Tabs */}
        <section className="mt-8 mb-4">
          <div className="flex border-b border-black/10">
            <button
              onClick={() => setActiveTab('holders')}
              className={`flex-1 py-3 text-[13px] font-bold tracking-wider transition-colors ${
                activeTab === 'holders'
                  ? 'text-text-primary border-b-2 border-text-primary'
                  : 'text-text-muted'
              }`}
            >
              {UI.market.holders}
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-3 text-[13px] font-bold tracking-wider transition-colors ${
                activeTab === 'activity'
                  ? 'text-text-primary border-b-2 border-text-primary'
                  : 'text-text-muted'
              }`}
            >
              {UI.market.activity}
            </button>
          </div>

          {activeTab === 'holders' ? (
            <HoldersTab holders={data.holders} />
          ) : (
            <ActivityTab activity={data.activity} />
          )}
        </section>
      </main>

      <BottomNav />
    </>
  )
}
