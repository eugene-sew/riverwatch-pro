import React from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from 'recharts'
import { format } from 'date-fns'
import { getAlertStyle } from '../utils/alertColors'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const rr = d.riseRate
  return (
    <div style={{
      background: '#0d1b2a',
      border: '1px solid #1e3a5f',
      padding: '10px 14px',
      borderRadius: '8px',
      fontSize: '13px',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: '4px' }}>{d.ts}</div>
      <div style={{ color: '#00d4aa', fontFamily: 'Courier New, monospace', fontWeight: 600 }}>
        {d.water} cm
      </div>
      {rr !== undefined && (
        <div style={{ color: '#38bdf8', fontFamily: 'Courier New, monospace', fontSize: '12px', marginTop: '2px' }}>
          {rr > 0 ? '↑' : rr < 0 ? '↓' : '→'} {Math.abs(rr).toFixed(2)} cm/min
        </div>
      )}
    </div>
  )
}

export default function WaterLevelChart({ history, latestAlert }) {
  const style = getAlertStyle(latestAlert)
  const data = [...history].reverse().slice(-100).map((r) => ({
    ts: r.timestamp ? format(new Date(r.timestamp), 'HH:mm:ss') : '',
    water: r.water ?? 0,
    riseRate: r.rise_rate ?? r.riseRate ?? 0,
  }))

  return (
    <div className="card">
      <div className="card-title">💧 Water Level History</div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
          <XAxis
            dataKey="ts"
            tick={{ fill: '#64748b', fontSize: 11 }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            unit=" cm"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#38bdf8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            unit=" cm/m"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
          <ReferenceLine yAxisId="left" y={20} stroke="#ca8a04" strokeDasharray="4 4" label={{ value: 'WATCH 20cm',    fill: '#ca8a04', fontSize: 10 }} />
          <ReferenceLine yAxisId="left" y={40} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'WARNING 40cm',  fill: '#f97316', fontSize: 10 }} />
          <ReferenceLine yAxisId="left" y={60} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'DANGER 60cm',   fill: '#ef4444', fontSize: 10 }} />
          <ReferenceLine yAxisId="left" y={75} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'CRITICAL 75cm', fill: '#dc2626', fontSize: 10 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="water"
            name="Water Level"
            stroke={style.border}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: style.border }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="riseRate"
            name="Rise Rate"
            stroke="#38bdf8"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4, fill: '#38bdf8' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
