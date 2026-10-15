// The procedural European trucks: a MAN cistern semi-truck in copper with a
// polished steel tank trailer, an eight-wheel MAN concrete mixer and a white
// cab-over tractor with a reefer box semi-trailer. See docs/models/trucks.md.
//
// Each design reproduces the hand-authored GLB of the same name in the webapp's
// model database (rail-island-webapp db/trucks/glb/), procedurally: the same
// axes, about the same bounding box (test/referenceModels.test.ts), the same
// look, refined from the photos in assets/<name>/. Modelled in metres: +X
// forward (the nose), +Y up, +Z to the vehicle's left, the wheels standing on
// y = 0, centred on z = 0.
//
// The two semi-trucks are articulated: a "truck" part and a "trailer" part,
// divided at the king pin on the fifth wheel's top, which the trailer's node
// turns about (MeshBuilder.part). The mixer is rigid, one "body" part. Every
// steered wheel is a part of its own inside the tractor's or the body's node,
// named in the rig the game turns them by (rig.ts, docs/models/vehicle-rig.md).
//
// The cabs are cab-overs drawn as a stack of lofts over a rounded plan ring
// (`cabShell`): the front rakes back level by level and the roof edge rounds
// in, and the glass and the grille are slabs laid a centimetre proud of the
// shell's flat front and sides. The ids are stored in the game's saved maps,
// so a design is never renamed once shipped.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { CatalogFields, ProceduralDesign } from "./design.ts";
import { arc, block, plate, side, steeredWheels } from "./vehicleParts.ts";

// Metals are only mildly metallic: the game and the site light models without
// an environment map, so a fully metallic surface would render nearly black.
const PALETTE: Record<string, MaterialSpec> = {
  copper: { color: "#b6774f", metallic: 0.25, roughness: 0.4 },
  white: { color: "#f0efea", roughness: 0.45 },
  steel: { color: "#d2d6dc", metallic: 0.45, roughness: 0.22 },
  steelBand: { color: "#a9b0b8", metallic: 0.45, roughness: 0.3 },
  alloy: { color: "#cfd2d7", metallic: 0.35, roughness: 0.35 },
  chassis: { color: "#2e2f32" },
  trim: { color: "#27282b", roughness: 0.7 },
  greyPlastic: { color: "#3f4246", roughness: 0.75 },
  rubber: { color: "#1e1e1f", roughness: 0.95 },
  glass: { color: "#1f262f", metallic: 0.2, roughness: 0.15 },
  visorTint: { color: "#4b4e71", metallic: 0.2, roughness: 0.2 },
  lampClear: { color: "#f2f0e9", roughness: 0.2 },
  lampAmber: { color: "#ffa01f", roughness: 0.3 },
  lampRed: { color: "#b22521", roughness: 0.3 },
  plateOrange: { color: "#df791f", roughness: 0.5 },
  plateWhite: { color: "#e9ebee", roughness: 0.4 },
  stripeYellow: { color: "#f1c020", roughness: 0.4 },
  stripeGreen: { color: "#24984b", roughness: 0.4 },
  blue: { color: "#3269a6", roughness: 0.45 },
  orange: { color: "#df6424", roughness: 0.5 },
};

// --- shared helpers ------------------------------------------------------------------

/** One level of a cab shell: at height y the front is at xf, the half-width hw, the front corners rounded by rf. */
interface Level {
  y: number;
  xf: number;
  hw: number;
  rf: number;
}

const CORNER_SEGMENTS = 3;
const REAR_RADIUS = 0.06;

/**
 * The cab's plan at one level: a rectangle from the rear wall x0 to the front,
 * front corners rounded (CORNER_SEGMENTS) and rear corners just eased, wound
 * like ngon() so every level has the same number of points.
 */
function planRing(x0: number, l: Level): Ring {
  const pts: Ring = [];
  const corner = (cx: number, cz: number, r: number, a0: number, n: number): void => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cz - r * Math.sin(a)]);
    }
  };
  corner(l.xf - l.rf, -(l.hw - l.rf), l.rf, 0, CORNER_SEGMENTS);
  corner(x0 + REAR_RADIUS, -(l.hw - REAR_RADIUS), REAR_RADIUS, Math.PI / 2, 1);
  corner(x0 + REAR_RADIUS, l.hw - REAR_RADIUS, REAR_RADIUS, Math.PI, 1);
  corner(l.xf - l.rf, l.hw - l.rf, l.rf, 1.5 * Math.PI, CORNER_SEGMENTS);
  return pts;
}

/** A cab shell: lofts between the levels (bottom to top), each band in its own material, closed top and bottom. */
function cabShell(m: MeshBuilder, x0: number, levels: Level[], mats: string[]): void {
  m.cap(mats[0]!, planRing(x0, levels[0]!), levels[0]!.y, false);
  for (let i = 0; i + 1 < levels.length; i++) {
    const a = levels[i]!;
    const b = levels[i + 1]!;
    m.loft(mats[Math.min(i, mats.length - 1)]!, planRing(x0, a), a.y, planRing(x0, b), b.y, i + 2 === levels.length);
  }
}

/** The x of the shell's flat front at height y (linear between the levels). */
function frontAt(levels: Level[], y: number): number {
  for (let i = 0; i + 1 < levels.length; i++) {
    const a = levels[i]!;
    const b = levels[i + 1]!;
    if (y <= b.y || i + 2 === levels.length) return a.xf + ((b.xf - a.xf) * (y - a.y)) / (b.y - a.y);
  }
  return levels[0]!.xf;
}

/**
 * A panel on the shell's flat front: the outline (z, y) laid `proud` ahead of
 * the front face, `depth` thick into it. Keep it inside one level band, where
 * the front is a plane.
 */
function frontSlab(m: MeshBuilder, mat: string, levels: Level[], outline: Array<[number, number]>, proud: number, depth = 0.03): void {
  m.slab(mat, outline.map(([z, y]): Vec3 => [frontAt(levels, y) + proud, y, z]), [-depth, 0, 0]);
}

/** A panel on a flat side (s = +1 left, -1 right) of half-width hw: the outline (x, y), `proud` outside it. */
function sideSlab(m: MeshBuilder, mat: string, s: number, hw: number, outline: Array<[number, number]>, proud = 0.006, depth = 0.03): void {
  m.slab(mat, outline.map(([x, y]): Vec3 => [x, y, s * (hw + proud)]), [0, 0, -s * depth]);
}

/**
 * A skin over the shell's front corners between two levels of one band: the
 * rounded corner `lift` outside the shell, carried round onto the flat front
 * to |z| = zIn and back along the flat side to x = xBack. One-sided panels
 * facing out -- the mixer's grey corner covers.
 */
function cornerSkin(m: MeshBuilder, mat: string, x0: number, lo: Level, hi: Level, zIn: number, xBack: number, lift = 0.008): void {
  const n = CORNER_SEGMENTS + 1;
  const a = planRing(x0, lo);
  const b = planRing(x0, hi);
  for (const s of [-1, 1]) {
    // the corner's points from the flat front to the flat side, and its centre
    const idx = s < 0 ? [...Array(n).keys()] : [...Array(n).keys()].map((i) => a.length - 1 - i);
    const out = (l: Level, p: [number, number]): [number, number] => {
      const cx = l.xf - l.rf;
      const cz = s * (l.hw - l.rf);
      const d = Math.hypot(p[0] - cx, p[1] - cz) || 1;
      return [p[0] + ((p[0] - cx) / d) * lift, p[1] + ((p[1] - cz) / d) * lift];
    };
    const ptsLo = idx.map((i) => out(lo, a[i]!));
    const ptsHi = idx.map((i) => out(hi, b[i]!));
    // carried onto the front and the side
    ptsLo.unshift([lo.xf + lift, s * zIn]);
    ptsHi.unshift([hi.xf + lift, s * zIn]);
    ptsLo.push([xBack, s * (lo.hw + lift)]);
    ptsHi.push([xBack, s * (hi.hw + lift)]);
    for (let i = 0; i + 1 < ptsLo.length; i++) {
      const p0: Vec3 = [ptsLo[i]![0], lo.y, ptsLo[i]![1]];
      const p1: Vec3 = [ptsLo[i + 1]![0], lo.y, ptsLo[i + 1]![1]];
      const p2: Vec3 = [ptsHi[i + 1]![0], hi.y, ptsHi[i + 1]![1]];
      const p3: Vec3 = [ptsHi[i]![0], hi.y, ptsHi[i]![1]];
      // outward: away from the cab's centre line, in plan
      const mx = (p0[0] + p1[0]) / 2 - (x0 + lo.xf) / 2;
      const mz = (p0[2] + p1[2]) / 2;
      const ex = p1[0] - p0[0];
      const ez = p1[2] - p0[2];
      let nx = ez;
      let nz = -ex;
      if (nx * mx + nz * mz < 0) [nx, nz] = [-nx, -nz];
      m.facets(mat, [p0, p1, p2, p0, p2, p3], [nx, 0, nz]);
    }
  }
}

