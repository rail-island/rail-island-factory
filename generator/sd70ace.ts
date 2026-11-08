// The EMD SD70ACe (2004) drawn on its own, from photographs of the class
// (assets/emd-sd70ace/SOURCES.md): the wide nose and the tall, flat-faced
// isolated cab with its brow of number boards, the inertial filter and dynamic
// brake boxes behind the cab, the low engine hood, the flared radiator with its
// sloped cores and two fans, HTSC trucks, the long fuel tank between them, and
// the Union Pacific, Norfolk Southern and BNSF Heritage III paint. The other US
// hood units stay on the shared kit (usHoodKit.ts); this module borrows its
// painted sweeps, decals, lettering and coupler. Metres, +X toward the cab (the
// F end), wheel contact at y = 0, centred across z. See docs/models/us-diesels.md.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { tubeX } from "./cd163.ts";
import { block, bogie, exhaust, extrude, horn, paint, side, tankX, type BogieSpec } from "./dieselParts.ts";
import { US_PALETTE, decalX, decalZ, endText, knuckleCoupler, paintedSweep, sideText, type Band, type Paint } from "./usHoodKit.ts";
import { LOD_GLASS, lodBands, type LodBand, type LodShell } from "./lodKit.ts";
import { locoLod, sideWindows, type LocoBox } from "./lodLocos.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;

// ---------------------------------------------------------------------------
// Measures: published figures (length, truck centres and wheelbase, wheels,
// height, cab width; The Diesel Shop's SD70ACe data sheet) and, for the rest,
// the photographs measured in SOURCES.md.

export const SD70ACE = {
  length: ft(74, 3),
  /** |x| of the end sills, the walkway's top, the side sill's bottom, the walkway's half width. */
  endSill: 10.78, deck: 1.72, sill: 1.42, deckHalf: 1.6,
  /** The wide nose: its front face, the cab's front at its foot, the front's top edge, the bevel back to the top, the top. */
  nose: { x0: 8.85, x1: 9.95, bevel: 9.6, front: 3.42, top: 3.78, half: 1.52, chamfer: 3.32, topHalf: 1.2 },
  /** The isolated cab: rear wall, the windscreen's foot and head, roof, half width. */
  cab: { x0: 6.45, x1: 8.85, head: 8.73, roofX: 8.66, top: 4.8, half: 1.55, screen: [3.92, 4.5] as const },
  /** Hood-width boxes behind the cab: the inertial filter cabinet, the dynamic brake, the engine hood. */
  hoodHalf: 1.12,
  filter: { x0: 2.85, x1: 6.45, top: 4.58 },
  brake: { x0: 1.0, x1: 2.85, top: 4.78 },
  hood: { x0: -2.66, x1: 1.0, top: 4.22 },
  /** The radiator: tall to the rear end, its upper sides flared over the walkways from x1 back to flareX. */
  radiator: { x0: -10.22, x1: -2.66, flareX: -8.3, top: 4.78, half: 1.56, flareFoot: 3.6, flareKnee: 4.18, fans: [-4.25, -6.65], fanR: 0.7 },
  exhaustX: -1.25,
  trucks: { centre: ft(47, 10) / 2, axle: ft(6, 9.5), wheelR: ft(0, 21) },
  tank: { x0: -4.1, x1: 4.35, y0: 0.34, y1: 1.04, half: 1.42 },
} as const;

const S = SD70ACE;

// ---------------------------------------------------------------------------
// Paint

export type Sd70Key = "unionPacific" | "norfolkSouthern" | "bnsf";

interface Sd70Paint {
  palette: Record<string, MaterialSpec>;
  /** Hood, boxes and radiator sides by height; their roofs. */
  body: readonly Band[];
  roof: string;
  /** The cab's sides by height; the cab's front wall around the windscreens; its roof and brow. */
  cab: readonly Band[];
  cabFront: string;
  cabRoof: string;
  brow: string;
  /** The nose: sides, front face, the bevel over the front, its side chamfers and top. */
  noseSide: string;
  noseFront: string;
  noseBevel: string;
  noseTop: string;
  noseChamfer: string;
  /** The rear wall of the radiator, by height. */
  rear: readonly Band[];
  frame: string;
  /** A stripe on the side sill (offsets below the deck). */
  sillStripe?: readonly [number, number, string];
  anticlimber: string;
  pilot: string;
  trucks: string;
  sideRails: string;
  endRails: string;
  awning: string;
  letter: string;
  numberMat: string;
  number: string;
  numberH: number;
  numberY: number;
  /** Where the headlights are: in the cab's brow between the number boards, or on the nose. */
  headlight: "brow" | "nose";
  /** The railroad's emblems, stripes and lettering. */
  decals: (m: MeshBuilder, part: "ends" | "hood") => void;
}

const C = {
  upYellow: paint("#f4bd2a"), upGrey: paint("#a2a4a4"), upRed: paint("#b8202b"), upBlue: paint("#1d3f8f"), upWhite: paint("#f0efe8"),
  nsBlack: paint("#1a1b1d"), nsWhite: paint("#ecebe5"), nsGrey: paint("#c4c5c2"), nsYellow: paint("#e5b822"),
  bnsfOrange: paint("#e8601f"), bnsfBlack: paint("#1f2022"), bnsfYellow: paint("#f2c31a"),
  truckGrey: paint("#4c4e50", 0.8), truckBlack: paint("#242527", 0.85), dark: paint("#2a2c2e", 0.8),
};
const pick = (...names: Array<keyof typeof C>) => Object.fromEntries(names.map((n) => [n, C[n]]));

/** A flat polygon (z, y) on the plane x = x facing e, triangulated as a fan (convex). */
function polyX(m: MeshBuilder, mat: string, x: number, e: number, pts: ReadonlyArray<readonly [number, number]>): void {
  const out: Vec3[] = [];
  for (let i = 1; i + 1 < pts.length; i++) out.push([x, pts[0]![1], pts[0]![0]], [x, pts[i]![1], pts[i]![0]], [x, pts[i + 1]![1], pts[i + 1]![0]]);
  m.facets(mat, out, [e, 0, 0]);
}

/** A flat polygon (x, y) on the plane z = z facing s (convex). */
function polyZ(m: MeshBuilder, mat: string, z: number, s: number, pts: ReadonlyArray<readonly [number, number]>): void {
  const out: Vec3[] = [];
  for (let i = 1; i + 1 < pts.length; i++) out.push([pts[0]![0], pts[0]![1], z], [pts[i]![0], pts[i]![1], z], [pts[i + 1]![0], pts[i + 1]![1], z]);
  m.facets(mat, out, [0, 0, s]);
}

const N = S.nose, CB = S.cab, H = S.hoodHalf;
const noseFaceX = N.x1 + 0.004;

