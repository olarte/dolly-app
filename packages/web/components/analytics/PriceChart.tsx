'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { PricePoint } from '@/hooks/useMockAnalyticsData'

const TIME_RANGES = ['1D', '5D', '1W', '1M', '1Y', '5Y', 'ALL'] as const

interface PriceChartProps {
  data: PricePoint[]
  volume: string
}

export default function PriceChart({ data, volume }: PriceChartProps) {
  const [activeRange, setActiveRange] = useState<string>('1D')

  // Calculate Y domain with some padding
  const prices = data.map((d) => d.price)
  const minPrice = Math.floor(Math.min(...prices) / 10) * 10
  const maxPrice = Math.ceil(Math.max(...prices) / 10) * 10

  // Filter to only ticks that have a label
  const xTicks = data
    .map((d, i) => (d.time ? i : null))
    .filter((i): i is number => i !== null)

  return (
    <section className="mt-5">
      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 50, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2e7d32" />
                <stop offset="100%" stopColor="#2e7d32" />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#999999' }}
              ticks={xTicks.map((i) => data[i].time)}
              interval="preserveStartEnd"
            />
            <YAxis
              orientation="right"
              domain={[minPrice, maxPrice]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#999999' }}
              tickFormatter={(v: number) =>
                `$${v.toLocaleString('es-CO')}`
              }
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              formatter={((value: number) => [
                `$${value.toLocaleString('es-CO')}`,
                'Precio',
              ]) as never}
              labelStyle={{ fontSize: '11px', color: '#999' }}
            />
            <Line
              type="linear"
              dataKey="price"
              stroke="#2e7d32"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#2e7d32', strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Dashed separator */}
      <div className="border-t border-dashed border-black/10 mx-0 mt-2" />

      {/* Info row: volume left, time range pills right */}
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
    </section>
  )
}