/** A rectangle (z, y) centred on z = 0, for frontSlab. */
function span(half: number, y0: number, y1: number): Array<[number, number]> {
  return [[-half, y0], [half, y0], [half, y1], [-half, y1]];
}

const TYRE_SIDES = 20;

/** The axle height of a tyre of radius r: a 20-gon with a flat side, not a vertex, on the road. */
function axleY(r: number): number {
  return r * Math.cos(Math.PI / TYRE_SIDES);
}

/**
 * One wheel at axle x, radius r, its tyre spanning z0..z1: a tread and a
 * slightly smaller sidewall core, so the tyre's shoulders read round. A wheel
 * seen from outside (`face` = the outer side, +1 or -1) gets a disc and hub on
 * that face; the inner wheel of a dual pair shows none.
 */
function wheel(m: MeshBuilder, x: number, r: number, z0: number, z1: number, face: number | null): void {
  const ay = axleY(r);
  const tread = ngon(TYRE_SIDES, r, Math.PI / TYRE_SIDES, x, ay);
  const wall = ngon(TYRE_SIDES, r * 0.92, Math.PI / TYRE_SIDES, x, ay);
  m.sweep("rubber", "z", tread, z0 + 0.04, tread, z1 - 0.04);
  m.sweep("rubber", "z", wall, z0, wall, z1);
  if (face === null) return;
  const f = face > 0 ? z1 : z0;
  const disc = ngon(16, r * 0.62, 0, x, ay);
  m.sweep("alloy", "z", disc, f - face * 0.03, disc, f + face * 0.006);
  const ring = ngon(16, r * 0.4, 0, x, ay);
  m.sweep("chassis", "z", ring, f - face * 0.01, ring, f + face * 0.012);
  const hub = ngon(8, r * 0.22, Math.PI / 8, x, ay);
  m.sweep("alloy", "z", hub, f, hub, f + face * 0.055);
}

/** An axle beam across the track at x, with a differential housing on a drive axle. */
function axle(m: MeshBuilder, x: number, r: number, half: number, drive: boolean): void {
  const beam = ngon(8, 0.07, Math.PI / 8, x, axleY(r));
  m.sweep("chassis", "z", beam, -half, beam, half);
  if (drive) {
    const diff = ngon(12, 0.2, 0, x, axleY(r));
    m.sweep("chassis", "z", diff, -0.2, diff, 0.2);
  }
}

/**
 * The steered wheels of axle x inside `parent`'s node (vehicle-rig.md). This
 * family's frame has +Z to the vehicle's left, so the -Z wheel the rig lists
 * first is the right one.
 */
function steered(m: MeshBuilder, parent: string, x: number, r: number, tyre: [number, number], suffix = ""): [string, string] {
  return steeredWheels(m, parent, x, axleY(r), (s, z0, z1) => wheel(m, x, r, z0, z1, s), tyre, [`wheel-front${suffix}-right`, `wheel-front${suffix}-left`]);
}

/** A fender arched over the wheel at axle x: a bent plate from angle a0 to a1 (degrees, 0 = forward). */
function archFender(m: MeshBuilder, mat: string, x: number, r: number, rIn: number, rOut: number, a0: number, a1: number, z0: number, z1: number): void {
  const d = Math.PI / 180;
  plate(m, mat, arc(x, axleY(r), rOut, a0 * d, a1 * d, 8), arc(x, axleY(r), rIn, a0 * d, a1 * d, 8), z0, z1);
}

/** A mirror on an arm: the arm from the cab side out to the head, the head, its glass facing back. */
function mirror(m: MeshBuilder, s: number, x: number, armY: number, z0: number, head: { y0: number; y1: number; z0: number; z1: number }): void {
  block(m, "trim", x - 0.02, x + 0.02, armY - 0.02, armY + 0.02, ...side(s, z0, head.z0 + 0.02));
  block(m, "trim", x - 0.06, x + 0.06, head.y0, head.y1, ...side(s, head.z0, head.z1));
  block(m, "glass", x - 0.075, x - 0.055, head.y0 + 0.04, head.y1 - 0.04, ...side(s, head.z0 + 0.02, head.z1 - 0.02));
}

// --- the cistern semi-truck -------------------------------------------------------
//
// A MAN TGX day-cab tractor in copper (the photo's colour), its black
// trapezoid grille under a chrome bar, LED headlights in the bumper corners,
// a copper side skirt between the axles -- pulling a polished stainless tank
// semi-trailer on three axles: a cylinder with dished heads, six stiffening
// bands, four manholes under a railed walkway, a bottom discharge manifold and
// side guards. 15.7 m over all.

const C_FRONT_AXLE = 6.2;
const C_DRIVE_AXLE = 2.6;
const C_WHEEL_R = 0.5;
const C_CAB_X0 = 5.25;
const C_CAB: Level[] = [
  { y: 1.15, xf: 7.7, hw: 1.2, rf: 0.24 },
  { y: 2.36, xf: 7.79, hw: 1.22, rf: 0.24 },
  { y: 2.44, xf: 7.78, hw: 1.22, rf: 0.16 },
  { y: 3.4, xf: 7.62, hw: 1.22, rf: 0.16 },
  { y: 3.57, xf: 7.52, hw: 1.19, rf: 0.18 },
  { y: 3.67, xf: 7.36, hw: 1.1, rf: 0.16 },
];
/** The rotation point: the king pin, on the fifth wheel's top, on the centre line. */
const C_PIVOT: Vec3 = [3.1, 1.15, 0];

