// The DRG class E 18 (proc-vehicle-drg-e18), the AEG 1'Do1' express electric
// locomotive of 1935, on the box locomotive kit (boxLocoKit.ts) with its own
// profile, measured on the DR works drawing and the photographs in
// assets/drg-e18 (SOURCES.md; docs/models/germany-trains.md):
//
// - the body 15.64 m long (16.92 m over the buffers), 2.94 m wide, its sides
//   upright from the black sill band (1.42 m) to the gutter (3.5 m), the shallow
//   roof arch to 3.83 m; the cab ends rounded in plan, the lower face upright,
//   the three front windows leaning back 0.23 m to their head at 3.45 m, the
//   roof rounding down over them; the black ledge under the windows round the
//   face and the black gutter line;
// - per side, mirrored about the middle: the cab side blank, the cab door with
//   its window, then the row of louvres and windows of the machine room (louvre,
//   window, two louvres, window, the middle louvre ...), one lower louvre under
//   each pair of louvres, the number plate and the hatch in the middle;
// - the lower face black down to 1.15 m, the straight buffer beam, the big
//   round lamps low on the rounded corners, the top lamp on the roof, the number
//   plate between the lamps;
// - the raised roof over the machine room with the roof line on insulators, the
//   two diamond pantographs over the cabs (the rear raised);
// - the running gear 1'Do1': four 1600 mm spoked drivers (2.8 + 2.1 + 3.0 +
//   2.1 + 2.8 m, 12.8 m between the pony axles) and two 1000 mm spoked pony
//   wheels, in red, inside the black frame. The game turns four units: each
//   pony axle and each pair of drivers is a rail bogie (as a steam locomotive's
//   turning units, docs/models/steam-locomotives.md "On curves"), so every
//   wheel stays on the rails in a curve; the body rides on the pony axles.
//
// The livery is the DR green of E 18 31 (photographed in Weimar): green body,
// black lines, grey roof, red wheels and pantographs.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type BogieSpec, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, diamond, insulator, onEnd, onSide, type ShellSpec } from "./czElectricKit.ts";
import { letters, wordWidth } from "./letters.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block, side } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { ROLLING_CLIP, ROLLING_SAMPLES, ROLLING_SPEED } from "./rolling.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (16.92 m) and the body's end face (15.64 m over the body), |x|. */
const HALF = 8.46;
const N = 7.82;
/** The body's half width. */
const W = 1.47;
/** The shell's bottom (the sill band's), the top of the black sill band, the ledge under the windows, the gutter, the crown. */
const Y0 = 1.42;
const SILL = 1.56;
const LEDGE: readonly [number, number] = [2.6, 2.65];
const GUTTER: readonly [number, number] = [3.48, 3.52];
const CROWN = 3.83;
/** The front windows' sill and head, and how far the head leans back. */
const SCREEN: readonly [number, number] = [2.67, 3.45];

/** The axles, |x|: the pony axles and the drivers (DR drawing: 2.8 + 2.1 + 3.0 m from the pony axle inward). */
const PONY_X = 6.4;
const DRIVER_X = [1.5, 3.6] as const;
/** The wheels' radii: 1600 mm drivers, 1000 mm pony wheels. */
const DRIVER_R = 0.8;
const PONY_R = 0.5;
/** The pantographs' centres, |x|, and their base frame's height. */
const PANTO_X = 5.15;
const PANTO_BASE = 4.2;

/** The end's centre line [y, |x|], bottom first: the upright face, the windows leaning back, the roof rounding over them. */
const TIP: Table = [
  [Y0, N], [LEDGE[1], N], [SCREEN[0], N - 0.012], [SCREEN[1], N - 0.22], [3.52, N - 0.29], [3.62, N - 0.39],
  [3.7, N - 0.5], [3.77, N - 0.66], [3.81, N - 0.86], [CROWN, N - 1.1],
];
/** The half width [y, hw]: upright to the gutter, then the roof's arch. */
const HW: Table = [[Y0, W], [GUTTER[1], W], [3.62, W - 0.06], [3.7, W - 0.18], [3.77, W - 0.4], [3.81, W - 0.72], [CROWN, W - 1.0]];

