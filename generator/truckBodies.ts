// The world truck kit, part 2 (docs/models/world-trucks.md): the chassis (frame,
// axles, wheels, tanks, guards, fifth wheel and hitch), the bodies (box,
// curtain, reefer, container, tank, tipper, mining dump, flatbed, dropside,
// canvas tilt, logs, mixer, refuse, loader crane, mobile crane boom, car
// carrier, fire, turntable ladder, sweeper, snowplough, low loader, decorated
// box), the trailers behind the truck (semi-trailers on the fifth wheel, drawbar
// trailers and dollies on a hitch, a log truck's pole trailer) and the assembly:
// the `truck` part and one part per trailer hinged in a chain (rig.ts sections),
// the steered wheels as parts of the truck's, a crane's boom or a ladder as a
// part of its own, the rig, and the low detail from the masses the full model
// keeps (lodKit.ts fitLod, the sections kept).

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { steeredWheels } from "./vehicleParts.ts";
import type { SteerAxle, VehicleRig } from "./rig.ts";
import { fitLod, lodBlock, lodPolygon, lodWheel, LOD_GLASS, LOD_PALETTE, type LodPart } from "./lodKit.ts";
import {
  Kit, axleY, caboverCab, freeOf, fender, hoodCab, miningCab, ord, sweepR, tyre, tyreSpans, tyreWidth, truckPalette, vanCab,
  type AxleSpec, type BodySpec, type CabPlace, type CabResult, type ChassisSpec, type TrailerSpec, type TruckSpec,
} from "./truckKit.ts";

// ---------------------------------------------------------------------------
// the layout: where every unit of the chain stands

/** A unit of the chain: the truck, or a trailer. */
export interface Unit {
  /** x of the unit's u = 0 (the truck's nose, a trailer's front). */
  ox: number;
  /** Its rear end's x. */
  rear: number;
  node: string;
  /** Its hinge with the unit ahead (the truck's: the origin). */
  pivot: Vec3;
  trailer?: TrailerSpec;
}

/** The node of section i: the truck, the trailer, trailer2, ... */
export const sectionNode = (i: number): string => (i === 0 ? "truck" : i === 1 ? "trailer" : `trailer${i}`);

/** The units front to back, the truck's nose at half the overall length (so the model is centred on x = 0). */
export function layoutTruck(s: TruckSpec): Unit[] {
  const units: Unit[] = [];
  const truckRear = -Math.max(s.chassis.length, s.body.kind === "none" ? 0 : s.body.to);
  units.push({ ox: 0, rear: truckRear, node: "truck", pivot: [0, 0, 0] });
  (s.trailers ?? []).forEach((t, i) => {
    const prev = units[units.length - 1]!;
    let pivot: Vec3;
    let ox: number;
    if (t.kind === "semi") {
      const f = s.chassis.fifth;
      if (!f || i > 0) throw new Error("a semi-trailer needs the tractor's fifth wheel ahead of it");
      pivot = [-f.at, f.y, 0];
      ox = pivot[0] + t.pin;
    } else if (t.body.kind === "logs" && i === 0) {
      // a pole trailer: hinged at the truck's log bunk, the logs reaching 0.9 m ahead of it
      pivot = [-t.pin, t.body.floor, 0];
      ox = pivot[0] + 0.9;
    } else {
      const y = i === 0 ? s.chassis.hitch : (s.trailers![i - 1]!.hitch);
      if (y === undefined) throw new Error("a drawbar trailer needs a hitch on the unit ahead");
      pivot = [prev.rear - 0.25, y, 0];
      ox = pivot[0] - t.pin;
    }
    units.push({ ox, rear: ox - t.length, node: sectionNode(i + 1), pivot, trailer: t });
  });
  const front = 0;
  const back = Math.min(...units.map((u) => u.rear));
  const shift = (front - back) / 2;
  return units.map((u) => ({ ...u, ox: u.ox + shift, rear: u.rear + shift, pivot: [u.pivot[0] + (u.node === "truck" ? 0 : shift), u.pivot[1], u.pivot[2]] as Vec3 }));
}

// ---------------------------------------------------------------------------
// the running gear

/** The outer tyre faces' half track of a truck. */
const trackOf = (s: TruckSpec): number => s.chassis.track ?? Math.min(s.cab.width / 2 - 0.02, 1.27);

interface Gear { r: number; w: number; zo: number; style: ChassisSpec["wheels"] }

/** The x ranges, by the unit's axles, inside which nothing but the wheel may stand low at the sides (a steered tyre's sweep). */
function wheelZones(axles: readonly AxleSpec[], ox: number, g: Gear): Array<[number, number]> {
  const R = sweepR(g.r, g.w);
  return axles.map((a) => [ox - a.at - R, ox - a.at + R]);
}



/** An axle's beam (and a drive axle's differential) and its non-steered tyres, both sides; returns the outer faces. */
function axleSet(k: Kit, a: AxleSpec, x: number, g: Gear, steered: boolean): void {
  const ay = axleY(g.r, g.style === "lite" ? 12 : 16);
  const zIn = g.zo - g.w * (a.dual ? 2 : 1);
  k.cylZ("chassis", x, ay, -zIn - 0.02, zIn + 0.02, 0.065, 8);
  if (a.drive) k.m.prism("chassis", ngon(8, 0.2, Math.PI / 8, x, 0), ay - 0.2, ay + 0.2);
  for (const s of [-1, 1]) k.wheels.push({ x, r: g.r, z: s * (g.zo + 0.005), sec: k.sec });
  if (steered) return;
  for (const s of [-1, 1]) tyreSpans(g.zo, g.w, !!a.dual).forEach(([z0, z1], i) => tyre(k, x, g.r, ...ord(s * z0, s * z1), i === 0 ? s : null, g.style));
}

/** Mudguards over a non-steered axle's tyres: flat blades `y` above the road. */
function mudguards(k: Kit, x: number, g: Gear, dual: boolean, y: number): void {
  const zi = g.zo - g.w * (dual ? 2 : 1) - 0.05;
  k.pair("trim", x - g.r - 0.12, x + g.r + 0.12, y, y + 0.035, zi, g.zo + 0.04);
}

/** The tail lamps and the rear underrun bar at a unit's rear x. */
function rearEnd(k: Kit, x: number, hw: number, y = 0.5): void {
  k.mass("chassis", x, x + 0.14, y - 0.12, y + 0.06, -hw + 0.05, hw - 0.05, 30);
  for (const s of [-1, 1]) {
    // the lamp cluster: the tail lamp inboard, the indicator outboard, each inside the housing
    const [a, b] = ord(s * (hw - 0.08), s * (hw - 0.4));
    k.blk("trim", x - 0.02, x + 0.1, y + 0.06, y + 0.24, a, b);
    const zi = s > 0 ? a : b;
    const zo = s > 0 ? b : a;
    k.endPanel("lampTail", -1, x - 0.02, ...ord(zi + s * 0.015, zo - s * 0.12), y + 0.09, y + 0.21);
    k.endPanel("lampAmber", -1, x - 0.02, ...ord(zo - s * 0.1, zo - s * 0.015), y + 0.1, y + 0.2, 0.016);
  }
  k.endPanel("plate", -1, x, -0.26, 0.26, y - 0.1, y + 0.02, 0.012);
}

/** Side guards between x0 and x1 (the zones aside), two rails. */
function sideGuards(k: Kit, x0: number, x1: number, hw: number, zones: ReadonlyArray<[number, number]>): void {
  for (const [a, b] of freeOf(x0, x1, zones)) for (const y of [0.47, 0.77]) k.pair("steel", a + 0.05, b - 0.05, y, y + 0.08, hw - 0.12, hw - 0.08);
}

/**
 * The truck's chassis: frame rails, axles and the non-steered wheels, mudguards,
 * fuel tanks, side guards, a tractor's fifth wheel, a rigid's hitch, the rear end
 * (where nothing follows on it).
 */
