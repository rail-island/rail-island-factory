// The Shinkansen 0 series, the Japanese National Railways' first high-speed
// train (1964-2008): one design `veh-shinkansen-0` whose `unit` picks the car -
// the end car with its bullet nose (type 21, the default: a motor car like every
// 0 series car, the train's "locomotive"), the intermediate motor car (type 25),
// its pantograph partner (type 26), the Green car (type 15) and the buffet car
// (type 35) - or the whole train, articulated: `cars` (2 .. 16) cars, an end car
// at each end (the rear one turned), each car a section on its own two bogies.
// `livery` is the JNR ivory and blue, JR West's 2002 "fresh green" Kodama
// renewal, or the Doctor Yellow test train.
//
// Modelled from photographs of the preserved cars 21-1, 22-1 and 35-1
// (assets/shinkansen-0/) and the published figures: 25.15 m end car and 25.0 m
// intermediate car over the couplers, roof 3.975 m, bogie centres 17.5 m,
// DT200 bogies of 2.5 m wheelbase on 910 mm wheels. The body is narrowed from
// 3.383 m to the repository's 3.08 m envelope. The bodies are lofted through
// vertical slices (sliceLoft.ts) whose apron, belly, shoulder, crown and paint
// edges vary along the car, so the nose's dome and the blue apron under it stay
// exact. See docs/models/shinkansen-0.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import { Coach } from "./csdCoachParts.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { centreCoupler, EMU_CATALOG, enumParam } from "./emuParts.ts";
import { unitBogie } from "./unitParts.ts";
import { LOD_GLASS, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { bogieParts, fitUnit, roofPart, sideGlass, turnBody, type UnitBody } from "./lodUnits.ts";
import { articulate, knee as linkKnee } from "./tramKit.ts";
import { lerp, type Pt } from "./sliceLoft.ts";
import { crownPane, drawShell, sideDecal, sideLettering, sidePanel, sliceCabin, surfaceDisc, type SliceBody, type SliceDoorway } from "./sliceBody.ts";
import { liftable } from "./liftable.ts";
import { openable, plugMove } from "./doors.ts";
import { RAIL_COLLECTOR_TOP } from "./collector.ts";

/** What the design builds: one car, or the whole train. */
export type Shinkansen0Unit = "endCar" | "motorCar" | "pantographCar" | "greenCar" | "buffetCar" | "train";
export type Shinkansen0Car = Exclude<Shinkansen0Unit, "train">;
export type Shinkansen0Livery = "jnr" | "freshGreen" | "doctorYellow";

/** The train's car counts, at most eight: an end car at each end and pairs of motor cars between them (one group of three in an odd train). */
export const SHINKANSEN0_CARS = [2, 3, 4, 5, 6, 7, 8];

export const SHINKANSEN0_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    endCar: "End car 21",
    motorCar: "Motor car 25",
    pantographCar: "Pantograph 26",
    greenCar: "Green car 15",
    buffetCar: "Buffet car 35",
    train: "Full train",
  }),
  {
    ...enumParam("cars", "Cars", Object.fromEntries(SHINKANSEN0_CARS.map((n) => [String(n), `${n} cars`]))),
    default: "4",
    when: { name: "unit", values: ["train"] },
    // the longer Hikari formations offered before the eight-car limit
    retired: { "10": { cars: "8" }, "12": { cars: "8" }, "14": { cars: "8" }, "16": { cars: "8" } },
  },
  enumParam("livery", "Livery", {
    jnr: "JNR ivory, blue",
    freshGreen: "JR West green",
    doctorYellow: "Doctor Yellow",
  }),
];

/** Lengths over the couplers (m). */
export const SHINKANSEN0_LENGTH = { endCar: 25.15, middle: 25.0 } as const;
/** Half the 0.5 m between two bodies: each car's coupling plane. */
export const SHINKANSEN0_GAP = 0.25;
/** The bogie centres, 17.5 m apart, 3.5 m in from each inner body end. */
export const SHINKANSEN0_BOGIE_CENTRES = 17.5;
export const SHINKANSEN0_WHEELBASE = 2.5;
const WHEEL_R = 0.455;
/** The crown above the rail. */
export const SHINKANSEN0_HEIGHT = 3.975;
/** Half the body width: 3.06 m, inside the repository envelope with the windows proud of it (the real car is 3.383 m). */
const W = 1.53;
const COUPLER_Y = 1.0;
/** The window band's sills and heads. */
const WIN: [number, number] = [1.97, 2.55];
/** The running numbers on the sides, as on the preserved cars. */
export const SHINKANSEN0_NUMBERS: Record<Shinkansen0Car, string> = { endCar: "21-1", motorCar: "25-1", pantographCar: "26-1", greenCar: "15-1", buffetCar: "35-1" };

const isEnd = (car: Shinkansen0Car) => car === "endCar";
export const shinkansen0Length = (car: Shinkansen0Car): number => (isEnd(car) ? SHINKANSEN0_LENGTH.endCar : SHINKANSEN0_LENGTH.middle);
/** The body from its +X end (the nose tip of an end car) to its -X wall. */
const bodyLength = (car: Shinkansen0Car): number => shinkansen0Length(car) - (isEnd(car) ? SHINKANSEN0_GAP : 2 * SHINKANSEN0_GAP);
/** Bogie centres, d metres back from the body's +X end. */
export function shinkansen0Bogies(car: Shinkansen0Car): [number, number] {
  const L = bodyLength(car);
  return [L - 3.5 - SHINKANSEN0_BOGIE_CENTRES, L - 3.5];
}

// --- liveries ----------------------------------------------------------------------------------

interface Livery {
  palette: Record<string, MaterialSpec>;
  /** The side's stripes between the belly and the shoulder, bottom up: [y0, y1, mat]; the rest is `body`. */
  stripes: Array<[number, number, string]>;
  /** On the end car the stripes start this far behind the nose tip, rounded (the window band behind the cab) or tapering forward to a point. */
  from: number;
  front: "round" | "taper";
}

