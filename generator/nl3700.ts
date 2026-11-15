// The NS 3700 "Jumbo" (SS 700, 2'C h4), the Dutch State Railways' four-cylinder
// express engine of 1910-1928, as the preserved 3737 (Werkspoor 1911, SS 731)
// stands in the Spoorwegmuseum, with its three-axle tender, drawn on the steam
// kit (steamLoco.ts). Matched to the side-on works photograph of 3767, the
// three-quarter views of 3737 in the museum and on the line, 3713 and 3785
// (assets/ns-3700/SOURCES.md) and the published figures (18,480 mm over the
// buffers of engine and tender, drivers 1,850 mm, bogie wheels 915 mm, tender
// wheels 1,220 mm, height 4,520 mm, cylinders 400 x 660 mm): the boiler on 2.85 m
// with the large riveted smokebox standing proud of the barrel, its wide door
// with two hinge straps and the dart wheel, the tall chimney with its copper
// cap, the polished brass dome and safety valve casing, the square-shouldered
// Belpaire firebox, the straight running board on 1.65 m dropping to the red
// buffer beam ahead of the smokebox, splashers with brass beading over the
// leading and middle drivers, the outside cylinders between the bogie wheels
// driving the middle axle (the valve gear is inside the frames), the cab with
// two arched side windows, the open entrance behind them, tall teak-framed
// front windows beside the firebox and the oval NEDERLANDSCHE SPOORWEGEN plate,
// and the flat-sided tender with its flared coping and outside frames.
// NS green, lined, with black smokebox, running board and frames, a red buffer
// beam lettered "No 3737" and brass lamps. See docs/models/world-steam.md.
//
// Every length is in metres along the locomotive from its front buffer heads
// (the tender: from its own front buffer heads), y up from the rail top.

import { ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import { mirrored, type Pt, type Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** NS green (3737 today), the black works, the red beam. */
const GREEN = "#264532";
const BLACK = "#1b1c1e";
const RED = "#b3241e";

const PALETTE: Record<string, MaterialSpec> = {
  paint: mat(GREEN, 0.4),
  wheel: mat(BLACK, 0.6),
  frame: mat(BLACK, 0.65),
  beam: mat(RED, 0.55),
  smokebox: mat("#19191b", 0.8),
  black: mat("#161618", 0.75),
  roof: mat("#222325", 0.8),
  // the fine yellow lining on the cab and tender panels
  lining: mat("#c8a94a", 0.5),
  plate: mat("#141416", 0.5),
  plateText: { color: "#d8b45a", metallic: 0.55, roughness: 0.3 },
  // the polished dome, safety valve casing, beading and lamps
  brass: { color: "#cfa645", metallic: 0.65, roughness: 0.25 },
  copper: { color: "#b36b40", metallic: 0.55, roughness: 0.35 },
  teak: mat("#9b5a2a", 0.45),
  steel: { color: "#8a8f95", metallic: 0.45, roughness: 0.35 },
  doorRing: { color: "#a9adb2", metallic: 0.5, roughness: 0.3 },
  tyre: { color: "#55585d", metallic: 0.35, roughness: 0.45 },
  coal: { color: "#2e2f32", metallic: 0.15, roughness: 0.6 },
  coalLump: { color: "#4c4d52", metallic: 0.2, roughness: 0.45 },
  opening: mat("#0c0c0d", 0.9),
};

const NUMBER = "3737";

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title and the measures the table lists. */
export const NS3700_WORLD: { base: WorldSteam } = {
  base: { top: 4.65, coupler: "buffers", half: 1.5, title: "NS 3700", lead: 2, coupled: 3, trail: 0, leadD: 0.915, coupledD: 1.85, trailD: 0, boilerR: 0.84, deflectors: "none", domes: 1, belpaire: true, palette: { paint: GREEN, wheel: BLACK, frame: BLACK, smokebox: "#19191b" }, tender: { length: 5.58, axles: 3, d: 1.22 }, number: NUMBER },
};

// --- the engine (3767 side-on, scaled on the 1.85 m drivers; 18.48 m with the tender) ---

/** The bogie's axles 2.3 m apart; the drivers 2.05 and 2.13 m apart (leading, middle, trailing). */
const LEAD = [1.65, 3.95];
const COUPLED = [6.45, 8.5, 10.63];
/** The engine's rear head; the tender's front head meets it. */
const END = 12.9;
/** Boiler centre and barrel radius (barrel top 3.69 m); the running board's top. */
const BY = 2.85;
const BR = 0.84;
const RB = 1.65;
const HALF = 1.38;
/** The smokebox from its front ring to its rear ring, its riveted wrapper's radius (2 cm over the kit's own smokebox, about the barrel's size as on 3767). */
const SMOKEBOX = [1.79, 3.58] as const;
const SBR = 0.9;
/** The Belpaire firebox's front (its throat plate); the cab sides. */
const FIREBOX0 = 7.71;
const CAB0 = 10.28;
const CAB1 = 12.82;
const CAB_W = 1.42;
/** The cab's right half section: the sheets from just inside the running board up to the crown. */
const CAB_HALF: Pt[] = [[CAB_W, RB - 0.02], [CAB_W, 4.0], [1.3, 4.17], [0.8, 4.3], [0, 4.34]];
/** The roof sheet over it: the eaves 6 cm out, 5 cm thick. */
const ROOF_OUT: Pt[] = [[1.5, 3.97], [1.37, 4.22], [0.84, 4.35], [0, 4.39]];
const ROOF_IN: Pt[] = [[1.48, 3.94], [1.33, 4.17], [0.81, 4.3], [0, 4.34]];
/** The Belpaire firebox's right half: narrow between the wheels, square-shouldered on top. */
/** The two arched cab side windows (x ranges of their glass). */
const SIDE_WINDOWS = [[10.66, 11.17], [11.3, 11.8]] as const;
const FIREBOX_HALF: Pt[] = [[0.6, RB - 0.02], [0.6, 2.1], [0.9, 2.3], [0.9, 3.62], [0.82, 3.78], [0.55, 3.83], [0, 3.85]];

/** A face of quads/triangles, wound so it looks along `out` (model axes). */
function face(m: Steam["m"], mt: string, p: Vec3[], out: Vec3): void {
  const [a, b, c] = p as [Vec3, Vec3, Vec3];
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const q = n[0]! * out[0] + n[1]! * out[1] + n[2]! * out[2] < 0 ? [...p].reverse() : p;
  for (let i = 1; i + 1 < q.length; i++) m.tri(mt, q[0]!, q[i]!, q[i + 1]!);
}

/** An arched outline in (a, y): a rectangle a0..a1, y0 up to where the semicircular head of the span's width starts. */
function arch(a0: number, a1: number, y0: number, y1: number, n = 6): Pt[] {
  const r = (a1 - a0) / 2;
  const c = (a0 + a1) / 2;
  const spring = y1 - r;
  const head = Array.from({ length: n + 1 }, (_, i): Pt => {
    const t = (i / n) * Math.PI;
    return [c + r * Math.cos(t), spring + r * Math.sin(t)];
  });
  return [[a0, y0], [a1, y0], ...head];
}

/** The outline (x, y) laid on side s at |z| = z, a panel `depth` deep into the side. */
function sideSlab(t: Steam, mt: string, s: number, outline: Pt[], z: number, depth = 0.02): void {
  t.m.slab(mt, outline.map(([x, y]): Vec3 => [t.X(x), y, s * z]), [0, 0, -s * depth]);
}

/** A thin rectangle frame of strips (lining) at |z| = z on side s: x0..x1, y0..y1, `w` wide. */
function liningFrame(t: Steam, s: number, x0: number, x1: number, y0: number, y1: number, z: number, w = 0.022): void {
  const strip = (a: number, b: number, c: number, d: number) => sideSlab(t, "lining", s, [[a, c], [b, c], [b, d], [a, d]], z, 0.004);
  strip(x0, x1, y0, y0 + w);
  strip(x0, x1, y1 - w, y1);
  strip(x0, x0 + w, y0 + w, y1 - w);
  strip(x1 - w, x1, y0 + w, y1 - w);
}

/**
 * The cab: the side sheets and roof crown swept from the front to the rear, the
 * lowered side sheets over the trailing driver, the roof sheet with its overhang,
 * the arched side windows and open entrance, the teak-framed front windows.
 */
function cab(t: Steam): void {
  const m = t.m;
  m.scope("cab", () => {
    m.scope("sheets", () => {
      t.section("paint", CAB0, CAB1, mirrored(CAB_HALF));
      // the side sheets dropped below the board over the trailing driver, their front corner rounded
      for (const s of [-1, 1]) {
        const [lo, hi] = [RB - 0.24, RB - 0.03];
        const corner = Array.from({ length: 5 }, (_, i): Pt => {
          const a = (i / 4) * (Math.PI / 2);
          return [11.47 - 0.21 * Math.cos(a), hi - 0.21 * Math.sin(a)];
        });
        const outline: Pt[] = [[CAB1, lo], [CAB1, hi], ...corner];
        t.m.slab("paint", outline.map(([x, y]): Vec3 => [t.X(x), y, s * CAB_W]), [0, 0, -s * 0.03]);
      }
    });
    m.scope("roof", () => {
      const [front, rear] = [CAB0 - 0.1, CAB1 + 0.06];
      const P = (x: number, z: number, y: number): Vec3 => [t.X(x), y, z];
      for (const s of [-1, 1]) {
        for (let i = 0; i + 1 < ROOF_OUT.length; i++) {
          const [a, b] = [ROOF_OUT[i]!, ROOF_OUT[i + 1]!];
          face(m, "roof", [P(front, s * a[0], a[1]), P(rear, s * a[0], a[1]), P(rear, s * b[0], b[1]), P(front, s * b[0], b[1])], [0, a[0] - b[0], s * (b[1] - a[1])]);
          const [c, d] = [ROOF_IN[i]!, ROOF_IN[i + 1]!];
          face(m, "roof", [P(front, s * c[0], c[1]), P(rear, s * c[0], c[1]), P(rear, s * d[0], d[1]), P(front, s * d[0], d[1])], [0, -(c[0] - d[0]), -s * (d[1] - c[1])]);
          face(m, "roof", [P(front, s * a[0], a[1]), P(front, s * b[0], b[1]), P(front, s * d[0], d[1]), P(front, s * c[0], c[1])], [1, 0, 0]);
          face(m, "roof", [P(rear, s * a[0], a[1]), P(rear, s * b[0], b[1]), P(rear, s * d[0], d[1]), P(rear, s * c[0], c[1])], [-1, 0, 0]);
        }
        const [a, c] = [ROOF_OUT[0]!, ROOF_IN[0]!];
        face(m, "roof", [P(front, s * a[0], a[1]), P(rear, s * a[0], a[1]), P(rear, s * c[0], c[1]), P(front, s * c[0], c[1])], [0, -0.3, s]);
      }
      // the ventilator on the crown
      t.box("roof", 11.2, 11.8, 4.36, 4.44, -0.3, 0.3);
    });
    m.scope("windows", () => {
      for (const s of [-1, 1]) {
        // two arched side windows in teak frames, the open entrance behind them
        for (const [x0, x1] of SIDE_WINDOWS) {
          sideSlab(t, "teak", s, arch(x0 - 0.05, x1 + 0.05, 3.0, 3.93), CAB_W + 0.004);
          sideSlab(t, "glass", s, arch(x0, x1, 3.05, 3.88), CAB_W + 0.009);
        }
        sideSlab(t, "opening", s, arch(12.08, 12.7, RB + 0.02, 3.8), CAB_W + 0.004);
        // the panel lining below the windows
        liningFrame(t, s, 10.42, 11.95, RB + 0.12, 2.9, CAB_W + 0.004);
      }
      // the tall front windows beside the firebox in their teak frames
      const front = t.X(CAB0);
      for (const s of [-1, 1]) {
        const frame = arch(0.95, 1.33, 2.55, 3.95).map(([z, y]): Vec3 => [front + 0.004, y, s * z]);
        m.slab("teak", frame, [-0.02, 0, 0]);
        const glass = arch(1.01, 1.27, 3.05, 3.89).map(([z, y]): Vec3 => [front + 0.009, y, s * z]);
        m.slab("glass", glass, [-0.02, 0, 0]);
      }
    });
    m.scope("number plates", () => {
      // the oval NEDERLANDSCHE / 3737 / SPOORWEGEN plate, brass rim and figures on black
      const [x, y] = [11.25, 2.39];
      for (const s of [-1, 1]) {
        const oval = (a: number, b: number): Pt[] => ngon(20, 1, 0, 0, 0).map(([u, v]): Pt => [x + u * a, y + v * b]);
        sideSlab(t, "brass", s, oval(0.31, 0.19), CAB_W + 0.004);
        sideSlab(t, "plate", s, oval(0.29, 0.17), CAB_W + 0.009);
        const z = CAB_W + 0.013;
        const tx = (text: string, h: number, v: number) => {
          const w = strokeWidth(text, h * 0.58, h * 0.18);
          const u0 = t.X(x) + (s > 0 ? -w / 2 : w / 2);
          m.facets("plateText", strokeText(text, u0, v, h, h * 0.58, h * 0.18, s < 0).map(([u, vv]): Vec3 => [u, vv, s * z]), [0, 0, s]);
        };
        tx(NUMBER, 0.11, y - 0.055);
        tx("NEDERLANDSCHE", 0.032, y + 0.085);
        tx("SPOORWEGEN", 0.032, y - 0.12);
      }
    });
    m.scope("cab steps", () => {
      for (const s of [-1, 1]) for (const y of [0.95, 1.3]) t.sideBox("black", s, 12.15, 12.55, y - 0.03, y, 1.24, 1.42);
      for (const s of [-1, 1]) t.sideBox("black", s, 12.13, 12.16, 0.9, RB - 0.27, 1.26, 1.4);
    });
  });
}

/** The polished brass dome: the foot flared over the barrel, the drum, the rounded cap. */
const DOME = { x: 5.49, top: 4.45, r: 0.45 };

function domeAndValves(t: Steam): void {
  const m = t.m;
  m.scope("dome", () => {
    const d = DOME;
    const n = 16;
    const y0 = BY + BR * 0.8;
    const cap = 0.3;
    const shoulder = d.top - cap;
    const ring = (r: number) => ngon(n, r, Math.PI / n, t.X(d.x), 0);
    m.loft("brass", ring(d.r + 0.08), y0, ring(d.r), BY + BR + 0.05, false);
    m.loft("brass", ring(d.r), BY + BR + 0.05, ring(d.r), shoulder, false);
    const steps = [0, 35, 65, 85].map((deg) => (deg * Math.PI) / 180);
    for (let i = 0; i + 1 < steps.length; i++) {
      const [a, b] = [steps[i]!, steps[i + 1]!];
      m.loft("brass", ring(d.r * Math.cos(a)), shoulder + cap * Math.sin(a), ring(d.r * Math.cos(b)), shoulder + cap * Math.sin(b), i + 2 === steps.length);
    }
  });
  m.scope("safety valves", () => {
    // the brass casing on the firebox's crown, its lip flared, the two valves inside
    const x = 9.03;
    t.cylY("brass", x, 0, 3.8, 4.25, 0.2, 14, false);
    t.cylY("brass", x, 0, 4.25, 4.33, 0.26, 14);
    for (const dz of [-0.08, 0.08]) t.cylY("steel", x, dz, 4.33, 4.42, 0.05, 8);
    // the whistle ahead of the cab
    t.cylY("brass", CAB0 - 0.18, 0.25, 3.8, 4.1, 0.035, 8);
    t.cylY("brass", CAB0 - 0.18, 0.25, 4.1, 4.25, 0.055, 8);
  });
}

/** A splasher over a driver at x: the arc above the board swept across, brass beading on its outer edge. */
function splasher(t: Steam, x: number): void {
  const m = t.m;
  const [cy, r] = [COUPLED_D / 2, COUPLED_D / 2 + 0.17];
  // its foot 2 cm down in the board
  const a0 = Math.asin((RB - 0.02 - cy) / r);
  const n = 10;
  const arc = Array.from({ length: n + 1 }, (_, i): Pt => {
    const a = a0 + ((Math.PI - 2 * a0) * i) / n;
    return [x + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const sec = arc.map(([px, py]): [number, number] => [t.X(px), py]);
  for (const s of [-1, 1]) {
    const [z0, z1] = s > 0 ? [0.63, 0.92] : [-0.92, -0.63];
    m.sweep("paint", "z", sec, z0, sec, z1);
    // the beading round the outer edge
    for (let i = 0; i < n; i++) {
      const [p, q] = [arc[i]!, arc[i + 1]!];
      const k = (p: Pt, f: number): Pt => [x + (p[0] - x) * f, cy + (p[1] - cy) * f];
      const quad = [k(p, 1.005), k(q, 1.005), k(q, 0.955), k(p, 0.955)];
      sideSlab(t, "brass", s, quad, 0.925, 0.01);
    }
  }
}
const COUPLED_D = 1.85;

function engineExtras(t: Steam): void {
  const m = t.m;
  cab(t);
  domeAndValves(t);
  m.scope("smokebox", () => {
    // the riveted wrapper standing proud of the barrel, its front ring and rear ring
    t.cylX("smokebox", SMOKEBOX[0] - 0.02, SMOKEBOX[1] + 0.03, 0, BY, SBR, 28);
    t.cylX("black", SMOKEBOX[0] + 0.02, SMOKEBOX[0] + 0.08, 0, BY, SBR + 0.018, 28, false);
    t.cylX("black", SMOKEBOX[1] - 0.06, SMOKEBOX[1], 0, BY, SBR + 0.018, 28, false);
    // the plate under it down to the running board
    t.box("smokebox", SMOKEBOX[0] + 0.04, SMOKEBOX[1] - 0.05, RB - 0.02, BY - 0.6, -0.86, 0.86);
  });
  m.scope("smokebox door", () => {
    // the wide door, its polished rim, the two hinge straps and the dart wheel and handle
    const [x0, r] = [SMOKEBOX[0] - 0.02, 0.74];
    const X0 = t.X(x0);
    const door = ngon(28, r, Math.PI / 28, 0, BY);
    // the door's face 1.5 cm ahead of the kit's own door and its dart (boiler()), which it hides
    m.sweep("smokebox", "x", door, X0, door, X0 + 0.085);
    m.tube("doorRing", "x", 0, BY, r + 0.005, r - 0.035, X0 + 0.065, X0 + 0.1, 28);
    for (const [dy, z0, z1] of [[0.36, -0.72, 0.33], [-0.42, -0.62, 0.23]] as const) t.box("doorRing", x0 - 0.125, x0 - 0.089, BY + dy - 0.035, BY + dy + 0.035, z0, z1);
    t.cylX("steel", x0 - 0.155, x0 - 0.09, 0, BY + 0.12, 0.12, 12);
    t.box("doorRing", x0 - 0.135, x0 - 0.1, BY - 0.25, BY + 0.05, -0.02, 0.02);
  });
  m.scope("chimney cap", () => t.cylY("copper", CHIMNEY.x, 0, CHIMNEY.top - 0.16, CHIMNEY.top - 0.02, CHIMNEY.r + 0.065, 14));
  m.scope("handrails", () => {
    t.handrail(SMOKEBOX[0] + 0.15, SMOKEBOX[1] - 0.1, BY + 0.42, Math.sqrt(SBR * SBR - 0.42 * 0.42) + 0.08, Math.sqrt(SBR * SBR - 0.42 * 0.42) - 0.02, 2);
    t.handrail(SMOKEBOX[1] + 0.15, FIREBOX0 - 0.15, BY + 0.38, Math.sqrt(BR * BR - 0.38 * 0.38) + 0.08, Math.sqrt(BR * BR - 0.38 * 0.38) - 0.02, 3);
  });
  m.scope("boiler pipes", () => {
    // the copper feed pipes along the barrel's flanks from the cab to the clack valves
    const z = Math.sqrt(BR * BR - 0.3 * 0.3) + 0.05;
    for (const s of [-1, 1]) {
      t.cylX("copper", SMOKEBOX[1] + 0.3, FIREBOX0 - 0.05, s * z, BY - 0.3, 0.03, 6);
      t.cylX("copper", FIREBOX0 - 0.05, CAB0 - 0.02, s * 0.95, BY - 0.3, 0.03, 6);
    }
  });
  m.scope("splashers", () => {
    splasher(t, COUPLED[0]!);
    splasher(t, COUPLED[1]!);
  });
  m.scope("sand boxes", () => {
    // the boxes on the board ahead of the cab, over the trailing driver's front
    for (const s of [-1, 1]) t.sideBox("paint", s, 9.35, 10.2, RB - 0.01, RB + 0.38, 0.64, 1.02);
  });
  m.scope("reversing rod", () => {
    for (const s of [1]) t.cylX("steel", 7.2, CAB0, s * 1.08, RB + 0.5, 0.025, 6);
  });
  m.scope("valve chests", () => {
    // the outside cylinders' steam chests above them, under the running board
    for (const s of [-1, 1]) t.sideBox("black", s, CYL[0] + 0.1, CYL[1] - 0.1, CYL_Y + 0.33, RB - 0.06, 0.82, 1.3);
  });
  m.scope("front lamps", () => {
    for (const [x, y, z] of FRONT_LAMPS) brassLamp(t, 1, x, y, z);
  });
  m.scope("beam number", () => {
    // "No 3737" painted in gold on the red beam either side of the hook
    const x = t.X(0.6) + 0.01;
    const draw = (text: string, z0: number, h: number, v: number) => {
      m.facets("plateText", strokeText(text, z0, v, h, h * 0.58, h * 0.18, true).map(([u, vv]): Vec3 => [x, vv, u]), [1, 0, 0]);
    };
    // seen from ahead the text runs toward -z: "No" on the left, the number right of the hook
    draw("N", 0.6, 0.15, 0.98);
    draw("O", 0.49, 0.075, 1.055);
    t.box("plateText", 0.59, 0.594, 1.03, 1.042, 0.405, 0.49);
    draw(NUMBER, -0.16, 0.15, 0.98);
  });
}

/** A brass lamp at source x (its lens's foot), height y, z, its lens facing end e. */
function brassLamp(t: Steam, e: number, x: number, y: number, z: number): void {
  const m = t.m;
  m.scope("lamp", () => {
    t.box("brass", x, x + e * 0.24, y, y + 0.32, z - 0.14, z + 0.14);
    t.cylY("brass", x + e * 0.12, z, y + 0.32, y + 0.42, 0.06, 8);
    const X = t.X(x) + e * 0.004;
    const lens = ngon(12, 0.12, 0, z, y + 0.16);
    m.sweep("lampHead", "x", lens, X - e * 0.02, lens, X + e * 0.008);
    m.tube("brass", "x", z, y + 0.16, 0.135, 0.115, X + e * 0.004, X + e * 0.035, 12);
  });
}

/** The tall stack: 0.77 m above the smokebox to the published 4.52 m. */
const CHIMNEY = { x: 2.58, top: 4.52, r: 0.22 };
/** The outside cylinders between the bogie's axles, 400 x 660 mm. */
const CYL = [2.22, 3.4] as const;
const CYL_Y = 1.02;
/** The lamps on the beam's top at its ends and on the smokebox's crown. */
const FRONT_LAMPS: Array<[number, number, number]> = [[0.66, 1.405, 0.95], [0.66, 1.405, -0.95], [SMOKEBOX[0] + 0.1, BY + SBR - 0.05, 0]];

function engine(): LocoSpec {
  return {
    title: "NS 3700",
    palette: PALETTE,
    heads: [0, END],
    beams: { y0: 0.8, y1: 1.38, length: [0.6, 0.3], half: 1.44 },
    boiler: { x0: SMOKEBOX[0], x1: FIREBOX0 + 0.3, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], bands: [4.55, 6.5, 7.5], band: "black", n: 24 },
    chimney: { x: CHIMNEY.x, top: CHIMNEY.top, r: CHIMNEY.r, base: BY + SBR - 0.07 },
    // the board from the beam's top up the short ramp ahead of the smokebox, straight on to the cab
    runningBoard: { profile: [[0.62, 1.4], [1.0, 1.4], [1.18, 1.46], [1.3, 1.56], [1.36, RB], [CAB1 + 0.03, RB]], half: HALF, valance: 0.14 },
    frame: { x0: 0.8, x1: END - 0.3, top: RB - 0.06 },
    prisms: [{ name: "firebox", x0: FIREBOX0, x1: CAB0 + 0.3, half: FIREBOX_HALF }],
    bogies: [{ x0: LEAD[0]! - 0.55, x1: LEAD[1]! + 0.55, y: 0.55 }],
    gear: {
      wheels: [
        ...LEAD.map((x) => ({ x, d: 0.915, spokes: 10, outsideBoxes: true })),
        ...COUPLED.map((x) => ({ x, d: COUPLED_D, spokes: 20 })),
      ],
      // the outside pair of the four cylinders drives the middle axle; the valve gear is inside the frames
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: CYL[0], x1: CYL[1], y: CYL_Y, r: 0.34 }, crank: 0.33, phase: 0.3, valveGear: false }],
      cylinderZ: 1.06, reference: 3, wheelMaterial: "wheel", cylinderMat: "steel", cylinderCoverMat: "doorRing",
    },
    extras: engineExtras,
  };
}

// --- the three-axle tender: 5.58 m over its buffers, wheels 1.22 m on 1.55 m ---

const T_END = 18.48 - END;
const T_AXLES = [1.09, 2.64, 4.19];
const TANK = [0.36, 4.93] as const;
const TANK_FOOT = 1.32;
const TANK_TOP = 2.88;
const T_HALF = 1.38;
/** The tank's right half, and the coping flared out above it round the coal. */
const TANK_HALF: Pt[] = [[T_HALF, TANK_FOOT], [T_HALF, TANK_TOP]];
const COPING_HALF: Pt[] = [[T_HALF, TANK_TOP - 0.01], [1.5, 3.1], [1.46, 3.12]];

function tenderExtras(t: Steam): void {
  const m = t.m;
  m.scope("outside frames", () => {
    // the plate frames outside the wheels, the axle boxes in their horns and the springs over them
    for (const s of [-1, 1]) {
      t.sideFrame("black", s, 0.32, T_END - 0.62, 0.66, TANK_FOOT - 0.01, 0.98, 1.04);
      for (const x of T_AXLES) {
        t.sideBox("black", s, x - 0.17, x + 0.17, 0.45, 0.8, 1.035, 1.15);
        t.sideBox("steel", s, x - 0.45, x + 0.45, 0.88, 0.97, 1.035, 1.13);
        t.sideBox("black", s, x - 0.05, x + 0.05, 0.8, 0.88, 1.035, 1.12);
      }
    }
  });
  m.scope("lining", () => {
    // the lined panel on each tank side, and the brass plate in it
    for (const s of [-1, 1]) {
      liningFrame(t, s, TANK[0] + 0.15, TANK[1] - 0.15, TANK_FOOT + 0.12, TANK_TOP - 0.12, T_HALF + 0.004);
      const oval = ngon(16, 1, 0, 0, 0).map(([u, v]): Pt => [2.64 + u * 0.16, 2.1 + v * 0.12]);
      sideSlab(t, "brass", s, oval, T_HALF + 0.004);
    }
  });
  m.scope("coal", () => {
    const [y, half, rise] = [TANK_TOP + 0.12, 1.3, 0.3];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      const x = 0.8 + i * 0.45 + (j % 2) * 0.12;
      const z = (j - 1.5) * 0.48 + ((i * 7 + j * 3) % 5 - 2) * 0.03;
      const r = 0.09 + ((i * 3 + j * 5) % 4) * 0.02;
      const a = Math.abs(z) / half;
      const h = y + (a <= 0.3 ? rise : a <= 0.75 ? rise - ((a - 0.3) / 0.45) * 0.4 * rise : 0.6 * rise - ((a - 0.75) / 0.25) * 0.6 * rise);
      m.spire("coalLump", ngon(4, r, (i + j) * 0.7, t.X(x), z), h - 0.05, h + r * 0.5);
    }
  });
  m.scope("front", () => {
    // the coal door and the tool lockers toward the cab
    t.box("black", TANK[0] - 0.02, TANK[0] + 0.02, 1.9, 2.75, -0.45, 0.45);
    for (const s of [-1, 1]) t.sideBox("paint", s, TANK[0] - 0.12, TANK[0] + 0.01, TANK_FOOT + 0.3, 2.6, 0.62, 1.2);
    for (const s of [-1, 1]) m.rod("steel", [t.X(TANK[0] + 0.05), 1.45, s * (T_HALF + 0.06)], [t.X(TANK[0] + 0.05), 2.75, s * (T_HALF + 0.06)], 0.018, 6);
  });
  m.scope("water filler", () => t.cylY("black", 4.25, 0, 3.1, 3.28, 0.22, 12));
  m.scope("rear ladder", () => {
    const x = TANK[1] + 0.06;
    for (const z of [-0.3, 0.3]) m.rod("steel", [t.X(x), 1.35, z], [t.X(x), TANK_TOP, z], 0.018, 6);
    for (let i = 0; i < 4; i++) m.rod("steel", [t.X(x), 1.55 + i * 0.32, -0.3], [t.X(x), 1.55 + i * 0.32, 0.3], 0.014, 6);
  });
  m.scope("rear lamps", () => {
    for (const z of [0.95, -0.95]) brassLamp(t, -1, TANK[1] + 0.22, 1.302, z);
  });
}

