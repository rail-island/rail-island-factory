// The DB n-Wagen ("Silberling"): six vlakosimdb vehicles as one parametric design,
// `variant` bn (db_bnvr, db_bnvriv), abn (db_abnvr, db_abnvriv) and bdnrf (db_bdnrf,
// db_bdnrfiv, the driving trailer with the Karlsruher Kopf cab), `livery` vr
// (verkehrsrot with light grey stripes and doors) and iv (light grey with the
// mint turquoise window band). One XML body (assets/db-n-wagen/native/<key>/
// index.xml): the alongx section, the alongy plan 2.8 m wide and, on the
// Bdnrf, the cab's plan and elevation. Windows, doors and markings follow the
// native BMP boxes at 0.1 m a pixel; both liveries share their geometry (the
// iv textures paint the same boxes). See docs/models/german-coaches.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import { block, side } from "./vehicleParts.ts";
import { Coach, px, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { DoorMotion } from "./doors.ts";
import { endName, fpx, gangway, headstock, lamp, mirror, roofVents, sideName, sides } from "./csdCoaches.ts";
import { dbLogo, nosePanel, noseTop, sideWindows, type PxBox, type Win } from "./germanCoachParts.ts";

export type NWagenVariant = "bn" | "abn" | "bdnrf";
export type NWagenLivery = "vr" | "iv";

export const N_WAGEN_PARAMS: readonly ParamSpec[] = [
  {
    name: "variant",
    title: "Variant",
    default: "bn",
    values: [
      { value: "bn", title: "Bn (2nd class open coach)" },
      { value: "abn", title: "ABn (1st and 2nd class)" },
      { value: "bdnrf", title: "BDnrf (driving trailer, Karlsruher Kopf, luggage room)" },
    ],
  },
  {
    name: "livery",
    title: "Livery",
    default: "vr",
    values: [
      { value: "vr", title: "Verkehrsrot, light grey stripes and doors" },
      { value: "iv", title: "Light grey, mint turquoise window band" },
    ],
  },
];

/** The running number of each variant (UIC, check digit valid), kept in both liveries as a repainted coach keeps it. */
export const N_WAGEN_NUMBERS: Record<NWagenVariant, { number: string; source: string }> = {
  bn: { number: "50 80 22-34 366-1", source: "the Bnrz 451.0 of Commons File:D-DB 50 80 22-34 366-1 Bnrz 451.0 Muenchen Hbf 14.05.2014.jpg (title)" },
  abn: { number: "50 80 31-34 359-5", source: "the ABnrz of Commons File:20250429 ... ABnrz 50803134359-5.jpg (title)" },
  bdnrf: { number: "50 80 82-34 192-8", source: "the BDnrzf 740 of Commons File:BA 740 50 80 82 34 192-8 1998-05-30 Luebeck Hbf.jpg (title)" },
};

const H = 5;
/** The XML alongx section from the floor line up (the body's skirt below 0.9 m is the underframe's). */
const N_SECTION: Pt[] = [[1.48, 0.9], [-1.48, 0.9], [-1.5, 1.0], [-1.5, 3.1], [-1.3, 3.5], [-1, 3.7], [-0.7, 3.8], [0, 3.9], [0.7, 3.8], [1, 3.7], [1.3, 3.5], [1.5, 3.1], [1.5, 1.0]];

interface DoorSpec {
  box: PxBox;
  glass: PxBox[];
  /** Leaf seams (native columns) of a double or folding door. */
  seams: number[];
}

interface VariantSpec {
  windows: Win[];
  doors: DoorSpec[];
  /** Class signs: the plate box and its numeral. */
  signs: Array<[PxBox, string]>;
  /** The first class's yellow line under the roof (native columns). */
  yellow?: [number, number];
  /** The DB logo's box per livery and side (right = z_dec, left = z_inc). */
  logo: Record<NWagenLivery, { right: PxBox; left: PxBox }>;
  /** Handrails beside the entrances, source x. */
  handrails: number[];
}

const range = (n: number, x0: number, step: number, w = 12): PxBox[] => Array.from({ length: n }, (_, k): PxBox => [x0 + step * k, 20, x0 + step * k + w, 30]);
const passengerDoor = (x: number): DoorSpec => ({ box: [x, 19, x + 19, 39], glass: [[x + 5, 20, x + 8, 30], [x + 11, 20, x + 14, 30]], seams: [x + 9.5] });
const ENDS_A: Win[] = [[[6, 20, 13, 30], "frosted"], [17, 20, 29, 30], [33, 20, 45, 30], [49, 20, 61, 30]];
const ENDS_B: Win[] = [[203, 20, 215, 30], [219, 20, 231, 30], [235, 20, 247, 30], [[251, 20, 258, 30], "frosted"]];
const IV_LOGO = { right: [29, 35, 33, 38] as PxBox, left: [29, 35, 33, 38] as PxBox };

const VARIANTS: Record<NWagenVariant, VariantSpec> = {
  bn: {
    windows: [...ENDS_A, ...range(6, 86, 16), ...ENDS_B],
    doors: [passengerDoor(64), passengerDoor(181)],
    signs: [[[45, 21, 49, 29], "2"], [[98, 21, 102, 29], "2"], [[162, 21, 166, 29], "2"], [[215, 21, 219, 29], "2"]],
    logo: { vr: { right: [35, 32, 43, 36], left: [221, 32, 229, 36] }, iv: IV_LOGO },
    handrails: [0.75, 25.65],
  },
  abn: {
    windows: [...ENDS_A, ...range(5, 88, 19), ...ENDS_B],
    doors: [passengerDoor(64), passengerDoor(181)],
    signs: [[[45, 21, 49, 29], "2"], [[101, 21, 105, 29], "1"], [[158, 21, 162, 29], "1"], [[215, 21, 219, 29], "2"]],
    yellow: [85, 179],
    logo: { vr: { right: [33, 37, 37, 39], left: [227, 37, 231, 39] }, iv: IV_LOGO },
    handrails: [0.75, 25.65],
  },
  bdnrf: {
    windows: [[15, 21, 21, 29], [77, 20, 87, 30], ...range(5, 102, 16), ...ENDS_B],
    doors: [
      // the cab door, the luggage room's four-leaf folding door, a single door, a double door
      { box: [7, 19, 14, 39], glass: [[7.5, 20, 11, 29]], seams: [] },
      { box: [40, 20, 64, 39], glass: [[43, 22, 46, 30], [48, 22, 51, 30], [53, 22, 56, 30], [58, 22, 61, 30]], seams: [46.5, 52.5, 57.5] },
      { box: [89, 19, 98, 39], glass: [[91, 20, 94, 30]], seams: [] },
      passengerDoor(181),
    ],
    signs: [[[68, 21, 72, 29], "2"], [[114, 21, 118, 29], "2"], [[162, 21, 166, 29], "2"], [[215, 21, 219, 29], "2"]],
    logo: { vr: { right: [235, 37, 239, 39], left: [235, 37, 239, 39] }, iv: { right: [231, 35, 235, 38], left: [231, 35, 235, 38] } },
    handrails: [1.45, 25.65],
  },
};

interface LiverySpec {
  palette: Record<string, MaterialSpec>;
  bands: Array<[number, number, string]>;
  /** The passenger doors' leaves: a paint, or "bands" in the body's bands. */
  door: string;
  /** The class sign's plate and numeral. */
  plate: string;
  numeral: string;
  /** The logo's lines and, on a white band, its field. */
  logo: string;
  logoField?: string;
  /** The Karlsruher Kopf's light front over the windscreen band. */
  front: string;
}

const LIVERIES: Record<NWagenLivery, LiverySpec> = {
  vr: {
    palette: {
      red: { color: "#c8141c", roughness: 0.5 },
      white: { color: "#e6e9e7", roughness: 0.55 },
      skirt: { color: "#8e9294", roughness: 0.6 },
      roof: { color: "#85898b", roughness: 0.7 },
      door: { color: "#d8dcda", roughness: 0.5 },
      plateWhite: { color: "#f2f2f2", roughness: 0.5 },
      lettering: { color: "#f4f4f4", roughness: 0.5 },
      front: { color: "#c9cdcb", roughness: 0.5 },
    },
    bands: [[0.9, 1.1, "skirt"], [1.1, 1.3, "white"], [1.3, 3.0, "red"], [3.0, 3.1, "white"], [3.1, 3.4, "red"], [3.4, 4.0, "roof"]],
    door: "door",
    plate: "plateWhite",
    numeral: "red",
    logo: "white",
    front: "front",
  },
  iv: {
    palette: {
      mint: { color: "#1f9c9b", roughness: 0.5 },
      pastel: { color: "#84cfcb", roughness: 0.5 },
      white: { color: "#e3e7e4", roughness: 0.55 },
      skirt: { color: "#b6bbba", roughness: 0.6 },
      roof: { color: "#c3c7c6", roughness: 0.7 },
      plateMint: { color: "#b9e4e2", roughness: 0.5 },
      lettering: { color: "#2b2f30", roughness: 0.6 },
      logoRed: { color: "#d01e1e", roughness: 0.5 },
      front: { color: "#dfe3e0", roughness: 0.5 },
    },
    bands: [[0.9, 1.1, "skirt"], [1.1, 1.6, "white"], [1.6, 1.9, "pastel"], [1.9, 3.1, "mint"], [3.1, 3.3, "white"], [3.3, 4.0, "roof"]],
    door: "bands",
    plate: "plateMint",
    numeral: "mint",
    logo: "logoRed",
    logoField: "white",
    front: "front",
  },
};

/** One n-Wagen (vlakosimdb db_<variant><livery>). */
export function nWagen(params?: ParamValues): MeshBuilder {
  const p = resolveParams(N_WAGEN_PARAMS, params);
  const variant = p.variant as NWagenVariant;
  const livery = p.livery as NWagenLivery;
  const v = VARIANTS[variant];
  const paint = LIVERIES[livery];
  const cab = variant === "bdnrf";
  const c = new Coach(
    {
      ...paint.palette,
      yellow: { color: "#e2c81c", roughness: 0.5 },
      frame: { color: "#b5b9b9", metallic: 0.2, roughness: 0.45 },
      marking: { color: "#f2f2f2", roughness: 0.5 },
    },
    13.2,
  );
  const m = c.m;
  // the Bdnrf's cab: the XML plan rounds the nose from 1.05 m half width at its
  // tip to 1.4 m, and the elevation slopes the windscreen from (0.3, 2.1) to (0.7, 3.3)
  const body: Volume = {
    name: "body",
    section: N_SECTION,
    plan: cab ? [[0.3, 1.05], [0.4, 1.2], [0.7, 1.4], [26.1, 1.4], [26.2, 1.3]] : [[0.2, 1.3], [0.3, 1.4], [26.1, 1.4], [26.2, 1.3]],
    ...(cab ? { trimCaps: true, top: noseTop([[0.3, 2.1], [0.7, 3.3], [0.8, 3.8], [1.4, 3.9]], paint.bands), bottom: [[0.3, 1.2], [0.4, 0.9]] as Pt[] } : {}),
    bands: paint.bands,
    endPaint: paint.bands.find((b) => b[0] <= 2.0 && b[1] > 2.0)![2],
  };
  const wall: [number, number] = [body.plan[0]![0], 26.2];
  // the passenger doors open inward through doorways (doors.ts): the folding doors
  // fold as many leaves as their seams cut, a plain door swings; the cab car's door
  // beside the cab is the driver's and stays shut
  const opening = v.doors.filter((d) => !(cab && d.box[0] < 20));
  body.openings = sides.flatMap((s) => opening.map((d) => c.doorOpening(s, px(d.box, H))));
  const opens = (d: (typeof v.doors)[number]): DoorMotion | undefined =>
    !opening.includes(d) ? undefined : d.seams.length ? { kind: "fold", leaves: 4 } : { kind: "swing", leaves: 1, from: d.box[0] < 132 ? "low" : "high" };
  m.scope("body", () => {
    c.volume(body);
    for (const s of sides)
      m.scope(sideName(s), () => {
        sideWindows(c, body, s, H, v.windows, { fw: 0.07, sash: (b) => (b.x1 - b.x0 > 1 ? 2.45 : undefined) });
        v.doors.forEach((d, i) =>
          m.scope(`door ${i + 1}`, () => {
            const b = px(d.box, H);
            const motion = opens(d);
            if (motion) {
              // the windows ride on the leaves, whose gaps are the painted seams
              c.door(body, s, b, paint.door, {
                opens: motion,
                leafWork: (clip) =>
                  d.glass.forEach((g, k) => {
                    const w = clip(px(g, H));
                    if (w) c.m.scope(`window ${k + 1}`, () => c.window(body, s, w, { fw: 0.035 }));
                  }),
              });
              return;
            }
            c.door(body, s, b, paint.door);
            d.glass.forEach((g, k) => m.scope(`window ${k + 1}`, () => c.window(body, s, px(g, H), { fw: 0.035 })));
            if (d.seams.length) m.scope("seams", () => d.seams.forEach((x) => c.sidePanel(body, "seam", s, { x0: x / 10 - 0.015, y0: b.y0 + 0.03, x1: x / 10 + 0.015, y1: b.y1 - 0.03 }, 0.016)));
          }),
        );
        // the class numerals: on a plate in the Bn's verkehrsrot (native rows 20..29)
        // and in the iv livery (rows 21..28), painted white on the red pier otherwise
        const plated = livery === "iv" || variant === "bn";
        m.scope("class signs", () =>
          v.signs.forEach(([b, text], i) =>
            m.scope(`sign ${i + 1}`, () => {
              const box = px(livery === "vr" ? [b[0], 20, b[2], 30] : b, H);
              if (plated) m.scope("plate", () => c.sidePanel(body, paint.plate, s, box, 0.005, 0.004));
              // a painted numeral fills native rows 22..28 (0.7 m); on a plate it keeps a margin
              m.scope("numeral", () => c.numeral(body, s, text, (box.x0 + box.x1) / 2, plated ? 2.22 : 2.12, plated ? 0.56 : 0.72, 0.009, plated ? paint.numeral : "marking"));
            }),
          ),
        );
        if (v.yellow) m.scope("first class line", () => c.sidePanel(body, "yellow", s, { x0: v.yellow![0] / 10, y0: 3.11, x1: v.yellow![1] / 10, y1: 3.3 }, 0.004, 0.004));
        m.scope("db logo", () => {
          const lb = px(s > 0 ? v.logo[livery].right : v.logo[livery].left, H);
          dbLogo(c, body, s, lb, paint.logo, paint.logoField && lb.y0 < 1.6 ? paint.logoField : undefined);
        });
        m.scope("handrails", () => v.handrails.forEach((x) => c.handrail(body, s, x, 1.25, 2.0)));
        m.scope("running number", () => c.inscription(body, s, 13.2, [{ text: N_WAGEN_NUMBERS[variant].number, y: 0.93, h: 0.11 }], 0.006, livery === "vr" ? "marking" : "lettering"));
      });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const w = e > 0 ? wall[1] : wall[0];
      const head = e > 0 ? 26.4 : 0;
      const fb = (b: PxBox): Box => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      if (cab && e < 0) {
        m.scope("cab", () => karlsruherKopf(c, body, paint.front));
      } else {
        m.scope("gangway", () => gangway(c, e, w, head + -e * 0.01, H));
        m.scope("end door", () => {
          c.door(body, e, fb([9, 20, 21, 34]), livery === "vr" ? "door" : "white", { end: true });
          for (const [k, b] of ([[10, 20.1, 13, 29], [17, 20.1, 20, 29]] as PxBox[]).entries())
            m.scope(`window ${k + 1}`, () => c.window(body, e, fb(b), { end: true, fw: 0.035 }));
        });
        m.scope("tail lamps", () => {
          for (const [k, z] of [-1, 1].entries()) m.scope(`lamp ${k + 1}`, () => lamp(c, body, e, z * 1.0, 2.5, 0.08, "lampRed"));
        });
      }
      m.scope("headstock", () => headstock(c, e, w + (cab && e < 0 ? 0.1 : 0), 0.66, 0.92, 1.3));
      m.scope("buffers", () => c.buffers(e, head, w + (cab && e < 0 ? 0.1 : 0)));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, w + (cab && e < 0 ? 0.1 : 0)));
    });
  m.scope("door steps", () => {
    for (const d of v.doors) {
      const b = px(d.box, H);
      if (b.x1 - b.x0 < 1.5) continue;
      for (const s of sides) {
        block(m, "steel", c.X(b.x0 + 0.05), c.X(b.x1 - 0.05), 0.72, 0.76, ...side(s, 1.2, 1.44));
        block(m, "steel", c.X(b.x0 + 0.05), c.X(b.x1 - 0.05), 0.48, 0.52, ...side(s, 1.16, 1.4));
        for (const x of [b.x0 + 0.06, b.x1 - 0.1]) block(m, "underframe", c.X(x), c.X(x + 0.04), 0.44, 0.9, ...side(s, 1.17, 1.36));
      }
    }
  });
  m.scope("underframe", () => {
    block(m, "underframe", c.X(1.0), c.X(25.4), 0.72, 0.9, -1.2, 1.2);
    for (const [a, b, y] of [[8.8, 12.4, 0.45], [14.2, 17.6, 0.5], [19.4, 20.6, 0.55]] as Array<[number, number, number]>) block(m, "underframe", c.X(a), c.X(b), y, 0.72, -1.05, 1.05);
  });
  m.scope("running gear", () => [3.7, 22.7].forEach((x, i) => m.scope(`bogie ${i + 1}`, () => c.bogie(x, 2.5, 0.475, 0.9))));
  // the y_dec plan's seven mushroom vents, 0.6 m square on the roof's crown
  m.scope("roof equipment", () =>
    roofVents(c, ([[0.8, 1.4], [3.9, 4.5], [9.7, 10.3], [12.9, 13.5], [16.1, 16.7], [21.9, 22.5], [25.0, 25.6]] as Array<[number, number]>).filter(([a]) => !cab || a > 1.5), 3.86, 3.98, 0.3, "frame"),
  );
  return m;
}

