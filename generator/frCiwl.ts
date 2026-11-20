// The Compagnie Internationale des Wagons-Lits' steel cars of 1926-29 (the "voitures bleues"): the
// Pullman saloon car of the Fleche d'Or / Cote d'Azur series (4001-4200) and the sleeping car, both
// 23.45 m over the buffers, on the coach kit's car builder (usTransit.ts drawCar) with the car's own
// layout, laid out from photographs (assets/ciwl-car/SOURCES.md, docs/models/france-trains.md).
//
// Measured (1-D projective fits along the body, scaled to the 22.2 m body between the end walls):
// - Dining car 3348 (Mulhouse, nearly side-on; the same 1920s steel body and running gear): the
//   bogie centres 3.26 m in from the end walls (15.7 m apart), wheelbase 2.5 - 2.8 m (2.6 m drawn),
//   1.0 m wheels. Heights at about 75 px/m at its vestibule end: the body's foot 1.1 m, a gold line
//   at 1.2 m, sills 2.39 m with the gold waist band under them, heads 3.40 m, the blue letterboard
//   with the gold lettering to the eaves (3.62 m), the high elliptical roof about 0.7 m over them.
// - Pullman 4141 (VSOE, Dresden; three-quarter view, fitted on the bogies and the end wall): at each
//   end a blue vestibule 2.0 m long with the entrance door 0.9 - 1.57 m from the end wall (its tall
//   window with round ends, a brass kick plate, grab rails, steps), then the cream panel with the
//   oval toilet window (0.5 x 0.9 m) 3.1 m from the end, and seven saloon windows 1.3 m wide on a
//   2.2 m pitch (fits 1.22 - 1.36 m, pitch 2.1 - 2.25 m), each with a top light 0.3 m deep under
//   the head (three lights: 4018 at Mulhouse). Sills 2.25 m, heads 3.33 m; the cream from the gold
//   waist line to 3.37 m, blue above and below, a thin gold line 0.1 m under the waist and one along
//   the foot; the crest on the lower panel under the third window; "PULLMANWAGEN" and the number at
//   the end of the lower panel. The lettering COMPAGNIE INTERNATIONALE DES WAGONS-LITS ET DES GRANDS
//   EXPRESS EUROPEENS in gold capitals spread over the letterboard.
// - Sleeping car 3552 (VSOE, Dresden) and a VSOE sleeping car at Paris-Est: all blue, sills 2.38 m
//   and heads 3.38 m (about 210 px/m on the 3552), the gold waist band right under the sills and a
//   thin gold line 0.2 m below it; the compartment side's wide windows (1.1 m, one a compartment,
//   ten on a 1.7 m pitch; drawn 1.25 m) with a narrow frosted toilet window by each vestibule; the corridor side's
//   windows (1.1 m, the two by one end 1.25 m) on the same pitch with two blank panels (the Paris photograph).
// - Liveries: `pullman` the Pullman cars' cream and blue (4018, 4141); `ciwlBlue` the CIWL royal
//   blue all over with the gold lining (3348, 3552, the Pullman 4164 repainted blue).

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE } from "./carbodyKit.ts";
import { sideDecal, sideLettering, sidePanel, surfacePoint, type SliceBody } from "./sliceBody.ts";
import type { Pt } from "./sliceLoft.ts";
import { carLodBody, drawCar, truckSpec, type CarDef } from "./usTransit.ts";
import { bogieParts, fitUnit } from "./lodUnits.ts";
import { windowBands } from "./lodKit.ts";
import type { CoachLivery, WorldCoach } from "./worldCoaches.ts";

type Band = readonly [number, number, string];
const c = (hex: string, r = 0.45): MaterialSpec => paint(hex, r);

/** The body between the end walls; the buffer faces 0.625 m beyond each. */
const L = 22.2;
const GAP = (23.45 - L) / 2;
const X = (d: number) => L / 2 - d;
const mirror = ([a, b]: readonly [number, number]): readonly [number, number] => [L - b, L - a];
const both = (spans: ReadonlyArray<readonly [number, number]>): Array<readonly [number, number]> => [...spans, ...spans.map(mirror)].sort((p, q) => p[0] - q[0]);

