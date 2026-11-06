// Swiss electric locomotives on the box locomotive kit (stated with
// worldLocoKit.ts): the Re 460, Re 4/4 II, Re 6/6 and Ae 6/6, the Ce 6/8 II
// "Krokodil" and the Ae 8/14 "Landi"; on the metre gauge, the Rhaetian
// Railway's Ge 4/4 III and Ge 6/6 I "Krokodil" and the Matterhorn Gotthard
// Bahn's rack HGe 4/4 II. See docs/models/switzerland-trains.md.

import type { MeshBuilder, Ring } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { liveryParams, liverySpec, locoGame, paramsOf, type Liveries } from "./frLocos.ts";
import type { WorldLoco } from "./worldLocoKit.ts";

type Body = Omit<WorldLoco, "palette" | "side" | "number">;
const GREY = c("#5a5d60", 0.6);
const WHITE = c("#efefea");
const pair = (pivot: number, base: number, r: number, axles: 2 | 3) => [[-pivot, axles === 3 ? [-base, 0, base] : [-base, base], r], [pivot, axles === 3 ? [-base, 0, base] : [-base, base], r]] as const;
/** A one-colour body with a dark sill and a white line under the windows. */
const painted = (body: Body, colour: string, number: string, line = true): WorldLoco => ({
  ...body, palette: { paint: c(colour), white: WHITE, grey: GREY },
  side: line ? [[1.0, body.y0 + 0.3, "grey"], [body.y0 + 0.3, body.y0 + 1.0, "paint"], [body.y0 + 1.0, body.y0 + 1.06, "white"], [body.y0 + 1.06, 4.4, "paint"]] : [[1.0, body.y0 + 0.3, "grey"], [body.y0 + 0.3, 4.4, "paint"]],
  number,
});

const SBB_RED = "#eb0000";
const RE460_ROOF = 4.15;
export const RE460_NUMBER = "460 014-4";
const SBB_GREEN = "#2e5d3d";
const RHB_RED = "#c8102e";

const RE460: Body = { length: 18.5, W: 1.48, y0: 1.3, roof: RE460_ROOF, nose: "streamlined", bogies: pair(5.5, 1.4, 0.55, 2), pantograph: "singleArm", pantographX: 4.6 };
const RE420: Body = { length: 15.41, W: 1.48, y0: 1.3, roof: 3.95, nose: "flat", bogies: pair(3.8, 1.35, 0.63, 2), pantograph: "singleArm", pantographX: 3.6, room: { kind: "grilles", n: 3, y: [2.6, 3.4] } };
const RE620: Body = { length: 19.31, W: 1.48, y0: 1.3, roof: 3.95, nose: "flat", bogies: [[-5.9, [-1.35, 1.35], 0.63], [0, [-1.35, 1.35], 0.63], [5.9, [-1.35, 1.35], 0.63]], pantograph: "singleArm", pantographX: 5.6, room: { kind: "grilles", n: 5, y: [2.6, 3.4] } };
const AE66: Body = { length: 18.4, W: 1.48, y0: 1.35, roof: 3.95, nose: "raked", bogies: pair(5.0, 1.75, 0.63, 3), pantograph: "diamond", pantographX: 4.8, room: { kind: "windows", n: 4, y: [2.6, 3.2] } };
const CE68: Body = { length: 19.46, W: 1.45, y0: 1.4, roof: 4.0, nose: "hoods", cabHalf: 3.4, hoodTop: 3.05, bogies: pair(4.6, 1.4, 0.675, 3), pantograph: "diamond", pantographX: 2.2, room: { kind: "windows", n: 2, y: [2.75, 3.4] } };
const AE814: Body = { length: 34.0, W: 1.48, y0: 1.35, roof: 3.95, nose: "raked", bogies: [[-12.0, [-1.4, 1.4], 0.675], [-4.2, [-1.4, 1.4], 0.675], [4.2, [-1.4, 1.4], 0.675], [12.0, [-1.4, 1.4], 0.675]], pantograph: "diamond", pantographX: 13.0, room: { kind: "windows", n: 5, y: [2.6, 3.2] } };
const GE443: Body = { length: 16.0, W: 1.32, y0: 1.2, roof: 3.75, nose: "raked", bogies: pair(4.0, 1.3, 0.53, 2), pantograph: "singleArm", pantographX: 4.0, room: { kind: "grilles", n: 3, y: [2.4, 3.2] } };
const GE66: Body = { length: 13.3, W: 1.32, y0: 1.2, roof: 3.8, nose: "hoods", cabHalf: 2.2, hoodTop: 2.8, bogies: pair(3.1, 1.05, 0.54, 3), pantograph: "diamond", pantographX: 1.5, room: { kind: "windows", n: 2, y: [2.5, 3.2] } };
const HGE442: Body = { length: 14.8, W: 1.32, y0: 1.2, roof: 3.75, nose: "flat", bogies: pair(3.6, 1.25, 0.5, 2), pantograph: "singleArm", pantographX: 3.6, room: { kind: "grilles", n: 3, y: [2.4, 3.2] } };

