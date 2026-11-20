// The SNCF 141 R "Liberation" Mikado (1'D1' h2, 1,340 built 1945 - 1947 in the USA and
// Canada by Lima, ALCO, Baldwin, Montreal and Canadian Locomotive), with its 30 R tender on
// two cast bogies, drawn on the steam kit (steamLoco.ts) as 141 R 1199 as preserved
// (Baldwin 73048 of 1947, oil-fired, of the 1101 - 1340 batch: Boxpok drivers, cast one-piece
// frame, Kylchap exhaust and the "Nord" smokebox door) from photographs of 1199, 568, 840,
// 1108 and 1244 and a works photograph (assets/sncf-141r/SOURCES.md) and the published
// figures (14.64 m over the engine, 24.13 m with the tender; 1,651 mm drivers, 914 mm pony
// wheels, 1,067 mm tender wheels; 116 t, tender 75 t; 2,150 kW; 100 km/h): the USRA light
// Mikado adapted for France - the boiler on 2.97 m with its conical second course, the
// sand and steam domes, the big Kylchap chimney with the Worthington heater ahead of it,
// the high running board on 2.35 m with its red line, the large smoke deflectors whose upper
// part leans in over the smokebox, the long front deck carrying the cross-compound air
// pump and two round lamps, the red buffer beam lettered "141 R 1199" and the white-faced
// rectangular buffers, the main reservoirs under the board, the aluminium-painted firebox
// throat, the closed American cab with its big two-pane side window and the red-lined
// panels; the tender a tall bunker over the front two thirds dropping in a long round
// shoulder to the lower water space, red-lined, on two cast bogies, the tool box between
// them. 1199 is green with red lining (the SNCF service black is 568's and 840's).
// See docs/models/france-trains.md.
//
// Scales: 141 R 568 (photo-141-r-568-a.jpg), a shallow three-quarter of the right side: the
// four coupled axles fitted projectively (1-D, equal pitch) and the pony and trailing axles
// placed from that fit (pony 1.64 pitches ahead of the first driver, trailing axle 1.59 behind
// the last), the pony wheel 0.914 m = 90 px (98 px/m vertically at the front); 141 R 840
// head-on (photo-141-r-840-longueville.jpg): buffer centres 1.75 m = 318 px (182 px/m) on the
// beam, the smokebox front 1.95 m across, the deflectors' outer faces 3.0 m apart and their
// tops 1.9 m apart; the 568 cab and tender (crop at 3x): cab side 2.0 - 3.95 m with the
// window 3.1 - 3.85 m, the tender's low rear part 1.84 m tall over the sole bar, its front
// bunker 1.36 times that.
//
// Every length is in metres along the locomotive from its front buffer heads (the tender:
// from its own front head, where the engine's drawbar meets it), y up from the rail top.

import { ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import { BUFFER_Y, BUFFER_Z, type Pt, type Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";
import { strokeText } from "./strokeFont.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** 141 R 1199 as preserved: green with red lining, the smokebox and running gear black, the beam red. */
const PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#2d4b37", 0.45),
  black: mat("#171719", 0.75),
  frame: mat("#1c1d1f", 0.75),
  wheel: mat("#1e1f21", 0.6),
  smokebox: { color: "#222326", metallic: 0.2, roughness: 0.55 },
  tyre: { color: "#6a6e73", metallic: 0.35, roughness: 0.45 },
  // the red lining and the buffer beam, an orange red
  red: mat("#c8361f", 0.55),
  beam: mat("#c8361f", 0.6),
  roof: mat("#28432f", 0.6),
  white: mat("#e9e7df", 0.6),
  // the firebox throat's aluminium paint below the running board
  alu: { color: "#a9adb1", metallic: 0.45, roughness: 0.45 },
  brass: { color: "#9c8550", metallic: 0.45, roughness: 0.45 },
  plate: mat("#b3261e", 0.5),
  plateText: { color: "#d9b75e", metallic: 0.5, roughness: 0.35 },
  // the SNCF roundel on the smokebox door: red disc, yellow ring and letters
  roundel: mat("#c22a20", 0.5),
  yellow: mat("#e2b93b", 0.5),
  steel: { color: "#4d5055", metallic: 0.3, roughness: 0.55 },
  doorRing: { color: "#2b2c30", metallic: 0.3, roughness: 0.55 },
  rod: { color: "#8c9196", metallic: 0.4, roughness: 0.4 },
};

const NUMBER = "141 R 1199";

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title and the measures the table lists. */
export const SNCF141R_WORLD: { base: WorldSteam } = {
  base: { top: 4.65, coupler: "buffers", half: 1.5, title: "SNCF 141 R", lead: 1, coupled: 4, trail: 1, leadD: 0.914, coupledD: 1.651, trailD: 1.09, boilerR: 0.94, deflectors: "wagner", domes: 2, palette: { paint: "#2d4b37", wheel: "#1e1f21", frame: "#1c1d1f", smokebox: "#222326" }, tender: { length: 9.49, axles: 4, d: 1.067 }, number: NUMBER },
};

// --- the engine: 14.64 m from the front buffer heads to the drawbar ---

/** The pony axle, the four coupled axles 1.676 m apart (5.03 m), the trailing axle. */
const LEAD = 2.0;
const PITCH = 1.676;
const COUPLED = [4.76, 4.76 + PITCH, 4.76 + 2 * PITCH, 4.76 + 3 * PITCH];
const TRAIL = 12.49;
const END = 14.64;
/** Boiler centre; the smokebox's and front course's radius (top 3.91 m), the rear courses' (top 4.0 m) from the cone. */
const BY = 2.97;
const BR = 0.94;
const BR2 = 1.03;
const CONE = [4.5, 5.6] as const;
/** The running board's top; the front deck behind the beam. */
const RB = 2.35;
const DECK = 1.3;
const SMOKEBOX = [1.55, 3.6] as const;
const CAB0 = 12.0;
const CAB1 = 14.3;

/** The cab's right half section: the side sheets upright from 2.0 m to the eave at 3.95 m, the arched roof to 4.25 m. */
const CAB_HALF: Pt[] = [[1.42, 2.0], [1.42, 3.95], [1.32, 4.1], [0.85, 4.22], [0, 4.25]];
const CAB_FACE = CAB_HALF[0]![0];

/** A polygon of triangles wound so it looks along `out`. */
function face(m: Steam["m"], mt: string, p: Vec3[], out: Vec3): void {
  const [a, b, c] = p as [Vec3, Vec3, Vec3];
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const q = n[0]! * out[0] + n[1]! * out[1] + n[2]! * out[2] < 0 ? [...p].reverse() : p;
  for (let i = 1; i + 1 < q.length; i++) m.tri(mt, q[0]!, q[i]!, q[i + 1]!);
}

/** A strip of lining `w` wide along the (x, y) polyline on side s at |z| = z (a decal looking out), mitred at its corners. */
function lining(t: Steam, s: number, pts: Pt[], w: number, z: number, mt = "red"): void {
  const n = pts.length;
  const normals = pts.slice(1).map((q, i) => {
    const p = pts[i]!;
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    return [-(q[1] - p[1]) / L, (q[0] - p[0]) / L] as Pt;
  });
  const inner = pts.map((p, i): Pt => {
    const a = normals[Math.max(0, i - 1)]!;
    const b = normals[Math.min(n - 2, i)]!;
    const mx = a[0] + b[0], my = a[1] + b[1];
    const k = w / Math.max(0.3, (mx * b[0] + my * b[1]));
    return [p[0] + mx * k, p[1] + my * k];
  });
  const P = ([x, y]: Pt): Vec3 => [t.X(x), y, s * z];
  for (let i = 0; i + 1 < n; i++) face(t.m, mt, [P(pts[i]!), P(pts[i + 1]!), P(inner[i + 1]!), P(inner[i]!)], [0, 0, s]);
}

// --- the smoke deflectors ---

/**
 * The deflectors: the lower plate upright at |z| 1.5 (outer face) from the deck and the running
 * board up to the fold at 3.2 m, its front edge leaning back from 1.5 m at the deck to 1.62 m;
 * the upper plate leaning in from the fold to the top edge at 3.92 m and |z| 1.0 over the
 * smokebox; the rear edge at 4.85 m. 2.5 cm thick.
 */
const DEF = { z: 1.5, t: 0.025, fold: 3.2, top: 3.92, zTop: 1.0, x1: 4.85, front: [1.5, 1.62, 1.72] as const, slope: 2.55 };
/** The lower plate as two convex pieces and their union's outline. */
const DEF_PIECES: Pt[][] = [
  [[DEF.front[0], DECK + 0.015], [DEF.slope, RB + 0.04], [DEF.slope, DEF.fold], [DEF.front[1], DEF.fold]],
  [[DEF.slope, RB + 0.04], [DEF.x1, RB + 0.04], [DEF.x1, DEF.fold], [DEF.slope, DEF.fold]],
];
const DEF_OUTLINE: Pt[] = [[DEF.front[0], DECK + 0.015], [DEF.slope, RB + 0.04], [DEF.x1, RB + 0.04], [DEF.x1, DEF.fold], [DEF.front[1], DEF.fold]];

function deflectors(t: Steam): void {
  const m = t.m;
  m.scope("smoke deflectors", () => {
    for (const s of [-1, 1]) {
      const P = ([x, y]: Pt, z: number): Vec3 => [t.X(x), y, s * z];
      for (const piece of DEF_PIECES) {
        face(m, "paint", piece.map((p) => P(p, DEF.z)), [0, 0, s]);
        face(m, "paint", piece.map((p) => P(p, DEF.z - DEF.t)), [0, 0, -s]);
      }
      // the lower plate's edges, except the fold the upper plate continues from
      const n = DEF_OUTLINE.length;
      for (let i = 0; i < n; i++) {
        const [a, b] = [DEF_OUTLINE[i]!, DEF_OUTLINE[(i + 1) % n]!];
        if (a[1] === DEF.fold && b[1] === DEF.fold) continue;
        const out: Vec3 = [-(b[1] - a[1]), -(b[0] - a[0]), 0];
        face(m, "paint", [P(a, DEF.z), P(b, DEF.z), P(b, DEF.z - DEF.t), P(a, DEF.z - DEF.t)], out);
      }
      // the upper plate leaning in: its outer and inner faces and its three edges
      const lean = Math.hypot(DEF.z - DEF.zTop, DEF.top - DEF.fold);
      const [nz, ny] = [(DEF.top - DEF.fold) / lean, (DEF.z - DEF.zTop) / lean];
      const up = (x: number, y: number, z: number, inset: number): Vec3 => [t.X(x), y - ny * inset, s * (z - nz * inset)];
      const corners = (inset: number): Vec3[] => [up(DEF.front[1], DEF.fold, DEF.z, inset), up(DEF.x1, DEF.fold, DEF.z, inset), up(DEF.x1, DEF.top, DEF.zTop, inset), up(DEF.front[2], DEF.top, DEF.zTop, inset)];
      const [o, i] = [corners(0), corners(DEF.t)];
      face(m, "paint", o, [0, ny, s * nz]);
      face(m, "paint", i, [0, -ny, -s * nz]);
      face(m, "paint", [o[1]!, o[2]!, i[2]!, i[1]!], [-1, 0, 0]);
      face(m, "paint", [o[2]!, o[3]!, i[3]!, i[2]!], [0, 1, 0]);
      face(m, "paint", [o[3]!, o[0]!, i[0]!, i[3]!], [1, 0, 0]);
      // the red line 5 cm inside the lower plate's front and foot, and along the fold
      lining(t, s, [[DEF.x1 - 0.05, RB + 0.11], [DEF.slope + 0.02, RB + 0.11], [DEF.front[0] + 0.07, DECK + 0.1], [DEF.front[1] + 0.05, DEF.fold - 0.05]], 0.025, DEF.z + 0.003);
      lining(t, s, [[DEF.front[1] + 0.06, DEF.fold - 0.05], [DEF.x1 - 0.05, DEF.fold - 0.05]], 0.025, DEF.z + 0.003);
      // the depot's triangular plate
      face(m, "brass", [P([3.45, 2.9], DEF.z + 0.006), P([3.75, 2.9], DEF.z + 0.006), P([3.6, 3.1], DEF.z + 0.006)], [0, 0, s]);
      // the stays from the smokebox to the upper plate
      for (const x of [2.1, 4.3]) m.rod("black", [t.X(x), 3.75, s * 0.72], [t.X(x), 3.75, s * (DEF.zTop + 0.08)], 0.022, 6);
    }
  });
  m.scope("deflector steps", () => {
    // the steps up the inside of the deflectors from the deck to the running board
    for (const s of [-1, 1]) {
      for (const k of [0.25, 0.5, 0.75]) {
        const x = DEF.front[0] + 0.15 + k * (DEF.slope - DEF.front[0] - 0.15);
        const y = DECK + k * (RB - DECK);
        t.sideBox("black", s, x - 0.13, x + 0.13, y - 0.025, y, 1.12, DEF.z - DEF.t - 0.004);
      }
    }
  });
}

// --- the front: beam, buffers, deck, air pump, lamps, smokebox door ---

/** The beam's front face and its depth; the rectangular buffer heads. */
const BEAM = { x: 0.62, depth: 0.16, y0: 0.8, half: 1.45 };
const HEAD = { w: 0.46, h: 0.34, r: 0.09 };

/** A rounded rectangle in (u, v) about (uc, vc), as a ring of points. */
function roundRect(uc: number, vc: number, w: number, h: number, r: number, n = 3): Pt[] {
  const out: Pt[] = [];
  const corners: Array<[number, number, number]> = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 1], [-w / 2 + r, -h / 2 + r, 2], [w / 2 - r, -h / 2 + r, 3]];
  for (const [cu, cv, q] of corners) for (let i = 0; i <= n; i++) {
    const a = ((q + i / n) * Math.PI) / 2;
    out.push([uc + cu + r * Math.cos(a), vc + cv + r * Math.sin(a)]);
  }
  return out;
}

