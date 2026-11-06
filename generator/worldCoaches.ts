// Locomotive-hauled coaches of the eight countries' families on the passenger
// car builder (usTransit.ts drawCar), stated in a few measures: the length over
// the buffers, the body, the window row of each type of car (`unit`), the end
// doors, the bogies, the coupler and the liveries. See docs/models/world-coaches.md.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { paint, type BogieSpec } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE, faceLamps, type Painter } from "./carbodyKit.ts";
import { crownPane, halfSlice, shapedCrownPane, sideDecal, sideLettering, sidePanel, surfacePoint, type SliceBody } from "./sliceBody.ts";
import { decalX } from "./usHoodKit.ts";
import type { Pt } from "./sliceLoft.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { LOD_GLASS, lodSideBox, type LodPart } from "./lodKit.ts";
import type { Vec3 } from "./meshCore.ts";
import { carLod, carLodBody, drawCar, type CarDef } from "./usTransit.ts";
import { bogieParts, fitUnit, type UnitBody } from "./lodUnits.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { enumParam } from "./emuParts.ts";

type Band = readonly [number, number, string];

export interface CoachType {
  title: string;
  /** Windows: how many a side, their width; a second row for a double-deck car. */
  windows: number;
  windowW: number;
  number: string;
  weight: number;
  /** A first-class car: the livery's first-class bands (a yellow line) where it has them. */
  first?: boolean;
}

export interface CoachLivery {
  title: string;
  palette: Record<string, MaterialSpec>;
  bands: readonly Band[];
  roof: string;
  skirt: string;
  /** Optional (default none): a first-class car's side bands; the door leaves' bands; the ends painted apart up to the
   * doors' inner edges (their bands, a first-class car's, the end walls' paint); the running number's paint. */
  firstBands?: readonly Band[];
  doorBands?: readonly Band[];
  ends?: { bands: readonly Band[]; firstBands?: readonly Band[]; cap: string };
  numberMat?: string;
  /** The class sign beside each door (CoachDetails.classSign): its panel's paint, or none for the bare numeral. */
  classPanel?: string;
}

/** A coach's optional details (default none: the plain kit). d is metres from each body end. */
export interface CoachDetails {
  /** The skirt's and the lower body's half widths (default 0.95 W and 0.99 W): the tumblehome below the belly. */
  wl?: number;
  wa?: number;
  /** A window d0..d1 from each end (the vestibule or toilet), beside the end doors; with a louvred vent over its bottom `louvre` m. */
  endWindow?: readonly [number, number];
  endLouvre?: number;
  /** The door leaves' window: its sill and head and its width. */
  doorGlass?: { y: readonly [number, number]; w: number };
  /** The door leaves reach down to this height beside the steps, below the body over the bogies. */
  doorFoot?: number;
  /** The roof's rounded end caps: the crown's height by d from each end. */
  roofEnd?: Pt[];
  /** With the roof's end caps: the body's corners in plan, rounded over `len` to `tip` of the half width at the end wall. */
  endCorner?: { len: number; tip: number };
  /** Longitudinal roof ribs between d `from` of each end, at these heights on the roof's arc. */
  roofRibs?: { from: number; y: readonly number[] };
  /** A louvred air intake on the roof's end cap (d0, d1, y0, y1): at the +X end on the right side, the -X end on the left. */
  grille?: readonly [number, number, number, number];
  /** A UIC rubber-roll gangway with the end door (instead of the kit's diaphragm frame), and the tail lamps. */
  rubberGangway?: boolean;
  /** The railway's emblem (a red square with a white cross) and name on both sides: the emblem's centre d, height and size. */
  logo?: { d: number; y: number; h: number; name: string };
  /** The running number's place (default mid-car above the belly). */
  numberAt?: { d: number; y: number; h: number };
  /** The class numeral (1 or 2, by `first`) beside each door, d0..d1 from each end and y0..y1, on the livery's class panel. */
  classSign?: { d: readonly [number, number]; y: readonly [number, number] };
  /** The underfloor equipment between the bogies: its bottom and half width (default 0.4 m under the skirt, 0.75 W). */
  underfloor?: { y0: number; half: number };
}

export interface WorldCoach {
  /** Over the buffers (couplers); the body's half width, belly, eaves and crown, skirt bottom and top. */
  length: number;
  W: number;
  Y: number;
  S: number;
  C: number;
  B: number;
  A: number;
  /** The window rows' sill and head (two for a double-deck car). */
  rows: ReadonlyArray<readonly [number, number]>;
  /** The doors at each end (d from the body's end), their width and sill and head. */
  doorIn: number;
  doorW: number;
  door: readonly [number, number];
  bogieCentres: number;
  wheelR: number;
  wheelbase: number;
  coupler: "buffers" | "knuckle" | "centre";
  types: Record<string, CoachType>;
  liveries: Record<string, CoachLivery>;
  maxspeed: number;
  /** Reshapes the car the measures above describe (default none): a car that is more than its window row (the Glacier Express's panorama car); `lod` for the distant model. */
  adapt?: (c: CarDef, t: CoachType, lod: boolean) => CarDef;
  /** Reshapes the distant model's body (default carLod's own): paint that changes along the car. */
  lodBody?: (b: UnitBody, X: (d: number) => number) => UnitBody;
  /**
   * A coach's own layout over the one the measures give (the IC 2000's stepped
   * double-deck body): the car as laid out, the type of car (`unit`), the body's
   * length; and its distant model's body and bogie top likewise.
   */
  layout?: (c: CarDef, unit: string, L: number) => CarDef;
  lod?: (b: UnitBody, c: CarDef, X: (d: number) => number, L: number) => { body: UnitBody; bogieTop: number; parts?: LodPart[] };
  details?: CoachDetails;
}

const GAP = 0.65;
const gapOf = (s: WorldCoach) => (s.coupler === "buffers" ? GAP : 0.35);
const truck = (s: WorldCoach): BogieSpec => ({
  axles: [-s.wheelbase / 2, s.wheelbase / 2], wheelR: s.wheelR, frameHalf: s.wheelbase / 2 + s.wheelR + 0.15, frameTop: s.wheelR + 0.42, frameBottom: s.wheelR + 0.08,
  frameZ: [0.92, 1.04], primary: "coil", secondary: [-0.4, 0.4], secondaryZ: 1.08, bolster: s.B,
});

function coachDef(s: WorldCoach, t: CoachType, l: CoachLivery, lod = false): CarDef {
  const c = baseDef(s, t, l);
  return s.adapt ? s.adapt(c, t, lod) : c;
}

function baseDef(s: WorldCoach, t: CoachType, l: CoachLivery): CarDef {
  // the bogie's brake cylinders stand 0.55 m inside its axles: a shorter wheelbase puts them on its transoms
  if (s.wheelbase < 2.05) throw new Error(`coach: wheelbase ${s.wheelbase} m is shorter than the bogie kit's 2.05 m`);
  const L = s.length - 2 * gapOf(s);
  const x = s.details ?? {};
  const tr = [L / 2 - s.bogieCentres / 2, L / 2 + s.bogieCentres / 2];
  const from = s.doorIn + s.doorW + 0.5, to = L - s.doorIn - s.doorW - 0.5;
  const row = Array.from({ length: t.windows }, (_, i): [number, number] => { const d = from + (to - from) * ((i + 0.5) / t.windows); return [d - t.windowW / 2, d + t.windowW / 2]; });
  const ew = x.endWindow;
  const spans: Array<readonly [number, number]> = ew ? [[ew[0], ew[1]], ...row, [L - ew[1], L - ew[0]]] : row;
  const reach = s.wheelbase / 2 + s.wheelR + 0.25;
  const roofEnd = x.roofEnd && { len: x.endCorner?.len ?? 0.05, tip: x.endCorner?.tip ?? 1, power: 2, C: x.roofEnd, S: [] };
  const first = t.first === true;
  const ends = l.ends && { d: s.doorIn + s.doorW, bands: (first && l.ends.firstBands) || l.ends.bands, cap: l.ends.cap };
  const lettering = [{ text: t.number, d: x.numberAt?.d ?? L / 2, y: x.numberAt?.y ?? s.Y + 0.12, h: x.numberAt?.h ?? 0.1, mat: l.numberMat ?? "lettering" }];
  return {
    spec: {
      length: L, W: s.W, Y: s.Y, S: s.S, C: s.C, lean: 0.98, arc: 6, B: s.B, wl: x.wl ?? s.W * 0.95, A: s.A, wa: x.wa ?? s.W * 0.99, edges: [], step: 1.0, cuts: tr.map((d) => [d - reach, d + reach] as const),
      ...(roofEnd ? { front: roofEnd, rear: roofEnd } : {}),
    },
    bands: (first && l.firstBands) || l.bands, roof: l.roof, skirt: l.skirt, under: "under",
    ...(l.doorBands ? { doorBands: l.doorBands } : {}),
    ...(ends ? { ends } : {}),
    windows: s.rows.map((y) => ({ y, spans, frame: "rubber" })),
    doors: {
      spans: [[s.doorIn, s.doorIn + s.doorW], [L - s.doorIn - s.doorW, L - s.doorIn]], y: s.door,
      glass: x.doorGlass?.y ?? [s.rows[0]![0] + 0.05, s.rows[0]![1] - 0.05], ...(x.doorGlass ? { glassW: x.doorGlass.w } : {}),
    },
    cabEnds: [], diaphragm: [s.door[0], s.door[1] + 0.2],
    trucks: tr, truck: truck(s),
    coupler: s.coupler, couplerY: s.coupler === "buffers" ? 1.03 : 0.88, gap: [gapOf(s), gapOf(s)],
    lettering,
    extras: (m, b, X) => {
      const uf = x.underfloor ?? { y0: s.B - 0.4, half: s.W * 0.75 };
      m.scope("underfloor", () => block(m, "under", X(L / 2 + 3.5), X(L / 2 - 3.5), uf.y0, s.B, -uf.half, uf.half));
      if (s.details) coachDetails(m, s, x, b, X, L, l, first);
    },
  };
}