const c = (color: string, roughness = 0.4, metallic?: number): MaterialSpec => ({ color, roughness, ...(metallic !== undefined ? { metallic } : {}) });

const LIVERIES: Record<Shinkansen0Livery, Livery> = {
  // Ivory No. 1 and Blue No. 20: the window band, the apron and the skirts' line
  jnr: {
    palette: { body: c("#eeece2"), cap: c("#f6f5ee", 0.2), apron: c("#1d4596"), band: c("#1d4596"), skirt: c("#1d4596"), roof: c("#e2e0d6", 0.6) },
    stripes: [[WIN[0] - 0.1, WIN[1] + 0.14, "band"]],
    from: 7.3,
    front: "round",
  },
  // JR West's 2002 renewal of the last Kodama sets: grey, a dark grey window band, a fresh green line under it
  freshGreen: {
    palette: { body: c("#d9dcdd"), cap: c("#e4e6e7", 0.2), apron: c("#5b6167"), band: c("#545a60"), line: c("#7dbb2e"), skirt: c("#5b6167"), roof: c("#c9cccd", 0.6) },
    stripes: [[WIN[0] - 0.24, WIN[0] - 0.12, "line"], [WIN[0] - 0.1, WIN[1] + 0.14, "band"]],
    from: 7.3,
    front: "round",
  },
  // the 922 series test train built on the 0 series: yellow, the blue stripe under the windows tapering into the nose
  doctorYellow: {
    palette: { body: c("#f0cf12"), cap: c("#ece2b4", 0.2), apron: c("#1d4596"), band: c("#1d4596"), skirt: c("#1d4596"), roof: c("#dcc02a", 0.6) },
    stripes: [[1.45, 1.93, "band"]],
    from: 4.6,
    front: "taper",
  },
};

const PALETTE: Record<string, MaterialSpec> = {
  glass: c("#27323d", 0.12, 0.2),
  cabGlass: c("#1d252e", 0.1, 0.25),
  frame: c("#9ea3a8", 0.35, 0.4),
  rubber: c("#1c1c1e", 0.9),
  bellows: c("#2a2b2d", 0.9),
  chrome: c("#7f858b", 0.3, 0.6),
  lampGlass: { ...c("#d9cf9e", 0.15), lamp: { role: "head" } },
  lampRed: { ...c("#c8202c", 0.3), lamp: { role: "tail" } },
  under: c("#2a2c2f", 0.85),
  equipment: c("#3b3d40", 0.8),
  motor: c("#2e3033", 0.8),
  coupler: c("#2a2b2d", 0.6, 0.3),
  vent: c("#b9bcbc", 0.6),
  lettering: c("#2a2c30", 0.5),
  green: c("#2f9a45", 0.45),
  pantograph: c("#5a5d63", 0.6, 0.2),
  carbon: c("#2b2b2b", 0.8),
  insulator: c("#c8c8c0", 0.4),
};

// --- the body: vertical slices ------------------------------------------------------------------

/** A car's body (sliceBody.ts) and where its side stripes start (the end car's band ends behind the cab). */
interface Profile extends SliceBody {
  stripesFrom: number;
}

/** Segments of the roof's quarter arc. */
const ARC = 9;
/** The side leans in from the belly to the shoulder (tumblehome). */
const LEAN = 0.965;
/** The belly and the shoulder of the car body. */
const BELLY = 1.45;
const SHOULDER = 3.08;

/** Paint edges of a slice: the stripes clamped to the side between the belly and the shoulder. */
function stripeEdges(L: Livery, p: Pick<SliceBody, "Y" | "S">, d: number): number[] {
  const [Y, S] = [p.Y(d), p.S(d)];
  return L.stripes.flatMap(([a, b]) => [a, b]).map((y) => Math.min(S, Math.max(Y, y)));
}

/** The paint of edge k of a slice at d (k 0 the bottom, 1 the skirt or apron, 2 the lower body, then the stripes). */
function edgeMat(L: Livery, p: Profile, d: number, k: number, nose: boolean): string {
  if (k === 0) return nose && d < 0.6 ? "apron" : "under";
  if (k === 1) return nose && d < 2.1 ? "apron" : "skirt";
  const cap = nose && d < NOSE_CAP;
  if (k === 2) return cap ? "cap" : "body";
  // the stripes' edges: 3 .. 3 + 2n; a stripe lies between edge 3 + 2i and 4 + 2i
  const j = k - 3;
  if (j < 2 * L.stripes.length + 1) {
    if (j % 2 === 1 && d >= p.stripesFrom) return L.stripes[(j - 1) / 2]![2];
    return cap ? "cap" : "body";
  }
  return cap ? "cap" : "roof";
}

/** Bands of a slice for its end caps, bottom to crown. */
function sliceBands(L: Livery, p: Profile, d: number): Array<[number, number, string]> {
  const e = stripeEdges(L, p, d);
  const out: Array<[number, number, string]> = [[p.B(d), p.A(d), "skirt"], [p.A(d), e[0] ?? p.S(d), "body"]];
  L.stripes.forEach(([, , mat], i) => {
    out.push([e[2 * i]!, e[2 * i + 1]!, d >= p.stripesFrom ? mat : "body"]);
    out.push([e[2 * i + 1]!, e[2 * i + 2] ?? p.S(d), "body"]);
  });
  out.push([p.S(d), p.C(d), "roof"]);
  return out.filter(([a, b]) => b - a > 1e-6);
}

