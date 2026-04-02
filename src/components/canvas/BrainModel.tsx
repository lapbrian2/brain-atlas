import { useRef, useMemo, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { BRAIN_REGIONS, BrainRegion, REGION_MAP } from '../../data/regions'
import { CONNECTIONS } from '../../data/connectome'
import { useBrainStore } from '../../store/useBrainStore'
import { activityState } from './ActivityOverlay'

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
// Simplex-like noise for brain displacement
// ============================================================
function hash(x: number, y: number, z: number): number {
  let h = x * 374761393 + y * 668265263 + z * 1274126177
  h = (h ^ (h >> 13)) * 1274126177
  return (h ^ (h >> 16)) / 2147483648
}

function noise3D(x: number, y: number, z: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  const fx = x - ix
  const fy = y - iy
  const fz = z - iz
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const uz = fz * fz * (3 - 2 * fz)

  const n000 = hash(ix, iy, iz)
  const n100 = hash(ix + 1, iy, iz)
  const n010 = hash(ix, iy + 1, iz)
  const n110 = hash(ix + 1, iy + 1, iz)
  const n001 = hash(ix, iy, iz + 1)
  const n101 = hash(ix + 1, iy, iz + 1)
  const n011 = hash(ix, iy + 1, iz + 1)
  const n111 = hash(ix + 1, iy + 1, iz + 1)

  const x00 = n000 + (n100 - n000) * ux
  const x10 = n010 + (n110 - n010) * ux
  const x01 = n001 + (n101 - n001) * ux
  const x11 = n011 + (n111 - n011) * ux
  const y0 = x00 + (x10 - x00) * uy
  const y1 = x01 + (x11 - x01) * uy
  return y0 + (y1 - y0) * uz
}

function fbm(x: number, y: number, z: number, octaves: number): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxVal = 0
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise3D(x * frequency, y * frequency, z * frequency)
    maxVal += amplitude
    amplitude *= 0.5
    frequency *= 2
  }
  return value / maxVal
}

