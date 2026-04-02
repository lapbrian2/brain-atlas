import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { BRAIN_REGIONS } from '../../data/regions'
import { useBrainStore } from '../../store/useBrainStore'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRegion = useBrainStore((s) => s.selectRegion)

  // Show on "/" keyboard shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && !visible && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        setVisible(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setVisible(false)
        setQuery('')
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [visible])

  const results = useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    return BRAIN_REGIONS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.lobe.toLowerCase().includes(q),
    ).slice(0, 6)
  }, [query])

  const handleSelect = useCallback(
    (id: string) => {
      selectRegion(id)
      setQuery('')
      setOpen(false)
      setVisible(false)
    },
    [selectRegion],
  )

  return (
    <>
      {/* Search toggle icon (always visible) */}
      {!visible && (
        <button
          className="search-toggle"
          onClick={() => {
            setVisible(true)
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
          title="Search (press /)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>
      )}

      {/* Floating search input */}
      {visible && (
        <div className="search-bar">
          <input
            ref={inputRef}
            className="search-bar__input"
            type="text"
            placeholder="Search regions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => {
              setOpen(false)
              if (!query) setVisible(false)
            }, 150)}
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
      )}
    </>
  )
}
