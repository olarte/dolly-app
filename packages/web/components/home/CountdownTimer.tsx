'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { UI } from '@/lib/strings'

interface CountdownTimerProps {
  openingPrice: number
  priceUp: boolean
  targetTime: Date
  marketOpen?: boolean
}

function formatCountdown(target: Date): string {
  const now = new Date()
  const diff = Math.max(0, target.getTime() - now.getTime())
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  const period = target.getHours() >= 12 ? 'PM' : 'AM'
  const h = String(hours).padStart(2, '0')
  const m = String(minutes).padStart(2, '0')
  const s = String(seconds).padStart(2, '0')
  return `${h}:${m}:${s}${period}`
}

export default function CountdownTimer({ openingPrice, priceUp, targetTime, marketOpen = true }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(() => formatCountdown(targetTime))

  useEffect(() => {
    if (!marketOpen) return
    const interval = setInterval(() => {
      setCountdown(formatCountdown(targetTime))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetTime, marketOpen])

  const arrow = priceUp ? '↗' : '↘'
  const color = priceUp ? 'text-sube-green' : 'text-baja-red'

  if (!marketOpen) {
    return (
      <div className="flex items-center justify-center mt-3 px-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-text-secondary/10 text-text-secondary text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
          {UI.home.marketClosed} · {UI.home.opensMonday}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between mt-3 px-1">
      <p className="text-xs text-text-muted">
        {UI.home.opening}{' '}
        <span className={`${color} font-semibold tabular-nums`}>
          {arrow}{formatCurrency(openingPrice)}
        </span>
      </p>
      <p className="text-xs text-text-muted">
        {UI.home.closesIn}{' '}
        <span className="font-semibold text-text-primary tabular-nums">
          {countdown}
        </span>
      </p>
    </div>
  )
}