/** The car's lofted shell, open over its doors' leaf boxes (2 mm beyond, under the frame); an end car's nose tip needs no cap. */
function shell(m: MeshBuilder, L: Livery, p: Profile, X: (d: number) => number, nose: boolean, leaves: readonly SliceDoorway[]): void {
  const cut = leaves.map((o) => ({ ...o, d0: o.d0 - 0.002, d1: o.d1 + 0.002, y0: o.y0 - 0.002, y1: o.y1 + 0.002 }));
  drawShell(m, p, X, (d, k) => edgeMat(L, p, d, k, nose), (d) => sliceBands(L, p, d), { front: !nose, rear: true }, cut);
}

/** A door's outline box (y) and its leaf's, 2 cm inside it. */
const DOOR_Y: [number, number] = [1.36, 3.0];
const LEAF_INSET = 0.02;

// --- the profiles -----------------------------------------------------------------------------

/** The nose's plan reaches the full width this far back from the tip. */
const NOSE_LEN = 4.7;
/** The light-nose cap: the dome ahead of this is its translucent cover. */
const NOSE_CAP = 0.55;
const ellipse = (d: number, len: number) => Math.sqrt(Math.max(0, 1 - (1 - Math.min(d, len) / len) ** 2));
/** The cap's centre: the dome's tip. */
const TIP_Y = 1.62;

/** The nose's crown: the dome, the bonnet rising to the windscreen's foot, the windscreen and the cab roof. */
const NOSE_C: Pt[] = [[0, TIP_Y + 0.08], [0.1, 1.96], [0.25, 2.14], [0.55, 2.32], [1.0, 2.44], [2.0, 2.6], [3.2, 2.75], [4.3, 2.9], [4.75, 3.16], [5.2, 3.44], [5.6, 3.66], [6.2, 3.84], [7.0, 3.94], [7.8, SHINKANSEN0_HEIGHT]];
/** The shoulder: low at the dome, the bonnet's sides, rising behind the windscreen to the car's. */
const NOSE_S: Pt[] = [[0, TIP_Y + 0.03], [0.1, 1.76], [0.3, 1.9], [1.0, 2.1], [2.5, 2.36], [4.3, 2.6], [5.6, 2.95], [6.3, SHOULDER]];
/** The belly: the dome's middle at the tip, the car's further back. */
const NOSE_Y: Pt[] = [[0, TIP_Y], [0.1, 1.6], [0.4, 1.56], [1.2, 1.48], [2.5, BELLY]];
/** The apron's bottom: the plough under the dome, cut up over the leading bogie. */
const END_B: Pt[] = [[0, TIP_Y - 0.03], [0.1, 1.0], [0.3, 0.42], [0.6, 0.26], [1.95, 0.26], [2.05, 1.0]];
/** The apron's top: under the dome, then the skirts' line. */
const NOSE_A: Pt[] = [[0, TIP_Y - 0.02], [0.1, 1.12], [0.3, 1.06], [1.2, 1.02], [2.5, 1.0]];

/** The skirts of a car's flat part: open over each bogie (d0 .. d1), 0.55 m deep elsewhere. */
function skirt(bogies: number[], from: number, to: number): Pt[] {
  const reach = SHINKANSEN0_WHEELBASE / 2 + WHEEL_R + 0.22;
  const out: Pt[] = [];
  for (const b of bogies) {
    if (b - reach > from) out.push([b - reach - 0.12, 0.55], [b - reach, 1.0]);
    out.push([b + reach, 1.0], [b + reach + 0.12, 0.55]);
  }
  const all: Pt[] = [[from, 0.55], ...out.filter(([d]) => d >= from - 1e-9 && d <= to + 1e-9), [to, 0.55]];
  return all.sort((a, b) => a[0] - b[0]);
}

function endProfile(Lv: Livery): Profile {
  const L = bodyLength("endCar");
  const [b1, b2] = shinkansen0Bogies("endCar");
  const reach = SHINKANSEN0_WHEELBASE / 2 + WHEEL_R + 0.22;
  const B: Pt[] = [...END_B, [b1 + reach, 1.0], [b1 + reach + 0.12, 0.55], ...skirt([b2], b1 + reach + 0.2, L).slice(1)];
  const w = (d: number) => Math.max(0.03, W * ellipse(d, NOSE_LEN));
  // the apron flares from the plough's point to the skirts' line
  const wl = (d: number) => Math.min(w(d) * 0.98, Math.max(0.03, 1.38 * ellipse(d, 2.6)));
  const wa = (d: number) => Math.min(w(d), Math.max(0.03, 1.45 * ellipse(d + 0.08, 3.0)));
  const keys = [0, 0.03, 0.1, 0.18, 0.3, 0.42, NOSE_CAP, 0.75, 1.0, 1.3, 1.6, 2.0, 2.5, 3.0, 3.5, 4.0, 4.3, 4.5, 4.75, 5.0, 5.2, 5.4, 5.6, 5.9, 6.2, 6.6, 7.0, 7.4, 7.8, Lv.from];
  return {
    length: L,
    B: (d) => lerp(B, d),
    wl: (d) => (d < 2.1 ? wl(d) : Math.min(0.88 * W, 0.92 * w(d))),
    A: (d) => lerp(NOSE_A, d),
    wa: (d) => (d < 2.1 ? wa(d) : 0.95 * w(d)),
    Y: (d) => lerp(NOSE_Y, d),
    w,
    S: (d) => lerp(NOSE_S, d),
    C: (d) => lerp(NOSE_C, d),
    edges: (d) => stripeEdges(Lv, { Y: (dd) => lerp(NOSE_Y, dd), S: (dd) => lerp(NOSE_S, dd) }, d),
    lean: LEAN,
    arc: ARC,
    stripesFrom: Lv.from,
    stations: [...new Set([...keys, ...B.map(([d]) => d), L])].filter((d) => d <= L).sort((a, b) => a - b),
  };
}

