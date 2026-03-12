import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';

export function ExteriorShell({ opacity }: { opacity: number }) {
  // Procedural Moss Shader
  const mossShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: opacity } // Syncs moss opacity with X-Ray View
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        
        // Simple noise function
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
          float noise = random(vUv * 20.0);
          vec3 baseGreen = vec3(0.1, 0.4, 0.1);
          vec3 darkGreen = vec3(0.05, 0.2, 0.05);
          
          vec3 color = mix(baseGreen, darkGreen, noise);
          gl_FragColor = vec4(color, uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, [opacity]);

  return (
    <group>
      {/* Structural Chassis Outline W=4, H=8, Z=3 */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[4, 8, 3]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.05 * opacity} roughness={0.2} metalness={0.1} />
        <Edges scale={1.0} threshold={15} color="#444" />
      </mesh>

      {/* Moss Carpet (Back Side spanning full width) */}
      <mesh position={[0, 5.5, -0.75]} material={mossShader}>
        <boxGeometry args={[3.8, 4.8, 1.3]} />
      </mesh>

      {/* Display Screen (Front Right) */}
      <mesh position={[1, 5, 1.51]}>
        <planeGeometry args={[1.2, 1.8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Emissive Text / Light on Display */}
      <mesh position={[1, 5, 1.52]}>
        <planeGeometry args={[1.0, 1.6]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} wireframe />
      </mesh>

      {/* Oxygen Output Ring (Front Right Top) */}
      <mesh position={[1, 7, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.05, 16, 32]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>
      {/* Emissive center for output */}
      <mesh position={[1, 7, 1.51]}>
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
