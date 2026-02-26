import { COUNTRY_TO_CURRENCY, DEFAULT_CURRENCY, type CurrencyCode } from './currencies'

interface GeoResult {
  countryCode: string
  currencyCode: CurrencyCode
}

/**
 * Detect user's country via IP geolocation and map to their national currency.
 * Returns default (COP) if detection fails or country is unsupported.
 */
export async function detectUserGeo(): Promise<GeoResult> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return { countryCode: 'CO', currencyCode: DEFAULT_CURRENCY }
    }

    const data = await response.json()
    const countryCode: string = data.country_code ?? 'CO'
    const currencyCode = COUNTRY_TO_CURRENCY[countryCode] ?? DEFAULT_CURRENCY

    return { countryCode, currencyCode }
  } catch {
    return { countryCode: 'CO', currencyCode: DEFAULT_CURRENCY }
  }
}

/**
 * Check if running inside MiniPay's embedded browser.
 */
export function isMiniPay(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as Record<string, unknown>
  const eth = w.ethereum as Record<string, unknown> | undefined
  return eth?.isMiniPay === true
}
