import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPrice } from '@/lib/price-source'

export async function GET(request: NextRequest) {
  const pair = request.nextUrl.searchParams.get('pair') || 'USD/COP'

  try {
    const price = await getCurrentPrice(pair)

    // Derive a synthetic opening price (small random offset for realism)
    // In production, the opening price comes from the markets table
    const seed = new Date().toISOString().slice(0, 10) // daily seed
    const hash = [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const offset = ((hash % 100) - 50) / 100 // -0.5% to +0.5%
    const openingPrice = +(price * (1 + offset / 100)).toFixed(2)

    const priceUp = price >= openingPrice
    const changePercent = (((price - openingPrice) / openingPrice) * 100).toFixed(2)

    return NextResponse.json(
      {
        price: +price.toFixed(2),
        openingPrice,
        priceUp,
        changePercent: `${priceUp ? '+' : ''}${changePercent}%`,
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
