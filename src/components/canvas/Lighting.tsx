export default function Lighting() {
  return (
    <>
      {/* Ambient fill */}
      <ambientLight intensity={0.15} color="#E8F0FF" />

      {/* Key light -- cool directional from top-right */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        color="#E8F0FF"
      />

      {/* Fill light -- softer blue from opposite side */}
      <directionalLight
        position={[-3, 2, -3]}
        intensity={0.4}
        color="#B0C4FF"
      />

      {/* Rim / accent from below */}
      <pointLight
        position={[0, -3, 3]}
        intensity={0.3}
        color="#94B8FF"
      />
    </>
  )
}
