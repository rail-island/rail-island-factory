// The CD 163: the Czech Railways class 163 (Skoda 71E) 3 kV DC Bo'Bo' electric
// locomotive, in the classic green livery with the yellow band, numbered 163 244-7.
// Reconstructed from photographs and elevation drawings (assets/cd-163/) and the
// dimensions painted on the locomotive itself: 16.80 m over the buffers, 8.30 m
// between the bogie pivots, 3.20 m bogie wheelbase, 1.25 m wheels; 4.64 m high
// with the pantographs down. See docs/models/vehicles.md.
//
// Metres, +X forward (the "front" cab; the locomotive is symmetric end for end
// but for its markings), +Y up, +Z right, the wheels standing on y = 0 (the top
// of the rail), centred on x = 0 and z = 0. Standard gauge. Rigid: one node.
//
// The body is lofted in plan: horizontal octagons (the cab ends' corners are
// chamfered) stacked in colour bands, the front raked back above and below its nose, the roof a
// hip over the whole body. Windows, lamps and plates are slabs laid on those
// faces, sunk a centimetre into them and standing a centimetre or more proud;
// the lettering and the CD emblem are one-sided decals a few millimetres off
// the plate or the band (docs/models/skyscrapers.md, "Flicker").

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { CatalogFields } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { CD_EMBLEM, triangulate } from "./cdLogo.ts";

/** The catalog fields of a rail vehicle, in place of the road vehicles'. */
export const RAIL_CATALOG: CatalogFields = {
  category: "Rail vehicles",
  group: "loco",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

export const CD163_PALETTE: Record<string, MaterialSpec> = {
  green: { color: "#245b42", metallic: 0.1, roughness: 0.5 },
  yellow: { color: "#c6a84c", metallic: 0.1, roughness: 0.5 },
  roof: { color: "#727773", roughness: 0.7 },
  underframe: { color: "#2a2c2f", roughness: 0.8 },
  bogie: { color: "#3c3e42", roughness: 0.75 },
  spring: { color: "#5a5d62", metallic: 0.2, roughness: 0.6 },
  steel: { color: "#8c9198", metallic: 0.3, roughness: 0.45 },
  wheel: { color: "#46484b", metallic: 0.2, roughness: 0.6 },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  glass: { color: "#24303c", metallic: 0.2, roughness: 0.15 },
  lampHead: { color: "#f3f5f6", roughness: 0.2 },
  lampRed: { color: "#c8202c", roughness: 0.3 },
  plate: { color: "#b3222c", roughness: 0.5 },
  white: { color: "#eeeeee", roughness: 0.5 },
  logo: { color: "#18181a", roughness: 0.6 },
  louvre: { color: "#35383c", roughness: 0.8 },
  slat: { color: "#686c71", roughness: 0.6 },
  insulator: { color: "#8a4a26", roughness: 0.4 },
  pantograph: { color: "#4b4f55", metallic: 0.2, roughness: 0.6 },
  carbon: { color: "#2f3033", roughness: 0.7 },
  copper: { color: "#b0733f", metallic: 0.4, roughness: 0.4 },
};

/** The number on the plates, front and side. */
const NUMBER = "163 244-7";

// --- dimensions -------------------------------------------------------------------

const HALF = 7.9; // the projecting nose at the yellow band's upper edge; buffers reach 8.40
const RAKE = 0.20; // upper setback, from the vlakosimdb side profile
const LOWER_RAKE = 0.10; // lower setback to the apron above the buffer beam
const CH = 0.08; // the cab ends' corner chamfer, in plan
const HW = 1.47; // half the body's width (2.94 m)

const Y_BOTTOM = 1.03; // the body's lower edge
const Y_BAND0 = 1.70; // the yellow band
const Y_BAND1 = 2.30;
const Y_NOSE = Y_BAND1; // both slopes meet here, at the top of the yellow band
const Y_APRON = 1.20; // the lower slope meets the upright chassis skirt
const Y_EAVE = 3.70; // the upper cab profile and structural roof spring
const Y_SIDE_EAVE = 3.50; // grey roof paint extends lower along the sides
const Y_CANT = 3.94;
const Y_ROOF = 4.06;
const CANT_HW = 1.22; // half the width at the top of the cant
const ROOF_HW = 1.0;
const COOLER_X = 2.15; // the raised cooler box over the middle of the machine room
const Y_COOLER = 4.25;
const COOLER_FOOT = 3.30; // the cooler skirt overlaps the upper side wall
const Y_WINDOW0 = 2.58; // the cab's side windows and the door window
const Y_WINDOW1 = 3.32;

const WHEEL_R = 0.625; // 1250 mm wheels
const WHEEL_N = 24;
/** The axle height: a wheel is a 24-gon with a flat side, not a vertex, on the rail. */
const AXLE_Y = WHEEL_R * Math.cos(Math.PI / WHEEL_N);
const BOGIE_X = 4.15; // 8.30 m between the pivots
const HALF_BASE = 1.6; // 3.20 m bogie wheelbase
const PANTO_X = 4.15; // the pantographs stand over the bogies
const PANTO_Y = Y_ROOF + 0.18; // the pantographs' base frames, on their insulators

// --- helpers ----------------------------------------------------------------------

/** `ring` wound the way loft() walls outward: clockwise in (x, z), as ngon() returns. */
function outward(ring: Ring): Ring {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i]!;
    const [x1, z1] = ring[(i + 1) % ring.length]!;
    a += x0 * z1 - x1 * z0;
  }
  return a > 0 ? [...ring].reverse() : ring;
}

/** The body's plan at one height: ends at +-xEnd, sides at +-hw, corners chamfered by c. */
function plan(xEnd: number, hw: number, c: number): Ring {
  return outward([
    [xEnd, -hw + c], [xEnd, hw - c], [xEnd - c, hw], [-xEnd + c, hw],
    [-xEnd, hw - c], [-xEnd, -hw + c], [-xEnd + c, -hw], [xEnd - c, -hw],
  ]);
}

