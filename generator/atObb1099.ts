// The Mariazellerbahn's electric locomotive (proc-vehicle-obb-1099): NOLB E 1-16 of 1911-14,
// BBO E, DR E 99, OBB 1099.001-016, NOVOG E (Krauss Linz and the Austrian Siemens-Schuckert
// works), a C'C' rod-drive locomotive for the 760 mm gauge at 6.5 kV 25 Hz, in the body the
// OBB gave it in 1959-62. Measured on the reference photographs (assets/obb-1099/SOURCES.md;
// docs/models/austria-locos.md):
//
// - the body on the box locomotive kit (boxLocoKit.ts): 10.1 m long over the end walls, 2.4 m
//   wide, the side from 1.15 m to the eave at 3.12 m, the roof rounding to 3.4 m (de.wikipedia's
//   height) and falling in a curve over both end walls; the end walls upright, bowed 4 cm and
//   rounded at the corners (0.22 m), two equal windows from 2.2 m to 2.97 m with a 0.14 m pillar,
//   the round headlights low at +-0.72 m and the top lamp on the roof's curve;
// - per side (photo-obb-1099-011, a projective fit over its two equal cab doors): the cab doors
//   0.58 m wide, 0.77 m from each end, their window from 2.18 m to 2.89 m; from cab 1 the dark
//   louvre (1.15 m), the long and the short ribbed louvre, one window (1.15 m), the low grille
//   under the first louvre and the low hatch under the window; the other side point-symmetric;
// - the running gear (no shared gauge type: the narrow-gauge parts live here): two bogies with
//   outside frames, three coupled axles of 800 mm at 1.2 m, their centres 6.1 m apart (the
//   pivots; 8.5 m total wheelbase), each with its motor driving a jackshaft between the inner and
//   middle axle through the Hall cranks and the slotted coupling rod, and the long brace from the
//   bogie's outer end down to the middle of the locomotive; the Bosna centre coupler at 0.6 m,
//   11.02 m over the couplers;
// - one diamond pantograph (the OBB V with its long reach), 1.6 m off the middle toward cab 1;
// - two liveries: OBB blood orange and ivory ("Jaffa", 1099.011 in 2004) and the NOVOG gold and
//   brown of E 10 and E 7 (2021).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { KIT_PALETTE, c, diamond, insulator, onEnd, onSide, sweepZ } from "./czElectricKit.ts";
import { ELECTRIC_LOCO_CATALOG, tubeX, type Band } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";
import { block, side } from "./vehicleParts.ts";
import { fitLod, lodBogie, lodPantograph, windowBands, type LodPart, type LodShell } from "./lodKit.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];

/** Half the length over the couplers (11.02 m), the buffer beam's face, the end wall. */
const HALF = 5.51;
const BEAM = 5.12;
const END = 5.05;

// --- the body ---------------------------------------------------------------------------

/** The body's bottom, the eave, the crown and half width (2.4 m). */
const Y0 = 1.15;
const EAVE = 3.12;
const CROWN = 3.4;
const W = 1.2;
/** The end wall's centre line [y, |x|]: upright, the roof curving back over it. */
const TIP: Table = [[Y0, END], [EAVE, END], [3.18, END - 0.03], [3.26, END - 0.1], [3.32, END - 0.2], [3.37, END - 0.35], [CROWN, END - 0.55]];
/** The half width: upright sides, the roof's arc. */
const HW: Table = [[Y0, W], [EAVE, W], [3.18, W - 0.03], [3.26, W - 0.12], [3.32, W - 0.3], [3.37, W - 0.56], [CROWN, W - 0.85]];
/** The end's plan: bowed 4 cm, its corners rounded (0.22 m). */
const BOW = 0.04;
function plan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(0.22, 0.4 * w);
  const pts: Array<readonly [number, number]> = [[0, 0]];
  if (w - r > 0.05) pts.push([w - r, BOW]);
  for (const t of [Math.PI / 6, Math.PI / 3, Math.PI / 2]) pts.push([w - r + r * Math.sin(t), BOW + r - r * Math.cos(t)]);
  return pts;
}

