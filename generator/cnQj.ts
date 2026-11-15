// The China Railways QJ (Qianjin, 1'E1' h2), the Datong-built heavy freight
// 2-10-2, with its six-axle tender on two three-axle bogies, drawn on the steam
// kit (steamLoco.ts) from the dimensioned works diagram (16,140 mm over the
// couplers, axles 1,615 + 2,870 + 4 x 1,600 + 3,050 + 2,205 mm, wheels 920 /
// 1,500 / 1,120 mm) and photographs of QJ 2204, 6200, 7081, 1043, 1997 and two
// Jitong engines in Iowa (assets/cr-qj/SOURCES.md): the boiler on 3.02 m with the
// long smokebox, the big ribbed smoke deflectors whose tops curl in over the
// smokebox, the long casing along the boiler top over the mixing feed-water
// heater, the chimney, the sand box and the steam dome, the high running board on
// 2.6 m with its white edge, the air reservoir under it, the closed cab with its
// side windows and door, the red front plate ("QJ", the railway's emblem and the
// number) over the red buffer beam and slatted pilot, the knuckle couplers, red
// drivers with white tyres and white boiler bands; the tender a tall box with
// the coal space on its front two thirds, red sole bars and the emblem on its
// sides. See docs/models/world-steam.md and docs/models/china-trains.md.
//
// Every length is in metres along the locomotive from its front coupler face
// (the tender: from its own front head, where the engine's drawbar ends), y up
// from the rail top.

import { ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import { mirrored, type Pt, type Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { knuckleCoupler } from "./usHoodKit.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** Black upper works and frames, red drivers, beams, front plate and sole bars, white tyres, bands and edges. */
const PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#1d1e20", 0.55),
  black: mat("#18181a", 0.75),
  frame: mat("#1f2022", 0.75),
  smokebox: mat("#1c1d22", 0.85),
  // the drivers' red centres; the carrying wheels' dark discs
  wheel: mat("#b3261e", 0.6),
  carrier: mat("#26272a", 0.7),
  // the tyres painted white on their faces, as every photograph shows them
  tyre: mat("#dedcd4", 0.55),
  red: mat("#b3261e", 0.6),
  beam: mat("#b3261e", 0.6),
  white: mat("#e6e4dc", 0.55),
  roof: mat("#2a2b2e", 0.8),
  // the deflectors' sheet a little lighter and glossier than the boiler, so its pressed ribs read as in the photographs
  sheet: mat("#34373c", 0.35),
  doorRing: { color: "#45484d", metallic: 0.35, roughness: 0.5 },
  // the safety valves and whistle dark, not brass
  brass: { color: "#4a4c50", metallic: 0.35, roughness: 0.5 },
  // the cab-side number plate: red with white figures
  plate: mat("#b3261e", 0.5),
  plateText: mat("#ecebe6", 0.45),
  // the small plate on the smokebox door: black with white figures
  doorPlate: mat("#141416", 0.5),
  coal: { color: "#3a3b3e", metallic: 0.15, roughness: 0.6 },
  steel: { color: "#3e4146", metallic: 0.3, roughness: 0.55 },
  knuckle: mat("#2e2f31", 0.7),
  handrail: mat("#e6e4dc", 0.55),
};

const NUMBER = "QJ 2204";

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title and the measures the table lists. */
export const QJ_WORLD: { base: WorldSteam } = {
  base: { top: 4.79, coupler: "knuckle", half: 1.56, title: "CR QJ", lead: 1, coupled: 5, trail: 1, leadD: 0.92, coupledD: 1.5, trailD: 1.12, boilerR: 1.13, deflectors: "wagner", domes: 1, palette: { paint: "#1d1e20", wheel: "#b3261e", frame: "#1f2022", smokebox: "#1c1d22" }, tender: { length: 13.04, axles: 6, d: 1.0 }, number: NUMBER },
};

// --- the engine: the works diagram, 16,140 mm over the front coupler and the drawbar ---

/** The leading axle, the five coupled axles 1.6 m apart, the trailing axle. */
const LEAD = 1.615;
const COUPLED = [4.485, 6.085, 7.685, 9.285, 10.885];
const TRAIL = 13.935;
/** The drawbar's end: the tender's front head meets it (29,181 mm with the six-axle tender). */
const END = 16.14;
/** Boiler centre and radius over the lagging (barrel top 4.15 m); the running board's top. */
const BY = 3.02;
const BR = 1.13;
const RB = 2.6;
/** The smokebox from its front ring to the deflectors' rear edge. */
const SMOKEBOX = [0.85, 4.0] as const;
/** The cab from its front wall to the rear wall, which stands 0.5 m over the tender's front deck. */
const CAB0 = 14.2;
const CAB1 = 16.65;
/** The cab's right half section: the sheets from 2.0 m, the round roof from 4.0 m to 4.53 m. */
const CAB_HALF: Pt[] = [[1.56, 2.0], [1.56, 4.0], [1.42, 4.3], [0.95, 4.47], [0, 4.53]];
const CAB_SEC: Pt[] = mirrored(CAB_HALF);

/** A face of triangles wound so it looks along `out` (model axes). */
function face(m: Steam["m"], mt: string, p: Vec3[], out: Vec3): void {
  const [a, b, c] = p as [Vec3, Vec3, Vec3];
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const q = n[0]! * out[0] + n[1]! * out[1] + n[2]! * out[2] < 0 ? [...p].reverse() : p;
  for (let i = 1; i + 1 < q.length; i++) m.tri(mt, q[0]!, q[i]!, q[i + 1]!);
}

// --- the smoke deflectors ---

/**
 * The deflector plates: upright at |z| 1.48 (outer face) from the front edge at
 * 0.65 m back to 4.2 m, their bottom edge rising from 1.55 m at the front to the
 * running board's 2.5 m at 2.1 m; from 4.05 m their tops curl in over the
 * smokebox on a 0.4 m radius, through 130 degrees, to an inner lip at |z| 0.82,
 * 4.36 m high (top 4.45 m). In side view the curl's front corner is rounded on
 * the same radius.
 */
const DEF = { x0: 0.65, x1: 4.2, z: 1.48, t: 0.025, curl: 4.05, R: 0.4, sweep: (130 * Math.PI) / 180, foot: [[0.65, 1.55], [2.1, 2.5]] as Pt[] };
const DEF_X = [0.65, 0.68, 0.73, 0.8, 0.88, 0.96, 1.05, 2.1, 4.2];
const ARC = 7;

const defBottom = (x: number): number => {
  const [[xa, ya], [xb, yb]] = DEF.foot as [Pt, Pt];
  return x >= xb ? yb : ya + ((x - xa) / (xb - xa)) * (yb - ya);
};

/** How much of the curl a station carries: the front corner rounded in side view. */
const curlShare = (x: number): number => {
  const d = DEF.x0 + DEF.R - x;
  return d <= 0 ? 1 : Math.max(0.12, Math.sqrt(Math.max(0, 1 - (d / DEF.R) ** 2)));
};

/** A station's outer (|z|, y) polyline bottom to lip, and the matching inner one. */
function defSection(x: number, inner: boolean): Pt[] {
  const k = inner ? DEF.t : 0;
  const zc = DEF.z - DEF.R;
  const phi = DEF.sweep * curlShare(x);
  const pts: Pt[] = [[DEF.z - k, defBottom(x)], [DEF.z - k, DEF.curl]];
  for (let i = 1; i <= ARC; i++) {
    const a = (phi * i) / ARC;
    pts.push([zc + (DEF.R - k) * Math.cos(a), DEF.curl + (DEF.R - k) * Math.sin(a)]);
  }
  return pts;
}

/** The deflectors' outline in side view (for the distant model): their foot, front, rounded top. */
function defOutline(): Pt[] {
  const top = DEF.curl + DEF.R;
  const front: Pt[] = DEF_X.filter((x) => x <= DEF.x0 + DEF.R + 1e-6).map((x): Pt => [x, DEF.curl + DEF.R * curlShare(x)]);
  return [[DEF.x0, defBottom(DEF.x0)], ...front, [DEF.x1, top], [DEF.x1, DEF.foot[1]![1]], [DEF.foot[1]![0], DEF.foot[1]![1]]];
}

function deflectors(t: Steam): void {
  const m = t.m;
  m.scope("smoke deflectors", () => {
    for (const s of [-1, 1]) {
      const P = (x: number, [z, y]: Pt): Vec3 => [t.X(x), y, s * z];
      const outs = DEF_X.map((x) => defSection(x, false));
      const ins = DEF_X.map((x) => defSection(x, true));
      for (let i = 0; i + 1 < DEF_X.length; i++) {
        const [xa, xb] = [DEF_X[i]!, DEF_X[i + 1]!];
        const [oa, ob, ia, ib] = [outs[i]!, outs[i + 1]!, ins[i]!, ins[i + 1]!];
        for (let j = 0; j + 1 < oa.length; j++) {
          // the outward normal of this strip in (|z|, y): the polyline turned clockwise
          const [dz, dy] = [oa[j + 1]![0] - oa[j]![0], oa[j + 1]![1] - oa[j]![1]];
          const out: Vec3 = [0, -dz, s * dy];
          face(m, "sheet", [P(xa, oa[j]!), P(xb, ob[j]!), P(xb, ob[j + 1]!), P(xa, oa[j + 1]!)], out);
          face(m, "sheet", [P(xa, ia[j]!), P(xb, ib[j]!), P(xb, ib[j + 1]!), P(xa, ia[j + 1]!)], [0, dz, -s * dy]);
        }
        // the foot and the lip
        const n = oa.length - 1;
        face(m, "sheet", [P(xa, oa[0]!), P(xb, ob[0]!), P(xb, ib[0]!), P(xa, ia[0]!)], [0, -1, 0]);
        face(m, "sheet", [P(xa, oa[n]!), P(xb, ob[n]!), P(xb, ib[n]!), P(xa, ia[n]!)], [0, -Math.sin(DEF.sweep), s * Math.cos(DEF.sweep)]);
      }
      // the front and rear edges
      for (const [k, e] of [[0, 1], [DEF_X.length - 1, -1]] as const) {
        const [o, i] = [outs[k]!, ins[k]!];
        for (let j = 0; j + 1 < o.length; j++) face(m, "sheet", [P(DEF_X[k]!, o[j]!), P(DEF_X[k]!, o[j + 1]!), P(DEF_X[k]!, i[j + 1]!), P(DEF_X[k]!, i[j]!)], [e, 0, 0]);
      }
      // the horizontal ribs pressed into the plate, 2 cm proud
      for (let y = 2.62; y < DEF.curl - 0.05; y += 0.2) {
        const xa = Math.max(DEF.x0 + 0.08, y < DEF.foot[1]![1] ? 0 : DEF.x0 + 0.08);
        t.sideBox("paint", s, xa, DEF.x1 - 0.06, y - 0.022, y + 0.022, DEF.z - 0.01, DEF.z + 0.02);
      }
      for (let y = 1.82; y < DEF.foot[1]![1]; y += 0.2) {
        // the low front part's ribs, back to where the foot rises over them
        const xb = DEF.foot[0]![0] + ((y - 0.05 - DEF.foot[0]![1]) / (DEF.foot[1]![1] - DEF.foot[0]![1])) * (DEF.foot[1]![0] - DEF.foot[0]![0]);
        if (xb > DEF.x0 + 0.3) t.sideBox("paint", s, DEF.x0 + 0.08, xb, y - 0.022, y + 0.022, DEF.z - 0.01, DEF.z + 0.02);
      }
      // the stays holding the plate to the smokebox
      for (const x of [1.6, 3.6]) t.sideBox("paint", s, x - 0.03, x + 0.03, 3.37, 3.43, 1.05, DEF.z - 0.01);
      // the white handrail inside the front edge
      m.rod("white", [t.X(0.72), 1.7, s * 1.36], [t.X(0.72), 3.9, s * 1.36], 0.022, 6);
      for (const y of [1.85, 2.8, 3.75]) t.sideBox("white", s, 0.7, 0.74, y - 0.015, y + 0.015, 1.36, DEF.z - 0.01);
    }
  });
}

// --- the long casing along the boiler top ---

/** The casing over the feed-water heater, chimney, sand box and steam dome: 0.94 m wide, its top 4.7 m, from 1.7 m to 8.7 m, its rear end rounded down. */
const CASING = { x0: 1.7, x1: 8.7, top: 4.7, half: 0.47, foot: 3.9, corner: 0.12, rearR: 0.4 };

function casingSection(top: number): Pt[] {
  const { half, foot, corner } = CASING;
  const c = Math.min(corner, (top - foot) / 2);
  const right: Pt[] = [[half, foot]];
  for (let i = 0; i <= 3; i++) {
    const a = (i / 3) * (Math.PI / 2);
    right.push([half - c + c * Math.cos(a), top - c + c * Math.sin(a)]);
  }
  return [...right, ...[...right].reverse().map(([z, y]): Pt => [-z, y])].filter((p, i, all) => i === 0 || Math.abs(p[0] - all[i - 1]![0]) > 1e-9 || Math.abs(p[1] - all[i - 1]![1]) > 1e-9);
}

function casing(t: Steam): void {
  const m = t.m;
  const { x1, top, rearR } = CASING;
  const xs = [CASING.x0, x1 - rearR, x1 - rearR * 0.6, x1 - rearR * 0.3, x1 - rearR * 0.08, x1];
  const topAt = (x: number) => (x <= x1 - rearR ? top : top - rearR + Math.sqrt(Math.max(0, rearR * rearR - (x - (x1 - rearR)) ** 2)));
  m.scope("top casing", () => {
    for (let i = 0; i + 1 < xs.length; i++) m.sweep("paint", "x", casingSection(topAt(xs[i]!)), t.X(xs[i]!), casingSection(topAt(xs[i + 1]!)), t.X(xs[i + 1]!), false);
    for (const [x, e] of [[CASING.x0, 1], [x1, -1]] as const) m.slab("paint", casingSection(topAt(x)).map(([z, y]): Vec3 => [t.X(x), y, z]), [-e * 0.002, 0, 0]);
    // the hand rail along the casing top over the heater
    for (const s of [-1, 1]) m.rod("steel", [t.X(1.9), top + 0.1, s * 0.3], [t.X(3.4), top + 0.1, s * 0.3], 0.02, 6);
    for (const x of [1.95, 3.35]) for (const s of [-1, 1]) m.rod("steel", [t.X(x), top - 0.02, s * 0.3], [t.X(x), top + 0.1, s * 0.3], 0.02, 6);
  });
}

// --- the front: smokebox door fittings, the red plate, beam, pilot and coupler ---

/** Text and the emblem as triangles in (u, v), on the plane at source x looking forward, reading from +z toward -z. */
function frontFacets(t: Steam, mt: string, x: number, tris: Array<[number, number]>): void {
  t.m.facets(mt, tris.map(([u, v]): Vec3 => [t.X(x), v, u]), [1, 0, 0]);
}

/** A quad as two triangles in (u, v). */
const quadUV = (u0: number, v0: number, u1: number, v1: number): Array<[number, number]> => [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]];

