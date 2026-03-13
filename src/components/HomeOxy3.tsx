import React from 'react';
import * as THREE from 'three';
import { HomeBase } from './HomeBase';
import { HomeReactor } from './HomeReactor';
import { HomeParticles } from './HomeParticles';

interface HomeOxy3Props {
  algaeHealth?: number;
  algaeDensity?: number;
  flowSpeed?: number;
  co2Ppm?: number;
}

export function HomeOxy3({ algaeHealth = 1.0, algaeDensity = 0.0, flowSpeed = 1.0, co2Ppm = 450 }: HomeOxy3Props) {
  return (
    <group position={[0, -2, 0]}>
      <HomeBase />
      <HomeReactor algaeHealth={algaeHealth} algaeDensity={algaeDensity} />
      <HomeParticles flowSpeed={flowSpeed} co2Ppm={co2Ppm} algaeHealth={algaeHealth} />
    </group>
  );
}
