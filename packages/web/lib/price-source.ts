// FX price source using Twelve Data API (primary) with open.er-api.com fallback.
// Twelve Data provides real-time and intraday historical forex data.
// Free tier: 800 requests/day, 8/min — sufficient for MVP with caching.

const TWELVE_DATA_BASE = 'https://api.twelvedata.com'
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY || ''

// Fallback API (free, no key, but daily rates only)
const FALLBACK_BASE = 'https://open.er-api.com/v6/latest'

// --- In-memory cache ---

interface CachedRate {
  rate: number
  fetchedAt: number
}

interface CachedHistory {
  points: PricePoint[]
  fetchedAt: number
}

const priceCache = new Map<string, CachedRate>()
const historyCache = new Map<string, CachedHistory>()

const PRICE_CACHE_TTL = 60_000        // 1 minute for current price
const HISTORY_CACHE_TTL = 120_000     // 2 minutes for history

// --- Types ---

export interface PricePoint {
  time: string
  price: number
  volume: number
}

// --- Current Price ---

function parsePair(pair: string): { base: string; quote: string } {
  const [base, quote] = pair.split('/')
  if (!base || !quote) throw new Error(`Invalid pair format: ${pair}`)
  return { base, quote }
}

async function fetchPriceTwelveData(pair: string): Promise<number> {
  if (!TWELVE_DATA_KEY) throw new Error('No Twelve Data API key')

  const res = await fetch(
    `${TWELVE_DATA_BASE}/price?symbol=${pair}&apikey=${TWELVE_DATA_KEY}`,
    { next: { revalidate: 30 } }
  )

  if (!res.ok) throw new Error(`Twelve Data error: ${res.status}`)

  const data = await res.json()

  if (data.code) {
    // Twelve Data returns error codes in the body
    throw new Error(`Twelve Data: ${data.message || data.code}`)
  }

  const price = parseFloat(data.price)
  if (isNaN(price)) throw new Error('Invalid price from Twelve Data')

  return price
}

async function fetchPriceFallback(pair: string): Promise<number> {
  const { base, quote } = parsePair(pair)
  const res = await fetch(`${FALLBACK_BASE}/${base}`, { next: { revalidate: 30 } })
  if (!res.ok) throw new Error(`Fallback FX API error: ${res.status}`)

  const data = await res.json()
  const rate = data.rates?.[quote]
  if (typeof rate !== 'number') throw new Error(`Currency ${quote} not found`)

  return rate
}

async function fetchRate(pair: string): Promise<number> {
  const cached = priceCache.get(pair)
  if (cached && Date.now() - cached.fetchedAt < PRICE_CACHE_TTL) {
    return cached.rate
  }

  let rate: number

  try {
    rate = await fetchPriceTwelveData(pair)
  } catch {
    // Fallback to open.er-api.com
    try {
      rate = await fetchPriceFallback(pair)
    } catch {
      // Last resort: return stale cache
      if (cached) return cached.rate
      throw new Error(`Failed to fetch price for ${pair}`)
    }
  }

  priceCache.set(pair, { rate, fetchedAt: Date.now() })
  return rate
}

export async function getCurrentPrice(pair: string): Promise<number> {
  return fetchRate(pair)
}

export async function getOpenPrice(pair: string): Promise<number> {
  const cacheKey = `open:${pair}`
  const cached = priceCache.get(cacheKey)
  // Cache opening price for 5 minutes (it only changes once a day)
  if (cached && Date.now() - cached.fetchedAt < 300_000) {
    return cached.rate
  }

  try {
    if (!TWELVE_DATA_KEY) throw new Error('No Twelve Data API key')

    // Fetch today's daily candle to get the real opening price
    const res = await fetch(
      `${TWELVE_DATA_BASE}/time_series?symbol=${pair}&interval=1day&outputsize=1&format=JSON&apikey=${TWELVE_DATA_KEY}`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) throw new Error(`Twelve Data error: ${res.status}`)
    const data = await res.json()

    if (data.code || data.status === 'error' || !data.values?.length) {
      throw new Error(data.message || 'No daily data')
    }

    const openPrice = parseFloat(data.values[0].open)
    if (isNaN(openPrice)) throw new Error('Invalid open price')

    priceCache.set(cacheKey, { rate: openPrice, fetchedAt: Date.now() })
    return openPrice
  } catch {
    // Fallback: return current price (opening price not available)
    return fetchRate(pair)
  }
}

export async function getClosePrice(pair: string): Promise<number> {
  return fetchRate(pair)
}

