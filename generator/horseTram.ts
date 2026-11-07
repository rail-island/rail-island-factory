// The horse tram (docs/models/world-trams.md, "The horse tram"): a double-deck
// horse car after the Victor Harbor cars (assets/horse-tram), drawn by its own
// builder rather than the world tram kit's body - the saloon with its panelled
// sides, curtained windows and end bulkheads, an open platform at each end under
// the top deck (bowed dash, emblem, lamp, brake staff, gate, step and a steep
// stair to the top deck), the open top deck with its railings, decency boards,
// knifeboard and end benches, the single truck on spoked wheelsets that roll
// (rolling.ts) - and the Clydesdale in its harness ahead of it, jointed so it
// trots: the clip `trot`, played by the distance travelled like the wheels.
//
// Axes as every rail vehicle's: metres, +X forward (the horse's end), +Y up, +Z
// to the right, the car centred on x 0, the treads on y 0. The car is the same at
// both ends turned about the vertical axis (`turned`), so its two stairs stand on
// opposite sides. The spec (`horseTramSpec`) is the kit's record of the car - its
// size, gauge, collector, features and the distant model (`worldTramLod`), which
// stays the kit's.

import { MeshBuilder } from "./meshBuilder.ts";
import { ngon, type Ring, type Vec3 } from "./meshCore.ts";
import { TRAM_PALETTE } from "./tramKit.ts";
import { block, side } from "./vehicleParts.ts";
import { rollWheels, ROLLING_SPEED } from "./rolling.ts";
import { qAxis, qMul, r6, r9, TAU, type Quat } from "./characterKit.ts";
import { worldTramLod, tramLodBudget, type WorldTramSpec } from "./worldTramKit.ts";
import { doubleDeck, horseLod, NO_COLLECTOR, truck } from "./worldTramShapes.ts";

// ---------------------------------------------------------------------------
// the record

/** Where the horse stands: its body's centre, metres ahead of the car's nose. */
const HORSE_AHEAD = 2.1;

export function horseTramSpec(): WorldTramSpec {
  const s = doubleDeck({
    sections: [6.4], width: 2.0, height: 2.6, front: "retro",
    doors: [],
    trucks: truck(1.6, 3.2),
    collector: NO_COLLECTOR,
    wheelRadius: 0.38,
    colors: { skirt: "#1f4a33", body: "#8f5a2c", upper: "#1f4a33", horseCoat: "#5a2c19", horseMane: "#1c1411", harness: "#1b1917" },
    paint: [[1.44, "skirt"], [2.08, "body"], [2.6, "upper"]],
    over: { deck: "open", windows: [1.47, 2.06], screen: [1.47, 2.06], eave: 2.42, pitch: 0.73, extraLod: horseLod(-HORSE_AHEAD), extraSection: HORSE_HITCH, extraFeatures: ["horse"] },
  });
  const { upper: _upper, ...rest } = s;
  return rest;
}

// ---------------------------------------------------------------------------
// the palette

const PALETTE = {
  ...TRAM_PALETTE,
  green: { color: "#1f4a33", roughness: 0.45 },
  cream: { color: "#ebdfbd", roughness: 0.5 },
  varnish: { color: "#8f5a2c", roughness: 0.4 },
  timber: { color: "#7b5434", roughness: 0.8 },
  seatWood: { color: "#a8763f", roughness: 0.6 },
  brass: { color: "#e2bd2c", metallic: 0.4, roughness: 0.35 },
  lining: { color: "#c9a23c", metallic: 0.3, roughness: 0.4 },
  curtain: { color: "#c86f24", roughness: 0.85 },
  iron: { color: "#2a2b2d", roughness: 0.7 },
  horseCoat: { color: "#5a2c19", roughness: 0.75 },
  horseMane: { color: "#1c1411", roughness: 0.9 },
  horseWhite: { color: "#ece5d8", roughness: 0.85 },
  muzzle: { color: "#d7b3a3", roughness: 0.7 },
  hoof: { color: "#3a322d", roughness: 0.6 },
  eye: { color: "#0d0b0a", roughness: 0.2 },
  harness: { color: "#1b1917", roughness: 0.6 },
  collar: { color: "#3b2a1f", roughness: 0.8 },
  hames: { color: "#c9a440", metallic: 0.5, roughness: 0.35 },
};

// ---------------------------------------------------------------------------
// shared drawing helpers

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mean = (ps: readonly Vec3[]): Vec3 => mul(ps.reduce((s, p) => add(s, p), [0, 0, 0] as Vec3), 1 / ps.length);

/** A triangle wound so that it faces away from `inside`, pushed onto `out`; its normal added to `sum`. */
function triOut(out: Vec3[], sum: Vec3, a: Vec3, b: Vec3, c: Vec3, inside: Vec3): void {
  const n = cross(sub(b, a), sub(c, a));
  const outward = dot(n, sub(mean([a, b, c]), inside)) >= 0;
  out.push(...(outward ? [a, b, c] : [a, c, b]));
  const k = outward ? 1 : -1;
  for (let i = 0; i < 3; i++) sum[i] += k * n[i]!;
}

/**
 * A skin through closed rings of equal size (a horse's barrel, neck, head, a leg),
 * every face turned out from the axis through the rings' centres; the end rings
 * capped unless asked not to. Each column of faces round the rings, and each cap,
 * is one `facets` call (one leaf of the source tree), its triangles already wound
 * out and the call's normal their sum.
 */
function skin(m: MeshBuilder, mat: string, rings: readonly Vec3[][], caps: { start?: boolean; end?: boolean } = {}): void {
  const centres = rings.map(mean);
  const n = rings[0]!.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const pts: Vec3[] = [];
    const sum: Vec3 = [0, 0, 0];
    for (let r = 0; r + 1 < rings.length; r++) {
      const [a, b] = [rings[r]!, rings[r + 1]!];
      const inside = mean([centres[r]!, centres[r + 1]!]);
      triOut(pts, sum, a[i]!, a[j]!, b[j]!, inside);
      triOut(pts, sum, a[i]!, b[j]!, b[i]!, inside);
    }
    m.facets(mat, pts, sum);
  }
  const capOf = (ring: Vec3[], c: Vec3, toward: Vec3) => {
    // the cap faces away from the next ring: its inside is a point toward it
    const inside = add(c, mul(sub(toward, c), 0.5));
    const pts: Vec3[] = [];
    const sum: Vec3 = [0, 0, 0];
    for (let i = 0; i < ring.length; i++) triOut(pts, sum, c, ring[i]!, ring[(i + 1) % ring.length]!, inside);
    m.facets(mat, pts, sub(c, toward));
  };
  if (caps.start !== false && rings.length > 1) capOf(rings[0]!, centres[0]!, centres[1]!);
  if (caps.end !== false && rings.length > 1) capOf(rings[rings.length - 1]!, centres[rings.length - 1]!, centres[rings.length - 2]!);
}

/** An elliptic ring round the axis point `c`, in the plane spanned by `u` and `v` (unit, square), radii `ru` and `rv`. */
function ring(c: Vec3, u: Vec3, v: Vec3, ru: number, rv: number, n: number, rot = 0): Vec3[] {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (TAU * i) / n;
    return add(c, add(mul(u, ru * Math.cos(a)), mul(v, rv * Math.sin(a))));
  });
}

