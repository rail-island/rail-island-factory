// East Indian Railway No. 22 "Fairy Queen" (Kitson, Thompson and Hewitson,
// Leeds, 1855; 2-2-2WT, 5 ft 6 in gauge) as preserved and run by the National
// Rail Museum, New Delhi, and its small four-wheeled tender, drawn on the steam
// kit (steamLoco.ts) with their own parts, as the Rocket is (rocket.ts): the
// outside plate frames with their horn guides and a low footboard, the single
// 6 ft driving wheel under its green splasher lettered FAIRY QUEEN with the
// sandbox ahead of it, the outside cylinders slightly inclined beside the
// smokebox in a green casing that sweeps up to the smokebox top, the black
// smokebox door with its gold eight-pointed star in a brass ring, the tall black
// chimney with a blue base and a copper top and crown, the big headlamp before
// it, the black boiler with brass bands, the tall copper dome, the brass safety
// valve and whistle on the firebox, the green arched canopy on four yellow
// pillars with gold stars, waist-high cab side sheets, and the red buffer beam
// lettered EIR 22 over the bar guard. See docs/models/india-trains.md and
// assets/eir-fairy-queen/SOURCES.md.
//
// Every length is in metres along the vehicle from its front buffer heads
// (source x, growing rearward), y up from the rail top, z across (+ right).

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { buildLoco, type LocoSpec } from "./steamLoco.ts";
import { steamLocoLod } from "./lodSteam.ts";
import { axleHeight, type SteamWheel } from "./steamGear.ts";
import type { Pt, Steam } from "./steamParts.ts";
import { mirrored } from "./steamParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";

const mat = (color: string, roughness: number, metallic?: number): MaterialSpec => ({ color, roughness, ...(metallic ? { metallic } : {}) });

/** The museum's running livery (2017 photographs): green, black, brass, copper and a red beam. */
export const FQ_PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#2f9e55", 0.5),
  jacket: mat("#151517", 0.4),
  smokebox: mat("#1c1d22", 0.8),
  frame: mat("#1b1c1e", 0.7),
  black: mat("#18181a", 0.75),
  wheel: mat("#1d1e20", 0.65),
  brass: { color: "#c9a24a", metallic: 0.55, roughness: 0.3 },
  star: { color: "#d4ad55", metallic: 0.4, roughness: 0.35 },
  copper: { color: "#c27a4a", metallic: 0.5, roughness: 0.35 },
  blue: mat("#3b7cc0", 0.5),
  beam: mat("#c0242a", 0.55),
  yellow: mat("#e3bd2c", 0.5),
  plate: mat("#b3242a", 0.5),
  plateText: { color: "#d9b04a", metallic: 0.4, roughness: 0.35 },
  floor: mat("#5a4632", 0.85),
};

/** The engine's measures (source metres). */
export const FQ = {
  /** Over the buffer heads; the beams' outer faces 0.45 m inside them. */
  length: 7.7,
  beam: 0.45,
  /** Footplate top. */
  deck: 1.36,
  /** Leading, driving (6 ft) and trailing axles; 3 ft 6 in carrying wheels. */
  lead: { x: 2.0, d: 1.07 },
  driver: { x: 4.15, d: 1.83 },
  trail: { x: 6.3, d: 1.07 },
  /** Boiler centre line, barrel radius, smokebox front and the barrel's rear end. */
  boilerY: 1.95,
  barrelR: 0.5,
  smokeboxX: 0.65,
  barrelX1: 4.95,
  /** The smokebox casing's top and where its rear slope ends. */
  casingTop: 2.56,
  chimneyX: 1.15,
  chimneyTop: 3.98,
  domeX: 2.75,
  domeTop: 3.42,
  firebox: { x0: 4.95, x1: 5.85 },
  /** The canopy: from x0 to x1, eaves and crown. */
  canopy: { x0: 5.0, x1: 7.25, eaves: 3.3, crown: 3.62, half: 1.3 },
  /** Cylinders 12 in x 22 in: front cover, rear end, axis height at mid length, radius. */
  cylinder: { x0: 0.62, x1: 1.55, midY: 1.42, r: 0.2 },
  crank: 0.28,
  cylinderZ: 0.985,
  /** The outside frames' plates. */
  frameZ: [0.84, 0.88] as const,
} as const;

const LEAD: SteamWheel = { x: FQ.lead.x, d: FQ.lead.d, spokes: 12 };
const DRIVER: SteamWheel = { x: FQ.driver.x, d: FQ.driver.d, spokes: 18 };
const TRAIL: SteamWheel = { x: FQ.trail.x, d: FQ.trail.d, spokes: 12 };