function chassis(k: Kit, s: TruckSpec, ox: number, cab: CabResult, g: Gear, rear: number): void {
  const c = s.chassis;
  const R = sweepR(g.r, g.w);
  const zcIn = g.zo - g.w / 2;
  const rail = Math.min(0.44, zcIn - R - 0.03);
  const front = ox - c.axles[0]!.at + R + 0.05;
  const xr = ox - c.length;
  const van = s.cab.kind === "van";
  if (!van) {
    k.pair("chassis", xr + 0.03, Math.min(front, cab.front - 0.3), c.frame - 0.28, c.frame, rail - 0.09, rail);
    k.keep("chassis", xr, cab.back, c.frame - 0.28, c.frame, -rail, rail, 22);
    // the engine and gearbox between the rails, under the cab
    k.blk("hub", cab.back - 0.6, Math.min(front, cab.front - 0.4), c.frame - 0.55, c.frame - 0.1, -rail + 0.1, rail - 0.1);
  }
  for (const a of c.axles) axleSet(k, a, ox - a.at, g, !!a.steer);
  const zones = wheelZones(c.axles, ox, g);
  // mudguards over the rear axles, below whatever rides over them
  const over = s.body.kind === "none" || s.body.kind === "van" ? 9 : s.body.floor;
  const fifthY = c.fifth?.y ?? 9;
  const guardY = axleY(g.r) + g.r + 0.05;
  const R2 = sweepR(g.r, g.w);
  for (const a of c.axles) {
    const x = ox - a.at;
    if (!a.steer) {
      if (guardY + 0.05 < Math.min(over, fifthY) - 0.01) mudguards(k, x, g, !!a.dual, guardY);
    } else if (a !== c.axles[0] && x < cab.back) {
      // a second steered axle behind the cab: its own arched mudguards, clear of its tyres' sweep and the wheels' ahead
      const ahead = c.axles[c.axles.indexOf(a) - 1]!;
      const gap = a.at - ahead.at - R2 - 0.04;
      const a0 = gap >= R2 + 0.04 ? 20 : Math.max(20, (Math.acos(Math.max(-1, Math.min(1, gap / (R2 + 0.04)))) * 180) / Math.PI);
      for (const sd of [-1, 1]) fender(k, "trim", x, axleY(g.r), R2, R2 + 0.04, a0, 160, ...ord(sd * (g.zo - g.w - 0.06), sd * (g.zo + 0.04)));
    }
  }
  // fuel tanks and the battery box behind the cab's steps, clear of every wheel
  const lastAxle = ox - c.axles[c.axles.length - 1]!.at;
  let tankStart = 1e9;
  if (c.tanks !== "none") {
    const free = freeOf(lastAxle, cab.steps - 0.04, zones).filter(([a, b]) => b - a > 0.6).sort((a, b) => b[1] - a[1]);
    const run = free[0];
    if (run) {
      const [a, b] = [Math.max(run[0] + 0.05, run[1] - 1.65), run[1] - 0.05];
      tankStart = a;
      const zi = rail + 0.06;
      const zo = Math.min(g.zo - 0.1, cab.hw - 0.1);
      const top = Math.min(c.frame + 0.02, fifthY - 0.06, (c.fifth ? fifthY : 9) - 0.06);
      if (c.tanks === "round") {
        const r = Math.min(0.33, (zo - zi) / 2, (top - 0.4) / 2);
        for (const sd of [-1, 1]) k.cylX("chrome", a, b, top - r, sd * (zo - r), r, 12);
      } else {
        k.pair("alloy", a, b, Math.max(0.42, top - 0.6), top, zi, zo);
        k.pair("trim", b - 0.45, b - 0.05, Math.max(0.42, top - 0.6) - 0.02, top - 0.05, zi + 0.02, zo + 0.012);
      }
    }
  }
  if (c.guards) sideGuards(k, lastAxle + 0.6, Math.min(cab.back, cab.steps, tankStart) - 0.1, g.zo, zones);
  if (c.fifth) {
    const x = ox - c.fifth.at;
    k.blk("chassis", x - 0.75, x + 0.55, c.frame - 0.01, c.fifth.y - 0.11, -0.55, 0.55);
    k.blk("steel", x - 0.6, x + 0.6, c.fifth.y - 0.11, c.fifth.y, -0.6, 0.6);
  }
  if (c.hitch !== undefined) {
    // the coupling jaw behind the frame's end
    k.blk("chassis", xr - 0.2, xr + 0.05, c.hitch - 0.12, c.hitch + 0.12, -0.18, 0.18);
  }
  if (rear < 0) return;
  if (van && cab.back <= xr + 0.3) {
    // a van's tail: the lamps on its rear wall, the bumper under them
    const hw = cab.hw;
    for (const sd of [-1, 1]) {
      k.endPanel("lampTail", -1, cab.back, ...ord(sd * (hw - 0.22), sd * (hw - 0.06)), s.cab.floor + 0.45, s.cab.floor + 0.62);
      k.endPanel("lampAmber", -1, cab.back, ...ord(sd * (hw - 0.22), sd * (hw - 0.06)), s.cab.floor + 0.64, s.cab.floor + 0.72);
    }
    k.blk("bumper", cab.back - 0.08, cab.back + 0.1, s.cab.floor + 0.02, s.cab.floor + 0.2, -hw + 0.03, hw - 0.03);
    k.endPanel("plate", -1, cab.back - 0.08, -0.26, 0.26, s.cab.floor + 0.22, s.cab.floor + 0.34, 0.012);
    return;
  }
  rearEnd(k, xr, Math.min(g.zo, 1.25), Math.max(0.45, Math.min(0.55, c.frame - 0.35)));
}

// ---------------------------------------------------------------------------
// the bodies

/** A body's place: its unit's x frame, the frame's top under it, what lies ahead of it. */
interface BodyPlace {
  ox: number;
  frame: number;
  cabBack: number;
  cabTop: number;
  nose: number;
  g: Gear;
  /** The lowest a body may reach: a semi-trailer's underframe bottom. */
  under?: number;
}

/** What a body leaves for the assembly: a part drawn after the steered wheels (a crane's boom, a ladder). */
interface Deferred { node: string; pivot: Vec3; draw: () => void }

const bx = (b: BodySpec, p: BodyPlace): [number, number] => [p.ox - b.to, p.ox - b.from];

/** The subframe between the frame and the body's floor. */
function subframe(k: Kit, x0: number, x1: number, y0: number, y1: number, half = 0.46): void {
  if (y1 - y0 > 0.02) k.blk("chassis", x0 + 0.05, x1 - 0.05, y0 - 0.02, y1 - 0.004, -half, half);
}

/** A closed box body with its rails and corner posts; `posts` adds a curtain's or a container's ribs. */
function boxBody(k: Kit, b: BodySpec, p: BodyPlace, mat: string, ribs: number): void {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.27;
  subframe(k, x0, x1, p.frame, b.floor);
  k.mass(mat, x0, x1, b.floor, b.top, -hw, hw);
  for (const s of [-1, 1]) {
    // the rails and corner posts, kept a few millimetres inside the box's edges
    k.sidePanel("body2", s, hw, x0 + 0.005, x1 - 0.005, b.floor + 0.005, b.floor + 0.14, 0.012);
    k.sidePanel("body2", s, hw, x0 + 0.005, x1 - 0.005, b.top - 0.1, b.top - 0.005, 0.012);
    for (const [a, c] of [[x0 + 0.005, x0 + 0.09], [x1 - 0.09, x1 - 0.005]] as const) k.sidePanel("body2", s, hw, a, c, b.floor + 0.14, b.top - 0.1, 0.014);
    if (ribs > 0) {
      const n = Math.max(1, Math.round((x1 - x0) / ribs));
      for (let i = 1; i < n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        k.sidePanel(mat === "canvas" ? "body2" : "seam", s, hw, x - 0.025, x + 0.025, b.floor + 0.14, b.top - 0.1, 0.008, 0.02);
      }
    }
  }
  // the rear doors: their seam and the locking bars
  k.endPanel("seam", -1, x0, -0.012, 0.012, b.floor + 0.05, b.top - 0.05, 0.01, 0.02);
  for (const z of [-0.7, -0.35, 0.35, 0.7]) k.endPanel("body2", -1, x0, z - 0.02, z + 0.02, b.floor + 0.1, b.top - 0.1, 0.014, 0.02);
}

/** A tank lying on its saddles: round or elliptical, dished heads, bands, a walkway and manholes. */
function tankBody(k: Kit, b: BodySpec, p: BodyPlace): void {
  const [x0, x1] = bx(b, p);
  const ry = (b.top - b.floor) / 2;
  const rz = b.round === false ? Math.min(b.hw ?? 1.25, ry * 1.45) : Math.min(ry, b.hw ?? 1.25);
  const yc = b.floor + ry;
  const ring = (f: number): Ring => ngon(16, 1, Math.PI / 16).map(([a, c]) => [a * rz * f, yc + c * ry * f]);
  const head = Math.min(0.35, ry * 0.4);
  k.m.sweep("body", "x", ring(1), x0 + head, ring(1), x1 - head, false);
  k.m.sweep("body", "x", ring(0.72), x0, ring(1), x0 + head);
  k.m.sweep("body", "x", ring(1), x1 - head, ring(0.72), x1);
  k.keep("body", x0, x1, b.floor, b.top, -rz, rz);
  const n = Math.max(2, Math.round((x1 - x0) / 2.2));
  for (let i = 1; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    k.m.sweep("body2", "x", ring(1.012), x - 0.05, ring(1.012), x + 0.05);
  }
  // the walkway, its rail posts and the manholes
  k.blk("steel", x0 + 0.5, x1 - 0.5, b.top - 0.02, b.top + 0.04, -0.3, 0.3);
  for (let i = 0; i < n; i++) k.cylY("steel", x0 + ((x1 - x0) * (i + 0.5)) / n, 0, b.top - 0.02, b.top + 0.12, 0.25, 8);
  for (const z of [-0.35, 0.35]) k.rod("steel", [x0 + 0.6, b.top + 0.5, z], [x1 - 0.6, b.top + 0.5, z], 0.02, 4);
  // the saddles down to the frame
  for (const x of [x0 + 0.6, x1 - 0.6, (x0 + x1) / 2]) k.blk("chassis", x - 0.15, x + 0.15, p.frame - 0.02, yc - ry * 0.75, -0.5, 0.5);
  subframe(k, x0, x1, p.frame, b.floor + 0.05, 0.45);
}