/**
 * The Karlsruher Kopf at the x = 0 end: the light front over the windscreen band
 * (x_dec rows 20..29), two windscreens on the sloped face (native columns 3..14
 * and 16..27), a destination display above them, head and tail lamps on the
 * nose's tip, and the headlamp on the roof.
 */
function karlsruherKopf(c: Coach, body: Volume, front: string): void {
  const m = c.m;
  const fb = (b: PxBox): Box => fpx(b, H);
  m.scope("front", () => nosePanel(c, body, -1, front, { x0: -1.4, y0: 2.0, x1: 1.4, y1: 3.0 }, 0.004, 0.003));
  m.scope("windscreen", () =>
    ([[3, 21, 14, 29], [16, 21, 27, 29]] as PxBox[]).forEach((b, i) =>
      m.scope(`window ${i + 1}`, () => {
        // 5 mm above the nose's corner at 2.1 m, where the light front's pieces meet
        const bb = { ...fb(b), y0: fb(b).y0 + 0.005 };
        m.scope("frame", () => nosePanel(c, body, -1, "rubber", bb, 0.012, 0.006, 0.045));
        m.scope("glass", () => nosePanel(c, body, -1, "glass", { x0: bb.x0 + 0.05, y0: bb.y0 + 0.05, x1: bb.x1 - 0.05, y1: bb.y1 - 0.05 }, 0.02, 0.006, 0.09));
      }),
    ),
  );
  m.scope("destination display", () => nosePanel(c, body, -1, "rubber", { x0: -0.6, y0: 3.05, x1: 0.6, y1: 3.22 }, 0.012, 0.006));
  m.scope("lamps", () => {
    for (const [k, z] of [-1, 1].entries())
      m.scope(`lamp ${k + 1}`, () => {
        // x_dec paints the lamps 1.2 m out (rows 33..36), on the nose's rounded
        // corners; they stay on the flat tip, 1.05 m half wide here
        m.scope("head", () => lamp(c, body, -1, z * 0.88, 1.55, 0.09, "lampHead"));
        m.scope("tail", () => {
          const red = ngon(10, 0.06, 0, z * 0.6, 1.55);
          const x = c.X(0.3);
          m.sweep("underframe", "x", red, x, red, x - 0.05);
          m.sweep("lampRed", "x", red, x - 0.05, red, x - 0.065);
        });
      });
  });
  m.scope("roof lamp", () => {
    const r = ngon(10, 0.07, 0, 0, 3.86);
    m.sweep("lampHead", "x", r, c.X(0.86), r, c.X(0.83));
  });
}
