// The North American hood unit kit: the road switchers and modern freight
// diesels (EMD GP9, SD40-2, SD70ACe, GE ES44AC; usDiesels.ts) share one layout --
// a frame with walkways all round, a short hood or wide nose ahead of the cab, the
// cab, and the long hood behind it ending in the radiator -- and differ in their
// measures, cab, nose and radiator. Everything is drawn here from a `UsHoodSpec`
// and a `UsLivery`, in metres, +X toward the short hood (the "F" end), wheel
// contact at y = 0, centred across z. No buffers: AAR knuckle couplers.
// See docs/models/us-diesels.md.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { tubeX, type Band } from "./cd163.ts";
import { DIESEL_PALETTE, block, bogie, exhaust, extrude, horn, paint, roofFan, side, tankX, type BogieSpec } from "./dieselParts.ts";
import { LOD_GLASS, lodBands, type LodBand, type LodShell } from "./lodKit.ts";
import { locoLod, sideWindows, type LocoBox } from "./lodLocos.ts";

export type { Band };

// ---------------------------------------------------------------------------
// Painted sweeps: a convex section extruded along x or z, every face painted by
// the band at its height, with no hidden faces between the bands.

type UY = readonly [number, number];

export interface Paint {
  /** Side paint by height, bottom first. */
  bands: readonly Band[];
  /** The ends' paint (a nose, a hood end); default the sides'. */
  ends?: readonly Band[];
  /** Faces whose middle is at or above this height take the roof's paint. */
  roofFrom: number;
  roof: string;
}

function matAt(bands: readonly Band[], y: number): string {
  for (const b of bands) if (y >= b[0] - 1e-9 && y < b[1] - 1e-9) return b[2];
  return y < bands[0]![0] ? bands[0]![2] : bands[bands.length - 1]![2];
}

/** The part of a convex (u, y) polygon between heights lo and hi. */
function clipY(poly: readonly UY[], lo: number, hi: number): UY[] {
  const cut = (pts: readonly UY[], keep: (y: number) => boolean, at: number): UY[] => {
    const out: UY[] = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!, q = pts[(i + 1) % pts.length]!;
      const kp = keep(p[1]), kq = keep(q[1]);
      if (kp) out.push(p);
      if (kp !== kq) {
        const t = (at - p[1]) / (q[1] - p[1]);
        out.push([p[0] + (q[0] - p[0]) * t, at]);
      }
    }
    return out;
  };
  return cut(cut(poly, (y) => y >= lo, lo), (y) => y <= hi, hi);
}

/**
 * The convex section (u, y) extruded from a0 to a1 along `axis` ((z, y) along x,
 * (x, y) along z), each face painted by its height; the section's bottom edge is
 * left open (it stands on the deck) and only the ends listed are closed.
 */
export function paintedSweep(m: MeshBuilder, axis: "x" | "z", section: readonly UY[], a0: number, a1: number, p: Paint, ends: readonly number[] = [-1, 1]): void {
  const P = (u: number, y: number, a: number): Vec3 => (axis === "x" ? [a, y, u] : [u, y, a]);
  const cu = section.reduce((s, q) => s + q[0], 0) / section.length;
  const cy = section.reduce((s, q) => s + q[1], 0) / section.length;
  const minY = Math.min(...section.map((q) => q[1]));
  const cuts = [...new Set([...p.bands.flatMap((b) => [b[0], b[1]]), ...(p.ends ?? []).flatMap((b) => [b[0], b[1]]), p.roofFrom])].sort((a, b) => a - b);
  const paintOf = (bands: readonly Band[], y: number) => (y >= p.roofFrom - 1e-6 ? p.roof : matAt(bands, y));
  for (let i = 0; i < section.length; i++) {
    const a = section[i]!, b = section[(i + 1) % section.length]!;
    if (Math.abs(a[1] - minY) < 1e-9 && Math.abs(b[1] - minY) < 1e-9) continue;
    const ts = [0, 1];
    for (const c of cuts) {
      if ((c - a[1]) * (c - b[1]) < 0) ts.push((c - a[1]) / (b[1] - a[1]));
    }
    ts.sort((x, y) => x - y);
    for (let k = 0; k + 1 < ts.length; k++) {
      const s0 = ts[k]!, s1 = ts[k + 1]!;
      if (s1 - s0 < 1e-9) continue;
      const pa: UY = [a[0] + (b[0] - a[0]) * s0, a[1] + (b[1] - a[1]) * s0];
      const pb: UY = [a[0] + (b[0] - a[0]) * s1, a[1] + (b[1] - a[1]) * s1];
      const mid: UY = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
      let n: UY = [pb[1] - pa[1], -(pb[0] - pa[0])];
      if (n[0] * (mid[0] - cu) + n[1] * (mid[1] - cy) < 0) n = [-n[0], -n[1]];
      const n3: Vec3 = axis === "x" ? [0, n[1], n[0]] : [n[0], n[1], 0];
      m.facets(paintOf(p.bands, mid[1]), [P(pa[0], pa[1], a0), P(pb[0], pb[1], a0), P(pb[0], pb[1], a1), P(pa[0], pa[1], a0), P(pb[0], pb[1], a1), P(pa[0], pa[1], a1)], n3);
    }
  }
  const levels = [-Infinity, ...cuts, Infinity];
  for (const e of ends) {
    const at = e < 0 ? Math.min(a0, a1) : Math.max(a0, a1);
    const n3: Vec3 = axis === "x" ? [e, 0, 0] : [0, 0, e];
    for (let k = 0; k + 1 < levels.length; k++) {
      const poly = clipY(section, levels[k]!, levels[k + 1]!);
      if (poly.length < 3) continue;
      const ys = poly.map((q) => q[1]);
      if (Math.max(...ys) - Math.min(...ys) < 1e-6) continue;
      const mat = paintOf(p.ends ?? p.bands, (Math.max(...ys) + Math.min(...ys)) / 2);
      const pts: Vec3[] = [];
      for (let j = 1; j + 1 < poly.length; j++) pts.push(P(poly[0]![0], poly[0]![1], at), P(poly[j]![0], poly[j]![1], at), P(poly[j + 1]![0], poly[j + 1]![1], at));
      m.facets(mat, pts, n3);
    }
  }
}

