// The animal-drawn rail vehicles (docs/models/animal-drawn-vehicles.md): the cars and
// wagons drawn here, the team ahead of them the kit's (animalVehicleKit.ts,
// draftAnimals.ts). With the team `none` each is the plain trailer coupled behind.
//
//   veh-animal-rail-budweis-coach  a passenger coach of the Ceske Budejovice - Linz
//                                  horse railway (1832) after the preserved "Hannibal"
//                                  (assets/animal-rail-budweis-coach): the stagecoach
//                                  body - its tub-shaped green lower half, the black
//                                  upper half with the door and its window - between
//                                  two hooded outside seats (the coachman's at the
//                                  front, the conductor's at the rear), so three places
//                                  to sit; the scrolled iron end brackets, the luggage
//                                  railing and trunks on the roof, the outside frame on
//                                  four spoked wheels, 1106 mm gauge.
//   veh-animal-rail-budweis-wagon  the same railway's open four-wheel goods wagon for
//                                  salt and timber (assets/animal-rail-budweis-wagon):
//                                  plank sides and ends on outside stanchions, iron
//                                  bands and braces, a lever brake.
//   veh-animal-rail-mine-tub       a 600 mm gauge pit tub (assets/animal-rail-mine-tub):
//                                  a steel box body with rounded corners and a rolled
//                                  rim, end handles, wooden dumb buffers, hook and
//                                  chain couplings, four small spoked wheels.
//   veh-animal-rail-trolley        a platelayers' / estate trolley on standard gauge
//                                  (assets/animal-rail-trolley): a plank deck on an
//                                  inside frame, two benches back to back for six, the
//                                  handbrake lever with its quadrant, lifting handles.
//
// Axes as every rail vehicle's: metres, +X forward (the team's end), +Y up, +Z to
// the right, the vehicle centred on x 0, the treads on y 0. Symmetric ends are drawn
// at +x and turned about the vertical axis (`turned`).

import { MeshBuilder } from "./meshBuilder.ts";
import { chamferedRect, grow, ngon, type Ring, type Vec3 } from "./meshCore.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { block, side } from "./vehicleParts.ts";
import { TAU } from "./characterKit.ts";
import { lodBlock, lodSideBox, lodWheel } from "./lodKit.ts";
import type { CatalogFields, ParamValues, ProceduralDesign } from "./design.ts";
import { animalVehicleDesign, buildAnimalVehicle, buildAnimalVehicleLod, type AnimalVehicleSpec } from "./animalVehicleKit.ts";

/** Goods and works vehicles: the coaches' fields in the wagon group. */
const WAGON_CATALOG: CatalogFields = { ...COACH_CATALOG, group: "wagon" };

// ---------------------------------------------------------------------------
// the palette

const PALETTE = {
  glass: { color: "#26323c", metallic: 0.2, roughness: 0.15, glass: true },
  steel: { color: "#8c9198", metallic: 0.3, roughness: 0.45 },
  wheel: { color: "#2b2c2e", metallic: 0.2, roughness: 0.6 },
  iron: { color: "#2a2b2d", roughness: 0.7 },
  spring: { color: "#45484c", metallic: 0.2, roughness: 0.6 },
  brass: { color: "#d9b13a", metallic: 0.4, roughness: 0.35 },
  gilt: { color: "#e2c03c", metallic: 0.4, roughness: 0.35 },
  coachGreen: { color: "#4b5a35", roughness: 0.5 },
  coachBlack: { color: "#24231f", roughness: 0.5 },
  beading: { color: "#151513", roughness: 0.5 },
  hoodLeather: { color: "#1c1b19", roughness: 0.55 },
  cushion: { color: "#3e4a2c", roughness: 0.85 },
  frameWood: { color: "#1f1e1c", roughness: 0.75 },
  trunk: { color: "#6a4527", roughness: 0.7 },
  trunkDark: { color: "#3c2a1c", roughness: 0.7 },
  canvas: { color: "#8c8262", roughness: 0.9 },
  wheelWood: { color: "#6e6a62", roughness: 0.85 },
  plank: { color: "#8a6a45", roughness: 0.85 },
  plankDark: { color: "#6b5034", roughness: 0.85 },
  tubSteel: { color: "#4d5154", metallic: 0.25, roughness: 0.6 },
  tubInside: { color: "#2b2a28", roughness: 0.9 },
  buffer: { color: "#5a4128", roughness: 0.85 },
  oxide: { color: "#7a3424", roughness: 0.7 },
  seatWood: { color: "#a8763f", roughness: 0.6 },
  deckWood: { color: "#9b7a52", roughness: 0.85 },
};

// ---------------------------------------------------------------------------
// shared drawing helpers

/** A round rod along a polyline. */
function rods(m: MeshBuilder, mat: string, pts: readonly Vec3[], r: number, n = 6, ends = true): void {
  for (let i = 0; i + 1 < pts.length; i++) m.rod(mat, pts[i]!, pts[i + 1]!, r, n, ends);
}

/** The ring (x, z) wound as `ngon` winds it, the way `prism`, `loft` and `cap` take it. */
function ccw(r: Ring): Ring {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const [x0, z0] = r[i]!;
    const [x1, z1] = r[(i + 1) % r.length]!;
    a += x0 * z1 - x1 * z0;
  }
  return a < 0 ? r : [...r].reverse();
}