function cisternTractor(m: MeshBuilder): void {
  m.scope("chassis", () => {
    m.scope("frame rails", () => {
      for (const s of [-1, 1]) block(m, "chassis", 1.65, 7.4, 0.72, 1.02, ...side(s, 0.38, 0.46));
    });
    m.scope("crossmembers", () => {
      for (const x of [1.8, 3.7, 5.1]) block(m, "chassis", x - 0.05, x + 0.05, 0.78, 0.98, -0.38, 0.38);
    });
    m.scope("engine", () => block(m, "chassis", 5.4, 7.45, 0.62, 1.14, -1.0, 1.0));
    m.scope("fifth wheel", () => {
      const [x, y] = C_PIVOT;
      block(m, "chassis", x - 0.5, x + 0.5, 1.02, 1.07, -0.42, 0.42);
      m.prism("trim", ngon(14, 0.48, 0, x, 0), 1.07, y);
      block(m, "rubber", x - 0.48, x, y - 0.01, y + 0.004, -0.06, 0.06); // the slot the king pin rides in
    });
    m.scope("rear light bar", () => {
      block(m, "chassis", 1.58, 1.66, 0.74, 0.92, -1.05, 1.05);
      for (const s of [-1, 1]) block(m, "lampRed", 1.555, 1.585, 0.78, 0.9, ...side(s, 0.75, 1.0));
    });
    m.scope("air tanks", () => {
      for (const s of [-1, 1]) {
        const t = ngon(10, 0.14, 0, s * 0.7, 0.8);
        m.sweep("chassis", "x", t, 3.75, t, 4.9);
      }
    });
  });

  // the front wheels steer: parts of their own (cisternSemiTruck), only the beam is here
  m.scope("front axle", () => axle(m, C_FRONT_AXLE, C_WHEEL_R, 0.95, false));
  m.scope("drive axle", () => {
    axle(m, C_DRIVE_AXLE, C_WHEEL_R, 0.95, true);
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "left duals" : "right duals", () => {
        wheel(m, C_DRIVE_AXLE, C_WHEEL_R, ...side(s, 0.61, 0.92), null);
        wheel(m, C_DRIVE_AXLE, C_WHEEL_R, ...side(s, 0.94, 1.25), s);
      });
    }
  });

  m.scope("cab", () => {
    cabShell(m, C_CAB_X0, C_CAB, ["copper"]);
    m.scope("windscreen", () => frontSlab(m, "glass", C_CAB, span(1.03, 2.52, 3.33), 0.01));
    m.scope("sun visor", () => {
      const v: Ring = [[7.34, 3.5], [7.66, 3.47], [7.66, 3.52], [7.34, 3.56]];
      m.sweep("trim", "z", v, -1.12, v, 1.12);
    });
    m.scope("side windows", () => {
      for (const s of [-1, 1]) {
        const xb = frontAt(C_CAB, 2.52) - 0.24;
        const xt = frontAt(C_CAB, 3.26) - 0.24;
        sideSlab(m, "glass", s, 1.22, [[6.66, 2.52], [xb, 2.52], [xt, 3.26], [6.66, 3.26]]);
        sideSlab(m, "glass", s, 1.22, [[5.86, 2.66], [6.5, 2.66], [6.5, 3.2], [5.86, 3.2]]);
        sideSlab(m, "trim", s, 1.22, [[6.56, 1.95], [6.7, 1.95], [6.7, 2.0], [6.56, 2.0]], 0.012); // door handle
      }
    });
    m.scope("roof markers", () => {
      for (const z of [-0.9, -0.3, 0.3, 0.9]) block(m, "plateOrange", 7.36, 7.44, 3.62, 3.7, z - 0.05, z + 0.05);
    });
    m.scope("mirrors", () => {
      for (const s of [-1, 1]) mirror(m, s, 7.46, 3.2, 1.2, { y0: 2.55, y1: 3.28, z0: 1.43, z1: 1.55 });
    });
  });

  m.scope("front", () => {
    m.scope("grille", () => {
      frontSlab(m, "trim", C_CAB, [[-0.56, 1.36], [0.56, 1.36], [0.72, 2.2], [-0.72, 2.2]], 0.01, 0.04);
      frontSlab(m, "steel", C_CAB, span(0.74, 2.2, 2.29), 0.03, 0.06); // the chrome bar
      frontSlab(m, "steel", C_CAB, [[-0.09, 1.93], [0.09, 1.93], [0.06, 2.12], [-0.06, 2.12]], 0.022); // the lion
      for (const y of [1.55, 1.75, 1.95]) frontSlab(m, "greyPlastic", C_CAB, span(0.55 + (y - 1.36) * 0.2, y, y + 0.03), 0.016);
    });
    m.scope("bumper", () => {
      const lvl = (y: number): Level => ({ y, xf: 7.79, hw: 1.22, rf: 0.28 });
      m.loft("copper", planRing(7.42, lvl(0.44)), 0.44, planRing(7.42, lvl(1.17)), 1.17);
      m.cap("copper", planRing(7.42, lvl(0.44)), 0.44, false);
      block(m, "trim", 7.6, 7.81, 0.36, 0.5, -1.16, 1.16); // the lip
      block(m, "trim", 7.78, 7.805, 0.62, 0.86, -0.62, 0.62); // the lower intake
      block(m, "plateWhite", 7.79, 7.815, 0.66, 0.78, -0.26, 0.26); // number plate
      for (const s of [-1, 1]) {
        block(m, "trim", 7.77, 7.8, 0.9, 1.12, ...side(s, 0.62, 0.94));
        block(m, "lampClear", 7.785, 7.81, 0.93, 1.09, ...side(s, 0.65, 0.92));
        block(m, "lampClear", 7.785, 7.81, 0.56, 0.64, ...side(s, 0.72, 0.9));
      }
    });
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "left fender" : "right fender", () => {
        archFender(m, "copper", C_FRONT_AXLE, C_WHEEL_R, 0.6, 0.66, 12, 168, ...side(s, 0.98, 1.215));
        block(m, "copper", 6.82, 7.5, 0.58, 1.16, ...side(s, 0.98, 1.215)); // the front corner below the cab
        block(m, "trim", 5.3, 5.6, 0.45, 1.13, ...side(s, 0.95, 1.2)); // the step well
        for (const y of [0.55, 0.86]) block(m, "alloy", 5.32, 5.58, y, y + 0.04, ...side(s, 0.98, 1.22));
      });
    }
  });

  m.scope("side skirts", () => {
    for (const s of [-1, 1]) block(m, "copper", 3.65, 5.3, 0.5, 1.12, ...side(s, 1.12, 1.2));
  });
  m.scope("mudguards", () => {
    for (const s of [-1, 1]) archFender(m, "trim", C_DRIVE_AXLE, C_WHEEL_R, 0.58, 0.62, 0, 180, ...side(s, 0.55, 1.29));
  });
}

const TANK_R = 1.15;
const TANK_Y = 2.5;
const TANK_X0 = -7.45;
const TANK_X1 = 4.6;
const C_TRAILER_AXLES = [-4.35, -5.65, -6.95];