/** Heights: the body's foot, the gold foot line, the eaves; the letterboard from LETTER to the eaves. */
const FOOT = 1.1, FOOT_LINE = [1.2, 1.222] as const, EAVES = 3.62, CROWN = 4.32;
const LETTER = 3.37;
/** The blue vestibule at each end; the entrance doors in it. */
const VESTIBULE = 2.0;

interface Unit {
  /** Sill and head of the side windows. */
  row: readonly [number, number];
  /** The main windows on the +Z side and the -Z side (d spans). */
  right: ReadonlyArray<readonly [number, number]>;
  left: ReadonlyArray<readonly [number, number]>;
  /** Small windows by the vestibules: oval portholes (Pullman) or frosted toilet windows (sleeping car), on both sides or one. */
  small: { spans: ReadonlyArray<readonly [number, number]>; y: readonly [number, number]; oval: boolean; onSide?: number };
  door: readonly [number, number];
  doorY: readonly [number, number];
  doorGlass: { y: readonly [number, number]; w: number; r: number };
  /** The top light's depth under the heads (Pullman saloon windows). */
  topLight?: number;
  /** The car's name on the lower panel (+Z side, -Z side); the crest and the route board, m from the end on the viewer's left. */
  names: readonly [string, string];
  crest: number;
  board: number;
  /** Roof ventilators along each side of the roof. */
  vents: number[];
}

const PULLMAN_PITCH = 2.2, PULLMAN_W = 1.3;
const pullmanRow = Array.from({ length: 7 }, (_, i): readonly [number, number] => { const m = L / 2 + (i - 3) * PULLMAN_PITCH; return [m - PULLMAN_W / 2, m + PULLMAN_W / 2]; });
const SLEEPER_PITCH = 1.7, SLEEPER_FROM = 2.6 + SLEEPER_PITCH / 2;
const sleeperAt = (i: number, w: number): readonly [number, number] => { const m = SLEEPER_FROM + i * SLEEPER_PITCH; return [m - w / 2, m + w / 2]; };
/** The corridor side: blank panels where the Paris photograph shows them (counted from the -X end). */
const CORRIDOR_BLANK = new Set([7, 5]);

const UNITS: Record<string, Unit> = {
  pullman: {
    row: [2.25, 3.33], right: pullmanRow, left: pullmanRow,
    small: { spans: both([[2.85, 3.35]]), y: [2.32, 3.24], oval: true },
    door: [0.9, 1.57], doorY: [1.14, 3.42], doorGlass: { y: [1.78, 3.26], w: 0.28, r: 0.14 }, topLight: 0.3,
    names: ["VOITURE-SALON", "PULLMANWAGEN"], crest: 9.0, board: 14.5, vents: [4.0, 7.3, 11.1, 14.9, 18.2],
  },
  sleeping: {
    row: [2.36, 3.36],
    right: Array.from({ length: 10 }, (_, i) => sleeperAt(i, 1.25)),
    left: Array.from({ length: 10 }, (_, i) => i).filter((i) => !CORRIDOR_BLANK.has(i)).map((i) => sleeperAt(i, i >= 8 ? 1.25 : 1.1)),
    small: { spans: both([[1.95, 2.45]]), y: [2.62, 3.38], oval: false, onSide: 1 },
    door: [0.35, 1.0], doorY: [1.14, 3.42], doorGlass: { y: [2.42, 3.22], w: 0.42, r: 0.06 },
    names: ["VOITURE-LITS", "SCHLAFWAGEN"], crest: L / 2, board: 5.5, vents: Array.from({ length: 10 }, (_, i) => SLEEPER_FROM + i * SLEEPER_PITCH),
  },
};

