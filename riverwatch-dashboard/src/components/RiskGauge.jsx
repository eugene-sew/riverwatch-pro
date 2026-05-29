import React from 'react'
import { ShieldAlert } from '@phosphor-icons/react'

function riskColor(score) {
  if (score >= 75) return '#dc2626' // critical
  if (score >= 50) return '#ef4444' // danger
  if (score >= 25) return '#f97316' // warning
  return '#00d4aa' // safe
}

export default function RiskGauge({ reading }) {
  const risk = reading?.risk ?? 0
  const color = riskColor(risk)

  // Derive constituent risk factors dynamically for visual display
  const water = reading?.water ?? 0
  const riseRate = reading?.riseRate ?? reading?.rise_rate ?? 0
  const humidity = reading?.humidity ?? 0
  const temp = reading?.temp ?? 0
  const rainAnalog = reading?.rain_analog ?? reading?.rainAnalog ?? 4095
  const isRaining = reading?.raining ?? (rainAnalog < 2500 ? 1 : 0)

  // Factor points (Must sum to roughly the risk score or be representative)
  const fWater = Math.round(Math.min(40, (water / 100) * 40))
  const fRise = Math.round(Math.max(0, Math.min(25, riseRate * 30)))
  const fRain = isRaining ? 15 : Math.round(Math.max(0, (4095 - rainAnalog) / 4095 * 15))
  const fHum = Math.round(Math.min(10, (humidity / 100) * 10))
  const fTemp = Math.round(Math.min(10, (Math.max(0, temp - 20) / 20) * 10))

  const factors = [
    { label: 'WATER HEAD', value: fWater, max: 40 },
    { label: 'RISE SURGE', value: fRise, max: 25 },
    { label: 'PRECIP AD',  value: fRain, max: 15 },
    { label: 'HUMIDITY',   value: fHum,  max: 10 },
    { label: 'THERMAL',    value: fTemp, max: 10 },
  ]

  // SVG Gauge calculations
  // Circle circumference is 2 * PI * r. With r = 34, C = 213.6
  // We want a 270 degree arc, so active length is 213.6 * 0.75 = 160.2
  const r = 34
  const c = 2 * Math.PI * r
  const arcLength = c * 0.75
  const strokeDashoffset = arcLength - (risk / 100) * arcLength

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <ShieldAlert weight="duotone" size={16} color="#00d4aa" />
        RISK MATRIX
      </div>
      <div className="panel-body risk-gauge-panel">
        <div className="risk-gauge-svg-wrap">
          <svg width="120" height="96" viewBox="0 0 100 80">
            {/* Background Arc */}
            <circle
              cx="50"
              cy="45"
              r={r}
              fill="transparent"
              stroke="#1a3050"
              strokeWidth="6"
              strokeDasharray={`${arcLength} ${c}`}
              strokeLinecap="round"
              transform="rotate(135 50 45)"
            />
            {/* Foreground Indicator Arc */}
            <circle
              cx="50"
              cy="45"
              r={r}
              fill="transparent"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={`${arcLength} ${c}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(135 50 45)"
              style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
            />
            {/* Center Value */}
            <text
              x="50"
              y="44"
              textAnchor="middle"
              fill="#e8f4f8"
              fontSize="18"
              fontWeight="bold"
              fontFamily="var(--font-mono)"
            >
              {risk}
            </text>
            <text
              x="50"
              y="56"
              textAnchor="middle"
              fill="var(--text-secondary)"
              fontSize="6"
              fontWeight="600"
              letterSpacing="0.5"
            >
              RISK INDEX
            </text>
          </svg>
        </div>

        {/* Breakdown Bars */}
        <div className="risk-factor-bars">
          {factors.map((f, i) => {
            const fillPct = (f.value / f.max) * 100
            return (
              <div key={i} className="factor-row">
                <span className="factor-label">{f.label}</span>
                <div className="factor-bar-track">
                  <div
                    className="factor-bar-fill"
                    style={{
                      width: `${fillPct}%`,
                      background: color,
                    }}
                  />
                </div>
                <span className="factor-pts">{f.value}/{f.max}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
