// The SVG chess board: pieces, highlights, arrows, stars, ghost hand, tap + drag + keyboard input.
import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ALL_SQUARES, FILES, type Color, type Pieces, type Square } from '../chess/types';
import { fileIdx, isLightSquare, rankNum, sq } from '../chess/geometry';
import { PieceGlyph } from './pieces';
import './board.css';

export type Mark = 'last' | 'check' | 'good' | 'bad' | 'hint' | 'line' | 'attacked' | 'found' | 'pin';
export interface Arrow {
  from: Square;
  to: Square;
  kind?: 'hint' | 'threat' | 'demo';
}
export interface MoveDot {
  to: Square;
  capture: boolean;
}

export interface BoardProps {
  pieces: Pieces;
  orientation?: Color;
  selected?: Square | null;
  moves?: MoveDot[];
  marks?: Partial<Record<Square, Mark>>;
  arrows?: Arrow[];
  stars?: Square[];
  coordinates?: boolean;
  /** Which pieces may be picked up (tap or drag). Default: none. */
  movable?: (s: Square) => boolean;
  onSquare?: (s: Square) => void;
  onDrop?: (from: Square, to: Square) => void;
  /** Ghost hand position (demo moves). */
  ghost?: Square | null;
  label?: string;
  /** Slide pieces when they move. */
  animate?: boolean;
}

const SQ = 10; // size of one square in SVG units
const px = (s: Square, flip: boolean): { x: number; y: number } => {
  const f = fileIdx(s);
  const r = rankNum(s) - 1;
  return { x: (flip ? 7 - f : f) * SQ, y: (flip ? r : 7 - r) * SQ };
};

interface Tracked {
  id: number;
  sq: Square;
  type: string;
  color: Color;
}

/** Gives each piece a stable id across renders so that moves animate (slide) instead of teleport. */
function useTrackedPieces(pieces: Pieces): Tracked[] {
  const prev = useRef<Tracked[]>([]);
  const nextId = useRef(1);
  return useMemo(() => {
    const old = prev.current;
    const result: Tracked[] = [];
    const used = new Set<number>();
    const entries = ALL_SQUARES.filter((s) => pieces[s]);
    // 1) pieces that stayed put keep their id
    const unmatched: Square[] = [];
    for (const s of entries) {
      const p = pieces[s]!;
      const same = old.find((o) => o.sq === s && o.type === p.type && o.color === p.color && !used.has(o.id));
      if (same) {
        used.add(same.id);
        result.push({ ...same });
      } else unmatched.push(s);
    }
    // 2) moved pieces inherit the id of the closest identical piece that vanished
    for (const s of unmatched) {
      const p = pieces[s]!;
      let best: Tracked | undefined;
      let bestD = 99;
      for (const o of old) {
        if (used.has(o.id) || o.type !== p.type || o.color !== p.color) continue;
        if (pieces[o.sq] && pieces[o.sq]!.type === o.type && pieces[o.sq]!.color === o.color) continue;
        const d = Math.abs(fileIdx(o.sq) - fileIdx(s)) + Math.abs(rankNum(o.sq) - rankNum(s));
        if (d < bestD) {
          best = o;
          bestD = d;
        }
      }
      if (best) {
        used.add(best.id);
        result.push({ ...best, sq: s });
      } else result.push({ id: nextId.current++, sq: s, type: p.type, color: p.color });
    }
    prev.current = result;
    return result;
  }, [pieces]);
}

const squareLabel = (s: Square, pieces: Pieces): string => {
  const p = pieces[s];
  const names: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  return p ? `${s}, ${p.color === 'w' ? 'white' : 'black'} ${names[p.type]}` : `${s}, empty`;
};

