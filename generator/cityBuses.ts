// The single bus models from vlakosimdb (buses.ts): the Karosa-Renault City Bus
// 12M and 18M, the Mercedes-Benz Citaro (two liveries, two models), the O 345 G,
// the Solaris Urbino 15 and the generic Bus 1. They share one builder, `cityBus`,
// fed by a description in the vlakosimdb source's own frame: u, metres from the
// nose (the texture columns, 10 pixels a metre), stretched to the real bus's
// length. See docs/models/buses.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Arch, Paint } from "./busBody.ts";
import { BusDraft, type Axle, type DoorStyle, type PaneStyle } from "./busAssembly.ts";
import { busPalette, endLamp, endSlab, mirror, sideSlab, type BusFrame } from "./busKit.ts";
import { block } from "./vehicleParts.ts";

/** What a fitting callback gets: the draft, the source-to-factory mapping and the body's measures. */
export interface CityCtx {
  d: BusDraft;
  m: () => MeshBuilder;
  frame: BusFrame;
  /** Factory x of source u. */
  x: (u: number) => number;
  nose: number;
  tail: number;
  hw: number;
}

export interface CitySpec {
  /** Livery colours by material name; `body` is the base. */
  livery: Record<string, string>;
  /** Source u of the nose and the tail, and the real length they are stretched to. */
  nose: number;
  tail: number;
  length: number;
  /** The rigid bodies, source u, front first. */
  bodies: Array<[number, number]>;
  /** The axles, front first: at source u, or `at` metres from the nose where the real bus's are known. */
  axles: Array<{ u?: number; at?: number; dual: boolean; drive?: boolean }>;
  wheelRadius: number;
  /** Half the body's width. */
  hw: number;
  bottom: number;
  /** Section heights: where the sides start to lean in, the eave, the roof crown. */
  belt: number;
  eave: number;
  roof: number;
  /** How far the side leans in from belt to eave, and the roof corner's chamfer. */
  tumble: number;
  corner: number;
  /** The nose: upright to `from`, then raked back `rake` to the eave, the roof edge `cap` further. */
  front: { from: number; rake: number; cap: number; low: number; chamfer: [number, number] };
  rear: { from: number; rake: number; cap: number; low: number; chamfer: [number, number] };
  /** Paint panels in source u. */
  paint: Array<{ u0: number; u1: number; y0: number; y1: number; mat: string }>;
  pane: PaneStyle;
  pitch: number;
  door: DoorStyle;
  /** Right-side doors, source u. */
  doors: Array<[number, number]>;
  /** Where the side windows run, source u, per side; doors are cut out of the right's. */
  windows: Array<[number, number]>;
  arch: { half: number; side: number; top: number };
  tyres: { single: [number, number]; inner: [number, number]; outer: [number, number] };
  bellows?: { profile: Array<[number, number]>; folds: number; depth: number };
  maxSteerDeg: number;
  maxBendDeg?: number;
  /** The nose, the tail and the roof, drawn by the design. */
  details: (c: CityCtx) => void;
}

