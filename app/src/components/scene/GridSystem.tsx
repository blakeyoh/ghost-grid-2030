import { useGameStore } from '../../store/gameStore'
import { GridCell } from './GridCell'
import { IOPort } from './IOPort'

export function GridSystem() {
  const grid = useGameStore((s) => s.grid)

  return (
    <group>
      {grid.flat().map((tile) => (
        <GridCell key={`${tile.x},${tile.y}`} tile={tile} />
      ))}
      <IOPort />
    </group>
  )
}
