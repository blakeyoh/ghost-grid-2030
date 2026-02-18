import { useGameStore } from '../../store/gameStore'
import { getSectorConfig } from '../../logic/sectorConfig'

function getDecodeCycleClass(cycles: number): string {
  if (cycles >= 3) return 'hud-stat--green'
  if (cycles >= 1) return 'hud-stat--amber'
  return 'hud-stat--red'
}

export function HUD() {
  const phase = useGameStore((s) => s.phase)
  const sector = useGameStore((s) => s.sector)
  const decodeCycles = useGameStore((s) => s.decodeCycles)
  const grid = useGameStore((s) => s.grid)

  if (phase !== 'playing' && phase !== 'decoding') return null

  const config = getSectorConfig(sector)
  const totalICE = grid.flat().filter((t) => t.isICE).length
  const taggedCount = grid.flat().filter((t) => t.isTagged).length

  return (
    <div className="hud">
      <div className="hud-stats">
        <div className={`hud-stat ${getDecodeCycleClass(decodeCycles)}`}>
          DECODE CYCLES: {decodeCycles}
        </div>
        <div className="hud-stat hud-stat--cyan">
          ICE DETECTED: {totalICE}
        </div>
        {taggedCount > 0 && (
          <div className="hud-stat hud-stat--amber">
            TAGGED: {taggedCount}
          </div>
        )}
      </div>

      <div className="hud-sector">
        <div>SECTOR {sector}/3</div>
        <div className="hud-sector-name">{config.name}</div>
      </div>

      <div className="hud-instructions">
        CLICK: REVEAL &nbsp;|&nbsp; RIGHT-CLICK: TAG &nbsp;|&nbsp; SHIFT+CLICK: DECODE
      </div>
    </div>
  )
}
