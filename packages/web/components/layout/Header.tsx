'use client'

import { Bell } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import { useDollyStore } from '@/lib/store'
import { CURRENCIES } from '@/lib/currencies'
import { STABLECOINS } from '@/lib/stablecoins'
import { UI } from '@/lib/strings'

export default function Header() {
  const { isConnected, balance, selectedCoin } = useWallet()
  const { currencyCode, setCoinSelectorOpen } = useDollyStore()
  const coin = STABLECOINS[selectedCoin]
  const currency = CURRENCIES[currencyCode]
  const flag = currency?.flag ?? '🇨🇴'

  return (
    <header className="flex items-center justify-between px-5 py-3">
      {/* Left: Avatar + Balance */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-300" />
        {isConnected ? (
          <button
            onClick={() => setCoinSelectorOpen(true)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <span className="text-base font-semibold text-text-primary tabular-nums">
              {balance}
            </span>
            <span className="text-[10px] text-text-muted font-medium">
              {coin.symbol}
            </span>
          </button>
        ) : (
          <span className="text-base font-semibold text-text-primary tabular-nums">
            $0.00
          </span>
        )}
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
