'use client'

import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import LivePrice from '@/components/home/LivePrice'
import CountdownTimer from '@/components/home/CountdownTimer'
import DailyMarketCard from '@/components/home/DailyMarketCard'
import MultiplierCards from '@/components/home/MultiplierCards'
import MarketCarousel from '@/components/home/MarketCarousel'
import DepositModal from '@/components/shared/DepositModal'
import StablecoinSelector from '@/components/shared/StablecoinSelector'
import { useMockMarketData } from '@/hooks/useMockMarketData'
import { useMarket, useMarketList } from '@/hooks/useMarket'
import { useDollyStore } from '@/lib/store'
import { CURRENCIES } from '@/lib/currencies'

export default function HomePage() {
  const mockData = useMockMarketData()
  const { currencyCode, openDepositModal } = useDollyStore()
  const currency = CURRENCIES[currencyCode]

  // Try to get live markets from factory
  const { markets: liveMarkets } = useMarketList(currency?.pair ?? 'USD/COP')
  const dailyMarketAddress = liveMarkets.length > 0 ? liveMarkets[0] : undefined
  const liveMarket = useMarket(dailyMarketAddress)

  // Use live data if available, else fall back to mock
  const hasLiveData = !liveMarket.isLoading && dailyMarketAddress && liveMarket.totalPool > 0
  const sube = hasLiveData
    ? { multiplier: liveMarket.multiplierUp, pool: liveMarket.totalUp }
    : mockData.sube
  const baja = hasLiveData
    ? { multiplier: liveMarket.multiplierDown, pool: liveMarket.totalDown }
    : mockData.baja
  const targetTime = hasLiveData ? liveMarket.bettingCloseTime : mockData.targetTime

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

  return (
    <>
      <Header />

      <main className="px-5 pb-28">
        <LivePrice price={mockData.price} priceUp={mockData.priceUp} />
        <CountdownTimer
          openingPrice={mockData.openingPrice}
          priceUp={mockData.priceUp}
          targetTime={targetTime}
        />
        <DailyMarketCard question={mockData.question} />
        <MultiplierCards
          sube={sube}
          baja={baja}
          onSubeClick={handleSubeClick}
          onBajaClick={handleBajaClick}
        />
        <MarketCarousel markets={mockData.markets} />
      </main>

      <DepositModal />
      <StablecoinSelector />
      <BottomNav />
    </>
  )
}
