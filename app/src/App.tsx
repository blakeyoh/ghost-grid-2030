import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { GameScene } from './components/scene/GameScene'
import { HUD } from './components/ui/HUD'
import { StartScreen } from './components/ui/StartScreen'
import { DerezScreen } from './components/ui/DerezScreen'
import { VictoryScreen } from './components/ui/VictoryScreen'
import { DecodeMinigame } from './components/ui/DecodeMinigame'
import { SectorTransition } from './components/ui/SectorTransition'
import { LoreModal } from './components/ui/LoreModal'
import { PauseScreen } from './components/ui/PauseScreen'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <GameScene />
      </Canvas>

      <HUD />
      <StartScreen />
      <DerezScreen />
      <VictoryScreen />
      <DecodeMinigame />
      <SectorTransition />
      <LoreModal />
      <PauseScreen />
    </div>
  )
}
