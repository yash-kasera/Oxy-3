import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function AirWaves({ flowSpeed, co2Ppm }: { flowSpeed: number, co2Ppm: number }) {
  const waveShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFlowSpeed: { value: flowSpeed },
        uCo2Ppm: { value: co2Ppm }
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
        uniform float uTime;
        uniform float uFlowSpeed;
        uniform float uCo2Ppm;

        void main() {
          float speed = uTime * uFlowSpeed * 2.0;

          // Create multiple overlapping sine waves for a fluid flow effect
          float wave1 = sin(vUv.x * 12.0 + speed + vUv.y * 15.0);
          float wave2 = sin(vUv.x * 20.0 - speed * 1.5 + vUv.y * 25.0);
          float wave3 = sin(vUv.x * 8.0 + speed * 0.8 + vUv.y * 5.0);

          float combinedWave = (wave1 + wave2 + wave3) / 3.0;
          // Map to 0..1
          combinedWave = combinedWave * 0.5 + 0.5;

          // Sharpness of the waves
          float bands = smoothstep(0.4, 0.6, combinedWave);

          // Color transition: Bottom (Grey/Intake) -> Top (Green/O2)
          vec3 intakeColor = vec3(0.3, 0.3, 0.3);
          vec3 pureO2Color = vec3(0.0, 1.0, 0.2);
          
          vec3 finalColor = mix(intakeColor, pureO2Color, vUv.y);

          // Fade at edges
          float edgeFade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
          edgeFade *= smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);

          gl_FragColor = vec4(finalColor, bands * edgeFade * 0.6);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
  }, []);

  useFrame((state) => {
    if (waveShader) {
      waveShader.uniforms.uTime.value = state.clock.elapsedTime;
      waveShader.uniforms.uFlowSpeed.value = flowSpeed;
      waveShader.uniforms.uCo2Ppm.value = co2Ppm;
    }
  });

  return (
    <group position={[0.4, 4.0, 0.2]}>
      {/* Multiply the planes to give a volumetric wave feel inside the Oxy-3 */}
      <mesh material={waveShader} position={[0, 0, 0]}>
        <planeGeometry args={[2.5, 7.8, 32, 32]} />
      </mesh>
      <mesh material={waveShader} position={[0, 0, -0.4]}>
        <planeGeometry args={[2.5, 7.8, 32, 32]} />
      </mesh>
      <mesh material={waveShader} position={[0, 0, 0.4]}>
        <planeGeometry args={[2.5, 7.8, 32, 32]} />
      </mesh>
    </group>
  );
}
