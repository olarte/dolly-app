import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPrice } from '@/lib/price-source'

export async function GET(request: NextRequest) {
  const pair = request.nextUrl.searchParams.get('pair') || 'USD/COP'
  const period = request.nextUrl.searchParams.get('period') || '1D'

  try {
    const currentPrice = await getCurrentPrice(pair)

    // Generate synthetic historical points based on current price + period
    const points = generatePriceHistory(currentPrice, period)

    return NextResponse.json(points, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

interface PricePoint {
  time: string
  price: number
  volume: number
}

function generatePriceHistory(currentPrice: number, period: string): PricePoint[] {
  const points: PricePoint[] = []

  let count: number
  let labelFn: (i: number) => string
  let volatility: number

  switch (period) {
    case '1D': {
      count = 24
      volatility = 0.002
      labelFn = (i) => {
        const h = 8 + Math.floor(i * (10 / 24))
        const ampm = h >= 12 ? 'PM' : 'AM'
        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
        return i % 3 === 0 ? `${h12}${ampm}` : ''
      }
      break
    }
    case '5D': {
      count = 30
      volatility = 0.005
      labelFn = (i) => {
        const d = new Date()
        d.setDate(d.getDate() - (30 - i) / 6)
        return i % 6 === 0 ? d.toLocaleDateString('es', { weekday: 'short' }) : ''
      }
      break
    }
    case '1M': {
      count = 30
      volatility = 0.01
      labelFn = (i) => {
        const d = new Date()
        d.setDate(d.getDate() - (30 - i))
        return i % 7 === 0 ? d.toLocaleDateString('es', { day: 'numeric', month: 'short' }) : ''
      }
      break
    }
    case '1Y': {
      count = 52
      volatility = 0.03
      labelFn = (i) => {
        const d = new Date()
        d.setDate(d.getDate() - (52 - i) * 7)
        return i % 8 === 0 ? d.toLocaleDateString('es', { month: 'short' }) : ''
      }
      break
    }
    default: {
      count = 24
      volatility = 0.002
      labelFn = (i) => (i % 3 === 0 ? `${8 + i}h` : '')
    }
  }

  // Walk backwards from current price with random noise
  let price = currentPrice
  const prices: number[] = [price]

  // Generate random walk backwards
  const seed = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  let rng = parseInt(seed, 10) || 12345

  for (let i = count - 1; i > 0; i--) {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    const change = ((rng % 1000) / 1000 - 0.5) * 2 * volatility * price
    price = price - change
    prices.unshift(+price.toFixed(2))
  }

  for (let i = 0; i < count; i++) {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    points.push({
      time: labelFn(i),
      price: prices[i],
      volume: 800 + (rng % 1000),
    })
  }

  return points
}
