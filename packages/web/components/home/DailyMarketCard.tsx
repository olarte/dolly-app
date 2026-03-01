import Link from 'next/link'

interface DailyMarketCardProps {
  question: string
  marketId?: string
}

export default function DailyMarketCard({ question, marketId }: DailyMarketCardProps) {
  if (marketId) {
    return (
      <Link href={`/market/${marketId}`}>
        <h1 className="text-[26px] font-bold text-text-primary leading-tight mt-6 px-1 active:opacity-70 transition-opacity">
          {question}
          <span className="inline-block ml-2 text-lg text-text-muted">›</span>
        </h1>
      </Link>
    )
  }

  return (
    <h1 className="text-[26px] font-bold text-text-primary leading-tight mt-6 px-1">
      {question}
    </h1>
  )
}
