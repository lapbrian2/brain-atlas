import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CONNECTIONS, Connection } from '../../data/connectome'
import { REGION_MAP } from '../../data/regions'
import { useBrainStore } from '../../store/useBrainStore'

const TYPE_COLORS: Record<Connection['type'], string> = {
  cortical: '#00E5FF',
  subcortical: '#FF4081',
  commissural: '#FFD700',
  projection: '#76FF03',
}

const ARC_LIFT = 0.4
const MIN_RADIUS = 0.004
const MAX_RADIUS = 0.016
const TUBE_SEGMENTS = 24
const RADIAL_SEGMENTS = 6

interface TractData {
  curve: THREE.CatmullRomCurve3
  radius: number
  color: string
  fromColor: string
  toColor: string
  key: string
  index: number
}

function buildTracts(): TractData[] {
  const tracts: TractData[] = []

  CONNECTIONS.forEach((conn, index) => {
    const fromRegion = REGION_MAP.get(conn.from)
    const toRegion = REGION_MAP.get(conn.to)
    if (!fromRegion || !toRegion) return

    const start = new THREE.Vector3(...fromRegion.position)
    const end = new THREE.Vector3(...toRegion.position)
    const mid = start.clone().add(end).multiplyScalar(0.5)
    mid.y += ARC_LIFT * (0.5 + conn.strength * 0.5)

    const curve = new THREE.CatmullRomCurve3([start, mid, end])
    const radius = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * conn.strength
    const color = TYPE_COLORS[conn.type]

    tracts.push({
      curve,
      radius,
      color,
      fromColor: fromRegion.color,
      toColor: toRegion.color,
      key: `${conn.from}-${conn.to}`,
      index,
    })
  })

  return tracts
}

function TractMesh({ curve, radius, fromColor, toColor, index }: TractData) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, radius, RADIAL_SEGMENTS, false)

    // Apply vertex colors — gradient from source to target region color
    const count = geo.attributes.position.count
    const colors = new Float32Array(count * 3)
    const cFrom = new THREE.Color(fromColor)
    const cTo = new THREE.Color(toColor)
    const tmpColor = new THREE.Color()

    // TubeGeometry lays out vertices in rings along the curve.
    // Each ring has (RADIAL_SEGMENTS + 1) vertices. We interpolate color per ring.
    const ringSize = RADIAL_SEGMENTS + 1
    const numRings = Math.floor(count / ringSize)

    for (let i = 0; i < count; i++) {
      const ring = Math.floor(i / ringSize)
      const t = numRings > 1 ? ring / (numRings - 1) : 0
      tmpColor.copy(cFrom).lerp(cTo, t)
      colors[i * 3] = tmpColor.r
      colors[i * 3 + 1] = tmpColor.g
      colors[i * 3 + 2] = tmpColor.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [curve, radius, fromColor, toColor])

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
      }),
    [],
  )

  // Pulsing opacity — different tracts pulse at different rates
  useFrame((state) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    const rate = 0.8 + (index % 7) * 0.15 // vary between 0.8 and 1.7 Hz
    const pulse = Math.sin(state.clock.elapsedTime * rate * Math.PI * 2) * 0.5 + 0.5
    mat.opacity = 0.25 + pulse * 0.45 // range 0.25 - 0.70
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}

export default function Tracts() {
  const tractsActive = useBrainStore((s) => s.activeLayers.has('tracts'))
  const tracts = useMemo(() => buildTracts(), [])

  if (!tractsActive) return null

  return (
    <group>
      {tracts.map((t) => (
        <TractMesh
          key={t.key}
          curve={t.curve}
          radius={t.radius}
          color={t.color}
          fromColor={t.fromColor}
          toColor={t.toColor}
          index={t.index}
        />
      ))}
    </group>
  )
}
