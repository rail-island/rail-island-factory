// China Railway's C70 open wagon and P70 covered wagon (the 70 t freight wagons of 2006),
// measured from the photographs in assets/cr-c70-wagon/ (SOURCES.md) and the published
// figures: the C70 13.976 m over the couplers, 13.0 m inside, 3.242 m wide, 3.143 m high,
// bogie centres 9.21 m, 840 mm wheels on K6 three-piece bogies, 23.6 t tare and 70 t load
// (its load marks: 70 t, 23.6 t, 77 m3); the P70 about 17 m over the couplers, 16.1 m by
// 2.8 m by 2.8 m inside (its load marks: 70 t, 24.6 t, 145 m3, length factor 1.6).
//
// The C70 (unit `open`, drawn as C70 1658252): a steel box of seven bays between slim hat
// section stakes, the top chord over them; the middle bay holds the two side door leaves,
// every other bay a bottom door hinged at its top with two straps, and an A of pressed
// braces above it; the end bays are wider, their door set toward the inner stake. The end
// walls carry four horizontal ribs, the +X end the hand brake wheel; a ladder at each
// side's right-hand corner (diagonally opposite). Weathered dark brownish grey, white
// lettering: "C70", the CR emblem, the number split "16 58252", the load marks.
//
// The P70 (unit `covered`, drawn as P70 3817696 in black): seven narrow bays each side of
// the wide sliding door, hat-section posts, each panel with four pressed horizontal ribs,
// a top-hinged vent hatch in the second and fifth bays from each end, the door's
// horizontal corrugations between its top and bottom tracks; the arched roof with a
// transverse rib over every post pitch and four round caps on the ridge, the arched end
// walls with four vertical posts, the +X end with the hand brake wheel and its step.
//
// Both on K6 three-piece bogies (cast side frames with the spring window, the bolster
// through it) and 17-type knuckle couplers at 0.88 m. See docs/models/china-locos.md
// ("The C70 / P70 wagons' bodies").
//
// Metres, +X forward, +Y up, +Z right. A side's features are laid out in u, along the side
// as seen from outside it, left to right (x = s * u on side s), so the two sides are alike
// turned end for end, as the real wagons are.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamValues } from "./design.ts";
import { paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { US_PALETTE, sideText } from "./usHoodKit.ts";
import { WAGON_PARAMS, type WagonUnit } from "./worldWagons.ts";
import type { LodBand, LodPart } from "./lodKit.ts";
import { bogieParts, fitUnit, underPart, type UnitBody } from "./lodUnits.ts";

/** The automatic couplers' centre height. */
const COUPLER_Y = 0.88;

// ---------------------------------------------------------------------------
// Measures

/** The C70: half lengths over the couplers and the body, the side sheet's outer face, heights. */
export const C70 = {
  face: 13.976 / 2, body: 6.75, hw: 1.46, sill: 0.82, sillTop: 0.93, floor: 1.09, chord: 3.03, top: 3.143,
  /** Over the stakes and the top chord: 3.242 m. */
  chordHw: 1.621, postHw: 1.56,
  /** The stakes along the side (u), the corners included; the middle bay holds the side doors. */
  posts: [-6.75, -4.67, -2.8, -0.91, 0.91, 2.8, 4.67, 6.75],
  centre: 9.21 / 2,
  doorW: 1.33, doorY: [0.93, 2.0] as const,
  number: "1658252",
};

/** The P70: the same, the eaves and the roof's rise over them. */
export const P70 = {
  face: 8.5, body: 8.3, hw: 1.45, sill: 0.98, floor: 1.15, eaves: 4.0, rise: 0.6,
  postHw: 1.58,
  /** The door frame's posts (+-) and the post pitch: seven bays each side of the door. */
  door: 1.66, pitch: (8.3 - 1.66) / 7,
  centre: 6.0,
  /** The four round caps on the ridge, measured on P70 3817696. */
  caps: [-4.2, -1.25, 5.1, 7.75],
  number: "3817696",
};

const C70_PAINT = "#4a4541";
const P70_PAINT = "#2c2b2a";
const INK = "#e8e4d8";

function palette(unit: WagonUnit): Record<string, MaterialSpec> {
  return {
    ...US_PALETTE,
    wgBody: paint(unit === "open" ? C70_PAINT : P70_PAINT, 0.8),
    wgInk: paint(INK, 0.6),
    wgLoad: paint("#2b2a28", 0.95),
    wgDark: paint("#1e1d1c", 0.9),
    // the stakes, braces and chord: the same paint, worn lighter on the edges that catch the light
    wgEdge: paint(unit === "open" ? "#5a544e" : "#3a3836", 0.75),
    k6: paint("#2f2d2b", 0.85),
  };
}

// ---------------------------------------------------------------------------
// Shared parts

/** A box on side s between a and b out from the centre line. */
function sideBlock(m: MeshBuilder, mat: string, s: number, x0: number, x1: number, y0: number, y1: number, a: number, b: number): void {
  block(m, mat, Math.min(x0, x1), Math.max(x0, x1), y0, y1, ...side(s, a, b));
}

/** A strip on side s from (u0, y0) to (u1, y1), w wide, standing from z = a out to z = b: a pressed brace. */
function sideStrip(m: MeshBuilder, mat: string, s: number, u0: number, y0: number, u1: number, y1: number, w: number, a: number, b: number): void {
  const dx = u1 - u0, dy = y1 - y0, l = Math.hypot(dx, dy);
  const nx = (-dy / l) * (w / 2), ny = (dx / l) * (w / 2);
  const pts: Vec3[] = [[u0 + nx, y0 + ny, 0], [u1 + nx, y1 + ny, 0], [u1 - nx, y1 - ny, 0], [u0 - nx, y0 - ny, 0]].map(([u, y]): Vec3 => [s * u!, y!, s * b]);
  m.slab(mat, pts, [0, 0, -s * (b - a)]);
}

/** The CR emblem (the rail under the "people" arch in a ring) on side s at (u, yc), radius r, at z = s * zw. */
function sideEmblem(m: MeshBuilder, mat: string, s: number, zw: number, u: number, yc: number, r: number): void {
  const t = r * 0.16;
  const pts: Vec3[] = [];
  const P = (uu: number, y: number): Vec3 => [s * (u + uu), yc + y, s * zw];
  const quad = (a: [number, number], b: [number, number], c: [number, number], d: [number, number]) => pts.push(P(...a), P(...b), P(...c), P(...a), P(...c), P(...d));
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const o = (a: number, rr: number): [number, number] => [Math.cos(a) * rr, Math.sin(a) * rr];
    quad(o(a0, r - t), o(a0, r), o(a1, r), o(a1, r - t));
  }
  // the rail: head, web and foot
  quad([-r * 0.45, r * 0.12], [r * 0.45, r * 0.12], [r * 0.45, r * 0.12 + t], [-r * 0.45, r * 0.12 + t]);
  quad([-t / 2, -r * 0.55], [t / 2, -r * 0.55], [t / 2, r * 0.12], [-t / 2, r * 0.12]);
  quad([-r * 0.4, -r * 0.62], [r * 0.4, -r * 0.62], [r * 0.4, -r * 0.62 + t], [-r * 0.4, -r * 0.62 + t]);
  // the arch over it
  for (let i = 0; i < 6; i++) {
    const a0 = Math.PI * (0.15 + (0.7 * i) / 6), a1 = Math.PI * (0.15 + (0.7 * (i + 1)) / 6);
    const o = (a: number, rr: number): [number, number] => [Math.cos(a) * rr, r * 0.05 + Math.sin(a) * rr];
    quad(o(a0, r * 0.42), o(a0, r * 0.42 + t), o(a1, r * 0.42 + t), o(a1, r * 0.42));
  }
  m.facets(mat, pts, [0, 0, s]);
}

