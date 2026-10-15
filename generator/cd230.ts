// The "laminatka": the Skoda 47E family of 25 kV AC Bo'Bo' electric locomotives
// with a glass-fibre body -- CSD S 489.0 / CD 230 and S 499.0 / CD 240, and the
// CD 340 rebuilt from the 240 for Austria -- as one design with a `livery`
// parameter. Reconstructed from the native JT7 XML and BMPs of four vlakosimdb
// models (assets/cd-230/native) and photographs (assets/cd-230/*.jpg).
//
// Source coordinates: (x, y, z) -> (8.2 - x, y, z), metres. The flip of x puts
// the source's raised "zadni" (rear) pantograph at -X, the repository's rear.
// 16.44 m over the buffers, a 15.20 m body, 7.80 m between the bogie pivots,
// 2.80 m bogie wheelbase, 1.25 m wheels (assets/cd-230/SOURCES.md).
//
// The body is lofted in plan: at every height a ring whose two ends are the
// rounded glass-fibre noses (the XML plan, a superelliptic quarter meeting the
// sides tangentially) and whose sides lean in above the waist. The face is laid
// on that curved skin by (s, y) patches -- s the arc length around the nose from
// its centre line -- so the wrap-round windscreen, the oval lip grilles and the
// lamps follow the surface instead of floating on a flat plane.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { CD163_PALETTE, bandAt, coil, lettering, letteringWidth, runningNumber, tubeX, type Band } from "./cd163.ts";

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, metallic: 0.1, roughness });

const PALETTE: Record<string, MaterialSpec> = {
  ...CD163_PALETTE,
  roof: { color: "#7a7d7d", roughness: 0.75 },
  rim: c("#9da2a4", 0.45), // the windscreen surround and the side windows' frames
  silver: { color: "#b9c6cc", metallic: 0.3, roughness: 0.4 },
  louvre: { color: "#2e3134", roughness: 0.8 },
  slat: { color: "#8f9496", roughness: 0.6 },
  pantograph: { color: "#c08a1c", metallic: 0.2, roughness: 0.6 },
  breaker: c("#b0201c"),
  olive: c("#6f7420", 0.6),
};

/**
 * A livery of the laminatka body. Bands run from 1.2 m (the top of the frame)
 * up to the roof; `side` covers the machine room's walls, `cab` the cab
 * sections of the side walls (from the door to the nose), `face` the rounded
 * nose itself, lip included.
 */
export interface Cd230Livery {
  title: string;
  /** The vlakosimdb directory under db/train/loco/electric. */
  source: string;
  number: string;
  numberSource: string;
  palette?: Record<string, MaterialSpec>;
  side: readonly Band[];
  cab: readonly Band[];
  face: readonly Band[];
  /** The frame from 0.9 to 1.2 m: the side skirt and the buffer beam. */
  frame: string;
  plough: string;
  /** A hazard strip along the plough's lower edge. */
  ploughStripe?: string;
  /** The windscreen's centre pillar. */
  pillar: string;
  /** The surrounds of the vents over the windscreen. */
  ventRim: string;
  /** Twin small lenses (the original 230s) or one large one in the roof-edge housing. */
  headlamp: "twin" | "single";
  /** The 240 family's roof box between the breaker and the front pantograph. */
  roofBox: boolean;
}

// Every livery paints the windscreen surround grey (`rim`, 2.5 to 3.62 m) and
// the hood over it in its upper body colour up to the roof (photographs; the
// native front BMP paints the hood roof grey).
const face = (bands: Band[], hood: string): Band[] => [...bands, [2.5, 3.62, "rim"], [3.62, 3.8, hood], [3.8, 4.1, "roof"]];

export const CD230_LIVERIES = {
  cd230: {
    title: "CD 230 025, red and yellow",
    source: "cd_230",
    number: runningNumber("230", "025"),
    numberSource: "230 025-9, photographed in this livery (photo-230-025-front.jpg)",
    palette: { red: c("#b8170f"), yellow: c("#e9bf14") },
    side: [[1.2, 1.5, "red"], [1.5, 1.6, "silver"], [1.6, 1.8, "yellow"], [1.8, 1.9, "red"], [1.9, 2.2, "silver"], [2.2, 2.3, "red"], [2.3, 2.5, "yellow"], [2.5, 3.8, "red"], [3.8, 4.1, "roof"]],
    cab: [[1.2, 1.3, "silver"], [1.3, 1.8, "yellow"], [1.8, 1.9, "red"], [1.9, 2.2, "silver"], [2.2, 2.3, "red"], [2.3, 2.5, "yellow"], [2.5, 3.8, "red"], [3.8, 4.1, "roof"]],
    face: face([[1.2, 1.3, "silver"], [1.3, 1.8, "yellow"], [1.8, 1.9, "red"], [1.9, 2.2, "silver"], [2.2, 2.3, "red"], [2.3, 2.5, "yellow"]], "red"),
    frame: "red",
    plough: "darkRed",
    pillar: "yellow",
    ventRim: "silver",
    headlamp: "twin",
    roofBox: false,
  },
  cd240: {
    title: "CD 240 048, cream and red, yellow band",
    source: "cd_240",
    number: runningNumber("240", "048"),
    numberSource: "illustrative, a unit of the class; the native plate does not resolve digits",
    palette: { red: c("#b8170f"), cream: c("#ece9bc"), yellow: c("#ecc904"), orange: c("#dc9e08") },
    side: [[1.2, 1.5, "red"], [1.5, 1.6, "silver"], [1.6, 1.9, "red"], [1.9, 2.1, "orange"], [2.1, 2.3, "yellow"], [2.3, 3.8, "cream"], [3.8, 4.1, "roof"]],
    cab: [[1.2, 1.3, "silver"], [1.3, 1.9, "red"], [1.9, 2.1, "orange"], [2.1, 2.3, "yellow"], [2.3, 3.8, "cream"], [3.8, 4.1, "roof"]],
    face: face([[1.2, 1.3, "silver"], [1.3, 1.9, "red"], [1.9, 2.1, "orange"], [2.1, 2.3, "yellow"], [2.3, 2.5, "cream"]], "cream"),
    frame: "red",
    plough: "darkRed",
    pillar: "cream",
    ventRim: "cream",
    headlamp: "single",
    roofBox: true,
  },
  cd240No047: {
    title: "CD 240 047, red and cream, red and white stripes",
    source: "cd_240_047",
    number: runningNumber("240", "047"),
    numberSource: "the vlakosimdb model's name",
    palette: { red: c("#d8100c"), cream: c("#e0d6ae"), dullRed: c("#bc4f4b"), white: c("#eef3f4") },
    side: [[1.2, 1.5, "red"], [1.5, 1.6, "silver"], [1.6, 1.8, "cream"], [1.8, 1.9, "dullRed"], [1.9, 2.2, "white"], [2.2, 2.3, "dullRed"], [2.3, 2.5, "cream"], [2.5, 3.8, "red"], [3.8, 4.1, "roof"]],
    cab: [[1.2, 1.3, "silver"], [1.3, 1.8, "cream"], [1.8, 1.9, "dullRed"], [1.9, 2.2, "white"], [2.2, 2.3, "dullRed"], [2.3, 2.5, "cream"], [2.5, 3.8, "red"], [3.8, 4.1, "roof"]],
    face: face([[1.2, 1.3, "silver"], [1.3, 1.8, "cream"], [1.8, 1.9, "dullRed"], [1.9, 2.3, "red"], [2.3, 2.5, "cream"]], "red"),
    frame: "red",
    plough: "red",
    ploughStripe: "hazard",
    pillar: "cream",
    ventRim: "cream",
    headlamp: "single",
    roofBox: true,
  },
  cd340: {
    title: "CD 340 062, blue and cream",
    source: "cd_340",
    number: runningNumber("340", "062"),
    numberSource: "340 062-9, photographed in this livery (photo-340-062-three-quarter.jpg)",
    palette: { blue: c("#1068b4"), cream: c("#e0d6ae"), dullRed: c("#bc4f4b"), white: c("#eef3f4"), red: c("#c0281c"), salmon: c("#e48a7c") },
    side: [[1.2, 1.5, "blue"], [1.5, 1.6, "red"], [1.6, 1.8, "cream"], [1.8, 1.9, "dullRed"], [1.9, 2.2, "white"], [2.2, 2.3, "dullRed"], [2.3, 2.5, "cream"], [2.5, 3.8, "blue"], [3.8, 4.1, "roof"]],
    cab: [[1.2, 1.3, "red"], [1.3, 1.8, "cream"], [1.8, 1.9, "dullRed"], [1.9, 2.2, "white"], [2.2, 2.3, "dullRed"], [2.3, 2.5, "cream"], [2.5, 3.8, "blue"], [3.8, 4.1, "roof"]],
    face: face([[1.2, 1.3, "red"], [1.3, 1.8, "cream"], [1.8, 1.9, "dullRed"], [1.9, 2.1, "red"], [2.1, 2.3, "salmon"], [2.3, 2.5, "cream"]], "blue"),
    frame: "blue",
    plough: "blue",
    ploughStripe: "hazard",
    pillar: "cream",
    ventRim: "cream",
    headlamp: "single",
    roofBox: true,
  },
} as const satisfies Record<string, Cd230Livery>;

