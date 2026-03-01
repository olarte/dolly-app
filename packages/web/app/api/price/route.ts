import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPrice, getOpenPrice } from '@/lib/price-source'
import { getLatestTRM } from '@/lib/trm'

// Track previous price per pair to determine arrow direction
const previousPrices = new Map<string, number>()

// FX markets are closed on weekends (Saturday & Sunday)
function isForexMarketOpen(): boolean {
  const now = new Date()
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = nyTime.getDay() // 0=Sun, 6=Sat
  const hour = nyTime.getHours()

  if (day === 6) return false
  if (day === 0 && hour < 17) return false
  if (day === 5 && hour >= 17) return false
  return true
}

export async function GET(request: NextRequest) {
  const pair = request.nextUrl.searchParams.get('pair') || 'USD/COP'
  const source = request.nextUrl.searchParams.get('source')

  // TRM source: return official Banco de la República rate
  if (source === 'trm') {
    try {
      const trm = await getLatestTRM()
      return NextResponse.json(
        {
          price: trm.rate,
          date: trm.date,
          source: 'banrep.gov.co/TRM',
          pair,
          updatedAt: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 's-maxage=600, stale-while-revalidate=1200',
          },
        }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({ error: message }, { status: 502 })
    }
  }

  // Default: live intraday price from Twelve Data
  const marketOpen = isForexMarketOpen()

  try {
    const [price, openingPrice] = await Promise.all([
      getCurrentPrice(pair),
      getOpenPrice(pair),
    ])

    const dayUp = price >= openingPrice
    const changePercent = (((price - openingPrice) / openingPrice) * 100).toFixed(2)

    const prevPrice = previousPrices.get(pair)
    const direction: 'up' | 'down' = prevPrice !== undefined ? (price >= prevPrice ? 'up' : 'down') : (dayUp ? 'up' : 'down')
    previousPrices.set(pair, price)

    return NextResponse.json(
      {
        price: +price.toFixed(2),
        openingPrice: +openingPrice.toFixed(2),
        priceUp: dayUp,
        direction,
        changePercent: `${dayUp ? '+' : ''}${changePercent}%`,
        pair,
        marketOpen,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