/** Lines of text on side s, the first line's top at y, centred at u. */
function sideLines(m: MeshBuilder, s: number, zw: number, u: number, y: number, h: number, lines: readonly string[]): void {
  lines.forEach((l, i) => sideText(m, "wgInk", l, s, zw, s * u, y - (i + 1) * h * 1.45, h));
}

/** A prism of the (x, y) section q across z0..z1. */
function zx(m: MeshBuilder, mat: string, q: Ring, [z0, z1]: [number, number]): void {
  m.sweep(mat, "z", q, z0, q, z1);
}

/** A K6 three-piece bogie at xc: 840 mm wheels 1.83 m apart, cast side frames with the spring window. */
function k6Bogie(m: MeshBuilder, xc: number): void {
  const R = 0.42, N = 20;
  const ay = R * Math.cos(Math.PI / N);
  const wb = 1.83 / 2;
  m.bogie(() => {
    for (const dx of [-wb, wb])
      m.scope("wheelset", () => {
        const x = xc + dx;
        const axle = ngon(8, 0.08, 0, x, ay);
        m.sweep("steel", "z", axle, -0.9, axle, 0.9);
        for (const s of [-1, 1]) {
          const tread = ngon(N, R, Math.PI / N, x, ay);
          zx(m, "wheel", tread, side(s, 0.665, 0.79));
          const disc = ngon(14, R * 0.8, 0, x, ay);
          zx(m, "wheel", disc, side(s, 0.79, 0.81));
          // the bearing and its adapter in the side frame's jaw
          const brg = ngon(10, 0.11, 0, x, ay);
          zx(m, "k6", brg, side(s, 0.81, 1.15));
          const cap = ngon(6, 0.07, Math.PI / 6, x, ay);
          zx(m, "spring", cap, side(s, 1.15, 1.18));
        }
      });
    m.scope("side frames", () => {
      for (const s of [-1, 1]) {
        const [z0, z1] = side(s, 0.98, 1.12);
        const frame = (q: Ring) => m.sweep("k6", "z", q.map(([x, y]) => [xc + x, y] as [number, number]), z0, q.map(([x, y]) => [xc + x, y] as [number, number]), z1);
        // the top member, tapering down over the jaws to the frame's ends
        frame([[-0.62, 0.62], [0.62, 0.62], [0.62, 0.8], [-0.62, 0.8]]);
        for (const e of [-1, 1]) {
          const q: Ring = [[0.62, 0.62], [1.12, 0.56], [1.14, 0.7], [0.62, 0.8]];
          frame(e > 0 ? q : q.map(([x, y]) => [-x, y] as [number, number]).reverse());
          // the jaw over the bearing
          frame(e > 0 ? [[0.76, ay + 0.1], [1.07, ay + 0.1], [1.07, 0.62], [0.76, 0.64]] : [[-1.07, ay + 0.1], [-0.76, ay + 0.1], [-0.76, 0.64], [-1.07, 0.62]]);
          // the lower tension member from the jaw down to the bottom chord
          const t: Ring = [[0.36, 0.12], [0.8, ay - 0.06], [0.8, ay + 0.1], [0.36, 0.3]];
          frame(e > 0 ? t : t.map(([x, y]) => [-x, y] as [number, number]).reverse());
          // the column beside the spring window
          frame(e > 0 ? [[0.3, 0.12], [0.4, 0.12], [0.4, 0.62], [0.3, 0.62]] : [[-0.4, 0.12], [-0.3, 0.12], [-0.3, 0.62], [-0.4, 0.62]]);
          // the diagonal web between the columns and the top member's end: the frame's triangular openings
          const d: Ring = [[0.4, 0.4], [0.5, 0.4], [0.74, 0.62], [0.62, 0.62]];
          frame(e > 0 ? d : d.map(([x, y]) => [-x, y] as [number, number]).reverse());
        }
        // the bottom chord under the spring window
        frame([[-0.3, 0.12], [0.3, 0.12], [0.3, 0.26], [-0.3, 0.26]]);
        // the spring nest
        for (const dx of [-0.17, 0, 0.17]) {
          const coil = ngon(8, 0.065, Math.PI / 8, xc + dx, s * 1.05);
          m.prism("spring", coil, 0.24, 0.47);
        }
        // the wedge under the bolster's end
        sideBlock(m, "k6", s, xc - 0.28, xc + 0.28, 0.47, 0.53, 0.98, 1.1);
      }
    });
    m.scope("bolster", () => {
      block(m, "k6", xc - 0.22, xc + 0.22, 0.53, 0.68, -1.1, 1.1);
      // the centre plate and the side bearers
      m.prism("k6", ngon(10, 0.2, 0, xc, 0), 0.68, 0.72);
      for (const s of [-1, 1]) sideBlock(m, "k6", s, xc - 0.12, xc + 0.12, 0.68, 0.74, 0.55, 0.75);
    });
    m.scope("brake beams", () => {
      for (const e of [-1, 1]) block(m, "k6", xc + e * 0.58 - 0.05, xc + e * 0.58 + 0.05, 0.36, 0.44, -0.92, 0.92);
    });
  });
}

