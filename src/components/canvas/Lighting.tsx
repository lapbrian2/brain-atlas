export default function Lighting() {
  return (
    <>
      {/* Near-zero ambient — scene is self-illuminated via emissive + bloom */}
      <ambientLight intensity={0.02} color="#0A1520" />

      {/* Single very dim directional from above with teal tint */}
      <directionalLight
        position={[2, 4, 1]}
        intensity={0.1}
        color="#0088AA"
      />
    </>
  )
}