export const CD230_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cd230",
  values: Object.entries(CD230_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];

/** The default livery's running number. */
export const CD230_NUMBER = CD230_LIVERIES.cd230.number;

const SHARED: Record<string, MaterialSpec> = {
  darkRed: c("#7c120e", 0.6),
  hazard: c("#e8b818"),
};

// ---------------------------------------------------------------------------
// The body's profiles (XML alongx / alongy / alongz, see SOURCES.md)

const Y_FRAME = 0.9; // the frame's lower edge
const Y_SHELL = 1.2; // the frame's top, where the glass-fibre shell starts
const Y_ROOF = 4.0; // the flat crown of the roof
const SETBACK = 0.4; // the nose's plan: the corners stand 0.4 m behind its centre
const CAB_X = 6.3; // the cab sections (nose paint) run from here to the noses: the native silver strip ends at source x = 1.9
const LIP = [1.9, 1.94, 2.18, 2.3] as const; // the moulded lip around the body

function lerpTable(table: ReadonlyArray<readonly [number, number]>, y: number): number {
  if (y <= table[0]![0]) return table[0]![1];
  for (let i = 1; i < table.length; i++) {
    const [y0, v0] = table[i - 1]!;
    const [y1, v1] = table[i]!;
    if (y <= y1) return v0 + ((v1 - v0) * (y - y0)) / (y1 - y0);
  }
  return table[table.length - 1]![1];
}
// The nose's centre line: the lower face leans out to the lip, the lip stands
// 10 cm proud (XML), the windscreen rakes back, the hood rolls over into the roof.
const TIP: ReadonlyArray<readonly [number, number]> = [
  [1.2, 7.5], [1.9, 7.6], [1.94, 7.7], [2.18, 7.7], [2.3, 7.6], [3.65, 7.45], [3.7, 7.42], [3.8, 7.3], [3.9, 7.02], [4.0, 6.6],
];
// Half the body's width: 3.0 m to the waist, leaning in to 2.8 m at 3.4 m and
// 2.4 m at the cant; the lip stands 2.5 cm proud along the sides.
const HALF: ReadonlyArray<readonly [number, number]> = [
  [1.2, 1.5], [1.9, 1.5], [1.94, 1.525], [2.18, 1.525], [2.3, 1.5], [3.4, 1.4], [3.7, 1.22], [3.8, 1.15], [3.9, 0.98], [4.0, 0.6],
];
export const tipX = (y: number): number => lerpTable(TIP, y);
export const halfWidth = (y: number): number => lerpTable(HALF, y);
/** The nose's setback at t = |z| / halfWidth: a superelliptic quarter, tangent to the side at t = 1. */
const setbackAt = (t: number): number => SETBACK * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.2))));

// The shell's samples across a nose, dense where it turns into the side.
const NOSE_T = [0, 0.2, 0.38, 0.52, 0.64, 0.74, 0.82, 0.88, 0.93, 0.965, 0.99, 1];

type Region = "front" | "rear" | "cab" | "side";
interface RingPoint {
  x: number;
  z: number;
  /** The region of the edge from this point to the next. */
  region: Region;
  /** The side (+1 right, -1 left) or end (+1 front) the edge belongs to. */
  sign: number;
}
/** The shell's plan at height y, counter-clockwise from above like every ring here. */
function shellRing(y: number): RingPoint[] {
  const tip = tipX(y), hw = halfWidth(y);
  const corner = tip - SETBACK;
  const cab = Math.min(CAB_X, corner - 0.05);
  const nose = (e: number, t: number, zs: number): [number, number] => {
    const f = NOSE_F[NOSE_T.indexOf(t)]!;
    const q = alongNose(y, f * noseArc(y));
    return [e * q.x, zs * q.z];
  };
  const out: RingPoint[] = [];
  const push = (p: [number, number], region: Region, sign: number) => out.push({ x: p[0], z: p[1], region, sign });
  for (const t of NOSE_T.slice(0, -1)) push(nose(1, t, -1), "front", 1);
  push(nose(1, 1, -1), "cab", -1);
  push([cab, -hw], "side", -1);
  push([-cab, -hw], "cab", -1);
  for (const t of [...NOSE_T].reverse().slice(0, -1)) push(nose(-1, t, -1), "rear", -1);
  for (const t of NOSE_T.slice(0, -1)) push(nose(-1, t, 1), "rear", -1);
  push(nose(-1, 1, 1), "cab", 1);
  push([-cab, hw], "side", 1);
  push([cab, hw], "cab", 1);
  for (const t of [...NOSE_T].reverse().slice(0, -1)) push(nose(1, t, 1), "front", 1);
  return out;
}

