import { useRef, useMemo, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { BRAIN_REGIONS, REGION_MAP } from '../../data/regions'
import { useBrainStore } from '../../store/useBrainStore'
import { activityColors } from './ActivityOverlay'

/** Scale factor mapping for each lobe to approximate anatomical size */
const LOBE_SCALE: Record<string, [number, number, number]> = {
  frontal: [0.18, 0.16, 0.18],
  parietal: [0.16, 0.14, 0.16],
  temporal: [0.14, 0.12, 0.14],
  occipital: [0.14, 0.13, 0.14],
  subcortical: [0.10, 0.09, 0.10],
  cerebellum: [0.28, 0.15, 0.18],
  brainstem: [0.07, 0.07, 0.07],
}

/** Geometry detail per lobe */
const LOBE_SEGMENTS: Record<string, number> = {
  frontal: 24,
  parietal: 24,
  temporal: 20,
  occipital: 20,
  subcortical: 16,
  cerebellum: 24,
  brainstem: 12,
}

function RegionMesh({ id, index }: { id: string; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const region = REGION_MAP.get(id)!
  const scale = LOBE_SCALE[region.lobe] ?? [0.12, 0.12, 0.12]
  const segs = LOBE_SEGMENTS[region.lobe] ?? 16

  const selectedRegion = useBrainStore((s) => s.selectedRegion)
  const hoveredRegion = useBrainStore((s) => s.hoveredRegion)

  const baseColor = useMemo(() => new THREE.Color(region.color), [region.color])

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.85,
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 0.4,
        clearcoatRoughness: 0.3,
        emissive: baseColor,
        emissiveIntensity: 0.05,
      }),
    [baseColor],
  )

  const geometry = useMemo(
    () => new THREE.SphereGeometry(1, segs, segs),
    [segs],
  )

  const isSelected = selectedRegion === id
  const isHovered = hoveredRegion === id
  const isDimmed = selectedRegion !== null && !isSelected

  useFrame(() => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial

    const targetOpacity = isDimmed ? 0.25 : 0.85
    mat.opacity += (targetOpacity - mat.opacity) * 0.1

    const targetEmissive = isHovered || isSelected ? 0.35 : 0.05
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.12

    // Activity overlay: blend color when heatmap layer is active
    if (activityColors.active && activityColors.colors[index]) {
      mat.color.lerp(activityColors.colors[index], 0.08)
      mat.emissive.lerp(activityColors.colors[index], 0.08)
      const activation = activityColors.activations[index]?.currentActivation ?? 0.05
      mat.emissiveIntensity = Math.max(mat.emissiveIntensity, activation * 0.6)
    } else {
      mat.color.lerp(baseColor, 0.05)
      mat.emissive.lerp(baseColor, 0.05)
    }
  })

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      useBrainStore.getState().setHoveredRegion(id)
      document.body.style.cursor = 'pointer'
    },
    [id],
  )

  const handlePointerOut = useCallback(() => {
    useBrainStore.getState().setHoveredRegion(null)
    document.body.style.cursor = 'auto'
  }, [])

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      const store = useBrainStore.getState()
      store.selectRegion(store.selectedRegion === id ? null : id)
    },
    [id],
  )

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={region.position}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  )
}

export default function BrainModel() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {BRAIN_REGIONS.map((r, i) => (
        <RegionMesh key={r.id} id={r.id} index={i} />
      ))}
    </group>
  )
}
