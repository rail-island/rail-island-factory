// The DB class 218, the B'B' diesel-hydraulic of the V 160 family (Krupp,
// Henschel, Krauss-Maffei, MaK, 1968-1979), on the box locomotive kit
// (boxLocoKit.ts) with its own profile tables, measured on the photographs in
// assets/db-218 (docs/models/germany-trains.md). A one-piece body with a cab at
// each end, not a centre cab:
// - the frame's skirt down to 0.9 m over the bogies, its lower edge sweeping up
//   behind the outer wheels to the buffer beam under each end;
// - the end: the upright lower face with the black lamp housing (two headlights
//   outside, two red lamps inside, the horn grille between) over the ledge, the
//   face leaning back through the band to the raked two-pane windscreen, its
//   corners rounded in plan, the roof's front edge rounded down to it, a lamp
//   on top;
// - per side: the cab's two-pane side window, the cab door behind it, the
//   machine room's windows and radiator grilles in the band under the roof, and
//   the radiator grilles, small windows and DB emblem below, the cooling group
//   at the "2" end on both sides;
// - the exhaust pair amidships, the bogies 8.6 m apart with a 2.8 m wheelbase
//   and 1,000 mm wheels, the fuel tank between them.

import type { MaterialSpec, MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import type { Band } from "./cd163.ts";
import { c } from "./czElectricKit.ts";
import { enumParam } from "./emuParts.ts";
import { block } from "./vehicleParts.ts";
import { exhaust } from "./dieselParts.ts";

/** Length over the buffers (16.4 m), half of it, and the end face's |x| (the buffer beam). */
export const BR218_LENGTH = 16.4;
const HALF = BR218_LENGTH / 2;
const N = HALF - 0.65;
/** The body's half width (3.0 m over the sides). */
const W = 1.5;
/** The skirt's bottom, the ledge under the lamp housing (the frame's top), the band under the roof, the roof's edge and crown. */
const SKIRT = 0.9;
const LEDGE = [1.5, 1.58] as const;
const BAND = 3.05;
const EAVE = 3.9;
const ROOF = 4.25;
/** The bogies' centres (8.6 m apart), half their wheelbase (2.8 m) and the wheels' radius (1,000 mm). */
const PIVOT = 4.3;
const AXLE = 1.4;
const WHEEL_R = 0.5;
/** The lamp housing's height and half width, and how far it stands off the face. */
const LAMPS = [1.64, 1.98] as const;
const LAMP_HW = 1.12;
const LAMP_OUT = 0.07;

/**
 * The end's centre line [y, |x|], bottom first: the skirt's lower edge sweeping
 * up behind the outer wheel to the underside of the end, the upright face with
 * the lamps, the face leaning back to the windscreen, the raked windscreen and
 * the roof's rounded front edge.
 */
const TIP: ReadonlyArray<readonly [number, number]> = [
  [SKIRT, 5.95], [1.05, 6.32], [1.2, 6.62], [1.35, 6.84], [1.46, 6.95], [LEDGE[0], N],
  [2.2, N - 0.01], [2.6, N - 0.05], [3.1, N - 0.17], [3.85, N - 0.48], [3.98, N - 0.6], [4.1, N - 0.78], [4.2, N - 1.02], [ROOF, N - 1.28],
];
/** The half width [y, hw]: upright to the band, leaning in under the roof, the roof's rounded edges. */
const HW: ReadonlyArray<readonly [number, number]> = [[SKIRT, W], [BAND, W], [EAVE - 0.05, W - 0.08], [3.98, W - 0.14], [4.1, W - 0.28], [4.2, W - 0.52], [ROOF, W - 0.78]];
/** The end in plan at height y and half width w: flat across the middle, the corners rounded 0.32 m back (flat under the face). */
function plan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  // the corners round further back above the waist, toward the windscreen and the roof
  const k = y < LEDGE[0] - 0.01 ? 0.15 : 1 + 0.8 * Math.min(1, Math.max(0, (y - 2.8) / 1.1));
  return [[0, 0], [w * 0.6, 0.012 * k], [w * 0.78, 0.05 * k], [w * 0.88, 0.11 * k], [w * 0.95, 0.2 * k], [w, 0.32 * k]];
}

interface Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  /** The grey band under the roof between the cabs (the machine room's windows). */
  windowBand?: boolean;
  /** The ledge's and the buffer beam's paint. */
  ledge: string;
  beam: string;
  /** Paint on the face: a band, the emblem, the number's place. */
  face: EndItem[];
  number: string;
}

