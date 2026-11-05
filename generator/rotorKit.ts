// The rotor kit (docs/models/world-aircraft.md): a helicopter from one typed
// `RotorSpec` at its real size - the cabin pod and tail boom as one fuselage of
// stations, the engine deck, sponsons, the fin, the stabilizer, skids or wheels
// (a retractable gear as the part "gear"), windows and doors, a livery (the
// airframe kit's `Scheme`) - with its main rotor and its tail rotor or fenestron
// as the parts "rotor" and "tailrotor", turned by the `time` clip "rotor"
// (docs/models/animation.md). And the airship: the Zeppelin NT's envelope, its
// three fins in a Y, the gondola and the three vectored propellers.
//
// Axes as the airframe kit's: metres, nose at +X (catalog yaw 180), +Y up, the
// skids or wheels on y = 0, the fuselage centred on x = 0; positions along the
// fuselage are `d`, metres behind the nose tip.

import { MeshBuilder, ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { airframePalette, type Scheme } from "./airframeKit.ts";
import {
  axleY, body, circle, closeTo, fan, fin, gridTris, hullSec, insideAny, lerp, liveryFin, lobe, oval, ovalOutline, paintedBody,
  plate, rod, skinDecal, skinEnd, skinY, wheel, wing, type FinRing, type Livery, type P2, type Station, type WingStation,
} from "./airframeShapes.ts";
import { airLod, lodAxleWheel, lodBar, type AirFin, type AirPod } from "./lodAir.ts";
import { lodPolygon } from "./lodKit.ts";

export interface RotorSpec {
  /** The fuselage from the nose to the boom's end; the height to the rotor head's top. */
  length: number;
  height: number;
  /** The cabin pod: width, depth, the keel's height above the ground, the nose's and the pod's lengths. */
  width: number;
  depth: number;
  keel: number;
  noseLen: number;
  podLen: number;
  /** The tail boom: radius at the pod and at the end, the end's axis height above the ground. */
  boom: { r0: number; r1: number; y: number };
  /** The main rotor: the mast (d), radius, blades, chord, turning anticlockwise seen from above (1) or clockwise (-1). */
  main: { d: number; r: number; blades: number; chord: number; dir: 1 | -1 };
  /** The tail rotor on the left (-1) or right (1) of the fin, or a fenestron (a ducted fan in the fin). */
  tail: { kind: "rotor" | "fenestron"; r: number; blades: number; side: 1 | -1 };
  /** The fin at the boom's end (its root chord, top height above the ground, sweep), the stabilizer (span, chord, d, height). */
  fin: { root: number; tip: number; top: number; sweep: number };
  stab: { span: number; chord: number; d: number; y: number };
  /** The engine deck on the cabin roof: from d0 to d1, half width, height above the crown; intakes at its front (Mi-8). */
  deck: { d0: number; d1: number; hw: number; h: number; intakes?: boolean };
  /** Sponsons on the cabin's sides (the S-92's gear housings, the Mi-8's fuel tanks). */
  sponsons?: { d0: number; d1: number; hw: number; y: number; r: number };
  gear: { kind: "skids"; track: number; d0: number; d1: number } | { kind: "wheels"; retract: boolean; nose: { d: number; r: number; twin?: boolean }; mains: { d: number; z: number; r: number; twin?: boolean } };
  windows: Array<{ from: number; to: number; pitch: number; y: number; w: number; h: number }>;
  /** Sliding doors (d range), both sides. */
  doors: Array<[number, number]>;
  scheme: Scheme;
  schemeKey: string;
}

const tan = (deg: number): number => Math.tan((deg * Math.PI) / 180);

/** The rotor clip's samples: the main rotor turns once in ROTOR_PERIOD seconds, the tail rotor four times. */
export const ROTOR_PERIOD = 0.48;
const ROTOR_SAMPLES = 12;
const TAIL_TURNS = 4;

interface RotorGeometry {
  s: RotorSpec;
  half: number;
  x: (d: number) => number;
  keel: (d: number) => number;
  crown: (d: number) => number;
  hw: (d: number) => number;
  stations: Station[];
  noseTip: Vec3;
  tailTip: Vec3;
  mast: Vec3;
  tailHub: Vec3;
  fin: FinRing[];
  stab: WingStation[];
  livery: Livery;
  screen: { d0: number; d1: number; y0: number; y1: number };
}

function rotorGeometry(s: RotorSpec): RotorGeometry {
  const L = s.length;
  const half = L / 2;
  const x = (d: number): number => half - d;
  const k = s.keel;
  const crownC = k + s.depth;
  const tipY = k + s.depth * 0.38;
  const boomAt = (d: number): [number, number] => {
    const u = Math.min(1, Math.max(0, (d - s.podLen) / (L - s.podLen)));
    const y0 = crownC - s.depth * 0.3;
    return [lerp(y0, s.boom.y, u), lerp(s.boom.r0, s.boom.r1, u)];
  };
  // the pod closes towards the boom over its last 35 %
  const aft = (d: number): number => Math.min(1, Math.max(0, (d - s.podLen * 0.62) / (s.podLen * 0.45)));
  const keel = (d: number): number => {
    if (d < s.noseLen * 1.2) return tipY - (tipY - k) * closeTo(d, 0, s.noseLen * 0.8, 2.0);
    const [by, br] = boomAt(d);
    return lerp(k, by - br, Math.pow(aft(d), 1.3));
  };
  const crown = (d: number): number => {
    if (d < s.noseLen * 1.2) return tipY + (crownC - tipY) * closeTo(d, 0, s.noseLen * 1.15, 1.5);
    const [by, br] = boomAt(d);
    return lerp(crownC, by + br, Math.pow(aft(d), 1.6));
  };
  const hw = (d: number): number => {
    if (d < s.noseLen * 1.2) return (s.width / 2) * closeTo(d, 0, s.noseLen, 1.8);
    const [, br] = boomAt(d);
    return lerp(s.width / 2, br, Math.pow(aft(d), 1.2));
  };
  const ds = [0.01, 0.04, 0.09, 0.16, 0.25, 0.36, 0.5, 0.66, 0.83, 1].map((t) => t * s.noseLen * 1.15)
    .concat([0.6, 0.7, 0.78, 0.86, 0.93, 1, 1.07].map((t) => t * s.podLen), [L * 0.75, L - 0.6, L - 0.01]);
  const sorted = [...new Set(ds)].sort((a, b) => a - b).filter((d, i, a) => i === 0 || d - a[i - 1]! > 0.03);
  const stations: Station[] = sorted.reverse().map((d) => ({ a: x(d), sec: hullSec(24, [lobe(keel(d), crown(d), hw(d), (keel(d) + crown(d)) / 2 - (d < s.podLen * 0.6 ? s.depth * 0.06 : 0))], 0.05) }));
  const mastY = s.height - 0.12;
  const finRoot = s.boom.y + s.boom.r1 * 0.5;
  const finLead = x(L - s.fin.root * 0.9);
  const fin0: FinRing[] = [[finRoot, finLead, s.fin.root, s.fin.root * 0.12, 0], [s.fin.top, finLead - tan(s.fin.sweep) * (s.fin.top - finRoot), s.fin.tip, s.fin.tip * 0.12, 0]];
  const tailHub: Vec3 = s.tail.kind === "fenestron"
    ? [finLead - s.fin.root * 0.48, finRoot + s.tail.r * 1.05, 0]
    : [finLead - tan(s.fin.sweep) * (s.fin.top - finRoot) * 0.6 - s.fin.tip * 0.4, lerp(finRoot, s.fin.top, 0.62), s.tail.side * (s.fin.root * 0.12 * 0.5 + 0.25)];
  const stab: WingStation[] = [0, s.stab.span / 2].map((sp) => ({ s: sp, lead: x(s.stab.d), chord: s.stab.chord * (sp > 0 ? 0.8 : 1), thick: s.stab.chord * 0.12, mid: s.stab.y }));
  // the livery: the kit's scheme by section height, fin bands by height
  const sc = s.scheme;
  const mat = (c: string | undefined, d: string): string => (c === undefined ? d : sc.colors[c] !== undefined ? `${s.schemeKey}${c[0]!.toUpperCase()}${c.slice(1)}` : c);
  const base = mat(sc.body, "white");
  const tailX = sc.tail ? x(sc.tail.from * L) : -Infinity;
  const skin = (sv: number, a: number): string => {
    if (sc.tail && a < tailX) return mat(sc.tail.mat, base);
    if (sc.top && sv > sc.top[0]) return mat(sc.top[1], base);
    if (sc.belly && sv < sc.belly[0]) return mat(sc.belly[1], base);
    for (const [s0, s1, c] of sc.bands ?? []) if (sv >= s0 && sv < s1) return mat(c, base);
    return base;
  };
  const finH = s.fin.top - finRoot;
  const livery: Livery = {
    title: sc.title, colors: {}, skin,
    fin: typeof sc.fin === "string" ? [[0, mat(sc.fin, base)]] : sc.fin.map(([f, c]) => [f <= 0 ? 0 : finRoot + f * finH, mat(c, base)]),
    finArt: (sc.art ?? []).map((a) => ({ mat: mat(a.mat, base), polys: a.polys.map((p) => p.map(([f, h]): P2 => [f, finRoot + h * finH])) })),
    cowl: mat(sc.cowl, base), winglet: mat(sc.winglet, base),
  };
  return {
    s, half, x, keel, crown, hw, stations, noseTip: [half, tipY, 0], tailTip: [-half, s.boom.y, 0],
    mast: [x(s.main.d), mastY, 0], tailHub, fin: fin0, stab, livery,
    screen: { d0: s.noseLen * 1.05, d1: 0.15, y0: tipY - s.depth * 0.15, y1: crownC - s.depth * 0.1 },
  };
}

/** A rotor blade as a thin plate from radius r0 to r along `dir` (unit, horizontal or vertical), chord across. */
function blade(m: MeshBuilder, mat: string, c: Vec3, dir: Vec3, across: Vec3, r0: number, r: number, chord: number, thick: number): void {
  plate(m, mat, c, dir, across, [[r0, -chord * 0.5], [r * 0.97, -chord * 0.5], [r, -chord * 0.2], [r, chord * 0.4], [r0, chord * 0.5]], thick);
}

/** The quaternion of a turn by `t` about the unit axis. */
const quat = (axis: Vec3, t: number): number[] => [axis[0] * Math.sin(t / 2), axis[1] * Math.sin(t / 2), axis[2] * Math.sin(t / 2), Math.cos(t / 2)];

/** Builds a helicopter: the airframe, the rotors as parts and their clip. */
export function rotorcraft(s: RotorSpec): MeshBuilder {
  const g = rotorGeometry(s);
  const m = new MeshBuilder(airframePalette({ scheme: s.scheme, schemeKey: s.schemeKey } as never));
  const fus = g.stations;
  const off = 0.02;
  const airframeDraw = (): void => {
    m.scope("fuselage", () => {
      m.scope("skin", () => paintedBody(m, "x", fus, g.livery.skin!));
      m.scope("nose", () => fan(m, g.livery.skin!(0, fus[fus.length - 1]!.a), "x", fus[fus.length - 1]!.sec, fus[fus.length - 1]!.a, 1, g.noseTip));
      m.scope("boom end", () => fan(m, g.livery.skin!(0, fus[0]!.a), "x", fus[0]!.sec, fus[0]!.a, -1, g.tailTip));
      m.scope("windscreen", () => {
        // the big wrap-round glazing of the nose: bands of panes over the front
        const sc = g.screen;
        for (const side of [-1, 1]) {
          const pts = gridTris((u, v) => skinEnd("x", fus, side * lerp(0.03, s.width * 0.46, u), lerp(sc.y0, sc.y1, v), g.x(s.noseLen * 1.6), g.half, off * 2, insideAny), 5, 4);
          m.facets("glass", pts, [0.7, 0.3, side * 0.6]);
        }
      });
      m.scope("cabin windows", () => {
        for (const side of [-1, 1]) {
          const pts: P2[][] = [];
          for (const w of s.windows) for (let d = w.from; d <= w.to + 1e-6; d += w.pitch) pts.push(ovalOutline(g.x(d), s.keel + w.y * s.depth, w.w, w.h, 6));
          const tri = pts.flatMap((o) => skinDecal("x", fus, o, side, off * 2.5, 2));
          if (tri.length) m.facets("glass", tri, [0, 0, side]);
        }
      });
      if (s.doors.length) m.scope("doors", () => {
        for (const side of [-1, 1]) {
          const pts: Vec3[] = [];
          for (const [d0, d1] of s.doors) pts.push(...gridTris((u, v) => skinY("x", fus, lerp(g.x(d1), g.x(d0), u), lerp(s.keel + s.depth * 0.12, s.keel + s.depth * 0.78, v), side, off * 1.6), 2, 4));
          m.facets("door", pts, [0, 0, side]);
        }
      });
      m.scope("engine deck", () => {
        const dk = s.deck;
        const y0 = s.keel + s.depth - 0.15;
        const st: Station[] = [[0, 0.5, 0.6], [0.12, 0.95, 0.95], [0.5, 1, 1], [0.85, 0.9, 0.85], [1, 0.4, 0.4]].map(([t, fw, fh]) => ({ a: g.x(lerp(dk.d0, dk.d1, t!)), sec: oval(14, 0, y0, dk.hw * fw!, (dk.h + 0.15) * fh!, 0.1, 2.4) })).reverse();
        body(m, g.livery.cowl, "x", st);
        fan(m, g.livery.cowl, "x", st[0]!.sec, st[0]!.a, -1);
        fan(m, dk.intakes ? "darkGrey" : g.livery.cowl, "x", st[st.length - 1]!.sec, st[st.length - 1]!.a, 1);
        // the mast and the swashplate under the hub
        const [mx, my] = [g.mast[0], g.mast[1]];
        const mr = ngon(10, Math.max(0.12, s.main.r * 0.025), 0, mx, 0);
        m.loft("metalGrey", mr, y0 + dk.h * 0.5, mr, my - 0.05);
      });
      if (s.sponsons) m.scope("sponsons", () => {
        const sp = s.sponsons!;
        for (const side of [-1, 1]) {
          const st: Station[] = [[0, 0.3], [0.15, 0.9], [0.5, 1], [0.85, 0.9], [1, 0.3]].map(([t, f]) => ({ a: g.x(lerp(sp.d0, sp.d1, t!)), sec: oval(12, side * sp.hw, sp.y, sp.r * f!, sp.r * f!, sp.r * f!) })).reverse();
          body(m, g.livery.skin!(-0.5, 0), "x", st);
          fan(m, g.livery.skin!(-0.5, 0), "x", st[0]!.sec, st[0]!.a, -1);
          fan(m, g.livery.skin!(-0.5, 0), "x", st[st.length - 1]!.sec, st[st.length - 1]!.a, 1);
        }
      });
    });
    m.scope("tail", () => {
      m.scope("fin", () => liveryFin(m, g.livery, "x", g.fin));
      m.scope("stabilizer", () => {
        for (const side of [-1, 1]) wing(m, g.livery.winglet, "z", g.stab.map((w) => ({ ...w, s: side * w.s })));
      });
      if (s.tail.kind === "fenestron") m.scope("fenestron", () => {
        // the duct's shroud: a ring round the fan, proud of both faces of the fin
        const [hx, hy] = [g.tailHub[0], g.tailHub[1]];
        const t = s.fin.root * 0.12 * 0.6 + 0.04;
        const outer = 18;
        const pts: Vec3[] = [];
        for (let i = 0; i < outer; i++) {
          const a = (i / outer) * Math.PI * 2;
          const b = ((i + 1) / outer) * Math.PI * 2;
          const p = (ang: number, r: number, z: number): Vec3 => [hx + r * Math.cos(ang), hy + r * Math.sin(ang), z];
          for (const z of [-t, t]) pts.push(p(a, s.tail.r * 1.18, z), p(b, s.tail.r * 1.18, z), p(b, s.tail.r * 1.02, z), p(a, s.tail.r * 1.18, z), p(b, s.tail.r * 1.02, z), p(a, s.tail.r * 1.02, z));
        }
        // pts alternate the -t face's and the +t face's six points per segment
        m.facets("darkGrey", pts.filter((_, i) => Math.floor(i / 6) % 2 === 1), [0, 0, 1]);
        m.facets("darkGrey", pts.filter((_, i) => Math.floor(i / 6) % 2 === 0), [0, 0, -1]);
      });
    });
    m.scope("undercarriage", () => {
      const gs = s.gear;
      if (gs.kind === "skids") {
        const r = 0.05;
        for (const side of [-1, 1]) {
          const z = side * gs.track / 2;
          rod(m, "alloy", [g.x(gs.d1), r, z], [g.x(gs.d0), r, z], r, 6);
          rod(m, "alloy", [g.x(gs.d0), r, z], [g.x(gs.d0) + 0.25, r + 0.18, z], r, 6);
          for (const d of [lerp(gs.d0, gs.d1, 0.22), lerp(gs.d0, gs.d1, 0.72)]) rod(m, "alloy", [g.x(d), r, z], [g.x(d), s.keel + 0.12, side * s.width * 0.3], 0.045, 6);
        }
      } else if (!gs.retract) drawWheels(m, g);
    });
  };
  m.part("airframe", [0, 0, 0], airframeDraw);
  if (s.gear.kind === "wheels" && s.gear.retract) m.part("gear", [0, 0, 0], () => drawWheels(m, g));
  // the main rotor: hub and blades, turning about the mast
  m.part("rotor", g.mast, () => m.scope("main rotor", () => {
    const [mx, my] = [g.mast[0], g.mast[1]];
    const hub = ngon(12, Math.max(0.2, s.main.r * 0.05), 0, mx, 0);
    m.loft("metalGrey", hub, my - 0.18, hub, my + 0.12);
    for (let i = 0; i < s.main.blades; i++) {
      const t = (i * 2 * Math.PI) / s.main.blades + Math.PI / 4;
      blade(m, "prop", [mx, my - 0.02, 0], [Math.cos(t), 0, Math.sin(t)], [-Math.sin(t) * 0.995, 0.1, Math.cos(t) * 0.995], s.main.r * 0.04, s.main.r, s.main.chord, 0.05);
    }
  }));
  // the tail rotor (or the fenestron's fan) turning about its hub across the boom
  m.part("tailrotor", g.tailHub, () => m.scope(s.tail.kind === "fenestron" ? "fenestron fan" : "tail rotor", () => {
    const [hx, hy, hz] = g.tailHub;
    const hub = circle(8, hx, hy, Math.max(0.06, s.tail.r * 0.1));
    m.sweep("metalGrey", "z", hub, hz - 0.08, hub, hz + 0.08);
    for (let i = 0; i < s.tail.blades; i++) {
      const t = (i * 2 * Math.PI) / s.tail.blades;
      blade(m, "prop", [hx, hy, hz], [Math.cos(t), Math.sin(t), 0], [-Math.sin(t) * 0.97, Math.cos(t) * 0.97, 0.24], s.tail.r * 0.12, s.tail.r * (s.tail.kind === "fenestron" ? 0.98 : 1), s.tail.r * (s.tail.kind === "fenestron" ? 0.16 : 0.2), 0.03);
    }
  }));
  const times = Array.from({ length: ROTOR_SAMPLES + 1 }, (_, i) => (i * ROTOR_PERIOD) / ROTOR_SAMPLES);
  m.animate({
    name: "rotor", times, drive: { drive: "time" },
    tracks: [
      { node: "rotor", path: "rotation", values: times.flatMap((_, i) => quat([0, 1, 0], (s.main.dir * i * 2 * Math.PI) / ROTOR_SAMPLES)) },
      { node: "tailrotor", path: "rotation", values: times.flatMap((_, i) => quat([0, 0, 1], (i * TAIL_TURNS * 2 * Math.PI) / ROTOR_SAMPLES)) },
    ],
  });
  return m;
}

function drawWheels(m: MeshBuilder, g: RotorGeometry): void {
  const gs = g.s.gear;
  if (gs.kind !== "wheels") return;
  const leg = (name: string, d: number, z: number, r: number, twin?: boolean): void => m.scope(name, () => {
    const xg = g.x(d);
    const y = axleY(0, r, 12);
    rod(m, "alloy", [xg, g.keel(d) + 0.15, z * 0.6], [xg, y, z], Math.max(0.05, r * 0.2), 6);
    for (const dz of twin ? [-r * 0.6, r * 0.6] : [0]) wheel(m, "z", z + dz - r * 0.3, z + dz + r * 0.3, [xg, y], r, r * 0.45, "alloy", 12);
  });
  leg("nose gear", gs.nose.d, 0, gs.nose.r, gs.nose.twin);
  for (const side of [-1, 1]) leg(`${side > 0 ? "right" : "left"} main gear`, gs.mains.d, side * gs.mains.z, gs.mains.r, gs.mains.twin);
}

/** A helicopter's LOD: pod and boom, fin, stabilizer, the rotors standing still as flat bars, skids or wheels. */
export function rotorcraftLod(s: RotorSpec): MeshBuilder {
  const g = rotorGeometry(s);
  const fins: AirFin[] = [{ chordAxis: "x", rings: g.fin, bands: g.livery.fin }];
  const pods: AirPod[] = [{ axis: "x", stations: [[0, 0.6], [0.2, 1], [0.85, 0.9], [1, 0.4]].map(([t, f]) => ({ a: g.x(lerp(s.deck.d1, s.deck.d0, t!)), sec: oval(8, 0, s.keel + s.depth - 0.15 + s.deck.h * 0.4, s.deck.hw * f!, s.deck.h * 0.6 * f!, s.deck.h * 0.6) })), mat: g.livery.cowl, sides: 5, optional: 2 }];
  const parts: Array<{ draw: (m: MeshBuilder) => void; optional?: number }> = [
    { draw: (m) => {
      const [mx, my] = [g.mast[0], g.mast[1]];
      for (let i = 0; i < Math.min(s.main.blades, 4); i++) {
        const t = (i * 2 * Math.PI) / s.main.blades + Math.PI / 4;
        const [c, sn] = [Math.cos(t), Math.sin(t)];
        const w = s.main.chord / 2;
        const q = (r: number, a: number): Vec3 => [mx + r * c - a * sn, my + 0.02 * i, r * sn + a * c];
        lodPolygon(m, "prop", [q(0.2, -w), q(s.main.r, -w), q(s.main.r, w), q(0.2, w)], [0, 1, 0]);
        lodPolygon(m, "prop", [q(0.2, -w), q(0.2, w), q(s.main.r, w), q(s.main.r, -w)].map(([px, py, pz]): Vec3 => [px, py - 0.01, pz]), [0, -1, 0]);
      }
    } },
    { optional: 1, draw: (m) => {
      const [hx, hy, hz] = g.tailHub;
      const r = s.tail.r;
      for (const [dz, nz] of [[0.02, 1], [-0.02, -1]] as const) lodPolygon(m, "prop", [[hx - r, hy - 0.08, hz + dz], [hx + r, hy - 0.08, hz + dz], [hx + r, hy + 0.08, hz + dz], [hx - r, hy + 0.08, hz + dz]], [0, 0, nz]);
    } },
    { draw: (m) => {
      const gs = s.gear;
      if (gs.kind === "skids") for (const side of [-1, 1]) {
        lodBar(m, "alloy", [g.x(gs.d1), 0.06, side * gs.track / 2], [g.x(gs.d0), 0.06, side * gs.track / 2], 0.06, 3);
        for (const d of [lerp(gs.d0, gs.d1, 0.22), lerp(gs.d0, gs.d1, 0.72)]) lodBar(m, "alloy", [g.x(d), 0.06, side * gs.track / 2], [g.x(d), s.keel + 0.1, side * s.width * 0.3], 0.05, 3);
      } else if (!gs.retract) {
        lodAxleWheel(m, "darkGrey", "z", g.x(gs.nose.d), gs.nose.r, gs.nose.r, -gs.nose.r * 0.3, gs.nose.r * 0.3, 6);
        for (const side of [-1, 1]) lodAxleWheel(m, "darkGrey", "z", g.x(gs.mains.d), gs.mains.r, gs.mains.r, side * gs.mains.z - gs.mains.r * 0.3, side * gs.mains.z + gs.mains.r * 0.3, 6);
      }
    } },
  ];
  return airLod({
    palette: airframePalette({ scheme: s.scheme, schemeKey: s.schemeKey } as never), axis: "x", fuselage: g.stations,
    nose: g.noseTip, tail: g.tailTip, paint: (sv, a) => g.livery.skin!(sv, a),
    windscreen: { a0: g.x(s.noseLen * 1.1), a1: g.x(0.1), s: -0.2 },
    wings: [{ axis: "z", stations: g.stab, mirror: true, mat: g.livery.winglet }],
    fins, engines: [], pods, parts,
  });
}

// --- the airship ----------------------------------------------------------------------------

export interface AirshipSpec {
  length: number;
  /** The envelope's diameter and its axis's height above the ground. */
  diameter: number;
  axisY: number;
  /** The gondola under the envelope: from d0 to d1, half width, height. */
  gondola: { d0: number; d1: number; hw: number; h: number };
  /** The three fins in a Y (one on top): root chord, span, root leading edge (d). */
  fins: { root: number; tip: number; span: number; at: number };
  /** The side propellers on outriggers (d, radius) and the stern propeller. */
  props: { d: number; r: number; stern: number };
  scheme: Scheme;
  schemeKey: string;
}

function airshipStations(s: AirshipSpec): Station[] {
  const L = s.length;
  const R = s.diameter / 2;
  // a streamlined body of revolution: a blunt nose, the widest at 40 %, a long fine tail
  const r = (d: number): number => {
    const u = d / L;
    return u < 0.4 ? R * Math.pow(1 - Math.pow(1 - u / 0.4, 2.2), 1 / 2.2) : R * Math.pow(Math.max(0, 1 - Math.pow((u - 0.4) / 0.6, 2.0)), 0.75);
  };
  const ds = [0.003, 0.012, 0.03, 0.06, 0.1, 0.16, 0.24, 0.32, 0.4, 0.5, 0.6, 0.7, 0.78, 0.85, 0.91, 0.955, 0.985, 0.997].map((t) => t * L);
  return ds.reverse().map((d) => ({ a: L / 2 - d, sec: circle(28, 0, s.axisY, Math.max(0.05, r(d))) }));
}

/** The Zeppelin NT: the envelope, the Y of fins, the gondola with its wheel, three propellers. */
export function airship(s: AirshipSpec): MeshBuilder {
  const m = new MeshBuilder(airframePalette({ scheme: s.scheme, schemeKey: s.schemeKey } as never));
  const L = s.length;
  const half = L / 2;
  const x = (d: number): number => half - d;
  const st = airshipStations(s);
  const sc = s.scheme;
  const mat = (c: string | undefined, d: string): string => (c === undefined ? d : sc.colors[c] !== undefined ? `${s.schemeKey}${c[0]!.toUpperCase()}${c.slice(1)}` : c);
  const base = mat(sc.body, "white");
  const skin = (sv: number): string => (sc.belly && sv < sc.belly[0] ? mat(sc.belly[1], base) : sc.bands?.find(([a, b]) => sv >= a && sv < b)?.[2] !== undefined ? mat(sc.bands.find(([a, b]) => sv >= a && sv < b)![2], base) : base);
  const finMat = mat(typeof sc.fin === "string" ? sc.fin : sc.fin[0]![1], base);
  m.scope("envelope", () => {
    paintedBody(m, "x", st, skin);
    fan(m, base, "x", st[st.length - 1]!.sec, st[st.length - 1]!.a, 1, [half, s.axisY, 0]);
    fan(m, base, "x", st[0]!.sec, st[0]!.a, -1, [-half, s.axisY, 0]);
  });
  m.scope("fins", () => {
    const f = s.fins;
    const R = s.diameter / 2;
    for (const ang of [90, 210, 330]) {
      const t = (ang * Math.PI) / 180;
      // draw the fin standing up from the axis, then turn it about the axis to its angle
      const turn = t - Math.PI / 2;
      const rot = ([px, py, pz]: Vec3): Vec3 => {
        const [dy, dz] = [py - s.axisY, pz];
        return [px, s.axisY + dy * Math.cos(turn) - dz * Math.sin(turn), dy * Math.sin(turn) + dz * Math.cos(turn)];
      };
      m.moved(rot, () => fin(m, finMat, "x", [[s.axisY + R * 0.18, x(f.at), f.root, f.root * 0.1, 0], [s.axisY + R * 0.18 + f.span, x(f.at) - f.root * 0.45, f.tip, f.tip * 0.1, 0]]));
    }
  });
  m.scope("gondola", () => {
    const gd = s.gondola;
    const y0 = s.axisY - s.diameter / 2 - gd.h + 0.6;
    const prof: Array<[number, number, number]> = [[0, 0.3, 0.5], [0.08, 0.85, 0.85], [0.2, 1, 1], [0.8, 1, 1], [0.93, 0.7, 0.75], [1, 0.25, 0.4]];
    const gs: Station[] = prof.map(([t, fw, fh]) => ({ a: x(lerp(gd.d0, gd.d1, t)), sec: oval(16, 0, y0 + gd.h * 0.5, gd.hw * fw, gd.h * 0.55 * fh, gd.h * 0.5 * fh, 2.6) })).reverse();
    body(m, "white", "x", gs);
    fan(m, "white", "x", gs[0]!.sec, gs[0]!.a, -1);
    fan(m, "white", "x", gs[gs.length - 1]!.sec, gs[gs.length - 1]!.a, 1);
    for (const side of [-1, 1]) {
      const pts: Vec3[] = [];
      for (let d = gd.d0 + 1.2; d < gd.d1 - 1.0; d += 0.9) pts.push(...skinDecal("x", gs, [[x(d) + 0.35, y0 + gd.h * 0.45], [x(d) - 0.35, y0 + gd.h * 0.45], [x(d) - 0.35, y0 + gd.h * 0.85], [x(d) + 0.35, y0 + gd.h * 0.85]], side, 0.04, 2));
      m.facets("glass", pts, [0, 0, side]);
    }
    const yc = axleY(0, 0.35, 12);
    rod(m, "alloy", [x(gd.d0 + (gd.d1 - gd.d0) * 0.45), y0 + 0.1, 0], [x(gd.d0 + (gd.d1 - gd.d0) * 0.45), yc, 0], 0.07);
    wheel(m, "z", -0.14, 0.14, [x(gd.d0 + (gd.d1 - gd.d0) * 0.45), yc], 0.35, 0.16, "alloy", 12);
  });
  m.scope("propellers", () => {
    const p = s.props;
    const R = s.diameter / 2;
    const rr = (d: number): number => {
      const sec = st.find((a, i) => i + 1 < st.length && a.a <= x(d) && st[i + 1]!.a >= x(d)) ?? st[0]!;
      return Math.abs(sec.sec[0]![0]);
    };
    for (const side of [-1, 1]) {
      const z = side * (rr(p.d) + p.r * 1.25);
      rod(m, "metalGrey", [x(p.d), s.axisY - R * 0.15, side * rr(p.d) * 0.9], [x(p.d), s.axisY - R * 0.15, z], 0.12, 6);
      const nac: Station[] = [[-1.2, 0.18], [-0.4, 0.4], [0.6, 0.38], [1.2, 0.15]].map(([dx, r]) => ({ a: x(p.d) + dx!, sec: circle(10, z, s.axisY - R * 0.15, r!) }));
      body(m, "white", "x", nac);
      fan(m, "white", "x", nac[0]!.sec, nac[0]!.a, -1);
      fan(m, "white", "x", nac[nac.length - 1]!.sec, nac[nac.length - 1]!.a, 1);
      for (let i = 0; i < 4; i++) {
        const t = (i * Math.PI) / 2 + Math.PI / 4;
        plate(m, "prop", [x(p.d) + 1.25, s.axisY - R * 0.15, z], [0, Math.sin(t), Math.cos(t)], [0.3, Math.cos(t), -Math.sin(t)], [[0.25, -0.12], [p.r, -0.06], [p.r, 0.06], [0.25, 0.12]], 0.04);
      }
    }
    // the stern propeller behind the tail
    for (let i = 0; i < 5; i++) {
      const t = (i * 2 * Math.PI) / 5;
      plate(m, "prop", [-half - 0.6, s.axisY, 0], [0, Math.sin(t), Math.cos(t)], [0.3, Math.cos(t), -Math.sin(t)], [[0.2, -0.12], [p.stern, -0.06], [p.stern, 0.06], [0.2, 0.12]], 0.04);
    }
    rod(m, "metalGrey", [-half + 0.3, s.axisY, 0], [-half - 0.75, s.axisY, 0], 0.15, 8);
  });
  return m;
}

export function airshipLod(s: AirshipSpec): MeshBuilder {
  const L = s.length;
  const half = L / 2;
  const R = s.diameter / 2;
  const sc = s.scheme;
  const mat = (c: string | undefined, d: string): string => (c === undefined ? d : sc.colors[c] !== undefined ? `${s.schemeKey}${c[0]!.toUpperCase()}${c.slice(1)}` : c);
  const base = mat(sc.body, "white");
  const finMat = mat(typeof sc.fin === "string" ? sc.fin : sc.fin[0]![1], base);
  const gd = s.gondola;
  const y0 = s.axisY - R - gd.h + 0.6;
  return airLod({
    palette: airframePalette({ scheme: s.scheme, schemeKey: s.schemeKey } as never), axis: "x", fuselage: airshipStations(s).map((a) => ({ a: a.a, sec: a.sec })),
    nose: [half, s.axisY, 0], tail: [-half, s.axisY, 0],
    paint: (sv) => (sc.belly && sv < sc.belly[0] ? mat(sc.belly[1], base) : base),
    wings: [], engines: [],
    fins: [{ chordAxis: "x", rings: [[s.axisY + R * 0.5, half - s.fins.at, s.fins.root, s.fins.root * 0.1, 0], [s.axisY + R * 0.18 + s.fins.span, half - s.fins.at - s.fins.root * 0.45, s.fins.tip, s.fins.tip * 0.1, 0]], bands: [[-1e3, finMat]] }],
    pods: [{ axis: "x", stations: [[0, 0.4], [0.15, 1], [0.85, 1], [1, 0.4]].map(([t, f]) => ({ a: half - lerp(gd.d1, gd.d0, t!), sec: oval(8, 0, y0 + gd.h * 0.5, gd.hw * f!, gd.h * 0.5, gd.h * 0.5) })), mat: "white", sides: 6 }],
    parts: [{ draw: (m) => {
      // the two lower fins as flat plates, each side of the axis
      for (const side of [-1, 1]) {
        const t = ((side > 0 ? 330 : 210) * Math.PI) / 180;
        const [c, sn] = [Math.cos(t), Math.sin(t)];
        const p = (r: number, d: number): Vec3 => [half - d, s.axisY + r * sn, r * c];
        const pts = [p(R * 0.6, s.fins.at), p(R * 0.6, s.fins.at + s.fins.root), p(R * 0.18 + s.fins.span, s.fins.at + s.fins.root * 0.45 + s.fins.tip), p(R * 0.18 + s.fins.span, s.fins.at + s.fins.root * 0.45)];
        lodPolygon(m, finMat, pts, [0, -c, sn].map((v, i) => (i === 0 ? 0 : v)) as Vec3);
        lodPolygon(m, finMat, [...pts].reverse().map(([px, py, pz]): Vec3 => [px, py + 0.02 * c, pz - 0.02 * sn]), [0, c, -sn] as Vec3);
      }
    } }],
  });
}

/** The kit options a helicopter spec uses (worldFleet.ts). */
export function rotorFeatures(s: RotorSpec, params: readonly string[]): string[] {
  return [
    "rotorcraft", `rotor:${s.main.dir > 0 ? "anticlockwise" : "clockwise"}`, `tail:${s.tail.kind}`,
    `gear:${s.gear.kind}${s.gear.kind === "wheels" ? (s.gear.retract ? "-retract" : "-fixed") : ""}`,
    ...(s.sponsons ? ["sponsons"] : []), ...(s.deck.intakes ? ["intakes"] : []), ...(s.scheme.titles ? ["titles"] : []),
    ...params.map((p) => `param:${p}`),
  ];
}

/** The kit options of an airship spec. */
export const airshipFeatures = (_s: AirshipSpec, params: readonly string[]): string[] => ["airship", ...params.map((p) => `param:${p}`)];