/** Both cab ends project at the band, with upper and lower setbacks. */
function frontX(y: number): number {
  if (y <= Y_APRON) return HALF - LOWER_RAKE;
  if (y <= Y_NOSE) return HALF - LOWER_RAKE * (Y_NOSE - y) / (Y_NOSE - Y_APRON);
  return HALF - RAKE * (y - Y_NOSE) / (Y_EAVE - Y_NOSE);
}

/** The x range a..b (both >= 0) at the end `e` (+1 front, -1 rear), low end first. */
function ex(e: number, a: number, b: number): [number, number] {
  return e > 0 ? [a, b] : [-b, -a];
}

/** Fixed buffer-beam coordinates, independent of the sloping cab skin. */
function face(e: number, d0: number, d1: number): [number, number] {
  return ex(e, HALF + d0, HALF + d1);
}

/** A rectangle u0..u1 x v0..v1 with its corners rounded by r (two segments each). */
function rrect(u0: number, u1: number, v0: number, v1: number, r: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const corners: Array<[number, number, number]> = [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]];
  for (const [cu, cv, a0] of corners) {
    for (const da of [0, 45, 90]) {
      const a = ((a0 + da) * Math.PI) / 180;
      out.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]);
    }
  }
  return out;
}

/** A thin bar from (u0, v0) to (u1, v1), w wide: four corners. */
function bar(u0: number, v0: number, u1: number, v1: number, w: number): Array<[number, number]> {
  const l = Math.hypot(u1 - u0, v1 - v0);
  const [pu, pv] = [(-(v1 - v0) / l) * (w / 2), ((u1 - u0) / l) * (w / 2)];
  return [[u0 + pu, v0 + pv], [u1 + pu, v1 + pv], [u1 - pu, v1 - pv], [u0 - pu, v0 - pv]];
}

/**
 * A surface of the body to lay panels and decals on: `at(u, v, d)` is the point
 * at (u, v) on it, d out along its normal; `n` is that normal.
 */
interface Surface {
  at: (u: number, v: number, d: number) => Vec3;
  n: Vec3;
}

/** The side wall on the side `s`: u is x, v is y. */
function sideWall(s: number): Surface {
  return { at: (u, v, d) => [u, v, s * (HW + d)], n: [0, 0, s] };
}

/** A planar cab face, with dx/dy = slope; u is z and v is height. */
function cabFace(e: number, slope: number): Surface {
  const nx = 1 / Math.hypot(1, slope);
  const ny = -slope * nx;
  return {
    at: (u, v, d) => [e * (HALF + slope * (v - Y_NOSE) + nx * d), v + ny * d, u],
    n: [e * nx, ny, 0],
  };
}

/** The lower cab face slopes inward toward the apron. */
function endFace(e: number): Surface {
  return cabFace(e, LOWER_RAKE / (Y_NOSE - Y_APRON));
}

/** The upper cab face slopes inward toward the eave. */
function windscreenFace(e: number): Surface {
  return cabFace(e, -RAKE / (Y_EAVE - Y_NOSE));
}

/** Buffer heads remain upright, attached to the chassis rather than the cab. */
function bufferFace(e: number): Surface {
  return { at: (u, v, d) => [e * (HALF + d), v, u], n: [e, 0, 0] };
}

/** A convex panel `ring` (u, v) on `f`, from d0 (sunk into it) to d1 (proud of it). */
function panel(m: MeshBuilder, mat: string, f: Surface, ring: Array<[number, number]>, d0: number, d1: number): void {
  const t = d1 - d0;
  m.slab(mat, ring.map(([u, v]) => f.at(u, v, d1)), [-f.n[0] * t, -f.n[1] * t, -f.n[2] * t]);
}

/** Triangles (u, v), three points each, as a one-sided decal on `f`, d off it. */
function decal(m: MeshBuilder, mat: string, f: Surface, tris: Array<[number, number]>, d: number): void {
  m.facets(mat, tris.map(([u, v]) => f.at(u, v, d)), f.n);
}

// The photographed green/yellow locomotives carry the older, upright badge.
// Undo the modern SVG's italic shear and narrow the monogram to the photo's
// approximately 1.27:1 proportions. This is a reconstruction, not a new SVG.
const UPRIGHT_EMBLEM = CD_EMBLEM.map((poly) => poly.map(([u, v]) => [(u - 0.2126 * v) * 0.85, v] as const));
const EMBLEM_LEFT = Math.min(...UPRIGHT_EMBLEM.flat().map(([u]) => u));
const EMBLEM_ASPECT = Math.max(...UPRIGHT_EMBLEM.flat().map(([u]) => u)) - EMBLEM_LEFT;
const EMBLEM_TRIANGLES = UPRIGHT_EMBLEM.map((poly) => triangulate(poly));

/**
 * The CD emblem, `h` high, its lower left corner at (u0, v0) of a surface whose
 * u runs to the reader's right: triangles for decal().
 */
function emblem(u0: number, v0: number, h: number, flipU: boolean): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  UPRIGHT_EMBLEM.forEach((poly, k) => {
    for (const i of EMBLEM_TRIANGLES[k]!) {
      const [rawU, v] = poly[i]!;
      const u = rawU - EMBLEM_LEFT;
      out.push([flipU ? u0 - u * h : u0 + u * h, v0 + v * h]);
    }
  });
  return out;
}

/** The emblem's width at height h. */
const emblemWidth = (h: number): number => EMBLEM_ASPECT * h;

