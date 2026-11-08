// The EMD SD40-2 (1972): its own body on the hood unit kit's helpers (usHoodKit.ts),
// measured from photographs (assets/emd-sd40-2/SOURCES.md). The long hood ends
// 1.5 m short of the rear end sill; behind the cab stands the raised electrical
// cabinet with its inertial filter grille, then the dynamic brake grille with its two
// fans, the exhaust, and the radiator at the rear: two grille panels a side under
// three 48 in fans. The EMD standard cab has angled front corners with a door
// window each, two windscreens over the low nose, a header with the twin
// headlight and the angled number boards, a sliding side window under an awning.
// HT-C trucks at 43 ft 6 in, the fuel tank with the air reservoirs over it, a
// snowplow pilot at the front. +X toward the nose, metres, rail top y = 0.
// See docs/models/us-diesels.md.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block, bogieGeometry, coil, exhaust, extrude, horn, paint, plate, side, tankX, type BogieSpec } from "./dieselParts.ts";
import { US_PALETTE, decalX, decalZ, knuckleCoupler, paintedSweep, sideText, usHoodLod, type UsHoodSpec, type UsLivery } from "./usHoodKit.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;

// ---------------------------------------------------------------------------
// Measures: published figures (The Diesel Shop; Wikipedia's 43 ft 6 in between the
// bolsters) and the near-orthographic BN 7812 side photograph at 52.6 px/m.

/** Length over the couplers, 68 ft 10 in. */
export const SD40_2_LENGTH = ft(68, 10);
const L = 9.9; // end sills
const DECK = 1.6, SILL = 1.28, DECK_HALF = 1.56;
/** Truck centres 43 ft 6 in; the HT-C's 13 ft 7 in wheelbase in two equal spacings; 40 in wheels. */
export const SD40_2_TRUCK_CENTRE = ft(43, 6) / 2;
const AXLE = ft(6, 9.5);
const HOOD = { x0: -8.35, x1: 2.1, half: 1.07, top: 4.5, r: 0.18 };
/** The electrical cabinet behind the cab, 15 ft 1.2 in high. */
const CABINET = { x0: 2.1, x1: 4.67, half: 1.09, top: ft(15, 1.2), r: 0.14 };
/** The cab: rear wall, end of the straight side, front wall (its corners angled in to `cornerZ`), 14 ft 8.7 in. */
const CAB = { x0: 4.67, xs: 6.62, xf: 7.08, half: 1.52, cornerZ: 1.1, wallTop: 4.1, headerTop: 4.42, top: ft(14, 8.7) + 0.03 };
const NOSE = { x0: 7.0, x1: 8.95, half: 1.02, top: 3.45 };
const NOSE_R = 0.28;
const RAD_GRILLES: ReadonlyArray<readonly [number, number]> = [[-8.1, -5.86], [-5.78, -3.55]];
const RAD_FANS = [-7.06, -5.6, -4.15];
const DB_FANS = [-1.85, -0.49];
const DB_GRILLE = { x0: -2.65, x1: 0.4 };
const INERTIAL = { x0: 2.35, x1: 4.3 };
const EXHAUST_X = -2.95;
const TANK = { x0: -3.4, x1: 3.5, top: 0.98, y0: 0.26, half: 1.35 };

const HTC: BogieSpec = {
  axles: [-AXLE, 0, AXLE], wheelR: ft(0, 20), frameHalf: 2.75, frameTop: 1.06, frameBottom: 0.5, frameZ: [0.92, 1.06],
  primary: "coil", secondary: [-1.0, 1.0], secondaryZ: 1.12, bolster: 1.22,
};

// ---------------------------------------------------------------------------
// Paint

/** One railroad's paint on the SD40-2. Bands are absolute heights above the rail. */
export interface Sd40Paint {
  title: string;
  number: string;
  palette: Record<string, MaterialSpec>;
  /** The long hood's and cabinet's sides and ends. */
  hood: readonly Band[];
  cabSide: readonly Band[];
  cabFront: readonly Band[];
  /** The number board header over the cab front. */
  header: string;
  nose: readonly Band[];
  noseTop: string;
  roof: string;
  cabRoof: string;
  frame: string;
  sillStripe?: readonly [number, number, string];
  trucks: string;
  tank: string;
  pilot: string;
  rails: string;
  /** The walkway's tread plate; default the frame's paint. */
  deck?: string;
  /** Lettering across the nose's front: text and paint. */
  noseName?: readonly [string, string];
  /** The railroad's lettering and emblems. */
  decorate: (m: MeshBuilder) => void;
}

const P = {
  upYellow: paint("#f4b92a"), upGrey: paint("#9fa2a3"), upRed: paint("#b5202b"), upDark: paint("#6c6f71", 0.7), upBlue: paint("#1d3a78"),
  bnGreen: paint("#2c6e3f"), bnBlack: paint("#202224"), bnWhite: paint("#eeeeea"),
  crBlue: paint("#1b4f9a"), crWhite: paint("#f2f2ee"),
  truckGrey: paint("#4c4e50", 0.8), truckBlack: paint("#242527", 0.85),
};
const pick = (...names: Array<keyof typeof P>) => Object.fromEntries(names.map((n) => [n, P[n]]));

const sides = [-1, 1] as const;

/** Text centred at (xc, y0 .. y0 + h) on both hood sides, heavy strokes. */
function hoodText(m: MeshBuilder, mat: string, text: string, zw: number, xc: number, y0: number, h: number, w = h * 0.62, gap = h * 0.22): void {
  for (const sd of sides) sideText(m, mat, text, sd, zw, xc, y0, h, w, gap);
}

/** A flat convex polygon (x, y) on the side wall z = s * zw, facing out. */
function sidePoly(m: MeshBuilder, mat: string, s: number, zw: number, poly: ReadonlyArray<readonly [number, number]>): void {
  const pts: Vec3[] = [];
  for (let i = 1; i + 1 < poly.length; i++) for (const q of [poly[0]!, poly[i]!, poly[i + 1]!]) pts.push([q[0], q[1], s * zw]);
  m.facets(mat, pts, [0, 0, s]);
}

