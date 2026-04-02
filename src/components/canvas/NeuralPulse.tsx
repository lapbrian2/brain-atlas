import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ANATOMICAL_REGIONS } from './BrainModel'

/**
 * NeuralPulse — a slow, continuous pulsing glow across the brain surface.
 * The pulse travels outward from the brainstem, rippling up across the cortex
 * like alpha-wave propagation (~4 second period).
 *
 * Works by modulating the emissiveIntensity of each region mesh's material
 * based on distance from brainstem center and time.
 */

// Brainstem center position for wave origin
const BRAINSTEM_CENTER = new THREE.Vector3(0, -0.55, -0.18)

// Pre-compute distances from brainstem for each anatomical region
const REGION_DISTANCES: number[] = ANATOMICAL_REGIONS.map((region) => {
  const pos = new THREE.Vector3(...region.position)
  return pos.distanceTo(BRAINSTEM_CENTER)
})

// Normalize distances to 0-1 range
const maxDist = Math.max(...REGION_DISTANCES)
const NORMALIZED_DISTANCES = REGION_DISTANCES.map((d) => d / maxDist)

export default function NeuralPulse() {
  // Store refs to all brain meshes we'll modulate
  const parentRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!parentRef.current) return
    const parent = parentRef.current.parent
    if (!parent) return

    const t = state.clock.elapsedTime
    const period = 4.0 // seconds per pulse cycle
    const waveSpeed = 1.2 // how fast the wave propagates outward

    // Walk all mesh children of the brain group
    parent.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const mat = child.material
      if (!(mat instanceof THREE.MeshPhysicalMaterial)) return

      // Find matching anatomical region by position
      const childPos = child.position
      let closestIdx = 0
      let closestDist = Infinity
      for (let i = 0; i < ANATOMICAL_REGIONS.length; i++) {
        const rp = ANATOMICAL_REGIONS[i].position
        const dx = childPos.x - rp[0]
        const dy = childPos.y - rp[1]
        const dz = childPos.z - rp[2]
        const d = dx * dx + dy * dy + dz * dz
        if (d < closestDist) {
          closestDist = d
          closestIdx = i
        }
      }

      // Wave: sine wave traveling outward from brainstem
      const dist = NORMALIZED_DISTANCES[closestIdx]
      const phase = (t / period) * Math.PI * 2.0 - dist * waveSpeed * Math.PI * 2.0
      const pulse = Math.sin(phase) * 0.5 + 0.5 // 0-1

      // Map to emissive intensity range: 0.02 (base) to 0.08 (peak)
      const pulseIntensity = 0.02 + pulse * 0.06
      mat.emissiveIntensity = Math.max(mat.emissiveIntensity, pulseIntensity)
    })
  })

  // Invisible group just to get into the scene graph
  return <group ref={parentRef} />
}