/** A strip on the body's outer surface on side s from d0 to d1 between heights ya and yb (the side or the roof's arc), `proud` off it. */
function surfaceStrip(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, d0: number, d1: number, ya: number, yb: number, proud: number, depth = 0.02): void {
  const dm = (d0 + d1) / 2;
  const pa = surfacePoint(b, dm, ya, s), pb = surfacePoint(b, dm, yb, s);
  const nz = ((pa.n[2] + pb.n[2]) / 2) * s, ny = (pa.n[1] + pb.n[1]) / 2;
  const at = (p: Pt, k: number): Pt => [s * (p[0] + nz * k), p[1] + ny * k];
  const ring: Pt[] = [at(pa.p, -depth), at(pb.p, -depth), at(pb.p, proud), at(pa.p, proud)];
  m.sweep(mat, "x", ring, X(d0), ring, X(d1));
}

/** The optional details of a coach (CoachDetails): roof ribs and intake, the rubber gangways and end doors, the emblem. */
function coachDetails(m: MeshBuilder, s: WorldCoach, x: CoachDetails, b: SliceBody, X: (d: number) => number, L: number, l: CoachLivery, first: boolean): void {
  const ew = x.endWindow, lv = x.endLouvre;
  if (ew && lv)
    m.scope("end window vents", () => {
      const [y0] = s.rows[0]!;
      for (const sd of [1, -1])
        for (const [a, c] of [[ew[0], ew[1]], [L - ew[1], L - ew[0]]] as const) {
          sidePanel(m, b, X, sd, "frameSilver", a + 0.05, c - 0.05, y0 + 0.05, y0 + 0.05 + lv, 0.014, 0.004);
          for (let i = 0; i < 4; i++) {
            const y = y0 + 0.08 + ((lv - 0.06) * (i + 0.5)) / 4;
            sidePanel(m, b, X, sd, "louvre", a + 0.09, c - 0.09, y - 0.012, y + 0.012, 0.017, 0.002);
          }
        }
    });
  const cs = x.classSign;
  if (cs)
    m.scope("class signs", () => {
      const [d0, d1] = cs.d, [y0, y1] = cs.y;
      for (const sd of [1, -1])
        for (const [a, c] of [[d0, d1], [L - d1, L - d0]] as const) {
          if (l.classPanel) sidePanel(m, b, X, sd, l.classPanel, a, c, y0, y1, 0.005, 0.003);
          const h = Math.min(0.24, (c - a) * 0.8);
          sideLettering(m, b, X, sd, first ? "1" : "2", (a + c) / 2, y1 - h - 0.05, h, "letterW", 0.008);
        }
    });
  const foot = x.doorFoot;
  if (foot !== undefined)
    m.scope("door feet", () => {
      const bands = l.doorBands ?? l.bands;
      const mat = bands.find(([a, c]) => (foot + s.door[0]) / 2 >= a && (foot + s.door[0]) / 2 < c)?.[2] ?? bands[0]![2];
      const z = x.wa ?? s.W * 0.99;
      for (const [d0, d1] of [[s.doorIn, s.doorIn + s.doorW], [L - s.doorIn - s.doorW, L - s.doorIn]] as const)
        for (const sd of [1, -1]) {
          const [a, c] = [X(d0 + 0.02), X(d1 - 0.02)].sort((p, q) => p - q) as [number, number];
          block(m, mat, a, c, foot, s.door[0] - 0.08, ...side(sd, z - 0.05, z + 0.005));
        }
    });
  const ribs = x.roofRibs;
  if (ribs)
    m.scope("roof ribs", () => {
      for (const sd of [1, -1]) for (const y of ribs.y) surfaceStrip(m, b, X, sd, "roofRib", ribs.from, L - ribs.from, y - 0.025, y + 0.025, 0.018, 0.03);
    });
  const g = x.grille;
  if (g)
    m.scope("roof intake", () => {
      const [d0, d1, y0, y1] = g;
      for (const [sd, a, c] of [[1, d0, d1], [-1, L - d1, L - d0]] as const) {
        surfaceStrip(m, b, X, sd, "louvre", a, c, y0, y1, 0.008, 0.03);
        const n = 7;
        for (let i = 0; i < n; i++) {
          const y = y0 + 0.03 + ((y1 - y0 - 0.06) * (i + 0.5)) / n;
          surfaceStrip(m, b, X, sd, "louvreSlat", a + 0.03, c - 0.03, y - 0.012, y + 0.012, 0.016, 0.01);
        }
      }
    });
  if (x.rubberGangway)
    for (const e of [1, -1])
      m.scope(e > 0 ? "front gangway" : "rear gangway", () => {
        const wall = X(e > 0 ? 0 : L), out = e * (gapOf(s) - 0.04);
        const [y0, y1] = [s.A + 0.1, s.S - 0.12];
        const r = 0.11, hw = 0.68;
        // the end door between the rolls and its window
        m.scope("end door", () => {
          decalX(m, "endDoor", wall + e * 0.004, e, -0.42, 0.42, s.A + 0.25, y1 - 0.2);
          decalX(m, "rubber", wall + e * 0.008, e, -0.27, 0.27, 2.15, 2.85);
          decalX(m, "glass", wall + e * 0.011, e, -0.23, 0.23, 2.19, 2.81);
        });
        // the rubber rolls: a U round the door, standing out to the buffers' plane
        m.scope("rubber roll", () => {
          const tip = wall + out - e * r;
          const [a, c] = [wall, tip].sort((p, q) => p - q) as [number, number];
          for (const sd of [1, -1]) {
            block(m, "rubber", a, c, y0, y1 - r, ...side(sd, hw - 0.06, hw + 0.06));
            m.prism("rubber", ngon(8, r, Math.PI / 8, tip, sd * hw), y0, y1 - r);
          }
          block(m, "rubber", a, c, y1 - 2 * r, y1, -hw - 0.09, hw + 0.09);
          const top = ngon(8, r, Math.PI / 8, tip, y1 - r);
          m.sweep("rubber", "z", top, -hw - 0.09, top, hw + 0.09);
        });
        m.scope("tail lamps", () => faceLamps(m, e, e * wall, [[-1.0, 1.62, 0.065, "lampRed"], [1.0, 1.62, 0.065, "lampRed"]]));
      });
  const lg = x.logo;
  if (lg)
    for (const sd of [1, -1])
      m.scope(sd > 0 ? "right emblem" : "left emblem", () => {
        const { d, y, h } = lg;
        const w = h * 1.6;
        sidePanel(m, b, X, sd, "logoRed", d - w / 2, d + w / 2, y - h / 2, y + h / 2, 0.006, 0.003);
        // the white cross with its two arrowheads, simplified
        const k = h * 0.12;
        const tris: Pt[] = [];
        const quad = (u0: number, u1: number, v0: number, v1: number) => tris.push([u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]);
        quad(d - w * 0.3, d + w * 0.3, y - k / 2, y + k / 2);
        quad(d - k / 2, d + k / 2, y - h * 0.34, y + h * 0.34);
        for (const e of [1, -1]) tris.push([d + e * w * 0.4, y], [d + e * w * 0.27, y - h * 0.2], [d + e * w * 0.27, y + h * 0.2]);
        sideDecal(m, b, X, sd, "white", tris, 0.009);
        const th = h * 0.55, tw = lg.name.length * th * 0.76;
        sideLettering(m, b, X, sd, lg.name, d - sd * (w / 2 + 0.12 + tw / 2), y - th / 2, th, "lettering", 0.008);
      });
}

