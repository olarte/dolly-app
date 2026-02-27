'use client'

import { useRef, useState, useCallback, type ReactNode } from 'react'
import { UI } from '@/lib/strings'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}

const THRESHOLD = 60

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0 && !refreshing) {
      startY.current = e.touches[0].clientY
      pulling.current = true
    }
  }, [refreshing])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.4, 100))
    }
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true)
      setPullDistance(40)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, onRefresh])

  const label = refreshing
    ? UI.refresh.loading
    : pullDistance >= THRESHOLD
      ? UI.refresh.release
      : UI.refresh.pulling

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullDistance > 10 ? pullDistance : 0 }}
      >
        <div className="flex items-center gap-2">
          {refreshing && (
            <div className="h-4 w-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
          )}
          <span className="text-xs text-text-muted font-medium">{label}</span>
        </div>
      </div>
      {children}
    </div>
  )
}
