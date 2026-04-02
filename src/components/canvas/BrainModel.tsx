import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Procedural brain model using displaced sphere geometry.
 * Custom vertex shader adds sulci/gyri-like wrinkles via layered simplex noise.
 * Will be replaced by a real GLB model in a later milestone.
 */

const brainVertexShader = /* glsl */ `
  // Simplex-style noise helpers
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  void main() {
    vNormal = normalize(normalMatrix * normal);

    // Layered noise for sulci/gyri wrinkle pattern
    vec3 pos = position;
    float noiseVal = 0.0;
    noiseVal += snoise(pos * 3.0) * 0.08;   // large folds
    noiseVal += snoise(pos * 6.0) * 0.04;   // medium sulci
    noiseVal += snoise(pos * 12.0) * 0.02;  // fine detail
    noiseVal += snoise(pos * 24.0) * 0.008; // micro texture

    // Slightly flatten into an ellipsoid (brain is wider than tall)
    pos.y *= 0.85;
    pos.x *= 1.05;
    pos.z *= 0.95;

    // Apply displacement along normal
    vec3 displaced = pos + normal * noiseVal;
    vDisplacement = noiseVal;

    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const brainFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  void main() {
    // Base brain color -- warm pinkish gray
    vec3 baseColor = vec3(0.77, 0.66, 0.51); // #C4A882

    // Subtle color variation based on displacement (sulci are darker)
    vec3 sulciColor = vec3(0.55, 0.45, 0.38);
    float colorMix = smoothstep(-0.05, 0.06, vDisplacement);
    vec3 color = mix(sulciColor, baseColor, colorMix);

    // Simple lighting
    vec3 lightDir = normalize(vec3(5.0, 5.0, 5.0) - vWorldPosition);
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.25;

    // Fresnel rim glow
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
    vec3 rimColor = vec3(0.58, 0.72, 1.0); // cool blue rim

    vec3 finalColor = color * (ambient + diffuse * 0.75) + rimColor * fresnel * 0.3;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

export default function BrainModel() {
  const groupRef = useRef<THREE.Group>(null)

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(1, 64, 64)
  }, [])

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: brainVertexShader,
      fragmentShader: brainFragmentShader,
      side: THREE.FrontSide,
    })
  }, [])

  // Fissure geometry -- thin plane for the longitudinal fissure
  const fissureGeometry = useMemo(() => {
    return new THREE.BoxGeometry(0.012, 1.8, 2.0)
  }, [])

  const fissureMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#1a1020',
      transparent: true,
      opacity: 0.6,
    })
  }, [])

  // Subtle auto-rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {/* Main cortex */}
      <mesh geometry={geometry} material={shaderMaterial} />

      {/* Longitudinal fissure (midline split) */}
      <mesh
        geometry={fissureGeometry}
        material={fissureMaterial}
        position={[0, 0, 0]}
      />

      {/* Brainstem hint -- small elongated sphere below */}
      <mesh position={[0, -0.85, -0.15]} scale={[0.25, 0.4, 0.2]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color="#9E8B74"
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>

      {/* Cerebellum hint -- wider shape at back-bottom */}
      <mesh position={[0, -0.6, -0.45]} scale={[0.55, 0.3, 0.35]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial
          color="#B09A80"
          roughness={0.65}
          metalness={0.0}
        />
      </mesh>
    </group>
  )
}
