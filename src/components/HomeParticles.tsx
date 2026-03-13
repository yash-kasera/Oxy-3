import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function HomeParticles({ flowSpeed, co2Ppm, algaeHealth = 1.0 }: { flowSpeed: number, co2Ppm: number, algaeHealth?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const PARTICLE_COUNT = Math.floor(8000 * (co2Ppm / 450)); 
  const MAX_LIFETIME = 10.0;

  const particleShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFlowSpeed: { value: flowSpeed },
        uMaxLifetime: { value: MAX_LIFETIME },
        uAlgaeHealth: { value: algaeHealth }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uFlowSpeed;
        uniform float uMaxLifetime;
        
        attribute float aAgeOffset;
        attribute float aRandomScale;
        attribute vec3 aInitialPos;
        attribute float aType; 
        
        varying float vAgeRatio;
        varying float vIsSuction;
        varying float vType;
        
        // Define key path points for Home Oxy-3 Tabletop
        // Ambient Air Area: Hemisphere around the machine
        // Suction Route: 
        // 1. Enter side moss: [3.0, 0.5, 0.0]
        // 2. Down into base filters: [1.2, -2.5, 1.8]
        // 3. Up into glass tank spiral base: [0.0, 0.0, 0.0]
        // 4. Spiral up to top cap: [0.0, 4.0, 0.0]
        // 5. Exit out top port: [0.0, 4.5, 0.0] -> Diffuse upwards
        
        const vec3 intakePos = vec3(3.0, 0.5, 0.0);
        const vec3 filterBasePos = vec3(1.2, -2.5, 1.8);
        const vec3 tankBasePos = vec3(0.0, 0.0, 0.0);
        const vec3 tankTopPos = vec3(0.0, 4.0, 0.0);
        const vec3 exitPos = vec3(0.0, 4.5, 0.0);
        const vec3 diffusePos = vec3(0.0, 8.0, 0.0); // Shoots straight up

        // Spiral function helper
        vec3 evalSpiral(float t) {
            float radius = 1.2;
            float turns = 3.0;
            float height = 4.0;
            float angle = t * 3.14159 * 2.0 * turns;
            return vec3(cos(angle) * radius, t * height, sin(angle) * radius);
        }

        void main() {
            vType = aType;
            float particleAge = mod(uTime * uFlowSpeed + aAgeOffset, uMaxLifetime);
            vAgeRatio = particleAge / uMaxLifetime;
            
            vec3 currentPos = aInitialPos;
            vIsSuction = 0.0;
            
            // Capture ~45% of particles into the machine for a clear visible stream
            if (aRandomScale < 0.45) {
                vIsSuction = 1.0;
                
                // Route mapping via age ratio
                // 0.00 - 0.20: Ambient to Intake Moss
                // 0.20 - 0.35: Moss down to Base Filters
                // 0.35 - 0.50: Base Filters up to Tank Base
                // 0.50 - 0.80: Spiral up Tank
                // 0.80 - 0.90: Tank Top to Exit Port
                // 0.90 - 1.00: Exit Port diffusing upwards
                
                if (vAgeRatio < 0.20) {
                    float t = smoothstep(0.0, 0.20, vAgeRatio);
                    currentPos = mix(aInitialPos, intakePos, t);
                } else if (vAgeRatio < 0.35) {
                    float t = smoothstep(0.20, 0.35, vAgeRatio);
                    currentPos = mix(intakePos, filterBasePos, t);
                } else if (vAgeRatio < 0.50) {
                    float t = smoothstep(0.35, 0.50, vAgeRatio);
                    currentPos = mix(filterBasePos, tankBasePos, t);
                } else if (vAgeRatio < 0.80) {
                    float t = smoothstep(0.50, 0.80, vAgeRatio);
                    currentPos = evalSpiral(t);
                } else if (vAgeRatio < 0.90) {
                    float t = smoothstep(0.80, 0.90, vAgeRatio);
                    currentPos = mix(tankTopPos, exitPos, t);
                } else {
                    float t = smoothstep(0.90, 1.00, vAgeRatio);
                    // Add some spread to the exit plume
                    vec3 spreadExit = mix(exitPos, diffusePos + vec3(sin(aAgeOffset)*2.0, 0, cos(aAgeOffset)*2.0), t);
                    currentPos = spreadExit;
                }
            } else {
                // Ambient behavior: slow drift in hemisphere
                currentPos.x += sin(uTime * 0.5 + aAgeOffset) * 0.5;
                currentPos.z += cos(uTime * 0.3 + aAgeOffset) * 0.5;
                currentPos.y += sin(uTime * 0.2 + aAgeOffset) * 0.2;
            }

            vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
            
            // Suction particles are larger for visibility, but scaled down for tabletop
            float sizeBase = vIsSuction > 0.5 ? 20.0 : 6.0;
            
            gl_PointSize = sizeBase * aRandomScale * (10.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uAlgaeHealth;
        varying float vAgeRatio;
        varying float vIsSuction;
        varying float vType;

        void main() {
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float ll = length(xy);
          if (ll > 0.5) discard;
          
          vec3 colorPM = vec3(0.6, 0.4, 0.2); // Brownish dust
          vec3 colorCO2 = vec3(1.0, 0.2, 0.2); // Red CO2
          vec3 colorInert = vec3(0.7, 0.7, 0.7); // White/Grey N2/O2 mix
          vec3 colorO2 = vec3(0.1, 1.0, 0.3); // Bright Green pure O2
          
          vec3 finalColor = colorInert;
          float particleAlpha = vIsSuction > 0.5 ? 0.9 : 0.3;

          // Composition allocation: 
          // 10% Dust (0.00-0.10)
          // 20% CO2 (0.10-0.30)
          // 70% Inert (0.30-1.00)

          if (vType < 0.10) {
              finalColor = colorPM;
          } else if (vType < 0.30) {
              finalColor = colorCO2;
          }

          if (vIsSuction > 0.5) {
              if (vType < 0.10) {
                  // Dust trapped at base filters (t=0.35)
                  particleAlpha *= (1.0 - smoothstep(0.20, 0.35, vAgeRatio));
              } else if (vType < 0.30) {
                  // CO2 converted in spiral tank (t=0.50 to 0.80)
                  float conversionProgress = clamp((vAgeRatio - 0.50) / 0.30, 0.0, 1.0) * uAlgaeHealth;
                  finalColor = mix(colorCO2, colorO2, conversionProgress);
              }
              // Normal white air passes untouched.
              
              // Fade out gently as hitting diffuse point
              if (vAgeRatio > 0.90) {
                  particleAlpha *= (1.0 - smoothstep(0.90, 1.00, vAgeRatio));
              }
          }

          particleAlpha *= smoothstep(0.5, 0.2, ll); // Soft circle
          gl_FragColor = vec4(finalColor, particleAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [flowSpeed, algaeHealth]);

  const { positions, randoms, ages, types } = useMemo(() => {
    const p = new Float32Array(PARTICLE_COUNT * 3);
    const r = new Float32Array(PARTICLE_COUNT);
    const a = new Float32Array(PARTICLE_COUNT);
    const t = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spawn in a hemisphere closer to the tabletop machine
      const radius = 3 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI / 2); // Hemisphere

      p[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = radius * Math.cos(phi);
      p[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      r[i] = 0.5 + Math.random() * 0.5;
      a[i] = Math.random() * MAX_LIFETIME;
      t[i] = Math.random(); // Type assignment
    }
    return { positions: p, randoms: r, ages: a, types: t };
  }, [PARTICLE_COUNT]);

  useFrame((state) => {
    if (particleShader) {
      particleShader.uniforms.uTime.value = state.clock.elapsedTime;
      particleShader.uniforms.uFlowSpeed.value = flowSpeed;
      particleShader.uniforms.uAlgaeHealth.value = algaeHealth;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandomScale" count={randoms.length} array={randoms} itemSize={1} />
        <bufferAttribute attach="attributes-aAgeOffset" count={ages.length} array={ages} itemSize={1} />
        <bufferAttribute attach="attributes-aInitialPos" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aType" count={types.length} array={types} itemSize={1} />
      </bufferGeometry>
      <primitive object={particleShader} attach="material" />
    </points>
  );
}
