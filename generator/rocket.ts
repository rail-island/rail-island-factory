// Stephenson's Rocket (1829) and its tender, drawn on the steam kit
// (steamLoco.ts) with their own parts: the level boiler with the black
// smokebox at its front, the tall white chimney with its crown and stays, the
// firebox at the rear, the two cylinders inclined at 35 degrees beside the
// firebox driving the front wheels, the bar frame with its springs, and the
// four-wheeled tender with its slatted sides, the coke and the water barrel.
// The feed pump on the right is worked by the crosshead; a driver stands on the
// footplate and a fireman on the tender. The `version` is the engine as it ran
// at Rainhill in 1829 or as rebuilt in 1830: its cylinders lowered to 8
// degrees, a smokebox ahead of the boiler and a plain black chimney on it.
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
  // the crew's clothes
  coat: mat("#2f3340", 0.85),
  trousers: mat("#8a7a5e", 0.85),
  shirt: mat("#e8e4d8", 0.8),
  boots: mat("#1a1614", 0.6),
  skin: mat("#e0b48a", 0.7),
  hair: mat("#4a3020", 0.9),
  hat: mat("#141416", 0.6),
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
  /** The cylinders' ends' distances from the driving axle along their axis. */
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

/** The engine as built (Rainhill, 1829) or as rebuilt in 1830. */
export type RocketVersion = "rainhill" | "rebuilt";

/** What the two versions differ in. */
export const ROCKET_VERSIONS = {
  rainhill: { title: "Rainhill 1829", incline: (35 * Math.PI) / 180, chimneyX: 0.56, chimneyTop: 3.96, pump: -0.3 },
  rebuilt: { title: "Rebuilt 1830", incline: (8 * Math.PI) / 180, chimneyX: 0.38, chimneyTop: 3.88, pump: 0.3 },
} as const;

type V = (typeof ROCKET_VERSIONS)[RocketVersion];

const DRIVER: SteamWheel = { x: ROCKET.driverX, d: ROCKET.driverD, spokes: 12 };
const TRAILER: SteamWheel = { x: ROCKET.trailX, d: ROCKET.trailD, spokes: 10 };

/** Source (x, y) on the cylinder's axis, `t` metres out from the driving axle and `off` across it (upward). */
export function cylinderAxis(v: V, t: number, off = 0): Pt {
  const ay = axleHeight(DRIVER);
  const [c, s] = [Math.cos(v.incline), Math.sin(v.incline)];
  return [ROCKET.driverX + t * c - off * s, ay + t * s + off * c];
}

/** The feed pump's barrel: from `t0` to `t1` along the axis, `dz` outside the rods' plane. */
export const PUMP = { t0: 1.2, t1: 1.7, r: 0.055, ram: 0.5, dz: 0.1 } as const;

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
function boiler(t: Steam, v: V): void {
  const m = t.m;
  const b = ROCKET.boiler;
  const front = v === ROCKET_VERSIONS.rebuilt ? 0.12 : 0.42;
  m.scope("boiler", () => {
    m.scope("barrel", () => t.cylX("paint", b.x0, b.x1, 0, b.y, b.r, 24, false));
    m.scope("boiler bands", () => {
      for (const x of [1.05, 1.55, 2.05]) t.cylX("black", x - 0.025, x + 0.025, 0, b.y, b.r + 0.012, 24, false);
    });
    m.scope("smokebox", () => {
      // as built a short drum closing the barrel; the rebuild's smokebox reaches ahead of it
      t.cylX("smokebox", front, b.x0 + 0.02, 0, b.y, b.r + 0.04, 24);
      // the front plate's rim and the cleaning door
      t.cylX("black", front - 0.02, front, 0, b.y, b.r + 0.06, 24);
      t.endPanel("frame", 1, front - 0.02, -0.18, 0.18, b.y - 0.36, b.y - 0.06, 0.03);
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
        const [cx, cy] = cylinderAxis(v, ROCKET.cylinder.far - 0.08);
        rod(t, "copper", [2.6, 1.98, s * 0.2], [cx, cy + 0.15, s * (ROCKET.cylinderZ - 0.06)], 0.035);
        if (v === ROCKET_VERSIONS.rebuilt) {
          // from the lowered cylinder up to the boiler's flank, then forward along it into the smokebox
          const bend: Vec3 = [cx - 0.3, b.y - 0.1, s * (b.r + 0.1)];
          rod(t, "copper", [cx - 0.1, cy + 0.05, s * (ROCKET.cylinderZ - 0.12)], bend, 0.035);
          rod(t, "copper", bend, [front + 0.15, b.y - 0.1, s * (b.r + 0.1)], 0.035);
        } else rod(t, "copper", [cx - 0.1, cy - 0.05, s * (ROCKET.cylinderZ - 0.12)], [0.5, b.y + 0.1, s * (b.r + 0.02)], 0.035);
      }
    });
  });
}