/** The paint of a livery: the window panel's colour; the gold lines under the waist (m under the sill). */
interface Paint { upper: string; thinLine: number; letterLine: boolean }
const PAINTS: Record<string, Paint> = {
  pullman: { upper: "cream", thinLine: 0.1, letterLine: false },
  ciwlBlue: { upper: "blue", thinLine: 0.2, letterLine: true },
};

const BLUE = c("#1b2753", 0.35), GOLD = c("#c7a14e", 0.3), CREAM = c("#ece2c6", 0.4), ROOF = c("#dcdcd5", 0.55), UNDER = c("#1e1f21", 0.85);

/** The side's bands for a type of car (its sill) in a livery. */
function bandsOf(u: Unit, p: Paint): Band[] {
  const sill = u.row[0];
  const waist = [sill - 0.05, sill - 0.015] as const, thin = [waist[0] - p.thinLine - 0.012, waist[0] - p.thinLine] as const;
  const out: Band[] = [[0, FOOT_LINE[0], "blue"], [FOOT_LINE[0], FOOT_LINE[1], "gold"], [FOOT_LINE[1], thin[0], "blue"], [thin[0], thin[1], "gold"], [thin[1], waist[0], "blue"], [waist[0], waist[1], "gold"]];
  if (p.letterLine) out.push([waist[1], LETTER - 0.012, p.upper], [LETTER - 0.012, LETTER, "gold"], [LETTER, 9, "blue"]);
  else out.push([waist[1], LETTER, p.upper], [LETTER, 9, "blue"]);
  return out;
}

export const CIWL: WorldCoach = {
  length: 23.45, W: 1.43, Y: 1.2, S: EAVES, C: CROWN, B: FOOT, A: 1.15, rows: [UNITS.pullman!.row], doorIn: 0.9, doorW: 0.67, door: [1.14, 3.42],
  bogieCentres: 15.7, wheelR: 0.5, wheelbase: 2.6, coupler: "buffers", gap: GAP, maxspeed: 140,
  types: {
    pullman: { title: "Pullman car", windows: 7, windowW: PULLMAN_W, number: "4141", weight: 52 },
    sleeping: { title: "Sleeping car", windows: 10, windowW: 1.25, number: "3552", weight: 56 },
  },
  liveries: {
    pullman: { title: "Pullman", palette: { blue: BLUE, cream: CREAM, gold: GOLD, roofG: ROOF, skirtG: BLUE }, bands: bandsOf(UNITS.pullman!, PAINTS.pullman!), roof: "roofG", skirt: "skirtG" },
    ciwlBlue: { title: "CIWL blue", palette: { blue: BLUE, gold: GOLD, roofG: ROOF, skirtG: BLUE }, bands: bandsOf(UNITS.pullman!, PAINTS.ciwlBlue!), roof: "roofG", skirt: "skirtG" },
  },
};

const PALETTE: Record<string, MaterialSpec> = {
  ...INTERIOR_PALETTE, ...CARBODY_PALETTE,
  under: UNDER, brass: { color: "#c9a24a", metallic: 0.8, roughness: 0.3 }, frost: c("#aeb6b8", 0.3), plaque: c("#f2f0e8", 0.4), plaqueText: c("#20242c", 0.6),
  steps: c("#2a2b2d", 0.8), underBox: c("#26272a", 0.8), endDoor: c("#1b2753", 0.4), lampRed: c("#a81818", 0.4), vent: c("#c9c9c2", 0.5),
};

const BOGIES = [L / 2 - 15.7 / 2, L / 2 + 15.7 / 2];

