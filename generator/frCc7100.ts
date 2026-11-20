// The SNCF CC 7100 (proc-vehicle-sncf-cc7100), Alsthom / Fives-Lille's Co'Co' of
// 1952 - 1955 (CC 7107 set the world speed record of 331 km/h in March 1955),
// on the box locomotive kit (boxLocoKit.ts) with its own profile, the sister
// of the NS 1300 (nl1300.ts) and measured on the photographs in
// assets/sncf-cc7100 (SOURCES.md):
//
// - 18.92 m over the buffers (Wikipedia), the body 17.62 m over its end faces
//   at the ledge, 2.97 m wide (the NS 1300's body; a projective fit over the
//   side-on photograph of CC 7121 at Miramas - 98 px/m at the near cab -
//   puts the cab side window at 7.4 - 8.1 m from the centre, the cab door at
//   6.3 - 6.9 m and the portholes at 1.47 and 3.91 m, the 1300's layout);
// - the cab ends (head-on photograph of CC 7107, 174 px/m across the face):
//   a flat face leaning back about 0.2 m from the lamp ledge (1.45 m) to the
//   roof edge (3.62 m), its corners rounded 0.38 m across, the roof rounding
//   back 1 m from the windscreens' head; the two big windscreens (2.88 -
//   3.55 m, each 1.13 m wide either side of a 0.13 m pillar) with wipers
//   pivoting under them; the handrail at 2.62 m running across the face and
//   round the corners back to the cab door; the moulded ledge at 1.45 m; the
//   lower end coming down to 0.8 m as cheeks over the buffers, curving up to
//   the body's bottom (1.08 m) in front of the bogies;
// - the aluminium band (1.93 - 2.22 m) with its blue stripe (2.00 - 2.15 m)
//   round the whole body: on the face the blue is cut into inserts by the
//   number plate and the two big headlamps' aluminium rings (centres 0.94 m
//   out, 1.86 m high), the SNCF roundel over the plate (2.37 m), the small
//   marker lamps in body-coloured pods standing out of the face's corners;
// - the sides: cab window, cab door with handrails, four portholes with
//   aluminium rims (3.05 m), the number in raised aluminium figures behind
//   one cab door and "S N C F" ahead of the other (point symmetric);
// - the roof: the machine room's hatch standing over the cab roofs, the box
//   between the pantographs, two diamond pantographs (the rear raised), the
//   roof line, the horns on each cab roof;
// - the Co'Co' bogies 9.4 m apart, axles 2.43 m apart, 1,250 mm wheels.
//
// Two liveries matched to photographs: `blue` - the blue-green ("vert bleu")
// of CC 7107 as kept at the Cite du Train, Mulhouse - and `green` - the green
// CC 7102 was restored to at Chambery. Both carry the same aluminium and blue
// band; CC 7121 and CC 7102 at the end of service (Miramas, Le Mee) show the
// later two-tone, blue-green above the band and green below, not modelled.