/** A ring (annulus) on the side wall z = s * zw about (xc, yc). */
function sideRing(m: MeshBuilder, mat: string, s: number, zw: number, xc: number, yc: number, ro: number, ri: number, n = 24): void {
  const pts: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
    const P0: Vec3 = [xc + ro * Math.cos(a), yc + ro * Math.sin(a), s * zw], P1: Vec3 = [xc + ro * Math.cos(b), yc + ro * Math.sin(b), s * zw];
    const Q0: Vec3 = [xc + ri * Math.cos(a), yc + ri * Math.sin(a), s * zw], Q1: Vec3 = [xc + ri * Math.cos(b), yc + ri * Math.sin(b), s * zw];
    pts.push(P0, P1, Q1, P0, Q1, Q0);
  }
  m.facets(mat, pts, [0, 0, s]);
}

/** Burlington Northern Cascade green: black hood top over the grilles, the white BN herald on the cab, the number on the long hood. */
function burlingtonNorthern(): Sd40Paint {
  const black = HOOD.top - 1.0;
  return {
    title: "BN Cascade", number: "7812", palette: pick("bnGreen", "bnBlack", "bnWhite", "truckBlack"),
    hood: [[0, black, "bnGreen"], [black, 9, "bnBlack"]],
    cabSide: [[0, 9, "bnGreen"]], cabFront: [[0, 9, "bnGreen"]], header: "bnBlack",
    nose: [[0, 9, "bnGreen"]], noseTop: "bnGreen", roof: "bnBlack", cabRoof: "bnBlack",
    frame: "bnBlack", trucks: "truckBlack", tank: "truckBlack", pilot: "bnBlack", rails: "bnWhite",
    decorate: (m) => {
      m.scope("number", () => hoodText(m, "bnWhite", "7812", HOOD.half + 0.009, -6.4, DECK + 0.78, 0.74, 0.44, 0.13));
      m.scope("herald", () => {
        for (const sd of sides) {
          const zw = CAB.half + 0.006, xc = 6.05, yc = DECK + 1.42, w = 1.2, h = 0.62;
          // the white B: a block with two rounded bowls toward the nose's side seen from outside
          const xs = (u: number) => xc + sd * u; // u to the viewer's right
          const B: Array<[number, number]> = [];
          const u0 = -w / 2, u1 = w / 2 - h / 4;
          B.push([xs(u0), yc - h / 2], [xs(u1), yc - h / 2]);
          for (let i = 1; i < 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI; B.push([xs(u1 + (h / 4) * Math.cos(a)), yc - h / 4 + (h / 4) * Math.sin(a)]); }
          B.push([xs(u1 - 0.04), yc]);
          for (let i = 1; i < 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI; B.push([xs(u1 + (h / 4) * Math.cos(a)), yc + h / 4 + (h / 4) * Math.sin(a)]); }
          B.push([xs(u1), yc + h / 2], [xs(u0), yc + h / 2]);
          // fan from the B's left middle (each sub-polygon convex enough to read as a fan)
          const pts: Vec3[] = [];
          const c: [number, number] = [xs(u0 + 0.25), yc];
          for (let i = 0; i < B.length; i++) { const p = B[i]!, q = B[(i + 1) % B.length]!; pts.push([c[0], c[1], sd * zw], [p[0], p[1], sd * zw], [q[0], q[1], sd * zw]); }
          m.facets("bnWhite", pts, [0, 0, sd]);
          // the green N cut through it: two bars and the diagonal
          const g = zw + 0.004, t = 0.1;
          const n0 = -0.25, n1 = 0.25, ny0 = yc - 0.2, ny1 = yc + 0.2;
          sidePoly(m, "bnGreen", sd, g, [[xs(n0), ny0], [xs(n0 + t), ny0], [xs(n0 + t), ny1], [xs(n0), ny1]]);
          sidePoly(m, "bnGreen", sd, g, [[xs(n1 - t), ny0], [xs(n1), ny0], [xs(n1), ny1], [xs(n1 - t), ny1]]);
          sidePoly(m, "bnGreen", sd, g, [[xs(n0), ny1], [xs(n0 + t), ny1], [xs(n1), ny0], [xs(n1 - t), ny0]]);
        }
      });
      m.scope("name", () => {
        for (const sd of sides) {
          sideText(m, "bnWhite", "BURLINGTON", sd, CAB.half + 0.006, 6.05, DECK + 0.86, 0.13);
          sideText(m, "bnWhite", "NORTHERN", sd, CAB.half + 0.006, 6.05, DECK + 0.64, 0.13);
        }
      });
    },
  };
}

/** Conrail blue: white number on the cab, the "can opener" wheel and rails on the long hood, CONRAIL on the hood and the nose. */
function conrail(): Sd40Paint {
  return {
    title: "Conrail", number: "6469", palette: pick("crBlue", "crWhite", "truckBlack"),
    hood: [[0, 9, "crBlue"]], cabSide: [[0, 9, "crBlue"]], cabFront: [[0, 9, "crBlue"]], header: "crBlue",
    nose: [[0, 9, "crBlue"]], noseTop: "crBlue", roof: "crBlue", cabRoof: "crBlue",
    frame: "crBlue", trucks: "truckBlack", tank: "truckBlack", pilot: "truckBlack", rails: "crWhite", noseName: ["CONRAIL", "crWhite"],
    decorate: (m) => {
      m.scope("number", () => { for (const sd of sides) sideText(m, "crWhite", "6469", sd, CAB.half + 0.006, 5.95, DECK + 1.0, 0.42, 0.26, 0.08); });
      m.scope("logo", () => {
        for (const sd of sides) {
          const zw = HOOD.half + 0.006, xc = -0.6, yc = DECK + 1.5, R = 0.62;
          sideRing(m, "crWhite", sd, zw, xc, yc, R, R - 0.17);
          sideRing(m, "crWhite", sd, zw, xc, yc, R - 0.32, R - 0.44);
          // three rails running into the wheel from the cab's side, the lowest longest
          for (const [k, y0] of [[0, DECK + 0.62], [1, DECK + 0.9], [2, DECK + 1.18]] as const) {
            const x0 = xc + 0.1 + k * 0.12, x1 = xc + 2.6 - k * 0.25;
            sidePoly(m, "crWhite", sd, zw, [[x0, y0], [x1, y0], [x1, y0 + 0.17], [x0 + 0.06, y0 + 0.17]]);
          }
        }
      });
      m.scope("name", () => hoodText(m, "crWhite", "CONRAIL", HOOD.half + 0.009, -5.6, DECK + 1.05, 0.42));
    },
  };
}

