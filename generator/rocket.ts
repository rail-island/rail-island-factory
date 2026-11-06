// Stephenson's Rocket (1829) and its tender, drawn on the steam kit
// (steamLoco.ts) with their own parts: the level boiler with the black
// smokebox at its front, the tall white chimney with its crown and stays, the
// firebox at the rear, the two cylinders inclined at 35 degrees beside the
// firebox driving the front wheels, the bar frame with its springs, and the
// four-wheeled tender with its slatted sides, the coke and the water barrel.
// See docs/models/uk-trains.md and assets/rocket/SOURCES.md.
//
// Every length is in metres along the vehicle from its front end (source x,
// growing rearward), as the steam kit takes them.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { buildLoco, type LocoSpec } from "./steamLoco.ts";
import { steamLocoLod } from "./lodSteam.ts";
import { axleHeight, type SteamWheel } from "./steamGear.ts";
import type { Pt, Steam } from "./steamParts.ts";
import { mirrored } from "./steamParts.ts";

const mat = (color: string, roughness: number, metallic?: number): MaterialSpec => ({ color, roughness, ...(metallic ? { metallic } : {}) });

/** The 1829 colours: yellow, black and a white chimney. */
export const ROCKET_PALETTE: Record<string, MaterialSpec> = {
  paint: mat("#e6b422", 0.55),
  wheel: mat("#e6b422", 0.6),
  wood: mat("#c99a1c", 0.7),
  frame: mat("#1d1e20", 0.65),
  black: mat("#18181a", 0.75),
  smokebox: mat("#1c1d22", 0.85),
  tyre: mat("#2c2d30", 0.45, 0.3),
  white: mat("#ece9e0", 0.6),
  copper: mat("#b8733a", 0.35, 0.5),
  deck: mat("#6b4a2b", 0.85),
  lining: mat("#a51a1f", 0.55),
};

/** The engine's measures (source metres). */
export const ROCKET = {
  /** Over the end beams. */
  length: 3.75,
  /** Driving wheels 4 ft 8.5 in, trailing 2 ft 6 in, 7 ft 2 in apart. */
  driverX: 0.95,
  driverD: 1.435,
  trailX: 0.95 + 2.18,
  trailD: 0.76,
  /** The boiler: 6 ft long, 3 ft 4 in across. */
  boiler: { x0: 0.62, x1: 2.45, y: 1.55, r: 0.51 },
  /** The chimney's axis and its crown's tips (the gauge's 4.0 m with a margin). */
  chimneyX: 0.56,
  chimneyTop: 3.96,
  /** The cylinders' incline and their ends' distances from the driving axle along it. */
  incline: (35 * Math.PI) / 180,
  cylinder: { near: 1.45, far: 2.1, r: 0.13 },
  /** Half the 16.5 in stroke. */
  crank: 0.21,
  /** The cylinders' and the rods' plane. */
  cylinderZ: 0.985,
  firebox: { x0: 2.45, x1: 3.3 },
} as const;

/** The tender's measures. */
export const ROCKET_TENDER = {
  length: 3.3,
  wheelD: 0.9,
  axles: [0.8, 2.5] as const,
  barrel: { x: 2.3, y: 1.74, r: 0.56, half: 0.6 },
} as const;

const DRIVER: SteamWheel = { x: ROCKET.driverX, d: ROCKET.driverD, spokes: 12 };
const TRAILER: SteamWheel = { x: ROCKET.trailX, d: ROCKET.trailD, spokes: 10 };

/** Source (x, y) on the cylinder's axis, `t` metres out from the driving axle. */
export function cylinderAxis(t: number): Pt {
  const ay = axleHeight(DRIVER);
  return [ROCKET.driverX + t * Math.cos(ROCKET.incline), ay + t * Math.sin(ROCKET.incline)];
}

/** The firebox's right half section: square sides, a rounded top. */
const FIREBOX: Pt[] = [[0.47, 0.62], [0.47, 1.72], [0.43, 1.84], [0.32, 1.92], [0.16, 1.96], [0, 1.97]];

/** A rod between two source points (x, y, z). */
function rod(t: Steam, m: string, a: Vec3, b: Vec3, r: number, n = 6): void {
  t.m.rod(m, [t.X(a[0]), a[1], a[2]], [t.X(b[0]), b[1], b[2]], r, n);
}