const Z: Vec3 = [0, 0, 1];
const Y: Vec3 = [0, 1, 0];
const X: Vec3 = [1, 0, 0];

/** The unit vector of (dx, dy) in the x-y plane, and its normal turned a quarter left (up for a forward axis). */
function axisXY(a: Vec3, b: Vec3): { d: Vec3; up: Vec3 } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  return { d: [dx / l, dy / l, 0], up: [-dy / l, dx / l, 0] };
}

/** A round rod along a polyline, a joint ring at each bend. */
function rods(m: MeshBuilder, mat: string, pts: readonly Vec3[], r: number, n = 6, ends = true): void {
  for (let i = 0; i + 1 < pts.length; i++) m.rod(mat, pts[i]!, pts[i + 1]!, r, n, ends);
}

/** The ring (x, z) wound as `ngon` winds it, the way `prism` and `cap` take it (counter-clockwise seen from above, +Y up and +Z toward the viewer's bottom). */
function ccw(r: Ring): Ring {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const [x0, z0] = r[i]!;
    const [x1, z1] = r[(i + 1) % r.length]!;
    a += x0 * z1 - x1 * z0;
  }
  return a < 0 ? r : [...r].reverse();
}

/** A flat plate in the y-z plane (facing +x) at x, from a (z, y) outline, `t` thick behind it. */
function plateX(m: MeshBuilder, mat: string, x: number, outline: ReadonlyArray<readonly [number, number]>, t: number): void {
  m.slab(mat, outline.map(([z, y]) => [x, y, z] as Vec3), [-t, 0, 0]);
}

// ---------------------------------------------------------------------------
// the car's dimensions

const HALF = 3.2; // half the car's length over the dashes
const SAL = 2.2; // the saloon's half length
const HW = 1.0; // half width over the panels
const WHEEL_R = 0.38;
const TYRE_SIDES = 20;
const AXLE_Y = WHEEL_R * Math.cos(Math.PI / TYRE_SIDES);
const AXLE_X = 0.8;
const PLAT = 0.93; // the platforms' floor
const WAIST = 1.47; // the window sill
const LETTER = 2.06; // the window head
const DECK0 = 2.52; // the top deck's underside
const DECK = 2.6; // the top deck's floor
const RAIL_MID = 3.07;
const RAIL_TOP = 3.48;

/** The dash's bow: its outer face at z, bulging from x 3.0 at the corners to 3.16 at the middle. */
const dashX = (z: number): number => 3.0 + 0.16 * (1 - (z / HW) ** 2);
/** The dash's plan points across the car, n segments. */
const dashPts = (n: number, inset = 0, z0 = -HW, z1 = HW): Array<[number, number]> =>
  Array.from({ length: n + 1 }, (_, i) => {
    const z = z0 + ((z1 - z0) * i) / n;
    return [dashX(z) - inset, z];
  });

// ---------------------------------------------------------------------------
// the running gear

/** A spoked wheelset (a rolling part) at x: axle, two tyres, hubs and eight spokes each. */
function wheelset(m: MeshBuilder, name: string, x: number): void {
  m.spin(name, [x, AXLE_Y, 0], () => m.scope("wheelset", () => {
    const axle = ngon(10, 0.065, 0, x, AXLE_Y);
    m.sweep("steel", "z", axle, -0.9, axle, 0.9);
    for (const s of [-1, 1]) {
      const [t0, t1] = side(s, 0.665, 0.8); // the standard tread: both rail heads under it
      m.tube("steel", "z", x, AXLE_Y, WHEEL_R, 0.31, t0, t1, TYRE_SIDES, Math.PI / TYRE_SIDES);
      const hub = ngon(10, 0.1, 0, x, AXLE_Y);
      const [h0, h1] = side(s, 0.67, 0.8);
      m.sweep("wheel", "z", hub, h0, hub, h1);
      const zc = s * 0.725;
      for (let k = 0; k < 8; k++) {
        const a = (TAU * (k + 0.5)) / 8;
        const [c, sn] = [Math.cos(a), Math.sin(a)];
        m.rod("wheel", [x + 0.09 * c, AXLE_Y + 0.09 * sn, zc], [x + 0.315 * c, AXLE_Y + 0.315 * sn, zc], 0.022, 4, false);
      }
    }
  }));
}

/** The truck: two rolling wheelsets in an outside frame, axle boxes, leaf springs, brakes. */
function runningGear(m: MeshBuilder): void {
  m.scope("truck", () => {
    wheelset(m, "wheelset-1", AXLE_X);
    wheelset(m, "wheelset-2", -AXLE_X);
    m.scope("frame", () => {
      for (const s of [-1, 1]) {
        block(m, "bogie", -1.25, 1.25, AXLE_Y + 0.08, AXLE_Y + 0.2, ...side(s, 0.86, 0.93));
        for (const x of [-AXLE_X, AXLE_X]) {
          // the axle box in its guards, the keep under it
          block(m, "iron", x - 0.15, x + 0.15, AXLE_Y - 0.13, AXLE_Y + 0.1, ...side(s, 0.84, 0.97));
          block(m, "bogie", x - 0.16, x + 0.16, AXLE_Y - 0.19, AXLE_Y - 0.15, ...side(s, 0.86, 0.93));
          // the leaf spring over the box and its hangers to the sole bar
          for (let k = 0; k < 3; k++) {
            const half = 0.34 - k * 0.085;
            block(m, "spring", x - half, x + half, AXLE_Y + 0.29 - k * 0.022, AXLE_Y + 0.31 - k * 0.022, ...side(s, 0.865, 0.925));
          }
          for (const d of [-0.33, 0.33]) m.rod("iron", [x + d, AXLE_Y + 0.3, s * 0.895], [x + d, 0.79, s * 0.895], 0.016, 4);
        }
      }
      // the transoms between the side frames
      for (const x of [-1.22, 0, 1.22]) block(m, "bogie", x - 0.03, x + 0.03, AXLE_Y + 0.1, AXLE_Y + 0.18, -0.86, 0.86);
    });
    m.scope("brakes", () => {
      for (const x of [-AXLE_X, AXLE_X]) {
        const e = Math.sign(x);
        // the wooden blocks inside the wheels, on a beam across
        const xb = x - e * (WHEEL_R + 0.045);
        for (const s of [-1, 1]) block(m, "timber", xb - 0.035, xb + 0.035, AXLE_Y - 0.13, AXLE_Y + 0.13, ...side(s, 0.67, 0.78));
        m.rod("iron", [xb, AXLE_Y, -0.82], [xb, AXLE_Y, 0.82], 0.025, 6);
      }
      m.rod("iron", [-AXLE_X + WHEEL_R + 0.045, AXLE_Y, 0.2], [AXLE_X - WHEEL_R - 0.045, AXLE_Y, 0.2], 0.018, 5);
    });
  });
}

// ---------------------------------------------------------------------------
// the saloon

const WINDOWS = 6;