const PALETTE: Record<string, MaterialSpec> = { ...INTERIOR_PALETTE, ...CARBODY_PALETTE, under: paint("#2a2c2f", 0.85), lettering: paint("#2a2c30") };
// the materials of the optional details, merged in only for a coach that has them (the others' palettes stay as they were)
const DETAIL_PALETTE: Record<string, MaterialSpec> = {
  letterW: paint("#e8e8e4", 0.5), roofRib: paint("#6c7075", 0.7), louvre: paint("#1d1f21", 0.8), louvreSlat: paint("#55595d", 0.6),
  endDoor: paint("#3a3d41", 0.7), logoRed: paint("#eb0000", 0.45), white: paint("#f4f4f2", 0.4), classBlue: paint("#1f4e9a", 0.45),
};

export function coachParams(s: WorldCoach): ParamSpec[] {
  const out = [enumParam("unit", "Car", Object.fromEntries(Object.entries(s.types).map(([k, v]) => [k, v.title])))];
  if (Object.keys(s.liveries).length > 1) out.push(enumParam("livery", "Livery", Object.fromEntries(Object.entries(s.liveries).map(([k, v]) => [k, v.title]))));
  return out;
}

function pick(s: WorldCoach, params: readonly ParamSpec[], v?: ParamValues, lod = false): { t: CoachType; l: CoachLivery; c: CarDef } {
  const p = resolveParams(params, v);
  const t = s.types[p.unit!]!, l = s.liveries[p.livery ?? Object.keys(s.liveries)[0]!]!;
  const c = coachDef(s, t, l, lod);
  return { t, l, c: s.layout ? s.layout(c, p.unit!, s.length - 2 * gapOf(s)) : c };
}

export function buildCoach(s: WorldCoach, params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const { l, c } = pick(s, params, v);
  const m = new MeshBuilder({ ...PALETTE, ...(s.details ? DETAIL_PALETTE : {}), ...l.palette });
  drawCar(m, c, (d) => s.length / 2 - gapOf(s) - d);
  return m;
}

export function buildCoachLod(s: WorldCoach, params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const { l, c } = pick(s, params, v, true);
  const X = (d: number) => s.length / 2 - gapOf(s) - d;
  const palette = { ...CARBODY_PALETTE, under: PALETTE.under!, ...l.palette };
  if (s.lod) {
    const { body, bogieTop, parts = [] } = s.lod(carLodBody(c, X), c, X, s.length - 2 * gapOf(s));
    return fitUnit({ palette, bodies: [body], parts: [...parts, ...bogieParts(c.trucks.map((d) => [X(d), c.truck.frameHalf] as const), bogieTop)] }, 100);
  }
  if (!s.lodBody) return carLod(c, X, palette);
  // carLod's body, reshaped
  const parts = bogieParts(c.trucks.map((d) => [X(d), c.truck.frameHalf] as const), c.spec.B);
  return fitUnit({ palette, bodies: [s.lodBody(carLodBody(c, X), X)], parts }, 100);
}

export function coachGame(s: WorldCoach): GameProperties {
  const [first, ...rest] = Object.entries(s.types);
  return { weight: first![1].weight, power: 0, maxspeed: s.maxspeed, accel: null, variants: rest.map(([unit, t]) => ({ params: { unit }, weight: t.weight })) };
}

export const coachDesign = (id: string, title: string, s: WorldCoach, params: ParamSpec[], build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, references: string, loadingGauge?: "us" | "uk"): ProceduralDesign => ({
  id, title, build, buildLod, params, game: coachGame(s), catalog: COACH_CATALOG, references, ...(loadingGauge ? { loadingGauge } : {}),
});

const c = (hex: string, r = 0.45) => paint(hex, r);

// ---------------------------------------------------------------------------
// Germany: the Intercity coaches (Avmz first class, Bpmz second class, 26.4 m)

export const DB_IC: WorldCoach = {
  length: 26.4, W: 1.41, Y: 1.4, S: 3.2, C: 4.05, B: 1.0, A: 1.15, rows: [[1.95, 2.85]], doorIn: 0.7, doorW: 0.75, door: [1.2, 3.1],
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, coupler: "buffers", maxspeed: 200,
  types: {
    avmz: { title: "First class", windows: 11, windowW: 1.4, number: "61 80 19-91 001-2", weight: 47 },
    bpmz: { title: "Second class", windows: 12, windowW: 1.25, number: "61 80 22-91 101-3", weight: 45 },
  },
  liveries: {
    tee: { title: "TEE", palette: { red: c("#8a1c2b"), beige: c("#e3d3a6"), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "red"], [1.85, 2.95, "beige"], [2.95, 9, "red"]], roof: "roofG", skirt: "skirtG" },
    oceanBlue: { title: "Ocean blue", palette: { blue: c("#104058"), beige: c("#e3d3a6"), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "blue"], [1.85, 2.95, "beige"], [2.95, 9, "blue"]], roof: "roofG", skirt: "skirtG" },
    intercity: { title: "Intercity", palette: { white: c("#eceeee", 0.35), red: c("#ec0016"), roofG: c("#b9bdc0", 0.6), skirtG: c("#4a4d50", 0.7) }, bands: [[0, 1.7, "white"], [1.7, 1.84, "red"], [1.84, 9, "white"]], roof: "roofG", skirt: "skirtG" },
  },
};

// ---------------------------------------------------------------------------
// France: the Corail (VTU), the Grand Confort and the Wagons-Lits cars

export const SNCF_CORAIL: WorldCoach = {
  length: 26.4, W: 1.42, Y: 1.4, S: 3.25, C: 4.05, B: 1.0, A: 1.15, rows: [[1.95, 2.8]], doorIn: 0.7, doorW: 0.8, door: [1.2, 3.1],
  bogieCentres: 18.4, wheelR: 0.45, wheelbase: 2.56, coupler: "buffers", maxspeed: 200,
  types: {
    a10tu: { title: "First class", windows: 12, windowW: 1.3, number: "A10TU 50 87 19-70 110-4", weight: 42 },
    b11tu: { title: "Second class", windows: 13, windowW: 1.2, number: "B11TU 50 87 21-70 412-4", weight: 42 },
  },
  liveries: {
    corail: { title: "Corail", palette: { grey: c("#9aa0a5", 0.45), white: c("#efefea", 0.4), orange: c("#e8701e"), roofG: c("#6a6c6e", 0.7), skirtG: c("#3a3d40", 0.8) }, bands: [[0, 1.82, "grey"], [1.82, 1.9, "orange"], [1.9, 9, "white"]], roof: "roofG", skirt: "skirtG" },
    teoz: { title: "Teoz", palette: { dark: c("#3f4448", 0.45), white: c("#efefea", 0.4), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "dark"], [1.85, 9, "white"]], roof: "roofG", skirt: "skirtG" },
  },
};

export const SNCF_GRAND_CONFORT: WorldCoach = {
  length: 24.5, W: 1.43, Y: 1.4, S: 3.25, C: 4.05, B: 1.0, A: 1.15, rows: [[1.95, 2.8]], doorIn: 0.7, doorW: 0.75, door: [1.2, 3.1],
  bogieCentres: 17.2, wheelR: 0.45, wheelbase: 2.56, coupler: "buffers", maxspeed: 200,
  types: {
    a8u: { title: "Compartments", windows: 9, windowW: 1.6, number: "A8U 61 87 19-70 001-7", weight: 46 },
    a7d: { title: "Bar car", windows: 7, windowW: 1.9, number: "A7DU 61 87 89-70 001-2", weight: 48 },
  },
  liveries: {
    capitole: { title: "Capitole", palette: { red: c("#b5232b"), grey: c("#9aa0a5", 0.45), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "red"], [1.85, 2.9, "grey"], [2.9, 9, "red"]], roof: "roofG", skirt: "skirtG" },
    tee: { title: "TEE", palette: { red: c("#8a1c2b"), beige: c("#e3d3a6"), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "red"], [1.85, 2.9, "beige"], [2.9, 9, "red"]], roof: "roofG", skirt: "skirtG" },
  },
};