/** The DB emblem on the face: a frame and its field, centred at height y. */
const emblem = (y: number, frame: string, field: string): EndItem[] => [
  { kind: "paint", name: "emblem", z: [-0.24, 0.24], y: [y - 0.2, y + 0.2], mat: frame, layer: 1 },
  { kind: "paint", name: "emblem field", z: [-0.2, 0.2], y: [y - 0.16, y + 0.16], mat: field, layer: 2 },
  { kind: "paint", name: "emblem letters", z: [-0.12, 0.12], y: [y - 0.09, y + 0.09], mat: frame, layer: 3 },
];

const GREY = c("#6a6d70", 0.65);
const ROOF_GREY = c("#5b5e61", 0.75);
const DARK = c("#2f3134", 0.75);

const LIVERIES: Record<string, Livery> = {
  // 218 209-5 as delivered: purple red, the beige line over the grey frame, the beige emblem
  purpleRed: {
    title: "Purple red",
    palette: { body: c("#7e1a26"), frameGrey: c("#3c3e41", 0.7), cream: c("#e0cfa0"), roofGrey: ROOF_GREY, beam: DARK, plate: c("#7e1a26") },
    side: [[0.4, LEDGE[0], "frameGrey"], [LEDGE[0], LEDGE[0] + 0.07, "cream"], [LEDGE[0] + 0.07, EAVE, "body"], [EAVE, 4.4, "roofGrey"]],
    end: [[0.4, LEDGE[0], "frameGrey"], [LEDGE[0], EAVE, "body"], [EAVE, 4.4, "roofGrey"]],
    ledge: "cream",
    beam: "beam",
    face: [...emblem(2.55, "cream", "body"), { kind: "plate", name: "number", z: [-0.45, 0.45], y: [2.2, 2.34] }],
    number: "218 209-5",
  },
  // 218 137-8 (DB Museum Koblenz): orient red, the pebble grey band round the lamps and over the ledge
  orientRed: {
    title: "Orient red",
    palette: { body: c("#d9481f"), pebble: c("#b9bab3", 0.6), roofGrey: ROOF_GREY, band: c("#45484b", 0.6), beam: c("#d9481f"), white: c("#f2f2ee"), navy: c("#1d2a44"), plate: c("#d9481f") },
    side: [[0.4, 1.3, "body"], [1.3, 2.02, "pebble"], [2.02, EAVE, "body"], [EAVE, 4.4, "roofGrey"]],
    end: [[0.4, LEDGE[0], "body"], [LEDGE[0], 2.02, "pebble"], [2.02, EAVE, "body"], [EAVE, 4.4, "roofGrey"]],
    windowBand: true,
    ledge: "pebble",
    beam: "beam",
    face: [...emblem(2.5, "white", "navy"), { kind: "plate", name: "number", z: [-0.45, 0.45], y: [2.17, 2.3] }],
    number: "218 137-8",
  },
  // 218 400-0 (Munich): traffic red, the grey frame, the light grey band with the DB emblem on the face
  trafficRed: {
    title: "Traffic red",
    palette: { body: c("#d4111e"), frameGrey: GREY, roofGrey: ROOF_GREY, band: c("#5d6063", 0.6), light: c("#dcdedc", 0.55), beam: GREY, white: c("#f4f4f2"), plate: c("#d4111e") },
    side: [[0.4, LEDGE[0], "frameGrey"], [LEDGE[0], EAVE, "body"], [EAVE, 4.4, "roofGrey"]],
    end: [[0.4, LEDGE[0], "frameGrey"], [LEDGE[0], EAVE, "body"], [EAVE, 4.4, "roofGrey"]],
    windowBand: true,
    ledge: "frameGrey",
    beam: "beam",
    face: [
      { kind: "paint", name: "light band", z: [-1.3, 1.3], y: [2.2, 2.55], mat: "light" },
      ...emblem(2.38, "white", "body"),
      { kind: "plate", name: "number", z: [-1.2, -0.35], y: [2.88, 3.0] },
    ],
    number: "218 400-0",
  },
};

export const BR218_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];

/** Both z signs of an end item (the kit lays each item as listed, at both ends). */
function pair(item: EndItem): EndItem[] {
  return [{ ...item, name: `${item.name} left` }, { ...item, name: `${item.name} right`, z: [-item.z[1], -item.z[0]] }];
}

