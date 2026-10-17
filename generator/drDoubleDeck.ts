// The DR double-deck coach (Waggonbau Goerlitz single coach, from 1974) in the
// cream and dark red "Hauptstadtanstrich" the DR introduced for Berlin's 750th
// anniversary in 1987, the colours of the Berlin S-Bahn: two vlakosimdb vehicles
// as one parametric design, `variant` coach (dr_sds_b, 2nd class) and
// drivingTrailer (dr_sds_s, the DBmq driving trailer with its flat cab end at
// x = 0). One XML section (4.6 m tall, the upper deck's sloped walls), a 26.6 m
// body; the lower deck's floor drop between the bogies, the single-level end
// sections and every window, door and marking follow the native BMP boxes at
// 0.1 m a pixel. See docs/models/german-coaches.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import { block } from "./vehicleParts.ts";
import { Coach, px, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { endName, fpx, gangway, headstock, lamp, mirror, sideName, sides } from "./csdCoaches.ts";
import { doubleDeckLod } from "./lodTrams.ts";
import { sideWindows, type PxBox, type Win } from "./germanCoachParts.ts";

export type DrDoubleDeckVariant = "coach" | "drivingTrailer";

export const DR_DOUBLE_DECK_PARAMS: readonly ParamSpec[] = [
  {
    name: "variant",
    title: "Variant",
    default: "coach",
    values: [
      { value: "coach", title: "Coach" },
      { value: "drivingTrailer", title: "Driving trailer" },
    ],
  },
];

/** Running numbers (UIC, DR country code 50, check digit valid). */
export const DR_DOUBLE_DECK_NUMBERS: Record<DrDoubleDeckVariant, { number: string; source: string }> = {
  coach: { number: "50 50 26-17 052-0", source: "illustrative; no legible photograph of a coach in this livery" },
  drivingTrailer: { number: "50 50 86-17 104-6", source: "illustrative; the photographed DBmq (Calau 1997) carries no legible number" },
};

const H = 5;
/** The XML alongx section cut at the elevation's 4.6 m roof line, from the lower deck's 0.5 m floor up. */
const SECTION: Pt[] = [[1.5, 0.5], [-1.5, 0.5], [-1.5, 3.4], [-1, 4.3], [-0.58, 4.6], [0.58, 4.6], [1, 4.3], [1.5, 3.4]];

const deck = (y0: number, y1: number): PxBox[] => Array.from({ length: 6 }, (_, k): PxBox => [89 + 16 * k, y0, 89 + 16 * k + 12, y1]);
const DOORS: Array<{ box: PxBox; glass: PxBox[]; seam: number; canopy: PxBox }> = [
  { box: [67, 24, 84, 45], glass: [[69, 26, 75, 36], [76, 26, 82, 36]], seam: 75.5, canopy: [61, 21, 90, 23] },
  { box: [186, 24, 203, 45], glass: [[188, 26, 194, 36], [195, 26, 201, 36]], seam: 194.5, canopy: [180, 21, 209, 23] },
];
/** The DR emblem's wings (ochre native rows 23, 25, 27) and its dark red centre. */
const WINGS: PxBox[] = [[121, 23, 132, 24], [125, 25, 133, 26], [129, 27, 134, 28], [136, 27, 141, 28], [137, 25, 145, 26], [138, 23, 149, 24]];

/** One DR double-deck coach in the Berlin livery (vlakosimdb dr_sds_b, dr_sds_s). */
const PALETTE: Record<string, MaterialSpec> = {
    darkRed: { color: "#7e1416", roughness: 0.55 },
    cream: { color: "#efe6b4", roughness: 0.55 },
    grey: { color: "#b9bbb8", roughness: 0.6 },
    ochre: { color: "#b9a64e", roughness: 0.5 },
    frame: { color: "#6c6a4a", metallic: 0.2, roughness: 0.5 },
    door: { color: "#7e1416", roughness: 0.55 },
    marking: { color: "#efe6b4", roughness: 0.5 },
};

/** The body volume; the driving trailer's flat cab end stands at x = 0.3. */
function drBody(cab: boolean): Volume {
  const start = cab ? 0.3 : 0.2;
  return {
    name: "body",
    section: SECTION,
    plan: [[start, 1.5], [26.8, 1.5]],
    bottom: [[start, 1.0], [5.8, 1.0], [6.1, 0.5], [20.7, 0.5], [21.0, 1.0], [26.8, 1.0]],
    bands: [[0.5, 1.9, "darkRed"], [1.9, 3.0, "cream"], [3.0, 3.2, "darkRed"], [3.2, 4.6, "grey"]],
  };
}

/** The end sections' windows (the driving trailer's first one shorter, behind its cab). */
const drEndWindows = (cab: boolean): Win[] => cab ? [[27, 22, 35, 31], [235, 22, 247, 31], [[253, 22, 261, 31], "frosted"]] : [[23, 22, 35, 31], [235, 22, 247, 31], [[253, 22, 261, 31], "frosted"]];

/** The same coach from afar (docs/models/lod.md): the double-deck adapter of lodTrams.ts. */
export function drDoubleDeckLod(params?: ParamValues): MeshBuilder {
  const cab = resolveParams(DR_DOUBLE_DECK_PARAMS, params).variant === "drivingTrailer";
  return doubleDeckLod({
    palette: PALETTE, centre: 13.5, body: drBody(cab), floor: 1.0, canvas: H,
    windows: [...deck(11, 18), ...deck(31, 40), ...drEndWindows(cab), ...(cab ? ([[6, 20, 11, 29], [12, 20, 17, 29]] as PxBox[]) : [])],
    doors: DOORS.map((d) => ({ box: d.box, mat: "door" })),
    ...(cab ? { windscreen: { box: [1, 21, 29, 30] as PxBox, end: -1 } } : {}),
    bogies: [3.5, 23.5].map((x) => ({ x, top: 1.0 })),
    equipment: { x: [[6.3, 9.0], [10.0, 13.0], [14.0, 17.0], [18.0, 20.5]], y0: 0.26 },
  });
}

export function drDoubleDeck(params?: ParamValues): MeshBuilder {
  const variant = resolveParams(DR_DOUBLE_DECK_PARAMS, params).variant as DrDoubleDeckVariant;
  const cab = variant === "drivingTrailer";
  const palette = PALETTE;
  const c = new Coach(palette, 13.5);
  const m = c.m;
  const start = cab ? 0.3 : 0.2;
  const body = drBody(cab);
  const endWindows = drEndWindows(cab);
  m.scope("body", () => {
    c.volume(body);
    for (const s of sides)
      m.scope(sideName(s), () => {
        m.scope("upper deck", () => sideWindows(c, body, s, H, deck(11, 18), { fw: 0.08 }));
        m.scope("lower deck", () => sideWindows(c, body, s, H, deck(31, 40), { fw: 0.08, sash: () => 1.45 }));
        m.scope("end sections", () => sideWindows(c, body, s, H, endWindows, { fw: 0.07, sash: (b) => (b.x1 - b.x0 > 1 ? 2.4 : undefined) }));
        if (cab) m.scope("cab", () => sideWindows(c, body, s, H, [[6, 20, 11, 29], [12, 20, 17, 29]], { fw: 0.05 }));
        DOORS.forEach((d, i) =>
          m.scope(`door ${i + 1}`, () => {
            const b = px(d.box, H);
            c.door(body, s, b, "door");
            d.glass.forEach((g, k) => m.scope(`window ${k + 1}`, () => c.window(body, s, px(g, H), { fw: 0.05, frame: "ochre" })));
            m.scope("centre seam", () => c.sidePanel(body, "seam", s, { x0: d.seam / 10 - 0.015, y0: b.y0 + 0.03, x1: d.seam / 10 + 0.015, y1: b.y1 - 0.03 }, 0.016));
            m.scope("step edge", () => c.sidePanel(body, "ochre", s, { x0: b.x0 + 0.01, y0: b.y0 + 0.005, x1: b.x1 - 0.01, y1: b.y0 + 0.08 }, 0.02, 0.006));
            m.scope("canopy", () => c.sidePanel(body, "ochre", s, px(d.canopy, H), 0.05, 0.06));
          }),
        );
        m.scope("hatch", () => c.door(body, s, px(cab ? [236, 34, 246, 39] : [24, 34, 34, 39], H), "darkRed", { seam: 0.03 }));
        m.scope("emblem", () => {
          for (const b of WINGS) c.sidePanel(body, "ochre", s, px(b, H), 0.006, 0.004);
          c.sidePanel(body, "darkRed", s, px([134, 23, 136, 30], H), 0.006, 0.004);
        });
        // the cream stripe along the single-level ends' sole (native row 39)
        m.scope("end stripes", () => {
          for (const [a, b] of [[start, 5.85], [20.95, 26.8]]) c.sidePanel(body, "cream", s, { x0: a, y0: 1.0, x1: b, y1: 1.1 }, 0.004, 0.004);
        });
        m.scope("handrails", () => [6.5, 8.55, 18.45, 20.5].forEach((x) => c.handrail(body, s, x, 0.75, 1.85)));
        m.scope("running number", () => c.inscription(body, s, 13.5, [{ text: DR_DOUBLE_DECK_NUMBERS[variant].number, y: 0.56, h: 0.1 }], 0.006, "marking"));
      });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const w = e > 0 ? 26.8 : start;
      const head = e > 0 ? 27.0 : 0;
      const fb = (b: PxBox): Box => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      if (cab && e < 0) m.scope("cab", () => cabEnd(c, body));
      else {
        m.scope("gangway", () => gangway(c, e, w, head + -e * 0.01, H));
        m.scope("end door", () => {
          c.door(body, e, fb([10, 23, 19, 36]), "darkRed", { end: true });
          for (const [k, b] of ([[11, 24, 13, 31], [16, 24, 18, 31]] as PxBox[]).entries())
            m.scope(`window ${k + 1}`, () => c.window(body, e, fb(b), { end: true, fw: 0.03 }));
        });
        m.scope("tail lamps", () => {
          for (const [k, z] of [-1, 1].entries()) m.scope(`lamp ${k + 1}`, () => lamp(c, body, e, z * 1.15, 1.65, 0.1, "lampRed"));
        });
      }
      m.scope("headstock", () => headstock(c, e, w, 0.66, 1.02, 1.4));
      m.scope("buffers", () => c.buffers(e, head, w));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, w));
    });
  m.scope("underframe", () => {
    for (const [a, b] of [[0.9, 5.9], [20.6, 25.9]]) block(m, "underframe", c.X(a), c.X(b), 0.75, 1.0, -1.25, 1.25);
    for (const [a, b] of [[6.3, 9.0], [10.0, 13.0], [14.0, 17.0], [18.0, 20.5]]) block(m, "underframe", c.X(a), c.X(b), 0.26, 0.5, -1.1, 1.1);
  });
  m.scope("running gear", () => [3.5, 23.5].forEach((x, i) => m.scope(`bogie ${i + 1}`, () => c.bogie(x, 2.5, 0.45, 1.0))));
  m.scope("roof equipment", () =>
    m.scope("roof seams", () => {
      const arc = SECTION.filter(([, y]) => y >= 4.3).map(([z, y]): Pt => [z * 1.004, y + 0.012]);
      const ring = [...arc, ...[...arc].reverse().map(([z, y]): Pt => [z * 0.98, y - 0.03])];
      for (const x of [1.8, 4.7, 22.1, 24.7]) m.sweep("frame", "x", ring, c.X(x) - 0.03, ring, c.X(x) + 0.03);
    }),
  );
  return m;
}

