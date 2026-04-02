import { useRef, useMemo, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { BRAIN_REGIONS } from '../../data/regions'
import { useBrainStore } from '../../store/useBrainStore'
import { activityColors } from './ActivityOverlay'

// ============================================================
// Simplex noise implementation (3D) for vertex displacement
// Based on Stefan Gustavson's implementation
// ============================================================
const F3 = 1.0 / 3.0
const G3 = 1.0 / 6.0

const grad3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
]

function buildPerm(seed: number): Uint8Array {
  const p = new Uint8Array(512)
  const base = new Uint8Array(256)
  for (let i = 0; i < 256; i++) base[i] = i
  // Fisher-Yates with seed
  let s = seed | 0
  for (let i = 255; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    const tmp = base[i]
    base[i] = base[j]
    base[j] = tmp
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255]
  return p
}

function simplex3(x: number, y: number, z: number, perm: Uint8Array): number {
  const s = (x + y + z) * F3
  const i = Math.floor(x + s)
  const j = Math.floor(y + s)
  const k = Math.floor(z + s)
  const t = (i + j + k) * G3
  const X0 = i - t
  const Y0 = j - t
  const Z0 = k - t
  const x0 = x - X0
  const y0 = y - Y0
  const z0 = z - Z0

  let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number
  if (x0 >= y0) {
    if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0 }
    else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1 }
    else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1 }
  } else {
    if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1 }
    else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1 }
    else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0 }
  }

  const x1 = x0 - i1 + G3
  const y1 = y0 - j1 + G3
  const z1 = z0 - k1 + G3
  const x2 = x0 - i2 + 2.0 * G3
  const y2 = y0 - j2 + 2.0 * G3
  const z2 = z0 - k2 + 2.0 * G3
  const x3 = x0 - 1.0 + 3.0 * G3
  const y3 = y0 - 1.0 + 3.0 * G3
  const z3 = z0 - 1.0 + 3.0 * G3

  const ii = i & 255
  const jj = j & 255
  const kk = k & 255

  const gi0 = perm[ii + perm[jj + perm[kk]]] % 12
  const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12
  const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12
  const gi3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12

  let n0 = 0, n1 = 0, n2 = 0, n3 = 0
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0
  if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0 + grad3[gi0][2] * z0) }
  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1
  if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1 + grad3[gi1][2] * z1) }
  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2
  if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2 + grad3[gi2][2] * z2) }
  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3
  if (t3 >= 0) { t3 *= t3; n3 = t3 * t3 * (grad3[gi3][0] * x3 + grad3[gi3][1] * y3 + grad3[gi3][2] * z3) }

  return 32.0 * (n0 + n1 + n2 + n3)
}

/**
 * FBM with domain warping for organic cortical folding.
 * Domain warping feeds noise output back into the position before
 * sampling the next octave, producing more natural, non-uniform wrinkles.
 */
function fbmDomainWarped(
  x: number, y: number, z: number,
  perm: Uint8Array,
  octaves: number,
  baseFreq: number,
  amplitude: number,
  warpStrength: number,
): number {
  let value = 0
  let amp = amplitude
  let freq = baseFreq

  // Domain warp: offset the input by noise before main FBM
  const warpX = simplex3(x * 1.7 + 3.3, y * 1.7 + 7.1, z * 1.7 + 1.9, perm)
  const warpY = simplex3(x * 1.7 + 11.5, y * 1.7 + 2.3, z * 1.7 + 5.7, perm)
  const warpZ = simplex3(x * 1.7 + 8.9, y * 1.7 + 13.1, z * 1.7 + 4.3, perm)

  const wx = x + warpX * warpStrength
  const wy = y + warpY * warpStrength
  const wz = z + warpZ * warpStrength

  for (let i = 0; i < octaves; i++) {
    value += amp * simplex3(wx * freq, wy * freq, wz * freq, perm)
    freq *= 2.0
    amp *= 0.5
  }
  return value
}

/**
 * Ridged noise — creates sharp valleys (sulci) between smooth peaks (gyri).
 * The key to brain-like folded ribbon appearance.
 * Inverts absolute value of noise to create ridges with deep grooves.
 */
