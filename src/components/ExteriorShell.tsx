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

  return (
    <group position={[0, 4, 0]}>
      {/* --- Premium Chassis Elements --- */}
      {/* Base Slab */}
      <RoundedBox args={[4.4, 0.4, 3.4]} position={[0, -3.8, 0]} radius={0.15} smoothness={4} material={chassisMat} />
      
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
      
      {/* Left Back Wall Pillar - Moss Support */}
      <RoundedBox args={[1.2, 7.2, 1.0]} position={[-1.4, 0, -1.0]} radius={0.15} smoothness={4} material={chassisMat} />
      
      {/* Left Front Support Pillar (Substrate under Moss) */}
      <RoundedBox args={[2.0, 7.2, 2.0]} position={[-1.2, 0, 0.5]} radius={0.2} smoothness={4} material={chassisMat} />

      {/* The thin lush Moss Carpet covering the front and outer left side of the pillar */}
      {/* Front Moss Face */}
      <mesh position={[-1.2, 0, 1.51]}>
        <planeGeometry args={[1.8, 6.8]} />
        <meshBasicMaterial color="#000" transparent opacity={0.0} /> {/* Invisible collider/backer if needed */}
      </mesh>
      <RoundedBox args={[1.9, 7.0, 0.1]} position={[-1.2, 0, 1.55]} radius={0.05} smoothness={4} material={mossShader}>
        <ComponentLabel text="Moss Bio-Adsorption (Carpet)" position={[0, -2.5, 0.5]} />
      </RoundedBox>
      
      {/* Outer Left Moss Face */}
      <RoundedBox args={[0.1, 7.0, 1.9]} position={[-2.25, 0, 0.5]} radius={0.05} smoothness={4} material={mossShader} />

      {/* --- Encapsulating Front Glass Window --- */}
      {/* Spans the gap between Moss and the Right Wall */}
      <RoundedBox args={[2.2, 7.2, 0.1]} position={[0.4, 0, 1.4]} radius={0.05} smoothness={2} material={glassMat} />
      {/* Side glass to close the box if needed */}
      <RoundedBox args={[0.1, 7.2, 2.2]} position={[-0.2, 0, 0.3]} radius={0.05} smoothness={2} material={glassMat} />
      {/* Back glass for sunlight penetration */}
      <RoundedBox args={[2.2, 7.2, 0.1]} position={[0.4, 0, -1.4]} radius={0.05} smoothness={2} material={glassMat} />

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

      {/* Oxygen Output Ring (Top Right) */}
      <mesh position={[1.5, 2.5, 1.61]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.08, 16, 32]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
        <ComponentLabel text="Oxygenated Air Output" position={[0.5, 0, -1.0]} />
      </mesh>
      <mesh position={[1.5, 2.5, 1.62]}>
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
      </mesh>

      {/* Intake Ring (Bottom Right) */}
      <mesh position={[1.5, -2.5, 1.61]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.08, 16, 32]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
        <ComponentLabel text="Air Intake (Sides)" position={[0.5, 0, 1.0]} />
      </mesh>
      <mesh position={[1.5, -2.5, 1.62]}>
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.8} />
      </mesh>

    </group>
  );
}