/** The cab doors (front half; mirrored to the rear) and their window. */
const DOOR = [3.7, 4.28] as const;
const DOOR_Y = [Y0 + 0.04, 2.99] as const;
const DOOR_WIN = [2.18, 2.89] as const;
/** The side's openings from cab 1 (-x) on the right side; the left side point-symmetric. */
const OPEN_Y = [2.35, 2.92] as const;
const LOUVRE_1 = [-2.68, -1.53] as const;
const LOUVRE_2 = [-1.14, 0.28] as const;
const LOUVRE_3 = [0.69, 1.45] as const;
const WINDOW = [1.88, 3.03] as const;
const WIN_Y = [2.33, 2.88] as const;
const LOW_GRILLE = { x: [-2.34, -1.53] as const, y: [1.28, 1.75] as const };
const LOW_HATCH = { x: [1.85, 2.67] as const, y: [1.24, 1.77] as const };

/** The front windows (z from the centre), the headlights, the top lamp. */
const FRONT_WIN = { z: [0.07, 1.0] as const, y: [2.2, 2.97] as const };
const HEAD = { z: 0.72, y: 1.78, r: 0.13 };

// --- the running gear --------------------------------------------------------------------

/** The bogies' centres (the pivots, 6.1 m apart), the axles' offsets, the 800 mm wheels. */
const BOGIE_X = 3.05;
const AXLES = [-1.2, 0, 1.2] as const;
const WHEEL_R = 0.4;
const SPOKES = 10;
/** The wheels' tyres on the 760 mm gauge, the outside frame, the cranks, the rods and the brace (|z|). */
const TYRE_Z = [0.34, 0.45] as const;
const FRAME_Z = [0.62, 0.68] as const;
const CRANK_Z = [0.7, 0.76] as const;
const ROD_Z = [0.78, 0.83] as const;
const BRACE_Z = [0.86, 0.91] as const;
/** The jackshaft between the inner and the middle axle (from the middle of the locomotive), its height. */
const JACK = { x: 2.45, y: 0.66, r: 0.36 };
const CRANK = 0.17;
const PHI = Math.PI / 5;
/** The brace from the bogie's outer end down to the middle: [x, y] from the middle. */
const BRACE: Table = [[0.06, 0.5], [1.6, 0.5], [4.55, 0.86]];
const COUPLER_Y = 0.6;

/** The pantograph: |x| toward cab 1 (-x), its base, the roof line's insulator. */
const PANTO_X = -1.6;
const PANTO_BASE = CROWN + 0.22;

// --- liveries ---------------------------------------------------------------------------

interface Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  /** The side and end bands. */
  bands: readonly Band[];
  /** The front's lettering and the side's (none when empty). */
  frontNumber: string;
  sideNumber: string;
  /** The first louvre's slats dark and the low grille's in the body colour (OBB), or both in the slat colour (NOVOG). */
  darkLouvre: boolean;
  /** The front's emblem: the OBB's or the Oetscherbaer's. */
  emblem: "obb" | "bear";
}

const RUNNING: Record<string, MaterialSpec> = {
  black: c("#1d1e20", 0.75), wheel: c("#1d1e20", 0.7), tyre: c("#4d5052", 0.45), rod: c("#8a2a22", 0.55),
  plate: c("#1c1d1f", 0.5), rubber: c("#1a1b1d", 0.8), underframe: c("#1d1e20", 0.75), bogie: c("#1d1e20", 0.75),
  green: c("#2f6b3a"), white: c("#f2f0ea", 0.5), darkSlat: c("#6b6e70", 0.6),
};

/** The Jaffa layout: the lower colour to 2.06 m, a light line, a pinstripe in the lower colour, the light upper part. */
const jaffa = (eaveLine: boolean): readonly Band[] => [
  [Y0, 1.21, "upper"], [1.21, 2.06, "paint"], [2.06, 2.12, "upper"], [2.12, 2.16, "paint"],
  ...(eaveLine ? [[2.16, 3.07, "upper"], [3.07, EAVE, "paint"]] as Band[] : [[2.16, EAVE, "upper"]] as Band[]),
  [EAVE, 3.6, "roof"],
];