/** The corner's width across (m of z) and its depth back into the side (m of x): a rounded face. */
const CORNER_Z = 0.72;
const CORNER_X = 0.42;
/** How far the face's middle bows ahead of the corners' start. */
const BOW = 0.04;
const ANGLES = [15, 30, 45, 60, 75, 90].map((a) => (a * Math.PI) / 180);

/** The end's plan at height y and half width w: a slightly bowed middle, then an elliptic corner. */
function endPlan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const rz = Math.min(CORNER_Z, w * 0.8);
  const flat = w - rz;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + rz * Math.sin(a), BOW + (CORNER_X - BOW) * (1 - Math.cos(a))] as const)];
}

// --- livery -------------------------------------------------------------------------

interface E18Livery {
  title: string;
  body: MaterialSpec;
  number: string;
}

const LIVERIES: Record<string, E18Livery> = {
  // E 18 31 in DR green (Weimar museum), the key kept from the first model
  green: { title: "Green", body: c("#2f5442", 0.55), number: "E 18 31" },
};

export const E18_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];

const liveryOf = (v?: ParamValues): E18Livery => LIVERIES[resolveParams(E18_PARAMS, v).livery!]!;

const RED = c("#a52a22", 0.55);

// --- the kit's spec ------------------------------------------------------------------

/** The side, x on the front half (mirrored): the cab door, the machine room's row, the lower louvres. */
function sideItems(): SideItem[] {
  const row: readonly [number, number] = [2.68, 3.38];
  const louvre = (name: string, x: readonly [number, number], y: readonly [number, number] = row, mirror = true): SideItem =>
    ({ kind: "grille", name, x, y, slats: "h", pitch: 0.085, mat: "slat", r: 0.02, mirror });
  const win = (name: string, x: readonly [number, number]): SideItem => ({ kind: "window", name, x, y: row, mat: "body", r: 0.03, mirror: true });
  return [
    { kind: "door", name: "cab door", x: [5.73, 6.3], y: [1.6, 3.45], win: [2.62, 3.3], rails: true, mirror: true },
    louvre("louvre 1", [4.69, 5.55]),
    win("window 1", [3.83, 4.57]),
    louvre("louvre 2", [2.82, 3.7]),
    louvre("louvre 3", [1.83, 2.72]),
    win("window 2", [0.86, 1.6]),
    louvre("middle louvre", [-0.43, 0.43], row, false),
    louvre("lower louvre", [2.84, 3.69], [1.78, 2.5]),
    // the hatch under the number plate in the middle, and the maker's plate by the door
    { kind: "door", name: "hatch", x: [-0.62, 0.62], y: [1.62, 2.06] },
    { kind: "paint", name: "number plate", x: [-0.46, 0.46], y: [2.15, 2.33], mat: "plate", layer: 1, r: 0.02 },
    { kind: "paint", name: "maker plate", x: [5.3, 5.55], y: [1.8, 1.95], mat: "black", mirror: true },
  ];
}

/** The face: three windows, the lamps, the number plate (its letters drawn below; the top lamp is a housing). */
function endItems(): EndItem[] {
  return [
    { kind: "window", name: "front window middle", z: [-0.3, 0.3], y: SCREEN, mat: "body" },
    { kind: "window", name: "front window left", z: [0.36, 1.32], y: SCREEN, mat: "body", wiper: true },
    { kind: "window", name: "front window right", z: [-1.32, -0.36], y: SCREEN, mat: "body", wiper: true },
    { kind: "lamp", name: "lamp left", z: [0.93, 1.17], y: [1.74, 1.98], r: 0.12 },
    { kind: "lamp", name: "lamp right", z: [-1.17, -0.93], y: [1.74, 1.98], r: 0.12 },
    { kind: "paint", name: "number plate", z: [-0.3, 0.56], y: [1.74, 1.93], mat: "plate", layer: 1 },
  ];
}

