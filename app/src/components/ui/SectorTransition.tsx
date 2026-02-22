import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'

export function SectorTransition() {
  const phase = useGameStore((s) => s.phase)
  const sector = useGameStore((s) => s.sector)
  const advanceSector = useGameStore((s) => s.advanceSector)
  const [countdown, setCountdown] = useState(3)
  const hasAdvancedRef = useRef(false)

  useEffect(() => {
    if (phase !== 'transitioning') return

    hasAdvancedRef.current = false
    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (!hasAdvancedRef.current) {
            hasAdvancedRef.current = true
            advanceSector()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, advanceSector])

  if (phase !== 'transitioning') return null

  return (
    <div className="overlay overlay-backdrop">
      <div className="overlay-title overlay-title--cyan">
        SECTOR {sector} PURGED
      </div>
      <div className="overlay-subtitle">
        RESTORE PORT REACHED — ADVANCING
      </div>
      <div
        style={{
          fontSize: 'clamp(40px, 8vw, 80px)',
          fontWeight: 900,
          color: '#00ffff',
          textShadow: '0 0 30px #00ffff, 0 0 60px #00ffff',
          fontFamily: "'Orbitron', sans-serif",
        }}
      >
        {countdown}
      </div>
    </div>
  )
}
