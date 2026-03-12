import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ComponentLabel } from './ComponentLabel';

export function CoreReactor() {
  const spiralMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

  // Generate the Spiral Algae Tube Geometry
  const spiralParams = useMemo(() => {
    const points = [];
    const height = 6.0;
    const turns = 6;
    const radius = 0.8;
    
    // Create the helical path
    for (let i = 0; i <= 200; i++) {
        const t = i / 200;
        const angle = t * Math.PI * 2 * turns;
        const y = (t * height) - (height / 2); // Center around 0
        points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return { curve };
  }, []);

  useFrame((state) => {
    if (spiralMatRef.current) {
      // Pulse the emissive intensity to simulate biological glowing
      const t = state.clock.elapsedTime * 2.0;
      spiralMatRef.current.emissiveIntensity = 0.8 + Math.sin(t) * 0.3;
    }
  });

  return (
    <group position={[0.4, 4.0, 0.2]}>
      {/* The Glowing Algae Spiral */}
      <mesh>
        <tubeGeometry args={[spiralParams.curve, 200, 0.15, 16, false]} />
        <meshPhysicalMaterial 
          ref={spiralMatRef}
          color="#11ff44" 
          emissive="#00aa22"
          transmission={0.8} 
          roughness={0.1}
          thickness={0.5}
          ior={1.2}
          transparent={true}
          opacity={0.9}
        />
        <ComponentLabel text="Microalgae Spiral Tube" position={[0.2, 0.5, 1.2]} />
      </mesh>

      {/* Central Support Core (Subtle glass column inside the spiral) */}
      <mesh>
        <cylinderGeometry args={[0.2, 0.2, 6.0, 16]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          transmission={1.0}
          roughness={0.0}
          ior={1.5}
          thickness={0.2}
          transparent={true}
          opacity={0.3}
        />
      </mesh>
      
      {/* Bubbling effect: tiny glowing spheres rising within */}
      {Array.from({ length: 40 }).map((_, i) => (
        <Bubble key={i} index={i} radius={0.8} height={6.0} />
      ))}
    </group>
  );
}

// Internal component for animated bubbles that rise through the spiral area
function Bubble({ index, radius, height }: { index: number, radius: number, height: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const speed = useMemo(() => 0.5 + Math.random() * 0.5, []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed + index;
      const progress = (t % height) / height; // 0 to 1
      
      // Follow roughly the same spiral path but slightly offset
      const angle = progress * Math.PI * 2 * 6 + initialOffset;
      const y = (progress * height) - (height / 2);
      
      meshRef.current.position.set(
        Math.cos(angle) * (radius * 0.9), 
        y, 
        Math.sin(angle) * (radius * 0.9)
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </mesh>
  );
}
