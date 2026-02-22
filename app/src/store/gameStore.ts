import { create } from 'zustand'
import type { GamePhase, GameMode, TileState, DecodingTarget } from './types'
import { generateGrid } from '../logic/gridGenerator'
import { getSectorConfig, generateEndlessSector, TOTAL_SECTORS } from '../logic/sectorConfig'

interface GameStore {
  readonly grid: TileState[][]
  readonly phase: GamePhase
  readonly sector: number
  readonly gridSize: number
  readonly iceCount: number
  readonly decodeCycles: number
  readonly clearedICE: number
  readonly decodingTarget: DecodingTarget | null
  readonly characterPosition: { x: number; y: number }
  readonly isCharacterMoving: boolean
  readonly hasSeenLore: boolean
  readonly mode: GameMode
  readonly score: number
  readonly highScore: number
  readonly storyHighScore: number
  readonly decodeMode: boolean
  readonly tagMode: boolean
  readonly virusTiles: readonly { x: number; y: number }[]
  readonly virusTileSet: ReadonlySet<string>
  readonly virusAlertActive: boolean
  readonly empCharges: number
  readonly empFlashActive: boolean

  readonly initSector: (sector: number) => void
  readonly revealTile: (x: number, y: number) => void
  readonly tagTile: (x: number, y: number) => void
  readonly startDecode: (x: number, y: number) => void
  readonly completeDecode: (success: boolean) => void
  readonly advanceSector: () => void
  readonly resetGame: () => void
  readonly startPlaying: () => void
  readonly startEndless: () => void
  readonly dismissLore: () => void
  readonly pauseGame: () => void
  readonly resumeGame: () => void
  readonly moveCharacter: (x: number, y: number) => void
  readonly enterDecodeMode: () => void
  readonly exitDecodeMode: () => void
  readonly enterTagMode: () => void
  readonly spawnVirus: () => void
  readonly dismissVirusAlert: () => void
  readonly activateEMP: () => void
}

const INITIAL_DECODE_CYCLES = 3
const START_POSITION = { x: 1, y: 1 } // corner of 2×2 safe zone — scan zone reaches unrevealed tiles

function loadHighScore(): number {
  return parseInt(localStorage.getItem('ghostgrid_highscore') ?? '0', 10)
}

function saveHighScore(score: number): void {
  localStorage.setItem('ghostgrid_highscore', String(score))
}

function loadStoryHighScore(): number {
  return parseInt(localStorage.getItem('ghostgrid_story_highscore') ?? '0', 10)
}

function saveStoryHighScore(score: number): void {
  localStorage.setItem('ghostgrid_story_highscore', String(score))
}

function isInScanZone(x: number, y: number, charPos: { x: number; y: number }): boolean {
  return Math.abs(x - charPos.x) <= 2 && Math.abs(y - charPos.y) <= 2
}

let moveTimer: ReturnType<typeof setTimeout> | null = null

