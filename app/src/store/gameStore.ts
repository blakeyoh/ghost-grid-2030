import { create } from 'zustand'
import type { GamePhase, TileState, DecodingTarget } from './types'
import { generateGrid } from '../logic/gridGenerator'
import { getSectorConfig, TOTAL_SECTORS } from '../logic/sectorConfig'

interface GameStore {
  readonly grid: TileState[][]
  readonly phase: GamePhase
  readonly sector: number
  readonly gridSize: number
  readonly iceCount: number
  readonly decodeCycles: number
  readonly clearedICE: number
  readonly decodingTarget: DecodingTarget | null

  readonly initSector: (sector: number) => void
  readonly revealTile: (x: number, y: number) => void
  readonly tagTile: (x: number, y: number) => void
  readonly startDecode: (x: number, y: number) => void
  readonly completeDecode: (success: boolean) => void
  readonly advanceSector: () => void
  readonly resetGame: () => void
  readonly startPlaying: () => void
}

const INITIAL_DECODE_CYCLES = 3

export const useGameStore = create<GameStore>((set, get) => ({
  grid: [],
  phase: 'start',
  sector: 1,
  gridSize: 10,
  iceCount: 15,
  decodeCycles: INITIAL_DECODE_CYCLES,
  clearedICE: 0,
  decodingTarget: null,

  initSector: (sector: number) => {
    const config = getSectorConfig(sector)
    const grid = generateGrid(config.gridSize, config.iceCount)
    set({
      grid,
      sector,
      gridSize: config.gridSize,
      iceCount: config.iceCount,
      decodeCycles: INITIAL_DECODE_CYCLES,
      decodingTarget: null,
    })
  },

  startPlaying: () => {
    const config = getSectorConfig(1)
    const grid = generateGrid(config.gridSize, config.iceCount)
    set({
      grid,
      phase: 'playing',
      sector: 1,
      gridSize: config.gridSize,
      iceCount: config.iceCount,
      decodeCycles: INITIAL_DECODE_CYCLES,
      clearedICE: 0,
      decodingTarget: null,
    })
  },

  revealTile: (x: number, y: number) => {
    const { grid, phase } = get()
    if (phase !== 'playing') return

    const tile = grid[y]?.[x]
    if (!tile || tile.isRevealed || tile.isTagged || tile.isDecoded) return

    // Must be adjacent to at least one revealed/decoded tile (path requirement)
    const size = grid.length
    let hasRevealedNeighbor = false
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < size && ny >= 0 && ny < (grid[0]?.length ?? 0)) {
          if (grid[ny][nx].isRevealed || grid[ny][nx].isDecoded) {
            hasRevealedNeighbor = true
          }
        }
      }
    }
    if (!hasRevealedNeighbor) return

    if (tile.isIOPort) {
      const newGrid = grid.map((row) =>
        row.map((t) =>
          t.x === x && t.y === y ? { ...t, isRevealed: true } : t
        )
      )
      set({ grid: newGrid, phase: 'transitioning' })
      return
    }

    if (tile.isICE) {
      const newGrid = grid.map((row) =>
        row.map((t) =>
          t.x === x && t.y === y ? { ...t, isRevealed: true } : t
        )
      )
      set({ grid: newGrid, phase: 'derezzed' })
      return
    }

    const newGrid = grid.map((row) =>
      row.map((t) =>
        t.x === x && t.y === y ? { ...t, isRevealed: true } : t
      )
    )
    set({ grid: newGrid })
  },

  tagTile: (x: number, y: number) => {
    const { grid, phase } = get()
    if (phase !== 'playing') return

    const tile = grid[y]?.[x]
    if (!tile || tile.isRevealed || tile.isDecoded) return

    const newGrid = grid.map((row) =>
      row.map((t) =>
        t.x === x && t.y === y ? { ...t, isTagged: !t.isTagged } : t
      )
    )
    set({ grid: newGrid })
  },

  startDecode: (x: number, y: number) => {
    const { grid, phase, decodeCycles } = get()
    if (phase !== 'playing' || decodeCycles <= 0) return

    const tile = grid[y]?.[x]
    if (!tile || tile.isRevealed || tile.isDecoded) return

    // Must be adjacent to at least one revealed/decoded tile
    const size = grid.length
    let hasRevealedNeighbor = false
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < size && ny >= 0 && ny < (grid[0]?.length ?? 0)) {
          if (grid[ny][nx].isRevealed || grid[ny][nx].isDecoded) {
            hasRevealedNeighbor = true
          }
        }
      }
    }
    if (!hasRevealedNeighbor) return

    set({
      phase: 'decoding',
      decodingTarget: { x, y },
      decodeCycles: decodeCycles - 1,
    })
  },

  completeDecode: (success: boolean) => {
    const { grid, decodingTarget, clearedICE } = get()
    if (!decodingTarget) return

    const { x, y } = decodingTarget
    const tile = grid[y]?.[x]
    if (!tile) return

    if (tile.isICE && !success) {
      const newGrid = grid.map((row) =>
        row.map((t) =>
          t.x === x && t.y === y ? { ...t, isRevealed: true } : t
        )
      )
      set({ grid: newGrid, phase: 'derezzed', decodingTarget: null })
      return
    }

    if (tile.isICE && success) {
      const newGrid = grid.map((row) =>
        row.map((t) =>
          t.x === x && t.y === y
            ? { ...t, isDecoded: true, isTagged: false }
            : t
        )
      )
      set({
        grid: newGrid,
        phase: 'playing',
        decodingTarget: null,
        clearedICE: clearedICE + 1,
      })
      return
    }

    const newGrid = grid.map((row) =>
      row.map((t) =>
        t.x === x && t.y === y
          ? { ...t, isRevealed: true, isTagged: false }
          : t
      )
    )
    set({ grid: newGrid, phase: 'playing', decodingTarget: null })
  },

  advanceSector: () => {
    const { sector, clearedICE } = get()
    const nextSector = sector + 1

    if (nextSector > TOTAL_SECTORS) {
      set({ phase: 'extracted' })
      return
    }

    const config = getSectorConfig(nextSector)
    const grid = generateGrid(config.gridSize, config.iceCount)
    set({
      grid,
      phase: 'playing',
      sector: nextSector,
      gridSize: config.gridSize,
      iceCount: config.iceCount,
      decodeCycles: INITIAL_DECODE_CYCLES,
      clearedICE,
      decodingTarget: null,
    })
  },

  resetGame: () => {
    const config = getSectorConfig(1)
    const grid = generateGrid(config.gridSize, config.iceCount)
    set({
      grid,
      phase: 'start',
      sector: 1,
      gridSize: config.gridSize,
      iceCount: config.iceCount,
      decodeCycles: INITIAL_DECODE_CYCLES,
      clearedICE: 0,
      decodingTarget: null,
    })
  },
}))