/** Points (x, y) on the arc about (cx, cy) of radius r from a0 to a1 (radians), n segments. */
function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, n: number): Array<[number, number]> {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

/** The game's track gauge (m): every rail vehicle's treads stand on it. */
const GAME_GAUGE = 1.435;

interface WheelSpec {
  /** The prototype's track gauge (m; the model runs on GAME_GAUGE) and the wheel's tread radius. */
  gauge: number;
  r: number;
  /** Facets round the tyre, spokes, the axle's half length. */
  sides: number;
  spokes: number;
  axleHalf: number;
  /** The scale of the tyre, hub and spoke sections (1 = a main-line wheel). */
  k: number;
  /** The hub's and spokes' material (wooden wheels), the tyre's always `wheel`. */
  centre?: string;
}

// the tyre polygon stands on a vertex: its axle a full radius over the rail head
const axleY = (w: WheelSpec): number => w.r;

/** A spoked wheelset (a rolling part) at x: axle, two tyres with flanges, hubs and spokes. */
function wheelset(m: MeshBuilder, name: string, x: number, w: WheelSpec): void {
  const y = axleY(w);
  // every rail vehicle runs on the game's one gauge, standard: a narrower line's own is in its sources
  const g = GAME_GAUGE / 2;
  const axleHalf = Math.max(w.axleHalf, g + 0.1 * w.k + 0.02);
  m.spin(name, [x, y, 0], () => m.scope("wheelset", () => {
    const axle = ngon(8, 0.06 * w.k, 0, x, y);
    m.sweep("steel", "z", axle, -axleHalf, axle, axleHalf);
    for (const s of [-1, 1]) {
      const [t0, t1] = side(s, g - 0.03, g + 0.075); // the tread: the rail head under it, whatever the wheel's size
      m.tube("wheel", "z", x, y, w.r, w.r - 0.055 * w.k, t0, t1, w.sides, Math.PI / w.sides);
      // the flange inside the rail, drawn no deeper than the tread: nothing below the rail head (y 0)
      const [f0, f1] = side(s, g - 0.03 - 0.02 * w.k, g - 0.03);
      m.tube("wheel", "z", x, y, w.r, w.r - 0.05 * w.k, f0, f1, w.sides, Math.PI / w.sides);
      const hub = ngon(8, 0.09 * w.k, 0, x, y);
      const [h0, h1] = side(s, g - 0.02 * w.k, g + 0.1 * w.k);
      m.sweep(w.centre ?? "wheel", "z", hub, h0, hub, h1);
      const zc = s * (g + 0.025 * w.k);
      for (let k = 0; k < w.spokes; k++) {
        const a = (TAU * (k + 0.5)) / w.spokes;
        const [c, sn] = [Math.cos(a), Math.sin(a)];
        m.rod(w.centre ?? "wheel", [x + 0.08 * w.k * c, y + 0.08 * w.k * sn, zc], [x + (w.r - 0.05 * w.k) * c, y + (w.r - 0.05 * w.k) * sn, zc], 0.022 * w.k, 4, false);
      }
    }
  }));
}

/** A draw hook at the end of the frame: the bar out of the headstock and the pin. */
function drawHook(m: MeshBuilder, x0: number, x1: number, y: number, h: number): void {
  m.scope("draw hook", () => {
    block(m, "iron", x0, x1, y - h, y + h, -0.03, 0.03);
    m.rod("iron", [x1, y + 0.05, 0], [x1, y - 0.06, 0], 0.022, 6);
  });
}

// ---------------------------------------------------------------------------
// 1. the Budweis-Linz coach ("Hannibal")

const BW_WHEEL: WheelSpec = { gauge: 1.106, r: 0.43, sides: 22, spokes: 10, axleHalf: 0.72, k: 1 };
const BW_AXLE_X = 0.74;
const CO_HALF = 1.24; // the body's half length
const CO_HW = 0.8; // half width over the lower body
const CO_WAIST = 1.78;
const CO_ROOF = 2.92;
const CO_FRAME = 1.96; // the frame's half length over the headstocks

/** The outside frame: sole bars, headstocks, cross beams, axle guards and boxes, springs, brake. */
function coachFrame(m: MeshBuilder, half: number, w: WheelSpec, axleX: number, top: number): void {
  const y = axleY(w);
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      block(m, "frameWood", -half + 0.05, half - 0.05, top - 0.18, top, ...side(s, 0.64, 0.74));
      for (const x of [-axleX, axleX]) {
        // the axle guards and the box between them, the spring over the box
        for (const d of [-0.13, 0.13]) block(m, "iron", x + d - 0.025, x + d + 0.025, y - 0.12, top - 0.18, ...side(s, 0.66, 0.72));
        block(m, "iron", x - 0.1, x + 0.1, y - 0.09, y + 0.1, ...side(s, 0.62, 0.77));
        for (let k = 0; k < 3; k++) {
          const hl = 0.36 - k * 0.09;
          block(m, "spring", x - hl, x + hl, top - 0.24 + k * 0.022, top - 0.222 + k * 0.022, ...side(s, 0.665, 0.715));
        }
      }
    }
    for (const e of [-1, 1]) block(m, "frameWood", ...side(e, half - 0.1, half), top - 0.21, top + 0.01, -0.8, 0.8);
    for (const x of [-0.9, 0, 0.9]) block(m, "frameWood", x - 0.05, x + 0.05, top, top + 0.06, -0.74, 0.74);
  });
  m.scope("brake", () => {
    // the blocks on the left wheels, worked by a hand lever along the frame
    const xb = -axleX - w.r - 0.04;
    for (const s of [-1, 1]) block(m, "frameWood", xb - 0.035, xb + 0.035, y - 0.12, y + 0.12, ...side(s, 0.5, 0.6));
    m.rod("iron", [xb, y, -0.62], [xb, y, 0.62], 0.02, 5);
    m.rod("iron", [xb, y, -0.62], [-half + 0.1, top - 0.08, -0.78], 0.02, 5);
    m.rod("iron", [-half + 0.1, top - 0.08, -0.78], [-half - 0.08, top + 0.35, -0.8], 0.022, 5);
  });
}

