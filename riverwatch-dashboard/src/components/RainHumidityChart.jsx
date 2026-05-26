import React from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

export default function RainHumidityChart({ history }) {
  const data = [...history].reverse().slice(-100).map((r) => ({
    ts: r.timestamp ? format(new Date(r.timestamp), 'HH:mm') : '',
    rainAnalog: r.rain_analog ?? r.rainAnalog ?? 0,
    humidity: r.humidity ?? 0,
  }))

  return (
    <div className="card">
      <div className="card-title">🌧 Rain &amp; Humidity</div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
          <XAxis dataKey="ts" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
          <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 4095]} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
          <Tooltip
            contentStyle={{ background: '#0d1b2a', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '13px' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px', paddingTop: '8px' }} />
          <Bar yAxisId="left" dataKey="rainAnalog" name="Rain ADC" fill="#3b82f6" opacity={0.7} radius={[2, 2, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity %" stroke="#00d4aa" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