/**
 * The railway's emblem in (u, v) about (uc, vc), r its radius: a ring round a
 * rail's section (head, web, foot) under a small chevron, the form of the CR
 * badge seen from a few metres.
 */
function emblem(uc: number, vc: number, r: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const n = 18;
  const w = r * 0.16;
  for (let i = 0; i < n; i++) {
    const [a, b] = [(i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2];
    const p = (q: number, rr: number): [number, number] => [uc + rr * Math.cos(q), vc + rr * Math.sin(q)];
    out.push(p(a, r), p(b, r), p(b, r - w), p(a, r), p(b, r - w), p(a, r - w));
  }
  // the rail: head, web and foot
  out.push(...quadUV(uc - r * 0.34, vc + r * 0.1, uc + r * 0.34, vc + r * 0.3));
  out.push(...quadUV(uc - r * 0.08, vc - r * 0.5, uc + r * 0.08, vc + r * 0.1));
  out.push(...quadUV(uc - r * 0.5, vc - r * 0.66, uc + r * 0.5, vc - r * 0.5));
  // the chevron above the head
  out.push([uc - r * 0.42, vc + r * 0.42], [uc + r * 0.42, vc + r * 0.42], [uc, vc + r * 0.72]);
  return out;
}

/** The red front plate's lettering: "QJ", the emblem and the number, for QJ 2204's "Qianjin" (in Chinese characters), emblem, "2204". */
const PLATE = { x: 0.62, z: 0.97, y0: 1.42, y1: 2.12 };

function front(t: Steam): void {
  const m = t.m;
  m.scope("front plate", () => {
    // the frame end behind the plate, from the beam up to the smokebox
    t.box("black", PLATE.x, 0.9, 1.3, PLATE.y1 - 0.03, -PLATE.z + 0.02, PLATE.z - 0.02);
    t.endPanel("red", 1, PLATE.x, -PLATE.z, PLATE.z, PLATE.y0, PLATE.y1);
    const h = 0.26;
    const [w, gap] = [h * 0.58, h * 0.18];
    const y = (PLATE.y0 + PLATE.y1) / 2 - h / 2;
    const xs = PLATE.x - 0.009;
    frontFacets(t, "white", xs, strokeText("QJ", 0.8, y, h, w, gap, true));
    frontFacets(t, "white", xs, emblem(0.27, y + h / 2, 0.19));
    const num = NUMBER.slice(3);
    frontFacets(t, "white", xs, strokeText(num, -0.05, y, h, w, gap, true));
  });
  m.scope("front draw gear", () => {
    t.box("beam", 0.42, PLATE.x + 0.02, 0.95, 1.32, -1.5, 1.5);
    knuckleCoupler(m, 1, t.X(0.42), t.X(0), 0.88);
    // the pilot: sloping red slats from the beam's foot to 0.12 m over the rail
    m.scope("pilot", () => {
      const slats = 8;
      for (let i = 0; i < slats; i++) {
        const z = -0.84 + (1.68 * i) / (slats - 1);
        const q: Vec3[] = [[t.X(0.28), 0.12, z - 0.04], [t.X(0.28), 0.12, z + 0.04], [t.X(0.55), 0.96, z + 0.04], [t.X(0.55), 0.96, z - 0.04]];
        m.slab("beam", q, [-0.05, 0, 0]);
      }
      t.box("beam", 0.27, 0.36, 0.1, 0.2, -0.9, 0.9);
    });
  });
  m.scope("smokebox door ring", () => {
    m.tube("doorRing", "x", 0, BY, BR + 0.06, BR * 0.92, t.X(SMOKEBOX[0]) - 0.01, t.X(SMOKEBOX[0]) + 0.03, 24);
  });
  m.scope("headlamp", () => {
    t.cylX("black", 0.58, 0.86, 0, 3.74, 0.17, 12);
    const lens = ngon(12, 0.13, 0, 0, 3.74);
    m.sweep("lampHead", "x", lens, t.X(0.58) - 0.02, lens, t.X(0.58) + 0.006);
  });
  m.scope("smokebox plate", () => {
    // the small black plate on the door's face, between the dart handle and the upper hinge strap
    const h = 0.11;
    const [w, gap] = [h * 0.58, h * 0.18];
    const width = strokeWidth(NUMBER, w, gap);
    const X = t.X(SMOKEBOX[0] - 0.07);
    const y0 = 3.12;
    const plate: Pt[] = [[-width / 2 - 0.05, y0], [width / 2 + 0.05, y0], [width / 2 + 0.05, y0 + h + 0.1], [-width / 2 - 0.05, y0 + h + 0.1]];
    m.sweep("doorPlate", "x", plate, X - 0.005, plate, X + 0.016);
    t.m.facets("plateText", strokeText(NUMBER, width / 2, y0 + 0.05, h, w, gap, true).map(([u, v]): Vec3 => [X + 0.02, v, u]), [1, 0, 0]);
  });
}

// --- the rest of the engine ---

function engineExtras(t: Steam): void {
  const m = t.m;
  deflectors(t);
  casing(t);
  front(t);
  m.scope("boiler handrails", () => {
    // white, along the barrel's upper flanks
    const dy = 0.58;
    const z = Math.sqrt(BR * BR - dy * dy) + 0.07;
    for (const s of [-1, 1]) {
      t.cylX("white", SMOKEBOX[1] + 0.2, CAB0 - 0.1, s * z, BY + dy, 0.022, 6);
      for (const x of [5.0, 7.5, 10.0, 12.5]) t.sideBox("steel", s, x - 0.015, x + 0.015, BY + dy - 0.015, BY + dy + 0.015, z - 0.1, z - 0.01);
    }
  });
  m.scope("running board pipes", () => {
    // the pipes along the side under the running board's edge
    for (const s of [-1, 1]) for (const [y, z] of [[2.45, 1.38], [2.36, 1.32], [2.27, 1.26]] as const) t.cylX("black", 4.3, 13.3, s * z, y, 0.035, 6);
  });
  m.scope("air reservoirs", () => {
    for (const s of [-1, 1]) t.cylX("paint", 6.5, 9.95, s * 1.12, 2.16, 0.24, 14);
  });
  m.scope("boiler fittings", () => {
    // the turbo-generator and the steam turret ahead of the cab
    t.box("paint", 11.95, 12.5, 4.05, 4.32, -0.2, 0.2);
    t.cylY("paint", 12.6, 0.0, 4.05, 4.35, 0.1, 8);
    t.box("paint", 13.2, CAB0 + 0.02, 3.9, 4.27, -0.55, 0.55);
    // the whistle
    t.cylY("steel", 9.35, 0.25, 4.05, 4.5, 0.05, 8);
  });
  m.scope("cab details", () => {
    // the door's edges on the cab's rear part
    for (const s of [-1, 1]) for (const x of [16.05, 16.6]) t.sidePanel(CAB_SEC, "black", s, x - 0.015, x + 0.015, 2.1, 3.85);
    // the cab front windows either side of the boiler
    for (const s of [-1, 1]) t.endPanel("glass", 1, CAB0, s > 0 ? 1.0 : -1.4, s > 0 ? 1.4 : -1.0, 3.55, 3.95);
    // the ladders under the cab's rear corners
    for (const s of [-1, 1]) {
      for (const dx of [0, 0.42]) m.rod("steel", [t.X(16.12 + dx), 0.35, s * 1.5], [t.X(16.12 + dx), 2.02, s * 1.5], 0.02, 6);
      for (let y = 0.45; y < 2.0; y += 0.3) m.rod("steel", [t.X(16.12), y, s * 1.5], [t.X(16.54), y, s * 1.5], 0.016, 6);
      // the white grab rails at the cab entrance
      m.rod("white", [t.X(16.68), 2.1, s * 1.5], [t.X(16.68), 3.6, s * 1.5], 0.02, 6);
    }
  });
  m.scope("rear frame", () => {
    // the trailing truck's frame and the ash pan rising from the last driver to the cab, under the firebox
    for (const s of [-1, 1]) {
      const q: Vec3[] = [[t.X(11.75), 1.05, s * 0.6], [t.X(11.75), 1.5, s * 0.6], [t.X(16.0), 1.95, s * 0.6], [t.X(16.0), 1.6, s * 0.6]];
      m.slab("frame", q, [0, 0, -s * 0.08]);
    }
    t.box("frame", 15.85, 16.0, 1.0, 1.95, -0.6, 0.6);
  });
  m.scope("drawbar", () => t.box("frame", 15.9, 16.4, 0.82, 1.0, -0.15, 0.15));
}

function engine(): LocoSpec {
  return {
    title: "CR QJ",
    palette: PALETTE,
    heads: [0, END],
    beams: { front: false, rear: false },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], bands: [4.4, 5.3, 6.4, 7.3, 8.9, 9.8, 11.0, 12.1, 13.3], band: "white", n: 24 },
    chimney: { x: 2.95, top: 4.79, r: 0.28 },
    valves: { x: 10.6, top: 4.6 },
    runningBoard: { profile: [[SMOKEBOX[1] + 0.25, RB], [CAB0 - 0.05, RB]], half: 1.55, valance: 0.07, valanceMat: "white" },
    frame: { x0: 0.65, x1: 12.0, top: 1.55 },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 4.0,
      // the door's window, the pair of narrow windows and the front window, as the works diagram draws them
      windows: [{ x0: 16.17, x1: 16.5, y0: 3.12, y1: 3.62 }, { x0: 15.49, x1: 15.87, y0: 2.92, y1: 3.65 }, { x0: 15.03, x1: 15.4, y0: 2.92, y1: 3.65 }, { x0: 14.37, x1: 14.83, y0: 2.92, y1: 3.65 }],
    },
    // the wide firebox over the trailing truck, under the cab's front
    prisms: [{ name: "firebox", x0: 11.6, x1: CAB0 + 0.05, half: [[1.2, 2.05], [1.2, 3.2], [1.1, 3.75], [0.75, 4.07], [0, 4.16]] }],
    bogies: [
      { x0: LEAD - 0.66, x1: LEAD + 0.66, y: 0.57 },
      { x0: TRAIL - 0.76, x1: TRAIL + 0.76, y: 0.69 },
    ],
    gear: {
      wheels: [
        { x: LEAD, d: 0.92, spokes: 0, outsideBoxes: true },
        ...COUPLED.map((x) => ({ x, d: 1.5, spokes: 14 })),
        { x: TRAIL, d: 1.12, spokes: 0, outsideBoxes: true },
      ],
      // two cylinders 650 x 800 mm over the leading truck; the main rods drive the third coupled axle. The
      // crank is the kit's 0.36 m (a 720 mm stroke): at 0.4 m the return crank's boss meets a rod's face in one
      // plane and flickers in the running clip

      engines: [{ coupled: [1, 2, 3, 4, 5], main: 3, cylinder: { x0: 2.05, x1: 3.65, y: 1.1, r: 0.4 }, crank: 0.36, phase: 0.3, valveGear: true }],
      cylinderZ: 1.12, reference: 1, wheelMaterial: "carrier", driverMaterial: "wheel", cylinderCoverMat: "paint",
    },
    number: { text: NUMBER, side: [15.25, 2.3, CAB_HALF[0]![0]] },
    extras: engineExtras,
  };
}