/** The cylinders' incline: the axis through the driving axle and the cylinder's middle. */
export const FQ_INCLINE = Math.atan((FQ.cylinder.midY - axleHeight(DRIVER)) / (FQ.driver.x - (FQ.cylinder.x0 + FQ.cylinder.x1) / 2));

/** A rod between two source points (x, y, z). */
function rod(t: Steam, m: string, a: Vec3, b: Vec3, r: number, n = 6): void {
  t.m.rod(m, [t.X(a[0]), a[1], a[2]], [t.X(b[0]), b[1], b[2]], r, n);
}

/** A star of `n` points as triangles in (u, v) about (cu, cv). */
function star(n: number, cu: number, cv: number, outer: number, inner: number, rot = Math.PI / 2): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const P = (a: number, r: number): [number, number] => [cu + r * Math.cos(a), cv + r * Math.sin(a)];
  for (let k = 0; k < n; k++) {
    const a = rot + (k / n) * Math.PI * 2;
    const h = Math.PI / n;
    out.push([cu, cv], P(a - h, inner), P(a, outer), [cu, cv], P(a, outer), P(a + h, inner));
  }
  return out;
}

/** Convex hull (Andrew's monotone chain) of (z, y) points, counter-clockwise. */
function hull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 1e-12) lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 1e-12) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** The smokebox casing's section: the smokebox and both cylinder casings wrapped in one sheet, flat underneath. */
function casingSection(): Pt[] {
  const pts: Pt[] = [];
  const bottom = FQ.cylinder.midY - 0.25;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    pts.push([0.6 * Math.cos(a), FQ.boilerY + 0.6 * Math.sin(a)]);
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      pts.push([s * FQ.cylinderZ + 0.25 * Math.cos(a), Math.max(bottom, FQ.cylinder.midY + 0.25 * Math.sin(a))]);
    }
  }
  return hull(pts);
}

/** The text `text` on a vertical face at |z| = face on side s, centred at source x, its foot at y, reading from outside. */
function sideText(t: Steam, matName: string, s: number, x: number, y: number, text: string, face: number, h: number): void {
  const w = h * 0.58;
  const gap = h * 0.2;
  const width = strokeWidth(text, w, gap);
  const u0 = t.X(x) + (s > 0 ? -width / 2 : width / 2);
  t.m.facets(matName, strokeText(text, u0, y, h, w, gap, s < 0).map(([u, v]): Vec3 => [u, v, s * face]), [0, 0, s]);
}

/** The outside frames: plates with the horn guides of the carrying axles, axle boxes and springs, the footboard. */
function frames(t: Steam): void {
  const m = t.m;
  const [a, b] = FQ.frameZ;
  m.scope("frames", () => {
    for (const s of [-1, 1]) {
      const plate = (x0: number, x1: number, y0: number) => t.sideFrame("frame", s, x0, x1, y0, FQ.deck - 0.04, a, b);
      plate(FQ.beam + 0.15, 1.62, 0.72);
      plate(1.62, 2.38, 0.86);
      plate(2.38, 3.27, 0.58);
      // over the driver only a strip under the footplate: the crank turns below it
      plate(3.27, 5.03, 1.27);
      plate(5.03, 5.92, 0.58);
      plate(5.92, 6.68, 0.86);
      plate(6.68, FQ.length - FQ.beam - 0.15, 0.72);
      for (const w of [LEAD, TRAIL]) {
        const ay = axleHeight(w);
        m.scope("horn guides", () => {
          for (const dx of [-0.31, 0.31]) t.sideBox("frame", s, w.x + dx - 0.04, w.x + dx + 0.04, ay - 0.24, 0.87, a, b);
          t.sideBox("black", s, w.x - 0.27, w.x + 0.27, ay - 0.27, ay - 0.23, a, b);
        });
        m.scope("axle boxes", () => {
          t.sideBox("black", s, w.x - 0.16, w.x + 0.16, ay - 0.15, ay + 0.17, b, b + 0.08);
          t.sideBox("brass", s, w.x - 0.06, w.x + 0.06, ay - 0.05, ay + 0.05, b + 0.08, b + 0.095);
        });
        m.scope("springs", () => {
          t.sideBox("steel", s, w.x - 0.42, w.x + 0.42, ay + 0.24, ay + 0.29, b, b + 0.06);
          t.sideBox("steel", s, w.x - 0.26, w.x + 0.26, ay + 0.29, ay + 0.33, b, b + 0.06);
          t.sideBox("black", s, w.x - 0.05, w.x + 0.05, ay + 0.17, ay + 0.37, b - 0.005, b + 0.07);
        });
      }
      // the green feed pipe along the frame top, broken at the driver's crank
      m.scope("feed pipe", () => {
        for (const [x0, x1] of [[FQ.beam + 0.2, 3.2], [5.1, FQ.length - FQ.beam - 0.2]] as const) t.cylX("paint", x0, x1, s * 0.905, 1.21, 0.025, 6);
      });
      m.scope("footboard", () => {
        t.sideBox("black", s, 1.6, 7.0, 0.46, 0.5, 1.0, 1.32);
        t.sideBox("yellow", s, 1.6, 7.0, 0.462, 0.498, 1.32, 1.327);
        for (const x of [1.9, 2.75, 5.45, 6.75]) t.sideBox("black", s, x - 0.03, x + 0.03, 0.5, 0.62, b, 1.02);
      });
    }
    // the well tank between the frames behind the driver
    m.scope("well tank", () => t.box("black", 4.6, 5.55, 0.72, FQ.deck - 0.04, -0.6, 0.6));
  });
}

