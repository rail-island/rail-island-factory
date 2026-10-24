// The Bmo double-deck coach (later CD Bmto), one body in four liveries:
// vlakosimdb csd_bmo (CSD blue and beige) and cd_bmo#1..#3 (the CD liveries).
// The four share one XML geometry (assets/bmo-double-deck/native/<key>/index.xml)
// and their native BMPs differ only in paint, so this is one parametric design
// with a `livery` enum. See docs/models/bmo-double-deck.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { Coach, px, type Pt, type Volume } from "./csdCoachParts.ts";
import { emblem } from "./cd163.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { CSD, doors, endName, fpx, gangway, headstock, lamp, mirror, onSides, windows, type PxBox } from "./csdCoaches.ts";

/** The running number of each livery; UIC numbers with their check digit. */
export const BMO_NUMBERS = {
  csd: { number: "50 54 26-18 134-1", source: "legible on photo-bmto-side-praha-2014.jpg (now Bmto292)" },
  cdBlue: { number: "50 54 26-18 118-4", source: "illustrative, in the series 50 54 26-18 101 to 150; no photograph of the all-blue livery" },
  cdBlueGrey: { number: "50 54 26-18 127-5", source: "illustrative, in the series 50 54 26-18 101 to 150; no photograph of the blue doors" },
  cdRedDoors: { number: "50 54 26-18 134-1", source: "legible on photo-bmto-side-praha-2014.jpg, a coach in this livery" },
} as const;

export type BmoLivery = keyof typeof BMO_NUMBERS;

export const BMO_PARAMS: readonly ParamSpec[] = [
  {
    name: "livery",
    title: "Livery",
    default: "csd",
    values: [
      { value: "csd", title: "CSD" },
      { value: "cdBlue", title: "CD blue" },
      { value: "cdBlueGrey", title: "CD blue-grey" },
      { value: "cdRedDoors", title: "CD red doors" },
    ],
  },
];

interface LiveryPaint {
  palette: Record<string, MaterialSpec>;
  bands: Array<[number, number, string]>;
  end: string;
  door: string;
  canopy: string;
  /** The CD blue and grey liveries: blue lower panels on the end sections, a trim line. */
  endPanels: boolean;
}

// the native BMP colours of each livery (z_both, x_both)
const LIVERIES: Record<BmoLivery, LiveryPaint> = {
  csd: {
    palette: {
      blue: { color: "#283a7c", roughness: 0.5 },
      roof: { color: "#958c73", roughness: 0.6 },
      yellow: { color: "#c9c234", roughness: 0.5 },
      frame: { color: "#6f686f", metallic: 0.2, roughness: 0.5 },
    },
    bands: [[0.2, 0.5, "underframe"], [0.5, 3.1, "blue"], [3.1, 3.2, "yellow"], [3.2, 4.7, "roof"]],
    end: "blue",
    door: "blue",
    canopy: "underframe",
    endPanels: false,
  },
  cdBlue: {
    palette: {
      blue: { color: "#2050bf", roughness: 0.5 },
      roof: { color: "#6f686f", roughness: 0.7 },
      doorGrey: { color: "#b0b7b0", roughness: 0.5 },
      canopy: { color: "#3f38d8", roughness: 0.5 },
      frame: { color: "#6f686f", metallic: 0.2, roughness: 0.5 },
      lettering: { color: "#1c1e24", roughness: 0.6 },
      emblem: { color: "#f4f6f8", roughness: 0.5 },
    },
    bands: [[0.2, 0.5, "underframe"], [0.5, 3.2, "blue"], [3.2, 4.7, "roof"]],
    end: "blue",
    door: "doorGrey",
    canopy: "canopy",
    endPanels: false,
  },
  cdBlueGrey: {
    palette: {
      blue: { color: "#0068df", roughness: 0.5 },
      grey: { color: "#d4d6d8", roughness: 0.55 },
      roof: { color: "#8f8f8f", roughness: 0.7 },
      canopy: { color: "#3f38e8", roughness: 0.5 },
      trim: { color: "#3f38ff", roughness: 0.5 },
      frame: { color: "#6f686f", metallic: 0.2, roughness: 0.5 },
      lettering: { color: "#1c1e24", roughness: 0.6 },
      emblem: { color: "#f4f6f8", roughness: 0.5 },
    },
    bands: [[0.2, 0.5, "underframe"], [0.5, 0.8, "blue"], [0.8, 2.5, "grey"], [2.5, 3.2, "blue"], [3.2, 4.7, "roof"]],
    end: "blue",
    door: "blue",
    canopy: "canopy",
    endPanels: true,
  },
  cdRedDoors: {
    palette: {
      blue: { color: "#0068df", roughness: 0.5 },
      grey: { color: "#d4d6d8", roughness: 0.55 },
      roof: { color: "#8f8f8f", roughness: 0.7 },
      red: { color: "#e8452a", roughness: 0.5 },
      canopy: { color: "#3f38e8", roughness: 0.5 },
      trim: { color: "#3f38ff", roughness: 0.5 },
      frame: { color: "#6f686f", metallic: 0.2, roughness: 0.5 },
      lettering: { color: "#1c1e24", roughness: 0.6 },
      emblem: { color: "#f4f6f8", roughness: 0.5 },
    },
    bands: [[0.2, 0.5, "underframe"], [0.5, 0.8, "blue"], [0.8, 2.5, "grey"], [2.5, 3.2, "blue"], [3.2, 4.7, "roof"]],
    end: "blue",
    door: "red",
    canopy: "canopy",
    endPanels: true,
  },
};