/** The lower body's side profile (x, y): a tub, straight above, rounded under each end. */
const LOWER: Array<[number, number]> = [
  [-CO_HALF, CO_WAIST], ...arcPts(-CO_HALF + 0.56, 1.5, 0.56, Math.PI, 1.5 * Math.PI, 5), ...arcPts(CO_HALF - 0.56, 1.5, 0.56, 1.5 * Math.PI, 2 * Math.PI, 5), [CO_HALF, CO_WAIST],
];

function coachBody(m: MeshBuilder): void {
  m.scope("lower body", () => {
    m.sweep("coachGreen", "z", LOWER, -CO_HW, LOWER, CO_HW);
    for (const s of [-1, 1]) {
      const z = s * (CO_HW + 0.008);
      // the beading round the tub's edge and the door's edges
      rods(m, "beading", LOWER.slice(0, -1).map(([x, y]) => [x, y, z] as Vec3), 0.014, 4);
      for (const x of [-0.34, 0.34]) block(m, "beading", x - 0.012, x + 0.012, 0.94, CO_WAIST, ...side(s, CO_HW, CO_HW + 0.012));
      // the class numeral "II" on the door
      const zz = side(s, CO_HW, CO_HW + 0.006);
      for (const x of [-0.05, 0.05]) block(m, "gilt", x - 0.014, x + 0.014, 1.3, 1.52, ...zz);
      for (const y of [1.29, 1.51]) block(m, "gilt", -0.085, 0.085, y, y + 0.018, ...zz);
    }
    block(m, "beading", -CO_HALF - 0.025, CO_HALF + 0.025, CO_WAIST - 0.03, CO_WAIST + 0.035, -CO_HW - 0.025, CO_HW + 0.025);
  });
  m.scope("upper body", () => {
    const hw = CO_HW - 0.03;
    block(m, "coachBlack", -CO_HALF + 0.02, CO_HALF - 0.02, CO_WAIST + 0.035, CO_ROOF, -hw, hw);
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right side" : "left side", () => {
        const z = side(s, hw, hw + 0.012);
        // the door: its frame, the window with its glazing bars, the handle
        for (const x of [-0.34, 0.34]) block(m, "beading", x - 0.015, x + 0.015, CO_WAIST, CO_ROOF - 0.08, ...z);
        block(m, "beading", -0.34, 0.34, CO_ROOF - 0.11, CO_ROOF - 0.08, ...z);
        block(m, "glass", -0.24, 0.24, 1.98, 2.66, ...side(s, hw + 0.002, hw + 0.006));
        for (const x of [-0.25, 0, 0.25]) block(m, "beading", x - 0.016, x + 0.016, 1.96, 2.68, ...side(s, hw + 0.003, hw + 0.016));
        for (const y of [1.96, 2.32, 2.67]) block(m, "beading", -0.25, 0.25, y - 0.016, y + 0.016, ...side(s, hw + 0.003, hw + 0.016));
        block(m, "brass", 0.25, 0.3, 1.86, 1.89, ...side(s, CO_HW, CO_HW + 0.04));
        // the panel mouldings either side of the door
        for (const [a, b] of [[-1.12, -0.44], [0.44, 1.12]] as const) {
          block(m, "beading", a, b, 1.9, 1.92, ...z);
          block(m, "beading", a, b, 2.74, 2.76, ...z);
          block(m, "beading", a, a + 0.02, 1.92, 2.74, ...z);
          block(m, "beading", b - 0.02, b, 1.92, 2.74, ...z);
        }
      });
    }
    // the end windows looking onto the outside seats
    for (const e of [-1, 1]) {
      const x = side(e, CO_HALF - 0.02, CO_HALF - 0.012);
      block(m, "glass", ...x, 2.45, 2.78, -0.36, 0.36);
      block(m, "beading", ...side(e, CO_HALF - 0.02, CO_HALF), 2.42, 2.45, -0.4, 0.4);
    }
  });
  m.scope("roof", () => {
    const r: Ring = [[-CO_HW - 0.03, CO_ROOF], [CO_HW + 0.03, CO_ROOF], [CO_HW + 0.03, CO_ROOF + 0.05], [0.45, CO_ROOF + 0.1], [0, CO_ROOF + 0.115], [-0.45, CO_ROOF + 0.1], [-CO_HW - 0.03, CO_ROOF + 0.05]];
    m.sweep("hoodLeather", "x", r, -CO_HALF - 0.04, r, CO_HALF + 0.04);
    m.scope("railing", () => {
      const [x, z, y0, y1] = [CO_HALF - 0.1, CO_HW - 0.06, CO_ROOF + 0.06, CO_ROOF + 0.3];
      const loop: Vec3[] = [[x, y1, z], [-x, y1, z], [-x, y1, -z], [x, y1, -z], [x, y1, z]];
      rods(m, "iron", loop, 0.014, 5);
      rods(m, "iron", loop.map(([a, , c]) => [a, y0 + 0.12, c] as Vec3), 0.01, 4);
      for (const px of [-x, -x / 3, x / 3, x]) for (const s of [-1, 1]) m.rod("iron", [px, y0, s * z], [px, y1, s * z], 0.012, 4, false);
      for (const s of [-1, 1]) m.rod("iron", [s * x, y0, 0], [s * x, y1, 0], 0.012, 4, false);
    });
    m.scope("luggage", () => {
      const y = CO_ROOF + 0.1;
      block(m, "trunk", -0.95, -0.25, y, y + 0.32, -0.52, 0.42);
      for (const x of [-0.8, -0.4]) block(m, "iron", x - 0.02, x + 0.02, y + 0.005, y + 0.33, -0.53, 0.43);
      block(m, "trunkDark", -0.12, 0.5, y, y + 0.22, -0.3, 0.56);
      const roll = ngon(8, 0.13, 0, -0.38, y + 0.13);
      m.sweep("canvas", "x", roll, 0.6, roll, 1.05);
    });
  });
}