function saloon(m: MeshBuilder): void {
  m.scope("saloon", () => {
    m.scope("underframe", () => {
      for (const s of [-1, 1]) block(m, "underframe", -3.08, 3.08, 0.78, 0.885, ...side(s, 0.62, 0.74));
      block(m, "underframe", -SAL + 0.05, SAL - 0.05, 0.775, 0.81, -0.95, 0.95);
    });
    m.scope("lower panels", () => {
      block(m, "green", -SAL, SAL, 0.8, WAIST, -HW, HW);
      for (const s of [-1, 1]) {
        block(m, "varnish", -SAL - 0.02, SAL + 0.02, 0.795, 0.85, ...side(s, 0.99, 1.02));
        block(m, "varnish", -SAL - 0.02, SAL + 0.02, WAIST - 0.06, WAIST + 0.008, ...side(s, 0.99, 1.025));
        // the panel's gold lining
        for (const [a, b] of [[-2.1, 2.1]] as const) {
          const z = side(s, HW, HW + 0.004);
          block(m, "lining", a, b, 0.9, 0.915, ...z);
          block(m, "lining", a, b, WAIST - 0.11, WAIST - 0.095, ...z);
          block(m, "lining", a, a + 0.015, 0.915, WAIST - 0.11, ...z);
          block(m, "lining", b - 0.015, b, 0.915, WAIST - 0.11, ...z);
        }
      }
    });
    m.scope("windows", () => {
      const pitch = (2 * SAL) / WINDOWS;
      for (const s of [-1, 1]) {
        m.scope(s > 0 ? "right" : "left", () => {
          block(m, "glass", -SAL + 0.05, SAL - 0.05, WAIST, LETTER, ...side(s, 0.962, 0.968));
          for (let i = 0; i <= WINDOWS; i++) {
            const x = -SAL + i * pitch;
            const [a, b] = i === 0 ? [x, x + 0.08] : i === WINDOWS ? [x - 0.08, x] : [x - 0.04, x + 0.04];
            block(m, "varnish", a, b, WAIST, LETTER, ...side(s, 0.95, HW));
          }
          // the sash rail under the top lights
          block(m, "varnish", -SAL + 0.04, SAL - 0.04, 1.86, 1.89, ...side(s, 0.955, 0.985));
          // the curtains, drawn back to alternate sides, and their rail
          for (let i = 0; i < WINDOWS; i++) {
            const x0 = -SAL + i * pitch + 0.05;
            const x1 = x0 + pitch - 0.1;
            const [a, b] = i % 2 ? [x1 - 0.17, x1] : [x0, x0 + 0.17];
            block(m, "curtain", a, b, WAIST + 0.03, 1.84, ...side(s, 0.9, 0.93));
          }
          m.rod("brass", [-SAL + 0.08, 1.845, s * 0.915], [SAL - 0.08, 1.845, s * 0.915], 0.01, 5);
        });
      }
    });
    m.scope("letterboard", () => {
      block(m, "green", -SAL, SAL, LETTER, 2.31, -HW, HW);
      for (const s of [-1, 1]) {
        const z = side(s, HW, HW + 0.004);
        block(m, "cream", -1.7, 1.7, 2.11, 2.26, ...z);
        block(m, "lining", -1.75, 1.75, 2.27, 2.28, ...z);
        block(m, "lining", -1.75, 1.75, 2.09, 2.1, ...z);
      }
    });
    m.scope("cornice", () => {
      const r: Ring = [[-HW, 2.3], [HW, 2.3], [HW + 0.04, 2.36], [HW + 0.04, DECK0], [-HW - 0.04, DECK0], [-HW - 0.04, 2.36]];
      m.sweep("cream", "x", r, -SAL - 0.03, r, SAL + 0.03);
    });
  });
}

// ---------------------------------------------------------------------------
// one end: the bulkhead, the platform, the dash, the stair (drawn at +x; the
// other end is the same turned about the vertical axis)

/** Where the stair stands across the platform: the left side at the front end. */
const STAIR_Z: readonly [number, number] = [-0.98, -0.52];
const STAIR_STEPS = 6;
const stairX = (k: number): number => 2.84 - k * 0.105;
const stairY = (k: number): number => PLAT + ((DECK - PLAT) * (k + 1)) / (STAIR_STEPS + 1);

function bulkhead(m: MeshBuilder): void {
  m.scope("bulkhead", () => {
    const x = SAL;
    block(m, "glass", x - 0.008, x - 0.002, WAIST, LETTER, -0.95, 0.95);
    for (const [a, b] of [[-HW, -0.92], [-0.42, -0.32], [0.32, 0.42], [0.92, HW]] as const) block(m, "varnish", x - 0.03, x + 0.012, WAIST, LETTER, a, b);
    for (const s of [-1, 1]) block(m, "varnish", x - 0.03, x + 0.025, WAIST - 0.06, WAIST + 0.008, ...side(s, 0.32, HW + 0.025));
    m.scope("door", () => {
      block(m, "varnish", x, x + 0.02, PLAT, LETTER, -0.32, 0.32);
      block(m, "glass", x + 0.02, x + 0.024, 1.4, 1.98, -0.24, 0.24);
      for (const y of [1.0, 1.2]) block(m, "lining", x + 0.02, x + 0.024, y, y + 0.012, -0.24, 0.24);
      block(m, "brass", x + 0.02, x + 0.06, 1.22, 1.26, 0.2, 0.26);
    });
    // the end's lower panels below the end windows, lined
    for (const s of [-1, 1]) block(m, "lining", x, x + 0.004, 1.0, 1.36, ...side(s, 0.5, 0.515));
  });
}

function platform(m: MeshBuilder): void {
  m.scope("platform", () => {
    // the floor, its front edge following the dash
    const front = dashPts(8, 0.04).reverse();
    const ringXZ = ccw([[SAL - 0.02, -0.98], [SAL - 0.02, 0.98], ...front.slice(1, -1).map(([x, z]) => [x, z] as [number, number])]);
    m.prism("timber", ringXZ, 0.88, PLAT);
    m.cap("timber", ringXZ, 0.88, false);
    block(m, "underframe", 2.96, 3.06, 0.7, 0.885, -0.9, 0.9);
    // the draw hook
    block(m, "iron", 3.06, 3.24, 0.76, 0.81, -0.035, 0.035);
    m.rod("iron", [3.24, 0.785, 0], [3.24, 0.72, 0], 0.025, 6);
    // the step on the boarding side, on two brackets
    block(m, "timber", 2.32, 2.92, 0.48, 0.52, 0.84, 1.04);
    for (const x of [2.38, 2.86]) m.rod("iron", [x, 0.5, 0.94], [x, 0.84, 0.7], 0.018, 5);
  });
}

