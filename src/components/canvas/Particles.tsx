import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBrainStore } from '../../store/useBrainStore'
import { getHighways, type HighwayData } from './BrainModel'

/**
 * Highway Light Pulses — bright particles that travel along neon highway tubes.
 *
 * Each highway gets 5-8 particles that flow from one end to the other,
 * creating a "data flowing through neural highways" effect.
 * Particles are larger and brighter than ambient particles.
 * Speed is proportional to connection strength.
 */

const PARTICLES_PER_HIGHWAY = 6
const BASE_SPEED = 0.12
const PARTICLE_RADIUS = 0.006

export default function Particles() {
  const particlesActive = useBrainStore((s) => s.activeLayers.has('particles'))
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const highwaysRef = useRef<HighwayData[]>([])

  // Re-check highways each frame since they may be built after this component mounts
  const maxCount = useMemo(() => {
    // Pre-allocate for all possible connections
    return 120 * PARTICLES_PER_HIGHWAY // 120 connections max * 6 particles each
  }, [])

  const offsets = useMemo(() => new Float32Array(maxCount), [maxCount])
  const speeds = useMemo(() => new Float32Array(maxCount), [maxCount])
  const colorArr = useMemo(() => new Float32Array(maxCount * 3), [maxCount])
  const initialized = useRef(false)

  const geometry = useMemo(
    () => new THREE.SphereGeometry(PARTICLE_RADIUS, 6, 6),
    [],
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, delta) => {
    if (!meshRef.current || !particlesActive) return

    const highways = getHighways()
    if (highways.length === 0) return

    // Initialize on first frame that has highways
    if (!initialized.current || highwaysRef.current !== highways) {
      highwaysRef.current = highways
      initialized.current = true
      let idx = 0
      for (let h = 0; h < highways.length && idx < maxCount; h++) {
        const hw = highways[h]
        for (let p = 0; p < PARTICLES_PER_HIGHWAY && idx < maxCount; p++) {
          offsets[idx] = Math.random() // random starting position along curve
          speeds[idx] = BASE_SPEED * (0.5 + hw.strength)
          colorArr[idx * 3] = hw.color.r
          colorArr[idx * 3 + 1] = hw.color.g
          colorArr[idx * 3 + 2] = hw.color.b
          idx++
        }
      }
      // Zero out unused instances
      for (let i = idx; i < maxCount; i++) {
        dummy.position.set(0, 0, -100) // offscreen
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
      }
    }

    const highways2 = highwaysRef.current
    const totalActive = Math.min(highways2.length * PARTICLES_PER_HIGHWAY, maxCount)

    for (let i = 0; i < totalActive; i++) {
      const hwIdx = Math.floor(i / PARTICLES_PER_HIGHWAY)
      if (hwIdx >= highways2.length) break

      const hw = highways2[hwIdx]

      // Advance position along curve
      offsets[i] = (offsets[i] + speeds[i] * delta) % 1

      const t = offsets[i]
      const pos = hw.curve.getPointAt(t)
      dummy.position.copy(pos)

      // Brightness pulse: particles are 2-3x brighter at center of their travel
      const edgeFade = Math.min(t * 5.0, (1.0 - t) * 5.0, 1.0)
      const speedFactor = 1.0 + (hw.strength * 0.8)
      const scale = speedFactor * edgeFade
      dummy.scale.setScalar(scale)

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.count = totalActive
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (!particlesActive) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, maxCount]}
    >
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
