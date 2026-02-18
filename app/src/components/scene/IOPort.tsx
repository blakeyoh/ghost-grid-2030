import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { useGameStore } from '../../store/gameStore'

export function IOPort() {
  const grid = useGameStore((s) => s.grid)
  const meshRef = useRef<Mesh>(null)

  const ioPortTile = useMemo(
    () => grid.flat().find((t) => t.isIOPort) ?? null,
    [grid]
  )

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.position.y = 0.3 + Math.sin(Date.now() * 0.002) * 0.1
    }
  })

  if (!ioPortTile) return null

  return (
    <mesh
      ref={meshRef}
      position={[ioPortTile.x, 0.3, ioPortTile.y]}
    >
      <octahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial
        color="#001111"
        emissive="#00ffff"
        emissiveIntensity={3.0}
        toneMapped={false}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}