/** An open bin: the floor, the side walls, the headboard, the tailgate, ribs; gravel if loaded. */
function tipperBody(k: Kit, b: BodySpec, p: BodyPlace): void {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.25;
  subframe(k, x0, x1, p.frame, b.floor);
  k.blk("body", x0, x1, b.floor, b.floor + 0.08, -hw + 0.05, hw - 0.05);
  k.pair("body", x0, x1, b.floor, b.top, hw - 0.06, hw);
  k.blk("body", x1 - 0.08, x1, b.floor, b.top + 0.25, -hw, hw);
  k.blk("body", x0, x0 + 0.08, b.floor, b.top - 0.02, -hw + 0.06, hw - 0.06);
  k.keep("body", x0, x1, b.floor, b.top, -hw, hw);
  const n = Math.max(2, Math.round((x1 - x0) / 0.9));
  for (const s of [-1, 1]) for (let i = 1; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    k.sidePanel("body2", s, hw, x - 0.04, x + 0.04, b.floor, b.top - 0.02, 0.02, 0.03);
  }
  for (const s of [-1, 1]) k.sidePanel("body2", s, hw, x0, x1, b.top - 0.08, b.top, 0.03, 0.03);
  if (b.load === "gravel") {
    k.blk("load", x0 + 0.1, x1 - 0.1, b.floor + 0.05, b.top - 0.18, -hw + 0.08, hw - 0.08);
    k.slab("load", [[x0 + 0.4, b.top - 0.18, -hw + 0.3], [x1 - 0.4, b.top - 0.18, -hw + 0.3], [x1 - 0.8, b.top - 0.05, -0.4], [x0 + 0.8, b.top - 0.05, -0.4]], [0, -0.05, 0]);
    k.slab("load", [[x0 + 0.4, b.top - 0.18, hw - 0.3], [x1 - 0.4, b.top - 0.18, hw - 0.3], [x1 - 0.8, b.top - 0.05, 0.4], [x0 + 0.8, b.top - 0.05, 0.4]], [0, -0.05, 0]);
    k.blk("load", x0 + 0.8, x1 - 0.8, b.top - 0.18, b.top - 0.05, -0.4, 0.4);
  }
  // the hydraulic ram ahead of the bin
  k.cylY("steel", x1 + 0.12, 0, p.frame - 0.05, b.floor + 0.6, 0.09, 8);
}

/** A mining truck's dump body: sloped floor, side walls, front wall and the canopy over the cab. */
function dumpBody(k: Kit, b: BodySpec, p: BodyPlace): void {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 3.5;
  const f = b.floor;
  const rise = Math.min(1.2, (b.top - f) * 0.35);
  const floorP: Ring = [[x0, f], [x1, f + rise], [x1, f + rise + 0.25], [x0, f + 0.25]];
  k.m.sweep("body", "z", floorP, -hw + 0.15, floorP, hw - 0.15);
  const wall: Ring = [[x0 - 0.2, f + 0.2], [x1, f + rise], [x1, b.top], [x0 + 1.2, b.top]];
  for (const s of [-1, 1]) {
    const [z0, z1] = ord(s * (hw - 0.18), s * hw);
    k.m.sweep("body", "z", wall, z0, wall, z1);
  }
  k.blk("body", x1 - 0.3, x1, f + rise, b.top + 0.4, -hw, hw);
  // the canopy over the cab, to the nose
  const cx1 = p.nose - 0.15;
  k.mass("body", x1 - 0.05, cx1, b.top + 0.1, b.top + 0.45, -hw, hw);
  for (const z of [-hw + 0.4, -hw / 3, hw / 3, hw - 0.4]) k.blk("body2", x1, cx1 - 0.2, b.top - 0.15, b.top + 0.11, z - 0.12, z + 0.12);
  k.keep("body", x0, x1, f, b.top, -hw, hw);
  for (const s of [-1, 1]) for (let i = 1; i < 5; i++) {
    const x = x0 + 1.2 + ((x1 - x0 - 1.2) * i) / 5;
    k.blk("body2", x - 0.15, x + 0.15, f + 0.4 + (rise * (x - x0)) / (x1 - x0), b.top - 0.05, ...ord(s * (hw - 0.02), s * (hw + 0.12)));
  }
  if (b.load === "gravel") {
    const load: Ring = [[x0 + 0.5, f + 0.3], [x1 - 0.4, f + rise + 0.2], [x1 - 1.5, b.top - 0.1], [x0 + 2.5, b.top - 0.5]];
    k.m.sweep("load", "z", load, -hw + 0.25, load, hw - 0.25);
  }
}

/** A flat deck with a headboard; dropside boards; a canvas tilt over them. */
function deckBody(k: Kit, b: BodySpec, p: BodyPlace, sides: number, tilt: boolean): void {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.25;
  const deckY = Math.max(b.floor - 0.14, (p.under ?? -9) + 0.004);
  subframe(k, x0, x1, p.frame, deckY);
  k.mass("deck", x0, x1, deckY, b.floor, -hw, hw);
  const board = sides > 0 ? (tilt ? "body" : "body") : "body2";
  if (sides > 0) {
    k.pair(board, x0, x1 - 0.08, b.floor, b.floor + sides, hw - 0.04, hw);
    k.blk(board, x0, x0 + 0.04, b.floor, b.floor + sides, -hw + 0.04, hw - 0.04);
    for (const s of [-1, 1]) {
      const n = Math.max(1, Math.round((x1 - x0) / 1.4));
      for (let i = 1; i < n; i++) k.sidePanel("seam", s, hw, x0 + ((x1 - x0) * i) / n - 0.015, x0 + ((x1 - x0) * i) / n + 0.015, b.floor + 0.02, b.floor + sides - 0.02, 0.006, 0.02);
    }
  } else {
    // stake pockets along the deck's edge
    for (const s of [-1, 1]) for (let i = 0; i <= Math.round((x1 - x0) / 1.2); i++) {
      const x = x0 + 0.1 + ((x1 - x0 - 0.2) * i) / Math.max(1, Math.round((x1 - x0) / 1.2));
      k.sidePanel("chassis", s, hw, x - 0.05, x + 0.05, deckY + 0.01, b.floor - 0.02, 0.012, 0.03);
    }
  }
  const head = tilt ? b.floor + sides : Math.min(b.top, b.floor + 1.1);
  k.blk("body2", x1 - 0.08, x1 + 0.006, b.floor - 0.004, Math.max(head, b.floor + sides + 0.05), -hw - 0.012, hw + 0.012);
  if (tilt) {
    const y0 = b.floor + sides - 0.05;
    const h = hw - 0.02;
    const sec: Ring = [[-h, y0], [h, y0], [h, b.top - 0.16], [h - 0.18, b.top], [-h + 0.18, b.top], [-h, b.top - 0.16]];
    k.m.sweep("canvas", "x", sec, x0 + 0.02, sec, x1 - 0.02);
    k.keep("canvas", x0, x1, b.floor, b.top, -hw, hw);
    const n = Math.max(2, Math.round((x1 - x0) / 1.1));
    for (const s of [-1, 1]) for (let i = 1; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      k.sidePanel("seam", s, h, x - 0.02, x + 0.02, y0 + 0.06, b.top - 0.2, 0.006, 0.02);
    }
  }
  if (b.load === "machine") machine(k, x0 + 0.4, x1 - 0.4, b.floor, hw - 0.1);
}

/** A tracked excavator as a load: tracks, the upper body, the cab, the boom folded forward. */
function machine(k: Kit, x0: number, x1: number, y: number, hw: number): void {
  const len = Math.min(5.2, x1 - x0);
  const a = (x0 + x1) / 2 - len / 2;
  const w = Math.min(hw, 1.35);
  k.pair("trim", a, a + len, y, y + 0.75, w - 0.55, w);
  k.blk("trim", a + 0.4, a + len - 0.4, y + 0.25, y + 0.7, -w + 0.55, w - 0.55);
  k.mass("load", a + 0.3, a + len - 0.8, y + 0.75, y + 1.75, -w + 0.05, w - 0.05, 18);
  k.blk("load", a + len - 2.1, a + len - 0.9, y + 1.75, y + 2.75, -w + 0.1, -0.1);
  k.blk("glass", a + len - 0.91, a + len - 0.89, y + 1.95, y + 2.6, -w + 0.18, -0.18);
  // the boom raised and folded forward over the tracks
  k.slab("load", [[a + len - 1.0, y + 1.6, 0.05], [a + len - 0.6, y + 1.5, 0.05], [a + len + 0.2, y + 2.7, 0.05], [a + len - 0.2, y + 2.85, 0.05]], [0, 0, 0.4]);
  k.slab("load", [[a + len - 0.2, y + 2.85, 0.08], [a + len + 0.2, y + 2.7, 0.08], [a + len + 0.5, y + 0.9, 0.08], [a + len + 0.2, y + 0.9, 0.08]], [0, 0, 0.34]);
  k.blk("chassis", a + len + 0.05, a + len + 0.75, y + 0.02, y + 0.7, -0.5, 0.5);
}

