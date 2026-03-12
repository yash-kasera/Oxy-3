import React from 'react';

export function FiltrationBase({ theme }: { theme: 'light' | 'dark' }) {
  const metalColor = theme === 'light' ? '#888888' : '#222222';
  const filterColor = theme === 'light' ? '#f0f0f0' : '#444444';

  return (
    <group position={[0, 0, 0]}>
      {/* Air Intake Vent Grille at the very bottom */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[3.8, 0.2, 2.8]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>

      {/* 4 Vertical Filters */}
      {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 0]}>
          <boxGeometry args={[0.6, 2.6, 2]} />
          <meshStandardMaterial color={filterColor} roughness={1.0} />
        </mesh>
      ))}

      {/* Triangular Divider Roof over filters */}
      <mesh position={[-1, 2.9, 0]} rotation={[0, 0, 0.3]}>
         <boxGeometry args={[2.2, 0.1, 2.8]} />
         <meshPhysicalMaterial color={metalColor} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1, 2.9, 0]} rotation={[0, 0, -0.3]}>
         <boxGeometry args={[2.2, 0.1, 2.8]} />
         <meshPhysicalMaterial color={metalColor} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}
