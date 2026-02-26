'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { UI } from '@/lib/strings'

interface CountdownTimerProps {
  openingPrice: number
  priceUp: boolean
  targetTime: Date
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

export default function CountdownTimer({ openingPrice, priceUp, targetTime }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(() => formatCountdown(targetTime))

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(targetTime))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetTime])

  const arrow = priceUp ? '↗' : '↘'
  const color = priceUp ? 'text-sube-green' : 'text-baja-red'

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