export const CIWL: WorldCoach = {
  length: 23.45, W: 1.43, Y: 1.4, S: 3.3, C: 4.05, B: 1.0, A: 1.15, rows: [[1.9, 2.75]], doorIn: 0.7, doorW: 0.75, door: [1.2, 3.05],
  bogieCentres: 16.5, wheelR: 0.5, wheelbase: 3.0, coupler: "buffers", maxspeed: 140,
  types: {
    pullman: { title: "Pullman car", windows: 9, windowW: 1.25, number: "4141", weight: 52 },
    sleeping: { title: "Sleeping car", windows: 10, windowW: 0.8, number: "3425", weight: 56 },
  },
  liveries: {
    pullman: { title: "Pullman", palette: { blue: c("#1d2a5a"), cream: c("#e8dcc0"), gold: c("#c9a55a", 0.35), roofG: c("#3a3d40", 0.7), skirtG: c("#1d2a5a", 0.6) }, bands: [[0, 1.82, "blue"], [1.82, 1.86, "gold"], [1.86, 2.95, "cream"], [2.95, 9, "blue"]], roof: "roofG", skirt: "skirtG" },
    ciwlBlue: { title: "CIWL blue", palette: { blue: c("#1d2a5a"), gold: c("#c9a55a", 0.35), roofG: c("#3a3d40", 0.7), skirtG: c("#1d2a5a", 0.6) }, bands: [[0, 3.05, "blue"], [3.05, 3.09, "gold"], [3.09, 9, "blue"]], roof: "roofG", skirt: "skirtG" },
  },
};

// ---------------------------------------------------------------------------
// The Netherlands: the ICR (Intercity rijtuig)

export const NS_ICR: WorldCoach = {
  length: 26.4, W: 1.42, Y: 1.4, S: 3.25, C: 4.05, B: 1.0, A: 1.15, rows: [[1.95, 2.85]], doorIn: 0.7, doorW: 0.8, door: [1.2, 3.1],
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, coupler: "buffers", maxspeed: 160,
  types: {
    a: { title: "First class", windows: 11, windowW: 1.35, number: "A 7101", weight: 41 },
    b: { title: "Second class", windows: 12, windowW: 1.25, number: "B 7201", weight: 40 },
  },
  liveries: {
    yellowGrey: { title: "NS yellow, grey", palette: { yellow: c("#ffc917"), grey: c("#6f757a"), roofG: c("#8f9396", 0.6), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.75, "grey"], [1.75, 9, "yellow"]], roof: "roofG", skirt: "skirtG" },
    yellowBlue: { title: "NS yellow, blue", palette: { yellow: c("#ffc917"), blue: c("#003082"), roofG: c("#8f9396", 0.6), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.75, "blue"], [1.75, 9, "yellow"]], roof: "roofG", skirt: "skirtG" },
  },
};

// ---------------------------------------------------------------------------
// Switzerland: the EW IV, the IC 2000 double-deck coach and the metre-gauge Glacier Express

// The EW IV (1981): measured on photographs of the B 50 85 21-95 149-3 and the A 50 85 10-95 031-6 and on side
// views of the A and the B (assets/sbb-ew4-coach/SOURCES.md). 26.4 m over the buffers, the bogies 18.6 m apart (both
// painted on the car); the swing-plug doors set in from the ends with a toilet or vestibule window beside them; ten
// windows between the doors in first class, eleven in second; the ribbed roof with rounded end caps and an air intake.
const EW4_BODY: readonly Band[] = [[0, 1.33, "low"], [1.33, 2.03, "cream"], [2.03, 3.1, "band"], [3.1, 9, "cream"]];
const ew4 = (o: { low: string; band: string; endBand: string; cap: string; door: readonly Band[]; red?: boolean }): Pick<CoachLivery, "bands" | "firstBands" | "doorBands" | "ends"> => {
  const swap = (bands: readonly Band[], band: string): Band[] => bands.map(([a, b, mt]): Band => [a, b, mt === "low" ? o.low : mt === "band" ? band : mt]);
  // the red line along the side's top (2021) and the first-class yellow strip at the top of the window band
  const line = (bands: Band[]): Band[] => (o.red ? bands.flatMap(([a, b, mt]): Band[] => (a === 3.1 ? [[3.1, 3.38, mt], [3.38, 3.46, "red"], [3.46, b, mt]] : [[a, b, mt]])) : bands);
  const yellow = (bands: Band[]): Band[] => bands.flatMap(([a, b, mt]): Band[] => (a === 2.03 ? [[2.03, 3.0, mt], [3.0, 3.1, "yellow"]] : [[a, b, mt]]));
  return {
    bands: line(swap(EW4_BODY, o.band)),
    doorBands: o.door,
    ends: { bands: line(swap(EW4_BODY, o.endBand)), firstBands: line(yellow(swap(EW4_BODY, o.endBand))), cap: o.cap },
  };
};

export const SBB_EW4: WorldCoach = {
  length: 26.4, W: 1.41, Y: 1.3, S: 3.48, C: 4.05, B: 0.76, A: 1.04, rows: [[2.1, 2.95]], doorIn: 1.4, doorW: 0.95, door: [1.07, 3.1],
  bogieCentres: 18.6, wheelR: 0.46, wheelbase: 2.5, coupler: "buffers", maxspeed: 200,
  types: {
    a: { title: "First class", windows: 10, windowW: 1.36, number: "A 50 85 10-95 031-6", weight: 43, first: true },
    b: { title: "Second class", windows: 11, windowW: 1.42, number: "B 50 85 21-95 149-3", weight: 42 },
  },
  liveries: {
    // 2004-2021: cream, the black window band red at the ends, a grey skirt and grey end walls
    redGrey: {
      title: "White and red", roof: "roofG", skirt: "low", numberMat: "letterW", classPanel: "classBlue",
      palette: { cream: c("#ebe7dc", 0.4), black: c("#1f2124", 0.35), red: c("#d0201c"), yellow: c("#f0c010"), low: c("#73787c", 0.6), endGrey: c("#5b5f63", 0.6), roofG: c("#707478", 0.7) },
      ...ew4({ low: "low", band: "black", endBand: "red", cap: "endGrey", door: [[0, 1.33, "low"], [1.33, 2.03, "cream"], [2.03, 9, "red"]] }),
    },
    // since 2021: red doors, the skirt, the ends' window band and the end walls black, a red line under the roof
    sbb: {
      title: "SBB", roof: "roofG", skirt: "low", numberMat: "letterW", classPanel: "classBlue",
      palette: { cream: c("#ebe7dc", 0.4), black: c("#1f2124", 0.35), red: c("#d0201c"), yellow: c("#f0c010"), low: c("#232528", 0.6), roofG: c("#64686c", 0.7) },
      ...ew4({ low: "low", band: "black", endBand: "black", cap: "black", door: [[0, 9, "red"]], red: true }),
    },
    // 1981: fir green with a stone-grey band under the windows and under the roof, first class a yellow line
    greenGrey: {
      title: "Green and grey", roof: "roofG", skirt: "greenD", numberMat: "letterW",
      palette: { green: c("#2d4a3f", 0.5), greenD: c("#25302c", 0.7), stone: c("#c3c6c1", 0.5), yellow: c("#e8c21a"), roofG: c("#55595c", 0.75) },
      bands: [[0, 1.14, "green"], [1.14, 1.88, "stone"], [1.88, 3.1, "green"], [3.1, 9, "stone"]],
      firstBands: [[0, 1.14, "green"], [1.14, 1.88, "stone"], [1.88, 3.0, "green"], [3.0, 3.1, "yellow"], [3.1, 9, "stone"]],
      doorBands: [[0, 9, "green"]],
    },
  },
  details: {
    wl: 1.3, wa: 1.37, endWindow: [0.47, 1.07], endLouvre: 0.26, doorGlass: { y: [2.15, 2.9], w: 0.5 }, doorFoot: 0.8,
    roofEnd: [[0, 3.7], [0.05, 3.84], [0.14, 3.94], [0.28, 4.0], [0.45, 4.05]], endCorner: { len: 0.2, tip: 0.9 },
    roofRibs: { from: 1.45, y: [3.62, 3.76, 3.88, 3.97, 4.02] },
    grille: [0.25, 1.3, 3.5, 3.8],
    rubberGangway: true,
    logo: { d: 6.6, y: 1.68, h: 0.36, name: "SBB CFF FFS" },
    numberAt: { d: 4.6, y: 1.12, h: 0.09 },
    classSign: { d: [1.1, 1.36], y: [2.03, 3.0] },
    underfloor: { y0: 0.5, half: 1.05 },
  },
};

