export interface ProbabilityPoint {
  time: string
  sube: number
  baja: number
}

export interface RulesData {
  period: string
  closeDate: string
  resolutionTime: string
  subeCondition: string
  bajaCondition: string
  details: string
  source: string
  sourceUrl: string
}

export interface HolderRow {
  side: 'sube' | 'baja'
  holders: number
  percentage: number
}

export interface ActivityItem {
  id: string
  address: string
  side: 'sube' | 'baja'
  amount: number
  token: string
  timeAgo: string
}

export interface MarketDetailData {
  id: string
  type: string
  typeLabel: string
  dateLabel: string
  icon: string
  price: number
  priceUp: boolean
  question: string
  referenceLabel: string
  referencePrice: number
  referencePriceUp: boolean
  sube: { multiplier: number; pool: number }
  baja: { multiplier: number; pool: number }
  subePercent: number
  bajaPercent: number
  volume: string
  probabilityData: ProbabilityPoint[]
  rules: RulesData
  holders: HolderRow[]
  activity: ActivityItem[]
  closingTime: Date
}

export function useMockMarketDetail(_id: string): MarketDetailData {
  const now = new Date()
  const closingTime = new Date(now)
  closingTime.setDate(closingTime.getDate() + 5)
  closingTime.setHours(17, 0, 0, 0)

  const probabilityData: ProbabilityPoint[] = [
    { time: '6AM', sube: 50, baja: 50 },
    { time: '7AM', sube: 52, baja: 48 },
    { time: '8AM', sube: 55, baja: 45 },
    { time: '9AM', sube: 53, baja: 47 },
    { time: '10AM', sube: 58, baja: 42 },
    { time: '11AM', sube: 56, baja: 44 },
    { time: '12PM', sube: 60, baja: 40 },
    { time: '1PM', sube: 58, baja: 42 },
    { time: '2PM', sube: 62, baja: 38 },
    { time: '3PM', sube: 64, baja: 36 },
    { time: '4PM', sube: 63, baja: 37 },
    { time: '5PM', sube: 65, baja: 35 },
  ]

  return {
    id: 'monthly-1',
    type: 'monthly',
    typeLabel: 'MERCADO MENSUAL',
    dateLabel: 'MARZO, 2026',
    icon: '💰',
    price: 4148.87,
    priceUp: true,
    question: '¿El dólar cerrará este mes más alto que el mes pasado?',
    referenceLabel: 'TRM MES PASADO',
    referencePrice: 4131.45,
    referencePriceUp: true,
    sube: { multiplier: 1.58, pool: 1_040_000 },
    baja: { multiplier: 2.38, pool: 1_040_000 },
    subePercent: 65,
    bajaPercent: 35,
    volume: '$22,750,000',
    probabilityData,
    rules: {
      period: 'Marzo 1 – Marzo 31, 2026',
      closeDate: 'Marzo 31, 2026 — 5:00 PM COT',
      resolutionTime: 'Abril 1, 2026 — 10:00 AM COT',
      subeCondition:
        'SUBE gana si la TRM oficial de cierre del mes es estrictamente mayor que la TRM del primer día hábil del mes.',
      bajaCondition:
        'BAJA gana si la TRM oficial de cierre del mes es menor o igual a la TRM del primer día hábil del mes.',
      details:
        'Este mercado resuelve basado en la Tasa Representativa del Mercado (TRM) publicada oficialmente por el Banco de la República de Colombia. La TRM es calculada y certificada diariamente por la Superintendencia Financiera de Colombia con base en las operaciones de compra y venta de dólares del mercado spot.',
      source: 'Banco de la República',
      sourceUrl: 'https://www.banrep.gov.co',
    },
    holders: [
      { side: 'sube', holders: 234, percentage: 65 },
      { side: 'baja', holders: 126, percentage: 35 },
    ],
    activity: [
      { id: '1', address: '0x1a2b...3c4d', side: 'sube', amount: 500, token: 'USDC', timeAgo: '2m' },
      { id: '2', address: '0x5e6f...7g8h', side: 'baja', amount: 250, token: 'cUSD', timeAgo: '5m' },
      { id: '3', address: '0x9i0j...1k2l', side: 'sube', amount: 1000, token: 'USDC', timeAgo: '8m' },
      { id: '4', address: '0x3m4n...5o6p', side: 'baja', amount: 150, token: 'USDT', timeAgo: '12m' },
      { id: '5', address: '0x7q8r...9s0t', side: 'sube', amount: 750, token: 'cUSD', timeAgo: '15m' },
      { id: '6', address: '0xab1c...2d3e', side: 'sube', amount: 300, token: 'USDC', timeAgo: '22m' },
      { id: '7', address: '0xfg4h...5i6j', side: 'baja', amount: 2000, token: 'USDC', timeAgo: '30m' },
      { id: '8', address: '0xkl7m...8n9o', side: 'sube', amount: 100, token: 'cUSD', timeAgo: '45m' },
    ],
    closingTime,
  }
}