// Condensed painted numerals: connected strokes, curved bowls and diagonal
// legs. Seven-segment digits read as a digital display on the real cast plates.
const DIGITS: Record<string, Array<Array<[number, number]>>> = {
  "0": [[[0.25, 0.06], [0.12, 0.18], [0.12, 0.82], [0.25, 0.94], [0.75, 0.94], [0.88, 0.82], [0.88, 0.18], [0.75, 0.06], [0.25, 0.06]]],
  "1": [[[0.15, 0.77], [0.55, 0.94], [0.55, 0.06]], [[0.18, 0.06], [0.86, 0.06]]],
  "2": [[[0.12, 0.78], [0.12, 0.84], [0.27, 0.94], [0.72, 0.94], [0.88, 0.82], [0.88, 0.65], [0.12, 0.17], [0.12, 0.06], [0.88, 0.06]]],
  "3": [[[0.12, 0.86], [0.27, 0.94], [0.72, 0.94], [0.88, 0.82], [0.88, 0.63], [0.66, 0.51], [0.32, 0.51]], [[0.66, 0.51], [0.88, 0.39], [0.88, 0.18], [0.72, 0.06], [0.27, 0.06], [0.12, 0.16]]],
  "4": [[[0.68, 0.94], [0.12, 0.36], [0.92, 0.36]], [[0.72, 0.94], [0.72, 0.06]]],
  "5": [[[0.88, 0.94], [0.12, 0.94], [0.12, 0.53], [0.72, 0.53], [0.88, 0.41], [0.88, 0.18], [0.72, 0.06], [0.27, 0.06], [0.12, 0.16]]],
  "6": [[[0.85, 0.86], [0.7, 0.94], [0.3, 0.94], [0.12, 0.77], [0.12, 0.18], [0.27, 0.06], [0.72, 0.06], [0.88, 0.18], [0.88, 0.43], [0.72, 0.55], [0.27, 0.55], [0.12, 0.43]]],
  "7": [[[0.12, 0.94], [0.88, 0.94], [0.35, 0.06]]],
  "8": [[[0.27, 0.51], [0.12, 0.64], [0.12, 0.82], [0.27, 0.94], [0.72, 0.94], [0.88, 0.82], [0.88, 0.64], [0.72, 0.51], [0.27, 0.51], [0.12, 0.38], [0.12, 0.18], [0.27, 0.06], [0.72, 0.06], [0.88, 0.18], [0.88, 0.38], [0.72, 0.51]]],
  "9": [[[0.88, 0.57], [0.72, 0.45], [0.27, 0.45], [0.12, 0.57], [0.12, 0.82], [0.27, 0.94], [0.72, 0.94], [0.88, 0.82], [0.88, 0.23], [0.7, 0.06], [0.3, 0.06], [0.15, 0.14]]],
  "-": [[[0.22, 0.5], [0.78, 0.5]]],
};

/** Thin connected numeral strokes on a surface, optionally read toward -u. */
function lettering(text: string, u0: number, v0: number, h: number, w: number, gap: number, flipU: boolean): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  [...text].forEach((ch, i) => {
    const cu = i * (w + gap);
    for (const line of DIGITS[ch] ?? []) {
      for (let j = 1; j < line.length; j++) {
        const [a, b] = line[j - 1]!;
        const [c, d] = line[j]!;
        const q = bar(cu + a * w, b * h, cu + c * w, d * h, h * 0.09);
        for (const k of [0, 1, 2, 0, 2, 3]) {
          const [u, v] = q[k]!;
          out.push([flipU ? u0 - u : u0 + u, v0 + v]);
        }
      }
    }
  });
  return out;
}

/** The width of `text` in lettering(). */
const letteringWidth = (text: string, w: number, gap: number): number => text.length * w + (text.length - 1) * gap;

/** A tube from (x0, y0, z0) to (x1, y1, z1), running mainly along x, its section upright. */
function tubeX(m: MeshBuilder, mat: string, r: number, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, n = 8): void {
  m.sweep(mat, "x", ngon(n, r, 0, z0, y0), x0, ngon(n, r, 0, z1, y1), x1);
}

/** A vertical coil spring: rings of alternating radius, `turns` of them, about (x, z). */
function coil(m: MeshBuilder, mat: string, x: number, z: number, y0: number, y1: number, r: number, turns: number): void {
  const h = (y1 - y0) / (2 * turns + 1);
  for (let i = 0; i <= 2 * turns; i++) {
    const rr = i % 2 === 0 ? r : r * 0.72;
    m.prism(mat, ngon(10, rr, 0, x, z), y0 + i * h, y0 + (i + 1) * h);
  }
}

/** A post insulator standing on y0: a core with `sheds` discs and a steel cap. */
function insulator(m: MeshBuilder, x: number, z: number, y0: number, y1: number, sheds: number): void {
  m.prism("insulator", ngon(8, 0.04, 0, x, z), y0, y1 - 0.03);
  const span = y1 - y0 - 0.1;
  for (let i = 0; i < sheds; i++) {
    const y = y0 + 0.04 + (span * i) / Math.max(1, sheds - 1);
    m.prism("insulator", ngon(10, 0.075, Math.PI / 10, x, z), y, y + 0.018);
  }
  m.prism("steel", ngon(8, 0.05, Math.PI / 8, x, z), y1 - 0.035, y1);
}

// --- the body ---------------------------------------------------------------------