function cisternTrailer(m: MeshBuilder): void {
  const ring = (r: number): Ring => ngon(32, r, 0, 0, TANK_Y);
  m.scope("tank", () => {
    m.sweep("steel", "x", ring(TANK_R), TANK_X0, ring(TANK_R), TANK_X1, false);
    m.scope("front head", () => {
      m.sweep("steel", "x", ring(TANK_R), TANK_X1, ring(TANK_R * 0.86), TANK_X1 + 0.22, false);
      m.sweep("steel", "x", ring(TANK_R * 0.86), TANK_X1 + 0.22, ring(TANK_R * 0.35), TANK_X1 + 0.37);
    });
    m.scope("rear head", () => {
      m.sweep("steel", "x", ring(TANK_R), TANK_X0, ring(TANK_R * 0.86), TANK_X0 - 0.22, false);
      m.sweep("steel", "x", ring(TANK_R * 0.86), TANK_X0 - 0.22, ring(TANK_R * 0.35), TANK_X0 - 0.37);
    });
    m.scope("bands", () => {
      for (const x of [4.3, 2.0, -0.3, -2.6, -4.9, -7.2]) m.sweep("steelBand", "x", ring(TANK_R + 0.04), x - 0.045, ring(TANK_R + 0.04), x + 0.045);
    });
  });
  m.scope("top", () => {
    m.scope("walkway", () => block(m, "chassis", -6.7, 4.0, 3.6, 3.68, -0.45, 0.45));
    m.scope("manholes", () => {
      for (const x of [2.9, 0.05, -2.85, -5.75]) {
        m.prism("steel", ngon(12, 0.27, 0, x, 0), 3.55, 3.82);
        m.prism("steelBand", ngon(12, 0.3, 0, x, 0), 3.82, 3.86);
      }
    });
    m.scope("handrails", () => {
      for (const s of [-1, 1]) {
        for (let i = 0; i < 8; i++) {
          const x = -6.6 + i * 1.5;
          block(m, "steel", x - 0.02, x + 0.02, 3.66, 4.0, ...side(s, 0.48, 0.52));
        }
        block(m, "steel", -6.62, 3.92, 4.0, 4.04, ...side(s, 0.475, 0.525));
      }
    });
  });
  m.scope("underframe", () => {
    m.scope("saddle", () => block(m, "chassis", 1.9, 4.3, 1.16, 1.52, -0.55, 0.55));
    m.scope("king pin", () => m.prism("chassis", ngon(8, 0.05, 0, C_PIVOT[0], 0), 1.08, 1.16));
    m.scope("subframe", () => {
      for (const s of [-1, 1]) block(m, "chassis", -7.8, -3.1, 1.05, 1.5, ...side(s, 0.45, 0.56));
    });
    m.scope("discharge manifold", () => {
      const pipe = ngon(8, 0.06, Math.PI / 8, 0, 1.13);
      m.sweep("steel", "x", pipe, -5.9, pipe, 1.7);
      for (const x of [2.9, 0.05, -2.85, -5.75]) m.prism("steel", ngon(8, 0.06, 0, x, 0), 1.13, 1.45);
    });
    m.scope("landing gear", () => {
      for (const s of [-1, 1]) {
        block(m, "chassis", 1.32, 1.48, 0.2, 1.56, ...side(s, 0.5, 0.62));
        block(m, "chassis", 1.25, 1.55, 0.06, 0.2, ...side(s, 0.46, 0.66));
      }
      block(m, "chassis", 1.37, 1.43, 0.77, 0.83, -0.5, 0.5);
    });
  });
  C_TRAILER_AXLES.forEach((x, i) => m.scope(`axle ${i + 1}`, () => {
    axle(m, x, C_WHEEL_R, 0.85, false);
    for (const s of [-1, 1]) {
      block(m, "chassis", x - 0.12, x + 0.12, 0.55, 1.05, ...side(s, 0.45, 0.6)); // the hanger
      m.scope(s > 0 ? "left wheel" : "right wheel", () => wheel(m, x, C_WHEEL_R, ...side(s, 0.83, 1.22), s));
    }
  }));
  m.scope("fenders", () => {
    for (const s of [-1, 1]) {
      block(m, "trim", -7.52, -3.78, 1.07, 1.11, ...side(s, 0.6, 1.28));
      block(m, "trim", -7.52, -3.78, 0.96, 1.07, ...side(s, 1.25, 1.28));
    }
  });
  m.scope("side guards", () => {
    for (const s of [-1, 1]) {
      for (const y of [0.6, 0.9]) block(m, "steel", -3.65, 1.1, y - 0.03, y + 0.03, ...side(s, 1.14, 1.22));
      for (const x of [-3.5, -1.3, 0.95]) {
        block(m, "steel", x - 0.03, x + 0.03, 0.55, 1.24, ...side(s, 1.1, 1.18));
        block(m, "steel", x - 0.03, x + 0.03, 1.24, 1.3, ...side(s, 0.5, 1.18));
      }
      block(m, "steelBand", -2.2, -0.5, 0.85, 1.36, ...side(s, 0.55, 1.08)); // the equipment cabinet
    }
  });
  m.scope("rear", () => {
    block(m, "chassis", -7.88, -7.76, 0.5, 0.7, -1.1, 1.1);
    for (const s of [-1, 1]) {
      block(m, "chassis", -7.85, -7.78, 0.7, 1.1, ...side(s, 0.45, 0.55));
      block(m, "lampRed", -7.9, -7.86, 0.72, 0.86, ...side(s, 0.75, 1.1));
    }
    block(m, "plateOrange", -7.9, -7.865, 0.72, 0.88, -0.22, 0.22);
  });
}

const C_FRONT_TYRE: [number, number] = [0.89, 1.21];

export function cisternSemiTruck(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.part("truck", [0, 0, 0], () => cisternTractor(m));
  const nodes = steered(m, "truck", C_FRONT_AXLE, C_WHEEL_R, C_FRONT_TYRE);
  m.part("trailer", C_PIVOT, () => cisternTrailer(m));
  m.rig = {
    steer: { axles: [{ nodes, wheelbase: C_FRONT_AXLE - C_DRIVE_AXLE }], maxAngleDeg: 40, track: C_FRONT_TYRE[0] + C_FRONT_TYRE[1] },
    sections: [{ node: "truck", pivot: [0, 0, 0] }, { node: "trailer", pivot: C_PIVOT }],
    maxBendDeg: 75,
  };
  return m;
}

// --- the concrete mixer -------------------------------------------------------------
//
// An 8x4 MAN TGS mixer: a white cab-over cab with a grey lower band, grey
// bumper and step wells, two steered front axles under grey arches and a
// tandem drive at the rear; on a white subframe the mixer drum -- a double
// cone tilted up toward the rear, a yellow and green stripe round its belly,
// a roller track -- between the front pedestal with the water tank and the
// rear pedestal carrying the hopper, the chute, the orange-banded chute
// extensions and the ladder. 10.2 m long, rigid.

const MX_WHEEL_R = 0.535;
const MX_FRONT_AXLES = [3.87, 2.02];
const MX_REAR_AXLES = [-1.53, -2.93];
const MX_CAB_X0 = 2.56;
const MX_CAB: Level[] = [
  { y: 1.24, xf: 4.93, hw: 1.19, rf: 0.2 },
  { y: 1.5, xf: 4.95, hw: 1.2, rf: 0.2 },
  { y: 2.4, xf: 4.99, hw: 1.21, rf: 0.2 },
  { y: 2.46, xf: 4.99, hw: 1.21, rf: 0.14 },
  { y: 3.44, xf: 4.86, hw: 1.21, rf: 0.14 },
  { y: 3.62, xf: 4.74, hw: 1.17, rf: 0.16 },
  { y: 3.71, xf: 4.58, hw: 1.08, rf: 0.14 },
];
/** The drum's axis, rising toward the rear: its centre height at x. */
function drumY(x: number): number {
  return 2.55 + (1.66 - x) * 0.119;
}
/** The drum's profile: (x, radius) from the front bearing to the rear opening. */
const DRUM: Array<[number, number]> = [
  [1.7, 0.08], [1.64, 0.24], [1.55, 0.3], [1.45, 0.55], [0.9, 0.96], [0.2, 1.18], [-0.5, 1.24],
  [-1.4, 1.18], [-2.3, 1.0], [-3.0, 0.78], [-3.45, 0.58], [-3.6, 0.52],
];

function drumRadius(x: number): number {
  for (let i = 0; i + 1 < DRUM.length; i++) {
    const [xa, ra] = DRUM[i]!;
    const [xb, rb] = DRUM[i + 1]!;
    if (x <= xa && x >= xb) return ra + ((rb - ra) * (xa - x)) / (xa - xb);
  }
  return 0;
}

/** A band round the drum from x0 to x1 (x0 > x1), `lift` off its surface. */
function drumBand(m: MeshBuilder, mat: string, x0: number, x1: number, lift: number): void {
  const sec = (x: number): Ring => ngon(32, drumRadius(x) + lift, 0, 0, drumY(x));
  m.sweep(mat, "x", sec(x0), x0, sec(x1), x1);
}

function mixerChassis(m: MeshBuilder): void {
  m.scope("frame", () => {
    for (const s of [-1, 1]) block(m, "chassis", -4.33, 4.67, 0.85, 1.15, ...side(s, 0.4, 0.5));
    for (const x of [-3.88, -2.18, 0.02, 1.22, 3.02]) block(m, "chassis", x - 0.06, x + 0.06, 0.9, 1.1, -0.4, 0.4);
    block(m, "white", -4.33, 1.87, 1.16, 1.29, -0.55, 0.55); // the subframe
  });
  m.scope("running gear", () => {
    // both front axles steer: their wheels are parts of their own (mixerTruck)
    MX_FRONT_AXLES.forEach((x, i) => m.scope(`front axle ${i + 1}`, () => axle(m, x, MX_WHEEL_R, 0.95, false)));
    MX_REAR_AXLES.forEach((x, i) => m.scope(`drive axle ${i + 1}`, () => {
      axle(m, x, MX_WHEEL_R, 0.95, true);
      for (const s of [-1, 1]) {
        m.scope(s > 0 ? "left duals" : "right duals", () => {
          wheel(m, x, MX_WHEEL_R, ...side(s, 0.71, 1.0), null);
          wheel(m, x, MX_WHEEL_R, ...side(s, 1.02, 1.31), s);
        });
      }
    }));
  });
  m.scope("fenders", () => {
    for (const s of [-1, 1]) {
      for (const x of MX_FRONT_AXLES) archFender(m, "greyPlastic", x, MX_WHEEL_R, 0.6, 0.66, 0, 180, ...side(s, 0.85, 1.27));
      block(m, "greyPlastic", 2.7, 3.19, 0.67, 1.17, ...side(s, 1.2, 1.26)); // the skirt between the front arches
      for (const x of MX_REAR_AXLES) archFender(m, "greyPlastic", x, MX_WHEEL_R, 0.6, 0.64, 20, 160, ...side(s, 0.67, 1.34));
      block(m, "greyPlastic", -2.62, -1.84, 1.12, 1.15, ...side(s, 0.67, 1.34)); // the bridge between the rear arches
    }
  });
  m.scope("side equipment", () => {
    for (const s of [-1, 1]) {
      const tank = ngon(12, 0.3, Math.PI / 12, s * 0.88, 0.95);
      m.sweep("chassis", "x", tank, -0.86, tank, 0.19);
      const strap = ngon(12, 0.315, Math.PI / 12, s * 0.88, 0.95);
      for (const x of [-0.6, -0.08]) m.sweep("alloy", "x", strap, x - 0.025, strap, x + 0.025);
      block(m, "alloy", 0.49, 1.04, 0.64, 1.26, ...side(s, 0.67, 1.23)); // the toolbox
      block(m, "alloy", -1.28, 0.72, 0.58, 0.66, ...side(s, 1.18, 1.22)); // the side guard
      block(m, "chassis", 1.33, 1.36, 0.25, 0.75, ...side(s, 0.8, 1.24)); // mudflaps
      block(m, "chassis", -3.63, -3.6, 0.25, 0.75, ...side(s, 0.8, 1.3));
    }
  });
  m.scope("rear", () => {
    block(m, "chassis", -4.34, -4.22, 0.64, 0.8, -1.15, 1.15);
    for (const s of [-1, 1]) block(m, "lampRed", -4.38, -4.33, 0.66, 0.78, ...side(s, 0.8, 1.1));
  });
}

