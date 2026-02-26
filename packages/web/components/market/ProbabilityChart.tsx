'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { ProbabilityPoint } from '@/hooks/useMockMarketDetail'
import { UI } from '@/lib/strings'

const TIME_RANGES = ['1D', '1W', '2W', 'ALL'] as const

interface ProbabilityChartProps {
  data: ProbabilityPoint[]
  subePercent: number
  bajaPercent: number
  volume: string
}

export default function ProbabilityChart({
  data,
  subePercent,
  bajaPercent,
  volume,
}: ProbabilityChartProps) {
  const [activeRange, setActiveRange] = useState<string>('1W')

  return (
    <section className="mt-5">
      <div className="bg-white/80 rounded-2xl p-4 shadow-card overflow-hidden">
        {/* Chart area — stacked 100% area: green sube on top, red baja on bottom */}
        <div className="relative">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="probSuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2e7d32" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2e7d32" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="probBaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e53935" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#e53935" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                  hide
                />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  formatter={((value: number, name: string) => [
                    `${value}%`,
                    name === 'sube' ? 'SUBE' : 'BAJA',
                  ]) as never}
                  labelStyle={{ fontSize: '11px', color: '#999' }}
                />
                <Area
                  type="natural"
                  dataKey="sube"
                  stackId="prob"
                  stroke="#2e7d32"
                  strokeWidth={2}
                  fill="url(#probSuGrad)"
                  isAnimationActive={false}
                />
                <Area
                  type="natural"
                  dataKey="baja"
                  stackId="prob"
                  stroke="#e53935"
                  strokeWidth={2}
                  fill="url(#probBaGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Right-edge percentage labels overlaid on chart */}
          <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between py-3 pointer-events-none">
            <span className="text-[11px] font-bold text-sube-green bg-white/70 rounded px-1">
              {UI.market.sube} {subePercent}%
            </span>
            <span className="text-[11px] font-bold text-baja-red bg-white/70 rounded px-1">
              {UI.market.baja} {bajaPercent}%
            </span>
          </div>
        </div>

        {/* Bottom row: volume left, time ranges right */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-[11px] text-text-muted tabular-nums font-medium">
            {volume} VOL
          </p>
          <div className="flex gap-1.5">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-colors ${
                  activeRange === range
                    ? 'bg-text-primary text-white'
                    : 'bg-black/[0.04] text-text-muted'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
