import CameraRig from './CameraRig'
import Lighting from './Lighting'
import BrainModel from './BrainModel'
import RegionLabels from './RegionLabels'
import Particles from './Particles'
import ActivityOverlay from './ActivityOverlay'
import AmbientParticles from './AmbientParticles'
import ScanEffect from './ScanEffect'

export default function BrainScene() {
  return (
    <group>
      <CameraRig />
      <Lighting />
      <BrainModel />
      <AmbientParticles />
      <ScanEffect />
      <RegionLabels />
      <Particles />
      <ActivityOverlay />
    </group>
  )
}
