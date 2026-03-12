import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function AirParticles({ flowSpeed, co2Ppm }: { flowSpeed: number, co2Ppm: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Scale particle count linearly based on CO2 intensity
  const PARTICLE_COUNT = Math.floor(2000 + (co2Ppm / 1500) * 3000); // 2k to 5k particles
  const MAX_LIFETIME = 4.0;

  // Generate initial attributes: position, random seed, and age.
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFlowSpeed: { value: flowSpeed },
    uMaxLifetime: { value: MAX_LIFETIME }
  }), [flowSpeed]);

  const { positions, randoms, ages } = useMemo(() => {
    const p = new Float32Array(PARTICLE_COUNT * 3);
    const r = new Float32Array(PARTICLE_COUNT * 3);
    const a = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Initialize with random spawn values
      // We'll compute the actual starting positions in the vertex shader based on age=0
      p[i * 3] = 0;
      p[i * 3 + 1] = 0;
      p[i * 3 + 2] = 0;
      
      // r holds 3 random floats [0..1] per particle for path variance
      r[i * 3] = Math.random();
      r[i * 3 + 1] = Math.random();
      r[i * 3 + 2] = Math.random();

      // Stagger initial ages so they don't all spawn at once
      a[i] = Math.random() * MAX_LIFETIME;
    }

    return { positions: p, randoms: r, ages: a };
  }, [PARTICLE_COUNT]);

  const particleShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        attribute vec3 randoms;
        attribute float ages;
        
        uniform float uTime;
        uniform float uFlowSpeed;
        uniform float uMaxLifetime;

        varying float vAgeRatio;
        varying vec3 vColorPhase;

        // Easing functions
        float easeInOutQuad(float t) {
            return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t;
        }

        void main() {
          // Calculate current age of this specific particle looping over its lifetime
          float currentAge = mod(ages + uTime * uFlowSpeed, uMaxLifetime);
          float t = currentAge / uMaxLifetime; // normalized 0.0 to 1.0 (start to finish)
          vAgeRatio = t;

          // Route 1: Through the Moss Carpet (Front-Left)
          // Route 2: Through the Bottom Grille Intake (Center-Right)
          float route = step(0.5, randoms.z); // 50% chance of either route

          vec3 startPos;
          vec3 midPos;
          vec3 endPos;

          // --- DEFINE THE PATHWAY ---
          vec3 startPos;
          vec3 midPos1; // Entry into vents
          vec3 midPos2; // Ascending through Algae tank
          vec3 endPos;

          if (route == 0.0) {
              // Route 0: Sucked through FRONT Base Vents
              // Spawn outside front
              startPos = vec3((randoms.x - 0.5) * 6.0, -2.0 + (randoms.y * 1.5), 3.0 + randoms.z * 3.0);
              // Midpoint 1: Funneling tightly into the front base louvers
              midPos1 = vec3((randoms.x - 0.5) * 2.8, -0.6, 1.7);
          } else {
              // Route 1: Sucked through BACK Base Vents
              // Spawn outside back
              startPos = vec3((randoms.x - 0.5) * 6.0, -2.0 + (randoms.y * 1.5), -3.0 - randoms.z * 3.0);
              // Midpoint 1: Funneling tightly into the back base louvers
              midPos1 = vec3((randoms.x - 0.5) * 2.8, -0.6, -1.7);
          }

          // Midpoint 2: Surging and spreading freely inside the specifically narrowed Algae Tank volume (y=1.0 to y=6.0)
          midPos2 = vec3(-0.6 + (randoms.x - 0.5) * 2.6, 1.0 + randoms.y * 5.0, (randoms.z - 0.5) * 2.2);

          // Both routes exit through the top-right Oxygen Vent
          endPos = vec3(1.6, 6.5, 1.6); // Slightly protruding from the vent hole

          // --- INTERPOLATE POSITION ALONG PATH ---
          // Using a Cubic Bezier curve interpolation: 
          // pos = (1-t)^3 * start + 3(1-t)^2 * t * mid1 + 3(1-t) * t^2 * mid2 + t^3 * end
          
          float u = 1.0 - t;
          float uu = u * u;
          float uuu = uu * u;
          float tt = t * t;
          float ttt = tt * t;

          vec3 currentPos = (uuu * startPos) + (3.0 * uu * t * midPos1) + (3.0 * u * tt * midPos2) + (ttt * endPos);

          // Add a little turbulent noise based on randoms to make them look like chaotic air
          currentPos.x += sin(uTime * 5.0 + randoms.x * 10.0) * 0.1;
          currentPos.y += cos(uTime * 4.0 + randoms.y * 10.0) * 0.1;
          currentPos.z += sin(uTime * 6.0 + randoms.z * 10.0) * 0.1;

          // Pass info to fragment for coloring
          vColorPhase = vec3(1.0); // unused for now, color done purely on 't'

          // Standard projection mapping
          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size fades in at start, grows in middle, shrinks at end
          gl_PointSize = (10.0 * (1.0 - abs(t - 0.5) * 2.0)) * (10.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying float vAgeRatio;

        void main() {
          // Circular particle shape
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          // Inner glow calculation
          float alpha = 1.0 - (dist * 2.0);

          // Color Gradient based on lifetime (from intake to output)
          // Start: Polluted Grey/Blue -> Middle: Filtering Green -> End: Pure Neon Green O2
          vec3 colorStart = vec3(0.2, 0.25, 0.3);
          vec3 colorMid   = vec3(0.1, 0.6, 0.2);
          vec3 colorEnd   = vec3(0.0, 1.0, 0.2);

          vec3 finalColor;
          if (vAgeRatio < 0.5) {
              finalColor = mix(colorStart, colorMid, vAgeRatio * 2.0);
          } else {
              finalColor = mix(colorMid, colorEnd, (vAgeRatio - 0.5) * 2.0);
          }

          // Fade opacity at the extreme birth/death
          float fade = smoothstep(0.0, 0.1, vAgeRatio) * smoothstep(1.0, 0.9, vAgeRatio);

          gl_FragColor = vec4(finalColor, alpha * fade * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, [uniforms]);

  useFrame((state) => {
    if (particleShader) {
      particleShader.uniforms.uTime.value = state.clock.elapsedTime;
      particleShader.uniforms.uFlowSpeed.value = flowSpeed;
    }
  });

  return (
    <group position={[0, 4, 0]}> {/* Root offset */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-randoms" count={PARTICLE_COUNT} array={randoms} itemSize={3} />
          <bufferAttribute attach="attributes-ages" count={PARTICLE_COUNT} array={ages} itemSize={1} />
        </bufferGeometry>
        <primitive object={particleShader} attach="material" />
      </points>
    </group>
  );
}
