'use client'

import { formatCurrency } from '@/lib/utils'
import { UI } from '@/lib/strings'

interface LivePriceProps {
  price: number
  priceUp: boolean
}

export default function LivePrice({ price, priceUp }: LivePriceProps) {
  const arrow = priceUp ? '↗' : '↘'
  const color = priceUp ? 'text-sube-green' : 'text-baja-red'

  return (
    <div className="text-center mt-4">
      <p className="text-xs font-medium text-text-secondary tracking-widest uppercase">
        {UI.home.livePrice}
      </p>
      <p className={`text-[34px] font-bold tabular-nums mt-1 ${color}`}>
        <span className="text-lg align-middle">{arrow}</span>
        {formatCurrency(price)}
      </p>
    </div>
  )
}
