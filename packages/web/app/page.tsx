'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import LivePrice from '@/components/home/LivePrice'
import CountdownTimer from '@/components/home/CountdownTimer'
import DailyMarketCard from '@/components/home/DailyMarketCard'
import MultiplierCards from '@/components/home/MultiplierCards'
import MarketCarousel from '@/components/home/MarketCarousel'
import DepositModal from '@/components/shared/DepositModal'
import StablecoinSelector from '@/components/shared/StablecoinSelector'
import PullToRefresh from '@/components/shared/PullToRefresh'
import { SkeletonLivePrice, SkeletonMultiplierCards } from '@/components/shared/Skeleton'
import EmptyState from '@/components/shared/EmptyState'
import { useMockMarketData, type CarouselMarket } from '@/hooks/useMockMarketData'
import { usePrice } from '@/hooks/usePrice'
import { useMarket, useMarketList } from '@/hooks/useMarket'
import { useDollyStore } from '@/lib/store'
import { CURRENCIES } from '@/lib/currencies'
import { UI } from '@/lib/strings'

interface APIMarketInfo {
  address: string
  totalUp: number
  totalDown: number
  totalPool: number
  multiplierUp: number
  multiplierDown: number
  outcome: number
  resolved: boolean
  bettingClosed: boolean
  bettingCloseTime: string
  openingPrice: number | null
  marketType: number
  status: string
}

const MARKET_TYPE_LABELS: Record<number, string> = {
  0: UI.marketType.daily,
  1: UI.marketType.weekly,
  2: UI.marketType.monthly,
}

function formatMarketDate(bettingCloseTime: string): string {
  const d = new Date(bettingCloseTime)
  const month = d.toLocaleString('en', { month: 'short' }).toUpperCase()
  const day = d.getDate()
  return `${month}${day}`
}

export default function HomePage() {
  const mockData = useMockMarketData()
  const { currencyCode, openDepositModal } = useDollyStore()
  const currency = CURRENCIES[currencyCode]
  const queryClient = useQueryClient()
  const currencyShort = currencyCode || 'COP'

  // Live price from API
  const livePrice = usePrice(currency?.pair ?? 'USD/COP')

  // Try to get live markets from factory
  const { markets: liveMarkets } = useMarketList(currency?.pair ?? 'USD/COP')
  const dailyMarketAddress = liveMarkets.length > 0 ? liveMarkets[0] : undefined
  const liveMarket = useMarket(dailyMarketAddress)

  // Fetch enriched market data from API (includes marketType from DB)
  const { data: apiMarkets } = useQuery<APIMarketInfo[]>({
    queryKey: ['apiMarkets', currencyShort],
    queryFn: async () => {
      const res = await fetch(`/api/markets?currency=${encodeURIComponent(currencyShort)}`)
      if (!res.ok) return []
      const json = await res.json()
      return json.markets ?? []
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  // Build carousel markets: real weekly/monthly from API, fallback to mock
  const carouselMarkets: CarouselMarket[] = (() => {
    const liveNonDaily = (apiMarkets ?? [])
      .filter((m) => m.marketType > 0 && m.status === 'active')
      .map((m): CarouselMarket => ({
        id: m.address,
        type: MARKET_TYPE_LABELS[m.marketType] ?? 'SEMANAL',
        sube: m.multiplierUp,
        baja: m.multiplierDown,
        date: formatMarketDate(m.bettingCloseTime),
        marketType: m.marketType,
      }))

    if (liveNonDaily.length > 0) return liveNonDaily
    return mockData.markets
  })()

  // Use live data if available, else fall back to mock
  const hasLiveData = !liveMarket.isLoading && dailyMarketAddress && liveMarket.totalPool > 0
  const sube = hasLiveData
    ? { multiplier: liveMarket.multiplierUp, pool: liveMarket.totalUp }
    : mockData.sube
  const baja = hasLiveData
    ? { multiplier: liveMarket.multiplierDown, pool: liveMarket.totalDown }
    : mockData.baja
  const targetTime = hasLiveData ? liveMarket.bettingCloseTime : mockData.targetTime

  // Use live price if available, else mock
  const price = livePrice.price > 0 ? livePrice.price : mockData.price
  const priceUp = livePrice.price > 0 ? livePrice.direction === 'up' : mockData.priceUp
  const openingPrice = livePrice.openingPrice > 0 ? livePrice.openingPrice : mockData.openingPrice
  const marketOpen = livePrice.marketOpen

  const handleSubeClick = () => {
    if (dailyMarketAddress) {
      openDepositModal(dailyMarketAddress, 'sube')
    }
  }
  const handleBajaClick = () => {
    if (dailyMarketAddress) {
      openDepositModal(dailyMarketAddress, 'baja')
    }
  }

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['price'] })
    await queryClient.invalidateQueries({ queryKey: ['apiMarkets'] })
  }, [queryClient])

  return (
    <>
      <Header />

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="px-5 pb-28">
          {livePrice.isLoading && livePrice.price === 0 ? (
            <>
              <SkeletonLivePrice />
              <SkeletonMultiplierCards />
            </>
          ) : (
            <>
              <LivePrice price={price} priceUp={priceUp} marketOpen={marketOpen} />
              <CountdownTimer
                openingPrice={openingPrice}
                priceUp={priceUp}
                targetTime={targetTime}
                marketOpen={marketOpen}
              />
              <DailyMarketCard question={mockData.question} />
              <MultiplierCards
                sube={sube}
                baja={baja}
                onSubeClick={handleSubeClick}
                onBajaClick={handleBajaClick}
              />
              <MarketCarousel markets={carouselMarkets} />
              {!hasLiveData && !liveMarkets.length && (
                <EmptyState message={UI.empty.noMarkets} icon="📊" />
              )}
            </>
          )}
        </main>
      </PullToRefresh>

      <DepositModal />
      <StablecoinSelector />
      <BottomNav />
    </>
  )
}
