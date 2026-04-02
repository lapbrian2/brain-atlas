import { useBrainStore, ViewMode } from '../../store/useBrainStore'

const MODES: { mode: ViewMode; label: string }[] = [
  { mode: 'explorer', label: 'Explorer' },
  { mode: 'connectivity', label: 'Connectivity' },
  { mode: 'activity', label: 'Activity' },
  { mode: 'quiz', label: 'Quiz' },
]

export default function ViewControls() {
  const viewMode = useBrainStore((s) => s.viewMode)
  const setViewMode = useBrainStore((s) => s.setViewMode)

  return (
    <div className="view-controls">
      {MODES.map(({ mode, label }) => (
        <button
          key={mode}
          className={`view-controls__btn ${viewMode === mode ? 'view-controls__btn--active' : ''}`}
          onClick={() => setViewMode(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
