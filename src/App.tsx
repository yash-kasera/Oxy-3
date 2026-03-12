import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import GUI from 'lil-gui';

import { FiltrationBase } from './components/FiltrationBase';
import { CoreReactor } from './components/CoreReactor';
import { ExteriorShell } from './components/ExteriorShell';
import { AirParticles } from './components/AirParticles';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Real-world Fixed Telemetry
  const co2Ppm = 450;
  const flowSpeed = 1.0; 
  const pmRemoval = 99.9; // Modern HEPA efficiency
  const baseOxygen = 21.0; // Ambient O2%

  // Simulation State
  const [simStatus, setSimStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [currentDay, setCurrentDay] = useState(1);
  const [secondsPerDay, setSecondsPerDay] = useState(0.5); // Default to fast simulation
  const [accumulatedO2, setAccumulatedO2] = useState(0); // Tracks total O2 pumped into room

  // Biological Lifecycle (1 to 50)
  // Algae grows denser continuously up to Day 45. 
  // It is 100% healthy until Day 45, when it becomes too dense and blocks light, causing health to crash.
  const algaeDensity = Math.min(1.0, currentDay / 45); 
  const algaeHealth = currentDay > 45 ? Math.max(0, 1.0 - ((currentDay - 45) / 5.0)) : 1.0;

  // Room Oxygen climbs from 21.0% up to a theoretical max as O2 is pumped in
  const oxygenPercent = (baseOxygen + accumulatedO2).toFixed(1); 

  // Simulation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (simStatus === 'running') {
        setCurrentDay(prevDay => {
          const nextDay = prevDay + delta / secondsPerDay;
          
          // Calculate how much O2 was produced this frame (depends on current algae health)
          const currentHealth = nextDay > 45 ? Math.max(0, 1.0 - ((nextDay - 45) / 5.0)) : 1.0;
          
          // Add to room O2, scaled by time passed and algae efficiency
          setAccumulatedO2(prevO2 => prevO2 + (delta * currentHealth * 0.3));

          if (nextDay >= 50) {
            setSimStatus('completed');
            return 50;
          }
          return nextDay;
        });
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (simStatus === 'running') {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [simStatus, secondsPerDay]);

  // GUI Setup
  useEffect(() => {
    const guiContainer = document.getElementById('gui-container');
    if (guiContainer) guiContainer.innerHTML = '';
    const gui = new GUI({ container: guiContainer || undefined, title: 'Simulation Speed' });
    
    // We use a proxy object for gui to bind to
    const params = {
      secondsPerDay: secondsPerDay,
    };

    gui.add(params, 'secondsPerDay', 0.1, 5.0).name('Secs per Day').onChange((v: number) => setSecondsPerDay(v));

    return () => {
      gui.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="app-container">
      <div className="canvas-container">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>

        <Canvas camera={{ position: [0, 15, 40], fov: 45 }} gl={{ antialias: true }}>
          <fog attach="fog" args={[theme === 'light' ? '#f0f4f8' : '#12151c', 10, 80]} />
          <ambientLight intensity={theme === 'light' ? 0.7 : 0.3} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
          
          <Environment preset="city" />

          {/* Infinite Ground Grid for Scale Reference */}
          <Grid 
            position={[0, -4.8, 0]} 
            args={[200, 200]} 
            cellColor={theme === 'light' ? "#cccccc" : "#333333"} 
            sectionColor={theme === 'light' ? "#aaaaaa" : "#555555"} 
            sectionSize={5} 
            cellSize={1} 
            fadeDistance={80} 
          />

          <group position={[0, -4, 0]}>
            <FiltrationBase />
            <CoreReactor algaeHealth={algaeHealth} algaeDensity={algaeDensity} />
            <ExteriorShell opacity={0.2} />
            <AirParticles flowSpeed={simStatus === 'running' ? flowSpeed : 0.0} co2Ppm={co2Ppm} algaeHealth={algaeHealth} />
          </group>

          <OrbitControls 
            enablePan={false}
            minDistance={5}
            maxDistance={150}
            maxPolarAngle={Math.PI / 2 + 0.1} 
          />
          
          {/* Post Processing for the UV-C and O2 Glow */}
          <EffectComposer>
            <Bloom luminanceThreshold={1.2} mipmapBlur intensity={1.5} />
          </EffectComposer>
        </Canvas>
      </div>

      <div className="right-panel">
        <div className="telemetry-overlay">
          <div className="telemetry-title">Oxy-3 Simulator v1.0</div>
          
          <div className="telemetry-stat">
            <span>Simulation Time:</span>
            <span>Day {Math.floor(currentDay)} / 50</span>
          </div>
          <div className="telemetry-stat">
            <span>Airflow Velocity:</span>
            <span>{flowSpeed.toFixed(2)} m/s</span>
          </div>
          <div className="telemetry-stat">
            <span>CO2 Intake:</span>
            <span>{co2Ppm.toFixed(0)} PPM</span>
          </div>
          <div className="telemetry-stat highlight">
            <span>Room Oxygen Level:</span>
            <span>{oxygenPercent}%</span>
          </div>
          <div className="telemetry-stat">
            <span>PM2.5 Removal:</span>
            <span>{pmRemoval}%</span>
          </div>
          <div className="telemetry-stat" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <span>Algae Health:</span>
            <span style={{ color: algaeHealth > 0.5 ? 'var(--accent-color)' : algaeHealth > 0.2 ? 'orange' : 'red' }}>
              {(algaeHealth * 100).toFixed(0)}%
            </span>
          </div>

          <div style={{ marginTop: 20 }}>
            {simStatus === 'idle' && (
              <button className="sim-button" onClick={() => setSimStatus('running')}>Start Simulation</button>
            )}
            {simStatus === 'completed' && (
              <button className="sim-button" onClick={() => { 
                setCurrentDay(1); 
                setAccumulatedO2(0);
                setSimStatus('idle'); 
              }}>Reset Algae</button>
            )}
            {simStatus === 'running' && (
              <button className="sim-button" onClick={() => setSimStatus('idle')}>Pause</button>
            )}
          </div>
        </div>

        {/* The dat.gui controls append here */}
        <div id="gui-container"></div>
      </div>
    </div>
  );
}
