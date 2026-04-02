import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { BRAIN_REGIONS, BrainRegion, REGION_MAP } from '../../data/regions'
import { CONNECTIONS, Connection } from '../../data/connectome'
import { useBrainStore } from '../../store/useBrainStore'
import { activityState } from './ActivityOverlay'

// Preload the brain model with Draco decoder support
useGLTF.preload('/models/brain.glb', true)

// ============================================================
// Neon color map by connection type
// ============================================================
const NEON_COLORS: Record<Connection['type'], string> = {
  cortical: '#00FFEE',    // Electric cyan
  subcortical: '#FF00AA', // Hot magenta
  commissural: '#FFCC00', // Neon gold
  projection: '#00FF66',  // Laser green
}

// ============================================================
// Module-level surface positions — shared between components
// ============================================================
let surfacePositionsMap: Map<string, THREE.Vector3> = new Map()

export function getSurfacePosition(regionId: string): THREE.Vector3 | undefined {
  return surfacePositionsMap.get(regionId)
}

// Store brain meshes at module level for raycasting in highway surface projection
let brainSurfaceMeshes: THREE.Mesh[] = []

// ============================================================
// Project regions onto brain surface via raycasting
// ============================================================
function projectRegionsOntoSurface(
  brainMeshes: THREE.Mesh[],
  regions: BrainRegion[],
): Map<string, THREE.Vector3> {
  const raycaster = new THREE.Raycaster()
  const result = new Map<string, THREE.Vector3>()

  for (const region of regions) {
    const approxPos = new THREE.Vector3(...region.position)
    const dir = approxPos.clone().normalize()

    // Cast from far outside the brain inward toward center
    const origin = dir.clone().multiplyScalar(3)
    raycaster.set(origin, dir.clone().negate())

    const intersects = raycaster.intersectObjects(brainMeshes, false)
    if (intersects.length > 0) {
      const hitPoint = intersects[0].point.clone()
      const normal = intersects[0].face?.normal ?? dir
      hitPoint.add(normal.clone().multiplyScalar(0.01))
      result.set(region.id, hitPoint)
    } else {
      // Subcortical / deep structure — keep position but scale down to fit inside brain
      result.set(region.id, approxPos.clone().multiplyScalar(0.4))
    }
  }

  return result
}

// ============================================================
// Project a point onto the brain surface via raycasting
// ============================================================
function projectPointOntoSurface(
  point: THREE.Vector3,
  meshes: THREE.Mesh[],
): THREE.Vector3 {
  if (meshes.length === 0) return point.clone()

  const raycaster = new THREE.Raycaster()
  const dir = point.clone().normalize()

  // Cast from outside inward
  const origin = dir.clone().multiplyScalar(3)
  raycaster.set(origin, dir.clone().negate())

  const intersects = raycaster.intersectObjects(meshes, false)
  if (intersects.length > 0) {
    const hit = intersects[0].point.clone()
    const normal = intersects[0].face?.normal ?? dir
    // Offset slightly outward so tubes sit ON the surface
    hit.add(normal.clone().multiplyScalar(0.012))
    return hit
  }

  // Fallback: push to approximate surface radius
  return dir.multiplyScalar(point.length() * 0.95)
}

