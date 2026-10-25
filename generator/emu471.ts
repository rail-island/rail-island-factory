// The CD 471 CityElefant, the Skoda double-deck electric unit of Prague's
// suburban network: one design `veh-cd-471` whose `unit` picks the car of the
// three-car set - the 471 motor car (default), the 071 trailer or the 971
// driving trailer - and whose `variant` picks the CD 471 in its CityElefant
// livery or vlakosimdb's red "CD 675", the same body and layout in another
// paint and class (assets/cd-471/SOURCES.md says why it is no separate design).
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/cd-471/native
// (db/train/emu/cd 471/cd_471, cd_071, cd_971) and assets/cd-675/native (cd 675):
// the XML `alongx` section, the `alongz` elevation (the low-floor centre between
// the bogies, the cab nose, the motor car's pantograph well) and windows, doors
// and paint laid from native pixel boxes, 0.1 m a pixel, with the height scaled
// to the published 4.635 m and the width to 2.82 m. Every car faces +X: a cab
// car's cab is its +X end. See docs/models/czech-emus.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import type { Vec3 } from "./meshCore.ts";
import { Coach, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { LOD_GLASS } from "./lodKit.ts";
import { bogieParts, coachBody, fitUnit, pantographParts, shifted, sideGlass } from "./lodUnits.ts";
import { emblem } from "./cd163.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { blockX, centreCoupler, EMU_CATALOG, enumParam, pantograph, slopePanel, tractionNumber } from "./emuParts.ts";

/** The published height (4.635 m) over the XML's 4.8 m roof: every source height is scaled by it. */
export const K_Y = 4.635 / 4.8;
/** The published width (2.82 m) over the XML's 3.0 m section. */
export const K_Z = 2.82 / 3.0;

export type ElefantUnit = "motorCar" | "trailer" | "drivingTrailer";
export type ElefantVariant = "cd471" | "cd675";

export const CD471_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car",
    trailer: "Trailer",
    drivingTrailer: "Driving trailer",
  }),
  enumParam("variant", "Variant", {
    cd471: "CityElefant",
    cd675: "CD 675",
  }),
];

/** The class of each car in each variant; vlakosimdb's own numbering. */
const CLASSES: Record<ElefantVariant, Record<ElefantUnit, string>> = {
  cd471: { motorCar: "471", trailer: "071", drivingTrailer: "971" },
  cd675: { motorCar: "675", trailer: "075", drivingTrailer: "975" },
};

/** The set the running numbers name: 471 014 (photographed at Srbsko), and an illustrative 675 001. */
const SERIAL: Record<ElefantVariant, string> = { cd471: "014", cd675: "001" };

/** The running number a car carries, e.g. `471 014-1`. */
export function elefantNumber(variant: ElefantVariant, unit: ElefantUnit): string {
  return tractionNumber(CLASSES[variant][unit], SERIAL[variant]);
}

interface Paint {
  palette: Record<string, MaterialSpec>;
  /** The band between the decks. */
  band: string;
  /** The stripe along the single-level ends. */
  stripe: string;
  /** The door leaves. */
  door: string;
  /** The apron's lower edge. */
  apron: string;
}

// the native BMP colours (z_both, x_inc) of each variant
const PAINTS: Record<ElefantVariant, Paint> = {
  cd471: {
    palette: {
      white: { color: "#f4f5f4", roughness: 0.5 },
      blue: { color: "#394a8c", roughness: 0.5 },
      stripeRed: { color: "#c63131", roughness: 0.5 },
      doorRed: { color: "#ce0800", roughness: 0.5 },
      canopy: { color: "#18215a", roughness: 0.5 },
      yellow: { color: "#ffce10", roughness: 0.5 },
      apronYellow: { color: "#b58c08", roughness: 0.6 },
    },
    band: "blue",
    stripe: "stripeRed",
    door: "doorRed",
    apron: "apronYellow",
  },
  cd675: {
    palette: {
      white: { color: "#f4f5f4", roughness: 0.5 },
      red: { color: "#ce0800", roughness: 0.5 },
      stripeGreen: { color: "#284748", roughness: 0.5 },
      canopy: { color: "#840000", roughness: 0.5 },
      yellow: { color: "#ffce10", roughness: 0.5 },
      apronYellow: { color: "#b08f0f", roughness: 0.6 },
    },
    band: "red",
    stripe: "stripeGreen",
    door: "red",
    apron: "apronYellow",
  },
};

