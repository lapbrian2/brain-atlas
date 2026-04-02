import CameraRig from './CameraRig'
import Lighting from './Lighting'
import BrainModel from './BrainModel'

export default function BrainScene() {
  return (
    <group>
      <CameraRig />
      <Lighting />
      <BrainModel />
    </group>
  )
}
