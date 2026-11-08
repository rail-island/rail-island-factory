// The animal-drawn trams (docs/models/animal-drawn-vehicles.md): the cars drawn here,
// the team ahead of them the kit's (animalVehicleKit.ts, draftAnimals.ts).
//
//   veh-animal-tram-double-deck  a double-deck car after the Victor Harbor cars
//                                (assets/animal-tram-double-deck): the saloon with its
//                                panelled sides, curtained windows and end bulkheads,
//                                an open platform at each end under the top deck (bowed
//                                dash, emblem, lamp, brake staff, gate, step and a steep
//                                stair), the open top deck with its railings, decency
//                                boards, knifeboard and end benches, the single truck on
//                                spoked wheelsets that roll.
//   veh-animal-tram-closed       a closed European car of the 1870s-1890s (Prague 1875,
//                                the Doebeln car; assets/animal-tram-closed): a saloon of
//                                five windows a side with longitudinal benches, an arched
//                                roof over both open platforms, a lantern clerestory,
//                                chamfered dashes, side steps.
//   veh-animal-tram-toastrack    the Douglas Bay open summer car (assets/animal-tram-
//                                toastrack): eight reversible cross benches between posts,
//                                a canopy with a clerestory and scalloped valance, running
//                                boards, a solid red dash at each end.
//   veh-animal-tram-bobtail      the American one-man bobtail (assets/animal-tram-bobtail):
//                                a short clerestoried body closed at the front with the
//                                fare box inside, the driver's dash platform, a rear door,
//                                platform and step; not the same at both ends.
//
// Axes as every rail vehicle's: metres, +X forward (the team's end), +Y up, +Z to
// the right, the car centred on x 0, the treads on y 0. The car is the same at both
// ends turned about the vertical axis (`turned`).

import { MeshBuilder } from "./meshBuilder.ts";
import { ngon, type Ring, type Vec3 } from "./meshCore.ts";
import { TRAM_PALETTE } from "./tramKit.ts";
import { TRAM_CATALOG } from "./trams.ts";
import { block, side } from "./vehicleParts.ts";
import { TAU } from "./characterKit.ts";
import { lodBlock, lodPolygon, lodRoofBox, lodSideBox } from "./lodKit.ts";
import type { CatalogFields, ParamValues, ProceduralDesign } from "./design.ts";
import { animalVehicleDesign, buildAnimalVehicle, buildAnimalVehicleLod, type AnimalVehicleSpec } from "./animalVehicleKit.ts";

/** The horsecars: trams drawn by their team (the Animal chip and pill). */
const HORSECAR_CATALOG: CatalogFields = { ...TRAM_CATALOG, traction: "animal" };

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
};

// ---------------------------------------------------------------------------
// shared drawing helpers


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
// the design

/** The car's distant model: the saloon and platforms, the top deck's railing, the truck. */
function doubleDeckLod(m: MeshBuilder): void {
  lodSideBox(m, "green", [[-HALF, 0.75], [HALF, 0.75], [HALF, 2.0], [-HALF, 2.0]], -HW, HW);
  lodSideBox(m, "cream", [[-SAL, 2.0], [SAL, 2.0], [SAL, DECK], [-SAL, DECK]], -HW, HW);
  lodSideBox(m, "green", [[-HALF, DECK], [HALF, DECK], [HALF, RAIL_TOP], [-HALF, RAIL_TOP]], -HW, HW, true);
  lodSideBox(m, "bogie", [[-1.2, 0.0], [1.2, 0.0], [1.2, 0.75], [-1.2, 0.75]], -0.8, 0.8);
}

const DOUBLE_DECK: AnimalVehicleSpec = {
  id: "veh-animal-tram-double-deck",
  title: "Double-Deck Horsecar",
  kind: "tram",
  catalog: HORSECAR_CATALOG,
  palette: PALETTE,
  weight: 2.0,
  maxspeed: 15,
  hitch: [3.24, 0.75, 0],
  reins: [2.9, 2.0, 0],
  body: (m) => {
    saloon(m);
    for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => (e > 0 ? carEnd(m) : m.turned(0, () => carEnd(m))));
    topDeck(m);
    m.scope("running gear", () => runningGear(m));
  },
  rolling: [{ nodes: ["wheelset-1", "wheelset-2"], diameter: 2 * WHEEL_R }],
  lod: doubleDeckLod,
  references: "animal-tram-double-deck",
};

export const animalTramDoubleDeck = (p?: ParamValues) => buildAnimalVehicle(DOUBLE_DECK, p);
export const animalTramDoubleDeckLod = (p?: ParamValues) => buildAnimalVehicleLod(DOUBLE_DECK, p);

// ===========================================================================
// the single-deck cars: shared parts
//
// Drawn like the double-deck car (the same frame, the same standard-gauge treads), but
// from parameters: a spoked wheelset of any radius, a truck of any wheelbase, an arched
// roof, a clerestory with hooded ends, a straight dash with chamfered corners.

/** The truck of a single-deck car: its wheel radius, half wheelbase, half frame length, centre and the sole bars' underside. */
interface Gear {
  r: number;
  ax: number;
  frame: number;
  x?: number;
  sole: number;
}

const axleY = (r: number): number => r * Math.cos(Math.PI / TYRE_SIDES);

/** A spoked wheelset of radius r (a rolling part) at x: axle, two tyres on the standard tread, hubs, `spokes` spokes each. */
function spokedWheelset(m: MeshBuilder, name: string, x: number, r: number, spokes = 8): void {
  const ay = axleY(r);
  m.spin(name, [x, ay, 0], () => m.scope("wheelset", () => {
    const axle = ngon(10, 0.06, 0, x, ay);
    m.sweep("steel", "z", axle, -0.9, axle, 0.9);
    for (const s of [-1, 1]) {
      const [t0, t1] = side(s, 0.665, 0.8);
      m.tube("steel", "z", x, ay, r, r - 0.065, t0, t1, TYRE_SIDES, Math.PI / TYRE_SIDES);
      const hub = ngon(10, 0.09, 0, x, ay);
      const [h0, h1] = side(s, 0.67, 0.8);
      m.sweep("wheel", "z", hub, h0, hub, h1);
      const zc = s * 0.725;
      for (let k = 0; k < spokes; k++) {
        const a = (TAU * (k + 0.5)) / spokes;
        const [c, sn] = [Math.cos(a), Math.sin(a)];
        m.rod("wheel", [x + 0.08 * c, ay + 0.08 * sn, zc], [x + (r - 0.06) * c, ay + (r - 0.06) * sn, zc], 0.02, 4, false);
      }
    }
  }));
}

