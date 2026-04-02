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

/**
 * Generate surface vasculature — thin pial arteries and veins that run along
 * the cortical surface. These are the vessels visible on a real brain specimen.
 * Uses seeded random to produce consistent curves that follow the brain surface.
 */
function buildSurfaceVessels(): VesselPath[] {
  const vessels: VesselPath[] = []
  const r = 0.002 // thinner than deep vessels

  // Simple seeded random
  let seed = 7919
  function seededRandom(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }

  // Brain surface approximation: points on an ellipsoid
  // roughly matching cortex bounds (0.7 wide, 0.5 tall, 0.8 deep)
  function surfacePoint(theta: number, phi: number): [number, number, number] {
    const rx = 0.72, ry = 0.55, rz = 0.68
    return [
      rx * Math.sin(phi) * Math.cos(theta),
      ry * Math.cos(phi) + 0.15, // offset to brain center
      rz * Math.sin(phi) * Math.sin(theta),
    ]
  }

  // Generate ~30 surface vessel curves
  for (let i = 0; i < 30; i++) {
    const isArtery = i < 18 // 18 arteries, 12 veins
    const theta0 = seededRandom() * Math.PI * 2
    const phi0 = 0.3 + seededRandom() * 1.6 // avoid poles
    const steps = 4 + Math.floor(seededRandom() * 3)
    const points: [number, number, number][] = []

    let theta = theta0
    let phi = phi0

    for (let s = 0; s <= steps; s++) {
      const p = surfacePoint(theta, phi)
      // Add small random perturbation for organic look
      points.push([
        p[0] + (seededRandom() - 0.5) * 0.04,
        p[1] + (seededRandom() - 0.5) * 0.03,
        p[2] + (seededRandom() - 0.5) * 0.04,
      ])
      // Random walk along surface
      theta += (seededRandom() - 0.4) * 0.4
      phi += (seededRandom() - 0.5) * 0.25
      phi = Math.max(0.2, Math.min(2.8, phi))
    }

    vessels.push({
      key: `pial-${isArtery ? 'artery' : 'vein'}-${i}`,
      radius: r * (0.8 + seededRandom() * 0.6),
      points,
    })
  }

  return vessels
}

/** Color type for vessel rendering */
type VesselType = 'deep' | 'artery' | 'vein'

function getVesselColor(key: string): { color: string; emissive: string } {
  if (key.includes('artery')) return { color: '#660000', emissive: '#880000' }
  if (key.includes('vein')) return { color: '#330044', emissive: '#440066' }
  return { color: '#8B0000', emissive: '#FF0000' }
}

function getVesselType(key: string): VesselType {
  if (key.includes('artery')) return 'artery'
  if (key.includes('vein')) return 'vein'
  return 'deep'
}

function VesselTube({ path }: { path: VesselPath }) {
  const vesselType = getVesselType(path.key)
  const colors = getVesselColor(path.key)

  const { geometry, material } = useMemo(() => {
    const pts = path.points.map((p) => new THREE.Vector3(...p))
    const curve = new THREE.CatmullRomCurve3(pts)
    const segments = vesselType === 'deep' ? 24 : 16
    const geo = new THREE.TubeGeometry(curve, segments, path.radius, 6, false)
    const matPhys = new THREE.MeshStandardMaterial({
      color: colors.color,
      emissive: colors.emissive,
      emissiveIntensity: vesselType === 'deep' ? 0.1 : 0.05,
      transparent: true,
      opacity: vesselType === 'deep' ? 0.3 : 0.45,
      depthWrite: false,
      roughness: 0.7,
      metalness: 0.0,
    })
    return { geometry: geo, material: matPhys }
  }, [path, vesselType, colors])

  return <mesh geometry={geometry} material={material} />
}

export default function BloodVessels() {
  const vesselsActive = useBrainStore((s) => s.activeLayers.has('vessels'))
  const deepVessels = useMemo(() => buildVesselPaths(), [])
  const surfaceVessels = useMemo(() => buildSurfaceVessels(), [])

  if (!vesselsActive) return null

  return (
    <group>
      {deepVessels.map((path) => (
        <VesselTube key={path.key} path={path} />
      ))}
      {surfaceVessels.map((path) => (
        <VesselTube key={path.key} path={path} />
      ))}
    </group>
  )
}