/** Logs on bunks: rows of logs with their pale cut ends, the stakes. */
function logsBody(k: Kit, b: BodySpec, p: BodyPlace, bunks: readonly number[]): void {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.2;
  const r = 0.2;
  const rows = Math.max(1, Math.round((b.top - b.floor) / (2 * r * 0.9)));
  for (let row = 0; row < rows; row++) {
    const n = Math.max(2, Math.floor((2 * hw - (row % 2) * r) / (2 * r)) - (row % 2));
    const w = n * 2 * r;
    for (let i = 0; i < n; i++) {
      const z = -w / 2 + r + i * 2 * r;
      const y = b.floor + r + row * 2 * r * 0.88;
      const xa = x0 + ((i + row) % 3) * 0.12;
      const xb = x1 - ((i * 2 + row) % 3) * 0.1;
      k.cylX("load", xa, xb, y, z, r * 0.97, 8);
      k.slab("logEnd", ngon(8, r * 0.8, Math.PI / 8, z, y).map(([zz, yy]): Vec3 => [xa - 0.005, yy, zz]), [0.02, 0, 0]);
      k.slab("logEnd", ngon(8, r * 0.8, Math.PI / 8, z, y).map(([zz, yy]): Vec3 => [xb + 0.005, yy, zz]), [-0.02, 0, 0]);
    }
  }
  k.keep("load", x0, x1, b.floor, b.top, -hw, hw);
  for (const x of bunks) {
    k.blk("chassis", x - 0.12, x + 0.12, b.floor - 0.2, b.floor - 0.004, -hw - 0.05, hw + 0.05);
    k.pair("steel", x - 0.06, x + 0.06, b.floor - 0.2, b.top + 0.1, hw + 0.06, hw + 0.14);
  }
}

/** A double cone about the axis from a to b: rings of radii `prof` (t along the axis, r). */
function lathe(k: Kit, mat: string, a: Vec3, b: Vec3, prof: ReadonlyArray<readonly [number, number]>, n = 16): void {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(...d);
  const u: Vec3 = [d[0] / len, d[1] / len, d[2] / len];
  const side: Vec3 = [0, 0, 1];
  const third: Vec3 = [u[1] * side[2] - u[2] * side[1], u[2] * side[0] - u[0] * side[2], u[0] * side[1] - u[1] * side[0]];
  const ring = (t: number, r: number): Vec3[] => Array.from({ length: n }, (_, i) => {
    const f = (i / n) * Math.PI * 2;
    const c = Math.cos(f) * r;
    const s = Math.sin(f) * r;
    return [a[0] + d[0] * t + c * side[0] + s * third[0], a[1] + d[1] * t + c * side[1] + s * third[1], a[2] + d[2] * t + c * side[2] + s * third[2]];
  });
  const rings = prof.map(([t, r]) => ring(t, r));
  for (let j = 0; j + 1 < rings.length; j++) {
    for (let i = 0; i < n; i++) {
      const i1 = (i + 1) % n;
      k.m.quad(mat, rings[j]![i]!, rings[j]![i1]!, rings[j + 1]![i1]!, rings[j + 1]![i]!);
    }
  }
  const first = rings[0]!;
  const last = rings[rings.length - 1]!;
  for (let i = 1; i + 1 < n; i++) {
    k.m.tri(mat, first[0]!, first[i + 1]!, first[i]!);
    k.m.tri(mat, last[0]!, last[i]!, last[i + 1]!);
  }
}

/** A mixer: the tilted drum on its pedestals, its stripe, the water tank, the hopper and the chute. */
function mixerBody(k: Kit, b: BodySpec, p: BodyPlace): void {
  const [x0, x1] = bx(b, p);
  const R = (b.top - b.floor) / 2 - 0.05;
  const front: Vec3 = [x1 - 0.1, b.floor + R * 0.95, 0];
  const back: Vec3 = [x0 + 0.5, b.floor + R * 1.35, 0];
  lathe(k, "body", front, back, [[0, R * 0.42], [0.18, R * 0.92], [0.42, R], [0.62, R * 0.92], [0.92, R * 0.45], [1, R * 0.38]]);
  lathe(k, "cab2", [front[0] + (back[0] - front[0]) * 0.42 - 0.12, front[1] + (back[1] - front[1]) * 0.42, 0], [front[0] + (back[0] - front[0]) * 0.42 + 0.12, front[1] + (back[1] - front[1]) * 0.42, 0], [[0, R + 0.015], [1, R + 0.015]]);
  k.keep("body", x0, x1, b.floor, b.top, -R, R);
  subframe(k, x0, x1, p.frame, b.floor);
  k.blk("body2", x1 - 0.35, x1, b.floor, front[1] + 0.1, -0.5, 0.5);
  k.blk("body2", x0, x0 + 0.5, b.floor, back[1] - 0.1, -0.6, 0.6);
  k.cylX("body2", x1 - 0.05, x1 + 0.5, b.floor + 0.9, 0, 0.32, 12);
  // the hopper and the chute at the rear
  const hy = back[1] + R * 0.35;
  k.m.loft("steel", [[x0 + 0.1, -0.2], [x0 + 0.5, -0.2], [x0 + 0.5, 0.2], [x0 + 0.1, 0.2]].map(([x, z]) => [x!, z!] as [number, number]).reverse(), hy, [[x0 - 0.1, -0.45], [x0 + 0.65, -0.45], [x0 + 0.65, 0.45], [x0 - 0.1, 0.45]].map(([x, z]) => [x!, z!] as [number, number]).reverse(), hy + 0.5);
  k.slab("steel", [[x0 + 0.1, b.floor + 0.5, -0.18], [x0 + 0.1, b.floor + 0.5, 0.18], [x0 - 0.9, b.floor + 0.15, 0.18], [x0 - 0.9, b.floor + 0.15, -0.18]], [0, -0.04, 0]);
  for (const s of [-1, 1]) k.blk("steel", x0 - 0.02, x0 + 0.02, b.floor - 0.2, hy, ...ord(s * 0.53, s * 0.58));
}

/** A refuse body with a rounded top and the rear loader's tailgate behind it. */
function refuseBody(k: Kit, b: BodySpec, p: BodyPlace): void {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.25;
  subframe(k, x0, x1, p.frame, b.floor);
  const sec: Ring = [[-hw, b.floor], [hw, b.floor], [hw, b.top - 0.3], [hw - 0.3, b.top], [-hw + 0.3, b.top], [-hw, b.top - 0.3]];
  k.m.sweep("body", "x", sec, x0 + 0.9, sec, x1);
  k.keep("body", x0, x1, b.floor, b.top, -hw, hw);
  // the tailgate: the hopper reaching back and down
  const t: Ring = [[x0 + 0.95, b.floor - 0.3], [x0 + 0.95, b.top + 0.02], [x0 + 0.1, b.top + 0.02], [x0 - 0.4, b.floor + 0.6], [x0 - 0.35, b.floor - 0.3]];
  k.m.sweep("body2", "z", t, -hw + 0.03, t, hw - 0.03);
  k.keep("body2", x0 - 0.4, x0 + 0.95, b.floor - 0.3, b.top, -hw, hw, 16);
  // the bin lifter and the hazard stripes on the tailgate
  k.blk("steel", x0 - 0.55, x0 - 0.35, b.floor - 0.5, b.floor + 0.1, -0.9, 0.9);
  for (const z of [-0.95, -0.55, 0.55, 0.95]) k.endPanel("reflector", -1, x0 - 0.37, z - 0.06, z + 0.06, b.floor + 0.15, b.floor + 0.55, 0.01, 0.02);
  for (const s of [-1, 1]) k.sidePanel("cab2", s, hw, x0 + 1.0, x1 - 0.1, b.floor + 0.25, b.floor + 0.45, 0.01);
}

/** A loader crane between the cab and the body: its column, booms folded and the stabilisers. */
function loaderCrane(k: Kit, x: number, p: BodyPlace, top: number): void {
  k.blk("body2", x - 0.35, x + 0.35, p.frame - 0.05, p.frame + 0.35, -1.2, 1.2);
  k.cylY("body2", x, 0, p.frame + 0.3, top - 0.25, 0.2, 10);
  k.blk("body2", x - 0.18, x + 0.18, p.frame + 0.6, top, -0.55, -0.22);
  k.blk("body2", x - 0.14, x + 0.14, p.frame + 0.8, top - 0.1, 0.22, 0.55);
  k.blk("chassis", x - 0.25, x + 0.25, top - 0.25, top + 0.05, -0.6, 0.6);
  k.keep("body2", x - 0.35, x + 0.35, p.frame, top, -0.6, 0.6, 14);
}