function ridgedNoise(
  x: number, y: number, z: number,
  perm: Uint8Array,
  octaves: number,
  freq: number,
  amp: number,
): number {
  let value = 0
  let weight = 1.0
  let f = freq
  let a = amp
  for (let i = 0; i < octaves; i++) {
    let signal = simplex3(x * f, y * f, z * f, perm)
    signal = a * (1.0 - Math.abs(signal))  // Ridge: invert absolute value
    signal *= signal                          // Sharpen the ridges
    signal *= weight                          // Weight by previous octave
    weight = Math.min(signal * 2.0, 1.0)     // Constrain weight
    value += signal
    f *= 2.1
    a *= 0.5
  }
  return value
}

/**
 * Anisotropic FBM for cerebellar folia — tight parallel ridges.
 * High frequency on the Y axis, low frequency on X/Z to create
 * the characteristic horizontal striping of the cerebellum.
 */
function fbmAnisotropic(
  x: number, y: number, z: number,
  perm: Uint8Array,
  octaves: number,
  baseFreq: number,
  amplitude: number,
  yScale: number,
): number {
  let value = 0
  let amp = amplitude
  let freq = baseFreq
  for (let i = 0; i < octaves; i++) {
    value += amp * simplex3(x * freq, y * freq * yScale, z * freq, perm)
    freq *= 2.0
    amp *= 0.55
  }
  return value
}


// ============================================================
// Anatomical region definitions
// Each region maps to a shaped, noise-displaced mesh
// ============================================================
interface AnatomicalRegion {
  id: string
  name: string
  position: [number, number, number]
  scale: [number, number, number]
  rotation: [number, number, number]
  noiseFreq: number
  noiseAmp: number
  noiseOctaves: number
  warpStrength: number
  seed: number
  segments: number
  color: string
  deeperColor: string
  regionIds: string[] // which data region IDs this mesh covers
  geometryType: 'sphere' | 'ellipsoid' | 'cerebellum' | 'brainstem'
}

// Anatomical proportions:
// Real brain: ~15cm wide (X), ~17cm long (Z), ~13cm tall (Y)
// Model space: ~1.5 wide, ~1.7 long, ~1.3 tall
// Yakovlevian torque: right frontal petalia (+0.025 Z), left occipital petalia (+0.025 Z)