/** The truck: two rolling wheelsets in an outside frame, axle boxes, leaf springs and hangers, wooden brake blocks. */
function truckGear(m: MeshBuilder, g: Gear): void {
  const ay = axleY(g.r);
  const xc = g.x ?? 0;
  m.scope("truck", () => {
    spokedWheelset(m, "wheelset-1", xc + g.ax, g.r);
    spokedWheelset(m, "wheelset-2", xc - g.ax, g.r);
    m.scope("frame", () => {
      for (const s of [-1, 1]) {
        block(m, "bogie", xc - g.frame, xc + g.frame, ay + 0.08, ay + 0.19, ...side(s, 0.86, 0.93));
        for (const x of [xc - g.ax, xc + g.ax]) {
          block(m, "iron", x - 0.14, x + 0.14, ay - 0.12, ay + 0.1, ...side(s, 0.84, 0.96));
          for (let k = 0; k < 3; k++) {
            const half = 0.32 - k * 0.08;
            const y = Math.min(ay + 0.28, g.sole - 0.06) - k * 0.022;
            block(m, "spring", x - half, x + half, y, y + 0.02, ...side(s, 0.865, 0.925));
          }
          for (const d of [-0.31, 0.31]) m.rod("iron", [x + d, Math.min(ay + 0.28, g.sole - 0.06) + 0.01, s * 0.895], [x + d, g.sole + 0.01, s * 0.895], 0.015, 4);
        }
      }
      for (const x of [xc - g.frame + 0.03, xc + g.frame - 0.03]) block(m, "bogie", x - 0.03, x + 0.03, ay + 0.09, ay + 0.17, -0.86, 0.86);
    });
    m.scope("brakes", () => {
      for (const e of [-1, 1]) {
        const xb = xc + e * g.ax - e * (g.r + 0.04);
        for (const s of [-1, 1]) block(m, "timber", xb - 0.035, xb + 0.035, ay - 0.12, ay + 0.12, ...side(s, 0.67, 0.78));
        m.rod("iron", [xb, ay, -0.8], [xb, ay, 0.8], 0.022, 6);
      }
      m.rod("iron", [xc - g.ax + g.r + 0.04, ay, 0.2], [xc + g.ax - g.r - 0.04, ay, 0.2], 0.016, 5);
    });
  });
}

/** An arched roof sheet from x0 to x1: half width hw, eaves at y0, rising `rise` at the middle, `t` thick, in n strips. */
function archRoof(m: MeshBuilder, mat: string, x0: number, x1: number, hw: number, y0: number, rise: number, t: number, n = 8): void {
  const y = (z: number): number => y0 + rise * (1 - (z / hw) ** 2);
  for (let i = 0; i < n; i++) {
    const za = -hw + (2 * hw * i) / n;
    const zb = -hw + (2 * hw * (i + 1)) / n;
    const r: Ring = [[za, y(za)], [zb, y(zb)], [zb, y(zb) + t], [za, y(za) + t]];
    m.sweep(mat, "x", r, x0, r, x1);
  }
}

/** The arch's outline across the car at x (z, y), from y0 up to the arch's underside: an end's gable or a fascia board. */
function archOutline(hw: number, y0: number, yEave: number, rise: number, n = 8): Array<readonly [number, number]> {
  const top = Array.from({ length: n + 1 }, (_, i) => {
    const z = hw - (2 * hw * i) / n;
    return [z, yEave + rise * (1 - (z / hw) ** 2)] as const;
  });
  return [[-hw, y0], [hw, y0], ...top];
}

/** A clerestory (the raised deck roof) from x0 to x1, cw half wide, from yb `h` high, its ends hooded down over `hood`, `lights` small windows a side. */
function clerestory(m: MeshBuilder, o: { x0: number; x1: number; hood: number; cw: number; yb: number; h: number; lights: number; wall: string; roof: string }): void {
  m.scope("clerestory", () => {
    const { x0, x1, hood, cw, yb, h } = o;
    block(m, o.wall, x0, x1, yb, yb + h, -cw, cw);
    // the hooded ends, sloping down to the roof
    for (const e of [-1, 1]) {
      const xa = e > 0 ? x1 : x0;
      const full: Ring = [[-cw - 0.03, yb + h], [cw + 0.03, yb + h], [cw + 0.03, yb + h + 0.03], [-cw - 0.03, yb + h + 0.03]];
      const low: Ring = [[-cw - 0.03, yb], [cw + 0.03, yb], [cw + 0.03, yb + 0.03], [-cw - 0.03, yb + 0.03]];
      m.sweep(o.roof, "x", full, xa, low, xa + e * hood);
      const side0: Ring = [[-cw, yb], [cw, yb], [cw, yb + h], [-cw, yb + h]];
      const side1: Ring = [[-cw, yb], [cw, yb], [cw, yb + 0.005], [-cw, yb + 0.005]];
      m.sweep(o.wall, "x", side0, xa, side1, xa + e * (hood - 0.01));
    }
    archRoof(m, o.roof, x0, x1, cw + 0.03, yb + h, 0.04, 0.03, 4);
    if (o.lights) {
      const pitch = (x1 - x0) / o.lights;
      for (const s of [-1, 1]) {
        for (let i = 0; i < o.lights; i++) {
          const a = x0 + i * pitch + 0.05;
          block(m, "glass", a, a + pitch - 0.1, yb + 0.04, yb + h - 0.04, ...side(s, cw, cw + 0.006));
        }
      }
    }
  });
}

/** A straight dash with chamfered corners, plan points (x, z) from the left corner round to the right. */
function chamferDash(xf: number, hw: number, c: number): Array<[number, number]> {
  return [[xf - c, -hw], [xf, -hw + c * 1.4], [xf, hw - c * 1.4], [xf - c, hw]];
}

/** Vertical panels along a plan polyline (x, z), y0 to y1, `t` thick behind. */
function panels(m: MeshBuilder, mat: string, pts: ReadonlyArray<readonly [number, number]>, y0: number, y1: number, t: number, off = 0): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [xa, za] = pts[i]!;
    const [xb, zb] = pts[i + 1]!;
    m.slab(mat, [[xa + off, y0, za], [xb + off, y0, zb], [xb + off, y1, zb], [xa + off, y1, za]], [-t, 0, 0]);
  }
}

/** A head lamp (facing +x) at (x, y, z), and the matching tail lamp's red lens. */
function lamp(m: MeshBuilder, x: number, y: number, z: number, head: boolean): void {
  const r = head ? 0.085 : 0.05;
  const body = ngon(10, r, 0, z, y);
  m.sweep("iron", "x", body, x - 0.05, body, x + 0.11);
  const lens = ngon(10, r - 0.018, 0, z, y);
  m.sweep(head ? "lampHead" : "lampRed", "x", lens, x + 0.11, lens, x + 0.12);
  m.rod("iron", [x + 0.03, y + r, z], [x + 0.03, y + r + 0.06, z], 0.012, 4);
}

/** The draw hook at the front end, its pin at (x, y). */
function drawHook(m: MeshBuilder, x0: number, x: number, y: number): void {
  block(m, "iron", x0, x, y + 0.01, y + 0.06, -0.035, 0.035);
  m.rod("iron", [x, y + 0.035, 0], [x, y - 0.03, 0], 0.025, 6);
}