/** The face: the windscreen, the slots under it, the signal brackets, the roof lamp and the livery's paint. */
function faceItems(l: Livery): EndItem[] {
  return [
    ...pair({ kind: "window", name: "windscreen", z: [0.07, 1.06], y: [3.15, 3.82], mat: "rim", wiper: true }),
    ...pair({ kind: "paint", name: "screen slot", z: [0.25, 0.95], y: [3.04, 3.075], mat: "black", layer: 1 }),
    ...pair({ kind: "paint", name: "signal bracket", z: [0.26, 0.34], y: [2.62, 2.74], mat: "black", layer: 4 }),
    ...l.face,
    { kind: "lamp", name: "top headlight", z: [-0.085, 0.085], y: [4.03, 4.2], r: 0.075 },
  ];
}

/** The side, x toward the "2" end: the cab items mirrored to both ends, the machine room as photographed (the same on both sides). */
function sideItems(l: Livery): SideItem[] {
  const up = [3.15, 3.78] as const;
  const low = [1.74, 2.56] as const;
  const upper: Array<[number, number]> = [[-4.5, -3.6], [-3.5, -2.6], [-2.05, -1.05], [-0.95, 0.2], [0.28, 0.86], [3.72, 4.48]];
  return [
    { kind: "door", name: "cab door", x: [4.75, 5.35], y: [0.95, BAND], rails: true, mirror: true },
    { kind: "window", name: "cab window rear", x: [5.8, 6.24], y: [3.15, 3.8], mat: "rim", r: 0.08, mirror: true },
    { kind: "window", name: "cab window front", x: [6.26, 6.78], y: [3.15, 3.8], mat: "rim", r: 0.08, mirror: true },
    ...(l.windowBand ? [{ kind: "paint", name: "window band", x: [-5.74, 5.74], y: [BAND, EAVE + 0.02], mat: "band", layer: 0 } as SideItem] : []),
    { kind: "window", name: "door window", x: [4.86, 5.6], y: up, mat: "rim", r: 0.06, mirror: true },
    ...upper.map(([a, b], i): SideItem => ({ kind: "window", name: `room window ${i + 1}`, x: [a, b], y: up, mat: "rim", r: 0.06 })),
    { kind: "grille", name: "upper grille 1", x: [0.94, 2.12], y: up, slats: "v", pitch: 0.06, mat: "slat", r: 0.04 },
    { kind: "grille", name: "upper grille 2", x: [2.22, 3.32], y: up, slats: "v", pitch: 0.06, mat: "slat", r: 0.04 },
    { kind: "grille", name: "radiator grille 1", x: [0.8, 1.87], y: low, slats: "v", pitch: 0.055, mat: "slat", r: 0.04 },
    { kind: "grille", name: "radiator grille 2", x: [2.1, 3.1], y: low, slats: "v", pitch: 0.055, mat: "slat", r: 0.04 },
    { kind: "grille", name: "radiator grille 3", x: [3.69, 4.25], y: low, slats: "v", pitch: 0.055, mat: "slat", r: 0.04 },
    { kind: "window", name: "small window 1", x: [-3.75, -3.27], y: [1.8, 2.5], mat: "rim", r: 0.06 },
    { kind: "window", name: "small window 2", x: [-1.9, -1.42], y: [1.8, 2.5], mat: "rim", r: 0.06 },
    { kind: "paint", name: "emblem", x: [-0.42, -0.08], y: [2.26, 2.56], mat: l.face.find((i) => i.name === "emblem")!.mat!, layer: 1 },
    { kind: "paint", name: "emblem field", x: [-0.39, -0.11], y: [2.29, 2.53], mat: "body", layer: 2 },
    { kind: "plate", name: "number", x: [-0.75, 0.25], y: [2.06, 2.18] },
  ];
}

/** The locomotive's kit spec for a livery. */
export function br218Spec(v?: ParamValues): LocoSpec {
  const l = LIVERIES[resolveParams(BR218_PARAMS, v).livery!]!;
  return {
    palette: { exhaust: c("#2b2b2b", 0.9), ...l.palette },
    y0: SKIRT,
    tip: TIP,
    hw: HW,
    endPlan: plan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: "roofGrey",
    buffers: HALF,
    beam: N,
    bufferY: 1.06,
    // the floor inside the shell, over the wheels
    frame: { y0: 1.02, y1: 1.06, half: 5.5, hw: W - 0.1, mat: "frame" },
    bogies: [-PIVOT, PIVOT].map((xc) => ({ xc, axles: [-AXLE, AXLE], wheelR: WHEEL_R, frameTop: WHEEL_R + 0.25 })),
    sideItems: sideItems(l),
    endItems: faceItems(l),
    roofItems: [{ name: "engine room hatch", x: [-4.6, 4.4], w: [0.95, 0.9], y: [ROOF - 0.02, ROOF + 0.05], mat: "roofGrey" }],
    // the fuel tank (3,200 l) between the bogies
    underItems: [[-2.15, 2.15, 0.42, SKIRT + 0.02, 1.2]],
    number: l.number,
  };
}