const L: Record<string, Liveries> = {
  re460: { sbbRed: { title: "SBB red", loco: { ...painted(RE460, SBB_RED, RE460_NUMBER), palette: { paint: c(SBB_RED), white: WHITE, grey: c("#2a2c2e", 0.7), groove: c("#a80000"), roof: c("#4b4e52", 0.75) } } } },
  re420: { green: { title: "SBB green", loco: painted(RE420, SBB_GREEN, "11161") }, red: { title: "SBB red", loco: painted(RE420, SBB_RED, "420 161-9") } },
  re620: { green: { title: "SBB green", loco: painted(RE620, SBB_GREEN, "11601") }, red: { title: "SBB red", loco: painted(RE620, SBB_RED, "620 001-5") } },
  ae66: { green: { title: "SBB green", loco: painted(AE66, SBB_GREEN, "11401") }, red: { title: "SBB Cargo red", loco: painted(AE66, SBB_RED, "610 501-2") } },
  ce68: { brown: { title: "Brown", loco: painted(CE68, "#5a3a22", "14253", false) }, green: { title: "SBB green", loco: painted(CE68, SBB_GREEN, "14305", false) } },
  ae814: { green: { title: "SBB green", loco: painted(AE814, SBB_GREEN, "11852") } },
  ge443: { rhb: { title: "RhB red", loco: painted(GE443, RHB_RED, "641") } },
  ge66: { brown: { title: "Brown", loco: painted(GE66, "#5a3a22", "414", false) }, green: { title: "RhB green", loco: painted(GE66, "#2f5e3a", "415", false) } },
  hge442: { mgb: { title: "MGB red", loco: painted(HGE442, "#c8102e", "101 961-0") } },
};

const P = Object.fromEntries(Object.entries(L).map(([k, l]) => [k, liveryParams(l)]));

// --- the Re 460 ("Lok 2000") -------------------------------------------------------
// Its own profile over the kit's streamlined nose (docs/models/switzerland-trains.md):
// the low, rounded nose with the large windscreen leaning back, the end bowed in plan,
// the grey roof whose sides slope in steeply from the windows' head, the dark skirt,
// the ribbed machine-room side with the SBB emblem drawn in its ribs, and the louvres
// along the roof's slope.
const RE460_BEAM = 18.5 / 2 - 0.62;
/** The windows' head: the red side ends here and the grey roof begins. */
const RE460_HEAD = 3.48;
/** The dark skirt's top on the sides and the ends. */
const RE460_SKIRT = 1.55;
/** The machine-room side's ribs: their x span, first and last row and pitch. */
const RE460_RIBS = { x: [-4.2, 4.2] as const, y0: 1.8, y1: 3.2, pitch: 0.1 };

/** The SBB emblem as the ribbed side draws it: a full bar, then shorter pairs closing in toward the top and bottom (the arrows). */
export function re460EmblemBars(cx: number, cy: number, A: number, pitch: number, h: number, rows = 4): Array<readonly [number, number, number, number]> {
  const bars: Array<readonly [number, number, number, number]> = [[cx - A, cy - h / 2, cx + A, cy + h / 2]];
  const dash = A * 0.24;
  for (let j = 1; j <= rows; j++) {
    const outer = A * (1.05 - (0.6 * j) / rows);
    for (const k of [-1, 1]) {
      const y = cy + k * j * pitch;
      bars.push([cx - outer, y - h / 2, cx - outer + dash, y + h / 2], [cx + outer - dash, y - h / 2, cx + outer, y + h / 2]);
    }
  }
  return bars;
}