/** One outside seat, drawn at the front (+x): the seat box, cushions, the footboard and dash, the hood, the scrolled brackets. */
function coachEnd(m: MeshBuilder): void {
  const x0 = CO_HALF;
  m.scope("seat", () => {
    block(m, "coachBlack", x0, 1.8, 1.56, 1.84, -0.72, 0.72);
    block(m, "cushion", x0 + 0.02, 1.78, 1.84, 1.93, -0.7, 0.7);
    block(m, "cushion", x0, x0 + 0.08, 1.93, 2.44, -0.7, 0.7);
    // the footboard on its brackets and the leather dash in front of it
    block(m, "frameWood", 1.8, 2.12, 1.28, 1.32, -0.72, 0.72);
    for (const s of [-1, 1]) m.rod("iron", [1.86, 1.3, s * 0.62], [1.64, 1.57, s * 0.62], 0.018, 5);
    m.slab("hoodLeather", [[2.12, 1.32, -0.72], [2.12, 1.32, 0.72], [2.16, 1.72, 0.72], [2.16, 1.72, -0.72]], [-0.025, 0, 0]);
    // the hand irons either side of the seat
    for (const s of [-1, 1]) rods(m, "iron", [[x0 + 0.02, 2.12, s * 0.76], [1.72, 2.12, s * 0.76], [1.76, 1.84, s * 0.76]], 0.012, 4);
  });
  m.scope("hood", () => {
    // the calash: a rounded leather hood flaring out to its mouth over the seat, its hoops
    const xf = 2.12;
    const prof = (x: number): Array<[number, number]> => {
      const t = (x - x0) / (xf - x0);
      const w = CO_HW + 0.02 + 0.2 * t;
      const yb = 1.95 + 0.25 * t;
      const yt = 3.0 + 0.2 * t;
      const r = 0.25 + 0.06 * t;
      return [[w, yb], ...arcPts(w - r, yt - r, r, 0, Math.PI / 2, 3), ...arcPts(-w + r, yt - r, r, Math.PI / 2, Math.PI, 3), [-w, yb]];
    };
    const [p0, p1] = [prof(x0), prof(xf)];
    for (let i = 0; i + 1 < p0.length; i++) {
      const [a0, b0, a1, b1] = [p0[i]!, p0[i + 1]!, p1[i]!, p1[i + 1]!];
      // outward: away from the hood's axis
      const mz = (a0[0] + b0[0]) / 2;
      const my = (a0[1] + b0[1]) / 2 - 2.6;
      const l = Math.hypot(mz, my) || 1;
      m.slab("hoodLeather", [[x0, a0[1], a0[0]], [x0, b0[1], b0[0]], [xf, b1[1], b1[0]], [xf, a1[1], a1[0]]], [0, (0.022 * my) / l, (0.022 * mz) / l]);
    }
    for (const x of [1.62, 1.98]) {
      const pts = prof(x).map(([z, y]) => [x, y + 0.012 * Math.sign(y - 2.6), z * 1.03] as Vec3);
      rods(m, "iron", pts, 0.014, 4);
    }
    // the side curtains rolled up under the hood's lower edges
    for (const s of [-1, 1]) m.rod("hoodLeather", [x0 + 0.05, 2.0, s * (p0[0]![0] + 0.04)], [xf - 0.05, 2.2, s * (p1[0]![0] + 0.04)], 0.065, 6);
  });
  m.scope("brackets", () => {
    // the scrolled irons from the frame's end up under the seat box
    for (const s of [-1, 1]) {
      const z = s * 0.56;
      const scroll = arcPts(1.86, 1.2, 0.34, -0.55 * Math.PI, 0.9 * Math.PI, 9).map(([x, y]) => [x, y, z] as Vec3);
      rods(m, "iron", [[CO_FRAME - 0.12, 0.82, z], ...scroll, [1.55, 1.56, z]], 0.03, 6);
      const curl = arcPts(1.62, 1.5, 0.08, 0, TAU * 0.8, 5).map(([x, y]) => [x, y, z] as Vec3);
      rods(m, "iron", curl, 0.022, 5);
    }
  });
  drawHook(m, CO_FRAME, CO_FRAME + 0.16, 0.69, 0.03);
}

function budweisCoachBody(m: MeshBuilder): void {
  m.scope("running gear", () => {
    wheelset(m, "wheelset-1", BW_AXLE_X, BW_WHEEL);
    wheelset(m, "wheelset-2", -BW_AXLE_X, BW_WHEEL);
    coachFrame(m, CO_FRAME, BW_WHEEL, BW_AXLE_X, 0.82);
    m.scope("steps", () => {
      for (const s of [-1, 1]) {
        block(m, "frameWood", -0.2, 0.2, 0.5, 0.54, ...side(s, 0.78, 0.98));
        for (const x of [-0.15, 0.15]) m.rod("iron", [x, 0.52, s * 0.9], [x, 0.7, s * 0.72], 0.016, 4);
      }
    });
  });
  m.scope("body", () => coachBody(m));
  m.scope("front seat", () => coachEnd(m));
  m.scope("rear seat", () => m.turned(0, () => coachEnd(m)));
}

