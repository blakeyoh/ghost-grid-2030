import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { characterWorldPos } from '../../store/characterRef'

const LERP_SPEED = 0.12
const HOVER_Y = 0.40           // high enough to clear tile labels + bloom spread
const NUM_BLADES = 6
const BLADE_RADIUS = 0.09      // distance from center to blade pivot
const BLADE_LENGTH = 0.18      // X — extends outward
const BLADE_TALL = 0.10        // Y — tall enough to see from isometric camera
const BLADE_THICK = 0.04       // Z — thickness
const RING_RADIUS = 0.23       // torus center radius
const RING_TUBE = 0.018        // torus tube thickness
const IRIS_OPEN = 0            // blades tangential → propeller open
const IRIS_CLOSED = Math.PI / 2  // blades radial → pointing inward / closed

const BLADE_ANGLES = Array.from({ length: NUM_BLADES }, (_, i) => (i / NUM_BLADES) * Math.PI * 2)

const RING_COLOR = '#001122'
const RING_EMISSIVE = '#00ffff'
const BLADE_COLOR = '#000d1a'
const BLADE_EMISSIVE = '#00ffff'

export function Character() {
  const characterPosition = useGameStore((s) => s.characterPosition)
  const isCharacterMoving = useGameStore((s) => s.isCharacterMoving)
  const phase = useGameStore((s) => s.phase)

  const groupRef = useRef<THREE.Group>(null)
  const bladeRefs = useRef<THREE.Mesh[]>([])
  const irisAngleRef = useRef(IRIS_OPEN)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!groupRef.current) return

    // Lerp position toward target tile
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      characterPosition.x,
      LERP_SPEED
    )
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      characterPosition.y,
      LERP_SPEED
    )

    // Idle bob
    groupRef.current.position.y = HOVER_Y + Math.sin(Date.now() * 0.0025) * 0.010

    // Write actual mesh position for CameraRig to read (avoids double-lerp jerk)
    characterWorldPos.set(groupRef.current.position.x, 0, groupRef.current.position.z)

    // Slow counter-rotation on the outer ring
    if (ringRef.current) {
      ringRef.current.rotation.y += 0.006
    }

    // Iris open/close: sweep blades inward when moving
    const targetIris = isCharacterMoving ? IRIS_CLOSED : IRIS_OPEN
    irisAngleRef.current = THREE.MathUtils.lerp(irisAngleRef.current, targetIris, 0.10)

    bladeRefs.current.forEach((blade, i) => {
      if (!blade) return
      // Base: tangential (+ π/2). Animated: sweeps toward radial (+ π/2 + irisAngle)
      blade.rotation.y = BLADE_ANGLES[i] + Math.PI / 2 + irisAngleRef.current
    })
  })

  if (phase === 'start' || phase === 'extracted') return null

  return (
    <group ref={groupRef} position={[characterPosition.x, HOVER_Y, characterPosition.y]}>
      {/* Outer ring — tilted 90° so it stands upright and reads as a ring from isometric */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING_RADIUS, RING_TUBE, 8, 32]} />
        <meshStandardMaterial
          color={RING_COLOR}
          emissive={RING_EMISSIVE}
          emissiveIntensity={1.8}
          roughness={0.15}
          metalness={0.95}
          toneMapped={false}
        />
      </mesh>

      {/* Iris blades — standing tall (Y-oriented) so visible from isometric camera */}
      {BLADE_ANGLES.map((angle, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) bladeRefs.current[i] = el }}
          position={[
            BLADE_RADIUS * Math.cos(angle),
            0,
            BLADE_RADIUS * Math.sin(angle),
          ]}
        >
          <boxGeometry args={[BLADE_LENGTH, BLADE_TALL, BLADE_THICK]} />
          <meshStandardMaterial
            color={BLADE_COLOR}
            emissive={BLADE_EMISSIVE}
            emissiveIntensity={1.4}
            roughness={0.2}
            metalness={0.9}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}