/** The section of the XML alongx: the lower deck down to 0.2 m, the upper deck's sloped walls. */
const BMO_SECTION: Pt[] = [[-1.4, 0.2], [1.4, 0.2], [1.5, 0.4], [1.5, 3.2], [1.1, 4.0], [0.9, 4.3], [0.6, 4.5], [0, 4.6], [-0.6, 4.5], [-0.9, 4.3], [-1.1, 4.0], [-1.5, 3.2], [-1.5, 0.4]];

/** The Bmo in one of its liveries (vlakosimdb csd_bmo, cd_bmo#1..#3). */
export function bmoCoach(params?: ParamValues): MeshBuilder {
  const livery = resolveParams(BMO_PARAMS, params).livery as BmoLivery;
  const paint = LIVERIES[livery];
  const H = 5;
  const c = new Coach(paint.palette, 13.4);
  const m = c.m;
  const body: Volume = {
    name: "body",
    section: BMO_SECTION,
    plan: [[0.2, 1.5], [26.6, 1.5]],
    bottom: [[0.2, 0.9], [5.7, 0.9], [6.0, 0.2], [20.8, 0.2], [21.1, 0.9], [26.6, 0.9]],
    bands: paint.bands,
    endPaint: paint.end,
  };
  const xs = [85, 102, 119, 136, 153, 170];
  const number = BMO_NUMBERS[livery].number;
  m.scope("body", () => {
    c.volume(body);
    onSides(
      c,
      windows(c, body, H, [
        ...xs.map((x): PxBox => [x, 10, x + 13, 18]),
        ...xs.map((x): PxBox => [x, 31, x + 13, 40]),
        [23, 21, 36, 30], [233, 21, 246, 30], [[251, 21, 259, 30], "frosted"],
      ], { fw: 0.08, sash: (b) => (b.y1 < 2 ? 1.5 : b.y0 > 3 || b.x1 - b.x0 < 1 ? undefined : 2.5) }),
      doors(c, body, H, [
        { box: [64, 25, 81, 46], glass: [[66, 26, 71, 36], [74, 26, 79, 36]] },
        { box: [187, 25, 204, 46], glass: [[189, 26, 194, 36], [197, 26, 202, 36]] },
      ], paint.door, { fw: 0.04, opens: { kind: "plug", leaves: 2 } }),
      // the hatch under the end window (native rows 32..39), in the end section's blue
      (s) => m.scope("hatch", () => c.door(body, s, px([24, 32, 35, 39], H), "blue")),
      (s) =>
        m.scope("door canopies", () => {
          for (const [a, b] of [[5.7, 8.8], [18.0, 21.1]]) c.sidePanel(body, paint.canopy, s, { x0: a, y0: 2.6, x1: b, y1: 2.66 }, 0.04, 0.06);
          for (const x of [7.25, 19.55]) c.sidePanel(body, "seam", s, { x0: x - 0.02, y0: 0.4, x1: x + 0.02, y1: 2.5 }, 0.016);
        }),
      (s) =>
        m.scope("handrails", () => {
          for (const x of [0.85, 25.95]) c.handrail(body, s, x, 1.3, 1.9);
        }),
      ...(paint.endPanels ? [endPanels(c)] : []),
      ...(livery === "csd" ? [csdMarkings(c, body, number)] : [cdMarkings(c, body, number)]),
    );
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const wall = e > 0 ? 26.6 : 0.2;
      const head = e > 0 ? 26.8 : 0;
      const fb = (b: PxBox) => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      m.scope("gangway", () => gangway(c, e, wall, head + -e * 0.01, H));
      m.scope("end door", () => {
        c.door(body, e, fb([9, 19, 21, 37]), paint.end, { end: true });
        for (const [k, b] of ([[10, 20, 13, 29], [17, 20, 20, 29]] as PxBox[]).entries())
          m.scope(`window ${k + 1}`, () => c.window(body, e, fb(b), { end: true, fw: 0.04 }));
      });
      m.scope("lamps", () => {
        for (const [k, z] of [-1.05, 1.05].entries())
          m.scope(`lamp ${k + 1}`, () => {
            lamp(c, body, e, z, 1.65, 0.12, "lampHead");
            const red = ngon(10, 0.05, 0, z, 1.65);
            const x = c.X(wall) + e * 0.07;
            m.sweep("lampRed", "x", red, x, red, x + e * 0.012);
          });
      });
      m.scope("headstock", () => headstock(c, e, wall, 0.66, 0.92, 1.45));
      m.scope("buffers", () => c.buffers(e, head, wall));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, wall));
    });
  // the bolted seams of the removable roof panels over the single-level ends
  // (native y_dec columns 18, 44, 223 and 249; the photographed end roof)
  m.scope("roof equipment", () =>
    m.scope("roof seams", () => {
      const arc = BMO_SECTION.filter(([, y]) => y >= 4.0).map(([z, y]): Pt => [z * 1.004, y + 0.012]);
      const ring = [...arc, ...[...arc].reverse().map(([z, y]): Pt => [z * 0.98, y - 0.03])];
      for (const x of [1.8, 4.4, 22.3, 24.9]) m.sweep("frame", "x", ring, c.X(x) - 0.03, ring, c.X(x) + 0.03);
    }),
  );
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.bogie(3.5, 2.5, 0.45, 0.9));
    m.scope("bogie 2", () => c.bogie(23.3, 2.5, 0.45, 0.9));
  });
  return m;
}

