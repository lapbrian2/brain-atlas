import { OrbitControls } from '@react-three/drei'

export default function CameraRig() {
  return (
    <OrbitControls
      autoRotate
      autoRotateSpeed={0.5}
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={8}
      enablePan={false}
      target={[0, 0.3, 0]}
    />
  )
}