/** Triangles of a convex (u, v) ring, as a fan. */
const fan = (ring: Pt[]): Pt[] => ring.slice(1, -1).flatMap((p, i) => [ring[0]!, p, ring[i + 2]!]);

function frontFacets(t: Steam, mt: string, x: number, tris: Pt[]): void {
  t.m.facets(mt, tris.map(([u, v]): Vec3 => [t.X(x), v, u]), [1, 0, 0]);
}

function front(t: Steam): void {
  const m = t.m;
  m.scope("front draw gear", () => {
    m.scope("buffer beam", () => t.box("beam", BEAM.x, BEAM.x + BEAM.depth, BEAM.y0, DECK - 0.04, -BEAM.half, BEAM.half));
    m.scope("buffers", () => {
      for (const z of [-BUFFER_Z, BUFFER_Z]) {
        t.cylX("black", BEAM.x, 0.24, z, BUFFER_Y, 0.14, 10);
        t.cylX("steel", 0.24, 0.07, z, BUFFER_Y, 0.09, 10);
        // the rectangular head, its face white with the greased black centre
        const ring = roundRect(z, BUFFER_Y, HEAD.w, HEAD.h, HEAD.r);
        m.sweep("black", "x", ring, t.X(0.07), ring, t.X(0.004));
        frontFacets(t, "white", 0.0, fan(ring));
        frontFacets(t, "black", -0.003, fan(ngon(10, 0.11, 0, z, BUFFER_Y).map(([a, b]): Pt => [a * 1.15 - z * 0.15, b])));
      }
    });
    m.scope("coupling", () => {
      t.box("steel", BEAM.x, 0.3, BUFFER_Y - 0.06, BUFFER_Y + 0.06, -0.06, 0.06);
      t.box("steel", 0.3, 0.22, BUFFER_Y - 0.25, BUFFER_Y + 0.06, -0.035, 0.035);
      // the brake and heating hoses either side of the hook
      for (const z of [-0.32, 0.32]) m.rod("black", [t.X(BEAM.x - 0.01), 0.95, z], [t.X(0.35), 0.62, z * 1.1], 0.03, 6);
    });
    m.scope("beam lettering", () => {
      // "141 R" on the right of the hook, "1199" on the left, white, as on 1199 and 840
      const h = 0.13;
      const [w, gap] = [h * 0.55, h * 0.2];
      const y = BUFFER_Y - h / 2 + 0.02;
      const xs = BEAM.x - 0.004;
      frontFacets(t, "white", xs, strokeText("141 R", 0.6, y, h, w, gap, true));
      frontFacets(t, "white", xs, strokeText("1199", -0.17, y, h, w, gap, true));
      // the white square with the class figure at the right end
      const sq = 1.24;
      frontFacets(t, "white", xs, fan([[sq + 0.08, y - 0.03], [sq - 0.08, y - 0.03], [sq - 0.08, y + h + 0.03], [sq + 0.08, y + h + 0.03]]));
      frontFacets(t, "beam", xs - 0.003, fan([[sq + 0.06, y - 0.01], [sq - 0.06, y - 0.01], [sq - 0.06, y + h + 0.01], [sq + 0.06, y + h + 0.01]]));
      frontFacets(t, "white", xs - 0.006, strokeText("3", sq + w / 2, y + 0.01, h * 0.85, w * 0.85, gap, true));
    });
  });
  m.scope("front deck", () => {
    // the deck on the beam, from the beam to the smokebox, and the frames' front under it
    t.box("black", BEAM.x + 0.002, SMOKEBOX[0] + 0.3, DECK - 0.04, DECK, -BEAM.half, BEAM.half);
    t.box("frame", BEAM.x + BEAM.depth, SMOKEBOX[0] + 0.5, 0.72, DECK - 0.04, -0.62, 0.62);
  });
  m.scope("air pump", () => {
    // the cross-compound air pump on the deck's right, and the box beside it
    const [x, z] = [1.08, 0.66];
    t.cylY("black", x, z, DECK, 2.6, 0.22, 12, false);
    m.loft("black", ngon(12, 0.22, 0, t.X(x), z), 2.6, ngon(12, 0.1, 0, t.X(x), z), 2.78, true);
    t.cylX("black", x - 0.24, x + 0.24, z, 1.75, 0.05, 6);
    t.box("black", 0.9, 1.4, DECK, 2.1, 0.0, 0.42);
    t.box("black", 0.86, 0.9, 1.62, 1.82, 0.12, 0.3);
  });
  m.scope("lamps", () => {
    // the two round lamps on the deck's corners
    for (const z of [-1.08, 1.08]) {
      t.box("black", 0.82, 1.0, DECK, DECK + 0.1, z - 0.07, z + 0.07);
      t.cylX("black", 0.8, 1.04, z, DECK + 0.27, 0.17, 12);
      const lens = ngon(12, 0.14, 0, z, DECK + 0.27);
      m.sweep("lampHead", "x", lens, t.X(0.8) - 0.006, lens, t.X(0.8) + 0.004);
    }
  });
  m.scope("smokebox front", () => {
    // the front plate's ring of bolts, the door with its two dogs and the roundel
    m.tube("doorRing", "x", 0, BY, BR + 0.05, BR * 0.86, t.X(SMOKEBOX[0]) - 0.01, t.X(SMOKEBOX[0]) + 0.04, 24);
    const X = t.X(SMOKEBOX[0]) + 0.07;
    // the dogs: a bar across the door over its centre, a second from the centre down to the hinge side
    m.rod("steel", [X + 0.02, BY + 0.24, 0.8], [X + 0.02, BY + 0.3, -0.86], 0.025, 6);
    m.rod("steel", [X + 0.02, BY - 0.12, -0.1], [X + 0.02, BY - 0.6, -0.68], 0.025, 6);
    const disc = ngon(16, 0.19, 0, 0, BY + 0.05);
    // ahead of the kit's dart handle, which it hides
    m.sweep("yellow", "x", disc, X + 0.035, disc, X + 0.055);
    const inner = ngon(16, 0.16, 0, 0, BY + 0.05);
    m.sweep("roundel", "x", inner, X + 0.055, inner, X + 0.061);
    // the lifting lug at the top and the hand wheel at the left
    t.box("smokebox", SMOKEBOX[0] - 0.03, SMOKEBOX[0] + 0.05, BY + BR - 0.02, BY + BR + 0.12, -0.05, 0.05);
    t.cylX("roundel", SMOKEBOX[0] - 0.12, SMOKEBOX[0] - 0.08, 0.62, BY + 0.02, 0.06, 8);
  });
  m.scope("heater", () => {
    // the Worthington mixing heater in the smokebox top, ahead of the chimney
    t.box("smokebox", 1.65, 2.18, BY + BR - 0.1, BY + BR + 0.15, -0.38, 0.38);
    t.cylX("smokebox", 1.62, 2.2, 0, BY + BR + 0.15, 0.3, 10);
  });
}