/** A 17-type knuckle coupler on end e: the draft gear under the end sill from `gear`, the head to the face. */
function coupler(m: MeshBuilder, e: number, gear: number, face: number): void {
  const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
  const y = COUPLER_Y;
  m.scope(e > 0 ? "front coupler" : "rear coupler", () => {
    block(m, "knuckle", ...along(gear, face - 0.24), y - 0.08, y + 0.08, -0.1, 0.1);
    block(m, "knuckle", ...along(face - 0.26, face - 0.03), y - 0.2, y + 0.16, -0.16, 0.13);
    block(m, "knuckle", ...along(face - 0.22, face), y - 0.14, y + 0.1, 0.13, 0.25);
    // the uncoupling lever along the end, its handle out at the corner
    m.rod("handrail", [e * (face - 0.12), y + 0.22, -1.3], [e * (face - 0.12), y + 0.22, 0.05], 0.014, 6);
    m.rod("handrail", [e * (face - 0.12), y + 0.22, 0.05], [e * (face - 0.2), y + 0.12, 0.12], 0.014, 6);
  });
}

/** The hand brake wheel on end face x = e * xf at (z, y), its housing below. */
function brakeWheel(m: MeshBuilder, e: number, xf: number, z: number, y: number): void {
  m.scope("hand brake", () => {
    const along = (a: number, b: number): [number, number] => (e > 0 ? [xf + a, xf + b] : [-xf - b, -xf - a]);
    m.tube("wgDark", "x", z, y, 0.22, 0.185, ...along(0.1, 0.13), 14);
    m.sweep("wgDark", "x", ngon(8, 0.05, 0, z, y), along(0, 0.14)[0], ngon(8, 0.05, 0, z, y), along(0, 0.14)[1]);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.3;
      const xm = e * (xf + 0.115);
      m.rod("wgDark", [xm, y, z], [xm, y + Math.sin(a) * 0.2, z + Math.cos(a) * 0.2], 0.014, 5);
    }
    block(m, "wgDark", ...along(0, 0.12), y - 0.55, y - 0.12, z - 0.12, z + 0.12);
    m.rod("wgDark", [e * (xf + 0.06), y - 0.55, z], [e * (xf + 0.06), 1.0, z], 0.012, 5);
  });
}