/** Builds one city bus from its description. */
export function cityBus(sp: CitySpec): MeshBuilder {
  const k = sp.length / (sp.tail - sp.nose);
  const x = (u: number): number => (sp.tail - u) * k;
  const nose = x(sp.nose);
  const tail = x(sp.tail);
  const { hw, bottom } = sp;
  // the roof's edge and the plan's corners rounded in three straight pieces
  const ROUND = 3;
  const edge = (s: number): Array<[number, number]> => quarter(s * (hw - sp.tumble - sp.corner), sp.eave, s * sp.corner, sp.roof - 0.03 - sp.eave, ROUND);
  const right = edge(1);
  const left = edge(-1).reverse();
  const section: Array<[number, number]> = [[-hw, bottom], [hw, bottom], [hw, sp.belt], ...right, [0, sp.roof], ...left, [-hw, sp.belt]];
  const f = sp.front;
  const r = sp.rear;
  const side: Array<[number, number]> = [
    [tail + r.low, bottom], [nose - f.low, bottom], [nose, bottom + f.low * 0.6], [nose, f.from], [nose - f.rake, sp.eave], [nose - f.rake - f.cap, sp.roof],
    [tail + r.rake + r.cap, sp.roof], [tail + r.rake, sp.eave], [tail, r.from], [tail, bottom + r.low * 0.6],
  ];
  // quarter arcs from the sides round onto the ends, in (x, z)
  const corner = (cx: number, sx: number, sz: number, c: [number, number]): Array<[number, number]> =>
    quarter(cx - sx * c[0], sz * (hw - c[1]), sx * c[0], sz * c[1], ROUND);
  const plan: Array<[number, number]> = [
    ...corner(tail, -1, -1, r.chamfer), ...corner(nose, 1, -1, f.chamfer).reverse(), ...corner(nose, 1, 1, f.chamfer), ...corner(tail, -1, 1, r.chamfer).reverse(),
  ];
  const paint: Paint[] = sp.paint.map((p) => ({ x0: Math.min(x(p.u0), x(p.u1)), x1: Math.max(x(p.u0), x(p.u1)), y0: p.y0, y1: p.y1, mat: p.mat }));
  const axles: Axle[] = sp.axles.map((a, i) => ({ x: a.at !== undefined ? nose - a.at : x(a.u!), dual: a.dual, steer: i === 0, drive: a.drive ?? false }));
  const arches: Arch[] = axles.map((a) => ({ x: a.x, half: sp.arch.half, side: sp.arch.side, top: sp.arch.top }));
  const bodies: Array<[number, number]> = sp.bodies.map(([u0, u1]) => [x(u1), x(u0)]);

  const d = new BusDraft({ section, side });
  // the right side's windows, cut by the doors
  for (const [w0, w1] of sp.windows) {
    let at = w0;
    for (const [d0, d1] of [...sp.doors].sort((a, b) => a[0] - b[0])) {
      if (d1 <= w0 || d0 >= w1) continue;
      if (d0 - at > 0.5) d.run(1, x(d0 - 0.06), x(at), sp.pane, sp.pitch);
      at = Math.max(at, d1 + 0.06);
    }
    if (w1 - at > 0.5) d.run(1, x(w1), x(at), sp.pane, sp.pitch);
    d.run(-1, x(w1), x(w0), sp.pane, sp.pitch);
  }
  for (const [d0, d1] of sp.doors) d.door(x(d1), x(d0), sp.door);
  sp.details({ d, m: () => d.m, frame: d.frame, x, nose, tail, hw });

  return d.build({
    palette: busPalette({ ...sp.livery }),
    section, side, plan, base: "body", paint, arches, bodies, axles,
    wheelRadius: sp.wheelRadius,
    tyres: sp.tyres,
    ...(sp.bellows ? { bellows: sp.bellows } : {}),
    hingeY: 0.6,
    maxSteerDeg: sp.maxSteerDeg,
    ...(sp.maxBendDeg ? { maxBendDeg: sp.maxBendDeg } : {}),
  });
}

/**
 * A quarter of an ellipse about (ca, cb) in n straight pieces: from (ca + ra, cb)
 * round to (ca, cb + rb) (the radii may be negative, to turn the other way).
 */
function quarter(ca: number, cb: number, ra: number, rb: number, n: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * (Math.PI / 2);
    out.push([ca + ra * Math.cos(t), cb + rb * Math.sin(t)]);
  }
  return out;
}

// --- shared fittings ---------------------------------------------------------------

/** A roof box (an air-conditioning unit, a hatch) over x0..x1, z0..z1, from the roof up to `top`. */
export function roofBox(c: CityCtx, group: string, x0: number, x1: number, z0: number, z1: number, top: number, mat: string, base: number): void {
  c.d.fit(group, (x0 + x1) / 2, () => block(c.m(), mat, x0, x1, base, top, z0, z1));
}

/**
 * A pair of "rabbit ear" mirrors: arms from the roof's front edge forward over
 * the windscreen's corners, the heads hanging from them, their outer edges just
 * past the body's side (within the 1.35 m road half width).
 */
export function earMirrors(c: CityCtx, y: number, drop: number): void {
  const outer = Math.min(c.hw + 0.07, 1.345);
  c.d.fit("mirrors", c.nose, () => {
    for (const s of [-1, 1]) {
      const z = s * (c.hw - 0.05);
      const zh = s * (outer - 0.1);
      block(c.m(), "frame", c.nose - 0.25, c.nose + 0.32, y - 0.025, y + 0.025, z - 0.025, z + 0.025);
      block(c.m(), "frame", c.nose + 0.28, c.nose + 0.33, y - drop, y, z - 0.025, z + 0.025);
      block(c.m(), "frame", c.nose + 0.25, c.nose + 0.36, y - drop - 0.42, y - drop, zh - 0.1, zh + 0.1);
      block(c.m(), "glass", c.nose + 0.235, c.nose + 0.255, y - drop - 0.4, y - drop - 0.02, zh - 0.08, zh + 0.08);
    }
  });
}

/** Side-arm mirrors at the front corners, within the road width. */
export function armMirrors(c: CityCtx, y: number): void {
  c.d.fit("mirrors", c.nose, () => {
    for (const s of [-1, 1]) mirror(c.m(), c.frame, s, c.nose, y, { h: 0.38, w: 0.18, drop: 0.06 });
  });
}

