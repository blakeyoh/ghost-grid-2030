import { Environment } from './Environment'
import { ReflectiveFloor } from './ReflectiveFloor'
import { PostProcessing } from './PostProcessing'
import { CameraRig } from './CameraRig'
import { GridSystem } from './GridSystem'
import { Character } from './Character'
import { ScanZoneBorder } from './ScanZoneBorder'
import { EMPFlash } from './EMPFlash'

export function GameScene() {
  return (
    <>
      <Environment />
      <PostProcessing />
      <CameraRig />
      <ReflectiveFloor />
      <GridSystem />
      <Character />
      <ScanZoneBorder />
      <EMPFlash />
    </>
  )
}