import type { MaterialSpec, MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, onEnd, onSide, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Pt = [number, number];

/** Half the length over the buffers (18.92 m). */
const HALF = 9.46;
/** The end face's |x| at the ledge (the body 17.62 m long). */
const N = 8.81;
/** The body's bottom between the cheeks (over the bogies). */
const Y0 = 1.08;
/** The cheeks' bottom at the ends. */
const CHEEK_Y = 0.8;
/** The moulded ledge across the lower front. */
const LEDGE = 1.45;
/** The aluminium band and its blue stripe. */
const BAND = { lower: [1.93, 2.0] as const, blue: [2.0, 2.15] as const, upper: [2.15, 2.22] as const };
/** The side wall's top (the roof's cant starts), where the roof colour starts, the crown. */
const EDGE = 3.62;
const CAP = 3.7;
const CROWN = 3.98;
/** The body's half width (2.968 m). */
const W = 1.484;
/** The windscreens' and the cab side window's sill and head. */
const SCREEN: readonly [number, number] = [2.88, 3.55];
const CAB_WIN: readonly [number, number] = [2.76, 3.46];
/** The handrail round the cab. */
const RAIL_Y = 2.62;

/** The end's centre line [y, |x|], bottom first: upright to the ledge, then leaning back to the roof edge, the roof. */
const TIP: Table = [
  [Y0, N - 0.03], [1.2, N - 0.01], [LEDGE, N], [BAND.upper[1], N - 0.07], [SCREEN[0], N - 0.13], [SCREEN[1], N - 0.19],
  [EDGE, N - 0.22], [3.72, N - 0.29], [3.82, N - 0.41], [3.9, N - 0.58], [3.95, N - 0.78], [CROWN, N - 1.02],
];
/** The half width [y, hw]: upright walls, the cant and the roof. */
const HW: Table = [
  [Y0, W], [EDGE, W], [3.68, W - 0.02], [3.75, W - 0.06], [3.82, W - 0.14], [3.88, W - 0.27], [3.93, W - 0.45],
  [3.96, W - 0.66], [CROWN, W - 0.9],
];
/** The front corner's radius across and its depth back into the side. */
const CORNER_Z = 0.38;
const CORNER_X = 0.36;
/** How far the face's middle bows ahead of the corners' start. */
const BOW = 0.02;
const ANGLES = [20, 40, 60, 75, 90].map((a) => (a * Math.PI) / 180);

function endPlan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const rz = Math.min(CORNER_Z, w * 0.9);
  const flat = w - rz;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + rz * Math.sin(a), BOW + (CORNER_X - BOW) * (1 - Math.cos(a))] as const)];
}

/** The bogies: pivots 9.4 m apart, axles 2.43 m apart, 1,250 mm wheels. */
const PIVOT = 4.7;
const AXLES = [-2.43, 0, 2.43] as const;
/** The pantographs' centres, the roof hatch's top they stand on. */
const PANTO_X = 4.9;
const HATCH_TOP = 4.06;

/** The cab's side items, front half (drawn at both ends): the window, the door. */
const CAB_WINDOW: readonly [number, number] = [7.4, 8.1];
const CAB_DOOR: readonly [number, number] = [6.3, 6.9];
/** The portholes: centres along x (the same on both sides), height, the rim's radius. */
const PORTHOLES = [-3.91, -1.47, 1.47, 3.91];
const PORT_Y = 3.05;
const PORT_R = 0.25;
/** The big headlamps and the marker lamps in their pods. */
const BIG_LAMP = { z: 0.94, y: 1.86, r: 0.16, ring: 0.23 };
const MARKER = { z: 1.33, y: 1.8, r: 0.12 };
/** The blue number plate in the band. */
const PLATE = { z: [-0.29, 0.29] as const, y: [2.015, 2.155] as const };
/** The SNCF roundel over the number plate. */
const ROUNDEL = { y: 2.37, r: 0.17 };
/** Where the cheeks reach back to, and where they reach their bottom. */
const CHEEK_BACK = N - 2.0;
const CHEEK_FLAT = N - 0.9;

// --- liveries ----------------------------------------------------------------------

interface Livery {
  title: string;
  body: MaterialSpec;
  /** The side number in raised figures, and the one on the front plate. */
  number: string;
  plate: string;
}

const LIVERIES: Record<string, Livery> = {
  // CC 7107 as kept at the Cite du Train, Mulhouse
  blue: { title: "SNCF blue", body: c("#3a978a"), number: "CC 7107", plate: "CC-7107" },
  // CC 7102 as restored at Chambery
  green: { title: "Green", body: c("#3f7d5a"), number: "CC 7102", plate: "CC-7102" },
};

export const CC7100_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Livery => LIVERIES[resolveParams(CC7100_PARAMS, v).livery!]!;

const BANDS: readonly Band[] = [
  [Y0, BAND.lower[0], "body"], [BAND.lower[0], BAND.lower[1], "alu"], [BAND.blue[0], BAND.blue[1], "blue"], [BAND.upper[0], BAND.upper[1], "alu"],
  [BAND.upper[1], CAP, "body"], [CAP, CROWN, "roof"],
];

