import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { ComponentLabel } from './ComponentLabel';

export function CoreReactor() {
  const tankMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state) => {
    if (tankMatRef.current) {
      // Pulse the emissive intensity to simulate biological glowing
      const t = state.clock.elapsedTime * 2.0;
      tankMatRef.current.emissiveIntensity = 0.8 + Math.sin(t) * 0.3;
    }
  });

  return (
    <group position={[0.2, 4.0, 0.4]}>
      {/* The Glowing Cuboidal Algae Tank */}
      <RoundedBox args={[1.8, 6.0, 1.8]} radius={0.1} smoothness={4}>
        <meshPhysicalMaterial 
          ref={tankMatRef}
          color="#11ff44" 
          emissive="#00bb33"
          roughness={0.2}
          metalness={0.1}
          clearcoat={1.0}
          transparent={true}
          opacity={0.3}
        />
        <ComponentLabel text="Microalgae Liquid Tank" position={[0, 0, 1.0]} />
      </RoundedBox>
      
      {/* Bubbling effect: tiny glowing spheres rising within the cuboidal tank */}
      {Array.from({ length: 150 }).map((_, i) => (
        <Bubble key={i} index={i} width={1.6} height={5.8} depth={1.6} />
      ))}
    </group>
  );
}

// Internal component for animated bubbles that rise through the tank volume
function Bubble({ index, width, height, depth }: { index: number, width: number, height: number, depth: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const speed = useMemo(() => 0.5 + Math.random() * 0.5, []);
  
  // Random static starting positions on X and Z
  const xOffset = useMemo(() => (Math.random() - 0.5) * width, [width]);
  const zOffset = useMemo(() => (Math.random() - 0.5) * depth, [depth]);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed + index;
      const progress = (t % height) / height; // 0 to 1
      
      const y = (progress * height) - (height / 2);
      
      meshRef.current.position.set(xOffset, y, zOffset);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </mesh>
  );
}