/** A brake staff standing on the platform at (x, z): its ratchet, the staff, the crank handle. */
function brakeStaff(m: MeshBuilder, x: number, z: number, floor: number, top: number): void {
  m.scope("brake", () => {
    m.prism("iron", ngon(10, 0.07, 0, x, z), floor, floor + 0.04);
    m.rod("steel", [x, 0.6, z], [x, top, z], 0.02, 6);
    m.rod("steel", [x, top, z], [x - 0.22, top, z], 0.017, 5);
    m.rod("varnish", [x - 0.22, top - 0.04, z], [x - 0.22, top + 0.1, z], 0.024, 6);
  });
}

// ===========================================================================
// veh-animal-tram-closed: a closed European horsecar of the 1870s-1890s
// (assets/animal-tram-closed: Prague 1875/76, the Doebeln museum car): a saloon of
// five windows a side with longitudinal benches, an arched roof with a lantern
// clerestory over the saloon, open end platforms under the roof with chamfered
// dashes, side steps both sides, the single truck on spoked wheelsets.

const PALETTE_CLOSED = {
  ...PALETTE,
  claret: { color: "#6b1a26", roughness: 0.45 },
  cream: { color: "#e6d9b2", roughness: 0.5 },
  canvas: { color: "#cbc6b6", roughness: 0.85 },
  seatCane: { color: "#b98a4b", roughness: 0.7 },
};

const C = {
  half: 2.98, // over the dashes
  sal: 2.0, // the saloon's half length
  hw: 1.0,
  floor: 0.88,
  waist: 1.42,
  head: 2.12,
  eave: 2.36,
  rise: 0.12,
  windows: 5,
};
const C_GEAR: Gear = { r: WHEEL_R, ax: 0.85, frame: 1.3, sole: 0.74 };
const C_DASH = chamferDash(C.half - 0.03, C.hw, 0.14);

function closedSaloon(m: MeshBuilder): void {
  const { sal, hw, floor, waist, head, eave } = C;
  m.scope("saloon", () => {
    m.scope("underframe", () => {
      for (const s of [-1, 1]) block(m, "underframe", -C.half + 0.08, C.half - 0.08, C_GEAR.sole, 0.86, ...side(s, 0.6, 0.72));
      block(m, "timber", -sal + 0.04, sal - 0.04, 0.84, floor, -hw + 0.02, hw - 0.02);
    });
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right side" : "left side", () => {
        // the lower panels, their mouldings and lining
        block(m, "claret", -sal, sal, 0.8, waist, ...side(s, hw - 0.04, hw));
        block(m, "varnish", -sal - 0.02, sal + 0.02, 0.79, 0.85, ...side(s, hw - 0.01, hw + 0.02));
        block(m, "cream", -sal - 0.02, sal + 0.02, waist - 0.05, waist + 0.01, ...side(s, hw - 0.01, hw + 0.025));
        const z = side(s, hw, hw + 0.004);
        const pitch = (2 * sal) / C.windows;
        for (let i = 0; i < C.windows; i++) {
          const a = -sal + i * pitch + 0.08;
          const b = a + pitch - 0.16;
          block(m, "lining", a, b, 0.92, 0.935, ...z);
          block(m, "lining", a, b, waist - 0.12, waist - 0.105, ...z);
          block(m, "lining", a, a + 0.015, 0.935, waist - 0.12, ...z);
          block(m, "lining", b - 0.015, b, 0.935, waist - 0.12, ...z);
        }
        // the windows: one pane per bay behind cream pillars, the sash rail, the top lights
        block(m, "glass", -sal + 0.05, sal - 0.05, waist, head, ...side(s, hw - 0.03, hw - 0.024));
        for (let i = 0; i <= C.windows; i++) {
          const x = -sal + i * pitch;
          const [a, b] = i === 0 ? [x, x + 0.09] : i === C.windows ? [x - 0.09, x] : [x - 0.045, x + 0.045];
          block(m, "cream", a, b, waist, head, ...side(s, hw - 0.04, hw));
        }
        block(m, "cream", -sal + 0.04, sal - 0.04, 1.9, 1.93, ...side(s, hw - 0.035, hw - 0.005));
        // the letterboard and its gold line
        block(m, "claret", -sal, sal, head, eave, ...side(s, hw - 0.04, hw));
        block(m, "cream", -sal + 0.1, sal - 0.1, head + 0.05, eave - 0.05, ...z);
        block(m, "lining", -sal + 0.05, sal - 0.05, eave - 0.03, eave - 0.02, ...z);
        // the curtains drawn to the pillars
        for (let i = 0; i < C.windows; i++) {
          const x0 = -sal + i * pitch + 0.05;
          block(m, "curtain", x0, x0 + 0.12, waist + 0.04, 1.88, ...side(s, hw - 0.09, hw - 0.06));
          block(m, "curtain", x0 + pitch - 0.22, x0 + pitch - 0.1, waist + 0.04, 1.88, ...side(s, hw - 0.09, hw - 0.06));
        }
        // the longitudinal bench: cane seat, front board, back up to the sill
        const y = floor + 0.42;
        block(m, "seatCane", -sal + 0.08, sal - 0.08, y - 0.05, y, ...side(s, 0.5, hw - 0.05));
        block(m, "varnish", -sal + 0.08, sal - 0.08, floor, y - 0.05, ...side(s, 0.5, 0.54));
        block(m, "seatCane", -sal + 0.08, sal - 0.08, y, waist + 0.25, ...side(s, hw - 0.1, hw - 0.05));
      });
    }
    m.scope("interior", () => {
      // the hand straps' rails along the ceiling
      for (const s of [-1, 1]) m.rod("brass", [-sal + 0.1, eave - 0.05, s * 0.45], [sal - 0.1, eave - 0.05, s * 0.45], 0.012, 4);
    });
  });
}