function middleProfile(Lv: Livery, car: Shinkansen0Car): Profile {
  const L = bodyLength(car);
  const B = skirt(shinkansen0Bogies(car), 0, L);
  return {
    length: L,
    B: (d) => lerp(B, d),
    wl: () => 0.88 * W,
    A: () => 1.0,
    wa: () => 0.95 * W,
    Y: () => BELLY,
    w: () => W,
    S: () => SHOULDER,
    C: () => SHINKANSEN0_HEIGHT,
    edges: (d) => stripeEdges(Lv, { Y: () => BELLY, S: () => SHOULDER }, d),
    lean: LEAN,
    arc: ARC,
    stripesFrom: 0,
    stations: [...new Set(B.map(([d]) => d))].sort((a, b) => a - b),
  };
}

// --- the cars -------------------------------------------------------------------------------

/** A car's side layout: windows and doors as (d0, d1), sides when not both. */
interface Opening {
  d: [number, number];
  sides?: number[];
}
interface Layout {
  windows: Opening[];
  doors: Opening[];
  /** The Green car's clover emblems and the buffet's lettering beside a door (d). */
  clover?: number[];
}

const pitch = (n: number, centre: number, step: number, width: number, sides?: number[]): Opening[] =>
  Array.from({ length: n }, (_, i): Opening => {
    const x = centre + (i - (n - 1) / 2) * step;
    return { d: [x - width / 2, x + width / 2], ...(sides ? { sides } : {}) };
  });

/** The cars' sides: a door at each end of an intermediate car, the large windows of the first cars between them. */
function layout(car: Shinkansen0Car): Layout {
  const L = bodyLength(car);
  const doors: Opening[] = [{ d: [0.55, 1.25] }, { d: [L - 1.25, L - 0.55] }];
  switch (car) {
    case "endCar":
      return { windows: pitch(9, 15.95, 1.62, 1.28), doors: [{ d: [7.55, 8.25] }, { d: [L - 1.25, L - 0.55] }] };
    case "motorCar":
    case "pantographCar":
      return { windows: pitch(13, L / 2, 1.62, 1.28), doors };
    case "greenCar":
      // the Green car's smaller windows, one per row of its wider-spaced seats
      return { windows: pitch(17, L / 2, 1.16, 0.78), doors, clover: [1.75, L - 1.75] };
    case "buffetCar":
      // the buffet's counter windows on one side, the corridor's small ones on the other; the seating saloon's large windows
      return {
        windows: [...pitch(6, 15.9, 1.62, 1.28), ...pitch(4, 6.2, 1.62, 1.28, [1]), ...pitch(4, 6.2, 1.62, 0.6, [-1])],
        doors,
      };
  }
}

const onSide = (o: Opening, s: number) => !o.sides || o.sides.includes(s);

/** The window: its frame and glass laid on the side. */
function sideWindow(m: MeshBuilder, p: Profile, X: (d: number) => number, s: number, d0: number, d1: number): void {
  m.scope("frame", () => sidePanel(m, p, X, s, "frame", d0, d1, WIN[0], WIN[1], 0.008, 0.03));
  m.scope("glass", () => sidePanel(m, p, X, s, "glass", d0 + 0.05, d1 - 0.05, WIN[0] + 0.05, WIN[1] - 0.05, 0.014, 0.004));
}

/**
 * A plug door: its seam, the leaf in the body's paint, its narrow window. The leaf
 * and its window open as one plug leaf (doors.ts), sliding toward the car's middle.
 */
function sideDoor(m: MeshBuilder, L: Livery, p: Profile, X: (d: number) => number, s: number, d0: number, d1: number): void {
  const slide = (d0 + d1) / 2 < p.length / 2 ? 1 : -1;
  const [y0, y1] = DOOR_Y;
  const k = LEAF_INSET;
  // the frame round the doorway cut through the shell
  m.scope("outline", () => {
    sidePanel(m, p, X, s, "rubber", d0, d0 + k, y0, y1, 0.004, 0.03);
    sidePanel(m, p, X, s, "rubber", d1 - k, d1, y0, y1, 0.004, 0.03);
    sidePanel(m, p, X, s, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.004, 0.03);
    sidePanel(m, p, X, s, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.004, 0.03);
  });
  const dx = X(d0 + slide * (d1 - d0)) - X(d0);
  openable(m, (mm, o) =>
    mm.moved(plugMove(o, s, dx), () => {
      mm.scope("leaf", () => {
        for (const [a, b, mat] of sliceBands(L, p, (d0 + d1) / 2)) {
          const [lo, hi] = [Math.max(a, y0 + 0.02), Math.min(b, y1 - 0.02)];
          if (hi - lo > 1e-6 && mat !== "roof" && mat !== "skirt") sidePanel(mm, p, X, s, mat, d0 + 0.02, d1 - 0.02, lo, hi, 0.008, 0.003);
        }
      });
      mm.scope("glass", () => sidePanel(mm, p, X, s, "glass", d0 + 0.17, d1 - 0.17, 2.05, 2.62, 0.012, 0.004));
    }),
  );
  m.scope("step", () => sidePanel(m, p, X, s, "under", d0, d1, 1.26, 1.34, 0.006, 0.2));
}

/** The Green car's four-leaf clover emblem on the side at d. */
function clover(m: MeshBuilder, p: Profile, X: (d: number) => number, s: number, d: number, y: number): void {
  const tris: Pt[] = [];
  const leaf = (cx: number, cy: number, r: number) => {
    for (let i = 0; i < 10; i++) {
      const [a, b] = [(2 * Math.PI * i) / 10, (2 * Math.PI * (i + 1)) / 10];
      tris.push([cx, cy], [cx + r * Math.cos(a), cy + r * Math.sin(a)], [cx + r * Math.cos(b), cy + r * Math.sin(b)]);
    }
  };
  for (const [u, v] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) leaf(d + u * 0.075, y + v * 0.075, 0.08);
  sideDecal(m, p, X, s, "green", tris, 0.005);
}

