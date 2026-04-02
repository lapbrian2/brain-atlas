import { useState, useEffect, useRef } from 'react'
import { BRAIN_REGIONS } from '../../data/regions'
import { CONNECTIONS } from '../../data/connectome'
import { useBrainStore } from '../../store/useBrainStore'
import { REGION_MAP } from '../../data/regions'

/**
 * DataReadout — a teal telemetry overlay in the bottom-right corner.
 * Shows live data like a medical scanner:
 * - Region count
 * - Connection count
 * - Simulated alpha wave frequency
 * - Current view mode
 * - Selected region name
 * - Scanning status text
 */

const VIEW_MODE_LABELS: Record<string, string> = {
  explorer: 'EXPLORE',
  connectivity: 'CONNECT',
  activity: 'ACTIVITY',
  quiz: 'QUIZ',
}

const SCAN_PHRASES = [
  'SCANNING NEURAL TOPOLOGY...',
  'MAPPING SYNAPTIC DENSITY...',
  'TRACING AXONAL PATHWAYS...',
  'ANALYZING CORTICAL FOLDS...',
  'INDEXING REGION CLUSTERS...',
  'MEASURING SIGNAL PROPAGATION...',
]

export default function DataReadout() {
  const viewMode = useBrainStore((s) => s.viewMode)
  const selectedConnection = useBrainStore((s) => s.selectedConnection)
  const [flicker, setFlicker] = useState(0.30)
  const [alphaHz, setAlphaHz] = useState(10.2)
  const [scanText, setScanText] = useState(SCAN_PHRASES[0])
  const [typedText, setTypedText] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phraseIndexRef = useRef(0)

  const connectionLabel = selectedConnection
    ? `${REGION_MAP.get(selectedConnection.from)?.name ?? selectedConnection.from} > ${REGION_MAP.get(selectedConnection.to)?.name ?? selectedConnection.to}`
    : '---'

  // Flicker and alpha jitter
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFlicker(0.25 + Math.random() * 0.10)
      setAlphaHz(9.8 + Math.random() * 0.8)
    }, 200)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Typewriter scanning text
  useEffect(() => {
    let charIndex = 0
    const cycleScan = () => {
      const phrase = SCAN_PHRASES[phraseIndexRef.current % SCAN_PHRASES.length]
      setScanText(phrase)
      setTypedText('')
      charIndex = 0

      typeIntervalRef.current = setInterval(() => {
        charIndex++
        if (charIndex <= phrase.length) {
          setTypedText(phrase.slice(0, charIndex))
        } else {
          if (typeIntervalRef.current) clearInterval(typeIntervalRef.current)
          // Hold for a moment then cycle
          setTimeout(() => {
            phraseIndexRef.current++
            cycleScan()
          }, 2000)
        }
      }, 40)
    }

    cycleScan()
    void scanText // suppress unused warning

    return () => {
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 60,
        right: 28,
        zIndex: 10,
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 300,
        fontSize: '10px',
        lineHeight: 1.8,
        color: `rgba(0, 170, 204, ${flicker})`,
        pointerEvents: 'none',
        userSelect: 'none',
        textAlign: 'right',
        letterSpacing: '0.04em',
      }}
    >
      <div>REGIONS: {BRAIN_REGIONS.length}</div>
      <div>CONNECTIONS: {CONNECTIONS.length}</div>
      <div>ALPHA: {alphaHz.toFixed(1)} Hz</div>
      <div>MODE: {VIEW_MODE_LABELS[viewMode] ?? viewMode.toUpperCase()}</div>
      <div>TRACT: {connectionLabel.toUpperCase()}</div>
      <div style={{ marginTop: 8, fontSize: '8px', color: `rgba(0, 102, 136, ${flicker * 0.8})` }}>
        {typedText}<span style={{ opacity: Math.sin(Date.now() * 0.006) > 0 ? 1 : 0 }}>_</span>
      </div>
    </div>
  )
}
