import { useMemo } from 'react'
import { REGION_MAP } from '../../data/regions'
import { getRegionConnections } from '../../data/connectome'
import { useBrainStore } from '../../store/useBrainStore'

/**
 * RegionPanel — now shows CONNECTION info when a highway is clicked.
 * Displays: source region, target region, connection type, strength,
 * and the other connections each region participates in.
 */

const TYPE_LABELS: Record<string, string> = {
  cortical: 'Cortical Pathway',
  subcortical: 'Subcortical Pathway',
  commissural: 'Commissural Fiber',
  projection: 'Projection Tract',
}

const TYPE_COLORS: Record<string, string> = {
  cortical: '#00FFEE',
  subcortical: '#FF00AA',
  commissural: '#FFCC00',
  projection: '#00FF66',
}

export default function RegionPanel() {
  const selectedConnection = useBrainStore((s) => s.selectedConnection)
  const selectConnection = useBrainStore((s) => s.selectConnection)

  const fromRegion = selectedConnection ? REGION_MAP.get(selectedConnection.from) : null
  const toRegion = selectedConnection ? REGION_MAP.get(selectedConnection.to) : null

  // Get other connections for the "from" region
  const fromConnections = useMemo(() => {
    if (!selectedConnection) return []
    return getRegionConnections(selectedConnection.from)
      .filter((c) => !(c.from === selectedConnection.from && c.to === selectedConnection.to))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5)
      .map((c) => {
        const otherId = c.from === selectedConnection.from ? c.to : c.from
        const other = REGION_MAP.get(otherId)
        return { name: other?.name ?? otherId, strength: c.strength, type: c.type }
      })
  }, [selectedConnection])

  // Get other connections for the "to" region
  const toConnections = useMemo(() => {
    if (!selectedConnection) return []
    return getRegionConnections(selectedConnection.to)
      .filter((c) => !(c.from === selectedConnection.from && c.to === selectedConnection.to))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5)
      .map((c) => {
        const otherId = c.from === selectedConnection.to ? c.to : c.from
        const other = REGION_MAP.get(otherId)
        return { name: other?.name ?? otherId, strength: c.strength, type: c.type }
      })
  }, [selectedConnection])

  const isOpen = selectedConnection !== null && fromRegion !== null && toRegion !== null

  return (
    <div
      className="region-panel"
      style={{
        transform: isOpen ? 'translateX(0)' : 'translateX(110%)',
        opacity: isOpen ? 1 : 0,
      }}
    >
      {isOpen && fromRegion && toRegion && selectedConnection && (
        <>
          <button className="region-panel__close" onClick={() => selectConnection(null)}>
            x
          </button>

          {/* Connection type badge */}
          <div
            className="region-panel__lobe-badge"
            style={{ borderColor: TYPE_COLORS[selectedConnection.type] ?? '#00FFEE' }}
          >
            {TYPE_LABELS[selectedConnection.type] ?? selectedConnection.type}
          </div>

          {/* Connection title */}
          <h2 className="region-panel__name">
            {fromRegion.name} &rarr; {toRegion.name}
          </h2>

          {/* Strength bar */}
          <div style={{ marginBottom: 16 }}>
            <h3 className="region-panel__heading" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
              Connection Strength
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{
                flex: 1,
                height: 4,
                background: 'rgba(0, 170, 204, 0.1)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${selectedConnection.strength * 100}%`,
                  height: '100%',
                  background: TYPE_COLORS[selectedConnection.type] ?? '#00FFEE',
                  borderRadius: 2,
                  boxShadow: `0 0 8px ${TYPE_COLORS[selectedConnection.type] ?? '#00FFEE'}40`,
                }} />
              </div>
              <span className="region-panel__conn-meta">
                {(selectedConnection.strength * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Source region */}
          <h3 className="region-panel__heading">Source Region</h3>
          <p className="region-panel__detail" style={{ color: '#00DDFF' }}>
            {fromRegion.name}
          </p>
          <p className="region-panel__desc">{fromRegion.description}</p>

          <h3 className="region-panel__heading">Functions</h3>
          <div className="region-panel__tags">
            {fromRegion.functions.slice(0, 4).map((fn) => (
              <span key={fn} className="region-panel__tag">{fn}</span>
            ))}
          </div>

          {/* Other connections from source */}
          {fromConnections.length > 0 && (
            <>
              <h3 className="region-panel__heading">
                Other {fromRegion.name} Connections
              </h3>
              <ul className="region-panel__list">
                {fromConnections.map((c, i) => (
                  <li key={i} className="region-panel__conn">
                    <span className="region-panel__conn-btn" style={{ cursor: 'default' }}>
                      <span
                        className="region-panel__conn-dot"
                        style={{ background: TYPE_COLORS[c.type] ?? '#888' }}
                      />
                      {c.name}
                    </span>
                    <span className="region-panel__conn-meta">
                      {(c.strength * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Target region */}
          <h3 className="region-panel__heading">Target Region</h3>
          <p className="region-panel__detail" style={{ color: '#00DDFF' }}>
            {toRegion.name}
          </p>
          <p className="region-panel__desc">{toRegion.description}</p>

          <h3 className="region-panel__heading">Functions</h3>
          <div className="region-panel__tags">
            {toRegion.functions.slice(0, 4).map((fn) => (
              <span key={fn} className="region-panel__tag">{fn}</span>
            ))}
          </div>

          {/* Other connections to target */}
          {toConnections.length > 0 && (
            <>
              <h3 className="region-panel__heading">
                Other {toRegion.name} Connections
              </h3>
              <ul className="region-panel__list">
                {toConnections.map((c, i) => (
                  <li key={i} className="region-panel__conn">
                    <span className="region-panel__conn-btn" style={{ cursor: 'default' }}>
                      <span
                        className="region-panel__conn-dot"
                        style={{ background: TYPE_COLORS[c.type] ?? '#888' }}
                      />
                      {c.name}
                    </span>
                    <span className="region-panel__conn-meta">
                      {(c.strength * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Clinical notes */}
          <h3 className="region-panel__heading">Clinical Significance</h3>
          <p className="region-panel__detail">{fromRegion.clinicalSignificance}</p>
        </>
      )}
    </div>
  )
}