const PALETTE: Record<string, MaterialSpec> = {
  frame: { color: "#bdbdbd", metallic: 0.2, roughness: 0.45 },
  glass: { color: "#3c4248", metallic: 0.2, roughness: 0.15, glass: true },
  skirt: { color: "#737373", roughness: 0.7 },
  skirtDark: { color: "#424242", roughness: 0.8 },
  cabBlack: { color: "#202020", roughness: 0.6 },
  trim: { color: "#bdbdbd", roughness: 0.5 },
  louvre: { color: "#a9adb0", roughness: 0.6 },
  lettering: { color: "#f2f2f2", roughness: 0.5 },
  emblemBack: { color: "#f4f5f4", roughness: 0.5 },
  pantograph: { color: "#4b4f55", metallic: 0.2, roughness: 0.6 },
  carbon: { color: "#2b2b2b", roughness: 0.8 },
  insulator: { color: "#8a4a26", roughness: 0.4 },
  coupler: { color: "#3a3c3f", metallic: 0.3, roughness: 0.5 },
  motor: { color: "#2e3033", roughness: 0.8 },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  lampWhite: { color: "#f3f5f6", roughness: 0.2, lamp: { role: "head" } },
  lampRed: { color: "#c8202c", roughness: 0.3, lamp: { role: "tail" } },
};

export type PxBox = [number, number, number, number];

/**
 * One car's layout: native side-view pixel boxes on its own z_both BMP (260 x 60,
 * 0.1 m a pixel) and the column-to-body mapping. Body metres `b` run from the
 * inner end wall (0) to the cab tip or the other end wall.
 */
interface CarLayout {
  key: string;
  /** Native column to body metres. */
  u2b: (u: number) => number;
  /** Body length, end wall to end wall (a cab car: to the nose tip). */
  length: number;
  cab: boolean;
  motor: boolean;
  /** The floor drop to 0.2 m: [b of the 0.9 m edge, b of the 0.2 m edge] at each end of the low centre. */
  low: [number, number, number, number];
  upper: PxBox[];
  /** Upper windows with a transom bar (an opening top light): their indices in `upper`. */
  transom: number[];
  lower: PxBox[];
  /** The windows of the single-level ends, in the band between the decks. */
  ends: PxBox[];
  doors: PxBox[];
  doorGlass: PxBox[];
  canopies: PxBox[];
  stripes: PxBox[];
  yellow: PxBox[];
  /** The light grey trim line under the upper windows on the single-level ends. */
  trim: PxBox[];
  emblem: PxBox;
  number: PxBox;
  /** Grey louvres on the roof's side slope. */
  louvres: PxBox[];
  /** A cab car's side: window, door, its window, the handrail columns and the step. */
  cabSide?: { window: PxBox; door: PxBox; doorGlass: PxBox; rails: [number, number]; step: PxBox; stripe: PxBox };
}

const NOSE_TIP = 25.1;

/** The cab cars' nose (the 471 XML, both cab cars): plan and elevation in body metres, source heights. */
const NOSE_PLAN: Pt[] = [[24.4, 1.5], [24.9, 1.4], [25.1, 1.2]];
// the slope's points at the paint bands' edges (3.3 and 2.2 m) keep each band's clamped ring on the one plane
const noseAt = (y: number): Pt => [25.1 - (0.6 * (y - 1.6)) / 2.5, y];
const NOSE_TOP: Pt[] = [[23.5, 4.8], [24.5, 4.1], noseAt(3.3), noseAt(2.2), [25.1, 1.6]];
const NOSE_BOTTOM: Pt[] = [[24.8, 0.9], [25.1, 1.6]];

