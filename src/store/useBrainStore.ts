import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Connection } from '../data/connectome'

export type ViewMode = 'explorer' | 'connectivity' | 'activity' | 'quiz'
export type Layer = 'anatomy' | 'labels' | 'tracts' | 'particles' | 'heatmap' | 'vessels'

interface BrainState {
  viewMode: ViewMode
  activeLayers: Set<Layer>
  selectedRegion: string | null
  hoveredRegion: string | null
  selectedConnection: Connection | null
  hoveredConnection: Connection | null
  activeTask: string

  setViewMode: (mode: ViewMode) => void
  toggleLayer: (layer: Layer) => void
  selectRegion: (id: string | null) => void
  setHoveredRegion: (id: string | null) => void
  selectConnection: (conn: Connection | null) => void
  setHoveredConnection: (conn: Connection | null) => void
  setActiveTask: (task: string) => void
}

const VIEW_MODE_LAYERS: Record<ViewMode, Layer[]> = {
  explorer: ['anatomy', 'labels'],
  connectivity: ['anatomy', 'tracts', 'particles'],
  activity: ['anatomy', 'heatmap'],
  quiz: ['anatomy'],
}

export const useBrainStore = create<BrainState>()(
  subscribeWithSelector((set) => ({
    viewMode: 'explorer',
    activeLayers: new Set<Layer>(['anatomy', 'labels']),
    selectedRegion: null,
    hoveredRegion: null,
    selectedConnection: null,
    hoveredConnection: null,
    activeTask: 'rest',

    setViewMode: (mode) =>
      set({
        viewMode: mode,
        activeLayers: new Set(VIEW_MODE_LAYERS[mode]),
        selectedConnection: null,
        hoveredConnection: null,
      }),

    toggleLayer: (layer) =>
      set((state) => {
        const next = new Set(state.activeLayers)
        if (next.has(layer)) {
          next.delete(layer)
        } else {
          next.add(layer)
        }
        return { activeLayers: next }
      }),

    selectRegion: (id) => set({ selectedRegion: id }),
    setHoveredRegion: (id) => set({ hoveredRegion: id }),
    selectConnection: (conn) => set({ selectedConnection: conn }),
    setHoveredConnection: (conn) => set({ hoveredConnection: conn }),
    setActiveTask: (task) => set({ activeTask: task }),
  })),
)