const disc = (name: string, z: number, y: number, r: number, mat: string, layer: number, n = 16): EndItem =>
  ({ kind: "paint", name, z: [z - r, z + r], y: [y - r, y + r], poly: ngon(n, r, 0, z, y), mat, layer });

/** The face: windscreens, the band's breaks, the lamp rings, the roundel, the plate. */
const END_ITEMS: readonly EndItem[] = [
  { kind: "window", name: "windscreen left", z: [0.065, 1.2], y: SCREEN, mat: "rubber" },
  { kind: "window", name: "windscreen right", z: [-1.2, -0.065], y: SCREEN, mat: "rubber" },
  // the blue stripe broken into inserts: aluminium behind the plate and round each big lamp
  { kind: "paint", name: "band middle", z: [-0.4, 0.4], y: [BAND.blue[0] - 0.005, BAND.blue[1] + 0.005], mat: "alu", layer: 1 },
  { kind: "paint", name: "band left", z: [0.76, 1.1], y: [BAND.blue[0] - 0.005, BAND.blue[1] + 0.005], mat: "alu", layer: 1 },
  { kind: "paint", name: "band right", z: [-1.1, -0.76], y: [BAND.blue[0] - 0.005, BAND.blue[1] + 0.005], mat: "alu", layer: 1 },
  disc("lamp ring left", BIG_LAMP.z, BIG_LAMP.y, BIG_LAMP.ring, "alu", 2),
  disc("lamp ring right", -BIG_LAMP.z, BIG_LAMP.y, BIG_LAMP.ring, "alu", 2),
  disc("roundel ring", 0, ROUNDEL.y, ROUNDEL.r, "alu", 1),
  disc("roundel", 0, ROUNDEL.y, ROUNDEL.r - 0.03, "blue", 2),
  { kind: "paint", name: "number plate", z: PLATE.z, y: PLATE.y, mat: "plate", layer: 3 },
];

// --- the body ----------------------------------------------------------------------

