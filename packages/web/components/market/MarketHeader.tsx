interface MarketHeaderProps {
  icon: string
  typeLabel: string
  dateLabel: string
}

export default function MarketHeader({ icon, typeLabel, dateLabel }: MarketHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 mt-2">
      <div className="w-9 h-9 rounded-xl bg-sube-bg flex items-center justify-center">
        <span className="text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-bold text-text-primary tracking-widest leading-tight">
          {typeLabel}
        </p>
        <p className="text-[11px] text-text-muted leading-tight">{dateLabel}</p>
      </div>
    </div>
  )
}
