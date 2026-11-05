// The streamlined carbody kit: a full-width locomotive or car body lofted
// through vertical slices (sliceBody.ts) from a few tables -- the flat body's
// section and, at either end, a nose's plan, crown, shoulder, belly and apron as
// functions of the distance from its tip -- with the skirt cut away over the
// trucks and the paint chosen per face by a livery function of its place on the
// body. Used by the North American carbody locomotives and trains
// (usCarbodies.ts: EMD F7, GE P42DC, Siemens ALC-42, PRR GG1, the Acela) and
// meant for any streamliner. d is metres back from the body's +X end, as in
// sliceBody.ts. See docs/models/us-carbodies.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import { lerp, type Pt } from "./sliceLoft.ts";
import { drawShell, edgeRole, halfSlice, type SliceBody, type SliceDoorway } from "./sliceBody.ts";
import { block, side } from "./vehicleParts.ts";
import { paint } from "./dieselParts.ts";
import { US_PALETTE } from "./usHoodKit.ts";

/** A nose: tables over d from its tip; past a table's last row the body's own value holds. */
export interface NoseShape {
  /** The plan reaches the full half width this far from the tip. */
  len: number;
  /** The plan's half width at the tip, as a fraction of the full one (a blunt nose). */
  tip: number;
  /** The plan's curve: 2 an ellipse, larger blunter (a superellipse). */
  power: number;
  /** Crown, shoulder and belly heights. */
  C: Pt[];
  S: Pt[];
  Y?: Pt[];
  /** The skirt's top (the lower body's foot) and the skirt's bottom: an apron or pilot. */
  A?: Pt[];
  B?: Pt[];
}

export interface CarbodySpec {
  /** The body from its +X tip or wall (d = 0) to its -X tip or wall. */
  length: number;
  /** Half width at the belly; the belly, shoulder and crown heights; the side's lean to the shoulder; the roof arc's segments. */
  W: number;
  Y: number;
  S: number;
  C: number;
  lean: number;
  arc: number;
  /** The skirt's bottom and half width there; its top (the lower body's foot) and half width there. */
  B: number;
  wl: number;
  A: number;
  wa: number;
  front?: NoseShape;
  rear?: NoseShape;
  /** Spans of d where the skirt is cut up to its top: over the trucks. */
  cuts?: ReadonlyArray<readonly [number, number]>;
  /** Heights of the paint edges on the side, between belly and shoulder, bottom up. */
  edges: readonly number[];
  /** Station spacing along the flat body (default 1.0 m) and in a nose (default 0.2 m). */
  step?: number;
  noseStep?: number;
}

/** What a face is: its slice's region (sliceBody.ts edgeRole) or an end cap. */
export type Region = "bottom" | "skirt" | "lower" | "side" | "arc" | "cap";

/** Paint of the face at d whose middle is at height y, in the given region. */
export type Painter = (d: number, y: number, region: Region) => string;

const plan = (n: NoseShape, d: number): number => {
  const t = Math.min(1, Math.max(0, d / n.len));
  return Math.max(n.tip, Math.pow(Math.max(0, 1 - Math.pow(1 - t, n.power)), 1 / n.power));
};

const lastD = (t?: Pt[]) => (t && t.length ? t[t.length - 1]![0] : -1);

/** The value at d: the front nose's table near the front, the rear's near the rear (the lower of both where they meet), else the body's. */
function along(s: CarbodySpec, d: number, base: number, pick: (n: NoseShape) => Pt[] | undefined): number {
  let v = Infinity;
  const f = s.front && pick(s.front), r = s.rear && pick(s.rear);
  if (f && d <= lastD(f)) v = Math.min(v, lerp(f, d));
  if (r && s.length - d <= lastD(r)) v = Math.min(v, lerp(r, s.length - d));
  return v === Infinity ? base : v;
}

/** The body as a SliceBody (sliceBody.ts). */
export function carbody(s: CarbodySpec): SliceBody {
  const L = s.length;
  const w = (d: number) => {
    let k = 1;
    if (s.front) k = Math.min(k, plan(s.front, d));
    if (s.rear) k = Math.min(k, plan(s.rear, L - d));
    return Math.max(0.03, s.W * k);
  };
  const A = (d: number) => along(s, d, s.A, (n) => n.A);
  const cut = (d: number) => (s.cuts ?? []).some(([a, b]) => d >= a - 1e-9 && d <= b + 1e-9);
  const B = (d: number) => (cut(d) ? A(d) : along(s, d, s.B, (n) => n.B));
  const Y = (d: number) => along(s, d, s.Y, (n) => n.Y);
  const S = (d: number) => along(s, d, s.S, (n) => n.S);
  const C = (d: number) => Math.max(S(d) + 0.02, along(s, d, s.C, (n) => n.C));
  const step = s.step ?? 1.0, nstep = s.noseStep ?? 0.2;
  const st = new Set<number>([0, L]);
  const noseLen = (n?: NoseShape) => (n ? Math.max(n.len, lastD(n.C), lastD(n.S), lastD(n.Y), lastD(n.A), lastD(n.B)) : 0);
  const fl = noseLen(s.front), rl = noseLen(s.rear);
  for (let d = 0; d <= fl + 1e-9; d += nstep) st.add(Math.round(d * 1000) / 1000);
  for (let d = 0; d <= rl + 1e-9; d += nstep) st.add(Math.round((L - d) * 1000) / 1000);
  for (let d = fl; d < L - rl; d += step) st.add(Math.round(d * 1000) / 1000);
  for (const n of [s.front, s.rear]) {
    if (!n) continue;
    const flip = n === s.rear;
    for (const t of [n.C, n.S, n.Y, n.A, n.B]) for (const [d] of t ?? []) st.add(Math.round((flip ? L - d : d) * 1000) / 1000);
  }
  // a cut's two ends: the skirt drops just outside them
  for (const [a, b] of s.cuts ?? []) for (const d of [a - 0.001, a, b, b + 0.001]) st.add(Math.round(d * 1000) / 1000);
  const stations = [...st].filter((d) => d >= 0 && d <= L).sort((a, b) => a - b);
  return {
    length: L,
    B, wl: (d) => Math.min(s.wl, 0.98 * w(d)), A, wa: (d) => Math.min(s.wa, 0.995 * w(d)),
    Y, w, S, C,
    edges: (d) => s.edges.map((y) => Math.min(S(d), Math.max(Y(d), y))),
    lean: s.lean, arc: s.arc, stations,
  };
}

