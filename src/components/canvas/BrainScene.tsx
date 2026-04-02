import CameraRig from './CameraRig'
import Lighting from './Lighting'
import BrainModel from './BrainModel'
import RegionLabels from './RegionLabels'
import Tracts from './Tracts'
import Particles from './Particles'
import ActivityOverlay from './ActivityOverlay'

export default function BrainScene() {
  return (
    <group>
      <CameraRig />
      <Lighting />
      <BrainModel />
      <RegionLabels />
      <Tracts />
      <Particles />
      <ActivityOverlay />
    </group>
  )
}
