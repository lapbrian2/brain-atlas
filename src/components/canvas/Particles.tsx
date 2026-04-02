import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CONNECTIONS, Connection } from '../../data/connectome'
import { REGION_MAP } from '../../data/regions'
import { useBrainStore } from '../../store/useBrainStore'

const PARTICLES_PER_TRACT = 18
const BASE_SPEED = 0.15
const BASE_RADIUS = 0.003

const TYPE_COLORS: Record<Connection['type'], THREE.Color> = {
  cortical: new THREE.Color('#00E5FF'),
  subcortical: new THREE.Color('#FF4081'),
  commissural: new THREE.Color('#FFD700'),
  projection: new THREE.Color('#76FF03'),
}

interface ParticleSpec {
  curve: THREE.CatmullRomCurve3
  color: THREE.Color
  speed: number
}

function buildCurves(): ParticleSpec[] {
  const specs: ParticleSpec[] = []
  for (const conn of CONNECTIONS) {
    const fromR = REGION_MAP.get(conn.from)
    const toR = REGION_MAP.get(conn.to)
    if (!fromR || !toR) continue
    const start = new THREE.Vector3(...fromR.position)
    const end = new THREE.Vector3(...toR.position)
    const mid = start.clone().add(end).multiplyScalar(0.5)
    mid.y += 0.4 * (0.5 + conn.strength * 0.5)
    specs.push({
      curve: new THREE.CatmullRomCurve3([start, mid, end]),
      color: TYPE_COLORS[conn.type],
      speed: BASE_SPEED * (0.5 + conn.strength),
    })
  }
  return specs
}

export default function Particles() {
  const particlesActive = useBrainStore((s) => s.activeLayers.has('particles'))
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const specs = useMemo(() => buildCurves(), [])

  const totalCount = specs.length * PARTICLES_PER_TRACT

  const { offsets, assignments } = useMemo(() => {
    const off = new Float32Array(totalCount)
    const asgn = new Uint16Array(totalCount)
    let idx = 0
    for (let s = 0; s < specs.length; s++) {
      for (let p = 0; p < PARTICLES_PER_TRACT; p++) {
        off[idx] = Math.random()
        asgn[idx] = s
        idx++
      }
    }
    return { offsets: off, assignments: asgn }
  }, [specs, totalCount])

  const colors = useMemo(() => {
    const arr = new Float32Array(totalCount * 3)
    for (let i = 0; i < totalCount; i++) {
      const c = specs[assignments[i]].color
      arr[i * 3] = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    }
    return arr
  }, [specs, assignments, totalCount])

  const geometry = useMemo(
    () => new THREE.SphereGeometry(BASE_RADIUS, 6, 6),
    [],
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, delta) => {
    if (!meshRef.current || !particlesActive) return
    for (let i = 0; i < totalCount; i++) {
      const speed = specs[assignments[i]].speed
      offsets[i] = (offsets[i] + speed * delta) % 1

      const pos = specs[assignments[i]].curve.getPointAt(offsets[i])
      dummy.position.copy(pos)

      // Size varies with speed: faster particles are larger (1.0-1.8x scale)
      const speedFactor = 1.0 + (speed / (BASE_SPEED * 1.5)) * 0.8
      // Fade in/out at start and end of tract
      const t = offsets[i]
      const edgeFade = Math.min(t * 5.0, (1.0 - t) * 5.0, 1.0)
      const scale = speedFactor * edgeFade
      dummy.scale.setScalar(scale)

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (!particlesActive) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, totalCount]}
    >
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
      <instancedBufferAttribute
        attach="instanceColor"
        args={[colors, 3]}
      />
    </instancedMesh>
  )
}