function budweisCoachLod(m: MeshBuilder): void {
  lodSideBox(m, "coachGreen", [[-0.8, 0.94], [0.8, 0.94], [CO_HALF, CO_WAIST], [-CO_HALF, CO_WAIST]], -CO_HW, CO_HW);
  lodBlock(m, -CO_HALF, CO_HALF, CO_WAIST, CO_ROOF + 0.1, -CO_HW + 0.03, CO_HW - 0.03, { side: "coachBlack", top: "hoodLeather" });
  lodBlock(m, -0.95, 0.5, CO_ROOF + 0.1, CO_ROOF + 0.4, -0.5, 0.5, { side: "trunk" });
  for (const e of [-1, 1]) {
    const [x0, x1] = e > 0 ? [CO_HALF, 2.12] : [-2.12, -CO_HALF];
    lodBlock(m, x0, x1, 1.95, 3.15, -0.95, 0.95, { side: "hoodLeather" });
    lodBlock(m, x0, x1, 1.3, 1.95, -0.72, 0.72, { side: "coachBlack", top: null });
  }
  lodBlock(m, -CO_FRAME, CO_FRAME, 0.6, 0.84, -0.74, 0.74, { side: "frameWood" });
  for (const x of [-BW_AXLE_X, BW_AXLE_X]) for (const s of [-1, 1]) lodWheel(m, "wheel", x, BW_WHEEL.r, ...side(s, 0.5, 0.62), 8);
}

const BUDWEIS_COACH: AnimalVehicleSpec = {
  id: "veh-animal-rail-budweis-coach",
  title: "Budweis-Linz Coach",
  kind: "rail",
  catalog: { ...COACH_CATALOG },
  palette: PALETTE,
  weight: 1.8,
  maxspeed: 15,
  hitch: [CO_FRAME + 0.16, 0.69, 0],
  reins: [2.0, 2.15, 0],
  body: budweisCoachBody,
  rolling: [{ nodes: ["wheelset-1", "wheelset-2"], diameter: 2 * BW_WHEEL.r }],
  lod: budweisCoachLod,
  references: "animal-rail-budweis-coach",
};

export const animalRailBudweisCoach = (p?: ParamValues) => buildAnimalVehicle(BUDWEIS_COACH, p);
export const animalRailBudweisCoachLod = (p?: ParamValues) => buildAnimalVehicleLod(BUDWEIS_COACH, p);

// ---------------------------------------------------------------------------
// 2. the Budweis-Linz goods wagon

const GW_WHEEL: WheelSpec = { gauge: 1.106, r: 0.45, sides: 22, spokes: 12, axleHalf: 0.72, k: 1, centre: "wheelWood" };
const GW_AXLE_X = 0.8;
const GW_HALF = 1.62; // the body's half length
const GW_HW = 0.78;
const GW_FLOOR = 1.12;
const GW_TOP = 1.6;
const GW_FRAME = 1.76;

function budweisWagonBody(m: MeshBuilder): void {
  m.scope("running gear", () => {
    wheelset(m, "wheelset-1", GW_AXLE_X, GW_WHEEL);
    wheelset(m, "wheelset-2", -GW_AXLE_X, GW_WHEEL);
    coachFrame(m, GW_FRAME, GW_WHEEL, GW_AXLE_X, GW_FLOOR - 0.12);
    m.scope("front end", () => drawHook(m, GW_FRAME, GW_FRAME + 0.15, 0.88, 0.03));
    m.scope("rear end", () => m.turned(0, () => drawHook(m, GW_FRAME, GW_FRAME + 0.15, 0.88, 0.03)));
  });
  m.scope("body", () => {
    m.scope("floor", () => block(m, "plankDark", -GW_HALF, GW_HALF, GW_FLOOR - 0.06, GW_FLOOR, -GW_HW, GW_HW));
    const planks = 4;
    const ph = (GW_TOP - GW_FLOOR) / planks;
    m.scope("sides", () => {
      for (const s of [-1, 1]) for (let k = 0; k < planks; k++) {
        const y = GW_FLOOR + k * ph;
        block(m, k % 2 ? "plankDark" : "plank", -GW_HALF, GW_HALF, y + 0.006, y + ph - 0.006, ...side(s, GW_HW - 0.04, GW_HW));
      }
    });
    m.scope("ends", () => {
      for (const e of [-1, 1]) for (let k = 0; k < planks; k++) {
        const y = GW_FLOOR + k * ph;
        block(m, k % 2 ? "plankDark" : "plank", ...side(e, GW_HALF - 0.04, GW_HALF), y + 0.006, y + ph - 0.006, -GW_HW + 0.04, GW_HW - 0.04);
      }
    });
    m.scope("stanchions", () => {
      for (const s of [-1, 1]) {
        for (const x of [-GW_HALF + 0.03, -0.55, 0.55, GW_HALF - 0.03]) block(m, "plankDark", x - 0.05, x + 0.05, GW_FLOOR - 0.2, GW_TOP + 0.03, ...side(s, GW_HW, GW_HW + 0.06));
        // the braces from the middle stanchions down to the corners
        for (const e of [-1, 1]) m.rod("plankDark", [e * 0.62, GW_TOP - 0.05, s * (GW_HW + 0.03)], [e * (GW_HALF - 0.1), GW_FLOOR + 0.05, s * (GW_HW + 0.03)], 0.028, 4);
      }
      for (const e of [-1, 1]) for (const z of [-0.3, 0.3]) block(m, "plankDark", ...side(e, GW_HALF, GW_HALF + 0.06), GW_FLOOR - 0.2, GW_TOP + 0.03, z - 0.05, z + 0.05);
    });
    m.scope("ironwork", () => {
      // the top bands round the body, the corner plates, the bolt heads along the stanchions
      for (const s of [-1, 1]) block(m, "iron", -GW_HALF - 0.065, GW_HALF + 0.065, GW_TOP - 0.05, GW_TOP, ...side(s, GW_HW + 0.06, GW_HW + 0.07));
      for (const e of [-1, 1]) block(m, "iron", ...side(e, GW_HALF + 0.06, GW_HALF + 0.07), GW_TOP - 0.05, GW_TOP, -GW_HW - 0.07, GW_HW + 0.07);
      for (const s of [-1, 1]) for (const x of [-0.55, 0.55]) for (const y of [GW_FLOOR + 0.1, GW_FLOOR + 0.3, GW_FLOOR + 0.48]) {
        block(m, "iron", x - 0.02, x + 0.02, y - 0.02, y + 0.02, ...side(s, GW_HW + 0.06, GW_HW + 0.075));
      }
    });
  });
}

