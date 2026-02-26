'use client'

import { Bell } from 'lucide-react'

interface HeaderProps {
  balance?: string
  flag?: string
}

export default function Header({ balance = '$125.00', flag = '🇨🇴' }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3">
      {/* Left: Avatar + Balance */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-300" />
        <span className="text-base font-semibold text-text-primary tabular-nums">
          {balance}
        </span>
      </div>

      {/* Right: Flag + Notification */}
      <div className="flex items-center gap-3">
        <span className="text-xl">{flag}</span>
        <button
          aria-label="Notificaciones"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
        >
          <Bell size={20} className="text-text-primary" />
        </button>
      </div>
    </header>
  )
}
