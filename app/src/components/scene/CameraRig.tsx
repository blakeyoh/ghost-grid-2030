import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

export function CameraRig() {
  const gridSize = useGameStore((s) => s.gridSize)
  const { camera } = useThree()

  useEffect(() => {
    const center = (gridSize - 1) / 2
    const distance = gridSize * 1.2
    camera.position.set(center + distance * 0.6, distance, center + distance * 0.6)
    camera.lookAt(center, 0, center)
  }, [gridSize, camera])

  const center = (gridSize - 1) / 2

  return (
    <OrbitControls
      target={[center, 0, center]}
      minDistance={gridSize * 0.6}
      maxDistance={gridSize * 2.5}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.5}
      enablePan={false}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
    />
  )
}
