import React from 'react'

export default function SensorCard({ title, value, unit, icon, subtitle, borderColor }) {
  return (
    <div className="card" style={{ borderTopColor: borderColor || '#00d4aa' }}>
      <span className="card-icon">{icon}</span>
      <div className="card-title">{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span className="card-value">{value ?? '--'}</span>
        {unit && <span className="card-unit">{unit}</span>}
      </div>
      {subtitle !== undefined && (
        <div className="card-subtitle">{subtitle}</div>
      )}
    </div>
  )
}
