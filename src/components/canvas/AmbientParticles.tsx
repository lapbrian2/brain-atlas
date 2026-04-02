import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * AmbientParticles — fine neon particle dust floating around the brain.
 * Mixed cyan and magenta palette matching the neon highway aesthetic.
 *
 * 800 tiny points in a sphere, slow random drift,
 * varied opacity with additive blending for glow.
 */

const PARTICLE_COUNT = 800
const SPHERE_RADIUS = 2.2
const DRIFT_SPEED = 0.008

// Neon palette: cyan, magenta, gold, green — matching highway colors
const NEON_PARTICLE_COLORS = [
  new THREE.Color('#00FFEE'), // Electric cyan
  new THREE.Color('#00FFEE'),
  new THREE.Color('#00FFEE'), // Weighted toward cyan
  new THREE.Color('#FF00AA'), // Hot magenta
  new THREE.Color('#FF00AA'),
  new THREE.Color('#FFCC00'), // Neon gold (rare)
  new THREE.Color('#00FF66'), // Laser green (rare)
]

export default function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT * 3)
    const col = new Float32Array(PARTICLE_COUNT * 3)

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

      // Random color from neon palette
      const c = NEON_PARTICLE_COLORS[Math.floor(Math.random() * NEON_PARTICLE_COLORS.length)]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }

    return { positions: pos, velocities: vel, colors: col }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, colors])

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
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        vertexColors
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
