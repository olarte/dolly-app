'use client'

import { formatMultiplier, formatPool } from '@/lib/utils'
import { UI } from '@/lib/strings'

interface MultiplierData {
  multiplier: number
  pool: number
}

interface MultiplierCardsProps {
  sube: MultiplierData
  baja: MultiplierData
}

export default function MultiplierCards({ sube, baja }: MultiplierCardsProps) {
  return (
    <div className="flex gap-3 mt-5">
      {/* SUBE Card */}
      <div className="flex-1 bg-sube-bg rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-sube-green">
          {UI.market.sube} ↗
        </p>
        <p className="text-[42px] font-bold text-sube-green tabular-nums mt-1 leading-none">
          {formatMultiplier(sube.multiplier)}
        </p>
        <p className="text-xs text-text-muted mt-2 tabular-nums">
          {UI.market.pool}: {formatPool(sube.pool)}
        </p>
      </div>

      {/* BAJA Card */}
      <div className="flex-1 bg-baja-bg rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-baja-red">
          {UI.market.baja} ↘
        </p>
        <p className="text-[42px] font-bold text-baja-red tabular-nums mt-1 leading-none">
          {formatMultiplier(baja.multiplier)}
        </p>
        <p className="text-xs text-text-muted mt-2 tabular-nums">
          {UI.market.pool}: {formatPool(baja.pool)}
        </p>
      </div>
    </div>
  )
}