/** The nose's plan curve at height y, as cumulative arc lengths from its centre line. */
function noseCurve(y: number): { pts: Array<[number, number]>; arc: number[] } {
  const tip = tipX(y), hw = halfWidth(y);
  const pts: Array<[number, number]> = [];
  const arc: number[] = [];
  const N = 64;
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    pts.push([tip - setbackAt(t), t * hw]);
    arc.push(k === 0 ? 0 : arc[k - 1]! + Math.hypot(pts[k]![0] - pts[k - 1]![0], pts[k]![1] - pts[k - 1]![1]));
  }
  return { pts, arc };
}
/** The arc length from the nose's centre line to the start of the straight side, at height y. */
export function noseArc(y: number): number {
  const { arc } = noseCurve(y);
  return arc[arc.length - 1]!;
}
/** The point arc length `a` from the nose's centre line at height y (+z half), past the nose along the side, with its outward normal. */
function alongNose(y: number, a: number): { x: number; z: number; nx: number; nz: number } {
  const { pts, arc } = noseCurve(y);
  const last = arc.length - 1;
  if (a >= arc[last]!) return { x: pts[last]![0] - (a - arc[last]!), z: pts[last]![1], nx: 0, nz: 1 };
  let k = 1;
  while (arc[k]! < a) k++;
  const [p0, p1] = [pts[k - 1]!, pts[k]!];
  const f = (a - arc[k - 1]!) / (arc[k]! - arc[k - 1]!);
  const [tx, tz] = [p1[0] - p0[0], p1[1] - p0[1]];
  const l = Math.hypot(tx, tz);
  return { x: p0[0] + f * tx, z: p0[1] + f * tz, nx: tz / l, nz: -tx / l };
}
// Around the nose, positions are arc lengths measured at the windscreen's
// height and scaled at every other height with the nose's own arc: the shell's
// samples and the panels' columns then join the same fractions of the curve
// from height to height, so a panel lies on the skin even where the corner
// tightens toward the roof.
const REF_Y = 3.0;
export const REF_ARC = noseArc(REF_Y);
const NOSE_F = NOSE_T.map((t) => {
  const { arc } = noseCurve(REF_Y);
  return arc[Math.round(t * (arc.length - 1))]! / REF_ARC;
});
/**
 * The point `d` off the skin at end `e` (+1 front), `s` around the nose from
 * its centre line in reference arc length (s > 0 toward +z; past the nose it
 * runs back along the side), height y; and the skin's horizontal outward normal.
 */
function onNose(e: number, s: number, y: number, d: number): { p: Vec3; n: Vec3 } {
  const zs = s < 0 ? -1 : 1;
  const q = alongNose(y, (Math.abs(s) * noseArc(y)) / REF_ARC);
  return { p: [e * (q.x + d * q.nx), y, zs * (q.z + d * q.nz)], n: [e * q.nx, 0, zs * q.nz] };
}

type SY = [number, number];
/** The heights where the skin's profile (TIP, HALF) changes its slope. */
const PROFILE_KINKS = [...new Set([...TIP, ...HALF].map(([y]) => y))].sort((a, b) => a - b);
/** A rounded rectangle in (s, y), counter-clockwise. */
function roundRect(s0: number, s1: number, y0: number, y1: number, r: number, n = 3): SY[] {
  const rr = Math.min(r, (s1 - s0) / 2, (y1 - y0) / 2);
  if (rr <= 1e-6) return [[s0, y0], [s1, y0], [s1, y1], [s0, y1]];
  const out: SY[] = [];
  const corner = (cs: number, cy: number, a0: number) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (Math.PI / 2) * (i / n);
      out.push([cs + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
  };
  corner(s1 - rr, y0 + rr, -Math.PI / 2);
  corner(s1 - rr, y1 - rr, 0);
  corner(s0 + rr, y1 - rr, Math.PI / 2);
  corner(s0 + rr, y0 + rr, Math.PI);
  return out;
}
/** The y span of a convex (s, y) outline at s. */
function spanAt(poly: SY[], s: number): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i]!, poly[(i + 1) % poly.length]!];
    if ((a[0] - s) * (b[0] - s) > 0 || a[0] === b[0]) {
      if (a[0] === s) [lo, hi] = [Math.min(lo, a[1]), Math.max(hi, a[1])];
      continue;
    }
    const y = a[1] + ((s - a[0]) * (b[1] - a[1])) / (b[0] - a[0]);
    [lo, hi] = [Math.min(lo, y), Math.max(hi, y)];
  }
  return [lo, hi];
}
/**
 * A panel laid on the nose: the convex (s, y) outline from `d0` (sunk into the
 * skin) out to `d1`, its face cut into column strips that follow the curve and
 * walled round its edge. The triangles go out in five one-sided groups -- the
 * face and the walls facing up, down, and toward either end -- each wound to
 * its group's direction.
 */
