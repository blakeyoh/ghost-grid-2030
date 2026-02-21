import { useGameStore } from '../../store/gameStore'

export function DerezScreen() {
  const phase = useGameStore((s) => s.phase)
  const mode = useGameStore((s) => s.mode)
  const score = useGameStore((s) => s.score)
  const sector = useGameStore((s) => s.sector)
  const highScore = useGameStore((s) => s.highScore)
  const resetGame = useGameStore((s) => s.resetGame)
  const startPlaying = useGameStore((s) => s.startPlaying)
  const startEndless = useGameStore((s) => s.startEndless)

  if (phase !== 'derezzed') return null

  const handleRestart = () => {
    resetGame()
    if (mode === 'endless') {
      startEndless()
    } else {
      startPlaying()
    }
  }

  const handleMenu = () => resetGame()

  return (
    <div className="overlay overlay-backdrop">
      <div className="overlay-title overlay-title--red">
        PROC-7 OVERWRITTEN
      </div>
      <div className="overlay-subtitle">
        CORRUPTION SPREADING...
      </div>
      {mode === 'endless' && (
        <div className="overlay-score-display">
          <div className="overlay-score-label">FINAL SCORE</div>
          <div className="overlay-score-value">{score.toLocaleString()}</div>
          {score >= highScore && score > 0 && (
            <div className="overlay-score-best">NEW BEST</div>
          )}
          <div className="overlay-score-sector">REACHED SECTOR {sector}</div>
        </div>
      )}
      <div className="overlay-button-group">
        <button className="overlay-button" onClick={handleRestart}>
          REINITIALIZE PROCESS
        </button>
        <button className="overlay-button overlay-button--secondary" onClick={handleMenu}>
          MAIN MENU
        </button>
      </div>
    </div>
  )
}