/**
 * The IC 2000 (assets/sbb-ic2000/, de.wikipedia "IC2000"): a double-deck body the full height of the
 * EBV O2 gauge, its lower deck low between the bogies, the end sections over the bogies single-level
 * (stairs and equipment under the upper deck, whose gangways run through the end walls) with the
 * body's bottom stepped up there. The doors stand in the lower deck where it meets each end
 * section, each a coral strip from the bottom to the roof's edge with the upper deck's lounge window
 * in it and three dashes across the roof; a blue strip with the class numeral beside it toward the
 * middle. Paint (the designers' "anthracite top and bottom, a two-part grey-white middle band"):
 * the dark lower body up to the middle of the lower deck's windows, a dark line between the decks,
 * the anthracite roof down over the upper deck's windows' heads. Measured on
 * photo-familienwagen-...-925-2 (heights, at 115 px/m: the line 2.5-2.7 m, the upper windows
 * 3.32-4.08 m, 1.43 m wide on a 1.98 m pitch, the lower 1.04-1.96 m), the Siegershausen and
 * ten-car side views (door strips 5-7 m from the coupling planes, end sections, the step) and the
 * Zuerich - Luzern view (the roof dashes, the small stair windows). 26.80 m over the buffers and
 * 20.00 m between the bogie centres are lettered on the car.
 */
// d from the body's end (the coupling plane is 0.65 m beyond it): the door strip's centre 7.0 m from the coupling plane
const IC_ENDS = 5.4;
const IC_DOOR: readonly [number, number] = [5.65, 6.95];
const IC_STRIP: readonly [number, number] = [5.45, 7.15];
const IC_BLUE: readonly [number, number] = [7.15, 7.38];
const IC_UPPER: readonly [number, number] = [3.32, 4.06];
const IC_LOWER: readonly [number, number] = [1.04, 1.96];
const IC_STAIRS: readonly [number, number] = [1.78, 2.3];
const IC_DASHES: ReadonlyArray<readonly [number, number]> = [[1.06, 1.2], [0.7, 0.84], [0.34, 0.48]];
/** Each type's upper-deck windows between the doors: offsets of their centres from the middle, and width (one a seat bay). */
const IC_MIDDLE: Record<string, { at: readonly number[]; w: number }> = {
  // first class: five on a 2.0 m pitch (13 a side, the Siegershausen photograph's A car)
  a: { at: [-4, -2, 0, 2, 4], w: 1.4 },
  // second class: six on 1.75 m (14 a side)
  b: { at: [-4.375, -2.625, -0.875, 0.875, 2.625, 4.375], w: 1.3 },
};
/** The upper deck's three windows over each end section (d of their centres from the body's end) and the stair windows under them. */
const IC_END_UPPER = [0.95, 2.7, 4.4];
const IC_END_STAIRS = [2.2, 3.5];
const IC_CLASS: Record<string, string> = { a: "1", b: "2" };
/** The end walls' rounded corners: a plan narrowing to 88 % over the last 0.35 m. */
const IC_CORNER = { len: 0.35, tip: 0.88, power: 2, C: [[0, 4.6]] as Pt[], S: [[0, 4.12]] as Pt[] };

/** Lettering on the lower body (below the belly, where the side's plane is not the skin): each point on the slice itself. */
function lowerLettering(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, text: string, d: number, y: number, h: number, mat: string): void {
  const w = h * 0.58, gap = h * 0.18;
  const width = strokeWidth(text, w, gap);
  const dir = Math.sign(X(0) - X(1));
  const pts = strokeText(text, -width / 2, y, h, w, gap, false, h * 0.13).map(([u, v]): Vec3 => {
    const dd = d - dir * s * u;
    const q = surfacePoint(b, dd, v, s);
    return [X(dd) + q.n[0] * 0.006, q.p[1] + q.n[1] * 0.006, s * q.p[0] + q.n[2] * 0.006];
  });
  m.facets(mat, pts, [0, 0, s]);
}

function ic2000Layout(c: CarDef, unit: string, L: number): CarDef {
  const mirror = (p: readonly [number, number]): [number, number] => [L - p[1], L - p[0]];
  const span = (d: number, w: number): [number, number] => [d - w / 2, d + w / 2];
  const dc = (IC_STRIP[0] + IC_STRIP[1]) / 2;
  const mid = IC_MIDDLE[unit]!;
  const upper = [
    ...IC_END_UPPER.flatMap((d) => [span(d, 1.1), span(L - d, 1.1)]), span(dc, 1.2), span(L - dc, 1.2),
    ...mid.at.map((k) => span(L / 2 + k, mid.w)),
  ].sort((p, q) => p[0] - q[0]);
  const lower = [-4, -2, 0, 2, 4].map((k) => span(L / 2 + k, 1.38));
  const stairs = IC_END_STAIRS.flatMap((d) => [span(d, 0.13), span(L - d, 0.13)]).sort((p, q) => p[0] - q[0]);
  const no = IC_CLASS[unit]!;
  const number = c.lettering?.[0]?.text ?? "";
  return {
    ...c,
    // the end walls' corners rounded in plan
    spec: { ...c.spec, lean: 0.95, wl: c.spec.W * 0.97, wa: c.spec.W * 0.99, cuts: [[0, IC_ENDS], [L - IC_ENDS, L]], cutRadius: 0.3, front: IC_CORNER, rear: IC_CORNER, noseStep: 0.07 },
    strips: [
      // first class: a yellow length of the line between the decks across the door strips (the Siegershausen A car)
      ...(unit === "a" ? [[IC_STRIP[0], IC_BLUE[1]] as const, mirror([IC_STRIP[0], IC_BLUE[1]])].map((d) => ({ d, y: [2.5, 2.7] as const, mat: "firstYellow" })) : []),
      ...[IC_STRIP, mirror(IC_STRIP)].map((d) => ({ d, y: [0, 4.12] as const, mat: "coral" })),
      ...[IC_BLUE, mirror(IC_BLUE)].map((d) => ({ d, y: [1.43, 3.73] as const, mat: "classBlue" })),
    ],
    windows: [
      { y: IC_LOWER, spans: lower, frame: "rubber" },
      { y: IC_STAIRS, spans: stairs, frame: "rubber" },
      { y: IC_UPPER, spans: upper, frame: "rubber" },
    ],
    doors: { spans: [IC_DOOR, mirror(IC_DOOR)], y: [0.55, 2.45], glass: [1.25, 2.2], glassW: 0.36 },
    doorBands: [[0, 9, "coral"]],
    // the passenger room is the lower deck's floor between the end sections; the gangways' bellows round the upper deck's doors
    cabin: [IC_ENDS, L - IC_ENDS],
    diaphragm: null,
    truck: { ...c.truck, bolster: c.spec.A },
    lettering: [],
    extras: (m, b, X) => {
      for (const s of [1, -1]) {
        m.scope(s > 0 ? "right side" : "left side", () => {
          m.scope("class", () => {
            for (const d of [IC_BLUE, mirror(IC_BLUE)]) for (const y of [2.12, 3.42]) sideLettering(m, b, X, s, no, (d[0] + d[1]) / 2, y, 0.2, "letterW", 0.01);
          });
          m.scope("emblem", () => {
            sidePanel(m, b, X, s, "coral", 0.8, 1.1, 2.8, 3.1, 0.004, 0.003);
            sidePanel(m, b, X, s, "letterW", 0.92, 0.98, 2.86, 3.04, 0.007, 0.003);
            sidePanel(m, b, X, s, "letterW", 0.86, 1.04, 2.92, 2.98, 0.007, 0.003);
            sideLettering(m, b, X, s, "SBB CFF FFS", 1.95, 2.88, 0.14, "lettering", 0.006);
          });
          m.scope("lettering", () => lowerLettering(m, b, X, s, number, L / 2, 0.62, 0.09, "letterW"));
        });
        m.scope(s > 0 ? "front end" : "rear end", () => {
          // the gangway's seal round the end's outline from the end section's bottom over the roof, the upper deck's gangway door
          const [d, e] = s > 0 ? [0, 1] : [L, -1];
          const x = X(d);
          const h = halfSlice(b, d).slice(2);
          const nrm = h.map((_, i) => {
            const [p, q] = [h[Math.max(0, i - 1)]!, h[Math.min(h.length - 1, i + 1)]!];
            const [dz, dy] = [q[0] - p[0], q[1] - p[1]];
            const k = Math.hypot(dz, dy) || 1;
            return [dy / k, -dz / k] as const;
          });
          m.scope("gangway seal", () => {
            for (const side of [1, -1])
              for (let i = 0; i + 1 < h.length; i++) {
                const ring = [i, i + 1].flatMap((j) => [[h[j]![0] + nrm[j]![0] * 0.01, h[j]![1] + nrm[j]![1] * 0.01], [h[j]![0] - nrm[j]![0] * 0.09, h[j]![1] - nrm[j]![1] * 0.09]] as const);
                const sec = [ring[0]!, ring[2]!, ring[3]!, ring[1]!].map(([z, y]): [number, number] => [side * z, y]);
                m.sweep("bellows", "x", sec, Math.min(x - e * 0.05, x + e * 0.14), sec, Math.max(x - e * 0.05, x + e * 0.14));
              }
          });
          m.scope("gangway door", () => decalX(m, "diaphragm", x + e * 0.004, e, -e * 0.42, e * 0.42, 2.62, 4.3));
        });
        m.scope("roof", () => {
          for (const d of [IC_STRIP, mirror(IC_STRIP)]) for (const z of IC_DASHES) crownPane(m, b, X, s, "coral", [d[0] + 0.15, d[1] - 0.15], [z[0], z[1]], 0.006);
        });
      }
    },
  };
}