function nosePanel(m: MeshBuilder, mat: string, e: number, poly: SY[], d0: number, d1: number, step = 0.12): void {
  const s0 = Math.min(...poly.map((p) => p[0])), s1 = Math.max(...poly.map((p) => p[0]));
  const cols = new Set<number>(poly.map((p) => p[0]));
  const k = Math.ceil((s1 - s0) / step);
  for (let i = 0; i <= k; i++) cols.add(s0 + ((s1 - s0) * i) / k);
  const ss = [...cols].sort((a, b) => a - b).filter((s, i, a) => i === 0 || s - a[i - 1]! > 1e-4);
  const spans = ss.map((s) => spanAt(poly, s));
  const at = (s: number, y: number, d: number) => onNose(e, s, y, d).p;
  const front: Vec3[] = [], up: Vec3[] = [], down: Vec3[] = [];
  const quad = (out: Vec3[], a: Vec3, b: Vec3, c: Vec3, d: Vec3) => out.push(a, b, c, a, c, d);
  for (let i = 1; i < ss.length; i++) {
    const [a, b] = [ss[i - 1]!, ss[i]!];
    const [[la, ha], [lb, hb]] = [spans[i - 1]!, spans[i]!];
    // split where the skin's profile kinks, so the face does not cut through it
    const ys = PROFILE_KINKS.filter((h) => h > Math.max(la, lb) + 1e-4 && h < Math.min(ha, hb) - 1e-4);
    const rows: Array<[number, number]> = [[la, lb], ...ys.map((h): [number, number] => [h, h]), [ha, hb]];
    for (let r = 1; r < rows.length; r++) {
      const [[ya0, yb0], [ya1, yb1]] = [rows[r - 1]!, rows[r]!];
      quad(front, at(a, ya0, d1), at(b, yb0, d1), at(b, yb1, d1), at(a, ya1, d1));
    }
    quad(down, at(a, la, d0), at(b, lb, d0), at(b, lb, d1), at(a, la, d1));
    quad(up, at(a, ha, d0), at(b, hb, d0), at(b, hb, d1), at(a, ha, d1));
  }
  const mid = onNose(e, (s0 + s1) / 2, (spans[0]![0] + spans[0]![1]) / 2, 0).n;
  m.facets(mat, front, mid);
  m.facets(mat, up, [0, 1, 0]);
  m.facets(mat, down, [0, -1, 0]);
  // the end walls, facing along the skin away from the panel
  for (const [i, dir] of [[0, -1], [ss.length - 1, 1]] as const) {
    const [lo, hi] = spans[i]!;
    if (hi - lo < 1e-4) continue;
    const s = ss[i]!;
    const p = onNose(e, s, (lo + hi) / 2, 0);
    // the skin's tangent toward increasing s
    const q = onNose(e, s + 0.01, (lo + hi) / 2, 0).p;
    const t: Vec3 = [(q[0] - p.p[0]) * dir, 0, (q[2] - p.p[2]) * dir];
    const wall: Vec3[] = [];
    quad(wall, at(s, lo, d0), at(s, hi, d0), at(s, hi, d1), at(s, lo, d1));
    m.facets(mat, wall, t);
  }
}

// Heights where the side wall changes its lean: a flat side panel must not span one.
const SIDE_BREAKS = [LIP[0], LIP[1], LIP[2], LIP[3], 3.4, 3.7];
/** The side wall's z at height y on side s, d off the skin. */
const sideZ = (s: number, y: number, d: number): number => s * (halfWidth(y) + d);
/** Splits an (x, y) outline where the side wall's lean changes. */
function splitAtBreaks(q: Ring): Ring[] {
  let rings: Ring[] = [q];
  for (const h of SIDE_BREAKS)
    rings = rings.flatMap((r) => {
      const ys = r.map((p) => p[1]);
      if (Math.min(...ys) >= h - 1e-9 || Math.max(...ys) <= h + 1e-9) return [r];
      const clip = (above: boolean): Ring => {
        const out: Ring = [];
        for (let i = 0; i < r.length; i++) {
          const [a, b] = [r[i]!, r[(i + 1) % r.length]!];
          const inside = (p: readonly number[]) => (above ? p[1]! >= h : p[1]! <= h);
          if (inside(a)) out.push(a);
          if (inside(a) !== inside(b)) {
            const t = (h - a[1]) / (b[1] - a[1]);
            out.push([a[0] + t * (b[0] - a[0]), h]);
          }
        }
        return out;
      };
      return [clip(false), clip(true)];
    });
  return rings;
}
/** A flat panel on side s: the (x, y) outline from d - depth to d, split where the wall's lean changes. */
function sidePanel(m: MeshBuilder, mat: string, s: number, q: Ring, d: number, depth = 0.035): void {
  for (const ring of splitAtBreaks(q)) m.slab(mat, ring.map(([x, y]): Vec3 => [x, y, sideZ(s, y, d)]), [0, 0, -s * depth]);
}
/** One-sided outlines painted `d` off side s's wall (a seam, a slat's face): two triangles a piece. */
function sideDecal(m: MeshBuilder, mat: string, s: number, qs: Ring[], d: number): void {
  const pts: Vec3[] = [];
  for (const q of qs)
    for (const ring of splitAtBreaks(q)) {
      const p = ring.map(([x, y]): Vec3 => [x, y, sideZ(s, y, d)]);
      for (let i = 1; i + 1 < p.length; i++) pts.push(p[0]!, p[i]!, p[i + 1]!);
    }
  m.facets(mat, pts, [0, 0, s]);
}
/** A prism of `q` (an (x, y) section) across z0..z1. */
function sweepZ(m: MeshBuilder, mat: string, q: Ring, [z0, z1]: [number, number]): void {
  m.sweep(mat, "z", q, z0, q, z1);
}
const rect = (x0: number, y0: number, x1: number, y1: number): Ring => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

// ---------------------------------------------------------------------------
// The shell

function bandsOf(l: Cd230Livery, region: Region): readonly Band[] {
  return region === "side" ? l.side : region === "cab" ? l.cab : l.face;
}
function shell(m: MeshBuilder, l: Cd230Livery): void {
  const hs = new Set<number>([Y_SHELL, ...LIP, 3.4, 3.65, 3.7, 3.8, 3.9, Y_ROOF]);
  for (const bands of [l.side, l.cab, l.face]) for (const [a, b] of bands) for (const h of [a, b]) if (h > Y_SHELL && h < Y_ROOF) hs.add(h);
  const heights = [...hs].sort((a, b) => a - b);
  // one leaf per region and band: a stable id for each painted strip
  const groups = new Map<string, { mat: string; normal: Vec3; pts: Vec3[] }>();
  for (let i = 1; i < heights.length; i++) {
    const [y0, y1] = [heights[i - 1]!, heights[i]!];
    const [lo, hi] = [shellRing(y0), shellRing(y1)];
    const ym = (y0 + y1) / 2;
    for (let j = 0; j < lo.length; j++) {
      const k = (j + 1) % lo.length;
      const { region, sign } = lo[j]!;
      const bands = bandsOf(l, region);
      const band = bandAt(bands, ym);
      const index = bands.indexOf(band);
      const where = region === "front" || region === "rear" ? region : `${region} ${sign > 0 ? "right" : "left"}`;
      const key = `${where}|${index}`;
      const normal: Vec3 = region === "front" ? [1, 0, 0] : region === "rear" ? [-1, 0, 0] : [0, 0, sign];
      if (!groups.has(key)) groups.set(key, { mat: band[2], normal, pts: [] });
      const a: Vec3 = [lo[j]!.x, y0, lo[j]!.z], b: Vec3 = [lo[k]!.x, y0, lo[k]!.z];
      const cc: Vec3 = [hi[k]!.x, y1, hi[k]!.z], d: Vec3 = [hi[j]!.x, y1, hi[j]!.z];
      // wound by the edge's own outward normal, (uz, -ux) counter-clockwise from above
      const g = groups.get(key)!;
      const en: Vec3 = [b[2] - a[2], 0, -(b[0] - a[0])];
      g.pts.push(...orient([a, b, cc], en), ...orient([a, cc, d], en));
    }
  }
  const keys = [...groups.keys()].sort();
  for (const where of [...new Set(keys.map((k) => k.split("|")[0]!))])
    m.scope(where, () => {
      for (const key of keys.filter((k) => k.startsWith(where + "|")).sort((a, b) => Number(a.split("|")[1]) - Number(b.split("|")[1]))) {
        const g = groups.get(key)!;
        m.scope(`band ${key.split("|")[1]}`, () => m.facets(g.mat, g.pts, g.normal));
      }
    });
  m.cap("roof", shellRing(Y_ROOF).map((p) => [p.x, p.z]), Y_ROOF);
}
/** The triangle wound to face along n (the cab sections' edges vary in direction). */
function orient(t: [Vec3, Vec3, Vec3], n: Vec3): Vec3[] {
  const [a, b, cc] = t;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
  const nn = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
  return nn[0]! * n[0] + nn[1]! * n[1] + nn[2]! * n[2] >= 0 ? [a, b, cc] : [a, cc, b];
}