// --- the rest of the engine ---

/** The barrel's radius at source x. */
const barrelR = (x: number): number => (x <= CONE[0] ? BR : x >= CONE[1] ? BR2 : BR + ((x - CONE[0]) / (CONE[1] - CONE[0])) * (BR2 - BR));

function rearCourses(t: Steam): void {
  const m = t.m;
  const n = 24;
  const ring = (r: number) => ngon(n, r, Math.PI / n, 0, BY);
  m.scope("rear courses", () => {
    m.sweep("paint", "x", ring(BR - 0.005), t.X(CONE[0]), ring(BR2), t.X(CONE[1]), false);
    t.cylX("paint", CONE[1], CAB0, 0, BY, BR2, n, false);
  });
  m.scope("boiler seams", () => {
    // the courses' joints, thin raised rings
    for (const x of [CONE[0], CONE[1], 8.9]) t.cylX("paint", x - 0.02, x + 0.02, 0, BY, barrelR(x) + 0.01, n, false);
  });
}

function engineExtras(t: Steam): void {
  const m = t.m;
  deflectors(t);
  front(t);
  rearCourses(t);
  m.scope("running board line", () => {
    // the red line along the board's green valance and up its front slope
    for (const s of [-1, 1]) lining(t, s, [[DEF.x1, RB - 0.05], [CAB0 + 0.02, RB - 0.05]], 0.04, 1.5 + 0.001);
  });
  m.scope("boiler pipes", () => {
    // the feed and steam pipes along the barrel's flanks, above the running board
    for (const s of [-1, 1]) {
      t.cylX("black", DEF.x1, CAB0 - 0.05, s * 1.04, RB + 0.12, 0.05, 6);
      t.cylX("paint", DEF.x1 + 0.3, CAB0 - 0.05, s * 0.98, RB + 0.3, 0.035, 6);
    }
    // the dry pipe from the steam dome down to the smokebox's right side
    m.rod("paint", [t.X(7.6), BY + 0.75, 0.55], [t.X(3.4), BY - 0.1, 0.98], 0.06, 8);
    m.rod("paint", [t.X(7.6), BY + 0.75, -0.55], [t.X(3.4), BY - 0.1, -0.98], 0.06, 8);
  });
  m.scope("reservoirs", () => {
    // the main air reservoirs under the board, over the coupled wheels
    for (const s of [-1, 1]) t.cylX("paint", 7.2, 10.2, s * 1.13, 1.97, 0.26, 12);
  });
  m.scope("feed pump", () => {
    // the Worthington feed pump under the board ahead of the drivers on the right
    t.cylY("black", 4.3, 1.18, 1.55, RB - 0.07, 0.17, 10);
    t.box("black", 4.05, 4.55, 1.45, 1.6, 1.0, 1.36);
  });
  m.scope("firebox throat", () => {
    // the aluminium-painted side under the board from the last driver to the cab
    for (const s of [-1, 1]) t.sideBox("alu", s, 10.35, CAB0, 1.3, RB - 0.04, 1.04, 1.07);
  });
  m.scope("frame top", () => {
    for (const s of [-1, 1]) t.sideBox("frame", s, DEF.slope, CAB0, RB - 0.22, RB - 0.04, 1.1, 1.14);
  });
  m.scope("generator", () => {
    // the turbo-generator on the smokebox top behind the chimney and the sand dome's pipes
    t.cylX("black", 3.0, 3.45, 0.3, BY + BR + 0.12, 0.13, 10);
    t.box("black", 3.05, 3.4, BY + BR - 0.05, BY + BR + 0.05, 0.2, 0.4);
  });
  m.scope("whistle and turret", () => {
    t.box("paint", CAB0 - 0.7, CAB0 + 0.02, BY + BR2 - 0.12, BY + BR2 + 0.12, -0.38, 0.38);
    t.cylY("brass", CAB0 - 0.25, -0.25, BY + BR2 + 0.08, BY + BR2 + 0.3, 0.04, 8);
  });
  m.scope("cab front windows", () => {
    const X = t.X(CAB0) + 0.006;
    for (const s of [-1, 1]) {
      const q: Vec3[] = [[X, 3.3, s * 1.15], [X, 3.3, s * 1.36], [X, 3.85, s * 1.36], [X, 3.85, s * 1.15]];
      m.slab("glass", q, [-0.02, 0, 0]);
    }
  });
  m.scope("cab lining", () => {
    // the red border of the cab side, round the window and the plate
    for (const s of [-1, 1]) {
      lining(t, s, [[CAB0 + 0.08, 2.08], [CAB0 + 0.08, 3.88], [CAB1 - 0.08, 3.88], [CAB1 - 0.08, 2.08], [CAB0 + 0.08, 2.08]], 0.025, CAB_FACE + 0.003);
    }
  });
  m.scope("numbers", () => {
    // the red cab plate: "SNCF" over the number, brass figures
    for (const s of [-1, 1]) {
      t.sidePlate(s, 13.55, 2.42, NUMBER, CAB_FACE, 0.08);
      t.sidePlate(s, 13.55, 2.6, "SNCF", CAB_FACE, 0.05);
    }
  });
  m.scope("cab steps", () => {
    for (const s of [-1, 1]) {
      for (const y of [0.9, 1.35, 1.8]) t.sideBox("black", s, 13.75, 14.08, y - 0.03, y, 1.25, 1.42);
      for (const x of [13.75, 14.08]) t.sideBox("black", s, x - 0.02, x + 0.02, 0.84, 2.0, 1.25, 1.42);
      m.rod("steel", [t.X(13.96), 2.1, s * 1.47], [t.X(13.96), 3.6, s * 1.47], 0.018, 6);
    }
  });
  m.scope("rear frame", () => {
    // the trailing truck's frame and the ash pan from the last driver up to the cab
    for (const s of [-1, 1]) {
      const q: Vec3[] = [[t.X(10.7), 1.0, s * 0.62], [t.X(10.7), 1.6, s * 0.62], [t.X(14.0), 2.0, s * 0.62], [t.X(14.0), 1.5, s * 0.62]];
      m.slab("frame", q, [0, 0, -s * 0.08]);
    }
  });
  m.scope("turbopump", () => {
    // the Worthington turbopump under the cab's left side
    t.cylX("black", 12.7, 13.4, -1.08, 1.75, 0.16, 10);
  });
  m.scope("rear draw gear", () => {
    // the cast frame's black rear end with the drawbar and the two buffers against the tender
    t.box("frame", END - 0.5, END - 0.34, 0.85, 1.3, -1.2, 1.2);
    t.box("steel", END - 0.34, END, BUFFER_Y - 0.05, BUFFER_Y + 0.05, -0.08, 0.08);
    for (const z of [-0.6, 0.6]) t.cylX("black", END - 0.34, END - 0.02, z, BUFFER_Y, 0.11, 8);
  });
  m.scope("cab roof vent", () => t.box("roof", 12.7, 13.7, 4.28, 4.34, -0.3, 0.3));
}