/** Square headlamps in a housing at the nose's lower corners. */
function cornerLamps(c: CityCtx, y0: number, y1: number, w: number, inset: number, housing = "frame"): void {
  for (const s of [-1, 1]) {
    const z1 = s * (c.hw - inset);
    const z0 = z1 - s * w;
    endSlab(c.m(), housing, c.frame, 1, Math.min(z0, z1) - 0.02, Math.max(z0, z1) + 0.02, y0 - 0.02, y1 + 0.02, 0.008);
    endSlab(c.m(), "lampHead", c.frame, 1, Math.min(z0, z1), Math.max(z0, z1) - w * 0.45, y0 + 0.01, y1 - 0.01, 0.016);
    endSlab(c.m(), "lampAmber", c.frame, 1, Math.max(z0, z1) - w * 0.4, Math.max(z0, z1), y0 + 0.01, y1 - 0.01, 0.016);
  }
}

/** Tail lamp columns at the rear corners: amber, red, red, reversing white, top down. */
function tailLamps(c: CityCtx, y0: number, inset: number, w = 0.16): void {
  for (const s of [-1, 1]) {
    const zc = s * (c.hw - inset - w / 2);
    const rows: Array<[string, number]> = [["lampHead", 0.1], ["lampRed", 0.14], ["lampRed", 0.14], ["lampAmber", 0.12]];
    let y = y0;
    for (const [mat, h] of rows) {
      endSlab(c.m(), mat, c.frame, -1, zc - w / 2, zc + w / 2, y, y + h - 0.01, 0.015);
      y += h;
    }
  }
}

/** The windscreen on the nose: a frame, the glass, a destination display behind its top, two wipers. */
function windscreen(c: CityCtx, y0: number, y1: number, half: number, sign: [number, number] | null): void {
  endSlab(c.m(), "frame", c.frame, 1, -half - 0.05, half + 0.05, y0 - 0.04, y1 + 0.03, 0.01);
  endSlab(c.m(), "glass", c.frame, 1, -half, half, y0, y1, 0.02);
  if (sign) {
    endSlab(c.m(), "sign", c.frame, 1, -half + 0.12, half - 0.12, sign[0], sign[1], 0.026);
    endSlab(c.m(), "signText", c.frame, 1, -half + 0.3, half - 0.3, sign[0] + 0.07, sign[1] - 0.07, 0.03);
  }
  for (const z of [-half + 0.1, 0.06]) endSlab(c.m(), "frame", c.frame, 1, z, z + half - 0.16, y0 + 0.05, y0 + 0.08, 0.03);
}

// --- the Karosa-Renault City Bus ---------------------------------------------------
//
// The low-floor Renault Agora that Karosa built from 1996 as the City Bus
// (photographs in assets/karosa-renault-citybus-12m/): a black band from the deep
// bonded windows up to the white roof edge, a white belt and a red skirt under a
// black rubbing line, plug doors, a raked windscreen under a destination box that
// stands proud of the roof, headlamps in the red lower front, big louvred grilles
// on the rear corners and on the engine flap. The 18M is the articulated version,
// the joint's ends faired up on the roof.

const KR_LIVERY = { body: "#f4f4f1", red: "#d3252b", band: "#1f2326", bumper: "#d3252b", pod: "#eeefed", bellows: "#2c2d30" };
const KR_PANE: PaneStyle = { glass: [1.3, 2.62], surround: [1.26, 2.66], inset: 0.03, surroundMat: "band" };
const KR_DOOR: DoorStyle = { bottom: 0.3, top: 2.62, leafMat: "frame", panes: [[0.42, 2.54]], leaves: 2 };