/** The frame from 0.9 to 1.2 m: a flat buffer beam with chamfered corners at each end. */
function frame(m: MeshBuilder, l: Cd230Livery): void {
  const r: Ring = [[7.6, -1.3], [7.4, -1.5], [-7.4, -1.5], [-7.6, -1.3], [-7.6, 1.3], [-7.4, 1.5], [7.4, 1.5], [7.6, 1.3]];
  m.prism(l.frame, r, Y_FRAME, Y_SHELL);
  m.cap("underframe", r, Y_FRAME, false);
}

// ---------------------------------------------------------------------------
// The face (native front BMP rows, photo-calibrated where noted in landmarks.json)

const PILLAR = 0.075; // half the windscreen's centre pillar
const WS = [2.57, 3.53] as const; // the windscreen's rubber, bottom and top
function face_(m: MeshBuilder, e: number, l: Cd230Livery): void {
  const outer = REF_ARC + 0.1; // the panes wrap 10 cm past the nose onto the side
  m.scope("windscreen", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right pane" : "left pane", () => {
        const [a, b] = side(s, PILLAR, outer);
        m.scope("rubber", () => nosePanel(m, "rubber", e, roundRect(a, b, WS[0], WS[1], 0.14), -0.02, 0.018));
        m.scope("glass", () => nosePanel(m, "glass", e, roundRect(a + 0.03, b - 0.03, WS[0] + 0.03, WS[1] - 0.03, 0.12), -0.012, 0.026));
        // a wiper parked low on the glass, hinged near the pillar
        m.scope("wiper", () =>
          nosePanel(m, "rubber", e, [[s * 0.2, WS[0] + 0.06], [s * 0.22, WS[0] + 0.05], [s * 0.85, WS[0] + 0.15], [s * 0.85, WS[0] + 0.17]].map(([u, v]): SY => [u, v]).sort((p, q) => p[0] - q[0]) as SY[], 0.03, 0.04, 0.3),
        );
      });
    m.scope("pillar", () => nosePanel(m, l.pillar, e, [[-PILLAR, 2.5], [PILLAR, 2.5], [PILLAR, 3.51], [-PILLAR, 3.51]], -0.02, 0.012));
  });
  m.scope("headlight", () => headlight(m, e, l));
  m.scope("vents", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right" : "left", () => {
        const [a, b] = side(s, 0.3, 1.14);
        nosePanel(m, l.ventRim, e, roundRect(a, b, 3.61, 3.8, 0.06), -0.02, 0.012);
        m.scope("slot", () => nosePanel(m, "louvre", e, roundRect(a + 0.03, b - 0.03, 3.635, 3.775, 0.05), -0.012, 0.018));
      });
  });
  // the oval grilles at the lip's corners, wrapping from the face onto the side
  m.scope("lip grilles", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right" : "left", () => {
        const [a, b] = side(s, 0.88, REF_ARC + 0.22);
        nosePanel(m, "silver", e, roundRect(a, b, 2.0, 2.28, 0.14, 3), -0.02, 0.012);
        m.scope("louvre", () => nosePanel(m, "louvre", e, roundRect(a + 0.03, b - 0.03, 2.03, 2.25, 0.11, 3), -0.012, 0.018));
        for (let y = 2.065; y < 2.22; y += 0.045)
          m.scope("slat", () => nosePanel(m, "slat", e, [[a + 0.05, y], [b - 0.05, y], [b - 0.05, y + 0.012], [a + 0.05, y + 0.012]], 0.01, 0.024, 0.2));
      });
  });
  m.scope("lamps", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right" : "left", () => {
        const [a, b] = side(s, 0.41, 0.985);
        m.scope("housing", () => nosePanel(m, "rim", e, roundRect(a, b, 1.6, 1.82, 0.03), -0.02, 0.03));
        m.scope("lens", () => nosePanel(m, "lampHead", e, roundRect(a + 0.04, b - 0.04, 1.63, 1.79, 0.02), -0.012, 0.042));
        // the step under the lamp: a bar on two brackets
        m.scope("step", () => {
          const [u0, u1] = side(s, 0.5, 0.9);
          nosePanel(m, "steel", e, [[u0, 1.47], [u1, 1.47], [u1, 1.51], [u0, 1.51]], -0.02, 0.14);
        });
      });
  });
  m.scope("number plate", () => {
    m.scope("housing", () => nosePanel(m, "plate", e, [[-0.39, 1.61], [0.39, 1.61], [0.39, 1.8], [-0.39, 1.8]], -0.02, 0.03));
    const w = letteringWidth(l.number, 0.062, 0.016);
    const tris = lettering(l.number, e > 0 ? -w / 2 : w / 2, 1.65, 0.12, 0.062, 0.016, e < 0);
    m.facets("white", tris.map(([u, v]) => onNose(e, -u, v, 0.034).p), [e, 0, 0]);
  });
}
/** The round headlight housing on the hood, its ridge tapering back into the roof. */
function headlight(m: MeshBuilder, e: number, l: Cd230Livery): void {
  const Y = 3.82, R = 0.22; // photographs: the housing's top stands 4.04 m high
  const front = tipX(3.6) + 0.02;
  const hood = bandAt(l.face, 3.7)[2];
  const sec = (r: number, y: number): Ring => ngon(12, r, Math.PI / 12, 0, y);
  m.scope("housing", () => {
    m.sweep(hood, "x", sec(R * 0.45, 3.9), e * 5.6, sec(R, Y), e * 7.0);
    m.sweep(hood, "x", sec(R, Y), e * 7.0, sec(R, Y), e * front);
  });
  m.scope("lens", () => {
    const disc = (mat: string, r: number, z: number, x0: number, x1: number) => {
      const q = ngon(12, r, 0, z, Y);
      m.sweep(mat, "x", q, e * x0, q, e * x1);
    };
    disc("steel", R * 0.86, 0, front - 0.02, front + 0.012);
    if (l.headlamp === "single") disc("lampHead", R * 0.68, 0, front - 0.01, front + 0.022);
    else for (const z of [-0.085, 0.085]) disc("lampHead", 0.07, z, front - 0.01, front + 0.022);
  });
}

