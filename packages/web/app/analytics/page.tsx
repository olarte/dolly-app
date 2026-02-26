import BackHeader from '@/components/layout/BackHeader'
import BottomNav from '@/components/layout/BottomNav'

export default function AnalyticsPage() {
  return (
    <>
      <BackHeader price="$3,648.87" priceUp />

      <main className="px-5 pb-28">
        {/* Title */}
        <section className="mt-2">
          <p className="text-xs font-semibold text-text-secondary tracking-wider">
            NOTICIAS Y ANÁLISIS
          </p>
        </section>

        {/* Live Price */}
        <section className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sube-green text-sm">↗</span>
            <span className="text-4xl font-bold tabular-nums text-text-primary">
              $3,648.87
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-text-muted tabular-nums">$3,645.87</span>
            <span className="text-sm text-sube-green font-semibold tabular-nums">
              +0.08%
            </span>
          </div>
        </section>

        {/* Price Chart Placeholder */}
        <section className="mt-5">
          <div className="bg-white/80 rounded-2xl p-4 shadow-card">
            <div className="h-40 flex items-center justify-center border border-dashed border-black/10 rounded-xl">
              <span className="text-xs text-text-muted">
                Price chart — Session 4
              </span>
            </div>
            {/* Time Range Selector */}
            <div className="flex gap-2 mt-3">
              {['1D', '5D', '1W', '1M', '1Y', '5Y', 'ALL'].map((range) => (
                <button
                  key={range}
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    range === '1D'
                      ? 'bg-text-primary text-white'
                      : 'bg-black/5 text-text-secondary'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Key News */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-text-primary tracking-wider mb-4">
            NOTICIAS CLAVES
          </h2>
          <div className="space-y-4">
            {[
              {
                flag: '🇺🇸',
                title: 'Fed mantiene tasas, pregunta más tiempo...',
                preview:
                  'La Reserva Federal decidió mantener las tasas de interés sin cambios por tercera reunión consecutiva.',
                time: '2h',
                comments: 12,
              },
              {
                flag: '🇨🇴',
                title: 'Fed mantiene tasas, pregunta más tiempo...',
                preview:
                  'El Banco de la República señaló que la inflación sigue por encima de la meta del 3%.',
                time: '4h',
                comments: 8,
              },
              {
                flag: '🇺🇸',
                title: 'Inflación y PIE caen en Marzo, buena de...',
                preview:
                  'Los datos de inflación de marzo muestran una desaceleración mayor a la esperada.',
                time: '6h',
                comments: 23,
              },
            ].map((news, i) => (
              <article
                key={i}
                className="bg-white/80 rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{news.flag}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {news.title}
                    </h3>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {news.preview}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                      <span>{news.time}</span>
                      <span>💬 {news.comments}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  )
}