function re460Spec(v?: ParamValues): LocoSpec {
  const base = liverySpec(L.re460!, P.re460!, v);
  const N = RE460_BEAM, W = 1.48, top = RE460_ROOF, head = RE460_HEAD;
  const bands = [[1.0, RE460_SKIRT, "grey"], [RE460_SKIRT, head, "paint"], [head, 4.4, "roof"]] as const;
  const ribs: SideItem[] = [];
  for (let y = RE460_RIBS.y0, i = 1; y <= RE460_RIBS.y1 + 1e-6; y += RE460_RIBS.pitch, i++)
    ribs.push({ kind: "paint", name: `rib ${i}`, x: RE460_RIBS.x, y: [y - 0.0125, y + 0.0125], mat: "groove" });
  // the emblem's bars lie between the ribs, on the front half of each side
  const emblem: SideItem[] = re460EmblemBars(2.0, RE460_RIBS.y0 + 0.75, 1.35, RE460_RIBS.pitch, 0.05).map(([x0, y0, x1, y1], i) =>
    ({ kind: "paint", name: `emblem ${i + 1}`, x: [x0, x1], y: [y0, y1], mat: "white", layer: 1 }));
  const frontEmblem: EndItem[] = re460EmblemBars(0, 2.2, 0.17, 0.045, 0.024, 3).map(([z0, y0, z1, y1], i) =>
    ({ kind: "paint", name: `emblem ${i + 1}`, z: [z0, z1], y: [y0, y1], mat: "white", layer: 1 }));
  return {
    ...base,
    tip: [[1.3, N - 0.03], [1.6, N], [1.95, N - 0.08], [2.25, N - 0.25], [2.5, N - 0.48], [head, N - 1.2], [3.62, N - 1.42], [3.95, N - 1.95], [4.1, N - 2.3], [top, N - 2.45]],
    hw: [[1.3, 1.36], [1.6, W], [head, W], [3.62, 1.42], [3.95, 1.1], [4.1, 0.82], [top, 0.6]],
    // bowed across the windscreen, the corners rounded well back into the sides
    endPlan: (_y, w) => [[0, 0], [w * 0.4, 0.04], [w * 0.68, 0.14], [w * 0.86, 0.32], [w * 0.96, 0.52], [w, 0.68]],
    side: bands,
    end: bands,
    sideItems: [
      { kind: "door", name: "cab door", x: [5.15, 5.88], y: [1.45, 3.38], rails: true, mirror: true },
      { kind: "window", name: "cab window", x: [6.0, 6.62], y: [2.55, 3.38], mat: "rubber", mirror: true },
      ...ribs,
      ...emblem,
      { kind: "grille", name: "roof louvres", x: [-4.0, 4.0], y: [3.66, 3.92], slats: "v", pitch: 0.2, mat: "roof" },
      { kind: "plate", name: "number", x: [-0.5, 0.5], y: [1.36, 1.52] },
    ],
    endItems: [
      { kind: "paint", name: "windscreen surround", z: [-1.42, 1.42], y: [2.42, 3.46], mat: "black" },
      { kind: "window", name: "windscreen left", z: [0.025, 1.25], y: [2.5, 3.4], wiper: true },
      { kind: "window", name: "windscreen right", z: [-1.25, -0.025], y: [2.5, 3.4], wiper: true },
      ...frontEmblem,
      { kind: "lamp", name: "top headlight", z: [-0.15, 0.15], y: [3.64, 3.74], rect: true },
      // a black housing at each lower corner, the headlight outboard and the tail lamp inboard
      { kind: "paint", name: "lamp housing left", z: [0.74, 1.26], y: [1.57, 1.79], mat: "black", layer: 1 },
      { kind: "paint", name: "lamp housing right", z: [-1.26, -0.74], y: [1.57, 1.79], mat: "black", layer: 1 },
      { kind: "lamp", name: "headlight left", z: [0.99, 1.21], y: [1.62, 1.74], rect: true },
      { kind: "lamp", name: "headlight right", z: [-1.21, -0.99], y: [1.62, 1.74], rect: true },
      { kind: "lamp", name: "tail lamp left", z: [0.79, 0.93], y: [1.62, 1.74], rect: true, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-0.93, -0.79], y: [1.62, 1.74], rect: true, mat: "lampRed" },
      { kind: "plate", name: "number", z: [-0.45, 0.45], y: [1.35, 1.5] },
    ],
    roofItems: [],
    pantograph: { ...base.pantograph!, baseY: top + 0.08 },
    // the skirt between the bogies; the black apron under each end replaces the kit's plough
    underItems: [[-3.3, 3.3, 0.62, 0.95, 1.36]],
    plough: undefined,
    bufferHead: "rect",
  };
}

/** The front apron's plan at its top and bottom: [x, |z|] from the nose's centre back to the side. */
const RE460_APRON = {
  y: [0.35, 0.96] as const,
  top: [[RE460_BEAM + 0.02, 0.6], [RE460_BEAM - 0.05, 1.1], [RE460_BEAM - 0.25, 1.36], [7.75, 1.36]] as const,
  bottom: [[RE460_BEAM - 0.2, 0.55], [RE460_BEAM - 0.3, 1.0], [RE460_BEAM - 0.48, 1.22], [7.75, 1.22]] as const,
};

/**
 * The black apron under each end: from the frame down to the plough's edge, bowed in plan
 * like the nose above it and leaning back toward the bottom, the buffers and the
 * coupling standing out of it.
 */
