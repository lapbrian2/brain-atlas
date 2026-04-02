import { useMemo } from 'react'
import { REGION_MAP } from '../../data/regions'
import { getRegionConnections } from '../../data/connectome'
import { useBrainStore } from '../../store/useBrainStore'

export default function RegionPanel() {
  const selectedRegion = useBrainStore((s) => s.selectedRegion)
  const selectRegion = useBrainStore((s) => s.selectRegion)

  const region = selectedRegion ? REGION_MAP.get(selectedRegion) : null

  const connections = useMemo(() => {
    if (!selectedRegion) return []
    return getRegionConnections(selectedRegion).map((c) => {
      const otherId = c.from === selectedRegion ? c.to : c.from
      const other = REGION_MAP.get(otherId)
      return { id: otherId, name: other?.name ?? otherId, strength: c.strength, type: c.type }
    })
  }, [selectedRegion])

  const isOpen = region !== null

  return (
    <div
      className="region-panel"
      style={{ transform: isOpen ? 'translateX(0)' : 'translateX(110%)' }}
    >
      {region && (
        <>
          <button className="region-panel__close" onClick={() => selectRegion(null)}>
            x
          </button>
          <div className="region-panel__lobe">{region.lobe}</div>
          <h2 className="region-panel__name">{region.name}</h2>
          <p className="region-panel__desc">{region.description}</p>

          <h3 className="region-panel__heading">Functions</h3>
          <ul className="region-panel__list">
            {region.functions.map((fn) => (
              <li key={fn}>{fn}</li>
            ))}
          </ul>

          <h3 className="region-panel__heading">
            Connections ({connections.length})
          </h3>
          <ul className="region-panel__list">
            {connections
              .sort((a, b) => b.strength - a.strength)
              .slice(0, 10)
              .map((c) => (
                <li key={c.id} className="region-panel__conn">
                  <button
                    className="region-panel__conn-btn"
                    onClick={() => selectRegion(c.id)}
                  >
                    {c.name}
                  </button>
                  <span className="region-panel__conn-meta">
                    {(c.strength * 100).toFixed(0)}% {c.type}
                  </span>
                </li>
              ))}
          </ul>
        </>
      )}
    </div>
  )
}
