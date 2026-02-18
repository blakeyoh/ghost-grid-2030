import { useGameStore } from '../../store/gameStore'

export function DerezScreen() {
  const phase = useGameStore((s) => s.phase)
  const resetGame = useGameStore((s) => s.resetGame)
  const startPlaying = useGameStore((s) => s.startPlaying)

  if (phase !== 'derezzed') return null

  const handleRestart = () => {
    resetGame()
    startPlaying()
  }

  return (
    <div className="overlay overlay-backdrop">
      <div className="overlay-title overlay-title--red">
        DEREZZED
      </div>
      <div className="overlay-subtitle">
        ICE COUNTERMEASURE TRIGGERED
      </div>
      <button className="overlay-button" onClick={handleRestart}>
        REINITIALIZE
      </button>
    </div>
  )
}