// ---------------------------------------------------------------------------
// The lower end: buffer beam, buffers, coupling, plough


function lowerEnd(m: MeshBuilder, e: number, l: Cd230Livery): void {
  // x0..x1 measured outward from the centre, in this end's direction
  const along = (x0: number, x1: number): [number, number] => (e > 0 ? [x0, x1] : [-x1, -x0]);
  m.scope("buffers", () => {
    for (const z of [-0.875, 0.875])
      m.scope(z > 0 ? "right" : "left", () => {
        const q = ngon(12, 0.12, 0, z, 1.03);
        const [a, b] = along(7.6, 8.15);
        m.sweep("steel", "x", q, a, q, b);
        // photographs: rectangular heads with rounded corners
        const head: Ring = [[z - 0.28, 0.9], [z + 0.24, 0.9], [z + 0.28, 0.94], [z + 0.28, 1.12], [z + 0.24, 1.16], [z - 0.24, 1.16], [z - 0.28, 1.12], [z - 0.28, 0.94]];
        const [c0, c1] = along(8.15, 8.22);
        m.scope("head", () => m.sweep("underframe", "x", head, c0, head, c1));
      });
  });
  m.scope("coupling", () => {
    const [a, b] = along(7.6, 7.95);
    block(m, "underframe", a, b, 0.98, 1.08, -0.07, 0.07);
    const [c0, c1] = along(7.95, 8.05);
    block(m, "underframe", c0, c1, 0.92, 1.1, -0.05, 0.05);
  });
  // The plough below the buffer beam (XML: a block from 0.2 to 0.9 m, its face
  // at source x = 0.7), its lower half perforated (native ploughx BMP, photographs).
  m.scope("plough", () => {
    // XML alongx: 2.5 m wide at its foot, 2.85 m under the beam
    const ring = (back: number, hw: number): Ring => (e > 0 ? [[7.5, -hw], [back, -hw], [back, hw], [7.5, hw]] : [[-back, -hw], [-7.5, -hw], [-7.5, hw], [-back, hw]]);
    m.loft(l.plough, ring(7.05, 1.25), 0.22, ring(6.75, 1.42), Y_FRAME, false);
    m.cap(l.plough, ring(7.05, 1.25), 0.22, false);
    const fx = (d: number) => e * (7.5 + d);
    m.scope("holes", () => {
      for (const y of [0.5, 0.34])
        for (let i = 0; i < 7; i++) {
          const z = -0.9 + i * 0.3;
          m.slab("louvre", [[fx(0.004), y, z - 0.06], [fx(0.004), y, z + 0.06], [fx(0.004), y + 0.1, z + 0.06], [fx(0.004), y + 0.1, z - 0.06]], [-e * 0.03, 0, 0]);
        }
    });
    if (l.ploughStripe) m.scope("stripe", () => m.slab(l.ploughStripe!, [[fx(0.006), 0.23, -1.25], [fx(0.006), 0.23, 1.25], [fx(0.006), 0.3, 1.25], [fx(0.006), 0.3, -1.25]], [-e * 0.03, 0, 0]));
  });
}

// ---------------------------------------------------------------------------
// The sides (native side BMP, source columns -> x = 8.2 - column / 10)

/** Source x range (from the native side BMP) to Factory x, low first. */
const fromSource = (a: number, b: number): [number, number] => [8.2 - b, 8.2 - a];
// the machine room's six top windows, as drawn (source metres)
const WINDOWS: ReadonlyArray<readonly [number, number]> = [[3.8, 5.2], [5.4, 6.5], [7.0, 8.2], [8.4, 9.6], [10.1, 11.3], [11.4, 12.8]];
const GRILLE = fromSource(2.8, 13.5); // the louvred band, 2.6 to 3.3 m
const PORTHOLE = { x: 8.2 - 2.1, y: 2.9, r: 0.3 };
const DOOR = [5.72, 6.48] as const;
const RAILS = [8.2 - 2.582, 8.2 - 1.618] as const; // the rods' outer edges at source x 1.6 and 2.6

