import { UI } from '@/lib/strings'
import type { HolderRow } from '@/hooks/useMockMarketDetail'

interface HoldersTabProps {
  holders: HolderRow[]
}

export default function HoldersTab({ holders }: HoldersTabProps) {
  return (
    <div className="mt-4">
      {/* Table header */}
      <div className="grid grid-cols-3 text-[11px] text-text-muted font-semibold tracking-wider pb-2 border-b border-black/5">
        <span>Resultado</span>
        <span className="text-center">{UI.market.holders}</span>
        <span className="text-right">Porcentaje</span>
      </div>

      {/* Rows */}
      {holders.map((row) => (
        <div
          key={row.side}
          className="grid grid-cols-3 items-center py-3 border-b border-black/5 last:border-0"
        >
          <span
            className={`text-sm font-bold ${
              row.side === 'sube' ? 'text-sube-green' : 'text-baja-red'
            }`}
          >
            {row.side === 'sube' ? UI.market.sube : UI.market.baja}
          </span>
          <span className="text-sm text-text-primary tabular-nums text-center">
            {row.holders}
          </span>
          <span className="text-sm text-text-muted tabular-nums text-right">
            {row.percentage}%
          </span>
        </div>
      ))}
    </div>
  )
}
