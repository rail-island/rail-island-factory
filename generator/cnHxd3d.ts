// China Railway's HXD3D, CRRC Dalian's Co'Co' passenger electric of 2012 (25 kV
// 50 Hz, 7,200 kW, 160 km/h), in the production livery (the "red orangutan": red,
// the cab and a wedge behind it maroon, a dark grey skirt), as HXD3D 0080
// (assets/cr-hxd3d/SOURCES.md).
//
// Its own profile tables on the box locomotive kit (boxLocoKit.ts), not the
// generic raked world locomotive: the TRAXX-derived cab - a nearly upright face
// leaning back 0.45 m to the windscreen's head, its corners chamfered, the roof
// rounding down to it with the double top headlight on the slope - the stacked
// pair of headlights in a housing at each side of the red waist band, the dark red
// panel between them with the emblem, "Hexie" (the characters for "harmony") and the number, the cab side window
// ahead of the door, the smooth sides whose only openings are the row of louvres
// along the sloped cantrail, the maroon wedge sweeping from the waist up to the
// cantrail behind each cab, the large white "Hexie" and number in the middle of the
// side, the lower cab and the yellow plough under the face, the automatic coupler.
//
// 22.989 m over the couplers (the face 21.9 m), body 3.0 m wide (real 3.1 m, the
// handrails kept inside the UIC gauge), 4.1 m high; bogie pivots 11.4 m apart,
// the bogie's wheelbase 2.0 + 2.35 m (the longer pair inboard), 1.25 m wheels
// (docs/models/china-locos.md "The HXD3D's body").

import type { MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, onEnd, onSide, type Place } from "./czElectricKit.ts";
import { lettering } from "./cd163.ts";

/** The running number (the Commons photograph of 0080 at Shoupakou). */
export const HXD3D_NUMBER = "HXD3D0080";
/** Half the length over the couplers. */
export const HXD3D_HALF = 22.989 / 2;
/** The face's foot (|x|), half the 21.9 m over the faces. */
const N = 10.95;
const W = 1.5;
const Y0 = 1.25;
/** The grey skirt's top, the red waist band's top (the maroon above it on the cab), the cantrail. */
const SKIRT = 1.5;
const WAIST = 2.37;
const CANT = 3.6;
const ROOF = 4.1;
/** The windscreen's sill and head. */
const SCREEN: readonly [number, number] = [2.62, 3.44];
/** The maroon wedge on each side: its foot at the waist and its head at the cantrail, |x|. */
const WEDGE_FOOT = N - 1.9;
const WEDGE_HEAD = N - 5.6;
const BOGIE_PIVOT = 5.7;

/** The end's centre line [y, |x|]: upright under the waist, leaning back to the windscreen's head, the roof rounding down to it. */
const TIP = [[Y0, N], [SKIRT, N], [WAIST, N - 0.12], [SCREEN[0], N - 0.17], [3.46, N - 0.45], [3.62, N - 0.55], [3.8, N - 0.75], [3.95, N - 1.05], [4.04, N - 1.45], [ROOF, N - 2.2]] as const;
/** The half width: upright sides to the cantrail, the louvre band sloping in, the roof's shoulder. */
const HW = [[Y0, W], [CANT, W], [3.95, 1.28], [4.05, 1.05], [ROOF, 0.7]] as const;
/** The face across: nearly flat to the headlights, the corners chamfered back. */
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.5, 0.02], [w * 0.79, 0.07], [w * 0.9, 0.2], [w, 0.38]] as const;

/** Where the side wall ends at height y. */
const wallEnd = (y: number): number => lerpTable(TIP, y) - endPlan(y, lerpTable(HW, y))[4][1];

