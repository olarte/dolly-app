'use client'

import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import LivePrice from '@/components/home/LivePrice'
import CountdownTimer from '@/components/home/CountdownTimer'
import DailyMarketCard from '@/components/home/DailyMarketCard'
import MultiplierCards from '@/components/home/MultiplierCards'
import MarketCarousel from '@/components/home/MarketCarousel'
import { useMockMarketData } from '@/hooks/useMockMarketData'

export default function HomePage() {
  const data = useMockMarketData()

  return (
    <>
      <Header />

      <main className="px-5 pb-28">
        <LivePrice price={data.price} priceUp={data.priceUp} />
        <CountdownTimer
          openingPrice={data.openingPrice}
          priceUp={data.priceUp}
          targetTime={data.targetTime}
        />
        <DailyMarketCard question={data.question} />
        <MultiplierCards sube={data.sube} baja={data.baja} />
        <MarketCarousel markets={data.markets} />
      </main>

      <BottomNav />
    </>
  )
}
