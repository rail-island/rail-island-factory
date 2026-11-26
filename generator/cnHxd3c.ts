// China Railway's HXD3C, CNR Dalian's Co'Co' electric of 2010 for passenger and
// freight trains, the first Chinese six-axle AC locomotive with a DC 600 V train
// power supply (25 kV 50 Hz, 7,200 kW, 120 km/h, 138 t), in the class's blue
// "Hexie" livery as HXD3C 0736 of Beijing (assets/cr-hxd3c/SOURCES.md).
//
// Its own profile tables on the box locomotive kit (boxLocoKit.ts), like the
// HXD3D, but with the HXD3 family's flat cab (the HXD3B's carbody): an upright
// lower face with the silver panel across it - the red "Hexie" characters, the CR
// emblem between two grilles, the number under it and a lamp housing at each end
// (headlight over tail lamp) - the two flat windscreens raked back above a
// handrail, the dark grey cab cap rounding back to the roof with the double top
// headlight on it, the blue sides wrapping the face's corners, the grey skirt,
// the white trapezoid in the middle of each side with the red characters and the
// number, the cab window ahead of the cab door, ten dark louvre panels along the
// sloped cantrail, two single-arm pantographs on red-oxide patches (the rear
// raised), two three-axle bogies with the longer wheelbase pair outboard, and
// the lower cab, the plough and the automatic coupler.
//
// 20.846 m over the couplers (published), 19.76 m over the faces, body 3.0 m
// wide (real 3.1 m, the handrails kept inside the UIC gauge), 4.1 m high; bogie
// pivots 9.9 m apart, the bogie's wheelbase 2.25 + 2.0 m, 1.25 m wheels
// (docs/models/china-locos.md "The HXD3C's body").

import type { MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, onEnd, onSide, type Place } from "./czElectricKit.ts";
import { HE, XIE, hexie, letterOn } from "./cnHxd3d.ts";

/** The running number (the Commons photograph of 0736 at Beijing West). */
export const HXD3C_NUMBER = "HXD3C0736";
/** Half the length over the couplers (20.846 m published). */
export const HXD3C_HALF = 20.846 / 2;
/** The face's foot (|x|): the couplers stand 0.54 m ahead of it. */
const N = 9.88;
const W = 1.5;
const Y0 = 1.15;
/** The grey skirt's top (the silver panel's foot on the face), the panel's top, the cantrail, the roof. */
const SKIRT = 1.58;
const PANEL_TOP = 2.38;
const CANT = 3.66;
const ROOF = 4.1;
/** The windscreen's sill and head. */
const SCREEN: readonly [number, number] = [2.69, 3.5];
/** The lower face under the silver panel and the lower cab under it, 0.08 m behind the panel. */
const LOWER = N - 0.08;
const BOGIE_PIVOT = 4.95;
const PANTO_X = 5.0;

/**
 * The end's centre line [y, |x|]: the silver panel standing 0.08 m proud of the upright lower face,
 * the windscreen raked back above it, the cab cap rounding to the roof.
 */
const TIP = [[Y0, LOWER], [SKIRT - 0.03, LOWER], [SKIRT, N], [PANEL_TOP, N], [PANEL_TOP + 0.03, N - 0.1], [SCREEN[0], N - 0.15], [SCREEN[1], N - 0.48], [CANT, N - 0.6], [3.85, N - 0.78], [3.98, N - 0.98], [4.06, N - 1.25], [ROOF, N - 1.6]] as const;
/** The half width: upright sides to the cantrail, the louvre band sloping in, the roof's shoulder. */
const HW = [[Y0, W], [CANT, W], [3.96, 1.12], [ROOF, 0.98]] as const;
/** The face across: flat over the windscreens, the wide blue corners sweeping back 0.48 m. */
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.4, 0.01], [w * 0.6, 0.03], [w * 0.72, 0.06], [w * 0.82, 0.11], [w, 0.48]] as const;

const mirrorU = (q: Ring): Ring => q.map(([a, b]) => [-a, b] as [number, number]).reverse();

