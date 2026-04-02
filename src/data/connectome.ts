export interface Connection {
  from: string
  to: string
  strength: number // 0-1
  type: 'cortical' | 'subcortical' | 'commissural' | 'projection'
}

export const CONNECTIONS: Connection[] = [
  // ============================================================
  // PREFRONTAL CORTEX CONNECTIONS
  // ============================================================
  // Prefrontal -> Hippocampus (memory encoding/retrieval)
  { from: 'prefrontal-cortex', to: 'hippocampus', strength: 0.85, type: 'cortical' },
  // Prefrontal -> Amygdala (emotional regulation)
  { from: 'prefrontal-cortex', to: 'amygdala', strength: 0.80, type: 'cortical' },
  // Prefrontal -> Thalamus (executive relay)
  { from: 'prefrontal-cortex', to: 'thalamus', strength: 0.75, type: 'projection' },
  // Prefrontal -> Caudate (goal-directed behavior)
  { from: 'prefrontal-cortex', to: 'caudate-nucleus', strength: 0.70, type: 'projection' },
  // Prefrontal -> Nucleus Accumbens (motivation/reward)
  { from: 'prefrontal-cortex', to: 'nucleus-accumbens', strength: 0.65, type: 'projection' },
  // Prefrontal -> Cingulate (conflict monitoring)
  { from: 'prefrontal-cortex', to: 'cingulate-cortex', strength: 0.80, type: 'cortical' },
  // Prefrontal -> Motor Cortex (motor planning)
  { from: 'prefrontal-cortex', to: 'motor-cortex', strength: 0.60, type: 'cortical' },
  // Prefrontal -> Broca's Area (speech planning)
  { from: 'prefrontal-cortex', to: 'brocas-area', strength: 0.70, type: 'cortical' },
  // Prefrontal -> Insula (interoceptive-executive integration)
  { from: 'prefrontal-cortex', to: 'insula', strength: 0.65, type: 'cortical' },

  // ============================================================
  // LANGUAGE NETWORK
  // ============================================================
  // Broca's -> Wernicke's (arcuate fasciculus)
  { from: 'brocas-area', to: 'wernickes-area', strength: 0.90, type: 'cortical' },
  // Wernicke's -> Angular Gyrus (semantic processing)
  { from: 'wernickes-area', to: 'angular-gyrus', strength: 0.75, type: 'cortical' },
  // Wernicke's -> Supramarginal Gyrus (phonological)
  { from: 'wernickes-area', to: 'supramarginal-gyrus', strength: 0.70, type: 'cortical' },
  // Broca's -> Motor Cortex (speech motor execution)
  { from: 'brocas-area', to: 'motor-cortex', strength: 0.75, type: 'cortical' },
  // Angular Gyrus -> Fusiform Gyrus (reading)
  { from: 'angular-gyrus', to: 'fusiform-gyrus', strength: 0.65, type: 'cortical' },
  // Broca's -> Insula (articulation)
  { from: 'brocas-area', to: 'insula', strength: 0.60, type: 'cortical' },

  // ============================================================
  // VISUAL PROCESSING STREAM
  // ============================================================
  // Visual Cortex -> Fusiform (ventral stream: what)
  { from: 'visual-cortex', to: 'fusiform-gyrus', strength: 0.85, type: 'cortical' },
  // Visual Cortex -> Cuneus (dorsal stream relay)
  { from: 'visual-cortex', to: 'cuneus', strength: 0.80, type: 'cortical' },
  // Visual Cortex -> Lingual Gyrus (object/scene)
  { from: 'visual-cortex', to: 'lingual-gyrus', strength: 0.80, type: 'cortical' },
  // Visual Cortex -> Angular Gyrus (dorsal-ventral integration)
  { from: 'visual-cortex', to: 'angular-gyrus', strength: 0.55, type: 'cortical' },
  // Fusiform -> Hippocampus (visual memory encoding)
  { from: 'fusiform-gyrus', to: 'hippocampus', strength: 0.60, type: 'cortical' },
  // Fusiform -> Amygdala (emotional face processing)
  { from: 'fusiform-gyrus', to: 'amygdala', strength: 0.55, type: 'cortical' },
  // Lingual Gyrus -> Parahippocampal (scene recognition)
  { from: 'lingual-gyrus', to: 'parahippocampal-gyrus', strength: 0.65, type: 'cortical' },
  // Visual Cortex -> Superior Colliculus (saccades)
  { from: 'visual-cortex', to: 'superior-colliculus', strength: 0.70, type: 'projection' },

  // ============================================================
  // MOTOR SYSTEM
  // ============================================================
  // Motor Cortex -> Putamen (motor loop)
  { from: 'motor-cortex', to: 'putamen', strength: 0.80, type: 'projection' },
  // Motor Cortex -> Cerebellum (motor coordination)
  { from: 'motor-cortex', to: 'cerebellum', strength: 0.85, type: 'projection' },
  // Motor Cortex -> Pons (corticobulbar/corticopontine)
  { from: 'motor-cortex', to: 'pons', strength: 0.75, type: 'projection' },
  // Motor Cortex -> Red Nucleus (rubrospinal)
  { from: 'motor-cortex', to: 'red-nucleus', strength: 0.55, type: 'projection' },
  // Motor Cortex -> Medulla (corticospinal decussation)
  { from: 'motor-cortex', to: 'medulla', strength: 0.80, type: 'projection' },
  // Somatosensory -> Motor Cortex (sensorimotor integration)
  { from: 'somatosensory-cortex', to: 'motor-cortex', strength: 0.85, type: 'cortical' },

  // ============================================================
  // BASAL GANGLIA CIRCUITS
  // ============================================================
  // Caudate -> Globus Pallidus (direct pathway)
  { from: 'caudate-nucleus', to: 'globus-pallidus', strength: 0.85, type: 'subcortical' },
  // Putamen -> Globus Pallidus (direct pathway)
  { from: 'putamen', to: 'globus-pallidus', strength: 0.90, type: 'subcortical' },
  // Globus Pallidus -> Thalamus (basal ganglia output)
  { from: 'globus-pallidus', to: 'thalamus', strength: 0.90, type: 'subcortical' },
  // Substantia Nigra -> Putamen (nigrostriatal dopamine)
  { from: 'substantia-nigra', to: 'putamen', strength: 0.85, type: 'subcortical' },
  // Substantia Nigra -> Caudate (nigrostriatal dopamine)
  { from: 'substantia-nigra', to: 'caudate-nucleus', strength: 0.80, type: 'subcortical' },
  // Caudate -> Putamen (striatal interconnection)
  { from: 'caudate-nucleus', to: 'putamen', strength: 0.60, type: 'subcortical' },

  // ============================================================
  // REWARD / DOPAMINE SYSTEM
  // ============================================================
  // VTA -> Nucleus Accumbens (mesolimbic pathway)
  { from: 'ventral-tegmental-area', to: 'nucleus-accumbens', strength: 0.90, type: 'subcortical' },
  // VTA -> Prefrontal Cortex (mesocortical pathway)
  { from: 'ventral-tegmental-area', to: 'prefrontal-cortex', strength: 0.80, type: 'projection' },
  // VTA -> Amygdala (emotional reward)
  { from: 'ventral-tegmental-area', to: 'amygdala', strength: 0.65, type: 'subcortical' },
  // VTA -> Hippocampus (reward-based memory)
  { from: 'ventral-tegmental-area', to: 'hippocampus', strength: 0.60, type: 'subcortical' },
  // Nucleus Accumbens -> VTA (feedback)
  { from: 'nucleus-accumbens', to: 'ventral-tegmental-area', strength: 0.55, type: 'subcortical' },

  // ============================================================
  // LIMBIC CIRCUIT
  // ============================================================
  // Amygdala -> Hippocampus (emotional memory)
  { from: 'amygdala', to: 'hippocampus', strength: 0.85, type: 'subcortical' },
  // Amygdala -> Hypothalamus (fight-or-flight)
  { from: 'amygdala', to: 'hypothalamus', strength: 0.80, type: 'subcortical' },
  // Amygdala -> Insula (emotional awareness)
  { from: 'amygdala', to: 'insula', strength: 0.75, type: 'subcortical' },
  // Amygdala -> Cingulate Cortex (emotional regulation)
  { from: 'amygdala', to: 'cingulate-cortex', strength: 0.70, type: 'subcortical' },
  // Amygdala -> Thalamus (threat detection relay)
  { from: 'amygdala', to: 'thalamus', strength: 0.65, type: 'subcortical' },
  // Hippocampus -> Entorhinal Cortex (memory encoding)
  { from: 'hippocampus', to: 'entorhinal-cortex', strength: 0.90, type: 'cortical' },
  // Hippocampus -> Cingulate Cortex (memory-emotion)
  { from: 'hippocampus', to: 'cingulate-cortex', strength: 0.65, type: 'cortical' },
  // Hippocampus -> Thalamus (memory relay)
  { from: 'hippocampus', to: 'thalamus', strength: 0.60, type: 'projection' },
  // Entorhinal -> Parahippocampal (spatial memory)
  { from: 'entorhinal-cortex', to: 'parahippocampal-gyrus', strength: 0.85, type: 'cortical' },
  // Hypothalamus -> Pons (autonomic relay)
  { from: 'hypothalamus', to: 'pons', strength: 0.65, type: 'projection' },
  // Hypothalamus -> Medulla (autonomic control)
  { from: 'hypothalamus', to: 'medulla', strength: 0.70, type: 'projection' },
  // Hypothalamus -> Pineal Gland (circadian)
  { from: 'hypothalamus', to: 'pineal-gland', strength: 0.60, type: 'subcortical' },
  // Insula -> Cingulate (salience network)
  { from: 'insula', to: 'cingulate-cortex', strength: 0.75, type: 'cortical' },
  // Insula -> Amygdala (interoceptive-emotional)
  { from: 'insula', to: 'amygdala', strength: 0.70, type: 'cortical' },

  // ============================================================
  // THALAMOCORTICAL PROJECTIONS
  // ============================================================
  // Thalamus -> Visual Cortex (LGN relay)
  { from: 'thalamus', to: 'visual-cortex', strength: 0.90, type: 'projection' },
  // Thalamus -> Auditory Cortex (MGN relay)
  { from: 'thalamus', to: 'auditory-cortex', strength: 0.90, type: 'projection' },
  // Thalamus -> Somatosensory Cortex (VPL/VPM relay)
  { from: 'thalamus', to: 'somatosensory-cortex', strength: 0.90, type: 'projection' },
  // Thalamus -> Prefrontal Cortex (MD nucleus)
  { from: 'thalamus', to: 'prefrontal-cortex', strength: 0.80, type: 'projection' },
  // Thalamus -> Motor Cortex (VL nucleus)
  { from: 'thalamus', to: 'motor-cortex', strength: 0.85, type: 'projection' },
  // Thalamus -> Cingulate (anterior nucleus)
  { from: 'thalamus', to: 'cingulate-cortex', strength: 0.65, type: 'projection' },

  // ============================================================
  // COMMISSURAL (CORPUS CALLOSUM)
  // ============================================================
  // Corpus Callosum connections (interhemispheric)
  { from: 'corpus-callosum', to: 'prefrontal-cortex', strength: 0.85, type: 'commissural' },
  { from: 'corpus-callosum', to: 'motor-cortex', strength: 0.80, type: 'commissural' },
  { from: 'corpus-callosum', to: 'somatosensory-cortex', strength: 0.80, type: 'commissural' },
  { from: 'corpus-callosum', to: 'visual-cortex', strength: 0.75, type: 'commissural' },
  { from: 'corpus-callosum', to: 'auditory-cortex', strength: 0.75, type: 'commissural' },
  { from: 'corpus-callosum', to: 'angular-gyrus', strength: 0.60, type: 'commissural' },
  { from: 'corpus-callosum', to: 'cingulate-cortex', strength: 0.70, type: 'commissural' },

  // ============================================================
  // DEFAULT MODE NETWORK
  // ============================================================
  // Precuneus -> Cingulate (PCC node of DMN)
  { from: 'precuneus', to: 'cingulate-cortex', strength: 0.85, type: 'cortical' },
  // Precuneus -> Angular Gyrus (DMN lateral)
  { from: 'precuneus', to: 'angular-gyrus', strength: 0.75, type: 'cortical' },
  // Precuneus -> Prefrontal (medial PFC DMN hub)
  { from: 'precuneus', to: 'prefrontal-cortex', strength: 0.70, type: 'cortical' },
  // Precuneus -> Hippocampus (memory retrieval)
  { from: 'precuneus', to: 'hippocampus', strength: 0.65, type: 'cortical' },
  // Cingulate -> Angular Gyrus (DMN connectivity)
  { from: 'cingulate-cortex', to: 'angular-gyrus', strength: 0.60, type: 'cortical' },

  // ============================================================
  // CEREBELLAR CONNECTIONS
  // ============================================================
  // Cerebellum -> Thalamus (cerebellar output)
  { from: 'cerebellum', to: 'thalamus', strength: 0.85, type: 'projection' },
  // Cerebellum -> Pons (cerebello-pontine)
  { from: 'cerebellum', to: 'pons', strength: 0.80, type: 'projection' },
  // Cerebellum -> Red Nucleus (cerebellar output)
  { from: 'cerebellum', to: 'red-nucleus', strength: 0.70, type: 'projection' },
  // Cerebellum -> Prefrontal (cognitive loop via thalamus)
  { from: 'cerebellum', to: 'prefrontal-cortex', strength: 0.45, type: 'projection' },

  // ============================================================
  // BRAINSTEM CONNECTIONS
  // ============================================================
  // Pons -> Cerebellum (pontocerebellar)
  { from: 'pons', to: 'cerebellum', strength: 0.85, type: 'projection' },
  // Pons -> Medulla (brainstem cascade)
  { from: 'pons', to: 'medulla', strength: 0.75, type: 'subcortical' },
  // Superior Colliculus -> Inferior Colliculus (tectal)
  { from: 'superior-colliculus', to: 'inferior-colliculus', strength: 0.55, type: 'subcortical' },
  // Superior Colliculus -> Thalamus (pulvinar)
  { from: 'superior-colliculus', to: 'thalamus', strength: 0.60, type: 'projection' },
  // Inferior Colliculus -> Thalamus (MGN auditory relay)
  { from: 'inferior-colliculus', to: 'thalamus', strength: 0.80, type: 'projection' },
  // Red Nucleus -> Pons (rubrospinal relay)
  { from: 'red-nucleus', to: 'pons', strength: 0.50, type: 'subcortical' },

  // ============================================================
  // AUDITORY PATHWAY
  // ============================================================
  // Auditory Cortex -> Wernicke's (speech perception)
  { from: 'auditory-cortex', to: 'wernickes-area', strength: 0.80, type: 'cortical' },
  // Auditory Cortex -> Insula (auditory-interoceptive)
  { from: 'auditory-cortex', to: 'insula', strength: 0.50, type: 'cortical' },
  // Auditory Cortex -> Amygdala (emotional sounds)
  { from: 'auditory-cortex', to: 'amygdala', strength: 0.55, type: 'cortical' },

  // ============================================================
  // SOMATOSENSORY CONNECTIONS
  // ============================================================
  // Somatosensory -> Supramarginal (tactile association)
  { from: 'somatosensory-cortex', to: 'supramarginal-gyrus', strength: 0.70, type: 'cortical' },
  // Somatosensory -> Insula (pain/temperature)
  { from: 'somatosensory-cortex', to: 'insula', strength: 0.65, type: 'cortical' },
  // Somatosensory -> Thalamus (feedback)
  { from: 'somatosensory-cortex', to: 'thalamus', strength: 0.60, type: 'projection' },

  // ============================================================
  // ADDITIONAL CROSS-NETWORK CONNECTIONS
  // ============================================================
  // Parahippocampal -> Hippocampus (spatial context)
  { from: 'parahippocampal-gyrus', to: 'hippocampus', strength: 0.80, type: 'cortical' },
  // Cuneus -> Precuneus (visual-spatial)
  { from: 'cuneus', to: 'precuneus', strength: 0.55, type: 'cortical' },
  // Angular Gyrus -> Supramarginal Gyrus (inferior parietal)
  { from: 'angular-gyrus', to: 'supramarginal-gyrus', strength: 0.70, type: 'cortical' },
  // Pineal Gland -> Hypothalamus (melatonin feedback)
  { from: 'pineal-gland', to: 'hypothalamus', strength: 0.50, type: 'subcortical' },
  // Cingulate -> Prefrontal (ACC-PFC)
  { from: 'cingulate-cortex', to: 'prefrontal-cortex', strength: 0.80, type: 'cortical' },
  // Insula -> Hypothalamus (autonomic)
  { from: 'insula', to: 'hypothalamus', strength: 0.55, type: 'cortical' },
]

/**
 * Get all connections for a given region (both incoming and outgoing).
 */
export function getRegionConnections(regionId: string): Connection[] {
  return CONNECTIONS.filter(
    (c) => c.from === regionId || c.to === regionId,
  )
}

/**
 * Get only outgoing connections from a region.
 */
export function getOutgoingConnections(regionId: string): Connection[] {
  return CONNECTIONS.filter((c) => c.from === regionId)
}

/**
 * Get connection strength between two regions (0 if no direct connection).
 */
export function getConnectionStrength(fromId: string, toId: string): number {
  const conn = CONNECTIONS.find(
    (c) =>
      (c.from === fromId && c.to === toId) ||
      (c.from === toId && c.to === fromId),
  )
  return conn?.strength ?? 0
}
