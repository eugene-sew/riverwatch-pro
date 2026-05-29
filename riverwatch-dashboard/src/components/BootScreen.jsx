import React, { useEffect, useState } from 'react'

export default function BootScreen({ onDone }) {
  const [phase, setPhase] = useState('typing') // typing | progress | fadingOut

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('progress'), 800)
    const t2 = setTimeout(() => setPhase('fadingOut'), 1400)
    const t3 = setTimeout(() => onDone(), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div className={`boot-screen ${phase === 'fadingOut' ? 'boot-fade-out' : ''}`}>
      <div className="boot-title boot-typewriter">RIVERWATCH PRO</div>
      <div className="boot-subtitle">INITIALISING SENSORS...</div>
      {phase !== 'typing' && (
        <div className="boot-progress-track">
          <div className="boot-progress-fill" />
        </div>
      )}
    </div>
  )
}