/** A side ladder on side s: rails at u0 and u1 from y0 to y1, rungs `step` apart, standing out to z. */
function ladder(m: MeshBuilder, s: number, u0: number, u1: number, y0: number, y1: number, zIn: number, zOut: number): void {
  m.scope("ladder", () => {
    for (const u of [u0, u1]) {
      sideBlock(m, "wgEdge", s, s * (u - 0.02), s * (u + 0.02), y0, y1, zOut - 0.03, zOut);
      for (const y of [y0 + 0.05, y1 - 0.08]) sideBlock(m, "wgEdge", s, s * (u - 0.02), s * (u + 0.02), y, y + 0.04, zIn, zOut - 0.03);
    }
    for (let y = y0 + 0.2; y < y1 - 0.1; y += 0.3) m.rod("wgEdge", [s * u0, y, s * (zOut - 0.015)], [s * u1, y, s * (zOut - 0.015)], 0.012, 5);
  });
}

/** The underframe: the centre sill, the body bolsters over the bogies, cross bearers and the brake gear. */
function underframe(m: MeshBuilder, half: number, hw: number, floor: number, centre: number, y0: number): void {
  m.scope("underframe", () => {
    block(m, "underframe", -half, half, 0.74, floor - 0.05, -0.22, 0.22);
    for (const e of [-1, 1]) {
      // the body bolster over the bogie and the end sill
      block(m, "underframe", e * centre - 0.25, e * centre + 0.25, y0 - 0.03, floor - 0.06, -hw + 0.06, hw - 0.06);
      const [a, b] = e > 0 ? [half - 0.22, half] : [-half, -half + 0.22];
      block(m, "underframe", a, b, y0 - 0.04, floor - 0.06, -hw + 0.06, hw - 0.06);
    }
    for (const x of [-centre / 2, centre / 2]) block(m, "underframe", x - 0.1, x + 0.1, y0 + 0.08, floor - 0.06, -hw + 0.06, hw - 0.06);
    // the brake cylinder and the reservoir beside the centre sill, the brake pipe along it
    m.sweep("underframe", "x", ngon(10, 0.18, 0, 0.55, 0.78), -1.6, ngon(10, 0.18, 0, 0.55, 0.78), -0.5);
    m.sweep("underframe", "x", ngon(10, 0.2, 0, -0.6, 0.8), 0.4, ngon(10, 0.2, 0, -0.6, 0.8), 1.6);
    m.sweep("spring", "x", ngon(6, 0.03, 0, -0.3, 0.72), -half + 0.2, ngon(6, 0.03, 0, -0.3, 0.72), half - 0.2);
  });
}

// ---------------------------------------------------------------------------
// The C70 open wagon

function buildC70(m: MeshBuilder): void {
  const c = C70;
  const L = c.body;
  underframe(m, L - 0.02, c.hw, c.floor, c.centre, c.sill);
  m.scope("body", () => {
    m.scope("floor", () => block(m, "wgBody", -L + 0.04, L - 0.04, c.floor - 0.05, c.floor, -c.hw + 0.04, c.hw - 0.04));
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front end" : "rear end", () => {
        const [a, b] = e > 0 ? [L - 0.04, L] : [-L, -L + 0.04];
        block(m, "wgBody", a, b, c.sill, c.chord, -c.hw, c.hw);
        // four horizontal ribs over the end and the corner posts
        for (const y of [1.42, 1.92, 2.42, 2.88]) block(m, "wgBody", ...(e > 0 ? [L, L + 0.07] as const : [-L - 0.07, -L] as const), y - 0.05, y + 0.05, -c.hw + 0.06, c.hw - 0.06);
        for (const s of [-1, 1]) block(m, "wgEdge", ...(e > 0 ? [L - 0.1, L + 0.08] as const : [-L - 0.08, -L + 0.1] as const), c.sill + 0.01, c.chord - 0.01, ...side(s, c.hw - 0.08, c.postHw + 0.02));
        // the top chord across the end
        block(m, "wgEdge", ...(e > 0 ? [L - 0.12, L + 0.08] as const : [-L - 0.08, -L + 0.12] as const), c.chord, c.top, -c.chordHw, c.chordHw);
      });
    brakeWheel(m, 1, L + 0.07, -0.85, 2.35);
    for (const s of [-1, 1]) m.scope(s > 0 ? "right side" : "left side", () => c70Side(m, s));
  });
  m.scope("load", () => {
    // the coal heaped to a ridge over the top chord
    const q: Ring = [[-c.hw + 0.04, c.floor], [c.hw - 0.04, c.floor], [c.hw - 0.04, c.top - 0.06], [0.5, c.top + 0.22], [-0.5, c.top + 0.22], [-c.hw + 0.04, c.top - 0.06]];
    m.sweep("wgLoad", "x", q, -L + 0.05, q, L - 0.05);
  });
  m.scope("trucks", () => {
    m.scope("front truck", () => k6Bogie(m, c.centre));
    m.scope("rear truck", () => k6Bogie(m, -c.centre));
  });
  for (const e of [1, -1]) coupler(m, e, L - 0.5, c.face);
}