/** The bar frame inside the wheels, the horn guides and axle boxes, the springs above them, the end beams. */
function frame(t: Steam): void {
  const m = t.m;
  m.scope("frames", () => {
    for (const s of [-1, 1]) t.sideBox("frame", s, 0.1, ROCKET.length - 0.1, 0.84, 1.0, 0.53, 0.62);
    for (const w of [DRIVER, TRAILER]) {
      const ay = axleHeight(w);
      for (const s of [-1, 1]) {
        m.scope("horn guides", () => {
          for (const dx of [-0.16, 0.16]) t.sideBox("frame", s, w.x + dx - 0.03, w.x + dx + 0.03, ay - 0.2, 0.84, 0.54, 0.61);
          t.sideBox("black", s, w.x - 0.13, w.x + 0.13, ay - 0.13, ay + 0.15, 0.545, 0.605);
        });
        m.scope("springs", () => {
          // a leaf spring on the frame, its buckle over the axle box
          const half = w === DRIVER ? 0.42 : 0.32;
          t.sideBox("steel", s, w.x - half, w.x + half, 1.0, 1.05, 0.55, 0.6);
          t.sideBox("steel", s, w.x - half * 0.6, w.x + half * 0.6, 1.05, 1.09, 0.55, 0.6);
          t.sideBox("black", s, w.x - 0.05, w.x + 0.05, 0.98, 1.13, 0.54, 0.61);
        });
      }
    }
  });
  m.scope("end beams", () => {
    t.box("wood", 0, 0.1, 0.76, 1.06, -0.85, 0.85);
    t.box("wood", ROCKET.length - 0.1, ROCKET.length, 0.76, 1.14, -0.85, 0.85);
    // the drawbar to the tender
    t.box("steel", ROCKET.length, ROCKET.length + 0.12, 0.84, 0.94, -0.08, 0.08);
  });
}

/** The boiler barrel and its bands, the smokebox closing its front, safety valves, feed and steam pipes. */
function boiler(t: Steam): void {
  const m = t.m;
  const b = ROCKET.boiler;
  m.scope("boiler", () => {
    m.scope("barrel", () => t.cylX("paint", b.x0, b.x1, 0, b.y, b.r, 24, false));
    m.scope("boiler bands", () => {
      for (const x of [1.05, 1.55, 2.05]) t.cylX("black", x - 0.025, x + 0.025, 0, b.y, b.r + 0.012, 24, false);
    });
    m.scope("smokebox", () => {
      t.cylX("smokebox", 0.42, b.x0 + 0.02, 0, b.y, b.r + 0.04, 24);
      // the front plate's rim and the cleaning door
      t.cylX("black", 0.4, 0.42, 0, b.y, b.r + 0.06, 24);
      t.endPanel("frame", 1, 0.4, -0.18, 0.18, b.y - 0.36, b.y - 0.06, 0.03);
    });
    m.scope("safety valves", () => {
      for (const x of [1.3, 2.15]) {
        t.cylY("copper", x, 0, b.y + b.r - 0.05, b.y + b.r + 0.2, 0.08, 10);
        t.cylY("copper", x, 0, b.y + b.r + 0.2, b.y + b.r + 0.26, 0.11, 10);
      }
    });
    m.scope("steam pipes", () => {
      // from the firebox's top to each cylinder's upper end, the exhaust forward to the chimney's base
      for (const s of [-1, 1]) {
        const [cx, cy] = cylinderAxis(ROCKET.cylinder.far - 0.08);
        rod(t, "copper", [2.6, 1.98, s * 0.2], [cx, cy + 0.15, s * (ROCKET.cylinderZ - 0.06)], 0.035);
        rod(t, "copper", [cx - 0.1, cy - 0.05, s * (ROCKET.cylinderZ - 0.12)], [0.5, b.y + 0.1, s * (b.r + 0.02)], 0.035);
      }
    });
  });
}

