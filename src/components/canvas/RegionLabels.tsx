import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { REGION_MAP } from '../../data/regions'
import { useBrainStore } from '../../store/useBrainStore'
import { ANATOMICAL_REGIONS, DATA_REGION_TO_MESH } from './BrainModel'

/**
 * Hover-only tooltip label.
 * Shows a single label at the hovered region's centroid.
 * No leader lines, no clutter.
 */
export default function RegionLabels() {
  const hoveredRegion = useBrainStore((s) => s.hoveredRegion)
  const viewMode = useBrainStore((s) => s.viewMode)

  const region = hoveredRegion ? REGION_MAP.get(hoveredRegion) : null

  // Find the anatomical mesh position for this region
  const meshPosition = useMemo((): [number, number, number] | null => {
    if (!hoveredRegion) return null
    const meshId = DATA_REGION_TO_MESH.get(hoveredRegion)
    if (!meshId) return null
    const anat = ANATOMICAL_REGIONS.find(a => a.id === meshId)
    if (!anat) return null
    // Position label slightly above the mesh
    return [anat.position[0], anat.position[1] + anat.scale[1] + 0.08, anat.position[2]]
  }, [hoveredRegion])

  // Quiz mode: show "?" icons at each region center
  if (viewMode === 'quiz') {
    return (
      <group>
        {ANATOMICAL_REGIONS.filter(a => a.regionIds.length > 0).map((anat) => (
          <Html
            key={anat.id}
            position={[anat.position[0], anat.position[1] + anat.scale[1] * 0.5, anat.position[2]]}
            center
            distanceFactor={5}
            zIndexRange={[10, 0]}
          >
            <div
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '11px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 500,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              ?
            </div>
          </Html>
        ))}
      </group>
    )
  }

  // Explorer/other modes: show label only on hover
  if (!region || !meshPosition) return null

  return (
    <Html
      position={meshPosition}
      center
      distanceFactor={5}
      zIndexRange={[10, 0]}
    >
      <div
        style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: '11px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 400,
          fontVariant: 'all-small-caps',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}
      >
        {region.name}
      </div>
    </Html>
  )
}