function budweisWagonLod(m: MeshBuilder): void {
  lodBlock(m, -GW_HALF - 0.06, GW_HALF + 0.06, GW_FLOOR - 0.2, GW_TOP, -GW_HW - 0.06, GW_HW + 0.06, { side: "plank", top: "plankDark" });
  lodBlock(m, -GW_FRAME, GW_FRAME, 0.8, GW_FLOOR - 0.2, -0.74, 0.74, { side: "frameWood" });
  for (const x of [-GW_AXLE_X, GW_AXLE_X]) for (const s of [-1, 1]) lodWheel(m, "wheel", x, GW_WHEEL.r, ...side(s, 0.5, 0.62), 8);
}

const BUDWEIS_WAGON: AnimalVehicleSpec = {
  id: "veh-animal-rail-budweis-wagon",
  title: "Budweis-Linz Goods Wagon",
  kind: "rail",
  catalog: WAGON_CATALOG,
  palette: PALETTE,
  weight: 1.0,
  maxspeed: 12,
  hitch: [GW_FRAME + 0.15, 0.88, 0],
  body: budweisWagonBody,
  rolling: [{ nodes: ["wheelset-1", "wheelset-2"], diameter: 2 * GW_WHEEL.r }],
  lod: budweisWagonLod,
  references: "animal-rail-budweis-wagon",
};

export const animalRailBudweisWagon = (p?: ParamValues) => buildAnimalVehicle(BUDWEIS_WAGON, p);
export const animalRailBudweisWagonLod = (p?: ParamValues) => buildAnimalVehicleLod(BUDWEIS_WAGON, p);

// ---------------------------------------------------------------------------
// 3. the mine tub

const MT_WHEEL: WheelSpec = { gauge: 0.6, r: 0.16, sides: 14, spokes: 6, axleHalf: 0.42, k: 0.55 };
const MT_AXLE_X = 0.26;
const MT_BOTTOM = 0.34;
const MT_TOP = 1.08;
const MT_FRAME = 0.66;
/** The body's plan at its bottom and at its rim: rounded corners, the sides flaring out. */
const MT_LOWER: Ring = ccw(chamferedRect(1.46, 0.8, 0.12));
const MT_UPPER: Ring = ccw(chamferedRect(1.6, 0.9, 0.14));

function mineTubEnd(m: MeshBuilder): void {
  // the wooden dumb buffer on its iron plate, the hook and a three-link chain
  block(m, "buffer", MT_FRAME, MT_FRAME + 0.12, 0.2, 0.36, -0.18, 0.18);
  block(m, "iron", MT_FRAME - 0.01, MT_FRAME + 0.005, 0.18, 0.37, -0.2, 0.2);
  block(m, "iron", MT_FRAME + 0.12, MT_FRAME + 0.2, 0.25, 0.29, -0.02, 0.02);
  m.rod("iron", [MT_FRAME + 0.2, 0.31, 0], [MT_FRAME + 0.2, 0.22, 0], 0.016, 5);
  // two links hanging from the hook's pin, the first in the x-y plane, the second across it
  const pin = MT_FRAME + 0.2;
  const l1 = arcPts(pin, 0.2, 0.035, 0, TAU, 6).map(([x, y]) => [x, y, 0] as Vec3);
  rods(m, "iron", l1, 0.008, 3, false);
  const l2 = arcPts(0, 0.14, 0.035, 0, TAU, 6).map(([z, y]) => [pin, y, z] as Vec3);
  rods(m, "iron", l2, 0.008, 3, false);
  // the handles on the end, under the rim
  const xe = 0.8 - 0.005;
  for (const z of [-0.24, 0.24]) rods(m, "iron", [[xe - 0.01, 0.9, z - 0.07], [xe + 0.05, 0.9, z - 0.07], [xe + 0.05, 0.9, z + 0.07], [xe - 0.01, 0.9, z + 0.07]], 0.014, 5);
}

function mineTubBody(m: MeshBuilder): void {
  m.scope("running gear", () => {
    wheelset(m, "wheelset-1", MT_AXLE_X, MT_WHEEL);
    wheelset(m, "wheelset-2", -MT_AXLE_X, MT_WHEEL);
    const y = axleY(MT_WHEEL);
    m.scope("frame", () => {
      for (const s of [-1, 1]) {
        // the channel underframe inside the wheels, its axle boxes and rivets
        block(m, "iron", -MT_FRAME, MT_FRAME, 0.19, MT_BOTTOM, ...side(s, 0.2, 0.225));
        block(m, "iron", -MT_FRAME, MT_FRAME, MT_BOTTOM - 0.02, MT_BOTTOM, ...side(s, 0.15, 0.225));
        for (const x of [-MT_AXLE_X, MT_AXLE_X]) block(m, "iron", x - 0.06, x + 0.06, y - 0.05, y + 0.07, ...side(s, 0.17, 0.25));
        for (const x of [-0.58, -0.48, 0.48, 0.58]) block(m, "steel", x - 0.012, x + 0.012, 0.25, 0.274, ...side(s, 0.225, 0.233));
      }
      for (const x of [-0.5, 0, 0.5]) block(m, "iron", x - 0.04, x + 0.04, MT_BOTTOM - 0.04, MT_BOTTOM, -0.2, 0.2);
    });
    m.scope("front end", () => mineTubEnd(m));
    m.scope("rear end", () => m.turned(0, () => mineTubEnd(m)));
  });
  m.scope("body", () => {
    // the shell outside and in, the floor, the rolled rim
    m.loft("tubSteel", MT_LOWER, MT_BOTTOM, MT_UPPER, MT_TOP, false);
    m.cap("tubSteel", MT_LOWER, MT_BOTTOM, false);
    const inLow = grow(MT_LOWER, -0.02);
    const inUp = grow(MT_UPPER, -0.02);
    m.loft("tubInside", [...inLow].reverse(), MT_BOTTOM + 0.04, [...inUp].reverse(), MT_TOP, false);
    m.cap("tubInside", inLow, MT_BOTTOM + 0.04, true);
    const rim = grow(MT_UPPER, 0.002);
    rods(m, "iron", [...rim, rim[0]!].map(([x, z]) => [x, MT_TOP, z] as Vec3), 0.02, 5, false);
    // the welded seams down the corners and the band round the middle
    const band = grow(MT_UPPER, -0.025);
    rods(m, "iron", [...band, band[0]!].map(([x, z]) => [x * 0.97, 0.7, z * 0.965] as Vec3), 0.012, 4, false);
  });
}