function c70Side(m: MeshBuilder, s: number): void {
  const c = C70;
  const L = c.body;
  const X = (u: number) => s * u;
  sideBlock(m, "wgBody", s, -L, L, c.sill, c.chord, c.hw - 0.03, c.hw);
  m.scope("top chord", () => {
    sideBlock(m, "wgEdge", s, -L - 0.08, L + 0.08, c.chord, c.top, c.hw - 0.06, c.chordHw);
    sideBlock(m, "wgBody", s, -L, L, c.chord - 0.05, c.chord, c.hw - 0.01, c.chordHw - 0.03);
  });
  m.scope("side sill", () => sideBlock(m, "wgBody", s, -L, L, c.sill, c.sillTop, c.hw - 0.01, c.hw + 0.06));
  m.scope("stakes", () => {
    for (const u of c.posts.slice(1, -1)) sideBlock(m, "wgEdge", s, X(u - 0.045), X(u + 0.045), c.sill + 0.01, c.chord - 0.05, c.hw - 0.02, c.postHw);
  });
  m.scope("bottom doors", () => {
    const [y0, y1] = c.doorY;
    for (let i = 0; i + 1 < c.posts.length; i++) {
      const a = c.posts[i]!, b = c.posts[i + 1]!;
      if (a === -0.91) continue;
      // the end bays' doors stand next to the inner stake
      const dc = i === 0 ? b - 0.12 - c.doorW / 2 : i === c.posts.length - 2 ? a + 0.12 + c.doorW / 2 : (a + b) / 2;
      const d0 = dc - c.doorW / 2, d1 = dc + c.doorW / 2;
      sideBlock(m, "wgBody", s, X(d0 + 0.01), X(d1 - 0.01), y0 + 0.03, y1 - 0.01, c.hw - 0.01, c.hw + 0.012);
      // the raised rim and the two straps hinged at the top, their lugs and latches
      for (const [p, q] of [[d0, d0 + 0.05], [d1 - 0.05, d1]] as const) sideBlock(m, "wgEdge", s, X(p), X(q), y0 + 0.02, y1, c.hw, c.hw + 0.03);
      for (const [p, q] of [[y0 + 0.02, y0 + 0.07], [y1 - 0.05, y1]] as const) sideBlock(m, "wgEdge", s, X(d0), X(d1), p, q, c.hw, c.hw + 0.03);
      for (const f of [0.17, 0.83]) {
        const u = d0 + f * c.doorW;
        sideBlock(m, "wgEdge", s, X(u - 0.025), X(u + 0.025), y0 - 0.02, y1 + 0.05, c.hw + 0.01, c.hw + 0.045);
        sideBlock(m, "wgEdge", s, X(u - 0.055), X(u + 0.055), y1 + 0.02, y1 + 0.1, c.hw - 0.02, c.hw + 0.06);
        sideBlock(m, "wgEdge", s, X(u - 0.06), X(u + 0.06), y0 - 0.06, y0 + 0.04, c.hw + 0.04, c.hw + 0.08);
      }
      // the pressed A-brace above the door
      for (const [lo, hi] of [[d0 - 0.08, dc - 0.09], [d1 + 0.08, dc + 0.09]] as const) sideStrip(m, "wgEdge", s, lo, y1 + 0.02, hi, c.chord - 0.04, 0.06, c.hw - 0.02, c.hw + 0.025);
    }
  });
  m.scope("side doors", () => {
    const dy0 = c.sillTop - 0.06, dy1 = c.chord - 0.06;
    for (const e of [-1, 1]) {
      const [a, b] = e < 0 ? [-0.86, -0.012] : [0.012, 0.86];
      sideBlock(m, "wgEdge", s, X(a), X(b), dy0, dy1, c.hw - 0.02, c.hw + 0.02);
      // the leaf's pressed panel and its hinges on the outer edge
      sideBlock(m, "wgBody", s, X(a + 0.1), X(b - 0.1), dy0 + 0.18, dy1 - 0.16, c.hw + 0.01, c.hw + 0.035);
      const uh = e < 0 ? -0.875 : 0.875;
      for (const y of [1.25, 2.0, 2.7]) sideBlock(m, "wgBody", s, X(uh - 0.04), X(uh + 0.04), y - 0.07, y + 0.07, c.hw, c.hw + 0.06);
    }
    // the locking bar down the middle
    m.rod("wgDark", [0, dy0 + 0.05, s * (c.hw + 0.04)], [0, dy1 - 0.05, s * (c.hw + 0.04)], 0.02, 6);
    for (const y of [dy0 + 0.3, dy1 - 0.3]) sideBlock(m, "wgDark", s, -0.1, 0.1, y - 0.03, y + 0.03, c.hw + 0.02, c.hw + 0.05);
  });
  ladder(m, s, 6.43, 6.66, 0.5, c.chord - 0.05, c.hw, c.postHw + 0.035);
  m.scope("lettering", () => {
    const z = c.hw + 0.004;
    sideText(m, "wgInk", "C70", s, z, X(-6.38), 2.78, 0.2);
    sideText(m, "wgInk", "16", s, z, X(-6.38), 2.2, 0.22);
    sideText(m, "wgInk", c.number.slice(2), s, z, X(-5.455), 2.2, 0.2);
    sideEmblem(m, "wgInk", s, z, -5.455, 2.68, 0.13);
    sideLines(m, s, z, 5.455, 2.98, 0.09, ["70t", "23.6t", "77m", "1.3"]);
    sideText(m, "wgInk", `C70 ${c.number}`, s, c.hw + 0.064, 0, c.sill + 0.02, 0.07);
    // the end numbers: 1 at the hand brake's end (+X), 2 at the other
    sideText(m, "wgInk", "2", s, z, -L + 0.2, 1.0, 0.1);
    sideText(m, "wgInk", "1", s, z, L - 0.2, 1.0, 0.1);
  });
}

