import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Text } from '@react-three/drei'
import type { TileState } from '../../store/types'
import { useGameStore } from '../../store/gameStore'

interface GridCellProps {
  readonly tile: TileState
}

const CELL_SIZE = 0.92
const CELL_HEIGHT = 0.08
const CELL_GAP = 1.0
const LONG_PRESS_MS = 500
const DRAG_THRESHOLD = 10
const DOUBLE_TAP_MS = 300

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
  const setLongPressing = useGameStore((s) => s.setLongPressing)
  const phase = useGameStore((s) => s.phase)
  const characterPosition = useGameStore((s) => s.characterPosition)
  const decodeMode = useGameStore((s) => s.decodeMode)

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const singleClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerDownPosRef = useRef({ x: 0, y: 0 })
  const lastTapRef = useRef(0)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      if (singleClickTimerRef.current) clearTimeout(singleClickTimerRef.current)
    }
  }, [])

  const position: [number, number, number] = [
    tile.x * CELL_GAP,
    0,
    tile.y * CELL_GAP,
  ]

  // Scan zone: 5×5 area around PROC-7 (Chebyshev ≤ 2)
  const isInScanZone = useMemo(() => {
    return Math.abs(tile.x - characterPosition.x) <= 2 && Math.abs(tile.y - characterPosition.y) <= 2
  }, [tile.x, tile.y, characterPosition.x, characterPosition.y])

  const canTag = phase === 'playing' && !tile.isRevealed && !tile.isDecoded

  // Long-press → tag (works on any unrevealed tile, not restricted to scan zone)
  const handlePointerDown = useCallback(
    (e: { stopPropagation: () => void; clientX?: number; clientY?: number; nativeEvent?: PointerEvent }) => {
      e.stopPropagation()
      if (!canTag) return

      const clientX = e.clientX ?? (e.nativeEvent as PointerEvent)?.clientX ?? 0
      const clientY = e.clientY ?? (e.nativeEvent as PointerEvent)?.clientY ?? 0
      pointerDownPosRef.current = { x: clientX, y: clientY }

      setLongPressing(true)
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null
        setLongPressing(false)
        if (phase === 'playing' && !tile.isRevealed && !tile.isDecoded) {
          tagTile(tile.x, tile.y)
        }
      }, LONG_PRESS_MS)
    },
    [canTag, phase, tile.x, tile.y, tile.isRevealed, tile.isDecoded, tagTile, setLongPressing]
  )

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
      setLongPressing(false)
    }
  }, [setLongPressing])

  const handlePointerMove = useCallback(
    (e: { clientX?: number; clientY?: number; nativeEvent?: PointerEvent }) => {
      if (!longPressTimerRef.current) return
      const clientX = e.clientX ?? (e.nativeEvent as PointerEvent)?.clientX ?? 0
      const clientY = e.clientY ?? (e.nativeEvent as PointerEvent)?.clientY ?? 0
      const dx = clientX - pointerDownPosRef.current.x
      const dy = clientY - pointerDownPosRef.current.y
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
        setLongPressing(false)
      }
    },
    [setLongPressing]
  )

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      if (phase !== 'playing') return

      // Decode mode: click unrevealed tile in scan zone → start decode (immediate)
      if (decodeMode && isInScanZone && !tile.isRevealed && !tile.isDecoded) {
        startDecode(tile.x, tile.y)
        return
      }

      const now = Date.now()

      // Double-tap → move PROC-7 to any revealed/decoded tile
      if (now - lastTapRef.current < DOUBLE_TAP_MS) {
        // Cancel the pending single-click reveal
        if (singleClickTimerRef.current) {
          clearTimeout(singleClickTimerRef.current)
          singleClickTimerRef.current = null
        }
        lastTapRef.current = 0
        if (tile.isRevealed || tile.isDecoded) {
          moveCharacter(tile.x, tile.y)
        }
        return
      }
      lastTapRef.current = now

      // Defer single-click reveal to allow double-tap to cancel it
      if (!tile.isRevealed && !tile.isDecoded && !tile.isTagged && isInScanZone) {
        singleClickTimerRef.current = setTimeout(() => {
          singleClickTimerRef.current = null
          revealTile(tile.x, tile.y)
        }, DOUBLE_TAP_MS)
      }
    },
    [phase, decodeMode, isInScanZone, tile.x, tile.y, tile.isRevealed, tile.isDecoded, tile.isTagged, revealTile, startDecode, moveCharacter]
  )

  // Right-click → tag (unrestricted — tagging is a planning tool)
  const handleContextMenu = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      if (phase !== 'playing') return
      if (tile.isRevealed || tile.isDecoded) return
      tagTile(tile.x, tile.y)
    },
    [phase, tile.x, tile.y, tile.isRevealed, tile.isDecoded, tagTile]
  )

  const { color, emissive, emissiveIntensity, textColor } = useMemo(() => {
    // Revealed FAULT (death)
    if (tile.isRevealed && tile.isICE) {
      return { color: '#110000', emissive: '#ff3300', emissiveIntensity: 2.0, textColor: '#ff5533' }
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
    // Decode mode + in scan zone + hover → amber indicator (border shows zone extent)
    if (decodeMode && isInScanZone && hovered) {
      return { color: '#111108', emissive: '#ffaa00', emissiveIntensity: 0.5, textColor: '#ffaa00' }
    }
    // Scan zone + hover + unrevealed → reveal target feedback
    if (hovered && isInScanZone) {
      return { color: '#111111', emissive: '#00ffff', emissiveIntensity: 0.5, textColor: '#00ffff' }
    }
    // Unrevealed — pure void (ScanZoneBorder communicates the zone extent)
    return { color: '#080808', emissive: '#000000', emissiveIntensity: 0, textColor: '#00ffff' }
  }, [tile, hovered, isInScanZone, decodeMode])

  const sideColor = darkenHex(color, 0.6)

  const labelText = useMemo(() => {
    if (tile.isDecoded) return 'CLEAR'
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
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => {
          setHovered(false)
          handlePointerUp()
        }}
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
