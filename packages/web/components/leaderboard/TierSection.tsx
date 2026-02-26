import type { LeaderboardUser } from '@/hooks/useMockLeaderboardData'
import LeaderboardRow from './LeaderboardRow'

interface TierSectionProps {
  icon: string
  label: string
  users: LeaderboardUser[]
}

export default function TierSection({ icon, label, users }: TierSectionProps) {
  if (users.length === 0) return null

  return (
    <section className="mt-6">
      {/* Tier header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base leading-none">{icon}</span>
        <h3 className="text-[13px] font-bold text-text-primary tracking-wider uppercase">
          {label}
        </h3>
      </div>

      {/* User rows */}
      <div className="bg-white/70 rounded-2xl px-3 shadow-card">
        {users.map((user) => (
          <LeaderboardRow key={user.rank} user={user} />
        ))}
      </div>
    </section>
  )
}