function body(m: MeshBuilder): void {
  m.scope("shell", () => {
    const at = (y: number) => plan(frontX(y), HW, CH);
    m.cap("underframe", at(Y_BOTTOM), Y_BOTTOM, false);
    // Split at the apron, colour boundary and nose: every band follows the
    // same profile, without flattening the lower face into a vertical wall.
    m.loft("green", at(Y_BOTTOM), Y_BOTTOM, at(Y_APRON), Y_APRON, false);
    m.loft("green", at(Y_APRON), Y_APRON, at(Y_BAND0), Y_BAND0, false);
    m.loft("yellow", at(Y_BAND0), Y_BAND0, at(Y_NOSE), Y_NOSE, false);
    m.loft("green", at(Y_NOSE), Y_NOSE, at(Y_EAVE), Y_EAVE, false);
  });
  m.scope("roof", () => {
    const eave = plan(frontX(Y_EAVE), HW, CH);
    const cant = plan(frontX(Y_EAVE) - 0.22, CANT_HW, 0.1);
    m.loft("roof", eave, Y_EAVE, cant, Y_CANT, false);
    m.loft("roof", cant, Y_CANT, plan(frontX(Y_EAVE) - 0.42, ROOF_HW, 0.1), Y_ROOF);
    // The native front retains green above the glazing to 3.70 m, while
    // both side elevations paint the lower roof apron grey from 3.50 m.
    m.scope("side aprons", () => {
      const low = frontX(Y_SIDE_EAVE) - CH;
      const high = frontX(Y_EAVE) - CH;
      for (const s of [-1, 1]) panel(m, "roof", sideWall(s), [
        [-low, Y_SIDE_EAVE], [low, Y_SIDE_EAVE], [high, Y_EAVE], [-high, Y_EAVE],
      ], -0.003, 0.003);
    });
    m.scope("gutters", () => {
      for (const s of [-1, 1]) block(m, "roof", -7.45, 7.45, Y_SIDE_EAVE - 0.035, Y_SIDE_EAVE - 0.005, ...side(s, HW - 0.01, HW + 0.012));
    });
    m.scope("hatch seams", () => {
      for (const x of [-5.4, -3.0, 3.0, 5.4]) block(m, "underframe", x - 0.015, x + 0.015, Y_ROOF - 0.01, Y_ROOF + 0.012, -ROOF_HW + 0.12, ROOF_HW - 0.12);
    });
  });

  // the side walls are ribbed: horizontal pressings at approximately 145 mm pitch, in the colour
  // of the band they sit in, along the machine room and under the cab windows
  m.scope("ribs", () => {
    for (let k = 0; k < 17; k++) {
      const y = Y_BOTTOM + 0.12 + k * 0.145;
      if (y + 0.026 >= Y_SIDE_EAVE - 0.04) continue; // leave the gutter clear
      const mat = y >= Y_BAND0 && y < Y_BAND1 ? "yellow" : "green";
      for (const s of [-1, 1]) {
        const z = side(s, HW - 0.01, HW + 0.018);
        block(m, mat, -6.05, 6.05, y, y + 0.026, ...z);
        if (y < Y_WINDOW0 - 0.1) {
          const end = Math.min(frontX(y), frontX(y + 0.026)) - CH - 0.015;
          for (const e of [-1, 1]) block(m, mat, ...ex(e, 7.18, end), y, y + 0.026, ...z);
        }
      }
    }
  });

  m.scope("portholes", () => {
    for (const x of [-4.95, -3.45, 3.35, 4.85]) {
      for (const s of [1]) {
        const rim = ngon(24, 0.375, 0, x, 2.85);
        const pane = ngon(24, 0.35, 0, x, 2.85);
        const [r0, r1] = side(s, HW - 0.02, HW + 0.024);
        const [p0, p1] = side(s, HW - 0.005, HW + 0.036);
        m.sweep("rubber", "z", rim, r0, rim, r1);
        m.sweep("glass", "z", pane, p0, pane, p1);
      }
    }
  });

  // The opposite machine-room side has continuous intake shutters, not portholes.
  m.scope("machine room intake", () => {
    const wall = sideWall(-1);
    panel(m, "roof", wall, [[-5.80, 2.40], [5.70, 2.40], [5.70, 3.30], [-5.80, 3.30]], -0.018, 0.022);
    panel(m, "louvre", wall, [[-5.74, 2.46], [5.64, 2.46], [5.64, 3.24], [-5.74, 3.24]], 0.008, 0.029);
    for (let i = 0; i < 88; i++) {
      const x = -5.69 + i * 0.129;
      panel(m, "slat", wall, [[x, 2.48], [x + 0.035, 2.48], [x + 0.035, 3.22], [x, 3.22]], 0.016, 0.043);
    }
    for (const x of [-3.95, -1.98, 0, 1.98, 3.95]) {
      block(m, "roof", x - 0.025, x + 0.025, 2.44, 3.26, ...side(-1, HW + 0.01, HW + 0.049));
    }
  });

  m.scope("cant grilles", () => {
    // long grille strips in the roof's cant, between the cooler box and the cabs
    const dz = CANT_HW - HW;
    const dy = Y_CANT - Y_EAVE;
    const l = Math.hypot(dz, dy);
    const [nz, ny] = [dy / l, -dz / l];
    for (const [x0, x1] of [[2.25, 3.85], [4.05, 5.65], [-3.85, -2.25], [-5.65, -4.05]] as const) {
      for (const s of [-1, 1]) {
        // a strip t0..t1 of the way up the slope, d0..d1 off it
        const onCant = (mat: string, t0: number, t1: number, a: number, b: number, d0: number, d1: number) => {
          const p = (t: number, d: number): [number, number] => [s * (HW + dz * t + nz * d), Y_EAVE + dy * t + ny * d];
          const q: Ring = [p(t0, d0), p(t1, d0), p(t1, d1), p(t0, d1)];
          m.sweep(mat, "x", q, a, q, b);
        };
        onCant("louvre", 0.25, 0.75, x0, x1, -0.01, 0.012);
        for (const t of [0.35, 0.55]) onCant("slat", t, t + 0.08, x0 + 0.04, x1 - 0.04, 0.005, 0.028);
      }
    }
  });

  m.scope("cooler box", () => {
    // raised over the middle of the roof, its near-upright sides all grille
    const foot = HW + 0.04;
    const sec: Ring = [[-foot, COOLER_FOOT], [foot, COOLER_FOOT], [foot - 0.04, Y_COOLER - 0.14], [foot - 0.22, Y_COOLER], [-foot + 0.22, Y_COOLER], [-foot + 0.04, Y_COOLER - 0.14]];
    m.sweep("roof", "x", sec, -COOLER_X - 0.05, sec, COOLER_X - 0.05);
    for (const s of [-1, 1]) {
      // the side face, u along x, v from its foot (0) to its top edge (1)
      const [z0, y0, z1, y1] = [s * foot, COOLER_FOOT, s * (foot - 0.04), Y_COOLER - 0.14];
      const l = Math.hypot(z1 - z0, y1 - y0);
      const n: Vec3 = [0, Math.abs(z1 - z0) / l, s * (y1 - y0) / l];
      const wall: Surface = { at: (u, v, d) => [u, y0 + (y1 - y0) * v + n[1] * d, z0 + (z1 - z0) * v + n[2] * d], n };
      for (const [x0, x1] of [[-2.12, -0.11], [0.01, 2.02]] as const) {
        panel(m, "louvre", wall, [[x0, 0.12], [x1, 0.12], [x1, 0.92], [x0, 0.92]], -0.01, 0.012);
        for (let i = 0; i < 8; i++) {
          const v = 0.17 + i * 0.095;
          panel(m, "slat", wall, [[x0 + 0.03, v], [x1 - 0.03, v], [x1 - 0.03, v + 0.035], [x0 + 0.03, v + 0.035]], 0.004, 0.03);
        }
        // the frame's middle post
        const xm = (x0 + x1) / 2;
        panel(m, "roof", wall, [[xm - 0.03, 0.12], [xm + 0.03, 0.12], [xm + 0.03, 0.92], [xm - 0.03, 0.92]], 0.004, 0.035);
      }
    }
  });

  m.scope("side markings", () => {
    for (const s of [-1, 1]) {
      const wall = sideWall(s);
      // read from outside: the reader's right is +x on the right side, -x on the left
      const flip = s < 0;
      m.scope("number plate", () => {
        panel(m, "plate", wall, [[-0.60, 1.90], [0.50, 1.90], [0.50, 2.20], [-0.60, 2.20]], 0.005, 0.026);
        const w = letteringWidth(NUMBER, 0.080, 0.025);
        decal(m, "white", wall, lettering(NUMBER, -0.05 + (flip ? w / 2 : -w / 2), 1.95, 0.20, 0.080, 0.025, flip), 0.03);
      });
      m.scope("emblem", () => {
        const h = 0.40;
        const xc = s > 0 ? -3.90 : -4.10;
        const u0 = flip ? xc + emblemWidth(h) / 2 : xc - emblemWidth(h) / 2;
        decal(m, "logo", wall, emblem(u0, 1.80, h, flip), 0.02);
      });
    }
  });
}

