import { useState } from 'react'
import { useBrainStore } from '../../store/useBrainStore'

const LOBE_COLORS: { label: string; color: string }[] = [
  { label: 'Frontal', color: '#00DDFF' },
  { label: 'Parietal', color: '#00AA88' },
  { label: 'Temporal', color: '#FF6633' },
  { label: 'Occipital', color: '#CC33FF' },
  { label: 'Subcortical', color: '#FF3344' },
  { label: 'Cerebellum', color: '#3366FF' },
  { label: 'Brainstem', color: '#CCDDFF' },
]

const TRACT_COLORS: { label: string; color: string }[] = [
  { label: 'Cortical', color: '#00E5FF' },
  { label: 'Subcortical', color: '#FF4081' },
  { label: 'Commissural', color: '#FFD700' },
  { label: 'Projection', color: '#76FF03' },
]

const ACTIVITY_RAMP: { label: string; color: string }[] = [
  { label: 'Low', color: '#0A2A3A' },
  { label: '', color: '#004466' },
  { label: 'Mid', color: '#00AA88' },
  { label: '', color: '#FF6633' },
  { label: 'High', color: '#FF3344' },
]

export default function LegendPanel() {
  const viewMode = useBrainStore((s) => s.viewMode)
  const [collapsed, setCollapsed] = useState(false)

  if (viewMode === 'quiz') return null

  const items =
    viewMode === 'connectivity'
      ? TRACT_COLORS
      : viewMode === 'activity'
        ? null
        : LOBE_COLORS

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 15,
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 300,
        fontSize: '10px',
        userSelect: 'none',
      }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'block',
          marginLeft: 'auto',
          background: 'none',
          border: '1px solid rgba(0, 170, 204, 0.1)',
          color: 'rgba(0, 170, 204, 0.35)',
          fontSize: '9px',
          fontFamily: "'IBM Plex Mono', monospace",
          padding: '2px 6px',
          cursor: 'pointer',
          marginBottom: 4,
          letterSpacing: '0.1em',
        }}
      >
        {collapsed ? 'LEGEND' : 'HIDE'}
      </button>

      {!collapsed && (
        <div
          style={{
            background: 'rgba(0, 15, 25, 0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 170, 204, 0.08)',
            borderRadius: 6,
            padding: '8px 10px',
          }}
        >
          {viewMode === 'activity' ? (
            <>
              <div
                style={{
                  color: 'rgba(0, 102, 136, 0.5)',
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginBottom: 4,
                }}
              >
                Activation
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {ACTIVITY_RAMP.map((stop, i) => (
                  <div
                    key={i}
                    style={{
                      width: 20,
                      height: 8,
                      background: stop.color,
                      borderRadius: i === 0 ? '2px 0 0 2px' : i === ACTIVITY_RAMP.length - 1 ? '0 2px 2px 0' : 0,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'rgba(0, 102, 136, 0.4)',
                  fontSize: '8px',
                  marginTop: 2,
                  width: 100,
                }}
              >
                <span>Low</span>
                <span>High</span>
              </div>
            </>
          ) : (
            items?.map(({ label, color }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '1px 0',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: 'rgba(136, 204, 221, 0.5)' }}>{label}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
