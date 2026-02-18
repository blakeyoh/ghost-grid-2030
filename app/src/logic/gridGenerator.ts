import type { TileState } from '../store/types'

const SAFE_ZONE_SIZE = 2
const MIN_IO_PORT_DISTANCE = 8

function createEmptyGrid(size: number): TileState[][] {
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      x,
      y,
      isICE: false,
      adjacentICE: 0,
      isRevealed: false,
      isDecoded: false,
      isTagged: false,
      isIOPort: false,
    }))
  )
}

function isInSafeZone(x: number, y: number): boolean {
  return x < SAFE_ZONE_SIZE && y < SAFE_ZONE_SIZE
}

function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

function placeIOPort(grid: TileState[][], size: number): TileState[][] {
  const candidates: Array<{ x: number; y: number }> = []

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isInSafeZone(x, y)) continue
      if (manhattanDistance(x, y, 0, 0) >= MIN_IO_PORT_DISTANCE) {
        candidates.push({ x, y })
      }
    }
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)]

  return grid.map((row) =>
    row.map((tile) =>
      tile.x === chosen.x && tile.y === chosen.y
        ? { ...tile, isIOPort: true }
        : tile
    )
  )
}

function placeICE(grid: TileState[][], iceCount: number): TileState[][] {
  const size = grid.length
  const ioPort = grid.flat().find((t) => t.isIOPort)
  const placed = new Set<string>()
  let result = grid

  while (placed.size < iceCount) {
    const x = Math.floor(Math.random() * size)
    const y = Math.floor(Math.random() * size)
    const key = `${x},${y}`

    if (placed.has(key)) continue
    if (isInSafeZone(x, y)) continue
    if (ioPort && x === ioPort.x && y === ioPort.y) continue

    placed.add(key)
    result = result.map((row) =>
      row.map((tile) =>
        tile.x === x && tile.y === y ? { ...tile, isICE: true } : tile
      )
    )
  }

  return result
}

function calculateAdjacency(grid: TileState[][]): TileState[][] {
  const size = grid.length

  return grid.map((row) =>
    row.map((tile) => {
      let count = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = tile.x + dx
          const ny = tile.y + dy
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            if (grid[ny][nx].isICE) count++
          }
        }
      }
      return { ...tile, adjacentICE: count }
    })
  )
}

function revealSafeZone(grid: TileState[][]): TileState[][] {
  return grid.map((row) =>
    row.map((tile) =>
      isInSafeZone(tile.x, tile.y) ? { ...tile, isRevealed: true } : tile
    )
  )
}

export function generateGrid(size: number, iceCount: number): TileState[][] {
  const empty = createEmptyGrid(size)
  const withIOPort = placeIOPort(empty, size)
  const withICE = placeICE(withIOPort, iceCount)
  const withAdjacency = calculateAdjacency(withICE)
  const withSafeZone = revealSafeZone(withAdjacency)
  return withSafeZone
}
