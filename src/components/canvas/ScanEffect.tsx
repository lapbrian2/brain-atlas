import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * ScanEffect — dual-axis scan lines sweeping through the brain.
 * Creates a "being analyzed" medical scanner feeling.
 *
 * Horizontal line sweeps up/down every 6 seconds.
 * Vertical line sweeps left/right every 8 seconds.
 * Color: teal (#00CCFF).
 * Always active (not gated by view mode).
 */

const H_SCAN_RANGE = 1.6
const H_SCAN_CENTER = 0.0
const H_SCAN_PERIOD = 6.0

const V_SCAN_RANGE = 1.8
const V_SCAN_PERIOD = 8.0

export default function ScanEffect() {
  const hMeshRef = useRef<THREE.Mesh>(null)
  const vMeshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Horizontal scan — ping-pong vertically
    if (hMeshRef.current) {
      const ht = t / H_SCAN_PERIOD
      const pingPong = Math.abs((ht % 1.0) * 2.0 - 1.0)
      const y = H_SCAN_CENTER - H_SCAN_RANGE / 2 + pingPong * H_SCAN_RANGE
      hMeshRef.current.position.y = y
    }

    // Vertical scan — ping-pong horizontally
    if (vMeshRef.current) {
      const vt = t / V_SCAN_PERIOD
      const pingPong = Math.abs((vt % 1.0) * 2.0 - 1.0)
      const x = -V_SCAN_RANGE / 2 + pingPong * V_SCAN_RANGE
      vMeshRef.current.position.x = x
    }
  })

  const scanShader = {
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float centerDist = abs(vUv.y - 0.5) * 2.0;
        float line = smoothstep(0.98, 1.0, 1.0 - centerDist) * 0.4;
        float glow = exp(-centerDist * 8.0) * 0.06;
        float radial = 1.0 - smoothstep(0.3, 0.5, length(vUv - 0.5));
        float alpha = (line + glow) * radial;
        vec3 color = vec3(0.0, 0.8, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  }

  return (
    <group>
      {/* Horizontal scan line */}
      <mesh ref={hMeshRef} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.0, 3.0]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{}}
          vertexShader={scanShader.vertexShader}
          fragmentShader={scanShader.fragmentShader}
        />
      </mesh>

      {/* Vertical scan line */}
      <mesh ref={vMeshRef} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.0, 3.0]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{}}
          vertexShader={scanShader.vertexShader}
          fragmentShader={scanShader.fragmentShader}
        />
      </mesh>
    </group>
  )
}