/** One end of the closed car, drawn at +x: the bulkhead and its sliding door, the platform, the dash, steps, lamp, brake, hook. */
function closedEnd(m: MeshBuilder): void {
  const { sal, hw, floor, waist, head, eave, rise } = C;
  m.scope("bulkhead", () => {
    const x = sal;
    for (const s of [-1, 1]) {
      block(m, "claret", x - 0.04, x, 0.8, waist, ...side(s, 0.34, hw));
      block(m, "lining", x, x + 0.004, 0.95, waist - 0.12, ...side(s, 0.44, 0.455));
      block(m, "lining", x, x + 0.004, 0.95, waist - 0.12, ...side(s, 0.88, 0.895));
      block(m, "cream", x - 0.045, x + 0.01, waist, head, ...side(s, 0.88, hw));
      block(m, "cream", x - 0.045, x + 0.01, waist, head, ...side(s, 0.32, 0.4));
      block(m, "glass", x - 0.03, x - 0.024, waist, head, ...side(s, 0.4, 0.88));
      block(m, "cream", x - 0.045, x + 0.01, waist - 0.05, waist + 0.01, ...side(s, 0.33, hw + 0.02));
      // the grab rail at the corner
      m.rod("brass", [x + 0.05, 1.0, s * (hw + 0.03)], [x + 0.05, 2.0, s * (hw + 0.03)], 0.014, 5);
    }
    block(m, "claret", x - 0.04, x, head, eave, -hw, hw);
    plateX(m, "claret", x, archOutline(hw, eave - 0.01, eave, rise), 0.04);
    m.scope("door", () => {
      block(m, "varnish", x - 0.02, x, floor, head, -0.32, 0.32);
      block(m, "glass", x, x + 0.004, 1.38, 2.0, -0.24, 0.24);
      block(m, "lining", x, x + 0.004, 1.05, 1.06, -0.24, 0.24);
      block(m, "brass", x, x + 0.04, 1.3, 1.34, 0.2, 0.26);
    });
  });
  m.scope("platform", () => {
    // the floor stops inside the dash and the saloon's sides
    const ring = ccw([[sal - 0.02, -hw + 0.02], ...C_DASH.map(([x, z]) => [x - 0.02, z * 0.98] as [number, number]), [sal - 0.02, hw - 0.02]]);
    m.prism("timber", ring, 0.82, floor);
    m.cap("timber", ring, 0.82, false);
    block(m, "underframe", C.half - 0.12, C.half - 0.04, 0.68, 0.82, -0.85, 0.85);
    drawHook(m, C.half - 0.04, C.half + 0.14, 0.75);
    // a step each side, on two brackets
    for (const s of [-1, 1]) {
      block(m, "timber", sal + 0.12, C.half - 0.2, 0.48, 0.52, ...side(s, 0.86, 1.1));
      for (const x of [sal + 0.2, C.half - 0.28]) m.rod("iron", [x, 0.5, s * 0.98], [x, 0.82, s * 0.8], 0.016, 4);
    }
  });
  m.scope("dash", () => {
    panels(m, "claret", C_DASH, 0.8, 1.86, 0.035);
    panels(m, "varnish", C_DASH, 1.86, 1.9, 0.06, 0.01);
    const xf = C.half - 0.03;
    // the lined panel and the number disc
    for (const [z0, z1] of [[-0.6, 0.6]] as const) {
      block(m, "lining", xf, xf + 0.004, 1.0, 1.015, z0, z1);
      block(m, "lining", xf, xf + 0.004, 1.72, 1.735, z0, z1);
      block(m, "lining", xf, xf + 0.004, 1.015, 1.72, z0, z0 + 0.015);
      block(m, "lining", xf, xf + 0.004, 1.015, 1.72, z1 - 0.015, z1);
    }
    plateX(m, "cream", xf + 0.008, ngon(12, 0.17, 0, 0, 1.36), 0.008);
    plateX(m, "claret", xf + 0.012, ngon(12, 0.1, 0, 0, 1.36), 0.004);
    // the brass rail along the dash top
    rods(m, "brass", C_DASH.map(([x, z]) => [x - 0.02, 2.0, z * 0.97] as Vec3), 0.016, 5, false);
    for (const [x, z] of C_DASH) m.rod("brass", [x - 0.02, 1.9, z * 0.97], [x - 0.02, 2.0, z * 0.97], 0.013, 4);
    // the corner stanchions carrying the platform's roof
    for (const s of [-1, 1]) m.rod("cream", [C.half - 0.2, floor, s * (hw - 0.04)], [C.half - 0.2, eave, s * (hw - 0.04)], 0.026, 6);
    lamp(m, xf - 0.02, 1.6, -0.75, false);
  });
  brakeStaff(m, C.half - 0.15, 0.45, floor, 1.98);
  m.scope("roof lamp", () => {
    const y = eave + rise;
    block(m, "iron", C.half - 0.2, C.half - 0.02, y, y + 0.2, -0.1, 0.1);
    block(m, "lampHead", C.half - 0.02, C.half - 0.01, y + 0.04, y + 0.16, -0.07, 0.07);
    m.prism("iron", ccw([[C.half - 0.22, -0.12], [C.half, -0.12], [C.half, 0.12], [C.half - 0.22, 0.12]]), y + 0.2, y + 0.23);
  });
}

function closedRoof(m: MeshBuilder): void {
  m.scope("roof", () => {
    archRoof(m, "canvas", -C.half - 0.02, C.half + 0.02, C.hw + 0.05, C.eave, C.rise, 0.035);
    for (const s of [-1, 1]) block(m, "claret", -C.half - 0.02, C.half + 0.02, C.eave - 0.08, C.eave + 0.01, ...side(s, C.hw + 0.02, C.hw + 0.06));
    for (const e of [-1, 1]) plateX(m, "claret", e * (C.half + 0.02) + (e > 0 ? 0 : 0.03), archOutline(C.hw + 0.05, C.eave - 0.08, C.eave, C.rise), 0.03);
    const cw = 0.42;
    const yb = C.eave + C.rise * (1 - (cw / (C.hw + 0.05)) ** 2) + 0.02;
    clerestory(m, { x0: -C.sal + 0.1, x1: C.sal - 0.1, hood: 0.45, cw, yb, h: 0.24, lights: 6, wall: "claret", roof: "canvas" });
  });
}

function closedLod(m: MeshBuilder): void {
  const top = C.eave + C.rise;
  lodBlock(m, -C.half, C.half, 0.8, 1.9, -C.hw, C.hw, { side: "claret", top: "timber" });
  lodBlock(m, -C.sal, C.sal, 1.9, C.eave, -C.hw, C.hw, { side: "cream", top: null });
  lodRoofBox(m, "canvas", -C.half, C.half, C.hw + 0.05, 0.6, C.eave, top);
  lodPolygon(m, "canvas", [[-C.half, C.eave, -C.hw], [C.half, C.eave, -C.hw], [C.half, C.eave, C.hw], [-C.half, C.eave, C.hw]], [0, -1, 0]);
  lodRoofBox(m, "claret", -C.sal + 0.1, C.sal - 0.1, 0.42, 0.42, top - 0.02, top + 0.22);
  lodBlock(m, -1.2, 1.2, 0.0, 0.8, -0.8, 0.8, { side: "bogie", top: null });
}

const CLOSED: AnimalVehicleSpec = {
  id: "veh-animal-tram-closed",
  title: "Closed Horsecar",
  kind: "tram",
  catalog: HORSECAR_CATALOG,
  palette: PALETTE_CLOSED,
  weight: 2.6,
  maxspeed: 15,
  hitch: [C.half + 0.14, 0.72, 0],
  reins: [C.half - 0.1, 2.0, 0],
  body: (m) => {
    closedSaloon(m);
    for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => (e > 0 ? closedEnd(m) : m.turned(0, () => closedEnd(m))));
    closedRoof(m);
    m.scope("running gear", () => truckGear(m, C_GEAR));
  },
  rolling: [{ nodes: ["wheelset-1", "wheelset-2"], diameter: 2 * C_GEAR.r }],
  lod: closedLod,
  references: "animal-tram-closed",
};

export const animalTramClosed = (p?: ParamValues) => buildAnimalVehicle(CLOSED, p);
export const animalTramClosedLod = (p?: ParamValues) => buildAnimalVehicleLod(CLOSED, p);


