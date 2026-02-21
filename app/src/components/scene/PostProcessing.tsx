import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useGameStore } from '../../store/gameStore'
import { getSectorConfig } from '../../logic/sectorConfig'

export function PostProcessing() {
  const sector = useGameStore((s) => s.sector)
  const config = getSectorConfig(sector)

  const chromaticOffset = new Vector2(0.002, 0.002)

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
        offset={chromaticOffset}
        radialModulation={false}
        modulationOffset={0}
      />
    </EffectComposer>
  )
}
