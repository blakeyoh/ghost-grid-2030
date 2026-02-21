import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

export function PauseScreen() {
  const phase = useGameStore((s) => s.phase)
  const mode = useGameStore((s) => s.mode)
  const score = useGameStore((s) => s.score)
  const pauseGame = useGameStore((s) => s.pauseGame)
  const resumeGame = useGameStore((s) => s.resumeGame)
  const resetGame = useGameStore((s) => s.resetGame)

  const [confirming, setConfirming] = useState(false)

  // ESC toggles pause / resume
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      if (phase === 'playing') {
        pauseGame()
        setConfirming(false)
      } else if (phase === 'paused') {
        resumeGame()
        setConfirming(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, pauseGame, resumeGame])

  if (phase !== 'paused') return null

  const handleEndGame = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    resetGame()
    setConfirming(false)
  }

  const handleResume = () => {
    resumeGame()
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="overlay overlay-backdrop">
        <div className="overlay-title overlay-title--amber">END GAME?</div>
        {mode === 'endless' && score > 0 && (
          <div className="overlay-score-display">
            <div className="overlay-score-label">CURRENT SCORE</div>
            <div className="overlay-score-value">{score.toLocaleString()}</div>
          </div>
        )}
        <div className="overlay-subtitle">PROGRESS WILL BE LOST</div>
        <div className="overlay-button-group">
          <button className="overlay-button overlay-button--danger" onClick={handleEndGame}>
            CONFIRM END
          </button>
          <button className="overlay-button overlay-button--secondary" onClick={() => setConfirming(false)}>
            CANCEL
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay overlay-backdrop">
      <div className="overlay-title overlay-title--cyan">PAUSED</div>

      <div className="pause-controls">
        <div className="pause-controls-title">HOW TO PLAY</div>
        <div className="pause-control-row">
          <span className="pause-control-key">CLICK</span>
          <span className="pause-control-desc">Reveal tile in PROC-7's scan zone</span>
        </div>
        <div className="pause-control-row">
          <span className="pause-control-key">DOUBLE-CLICK / DOUBLE-TAP</span>
          <span className="pause-control-desc">Move PROC-7 to any revealed tile</span>
        </div>
        <div className="pause-control-row">
          <span className="pause-control-key">RIGHT-CLICK / HOLD</span>
          <span className="pause-control-desc">Tag suspected FAULT NODE</span>
        </div>
        <div className="pause-control-row">
          <span className="pause-control-key">DECODE (HUD BUTTON)</span>
          <span className="pause-control-desc">Use decode cycle — then click a tile</span>
        </div>
        <div className="pause-control-row">
          <span className="pause-control-key">DRAG / SCROLL</span>
          <span className="pause-control-desc">Orbit and zoom camera</span>
        </div>
        <div className="pause-control-row">
          <span className="pause-control-key">ESC</span>
          <span className="pause-control-desc">Pause / resume</span>
        </div>
      </div>

      <div className="overlay-button-group">
        <button className="overlay-button" onClick={handleResume}>
          RESUME
        </button>
        <button className="overlay-button overlay-button--secondary" onClick={handleEndGame}>
          END GAME
        </button>
      </div>
    </div>
  )
}