/** vlakosimdb's 971 body is 24.4 m against the 471's 25.1 m: its columns are stretched to the 471's length. */
const S971 = 25.1 / 24.4;

const LAYOUTS: Record<ElefantUnit, CarLayout> = {
  motorCar: {
    key: "cd_471",
    u2b: (u) => NOSE_TIP - u / 10,
    length: NOSE_TIP,
    cab: true,
    motor: true,
    low: [5.0, 5.4, 19.5, 19.9],
    upper: [[90, 17, 96, 24], [99, 17, 113, 26], [116, 17, 130, 26], [134, 17, 148, 26], [151, 17, 165, 26], [168, 17, 182, 26]],
    transom: [1, 5],
    lower: [[67, 40, 74, 49], [99, 39, 113, 49], [116, 39, 130, 49], [134, 39, 148, 49], [151, 39, 165, 49]],
    ends: [[196, 28, 210, 37], [223, 28, 237, 37]],
    doors: [[76, 33, 92, 57], [166, 33, 182, 57]],
    doorGlass: [[77, 35, 83, 49], [85, 35, 91, 49], [167, 35, 173, 49], [175, 35, 181, 49]],
    canopies: [[73, 32, 96, 33], [163, 32, 186, 33]],
    stripes: [[28, 43, 64, 45], [186, 43, 250, 45]],
    yellow: [[99, 26, 182, 27]],
    trim: [[30, 25, 98, 26], [183, 25, 250, 26]],
    emblem: [212, 30, 221, 35],
    number: [124, 52, 139, 54],
    louvres: [[23, 13, 31, 16], [32, 13, 41, 16], [42, 13, 50, 16]],
    cabSide: { window: [6, 28, 16, 37], door: [18, 27, 27, 49], doorGlass: [20, 29, 25, 38], rails: [17.5, 27.5], step: [20, 49, 25, 51], stripe: [19, 43, 26, 45] },
  },
  trailer: {
    key: "cd_071",
    u2b: (u) => u / 10 - 0.2,
    length: 25.3,
    cab: false,
    motor: false,
    low: [5.1, 5.3, 20.0, 20.2],
    upper: [[62, 17, 76, 26], [79, 17, 93, 26], [97, 17, 110, 26], [113, 17, 127, 26], [130, 17, 144, 26], [147, 17, 161, 26], [164, 17, 178, 26], [181, 17, 195, 26]],
    transom: [0, 7],
    lower: [[80, 39, 93, 49], [97, 39, 110, 49], [113, 39, 127, 49], [130, 39, 144, 49], [147, 39, 161, 49], [164, 39, 178, 49]],
    ends: [[17, 28, 31, 37], [36, 28, 50, 37], [207, 28, 221, 37], [225, 28, 239, 37], [244, 31, 250, 37]],
    doors: [[61, 33, 77, 57], [179, 33, 195, 57]],
    doorGlass: [[62, 35, 68, 49], [70, 35, 76, 49], [180, 35, 186, 49], [188, 35, 194, 49]],
    canopies: [[58, 32, 81, 33], [176, 32, 199, 33]],
    stripes: [[3, 43, 58, 45], [199, 43, 254, 45]],
    yellow: [[80, 26, 178, 27]],
    trim: [[3, 25, 61, 26], [196, 25, 254, 26]],
    emblem: [100, 31, 109, 36],
    number: [124, 52, 139, 54],
    louvres: [],
  },
  drivingTrailer: {
    key: "cd_971",
    u2b: (u) => (u / 10 - 0.2) * S971,
    length: NOSE_TIP,
    cab: true,
    motor: false,
    low: [5.0 * S971, 5.4 * S971, 18.8 * S971, 19.2 * S971],
    upper: [[64, 17, 76, 26], [80, 17, 92, 26], [95, 17, 107, 26], [109, 17, 122, 26], [125, 17, 137, 26], [140, 17, 152, 26], [155, 17, 168, 26], [173, 17, 185, 26]],
    transom: [0, 7],
    lower: [[79, 39, 92, 49], [95, 39, 107, 49], [110, 39, 123, 49], [125, 39, 137, 49], [139, 39, 152, 49], [173, 40, 179, 49]],
    ends: [[18, 28, 32, 37], [36, 28, 50, 37]],
    doors: [[61, 33, 77, 57], [153, 33, 169, 57]],
    doorGlass: [[62, 35, 68, 49], [70, 35, 76, 49], [154, 35, 160, 49], [162, 35, 168, 49]],
    canopies: [[58, 32, 81, 33], [149, 32, 173, 33]],
    stripes: [[3, 43, 58, 45], [182, 43, 218, 45]],
    yellow: [[80, 26, 168, 27]],
    trim: [[3, 25, 60, 26], [173, 25, 215, 26]],
    emblem: [2, 30, 11, 35],
    number: [124, 52, 139, 54],
    louvres: [[206, 20, 211, 22], [212, 20, 217, 22]],
    cabSide: { window: [229, 28, 240, 37], door: [218, 27, 227, 48], doorGlass: [220, 28, 226, 37], rails: [217.5, 227.5], step: [221, 49, 225, 51], stripe: [219, 43, 226, 45] },
  },
};