function dash(m: MeshBuilder): void {
  m.scope("dash", () => {
    const pts = dashPts(8);
    for (let i = 0; i < 8; i++) {
      const [xa, za] = pts[i]!;
      const [xb, zb] = pts[i + 1]!;
      const panel = (mat: string, y0: number, y1: number, off: number, t: number) =>
        m.slab(mat, [[xa + off, y0, za], [xb + off, y0, zb], [xb + off, y1, zb], [xa + off, y1, za]], [-t, 0, 0]);
      panel("green", 0.86, 1.92, 0, 0.04);
      panel("lining", 1.82, 1.835, 0.004, 0.004);
      panel("varnish", 1.92, 1.95, 0.012, 0.07);
    }
    // the emblem: a cream disc lined in gold round a green centre
    const disc = (r: number, x: number, t: number, mat: string) => plateX(m, mat, x, ngon(12, r, 0, 0, 1.4).map(([z, y]) => [z, y] as const), t);
    disc(0.25, 3.168, 0.012, "lining");
    disc(0.22, 3.172, 0.004, "cream");
    disc(0.13, 3.176, 0.004, "green");
    // the brass rail on the dash top
    const rail = dashPts(8, 0.02).map(([x, z]) => [x, 2.04, z] as Vec3);
    rods(m, "brass", rail, 0.018, 5, false);
    for (const k of [0, 4, 8]) {
      const [x, , z] = rail[k]!;
      m.rod("brass", [x, 1.95, z], [x, 2.04, z], 0.014, 5);
    }
    // the head lamp on the dash, the tail lamp at its corner
    m.scope("lamps", () => {
      const body = ngon(10, 0.09, 0, -0.62, 1.62);
      m.sweep("iron", "x", body, dashX(-0.62) - 0.06, body, dashX(-0.62) + 0.12);
      const lens = ngon(10, 0.07, 0, -0.62, 1.62);
      m.sweep("lampHead", "x", lens, dashX(-0.62) + 0.12, lens, dashX(-0.62) + 0.13);
      const tail = ngon(6, 0.045, 0, 0.7, 1.62);
      m.sweep("iron", "x", tail, dashX(0.7) - 0.02, tail, dashX(0.7) + 0.06);
      m.sweep("lampRed", "x", ngon(6, 0.035, 0, 0.7, 1.62), dashX(0.7) + 0.06, ngon(6, 0.035, 0, 0.7, 1.62), dashX(0.7) + 0.068);
    });
    // the corner stanchions up to the top deck
    for (const z of [-0.94, 0.94]) m.rod("brass", [dashX(z) - 0.06, PLAT, z], [dashX(z) - 0.06, DECK0, z], 0.024, 6);
    // the brake staff, its handle and ratchet
    m.scope("brake", () => {
      m.rod("steel", [2.98, 0.6, 0.38], [2.98, 1.98, 0.38], 0.02, 6);
      m.rod("steel", [2.98, 1.98, 0.38], [2.74, 1.98, 0.38], 0.018, 5);
      m.rod("varnish", [2.74, 1.94, 0.38], [2.74, 2.08, 0.38], 0.025, 6);
      m.prism("iron", ngon(10, 0.08, 0, 2.98, 0.38), PLAT, PLAT + 0.04);
    });
  });
}

function gate(m: MeshBuilder): void {
  m.scope("gate", () => {
    const z = 0.99;
    const [x0, x1] = [2.3, dashX(z) - 0.1];
    m.rod("brass", [x0, PLAT, z], [x0, 1.9, z], 0.02, 6);
    for (const y of [1.0, 1.86]) m.rod("brass", [x0, y, z], [x1, y, z], 0.016, 5);
    const n = 7;
    for (let k = 1; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n;
      m.rod("brass", [x, 1.0, z], [x, 1.86, z], 0.011, 4, false);
    }
  });
}

function stair(m: MeshBuilder): void {
  m.scope("stair", () => {
    const [z0, z1] = STAIR_Z;
    for (let k = 0; k < STAIR_STEPS; k++) {
      const x = stairX(k);
      const y = stairY(k);
      block(m, "timber", x - 0.1, x + 0.06, y - 0.035, y, z0 + 0.02, z1 - 0.02);
    }
    // the stringers either side, rising from the platform to the deck edge
    const outline = (z: number): Vec3[] => [[2.94, PLAT, z], [2.74, PLAT, z], [2.18, DECK0 - 0.01, z], [2.4, DECK0 - 0.01, z]];
    m.slab("green", outline(z0 - 0.01), [0, 0, 0.03]);
    m.slab("green", outline(z1 - 0.01), [0, 0, 0.03]);
    // the scrolled ironwork and the lining on the outer stringer
    for (let k = 0; k < STAIR_STEPS; k += 2) {
      const x = stairX(k + 0.5) + 0.02;
      const y = stairY(k + 0.5) - 0.12;
      m.slab("lining", ngon(6, 0.05, 0, x, y).map(([a, b]) => [a, b, z0 - 0.014] as Vec3), [0, 0, 0.004]);
    }
    // the handrails: up the outside and the inside
    // a newel at the foot, then 0.9 m over the treads' nosings up to the deck's top rail
    for (const z of [z0 - 0.03, z1 + 0.03]) {
      const foot: Vec3 = [stairX(0) + 0.07, stairY(0) + 0.9, z];
      const top: Vec3 = [stairX(STAIR_STEPS - 1) - 0.03, RAIL_TOP, z];
      m.rod("brass", [foot[0], PLAT, z], foot, 0.016, 6);
      m.rod("brass", foot, top, 0.016, 6);
    }
  });
}

// ---------------------------------------------------------------------------
// the top deck

/** The deck's plan at one end, from the middle (x 0) out over the platform; `hole` leaves the stair's well open. */
function deckEnd(m: MeshBuilder): void {
  // over the saloon's half: the whole width
  const full: Ring = ccw([[0, -HW - 0.04], [SAL + 0.06, -HW - 0.04], [SAL + 0.06, HW + 0.04], [0, HW + 0.04]]);
  // over the platform: the bow of the dash, less the stair's well
  const bow = dashPts(8, -0.04, STAIR_Z[1] + 0.02, HW + 0.04).reverse();
  const over: Ring = ccw([[SAL + 0.06, STAIR_Z[1] + 0.02], [SAL + 0.06, HW + 0.04], ...bow.map(([x, z]) => [x, z] as [number, number])]);
  for (const r of [full, over]) {
    m.prism("timber", r, DECK0, DECK);
    m.cap("timber", r, DECK0, false);
  }
  // the green fascia round the platform's canopy
  const fascia = dashPts(8, -0.045, -HW - 0.045, HW + 0.045).map(([x, z]) => [x, DECK0 - 0.06, z] as Vec3);
  for (let i = 0; i + 1 < fascia.length; i++) {
    const [a, b] = [fascia[i]!, fascia[i + 1]!];
    m.slab("green", [a, b, [b[0], DECK - 0.01, b[2]], [a[0], DECK - 0.01, a[2]]], [-0.03, 0, 0]);
  }
  // the canopy's sides back to the cornice
  for (const s of [-1, 1]) {
    const z = side(s, HW + 0.04, HW + 0.045);
    block(m, "green", SAL + 0.03, dashX(s * (HW + 0.045)) + 0.045, DECK0 - 0.06, DECK - 0.01, ...z);
  }
}