function engine(): LocoSpec {
  return {
    title: "SNCF 141 R",
    palette: PALETTE,
    heads: [0, END],
    // the front beam and its rectangular buffers are drawn in extras
    beams: { front: false, rear: false, y0: 0.82, y1: 1.3, length: [0.62, 0.34], half: 1.45 },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], n: 24 },
    // the Kylchap chimney, large and short
    chimney: { x: 2.55, top: 4.27, r: 0.33 },
    // the sand dome ahead of the steam dome
    domes: [{ x: 6.9, top: 4.27, r: 0.44, len: 1.2 }, { x: 8.2, top: 4.28, r: 0.42 }],
    valves: { x: 10.9, top: 4.24 },
    handrail: { x0: SMOKEBOX[1] + 0.3, x1: CAB0 - 0.15, y: BY + 0.48 },
    runningBoard: { profile: [[DEF.front[0] - 0.2, DECK], [DEF.front[0], DECK], [DEF.slope, RB], [CAB0 + 0.02, RB]], half: 1.5, valance: 0.12, valanceMat: "paint" },
    frame: { x0: 0.8, x1: COUPLED[3]! + 1.0, top: 2.05 },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 3.95,
      // the big side window in two panes behind the plate
      windows: [{ x0: 13.0, x1: 13.57, y0: 3.1, y1: 3.84 }, { x0: 13.62, x1: 14.18, y0: 3.1, y1: 3.84 }],
    },
    // the wide firebox behind the barrel, over the trailing truck
    prisms: [{ name: "firebox", x0: 10.1, x1: CAB0, half: [[1.12, RB], [1.12, BY + 0.3], [0.95, BY + 0.72], [0.58, BY + 0.95], [0, BY + 1.04]] }],
    bogies: [{ x0: LEAD - 0.6, x1: LEAD + 0.6, y: 0.58 }, { x0: TRAIL - 0.7, x1: TRAIL + 0.7, y: 0.62 }],
    gear: {
      wheels: [
        { x: LEAD, d: 0.914, spokes: 0, outsideBoxes: true },
        // the 1101 - 1340 batch's Boxpok centres
        ...COUPLED.map((x) => ({ x, d: 1.651, spokes: 10, box: true })),
        { x: TRAIL, d: 1.09, spokes: 0, outsideBoxes: true },
      ],
      // two cylinders 597 x 711 mm between the pony and the first driver; the main rods drive the third coupled axle
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 2.55, x1: 3.85, y: 1.0, r: 0.4 }, crank: 0.3555, phase: 0.3, valveGear: true }],
      cylinderZ: 1.1, reference: 1, wheelMaterial: "wheel", cylinderCoverMat: "black",
    },
    lamps: { front: [], rear: [[CAB1 - 0.05, 1.35, 0.7], [CAB1 - 0.05, 1.35, -0.7]] },
    extras: engineExtras,
  };
}

