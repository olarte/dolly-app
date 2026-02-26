// FX price abstraction with 30-second in-memory cache.
// Uses open.er-api.com (free, no key required) for live FX rates.
// The pair format is "USD/COP" — we fetch USD-based rates and extract the target currency.

interface CachedRate {
  rate: number
  fetchedAt: number
}

const cache = new Map<string, CachedRate>()
const CACHE_TTL_MS = 30_000

function parsePair(pair: string): { base: string; quote: string } {
  const [base, quote] = pair.split('/')
  if (!base || !quote) throw new Error(`Invalid pair format: ${pair}`)
  return { base, quote }
}

async function fetchRate(pair: string): Promise<number> {
  const cached = cache.get(pair)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rate
  }

  const { base, quote } = parsePair(pair)

  // Try open.er-api.com first (free, no key)
  const url = `https://open.er-api.com/v6/latest/${base}`
  const res = await fetch(url, { next: { revalidate: 30 } })

  if (!res.ok) {
    // Fallback: if cached data exists (even stale), return it
    if (cached) return cached.rate
    throw new Error(`FX API error: ${res.status}`)
  }

  const data = await res.json()
  const rate = data.rates?.[quote]

  if (typeof rate !== 'number') {
    if (cached) return cached.rate
    throw new Error(`Currency ${quote} not found in FX response`)
  }

  cache.set(pair, { rate, fetchedAt: Date.now() })
  return rate
}

export async function getCurrentPrice(pair: string): Promise<number> {
  return fetchRate(pair)
}

// For MVP, opening price is fetched from database (stored at market creation).
// This is a convenience function that returns the current rate as a proxy
// when no stored opening price is available.
export async function getOpenPrice(pair: string): Promise<number> {
  return fetchRate(pair)
}

export async function getClosePrice(pair: string): Promise<number> {
  return fetchRate(pair)
}

// Convert price to on-chain format (8 decimal fixed point, matching Chainlink convention)
export function priceToOnChain(price: number): bigint {
  return BigInt(Math.round(price * 1e8))
}

// Convert from on-chain 8-decimal format to number
export function priceFromOnChain(onChain: bigint): number {
  return Number(onChain) / 1e8
}
