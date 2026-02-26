export interface MultiplierData {
  multiplier: number
  pool: number
}

export interface CarouselMarket {
  id: string
  type: string
  sube: number
  baja: number
  date: string
}

export interface MarketData {
  price: number
  priceUp: boolean
  openingPrice: number
  targetTime: Date
  question: string
  sube: MultiplierData
  baja: MultiplierData
  markets: CarouselMarket[]
}

export function useMockMarketData(): MarketData {
  // Target time: today at 5:00 PM (market close)
  const now = new Date()
  const target = new Date(now)
  target.setHours(17, 0, 0, 0)
  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }

  return {
    price: 3648.87,
    priceUp: true,
    openingPrice: 3645.87,
    targetTime: target,
    question: '¿Cierra hoy más alto que la apertura?',
    sube: { multiplier: 1.58, pool: 1_200_000 },
    baja: { multiplier: 2.38, pool: 1_200_000 },
    markets: [
      { id: 'weekly-1', type: 'SEMANAL', sube: 1.58, baja: 2.34, date: 'FEB20' },
      { id: 'monthly-1', type: 'MENSUAL', sube: 1.58, baja: 2.34, date: 'FEB29' },
      { id: 'special-1', type: 'ELECCIONES', sube: 1.58, baja: 2.34, date: 'MAR15' },
    ],
  }
}
