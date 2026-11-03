// A simple stroke font for painted lettering on a surface: the capitals A - Z,
// the digits, a few signs and the Czech accents (the hacek and the acute), so a
// livery can carry its operator's wordmark ("REGIOJET", "CESKE DRAHY").
// Every glyph is a set of centre-line polylines in a unit box (u to the reader's
// right, v up); each segment becomes a bar `weight` of the height thick with
// square caps at its free ends and bevelled
// where it bends, so strokes meet without gaps. The bars of one glyph overlap in
// one plane and one material, which the flicker check allows.
//
// Kept apart from cd163.ts's numerals (`lettering`) on purpose: a module that
// draws words imports this one. Everything at module level is a literal (no
// call), so a JS bundle that reaches this module without lettering a word drops it.
// See docs/models/lettering.md.

type Pt = readonly [number, number];
type Glyph = { w: number; lines: ReadonlyArray<ReadonlyArray<Pt>> };

const O: Pt[] = [[0.22, 0], [0.05, 0.18], [0.05, 0.82], [0.22, 1], [0.78, 1], [0.95, 0.82], [0.95, 0.18], [0.78, 0], [0.22, 0]];
const C: Pt[] = [[0.95, 0.84], [0.78, 1], [0.22, 1], [0.05, 0.82], [0.05, 0.18], [0.22, 0], [0.78, 0], [0.95, 0.16]];
const P: Pt[] = [[0, 0], [0, 1], [0.75, 1], [0.95, 0.85], [0.95, 0.62], [0.75, 0.47], [0, 0.47]];

