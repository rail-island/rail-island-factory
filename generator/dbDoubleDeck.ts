// The DB Regio double-deck coach (Waggonbau Goerlitz, red DB Regio livery): three
// vlakosimdb vehicles as one parametric design, `variant` firstClass (db_ds_re1,
// 1st class upper deck), secondClass (db_ds_re2) and drivingTrailer (db_ds_re2_s,
// the driving trailer with the third-generation sloped cab). The XML gives one
// section 4.6 m tall with the upper deck's sloped walls, a 26.4 m body (26.8 m
// with the cab) and the cab's elevation; the lower deck's floor drop between the
// bogies and every window, door and marking follow the native BMP boxes at 0.1 m
// a pixel. Coordinates are db_ds_re2's: the driving trailer's canvas is the same
// layout two pixels toward x = 0, so its boxes are given here in re2 columns and
// its body runs 0.2..27.0. See docs/models/german-coaches.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import { block } from "./vehicleParts.ts";
import { Coach, px, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { endName, fpx, gangway, headstock, lamp, mirror, sideName, sides } from "./csdCoaches.ts";
import { dbLogo, nosePanel, noseTop, sideWindows, skinNumeral, type PxBox, type Win } from "./germanCoachParts.ts";

export type DostoVariant = "firstClass" | "secondClass" | "drivingTrailer";

export const DOSTO_PARAMS: readonly ParamSpec[] = [
  {
    name: "variant",
    title: "Variant",
    default: "secondClass",
    values: [
      { value: "firstClass", title: "1st/2nd class" },
      { value: "secondClass", title: "2nd class" },
      { value: "drivingTrailer", title: "Driving trailer" },
    ],
  },
];

/** Running numbers (UIC, check digit valid). */
export const DOSTO_NUMBERS: Record<DostoVariant, { number: string; source: string }> = {
  firstClass: { number: "50 80 26-81 052-5", source: "illustrative, DABz 756 series; no legible photograph" },
  secondClass: { number: "50 80 25-81 318-1", source: "illustrative, DBz 751 series; no legible photograph" },
  drivingTrailer: { number: "50 80 86-81 104-1", source: "illustrative, DABbzf/DBbzf 761 series; no legible photograph" },
};

const H = 5;
/** The XML alongx section cut at the elevation's 4.6 m roof line, from the lower deck's 0.5 m floor up. */
const DS_SECTION: Pt[] = [[1.5, 0.5], [-1.5, 0.5], [-1.5, 3.4], [-1, 4.3], [-0.58, 4.6], [0.58, 4.6], [1, 4.3], [1.5, 3.4]];

interface VariantSpec {
  upperSigns: string;
  /** The first class's yellow line (native columns, re2 coordinates). */
  yellow?: [number, number];
  display: PxBox;
  logo?: PxBox;
  /** Red-outlined hatches on the end sections. */
  hatches: PxBox[];
  cab: boolean;
}

const VARIANTS: Record<DostoVariant, VariantSpec> = {
  firstClass: { upperSigns: "1", yellow: [52, 216], display: [119, 23, 132, 27], logo: [79, 22, 87, 27], hatches: [[12, 30, 20, 39], [245, 20, 262, 39]], cab: false },
  secondClass: { upperSigns: "", display: [119, 23, 132, 27], hatches: [[245, 20, 262, 39]], cab: false },
  drivingTrailer: { upperSigns: "1", yellow: [74, 194], display: [136, 23, 149, 27], logo: [183, 21, 191, 26], hatches: [], cab: true },
};

const BANDS: Array<[number, number, string]> = [[0.5, 0.7, "grey"], [0.7, 0.9, "white"], [0.9, 3.0, "red"], [3.0, 3.1, "white"], [3.1, 4.1, "red"], [4.1, 4.6, "roof"]];

const deck = (x0: number, y0: number, y1: number): PxBox[] => Array.from({ length: 6 }, (_, k): PxBox => [x0 + 17 * k, y0, x0 + 17 * k + 13, y1]);
const UPPER: Win[] = [[56, 10, 64, 19], [68, 10, 81, 19], ...deck(85, 10, 19), [187, 10, 200, 19], [204, 10, 212, 19]];
const LOWER: Win[] = deck(85, 31, 40);
const END_SECTION: Win[] = [[12, 20, 20, 29], [32, 20, 45, 29], [223, 20, 236, 29]];
const DOORS: Array<{ box: PxBox; glass: PxBox[]; seam: number }> = [
  { box: [56, 23, 73, 45], glass: [[59, 26, 63, 41], [66, 26, 70, 41]], seam: 64.5 },
  { box: [195, 23, 212, 45], glass: [[198, 26, 202, 41], [205, 26, 209, 41]], seam: 203.5 },
];
const SIGNS_LOWER: Array<[number, number]> = [[82, 84], [183, 185]];

/** One DB Regio double-deck coach (vlakosimdb db_ds_re1, db_ds_re2, db_ds_re2_s). */
export function dbDosto(params?: ParamValues): MeshBuilder {
  const variant = resolveParams(DOSTO_PARAMS, params).variant as DostoVariant;
  const v = VARIANTS[variant];
  const palette: Record<string, MaterialSpec> = {
    red: { color: "#d0131a", roughness: 0.5 },
    white: { color: "#e8eaea", roughness: 0.55 },
    grey: { color: "#9a9d9f", roughness: 0.6 },
    roof: { color: "#8e9193", roughness: 0.7 },
    darkRed: { color: "#9c0d12", roughness: 0.55 },
    door: { color: "#c3c7c7", roughness: 0.5 },
    yellow: { color: "#f0b400", roughness: 0.5 },
    frame: { color: "#4a4c4e", metallic: 0.2, roughness: 0.5 },
    display: { color: "#f3f3f0", roughness: 0.4 },
    marking: { color: "#f4f4f4", roughness: 0.5 },
  };
  // the driving trailer's body is 0.4 m longer: its centre lies 0.2 m further along
  const c = new Coach(palette, v.cab ? 13.6 : 13.4);
  const m = c.m;
  const end = v.cab ? 27.0 : 26.6;
  const body: Volume = {
    name: "body",
    section: DS_SECTION,
    plan: [[0.2, 1.5], [end, 1.5]],
    bottom: [[0.2, 0.9], [5.1, 0.9], [5.5, 0.5], [21.3, 0.5], [21.7, 0.9], [end, 0.9]],
    // the cab's XML elevation (re2_s alongz +0.2 m): the windscreen slopes from (26.9, 2.0) to (26.4, 3.3)
    ...(v.cab ? { trimCaps: true, top: noseTop([[0.2, 4.6], [25.0, 4.6], [26.4, 3.3], [26.9, 2.0], [27.0, 1.1]], BANDS) } : {}),
    bands: BANDS,
    endPaint: "red",
  };
  m.scope("body", () => {
    c.volume(body);
    for (const s of sides)
      m.scope(sideName(s), () => {
        m.scope("upper deck", () => sideWindows(c, body, s, H, UPPER, { fw: 0.08 }));
        m.scope("lower deck", () => sideWindows(c, body, s, H, LOWER, { fw: 0.08 }));
        m.scope("end sections", () => sideWindows(c, body, s, H, v.cab ? [END_SECTION[1]!, END_SECTION[2]!] : END_SECTION, { fw: 0.08 }));
        DOORS.forEach((d, i) =>
          m.scope(`door ${i + 1}`, () => {
            const b = px(d.box, H);
            c.door(body, s, b, "door");
            d.glass.forEach((g, k) => m.scope(`window ${k + 1}`, () => c.window(body, s, px(g, H), { fw: 0.04 })));
            m.scope("centre seam", () => c.sidePanel(body, "seam", s, { x0: d.seam / 10 - 0.015, y0: b.y0 + 0.03, x1: d.seam / 10 + 0.015, y1: b.y1 - 0.03 }, 0.016));
          }),
        );
        m.scope("class signs", () =>
          SIGNS_LOWER.forEach(([a, b], i) =>
            m.scope(`sign ${i + 1}`, () => {
              m.scope("lower", () => c.numeral(body, s, "2", (a + b) / 20, 1.15, 0.6, 0.006, "marking"));
              if (v.upperSigns) m.scope("upper", () => skinNumeral(c, body, s, v.upperSigns, (a + b) / 20, 3.3, 0.58, 0.008, "marking"));
            }),
          ),
        );
        if (v.yellow) m.scope("first class line", () => c.sidePanel(body, "yellow", s, { x0: v.yellow![0] / 10, y0: 3.0, x1: v.yellow![1] / 10, y1: 3.1 }, 0.005, 0.004));
        m.scope("destination display", () => {
          const b = px(v.display, H);
          c.sidePanel(body, "darkRed", s, b, 0.005, 0.004);
          c.sidePanel(body, "display", s, { x0: b.x0 + 0.08, y0: b.y0 + 0.1, x1: b.x1 - 0.08, y1: b.y1 - 0.1 }, 0.009, 0.004);
        });
        if (v.logo) m.scope("db logo", () => dbLogo(c, body, s, px(v.logo!, H), "marking"));
        v.hatches.forEach((h, i) => m.scope(`hatch ${i + 1}`, () => c.door(body, s, px(h, H), "red", { seam: 0.03 })));
        if (v.cab) m.scope("grille panel", () => grillePanel(c, body, s));
        // the end sections' white stripe over the bogies (native rows 39..40)
        m.scope("end stripes", () => {
          for (const [a, b] of [[0.2, 5.15], [21.65, end]]) c.sidePanel(body, "white", s, { x0: a, y0: 0.9, x1: b, y1: 1.1 }, 0.004, 0.004);
        });
        m.scope("handrails", () => [5.45, 7.4, 19.35, 21.3].forEach((x) => c.handrail(body, s, x, 0.75, 1.9)));
        if (v.cab) m.scope("cab", () => sideWindows(c, body, s, H, [[250, 19, 261, 29]], { fw: 0.06 }));
        m.scope("running number", () => c.inscription(body, s, 13.4, [{ text: DOSTO_NUMBERS[variant].number, y: 0.73, h: 0.1 }], 0.006, "frame"));
      });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const w = e > 0 ? end : 0.2;
      const head = e > 0 ? end + 0.2 : 0;
      const fb = (b: PxBox): Box => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      if (v.cab && e > 0) m.scope("cab", () => cabFront(c, body));
      else {
        m.scope("gangway", () => gangway(c, e, w, head + -e * 0.01, H));
        m.scope("end door", () => {
          c.door(body, e, fb([10, 23, 19, 36]), "door", { end: true });
          for (const [k, b] of ([[11, 24, 13, 31], [16, 24, 18, 31]] as PxBox[]).entries())
            m.scope(`window ${k + 1}`, () => c.window(body, e, fb(b), { end: true, fw: 0.03 }));
        });
        m.scope("tail lamps", () => {
          for (const [k, z] of [-1, 1].entries()) m.scope(`lamp ${k + 1}`, () => lamp(c, body, e, z * 1.15, 1.65, 0.08, "lampRed"));
        });
      }
      m.scope("headstock", () => headstock(c, e, w, 0.66, 0.92, 1.4));
      m.scope("buffers", () => c.buffers(e, head, w));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, w));
    });
  m.scope("underframe", () => {
    for (const [a, b] of [[0.9, 5.2], [21.6, end - 0.7]]) block(m, "underframe", c.X(a), c.X(b), 0.72, 0.9, -1.25, 1.25);
    // equipment boxes under the dropped lower deck (native rows 45..47)
    for (const [a, b] of [[5.6, 8.0], [9.0, 13.0], [14.0, 18.6], [19.2, 21.2]]) block(m, "underframe", c.X(a), c.X(b), 0.24, 0.5, -1.1, 1.1);
  });
  m.scope("running gear", () => [3.4, 23.4].forEach((x, i) => m.scope(`bogie ${i + 1}`, () => c.bogie(x, 2.5, 0.46, 0.9))));
  // the bolted seams of the roof panels over the single-level ends (y_dec columns 16, 42, 221, 247)
  m.scope("roof equipment", () =>
    m.scope("roof seams", () => {
      const arc = DS_SECTION.filter(([, y]) => y >= 4.3).map(([z, y]): Pt => [z * 1.004, y + 0.012]);
      const ring = [...arc, ...[...arc].reverse().map(([z, y]): Pt => [z * 0.98, y - 0.03])];
      for (const x of v.cab ? [1.6, 4.2, 22.1] : [1.6, 4.2, 22.1, 24.7]) m.sweep("frame", "x", ring, c.X(x) - 0.03, ring, c.X(x) + 0.03);
    }),
  );
  return m;
}

