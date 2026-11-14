// The DB class 101 express electric locomotive (proc-vehicle-db-101, Adtranz,
// 1996 - 1999) on the box locomotive kit (boxLocoKit.ts) with its own profile,
// measured on the reference photographs (assets/db-101/SOURCES.md;
// docs/models/germany-trains.md):
//
// - the cab end: a nearly flat face leaning back about 15 degrees below the
//   windscreen and 27 degrees across it, its corners rounding 0.4 - 0.85 m back
//   into the sides; the large two-piece windscreen in a black surround, widening
//   upward as it wraps into the corners; the face ends at 1.3 m over the open,
//   black headstock with the buffers, between two red corner fairings that run
//   down to the skirt (each with its step opening);
// - the two lower headlights in rectangular housings with two lenses each, the
//   top headlight under the windscreen between the two red marker lamps, the
//   wiper hatches; in traffic red the two light grey bars beside the DB emblem;
// - the side: smooth, only the cab door and the cab side window (its front edge
//   following the nose) at each end, the grey skirt over the bogies with the
//   step openings under the doors;
// - the roof: the sides slope in above 3.2 m; over the machine room the slopes
//   are grey panels in three sections with the filter windows (one at one end,
//   two at the other, turned about on the other side), two single-arm
//   pantographs on the flat roof with the roof line between them;
// - two liveries: traffic red (101 104-8) and the light grey Intercity livery
//   with the red stripe of 101 013-1 ("50 years of IC", 2021).

import { ngon, type MeshBuilder, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, kinks, lerpTable, onEnd, onSide, roundRect, singleArm, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { tubeX, type Band } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (19.1 m). */
const HALF = 9.55;
/** The skirt's bottom: the shell's lowest edge. */
const Y0 = 0.58;
/** The top of the grey skirt on the sides; the face's lower edge over the headstock. */
const SKIRT = 1.32;
/** The face's lower edge: the headstock's recess below FACE[0], the full face from FACE[1]. */
const FACE = [1.24, 1.3] as const;
/** The windscreen's sill and head (on the face's centre line). */
const SCREEN = [2.54, 3.2] as const;
/** Where the side walls start sloping in to the roof. */
const EAVES = 3.2;
/** The roof's crown. */
const CROWN = 3.89;
/** The headstock's recess: half its width and its depth behind the face. */
const NOTCH = { hw: 1.04, depth: 0.55 } as const;

/** The face's centre line [y, |x|], bottom first. */
const TIP: Table = [
  [Y0, 9.0], [0.9, 9.07], [FACE[0], 9.07], [FACE[1], 9.06], [1.9, 8.92], [SCREEN[0], 8.73],
  [SCREEN[1], 8.4], [3.5, 8.17], [3.7, 7.95], [3.82, 7.68], [CROWN, 7.25],
];
/** The half width [y, hw]: the skirt tucked in a little, the upright walls, the roof's slopes. */
const HW: Table = [[Y0, 1.46], [0.9, 1.5], [EAVES, 1.5], [3.4, 1.44], [3.6, 1.33], [3.75, 1.2], [3.84, 1.05], [CROWN, 0.85]];
/** The nose corner's width across (m of z) and its depth back into the side (m of x), by height. */
const CORNER_Z: Table = [[Y0, 0.35], [FACE[1], 0.4], [SCREEN[0], 0.55], [SCREEN[1], 0.65], [CROWN, 0.6]];
const CORNER_X: Table = [[Y0, 0.4], [FACE[1], 0.5], [SCREEN[0], 0.7], [SCREEN[1], 0.85], [3.6, 0.85], [CROWN, 0.6]];
/** How far the face's middle bows ahead of the corners' start. */
const BOW = 0.03;
const ANGLES = [15, 30, 45, 60, 75, 90].map((a) => (a * Math.PI) / 180);

/** The end's plan at height y and half width w: the headstock's recess below the face, a flat middle, an elliptic corner. */
function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const rz = Math.min(lerpTable(CORNER_Z, y), w * 0.9);
  const cx = lerpTable(CORNER_X, y);
  const flat = w - rz;
  const face = (z: number) => (BOW * z) / flat;
  const d = y <= FACE[0] + 1e-6 ? NOTCH.depth : 0;
  return [
    [0, d], [NOTCH.hw * 0.5, Math.max(d, face(NOTCH.hw * 0.5))], [NOTCH.hw, Math.max(d, face(NOTCH.hw))], [NOTCH.hw + 0.02, face(NOTCH.hw + 0.02)],
    [flat, BOW], ...ANGLES.map((a) => [flat + rz * Math.sin(a), BOW + (cx - BOW) * (1 - Math.cos(a))] as const),
  ];
}