/** The footplate: the middle deck, the ledges outside the splashers and the cab floor. */
function footplate(t: Steam): void {
  const d = FQ.deck;
  const x0 = 1.85;
  const x1 = FQ.length - FQ.beam - 0.05;
  t.m.scope("footplate", () => {
    t.box("black", x0, x1, d - 0.04, d, -0.62, 0.62);
    for (const s of [-1, 1]) {
      // the outer ledge starts behind the slide bars
      t.sideBox("black", s, 2.6, x1, d - 0.04, d, 0.88, 1.13);
      t.sideBox("black", s, x0, 3.27, d - 0.04, d, 0.62, 0.88);
      t.sideBox("black", s, 5.03, x1, d - 0.04, d, 0.62, 0.88);
      // the brass edge of the ledge
      t.sideBox("brass", s, 2.6, x1, d - 0.04, d - 0.005, 1.13, 1.137);
    }
    t.box("floor", 5.9, x1, d, d + 0.02, -1.05, 1.05);
  });
}

/** The front buffer beam lettered EIR 22 (or the rear one), the big buffers, the coupling and the bar guard. */
function beamEnd(t: Steam, e: 1 | -1, head: number, text?: string): void {
  const m = t.m;
  const face = head + e * FQ.beam;
  const inner = face + e * 0.15;
  m.scope(e > 0 ? "front draw gear" : "rear draw gear", () => {
    m.scope("buffer beam", () => {
      t.box("beam", face, inner, 0.9, 1.3, -0.93, 0.93);
      // a yellow border round its face
      const X = t.X(face) + e * 0.003;
      const strip = (z0: number, z1: number, y0: number, y1: number) => m.slab("yellow", [[X, y0, z0], [X, y0, z1], [X, y1, z1], [X, y1, z0]], [-e * 0.01, 0, 0]);
      strip(-0.925, 0.925, 1.25, 1.295);
      strip(-0.925, 0.925, 0.905, 0.95);
      for (const s of [-1, 1]) strip(s * 0.88, s * 0.925, 0.95, 1.25);
      if (text) {
        // the letters left of the coupling, the number right of it
        const h = 0.17;
        const w = h * 0.58;
        const gap = h * 0.3;
        text.split(" ").forEach((word, i) => {
          const zc = i === 0 ? 0.42 : -0.42;
          const width = strokeWidth(word, w, gap);
          m.facets("yellow", strokeText(word, zc + width / 2, 1.02, h, w, gap, true).map(([u, v]): Vec3 => [X + e * 0.002, v, u]), [e, 0, 0]);
        });
      }
    });
    m.scope("buffers", () => {
      for (const s of [-1, 1]) {
        const z = s * 1.0;
        t.box("black", face - e * 0.03, face, 0.94, 1.26, z - 0.15, z + 0.15);
        t.cylX("black", face - e * 0.03, face - e * 0.3, z, 1.1, 0.1, 12);
        t.cylX("steel", face - e * 0.3, head + e * 0.05, z, 1.1, 0.07, 10);
        t.cylX("steel", head + e * 0.05, head, z, 1.1, 0.21, 16);
        t.cylX("black", head + e * 0.035, head + e * 0.0005, z, 1.1, 0.16, 16);
      }
    });
    m.scope("coupling", () => {
      t.box("steel", face, face - e * 0.3, 1.04, 1.14, -0.05, 0.05);
      t.box("steel", face - e * 0.3, face - e * 0.37, 0.88, 1.14, -0.035, 0.035);
    });
    if (e > 0) {
      m.scope("guard", () => {
        const [g0, g1] = [face - 0.01, face + 0.04];
        for (const s of [-1, 1]) {
          t.sideBox("black", s, g0, g1 + 0.03, 0.14, 0.9, 0.86, 0.95);
          // the hazard plates on the guard's corners
          t.sideBox("yellow", s, g0 - 0.006, g0, 0.15, 0.35, 0.74, 0.86);
        }
        t.box("black", g0, g1, 0.14, 0.22, -0.86, 0.86);
        t.box("black", g0, g1, 0.56, 0.6, -0.86, 0.86);
        for (let i = 0; i < 11; i++) {
          const z = -0.78 + (1.56 * i) / 10;
          t.box("black", g0 + 0.01, g1 - 0.01, 0.22, 0.9, z - 0.016, z + 0.016);
        }
      });
    }
  });
}

