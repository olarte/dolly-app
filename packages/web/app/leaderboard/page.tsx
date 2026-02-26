import BackHeader from '@/components/layout/BackHeader'
import BottomNav from '@/components/layout/BottomNav'

const TIERS = [
  { name: 'Bronze', icon: '🥉', minXp: 0 },
  { name: 'Silver', icon: '🥈', minXp: 100 },
  { name: 'Gold', icon: '🥇', minXp: 500 },
  { name: 'Diamond', icon: '💎', minXp: 2000 },
  { name: 'GOAT', icon: '🐐', minXp: 5000 },
] as const

const TOP_THREE = [
  { rank: 2, name: '@CairoChad', flag: '🇪🇬', bets: 312, xp: 4820 },
  { rank: 1, name: '@MarketHawk', flag: '🇪🇬', bets: 450, xp: 5930 },
  { rank: 3, name: '@EkoNavigator', flag: '🇳🇬', bets: 289, xp: 4210 },
]

const GOATS = [
  { rank: 4, name: '@CairoChad', flag: '🇪🇬', bets: 240, xp: 3930 },
  { rank: 5, name: '@LagosKing', flag: '🇳🇬', bets: 198, xp: 3450 },
]

const DIAMOND = [
  { rank: 6, name: '@AndesBull', flag: '🇨🇴', bets: 180, xp: 2930 },
  { rank: 7, name: '@NilePharma', flag: '🇪🇬', bets: 165, xp: 2710 },
]

export default function LeaderboardPage() {
  const userXp = 347
  const userTier = 'Silver'

  return (
    <>
      <BackHeader price="$3,648.87" priceUp />

      <main className="px-5 pb-28">
        {/* Title + Illustration */}
        <section className="mt-2 text-center">
          <div className="text-4xl mb-2">🏆💰</div>
          <h1 className="text-lg font-bold text-text-primary">
            LEADERBOARD GLOBAL
          </h1>
        </section>

        {/* Tier Progress Bar */}
        <section className="mt-5 bg-white/80 rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">
              Your position: <span className="font-semibold text-text-primary">{userTier}</span>
            </span>
            <span className="text-sm font-bold text-sube-green tabular-nums">
              {userXp} xp
            </span>
          </div>
          {/* Progress bar */}
          <div className="relative h-2 bg-black/5 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-nav-active rounded-full"
              style={{ width: `${Math.min((userXp / 5000) * 100, 100)}%` }}
            />
          </div>
          {/* Tier icons */}
          <div className="flex justify-between mt-2">
            {TIERS.map((tier) => (
              <span
                key={tier.name}
                className="text-sm"
                title={tier.name}
              >
                {tier.icon}
              </span>
            ))}
          </div>
        </section>

        {/* Top 3 Podium */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-text-primary tracking-wider mb-4">
            THIS WEEK&apos;S TOP GOATS
          </h2>
          <div className="flex items-end justify-center gap-3">
            {TOP_THREE.map((user) => (
              <div
                key={user.rank}
                className={`flex flex-col items-center ${
                  user.rank === 1 ? 'order-2 -mt-4' : user.rank === 2 ? 'order-1' : 'order-3'
                }`}
              >
                <div
                  className={`rounded-full bg-gray-200 flex items-center justify-center ${
                    user.rank === 1 ? 'w-16 h-16' : 'w-12 h-12'
                  }`}
                >
                  <span className="text-xs text-text-muted">
                    {user.rank === 1 ? '1st' : user.rank === 2 ? '2nd' : '3rd'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-text-primary mt-2">
                  {user.name}
                </p>
                <p className="text-[10px] text-text-muted">
                  {user.flag}
                </p>
                <p className="text-[10px] text-text-muted tabular-nums">
                  © {user.bets} · {user.xp}xp
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* GOATS Section */}
        <section className="mt-8">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            GOATS 🐐
          </h3>
          <div className="space-y-2">
            {GOATS.map((user) => (
              <div
                key={user.rank}
                className="flex items-center gap-3 bg-white/80 rounded-2xl p-3 shadow-card"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {user.name} {user.flag}
                  </p>
                </div>
                <span className="text-xs text-text-muted tabular-nums">
                  © {user.bets}
                </span>
                <span className="text-xs font-semibold text-text-primary tabular-nums">
                  {user.xp}xp
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* DIAMOND Section */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            DIAMOND 💎
          </h3>
          <div className="space-y-2">
            {DIAMOND.map((user) => (
              <div
                key={user.rank}
                className="flex items-center gap-3 bg-white/80 rounded-2xl p-3 shadow-card"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {user.name} {user.flag}
                  </p>
                </div>
                <span className="text-xs text-text-muted tabular-nums">
                  © {user.bets}
                </span>
                <span className="text-xs font-semibold text-text-primary tabular-nums">
                  {user.xp}xp
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  )
}
