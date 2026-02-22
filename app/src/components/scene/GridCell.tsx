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

function darkenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const dr = Math.min(255, Math.round(r * factor)).toString(16).padStart(2, '0')
  const dg = Math.min(255, Math.round(g * factor)).toString(16).padStart(2, '0')
  const db = Math.min(255, Math.round(b * factor)).toString(16).padStart(2, '0')
  return `#${dr}${dg}${db}`
}

export function GridCell({ tile }: GridCellProps) {
  const [hovered, setHovered] = useState(false)
  const revealTile = useGameStore((s) => s.revealTile)
  const tagTile = useGameStore((s) => s.tagTile)
  const startDecode = useGameStore((s) => s.startDecode)
  const moveCharacter = useGameStore((s) => s.moveCharacter)
  const phase = useGameStore((s) => s.phase)
  const characterPosition = useGameStore((s) => s.characterPosition)
  const decodeMode = useGameStore((s) => s.decodeMode)
  const tagMode = useGameStore((s) => s.tagMode)
  const isVirus = useGameStore((s) => s.virusTileSet.has(`${tile.x},${tile.y}`))

  const position: [number, number, number] = [
    tile.x * CELL_GAP,
    0,
    tile.y * CELL_GAP,
  ]

  // Scan zone: 5×5 area around PROC-7 (Chebyshev ≤ 2)
  const isInScanZone = useMemo(() => {
    return Math.abs(tile.x - characterPosition.x) <= 2 && Math.abs(tile.y - characterPosition.y) <= 2
  }, [tile.x, tile.y, characterPosition.x, characterPosition.y])

  // Simplified click: single click does everything based on mode
  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      if (phase !== 'playing') return

      // Click revealed/decoded tile → move PROC-7
      if (tile.isRevealed || tile.isDecoded) {
        moveCharacter(tile.x, tile.y)
        return
      }

      // Below: unrevealed tiles only
      if (!isInScanZone) return

      // Decode mode: start decode
      if (decodeMode) {
        startDecode(tile.x, tile.y)
        return
      }

      // Tag mode: toggle tag
      if (tagMode) {
        tagTile(tile.x, tile.y)
        return
      }

      // Default: reveal (skip if tagged — safety, must untag in tag mode first)
      if (!tile.isTagged) {
        revealTile(tile.x, tile.y)
      }
    },
    [phase, decodeMode, tagMode, isInScanZone, tile.x, tile.y, tile.isRevealed, tile.isDecoded, tile.isTagged, revealTile, startDecode, tagTile, moveCharacter]
  )

  const { color, emissive, emissiveIntensity, textColor } = useMemo(() => {
    // Revealed FAULT (death)
    if (tile.isRevealed && tile.isICE) {
      return { color: '#110000', emissive: '#ff3300', emissiveIntensity: 2.0, textColor: '#ff5533' }
    }
    // Virus-infected revealed/decoded tile (must check before decoded)
    if (isVirus && (tile.isRevealed || tile.isDecoded)) {
      return { color: '#110000', emissive: '#ff0000', emissiveIntensity: 2.5, textColor: '#ff3333' }
    }
    // Decoded (neutralized FAULT)
    if (tile.isDecoded) {
      return { color: '#111100', emissive: '#ffaa00', emissiveIntensity: 1.5, textColor: '#ffcc44' }
    }
    // Revealed Restore Port
    if (tile.isRevealed && tile.isIOPort) {
      return { color: '#001111', emissive: '#00ffff', emissiveIntensity: 3.0, textColor: '#66ffff' }
    }
    // Revealed safe tile — hover = move target highlight
    if (tile.isRevealed) {
      const threatColor = getThreatColor(tile.adjacentICE)
      if (hovered) {
        return {
          color: '#0a0a0a',
          emissive: tile.adjacentICE > 0 ? threatColor : '#006688',
          emissiveIntensity: tile.adjacentICE > 0 ? 0.55 : 0.22,
          textColor: threatColor,
        }
      }
      return {
        color: '#060606',
        emissive: tile.adjacentICE > 0 ? threatColor : '#004d66',
        emissiveIntensity: tile.adjacentICE > 0 ? 0.38 : 0.14,
        textColor: threatColor,
      }
    }
    // Tagged
    if (tile.isTagged) {
      return { color: '#0a0800', emissive: '#ff6600', emissiveIntensity: 1.2, textColor: '#ff8833' }
    }
    // Decode mode + in scan zone + hover → amber indicator
    if (decodeMode && isInScanZone && hovered) {
      return { color: '#111108', emissive: '#ffaa00', emissiveIntensity: 0.5, textColor: '#ffaa00' }
    }
    // Tag mode + in scan zone + hover → orange indicator
    if (tagMode && isInScanZone && hovered) {
      return { color: '#110a04', emissive: '#ff6600', emissiveIntensity: 0.4, textColor: '#ff6600' }
    }
    // Scan zone + hover + unrevealed → reveal target feedback
    if (hovered && isInScanZone) {
      return { color: '#111111', emissive: '#00ffff', emissiveIntensity: 0.5, textColor: '#00ffff' }
    }
    // Unrevealed — pure void (ScanZoneBorder communicates the zone extent)
    return { color: '#080808', emissive: '#000000', emissiveIntensity: 0, textColor: '#00ffff' }
  }, [tile, hovered, isInScanZone, decodeMode, tagMode, isVirus])

  const sideColor = darkenHex(color, 0.6)

  const labelText = useMemo(() => {
    if (tile.isDecoded) return 'OK'
    if (tile.isRevealed && tile.isICE) return 'FAULT'
    if (tile.isRevealed && tile.isIOPort) return 'PORT'
    if (tile.isRevealed && tile.adjacentICE > 0) return String(tile.adjacentICE)
    if (tile.isTagged) return '!'
    return null
  }, [tile])

  return (
    <group position={position}>
      <mesh
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[CELL_SIZE, CELL_HEIGHT, CELL_SIZE]} />
        {/* +X side */}
        <meshStandardMaterial attach="material-0" color={sideColor} emissive={emissive} emissiveIntensity={emissiveIntensity * 0.2} roughness={0.3} metalness={0.8} toneMapped={false} />
        {/* -X side */}
        <meshStandardMaterial attach="material-1" color={sideColor} emissive={emissive} emissiveIntensity={emissiveIntensity * 0.2} roughness={0.3} metalness={0.8} toneMapped={false} />
        {/* +Y top */}
        <meshStandardMaterial attach="material-2" color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={0.25} metalness={0.85} toneMapped={false} />
        {/* -Y bottom (never visible) */}
        <meshStandardMaterial attach="material-3" color="#000000" emissive="#000000" emissiveIntensity={0} toneMapped={false} />
        {/* +Z side */}
        <meshStandardMaterial attach="material-4" color={sideColor} emissive={emissive} emissiveIntensity={emissiveIntensity * 0.2} roughness={0.3} metalness={0.8} toneMapped={false} />
        {/* -Z side */}
        <meshStandardMaterial attach="material-5" color={sideColor} emissive={emissive} emissiveIntensity={emissiveIntensity * 0.2} roughness={0.3} metalness={0.8} toneMapped={false} />
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
