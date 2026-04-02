import { useState, useMemo, useCallback } from 'react'
import { BRAIN_REGIONS } from '../../data/regions'
import { useBrainStore } from '../../store/useBrainStore'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selectRegion = useBrainStore((s) => s.selectRegion)

  const results = useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    return BRAIN_REGIONS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.lobe.toLowerCase().includes(q),
    ).slice(0, 8)
  }, [query])

  const handleSelect = useCallback(
    (id: string) => {
      selectRegion(id)
      setQuery('')
      setOpen(false)
    },
    [selectRegion],
  )

  return (
    <div className="search-bar">
      <input
        className="search-bar__input"
        type="text"
        placeholder="Search regions..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <ul className="search-bar__results">
          {results.map((r) => (
            <li key={r.id}>
              <button
                className="search-bar__result-btn"
                onMouseDown={() => handleSelect(r.id)}
              >
                <span className="search-bar__result-name">{r.name}</span>
                <span className="search-bar__result-lobe">{r.lobe}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
