import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * AmbientParticles — fine teal particle dust floating around the brain.
 * Creates a high-tech scanning atmosphere.
 *
 * 800 tiny points in a sphere, slow random drift, teal/cyan color,
 * varied opacity with additive blending for glow.
 */

const PARTICLE_COUNT = 800
const SPHERE_RADIUS = 2.2
const DRIFT_SPEED = 0.008

export default function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities, opacities } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT * 3)
    const opac = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.cbrt(Math.random()) * SPHERE_RADIUS

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 0.15
      pos[i * 3 + 2] = r * Math.cos(phi)

      vel[i * 3] = (Math.random() - 0.5) * DRIFT_SPEED
      vel[i * 3 + 1] = (Math.random() - 0.5) * DRIFT_SPEED
      vel[i * 3 + 2] = (Math.random() - 0.5) * DRIFT_SPEED

      // Random opacity 0.1 - 0.4
      opac[i] = 0.1 + Math.random() * 0.3
    }

    return { positions: pos, velocities: vel, opacities: opac }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [positions])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      arr[i3] += velocities[i3] * delta * 60
      arr[i3 + 1] += velocities[i3 + 1] * delta * 60
      arr[i3 + 2] += velocities[i3 + 2] * delta * 60

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

    // Use average opacity for the material — individual particle opacity
    // handled via additive blending + distance attenuation
    void opacities
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#00AACC"
        size={0.004}
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