export function Board(props: BoardProps) {
  const {
    pieces, orientation = 'w', selected = null, moves = [], marks = {}, arrows = [], stars = [],
    coordinates = true, movable, onSquare, onDrop, ghost = null, label = 'Chess board', animate = true,
  } = props;
  const flip = orientation === 'b';
  const svgRef = useRef<SVGSVGElement>(null);
  const tracked = useTrackedPieces(pieces);
  const [cursor, setCursor] = useState<Square>('e2');
  const [focused, setFocused] = useState(false);
  const [drag, setDrag] = useState<{ id: number; from: Square; x: number; y: number } | null>(null);
  const press = useRef<{ from: Square | null; id: number | null; x: number; y: number; moved: boolean } | null>(null);

  const squareAt = useCallback(
    (clientX: number, clientY: number): { s: Square | null; x: number; y: number } => {
      const rect = svgRef.current!.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 8 * SQ;
      const y = ((clientY - rect.top) / rect.height) * 8 * SQ;
      const f = Math.floor(x / SQ);
      const r = Math.floor(y / SQ);
      const s = sq(flip ? 7 - f : f, flip ? r + 1 : 8 - r);
      return { s, x, y };
    },
    [flip],
  );

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    const { s, x, y } = squareAt(e.clientX, e.clientY);
    if (!s) return;
    const t = tracked.find((p) => p.sq === s);
    const canDrag = !!t && !!movable && movable(s);
    press.current = { from: canDrag ? s : null, id: canDrag ? t!.id : null, x, y, moved: false };
    svgRef.current!.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const pr = press.current;
    if (!pr || !pr.from) return;
    const { x, y } = squareAt(e.clientX, e.clientY);
    if (!pr.moved && Math.hypot(x - pr.x, y - pr.y) < 2.5) return;
    pr.moved = true;
    setDrag({ id: pr.id!, from: pr.from, x, y });
  };
  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    const pr = press.current;
    press.current = null;
    setDrag(null);
    if (!pr) return;
    const { s } = squareAt(e.clientX, e.clientY);
    if (pr.moved && pr.from) {
      if (s && s !== pr.from) onDrop?.(pr.from, s);
      else if (s === pr.from) onSquare?.(s);
    } else if (s) {
      setCursor(s);
      onSquare?.(s);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d: Record<string, [number, number]> = {
      ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1],
    };
    if (d[e.key]) {
      e.preventDefault();
      const [df, dr] = d[e.key];
      const next = sq(fileIdx(cursor) + (flip ? -df : df), rankNum(cursor) + (flip ? -dr : dr));
      if (next) setCursor(next);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSquare?.(cursor);
    }
  };

  const moveMap = new Map(moves.map((m) => [m.to, m]));
  const arrowEls = arrows.map((a, i) => {
    const p1 = px(a.from, flip);
    const p2 = px(a.to, flip);
    const x1 = p1.x + SQ / 2, y1 = p1.y + SQ / 2, x2 = p2.x + SQ / 2, y2 = p2.y + SQ / 2;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const head = 3.2;
    const ex = x2 - ux * head * 0.6, ey = y2 - uy * head * 0.6;
    const sx = x1 + ux * 2.2, sy = y1 + uy * 2.2;
    return (
      <g key={i} className={`arrow arrow-${a.kind ?? 'hint'}`}>
        <line x1={sx} y1={sy} x2={ex - ux * 1} y2={ey - uy * 1} />
        <polygon
          points={`${x2 - ux * 0.3},${y2 - uy * 0.3} ${x2 - ux * head - uy * 2},${y2 - uy * head + ux * 2} ${x2 - ux * head + uy * 2},${y2 - uy * head - ux * 2}`}
        />
      </g>
    );
  });

  const ghostPos = ghost ? px(ghost, flip) : null;
  const ordered = [...tracked].sort((a, b) => (a.id === drag?.id ? 1 : b.id === drag?.id ? -1 : 0));

  return (
    <div
      className="board-wrap"
      tabIndex={0}
      role="application"
      aria-label={`${label}. Use arrow keys to move the cursor, Enter to select.`}
      onKeyDown={onKey}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <svg
        ref={svgRef}
        className="board"
        viewBox={`0 0 ${8 * SQ} ${8 * SQ}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { press.current = null; setDrag(null); }}
        role="img"
        aria-label={label}
      >
        {ALL_SQUARES.map((s) => {
          const { x, y } = px(s, flip);
          const mark = marks[s];
          const light = isLightSquare(s);
          return (
            <g key={s} transform={`translate(${x} ${y})`} data-square={s}>
              <rect width={SQ} height={SQ} className={light ? 'sq-light' : 'sq-dark'} />
              {mark && <rect width={SQ} height={SQ} className={`mark mark-${mark}`} />}
              {mark === 'check' && <circle cx={SQ / 2} cy={SQ / 2} r={SQ * 0.46} className="check-ring" />}
              {mark === 'bad' && <path d="M2.600 2.600L7.400 7.400M7.400 2.600L2.600 7.400" className="mark-x" />}
              {mark === 'good' && <path d="M2.400 5.200L4.400 7.200L7.800 2.800" className="mark-tick" />}
              {mark === 'found' && <circle cx={SQ / 2} cy={SQ / 2} r="2.200" className="found-dot" />}
              {mark === 'pin' && <path d="M3 4.500h4v3.500H3zM3.800 4.500V3.400a1.200 1.200 0 0 1 2.400 0v1.100" className="mark-lock" />}
              {coordinates && (flip ? fileIdx(s) === 7 : fileIdx(s) === 0) && (
                <text x={flip ? SQ - 0.8 : 0.8} y="2.500" textAnchor={flip ? 'end' : 'start'} className={`coord ${light ? 'on-light' : 'on-dark'}`}>
                  {rankNum(s)}
                </text>
              )}
              {coordinates && (flip ? rankNum(s) === 8 : rankNum(s) === 1) && (
                <text x={SQ - 0.8} y={SQ - 0.8} textAnchor="end" className={`coord ${light ? 'on-light' : 'on-dark'}`}>
                  {FILES[fileIdx(s)]}
                </text>
              )}
              {selected === s && <rect width={SQ} height={SQ} className="selected" />}
            </g>
          );
        })}

        {stars.map((s) => {
          const { x, y } = px(s, flip);
          return (
            <g key={`star-${s}`} transform={`translate(${x + SQ / 2} ${y + SQ / 2})`} className="star">
              <path d="M0-3.600L1.100-1.200L3.700-0.900L1.800 0.900L2.300 3.500L0 2.200L-2.300 3.500L-1.800 0.900L-3.700-0.900L-1.100-1.200Z" />
            </g>
          );
        })}

        {moves.map((m) => {
          const { x, y } = px(m.to, flip);
          return (
            <g key={`mv-${m.to}`} transform={`translate(${x} ${y})`} className="move-hint">
              {m.capture ? (
                <circle cx={SQ / 2} cy={SQ / 2} r="4.400" className="ring" />
              ) : (
                <circle cx={SQ / 2} cy={SQ / 2} r="1.700" className="dot" />
              )}
            </g>
          );
        })}

        {ordered.map((t) => {
          const isDragged = drag?.id === t.id;
          const pos = isDragged ? { x: drag!.x - SQ / 2, y: drag!.y - SQ / 2 } : px(t.sq, flip);
          const scale = SQ / 45;
          const targetHere = moveMap.get(t.sq);
          return (
            <g
              key={t.id}
              className={`piece ${isDragged ? 'dragging' : ''} ${animate ? '' : 'no-anim'}`}
              style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
            >
              <g transform={`scale(${scale})`} className={targetHere ? 'capturable' : undefined}>
                <PieceGlyph type={t.type as 'p'} color={t.color} />
              </g>
            </g>
          );
        })}

        {arrowEls}

        {ghostPos && (
          <g className="ghost" style={{ transform: `translate(${ghostPos.x}px, ${ghostPos.y}px)` }}>
            <circle cx="5" cy="5" r="4" className="ghost-ring" />
            <path d="M5 4.200v-2a0.800 0.800 0 0 1 1.600 0v3l1.400 .3a1 1 0 0 1 .8 1.200l-.4 2.400a1.500 1.500 0 0 1-1.500 1.200H5.400a1.500 1.500 0 0 1-1.200-.6L2.800 7.300a.7.7 0 0 1 1.100-.9L5 7.500z" className="ghost-hand" />
          </g>
        )}

        {focused && (() => {
          const { x, y } = px(cursor, flip);
          return <rect x={x + 0.4} y={y + 0.4} width={SQ - 0.8} height={SQ - 0.8} className="cursor" />;
        })()}
      </svg>
      <span className="sr-only" aria-live="polite">{focused ? squareLabel(cursor, pieces) : ''}</span>
    </div>
  );
}
