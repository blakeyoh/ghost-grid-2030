import { useGameStore } from '../../store/gameStore'

export function VictoryScreen() {
  const phase = useGameStore((s) => s.phase)
  const score = useGameStore((s) => s.score)
  const storyHighScore = useGameStore((s) => s.storyHighScore)
  const resetGame = useGameStore((s) => s.resetGame)
  const startPlaying = useGameStore((s) => s.startPlaying)

  if (phase !== 'extracted') return null

  const isNewBest = score > 0 && score >= storyHighScore
  const hasPrevBest = storyHighScore > 0 && !isNewBest

  const handleRestart = () => {
    resetGame()
    startPlaying()
  }

  const handleMenu = () => resetGame()

  return (
    <div className="overlay overlay-backdrop">
      <div className="overlay-title overlay-title--gold">
        SYSTEM PURGED
      </div>
      <div className="overlay-subtitle">
        ALL SECTORS CLEAN — PROC-7 ONLINE
      </div>
      {score > 0 && (
        <div className="overlay-score-display">
          <div className="overlay-score-label">FINAL SCORE</div>
          <div className="overlay-score-value">{score.toLocaleString()}</div>
          {isNewBest && <div className="overlay-score-best">NEW BEST</div>}
          {hasPrevBest && (
            <div className="overlay-score-sector">
              BEST: {storyHighScore.toLocaleString()}
            </div>
          )}
        </div>
      )}
      <div className="overlay-button-group">
        <button className="overlay-button" onClick={handleRestart}>
          RESTART SEQUENCE
        </button>
        <button className="overlay-button overlay-button--secondary" onClick={handleMenu}>
          MAIN MENU
        </button>
      </div>
    </div>
  )
}