/** The front end of the end car's stripes: a half disc ahead of each, or a point 1.6 m ahead at its top edge (in strips, to follow the nose). */
function stripeEnds(m: MeshBuilder, L: Livery, p: Profile, X: (d: number) => number, s: number): void {
  const d0 = p.stripesFrom;
  for (const [y0, y1, mat] of L.stripes) {
    const tris: Pt[] = [];
    const n = 10;
    if (L.front === "round") {
      const r = (y1 - y0) / 2;
      const yc = (y0 + y1) / 2;
      for (let i = 0; i < n; i++) {
        const [a, b] = [Math.PI / 2 + (Math.PI * i) / n, Math.PI / 2 + (Math.PI * (i + 1)) / n];
        tris.push([d0, yc], [d0 + r * Math.cos(a), yc + r * Math.sin(a)], [d0 + r * Math.cos(b), yc + r * Math.sin(b)]);
      }
    } else {
      const len = 1.6;
      // the bottom edge curves up to the point at the top edge
      const bottom = (t: number) => y1 - 0.06 - (y1 - 0.06 - y0) * Math.sqrt(t);
      for (let i = 0; i < n; i++) {
        const [ta, tb] = [i / n, (i + 1) / n];
        const [da, db] = [d0 - len * (1 - ta), d0 - len * (1 - tb)];
        const top = (t: number) => y1 - 0.06 * (1 - t);
        tris.push([da, bottom(ta)], [db, bottom(tb)], [db, top(tb)], [da, bottom(ta)], [db, top(tb)], [da, top(ta)]);
      }
    }
    sideDecal(m, p, X, s, mat, tris, 0.005);
  }
}

/** The fittings at an inner end at d `wall` (e: +1 the +X end): the end wall's door, a gangway frame (a lone car) and the coupler. */
function innerEnd(m: MeshBuilder, X: (d: number) => number, e: number, wall: number, gangway: boolean): void {
  const face = e > 0 ? -SHINKANSEN0_GAP : wall + SHINKANSEN0_GAP;
  m.scope("end door", () => {
    const [a, b] = [X(wall), X(wall) + e * 0.012].sort((q, r) => q - r) as [number, number];
    block(m, "rubber", a, b, 1.3, 3.15, -0.4, 0.4);
  });
  if (gangway)
    m.scope("gangway", () => {
      const [a, b] = [X(wall) - e * 0.02, X(face) - e * 0.01].sort((q, r) => q - r) as [number, number];
      for (const z of [-1, 1]) block(m, "rubber", a, b, 1.2, 3.4, ...side(z, 0.55, 0.78));
      block(m, "rubber", a, b, 3.2, 3.4, -0.55, 0.55);
      block(m, "rubber", a, b, 1.2, 1.32, -0.55, 0.55);
    });
  m.scope("coupler", () => centreCoupler(m, e, X(wall + e * 0.9), X(face), COUPLER_Y));
}

/** A diamond pantograph (the PS200): base, the lower and upper frames' rhombus either side, the collector. Raised to `top`. */
function diamondPantograph(m: MeshBuilder, x: number, roof: number, top: number): void {
  liftable(m, "pantograph", (mm, lift) => diamondPantographAt(mm, x, roof, top, lift));
}

/**
 * The diamond pantograph at `lift`, 0 folded to 1 raised to `top`: each half's
 * lower and upper frame keep the lengths they have raised, the knee where their
 * circles meet, outside the line from the base pivot to the head.
 */
function diamondPantographAt(m: MeshBuilder, x: number, roof: number, top: number, lift: number): void {
  const y = roof + 0.32;
  m.scope("insulators", () => {
    for (const dx of [-0.55, 0.55])
      for (const z of [-0.5, 0.5]) {
        m.prism("insulator", ngon(8, 0.06, 0, x + dx, z), roof - 0.01, y - 0.04);
        m.prism("insulator", ngon(8, 0.085, 0, x + dx, z), roof + 0.12, roof + 0.16);
      }
  });
  m.scope("base", () => {
    for (const z of [-0.5, 0.5]) block(m, "pantograph", x - 0.72, x + 0.72, y - 0.04, y + 0.02, z - 0.04, z + 0.04);
    for (const dx of [-0.65, 0.65]) block(m, "pantograph", x + dx - 0.035, x + dx + 0.035, y - 0.04, y + 0.03, -0.52, 0.52);
  });
  const raisedHead = top - 0.06;
  const head = y + 0.25 + (raisedHead - y - 0.25) * lift;
  // the frames' lengths in the half's own plane (x outward), fixed by the raised pose
  const raisedKnee = (y + raisedHead) / 2;
  const lower = Math.hypot(0.95 - 0.5, raisedKnee - y);
  const upper = Math.hypot(0.95 - 0.12, raisedHead - raisedKnee);
  const [kx, knee] = linkKnee([0.5, y], lower, [0.12, head], upper, -1);
  m.scope("frames", () => {
    for (const z of [-0.42, 0.42]) {
      for (const dx of [-1, 1]) {
        m.rod("pantograph", [x + dx * 0.5, y, z], [x + dx * kx, knee, z * 0.9], 0.025);
        m.rod("pantograph", [x + dx * kx, knee, z * 0.9], [x + dx * 0.12, head, z * 0.55], 0.02);
      }
    }
    // the cross ties at the knees and the hinge shafts
    for (const dx of [-1, 1]) m.rod("pantograph", [x + dx * kx, knee, -0.38], [x + dx * kx, knee, 0.38], 0.018);
    for (const dx of [-0.5, 0.5]) m.rod("pantograph", [x + dx, y, -0.46], [x + dx, y, 0.46], 0.03);
  });
  m.scope("head", () => {
    for (const dx of [-0.13, 0.13]) block(m, "carbon", x + dx - 0.03, x + dx + 0.03, head, head + 0.06, -0.62, 0.62);
    block(m, "pantograph", x - 0.15, x + 0.15, head - 0.03, head + 0.005, -0.3, 0.3);
    for (const s of [-1, 1]) {
      const [a, b] = side(s, 0.62, 0.86);
      block(m, "pantograph", x - 0.02, x + 0.02, head - 0.06, head + 0.03, a, b);
    }
  });
}