const ANATOMICAL_REGIONS: AnatomicalRegion[] = [
  // Left Frontal Lobe — ~40% of cortex, wraps around front and top
  {
    id: 'left-frontal',
    name: 'Left Frontal Lobe',
    position: [-0.36, 0.32, 0.42],
    scale: [0.44, 0.50, 0.58],
    rotation: [0.05, 0.12, 0.02],
    noiseFreq: 2.2,
    noiseAmp: 0.08,
    noiseOctaves: 6,
    warpStrength: 0.05,
    seed: 42,
    segments: 72,
    color: '#D4A574',
    deeperColor: '#C49464',
    regionIds: ['prefrontal-cortex', 'brocas-area'],
    geometryType: 'ellipsoid',
  },
  // Right Frontal Lobe — slight right frontal petalia (+0.025 Z)
  {
    id: 'right-frontal',
    name: 'Right Frontal Lobe',
    position: [0.36, 0.32, 0.445],
    scale: [0.44, 0.50, 0.58],
    rotation: [0.05, -0.12, -0.02],
    noiseFreq: 2.2,
    noiseAmp: 0.08,
    noiseOctaves: 6,
    warpStrength: 0.05,
    seed: 137,
    segments: 72,
    color: '#D4A574',
    deeperColor: '#C49464',
    regionIds: ['motor-cortex'],
    geometryType: 'ellipsoid',
  },
  // Left Parietal Lobe — behind frontal, separated by central sulcus
  {
    id: 'left-parietal',
    name: 'Left Parietal Lobe',
    position: [-0.30, 0.55, -0.14],
    scale: [0.40, 0.36, 0.44],
    rotation: [0.15, 0.08, 0.0],
    noiseFreq: 2.4,
    noiseAmp: 0.07,
    noiseOctaves: 6,
    warpStrength: 0.04,
    seed: 271,
    segments: 64,
    color: '#D4A574',
    deeperColor: '#C49464',
    regionIds: ['somatosensory-cortex', 'angular-gyrus', 'supramarginal-gyrus'],
    geometryType: 'ellipsoid',
  },
  // Right Parietal Lobe
  {
    id: 'right-parietal',
    name: 'Right Parietal Lobe',
    position: [0.30, 0.55, -0.14],
    scale: [0.40, 0.36, 0.44],
    rotation: [0.15, -0.08, 0.0],
    noiseFreq: 2.4,
    noiseAmp: 0.07,
    noiseOctaves: 6,
    warpStrength: 0.04,
    seed: 314,
    segments: 64,
    color: '#D4A574',
    deeperColor: '#C49464',
    regionIds: ['precuneus'],
    geometryType: 'ellipsoid',
  },
  // Left Temporal Lobe — elongated horizontally, hangs below/sides
  // Sylvian fissure separates it from frontal/parietal (the gap between them)
  {
    id: 'left-temporal',
    name: 'Left Temporal Lobe',
    position: [-0.58, -0.02, 0.06],
    scale: [0.26, 0.26, 0.52],
    rotation: [0.0, 0.2, 0.12],
    noiseFreq: 2.5,
    noiseAmp: 0.07,
    noiseOctaves: 6,
    warpStrength: 0.04,
    seed: 577,
    segments: 64,
    color: '#D4A574',
    deeperColor: '#C49464',
    regionIds: ['wernickes-area', 'auditory-cortex', 'fusiform-gyrus', 'entorhinal-cortex', 'parahippocampal-gyrus', 'insula'],
    geometryType: 'ellipsoid',
  },
  // Right Temporal Lobe
  {
    id: 'right-temporal',
    name: 'Right Temporal Lobe',
    position: [0.58, -0.02, 0.06],
    scale: [0.26, 0.26, 0.52],
    rotation: [0.0, -0.2, -0.12],
    noiseFreq: 2.5,
    noiseAmp: 0.07,
    noiseOctaves: 6,
    warpStrength: 0.04,
    seed: 691,
    segments: 64,
    color: '#D4A574',
    deeperColor: '#C49464',
    regionIds: [],
    geometryType: 'ellipsoid',
  },
  // Left Occipital Lobe — small, at the very back
  // Left occipital petalia (+0.025 Z protrusion)
  {
    id: 'left-occipital',
    name: 'Left Occipital Lobe',
    position: [-0.24, 0.26, -0.645],
    scale: [0.30, 0.32, 0.30],
    rotation: [0.1, 0.1, 0.0],
    noiseFreq: 2.6,
    noiseAmp: 0.06,
    noiseOctaves: 6,
    warpStrength: 0.04,
    seed: 823,
    segments: 56,
    color: '#D4A574',
    deeperColor: '#C49464',
    regionIds: ['visual-cortex', 'cuneus', 'lingual-gyrus'],
    geometryType: 'ellipsoid',
  },
  // Right Occipital Lobe
  {
    id: 'right-occipital',
    name: 'Right Occipital Lobe',
    position: [0.24, 0.26, -0.62],
    scale: [0.30, 0.32, 0.30],
    rotation: [0.1, -0.1, 0.0],
    noiseFreq: 2.6,
    noiseAmp: 0.06,
    noiseOctaves: 6,
    warpStrength: 0.04,
    seed: 967,
    segments: 56,
    color: '#D4A574',
    deeperColor: '#C49464',
    regionIds: [],
    geometryType: 'ellipsoid',
  },
  // Cerebellum — posterior inferior, very tight horizontal ridges (folia)
  {
    id: 'cerebellum-mesh',
    name: 'Cerebellum',
    position: [0, -0.38, -0.48],
    scale: [0.52, 0.22, 0.32],
    rotation: [0.2, 0, 0],
    noiseFreq: 3.5,
    noiseAmp: 0.05,
    noiseOctaves: 5,
    warpStrength: 0.02,
    seed: 1117,
    segments: 64,
    color: '#C9967A',
    deeperColor: '#B8866A',
    regionIds: ['cerebellum'],
    geometryType: 'cerebellum',
  },
  // Brainstem — tapers downward, truncated cone shape
  {
    id: 'brainstem-mesh',
    name: 'Brainstem',
    position: [0, -0.55, -0.18],
    scale: [0.13, 0.34, 0.13],
    rotation: [0.25, 0, 0],
    noiseFreq: 2.0,
    noiseAmp: 0.04,
    noiseOctaves: 3,
    warpStrength: 0.02,
    seed: 1229,
    segments: 24,
    color: '#BFA08A',
    deeperColor: '#A88A74',
    regionIds: ['substantia-nigra', 'ventral-tegmental-area', 'red-nucleus', 'superior-colliculus', 'inferior-colliculus', 'pons', 'medulla', 'pineal-gland'],
    geometryType: 'brainstem',
  },
  // Corpus Callosum (visible in fissure)
  {
    id: 'corpus-callosum-mesh',
    name: 'Corpus Callosum',
    position: [0, 0.30, 0.0],
    scale: [0.08, 0.06, 0.48],
    rotation: [0, 0, 0],
    noiseFreq: 2.0,
    noiseAmp: 0.03,
    noiseOctaves: 3,
    warpStrength: 0.01,
    seed: 1361,
    segments: 20,
    color: '#E8D5C4',
    deeperColor: '#D8C5B4',
    regionIds: ['corpus-callosum'],
    geometryType: 'ellipsoid',
  },
  // Deep subcortical group
  {
    id: 'subcortical-group',
    name: 'Subcortical Structures',
    position: [0, 0.06, 0.06],
    scale: [0.28, 0.22, 0.26],
    rotation: [0, 0, 0],
    noiseFreq: 2.0,
    noiseAmp: 0.03,
    noiseOctaves: 3,
    warpStrength: 0.01,
    seed: 1489,
    segments: 32,
    color: '#C4947A',
    deeperColor: '#B4846A',
    regionIds: ['hippocampus', 'amygdala', 'thalamus', 'hypothalamus', 'caudate-nucleus', 'putamen', 'globus-pallidus', 'nucleus-accumbens', 'cingulate-cortex'],
    geometryType: 'ellipsoid',
  },
]

