import React from 'react';
import { RoundedBox } from '@react-three/drei';
import { ComponentLabel } from './ComponentLabel';

export function FiltrationBase() {
  return (
    <group position={[0, 4, 0]}>
      {/* Thick Main Base Housing / Ground connection */}
      <RoundedBox args={[4.4, 1.0, 3.4]} position={[0, -4.3, 0]} radius={0.15} smoothness={4}>
        <meshStandardMaterial color="#d0d4d8" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Visible Air Intake Vents (Front Face of the Base) */}
      {/* Created as thin dark inset grooves to look like functional louvers */}
      {[-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8].map((x, i) => (
        <mesh key={`front-vent-${i}`} position={[x, -4.3, 1.70]}>
          <boxGeometry args={[0.2, 0.6, 0.05]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      ))}
      {/* Visible Air Intake Vents (Back Face of the Base) */}
      {[-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8].map((x, i) => (
        <mesh key={`back-vent-${i}`} position={[x, -4.3, -1.70]}>
          <boxGeometry args={[0.2, 0.6, 0.05]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      ))}
      {/* Visible Air Intake Vents (Left Face of the Base) */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((z, i) => (
        <mesh key={`left-vent-${i}`} position={[-2.20, -4.3, z]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.2, 0.6, 0.05]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      ))}
      {/* Visible Air Intake Vents (Right Face of the Base) */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((z, i) => (
        <mesh key={`right-vent-${i}`} position={[2.20, -4.3, z]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.2, 0.6, 0.05]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      ))}
      <ComponentLabel text="Main Base Intake Vents" position={[0, -4.3, 1.9]} />

      {/* Inner Chamber Separator Floor (Above Intakes) */}
      <mesh position={[-0.6, -4.0, 0]}>
        <boxGeometry args={[3.1, 0.1, 2.7]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.8} />
      </mesh>

      {/* Internal Filter Blocks - Centered inside the glass and shrunk to avoid Z-fighting */}
      <group position={[-0.6, -3.7, 0]}>
        
        {/* UV-C Photo-catalytic Stage (Bottom Layer) */}
        <group position={[0, -0.3, 0]}>
          <RoundedBox args={[3.0, 0.2, 2.6]} radius={0.05} material-color="#1a1a1a" />
          {/* Glowing UV Bars */}
          {[-1.0, 0, 1.0].map((x, i) => (
            <mesh key={i} position={[x, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
              <meshStandardMaterial color="#55aaff" emissive="#3388ff" emissiveIntensity={2.0} />
            </mesh>
          ))}
          <ComponentLabel text="UV-C Stage" position={[1.6, 0.1, 0]} />
        </group>

        {/* HEPA Filter Block (Stacked above UV-C with a gap) */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[3.0, 0.3, 2.6]} />
          <meshStandardMaterial color="#ffffff" roughness={1.0} />
          <ComponentLabel text="HEPA Filter" position={[1.6, 0, 0]} />
        </mesh>
        
        {/* Activated Carbon Filter Block */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[3.0, 0.3, 2.6]} />
          <meshStandardMaterial color="#222222" roughness={0.8} />
          <ComponentLabel text="Carbon Filter" position={[1.6, 0, 0]} />
        </mesh>

        {/* Pre-Filter Layer (Top Layer just below the tank floor) */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[3.0, 0.3, 2.6]} />
          <meshStandardMaterial color="#7a9e6a" roughness={0.9} />
          <ComponentLabel text="Pre-Filter" position={[1.6, 0, 0]} />
        </mesh>

      </group>
      
      {/* Ceiling Separator / Tank Floor (Above Filters) */}
      <mesh position={[-0.6, -2.0, 0]}>
        <boxGeometry args={[3.1, 0.1, 2.7]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.5} />
      </mesh>
    </group>
  );
}