// --- the characters "Hexie" as strokes in a unit box (u right, v up), each a convex outline ---
type Stroke = Ring;
/** The strokes' weight: the painted characters are a heavy brush face. */
const BOLD = 0.035;
/** A straight stroke's box, thickened across by BOLD. */
const box = (u0: number, v0: number, u1: number, v1: number): Stroke => {
  if (u1 - u0 < v1 - v0) [u0, u1] = [u0 - BOLD / 2, u1 + BOLD / 2];
  else [v0, v1] = [v0 - BOLD / 2, v1 + BOLD / 2];
  return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
};
/** A slanted stroke from (u0, v0) to (u1, v1), t thick. */
const slant = (u0: number, v0: number, u1: number, v1: number, t: number): Stroke => {
  const l = Math.hypot(u1 - u0, v1 - v0), nu = (-(v1 - v0) / l) * ((t + BOLD) / 2), nv = ((u1 - u0) / l) * ((t + BOLD) / 2);
  const q: Stroke = [[u0 - nu, v0 - nv], [u1 - nu, v1 - nv], [u1 + nu, v1 + nv], [u0 + nu, v0 + nv]];
  // counter-clockwise like rect()
  const area = q.reduce((s, [a, b], i) => { const [c2, d2] = q[(i + 1) % 4]!; return s + a * d2 - c2 * b; }, 0);
  return area >= 0 ? q : [...q].reverse();
};
const HE: Stroke[] = [
  // he: the grain radical
  slant(0.06, 0.86, 0.4, 0.97, 0.08), box(0.02, 0.66, 0.44, 0.74), box(0.19, 0.0, 0.27, 0.9),
  slant(0.21, 0.6, 0.02, 0.24, 0.08), slant(0.27, 0.56, 0.43, 0.4, 0.08),
  // the mouth
  box(0.55, 0.12, 0.62, 0.72), box(0.88, 0.12, 0.95, 0.72), box(0.62, 0.65, 0.88, 0.72), box(0.62, 0.12, 0.88, 0.19),
];
const XIE: Stroke[] = [
  // xie: the speech radical
  slant(0.05, 0.93, 0.15, 0.82, 0.08), box(0.02, 0.57, 0.19, 0.64), box(0.12, 0.08, 0.19, 0.57), slant(0.15, 0.08, 0.28, 0.2, 0.07),
  // bi, over
  box(0.35, 0.56, 0.41, 0.98), box(0.41, 0.74, 0.6, 0.8), box(0.41, 0.56, 0.62, 0.62),
  box(0.7, 0.56, 0.76, 0.98), slant(0.76, 0.76, 0.95, 0.9, 0.06), box(0.76, 0.56, 0.97, 0.62),
  // bai
  slant(0.6, 0.53, 0.68, 0.44, 0.06), box(0.42, 0.0, 0.48, 0.42), box(0.86, 0.0, 0.92, 0.42), box(0.48, 0.36, 0.86, 0.42), box(0.48, 0.18, 0.86, 0.24), box(0.48, 0.0, 0.86, 0.06),
];

/** "Hexie" from (u, v) (bottom left, reading direction +u) at height h: the strokes' outlines. */
function hexie(u: number, v: number, h: number, gap = 0.18): Ring[] {
  return [...HE.map((s) => ({ s, du: 0 })), ...XIE.map((s) => ({ s, du: 1 + gap }))].map(({ s, du }) =>
    s.map(([a, b]) => [u + (a + du) * h, v + b * h] as [number, number]));
}


// --- the running number's letters: the kit's numerals, and H, X, D drawn in the same strokes ---
const LETTERS: Record<string, Array<Array<[number, number]>>> = {
  H: [[[0.14, 0.06], [0.14, 0.94]], [[0.86, 0.06], [0.86, 0.94]], [[0.14, 0.5], [0.86, 0.5]]],
  X: [[[0.12, 0.94], [0.88, 0.06]], [[0.12, 0.06], [0.88, 0.94]]],
  D: [[[0.14, 0.06], [0.14, 0.94], [0.6, 0.94], [0.86, 0.75], [0.86, 0.25], [0.6, 0.06], [0.14, 0.06]]],
};

