import { UI } from '@/lib/strings'
import type { LeaderboardUser } from '@/hooks/useMockLeaderboardData'

interface TopThreePodiumProps {
  /** Must be [2nd, 1st, 3rd] order */
  users: [LeaderboardUser, LeaderboardUser, LeaderboardUser]
}

function RankBadge({ rank }: { rank: number }) {
  const label = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'
  return (
    <span className="text-[10px] font-bold text-text-muted">
      {label}
    </span>
  )
}

export default function TopThreePodium({ users }: TopThreePodiumProps) {
  return (
    <section className="mt-8">
      <h2 className="text-[13px] font-bold text-text-primary tracking-wider text-center mb-5 uppercase">
        {UI.leaderboard.thisWeek}
      </h2>

      <div className="flex items-end justify-center gap-4">
        {users.map((user) => {
          const isFirst = user.rank === 1
          return (
            <div
              key={user.rank}
              className={`flex flex-col items-center ${
                isFirst
                  ? 'order-2 -mt-4'
                  : user.rank === 2
                    ? 'order-1'
                    : 'order-3'
              }`}
              style={{ width: isFirst ? 100 : 85 }}
            >
              {/* Avatar circle */}
              <div
                className={`rounded-full bg-black/[0.06] flex items-center justify-center ${
                  isFirst ? 'w-[72px] h-[72px]' : 'w-14 h-14'
                }`}
              >
                <RankBadge rank={user.rank} />
              </div>

              {/* Name + flag */}
              <p className="text-[12px] font-bold text-text-primary mt-2 text-center leading-tight">
                {user.name}
              </p>
              <p className="text-[11px] text-text-muted leading-none mt-0.5">
                {user.flag}
              </p>

              {/* Stats */}
              <p className="text-[10px] text-text-muted tabular-nums mt-1">
                © {user.bets} · {user.xp}xp
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