function ciwlDef(unit: string, key: string, l: CoachLivery, lod: boolean): CarDef {
  const s = CIWL, u = UNITS[unit]!, p = PAINTS[key]!;
  const reach = s.wheelbase / 2 + s.wheelR + 0.25;
  // the high elliptical roof rolls down over the end walls in a hood
  const hood = { len: 0.05, tip: 0.98, power: 2, C: [[0, 3.82], [0.1, 4.04], [0.25, 4.18], [0.45, 4.27], [0.7, 4.31], [0.9, CROWN]] as Pt[], S: [] as Pt[] };
  const bands = bandsOf(u, p);
  const endBands: Band[] = [[0, 9, "blue"]];
  const small = u.small;
  return {
    spec: {
      length: L, W: s.W, Y: s.Y, S: s.S, C: s.C, lean: 0.985, arc: 8, B: s.B, wl: s.W * 0.97, A: s.A, wa: s.W * 0.995, edges: [], step: 1.0,
      cuts: BOGIES.map((d) => [d - reach, d + reach] as const), front: hood, rear: hood,
    },
    bands, roof: l.roof, skirt: l.skirt, under: "under",
    ends: { d: VESTIBULE, bands: endBands, cap: "blue" },
    doorBands: [[0, u.doorY[0] + 0.17, "brass"], [u.doorY[0] + 0.17, 9, "blue"]],
    windows: [
      { y: u.row, spans: u.right, frame: "brass", cornerR: 0.07, onSide: 1 },
      { y: u.row, spans: u.left, frame: "brass", cornerR: 0.07, onSide: -1 },
      small.oval
        ? { y: small.y, spans: small.spans, frame: "brass", cornerR: (small.spans[0]![1] - small.spans[0]![0]) / 2, glass: "frost" }
        : { y: small.y, spans: small.spans, frame: "brass", cornerR: 0.05, glass: "frost", ...(small.onSide ? { onSide: small.onSide } : {}) },
    ],
    doors: { spans: [u.door, mirror(u.door)], y: u.doorY, glass: u.doorGlass.y, glassW: u.doorGlass.w, glassCornerR: u.doorGlass.r },
    cabEnds: [], diaphragm: null,
    trucks: BOGIES, truck: truckSpec(s.wheelbase, s.wheelR, s.B),
    coupler: "buffers", couplerY: 1.06, gap: [GAP, GAP],
    lettering: [],
    extras: (m, b, Xb) => { if (!lod) ciwlExtras(m, b, Xb, u, s.types[unit]!.number); },
  };
}

/** An elliptic ring (half axes a, b outside, a - k, b - k inside) as triangles, over the angles t0..t1. */
function ellipseRing(d: number, y: number, a: number, b: number, k: number, t0 = 0, t1 = Math.PI * 2, n = 18): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = t0 + ((t1 - t0) * i) / n, q = t0 + ((t1 - t0) * (i + 1)) / n;
    const o = (t: number): Pt => [d + a * Math.cos(t), y + b * Math.sin(t)], j = (t: number): Pt => [d + (a - k) * Math.cos(t), y + (b - k) * Math.sin(t)];
    out.push(o(p), o(q), j(q), o(p), j(q), j(p));
  }
  return out;
}

const rect = (d0: number, d1: number, y0: number, y1: number): Pt[] => [[d0, y0], [d1, y0], [d1, y1], [d0, y0], [d1, y1], [d0, y1]];

/** The gold crest: the garter ring with its lettering suggested by a second ring, the lions and monogram, the laurel and the ribbon. */
function crest(d: number, y: number, h: number): Pt[] {
  const a = h * 0.42, b = h * 0.4;
  const out: Pt[] = [];
  out.push(...ellipseRing(d, y + h * 0.05, a, b, h * 0.09, -0.15 * Math.PI, 1.15 * Math.PI, 14));
  // the lions rampant and the monogram between them
  for (const e of [-1, 1]) out.push(...rect(d + e * h * 0.08, d + e * h * 0.2, y - h * 0.05, y + h * 0.17), ...rect(d + e * h * 0.12, d + e * h * 0.24, y + h * 0.13, y + h * 0.22));
  out.push(...rect(d - h * 0.05, d + h * 0.05, y - h * 0.08, y + h * 0.15), ...rect(d - h * 0.22, d + h * 0.22, y - h * 0.11, y - h * 0.07));
  // the laurel branches rising either side and the knotted ribbon at the foot
  for (const e of [-1, 1]) out.push(...ellipseRing(d, y + h * 0.02, a + h * 0.14, b + h * 0.06, h * 0.07, e > 0 ? -0.45 * Math.PI : 1.05 * Math.PI, e > 0 ? -0.05 * Math.PI : 1.45 * Math.PI, 5));
  out.push(...rect(d - h * 0.38, d + h * 0.38, y - h * 0.44, y - h * 0.36), ...rect(d - h * 0.07, d + h * 0.07, y - h * 0.48, y - h * 0.3));
  return out;
}