// --- the cabs ---------------------------------------------------------------------

function cab(m: MeshBuilder, e: number): void {
  const front = endFace(e);
  const screen = windscreenFace(e);
  // the reader's right on this end: -z on the front, +z on the rear
  const flip = e > 0;

  m.scope("windscreen", () => {
    for (const s of [-1, 1]) {
      const [f0, f1] = side(s, 0.025, 1.39);
      const [g0, g1] = side(s, 0.070, 1.33);
      const [z0, z1] = side(s, 0.100, 1.30);
      panel(m, "yellow", screen, rrect(f0, f1, 2.63, 3.50, 0.075), -0.01, 0.015);
      panel(m, "rubber", screen, rrect(g0, g1, 2.67, 3.43, 0.060), 0.006, 0.023);
      panel(m, "glass", screen, rrect(z0, z1, 2.70, 3.40, 0.050), 0.012, 0.03);
      // Bottom-mounted wipers: spindle, arm and separate blade.
      panel(m, "rubber", screen, bar(s * 0.42, 2.64, s * 0.62, 3.05, 0.018), 0.035, 0.046);
      panel(m, "rubber", screen, bar(s * 0.38, 2.84, s * 0.96, 3.26, 0.026), 0.035, 0.049);
      panel(m, "steel", screen, bar(s * 0.46, 2.65, s * 1.20, 2.65, 0.022), 0.02, 0.037);
    }
  });

  m.scope("lamps", () => {
    // the twin headlight in the green between the band and the windscreen
    panel(m, "rubber", screen, rrect(-0.30, 0.30, 2.40, 2.60, 0.040), -0.01, 0.05);
    for (const s of [-1, 1]) {
      panel(m, "steel", screen, ngon(20, 0.09, 0, s * 0.11, 2.50), 0.035, 0.060);
      panel(m, "lampHead", screen, ngon(20, 0.085, 0, s * 0.11, 2.50), 0.048, 0.070);
    }
    // a white and a red lamp low on each side, at the number plate's height
    for (const s of [-1, 1]) {
      for (const [z, mat] of [[s * 0.85, "lampHead"], [s * 1.25, "lampRed"]] as const) {
        // Both marker colours use the same housing and lens. Leave a green
        // margin below the band, and only a small gap above the buffer heads.
        const rim = ngon(16, 0.15, 0, z, 1.50);
        const lens = ngon(16, 0.100, 0, z, 1.50);
        panel(m, "rubber", front, rim, -0.01, 0.025);
        panel(m, mat, front, lens, 0.0, 0.037);
      }
    }
  });

  m.scope("front handrails", () => {
    for (const s of [-1, 1]) {
      panel(m, "steel", front, bar(s * 1.24, 1.79, s * 1.24, 2.20, 0.025), 0.035, 0.06);
      panel(m, "steel", front, bar(s * 1.24, 2.20, s * 1.12, 2.23, 0.025), 0.035, 0.06);
    }
  });

  m.scope("front markings", () => {
    m.scope("number plate", () => {
      panel(m, "steel", front, rrect(-0.52, 0.52, 1.38, 1.72, 0.018), -0.016, 0.014);
      panel(m, "plate", front, rrect(-0.50, 0.50, 1.40, 1.70, 0.01), 0.006, 0.024);
      const w = letteringWidth(NUMBER, 0.073, 0.022);
      decal(m, "white", front, lettering(NUMBER, flip ? w / 2 : -w / 2, 1.45, 0.20, 0.073, 0.022, flip), 0.028);
    });
    m.scope("emblem", () => {
      const h = 0.40;
      const u0 = flip ? emblemWidth(h) / 2 : -emblemWidth(h) / 2;
      decal(m, "logo", front, emblem(u0, 1.80, h, flip), 0.006);
    });
  });

  for (const s of [-1, 1]) {
    m.scope(s > 0 ? "right side" : "left side", () => {
      const wall = sideWall(s);
      const z = (d0: number, d1: number) => side(s, HW + d0, HW + d1);
      const xs = (a: number, b: number): [number, number] => ex(e, a, b);
      m.scope("side window", () => {
        // The leading edge follows the cab rake. A rectangular pane here
        // would project beyond the chamfered shell at its upper front corner.
        const profile = (points: Array<[number, number]>) => points.map(([x, y]): [number, number] => [e * x, y]);
        panel(m, "rubber", wall, profile([[7.07, 2.57], [7.73, 2.57], [7.73, 2.64], [7.63, 3.33], [7.07, 3.33]]), -0.01, 0.012);
        panel(m, "glass", wall, profile([[7.10, 2.60], [7.70, 2.60], [7.70, 2.65], [7.60, 3.30], [7.10, 3.30]]), -0.005, 0.024);
      });
      m.scope("door", () => {
        block(m, "rubber", ...xs(6.35, 7.05), 1.40, 3.40, ...z(-0.01, 0.012)); // the gap around it
        block(m, "green", ...xs(6.38, 7.02), 1.43, Y_BAND0, ...z(-0.005, 0.024));
        block(m, "yellow", ...xs(6.38, 7.02), Y_BAND0, Y_BAND1, ...z(-0.005, 0.024));
        block(m, "green", ...xs(6.38, 7.02), Y_BAND1, 3.37, ...z(-0.005, 0.024));
        panel(m, "rubber", wall, rrect(...xs(6.42, 6.98), Y_WINDOW0 - 0.01, Y_WINDOW1 + 0.01, 0.025), 0.01, 0.034);
        panel(m, "glass", wall, rrect(...xs(6.45, 6.95), Y_WINDOW0 + 0.02, Y_WINDOW1 - 0.02, 0.015), 0.015, 0.046);
        block(m, "steel", ...xs(6.91, 6.99), 1.97, 2.01, ...z(0.02, 0.05)); // the handle
        block(m, "underframe", ...xs(6.47, 6.93), 1.14, 1.3, ...z(-0.01, 0.012)); // the foothold below it
      });
      m.scope("cab number", () => {
        // the cab's number, white, just inboard of the door's handrail
        const xc = 6.07 * e;
        decal(m, "white", wall, lettering(e > 0 ? "2" : "1", s < 0 ? xc + 0.04 : xc - 0.04, 3.12, 0.14, 0.08, 0, s < 0), 0.016);
      });
      m.scope("handrails", () => {
        for (const x of [6.28, 7.12]) {
          m.prism("steel", ngon(6, 0.018, 0, e * x, s * (HW + 0.055)), 1.4, 3.38);
          for (const y of [1.43, 3.31]) block(m, "steel", ...xs(x - 0.015, x + 0.015), y, y + 0.026, ...z(-0.01, 0.06));
        }
      });
      m.scope("steps", () => {
        for (const x of [6.43, 6.94]) block(m, "underframe", ...xs(x, x + 0.03), 0.42, Y_BOTTOM + 0.02, ...z(-0.17, -0.11));
        for (const y of [0.45, 0.76]) {
          block(m, "steel", ...xs(6.46, 6.94), y, y + 0.035, ...z(-0.25, -0.07));
          block(m, "yellow", ...xs(6.46, 6.94), y - 0.005, y + 0.04, ...z(-0.07, -0.055));
        }
      });
    });
  }

  m.scope("roof box", () => {
    // over the cab, nearly the roof's width, two grilles in its end face
    const [x0, x1] = ex(e, 6.0, 7.12);
    block(m, "roof", x0, x1, Y_ROOF - 0.01, Y_ROOF + 0.26, -0.86, 0.86);
    const endX = e * 7.12;
    for (const s of [-1, 1]) {
      const [z0, z1] = side(s, 0.08, 0.72);
      block(m, "louvre", ...(e > 0 ? [endX - 0.01, endX + 0.012] : [endX - 0.012, endX + 0.01]) as [number, number], Y_ROOF + 0.05, Y_ROOF + 0.22, z0, z1);
      for (let i = 0; i < 4; i++) {
        const y = Y_ROOF + 0.075 + i * 0.037;
        block(m, "slat", ...(e > 0 ? [endX + 0.005, endX + 0.03] : [endX - 0.03, endX - 0.005]) as [number, number], y, y + 0.016, z0 + 0.02, z1 - 0.02);
      }
    }
  });
  m.scope("horns", () => {
    for (const z of [-0.3, 0.3]) {
      block(m, "underframe", ...ex(e, 6.5, 6.58), Y_ROOF + 0.25, Y_ROOF + 0.32, z - 0.04, z + 0.04);
      const [a, b] = ex(e, 6.52, 6.7);
      const narrow = ngon(8, 0.025, 0, z, Y_ROOF + 0.35);
      const bell = ngon(8, 0.06, 0, z, Y_ROOF + 0.35);
      m.sweep("steel", "x", e > 0 ? narrow : bell, a, e > 0 ? bell : narrow, b);
    }
  });

  m.scope("buffer beam", () => {
    block(m, "underframe", ...face(e, -0.12, 0.1), 0.8, Y_BOTTOM + 0.02, -1.32, 1.32);
    m.scope("buffers", () => {
      for (const z of [-0.875, 0.875]) {
        const housing = ngon(12, 0.12, 0, z, 1.00);
        const plunger = ngon(12, 0.085, 0, z, 1.00);
        const [h0, h1] = face(e, 0.09, 0.32);
        const [p0, p1] = face(e, 0.31, 0.44);
        m.sweep("underframe", "x", housing, h0, housing, h1);
        m.sweep("steel", "x", plunger, p0, plunger, p1);
        panel(m, "underframe", bufferFace(e), rrect(z - 0.35, z + 0.35, 0.80, 1.20, 0.065), 0.43, 0.5);
      }
    });
    m.scope("coupling", () => {
      block(m, "underframe", ...face(e, 0.1, 0.48), 1.0, 1.12, -0.045, 0.045);
      block(m, "steel", ...face(e, 0.36, 0.46), 0.82, 1.0, -0.1, 0.1);
    });
    m.scope("hoses", () => {
      for (const [z, mat] of [[-0.32, "lampRed"], [0.32, "lampRed"], [-0.55, "yellow"], [0.55, "yellow"]] as const) {
        m.prism("rubber", ngon(6, 0.025, 0, e * (HALF + 0.2), z), 0.7, 1.0);
        block(m, mat, ...face(e, 0.17, 0.23), 0.98, 1.04, z - 0.03, z + 0.03);
      }
    });
  });

  m.scope("track clearers", () => {
    // Low snow ploughs: the cutting edge leads the top by 170 mm, giving
    // a visible rearward lean of about 24 degrees from vertical.
    const q: Ring = [[e * 7.95, 0.10], [e * 7.99, 0.10], [e * 7.82, 0.50], [e * 7.78, 0.50]];
    for (const s of [-1, 1]) {
      const [z0, z1] = side(s, 0.40, 1.40);
      m.sweep("yellow", "z", q, z0, q, z1);
      block(m, "underframe", ...face(e, -0.1, -0.04), 0.46, 0.82, ...side(s, 0.68, 0.78));
    }
  });

  m.scope("air reservoir", () => {
    const tank = ngon(16, 0.25, 0, e * 7.0, 0.66);
    m.sweep("steel", "z", tank, -1.15, tank, 1.15);
    const strap = ngon(16, 0.262, 0, e * 7.0, 0.66);
    for (const z of [-0.7, 0.7]) m.sweep("underframe", "z", strap, z - 0.03, strap, z + 0.03);
  });
}

