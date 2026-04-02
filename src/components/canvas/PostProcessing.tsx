import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { ToneMappingMode, BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'

const chromaticOffset = new Vector2(0.002, 0.002)

export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.5}
        mipmapBlur
      />
      <ChromaticAberration
        offset={chromaticOffset}
        radialModulation={true}
        modulationOffset={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette offset={0.15} darkness={0.9} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