function mineTubLod(m: MeshBuilder): void {
  lodSideBox(m, "tubSteel", [[-0.73, MT_BOTTOM], [0.73, MT_BOTTOM], [0.8, MT_TOP], [-0.8, MT_TOP]], -0.43, 0.43);
  lodBlock(m, -0.8, 0.8, MT_TOP - 0.001, MT_TOP, -0.43, 0.43, { side: null, top: "tubInside" });
  lodBlock(m, -MT_FRAME - 0.12, MT_FRAME + 0.12, 0.2, MT_BOTTOM, -0.22, 0.22, { side: "iron", end: "buffer" });
  for (const x of [-MT_AXLE_X, MT_AXLE_X]) for (const s of [-1, 1]) lodWheel(m, "wheel", x, MT_WHEEL.r, ...side(s, 0.27, 0.35), 6);
}

const MINE_TUB: AnimalVehicleSpec = {
  id: "veh-animal-rail-mine-tub",
  title: "Mine Tub",
  kind: "rail",
  catalog: WAGON_CATALOG,
  palette: PALETTE,
  weight: 0.35,
  maxspeed: 10,
  hitch: [MT_FRAME + 0.2, 0.27, 0],
  body: mineTubBody,
  rolling: [{ nodes: ["wheelset-1", "wheelset-2"], diameter: 2 * MT_WHEEL.r }],
  lod: mineTubLod,
  references: "animal-rail-mine-tub",
};

export const animalRailMineTub = (p?: ParamValues) => buildAnimalVehicle(MINE_TUB, p);
export const animalRailMineTubLod = (p?: ParamValues) => buildAnimalVehicleLod(MINE_TUB, p);

// ---------------------------------------------------------------------------
// 4. the platelayers' trolley

const TR_WHEEL: WheelSpec = { gauge: 1.435, r: 0.27, sides: 18, spokes: 8, axleHalf: 0.86, k: 0.75 };
const TR_AXLE_X = 0.6;
const TR_HALF = 1.08; // the deck's half length
const TR_HW = 0.92;
const TR_DECK = 0.62;

/** One bench, facing +x from the shared back at x 0: slats, iron ends. */
function trolleyBench(m: MeshBuilder): void {
  const y = TR_DECK + 0.42;
  for (let k = 0; k < 3; k++) block(m, "seatWood", 0.06 + k * 0.13, 0.17 + k * 0.13, y - 0.035, y, -0.76, 0.76);
  for (const z of [-0.72, 0, 0.72]) {
    block(m, "oxide", 0.12, 0.16, TR_DECK, y - 0.035, z - 0.02, z + 0.02);
    block(m, "oxide", 0.4, 0.44, TR_DECK, y - 0.035, z - 0.02, z + 0.02);
    block(m, "oxide", 0.04, 0.44, y - 0.08, y - 0.035, z - 0.02, z + 0.02);
  }
  // the foot bar in front of the seat
  m.rod("oxide", [0.66, TR_DECK + 0.08, -0.7], [0.66, TR_DECK + 0.08, 0.7], 0.018, 5);
  for (const z of [-0.7, 0.7]) m.rod("oxide", [0.66, TR_DECK, z], [0.66, TR_DECK + 0.08, z], 0.018, 5);
}

/** One end, drawn at +x: the end beam, the hook, the lifting handles. */
function trolleyEnd(m: MeshBuilder): void {
  block(m, "deckWood", TR_HALF - 0.08, TR_HALF, 0.36, TR_DECK - 0.06, -TR_HW, TR_HW);
  block(m, "iron", TR_HALF, TR_HALF + 0.008, 0.38, TR_DECK - 0.08, -0.3, 0.3);
  drawHook(m, TR_HALF, TR_HALF + 0.14, 0.46, 0.025);
  for (const z of [-0.7, 0.7]) rods(m, "iron", [[TR_HALF, 0.5, z - 0.08], [TR_HALF + 0.16, 0.5, z - 0.08], [TR_HALF + 0.16, 0.5, z + 0.08], [TR_HALF, 0.5, z + 0.08]], 0.016, 5);
}