const GLYPHS: Record<string, Glyph> = {
  A: { w: 1, lines: [[[0, 0], [0.5, 1], [1, 0]], [[0.22, 0.42], [0.78, 0.42]]] },
  B: { w: 0.95, lines: [[[0, 0], [0, 1], [0.72, 1], [0.92, 0.86], [0.92, 0.64], [0.72, 0.52], [0, 0.52]], [[0.72, 0.52], [1, 0.38], [1, 0.14], [0.78, 0], [0, 0]]] },
  C: { w: 0.95, lines: [C] },
  D: { w: 0.95, lines: [[[0, 0], [0, 1], [0.65, 1], [1, 0.75], [1, 0.25], [0.65, 0], [0, 0]]] },
  E: { w: 0.85, lines: [[[1, 1], [0, 1], [0, 0], [1, 0]], [[0, 0.52], [0.8, 0.52]]] },
  F: { w: 0.85, lines: [[[1, 1], [0, 1], [0, 0]], [[0, 0.52], [0.8, 0.52]]] },
  G: { w: 0.95, lines: [[[0.95, 0.84], [0.78, 1], [0.22, 1], [0.05, 0.82], [0.05, 0.18], [0.22, 0], [0.78, 0], [0.95, 0.16], [0.95, 0.45], [0.55, 0.45]]] },
  H: { w: 0.95, lines: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, 0.52], [1, 0.52]]] },
  I: { w: 0.25, lines: [[[0.5, 0], [0.5, 1]]] },
  J: { w: 0.8, lines: [[[0.9, 1], [0.9, 0.2], [0.7, 0], [0.25, 0], [0.05, 0.2]]] },
  K: { w: 0.95, lines: [[[0, 0], [0, 1]], [[1, 1], [0, 0.42]], [[0.32, 0.6], [1, 0]]] },
  L: { w: 0.8, lines: [[[0, 1], [0, 0], [1, 0]]] },
  M: { w: 1.15, lines: [[[0, 0], [0, 1], [0.5, 0.35], [1, 1], [1, 0]]] },
  N: { w: 0.95, lines: [[[0, 0], [0, 1], [1, 0], [1, 1]]] },
  O: { w: 1, lines: [O] },
  P: { w: 0.9, lines: [P] },
  Q: { w: 1, lines: [O, [[0.6, 0.25], [1, -0.05]]] },
  R: { w: 0.92, lines: [P, [[0.5, 0.47], [1, 0]]] },
  S: { w: 0.9, lines: [[[0.95, 0.84], [0.78, 1], [0.22, 1], [0.05, 0.84], [0.05, 0.66], [0.22, 0.53], [0.78, 0.47], [0.95, 0.34], [0.95, 0.16], [0.78, 0], [0.22, 0], [0.05, 0.16]]] },
  T: { w: 0.9, lines: [[[0, 1], [1, 1]], [[0.5, 1], [0.5, 0]]] },
  U: { w: 0.95, lines: [[[0, 1], [0, 0.18], [0.2, 0], [0.8, 0], [1, 0.18], [1, 1]]] },
  V: { w: 1, lines: [[[0, 1], [0.5, 0], [1, 1]]] },
  W: { w: 1.3, lines: [[[0, 1], [0.25, 0], [0.5, 0.65], [0.75, 0], [1, 1]]] },
  X: { w: 0.95, lines: [[[0, 1], [1, 0]], [[0, 0], [1, 1]]] },
  Y: { w: 0.95, lines: [[[0, 1], [0.5, 0.5], [1, 1]], [[0.5, 0.5], [0.5, 0]]] },
  Z: { w: 0.9, lines: [[[0, 1], [1, 1], [0, 0], [1, 0]]] },
  "0": { w: 0.8, lines: [O] },
  "1": { w: 0.6, lines: [[[0.1, 0.78], [0.6, 1], [0.6, 0]]] },
  "2": { w: 0.8, lines: [[[0.05, 0.8], [0.25, 1], [0.75, 1], [0.95, 0.8], [0.95, 0.62], [0.05, 0], [0.95, 0]]] },
  "3": { w: 0.8, lines: [[[0.05, 0.85], [0.25, 1], [0.75, 1], [0.95, 0.82], [0.95, 0.66], [0.72, 0.52], [0.35, 0.52]], [[0.72, 0.52], [0.95, 0.38], [0.95, 0.18], [0.75, 0], [0.25, 0], [0.05, 0.15]]] },
  "4": { w: 0.85, lines: [[[0.72, 0], [0.72, 1], [0, 0.32], [1, 0.32]]] },
  "5": { w: 0.8, lines: [[[0.95, 1], [0.1, 1], [0.05, 0.55], [0.75, 0.55], [0.95, 0.38], [0.95, 0.17], [0.75, 0], [0.25, 0], [0.05, 0.15]]] },
  "6": { w: 0.8, lines: [[[0.9, 0.88], [0.72, 1], [0.25, 1], [0.05, 0.8], [0.05, 0.18], [0.25, 0], [0.75, 0], [0.95, 0.18], [0.95, 0.4], [0.75, 0.56], [0.05, 0.56]]] },
  "7": { w: 0.8, lines: [[[0, 1], [1, 1], [0.35, 0]]] },
  "8": { w: 0.8, lines: [[[0.25, 0.53], [0.08, 0.68], [0.08, 0.85], [0.25, 1], [0.75, 1], [0.92, 0.85], [0.92, 0.68], [0.75, 0.53], [0.25, 0.53], [0.05, 0.38], [0.05, 0.15], [0.25, 0], [0.75, 0], [0.95, 0.15], [0.95, 0.38], [0.75, 0.53]]] },
  "9": { w: 0.8, lines: [[[0.95, 0.44], [0.05, 0.44], [0.05, 0.82], [0.25, 1], [0.75, 1], [0.95, 0.82], [0.95, 0.2], [0.75, 0], [0.28, 0], [0.1, 0.12]]] },
  "-": { w: 0.5, lines: [[[0.05, 0.45], [0.95, 0.45]]] },
  ".": { w: 0.2, lines: [[[0.5, 0], [0.5, 0.05]]] },
  "|": { w: 0.2, lines: [[[0.5, 0], [0.5, 1]]] },
  " ": { w: 0.45, lines: [] },
};

