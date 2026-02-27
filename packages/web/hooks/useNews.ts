'use client'

import { useQuery } from '@tanstack/react-query'

export interface NewsItem {
  id: string
  flag: string
  title: string
  preview: string
  timeAgo: string
  comments: number
}

export function useNews(country: string) {
  const query = useQuery<NewsItem[]>({
    queryKey: ['news', country],
    queryFn: async () => {
      const res = await fetch(`/api/news?country=${encodeURIComponent(country)}`)
      if (!res.ok) throw new Error('News fetch failed')
      return res.json()
    },
    staleTime: 60_000,
  })

  return {
    news: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