export const SBB_IC2000: WorldCoach = {
  length: 26.8, W: 1.4, Y: 1.25, S: 4.12, C: 4.6, B: 0.45, A: 1.15, rows: [IC_LOWER, IC_UPPER], doorIn: IC_DOOR[0], doorW: IC_DOOR[1] - IC_DOOR[0], door: [0.55, 2.45],
  bogieCentres: 20.0, wheelR: 0.46, wheelbase: 2.5, coupler: "buffers", maxspeed: 200,
  types: {
    a: { title: "First class", windows: 13, windowW: 1.4, number: "50 85 16-94 073-3", weight: 50 },
    b: { title: "Second class", windows: 14, windowW: 1.4, number: "50 85 26-94 101-0", weight: 49 },
  },
  liveries: {
    sbb: {
      title: "SBB",
      palette: { white: c("#e9eae6", 0.4), anth: c("#3d4246", 0.55), roofG: c("#5f656b", 0.6), firstYellow: c("#f2c200", 0.45), line: c("#34433f", 0.5), coral: c("#d8432e", 0.45), classBlue: c("#24489a", 0.45), letterW: c("#f4f4f0", 0.5) },
      bands: [[0, 1.43, "anth"], [1.43, 2.5, "white"], [2.5, 2.7, "line"], [2.7, 3.73, "white"], [3.73, 9, "roofG"]], roof: "roofG", skirt: "anth",
    },
  },
  layout: ic2000Layout,
  // the distant model: the shell from the white up (the upper deck's windows in it), the dark lower body as
  // boxes stepped up over the bogies like the body, the coral door strips as panels on both sides
  lod: (body, c, X, L) => {
    const top = body.hw[body.hw.length - 1]![0];
    const [low, W] = [1.43, c.spec.W];
    const box = (mat: string, d0: number, d1: number, y0: number, y1: number, hw: number, ends = true): LodPart => {
      const [x0, x1] = [Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1))];
      return { draw: (m) => m.scope("body", () => lodSideBox(m, mat, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], -hw, hw, ends)) };
    };
    return {
      body: {
        ...body, y0: low, hw: [[low, W], ...body.hw.filter(([y]) => y > low + 1e-6)], front: { tip: [[low, X(0)]] }, rear: { tip: [[low, X(L)]] },
        side: [[low, 3.73, "white"], [3.73, top, "roofG"]],
        windows: [{ u: [Math.min(X(0.7), X(L - 0.7)), Math.max(X(0.7), X(L - 0.7))], y: IC_UPPER, mat: LOD_GLASS }],
      },
      bogieTop: c.spec.A,
      parts: [
        box("anth", 0, L, c.spec.A, low, W),
        box("anth", IC_ENDS, L - IC_ENDS, c.spec.B, c.spec.A, W * 0.97),
        ...[IC_STRIP, [L - IC_STRIP[1], L - IC_STRIP[0]] as const].map(([d0, d1]) => box("coral", d0, d1, c.spec.B, 4.12, W + 0.02, false)),
      ],
    };
  },
};

// The panorama car (Stadler, 2006/2009/2011; datasheet WGEX0123: body 17.7 m, 2.68 m wide, 3.695 m high,
// floor 0.95 m, bogie pivots 12.83 m, wheels 685 mm, entrance 850 mm). Its glass runs from the sill up the
// side and over the roof's curve to an opaque crown strip; the ends are red, the middle white over a red
// lower band. d runs from the body's +X end (the door end: one entrance a side, as the photographs show)
// to its -X end (the plain end). The red ends' edges and the glass band's ends lean like "/" seen from the
// -Z side (the side view; assets/glacier-express/): the car is drawn the same on both sides.
const GX = {
  L: 18.4 - 0.7,
  /** The side glass from the sill to the shoulder; the glass band at the shoulder, and its roof glass's reach at the crown strip. */
  sill: 1.8,
  side: [3.5, 15.7] as const,
  top: [4.0, 16.35] as const,
  /** The opaque crown strip's half width; the white rail between the side and the roof glass. */
  crownZ: 0.42,
  rail: 0.015,
  /** The red ends' edge at the crown, the shoulder and the belly: d from the door end, d from the plain end (one slanted line in the side view). */
  doorEnd: [3.95, 3.25, 2.65] as const,
  plain: [0.4, 0.9, 1.5] as const,
  /** The entrance, d from the door end. */
  door: [0.6, 1.45] as const,
};

const quad = (p: Pt, q: Pt, r: Pt, t: Pt): Pt[] => [p, q, r, p, r, t];

function glacierCar(c: CarDef, t: CoachType): CarDef {
  const { L, sill, side } = GX;
  const S = c.spec.S, Yb = c.spec.Y;
  const n = t.windows, pitch = (side[1] - side[0]) / n;
  const spans = Array.from({ length: n }, (_, i): [number, number] => [side[0] + i * pitch, side[0] + (i + 1) * pitch]);
  const redTop = [GX.doorEnd[1], L - GX.plain[1]] as const;
  const repaint = (base: Painter): Painter => (d, y, r) => (r !== "bottom" && (d < redTop[0] - 1e-6 || d > redTop[1] + 1e-6) ? "red" : base(d, y, r));
  const cls = t.title.startsWith("First") ? "1" : "2";
  return {
    ...c,
    spec: { ...c.spec, lean: 0.94, arc: 8, stations: [...redTop] },
    repaint,
    windows: [{ y: [sill, S], spans, frame: "rubber" }],
    doors: { spans: [GX.door], y: c.doors.y, glass: [1.75, 2.65], glassW: 0.28 },
    doorBands: [[0, 9, "white"]],
    lettering: [
      { text: t.number, d: L / 2, y: 0.98, h: 0.09, mat: "letterW" },
      { text: cls, d: side[0] - 0.25, y: 2.4, h: 0.18, mat: "lettering" },
    ],
    extras: (m, b, X) => {
      c.extras?.(m, b, X);
      for (const s of [1, -1]) m.scope(s > 0 ? "right side" : "left side", () => glacierSide(m, b, X, s, Yb, S, spans));
    },
  };
}

/** The distant car: the roof's curve glazed under the white crown, the red ends. */
function glacierLod(u: UnitBody, X: (d: number) => number): UnitBody {
  const { L } = GX;
  const top = u.side[u.side.length - 1]!;
  const side = [...u.side.slice(0, -1), [top[0], top[1], "roofGlass"] as const];
  const red = [[u.y0, top[1], "red"] as const];
  const ends = [[0, GX.doorEnd[1]], [L - GX.plain[1], L]].map(([d0, d1]) => ({ x0: Math.min(X(d0!), X(d1!)), x1: Math.max(X(d0!), X(d1!)), side: red }));
  return { ...u, side, cabs: ends, front: { ...u.front, paint: red }, rear: { ...u.rear, paint: red } };
}