/** Fire lockers along the body's sides: roller shutters in alloy; a monitor; a roof ladder. */
function fireBody(k: Kit, b: BodySpec, p: BodyPlace, monitor: boolean): void {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.25;
  subframe(k, x0, x1, p.frame, b.floor);
  k.mass("cab", x0, x1, b.floor, b.top, -hw, hw);
  const n = Math.max(2, Math.round((x1 - x0) / 1.3));
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) {
    const a = x0 + 0.12 + ((x1 - x0 - 0.24) * i) / n;
    const c = a + (x1 - x0 - 0.24) / n - 0.08;
    k.sidePanel("body2", s, hw, a, c, b.floor + 0.12, b.top - 0.15, 0.012);
    for (let j = 1; j < 4; j++) {
      const y = b.floor + 0.12 + ((b.top - b.floor - 0.27) * j) / 4;
      k.sidePanel("steel", s, hw, a + 0.04, c - 0.04, y - 0.01, y + 0.01, 0.022, 0.02);
    }
  }
  for (const s of [-1, 1]) k.sidePanel("art", s, hw, x0 + 0.05, x1 - 0.05, b.floor + 0.02, b.floor + 0.1, 0.014);
  if (monitor) {
    k.cylY("steel", x1 - 0.6, 0, b.top - 0.02, b.top + 0.35, 0.2, 10);
    k.rod("steel", [x1 - 0.6, b.top + 0.3, 0], [x1 + 0.6, b.top + 0.45, 0], 0.07, 8);
  } else {
    for (const z of [-0.45, 0.45]) k.rod("alloy", [x0 + 0.3, b.top + 0.12, z], [x1 - 0.3, b.top + 0.12, z], 0.03, 4);
    for (let i = 0; i <= 8; i++) k.rod("alloy", [x0 + 0.3 + ((x1 - x0 - 0.6) * i) / 8, b.top + 0.12, -0.45], [x0 + 0.3 + ((x1 - x0 - 0.6) * i) / 8, b.top + 0.12, 0.45], 0.02, 4);
    for (const x of [x0 + 0.4, x1 - 0.4]) k.blk("chassis", x - 0.05, x + 0.05, b.top - 0.01, b.top + 0.1, -0.5, 0.5);
  }
}

/** A turntable ladder: the base body, the turntable, the ladder set laid forward over the cab (a part of its own). */
function ladderBody(k: Kit, b: BodySpec, p: BodyPlace): Deferred {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.25;
  subframe(k, x0, x1, p.frame, b.floor);
  k.mass("cab", x0, x1, b.floor, b.floor + 0.9, -hw, hw);
  for (const s of [-1, 1]) k.sidePanel("body2", s, hw, x0 + 0.1, x1 - 0.1, b.floor + 0.1, b.floor + 0.8, 0.012);
  const tx = x0 + 1.3;
  k.cylY("steel", tx, 0, b.floor + 0.9, b.floor + 1.15, 0.9, 12);
  k.blk("cab", tx - 0.7, tx + 0.5, b.floor + 1.15, b.floor + 1.6, -0.75, 0.75);
  const py = b.floor + 1.75;
  const pivot: Vec3 = [tx + 0.2, py, 0];
  return {
    node: "ladder", pivot, draw: () => {
      // the ladder set from its foot forward, resting a little above the cab
      const end = p.nose + 0.3;
      const y1 = Math.max(py, p.cabTop + 0.25);
      for (const z of [-0.42, 0.42]) {
        k.slab("alloy", [[tx - 0.4, py - 0.12, z - 0.06], [end, y1 - 0.12, z - 0.06], [end, y1 + 0.16, z - 0.06], [tx - 0.4, py + 0.16, z - 0.06]], [0, 0, 0.12]);
      }
      for (const z of [-0.3, 0.3]) k.slab("body2", [[tx - 0.3, py + 0.16, z - 0.04], [end - 0.2, y1 + 0.16, z - 0.04], [end - 0.2, y1 + 0.3, z - 0.04], [tx - 0.3, py + 0.3, z - 0.04]], [0, 0, 0.08]);
      const n = Math.round((end - tx) / 0.45);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = tx - 0.35 + (end - tx + 0.2) * t;
        const y = py + (y1 - py) * t + 0.02;
        k.rod("steel", [x, y, -0.37], [x, y, 0.37], 0.025, 4);
      }
      k.keep("alloy", tx - 0.4, end, Math.min(py, y1) - 0.12, Math.max(py, y1) + 0.3, -0.48, 0.48, 17);
      // the rescue cage at the tip
      k.blk("steel", end - 0.1, end + 0.6, y1 - 0.5, y1 + 0.25, -0.5, 0.5);
    },
  };
}

/** A mobile crane's superstructure: the turntable, counterweight, operator's cab, outriggers; the boom as a part. */
function boomBody(k: Kit, b: BodySpec, p: BodyPlace): Deferred {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.25;
  // the outrigger boxes at the carrier's ends
  // the outrigger boxes: between the axles and behind the last (clear of the steered wheels' sweep)
  for (const x of [p.ox - 5.1, x0 + 0.3]) k.blk("body2", x - 0.25, x + 0.25, p.frame - 0.35, p.frame + 0.05, -hw + 0.02, hw - 0.02);
  k.blk("chassis", x0, x1, p.frame - 0.02, b.floor - 0.3, -hw + 0.1, hw - 0.1);
  const tx = x0 + (x1 - x0) * 0.45;
  k.cylY("steel", tx, 0, b.floor - 0.32, b.floor, 1.0, 14);
  k.mass("body", x0 + 0.1, tx + 1.2, b.floor, b.floor + 0.6, -hw + 0.05, hw - 0.05);
  k.mass("body", x0 - 0.3, x0 + 1.2, b.floor + 0.6, b.floor + 1.4, -hw + 0.1, hw - 0.1, 15);
  // the operator's cab on the left of the boom
  k.mass("body", tx + 0.3, tx + 1.9, b.floor + 0.6, b.floor + 2.0, -hw + 0.08, -0.45, 14);
  k.endPanel("glass", 1, tx + 1.9, -hw + 0.15, -0.5, b.floor + 1.0, b.floor + 1.9);
  k.sidePanel("glass", -1, hw - 0.08, tx + 0.5, tx + 1.75, b.floor + 1.0, b.floor + 1.9);
  const pivot: Vec3 = [tx - 0.5, b.floor + 1.5, 0.15];
  return {
    node: "boom", pivot, draw: () => {
      // the telescopic boom, retracted, laid forward over the carrier's cab to its rest
      const end = p.nose + 1.2;
      const y1 = Math.max(b.floor + 1.0, p.cabTop + 0.35);
      const secs = [[0.42, 0.75, "body"], [0.36, 0.62, "body2"], [0.31, 0.52, "body"]] as const;
      const len = end - pivot[0];
      secs.forEach(([half, h, mat], i) => {
        const a = pivot[0] - 0.8 + (len * i) / 3.2;
        const c = end - (secs.length - 1 - i) * 0.05;
        const ya = pivot[1] + ((y1 - pivot[1]) * (a - pivot[0])) / len;
        const yc = y1;
        const z = pivot[2];
        k.slab(mat, [[a, ya - h / 2, z - half], [c, yc - h / 2, z - half], [c, yc + h / 2, z - half], [a, ya + h / 2, z - half]], [0, 0, 2 * half]);
      });
      k.keep("body", pivot[0] - 0.8, end, Math.min(pivot[1], y1) - 0.38, Math.max(pivot[1], y1) + 0.38, pivot[2] - 0.42, pivot[2] + 0.42, 16);
      // the head sheaves and the hook block
      k.cylZ("steel", end + 0.15, y1, pivot[2] - 0.25, pivot[2] + 0.25, 0.32, 10);
      k.blk("art", end + 0.05, end + 0.45, y1 - 1.2, y1 - 0.5, pivot[2] - 0.25, pivot[2] + 0.25);
    },
  };
}

/** A car carrier's two decks on their posts, and the cars on them. */
function carCarrierBody(k: Kit, b: BodySpec, p: BodyPlace): void {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.27;
  const up = (b.floor + b.top) / 2 + 0.2;
  for (const s of [-1, 1]) {
    k.blk("body", x0, x1, b.floor - 0.1, b.floor + 0.08, ...ord(s * (hw - 0.3), s * hw));
    k.blk("body", x0 + 0.1, x1 - 0.1, up - 0.08, up + 0.08, ...ord(s * (hw - 0.25), s * hw));
    k.blk("body", x0 + 0.1, x1 - 0.1, b.top - 0.1, b.top, ...ord(s * (hw - 0.08), s * hw));
    const n = Math.max(3, Math.round((x1 - x0) / 2.2));
    for (let i = 0; i <= n; i++) {
      const x = x0 + 0.15 + ((x1 - x0 - 0.3) * i) / n;
      k.blk("body2", x - 0.06, x + 0.06, b.floor + 0.08, b.top - 0.1, ...ord(s * (hw - 0.1), s * (hw - 0.02)));
    }
  }
  k.blk("body", x1 - 0.15, x1, b.floor + 0.1, b.top - 0.12, -hw + 0.04, hw - 0.04);
  k.keep("body2", x0, x1, b.floor - 0.1, b.top, -hw, hw);
  subframe(k, x0, x1, p.frame, b.floor - 0.1);
  if (b.load !== "cars") return;
  const cars = Math.max(1, Math.floor((x1 - x0 - 0.3) / 4.4));
  const len = (x1 - x0 - 0.3) / cars;
  for (const [deck, y] of [[0, b.floor + 0.08], [1, up + 0.08]] as const) {
    for (let i = 0; i < cars; i++) {
      const a = x0 + 0.2 + i * len;
      const c = a + len - 0.35;
      const colour = (i + deck) % 3 === 0 ? "load" : (i + deck) % 3 === 1 ? "art2" : "art";
      k.blk(colour, a, c, y + 0.15, y + 0.8, -0.85, 0.85);
      k.blk("glass", a + (c - a) * 0.3, c - (c - a) * 0.22, y + 0.8, y + 1.32, -0.75, 0.75);
      k.blk(colour, a + (c - a) * 0.32, c - (c - a) * 0.24, y + 1.32, y + 1.36, -0.72, 0.72);
      for (const x of [a + 0.6, c - 0.6]) for (const sd of [-1, 1]) k.cylZ("rubber", x, y + 0.3, ...ord(sd * 0.62, sd * 0.84), 0.3, 8);
    }
  }
}