function re460Aprons(m: MeshBuilder): void {
  // counter-clockwise from above: down the -z side toward the back, up the +z side to the front
  const ring = (pts: ReadonlyArray<readonly [number, number]>, e: number): Ring =>
    [...pts.map(([x, z]) => [x, -z] as const), ...[...pts].reverse().map(([x, z]) => [x, z] as const)].map(([x, z]) => [e * x, e * z] as [number, number]);
  m.scope("front aprons", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front apron" : "rear apron", () => {
        const [bottom, top] = [ring(RE460_APRON.bottom, e), ring(RE460_APRON.top, e)];
        m.loft("black", bottom, RE460_APRON.y[0], top, RE460_APRON.y[1], false);
        m.cap("black", bottom, RE460_APRON.y[0], false);
      });
  });
}
const b = (k: string) => (v?: ParamValues): MeshBuilder => buildBoxLoco(liverySpec(L[k]!, P[k]!, v));
const lod = (k: string) => (v?: ParamValues): MeshBuilder => boxLocoLod(liverySpec(L[k]!, P[k]!, v));

export function sbbRe460(v?: ParamValues): MeshBuilder {
  const m = buildBoxLoco(re460Spec(v));
  m.scope("body", () => re460Aprons(m));
  return m;
}
export function sbbRe460Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(re460Spec(v)); }
export function sbbRe420(v?: ParamValues): MeshBuilder { return b("re420")(v); }
export function sbbRe420Lod(v?: ParamValues): MeshBuilder { return lod("re420")(v); }
export function sbbRe620(v?: ParamValues): MeshBuilder { return b("re620")(v); }
export function sbbRe620Lod(v?: ParamValues): MeshBuilder { return lod("re620")(v); }
export function sbbAe66(v?: ParamValues): MeshBuilder { return b("ae66")(v); }
export function sbbAe66Lod(v?: ParamValues): MeshBuilder { return lod("ae66")(v); }
export function sbbCe68(v?: ParamValues): MeshBuilder { return b("ce68")(v); }
export function sbbCe68Lod(v?: ParamValues): MeshBuilder { return lod("ce68")(v); }
export function sbbAe814(v?: ParamValues): MeshBuilder { return b("ae814")(v); }
export function sbbAe814Lod(v?: ParamValues): MeshBuilder { return lod("ae814")(v); }
export function rhbGe443(v?: ParamValues): MeshBuilder { return b("ge443")(v); }
export function rhbGe443Lod(v?: ParamValues): MeshBuilder { return lod("ge443")(v); }
export function rhbGe66(v?: ParamValues): MeshBuilder { return b("ge66")(v); }
export function rhbGe66Lod(v?: ParamValues): MeshBuilder { return lod("ge66")(v); }
export function mgbHge442(v?: ParamValues): MeshBuilder { return b("hge442")(v); }
export function mgbHge442Lod(v?: ParamValues): MeshBuilder { return lod("hge442")(v); }

const E = ELECTRIC_LOCO_CATALOG;
const d = (id: string, title: string, k: string, build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, weight: number, power: number, maxspeed: number): ProceduralDesign =>
  ({ id: `proc-vehicle-${id}`, title, build, buildLod, ...paramsOf(P[k]!), game: locoGame(weight, power, maxspeed), catalog: E, references: id });

export const CH_LOCOS: ProceduralDesign[] = [
  d("sbb-re460", "SBB Re 460", "re460", sbbRe460, sbbRe460Lod, 84, 6100, 230),
  d("sbb-re420", "SBB Re 4/4 II", "re420", sbbRe420, sbbRe420Lod, 80, 4700, 140),
  d("sbb-re620", "SBB Re 6/6", "re620", sbbRe620, sbbRe620Lod, 120, 7850, 140),
  d("sbb-ae66", "SBB Ae 6/6", "ae66", sbbAe66, sbbAe66Lod, 120, 4300, 125),
  d("sbb-ce68", "SBB Ce 6/8 II Krokodil", "ce68", sbbCe68, sbbCe68Lod, 128, 2700, 65),
  d("sbb-ae814", "SBB Ae 8/14 Landi", "ae814", sbbAe814, sbbAe814Lod, 240, 8160, 110),
  d("rhb-ge443", "RhB Ge 4/4 III", "ge443", rhbGe443, rhbGe443Lod, 62, 2400, 100),
  d("rhb-ge66", "RhB Ge 6/6 I Krokodil", "ge66", rhbGe66, rhbGe66Lod, 66, 794, 55),
  d("mgb-hge442", "MGB HGe 4/4 II", "hge442", mgbHge442, mgbHge442Lod, 64, 1932, 90),
];