/** The CSD livery's yellow emblem wings and "CSD" (C with a caron) over the number. */
function csdMarkings(c: Coach, body: Volume, number: string): (s: number) => void {
  return (s) => {
    // the yellow wings either side of the CSD emblem: native rows 21, 23 and 25
    c.m.scope("emblem wings", () => {
      for (const b of [[98, 21, 125, 22], [104, 23, 124, 24], [111, 25, 125, 26], [143, 21, 171, 22], [145, 23, 165, 24], [145, 25, 159, 26]] as PxBox[])
        c.sidePanel(body, "yellow", s, px(b, 5), 0.006, 0.004);
    });
    c.m.scope("running number", () =>
      c.inscription(body, s, 13.4, [{ text: CSD, y: 2.47, h: 0.33 }, { text: number, y: 2.24, h: 0.1 }], 0.008),
    );
  };
}

/** The CD emblem's width at height 1. */
const EMBLEM_W = ((p) => Math.max(...p) - Math.min(...p))(emblem(0, 0, 1, false).map((q) => q[0]));

/**
 * The CD liveries: the white CD emblem on the x = 0 end section's lower panel (native
 * columns 43..50, rows 34..38), and the running number between the lower-deck
 * windows and the upper-deck band (rows 26..28).
 */
function cdMarkings(c: Coach, body: Volume, number: string): (s: number) => void {
  return (s) => {
    c.m.scope("emblem", () => {
      const h = 0.34;
      // one emblem, on the x = 0 end section of both sides (the one z_both texture)
      const x = 4.3;
      // read left to right from outside: toward +x on the +z side, toward -x on the -z side
      const u0 = s > 0 ? c.X(x) : c.X(x) + EMBLEM_W * h;
      c.m.facets("emblem", emblem(u0, 1.2, h, s < 0).map(([u, v]): Vec3 => [u, v, s * 1.508]), [0, 0, s]);
    });
    c.m.scope("running number", () => c.inscription(body, s, 13.25, [{ text: number, y: 2.22, h: 0.1 }], 0.008, "lettering"));
  };
}

/**
 * The blue lower panels of the single-level end sections in the CD blue and grey
 * liveries (native rows 32..41; the top 2.5 mm above its nominal 1.8 m, clear of the
 * hatch's edge): from the end to a slope that meets the dropped
 * centre's 0.8 m blue band at the door, and a trim line at native row 39.
 */
function endPanels(c: Coach): (s: number) => void {
  const z = (s: number, d: number) => s * (1.5 + d);
  return (s) =>
    c.m.scope("end panels", () => {
      for (const e of [-1, 1]) {
        // source x of the outline, mirrored for the high-x end
        const sx = (x: number) => (e < 0 ? x : 26.8 - x);
        // a rectangle, and a convex piece down the slope a little prouder; their
        // edges never share a plane (slab() fans its outline from the first point)
        const pieces: Array<[Pt[], number]> = [
          [[[0.205, 0.905], [5.7, 0.905], [5.7, 1.8025], [0.205, 1.8025]], 0.004],
          [[[5.68, 0.905], [5.743, 0.805], [6.3, 0.805], [5.8, 1.8025], [5.68, 1.7925]], 0.0045],
        ];
        for (const [outline, d] of pieces) c.m.slab("blue", outline.map(([x, y]): Vec3 => [c.X(sx(x)), y, z(s, d)]), [0, 0, -s * 0.003]);
        const [a, b] = [c.X(sx(0.205)), c.X(sx(5.7))].sort((p, q) => p - q) as [number, number];
        c.m.slab("trim", [[a, 1.0, z(s, 0.007)], [b, 1.0, z(s, 0.007)], [b, 1.095, z(s, 0.007)], [a, 1.095, z(s, 0.007)]], [0, 0, -s * 0.002]);
      }
    });
}