/** The four running units for the distant model (the near model draws its own). */
const UNITS: BogieSpec[] = [
  { xc: -PONY_X, axles: [0], wheelR: PONY_R, frameTop: 0.9 },
  { xc: -(DRIVER_X[0] + DRIVER_X[1]) / 2, axles: [-1.05, 1.05], wheelR: DRIVER_R, frameTop: 1.2 },
  { xc: (DRIVER_X[0] + DRIVER_X[1]) / 2, axles: [-1.05, 1.05], wheelR: DRIVER_R, frameTop: 1.2 },
  { xc: PONY_X, axles: [0], wheelR: PONY_R, frameTop: 0.9 },
];

function spec(l: E18Livery, lod = false): LocoSpec {
  const bands: Band[] = [[Y0 - 0.3, SILL, "black"], [SILL, LEDGE[0], "body"], [LEDGE[0], LEDGE[1], "black"], [LEDGE[1], GUTTER[0], "body"], [GUTTER[0], GUTTER[1], "black"], [GUTTER[1], 4.4, "roof"]];
  return {
    palette: {
      body: l.body, roof: c("#8b8f8c", 0.7), black: c("#1d1e1f", 0.7), frame: c("#1f2022", 0.75), underframe: c("#1f2022", 0.75),
      slat: c("#2a3a31", 0.6), louvre: c("#141716", 0.85), rim: c("#9a9fa1", 0.45), letter: c("#e9e9e2"), plate: c("#151617", 0.6),
      pantograph: RED, wheel: RED, red: RED, steel: c("#3c3e41", 0.5), roofLine: c("#6b6e70", 0.5),
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: bands,
    end: bands,
    roof: "roof",
    buffers: HALF,
    beam: N + 0.02,
    bufferY: 1.05,
    // the inside frame between the wheels
    frame: { y0: 0.95, y1: Y0 + 0.01, half: 7.0, hw: 0.6, mat: "frame" },
    bogies: lod ? UNITS : [],
    pantograph: { kind: "diamond", x: PANTO_X, roofY: CROWN, baseY: PANTO_BASE },
    sideItems: sideItems(),
    endItems: endItems(),
    roofItems: lod ? [{ name: "raised roof", x: [-2.3, 2.3], w: [1.2, 1.05], y: [3.7, 4.08], mat: "roof" }] : [],
    number: l.number,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/** The black lower face under each end, down to the buffer beam, and the beam. */
function lowerEnds(m: MeshBuilder): void {
  const back = 7.08, y0 = 1.15, y1 = Y0 + 0.01, w = W - 0.02;
  const pts = endPlan(1.3, w);
  m.scope("lower ends", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const nose: Array<[number, number]> = [[back, -w], ...[...pts].reverse().map(([z, b]) => [N - 0.005 - b, -z] as [number, number]), ...pts.slice(1).map(([z, b]) => [N - 0.005 - b, z] as [number, number]), [back, w]];
        const ring: Ring = e > 0 ? nose : nose.map(([x, z]) => [-x, -z] as [number, number]);
        m.scope("apron", () => {
          m.prism("black", ring, y0, y1, false);
          m.cap("black", ring, y0, false);
        });
        // the straight buffer beam across the full width, ahead of the rounded face
        m.scope("buffer beam", () => block(m, "frame", ...(e > 0 ? [7.45, N + 0.02] : [-N - 0.02, -7.45]) as [number, number], 0.82, 1.28, -1.36, 1.36));
      });
  });
}