/** One side's red-end wedges, white flags and the roof glass over the shoulder. */
function glacierSide(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, Yb: number, S: number, spans: ReadonlyArray<readonly [number, number]>): void {
  const { L } = GX;
  m.scope("paint", () => {
    // the door end: red wider at the shoulder (white below its edge); the plain end: red wider at the belly
    const [dc, dt, db] = GX.doorEnd, [pc, pt, pb] = GX.plain.map((d) => L - d) as [number, number, number];
    sideDecal(m, b, X, s, "white", [[dt + 0.03, Yb], [db, Yb], [dt + 0.03, S]]);
    sideDecal(m, b, X, s, "red", [[pt + 0.03, Yb], [pb, Yb], [pt + 0.03, S]]);
    // over the roof's curve the edge runs on from the shoulder (the shell's colour changes there) to the crown
    const zS = b.w(L / 2) * b.lean;
    const edge = (d0: number, d1: number) => (d: number) => zS * Math.max(0, Math.min(1, 1 - (d - d0) / (d1 - d0)));
    const steps = (d0: number, d1: number) => Array.from({ length: 9 }, (_, i) => d0 + ((d1 - d0) * (i + 1)) / 10);
    shapedCrownPane(m, b, X, s, "red", [dt, dc], () => 0, edge(dt, dc), 0.004, steps(dt, dc));
    shapedCrownPane(m, b, X, s, "white", [pt, pc], () => 0, edge(pt, pc), 0.004, steps(pt, pc));
    // the white flags: a bar beside the entrance, one high at the plain end
    sideDecal(m, b, X, s, "white", quad([1.75, 1.75], [2.0, 1.75], [2.12, 2.6], [1.87, 2.6]));
    sideDecal(m, b, X, s, "white", quad([L - 0.47, 2.15], [L - 0.27, 2.15], [L - 0.17, 3.0], [L - 0.37, 3.0]));
  });
  m.scope("roof glass", () => {
    const zOut = b.w(L / 2) * b.lean - GX.rail, zIn = GX.crownZ;
    const [s0, s1] = GX.side, [t0, t1] = GX.top;
    // over the door end's slant the inner edge leaves the shoulder for the crown strip, over the plain end's the outer edge
    const inner = (d: number, k = 0) => (d >= t0 ? zIn + k : Math.min(zOut, zOut - ((zOut - zIn) * (d - s0)) / (t0 - s0) + k));
    const outer = (d: number, k = 0) => (d <= s1 ? zOut - k : Math.max(zIn, zOut - ((zOut - zIn) * (d - s1)) / (t1 - s1) - k));
    // rows across both slants, so their edges run straight over the arc's facets
    const rows = Array.from({ length: 11 }, (_, i) => [s0 + ((t0 - s0) * i) / 10, s1 + ((t1 - s1) * i) / 10]).flat();
    shapedCrownPane(m, b, X, s, "rubber", [s0, t1], (d) => inner(d), (d) => outer(d), 0.006, rows);
    spans.forEach(([a, e], i) => {
      const d0 = a + 0.04, d1 = i === spans.length - 1 ? t1 - 0.04 : e - 0.04;
      shapedCrownPane(m, b, X, s, "roofGlass", [d0, d1], (d) => inner(d, 0.04), (d) => outer(d, 0.04), 0.012, rows);
    });
  });
}

export const GLACIER: WorldCoach = {
  length: 18.4, W: 1.34, Y: 1.2, S: 3.0, C: 3.695, B: 0.75, A: 0.95, rows: [[1.8, 3.0]], doorIn: 0.6, doorW: 0.85, door: [1.0, 2.95],
  bogieCentres: 12.83, wheelR: 0.343, wheelbase: 2.05, coupler: "centre", maxspeed: 90,
  types: {
    first: { title: "First class", windows: 6, windowW: 2.0, number: "A 4021", weight: 21 },
    second: { title: "Second class", windows: 7, windowW: 1.7, number: "B 4041", weight: 20 },
  },
  liveries: {
    glacier: {
      title: "Glacier Express",
      palette: { red: c("#d0101e", 0.35), white: c("#f1f2f0", 0.35), letterW: c("#f4f4f2"), roofGlass: { color: "#2e4b78", metallic: 0.25, roughness: 0.1, glass: true } },
      bands: [[0, 1.2, "red"], [1.2, 9, "white"]], roof: "white", skirt: "red",
    },
  },
  adapt: glacierCar,
  lodBody: glacierLod,
};

// ---------------------------------------------------------------------------
// The United Kingdom: BR's Mk1 coaches, on the W6a gauge

export const BR_MK1: WorldCoach = {
  length: 19.66, W: 1.37, Y: 1.35, S: 3.1, C: 3.86, B: 1.0, A: 1.15, rows: [[1.9, 2.7]], doorIn: 0.55, doorW: 0.7, door: [1.15, 2.95],
  bogieCentres: 14.17, wheelR: 0.46, wheelbase: 2.6, coupler: "buffers", maxspeed: 145,
  types: {
    tso: { title: "Open second", windows: 8, windowW: 1.55, number: "E4383", weight: 33 },
    bsk: { title: "Brake second", windows: 5, windowW: 1.45, number: "M35021", weight: 35 },
  },
  liveries: {
    crimsonCream: { title: "Crimson, cream", palette: { crimson: c("#7a1f2e"), cream: c("#e6dcc0"), roofG: c("#3a3d40", 0.7), skirtG: c("#1d1e20", 0.8) }, bands: [[0, 1.8, "crimson"], [1.8, 2.8, "cream"], [2.8, 9, "crimson"]], roof: "roofG", skirt: "skirtG" },
    maroon: { title: "BR maroon", palette: { maroon: c("#5a1a24"), lining: c("#d9b54a"), roofG: c("#3a3d40", 0.7), skirtG: c("#1d1e20", 0.8) }, bands: [[0, 2.8, "maroon"], [2.8, 2.84, "lining"], [2.84, 9, "maroon"]], roof: "roofG", skirt: "skirtG" },
    southernGreen: { title: "Southern green", palette: { green: c("#1f5d3a"), roofG: c("#3a3d40", 0.7), skirtG: c("#1d1e20", 0.8) }, bands: [[0, 9, "green"]], roof: "roofG", skirt: "skirtG" },
  },
};

// ---------------------------------------------------------------------------
// India: the LHB and ICF coaches, broad-gauge bodies on the 3.3 m gauge

export const IR_LHB: WorldCoach = {
  length: 24.0, W: 1.6, Y: 1.4, S: 3.3, C: 4.03, B: 1.0, A: 1.15, rows: [[1.95, 2.8]], doorIn: 0.6, doorW: 0.8, door: [1.2, 3.1],
  bogieCentres: 14.9, wheelR: 0.46, wheelbase: 2.56, coupler: "knuckle", maxspeed: 160,
  types: {
    ac3: { title: "AC three-tier", windows: 8, windowW: 1.6, number: "3A 211303", weight: 47 },
    chairCar: { title: "AC chair car", windows: 12, windowW: 1.25, number: "CC 211251", weight: 45 },
  },
  liveries: {
    rajdhani: { title: "Rajdhani", palette: { red: c("#b5232b"), cream: c("#e8dcc0"), roofG: c("#7d8084", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "red"], [1.85, 2.9, "cream"], [2.9, 9, "red"]], roof: "roofG", skirt: "skirtG" },
    shatabdi: { title: "Shatabdi", palette: { blue: c("#1d3f80"), cream: c("#e8dcc0"), roofG: c("#7d8084", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "blue"], [1.85, 2.9, "cream"], [2.9, 9, "blue"]], roof: "roofG", skirt: "skirtG" },
    humsafar: { title: "Humsafar", palette: { blue: c("#1d3f80"), orange: c("#f08a24"), white: c("#f1f1ee", 0.4), roofG: c("#7d8084", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "blue"], [1.85, 1.95, "orange"], [1.95, 9, "white"]], roof: "roofG", skirt: "skirtG" },
    tejas: { title: "Tejas", palette: { gold: c("#c9a55a", 0.35), maroon: c("#6b1d24"), roofG: c("#7d8084", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "maroon"], [1.85, 9, "gold"]], roof: "roofG", skirt: "skirtG" },
  },
};

