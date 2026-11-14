// The shared builder of the steam locomotives and their tenders transferred
// from vlakosimdb (steamLocos.ts): a locomotive is a spec -- boiler, chimney,
// domes, running board, cab, tanks or bunker, deflectors, draw gear and running
// gear, all in source coordinates measured from the vlakosimdb XML and BMPs --
// drawn as a static "body" part followed by the moving parts of its running gear
// (steamGear.ts) and the "running" animation clip. See
// docs/models/steam-locomotives.md.

import type { MaterialSpec } from "./meshBuilder.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { RunningGear, type RunningGearSpec, type TurningUnit } from "./steamGear.ts";
import { Steam, halfAt, mirrored, type Pt } from "./steamParts.ts";

export interface Window {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** A body of constant section along x: a cab, a tank, a bunker, a tender tank. */
export interface Prism {
  x0: number;
  x1: number;
  /** The right half of the (z, y) section, bottom to top; mirrored to the left. */
  half: Pt[];
  mat?: string;
}

export interface LocoSpec {
  title: string;
  palette: Record<string, MaterialSpec>;
  /** Source x of the front and rear buffer heads; the model is centred between them. */
  heads: [number, number];
  /** `n`: facets round the boiler (20 by default). */
  boiler?: { x0: number; x1: number; y: number; r: number; smokebox: number; bands?: number[]; band?: string; n?: number };
  /** The chimney; `base` is where it starts when there is no boiler (a streamlined casing); `mat` its paint in the low level of detail (the smokebox's by default). */
  chimney?: { x: number; top: number; r: number; base?: number; mat?: string };
  domes?: Array<{ x: number; top: number; r: number; len?: number; mat?: string }>;
  /** Safety valves and whistle on the firebox, brass. */
  valves?: { x: number; top: number };
  /** Running board stations (x, y), half width, valance depth. */
  runningBoard?: { profile: Pt[]; half: number; valance?: number; mat?: string; valanceMat?: string };
  /** Plate frames between the wheels: source x range, top. */
  frame?: { x0: number; x1: number; top: number };
  cab?: Prism & { roofY: number; windows: Window[]; front?: Array<{ z0: number; z1: number; y0: number; y1: number }>; rearWindows?: Array<{ z0: number; z1: number; y0: number; y1: number }> };
  /** Side tanks, bunkers and other prisms. */
  prisms?: Array<Prism & { name: string }>;
  coal?: { x0: number; x1: number; y: number; half: number; rise: number };
  /** Smoke deflector plates: convex (x, y) outlines (a concave plate is several) at |z| = z. */
  deflectors?: { outlines: Pt[][]; z: number };
  /** Streamlined volumes (Steam.volume). */
  volumes?: Array<{ name: string; sec: Pt[]; plan: Pt[]; top?: Pt[]; bottom?: Pt[]; bands: Array<[number, number, string]> }>;
  /** Side frames of bogies and trucks: source x range at height y. */
  bogies?: Array<{ x0: number; x1: number; y: number }>;
  /** The truck frames' paint (the DRG 01's red); "black" by default. */
  bogieFrameMat?: string;
  /** More parts drawn with each truck frame (a tender's pressed side frames and springs), turning with it; none by default. */
  drawOnTruckFrame?: (t: Steam, frame: { x0: number; x1: number; y: number }) => void;
  gear: RunningGearSpec;
  /** Lamps: (x, y, z) feet at each end, the lens looking out. */
  lamps?: { front: Array<[number, number, number]>; rear: Array<[number, number, number]> };
  /** The running number and where it is shown: the cab sides (x, y, face) and the front (x, y). */
  number?: { text: string; side?: [number, number, number]; front?: [number, number] };
  /** Handrails along the boiler: x range, height. */
  handrail?: { x0: number; x1: number; y: number };
  /** Buffer beams: 0 omits an end (a tender's front has a drawbar). */
  beams?: { front?: boolean; rear?: boolean; y0?: number; y1?: number; half?: number; length?: [number, number] };
  /** Design-specific details drawn inside the body part. */
  extras?: (t: Steam) => void;
}

/** Draws a constant-section prism. */
function prism(t: Steam, p: Prism, fallback = "paint"): void {
  t.section(p.mat ?? fallback, p.x0, p.x1, mirrored(p.half));
}

/**
 * The shortest wheelbase (first to last axle, metres) whose running gear is
 * split into turning units: below it a rigid frame stays on the rails on the
 * game's curves (docs/models/steam-locomotives.md, "On curves").
 */
export const UNIT_WHEELBASE = 5.5;

/** A turning unit (steamGear.ts) with the frames it carries: its stretch of the plate frames (source x) and its truck frames (indices into `bogies`). */
export interface LocoUnit extends TurningUnit {
  frame?: [number, number];
  bogies: number[];
}

/**
 * How a locomotive or tender rides a curve: its running gear split into turning
 * units, front first, each a rail bogie the game turns on the track under the
 * body -- every carrying truck (the carrying wheels inside one of the spec's truck
 * frames, or a run of neighbouring carrying axles: a pony truck, a trailing
 * truck), every engine's coupled wheels with its cylinders, motion and the
 * plate frames from its cylinders to its last driver, a tender's trucks. The body
 * then rests on the outermost units, and every wheel stays on the rails. Not
 * real for a rigid locomotive, whose frame carries the coupled wheels, but a
 * long rigid wheelbase laid along a chord leaves its middle wheels beside the
 * rail. A short wheelbase (UNIT_WHEELBASE), or one that would leave fewer than
 * two units, keeps its rigid frame: [].
 */
export function turningUnits(spec: LocoSpec): LocoUnit[] {
  const g = spec.gear;
  const xs = g.wheels.map((w) => w.x);
  if (!xs.length || Math.max(...xs) - Math.min(...xs) < UNIT_WHEELBASE) return [];
  const units: LocoUnit[] = [];
  // the engines, merged where they drive the same wheels
  g.engines.forEach((e, k) => {
    const shared = units.find((u) => e.coupled.some((i) => u.wheels.includes(i)));
    if (shared) {
      shared.engines.push(k);
      for (const i of e.coupled) if (!shared.wheels.includes(i)) shared.wheels.push(i);
    } else if (e.coupled.length) units.push({ wheels: [...e.coupled], engines: [k], bogies: [] });
  });
  const coupled = new Set(units.flatMap((u) => u.wheels));
  let free = g.wheels.map((_, i) => i).filter((i) => !coupled.has(i));
  // the carrying wheels inside a truck frame (one without coupled wheels)
  (spec.bogies ?? []).forEach((b, j) => {
    const inside = (i: number) => g.wheels[i]!.x >= b.x0 - 0.01 && g.wheels[i]!.x <= b.x1 + 0.01;
    if ([...coupled].some(inside)) return;
    const wheels = free.filter(inside);
    if (!wheels.length) return;
    units.push({ wheels, engines: [], bogies: [j] });
    free = free.filter((i) => !wheels.includes(i));
  });
  // the rest: runs of neighbouring carrying axles with no coupled wheel between them
  free.sort((a, b) => g.wheels[a]!.x - g.wheels[b]!.x);
  const between = (a: number, b: number) => [...coupled].some((c) => g.wheels[c]!.x > Math.min(a, b) && g.wheels[c]!.x < Math.max(a, b));
  let run: LocoUnit | null = null;
  for (const i of free) {
    const x = g.wheels[i]!.x;
    const prev = run ? g.wheels[run.wheels.at(-1)!]!.x : null;
    if (run && prev !== null && Math.abs(x - prev) < 2.2 && !between(prev, x)) run.wheels.push(i);
    else units.push((run = { wheels: [i], engines: [], bogies: [] }));
  }
  if (units.length < 2) return [];
  for (const u of units) u.wheels.sort((a, b) => g.wheels[a]!.x - g.wheels[b]!.x);
  const front = (u: LocoUnit) => g.wheels[u.wheels[0]!]!.x;
  units.sort((a, b) => front(a) - front(b));
  // an engine's stretch of the plate frames: from its cylinders past its last driver
  const f = spec.frame;
  if (f) {
    const engines = units.filter((u) => u.engines.length);
    for (const u of engines) {
      const ws = u.wheels.map((i) => g.wheels[i]!);
      const cyl = u.engines.flatMap((k) => [g.engines[k]!.cylinder.x0, g.engines[k]!.cylinder.x1]);
      const lo = Math.min(...cyl, ...ws.map((w) => w.x - w.d / 2 - 0.1));
      const hi = Math.max(...cyl, ...ws.map((w) => w.x + w.d / 2 + 0.1));
      u.frame = [Math.max(f.x0, lo), Math.min(f.x1, hi)];
    }
    // neighbouring engines share the frame between them at the middle
    for (let k = 1; k < engines.length; k++) {
      const a = engines[k - 1]!.frame!;
      const b = engines[k]!.frame!;
      if (a[1] > b[0]) a[1] = b[0] = (a[1] + b[0]) / 2;
    }
    for (const u of engines) if (u.frame![1] - u.frame![0] < 0.1) delete u.frame;
  }
  return units;
}

/** The stretches of [x0, x1] left outside the ranges `cut`. */
function outside(x0: number, x1: number, cut: Array<[number, number]>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let at = x0;
  for (const [a, b] of [...cut].sort((p, q) => p[0] - q[0])) {
    if (a > at + 0.1) out.push([at, Math.min(a, x1)]);
    at = Math.max(at, b);
  }
  if (x1 > at + 0.1) out.push([at, x1]);
  return out;
}

/** A locomotive (or tender) from its spec, its running gear split into `units` (turningUnits; [] draws it all on a rigid frame). */
export function buildLoco(spec: LocoSpec, units: LocoUnit[] = turningUnits(spec)): MeshBuilder {
  const xc = (spec.heads[0] + spec.heads[1]) / 2;
  const t = new Steam(spec.palette, xc);
  const m = t.m;
  const gear = new RunningGear(spec.gear, (x) => t.X(x), units);
  const frames = (x0: number, x1: number) => {
    const f = spec.frame!;
    // 2 cm short of the stated ends, clear of the beams and running board ends there
    m.scope("frames", () => { for (const s of [-1, 1]) t.sideFrame("frame", s, x0 + 0.02, x1 - 0.02, 0.45, f.top, 0.52, 0.6); });
  };
  const bogieFrames = (list: NonNullable<LocoSpec["bogies"]>) => {
    if (!list.length) return;
    m.scope("bogie frames", () => {
      for (const b of list) for (const s of [-1, 1]) {
        t.sideFrame(spec.bogieFrameMat ?? "black", s, b.x0, b.x1, b.y - 0.09, b.y + 0.09, 0.88, 0.97);
        t.sideFrame("steel", s, (b.x0 + b.x1) / 2 - 0.35, (b.x0 + b.x1) / 2 + 0.35, b.y - 0.2, b.y - 0.09, 0.89, 0.96);
      }
      if (spec.drawOnTruckFrame) for (const b of list) spec.drawOnTruckFrame(t, b);
    });
  };
  const unitBogies = new Set(units.flatMap((u) => u.bogies));
  const unitFrames = units.flatMap((u) => (u.frame ? [u.frame] : []));
  m.part("body", [0, 0, 0], () => {
    const b = spec.boiler;
    if (b) m.scope("boiler", () => t.boiler(b));
    if (spec.chimney) {
      const c = spec.chimney;
      t.chimney(c.x, c.base ?? (b ? b.y + b.r * 0.85 : 0), c.top, c.r);
    }
    if (spec.domes?.length && b) {
      m.scope("domes", () => {
        for (const d of spec.domes!) t.dome(d.x, b.y + b.r * 0.8, d.top, d.r, d.len, d.mat);
      });
    }
    if (spec.valves && b) {
      const v = spec.valves;
      m.scope("safety valves", () => {
        for (const dz of [-0.12, 0.12]) t.cylY("brass", v.x, dz, b.y + b.r * 0.9, v.top, 0.06, 8);
        t.cylY("brass", v.x - 0.3, 0, b.y + b.r * 0.9, v.top + 0.08, 0.04, 8);
      });
    }
    if (spec.handrail && b) {
      const h = spec.handrail;
      m.scope("handrails", () => t.handrail(h.x0, h.x1, h.y, halfAt(boilerSection(b.r, b.y), h.y) + 0.07, 0));
    }
    if (spec.frame) for (const [a, b] of outside(spec.frame.x0, spec.frame.x1, unitFrames)) frames(a, b);
    if (spec.runningBoard) {
      const r = spec.runningBoard;
      m.scope("running board", () => t.runningBoard(r.profile, r.half, r.mat ?? "black", r.valance ?? 0.12, r.valanceMat));
    }
    if (spec.cab) {
      const c = spec.cab;
      m.scope("cab", () => {
        const sec = mirrored(c.half);
        t.section(c.mat ?? "paint", c.x0, c.x1, sec);
        m.scope("roof", () => {
          const top = c.half.filter((p) => p[1] >= c.roofY - 1e-6);
          const roof: Pt[] = [[halfAt(sec, c.roofY) + 0.06, c.roofY - 0.02], ...top.map(([z, y]): Pt => [z + 0.05, y + 0.05])];
          t.section("roof", c.x0 - 0.12, c.x1 + 0.12, mirrored(roof));
        });
        m.scope("windows", () => {
          for (const s of [-1, 1]) for (const w of c.windows) t.sidePanel(sec, "glass", s, w.x0, w.x1, w.y0, w.y1);
          for (const w of c.front ?? []) t.endPanel("glass", 1, c.x0, w.z0, w.z1, w.y0, w.y1);
          for (const w of c.rearWindows ?? []) t.endPanel("glass", -1, c.x1, w.z0, w.z1, w.y0, w.y1);
        });
      });
    }
    for (const p of spec.prisms ?? []) m.scope(p.name, () => prism(t, p));
    for (const v of spec.volumes ?? []) m.scope(v.name, () => t.volume(v));
    bogieFrames((spec.bogies ?? []).filter((_, j) => !unitBogies.has(j)));
    if (spec.coal) {
      const c = spec.coal;
      t.coal(c.x0, c.x1, c.y, c.half, c.rise);
    }
    if (spec.deflectors) {
      const d = spec.deflectors;
      m.scope("smoke deflectors", () => {
        for (const s of [-1, 1]) for (const o of d.outlines) t.deflector(s, o, d.z);
      });
    }
    const beams = spec.beams ?? {};
    const o = { y0: beams.y0, y1: beams.y1, half: beams.half };
    if (beams.front !== false) m.scope("front draw gear", () => t.bufferBeam(1, spec.heads[0], { ...o, length: beams.length?.[0] }));
    if (beams.rear !== false) m.scope("rear draw gear", () => t.bufferBeam(-1, spec.heads[1], { ...o, length: beams.length?.[1] }));
    if (spec.lamps) {
      m.scope("lamps", () => {
        for (const [x, y, z] of spec.lamps!.front) t.lamp(1, x, y, z);
        for (const [x, y, z] of spec.lamps!.rear) t.lamp(-1, x, y, z);
      });
    }
    if (spec.number) {
      const n = spec.number;
      m.scope("numbers", () => {
        if (n.side) for (const s of [-1, 1]) t.sidePlate(s, n.side[0], n.side[1], n.text, n.side[2]);
        if (n.front) t.endPlate(1, n.front[0], n.front[1], n.text);
      });
    }
    m.scope("cylinders and motion", () => gear.drawStatic(m, "paint"));
    spec.extras?.(t);
  });
  // the turning units: rail bogies beside the body that the game turns on the
  // track; their wheelsets and rods are moving parts of them, named as on a rigid frame
  units.forEach((u, k) => {
    m.bogie(() => {
      m.scope(u.engines.length ? "engine unit" : "truck", () => {
        if (u.frame) frames(u.frame[0], u.frame[1]);
        bogieFrames(u.bogies.map((j) => spec.bogies![j]!));
        m.scope("cylinders and motion", () => gear.drawStatic(m, "paint", k));
      });
      gear.drawUnit(m, k);
    });
  });
  gear.drawParts(m);
  return m;
}

/** A round boiler's section, for fitting things to its side. */
export function boilerSection(r: number, y: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    out.push([r * Math.cos(a), y + r * Math.sin(a)]);
  }
  return out;
}