function trolleyBody(m: MeshBuilder): void {
  const y = axleY(TR_WHEEL);
  m.scope("running gear", () => {
    wheelset(m, "wheelset-1", TR_AXLE_X, TR_WHEEL);
    wheelset(m, "wheelset-2", -TR_AXLE_X, TR_WHEEL);
    m.scope("frame", () => {
      for (const s of [-1, 1]) {
        // the inside frame and its bearings round the axles
        block(m, "oxide", -TR_HALF + 0.08, TR_HALF - 0.08, 0.4, 0.5, ...side(s, 0.52, 0.58));
        for (const x of [-TR_AXLE_X, TR_AXLE_X]) block(m, "oxide", x - 0.08, x + 0.08, y - 0.06, 0.42, ...side(s, 0.5, 0.6));
      }
      for (const x of [-0.95, -0.25, 0.25, 0.95]) block(m, "deckWood", x - 0.04, x + 0.04, 0.5, TR_DECK - 0.06, -TR_HW + 0.02, TR_HW - 0.02);
    });
    m.scope("front end", () => trolleyEnd(m));
    m.scope("rear end", () => m.turned(0, () => trolleyEnd(m)));
    m.scope("brake", () => {
      // the blocks ahead of the front wheels on a beam, the rod up to the lever
      const xb = TR_AXLE_X + TR_WHEEL.r + 0.035;
      for (const s of [-1, 1]) block(m, "iron", xb - 0.03, xb + 0.03, y - 0.09, y + 0.09, ...side(s, 0.68, 0.78));
      m.rod("iron", [xb, y, -0.74], [xb, y, 0.74], 0.018, 5);
      m.rod("iron", [xb, y, 0.62], [0.8, TR_DECK - 0.02, 0.84], 0.014, 4);
    });
  });
  m.scope("deck", () => {
    const n = 6;
    const pw = (2 * TR_HW) / n;
    for (let k = 0; k < n; k++) block(m, k % 2 ? "deckWood" : "plank", -TR_HALF, TR_HALF, TR_DECK - 0.06, TR_DECK, -TR_HW + k * pw + 0.006, -TR_HW + (k + 1) * pw - 0.006);
  });
  m.scope("benches", () => {
    m.scope("front bench", () => trolleyBench(m));
    m.scope("rear bench", () => m.turned(0, () => trolleyBench(m)));
    // the shared back: three slats on posts
    const y = TR_DECK + 0.42;
    for (const h of [0.1, 0.24, 0.38]) block(m, "seatWood", -0.025, 0.025, y + h, y + h + 0.09, -0.76, 0.76);
    for (const z of [-0.72, 0, 0.72]) block(m, "oxide", -0.02, 0.02, TR_DECK, y + 0.5, z - 0.025, z + 0.025);
  });
  m.scope("handbrake", () => {
    // the lever at the front right corner, its toothed quadrant and the knob
    const [px, pz] = [0.82, 0.84];
    m.rod("iron", [px, TR_DECK, pz], [px - 0.16, TR_DECK + 0.78, pz], 0.02, 6);
    m.rod("oxide", [px - 0.16, TR_DECK + 0.78, pz], [px - 0.17, TR_DECK + 0.88, pz], 0.03, 6);
    const q = arcPts(px, TR_DECK, 0.34, 0.5 * Math.PI - 0.5, 0.5 * Math.PI + 0.35, 4).map(([x, yy]) => [x, yy, pz + 0.04] as Vec3);
    rods(m, "iron", q, 0.014, 4);
    for (const p of [q[0]!, q[q.length - 1]!]) m.rod("iron", [p[0], TR_DECK, pz + 0.04], p, 0.012, 4);
    block(m, "iron", px - 0.06, px + 0.06, TR_DECK, TR_DECK + 0.03, pz - 0.04, pz + 0.07);
  });
}

function trolleyLod(m: MeshBuilder): void {
  lodBlock(m, -TR_HALF, TR_HALF, 0.4, TR_DECK, -TR_HW, TR_HW, { side: "deckWood" });
  lodBlock(m, -0.45, 0.45, TR_DECK, TR_DECK + 0.42, -0.76, 0.76, { side: null, end: "oxide", top: "seatWood" });
  lodBlock(m, -0.03, 0.03, TR_DECK + 0.42, TR_DECK + 0.92, -0.76, 0.76, { side: "seatWood" });
  for (const x of [-TR_AXLE_X, TR_AXLE_X]) for (const s of [-1, 1]) lodWheel(m, "wheel", x, TR_WHEEL.r, ...side(s, 0.67, 0.8), 8);
}

const TROLLEY: AnimalVehicleSpec = {
  id: "veh-animal-rail-trolley",
  title: "Platelayers' Trolley",
  kind: "rail",
  catalog: WAGON_CATALOG,
  palette: PALETTE,
  weight: 0.45,
  maxspeed: 20,
  hitch: [TR_HALF + 0.14, 0.46, 0],
  reins: [0.75, TR_DECK + 0.62, 0],
  body: trolleyBody,
  rolling: [{ nodes: ["wheelset-1", "wheelset-2"], diameter: 2 * TR_WHEEL.r }],
  lod: trolleyLod,
  references: "animal-rail-trolley",
};

export const animalRailTrolley = (p?: ParamValues) => buildAnimalVehicle(TROLLEY, p);
export const animalRailTrolleyLod = (p?: ParamValues) => buildAnimalVehicleLod(TROLLEY, p);

/** The animal-drawn rail vehicles. */
export const ANIMAL_RAIL: readonly ProceduralDesign[] = [
  animalVehicleDesign(BUDWEIS_COACH, { build: animalRailBudweisCoach, buildLod: animalRailBudweisCoachLod }),
  animalVehicleDesign(BUDWEIS_WAGON, { build: animalRailBudweisWagon, buildLod: animalRailBudweisWagonLod }),
  animalVehicleDesign(MINE_TUB, { build: animalRailMineTub, buildLod: animalRailMineTubLod }),
  animalVehicleDesign(TROLLEY, { build: animalRailTrolley, buildLod: animalRailTrolleyLod }),
];
