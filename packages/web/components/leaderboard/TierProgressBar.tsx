import { UI } from '@/lib/strings'

const TIERS = [
  { name: 'Bronze', icon: '🥉', minXp: 0 },
  { name: 'Silver', icon: '🥈', minXp: 100 },
  { name: 'Gold', icon: '🥇', minXp: 500 },
  { name: 'Diamond', icon: '💎', minXp: 2000 },
  { name: 'GOAT', icon: '🐐', minXp: 5000 },
] as const

interface TierProgressBarProps {
  userXp: number
  userTier: string
}

/**
 * Calculate progress percentage across 4 segments (between 5 tiers).
 * Each segment = 25% of the bar. Within each segment, XP interpolates linearly.
 */
function getProgressPercent(xp: number): number {
  const segments = TIERS.length - 1 // 4 segments
  const segmentWidth = 100 / segments // 25% each

  for (let i = segments; i >= 1; i--) {
    if (xp >= TIERS[i].minXp) {
      return i * segmentWidth
    }
    if (xp >= TIERS[i - 1].minXp) {
      const segmentStart = TIERS[i - 1].minXp
      const segmentEnd = TIERS[i].minXp
      const fraction = (xp - segmentStart) / (segmentEnd - segmentStart)
      return ((i - 1) + fraction) * segmentWidth
    }
  }
  return 0
}

export default function TierProgressBar({ userXp, userTier }: TierProgressBarProps) {
  const progressPercent = getProgressPercent(userXp)

  return (
    <section className="mt-5 bg-white/80 rounded-2xl p-4 shadow-card">
      {/* Tier icons above bar */}
      <div className="flex justify-between mb-2.5">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className="flex flex-col items-center"
          >
            <span className="text-lg leading-none">{tier.icon}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-black/[0.06] rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-nav-active rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Segment markers (dotted) */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-black/10"
            style={{ left: `${(i / 4) * 100}%` }}
          />
        ))}
      </div>

      {/* Position + XP */}
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[13px] text-text-secondary">
          {UI.leaderboard.yourPosition}: <span className="font-semibold text-text-primary">{userTier}</span>
        </span>
        <span className="text-[13px] font-bold text-sube-green tabular-nums">
          {userXp} {UI.leaderboard.xp}
        </span>
      </div>
    </section>
  )
}
