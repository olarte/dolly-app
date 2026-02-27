const bar = 'animate-skeleton bg-black/[0.06] rounded-xl'

export function SkeletonLivePrice() {
  return (
    <div className="bg-white/80 rounded-3xl p-6 mt-4">
      <div className="flex flex-col items-center gap-3">
        <div className={`${bar} h-3 w-28`} />
        <div className={`${bar} h-10 w-44`} />
        <div className={`${bar} h-3 w-36`} />
      </div>
    </div>
  )
}

export function SkeletonMultiplierCards() {
  return (
    <div className="flex gap-3 mt-4">
      <div className="flex-1 bg-white/80 rounded-3xl p-5">
        <div className={`${bar} h-3 w-16 mb-3`} />
        <div className={`${bar} h-8 w-20 mb-2`} />
        <div className={`${bar} h-3 w-24`} />
      </div>
      <div className="flex-1 bg-white/80 rounded-3xl p-5">
        <div className={`${bar} h-3 w-16 mb-3`} />
        <div className={`${bar} h-8 w-20 mb-2`} />
        <div className={`${bar} h-3 w-24`} />
      </div>
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-white/80 rounded-3xl p-5 mt-5">
      <div className={`${bar} h-48 w-full`} />
      <div className="flex justify-between mt-3">
        <div className={`${bar} h-3 w-16`} />
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${bar} h-6 w-8`} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonNewsFeed() {
  return (
    <div className="mt-8 space-y-4">
      <div className={`${bar} h-5 w-40 mx-auto`} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 py-3">
          <div className={`${bar} h-5 w-5 shrink-0 rounded-full`} />
          <div className="flex-1 space-y-2">
            <div className={`${bar} h-4 w-full`} />
            <div className={`${bar} h-3 w-3/4`} />
            <div className={`${bar} h-3 w-1/2`} />
          </div>
          <div className={`${bar} h-3 w-10 shrink-0`} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonLeaderboard() {
  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-white/80 rounded-3xl p-5 mt-4">
        <div className={`${bar} h-3 w-full`} />
        <div className="flex justify-between mt-2">
          <div className={`${bar} h-3 w-24`} />
          <div className={`${bar} h-3 w-16`} />
        </div>
      </div>
      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mt-4">
        <div className="flex flex-col items-center gap-2">
          <div className={`${bar} h-14 w-14 !rounded-full`} />
          <div className={`${bar} h-3 w-16`} />
        </div>
        <div className="flex flex-col items-center gap-2 -mt-4">
          <div className={`${bar} h-[72px] w-[72px] !rounded-full`} />
          <div className={`${bar} h-3 w-20`} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className={`${bar} h-14 w-14 !rounded-full`} />
          <div className={`${bar} h-3 w-16`} />
        </div>
      </div>
      {/* Rows */}
      <div className="space-y-2 mt-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 bg-white/80 rounded-2xl p-3">
            <div className={`${bar} h-10 w-10 !rounded-full shrink-0`} />
            <div className="flex-1 space-y-1.5">
              <div className={`${bar} h-3 w-24`} />
              <div className={`${bar} h-2.5 w-16`} />
            </div>
            <div className={`${bar} h-3 w-12`} />
          </div>
        ))}
      </div>
    </div>
  )
}
