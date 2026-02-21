import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'

const BASE_SPEED = 0.8
const MAX_SPEED = 2.5
const SPEED_INCREMENT = 0.15
const SAFE_ZONE_START = 0.45
const SAFE_ZONE_END = 0.55

type DecodeState = 'ready' | 'running' | 'result'

export function DecodeMinigame() {
  const phase = useGameStore((s) => s.phase)
  const clearedICE = useGameStore((s) => s.clearedICE)
  const completeDecode = useGameStore((s) => s.completeDecode)

  const [decodeState, setDecodeState] = useState<DecodeState>('ready')
  const [indicatorPos, setIndicatorPos] = useState(0)
  const [success, setSuccess] = useState(false)
  const directionRef = useRef(1)
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const speed = Math.min(MAX_SPEED, BASE_SPEED + clearedICE * SPEED_INCREMENT)

  useEffect(() => {
    if (phase === 'decoding') {
      setDecodeState('ready')
      setIndicatorPos(0)
      setSuccess(false)
      directionRef.current = 1
    }
  }, [phase])

  useEffect(() => {
    if (decodeState !== 'running') return

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time
      const delta = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      setIndicatorPos((prev) => {
        const next = prev + directionRef.current * speed * delta
        if (next >= 1) {
          directionRef.current = -1
          return 1
        }
        if (next <= 0) {
          directionRef.current = 1
          return 0
        }
        return next
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }

    lastTimeRef.current = 0
    animFrameRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animFrameRef.current)
  }, [decodeState, speed])

  const handleAction = useCallback(() => {
    if (decodeState === 'ready') {
      setDecodeState('running')
      return
    }

    if (decodeState === 'running') {
      cancelAnimationFrame(animFrameRef.current)
      const isInSafeZone =
        indicatorPos >= SAFE_ZONE_START && indicatorPos <= SAFE_ZONE_END
      setSuccess(isInSafeZone)
      setDecodeState('result')
      return
    }

    if (decodeState === 'result') {
      completeDecode(success)
    }
  }, [decodeState, indicatorPos, success, completeDecode])

  useEffect(() => {
    if (phase !== 'decoding') return

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyE') {
        e.preventDefault()
        handleAction()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, handleAction])

  if (phase !== 'decoding') return null

  const isInSafe =
    indicatorPos >= SAFE_ZONE_START && indicatorPos <= SAFE_ZONE_END

  const indicatorClass =
    decodeState === 'result'
      ? success
        ? 'decode-indicator--success'
        : 'decode-indicator--fail'
      : isInSafe
        ? 'decode-indicator--safe'
        : 'decode-indicator--danger'

  return (
    <div
      className="decode-overlay"
      onClick={handleAction}
      onTouchStart={(e) => { e.preventDefault(); handleAction() }}
    >
      <div className="decode-title">
        {decodeState === 'result'
          ? success
            ? 'SIGNAL LOCKED'
            : 'DECODE FAILED'
          : 'DECODE SEQUENCE'}
      </div>

      <div className="decode-bar-container">
        <div
          className="decode-safe-zone"
          style={{
            left: `${SAFE_ZONE_START * 100}%`,
            width: `${(SAFE_ZONE_END - SAFE_ZONE_START) * 100}%`,
          }}
        />
        <div
          className={`decode-indicator ${indicatorClass}`}
          style={{ left: `${indicatorPos * 100}%` }}
        />
      </div>

      {decodeState === 'ready' && (
        <div className="decode-prompt">
          PRESS SPACE OR CLICK TO START
        </div>
      )}
      {decodeState === 'running' && (
        <div className="decode-prompt">
          PRESS SPACE OR CLICK TO LOCK SIGNAL
        </div>
      )}
      {decodeState === 'result' && (
        <>
          <div
            className={`decode-result ${success ? 'decode-result--success' : 'decode-result--fail'}`}
          >
            {success ? 'NODE NEUTRALIZED' : 'DETONATION'}
          </div>
          <div className="decode-prompt">
            PRESS SPACE OR CLICK TO CONTINUE
          </div>
        </>
      )}
    </div>
  )
}