/** The section of the XML alongx at published size: lower deck down to 0.2 m, upper wall sloping in above 3.8 m. */
const SRC_SECTION: Pt[] = [[-1.3, 0.2], [1.3, 0.2], [1.5, 0.4], [1.5, 3.8], [1.2, 4.4], [0.7, 4.8], [-0.7, 4.8], [-1.2, 4.4], [-1.5, 3.8], [-1.5, 0.4]];
export const ELEFANT_SECTION: Pt[] = SRC_SECTION.map(([z, y]) => [z * K_Z, y * K_Y]);
const HALF = 1.5 * K_Z;
const ys = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x, y * K_Y]);

/** The native side box [left, top, right, bottom] as a body box (metres along the body, height). */
function sb(L: CarLayout, b: PxBox): Box {
  const [x0, x1] = [L.u2b(b[0]), L.u2b(b[2])].sort((p, q) => p - q) as [number, number];
  return { x0, x1, y0: K_Y * (6 - b[3] / 10), y1: K_Y * (6 - b[1] / 10) };
}

/** Front-view pixel columns (30 px across 3 m, seen from outside the +X end) to z. */
const fz = (u: number) => (1.5 - u / 10) * K_Z;
/** Native row to height. */
const fy = (v: number) => K_Y * (6 - v / 10);

/** Centre of the car (body metres) between its coupling faces: the inner bellows and the cab coupler or the far bellows. */
const BELLOWS = 0.2;
const CAB_COUPLER = 0.75;
function centreOf(L: CarLayout): number {
  const far = L.cab ? L.length + CAB_COUPLER : L.length + BELLOWS;
  return (far - BELLOWS) / 2;
}

/** The bogie pivots: 19.0 m apart (published), centred on the source's bogie midpoint. */
const BOGIES: [number, number] = [3.15, 22.15];

/** A car of the CD 471 CityElefant (or the vlakosimdb CD 675) set. */
export function cd471(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD471_PARAMS, params);
  const unit = p.unit as ElefantUnit;
  const variant = p.variant as ElefantVariant;
  return elefantCar(unit, variant);
}

