import { useGameStore } from '../../store/gameStore'
import { getSectorConfig } from '../../logic/sectorConfig'

export function Environment() {
  const sector = useGameStore((s) => s.sector)
  const config = getSectorConfig(sector)

  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', config.fogNear, config.fogFar]} />
      <ambientLight intensity={config.ambientIntensity} />
      <pointLight position={[0, 10, 0]} intensity={0.3} color="#00ffff" />
    </>
  )
}