/** A flat rectangle on the plane x = x facing e (+1 toward +X): u is z, v is y. */
export function decalX(m: MeshBuilder, mat: string, x: number, e: number, z0: number, z1: number, y0: number, y1: number): void {
  m.facets(mat, [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y0, z0], [x, y1, z1], [x, y1, z0]], [e, 0, 0]);
}

/** A flat rectangle on the plane z = z facing s (+1 right). */
export function decalZ(m: MeshBuilder, mat: string, z: number, s: number, x0: number, x1: number, y0: number, y1: number): void {
  m.facets(mat, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, s]);
}

/** Text centred at (xc, y0 .. y0 + h) on the side wall z = s * zw, reading left to right from outside. */
export function sideText(m: MeshBuilder, mat: string, text: string, s: number, zw: number, xc: number, y0: number, h: number, w = h * 0.62, gap = h * 0.22): void {
  const tw = strokeWidth(text, w, gap);
  const pts = strokeText(text, -tw / 2, y0, h, w, gap, false, h * 0.16).map(([u, v]): Vec3 => [xc + s * u, v, s * zw]);
  m.facets(mat, pts, [0, 0, s]);
}

/** Text centred at (zc, y0 .. y0 + h) on the end face x = e * xf. */
export function endText(m: MeshBuilder, mat: string, text: string, e: number, xf: number, zc: number, y0: number, h: number, w = h * 0.6, gap = h * 0.2): void {
  const tw = strokeWidth(text, w, gap);
  const pts = strokeText(text, -tw / 2, y0, h, w, gap, false, h * 0.15).map(([u, v]): Vec3 => [e * xf, v, zc - e * u]);
  m.facets(mat, pts, [e, 0, 0]);
}

// ---------------------------------------------------------------------------
// The design: measures and paint

export interface UsHoodSpec {
  /** Length over the coupler faces. */
  length: number;
  /** |x| of the end sills (the pilot faces). */
  endSill: number;
  /** The walkway's top and the side sill's bottom. */
  deck: number;
  sillBottom: number;
  /** Half the walkway's width (its outer edge, where the handrail stands). */
  deckHalf: number;
  /** The long hood toward -X: x span, half width, roof height, the roof's corner chamfer. */
  hood: { x0: number; x1: number; half: number; top: number; r: number };
  /** What stands ahead of the cab. */
  front:
    | { kind: "highHood"; x0: number; x1: number }
    | { kind: "lowNose"; x0: number; x1: number; top: number }
    | { kind: "wideNose"; x0: number; x1: number; top: number; half: number };
  /** The cab: an EMD/GE standard cab, or the full-width safety cab with its raked windscreen. */
  cab: { x0: number; x1: number; half: number; top: number; kind: "classic" | "wide" };
  /** The radiator at the rear of the long hood: side grilles, or a section flaring out to `half` at `top`. */
  radiator: { x0: number; x1: number; kind: "grilles" | "flared"; half?: number; top?: number; fans: readonly number[]; fanR: number };
  /** The dynamic brake housing on the hood roof (x span, top, half width). */
  blister?: { x0: number; x1: number; top: number; half: number };
  exhaustX: number;
  trucks: { centre: number; spec: BogieSpec; sideFrame: "blomberg" | "htc" | "hiad" };
  tank: { x0: number; x1: number; y0: number; half: number };
  /** Ditch lights on the pilots (the newer units). */
  ditchLights: boolean;
}

