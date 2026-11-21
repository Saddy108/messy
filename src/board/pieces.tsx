// Original piece artwork (hand-drawn SVG, no third-party licence). Each glyph fits a 45x45 box.
import type { Color, PieceType } from '../chess/types';

const WHITE = { fill: '#fbfaf3', stroke: '#23232b', detail: '#23232b' };
const BLACK = { fill: '#3a3a46', stroke: '#101014', detail: '#e9e9ef' };

interface GlyphProps {
  type: PieceType;
  color: Color;
}

/** Draws one piece centred in a 45x45 box. */
export function PieceGlyph({ type, color }: GlyphProps) {
  const c = color === 'w' ? WHITE : BLACK;
  const shape = { fill: c.fill, stroke: c.stroke, strokeWidth: 1.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const line = { fill: 'none', stroke: c.detail, strokeWidth: 1.4, strokeLinecap: 'round' as const };
  const base = <path d="M10.5 39.5h24v-3.5a2 2 0 0 0-2-2h-20a2 2 0 0 0-2 2z" {...shape} />;
  switch (type) {
    case 'p':
      return (
        <g>
          <circle cx="22.5" cy="13.5" r="5.6" {...shape} />
          <path d="M16 34c0-7 3-9.5 6.5-13 3.5 3.5 6.5 6 6.5 13z" {...shape} />
          {base}
        </g>
      );
    case 'r':
      return (
        <g>
          <path d="M11 9.5h4.5v3.5h4.25V9.5h5.5V13h4.25V9.5H34V19H11z" {...shape} />
          <path d="M14 19h17l1 15H13z" {...shape} />
          <path d="M14.5 19.5h16" {...line} />
          {base}
        </g>
      );
    case 'b':
      return (
        <g>
          <circle cx="22.5" cy="8.5" r="2.6" {...shape} />
          <path d="M22.5 11c6 4.5 8.5 10 4.5 16 1 3 1.5 4.5 3 7H15c1.5-2.5 2-4 3-7-4-6-1.5-11.5 4.5-16z" {...shape} />
          <path d="M19.5 20h6M22.5 17v6" {...line} />
          {base}
        </g>
      );
    case 'n':
      return (
        <g>
          <path
            d="M13 34c0-6 2-9.5 5.5-12.5-3.2.2-5.700 1.200-7.500 3.200L9.500 22.500c2-4.500 6-8 9-11.500l1-4 4 3.200C31 11 35.500 20 34.500 34z"
            {...shape}
          />
          <circle cx="19.200" cy="14.800" r="1.200" fill={c.detail} />
          <path d="M11.500 22.800l2.200-1.600" {...line} />
          <path d="M23 17c3 1.500 5.500 5 6 11" {...line} />
          {base}
        </g>
      );
    case 'q':
      return (
        <g>
          <path d="M10 15l4 14 2.250-17 3.250 16 3-18 3 18 3.250-16L31 29l4-14-2.500 21.500h-20z" {...shape} />
          {[10, 16.25, 22.5, 28.75, 35].map((x, i) => (
            <circle key={x} cx={x} cy={i === 2 ? 9 : i % 2 ? 11.2 : 13.800} r="2.100" {...shape} />
          ))}
          <path d="M13.500 31.500h18" {...line} />
          {base}
        </g>
      );
    case 'k':
      return (
        <g>
          <path d="M22.500 4.500v8.500M18.500 8h8" {...shape} strokeWidth={2.400} />
          <path d="M22.500 14c-8.500 0-12 6-9.500 13 1 3 1.500 5-.5 7.500h20c-2-2.500-1.500-4.500-.5-7.500 2.500-7-1-13-9.500-13z" {...shape} />
          <path d="M15.500 24c4-2 10-2 14 0" {...line} />
          {base}
        </g>
      );
  }
}

/** Small standalone icon version (for trays, lists, buttons). */
export function PieceIcon({ type, color, size = 32 }: GlyphProps & { size?: number }) {
  return (
    <svg viewBox="0 0 45 45" width={size} height={size} aria-hidden="true" focusable="false">
      <PieceGlyph type={type} color={color} />
    </svg>
  );
}