function spec(l: Livery): LocoSpec {
  return {
    palette: {
      body: l.body, roof: l.body, roofHatch: l.body, cheek: l.body,
      alu: { color: "#c9ced1", metallic: 0.6, roughness: 0.3 }, blue: c("#1d4fb5"), plate: c("#1d4fb5"), white: { color: "#d6dadc", metallic: 0.5, roughness: 0.3 },
      rim: { color: "#c3c7c9", metallic: 0.55, roughness: 0.3 }, rubber: c("#1d1e20", 0.8), beam: c("#25272a", 0.75),
      bogie: c("#2f3032", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6), underframe: c("#2c2d2f", 0.75),
      wiper: c("#2b2d30", 0.6), insulator: c("#c9cbc8", 0.4), horn: c("#3a3c3e", 0.5),
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: BANDS,
    end: BANDS,
    roof: "roof",
    buffers: HALF,
    beam: N - 0.03,
    bufferY: 1.03,
    bufferHead: "rect",
    frame: { y0: 0.92, y1: Y0 + 0.01, half: CHEEK_BACK + 0.02, hw: 1.3, mat: "underframe" },
    bogies: [-PIVOT, PIVOT].map((xc) => ({ xc, axles: AXLES, wheelR: 0.625, frameTop: 0.92 })),
    pantograph: { kind: "diamond", x: PANTO_X, roofY: HATCH_TOP, baseY: HATCH_TOP + 0.14 },
    sideItems: [
      { kind: "window", name: "cab window", x: CAB_WINDOW, y: CAB_WIN, mat: "rubber", r: 0.1, mirror: true },
      { kind: "door", name: "cab door", x: CAB_DOOR, y: [1.12, 3.48], rails: true, mirror: true },
      ...PORTHOLES.map((x, i): SideItem => ({ kind: "window", name: `porthole ${i + 1}`, x: [x - PORT_R, x + PORT_R], y: [PORT_Y - PORT_R, PORT_Y + PORT_R], mat: "rim", r: PORT_R })),
    ],
    endItems: END_ITEMS,
    roofItems: [
      { name: "roof hatch", x: [-6.15, 6.15], w: [1.16, 1.1], y: [3.86, HATCH_TOP], mat: "roofHatch" },
      { name: "roof box", x: [-3.2, 1.4], w: [0.8, 0.74], y: [HATCH_TOP - 0.01, HATCH_TOP + 0.2], mat: "roofHatch" },
    ],
    underItems: [[-1.3, 1.3, 0.5, 0.92, 1.0]],
    number: l.plate,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/** The cheeks: the lower end coming down to 0.8 m over the buffers, curving up to the body's bottom in front of the bogies. */
function cheeks(m: MeshBuilder, sp: ShellSpec): void {
  const top = Y0 + 0.02;
  // the side profile (x, y), front end: a flat bottom, a quarter ellipse up to the body's bottom
  const profile: Ring = [[CHEEK_BACK, top], [N - CORNER_X, top], [N - CORNER_X, CHEEK_Y]];
  for (let i = 0; i <= 6; i++) {
    const a = (Math.PI / 2) * (i / 6);
    profile.push([CHEEK_FLAT - (CHEEK_FLAT - CHEEK_BACK) * Math.sin(a), top - (top - CHEEK_Y) * Math.cos(a)]);
  }
  // the front, under the face: the end's plan at the bottom, from z = +w round to -w
  const plan = endPlan(Y0, W - 0.004);
  const face = sp.tip(Y0) - 0.004;
  const ring: Ring = [];
  for (let i = plan.length - 1; i >= 0; i--) ring.push([face - plan[i]![1], plan[i]![0]]);
  for (let i = 1; i < plan.length; i++) ring.push([face - plan[i]![1], -plan[i]![0]]);
  ring.push([N - CORNER_X - 0.01, -(W - 0.004)], [N - CORNER_X - 0.01, W - 0.004]);
  m.scope("cheeks", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const pr: Ring = profile.map(([x, y]) => [e * x, y]);
        m.sweep("cheek", "z", pr, -(W - 0.004), pr, W - 0.004);
        const r: Ring = e > 0 ? ring : ring.map(([x, z]): Pt => [-x, z]).reverse();
        m.loft("cheek", r, CHEEK_Y, r, top, true);
        m.cap("cheek", r, CHEEK_Y, false);
      });
  });
}

/** A rail along the cab's outline at height y: across the face, round the corners and back along the sides to |x| = back. */
function aroundCab(m: MeshBuilder, sp: ShellSpec, mat: string, y: number, back: number, off: number, r: number, n: number): void {
  const plan = sp.endPlan(y);
  const face = sp.tip(y);
  const half: Pt[] = plan.map(([z, b]): Pt => [face - b, z]);
  const pts: Pt[] = [[back, -sp.hw(y)], ...[...half].reverse().map(([x, z]): Pt => [x, -z]), ...half.slice(1), [back, sp.hw(y)]];
  // offset each point outward along its corner's bisector
  const out: Pt[] = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)]!, b = pts[Math.min(pts.length - 1, i + 1)]!;
    const [dx, dz] = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(dx, dz);
    return [p[0] + (dz / l) * off, p[1] - (dx / l) * off];
  });
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front" : "rear", () => {
      for (let i = 1; i < out.length; i++) {
        const [a, b] = [out[i - 1]!, out[i]!];
        m.rod(mat, [e * a[0], y, a[1]], [e * b[0], y, b[1]], r, n, i === 1 || i === out.length - 1);
      }
    });
}

/** The handrail round the cab (on stanchions) and the moulded ledge across the lower front. */
function cabRails(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("cab handrail", () => {
    aroundCab(m, sp, "body", RAIL_Y, CAB_DOOR[1] + 0.12, 0.045, 0.015, 6);
    for (const e of [-1, 1])
      for (const z of [-0.95, -0.35, 0.35, 0.95]) {
        const x = sp.tip(RAIL_Y) - sp.endPlan(RAIL_Y).reduce((b, [zz, s]) => (zz <= Math.abs(z) ? s : b), 0);
        const [a, b] = e > 0 ? [x - 0.02, x + 0.045] : [-x - 0.045, -x + 0.02];
        block(m, "body", a, b, RAIL_Y - 0.012, RAIL_Y + 0.012, z - 0.012, z + 0.012);
      }
  });
  m.scope("ledge", () => aroundCab(m, sp, "body", LEDGE, N - 1.95, 0.015, 0.03, 6));
}