/** The smokebox casing, its door with the star, the brass ring and the front plate, and the cylinder covers' bosses. */
function smokebox(t: Steam): void {
  const m = t.m;
  const x0 = FQ.smokeboxX;
  const sec = casingSection();
  const halfW = Math.max(...sec.map((p) => Math.abs(p[0])));
  m.scope("smokebox casing", () => {
    t.volume({
      sec,
      plan: [[x0, halfW], [2.1, halfW]],
      top: [[x0, FQ.casingTop], [1.3, FQ.casingTop], [2.1, 1.48]],
      bottom: [[x0, 1.17], [1.35, 1.17], [1.6, 1.45], [2.1, 1.47]],
      bands: [[0.9, 2.6, "paint"]],
    });
  });
  m.scope("smokebox front", () => {
    const X = t.X(x0) + 0.004;
    // 1% inside the casing's outline, clear of its walls
    const cy = (Math.max(...sec.map((p) => p[1])) + Math.min(...sec.map((p) => p[1]))) / 2;
    m.slab("smokebox", sec.map(([z, y]): Vec3 => [X, cy + (y - cy) * 0.99, z * 0.99]), [-0.008, 0, 0]);
    // the door, its gold star, the brass ring round it
    t.cylX("smokebox", x0 - 0.06, x0, 0, FQ.boilerY, 0.47, 24);
    m.facets("star", star(8, 0, FQ.boilerY, 0.38, 0.15).map(([z, y]): Vec3 => [t.X(x0 - 0.06) + 0.004, y, z]), [1, 0, 0]);
    m.tube("brass", "x", 0, FQ.boilerY, 0.6, 0.52, t.X(x0 - 0.035), t.X(x0), 28);
    // the dart handle and the hinge
    t.box("brass", x0 - 0.1, x0 - 0.06, FQ.boilerY - 0.03, FQ.boilerY + 0.03, -0.05, 0.2);
    t.box("black", x0 - 0.09, x0 - 0.06, FQ.boilerY - 0.25, FQ.boilerY - 0.19, -0.5, 0.15);
    // small lamps beside the smokebox, over the cylinders
    for (const s of [-1, 1]) {
      t.box("black", x0 - 0.12, x0, 1.72, 1.9, s * 0.8 - 0.07, s * 0.8 + 0.07);
      t.cylX("brass", x0 - 0.125, x0 - 0.12, s * 0.8, 1.81, 0.05, 8);
    }
  });
  m.scope("cylinder bosses", () => {
    for (const s of [-1, 1]) {
      const y = axleHeight(DRIVER) + (FQ.driver.x - FQ.cylinder.x0 + 0.06) * Math.tan(FQ_INCLINE);
      t.cylX("black", FQ.cylinder.x0 - 0.05, FQ.cylinder.x0 + 0.01, s * FQ.cylinderZ, y, 0.09, 10);
      m.facets("star", star(5, s * FQ.cylinderZ, y, 0.15, 0.06).map(([z, yy]): Vec3 => [t.X(FQ.cylinder.x0 - 0.05) + 0.004, yy, z]), [1, 0, 0]);
    }
  });
}