/** The white trapezoid on each side: its foot on the skirt, its head under the louvres. */
const TRAPEZOID: Ring = [[-4.05, SKIRT], [4.05, SKIRT], [3.35, CANT], [-3.35, CANT]];
/** The side's red "Hexie" (0.85 m) and the number after it (0.48 m), read from the side. */
const SIDE_CHARS = { h: 0.85, v: 2.25, u: -3.0, gap: 0.35 };
const SIDE_NUMBER = { h: 0.48, v: 2.44, u: 0.9 };
/** The small red number on the cab side under the window. */
const CAB_NUMBER = { h: 0.18, v: 2.3, u: 8.1 };

function sideItems(): SideItem[] {
  const items: SideItem[] = [];
  items.push({ kind: "paint", name: "trapezoid", x: [-4.05, 4.05], y: [SKIRT, CANT], poly: TRAPEZOID, mat: "white" });
  // the dark louvre panels along the sloped cantrail, ten a side
  const louvres: SideItem[] = [];
  const pitch = 1.32;
  for (let i = 0; i < 10; i++) {
    const x0 = -6.6 + i * pitch + 0.04;
    louvres.push({ kind: "panel", name: `louvre ${i + 1}`, x: [x0, x0 + pitch - 0.08], y: [3.71, 3.93], mat: "louvre", r: 0.03 });
  }
  return [
    { kind: "door", name: "cab door", x: [6.88, 7.48], y: [1.75, 3.48], rails: true, mirror: true },
    { kind: "window", name: "cab window", x: [7.74, 8.2], y: [2.66, 3.24], mat: "rim", mirror: true, r: 0.07 },
    { kind: "panel", name: "window handrail", x: [7.7, 8.25], y: [2.5, 2.54], mat: "steel", mirror: true },
    ...items,
    ...louvres,
  ];
}

function endItems(): EndItem[] {
  const disc = (name: string, r: number, mat: string, layer: number, cy = 2.08): EndItem => ({ kind: "paint", name, z: [-r, r], y: [cy - r, cy + r], poly: ngon(16, r, 0, 0, cy).map(([a, b]) => [a, b] as [number, number]).reverse(), mat, layer });
  const housing = (z0: number, z1: number): Ring => [[z0, 1.66], [z0 + 0.04, 1.62], [z1 - 0.04, 1.62], [z1, 1.66], [z1, 2.1], [z1 - 0.04, 2.14], [z0 + 0.04, 2.14], [z0, 2.1]];
  return [
    { kind: "window", name: "windscreen left", z: [0.04, 1.22], y: SCREEN, wiper: true },
    { kind: "window", name: "windscreen right", z: [-1.22, -0.04], y: SCREEN, wiper: true },
    { kind: "paint", name: "handrail", z: [-0.75, 0.75], y: [2.49, 2.53], mat: "steel", layer: 1 },
    // the lamp housings at the silver panel's ends: the headlight over the tail lamp
    { kind: "paint", name: "lamp housing left", z: [1.03, 1.33], y: [1.62, 2.14], mat: "black", poly: housing(1.03, 1.33), layer: 1 },
    { kind: "paint", name: "lamp housing right", z: [-1.33, -1.03], y: [1.62, 2.14], mat: "black", poly: housing(-1.33, -1.03), layer: 1 },
    { kind: "lamp", name: "headlight left", z: [1.11, 1.25], y: [1.88, 2.02], r: 0.07 },
    { kind: "lamp", name: "headlight right", z: [-1.25, -1.11], y: [1.88, 2.02], r: 0.07 },
    { kind: "lamp", name: "tail lamp left", z: [1.11, 1.25], y: [1.66, 1.8], r: 0.065, mat: "lampRed" },
    { kind: "lamp", name: "tail lamp right", z: [-1.25, -1.11], y: [1.66, 1.8], r: 0.065, mat: "lampRed" },
    // the perforated grilles either side of the emblem
    { kind: "grille", name: "grille left", z: [0.25, 0.72], y: [1.82, 2.11], mat: "slat" },
    { kind: "grille", name: "grille right", z: [-0.72, -0.25], y: [1.82, 2.11], mat: "slat" },
    // the CR emblem: a dark ring round the rail's section
    disc("emblem ring", 0.2, "logo", 1),
    disc("emblem field", 0.155, "panel", 2),
    { kind: "paint", name: "emblem rail", z: [-0.025, 0.025], y: [1.97, 2.17], mat: "logo", layer: 3 },
    { kind: "paint", name: "emblem head", z: [-0.075, 0.075], y: [2.14, 2.2], mat: "logo", layer: 3 },
    { kind: "paint", name: "emblem foot", z: [-0.065, 0.065], y: [1.95, 1.99], mat: "logo", layer: 3 },
    // the red marker lamps low on the face
    { kind: "lamp", name: "marker left", z: [1.02, 1.18], y: [1.24, 1.4], r: 0.075, mat: "lampRed" },
    { kind: "lamp", name: "marker right", z: [-1.18, -1.02], y: [1.24, 1.4], r: 0.075, mat: "lampRed" },
    // the double top headlight in its dark housing on the cab cap
    { kind: "paint", name: "top lamp housing", z: [-0.42, 0.42], y: [3.64, 3.9], mat: "black" },
    { kind: "lamp", name: "top headlight left", z: [0.1, 0.26], y: [3.69, 3.85], r: 0.075 },
    { kind: "lamp", name: "top headlight right", z: [-0.26, -0.1], y: [3.69, 3.85], r: 0.075 },
  ];
}