function mixerCab(m: MeshBuilder): void {
  m.scope("cab", () => {
    cabShell(m, MX_CAB_X0, MX_CAB, ["greyPlastic", "white"]);
    m.scope("corner covers", () => {
      const [lo, up] = [MX_CAB[1]!, MX_CAB[2]!];
      const t = (2.2 - lo.y) / (up.y - lo.y);
      const hi: Level = { y: 2.2, xf: lo.xf + (up.xf - lo.xf) * t, hw: lo.hw + (up.hw - lo.hw) * t, rf: lo.rf + (up.rf - lo.rf) * t };
      cornerSkin(m, "greyPlastic", MX_CAB_X0, lo, hi, 0.84, 4.45);
    });
    m.scope("windscreen", () => frontSlab(m, "glass", MX_CAB, span(1.04, 2.5, 3.4), 0.01));
    m.scope("visor", () => frontSlab(m, "trim", MX_CAB, span(1.05, 3.45, 3.6), 0.012));
    m.scope("side windows", () => {
      for (const s of [-1, 1]) {
        const xb = frontAt(MX_CAB, 2.55) - 0.2;
        const xt = frontAt(MX_CAB, 3.4) - 0.2;
        sideSlab(m, "glass", s, 1.21, [[3.27, 2.55], [xb, 2.55], [xt, 3.4], [3.27, 3.4]]);
        sideSlab(m, "glass", s, 1.21, [[2.82, 2.63], [3.12, 2.63], [3.12, 3.38], [2.82, 3.38]]);
        sideSlab(m, "trim", s, 1.21, [[3.37, 2.17], [3.57, 2.17], [3.57, 2.23], [3.37, 2.23]], 0.015);
      }
    });
    m.scope("stripes", () => {
      for (const s of [-1, 1]) {
        sideSlab(m, "stripeGreen", s, 1.21, [[2.62, 2.0], [3.3, 2.0], [3.3, 2.05], [2.62, 2.05]]);
        sideSlab(m, "stripeYellow", s, 1.21, [[2.62, 1.95], [3.3, 1.95], [3.3, 2.0], [2.62, 2.0]]);
        sideSlab(m, "lampRed", s, 1.21, [[2.88, 1.92], [3.04, 1.92], [3.04, 2.08], [2.88, 2.08]], 0.01); // the badge
        sideSlab(m, "stripeGreen", s, 1.21, [[4.4, 2.3], [4.72, 2.3], [4.72, 2.34], [4.4, 2.34]]);
        sideSlab(m, "stripeYellow", s, 1.21, [[4.4, 2.26], [4.72, 2.26], [4.72, 2.3], [4.4, 2.3]]);
      }
    });
    m.scope("grille", () => {
      frontSlab(m, "glass", MX_CAB, span(0.75, 1.6, 2.36), 0.01, 0.04);
      for (const y of [1.66, 1.86, 2.06]) frontSlab(m, "alloy", MX_CAB, span(0.74, y, y + 0.06), 0.025);
      frontSlab(m, "white", MX_CAB, span(0.74, 2.26, 2.32), 0.025);
    });
    m.scope("beacon", () => {
      m.prism("chassis", ngon(10, 0.08, 0, 3.02, 0), 3.7, 3.75);
      m.prism("lampAmber", ngon(10, 0.07, 0, 3.02, 0), 3.75, 3.94);
    });
    m.scope("mirrors", () => {
      for (const s of [-1, 1]) {
        mirror(m, s, 4.54, 3.38, 1.2, { y0: 2.59, y1: 3.31, z0: 1.44, z1: 1.7 });
        block(m, "trim", 4.6, 4.68, 2.3, 2.5, ...side(s, 1.34, 1.56));
        block(m, "trim", 4.73, 4.81, 3.32, 3.58, ...side(s, 1.19, 1.43));
      }
    });
  });
  m.scope("front", () => {
    m.scope("bumper", () => {
      const lvl = (y: number): Level => ({ y, xf: 5.05, hw: 1.25, rf: 0.12 });
      m.loft("greyPlastic", planRing(4.7, lvl(0.68)), 0.68, planRing(4.7, lvl(1.29)), 1.29);
      m.cap("greyPlastic", planRing(4.7, lvl(0.68)), 0.68, false);
      block(m, "chassis", 4.69, 5.06, 0.63, 0.68, -1.235, 1.235); // the lip
      block(m, "glass", 5.04, 5.065, 0.91, 1.13, -0.55, 0.55); // the lower grille
      for (const y of [0.96, 1.06]) block(m, "alloy", 5.06, 5.075, y, y + 0.02, -0.54, 0.54);
      for (const s of [-1, 1]) {
        block(m, "alloy", 5.03, 5.065, 1.0, 1.24, ...side(s, 0.71, 1.13));
        block(m, "lampClear", 5.06, 5.08, 1.03, 1.21, ...side(s, 0.75, 1.09));
        block(m, "lampAmber", 5.04, 5.07, 0.8, 0.88, ...side(s, 0.9, 1.06));
      }
    });
    m.scope("step wells", () => {
      for (const s of [-1, 1]) {
        block(m, "greyPlastic", 4.42, 4.79, 0.51, 1.3, ...side(s, 1.0, 1.24));
        for (const y of [0.59, 0.95]) block(m, "alloy", 4.44, 4.77, y, y + 0.06, ...side(s, 1.03, 1.28));
      }
    });
  });
  m.scope("behind the cab", () => {
    m.prism("alloy", ngon(10, 0.06, 0, 2.47, 0.85), 1.3, 3.7); // the exhaust stack
    block(m, "white", 2.32, 2.54, 2.1, 3.3, -1.07, -0.83); // the air intake
  });
}