/** Union Pacific: armour yellow, harbour mist grey above a red pinstripe at the cab's window sill, the winged shield on the nose. */
function unionPacific(): Sd70Paint {
  const stripe = 3.76;
  const body: Band[] = [[0, stripe, "upYellow"], [stripe, stripe + 0.06, "upRed"], [stripe + 0.06, 9, "upGrey"]];
  return {
    palette: pick("upYellow", "upGrey", "upRed", "upBlue", "upWhite", "truckGrey", "dark"),
    body, roof: "upGrey", cab: body, cabFront: "upGrey", cabRoof: "upGrey", brow: "upGrey",
    noseSide: "upYellow", noseFront: "upYellow", noseBevel: "upYellow", noseTop: "upYellow", noseChamfer: "upGrey",
    rear: body, frame: "upGrey", sillStripe: [0.0, 0.06, "upRed"], anticlimber: "upYellow", pilot: "dark", trucks: "truckGrey",
    sideRails: "handrail", endRails: "handrail", awning: "upGrey", letter: "upRed", numberMat: "upRed", number: "8500", numberH: 0.66, numberY: 2.86,
    headlight: "brow",
    decals: (m, part) => {
      if (part === "ends") m.scope("wings", () => {
        // the shield: white, red and white stripes below a blue chief
        const sy0 = 2.78, sy1 = 3.38, sw = 0.26;
        polyX(m, "upWhite", noseFaceX, 1, [[-sw, sy1], [-sw, sy0 + 0.14], [0, sy0], [sw, sy0 + 0.14], [sw, sy1]]);
        polyX(m, "upBlue", noseFaceX + 0.003, 1, [[-sw + 0.03, sy1 - 0.03], [-sw + 0.03, sy1 - 0.18], [sw - 0.03, sy1 - 0.18], [sw - 0.03, sy1 - 0.03]]);
        for (const z of [-0.12, 0, 0.12]) polyX(m, "upRed", noseFaceX + 0.003, 1, [[z - 0.035, sy1 - 0.22], [z - 0.035, sy0 + 0.12 - Math.abs(z) * 0.5], [z + 0.035, sy0 + 0.12 - Math.abs(z) * 0.5], [z + 0.035, sy1 - 0.22]]);
        // three blue feathers a side, swept up at the tips, shorter downward
        const feathers: Array<[number, number, number]> = [[3.16, 3.32, 1.44], [2.96, 3.1, 1.3], [2.78, 2.9, 1.05]];
        for (const sd of [-1, 1])
          for (const [y0, y1, reach] of feathers) {
            const za = sd * 0.27, zb = sd * reach;
            polyX(m, "upBlue", noseFaceX, 1, sd > 0
              ? [[za, y0], [zb - 0.08, y0], [zb, y1 + 0.06], [za, y1]]
              : [[zb + 0.08, y0], [za, y0], [za, y1], [zb, y1 + 0.06]]);
          }
      });
      if (part === "hood") m.scope("lettering", () => {
        for (const sd of [-1, 1]) sideText(m, "upRed", "UNION PACIFIC", sd, H + 0.009, -0.6, 2.62, 0.5);
      });
    },
  };
}

/** Norfolk Southern: black, the white stripes across the nose, the NS speed lines and name on the hood, the grey brow. */
function norfolkSouthern(): Sd70Paint {
  const body: Band[] = [[0, 9, "nsBlack"]];
  const stripes: Array<[number, number]> = [[3.08, 3.2], [2.82, 2.94], [2.56, 2.68], [2.3, 2.42], [2.04, 2.16]];
  return {
    palette: pick("nsBlack", "nsWhite", "nsGrey", "nsYellow", "truckBlack"),
    body, roof: "nsBlack", cab: body, cabFront: "nsBlack", cabRoof: "nsBlack", brow: "nsGrey",
    noseSide: "nsBlack", noseFront: "nsBlack", noseBevel: "nsBlack", noseTop: "nsBlack", noseChamfer: "nsBlack",
    rear: body, frame: "nsBlack", sillStripe: [0.32, 0.38, "nsWhite"], anticlimber: "nsGrey", pilot: "nsBlack", trucks: "truckBlack",
    sideRails: "nsBlack", endRails: "nsYellow", awning: "nsGrey", letter: "nsWhite", numberMat: "nsWhite", number: "1000", numberH: 0.42, numberY: 3.02,
    headlight: "brow",
    decals: (m, part) => {
      if (part === "ends") m.scope("nose stripes", () => {
        // across the front, broken in the middle for the horse's white field, and back along the nose's sides
        for (const [y0, y1] of stripes) {
          for (const sd of [-1, 1]) decalX(m, "nsWhite", noseFaceX, 1, ...side(sd, 0.34, N.half - 0.02), y0, y1);
          for (const sd of [-1, 1]) decalZ(m, "nsWhite", sd * (N.half + 0.004), sd, N.x0 + 0.12, N.x1 - 0.004, y0, y1);
        }
        decalX(m, "nsWhite", noseFaceX, 1, -0.3, 0.3, 2.04, 3.2);
        // the stripes slanting up the rear cabinet's sides to the end
        const x0 = S.radiator.x0 + 0.004;
        for (const [i, [y0, y1]] of stripes.entries()) {
          const a = x0 + 0.95 - i * 0.12, yy0 = y0 + 0.85, yy1 = y1 + 0.85;
          for (const sd of [-1, 1]) polyZ(m, "nsWhite", sd * (H + 0.012), sd, [[x0, yy0], [a, yy0], [a + 0.1, yy1], [x0, yy1]]);
        }
      });
      if (part === "hood") m.scope("lettering", () => {
        for (const sd of [-1, 1]) {
          const zw = H + 0.009;
          // the speed lines ahead of the NS (the horse's head stands in their gap on the real one)
          const xNs = 0.4;
          const lead = (x: number) => xNs + 0.75 + x;
          for (let i = 0; i < 5; i++) {
            const y0 = 3.1 + i * 0.16, y1 = y0 + 0.1, len = 1.25 + i * 0.12;
            const xa = lead(0), xb = lead(len);
            polyZ(m, "nsWhite", sd * zw, sd, [[Math.min(xa, xb), y0], [Math.max(xa, xb), y0], [Math.max(xa, xb), y1], [Math.min(xa, xb), y1]]);
          }
          sideText(m, "nsWhite", "NS", sd, zw, xNs, 3.08, 0.86, 0.6, 0.1);
          sideText(m, "nsWhite", "NORFOLK", sd, zw, xNs - 0.25, 2.48, 0.32);
          sideText(m, "nsWhite", "SOUTHERN", sd, zw, xNs - 0.25, 2.06, 0.32);
        }
      });
    },
  };
}