/** Union Pacific: armour yellow, the grey hood top over a red pinstripe, red lettering, grey frame with a red sill stripe. */
function unionPacific(): Sd40Paint {
  const r0 = HOOD.top - 0.84, r1 = r0 + 0.06;
  return {
    title: "Union Pacific", number: "3741", palette: pick("upYellow", "upGrey", "upRed", "upDark", "upBlue", "truckGrey"),
    hood: [[0, r0, "upYellow"], [r0, r1, "upRed"], [r1, 9, "upGrey"]],
    cabSide: [[0, r0, "upYellow"], [r0, r1, "upRed"], [r1, 9, "upYellow"]],
    cabFront: [[0, r0, "upYellow"], [r0, r1, "upRed"], [r1, 9, "upGrey"]], header: "upGrey",
    nose: [[0, 9, "upYellow"]], noseTop: "upYellow", roof: "upGrey", cabRoof: "upGrey",
    frame: "upGrey", sillStripe: [0.0, 0.07, "upRed"], trucks: "truckGrey", tank: "upGrey", pilot: "upDark", rails: "white",
    decorate: (m) => {
      m.scope("number", () => { for (const sd of sides) sideText(m, "upRed", "3741", sd, CAB.half + 0.006, 5.95, DECK + 1.0, 0.44, 0.27, 0.08); });
      m.scope("name", () => hoodText(m, "upRed", "UNION PACIFIC", HOOD.half + 0.009, -1.6, DECK + 1.42, 0.46));
      // the shield on the nose sides: a blue head over red and white stripes, pointed at the foot
      m.scope("shield", () => {
        for (const sd of sides) {
          const zw = NOSE.half + 0.004, xc = NOSE.x1 - 0.62, y0 = NOSE.top - 0.78, w = 0.17, hh = 0.42;
          sidePoly(m, "white", sd, zw, [[xc - w, y0 + 0.1], [xc, y0], [xc + w, y0 + 0.1], [xc + w, y0 + hh], [xc - w, y0 + hh]]);
          sidePoly(m, "upBlue", sd, zw + 0.004, [[xc - w, y0 + hh - 0.13], [xc + w, y0 + hh - 0.13], [xc + w, y0 + hh], [xc - w, y0 + hh]]);
          for (const u of [-0.11, 0, 0.11]) sidePoly(m, "upRed", sd, zw + 0.004, [[xc + u - 0.03, y0 + 0.02 + (0.1 * (Math.abs(u) + 0.03)) / w], [xc + u + 0.03, y0 + 0.02 + (0.1 * (Math.abs(u) + 0.03)) / w], [xc + u + 0.03, y0 + hh - 0.15], [xc + u - 0.03, y0 + hh - 0.15]]);
        }
      });
    },
  };
}

export const SD40_2_PAINT: Record<string, Sd40Paint> = {
  burlingtonNorthern: burlingtonNorthern(),
  conrail: conrail(),
  unionPacific: unionPacific(),
};

// ---------------------------------------------------------------------------
// Helpers

function matAt(bands: readonly Band[], y: number): string {
  for (const b of bands) if (y >= b[0] - 1e-9 && y < b[1] - 1e-9) return b[2];
  return y < bands[0]![0] ? bands[0]![2] : bands[bands.length - 1]![2];
}

/** The vertical walls of a convex plan (x, z) from y0 to y1, each wall split at the band edges and painted by `bandsOf(i)`. */
function planWalls(m: MeshBuilder, plan: ReadonlyArray<readonly [number, number]>, y0: number, y1: number, bandsOf: (i: number) => readonly Band[], skip: (i: number) => boolean = () => false): void {
  const cx = plan.reduce((s, p) => s + p[0], 0) / plan.length, cz = plan.reduce((s, p) => s + p[1], 0) / plan.length;
  for (let i = 0; i < plan.length; i++) {
    if (skip(i)) continue;
    const a = plan[i]!, b = plan[(i + 1) % plan.length]!;
    let n: Vec3 = [b[1] - a[1], 0, -(b[0] - a[0])];
    if (n[0] * ((a[0] + b[0]) / 2 - cx) + n[2] * ((a[1] + b[1]) / 2 - cz) < 0) n = [-n[0], 0, -n[2]];
    const bands = bandsOf(i);
    const cuts = [y0, ...bands.flatMap((q) => [q[0], q[1]]).filter((y) => y > y0 + 1e-6 && y < y1 - 1e-6), y1].sort((p, q) => p - q);
    for (let k = 0; k + 1 < cuts.length; k++) {
      const lo = cuts[k]!, hi = cuts[k + 1]!;
      if (hi - lo < 1e-6) continue;
      m.facets(matAt(bands, (lo + hi) / 2), [[a[0], lo, a[1]], [b[0], lo, b[1]], [b[0], hi, b[1]], [a[0], lo, a[1]], [b[0], hi, b[1]], [a[0], hi, a[1]]], n);
    }
  }
}

/** A rectangle on the vertical panel from p0 to p1 (plan points), t0..t1 along it, y0..y1, `off` outward along `n`. */
function panelRect(m: MeshBuilder, mat: string, p0: readonly [number, number], p1: readonly [number, number], n: readonly [number, number], t0: number, t1: number, y0: number, y1: number, off: number): void {
  const at = (t: number, y: number): Vec3 => [p0[0] + (p1[0] - p0[0]) * t + n[0] * off, y, p0[1] + (p1[1] - p0[1]) * t + n[1] * off];
  m.facets(mat, [at(t0, y0), at(t1, y0), at(t1, y1), at(t0, y0), at(t1, y1), at(t0, y1)], [n[0], 0, n[1]]);
}

/** Text centred on the vertical panel p0..p1 (read from outside along `n`). */
function panelText(m: MeshBuilder, mat: string, text: string, p0: readonly [number, number], p1: readonly [number, number], n: readonly [number, number], y0: number, h: number, w: number, gap: number, off: number): void {
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const d = [(p1[0] - p0[0]) / len, (p1[1] - p0[1]) / len];
  // reading direction: to the viewer's right when facing the panel from outside
  const right = [n[1], -n[0]];
  const sgn = right[0]! * d[0]! + right[1]! * d[1]! >= 0 ? 1 : -1;
  const tw = strokeWidth(text, w, gap);
  const mid = [(p0[0] + p1[0]) / 2 + n[0] * off, (p0[1] + p1[1]) / 2 + n[1] * off];
  const pts = strokeText(text, -tw / 2, y0, h, w, gap, false, h * 0.15).map(([u, v]): Vec3 => [mid[0]! + sgn * d[0]! * u, v, mid[1]! + sgn * d[1]! * u]);
  m.facets(mat, pts, [n[0], 0, n[1]]);
}

