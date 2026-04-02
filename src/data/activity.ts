export interface ActivityPattern {
  id: string
  name: string
  description: string
  activations: Record<string, number> // region id -> activation level 0-1
}

export const ACTIVITY_PATTERNS: ActivityPattern[] = [
  {
    id: 'language',
    name: 'Language Processing',
    description:
      'Neural pattern during speech production and comprehension. High activation in perisylvian language areas with left-hemisphere dominance. Engages frontal speech planning, temporal comprehension, and parietal integration regions.',
    activations: {
      'brocas-area': 0.95,
      'wernickes-area': 0.90,
      'angular-gyrus': 0.75,
      'supramarginal-gyrus': 0.70,
      'auditory-cortex': 0.80,
      'motor-cortex': 0.55,
      'prefrontal-cortex': 0.60,
      'insula': 0.65,
      'thalamus': 0.50,
      'fusiform-gyrus': 0.45,
      'cingulate-cortex': 0.40,
      'corpus-callosum': 0.35,
    },
  },
  {
    id: 'motor',
    name: 'Motor Execution',
    description:
      'Neural pattern during voluntary movement. Primary motor cortex drives execution, cerebellum coordinates timing, and basal ganglia modulate initiation and sequencing. Somatosensory cortex provides continuous proprioceptive feedback.',
    activations: {
      'motor-cortex': 0.95,
      'somatosensory-cortex': 0.75,
      'cerebellum': 0.90,
      'putamen': 0.80,
      'caudate-nucleus': 0.60,
      'globus-pallidus': 0.70,
      'thalamus': 0.65,
      'substantia-nigra': 0.55,
      'red-nucleus': 0.50,
      'pons': 0.45,
      'prefrontal-cortex': 0.40,
      'cingulate-cortex': 0.35,
      'medulla': 0.40,
      'corpus-callosum': 0.30,
    },
  },
  {
    id: 'vision',
    name: 'Visual Processing',
    description:
      'Neural pattern during active visual perception. Thalamic relay (LGN) feeds V1, which distributes to ventral ("what") and dorsal ("where") streams. Fusiform gyrus handles face/object recognition while parietal regions process spatial relationships.',
    activations: {
      'visual-cortex': 0.95,
      'cuneus': 0.85,
      'lingual-gyrus': 0.80,
      'fusiform-gyrus': 0.75,
      'angular-gyrus': 0.50,
      'thalamus': 0.70,
      'superior-colliculus': 0.65,
      'parahippocampal-gyrus': 0.55,
      'precuneus': 0.40,
      'prefrontal-cortex': 0.35,
      'somatosensory-cortex': 0.20,
    },
  },
  {
    id: 'memory',
    name: 'Memory Encoding & Retrieval',
    description:
      'Neural pattern during episodic memory formation and recall. The hippocampal formation (hippocampus + entorhinal + parahippocampal) is central, with prefrontal cortex providing strategic encoding/retrieval and cingulate supporting context.',
    activations: {
      'hippocampus': 0.95,
      'entorhinal-cortex': 0.90,
      'parahippocampal-gyrus': 0.80,
      'prefrontal-cortex': 0.75,
      'cingulate-cortex': 0.65,
      'precuneus': 0.60,
      'angular-gyrus': 0.55,
      'thalamus': 0.55,
      'amygdala': 0.50,
      'fusiform-gyrus': 0.40,
      'insula': 0.35,
      'caudate-nucleus': 0.30,
    },
  },
  {
    id: 'emotion',
    name: 'Emotional Processing',
    description:
      'Neural pattern during emotional experience and regulation. The amygdala drives threat detection and emotional salience, insula provides interoceptive awareness ("gut feeling"), cingulate cortex monitors and regulates, and prefrontal cortex exerts top-down control.',
    activations: {
      'amygdala': 0.95,
      'insula': 0.90,
      'cingulate-cortex': 0.85,
      'prefrontal-cortex': 0.70,
      'hypothalamus': 0.75,
      'nucleus-accumbens': 0.60,
      'hippocampus': 0.55,
      'ventral-tegmental-area': 0.50,
      'thalamus': 0.50,
      'fusiform-gyrus': 0.40,
      'auditory-cortex': 0.35,
      'motor-cortex': 0.30,
      'medulla': 0.35,
      'pons': 0.30,
    },
  },
  {
    id: 'rest',
    name: 'Default Mode Network (Rest)',
    description:
      'Neural pattern during wakeful rest, mind-wandering, and self-referential thought. The default mode network (DMN) activates when not engaged in external tasks. Key hubs include medial prefrontal cortex, posterior cingulate/precuneus, and angular gyrus.',
    activations: {
      'precuneus': 0.90,
      'cingulate-cortex': 0.85,
      'prefrontal-cortex': 0.80,
      'angular-gyrus': 0.75,
      'hippocampus': 0.65,
      'parahippocampal-gyrus': 0.55,
      'entorhinal-cortex': 0.45,
      'insula': 0.40,
      'thalamus': 0.35,
      'corpus-callosum': 0.30,
      'supramarginal-gyrus': 0.35,
    },
  },
]

/**
 * Lookup map for O(1) access by pattern ID.
 */
export const PATTERN_MAP = new Map(
  ACTIVITY_PATTERNS.map((p) => [p.id, p]),
)

/**
 * Get the activation level of a specific region in a given pattern.
 * Returns 0.05 (baseline) if the region is not listed in the pattern.
 */
export function getRegionActivation(
  patternId: string,
  regionId: string,
): number {
  const pattern = PATTERN_MAP.get(patternId)
  if (!pattern) return 0.05
  return pattern.activations[regionId] ?? 0.05
}
