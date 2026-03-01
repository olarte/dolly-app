'use client'

import { useQuery } from '@tanstack/react-query'

export interface PriceData {
  price: number
  openingPrice: number
  priceUp: boolean
  direction: 'up' | 'down'
  changePercent: string
  pair: string
  marketOpen: boolean
  updatedAt: string
}

export function usePrice(pair: string) {
  const query = useQuery<PriceData>({
    queryKey: ['price', pair],
    queryFn: async () => {
      const res = await fetch(`/api/price?pair=${encodeURIComponent(pair)}`)
      if (!res.ok) throw new Error('Price fetch failed')
      return res.json()
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  return {
    price: query.data?.price ?? 0,
    openingPrice: query.data?.openingPrice ?? 0,
    priceUp: query.data?.priceUp ?? true,
    direction: query.data?.direction ?? 'up',
    changePercent: query.data?.changePercent ?? '+0.00%',
    marketOpen: query.data?.marketOpen ?? true,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

export interface PricePoint {
  time: string
  price: number
  volume: number
}

export function usePriceHistory(pair: string, period: string) {
  const query = useQuery<PricePoint[]>({
    queryKey: ['priceHistory', pair, period],
    queryFn: async () => {
      const res = await fetch(
        `/api/price/history?pair=${encodeURIComponent(pair)}&period=${encodeURIComponent(period)}`
      )
      if (!res.ok) throw new Error('Price history fetch failed')
      return res.json()
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

// TRM (Tasa Representativa del Mercado) from Banco de la República
export interface TRMData {
  price: number
  date: string
  source: string
  pair: string
}

export function useTRM(pair: string) {
  const query = useQuery<TRMData>({
    queryKey: ['trm', pair],
    queryFn: async () => {
      const res = await fetch(`/api/price?pair=${encodeURIComponent(pair)}&source=trm`)
      if (!res.ok) throw new Error('TRM fetch failed')
      return res.json()
    },
    staleTime: 10 * 60 * 1000,  // 10 minutes (TRM changes at most once/day)
    refetchInterval: 10 * 60 * 1000,
  })

  return {
    rate: query.data?.price ?? 0,
    date: query.data?.date ?? '',
    source: query.data?.source ?? '',
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