/** The tall chimney: a black base on the smokebox, the white stack with its bands, the crown, its stays. */
function chimney(t: Steam, v: V): void {
  const m = t.m;
  const x = v.chimneyX;
  const X = t.X(x);
  const b = ROCKET.boiler;
  const r = 0.2;
  if (v === ROCKET_VERSIONS.rebuilt) return rebuiltChimney(t, v);
  const lip = v.chimneyTop - 0.17;
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
        const tip = p(am, rr + 0.05, v.chimneyTop);
        const outline: Vec3[] = [p(a0 + 0.04, rr, lip - 0.01), p(a1 - 0.04, rr, lip - 0.01), tip];
        m.slab("white", outline, [-Math.cos(am) * 0.02, 0, -Math.sin(am) * 0.02]);
      }
    });
    stays(t, x);
  });
}

/** Two stays from the chimney back to the firebox's top corners and two forward to the front beam. */
function stays(t: Steam, x: number): void {
  t.m.scope("stays", () => {
    for (const s of [-1, 1]) {
      rod(t, "black", [x + 0.12, 3.4, s * 0.12], [ROCKET.firebox.x1 - 0.1, 1.94, s * 0.25], 0.018);
      rod(t, "black", [x - 0.1, 2.9, s * 0.15], [0.05, 1.06, s * 0.7], 0.018);
    }
  });
}

/** The rebuild's chimney: a plain black stack with a lip, standing on the smokebox ahead of the boiler. */
function rebuiltChimney(t: Steam, v: V): void {
  const m = t.m;
  const X = t.X(v.chimneyX);
  const b = ROCKET.boiler;
  const r = 0.2;
  const lip = v.chimneyTop - 0.08;
  m.emit("smoke", [X, v.chimneyTop, 0], r);
  m.scope("chimney", () => {
    m.scope("base", () => m.loft("smokebox", ngon(20, 0.32, 0, X, 0), b.y + b.r - 0.08, ngon(20, r, 0, X, 0), b.y + b.r + 0.2, false));
    m.scope("stack", () => m.prism("smokebox", ngon(20, r, 0, X, 0), b.y + b.r + 0.15, lip, false));
    m.scope("lip", () => m.prism("smokebox", ngon(20, r + 0.05, 0, X, 0), lip, v.chimneyTop, true));
    stays(t, v.chimneyX);
  });
}

/** The firebox behind the boiler, its fire door, the brackets carrying the cylinders, the footplate. */
function firebox(t: Steam, v: V): void {
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
      const [x, y] = cylinderAxis(v, (ROCKET.cylinder.near + ROCKET.cylinder.far) / 2);
      if (v === ROCKET_VERSIONS.rebuilt) {
        // the lowered cylinders sit on the frame, above the trailing wheels
        t.sideBox("frame", s, x - 0.12, x + 0.12, y - 0.06, y + 0.06, 0.6, ROCKET.cylinderZ - 0.09);
      } else {
        t.sideBox("frame", s, x - 0.12, x + 0.12, y - 0.32, y - 0.12, 0.47, ROCKET.cylinderZ - 0.09);
        t.sideBox("frame", s, x - 0.04, x + 0.04, 1.0, y - 0.32, 0.56, 0.62);
      }
    }
  });
  m.scope("footplate", () => t.box("deck", f.x1, ROCKET.length - 0.1, 1.14, 1.19, -0.8, 0.8));
}

/** The feed pump on the right: its barrel along the cylinder, a bracket, the delivery pipe to the boiler, the suction pipe to the tender. */
function feedPump(t: Steam, v: V): void {
  const z = ROCKET.cylinderZ + PUMP.dz;
  const [x0, y0] = cylinderAxis(v, PUMP.t0, v.pump);
  const [x1, y1] = cylinderAxis(v, PUMP.t1, v.pump);
  const b = ROCKET.boiler;
  t.m.scope("feed pump", () => {
    rod(t, "copper", [x0, y0, z], [x1, y1, z], PUMP.r, 10);
    // the glands at both ends
    const at = (k: number): Vec3 => { const [x, y] = cylinderAxis(v, k, v.pump); return [x, y, z]; };
    for (const [a, c] of [[PUMP.t0 - 0.01, PUMP.t0 + 0.05], [PUMP.t1 - 0.05, PUMP.t1 + 0.01]] as const) rod(t, "steel", at(a), at(c), PUMP.r + 0.008, 10);
    // the bracket to the cylinder's cover
    const [bx, by] = cylinderAxis(v, ROCKET.cylinder.near + 0.03, v.pump * 0.5);
    rod(t, "frame", [bx, by, ROCKET.cylinderZ + 0.04], at(ROCKET.cylinder.near + 0.03), 0.025, 4);
    // the delivery pipe up to the clack on the boiler's side, the suction pipe back to the rear beam
    rod(t, "copper", at(PUMP.t0 + 0.02), [x0 - 0.05, b.y - 0.15, b.r + 0.04], 0.022);
    t.cylY("copper", x0 - 0.05, b.r + 0.02, b.y - 0.2, b.y - 0.08, 0.05, 8);
    rod(t, "copper", at(PUMP.t1 - 0.02), [ROCKET.length - 0.05, 0.95, 0.7], 0.022);
  });
}

