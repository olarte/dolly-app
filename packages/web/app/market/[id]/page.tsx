'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import dynamic from 'next/dynamic'
import BackHeader from '@/components/layout/BackHeader'
import BottomNav from '@/components/layout/BottomNav'
import MarketHeader from '@/components/market/MarketHeader'
import MultiplierCards from '@/components/home/MultiplierCards'

const ProbabilityChart = dynamic(() => import('@/components/market/ProbabilityChart'), {
  ssr: false,
  loading: () => <div className="h-[200px] mt-6 rounded-2xl bg-white/60 animate-pulse" />,
})
import RulesSection from '@/components/market/RulesSection'
import HoldersTab from '@/components/market/HoldersTab'
import ActivityTab from '@/components/market/ActivityTab'
import DepositModal from '@/components/shared/DepositModal'
import StablecoinSelector from '@/components/shared/StablecoinSelector'
import TransactionStatus from '@/components/shared/TransactionStatus'
import { useMockMarketDetail } from '@/hooks/useMockMarketDetail'
import { useMarket, useUserDeposit, type MarketOutcome } from '@/hooks/useMarket'
import { usePrice } from '@/hooks/usePrice'
import { useClaim } from '@/hooks/useClaim'
import { useDollyStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { UI } from '@/lib/strings'
import type { Address } from 'viem'

export default function MarketDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'monthly-1'
  const { address } = useAccount()

  // Determine if id is a contract address (0x...) or mock id
  const isContractAddress = id.startsWith('0x') && id.length === 42
  const marketAddress = isContractAddress ? (id as Address) : undefined

  // Live data from contract
  const liveMarket = useMarket(marketAddress)
  const userDeposit = useUserDeposit(marketAddress, address)
  const { claim, status: claimStatus, error: claimError, txHash: claimTxHash, reset: resetClaim } = useClaim(
    marketAddress ?? ('0x0000000000000000000000000000000000000000' as Address)
  )

  // Live price from API
  const livePrice = usePrice('USD/COP')

  // Mock data fallback
  const mockData = useMockMarketDetail(id)

  // Use live data if this is a contract address and we have data
  const hasLiveData = isContractAddress && !liveMarket.isLoading && liveMarket.totalPool > 0
  const sube = hasLiveData
    ? { multiplier: liveMarket.multiplierUp, pool: liveMarket.totalUp }
    : mockData.sube
  const baja = hasLiveData
    ? { multiplier: liveMarket.multiplierDown, pool: liveMarket.totalDown }
    : mockData.baja
  const subePercent = hasLiveData ? liveMarket.subePercent : mockData.subePercent
  const bajaPercent = hasLiveData ? liveMarket.bajaPercent : mockData.bajaPercent

  const [activeTab, setActiveTab] = useState<'holders' | 'activity'>('holders')
  const { openDepositModal } = useDollyStore()

  const handleSubeClick = () => {
    if (marketAddress) {
      openDepositModal(marketAddress, 'sube')
    }
  }
  const handleBajaClick = () => {
    if (marketAddress) {
      openDepositModal(marketAddress, 'baja')
    }
  }

  // Claim logic
  const isResolved = hasLiveData ? liveMarket.resolved : false
  const outcome: MarketOutcome = hasLiveData ? liveMarket.outcome : 0
  const hasDeposit = userDeposit.side !== null
  const isWinner =
    isResolved &&
    hasDeposit &&
    ((outcome === 1 && userDeposit.side === 'sube') ||
      (outcome === 2 && userDeposit.side === 'baja'))
  const canClaim = isWinner && !userDeposit.hasClaimed

  return (
    <>
      <BackHeader
        price={livePrice.price > 0 ? formatCurrency(livePrice.price) : formatCurrency(mockData.price)}
        priceUp={livePrice.price > 0 ? livePrice.direction === 'up' : mockData.priceUp}
      />

      <main className="px-5 pb-28">
        {/* Market Type Badge */}
        <MarketHeader
          icon={mockData.icon}
          typeLabel={mockData.typeLabel}
          dateLabel={mockData.dateLabel}
        />

        {/* Market Question */}
        <h1 className="text-[22px] font-bold text-text-primary leading-tight mt-4">
          {mockData.question}
        </h1>

        {/* Reference Price */}
        <p className="text-[13px] text-text-muted mt-1.5">
          {mockData.referenceLabel}:{' '}
          <span className={mockData.referencePriceUp ? 'text-sube-green' : 'text-baja-red'}>
            {mockData.referencePriceUp ? '↗' : '↘'}
          </span>
          <span className="font-semibold text-text-secondary tabular-nums">
            {formatCurrency(mockData.referencePrice)}
          </span>
        </p>

        {/* Probability Chart */}
        <ProbabilityChart
          data={mockData.probabilityData}
          subePercent={Math.round(subePercent)}
          bajaPercent={Math.round(bajaPercent)}
          volume={mockData.volume}
        />

        {/* SUBE / BAJA Multiplier Cards — clickable for deposit */}
        <MultiplierCards
          sube={sube}
          baja={baja}
          onSubeClick={!liveMarket.bettingClosed ? handleSubeClick : undefined}
          onBajaClick={!liveMarket.bettingClosed ? handleBajaClick : undefined}
        />

        {/* User deposit + Claim section */}
        {hasDeposit && (
          <section className="mt-5 p-4 rounded-2xl bg-white/80 shadow-card">
            <p className="text-xs font-medium text-text-muted mb-1">
              {UI.deposit.yourDeposit}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  userDeposit.side === 'sube' ? 'bg-sube-bg text-sube-green' : 'bg-baja-bg text-baja-red'
                }`}>
                  {userDeposit.side === 'sube' ? UI.market.sube : UI.market.baja}
                </span>
                <span className="text-base font-bold tabular-nums">
                  ${userDeposit.normalizedAmount.toFixed(2)}
                </span>
              </div>

              {canClaim && (
                <button
                  onClick={claim}
                  disabled={claimStatus === 'claiming'}
                  className="px-5 py-2 rounded-xl bg-sube-green text-white text-sm font-bold hover:bg-sube-green/90 transition-colors disabled:opacity-50"
                >
                  {claimStatus === 'claiming'
                    ? UI.deposit.claiming
                    : UI.deposit.claim}
                </button>
              )}

              {isResolved && !isWinner && hasDeposit && (
                <span className="text-sm font-medium text-baja-red">
                  {UI.deposit.lost}
                </span>
              )}

              {userDeposit.hasClaimed && (
                <span className="text-sm font-medium text-sube-green">
                  {UI.deposit.won}
                </span>
              )}
            </div>
          </section>
        )}

        {/* Rules Section */}
        <RulesSection rules={mockData.rules} />

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
            <HoldersTab holders={mockData.holders} />
          ) : (
            <ActivityTab activity={mockData.activity} />
          )}
        </section>
      </main>

      {/* Claim transaction toast */}
      {claimStatus !== 'idle' && (
        <TransactionStatus
          status={claimStatus}
          error={claimError}
          txHash={claimTxHash}
          onDismiss={resetClaim}
          successMessage={UI.deposit.claimSuccess}
        />
      )}

      <DepositModal />
      <StablecoinSelector />
      <BottomNav />
    </>
  )
}
