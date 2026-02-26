'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Trophy, DollarSign } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/leaderboard', icon: Trophy, label: 'Tabla' },
  { href: '/analytics', icon: DollarSign, label: 'Análisis' },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 safe-bottom pb-2">
      <div className="flex items-center gap-1 bg-nav-dark rounded-full px-6 py-3 shadow-nav">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                isActive
                  ? 'text-nav-active'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive ? 'currentColor' : 'none'}
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