export interface UsLivery {
  /** The value's title (the game's button: 16 characters at most). */
  title: string;
  /** The railroad's name in letters along the long hood, and its size. */
  railroad: string;
  letterH: number;
  /** The running number on the cab sides and the number boards. */
  number: string;
  palette: Record<string, MaterialSpec>;
  /** Hood side paint by height, bottom first. */
  body: readonly Band[];
  /** The cab's and the nose's sides; default the body's. */
  cab?: readonly Band[];
  /** The ends: the nose and hood faces, the cab's front and rear walls; default the cab's. */
  ends?: readonly Band[];
  roof: string;
  cabRoof?: string;
  frame: string;
  /** A stripe along the side sill (its top and bottom offsets from the deck, its paint). */
  sillStripe?: readonly [number, number, string];
  trucks: string;
  pilot: string;
  letter: string;
  /** The lettering's base height above the deck. */
  letterY: number;
  numberMat: string;
  rails: string;
  /** Diagonal safety stripes across the pilots and nose (a hazard paint). */
  noseStripes?: string;
}

/** The palette every US diesel shares; a livery adds its paints. */
export const US_PALETTE: Record<string, MaterialSpec> = {
  ...DIESEL_PALETTE,
  knuckle: paint("#3a3b3d", 0.7),
  numberBoard: paint("#e8e6d8", 0.4),
  fanGuard: paint("#3c3f42", 0.7),
  ditch: { color: "#f6f4e8", metallic: 0, roughness: 0.2, lamp: { role: "head" } },
  safety: paint("#e9c21b", 0.5),
  walk: paint("#55585b", 0.9),
};

/**
 * An AAR knuckle coupler on end e: the draft gear from 0.3 m inside the end sill
 * at |x| = sill, the shank, and the head and knuckle reaching the coupler face at
 * |x| = face; the uncoupling lever across the sill. Its centre at height y.
 */
export function knuckleCoupler(m: MeshBuilder, e: number, sill: number, face: number, y: number): void {
  const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
  block(m, "knuckle", ...along(sill - 0.3, sill + 0.35), y - 0.09, y + 0.09, -0.11, 0.11);
  block(m, "knuckle", ...along(sill + 0.35, face), y - 0.2, y + 0.16, -0.17, 0.13);
  block(m, "knuckle", ...along(sill + 0.38, face - 0.02), y - 0.14, y + 0.1, 0.13, 0.25);
  m.rod("handrail", [e * (sill + 0.06), y + 0.32, -1.0], [e * (sill + 0.06), y + 0.32, 0.2], 0.015, 6);
}

// ---------------------------------------------------------------------------

/** The section of a hood: a box with chamfered roof corners, `half` wide, `top` high, from the deck. */
function hoodSection(deck: number, half: number, top: number, r: number): UY[] {
  return [[-half, deck], [half, deck], [half, top - r], [half - r, top], [-(half - r), top], [-half, top - r]];
}

export function buildUsHood(s: UsHoodSpec, l: UsLivery): MeshBuilder {
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette });
  m.scope("frame", () => frame(m, s, l));
  m.scope("long hood", () => longHood(m, s, l));
  m.scope("front", () => front(m, s, l));
  m.scope("cab", () => cab(m, s, l));
  m.scope("walkways", () => walkways(m, s, l));
  m.scope("trucks", () => {
    m.scope("front truck", () => bogie(m, s.trucks.centre, s.trucks.spec));
    m.scope("rear truck", () => bogie(m, -s.trucks.centre, s.trucks.spec));
  });
  m.scope("underframe", () => underframe(m, s, l));
  return m;
}

const cabBands = (l: UsLivery): readonly Band[] => l.cab ?? l.body;
const endBands = (l: UsLivery): readonly Band[] => l.ends ?? l.cab ?? l.body;

/** A sweep along x: its faces are the sides, its caps the ends. */
function bodyPaint(_s: UsHoodSpec, l: UsLivery, roofFrom: number, roof = l.roof, sides = l.body): Paint {
  return { bands: sides, ends: endBands(l), roofFrom, roof };
}

/** A sweep along z (a profile across the body): its faces are the ends and the roof, its caps the sides. */
function profilePaint(l: UsLivery, roofFrom: number, roof: string): Paint {
  return { bands: endBands(l), ends: cabBands(l), roofFrom, roof };
}

