import CameraRig from './CameraRig'
import Lighting from './Lighting'
import BrainModel from './BrainModel'
import RegionLabels from './RegionLabels'
import Tracts from './Tracts'
import Particles from './Particles'
import ActivityOverlay from './ActivityOverlay'
import NeuralPulse from './NeuralPulse'
import BloodVessels from './BloodVessels'
import AmbientParticles from './AmbientParticles'
import ScanEffect from './ScanEffect'

export default function BrainScene() {
  return (
    <group>
      <CameraRig />
      <Lighting />
      <BrainModel />
      <NeuralPulse />
      <BloodVessels />
      <AmbientParticles />
      <ScanEffect />
      <RegionLabels />
      <Tracts />
      <Particles />
      <ActivityOverlay />
    </group>
  )
}