/** A car's body: the cab cars' nose, the motor car's pantograph well, the low floor between the bogies. */
function volume471(unit: ElefantUnit, paint: Paint): Volume {
  const L = LAYOUTS[unit];
  const [l0, l1, l2, l3] = L.low;
  const plan: Pt[] = L.cab ? [[0, HALF], ...NOSE_PLAN.map(([x, h]): Pt => [x, h * K_Z])] : [[0, HALF], [L.length, HALF]];
  const top: Pt[] | undefined = unit === "motorCar"
    // the pantograph well over the inner bogie (XML x 19.5..23.4 -> body 1.7..5.6)
    ? ys([[0, 4.8], [1.7, 4.8], [2.2, 4.2], [5.0, 4.2], [5.6, 4.8], ...NOSE_TOP])
    : L.cab ? ys([[0, 4.8], ...NOSE_TOP]) : undefined;
  const bottom: Pt[] = ys([[0, 0.9], [l0, 0.9], [l1, 0.2], [l2, 0.2], [l3, 0.9], ...(L.cab ? NOSE_BOTTOM : [[L.length, 0.9] as Pt])]);
  return {
    name: "body",
    section: ELEFANT_SECTION,
    plan,
    ...(top ? { top } : {}),
    bottom,
    bands: [[0.2 * K_Y, 0.4 * K_Y, "skirtDark"], [0.4 * K_Y, 0.9 * K_Y, "skirt"], [0.9 * K_Y, 2.2 * K_Y, "white"], [2.2 * K_Y, 3.3 * K_Y, paint.band], [3.3 * K_Y, 4.8 * K_Y, "white"]],
    endPaint: "white",
  };
}

function elefantCar(unit: ElefantUnit, variant: ElefantVariant): MeshBuilder {
  const L = LAYOUTS[unit];
  const paint = PAINTS[variant];
  const c = new Coach({ ...PALETTE, ...paint.palette }, centreOf(L));
  const m = c.m;
  const body = volume471(unit, paint);
  const box = (b: PxBox) => sb(L, b);
  const number = elefantNumber(variant, unit);
  m.scope("body", () => {
    c.volume(body);
    for (const s of [1, -1]) m.scope(s > 0 ? "right side" : "left side", () => sideWork(c, body, L, paint, s, number));
  });
  if (L.cab) m.scope("cab", () => cab(c, body, L, paint));
  for (const e of L.cab ? [-1] : [-1, 1]) m.scope(e > 0 ? "front end" : "rear end", () => innerEnd(c, body, L, e));
  if (unit === "motorCar")
    m.scope("roof equipment", () => {
      m.scope("pantographs", () => m.scope("pantograph", () => pantograph(m, { x: c.X(3.25), roof: 4.2 * K_Y, hinge: -1, raised: true })));
      m.scope("well louvres", () => {
        for (const s of [1, -1])
          m.scope(s > 0 ? "right" : "left", () => {
            for (const b of [[209, 19, 217, 24], [218, 19, 226, 24], [227, 19, 235, 24]] as PxBox[]) c.sidePanel(body, "louvre", s, box(b), 0.012, 0.02);
          });
      });
    });
  if (L.louvres.length)
    m.scope("roof louvres", () => {
      for (const s of [1, -1])
        m.scope(s > 0 ? "right" : "left", () => {
          for (const b of L.louvres) c.sidePanel(body, "louvre", s, box(b), 0.012, 0.02);
        });
    });
  m.scope("running gear", () => {
    BOGIES.forEach((bc, i) =>
      m.scope(`bogie ${i + 1}`, () => {
        const wb = L.motor ? 2.6 : 2.4;
        c.bogie(bc, wb, 0.46, 0.85);
        if (L.motor)
          m.scope("traction motors", () => {
            for (const d of [-0.62, 0.62]) block(m, "motor", c.X(bc) + d - 0.28, c.X(bc) + d + 0.28, 0.3, 0.68, -0.5, 0.5);
          });
      }),
    );
  });
  return m;
}

/**
 * A car of the CityElefant for distant views (lodUnits.ts): the double-deck
 * section, the cab cars' raked nose with its windscreen, the livery's band
 * between the decks, both window rows, the bogies and the motor car's raised
 * pantograph.
 */