/** BNSF Heritage III: orange, the hood's black top over a yellow-black-yellow pinstripe that swoops down behind the cab, BNSF on the nose. */
function bnsf(): Sd70Paint {
  const p0 = 3.5;
  const body: Band[] = [[0, p0, "bnsfOrange"], [p0, p0 + 0.06, "bnsfYellow"], [p0 + 0.06, p0 + 0.1, "bnsfBlack"], [p0 + 0.1, p0 + 0.16, "bnsfYellow"], [p0 + 0.16, 9, "bnsfBlack"]];
  return {
    palette: pick("bnsfOrange", "bnsfBlack", "bnsfYellow", "truckBlack"),
    body, roof: "bnsfBlack", cab: [[0, 9, "bnsfOrange"]], cabFront: "bnsfOrange", cabRoof: "bnsfOrange", brow: "bnsfOrange",
    noseSide: "bnsfOrange", noseFront: "bnsfOrange", noseBevel: "bnsfOrange", noseTop: "bnsfOrange", noseChamfer: "bnsfBlack",
    rear: [[0, p0, "bnsfOrange"], [p0, 9, "bnsfBlack"]], frame: "bnsfBlack", sillStripe: [0.0, 0.06, "bnsfYellow"], anticlimber: "bnsfYellow", pilot: "bnsfBlack", trucks: "truckBlack",
    sideRails: "bnsfYellow", endRails: "bnsfYellow", awning: "bnsfOrange", letter: "bnsfBlack", numberMat: "bnsfBlack", number: "9200", numberH: 0.62, numberY: 2.82,
    headlight: "nose",
    decals: (m, part) => {
      if (part === "ends") m.scope("swoosh", () => {
        // the pinstripes leave the hood behind the cab and run down to the walkway, then forward
        // along the cab and the nose at the deck, as on the real one
        const xa = CB.x0, xb = CB.x0 + 0.85, zc = CB.half + 0.004;
        const lanes: Array<[number, number, string]> = [[0.0, 0.06, "bnsfYellow"], [0.06, 0.1, "bnsfBlack"], [0.1, 0.16, "bnsfYellow"]];
        const yLow = S.deck + 0.06;
        for (const sd of [-1, 1])
          for (const [a, b, mat] of lanes) {
            const z = sd * zc;
            polyZ(m, mat, z, sd, [[xa, p0 + a], [xa, p0 + b], [xb, yLow + b], [xb, yLow + a]]);
            decalZ(m, mat, z, sd, xb, CB.x1 - 0.004, yLow + a, yLow + b);
            decalZ(m, mat, sd * (N.half + 0.004), sd, N.x0 + 0.004, N.x1 - 0.004, yLow + a, yLow + b);
          }
      });
      if (part === "ends") m.scope("nose lettering", () => {
        // BNSF across the nose, over the black swoosh line and its yellow edge
        endText(m, "bnsfBlack", "BNSF", 1, noseFaceX, 0, 2.36, 0.4, 0.42, 0.1);
        decalX(m, "bnsfBlack", noseFaceX, 1, -N.half + 0.02, N.half - 0.02, 2.2, 2.3);
        decalX(m, "bnsfYellow", noseFaceX, 1, -N.half + 0.02, N.half - 0.02, 2.13, 2.17);
        for (const sd of [-1, 1]) {
          decalZ(m, "bnsfBlack", sd * (N.half + 0.004), sd, N.x0 + 0.004, N.x1 - 0.004, 2.2, 2.3);
          decalZ(m, "bnsfYellow", sd * (N.half + 0.004), sd, N.x0 + 0.004, N.x1 - 0.004, 2.13, 2.17);
        }
      });
      if (part === "hood") m.scope("lettering", () => {
        for (const sd of [-1, 1]) {
          const zw = H + 0.009;
          sideText(m, "bnsfBlack", "BNSF", sd, zw, -0.4, 2.28, 0.78, 0.62, 0.16);
          // the swoosh line under the hood's letters
          polyZ(m, "bnsfBlack", sd * zw, sd, [[-2.4, 2.1], [1.7, 2.12], [1.7, 2.2], [-2.4, 2.16]]);
        }
      });
    },
  };
}

const PAINTS: Record<Sd70Key, () => Sd70Paint> = { unionPacific, norfolkSouthern, bnsf };

// ---------------------------------------------------------------------------
// Convex solids painted face by face: the nose and the cab's front are convex
// hulls of a few corner points; each face is cut at the given heights and every
// piece takes the paint its normal and height call for.

interface HullFace { n: Vec3; pts: Vec3[] }

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const centroid = (ps: readonly Vec3[]): Vec3 => {
  const c: Vec3 = [0, 0, 0];
  for (const p of ps) for (let k = 0; k < 3; k++) c[k] += p[k]! / ps.length;
  return c;
};

/** The faces of the convex hull of `pts`, each an outward normal and its corners in order (deterministic). */
export function hullFaces(pts: readonly Vec3[]): HullFace[] {
  const eps = 1e-7;
  const faces: HullFace[] = [];
  const keys = new Set<string>();
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      for (let k = j + 1; k < pts.length; k++) {
        const a = pts[i]!;
        let n = cross(sub(pts[j]!, a), sub(pts[k]!, a));
        const l = Math.hypot(...n);
        if (l < 1e-9) continue;
        n = [n[0] / l, n[1] / l, n[2] / l];
        let d = dot(n, a), pos = 0, neg = 0;
        for (const p of pts) {
          const s = dot(n, p) - d;
          if (s > eps) pos++;
          else if (s < -eps) neg++;
        }
        if (pos && neg) continue;
        if (pos) { n = [-n[0], -n[1], -n[2]]; d = -d; }
        const key = [...n, d].map((v) => (Math.round(v * 1e5) / 1e5 + 0).toFixed(5)).join(",");
        if (keys.has(key)) continue;
        keys.add(key);
        const on: Vec3[] = [];
        for (const p of pts) if (Math.abs(dot(n, p) - d) < 1e-6 && !on.some((q) => Math.hypot(...sub(p, q)) < 1e-9)) on.push(p);
        const c = centroid(on);
        const u0 = sub(on[0]!, c);
        const ul = Math.hypot(...u0);
        const u: Vec3 = [u0[0] / ul, u0[1] / ul, u0[2] / ul];
        const v = cross(n, u);
        const ang = (p: Vec3) => Math.atan2(dot(sub(p, c), v), dot(sub(p, c), u));
        on.sort((p, q) => ang(p) - ang(q));
        faces.push({ n, pts: on });
      }
  return faces;
}

/** The part of a planar polygon between heights lo and hi. */
function sliceY(poly: readonly Vec3[], lo: number, hi: number): Vec3[] {
  const cut = (ps: readonly Vec3[], keep: (y: number) => boolean, at: number): Vec3[] => {
    const out: Vec3[] = [];
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i]!, q = ps[(i + 1) % ps.length]!;
      const kp = keep(p[1]), kq = keep(q[1]);
      if (kp) out.push(p);
      if (kp !== kq) {
        const t = (at - p[1]) / (q[1] - p[1]);
        out.push([p[0] + (q[0] - p[0]) * t, at, p[2] + (q[2] - p[2]) * t]);
      }
    }
    return out;
  };
  return cut(cut(poly, (y) => y >= lo, lo), (y) => y <= hi, hi);
}

/**
 * A convex solid, the hull of `pts`: every face cut at the heights `cuts` (not the
 * level ones), each piece painted `paintOf(normal, centre)`; faces `skip` returns
 * true for (a face against another part, the bottom on the deck) are left out.
 */
