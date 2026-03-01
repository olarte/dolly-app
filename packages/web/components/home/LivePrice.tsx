'use client'

import { formatCurrency } from '@/lib/utils'
import { UI } from '@/lib/strings'

interface LivePriceProps {
  price: number
  priceUp: boolean
  marketOpen?: boolean
}

export default function LivePrice({ price, priceUp, marketOpen = true }: LivePriceProps) {
  const arrow = priceUp ? '↗' : '↘'
  const color = marketOpen
    ? (priceUp ? 'text-sube-green' : 'text-baja-red')
    : 'text-text-secondary'

  return (
    <div className="text-center mt-4">
      <p className="text-xs font-medium text-text-secondary tracking-widest uppercase">
        {marketOpen ? UI.home.livePrice : UI.home.lastClose}
      </p>
      <p className={`text-[34px] font-bold tabular-nums mt-1 ${color}`}>
        {marketOpen && <span className="text-lg align-middle">{arrow}</span>}
        {formatCurrency(price)}
      </p>
    </div>
  )
}