export function cd471Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD471_PARAMS, params);
  const unit = p.unit as ElefantUnit;
  const paint = PAINTS[p.variant as ElefantVariant];
  const L = LAYOUTS[unit];
  const centre = centreOf(L);
  const windows = sideGlass(shifted([...L.upper, ...L.lower, ...L.ends].map((b) => sb(L, b)), centre), 0.6, 2);
  const body = coachBody([{ v: volume471(unit, paint), X: (b) => b - centre }], {
    y0: 0.9 * K_Y, windows, ...(L.cab ? { frontWindows: [{ u: [fz(26), fz(4)], y: [fy(36.9), fy(27)], mat: LOD_GLASS }] } : {}),
  });
  const half = (L.motor ? 1.3 : 1.2) + 0.66;
  return fitUnit({
    palette: { ...PALETTE, ...paint.palette },
    bodies: [body],
    parts: [
      ...bogieParts(BOGIES.map((b) => [b - centre, half] as const), 0.9 * K_Y),
      ...(unit === "motorCar" ? pantographParts([3.25 - centre], 4.2 * K_Y, 4.2 * K_Y + 0.25) : []),
    ],
  }, 100);
}

/** Windows, doors, paint lines and markings on side s. */
function sideWork(c: Coach, v: Volume, L: CarLayout, paint: Paint, s: number, number: string): void {
  const m = c.m;
  const box = (b: PxBox) => sb(L, b);
  m.scope("paint lines", () => {
    L.stripes.forEach((b, i) => m.scope(`stripe ${i + 1}`, () => c.sidePanel(v, paint.stripe, s, box(b), 0.004, 0.003)));
    L.yellow.forEach((b, i) => m.scope(`yellow line ${i + 1}`, () => c.sidePanel(v, "yellow", s, box(b), 0.004, 0.003)));
    L.trim.forEach((b, i) => m.scope(`trim ${i + 1}`, () => c.sidePanel(v, "trim", s, box(b), 0.004, 0.003)));
  });
  m.scope("upper windows", () =>
    L.upper.forEach((b, i) => {
      const bb = box(b);
      m.scope(`window ${i + 1}`, () => c.window(v, s, bb, { fw: 0.08, ...(L.transom.includes(i) ? { sash: fy(21) } : {}) }));
    }),
  );
  m.scope("lower windows", () => L.lower.forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(v, s, box(b), { fw: 0.08 }))));
  m.scope("end windows", () => L.ends.forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(v, s, box(b), { fw: 0.08 }))));
  m.scope("doors", () => {
    L.doors.forEach((b, i) =>
      m.scope(`door ${i + 1}`, () => {
        // two-leaf sliding plug doors, the lights riding on the leaves (doors.ts)
        c.door(v, s, box(b), paint.door, {
          seam: 0.03,
          opens: { kind: "plug", leaves: 2 },
          leafWork: (clip) => {
            for (const g of L.doorGlass.slice(2 * i, 2 * i + 2)) {
              const w = clip(box(g));
              if (w) c.window(v, s, w, { fw: 0.05 });
            }
          },
        });
      }),
    );
    L.canopies.forEach((b, i) => m.scope(`canopy ${i + 1}`, () => c.sidePanel(v, "canopy", s, box(b), 0.03, 0.04)));
  });
  m.scope("emblem", () => {
    const e = box(L.emblem);
    c.sidePanel(v, "emblemBack", s, e, 0.006, 0.004);
    const h = (e.y1 - e.y0) * 0.62;
    const w = h * 1.5385;
    const cx = c.X((e.x0 + e.x1) / 2);
    const u0 = s > 0 ? cx - w / 2 : cx + w / 2;
    const y0 = (e.y0 + e.y1) / 2 - h / 2;
    m.facets(paint.band, emblem(u0, y0, h, s < 0).map(([u, vv]): Vec3 => [u, vv, s * (HALF + 0.011)]), [0, 0, s]);
  });
  m.scope("running number", () => {
    const n = box(L.number);
    c.inscription(v, s, (n.x0 + n.x1) / 2, [{ text: number, y: n.y0, h: n.y1 - n.y0 }], 0.006, "lettering");
  });
}