export const IR_ICF: WorldCoach = {
  length: 22.3, W: 1.6, Y: 1.4, S: 3.3, C: 4.03, B: 1.0, A: 1.15, rows: [[1.9, 2.7]], doorIn: 0.55, doorW: 0.75, door: [1.2, 3.05],
  bogieCentres: 14.9, wheelR: 0.46, wheelbase: 2.9, coupler: "buffers", maxspeed: 110,
  types: {
    sleeper: { title: "Sleeper class", windows: 12, windowW: 1.1, number: "SL 98201", weight: 48 },
    general: { title: "General class", windows: 13, windowW: 1.0, number: "GS 04555", weight: 46 },
  },
  liveries: {
    blue: { title: "IR blue", palette: { blue: c("#1d3f80"), roofG: c("#3a3d40", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 9, "blue"]], roof: "roofG", skirt: "skirtG" },
    maroon: { title: "Maroon", palette: { maroon: c("#6b1d24"), roofG: c("#3a3d40", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 9, "maroon"]], roof: "roofG", skirt: "skirtG" },
  },
};

// ---------------------------------------------------------------------------
// China: the 25-series coaches (the 25T Z express and the green 25B)

export const CR_25: WorldCoach = {
  length: 26.6, W: 1.55, Y: 1.4, S: 3.3, C: 4.25, B: 1.0, A: 1.15, rows: [[1.95, 2.8]], doorIn: 0.6, doorW: 0.8, door: [1.2, 3.1],
  bogieCentres: 18.0, wheelR: 0.46, wheelbase: 2.5, coupler: "knuckle", maxspeed: 160,
  types: {
    softSleeper: { title: "Soft sleeper", windows: 10, windowW: 1.2, number: "RW25T 550001", weight: 52 },
    hardSeat: { title: "Hard seat", windows: 14, windowW: 1.0, number: "YZ25T 345001", weight: 48 },
  },
  liveries: {
    z25t: { title: "25T white, blue", palette: { white: c("#f1f1ee", 0.4), blue: c("#1d3f80"), roofG: c("#9aa0a5", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.75, "blue"], [1.75, 1.85, "white"], [1.85, 1.92, "blue"], [1.92, 9, "white"]], roof: "roofG", skirt: "skirtG" },
    green25b: { title: "25B green", palette: { green: c("#1f5d3a"), yellow: c("#f2c31a"), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "green"], [1.85, 1.92, "yellow"], [1.92, 2.86, "green"], [2.86, 2.92, "yellow"], [2.92, 9, "green"]], roof: "roofG", skirt: "skirtG" },
  },
};

const P = { cr25: coachParams(CR_25), lhb: coachParams(IR_LHB), icf: coachParams(IR_ICF), mk1: coachParams(BR_MK1), ew4: coachParams(SBB_EW4), ic2000: coachParams(SBB_IC2000), glacier: coachParams(GLACIER), nsIcr: coachParams(NS_ICR), dbIc: coachParams(DB_IC), corail: coachParams(SNCF_CORAIL), grandConfort: coachParams(SNCF_GRAND_CONFORT), ciwl: coachParams(CIWL) };
export function sncfCorail(v?: ParamValues): MeshBuilder { return buildCoach(SNCF_CORAIL, P.corail, v); }
export function sncfCorailLod(v?: ParamValues): MeshBuilder { return buildCoachLod(SNCF_CORAIL, P.corail, v); }
export function sncfGrandConfort(v?: ParamValues): MeshBuilder { return buildCoach(SNCF_GRAND_CONFORT, P.grandConfort, v); }
export function sncfGrandConfortLod(v?: ParamValues): MeshBuilder { return buildCoachLod(SNCF_GRAND_CONFORT, P.grandConfort, v); }
export function nsIcr(v?: ParamValues): MeshBuilder { return buildCoach(NS_ICR, P.nsIcr, v); }
export function nsIcrLod(v?: ParamValues): MeshBuilder { return buildCoachLod(NS_ICR, P.nsIcr, v); }
export function sbbEw4(v?: ParamValues): MeshBuilder { return buildCoach(SBB_EW4, P.ew4, v); }
export function sbbEw4Lod(v?: ParamValues): MeshBuilder { return buildCoachLod(SBB_EW4, P.ew4, v); }
export function sbbIc2000(v?: ParamValues): MeshBuilder { return buildCoach(SBB_IC2000, P.ic2000, v); }
export function sbbIc2000Lod(v?: ParamValues): MeshBuilder { return buildCoachLod(SBB_IC2000, P.ic2000, v); }
export function glacierExpress(v?: ParamValues): MeshBuilder { return buildCoach(GLACIER, P.glacier, v); }
export function glacierExpressLod(v?: ParamValues): MeshBuilder { return buildCoachLod(GLACIER, P.glacier, v); }
export function brMk1(v?: ParamValues): MeshBuilder { return buildCoach(BR_MK1, P.mk1, v); }
export function brMk1Lod(v?: ParamValues): MeshBuilder { return buildCoachLod(BR_MK1, P.mk1, v); }
export function irLhbCoach(v?: ParamValues): MeshBuilder { return buildCoach(IR_LHB, P.lhb, v); }
export function irLhbCoachLod(v?: ParamValues): MeshBuilder { return buildCoachLod(IR_LHB, P.lhb, v); }
export function irIcfCoach(v?: ParamValues): MeshBuilder { return buildCoach(IR_ICF, P.icf, v); }
export function irIcfCoachLod(v?: ParamValues): MeshBuilder { return buildCoachLod(IR_ICF, P.icf, v); }
export function cr25Coach(v?: ParamValues): MeshBuilder { return buildCoach(CR_25, P.cr25, v); }
export function cr25CoachLod(v?: ParamValues): MeshBuilder { return buildCoachLod(CR_25, P.cr25, v); }
export function ciwlCar(v?: ParamValues): MeshBuilder { return buildCoach(CIWL, P.ciwl, v); }
export function ciwlCarLod(v?: ParamValues): MeshBuilder { return buildCoachLod(CIWL, P.ciwl, v); }
export function dbIcCoach(v?: ParamValues): MeshBuilder { return buildCoach(DB_IC, P.dbIc, v); }
export function dbIcCoachLod(v?: ParamValues): MeshBuilder { return buildCoachLod(DB_IC, P.dbIc, v); }

export const WORLD_COACHES: ProceduralDesign[] = [
  coachDesign("proc-vehicle-db-ic-coach", "DB Intercity coach", DB_IC, P.dbIc, dbIcCoach, dbIcCoachLod, "db-ic-coach"),
  coachDesign("proc-vehicle-sncf-corail-coach", "SNCF Corail coach", SNCF_CORAIL, P.corail, sncfCorail, sncfCorailLod, "sncf-corail-coach"),
  coachDesign("proc-vehicle-sncf-grand-confort", "SNCF Grand Confort", SNCF_GRAND_CONFORT, P.grandConfort, sncfGrandConfort, sncfGrandConfortLod, "sncf-grand-confort"),
  coachDesign("proc-vehicle-ns-icr-coach", "NS ICR coach", NS_ICR, P.nsIcr, nsIcr, nsIcrLod, "ns-icr-coach"),
  coachDesign("proc-vehicle-sbb-ew4-coach", "SBB EW IV coach", SBB_EW4, P.ew4, sbbEw4, sbbEw4Lod, "sbb-ew4-coach"),
  coachDesign("proc-vehicle-sbb-ic2000", "SBB IC 2000 coach", SBB_IC2000, P.ic2000, sbbIc2000, sbbIc2000Lod, "sbb-ic2000"),
  coachDesign("proc-vehicle-glacier-express", "Glacier Express coach", GLACIER, P.glacier, glacierExpress, glacierExpressLod, "glacier-express"),
  coachDesign("proc-vehicle-br-mk1-coach", "BR Mk1 coach", BR_MK1, P.mk1, brMk1, brMk1Lod, "br-mk1-coach", "uk"),
  coachDesign("proc-vehicle-ir-lhb-coach", "IR LHB coach", IR_LHB, P.lhb, irLhbCoach, irLhbCoachLod, "ir-lhb-coach", "us"),
  coachDesign("proc-vehicle-ir-icf-coach", "IR ICF coach", IR_ICF, P.icf, irIcfCoach, irIcfCoachLod, "ir-icf-coach", "us"),
  coachDesign("proc-vehicle-cr-25t-coach", "CR 25-series coach", CR_25, P.cr25, cr25Coach, cr25CoachLod, "cr-25t-coach", "us"),
  coachDesign("proc-vehicle-ciwl-car", "Wagons-Lits car", CIWL, P.ciwl, ciwlCar, ciwlCarLod, "ciwl-car"),
];