function frame(m: MeshBuilder, s: UsHoodSpec, l: UsLivery): void {
  const L = s.endSill;
  // the deck plate and the side sills (the sill stripe painted on them)
  m.scope("deck", () => {
    block(m, "walk", -L, L, s.deck - 0.04, s.deck, -s.deckHalf, s.deckHalf);
    const sill: Ring = [[-s.deckHalf, s.sillBottom], [s.deckHalf, s.sillBottom], [s.deckHalf, s.deck - 0.04], [-s.deckHalf, s.deck - 0.04]];
    m.sweep(l.frame, "x", sill, -L, sill, L);
  });
  if (l.sillStripe)
    m.scope("sill stripe", () => {
      const [a, b, mat] = l.sillStripe!;
      for (const sd of [-1, 1]) decalZ(m, mat, sd * (s.deckHalf + 0.004), sd, -L + 0.05, L - 0.05, s.deck - b, s.deck - a);
    });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      // the pilot: a plate leaning back from the end sill down to the rail clearance
      m.scope("pilot", () => {
        const foot = 0.16, top = s.sillBottom;
        const sec: Ring = e > 0
          ? [[L - 0.35, foot], [L - 0.12, foot], [L, top], [L - 0.35, top]]
          : [[-L + 0.35, foot], [-L + 0.35, top], [-L, top], [-L + 0.12, foot]];
        m.sweep(l.pilot, "z", sec, -s.deckHalf + 0.06, sec, s.deckHalf - 0.06);
        if (l.noseStripes) {
          // diagonal stripes on the end sill above the pilot
          const x = e * (L + 0.004);
          const pts: Vec3[] = [];
          for (let i = -3; i <= 3; i++) {
            const z = i * 0.34;
            const q: Vec3[] = [[x, s.sillBottom + 0.02, z - 0.08], [x, s.sillBottom + 0.02, z + 0.08], [x, s.deck - 0.06, z + 0.24], [x, s.deck - 0.06, z + 0.08]];
            pts.push(q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!);
          }
          m.facets(l.noseStripes, pts, [e, 0, 0]);
        }
      });
      // the end sill's face over the pilot (the sill sweep's end cap is it); the coupler
      m.scope("coupler", () => knuckleCoupler(m, e, L, s.length / 2, 0.88));
      m.scope("hoses", () => {
        for (const z of [-0.42, 0.42]) {
          const x0 = e * (L - 0.02), x1 = e * (L + 0.18);
          m.loft("hose", ngon(6, 0.03, 0, x0, z), 0.5, ngon(6, 0.03, 0, x1, z), 0.82);
        }
      });
      if (s.ditchLights)
        m.scope("ditch lights", () => {
          for (const z of [-1.2, 1.2]) {
            block(m, "black", ...along(L - 0.02, L + 0.06), s.sillBottom - 0.24, s.sillBottom - 0.02, z - 0.11, z + 0.11);
            extrude(m, "ditch", "x", ngon(10, 0.085, 0, z, s.sillBottom - 0.13), along(L + 0.06, L + 0.08));
          }
        });
      // the corner steps: three treads in a frame under each corner of the walkway
      m.scope("steps", () => {
        for (const sd of [-1, 1]) {
          const z: [number, number] = side(sd, s.deckHalf - 0.62, s.deckHalf - 0.04);
          for (const y of [0.42, 0.78, 1.14]) block(m, "steel", ...along(L - 0.62, L - 0.22), y, y + 0.03, ...z);
          for (const zz of z) block(m, l.pilot, ...along(L - 0.64, L - 0.2), 0.36, s.sillBottom, zz - 0.025, zz + 0.025);
          // the grab irons each side of the step
          for (const xx of [L - 0.64, L - 0.2]) m.rod("handrail", [e * xx, 0.5, sd * (s.deckHalf - 0.02)], [e * xx, s.deck + 0.9, sd * (s.deckHalf - 0.02)], 0.018, 6);
        }
      });
    });
}

