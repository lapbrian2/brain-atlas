import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { BRAIN_REGIONS, BrainRegion, REGION_MAP } from '../../data/regions'
import { CONNECTIONS } from '../../data/connectome'
import { useBrainStore } from '../../store/useBrainStore'
import { activityState } from './ActivityOverlay'

// Preload the brain model with Draco decoder support
useGLTF.preload('/models/brain.glb', true)

// ============================================================
// Lobe color map — teal/cyan holographic palette
// ============================================================
const LOBE_COLORS: Record<BrainRegion['lobe'], string> = {
  frontal: '#00DDFF',
  parietal: '#00AA88',
  temporal: '#FF6633',
  occipital: '#CC33FF',
  subcortical: '#FF3344',
  cerebellum: '#3366FF',
  brainstem: '#CCDDFF',
}

// Node size ranges based on region "importance" (approximated by connection count)
const MIN_NODE_SIZE = 0.02
const MAX_NODE_SIZE = 0.05

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
// BrainWireframe — loads real GLB model and renders as wireframe
// ============================================================
function BrainWireframe() {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/brain.glb', true)

  const wireframeData = useMemo(() => {
    const meshes: { geometry: THREE.WireframeGeometry; isOuter: boolean }[] = []

    // Compute bounding box of the entire scene to center and scale it
    const box = new THREE.Box3()

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      // Skip Plane objects (label planes from the original model)
      if (child.name.toLowerCase().includes('plane')) return

      const geo = child.geometry as THREE.BufferGeometry
      if (!geo || !geo.attributes.position) return

      // Apply the mesh's world transform to the geometry for bounding box calc
      const clonedGeo = geo.clone()
      child.updateWorldMatrix(true, false)
      clonedGeo.applyMatrix4(child.matrixWorld)
      const meshBox = new THREE.Box3().setFromBufferAttribute(clonedGeo.attributes.position as THREE.BufferAttribute)
      box.union(meshBox)
      clonedGeo.dispose()
    })

    // Compute centering offset and scale
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

      // Clone and transform geometry to world space, then center and scale
      const transformedGeo = geo.clone()
      child.updateWorldMatrix(true, false)
      transformedGeo.applyMatrix4(child.matrixWorld)

      // Center and scale
      const pos = transformedGeo.attributes.position as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      for (let i = 0; i < pos.count; i++) {
        arr[i * 3] = (arr[i * 3] - center.x) * scaleFactor
        arr[i * 3 + 1] = (arr[i * 3 + 1] - center.y) * scaleFactor
        arr[i * 3 + 2] = (arr[i * 3 + 2] - center.z) * scaleFactor
      }
      pos.needsUpdate = true

      // Inner wireframe
      const wireGeo = new THREE.WireframeGeometry(transformedGeo)
      meshes.push({ geometry: wireGeo, isOuter: false })

      // Outer ghost wireframe at 1.01x for depth effect
      const outerGeo = transformedGeo.clone()
      const outerPos = outerGeo.attributes.position as THREE.BufferAttribute
      const outerArr = outerPos.array as Float32Array
      for (let i = 0; i < outerPos.count; i++) {
        outerArr[i * 3] *= 1.01
        outerArr[i * 3 + 1] *= 1.01
        outerArr[i * 3 + 2] *= 1.01
      }
      outerPos.needsUpdate = true
      const outerWireGeo = new THREE.WireframeGeometry(outerGeo)
      meshes.push({ geometry: outerWireGeo, isOuter: true })

      outerGeo.dispose()
      transformedGeo.dispose()
    })

    return meshes
  }, [scene])

  // Cleanup wireframe geometries on unmount
  useEffect(() => {
    return () => {
      for (const wf of wireframeData) {
        wf.geometry.dispose()
      }
    }
  }, [wireframeData])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      {wireframeData.map((wf, i) => (
        <lineSegments key={i} geometry={wf.geometry}>
          <lineBasicMaterial
            color={wf.isOuter ? '#0A3040' : '#0A3040'}
            transparent
            opacity={wf.isOuter ? 0.15 : 0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>
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

  // Tick marks on rings
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
          {/* Tick marks */}
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
// RegionNode — a single glowing sphere at a brain region position
// ============================================================
interface RegionNodeProps {
  region: BrainRegion
  index: number
}

function RegionNode({ region, index }: RegionNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
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
    if (!meshRef.current) return

    const mesh = meshRef.current

    // Check activity state
    const act = activityState.active
      ? (activityState.activations.find((a) => a.id === region.id)?.currentActivation ?? 0.05)
      : 0

    // Base pulse — staggered by index
    const pulseOffset = index * 0.7
    const pulseSpeed = act > 0.1 ? 2.5 + act * 2.0 : 1.2
    const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed + pulseOffset) * 0.5 + 0.5

    // Scale
    let targetScale = nodeSize
    if (activityState.active) {
      targetScale = nodeSize * (0.5 + act * 1.5)
    }
    if (isHovered) targetScale *= 1.6
    if (isSelected) targetScale *= 1.4

    const scaleRange = 0.8 + pulse * 0.4
    const finalScale = targetScale * scaleRange

    const currentScale = mesh.scale.x
    const newScale = currentScale + (finalScale - currentScale) * 0.1
    mesh.scale.setScalar(newScale)

    // Update halo
    if (haloRef.current) {
      haloRef.current.scale.setScalar(newScale * 3)
      const haloMat = haloRef.current.material as THREE.MeshBasicMaterial
      let haloOpacity = 0.15 + pulse * 0.1
      if (isHovered) haloOpacity = 0.35
      if (isSelected) haloOpacity = 0.3
      if (activityState.active) haloOpacity = 0.05 + act * 0.4
      haloMat.opacity = haloOpacity
    }
  })

  return (
    <group position={region.position}>
      {/* Core node */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={nodeSize}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Halo glow */}
      <mesh ref={haloRef} scale={nodeSize * 3}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
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
      mid.y += 0.25 * (0.5 + conn.strength * 0.5)

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      const points = curve.getPoints(32)

      return {
        key: `${conn.from}-${conn.to}-${i}`,
        points,
        strength: conn.strength,
        fromId: conn.from,
        toId: conn.to,
      }
    }).filter(Boolean) as {
      key: string
      points: THREE.Vector3[]
      strength: number
      fromId: string
      toId: string
    }[]
  }, [])

  const focusRegion = hoveredRegion ?? selectedRegion

  const visibleLines = useMemo(() => {
    if (viewMode === 'connectivity') return lines
    if (viewMode === 'activity') {
      if (!activityState.active) return []
      return lines.filter((l) => {
        const fromAct = activityState.activations.find((a) => a.id === l.fromId)?.currentActivation ?? 0
        const toAct = activityState.activations.find((a) => a.id === l.toId)?.currentActivation ?? 0
        return fromAct > 0.3 && toAct > 0.3
      })
    }
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
        />
      ))}
    </group>
  )
}

interface ConnectionLineProps {
  points: THREE.Vector3[]
  strength: number
}

function ConnectionLine({ points, strength }: ConnectionLineProps) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#00AACC'),
      transparent: true,
      opacity: 0.06 + strength * 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return new THREE.Line(geo, mat)
  }, [points, strength])

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
      <BrainWireframe />
      <HUDRings />
      {BRAIN_REGIONS.map((region, i) => (
        <RegionNode key={region.id} region={region} index={i} />
      ))}
      <ConnectionLines />
    </group>
  )
}