// ===========================================================================
// veh-animal-tram-toastrack: the open summer car of the Douglas Bay Horse Tramway
// (assets/animal-tram-toastrack; 3 ft gauge, drawn on the standard-gauge treads as every
// tram): eight cross benches with reversible backs between slim white posts, no sides,
// a white canopy with a clerestory and a scalloped valance, running boards along both
// sides, a short platform and a solid red dash at each end, the truck behind a valance.

const PALETTE_TOASTRACK = {
  ...PALETTE,
  red: { color: "#a3202a", roughness: 0.45 },
  white: { color: "#f1efe8", roughness: 0.55 },
  board: { color: "#b9bcbd", roughness: 0.7 },
  seatRed: { color: "#8e2a24", roughness: 0.55 },
};

const T = {
  half: 3.8, // over the dashes
  body: 3.25, // the benches' half length
  hw: 1.0,
  floor: 0.86,
  eave: 2.58,
  rise: 0.1,
  benches: 8,
};
const T_GEAR: Gear = { r: 0.36, ax: 1.0, frame: 1.5, sole: 0.64 };
const T_DASH = chamferDash(T.half - 0.02, T.hw, 0.1);
const T_PITCH = (2 * T.body) / T.benches;

/** A cross bench centred at xc, its seat facing +x, its back flipped over to the rear. */
function crossBench(m: MeshBuilder, xc: number): void {
  const { floor, hw } = T;
  const y = floor + 0.42;
  const zs = hw - 0.08;
  block(m, "seatRed", xc - 0.2, xc + 0.18, y - 0.045, y, -zs, zs);
  block(m, "red", xc + 0.12, xc + 0.16, floor, y - 0.045, -zs, zs);
  // the reversible back, leaning back over the seat's rear edge
  m.slab("seatRed", [[xc - 0.2, y + 0.06, -zs], [xc - 0.2, y + 0.06, zs], [xc - 0.29, y + 0.46, zs], [xc - 0.29, y + 0.46, -zs]], [0.035, 0.008, 0]);
  for (const s of [-1, 1]) {
    // the solid bench end, its arm and the back's swing arm
    block(m, "red", xc - 0.22, xc + 0.2, floor, y + 0.16, ...side(s, zs, zs + 0.03));
    block(m, "varnish", xc - 0.24, xc + 0.22, y + 0.16, y + 0.2, ...side(s, zs - 0.01, zs + 0.04));
    m.rod("iron", [xc - 0.02, y + 0.18, s * (zs - 0.005)], [xc - 0.25, y + 0.3, s * (zs - 0.005)], 0.012, 4);
  }
}

function toastrackBody(m: MeshBuilder): void {
  const { half, body, hw, floor, eave } = T;
  m.scope("floor", () => {
    // the front dash's plan from left to right, then the rear one's from right to left
    // stopping inside the dashes and the valances
    const plan = T_DASH.map(([x, z]) => [x - 0.02, z * 0.98] as [number, number]);
    const ring = ccw([...plan, ...plan.map(([x, z]) => [-x, -z] as [number, number])]);
    m.prism("timber", ring, 0.82, floor);
    m.cap("timber", ring, 0.82, false);
    for (const s of [-1, 1]) block(m, "underframe", -half + 0.1, half - 0.1, T_GEAR.sole, 0.82, ...side(s, 0.6, 0.72));
  });
  m.scope("valance", () => {
    for (const s of [-1, 1]) {
      block(m, "red", -body - 0.4, body + 0.4, 0.58, 0.85, ...side(s, hw - 0.03, hw));
      const z = side(s, hw, hw + 0.004);
      block(m, "lining", -body - 0.3, body + 0.3, 0.62, 0.635, ...z);
      block(m, "lining", -body - 0.3, body + 0.3, 0.8, 0.815, ...z);
      block(m, "white", -body - 0.4, body + 0.4, 0.84, 0.88, ...side(s, hw - 0.02, hw + 0.02));
    }
  });
  m.scope("running boards", () => {
    for (const s of [-1, 1]) {
      block(m, "board", -body + 0.05, body - 0.05, 0.42, 0.46, ...side(s, hw + 0.02, hw + 0.3));
      block(m, "white", -body + 0.05, body - 0.05, 0.4, 0.42, ...side(s, hw + 0.28, hw + 0.3));
      for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) m.rod("iron", [x, 0.42, s * (hw + 0.2)], [x, 0.66, s * (hw - 0.01)], 0.016, 4);
    }
  });
  m.scope("benches", () => {
    for (let i = 0; i < T.benches; i++) crossBench(m, -body + (i + 0.5) * T_PITCH);
  });
  m.scope("posts", () => {
    for (let i = 0; i <= T.benches; i++) {
      const x = -body + i * T_PITCH;
      for (const s of [-1, 1]) {
        const z = s * (hw - 0.02);
        m.rod("white", [x, floor, z], [x, eave - 0.06, z], 0.028, 6);
        // the bracket under the eave
        m.slab("white", [[x - 0.18, eave - 0.06, z], [x + 0.18, eave - 0.06, z], [x, eave - 0.3, z]], [0, 0, -s * 0.02]);
      }
    }
  });
}

/** One end of the toastrack, drawn at +x: the platform's dash, its posts, the brake, the lamp, the hook. */
function toastrackEnd(m: MeshBuilder): void {
  const { half, hw, floor, eave } = T;
  m.scope("dash", () => {
    panels(m, "red", T_DASH, 0.58, 1.78, 0.035);
    panels(m, "varnish", T_DASH, 1.78, 1.82, 0.06, 0.01);
    const xf = half - 0.02;
    // the gold-lined panel with its corner scrolls
    block(m, "lining", xf, xf + 0.004, 0.72, 0.735, -0.62, 0.62);
    block(m, "lining", xf, xf + 0.004, 1.62, 1.635, -0.62, 0.62);
    for (const z of [-0.62, 0.605]) block(m, "lining", xf, xf + 0.004, 0.735, 1.62, z, z + 0.015);
    for (const [z, y] of [[-0.5, 1.5], [0.5, 1.5], [-0.5, 0.85], [0.5, 0.85]] as const) plateX(m, "lining", xf + 0.008, ngon(6, 0.05, 0, z, y), 0.004);
    plateX(m, "brass", xf + 0.008, [[-0.2, 1.06], [0.2, 1.06], [0.2, 1.34], [-0.2, 1.34]], 0.006);
    for (const s of [-1, 1]) m.rod("white", [half - 0.12, floor, s * (hw - 0.04)], [half - 0.12, eave - 0.06, s * (hw - 0.04)], 0.03, 6);
    rods(m, "brass", T_DASH.map(([x, z]) => [x - 0.02, 1.95, z * 0.96] as Vec3), 0.015, 5, false);
    for (const [x, z] of T_DASH) m.rod("brass", [x - 0.02, 1.82, z * 0.96], [x - 0.02, 1.95, z * 0.96], 0.012, 4);
    lamp(m, xf - 0.03, 1.55, -0.78, true);
    lamp(m, xf - 0.03, 1.55, 0.78, false);
  });
  brakeStaff(m, half - 0.12, 0.4, floor, 1.95);
  block(m, "underframe", half - 0.1, half - 0.03, 0.62, 0.82, -0.85, 0.85);
  drawHook(m, half - 0.03, half + 0.14, 0.72);
}

