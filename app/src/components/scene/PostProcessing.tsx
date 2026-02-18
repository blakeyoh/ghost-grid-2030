import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useGameStore } from '../../store/gameStore'
import { getSectorConfig } from '../../logic/sectorConfig'

const CHROMATIC_OFFSET = new Vector2(0.002, 0.002)

export function PostProcessing() {
  const sector = useGameStore((s) => s.sector)
  const config = getSectorConfig(sector)

  return (
    <EffectComposer>
      <Bloom
        intensity={config.bloomIntensity}
        luminanceThreshold={0}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={CHROMATIC_OFFSET}
        radialModulation={false}
        modulationOffset={0}
      />
    </EffectComposer>
  )
}
