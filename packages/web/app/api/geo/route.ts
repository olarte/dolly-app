import { NextRequest, NextResponse } from 'next/server'
import { COUNTRY_TO_CURRENCY, CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currencies'

export async function GET(request: NextRequest) {
  // Use Vercel's x-vercel-ip-country header (free, no external API call)
  const countryCode = request.headers.get('x-vercel-ip-country') || 'CO'
  const currencyCode = COUNTRY_TO_CURRENCY[countryCode] || DEFAULT_CURRENCY
  const currency = CURRENCIES[currencyCode]

  return NextResponse.json({
    countryCode,
    currencyCode,
    pair: currency.pair,
    flag: currency.flag,
  })
}