/** The engine's spec: the kit draws the running gear; the body is this module's (`extras`). */
function engineSpec(v: V): LocoSpec {
  const { near, far, r } = ROCKET.cylinder;
  const [x0] = cylinderAxis(v, near);
  const [x1] = cylinderAxis(v, far);
  return {
    title: "Stephenson's Rocket",
    palette: ROCKET_PALETTE,
    heads: [0, ROCKET.length],
    beams: { front: false, rear: false },
    gear: {
      wheels: [DRIVER, TRAILER],
      engines: [{ coupled: [0], main: 0, cylinder: { x0, x1, y: 0, r, incline: v.incline }, crank: ROCKET.crank, phase: 0.3, valveGear: false }],
      cylinderZ: ROCKET.cylinderZ, reference: 0, wheelMaterial: "wheel",
      // the pump's ram, on an arm from the right crosshead
      crossheadParts: (m, s, at) => {
        if (s < 0) return;
        m.scope("pump ram", () => {
          // a stub out of the block between the guides, then the arm outside them
          const k = Math.sign(v.pump) * 0.05;
          m.rod("steel", at(0, k, 0.03), at(0, k, PUMP.dz + 0.01), 0.018, 4);
          m.rod("steel", at(0, k, PUMP.dz + 0.01), at(0, v.pump, PUMP.dz + 0.01), 0.018, 4);
          m.rod("rod", at(0, v.pump, PUMP.dz), at(PUMP.ram, v.pump, PUMP.dz), 0.03, 8);
        });
      },
    },
    extras: (t) => {
      frame(t);
      boiler(t, v);
      chimney(t, v);
      firebox(t, v);
      feedPump(t, v);
      crewman(t, { x: 3.49, z: 0.05, y: 1.19, facing: 1, pose: "driver" });
    },
  };
}