/** The pantograph car's collector stands 1.15 m behind its +X body end... a pantograph car pairs with the car ahead. */
const PANTOGRAPH_D = 5.2;
/** The raised collector's height: the game's contact wire, not the Shinkansen's own 5.0 m one. */
export const SHINKANSEN0_WIRE = RAIL_COLLECTOR_TOP;

function drawCar(coach: Coach, L: Livery, car: Shinkansen0Car, X: (d: number) => number, gangway: boolean, pantograph = car === "pantographCar"): void {
  const m = coach.m;
  const end = isEnd(car);
  const p = end ? endProfile(L) : middleProfile(L, car);
  const lay = layout(car);
  // the doors' leaf boxes, the doorways into the car's cabin (doors.ts)
  const leaves: SliceDoorway[] = [1, -1].flatMap((s) =>
    lay.doors.filter((o) => onSide(o, s)).map(({ d: [a, b] }) => ({ s, d0: a + LEAF_INSET, d1: b - LEAF_INSET, y0: DOOR_Y[0] + LEAF_INSET, y1: DOOR_Y[1] - LEAF_INSET })),
  );
  m.scope("body", () => {
    m.scope("shell", () => shell(m, L, p, X, end, leaves));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("doors", () => lay.doors.filter((o) => onSide(o, s)).forEach(({ d: [a, b] }, i) => m.scope(`door ${i + 1}`, () => sideDoor(m, L, p, X, s, a, b))));
        m.scope("windows", () => lay.windows.filter((o) => onSide(o, s)).forEach(({ d: [a, b] }, i) => m.scope(`window ${i + 1}`, () => sideWindow(m, p, X, s, a, b))));
        if (end) m.scope("stripe ends", () => stripeEnds(m, L, p, X, s));
        m.scope("running number", () => sideLettering(m, p, X, s, SHINKANSEN0_NUMBERS[car], end ? 8.9 : p.length - 1.75, 1.42, 0.1, "lettering"));
        if (lay.clover) m.scope("green emblems", () => lay.clover!.forEach((d) => clover(m, p, X, s, d, 2.85)));
      });
    sliceCabin(m, p, X, end ? NOSE_LEN : 0, p.length, leaves);
  });
  if (end) m.scope("nose", () => drawNose(m, p, X));
  else m.scope("front end", () => innerEnd(m, X, 1, 0, gangway));
  m.scope("rear end", () => innerEnd(m, X, -1, p.length, gangway));
  m.scope("roof equipment", () => {
    // the row of ventilators along the crown
    const vents = end ? [10.5, 13.5, 16.5, 19.5, 22.5] : [3.0, 6.5, 10.0, 13.5, 17.0, 20.5];
    m.scope("ventilators", () => vents.forEach((d, i) => m.scope(`ventilator ${i + 1}`, () => {
      const x = X(d);
      block(m, "vent", x - 0.3, x + 0.3, SHINKANSEN0_HEIGHT - 0.04, SHINKANSEN0_HEIGHT + 0.1, -0.22, 0.22);
    })));
    if (pantograph)
      m.scope("pantographs", () => m.scope("pantograph", () => diamondPantograph(m, X(PANTOGRAPH_D), SHINKANSEN0_HEIGHT - 0.05, SHINKANSEN0_WIRE)));
  });
  m.scope("running gear", () => {
    shinkansen0Bogies(car).forEach((d, i) => m.scope(`bogie ${i + 1}`, () => unitBogie(coach, X(d), { wb: SHINKANSEN0_WHEELBASE, r: WHEEL_R, motor: true, top: 1.0, frame: 1.0 })));
    m.scope("underframe", () => {
      const [b1, b2] = shinkansen0Bogies(car);
      for (const [a, b] of [[b1 + 2.2, b1 + 6.4], [b1 + 7.0, b2 - 7.0], [b2 - 6.4, b2 - 2.2]] as const) block(m, "equipment", ...([X(b), X(a)] as [number, number]), 0.6, 1.0, -1.15, 1.15);
    });
  });
}

/** The end car's nose: the headlights in their round housings, the windscreen and the cab's side windows on the lofted surface, the plough's ridge. */
function drawNose(m: MeshBuilder, p: Profile, X: (d: number) => number): void {
  m.scope("headlights", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right lamp" : "left lamp", () => {
        surfaceDisc(m, p, X, 1.7, 1.78, s, "chrome", 0.29, 0.004, 0.05);
        surfaceDisc(m, p, X, 1.7, 1.78, s, "lampGlass", 0.24, 0.016, 0.005);
        surfaceDisc(m, p, X, 1.7, 1.66, s, "lampRed", 0.06, 0.022, 0.004, 10);
      });
  });
  m.scope("windscreen", () => {
    // the two front panes either side of the centre pillar, then the corner and side windows behind the next pillar
    for (const sd of [1, -1]) {
      crownPane(m, p, X, sd, "rubber", [4.36, 5.6], [0, 1.07], 0.006);
      crownPane(m, p, X, sd, "cabGlass", [4.44, 5.52], [0.07, 1.0], 0.012);
    }
  });
  m.scope("side windows", () => {
    for (const sd of [1, -1]) {
      crownPane(m, p, X, sd, "rubber", [5.1, 6.65], [1.11, 1.47], 0.006);
      crownPane(m, p, X, sd, "cabGlass", [5.18, 6.57], [1.17, 1.43], 0.012);
    }
  });
  m.scope("plough ridge", () => block(m, "apron", X(1.9), X(0.6), 0.2, 0.3, -0.05, 0.05));
}

