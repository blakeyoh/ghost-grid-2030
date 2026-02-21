import { useMemo } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getSectorConfig, generateEndlessSector } from '../../logic/sectorConfig'

export function HUD() {
  const phase = useGameStore((s) => s.phase)
  const sector = useGameStore((s) => s.sector)
  const decodeCycles = useGameStore((s) => s.decodeCycles)
  const grid = useGameStore((s) => s.grid)
  const mode = useGameStore((s) => s.mode)
  const score = useGameStore((s) => s.score)
  const highScore = useGameStore((s) => s.highScore)
  const decodeMode = useGameStore((s) => s.decodeMode)
  const pauseGame = useGameStore((s) => s.pauseGame)
  const enterDecodeMode = useGameStore((s) => s.enterDecodeMode)

  const config = useMemo(() => {
    return mode === 'endless' && sector > 3
      ? generateEndlessSector(sector)
      : getSectorConfig(sector)
  }, [mode, sector])

  const { remainingFaults, taggedCount } = useMemo(() => {
    let faults = 0
    let tagged = 0
    for (const row of grid) {
      for (const t of row) {
        if (t.isICE && !t.isRevealed && !t.isDecoded) faults++
        if (t.isTagged) tagged++
      }
    }
    return { remainingFaults: faults, taggedCount: tagged }
  }, [grid])

  if (phase !== 'playing' && phase !== 'decoding') return null

  return (
    <div className="hud">
      <div className="hud-stats">
        {taggedCount > 0 && (
          <div className="hud-stat hud-stat--amber">
            TAGGED: {taggedCount}
          </div>
        )}
        {mode === 'endless' && (
          <>
            <div className="hud-stat hud-stat--cyan">
              SCORE: {score.toLocaleString()}
            </div>
            {highScore > 0 && (
              <div className="hud-stat hud-stat--amber">
                BEST: {highScore.toLocaleString()}
              </div>
            )}
          </>
        )}
      </div>

      <div className="hud-sector">
        {mode === 'story' ? (
          <div>SECTOR {sector}/3</div>
        ) : (
          <div>SECTOR {sector}</div>
        )}
        <div className="hud-sector-name">{config.name}</div>
      </div>

      {/* Icon action bar */}
      <div className="hud-action-bar">
        <button
          className={`hud-action-btn ${decodeMode ? 'hud-action-btn--active' : ''} ${decodeCycles <= 0 ? 'hud-action-btn--disabled' : ''}`}
          onClick={enterDecodeMode}
          disabled={phase !== 'playing' || decodeCycles <= 0}
        >
          <span className="hud-action-icon">&#x2B21;</span>
          <span className="hud-action-label">DECODE</span>
          <span className="hud-action-count">{decodeCycles}</span>
        </button>

        <div className="hud-action-btn hud-action-btn--info">
          <span className="hud-action-icon">&#x26A0;</span>
          <span className="hud-action-label">FAULTS</span>
          <span className="hud-action-count">{remainingFaults}</span>
        </div>

        <div className="hud-action-btn hud-action-btn--disabled">
          <span className="hud-action-icon">&#x26A1;</span>
          <span className="hud-action-label">EMP</span>
          <span className="hud-action-count">&mdash;</span>
        </div>
      </div>

      {phase === 'playing' && (
        <button className="hud-pause-btn" onClick={pauseGame}>
          &#x275A;&#x275A;
        </button>
      )}
    </div>
  )
}