/** Where the flat side wall ends at height y (the nose corner begins). */
const wallEnd = (y: number) => lerpTable(TIP, y) - lerpTable(CORNER_X, y);
/** The side wall's end over a height span, less a margin. */
const wallEndOver = (y0: number, y1: number, margin = 0.005) => Math.min(...[0, 0.25, 0.5, 0.75, 1].map((t) => wallEnd(y0 + t * (y1 - y0)))) - margin;

// --- liveries ----------------------------------------------------------------------

interface Logo {
  /** The frame, the field inside it and the letters. */
  frame: string;
  field: string;
  text: string;
}

interface Br101Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  /** The body colour's material (hatch covers, lamp housings). */
  body: string;
  /** The running numbers' colour. */
  digits: string;
  number: string;
  sidePaint: readonly SideItem[];
  endPaint: readonly EndItem[];
  /** The DB emblem on the front (height) and on the sides (centre x on the +z side, height, size). */
  frontLogo: Logo;
  sideLogo: Logo & { x: number; y: number; size: readonly [number, number] };
  /** The side number's centre x on the +z side and height; none drawn when absent. */
  sideNumber?: { x: number; y: number };
  /** Big letters on the sides (the "IC"): text, centre x on the +z side, foot, height, colour. */
  sideWord?: { text: string; x: number; y: number; h: number; mat: string };
}

const HOOD = c("#8c9194", 0.6);

/** The IC stripe along the side from nose corner to nose corner, over the doors. */
const IC_STRIPE = [1.44, 1.78] as const;

const LIVERIES: Record<string, Br101Livery> = {
  trafficRed: {
    title: "Traffic red",
    palette: { red: c("#e2001a"), grey: c("#6f7375", 0.6), bar: c("#d3d5d4"), hood: HOOD, white: c("#f1f1ef") },
    side: [[Y0, SKIRT, "grey"], [SKIRT, 4.0, "red"]],
    end: [[Y0, 4.0, "red"]],
    body: "red",
    digits: "white",
    number: "101 104-8",
    sidePaint: [],
    // the two light grey bars either side of the emblem
    endPaint: [-1, 1].map((s): EndItem => ({ kind: "paint", name: s > 0 ? "bar left" : "bar right", z: s > 0 ? [0.29, 1.1] : [-1.1, -0.29], y: [1.86, 2.15], mat: "bar" })),
    frontLogo: { frame: "white", field: "red", text: "white" },
    sideLogo: { frame: "white", field: "red", text: "white", x: 0, y: 2.05, size: [0.56, 0.37] },
    sideNumber: { x: 0, y: 1.68 },
  },
  intercity: {
    title: "Intercity",
    palette: { white: c("#e3e4e2"), grey: c("#b9bcbd", 0.6), red: c("#e2001a"), hood: HOOD, letter: c("#5d6266") },
    side: [[Y0, SKIRT, "grey"], [SKIRT, 4.0, "white"]],
    end: [[Y0, 4.0, "white"]],
    body: "white",
    digits: "letter",
    number: "101 013-1",
    sidePaint: [{ kind: "paint", name: "IC stripe", x: [-wallEndOver(...IC_STRIPE), wallEndOver(...IC_STRIPE)], y: IC_STRIPE, mat: "red" }],
    endPaint: [],
    frontLogo: { frame: "red", field: "white", text: "red" },
    // the small emblem on the stripe behind the cab door
    sideLogo: { frame: "red", field: "white", text: "red", x: 5.75, y: (IC_STRIPE[0] + IC_STRIPE[1]) / 2, size: [0.4, 0.27] },
    sideWord: { text: "IC", x: -4.0, y: 2.2, h: 0.62, mat: "letter" },
  },
};