function hullSolid(m: MeshBuilder, pts: readonly Vec3[], paintOf: (n: Vec3, c: Vec3) => string, cuts: readonly number[] = [], skip?: (n: Vec3, c: Vec3) => boolean): void {
  const levels = [-Infinity, ...[...cuts].sort((a, b) => a - b), Infinity];
  for (const f of hullFaces(pts)) {
    const c = centroid(f.pts);
    if (skip?.(f.n, c)) continue;
    const pieces = Math.abs(f.n[1]) > 0.999 ? [f.pts] : levels.slice(1).map((hi, i) => sliceY(f.pts, levels[i]!, hi));
    for (const poly of pieces) {
      if (poly.length < 3) continue;
      const ys = poly.map((p) => p[1]);
      if (Math.abs(f.n[1]) <= 0.999 && Math.max(...ys) - Math.min(...ys) < 1e-6) continue;
      const tris: Vec3[] = [];
      for (let i = 1; i + 1 < poly.length; i++) tris.push(poly[0]!, poly[i]!, poly[i + 1]!);
      m.facets(paintOf(f.n, centroid(poly)), tris, f.n);
    }
  }
}

function matAt(bands: readonly Band[], y: number): string {
  for (const b of bands) if (y >= b[0] - 1e-9 && y < b[1] - 1e-9) return b[2];
  return y < bands[0]![0] ? bands[0]![2] : bands[bands.length - 1]![2];
}
const cutsOf = (bands: readonly Band[]) => [...new Set(bands.flatMap((b) => [b[0], b[1]]))].filter((y) => y > 0.5 && y < 8).sort((a, b) => a - b);

/** The section of a box on the deck: `half` wide, `top` high, its roof edges chamfered by r. */
function boxSection(y0: number, half: number, top: number, r: number): Array<[number, number]> {
  return [[-half, y0], [half, y0], [half, top - r], [half - r, top], [-(half - r), top], [-half, top - r]];
}

// ---------------------------------------------------------------------------

export function buildSd70ace(key: Sd70Key): MeshBuilder {
  const p = PAINTS[key]();
  const m = new MeshBuilder({ ...US_PALETTE, ...p.palette });
  m.scope("frame", () => frame(m, p));
  m.scope("long hood", () => longHood(m, p));
  m.scope("front", () => nose(m, p));
  m.scope("cab", () => cab(m, p));
  m.scope("walkways", () => walkways(m, p));
  m.scope("trucks", () => {
    const spec = truckSpec();
    m.scope("front truck", () => bogie(m, S.trucks.centre, spec));
    m.scope("rear truck", () => bogie(m, -S.trucks.centre, spec));
  });
  m.scope("underframe", () => underframe(m, p));
  m.scope("livery", () => p.decals(m, "ends"));
  return m;
}

/** The HTSC truck: three axles 6 ft 9 1/2 in apart under a cast frame (the diesel toolkit's bogie). */
function truckSpec(): BogieSpec {
  const a = S.trucks.axle;
  return { axles: [-a, 0, a], wheelR: S.trucks.wheelR, frameHalf: 2.78, frameTop: 1.14, frameBottom: 0.66, frameZ: [0.92, 1.08], primary: "coil", secondary: [-1.05, 1.05], secondaryZ: 1.12, bolster: S.sill };
}

function frame(m: MeshBuilder, p: Sd70Paint): void {
  const L = S.endSill;
  m.scope("deck", () => {
    block(m, "walk", -L, L, S.deck - 0.04, S.deck, -S.deckHalf, S.deckHalf);
    const sill: Ring = [[-S.deckHalf, S.sill], [S.deckHalf, S.sill], [S.deckHalf, S.deck - 0.04], [-S.deckHalf, S.deck - 0.04]];
    m.sweep(p.frame, "x", sill, -L, sill, L);
  });
  if (p.sillStripe)
    m.scope("sill stripe", () => {
      const [a, b, mat] = p.sillStripe!;
      for (const sd of [-1, 1]) decalZ(m, mat, sd * (S.deckHalf + 0.004), sd, -L + 0.05, L - 0.05, S.deck - 0.04 - b, S.deck - 0.04 - a);
    });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      // the snowplough pilot: a deep plate under the end sill, its lip pushed forward at the rail
      m.scope("pilot", () => {
        const sec: Ring = e > 0
          ? [[L - 0.4, 0.13], [L + 0.13, 0.13], [L + 0.13, 0.3], [L, 0.6], [L, S.sill], [L - 0.4, S.sill]]
          : [[-L + 0.4, 0.13], [-L + 0.4, S.sill], [-L, S.sill], [-L, 0.6], [-L - 0.13, 0.3], [-L - 0.13, 0.13]];
        m.sweep(p.pilot, "z", sec, -1.42, sec, 1.42);
        // the plough's raised wings toward the corners
        for (const sd of [-1, 1]) block(m, p.pilot, ...along(L - 0.02, L + 0.1), 0.3, 0.85, ...side(sd, 1.1, 1.38));
      });
      m.scope("anticlimber", () => block(m, p.anticlimber, ...along(L - 0.02, L + 0.08), S.deck - 0.16, S.deck + 0.01, -1.32, 1.32));
      m.scope("coupler", () => knuckleCoupler(m, e, L, S.length / 2, 0.88));
      m.scope("hoses", () => {
        for (const z of [-0.5, -0.36, 0.36, 0.5]) {
          const x0 = e * (L + 0.08), x1 = e * (L + 0.22);
          m.loft("hose", ngon(6, 0.028, 0, x0, z), 0.62, ngon(6, 0.028, 0, x1, z), 1.02);
        }
        // the MU cable receptacles on the end sill
        for (const sd of [-1, 1]) block(m, "black", ...along(L + 0.08, L + 0.14), 1.12, 1.3, ...side(sd, 0.75, 0.95));
      });
      // the steps at each corner: a well of three treads under the walkway, its grab irons
      m.scope("steps", () => {
        for (const sd of [-1, 1]) {
          const z: [number, number] = side(sd, S.deckHalf - 0.62, S.deckHalf - 0.04);
          for (const y of [0.5, 0.88, 1.26]) block(m, "steel", ...along(L - 0.82, L - 0.42), y, y + 0.03, ...z);
          for (const zz of z) block(m, p.pilot, ...along(L - 0.84, L - 0.4), 0.42, S.sill, zz - 0.025, zz + 0.025);
          for (const xx of [L - 0.84, L - 0.4]) m.rod(p.endRails, [e * xx, 0.55, sd * (S.deckHalf - 0.0)], [e * xx, S.deck + 0.9, sd * (S.deckHalf - 0.0)], 0.018, 6);
        }
      });
    });
}