/** `text` centred at (u, v) on a surface, h high, read toward -u when `flip` (facets() winds them outward). */
function letterOn(m: MeshBuilder, at: Place, n: Vec3, text: string, u: number, v: number, h: number, d: number, flip: boolean): void {
  const w = h * 0.45, gap = h * 0.12, width = text.length * w + (text.length - 1) * gap;
  const u0 = flip ? u + width / 2 : u - width / 2, v0 = v - h / 2;
  const tris: Array<[number, number]> = [];
  [...text].forEach((ch, i) => {
    const cu = i * (w + gap);
    const at0 = flip ? u0 - cu : u0 + cu;
    if (!LETTERS[ch]) { tris.push(...lettering(ch, at0, v0, h, w, gap, flip)); return; }
    for (const line of LETTERS[ch]!)
      for (let j = 1; j < line.length; j++) {
        const [a, b] = line[j - 1]!, [c2, d2] = line[j]!;
        const ua = a * w, va = b * h, ub = c2 * w, vb = d2 * h, l = Math.hypot(ub - ua, vb - va), t = h * 0.045;
        const pu = (-(vb - va) / l) * t, pv = ((ub - ua) / l) * t;
        const q: Array<[number, number]> = [[ua + pu, va + pv], [ub + pu, vb + pv], [ub - pu, vb - pv], [ua - pu, va - pv]];
        for (const k of [0, 1, 2, 0, 2, 3]) { const [qu, qv] = q[k]!; tris.push([flip ? at0 - qu : at0 + qu, v0 + qv]); }
      }
  });
  m.facets("white", tris.map(([a, b]) => at(a, b, d)), n);
}

const mirrorU = (q: Ring): Ring => q.map(([a, b]) => [-a, b] as [number, number]).reverse();

/** The side's lettering: "Hexie" 0.76 m high, the number after it, read from the side. */
const SIDE_CHARS = { h: 0.76, v: 2.05, u: -2.75 };
const SIDE_NUMBER = { h: 0.38, v: 2.24, u: 0.06 };

function sideItems(): SideItem[] {
  const items: SideItem[] = [];
  for (const sd of [1, -1]) {
    // the maroon wedge behind each cab: from the waist under the cab window up to the cantrail
    for (const e of [1, -1]) {
      const at = (x: number) => x;
      const q: Ring = [[at(WEDGE_HEAD), CANT], [at(WEDGE_FOOT), WAIST], [at(wallEnd(WAIST) - 0.01), WAIST], [at(wallEnd(3.46) - 0.01), 3.46], [at(wallEnd(CANT) - 0.01), CANT]];
      const poly = e > 0 ? q : mirrorU(q);
      const xs = poly.map((p) => p[0]);
      items.push({ kind: "paint", name: `${e > 0 ? "front" : "rear"} wedge`, x: [Math.min(...xs), Math.max(...xs)], y: [WAIST, CANT], poly, mat: "maroon", sides: [sd] });
    }
    for (const [i, s] of hexie(SIDE_CHARS.u, SIDE_CHARS.v, SIDE_CHARS.h).entries()) {
      const poly = sd > 0 ? s : mirrorU(s);
      const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
      items.push({ kind: "paint", name: `hexie ${i + 1}`, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], poly, mat: "white", sides: [sd] });
    }
  }
  // the louvres along the sloped cantrail, sixteen a side
  const louvres: SideItem[] = [];
  const pitch = 14.8 / 16;
  for (let i = 0; i < 16; i++) {
    const x0 = -7.4 + i * pitch + 0.05;
    louvres.push({ kind: "grille", name: `louvre ${i + 1}`, x: [x0, x0 + pitch - 0.1], y: [3.63, 3.93], slats: "h", pitch: 0.15, mat: "red" });
  }
  return [
    { kind: "door", name: "cab door", x: [7.95, 8.7], y: [Y0 + 0.08, 3.28], rails: true, mirror: true },
    { kind: "window", name: "cab window", x: [8.85, 9.27], y: [SCREEN[0], 3.22], mat: "rubber", mirror: true, r: 0.06 },
    ...items,
    ...louvres,
  ];
}

