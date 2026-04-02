export default function Lighting() {
  return (
    <>
      {/* Almost no ambient -- brain emerges from darkness */}
      <ambientLight intensity={0.05} color="#D8D0E0" />

      {/* Key light -- strong from above-right, warm-neutral */}
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.5}
        color="#F0E8E0"
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
    </>
  )
}