function karosaRenaultSpec(long: boolean): CitySpec {
  const tail = long ? 19.3 : 12.8;
  return {
    livery: KR_LIVERY,
    nose: 0.2, tail, length: long ? 17.8 : 11.99,
    bodies: long ? [[0.2, 9.8], [11.7, 19.3]] : [[0.2, 12.8]],
    // 2.71 + 6.12 + 3.16 m, and 2.71 + 5.355 + 6.575 + 3.16 m (cs.wikipedia)
    axles: long
      ? [{ at: 2.71, dual: false }, { at: 8.065, dual: true }, { at: 14.64, dual: true, drive: true }]
      : [{ at: 2.71, dual: false }, { at: 8.83, dual: true, drive: true }],
    wheelRadius: 0.48, hw: 1.25, bottom: 0.28, belt: 1.25, eave: 2.8, roof: 2.924, tumble: 0.05, corner: 0.12,
    front: { from: 0.95, rake: 0.32, cap: 0.12, low: 0.25, chamfer: [0.35, 0.16] },
    rear: { from: 2.55, rake: 0.1, cap: 0.28, low: 0.6, chamfer: [0.25, 0.12] },
    paint: [
      { u0: 0, u1: tail + 1, y0: 0.28, y1: 0.84, mat: "red" },
      { u0: 0.4, u1: tail - 0.75, y0: 0.84, y1: 0.89, mat: "band" },
      // the black band from the windows to the roof's edge, short of the rear corners
      { u0: 0.4, u1: tail - 0.75, y0: 1.26, y1: 2.8, mat: "band" },
    ],
    pane: KR_PANE, pitch: 1.45, door: KR_DOOR,
    doors: long ? [[0.6, 2.2], [5.5, 7.1], [12.7, 14.3], [16.9, 18.5]] : [[0.6, 2.2], [5.5, 7.1], [10.4, 12.0]],
    windows: long ? [[0.6, 9.65], [11.85, tail - 0.8]] : [[0.6, tail - 0.8]],
    arch: { half: 0.6, side: 0.62, top: 1.06 },
    tyres: { single: [0.95, 1.21], inner: [0.64, 0.9], outer: [0.93, 1.19] },
    bellows: { profile: [[-1.18, 0.4], [1.18, 0.4], [1.18, 2.62], [1.05, 2.84], [0, 2.88], [-1.05, 2.84], [-1.18, 2.62]], folds: 9, depth: 0.05 },
    maxSteerDeg: 50,
    maxBendDeg: 50,
    details: (c) => {
      const { x } = c;
      c.d.fit("front", c.nose, () => {
        windscreen(c, 1.0, 2.5, 1.12, null);
        // the destination box, proud of the windscreen's top and the roof
        block(c.m(), "band", c.nose - 0.62, c.nose - 0.18, 2.5, 3.06, -1.16, 1.16);
        block(c.m(), "signText", c.nose - 0.185, c.nose - 0.165, 2.72, 2.84, -0.7, 0.7);
        // headlamps in the red lower front, the plate between them, black bumper corners
        for (const sd of [-1, 1]) {
          endSlab(c.m(), "frame", c.frame, 1, sd * 0.88 - 0.25, sd * 0.88 + 0.25, 0.66, 0.8, 0.008);
          endSlab(c.m(), "lampHead", c.frame, 1, sd * 0.88 - 0.2, sd * 0.88 + 0.12, 0.68, 0.78, 0.016);
          endSlab(c.m(), "lampAmber", c.frame, 1, sd * 1.13 - 0.06, sd * 1.13 + 0.06, 0.68, 0.78, 0.016);
        }
        endSlab(c.m(), "plateYellow", c.frame, 1, -0.26, 0.26, 0.45, 0.57, 0.016);
      });
      c.d.fit("rear", c.tail, () => {
        endSlab(c.m(), "frame", c.frame, -1, -1.0, 1.0, 2.12, 2.52, 0.01);
        endSlab(c.m(), "glass", c.frame, -1, -0.95, 0.95, 2.16, 2.48, 0.02);
        // the engine flap's grilles on the right, the lamps in a black band, the plate
        for (let i = 0; i < 6; i++) endSlab(c.m(), "grille", c.frame, -1, 0.05, 1.05, 1.1 + i * 0.12, 1.16 + i * 0.12, 0.012);
        endSlab(c.m(), "band", c.frame, -1, -1.22, 1.22, 0.7, 0.88, 0.008);
        for (const sd of [-1, 1]) endSlab(c.m(), "lampRed", c.frame, -1, sd * 0.95 - 0.22, sd * 0.95 + 0.22, 0.73, 0.85, 0.016);
        endSlab(c.m(), "plateYellow", c.frame, -1, 0.02, 0.54, 0.73, 0.85, 0.016);
      });
      // the rear corners' big louvred grilles, both sides
      c.d.fit("rear grilles", c.tail + 0.4, () => {
        for (const sd of [-1, 1]) for (let i = 0; i < 7; i++) sideSlab(c.m(), "grille", c.frame, sd, c.tail + 0.12, c.tail + 0.62, 1.55 + i * 0.15, 1.62 + i * 0.15, 0.012);
      });
      roofBox(c, "roof", x(3.4), x(2.4), -0.45, 0.45, 3.02, "pod", 2.9);
      roofBox(c, "roof", long ? x(18.2) : x(11.7), long ? x(17.2) : x(10.7), -0.45, 0.45, 3.02, "pod", 2.9);
      if (long) {
        // the joint's ends faired up on the roof to its 3.185 m (the XML's roof2 ramps)
        const ramp = (group: string, at: number, end: number, start: number): void => c.d.fit(group, at, () => {
          const profile: Array<[number, number]> = [[end, 2.86], [end, 3.185], [end + (start - end) * 0.2, 3.185], [start, 2.86]];
          c.m().sweep("pod", "z", profile, -1.05, profile, 1.05);
        });
        ramp("joint fairing", x(9.0), x(9.8) + 0.03, x(7.9));
        ramp("joint fairing", x(12.6), x(11.7) - 0.03, x(13.8));
      }
      armMirrors(c, 2.45);
    },
  };
}