/** The marks a letter may carry over it: the hacek (C with caron) and the acute. */
const ACCENTS: Record<string, { base: string; mark: ReadonlyArray<Pt> }> = {
  "\u010C": { base: "C", mark: [[0.28, 1.32], [0.5, 1.16], [0.72, 1.32]] },
  "\u0158": { base: "R", mark: [[0.25, 1.32], [0.47, 1.16], [0.69, 1.32]] },
  "\u0160": { base: "S", mark: [[0.28, 1.32], [0.5, 1.16], [0.72, 1.32]] },
  "\u017D": { base: "Z", mark: [[0.28, 1.32], [0.5, 1.16], [0.72, 1.32]] },
  "\u011A": { base: "E", mark: [[0.25, 1.32], [0.47, 1.16], [0.69, 1.32]] },
  "\u00C9": { base: "E", mark: [[0.4, 1.14], [0.72, 1.34]] },
  "\u00C1": { base: "A", mark: [[0.42, 1.14], [0.74, 1.34]] },
  "\u00CD": { base: "I", mark: [[0.3, 1.14], [0.75, 1.34]] },
  "\u00DD": { base: "Y", mark: [[0.4, 1.14], [0.72, 1.34]] },
};

export interface LetterStyle {
  /** The glyph box's width over its height for a glyph of width 1 (the font's proportion). */
  width?: number;
  /** A stroke's thickness over the height. */
  weight?: number;
  /** The gap between glyphs over the height. */
  gap?: number;
  /** The forward lean: u moves by `slant` times the height above the baseline. */
  slant?: number;
}

const DEFAULTS: Required<LetterStyle> = { width: 0.62, weight: 0.16, gap: 0.16, slant: 0 };

function glyphOf(ch: string): { glyph: Glyph; mark?: ReadonlyArray<Pt> } {
  const up = ch.toUpperCase();
  const accent = ACCENTS[up];
  if (accent) return { glyph: GLYPHS[accent.base]!, mark: accent.mark };
  const glyph = GLYPHS[up];
  if (!glyph) throw new Error(`no glyph for ${JSON.stringify(ch)}`);
  return { glyph };
}

/** The width of `text` `h` high in `style`, from the first glyph's left edge to the last one's right. */
export function wordWidth(text: string, h: number, style: LetterStyle = {}): number {
  const s = { ...DEFAULTS, ...style };
  const chars = [...text];
  return chars.reduce((a, ch) => a + glyphOf(ch).glyph.w * s.width * h, 0) + Math.max(0, chars.length - 1) * s.gap * h;
}

/** A bar from a to b, t thick, its ends capped square (`capA`, `capB`) or flush: two triangles. */
function bar(a: Pt, b: Pt, t: number, capA: boolean, capB: boolean): Array<[number, number]> {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [(dx / len) * (t / 2), (dy / len) * (t / 2)];
  const [nx, ny] = [-uy, ux];
  const [ea, eb] = [capA ? 1 : 0, capB ? 1 : 0];
  const p0: [number, number] = [a[0] - ea * ux + nx, a[1] - ea * uy + ny];
  const p1: [number, number] = [b[0] + eb * ux + nx, b[1] + eb * uy + ny];
  const p2: [number, number] = [b[0] + eb * ux - nx, b[1] + eb * uy - ny];
  const p3: [number, number] = [a[0] - ea * ux - nx, a[1] - ea * uy - ny];
  return [p0, p1, p2, p0, p2, p3];
}

/**
 * A bevel joint where bars a -> p and p -> b meet: the wedge their ends leave
 * open on the outside of the bend (on the inside the bars overlap), t thick.
 */
function joint(a: Pt, p: Pt, b: Pt, t: number): Array<[number, number]> {
  const normal = (q: Pt, r: Pt): [number, number] => {
    const dx = r[0] - q[0], dy = r[1] - q[1], len = Math.hypot(dx, dy) || 1;
    return [(-dy / len) * (t / 2), (dx / len) * (t / 2)];
  };
  const [n1, n2] = [normal(a, p), normal(p, b)];
  // a left turn opens on the right (-n), a right turn on the left
  const turn = (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]);
  // a bend of 60 degrees or less leaves a notch under 7 % of the stroke deep: no wedge
  const dot = (p[0] - a[0]) * (b[0] - p[0]) + (p[1] - a[1]) * (b[1] - p[1]);
  if (Math.abs(turn) < 1e-12 || Math.atan2(Math.abs(turn), dot) <= Math.PI / 3 + 1e-9) return [];
  const k = turn > 0 ? -1 : 1;
  return [[p[0], p[1]], [p[0] + k * n1[0], p[1] + k * n1[1]], [p[0] + k * n2[0], p[1] + k * n2[1]]];
}

