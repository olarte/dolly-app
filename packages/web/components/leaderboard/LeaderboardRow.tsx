import type { LeaderboardUser } from '@/hooks/useMockLeaderboardData'

interface LeaderboardRowProps {
  user: LeaderboardUser
}

export default function LeaderboardRow({ user }: LeaderboardRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-black/[0.04] last:border-0">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-black/[0.06] flex-shrink-0 flex items-center justify-center">
        <span className="text-[10px] font-medium text-text-muted">
          {user.name.slice(1, 3).toUpperCase()}
        </span>
      </div>

      {/* Name + flag */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text-primary truncate">
          {user.name} {user.flag}
        </p>
      </div>

      {/* Bets */}
      <span className="text-[12px] text-text-muted tabular-nums flex-shrink-0">
        © {user.bets}
      </span>

      {/* XP */}
      <span className="text-[12px] font-bold text-text-primary tabular-nums flex-shrink-0 w-14 text-right">
        {user.xp}xp
      </span>
    </div>
  )
}
