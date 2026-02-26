import BackHeader from '@/components/layout/BackHeader'
import BottomNav from '@/components/layout/BottomNav'

export default function MarketDetailPage() {
  return (
    <>
      <BackHeader price="$3,648.87" priceUp />

      <main className="px-5 pb-28">
        {/* Market Type Badge */}
        <section className="mt-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-xs font-semibold text-text-secondary tracking-wider">
                MERCADO MENSUAL
              </p>
              <p className="text-xs text-text-muted">MARZO, 2026</p>
            </div>
          </div>
        </section>

        {/* Market Question */}
        <section className="mt-4">
          <h1 className="text-xl font-bold text-text-primary leading-tight">
            ¿El dólar cerrará este mes más alto que el mes pasado?
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Precio de referencia TRM
          </p>
        </section>

        {/* Probability Chart Placeholder */}
        <section className="mt-5">
          <div className="bg-white/80 rounded-2xl p-4 shadow-card">
            <div className="flex justify-between text-sm font-semibold mb-3">
              <span className="text-sube-green">SUBE 65%</span>
              <span className="text-baja-red">BAJA 35%</span>
            </div>
            <div className="h-32 bg-gradient-to-b from-sube-bg to-baja-bg rounded-xl flex items-center justify-center">
              <span className="text-xs text-text-muted">
                Probability chart — Session 3
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              {['1D', '1W', '2W', 'ALL'].map((range) => (
                <button
                  key={range}
                  className="text-xs px-3 py-1 rounded-full bg-black/5 text-text-secondary font-medium"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SUBE / BAJA Cards */}
        <section className="flex gap-3 mt-5">
          <div className="flex-1 bg-sube-bg rounded-3xl p-5 text-center">
            <p className="text-sm font-semibold text-sube-green">SUBE ↗</p>
            <p className="text-3xl font-bold text-sube-green tabular-nums mt-2">
              1.58x
            </p>
            <p className="text-xs text-text-muted mt-2 tabular-nums">
              POOL: $1.0M
            </p>
          </div>
          <div className="flex-1 bg-baja-bg rounded-3xl p-5 text-center">
            <p className="text-sm font-semibold text-baja-red">BAJA ↘</p>
            <p className="text-3xl font-bold text-baja-red tabular-nums mt-2">
              2.38x
            </p>
            <p className="text-xs text-text-muted mt-2 tabular-nums">
              POOL: $1.0M
            </p>
          </div>
        </section>

        {/* Rules Section */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-text-primary tracking-wider mb-4">
            RULES
          </h2>
          <div className="space-y-3 text-sm text-text-secondary">
            <div className="flex justify-between">
              <span className="text-text-muted">Periodo</span>
              <span className="font-medium text-text-primary">Marzo 1-31, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Fecha de cierre</span>
              <span className="font-medium text-text-primary">Mar 31, 5:00PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Tiempo de resolución</span>
              <span className="font-medium text-text-primary">Abr 1, 10:00AM</span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-4 leading-relaxed">
            El mercado resuelve basado en la TRM oficial publicada por el Banco de la
            República de Colombia. SUBE gana si la TRM de cierre es mayor que la TRM de
            apertura del periodo. BAJA gana si es menor o igual.
          </p>
        </section>

        {/* Holders / Activity Tabs */}
        <section className="mt-8">
          <div className="flex border-b border-black/10">
            <button className="flex-1 py-3 text-sm font-semibold text-text-primary border-b-2 border-text-primary">
              HOLDERS
            </button>
            <button className="flex-1 py-3 text-sm font-semibold text-text-muted">
              ACTIVITY
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-sube-green font-semibold">SUBE ↗</span>
              <span className="tabular-nums">234 holders</span>
              <span className="tabular-nums text-text-muted">65%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-baja-red font-semibold">BAJA ↘</span>
              <span className="tabular-nums">126 holders</span>
              <span className="tabular-nums text-text-muted">35%</span>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  )
}