/** The tall chimney: a black base on the smokebox, the white stack with its bands, the crown, its stays. */
function chimney(t: Steam): void {
  const m = t.m;
  const x = ROCKET.chimneyX;
  const X = t.X(x);
  const b = ROCKET.boiler;
  const r = 0.2;
  const lip = ROCKET.chimneyTop - 0.17;
  m.emit("smoke", [X, lip, 0], r);
  m.scope("chimney", () => {
    m.scope("base", () => {
      m.loft("smokebox", ngon(20, 0.4, 0, X, 0), b.y + b.r - 0.1, ngon(20, 0.22, 0, X, 0), b.y + b.r + 0.32, false);
      m.prism("smokebox", ngon(20, 0.22, 0, X, 0), b.y + b.r + 0.32, b.y + b.r + 0.45, false);
    });
    m.scope("stack", () => {
      m.prism("white", ngon(20, r, 0, X, 0), b.y + b.r + 0.4, lip - 0.06, false);
      for (const y of [2.75, 3.3]) m.prism("white", ngon(20, r + 0.015, 0, X, 0), y - 0.03, y + 0.03, false);
      // the cleaning door on the stack's front
      m.slab("smokebox", [[X + r - 0.01, 2.25, -0.1], [X + r - 0.01, 2.25, 0.1], [X + r - 0.01, 2.5, 0.1], [X + r - 0.01, 2.5, -0.1]].map((p) => p as Vec3), [0.04, 0, 0]);
    });
    m.scope("crown", () => {
      m.loft("white", ngon(20, r, 0, X, 0), lip - 0.06, ngon(20, r + 0.05, 0, X, 0), lip, false);
      // eight petals flaring out from the lip, their tips at the top
      for (let k = 0; k < 8; k++) {
        const a0 = (k / 8) * Math.PI * 2;
        const a1 = ((k + 1) / 8) * Math.PI * 2;
        const am = (a0 + a1) / 2;
        const rr = r + 0.05;
        const p = (a: number, rad: number, y: number): Vec3 => [X + rad * Math.cos(a), y, rad * Math.sin(a)];
        const tip = p(am, rr + 0.05, ROCKET.chimneyTop);
        const outline: Vec3[] = [p(a0 + 0.04, rr, lip - 0.01), p(a1 - 0.04, rr, lip - 0.01), tip];
        m.slab("white", outline, [-Math.cos(am) * 0.02, 0, -Math.sin(am) * 0.02]);
      }
    });
    m.scope("stays", () => {
      // two stays back to the firebox's top corners and two forward to the front beam
      for (const s of [-1, 1]) {
        rod(t, "black", [x + 0.12, 3.4, s * 0.12], [ROCKET.firebox.x1 - 0.1, 1.94, s * 0.25], 0.018);
        rod(t, "black", [x - 0.1, 2.9, s * 0.15], [0.05, 1.06, s * 0.7], 0.018);
      }
    });
  });
}

/** The firebox behind the boiler, its fire door, the brackets carrying the cylinders, the footplate. */
function firebox(t: Steam): void {
  const m = t.m;
  const f = ROCKET.firebox;
  m.scope("firebox", () => {
    t.section("paint", f.x0, f.x1, mirrored(FIREBOX));
    // a red lining round a panel on each side, the fire door at the back
    for (const s of [-1, 1]) {
      const [a, b, y0, y1, w] = [f.x0 + 0.08, f.x1 - 0.08, 0.76, 1.62, 0.03];
      t.sidePanel(FIREBOX, "lining", s, a, b, y0, y0 + w, 0.004, 0.01);
      t.sidePanel(FIREBOX, "lining", s, a, b, y1 - w, y1, 0.004, 0.01);
      t.sidePanel(FIREBOX, "lining", s, a, a + w, y0 + w, y1 - w, 0.004, 0.01);
      t.sidePanel(FIREBOX, "lining", s, b - w, b, y0 + w, y1 - w, 0.004, 0.01);
    }
    t.endPanel("black", -1, f.x1, -0.18, 0.18, 1.05, 1.4, 0.03);
    // the regulator handle and the water gauge on the back plate
    t.box("copper", f.x1, f.x1 + 0.04, 1.55, 1.6, -0.25, 0.1);
    t.box("copper", f.x1, f.x1 + 0.03, 1.4, 1.75, 0.25, 0.29);
  });
  m.scope("cylinder brackets", () => {
    for (const s of [-1, 1]) {
      const [x, y] = cylinderAxis((ROCKET.cylinder.near + ROCKET.cylinder.far) / 2);
      t.sideBox("frame", s, x - 0.12, x + 0.12, y - 0.32, y - 0.12, 0.47, ROCKET.cylinderZ - 0.09);
      t.sideBox("frame", s, x - 0.04, x + 0.04, 1.0, y - 0.32, 0.56, 0.62);
    }
  });
  m.scope("footplate", () => t.box("deck", f.x1, ROCKET.length - 0.1, 1.14, 1.19, -0.8, 0.8));
}