export function karosaRenault12(): MeshBuilder {
  return cityBus(karosaRenaultSpec(false));
}

export function karosaRenault18(): MeshBuilder {
  return cityBus(karosaRenaultSpec(true));
}

// --- the Mercedes-Benz Citaro (O 530) -----------------------------------------------
//
// The first-generation Citaro: an upright box with a curved roof edge, a black
// band of bonded glazing, the destination display in a black panel over the
// windscreen, headlamps in the bumper's corners, "rabbit ear" mirrors, the roof
// air-conditioning pod and the engine's air intake tower at the rear left.

function citaroSpec(livery: "teal" | "blue"): CitySpec {
  const colours = livery === "teal"
    ? { body: "#f4f4f1", skirt: "#00a39b", band: "#1d2023", bumper: "#e9eae8", pod: "#e9eae8" }
    : { body: "#123a7a", skirt: "#0d2b5c", band: "#11161d", bumper: "#0d2b5c", pod: "#1a4386" };
  return {
    livery: colours,
    nose: 0.1, tail: 11.8, length: 11.95,
    bodies: [[0.1, 11.8]],
    // 5.845 m wheelbase, 2.869 m without the roof pod (pl.wikipedia); the overhang from the texture
    axles: [{ at: 2.75, dual: false }, { at: 8.595, dual: true, drive: true }],
    wheelRadius: 0.48, hw: 1.27, bottom: 0.27, belt: 1.0, eave: 2.74, roof: 2.869, tumble: 0.01, corner: 0.12,
    front: { from: 1.0, rake: 0.1, cap: 0.12, low: 0.18, chamfer: [0.3, 0.12] },
    rear: { from: 2.6, rake: 0.05, cap: 0.15, low: 0.5, chamfer: [0.2, 0.08] },
    paint: [
      { u0: 0, u1: 12, y0: 0.27, y1: 0.62, mat: "skirt" },
      // the glazing band ends 0.2 m short of the tail: the rear is the body colour (native rear)
      { u0: 0, u1: 11.6, y0: 1.02, y1: 2.68, mat: "band" },
      { u0: 0, u1: 0.4, y0: 0.27, y1: 0.8, mat: "bumper" },
    ],
    pane: { glass: [1.06, 2.62], inset: 0.02, glassMat: "glassDark" },
    pitch: 1.4,
    door: { bottom: 0.3, top: 2.62, leafMat: "frame", panes: [[0.4, 2.54]], leafWidth: 0.66 },
    doors: [[0.75, 2.1], [6.4, 7.75]],
    windows: [[0.7, 11.2]],
    arch: { half: 0.6, side: 0.6, top: 1.04 },
    tyres: { single: [0.96, 1.22], inner: [0.66, 0.92], outer: [0.95, 1.21] },
    maxSteerDeg: 50,
    details: (c) => {
      const { x } = c;
      c.d.fit("front", c.nose, () => {
        // the black panel over the windscreen holds the destination display
        endSlab(c.m(), "band", c.frame, 1, -1.2, 1.2, 2.46, 2.72, 0.006);
        endSlab(c.m(), "signText", c.frame, 1, -0.8, 0.8, 2.52, 2.66, 0.014);
        windscreen(c, 1.12, 2.42, 1.14, null);
        cornerLamps(c, 0.52, 0.7, 0.36, 0.06);
        endSlab(c.m(), "grille", c.frame, 1, -0.5, 0.5, 0.82, 1.02, 0.012);
        endSlab(c.m(), "plate", c.frame, 1, -0.26, 0.26, 0.39, 0.51, 0.016);
      });
      c.d.fit("rear", c.tail, () => {
        endSlab(c.m(), "glassDark", c.frame, -1, -1.0, 1.0, 1.9, 2.48, 0.02);
        endSlab(c.m(), "signText", c.frame, -1, -0.5, 0.5, 2.52, 2.64, 0.012);
        for (let i = 0; i < 6; i++) endSlab(c.m(), "grille", c.frame, -1, -0.9, 0.9, 1.0 + i * 0.12, 1.06 + i * 0.12, 0.012);
        tailLamps(c, 0.62, 0.04);
        endSlab(c.m(), "plate", c.frame, -1, -0.26, 0.26, 0.4, 0.52, 0.016);
      });
      // the air-conditioning pod and the engine's intake tower at the rear left
      roofBox(c, "roof", x(5.6), x(2.6), -0.85, 0.85, 3.1, "pod", 2.84);
      c.d.fit("intake tower", x(11.4), () => {
        block(c.m(), "body", x(11.75), x(10.85), 2.6, 3.2, -1.25, -0.72);
        for (let i = 0; i < 4; i++) block(c.m(), "grille", x(11.65), x(10.95), 2.7 + i * 0.12, 2.76 + i * 0.12, -1.265, -1.24);
      });
      earMirrors(c, 2.74, 0.2);
    },
  };
}

