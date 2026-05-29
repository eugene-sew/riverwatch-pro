import React from 'react'
import { Warning, Siren, CheckCircle, ShieldCheck } from '@phosphor-icons/react'
import { format } from 'date-fns'

function alertClass(level) {
  const l = (level || 'SAFE').toUpperCase()
  if (l === 'CRITICAL') return 'alert-critical'
  if (l === 'DANGER')   return 'alert-danger'
  if (l === 'WARNING')  return 'alert-warning'
  if (l === 'WATCH')    return 'alert-watch'
  return 'alert-safe'
}

function AlertIcon({ level }) {
  const l = (level || '').toUpperCase()
  if (l === 'CRITICAL' || l === 'DANGER') return <Siren weight="duotone" size={14} color="#ef4444" />
  if (l === 'WARNING' || l === 'WATCH')   return <Warning weight="duotone" size={14} color="#f97316" />
  return <CheckCircle weight="duotone" size={14} color="#00d4aa" />
}

export default function AlertLog({ alerts = [] }) {
  return (
    <div className="panel alert-log-panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <Warning weight="duotone" size={14} color="#00d4aa" />
        SYSTEM ALERT LOG
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {(!alerts || alerts.length === 0) ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 8,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            padding: '24px 0',
          }}>
            <ShieldCheck weight="duotone" size={28} color="#00d4aa" />
            No alerts recorded
          </div>
        ) : (
          alerts.map((a, i) => {
            const ts = a.timestamp ? format(new Date(a.timestamp), 'HH:mm:ss') : '--'
            const lvl = a.level || a.alert || 'WATCH'
            return (
              <div key={`${a.timestamp}-${i}`} className="log-row">
                <AlertIcon level={lvl} />
                <span style={{ color: 'var(--text-secondary)', width: '60px', flexShrink: 0 }}>
                  [{ts}]
                </span>
                <span className={`level-badge ${alertClass(lvl)}`} style={{ marginRight: 8 }}>
                  {lvl}
                </span>
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                  {a.message || `Water reading at ${a.water?.toFixed(0) || '--'} cm`}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
