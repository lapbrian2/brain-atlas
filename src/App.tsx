import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import BrainScene from './components/canvas/BrainScene'
import PostProcessing from './components/canvas/PostProcessing'
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
          camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0.5, 4] }}
        >
          <color attach="background" args={['#060612']} />
          <fog attach="fog" args={['#060612', 6, 20]} />

          <Suspense fallback={null}>
            <BrainScene />
            <PostProcessing />
          </Suspense>
        </Canvas>
      </div>

      <div className="loading-fallback" style={{ display: 'none' }}>
        Loading neural atlas...
      </div>

      <footer className="site-footer">
        Built by Brian Lapinski | React Three Fiber + Three.js
      </footer>
    </div>
  )
}

export default App
