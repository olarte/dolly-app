import type { NewsItem } from '@/hooks/useNews'
import { UI } from '@/lib/strings'

interface NewsFeedProps {
  news: NewsItem[]
}

export default function NewsFeed({ news }: NewsFeedProps) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-text-primary tracking-wider text-center mb-5">
        {UI.analytics.keyNews}
      </h2>
      <div className="divide-y divide-black/[0.06]">
        {news.map((item) => (
          <article key={item.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex gap-3">
              {/* Flag + content */}
              <span className="text-base mt-0.5 shrink-0">{item.flag}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold text-text-primary leading-snug">
                  {item.title}
                </h3>
                <p className="text-[13px] text-text-muted mt-1 leading-relaxed line-clamp-3">
                  {item.preview}
                </p>
              </div>
              {/* Time ago — right-aligned */}
              <span className="text-[12px] text-text-muted shrink-0 mt-0.5">
                {item.timeAgo}
              </span>
            </div>
            {/* Comment count — bottom right */}
            <div className="flex justify-end mt-1.5">
              <span className="text-[12px] text-text-muted">
                💬 {item.comments}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
