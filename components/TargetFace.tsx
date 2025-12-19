
import React from 'react';
import { ArrowPoint } from '../types';

interface Props {
  arrows: ArrowPoint[];
  type: 'standard' | 'three-spot';
  size?: number;
}

const TargetFace: React.FC<Props> = ({ arrows, type, size = 300 }) => {
  // Official Olympic Archery Target Colors (Index 0 = Score 1, Index 9 = Score 10)
  const ringColors = [
    '#ffffff', // Score 1 (White)
    '#ffffff', // Score 2 (White)
    '#111111', // Score 3 (Black)
    '#111111', // Score 4 (Black)
    '#00bfff', // Score 5 (Blue)
    '#00bfff', // Score 6 (Blue)
    '#ff3b30', // Score 7 (Red)
    '#ff3b30', // Score 8 (Red)
    '#ffcc00', // Score 9 (Gold/Yellow)
    '#ffcc00'  // Score 10 (Gold/Yellow)
  ];

  const renderSingleTarget = (targetArrows: ArrowPoint[], centerX: number, centerY: number, scale: number = 1, isThreeSpot: boolean = false) => {
    // Rings mapping: index 0 (Score 1) to index 9 (Score 10)
    // 3-spot target usually only shows the 6-10 rings (indices 5-9)
    const ringsIndices = isThreeSpot ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // IMPORTANT: Draw rings from LARGEST to SMALLEST so that smaller rings are rendered on top.
    // Index 0 has radius 40, Index 9 has radius 4.
    const sortedIndices = [...ringsIndices].sort((a, b) => a - b);

    return (
      <g transform={`translate(${centerX}, ${centerY}) scale(${scale})`}>
        {sortedIndices.map((i) => {
          // Radius calculation matches getRandomPointForScore logic
          const r = (10 - i) * 4;
          return (
            <circle
              key={i}
              cx="0"
              cy="0"
              r={r}
              fill={ringColors[i]}
              stroke={i === 2 || i === 3 ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}
              strokeWidth="0.15"
            />
          );
        })}
        {/* Inner 10 / X Ring Guide */}
        <circle cx="0" cy="0" r="2" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.1" />
        
        {/* Arrows */}
        {targetArrows.map((arrow, idx) => (
          <circle
            key={idx}
            cx={arrow.x - 50}
            cy={arrow.y - 50}
            r="1.2"
            fill="#000"
            stroke="#fff"
            strokeWidth="0.4"
            className="animate-in zoom-in duration-300 fill-mode-both"
          />
        ))}
      </g>
    );
  };

  if (type === 'three-spot') {
    return (
      <svg width={size * 0.7} height={size * 1.5} viewBox="0 0 100 240" className="mx-auto drop-shadow-2xl">
        <rect x="0" y="0" width="100" height="240" fill="#f8fafc" rx="12" stroke="#e2e8f0" strokeWidth="1" />
        {/* Render three spots stacked vertically. Radius 20 * scale 1.8 = 36 radius (72 width) */}
        {renderSingleTarget(arrows.filter((_, i) => i === 0), 50, 48, 1.8, true)}
        {renderSingleTarget(arrows.filter((_, i) => i === 1), 50, 120, 1.8, true)}
        {renderSingleTarget(arrows.filter((_, i) => i === 2), 50, 192, 1.8, true)}
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="mx-auto drop-shadow-xl bg-slate-50 rounded-[40px] p-6 border border-slate-200">
       {/* Full face target. Radius 40 * scale 1.15 = 46 radius (92 width). Fits in 100x100 box. */}
       {renderSingleTarget(arrows, 50, 50, 1.15, false)}
    </svg>
  );
};

export default TargetFace;