const WORDS = ["COMPAGNIE", "INTERNATIONALE", "DES", "WAGONS-LITS", "ET", "DES", "GRANDS", "EXPRESS", "EUROPEENS"];

function ciwlExtras(m: MeshBuilder, b: SliceBody, Xb: (d: number) => number, u: Unit, number: string): void {
  const s = CIWL;
  // the lettering spread over the letterboard from the first window to the last, each word its share of the length
  m.scope("letterboard", () => {
    const h = 0.18, y = LETTER + (EAVES - LETTER - h) / 2 - 0.005;
    const w = h * 0.58 + h * 0.18;
    const len = WORDS.map((t) => t.length * w);
    const [d0, d1] = [2.8, L - 2.8];
    const gap = (d1 - d0 - len.reduce((a, q) => a + q, 0)) / (WORDS.length - 1);
    for (const sd of [1, -1]) {
      // read from the viewer's left: the -X end on the +Z side
      let at = 0;
      WORDS.forEach((t, i) => {
        const centre = at + len[i]! / 2;
        at += len[i]! + gap;
        sideLettering(m, b, Xb, sd, t, sd > 0 ? d1 - centre : d0 + centre, y, h, "gold", 0.006, h * 0.16);
      });
    }
  });
  // the gold lines boxing the window panel and the lower panel at the vestibules
  m.scope("panel lines", () => {
    for (const sd of [1, -1])
      for (const d of [VESTIBULE + 0.06, L - VESTIBULE - 0.072]) sideDecal(m, b, Xb, sd, "gold", rect(d, d + 0.012, FOOT_LINE[1], LETTER - 0.02), 0.004);
  });
  // the car's name and number at the end of the lower panel, the crest, the route board
  m.scope("lower panel", () => {
    const yName = u.row[0] - 0.55;
    for (const sd of [1, -1]) {
      const end = sd > 0 ? VESTIBULE + 0.35 : L - VESTIBULE - 0.35;
      const dir = sd > 0 ? 1 : -1;
      const name = u.names[sd > 0 ? 0 : 1];
      const hn = 0.13, wn = name.length * hn * 0.76;
      sideLettering(m, b, Xb, sd, name, end + dir * (wn / 2), yName, hn, "gold", 0.006, hn * 0.17);
      const no = `No ${number}`, wno = no.length * hn * 0.76;
      sideLettering(m, b, Xb, sd, no, end + dir * (wno / 2), yName - 0.34, hn, "gold", 0.006, hn * 0.17);
      // seen from the +Z side the viewer's left is the -X end (d = L)
      const fromLeft = (k: number) => (sd > 0 ? L - k : k);
      sideDecal(m, b, Xb, sd, "gold", crest(fromLeft(u.crest), (FOOT_LINE[1] + u.row[0] - 0.15) / 2 + 0.03, 0.56), 0.006);
      // the enamel route board
      const bd = fromLeft(u.board);
      sidePanel(m, b, Xb, sd, "plaque", bd - 0.6, bd + 0.6, yName - 0.08, yName + 0.12, 0.012, 0.004);
      sideLettering(m, b, Xb, sd, u.topLight ? "PARIS - NICE" : "SIMPLON-ORIENT-EXPRESS", bd, yName - 0.015, 0.07, "plaqueText", 0.014);
    }
  });
  // the Pullman windows' top lights: a transom 0.3 m under the head and two glazing bars over it
  const tl = u.topLight;
  if (tl)
    m.scope("top lights", () => {
      for (const sd of [1, -1])
        for (const [a, e] of sd > 0 ? u.right : u.left) {
          const y = u.row[1] - tl;
          sideDecal(m, b, Xb, sd, "brass", rect(a + 0.04, e - 0.04, y - 0.02, y + 0.02), 0.016);
          for (const k of [1, 2]) {
            const d = a + ((e - a) * k) / 3;
            sideDecal(m, b, Xb, sd, "brass", rect(d - 0.015, d + 0.015, y + 0.02, u.row[1] - 0.04), 0.016);
          }
        }
    });
  // the Pullman's oval toilet windows: the brass star of the leaded glazing
  if (u.small.oval)
    m.scope("porthole glazing", () => {
      for (const sd of [1, -1])
        for (const [a, e] of u.small.spans) {
          const d = (a + e) / 2, y = (u.small.y[0] + u.small.y[1]) / 2, hw = (e - a) / 2 - 0.04, hh = (u.small.y[1] - u.small.y[0]) / 2 - 0.04;
          const tris: Pt[] = [];
          for (const [dx, dy] of [[hw, 0], [-hw, 0], [0, hh], [0, -hh]] as const) {
            const k = 0.025;
            const nx = dy === 0 ? 0 : k, ny = dx === 0 ? 0 : k;
            tris.push([d + nx, y + ny], [d - nx, y - ny], [d + dx, y + dy]);
          }
          tris.push(...ellipseRing(d, y, hw * 0.32, hh * 0.22, 0.02, 0, Math.PI * 2, 10));
          sideDecal(m, b, Xb, sd, "brass", tris, 0.016);
        }
    });
  // the brass grab rails beside each door
  m.scope("grab rails", () => {
    for (const door of [u.door, mirror(u.door)])
      for (const sd of [1, -1])
        for (const d of [door[0] - 0.06, door[1] + 0.06]) {
          const x = Xb(d);
          block(m, "brass", x - 0.014, x + 0.014, 1.5, 2.9, ...side(sd, s.W + 0.03, s.W + 0.055));
          for (const y of [1.52, 2.88]) block(m, "brass", x - 0.012, x + 0.012, y - 0.014, y + 0.014, ...side(sd, s.W - 0.01, s.W + 0.035));
        }
  });
  // the door leaves down to the body's foot, the steps hanging under them
  m.scope("steps", () => {
    for (const door of [u.door, mirror(u.door)])
      for (const sd of [1, -1]) {
        const [a, cc] = [Xb(door[0] - 0.02), Xb(door[1] + 0.02)].sort((q, r) => q - r) as [number, number];
        for (const x of [a, cc - 0.04]) block(m, "steps", x, x + 0.04, 0.38, FOOT + 0.02, ...side(sd, 1.25, 1.42));
        for (const y of [0.4, 0.74]) block(m, "steps", a + 0.04, cc - 0.04, y, y + 0.035, ...side(sd, 1.12, 1.42));
      }
  });
  // the torpedo ventilators along both sides of the roof
  m.scope("roof vents", () => {
    for (const d of u.vents)
      for (const sd of [1, -1]) {
        const q = surfacePoint(b, d, CROWN - 0.12, sd);
        const x = Xb(d), z = sd * q.p[0] * 0.92;
        m.prism("vent", ngon(8, 0.09, Math.PI / 8, x, z), CROWN - 0.16, CROWN + 0.04);
        m.prism("vent", ngon(8, 0.13, Math.PI / 8, x, z), CROWN + 0.04, CROWN + 0.1);
      }
  });
  // the gangway at each end: bellows round the end door, the tail lamp brackets
  for (const e of [1, -1])
    m.scope(e > 0 ? "front gangway" : "rear gangway", () => {
      const wall = Xb(e > 0 ? 0 : L);
      const [a, cc] = [wall - e * 0.05, wall + e * (GAP - 0.1)].sort((q, r) => q - r) as [number, number];
      for (const sd of [1, -1]) block(m, "bellows", a, cc, 1.25, 3.3, ...side(sd, 0.42, 0.56));
      block(m, "bellows", a, cc, 3.18, 3.36, -0.43, 0.43);
      block(m, "bellows", a, cc, 1.25, 1.36, -0.43, 0.43);
      const [f0, f1] = [wall - e * 0.05, wall + e * 0.006].sort((q, r) => q - r) as [number, number];
      block(m, "endDoor", f0, f1, 1.37, 3.17, -0.41, 0.41);
      const [g0, g1] = [wall + e * 0.008, wall + e * 0.012].sort((q, r) => q - r) as [number, number];
      block(m, "glass", g0, g1, 2.3, 2.95, -0.2, 0.2);
      for (const sd of [1, -1]) {
        const [l0, l1] = [wall + e * 0.002, wall + e * 0.09].sort((q, r) => q - r) as [number, number];
        block(m, "lampRed", l0, l1, 1.55, 1.68, ...side(sd, 0.95, 1.08));
      }
    });
  // the underframe between the bogies: the battery and water boxes, the brake cylinder, the solebar
  m.scope("underframe", () => {
    for (const [a, cc, h] of [[-3.4, -1.4, 0.55], [-0.9, 1.6, 0.62], [2.2, 3.6, 0.45]] as const)
      block(m, "underBox", Xb(L / 2 + cc), Xb(L / 2 + a), FOOT - h, FOOT - 0.02, -0.95, 0.95);
    const xb = Xb(L / 2 - 4.6);
    m.sweep("under", "z", ngon(10, 0.2, 0, xb, FOOT - 0.3), -0.6, ngon(10, 0.2, 0, xb, FOOT - 0.3), 0.6);
    for (const sd of [1, -1]) block(m, "under", Xb(BOGIES[1]! - 2.0), Xb(BOGIES[0]! + 2.0), FOOT - 0.22, FOOT - 0.02, ...side(sd, 1.24, 1.32));
  });
}

