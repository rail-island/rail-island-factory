// The DB Intercity coaches on the coach kit (worldCoaches.ts): the Avmz 111 first-class
// side-corridor compartment coach and the Bpmz 291 second-class open coach, UIC types X/Z,
// 26.4 m over the buffers, each side laid out from photographs (assets/db-ic-coach/SOURCES.md,
// docs/models/germany-trains.md).
//
// Measured (1-D projective fits over each photograph's equal window pitch, scaled to the
// 19.0 m bogie centres and the 25.1 m body):
// - Avmz compartment side (AKE 56 80 19-94 011-9, TEE): the end door, a frosted toilet window
//   0.75 m wide, the class numeral, then nine compartment windows 1.4 m wide (published) on a
//   2.3 m pitch (compartments 2.322 m, published); the toilet window and door again.
// - Avmz corridor side (HKX Avmz, Harburg): the end door, a clear vestibule window 0.8 m wide
//   (published: 800 mm), then nine 1.4 m windows on a 2.2 m pitch, every window with its
//   fold-down top light.
// - Bpmz (Stralsund and Berlin): a swing-plug door with a wide window, a frosted toilet window
//   0.8 m, the class numeral over the DB logo, a narrow 0.82 m window, nine 1.42 m windows on a
//   1.81 m pitch, a narrow window, the toilet window and the door.
// - Heights (the TEE photograph, 75 px/m): window frames 2.05-2.97 m, the belly's colour edge
//   1.98 m, a thin beige line 1.23-1.31 m over the dark skirt, the skirt between the bogies down
//   to 0.5 m, the eaves 3.21 m, the crown 4.05 m; Intercity's red band 1.55-1.77 m (Stralsund).

