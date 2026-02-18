import { Environment } from './Environment'
import { ReflectiveFloor } from './ReflectiveFloor'
import { PostProcessing } from './PostProcessing'
import { CameraRig } from './CameraRig'
import { GridSystem } from './GridSystem'

export function GameScene() {
  return (
    <>
      <Environment />
      <PostProcessing />
      <CameraRig />
      <ReflectiveFloor />
      <GridSystem />
    </>
  )
}