// --- the running gear ---------------------------------------------------------------

function bogie(m: MeshBuilder, xb: number): void {
  for (const dx of [-HALF_BASE, HALF_BASE]) {
    const ax = xb + dx;
    m.scope("wheelset", () => {
      const axle = ngon(10, 0.085, 0, ax, AXLE_Y);
      m.sweep("steel", "z", axle, -1.0, axle, 1.0);
      for (const s of [-1, 1]) {
        const tread = ngon(WHEEL_N, WHEEL_R, Math.PI / WHEEL_N, ax, AXLE_Y);
        const disc = ngon(20, 0.5, 0, ax, AXLE_Y);
        const hub = ngon(12, 0.17, 0, ax, AXLE_Y);
        const box = ngon(12, 0.16, Math.PI / 12, ax, AXLE_Y);
        const sweepZ = (mat: string, ring: Ring, a: number, b: number) => {
          const [z0, z1] = side(s, a, b);
          m.sweep(mat, "z", ring, z0, ring, z1);
        };
        sweepZ("steel", tread, 0.665, 0.8);
        sweepZ("wheel", disc, 0.7, 0.812);
        sweepZ("bogie", hub, 0.8, 0.86);
        // the axle box outside the wheel, with its arms and primary springs
        sweepZ("bogie", box, 0.85, 1.05);
        block(m, "bogie", ax - 0.2, ax + 0.2, AXLE_Y + 0.05, AXLE_Y + 0.2, ...side(s, 0.88, 1.03));
        block(m, "bogie", ax - 0.44, ax + 0.44, AXLE_Y - 0.1, AXLE_Y - 0.02, ...side(s, 0.9, 1.02));
        for (const sx of [-0.34, 0.34]) coil(m, "spring", ax + sx, s * 0.96, AXLE_Y - 0.02, 0.86, 0.075, 3);
      }
      // the traction motor, hung toward the bogie's centre
      const motor = ngon(14, 0.36, 0, ax - Math.sign(dx) * 0.62, 0.62);
      m.sweep("bogie", "z", motor, -0.5, motor, 0.5);
    });
  }
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      block(m, "bogie", xb - 2.05, xb + 2.05, 0.84, 0.98, ...side(s, 0.9, 1.08)); // the side frame
      block(m, "bogie", xb - 0.5, xb + 0.5, 0.36, 0.85, ...side(s, 0.92, 1.06)); // its dropped centre
      block(m, "bogie", xb - 0.5, xb + 0.5, 0.29, 0.37, ...side(s, 0.95, 1.36)); // the spring plank
    }
    for (const x of [xb - 0.45, xb + 0.45]) block(m, "bogie", x - 0.08, x + 0.08, 0.68, 0.88, -0.92, 0.92); // transoms
    for (const x of [xb - 2.0, xb + 2.0]) block(m, "bogie", x - 0.05, x + 0.05, 0.72, 0.92, -1.0, 1.0); // headstocks
  });
  m.scope("secondary suspension", () => {
    for (const s of [-1, 1]) {
      for (const sx of [-0.3, 0.3]) coil(m, "spring", xb + sx, s * 1.2, 0.37, 0.97, 0.13, 6);
      block(m, "underframe", xb - 0.55, xb + 0.55, 0.96, Y_BOTTOM + 0.02, ...side(s, 1.0, 1.42)); // the body's bracket
    }
  });
  m.scope("sandboxes", () => {
    for (const ox of [-1, 1]) {
      const x = xb + ox * 2.36;
      for (const s of [-1, 1]) {
        block(m, "bogie", x - 0.1, x + 0.1, 0.55, 0.92, ...side(s, 0.6, 0.9));
        m.prism("underframe", ngon(6, 0.02, 0, x - ox * 0.06, s * 0.73), 0.1, 0.57);
      }
    }
  });
}

