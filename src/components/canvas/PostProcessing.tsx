import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { ToneMappingMode, BlendFunction, Effect } from 'postprocessing'
import { Vector2, Uniform } from 'three'

const chromaticOffset = new Vector2(0.002, 0.002)

/**
 * Custom film grain effect for medical monitor / tech aesthetic.
 * Subtle noise overlay that shifts each frame.
 */
class FilmGrainEffect extends Effect {
  constructor() {
    super('FilmGrainEffect', /* glsl */ `
      uniform float time;

      // Simple hash for grain
      float grainHash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        float grain = grainHash(uv * 500.0 + time * 100.0) - 0.5;
        outputColor = inputColor + vec4(vec3(grain * 0.04), 0.0);
      }
    `, {
      uniforms: new Map([
        ['time', new Uniform(0.0)],
      ]),
    })
  }

  update(_renderer: unknown, _inputBuffer: unknown, deltaTime?: number) {
    const u = this.uniforms.get('time')
    if (u && deltaTime !== undefined) {
      u.value += deltaTime
    }
  }
}

function FilmGrain() {
  const effectRef = useRef<FilmGrainEffect>(null)

  const effect = useRef(new FilmGrainEffect()).current

  useFrame((_, delta) => {
    effect.update(null, null, delta)
  })

  return <primitive ref={effectRef} object={effect} />
}

export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <ChromaticAberration
        offset={chromaticOffset}
        radialModulation={true}
        modulationOffset={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette offset={0.2} darkness={0.85} />
      <FilmGrain />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