// ---------------------------------------------------------------------------
// The P70 covered wagon

/** The P70's arched roof over the eaves: (z, y) from one eave over the ridge to the other, radius r out. */
function p70Arc(off: number, n = 12): Array<[number, number]> {
  const p = P70;
  const R = (p.hw * p.hw + p.rise * p.rise) / (2 * p.rise);
  const cy = p.eaves + p.rise - R;
  const a0 = Math.asin(p.hw / R);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const a = -a0 + (2 * a0 * i) / n;
    pts.push([(R + off) * Math.sin(a), cy + (R + off) * Math.cos(a)]);
  }
  return pts;
}

/** The roof's height over z (the arch's outer face). */
function p70RoofY(z: number): number {
  const p = P70;
  const R = (p.hw * p.hw + p.rise * p.rise) / (2 * p.rise);
  return p.eaves + p.rise - R + Math.sqrt(R * R - z * z);
}

function buildP70(m: MeshBuilder): void {
  const p = P70;
  const L = p.body;
  underframe(m, L - 0.02, p.hw, p.floor, p.centre, p.sill);
  m.scope("body", () => {
    // the shell: the sides to the eaves and the arch, closed by the arched end walls
    const arc = p70Arc(0);
    const shell: Ring = [[-p.hw, p.sill], [p.hw, p.sill], ...[...arc].reverse().map(([z, y]) => [z, y] as [number, number])];
    // the arc runs from -hw to +hw; the ring goes round: bottom left, bottom right, up the right side over to the left
    m.sweep("wgBody", "x", shell, -L, shell, L);
    m.scope("roof", () => {
      const roof: Ring = [[-p.hw - 0.05, p.eaves - 0.04], [p.hw + 0.05, p.eaves - 0.04], ...p70Arc(0.03).reverse().map(([z, y]) => [z * (p.hw + 0.05) / p.hw, y] as [number, number])];
      m.sweep("wgBody", "x", roof, -L - 0.07, roof, L + 0.07);
      // a transverse rib over every post pitch
      const rib = p70Arc(0.03, 10);
      for (let k = -8; k <= 8; k++) {
        const x = k * p.pitch;
        if (Math.abs(x) > L - 0.1) continue;
        for (let i = 0; i + 1 < rib.length; i++) {
          const [z0, y0] = rib[i]!, [z1, y1] = rib[i + 1]!;
          const nz0 = z0 * (p.hw + 0.05) / p.hw, nz1 = z1 * (p.hw + 0.05) / p.hw;
          const q: Ring = [[y0 - 0.005, nz0], [y1 - 0.005, nz1], [y1 + 0.035, nz1 * 1.012], [y0 + 0.035, nz0 * 1.012]];
          m.sweep("wgEdge", "x", q.map(([y, z]) => [z, y] as [number, number]), x - 0.035, q.map(([y, z]) => [z, y] as [number, number]), x + 0.035);
        }
      }
      // the round caps on the ridge
      for (const x of p.caps) {
        const y = p.eaves + p.rise + 0.02;
        m.loft("wgBody", ngon(12, 0.2, 0, x, 0), y, ngon(12, 0.16, 0, x, 0), y + 0.07);
      }
      // the handrail over the brake end's roof
      const xr = L - 0.25, yr = p70RoofY(0.45);
      m.rod("handrail", [xr, yr, -0.45], [xr, yr + 0.12, -0.4], 0.014, 5);
      m.rod("handrail", [xr, yr + 0.12, -0.4], [xr, yr + 0.12, 0.4], 0.014, 5);
      m.rod("handrail", [xr, yr + 0.12, 0.4], [xr, yr, 0.45], 0.014, 5);
    });
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front end" : "rear end", () => {
        const [a, b] = e > 0 ? [L, L + 0.06] as const : [-L - 0.06, -L] as const;
        for (const z of [-1.0, -0.35, 0.35, 1.0]) block(m, "wgEdge", a, b, p.sill + 0.14, p70RoofY(Math.abs(z) + 0.06) - 0.08, z - 0.06, z + 0.06);
        for (const sd of [-1, 1]) block(m, "wgBody", ...(e > 0 ? [L - 0.06, L + 0.07] as const : [-L - 0.07, -L + 0.06] as const), p.sill, p.eaves, ...side(sd, p.hw - 0.08, p.postHw));
        block(m, "underframe", ...(e > 0 ? [L, L + 0.08] as const : [-L - 0.08, -L] as const), p.sill - 0.05, p.sill + 0.12, -p.hw, p.hw);
      });
    brakeWheel(m, 1, L + 0.06, -0.68, 3.0);
    m.scope("brake step", () => {
      block(m, "wgDark", L + 0.06, L + 0.19, 2.18, 2.22, -1.2, -0.25);
      m.rod("wgDark", [L + 0.19, 2.2, -1.2], [L + 0.07, 1.9, -1.2], 0.015, 5);
    });
    for (const s of [-1, 1]) m.scope(s > 0 ? "right side" : "left side", () => p70Side(m, s));
  });
  m.scope("trucks", () => {
    m.scope("front truck", () => k6Bogie(m, p.centre));
    m.scope("rear truck", () => k6Bogie(m, -p.centre));
  });
  for (const e of [1, -1]) coupler(m, e, L - 0.5, p.face);
}