function longHood(m: MeshBuilder, p: Sd70Paint): void {
  const r = S.radiator;
  const sidePaint = (roofFrom: number): Paint => ({ bands: p.body, ends: p.body, roofFrom, roof: p.roof });
  // the inertial filter cabinet behind the cab, the dynamic brake, the engine hood: hood-wide boxes;
  // each draws its end walls only where it stands above its neighbour
  m.scope("filter cabinet", () => paintedSweep(m, "x", boxSection(S.deck, H, S.filter.top, 0.16), S.filter.x0, S.filter.x1, sidePaint(S.filter.top - 0.08), []));
  m.scope("dynamic brake", () => {
    const b = S.brake;
    paintedSweep(m, "x", boxSection(S.deck, H, b.top, 0.16), b.x0, b.x1, sidePaint(b.top - 0.08), [-1, 1]);
    // the brake grid hatch on the roof and the grid's side grilles
    block(m, "grille", b.x0 + 0.2, b.x1 - 0.2, b.top - 0.01, b.top + 0.05, -0.75, 0.75);
    for (let x = b.x0 + 0.3; x < b.x1 - 0.3; x += 0.14) block(m, "louvre", x, x + 0.05, b.top + 0.05, b.top + 0.07, -0.7, 0.7);
    for (const sd of [-1, 1]) {
      decalZ(m, "grille", sd * (H + 0.004), sd, b.x0 + 0.15, b.x1 - 0.15, b.top - 0.62, b.top - 0.22);
      for (let x = b.x0 + 0.22; x < b.x1 - 0.2; x += 0.12) decalZ(m, "louvre", sd * (H + 0.008), sd, x, x + 0.045, b.top - 0.6, b.top - 0.24);
    }
  });
  m.scope("hood", () => paintedSweep(m, "x", boxSection(S.deck, H, S.hood.top, 0.18), S.hood.x0, S.hood.x1, sidePaint(S.hood.top - 0.09), []));
  m.scope("filter intakes", () => {
    // the inertial filter's louvred intakes high on the cabinet, the electrical cabinet's grilles lower down
    const f = S.filter;
    for (const sd of [-1, 1]) {
      const z = sd * (H + 0.004);
      decalZ(m, "grille", z, sd, f.x1 - 1.55, f.x1 - 0.25, f.top - 0.62, f.top - 0.2);
      for (let y = f.top - 0.58; y < f.top - 0.24; y += 0.08) decalZ(m, "louvre", z + sd * 0.004, sd, f.x1 - 1.5, f.x1 - 0.3, y, y + 0.03);
      decalZ(m, "grille", z, sd, f.x1 - 1.55, f.x1 - 0.25, S.deck + 0.55, S.deck + 0.95);
      for (let y = S.deck + 0.59; y < S.deck + 0.93; y += 0.08) decalZ(m, "louvre", z + sd * 0.004, sd, f.x1 - 1.5, f.x1 - 0.3, y, y + 0.03);
    }
  });
  m.scope("radiator", () => {
      const fh = r.half, ft = r.top;
      const flare: Array<[number, number]> = [[-H, S.deck], [H, S.deck], [H, r.flareFoot], [fh, r.flareKnee], [fh, ft - 0.1], [fh - 0.1, ft], [-(fh - 0.1), ft], [-fh, ft - 0.1], [-fh, r.flareKnee], [-H, r.flareFoot]];
      paintedSweep(m, "x", flare, r.flareX, r.x1, sidePaint(ft - 0.05), [-1, 1]);
      // the rear cabinet behind the flare, at the radiator's height, the hood's width
      paintedSweep(m, "x", boxSection(S.deck, H, ft, 0.12), r.x0, r.flareX, { bands: p.body, ends: p.rear, roofFrom: ft - 0.05, roof: p.roof }, [-1]);
      // the radiator cores along the flare's sloped undersides: a dark field with its slats
      const dz = fh - H, dy = r.flareKnee - r.flareFoot, len = Math.hypot(dz, dy);
      for (const sd of [-1, 1]) {
        const n: Vec3 = [0, -dz / len, sd * (dy / len)];
        const off = (t: number, d: number, x: number): Vec3 => [x, r.flareFoot + dy * t + n[1] * d, sd * (H + dz * t) + n[2] * d];
        const quad = (mat: string, x0: number, x1: number, t0: number, t1: number, d: number) =>
          m.facets(mat, [off(t0, d, x0), off(t0, d, x1), off(t1, d, x1), off(t0, d, x0), off(t1, d, x1), off(t1, d, x0)], n);
        quad("grille", r.flareX + 0.12, r.x1 - 0.12, 0.06, 0.94, 0.005);
        for (let x = r.flareX + 0.2; x < r.x1 - 0.2; x += 0.11) quad("louvre", x, x + 0.04, 0.08, 0.92, 0.009);
      }
      // the rear cabinet's louvres: a row of short slots high up, the tall grille below
      for (const sd of [-1, 1]) {
        const z = sd * (H + 0.004);
        for (let i = 0; i < 6; i++) {
          const x = r.flareX - 0.25 - i * 0.2;
          decalZ(m, "louvre", z, sd, x - 0.12, x, ft - 0.5, ft - 0.22);
        }
        decalZ(m, "grille", z, sd, r.flareX - 1.35, r.flareX - 0.15, S.deck + 0.35, S.deck + 1.75);
        for (let x = r.flareX - 1.3; x < r.flareX - 0.2; x += 0.1) decalZ(m, "louvre", z + sd * 0.004, sd, x, x + 0.04, S.deck + 0.4, S.deck + 1.7);
      }
    });
  m.scope("fans", () => {
    for (const x of r.fans) radiatorFan(m, x, r.top, r.fanR);
    // the small fan over the rear cabinet
    radiatorFan(m, (r.x0 + r.flareX) / 2 + 0.1, r.top, 0.42);
    // the roof's panel seams between the fans
    for (const x of [r.x1 - 0.35, (r.fans[0]! + r.fans[1]!) / 2, r.flareX + 0.3]) block(m, "black", x - 0.015, x + 0.015, r.top, r.top + 0.006, -(r.half - 0.15), r.half - 0.15);
  });
  m.scope("exhaust", () => {
    exhaust(m, S.exhaustX, 0, S.hood.top - 0.02, S.hood.top + 0.24, 0.42, 0.75);
    block(m, "exhaust", S.exhaustX - 0.32, S.exhaustX + 0.32, S.hood.top - 0.02, S.hood.top + 0.08, -0.5, 0.5);
  });
  m.scope("horn", () => {
    // the five-chime horn on its bracket over the engine hood, just behind the brake
    block(m, "horn", S.brake.x0 - 0.42, S.brake.x0 - 0.36, S.hood.top - 0.02, S.hood.top + 0.22, -0.03, 0.03);
    for (const [z, y, e] of [[-0.12, 0.26, 1], [0, 0.32, -1], [0.12, 0.26, 1]] as const) horn(m, e, S.brake.x0 - 0.39, z, S.hood.top + y);
  });
  // the hood doors: seams and latches down the sides of the cabinet, the engine hood and the radiator's lower part
  m.scope("doors", () => {
    const runs: Array<[number, number, number, number]> = [
      [S.filter.x0 + 0.1, S.filter.x1 - 1.7, S.deck + 0.1, S.filter.top - 0.3],
      [S.hood.x0 + 0.1, S.hood.x1 - 0.1, S.deck + 0.1, S.hood.top - 0.25],
      [r.flareX + 0.1, r.x1 - 0.1, S.deck + 0.1, r.flareFoot - 0.06],
    ];
    for (const [x0, x1, y0, y1] of runs) {
      const n = Math.max(1, Math.round((x1 - x0) / 0.95));
      const w = (x1 - x0) / n;
      for (const sd of [-1, 1])
        for (let i = 0; i <= n; i++) {
          const x = x0 + i * w;
          decalZ(m, "black", sd * (H + 0.004), sd, x - 0.01, x + 0.01, y0, y1);
          if (i < n) decalZ(m, "steel", sd * (H + 0.004), sd, x + w / 2 - 0.05, x + w / 2 + 0.05, S.deck + 0.95, S.deck + 1.0);
        }
    }
  });
  p.decals(m, "hood");
  m.scope("rear headlight", () => {
    const x = r.x0, y = r.top - 0.42;
    block(m, "black", x - 0.07, x + 0.002, y - 0.13, y + 0.13, -0.3, 0.3);
    for (const z of [-0.15, 0.15]) extrude(m, "lampHead", "x", ngon(10, 0.09, 0, z, y), [x - 0.09, x - 0.07]);
    for (const z of [-0.68, 0.68]) block(m, "numberBoard", x - 0.04, x + 0.002, y - 0.08, y + 0.08, z - 0.22, z + 0.22);
    for (const z of [-0.68, 0.68]) endText(m, "black", p.number, -1, -(x - 0.042), z, y - 0.055, 0.11, 0.06, 0.02);
    // the rear ditch lights low on the end
    for (const z of [-0.85, 0.85]) {
      block(m, "black", x - 0.1, x + 0.002, S.deck + 0.42, S.deck + 0.62, z - 0.1, z + 0.1);
      extrude(m, "ditch", "x", ngon(10, 0.075, 0, z, S.deck + 0.52), [x - 0.12, x - 0.1]);
    }
  });
}