function tender(): LocoSpec {
  return {
    title: "NS 3700 tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { y0: 0.74, y1: 1.3, length: [0.3, 0.6], half: 1.42 },
    prisms: [{ name: "tank", x0: TANK[0], x1: TANK[1], half: TANK_HALF }, { name: "coping", x0: TANK[0] + 0.005, x1: TANK[1] - 0.005, half: COPING_HALF }],
    coal: { x0: 0.6, x1: 3.5, y: TANK_TOP + 0.12, half: 1.3, rise: 0.3 },
    frame: { x0: 0.32, x1: T_END - 0.62, top: TANK_FOOT - 0.01 },
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 1.22, spokes: 12 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    extras: tenderExtras,
  };
}

/** The 3700's engine or tender spec, by the `unit` parameter's value. */
export function ns3700Spec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

/**
 * The spec its distant model is drawn from: the cab and the brass dome as the kit draws them,
 * the barrel run on to the cab in place of the firebox, so the black smokebox fits the budget.
 */
export function ns3700LodSpec(unit: string): LocoSpec {
  const s = ns3700Spec(unit);
  if (unit === "tender") return s;
  return { ...s, prisms: [], boiler: { ...s.boiler!, x1: CAB0 }, domes: [{ ...DOME, mat: "brass" }], cab: { x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 4.0, windows: SIDE_WINDOWS.map(([x0, x1]) => ({ x0, x1, y0: 3.05, y1: 3.88 })) } };
}
