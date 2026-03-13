import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { ComponentLabel } from './ComponentLabel';

export function HomeBase() {
  return (
    <group position={[0, -2.5, 0]}>
      {/* Main Base Chassis - Cylindrical */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 3.0, 64]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Capacitive Touch Control Panel */}
      <group position={[-1.0, 0, 2.51]}>
        <mesh>
          <planeGeometry args={[1.2, 1.2]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        
        {/* Simple mock UI on the screen */}
        <Html transform position={[0, 0, 0.01]} distanceFactor={4} center>
          <div style={{
            color: 'white',
            background: 'transparent',
            width: '100px',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'sans-serif',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#888' }}>AIR FLOW RATE</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>5.0 L</div>
            <div style={{ fontSize: '10px', color: '#00ff44', marginTop: '4px' }}>O2 GEN</div>
          </div>
        </Html>
        <ComponentLabel text="CAPACITIVE TOUCH CONTROL PANEL" position={[-1.5, -0.5, 0]} />
      </group>

      {/* Multi-stage Filtration Cutaway (Right Front) */}
      <group position={[1.2, -0.2, 1.8]}>
        {/* Cutaway Backdrop (Dark indent to make filters pop) */}
        <mesh position={[0, 0, -0.3]}>
          <cylinderGeometry args={[1.4, 1.4, 2.4, 32, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#222222" side={THREE.BackSide} />
        </mesh>

        {/* 1. Pre-Filter Moss Mesh (Top) */}
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.4, 32]} />
          <meshStandardMaterial color="#2e5c1d" roughness={0.9} />
          <ComponentLabel text="PRE-FILTER MOSS-MESH" position={[2.5, 0.5, 0]} />
        </mesh>

        {/* 2. Micro-HEPA Cartridge (Middle) */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[1.1, 1.1, 1.0, 32]} />
          {/* Pleated texture mock via material properties */}
          <meshStandardMaterial color="#ffffff" roughness={0.7} bumpScale={0.05} />
          <ComponentLabel text="MICRO-HEPA CARTRIDGE" position={[2.5, 0, 0]} />
        </mesh>

        {/* 3. Activated Carbon Composite (Bottom) */}
        <mesh position={[0, -0.9, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.4, 32]} />
          <meshStandardMaterial color="#111111" roughness={0.9} />
          <ComponentLabel text="ACTIVATED CARBON COMPOSITE" position={[2.5, -0.5, 0]} />
        </mesh>
      </group>
    </group>
  );
}