/** The boiler barrel, its brass bands and handrails, the firebox in the cab, the dome, valves and whistle. */
function boiler(t: Steam): void {
  const m = t.m;
  const y = FQ.boilerY;
  const r = FQ.barrelR;
  m.scope("boiler", () => {
    m.scope("barrel", () => t.cylX("jacket", 1.6, FQ.barrelX1, 0, y, r, 24, false));
    m.scope("boiler bands", () => {
      for (const x of [2.15, 3.35, 4.3, 4.9]) t.cylX("brass", x - 0.025, x + 0.025, 0, y, r + 0.012, 24, false);
    });
    m.scope("handrails", () => {
      for (const s of [-1, 1]) {
        rod(t, "brass", [1.75, y + 0.28, s * 0.6], [5.0, y + 0.28, s * 0.6], 0.018);
        for (const x of [2.0, 3.0, 4.1]) rod(t, "brass", [x, y + 0.28, s * 0.6], [x, y + 0.24, s * 0.44], 0.012, 4);
      }
    });
    m.scope("firebox", () => {
      const f = FQ.firebox;
      const half: Pt[] = [[0.62, FQ.deck], [0.62, 2.0], [0.58, 2.25], [0.45, 2.42], [0.25, 2.52], [0, 2.55]];
      t.section("jacket", f.x0, f.x1, mirrored(half));
      for (const x of [f.x0 + 0.02, f.x1 - 0.02]) t.section("brass", x - 0.02, x + 0.02, mirrored(half.map(([z, yy]): Pt => [z + 0.012, yy === FQ.deck ? yy + 0.01 : yy + 0.012])), false);
      // the back plate: the fire door, the regulator and two gauge glasses
      t.endPanel("black", -1, f.x1, -0.2, 0.2, 1.55, 1.85, 0.03);
      t.box("brass", f.x1, f.x1 + 0.05, 2.15, 2.2, -0.3, 0.05);
      for (const z of [-0.3, 0.3]) t.box("brass", f.x1, f.x1 + 0.04, 1.95, 2.35, z - 0.025, z + 0.025);
    });
    m.scope("dome", () => {
      const X = t.X(FQ.domeX);
      const ring = (rr: number) => ngon(20, rr, 0, X, 0);
      m.loft("blue", ring(0.37), y + 0.3, ring(0.36), y + 0.55, false);
      m.loft("copper", ring(0.34), y + 0.54, ring(0.3), y + 0.72, false);
      m.loft("copper", ring(0.3), y + 0.72, ring(0.31), FQ.domeTop - 0.3, false);
      m.loft("copper", ring(0.31), FQ.domeTop - 0.3, ring(0.27), FQ.domeTop - 0.12, false);
      m.loft("copper", ring(0.27), FQ.domeTop - 0.12, ring(0.12), FQ.domeTop, true);
    });
    m.scope("safety valve", () => {
      const x = 5.35;
      t.cylY("brass", x, 0, 2.5, 2.82, 0.08, 10);
      t.cylY("brass", x, 0, 2.82, 2.88, 0.11, 10);
      rod(t, "brass", [x, 2.86, 0], [x + 0.42, 2.78, 0], 0.02, 4);
      t.cylY("brass", x + 0.42, 0, 2.5, 2.8, 0.03, 6);
    });
    m.scope("whistle", () => {
      t.cylY("brass", 5.7, 0.2, 2.45, 2.85, 0.025, 6);
      t.cylY("brass", 5.7, 0.2, 2.85, 3.0, 0.06, 10);
    });
  });
}

/** The tall chimney: a blue flared base on the casing, the black stack, the copper top and its crown; the big headlamp before it. */
function chimney(t: Steam): void {
  const m = t.m;
  const X = t.X(FQ.chimneyX);
  const top = FQ.chimneyTop;
  const r = 0.19;
  const lip = top - 0.12;
  m.emit("smoke", [X, top, 0], r);
  m.scope("chimney", () => {
    m.scope("base", () => m.loft("blue", ngon(18, 0.36, 0, X, 0), FQ.casingTop - 0.06, ngon(18, r + 0.02, 0, X, 0), 2.92, false));
    m.scope("stack", () => m.prism("smokebox", ngon(18, r, 0, X, 0), 2.9, 3.42, false));
    m.scope("copper top", () => {
      m.loft("copper", ngon(18, r + 0.01, 0, X, 0), 3.4, ngon(18, r + 0.04, 0, X, 0), lip - 0.04, false);
      m.prism("brass", ngon(18, r + 0.07, 0, X, 0), lip - 0.04, lip, true);
    });
    m.scope("crown", () => {
      // eight petals flaring out from the lip, their tips at the top
      const rr = r + 0.06;
      for (let k = 0; k < 8; k++) {
        const a0 = (k / 8) * Math.PI * 2;
        const a1 = ((k + 1) / 8) * Math.PI * 2;
        const am = (a0 + a1) / 2;
        const p = (a: number, rad: number, yy: number): Vec3 => [X + rad * Math.cos(a), yy, rad * Math.sin(a)];
        m.slab("copper", [p(a0 + 0.03, rr, lip), p(a1 - 0.03, rr, lip), p(am, rr + 0.1, top)], [-Math.cos(am) * 0.02, 0, -Math.sin(am) * 0.02]);
      }
    });
  });
  m.scope("headlamp", () => {
    const y = 2.98;
    t.box("black", 0.72, 0.9, FQ.casingTop - 0.02, y - 0.2, -0.06, 0.06);
    t.cylX("black", 0.5, FQ.chimneyX - r + 0.02, 0, y, 0.25, 16);
    m.tube("brass", "x", 0, y, 0.265, 0.2, t.X(0.52), t.X(0.47), 16);
    t.cylX("lampHead", 0.52, 0.505, 0, y, 0.2, 16);
    // the hood over the lens
    t.box("black", 0.38, 0.515, y + 0.23, y + 0.27, -0.24, 0.24);
  });
}