/** The ledge under the front windows: a thin black rib standing off the face. */
function ledges(m: MeshBuilder): void {
  m.scope("window ledges", () => {
    for (const e of [-1, 1]) {
      const pts = endPlan(LEDGE[0], W);
      const out = (d: number): Array<[number, number]> => [
        ...[...pts].reverse().map(([z, b]) => [N - b + d, -z] as [number, number]),
        ...pts.slice(1).map(([z, b]) => [N - b + d, z] as [number, number]),
      ];
      const outer = out(0.035), inner = out(-0.02);
      // one convex slab per facet of the plan, closed behind the face
      const q = (i: number): Ring => [inner[i]!, outer[i]!, outer[i + 1]!, inner[i + 1]!];
      for (let i = 0; i + 1 < outer.length; i++) {
        const r = q(i);
        const ring: Ring = e > 0 ? r.map(([x, z]) => [x, z] as [number, number]) : r.map(([x, z]) => [-x, -z] as [number, number]);
        const ccw = ring.reduce((s, p, k) => { const n = ring[(k + 1) % ring.length]!; return s + p[0] * n[1] - n[0] * p[1]; }, 0) < 0;
        m.prism("black", ccw ? ring : [...ring].reverse(), LEDGE[0] - 0.005, LEDGE[1] + 0.005);
      }
    }
  });
}

/** The raised roof over the machine room, with its sloping ends, and the roof line on its insulators. */
function roof(m: MeshBuilder): void {
  m.scope("raised roof", () => {
    const ring = (x: number, w: number): Ring => [[x, -w], [x, w], [-x, w], [-x, -w]].map(([a, b]) => [a!, b!] as [number, number]).reverse();
    m.loft("roof", ring(2.85, 1.25), 3.62, ring(1.75, 1.1), 4.08);
  });
  m.scope("roof line", () => {
    const y = 4.4;
    for (const x of [-1.2, 0, 1.2]) insulator(m, x, 0, 4.07, y - 0.02);
    for (const x of [-3.6, 3.6]) insulator(m, x, 0, CROWN - 0.01, y - 0.02);
    tubeX(m, "roofLine", 0.025, -(PANTO_X - 0.62), y, 0, PANTO_X - 0.62, y, 0, 6);
    // the main switch on the raised roof
    block(m, "roofLine", -0.35, 0.35, 4.08, 4.22, -0.25, 0.25);
  });
  m.scope("pantographs", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => diamond(m, { xc: e * PANTO_X, roofY: CROWN, baseY: PANTO_BASE, raised: e < 0 }));
  });
}

/** A quad facing `out`. */
function facing(m: MeshBuilder, mat: string, q: readonly [Vec3, Vec3, Vec3, Vec3], out: Vec3): void {
  const [a, b, cc] = q;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) m.quad(mat, q[0], q[1], q[2], q[3]);
  else m.quad(mat, q[3], q[2], q[1], q[0]);
}

/** The tyre's facets: 20 for the 10-spoke pony wheels (their loop closes on a spoke), 20 for the drivers too. */
const facetsOf = (spokes: number): number => (spokes === 10 ? 20 : 20);

/** A spoked wheel's side: tyre, rim, `n` spokes, hub. */
function spokedWheel(m: MeshBuilder, x: number, ay: number, R: number, n: number, s: number, hubR: number): void {
  const z = (a: number, b: number) => side(s, a, b);
  const f = facetsOf(n);
  m.scope("tyre", () => m.tube("wheel", "z", x, ay, R, R - 0.09, ...z(0.7175, 0.85), f, Math.PI / f));
  m.scope("spokes", () => {
    for (let k = 0; k < n; k++) {
      const t = (2 * Math.PI * k) / n, u = [Math.cos(t), Math.sin(t)] as const, w = Math.min(0.045, R * 0.06);
      const nn = [-u[1] * w, u[0] * w] as const;
      const q: Ring = [[hubR * 0.8, 1], [hubR * 0.8, -1], [R - 0.07, -1], [R - 0.07, 1]].map(([r, sg]) => [x + u[0] * r! + sg! * nn[0], ay + u[1] * r! + sg! * nn[1]] as [number, number]);
      // the outer face and the two long walls (the ends hide in the hub and the rim, the inner face faces the frame)
      const [zo, zi] = [s * 0.815, s * 0.765];
      const P = (i: number, zz: number): Vec3 => [q[i]![0], q[i]![1], zz];
      facing(m, "wheel", [P(0, zo), P(1, zo), P(2, zo), P(3, zo)], [0, 0, s]);
      facing(m, "wheel", [P(0, zi), P(3, zi), P(3, zo), P(0, zo)], [nn[0], nn[1], 0]);
      facing(m, "wheel", [P(1, zi), P(2, zi), P(2, zo), P(1, zo)], [-nn[0], -nn[1], 0]);
    }
  });
  m.scope("hub", () => m.sweep("wheel", "z", ngon(8, hubR, 0, x, ay), z(0.74, 0.86)[0], ngon(8, hubR, 0, x, ay), z(0.74, 0.86)[1]));
}