/** The canopy: an arched white sheet with a clerestory, its fascia and the scalloped valance round it. */
function toastrackCanopy(m: MeshBuilder): void {
  const { half, hw, eave, rise } = T;
  const ch = half + 0.06;
  const cw = hw + 0.1;
  m.scope("canopy", () => {
    archRoof(m, "white", -ch, ch, cw, eave, rise, 0.035);
    for (const s of [-1, 1]) block(m, "white", -ch, ch, eave - 0.1, eave + 0.01, ...side(s, cw - 0.03, cw));
    for (const e of [-1, 1]) plateX(m, "white", e * ch + (e > 0 ? 0 : 0.03), archOutline(cw, eave - 0.1, eave, rise), 0.03);
    const yb = eave + rise * (1 - (0.5 / cw) ** 2) + 0.02;
    clerestory(m, { x0: -half + 0.7, x1: half - 0.7, hood: 0.5, cw: 0.5, yb, h: 0.16, lights: 0, wall: "white", roof: "white" });
    m.scope("valance", () => {
      const sc = 0.2;
      const scallop = (a: Vec3, b: Vec3, d: Vec3): void => {
        const mid: Vec3 = [(a[0] + b[0]) / 2, eave - 0.18, (a[2] + b[2]) / 2];
        m.slab("white", [a, b, mid], d);
      };
      const nx = Math.round((2 * ch) / sc);
      for (const s of [-1, 1]) {
        for (let i = 0; i < nx; i++) {
          const x0 = -ch + (2 * ch * i) / nx;
          const x1 = -ch + (2 * ch * (i + 1)) / nx;
          scallop([x0, eave - 0.1, s * cw], [x1, eave - 0.1, s * cw], [0, 0, -s * 0.012]);
        }
      }
      const nz = Math.round((2 * cw) / sc);
      for (const e of [-1, 1]) {
        for (let i = 0; i < nz; i++) {
          const z0 = -cw + (2 * cw * i) / nz;
          const z1 = -cw + (2 * cw * (i + 1)) / nz;
          scallop([e * ch, eave - 0.1, z0], [e * ch, eave - 0.1, z1], [-e * 0.012, 0, 0]);
        }
      }
    });
  });
}

function toastrackLod(m: MeshBuilder): void {
  const { half, body, hw, eave } = T;
  lodBlock(m, -half, half, 0.58, 0.88, -hw, hw, { side: "red", top: "timber" });
  for (const e of [-1, 1]) lodBlock(m, e > 0 ? half - 0.06 : -half, e > 0 ? half : -half + 0.06, 0.88, 1.8, -hw, hw, { side: "red" });
  lodBlock(m, -body, body, 0.88, 1.5, -hw + 0.08, hw - 0.08, { side: "seatRed" });
  lodBlock(m, -half - 0.06, half + 0.06, eave - 0.15, eave + 0.04, -hw - 0.1, hw + 0.1, { side: "white", bottom: "white" });
  lodRoofBox(m, "white", -half - 0.06, half + 0.06, hw + 0.1, 0.55, eave + 0.04, eave + T.rise);
  lodRoofBox(m, "white", -half + 0.7, half - 0.7, 0.5, 0.5, eave + T.rise, eave + T.rise + 0.18);
  lodBlock(m, -body, body, 0.4, 0.46, -hw - 0.3, hw + 0.3, { side: "board" });
  lodBlock(m, -1.3, 1.3, 0.0, 0.6, -0.8, 0.8, { side: "bogie", top: null });
}

const TOASTRACK: AnimalVehicleSpec = {
  id: "veh-animal-tram-toastrack",
  title: "Toastrack Horsecar",
  kind: "tram",
  catalog: HORSECAR_CATALOG,
  palette: PALETTE_TOASTRACK,
  weight: 2.2,
  maxspeed: 15,
  hitch: [T.half + 0.14, 0.69, 0],
  reins: [T.half - 0.15, 1.95, 0],
  body: (m) => {
    toastrackBody(m);
    for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => (e > 0 ? toastrackEnd(m) : m.turned(0, () => toastrackEnd(m))));
    toastrackCanopy(m);
    m.scope("running gear", () => truckGear(m, T_GEAR));
  },
  rolling: [{ nodes: ["wheelset-1", "wheelset-2"], diameter: 2 * T_GEAR.r }],
  lod: toastrackLod,
  references: "animal-tram-toastrack",
};

export const animalTramToastrack = (p?: ParamValues) => buildAnimalVehicle(TOASTRACK, p);
export const animalTramToastrackLod = (p?: ParamValues) => buildAnimalVehicleLod(TOASTRACK, p);


// ===========================================================================
// veh-animal-tram-bobtail: an American one-man "bobtail" horsecar of the 1880s
// (assets/animal-tram-bobtail; John Stephenson and J.G. Brill built them): a short
// body of five windows a side under a clerestory roof whose hoods reach over both
// ends; the front end closed with three windows and the fare box inside, the driver
// standing on a small front platform behind a bowed dash; at the rear a centre door
// onto a narrow platform and its step. Not the same at both ends, so drawn whole.

const PALETTE_BOBTAIL = {
  ...PALETTE,
  yellow: { color: "#d8b13d", roughness: 0.45 },
  vermilion: { color: "#b5452c", roughness: 0.45 },
  canvas: { color: "#c9c5b8", roughness: 0.85 },
  dark: { color: "#3a2a1c", roughness: 0.6 },
};

const B = {
  rear: -1.75, // the body's rear bulkhead
  front: 1.65, // its front bulkhead
  dash: 2.22, // the front dash's middle
  tail: -2.15, // the rear platform's end
  hw: 0.95,
  floor: 0.84,
  waist: 1.38,
  head: 2.0,
  eave: 2.2,
  rise: 0.1,
  windows: 5,
};
const B_GEAR: Gear = { r: 0.36, ax: 0.72, frame: 1.15, x: -0.05, sole: 0.7 };
/** The front dash's bow: its face at z, from x 2.08 at the corners to B.dash at the middle. */
const bDashX = (z: number): number => B.dash - 0.14 * (z / B.hw) ** 2;
const bDashPts = (n: number, inset = 0): Array<[number, number]> =>
  Array.from({ length: n + 1 }, (_, i) => {
    const z = -B.hw + (2 * B.hw * i) / n;
    return [bDashX(z) - inset, z];
  });

