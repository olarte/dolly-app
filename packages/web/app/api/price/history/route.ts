import { NextRequest, NextResponse } from 'next/server'
import { getPriceHistory } from '@/lib/price-source'

export async function GET(request: NextRequest) {
  const pair = request.nextUrl.searchParams.get('pair') || 'USD/COP'
  const period = request.nextUrl.searchParams.get('period') || '1D'

  try {
    const points = await getPriceHistory(pair, period)

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