const LIVERIES: Record<string, Livery> = {
  // 1099.011 at Mariazell in December 2004: blood orange and ivory, the orange line at the eave
  bloodOrange: {
    title: "Blood orange",
    palette: { paint: c("#d4462a"), upper: c("#e6d6b4"), roof: c("#4b4a47", 0.8), slat: c("#e0cfab"), pantograph: { color: "#9c2f25", metallic: 0.2, roughness: 0.6 }, emblem: c("#f2f0ea", 0.5) },
    bands: jaffa(true), frontNumber: "1099.011-7", sideNumber: "1099.011-7", darkLouvre: true, emblem: "obb",
  },
  // E 10 (1099.010) at Mariazell, repainted for the 2021 season: gold over brown, the light grey roof
  brown: {
    title: "Gold and brown",
    palette: { paint: c("#7a4630"), upper: c("#c48f45"), roof: c("#c4c4bf", 0.7), slat: c("#b9bbb8"), pantograph: { color: "#c22a26", metallic: 0.2, roughness: 0.6 }, emblem: c("#c48f45") },
    bands: jaffa(false), frontNumber: "E 10", sideNumber: "", darkLouvre: false, emblem: "bear",
  },
};

export const OBB1099_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Livery => LIVERIES[resolveParams(OBB1099_PARAMS, v).livery!]!;

/** An item on the right side and its point-symmetric twin on the left side. */
function both(it: SideItem): SideItem[] {
  return [{ ...it, sides: [1] }, { ...it, name: `${it.name} left`, x: [-it.x[1], -it.x[0]], sides: [-1] }];
}

function spec(l: Livery): LocoSpec {
  const sideItems: SideItem[] = [
    { kind: "door", name: "cab door", x: DOOR, y: DOOR_Y, win: DOOR_WIN, mirror: true, rails: true },
    ...both({ kind: "grille", name: "first louvre", x: LOUVRE_1, y: OPEN_Y, slats: "h", pitch: 0.075, mat: l.darkLouvre ? "darkSlat" : "slat", r: 0.04 }),
    ...both({ kind: "grille", name: "long louvre", x: LOUVRE_2, y: OPEN_Y, slats: "v", pitch: 0.06, mat: "slat", r: 0.04 }),
    ...both({ kind: "grille", name: "short louvre", x: LOUVRE_3, y: OPEN_Y, slats: "v", pitch: 0.06, mat: "slat", r: 0.04 }),
    ...both({ kind: "window", name: "window", x: WINDOW, y: WIN_Y, mat: "rubber", r: 0.06 }),
    ...both({ kind: "grille", name: "low grille", x: LOW_GRILLE.x, y: LOW_GRILLE.y, slats: "h", pitch: 0.06, mat: l.darkLouvre ? "paint" : "slat", r: 0.03 }),
    ...both({ kind: "panel", name: "low hatch", x: LOW_HATCH.x, y: LOW_HATCH.y, mat: "paint", r: 0.08 }),
  ];
  const endItems: EndItem[] = [
    { kind: "window", name: "front window left", z: FRONT_WIN.z, y: FRONT_WIN.y, wiper: true },
    { kind: "window", name: "front window right", z: [-FRONT_WIN.z[1], -FRONT_WIN.z[0]], y: FRONT_WIN.y },
    { kind: "lamp", name: "top headlight", z: [-0.08, 0.08], y: [3.17, 3.33], r: 0.07 },
  ];
  return {
    palette: { ...RUNNING, ...l.palette },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan: plan,
    corner: "end",
    side: l.bands,
    end: l.bands,
    roof: "roof",
    buffers: HALF,
    beam: BEAM,
    centreCoupler: COUPLER_Y,
    frame: { y0: 0.96, y1: Y0 + 0.02, half: END - 0.05, hw: 1.12, mat: "black" },
    bogies: [],
    sideItems,
    endItems,
    roofItems: [],
    // the reservoirs and the battery box between the bogies
    underItems: [[-1.2, 1.2, 0.6, 0.96, 0.55]],
    number: l.frontNumber,
  };
}