// --- the 30 R tender: 9.49 m over its heads, bogies of 1.75 m ---

const T_AXLES = [1.2, 2.95, 6.3, 8.05];
const T_END = 9.49;
/**
 * The body from 0.4 to 8.85 m, 2.94 m wide on the sole bars at 1.45 m: the bunker over the
 * front two thirds 3.95 m high, its front shoulder rounded, dropping in a long round shoulder
 * to the water space's top at 3.3 m.
 */
const TANK = { x0: 0.4, x1: 8.85, foot: 1.45, top: 3.95, low: 3.3, half: 1.47, shoulder: [0.4, 0.3] as const, drop: [5.75, 6.65] as const };

/** The body's top at source x. */
function tankTop(x: number): number {
  const T = TANK;
  const [fx, fy] = T.shoulder;
  if (x < T.x0 + fx) {
    const k = (T.x0 + fx - x) / fx;
    return T.top - fy + fy * Math.sqrt(Math.max(0, 1 - k * k));
  }
  if (x > T.drop[1]) return T.low;
  if (x > T.drop[0]) {
    const k = (x - T.drop[0]) / (T.drop[1] - T.drop[0]);
    return T.low + (T.top - T.low) * Math.sqrt(Math.max(0, 1 - k * k));
  }
  return T.top;
}