/** The engine as the low level of detail reads it: boiler, smokebox, chimney, firebox and frame. */
function engineLodSpec(v: V): LocoSpec {
  const b = ROCKET.boiler;
  const front = v === ROCKET_VERSIONS.rebuilt ? 0.12 : 0.42;
  return {
    ...engineSpec(v),
    beams: { front: false, rear: false },
    boiler: { x0: front, x1: b.x1, y: b.y, r: b.r, smokebox: b.x0 - front },
    chimney: { x: v.chimneyX, top: v.chimneyTop - 0.1, r: 0.22, mat: v === ROCKET_VERSIONS.rebuilt ? "smokebox" : "white" },
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
    coal: { x0: 0.75, x1: 1.6, y: 1.04, half: 0.82, rise: 0.32 },
    gear: {
      wheels: ROCKET_TENDER.axles.map((x) => ({ x, d: ROCKET_TENDER.wheelD, spokes: 10, outsideBoxes: true })),
      engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel",
    },
    extras: (t) => {
      tenderFrame(t);
      tenderSides(t);
      barrel(t);
      crewman(t, { x: 0.42, z: -0.3, y: 1.04, facing: -1, pose: "fireman" });
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

export const rocketSpec = (unit: string, version: RocketVersion = "rainhill"): LocoSpec => (unit === "tender" ? tenderSpec() : engineSpec(ROCKET_VERSIONS[version]));
export const rocketLodSpec = (unit: string, version: RocketVersion = "rainhill"): LocoSpec => (unit === "tender" ? tenderLodSpec() : engineLodSpec(ROCKET_VERSIONS[version]));
export const buildRocket = (unit: string, version: RocketVersion = "rainhill"): MeshBuilder => buildLoco(rocketSpec(unit, version));
export const buildRocketLod = (unit: string, version: RocketVersion = "rainhill"): MeshBuilder => steamLocoLod(rocketLodSpec(unit, version));

/** Where a crewman stands (source x of his middle, z, the floor's height), which way he faces (+1 forward) and what he does. */
interface Crew {
  x: number;
  z: number;
  y: number;
  facing: 1 | -1;
  pose: "driver" | "fireman";
}

/**
 * A crewman of 1829 in a tailcoat and top hat, about 1.8 m tall: the driver with
 * his left hand on the regulator, or the fireman with a shovel in the coke.
 */
function crewman(t: Steam, c: Crew): void {
  const m = t.m;
  // a point of the figure: `f` metres ahead of his middle, `h` above the floor, `w` to his right
  const P = (f: number, h: number, w: number): Vec3 => [t.X(c.x - c.facing * f), c.y + h, c.z + c.facing * w];
  const box = (mat: string, f0: number, f1: number, h0: number, h1: number, w0: number, w1: number) => {
    const [a, b] = [P(f0, h0, w0), P(f1, h1, w1)];
    m.sweep(mat, "x", [[Math.min(a[2], b[2]), a[1]], [Math.max(a[2], b[2]), a[1]], [Math.max(a[2], b[2]), b[1]], [Math.min(a[2], b[2]), b[1]]], Math.min(a[0], b[0]), [[Math.min(a[2], b[2]), a[1]], [Math.max(a[2], b[2]), a[1]], [Math.max(a[2], b[2]), b[1]], [Math.min(a[2], b[2]), b[1]]], Math.max(a[0], b[0]));
  };
  const limb = (mat: string, a: Vec3, b: Vec3, r: number) => m.rod(mat, a, b, r, 6);
  const driver = c.pose === "driver";
  m.scope(driver ? "driver" : "fireman", () => {
    m.scope("legs", () => {
      for (const w of [-0.09, 0.09]) {
        // the fireman stoops: his knees bent forward
        const knee = driver ? P(0.02, 0.47, w) : P(0.12, 0.45, w);
        limb("trousers", P(0, 0.86, w), knee, 0.068);
        limb("trousers", knee, P(0, 0.08, w), 0.06);
        box("boots", -0.06, 0.14, -0.005, 0.08, w - 0.055, w + 0.055);
      }
    });
    // the torso leans forward over the shovel
    const lean = driver ? 0 : 0.14;
    m.scope("coat", () => {
      m.rod("coat", P(lean * 0.3, 0.84, 0), P(lean, 1.42, 0), 0.2, 4);
      // the tails hanging behind
      box("coat", -0.13, -0.05, 0.5, 0.86, -0.15, 0.15);
      box("shirt", lean + 0.07, lean + 0.115, 1.22, 1.4, -0.06, 0.06);
    });
    const shoulder = (w: number) => P(lean, 1.38, w);
    m.scope("arms", () => {
      if (driver) {
        // the left hand on the regulator ahead of him, the right one at his side
        const hand: Vec3 = [t.X(ROCKET.firebox.x1 + 0.06), 1.575, -0.12];
        const elbow = P(0.2, 1.2, -0.24);
        limb("coat", shoulder(-0.21), elbow, 0.055);
        limb("coat", elbow, hand, 0.05);
        limb("skin", hand, [hand[0] - c.facing * 0.03, hand[1], hand[2]], 0.04);
        limb("coat", shoulder(0.21), P(0.03, 1.08, 0.25), 0.055);
        limb("coat", P(0.03, 1.08, 0.25), P(0.08, 0.86, 0.24), 0.05);
      } else {
        // both hands on the shovel's shaft, its blade down in the coke
        const top = P(0.3, 1.0, 0.0);
        const low = P(0.5, 0.78, 0.04);
        limb("coat", shoulder(-0.21), P(0.22, 1.08, -0.2), 0.055);
        limb("coat", P(0.22, 1.08, -0.2), top, 0.05);
        limb("coat", shoulder(0.21), P(0.36, 1.0, 0.2), 0.055);
        limb("coat", P(0.36, 1.0, 0.2), low, 0.05);
        m.scope("shovel", () => {
          const blade = P(0.82, 0.32, 0.06);
          limb("wood", P(0.24, 1.05, -0.01), blade, 0.02);
          const [bx, by, bz] = blade;
          const e = -c.facing;
          m.slab("steel", [[bx, by + 0.02, bz - 0.13], [bx, by + 0.02, bz + 0.13], [bx + e * 0.28, by - 0.06, bz + 0.12], [bx + e * 0.28, by - 0.06, bz - 0.12]], [0, 0.015, 0]);
        });
      }
    });
    m.scope("head", () => {
      const hx = lean + 0.02;
      limb("skin", P(lean, 1.42, 0), P(hx, 1.5, 0), 0.05);
      const head = P(hx, 1.47, 0);
      m.prism("skin", ngon(8, 0.1, Math.PI / 8, head[0], head[2]), head[1], head[1] + 0.21);
      // sideburns and hair under the hat
      m.prism("hair", ngon(8, 0.104, Math.PI / 8, head[0] + c.facing * 0.01, head[2]), head[1] + 0.13, head[1] + 0.2, false);
      m.scope("top hat", () => {
        m.prism("hat", ngon(12, 0.165, 0, head[0], head[2]), head[1] + 0.2, head[1] + 0.22);
        m.prism("hat", ngon(12, 0.105, 0, head[0], head[2]), head[1] + 0.22, head[1] + 0.42);
      });
    });
  });
}