export function mbCitaro(): MeshBuilder {
  return cityBus(citaroSpec("teal"));
}

export function mbCitaroBlue(): MeshBuilder {
  return cityBus(citaroSpec("blue"));
}

// --- the Mercedes-Benz O 345 G -------------------------------------------------------
//
// The articulated O 345: a white high-floor body with black-framed windows, a dark
// rubbing strip, a flat front with a two-piece windscreen under a black
// destination panel, rectangular headlamps low in the corners; the engine at the
// rear of the trailer section.

function o345Spec(): CitySpec {
  return {
    livery: { body: "#f4f4f1", rub: "#3c3c3c", bumper: "#8a8d91", band: "#1d2023", pod: "#e7e8e6" },
    nose: 0.2, tail: 17.8, length: 17.94,
    bodies: [[0.2, 9.75], [11.25, 17.8]],
    // 5.725 m to the middle axle, 2.994 m high (pl.wikipedia); the rest from the texture
    axles: [{ at: 2.69, dual: false }, { at: 8.415, dual: true }, { at: 14.83, dual: true, drive: true }],
    wheelRadius: 0.5, hw: 1.25, bottom: 0.32, belt: 1.5, eave: 2.86, roof: 2.994, tumble: 0.03, corner: 0.12,
    front: { from: 1.3, rake: 0.1, cap: 0.15, low: 0.2, chamfer: [0.3, 0.1] },
    rear: { from: 2.6, rake: 0.06, cap: 0.15, low: 0.4, chamfer: [0.25, 0.1] },
    paint: [
      { u0: 0, u1: 18, y0: 0.76, y1: 0.84, mat: "rub" },
      // the black band under the windscreen, the grey bumpers
      { u0: 0, u1: 0.35, y0: 1.3, y1: 1.46, mat: "band" },
      { u0: 0, u1: 0.45, y0: 0.32, y1: 0.62, mat: "bumper" },
      { u0: 17.6, u1: 18, y0: 0.32, y1: 0.62, mat: "bumper" },
    ],
    pane: { glass: [1.62, 2.66], surround: [1.56, 2.72], inset: 0.05 },
    pitch: 1.7,
    door: { bottom: 0.36, top: 2.66, leafMat: "frame", panes: [[1.1, 2.58], [0.45, 1.02]], leaves: 2 },
    // 2-2-2-2 (pl.wikipedia, the photographs); the texture leaves out the last
    // double doors 1.25 m wide (pl.wikipedia), with their frames 1.3 m
    doors: [[0.75, 2.05], [5.25, 6.55], [11.55, 12.85], [15.85, 17.15]],
    windows: [[0.6, 9.6], [11.4, 17.2]],
    arch: { half: 0.62, side: 0.66, top: 1.1 },
    tyres: { single: [0.95, 1.21], inner: [0.62, 0.9], outer: [0.93, 1.21] },
    bellows: { profile: [[-1.18, 0.45], [1.18, 0.45], [1.18, 2.66], [1.05, 2.86], [0, 2.92], [-1.05, 2.86], [-1.18, 2.66]], folds: 8, depth: 0.05 },
    maxSteerDeg: 50,
    maxBendDeg: 50,
    details: (c) => {
      const { x } = c;
      c.d.fit("front", c.nose, () => {
        // (photographs) one windscreen over the black band, the display behind its top
        windscreen(c, 1.5, 2.74, 1.15, [2.42, 2.68]);
        for (const sd of [-1, 1]) {
          endSlab(c.m(), "frame", c.frame, 1, sd * 0.93 - 0.22, sd * 0.93 + 0.22, 0.76, 0.92, 0.008);
          for (const dz of [-0.1, 0.1]) endLamp(c.m(), "lampHead", c.frame, 1, sd * 0.93 + dz, 0.84, 0.06, 0.016, undefined, 10);
          endLamp(c.m(), "lampHead", c.frame, 1, sd * 0.93, 0.47, 0.045, 0.016, "frame", 8);
        }
        endSlab(c.m(), "plate", c.frame, 1, -0.26, 0.26, 0.45, 0.57, 0.016);
      });
      c.d.fit("rear", c.tail, () => {
        endSlab(c.m(), "frame", c.frame, -1, -1.05, 1.05, 1.6, 2.7, 0.01);
        endSlab(c.m(), "glass", c.frame, -1, -1.0, 1.0, 1.65, 2.64, 0.02);
        tailLamps(c, 0.66, 0.05);
        for (let i = 0; i < 5; i++) endSlab(c.m(), "grille", c.frame, -1, -0.8, 0.8, 0.95 + i * 0.1, 1.0 + i * 0.1, 0.012);
        endSlab(c.m(), "plate", c.frame, -1, -0.26, 0.26, 0.7, 0.82, 0.016);
      });
      // the engine's side grille, at the rear on the right
      c.d.fit("engine grille", x(17.3), () => {
        for (let i = 0; i < 4; i++) sideSlab(c.m(), "grille", c.frame, 1, x(17.6), x(17.25), 0.95 + i * 0.12, 1.02 + i * 0.12, 0.012);
      });
      roofBox(c, "roof", x(3.6), x(2.2), -0.6, 0.6, 3.16, "pod", 2.95);
      for (const [u0, u1] of [[6.0, 6.7], [12.5, 13.2]] as const) roofBox(c, "roof hatches", x(u1), x(u0), -0.4, 0.4, 3.04, "pod", 2.95);
      armMirrors(c, 2.45);
    },
  };
}