const unit = (x: number, z: number): [number, number] => { const l = Math.hypot(x, z); return [x / l, z / l]; };

// ---------------------------------------------------------------------------
// The model

export function buildSd40_2(p: Sd40Paint): MeshBuilder {
  const m = new MeshBuilder({ ...US_PALETTE, ...p.palette });
  m.scope("frame", () => frame(m, p));
  m.scope("long hood", () => {
    longHood(m, p);
    m.scope("lettering", () => p.decorate(m));
  });
  m.scope("front", () => nose(m, p));
  m.scope("cab", () => cab(m, p));
  m.scope("walkways", () => walkways(m, p));
  m.scope("trucks", () => {
    for (const e of [1, -1])
      m.scope(e > 0 ? "front truck" : "rear truck", () => m.bogie(() => {
        const xc = e * SD40_2_TRUCK_CENTRE;
        bogieGeometry(m, xc, HTC);
        m.scope("htc", () => htcCasting(m, p, xc));
      }));
  });
  m.scope("underframe", () => underframe(m, p));
  return m;
}

/**
 * The HT-C's cast side frame outside the toolkit's, from the BN 7812 and NS 6155 photographs: a straight
 * top chord, a deep web hiding most of each wheel with a low belly and three lightening holes between the
 * axles, jaws either side of each axle box, the spring nest in its window over the box, and the hydraulic
 * dampers on the outer axles.
 */
function htcCasting(m: MeshBuilder, p: Sd40Paint, xc: number): void {
  const zi = 1.0, zo = 1.14, top = 1.08, win = 0.93, jawFoot = 0.4, belly = 0.45;
  const ay = HTC.wheelR;
  const axles = [-AXLE, 0, AXLE];
  // the bottom edge from the rear end to the front: windows over the boxes, jaws, bellies
  const bot: Array<[number, number]> = [[-2.85, 0.66], [-2.32, 0.58]];
  for (let i = 0; i < axles.length; i++) {
    const a = axles[i]!;
    bot.push([a - 0.31, jawFoot], [a - 0.2, jawFoot], [a - 0.199, win], [a + 0.199, win], [a + 0.2, jawFoot], [a + 0.31, jawFoot]);
    if (i + 1 < axles.length) {
      const b = axles[i + 1]!;
      bot.push([a + 0.311, 0.6], [a + 0.6, belly], [b - 0.6, belly], [b - 0.311, 0.6]);
    }
  }
  bot.push([2.32, 0.58], [2.85, 0.66]);
  const topLine = bot.map(([x]): [number, number] => [xc + x, Math.abs(x) > 2.5 ? top - ((Math.abs(x) - 2.5) / 0.35) * 0.16 : top]);
  const bottom = bot.map(([x, y]): [number, number] => [xc + x, y]);
  m.scope("side frames", () => {
    for (const sd of sides) plate(m, p.trucks, topLine, bottom, ...side(sd, zi, zo));
  });
  m.scope("lightening holes", () => {
    for (const sd of sides)
      for (let i = 0; i + 1 < axles.length; i++) {
        const mid = (axles[i]! + axles[i + 1]!) / 2;
        const pts: Vec3[] = [];
        for (const dx of [-0.36, 0, 0.36]) {
          const q = ngon(8, 0.075, 0, xc + mid + dx, 0.66);
          for (let k = 1; k + 1 < q.length; k++) for (const r of [q[0]!, q[k]!, q[k + 1]!]) pts.push([r[0], r[1], sd * (zo + 0.004)]);
        }
        m.facets("black", pts, [0, 0, sd]);
      }
  });
  m.scope("axle boxes", () => {
    for (const a of axles)
      for (const sd of sides) {
        block(m, p.trucks, xc + a - 0.19, xc + a + 0.19, ay - 0.17, ay + 0.17, ...side(sd, zi, zo + 0.04));
        extrude(m, "spring", "z", ngon(8, 0.1, Math.PI / 8, xc + a, ay), side(sd, zo + 0.04, zo + 0.07));
      }
  });
  m.scope("spring nests", () => {
    for (const a of axles) for (const sd of sides) coil(m, "spring", xc + a, sd * 1.08, ay + 0.17, win, 0.1, 2, 6);
  });
  m.scope("dampers", () => {
    for (const a of [-AXLE, AXLE])
      for (const sd of sides) {
        const z = sd * (zo + 0.08);
        const lo = xc + a + Math.sign(a) * 0.12, hi = xc + a + Math.sign(a) * 0.5;
        m.rod("bogie", [lo, ay + 0.05, z], [hi, top - 0.06, z], 0.05, 6);
        block(m, "bogie", lo - 0.05, lo + 0.05, ay, ay + 0.1, ...side(sd, zo + 0.04, zo + 0.12));
        block(m, "bogie", hi - 0.05, hi + 0.05, top - 0.11, top - 0.01, ...side(sd, zo, zo + 0.12));
      }
  });
}