function endItems(): EndItem[] {
  const glyphs: EndItem[] = [];
  // the small "Hexie" either side of the emblem on the dark red panel
  for (const [k, [u0, scale]] of ([[-0.62, 0.17], [0.2, 0.17]] as const).entries()) {
    const strokes = k === 0 ? HE : XIE;
    for (const [i, s] of strokes.entries()) {
      const poly = s.map(([a, b]) => [u0 + a * scale * 1.25, 2.1 + b * scale] as [number, number]);
      const zs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
      glyphs.push({ kind: "paint", name: `${k === 0 ? "he" : "xie"} ${i + 1}`, z: [Math.min(...zs), Math.max(...zs)], y: [Math.min(...ys), Math.max(...ys)], poly, mat: "white", layer: 1 });
    }
  }
  const disc = (name: string, r: number, mat: string, layer: number, cy = 2.17): EndItem => ({ kind: "paint", name, z: [-r, r], y: [cy - r, cy + r], poly: ngon(16, r, 0, 0, cy).map(([a, b]) => [a, b] as [number, number]).reverse(), mat, layer });
  return [
    { kind: "window", name: "windscreen left", z: [0.03, 1.1], y: SCREEN, wiper: true },
    { kind: "window", name: "windscreen right", z: [-1.1, -0.03], y: SCREEN, wiper: true },
    // the dark red panel across the waist band, the lamp housings either side
    { kind: "paint", name: "panel", z: [-0.86, 0.86], y: [SKIRT + 0.06, WAIST - 0.04], mat: "darkRed" },
    { kind: "paint", name: "lamp housing left", z: [0.93, 1.21], y: [1.6, 2.28], mat: "rim", poly: [[0.93, 1.64], [0.97, 1.6], [1.17, 1.6], [1.21, 1.64], [1.21, 2.24], [1.17, 2.28], [0.97, 2.28], [0.93, 2.24]] },
    { kind: "paint", name: "lamp housing right", z: [-1.21, -0.93], y: [1.6, 2.28], mat: "rim", poly: [[-1.21, 1.64], [-1.17, 1.6], [-0.97, 1.6], [-0.93, 1.64], [-0.93, 2.24], [-0.97, 2.28], [-1.17, 2.28], [-1.21, 2.24]] },
    { kind: "lamp", name: "headlight left upper", z: [0.99, 1.15], y: [2.02, 2.18], r: 0.08 },
    { kind: "lamp", name: "headlight left lower", z: [0.99, 1.15], y: [1.7, 1.86], r: 0.08 },
    { kind: "lamp", name: "headlight right upper", z: [-1.15, -0.99], y: [2.02, 2.18], r: 0.08 },
    { kind: "lamp", name: "headlight right lower", z: [-1.15, -0.99], y: [1.7, 1.86], r: 0.08 },
    // the emblem: a white ring round the rail section
    disc("emblem ring", 0.13, "white", 1),
    disc("emblem field", 0.1, "darkRed", 2),
    { kind: "paint", name: "emblem rail", z: [-0.022, 0.022], y: [2.06, 2.23], mat: "white", layer: 3 },
    { kind: "paint", name: "emblem head", z: [-0.07, 0.07], y: [2.2, 2.25], mat: "white", layer: 3 },
    { kind: "paint", name: "emblem foot", z: [-0.06, 0.06], y: [2.04, 2.08], mat: "white", layer: 3 },
    ...glyphs,
    // the double top headlight in its dark housing on the roof's slope
    { kind: "paint", name: "top lamp housing", z: [-0.3, 0.3], y: [3.63, 3.86], mat: "black" },
    { kind: "lamp", name: "top headlight left", z: [0.05, 0.24], y: [3.68, 3.81], rect: true },
    { kind: "lamp", name: "top headlight right", z: [-0.24, -0.05], y: [3.68, 3.81], rect: true },
  ];
}