/** A radiator fan: a raised ring with its guard of spokes and a hub over the dark well. */
function radiatorFan(m: MeshBuilder, x: number, y: number, r: number): void {
  m.scope("fan", () => {
    m.prism("grille", ngon(24, r, 0, x, 0), y - 0.05, y + 0.07, false);
    m.prism("grille", ngon(24, r * 0.92, 0, x, 0).reverse(), y + 0.07, y + 0.02, false);
    m.loft("grille", ngon(24, r, 0, x, 0), y + 0.07, ngon(24, r * 0.92, 0, x, 0), y + 0.07, false);
    m.cap("louvre", ngon(24, r * 0.92, 0, x, 0), y + 0.02);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      m.rod("fanGuard", [x - Math.cos(a) * r * 0.92, y + 0.065, -Math.sin(a) * r * 0.92], [x + Math.cos(a) * r * 0.92, y + 0.065, Math.sin(a) * r * 0.92], 0.012, 4);
    }
    m.prism("fanGuard", ngon(8, r * 0.16, 0, x, 0), y + 0.02, y + 0.09);
  });
}

/** The wide nose: vertical sides and front, a bevel over the front, chamfered top edges. */
function nose(m: MeshBuilder, p: Sd70Paint): void {
  const d = S.deck, n = N;
  const pts: Vec3[] = [];
  for (const sd of [-1, 1]) {
    pts.push([n.x0, d, sd * n.half], [n.x1, d, sd * n.half], [n.x1, n.front - 0.06, sd * n.half], [n.x0, n.chamfer, sd * n.half]);
    pts.push([n.x1, n.front, sd * (n.half - 0.14)], [n.bevel, n.top, sd * n.topHalf], [n.x0, n.top, sd * n.topHalf]);
    // the chamfer's foot runs back from the front's corner at the cab's height
    pts.push([n.bevel, n.chamfer, sd * n.half]);
  }
  m.scope("nose", () =>
    hullSolid(m, pts, (nv, c) => {
      if (nv[1] > 0.999) return p.noseTop;
      if (Math.abs(nv[2]) > 0.999) return p.noseSide;
      if (nv[0] > 0.999) return p.noseFront;
      if (Math.abs(nv[2]) > 0.3 && c[1] > n.chamfer - 0.1) return p.noseChamfer;
      if (nv[0] > 0.3) return p.noseBevel;
      return p.noseSide;
    }, [], (nv, c) => nv[1] < -0.999 || (nv[0] < -0.999 && c[0] < n.x0 + 1e-6)));
  // headlights: on the nose under the bevel (BNSF), or in the cab's brow (the others' are drawn with the cab)
  m.scope("headlights", () => {
    if (p.headlight === "nose") {
      const x = n.x1;
      block(m, "black", x - 0.002, x + 0.06, n.front - 0.62, n.front - 0.06, -0.15, 0.15);
      for (const y of [n.front - 0.2, n.front - 0.47]) extrude(m, "lampHead", "x", ngon(10, 0.1, 0, 0, y), [x + 0.06, x + 0.08]);
    }
    // the ditch lights low on the front corners
    for (const z of [-0.85, 0.85]) {
      block(m, "black", n.x1 - 0.002, n.x1 + 0.1, 2.0, 2.3, z - 0.13, z + 0.13);
      extrude(m, "ditch", "x", ngon(10, 0.095, 0, z, 2.15), [n.x1 + 0.1, n.x1 + 0.12]);
    }
  });
  m.scope("number boards", () => {
    // the nose's door handle and toilet vent stand in for the nose's small fittings
    block(m, "steel", n.x1 - 0.002, n.x1 + 0.03, 2.55, 2.62, 0.55, 0.75);
  });
  // the handrails up the nose's front corners, from the walkway's end posts
  m.scope("nose rails", () => {
    for (const sd of [-1, 1]) {
      const z = sd * 1.18;
      m.rod(p.endRails, [S.endSill - 0.22, d, z], [S.endSill - 0.22, d + 1.0, z], 0.022, 6);
      m.rod(p.endRails, [S.endSill - 0.22, d + 1.0, z], [n.x1 + 0.05, d + 1.55, z * 0.95], 0.02, 6);
      m.rod(p.endRails, [n.x1 + 0.05, d + 1.55, z * 0.95], [n.x1 + 0.002, d + 1.62, z * 0.95], 0.02, 6);
    }
  });
}