// ============================================================
// BrainWireframe — wireframe mesh forming brain silhouette
// ============================================================
function BrainWireframe() {
  const groupRef = useRef<THREE.Group>(null)

  const { innerWireframe, outerWireframe, cerebellumWireframe, brainstemWireframe } = useMemo(() => {
    // Create two hemispheres with a gap
    const createHemisphere = (side: number, segments: number): THREE.BufferGeometry => {
      const geo = new THREE.SphereGeometry(0.85, segments, segments, 0, Math.PI * 2, 0, Math.PI)
      const pos = geo.attributes.position
      const arr = pos.array as Float32Array

      for (let i = 0; i < pos.count; i++) {
        let x = arr[i * 3]
        let y = arr[i * 3 + 1]
        let z = arr[i * 3 + 2]

        // Apply brain shape: elongate z, flatten y, narrow x per hemisphere
        const origX = x
        const origY = y
        const origZ = z

        // Noise displacement for sulci/gyri
        const noiseFreq = 2.0
        const noiseAmp = 0.06
        const displacement = fbm(origX * noiseFreq, origY * noiseFreq, origZ * noiseFreq, 5) * noiseAmp

        const r = Math.sqrt(x * x + y * y + z * z)
        if (r > 0.001) {
          const nx = x / r
          const ny = y / r
          const nz = z / r
          x += nx * displacement
          y += ny * displacement
          z += nz * displacement
        }

        // Elongate front-to-back
        z *= 1.1
        // Slightly flatten top-to-bottom
        y *= 0.82

        // Push hemisphere to its side
        if (side === -1) {
          x = -Math.abs(x) * 0.6 - 0.04
        } else {
          x = Math.abs(x) * 0.6 + 0.04
        }

        // Offset to brain center
        y += 0.15

        // Taper bottom
        const yNorm = (y - 0.15) / (0.85 * 0.82)
        if (yNorm < -0.3) {
          const taper = 1.0 - Math.abs(yNorm + 0.3) * 0.4
          x *= Math.max(taper, 0.5)
          z *= Math.max(taper, 0.6)
        }

        arr[i * 3] = x
        arr[i * 3 + 1] = y
        arr[i * 3 + 2] = z
      }

      pos.needsUpdate = true
      geo.computeVertexNormals()
      return geo
    }

    const leftHemi = createHemisphere(-1, 64)
    const rightHemi = createHemisphere(1, 64)

    // Merge both hemispheres
    const mergedGeo = new THREE.BufferGeometry()
    const leftPos = leftHemi.attributes.position.array as Float32Array
    const rightPos = rightHemi.attributes.position.array as Float32Array
    const leftIdx = leftHemi.index!.array
    const rightIdx = rightHemi.index!.array

    const mergedPositions = new Float32Array(leftPos.length + rightPos.length)
    mergedPositions.set(leftPos, 0)
    mergedPositions.set(rightPos, leftPos.length)

    const mergedIndices = new Uint32Array(leftIdx.length + rightIdx.length)
    mergedIndices.set(leftIdx, 0)
    const leftVertCount = leftPos.length / 3
    for (let i = 0; i < rightIdx.length; i++) {
      mergedIndices[leftIdx.length + i] = rightIdx[i] + leftVertCount
    }

    mergedGeo.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3))
    mergedGeo.setIndex(new THREE.BufferAttribute(mergedIndices, 1))

    // Create wireframes
    const innerWire = new THREE.WireframeGeometry(mergedGeo)
    const outerGeo = mergedGeo.clone()
    const outerPos = outerGeo.attributes.position.array as Float32Array
    for (let i = 0; i < outerPos.length; i++) {
      outerPos[i] *= 1.02
    }
    const outerWire = new THREE.WireframeGeometry(outerGeo)

    // Cerebellum: smaller sphere below/behind
    const cerebGeo = new THREE.SphereGeometry(0.35, 32, 32)
    const cerebPos = cerebGeo.attributes.position.array as Float32Array
    for (let i = 0; i < cerebPos.length / 3; i++) {
      let x = cerebPos[i * 3]
      let y = cerebPos[i * 3 + 1]
      let z = cerebPos[i * 3 + 2]
      // Noise
      const d = fbm(x * 3, y * 3, z * 3, 4) * 0.03
      const r = Math.sqrt(x * x + y * y + z * z)
      if (r > 0.001) {
        x += (x / r) * d
        y += (y / r) * d
        z += (z / r) * d
      }
      // Position below and behind
      y = y * 0.7 - 0.55
      z = z * 0.9 - 0.45
      cerebPos[i * 3] = x
      cerebPos[i * 3 + 1] = y
      cerebPos[i * 3 + 2] = z
    }
    cerebGeo.attributes.position.needsUpdate = true
    const cerebWire = new THREE.WireframeGeometry(cerebGeo)

    // Brainstem: cylinder extending down
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.5, 16, 8)
    const stemPos = stemGeo.attributes.position.array as Float32Array
    for (let i = 0; i < stemPos.length / 3; i++) {
      stemPos[i * 3 + 1] -= 0.85 // Move down
      stemPos[i * 3 + 2] -= 0.25 // Move slightly back
    }
    stemGeo.attributes.position.needsUpdate = true
    const stemWire = new THREE.WireframeGeometry(stemGeo)

    // Cleanup
    leftHemi.dispose()
    rightHemi.dispose()
    mergedGeo.dispose()
    outerGeo.dispose()
    cerebGeo.dispose()
    stemGeo.dispose()

    return {
      innerWireframe: innerWire,
      outerWireframe: outerWire,
      cerebellumWireframe: cerebWire,
      brainstemWireframe: stemWire,
    }
  }, [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      {/* Primary wireframe shell */}
      <lineSegments geometry={innerWireframe}>
        <lineBasicMaterial
          color="#0A3040"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Outer ghost wireframe for depth */}
      <lineSegments geometry={outerWireframe}>
        <lineBasicMaterial
          color="#0A3040"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Cerebellum wireframe */}
      <lineSegments geometry={cerebellumWireframe}>
        <lineBasicMaterial
          color="#0A2838"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Brainstem wireframe */}
      <lineSegments geometry={brainstemWireframe}>
        <lineBasicMaterial
          color="#0A2838"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
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