function longHood(m: MeshBuilder, s: UsHoodSpec, l: UsLivery): void {
  const h = s.hood, r = s.radiator;
  const sec = hoodSection(s.deck, h.half, h.top, h.r);
  const p = bodyPaint(s, l, h.top - h.r * 0.5);
  // the hood ahead of the radiator, and the radiator section (flared or straight)
  const flared = r.kind === "flared";
  m.scope("hood", () => paintedSweep(m, "x", sec, flared ? r.x1 : h.x0, h.x1, p, flared ? [] : [-1]));
  if (flared)
    m.scope("radiator", () => {
      const fh = r.half!, ft = r.top!;
      const flare: UY[] = [[-h.half, s.deck], [h.half, s.deck], [h.half, ft - 1.25], [fh, ft - 0.55], [fh, ft - 0.08], [fh - 0.08, ft], [-(fh - 0.08), ft], [-fh, ft - 0.08], [-fh, ft - 0.55], [-h.half, ft - 1.25]];
      paintedSweep(m, "x", flare, h.x0, r.x1, bodyPaint(s, l, ft - 0.04), [-1, 1]);
      // the radiator cores on the flared sides
      for (const sd of [-1, 1]) {
        const zz = sd * (fh + 0.006);
        decalZ(m, "grille", zz, sd, r.x0 + 0.3, r.x1 - 0.3, ft - 0.5, ft - 0.12);
        for (let x = r.x0 + 0.4; x < r.x1 - 0.35; x += 0.16) decalZ(m, "louvre", zz + sd * 0.004, sd, x, x + 0.05, ft - 0.48, ft - 0.14);
      }
    });
  else
    m.scope("radiator grilles", () => {
      for (const sd of [-1, 1]) {
        const zz = sd * (h.half + 0.006);
        decalZ(m, "grille", zz, sd, r.x0, r.x1, h.top - 0.75, h.top - h.r - 0.05);
        for (let y = h.top - 0.7; y < h.top - h.r - 0.08; y += 0.09) decalZ(m, "louvre", zz + sd * 0.004, sd, r.x0 + 0.05, r.x1 - 0.05, y, y + 0.035);
      }
    });
  const roofY = flared ? r.top! : h.top;
  m.scope("fans", () => {
    for (const x of r.fans) roofFan(m, x, 0, roofY, r.fanR);
  });
  if (s.blister)
    m.scope("dynamic brake", () => {
      const b = s.blister!;
      const bsec = hoodSection(h.top - 0.2, b.half, b.top, 0.08);
      paintedSweep(m, "x", bsec, b.x0, b.x1, { bands: l.body, roofFrom: b.top - 0.05, roof: l.roof });
      roofFan(m, (b.x0 + b.x1) / 2, 0, b.top, 0.42);
      for (const sd of [-1, 1]) decalZ(m, "grille", sd * (b.half + 0.005), sd, b.x0 + 0.2, b.x1 - 0.2, h.top - 0.15, b.top - 0.1);
    });
  m.scope("exhaust", () => exhaust(m, s.exhaustX, 0, h.top - 0.02, h.top + 0.22, 0.32, 0.6));
  // the hood doors: seams and latches down each side, and the hood end's headlight
  m.scope("doors", () => {
    const x0 = flared ? r.x1 + 0.15 : r.x1 + 0.1, x1 = h.x1 - 0.2;
    const n = Math.max(1, Math.round((x1 - x0) / 1.25));
    const w = (x1 - x0) / n;
    for (const sd of [-1, 1])
      for (let i = 0; i <= n; i++) {
        const x = x0 + i * w;
        decalZ(m, "black", sd * (h.half + 0.004), sd, x - 0.012, x + 0.012, s.deck + 0.15, h.top - h.r - 0.12);
        if (i < n) decalZ(m, "black", sd * (h.half + 0.004), sd, x + w / 2 - 0.06, x + w / 2 + 0.06, s.deck + 1.05, s.deck + 1.11);
      }
  });
  m.scope("lettering", () => {
    const x0 = (flared ? r.x1 : r.x1) + 0.3, x1 = (s.blister && s.blister.x0 > 0 ? Math.min(h.x1, s.blister.x0 + 2) : h.x1) - 0.3;
    for (const sd of [-1, 1]) sideText(m, l.letter, l.railroad, sd, h.half + 0.009, (x0 + x1) / 2, s.deck + l.letterY, l.letterH);
  });
  m.scope("rear headlight", () => {
    const x = h.x0, y = (flared ? r.top! : h.top) - 0.32;
    block(m, "black", x - 0.08, x + 0.002, y - 0.14, y + 0.14, -0.36, 0.36);
    for (const z of [-0.18, 0.18]) extrude(m, "lampHead", "x", ngon(10, 0.1, 0, z, y), [x - 0.1, x - 0.08]);
    for (const z of [-0.7, 0.7]) {
      const yy = s.deck + 0.55;
      extrude(m, "lampRed", "x", ngon(8, 0.07, 0, z, yy), [x - 0.03, x - 0.002]);
    }
    // the rear number boards
    for (const z of [-0.62, 0.62]) block(m, "numberBoard", x - 0.04, x + 0.002, y - 0.08, y + 0.08, z - 0.2, z + 0.2);
  });
}

