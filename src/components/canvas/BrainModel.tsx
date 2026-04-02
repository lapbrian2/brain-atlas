import { useRef, useMemo, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { BRAIN_REGIONS, BrainRegion, REGION_MAP } from '../../data/regions'
import { CONNECTIONS } from '../../data/connectome'
import { useBrainStore } from '../../store/useBrainStore'
import { activityState } from './ActivityOverlay'

// ============================================================
// Lobe color map — saturated, luminous data-viz palette
// ============================================================
const LOBE_COLORS: Record<BrainRegion['lobe'], string> = {
  frontal: '#4488FF',
  parietal: '#00CC88',
  temporal: '#FFaa33',
  occipital: '#FF44AA',
  subcortical: '#00DDFF',
  cerebellum: '#AA66FF',
  brainstem: '#FFFFFF',
}

// Node size ranges based on region "importance" (approximated by connection count)
const MIN_NODE_SIZE = 0.025
const MAX_NODE_SIZE = 0.065

// Pre-compute connection counts per region for sizing
const CONNECTION_COUNTS = new Map<string, number>()
for (const conn of CONNECTIONS) {
  CONNECTION_COUNTS.set(conn.from, (CONNECTION_COUNTS.get(conn.from) ?? 0) + 1)
  CONNECTION_COUNTS.set(conn.to, (CONNECTION_COUNTS.get(conn.to) ?? 0) + 1)
}
const maxConnCount = Math.max(...CONNECTION_COUNTS.values(), 1)

function getNodeSize(regionId: string): number {
  const count = CONNECTION_COUNTS.get(regionId) ?? 1
  const t = count / maxConnCount
  return MIN_NODE_SIZE + t * (MAX_NODE_SIZE - MIN_NODE_SIZE)
}

// ============================================================
// BrainShell — point cloud forming brain silhouette
// ============================================================
function BrainShell() {
  const pointsRef = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const positions: number[] = []

    // Generate two hemisphere point clouds
    const pointsPerHemisphere = 5000
    const separation = 0.04 // gap for longitudinal fissure

    for (let h = 0; h < 2; h++) {
      const side = h === 0 ? -1 : 1

      for (let i = 0; i < pointsPerHemisphere; i++) {
        // Uniform random on sphere surface
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)

        // Base sphere radius with slight brain-like shaping
        const baseR = 0.85

        // Elongate front-to-back (z-axis 1.15x)
        // Slightly flatten top-to-bottom (y-axis 0.85x)
        let x = baseR * Math.sin(phi) * Math.cos(theta)
        let y = baseR * 0.82 * Math.cos(phi)
        let z = baseR * 1.1 * Math.sin(phi) * Math.sin(theta)

        // Only keep points on the correct hemisphere
        if (side === -1 && x > -separation) x = -separation - Math.abs(x) * 0.5
        if (side === 1 && x < separation) x = separation + Math.abs(x) * 0.5

        // Scale hemisphere width
        x *= 0.65

        // Offset vertically to brain center
        y += 0.15

        // Add subtle noise for organic feel
        x += (Math.random() - 0.5) * 0.025
        y += (Math.random() - 0.5) * 0.025
        z += (Math.random() - 0.5) * 0.025

        // Slightly narrow the bottom (brain tapers underneath)
        const yNorm = (y - 0.15) / (baseR * 0.82)
        if (yNorm < -0.3) {
          const taper = 1.0 - Math.abs(yNorm + 0.3) * 0.4
          x *= Math.max(taper, 0.5)
          z *= Math.max(taper, 0.6)
        }

        positions.push(x, y, z)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  // Slow rotation
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#C0D8FF"
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

// ============================================================
// RegionNode — a single glowing sphere at a brain region position
// ============================================================
interface RegionNodeProps {
  region: BrainRegion
  index: number
}

function RegionNode({ region, index }: RegionNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const selectRegion = useBrainStore((s) => s.selectRegion)
  const setHovered = useBrainStore((s) => s.setHoveredRegion)
  const selectedRegion = useBrainStore((s) => s.selectedRegion)
  const hoveredRegion = useBrainStore((s) => s.hoveredRegion)

  const lobeColor = LOBE_COLORS[region.lobe]
  const nodeSize = getNodeSize(region.id)
  const isSelected = selectedRegion === region.id
  const isHovered = hoveredRegion === region.id

  const color = useMemo(() => new THREE.Color(lobeColor), [lobeColor])

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      selectRegion(isSelected ? null : region.id)
    },
    [selectRegion, region.id, isSelected],
  )

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      setHovered(region.id)
      document.body.style.cursor = 'pointer'
    },
    [setHovered, region.id],
  )

  const handlePointerOut = useCallback(() => {
    setHovered(null)
    document.body.style.cursor = 'default'
  }, [setHovered])

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return

    const mat = materialRef.current
    const mesh = meshRef.current

    // Check activity state
    const act = activityState.active
      ? (activityState.activations.find((a) => a.id === region.id)?.currentActivation ?? 0.05)
      : 0

    // Base pulse
    const pulseOffset = index * 0.7
    const pulseSpeed = act > 0.1 ? 2.5 + act * 2.0 : 1.2
    const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed + pulseOffset) * 0.5 + 0.5

    // Scale
    let targetScale = nodeSize
    if (activityState.active) {
      targetScale = nodeSize * (0.5 + act * 1.5)
    }
    if (isHovered) targetScale *= 1.4
    if (isSelected) targetScale *= 1.3

    const currentScale = mesh.scale.x
    const newScale = currentScale + (targetScale - currentScale) * 0.1
    mesh.scale.setScalar(newScale)

    // Emissive intensity
    let baseIntensity = 0.8
    if (activityState.active) {
      baseIntensity = 0.2 + act * 2.5
    }
    if (isHovered) baseIntensity *= 1.8
    if (isSelected) baseIntensity *= 1.5

    const pulseIntensity = baseIntensity + pulse * 0.3
    mat.emissiveIntensity = pulseIntensity
  })

  return (
    <mesh
      ref={meshRef}
      position={region.position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      scale={nodeSize}
    >
      <sphereGeometry args={[1, 24, 24]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        transparent
        opacity={0.9}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  )
}

// ============================================================
// ConnectionLines — luminous arcs between connected regions
// ============================================================
function ConnectionLines() {
  const viewMode = useBrainStore((s) => s.viewMode)
  const selectedRegion = useBrainStore((s) => s.selectedRegion)
  const hoveredRegion = useBrainStore((s) => s.hoveredRegion)

  const lines = useMemo(() => {
    return CONNECTIONS.map((conn, i) => {
      const fromRegion = REGION_MAP.get(conn.from)
      const toRegion = REGION_MAP.get(conn.to)
      if (!fromRegion || !toRegion) return null

      const start = new THREE.Vector3(...fromRegion.position)
      const end = new THREE.Vector3(...toRegion.position)
      const mid = start.clone().add(end).multiplyScalar(0.5)
      // Elevate midpoint for arc
      mid.y += 0.25 * (0.5 + conn.strength * 0.5)

      // Build curve
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      const points = curve.getPoints(32)

      return {
        key: `${conn.from}-${conn.to}-${i}`,
        points,
        strength: conn.strength,
        fromId: conn.from,
        toId: conn.to,
        fromColor: LOBE_COLORS[fromRegion.lobe],
        toColor: LOBE_COLORS[toRegion.lobe],
      }
    }).filter(Boolean) as {
      key: string
      points: THREE.Vector3[]
      strength: number
      fromId: string
      toId: string
      fromColor: string
      toColor: string
    }[]
  }, [])

  // Filter based on mode
  const focusRegion = hoveredRegion ?? selectedRegion

  const visibleLines = useMemo(() => {
    if (viewMode === 'connectivity') return lines
    if (viewMode === 'activity') {
      if (!activityState.active) return []
      // Show lines between active regions
      return lines.filter((l) => {
        const fromAct = activityState.activations.find((a) => a.id === l.fromId)?.currentActivation ?? 0
        const toAct = activityState.activations.find((a) => a.id === l.toId)?.currentActivation ?? 0
        return fromAct > 0.3 && toAct > 0.3
      })
    }
    // Explorer mode: only show for focused region
    if (!focusRegion) return []
    return lines.filter((l) => l.fromId === focusRegion || l.toId === focusRegion)
  }, [viewMode, focusRegion, lines])

  return (
    <group>
      {visibleLines.map((line) => (
        <ConnectionLine
          key={line.key}
          points={line.points}
          strength={line.strength}
          color={line.fromColor}
        />
      ))}
    </group>
  )
}

interface ConnectionLineProps {
  points: THREE.Vector3[]
  strength: number
  color: string
}

function ConnectionLine({ points, strength, color }: ConnectionLineProps) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.08 + strength * 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return new THREE.Line(geo, mat)
  }, [points, strength, color])

  return <primitive object={lineObj} />
}

// ============================================================
// BrainModel — the main composed component
// ============================================================
export default function BrainModel() {
  const selectRegion = useBrainStore((s) => s.selectRegion)

  const handleMiss = useCallback(() => {
    selectRegion(null)
  }, [selectRegion])

  return (
    <group onPointerMissed={handleMiss}>
      <BrainShell />
      {BRAIN_REGIONS.map((region, i) => (
        <RegionNode key={region.id} region={region} index={i} />
      ))}
      <ConnectionLines />
    </group>
  )
}