function underframe(m: MeshBuilder): void {
  m.scope("air tanks", () => {
    for (const z of [-0.5, 0.5]) {
      const tank = ngon(14, 0.21, 0, z, 0.7);
      m.sweep("steel", "x", tank, -1.5, tank, 1.5);
      const strap = ngon(14, 0.222, 0, z, 0.7);
      for (const x of [-1.0, 1.0]) m.sweep("underframe", "x", strap, x - 0.03, strap, x + 0.03);
    }
  });
  m.scope("equipment boxes", () => {
    for (const s of [-1, 1]) {
      for (const [x0, x1] of [[-1.45, -0.15], [0.15, 1.45]] as const) {
        block(m, "underframe", x0, x1, 0.52, Y_BOTTOM + 0.02, ...side(s, 0.85, 1.38));
        block(m, "bogie", x0 + 0.05, x1 - 0.05, 0.58, 0.98, ...side(s, 1.37, 1.395)); // the lid
      }
    }
  });
}

// --- the roof equipment --------------------------------------------------------------

/** A single-arm pantograph, folded down, its base centred at xc; `h` points to its hinge end. */
function pantograph(m: MeshBuilder, xc: number, h: number): void {
  const y = PANTO_Y;
  m.scope("insulators", () => {
    for (const dx of [-0.55, 0.55]) for (const z of [-0.48, 0.48]) insulator(m, xc + dx, z, Y_ROOF - 0.01, y, 3);
  });
  m.scope("base", () => {
    for (const z of [-0.48, 0.48]) block(m, "pantograph", xc - 0.7, xc + 0.7, y, y + 0.06, z - 0.03, z + 0.03);
    for (const dx of [-0.62, 0.62]) block(m, "pantograph", xc + dx - 0.03, xc + dx + 0.03, y - 0.005, y + 0.055, -0.51, 0.51);
    block(m, "pantograph", ...ex(h, 0.1, 0.45).map((v) => v + xc) as [number, number], y + 0.05, y + 0.16, -0.15, 0.15); // the drive
  });
  const xh = xc + h * 0.55; // the hinge
  const kx = xc - h * 1.05; // the knee, folded toward the middle of the roof
  const hx = xc + h * 0.15; // the head
  m.scope("arms", () => {
    for (const s of [-1, 1]) block(m, "pantograph", xh - 0.04, xh + 0.04, y + 0.04, y + 0.14, ...side(s, 0.36, 0.44));
    const shaft = ngon(8, 0.035, 0, xh, y + 0.11);
    m.sweep("pantograph", "z", shaft, -0.42, shaft, 0.42);
    // the lower arm: an A-frame from the hinge shaft to the knee
    for (const s of [-1, 1]) tubeX(m, "pantograph", 0.04, xh, y + 0.11, s * 0.3, kx, y + 0.22, s * 0.04);
    tubeX(m, "pantograph", 0.016, xc + h * 0.68, y + 0.08, 0, kx + h * 0.1, y + 0.19, 0, 6); // the push rod
    const knee = ngon(8, 0.05, 0, kx, y + 0.225);
    m.sweep("pantograph", "z", knee, -0.08, knee, 0.08);
    // the upper arm: two tubes spreading from the knee to the head
    for (const s of [-1, 1]) tubeX(m, "pantograph", 0.026, kx, y + 0.24, s * 0.04, hx, y + 0.33, s * 0.32);
  });
  m.scope("head", () => {
    for (const s of [-1, 1]) block(m, "pantograph", hx - 0.15, hx + 0.15, y + 0.325, y + 0.355, ...side(s, 0.28, 0.36));
    for (const dx of [-0.12, 0.12]) {
      const x = hx + dx;
      block(m, "carbon", x - 0.03, x + 0.03, y + 0.35, y + 0.4, -0.62, 0.62);
      for (const s of [-1, 1]) {
        // the horns bend down at both ends of the collector strip
        const top: Ring = [[x - 0.03, y + 0.35], [x + 0.03, y + 0.35], [x + 0.03, y + 0.4], [x - 0.03, y + 0.4]];
        const tip: Ring = [[x - 0.02, y + 0.26], [x + 0.02, y + 0.26], [x + 0.02, y + 0.3], [x - 0.02, y + 0.3]];
        m.sweep("pantograph", "z", s > 0 ? top : tip, s > 0 ? 0.61 : -0.92, s > 0 ? tip : top, s > 0 ? 0.92 : -0.61);
      }
    }
  });
}

