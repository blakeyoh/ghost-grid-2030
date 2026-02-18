import { useState, useCallback, useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { TileState } from '../../store/types'
import { useGameStore } from '../../store/gameStore'

interface GridCellProps {
  readonly tile: TileState
}

const CELL_SIZE = 0.92
const CELL_HEIGHT = 0.08
const CELL_GAP = 1.0

function getThreatColor(count: number): string {
  if (count === 0) return '#00ffff'
  if (count === 1) return '#00ddff'
  if (count === 2) return '#00ff88'
  if (count === 3) return '#ffaa00'
  return '#ff3300'
}

export function GridCell({ tile }: GridCellProps) {
  const [hovered, setHovered] = useState(false)
  const revealTile = useGameStore((s) => s.revealTile)
  const tagTile = useGameStore((s) => s.tagTile)
  const startDecode = useGameStore((s) => s.startDecode)
  const phase = useGameStore((s) => s.phase)
  const grid = useGameStore((s) => s.grid)

  const position: [number, number, number] = [
    tile.x * CELL_GAP,
    0,
    tile.y * CELL_GAP,
  ]

  const isInteractive = phase === 'playing' && !tile.isRevealed && !tile.isDecoded

  // Check if this tile is adjacent to a revealed tile (for visual hint)
  const isAdjacentToRevealed = useMemo(() => {
    const size = grid.length
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = tile.x + dx
        const ny = tile.y + dy
        if (nx >= 0 && nx < size && ny >= 0 && ny < (grid[0]?.length ?? 0)) {
          if (grid[ny][nx].isRevealed || grid[ny][nx].isDecoded) return true
        }
      }
    }
    return false
  }, [grid, tile.x, tile.y])

  const handleClick = useCallback(
    (e: { stopPropagation: () => void; shiftKey?: boolean; nativeEvent?: { shiftKey?: boolean } }) => {
      e.stopPropagation()
      if (!isInteractive) return

      // Shift+click = decode (trackpad-friendly alternative to double-click)
      const isShift = (e as { shiftKey?: boolean }).shiftKey ||
        (e as { nativeEvent?: { shiftKey?: boolean } }).nativeEvent?.shiftKey
      if (isShift) {
        startDecode(tile.x, tile.y)
        return
      }

      if (tile.isTagged) return
      revealTile(tile.x, tile.y)
    },
    [isInteractive, tile.x, tile.y, tile.isTagged, revealTile, startDecode]
  )

  const handleContextMenu = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      if (phase !== 'playing') return
      if (tile.isRevealed || tile.isDecoded) return
      tagTile(tile.x, tile.y)
    },
    [phase, tile.x, tile.y, tile.isRevealed, tile.isDecoded, tagTile]
  )

  const handleDoubleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      if (!isInteractive) return
      startDecode(tile.x, tile.y)
    },
    [isInteractive, tile.x, tile.y, startDecode]
  )

  const { color, emissive, emissiveIntensity, textColor } = useMemo(() => {
    // Revealed ICE (death)
    if (tile.isRevealed && tile.isICE) {
      return { color: '#110000', emissive: '#ff3300', emissiveIntensity: 2.0, textColor: '#ff5533' }
    }
    // Decoded (neutralized)
    if (tile.isDecoded) {
      return { color: '#111100', emissive: '#ffaa00', emissiveIntensity: 1.5, textColor: '#ffcc44' }
    }
    // Revealed I/O Port
    if (tile.isRevealed && tile.isIOPort) {
      return { color: '#001111', emissive: '#00ffff', emissiveIntensity: 3.0, textColor: '#66ffff' }
    }
    // Revealed safe tile with number
    if (tile.isRevealed) {
      const threatColor = getThreatColor(tile.adjacentICE)
      return {
        color: '#060606',
        emissive: tile.adjacentICE > 0 ? threatColor : '#003344',
        emissiveIntensity: tile.adjacentICE > 0 ? 0.3 : 0.08,
        textColor: threatColor,
      }
    }
    // Tagged
    if (tile.isTagged) {
      return { color: '#0a0800', emissive: '#ff6600', emissiveIntensity: 1.2, textColor: '#ff8833' }
    }
    // Hover on interactive (adjacent to revealed)
    if (hovered && isInteractive && isAdjacentToRevealed) {
      return { color: '#080808', emissive: '#00ffff', emissiveIntensity: 0.6, textColor: '#00ffff' }
    }
    // Unrevealed but adjacent to revealed (frontier)
    if (isAdjacentToRevealed && !tile.isRevealed) {
      return { color: '#060606', emissive: '#00ffff', emissiveIntensity: 0.03, textColor: '#00ffff' }
    }
    // Unrevealed (dark, clearly distinct from revealed)
    return { color: '#030303', emissive: '#002233', emissiveIntensity: 0.01, textColor: '#00ffff' }
  }, [tile, hovered, isInteractive, isAdjacentToRevealed])

  const labelText = useMemo(() => {
    if (tile.isDecoded) return 'CLEAR'
    if (tile.isRevealed && tile.isICE) return 'ICE'
    if (tile.isRevealed && tile.isIOPort) return 'I/O'
    if (tile.isRevealed && tile.adjacentICE > 0) return String(tile.adjacentICE)
    if (tile.isTagged) return '!'
    return null
  }, [tile])

  return (
    <group position={position}>
      <mesh
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[CELL_SIZE, CELL_HEIGHT, CELL_SIZE]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          toneMapped={false}
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {labelText && (
        <Text
          position={[0, 0.12, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.38}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          font="https://cdn.jsdelivr.net/fontsource/fonts/orbitron@latest/latin-400-normal.ttf"
          outlineWidth={0.015}
          outlineColor="#000000"
        >
          {labelText}
        </Text>
      )}
    </group>
  )
}
