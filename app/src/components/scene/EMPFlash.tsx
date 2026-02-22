import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, MeshStandardMaterial } from 'three'
import { useGameStore } from '../../store/gameStore'
import { characterWorldPos } from '../../store/characterRef'

const DURATION = 0.6
const MAX_RADIUS = 3

export function EMPFlash() {
  const empFlashActive = useGameStore((s) => s.empFlashActive)
  const meshRef = useRef<Mesh>(null)
  const matRef = useRef<MeshStandardMaterial>(null)
  const startTime = useRef<number | null>(null)

  useFrame((state) => {
    if (!meshRef.current || !matRef.current) return

    if (empFlashActive && startTime.current === null) {
      startTime.current = state.clock.getElapsedTime()
      meshRef.current.position.copy(characterWorldPos)
      meshRef.current.visible = true
    }

    if (startTime.current === null) {
      meshRef.current.visible = false
      return
    }

    const elapsed = state.clock.getElapsedTime() - startTime.current
    const progress = Math.min(elapsed / DURATION, 1)

    const scale = progress * MAX_RADIUS
    meshRef.current.scale.setScalar(scale)
    matRef.current.opacity = 0.5 * (1 - progress)
    matRef.current.emissiveIntensity = 5 * (1 - progress)

    if (progress >= 1) {
      startTime.current = null
      meshRef.current.visible = false
      useGameStore.setState({ empFlashActive: false })
    }
  })

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        ref={matRef}
        color="#00ffff"
        emissive="#00ffff"
        emissiveIntensity={5}
        transparent
        opacity={0.5}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  )
}
