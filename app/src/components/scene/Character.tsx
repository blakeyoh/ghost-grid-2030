import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Octahedron, Torus, Sphere, Circle, Edges } from '@react-three/drei'
import type { Group, MeshStandardMaterial } from 'three'
import { useGameStore } from '../../store/gameStore'
import { characterWorldPos } from '../../store/characterRef'

const LERP_SPEED = 0.12
const HOVER_Y = 0.65

export function Character() {
  const characterPosition = useGameStore((s) => s.characterPosition)
  const isCharacterMoving = useGameStore((s) => s.isCharacterMoving)
  const phase = useGameStore((s) => s.phase)

  const groupRef = useRef<Group>(null)
  const lensRef = useRef<MeshStandardMaterial>(null)

  useFrame((state) => {
    if (!groupRef.current) return

    const t = state.clock.getElapsedTime()

    // Lerp position toward target tile (CELL_GAP = 1.0)
    const targetX = characterPosition.x * 1.0
    const targetZ = characterPosition.y * 1.0
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * LERP_SPEED
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * LERP_SPEED

    // Bob + hover
    groupRef.current.position.y = HOVER_Y + Math.sin(t * 2) * 0.1

    // Write actual mesh position for CameraRig / ScanZoneBorder
    characterWorldPos.set(groupRef.current.position.x, 0, groupRef.current.position.z)

    // Rotation: slow spin when idle, snap to 0 when moving
    if (isCharacterMoving) {
      groupRef.current.rotation.y = 0
    } else {
      groupRef.current.rotation.y = t * 0.5
    }

    // Lens emissive intensity: bright when moving, dim when idle
    if (lensRef.current) {
      lensRef.current.emissiveIntensity = isCharacterMoving ? 5 : 1
    }
  })

  if (phase === 'start' || phase === 'extracted') return null

  return (
    <group ref={groupRef} position={[characterPosition.x, HOVER_Y, characterPosition.y]}>
      {/* Chassis: glass octahedron */}
      <Octahedron args={[0.5, 0]}>
        <meshPhysicalMaterial
          color="#050505"
          metalness={0.9}
          roughness={0.1}
          transmission={0.9}
          thickness={0.5}
        />
        <Edges color="#00ffff" threshold={15} />
      </Octahedron>

      {/* Aperture assembly at top */}
      <group position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Outer ring */}
        <Torus args={[0.2, 0.03, 16, 32]}>
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
        </Torus>

        {/* Backing disc */}
        <Circle args={[0.19, 32]} position={[0, 0, -0.01]}>
          <meshStandardMaterial color="#111" />
        </Circle>

        {/* Lens dome — emissive cyan */}
        <Sphere args={[0.15, 32, 32, 0, Math.PI * 2, 0, Math.PI / 3]} position={[0, 0, 0.02]}>
          <meshStandardMaterial
            ref={lensRef}
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={1}
            toneMapped={false}
          />
        </Sphere>
      </group>
    </group>
  )
}