function frame(m: MeshBuilder, p: Sd40Paint): void {
  m.scope("deck", () => {
    block(m, p.deck ?? p.frame, -L, L, DECK - 0.04, DECK, -DECK_HALF, DECK_HALF);
    const sill: Ring = [[-DECK_HALF, SILL], [DECK_HALF, SILL], [DECK_HALF, DECK - 0.04], [-DECK_HALF, DECK - 0.04]];
    m.sweep(p.frame, "x", sill, -L, sill, L);
  });
  if (p.sillStripe)
    m.scope("sill stripe", () => {
      const [a, b, mat] = p.sillStripe!;
      for (const sd of sides) decalZ(m, mat, sd * (DECK_HALF + 0.004), sd, -L + 0.65, L - 0.65, DECK - b, DECK - a);
    });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      m.scope("pilot", () => {
        const foot = e > 0 ? 0.62 : 0.2, top = SILL;
        const sec: Ring = e > 0
          ? [[L - 0.32, foot], [L - 0.02, foot], [L, top], [L - 0.32, top]]
          : [[-L + 0.32, foot], [-L + 0.32, top], [-L, top], [-L + 0.1, foot]];
        m.sweep(p.pilot, "z", sec, -0.9, sec, 0.9);
        if (e > 0)
          m.scope("snowplow", () => {
            // two plates leaning forward from the pilot's foot to a point at the rail, a notch-free V in plan
            const yT = 0.62, yB = 0.1, zS = 1.42;
            const A: Vec3 = [L - 0.02, yT, 0], D: Vec3 = [L + 0.36, yB, 0];
            for (const sd of sides) {
              const B: Vec3 = [L - 0.02, yT - 0.12, sd * zS], C: Vec3 = [L + 0.1, yB, sd * zS];
              m.slab(p.pilot, [A, B, D], [-0.04, 0, 0]);
              m.slab(p.pilot, [B, C, D], [-0.04, 0, 0]);
            }
          });
      });
      m.scope("coupler", () => knuckleCoupler(m, e, L, SD40_2_LENGTH / 2, 0.88));
      m.scope("receptacles", () => {
        for (const sd of sides) block(m, "black", ...along(L, L + 0.08), 0.98, 1.2, ...side(sd, 0.72, 0.86));
      });
      m.scope("hoses", () => {
        for (const z of [-0.62, -0.42, 0.42, 0.62]) {
          const x0 = e * (L - 0.02), x1 = e * (L + 0.16);
          m.loft(Math.abs(z) > 0.5 ? "black" : "hose", ngon(6, 0.03, 0, x0, z), 0.62, ngon(6, 0.03, 0, x1, z), 0.95);
        }
      });
      // the corner steps: three treads hung under each corner of the walkway, their stringers and grab irons
      m.scope("steps", () => {
        for (const sd of sides) {
          const z: [number, number] = side(sd, DECK_HALF - 0.6, DECK_HALF - 0.04);
          for (const y of [0.42, 0.78, 1.14]) block(m, "steel", ...along(L - 0.62, L - 0.22), y, y + 0.03, ...z);
          for (const zz of z) block(m, p.pilot, ...along(L - 0.64, L - 0.2), 0.36, SILL, zz - 0.025, zz + 0.025);
          for (const xx of [L - 0.66, L - 0.18]) m.rod(p.rails, [e * xx, 0.5, sd * (DECK_HALF + 0.03)], [e * xx, SILL - 0.05, sd * (DECK_HALF + 0.03)], 0.018, 6);
        }
      });
    });
}

function longHood(m: MeshBuilder, p: Sd40Paint): void {
  const h = HOOD;
  const sec = (half: number, top: number, r: number): Array<[number, number]> => [[-half, DECK], [half, DECK], [half, top - r], [half - r, top], [-(half - r), top], [-half, top - r]];
  m.scope("hood", () => paintedSweep(m, "x", sec(h.half, h.top, h.r), h.x0, h.x1, { bands: p.hood, roofFrom: h.top - h.r * 0.5, roof: p.roof }, [-1]));
  m.scope("cabinet", () => {
    const c = CABINET;
    paintedSweep(m, "x", sec(c.half, c.top, c.r), c.x0, c.x1, { bands: p.hood, roofFrom: c.top - c.r * 0.5, roof: p.roof }, [-1]);
    // the inertial filter's tall grille high on each side, and a hatch on the roof
    for (const sd of sides) {
      const zz = sd * (c.half + 0.004);
      decalZ(m, "grille", zz, sd, INERTIAL.x0, INERTIAL.x1, c.top - 0.86, c.top - c.r - 0.04);
      for (let x = INERTIAL.x0 + 0.06; x < INERTIAL.x1 - 0.05; x += 0.085) decalZ(m, "louvre", zz + sd * 0.004, sd, x, x + 0.035, c.top - 0.82, c.top - c.r - 0.08);
      // a door under the grille
      for (const x of [2.3, 3.05, 3.8]) decalZ(m, "black", zz, sd, x - 0.012, x + 0.012, DECK + 0.12, c.top - 0.95);
    }
    block(m, p.roof, 2.55, 4.1, c.top, c.top + 0.06, -0.7, 0.7);
  });
  m.scope("radiator grilles", () => {
    for (const sd of sides) {
      const zz = sd * (h.half + 0.004);
      for (const [a, b] of RAD_GRILLES) {
        decalZ(m, "grille", zz, sd, a, b, h.top - 0.92, h.top - h.r - 0.06);
        for (let x = a + 0.06; x < b - 0.05; x += 0.085) decalZ(m, "louvre", zz + sd * 0.004, sd, x, x + 0.04, h.top - 0.88, h.top - h.r - 0.1);
      }
    }
  });
  m.scope("dynamic brake", () => {
    for (const sd of sides) {
      // the grille in a shallow box standing proud of the hood's upper side
      const z0 = h.half, z1 = h.half + 0.05;
      block(m, matAt(p.hood, h.top - 0.45), DB_GRILLE.x0, DB_GRILLE.x1, h.top - 0.72, h.top - h.r - 0.02, ...side(sd, z0 - 0.02, z1));
      const zz = sd * (z1 + 0.004);
      decalZ(m, "grille", zz, sd, DB_GRILLE.x0 + 0.06, DB_GRILLE.x1 - 0.06, h.top - 0.68, h.top - h.r - 0.06);
      for (let x = DB_GRILLE.x0 + 0.1; x < DB_GRILLE.x1 - 0.1; x += 0.07) decalZ(m, "louvre", zz + sd * 0.004, sd, x, x + 0.03, h.top - 0.65, h.top - h.r - 0.09);
    }
  });
  m.scope("fans", () => {
    for (const x of RAD_FANS) fan(m, x, h.top, 0.62, p.roof);
    for (const x of DB_FANS) fan(m, x, h.top, 0.52, p.roof);
  });
  m.scope("exhaust", () => exhaust(m, EXHAUST_X, 0, h.top - 0.02, h.top + 0.24, 0.42, 0.62));
  m.scope("roof fittings", () => {
    block(m, p.roof, 0.95, 1.6, h.top - 0.02, h.top + 0.1, -0.45, 0.45);
    m.prism("black", ngon(6, 0.02, 0, -2.3, 0.4), h.top - 0.02, h.top + 0.38);
    block(m, "black", -2.42, -2.18, h.top + 0.33, h.top + 0.38, 0.38, 0.42);
  });
  // the engine room doors: seams and latches between the frame and the grilles
  m.scope("doors", () => {
    const doors = [-8.2, -7.45, -6.7, -5.95, -5.2, -4.45, -3.7, -2.95, -2.2, -1.45, -0.7, 0.05, 0.8, 1.5, 2.05];
    for (const sd of sides) {
      const zz = sd * (h.half + 0.004);
      for (let i = 0; i < doors.length; i++) {
        const x = doors[i]!;
        decalZ(m, "black", zz, sd, x - 0.008, x + 0.008, DECK + 0.14, h.top - 0.97);
        if (i + 1 < doors.length) {
          const xm = (x + doors[i + 1]!) / 2;
          decalZ(m, "black", zz, sd, xm - 0.05, xm + 0.05, DECK + 1.1, DECK + 1.15);
          decalZ(m, "black", zz, sd, xm - 0.05, xm + 0.05, DECK + 1.75, DECK + 1.8);
        }
      }
    }
  });
  m.scope("rear headlight", () => {
    const x = h.x0, y = h.top - 0.34;
    block(m, "black", x - 0.12, x + 0.002, y - 0.04, y + 0.2, -0.2, 0.2);
    for (const z of [-0.09, 0.09]) extrude(m, "lampHead", "x", ngon(10, 0.075, 0, z, y + 0.08), [x - 0.14, x - 0.12]);
    for (const z of [-0.62, 0.62]) {
      block(m, "black", x - 0.07, x + 0.002, y - 0.16, y + 0.06, z - 0.27, z + 0.27);
      block(m, "numberBoard", x - 0.08, x - 0.07, y - 0.13, y + 0.03, z - 0.24, z + 0.24);
      panelText(m, "black", p.number, [x - 0.08, z - 0.24], [x - 0.08, z + 0.24], [-1, 0], y - 0.11, 0.11, 0.065, 0.02, 0.004);
    }
    for (const z of [-0.85, 0.85]) extrude(m, "lampRed", "x", ngon(8, 0.06, 0, z, DECK + 0.5), [x - 0.03, x - 0.002]);
    // the end's grab iron and the stirrups up to the roof on its left
    m.rod(p.rails, [x - 0.08, DECK + 0.9, -0.5], [x - 0.08, DECK + 0.9, 0.5], 0.016, 6);
    for (let k = 0; k < 6; k++) {
      const yy = DECK + 1.25 + k * 0.32;
      m.rod(p.rails, [x - 0.1, yy, -0.98], [x - 0.1, yy, -0.78], 0.014, 4);
      for (const z of [-0.98, -0.78]) m.rod(p.rails, [x, yy, z], [x - 0.1, yy, z], 0.012, 4);
    }
  });
}

