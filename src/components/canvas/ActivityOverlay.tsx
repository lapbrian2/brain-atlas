import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BRAIN_REGIONS } from '../../data/regions'
import { getRegionActivation } from '../../data/activity'
import { useBrainStore } from '../../store/useBrainStore'

/**
 * Color ramp: 0 deep blue -> 0.25 cyan -> 0.5 green -> 0.75 yellow -> 1.0 red
 */
const RAMP_STOPS = [
  { t: 0.0, color: new THREE.Color('#1A237E') },
  { t: 0.25, color: new THREE.Color('#00BCD4') },
  { t: 0.5, color: new THREE.Color('#4CAF50') },
  { t: 0.75, color: new THREE.Color('#FFEB3B') },
  { t: 1.0, color: new THREE.Color('#F44336') },
]

function sampleRamp(t: number): THREE.Color {
  const clamped = Math.max(0, Math.min(1, t))
  for (let i = 0; i < RAMP_STOPS.length - 1; i++) {
    const a = RAMP_STOPS[i]
    const b = RAMP_STOPS[i + 1]
    if (clamped >= a.t && clamped <= b.t) {
      const frac = (clamped - a.t) / (b.t - a.t)
      return a.color.clone().lerp(b.color, frac)
    }
  }
  return RAMP_STOPS[RAMP_STOPS.length - 1].color.clone()
}

const LERP_SPEED = 0.04 // 60 frames ~ 1 second transition

interface RegionTarget {
  id: string
  currentActivation: number
  targetActivation: number
}

export default function ActivityOverlay() {
  const heatmapActive = useBrainStore((s) => s.activeLayers.has('heatmap'))
  const activeTask = useBrainStore((s) => s.activeTask)

  const regionTargets = useRef<RegionTarget[]>(
    BRAIN_REGIONS.map((r) => ({
      id: r.id,
      currentActivation: 0.05,
      targetActivation: 0.05,
    })),
  )

  // Color objects for each region mesh — keyed by index for O(1) lookup
  const regionColors = useMemo(
    () => BRAIN_REGIONS.map(() => new THREE.Color('#1A237E')),
    [],
  )

  useFrame(() => {
    if (!heatmapActive) return

    for (let i = 0; i < regionTargets.current.length; i++) {
      const rt = regionTargets.current[i]
      const target = getRegionActivation(activeTask, rt.id)
      rt.targetActivation = target
      rt.currentActivation += (rt.targetActivation - rt.currentActivation) * LERP_SPEED
      regionColors[i].copy(sampleRamp(rt.currentActivation))
    }
  })

  // Expose region colors via a global ref that BrainModel can read
  // Using a simple module-level store for cross-component communication
  activityColors.active = heatmapActive
  activityColors.colors = regionColors
  activityColors.activations = regionTargets.current

  return null
}

/** Module-level shared state for activity overlay colors */
export const activityColors = {
  active: false,
  colors: [] as THREE.Color[],
  activations: [] as RegionTarget[],
}