// --- the body's extras ----------------------------------------------------------------------

/** White (or gold) lettering on a face: `at` maps (u, v, d). */
function word(m: MeshBuilder, mat: string, at: (u: number, v: number, d: number) => Vec3, n: Vec3, text: string, uc: number, v0: number, h: number, flip: boolean): void {
  const w = wordWidth(text, h, { weight: 0.14 });
  const tris = letters(text, flip ? uc + w / 2 : uc - w / 2, v0, h, flip, { weight: 0.14 });
  m.facets(mat, tris.map(([u, v]) => at(u, v, 0.006)), n);
}

/** A flat shape laid on a face at depth d. */
function shape(m: MeshBuilder, mat: string, at: (u: number, v: number, d: number) => Vec3, n: Vec3, ring: Ring, d: number): void {
  const pts: Vec3[] = [];
  for (let i = 1; i + 1 < ring.length; i++) pts.push(at(ring[0]![0], ring[0]![1], d), at(ring[i]![0], ring[i]![1], d), at(ring[i + 1]![0], ring[i + 1]![1], d));
  m.facets(mat, pts, n);
}

function bodyExtras(m: MeshBuilder, l: Livery): void {
  const s = spec(l);
  const sp = shellOf(s);
  m.scope("front lettering", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      // seen from ahead +z is on the left at the front (+x): mirror u there
      const flip = e > 0;
      const U = (u: number) => (flip ? u : -u);
      m.scope(e > 0 ? "front" : "rear", () => {
        if (l.emblem === "obb") {
          // the number over the left headlight, the OBB emblem between the headlights
          word(m, "white", at, n, l.frontNumber, U(0.58), 1.96, 0.075, flip);
          m.scope("emblem", () => {
            shape(m, "emblem", at, n, ngon(14, 0.15, 0, U(0), 1.68).map(([u, v]) => [u * 1.25 - U(0) * 0.25, v] as const) as Ring, 0.006);
            for (const dv of [-0.05, 0.05]) {
              const q: Ring = [[-0.13, 1.68 + dv - 0.02], [0.08, 1.68 + dv + 0.04], [0.08, 1.68 + dv + 0.065], [-0.13, 1.68 + dv + 0.005]];
              shape(m, "paint", at, n, q.map(([u, v]) => [U(u), v] as const) as Ring, 0.009);
            }
          });
        } else {
          // the bear's head over "E 10" between the headlights
          m.scope("emblem", () => {
            shape(m, "emblem", at, n, ngon(14, 0.11, 0, 0, 1.92), 0.006);
            for (const du of [-0.08, 0.08]) shape(m, "emblem", at, n, ngon(8, 0.045, 0, du, 2.01), 0.006);
            for (const du of [-0.04, 0.04]) shape(m, "paint", at, n, ngon(6, 0.015, 0, du, 1.94), 0.009);
          });
          word(m, "emblem", at, n, l.frontNumber, 0, 1.52, 0.1, flip);
        }
      });
    }
  });
  m.scope("side lettering", () => {
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      const n: Vec3 = [0, 0, sd];
      const X = (x: number) => sd * x;
      if (l.sideNumber) word(m, "white", at, n, l.sideNumber, X(-0.35), 1.84, 0.12, sd < 0);
      if (l.emblem === "obb")
        m.scope("coat of arms", () => {
          // the white shield with the green tree (Puchenstuben's, 1099.011)
          const x0 = X(1.2);
          const sh: Ring = [[-0.21, 1.95], [0.21, 1.95], [0.21, 1.6], [0, 1.36], [-0.21, 1.6]];
          shape(m, "white", at, n, (sd > 0 ? sh : [...sh].reverse()).map(([u, v]) => [x0 + u, v] as const) as Ring, 0.006);
          const tree: Ring = [[0, 1.86], [0.13, 1.62], [0.03, 1.62], [0.03, 1.5], [-0.03, 1.5], [-0.03, 1.62], [-0.13, 1.62]];
          shape(m, "green", at, n, (sd > 0 ? [...tree].reverse() : tree).map(([u, v]) => [x0 + u, v] as const) as Ring, 0.009);
        });
    }
  });
  m.scope("headlights", () => {
    // the round lamps in their housings standing off the end wall, a chrome ring round the lens
    for (const e of [-1, 1])
      for (const z of [-HEAD.z, HEAD.z])
        m.scope(e > 0 ? "front headlight" : "rear headlight", () => {
          const x0 = e * (END - 0.06), x1 = e * (END + 0.07), x2 = e * (END + 0.085);
          const body = ngon(14, HEAD.r + 0.035, 0, z, HEAD.y);
          m.sweep("paint", "x", body, Math.min(x0, x1), body, Math.max(x0, x1));
          m.scope("rim", () => m.tube("rim", "x", z, HEAD.y, HEAD.r + 0.03, HEAD.r - 0.005, Math.min(x1, x2) - e * 0.005, Math.max(x1, x2) - e * 0.005, 14));
          const lens = ngon(14, HEAD.r, 0, z, HEAD.y);
          const [l0, l1] = [e * (END + 0.072), e * (END + 0.078)];
          m.sweep("lampHead", "x", lens, Math.min(l0, l1), lens, Math.max(l0, l1));
        });
  });
  m.scope("headstocks", () => {
    // the bogies' headstocks under the end walls, the Bosna coupler's beam, the tail lamps
    for (const e of [-1, 1]) {
      const [a, b] = e > 0 ? [END - 0.3, BEAM] : [-BEAM, -END + 0.3];
      block(m, "black", a, b, 0.42, 0.98, -0.95, 0.95);
      for (const z of [-0.75, 0.75]) {
        const [p, q] = e > 0 ? [BEAM, BEAM + 0.03] : [-BEAM - 0.03, -BEAM];
        block(m, "lampRed", p, q, 0.82, 0.9, z - 0.04, z + 0.04);
      }
    }
  });
  m.scope("roof line", () => {
    // the cable from the pantograph back over the roof to the insulator over the machine room
    insulator(m, 0.9, 0, CROWN - 0.01, CROWN + 0.18);
    tubeX(m, "copper", 0.018, PANTO_X + 0.6, CROWN + 0.2, 0, 0.9, CROWN + 0.2, 0, 6);
  });
}