// --- the train ------------------------------------------------------------------------------

export interface Shinkansen0Slot {
  car: Shinkansen0Car;
  /** The car of each motor pair that carries the pair's pantograph (a Green car 16 does too). */
  pantograph: boolean;
  lo: number;
  hi: number;
  turned: boolean;
}

/**
 * The cars of a train of `n` (2 .. 8), front first: an end car at each end, the
 * pairs of motor cars between them, every pair's pantograph car behind its
 * partner; an odd train's last pantograph car feeds both its partner and the
 * trailing end car, a group of three. The eight-car train's buffet car takes
 * the middle. Each with its span lo..hi over the coupling planes, the train
 * centred on x = 0.
 */
export function shinkansen0Train(n: number): Shinkansen0Slot[] {
  // the pairs: the leading end car and a pantograph car, motor and pantograph cars, a pantograph car and the trailing end car
  const pantograph = Array.from({ length: n }, (_, k) => k > 0 && k < n - 1 && (k % 2 === 1 || k === n - 2));
  const cars = pantograph.map((pan, k): Shinkansen0Car => (k === 0 || k === n - 1 ? "endCar" : pan ? "pantographCar" : "motorCar"));
  if (n >= 8) cars[n / 2] = "buffetCar";
  const total = cars.reduce((t, car) => t + shinkansen0Length(car), 0);
  let hi = total / 2;
  return cars.map((car, i) => {
    const lo = hi - shinkansen0Length(car);
    const out = { car, pantograph: pantograph[i]!, lo, hi, turned: i === n - 1 && isEnd(car) };
    hi = lo;
    return out;
  });
}

/** The bellows' cross-section between two cars (z, y). */
const BELLOWS: Array<[number, number]> = [[-0.78, 1.2], [0.78, 1.2], [0.78, 3.3], [0.66, 3.42], [-0.66, 3.42], [-0.78, 3.3]];
const MAX_BEND_DEG = 10;

function train(n: number, L: Livery): MeshBuilder {
  const cars = shinkansen0Train(n);
  const coach = new Coach({ ...PALETTE, ...L.palette }, 0);
  const m = coach.m;
  const sections = cars.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = shinkansen0Length(slot.car);
    // a car facing +X: the nose tip at its front coupling plane, an inner wall 0.25 m behind it
    const front = isEnd(slot.car) ? 0 : SHINKANSEN0_GAP;
    const X = (d: number) => cx + len / 2 - front - d;
    return {
      x0: slot.lo + SHINKANSEN0_GAP,
      x1: slot.hi - (k === 0 ? 0 : SHINKANSEN0_GAP),
      draw: () => m.scope(`car ${k + 1}`, () => (slot.turned ? m.turned(cx, () => drawCar(coach, L, slot.car, X, false)) : drawCar(coach, L, slot.car, X, false, slot.pantograph))),
    };
  });
  articulate({ m }, sections, COUPLER_Y, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND_DEG, cars.slice(0, -1).map((slot) => slot.lo));
  return m;
}

export function shinkansen0(params?: ParamValues): MeshBuilder {
  const p = resolveParams(SHINKANSEN0_PARAMS, params);
  const L = LIVERIES[p.livery as Shinkansen0Livery];
  const unit = p.unit as Shinkansen0Unit;
  if (unit === "train") return train(Number(p.cars), L);
  const coach = new Coach({ ...PALETTE, ...L.palette }, 0);
  const len = shinkansen0Length(unit);
  const front = isEnd(unit) ? 0 : SHINKANSEN0_GAP;
  drawCar(coach, L, unit, (d) => len / 2 - front - d, true);
  return coach.m;
}

// --- distant view ---------------------------------------------------------------------------

/** The distant model's budget: 100 triangles a car, 500 for the eight-car train. */
export const SHINKANSEN0_LOD = 500;

function carLod(L: Livery, car: Shinkansen0Car, X: (d: number) => number, cx: number, turned: boolean, section: number | undefined, inside: { front: boolean; rear: boolean }, pantograph = car === "pantographCar"): { body: UnitBody; parts: LodPart[] } {
  const end = isEnd(car);
  const T = (x: number) => (turned ? 2 * cx - x : x);
  const p = end ? endProfile(L) : middleProfile(L, car);
  const band = L.stripes.find(([, , mat]) => mat === "band")!;
  const side: LodBand[] = [[0.55, 1.0, "skirt"], [1.0, band[0], "body"], [band[0], band[1], "band"], [band[1], SHOULDER, "body"], [SHOULDER, SHINKANSEN0_HEIGHT, "roof"]];
  const hw: Array<readonly [number, number]> = [[0.55, 0.88 * W], [1.0, 0.95 * W], [BELLY, W], [SHOULDER, W * LEAN], [3.6, 1.1], [SHINKANSEN0_HEIGHT, 0.35]];
  const flat = (d: number, hidden: boolean) => ({ tip: [[0.55, X(d)]] as Array<readonly [number, number]>, ...(hidden ? { hidden: true } : {}) });
  const glass = layout(car).windows.filter((o) => onSide(o, 1)).map((o) => o.d);
  const boxes = glass.map(([a, b]) => ({ x0: X(b), x1: X(a), y0: WIN[0], y1: WIN[1] }));
  let body: UnitBody = {
    y0: 0.55,
    hw,
    side,
    roof: "roof",
    front: end
      ? {
          tip: [[0.55, X(0.6)], [1.05, X(0.12)], [TIP_Y, X(0)], [2.16, X(NOSE_CAP)], [2.48, X(2.0)], [2.8, X(4.3)], [3.66, X(5.6)], [SHINKANSEN0_HEIGHT, X(7.8)]],
          setback: [[0.55, 2.4], [TIP_Y, 3.6], [2.8, 3.0], [SHINKANSEN0_HEIGHT, 1.2]],
          paint: [[0.55, 1.05, "apron"], [1.05, SHINKANSEN0_HEIGHT, "body"]],
          windows: [{ u: [-1.0, 1.0], y: [2.9, 3.58], mat: LOD_GLASS }],
        }
      : flat(0, inside.front),
    rear: flat(p.length, inside.rear),
    ...(end ? { cabs: [{ x0: Math.min(X(L.from), X(0)), x1: Math.max(X(L.from), X(0)), side: [[0.55, 1.0, "skirt"], [1.0, SHOULDER, "body"], [SHOULDER, SHINKANSEN0_HEIGHT, "roof"]] as LodBand[] }] } : {}),
    windows: sideGlass(boxes, 0.6),
    ...(section !== undefined ? { section } : {}),
  };
  if (turned) body = turnBody(body, cx);
  const bogies = shinkansen0Bogies(car).map((d) => [T(X(d)), SHINKANSEN0_WHEELBASE / 2 + WHEEL_R + 0.2, ...(section !== undefined ? [section] : [])] as const);
  const parts: LodPart[] = [
    ...bogieParts(bogies as unknown as ReadonlyArray<readonly [number, number, number?]>, 1.0).map((part) => (!end && section !== undefined ? { ...part, optional: 5 } : part)),
    ...(pantograph ? [{ ...roofPart("pantograph", T(X(PANTOGRAPH_D)) - 0.9, T(X(PANTOGRAPH_D)) + 0.9, 0.5, 0.5, SHINKANSEN0_HEIGHT, SHINKANSEN0_WIRE, section), optional: 8 }] : []),
  ];
  return { body, parts };
}