/** The railing round one end's half of the deck: posts, a mid and a top rail, the decency board. */
function railingEnd(m: MeshBuilder): void {
  const zs = HW - 0.02;
  // along the right side from the middle to the canopy, round the bow, back along the stair's well
  const well = STAIR_Z[1] + 0.05;
  const bow = dashPts(5, 0.02, well, zs).reverse().map(([x, z]) => [x, z] as [number, number]);
  const path: Array<[number, number]> = [[0, zs], [0.9, zs], [1.8, zs], [SAL + 0.1, zs], ...bow, [SAL + 0.12, well]];
  // the left side, from the middle to the stair's head
  const left: Array<[number, number]> = [[0, -zs], [0.9, -zs], [1.8, -zs], [SAL - 0.02, -zs]];
  for (const line of [path, left]) {
    for (const [x, z] of line) if (x > 0.01) m.rod("brass", [x, DECK, z], [x, RAIL_TOP + 0.02, z], 0.022, 5);
    for (const y of [RAIL_MID, RAIL_TOP]) rods(m, "brass", line.map(([x, z]) => [x, y, z] as Vec3), 0.02, 5, false);
  }
  // the decency boards along the sides, a cream panel on each
  for (const s of [-1, 1]) {
    block(m, "green", 0, SAL, DECK + 0.02, RAIL_MID - 0.05, ...side(s, HW - 0.03, HW - 0.012));
    block(m, "cream", 0.15, SAL - 0.2, DECK + 0.08, RAIL_MID - 0.11, ...side(s, HW - 0.012, HW - 0.008));
  }
  // the bell on the front rail
  m.scope("bell", () => {
    const [x, z] = [dashX(0.3) + 0.02, 0.3];
    m.rod("iron", [x, RAIL_TOP, z], [x - 0.12, RAIL_TOP + 0.06, z], 0.012, 5);
    m.loft("brass", ngon(10, 0.04, 0, x - 0.12, z), RAIL_TOP - 0.06, ngon(10, 0.02, 0, x - 0.12, z), RAIL_TOP + 0.04);
    m.loft("brass", ngon(10, 0.065, 0, x - 0.12, z), RAIL_TOP - 0.12, ngon(10, 0.04, 0, x - 0.12, z), RAIL_TOP - 0.06, false);
    m.cap("brass", ngon(10, 0.065, 0, x - 0.12, z), RAIL_TOP - 0.12, false);
  });
}

/** A slatted bench: seat slats along `axis`, a slatted back, cast-iron ends. */
/** A slatted bench across the deck from z0 to z1, facing +x, its slatted back at x0 on cast-iron ends. */
function bench(m: MeshBuilder, x0: number, z0: number, z1: number): void {
  const y = DECK + 0.42;
  for (let k = 0; k < 3; k++) block(m, "seatWood", x0 + 0.04 + k * 0.12, x0 + 0.14 + k * 0.12, y - 0.035, y, z0, z1);
  for (const h of [0.12, 0.26, 0.4]) block(m, "seatWood", x0, x0 + 0.03, y + h, y + h + 0.08, z0, z1);
  for (const z of [z0 + 0.04, z1 - 0.04]) {
    block(m, "iron", x0 + 0.02, x0 + 0.36, DECK, y - 0.035, z - 0.02, z + 0.02);
    block(m, "iron", x0 - 0.01, x0 + 0.002, y - 0.035, y + 0.5, z - 0.02, z + 0.02);
  }
}

function topDeck(m: MeshBuilder): void {
  m.scope("top deck", () => {
    m.scope("knifeboard", () => {
      // two seats back to back along the middle, sharing one slatted back
      for (const s of [-1, 1]) {
        const y = DECK + 0.42;
        for (let k = 0; k < 3; k++) block(m, "seatWood", -2.0, 2.0, y - 0.035, y, ...side(s, 0.07 + k * 0.12, 0.17 + k * 0.12));
      }
      for (const h of [0.12, 0.26, 0.4]) block(m, "seatWood", -2.0, 2.0, DECK + 0.42 + h, DECK + 0.5 + h, -0.025, 0.025);
      for (const x of [-1.95, -0.98, 0, 0.98, 1.95]) {
        for (const s of [-1, 1]) block(m, "iron", x - 0.025, x + 0.025, DECK, DECK + 0.385, ...side(s, 0.34, 0.39));
        block(m, "iron", x - 0.02, x + 0.02, DECK + 0.385, DECK + 0.95, -0.04, 0.04);
      }
    });
    // the railing's middle posts, where the two ends' halves meet
    m.scope("railing", () => { for (const s of [-1, 1]) m.rod("brass", [0, DECK, s * (HW - 0.02)], [0, RAIL_TOP + 0.02, s * (HW - 0.02)], 0.022, 6); });
  });
}

/** The parts of the car at one end, drawn at +x. */
function carEnd(m: MeshBuilder): void {
  bulkhead(m);
  platform(m);
  dash(m);
  gate(m);
  stair(m);
  m.scope("top deck", () => {
    m.scope("floor", () => deckEnd(m));
    m.scope("railing", () => railingEnd(m));
    m.scope("end bench", () => bench(m, 2.42, STAIR_Z[1] + 0.1, HW - 0.1));
  });
}

// ---------------------------------------------------------------------------
// the horse: a Clydesdale, its parts jointed for the trot
//
// Horse coordinates: x along the horse from its middle, y up from the ground; the
// horse stands with its middle at HX.

const HX = HALF + HORSE_AHEAD;
/** The legs' hip and shoulder joints, the knees and hocks, and the leg's length to the hoof's sole. */
const LEG_TOP = 1.08;
const KNEE = 0.55;
const LEG_LEN = LEG_TOP;
/** The horse's leg from the shoulder or hip joint to the sole, straight (metres). */
export const HORSE_LEG_LENGTH = LEG_LEN;
const HOOF_HALF = 0.105;
type Leg = "front-left" | "front-right" | "hind-left" | "hind-right";
const LEGS: readonly Leg[] = ["front-left", "front-right", "hind-left", "hind-right"];
const legX = (l: Leg): number => (l.startsWith("front") ? 0.52 : -0.64);
const legZ = (l: Leg): number => (l.endsWith("left") ? -0.19 : 0.19);
const BODY_PIVOT: Vec3 = [HX, 1.25, 0];
const NECK_PIVOT: Vec3 = [HX + 0.66, 1.46, 0];
const TAIL_PIVOT: Vec3 = [HX - 0.97, 1.5, 0];

/** The barrel's stations: x, the centre's height, half width, half height. */
const BARREL: ReadonlyArray<readonly [number, number, number, number]> = [
  [-1.0, 1.36, 0.07, 0.08],
  [-0.95, 1.33, 0.2, 0.24],
  [-0.82, 1.3, 0.3, 0.33],
  [-0.62, 1.28, 0.34, 0.37],
  [-0.35, 1.25, 0.35, 0.38],
  [0.0, 1.23, 0.37, 0.41],
  [0.35, 1.26, 0.35, 0.41],
  [0.62, 1.31, 0.3, 0.39],
  [0.82, 1.27, 0.22, 0.3],
  [0.93, 1.22, 0.1, 0.14],
];

/** The barrel's section at horse x (interpolated): its centre's height, half width, half height. */
function barrelAt(x: number): [number, number, number] {
  for (let i = 1; i < BARREL.length; i++) {
    const [xa, ya, wa, ha] = BARREL[i - 1]!;
    const [xb, yb, wb, hb] = BARREL[i]!;
    if (x <= xb || i === BARREL.length - 1) {
      const t = Math.min(1, Math.max(0, (x - xa) / (xb - xa)));
      return [ya + (yb - ya) * t, wa + (wb - wa) * t, ha + (hb - ha) * t];
    }
  }
  return [BARREL[0]![1], BARREL[0]![2], BARREL[0]![3]];
}

const H = (x: number, y: number, z: number): Vec3 => [HX + x, y, z];

/** The neck's axis from its root at the shoulders to the poll, and its stations: t, half width, half depth. */
const NECK_A: Vec3 = H(0.6, 1.42, 0);
const NECK_B: Vec3 = H(1.1, 1.98, 0);
const NECK: ReadonlyArray<readonly [number, number, number]> = [[0, 0.25, 0.38], [0.35, 0.2, 0.3], [0.7, 0.16, 0.23], [1.0, 0.13, 0.18]];
/** The head's axis from the poll to the muzzle. */
const HEAD_A: Vec3 = H(1.05, 2.04, 0);
const HEAD_B: Vec3 = H(1.56, 1.39, 0);
const HEAD: ReadonlyArray<readonly [number, number, number]> = [[0, 0.12, 0.14], [0.18, 0.13, 0.17], [0.5, 0.11, 0.13], [0.82, 0.095, 0.11], [1.0, 0.085, 0.09]];