function front(m: MeshBuilder, s: UsHoodSpec, l: UsLivery): void {
  const f = s.front;
  if (f.kind === "highHood") {
    const h = s.hood;
    const sec = hoodSection(s.deck, h.half, h.top, h.r);
    m.scope("short hood", () => paintedSweep(m, "x", sec, f.x0, f.x1, bodyPaint(s, l, h.top - h.r * 0.5), [1]));
    // headlight pair and number boards at the top of the short hood's face
    m.scope("headlight", () => {
      const x = f.x1, y = h.top - 0.3;
      block(m, "black", x - 0.002, x + 0.08, y - 0.14, y + 0.14, -0.36, 0.36);
      for (const z of [-0.18, 0.18]) extrude(m, "lampHead", "x", ngon(10, 0.1, 0, z, y), [x + 0.08, x + 0.1]);
      for (const z of [-0.62, 0.62]) block(m, "numberBoard", x - 0.002, x + 0.04, y - 0.08, y + 0.08, z - 0.2, z + 0.2);
      for (const z of [-0.62, 0.62]) endText(m, "black", l.number, 1, x + 0.042, z, y - 0.055, 0.11, 0.06, 0.02);
      for (const z of [-0.7, 0.7]) extrude(m, "lampRed", "x", ngon(8, 0.07, 0, z, s.deck + 0.55), [x - 0.002, x + 0.03]);
    });
    m.scope("bell", () => m.prism("horn", ngon(8, 0.12, 0, (f.x0 + f.x1) / 2, 0), h.top, h.top + 0.16));
    return;
  }
  if (f.kind === "lowNose") {
    // a low short hood with its top chamfered toward the end, as wide as the long hood
    const t = f.top, half = s.hood.half;
    const prof: UY[] = [[f.x0, s.deck], [f.x1, s.deck], [f.x1, t - 0.22], [f.x1 - 0.22, t], [f.x0, t]];
    m.scope("nose", () => {
      paintedSweep(m, "z", prof, -half, half, profilePaint(l, t - 0.01, matAt(endBands(l), t - 0.05)), [-1, 1]);
    });
    m.scope("headlight", () => {
      const x = f.x1, y = t - 0.45;
      block(m, "black", x - 0.002, x + 0.08, y - 0.14, y + 0.14, -0.36, 0.36);
      for (const z of [-0.18, 0.18]) extrude(m, "lampHead", "x", ngon(10, 0.1, 0, z, y), [x + 0.08, x + 0.1]);
      for (const z of [-0.7, 0.7]) extrude(m, "lampRed", "x", ngon(8, 0.07, 0, z, s.deck + 0.55), [x - 0.002, x + 0.03]);
    });
    m.scope("bell", () => m.prism("horn", ngon(8, 0.12, 0, f.x1 - 0.6, 0.5), t, t + 0.16));
    return;
  }
  // the wide nose of the safety cab: the cab's width, its top sloping down toward the end
  const t = f.top, half = f.half;
  const prof: UY[] = [[f.x0, s.deck], [f.x1, s.deck], [f.x1, t - 0.42], [f.x1 - 0.5, t], [f.x0, t + 0.06]];
  m.scope("nose", () => paintedSweep(m, "z", prof, -half, half, profilePaint(l, t + 0.5, l.roof), [-1, 1]));
  m.scope("headlights", () => {
    const x = f.x1;
    for (const z of [-0.36, 0.36]) {
      const y = t - 0.75;
      block(m, "black", x - 0.002, x + 0.05, y - 0.13, y + 0.13, z - 0.16, z + 0.16);
      extrude(m, "lampHead", "x", ngon(10, 0.1, 0, z, y), [x + 0.05, x + 0.07]);
    }
    for (const z of [-1.1, 1.1]) extrude(m, "lampRed", "x", ngon(8, 0.06, 0, z, s.deck + 0.4), [x - 0.002, x + 0.03]);
  });
  // the number boards on the nose's slope, the anticlimber over the pilot
  m.scope("number boards", () => {
    for (const sd of [-1, 1]) block(m, "numberBoard", f.x1 - 0.3, f.x1 - 0.04, t - 0.3, t - 0.12, ...side(sd, 0.55, 1.05));
  });
  m.scope("anticlimber", () => block(m, l.frame, f.x1, f.x1 + 0.08, s.deck - 0.12, s.deck + 0.02, -half + 0.1, half - 0.1));
}