function cab(m: MeshBuilder, p: Sd70Paint): void {
  const c = CB, d = S.deck, n = N;
  const [s0, s1] = c.screen;
  const rake = (y: number) => c.x1 - ((c.x1 - c.head) * (y - n.top)) / (s1 + 0.04 - n.top);
  // the shell: straight sides from the rear wall to the windscreen's rake, the roof's edges chamfered
  const pts: Vec3[] = [];
  const ch = 0.16;
  for (const sd of [-1, 1]) {
    const z = sd * c.half;
    pts.push([c.x0, d, z], [c.x0, c.top - ch, z], [c.x0, c.top, sd * (c.half - ch)]);
    pts.push([c.x1, d, z], [c.x1 - 0.1, n.top, z], [c.x1, n.top, sd * (c.half - 0.1)], [c.head - 0.1, s1 + 0.04, z], [c.head, s1 + 0.04, sd * (c.half - 0.1)]);
    pts.push([c.roofX - 0.1, c.top - ch, z], [c.roofX - 0.08, c.top, sd * (c.half - ch)]);
  }
  const cuts = cutsOf(p.cab);
  m.scope("shell", () =>
    hullSolid(m, pts, (nv, ctr) => {
      if (nv[1] > 0.5) return p.cabRoof;
      if (nv[0] > 0.3) return ctr[1] > n.top - 0.01 ? p.cabFront : p.noseSide;
      if (nv[0] < -0.999) return matAt(p.cab, ctr[1]);
      return ctr[1] > c.top - ch - 0.01 ? p.cabRoof : matAt(p.cab, ctr[1]);
    }, cuts, (nv) => nv[1] < -0.999));
  // the brow over the windscreens: the number boards' housing and, on UP and NS, the headlights
  m.scope("brow", () => {
    const x0 = c.roofX - 0.3, x1 = c.head + 0.2, y0 = s1 + 0.02, y1 = c.top + 0.05, hw = 0.95;
    const bp: Vec3[] = [];
    for (const sd of [-1, 1]) bp.push([x0, y0, sd * hw], [x0, y1, sd * hw], [x1, y0 + 0.04, sd * (hw - 0.08)], [x1 - 0.06, y1, sd * (hw - 0.08)], [x1, y0 + 0.04, sd * hw * 0.5]);
    hullSolid(m, bp, () => p.brow, [], (nv) => nv[1] < -0.9);
    const fx = x1 + 0.002;
    for (const sd of [-1, 1]) {
      block(m, "numberBoard", fx - 0.004, fx + 0.03, s1 + 0.1, s1 + 0.28, ...side(sd, 0.3, 0.78));
      endText(m, "black", p.number, 1, fx + 0.032, sd * 0.54, s1 + 0.135, 0.11, 0.065, 0.025);
    }
    if (p.headlight === "brow") {
      block(m, "black", fx - 0.004, fx + 0.05, s1 + 0.08, s1 + 0.3, -0.24, 0.24);
      for (const z of [-0.11, 0.11]) extrude(m, "lampHead", "x", ngon(10, 0.085, 0, z, s1 + 0.19), [fx + 0.05, fx + 0.07]);
    }
  });
  // the windscreens on the raked front wall, their wipers
  m.scope("windscreen", () => {
    const nrm: Vec3 = [s1 + 0.04 - n.top, c.x1 - c.head, 0];
    const nl = Math.hypot(...nrm);
    const nn: Vec3 = [nrm[0] / nl, nrm[1] / nl, 0];
    const q = (dd: number, za: number, zb: number, y0: number, y1: number): Vec3[] => {
      const P = (y: number, z: number): Vec3 => [rake(y) + nn[0] * dd, y + nn[1] * dd, z];
      return [P(y0, za), P(y0, zb), P(y1, zb), P(y0, za), P(y1, zb), P(y1, za)];
    };
    for (const sd of [-1, 1]) {
      const [za, zb] = side(sd, 0.08, c.half - 0.2);
      m.facets("rubber", q(0.005, za, zb, s0, s1), nn);
      m.facets("glass", q(0.01, za + 0.04, zb - 0.04, s0 + 0.04, s1 - 0.04), nn);
      // the wiper parked across the pane's foot, its arm up the middle
      const zw = sd * 0.7;
      m.facets("black", q(0.016, zw - 0.012, zw + 0.012, s0 + 0.05, s1 - 0.08), nn);
    }
    // the grab irons and mirror arms at the windscreen's corners
    for (const sd of [-1, 1]) m.rod("handrail", [c.x1 - 0.02, n.top + 0.08, sd * (c.half + 0.04)], [c.head + 0.02, s1 - 0.02, sd * (c.half + 0.04)], 0.016, 6);
  });
  // the side windows: the sliding sash group under an awning, and on the right the cab's small rear pane
  m.scope("side windows", () => {
    const y0 = 3.84, y1 = 4.5;
    for (const sd of [-1, 1]) {
      const zz = sd * (c.half + 0.004);
      const [xa, xb] = [7.0, 8.6];
      decalZ(m, "rubber", zz, sd, xa, xb, y0, y1);
      const panes = [[xa, xa + 0.36], [xa + 0.36, xa + 0.98], [xa + 0.98, xb]];
      for (const [a, b] of panes) decalZ(m, "glass", zz + sd * 0.004, sd, a! + 0.04, b! - 0.04, y0 + 0.05, y1 - 0.05);
      // the awning over the group
      const aw = sd * (c.half + 0.09);
      m.facets(p.awning, [[xa - 0.05, y1 + 0.12, zz], [xb + 0.05, y1 + 0.12, zz], [xb + 0.05, y1 + 0.04, aw], [xa - 0.05, y1 + 0.12, zz], [xb + 0.05, y1 + 0.04, aw], [xa - 0.05, y1 + 0.04, aw]], [0, 0.9, sd * 0.4]);
      m.facets(p.awning, [[xa - 0.05, y1 + 0.12, zz], [xb + 0.05, y1 + 0.04, aw], [xb + 0.05, y1 + 0.12, zz], [xa - 0.05, y1 + 0.12, zz], [xa - 0.05, y1 + 0.04, aw], [xb + 0.05, y1 + 0.04, aw]], [0, -0.9, -sd * 0.4]);
      if (sd < 0) {
        decalZ(m, "rubber", zz, sd, 6.58, 6.98, 3.95, 4.42);
        decalZ(m, "glass", zz + sd * 0.004, sd, 6.62, 6.94, 3.99, 4.38);
      }
      // the running number under the windows
      sideText(m, p.numberMat, p.number, sd, c.half + 0.008, 7.75, p.numberY, p.numberH);
    }
  });
  // the doors in the cab's rear wall onto the side walkways
  m.scope("rear doors", () => {
    for (const sd of [-1, 1]) {
      const [za, zb] = side(sd, H + 0.06, c.half - 0.05);
      decalX(m, "black", c.x0 - 0.004, -1, za, zb, d + 0.05, 3.95);
      decalX(m, matAt(p.cab, 3.0), c.x0 - 0.008, -1, za + 0.02, zb - 0.02, d + 0.07, 3.93);
      decalX(m, "rubber", c.x0 - 0.012, -1, za + 0.06, zb - 0.06, 3.15, 3.75);
      decalX(m, "glass", c.x0 - 0.016, -1, za + 0.09, zb - 0.09, 3.18, 3.72);
    }
  });
  m.scope("antenna", () => {
    m.prism("black", ngon(6, 0.025, 0, c.x0 + 0.5, 0.6), c.top - 0.02, c.top + 0.12);
    block(m, "black", c.x0 + 0.9, c.x0 + 1.3, c.top - 0.02, c.top + 0.05, -0.75, -0.45);
  });
}

function walkways(m: MeshBuilder, p: Sd70Paint): void {
  const y = S.deck + 1.0, yMid = S.deck + 0.5, z = S.deckHalf - 0.03, L = S.endSill;
  // the side rails from the cab's rear doors back to the rear platform, stanchions about every 1.5 m
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right rail" : "left rail", () => {
      const a = -L + 0.3, b = CB.x0 - 0.15;
      const zc = sd * z;
      tubeX(m, p.sideRails, 0.02, a, y, zc, b, y, zc, 6);
      tubeX(m, p.sideRails, 0.016, a, yMid, zc, b, yMid, zc, 6);
      const n = Math.max(1, Math.round((b - a) / 1.5));
      for (let i = 0; i <= n; i++) m.prism(p.sideRails, ngon(6, 0.022, 0, a + ((b - a) * i) / n, zc), S.deck, y);
      // the front platform's side rail from the nose's corner to the end
      tubeX(m, p.endRails, 0.02, N.x1 + 0.05, y, zc, L - 0.22, y, zc, 6);
    });
  m.scope("end rails", () => {
    for (const e of [1, -1]) {
      const x = e * (L - 0.22);
      for (const sd of [-1, 1]) m.rod(p.endRails, [x, y, sd * 0.55], [x, y, sd * z], 0.02, 6);
      for (const sd of [-1, 1]) m.prism(p.endRails, ngon(6, 0.022, 0, x, sd * 0.55), S.deck, y);
      for (const sd of [-1, 1]) m.prism(p.endRails, ngon(6, 0.022, 0, x, sd * z), S.deck, y);
    }
  });
}