const along = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, mul(sub(b, a), t));

function barrel(m: MeshBuilder): void {
  m.scope("barrel", () => skin(m, "horseCoat", BARREL.map(([x, y, w, h]) => ring(H(x, y, 0), Z, Y, w, h, 16))));
}

function harness(m: MeshBuilder): void {
  m.scope("harness", () => {
    const { d, up } = axisXY(NECK_A, NECK_B);
    // the collar: a padded ring round the neck's root, the brass hames on it
    m.scope("collar", () => {
      const c = along(NECK_A, NECK_B, 0.16);
      const rings = [[-0.08, 1.02], [-0.02, 1.32], [0.04, 1.3], [0.09, 1.02]].map(([s, k]) => ring(add(c, mul(d, s!)), Z, up, 0.25 * k!, 0.36 * k!, 14, Math.PI / 2));
      skin(m, "collar", rings, { start: false, end: false });
      for (const s of [-1, 1]) {
        const pts = [1.05, 0.6, 0.2, -0.25, -0.6].map((a): Vec3 => add(add(c, mul(d, 0.08)), add(mul(Z, s * 0.33 * Math.cos(a)), mul(up, 0.47 * Math.sin(a)))));
        rods(m, "hames", pts, 0.022, 5);
        m.rod("hames", pts[0]!, add(pts[0]!, mul(up, 0.1)), 0.018, 6);
      }
    });
    // the back pad and its brass terrets, the girth round the barrel
    m.scope("back pad", () => {
      const [y, , h] = barrelAt(0.3);
      block(m, "harness", HX + 0.18, HX + 0.44, y + h - 0.08, y + h + 0.06, -0.2, 0.2);
      block(m, "collar", HX + 0.2, HX + 0.42, y + h - 0.1, y + h + 0.03, -0.27, 0.27);
      for (const z of [-0.1, 0.1]) m.tube("hames", "x", z, y + h + 0.1, 0.04, 0.025, HX + 0.3, HX + 0.32, 8);
      const girth = (x: number, k: number) => { const [yc, w, hh] = barrelAt(x); return ring(H(x, yc, 0), Z, Y, w * k, hh * k, 16); };
      skin(m, "harness", [girth(0.27, 1.03), girth(0.37, 1.03)], { start: false, end: false });
    });
    // the breeching round the quarters, its hip straps, the crupper along the back
    m.scope("breeching", () => {
      const y = 1.2;
      const pts: Vec3[] = [];
      for (const x of [-0.45, -0.62, -0.8, -0.92, -0.98]) {
        const [yc, w, h] = barrelAt(x);
        const k = Math.sqrt(Math.max(0, 1 - ((y - yc) / h) ** 2));
        pts.push(H(x, y, w * k + 0.02));
      }
      const loop = [...pts, ...[...pts].reverse().slice(1).map(([x, yy, z]): Vec3 => [x, yy, -z])];
      rods(m, "harness", loop, 0.032, 5);
      for (const s of [-1, 1]) {
        const [yc, w, h] = barrelAt(-0.65);
        rods(m, "harness", [H(-0.65, y, s * (w * 0.93 + 0.02)), H(-0.65, yc + h * 0.75, s * w * 0.62), H(-0.65, yc + h + 0.015, 0)], 0.022, 5);
      }
      const spine = [0.3, -0.1, -0.5, -0.85].map((x): Vec3 => { const [yc, , h] = barrelAt(x); return H(x, yc + h + 0.015, 0); });
      rods(m, "harness", [...spine, H(-0.98, 1.48, 0)], 0.022, 5);
    });
    // the traces back to the swingletree on the car's draw hook
    m.scope("traces", () => {
      for (const s of [-1, 1]) {
        const c = along(NECK_A, NECK_B, 0.16);
        const from: Vec3 = add(add(c, mul(d, 0.08)), add(mul(Z, s * 0.33), mul(up, -0.18)));
        const mid: Vec3 = H(0.1, 1.08, s * 0.44);
        const to: Vec3 = [SWINGLE_X, 0.79, s * 0.52];
        rods(m, "iron", [from, mid, to], 0.016, 4);
        // the trace bearer from the back pad
        m.rod("harness", H(0.3, 1.55, s * 0.24), mid, 0.014, 4);
      }
    });
    // the reins from the bit back to the driver at the dash
    m.scope("reins", () => {
      const bit = along(HEAD_A, HEAD_B, 0.86);
      const c = along(NECK_A, NECK_B, 0.16);
      for (const s of [-1, 1]) {
        const hame = add(add(c, mul(d, 0.09)), add(mul(Z, s * 0.27), mul(up, 0.4)));
        rods(m, "harness", [add(bit, [0, 0, s * 0.1]), add(along(NECK_A, NECK_B, 0.75), mul(Z, s * 0.2)), hame, H(0.31, 1.84, s * 0.1), [2.9, 2.0, s * 0.22]], 0.009, 4);
      }
    });
  });
}

