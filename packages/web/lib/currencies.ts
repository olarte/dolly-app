export const CURRENCIES = {
  COP: {
    code: 'COP',
    name: 'Peso Colombiano',
    country: 'CO',
    flag: '🇨🇴',
    symbol: '$',
    decimals: 2,
    pair: 'USD/COP',
  },
  NGN: {
    code: 'NGN',
    name: 'Nigerian Naira',
    country: 'NG',
    flag: '🇳🇬',
    symbol: '₦',
    decimals: 2,
    pair: 'USD/NGN',
  },
  EGP: {
    code: 'EGP',
    name: 'Egyptian Pound',
    country: 'EG',
    flag: '🇪🇬',
    symbol: 'E£',
    decimals: 2,
    pair: 'USD/EGP',
  },
  KES: {
    code: 'KES',
    name: 'Kenyan Shilling',
    country: 'KE',
    flag: '🇰🇪',
    symbol: 'KSh',
    decimals: 2,
    pair: 'USD/KES',
  },
  ARS: {
    code: 'ARS',
    name: 'Peso Argentino',
    country: 'AR',
    flag: '🇦🇷',
    symbol: '$',
    decimals: 2,
    pair: 'USD/ARS',
  },
} as const

export type CurrencyCode = keyof typeof CURRENCIES
export type Currency = (typeof CURRENCIES)[CurrencyCode]

// Map country ISO code → currency code
export const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  CO: 'COP',
  NG: 'NGN',
  EG: 'EGP',
  KE: 'KES',
  AR: 'ARS',
}

// Default currency for MVP
export const DEFAULT_CURRENCY: CurrencyCode = 'COP'
