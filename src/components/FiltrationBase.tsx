import React from 'react';
import { RoundedBox } from '@react-three/drei';
import { ComponentLabel } from './ComponentLabel';

export function FiltrationBase() {
  return (
    <group position={[0, -2.5, 0]}>
      {/* The bottom cutout section to match the image, housing distinct filter blocks. */}
      {/* Positioned on the front right below the glass. */}

      {/* Main Base Grating / Ground connection */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4.2, 0.2, 3.2]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
        <ComponentLabel text="Main Base Intake" position={[0, 0, 1.8]} />
      </mesh>

      {/* UV-C Photo-catalytic Stage (Bottom Layer) */}
      <group position={[0.5, 0.3, 1.0]}>
        <RoundedBox args={[2.0, 0.3, 1.2]} radius={0.05} material-color="#1a1a1a" />
        {/* Glowing UV Bars */}
        {[-0.8, 0, 0.8].map((x, i) => (
          <mesh key={i} position={[x, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 1.0, 8]} />
            <meshStandardMaterial color="#55aaff" emissive="#3388ff" emissiveIntensity={2.0} />
          </mesh>
        ))}
        <ComponentLabel text="UV-C Stage" position={[1.2, 0.2, 0]} />
      </group>

      {/* HEPA Filter Block (Stacked above UV-C) */}
      {/* Pleated white look */}
      <mesh position={[0.8, 0.9, 0.6]}>
        <boxGeometry args={[1.4, 0.8, 0.4]} />
        <meshStandardMaterial color="#ffffff" roughness={1.0} />
        <ComponentLabel text="HEPA Filter" position={[1.4, 0, 0]} />
      </mesh>
      
      {/* Activated Carbon Filter Block */}
      {/* Dark sponge look */}
      <mesh position={[0.8, 0.9, 1.0]}>
        <boxGeometry args={[1.4, 0.8, 0.3]} />
        <meshStandardMaterial color="#222222" roughness={0.8} />
        <ComponentLabel text="Carbon Filter" position={[1.4, 0, 0]} />
      </mesh>

      {/* Pre-Filter Layer */}
      {/* Light green porous look */}
      <mesh position={[0.8, 0.9, 1.4]}>
        <boxGeometry args={[1.4, 0.8, 0.2]} />
        <meshStandardMaterial color="#7a9e6a" roughness={0.9} />
        <ComponentLabel text="Pre-Filter" position={[1.4, 0, 0]} />
      </mesh>

    </group>
  );
}