// ============================================================
// BrainWireframe — loads real GLB model, renders THREE layers:
// 1. SOLID dark brain mesh (weight + depth)
// 2. Subtle wireframe overlay (grid lines)
// 3. Outer glow shell (atmospheric rim light)
// ============================================================
function BrainWireframe({ onMeshesReady }: { onMeshesReady: (meshes: THREE.Mesh[]) => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/brain.glb', true)
  const meshesReported = useRef(false)

  const brainData = useMemo(() => {
    const solidGeometries: THREE.BufferGeometry[] = []
    const wireGeometries: THREE.WireframeGeometry[] = []
    const surfaceMeshes: THREE.Mesh[] = []

    const box = new THREE.Box3()

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      if (child.name.toLowerCase().includes('plane')) return

      const geo = child.geometry as THREE.BufferGeometry
      if (!geo || !geo.attributes.position) return

      const clonedGeo = geo.clone()
      child.updateWorldMatrix(true, false)
      clonedGeo.applyMatrix4(child.matrixWorld)
      const meshBox = new THREE.Box3().setFromBufferAttribute(clonedGeo.attributes.position as THREE.BufferAttribute)
      box.union(meshBox)
      clonedGeo.dispose()
    })

    const center = new THREE.Vector3()
    box.getCenter(center)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const targetRadius = 1.1
    const scaleFactor = (targetRadius * 2) / maxDim

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      if (child.name.toLowerCase().includes('plane')) return

      const geo = child.geometry as THREE.BufferGeometry
      if (!geo || !geo.attributes.position) return

      const transformedGeo = geo.clone()
      child.updateWorldMatrix(true, false)
      transformedGeo.applyMatrix4(child.matrixWorld)

      const pos = transformedGeo.attributes.position as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      for (let i = 0; i < pos.count; i++) {
        arr[i * 3] = (arr[i * 3] - center.x) * scaleFactor
        arr[i * 3 + 1] = (arr[i * 3 + 1] - center.y) * scaleFactor
        arr[i * 3 + 2] = (arr[i * 3 + 2] - center.z) * scaleFactor
      }
      pos.needsUpdate = true

      const surfaceGeo = transformedGeo.clone()
      surfaceGeo.computeBoundingSphere()
      surfaceGeo.computeBoundingBox()
      const surfaceMesh = new THREE.Mesh(
        surfaceGeo,
        new THREE.MeshBasicMaterial({ visible: false }),
      )
      surfaceMeshes.push(surfaceMesh)

      const solidGeo = transformedGeo.clone()
      solidGeo.computeVertexNormals()
      solidGeometries.push(solidGeo)

      const wireGeo = new THREE.WireframeGeometry(transformedGeo)
      wireGeometries.push(wireGeo)

      transformedGeo.dispose()
    })

    return { solidGeometries, wireGeometries, surfaceMeshes }
  }, [scene])

  useEffect(() => {
    if (!meshesReported.current && brainData.surfaceMeshes.length > 0) {
      meshesReported.current = true
      onMeshesReady(brainData.surfaceMeshes)
    }
  }, [brainData.surfaceMeshes, onMeshesReady])

  useEffect(() => {
    return () => {
      for (const geo of brainData.solidGeometries) geo.dispose()
      for (const geo of brainData.wireGeometries) geo.dispose()
      for (const sm of brainData.surfaceMeshes) {
        sm.geometry.dispose()
        ;(sm.material as THREE.Material).dispose()
      }
    }
  }, [brainData])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      {/* Layer 1: SOLID dark brain mesh */}
      {brainData.solidGeometries.map((geo, i) => (
        <mesh key={`solid-${i}`} geometry={geo}>
          <meshStandardMaterial
            color="#061018"
            roughness={0.9}
            metalness={0.3}
            transparent
            opacity={0.85}
            emissive="#041010"
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}

      {/* Layer 2: Subtle wireframe OVERLAY */}
      {brainData.wireGeometries.map((geo, i) => (
        <lineSegments key={`wire-${i}`} geometry={geo}>
          <lineBasicMaterial
            color="#0A4050"
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </lineSegments>
      ))}

      {/* Layer 3: Outer glow shell */}
      {brainData.solidGeometries.map((geo, i) => (
        <mesh key={`glow-${i}`} geometry={geo} scale={1.02}>
          <meshBasicMaterial
            color="#0A2030"
            transparent
            opacity={0.04}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================
// HUD Rings — concentric orbital rings around the brain
// ============================================================
function HUDRings() {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring3Ref = useRef<THREE.Mesh>(null)
  const ring4Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.1
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 0.05
    if (ring3Ref.current) ring3Ref.current.rotation.z = t * 0.03
    if (ring4Ref.current) ring4Ref.current.rotation.z = -t * 0.07
  })

  const ringConfigs = useMemo(() => [
    { radius: 1.4, tube: 0.002, tilt: [0.26, 0, 0], color: '#00AACC', opacity: 0.2, ref: ring1Ref },
    { radius: 1.6, tube: 0.0015, tilt: [-0.35, 0.2, 0], color: '#006688', opacity: 0.15, ref: ring2Ref },
    { radius: 1.8, tube: 0.001, tilt: [0.52, -0.1, 0.3], color: '#004466', opacity: 0.1, ref: ring3Ref },
    { radius: 2.0, tube: 0.001, tilt: [-0.15, 0.4, -0.2], color: '#003344', opacity: 0.08, ref: ring4Ref },
  ], [])

  const tickGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions: number[] = []
    const tickCount = 72
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2
      const inner = 0.97
      const outer = i % 6 === 0 ? 1.04 : 1.02
      positions.push(
        Math.cos(angle) * inner, Math.sin(angle) * inner, 0,
        Math.cos(angle) * outer, Math.sin(angle) * outer, 0,
      )
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  return (
    <group position={[0, 0.15, 0]}>
      {ringConfigs.map((cfg, i) => (
        <group key={i} rotation={cfg.tilt as [number, number, number]}>
          <mesh ref={cfg.ref}>
            <torusGeometry args={[cfg.radius, cfg.tube, 8, 128]} />
            <meshBasicMaterial
              color={cfg.color}
              transparent
              opacity={cfg.opacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <lineSegments
            geometry={tickGeometry}
            scale={[cfg.radius, cfg.radius, 1]}
            rotation={cfg.ref.current?.rotation.toArray().slice(0, 3) as [number, number, number] ?? [0, 0, 0]}
          >
            <lineBasicMaterial
              color={cfg.color}
              transparent
              opacity={cfg.opacity * 0.5}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  )
}

// ============================================================
// Highway data structure built from connectome
// ============================================================
export interface HighwayData {
  connection: Connection
  curve: THREE.CatmullRomCurve3
  radius: number
  glowRadius: number
  color: THREE.Color
  fromName: string
  toName: string
  key: string
  index: number
  strength: number
}

// Module-level highway data for use by Particles
let builtHighways: HighwayData[] = []
export function getHighways(): HighwayData[] {
  return builtHighways
}

function buildHighways(surfacePositions: Map<string, THREE.Vector3>, meshes: THREE.Mesh[]): HighwayData[] {
  const highways: HighwayData[] = []

  CONNECTIONS.forEach((conn, index) => {
    const fromPos = surfacePositions.get(conn.from)
    const toPos = surfacePositions.get(conn.to)
    if (!fromPos || !toPos) return

    const start = fromPos.clone()
    const end = toPos.clone()

    // Build 3-5 control points that hug the brain surface
    const controlPoints: THREE.Vector3[] = [start.clone()]

    // Number of intermediate points based on distance
    const dist = start.distanceTo(end)
    const numMidPoints = dist > 1.0 ? 3 : 2

    for (let i = 1; i <= numMidPoints; i++) {
      const t = i / (numMidPoints + 1)
      // Interpolate between start and end
      const interp = start.clone().lerp(end.clone(), t)
      // Project this intermediate point onto the brain surface
      const surfacePoint = projectPointOntoSurface(interp, meshes)
      controlPoints.push(surfacePoint)
    }

    controlPoints.push(end.clone())

    const curve = new THREE.CatmullRomCurve3(controlPoints)

    // Radius based on connection strength: 0.003 to 0.008
    const radius = 0.003 + conn.strength * 0.005
    const glowRadius = radius * 1.5

    const color = new THREE.Color(NEON_COLORS[conn.type])
    const fromRegion = REGION_MAP.get(conn.from)
    const toRegion = REGION_MAP.get(conn.to)

    highways.push({
      connection: conn,
      curve,
      radius,
      glowRadius,
      color,
      fromName: fromRegion?.name ?? conn.from,
      toName: toRegion?.name ?? conn.to,
      key: `${conn.from}-${conn.to}-${index}`,
      index,
      strength: conn.strength,
    })
  })

  return highways
}

// ============================================================
// Single Neon Highway — TubeGeometry with glow
// ============================================================
interface NeonHighwayProps {
  highway: HighwayData
}

function NeonHighway({ highway }: NeonHighwayProps) {
  const coreRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  const selectedConnection = useBrainStore((s) => s.selectedConnection)
  const hoveredConnection = useBrainStore((s) => s.hoveredConnection)
  const selectConnection = useBrainStore((s) => s.selectConnection)
  const setHoveredConnection = useBrainStore((s) => s.setHoveredConnection)
  const viewMode = useBrainStore((s) => s.viewMode)

  const isSelected = selectedConnection?.from === highway.connection.from
    && selectedConnection?.to === highway.connection.to
  const isHovered = hoveredConnection?.from === highway.connection.from
    && hoveredConnection?.to === highway.connection.to
  const somethingSelected = selectedConnection !== null

  // Core tube geometry
  const coreGeo = useMemo(() => {
    return new THREE.TubeGeometry(highway.curve, 24, highway.radius, 4, false)
  }, [highway.curve, highway.radius])

  // Glow tube geometry (wider, dimmer)
  const glowGeo = useMemo(() => {
    return new THREE.TubeGeometry(highway.curve, 24, highway.glowRadius, 4, false)
  }, [highway.curve, highway.glowRadius])

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    selectConnection(isSelected ? null : highway.connection)
  }, [selectConnection, highway.connection, isSelected])

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredConnection(highway.connection)
    document.body.style.cursor = 'pointer'
  }, [setHoveredConnection, highway.connection])

  const handlePointerOut = useCallback(() => {
    setHoveredConnection(null)
    document.body.style.cursor = 'default'
  }, [setHoveredConnection])

  // Animate opacity
  useFrame((state) => {
    if (!coreRef.current || !glowRef.current) return

    const coreMat = coreRef.current.material as THREE.MeshBasicMaterial
    const glowMat = glowRef.current.material as THREE.MeshBasicMaterial

    // Base pulse
    const rate = 0.6 + (highway.index % 7) * 0.12
    const pulse = Math.sin(state.clock.elapsedTime * rate * Math.PI * 2) * 0.5 + 0.5

    // Activity mode: check if both connected regions are active
    let activityMultiplier = 1.0
    if (viewMode === 'activity' && activityState.active) {
      const fromAct = activityState.activations.find((a) => a.id === highway.connection.from)?.currentActivation ?? 0
      const toAct = activityState.activations.find((a) => a.id === highway.connection.to)?.currentActivation ?? 0
      activityMultiplier = Math.min(fromAct, toAct) * 2.0
    }

    let coreOpacity = (0.4 + pulse * 0.3) * activityMultiplier
    let glowOpacity = (0.03 + pulse * 0.03) * activityMultiplier

    if (isHovered) {
      coreOpacity = 1.0
      glowOpacity = 0.12
    }
    if (isSelected) {
      coreOpacity = 1.0
      glowOpacity = 0.15
    }
    if (somethingSelected && !isSelected && !isHovered) {
      coreOpacity *= 0.15
      glowOpacity *= 0.1
    }

    coreMat.opacity = Math.min(coreOpacity, 1.0)
    glowMat.opacity = Math.min(glowOpacity, 0.2)
  })

  return (
    <group>
      {/* Core neon tube */}
      <mesh
        ref={coreRef}
        geometry={coreGeo}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshBasicMaterial
          color={highway.color}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Glow spread tube (wider, dimmer) */}
      <mesh ref={glowRef} geometry={glowGeo}>
        <meshBasicMaterial
          color={highway.color}
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// ============================================================
// NeonHighways — all highways together with mode-based filtering
// ============================================================
function NeonHighways({ surfacePositions }: { surfacePositions: Map<string, THREE.Vector3> }) {
  const viewMode = useBrainStore((s) => s.viewMode)

  const highways = useMemo(() => {
    const built = buildHighways(surfacePositions, brainSurfaceMeshes)
    builtHighways = built
    return built
  }, [surfacePositions])

  // Filter based on view mode
  const visibleHighways = useMemo(() => {
    if (viewMode === 'connectivity') {
      // All highways visible
      return highways
    }
    if (viewMode === 'activity') {
      // All highways — opacity is controlled per-highway via activity state
      return highways
    }
    // Explorer mode: top 30 strongest connections
    return [...highways]
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 30)
  }, [viewMode, highways])

  return (
    <group>
      {visibleHighways.map((hw) => (
        <NeonHighway key={hw.key} highway={hw} />
      ))}
    </group>
  )
}

// ============================================================
// BrainModel — the main composed component
// NO NODES, NO SPHERES, NO DOTS — just highways on dark terrain
// ============================================================
export default function BrainModel() {
  const selectConnection = useBrainStore((s) => s.selectConnection)
  const [surfacePositions, setSurfacePositions] = useState<Map<string, THREE.Vector3>>(new Map())
  const surfaceReady = surfacePositions.size > 0

  const handleMeshesReady = useCallback((meshes: THREE.Mesh[]) => {
    brainSurfaceMeshes = meshes
    const positions = projectRegionsOntoSurface(meshes, BRAIN_REGIONS)
    surfacePositionsMap = positions
    setSurfacePositions(positions)
  }, [])

  const handleMiss = useCallback(() => {
    selectConnection(null)
  }, [selectConnection])

  return (
    <group onPointerMissed={handleMiss}>
      <BrainWireframe onMeshesReady={handleMeshesReady} />
      <HUDRings />
      {surfaceReady && (
        <NeonHighways surfacePositions={surfacePositions} />
      )}
    </group>
  )
}
