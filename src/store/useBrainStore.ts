import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type ViewMode = 'explorer' | 'connectivity' | 'activity' | 'quiz'
export type Layer = 'anatomy' | 'labels' | 'tracts' | 'particles' | 'heatmap' | 'vessels'

interface BrainState {
  viewMode: ViewMode
  activeLayers: Set<Layer>
  selectedRegion: string | null
  hoveredRegion: string | null
  activeTask: string
  brainOpacity: number

  setViewMode: (mode: ViewMode) => void
  toggleLayer: (layer: Layer) => void
  selectRegion: (id: string | null) => void
  setHoveredRegion: (id: string | null) => void
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
    activeTask: 'rest',
    brainOpacity: 0.95,

    setViewMode: (mode) =>
      set({
        viewMode: mode,
        activeLayers: new Set(VIEW_MODE_LAYERS[mode]),
        brainOpacity: mode === 'connectivity' ? 0.35 : 0.95,
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
    setActiveTask: (task) => set({ activeTask: task }),
  })),
)
