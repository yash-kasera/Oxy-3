import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { ComponentLabel } from './ComponentLabel';

export function CoreReactor({ algaeHealth = 1.0, algaeDensity = 0.0 }: { algaeHealth?: number; algaeDensity?: number }) {
  const tankMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

  // Pale, watery green
  const youngColor = useMemo(() => new THREE.Color("#88ffaa"), []);
  const youngEmissive = useMemo(() => new THREE.Color("#118833"), []);
  
  // Bright, vibrant glowing neon green
  const peakColor = useMemo(() => new THREE.Color("#00ff22"), []);
  const peakEmissive = useMemo(() => new THREE.Color("#00ff33"), []);

  // Dead/Sludge
  const deadColor = useMemo(() => new THREE.Color("#224411"), []);
  const deadEmissive = useMemo(() => new THREE.Color("#051100"), []);

  useFrame((state) => {
    if (tankMatRef.current) {
      const t = state.clock.elapsedTime * 2.0;
      
      const currentColor = new THREE.Color().lerpColors(youngColor, peakColor, algaeDensity);
      currentColor.lerp(deadColor, 1.0 - algaeHealth);
      
      const currentEmissive = new THREE.Color().lerpColors(youngEmissive, peakEmissive, algaeDensity);
      currentEmissive.lerp(deadEmissive, 1.0 - algaeHealth);
      
      tankMatRef.current.color.copy(currentColor);
      tankMatRef.current.emissive.copy(currentEmissive);
      
      // Emissive intensity grows with density, but dies rapidly with health
      const baseIntensity = 0.5 + (algaeDensity * 0.8);
      tankMatRef.current.emissiveIntensity = (baseIntensity + Math.sin(t) * 0.3) * algaeHealth;

      // Opacity starts low (clear), gets very dense as it grows, and totally opaque as it dies
      tankMatRef.current.opacity = 0.1 + (algaeDensity * 0.6) + ((1.0 - algaeHealth) * 0.2);
    }
  });

  return (
    <group position={[-0.6, 4.2, 0.0]}>
      {/* The Glowing Cuboidal Algae Tank, vastly expanded but cut off cleanly above the filter chamber floor */}
      <RoundedBox args={[3.0, 5.6, 2.6]} radius={0.1} smoothness={4}>
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
      
      {/* Bubbling effect: tiny glowing spheres rising within out across the vast cuboidal tank */}
      {Array.from({ length: 300 }).map((_, i) => (
        <Bubble key={i} index={i} width={2.8} height={5.4} depth={2.4} />
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
