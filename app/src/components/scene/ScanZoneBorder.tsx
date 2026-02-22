import { useRef } from 'react'
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { Line2 } from 'three-stdlib'
import { useGameStore } from '../../store/gameStore'
import { characterWorldPos } from '../../store/characterRef'

const HALF_EXTENT = 2.5
const Y = 0.08
const LERP_FACTOR = 0.08
const COLOR = '#88ccff'

const INITIAL_POINTS: [number, number, number][] = [
  [0, Y, 0], [1, Y, 0], [1, Y, 1], [0, Y, 1], [0, Y, 0],
]

export function ScanZoneBorder() {
  const phase = useGameStore((s) => s.phase)
  const gridSize = useGameStore((s) => s.gridSize)
  const lineRef = useRef<Line2>(null)

  const { x: startX, y: startY } = useGameStore.getState().characterPosition
  const borderPos = useRef(new Vector3(startX, 0, startY))

  useFrame(() => {
    if (!lineRef.current) return

    borderPos.current.lerp(characterWorldPos, LERP_FACTOR)
    const cx = borderPos.current.x
    const cz = borderPos.current.z

    const minX = Math.max(-0.5, cx - HALF_EXTENT)
    const maxX = Math.min(gridSize - 0.5, cx + HALF_EXTENT)
    const minZ = Math.max(-0.5, cz - HALF_EXTENT)
    const maxZ = Math.min(gridSize - 0.5, cz + HALF_EXTENT)

    lineRef.current.geometry.setPositions([
      minX, Y, minZ,
      maxX, Y, minZ,
      maxX, Y, maxZ,
      minX, Y, maxZ,
      minX, Y, minZ,
    ])
  })

  const isActive = phase === 'playing' || phase === 'decoding' || phase === 'paused'

  return isActive ? (
    <Line
      ref={lineRef}
      points={INITIAL_POINTS}
      color={COLOR}
      lineWidth={2}
    />
  ) : null
}
