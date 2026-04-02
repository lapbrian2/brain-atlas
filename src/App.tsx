import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import BrainScene from './components/canvas/BrainScene'
import PostProcessing from './components/canvas/PostProcessing'
import HUD from './components/ui/HUD'
import DataReadout from './components/ui/DataReadout'
import './App.css'

function App() {
  return (
    <div className="app">
      <div className="title-block">
        <h1>Brain Atlas</h1>
        <div className="subtitle">Interactive 3D Neuroscience</div>
      </div>

      <div className="canvas-container">
        <Canvas
          gl={{ antialias: true, localClippingEnabled: true }}
          performance={{ min: 0.5 }}
          dpr={[1, 2]}
          shadows
          camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0.5, 3.5] }}
        >
          <color attach="background" args={['#030308']} />
          <fog attach="fog" args={['#030308', 6, 20]} />

          <Suspense fallback={null}>
            <BrainScene />
            <PostProcessing />
          </Suspense>
        </Canvas>
      </div>

      <HUD />
      <DataReadout />

      <footer className="site-footer">
        Built by Brian Lapinski
      </footer>
    </div>
  )
}

export default App