/** The body's (z, y) section at source x: upright sides, the top edges chamfered. */
function tankSection(x: number): Pt[] {
  const T = TANK;
  const top = tankTop(x);
  return [[T.half, T.foot], [T.half, top - 0.07], [T.half - 0.07, top], [-T.half + 0.07, top], [-T.half, top - 0.07], [-T.half, T.foot]];
}

const TANK_XS = [TANK.x0, TANK.x0 + 0.04, TANK.x0 + 0.12, TANK.x0 + 0.22, TANK.x0 + 0.32, TANK.x0 + 0.4, ...[0, 0.3, 0.55, 0.75, 0.9, 1].map((k) => TANK.drop[0] + k * (TANK.drop[1] - TANK.drop[0])), TANK.x1];

function tank(t: Steam): void {
  const m = t.m;
  m.scope("tank", () => {
    for (let i = 0; i + 1 < TANK_XS.length; i++) m.sweep("paint", "x", tankSection(TANK_XS[i]!), t.X(TANK_XS[i]!), tankSection(TANK_XS[i + 1]!), t.X(TANK_XS[i + 1]!), false);
    for (const [x, e] of [[TANK.x0, 1], [TANK.x1, -1]] as const) m.slab("paint", tankSection(x).map(([z, y]): Vec3 => [t.X(x), y, z]), [-e * 0.002, 0, 0]);
  });
}

function tenderExtras(t: Steam): void {
  const m = t.m;
  tank(t);
  m.scope("red lining", () => {
    // the red border of the side, at the height of the water space, and along the bunker's top
    for (const s of [-1, 1]) {
      lining(t, s, [[TANK.x0 + 0.12, TANK.foot + 0.12], [TANK.x0 + 0.12, TANK.low - 0.1], [TANK.x1 - 0.12, TANK.low - 0.1], [TANK.x1 - 0.12, TANK.foot + 0.12], [TANK.x0 + 0.12, TANK.foot + 0.12]], 0.025, TANK.half + 0.003);
      lining(t, s, [[TANK.x0 + 0.45, TANK.top - 0.16], [TANK.drop[0], TANK.top - 0.16]], 0.02, TANK.half + 0.003);
    }
  });
  m.scope("sole bars", () => {
    for (const s of [-1, 1]) t.sideBox("frame", s, 0.3, TANK.x1, 1.12, TANK.foot - 0.01, 1.3, 1.44);
  });
  m.scope("tool box", () => {
    // the box between the bogies
    for (const s of [-1, 1]) t.sideBox("paint", s, 3.95, 4.75, 0.55, 1.11, 0.95, 1.3);
  });
  m.scope("top fittings", () => {
    // the oil bunker's filler, the water filler on the rear deck, the rear rails
    t.cylY("paint", 3.2, 0, TANK.top - 0.02, TANK.top + 0.1, 0.28, 10);
    t.cylY("paint", 7.9, 0, TANK.low - 0.02, TANK.low + 0.14, 0.3, 10);
    for (const z of [-0.5, 0.5]) {
      m.rod("steel", [t.X(8.7), TANK.low - 0.02, z], [t.X(8.7), TANK.low + 0.3, z], 0.02, 6);
      m.rod("steel", [t.X(8.7), TANK.low + 0.3, z], [t.X(8.35), TANK.low + 0.3, z], 0.02, 6);
    }
  });
  m.scope("front", () => {
    // the deck under the cab roof's overhang and the bunker's front lockers
    t.box("black", 0.3, TANK.x0 + 0.01, 2.31, 2.35, -1.42, 1.42);
    t.box("paint", 0.3, TANK.x0 + 0.01, TANK.foot, 2.31, -1.2, 1.2);
    for (const s of [-1, 1]) m.rod("steel", [t.X(0.36), 2.4, s * 1.5], [t.X(0.36), 3.6, s * 1.5], 0.018, 6);
  });
  m.scope("rear ladder", () => {
    for (const z of [-0.3, 0.3]) m.rod("steel", [t.X(TANK.x1 + 0.06), 1.5, z], [t.X(TANK.x1 + 0.06), TANK.low, z], 0.02, 6);
    for (let y = 1.75; y < TANK.low - 0.1; y += 0.35) m.rod("steel", [t.X(TANK.x1 + 0.06), y, -0.3], [t.X(TANK.x1 + 0.06), y, 0.3], 0.016, 6);
  });
  m.scope("numbers", () => {
    for (const s of [-1, 1]) {
      t.sidePlate(s, 3.0, 2.5, "30 R 1199", TANK.half, 0.08);
      t.sidePlate(s, 3.0, 2.68, "SNCF", TANK.half, 0.05);
    }
  });
}