/** The big headlamps (an aluminium housing, the lens) and the marker lamps in their pods. */
function lamps(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("lamps", () => {
    for (const e of [-1, 1])
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "a" : "b"}`, () => {
          const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
          const { z: bz, y: by, r: br } = BIG_LAMP;
          const x = onEnd(sp, 1)(s * bz, by, 0)[0];
          m.scope("headlamp", () => {
            const [a, b] = along(x - 0.03, x + 0.08);
            m.sweep("rim", "x", ngon(12, br, 0, s * bz, by), a, ngon(12, br - 0.02, 0, s * bz, by), b);
            const [l0, l1] = along(x + 0.08, x + 0.095);
            m.scope("lens", () => m.sweep("lampHead", "x", ngon(12, br - 0.045, 0, s * bz, by), l0, ngon(12, br - 0.045, 0, s * bz, by), l1));
          });
          const { z: mz, y: my, r: mr } = MARKER;
          const xm = onEnd(sp, 1)(s * mz, my, 0)[0];
          const xf = sp.tip(my) + 0.1;
          m.scope("marker pod", () => {
            const [a, b] = along(xm - 0.04, xf);
            m.sweep("body", "x", ngon(10, mr, 0, s * mz, my), a, ngon(10, mr, 0, s * mz, my), b);
            const [c0, c1] = along(xf, xf + 0.015);
            m.scope("rim", () => m.sweep("rim", "x", ngon(10, mr - 0.01, 0, s * mz, my), c0, ngon(10, mr - 0.01, 0, s * mz, my), c1));
            const [l0, l1] = along(xf + 0.01, xf + 0.022);
            m.scope("lens", () => m.sweep("lampHead", "x", ngon(10, mr - 0.035, 0, s * mz, my), l0, ngon(10, mr - 0.035, 0, s * mz, my), l1));
          });
        });
  });
}

/** "SNCF" in the roundel and the number on the blue plate, in aluminium. */
function frontLetters(m: MeshBuilder, sp: ShellSpec, l: Livery): void {
  const put = (name: string, text: string, y: number, h: number, weight: number) => {
    const w = wordWidth(text, h, { weight });
    m.scope(name, () => {
      for (const e of [-1, 1]) {
        const at = onEnd(sp, e);
        const tris = letters(text, e > 0 ? w / 2 : -w / 2, y - h / 2, h, e > 0, { weight });
        m.scope(e > 0 ? "front" : "rear", () => m.facets("white", tris.map(([u, v]) => at(u, v, 0.012)), [e, 0, 0]));
      }
    });
  };
  put("roundel letters", "SNCF", ROUNDEL.y, 0.075, 0.2);
  put("plate number", l.plate, (PLATE.y[0] + PLATE.y[1]) / 2, 0.085, 0.16);
}

/** The number in raised aluminium figures behind one cab door, "S N C F" ahead of the other (point symmetric). */
function sideLettering(m: MeshBuilder, sp: ShellSpec, l: Livery): void {
  const h = 0.22, y = 1.6;
  const style = { weight: 0.14 };
  const nw = wordWidth(l.number, h, style);
  const sw = wordWidth("S N C F", h, style);
  m.scope("side lettering", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        // the viewer's right is +x on the right side, -x on the left: the number toward the left end as seen
        const put = (text: string, cx: number, w: number) => {
          const tris = letters(text, sd > 0 ? cx - w / 2 : cx + w / 2, y, h, sd < 0, style);
          m.facets("white", tris.map(([u, v]) => at(u, v, 0.006)), n);
        };
        m.scope("number", () => put(l.number, -sd * (CAB_DOOR[0] - 0.35 - nw / 2), nw));
        m.scope("SNCF", () => put("S N C F", sd * (CAB_DOOR[0] - 0.45 - sw / 2), sw));
      });
  });
}

/** The wipers parked under the windscreens: from a pivot under each pane up toward its outer corner. */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "a" : "b"}`, () => {
          const [p, q]: [Pt, Pt] = [[s * 0.62, SCREEN[0] + 0.03], [s * 1.12, SCREEN[0] + 0.3]];
          const [dx, dy] = [q[0] - p[0], q[1] - p[1]];
          const l = Math.hypot(dx, dy);
          const [nx, ny] = [(-dy / l) * 0.014, (dx / l) * 0.014];
          const arm: Ring = [[p[0] - nx, p[1] - ny], [q[0] - nx, q[1] - ny], [q[0] + nx, q[1] + ny], [p[0] + nx, p[1] + ny]];
          let a = 0;
          for (let i = 0; i < 4; i++) a += arm[i]![0] * arm[(i + 1) % 4]![1] - arm[(i + 1) % 4]![0] * arm[i]![1];
          surfacePanel(m, "wiper", at, n, a > 0 ? arm : [...arm].reverse(), 0.026, 0.04);
        });
    }
  });
}