// Build a reverse map: data region ID -> anatomical mesh ID
const DATA_REGION_TO_MESH = new Map<string, string>()
for (const ar of ANATOMICAL_REGIONS) {
  for (const rid of ar.regionIds) {
    DATA_REGION_TO_MESH.set(rid, ar.id)
  }
}

/**
 * Create a noise-displaced geometry for a brain region.
 * Uses domain-warped FBM for cortical regions,
 * anisotropic noise for cerebellum,
 * and a tapered cylinder for brainstem.
 */
function createBrainGeometry(
  region: AnatomicalRegion,
): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry

  if (region.geometryType === 'brainstem') {
    // Truncated cone — wider at top, narrower at bottom
    geo = new THREE.CylinderGeometry(0.9, 0.55, 2.0, region.segments, 12)
  } else {
    geo = new THREE.SphereGeometry(1, region.segments, region.segments)
  }

  const positions = geo.attributes.position
  const normals = geo.attributes.normal
  const perm = buildPerm(region.seed)

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    const nx = normals.getX(i)
    const ny = normals.getY(i)
    const nz = normals.getZ(i)

    let displacement: number

    if (region.geometryType === 'cerebellum') {
      // Tight horizontal folia: high Y frequency, low X/Z
      displacement = fbmAnisotropic(
        x, y, z, perm,
        region.noiseOctaves, region.noiseFreq, region.noiseAmp,
        4.0, // Y-axis frequency multiplier for tight parallel ridges
      )
    } else if (region.geometryType === 'brainstem') {
      // Minimal noise — smooth surface
      displacement = fbmDomainWarped(
        x, y, z, perm,
        region.noiseOctaves, region.noiseFreq, region.noiseAmp,
        region.warpStrength,
      )
    } else {
      // Cortical regions: ridged noise (70%) for gyri/sulci fold structure
      // mixed with domain-warped FBM (30%) for organic variation.
      // Ridged noise creates the sharp valleys (sulci) between smooth peaks (gyri).
      const ridged = ridgedNoise(
        x, y, z, perm,
        5, region.noiseFreq, region.noiseAmp,
      )
      const smooth = fbmDomainWarped(
        x, y, z, perm,
        4, region.noiseFreq * 0.5, region.noiseAmp * 0.3,
        region.warpStrength,
      )
      displacement = ridged * 0.7 + smooth * 0.3
    }

    positions.setXYZ(
      i,
      x + nx * displacement,
      y + ny * displacement,
      z + nz * displacement,
    )
  }

  geo.computeVertexNormals()
  return geo
}

// ============================================================
// Fresnel rim shader injection for tech/holographic look
// ============================================================
const FRESNEL_VERTEX_PARS = /* glsl */ `
varying vec3 vWorldNormal;
varying vec3 vViewDir;
`

const FRESNEL_VERTEX = /* glsl */ `
vWorldNormal = normalize((modelMatrix * vec4(transformedNormal, 0.0)).xyz);
vViewDir = normalize(cameraPosition - (modelMatrix * vec4(transformed, 1.0)).xyz);
`