/** The cab: windscreen, lamps, the apron and the coupler on the nose (x_inc of the 471). */
function cab(c: Coach, v: Volume, L: CarLayout, paint: Paint): void {
  const m = c.m;
  const X = (b: number) => c.X(b);
  // the nose's upper plane (XML 0.6 m back at 4.1 m) and its undercut (0.3 m back at 0.9 m)
  const upper = { x0: X(25.1), y0: 1.6 * K_Y, x1: X(24.5), y1: 4.1 * K_Y };
  const roof = { x0: X(24.5), y0: 4.1 * K_Y, x1: X(23.5), y1: 4.8 * K_Y };
  const under = { x0: X(24.8), y0: 0.9 * K_Y, x1: X(25.1), y1: 1.6 * K_Y };
  m.scope("windscreen", () => {
    slopePanel(m, "cabBlack", 1, upper, fz(4), fz(26), fy(36.9), fy(27), 0.006, 0.01);
    slopePanel(m, "glass", 1, upper, fz(5), fz(25), fy(35.9), fy(28), 0.016, 0.008);
    // the centre pillar
    slopePanel(m, "cabBlack", 1, upper, fz(15.4), fz(14.6), fy(35.9), fy(28), 0.022, 0.004);
  });
  m.scope("top lamp", () => {
    slopePanel(m, "cabBlack", 1, upper, fz(13), fz(17), fy(24), fy(20), 0.008, 0.01);
    slopePanel(m, "lampWhite", 1, upper, fz(13.6), fz(16.4), fy(23.4), fy(20.6), 0.018, 0.008);
  });
  m.scope("visor", () => slopePanel(m, "trim", 1, roof, fz(11), fz(19), fy(18.8), fy(17.2), 0.006, 0.01));
  // the stripe the BMP paints across its full 3 m canvas, held to the 2.26 m nose tip
  m.scope("front stripe", () => slopePanel(m, paint.stripe, 1, upper, fz(3.1), fz(26.9), fy(44.9), fy(42.9), 0.004, 0.003));
  m.scope("lamps", () => {
    // x_inc columns 2..11 and 19..28, rows 42..45: a housing of three lenses each side
    for (const [k, z] of [-0.85 * K_Z, 0.85 * K_Z].entries())
      m.scope(`lamp ${k + 1}`, () => {
        // a lamp housing at the nose tip, its lenses facing +X
        const x = X(25.1);
        blockX(m, "cabBlack", x - 0.12, x + 0.04, fy(45), fy(42), z - 0.45 * K_Z, z + 0.45 * K_Z);
        for (const [j, dz] of [-0.25, 0, 0.25].entries()) {
          const lens = ngon(10, 0.055, 0, z + dz, fy(43.5));
          m.sweep(j === (z > 0 ? 0 : 2) ? "lampRed" : "lampWhite", "x", lens, x + 0.04, lens, x + 0.055);
        }
      });
  });
  m.scope("lower front", () => slopePanel(m, "cabBlack", 1, under, -fz(1.5), fz(1.5), 0.9 * K_Y + 0.01, fy(45.6), 0.006, 0.01));
  // the apron under the nose (XML x 0.3..0.7, 0.2..0.9 m): black over a yellow edge
  m.scope("apron", () => {
    m.scope("upper", () => c.sideSweep("cabBlack", [[24.4, 0.6 * K_Y], [24.74, 0.6 * K_Y], [24.7, 0.9 * K_Y], [24.4, 0.9 * K_Y]], -1.27, 1.27));
    m.scope("edge", () => c.sideSweep(paint.apron, [[24.4, 0.2 * K_Y], [24.8, 0.2 * K_Y], [24.74, 0.6 * K_Y], [24.4, 0.6 * K_Y]], -1.27, 1.27));
  });
  m.scope("coupler", () => centreCoupler(m, 1, X(24.3), X(L.length + CAB_COUPLER), 0.78));
  // the cab side: window, door, handrails and step, on both sides
  for (const s of [1, -1])
    m.scope(s > 0 ? "right cab side" : "left cab side", () => {
      const cs = L.cabSide!;
      const cb = (b: PxBox) => sb(L, b);
      m.scope("cab window", () => c.window(v, s, cb(cs.window), { fw: 0.06 }));
      m.scope("cab door", () => {
        c.door(v, s, cb(cs.door), "white", { seam: 0.03 });
        c.window(v, s, cb(cs.doorGlass), { fw: 0.05 });
        m.scope("stripe", () => c.sidePanel(v, paint.stripe, s, cb(cs.stripe), 0.013, 0.002));
      });
      m.scope("handrails", () => {
        for (const u of cs.rails) {
          const b = cb([u - 0.5, 33, u + 0.5, 46]);
          c.handrail(v, s, (b.x0 + b.x1) / 2, b.y0, b.y1);
        }
      });
      m.scope("step", () => {
        const b = cb(cs.step);
        block(m, "skirtDark", c.X(b.x0), c.X(b.x1), b.y0 - 0.03, b.y1 - 0.02, ...side(s, HALF - 0.25, HALF - 0.02));
      });
    });
}

