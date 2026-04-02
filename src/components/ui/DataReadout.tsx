import { useState, useEffect, useRef } from 'react'
import { BRAIN_REGIONS } from '../../data/regions'
import { CONNECTIONS } from '../../data/connectome'
import { useBrainStore } from '../../store/useBrainStore'
import { REGION_MAP } from '../../data/regions'

/**
 * DataReadout — a subtle, minimal telemetry overlay in the bottom-right corner.
 * Shows live data like a medical monitor:
 * - Region count
 * - Connection count
 * - Simulated alpha wave frequency
 * - Current view mode
 * - Selected region name
 *
 * Font: IBM Plex Mono 300, 10px, ~30% opacity with subtle flicker.
 */

const VIEW_MODE_LABELS: Record<string, string> = {
  explorer: 'EXPLORE',
  connectivity: 'CONNECT',
  activity: 'ACTIVITY',
  quiz: 'QUIZ',
}

export default function DataReadout() {
  const viewMode = useBrainStore((s) => s.viewMode)
  const selectedRegion = useBrainStore((s) => s.selectedRegion)
  const [flicker, setFlicker] = useState(0.30)
  const [alphaHz, setAlphaHz] = useState(10.2)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const regionName = selectedRegion ? REGION_MAP.get(selectedRegion)?.name ?? '---' : '---'

  // Subtle flicker and alpha wave jitter
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFlicker(0.25 + Math.random() * 0.10)
      setAlphaHz(9.8 + Math.random() * 0.8)
    }, 200)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
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
        color: `rgba(255, 255, 255, ${flicker})`,
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
      <div>REGION: {regionName.toUpperCase()}</div>
    </div>
  )
}
