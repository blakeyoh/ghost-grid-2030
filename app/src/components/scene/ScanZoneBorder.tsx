import { useRef } from 'react'
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { Group } from 'three'
import { useGameStore } from '../../store/gameStore'
import { characterWorldPos } from '../../store/characterRef'

const HALF_EXTENT = 2.5  // 5 tiles × 1 unit each, ÷ 2
const Y = 0.08           // just above tile surface (CELL_HEIGHT = 0.08)
const LERP_FACTOR = 0.08 // slightly faster than CameraRig (0.04) so border stays close to PROC-7
const COLOR = '#88ccff'  // cool cyan-white, bloom-compatible

// Fixed border points centered at origin — the group's world position handles offset
const BORDER_POINTS: [number, number, number][] = [
  [-HALF_EXTENT, Y, -HALF_EXTENT],
  [HALF_EXTENT, Y, -HALF_EXTENT],
  [HALF_EXTENT, Y, HALF_EXTENT],
  [-HALF_EXTENT, Y, HALF_EXTENT],
  [-HALF_EXTENT, Y, -HALF_EXTENT], // close the loop
]

export function ScanZoneBorder() {
  const phase = useGameStore((s) => s.phase)
  const groupRef = useRef<Group>(null)
  // Seed from store snapshot so border starts at PROC-7's position rather than lerping from world origin
  const { x: startX, y: startY } = useGameStore.getState().characterPosition
  const borderPos = useRef(new Vector3(startX, 0, startY))

  // All hooks must be called before conditional return (R3F hooks order rule)
  useFrame(() => {
    if (!groupRef.current) return
    borderPos.current.lerp(characterWorldPos, LERP_FACTOR)
    groupRef.current.position.x = borderPos.current.x
    groupRef.current.position.z = borderPos.current.z
  })

  const isActive = phase === 'playing' || phase === 'decoding' || phase === 'paused'

  return isActive ? (
    <group ref={groupRef}>
      <Line
        points={BORDER_POINTS}
        color={COLOR}
        lineWidth={2}
      />
    </group>
  ) : null
}