function mixerBody(m: MeshBuilder): void {
  m.scope("drum", () => {
    m.scope("shell", () => {
      for (let i = 0; i + 1 < DRUM.length; i++) {
        const [xa, ra] = DRUM[i]!;
        const [xb, rb] = DRUM[i + 1]!;
        m.sweep("white", "x", ngon(32, ra, 0, 0, drumY(xa)), xa, ngon(32, rb, 0, 0, drumY(xb)), xb, false);
      }
      const [xr, rr] = DRUM[DRUM.length - 1]!;
      m.sweep("white", "x", ngon(32, rr, 0, 0, drumY(xr)), xr, ngon(32, rr * 0.92, 0, 0, drumY(xr - 0.07)), xr - 0.07, false);
      m.sweep("chassis", "x", ngon(32, rr * 0.92, 0, 0, drumY(xr - 0.07)), xr - 0.07, ngon(32, rr * 0.5, 0, 0, drumY(xr + 0.2)), xr + 0.2); // the opening
      const [xf, rf] = DRUM[0]!;
      m.sweep("white", "x", ngon(32, rf, 0, 0, drumY(xf)), xf, ngon(32, 0.001, 0, 0, drumY(xf)), xf + 0.004, false);
    });
    m.scope("stripe", () => {
      drumBand(m, "stripeYellow", -0.62, -0.8, 0.012);
      drumBand(m, "stripeGreen", -0.8, -0.98, 0.012);
    });
    m.scope("roller track", () => drumBand(m, "alloy", -2.38, -2.66, 0.035));
    m.scope("hatch", () => {
      const x = 0.4;
      const top = drumY(x) + drumRadius(x);
      m.prism("white", ngon(12, 0.28, 0, x, 0), top - 0.1, top + 0.05);
    });
    m.scope("emblems", () => {
      for (const s of [-1, 1]) {
        const x = -1.25;
        const disc = ngon(16, 0.32, 0, x, drumY(x));
        const [z0, z1] = side(s, 1.0, drumRadius(x) + 0.02);
        m.sweep("stripeYellow", "z", disc, z0, disc, z1);
        block(m, "chassis", x - 0.08, x + 0.08, drumY(x) - 0.28, drumY(x) + 0.28, ...side(s, 1.03, drumRadius(x) + 0.03));
      }
    });
  });
  m.scope("front pedestal", () => {
    for (const s of [-1, 1]) block(m, "white", 1.83, 2.01, 1.29, 2.45, ...side(s, 0.33, 0.77));
    block(m, "white", 1.77, 2.07, 2.25, 2.55, -0.35, 0.35);
    block(m, "chassis", 1.66, 1.98, 2.32, 2.78, -0.25, 0.25); // the gearbox
    block(m, "chassis", 1.99, 2.49, 1.5, 2.0, 0.05, 0.85); // the pump
  });
  m.scope("water tank", () => {
    const r = (k: number): Ring => ngon(16, 0.34 * k, 0, 2.2, 0);
    m.cap("white", r(0.6), 2.46, false);
    m.loft("white", r(0.6), 2.46, r(1), 2.6, false);
    m.loft("white", r(1), 2.6, r(1), 3.42, false);
    m.loft("white", r(1), 3.42, r(0.55), 3.67);
    m.prism("white", ngon(8, 0.12, 0, 2.2, 0), 2.25, 2.48);
  });
  m.scope("rear pedestal", () => {
    for (const s of [-1, 1]) {
      block(m, "white", -3.94, -3.72, 1.29, 3.34, ...side(s, 0.3, 0.94));
      block(m, "white", -3.81, -3.16, 1.29, 1.94, ...side(s, 0.66, 0.78));
      const roller = ngon(10, 0.13, 0, s * 0.58, 2.62);
      m.sweep("chassis", "x", roller, -3.84, roller, -3.7);
    }
    block(m, "white", -3.95, -3.71, 3.13, 3.37, -0.75, 0.75);
  });
  m.scope("hopper", () => {
    const r = (k: number): Ring => ngon(16, k, 0, -4.46, 0);
    m.cap("white", r(0.26), 3.3, false);
    m.loft("white", r(0.26), 3.3, r(0.6), 4.31, false);
    m.cap("chassis", r(0.575), 4.24);
    for (const s of [-1, 1]) block(m, "white", -4.6, -3.66, 3.2, 3.26, ...side(s, 0.52, 0.58));
  });
  m.scope("chute", () => {
    block(m, "white", -4.6, -4.1, 2.5, 3.32, -0.3, 0.1);
    const trough: Ring = [[-4.77, 2.54], [-4.7, 2.32], [-4.36, 2.32], [-4.29, 2.54]];
    m.sweep("alloy", "z", trough, -0.7, trough, 0.7);
    for (const [x, y] of [[-4.48, 1.78], [-4.18, 1.62]] as const) {
      const tube = ngon(12, 0.17, 0, x, y);
      m.sweep("chassis", "z", tube, -0.57, tube, 0.57);
      const band = ngon(12, 0.19, 0, x, y);
      for (const z of [-0.4, 0, 0.4]) m.sweep("orange", "z", band, z - 0.03, band, z + 0.03);
    }
    for (const s of [-1, 1]) block(m, "orange", -4.58, -3.98, 1.39, 1.51, ...side(s, 0.56, 0.68));
  });
  m.scope("ladder", () => {
    for (const z of [0.45, 0.79]) block(m, "alloy", -4.37, -4.32, 0.8, 4.1, z - 0.03, z + 0.03);
    for (let i = 0; i < 8; i++) {
      const y = 0.95 + i * 0.4;
      block(m, "alloy", -4.36, -4.33, y - 0.02, y + 0.02, 0.48, 0.76);
    }
    block(m, "alloy", -4.53, -4.03, 3.93, 3.97, 0.32, 0.92); // the platform
    for (const s of [-1, 1]) {
      block(m, "alloy", -4.05, -4.01, 3.65, 4.53, ...side(s, 0.93, 0.97));
      block(m, "alloy", -4.48, -4.44, 3.65, 4.53, ...side(s, 0.93, 0.97));
      block(m, "alloy", -4.5, -3.88, 4.53, 4.57, ...side(s, 0.93, 0.97));
    }
  });
  m.scope("water pipe", () => {
    const pipe = ngon(8, 0.04, 0, 0.72, 1.55);
    m.sweep("white", "x", pipe, -3.7, pipe, 1.83);
  });
}

const MX_FRONT_TYRE: [number, number] = [0.9, 1.22];

export function mixerTruck(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.part("body", [0, 0, 0], () => {
    m.scope("chassis", () => mixerChassis(m));
    mixerCab(m);
    m.scope("mixer", () => mixerBody(m));
  });
  // an 8x4: both front axles steer, about the middle of the rear tandem
  const pivot = (MX_REAR_AXLES[0]! + MX_REAR_AXLES[1]!) / 2;
  const axles = MX_FRONT_AXLES.map((x, i) => ({ nodes: steered(m, "body", x, MX_WHEEL_R, MX_FRONT_TYRE, i ? "-2" : ""), wheelbase: x - pivot }));
  m.rig = { steer: { axles, maxAngleDeg: 40, track: MX_FRONT_TYRE[0] + MX_FRONT_TYRE[1] } };
  return m;
}

// --- the reefer semi-truck ----------------------------------------------------------
//
// A white MAN TGA-style cab-over tractor with a high roof, a tinted visor
// band over the windscreen, a black slatted grille, blue skirts and an
// aluminium fuel tank -- pulling a white refrigerated box semi-trailer with
// aluminium rails and corner posts, the refrigeration unit on its front wall,
// a red reflector stripe and three axles. 16.9 m over all.

const R_FRONT_AXLE = 7.18;
const R_DRIVE_AXLE = 3.58;
const R_WHEEL_R = 0.5;
const R_CAB_X0 = 6.25;
const R_CAB: Level[] = [
  { y: 1.15, xf: 8.31, hw: 1.21, rf: 0.18 },
  { y: 1.98, xf: 8.36, hw: 1.23, rf: 0.18 },
  { y: 2.05, xf: 8.37, hw: 1.23, rf: 0.14 },
  { y: 3.22, xf: 8.3, hw: 1.23, rf: 0.14 },
  { y: 3.48, xf: 8.24, hw: 1.22, rf: 0.16 },
  { y: 3.86, xf: 8.02, hw: 1.16, rf: 0.24 },
  { y: 4.0, xf: 7.8, hw: 1.04, rf: 0.24 },
];
const R_PIVOT: Vec3 = [3.73, 1.14, 0];