/** A roof fan: shroud, grille and the guard's cross bars. */
function fan(m: MeshBuilder, x: number, y: number, r: number, mat: string): void {
  m.scope("fan", () => {
    m.prism(mat, ngon(16, r, 0, x, 0), y - 0.04, y + 0.1, false);
    m.prism("fanGuard", ngon(16, r - 0.04, 0, x, 0), y - 0.04, y + 0.06);
    // the guard: eight spokes and a ring of wire over the blades
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      m.rod("fanGuard", [x + Math.cos(a) * 0.08, y + 0.08, Math.sin(a) * 0.08], [x + Math.cos(a) * (r - 0.05), y + 0.08, Math.sin(a) * (r - 0.05)], 0.018, 4);
    }
    m.prism("fanGuard", ngon(8, 0.1, 0, x, 0), y + 0.06, y + 0.1);
  });
}

function nose(m: MeshBuilder, p: Sd40Paint): void {
  const n = NOSE;
  // a loft of plans with the front corners rounded (radius NOSE_R), drawn in toward the rounded top edge
  const ring = (inset: number): Ring => {
    const r = NOSE_R, hw = n.half - inset, cx = n.x1 - inset - r, out: Ring = [];
    for (let i = 0; i <= 4; i++) { const a = (i / 4) * (Math.PI / 2); out.push([cx + r * Math.cos(a), -(hw - r) - r * Math.sin(a)]); }
    out.push([n.x0, -hw], [n.x0, hw]);
    for (let i = 0; i <= 4; i++) { const a = 1.5 * Math.PI + (i / 4) * (Math.PI / 2); out.push([cx + r * Math.cos(a), hw - r - r * Math.sin(a)]); }
    return out;
  };
  const stations: Array<[number, number]> = [[DECK, 0], [n.top - 0.26, 0], [n.top - 0.1, 0.05], [n.top, 0.17]];
  m.scope("nose", () => {
    for (let i = 0; i + 1 < stations.length; i++) {
      const [y0, a] = stations[i]!, [y1, b] = stations[i + 1]!;
      m.loft(matAt(p.nose, (y0 + y1) / 2), ring(a), y0, ring(b), y1, false);
    }
    m.cap(p.noseTop, ring(0.17), n.top);
  });
  m.scope("nose fittings", () => {
    // the sand fillers on the nose sides, the front grab irons, the bell on the nose top
    for (const sd of sides) extrude(m, "black", "z", ngon(10, 0.11, 0, n.x1 - 0.65, n.top - 0.45), side(sd, n.half, n.half + 0.03));
    for (const sd of sides) {
      const z = sd * 0.62;
      m.rod(p.rails, [n.x1 + 0.08, DECK + 0.45, z], [n.x1 + 0.08, DECK + 1.25, z], 0.016, 6);
      for (const y of [DECK + 0.45, DECK + 1.25]) m.rod(p.rails, [n.x1, y, z], [n.x1 + 0.08, y, z], 0.014, 4);
    }
    // marker lights at the nose's upper corners
    for (const sd of sides) extrude(m, "lampRed", "x", ngon(8, 0.05, 0, sd * (n.half - NOSE_R - 0.08), n.top - 0.42), [n.x1 - 0.002, n.x1 + 0.03]);
  });
  m.scope("bell", () => {
    const x = n.x0 + 0.55;
    block(m, "black", x - 0.05, x + 0.05, n.top, n.top + 0.12, -0.06, 0.06);
    m.loft("horn", ngon(10, 0.14, 0, x, 0), n.top + 0.12, ngon(10, 0.08, 0, x, 0), n.top + 0.3);
  });
  if (p.noseName) m.scope("nose name", () => {
    const [text, mat] = p.noseName!;
    const pts = strokeText(text, -strokeWidth(text, 0.13, 0.045) / 2, n.top - 1.05, 0.24, 0.13, 0.045, false, 0.042).map(([u, v]): Vec3 => [n.x1 + 0.004, v, -u]);
    m.facets(mat, pts, [1, 0, 0]);
  });
}

