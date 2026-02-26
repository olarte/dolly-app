'use client'

import Link from 'next/link'

interface BackHeaderProps {
  price?: string
  priceUp?: boolean
}

export default function BackHeader({ price = '$3,648.87', priceUp = true }: BackHeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3">
      {/* Left: Back link */}
      <Link
        href="/"
        className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
      >
        ← BACK TO HOME
      </Link>

      {/* Right: Live price */}
      <div className="flex items-center gap-1">
        <span
          className={`text-sm font-bold tabular-nums ${
            priceUp ? 'text-sube-green' : 'text-baja-red'
          }`}
        >
          {priceUp ? '↗' : '↘'}
          {price}
        </span>
      </div>
    </header>
  )
}