function underframe(m: MeshBuilder, p: Sd70Paint): void {
  const t = S.tank;
  m.scope("fuel tank", () => {
    // a deep tank, its lower edges and ends bevelled
    const sec: Ring = [[-t.half, t.y1], [t.half, t.y1], [t.half, t.y0 + 0.24], [t.half - 0.3, t.y0], [-(t.half - 0.3), t.y0], [-t.half, t.y0 + 0.24]];
    const inner: Ring = [[-(t.half - 0.12), t.y1], [t.half - 0.12, t.y1], [t.half - 0.12, t.y0 + 0.3], [t.half - 0.38, t.y0 + 0.12], [-(t.half - 0.38), t.y0 + 0.12], [-(t.half - 0.12), t.y0 + 0.3]];
    m.sweep(p.frame, "x", inner, t.x0, sec, t.x0 + 0.3, false);
    m.sweep(p.frame, "x", sec, t.x0 + 0.3, sec, t.x1 - 0.3, false);
    m.sweep(p.frame, "x", sec, t.x1 - 0.3, inner, t.x1, false);
    for (const [x, e] of [[t.x0, -1], [t.x1, 1]] as const) {
      const pts: Vec3[] = [];
      for (let i = 1; i + 1 < inner.length; i++) pts.push([x, inner[0]![1], inner[0]![0]], [x, inner[i]![1], inner[i]![0]], [x, inner[i + 1]![1], inner[i + 1]![0]]);
      m.facets(p.frame, pts, [e, 0, 0]);
    }
    for (const sd of [-1, 1]) {
      // the fuel fillers and gauges at both ends of each side
      for (const x of [t.x0 + 0.6, t.x1 - 0.6]) block(m, "steel", x - 0.08, x + 0.08, t.y1 - 0.3, t.y1 - 0.12, ...side(sd, t.half, t.half + 0.04));
      decalZ(m, "white", sd * (t.half + 0.004), sd, (t.x0 + t.x1) / 2 - 0.45, (t.x0 + t.x1) / 2 + 0.45, t.y1 - 0.34, t.y1 - 0.2);
    }
  });
  m.scope("air reservoirs", () => {
    // the main reservoirs, two a side under the sill over the tank
    for (const sd of [-1, 1]) {
      tankX(m, "tank", t.x0 + 0.2, t.x0 + 3.6, sd * 1.2, t.y1 + 0.19, 0.18);
      tankX(m, "tank", t.x0 + 3.8, t.x1 - 0.3, sd * 1.2, t.y1 + 0.19, 0.18);
    }
  });
  m.scope("battery boxes", () => {
    // the frame's underside between the tank and the trucks
    for (const e of [1, -1]) block(m, "underframe", ...(e > 0 ? [t.x1, t.x1 + 0.35] as [number, number] : [t.x0 - 0.35, t.x0] as [number, number]), t.y1 - 0.04, S.sill, -1.0, 1.0);
  });
}

// ---------------------------------------------------------------------------
// The distant model

export function sd70aceLod(key: Sd70Key, budget = 100): MeshBuilder {
  const p = PAINTS[key]();
  const top = (y1: number, roof: string, src: readonly Band[]): LodBand[] => [...lodBands(src, S.deck, y1 - 0.15), [y1 - 0.15, y1, roof]];
  const shell = (x0: number, x1: number, half: number, y1: number, sideB: readonly LodBand[], endB: readonly LodBand[], roof: string, extra: Partial<LodShell> = {}): LodShell => ({
    y0: S.deck, xc: (x0 + x1) / 2, tip: [[S.deck, (x1 - x0) / 2], [y1, (x1 - x0) / 2]],
    hw: [[S.deck, half], [y1 - 0.14, half], [y1, Math.max(0.1, half - 0.14)]],
    side: sideB, end: endB, roof, ...extra,
  });
  const r = S.radiator;
  const radiator = shell(r.x0, r.x1, r.half - 0.18, r.top, top(r.top, p.roof, p.body), top(r.top, p.roof, p.rear), p.roof, { ends: [-1, 1] });
  const hood = shell(S.hood.x0, S.filter.x1, H, S.filter.top, top(S.filter.top, p.roof, p.body), top(S.filter.top, p.roof, p.body), p.roof, { ends: [1] });
  const c = CB;
  const cabShell = shell(c.x0, c.x1, c.half, c.top, top(c.top, p.cabRoof, p.cab), [...lodBands([[0, N.top, p.noseSide], [N.top, 9, p.cabFront]], S.deck, c.top - 0.15), [c.top - 0.15, c.top, p.cabRoof]], p.cabRoof, {
    endWindows: [-1, 1].map((sd) => ({ u: sd > 0 ? [0.12, c.half - 0.24] as const : [-(c.half - 0.24), -0.12] as const, y: c.screen, mat: LOD_GLASS, ends: [1], optional: 0.3 })),
    sideWindows: sideWindows([{ u: [6.9, 8.5], y: [3.84, 4.5] }]),
  });
  const noseShell = shell(N.x0, N.x1, N.half, N.top, lodBands([[0, 9, p.noseSide]], S.deck, N.top), lodBands([[0, 9, p.noseFront]], S.deck, N.top), p.noseTop, { ends: [1] });
  const L = S.endSill;
  const boxes: LocoBox[] = [
    { name: "frame", mat: p.frame, x: [-L, L], y: [S.sill, S.deck], w: S.deckHalf },
    { name: "fuel tank", mat: p.frame, x: [S.tank.x0, S.tank.x1], y: [S.tank.y0, S.sill], w: S.tank.half, top: false, optional: 35 },
    { name: "dynamic brake", mat: matAt(p.body, S.brake.top - 0.1), x: [S.brake.x0, S.brake.x1], y: [S.filter.top - 0.2, S.brake.top], w: H, optional: 20 },
    ...[-1, 1].map((e): LocoBox => ({ name: "pilot", mat: p.pilot, x: e > 0 ? [L - 0.35, L] : [-L, -L + 0.35], y: [0.16, S.sill], w: 1.42, top: false, optional: 30 })),
  ];
  return locoLod({
    palette: { ...US_PALETTE, ...p.palette },
    shells: [radiator, hood, noseShell, cabShell],
    boxes,
    gear: [-1, 1].map((e) => ({ xc: e * S.trucks.centre, half: 2.78, top: 1.14 })),
  }, budget);
}