// --- the running gear -----------------------------------------------------------------------

const axleY = (r: number, n: number) => r * Math.cos(Math.PI / n);

/** A spoked wheel on side s: tyre, hub, spokes. */
function spokedWheel(m: MeshBuilder, s: number, x: number, ay: number): void {
  const R = WHEEL_R, n = SPOKES * 2, ri = R - 0.06;
  m.scope("tyre", () => m.tube("tyre", "z", x, ay, R, ri, ...side(s, TYRE_Z[0], TYRE_Z[1]), n, -Math.PI / 2 + Math.PI / n));
  m.scope("hub", () => sweepZ(m, "wheel", ngon(8, 0.1, 0, x, ay), side(s, TYRE_Z[0] + 0.01, FRAME_Z[0] - 0.005)));
  m.scope("disc", () => sweepZ(m, "wheel", ngon(n, ri + 0.01, -Math.PI / 2 + Math.PI / n, x, ay), side(s, TYRE_Z[0] + 0.03, TYRE_Z[0] + 0.06)));
}

/** A crank pin's position about (x, y) at angle phi, radius r. */
const pinAt = (x: number, y: number, phi: number, r = CRANK): [number, number] => [x + r * Math.cos(phi), y + r * Math.sin(phi)];

/** A flat bar from A to B on side s between |z| z0 and z1, with round bosses at both ends. */
function bar(m: MeshBuilder, mat: string, s: number, A: readonly [number, number], B: readonly [number, number], w: number, z: Span, boss = 1.35): void {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], v = [-u[1]!, u[0]!];
  const pts: Vec3[] = [[A[0] - v[0]! * w, A[1] - v[1]! * w, s * z[1]], [B[0] - v[0]! * w, B[1] - v[1]! * w, s * z[1]], [B[0] + v[0]! * w, B[1] + v[1]! * w, s * z[1]], [A[0] + v[0]! * w, A[1] + v[1]! * w, s * z[1]]];
  m.slab(mat, s > 0 ? pts : [...pts].reverse(), [0, 0, -s * (z[1] - z[0])]);
  if (boss > 0) for (const p of [A, B]) sweepZ(m, mat, ngon(8, w * boss, 0, p[0], p[1]), side(s, z[0] - 0.004, z[1] + 0.004));
}

