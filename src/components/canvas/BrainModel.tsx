import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { BRAIN_REGIONS, BrainRegion } from '../../data/regions'
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

// ============================================================
// Importance tiers — major regions glow bright, minor ones dim
// ============================================================
const MAJOR_REGIONS = new Set([
  'prefrontal-cortex',
  'motor-cortex',
  'somatosensory-cortex',
  'brocas-area',
  'wernickes-area',
  'visual-cortex',
  'auditory-cortex',
  'hippocampus',
  'amygdala',
  'thalamus',
  'cerebellum',
  'cingulate-cortex',
  'insula',
  'precuneus',
  'pons',
])

function getImportanceTier(regionId: string): 'major' | 'minor' {
  return MAJOR_REGIONS.has(regionId) ? 'major' : 'minor'
}

// City-light sizes
const CITY_LIGHT = {
  major: {
    core: 0.008,
    halo: 0.04,
    atmosphere: 0.08,
    coreOpacity: 1.0,
    haloOpacity: 0.2,
    atmosphereOpacity: 0.06,
    hoverAtmosphere: 0.12,
  },
  minor: {
    core: 0.004,
    halo: 0.02,
    atmosphere: 0.04,
    coreOpacity: 0.7,
    haloOpacity: 0.1,
    atmosphereOpacity: 0.03,
    hoverAtmosphere: 0.07,
  },
}

// ============================================================
// Module-level surface positions — shared between components
// ============================================================
let surfacePositionsMap: Map<string, THREE.Vector3> = new Map()

