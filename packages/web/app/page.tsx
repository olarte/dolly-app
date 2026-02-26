import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="px-5 pb-28">
        {/* Live Price Section */}
        <section className="mt-2">
          <p className="text-xs font-semibold text-text-secondary tracking-wider">
            DOLAR EN VIVO
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sube-green text-sm">↗</span>
            <span className="text-4xl font-bold tabular-nums text-text-primary">
              $3,648.87
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-text-muted">
              APERTURA{' '}
              <span className="text-sube-green font-semibold tabular-nums">
                ↗$3,645.87
              </span>
            </p>
            <p className="text-xs text-text-muted">
              CIERRA EN{' '}
              <span className="font-semibold text-text-primary tabular-nums">
                02:13:45PM
              </span>
            </p>
          </div>
        </section>

        {/* Market Question */}
        <section className="mt-6">
          <h1 className="text-heading text-text-primary leading-tight">
            ¿Cierra hoy más alto que la apertura?
          </h1>
        </section>

        {/* SUBE / BAJA Multiplier Cards */}
        <section className="flex gap-3 mt-5">
          {/* SUBE Card */}
          <div className="flex-1 bg-sube-bg rounded-3xl p-5 text-center">
            <p className="text-sm font-semibold text-sube-green">
              SUBE ↗
            </p>
            <p className="text-display-sm text-sube-green tabular-nums mt-2">
              1.58x
            </p>
            <p className="text-xs text-text-muted mt-2 tabular-nums">
              POOL: $1.2M
            </p>
          </div>

          {/* BAJA Card */}
          <div className="flex-1 bg-baja-bg rounded-3xl p-5 text-center">
            <p className="text-sm font-semibold text-baja-red">
              BAJA ↘
            </p>
            <p className="text-display-sm text-baja-red tabular-nums mt-2">
              2.38x
            </p>
            <p className="text-xs text-text-muted mt-2 tabular-nums">
              POOL: $1.2M
            </p>
          </div>
        </section>

        {/* Markets Carousel */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-text-secondary tracking-wider mb-3">
            MARKETS
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5">
            {[
              { type: 'SEMANAL', date: 'FEB20', sube: '1.58x', baja: '2.34x' },
              { type: 'MENSUAL', date: 'FEB29', sube: '1.58x', baja: '2.34x' },
              { type: 'ELECCIONES', date: 'MAR15', sube: '1.58x', baja: '2.34x' },
            ].map((market) => (
              <div
                key={market.type}
                className="min-w-[140px] bg-white/90 rounded-2xl p-4 shadow-card flex-shrink-0"
              >
                <p className="text-xs font-semibold text-text-primary">
                  {market.type}
                </p>
                <div className="flex gap-2 mt-2 text-xs tabular-nums">
                  <span className="text-sube-green font-semibold">{market.sube}</span>
                  <span className="text-baja-red font-semibold">{market.baja}</span>
                </div>
                <p className="text-[10px] text-text-muted mt-1">{market.date}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  )
}
