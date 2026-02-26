'use client'

import { STABLECOINS, type StablecoinKey } from '@/lib/stablecoins'
import { useDollyStore } from '@/lib/store'
import { useWallet } from '@/hooks/useWallet'
import { UI } from '@/lib/strings'
import { X, Check } from 'lucide-react'

export default function StablecoinSelector() {
  const { allBalances } = useWallet()
  const selectedCoin = useDollyStore((s) => s.selectedCoin)
  const setSelectedCoin = useDollyStore((s) => s.setSelectedCoin)
  const coinSelectorOpen = useDollyStore((s) => s.coinSelectorOpen)
  const setCoinSelectorOpen = useDollyStore((s) => s.setCoinSelectorOpen)

  if (!coinSelectorOpen) return null

  const coins = Object.keys(STABLECOINS) as StablecoinKey[]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setCoinSelectorOpen(false)}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl px-6 pt-5 pb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text-primary">
            {UI.deposit.selectCoin}
          </h3>
          <button
            onClick={() => setCoinSelectorOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5"
          >
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        <div className="space-y-2">
          {coins.map((key) => {
            const coin = STABLECOINS[key]
            const balance = allBalances[key]
            const isSelected = key === selectedCoin

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedCoin(key)
                  setCoinSelectorOpen(false)
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${
                  isSelected
                    ? 'bg-sube-bg border border-sube-green/30'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                    {coin.symbol.slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-text-primary">
                      {coin.symbol}
                    </p>
                    <p className="text-xs text-text-muted">{coin.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary tabular-nums">
                    {balance?.formatted ?? '$0.00'}
                  </span>
                  {isSelected && (
                    <Check size={16} className="text-sube-green" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