function sides(m: MeshBuilder, l: Cd230Livery): void {
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      m.scope("grille", () => {
        const [x0, x1] = GRILLE;
        m.scope("housing", () => sidePanel(m, "rim", s, rect(x0, 2.6, x1, 3.3), 0.012));
        sidePanel(m, "louvre", s, rect(x0 + 0.05, 2.65, x1 - 0.05, 3.25), 0.02);
        m.scope("slats", () => {
          const n = Math.round((x1 - x0 - 0.1) / 0.2);
          const slats: Ring[] = [];
          for (let i = 0; i < n; i++) {
            const x = x0 + 0.05 + ((x1 - x0 - 0.1) * (i + 0.5)) / n;
            slats.push(rect(x - 0.035, 2.66, x + 0.035, 3.24));
          }
          sideDecal(m, "slat", s, slats, 0.026);
        });
      });
      m.scope("windows", () => {
        for (const [i, [a, b]] of WINDOWS.entries())
          m.scope(`window ${i + 1}`, () => {
            const [x0, x1] = fromSource(a, b);
            sidePanel(m, "rim", s, rect(x0, 3.4, x1, 3.6), 0.014);
            m.scope("glass", () => sidePanel(m, "glass", s, rect(x0 + 0.04, 3.43, x1 - 0.04, 3.57), 0.022));
          });
      });
      m.scope("number plate", () => {
        const [x0, x1] = fromSource(7.9, 8.7);
        sidePanel(m, "plate", s, rect(x0, 1.7, x1, 1.9), 0.022);
        const w = letteringWidth(l.number, 0.055, 0.014);
        const xc = (x0 + x1) / 2;
        m.facets("white", lettering(l.number, s < 0 ? xc + w / 2 : xc - w / 2, 1.73, 0.13, 0.055, 0.014, s < 0).map(([x, y]): Vec3 => [x, y, sideZ(s, y, 0.026)]), [0, 0, s]);
      });
      for (const e of [-1, 1])
        m.scope(e > 0 ? "front cab" : "rear cab", () => {
          const [d0, d1] = [e * DOOR[0], e * DOOR[1]].sort((a, b) => a - b) as [number, number];
          m.scope("door", () => {
            // the door's seams; it reaches from the steps to under the cant
            sideDecal(m, "rubber", s, [rect(d0, 1.36, d1, 1.38), rect(d0, 3.56, d1, 3.58), rect(d0, 1.38, d0 + 0.02, 3.56), rect(d1 - 0.02, 1.38, d1, 3.56)], 0.004);
          });
          m.scope("porthole", () => {
            const ring = (r: number): Ring => ngon(16, r, 0, e * PORTHOLE.x, PORTHOLE.y);
            sidePanel(m, "rim", s, ring(PORTHOLE.r), 0.016);
            m.scope("glass", () => sidePanel(m, "glass", s, ring(PORTHOLE.r - 0.05), 0.024));
          });
          m.scope("handrails", () => {
            for (const x of RAILS) {
              const ys = [1.6, 2.3, 3.4, 3.58];
              // a rod standing off the leaning wall, in straight pieces
              for (let i = 1; i < ys.length; i++) {
                const [ya, yb] = [ys[i - 1]!, ys[i]!];
                m.loft("steel", ngon(6, 0.018, 0, e * x, sideZ(s, ya, 0.03)), ya, ngon(6, 0.018, 0, e * x, sideZ(s, yb, 0.03)), yb, i === ys.length - 1);
              }
              for (const y of [1.6, 3.58]) block(m, "steel", e * x - 0.015, e * x + 0.015, y - 0.015, y + 0.015, ...side(s, halfWidth(y) - 0.01, halfWidth(y) + 0.03));
            }
          });
        });
    });
}

// ---------------------------------------------------------------------------
// Roof equipment (native roof BMP y_dec and the XML roof clips)

const PANTO_X = 4.25; // source x = 3.95 and 12.45
const PANTO_BASE = 4.3; // the base frame's top, on its insulators
const PANTO_ARM = 1.3;
const PANTO_A = 0.3; // the pivots' distance from the pantograph's centre
/** The diamond (rhombic) pantograph of the native pant2 component: four arm pairs about two knees. */
function pantograph(m: MeshBuilder, xc: number, raised: boolean): void {
  const h = raised ? 1.52 : 0.2; // raised: the collector at 5.87 m
  const w = PANTO_A + Math.sqrt(PANTO_ARM * PANTO_ARM - (h / 2) * (h / 2) - 0.01);
  const top = PANTO_BASE + h;
  m.scope("base", () => {
    for (const d of [-0.6, 0.6]) for (const z of [-0.42, 0.42]) m.prism("insulator", ngon(10, 0.07, 0, xc + d, z), Y_ROOF, PANTO_BASE - 0.06);
    for (const z of [-0.42, 0.42]) block(m, "pantograph", xc - 0.75, xc + 0.75, PANTO_BASE - 0.06, PANTO_BASE, z - 0.04, z + 0.04);
    for (const d of [-PANTO_A, PANTO_A]) block(m, "pantograph", xc + d - 0.03, xc + d + 0.03, PANTO_BASE - 0.05, PANTO_BASE + 0.01, -0.46, 0.46);
  });
  m.scope("arms", () => {
    for (const k of [-1, 1])
      for (const s of [-1, 1]) {
        // the lower arm from the base pivot out to the knee, the upper arm back in to the head
        tubeX(m, "pantograph", 0.03, xc + k * PANTO_A, PANTO_BASE, s * 0.42, xc + k * w, PANTO_BASE + h / 2, s * 0.32);
        tubeX(m, "pantograph", 0.025, xc + k * w, PANTO_BASE + h / 2, s * 0.32, xc + k * PANTO_A, top, s * 0.22);
      }
  });
  m.scope("head", () => {
    for (const d of [-0.12, 0.12]) {
      block(m, "carbon", xc + d - 0.03, xc + d + 0.03, top, top + 0.05, -0.65, 0.65);
      for (const s of [-1, 1]) {
        const a = ngon(8, 0.02, 0, xc + d, top + 0.02), b = ngon(8, 0.02, 0, xc + d, top - 0.08);
        m.sweep("pantograph", "z", a, s * 0.65, b, s * 0.9);
      }
    }
    block(m, "pantograph", xc - PANTO_A, xc + PANTO_A, top - 0.04, top, -0.25, 0.25);
  });
}
function roofEquipment(m: MeshBuilder, l: Cd230Livery): void {
  m.scope("pantographs", () => {
    m.scope("rear pantograph", () => pantograph(m, -PANTO_X, true));
    m.scope("front pantograph", () => pantograph(m, PANTO_X, false));
  });
  // The main breaker: the 230's over the middle, the 240's ahead of the roof box (source x 7.3..8.6, 8.5..9.8).
  const [b0, b1] = l.roofBox ? fromSource(8.5, 9.8) : fromSource(7.3, 8.6);
  m.scope("breaker", () => {
    block(m, "underframe", b0, b1, Y_ROOF - 0.02, Y_ROOF + 0.06, -0.4, 0.2);
    for (const x of [b0 + 0.2, b1 - 0.2]) m.prism("insulator", ngon(10, 0.07, 0, x, -0.1), Y_ROOF + 0.06, 4.3);
    tubeX(m, "breaker", 0.1, b0 + 0.08, 4.38, -0.1, b1 - 0.08, 4.38, -0.1, 12);
    block(m, "olive", b0 + 0.05, b0 + 0.45, Y_ROOF + 0.06, 4.28, 0.0, 0.2);
  });
  if (l.roofBox)
    m.scope("roof box", () => {
      const [x0, x1] = fromSource(6.1, 7.3);
      block(m, "slat", x0, x1, Y_ROOF - 0.02, 4.45, -0.3, 0.3);
      for (const s of [-1, 1])
        for (let y = 4.08; y < 4.4; y += 0.08) block(m, "louvre", x0 + 0.06, x1 - 0.06, y, y + 0.035, ...side(s, 0.295, 0.31));
    });
  m.scope("high voltage line", () => {
    for (const x of [-3.5, -1.8, 1.8, 3.5]) {
      if (x > Math.min(b0, b1) - 0.2 && x < Math.max(b0, b1) + 0.2) continue;
      m.prism("insulator", ngon(10, 0.06, 0, x, 0), Y_ROOF, 4.18);
    }
    tubeX(m, "copper", 0.02, -3.6, 4.2, 0, 3.6, 4.2, 0);
    for (const x of [-3.6, 3.6]) tubeX(m, "copper", 0.015, x, 4.2, 0, x + Math.sign(x) * 0.4, PANTO_BASE + 0.02, 0);
  });
}

