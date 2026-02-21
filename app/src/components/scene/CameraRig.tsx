import { OrbitControls } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { characterWorldPos } from '../../store/characterRef'

export function CameraRig() {
  const gridSize = useGameStore((s) => s.gridSize)
  const isLongPressing = useGameStore((s) => s.isLongPressing)
  const { camera } = useThree()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const center = (gridSize - 1) / 2
    const distance = gridSize * 1.2
    camera.position.set(center + distance * 0.6, distance, center + distance * 0.6)
    camera.lookAt(center, 0, center)
  }, [gridSize, camera])

  // Soft-follow: track Character's actual mesh position (written per-frame in Character.tsx)
  // This eliminates the double-lerp jerk from both components lerping toward the same store target.
  useFrame(() => {
    if (!controlsRef.current) return
    controlsRef.current.target.lerp(characterWorldPos, 0.04)
    controlsRef.current.update()
  })

  const center = (gridSize - 1) / 2

  return (
    <OrbitControls
      ref={controlsRef}
      target={[center, 0, center]}
      minDistance={gridSize * 0.6}
      maxDistance={gridSize * 2.5}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.5}
      enablePan={false}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      enabled={!isLongPressing}
    />
  )
}
