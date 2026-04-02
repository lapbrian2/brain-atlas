import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BRAIN_REGIONS } from '../../data/regions'
import { getRegionActivation } from '../../data/activity'
import { useBrainStore } from '../../store/useBrainStore'

const LERP_SPEED = 0.04

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

  useFrame(() => {
    if (!heatmapActive) {
      activityState.active = false
      return
    }

    activityState.active = true

    for (let i = 0; i < regionTargets.current.length; i++) {
      const rt = regionTargets.current[i]
      const target = getRegionActivation(activeTask, rt.id)
      rt.targetActivation = target
      rt.currentActivation += (rt.targetActivation - rt.currentActivation) * LERP_SPEED
    }

    activityState.activations = regionTargets.current
  })

  return null
}

/** Module-level shared state for activity overlay — read by BrainModel */
export const activityState = {
  active: false,
  activations: [] as RegionTarget[],
}