/** The shell's underside, so the open bottom does not show between the bogies. */
function underside(m: MeshBuilder): void {
  const tip = TIP[0]![1];
  const pts = plan(SKIRT, W);
  const front = [...pts].reverse().map(([z, b]) => [tip - b, -z] as [number, number]).concat(pts.slice(1).map(([z, b]) => [tip - b, z] as [number, number]));
  const ring: Ring = [...front, ...front.map(([x, z]) => [-x, -z] as [number, number])];
  m.scope("underside", () => m.cap("frame", ring, SKIRT, false));
}

/** A prism of the (z, y) section q along x from a to b. */
const slab = (m: MeshBuilder, mat: string, q: Ring, [a, b]: [number, number]) => m.sweep(mat, "x", q, a, q, b);

/** Under each end: the buffer beam, the ledge over it and the lamp housing standing off the face. */
function ends(m: MeshBuilder, l: Livery): void {
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      m.scope("buffer beam", () => block(m, l.beam, ...along(6.9, N + 0.04), 0.78, 1.44, -1.42, 1.42));
      m.scope("ledge", () => block(m, l.ledge, ...along(N - 0.2, N + 0.13), LEDGE[0], LEDGE[1], -1.4, 1.4));
      m.scope("lamp housing", () => {
        const [y0, y1] = LAMPS, h = LAMP_HW;
        const q: Ring = [[-h, y0], [h, y0], [h + 0.04, y0 + 0.05], [h + 0.04, y1 - 0.05], [h, y1], [-h, y1], [-h - 0.04, y1 - 0.05], [-h - 0.04, y0 + 0.05]];
        slab(m, "black", q, along(N - 0.06, N + LAMP_OUT));
        const out = (d0: number, d1: number) => along(N + LAMP_OUT + d0, N + LAMP_OUT + d1);
        const yc = (y0 + y1) / 2;
        for (const z of [-1, 1]) {
          m.scope("headlight", () => {
            slab(m, "rim", ngon(16, 0.135, 0, z * 0.94, yc), out(0, 0.02));
            slab(m, "lampHead", ngon(16, 0.1, 0, z * 0.94, yc), out(0.02, 0.035));
          });
          m.scope("tail lamp", () => {
            slab(m, "rim", ngon(16, 0.125, 0, z * 0.69, yc), out(0, 0.02));
            slab(m, "lampRed", ngon(16, 0.09, 0, z * 0.69, yc), out(0.02, 0.03));
          });
        }
        m.scope("horn grille", () => {
          slab(m, "rim", [[-0.5, yc - 0.09], [0.5, yc - 0.09], [0.5, yc + 0.09], [-0.5, yc + 0.09]], out(0, 0.012));
          for (const dy of [-0.045, 0, 0.045]) slab(m, "louvre", [[-0.44, yc + dy - 0.013], [0.44, yc + dy - 0.013], [0.44, yc + dy + 0.013], [-0.44, yc + dy + 0.013]], out(0.012, 0.022));
        });
      });
    });
}

export function dbBr218(v?: ParamValues): MeshBuilder {
  const l = LIVERIES[resolveParams(BR218_PARAMS, v).livery!]!;
  const m = buildBoxLoco(br218Spec(v));
  m.scope("body", () => underside(m));
  m.scope("ends", () => ends(m, l));
  // the engine's two silencer stacks amidships, taller than the kit's
  m.scope("roof equipment", () => { for (const x of [-0.4, 0.4]) exhaust(m, x, 0, ROOF - 0.03, ROOF + 0.3, 0.32, 0.44); });
  return m;
}

/** The distant model: the kit's, from the same profile tables and paint. */
export function dbBr218Lod(v?: ParamValues): MeshBuilder {
  const l = LIVERIES[resolveParams(BR218_PARAMS, v).livery!]!;
  const s = br218Spec(v);
  if (!l.windowBand) return boxLocoLod(s);
  // the grey band under the roof as a side band (the cabs' short red stretch left out)
  const side = s.side.flatMap(([a, b, mat]): Band[] => (a < BAND && b > BAND ? [[a, BAND, mat], [BAND, b, "band"]] : [[a, b, mat]]));
  return boxLocoLod({ ...s, side });
}
