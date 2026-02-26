'use client'

import Link from 'next/link'
import { UI } from '@/lib/strings'
import type { CarouselMarket } from '@/hooks/useMockMarketData'

interface MarketCarouselProps {
  markets: CarouselMarket[]
}

export default function MarketCarousel({ markets }: MarketCarouselProps) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-medium text-text-secondary tracking-widest uppercase text-center mb-4">
        {UI.home.markets}
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
        {markets.map((market) => (
          <Link
            key={market.id}
            href={`/market/${market.id}`}
            className="min-w-[130px] bg-white/90 rounded-2xl p-4 shadow-card flex-shrink-0 block"
          >
            <p className="text-xs font-bold text-text-primary">
              {market.type}
            </p>
            {/* Mini icon placeholder */}
            <div className="flex justify-center my-3">
              <div className="w-10 h-10 rounded-full bg-bg-gradient-start/40 flex items-center justify-center">
                <span className="text-lg">
                  {market.type === 'SEMANAL' ? '📈' : market.type === 'MENSUAL' ? '📊' : '🗳️'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs tabular-nums">
              <span className="text-sube-green font-bold">{market.sube.toFixed(2)}x</span>
              <span className="text-text-muted">/</span>
              <span className="text-baja-red font-bold">{market.baja.toFixed(2)}x</span>
            </div>
            <p className="text-[10px] text-text-muted mt-2 text-center flex items-center justify-center gap-1">
              <span>⏱</span> {market.date}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