/** One bogie (e = +1 under cab 2): wheelsets, the outside frame, the motor, the jackshaft, the rods, the brace. */
function bogieUnit(m: MeshBuilder, e: number): void {
  const ay = axleY(WHEEL_R, SPOKES * 2);
  const xs = AXLES.map((a) => e * (BOGIE_X + a));
  m.bogie(() => {
    for (const x of xs)
      m.scope("wheelset", () => {
        const axle = ngon(8, 0.065, 0, x, ay);
        m.sweep("steel", "z", axle, -CRANK_Z[0] - 0.02, axle, CRANK_Z[0] + 0.02);
        for (const s of [-1, 1]) spokedWheel(m, s, x, ay);
      });
    m.scope("frame", () => {
      const [x0, x1] = [e * (BOGIE_X - 1.62), e * (BOGIE_X + 1.62)].sort((p, q) => p - q) as [number, number];
      for (const s of [-1, 1]) {
        const z = side(s, FRAME_Z[0], FRAME_Z[1]);
        // the top chord, the axle boxes in their horns, the bottom tie
        block(m, "bogie", x0, x1, 0.5, 0.95, ...z);
        for (const x of xs) block(m, "bogie", x - 0.15, x + 0.15, ay - 0.16, 0.5, ...z);
        block(m, "bogie", x0 + 0.1, x1 - 0.1, ay - 0.22, ay - 0.16, ...z);
        block(m, "bogie", x0, x0 + 0.12, 0.3, 0.5, ...z);
        block(m, "bogie", x1 - 0.12, x1, 0.3, 0.5, ...z);
      }
      // the transoms
      for (const x of [x0 + 0.05, x1 - 0.05]) block(m, "bogie", x - 0.05, x + 0.05, 0.5, 0.92, -FRAME_Z[0], FRAME_Z[0]);
    });
    m.scope("motor", () => {
      const mx = e * (BOGIE_X - 0.1);
      sweepZ(m, "black", ngon(12, 0.3, 0, mx, 0.8), [-0.42, 0.42]);
    });
    m.scope("jackshaft", () => {
      const jx = e * JACK.x;
      const shaft = ngon(10, 0.1, 0, jx, JACK.y);
      m.sweep("black", "z", shaft, -CRANK_Z[1] + 0.02, shaft, CRANK_Z[1] - 0.02);
    });
    m.scope("rods", () => {
      for (const s of [-1, 1]) {
        const phi = s > 0 ? PHI : PHI + Math.PI / 2;
        const pins = xs.map((x) => pinAt(x, ay, phi));
        for (const [i, x] of xs.entries())
          m.scope(`crank ${i + 1}`, () => {
            // the Hall crank outside the frame: a counterweighted disc and the pin
            sweepZ(m, "wheel", ngon(10, 0.23, 0, x, ay), side(s, CRANK_Z[0], CRANK_Z[1]));
            sweepZ(m, "steel", ngon(6, 0.04, 0, pins[i]![0], pins[i]![1]), side(s, CRANK_Z[1] - 0.005, ROD_Z[1] + 0.02));
          });
        m.scope("jackshaft crank", () => {
          sweepZ(m, "wheel", ngon(16, JACK.r, 0, e * JACK.x, JACK.y), side(s, CRANK_Z[0], CRANK_Z[1]));
          const q = pinAt(e * JACK.x, JACK.y, phi);
          sweepZ(m, "steel", ngon(6, 0.04, 0, q[0], q[1]), side(s, CRANK_Z[1] - 0.005, ROD_Z[1] + 0.02));
          // the triangular link down to the coupling rod's slot
          const foot = [q[0], ay + CRANK * Math.sin(phi)] as const;
          bar(m, "rod", s, q, foot, 0.045, ROD_Z);
          bar(m, "rod", s, q, [foot[0] - e * 0.28, foot[1]], 0.035, ROD_Z, 0);
        });
        m.scope("coupling rod", () => bar(m, "rod", s, pins[0]!, pins[2]!, 0.045, ROD_Z));
        m.scope("brace", () => {
          const pts = BRACE.map(([x, y]) => [e * x, y] as const);
          for (let i = 0; i + 1 < pts.length; i++) bar(m, "bogie", s, pts[i]!, pts[i + 1]!, 0.05, BRACE_Z, 0);
          // its posts up to the frame at the bend and at the outer end
          bar(m, "bogie", s, pts[1]!, [pts[1]![0], 0.95], 0.04, BRACE_Z, 0);
          bar(m, "bogie", s, pts[2]!, [pts[2]![0], 0.97], 0.04, BRACE_Z, 0);
        });
      }
    });
  });
}