function roofEquipment(m: MeshBuilder): void {
  m.scope("pantographs", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => pantograph(m, e * PANTO_X, e));
  });
  m.scope("high-voltage line", () => {
    // from pantograph to pantograph along one side of the roof, clear of the
    // folded arms, over the cooler box on post insulators
    const y = Y_COOLER + 0.19;
    const z = -0.62;
    for (const x of [-2.9, 2.9]) insulator(m, x, z, Y_ROOF - 0.01, y - 0.02, 3);
    for (const x of [-1.2, 1.2]) insulator(m, x, z, Y_COOLER - 0.01, y - 0.02, 2);
    for (const e of [-1, 1]) {
      tubeX(m, "copper", 0.022, e * 0.3, y, z, e * (PANTO_X - 0.62), y, z, 6);
      m.prism("copper", ngon(6, 0.022, 0, e * (PANTO_X - 0.62), z), PANTO_Y + 0.05, y + 0.02); // down to the base frame
    }
    m.scope("main breaker", () => {
      block(m, "pantograph", -0.35, 0.35, Y_COOLER - 0.01, Y_COOLER + 0.06, z - 0.25, z + 0.25);
      for (const x of [-0.18, 0.18]) insulator(m, x, z, Y_COOLER + 0.05, y + 0.02, 2);
      block(m, "steel", -0.32, 0.32, y - 0.01, y + 0.03, z - 0.04, z + 0.04);
    });
  });
}

export function cd163(): MeshBuilder {
  const m = new MeshBuilder(CD163_PALETTE);
  m.scope("body", () => body(m));
  for (const e of [-1, 1]) m.scope(e > 0 ? "front cab" : "rear cab", () => cab(m, e));
  m.scope("roof equipment", () => roofEquipment(m));
  m.scope("bogies", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => bogie(m, e * BOGIE_X));
  });
  m.scope("underframe", () => underframe(m));
  return m;
}
