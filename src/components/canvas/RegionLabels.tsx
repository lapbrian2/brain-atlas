import { Html } from '@react-three/drei'
import { REGION_MAP } from '../../data/regions'
import { useBrainStore } from '../../store/useBrainStore'
import { getSurfacePosition } from './BrainModel'

/**
 * RegionLabels — shows labels for the TWO regions connected by
 * the currently hovered highway. No labels for individual regions.
 *
 * When a highway is hovered, we show:
 * - Label at the "from" region position
 * - Label at the "to" region position
 * - A connection label at the midpoint ("From -> To")
 */
export default function RegionLabels() {
  const hoveredConnection = useBrainStore((s) => s.hoveredConnection)
  const selectedConnection = useBrainStore((s) => s.selectedConnection)

  // Use hovered connection, fall back to selected
  const conn = hoveredConnection ?? selectedConnection
  if (!conn) return null

  const fromRegion = REGION_MAP.get(conn.from)
  const toRegion = REGION_MAP.get(conn.to)
  if (!fromRegion || !toRegion) return null

  const fromPos = getSurfacePosition(conn.from)
  const toPos = getSurfacePosition(conn.to)
  if (!fromPos || !toPos) return null

  // Midpoint for the connection label
  const midPos: [number, number, number] = [
    (fromPos.x + toPos.x) / 2,
    (fromPos.y + toPos.y) / 2 + 0.12,
    (fromPos.z + toPos.z) / 2,
  ]

  const labelStyle: React.CSSProperties = {
    color: '#00DDFF',
    fontSize: '10px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 400,
    fontVariant: 'all-small-caps',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    userSelect: 'none',
    textShadow: '0 0 8px rgba(0, 204, 255, 0.5), 0 1px 6px rgba(0,0,0,0.9)',
    background: 'rgba(0, 10, 20, 0.6)',
    padding: '2px 8px',
    backdropFilter: 'blur(4px)',
  }

  return (
    <group>
      {/* Connection label at midpoint */}
      <Html
        position={midPos}
        center
        distanceFactor={5}
        zIndexRange={[10, 0]}
      >
        <div
          style={{
            ...labelStyle,
            fontSize: '11px',
            color: '#FFFFFF',
            background: 'rgba(0, 10, 20, 0.75)',
            borderBottom: '2px solid #00FFEE',
            padding: '3px 10px',
          }}
        >
          {fromRegion.name} &rarr; {toRegion.name}
        </div>
      </Html>

      {/* From region label */}
      <Html
        position={[fromPos.x, fromPos.y + 0.08, fromPos.z]}
        center
        distanceFactor={5}
        zIndexRange={[10, 0]}
      >
        <div style={{ ...labelStyle, borderLeft: `2px solid ${fromRegion.color}` }}>
          {fromRegion.name}
        </div>
      </Html>

      {/* To region label */}
      <Html
        position={[toPos.x, toPos.y + 0.08, toPos.z]}
        center
        distanceFactor={5}
        zIndexRange={[10, 0]}
      >
        <div style={{ ...labelStyle, borderLeft: `2px solid ${toRegion.color}` }}>
          {toRegion.name}
        </div>
      </Html>
    </group>
  )
}