/** One wheelset as a rolling part: axle and both wheels. */
function wheelset(m: MeshBuilder, name: string, x: number, R: number, spokes: number, hubR: number): void {
  const ay = R * Math.cos(Math.PI / facetsOf(spokes));
  m.scope("wheelset", () => {
    m.spin(name, [x, ay, 0], () => {
      const axle = ngon(8, 0.09, 0, x, ay);
      m.sweep("steel", "z", axle, -0.72, axle, 0.72);
      for (const s of [-1, 1]) spokedWheel(m, x, ay, R, spokes, s, hubR);
    });
  });
  // the drivers' brake blocks (outside the wheelset scope, so its axle is the wheels' centre); the pony wheels are unbraked
  if (R < 0.6) return;
  for (const s of [-1, 1]) {
    const [b0, b1] = side(s, 0.72, 0.86);
    const bx = x > 0 ? -1 : 1;
    m.scope("brake block", () => block(m, "frame", x + bx * (R + 0.02), x + bx * (R + 0.1), ay - 0.25, ay + 0.15, b0, b1));
  }
}

/** The running gear: four turning units, front first (pony, drivers, drivers, pony), and their rolling wheels. */
function runningGear(m: MeshBuilder): void {
  const wheelsets: Array<{ name: string; d: number }> = [];
  let k = 0;
  const add = (x: number, R: number, spokes: number, hub: number) => {
    const name = `wheelset-${++k}`;
    wheelset(m, name, x, R, spokes, hub);
    wheelsets.push({ name, d: 2 * R });
  };
  m.scope("running gear", () => {
    for (const e of [1, -1]) {
      // the pony truck: its axle and a short frame reaching back under the body
      m.scope(e > 0 ? "front pony truck" : "rear pony truck", () =>
        m.bogie(() => {
          add(e * PONY_X, PONY_R, 10, 0.12);
          for (const s of [-1, 1]) {
            const [z0, z1] = side(s, 0.5, 0.58);
            m.scope("truck frame", () => block(m, "frame", e > 0 ? PONY_X - 0.9 : -PONY_X - 0.4, e > 0 ? PONY_X + 0.4 : -PONY_X + 0.9, 0.42, 0.62, z0, z1));
          }
        }));
    }
    for (const e of [1, -1]) {
      m.scope(e > 0 ? "front drivers" : "rear drivers", () =>
        m.bogie(() => {
          for (const x of [DRIVER_X[1], DRIVER_X[0]]) add(e * x, DRIVER_R, 16, 0.26);
        }));
    }
  });
  // the rolling clip: the drivers turn once a cycle, the pony wheels 1.6 times (10 spokes: the loop closes on a spoke)
  const big = 2 * DRIVER_R;
  const duration = (Math.PI * big) / ROLLING_SPEED;
  const times = Array.from({ length: ROLLING_SAMPLES + 1 }, (_, i) => Math.round(((i * duration) / ROLLING_SAMPLES) * 1e6) / 1e6);
  const turn = (f: number): number[] => times.flatMap((_, i) => {
    const a = (-2 * Math.PI * f * i) / ROLLING_SAMPLES;
    return [0, 0, Math.sin(a / 2), Math.cos(a / 2)];
  });
  m.animate({ name: ROLLING_CLIP, times, tracks: wheelsets.map((w) => ({ node: w.name, path: "rotation" as const, values: turn(big / w.d) })), drive: { drive: "distance", speed: ROLLING_SPEED } });
}