function pick(params: readonly ParamSpec[], v: ParamValues | undefined, lod: boolean): { unit: string; key: string; l: CoachLivery; c: CarDef } {
  const p = resolveParams(params, v);
  const key = p.livery ?? Object.keys(CIWL.liveries)[0]!;
  const l = CIWL.liveries[key]!;
  return { unit: p.unit!, key, l, c: ciwlDef(p.unit!, key, l, lod) };
}

export function ciwlCoach(params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const { l, c: def } = pick(params, v, false);
  const m = new MeshBuilder({ ...PALETTE, ...l.palette });
  drawCar(m, def, X);
  return m;
}

/** The distant model: the body in three colour fields (the gold lines are too thin to see), the blue end walls, the windows as far as they fit, the bogies. */
export function ciwlCoachLod(params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const { unit, key, l, c: def } = pick(params, v, true);
  const u = UNITS[unit]!, p = PAINTS[key]!;
  const waist = u.row[0] - 0.03;
  const body = carLodBody({ ...def, windows: [], bands: [[0, waist, "blue"], [waist, LETTER, p.upper], [LETTER, 9, "blue"]] }, X);
  // the Pullman's saloon windows one by one, the sleeping car's compartments as one band; they give way before the colours, the outer ones first
  const rects = u.right.map(([a, e]) => ({ u: [Math.min(X(a), X(e)), Math.max(X(a), X(e))] as const, y: u.row }));
  const endPaint = body.side.map(([a, e, mt]) => [a, e, mt === l.roof ? mt : "blue"] as [number, number, string]);
  return fitUnit({
    palette: { ...CARBODY_PALETTE, under: PALETTE.under!, ...l.palette },
    bodies: [{
      ...body, front: { tip: [[CIWL.B, X(0)]], paint: endPaint }, rear: { tip: [[CIWL.B, X(L)]], paint: endPaint }, windows: windowBands(rects, unit === "pullman" ? 0.3 : 0.7).map((w, i, all) => ({ ...w, optional: 1 + Math.min(i, all.length - 1 - i) })),
    }],
    parts: [...bogieParts(def.trucks.map((d) => [X(d), def.truck.frameHalf] as const), def.spec.B)],
  }, 100);
}
