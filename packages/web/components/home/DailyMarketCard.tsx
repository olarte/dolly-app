interface DailyMarketCardProps {
  question: string
}

export default function DailyMarketCard({ question }: DailyMarketCardProps) {
  return (
    <h1 className="text-[26px] font-bold text-text-primary leading-tight mt-6 px-1">
      {question}
    </h1>
  )
}