function bobtailBody(m: MeshBuilder): void {
  const { rear, front, hw, floor, waist, head, eave } = B;
  const len = front - rear;
  const pitch = len / B.windows;
  m.scope("saloon", () => {
    m.scope("underframe", () => {
      for (const s of [-1, 1]) block(m, "underframe", B.tail + 0.05, B.dash - 0.08, B_GEAR.sole, 0.82, ...side(s, 0.58, 0.7));
      block(m, "timber", rear + 0.04, front - 0.04, 0.8, floor, -hw + 0.02, hw - 0.02);
    });
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right side" : "left side", () => {
        const z = side(s, hw, hw + 0.004);
        // the sill, the panels below the windows, their lining
        block(m, "yellow", rear - 0.005, front + 0.005, 0.74, 0.86, ...side(s, hw - 0.04, hw + 0.01));
        block(m, "vermilion", rear, front, 0.86, waist, ...side(s, hw - 0.04, hw));
        block(m, "yellow", rear - 0.01, front + 0.01, waist - 0.05, waist + 0.01, ...side(s, hw - 0.01, hw + 0.025));
        for (let i = 0; i < B.windows; i++) {
          const a = rear + i * pitch + 0.07;
          const b = a + pitch - 0.14;
          block(m, "yellow", a, b, 0.95, 0.965, ...z);
          block(m, "yellow", a, b, waist - 0.12, waist - 0.105, ...z);
          block(m, "yellow", a, a + 0.015, 0.965, waist - 0.12, ...z);
          block(m, "yellow", b - 0.015, b, 0.965, waist - 0.12, ...z);
        }
        // the windows, each with its top light over the sash rail
        block(m, "glass", rear + 0.05, front - 0.05, waist, head, ...side(s, hw - 0.03, hw - 0.024));
        for (let i = 0; i <= B.windows; i++) {
          const x = rear + i * pitch;
          const [a, b] = i === 0 ? [x, x + 0.08] : i === B.windows ? [x - 0.08, x] : [x - 0.04, x + 0.04];
          block(m, "yellow", a, b, waist, head, ...side(s, hw - 0.04, hw));
        }
        block(m, "yellow", rear + 0.04, front - 0.04, 1.8, 1.84, ...side(s, hw - 0.035, hw - 0.005));
        // the letterboard: yellow, its lettering band dark
        block(m, "yellow", rear, front, head, eave, ...side(s, hw - 0.04, hw));
        block(m, "dark", rear + 0.25, front - 0.25, head + 0.06, eave - 0.06, ...z);
        // the longitudinal bench
        const y = floor + 0.42;
        block(m, "seatWood", rear + 0.06, front - 0.06, y - 0.05, y, ...side(s, 0.52, hw - 0.05));
        block(m, "varnish", rear + 0.06, front - 0.06, floor, y - 0.05, ...side(s, 0.52, 0.56));
        block(m, "seatWood", rear + 0.06, front - 0.06, y, waist + 0.2, ...side(s, hw - 0.09, hw - 0.05));
      });
    }
  });
  m.scope("front end", () => {
    const x = front;
    m.scope("bulkhead", () => {
      block(m, "vermilion", x - 0.04, x, 0.8, waist, -hw, hw);
      for (const s of [-1, 1]) block(m, "yellow", x + 0.001, x + 0.005, 0.95, waist - 0.12, ...side(s, 0.12, 0.8));
      block(m, "glass", x - 0.03, x - 0.024, waist, head, -hw + 0.04, hw - 0.04);
      for (const [a, b] of [[-hw, -0.86], [-0.36, -0.28], [0.28, 0.36], [0.86, hw]] as const) block(m, "yellow", x - 0.045, x + 0.01, waist, head, a, b);
      block(m, "yellow", x - 0.045, x + 0.01, waist - 0.05, waist + 0.01, -hw - 0.02, hw + 0.02);
      block(m, "yellow", x - 0.04, x, head, eave, -hw, hw);
      plateX(m, "yellow", x, archOutline(hw, eave - 0.01, eave, B.rise), 0.04);
    });
    m.scope("fare box", () => {
      // inside, on the bulkhead beside the middle window: a box with a glass front on a bracket
      const zc = 0.55;
      block(m, "dark", x - 0.2, x - 0.04, 1.25, 1.62, zc - 0.13, zc + 0.13);
      block(m, "glass", x - 0.205, x - 0.2, 1.32, 1.56, zc - 0.1, zc + 0.1);
      block(m, "brass", x - 0.21, x - 0.04, 1.62, 1.65, zc - 0.14, zc + 0.14);
      block(m, "brass", x - 0.17, x - 0.06, 1.65, 1.68, zc - 0.03, zc + 0.03);
      block(m, "iron", x - 0.16, x - 0.04, 1.18, 1.25, zc - 0.04, zc + 0.04);
    });
    m.scope("platform", () => {
      const front = bDashPts(8, 0.03).reverse();
      const ring = ccw([[x - 0.02, -hw], [x - 0.02, hw], ...front.slice(1, -1)]);
      m.prism("timber", ring, 0.78, floor);
      m.cap("timber", ring, 0.78, false);
      block(m, "underframe", B.dash - 0.2, B.dash - 0.1, 0.66, 0.78, -0.8, 0.8);
      drawHook(m, B.dash - 0.1, B.dash + 0.12, 0.72);
      for (const s of [-1, 1]) {
        block(m, "timber", x + 0.08, B.dash - 0.25, 0.46, 0.5, ...side(s, 0.82, 1.04));
        for (const xb of [x + 0.14, B.dash - 0.3]) m.rod("iron", [xb, 0.48, s * 0.93], [xb, 0.78, s * 0.75], 0.015, 4);
        m.rod("brass", [x + 0.05, 1.0, s * (hw + 0.03)], [x + 0.05, 1.95, s * (hw + 0.03)], 0.013, 5);
      }
    });
    m.scope("dash", () => {
      const pts = bDashPts(8);
      panels(m, "vermilion", pts, 0.76, 1.72, 0.035);
      panels(m, "yellow", pts, 1.62, 1.635, 0.004, 0.004);
      panels(m, "yellow", pts, 0.86, 0.875, 0.004, 0.004);
      panels(m, "varnish", pts, 1.72, 1.76, 0.06, 0.01);
      plateX(m, "yellow", B.dash + 0.004, ngon(12, 0.15, 0, 0, 1.24), 0.006);
      plateX(m, "vermilion", B.dash + 0.008, ngon(12, 0.1, 0, 0, 1.24), 0.004);
      // the reins rail and its two stanchions
      const rail = bDashPts(6, 0.02).map(([px, z]) => [px, 1.92, z * 0.9] as Vec3);
      rods(m, "brass", rail, 0.014, 5, false);
      for (const k of [1, 5]) m.rod("brass", [rail[k]![0], 1.76, rail[k]![2]], rail[k]!, 0.012, 4);
      lamp(m, bDashX(-0.55) - 0.02, 1.48, -0.55, true);
      // the stanchions carrying the hood
      for (const s of [-1, 1]) m.rod("yellow", [bDashX(s * 0.9) - 0.06, floor, s * 0.9], [bDashX(s * 0.9) - 0.06, eave, s * 0.9], 0.024, 6);
    });
    brakeStaff(m, B.dash - 0.08, 0.45, floor, 1.9);
  });
  m.scope("rear end", () => {
    const x = rear;
    m.scope("bulkhead", () => {
      for (const s of [-1, 1]) {
        block(m, "vermilion", x, x + 0.04, 0.8, waist, ...side(s, 0.34, hw));
        block(m, "yellow", x - 0.005, x - 0.001, 0.95, waist - 0.12, ...side(s, 0.44, 0.86));
        block(m, "glass", x + 0.024, x + 0.03, waist, head, ...side(s, 0.4, 0.88));
        block(m, "yellow", x - 0.01, x + 0.045, waist, head, ...side(s, 0.86, hw));
        block(m, "yellow", x - 0.01, x + 0.045, waist, head, ...side(s, 0.3, 0.4));
        block(m, "yellow", x - 0.01, x + 0.045, waist - 0.05, waist + 0.01, ...side(s, 0.33, hw + 0.02));
        m.rod("brass", [x - 0.05, 0.9, s * 0.42], [x - 0.05, 1.95, s * 0.42], 0.014, 5);
      }
      block(m, "yellow", x, x + 0.04, head, eave, -hw, hw);
      plateX(m, "yellow", x + 0.04, archOutline(hw, eave - 0.01, eave, B.rise), 0.04);
      m.scope("door", () => {
        block(m, "varnish", x, x + 0.02, floor, head, -0.3, 0.3);
        block(m, "glass", x - 0.004, x, 1.36, 1.92, -0.22, 0.22);
        block(m, "brass", x - 0.04, x, 1.3, 1.34, -0.26, -0.2);
      });
      lamp(m, x - 0.11, 1.62, 0.72, false);
    });
    m.scope("platform", () => {
      block(m, "timber", B.tail, x - 0.003, 0.78, floor, -0.62, 0.62);
      block(m, "underframe", B.tail, B.tail + 0.08, 0.66, 0.78, -0.62, 0.62);
      // the step below the platform's end, on two hangers
      block(m, "iron", B.tail - 0.2, B.tail + 0.02, 0.44, 0.47, -0.45, 0.45);
      for (const z of [-0.4, 0.4]) m.rod("iron", [B.tail - 0.1, 0.46, z], [B.tail + 0.02, 0.78, z], 0.016, 4);
      // the guard rails at the platform's sides
      for (const s of [-1, 1]) {
        const zr = s * 0.6;
        m.rod("brass", [B.tail + 0.02, floor, zr], [B.tail + 0.02, 1.85, zr], 0.015, 5);
        m.rod("brass", [B.tail + 0.02, 1.85, zr], [x - 0.02, 1.85, zr], 0.014, 5);
        m.rod("brass", [B.tail + 0.02, 1.3, zr], [x - 0.02, 1.3, zr], 0.012, 4);
      }
    });
  });
}

