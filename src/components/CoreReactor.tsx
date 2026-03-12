import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CoreReactor({ theme }: { theme: 'light' | 'dark' }) {
  const liquidMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state) => {
    if (liquidMaterialRef.current) {
      // Simulate liquid motion / bubbling algae
      const t = state.clock.elapsedTime * 0.5;
      liquidMaterialRef.current.emissiveIntensity = 0.5 + Math.sin(t) * 0.2;
    }
  });

  return (
    <group position={[-1, 5.5, 0.75]}>
      {/* Microalgae Tank bounding box on the front-left */}
      <mesh>
        <boxGeometry args={[1.9, 4.9, 1.4]} />
        <meshPhysicalMaterial 
          ref={liquidMaterialRef}
          color="#00ff66" 
          emissive="#004411"
          transmission={0.9} 
          roughness={0.1}
          thickness={1.5}
          ior={1.33}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}