function head(m: MeshBuilder): void {
  m.scope("neck", () => {
    const { up } = axisXY(NECK_A, NECK_B);
    skin(m, "horseCoat", NECK.map(([t, w, h]) => ring(along(NECK_A, NECK_B, t), Z, up, w, h, 12, Math.PI / 12)));
    // the mane along the crest, falling to the right as a Clydesdale's does
    const mane = [0.12, 0.45, 0.78, 1.02].map((t) => {
      const h = NECK[Math.min(3, Math.round(t * 3))]![2];
      return ring(add(along(NECK_A, NECK_B, t), add(mul(up, h * 0.92), mul(Z, 0.03))), Z, up, 0.05, 0.07, 6);
    });
    skin(m, "horseMane", mane);
  });
  m.scope("head", () => {
    const { up } = axisXY(HEAD_A, HEAD_B);
    // the face's front is the +up side of the head; a flat there carries the blaze
    const rot = Math.PI / 2 - Math.PI / 10;
    const rings = HEAD.map(([t, w, h]) => ring(along(HEAD_A, HEAD_B, t), Z, up, w, h, 10, rot));
    skin(m, "horseCoat", rings.slice(0, 4), { end: false });
    skin(m, "muzzle", rings.slice(3), { start: false });
    // the white blaze down the face to the muzzle
    for (let r = 0; r + 1 < 4; r++) {
      const [a, b] = [rings[r]!, rings[r + 1]!];
      const n = cross(sub(a[1]!, a[0]!), sub(b[0]!, a[0]!));
      const nn = mul(n, (dot(n, up) > 0 ? 1 : -1) / Math.hypot(...n));
      const k = r === 0 ? 0.55 : 0.8;
      const pa = [add(a[0]!, mul(sub(a[1]!, a[0]!), (1 - k) / 2)), add(a[0]!, mul(sub(a[1]!, a[0]!), (1 + k) / 2))];
      const pb = [add(b[0]!, mul(sub(b[1]!, b[0]!), 0.1)), add(b[0]!, mul(sub(b[1]!, b[0]!), 0.9))];
      m.slab("horseWhite", [pa[0]!, pa[1]!, pb[1]!, pb[0]!].map((p) => add(p, mul(nn, 0.004))), mul(nn, -0.003));
    }
    // the eyes, the nostrils
    for (const s of [-1, 1]) {
      const e = add(along(HEAD_A, HEAD_B, 0.22), add(mul(Z, s * 0.115), mul(up, 0.04)));
      m.rod("eye", add(e, [0, 0, -s * 0.01]), add(e, [0, 0, s * 0.012]), 0.028, 6);
      const nose = add(along(HEAD_A, HEAD_B, 0.97), add(mul(Z, s * 0.045), mul(up, 0.05)));
      m.rod("eye", nose, add(nose, mul(sub(HEAD_B, HEAD_A), 0.06)), 0.018, 5);
    }
    // the ears and the forelock
    m.scope("ears", () => {
      for (const s of [-1, 1]) {
        const base = add(along(HEAD_A, HEAD_B, 0.04), add(mul(Z, s * 0.07), mul(up, 0.08)));
        const tip = add(base, [-0.04, 0.16, s * 0.03]);
        skin(m, "horseCoat", [ring(base, X, Z, 0.035, 0.045, 5), ring(tip, X, Z, 0.006, 0.008, 5)]);
      }
      const f = add(along(HEAD_A, HEAD_B, 0.08), mul(up, 0.12));
      skin(m, "horseMane", [ring(f, X, Z, 0.05, 0.06, 6), ring(add(f, [0.07, -0.1, 0]), X, Z, 0.02, 0.03, 6)]);
    });
    // the bridle: headpiece and browband, noseband, the blinkers, the bit
    m.scope("bridle", () => {
      const band = (t: number, k: number) => {
        const [, w, h] = HEAD.find((st) => st[0] >= t) ?? HEAD[HEAD.length - 1]!;
        const c = along(HEAD_A, HEAD_B, t);
        const { d } = axisXY(HEAD_A, HEAD_B);
        skin(m, "harness", [ring(add(c, mul(d, -0.02)), Z, up, w * k, h * k, 10, rot), ring(add(c, mul(d, 0.02)), Z, up, w * k, h * k, 10, rot)], { start: false, end: false });
      };
      band(0.12, 1.08);
      band(0.68, 1.16);
      for (const s of [-1, 1]) {
        const b = add(along(HEAD_A, HEAD_B, 0.24), add(mul(Z, s * 0.15), mul(up, 0.03)));
        m.slab("harness", [add(b, [0.07, 0.07, 0]), add(b, [0.08, -0.06, 0]), add(b, [-0.06, -0.06, 0]), add(b, [-0.07, 0.07, 0])], [0, 0, -s * 0.012]);
        rods(m, "harness", [add(along(HEAD_A, HEAD_B, 0.12), add(mul(Z, s * 0.12), mul(up, -0.05))), add(along(HEAD_A, HEAD_B, 0.86), mul(Z, s * 0.085))], 0.012, 4);
      }
      const bit = along(HEAD_A, HEAD_B, 0.86);
      m.rod("hames", add(bit, [0, 0, -0.1]), add(bit, [0, 0, 0.1]), 0.012, 5);
    });
  });
}

function tail(m: MeshBuilder): void {
  m.scope("tail", () => {
    const pts: Array<[Vec3, number, number]> = [[H(-0.97, 1.5, 0), 0.06, 0.07], [H(-1.07, 1.38, 0), 0.08, 0.09], [H(-1.12, 1.1, 0), 0.09, 0.08], [H(-1.1, 0.82, 0), 0.07, 0.05], [H(-1.07, 0.66, 0), 0.02, 0.02]];
    skin(m, "horseMane", pts.map(([c, w, h]) => ring(c, Z, X, w, h, 7)));
  });
}

/** One leg's upper part (forearm or gaskin), drawn in its part pivoted at the shoulder or hip. */
function legUpper(m: MeshBuilder, l: Leg): void {
  const [x, z] = [legX(l), legZ(l)];
  const front = l.startsWith("front");
  const st: Array<[number, number, number, number]> = front
    ? [[1.24, 0.0, 0.12, 0.16], [1.0, 0.01, 0.095, 0.12], [0.75, 0.0, 0.068, 0.085], [0.58, 0.0, 0.064, 0.08], [KNEE, 0.0, 0.064, 0.08]]
    : [[1.28, 0.03, 0.15, 0.21], [1.0, -0.01, 0.11, 0.16], [0.75, -0.04, 0.072, 0.1], [0.6, -0.07, 0.062, 0.1], [KNEE, -0.04, 0.06, 0.075]];
  skin(m, "horseCoat", st.map(([y, dx, rz, rx]) => ring(H(x + dx, y, z), X, Z, rx, rz, 8, Math.PI / 8)));
}

/** One leg's lower part: cannon, the white feathered fetlock, the hoof; pivoted at the knee or hock. */
function legLower(m: MeshBuilder, l: Leg): void {
  const [x, z] = [legX(l), legZ(l)];
  const r = (y: number, rx: number, rz: number, dx = 0) => ring(H(x + dx, y, z), X, Z, rx, rz, 8, Math.PI / 8);
  skin(m, "horseWhite", [r(KNEE + 0.02, 0.068, 0.062), r(0.42, 0.052, 0.05), r(0.3, 0.056, 0.052)], { start: false });
  // the feather: long white hair flaring over the hoof
  skin(m, "horseWhite", [r(0.36, 0.06, 0.056), r(0.24, 0.085, 0.08, 0.01), r(0.12, 0.125, 0.115, 0.02), r(0.075, 0.13, 0.12, 0.02)]);
  skin(m, "hoof", [r(0.1, 0.085, 0.08, 0.02), r(0.0, HOOF_HALF, 0.095, 0.02)]);
}

const legNode = (l: Leg) => `horse-leg-${l}`;
const shinNode = (l: Leg) => `horse-shin-${l}`;
/** The horse's moving parts: the body, then its children depth first. */
export const HORSE_NODES: readonly string[] = ["horse", "horse-head", "horse-tail", ...LEGS.flatMap((l) => [legNode(l), shinNode(l)])];

const r3 = (v: number): number => Math.round(v * 1e3) / 1e3;
const pivotOf = (p: Vec3): Vec3 => [r3(p[0]), r3(p[1]), r3(p[2])];

/** The horse in its harness: the body a part, the head, the tail and the legs' two parts its children. */
function horse(m: MeshBuilder): void {
  m.spin("horse", pivotOf(BODY_PIVOT), () => {
    barrel(m);
    harness(m);
    m.spin("horse-head", pivotOf(NECK_PIVOT), () => head(m));
    m.spin("horse-tail", pivotOf(TAIL_PIVOT), () => tail(m));
    m.scope("legs", () => {
      for (const l of LEGS) {
        m.spin(legNode(l), pivotOf(H(legX(l), LEG_TOP, legZ(l))), () => {
          legUpper(m, l);
          m.spin(shinNode(l), pivotOf(H(legX(l), KNEE, legZ(l))), () => legLower(m, l));
        });
      }
    });
  });
}

/** Where the swingletree hangs ahead of the front dash. */
const SWINGLE_X = 3.42;