/** The sand boxes and the drive's cups on the frame beside the drivers. */
function frameItems(m: MeshBuilder): void {
  m.scope("sand boxes", () => {
    for (const x of [-4.45, -2.55, -0.75, 0.75, 2.55, 4.45]) for (const s of [-1, 1]) block(m, "frame", x - 0.16, x + 0.16, 1.18, Y0 + 0.01, ...side(s, 0.9, 1.16));
  });
}

/** The cab letters on the cab sides: "V" (front, cab 1) and "H" (rear), white, as on the photographs. */
function cabLetters(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("cab letters", () => {
    for (const sd of [-1, 1])
      for (const [text, x] of [["V", 7.05], ["H", -7.05]] as const) {
        const h = 0.24, w = wordWidth(text, h, { weight: 0.16 });
        const at = onSide(sp, sd);
        const tris = letters(text, sd > 0 ? x - w / 2 : x + w / 2, 3.02, h, sd < 0, { weight: 0.16 });
        m.facets("letter", tris.map(([u, v]) => at(u, v, 0.0115)), [0, 0, sd]);
      }
  });
}

/** The running number in white on the black plates: in the middle of each side and on each face. */
function numbers(m: MeshBuilder, sp: ShellSpec, text: string): void {
  const style = { weight: 0.14 };
  m.scope("numbers", () => {
    for (const sd of [-1, 1]) {
      const h = 0.11, w = wordWidth(text, h, style), at = onSide(sp, sd);
      const tris = letters(text, sd > 0 ? -w / 2 : w / 2, 2.185, h, sd < 0, style);
      m.facets("letter", tris.map(([u, v]) => at(u, v, 0.0115)), [0, 0, sd]);
    }
    for (const e of [-1, 1]) {
      // the plate's centre: 0.13 m toward +z on the rear face, mirrored on the front (the kit's end items)
      const h = 0.12, w = wordWidth(text, h, style), at = onEnd(sp, e), zc = -e * 0.13;
      const tris = letters(text, e > 0 ? zc + w / 2 : zc - w / 2, 1.775, h, e > 0, style);
      m.facets("letter", tris.map(([u, v]) => at(u, v, 0.0115)), [e, 0, 0]);
    }
  });
}

/** The top lamp: a round housing standing on the roof's front edge. */
function topLamps(m: MeshBuilder): void {
  m.scope("top lamps", () => {
    for (const e of [-1, 1]) {
      const y = 3.69, [a, b] = e > 0 ? [N - 0.75, N - 0.4] : [-(N - 0.4), -(N - 0.75)];
      m.sweep("roof", "x", ngon(10, 0.1, 0, 0, y), a, ngon(10, 0.1, 0, 0, y), b);
      const [l0, l1] = e > 0 ? [N - 0.41, N - 0.385] : [-(N - 0.385), -(N - 0.41)];
      m.sweep("lampHead", "x", ngon(10, 0.075, 0, 0, y), l0, ngon(10, 0.075, 0, 0, y), l1);
    }
  });
}

/** The DRG E 18. */
export function drgE18(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  m.scope("body", () => {
    lowerEnds(m);
    ledges(m);
    frameItems(m);
    const sp = shellOf(s);
    cabLetters(m, sp);
    numbers(m, sp, l.number);
    topLamps(m);
  });
  m.scope("roof equipment", () => roof(m));
  runningGear(m);
  return m;
}

/** The distant model: the kit's, from the same profile and paint, a block per running unit, the raised roof. */
export function drgE18Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v), true));
}

/** For tests: the axle positions front to back. */
export const E18_AXLES = [PONY_X, DRIVER_X[1], DRIVER_X[0], -DRIVER_X[0], -DRIVER_X[1], -PONY_X];
export const E18_LENGTH = 2 * HALF;
