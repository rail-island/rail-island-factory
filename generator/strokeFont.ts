// A small stroke font for painted inscriptions: the digits, the hyphen and the
// letters the CSD coaches' running numbers and "CSD" (C with a caron) lettering need,
// and the capitals of the wagons' "RIV" and "CPAVEX" (C with a caron) lettering,
// the dot and M of the steam locomotives' numbers ("433.049", "M 112.001"), and
// the freight wagons' "MAERSK", "TRANSWAGGON" and "VIAMONT". Each glyph
// the dot and M of the steam locomotives' numbers ("433.049", "M 112.001"), and the
// G and T of the TGV's lettering (tgv.ts). Each glyph
// is polylines in a unit cell (x right 0..1, y up 0..1, the caron above 1);
// strokeText turns them into thin bars, triangles in (u, v), for MeshCore.facets.
// No `node:` imports: it is bundled into the standalone JS models.

type Glyph = Array<Array<[number, number]>>;

const C: Glyph = [[[0.85, 0.85], [0.7, 1], [0.3, 1], [0.15, 0.85], [0.15, 0.15], [0.3, 0], [0.7, 0], [0.85, 0.15]]];

const GLYPHS: Record<string, Glyph> = {
  "0": [[[0.3, 0], [0.7, 0], [0.85, 0.15], [0.85, 0.85], [0.7, 1], [0.3, 1], [0.15, 0.85], [0.15, 0.15], [0.3, 0]]],
  "1": [[[0.3, 0.8], [0.55, 1], [0.55, 0]], [[0.3, 0], [0.8, 0]]],
  "2": [[[0.15, 0.8], [0.3, 1], [0.7, 1], [0.85, 0.82], [0.85, 0.6], [0.15, 0], [0.85, 0]]],
  "3": [[[0.15, 0.88], [0.3, 1], [0.7, 1], [0.85, 0.85], [0.85, 0.65], [0.68, 0.52], [0.4, 0.52]], [[0.68, 0.52], [0.85, 0.38], [0.85, 0.15], [0.7, 0], [0.3, 0], [0.15, 0.12]]],
  "4": [[[0.68, 0], [0.68, 1], [0.12, 0.33], [0.9, 0.33]]],
  "5": [[[0.85, 1], [0.2, 1], [0.15, 0.55], [0.65, 0.6], [0.85, 0.42], [0.85, 0.15], [0.7, 0], [0.3, 0], [0.15, 0.12]]],
  "6": [[[0.8, 0.9], [0.65, 1], [0.35, 1], [0.15, 0.8], [0.15, 0.15], [0.3, 0], [0.7, 0], [0.85, 0.15], [0.85, 0.42], [0.7, 0.56], [0.3, 0.56], [0.15, 0.42]]],
  "7": [[[0.15, 1], [0.85, 1], [0.4, 0]]],
  "8": [[[0.3, 0.52], [0.15, 0.66], [0.15, 0.86], [0.3, 1], [0.7, 1], [0.85, 0.86], [0.85, 0.66], [0.7, 0.52], [0.3, 0.52], [0.15, 0.38], [0.15, 0.14], [0.3, 0], [0.7, 0], [0.85, 0.14], [0.85, 0.38], [0.7, 0.52]]],
  "9": [[[0.85, 0.58], [0.7, 0.44], [0.3, 0.44], [0.15, 0.58], [0.15, 0.85], [0.3, 1], [0.7, 1], [0.85, 0.85], [0.85, 0.2], [0.65, 0], [0.35, 0], [0.2, 0.1]]],
  "-": [[[0.25, 0.5], [0.75, 0.5]]],
  ".": [[[0.42, 0.04], [0.58, 0.04]]],
  " ": [],
  B: [[[0.15, 0], [0.15, 1], [0.65, 1], [0.82, 0.88], [0.82, 0.64], [0.65, 0.53], [0.15, 0.53]], [[0.65, 0.53], [0.85, 0.4], [0.85, 0.13], [0.68, 0], [0.15, 0]]],
  C,
  "\u010c": [...C, [[0.3, 1.28], [0.5, 1.12], [0.7, 1.28]]],
  A: [[[0.1, 0], [0.5, 1], [0.9, 0]], [[0.27, 0.42], [0.73, 0.42]]],
  D: [[[0.15, 0], [0.15, 1], [0.6, 1], [0.85, 0.75], [0.85, 0.25], [0.6, 0], [0.15, 0]]],
  E: [[[0.85, 1], [0.15, 1], [0.15, 0], [0.85, 0]], [[0.15, 0.52], [0.7, 0.52]]],
  I: [[[0.5, 0], [0.5, 1]], [[0.3, 1], [0.7, 1]], [[0.3, 0], [0.7, 0]]],
  M: [[[0.12, 0], [0.12, 1], [0.5, 0.42], [0.88, 1], [0.88, 0]]],
  P: [[[0.15, 0], [0.15, 1], [0.68, 1], [0.85, 0.85], [0.85, 0.62], [0.68, 0.48], [0.15, 0.48]]],
  R: [[[0.15, 0], [0.15, 1], [0.68, 1], [0.85, 0.85], [0.85, 0.62], [0.68, 0.48], [0.15, 0.48]], [[0.5, 0.48], [0.85, 0]]],
  T: [[[0.1, 1], [0.9, 1]], [[0.5, 1], [0.5, 0]]],
  S: [[[0.85, 0.85], [0.7, 1], [0.3, 1], [0.15, 0.85], [0.15, 0.66], [0.3, 0.53], [0.7, 0.47], [0.85, 0.34], [0.85, 0.15], [0.7, 0], [0.3, 0], [0.15, 0.15]]],
  V: [[[0.1, 1], [0.5, 0], [0.9, 1]]],
  X: [[[0.12, 0], [0.88, 1]], [[0.12, 1], [0.88, 0]]],
  // the freight wagons' "MAERSK", "TRANSWAGGON" and "VIAMONT" (freightWagons.ts, hopperWagons.ts)
  G: [[[0.85, 0.85], [0.7, 1], [0.3, 1], [0.15, 0.85], [0.15, 0.15], [0.3, 0], [0.7, 0], [0.85, 0.15], [0.85, 0.45], [0.55, 0.45]]],
  K: [[[0.15, 0], [0.15, 1]], [[0.85, 1], [0.15, 0.4]], [[0.38, 0.6], [0.85, 0]]],
  N: [[[0.15, 0], [0.15, 1], [0.85, 0], [0.85, 1]]],
  O: [[[0.3, 0], [0.7, 0], [0.85, 0.15], [0.85, 0.85], [0.7, 1], [0.3, 1], [0.15, 0.85], [0.15, 0.15], [0.3, 0]]],
  W: [[[0.05, 1], [0.27, 0], [0.5, 0.65], [0.73, 0], [0.95, 1]]],
  a: [[[0.2, 0.55], [0.35, 0.65], [0.7, 0.65], [0.82, 0.52], [0.82, 0]], [[0.82, 0.38], [0.35, 0.38], [0.18, 0.25], [0.18, 0.12], [0.32, 0], [0.65, 0], [0.82, 0.15]]],
  e: [[[0.18, 0.35], [0.82, 0.35], [0.82, 0.5], [0.68, 0.65], [0.32, 0.65], [0.18, 0.5], [0.18, 0.15], [0.32, 0], [0.75, 0]]],
  i: [[[0.5, 0], [0.5, 0.65]], [[0.5, 0.82], [0.5, 0.94]]],
  k: [[[0.2, 0], [0.2, 1]], [[0.8, 0.65], [0.2, 0.25]], [[0.42, 0.4], [0.82, 0]]],
  m: [[[0.1, 0], [0.1, 0.65]], [[0.1, 0.5], [0.25, 0.65], [0.4, 0.65], [0.5, 0.5], [0.5, 0]], [[0.5, 0.5], [0.6, 0.65], [0.75, 0.65], [0.9, 0.5], [0.9, 0]]],
  s: [[[0.8, 0.55], [0.65, 0.65], [0.3, 0.65], [0.18, 0.53], [0.18, 0.42], [0.3, 0.34], [0.7, 0.31], [0.82, 0.22], [0.82, 0.1], [0.68, 0], [0.3, 0], [0.15, 0.1]]],
};

