import { UI } from '@/lib/strings'
import type { ActivityItem } from '@/hooks/useMockMarketDetail'

interface ActivityTabProps {
  activity: ActivityItem[]
}

export default function ActivityTab({ activity }: ActivityTabProps) {
  return (
    <div className="mt-3">
      {activity.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between py-3 border-b border-black/5 last:border-0"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center">
              <span className="text-[10px] font-medium text-text-muted">
                {item.address.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-primary">
                {item.address}
              </p>
              <p
                className={`text-[11px] font-bold ${
                  item.side === 'sube' ? 'text-sube-green' : 'text-baja-red'
                }`}
              >
                {item.side === 'sube' ? UI.market.sube : UI.market.baja}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[13px] font-semibold text-text-primary tabular-nums">
              ${item.amount.toLocaleString()} {item.token}
            </p>
            <p className="text-[11px] text-text-muted">{item.timeAgo} ago</p>
          </div>
        </div>
      ))}
    </div>
  )
}