export const useGameStore = create<GameStore>((set, get) => ({
  grid: [],
  phase: 'start',
  sector: 1,
  gridSize: 10,
  iceCount: 15,
  decodeCycles: INITIAL_DECODE_CYCLES,
  clearedICE: 0,
  decodingTarget: null,
  characterPosition: START_POSITION,
  isCharacterMoving: false,
  hasSeenLore: false,
  mode: 'story',
  score: 0,
  highScore: loadHighScore(),
  storyHighScore: loadStoryHighScore(),
  decodeMode: false,
  tagMode: false,
  virusTiles: [],
  virusTileSet: new Set<string>(),
  virusAlertActive: false,
  empCharges: 0,
  empFlashActive: false,

  dismissLore: () => set({ hasSeenLore: true }),

  pauseGame: () => {
    const { phase } = get()
    if (phase !== 'playing') return
    set({ phase: 'paused', decodeMode: false, tagMode: false })
  },

  resumeGame: () => {
    const { phase } = get()
    if (phase !== 'paused') return
    set({ phase: 'playing' })
  },

  moveCharacter: (x: number, y: number) => {
    const { grid, phase, virusTileSet } = get()
    if (phase !== 'playing') return

    const tile = grid[y]?.[x]
    if (!tile || (!tile.isRevealed && !tile.isDecoded)) return

    // Check for virus death
    const isVirus = virusTileSet.has(`${x},${y}`)
    if (isVirus) {
      set({ characterPosition: { x, y }, phase: 'derezzed' })
      return
    }

    if (moveTimer) clearTimeout(moveTimer)
    set({
      characterPosition: { x, y },
      isCharacterMoving: true,
      decodeMode: false,
      tagMode: false,
    })
    moveTimer = setTimeout(() => {
      moveTimer = null
      set({ isCharacterMoving: false })
    }, 400)
  },

  enterDecodeMode: () => {
    const { decodeCycles, decodeMode } = get()
    if (decodeCycles <= 0) return
    set({ decodeMode: !decodeMode, tagMode: false }) // toggle, mutually exclusive with tag
  },

  exitDecodeMode: () => set({ decodeMode: false }),

  enterTagMode: () => {
    const { tagMode } = get()
    set({ tagMode: !tagMode, decodeMode: false }) // toggle, mutually exclusive with decode
  },

  spawnVirus: () => {
    const { grid, phase, characterPosition, virusTiles, virusTileSet } = get()
    if (phase !== 'playing') return

    const candidates: { x: number; y: number }[] = []
    for (const row of grid) {
      for (const t of row) {
        if (!(t.isRevealed || t.isDecoded)) continue
        if (t.isIOPort) continue
        if (t.x === characterPosition.x && t.y === characterPosition.y) continue
        if (virusTileSet.has(`${t.x},${t.y}`)) continue
        candidates.push({ x: t.x, y: t.y })
      }
    }
    if (candidates.length === 0) return

    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    const newVirusTiles = [...virusTiles, pick]
    set({
      virusTiles: newVirusTiles,
      virusTileSet: new Set(newVirusTiles.map((v) => `${v.x},${v.y}`)),
    })
  },

  dismissVirusAlert: () => set({ virusAlertActive: false }),

  activateEMP: () => {
    const { grid, phase, characterPosition, empCharges, virusTiles } = get()
    if (phase !== 'playing' || empCharges <= 0) return

    const cx = characterPosition.x
    const cy = characterPosition.y

    // Find FAULTs in 5×5 around PROC-7
    const removedFaults: { x: number; y: number }[] = []
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tx = cx + dx
        const ty = cy + dy
        const tile = grid[ty]?.[tx]
        if (tile && tile.isICE && !tile.isRevealed && !tile.isDecoded) {
          removedFaults.push({ x: tx, y: ty })
        }
      }
    }

    // Build adjacency delta map
    const deltaMap = new Map<string, number>()
    for (const fault of removedFaults) {
      for (let ndy = -1; ndy <= 1; ndy++) {
        for (let ndx = -1; ndx <= 1; ndx++) {
          if (ndx === 0 && ndy === 0) continue
          const nx = fault.x + ndx
          const ny = fault.y + ndy
          const key = `${nx},${ny}`
          deltaMap.set(key, (deltaMap.get(key) ?? 0) - 1)
        }
      }
    }

    // Update grid immutably
    const removedSet = new Set(removedFaults.map((f) => `${f.x},${f.y}`))
    const newGrid = grid.map((row) =>
      row.map((t) => {
        const key = `${t.x},${t.y}`
        if (removedSet.has(key)) {
          const delta = deltaMap.get(key) ?? 0
          return { ...t, isICE: false, isRevealed: true, isTagged: false, adjacentICE: Math.max(0, t.adjacentICE + delta) }
        }
        const delta = deltaMap.get(key)
        if (delta !== undefined) {
          return { ...t, adjacentICE: Math.max(0, t.adjacentICE + delta) }
        }
        return t
      })
    )

    // Filter viruses in 5×5
    const newVirusTiles = virusTiles.filter(
      (v) => Math.abs(v.x - cx) > 2 || Math.abs(v.y - cy) > 2
    )

    set({
      grid: newGrid,
      empCharges: empCharges - 1,
      empFlashActive: true,
      virusTiles: newVirusTiles,
      virusTileSet: new Set(newVirusTiles.map((v) => `${v.x},${v.y}`)),
    })
  },

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
      characterPosition: START_POSITION,
      decodeMode: false,
      tagMode: false,
      virusTiles: [],
      virusTileSet: new Set<string>(),
      virusAlertActive: false,
      empCharges: sector >= 2 ? 1 : 0,
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
      characterPosition: START_POSITION,
      isCharacterMoving: false,
      hasSeenLore: false,
      mode: 'story',
      score: 0,
      decodeMode: false,
      tagMode: false,
      virusTiles: [],
      virusTileSet: new Set<string>(),
      virusAlertActive: false,
      empCharges: 0,
      empFlashActive: false,
    })
  },

  startEndless: () => {
    const config = generateEndlessSector(1)
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
      characterPosition: START_POSITION,
      isCharacterMoving: false,
      hasSeenLore: true,
      mode: 'endless',
      score: 0,
      decodeMode: false,
      tagMode: false,
      virusTiles: [],
      virusTileSet: new Set<string>(),
      virusAlertActive: false,
      empCharges: 0,
      empFlashActive: false,
    })
  },

  revealTile: (x: number, y: number) => {
    const { grid, phase, characterPosition } = get()
    if (phase !== 'playing') return

    const tile = grid[y]?.[x]
    if (!tile || tile.isRevealed || tile.isTagged || tile.isDecoded) return

    // Scan mode: must be within 5×5 scan zone of PROC-7
    if (!isInScanZone(x, y, characterPosition)) return

    const size = grid.length
    const cols = grid[0]?.length ?? 0

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

    // Safe reveal
    let resultGrid = grid.map((row) =>
      row.map((t) =>
        t.x === x && t.y === y ? { ...t, isRevealed: true } : t
      )
    )

    // One-hop zero-reveal (auto-reveals adjacent 0-tiles; can extend beyond scan zone)
    if (tile.adjacentICE === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < cols && ny >= 0 && ny < size) {
            const neighbor = resultGrid[ny]?.[nx]
            if (
              neighbor &&
              !neighbor.isRevealed &&
              !neighbor.isTagged &&
              !neighbor.isDecoded &&
              !neighbor.isICE &&
              !neighbor.isIOPort &&
              neighbor.adjacentICE === 0
            ) {
              resultGrid = resultGrid.map((row) =>
                row.map((t) =>
                  t.x === nx && t.y === ny ? { ...t, isRevealed: true } : t
                )
              )
            }
          }
        }
      }
    }

    // Scan mode: character does NOT auto-move on reveal. Player must double-click to move.
    set({ grid: resultGrid })
  },

  tagTile: (x: number, y: number) => {
    const { grid, phase, characterPosition } = get()
    if (phase !== 'playing') return

    const tile = grid[y]?.[x]
    if (!tile || tile.isRevealed || tile.isDecoded) return

    // Tagging restricted to scan zone
    if (!isInScanZone(x, y, characterPosition)) return

    const newGrid = grid.map((row) =>
      row.map((t) =>
        t.x === x && t.y === y ? { ...t, isTagged: !t.isTagged } : t
      )
    )
    set({ grid: newGrid })
  },

  startDecode: (x: number, y: number) => {
    const { grid, phase, decodeCycles, characterPosition } = get()
    if (phase !== 'playing' || decodeCycles <= 0) return

    const tile = grid[y]?.[x]
    if (!tile || tile.isRevealed || tile.isDecoded) return

    // Must be in scan zone
    if (!isInScanZone(x, y, characterPosition)) return

    set({
      phase: 'decoding',
      decodingTarget: { x, y },
      decodeCycles: decodeCycles - 1,
      decodeMode: false,
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
      set({ grid: newGrid, phase: 'derezzed', decodingTarget: null, decodeMode: false })
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
        decodeMode: false,
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
    set({ grid: newGrid, phase: 'playing', decodingTarget: null, decodeMode: false })
  },

  advanceSector: () => {
    const { sector, grid, decodeCycles, mode, score, highScore, storyHighScore } = get()

    const decodedThisSector = grid.flat().filter((t) => t.isDecoded).length
    const sectorScore = sector * sector * 100 + decodedThisSector * 25 + decodeCycles * 50
    const newScore = score + sectorScore

    const nextSector = sector + 1

    if (mode === 'story' && nextSector > TOTAL_SECTORS) {
      const newStoryHighScore = Math.max(storyHighScore, newScore)
      if (newStoryHighScore > storyHighScore) saveStoryHighScore(newStoryHighScore)
      set({ phase: 'extracted', score: newScore, storyHighScore: newStoryHighScore })
      return
    }

    const config =
      mode === 'endless'
        ? generateEndlessSector(nextSector)
        : getSectorConfig(nextSector)

    const newGrid = generateGrid(config.gridSize, config.iceCount)

    const newHighScore = mode === 'endless' ? Math.max(highScore, newScore) : highScore
    if (mode === 'endless' && newHighScore > highScore) {
      saveHighScore(newHighScore)
    }

    set({
      grid: newGrid,
      phase: 'playing',
      sector: nextSector,
      gridSize: config.gridSize,
      iceCount: config.iceCount,
      decodeCycles: INITIAL_DECODE_CYCLES,
      clearedICE: 0,
      decodingTarget: null,
      score: newScore,
      highScore: newHighScore,
      characterPosition: START_POSITION,
      isCharacterMoving: false,
      decodeMode: false,
      tagMode: false,
      virusTiles: [],
      virusTileSet: new Set<string>(),
      virusAlertActive: false,
      empCharges: nextSector >= 2 ? 1 : 0,
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
      characterPosition: START_POSITION,
      isCharacterMoving: false,
      hasSeenLore: false,
      mode: 'story',
      score: 0,
      decodeMode: false,
      tagMode: false,
      virusTiles: [],
      virusTileSet: new Set<string>(),
      virusAlertActive: false,
      empCharges: 0,
      empFlashActive: false,
    })
  },
}))
