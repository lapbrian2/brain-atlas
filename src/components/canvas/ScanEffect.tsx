import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBrainStore } from '../../store/useBrainStore'

/**
 * ScanEffect — a horizontal scan line that slowly sweeps up/down through the brain.
 * Creates a "being analyzed" feeling. Only active in Explorer mode.
 *
 * Implemented as a transparent plane with an emissive edge that moves vertically.
 * Speed: one pass every 8 seconds.
 * Color: cyan (#00E5FF) at very low opacity.
 */

const SCAN_HEIGHT_RANGE = 1.6 // total vertical range of scan
const SCAN_Y_CENTER = 0.0
const SCAN_PERIOD = 8.0 // seconds per pass

export default function ScanEffect() {
  const meshRef = useRef<THREE.Mesh>(null)
  const viewMode = useBrainStore((s) => s.viewMode)

  useFrame((state) => {
    if (!meshRef.current) return

    // Vertical ping-pong movement
    const t = state.clock.elapsedTime / SCAN_PERIOD
    const pingPong = Math.abs((t % 1.0) * 2.0 - 1.0) // 0->1->0 triangle wave
    const y = SCAN_Y_CENTER - SCAN_HEIGHT_RANGE / 2 + pingPong * SCAN_HEIGHT_RANGE

    meshRef.current.position.y = y
  })

  if (viewMode !== 'explorer') return null

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.0, 3.0]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{}}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          void main() {
            // Edge glow: strongest at center horizontal band
            float centerDist = abs(vUv.y - 0.5) * 2.0;
            // Thin bright line at center
            float line = smoothstep(0.98, 1.0, 1.0 - centerDist) * 0.3;
            // Soft glow around line
            float glow = exp(-centerDist * 8.0) * 0.05;
            // Fade out at edges of plane (radial)
            float radial = 1.0 - smoothstep(0.3, 0.5, length(vUv - 0.5));

            float alpha = (line + glow) * radial;
            vec3 color = vec3(0.0, 0.898, 1.0); // #00E5FF
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  )
}