function cab(m: MeshBuilder, s: UsHoodSpec, l: UsLivery): void {
  const c = s.cab;
  const roof = l.cabRoof ?? l.roof;
  const wall: Paint = { bands: cabBands(l), ends: endBands(l), roofFrom: c.top - 0.12, roof };
  if (c.kind === "classic") {
    const sec: UY[] = [[-c.half, s.deck], [c.half, s.deck], [c.half, c.top - 0.3], [c.half - 0.18, c.top - 0.08], [0.5, c.top], [-0.5, c.top], [-(c.half - 0.18), c.top - 0.08], [-c.half, c.top - 0.3]];
    m.scope("shell", () => paintedSweep(m, "x", sec, c.x0, c.x1, wall));
    // windscreens: two panes over a low nose, or a pane each side of a high hood
    m.scope("windscreen", () => {
      const lowY = s.front.kind === "highHood" ? s.hood.top - 0.95 : (s.front as { top: number }).top + 0.12;
      const y0 = Math.max(lowY, c.top - 1.05), y1 = c.top - 0.25;
      const panes: Array<[number, number]> = s.front.kind === "highHood" ? [[s.hood.half + 0.08, c.half - 0.12]] : [[0.1, c.half - 0.25]];
      for (const sd of [-1, 1])
        for (const [a, b] of panes) {
          decalX(m, "rubber", c.x1 + 0.004, 1, ...side(sd, a, b), y0, y1);
          decalX(m, "glass", c.x1 + 0.008, 1, ...side(sd, a + 0.04, b - 0.04), y0 + 0.04, y1 - 0.04);
        }
    });
    m.scope("rear windows", () => {
      for (const sd of [-1, 1]) {
        decalX(m, "rubber", c.x0 - 0.004, -1, ...side(sd, s.hood.half + 0.1, c.half - 0.15), c.top - 1.0, c.top - 0.3);
        decalX(m, "glass", c.x0 - 0.008, -1, ...side(sd, s.hood.half + 0.14, c.half - 0.19), c.top - 0.96, c.top - 0.34);
      }
    });
  } else {
    // the safety cab: a raked windscreen over the nose, the roof's edge rounded
    const fx = c.x1, rake = 0.32;
    const prof: UY[] = [[c.x0, s.deck], [fx, s.deck], [fx, c.top - 1.35], [fx - rake, c.top - 0.12], [fx - rake - 0.12, c.top], [c.x0, c.top]];
    m.scope("shell", () => paintedSweep(m, "z", prof, -c.half, c.half, profilePaint(l, c.top - 0.06, roof), [-1, 1]));
    m.scope("windscreen", () => {
      const ya = c.top - 1.25, yb = c.top - 0.22;
      const xAt = (y: number) => fx - rake * ((y - (c.top - 1.35)) / (1.23));
      const n: Vec3 = [1.23, rake, 0];
      for (const sd of [-1, 1]) {
        const [z0, z1] = side(sd, 0.08, c.half - 0.22);
        const q = (d: number, za: number, zb: number, y0: number, y1: number): Vec3[] => {
          const pts: Vec3[] = [[xAt(y0) + d, y0, za], [xAt(y0) + d, y0, zb], [xAt(y1) + d, y1, zb], [xAt(y1) + d, y1, za]];
          return [pts[0]!, pts[1]!, pts[2]!, pts[0]!, pts[2]!, pts[3]!];
        };
        m.facets("rubber", q(0.005, z0, z1, ya, yb), n);
        m.facets("glass", q(0.01, z0 + 0.04, z1 - 0.04, ya + 0.04, yb - 0.04), n);
      }
    });
    m.scope("rear windows", () => {
      for (const sd of [-1, 1]) {
        decalX(m, "rubber", c.x0 - 0.004, -1, ...side(sd, s.hood.half + 0.1, c.half - 0.15), c.top - 1.0, c.top - 0.3);
        decalX(m, "glass", c.x0 - 0.008, -1, ...side(sd, s.hood.half + 0.14, c.half - 0.19), c.top - 0.96, c.top - 0.34);
      }
    });
  }
  // side windows (a sliding pane and a fixed one) and the running number under them
  m.scope("side windows", () => {
    const len = c.x1 - c.x0;
    for (const sd of [-1, 1]) {
      const zz = sd * (c.half + 0.004);
      const xa = c.x0 + 0.25, xb = c.x0 + len * 0.82;
      decalZ(m, "rubber", zz, sd, xa, xb, c.top - 1.05, c.top - 0.35);
      decalZ(m, "glass", zz + sd * 0.004, sd, xa + 0.05, (xa + xb) / 2 - 0.03, c.top - 1.0, c.top - 0.4);
      decalZ(m, "glass", zz + sd * 0.004, sd, (xa + xb) / 2 + 0.03, xb - 0.05, c.top - 1.0, c.top - 0.4);
      sideText(m, l.numberMat, l.number, sd, c.half + 0.006, c.x0 + len * 0.5, c.top - 1.75, 0.36);
    }
  });
  m.scope("horn", () => {
    horn(m, 1, (c.x0 + c.x1) / 2, 0.3, c.top + 0.16);
    horn(m, -1, (c.x0 + c.x1) / 2 - 0.25, -0.3, c.top + 0.16);
  });
  m.scope("antenna", () => m.prism("black", ngon(6, 0.025, 0, c.x0 + 0.4, 0.6), c.top - 0.02, c.top + 0.18));
}

function walkways(m: MeshBuilder, s: UsHoodSpec, l: UsLivery): void {
  const y = s.deck + 1.0, yMid = s.deck + 0.5, z = s.deckHalf - 0.03;
  const L = s.endSill;
  // side handrails from the cab back to the rear end and on the front walkway, stanchions about every 1.5 m
  const ahead = s.front.kind === "wideNose" ? s.front.x1 + 0.05 : s.cab.x1 + 0.1;
  const runs: Array<[number, number]> = [[-L + 0.25, s.cab.x0 - 0.1], [ahead, L - 0.25]];
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right rail" : "left rail", () => {
      for (const [a, b] of runs) {
        if (b - a < 0.4) continue;
        const zc = sd * z;
        tubeX(m, l.rails, 0.02, a, y, zc, b, y, zc, 6);
        tubeX(m, l.rails, 0.016, a, yMid, zc, b, yMid, zc, 6);
        const n = Math.max(1, Math.round((b - a) / 1.5));
        for (let i = 0; i <= n; i++) m.prism(l.rails, ngon(6, 0.022, 0, a + ((b - a) * i) / n, zc), s.deck, y);
      }
    });
  // the end railings across each walkway's end, open in the middle
  m.scope("end rails", () => {
    for (const e of [1, -1]) {
      const x = e * (L - 0.25);
      for (const sd of [-1, 1]) m.rod(l.rails, [x, y, sd * 0.5], [x, y, sd * z], 0.02, 6);
      for (const sd of [-1, 1]) m.prism(l.rails, ngon(6, 0.022, 0, x, sd * 0.5), s.deck, y);
    }
  });
}