// --- the six-axle tender: 13.04 m from the drawbar to its rear coupler ---

const T_END = 13.04;
/**
 * The body from its front bulkhead to the rear wall, 3.1 m wide; the coal space's
 * sides 3.95 m high over its front 62 %, sloping down over half a metre to the
 * water tank's deck at 3.3 m (the side photographs: the rear 0.74 of the front's
 * height over the sole bars).
 */
const BODY = { x0: 0.65, x1: 12.0, half: 1.55, foot: 1.4, top: 3.95, step: 7.55, stepEnd: 8.05, deck: 3.3 };
/** The three-axle bogies, axles 1.55 m apart, centres 6.2 m apart (measured on the Iowa photograph at 103 px/m). */
const T_AXLES = [1.75, 3.3, 4.85, 7.95, 9.5, 11.05];
const bodyHalf = (top: number): Pt[] => [[BODY.half, BODY.foot], [BODY.half, top - 0.05], [BODY.half - 0.05, top]];

function tenderExtras(t: Steam): void {
  const m = t.m;
  m.scope("sole bars", () => {
    for (const s of [-1, 1]) t.sideBox("red", s, 0.3, BODY.x1 + 0.3, 1.08, 1.45, 1.42, BODY.half + 0.02);
  });
  m.scope("coal space step", () => m.sweep("paint", "x", mirrored(bodyHalf(BODY.top)), t.X(BODY.step), mirrored(bodyHalf(BODY.deck)), t.X(BODY.stepEnd)));
  m.scope("front bulkhead", () => {
    // the raised coal gate over the front deck, its corners rounded
    t.section("paint", BODY.x0, BODY.x0 + 0.25, mirrored([[1.52, BODY.top - 0.1], [1.52, BODY.top + 0.05], [1.25, BODY.top + 0.18], [0, BODY.top + 0.22]]));
    t.box("black", 0.25, BODY.x0 + 0.02, 1.95, 2.0, -1.25, 1.25);
    t.box("frame", 0.25, BODY.x0 + 0.02, 1.0, 1.95, -0.9, 0.9);
  });
  m.scope("water fillers", () => {
    for (const x of [9.2, 10.9]) t.cylY("paint", x, 0, BODY.deck - 0.02, BODY.deck + 0.14, 0.3, 12);
  });
  m.scope("emblems", () => {
    // the railway's emblem, white, on both sides at the coal space's rear
    for (const s of [-1, 1]) {
      const tris = emblem(0, 0, 0.27);
      m.facets("white", tris.map(([u, v]): Vec3 => [t.X(6.4) + u, 2.75 + v, s * (BODY.half + 0.004)]), [0, 0, s]);
    }
  });
  m.scope("tender handrails", () => {
    // the white grab rails at the rear corners and the ladder on the rear wall
    for (const s of [-1, 1]) m.rod("white", [t.X(BODY.x1 - 0.1), 1.6, s * (BODY.half + 0.06)], [t.X(BODY.x1 - 0.1), 3.3, s * (BODY.half + 0.06)], 0.02, 6);
    for (const z of [-0.25, 0.25]) m.rod("steel", [t.X(BODY.x1 + 0.06), 1.5, z], [t.X(BODY.x1 + 0.06), BODY.deck + 0.05, z], 0.02, 6);
    for (let y = 1.7; y < BODY.deck; y += 0.35) m.rod("steel", [t.X(BODY.x1 + 0.06), y, -0.25], [t.X(BODY.x1 + 0.06), y, 0.25], 0.016, 6);
  });
  m.scope("rear draw gear", () => {
    t.box("beam", BODY.x1 - 0.02, BODY.x1 + 0.3, 0.95, 1.32, -1.5, 1.5);
    knuckleCoupler(m, -1, -t.X(BODY.x1 + 0.3), -t.X(T_END), 0.88);
  });
}