function bobtailRoof(m: MeshBuilder): void {
  const { hw, eave, rise } = B;
  const [x0, x1] = [B.tail - 0.05, B.dash + 0.03];
  m.scope("roof", () => {
    archRoof(m, "canvas", x0, x1, hw + 0.05, eave, rise, 0.035);
    for (const s of [-1, 1]) block(m, "yellow", x0, x1, eave - 0.07, eave + 0.01, ...side(s, hw + 0.02, hw + 0.06));
    plateX(m, "yellow", x1, archOutline(hw + 0.05, eave - 0.07, eave, rise), 0.03);
    plateX(m, "yellow", x0 + 0.03, archOutline(hw + 0.05, eave - 0.07, eave, rise), 0.03);
    const cw = 0.4;
    const yb = eave + rise * (1 - (cw / (hw + 0.05)) ** 2) + 0.02;
    clerestory(m, { x0: B.rear + 0.15, x1: B.front - 0.1, hood: 0.4, cw, yb, h: 0.2, lights: 5, wall: "yellow", roof: "canvas" });
    // the signal lamp on the front hood
    const y = eave + rise;
    block(m, "iron", x1 - 0.2, x1 - 0.04, y, y + 0.18, -0.09, 0.09);
    block(m, "lampHead", x1 - 0.04, x1 - 0.03, y + 0.04, y + 0.14, -0.06, 0.06);
  });
}

function bobtailLod(m: MeshBuilder): void {
  const top = B.eave + B.rise;
  lodBlock(m, B.rear, B.front, 0.74, B.waist, -B.hw, B.hw, { side: "vermilion", top: null });
  lodBlock(m, B.rear, B.front, B.waist, B.eave, -B.hw, B.hw, { side: "yellow", top: null });
  lodBlock(m, B.front, B.dash, 0.78, 1.75, -B.hw, B.hw, { side: "vermilion", top: "timber" });
  lodBlock(m, B.tail, B.rear, 0.74, 0.84, -0.62, 0.62, { side: "timber" });
  lodRoofBox(m, "canvas", B.tail, B.dash, B.hw + 0.05, 0.6, B.eave, top);
  lodPolygon(m, "canvas", [[B.tail, B.eave, -B.hw], [B.dash, B.eave, -B.hw], [B.dash, B.eave, B.hw], [B.tail, B.eave, B.hw]], [0, -1, 0]);
  lodRoofBox(m, "yellow", B.rear + 0.15, B.front - 0.1, 0.4, 0.4, top - 0.02, top + 0.18);
  lodBlock(m, -1.1, 1.0, 0.0, 0.74, -0.8, 0.8, { side: "bogie", top: null });
}

const BOBTAIL: AnimalVehicleSpec = {
  id: "veh-animal-tram-bobtail",
  title: "Bobtail Horsecar",
  kind: "tram",
  catalog: HORSECAR_CATALOG,
  palette: PALETTE_BOBTAIL,
  weight: 1.6,
  maxspeed: 12,
  hitch: [B.dash + 0.12, 0.69, 0],
  reins: [B.dash - 0.12, 1.92, 0],
  body: (m) => {
    bobtailBody(m);
    bobtailRoof(m);
    m.scope("running gear", () => truckGear(m, B_GEAR));
  },
  rolling: [{ nodes: ["wheelset-1", "wheelset-2"], diameter: 2 * B_GEAR.r }],
  lod: bobtailLod,
  references: "animal-tram-bobtail",
};

export const animalTramBobtail = (p?: ParamValues) => buildAnimalVehicle(BOBTAIL, p);
export const animalTramBobtailLod = (p?: ParamValues) => buildAnimalVehicleLod(BOBTAIL, p);

/** The animal-drawn trams. */
export const ANIMAL_TRAMS: readonly ProceduralDesign[] = [
  animalVehicleDesign(DOUBLE_DECK, { build: animalTramDoubleDeck, buildLod: animalTramDoubleDeckLod }),
  animalVehicleDesign(CLOSED, { build: animalTramClosed, buildLod: animalTramClosedLod }),
  animalVehicleDesign(TOASTRACK, { build: animalTramToastrack, buildLod: animalTramToastrackLod }),
  animalVehicleDesign(BOBTAIL, { build: animalTramBobtail, buildLod: animalTramBobtailLod }),
];
