import { Html } from '@react-three/drei'
import { BRAIN_REGIONS, REGION_MAP } from '../../data/regions'
import { useBrainStore } from '../../store/useBrainStore'
import { getSurfacePosition } from './BrainModel'

/**
 * Hover-only tooltip label positioned at the region node.
 * Teal/cyan text with dark backing for the holographic HUD look.
 * Uses surface-projected positions when available, falls back to raw positions.
 */
export default function RegionLabels() {
  const hoveredRegion = useBrainStore((s) => s.hoveredRegion)
  const viewMode = useBrainStore((s) => s.viewMode)

  const region = hoveredRegion ? REGION_MAP.get(hoveredRegion) : null

  // Quiz mode: show "?" at each region position
  if (viewMode === 'quiz') {
    return (
      <group>
        {BRAIN_REGIONS.map((r) => {
          const surfPos = getSurfacePosition(r.id)
          const pos: [number, number, number] = surfPos
            ? [surfPos.x, surfPos.y + 0.08, surfPos.z]
            : [r.position[0], r.position[1] + 0.08, r.position[2]]

          return (
            <Html
              key={r.id}
              position={pos}
              center
              distanceFactor={5}
              zIndexRange={[10, 0]}
            >
              <div
                style={{
                  color: 'rgba(0, 170, 204, 0.5)',
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
          )
        })}
      </group>
    )
  }

  // Explorer/other modes: show label only on hover
  if (!region) return null

  const surfPos = getSurfacePosition(region.id)
  const labelPos: [number, number, number] = surfPos
    ? [surfPos.x, surfPos.y + 0.1, surfPos.z]
    : [region.position[0], region.position[1] + 0.1, region.position[2]]

  return (
    <Html
      position={labelPos}
      center
      distanceFactor={5}
      zIndexRange={[10, 0]}
    >
      <div
        style={{
          color: '#00DDFF',
          fontSize: '11px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 400,
          fontVariant: 'all-small-caps',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          textShadow: '0 0 8px rgba(0, 204, 255, 0.5), 0 1px 6px rgba(0,0,0,0.9)',
          background: 'rgba(0, 10, 20, 0.5)',
          padding: '2px 8px',
          backdropFilter: 'blur(4px)',
          borderLeft: `2px solid ${region.color}`,
        }}
      >
        {region.name}
      </div>
    </Html>
  )
}
