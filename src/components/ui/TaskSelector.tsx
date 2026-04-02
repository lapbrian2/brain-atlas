import { ACTIVITY_PATTERNS } from '../../data/activity'
import { useBrainStore } from '../../store/useBrainStore'

export default function TaskSelector() {
  const viewMode = useBrainStore((s) => s.viewMode)
  const activeTask = useBrainStore((s) => s.activeTask)
  const setActiveTask = useBrainStore((s) => s.setActiveTask)

  if (viewMode !== 'activity') return null

  const current = ACTIVITY_PATTERNS.find((p) => p.id === activeTask)

  return (
    <div className="task-selector">
      <label className="task-selector__label">Activity Pattern</label>
      <select
        className="task-selector__select"
        value={activeTask}
        onChange={(e) => setActiveTask(e.target.value)}
      >
        {ACTIVITY_PATTERNS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {current && (
        <p className="task-selector__desc">{current.description}</p>
      )}
    </div>
  )
}
