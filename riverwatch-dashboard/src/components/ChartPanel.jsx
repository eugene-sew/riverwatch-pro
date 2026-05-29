import React from 'react'
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend
} from 'recharts'
import { format } from 'date-fns'
import { ChartLineUp } from '@phosphor-icons/react'

const THRESHOLDS = [
  { level: 75, stroke: '#dc2626', label: 'CRITICAL (75cm)' },
  { level: 60, stroke: '#ef4444', label: 'DANGER (60cm)' },
  { level: 40, stroke: '#f97316', label: 'WARNING (40cm)' },
]

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const ts = data.timestamp ? format(new Date(data.timestamp), 'HH:mm:ss') : '--'
    const water = data.water !== undefined ? `${data.water.toFixed(1)} cm` : '--'
    const riseRate = data.rise_rate ?? data.riseRate ?? 0
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-bright)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
      }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>TIME: {ts}</div>
        <div style={{ color: '#00d4aa', fontWeight: 'bold' }}>WATER: {water}</div>
        <div style={{ color: '#60a5fa' }}>RISE RATE: {riseRate.toFixed(2)} cm/m</div>
      </div>
    )
  }
  return null
}

export default function ChartPanel({ history = [] }) {
  // Process history for Recharts (reverse to show chronological order left-to-right)
  const chartData = React.useMemo(() => {
    return [...history].reverse().map((r) => ({
      ...r,
      // Format timestamp for XAxis
      timeStr: r.timestamp ? format(new Date(r.timestamp), 'mm:ss') : '--',
      rise_rate_field: r.rise_rate ?? r.riseRate ?? 0,
    }))
  }, [history])

  return (
    <div className="panel chart-panel" style={{ height: '100%' }}>
      <div className="panel-header" style={{ marginBottom: 4 }}>
        <ChartLineUp weight="duotone" size={14} color="#00d4aa" />
        REAL-TIME HYDROGRAPH FEED
      </div>
      <div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00d4aa" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#0f2030" strokeDasharray="3 3" />
            <XAxis
              dataKey="timeStr"
              stroke="var(--text-muted)"
              fontSize={9}
              fontFamily="var(--font-mono)"
              tickLine={false}
            />
            {/* Left Y Axis for Water Level */}
            <YAxis
              yAxisId="left"
              stroke="#00d4aa"
              fontSize={9}
              fontFamily="var(--font-mono)"
              domain={[0, 100]}
              tickLine={false}
            />
            {/* Right Y Axis for Rise Rate */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#60a5fa"
              fontSize={9}
              fontFamily="var(--font-mono)"
              domain={[-1, 2]}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={20}
              iconSize={8}
              wrapperStyle={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                marginTop: -10,
              }}
            />

            {/* Threshold Reference Lines */}
            {THRESHOLDS.map((t) => (
              <ReferenceLine
                key={t.level}
                yAxisId="left"
                y={t.level}
                stroke={t.stroke}
                strokeDasharray="4 4"
                label={{
                  value: t.label,
                  fill: t.stroke,
                  fontSize: 7,
                  fontFamily: 'var(--font-mono)',
                  position: 'insideBottomRight'
                }}
              />
            ))}

            {/* Area for Water Level */}
            <Area
              yAxisId="left"
              type="monotone"
              name="Water Level (cm)"
              dataKey="water"
              stroke="#00d4aa"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorWater)"
            />

            {/* Line for Rise Rate */}
            <Line
              yAxisId="right"
              type="monotone"
              name="Rise Rate (cm/m)"
              dataKey="rise_rate_field"
              stroke="#60a5fa"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
