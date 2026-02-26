'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StablecoinKey } from './stablecoins'
import type { CurrencyCode } from './currencies'

interface DepositModalState {
  open: boolean
  marketAddress: `0x${string}`
  side: 'sube' | 'baja' | null
}

interface DollyStore {
  // Stablecoin selection
  selectedCoin: StablecoinKey
  setSelectedCoin: (coin: StablecoinKey) => void

  // Geo / currency
  countryCode: string
  currencyCode: CurrencyCode
  setGeo: (country: string, currency: CurrencyCode) => void

  // Stablecoin selector UI
  coinSelectorOpen: boolean
  setCoinSelectorOpen: (open: boolean) => void

  // Deposit modal
  depositModal: DepositModalState
  openDepositModal: (marketAddress: `0x${string}`, side: 'sube' | 'baja') => void
  closeDepositModal: () => void
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`

export const useDollyStore = create<DollyStore>()(
  persist(
    (set) => ({
      // Stablecoin
      selectedCoin: 'cUSD',
      setSelectedCoin: (coin) => set({ selectedCoin: coin }),

      // Geo
      countryCode: 'CO',
      currencyCode: 'COP',
      setGeo: (country, currency) =>
        set({ countryCode: country, currencyCode: currency }),

      // Coin selector
      coinSelectorOpen: false,
      setCoinSelectorOpen: (open) => set({ coinSelectorOpen: open }),

      // Deposit modal
      depositModal: { open: false, marketAddress: ZERO_ADDRESS, side: null },
      openDepositModal: (marketAddress, side) =>
        set({ depositModal: { open: true, marketAddress, side } }),
      closeDepositModal: () =>
        set({ depositModal: { open: false, marketAddress: ZERO_ADDRESS, side: null } }),
    }),
    {
      name: 'dolly-store',
      partialize: (state) => ({
        selectedCoin: state.selectedCoin,
        countryCode: state.countryCode,
        currencyCode: state.currencyCode,
      }),
    }
  )
)