export function hxd3dSpec(): LocoSpec {
  const bands = [[0, SKIRT, "grey"], [SKIRT, 9, "red"]] as const;
  return {
    palette: {
      red: c("#bc1229", 0.5),
      darkRed: c("#9c1024", 0.55),
      maroon: c("#5a1e2a", 0.55),
      grey: c("#4b4e51", 0.65),
      roofRed: c("#a8202e", 0.7),
      white: c("#f1f1ee"),
      hazard: c("#e8b818"),
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: bands,
    end: [[0, SKIRT, "grey"], [SKIRT, WAIST, "red"], [WAIST, 3.56, "maroon"], [3.56, 9, "red"]],
    roof: "roofRed",
    buffers: HXD3D_HALF,
    beam: N,
    centreCoupler: 0.88,
    frame: { y0: 0.9, y1: Y0, half: N - 0.4, hw: 1.42, mat: "grey" },
    bogies: [-1, 1].map((e) => ({ xc: e * BOGIE_PIVOT, axles: [e * 2.175, e * 0.175, -e * 2.175], wheelR: 0.625, frameTop: 0.9 })),
    pantograph: { kind: "singleArm", x: 5.0, roofY: ROOF, baseY: ROOF + 0.15 },
    hvLine: { x: 1.6, y: 4.5, z: 0 },
    sideItems: sideItems(),
    endItems: endItems(),
    roofItems: [
      { name: "main breaker base", x: [-0.9, 0.9], w: [0.45, 0.4], y: [ROOF - 0.01, ROOF + 0.12], mat: "roofRed" },
      { name: "roof hatch", x: [-3.2, -2.0], w: [0.55, 0.5], y: [ROOF - 0.01, ROOF + 0.06], mat: "roofRed" },
    ],
    // the transformer and tanks between the bogies
    underItems: [[-2.7, 2.7, 0.45, 0.9, 1.2]],
    number: HXD3D_NUMBER,
  };
}

/** The lower cab under each face: grey, chamfered like the face, from the frame down to the plough. */
function lowerCabs(m: MeshBuilder): void {
  const plan = endPlan(0, W);
  m.scope("lower cabs", () => {
    for (const e of [1, -1])
      m.scope(e > 0 ? "front" : "rear", () => {
        // its rear edge slanting forward from the body's foot (1.5 m behind the face) to its bottom (1.0 m)
        const ringAt = (back: number): Ring => {
          // counter-clockwise from above for the front; mirrored for the rear
          const half: Ring = [...plan].reverse().map(([z, s]) => [N - s, z] as [number, number]);
          let ring: Ring = [[back, W], ...half, ...plan.slice(1).map(([z, s]) => [N - s, -z] as [number, number]), [back, -W]];
          ring = ring.filter((p, i) => i === 0 || Math.hypot(p[0] - ring[i - 1]![0], p[1] - ring[i - 1]![1]) > 1e-6);
          return e < 0 ? ring.map(([x, z]) => [-x, z] as [number, number]).reverse() : ring;
        };
        m.loft("grey", ringAt(N - 1.0), 0.62, ringAt(N - 1.5), Y0, false);
        m.cap("underframe", ringAt(N - 1.0), 0.62, false);
        // the red air-hose cocks either side of the coupler
        m.scope("hose cocks", () => {
          for (const z of [-0.8, -0.45, 0.45, 0.8]) {
            const [a, b] = [e * N, e * (N + 0.08)].sort((p, q) => p - q) as [number, number];
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
        m.loft("hazard", ring(N - 0.28, 0.2, 1.0), 0.18, ring(N - 0.02, 0.25, 0.95), 0.62, false);
        m.cap("hazard", ring(N - 0.28, 0.2, 1.0), 0.18, false);
        // the black chevrons on the blade's face, leaning in toward the centre
        const face = (z: number, y: number): Vec3 => [X(N - 0.28 + ((y - 0.18) / 0.44) * 0.26 + 0.006), y, z];
        for (const zc of [-0.62, -0.18, 0.26, 0.7]) {
          const pts = [face(zc - 0.12, 0.2), face(zc + 0.02, 0.2), face(zc - 0.04, 0.6), face(zc - 0.18, 0.6)];
          m.facets("black", [pts[0]!, pts[1]!, pts[2]!, pts[0]!, pts[2]!, pts[3]!], [e, 0.3, 0]);
        }
      });
  });
}

/** The numbers: large on each side after the characters, and on the face. */
function numbers(m: MeshBuilder, s: LocoSpec): void {
  const sp = shellOf(s);
  m.scope("lettering", () => {
    for (const sd of [1, -1]) {
      const at = onSide(sp, sd), n: Vec3 = [0, 0, sd];
      const u = SIDE_NUMBER.u;
      m.scope(sd > 0 ? "right number" : "left number", () => letterOn(m, at, n, HXD3D_NUMBER, sd > 0 ? u : -u, SIDE_NUMBER.v, SIDE_NUMBER.h, 0.008, sd < 0));
    }
    for (const e of [1, -1]) {
      const at = onEnd(sp, e), n: Vec3 = [e, 0, 0];
      m.scope(e > 0 ? "front number" : "rear number", () => letterOn(m, at, n, HXD3D_NUMBER, 0, 1.72, 0.11, 0.008, e > 0));
    }
  });
}

/** The horns on the cab roof behind the top headlight. */
function horns(m: MeshBuilder): void {
  m.scope("horns", () => {
    for (const e of [1, -1])
      for (const z of [-0.3, 0.3]) {
        const [a, b] = [e * (N - 2.05), e * (N - 1.72)].sort((p, q) => p - q) as [number, number];
        const small = ngon(8, 0.035, 0, z, ROOF + 0.11), bell = ngon(8, 0.075, 0, z, ROOF + 0.11);
        m.sweep("hazard", "x", e > 0 ? small : bell, a, e > 0 ? bell : small, b);
        const [p, q] = [e * (N - 2.0), e * (N - 1.92)].sort((u, v) => u - v) as [number, number];
        m.prism("grey", [[q, z - 0.03], [q, z + 0.03], [p, z + 0.03], [p, z - 0.03]].reverse() as Ring, ROOF - 0.01, ROOF + 0.06, true);
      }
  });
}

/** The HXD3D in the red and maroon production livery as HXD3D 0080. */
export function crHxd3dBody(): MeshBuilder {
  const s = hxd3dSpec();
  const m = buildBoxLoco(s);
  m.scope("body", () => lowerCabs(m));
  m.scope("body", () => ploughs(m));
  numbers(m, s);
  m.scope("roof equipment", () => horns(m));
  return m;
}

/** The same locomotive for distant views (docs/models/lod.md): the kit's, with the maroon wedges on the sides. */
export function crHxd3dBodyLod(): MeshBuilder {
  const m = boxLocoLod(hxd3dSpec(), 92);
  m.scope("wedges", () => {
    for (const sd of [1, -1])
      for (const e of [1, -1]) {
        const z = sd * (W + 0.012);
        const p = (x: number, y: number): Vec3 => [e * x, y, z];
        const pts = [p(WEDGE_HEAD, CANT), p(WEDGE_FOOT, WAIST), p(wallEnd(WAIST) - 0.05, WAIST), p(WEDGE_HEAD, CANT), p(wallEnd(WAIST) - 0.05, WAIST), p(wallEnd(CANT) - 0.05, CANT)];
        m.facets("maroon", pts, [0, 0, sd]);
      }
  });
  return m;
}
