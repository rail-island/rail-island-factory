// The Siemens Vectron MS, the Bo'Bo' multi-system electric locomotive of 2010
// on (UIC class 193 in Germany and Austria, where most of the Czech operators'
// units are registered), in the liveries of its Czech operators as one
// `livery` enum: the CD Eurocity scheme of the ELL lease units 193 289-298, the
// RegioJet yellow of the ELL units 193 205-227, and the plain white of the RSL
// units in CD service (193 574 and others). One body, built by the box-cab
// kit (boxLocoKit.ts): the lower nose almost upright, the windscreen raked
// back, the cab ends' wide rounded corners narrowing toward the roof, the sides
// upright to the cant, one cab door a side at each end, the roof grilles, and
// the V-shaped lamp grille of five stripes across the lower nose.
//
// Dimensions (assets/vectron/SOURCES.md): 18.98 m over the buffers, 3.01 m
// wide, 4.25 m high with the collectors down, 9.5 m between the bogie pivots,
// 3.0 m bogie wheelbase, 1.25 m wheels. Measured off the reference photos
// where the published data stops (the nose, the bands, the door).
// See docs/models/vectron.md.

import type { MeshBuilder, Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { ELECTRIC_LOCO_CATALOG, emblem, runningNumber, type Band } from "./cd163.ts";
import { c, lerpTable, onEnd, onSide } from "./czElectricKit.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { runsWidth, wordmarkAt, type Wordmark } from "./letters.ts";

// ---------------------------------------------------------------------------
// The body

export const BUFFERS = 18.98 / 2;
/** The nose's bottom edge, over the buffer beam. */
const NOSE = 8.8;
/** The shell's bottom and its roof (the cant's top). */
const Y0 = 1.3;
const ROOF = 4.0;
// the nose: almost upright to the windscreen (2.5 m), the windscreen raked 0.68 m back, the roof's front rolling over
const TIP = [[Y0, NOSE], [2.35, NOSE - 0.1], [2.5, NOSE - 0.18], [3.55, NOSE - 0.86], [3.85, NOSE - 1.25], [ROOF, NOSE - 1.75]] as const;
// upright sides (3.01 m) to 3.4 m, the cant rounding into the roof
const HW = [[Y0, 1.5], [3.4, 1.5], [3.75, 1.42], [3.92, 1.28], [ROOF, 1.1]] as const;
/** The corners' setback at the side: 0.5 m at the nose's foot, 0.75 m at the windscreen's top. */
const cornerBack = (y: number) => 0.5 + 0.25 * Math.min(1, Math.max(0, (y - 2.4) / 1.2));
/** The cab end in plan: flat across the middle, the wide rounded corners. */
const endPlan = (y: number, w: number) => {
  const b = cornerBack(y);
  return [[0, 0], [w * 0.45, 0.01], [w * 0.7, b * 0.14], [w * 0.88, b * 0.42], [w, b]] as const;
};
/** Where the side wall begins at height y: the front of its flat. */
const sideFront = (y: number) => lerpTable(TIP, y) - cornerBack(y);

/** Every height the side's front edge turns at. */
const EDGE_YS = [Y0, 2.35, 2.4, 2.5, 3.55, 3.6, 3.85, ROOF];

/**
 * Paint over the side's cab section from x = `back(y)` forward to the side's
 * front edge, between heights y0 and y1 (front half; `mirror` draws the rear).
 * The front edge follows the corners, so the outline is convex.
 */
function cabSidePaint(name: string, mat: string, y0: number, y1: number, back: (y: number) => number, layer = 0): SideItem {
  const ys = [y0, ...EDGE_YS.filter((y) => y > y0 && y < y1), y1];
  const front = ys.map((y): [number, number] => [sideFront(y) - 0.01, y]);
  const rear = [y1, y0].map((y): [number, number] => [back(y), y]);
  const poly: Ring = [...front, ...rear];
  const xs = poly.map((p) => p[0]);
  return { kind: "paint", name, x: [Math.min(...xs), Math.max(...xs)], y: [y0, y1], poly, mat, mirror: true, layer };
}

/**
 * A paint edge across the cab section, given top to bottom as (x, y) points: the colour from the edge
 * forward to the side's front edge, one convex piece per segment (cabSidePaint), named `<name> <i>`.
 */
function cabSweep(name: string, mat: string, edge: ReadonlyArray<readonly [number, number]>, layer: number): SideItem[] {
  const out: SideItem[] = [];
  for (let i = 0; i + 1 < edge.length; i++) {
    const [[xa, ya], [xb, yb]] = [edge[i + 1]!, edge[i]!];
    out.push(cabSidePaint(`${name} ${i + 1}`, mat, ya, yb, (y) => xa + ((xb - xa) * (y - ya)) / (yb - ya), layer));
  }
  return out;
}

/** The lamp grille: five stripes either side of the V in the middle of the lower nose. */
function vGrille(mat: string): EndItem[] {
  const items: EndItem[] = [];
  for (let i = 0; i < 5; i++) {
    const y0 = 1.56 + i * 0.12, y1 = y0 + 0.065;
    const inner = (y: number) => 0.16 + 0.42 * (y - 1.5) / 0.65;
    for (const s of [1, -1]) {
      const pts: Array<[number, number]> = [[inner(y0), y0], [0.98, y0], [0.98, y1], [inner(y1), y1]];
      const poly: Ring = s > 0 ? pts : pts.map(([z, y]) => [-z, y] as [number, number]).reverse();
      const zs = poly.map((p) => p[0]);
      items.push({ kind: "paint", name: `grille stripe ${s > 0 ? "left" : "right"} ${i + 1}`, z: [Math.min(...zs), Math.max(...zs)], y: [y0, y1], poly, mat, layer: 1 });
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// The liveries

interface Livery {
  title: string;
  /** The unit the livery is modelled on and where its number comes from. */
  numberSource: string;
  number: string;
  palette: LocoSpec["palette"];
  side: readonly Band[];
  end: readonly Band[];
  /** Paint over the sides (the cab sections' own colours, the operator's marks). */
  sidePaint: readonly SideItem[];
  /** Paint across the ends, laid under the grille. */
  endPaint: readonly EndItem[];
  /** The lamp grille's stripes. */
  grille: string;
  /** The CD emblem: on the ends, on the sides, its material. */
  /**
   * The CD emblem: on the ends, on the sides, its material; `sideAt` places the side emblem at the
   * reader's u (the right side's x; mirrored on the left) and height v, `h` high, in `sideMat`.
   */
  emblem?: { end: boolean; side: boolean; mat: string; sideMat?: string; sideAt?: { u: number; v: number; h: number } };
  /** The operator's lettered wordmark (letters.ts). */
  wordmark?: Wordmark;
}

const FRAME: Band = [Y0, 1.42, "frame"];

/** The Eurocity's side emblem's width (0.34 m high) and the width of its "Ceske drahy" (0.17 m), for the lettering after it. */
const EMBLEM_W_EC = 0.34 * ((us: number[]) => Math.max(...us) - Math.min(...us))(emblem(0, 0, 1, false).map((q) => q[0]));
const EC_WORD_W = runsWidth([["\u010Cesk\u00E9 dr\u00E1hy", "navy"]], 0.17);

export const VECTRON_LIVERIES = {
  // 193 298 (photo-193-298-cd-eurocity.jpg; photo-193-295-cd-eurocity-side.jpg, photo-193-293-cd-eurocity.jpg):
  // three bands the whole length over the dark grey frame - light blue below, the white strip, navy
  // along the cant - the white strip narrowing at each cab and sweeping down forward to the nose's
  // lower corner, the navy widening over the cab side above it and over the nose; white grille
  // stripes and emblem on the navy nose over a light blue foot; the navy emblem and "Ceske drahy"
  // on the white behind the reader's left cab door (the cities, skylines and slogan are left out)
  cdEurocity: {
    title: "CD Eurocity",
    numberSource: "photo-193-298-cd-eurocity.jpg (91 80 6193 298-7 D-ELOC)",
    number: runningNumber("193", "298"),
    palette: { navy: c("#1f3d8f"), skyBlue: c("#2f9be3"), white: c("#eef0f2"), plate: c("#1f3d8f") },
    side: [FRAME, [1.42, 2.55, "skyBlue"], [2.55, 3.5, "white"], [3.5, ROOF, "navy"]],
    end: [FRAME, [1.42, 1.52, "skyBlue"], [1.52, ROOF, "navy"]],
    sidePaint: [
      // the white strip's lower edge curving down to the nose's corner (over the light blue) and the
      // navy's edge above it, each a chain of convex pieces from the edge forward to the corner
      ...cabSweep("cab white", "white", [[6.6, 2.55], [7.3, 2.25], [7.8, 1.95], [8.28, 1.6]], 1),
      ...cabSweep("cab navy", "navy", [[7.15, 3.5], [7.3, 2.8], [7.65, 2.3], [8.2, 1.95]], 2),
    ],
    endPaint: [],
    grille: "white",
    emblem: { end: true, side: true, mat: "white", sideMat: "navy", sideAt: { u: -5.85, v: 2.85, h: 0.34 } },
    wordmark: { runs: [["\u010Cesk\u00E9 dr\u00E1hy", "navy"]], side: { h: 0.17, v: 2.92, u: -5.85 + EMBLEM_W_EC + 0.1 + EC_WORD_W / 2 } },
  },
  // 193 205 (photo-193-205-regiojet.jpg): golden yellow, the white cap over the windscreens and the
  // cab roofs, the black windscreen surround and stripes; "|| REGIO" in red and "JET" in navy
  // behind the cab door at the reader's left, and small under the windscreen
  regiojet: {
    title: "RegioJet",
    numberSource: "photo-193-205-regiojet.jpg; 193 205-2 is on the Commons file of 27.06.2016",
    number: runningNumber("193", "205"),
    palette: { yellow: c("#f2b318"), white: c("#eceeee"), plate: c("#1e1f21", 0.7), red: c("#d4202a"), rjNavy: c("#243a8c") },
    side: [FRAME, [1.42, ROOF, "yellow"]],
    end: [FRAME, [1.42, 2.45, "yellow"], [2.45, 3.6, "black"], [3.6, ROOF, "white"]],
    sidePaint: [
      cabSidePaint("cab cap", "white", 3.4, ROOF, (y) => 6.6 - 1.2 * (y - 3.4)),
    ],
    endPaint: [],
    grille: "black",
    wordmark: {
      runs: [["|| REGIO", "red"], ["JET", "rjNavy"]],
      style: { width: 0.75, weight: 0.2, slant: 0.2, gap: 0.14 },
      side: { h: 0.5, v: 2.55, u: -4.1 },
      end: { h: 0.1, v: 2.24, u: -0.6 },
    },
  },
  // 193 574-1 (photo-193-574-cd-white.jpg): RSL's white with the grey frame, the black windscreen
  // surround and stripes, the CD emblem in blue on the sides
  cdWhite: {
    title: "CD white",
    numberSource: "photo-193-574-cd-white.jpg",
    number: runningNumber("193", "574"),
    palette: { white: c("#e9ebec"), plate: c("#1e1f21", 0.7), cdBlue: c("#1f4fa0") },
    side: [FRAME, [1.42, ROOF, "white"]],
    end: [FRAME, [1.42, 2.45, "white"], [2.45, 3.6, "black"], [3.6, ROOF, "white"]],
    sidePaint: [],
    endPaint: [],
    grille: "black",
    emblem: { end: false, side: true, mat: "cdBlue" },
  },
} as const satisfies Record<string, Livery>;

export type VectronLivery = keyof typeof VECTRON_LIVERIES;

export const VECTRON_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cdEurocity",
  values: Object.entries(VECTRON_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];

function spec(l: Livery): LocoSpec {
  return {
    palette: { roof: { color: "#7b7f82", roughness: 0.75 }, louvre: c("#3a3d40", 0.8), ...l.palette },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: "roof",
    buffers: BUFFERS,
    beam: NOSE + 0.05,
    bufferHead: "rect",
    frame: { y0: 0.92, y1: Y0, half: NOSE + 0.05, hw: 1.43, mat: "frame" },
    bogies: [-4.75, 4.75].map((xc) => ({ xc, axles: [-1.5, 1.5], wheelR: 0.625, frameTop: 0.86 })),
    pantograph: { kind: "singleArm", x: 4.45, roofY: ROOF, baseY: 4.13 },
    hvLine: { x: 2.6, y: 4.24, z: 0.45 },
    sideItems: [
      ...l.sidePaint,
      // the cab door behind each corner, its window, handrails and steps
      { kind: "door", name: "cab door", x: [6.3, 7.0], y: [1.45, 3.45], win: [2.7, 3.3], rails: true, mirror: true },
      // the louvred grilles along the cant over the machine room
      { kind: "grille", name: "cant grille", x: [1.2, 5.6], y: [3.6, 3.86], slats: "v", pitch: 0.09, mirror: true },
      { kind: "grille", name: "cant grille middle", x: [-0.9, 0.9], y: [3.6, 3.86], slats: "v", pitch: 0.09 },
      { kind: "plate", name: "number", x: [4.95, 5.95], y: [1.47, 1.6] },
    ],
    endItems: [
      ...l.endPaint,
      // the windscreen of two panes either side of the middle pillar, the wipers
      { kind: "window", name: "windscreen left", z: [0.04, 1.12], y: [2.58, 3.5], wiper: true },
      { kind: "window", name: "windscreen right", z: [-1.12, -0.04], y: [2.58, 3.5], wiper: true },
      ...vGrille(l.grille),
      { kind: "lamp", name: "top headlight", z: [-0.09, 0.09], y: [3.68, 3.84], r: 0.06 },
      { kind: "lamp", name: "headlight left", z: [1.02, 1.24], y: [1.66, 1.88], r: 0.09 },
      { kind: "lamp", name: "headlight right", z: [-1.24, -1.02], y: [1.66, 1.88], r: 0.09 },
      { kind: "lamp", name: "tail lamp left", z: [1.06, 1.2], y: [1.98, 2.12], r: 0.05, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-1.2, -1.06], y: [1.98, 2.12], r: 0.05, mat: "lampRed" },
      // the number right of the middle seen from ahead (z is mirrored at the front)
      { kind: "plate", name: "number", z: [0.15, 0.9], y: [2.2, 2.34] },
    ],
    // the roof: the equipment covers between the collectors and the main switch's hood
    roofItems: [
      { name: "roof cover", x: [-3.6, 3.6], w: [0.95, 0.85], y: [3.98, 4.12], mat: "roof" },
      { name: "main switch hood", x: [-0.6, 0.6], w: [0.55, 0.45], y: [4.1, 4.25], mat: "roof" },
    ],
    // the transformer and the tanks between the bogies
    underItems: [[-2.6, 2.6, 0.42, 0.92, 1.15]],
    plough: "frame",
    number: l.number,
  };
}

/** The emblem's width when its height is 1. */
const EMBLEM_W = ((us: number[]) => Math.max(...us) - Math.min(...us))(emblem(0, 0, 1, false).map((q) => q[0]));

/** The CD emblems: white on the noses (Eurocity), blue on the machine room's sides (white). */
function emblems(m: MeshBuilder, s: LocoSpec, l: Livery): void {
  const e = l.emblem;
  if (!e) return;
  const sp = shellOf(s);
  m.scope("emblems", () => {
    if (e.end)
      for (const end of [-1, 1])
        m.scope(end > 0 ? "front" : "rear", () => {
          // seen from ahead the reader's right is -z at the front and +z at the rear
          const h = 0.24, w = EMBLEM_W * h, uc = 0.5;
          const at = onEnd(sp, end), n: Vec3 = [end, 0, 0];
          const z0 = end > 0 ? uc + w / 2 : -uc - w / 2;
          m.facets(e.mat, emblem(z0, 2.15, h, end > 0).map(([u, v]) => at(u, v, 0.008)), n);
        });
    if (e.side)
      for (const sd of [-1, 1])
        m.scope(sd > 0 ? "right" : "left", () => {
          // the reader's right is +x on the right side (+z), -x on the left
          const at = onSide(sp, sd), n: Vec3 = [0, 0, sd];
          if (e.sideAt) {
            // at the reader's u: the right side's x, mirrored on the left
            const { u, v, h } = e.sideAt;
            m.facets(e.sideMat ?? e.mat, emblem(sd > 0 ? u : -u, v, h, sd < 0).map(([x, y]) => at(x, y, 0.006)), n);
            return;
          }
          const h = 0.45, w = EMBLEM_W * h;
          // x 3.0 .. 3.0 + w on both sides, read from its own side
          m.facets(e.mat, emblem(sd > 0 ? 3.0 : 3.0 + w, 2.3, h, sd < 0).map(([u, v]) => at(u, v, 0.006)), n);
        });
  });
}

/** The operator's wordmark on both sides and both ends, read from outside (positions are the reader's). */
function wordmarks(m: MeshBuilder, s: LocoSpec, l: Livery): void {
  const wm = l.wordmark;
  if (!wm) return;
  const sp = shellOf(s);
  m.scope("wordmark", () => {
    if (wm.side?.u !== undefined) {
      const { h, v, u } = wm.side;
      for (const sd of [-1, 1])
        m.scope(sd > 0 ? "right" : "left", () => {
          const at = onSide(sp, sd), n: Vec3 = [0, 0, sd];
          for (const r of wordmarkAt(wm.runs, sd > 0 ? u : -u, v, h, sd < 0, wm.style, "centre")) m.facets(r.mat, r.tris.map(([x, y]) => at(x, y, 0.006)), n);
        });
    }
    if (wm.end) {
      const { h, v, u } = wm.end;
      for (const e of [-1, 1])
        m.scope(e > 0 ? "front" : "rear", () => {
          const at = onEnd(sp, e), n: Vec3 = [e, 0, 0];
          for (const r of wordmarkAt(wm.runs, e > 0 ? -u : u, v, h, e > 0, wm.style, "centre")) m.facets(r.mat, r.tris.map(([z, y]) => at(z, y, 0.008)), n);
        });
    }
  });
}

const liveryOf = (params?: ParamValues): Livery => VECTRON_LIVERIES[resolveParams(VECTRON_PARAMS, params).livery as VectronLivery];

/** The Vectron in one of its Czech operators' liveries; the default is CD's Eurocity 193 298. */
export function vectron(params?: ParamValues): MeshBuilder {
  const l = liveryOf(params);
  const s = spec(l);
  const m = buildBoxLoco(s);
  emblems(m, s, l);
  wordmarks(m, s, l);
  return m;
}

/** The same locomotive for distant views (docs/models/lod.md). */
export function vectronLod(params?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(params)));
}

export const VECTRON_DESIGNS: ProceduralDesign[] = [
  // the MS of the Czech operators' leases: 6.4 MW under AC, 200 km/h, 89 t (on the 193 227's data panel)
  { id: "proc-vehicle-vectron", game: { weight: 89, power: 6400, maxspeed: 200, accel: null }, title: "Siemens Vectron", build: vectron, buildLod: vectronLod, params: VECTRON_PARAMS, catalog: ELECTRIC_LOCO_CATALOG, references: "vectron" },
];
