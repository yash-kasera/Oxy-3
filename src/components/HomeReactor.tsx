import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Tube } from '@react-three/drei';
import { ComponentLabel } from './ComponentLabel';

export function HomeReactor({ algaeHealth = 1.0, algaeDensity = 0.0 }: { algaeHealth?: number; algaeDensity?: number }) {
  const spiralMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

  // Pale, watery green (Young)
  const youngColor = useMemo(() => new THREE.Color("#88ffaa"), []);
  const youngEmissive = useMemo(() => new THREE.Color("#118833"), []);
  
  // Bright, vibrant neon green (Peak)
  const peakColor = useMemo(() => new THREE.Color("#00ff22"), []);
  const peakEmissive = useMemo(() => new THREE.Color("#00ff33"), []);

  // Dark sludgy green (Dead)
  const deadColor = useMemo(() => new THREE.Color("#224411"), []);
  const deadEmissive = useMemo(() => new THREE.Color("#051100"), []);

  useFrame((state) => {
    if (spiralMatRef.current) {
      const t = state.clock.elapsedTime * 2.0;

      const currentColor = new THREE.Color().lerpColors(youngColor, peakColor, algaeDensity);
      currentColor.lerp(deadColor, 1.0 - algaeHealth);
      
      const currentEmissive = new THREE.Color().lerpColors(youngEmissive, peakEmissive, algaeDensity);
      currentEmissive.lerp(deadEmissive, 1.0 - algaeHealth);
      
      spiralMatRef.current.color.copy(currentColor);
      spiralMatRef.current.emissive.copy(currentEmissive);
      
      const baseIntensity = 0.5 + (algaeDensity * 1.5); // Spiral glows brighter than fluid
      spiralMatRef.current.emissiveIntensity = (baseIntensity + Math.sin(t) * 0.3) * algaeHealth;
      spiralMatRef.current.opacity = 0.4 + (algaeDensity * 0.4) + ((1.0 - algaeHealth) * 0.2);
    }
  });

  // Create the 3D curve for the O2-Genesis Spiral
  const spiralCurve = useMemo(() => {
    class SpiralCurve extends THREE.Curve<THREE.Vector3> {
      constructor() {
        super();
      }
      getPoint(t: number, optionalTarget = new THREE.Vector3()) {
        const radius = 1.2;
        const height = 4.5;
        const turns = 3;
        const x = Math.cos(t * Math.PI * 2 * turns) * radius;
        const z = Math.sin(t * Math.PI * 2 * turns) * radius;
        const y = (t - 0.5) * height; // Center vertically
        return optionalTarget.set(x, y, z);
      }
    }
    return new SpiralCurve();
  }, []);

  return (
    <group position={[0, 1.5, 0]}>
      {/* High-Strength Borosilicate Glass Cylinder */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[2.4, 2.4, 5.0, 64]} />
        <meshPhysicalMaterial 
          color="#aaffaa" // Slightly green-tinted fluid inside
          metalness={0.1}
          roughness={0.0}
          transmission={0.95}
          thickness={0.5}
          ior={1.33}
          transparent
          opacity={0.6 + (algaeDensity * 0.3)} // Fluid gets greener/denser
        />
        <ComponentLabel text="HIGH-STRENGTH BOROSILICATE GLASS" position={[-3.0, 1.5, 0]} />
      </mesh>

      {/* O2-Genesis Spiral */}
      <Tube args={[spiralCurve, 100, 0.2, 16, false]}>
        <meshPhysicalMaterial 
          ref={spiralMatRef}
          color="#00ff22" 
          emissive="#00ff33"
          roughness={0.2}
          clearcoat={1.0}
          transparent
          opacity={0.8}
        />
      </Tube>
      <ComponentLabel text="O2-GENESIS SPIRAL" position={[3.0, 0, 0]} />

      {/* Biosynthesis Grow Lights & Top Cap */}
      <group position={[0, 2.6, 0]}>
        <mesh>
          <cylinderGeometry args={[2.5, 2.5, 0.4, 64]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.2} metalness={0.1} />
        </mesh>
        
        {/* Glowing underside lights pointing down into tank */}
        <mesh position={[0, -0.21, 0]}>
          <cylinderGeometry args={[2.3, 2.3, 0.05, 64]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.0} />
        </mesh>
        <ComponentLabel text="BIOSYNTHESIS GROW LIGHTS" position={[3.0, 0, 0]} />

        {/* Purified Air Output port */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[1.0, 1.0, 0.1, 32]} />
          <meshStandardMaterial color="#cccccc" roughness={0.5} />
        </mesh>
        <ComponentLabel text="OXYGENATED & PURIFIED AIR OUTPUT" position={[1.5, 1.0, 0]} />
      </group>

      {/* Side-Mounted Household Air Intake Moss */}
      <group position={[2.45, -1.0, 0]}>
        {/* Moss Attachment Housing */}
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.6, 2.0, 1.5]} />
          <meshStandardMaterial color="#eeeeee" />
        </mesh>
        {/* Actual Moss */}
        <mesh position={[0.55, 0, 0]}>
          <boxGeometry args={[0.2, 1.8, 1.3]} />
          <meshStandardMaterial color="#2e5c1d" roughness={0.9} />
        </mesh>
        <ComponentLabel text="HOUSEHOLD AIR INTAKE" position={[1.5, 0, 0]} />
      </group>

    </group>
  );
}