/** A street sweeper's box with its brushes and the suction mouth under it. */
function sweeperBody(k: Kit, b: BodySpec, p: BodyPlace): void {
  boxBody(k, b, p, "body", 0);
  const [x0, x1] = bx(b, p);
  const xb = x1 + 0.1;
  for (const s of [-1, 1]) k.m.prism("art", ngon(12, 0.42, 0, xb, s * 0.9), 0.04, 0.12);
  k.blk("steel", x0 + 0.8, x0 + 1.8, 0.12, 0.45, -0.7, 0.7);
}

/** A front snowplough blade on its push frame, ahead of the bumper. */
function plough(k: Kit, nose: number, hw: number, y0: number): void {
  const blade: Ring = [[nose + 0.75, y0 + 0.05], [nose + 0.95, y0 + 0.3], [nose + 0.98, y0 + 0.7], [nose + 0.9, y0 + 1.0], [nose + 0.75, y0 + 1.15]];
  const inner: Ring = blade.map(([x, y]) => [x - 0.06, y]);
  for (let i = 0; i + 1 < blade.length; i++) {
    const q: Ring = [blade[i]!, blade[i + 1]!, inner[i + 1]!, inner[i]!];
    k.m.sweep("art", "z", q, -hw - 0.2, q, hw + 0.2);
  }
  k.keep("art", nose + 0.69, nose + 0.98, y0 + 0.05, y0 + 1.15, -hw - 0.2, hw + 0.2, 20);
  k.blk("chassis", nose - 0.1, nose + 0.72, y0 + 0.4, y0 + 0.6, -0.5, 0.5);
}

/** A low loader's gooseneck, its well deck and the rear deck over the axles, with a load. */
function lowLoaderBody(k: Kit, b: BodySpec, p: BodyPlace, t: TrailerSpec): void {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.27;
  // the neck long enough that the low deck stays outside the tractor's rear wheels' swing
  const neck = t.pin + 2.3;
  const top = p.frame + 0.45;
  k.mass("body", x1 - neck, x1, p.frame + 0.005, top, -1.15, 1.15);
  const lastAxle = p.ox - (t.axles[0]?.at ?? b.to - 2);
  const well1 = x1 - neck - 0.6;
  const well0 = lastAxle + (t.wheel ?? 0.4) + 0.4;
  const wy = 0.62;
  k.slab("body", [[x1 - neck, top, -1.1], [x1 - neck, p.frame + 0.005, -1.1], [well1, wy, -1.1], [well1, wy + 0.3, -1.1]], [0, 0, 2.2]);
  k.mass("body", well0, well1, wy, wy + 0.3, -hw, hw);
  k.mass("body", x0, well0, axleY(t.wheel ?? 0.4) + (t.wheel ?? 0.4) + 0.08, axleY(t.wheel ?? 0.4) + (t.wheel ?? 0.4) + 0.38, -hw, hw);
  k.slab("body", [[well0, wy, -1.2], [well0 + 0.5, wy, -1.2], [well0 + 0.1, axleY(t.wheel ?? 0.4) + (t.wheel ?? 0.4) + 0.38, -1.2], [well0 - 0.2, axleY(t.wheel ?? 0.4) + (t.wheel ?? 0.4) + 0.38, -1.2]], [0, 0, 2.4]);
  for (const s of [-1, 1]) k.sidePanel("art", s, hw, well0 + 0.03, well1 - 0.03, wy + 0.08, wy + 0.22, 0.01);
  if (b.load === "machine") machine(k, well0 + 0.3, well1 - 0.2, wy + 0.3, hw - 0.1);
}

/** Decoration of a painted truck's box: panels in the art colours and a row of lamps. */
function artBox(k: Kit, b: BodySpec, p: BodyPlace): void {
  const [x0, x1] = bx(b, p);
  const hw = b.hw ?? 1.25;
  boxBody(k, b, p, "body", 0);
  const n = Math.max(2, Math.round((x1 - x0) / 1.1));
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) {
    const a = x0 + 0.12 + ((x1 - x0 - 0.24) * i) / n;
    const c = a + (x1 - x0 - 0.24) / n - 0.06;
    k.sidePanel(i % 2 ? "art" : "art2", s, hw, a, c, b.floor + 0.3, b.top - 0.3, 0.018);
    k.sidePanel(i % 2 ? "art2" : "art", s, hw, a + 0.12, c - 0.12, b.floor + 0.55, b.top - 0.55, 0.026, 0.02);
  }
  for (const s of [-1, 1]) for (let i = 0; i < n * 3; i++) {
    const x = x0 + 0.2 + ((x1 - x0 - 0.4) * i) / (n * 3 - 1);
    k.sidePanel("marker", s, hw, x - 0.04, x + 0.04, b.top - 0.22, b.top - 0.14, 0.03, 0.02);
  }
}

/** Draws a body; returns a part to draw after the steered wheels, if it has one. */
function drawBody(k: Kit, b: BodySpec, p: BodyPlace, t?: TrailerSpec): Deferred | null {
  switch (b.kind) {
    case "box": boxBody(k, b, p, "body", 0); break;
    case "curtain": boxBody(k, b, p, "canvas", 1.35); break;
    case "reefer": {
      boxBody(k, b, p, "body", 0);
      const [, x1] = bx(b, p);
      k.blk("body2", x1 - 0.02, x1 + 0.4, b.top - 1.7, b.top - 0.12, -0.95, 0.95);
      k.endPanel("grille", 1, x1 + 0.4, -0.8, 0.8, b.top - 1.5, b.top - 0.35);
      break;
    }
    case "container": {
      const [x0, x1] = bx(b, p);
      subframe(k, x0, x1, p.frame, b.floor - 0.15);
      k.blk("chassis", x0, x1, b.floor - 0.15, b.floor, -1.24, 1.24);
      const c = { ...b, floor: b.floor + 0.01, hw: 1.22 };
      k.mass("body", x0 + 0.05, x1 - 0.05, c.floor, b.top, -1.22, 1.22);
      for (const s of [-1, 1]) {
        const n = Math.round((x1 - x0) / 0.5);
        for (let i = 1; i < n; i++) k.sidePanel("body2", s, 1.22, x0 + ((x1 - x0) * i) / n - 0.06, x0 + ((x1 - x0) * i) / n + 0.06, c.floor + 0.1, b.top - 0.1, 0.01, 0.02);
        for (const x of [x0 + 0.05, x1 - 0.2]) k.sidePanel("steel", s, 1.22, x, x + 0.15, c.floor + 0.006, c.floor + 0.12, 0.016);
      }
      k.endPanel("body2", -1, x0 + 0.05, -1.1, 1.1, c.floor + 0.1, b.top - 0.1, 0.01);
      k.endPanel("seam", -1, x0 + 0.05, -0.012, 0.012, c.floor + 0.12, b.top - 0.12, 0.02, 0.02);
      break;
    }
    case "tank": tankBody(k, b, p); break;
    case "tipper": tipperBody(k, b, p); break;
    case "dump": dumpBody(k, b, p); break;
    case "flatbed": deckBody(k, b, p, 0, false); break;
    case "dropside": deckBody(k, b, p, 0.5, false); break;
    case "canvas": deckBody(k, b, p, 0.5, true); break;
    case "logs": {
      const [x0, x1] = bx(b, p);
      logsBody(k, b, p, [x1 - 0.6, x0 + 1.2]);
      break;
    }
    case "mixer": mixerBody(k, b, p); break;
    case "refuse": refuseBody(k, b, p); break;
    case "crane": {
      const [, x1] = bx(b, p);
      deckBody(k, b, p, 0.45, false);
      loaderCrane(k, x1 + 0.45, p, Math.min(p.cabTop + 0.1, b.floor + 2.2));
      break;
    }
    case "boom": return boomBody(k, b, p);
    case "carCarrier": carCarrierBody(k, b, p); break;
    case "fire": fireBody(k, b, p, b.load === "machine"); break;
    case "ladder": return ladderBody(k, b, p);
    case "van": case "none": break;
    case "lowLoader": lowLoaderBody(k, b, p, t!); break;
    case "sweeper": sweeperBody(k, b, p); break;
    case "plough": deckBody(k, b, p, 0.4, false); plough(k, p.nose, 1.1, 0.25); break;
    case "artBox": artBox(k, b, p); break;
  }
  return null;
}