// ---------------------------------------------------------------------------
// Running gear and underframe

const BOGIE_X = 3.9; // 7.80 m between the pivots
const HALF_BASE = 1.4; // 2.80 m bogie wheelbase
const WHEEL_R = 0.625;
const WHEEL_N = 20;
function bogie(m: MeshBuilder, xc: number): void {
  const ay = WHEEL_R * Math.cos(Math.PI / WHEEL_N);
  for (const dx of [-HALF_BASE, HALF_BASE])
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.08, 0, x, ay);
      m.sweep("steel", "z", axle, -1.0, axle, 1.0);
      for (const s of [-1, 1]) {
        const wheel = ngon(WHEEL_N, WHEEL_R, Math.PI / WHEEL_N, x, ay), disc = ngon(16, 0.5, 0, x, ay), hub = ngon(8, 0.14, 0, x, ay);
        sweepZ(m, "steel", wheel, side(s, 0.665, 0.8));
        sweepZ(m, "wheel", disc, side(s, 0.8, 0.82));
        sweepZ(m, "steel", hub, side(s, 0.82, 0.84));
        m.scope("axle box", () => sweepZ(m, "bogie", ngon(8, 0.15, Math.PI / 8, x, ay), side(s, 0.84, 1.04)));
        m.scope("primary suspension", () => {
          block(m, "bogie", x - 0.45, x + 0.45, ay - 0.19, ay - 0.13, ...side(s, 0.9, 1.04));
          for (const d of [-0.32, 0.32]) coil(m, "spring", x + d, s * 0.97, ay - 0.13, 0.72, 0.08, 2, 6);
        });
      }
      const motor = ngon(12, 0.3, 0, x - Math.sign(dx) * 0.55, 0.56);
      m.sweep("bogie", "z", motor, -0.55, motor, 0.55);
    });
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      const top: Ring = [[-2.0, 0.86], [-1.05, 0.86], [-0.75, 0.74], [0.75, 0.74], [1.05, 0.86], [2.0, 0.86]];
      const bottom: Ring = [[-2.0, 0.72], [-1.15, 0.72], [-0.8, 0.46], [0.8, 0.46], [1.15, 0.72], [2.0, 0.72]];
      plate(m, "bogie", top.map(([u, v]) => [xc + u, v]), bottom.map(([u, v]) => [xc + u, v]), ...side(s, 0.92, 1.08));
      block(m, "bogie", xc - 0.5, xc + 0.5, 0.36, 0.46, ...side(s, 0.94, 1.36));
    }
    for (const x of [xc - 0.55, xc + 0.55]) block(m, "bogie", x - 0.08, x + 0.08, 0.62, 0.82, -0.92, 0.92);
    for (const x of [xc - 1.95, xc + 1.95]) block(m, "bogie", x - 0.05, x + 0.05, 0.7, 0.84, -1.0, 1.0);
  });
  m.scope("secondary suspension", () => {
    for (const s of [-1, 1]) for (const d of [-0.28, 0.28]) coil(m, "spring", xc + d, s * 1.2, 0.46, 0.88, 0.13, 3, 6);
  });
  m.scope("brake cylinders", () => {
    for (const s of [-1, 1])
      for (const d of [-0.9, 0.9]) {
        const cyl = ngon(8, 0.09, Math.PI / 8, xc + d, 0.64);
        sweepZ(m, "spring", cyl, side(s, 0.62, 0.88));
      }
  });
  m.scope("sandboxes", () => {
    for (const o of [-1, 1]) for (const s of [-1, 1]) block(m, "bogie", xc + o * 2.12 - 0.09, xc + o * 2.12 + 0.09, 0.5, 0.86, ...side(s, 0.62, 0.88));
  });
}
function underframe(m: MeshBuilder): void {
  // the transformer tank between the bogies (XML box, source x 6.9..8.3, 0.4..0.9 m)
  m.scope("tank", () => {
    const [x0, x1] = fromSource(6.9, 8.3);
    block(m, "slat", x0, x1, 0.45, Y_FRAME, -1.1, 1.1);
    for (const s of [-1, 1]) for (let x = x0 + 0.12; x < x1 - 0.05; x += 0.2) block(m, "louvre", x, x + 0.06, 0.5, 0.85, ...side(s, 1.095, 1.11));
  });
  m.scope("air reservoirs", () => {
    for (const z of [-0.6, 0.6]) {
      const r = ngon(12, 0.2, 0, z, 0.66);
      m.sweep("steel", "x", r, -1.85, r, -0.25);
    }
  });
  m.scope("steps", () => {
    for (const e of [-1, 1])
      for (const s of [-1, 1]) {
        const [x0, x1] = [e * 5.85, e * 6.35].sort((a, b) => a - b) as [number, number];
        sidePanel(m, "louvre", s, rect(x0, 1.0, x1, 1.08), 0.004, 0.06);
        sidePanel(m, "louvre", s, rect(x0, 1.26, x1, 1.34), 0.004, 0.06);
        block(m, "steel", x0, x1, 0.6, 0.64, ...side(s, 1.25, 1.5));
        for (const x of [x0, x1 - 0.03]) block(m, "steel", x, x + 0.03, 0.6, Y_FRAME + 0.02, ...side(s, 1.44, 1.48));
      }
  });
}

/** The laminatka in one of its liveries (CD 230, 240, 240 047, 340); the default is 230 025-9. */
export function cd230(params?: ParamValues): MeshBuilder {
  const { livery: key } = resolveParams(CD230_PARAMS, params);
  const l: Cd230Livery = CD230_LIVERIES[key as keyof typeof CD230_LIVERIES];
  const m = new MeshBuilder({ ...PALETTE, ...SHARED, ...l.palette });
  m.scope("body", () => {
    m.scope("shell", () => shell(m, l));
    m.scope("frame", () => frame(m, l));
  });
  m.scope("sides", () => sides(m, l));
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front cab" : "rear cab", () => {
      m.scope("face", () => face_(m, e, l));
      lowerEnd(m, e, l);
    });
  m.scope("bogies", () => {
    m.scope("rear bogie", () => bogie(m, -BOGIE_X));
    m.scope("front bogie", () => bogie(m, BOGIE_X));
  });
  m.scope("underframe", () => underframe(m));
  m.scope("roof equipment", () => roofEquipment(m, l));
  return m;
}