/** The driving wheel's splasher lettered FAIRY QUEEN with brass beading, the sandbox ahead of it. */
function splashers(t: Steam): void {
  const m = t.m;
  const cx = FQ.driver.x;
  const cy = axleHeight(DRIVER);
  const R = 0.96;
  const base = FQ.deck;
  const a0 = Math.asin((base - cy) / R);
  const n = 14;
  const arc: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - a0 - ((Math.PI - 2 * a0) * i) / n;
    arc.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  const ring = arc.map(([x, y]): [number, number] => [t.X(x), y]);
  m.scope("splashers", () => {
    for (const s of [-1, 1]) {
      const [z0, z1] = s > 0 ? [0.64, 0.88] : [-0.88, -0.64];
      m.sweep("paint", "z", ring, z0, ring, z1);
      m.scope("beading", () => {
        for (let i = 0; i < n; i++) {
          const [xa, ya] = arc[i]!;
          const [xb, yb] = arc[i + 1]!;
          rod(t, "brass", [xa, ya, s * 0.885], [xb, yb, s * 0.885], 0.014, 4);
        }
      });
      m.scope("name", () => sideText(t, "brass", s, cx, 1.56, "FAIRY QUEEN", 0.884, 0.085));
      m.scope("sandbox", () => {
        t.sideBox("paint", s, 2.82, 3.28, base, 1.7, 0.64, 0.88);
        t.sideBox("brass", s, 2.86, 3.24, 1.7, 1.73, 0.68, 0.84);
      });
    }
  });
}

/** The arched canopy on four pillars, its valances and stars, the cab side sheets and their handrails and plates. */
function cab(t: Steam): void {
  const m = t.m;
  const c = FQ.canopy;
  const roof: Pt[] = [[c.half, c.eaves], [1.0, 3.46], [0.6, 3.56], [0.25, 3.61], [0, c.crown]];
  const th = 0.04;
  m.scope("canopy", () => {
    for (const s of [-1, 1]) {
      for (let i = 0; i + 1 < roof.length; i++) {
        const [za, ya] = roof[i]!;
        const [zb, yb] = roof[i + 1]!;
        t.section("paint", c.x0, c.x1, [[s * za, ya - th], [s * zb, yb - th], [s * zb, yb], [s * za, ya]]);
      }
      // the valance along the side, a brass edge under it and three gold stars
      t.sideBox("paint", s, c.x0, c.x1, c.eaves - 0.2, c.eaves - th, c.half - 0.03, c.half);
      t.sideBox("brass", s, c.x0, c.x1, c.eaves - 0.215, c.eaves - 0.2, c.half - 0.03, c.half + 0.003);
      for (const x of [5.45, 6.12, 6.8]) {
        m.facets("star", star(5, t.X(x), c.eaves - 0.12, 0.075, 0.03).map(([u, v]): Vec3 => [u, v, s * (c.half + 0.003)]), [0, 0, s]);
      }
    }
    // the arched boards at both ends, stars on the front one
    for (const [x, e] of [[c.x0, 1], [c.x1, -1]] as const) {
      const X = t.X(x);
      const outline: Vec3[] = [[X, c.eaves - 0.2, -c.half], [X, c.eaves - 0.2, c.half], ...roof.map(([z, y]): Vec3 => [X, y - 0.001, z]), ...[...roof].reverse().slice(1).map(([z, y]): Vec3 => [X, y - 0.001, -z])];
      m.slab("paint", outline, [-e * 0.03, 0, 0]);
      m.slab("brass", [[X + e * 0.002, c.eaves - 0.215, -c.half], [X + e * 0.002, c.eaves - 0.215, c.half], [X + e * 0.002, c.eaves - 0.2, c.half], [X + e * 0.002, c.eaves - 0.2, -c.half]], [-e * 0.034, 0, 0]);
      if (e > 0) for (const z of [-0.75, 0, 0.75]) m.facets("star", star(5, z, 3.3, 0.09, 0.036).map(([u, v]): Vec3 => [X + 0.003, v, u]), [1, 0, 0]);
    }
  });
  m.scope("pillars", () => {
    for (const x of [c.x0 + 0.12, c.x1 - 0.12]) for (const s of [-1, 1]) t.cylY("yellow", x, s * 1.1, FQ.deck, c.eaves - th, 0.035, 8, false);
  });
  m.scope("cab sides", () => {
    for (const s of [-1, 1]) {
      t.sideBox("paint", s, 5.3, 7.13, FQ.deck, 2.42, 1.07, 1.11);
      t.sideBox("brass", s, 5.3, 7.13, 2.42, 2.45, 1.065, 1.115);
      // lined panels, the handrails at the openings, the number plate
      for (const [x0, x1] of [[5.4, 6.1], [6.2, 7.03]] as const) {
        t.sideBox("brass", s, x0, x1, 1.5, 1.52, 1.11, 1.114);
        t.sideBox("brass", s, x0, x1, 2.26, 2.28, 1.11, 1.114);
        t.sideBox("brass", s, x0, x0 + 0.02, 1.52, 2.26, 1.11, 1.114);
        t.sideBox("brass", s, x1 - 0.02, x1, 1.52, 2.26, 1.11, 1.114);
      }
      t.sidePlate(s, 5.75, 1.82, "22", 1.114, 0.11);
      for (const x of [5.25, 7.17]) t.cylY("yellow", x, s * 1.09, FQ.deck + 0.1, 2.75, 0.017, 6);
      // the step under the cab entrance
      t.sideBox("black", s, 7.0, 7.2, 0.7, 0.74, 1.0, 1.3);
      t.sideBox("black", s, 7.16, 7.2, 0.74, FQ.deck - 0.04, 1.0, 1.04);
    }
  });
}