// ---------------------------------------------------------------------------
// the trailers

/**
 * A trailer, in its own part: its frame and body, landing gear (a semi), a
 * drawbar or a dolly (a drawbar trailer), axles and wheels, mudguards and its
 * rear end.
 */
function drawTrailer(k: Kit, s: TruckSpec, u: Unit, last: boolean): void {
  const t = u.trailer!;
  const r = t.wheel ?? 0.5;
  const g: Gear = { r, w: t.tyre ?? tyreWidth(r), zo: 1.25, style: t.wheels ?? "disc" };
  const b = t.body;
  const x1 = u.ox;
  const x0 = u.rear;
  const pole = t.kind === "drawbar" && b.kind === "logs" && u.node === "trailer";
  const frameTop = t.kind === "semi" ? u.pivot[1] + 0.01 : (t.frame ?? b.floor - 0.12);
  // a semi-trailer's underframe carries its body: the body draws no subframe of its own
  const p: BodyPlace = { ox: u.ox, frame: t.kind === "semi" ? b.floor : frameTop, cabBack: x1, cabTop: 0, nose: x1, g, ...(t.kind === "semi" ? { under: frameTop } : {}) };
  if (b.kind === "carCarrier" && t.kind === "semi") {
    // a car carrier's gooseneck over the fifth wheel; its decks drop behind the tractor
    k.mass("body", x1 - b.from - 0.05, x1, frameTop + 0.005, frameTop + 0.5, -1.1, 1.1);
    k.blk("steel", u.pivot[0] - 0.05, u.pivot[0] + 0.05, u.pivot[1] - 0.07, u.pivot[1] + 0.02, -0.05, 0.05);
  } else if (t.kind === "semi" && b.kind !== "lowLoader") {
    // the underframe from just above the fifth wheel
    k.blk("chassis", x0 + 0.1, x1 - 0.1, frameTop, Math.max(frameTop + 0.06, b.floor - 0.004), -0.5, 0.5);
    k.blk("steel", u.pivot[0] - 0.05, u.pivot[0] + 0.05, u.pivot[1] - 0.07, u.pivot[1] + 0.02, -0.05, 0.05);
  }
  if (pole) {
    // the swivel bunk on the truck, the reach back to the trailer's bunk
    const bunk = t.axles.reduce((a, x) => a + x.at, 0) / t.axles.length;
    logsBody(k, b, p, [u.pivot[0], u.ox - bunk]);
    const yb = b.floor - 0.45;
    k.blk("chassis", u.pivot[0] - 0.85, u.pivot[0] - 0.65, yb, b.floor - 0.004, -0.1, 0.1);
    k.rod("chassis", [u.pivot[0] - 0.75, yb, 0], [u.ox - bunk + 0.3, yb, 0], 0.08, 8);
    k.blk("chassis", u.ox - bunk - 0.4, u.ox - bunk + 0.4, axleY(r) + 0.1, b.floor - 0.2, -0.45, 0.45);
  } else {
    const d = drawBody(k, b, p, t);
    if (d) d.draw();
  }
  if (t.kind === "semi" && b.kind !== "lowLoader") {
    const legs = u.ox - (t.legs ?? t.pin + 2.3);
    for (const sd of [-1, 1]) {
      k.blk("steel", legs - 0.06, legs + 0.06, 0.2, frameTop, ...ord(sd * 0.85, sd * 0.97));
      k.blk("chassis", legs - 0.14, legs + 0.14, 0.12, 0.2, ...ord(sd * 0.8, sd * 1.02));
    }
  }
  if (t.kind === "drawbar" && !pole) {
    // the drawbar (an A-frame) from the hitch's eye back to the trailer's front axle or its dolly
    const front = u.ox - (t.dolly ?? t.axles[0]!.at);
    const y = u.pivot[1];
    for (const sd of [-1, 1]) k.rod("chassis", [u.pivot[0] - 0.08, y, 0], [front + 0.2, axleY(r) + 0.05, sd * 0.55], 0.05, 6);
    k.cylY("steel", u.pivot[0] - 0.07, 0, y - 0.05, y + 0.05, 0.08, 8);
    if (t.dolly !== undefined) {
      // the dolly's frame and its fifth wheel under the semi-trailer's front
      const xd = u.ox - t.dolly;
      k.blk("chassis", xd - 1.0, xd + 0.6, axleY(r) + 0.05, frameTop - 0.15, -0.5, 0.5);
      k.blk("steel", xd - 0.55, xd + 0.55, frameTop - 0.15, frameTop - 0.01, -0.55, 0.55);
    } else {
      k.blk("chassis", front - 0.3, front + 0.3, axleY(r) + 0.05, frameTop - 0.004, -0.5, 0.5);
    }
  }
  for (const a of t.axles) axleSet(k, a, u.ox - a.at, g, false);
  const guardY = axleY(r) + r + 0.05;
  if (guardY + 0.06 < b.floor && b.kind !== "lowLoader" && !pole) for (const a of t.axles) mudguards(k, u.ox - a.at, g, !!a.dual, guardY);
  if (t.kind === "semi" && b.kind !== "lowLoader") sideGuards(k, u.ox - (t.axles[0]?.at ?? 0) + 0.7, u.ox - (t.legs ?? t.pin + 2.3) - 0.3, 1.22, wheelZones(t.axles, u.ox, g));
  if (t.hitch !== undefined) k.blk("chassis", x0 - 0.2, x0 + 0.1, t.hitch - 0.12, t.hitch + 0.12, -0.18, 0.18);
  if (!pole) rearEnd(k, x0, 1.25, Math.max(0.45, Math.min(0.6, (t.frame ?? frameTop) - 0.45)));
  void last;
  void s;
}

// ---------------------------------------------------------------------------
// decoration

/** A dekotora's chrome and lights, a painted truck's crown and panels, on the cab. */
function decorate(k: Kit, s: TruckSpec, cab: CabResult): void {
  if (!s.art) return;
  const hw = cab.hw;
  const top = cab.top;
  const xf = cab.front;
  if (s.art === "dekotora") {
    // chrome visor bars, a row of lamps along the bumper and the roof, the chrome rear bumper
    k.blk("chrome", xf - 0.6, xf + 0.18, top + 0.02, top + 0.32, -hw + 0.05, hw - 0.05);
    for (let i = 0; i < 9; i++) {
      const z = -hw + 0.15 + (i * (2 * hw - 0.3)) / 8;
      k.endPanel(i % 2 ? "marker" : "art2", 1, xf + 0.18, z - 0.06, z + 0.06, top + 0.1, top + 0.24, 0.012);
      k.endPanel(i % 2 ? "art2" : "marker", 1, xf + 0.06, z - 0.06, z + 0.06, 0.28, 0.4, 0.012);
    }
    k.blk("chrome", xf - 0.1, xf + 0.06, 0.24, 0.44, -hw - 0.1, hw + 0.1);
  } else if (s.art === "jingle" || s.art === "painted") {
    // the crown over the cab's roof, at its front edge
    const h = s.art === "jingle" ? 0.9 : 0.35;
    const xr = cab.roof;
    k.slab("art", [[xr - 0.3, top - 0.05, -hw + 0.02], [xr - 0.3, top - 0.05, hw - 0.02], [xr - 0.1, top + h, hw - 0.3], [xr - 0.1, top + h, -hw + 0.3]], [-0.06, 0, 0]);
    k.slab("art2", [[xr - 0.25, top + 0.05, -hw + 0.25], [xr - 0.25, top + 0.05, hw - 0.25], [xr - 0.12, top + h - 0.1, hw - 0.45], [xr - 0.12, top + h - 0.1, -hw + 0.45]], [-0.03, 0, 0]);
    if (s.art === "jingle") for (let i = 0; i < 12; i++) {
      // the chains and pendants under the bumper
      const z = -hw + 0.1 + (i * (2 * hw - 0.2)) / 11;
      k.blk(i % 2 ? "chrome" : "art2", s.cab.kind === "cabover" ? xf + 0.02 : xf + 0.05, s.cab.kind === "cabover" ? xf + 0.06 : xf + 0.09, 0.18, 0.3, z - 0.03, z + 0.03);
    }
  }
}

// ---------------------------------------------------------------------------
// the assembly

export interface BuiltTruck { kit: Kit; units: Unit[]; rig: VehicleRig }