function underframe(m: MeshBuilder, s: UsHoodSpec, l: UsLivery): void {
  const t = s.tank;
  m.scope("fuel tank", () => {
    const top = s.sillBottom;
    const sec: Ring = [[-t.half, top], [t.half, top], [t.half, t.y0 + 0.2], [t.half - 0.2, t.y0], [-(t.half - 0.2), t.y0], [-t.half, t.y0 + 0.2]];
    m.sweep(l.frame, "x", sec, t.x0, sec, t.x1);
    for (const sd of [-1, 1]) {
      decalZ(m, "white", sd * (t.half + 0.004), sd, (t.x0 + t.x1) / 2 - 0.4, (t.x0 + t.x1) / 2 + 0.4, top - 0.35, top - 0.2);
      // the fuel filler and gauge
      block(m, "steel", t.x1 - 0.5, t.x1 - 0.35, top - 0.3, top - 0.12, ...side(sd, t.half, t.half + 0.04));
    }
  });
  m.scope("air reservoirs", () => {
    const len = Math.min(2.4, (s.trucks.centre - s.trucks.spec.frameHalf) - t.x1 - 0.2);
    if (len > 0.6) for (const sd of [-1, 1]) tankX(m, "tank", t.x1 + 0.1, t.x1 + 0.1 + len, sd * 0.75, s.sillBottom - 0.22, 0.2);
  });
}

// ---------------------------------------------------------------------------
// The distant model

/** A US hood unit for distant views (docs/models/lod.md): hood, front, cab, frame and the trucks. */
export function usHoodLod(s: UsHoodSpec, l: UsLivery, budget = 100): MeshBuilder {
  const bands = (y0: number, y1: number, roof: string, src: readonly Band[] = l.body): LodBand[] => [...lodBands(src, y0, y1 - 0.15), [y1 - 0.15, y1, roof]];
  const ends = endBands(l);
  const h = s.hood;
  const flared = s.radiator.kind === "flared";
  const shell = (x0: number, x1: number, half: number, top: number, sideBands: readonly LodBand[], endBands: readonly LodBand[], roof: string, extra: Partial<LodShell> = {}): LodShell => ({
    y0: s.deck, xc: (x0 + x1) / 2, tip: [[s.deck, (x1 - x0) / 2], [top, (x1 - x0) / 2]],
    hw: [[s.deck, half], [top - 0.12, half], [top, Math.max(0.1, half - 0.15)]],
    side: sideBands, end: endBands, roof, ...extra,
  });
  const top = flared ? s.radiator.top! : h.top;
  const hoodShell = shell(h.x0, h.x1, flared ? s.radiator.half! : h.half, top, bands(s.deck, top, l.roof), [...lodBands(ends, s.deck, top - 0.15), [top - 0.15, top, l.roof]], l.roof, { ends: [-1] });
  const c = s.cab;
  const cabRoof = l.cabRoof ?? l.roof;
  const cabShell = shell(c.x0, c.x1, c.half, c.top, bands(s.deck, c.top, cabRoof, cabBands(l)), [...lodBands(ends, s.deck, c.top - 0.15), [c.top - 0.15, c.top, cabRoof]], cabRoof, {
    endWindows: [-1, 1].map((sd) => ({ u: sd > 0 ? [0.15, c.half - 0.2] as const : [-(c.half - 0.2), -0.15] as const, y: [c.top - 1.0, c.top - 0.3] as const, mat: LOD_GLASS, ends: [1], optional: 0.3 })),
    sideWindows: sideWindows([{ u: [c.x0 + 0.25, c.x0 + (c.x1 - c.x0) * 0.82], y: [c.top - 1.05, c.top - 0.35] }]),
  });
  const f = s.front;
  const fTop = f.kind === "highHood" ? h.top : f.top;
  const fHalf = f.kind === "wideNose" ? f.half : h.half;
  const frontShell = shell(f.x0, f.x1, fHalf, fTop, lodBands(cabBands(l), s.deck, fTop), lodBands(ends, s.deck, fTop), f.kind === "highHood" ? l.roof : matAt(ends, fTop - 0.05), { ends: [1] });
  const L = s.endSill;
  const boxes: LocoBox[] = [
    { name: "frame", mat: l.frame, x: [-L, L], y: [s.sillBottom, s.deck], w: s.deckHalf },
    { name: "fuel tank", mat: l.frame, x: [s.tank.x0, s.tank.x1], y: [s.tank.y0, s.sillBottom], w: s.tank.half, top: false, optional: 35 },
    ...[-1, 1].map((e): LocoBox => ({ name: "pilot", mat: l.pilot, x: e > 0 ? [L - 0.3, L] : [-L, -L + 0.3], y: [0.16, s.sillBottom], w: s.deckHalf - 0.06, top: false, optional: 30 })),
  ];
  return locoLod({
    palette: { ...US_PALETTE, ...l.palette },
    shells: [hoodShell, frontShell, cabShell],
    boxes,
    gear: [-1, 1].map((e) => ({ xc: e * s.trucks.centre, half: s.trucks.spec.frameHalf, top: s.trucks.spec.frameTop })),
  }, budget);
}
