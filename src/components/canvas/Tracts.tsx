import { useMemo } from 'react'
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
  key: string
}

function buildTracts(): TractData[] {
  const tracts: TractData[] = []

  for (const conn of CONNECTIONS) {
    const fromRegion = REGION_MAP.get(conn.from)
    const toRegion = REGION_MAP.get(conn.to)
    if (!fromRegion || !toRegion) continue

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
      key: `${conn.from}-${conn.to}`,
    })
  }

  return tracts
}

function TractMesh({ curve, radius, color }: TractData) {
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, TUBE_SEGMENTS, radius, RADIAL_SEGMENTS, false),
    [curve, radius],
  )

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
      }),
    [color],
  )

  return <mesh geometry={geometry} material={material} />
}

export default function Tracts() {
  const tractsActive = useBrainStore((s) => s.activeLayers.has('tracts'))
  const tracts = useMemo(() => buildTracts(), [])

  if (!tractsActive) return null

  return (
    <group>
      {tracts.map((t) => (
        <TractMesh key={t.key} curve={t.curve} radius={t.radius} color={t.color} />
      ))}
    </group>
  )
}