function swingletree(m: MeshBuilder): void {
  m.scope("swingletree", () => {
    m.rod("timber", [SWINGLE_X, 0.79, -0.56], [SWINGLE_X, 0.79, 0.56], 0.035, 6);
    for (const s of [-1, 1]) m.rod("iron", [SWINGLE_X, 0.79, s * 0.56], [SWINGLE_X + 0.05, 0.79, s * 0.56], 0.03, 6);
    rods(m, "iron", [[3.24, 0.72, 0], [3.33, 0.76, 0], [SWINGLE_X, 0.79, 0]], 0.018, 5);
  });
}

// ---------------------------------------------------------------------------
// the trot

/** The clip's name. */
export const TROT_CLIP = "trot";
/** The ground the horse covers in one stride (a full cycle of the four legs), metres. */
export const TROT_STRIDE = 1.6;
/** Samples per stride (plus the closing one). */
export const TROT_SAMPLES = 24;
/** Each leg's phase in the stride: the diagonal pairs move together, half a stride apart. */
const PHASE: Record<Leg, number> = { "front-left": 0, "hind-right": 0, "front-right": 0.5, "hind-left": 0.5 };

/** A leg at its own phase u (0..1): stance in the first half (the hoof planted, sliding back under the body as the horse goes on), swing in the second (the knee folded, the leg reaching forward). */
function legPose(u: number, fold: number): { swing: number; knee: number } {
  const a = TROT_STRIDE / 4;
  const max = Math.asin(a / LEG_LEN);
  if (u < 0.5) return { swing: Math.asin((a * (1 - 4 * u)) / LEG_LEN), knee: 0 };
  const s = (u - 0.5) / 0.5;
  return { swing: -max * Math.cos(Math.PI * s), knee: -fold * Math.sin(Math.PI * s) };
}

export interface TrotPose {
  lift: number;
  nod: number;
  tail: number;
  legs: Record<Leg, { swing: number; knee: number }>;
}

/** The lowest hoof's sole over the ground for a pose, before the body's lift. */
function lowestHoof(p: TrotPose): number {
  let low = Infinity;
  for (const l of LEGS) {
    const { swing, knee } = p.legs[l];
    // the knee hangs (KNEE - LEG_TOP) under the shoulder; the sole LEG_TOP - (LEG_TOP - KNEE) under the knee
    const ky = (KNEE - LEG_TOP) * Math.cos(swing);
    const t = swing + knee;
    // the sole's corners (legLower's last ring): the knee's frame turned by swing + knee
    for (let k = 0; k < 8; k++) {
      const sx = 0.02 + HOOF_HALF * Math.cos(Math.PI / 8 + (k * Math.PI) / 4);
      low = Math.min(low, LEG_TOP + ky + sx * Math.sin(t) - KNEE * Math.cos(t));
    }
  }
  return low;
}

/** The horse at a phase of its stride, 0..1: the legs, a nod of the head, a swish of the tail, the body lifted so the planted hooves stand on the ground. */
export function trotPose(phase: number): TrotPose {
  const legs = Object.fromEntries(LEGS.map((l) => [l, legPose((phase + PHASE[l]) % 1, l.startsWith("front") ? 1.25 : 0.95)])) as TrotPose["legs"];
  const p: TrotPose = { lift: 0, nod: 0.045 * Math.sin(2 * TAU * phase + 0.6), tail: 0.12 * Math.sin(TAU * phase), legs };
  return { ...p, lift: -lowestHoof(p) };
}

const quat = (q: Quat): number[] => q.map(r6);

function addTrot(m: MeshBuilder): void {
  const duration = TROT_STRIDE / ROLLING_SPEED;
  const poses = Array.from({ length: TROT_SAMPLES }, (_, k) => trotPose(k / TROT_SAMPLES));
  poses.push(poses[0]!);
  const times = poses.map((_, k) => r9((k * duration) / TROT_SAMPLES));
  const rot = (f: (p: TrotPose) => Quat) => poses.flatMap((p) => quat(f(p)));
  m.animate({
    name: TROT_CLIP,
    times,
    drive: { drive: "distance", speed: ROLLING_SPEED },
    tracks: [
      // within the horse's section, whose node stands at the hitch
      { node: "horse", path: "translation", values: poses.flatMap((p) => [r6(BODY_PIVOT[0] - HORSE_HITCH[0]), r6(BODY_PIVOT[1] + p.lift - HORSE_HITCH[1]), 0]) },
      { node: "horse-head", path: "rotation", values: rot((p) => qAxis(2, p.nod)) },
      { node: "horse-tail", path: "rotation", values: rot((p) => qMul(qAxis(1, p.tail), qAxis(2, -0.04 * Math.abs(p.tail) / 0.12))) },
      ...LEGS.flatMap((l) => [
        { node: legNode(l), path: "rotation" as const, values: rot((p) => qAxis(2, p.legs[l].swing)) },
        { node: shinNode(l), path: "rotation" as const, values: rot((p) => qAxis(2, p.legs[l].knee)) },
      ]),
    ],
  });
}

// ---------------------------------------------------------------------------
// the design's build functions

/** The car's section and the horse's: their nodes, front first in the game's eyes but the car first here, the body the horse is hitched to. */
export const CAR_SECTION = "section0";
export const HORSE_SECTION = "section1";
/** The hitch: the draw hook's pin, which the swingletree (and the horse with it) turns about. */
export const HORSE_HITCH: Vec3 = [3.24, 0.75, 0];
/** Where the horse stands on the track: under its forelegs and its hind legs (model x). */
export const HORSE_SUPPORTS: readonly [number, number] = [r3(HX + legX("hind-left")), r3(HX + legX("front-left"))];

/**
 * The horse and its car as the game poses them (docs/models/world-trams.md "The
 * horse tram"): two sections hitched at the draw hook with no joint between them,
 * like an articulated tram whose first section is the horse. The car rides its two
 * wheelsets; the horse stands on the track at its forelegs and hind legs (two lone
 * supports, `axleAt`), so the game sets it on the track's centre line and at the
 * track's height wherever it is, on a curve and over a change of grade alike.
 */
function hitch(m: MeshBuilder): void {
  m.rig = {
    sections: [
      { node: CAR_SECTION, pivot: [0, 0, 0] },
      { node: HORSE_SECTION, pivot: HORSE_HITCH },
    ],
    joints: [],
    maxBendDeg: 60,
  };
}

/** The horse tram: the car, the horse in its harness as the section ahead of it, the rolling wheels and the trot. */
export function horseTram(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.part(CAR_SECTION, [0, 0, 0], () => {
    saloon(m);
    for (const e of [1, -1]) {
      m.scope(e > 0 ? "front end" : "rear end", () => (e > 0 ? carEnd(m) : m.turned(0, () => carEnd(m))));
    }
    topDeck(m);
    m.scope("running gear", () => runningGear(m));
  });
  m.part(HORSE_SECTION, HORSE_HITCH, () => {
    swingletree(m);
    m.scope("horse", () => horse(m));
    for (const x of HORSE_SUPPORTS) m.axleAt(x, 0);
  });
  hitch(m);
  rollWheels(m, ["wheelset-1", "wheelset-2"], 2 * WHEEL_R);
  addTrot(m);
  return m;
}

/** The distant model: the kit's, from the record. */
export function horseTramLod(): MeshBuilder {
  const s = horseTramSpec();
  return worldTramLod(s, tramLodBudget(s));
}