/** The horns on each cab roof, facing ahead. */
function horns(m: MeshBuilder): void {
  m.scope("horns", () => {
    for (const e of [-1, 1])
      for (const [z, len, r] of [[-0.13, 0.42, 0.075], [0.13, 0.32, 0.06]] as const)
        m.scope(`${e > 0 ? "front" : "rear"} ${z > 0 ? "a" : "b"}`, () => {
          const y = CROWN + 0.13, x0 = N - 1.55;
          const [a, b] = e > 0 ? [x0, x0 + len] : [-x0 - len, -x0];
          m.sweep("horn", "x", ngon(8, 0.025, 0, z, y), e > 0 ? a : b, ngon(8, r, 0, z, y), e > 0 ? b : a);
          block(m, "horn", e * x0 - 0.04, e * x0 + 0.04, CROWN - 0.04, y, z - 0.02, z + 0.02);
        });
  });
}

/** The roof line: a busbar on post insulators along the hatch between the pantographs. */
function roofLine(m: MeshBuilder): void {
  const y = HATCH_TOP + 0.36;
  m.scope("roof line", () => {
    for (const x of [-3.7, -1.2, 1.2, 3.7]) insulator(m, x, 0.92, HATCH_TOP - 0.01, y - 0.02);
    tubeX(m, "copper", 0.02, -(PANTO_X - 0.6), y, 0.92, PANTO_X - 0.6, y, 0.92, 6);
  });
}

/** The vents at the hatch's ends, behind the cab roofs. */
function hatchVents(m: MeshBuilder): void {
  m.scope("hatch vents", () => {
    for (const e of [-1, 1]) {
      const [a, b] = e > 0 ? [6.12, 6.3] : [-6.3, -6.12];
      m.scope(e > 0 ? "front" : "rear", () => block(m, "louvre", a, b, 3.9, HATCH_TOP - 0.03, -0.95, 0.95));
    }
  });
}

/** The SNCF CC 7100 in a livery. */
export function sncfCc7100(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    cheeks(m, sp);
    cabRails(m, sp);
    lamps(m, sp);
    frontLetters(m, sp, l);
    sideLettering(m, sp, l);
    wipers(m, sp);
  });
  m.scope("roof equipment", () => {
    horns(m);
    hatchVents(m);
    roofLine(m);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function sncfCc7100Lod(v?: ParamValues): MeshBuilder {
  const s = spec(liveryOf(v));
  // the band as one blue stripe (its aluminium edges are too thin to keep), the roof in the body colour
  const bands: readonly Band[] = [[Y0, BAND.lower[0], "body"], [BAND.lower[0], BAND.upper[1], "blue"], [BAND.upper[1], CROWN, "body"]];
  return boxLocoLod({ ...s, side: bands, end: bands, roof: "body", roofItems: s.roofItems.slice(0, 1) });
}
