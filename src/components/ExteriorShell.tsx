import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { ComponentLabel } from './ComponentLabel';

export function ExteriorShell({ opacity }: { opacity: number }) {
  // Enhanced Procedural Moss Shader
  const mossShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 1.0 } // Moss is always opaque
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float uOpacity;
        
        // Simplex/Perlin noise helper
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
          float noise1 = random(vUv * 15.0);
          float noise2 = random(vUv * 50.0);
          vec3 baseGreen = vec3(0.2, 0.5, 0.1);
          vec3 darkGreen = vec3(0.05, 0.25, 0.05);
          vec3 highlight = vec3(0.4, 0.7, 0.2);
          
          vec3 color = mix(darkGreen, baseGreen, noise1);
          color = mix(color, highlight, noise2 * 0.3);
          gl_FragColor = vec4(color, uOpacity);
        }
      `,
      transparent: false,
    });
  }, []);

  const chassisMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#d0d4d8', 
    metalness: 0.8, 
    roughness: 0.2 
  }), []);

  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.2,      // Low opacity for pure see-through window
    metalness: 0.1,    // Slight reflection
    roughness: 0.05,
    clearcoat: 1.0,    // High gloss
    clearcoatRoughness: 0.1,
  }), []);

  // Define the custom 2D contour for the front moss face to perfectly wrap the diagonal glass
  const mossExtrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
  const mossShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Start top left
    shape.moveTo(-1.0, 2.7);
    // Move top right
    shape.lineTo(1.0, 2.7);
    // Diagonal slope down to middle left (stops precisely at the solid chassis floor)
    shape.lineTo(-0.2, -2.9);
    // Bottom left corner
    shape.lineTo(-1.0, -2.9);
    shape.closePath();
    return shape;
  }, []);

  return (
    <group position={[0, 4, 0]}>
      {/* --- Premium Chassis Elements --- */}
      
      {/* Roof Slab */}
      <RoundedBox args={[4.4, 0.4, 3.4]} position={[0, 3.8, 0]} radius={0.15} smoothness={4} material={chassisMat} />
      
      {/* Solar Panels on Roof */}
      <mesh position={[-1.0, 4.1, 0.5]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[1.8, 0.05, 2]} />
        <meshStandardMaterial color="#0a1a3a" metalness={0.9} roughness={0.1} />
        {/* Simple grid lines for solar cells */}
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
      </mesh>
      <mesh position={[1.0, 4.1, -0.5]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[1.8, 0.05, 2]} />
        <meshStandardMaterial color="#0a1a3a" metalness={0.9} roughness={0.1} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Right Wall Pillar (Housing the vents and display) */}
      <RoundedBox args={[1.0, 7.2, 3.0]} position={[1.5, 0, 0.1]} radius={0.15} smoothness={4} material={chassisMat} />
      
      {/* (Removed solid left-side chassis pillars so Algae Tank can sit right behind the Moss) */}

      {/* Front Moss Face - Custom Diagonal Shape (Positioned above chassis floor) */}
      <mesh position={[-1.2, 0.9, 1.48]}>
        <extrudeGeometry args={[mossShape, mossExtrudeSettings]} />
        <primitive object={mossShader} attach="material" />
        <ComponentLabel text="Moss Bio-Adsorption (Carpet)" position={[0, -2.0, 0.5]} />
      </mesh>
      
      {/* Outer Left Moss Face (Now spans only the Algae tank height) */}
      <RoundedBox args={[0.15, 5.6, 2.8]} position={[-2.25, 0.9, 0.0]} radius={0.05} smoothness={4} material={mossShader} />

      {/* --- Encapsulating Front Glass Window (Covers the full inner machine) --- */}
      {/* Spans the gap over both the Algae Tank and the Filter Chamber */}
      <RoundedBox args={[3.2, 7.4, 0.1]} position={[-0.6, -0.1, 1.4]} radius={0.05} smoothness={2} material={glassMat} />
      {/* Side glass acting as inner wall */}
      <RoundedBox args={[0.1, 7.4, 2.8]} position={[-2.2, -0.1, 0]} radius={0.05} smoothness={2} material={glassMat} />
      {/* Back glass for sunlight penetration */}
      <RoundedBox args={[3.2, 7.4, 0.1]} position={[-0.6, -0.1, -1.4]} radius={0.05} smoothness={2} material={glassMat} />

      {/* --- UI & Output Cutouts on Right Wall --- */}
      {/* LED Display Screen */}
      <mesh position={[1.5, 0.5, 1.62]}>
        <planeGeometry args={[0.8, 1.4]} />
        <meshBasicMaterial color="#050505" />
      </mesh>
      <mesh position={[1.5, 0.5, 1.63]}>
        <planeGeometry args={[0.7, 1.3]} />
        <meshStandardMaterial color="#00ff66" emissive="#00ff66" emissiveIntensity={0.8} wireframe transparent opacity={opacity} />
      </mesh>

      {/* Oxygen Output Ring (Front Face of Right Pillar) */}
      <mesh position={[1.5, 2.8, 1.61]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.3, 0.08, 16, 32]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
        <ComponentLabel text="Oxygenated Air Output" position={[0, -0.6, 0.2]} />
      </mesh>
      <mesh position={[1.5, 2.8, 1.60]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
      </mesh>

      {/* (Intake Ring removed, now officially located on the FiltrationBase louvers) */}

    </group>
  );
}