/** The engine's spec: the kit draws the wheels, cylinders and motion; the body is this module's (`extras`). */
function engineSpec(): LocoSpec {
  const { x0, x1, r } = FQ.cylinder;
  return {
    title: "Fairy Queen",
    palette: FQ_PALETTE,
    heads: [0, FQ.length],
    beams: { front: false, rear: false },
    gear: {
      wheels: [LEAD, DRIVER, TRAIL],
      engines: [{ coupled: [1], main: 1, cylinder: { x0: x1, x1: x0, y: 0, r, incline: FQ_INCLINE }, crank: FQ.crank, phase: 0.4, valveGear: false }],
      cylinderZ: FQ.cylinderZ,
      reference: 1,
      wheelMaterial: "wheel",
      cylinderMat: "paint",
      cylinderCoverMat: "brass",
    },
    extras: (t) => {
      frames(t);
      footplate(t);
      beamEnd(t, 1, 0, "EIR 22");
      beamEnd(t, -1, FQ.length);
      smokebox(t);
      boiler(t);
      chimney(t);
      splashers(t);
      cab(t);
    },
  };
}

/** The engine from afar: smokebox and boiler, chimney, dome, canopy, cab sides, footplate and frames. */
function engineLodSpec(): LocoSpec {
  const c = FQ.canopy;
  return {
    ...engineSpec(),
    // the barrel black ("paint" is the green): the LOD reads a boiler's `paint`
    boiler: { x0: FQ.smokeboxX, x1: FQ.firebox.x1, y: FQ.boilerY, r: FQ.barrelR + 0.04, smokebox: 1.0, paint: "jacket" } as NonNullable<LocoSpec["boiler"]>,
    chimney: { x: FQ.chimneyX, top: FQ.chimneyTop - 0.1, r: 0.22, mat: "smokebox" },
    domes: [{ x: FQ.domeX, top: FQ.domeTop, r: 0.32, mat: "copper" }],
    prisms: [
      { name: "smokebox casing", x0: FQ.smokeboxX + 0.02, x1: 1.6, half: [[1.23, 1.17], [1.23, 1.67], [0.62, FQ.casingTop]] },
      { name: "canopy", x0: c.x0, x1: c.x1, half: [[c.half, c.eaves - 0.2], [c.half, c.eaves], [0.6, 3.56], [0.05, c.crown]] },
      { name: "cab sides", x0: 5.3, x1: 7.13, half: [[1.11, FQ.deck], [1.11, 2.42]] },
      { name: "splashers", x0: 3.3, x1: 5.0, half: [[0.88, FQ.deck], [0.88, 1.85]] },
    ],
    runningBoard: { profile: [[FQ.beam, FQ.deck], [FQ.length - FQ.beam, FQ.deck]], half: 1.13, valance: 0.3 },
    frame: { x0: FQ.beam, x1: FQ.length - FQ.beam, top: FQ.deck - 0.04 },
    extras: undefined,
  };
}

/** The tender's measures: a small four-wheeled water tender with a coal space at its front. */
export const FQ_TENDER = {
  length: 4.7,
  beam: 0.3,
  axles: [1.35, 3.45] as const,
  wheelD: 1.0,
  tank: { x0: 0.45, x1: 4.25, y0: 1.28, y1: 2.15, half: 1.15 },
} as const;