/**
 * The 0 series for distant views (lodUnits.ts): the body's section with the
 * apron or skirt, the body colour and the window band; the end car's nose as the
 * centre line rising from the plough over the dome and the bonnet into the
 * windscreen; the window band and the bogies, a pantograph car's collector as a
 * block. The train keeps the full model's sections, 100 triangles a car, 300 at
 * most.
 */
export function shinkansen0Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(SHINKANSEN0_PARAMS, params);
  const L = LIVERIES[p.livery as Shinkansen0Livery];
  const palette = { ...PALETTE, ...L.palette };
  const unit = p.unit as Shinkansen0Unit;
  if (unit !== "train") {
    const len = shinkansen0Length(unit);
    const front = isEnd(unit) ? 0 : SHINKANSEN0_GAP;
    const { body, parts } = carLod(L, unit, (d) => len / 2 - front - d, 0, false, undefined, { front: false, rear: false });
    return fitUnit({ palette, bodies: [body], parts }, 100);
  }
  const n = Number(p.cars);
  const cars = shinkansen0Train(n);
  const built = cars.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = shinkansen0Length(slot.car);
    const front = isEnd(slot.car) ? 0 : SHINKANSEN0_GAP;
    return carLod(L, slot.car, (d) => cx + len / 2 - front - d, cx, slot.turned, k, slot.turned ? { front: false, rear: k > 0 } : { front: k > 0, rear: k < n - 1 }, slot.pantograph);
  });
  const sections: LodSections = {
    pivots: cars.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [cars[i - 1]!.lo, COUPLER_Y, 0])),
    joints: cars.slice(0, -1).map((slot, i) => ({
      sections: [i, i + 1] as [number, number],
      front: slot.lo + SHINKANSEN0_GAP,
      rear: cars[i + 1]!.hi - SHINKANSEN0_GAP,
      profile: [[-0.78, 1.2], [0.78, 1.2], [0.78, 3.42], [-0.78, 3.42]] as Array<[number, number]>,
    })),
    maxBendDeg: MAX_BEND_DEG,
  };
  return fitUnit({ palette, bodies: built.map((b) => b.body), parts: built.flatMap((b) => b.parts), sections }, Math.min(SHINKANSEN0_LOD, 100 * n));
}

// --- what the game needs ----------------------------------------------------------------------

/**
 * Every 0 series car is a motor car: four 185 kW traction motors, 740 kW; 220
 * km/h (the later sets' limit; 210 km/h at their introduction). The car weights
 * are estimates around the published 57 t to 60 t: the end car with its nose
 * 60 t, the pantograph car 58 t, the motor car 57 t, the Green car 58 t (its
 * heavier seats), the buffet car 56 t.
 */
const CAR_WEIGHT: Record<Shinkansen0Car, number> = { endCar: 60, motorCar: 57, pantographCar: 58, greenCar: 58, buffetCar: 56 };
const CAR_POWER = 740;

function shinkansen0Game(): GameProperties {
  const liveries = Object.keys(LIVERIES) as Shinkansen0Livery[];
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const livery of liveries) {
    const base: ParamValues = livery === "jnr" ? {} : { livery };
    for (const unit of ["motorCar", "pantographCar", "greenCar", "buffetCar"] as const) variants.push({ params: { ...base, unit }, weight: CAR_WEIGHT[unit] });
    for (const n of SHINKANSEN0_CARS) {
      const weight = shinkansen0Train(n).reduce((t, slot) => t + CAR_WEIGHT[slot.car], 0);
      // the default four cars are named by the unit alone
      variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), ...base, unit: "train" }, weight, power: CAR_POWER * n });
    }
  }
  return { weight: CAR_WEIGHT.endCar, power: CAR_POWER, maxspeed: 220, accel: null, variants };
}

export const SHINKANSEN0_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-shinkansen-0", game: shinkansen0Game(), title: "Shinkansen 0 series", build: shinkansen0, buildLod: shinkansen0Lod, lodTriangles: SHINKANSEN0_LOD, params: SHINKANSEN0_PARAMS, catalog: EMU_CATALOG, references: "shinkansen-0" },
];