/** The lofted shell, every face painted by `paint`; the ends capped where they are flat walls, open over `doorways`. */
export function carbodyShell(m: MeshBuilder, b: SliceBody, X: (d: number) => number, paint: Painter, caps: { front: boolean; rear: boolean }, doorways: readonly SliceDoorway[] = []): void {
  const mat = (d: number, k: number) => {
    const h = halfSlice(b, d);
    const y = (h[k]![1] + h[k + 1]![1]) / 2;
    return paint(d, y, edgeRole(b, k).kind);
  };
  const bands = (d: number): Array<[number, number, string]> => {
    const ys = [...new Set(halfSlice(b, d).map((p) => p[1]))].sort((p, q) => p - q);
    const out: Array<[number, number, string]> = [];
    for (let i = 0; i + 1 < ys.length; i++) {
      const [y0, y1] = [ys[i]!, ys[i + 1]!];
      if (y1 - y0 < 1e-6) continue;
      const mt = paint(d, (y0 + y1) / 2, "cap");
      const last = out[out.length - 1];
      if (last && last[2] === mt) last[1] = y1;
      else out.push([y0, y1, mt]);
    }
    return out;
  };
  drawShell(m, b, X, mat, bands, caps, doorways);
}

/** A horizontal band painter: by height, `under` below the skirt's top, `roof` over the shoulder. */
export function bandPainter(bands: ReadonlyArray<readonly [number, number, string]>, roof: string, under: string, skirt: string): Painter {
  return (_d, y, region) => {
    if (region === "bottom") return under;
    if (region === "skirt") return skirt;
    if (region === "arc") return roof;
    for (const [a, b, mt] of bands) if (y >= a - 1e-9 && y < b - 1e-9) return mt;
    return bands[bands.length - 1]![2];
  };
}

/** The materials a carbody shares (the US palette and a pantograph's). */
export const CARBODY_PALETTE: Record<string, MaterialSpec> = {
  ...US_PALETTE,
  cabGlass: { color: "#1d252e", metallic: 0.25, roughness: 0.1, glass: true },
  frameSilver: paint("#a9adb1", 0.35),
  pantograph: paint("#5a5d63", 0.6),
  carbon: paint("#2b2b2b", 0.8),
  insulator: paint("#c8c8c0", 0.4),
  bellows: paint("#2a2b2d", 0.9),
  diaphragm: paint("#2f3134", 0.85),
};

/** A pilot (cowcatcher plate) under end e: its face at |x| = face, from y0 up to y1, half width hw, leaning back `lean`. */
export function pilotPlate(m: MeshBuilder, mat: string, e: number, face: number, y0: number, y1: number, hw: number, lean = 0.25, depth = 0.4): void {
  const sec: Array<[number, number]> = e > 0
    ? [[face - depth, y0], [face - lean, y0], [face, y1], [face - depth, y1]]
    : [[-face + depth, y0], [-face + depth, y1], [-face, y1], [-face + lean, y0]];
  m.sweep(mat, "z", sec, -hw, sec, hw);
}

/** A flat end wall's diaphragm and door at x (e: +1 the +X end): a rubber frame around the door, `w` half wide. */
export function endDiaphragm(m: MeshBuilder, e: number, x: number, y0: number, y1: number, w = 0.55): void {
  const [a, b] = e > 0 ? [x, x + 0.16] : [x - 0.16, x];
  for (const sd of [-1, 1]) block(m, "diaphragm", a, b, y0, y1, ...side(sd, w, w + 0.18));
  block(m, "diaphragm", a, b, y1 - 0.16, y1, -w, w);
}

/** Round lamps on a flat end face at |x| = face, facing e: housing and lens. */
export function faceLamps(m: MeshBuilder, e: number, face: number, lamps: ReadonlyArray<readonly [z: number, y: number, r: number, lens: string]>): void {
  for (const [z, y, r, lens] of lamps) {
    const [a, b] = e > 0 ? [face - 0.01, face + 0.05] : [-face - 0.05, -face + 0.01];
    m.sweep("black", "x", ngon(12, r + 0.035, 0, z, y), a, ngon(12, r + 0.035, 0, z, y), b);
    const [c, dd] = e > 0 ? [face + 0.05, face + 0.07] : [-face - 0.07, -face - 0.05];
    m.sweep(lens, "x", ngon(12, r, 0, z, y), c, ngon(12, r, 0, z, y), dd);
  }
}
