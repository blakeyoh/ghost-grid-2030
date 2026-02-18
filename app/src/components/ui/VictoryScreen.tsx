import { useGameStore } from '../../store/gameStore'

export function VictoryScreen() {
  const phase = useGameStore((s) => s.phase)
  const resetGame = useGameStore((s) => s.resetGame)
  const startPlaying = useGameStore((s) => s.startPlaying)

  if (phase !== 'extracted') return null

  const handleRestart = () => {
    resetGame()
    startPlaying()
  }

  return (
    <div className="overlay overlay-backdrop">
      <div className="overlay-title overlay-title--gold">
        EXTRACTED
      </div>
      <div className="overlay-subtitle">
        ALL SECTORS CLEARED
      </div>
      <button className="overlay-button" onClick={handleRestart}>
        RE-ENTER THE GRID
      </button>
    </div>
  )
}
