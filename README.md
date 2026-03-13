# Oxy-3 WebGL Simulator

An interactive, high-fidelity 3D simulation of the Oxy-3 air purification system built with React, Three.js, and React Three Fiber. This project visualizes both the large-scale "Urban" photobioreactor and the compact "Home" tabletop model, simulating realistic microalgae growth (O2-Genesis spiral) and multi-stage filtration (Photocatalytic UV-C, HEPA H13/H14, Activated Carbon, and Zeolite Molecular Sieve).

## Features

- **Dual Models**: Switch seamlessly between the massive Urban Oxy-3 and the tabletop Home Oxy-3 models.
- **Biologically Accurate Simulation**: Features a 50-day microalgae lifecycle where the organisms grow, peak in vibrant density around day 45, and eventually expire.
- **Dynamic Particle Physics**: Thousands of independent WebGL particles represent ambient air, CO2, particulate matter, and purified oxygen, reacting in real-time to the machine's suction and filtration mechanics.
- **Real-Time Telemetry HUD**: Monitors Room Oxygen accumulation, Airflow Velocity (or L/min rate), CO2 intake, and real-time internal Algae Health.
- **Cinematic Rendering**: Utilizes HDRI environment mapping, glassmorphism UI, and post-processing bloom for glowing neon aesthetics.

## Tech Stack

- **Framework**: React 18, Vite (TypeScript)
- **3D Engine**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Post-Processing**: `@react-three/postprocessing`
- **UI & Controls**: `lil-gui`, Vanilla CSS

## Setup Instructions

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/yash-kasera/Oxy-3.git
   cd Oxy-3
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open in browser:**
   Navigate to `http://localhost:5173` to view the simulation.

## Usage

- **Model Switcher**: Use the dropdown in the top right to toggle between Urban and Home architectures.
- **Simulation Constraints**: Control the speed of the 50-day lifecycle simulation using the `Secs per Day` slider in the bottom right corner.
- **View Controls**: Click and drag to orbit the camera, scroll to zoom in/out.
- **Theme Toggle**: Switch between Light and Dark mode using the button in the top left corner.
