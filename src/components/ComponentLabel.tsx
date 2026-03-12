import React from 'react';
import { Html } from '@react-three/drei';

export function ComponentLabel({ text, position }: { text: string, position: [number, number, number] }) {
  return (
    <Html position={position} center distanceFactor={15}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.75)',
        color: '#00ff88',
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px solid #00ff88',
        fontFamily: 'monospace',
        fontSize: '14px',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        backdropFilter: 'blur(2px)'
      }}>
        {text}
      </div>
    </Html>
  );
}