/** The OBB 1099 in a livery. */
export function obb1099(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const m = buildBoxLoco(spec(l));
  m.scope("body", () => bodyExtras(m, l));
  m.scope("roof equipment", () => m.scope("pantograph", () => diamond(m, { xc: PANTO_X, roofY: CROWN, baseY: PANTO_BASE, raised: true, arm: 1.5 })));
  m.scope("running gear", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "bogie 2" : "bogie 1", () => bogieUnit(m, e));
  });
  return m;
}

// --- low level of detail ------------------------------------------------------------

/** The distant model: the body with its windows, the frame, the two bogies and the raised pantograph. */
export function obb1099Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const shell: LodShell = {
    y0: Y0, tip: [[Y0, END], [EAVE, END], [3.22, END - 0.08], [3.33, END - 0.25], [CROWN, END - 0.55]],
    hw: [[Y0, W], [EAVE, W], [3.22, W - 0.1], [3.33, W - 0.4], [CROWN, W - 0.85]],
    setback: [[Y0, 0.22], [CROWN, 0.1]],
    side: l.bands, end: l.bands, roof: "roof",
    sideWindows: windowBands([{ u: WINDOW, y: WIN_Y }], 0).map((w) => ({ ...w, optional: 2 })),
    endWindows: windowBands([{ u: [-FRONT_WIN.z[1], FRONT_WIN.z[1]], y: FRONT_WIN.y }], 0.4),
  };
  const parts: LodPart[] = [
    { optional: 40, draw: (m) => m.scope("frame", () => block(m, "black", -BEAM, BEAM, 0.97, 1.17, -1.1, 1.1)) },
    { draw: (m) => m.scope("running gear", () => {
      for (const e of [-1, 1]) lodBogie(m, e * BOGIE_X, 1.75, 0.95, 0.85);
    }) },
    { draw: (m) => m.scope("raised pantograph", () => lodPantograph(m, { x: PANTO_X, roofY: CROWN, baseY: PANTO_BASE, h: 1, raised: true })) },
  ];
  return fitLod({ palette: { ...KIT_PALETTE, ...s.palette }, shells: [shell], parts }, 100);
}

/** The registry entry (generator/atLocos.ts): 49.8 t, the 420 kW one-hour rating, 50 km/h (de.wikipedia). */
export const OBB1099_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-1099", title: "OBB 1099", build: obb1099, buildLod: obb1099Lod, params: OBB1099_PARAMS,
  game: { weight: 49.8, power: 420, maxspeed: 50, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, references: "obb-1099",
};
