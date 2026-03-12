import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import GUI from 'lil-gui';

import { FiltrationBase } from './components/FiltrationBase';
import { CoreReactor } from './components/CoreReactor';
import { ExteriorShell } from './components/ExteriorShell';
import { AirParticles } from './components/AirParticles';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Simulation State
  const [co2Ppm, setCo2Ppm] = useState(450);
  const [xrayView, setXrayView] = useState(0.2); // Default to slightly see-through
  const [flowSpeed, setFlowSpeed] = useState(1.0);
  const [algaeHealth] = useState(0.95); // Constant for now

  // Calculated Telemetry
  const o2Output = (co2Ppm * flowSpeed * algaeHealth * 0.05).toFixed(2); // purely illustrative formula
  const pmRemoval = Math.min(100, (flowSpeed * 80)).toFixed(1);

  // GUI Setup
  useEffect(() => {
    const gui = new GUI({ width: 300, title: 'Simulation Controls' });
    
    // We use a proxy object for gui to bind to
    const params = {
      co2Ppm: co2Ppm,
      xrayView: xrayView,
      flowSpeed: flowSpeed,
    };

    gui.add(params, 'co2Ppm', 300, 2000).name('CO2 Intake (PPM)').onChange((v: number) => setCo2Ppm(v));
    gui.add(params, 'xrayView', 0.0, 1.0).name('X-Ray View (Opacity)').onChange((v: number) => setXrayView(v));
    gui.add(params, 'flowSpeed', 0.1, 5.0).name('Flow Speed').onChange((v: number) => setFlowSpeed(v));

    return () => {
      gui.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once, state updates will happen via onChange

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </button>

      <div className="telemetry-overlay">
        <div className="telemetry-title">Oxy-3 Simulator v1.0</div>
        
        <div className="telemetry-stat">
          <span>CO2 Intake:</span>
          <span>{co2Ppm.toFixed(0)} PPM</span>
        </div>
        <div className="telemetry-stat">
          <span>Flow Velocity:</span>
          <span>{flowSpeed.toFixed(2)} m/s</span>
        </div>
        <div className="telemetry-stat highlight">
          <span>O2 Output:</span>
          <span>{o2Output} L/hr</span>
        </div>
        <div className="telemetry-stat">
          <span>PM2.5 Removal:</span>
          <span>{pmRemoval}%</span>
        </div>
        <div className="telemetry-stat" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <span>Algae Health:</span>
          <span style={{ color: 'var(--accent-color)' }}>Optimal ({(algaeHealth * 100).toFixed(0)}%)</span>
        </div>
      </div>

      <Canvas camera={{ position: [0, 8, 15], fov: 45 }} gl={{ antialias: true }}>
        <fog attach="fog" args={[theme === 'light' ? '#f0f4f8' : '#12151c', 10, 50]} />
        <ambientLight intensity={theme === 'light' ? 0.7 : 0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        
        <Environment preset="city" />

        <group position={[0, -4, 0]}>
          <FiltrationBase />
          <CoreReactor />
          <ExteriorShell opacity={xrayView} />
          <AirParticles flowSpeed={flowSpeed} co2Ppm={co2Ppm} />
        </group>

        <OrbitControls 
          enablePan={false}
          minDistance={5}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2 + 0.1} 
        />
        
        {/* Post Processing for the UV-C and O2 Glow */}
        <EffectComposer>
          <Bloom luminanceThreshold={1.2} mipmapBlur intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </>
  );
}
