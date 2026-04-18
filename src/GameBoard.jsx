import React, { useState } from 'react';
import { validSecondPoints, isValidFirstPoint } from './game';

const CELL   = 60;
const PAD    = 40;
const CELL_H = CELL * Math.sqrt(3) / 2;  // ≈ 51.96
const PR     = 8;   // point radius

export function GameBoard({ gameState, players, selectedPoint, onPointClick }) {
  const [hovered, setHovered] = useState(null);
  const { rows, dots, hEdges, lEdges, rEdges, upTri, downTri, currentPlayer, gameOver } = gameState;

  const W = PAD * 2 + (rows - 1) * CELL;
  const H = PAD * 2 + (rows - 1) * CELL_H;

  // Dot (r,c) screen position — apex at top, centred
  const dpx = (r, c) => PAD + c * CELL + (rows - 1 - r) * CELL / 2;
  const dpy = r       => PAD + r * CELL_H;

  const pcolor   = key => key === 'player1' ? players[0].color.value : players[1].color.value;
  const curColor = pcolor(currentPlayer);

  const valids  = selectedPoint
    ? validSecondPoints(gameState, selectedPoint.row, selectedPoint.col)
    : [];
  const isVSec = (r, c) => valids.some(p => p.row === r && p.col === c);
  const isVFst = (r, c) => !selectedPoint && !gameOver && isValidFirstPoint(gameState, r, c);

  const previewTarget = hovered && isVSec(hovered.row, hovered.col) ? hovered : null;

  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <defs>
        {['player1', 'player2'].map(key => (
          <pattern key={key} id={`stripe-${key}`}
            patternUnits="userSpaceOnUse" width="12" height="12"
            patternTransform="rotate(45)"
          >
            <rect width="12" height="12" fill={pcolor(key)} fillOpacity="0.12" />
            <rect width="12" height="6"  fill={pcolor(key)} fillOpacity="0.40" />
          </pattern>
        ))}
      </defs>

      {/* Ghost grid — all possible edge positions */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: r }, (_, c) => (
          <line key={`gh${r}_${c}`}
            x1={dpx(r,c)} y1={dpy(r)} x2={dpx(r,c+1)} y2={dpy(r)}
            stroke="#262a30" strokeWidth={2}
          />
        ))
      )}
      {Array.from({ length: rows - 1 }, (_, r) =>
        Array.from({ length: r + 1 }, (_, c) => (
          <line key={`gl${r}_${c}`}
            x1={dpx(r,c)} y1={dpy(r)} x2={dpx(r+1,c)} y2={dpy(r+1)}
            stroke="#262a30" strokeWidth={2}
          />
        ))
      )}
      {Array.from({ length: rows - 1 }, (_, r) =>
        Array.from({ length: r + 1 }, (_, c) => (
          <line key={`gr${r}_${c}`}
            x1={dpx(r,c)} y1={dpy(r)} x2={dpx(r+1,c+1)} y2={dpy(r+1)}
            stroke="#262a30" strokeWidth={2}
          />
        ))
      )}

      {/* Completed triangle fills */}
      {upTri.map((row, r) =>
        row.map((owner, c) => owner && (
          <polygon key={`up${r}_${c}`}
            points={[
              `${dpx(r,c)},${dpy(r)}`,
              `${dpx(r+1,c)},${dpy(r+1)}`,
              `${dpx(r+1,c+1)},${dpy(r+1)}`,
            ].join(' ')}
            fill={`url(#stripe-${owner})`}
            stroke={pcolor(owner)} strokeWidth={2} strokeDasharray="6 4"
          />
        ))
      )}
      {downTri.map((row, r) =>
        row.map((owner, c) => owner && (
          <polygon key={`dn${r}_${c}`}
            points={[
              `${dpx(r,c)},${dpy(r)}`,
              `${dpx(r,c+1)},${dpy(r)}`,
              `${dpx(r+1,c+1)},${dpy(r+1)}`,
            ].join(' ')}
            fill={`url(#stripe-${owner})`}
            stroke={pcolor(owner)} strokeWidth={2} strokeDasharray="6 4"
          />
        ))
      )}

      {/* Drawn edges */}
      {hEdges.map((row, r) =>
        row.map((owner, c) => owner && (
          <line key={`hL${r}_${c}`}
            x1={dpx(r,c)} y1={dpy(r)} x2={dpx(r,c+1)} y2={dpy(r)}
            stroke={pcolor(owner)} strokeWidth={6} strokeLinecap="round"
          />
        ))
      )}
      {lEdges.map((row, r) =>
        row.map((owner, c) => owner && (
          <line key={`lL${r}_${c}`}
            x1={dpx(r,c)} y1={dpy(r)} x2={dpx(r+1,c)} y2={dpy(r+1)}
            stroke={pcolor(owner)} strokeWidth={6} strokeLinecap="round"
          />
        ))
      )}
      {rEdges.map((row, r) =>
        row.map((owner, c) => owner && (
          <line key={`rL${r}_${c}`}
            x1={dpx(r,c)} y1={dpy(r)} x2={dpx(r+1,c+1)} y2={dpy(r+1)}
            stroke={pcolor(owner)} strokeWidth={6} strokeLinecap="round"
          />
        ))
      )}

      {/* Preview line on hover */}
      {selectedPoint && previewTarget && (
        <line
          x1={dpx(selectedPoint.row, selectedPoint.col)} y1={dpy(selectedPoint.row)}
          x2={dpx(previewTarget.row, previewTarget.col)} y2={dpy(previewTarget.row)}
          stroke={curColor} strokeWidth={4} strokeLinecap="round"
          strokeDasharray="8 5" opacity={0.55}
        />
      )}

      {/* Dots */}
      {dots.map((row, r) =>
        row.map((pt, c) => {
          const isSel    = selectedPoint?.row === r && selectedPoint?.col === c;
          const isVS     = isVSec(r, c);
          const isVF     = isVFst(r, c);
          const clickable = isSel || isVS || isVF;
          const dotFill  = pt ? pcolor(pt) : '#3a3f47';
          const cx = dpx(r, c), cy = dpy(r);

          return (
            <g key={`pt${r}_${c}`}
              cursor={clickable ? 'pointer' : 'default'}
              onClick={() => !gameOver && onPointClick(r, c)}
              onMouseEnter={() => setHovered({ row: r, col: c })}
              onMouseLeave={() => setHovered(null)}
            >
              <circle cx={cx} cy={cy} r={PR + 12} fill="transparent" />

              {isSel && (
                <circle cx={cx} cy={cy} r={PR + 8} fill={curColor} opacity={0.25} />
              )}
              {isVS && !isSel && (
                <circle cx={cx} cy={cy} r={PR + 6}
                  fill="none" stroke={curColor} strokeWidth={2} opacity={0.8}
                />
              )}
              {isVF && (
                <circle cx={cx} cy={cy} r={PR + 5}
                  fill="none" stroke={curColor} strokeWidth={1.5}
                  strokeDasharray="4 3" opacity={0.45}
                />
              )}
              <circle cx={cx} cy={cy} r={isSel ? PR + 2 : PR}
                fill={isSel ? 'white' : dotFill}
                stroke={isSel ? curColor : (pt ? 'none' : '#555')}
                strokeWidth={isSel ? 3 : 1}
              />
            </g>
          );
        })
      )}
    </svg>
  );
}