function reeferTractor(m: MeshBuilder): void {
  m.scope("chassis", () => {
    m.scope("frame rails", () => {
      for (const s of [-1, 1]) block(m, "trim", 2.58, 8.08, 0.72, 1.0, ...side(s, 0.4, 0.5));
    });
    m.scope("engine", () => block(m, "chassis", 6.3, 8.1, 0.55, 1.14, -0.85, 0.85));
    m.scope("fifth wheel", () => {
      const [x, y] = R_PIVOT;
      block(m, "chassis", x - 0.45, x + 0.45, 1.0, 1.05, -0.9, 0.9);
      m.prism("trim", ngon(14, 0.44, 0, x, 0), 1.05, y);
      block(m, "rubber", x - 0.44, x, y - 0.01, y + 0.004, -0.06, 0.06);
    });
    m.scope("rear fenders", () => {
      for (const s of [-1, 1]) {
        block(m, "trim", 2.98, 4.19, 1.08, 1.13, ...side(s, 0.6, 1.27));
        block(m, "rubber", 2.84, 2.86, 0.25, 1.08, ...side(s, 0.7, 1.27));
      }
    });
    m.scope("tanks", () => {
      const sec: Ring = [[0.68, 0.5], [1.22, 0.5], [1.27, 0.57], [1.27, 1.05], [1.22, 1.12], [0.68, 1.12], [0.63, 1.05], [0.63, 0.57]];
      m.sweep("alloy", "x", sec, 4.43, sec, 5.64);
      const ad = ngon(10, 0.22, 0, -0.95, 0.8);
      m.sweep("chassis", "x", ad, 4.68, ad, 5.29);
      for (const s of [-1, 1]) {
        const t = ngon(10, 0.13, 0, s * 0.75, 0.75);
        m.sweep("alloy", "x", t, 5.73, t, 6.25);
      }
    });
    m.scope("side skirts", () => {
      block(m, "blue", 4.28, 5.89, 0.55, 1.0, -1.23, -1.18);
      block(m, "blue", 5.66, 5.89, 0.55, 1.0, 1.18, 1.23);
      block(m, "blue", 4.28, 4.41, 0.55, 1.0, 1.18, 1.23);
    });
    m.scope("exhaust", () => m.prism("alloy", ngon(10, 0.07, 0, 6.13, -1.05), 0.95, 2.05));
    m.scope("rear light bar", () => {
      block(m, "trim", 2.62, 2.7, 0.72, 0.9, -1.0, 1.0);
      for (const s of [-1, 1]) block(m, "lampRed", 2.595, 2.625, 0.76, 0.88, ...side(s, 0.7, 0.95));
    });
  });

  // the front wheels steer: parts of their own (reeferSemiTruck), only the beam is here
  m.scope("front axle", () => axle(m, R_FRONT_AXLE, R_WHEEL_R, 0.95, false));
  m.scope("drive axle", () => {
    axle(m, R_DRIVE_AXLE, R_WHEEL_R, 0.95, true);
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "left duals" : "right duals", () => {
        wheel(m, R_DRIVE_AXLE, R_WHEEL_R, ...side(s, 0.59, 0.9), null);
        wheel(m, R_DRIVE_AXLE, R_WHEEL_R, ...side(s, 0.92, 1.25), s);
      });
    }
  });

  m.scope("cab", () => {
    cabShell(m, R_CAB_X0, R_CAB, ["white"]);
    m.scope("windscreen", () => frontSlab(m, "glass", R_CAB, span(1.06, 2.09, 3.19), 0.01));
    m.scope("visor", () => frontSlab(m, "visorTint", R_CAB, span(1.05, 3.25, 3.45), 0.012));
    m.scope("wipers", () => {
      for (const s of [-1, 1]) frontSlab(m, "trim", R_CAB, [[s * 0.07, 2.12], [s * 0.93, 2.12], [s * 0.93, 2.15], [s * 0.07, 2.15]], 0.022, 0.01);
    });
    m.scope("side windows", () => {
      for (const s of [-1, 1]) {
        const xb = frontAt(R_CAB, 2.32) - 0.2;
        const xt = frontAt(R_CAB, 3.12) - 0.2;
        sideSlab(m, "glass", s, 1.23, [[6.75, 2.32], [xb, 2.32], [xt, 3.12], [6.75, 3.12]]);
        sideSlab(m, "trim", s, 1.23, [[6.68, 2.25], [xb + 0.05, 2.25], [xb + 0.05, 2.31], [6.68, 2.31]]);
        sideSlab(m, "trim", s, 1.23, [[6.58, 1.15], [6.61, 1.15], [6.61, 3.3], [6.58, 3.3]], 0.004); // the door seam
        sideSlab(m, "trim", s, 1.23, [[6.3, 1.95], [6.36, 1.95], [6.36, 3.2], [6.3, 3.2]], 0.004); // the rear pillar strip
        sideSlab(m, "trim", s, 1.23, [[6.7, 2.12], [6.91, 2.12], [6.91, 2.17], [6.7, 2.17]], 0.015);
        sideSlab(m, "alloy", s, 1.23, [[6.41, 1.6], [6.44, 1.6], [6.44, 2.6], [6.41, 2.6]], 0.03);
        sideSlab(m, "lampAmber", s, 1.23, [[7.83, 1.5], [7.91, 1.5], [7.91, 1.56], [7.83, 1.56]], 0.01);
      }
    });
    m.scope("roof", () => {
      for (const s of [-1, 1]) {
        const horn = ngon(8, 0.04, 0, s * 0.35, 4.03);
        m.sweep("alloy", "x", horn, 6.68, horn, 7.18);
        block(m, "lampAmber", 7.68, 7.79, 3.96, 4.02, ...side(s, 0.6, 0.8));
      }
    });
    m.scope("mirrors", () => {
      for (const s of [-1, 1]) mirror(m, s, 7.98, 2.97, 1.2, { y0: 2.25, y1: 3.0, z0: 1.38, z1: 1.5 });
    });
  });

  m.scope("front", () => {
    m.scope("grille", () => {
      frontSlab(m, "trim", R_CAB, span(0.62, 1.6, 2.0), 0.01, 0.04);
      for (const y of [1.7, 1.82, 1.94]) frontSlab(m, "alloy", R_CAB, span(0.6, y, y + 0.035), 0.022);
      frontSlab(m, "alloy", R_CAB, span(0.14, 2.02, 2.04), 0.012); // the badge
    });
    m.scope("bumper", () => {
      const lvl = (y: number): Level => ({ y, xf: 8.45, hw: 1.24, rf: 0.12 });
      m.loft("white", planRing(8.1, lvl(0.72)), 0.72, planRing(8.1, lvl(1.32)), 1.32);
      m.cap("white", planRing(8.1, lvl(0.72)), 0.72, false);
      block(m, "trim", 8.09, 8.43, 0.62, 0.72, -1.2, 1.2); // the lip
      block(m, "trim", 8.44, 8.465, 0.82, 1.0, -0.5, 0.5);
      block(m, "plateWhite", 8.455, 8.47, 0.84, 0.96, -0.3, 0.3);
      for (const s of [-1, 1]) {
        block(m, "trim", 8.43, 8.455, 1.07, 1.31, ...side(s, 0.69, 1.12));
        block(m, "lampClear", 8.44, 8.465, 1.1, 1.28, ...side(s, 0.72, 1.06));
        block(m, "lampAmber", 8.44, 8.465, 1.1, 1.28, ...side(s, 1.06, 1.11));
        block(m, "lampClear", 8.44, 8.47, 0.85, 0.93, ...side(s, 0.85, 1.05));
      }
    });
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "left wheel arch" : "right wheel arch", () => {
        archFender(m, "trim", R_FRONT_AXLE, R_WHEEL_R, 0.58, 0.64, 0, 180, ...side(s, 0.86, 1.25));
        block(m, "white", 7.82, 8.14, 0.66, 1.16, ...side(s, 0.9, 1.22)); // the corner ahead of the wheel
        block(m, "trim", 6.3, 6.54, 0.3, 1.14, ...side(s, 1.0, 1.2)); // the step well
        for (const y of [0.38, 0.7]) block(m, "alloy", 6.32, 6.52, y, y + 0.06, ...side(s, 1.03, 1.24));
      });
    }
  });
}

const BOX_X0 = -8.4;
const BOX_X1 = 5.17;
const BOX_Y0 = 1.32;
const BOX_Y1 = 4.02;
const BOX_HW = 1.27;
const R_TRAILER_AXLES = [-4.82, -6.13, -7.44];