function cab(m: MeshBuilder, p: Sd40Paint): void {
  const c = CAB;
  const plan: Array<[number, number]> = [[c.x0, -c.half], [c.xs, -c.half], [c.xf, -c.cornerZ], [c.xf, c.cornerZ], [c.xs, c.half], [c.x0, c.half]];
  // walls: 0 left side, 1 left corner, 2 front, 3 right corner, 4 right side, 5 rear (inside the cabinet's section skipped by paint only)
  const front = (i: number) => i === 1 || i === 2 || i === 3;
  m.scope("shell", () => {
    planWalls(m, plan, DECK, c.wallTop, (i) => (front(i) ? p.cabFront : p.cabSide));
    // the header over the front: the twin headlight's housing in the middle, the number boards on its angled corners
    const hp: Array<[number, number]> = [[c.x0, -c.half], [c.xf - 0.24, -c.half], [c.xf + 0.06, -0.98], [c.xf + 0.06, 0.98], [c.xf - 0.24, c.half], [c.x0, c.half]];
    planWalls(m, hp, c.wallTop, c.headerTop, (i) => (front(i) ? [[0, 9, p.header]] : p.cabSide));
    // its underside (only the part ahead of the walls shows)
    const under: Vec3[] = [];
    for (let i = 1; i + 1 < hp.length; i++) for (const q of [hp[0]!, hp[i]!, hp[i + 1]!]) under.push([q[0], c.wallTop, q[1]]);
    m.facets(p.header, under, [0, -1, 0]);
  });
  m.scope("roof", () => {
    const y0 = c.headerTop, y1 = c.top;
    const sec: Array<[number, number]> = [[-c.half - 0.04, y0], [c.half + 0.04, y0], [c.half + 0.04, y0 + 0.04], [c.half - 0.35, y1], [-(c.half - 0.35), y1], [-c.half - 0.04, y0 + 0.04]];
    paintedSweep(m, "x", sec, c.x0 - 0.02, c.xf + 0.12, { bands: [[0, 9, p.cabRoof]], roofFrom: 0, roof: p.cabRoof });
  });
  // windscreens: two panes over the nose on the front wall
  m.scope("windscreen", () => {
    const y0 = NOSE.top + 0.1, y1 = c.wallTop - 0.06;
    for (const sd of sides) {
      decalX(m, "rubber", c.xf + 0.004, 1, ...side(sd, 0.1, c.cornerZ - 0.1), y0, y1);
      decalX(m, "glass", c.xf + 0.008, 1, ...side(sd, 0.14, c.cornerZ - 0.14), y0 + 0.04, y1 - 0.04);
      m.rod("black", [c.xf + 0.016, y0 + 0.05, sd * 0.62], [c.xf + 0.016, y0 + 0.42, sd * 0.4], 0.01, 4);
    }
  });
  // the angled corners: a door each with its tall window
  m.scope("doors", () => {
    for (const sd of sides) {
      const p0: [number, number] = [c.xs, sd * c.half], p1: [number, number] = [c.xf, sd * c.cornerZ];
      const nn = unit(p1[1] - p0[1], -(p1[0] - p0[0]));
      const n: [number, number] = nn[0] > 0 ? nn : [-nn[0], -nn[1]];
      panelRect(m, "rubber", p0, p1, n, 0.2, 0.82, 2.95, c.wallTop - 0.08, 0.004);
      panelRect(m, "glass", p0, p1, n, 0.27, 0.75, 3.0, c.wallTop - 0.12, 0.008);
      for (const t of [0.1, 0.92]) panelRect(m, "black", p0, p1, n, t - 0.02, t + 0.02, DECK + 0.06, c.wallTop - 0.04, 0.004);
      panelRect(m, "steel", p0, p1, n, 0.14, 0.24, DECK + 1.0, DECK + 1.06, 0.004);
    }
  });
  m.scope("side windows", () => {
    for (const sd of sides) {
      const zz = sd * (c.half + 0.004);
      const xa = 5.55, xb = 6.6, ya = 3.3, yb = 4.02;
      decalZ(m, "rubber", zz, sd, xa, xb, ya, yb);
      decalZ(m, "glass", zz + sd * 0.004, sd, xa + 0.04, (xa + xb) / 2 - 0.02, ya + 0.04, yb - 0.04);
      decalZ(m, "glass", zz + sd * 0.004, sd, (xa + xb) / 2 + 0.02, xb - 0.04, ya + 0.04, yb - 0.04);
      // the awning over the window and the small rear window
      m.slab(p.cabSide[p.cabSide.length - 1]![2], [[xa - 0.06, yb + 0.1, sd * c.half], [xb + 0.06, yb + 0.1, sd * c.half], [xb + 0.06, yb + 0.06, sd * (c.half + 0.09)], [xa - 0.06, yb + 0.06, sd * (c.half + 0.09)]], [0, -0.025, 0]);
    }
  });
  m.scope("rear windows", () => {
    for (const sd of sides) {
      decalX(m, "rubber", c.x0 - 0.004, -1, ...side(sd, CABINET.half + 0.08, c.half - 0.1), 3.4, 4.0);
      decalX(m, "glass", c.x0 - 0.008, -1, ...side(sd, CABINET.half + 0.12, c.half - 0.14), 3.44, 3.96);
    }
  });
  m.scope("headlight", () => {
    const x = c.xf + 0.06;
    block(m, p.header, x - 0.2, x + 0.08, c.wallTop + 0.02, c.top + 0.12, -0.2, 0.2);
    for (const y of [c.wallTop + 0.16, c.wallTop + 0.4]) {
      extrude(m, "black", "x", ngon(10, 0.12, 0, 0, y), [x + 0.08, x + 0.1]);
      extrude(m, "lampHead", "x", ngon(10, 0.09, 0, 0, y), [x + 0.1, x + 0.115]);
    }
  });
  m.scope("number boards", () => {
    for (const sd of sides) {
      const p0: [number, number] = [c.xf + 0.06, sd * 0.98], p1: [number, number] = [c.xf - 0.24, sd * c.half];
      const nn = unit(p1[1] - p0[1], -(p1[0] - p0[0]));
      const n: [number, number] = nn[0] > 0 ? nn : [-nn[0], -nn[1]];
      panelRect(m, "black", p0, p1, n, 0.06, 0.94, c.wallTop + 0.05, c.headerTop - 0.04, 0.004);
      panelRect(m, "numberBoard", p0, p1, n, 0.1, 0.9, c.wallTop + 0.08, c.headerTop - 0.07, 0.008);
      panelText(m, "black", p.number, p0, p1, n, c.wallTop + 0.11, 0.13, 0.075, 0.025, 0.012);
    }
  });
  m.scope("horn", () => {
    const x = c.xf - 0.04, y = c.top + 0.27;
    block(m, "horn", x - 0.05, x + 0.05, c.top + 0.12, y - 0.04, -0.05, 0.05);
    horn(m, 1, x, 0.12, y);
    horn(m, -1, x, 0, y + 0.05);
    horn(m, 1, x, -0.12, y);
  });
  m.scope("antenna", () => m.prism("black", ngon(6, 0.025, 0, c.x0 + 0.4, 0.7), c.top - 0.02, c.top + 0.18));
  // grab irons beside the corner doors and the cab side
  m.scope("grab irons", () => {
    for (const sd of sides) {
      m.rod(p.rails, [c.xs - 0.05, DECK + 0.9, sd * (c.half + 0.06)], [c.xs - 0.05, DECK + 2.2, sd * (c.half + 0.06)], 0.016, 6);
      m.rod(p.rails, [c.x0 + 0.08, DECK + 0.9, sd * (c.half + 0.06)], [c.x0 + 0.08, DECK + 2.2, sd * (c.half + 0.06)], 0.016, 6);
    }
  });
}