/** The engine's spec: the kit draws the running gear; the body is this module's (`extras`). */
function engineSpec(): LocoSpec {
  const { near, far, r } = ROCKET.cylinder;
  const [x0] = cylinderAxis(near);
  const [x1] = cylinderAxis(far);
  return {
    title: "Stephenson's Rocket",
    palette: ROCKET_PALETTE,
    heads: [0, ROCKET.length],
    beams: { front: false, rear: false },
    gear: {
      wheels: [DRIVER, TRAILER],
      engines: [{ coupled: [0], main: 0, cylinder: { x0, x1, y: 0, r, incline: ROCKET.incline }, crank: ROCKET.crank, phase: 0.3, valveGear: false }],
      cylinderZ: ROCKET.cylinderZ, reference: 0, wheelMaterial: "wheel",
    },
    extras: (t) => {
      frame(t);
      boiler(t);
      chimney(t);
      firebox(t);
    },
  };
}

/** The engine as the low level of detail reads it: boiler, smokebox, chimney, firebox and frame. */
function engineLodSpec(): LocoSpec {
  const b = ROCKET.boiler;
  return {
    ...engineSpec(),
    beams: { front: false, rear: false },
    boiler: { x0: 0.42, x1: b.x1, y: b.y, r: b.r, smokebox: b.x0 - 0.42 },
    chimney: { x: ROCKET.chimneyX, top: ROCKET.chimneyTop - 0.1, r: 0.22, mat: "white" },
    prisms: [{ name: "firebox", x0: ROCKET.firebox.x0, x1: ROCKET.firebox.x1, half: FIREBOX }],
    frame: { x0: 0.1, x1: ROCKET.length - 0.1, top: 1.0 },
    extras: undefined,
  };
}

/** The tender's frame outside its wheels: solebars, W-irons, the deck, the end beams. */
function tenderFrame(t: Steam): void {
  const m = t.m;
  const L = ROCKET_TENDER.length;
  m.scope("frame", () => {
    for (const s of [-1, 1]) t.sideBox("wood", s, 0.08, L - 0.08, 0.76, 0.98, 0.88, 0.98);
    m.scope("axle guards", () => {
      const ay = (ROCKET_TENDER.wheelD / 2) * Math.cos(Math.PI / 20);
      for (const x of ROCKET_TENDER.axles) for (const s of [-1, 1]) for (const dx of [-0.24, 0.24]) {
        rod(t, "black", [x + dx, 0.76, s * 0.97], [x + dx * 0.45, ay - 0.1, s * 0.97], 0.02, 4);
      }
    });
    t.box("deck", 0.08, L - 0.08, 0.98, 1.04, -1.0, 1.0);
    t.box("wood", 0, 0.08, 0.72, 1.04, -0.95, 0.95);
    t.box("wood", L - 0.08, L, 0.72, 1.04, -0.95, 0.95);
    // the drawbar's eye at the front, two dumb buffers at the rear
    t.box("steel", -0.1, 0, 0.84, 0.94, -0.08, 0.08);
    for (const s of [-1, 1]) t.sideBox("black", s, L, L + 0.1, 0.78, 0.98, 0.6, 0.8);
  });
}

/** Slatted sides and ends on posts. */
function tenderSides(t: Steam): void {
  const m = t.m;
  const L = ROCKET_TENDER.length;
  const y0 = 1.04;
  const top = 1.55;
  m.scope("sides", () => {
    for (const s of [-1, 1]) {
      // the planks, a gap between each pair, and the posts proud of them
      for (const [a, b] of [[y0, 1.2], [1.24, 1.38], [1.42, top]] as const) t.sideBox("paint", s, 0.12, L - 0.12, a, b, 0.94, 0.97);
      for (let i = 0; i <= 6; i++) {
        const x = 0.1 + ((L - 0.2) * i) / 6;
        t.sideBox("wood", s, x - 0.04, x + 0.04, y0, top + 0.04, 0.97, 1.0);
      }
      t.sideBox("wood", s, 0.06, L - 0.06, top, top + 0.04, 0.92, 0.97);
    }
  });
  m.scope("ends", () => {
    // the front is open to the footplate but for a low board; the rear is closed
    t.box("paint", 0.08, 0.12, y0, 1.28, -0.92, 0.92);
    for (const [a, b] of [[y0, 1.2], [1.24, 1.38], [1.42, top]] as const) t.box("paint", L - 0.12, L - 0.08, a, b, -0.92, 0.92);
  });
}

