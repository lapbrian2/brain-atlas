export default function Lighting() {
  return (
    <>
      {/* Hemisphere light — warm from above, cool from below
          Mimics ambient light in a medical/dissection setting
          and reveals surface detail in gyri and sulci */}
      <hemisphereLight
        args={['#FFF5E8', '#C0D0E8', 0.35]}
      />

      {/* Key light — strong from above-right, slightly warm for tissue realism */}
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.4}
        color="#FFF8F0"
        castShadow
      />

      {/* Subtle rim light from below-left, cool blue */}
      <pointLight
        position={[-3, -2, 2]}
        intensity={0.2}
        color="#6088B0"
        decay={2}
        distance={10}
      />

      {/* Very faint back fill to keep the rear from going pure black */}
      <directionalLight
        position={[-2, 1, -4]}
        intensity={0.08}
        color="#A0B0C0"
      />

      {/* Interior point light — creates translucent tissue glow
          Positioned at the brain center, warm and very subtle */}
      <pointLight
        position={[0, 0.1, 0]}
        intensity={0.1}
        color="#FFE0D0"
        decay={2}
        distance={3}
      />
    </>
  )
}