export function getSurfacePosition(regionId: string): THREE.Vector3 | undefined {
  return surfacePositionsMap.get(regionId)
}

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
      // Snap to the brain surface + tiny offset outward so it sits ON the surface
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
// BrainWireframe — loads real GLB model, renders as wireframe,
// and projects region nodes onto the surface after loading
// ============================================================
function BrainWireframe({ onMeshesReady }: { onMeshesReady: (meshes: THREE.Mesh[]) => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/brain.glb', true)
  const meshesReported = useRef(false)

  const wireframeData = useMemo(() => {
    const meshes: { geometry: THREE.WireframeGeometry; isOuter: boolean }[] = []
    const surfaceMeshes: THREE.Mesh[] = []

    // Compute bounding box of the entire scene to center and scale it
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

      // Build a real Mesh for raycasting (non-visible, just for intersection tests)
      const surfaceGeo = transformedGeo.clone()
      surfaceGeo.computeBoundingSphere()
      surfaceGeo.computeBoundingBox()
      const surfaceMesh = new THREE.Mesh(
        surfaceGeo,
        new THREE.MeshBasicMaterial({ visible: false }),
      )
      surfaceMeshes.push(surfaceMesh)

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

    return { wireframes: meshes, surfaceMeshes }
  }, [scene])

  // Report surface meshes for raycasting once
  useEffect(() => {
    if (!meshesReported.current && wireframeData.surfaceMeshes.length > 0) {
      meshesReported.current = true
      onMeshesReady(wireframeData.surfaceMeshes)
    }
  }, [wireframeData.surfaceMeshes, onMeshesReady])

  // Cleanup wireframe geometries on unmount
  useEffect(() => {
    return () => {
      for (const wf of wireframeData.wireframes) {
        wf.geometry.dispose()
      }
      for (const sm of wireframeData.surfaceMeshes) {
        sm.geometry.dispose()
        ;(sm.material as THREE.Material).dispose()
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
      {wireframeData.wireframes.map((wf, i) => (
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
// RegionNode — city-light effect: bright core + soft halo + atmosphere
// ============================================================
interface RegionNodeProps {
  region: BrainRegion
  index: number
  surfacePosition: THREE.Vector3
}

function RegionNode({ region, index, surfacePosition }: RegionNodeProps) {
  const coreRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const selectRegion = useBrainStore((s) => s.selectRegion)
  const setHovered = useBrainStore((s) => s.setHoveredRegion)
  const selectedRegion = useBrainStore((s) => s.selectedRegion)
  const hoveredRegion = useBrainStore((s) => s.hoveredRegion)

  const lobeColor = LOBE_COLORS[region.lobe]
  const tier = getImportanceTier(region.id)
  const sizes = CITY_LIGHT[tier]
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
    if (!coreRef.current) return

    // Check activity state
    const act = activityState.active
      ? (activityState.activations.find((a) => a.id === region.id)?.currentActivation ?? 0.05)
      : 0

    // Base pulse — staggered by index
    const pulseOffset = index * 0.7
    const pulseSpeed = act > 0.1 ? 2.5 + act * 2.0 : 1.2
    const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed + pulseOffset) * 0.5 + 0.5

    // Core brightness
    let coreBrightness = sizes.coreOpacity
    if (isHovered) coreBrightness = 1.0
    if (isSelected) coreBrightness = 1.0
    if (activityState.active) coreBrightness = 0.3 + act * 0.7

    // Core scale — subtle pulse
    let coreScale = sizes.core
    if (activityState.active) coreScale = sizes.core * (0.5 + act * 1.5)
    if (isHovered) coreScale *= 1.4
    if (isSelected) coreScale *= 1.3
    const coreScaleAnimated = coreScale * (0.9 + pulse * 0.2)

    const currentCore = coreRef.current.scale.x
    const newCore = currentCore + (coreScaleAnimated - currentCore) * 0.1
    coreRef.current.scale.setScalar(newCore)
    const coreMat = coreRef.current.material as THREE.MeshBasicMaterial
    coreMat.opacity = coreBrightness

    // Halo
    if (haloRef.current) {
      let haloScale = sizes.halo
      if (isHovered) haloScale *= 1.5
      if (isSelected) haloScale *= 1.3
      if (activityState.active) haloScale = sizes.halo * (0.5 + act * 1.5)
      const haloAnimated = haloScale * (0.85 + pulse * 0.3)

      const currentHalo = haloRef.current.scale.x
      haloRef.current.scale.setScalar(currentHalo + (haloAnimated - currentHalo) * 0.1)

      const haloMat = haloRef.current.material as THREE.MeshBasicMaterial
      let haloOpacity = sizes.haloOpacity + pulse * 0.05
      if (isHovered) haloOpacity = 0.35
      if (isSelected) haloOpacity = 0.3
      if (activityState.active) haloOpacity = 0.05 + act * 0.35
      haloMat.opacity = haloOpacity
    }

    // Atmosphere
    if (atmosphereRef.current) {
      let atmoScale = isHovered ? sizes.hoverAtmosphere : sizes.atmosphere
      if (isSelected) atmoScale = sizes.hoverAtmosphere
      if (activityState.active) atmoScale = sizes.atmosphere * (0.5 + act * 2.0)

      const currentAtmo = atmosphereRef.current.scale.x
      atmosphereRef.current.scale.setScalar(currentAtmo + (atmoScale - currentAtmo) * 0.08)

      const atmoMat = atmosphereRef.current.material as THREE.MeshBasicMaterial
      let atmoOpacity = sizes.atmosphereOpacity
      if (isHovered) atmoOpacity = 0.12
      if (isSelected) atmoOpacity = 0.1
      if (activityState.active) atmoOpacity = 0.02 + act * 0.15
      atmoMat.opacity = atmoOpacity
    }
  })

  return (
    <group position={surfacePosition}>
      {/* Bright core — city pinpoint */}
      <mesh
        ref={coreRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={sizes.core}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={sizes.coreOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Soft glow halo */}
      <mesh ref={haloRef} scale={sizes.halo}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={sizes.haloOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Wider atmospheric spread */}
      <mesh ref={atmosphereRef} scale={sizes.atmosphere}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={sizes.atmosphereOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// ============================================================
// CityLightGlow — PointLights at major node positions for
// wireframe tinting (light pollution effect)
// ============================================================
function CityLightGlow({ surfacePositions }: { surfacePositions: Map<string, THREE.Vector3> }) {
  const lights = useMemo(() => {
    const result: { position: THREE.Vector3; color: string; id: string }[] = []
    for (const region of BRAIN_REGIONS) {
      if (getImportanceTier(region.id) !== 'major') continue
      const pos = surfacePositions.get(region.id)
      if (!pos) continue
      result.push({
        position: pos,
        color: LOBE_COLORS[region.lobe],
        id: region.id,
      })
    }
    return result
  }, [surfacePositions])

  return (
    <group>
      {lights.map((light) => (
        <pointLight
          key={light.id}
          position={light.position}
          color={light.color}
          intensity={0.08}
          distance={0.15}
          decay={2}
        />
      ))}
    </group>
  )
}

// ============================================================
// ConnectionLines — luminous arcs that follow brain surface
// ============================================================
function ConnectionLines({ surfacePositions }: { surfacePositions: Map<string, THREE.Vector3> }) {
  const viewMode = useBrainStore((s) => s.viewMode)
  const selectedRegion = useBrainStore((s) => s.selectedRegion)
  const hoveredRegion = useBrainStore((s) => s.hoveredRegion)

  const lines = useMemo(() => {
    return CONNECTIONS.map((conn, i) => {
      const fromPos = surfacePositions.get(conn.from)
      const toPos = surfacePositions.get(conn.to)
      if (!fromPos || !toPos) return null

      const start = fromPos.clone()
      const end = toPos.clone()

      // Midpoint between the two surface positions
      const mid = start.clone().add(end).multiplyScalar(0.5)

      // Push midpoint outward from center to follow the brain's curvature
      // instead of cutting through the brain interior
      const midDir = mid.clone().normalize()
      const surfaceDist = Math.max(start.length(), end.length())
      const targetDist = surfaceDist + 0.03 * (0.5 + conn.strength * 0.5)
      mid.copy(midDir.multiplyScalar(targetDist))

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
  }, [surfacePositions])

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
  const [surfacePositions, setSurfacePositions] = useState<Map<string, THREE.Vector3>>(new Map())
  const surfaceReady = surfacePositions.size > 0

  const handleMeshesReady = useCallback((meshes: THREE.Mesh[]) => {
    const positions = projectRegionsOntoSurface(meshes, BRAIN_REGIONS)
    surfacePositionsMap = positions
    setSurfacePositions(positions)
  }, [])

  const handleMiss = useCallback(() => {
    selectRegion(null)
  }, [selectRegion])

  return (
    <group onPointerMissed={handleMiss}>
      <BrainWireframe onMeshesReady={handleMeshesReady} />
      <HUDRings />
      {surfaceReady && (
        <>
          {BRAIN_REGIONS.map((region, i) => {
            const pos = surfacePositions.get(region.id)
            if (!pos) return null
            return (
              <RegionNode
                key={region.id}
                region={region}
                index={i}
                surfacePosition={pos}
              />
            )
          })}
          <ConnectionLines surfacePositions={surfacePositions} />
          <CityLightGlow surfacePositions={surfacePositions} />
        </>
      )}
    </group>
  )
}