/** The cast bogie side frames: the arched top chord, the axle boxes and the bolster's column. */
function tenderTruck(t: Steam, b: { x0: number; x1: number; y: number }): void {
  const m = t.m;
  const axles = T_AXLES.filter((x) => x > b.x0 && x < b.x1);
  const [a0, a1] = [axles[0]!, axles[1]!];
  const xc = (a0 + a1) / 2;
  for (const s of [-1, 1]) {
    const P = ([x, y]: Pt, z: number): Vec3 => [t.X(x), y, s * z];
    // the top chord over the boxes and the tension member dropping under the bolster
    const pieces: Pt[][] = [
      [[a0 - 0.32, 0.72], [a1 + 0.32, 0.72], [a1 + 0.24, 0.84], [a0 - 0.24, 0.84]],
      [[a0 + 0.12, 0.4], [xc - 0.25, 0.3], [xc - 0.25, 0.44], [a0 + 0.12, 0.56]],
      [[xc + 0.25, 0.3], [a1 - 0.12, 0.4], [a1 - 0.12, 0.56], [xc + 0.25, 0.44]],
    ];
    for (const p of pieces) m.slab("frame", p.map((q) => P(q, 1.04)), [0, 0, -s * 0.06]);
    // the bolster column and the axle boxes
    t.sideBox("frame", s, xc - 0.25, xc + 0.25, 0.3, 0.38, 0.98, 1.06);
    // the bolster's spring nest in the frame's window, bright against the black casting
    for (const dx of [-0.13, 0, 0.13]) t.cylY("steel", xc + dx, s * 1.02, 0.38, 0.66, 0.055, 6);
    t.sideBox("frame", s, xc - 0.25, xc + 0.25, 0.66, 0.84, 0.98, 1.06);
    for (const x of axles) {
      t.sideBox("frame", s, x - 0.14, x + 0.14, 0.38, 0.74, 0.97, 1.09);
      // the roller bearing's end cap
      t.cylZ("steel", x, 0.5 * 1.067 * Math.cos(Math.PI / 24), s > 0 ? 1.09 : -1.12, s > 0 ? 1.12 : -1.09, 0.09, 10);
    }
  }
}

function tender(): LocoSpec {
  return {
    title: "SNCF 141 R tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { y0: 0.82, y1: TANK.foot, length: [0.3, 0.62], half: 1.45 },
    frame: { x0: 0.31, x1: TANK.x1, top: 1.12 },
    bogies: [{ x0: T_AXLES[0]! - 0.6, x1: T_AXLES[1]! + 0.6, y: 0.62 }, { x0: T_AXLES[2]! - 0.6, x1: T_AXLES[3]! + 0.6, y: 0.62 }],
    drawOnTruckFrame: tenderTruck,
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 1.067, spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    // the three rear lamps
    lamps: { front: [], rear: [[TANK.x1 + 0.02, 1.48, 0.85], [TANK.x1 + 0.02, 1.48, -0.85], [TANK.x1 + 0.02, TANK.low - 0.4, 0]] },
    extras: tenderExtras,
  };
}

/** The 141 R's engine or tender spec, by the `unit` parameter's value. */
export function sncf141rSpec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

/** The spec its distant model is drawn from: the deflectors' lower plates, the front beam, the tender as its two heights. */
export function sncf141rLodSpec(unit: string): LocoSpec {
  if (unit === "tender") {
    const s = tender();
    const sec = (top: number): Pt[] => [[TANK.half, TANK.foot], [TANK.half, top - 0.07], [TANK.half - 0.07, top]];
    return { ...s, prisms: [{ name: "bunker", x0: TANK.x0, x1: (TANK.drop[0] + TANK.drop[1]) / 2, half: sec(TANK.top) }, { name: "tank", x0: (TANK.drop[0] + TANK.drop[1]) / 2, x1: TANK.x1, half: sec(TANK.low) }, { name: "sole bars", x0: 0.3, x1: TANK.x1, half: [[1.44, 1.12], [1.44, TANK.foot - 0.01]], mat: "frame" }] };
  }
  const s = engine();
  const cab = { ...s.cab!, half: [[1.42, 2.0], [1.42, 3.95], [0.8, 4.25]] as Pt[] };
  return { ...s, cab, prisms: [], beams: { ...s.beams, front: true, rear: false }, deflectors: { outlines: DEF_PIECES, z: DEF.z - DEF.t } };
}