/** The driving trailer's grille panel at the x = 0 end (re2_s columns 4..21, rows 17..39): an outline and four louvre groups. */
function grillePanel(c: Coach, body: Volume, s: number): void {
  c.door(body, s, px([6, 17, 23, 39], H), "red", { seam: 0.03 });
  ([[8, 20, 14, 25], [15, 20, 21, 25], [8, 31, 14, 37], [15, 31, 21, 37]] as PxBox[]).forEach((g, i) =>
    c.m.scope(`louvre ${i + 1}`, () => {
      const b = px(g, H);
      for (let k = 0; k < 3; k++) {
        const y = b.y0 + 0.04 + k * 0.17;
        c.sidePanel(body, "frame", s, { x0: b.x0, y0: y, x1: b.x1, y1: y + 0.08 }, 0.014, 0.006);
      }
    }),
  );
}

/**
 * The third-generation cab at the high-x end: the windscreen and its frame on the
 * sloped face (x_both rows 20..33), the destination display in its top, head and
 * tail lamps under it (rows 34..36) and the DB logo between them.
 */
function cabFront(c: Coach, body: Volume): void {
  const m = c.m;
  const fb = (b: PxBox): Box => mirror(fpx(b, H));
  m.scope("windscreen", () => {
    const f = fb([6, 20, 25, 34]);
    m.scope("frame", () => nosePanel(c, body, 1, "frame", f, 0.01, 0.01));
    // the glass rows 24..32, the destination display in the frame's top (row 22)
    m.scope("glass", () => nosePanel(c, body, 1, "glass", { x0: f.x0 + 0.1, y0: 1.8, x1: f.x1 - 0.1, y1: 2.6 }, 0.018, 0.006));
    m.scope("display", () => nosePanel(c, body, 1, "display", { x0: -0.5, y0: 2.68, x1: 0.5, y1: 2.9 }, 0.018, 0.006));
  });
  m.scope("lamps", () => {
    for (const [k, z] of [-1, 1].entries())
      m.scope(`lamp ${k + 1}`, () => {
        const x = c.X(27.0);
        m.scope("head", () => {
          const head = ngon(12, 0.1, 0, z * 0.72, 1.45);
          m.sweep("underframe", "x", head, x - 0.02, head, x + 0.04);
          m.sweep("lampHead", "x", head, x + 0.04, head, x + 0.055);
        });
        m.scope("tail", () => {
          const red = ngon(10, 0.06, 0, z * 1.05, 1.45);
          m.sweep("underframe", "x", red, x - 0.02, red, x + 0.03);
          m.sweep("lampRed", "x", red, x + 0.03, red, x + 0.045);
        });
      });
  });
  m.scope("db logo", () => nosePanel(c, body, 1, "marking", { x0: -0.2, y0: 1.33, x1: 0.2, y1: 1.57 }, 0.012, 0.008));
}