function walkways(m: MeshBuilder, p: Sd40Paint): void {
  const y = DECK + 1.02, z = DECK_HALF - 0.03;
  const runs: Array<[number, number]> = [[-L + 0.3, CAB.x0 - 0.1], [CAB.xs + 0.15, L - 0.3]];
  for (const sd of sides)
    m.scope(sd > 0 ? "right rail" : "left rail", () => {
      for (const [a, b] of runs) {
        const zc = sd * z;
        tubeX(m, p.rails, 0.02, a, y, zc, b, y, zc, 6);
        const n = Math.max(1, Math.round((b - a) / 1.45));
        for (let i = 0; i <= n; i++) m.prism(p.rails, ngon(6, 0.022, 0, a + ((b - a) * i) / n, zc), DECK, y);
      }
    });
  m.scope("end rails", () => {
    for (const e of [1, -1]) {
      const x = e * (L - 0.3);
      for (const sd of sides) m.rod(p.rails, [x, y, sd * 0.55], [x, y, sd * z], 0.02, 6);
      for (const sd of sides) m.prism(p.rails, ngon(6, 0.022, 0, x, sd * 0.55), DECK, y);
    }
  });
}

function underframe(m: MeshBuilder, p: Sd40Paint): void {
  const t = TANK;
  m.scope("fuel tank", () => {
    const sec = (k: number): Ring => {
      // a bulged body: the sides swelling out below the top, the lower edges rounded on a 0.42 m radius
      const hw = t.half * k, bot = t.y0 + (1 - k) * 0.2, r = 0.42 * k, cy = bot + r;
      const right: Array<[number, number]> = [[hw - 0.06, t.top], [hw, t.top - 0.12]];
      for (let i = 0; i <= 5; i++) { const a = (i / 5) * (Math.PI / 2); right.push([hw - r + r * Math.cos(a), cy - r * Math.sin(a)]); }
      return [...right, ...right.slice().reverse().map(([z, y]): [number, number] => [-z, y])];
    };
    m.sweep(p.tank, "x", sec(1), t.x0 + 0.3, sec(1), t.x1 - 0.3, false);
    m.sweep(p.tank, "x", sec(0.86), t.x0, sec(1), t.x0 + 0.3, false);
    m.sweep(p.tank, "x", sec(1), t.x1 - 0.3, sec(0.86), t.x1, false);
    for (const x of [t.x0, t.x1]) {
      const q = sec(0.86);
      const pts: Vec3[] = [];
      for (let i = 1; i + 1 < q.length; i++) for (const r of [q[0]!, q[i]!, q[i + 1]!]) pts.push([x, r[1], r[0]]);
      m.facets(p.tank, pts, [Math.sign(x), 0, 0]);
    }
    for (const sd of sides) {
      decalZ(m, "white", sd * (t.half + 0.004), sd, -0.5, 0.3, t.top - 0.3, t.top - 0.17);
      block(m, "steel", t.x1 - 0.7, t.x1 - 0.5, t.top - 0.34, t.top - 0.16, ...side(sd, t.half, t.half + 0.05));
      extrude(m, "white", "z", ngon(10, 0.07, 0, t.x1 - 1.1, t.top - 0.24), side(sd, t.half, t.half + 0.02));
    }
  });
  m.scope("air reservoirs", () => {
    for (const sd of sides) tankX(m, "tank", -3.3, 0.9, sd * 1.12, 1.12, 0.15);
  });
}

// ---------------------------------------------------------------------------
// The distant model: the kit's, from a spec and livery that follow this body

const LOD_SPEC: UsHoodSpec = {
  length: SD40_2_LENGTH, endSill: L, deck: DECK, sillBottom: SILL, deckHalf: DECK_HALF,
  hood: { x0: HOOD.x0, x1: CAB.x0, half: HOOD.half, top: HOOD.top, r: HOOD.r },
  front: { kind: "lowNose", x0: CAB.xf, x1: NOSE.x1, top: NOSE.top },
  cab: { x0: CAB.x0, x1: CAB.xf, half: CAB.half, top: CAB.top, kind: "classic" },
  radiator: { x0: RAD_GRILLES[0]![0], x1: RAD_GRILLES[1]![1], kind: "grilles", fans: RAD_FANS, fanR: 0.62 },
  exhaustX: EXHAUST_X,
  trucks: { centre: SD40_2_TRUCK_CENTRE, sideFrame: "htc", spec: HTC },
  tank: { x0: TANK.x0, x1: TANK.x1, y0: TANK.y0, half: TANK.half },
  ditchLights: false,
};

function lodLivery(p: Sd40Paint): UsLivery {
  return {
    title: p.title, railroad: "", letterH: 0.4, letterY: 1.2, number: p.number, palette: p.palette,
    body: p.hood, cab: p.cabSide, ends: p.nose, roof: p.roof, cabRoof: p.cabRoof, frame: p.frame,
    trucks: p.trucks, pilot: p.pilot, letter: p.rails, numberMat: p.rails, rails: p.rails,
  };
}

export function sd40_2Lod(p: Sd40Paint): MeshBuilder {
  return usHoodLod(LOD_SPEC, lodLivery(p));
}