/** The inner end e: gangway bellows, its door and marker lamps (x_dec of the 471, x_both of the 071). */
function innerEnd(c: Coach, v: Volume, L: CarLayout, e: number): void {
  const m = c.m;
  const wall = e > 0 ? L.length : 0;
  const face = wall + e * BELLOWS;
  const X = c.X.bind(c);
  m.scope("gangway", () => {
    const [a, b] = [X(wall) - e * 0.02, X(face)].sort((p, q) => p - q) as [number, number];
    // the bellows frame, x_dec columns 9..21 (z +-0.6 m before the width scale), rows 19..48
    for (const z of [-1, 1]) block(m, "rubber", a, b, fy(48), fy(19), ...side(z, 0.46, 0.6 * K_Z));
    block(m, "rubber", a, b, fy(21), fy(19), -0.46, 0.46);
    block(m, "rubber", a, b, fy(48), fy(46), -0.46, 0.46);
  });
  // the end door inside the bellows, x_dec columns 11..19, rows 26..44
  m.scope("end door", () => c.door(v, e, { x0: -0.4 * K_Z, x1: 0.4 * K_Z, y0: fy(44), y1: fy(26) }, "white", { end: true, seam: 0.03 }));
  m.scope("marker lamps", () => {
    for (const z of [-1.05, 1.05]) {
      const lens = ngon(8, 0.05, 0, z * K_Z, fy(43));
      m.sweep("lampRed", "x", lens, X(wall) + e * 0.002, lens, X(wall) + e * 0.03);
    }
  });
  m.scope("coupler", () => {
    const bar = ngon(8, 0.08, Math.PI / 8, 0, 0.72);
    const [a, b] = [X(wall - e * 0.6), X(face) - e * 0.01].sort((p, q) => p - q) as [number, number];
    m.sweep("coupler", "x", bar, a, bar, b);
  });
}

/** Every car and variant, for the tests: [unit, variant]. */
export const ELEFANT_CARS: ReadonlyArray<[ElefantUnit, ElefantVariant]> = (["motorCar", "trailer", "drivingTrailer"] as const).flatMap((u) => (["cd471", "cd675"] as const).map((v): [ElefantUnit, ElefantVariant] => [u, v]));

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_471_GAME: GameProperties = {
  weight: 70,
  power: 1000,
  maxspeed: 140,
  accel: null,
  variants: [
    { params: { variant: "cd675" }, maxspeed: 160 },
    { params: { unit: "drivingTrailer", variant: "cd675" }, maxspeed: 160 },
    { params: { unit: "trailer", variant: "cd675" }, weight: 50, power: 0, maxspeed: 160 },
    { params: { unit: "trailer" }, weight: 50, power: 0 },
  ],
};

export const EMU471_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-cd-471", game: CD_471_GAME, title: "CD 471 CityElefant", build: cd471, buildLod: cd471Lod, params: CD471_PARAMS, catalog: EMU_CATALOG, references: "cd-471" },
];

export { LAYOUTS as ELEFANT_LAYOUTS, centreOf as elefantCentre };
export type { CarLayout as ElefantLayout };