/** The tender bogies' cast side frames' axle boxes and the bolster's drop, outside the kit's frame bars. */
function tenderTruck(t: Steam, b: { x0: number; x1: number; y: number }): void {
  const axles = T_AXLES.filter((x) => x > b.x0 && x < b.x1);
  for (const s of [-1, 1]) {
    t.sideBox("black", s, (b.x0 + b.x1) / 2 - 0.3, (b.x0 + b.x1) / 2 + 0.3, b.y - 0.32, b.y - 0.1, 0.97, 1.02);
    for (const x of axles) t.sideBox("black", s, x - 0.16, x + 0.16, 0.36, b.y - 0.09, 0.97, 1.08);
  }
}

function tender(): LocoSpec {
  return {
    title: "CR QJ tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: BODY.x1 + 0.3, top: 1.2 },
    prisms: [
      { name: "coal space", x0: BODY.x0, x1: BODY.step, half: bodyHalf(BODY.top) },
      { name: "water tank", x0: BODY.step - 0.02, x1: BODY.x1, half: bodyHalf(BODY.deck) },
    ],
    coal: { x0: BODY.x0 + 0.3, x1: BODY.step - 0.1, y: BODY.top - 0.02, half: 1.3, rise: 0.3 },
    bogies: [{ x0: T_AXLES[0]! - 0.66, x1: T_AXLES[2]! + 0.66, y: 0.62 }, { x0: T_AXLES[3]! - 0.66, x1: T_AXLES[5]! + 0.66, y: 0.62 }],
    drawOnTruckFrame: tenderTruck,
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 1.0, spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "carrier" },
    // the reversing lamp on the rear deck
    lamps: { front: [], rear: [[BODY.x1 - 0.05, BODY.deck, 0]] },
    extras: tenderExtras,
  };
}

/** The QJ's engine or tender spec, by the `unit` parameter's value. */
export function qjSpec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

/**
 * The spec its distant model is drawn from: the curled deflectors as flat plates
 * of their side outline, the top casing as a long dome, the tender's red sole
 * bars as a red block (the engine's budget goes to the deflectors before its red
 * front).
 */
export function qjLodSpec(unit: string): LocoSpec {
  if (unit === "tender") {
    const s = tender();
    return { ...s, prisms: [...s.prisms!, { name: "sole bars", x0: 0.3, x1: BODY.x1 + 0.3, half: [[BODY.half + 0.02, 1.08], [BODY.half + 0.02, 1.45]], mat: "red" }] };
  }
  const s = engine();
  return {
    ...s,
    deflectors: { outlines: [defOutline()], z: DEF.z - DEF.t },
    domes: [{ x: (CASING.x0 + CASING.x1) / 2, top: CASING.top, r: CASING.half, len: CASING.x1 - CASING.x0 }],
  };
}