import type { WorldCoach } from "./worldCoaches.ts";
import type { CarDef } from "./usTransit.ts";
import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import { paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { sideLettering, sidePanel, type SliceBody } from "./sliceBody.ts";
import { lodSideBox, type LodPart } from "./lodKit.ts";

const c = (hex: string, r = 0.45): MaterialSpec => paint(hex, r);

/** Body length between the end walls (26.4 m over the buffers, the coupling planes 0.65 m beyond them). */
const L = 26.4 - 2 * 0.65;
/** The bogie centres 19.0 m apart, d of the first from the +X end; the skirt runs between the bogies. */
const BOGIE = L / 2 - 19.0 / 2;
const REACH = 1.25 + 0.475 + 0.25;
const SKIRT: readonly [number, number] = [BOGIE + REACH, L - BOGIE - REACH];
/** The window row's sill and head (frames), and the fold-down top light's bar below the head. */
const ROW: readonly [number, number] = [2.05, 2.97];
const VENT = 0.24;
/** The beige line's bottom over the dark solebar, the solebar's bottom (the body's foot over the bogies) and the skirt's bottom between the bogies. */
const FOOT = 1.23;
const SOLE = 1.0;
const SKIRT_BOTTOM = 0.5;

const mirror = ([a, b]: readonly [number, number]): [number, number] => [L - b, L - a];
const both = (spans: ReadonlyArray<readonly [number, number]>): Array<readonly [number, number]> => [...spans, ...spans.map(mirror)].sort((p, q) => p[0] - q[0]);
const pitched = (from: number, n: number, pitch: number, w: number): Array<[number, number]> => Array.from({ length: n }, (_, i) => [from + i * pitch, from + i * pitch + w]);

interface Side {
  /** The main window row; the windows by the doors (frosted: a toilet); which windows carry the fold-down top light. */
  main: Array<readonly [number, number]>;
  end: readonly [number, number];
  frosted: boolean;
  vents: "all" | "ends";
  /** The class numeral's d on this side where it differs from the unit's (the corridor side's, between the door and the vestibule window). */
  classAt?: number;
}

interface Unit {
  door: readonly [number, number];
  /** The door leaf's window: sill and head, width, how far toward the car's middle off the leaf's centre, corner radius. */
  doorGlass: { y: readonly [number, number]; w: number; inward: number; r: number };
  /** +Z side and -Z side. */
  sides: readonly [Side, Side];
  /** The class numeral's d (both ends). */
  classAt: number;
  /** The narrow windows next to the main row (the Bpmz's first and last). */
  narrow?: readonly [number, number];
}

// the Avmz: nine 1.4 m windows; compartments on the +Z side, the corridor on the -Z side
const AVMZ_COMP = (L - (8 * 2.3 + 1.4)) / 2;
const AVMZ_CORR = (L - (8 * 2.2 + 1.4)) / 2;
// the Bpmz: nine 1.42 m windows on 1.81 m between narrow 0.82 m ones
const BPMZ_MAIN = (L - (8 * 1.81 + 1.42)) / 2;

const UNITS: Record<string, Unit> = {
  avmz: {
    door: [0.3, 1.15],
    doorGlass: { y: [2.02, 2.94], w: 0.3, inward: 0.17, r: 0.12 },
    sides: [
      { main: pitched(AVMZ_COMP, 9, 2.3, 1.4), end: [1.3, 2.05], frosted: true, vents: "all" },
      { main: pitched(AVMZ_CORR, 9, 2.2, 1.4), end: [1.6, 2.4], frosted: false, vents: "all", classAt: 1.375 },
    ],
    classAt: 2.36,
  },
  bpmz: {
    door: [0.4, 1.38],
    doorGlass: { y: [2.0, 2.84], w: 0.56, inward: 0.12, r: 0.1 },
    sides: [
      { main: pitched(BPMZ_MAIN, 9, 1.81, 1.42), end: [1.6, 2.4], frosted: true, vents: "ends" },
      { main: pitched(BPMZ_MAIN, 9, 1.81, 1.42), end: [1.6, 2.4], frosted: true, vents: "ends" },
    ],
    classAt: 2.86,
    narrow: [3.4, 4.22],
  },
};

/** The Intercity livery's DB logo in the red band's gap at each end, d of its centre. */
const LOGO_D = 2.92;
const LOGO_GAP: readonly [number, number] = [LOGO_D - 0.3, LOGO_D + 0.3];
const IC_BAND: readonly [number, number] = [1.55, 1.77];

/** A livery's own furniture: whether it is Intercity (the red band's logo gaps), its lettering's paint. */
const isIntercity = (c0: CarDef) => c0.bands.some(([, , mt]) => mt === "icRed");

function icLayout(c0: CarDef, unit: string): CarDef {
  const u = UNITS[unit]!;
  const ic = isIntercity(c0);
  const doors = both([u.door]);
  // per side: the main row, the windows by the doors (frosted where they light a toilet), the narrow windows beside the main row
  const rows: CarDef["windows"][number][] = u.sides.flatMap((sd, i): CarDef["windows"][number][] => {
    const s = i === 0 ? 1 : -1;
    const row = (spans: ReadonlyArray<readonly [number, number]>, glass?: string): CarDef["windows"][number] => ({ y: ROW, spans: both(spans), frame: "frameSilver", onSide: s, cornerR: 0.12, ...(glass ? { glass } : {}) });
    return [row(sd.main), ...(sd.frosted ? [row([sd.end], "frosted"), ...(u.narrow ? [row([u.narrow])] : [])] : [row([sd.end, ...(u.narrow ? [u.narrow] : [])])])];
  });
  const number = c0.lettering?.[0];
  const numberMat = ic ? "lettering" : "letterW";
  return {
    ...c0,
    spec: { ...c0.spec, B: SKIRT_BOTTOM, cuts: [[0, SKIRT[0]], [SKIRT[1], L]], cutRadius: 0.2 },
    windows: rows,
    doors: { spans: doors, y: [FOOT + 0.01, 3.05], glass: u.doorGlass.y, glassW: u.doorGlass.w, glassCornerR: u.doorGlass.r, glassInward: u.doorGlass.inward },
    ...(ic ? { strips: [LOGO_GAP, mirror(LOGO_GAP)].map((d) => ({ d, y: [IC_BAND[0] - 0.01, IC_BAND[1] + 0.01] as const, mat: "white" })) } : {}),
    diaphragm: null,
    lettering: number ? [{ ...number, d: ic ? 8.6 : L / 2 + 0.6, y: ic ? 1.36 : 1.5, h: 0.065, mat: numberMat }] : [],
    extras: (m, b, X) => {
      c0.extras?.(m, b, X);
      icExtras(m, b, X, u, ic, unit === "avmz" ? "1" : "2", c0.spec.W);
    },
  };
}

function icExtras(m: MeshBuilder, b: SliceBody, X: (d: number) => number, u: Unit, ic: boolean, cls: string, W: number): void {
  for (const s of [1, -1]) {
    const sd = u.sides[s > 0 ? 0 : 1]!;
    m.scope(s > 0 ? "right side" : "left side", () => {
      // the fold-down top lights' bars
      m.scope("top lights", () => {
        const spans = sd.vents === "all" ? [...both(sd.main), ...both([sd.end])] : both([sd.end, ...(u.narrow ? [u.narrow] : [])]);
        for (const [a, e] of spans) sidePanel(m, b, X, s, "frameSilver", a + 0.05, e - 0.05, ROW[1] - VENT - 0.018, ROW[1] - VENT + 0.018, 0.016, 0.004);
      });
      m.scope("class", () => {
        const ca = sd.classAt ?? u.classAt;
        for (const d of [ca, L - ca]) {
          if (ic) {
            // the numeral's frame: a thin grey outline
            for (const [d0, d1, y0, y1] of [[d - 0.13, d + 0.13, 2.3, 2.316], [d - 0.13, d + 0.13, 2.884, 2.9], [d - 0.13, d - 0.114, 2.316, 2.884], [d + 0.114, d + 0.13, 2.316, 2.884]] as const)
              sidePanel(m, b, X, s, "classFrame", d0, d1, y0, y1, 0.005, 0.002);
            sideLettering(m, b, X, s, cls, d, 2.56, 0.26, "lettering", 0.007);
          } else sideLettering(m, b, X, s, cls, d, 2.62, 0.2, "classNum", 0.006);
        }
      });
      m.scope("logo", () => {
        if (ic) {
          for (const d of [LOGO_D, L - LOGO_D]) {
            const [y0, y1] = [IC_BAND[0] - 0.03, IC_BAND[1] + 0.03];
            sidePanel(m, b, X, s, "white", d - 0.18, d + 0.18, y0, y1, 0.004, 0.002);
            for (const [d0, d1, ya, yb] of [[d - 0.17, d + 0.17, y0 + 0.01, y0 + 0.035], [d - 0.17, d + 0.17, y1 - 0.035, y1 - 0.01], [d - 0.17, d - 0.145, y0 + 0.035, y1 - 0.035], [d + 0.145, d + 0.17, y0 + 0.035, y1 - 0.035]] as const)
              sidePanel(m, b, X, s, "icRed", d0, d1, ya, yb, 0.007, 0.002);
            sideLettering(m, b, X, s, "DB", d, y0 + 0.06, 0.15, "icRed", 0.008);
          }
        } else {
          // the DB emblem on the belly over the running number: a white outlined square
          const d = L / 2 + 0.6, [y0, y1] = [1.62, 1.84];
          for (const [d0, d1, ya, yb] of [[d - 0.11, d + 0.11, y0, y0 + 0.018], [d - 0.11, d + 0.11, y1 - 0.018, y1], [d - 0.11, d - 0.092, y0 + 0.018, y1 - 0.018], [d + 0.092, d + 0.11, y0 + 0.018, y1 - 0.018]] as const)
            sidePanel(m, b, X, s, "letterW", d0, d1, ya, yb, 0.006, 0.002);
          sideLettering(m, b, X, s, "DB", d, y0 + 0.055, 0.11, "letterW", 0.007);
        }
      });
      // the entrance steps under each door: the well's back, two treads and the hangers
      m.scope("steps", () => {
        for (const [d0, d1] of both([u.door])) {
          const [x0, x1] = [X(d0 + 0.04), X(d1 - 0.04)].sort((p, q) => p - q) as [number, number];
          block(m, "under", x0 + 0.03, x1 - 0.03, 0.66, SOLE - 0.01, ...side(s, W - 0.36, W - 0.32));
          for (const y of [0.62, 0.86]) block(m, "stepGrey", x0 + 0.03, x1 - 0.03, y, y + 0.04, ...side(s, W - 0.31, W - 0.06));
          for (const x of [x0, x1 - 0.03]) block(m, "under", x, x + 0.03, 0.58, SOLE - 0.01, ...side(s, W - 0.33, W - 0.04));
        }
      });
    });
  }
}

/** The distant model: the body from its foot up, the skirt between the bogies as a box below it. */
function icLod(body: Parameters<NonNullable<WorldCoach["lod"]>>[0], c0: CarDef, X: (d: number) => number): ReturnType<NonNullable<WorldCoach["lod"]>> {
  const foot = 1.0;
  const lift = (rows: ReadonlyArray<readonly [number, number]>) => rows.filter(([y]) => y > foot + 1e-6);
  const tip = (t: ReadonlyArray<readonly [number, number]>) => [[foot, t[0]![1]] as const, ...lift(t)];
  const skirt = ((): LodPart => {
    const [x0, x1] = [Math.min(X(SKIRT[0]), X(SKIRT[1])), Math.max(X(SKIRT[0]), X(SKIRT[1]))];
    return { draw: (m) => m.scope("body", () => lodSideBox(m, c0.skirt, [[x0, SKIRT_BOTTOM], [x1, SKIRT_BOTTOM], [x1, foot], [x0, foot]], -c0.spec.wl, c0.spec.wl)) };
  })();
  return {
    body: {
      ...body, y0: foot, hw: [[foot, c0.spec.wa], ...lift(body.hw)],
      side: body.side.map(([a, e, mt]) => [Math.max(a, foot), e, mt] as const).filter(([a, e]) => e > a + 1e-6),
      front: { ...body.front, tip: tip(body.front.tip) }, rear: { ...body.rear, tip: tip(body.rear.tip) },
    },
    bogieTop: foot,
    parts: [skirt],
  };
}

const EXTRA: Record<string, MaterialSpec> = {
  frosted: { color: "#c9d3d6", metallic: 0.1, roughness: 0.35 }, stepGrey: c("#6e7174", 0.7), classFrame: c("#8a8e91", 0.5),
};

export const DB_IC: WorldCoach = {
  length: 26.4, W: 1.41, Y: 1.4, S: 3.21, C: 4.05, B: 1.0, A: SOLE, rows: [ROW], doorIn: 0.3, doorW: 0.85, door: [FOOT + 0.01, 3.05],
  bogieCentres: 19.0, wheelR: 0.475, wheelbase: 2.5, coupler: "buffers", maxspeed: 200,
  types: {
    avmz: { title: "First class", windows: 9, windowW: 1.4, number: "61 80 19-91 508-0", weight: 47, first: true },
    bpmz: { title: "Second class", windows: 11, windowW: 1.42, number: "61 80 22-91 101-9", weight: 45 },
  },
  liveries: {
    // TEE (as the AKE's preserved Avmz): beige from the belly to the eaves, purple red (RAL 3004) below, a beige line over the black-grey skirt, white-aluminium roof
    tee: {
      title: "TEE", palette: { ...EXTRA, red: c("#74202f"), beige: c("#d4c19a"), roofG: c("#b2b5b5", 0.55), skirtG: c("#2f3234", 0.8), classNum: c("#b8582a") },
      bands: [[0, FOOT, "skirtG"], [FOOT, 1.31, "beige"], [1.31, 1.98, "red"], [1.98, 9, "beige"]], roof: "roofG", skirt: "skirtG",
    },
    // ocean blue (RAL 5020) and ivory (RAL 1014), the 1970s Intercity (Jenbach 1979)
    oceanBlue: {
      title: "Ocean blue", palette: { ...EXTRA, blue: c("#1f4a63"), beige: c("#e1d2a8"), roofG: c("#7f8792", 0.65), skirtG: c("#1b3d52", 0.7), classNum: c("#2a2c30") },
      bands: [[0, 1.98, "blue"], [1.98, 9, "beige"]], roof: "roofG", skirt: "skirtG",
    },
    // since 2001: light grey (RAL 7035) with the traffic-red band (RAL 3020) under the windows, grey door feet, a grey skirt and roof
    intercity: {
      title: "Intercity", palette: { ...EXTRA, white: c("#e4e6e4", 0.35), icRed: c("#d8121c"), lowGrey: c("#8f9395", 0.55), roofG: c("#8c9093", 0.6), skirtG: c("#6c7174", 0.7) },
      bands: [[0, FOOT, "skirtG"], [FOOT, IC_BAND[0], "white"], [IC_BAND[0], IC_BAND[1], "icRed"], [IC_BAND[1], 9, "white"]], roof: "roofG", skirt: "skirtG",
      doorBands: [[0, IC_BAND[0], "lowGrey"], [IC_BAND[0], IC_BAND[1], "icRed"], [IC_BAND[1], 9, "white"]],
    },
  },
  details: {
    wl: 1.36, wa: 1.38,
    // the roof's rounded ends over the gangways and the end walls' rounded corners
    roofEnd: [[0, 3.62], [0.08, 3.8], [0.2, 3.9], [0.38, 3.97], [0.6, 4.02], [0.85, 4.05]], endCorner: { len: 0.12, tip: 0.93 },
    rubberGangway: true,
    underfloor: { y0: 0.9, half: 1.0 },
  },
  layout: (c0, unit) => icLayout(c0, unit),
  lod: (body, c0, X) => icLod(body, c0, X),
};

