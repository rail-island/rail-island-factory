// Shared parts of the older Czech electric units from vlakosimdb: the CD 451
// "frog mouth" (emu451.ts), the CD 460 (emu460.ts) and the CD 470 double-deck
// prototype (emu470.ts). Their bodies are lofted by the coach builder
// (csdCoachParts.ts) like the CD 471's; this module holds the frame that maps a
// vlakosimdb car into the builder's body metres, the side and end fittings the
// three share, and their bogies. No `node:` imports. See docs/models/czech-emus-classic.md.
//
// Body metres `b` run from the inner end wall (b = 0) to the cab or the far end
// wall: every vlakosimdb car of these three has its cab at low source x, so
// b = kx * (srcEnd - x). The Coach centres the car between its coupling faces;
// a cab car's cab faces +X. Heights and widths are the XML's (no scale).

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { Coach, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { emblem, lettering, letteringWidth } from "./cd163.ts";
import { buffers as kitBuffers } from "./czElectricKit.ts";
import { block, side } from "./vehicleParts.ts";

export type PxBox = [number, number, number, number];

/** How a vlakosimdb car maps into body metres. */
export interface CarFrame {
  /** Source x of the inner end wall: b = 0 there. */
  srcEnd: number;
  /** The documented length scale (published length over the XML's). */
  kx: number;
  /** The side BMP's height in metres (0.1 m a pixel): y = H - row / 10. */
  H: number;
}

/** Source x to body metres. */
export const bOf = (F: CarFrame, x: number): number => F.kx * (F.srcEnd - x);

/** Source elevation points (x, y) to body metres, ascending in b. */
export const toB = (F: CarFrame, pts: Pt[]): Pt[] => pts.map(([x, y]): Pt => [bOf(F, x), y]).sort((p, q) => p[0] - q[0]);

/** A source side-view polygon (x, y) in body metres, its order kept. */
export const polyB = (F: CarFrame, pts: Pt[]): Pt[] => pts.map(([x, y]): Pt => [bOf(F, x), y]);

/** A native side-BMP box [left, top, right, bottom] (column = source x * 10) as a body box. */
export function sb(F: CarFrame, b: PxBox): Box {
  const [x0, x1] = [bOf(F, b[0] / 10), bOf(F, b[2] / 10)].sort((p, q) => p - q) as [number, number];
  return { x0, x1, y0: F.H - b[3] / 10, y1: F.H - b[1] / 10 };
}

/** Front-view column (30 px across 3 m, seen from outside the +X end) to z, and a row to height. */
export const fz = (u: number): number => 1.5 - u / 10;
export const fyOf = (H: number) => (v: number): number => H - v / 10;

/** Materials every car of the three shares. */
export const CLASSIC_PALETTE: Record<string, MaterialSpec> = {
  glass: { color: "#2f363d", metallic: 0.2, roughness: 0.15 },
  frame: { color: "#b8bcbf", metallic: 0.2, roughness: 0.45 },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  cabBlack: { color: "#222324", roughness: 0.6 },
  louvreSlat: { color: "#3a3d40", roughness: 0.8 },
  pantograph: { color: "#4b4f55", metallic: 0.2, roughness: 0.6 },
  carbon: { color: "#2b2b2b", roughness: 0.8 },
  insulator: { color: "#8a4a26", roughness: 0.4 },
  coupler: { color: "#3a3c3f", metallic: 0.3, roughness: 0.5 },
  motor: { color: "#2e3033", roughness: 0.8 },
  lampWhite: { color: "#f3f5f6", roughness: 0.2 },
  lampRed: { color: "#c8202c", roughness: 0.3 },
  lampYellow: { color: "#f2c230", roughness: 0.3 },
  lettering: { color: "#f2f2f2", roughness: 0.5 },
  letteringDark: { color: "#202020", roughness: 0.5 },
};

/** A louvred panel: the panel in `mat` and `slats` dark horizontal slats over it. */
export function louvre(c: Coach, v: Volume, s: number, b: Box, mat: string, slats: number): void {
  c.m.scope("panel", () => c.sidePanel(v, mat, s, b, 0.008, 0.02));
  const h = (b.y1 - b.y0) / slats;
  c.m.scope("slats", () => {
    for (let i = 0; i < slats; i++) {
      const y0 = b.y0 + i * h + h * 0.3;
      c.sidePanel(v, "louvreSlat", s, { x0: b.x0 + 0.04, x1: b.x1 - 0.04, y0, y1: y0 + h * 0.4 }, 0.016, 0.006);
    }
  });
}

/** A row of running-number numerals on side s, centred at body x, its foot at y. */
export function sideNumber(c: Coach, v: Volume, s: number, text: string, x: number, y: number, h: number, mat: string): void {
  c.numeral(v, s, text, x, y, h, 0.006, mat);
}

/** The CD emblem on side s over body box e (centred, 62 % of its height). */
export function sideEmblem(c: Coach, s: number, e: Box, half: number, mat: string): void {
  const h = (e.y1 - e.y0) * 0.8;
  const w = h * 1.5385;
  const cx = c.X((e.x0 + e.x1) / 2);
  const u0 = s > 0 ? cx - w / 2 : cx + w / 2;
  c.m.facets(mat, emblem(u0, (e.y0 + e.y1) / 2 - h / 2, h, s < 0).map(([u, vv]): Vec3 => [u, vv, s * (half + 0.009)]), [0, 0, s]);
}

/**
 * Decals on a front face of the +X end: `polys` in (u, v), u to the reader's
 * right (toward -z), laid at x = xAt(y) + proud.
 */
export function frontDecal(m: MeshBuilder, mat: string, pts: Array<[number, number]>, xAt: (y: number) => number, proud: number): void {
  m.facets(mat, pts.map(([u, vv]): Vec3 => [xAt(vv) + proud, vv, -u]), [1, 0, 0]);
}

/** The CD emblem on the +X front, centred at z = 0, foot at y0, h high. */
export function frontEmblem(m: MeshBuilder, mat: string, y0: number, h: number, xAt: (y: number) => number): void {
  const w = h * 1.5385;
  frontDecal(m, mat, emblem(-w / 2, y0, h, false), xAt, 0.012);
}

/** A running number on the +X front, its left end at u0 (reader's), foot at y0. */
export function frontNumber(m: MeshBuilder, mat: string, text: string, uc: number, y0: number, h: number, xAt: (y: number) => number): void {
  const w = h * 0.55;
  const width = letteringWidth(text, w, w * 0.25);
  frontDecal(m, mat, lettering(text, uc - width / 2, y0, h, w, w * 0.25, false), xAt, 0.012);
}

/** A round lens facing +X at Factory x, its centre (z, y). */
export function lens(m: MeshBuilder, mat: string, x: number, z: number, y: number, r: number, depth = 0.03, n = 12): void {
  const ring = ngon(n, r, 0, z, y);
  m.sweep(mat, "x", ring, x - depth, ring, x + 0.012);
}

export interface GangwayOpts {
  /** Body x of the end wall and the end e (+1 the high-b end). */
  wall: number;
  e: number;
  /** How far the coupling face stands off the wall (bellows, buffers). */
  face: number;
  /** End door box (z across, y up) and its paint. */
  door: Box;
  doorPaint: string;
  /** Height of the coupler bar and of the buffers (if any). */
  couplerY: number;
  buffers?: { y: number; head: "round" | "rect" };
  /** Marker lamps' height; omitted: none. */
  markerY?: number;
}

/** An inner end: gangway bellows, the end door, marker lamps, a short coupler bar and buffers if any. */
export function gangwayEnd(c: Coach, v: Volume, o: GangwayOpts): void {
  const m = c.m;
  const { wall, e } = o;
  const X = (b: number) => c.X(b);
  const bell = wall + e * Math.min(o.face, 0.2);
  m.scope("gangway", () => {
    const [a, b] = [X(wall) - e * 0.02, X(bell)].sort((p, q) => p - q) as [number, number];
    for (const z of [-1, 1]) block(m, "rubber", a, b, o.door.y0 - 0.12, o.door.y1 + 0.12, ...side(z, -o.door.x0 + 0.04, -o.door.x0 + 0.18));
    block(m, "rubber", a, b, o.door.y1 + 0.02, o.door.y1 + 0.12, o.door.x0 + 0.04, o.door.x1 - 0.04);
    block(m, "rubber", a, b, o.door.y0 - 0.12, o.door.y0 - 0.02, o.door.x0 + 0.04, o.door.x1 - 0.04);
  });
  m.scope("end door", () => c.door(v, e, o.door, o.doorPaint, { end: true, seam: 0.03 }));
  if (o.markerY !== undefined)
    m.scope("marker lamps", () => {
      for (const z of [-1.1, 1.1]) {
        const ring = ngon(8, 0.05, 0, z, o.markerY!);
        m.sweep("lampRed", "x", ring, X(wall) + e * 0.002, ring, X(wall) + e * 0.03);
      }
    });
  if (!o.buffers)
    m.scope("coupler", () => {
      const bar = ngon(8, 0.08, Math.PI / 8, 0, o.couplerY);
      const [a, b] = [X(wall - e * 0.6), X(wall + e * o.face) - e * 0.01].sort((p, q) => p - q) as [number, number];
      m.sweep("coupler", "x", bar, a, bar, b);
    });
  if (o.buffers) endBuffers(c, e, wall - e * 0.25, wall + e * o.face, o.buffers.y, o.buffers.head);
}

/** Side buffers and the screw coupling on end e: beam and buffer faces at body x (czElectricKit's buffers). */
export function endBuffers(c: Coach, e: number, beam: number, face: number, y: number, head: "round" | "rect"): void {
  kitBuffers(c.m, e, Math.abs(c.X(beam)), Math.abs(c.X(face)), y, head);
}

/** A bogie (the coach builder's) with traction motors when `motor`. */
export function emuBogie(c: Coach, bc: number, wb: number, r: number, top: number, motor: boolean): void {
  const m = c.m;
  c.bogie(bc, wb, r, top);
  if (motor)
    m.scope("traction motors", () => {
      for (const d of [-0.62, 0.62]) block(m, "motor", c.X(bc) + d - 0.27, c.X(bc) + d + 0.27, r * 0.6, r * 1.5, -0.5, 0.5);
    });
}

/** A side-view polygon swept across z in Factory coordinates (body x converted). */
export function sweepSide(c: Coach, mat: string, poly: Pt[], z0: number, z1: number): void {
  c.sideSweep(mat, poly, z0, z1);
}
