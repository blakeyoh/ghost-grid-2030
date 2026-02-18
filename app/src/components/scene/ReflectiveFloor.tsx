import { MeshReflectorMaterial } from '@react-three/drei'
import { useGameStore } from '../../store/gameStore'

export function ReflectiveFloor() {
  const gridSize = useGameStore((s) => s.gridSize)
  const floorSize = gridSize * 3

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[floorSize, floorSize]} />
      <MeshReflectorMaterial
        mirror={0.5}
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={0.8}
        roughness={0.15}
        metalness={0.9}
        color="#050505"
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
      />
    </mesh>
  )
}
