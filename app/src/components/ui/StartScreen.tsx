import { useGameStore } from '../../store/gameStore'

export function StartScreen() {
  const phase = useGameStore((s) => s.phase)
  const startPlaying = useGameStore((s) => s.startPlaying)
  const startEndless = useGameStore((s) => s.startEndless)

  if (phase !== 'start') return null

  return (
    <div className="overlay overlay-backdrop">
      <div className="overlay-title overlay-title--cyan">
        GHOST GRID
      </div>
      <div className="overlay-subtitle">
        NAVIGATE THE CORRUPTED SECTORS
      </div>
      <div className="overlay-button-group">
        <button className="overlay-button" onClick={startPlaying}>
          STORY MODE
        </button>
        <button className="overlay-button overlay-button--secondary" onClick={startEndless}>
          ENDLESS MODE
        </button>
      </div>
    </div>
  )
}