const FRESNEL_FRAGMENT_PARS = /* glsl */ `
varying vec3 vWorldNormal;
varying vec3 vViewDir;
`

const FRESNEL_FRAGMENT = /* glsl */ `
float fresnelTerm = 1.0 - abs(dot(vWorldNormal, vViewDir));
fresnelTerm = pow(fresnelTerm, 3.0);
vec3 fresnelColor = vec3(0.267, 0.533, 1.0) * fresnelTerm * 0.2;
gl_FragColor.rgb += fresnelColor;
`

function applyFresnelShader(material: THREE.MeshPhysicalMaterial) {
  material.onBeforeCompile = (shader) => {
    // Vertex shader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\n' + FRESNEL_VERTEX_PARS,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      '#include <worldpos_vertex>\n' + FRESNEL_VERTEX,
    )

    // Fragment shader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      '#include <common>\n' + FRESNEL_FRAGMENT_PARS,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      FRESNEL_FRAGMENT + '\n#include <dithering_fragment>',
    )
  }
}


// ============================================================
// Individual region mesh component
// ============================================================
function RegionMesh({ region }: { region: AnatomicalRegion }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const selectedRegion = useBrainStore((s) => s.selectedRegion)
  const hoveredRegion = useBrainStore((s) => s.hoveredRegion)
  const brainOpacity = useBrainStore((s) => s.brainOpacity)

  // Store original material color for lerp-back
  const originalColor = useRef(new THREE.Color())
  const originalEmissive = useRef(new THREE.Color())

  const geometry = useMemo(() => createBrainGeometry(region), [region])

  const material = useMemo(() => {
    // Per-structure-type materials for anatomical realism
    let mat: THREE.MeshPhysicalMaterial

    if (region.geometryType === 'cerebellum') {
      // Cerebellum: slightly darker, more pink, tighter surface texture
      mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#D4A090'),
        roughness: 0.75,
        metalness: 0.0,
        clearcoat: 0.06,
        clearcoatRoughness: 0.65,
        sheen: 0.35,
        sheenColor: new THREE.Color('#C08070'),
        sheenRoughness: 0.5,
        transmission: 0.02,
        thickness: 0.5,
        emissive: new THREE.Color('#1a0808'),
        emissiveIntensity: 0.04,
        transparent: true,
        opacity: 0.95,
      })
    } else if (region.geometryType === 'brainstem') {
      // Brainstem: smoother, paler, less sheen
      mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#E0C0B0'),
        roughness: 0.78,
        metalness: 0.0,
        clearcoat: 0.04,
        clearcoatRoughness: 0.7,
        sheen: 0.2,
        sheenColor: new THREE.Color('#C0A090'),
        sheenRoughness: 0.6,
        transmission: 0.01,
        thickness: 0.4,
        emissive: new THREE.Color('#120606'),
        emissiveIntensity: 0.03,
        transparent: true,
        opacity: 0.95,
      })
    } else if (region.id === 'corpus-callosum-mesh') {
      // Corpus callosum: white matter -- much whiter, smoother
      mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#F0E8E0'),
        roughness: 0.68,
        metalness: 0.0,
        clearcoat: 0.05,
        clearcoatRoughness: 0.6,
        sheen: 0.15,
        sheenColor: new THREE.Color('#E0D0C0'),
        sheenRoughness: 0.5,
        transmission: 0.01,
        thickness: 0.3,
        emissive: new THREE.Color('#0a0404'),
        emissiveIntensity: 0.02,
        transparent: true,
        opacity: 0.95,
      })
    } else if (region.id === 'subcortical-group') {
      // Subcortical: slightly darker, more gray
      mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#C0A090'),
        roughness: 0.74,
        metalness: 0.0,
        clearcoat: 0.06,
        clearcoatRoughness: 0.65,
        sheen: 0.3,
        sheenColor: new THREE.Color('#B08878'),
        sheenRoughness: 0.5,
        transmission: 0.02,
        thickness: 0.5,
        emissive: new THREE.Color('#140808'),
        emissiveIntensity: 0.04,
        transparent: true,
        opacity: 0.95,
      })
    } else {
      // Cortex (hemispheres): pinkish-gray, moist matte, subtle sheen
      mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#E8C4A8'),
        roughness: 0.72,
        metalness: 0.0,
        clearcoat: 0.08,
        clearcoatRoughness: 0.6,
        sheen: 0.4,
        sheenColor: new THREE.Color('#D4908A'),
        sheenRoughness: 0.5,
        transmission: 0.02,
        thickness: 0.5,
        emissive: new THREE.Color('#1a0808'),
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.95,
      })
    }

    // Apply fresnel rim effect for tech/scan look
    applyFresnelShader(mat)

    return mat
  }, [region.geometryType, region.id])

  // Determine if this mesh is hovered/selected based on data region mapping
  const isSelected = useMemo(() => {
    if (!selectedRegion) return false
    const meshId = DATA_REGION_TO_MESH.get(selectedRegion)
    return meshId === region.id
  }, [selectedRegion, region.id])

  const isHovered = useMemo(() => {
    if (!hoveredRegion) return false
    const meshId = DATA_REGION_TO_MESH.get(hoveredRegion)
    return meshId === region.id
  }, [hoveredRegion, region.id])

  const isDimmed = selectedRegion !== null && !isSelected

  // Capture original material colors once created
  useMemo(() => {
    originalColor.current.copy(material.color)
    originalEmissive.current.copy(material.emissive)
  }, [material])

  // Smooth scale animation
  const targetScale = useRef(new THREE.Vector3(...region.scale))
  const currentScale = useRef(new THREE.Vector3(...region.scale))

  useFrame(() => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial

    // Opacity — respects brainOpacity from store (e.g. 0.35 in connectivity mode)
    const baseOpacity = brainOpacity
    const targetOpacity = isDimmed ? Math.min(0.4, baseOpacity) : baseOpacity
    mat.opacity += (targetOpacity - mat.opacity) * 0.08

    // Emissive
    const targetEmissive = isHovered ? 0.15 : isSelected ? 0.2 : 0.02
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.1

    // Scale on hover
    const sc = isHovered ? 1.02 : 1.0
    targetScale.current.set(region.scale[0] * sc, region.scale[1] * sc, region.scale[2] * sc)
    currentScale.current.lerp(targetScale.current, 0.1)
    meshRef.current.scale.copy(currentScale.current)

    // Activity overlay: blend color when heatmap layer is active
    if (activityColors.active) {
      // Find highest activation among covered region IDs
      let maxActivation = 0.05
      let maxColor: THREE.Color | null = null
      for (const rid of region.regionIds) {
        const brIdx = BRAIN_REGIONS.findIndex(r => r.id === rid)
        if (brIdx >= 0 && activityColors.colors[brIdx]) {
          const act = activityColors.activations[brIdx]?.currentActivation ?? 0.05
          if (act > maxActivation) {
            maxActivation = act
            maxColor = activityColors.colors[brIdx]
          }
        }
      }
      if (maxColor) {
        mat.color.lerp(maxColor, 0.06)
        mat.emissive.lerp(maxColor, 0.06)
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity, maxActivation * 0.5)
      }
    } else {
      mat.color.lerp(originalColor.current, 0.04)
      mat.emissive.lerp(originalEmissive.current, 0.04)
    }
  })

  // Find the first data region this mesh covers, for click/hover mapping
  const primaryRegionId = region.regionIds[0] ?? region.id

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      useBrainStore.getState().setHoveredRegion(primaryRegionId)
      document.body.style.cursor = 'pointer'
    },
    [primaryRegionId],
  )

  const handlePointerOut = useCallback(() => {
    useBrainStore.getState().setHoveredRegion(null)
    document.body.style.cursor = 'auto'
  }, [])

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      const store = useBrainStore.getState()
      store.selectRegion(store.selectedRegion === primaryRegionId ? null : primaryRegionId)
    },
    [primaryRegionId],
  )

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={region.position}
      scale={region.scale}
      rotation={region.rotation}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  )
}

// ============================================================
// Main BrainModel with breathing animation
// ============================================================
export default function BrainModel() {
  const groupRef = useRef<THREE.Group>(null)

  // Slow gentle rotation + breathing scale oscillation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06

      // Breathing: scale cycles 1.0 -> 1.008 with 6-second period
      const breathe = 1.0 + Math.sin(state.clock.elapsedTime * (Math.PI * 2.0 / 6.0)) * 0.004
      groupRef.current.scale.setScalar(breathe)
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.15, 0]}>
      {ANATOMICAL_REGIONS.map((region) => (
        <RegionMesh key={region.id} region={region} />
      ))}
    </group>
  )
}

// Export for use in RegionLabels and other components
export { ANATOMICAL_REGIONS, DATA_REGION_TO_MESH }