export const BR101_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Br101Livery => LIVERIES[resolveParams(BR101_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

/** The grey roof slopes over the machine room: |x|, and the joints between their three sections. */
const HOOD_X = 6.0;
const HOOD_JOINTS = [-1.35, 1.35];
/** The filter windows in the slopes on the +z side (centres; turned about on the -z side), half width, y span. */
const HOOD_WINDOWS = { centres: [-5.3, 3.2, 5.3], half: 0.6, y: [3.37, 3.72] as const };
/** The single-arm pantographs: base centre |x|, base height, arm lengths (folded about 2.6 m long on the photographs). */
const PANTO = { x: 5.0, base: CROWN + 0.26, lower: 1.75, upper: 1.65 } as const;
/** The roof line: the insulator inboard of each pantograph, |x|. */
const ROOF_LINE_X = 3.4;
/** The cab door (front half): x span, y span. */
const DOOR = { x: [6.34, 7.08] as const, y: [SKIRT, 3.15] as const };

/** The DB emblem's outer size on the front: width, height. */
const FRONT_LOGO = [0.46, 0.3] as const;
const FRONT_LOGO_Y = 2.0;

/** The emblem's frame and field as rounded outlines (u across, v up) about (cu, cy). */
function logoRings(cu: number, cy: number, [w, h]: readonly [number, number]): [Ring, Ring] {
  const t = h * 0.12;
  return [
    roundRect(cu - w / 2, cu + w / 2, cy - h / 2, cy + h / 2, h * 0.18),
    roundRect(cu - w / 2 + t, cu + w / 2 - t, cy - h / 2 + t, cy + h / 2 - t, h * 0.12),
  ];
}

function sideLogo(l: Br101Livery): SideItem[] {
  const { x: cx0, y: cy, size } = l.sideLogo;
  return [1, -1].flatMap((sd) => {
    const cx = sd * cx0;
    const [frame, field] = logoRings(cx, cy, size);
    const x = [cx - size[0] / 2, cx + size[0] / 2] as const, y = [cy - size[1] / 2, cy + size[1] / 2] as const;
    return [
      { kind: "paint", name: "emblem frame", x, y, poly: frame, mat: l.sideLogo.frame, layer: 2, sides: [sd] },
      { kind: "paint", name: "emblem field", x, y, poly: field, mat: l.sideLogo.field, layer: 3, sides: [sd] },
    ] satisfies SideItem[];
  });
}

function frontLogo(l: Br101Livery): EndItem[] {
  const [frame, field] = logoRings(0, FRONT_LOGO_Y, FRONT_LOGO);
  const z = [-FRONT_LOGO[0] / 2, FRONT_LOGO[0] / 2] as const, y = [FRONT_LOGO_Y - FRONT_LOGO[1] / 2, FRONT_LOGO_Y + FRONT_LOGO[1] / 2] as const;
  return [
    { kind: "paint", name: "emblem frame", z, y, poly: frame, mat: l.frontLogo.frame, layer: 2 },
    { kind: "paint", name: "emblem field", z, y, poly: field, mat: l.frontLogo.field, layer: 3 },
  ];
}

/** An opening with its ends rounded off as points: a hexagon over u0..u1, v0..v1. */
function lozenge(u0: number, u1: number, v0: number, v1: number): Ring {
  const k = (v1 - v0) * 0.4, vm = (v0 + v1) / 2;
  return [[u0 + k, v0], [u1 - k, v0], [u1, vm], [u1 - k, v1], [u0 + k, v1], [u0, vm]];
}

/** The windscreen's outline (z, y) on the face: widening upward as it wraps into the corners. */
const SCREEN_Z = [1.04, 1.2] as const;
/** The cab side window: rear edge, sill and head, its margin behind the nose corner. */
const CAB_WINDOW = { x: 7.16, y: [2.54, 3.15] as const, margin: 0.17, cut: 0.05, round: 0.15 };

function spec(l: Br101Livery, lod = false): LocoSpec {
  const hoodWindows: SideItem[] = [1, -1].flatMap((sd) => HOOD_WINDOWS.centres.map((cx, i): SideItem => ({
    kind: "window", name: `filter window ${i + 1}`, x: [sd * cx - HOOD_WINDOWS.half, sd * cx + HOOD_WINDOWS.half], y: HOOD_WINDOWS.y, mat: "rim", r: 0.03, sides: [sd],
  })));
  const lodOnly: { side: SideItem[]; end: EndItem[]; roof: LocoSpec["roofItems"] } = lod
    ? {
      side: [{ kind: "window", name: "cab window", x: [CAB_WINDOW.x, wallEnd(2.8) - 0.15], y: CAB_WINDOW.y, mirror: true }],
      end: [-1, 1].map((s): EndItem => ({ kind: "window", name: `windscreen ${s}`, z: s > 0 ? [0.03, SCREEN_Z[0]] : [-SCREEN_Z[0], -0.03], y: SCREEN })),
      roof: [{ name: "roof slopes", x: [-HOOD_X, HOOD_X], w: [1.505, 0.86], y: [EAVES, CROWN + 0.01], mat: "hood" }],
    }
    : { side: [], end: [], roof: [] };
  return {
    palette: {
      groove: c("#3a3536", 0.7), rim: c("#a7acae", 0.4), louvre: c("#1f2124", 0.8), rubber: c("#17181a", 0.8),
      tailLamp: { color: "#9e1b1b", roughness: 0.3, lamp: { role: "tail" } },
      bogie: c("#2a2b2d", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: l.body,
    buffers: HALF,
    beam: 8.5,
    bufferY: 1.02,
    bufferHead: "rect",
    // hidden in the body: the skirt hangs below the underframe's sides
    frame: { y0: 0.95, y1: 1.05, half: 8.45, hw: 1.3, mat: "underframe" },
    bogies: [-5.4, 5.4].map((xc) => ({ xc, axles: [-1.325, 1.325], wheelR: 0.625, frameTop: 1.0 })),
    // the full model draws its pantographs itself (their hinges toward the cabs); the distant model takes the kit's
    ...(lod ? { pantograph: { kind: "singleArm" as const, x: PANTO.x, roofY: CROWN, baseY: PANTO.base, lower: PANTO.lower, upper: PANTO.upper } } : {}),
    sideItems: [
      { kind: "door", name: "cab door", x: DOOR.x, y: DOOR.y, rails: true, mirror: true },
      // the grey roof slopes over the machine room, their joints, the filter windows
      { kind: "paint", name: "roof slope", x: [-HOOD_X, HOOD_X], y: [EAVES, CROWN - 0.005], mat: "hood", layer: 1 },
      ...HOOD_JOINTS.map((x, i): SideItem => ({ kind: "paint", name: `roof slope joint ${i + 1}`, x: [x - 0.015, x + 0.015], y: [EAVES + 0.01, CROWN - 0.01], mat: "groove", layer: 2 })),
      ...hoodWindows,
      // the step openings in the skirt under the doors
      ...[[1.15, 1.22], [0.82, 0.89]].map(([y0, y1], i): SideItem => ({ kind: "paint", name: `step ${i + 1}`, x: [6.48, 6.94], y: [y0!, y1!], mat: "louvre", r: 0.03, layer: 1, mirror: true })),
      ...l.sidePaint,
      ...sideLogo(l),
      ...lodOnly.side,
    ],
    endItems: [
      // the open headstock between the corner fairings, and the fairings' step openings
      { kind: "paint", name: "headstock", z: [-NOTCH.hw + 0.01, NOTCH.hw - 0.01], y: [Y0 + 0.02, FACE[0] - 0.02], mat: "black" },
      ...[-1, 1].map((s): EndItem => ({ kind: "paint", name: s > 0 ? "fairing step left" : "fairing step right", z: s > 0 ? [1.14, 1.4] : [-1.4, -1.14], y: [0.8, 0.94], mat: "louvre", poly: lozenge(s > 0 ? 1.14 : -1.4, s > 0 ? 1.4 : -1.14, 0.8, 0.94), layer: 1 })),
      ...l.endPaint,
      ...frontLogo(l),
      { kind: "lamp", name: "top headlight", z: [-0.12, 0.12], y: [2.33, 2.47], rect: true },
      ...[-1, 1].map((s): EndItem => ({ kind: "lamp", name: s > 0 ? "marker lamp left" : "marker lamp right", z: s > 0 ? [0.3, 0.4] : [-0.4, -0.3], y: [2.37, 2.47], rect: true, mat: "tailLamp" })),
      // the wipers' hatches under the windscreen
      ...[-1, 1].flatMap((s): EndItem[] => {
        const z = (s > 0 ? [0.62, 0.95] : [-0.95, -0.62]) as [number, number];
        return [
          { kind: "paint", name: "wiper hatch", z, y: [2.27, 2.43], mat: "groove", layer: 1 },
          { kind: "paint", name: "wiper hatch cover", z: [z[0] + 0.015, z[1] - 0.015], y: [2.285, 2.415], mat: l.body, layer: 2 },
        ];
      }),
      ...lodOnly.end,
    ],
    roofItems: [
      // the flat roof over the machine room, grey like the slopes
      { name: "roof cover", x: [-HOOD_X, HOOD_X], w: [0.9, 0.88], y: [CROWN, CROWN + 0.012], mat: "hood" },
      ...lodOnly.roof,
    ],
    underItems: [[-2.6, 2.6, 0.32, 0.6, 1.15], [-1.6, 1.6, 0.25, 0.32, 0.9]],
    number: l.number,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/** The end's u (z) breaks over a height span: every plan point's z between the heights and at the kinks. */
function uBreaks(sp: ShellSpec, y0: number, y1: number): number[] {
  const hs = [y0, (y0 + y1) / 2, y1, ...kinks(TIP, HW, CORNER_X, CORNER_Z).filter((h) => h > y0 && h < y1)];
  return [...new Set(hs.flatMap((h) => sp.endPlan(h).map(([z]) => z)).flatMap((z) => [z, -z]))].sort((a, b) => a - b);
}

/** The windscreen: the black surround, two panes either side of the pillar, the parked wipers. */
function windscreen(m: MeshBuilder, sp: ShellSpec): void {
  const vB = kinks(TIP, HW);
  const [y0, y1] = SCREEN;
  const uB = uBreaks(sp, y0 - 0.08, y1 + 0.08);
  /** The outline from z = a to the outer edge (widening upward), inset by i. */
  const pane = (a: number, i: number, s: number): Ring => {
    const [zb, zt] = [SCREEN_Z[0] - i, SCREEN_Z[1] - i];
    const [b, t] = [y0 + i, y1 - i];
    const r = 0.07;
    // counter-clockwise in (u, v) for s = +1
    const ring: Ring = [[a, b], [zb, b], [zt - r * 0.4, t - r], [zt - r, t], [a, t]];
    return s > 0 ? ring : ring.map(([u, v]) => [-u, v] as [number, number]).reverse();
  };
  m.scope("windscreen", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        const sur = 0.07;
        // the surround: one trapezoid over both panes
        const outer: Ring = [[-SCREEN_Z[0] - sur, y0 - sur], [SCREEN_Z[0] + sur, y0 - sur], [SCREEN_Z[1] + sur, y1 + sur * 0.6], [-SCREEN_Z[1] - sur, y1 + sur * 0.6]];
        m.scope("surround", () => surfacePanel(m, "rubber", at, n, outer, -0.01, 0.01, uB, vB));
        for (const s of [-1, 1])
          m.scope(s > 0 ? "left pane" : "right pane", () => {
            m.scope("glass", () => surfacePanel(m, "glass", at, n, pane(0.045, 0, s), -0.005, 0.018, uB, vB));
            // the wiper parked along the pane's outer edge
            const zw = SCREEN_Z[0] - 0.09;
            const w: Ring = [[zw - 0.02, y0 + 0.06], [zw + 0.02, y0 + 0.06], [zw + 0.02 + 0.1, y1 - 0.12], [zw - 0.02 + 0.1, y1 - 0.12]];
            m.scope("wiper", () => surfacePanel(m, "rubber", at, n, s > 0 ? w : w.map(([u, v]) => [-u, v] as [number, number]).reverse(), 0.018, 0.03, uB, vB));
          });
      });
  });
}

/** The lower headlights: rectangular housings in the body colour standing off the face, a dark field, two lenses. */
function headlights(m: MeshBuilder, sp: ShellSpec, l: Br101Livery): void {
  const vB = kinks(TIP, HW);
  const [y0, y1] = [1.46, 1.75];
  const uB = uBreaks(sp, y0, y1);
  m.scope("lower headlights", () => {
    for (const e of [-1, 1])
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "right" : "left"}`, () => {
          const at = onEnd(sp, e);
          const n: Vec3 = [e, 0, 0];
          const [z0, z1] = s > 0 ? [0.5, 1.02] : [-1.02, -0.5];
          m.scope("housing", () => surfacePanel(m, l.body, at, n, roundRect(z0, z1, y0, y1, 0.04), -0.01, 0.045, uB, vB));
          m.scope("field", () => surfacePanel(m, "rubber", at, n, roundRect(z0 + 0.04, z1 - 0.04, y0 + 0.04, y1 - 0.04, 0.02), 0.0, 0.05, uB, vB));
          m.scope("lenses", () => {
            for (const f of [0.33, 0.67]) {
              const zc = z0 + (z1 - z0) * f;
              surfacePanel(m, "lampHead", at, n, ngon(12, 0.07, 0, zc, (y0 + y1) / 2), 0.01, 0.056, uB, vB);
            }
          });
        });
  });
}

/** The cab side window: its rear edge upright, its front edge following the nose corner, the top front corner rounded. */
function cabWindowRing(inset: number, e: number): Ring {
  const [y0, y1] = [CAB_WINDOW.y[0] + inset, CAB_WINDOW.y[1] - inset];
  const x0 = CAB_WINDOW.x + inset;
  const [fb, ft] = [wallEnd(CAB_WINDOW.y[0]) - CAB_WINDOW.margin - inset, wallEnd(CAB_WINDOW.y[1]) - CAB_WINDOW.margin - inset];
  const k = CAB_WINDOW.cut;
  const R = CAB_WINDOW.round;
  const fr = fb + ((ft - fb) * (y1 - R - y0)) / (y1 - y0);
  const arc = [0, 30, 60, 90].map((a) => [fr - R + R * Math.cos((a * Math.PI) / 180), y1 - R + R * Math.sin((a * Math.PI) / 180)] as [number, number]);
  const ring: Ring = [[x0 + k, y0], [fb - k, y0], [fb, y0 + k], ...arc, [x0 + k, y1], [x0, y1 - k], [x0, y0 + k]];
  return e > 0 ? ring : ring.map(([u, v]) => [-u, v] as [number, number]).reverse();
}

function cabWindows(m: MeshBuilder, sp: ShellSpec): void {
  const vB = kinks(TIP, HW);
  m.scope("cab windows", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const at = onSide(sp, sd);
          const n: Vec3 = [0, 0, sd];
          m.scope("frame", () => surfacePanel(m, "rubber", at, n, cabWindowRing(-0.03, e), -0.01, 0.012, [], vB));
          m.scope("glass", () => surfacePanel(m, "glass", at, n, cabWindowRing(0.0, e), -0.005, 0.02, [], vB));
        });
  });
}

/** Text on a side, centred at x (seen from that side) with its foot at y. */
function sideText(m: MeshBuilder, sp: ShellSpec, mat: string, text: string, x: number, y: number, h: number, weight: number, sd: number): void {
  const w = wordWidth(text, h, { weight });
  const at = onSide(sp, sd);
  // on the right side (+z) the reader's right is +x
  const tris = letters(text, sd > 0 ? x - w / 2 : x + w / 2, y, h, sd < 0, { weight });
  m.facets(mat, tris.map(([u, v]) => at(u, v, 0.0115)), [0, 0, sd]);
}

/** Text on an end, centred `r` right of the centre line as the reader sees it, its foot at y. */
function endText(m: MeshBuilder, sp: ShellSpec, mat: string, text: string, r: number, y: number, h: number, weight: number, e: number, d = 0.0115): void {
  const w = wordWidth(text, h, { weight });
  const at = onEnd(sp, e);
  // seen from ahead +z is on the reader's left at the front: read toward -z there
  const zc = -e * r;
  const tris = letters(text, e > 0 ? zc + w / 2 : zc - w / 2, y, h, e > 0, { weight });
  m.facets(mat, tris.map(([u, v]) => at(u, v, d)), [e, 0, 0]);
}

/** The emblems' letters, the running numbers and the side lettering. */
function lettering(m: MeshBuilder, sp: ShellSpec, l: Br101Livery): void {
  m.scope("lettering", () => {
    const fh = FRONT_LOGO[1] * 0.56, sh = l.sideLogo.size[1] * 0.56;
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        m.scope("emblem", () => endText(m, sp, l.frontLogo.text, "DB", 0, FRONT_LOGO_Y - fh / 2, fh, 0.2, e));
        m.scope("number", () => endText(m, sp, l.digits, l.number, 0.2, 1.56, 0.1, 0.14, e));
      });
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        m.scope("emblem", () => sideText(m, sp, l.sideLogo.text, "DB", sd * l.sideLogo.x, l.sideLogo.y - sh / 2, sh, 0.2, sd));
        if (l.sideNumber) m.scope("number", () => sideText(m, sp, l.digits, l.number, sd * l.sideNumber!.x, l.sideNumber!.y, 0.1, 0.14, sd));
        if (l.sideWord) m.scope("word", () => sideText(m, sp, l.sideWord!.mat, l.sideWord!.text, sd * l.sideWord!.x, l.sideWord!.y, l.sideWord!.h, 0.16, sd));
      });
  });
}

/**
 * The two single-arm pantographs, their hinges toward the cabs and their knees
 * pointing to the middle (the kit's point the other way): the rear raised, the
 * front folded; the roof line's insulators and leads inboard of them.
 */
function pantographs(m: MeshBuilder): void {
  m.scope("pantographs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front pantograph" : "rear pantograph", () =>
        singleArm(m, { xc: e * PANTO.x, roofY: CROWN, baseY: PANTO.base, h: e, raised: e < 0, lower: PANTO.lower, upper: PANTO.upper }));
  });
  m.scope("high voltage line", () => {
    for (const e of [-1, 1]) {
      insulator(m, e * ROOF_LINE_X, 0, CROWN + 0.002, CROWN + 0.2);
      tubeX(m, "copper", 0.018, e * ROOF_LINE_X, CROWN + 0.2, 0, e * (PANTO.x - 0.6), CROWN + 0.2, 0, 6);
    }
  });
}

/** The DB 101 in a livery. */
export function db101(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    windscreen(m, sp);
    headlights(m, sp, l);
    cabWindows(m, sp);
    lettering(m, sp, l);
  });
  m.scope("roof equipment", () => pantographs(m));
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint, the windscreens and the grey roof slopes as boxes. */
export function db101Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v), true));
}
