import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get('country') || 'CO'

  if (!supabase) {
    // Return mock news when DB is not configured
    return NextResponse.json(FALLBACK_NEWS)
  }

  try {
    // Fetch news relevant to the country + US (global macro)
    const { data, error } = await supabase
      .from('news_items')
      .select('*')
      .in('country_code', [country, 'US'])
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) throw error

    const news = (data ?? []).map((item) => ({
      id: item.id,
      flag: item.flag,
      title: item.title,
      preview: item.body,
      timeAgo: formatTimeAgo(new Date(item.published_at)),
      comments: item.comments,
    }))

    return NextResponse.json(news)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'ahora'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr`
  return `${Math.floor(seconds / 86400)} día${Math.floor(seconds / 86400) > 1 ? 's' : ''}`
}

// Fallback news when database is not configured
const FALLBACK_NEWS = [
  {
    id: 'n1',
    flag: '🇺🇸',
    title: 'Fed mantiene tasas, proyecta más tiempo...',
    preview:
      'La Reserva Federal decidió mantener las tasas de interés sin cambios por tercera reunión consecutiva.',
    timeAgo: '1 hr',
    comments: 34,
  },
  {
    id: 'n2',
    flag: '🇨🇴',
    title: 'BanRep mantiene tasas, inflación sigue...',
    preview:
      'El Banco de la República señaló que la inflación sigue por encima de la meta del 3%.',
    timeAgo: '4 hr',
    comments: 18,
  },
  {
    id: 'n3',
    flag: '🇺🇸',
    title: 'Inflación y PIB caen en Marzo, menor de lo...',
    preview:
      'Los datos de inflación de marzo muestran una desaceleración mayor a la esperada.',
    timeAgo: '10 hr',
    comments: 52,
  },
  {
    id: 'n4',
    flag: '🇨🇴',
    title: 'Exportaciones cafeteras alcanzan récord...',
    preview:
      'Colombia exportó más de 1.2 millones de sacos de café en febrero.',
    timeAgo: '1 día',
    comments: 27,
  },
]
