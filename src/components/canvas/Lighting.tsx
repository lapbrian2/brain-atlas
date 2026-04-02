export default function Lighting() {
  return (
    <>
      {/* Very dim ambient — scene is self-illuminated via emissive + bloom */}
      <ambientLight intensity={0.05} color="#C0D8FF" />

      {/* Single dim directional for slight depth hint */}
      <directionalLight
        position={[3, 4, 2]}
        intensity={0.08}
        color="#E0E8FF"
      />
    </>
  )
}