function p70Side(m: MeshBuilder, s: number): void {
  const p = P70;
  const L = p.body;
  const X = (u: number) => s * u;
  const posts: number[] = [];
  for (let i = 0; i <= 7; i++) posts.push(-L + i * p.pitch);
  for (let i = 0; i <= 7; i++) posts.push(p.door + i * p.pitch);
  const vents = new Set([1, 4, 9, 12]);
  // the load marks' bay keeps its lower ribs only
  const plain = new Set([10]);
  m.scope("eaves", () => sideBlock(m, "wgBody", s, -L - 0.02, L + 0.02, p.eaves - 0.1, p.eaves - 0.02, p.hw - 0.01, p.hw + 0.04));
  m.scope("side sill", () => sideBlock(m, "wgBody", s, -L, L, p.sill, p.sill + 0.1, p.hw - 0.01, p.hw + 0.05));
  m.scope("posts", () => {
    for (const u of posts) {
      if (Math.abs(Math.abs(u) - L) < 1e-6) continue;
      const w = Math.abs(Math.abs(u) - p.door) < 1e-6 ? 0.05 : 0.06;
      sideBlock(m, "wgEdge", s, X(u - w), X(u + w), p.sill + 0.01, p.eaves - 0.08, p.hw - 0.02, p.postHw);
    }
  });
  m.scope("panels", () => {
    for (let i = 0; i < 14; i++) {
      const a = posts[i < 7 ? i : i + 1]!, b = posts[i < 7 ? i + 1 : i + 2]!;
      const vent = vents.has(i);
      for (const y of vent || plain.has(i) ? [1.77, 2.37] : [1.77, 2.37, 2.97, 3.55]) sideBlock(m, "wgEdge", s, X(a + 0.08), X(b - 0.08), y - 0.03, y + 0.03, p.hw - 0.02, p.hw + 0.018);
      if (vent)
        m.scope("vent", () => {
          const v0 = a + 0.1, v1 = b - 0.1;
          sideBlock(m, "wgBody", s, X(v0), X(v1), 2.95, 3.62, p.hw - 0.01, p.hw + 0.03);
          sideBlock(m, "wgBody", s, X(v0 + 0.05), X(v1 - 0.05), 3.0, 3.56, p.hw + 0.02, p.hw + 0.05);
          sideBlock(m, "wgEdge", s, X(v0 - 0.02), X(v1 + 0.02), 3.62, 3.68, p.hw - 0.02, p.hw + 0.07);
          const o = ngon(12, 1, 0).map(([x, z]): Vec3 => [X((v0 + v1) / 2 + x * 0.22), 3.3 + z * 0.13, s * (p.hw + 0.065)]);
          m.slab("wgBody", o, [0, 0, -s * 0.02]);
          for (const u of [v0 + 0.06, v1 - 0.06]) sideBlock(m, "wgDark", s, X(u - 0.02), X(u + 0.02), 2.86, 3.02, p.hw, p.hw + 0.07);
        });
    }
  });
  m.scope("sliding door", () => {
    const d = p.door - 0.04;
    const y0 = p.sill + 0.04, y1 = p.eaves - 0.14;
    sideBlock(m, "wgBody", s, X(-d), X(d), y0, y1, p.hw + 0.02, p.hw + 0.05);
    for (let y = y0 + 0.18; y < y1 - 0.1; y += 0.265) sideBlock(m, "wgEdge", s, X(-d + 0.06), X(d - 0.06), y - 0.04, y + 0.04, p.hw + 0.045, p.hw + 0.085);
    for (const u of [-d, -0.02, d - 0.07]) sideBlock(m, "wgBody", s, X(u), X(u + 0.09), y0, y1, p.hw + 0.05, p.hw + 0.09);
    // the lock bars and handles at the leaves' meeting edges
    for (const u of [-0.12, 0.12]) m.rod("wgDark", [X(u), y0 + 0.2, s * (p.hw + 0.11)], [X(u), y1 - 0.25, s * (p.hw + 0.11)], 0.018, 6);
    for (const y of [1.6, 2.5, 3.4]) sideBlock(m, "wgDark", s, X(-0.2), X(0.2), y - 0.03, y + 0.03, p.hw + 0.08, p.hw + 0.13);
    // the top and bottom tracks, reaching over the bays the leaves open across
    sideBlock(m, "wgDark", s, X(-p.door - 1.75), X(p.door + 1.75), y1, y1 + 0.08, p.hw - 0.025, p.hw + 0.12);
    sideBlock(m, "wgDark", s, X(-p.door - 1.75), X(p.door + 1.75), p.sill - 0.02, p.sill + 0.05, p.hw - 0.025, p.hw + 0.1);
  });
  ladder(m, s, 7.52, 7.84, 0.55, p.eaves - 0.1, p.hw, p.postHw + 0.02);
  m.scope("lettering", () => {
    const z = p.hw + 0.004;
    sideText(m, "wgInk", "P70", s, z, X(-5.95), 3.12, 0.24);
    sideEmblem(m, "wgInk", s, z, -5.0, 3.26, 0.15);
    // the number split by the post, as painted
    sideText(m, "wgInk", p.number.slice(0, 4), s, z, X(-5.925), 2.5, 0.26, 0.15, 0.06);
    sideText(m, "wgInk", p.number.slice(4), s, z, X(-4.975), 2.5, 0.26, 0.15, 0.06);
    sideLines(m, s, z, 5.0, 3.42, 0.1, ["70t", "24.6t", "145m", "1.6"]);
    sideText(m, "wgInk", "P70", s, z, X(4.2), 1.12, 0.14, 0.087, 0.04);
    sideText(m, "wgInk", p.number, s, z, X(4.98), 1.12, 0.13, 0.08, 0.035);
    sideText(m, "wgInk", "2", s, z, -L + 0.3, 1.15, 0.12);
    sideText(m, "wgInk", "1", s, z, L - 0.3, 1.15, 0.12);
  });
}