/**
 * `text` as triangles (u, v), three points a triangle, `h` high (the capitals'
 * height), its baseline at v0 and its first glyph's left edge at u0 as the
 * reader sees it. `flipU` reads it toward -u (a surface seen from its -u side),
 * as cd163.ts's `lettering` does.
 */
export function letters(text: string, u0: number, v0: number, h: number, flipU: boolean, style: LetterStyle = {}): Array<[number, number]> {
  const s = { ...DEFAULTS, ...style };
  const t = s.weight * h;
  const out: Array<[number, number]> = [];
  let cu = 0;
  for (const ch of text) {
    const { glyph, mark } = glyphOf(ch);
    const gw = glyph.w * s.width * h;
    // the strokes' centre lines inset by half a stroke, so the glyph fills its box
    const map = ([x, y]: Pt): Pt => [cu + t / 2 + x * Math.max(0, gw - t), t / 2 + y * (h - t)];
    for (const line of [...glyph.lines, ...(mark ? [mark] : [])]) {
      const pts = line.map(map);
      // a closed line (the O) has no free end; a free end is capped square, a bend is rounded
      const closed = pts.length > 2 && Math.hypot(pts[0]![0] - pts[pts.length - 1]![0], pts[0]![1] - pts[pts.length - 1]![1]) < 1e-9;
      const tris: Array<[number, number]> = [];
      for (let j = 1; j < pts.length; j++) tris.push(...bar(pts[j - 1]!, pts[j]!, t, j === 1 && !closed, j === pts.length - 1 && !closed));
      for (let j = 1; j < pts.length - 1; j++) tris.push(...joint(pts[j - 1]!, pts[j]!, pts[j + 1]!, t));
      if (closed) tris.push(...joint(pts[pts.length - 2]!, pts[0]!, pts[1]!, t));
      for (const [u, v] of tris) {
        const lean = u + s.slant * v;
        out.push([flipU ? u0 - lean : u0 + lean, v0 + v]);
      }
    }
    cu += gw + s.gap * h;
  }
  return out;
}

/**
 * An operator's wordmark painted on a locomotive: its runs of text, each in its
 * own material ("|| REGIO" red, "JET" navy), the style, and where it stands on
 * the sides and the ends. Positions are the reader's: `u` is measured to the
 * reader's right from the middle of the side or the end (on the left side and
 * the front that is -x and -z), so both sides and both ends read alike.
 */
export interface Wordmark {
  runs: ReadonlyArray<readonly [text: string, mat: string]>;
  style?: LetterStyle;
  /** On the sides: the cap height, the baseline and the centre u; no `u` sets it after the side emblem. */
  side?: { h: number; v: number; u?: number };
  /** On the ends: the cap height, the baseline and the centre u. */
  end?: { h: number; v: number; u: number };
}

/** The width of a wordmark's runs `h` high, the runs set one glyph gap apart. */
export function runsWidth(runs: Wordmark["runs"], h: number, style: LetterStyle = {}): number {
  const gap = (style.gap ?? DEFAULTS.gap) * h;
  return runs.reduce((a, [text]) => a + wordWidth(text, h, style), 0) + Math.max(0, runs.length - 1) * gap;
}

/**
 * A wordmark's runs as triangles (u, v) per material, `h` high on the baseline
 * v0: starting at model u `start` (`align` "start") or centred on it, read
 * toward -u when `flipU`.
 */
export function wordmarkAt(runs: Wordmark["runs"], start: number, v0: number, h: number, flipU: boolean, style: LetterStyle = {}, align: "start" | "centre" = "start"): Array<{ mat: string; tris: Array<[number, number]> }> {
  const gap = (style.gap ?? DEFAULTS.gap) * h;
  const dir = flipU ? -1 : 1;
  let u = align === "centre" ? start - (dir * runsWidth(runs, h, style)) / 2 : start;
  const out: Array<{ mat: string; tris: Array<[number, number]> }> = [];
  for (const [text, mat] of runs) {
    out.push({ mat, tris: letters(text, u, v0, h, flipU, style) });
    u += dir * (wordWidth(text, h, style) + gap);
  }
  return out;
}
