export interface BrainRegion {
  id: string
  name: string
  lobe: 'frontal' | 'parietal' | 'temporal' | 'occipital' | 'subcortical' | 'cerebellum' | 'brainstem'
  description: string
  functions: string[]
  position: [number, number, number]
  color: string
  brodmannAreas?: number[]
  bloodSupply: string
  clinicalSignificance: string
  pathologies: string[]
}

export const BRAIN_REGIONS: BrainRegion[] = [
  // === FRONTAL LOBE ===
  {
    id: 'prefrontal-cortex',
    name: 'Prefrontal Cortex',
    lobe: 'frontal',
    description:
      'The anterior part of the frontal lobe, critical for executive functions including planning, decision-making, moderating social behavior, and personality expression. It integrates information from diverse brain regions to orchestrate complex cognitive behavior.',
    functions: [
      'Executive function',
      'Decision-making',
      'Working memory',
      'Personality expression',
      'Social behavior moderation',
      'Planning and goal-setting',
    ],
    position: [0, 0.5, 0.9],
    color: '#4488FF',
    brodmannAreas: [9, 10, 11, 12, 46, 47],
    bloodSupply: 'Anterior cerebral artery (medial), Middle cerebral artery (lateral)',
    clinicalSignificance: 'Damage causes dysexecutive syndrome: impaired planning, personality changes, poor social judgment, and apathy. Prefrontal lobotomy historically severed connections here.',
    pathologies: ['Frontotemporal dementia', 'ADHD', 'Schizophrenia (hypofrontality)', 'Depression', 'Traumatic brain injury'],
  },
  {
    id: 'motor-cortex',
    name: 'Primary Motor Cortex',
    lobe: 'frontal',
    description:
      'Located in the precentral gyrus (Brodmann area 4), the primary motor cortex is responsible for generating neural impulses that control the execution of voluntary movements. It is organized somatotopically as a motor homunculus.',
    functions: [
      'Voluntary movement execution',
      'Fine motor control',
      'Somatotopic body mapping',
      'Motor planning relay',
    ],
    position: [0, 0.7, 0.3],
    color: '#4488FF',
    brodmannAreas: [4, 6],
    bloodSupply: 'Anterior cerebral artery (leg/foot area), Middle cerebral artery (face/arm area)',
    clinicalSignificance: 'Lesions cause contralateral upper motor neuron weakness (hemiparesis). Somatotopic organization means focal lesions produce specific deficits (e.g., hand weakness from middle cerebral artery stroke).',
    pathologies: ['Stroke (MCA territory)', 'ALS (upper motor neuron degeneration)', 'Brain tumors (glioma)', 'Todd paralysis (post-seizure)'],
  },
  {
    id: 'brocas-area',
    name: "Broca's Area",
    lobe: 'frontal',
    description:
      "Located in the posterior part of the left inferior frontal gyrus (Brodmann areas 44 and 45). Broca's area is essential for speech production and language processing. Damage causes Broca's aphasia -- non-fluent speech with intact comprehension.",
    functions: [
      'Speech production',
      'Language processing',
      'Syntactic processing',
      'Verbal working memory',
      'Motor speech planning',
    ],
    position: [-0.6, 0.3, 0.7],
    color: '#4488FF',
    brodmannAreas: [44, 45],
    bloodSupply: 'Middle cerebral artery (superior division)',
    clinicalSignificance: "Damage causes Broca's aphasia: non-fluent, effortful speech with relatively preserved comprehension. Patients understand language but cannot produce fluent speech.",
    pathologies: ["Broca's aphasia (stroke)", 'Primary progressive aphasia (non-fluent variant)', 'Left MCA stroke'],
  },

  // === PARIETAL LOBE ===
  {
    id: 'somatosensory-cortex',
    name: 'Primary Somatosensory Cortex',
    lobe: 'parietal',
    description:
      'Located in the postcentral gyrus (Brodmann areas 1, 2, and 3), it receives tactile, proprioceptive, and nociceptive information from the body. Organized as a sensory homunculus with disproportionate representation of hands and face.',
    functions: [
      'Touch perception',
      'Proprioception',
      'Pain processing',
      'Temperature sensing',
      'Tactile discrimination',
    ],
    position: [0, 0.7, 0.0],
    color: '#00CC88',
    brodmannAreas: [1, 2, 3],
    bloodSupply: 'Anterior cerebral artery (medial leg/foot), Middle cerebral artery (lateral face/arm)',
    clinicalSignificance: 'Lesions cause contralateral cortical sensory loss: impaired two-point discrimination, astereognosis, and loss of position sense while pain/temperature (thalamic) may be preserved.',
    pathologies: ['Stroke (sensory cortex territory)', 'Cortical sensory syndrome', 'Parietal lobe epilepsy (sensory auras)'],
  },
  {
    id: 'angular-gyrus',
    name: 'Angular Gyrus',
    lobe: 'parietal',
    description:
      "Located in the inferior parietal lobule (Brodmann area 39), the angular gyrus is a cross-modal association area involved in reading, semantic processing, number processing, and spatial cognition. Damage to the left angular gyrus can cause Gerstmann's syndrome.",
    functions: [
      'Reading and literacy',
      'Semantic processing',
      'Number processing',
      'Spatial attention',
      'Memory retrieval',
    ],
    position: [-0.7, 0.5, -0.4],
    color: '#00CC88',
    brodmannAreas: [39],
    bloodSupply: 'Middle cerebral artery (posterior division)',
    clinicalSignificance: "Left-sided damage causes Gerstmann's syndrome: agraphia, acalculia, finger agnosia, and left-right confusion. Also causes alexia with agraphia.",
    pathologies: ["Gerstmann's syndrome", 'Alexia with agraphia', 'Semantic dementia', 'Angular gyrus syndrome'],
  },
  {
    id: 'supramarginal-gyrus',
    name: 'Supramarginal Gyrus',
    lobe: 'parietal',
    description:
      'Located in the inferior parietal lobule (Brodmann area 40), it is involved in phonological processing, tactile perception, and empathy. It plays a role in overriding egocentric bias to understand others\' perspectives.',
    functions: [
      'Phonological processing',
      'Tactile object recognition',
      'Empathy and perspective-taking',
      'Language comprehension',
    ],
    position: [-0.75, 0.45, -0.2],
    color: '#00CC88',
    brodmannAreas: [40],
    bloodSupply: 'Middle cerebral artery (posterior division)',
    clinicalSignificance: 'Left-sided damage contributes to conduction aphasia (impaired repetition with intact comprehension and fluency). Right-sided damage causes hemispatial neglect.',
    pathologies: ['Conduction aphasia', 'Hemispatial neglect (right-sided lesion)', 'Ideomotor apraxia'],
  },
  {
    id: 'precuneus',
    name: 'Precuneus',
    lobe: 'parietal',
    description:
      'Located on the medial surface of the parietal lobe (Brodmann area 7), the precuneus is a key node of the default mode network. It is among the most metabolically active brain regions at rest and is involved in self-referential processing, episodic memory retrieval, and visuospatial imagery.',
    functions: [
      'Self-referential processing',
      'Episodic memory retrieval',
      'Visuospatial imagery',
      'Consciousness',
      'Default mode network hub',
    ],
    position: [0, 0.6, -0.5],
    color: '#00CC88',
    brodmannAreas: [7, 31],
    bloodSupply: 'Anterior cerebral artery (pericallosal branches)',
    clinicalSignificance: 'Among the first regions to show reduced metabolism in early Alzheimer\'s disease. Hypometabolism here is a biomarker for AD. Also implicated in disorders of consciousness.',
    pathologies: ["Alzheimer's disease (early hypometabolism)", 'Disorders of consciousness', 'Posterior cortical atrophy'],
  },

  // === TEMPORAL LOBE ===
  {
    id: 'wernickes-area',
    name: "Wernicke's Area",
    lobe: 'temporal',
    description:
      "Located in the posterior part of the left superior temporal gyrus (Brodmann area 22). Wernicke's area is essential for language comprehension. Damage causes Wernicke's aphasia -- fluent but nonsensical speech with impaired comprehension.",
    functions: [
      'Language comprehension',
      'Speech perception',
      'Semantic processing',
      'Word recognition',
    ],
    position: [-0.7, 0.1, -0.3],
    color: '#FFaa33',
    brodmannAreas: [22],
    bloodSupply: 'Middle cerebral artery (inferior division)',
    clinicalSignificance: "Damage causes Wernicke's aphasia: fluent but nonsensical speech (word salad) with severely impaired comprehension. Patients are often unaware of their deficit (anosognosia).",
    pathologies: ["Wernicke's aphasia (stroke)", 'Temporal lobe epilepsy', 'Herpes simplex encephalitis'],
  },
  {
    id: 'auditory-cortex',
    name: 'Primary Auditory Cortex',
    lobe: 'temporal',
    description:
      'Located in the superior temporal gyrus within Heschl\'s gyrus (Brodmann areas 41 and 42). It performs the first cortical processing of auditory information, organized tonotopically from low to high frequencies.',
    functions: [
      'Sound processing',
      'Frequency discrimination',
      'Tonotopic mapping',
      'Auditory scene analysis',
    ],
    position: [-0.8, 0.0, 0.0],
    color: '#FFaa33',
    brodmannAreas: [41, 42],
    bloodSupply: 'Middle cerebral artery (inferior division)',
    clinicalSignificance: 'Bilateral damage causes cortical deafness. Unilateral lesions cause subtle deficits in sound localization and auditory discrimination rather than complete hearing loss.',
    pathologies: ['Cortical deafness (bilateral)', 'Auditory agnosia', 'Temporal lobe epilepsy (auditory auras)'],
  },
  {
    id: 'fusiform-gyrus',
    name: 'Fusiform Gyrus',
    lobe: 'temporal',
    description:
      'Located on the ventral surface of the temporal lobe (Brodmann area 37). Contains the fusiform face area (FFA), which is selectively activated by faces. Also involved in word recognition, color processing, and category-specific object recognition.',
    functions: [
      'Face recognition',
      'Visual word form processing',
      'Color perception',
      'Object categorization',
    ],
    position: [-0.5, -0.4, -0.2],
    color: '#FFaa33',
    brodmannAreas: [37],
    bloodSupply: 'Posterior cerebral artery',
    clinicalSignificance: 'Damage causes prosopagnosia (face blindness) -- inability to recognize familiar faces despite intact visual acuity. Can be acquired or developmental.',
    pathologies: ['Prosopagnosia (face blindness)', 'Alexia (pure word blindness)', 'Achromatopsia (color blindness)'],
  },
  {
    id: 'entorhinal-cortex',
    name: 'Entorhinal Cortex',
    lobe: 'temporal',
    description:
      'Located in the medial temporal lobe (Brodmann areas 28 and 34), the entorhinal cortex is the main interface between the hippocampus and neocortex. It contains grid cells essential for spatial navigation and is among the first regions affected in Alzheimer\'s disease.',
    functions: [
      'Memory consolidation gateway',
      'Spatial navigation (grid cells)',
      'Time perception',
      'Hippocampal-neocortical interface',
    ],
    position: [-0.35, -0.3, 0.3],
    color: '#FFaa33',
    brodmannAreas: [28, 34],
    bloodSupply: 'Posterior cerebral artery (anterior temporal branch)',
    clinicalSignificance: "Among the very first regions to show neurofibrillary tangles in Alzheimer's disease (Braak stage I-II). Grid cell dysfunction here may explain early spatial disorientation in AD patients.",
    pathologies: ["Alzheimer's disease (earliest pathology)", 'Temporal lobe epilepsy', 'Semantic dementia'],
  },
  {
    id: 'parahippocampal-gyrus',
    name: 'Parahippocampal Gyrus',
    lobe: 'temporal',
    description:
      'Located on the medial surface of the temporal lobe surrounding the hippocampus. Contains the parahippocampal place area (PPA), selectively activated by scenes and spatial layouts. Critical for encoding and recognizing spatial environments.',
    functions: [
      'Scene recognition',
      'Spatial memory encoding',
      'Contextual associations',
      'Topographical orientation',
    ],
    position: [-0.3, -0.35, -0.1],
    color: '#FFaa33',
    brodmannAreas: [27, 28, 35, 36],
    bloodSupply: 'Posterior cerebral artery',
    clinicalSignificance: 'Damage causes topographical disorientation and difficulty encoding new spatial memories. Lesions here often occur with hippocampal damage in medial temporal lobe epilepsy surgery.',
    pathologies: ['Topographical disorientation', 'Temporal lobe epilepsy', "Alzheimer's disease"],
  },
  {
    id: 'insula',
    name: 'Insula',
    lobe: 'temporal',
    description:
      'A cortical region deep within the lateral sulcus, hidden beneath the frontal, parietal, and temporal opercula. The insula integrates interoceptive awareness, emotional experience, empathy, and homeostatic regulation. It is critical for subjective feeling states.',
    functions: [
      'Interoceptive awareness',
      'Emotional processing',
      'Empathy',
      'Taste perception',
      'Homeostatic regulation',
      'Pain perception',
    ],
    position: [-0.5, 0.1, 0.2],
    color: '#FFaa33',
    brodmannAreas: [13, 14, 15, 16],
    bloodSupply: 'Middle cerebral artery (insular segment, M2)',
    clinicalSignificance: 'Insular strokes cause gustatory deficits, autonomic dysregulation, and loss of interoceptive awareness. Right insular damage linked to anosognosia. Implicated in addiction -- damage can abolish nicotine cravings.',
    pathologies: ['Insular stroke (autonomic instability)', 'Addiction (craving cessation after damage)', 'Frontotemporal dementia (social-emotional variant)'],
  },

  // === OCCIPITAL LOBE ===
  {
    id: 'visual-cortex',
    name: 'Primary Visual Cortex (V1)',
    lobe: 'occipital',
    description:
      'Located along the calcarine fissure on the medial surface of the occipital lobe (Brodmann area 17). V1 performs the initial cortical processing of visual information. It is retinotopically organized and contains orientation-selective columns.',
    functions: [
      'Visual processing',
      'Edge detection',
      'Orientation selectivity',
      'Retinotopic mapping',
      'Color processing (V1 blobs)',
    ],
    position: [0, 0.2, -0.95],
    color: '#FF44AA',
    brodmannAreas: [17],
    bloodSupply: 'Posterior cerebral artery (calcarine branch)',
    clinicalSignificance: 'Damage causes contralateral homonymous hemianopia (loss of half the visual field). Bilateral damage causes cortical blindness, sometimes with Anton syndrome (denial of blindness).',
    pathologies: ['Cortical blindness', 'Homonymous hemianopia', 'Anton syndrome', 'Charles Bonnet syndrome (visual hallucinations)'],
  },
  {
    id: 'cuneus',
    name: 'Cuneus',
    lobe: 'occipital',
    description:
      'A wedge-shaped region on the medial surface of the occipital lobe between the calcarine and parieto-occipital sulci (Brodmann area 17/18). It receives visual information from the superior visual field and is involved in basic visual processing.',
    functions: [
      'Visual processing (upper visual field)',
      'Visual attention modulation',
      'Spatial frequency processing',
    ],
    position: [0, 0.5, -0.85],
    color: '#FF44AA',
    brodmannAreas: [17, 18],
    bloodSupply: 'Posterior cerebral artery',
    clinicalSignificance: 'Lesions cause contralateral inferior quadrantanopia (loss of lower quarter of the visual field on the opposite side). Often affected in PCA strokes.',
    pathologies: ['Inferior quadrantanopia', 'Posterior cerebral artery stroke', 'Visual auras in migraine'],
  },
  {
    id: 'lingual-gyrus',
    name: 'Lingual Gyrus',
    lobe: 'occipital',
    description:
      'Located on the medial and inferior surface of the occipital lobe, below the calcarine sulcus (Brodmann area 18/19). It is involved in processing visual information, particularly complex visual stimuli, visual memory encoding, and letter/word recognition.',
    functions: [
      'Visual processing (lower visual field)',
      'Visual memory',
      'Letter and word recognition',
      'Dream imagery',
    ],
    position: [0, -0.1, -0.9],
    color: '#FF44AA',
    brodmannAreas: [18, 19],
    bloodSupply: 'Posterior cerebral artery',
    clinicalSignificance: 'Damage causes contralateral superior quadrantanopia. Bilateral damage to the lingual and fusiform gyri causes achromatopsia (acquired color blindness) or prosopagnosia.',
    pathologies: ['Superior quadrantanopia', 'Achromatopsia (acquired)', 'Visual agnosia', 'Posterior cortical atrophy'],
  },

  // === SUBCORTICAL STRUCTURES ===
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    lobe: 'subcortical',
    description:
      'A seahorse-shaped structure in the medial temporal lobe, critical for the formation of new explicit (declarative) memories and spatial navigation. Contains place cells that map spatial environments. Damage causes anterograde amnesia.',
    functions: [
      'Episodic memory formation',
      'Spatial navigation (place cells)',
      'Memory consolidation',
      'Contextual learning',
      'Pattern separation and completion',
    ],
    position: [-0.35, -0.15, 0.1],
    color: '#00DDFF',
    bloodSupply: 'Posterior cerebral artery (hippocampal branches), Anterior choroidal artery',
    clinicalSignificance: "Bilateral damage causes profound anterograde amnesia (inability to form new memories), as in patient H.M. Among the first structures affected in Alzheimer's disease. Hippocampal sclerosis is the hallmark of temporal lobe epilepsy.",
    pathologies: ["Alzheimer's disease", 'Temporal lobe epilepsy (hippocampal sclerosis)', 'Anterograde amnesia', 'Transient global amnesia', 'Hypoxic-ischemic injury'],
  },
  {
    id: 'amygdala',
    name: 'Amygdala',
    lobe: 'subcortical',
    description:
      'An almond-shaped nuclear complex in the medial temporal lobe. The amygdala is central to processing emotions, especially fear and threat detection. It modulates memory consolidation through emotional arousal and drives the fight-or-flight response.',
    functions: [
      'Fear processing',
      'Emotional memory',
      'Threat detection',
      'Social cognition',
      'Reward processing',
      'Fight-or-flight activation',
    ],
    position: [-0.4, -0.2, 0.35],
    color: '#00DDFF',
    bloodSupply: 'Anterior choroidal artery, Middle cerebral artery (temporal branches)',
    clinicalSignificance: "Bilateral damage causes Kluver-Bucy syndrome: emotional flattening, hyperorality, visual agnosia, and hypersexuality. Unilateral damage impairs fear conditioning. Amygdala hyperactivity is implicated in PTSD and anxiety disorders.",
    pathologies: ['Kluver-Bucy syndrome', 'PTSD (hyperactivation)', 'Anxiety disorders', 'Temporal lobe epilepsy', 'Urbach-Wiethe disease (calcification)'],
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    lobe: 'subcortical',
    description:
      'A paired ovoid nuclear mass at the center of the brain, often called the "relay station" of the brain. Nearly all sensory information (except olfaction) passes through the thalamus before reaching cortex. It also relays motor, limbic, and cognitive signals.',
    functions: [
      'Sensory relay to cortex',
      'Motor signal relay',
      'Consciousness regulation',
      'Sleep-wake cycle',
      'Attention modulation',
      'Pain perception gating',
    ],
    position: [0, 0.1, 0.0],
    color: '#00DDFF',
    bloodSupply: 'Posterior cerebral artery (thalamoperforating and thalamogeniculate branches), Posterior communicating artery',
    clinicalSignificance: 'Thalamic strokes cause contralateral sensory loss and thalamic pain syndrome (Dejerine-Roussy). Bilateral thalamic lesions can cause coma or severe cognitive impairment. Fatal familial insomnia targets the thalamus.',
    pathologies: ['Thalamic stroke (Dejerine-Roussy syndrome)', 'Fatal familial insomnia', 'Thalamic tumors', 'Wernicke-Korsakoff syndrome (mammillothalamic tract)'],
  },
  {
    id: 'hypothalamus',
    name: 'Hypothalamus',
    lobe: 'subcortical',
    description:
      'A small region below the thalamus that controls the autonomic nervous system and endocrine system via the pituitary gland. It maintains homeostasis by regulating body temperature, hunger, thirst, sleep, circadian rhythms, and reproductive behavior.',
    functions: [
      'Homeostasis',
      'Hormone regulation',
      'Temperature regulation',
      'Hunger and satiety',
      'Circadian rhythm control',
      'Autonomic nervous system control',
    ],
    position: [0, -0.15, 0.2],
    color: '#00DDFF',
    bloodSupply: 'Circle of Willis perforating branches, Superior hypophyseal artery, Anterior cerebral artery',
    clinicalSignificance: 'Damage causes diabetes insipidus (loss of ADH), temperature dysregulation, and disrupted hunger/satiety. Hypothalamic tumors (craniopharyngioma) in children cause hormonal deficiencies and visual field defects.',
    pathologies: ['Diabetes insipidus', 'Craniopharyngioma', 'Hypothalamic obesity', 'Kallmann syndrome', 'Prader-Willi syndrome'],
  },
  {
    id: 'caudate-nucleus',
    name: 'Caudate Nucleus',
    lobe: 'subcortical',
    description:
      'A C-shaped nucleus of the basal ganglia involved in motor planning, procedural learning, and reward-based decision-making. It receives input from wide cortical areas and is part of the cortico-basal ganglia-thalamocortical loop.',
    functions: [
      'Motor planning',
      'Procedural learning',
      'Goal-directed behavior',
      'Reward processing',
      'Habit formation',
    ],
    position: [-0.15, 0.25, 0.15],
    color: '#00DDFF',
    bloodSupply: 'Lenticulostriate arteries (branches of middle cerebral artery), Anterior cerebral artery (Heubner)',
    clinicalSignificance: "Caudate atrophy is the radiological hallmark of Huntington's disease, visible on CT/MRI as enlarged frontal horns of the lateral ventricles. Caudate lesions can cause abulia (lack of will/motivation).",
    pathologies: ["Huntington's disease (caudate atrophy)", 'OCD (caudate hyperactivity)', 'Chorea', 'Abulia'],
  },
  {
    id: 'putamen',
    name: 'Putamen',
    lobe: 'subcortical',
    description:
      'The outermost part of the basal ganglia, forming the lateral portion of the lentiform nucleus. The putamen is primarily involved in motor control, motor learning, and the regulation of movements. It works closely with the caudate as part of the striatum.',
    functions: [
      'Motor execution regulation',
      'Motor learning',
      'Limb movement control',
      'Reinforcement learning',
    ],
    position: [-0.25, 0.1, 0.15],
    color: '#00DDFF',
    bloodSupply: 'Lenticulostriate arteries (lateral branches of middle cerebral artery)',
    clinicalSignificance: 'The most common site of hypertensive intracerebral hemorrhage. Putaminal hemorrhage causes contralateral hemiparesis, hemisensory loss, and homonymous hemianopia.',
    pathologies: ['Hypertensive hemorrhage (most common site)', "Parkinson's disease", "Huntington's disease", 'Wilson disease (copper deposition)'],
  },
  {
    id: 'globus-pallidus',
    name: 'Globus Pallidus',
    lobe: 'subcortical',
    description:
      'The medial portion of the lentiform nucleus, divided into external (GPe) and internal (GPi) segments. The GPi is a major output nucleus of the basal ganglia, projecting to the thalamus. It regulates voluntary movement by modulating thalamocortical activity.',
    functions: [
      'Motor output regulation',
      'Movement inhibition/disinhibition',
      'Basal ganglia output relay',
      'Postural control',
    ],
    position: [-0.18, 0.05, 0.1],
    color: '#00DDFF',
    bloodSupply: 'Anterior choroidal artery, Lenticulostriate arteries',
    clinicalSignificance: 'Target for deep brain stimulation (DBS) in dystonia and Parkinson\'s disease. Carbon monoxide poisoning characteristically causes bilateral pallidal necrosis.',
    pathologies: ['Carbon monoxide poisoning (bilateral necrosis)', 'Dystonia (DBS target)', "Parkinson's disease (DBS target)", 'Kernicterus (bilirubin toxicity)'],
  },
  {
    id: 'nucleus-accumbens',
    name: 'Nucleus Accumbens',
    lobe: 'subcortical',
    description:
      'Located in the ventral striatum where the caudate head and putamen meet. Central to the mesolimbic reward pathway, it processes reward, motivation, pleasure, and reinforcement learning. Dopamine release here mediates the rewarding effects of both natural stimuli and drugs of abuse.',
    functions: [
      'Reward processing',
      'Motivation and drive',
      'Pleasure and reinforcement',
      'Addiction circuitry',
      'Approach behavior',
    ],
    position: [-0.12, -0.05, 0.3],
    color: '#00DDFF',
    bloodSupply: 'Recurrent artery of Heubner (branch of anterior cerebral artery)',
    clinicalSignificance: 'Central to the neurobiology of addiction. All drugs of abuse increase dopamine release here. Deep brain stimulation of the nucleus accumbens is being investigated for treatment-resistant depression and OCD.',
    pathologies: ['Substance use disorders (all classes)', 'Behavioral addictions', 'Anhedonia in depression', 'OCD (DBS target)'],
  },
  {
    id: 'cingulate-cortex',
    name: 'Cingulate Cortex',
    lobe: 'subcortical',
    description:
      'A medial cortical region surrounding the corpus callosum, divided into anterior (ACC) and posterior (PCC) portions. The ACC is involved in error monitoring, conflict detection, and emotional regulation. The PCC is a key default mode network node involved in self-referential thought.',
    functions: [
      'Error monitoring (ACC)',
      'Conflict detection',
      'Emotional regulation',
      'Pain processing',
      'Self-referential thought (PCC)',
      'Default mode network (PCC)',
    ],
    position: [0, 0.4, 0.15],
    color: '#00DDFF',
    brodmannAreas: [23, 24, 25, 31, 32, 33],
    bloodSupply: 'Anterior cerebral artery (pericallosal and callosomarginal branches)',
    clinicalSignificance: 'ACC cingulotomy was used for intractable pain and OCD. Subgenual cingulate (BA25) hyperactivity is implicated in treatment-resistant depression and is a DBS target. PCC hypometabolism is an early sign of Alzheimer\'s disease.',
    pathologies: ['Treatment-resistant depression (BA25)', "Alzheimer's disease (PCC)", 'OCD', 'Chronic pain syndromes', 'Akinetic mutism (bilateral ACC lesions)'],
  },
  {
    id: 'corpus-callosum',
    name: 'Corpus Callosum',
    lobe: 'subcortical',
    description:
      'The largest white matter commissure in the brain, containing approximately 200 million axons connecting the left and right cerebral hemispheres. It enables interhemispheric communication and coordination. Severing it (callosotomy) produces split-brain syndrome.',
    functions: [
      'Interhemispheric communication',
      'Bilateral motor coordination',
      'Transfer of sensory information',
      'Cognitive integration across hemispheres',
    ],
    position: [0, 0.3, 0.0],
    color: '#00DDFF',
    bloodSupply: 'Anterior cerebral artery (pericallosal artery)',
    clinicalSignificance: 'Callosotomy (surgical severing) produces split-brain syndrome: each hemisphere operates independently. Callosal lesions cause alien hand syndrome, interhemispheric disconnection, and left-hand anomia.',
    pathologies: ['Split-brain syndrome (callosotomy)', 'Multiple sclerosis (Dawson fingers)', 'Agenesis of the corpus callosum', 'Marchiafava-Bignami disease (alcoholism)', 'Alien hand syndrome'],
  },

  // === BRAINSTEM ===
  {
    id: 'substantia-nigra',
    name: 'Substantia Nigra',
    lobe: 'brainstem',
    description:
      'Located in the midbrain, the substantia nigra contains darkly pigmented dopaminergic neurons (pars compacta) that project to the striatum via the nigrostriatal pathway. Degeneration of these neurons is the primary pathology of Parkinson\'s disease.',
    functions: [
      'Dopamine production',
      'Motor control facilitation',
      'Reward circuitry',
      'Movement initiation',
    ],
    position: [0, -0.4, -0.1],
    color: '#FFFFFF',
    bloodSupply: 'Posterior cerebral artery (peduncular perforating branches), Superior cerebellar artery',
    clinicalSignificance: "Loss of dopaminergic neurons in the pars compacta is THE defining pathology of Parkinson's disease. Symptoms appear after ~60-80% of neurons are lost. Neuromelanin pigment gives it the dark color visible on MRI.",
    pathologies: ["Parkinson's disease (primary pathology)", 'Progressive supranuclear palsy', 'Multiple system atrophy', 'Drug-induced parkinsonism'],
  },
  {
    id: 'ventral-tegmental-area',
    name: 'Ventral Tegmental Area',
    lobe: 'brainstem',
    description:
      'Located near the midline of the midbrain floor, the VTA contains dopaminergic neurons that project to the nucleus accumbens (mesolimbic pathway) and prefrontal cortex (mesocortical pathway). Central to reward, motivation, and reinforcement learning.',
    functions: [
      'Reward signaling',
      'Motivation',
      'Reinforcement learning',
      'Dopamine projection to cortex and striatum',
    ],
    position: [0, -0.45, 0.0],
    color: '#FFFFFF',
    bloodSupply: 'Posterior cerebral artery (perforating branches), Superior cerebellar artery',
    clinicalSignificance: 'Origin of the mesolimbic and mesocortical dopamine pathways. Dysregulation causes positive symptoms of schizophrenia (mesolimbic hyperactivity) and negative symptoms (mesocortical hypoactivity). Central to addiction neurobiology.',
    pathologies: ['Schizophrenia (dopamine hypothesis)', 'Substance use disorders', 'Depression (anhedonia)', 'ADHD'],
  },
  {
    id: 'red-nucleus',
    name: 'Red Nucleus',
    lobe: 'brainstem',
    description:
      'A midbrain structure involved in motor coordination, receiving input from the cerebellum and motor cortex. It gives rise to the rubrospinal tract, which influences upper limb flexor motor neurons. Named for its iron-rich reddish appearance.',
    functions: [
      'Motor coordination',
      'Upper limb motor control',
      'Cerebellar relay',
      'Rubrospinal tract origin',
    ],
    position: [0, -0.35, -0.05],
    color: '#FFFFFF',
    bloodSupply: 'Posterior cerebral artery (perforating branches), Superior cerebellar artery',
    clinicalSignificance: 'Lesions cause Claude syndrome (ipsilateral CN III palsy + contralateral ataxia) or Benedikt syndrome (CN III palsy + contralateral tremor). Iron content makes it visible on MRI.',
    pathologies: ['Claude syndrome', 'Benedikt syndrome', 'Rubral tremor (Holmes tremor)', 'Midbrain stroke'],
  },
  {
    id: 'superior-colliculus',
    name: 'Superior Colliculus',
    lobe: 'brainstem',
    description:
      'Located on the dorsal surface of the midbrain (tectum). The superior colliculus receives direct retinal input and controls saccadic eye movements and visual orienting reflexes. It integrates visual, auditory, and somatosensory maps for orienting behavior.',
    functions: [
      'Saccadic eye movements',
      'Visual orienting reflexes',
      'Multisensory integration',
      'Gaze control',
    ],
    position: [0, -0.25, -0.35],
    color: '#FFFFFF',
    bloodSupply: 'Posterior cerebral artery (quadrigeminal branches), Superior cerebellar artery',
    clinicalSignificance: "Lesions cause Parinaud's syndrome: paralysis of upward gaze, convergence-retraction nystagmus, and light-near dissociation of pupils. Often caused by pinealoma compressing the tectal plate.",
    pathologies: ["Parinaud's syndrome (dorsal midbrain syndrome)", 'Pinealoma compression', 'Hydrocephalus (aqueductal stenosis)'],
  },
  {
    id: 'inferior-colliculus',
    name: 'Inferior Colliculus',
    lobe: 'brainstem',
    description:
      'Located on the dorsal midbrain below the superior colliculus. The inferior colliculus is the principal midbrain nucleus of the auditory pathway, integrating ascending auditory information before relaying it to the medial geniculate body of the thalamus.',
    functions: [
      'Auditory processing relay',
      'Sound localization',
      'Auditory reflex (startle response)',
      'Frequency integration',
    ],
    position: [0, -0.3, -0.4],
    color: '#FFFFFF',
    bloodSupply: 'Superior cerebellar artery, Posterior cerebral artery',
    clinicalSignificance: 'Lesions cause impaired sound localization and auditory processing but not deafness (peripheral pathway intact). Bilateral damage causes central auditory processing disorder.',
    pathologies: ['Central auditory processing disorder', 'Midbrain stroke', 'Acoustic neuroma (indirect compression)'],
  },
  {
    id: 'pons',
    name: 'Pons',
    lobe: 'brainstem',
    description:
      'A major brainstem structure between the midbrain and medulla. The pons relays signals between the cerebellum and cerebrum and contains nuclei for cranial nerves V through VIII. It plays critical roles in sleep regulation, respiration, and bladder control.',
    functions: [
      'Cerebellar-cerebral relay',
      'Sleep regulation (REM sleep)',
      'Respiration modulation',
      'Cranial nerve nuclei (V-VIII)',
      'Bladder control',
    ],
    position: [0, -0.55, -0.15],
    color: '#FFFFFF',
    bloodSupply: 'Basilar artery (pontine branches), Anterior inferior cerebellar artery (AICA)',
    clinicalSignificance: 'Central pontine myelinolysis results from overly rapid sodium correction. Locked-in syndrome results from ventral pontine infarction (basilar artery occlusion): patient is conscious but can only communicate via vertical eye movements.',
    pathologies: ['Locked-in syndrome (basilar artery occlusion)', 'Central pontine myelinolysis', 'Pontine glioma', 'Trigeminal neuralgia (CN V compression)'],
  },
  {
    id: 'medulla',
    name: 'Medulla Oblongata',
    lobe: 'brainstem',
    description:
      'The most caudal part of the brainstem, continuous with the spinal cord. The medulla contains vital autonomic centers controlling cardiovascular function, respiration, and vomiting. It is where most corticospinal fibers decussate (pyramidal decussation).',
    functions: [
      'Cardiovascular regulation',
      'Respiratory rhythm generation',
      'Swallowing and vomiting',
      'Pyramidal decussation',
      'Autonomic reflexes',
    ],
    position: [0, -0.7, -0.15],
    color: '#FFFFFF',
    bloodSupply: 'Vertebral arteries, Posterior inferior cerebellar artery (PICA), Anterior spinal artery',
    clinicalSignificance: 'Lateral medullary (Wallenberg) syndrome from PICA occlusion causes: ipsilateral facial pain/temperature loss, Horner syndrome, cerebellar ataxia, and contralateral body pain/temperature loss. Medullary lesions can be fatal if respiratory centers are affected.',
    pathologies: ['Wallenberg syndrome (lateral medullary)', 'Medial medullary syndrome', 'Syringobulbia', 'Arnold-Chiari malformation'],
  },
  {
    id: 'pineal-gland',
    name: 'Pineal Gland',
    lobe: 'brainstem',
    description:
      'A small endocrine gland located between the two superior colliculi. The pineal gland produces melatonin, the hormone that regulates circadian rhythms and sleep-wake cycles. It is light-sensitive via retinal input through the suprachiasmatic nucleus.',
    functions: [
      'Melatonin production',
      'Circadian rhythm regulation',
      'Sleep-wake cycle timing',
      'Seasonal reproduction signaling',
    ],
    position: [0, -0.1, -0.3],
    color: '#FFFFFF',
    bloodSupply: 'Posterior choroidal arteries (branches of posterior cerebral artery)',
    clinicalSignificance: "Pineal tumors (germinoma, pineoblastoma) compress the tectal plate causing Parinaud's syndrome. Pineal calcification is normal in adults and visible on X-ray. The pineal gland is outside the blood-brain barrier.",
    pathologies: ['Pinealoma (germinoma)', 'Pineoblastoma', "Parinaud's syndrome (compression)", 'Precocious puberty (in children with pineal tumors)'],
  },

  // === CEREBELLUM ===
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    lobe: 'cerebellum',
    description:
      'Located at the posterior base of the brain, the cerebellum contains more neurons than the rest of the brain combined. It fine-tunes motor commands, maintains balance and posture, coordinates timing, and contributes to motor learning. Recent research shows involvement in cognitive and emotional processing.',
    functions: [
      'Motor coordination and timing',
      'Balance and posture',
      'Motor learning',
      'Error correction',
      'Cognitive processing',
      'Emotional regulation',
    ],
    position: [0, -0.55, -0.5],
    color: '#AA66FF',
    bloodSupply: 'Superior cerebellar artery (SCA), Anterior inferior cerebellar artery (AICA), Posterior inferior cerebellar artery (PICA)',
    clinicalSignificance: 'Cerebellar lesions cause ipsilateral ataxia, intention tremor, dysmetria, dysdiadochokinesia, and scanning speech. Cerebellar tonsillar herniation through the foramen magnum is rapidly fatal (compresses medulla).',
    pathologies: ['Cerebellar stroke (SCA/PICA/AICA)', 'Medulloblastoma (most common pediatric brain tumor)', 'Spinocerebellar ataxia', 'Cerebellar tonsillar herniation', 'Alcoholic cerebellar degeneration'],
  },
]

/**
 * Lookup map for O(1) access by region ID.
 */
export const REGION_MAP = new Map(
  BRAIN_REGIONS.map((r) => [r.id, r]),
)

/**
 * Group regions by lobe for UI filtering.
 */
export const REGIONS_BY_LOBE = BRAIN_REGIONS.reduce(
  (acc, region) => {
    if (!acc[region.lobe]) acc[region.lobe] = []
    acc[region.lobe].push(region)
    return acc
  },
  {} as Record<string, BrainRegion[]>,
)