/** The water barrel lying across the tender on its cradles, with hoops and a tap. */
function barrel(t: Steam): void {
  const m = t.m;
  const B = ROCKET_TENDER.barrel;
  const X = t.X(B.x);
  const n = 24;
  const ring = (r: number) => ngon(n, r, Math.PI / n, X, B.y);
  // bulging staves: the radius along the barrel's axis (z)
  const stations: Array<[number, number]> = [[-B.half, B.r - 0.07], [-B.half * 0.55, B.r - 0.015], [0, B.r], [B.half * 0.55, B.r - 0.015], [B.half, B.r - 0.07]];
  m.scope("barrel", () => {
    for (let i = 0; i + 1 < stations.length; i++) {
      const [za, ra] = stations[i]!;
      const [zb, rb] = stations[i + 1]!;
      m.sweep("paint", "z", ring(ra), za, ring(rb), zb, false);
    }
    for (const s of [-1, 1]) {
      const [a, b] = s > 0 ? [B.half - 0.02, B.half + 0.004] : [-B.half - 0.004, -B.half + 0.02];
      m.sweep("wood", "z", ring(B.r - 0.08), a, ring(B.r - 0.08), b);
    }
    m.scope("hoops", () => {
      for (const z of [-B.half + 0.06, -B.half * 0.35, B.half * 0.35, B.half - 0.06]) {
        const k = Math.abs(z) / B.half;
        const r = B.r - 0.07 * k * k + 0.012;
        m.sweep("black", "z", ring(r), z - 0.025, ring(r), z + 0.025, false);
      }
    });
    m.scope("tap", () => t.cylX("copper", B.x - B.r - 0.12, B.x - B.r + 0.05, 0.3, B.y - 0.3, 0.035, 8));
    m.scope("cradles", () => {
      for (const z of [-0.4, 0.4]) t.box("wood", B.x - 0.45, B.x + 0.45, 1.04, B.y - B.r + 0.12, z - 0.06, z + 0.06);
    });
  });
}

function tenderSpec(): LocoSpec {
  const L = ROCKET_TENDER.length;
  return {
    title: "Stephenson's Rocket tender",
    palette: ROCKET_PALETTE,
    heads: [-0.1, L + 0.1],
    beams: { front: false, rear: false },
    coal: { x0: 0.2, x1: 1.55, y: 1.04, half: 0.82, rise: 0.32 },
    gear: {
      wheels: ROCKET_TENDER.axles.map((x) => ({ x, d: ROCKET_TENDER.wheelD, spokes: 10, outsideBoxes: true })),
      engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel",
    },
    extras: (t) => {
      tenderFrame(t);
      tenderSides(t);
      barrel(t);
    },
  };
}

function tenderLodSpec(): LocoSpec {
  const B = ROCKET_TENDER.barrel;
  return {
    ...tenderSpec(),
    frame: { x0: 0.08, x1: ROCKET_TENDER.length - 0.08, top: 0.98 },
    prisms: [
      { name: "body", x0: 0.08, x1: ROCKET_TENDER.length - 0.08, half: [[0.98, 0.98], [0.98, 1.55]] },
      { name: "barrel", x0: B.x - B.r * 0.9, x1: B.x + B.r * 0.9, half: [[B.half, 1.55], [B.half, B.y + B.r * 0.7], [B.half * 0.7, B.y + B.r]] },
    ],
    extras: undefined,
  };
}

export const rocketSpec = (unit: string): LocoSpec => (unit === "tender" ? tenderSpec() : engineSpec());
export const rocketLodSpec = (unit: string): LocoSpec => (unit === "tender" ? tenderLodSpec() : engineLodSpec());
export const buildRocket = (unit: string): MeshBuilder => buildLoco(rocketSpec(unit));
export const buildRocketLod = (unit: string): MeshBuilder => steamLocoLod(rocketLodSpec(unit));
