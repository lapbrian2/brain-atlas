import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * AmbientParticles — very fine particle dust floating around the brain,
 * like synaptic sparks or neural dust. Creates a living atmosphere.
 *
 * 500 tiny points in a sphere, slow random drift, cool white/cyan,
 * low opacity with additive blending for glow.
 */

const PARTICLE_COUNT = 500
const SPHERE_RADIUS = 1.8
const DRIFT_SPEED = 0.015

export default function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities, sizes } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT * 3)
    const sz = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random position in sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.cbrt(Math.random()) * SPHERE_RADIUS

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 0.15 // offset to brain center
      pos[i * 3 + 2] = r * Math.cos(phi)

      // Random drift velocity
      vel[i * 3] = (Math.random() - 0.5) * DRIFT_SPEED
      vel[i * 3 + 1] = (Math.random() - 0.5) * DRIFT_SPEED
      vel[i * 3 + 2] = (Math.random() - 0.5) * DRIFT_SPEED

      // Random size 0.002 - 0.004
      sz[i] = 0.002 + Math.random() * 0.002
    }

    return { positions: pos, velocities: vel, sizes: sz }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, sizes])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      arr[i3] += velocities[i3] * delta * 60
      arr[i3 + 1] += velocities[i3 + 1] * delta * 60
      arr[i3 + 2] += velocities[i3 + 2] * delta * 60

      // Bounce back if too far from center
      const x = arr[i3]
      const y = arr[i3 + 1] - 0.15
      const z = arr[i3 + 2]
      const dist = Math.sqrt(x * x + y * y + z * z)
      if (dist > SPHERE_RADIUS) {
        velocities[i3] *= -1
        velocities[i3 + 1] *= -1
        velocities[i3 + 2] *= -1
      }
    }

    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#E0F0FF"
        size={0.008}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