/** Draws a whole truck: its parts, its rig, and what its low detail keeps. */
export function assembleTruck(s: TruckSpec): BuiltTruck {
  const k = new Kit(s);
  const units = layoutTruck(s);
  const c = s.chassis;
  const r = c.wheel;
  const g: Gear = { r, w: c.tyre ?? tyreWidth(r), zo: trackOf(s), style: c.wheels ?? "disc" };
  const truck = units[0]!;
  const ox = truck.ox;
  const front = c.axles.find((a) => a.steer) ?? c.axles[0]!;
  const place: CabPlace = { ox, wheelX: ox - front.at, r, w: g.w, zo: g.zo, frame: c.frame, zones: wheelZones(c.axles, ox, g) };
  let cab!: CabResult;
  let deferred: Deferred | null = null;
  const rearAxle = c.axles[c.axles.length - 1]!;
  const second = c.axles.filter((a) => a.steer)[1];
  if (second) place.avoid = ox - second.at + sweepR(r, g.w) + 0.02;
  k.m.part("truck", [0, 0, 0], () => {
    k.sec = 0;
    cab = s.cab.kind === "cabover" ? caboverCab(k, s.cab, place)
      : s.cab.kind === "van" ? vanCab(k, s.cab, place, s.cab.length > rearAxle.at ? ox - rearAxle.at : null)
        : s.cab.kind === "mining" ? miningCab(k, s.cab, place)
          : hoodCab(k, s.cab, place);
    const hasTrailer = (s.trailers?.length ?? 0) > 0;
    chassis(k, s, ox, cab, g, hasTrailer && s.trailers![0]!.kind === "semi" ? -1 : 0);
    const p: BodyPlace = { ox, frame: c.frame, cabBack: cab.back, cabTop: cab.top, nose: ox, g };
    deferred = drawBody(k, s.body, p);
    if (s.trailers?.[0]?.body.kind === "logs" && s.trailers[0].kind === "drawbar") {
      // the log truck's bolster under the swivel bunk and the headache rack behind the cab
      const t = s.trailers[0];
      const xb = ox - t.pin;
      k.blk("chassis", xb - 0.3, xb + 0.3, c.frame - 0.02, t.body.floor - 0.2 - 0.01, -0.55, 0.55);
      k.blk("steel", cab.back - 0.2, cab.back - 0.1, c.frame, Math.min(cab.top + 0.1, t.body.top + 0.2), -1.15, 1.15);
    }
    decorate(k, s, cab);
  });
  // the steered wheels, axle by axle, as parts of the truck's
  const steered = c.axles.filter((a) => a.steer);
  const fixed = c.axles.filter((a) => !a.steer);
  const turn = fixed.reduce((a, x) => a + x.at, 0) / Math.max(1, fixed.length);
  const axles: SteerAxle[] = steered.map((a, i) => {
    const x = ox - a.at;
    const nodes = steeredWheels(k.m, "truck", x, axleY(r), (sd, z0, z1) => tyre(k, x, r, z0, z1, sd, g.style), [g.zo - g.w, g.zo], [`wheel-front${i ? `-${i + 1}` : ""}-left`, `wheel-front${i ? `-${i + 1}` : ""}-right`]);
    return { nodes, wheelbase: turn - a.at };
  });
  const d = deferred as Deferred | null;
  if (d) k.m.part(d.node, d.pivot, d.draw, "truck");
  units.slice(1).forEach((u, i) => {
    k.m.part(u.node, u.pivot, () => {
      k.sec = i + 1;
      drawTrailer(k, s, u, i + 2 === units.length);
    });
  });
  const rig: VehicleRig = {
    steer: { axles, maxAngleDeg: s.steerDeg ?? 40, track: 2 * (g.zo - g.w / 2) },
    ...(units.length > 1 ? { sections: units.map((u) => ({ node: u.node, pivot: u.pivot })), maxBendDeg: s.bendDeg ?? 70 } : {}),
  };
  k.m.rig = rig;
  return { kit: k, units, rig };
}

/** Builds a truck. */
export function buildTruck(s: TruckSpec): MeshBuilder {
  return assembleTruck(s).kit.m;
}

/**
 * A truck's low detail: the masses the full model keeps, as boxes in their
 * colours, the windscreen and side windows in the LOD glass, the wheels as discs,
 * each in its section (the trailers about their hinges, as the full rig).
 */
export function buildTruckLod(s: TruckSpec, budget: number): MeshBuilder {
  const { kit, units } = assembleTruck(s);
  const palette = { ...truckPalette(s.livery), ...LOD_PALETTE };
  // no lamp materials at low detail
  for (const [name, spec] of Object.entries(palette)) if (spec.lamp) palette[name] = { color: spec.color };
  // the wheels' discs in a plain dark material: a LOD draws no detail materials (tyres, glass, lamps)
  palette.running = { color: "#1a1a1b", roughness: 0.95 };
  const parts: LodPart[] = [];
  kit.boxes.forEach((b, i) => {
    // each box a little inset by its index, so no two share a face plane
    const e = 0.004 * ((i % 7) + 1);
    parts.push({
      section: b.sec, ...(b.rank !== undefined ? { optional: b.rank } : {}),
      draw: (mb) => mb.scope(`mass ${i}`, () => lodBlock(mb, b.x0 + e * 0.5, b.x1 - e * 0.5, b.y0, b.y1 - e * 0.25, b.z0 + e, b.z1 - e, { side: b.mat })),
    });
  });
  for (const p of kit.panes) {
    // the window on the shell's box it belongs to
    const b = kit.boxes[p.box];
    if (!b) continue;
    // an open cab's windscreen stands above its body: it keeps its own heights
    const above = p.face === "front" && p.y[0] >= b.y1 - 0.05;
    const y0 = above ? p.y[0] : Math.max(p.y[0], b.y0 + 0.02);
    const y1 = above ? p.y[1] : Math.min(p.y[1], b.y1 - 0.04);
    if (y1 < y0 + 0.05) continue;
    if (p.face === "front") {
      const x = b.x1;
      parts.push({ section: p.sec, ...(p.rank !== undefined ? { optional: p.rank } : {}), draw: (mb) => mb.scope("windscreen", () => lodPolygon(mb, LOD_GLASS, [[x + 0.01, y0, p.z[0]], [x + 0.01, y0, p.z[1]], [x + 0.01, y1, p.z[1]], [x + 0.01, y1, p.z[0]]], [1, 0, 0])) });
    } else {
      const zs = Math.max(Math.abs(b.z0), Math.abs(b.z1));
      parts.push({
        section: p.sec, optional: p.rank ?? 20,
        draw: (mb) => mb.scope("side windows", () => {
          for (const sd of [-1, 1]) lodPolygon(mb, LOD_GLASS, [[p.x[0], y0, sd * (zs + 0.01)], [p.x[1], y0, sd * (zs + 0.01)], [p.x[1], y1, sd * (zs + 0.01)], [p.x[0], y1, sd * (zs + 0.01)]], [0, 0, sd]);
        }),
      });
    }
  }
  for (const sec of [...new Set(kit.wheels.map((w) => w.sec))]) {
    parts.push({ section: sec, draw: (mb) => mb.scope("wheels", () => { for (const w of kit.wheels) if (w.sec === sec) lodWheel(mb, "running", w.x, w.r, w.z, w.z, 6, "none"); }) });
  }
  return fitLod({
    palette, shells: [], parts,
    ...(units.length > 1 ? { sections: { pivots: units.map((u) => u.pivot), joints: [], maxBendDeg: s.bendDeg ?? 70 } } : {}),
  }, budget);
}

// ---------------------------------------------------------------------------
// the kit's options, for the fleet's covering sample (worldFleet.ts)

/** The axle layout as the trade writes it: wheels x driven wheels (dual wheels counted once). */
export function axleLayout(c: ChassisSpec): string {
  const n = c.axles.length * 2;
  const d = c.axles.filter((a) => a.drive).length * 2;
  return `${n}x${d}`;
}

/** The kit options a truck spec uses: its cab, roof, axles, steered axles, body kinds over its parameters, trailers, decoration. */
export function truckFeatures(specs: readonly TruckSpec[], params: readonly string[]): string[] {
  const s = specs[0]!;
  const c = s.cab;
  const up = c.top - c.screen[1];
  const roof = c.kind !== "cabover" ? c.kind : c.open ? "open" : up > 0.45 ? "high" : c.length > 1.95 ? "sleeper" : "day";
  const out = new Set<string>([
    `cab:${c.kind}`, `roof:${roof}`, `axles:${axleLayout(s.chassis)}`,
    `steered:${s.chassis.axles.filter((a) => a.steer).length}`,
    ...(c.hood ? [`hood:${c.hood.style}`] : []),
    ...(c.sleeper ? ["sleeper"] : []), ...(c.crew ? ["crew-cab"] : []), ...(c.stacks ? ["stacks"] : []),
    ...(c.offset ? ["offset-cab"] : []), ...(s.art ? [`art:${s.art}`] : []),
    `mirrors:${c.mirrors}`, `grille:${c.grille}`, `lamps:${c.lamps}`,
    ...params.map((p) => `param:${p}`),
  ]);
  for (const v of specs) {
    out.add(`body:${v.body.kind}`);
    for (const t of v.trailers ?? []) {
      out.add(`trailer:${t.kind}${t.dolly !== undefined ? "+dolly" : ""}`);
      out.add(`body:${t.body.kind}`);
    }
    out.add(`sections:${1 + (v.trailers?.length ?? 0)}`);
    if (v.chassis.wheels) out.add(`wheels:${v.chassis.wheels}`);
  }
  return [...out].sort();
}

/** The overall length of a spec, every unit of its chain. */
export function truckLength(s: TruckSpec): number {
  const u = layoutTruck(s);
  return u[0]!.ox - Math.min(...u.map((x) => x.rear));
}