// --- Intraday History ---

// Map our period codes to Twelve Data intervals and output sizes
function periodToParams(period: string): { interval: string; outputsize: number } {
  switch (period) {
    case '1D':  return { interval: '15min', outputsize: 40 }   // ~10h of trading
    case '5D':  return { interval: '1h',    outputsize: 60 }   // 5 days hourly
    case '1W':  return { interval: '1h',    outputsize: 84 }   // 7 days hourly
    case '1M':  return { interval: '4h',    outputsize: 45 }   // 30 days
    case '1Y':  return { interval: '1day',  outputsize: 252 }  // ~1 year trading days
    case '5Y':  return { interval: '1week', outputsize: 260 }  // 5 years weekly
    case 'ALL': return { interval: '1month', outputsize: 120 } // 10 years monthly
    default:    return { interval: '15min', outputsize: 40 }
  }
}

export async function getPriceHistory(pair: string, period: string): Promise<PricePoint[]> {
  const cacheKey = `${pair}:${period}`
  const cached = historyCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < HISTORY_CACHE_TTL) {
    return cached.points
  }

  let points: PricePoint[]

  try {
    points = await fetchHistoryTwelveData(pair, period)
  } catch {
    // Fallback to synthetic data if Twelve Data fails
    const currentPrice = await fetchRate(pair)
    points = generateSyntheticHistory(currentPrice, period)
  }

  historyCache.set(cacheKey, { points, fetchedAt: Date.now() })
  return points
}

async function fetchHistoryTwelveData(pair: string, period: string): Promise<PricePoint[]> {
  if (!TWELVE_DATA_KEY) throw new Error('No Twelve Data API key')

  const { interval, outputsize } = periodToParams(period)

  const res = await fetch(
    `${TWELVE_DATA_BASE}/time_series?symbol=${pair}&interval=${interval}&outputsize=${outputsize}&format=JSON&apikey=${TWELVE_DATA_KEY}`,
    { next: { revalidate: 60 } }
  )

  if (!res.ok) throw new Error(`Twelve Data time_series error: ${res.status}`)

  const data = await res.json()

  if (data.code || data.status === 'error') {
    throw new Error(`Twelve Data: ${data.message || data.code}`)
  }

  if (!data.values || !Array.isArray(data.values)) {
    throw new Error('No values in Twelve Data response')
  }

  // Twelve Data returns newest first — reverse for chronological order
  const values = [...data.values].reverse()

  return values.map((v: { datetime: string; close: string; volume?: string }) => ({
    time: formatTimeLabel(v.datetime, period),
    price: parseFloat(v.close),
    volume: parseInt(v.volume || '0', 10),
  }))
}

function formatTimeLabel(datetime: string, period: string): string {
  // datetime format: "2025-01-15 14:30:00" or "2025-01-15"
  const d = new Date(datetime.replace(' ', 'T') + (datetime.includes(' ') ? '' : 'T00:00:00'))

  switch (period) {
    case '1D':
      return d.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true })
    case '5D':
    case '1W':
      return d.toLocaleDateString('es', { weekday: 'short', hour: 'numeric', hour12: true })
    case '1M':
      return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
    case '1Y':
      return d.toLocaleDateString('es', { month: 'short', year: '2-digit' })
    case '5Y':
    case 'ALL':
      return d.toLocaleDateString('es', { month: 'short', year: '2-digit' })
    default:
      return d.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' })
  }
}

// --- Synthetic fallback (when no API key or API fails) ---

function generateSyntheticHistory(currentPrice: number, period: string): PricePoint[] {
  const { outputsize } = periodToParams(period)
  const count = outputsize
  const volatility = period === '1D' ? 0.002 : period === '1Y' ? 0.03 : 0.01

  const points: PricePoint[] = []
  const seed = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  let rng = parseInt(seed, 10) || 12345
  let price = currentPrice

  const prices: number[] = [price]
  for (let i = count - 1; i > 0; i--) {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    const change = ((rng % 1000) / 1000 - 0.5) * 2 * volatility * price
    price = price - change
    prices.unshift(+price.toFixed(2))
  }

  for (let i = 0; i < count; i++) {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    points.push({
      time: `${i}`,
      price: prices[i],
      volume: 800 + (rng % 1000),
    })
  }

  return points
}

// --- On-chain price conversion ---

export function priceToOnChain(price: number): bigint {
  return BigInt(Math.round(price * 1e8))
}

export function priceFromOnChain(onChain: bigint): number {
  return Number(onChain) / 1e8
}