export function mbO345g(): MeshBuilder {
  return cityBus(o345Spec());
}

// --- the Solaris Urbino 15 -----------------------------------------------------------
//
// The three-axle Urbino: a low-floor box with a green skirt and roof band, a white
// belt, light glazing between grey pillars, a big windscreen, the roof pods, and a
// tandem of the drive axle and a trailing axle at the rear.

function urbinoSpec(): CitySpec {
  return {
    livery: { body: "#f6f7f5", green: "#25a51a", band: "#1d2125", bumper: "#25a51a", pod: "#f0f1ef" },
    nose: 0.0, tail: 14.0, length: 14.59,
    bodies: [[0.0, 14.0]],
    // 2.70 + 6.80 + 1.69 + 3.40 m (cs.wikipedia); the third axle trails on single tyres
    axles: [{ at: 2.7, dual: false }, { at: 9.5, dual: true, drive: true }, { at: 11.19, dual: false }],
    wheelRadius: 0.48, hw: 1.275, bottom: 0.27, belt: 1.05, eave: 2.72, roof: 2.85, tumble: 0.01, corner: 0.1,
    front: { from: 1.0, rake: 0.14, cap: 0.1, low: 0.18, chamfer: [0.3, 0.12] },
    rear: { from: 2.55, rake: 0.05, cap: 0.15, low: 0.5, chamfer: [0.2, 0.08] },
    paint: [
      { u0: -1, u1: 15, y0: 0.27, y1: 0.75, mat: "green" },
      { u0: -1, u1: 15, y0: 2.6, y1: 2.7, mat: "green" },
      // the black visor over the windscreen, into the roof
      { u0: -1, u1: 0.12, y0: 2.6, y1: 3.0, mat: "band" },
      { u0: -1, u1: 0.25, y0: 0.27, y1: 0.86, mat: "bumper" },
    ],
    pane: { glass: [1.14, 2.54], surround: [1.08, 2.6], inset: 0.05, surroundMat: "band", glassMat: "glassLight" },
    pitch: 1.3,
    door: { bottom: 0.3, top: 2.56, leafMat: "band", panes: [[0.42, 2.48]], leaves: 2 },
    doors: [[0.2, 1.7], [5.2, 6.7], [11.7, 13.2]],
    windows: [[0.2, 13.5]],
    arch: { half: 0.58, side: 0.6, top: 1.02 },
    tyres: { single: [0.98, 1.24], inner: [0.68, 0.94], outer: [0.97, 1.23] },
    maxSteerDeg: 50,
    details: (c) => {
      const { x } = c;
      c.d.fit("front", c.nose, () => {
        windscreen(c, 1.24, 2.56, 1.18, [2.3, 2.52]);
        // the cat's-eye clusters: three round lamps each side, a plate between
        for (const sd of [-1, 1]) {
          endSlab(c.m(), "frame", c.frame, 1, sd * 0.97 - 0.22, sd * 0.97 + 0.22, 0.87, 1.0, 0.008);
          for (const dz of [-0.13, 0, 0.13]) endLamp(c.m(), "lampHead", c.frame, 1, sd * 0.97 + dz, 0.935, 0.045, 0.016, undefined, 8);
        }
        endSlab(c.m(), "plate", c.frame, 1, -0.26, 0.26, 0.42, 0.54, 0.016);
      });
      c.d.fit("rear", c.tail, () => {
        endSlab(c.m(), "glassDark", c.frame, -1, -1.12, 1.12, 1.25, 2.45, 0.02);
        for (const sd of [-1, 1]) for (const y of [1.08, 2.58]) endLamp(c.m(), "lampRed", c.frame, -1, sd * 1.07, y, 0.06, 0.016, "frame", 8);
        endSlab(c.m(), "band", c.frame, -1, -1.22, 1.22, 0.62, 0.96, 0.008);
        endSlab(c.m(), "plate", c.frame, -1, -0.26, 0.26, 0.66, 0.78, 0.016);
      });
      // the engine stands in a tower in the rear left corner: no window there
      c.d.fit("engine tower", x(13.0), () => sideSlab(c.m(), "body", c.frame, -1, x(13.5), x(12.4), 1.06, 2.62, 0.03));
      roofBox(c, "roof", x(5.0), x(2.6), -0.8, 0.8, 3.1, "pod", 2.82);
      roofBox(c, "roof", x(13.6), x(12.4), -0.9, 0.9, 3.05, "pod", 2.82);
      earMirrors(c, 2.7, 0.15);
    },
  };
}

