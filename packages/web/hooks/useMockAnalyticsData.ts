export interface PricePoint {
  time: string
  price: number
  volume: number
}

export interface NewsItem {
  id: string
  flag: string
  title: string
  preview: string
  timeAgo: string
  comments: number
}

export interface AnalyticsData {
  price: number
  priceUp: boolean
  openingPrice: number
  changePercent: string
  priceHistory: PricePoint[]
  news: NewsItem[]
}

// Deterministic intraday price data matching the Figma design
// Jagged line from ~3,660 rising to ~3,760 range
const PRICE_HISTORY: PricePoint[] = [
  { time: '8AM', price: 3660, volume: 1200 },
  { time: '', price: 3665, volume: 980 },
  { time: '9AM', price: 3658, volume: 1400 },
  { time: '', price: 3672, volume: 1100 },
  { time: '10AM', price: 3668, volume: 1350 },
  { time: '', price: 3680, volume: 900 },
  { time: '11AM', price: 3675, volume: 1500 },
  { time: '', price: 3690, volume: 1050 },
  { time: '', price: 3682, volume: 1250 },
  { time: '12PM', price: 3695, volume: 1600 },
  { time: '', price: 3688, volume: 1150 },
  { time: '', price: 3710, volume: 1400 },
  { time: '1PM', price: 3705, volume: 1300 },
  { time: '', price: 3720, volume: 950 },
  { time: '', price: 3715, volume: 1100 },
  { time: '2PM', price: 3730, volume: 1450 },
  { time: '', price: 3722, volume: 1050 },
  { time: '', price: 3740, volume: 1300 },
  { time: '3PM', price: 3735, volume: 1550 },
  { time: '', price: 3748, volume: 1200 },
  { time: '', price: 3742, volume: 900 },
  { time: '4PM', price: 3755, volume: 1650 },
  { time: '', price: 3750, volume: 1100 },
  { time: '', price: 3760, volume: 1400 },
]

const MOCK_NEWS: NewsItem[] = [
  {
    id: 'n1',
    flag: '🇺🇸',
    title: 'Fed mantiene tasas, proyecta más tiempo...',
    preview:
      'La Reserva Federal decidió mantener las tasas de interés sin cambios por tercera reunión consecutiva, señalando que necesita más evidencia de que la inflación converge hacia su meta del 2% antes de considerar recortes.',
    timeAgo: '1 hr',
    comments: 34,
  },
  {
    id: 'n2',
    flag: '🇨🇴',
    title: 'BanRep mantiene tasas, inflación sigue...',
    preview:
      'El Banco de la República señaló que la inflación sigue por encima de la meta del 3%, manteniendo una postura cautelosa frente a futuros recortes de la tasa de intervención.',
    timeAgo: '4 hr',
    comments: 18,
  },
  {
    id: 'n3',
    flag: '🇺🇸',
    title: 'Inflación y PIB caen en Marzo, menor de lo...',
    preview:
      'Los datos de inflación de marzo muestran una desaceleración mayor a la esperada. Los mercados reaccionan con optimismo ante posibles recortes de tasas en el segundo semestre del año.',
    timeAgo: '10 hr',
    comments: 52,
  },
  {
    id: 'n4',
    flag: '🇨🇴',
    title: 'Exportaciones cafeteras alcanzan récord...',
    preview:
      'Colombia exportó más de 1.2 millones de sacos de café en febrero, impulsando la entrada de divisas y fortaleciendo el peso colombiano frente al dólar americano.',
    timeAgo: '1 día',
    comments: 27,
  },
]

export function useMockAnalyticsData(): AnalyticsData {
  return {
    price: 3648.87,
    priceUp: true,
    openingPrice: 3645.87,
    changePercent: '+0.89%',
    priceHistory: PRICE_HISTORY,
    news: MOCK_NEWS,
  }
}