/** True when every character of `text` has a glyph. */
export function canStroke(text: string): boolean {
  return [...text].every((ch) => ch in GLYPHS);
}

/** The width of `text` in strokeText with character width w and gap. */
export const strokeWidth = (text: string, w: number, gap: number): number => {
  const n = [...text].length;
  return n * w + (n - 1) * gap;
};

/**
 * `text` as thin bars, triangles in (u, v): characters h tall and w wide, `gap`
 * apart, the first starting at u0 and running toward +u (toward -u when `flipU`,
 * which also mirrors each glyph, so text drawn on a surface seen from the other
 * side still reads correctly), bars `stroke` wide (a tenth of h by default).
 * Throws on a character without a glyph.
 */
export function strokeText(text: string, u0: number, v0: number, h: number, w: number, gap: number, flipU = false, stroke = h * 0.1): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const t = stroke; // stroke width
  [...text].forEach((ch, i) => {
    const glyph = GLYPHS[ch];
    if (!glyph) throw new Error(`no glyph for "${ch}"`);
    const cu = i * (w + gap);
    for (const line of glyph) {
      for (let j = 1; j < line.length; j++) {
        const [ax, ay] = line[j - 1]!;
        const [bx, by] = line[j]!;
        const [x0, y0, x1, y1] = [cu + ax * w, ay * h, cu + bx * w, by * h];
        const len = Math.hypot(x1 - x0, y1 - y0) || 1;
        // a bar along the segment, overrun by half the stroke so joints close
        const [dx, dy] = [((x1 - x0) / len) * (t / 2), ((y1 - y0) / len) * (t / 2)];
        const [nx, ny] = [-dy, dx];
        const q: Array<[number, number]> = [
          [x0 - dx + nx, y0 - dy + ny], [x0 - dx - nx, y0 - dy - ny], [x1 + dx - nx, y1 + dy - ny], [x1 + dx + nx, y1 + dy + ny],
        ];
        for (const k of [0, 1, 2, 0, 2, 3]) {
          const [u, v] = q[k]!;
          out.push([flipU ? u0 - u : u0 + u, v0 + v]);
        }
      }
    }
  });
  return out;
}