/**
 * The DBmq's flat cab end at x = 0.3 (x_both of dr_sds_s): two windscreens in a
 * black frame (rows 21..29), the cream band under them, head lamps with red tail
 * lamps above (rows 32..33) and a foot step (row 36).
 */
function cabEnd(c: Coach, body: Volume): void {
  const m = c.m;
  const fb = (b: PxBox): Box => fpx(b, H);
  m.scope("windscreen", () => {
    m.scope("frame", () => c.endPanel(body, "rubber", -1, fb([1, 21, 29, 30]), 0.01, 0.03));
    ([[2, 22, 14, 29], [16, 22, 28, 29]] as PxBox[]).forEach((b, i) => m.scope(`glass ${i + 1}`, () => c.endPanel(body, "glass", -1, fb(b), 0.018, 0.006)));
  });
  m.scope("lamps", () => {
    for (const [k, z] of [-1, 1].entries())
      m.scope(`lamp ${k + 1}`, () => {
        m.scope("head", () => lamp(c, body, -1, z * 1.15, 1.65, 0.09, "lampHead"));
        m.scope("tail", () => {
          const red = ngon(10, 0.05, 0, z * 1.15, 1.85);
          const x = c.X(0.3);
          m.sweep("underframe", "x", red, x, red, x - 0.04);
          m.sweep("lampRed", "x", red, x - 0.04, red, x - 0.055);
        });
      });
  });
  m.scope("foot step", () => block(m, "steel", c.X(0.3) - 0.12, c.X(0.3) + 0.01, 1.35, 1.39, -0.65, 0.65));
}
