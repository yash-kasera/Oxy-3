import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function AirParticles({ flowSpeed, co2Ppm, algaeHealth = 1.0 }: { flowSpeed: number, co2Ppm: number, algaeHealth?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Scale particle count linearly based on CO2 intensity - Increased massively for hemispherical volume
  const PARTICLE_COUNT = Math.floor(15000 + (co2Ppm / 1500) * 30000); // 15k to 45k particles
  const MAX_LIFETIME = 12.0; // Needs to be longer to travel from outside the 20x bounds

  // Generate initial attributes: position, random seed, and age.
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFlowSpeed: { value: flowSpeed },
    uMaxLifetime: { value: MAX_LIFETIME },
    uAlgaeHealth: { value: algaeHealth }
  }), [flowSpeed, algaeHealth]);

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
        varying float vIsSuction;
        varying float vType;

        // Easing functions
        float easeInOutQuad(float t) {
            return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t;
        }

        void main() {
          // Calculate current age of this specific particle looping over its lifetime
          float currentAge = mod(ages + uTime * uFlowSpeed, uMaxLifetime);
          float t = currentAge / uMaxLifetime; // normalized 0.0 to 1.0 (start to finish)
          vAgeRatio = t;

          // Determine if this particle is part of the 20% that gets sucked into the machine
          // or the 80% that just drifts ambiently in the large hemisphere.
          float isSuction = step(0.8, randoms.x);
          vIsSuction = isSuction;

          // Assign particle type for semantic coloring: Dust, CO2, Rest
          vType = fract(randoms.z * 13.0);

          // --- DEFINE THE WAYPOINTS ON THE FLUID PATH ---
          // 1. Hemisphere Ambient Start (Radius 40 to 100 units around the machine)
          float r = 40.0 + randoms.y * 60.0;
          float theta = randoms.x * 6.28318; // 0 to 2PI
          float phi = randoms.z * 1.57079;   // 0 to PI/2 (only upper hemisphere)
          vec3 hemiPos = vec3(r * sin(phi) * cos(theta), r * cos(phi) - 4.5, r * sin(phi) * sin(theta));

          // 2. Moss Carpet Adsorption Target (Left or Front face)
          vec3 mossPos;
          if (randoms.z > 0.5) {
              // Target Front Moss Sheet
              mossPos = vec3(mix(-1.0, 1.0, randoms.x), mix(-2.7, 2.7, randoms.y), 1.6);
          } else {
              // Target Left Moss Sheet
              mossPos = vec3(-2.4, mix(-2.7, 2.7, randoms.y), mix(-1.4, 1.4, randoms.x));
          }

          // 3. Intake Vents (Slides down from moss surface into the bottom grille on all 4 sides)
          vec3 ventPos;
          if (randoms.x < 0.25) {
              ventPos = vec3(mix(-1.8, 1.8, randoms.y), -4.1, 1.8); // Front
          } else if (randoms.x < 0.5) {
              ventPos = vec3(mix(-1.8, 1.8, randoms.y), -4.1, -1.8); // Back
          } else if (randoms.x < 0.75) {
              ventPos = vec3(-2.2, -4.1, mix(-1.2, 1.2, randoms.y)); // Left
          } else {
              ventPos = vec3(2.2, -4.1, mix(-1.2, 1.2, randoms.y)); // Right
          }

          // 4. Filtration Chamber (Ascends through the dense solid base, pulled towards the front glass for visibility)
          vec3 filterPos = vec3(-0.6 + (randoms.x - 0.5) * 2.8, mix(-3.7, -2.0, randoms.y), 0.5 + (randoms.z - 0.5) * 1.4);

          // 5. Microalgae Liquid Tank (Circulates inside the green glowing tank, biased towards the front glass)
          vec3 tankPos = vec3(-0.6 + (randoms.x - 0.5) * 2.6, mix(1.0, 5.0, randoms.y), 0.5 + (randoms.z - 0.5) * 1.0);

          // 6. Output Vent Choke Point (Front Face of Right Pillar)
          // Stream pushes directly FORWARD (+Z) out from the flat glass face
          vec3 exitPos = vec3(1.5 + (randoms.y - 0.5) * 0.4, 2.8 + (randoms.z - 0.5) * 0.4, 1.6 + (randoms.x * 1.0));

          // 7. Ambient Diffusion (Pure oxygen blowing powerfully outwards and spreading)
          vec3 diffusePos = vec3(1.5 + sin(randoms.x * 6.28) * 15.0, 2.8 + cos(randoms.z * 6.28) * 15.0, 50.0 + randoms.y * 30.0);

          // --- PATH EVALUATION ---
          vec3 pos;
          if (isSuction == 1.0) {
              // Smooth aerodynamic Multi-segment Path using continuous hermite interpolation
              // Smoothstep already provides an S-curve easing which prevents sharp angles,
              // but we widen the transition zones to make the flow completely continuous and aerodynamic.
              pos = hemiPos;
              pos = mix(pos, mossPos, smoothstep(0.00, 0.20, t));  // Gentle drift towards moss
              pos = mix(pos, ventPos, smoothstep(0.15, 0.35, t));  // Smoothly slide down the moss into vents
              pos = mix(pos, filterPos, smoothstep(0.30, 0.50, t)); // Travel through filters
              pos = mix(pos, tankPos, smoothstep(0.45, 0.85, t));  // Swirl up the Core Reactor
              pos = mix(pos, exitPos, smoothstep(0.80, 0.92, t));  // Funnel into the exit port
              pos = mix(pos, diffusePos, smoothstep(0.90, 1.00, t)); // Blast out forwards into the room

              // Tight physics inside the machine boundaries, chaotic outside
              float turbulence = (t > 0.35 && t < 0.85) ? 0.05 : 0.8;
              pos.x += sin(uTime * 2.0 + randoms.y * 10.0) * turbulence;
              pos.y += cos(uTime * 2.5 + randoms.x * 10.0) * turbulence;
              pos.z += sin(uTime * 2.2 + randoms.z * 10.0) * turbulence;
          } else {
              // Just drift lazily in the ambient hemisphere (Normal background air)
              pos = hemiPos;
              // Very slow, massive drift
              pos.x += sin(uTime * 0.2 + randoms.y * 20.0) * 10.0 * t * 2.0;
              pos.y += cos(uTime * 0.15 + randoms.z * 20.0) * 5.0 * t * 2.0;
              pos.z += sin(uTime * 0.25 + randoms.x * 20.0) * 10.0 * t * 2.0;
          }

          // Standard projection mapping
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Dynamic sizing 
          float baseSize = 30.0;
          if (t < 0.25 || t > 0.92) baseSize = 80.0; // Larger blurriest dots far away
          gl_PointSize = baseSize * (1.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 12.0); // Keep them looking like tiny fine mist
        }
      `,
      fragmentShader: `
        uniform float uAlgaeHealth;
        varying float vAgeRatio;
        varying float vIsSuction;
        varying float vType;

        void main() {
          // Circular particle shape
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          // Inner glow calculation
          float alpha = 1.0 - (dist * 2.0);

          // Semantic Colors for Air Composition
          vec3 colorDust  = vec3(0.6, 0.4, 0.2);   // Brown Dust / Particulate matter
          vec3 colorCO2   = vec3(1.0, 0.2, 0.2);   // Red CO2
          vec3 colorO2    = vec3(0.0, 1.0, 0.2);   // Green Oxygen
          vec3 colorInert = vec3(0.8, 0.8, 0.8);   // White/Grey Inert Air (Nitrogen, mostly)
          
          vec3 finalColor;
          float particleAlpha = alpha;

          // Composition defined at particle birth
          if (vType < 0.15) {
              finalColor = colorDust; // 15% Dust visually
          } else if (vType < 0.30) {
              finalColor = colorCO2;  // 15% CO2 visually
          } else {
              finalColor = colorInert; // 70% normal white air
          }

          if (vIsSuction == 1.0) {
              if (vType < 0.15) {
                  // Dust gets completely trapped by HEPA filter (around t=0.45) and stops existing
                  particleAlpha *= (1.0 - smoothstep(0.35, 0.45, vAgeRatio));
              } else if (vType < 0.30) {
                  // CO2 gets completely converted to pure O2 in the Algae tank ONLY IF algae is healthy
                  // If algaeHealth is 0, conversion progress is forced to 0
                  float conversionProgress = clamp((vAgeRatio - 0.50) / 0.30, 0.0, 1.0) * uAlgaeHealth;
                  finalColor = mix(colorCO2, colorO2, conversionProgress);
              }
              // Normal white air passes through untouched.
          }

          // Slow crossfade at extreme boundaries so particles never suddenly "pop" onto the vents
          float fade = smoothstep(0.0, 0.05, vAgeRatio) * smoothstep(1.0, 0.95, vAgeRatio);
          
          // Suction particles are brightly illuminated, outside ambient air drops transparency significantly
          float multiAlpha = vIsSuction == 1.0 ? 0.8 : 0.2;

          gl_FragColor = vec4(finalColor, particleAlpha * fade * multiAlpha);
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
      particleShader.uniforms.uAlgaeHealth.value = algaeHealth;
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
