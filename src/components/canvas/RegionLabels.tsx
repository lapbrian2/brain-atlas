import { useMemo } from 'react'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { BRAIN_REGIONS } from '../../data/regions'
import { useBrainStore } from '../../store/useBrainStore'

const LABEL_OFFSET_Y = 0.22

function RegionLabel({ id, name, position }: {
  id: string
  name: string
  position: [number, number, number]
}) {
  const selectedRegion = useBrainStore((s) => s.selectedRegion)
  if (selectedRegion === id) return null

  const labelPos: [number, number, number] = useMemo(
    () => [position[0], position[1] + LABEL_OFFSET_Y, position[2]],
    [position],
  )

  const linePoints = useMemo(
    () => [new THREE.Vector3(...labelPos), new THREE.Vector3(...position)],
    [labelPos, position],
  )

  return (
    <group>
      <Line
        points={linePoints}
        color="#ffffff"
        lineWidth={0.5}
        transparent
        opacity={0.25}
      />
      <Html position={labelPos} center distanceFactor={5} zIndexRange={[10, 0]}>
        <div
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '9px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {name}
        </div>
      </Html>
    </group>
  )
}

export default function RegionLabels() {
  const labelsActive = useBrainStore(
    (s) => s.activeLayers.has('labels'),
  )

  if (!labelsActive) return null

  return (
    <group>
      {BRAIN_REGIONS.map((r) => (
        <RegionLabel
          key={r.id}
          id={r.id}
          name={r.name}
          position={r.position}
        />
      ))}
    </group>
  )
}