export function solarisUrbino15(): MeshBuilder {
  return cityBus(urbinoSpec());
}

// --- Bus 1 -------------------------------------------------------------------------
//
// vlakosimdb's own generic coach: a plain box, a blue body under a long window
// band, a mint sweep rising toward the rear, and a mint tail.

function bus1Spec(): CitySpec {
  return {
    livery: { body: "#3152a5", mint: "#42e8b0", band: "#1b1d20", bumper: "#26282c", pod: "#3152a5" },
    nose: 0.1, tail: 11.4, length: 11.3,
    bodies: [[0.1, 11.4]],
    axles: [{ u: 2.55, dual: false }, { u: 8.1, dual: true, drive: true }],
    wheelRadius: 0.5, hw: 1.2, bottom: 0.32, belt: 1.6, eave: 2.86, roof: 3.0, tumble: 0.02, corner: 0.1,
    front: { from: 1.3, rake: 0.18, cap: 0.15, low: 0.15, chamfer: [0.2, 0.08] },
    rear: { from: 2.7, rake: 0.05, cap: 0.12, low: 0.4, chamfer: [0.2, 0.08] },
    paint: [
      { u0: -1, u1: 12, y0: 1.6, y1: 2.78, mat: "band" },
      // after the band, so the tail is mint all over (native rear)
      { u0: 10.9, u1: 12, y0: 0.32, y1: 3.1, mat: "mint" },
      { u0: -1, u1: 0.35, y0: 0.32, y1: 0.6, mat: "bumper" },
    ],
    pane: { glass: [1.7, 2.7], surround: [1.64, 2.76], inset: 0.04, glassMat: "glassLight" },
    pitch: 2.0,
    door: { bottom: 0.36, top: 2.7, leafMat: "frame", panes: [[0.45, 2.62]], leafWidth: 0.4 },
    doors: [[0.25, 0.9]],
    windows: [[0.25, 11.0]],
    arch: { half: 0.6, side: 0.66, top: 1.12 },
    tyres: { single: [0.92, 1.18], inner: [0.62, 0.88], outer: [0.91, 1.17] },
    maxSteerDeg: 45,
    details: (c) => {
      const { x } = c;
      // the mint sweep: a band rising from the front wheel to the tail, both sides
      c.d.fit("sweep", x(6), () => {
        for (const s of [-1, 1]) {
          const pts: Array<[number, number]> = [[x(3.5), 1.55], [x(11.0), 1.6], [x(11.0), 0.5], [x(9.5), 0.9]];
          c.m().slab("mint", pts.map(([px, py]): [number, number, number] => [px, py, s * (c.hw + 0.006)]), [0, 0, -s * 0.03]);
        }
      });
      c.d.fit("front", c.nose, () => {
        windscreen(c, 1.45, 2.68, 1.08, [2.42, 2.64]);
        for (const s of [-1, 1]) endSlab(c.m(), "lampHead", c.frame, 1, s * 0.9 - 0.14, s * 0.9 + 0.14, 0.6, 0.72, 0.014);
        endSlab(c.m(), "plate", c.frame, 1, -0.26, 0.26, 0.42, 0.54, 0.016);
      });
      c.d.fit("rear", c.tail, () => {
        tailLamps(c, 0.7, 0.04);
        endSlab(c.m(), "plate", c.frame, -1, -0.26, 0.26, 0.57, 0.69, 0.016);
      });
      armMirrors(c, 2.4);
    },
  };
}

export function bus1(): MeshBuilder {
  return cityBus(bus1Spec());
}
