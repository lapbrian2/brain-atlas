import { useMemo } from 'react'
import * as THREE from 'three'
import { useBrainStore } from '../../store/useBrainStore'

/**
 * BloodVessels — major cerebral arteries rendered as thin tube geometries.
 * Includes the Circle of Willis at the base, middle cerebral arteries branching
 * laterally, and anterior/posterior cerebral arteries.
 *
 * Toggled via the 'vessels' layer in the store.
 */

interface VesselPath {
  points: [number, number, number][]
  radius: number
  key: string
}

function buildVesselPaths(): VesselPath[] {
  const vessels: VesselPath[] = []
  const r = 0.004 // default vessel radius

  // Internal Carotid Arteries (ascending from neck)
  vessels.push({
    key: 'ica-left',
    radius: r * 1.2,
    points: [
      [-0.08, -0.8, 0.1],
      [-0.10, -0.5, 0.12],
      [-0.10, -0.3, 0.15],
      [-0.08, -0.15, 0.18],
    ],
  })
  vessels.push({
    key: 'ica-right',
    radius: r * 1.2,
    points: [
      [0.08, -0.8, 0.1],
      [0.10, -0.5, 0.12],
      [0.10, -0.3, 0.15],
      [0.08, -0.15, 0.18],
    ],
  })

  // Circle of Willis — ring at base of brain
  const willisY = -0.18
  const willisZ = 0.12
  const willisR = 0.12
  const willisPoints: [number, number, number][] = []
  for (let i = 0; i <= 16; i++) {
    const angle = (i / 16) * Math.PI * 2
    willisPoints.push([
      Math.sin(angle) * willisR,
      willisY,
      willisZ + Math.cos(angle) * willisR * 0.6,
    ])
  }
  vessels.push({ key: 'circle-of-willis', radius: r, points: willisPoints })

  // Anterior Cerebral Arteries (run medially forward along midline)
  vessels.push({
    key: 'aca-left',
    radius: r,
    points: [
      [-0.04, -0.15, 0.20],
      [-0.02, 0.0, 0.35],
      [-0.01, 0.20, 0.50],
      [-0.01, 0.40, 0.55],
      [-0.01, 0.55, 0.40],
    ],
  })
  vessels.push({
    key: 'aca-right',
    radius: r,
    points: [
      [0.04, -0.15, 0.20],
      [0.02, 0.0, 0.35],
      [0.01, 0.20, 0.50],
      [0.01, 0.40, 0.55],
      [0.01, 0.55, 0.40],
    ],
  })

  // Middle Cerebral Arteries (branch laterally into Sylvian fissure)
  vessels.push({
    key: 'mca-left',
    radius: r * 1.1,
    points: [
      [-0.10, -0.15, 0.18],
      [-0.25, -0.05, 0.15],
      [-0.40, 0.05, 0.10],
      [-0.55, 0.10, 0.05],
      [-0.60, 0.20, -0.05],
    ],
  })
  vessels.push({
    key: 'mca-right',
    radius: r * 1.1,
    points: [
      [0.10, -0.15, 0.18],
      [0.25, -0.05, 0.15],
      [0.40, 0.05, 0.10],
      [0.55, 0.10, 0.05],
      [0.60, 0.20, -0.05],
    ],
  })

  // Posterior Cerebral Arteries (wrap around to occipital)
  vessels.push({
    key: 'pca-left',
    radius: r,
    points: [
      [-0.06, -0.18, 0.06],
      [-0.12, -0.10, -0.10],
      [-0.15, 0.0, -0.30],
      [-0.12, 0.10, -0.50],
      [-0.10, 0.20, -0.60],
    ],
  })
  vessels.push({
    key: 'pca-right',
    radius: r,
    points: [
      [0.06, -0.18, 0.06],
      [0.12, -0.10, -0.10],
      [0.15, 0.0, -0.30],
      [0.12, 0.10, -0.50],
      [0.10, 0.20, -0.60],
    ],
  })

  // Basilar Artery (runs up the brainstem ventral surface)
  vessels.push({
    key: 'basilar',
    radius: r * 1.3,
    points: [
      [0, -0.75, -0.05],
      [0, -0.60, 0.0],
      [0, -0.45, 0.05],
      [0, -0.30, 0.08],
      [0, -0.18, 0.10],
    ],
  })

  // Vertebral arteries (joining at basilar)
  vessels.push({
    key: 'vertebral-left',
    radius: r,
    points: [
      [-0.10, -0.90, -0.10],
      [-0.08, -0.80, -0.05],
      [-0.04, -0.75, -0.03],
      [0, -0.75, -0.05],
    ],
  })
  vessels.push({
    key: 'vertebral-right',
    radius: r,
    points: [
      [0.10, -0.90, -0.10],
      [0.08, -0.80, -0.05],
      [0.04, -0.75, -0.03],
      [0, -0.75, -0.05],
    ],
  })

  return vessels
}

function VesselTube({ path }: { path: VesselPath }) {
  const { geometry, material } = useMemo(() => {
    const pts = path.points.map((p) => new THREE.Vector3(...p))
    const curve = new THREE.CatmullRomCurve3(pts)
    const geo = new THREE.TubeGeometry(curve, 24, path.radius, 6, false)
    // Standard material with subtle emissive tint
    const matPhys = new THREE.MeshStandardMaterial({
      color: '#8B0000',
      emissive: '#FF0000',
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      roughness: 0.7,
      metalness: 0.0,
    })
    // Return the standard material for emissive support
    return { geometry: geo, material: matPhys }
  }, [path])

  return <mesh geometry={geometry} material={material} />
}

export default function BloodVessels() {
  const vesselsActive = useBrainStore((s) => s.activeLayers.has('vessels'))
  const vesselPaths = useMemo(() => buildVesselPaths(), [])

  if (!vesselsActive) return null

  return (
    <group>
      {vesselPaths.map((path) => (
        <VesselTube key={path.key} path={path} />
      ))}
    </group>
  )
}
