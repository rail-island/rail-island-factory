// The shared builder of the steam locomotives and their tenders transferred
// from vlakosimdb (steamLocos.ts): a locomotive is a spec -- boiler, chimney,
// domes, running board, cab, tanks or bunker, deflectors, draw gear and running
// gear, all in source coordinates measured from the vlakosimdb XML and BMPs --
// drawn as a static "body" part followed by the moving parts of its running gear
// (steamGear.ts) and the "running" animation clip. See
// docs/models/steam-locomotives.md.

import type { MaterialSpec } from "./meshBuilder.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { RunningGear, type RunningGearSpec } from "./steamGear.ts";
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
  boiler?: { x0: number; x1: number; y: number; r: number; smokebox: number; bands?: number[]; band?: string };
  /** The chimney; `base` is where it starts when there is no boiler (a streamlined casing). */
  chimney?: { x: number; top: number; r: number; base?: number };
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

/** A locomotive (or tender) from its spec. */
export function buildLoco(spec: LocoSpec): MeshBuilder {
  const xc = (spec.heads[0] + spec.heads[1]) / 2;
  const t = new Steam(spec.palette, xc);
  const m = t.m;
  const gear = new RunningGear(spec.gear, (x) => t.X(x));
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
    if (spec.frame) {
      const f = spec.frame;
      m.scope("frames", () => {
        // 2 cm short of the stated ends, clear of the beams and running board ends there
        for (const s of [-1, 1]) t.sideBox("frame", s, f.x0 + 0.02, f.x1 - 0.02, 0.45, f.top, 0.52, 0.6);
      });
    }
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
    if (spec.bogies?.length) {
      m.scope("bogie frames", () => {
        for (const b of spec.bogies!) for (const s of [-1, 1]) {
          t.sideBox("black", s, b.x0, b.x1, b.y - 0.09, b.y + 0.09, 0.88, 0.97);
          t.sideBox("steel", s, (b.x0 + b.x1) / 2 - 0.35, (b.x0 + b.x1) / 2 + 0.35, b.y - 0.2, b.y - 0.09, 0.89, 0.96);
        }
      });
    }
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