function reeferTrailer(m: MeshBuilder): void {
  m.scope("box", () => {
    block(m, "white", BOX_X0, BOX_X1, BOX_Y0 + 0.08, BOX_Y1 - 0.02, -BOX_HW, BOX_HW);
    block(m, "alloy", BOX_X0 - 0.02, BOX_X1 + 0.02, BOX_Y0, BOX_Y0 + 0.1, -1.28, 1.28); // the bottom rail
    for (const s of [-1, 1]) {
      block(m, "alloy", BOX_X0 - 0.02, BOX_X1 + 0.02, BOX_Y1 - 0.08, BOX_Y1, ...side(s, 1.24, 1.28)); // the top rail
      block(m, "alloy", BOX_X0 + 0.04, BOX_X1 - 0.04, BOX_Y1 - 0.03, BOX_Y1 - 0.014, ...side(s, 0.58, 0.6)); // a roof seam
      for (const [x0, x1] of [[-8.45, -8.38], [5.15, 5.22]] as const) block(m, "alloy", x0, x1, BOX_Y0, BOX_Y1 - 0.004, ...side(s, 1.24, 1.31));
      block(m, "lampRed", -8.12, 4.88, 1.43, 1.46, ...side(s, 1.27, 1.285)); // the reflector stripe
    }
  });
  m.scope("refrigeration unit", () => {
    const lvl = (y: number): Level => ({ y, xf: 5.6, hw: 1.0, rf: 0.14 });
    m.loft("white", planRing(5.1, lvl(1.65)), 1.65, planRing(5.1, lvl(3.75)), 3.75);
    m.cap("white", planRing(5.1, lvl(1.65)), 1.65, false);
    block(m, "trim", 5.59, 5.612, 2.6, 3.5, -0.75, 0.75);
    block(m, "trim", 5.59, 5.612, 1.8, 2.4, -0.75, 0.75);
    for (const y of [2.7, 2.9, 3.1, 3.3]) block(m, "alloy", 5.6, 5.625, y, y + 0.04, -0.72, 0.72);
    block(m, "alloy", 5.6, 5.625, 2.08, 2.12, -0.72, 0.72);
  });
  m.scope("rear doors", () => {
    block(m, "trim", BOX_X0 - 0.012, BOX_X0 + 0.01, 1.42, 3.92, -0.01, 0.01);
    for (const z of [-0.9, -0.35, 0.35, 0.9]) block(m, "alloy", BOX_X0 - 0.04, BOX_X0 + 0.01, 1.42, 3.92, z - 0.02, z + 0.02);
    for (const s of [-1, 1]) {
      for (const y of [1.74, 2.64, 3.54]) block(m, "trim", BOX_X0 - 0.03, BOX_X0 + 0.01, y - 0.04, y + 0.04, ...side(s, 1.12, 1.235));
      block(m, "lampAmber", BOX_X0 - 0.06, BOX_X0 - 0.01, 3.9, 3.98, ...side(s, 1.1, 1.22));
    }
  });
  m.scope("underframe", () => {
    for (const s of [-1, 1]) block(m, "trim", -8.21, 4.98, 1.05, BOX_Y0 - 0.004, ...side(s, 0.44, 0.56));
    block(m, "trim", 3.19, 5.08, 1.15, BOX_Y0 - 0.004, -1.0, 1.0); // the gooseneck plate
    m.prism("alloy", ngon(8, 0.05, 0, R_PIVOT[0], 0), 1.0, 1.16); // the king pin
    m.scope("landing gear", () => {
      for (const s of [-1, 1]) {
        block(m, "alloy", 2.29, 2.4, 0.12, 1.2, ...side(s, 0.85, 0.97));
        block(m, "trim", 2.2, 2.49, 0.04, 0.12, ...side(s, 0.78, 1.04));
      }
      block(m, "trim", 2.32, 2.37, 0.6, 0.66, -0.85, 0.85);
    });
    m.scope("side guards", () => {
      for (const s of [-1, 1]) for (const y of [0.9, 1.17]) block(m, "trim", -4.02, 1.89, y - 0.05, y + 0.05, ...side(s, 1.18, 1.22));
    });
    m.scope("gas bottle", () => {
      const t = ngon(12, 0.22, 0, 0.75, 0.82);
      m.sweep("lampRed", "x", t, -2.32, t, -1.11);
    });
    m.scope("pallet box", () => block(m, "trim", -3.82, -2.61, 0.6, 1.05, -0.6, 1.1));
  });
  R_TRAILER_AXLES.forEach((x, i) => m.scope(`axle ${i + 1}`, () => {
    axle(m, x, R_WHEEL_R, 0.85, false);
    for (const s of [-1, 1]) {
      block(m, "trim", x - 0.44, x + 0.44, 0.62, 0.72, ...side(s, 0.45, 0.6)); // the spring
      m.scope(s > 0 ? "left wheel" : "right wheel", () => wheel(m, x, R_WHEEL_R, ...side(s, 0.8, 1.24), s));
    }
  }));
  m.scope("fenders", () => {
    for (const s of [-1, 1]) {
      block(m, "trim", -8.07, -4.16, 1.1, 1.18, ...side(s, 0.6, 1.25));
      block(m, "rubber", -8.16, -8.14, 0.2, 1.1, ...side(s, 0.8, 1.25));
    }
  });
  m.scope("side markers", () => {
    for (const s of [-1, 1]) for (const x of [4.58, 1.98, -0.62, -3.22, -5.82, -8.2]) block(m, "lampAmber", x - 0.05, x + 0.05, 1.14, 1.2, ...side(s, 1.2, 1.26));
  });
  m.scope("rear", () => {
    block(m, "trim", -8.37, -8.21, 0.55, 0.68, -1.15, 1.15);
    for (const s of [-1, 1]) {
      block(m, "trim", -8.35, -8.25, 0.68, 1.05, ...side(s, 0.5, 0.58));
      block(m, "lampRed", -8.47, -8.41, 0.9, 1.05, ...side(s, 0.85, 1.2));
      block(m, "lampAmber", -8.46, -8.41, 0.9, 1.05, ...side(s, 0.55, 0.8));
    }
    block(m, "plateWhite", -8.44, -8.41, 0.72, 0.84, -0.25, 0.25);
    block(m, "trim", -8.41, -8.21, 0.7, 1.05, -0.7, 0.7);
  });
}

const R_FRONT_TYRE: [number, number] = [0.88, 1.22];

export function reeferSemiTruck(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.part("truck", [0, 0, 0], () => reeferTractor(m));
  const nodes = steered(m, "truck", R_FRONT_AXLE, R_WHEEL_R, R_FRONT_TYRE);
  m.part("trailer", R_PIVOT, () => reeferTrailer(m));
  m.rig = {
    steer: { axles: [{ nodes, wheelbase: R_FRONT_AXLE - R_DRIVE_AXLE }], maxAngleDeg: 40, track: R_FRONT_TYRE[0] + R_FRONT_TYRE[1] },
    sections: [{ node: "truck", pivot: [0, 0, 0] }, { node: "trailer", pivot: R_PIVOT }],
    maxBendDeg: 75,
  };
  return m;
}

/** The catalog fields of the family (meta.json, catalog.ts); a design may override the scale. */
export const TRUCK_CATALOG: CatalogFields = {
  category: "Road vehicles",
  group: "truck",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Every design of the family, by catalog id; `references` is the folder of its source photos under assets/. */
export const TRUCKS: ProceduralDesign[] = [
  { id: "veh-cistern-semi-truck", title: "Cistern Semi-Truck", build: cisternSemiTruck, references: "cistern-semi-truck", catalog: TRUCK_CATALOG },
  { id: "veh-mixer-truck", title: "Concrete Mixer Truck", build: mixerTruck, references: "mixer-truck", catalog: TRUCK_CATALOG },
  { id: "veh-reefer-semi-truck", title: "Reefer Semi-Truck", build: reeferSemiTruck, references: "reefer-semi-truck", catalog: TRUCK_CATALOG },
];