function tenderExtras(t: Steam): void {
  const m = t.m;
  const T = FQ_TENDER;
  const k = T.tank;
  m.scope("frame", () => {
    for (const s of [-1, 1]) t.sideFrame("frame", s, k.x0, k.x1, 0.85, k.y0 - 0.04, 0.86, 0.92);
    t.box("black", k.x0, k.x1, k.y0 - 0.04, k.y0, -1.05, 1.05);
    for (const s of [-1, 1]) t.cylX("paint", k.x0 + 0.05, k.x1 - 0.05, s * 0.94, 1.18, 0.025, 6);
  });
  m.scope("tank lining", () => {
    for (const s of [-1, 1]) {
      t.sideBox("brass", s, k.x0 + 0.1, k.x1 - 0.1, k.y1 - 0.12, k.y1 - 0.1, k.half, k.half + 0.004);
      t.sideBox("brass", s, k.x0 + 0.1, k.x1 - 0.1, k.y0 + 0.1, k.y0 + 0.12, k.half, k.half + 0.004);
      t.sideBox("brass", s, k.x0 + 0.1, k.x0 + 0.12, k.y0 + 0.12, k.y1 - 0.12, k.half, k.half + 0.004);
      t.sideBox("brass", s, k.x1 - 0.12, k.x1 - 0.1, k.y0 + 0.12, k.y1 - 0.12, k.half, k.half + 0.004);
      sideText(t, "brass", s, (k.x0 + k.x1) / 2, 1.6, "E I R", k.half + 0.004, 0.16);
    }
  });
  m.scope("tank top", () => {
    // the coal rails round the front well, the filler on the tank
    for (const s of [-1, 1]) t.sideBox("black", s, k.x0, 1.9, k.y1, k.y1 + 0.18, k.half - 0.04, k.half);
    t.box("black", k.x0, k.x0 + 0.04, k.y1, k.y1 + 0.18, -k.half, k.half);
    t.cylY("black", 3.4, 0, k.y1, k.y1 + 0.12, 0.22, 12);
  });
  m.scope("front beam", () => {
    t.box("beam", 0.3, 0.45, 0.9, 1.28, -0.95, 0.95);
    for (const s of [-1, 1]) {
      t.cylX("black", 0.3, 0.12, s * 1.0, 1.1, 0.09, 10);
      t.cylX("steel", 0.12, 0, s * 1.0, 1.1, 0.18, 14);
    }
    t.box("steel", 0, 0.3, 1.04, 1.14, -0.05, 0.05);
  });
  m.scope("rear beam", () => {
    const L = T.length;
    t.box("beam", L - 0.45, L - 0.3, 0.9, 1.28, -0.95, 0.95);
    for (const s of [-1, 1]) {
      t.cylX("black", L - 0.3, L - 0.12, s * 1.0, 1.1, 0.09, 10);
      t.cylX("steel", L - 0.12, L, s * 1.0, 1.1, 0.18, 14);
    }
    t.box("steel", L - 0.3, L - 0.15, 1.04, 1.14, -0.05, 0.05);
    t.lamp(-1, L - 0.45, 2.15, 0.7);
  });
}

function tenderSpec(): LocoSpec {
  const T = FQ_TENDER;
  const k = T.tank;
  return {
    title: "Fairy Queen tender",
    palette: FQ_PALETTE,
    heads: [0, T.length],
    beams: { front: false, rear: false },
    prisms: [{ name: "tank", x0: k.x0, x1: k.x1, half: [[k.half, k.y0], [k.half, k.y1 - 0.06], [k.half - 0.05, k.y1]] }],
    coal: { x0: k.x0 + 0.1, x1: 1.85, y: k.y1, half: k.half - 0.12, rise: 0.22 },
    gear: {
      wheels: T.axles.map((x) => ({ x, d: T.wheelD, spokes: 10, outsideBoxes: true })),
      engines: [],
      cylinderZ: 1.1,
      reference: 0,
      wheelMaterial: "wheel",
    },
    extras: (t) => tenderExtras(t),
  };
}

function tenderLodSpec(): LocoSpec {
  const k = FQ_TENDER.tank;
  return { ...tenderSpec(), frame: { x0: k.x0, x1: k.x1, top: k.y0 }, extras: undefined };
}

export const fairyQueenSpec = (unit: string): LocoSpec => (unit === "tender" ? tenderSpec() : engineSpec());
export const fairyQueenLodSpec = (unit: string): LocoSpec => (unit === "tender" ? tenderLodSpec() : engineLodSpec());
export const buildFairyQueen = (unit: string): MeshBuilder => buildLoco(fairyQueenSpec(unit));
export const buildFairyQueenLod = (unit: string): MeshBuilder => steamLocoLod(fairyQueenLodSpec(unit));
