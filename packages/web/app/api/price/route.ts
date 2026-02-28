import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPrice, getOpenPrice } from '@/lib/price-source'

// Track previous price per pair to determine arrow direction
const previousPrices = new Map<string, number>()

export async function GET(request: NextRequest) {
  const pair = request.nextUrl.searchParams.get('pair') || 'USD/COP'

  try {
    const [price, openingPrice] = await Promise.all([
      getCurrentPrice(pair),
      getOpenPrice(pair),
    ])

    // Day change (vs opening)
    const dayUp = price >= openingPrice
    const changePercent = (((price - openingPrice) / openingPrice) * 100).toFixed(2)

    // Arrow direction (vs previous data point)
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