// ---------------------------------------------------------------------------
// The design's builders

export function buildCnC70(v?: ParamValues): MeshBuilder {
  const unit = resolveParams(WAGON_PARAMS, v).unit as WagonUnit;
  const m = new MeshBuilder(palette(unit));
  if (unit === "open") buildC70(m);
  else buildP70(m);
  return m;
}

export function buildCnC70Lod(v?: ParamValues): MeshBuilder {
  const unit = resolveParams(WAGON_PARAMS, v).unit as WagonUnit;
  const open = unit === "open";
  const L = open ? C70.body : P70.body;
  const y0 = open ? C70.sill : P70.sill;
  const hw = open ? C70.hw + 0.06 : P70.hw + 0.06;
  // the open wagon's coal heaped to its ridge over the top chord
  const side: LodBand[] = open ? [[y0, C70.top, "wgBody"], [C70.top, C70.top + 0.22, "wgLoad"]] : [[y0, P70.eaves + P70.rise, "wgBody"]];
  const body: UnitBody = open
    ? { y0, hw: [[y0, hw], [C70.top, hw], [C70.top + 0.22, 0.5]], side, roof: "wgLoad", front: { tip: [[y0, L]] }, rear: { tip: [[y0, -L]] } }
    : { y0, hw: [[y0, hw], [P70.eaves, hw], [P70.eaves + 0.3, 1.15], [P70.eaves + P70.rise, 0.35]], side, roof: "wgBody", front: { tip: [[y0, L]] }, rear: { tip: [[y0, -L]] } };
  const centre = open ? C70.centre : P70.centre;
  const parts: LodPart[] = [...bogieParts([[centre, 1.15], [-centre, 1.15]], y0), underPart(-centre + 1.2, centre - 1.2, 0.72, y0, 0.3)];
  return fitUnit({ palette: palette(unit), bodies: [body], parts }, 100);
}