export function hxd3cSpec(): LocoSpec {
  return {
    palette: {
      blue: c("#23479c", 0.5),
      white: c("#d3d7dc", 0.5),
      skirt: c("#5d6368", 0.65),
      face: c("#454d55", 0.6),
      panel: c("#c3c6c9", 0.4),
      roof: c("#7d8286", 0.7),
      patch: c("#a4523e", 0.75),
      hatch: c("#b4b8ba", 0.6),
      letter: c("#c8202a", 0.5),
      hazard: c("#e8b818"),
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "side",
    side: [[0, SKIRT, "skirt"], [SKIRT, 9, "blue"]],
    end: [[0, SKIRT, "face"], [SKIRT, PANEL_TOP, "panel"], [PANEL_TOP, 9, "face"]],
    roof: "roof",
    buffers: HXD3C_HALF,
    beam: N,
    centreCoupler: 0.88,
    frame: { y0: 0.9, y1: Y0, half: N - 0.4, hw: 1.42, mat: "skirt" },
    bogies: [-1, 1].map((e) => ({ xc: e * BOGIE_PIVOT, axles: [e * 2.125, -e * 0.125, -e * 2.125], wheelR: 0.625, frameTop: 0.9 })),
    // the knees toward the middle, the folded arm lying inboard of its base
    pantograph: { kind: "singleArm", x: PANTO_X, roofY: ROOF, baseY: ROOF + 0.15, kneeIn: true },
    hvLine: { x: 2.6, y: 4.4, z: 0 },
    sideItems: sideItems(),
    endItems: endItems(),
    roofItems: [
      // the red-oxide patches under the pantographs
      { name: "front patch", x: [PANTO_X - 1.15, PANTO_X + 1.05], w: [0.9, 0.9], y: [ROOF - 0.01, ROOF + 0.012], mat: "patch" },
      { name: "rear patch", x: [-PANTO_X - 1.05, -PANTO_X + 1.15], w: [0.9, 0.9], y: [ROOF - 0.01, ROOF + 0.012], mat: "patch" },
      { name: "roof hatch", x: [-0.42, 0.42], w: [0.32, 0.29], y: [ROOF - 0.01, ROOF + 0.06], mat: "hatch" },
      { name: "main breaker base", x: [1.3, 2.1], w: [0.3, 0.27], y: [ROOF - 0.01, ROOF + 0.12], mat: "roof" },
    ],
    // the transformer and tanks between the bogies
    underItems: [[-2.1, 2.1, 0.45, 0.9, 1.2]],
    number: HXD3C_NUMBER,
  };
}

/** The lower cab under each face: grey, rounded like the face, from the frame down to the plough. */
function lowerCabs(m: MeshBuilder): void {
  const plan = endPlan(0, W);
  m.scope("lower cabs", () => {
    for (const e of [1, -1])
      m.scope(e > 0 ? "front" : "rear", () => {
        // its rear edge slanting forward from the body's foot (1.5 m behind the face) to its bottom (1.0 m)
        const ringAt = (back: number): Ring => {
          // counter-clockwise from above for the front; mirrored for the rear
          const half: Ring = [...plan].reverse().map(([z, s]) => [LOWER - s, z] as [number, number]);
          let ring: Ring = [[back, W], ...half, ...plan.slice(1).map(([z, s]) => [LOWER - s, -z] as [number, number]), [back, -W]];
          ring = ring.filter((p, i) => i === 0 || Math.hypot(p[0] - ring[i - 1]![0], p[1] - ring[i - 1]![1]) > 1e-6);
          return e < 0 ? ring.map(([x, z]) => [-x, z] as [number, number]).reverse() : ring;
        };
        m.loft("face", ringAt(N - 1.0), 0.62, ringAt(N - 1.5), Y0, false);
        m.cap("underframe", ringAt(N - 1.0), 0.62, false);
        // the red air-hose cocks either side of the coupler
        m.scope("hose cocks", () => {
          for (const z of [-0.8, -0.45, 0.45, 0.8]) {
            const [a, b] = [e * LOWER, e * N].sort((p, q) => p - q) as [number, number];
            m.prism("breaker", [[b, z - 0.05], [b, z + 0.05], [a, z + 0.05], [a, z - 0.05]].reverse() as Ring, 0.94, 1.04, true);
          }
        });
      });
  });
}

/** The plough under each face: a yellow blade leaning back to the rail, black chevrons on it. */
function ploughs(m: MeshBuilder): void {
  m.scope("ploughs", () => {
    for (const e of [1, -1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const X = (x: number) => e * x;
        const ring = (x0: number, back: number, w: number): Ring => {
          const r: Ring = [[X(x0), -w], [X(x0), w], [X(x0 - back), w], [X(x0 - back), -w]];
          return e > 0 ? r : [...r].reverse();
        };
        m.loft("hazard", ring(N - 0.28, 0.2, 1.3), 0.18, ring(N - 0.02, 0.25, 1.25), 0.62, false);
        m.cap("hazard", ring(N - 0.28, 0.2, 1.3), 0.18, false);
        // the black chevrons on the blade's face, leaning in toward the centre
        const face = (z: number, y: number): Vec3 => [X(N - 0.28 + ((y - 0.18) / 0.44) * 0.26 + 0.006), y, z];
        for (const zc of [-0.9, -0.45, 0, 0.45, 0.9]) {
          const pts = [face(zc - 0.12, 0.2), face(zc + 0.02, 0.2), face(zc - 0.04, 0.6), face(zc - 0.18, 0.6)];
          m.facets("black", [pts[0]!, pts[1]!, pts[2]!, pts[0]!, pts[2]!, pts[3]!], [e, 0.3, 0]);
        }
      });
  });
}

/** The red "Hexie" on the face's panel either side of the emblem, seen from outside: [u, v] strokes. */
const FACE_CHARS: Ring[] = ([[-0.68, HE], [0.43, XIE]] as const).flatMap(([u0, strokes]) =>
  strokes.map((st) => st.map(([a, b]) => [u0 + a * 0.25, 2.14 + b * 0.2] as [number, number])));

/** Convex strokes laid flat `d` off a surface as fans of facets (two triangles a stroke, not a paint panel's slabs). */
function strokesOn(m: MeshBuilder, at: Place, n: Vec3, strokes: readonly Ring[], d: number): void {
  for (const st of strokes) {
    const pts: Vec3[] = [];
    for (let i = 1; i + 1 < st.length; i++) for (const [a, b] of [st[0]!, st[i]!, st[i + 1]!]) pts.push(at(a, b, d));
    m.facets("letter", pts, n);
  }
}

/** The red lettering: "Hexie" and the number on the white trapezoid, the number on the cab sides, "Hexie" and the number on the face's panel. */
function numbers(m: MeshBuilder, s: LocoSpec): void {
  const sp = shellOf(s);
  m.scope("lettering", () => {
    for (const sd of [1, -1]) {
      const at = onSide(sp, sd), n: Vec3 = [0, 0, sd];
      // read left to right from either side
      const chars = hexie(SIDE_CHARS.u, SIDE_CHARS.v, SIDE_CHARS.h, SIDE_CHARS.gap);
      m.scope(sd > 0 ? "right hexie" : "left hexie", () => strokesOn(m, at, n, sd > 0 ? chars : chars.map(mirrorU), 0.008));
      const u = SIDE_NUMBER.u;
      m.scope(sd > 0 ? "right number" : "left number", () => letterOn(m, at, n, HXD3C_NUMBER, sd > 0 ? u : -u, SIDE_NUMBER.v, SIDE_NUMBER.h, 0.008, sd < 0, "letter"));
      for (const e of [1, -1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"} cab number`, () => letterOn(m, at, n, HXD3C_NUMBER, e * CAB_NUMBER.u, CAB_NUMBER.v, CAB_NUMBER.h, 0.004, sd < 0, "letter"));
    }
    for (const e of [1, -1]) {
      const at = onEnd(sp, e), n: Vec3 = [e, 0, 0];
      // seen from ahead, +z is on the left at the front
      m.scope(e > 0 ? "front hexie" : "rear hexie", () => strokesOn(m, at, n, e > 0 ? FACE_CHARS.map(mirrorU) : FACE_CHARS, 0.006));
      m.scope(e > 0 ? "front number" : "rear number", () => letterOn(m, at, n, HXD3C_NUMBER, 0, 1.69, 0.15, 0.008, e > 0, "letter"));
    }
  });
}

/** The horns on the cab roof behind the top headlight. */
function horns(m: MeshBuilder): void {
  m.scope("horns", () => {
    for (const e of [1, -1])
      for (const z of [-0.3, 0.3]) {
        const [a, b] = [e * (N - 1.95), e * (N - 1.62)].sort((p, q) => p - q) as [number, number];
        const small = ngon(8, 0.035, 0, z, ROOF + 0.11), bell = ngon(8, 0.075, 0, z, ROOF + 0.11);
        m.sweep("hazard", "x", e > 0 ? small : bell, a, e > 0 ? bell : small, b);
        const [p, q] = [e * (N - 1.9), e * (N - 1.82)].sort((u, v) => u - v) as [number, number];
        m.prism("face", [[q, z - 0.03], [q, z + 0.03], [p, z + 0.03], [p, z - 0.03]].reverse() as Ring, ROOF - 0.01, ROOF + 0.06, true);
      }
  });
}

/** The HXD3C in the blue "Hexie" livery as HXD3C 0736. */
export function crHxd3c(): MeshBuilder {
  const s = hxd3cSpec();
  const m = buildBoxLoco(s);
  m.scope("body", () => lowerCabs(m));
  m.scope("body", () => ploughs(m));
  numbers(m, s);
  m.scope("roof equipment", () => horns(m));
  return m;
}

/** The same locomotive for distant views (docs/models/lod.md): the kit's, with the white trapezoids on the sides. */
export function crHxd3cLod(): MeshBuilder {
  const m = boxLocoLod(hxd3cSpec(), 88);
  m.scope("trapezoids", () => {
    for (const sd of [1, -1]) {
      const z = sd * (W + 0.012);
      const p = ([x, y]: readonly [number, number]): Vec3 => [x, y, z];
      const [a, b, c2, d] = TRAPEZOID.map(p) as [Vec3, Vec3, Vec3, Vec3];
      m.facets("white", [a, b, c2, a, c2, d], [0, 0, sd]);
    }
  });
  // the silver panels across the faces (the kit's distant shell merges their thin band into the face)
  m.scope("panels", () => {
    // on the distant shell's vee face: its centre line from N at the skirt to N - 0.15 at the windscreen's sill,
    // its corners 0.39 - 0.43 m further back at the full width
    const faceX = (z: number, y: number): number => {
      const t = (y - SKIRT) / (SCREEN[0] - SKIRT);
      return N - 0.15 * t - (Math.abs(z) / W) * (0.39 + 0.04 * t) + 0.012;
    };
    for (const e of [1, -1]) {
      const p = (z: number, y: number): Vec3 => [e * faceX(z, y), y, z];
      for (const s of [1, -1]) {
        const [a, b] = s > 0 ? [0, 1.3] : [-1.3, 0];
        m.facets("panel", [p(a, SKIRT), p(b, SKIRT), p(b, PANEL_TOP), p(a, SKIRT), p(b, PANEL_TOP), p(a, PANEL_TOP)], [e, 0, s * 0.26]);
      }
    }
  });
  return m;
}
