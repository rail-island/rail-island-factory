// The CSD coaches, reconstructed from the native JT7 XML and BMPs in
// assets/csd-<name>/native (vlakosimdb db/train/coach/csd_<name>). Bodies follow
// the XML alongx/alongy/alongz profiles; windows, doors, paint bands and end
// fittings follow boxes measured on the original BMPs at 0.1 m a pixel (see
// assets/csd-<name>/native/landmarks.json). Source x runs along the coach from
// 0 and the Factory model is centred between the buffer heads. No runtime
// textures and no sibling-database dependency. See docs/models/csd-coaches.md.

import { ngon, type MeshBuilder } from "./meshBuilder.ts";
import { block, side } from "./vehicleParts.ts";
import { Coach, px, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues } from "./design.ts";

/** The game-catalog fields of the coaches: rail vehicles in their own pool. */
export const COACH_CATALOG: CatalogFields = {
  category: "Rail vehicles",
  group: "coach",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/**
 * The running number each coach carries under "CSD" (C with a caron) on both sides, and where it
 * came from. UIC numbers (12 digits) carry a check digit; the older national
 * numbers (class, district digit, serial) do not. See docs/models/csd-coaches.md.
 */
export const RUNNING_NUMBERS = {
  classA: { number: "51 54 19-41 068-0", source: "Commons description of photo-a-51-54-19-41-068-0-side-praha-2009.jpg (not legible in the photo)" },
  classB: { number: "51 54 20-41 866-4", source: "read from photo-b-y-side-praha-2014.jpg; the serial's first digit is blurred, 866 is the reading the printed check digit 4 confirms" },
  balm: { number: "70 54 28-05 676-0", source: "legible on photo-balm-020-original-livery-side-2016.jpg (Balm in the original livery)" },
  bam: { number: "Bam 5159", source: "legible on photo-bam-5159-side-praha-2014.jpg" },
  bdmtee: { number: "50 54 22-44 268-9", source: "legible on photo-bdmtee-50-54-22-44-268-9-side-brno-2009.jpg (a later Bdmtee275 rebuild of the type)" },
  be31: { number: "Be 2-4157", source: "illustrative: no photo of the type; the national format of the photographed Ddk 6-3777 and Bam 5159" },
  bi20: { number: "Bi 3-1820", source: "illustrative: no photo of the type; the national format of the photographed Ddk 6-3777 and Bam 5159" },
  dsk: { number: "Dsk 4-1210", source: "illustrative: no photo of the type; the national format of the photographed Ddk 6-3777 and Bam 5159" },
} as const;

/** The UIC check digit of a 12-digit coach number's first 11 digits (weights 2, 1, 2, ... from the right; digit sums). */
export function uicCheckDigit(number: string): number {
  const d = [...number.replace(/\D/g, "")].slice(0, 11).map(Number);
  const sum = d.reverse().reduce((a, x, i) => a + (i % 2 === 0 ? Math.floor((2 * x) / 10) + ((2 * x) % 10) : x), 0);
  return (10 - (sum % 10)) % 10;
}

/** The railway's lettering, "CSD" with a caron on the C. */
export const CSD = "\u010cSD";

/** "CSD" (C with a caron) over the running number, as the coaches carry it on both sides. */
function numberPlate(c: Coach, v: Volume, x: number, y: number, number: string, h = 0.11, proud = 0.006): SideWork {
  return (s) =>
    c.m.scope("running number", () =>
      c.inscription(v, s, x, [{ text: CSD, y: y + h * 1.55, h: h * 1.4 }, { text: number, y, h }], proud),
    );
}

export type PxBox = [number, number, number, number];

/** A front-view box (native pixels on a 3 m wide end canvas) as z across, y up. */
export const fpx = (b: PxBox, h: number): Box => px(b, h, -1.5);
/** The same box seen from the other end: mirrored across. */
export const mirror = (b: Box): Box => ({ x0: -b.x1, y0: b.y0, x1: -b.x0, y1: b.y1 });
export const sides = [1, -1] as const;
export const sideName = (s: number) => (s > 0 ? "right side" : "left side");
export const endName = (e: number) => (e > 0 ? "front end" : "rear end");

export type SideWork = (s: number) => void;

/** Runs every piece of side work on both sides, each side in one scope. */
export function onSides(c: Coach, ...work: SideWork[]): void {
  for (const s of sides) c.m.scope(sideName(s), () => work.forEach((w) => w(s)));
}

/** A list of framed windows on a side of `v`. */
export function windows(c: Coach, v: Volume, h: number, list: Array<PxBox | [PxBox, string]>, opts: { frame?: string; fw?: number; sash?: (b: Box) => number | undefined } = {}): SideWork {
  return (s) =>
    list.forEach((w, i) => {
      const [b, glass] = typeof w[0] === "number" ? [w as PxBox, "glass"] : (w as [PxBox, string]);
      const box = px(b, h);
      c.m.scope(`window ${i + 1}`, () => c.window(v, s, box, { ...opts, glass, sash: opts.sash?.(box) }));
    });
}

/** Doors on a side of `v`: the leaf box and its windows. */
export function doors(c: Coach, v: Volume, h: number, list: Array<{ box: PxBox; glass: PxBox[] }>, paint: string, opts: { frame?: string; fw?: number } = {}): SideWork {
  return (s) =>
    list.forEach((d, i) =>
      c.m.scope(`door ${i + 1}`, () => {
        c.door(v, s, px(d.box, h), paint);
        d.glass.forEach((g, k) => c.m.scope(`window ${k + 1}`, () => c.window(v, s, px(g, h), { ...opts, fw: opts.fw ?? 0.05 })));
      }),
    );
}

/** A round lamp on end e at front-view centre (z, y): a housing and a lens. */
export function lamp(c: Coach, v: Volume, e: number, z: number, y: number, r: number, lens: string): void {
  const xEnd = c.X(e > 0 ? v.plan[v.plan.length - 1]![0] : v.plan[0]![0]);
  const housing = ngon(12, r * 1.25, 0, z, y);
  c.m.sweep("underframe", "x", housing, xEnd, housing, xEnd + e * 0.05);
  const glass = ngon(12, r, 0, z, y);
  c.m.sweep(lens, "x", glass, xEnd + e * 0.05, glass, xEnd + e * 0.07);
}

/** A headstock below the body end: the beam the buffers and coupling hang on. */
export function headstock(c: Coach, e: number, x: number, y0: number, y1: number, half: number): void {
  const [a, b] = [c.X(x) + e * 0.03, c.X(x) - e * 0.25].sort((p, q) => p - q) as [number, number];
  block(c.m, "underframe", a, b, y0, y1, -half, half);
}

/** A UIC gangway: the rubber U-frame from the end wall out to `face`. */
export function gangway(c: Coach, e: number, wall: number, face: number, h: number): void {
  const [a, b] = [c.X(wall) - e * 0.02, c.X(face)].sort((p, q) => p - q) as [number, number];
  const fr = fpx([7, 17, 23, 37], h);
  for (const z of [-1, 1]) block(c.m, "rubber", a, b, fr.y0, fr.y1 - 0.2, ...side(z, 0.62, 0.8));
  block(c.m, "rubber", a, b, fr.y1 - 0.2, fr.y1, -0.8, 0.8);
}

/**
 * Diagonal brace strips on the flat end wall at source x `wall` of end e, each
 * from one native pixel (u, v) to another on that end's canvas.
 */
function diagonals(c: Coach, e: number, wall: number, list: Array<[Pt, Pt]>, h: number, half: number): void {
  const x = c.X(wall) + e * 0.012;
  const z = (u: number) => Math.max(-half, Math.min(half, e > 0 ? 1.5 - u / 10 : u / 10 - 1.5));
  for (const [a, b] of list) {
    const [za, ya, zb, yb] = [z(a[0]), h - a[1] / 10, z(b[0]), h - b[1] / 10];
    const w = 0.05;
    c.m.slab("post", [[x, ya, za - w], [x, ya, za + w], [x, yb, zb + w], [x, yb, zb - w]], [-e * 0.03, 0, 0]);
  }
}

export function roofVents(c: Coach, list: Array<[number, number]>, y0: number, y1: number, half: number, mat = "roof"): void {
  c.m.scope("roof vents", () => {
    for (const [a, b] of list) {
      const q: Pt[] = [[-half, y0], [half, y0], [half * 0.6, y1], [-half * 0.6, y1]];
      c.m.sweep(mat, "x", q, c.X(a), q, c.X(b));
    }
  });
}

// --- the Y-type coaches A and B (24.5 m) ---------------------------------------

export const Y_SECTION: Pt[] = [[1.5, 0.9], [-1.5, 0.9], [-1.5, 3.2], [-1.3, 3.6], [-1, 3.9], [-0.6, 4.1], [0, 4.2], [0.6, 4.1], [1, 3.9], [1.3, 3.6], [1.5, 3.2]];

function yCoach(kind: "A" | "B"): MeshBuilder {
  const H = 5;
  const c = new Coach(
    {
      green: { color: "#1b4529", roughness: 0.55 },
      yellow: { color: "#c7bd2a", roughness: 0.5 },
      roof: { color: "#7d7f80", roughness: 0.75 },
      frame: { color: "#b0b0b0", metallic: 0.2, roughness: 0.45 },
    },
    12.25,
  );
  const m = c.m;
  const body: Volume = {
    name: "body",
    section: Y_SECTION,
    plan: [[0.2, 1.4], [1.6, 1.5], [22.9, 1.5], [24.3, 1.4]],
    top: [[0.2, 4.0], [0.4, 4.2], [24.1, 4.2], [24.3, 4.0]],
    bands: [[0.9, 3.1, "green"], [3.1, 3.2, "yellow"], [3.2, 4.3, "roof"]],
    endPaint: "green",
  };
  m.scope("body", () => {
    c.volume(body);
    const compartments: PxBox[] =
      kind === "A"
        ? Array.from({ length: 9 }, (_, k): PxBox => [32 + 21 * k, 19, 45 + 21 * k, 30])
        : Array.from({ length: 10 }, (_, k): PxBox => [30 + 19 * k, 19, 43 + 19 * k, 30]);
    onSides(
      c,
      windows(c, body, H, [[[18, 19, 26, 30], "frosted"], ...compartments, [[219, 19, 227, 30], "frosted"]], { fw: 0.08, sash: () => 2.5 }),
      doors(c, body, H, [
        { box: [3, 19, 14, 38], glass: [[9, 20, 13, 29]] },
        { box: [231, 19, 242, 38], glass: [[232, 20, 236, 29]] },
      ], "green", { fw: 0.04 }),
      (s) =>
        m.scope("class marks", () => {
          c.numeral(body, s, kind === "A" ? "1" : "2", kind === "A" ? 2.85 : 2.75, 2.35, 0.55);
          c.numeral(body, s, kind === "A" ? "1" : "2", kind === "A" ? 21.4 : 21.6, 2.35, 0.55);
        }),
      (s) =>
        m.scope("handrails", () => {
          for (const x of [1.57, 22.87]) c.handrail(body, s, x, 1.3, 2.05);
        }),
      // native rows 30..35 carry the centre inscription
      numberPlate(c, body, 12.25, 1.45, RUNNING_NUMBERS[kind === "A" ? "classA" : "classB"].number),
    );
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const wall = e > 0 ? 24.3 : 0.2;
      const head = e > 0 ? 24.5 : 0;
      const fb = (b: PxBox) => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      m.scope("gangway", () => gangway(c, e, wall, head + -e * 0.01, H));
      m.scope("end door", () => {
        c.door(body, e, fb([9, 19, 21, 37]), "green", { end: true });
        for (const [k, b] of ([[10, 20, 13, 29], [17, 20, 20, 29]] as PxBox[]).entries())
          m.scope(`window ${k + 1}`, () => c.window(body, e, fb(b), { end: true, fw: 0.04 }));
      });
      m.scope("tail lamps", () => {
        for (const [k, z] of [-1, 1].entries()) m.scope(`lamp ${k + 1}`, () => lamp(c, body, e, z * 1.0, 1.5, 0.09, "lampRed"));
      });
      m.scope("headstock", () => headstock(c, e, wall, 0.66, 0.92, 1.4));
      m.scope("buffers", () => c.buffers(e, head, wall));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, wall));
      m.scope("steps", () => {
        const [x0, x1] = e > 0 ? [23.0, 24.1] : [0.4, 1.5];
        for (const s of sides) {
          for (const y of [0.5, 0.74]) block(m, "steel", c.X(x0), c.X(x1), y, y + 0.04, ...side(s, 1.06, 1.42));
          for (const x of [x0 + 0.03, x1 - 0.07]) block(m, "underframe", c.X(x), c.X(x + 0.04), 0.46, 0.9, ...side(s, 1.08, 1.36));
        }
      });
    });
  m.scope("underframe", () => {
    block(m, "underframe", c.X(1.0), c.X(23.5), 0.72, 0.9, -1.2, 1.2);
    for (const poly of [
      [[6.3, 0.3], [10.9, 0.3], [10.9, 0.9], [6.3, 0.9]],
      [[11.4, 0.6], [13.1, 0.6], [13.1, 0.9], [11.4, 0.9]],
      [[14.2, 0.4], [18.5, 0.4], [18.5, 0.9], [14.2, 0.9]],
    ] as Pt[][])
      c.sideSweep("underframe", poly, -1.15, 1.15);
  });
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.bogie(3.7, 2.5, 0.45, 0.9));
    m.scope("bogie 2", () => c.bogie(20.8, 2.5, 0.45, 0.9));
  });
  m.scope("roof equipment", () => roofVents(c, [[2.2, 2.8], [21.7, 22.3]], 4.1, 4.27, 0.3));
  return m;
}

/** The classic green Y-type coach's one parameter: the 1st class A or the 2nd class B. */
export const CLASSIC_GREEN_PARAMS: readonly ParamSpec[] = [
  {
    name: "variant",
    title: "Variant",
    default: "classA",
    values: [
      { value: "classA", title: "Class A" },
      { value: "classB", title: "Class B" },
    ],
  },
];

/** CSD A and CSD B as one parametric design (vlakosimdb csd_a, csd_b): `variant` picks the class. */
export function csdClassicGreenCoach(params?: ParamValues): MeshBuilder {
  const { variant } = resolveParams(CLASSIC_GREEN_PARAMS, params);
  return yCoach(variant === "classA" ? "A" : "B");
}

// --- Bdmtee (26.4 m, two pairs of double doors) ---------------------------------

export function csdBdmtee(): MeshBuilder {
  const H = 5;
  const c = new Coach(
    {
      green: { color: "#21562d", roughness: 0.55 },
      roof: { color: "#7f7f80", roughness: 0.75 },
      frame: { color: "#c9c3c9", metallic: 0.2, roughness: 0.45 },
    },
    13.2,
  );
  const m = c.m;
  const body: Volume = {
    name: "body",
    section: [[1.5, 0.9], [-1.5, 0.9], [-1.5, 3.2], [-1.3, 3.6], [-1, 3.8], [-0.7, 3.9], [0, 4], [0.7, 3.9], [1, 3.8], [1.3, 3.6], [1.5, 3.2]],
    plan: [[0.2, 1.4], [0.3, 1.5], [26.1, 1.5], [26.2, 1.4]],
    top: [[0.2, 3.9], [0.3, 4.0], [26.1, 4.0], [26.2, 3.9]],
    bands: [[0.9, 3.2, "green"], [3.2, 4.1, "roof"]],
    endPaint: "green",
  };
  m.scope("body", () => {
    c.volume(body);
    onSides(
      c,
      windows(c, body, H, [
        [6, 20, 18, 30], [21, 20, 33, 30], [36, 20, 48, 30], [53, 20, 60, 30],
        [86, 20, 98, 30], [102, 20, 114, 30], [118, 20, 130, 30], [134, 20, 146, 30], [150, 20, 162, 30], [166, 20, 178, 30],
        [[203, 20, 210, 30], "frosted"], [216, 20, 228, 30], [231, 20, 243, 30], [246, 20, 258, 30],
      ], { fw: 0.07, sash: () => 2.5 }),
      doors(c, body, H, [
        { box: [63, 18, 83, 44], glass: [[65, 20, 70, 30], [76, 20, 81, 30]] },
        { box: [181, 18, 201, 44], glass: [[183, 20, 188, 30], [194, 20, 199, 30]] },
      ], "green", { fw: 0.04 }),
      (s) =>
        m.scope("door seams", () => {
          for (const x of [7.25, 19.05]) c.sidePanel(body, "seam", s, { x0: x - 0.02, y0: 0.6, x1: x + 0.02, y1: 3.2 }, 0.016);
        }),
      (s) =>
        m.scope("handrails", () => {
          for (const x of [0.4, 26.0]) c.handrail(body, s, x, 1.5, 2.4);
        }),
      numberPlate(c, body, 12.8, 1.38, RUNNING_NUMBERS.bdmtee.number),
    );
    m.scope("door aprons", () => {
      for (const [a, b] of [[6.3, 8.3], [18.1, 20.1]]) {
        block(m, "green", c.X(a + 0.02), c.X(b - 0.02), 0.58, 0.92, -1.49, 1.49);
        for (const s of sides) block(m, "steel", c.X(a + 0.05), c.X(b - 0.05), 0.42, 0.47, ...side(s, 1.2, 1.46));
      }
    });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const wall = e > 0 ? 26.2 : 0.2;
      const head = e > 0 ? 26.4 : 0;
      const fb = (b: PxBox) => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      m.scope("gangway", () => gangway(c, e, wall, head + -e * 0.01, H));
      m.scope("end door", () => {
        c.door(body, e, fb([9, 19, 21, 37]), "green", { end: true });
        for (const [k, b] of ([[10, 20, 13, 29], [17, 20, 20, 29]] as PxBox[]).entries())
          m.scope(`window ${k + 1}`, () => c.window(body, e, fb(b), { end: true, fw: 0.04 }));
      });
      m.scope("tail lamps", () => {
        for (const [k, z] of [-1, 1].entries()) m.scope(`lamp ${k + 1}`, () => lamp(c, body, e, z * 1.0, 2.7, 0.09, "lampRed"));
      });
      m.scope("headstock", () => headstock(c, e, wall, 0.66, 0.92, 1.4));
      m.scope("buffers", () => c.buffers(e, head, wall));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, wall));
      m.scope("steps", () => {
        const [x0, x1] = e > 0 ? [25.2, 25.9] : [0.3, 1.0];
        for (const s of sides) block(m, "steel", c.X(x0), c.X(x1), 0.6, 0.64, ...side(s, 1.2, 1.45));
      });
    });
  m.scope("underframe", () => {
    block(m, "underframe", c.X(1.0), c.X(25.4), 0.72, 0.9, -1.2, 1.2);
    for (const poly of [
      [[8.9, 0.4], [11, 0.4], [11, 0.9], [8.9, 0.9]],
      [[12.5, 0.4], [15.5, 0.4], [15.5, 0.9], [12.2, 0.9], [12.2, 0.7]],
      [[15.8, 0.4], [16.9, 0.4], [16.9, 0.9], [15.8, 0.9]],
    ] as Pt[][])
      c.sideSweep("underframe", poly, -1.15, 1.15);
  });
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.bogie(3.7, 2.5, 0.45, 0.9));
    m.scope("bogie 2", () => c.bogie(22.7, 2.5, 0.45, 0.9));
  });
  m.scope("roof equipment", () =>
    roofVents(c, [[0.8, 1.5], [3.9, 4.5], [9.7, 10.3], [12.9, 13.5], [16.1, 16.7], [21.9, 22.5], [25.0, 25.6]], 3.9, 4.1, 0.3, "steel"),
  );
  return m;
}

// --- Balm (19.1 m railcar trailer, rounded ends) -------------------------------

export function csdBalm(): MeshBuilder {
  const H = 4;
  const c = new Coach(
    {
      cream: { color: "#e9e6bd", roughness: 0.55 },
      red: { color: "#8c1519", roughness: 0.5 },
      moulding: { color: "#8f8780", roughness: 0.6 },
      frame: { color: "#c0c7c0", metallic: 0.2, roughness: 0.45 },
    },
    9.55,
  );
  const m = c.m;
  const body: Volume = {
    name: "body",
    section: [[-1.4, 0.5], [-1.3, 0.4], [1.3, 0.4], [1.4, 0.5], [1.5, 0.8], [1.5, 3.2], [1.4, 3.5], [1.2, 3.6], [0, 3.7], [-1.2, 3.6], [-1.4, 3.5], [-1.5, 3.2], [-1.5, 0.8]],
    plan: [[0.4, 0.6], [0.5, 1.1], [0.7, 1.4], [1.2, 1.5], [17.9, 1.5], [18.4, 1.4], [18.6, 1.0], [18.7, 0.6]],
    top: [[0.4, 1.9], [0.5, 3.2], [0.7, 3.4], [1.2, 3.6], [2.0, 3.7], [17.1, 3.7], [17.9, 3.6], [18.4, 3.4], [18.6, 3.2], [18.7, 1.9]],
    bottom: [[0.4, 0.8], [18.7, 0.8]],
    bands: [[0.8, 0.9, "cream"], [0.9, 1.7, "red"], [1.7, 1.8, "moulding"], [1.8, 3.8, "cream"]],
  };
  m.scope("body", () => {
    c.volume(body);
    onSides(
      c,
      windows(c, body, H, [
        [14, 10, 21, 21], [24, 10, 37, 21], [40, 10, 53, 21], [[69, 10, 74, 21], "frosted"], [81, 10, 94, 21],
        [97, 10, 110, 21], [113, 10, 126, 21], [138, 10, 151, 21], [154, 10, 167, 21], [170, 10, 177, 21],
      ], { fw: 0.07, sash: (b) => (b.x1 - b.x0 > 0.6 ? 2.42 : undefined) }),
      doors(c, body, H, [
        { box: [55, 10, 63, 31], glass: [[57, 11, 61, 21]] },
        { box: [128, 10, 136, 31], glass: [[130, 11, 134, 21]] },
      ], "bands", { fw: 0.04 }),
      (s) => m.scope("gutter", () => c.sidePanel(body, "frame", s, px([12, 8, 179, 9], H), 0.02, 0.05)),
      (s) =>
        m.scope("class marks", () => {
          for (const x of [7.0, 12.25]) c.numeral(body, s, "2", x, 1.12, 0.48);
        }),
      numberPlate(c, body, 9.55, 1.15, RUNNING_NUMBERS.balm.number, 0.1),
    );
    m.scope("skirts", () => {
      c.sideSweep("cream", [[5.0, 0.8], [14.1, 0.8], [13.8, 0.4], [5.3, 0.4]], -1.45, 1.45);
      c.sideSweep("underframe", [[0.6, 0.5], [1.1, 0.5], [1.3, 0.8], [0.4, 0.8], [0.5, 0.6]], -0.95, 0.95);
      c.sideSweep("underframe", [[18.0, 0.5], [18.5, 0.5], [18.6, 0.6], [18.7, 0.8], [17.8, 0.8]], -0.95, 0.95);
    });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const nose = e > 0 ? 18.7 : 0.4;
      const head = e > 0 ? 19.1 : 0;
      const fb = (b: Box) => (e > 0 ? mirror(b) : b);
      // the wrap-round cab windows: the native front boxes, trimmed to the
      // facets behind the 0.1 m nose tip (|z| >= 0.62)
      m.scope("front windows", () => {
        for (const [k, b] of ([{ ...fpx([0, 10, 10, 21], H), x1: -0.62 }, { ...fpx([20, 10, 30, 21], H), x0: 0.62 }] as Box[]).entries())
          m.scope(`window ${k + 1}`, () => c.window(body, e, fb(b), { end: true, fw: 0.07 }));
      });
      m.scope("end door", () => {
        c.door(body, e, fb(fpx([11, 10, 19, 30], H)), "bands", { end: true });
        m.scope("window", () => c.window(body, e, fb(fpx([13, 11, 17, 18], H)), { end: true, fw: 0.04 }));
      });
      m.scope("lamps", () => {
        for (const [k, z] of [-0.95, 0.95].entries()) m.scope(`lamp ${k + 1}`, () => lamp(c, body, e, z, 1.45, 0.11, "lampHead"));
      });
      m.scope("buffers", () => c.buffers(e, head, nose + e * 0.05, 0.9));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, nose + e * 0.05, 0.9));
    });
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.bogie(3.2, 2.1, 0.42, 0.8));
    m.scope("bogie 2", () => c.bogie(15.9, 2.1, 0.42, 0.8));
  });
  m.scope("roof equipment", () =>
    roofVents(c, [[2.5, 3.2], [4.4, 5.1], [6.3, 7.0], [8.2, 8.9], [10.1, 10.8], [12.0, 12.7], [13.9, 14.6], [15.8, 16.5]], 3.62, 3.8, 0.2, "cream"),
  );
  return m;
}

// --- Bam (22.2 m trailer, red with a cream window band) -------------------------

export function csdBam(): MeshBuilder {
  const H = 4;
  const c = new Coach(
    {
      red: { color: "#80291f", roughness: 0.55 },
      cream: { color: "#d0cfaf", roughness: 0.55 },
      roof: { color: "#5a545a", roughness: 0.75 },
      frame: { color: "#4f484f", metallic: 0.2, roughness: 0.5 },
    },
    11.15,
  );
  const m = c.m;
  const body: Volume = {
    name: "body",
    section: [[-1.4, 0.6], [-1.3, 0.5], [-1.1, 0.4], [1.1, 0.4], [1.3, 0.5], [1.4, 0.6], [1.5, 0.9], [1.5, 3.2], [1.4, 3.5], [1.3, 3.6], [1, 3.7], [0, 3.8], [-1, 3.7], [-1.3, 3.6], [-1.4, 3.5], [-1.5, 3.2], [-1.5, 0.9]],
    plan: [[0.7, 1.1], [0.8, 1.3], [1.0, 1.4], [2.1, 1.5], [20.2, 1.5], [21.3, 1.4], [21.5, 1.3], [21.6, 1.1]],
    top: [[0.7, 3.4], [0.8, 3.6], [1.0, 3.7], [1.6, 3.8], [20.7, 3.8], [21.3, 3.7], [21.5, 3.6], [21.6, 3.4]],
    bottom: [[0.7, 0.9], [21.6, 0.9]],
    bands: [[0.9, 2.0, "red"], [2.0, 3.2, "cream"], [3.2, 3.9, "roof"]],
  };
  m.scope("body", () => {
    c.volume(body);
    onSides(
      c,
      windows(c, body, H, Array.from({ length: 12 }, (_, k): PxBox => [24 + 15 * k, 10, 34 + 15 * k, 19]), { fw: 0.07 }),
      doors(c, body, H, [
        { box: [12, 8, 20, 31], glass: [[13, 9, 19, 19]] },
        { box: [203, 8, 211, 31], glass: [[204, 9, 210, 19]] },
      ], "bands", { fw: 0.04 }),
      (s) =>
        m.scope("class marks", () => {
          for (const x of [4.35, 17.85]) c.numeral(body, s, "2", x, 1.45, 0.4);
        }),
      numberPlate(c, body, 11.15, 1.32, RUNNING_NUMBERS.bam.number),
    );
    m.scope("skirts", () => {
      c.sideSweep("red", [[10.1, 0.4], [12.8, 0.4], [13.0, 0.9], [9.9, 0.9]], -1.45, 1.45);
      c.sideSweep("red", [[1.1, 0.5], [1.2, 0.5], [1.2, 0.9], [0.7, 0.9], [0.9, 0.6]], -1.05, 1.05);
      c.sideSweep("red", [[21.1, 0.5], [21.2, 0.5], [21.4, 0.6], [21.6, 0.9], [21.1, 0.9]], -1.05, 1.05);
      for (const [a, b] of [[1.2, 2.0], [20.3, 21.1]])
        for (const s of sides) for (const y of [0.45, 0.68]) block(m, "steel", c.X(a), c.X(b), y, y + 0.04, ...side(s, 1.15, 1.45));
    });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const nose = e > 0 ? 21.6 : 0.7;
      const head = e > 0 ? 22.25 : 0.05;
      const fb = (b: PxBox) => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      m.scope("end windows", () => {
        for (const [k, b] of ([[4, 10, 10, 19], [20, 10, 26, 19]] as PxBox[]).entries())
          m.scope(`window ${k + 1}`, () => c.window(body, e, fb(b), { end: true, fw: 0.06 }));
      });
      m.scope("end door", () => {
        c.door(body, e, fb([11, 8, 19, 27]), "bands", { end: true });
        m.scope("window", () => c.window(body, e, fb([12, 10, 18, 19]), { end: true, fw: 0.04 }));
      });
      m.scope("gangway", () => {
        // a short box frame from the nose out to 0.3 m behind the buffer heads
        const [a, b] = [c.X(nose) - e * 0.02, c.X(nose) + e * 0.4].sort((p, q) => p - q) as [number, number];
        block(m, "steel", a, b, 1.2, 1.3, -0.4, 0.4);
        for (const z of [-1, 1]) block(m, "underframe", a, b, 1.3, 2.4, ...side(z, 0.4, 0.45));
      });
      m.scope("lamps", () => {
        for (const [k, z] of [-0.95, 0.95].entries()) m.scope(`lamp ${k + 1}`, () => lamp(c, body, e, z, 1.55, 0.08, "lampHead"));
      });
      m.scope("headstock", () => headstock(c, e, nose + e * 0.1, 0.8, 1.12, 1.15));
      m.scope("buffers", () => c.buffers(e, head, nose - e * 0.3));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, nose - e * 0.3));
    });
  m.scope("underframe", () => {
    block(m, "underframe", c.X(5.7), c.X(16.6), 0.7, 0.88, -1.1, 1.1);
    for (const [a, b] of [[6.4, 7.8], [8.0, 9.6]]) block(m, "underframe", c.X(a), c.X(b), 0.4, 0.7, -1.0, 1.0);
  });
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.bogie(3.75, 2.8, 0.42, 0.9));
    m.scope("bogie 2", () => c.bogie(18.55, 2.8, 0.42, 0.9));
  });
  return m;
}

// --- Be31 (15.5 m two-axle coach with end vestibules) ----------------------------

export function csdBe31(): MeshBuilder {
  const H = 4;
  const c = new Coach(
    {
      green: { color: "#0f5a42", roughness: 0.55 },
      roof: { color: "#8b8d96", roughness: 0.75 },
      solebar: { color: "#6f7080", roughness: 0.7 },
      frame: { color: "#0b3a2c", roughness: 0.5 },
    },
    7.8,
  );
  const m = c.m;
  const rect = (hw: number, y0: number, y1: number): Pt[] => [[hw, y0], [-hw, y0], [-hw, y1], [hw, y1]];
  const main: Volume = { name: "main", section: rect(1.5, 1.1, 3.3), plan: [[1.4, 1.5], [14.2, 1.5]], bands: [[1.1, 3.3, "green"]] };
  const vest = (a: number, b: number): Volume => ({ name: "vestibule", section: rect(1.2, 1.1, 3.3), plan: [[a, 1.2], [b, 1.2]], bands: [[1.1, 3.3, "green"]] });
  const vestibules = [vest(0.4, 1.4), vest(14.2, 15.2)];
  const roof: Volume = {
    name: "roof",
    section: [[-1.5, 3.3], [-1.4, 3.5], [-1.3, 3.6], [-1, 3.7], [0, 3.8], [1, 3.7], [1.3, 3.6], [1.4, 3.5], [1.5, 3.3]],
    plan: [[0.4, 1.2], [0.6, 1.4], [1.4, 1.5], [14.2, 1.5], [15.0, 1.4], [15.2, 1.2]],
    top: [[0.4, 3.3], [0.5, 3.6], [0.7, 3.7], [1.2, 3.8], [14.4, 3.8], [14.9, 3.7], [15.1, 3.6], [15.2, 3.3]],
    bands: [[3.3, 3.9, "roof"]],
  };
  m.scope("body", () => {
    m.scope("main", () => c.volume(main));
    m.scope("vestibules", () => vestibules.forEach((v) => c.volume(v)));
    m.scope("roof", () => c.volume(roof));
    onSides(
      c,
      windows(c, main, H, [[[15, 9, 21, 18], "frosted"], ...Array.from({ length: 7 }, (_, k): PxBox => [26 + 17 * k, 9, 37 + 17 * k, 18])], { fw: 0.07 }),
      (s) =>
        [
          { v: vestibules[0]!, box: [5, 7, 14, 29] as PxBox, glass: [7, 8, 12, 18] as PxBox },
          { v: vestibules[1]!, box: [142, 7, 151, 29] as PxBox, glass: [144, 8, 149, 18] as PxBox },
        ].forEach((d, i) =>
          m.scope(`vestibule door ${i + 1}`, () => {
            c.door(d.v, s, px(d.box, H), "green");
            m.scope("window", () => c.window(d.v, s, px(d.glass, H), { fw: 0.04 }));
          }),
        ),
      (s) =>
        m.scope("class marks", () => {
          for (const x of [3.25, 12.15]) c.numeral(main, s, "2", x, 1.48, 0.4);
        }),
      numberPlate(c, main, 8.2, 1.45, RUNNING_NUMBERS.be31.number, 0.1),
      // the ventilator hood over each compartment window: native rows 7..8
      // (the hoods of the Ce 3-2252 detail photograph)
      (s) =>
        m.scope("window hoods", () => {
          for (let k = 0; k < 7; k++) c.sidePanel(main, "frame", s, px([29 + 17 * k, 7, 34 + 17 * k, 9], H), 0.05, 0.06);
        }),
    );
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const v = vestibules[e > 0 ? 1 : 0]!;
      const fb = (b: PxBox) => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      const head = e > 0 ? 15.55 : 0.05;
      const wall = e > 0 ? 15.2 : 0.4;
      m.scope("end door", () => {
        c.door(v, e, fb([11, 7, 19, 29]), "green", { end: true });
        m.scope("window", () => c.window(v, e, fb([12, 9, 18, 18]), { end: true, fw: 0.04 }));
      });
      m.scope("lamps", () => {
        for (const [k, z] of [-0.95, 0.95].entries()) m.scope(`lamp ${k + 1}`, () => lamp(c, v, e, z, 1.65, 0.08, "lampHead"));
      });
      m.scope("buffers", () => c.buffers(e, head, wall));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, wall));
      m.scope("steps", () => {
        const [x0, x1] = e > 0 ? [14.2, 15.3] : [0.3, 1.4];
        for (const s of sides) {
          for (const y of [0.35, 0.65]) block(m, "steel", c.X(x0), c.X(x1), y, y + 0.05, ...side(s, 1.1, 1.45));
          for (const x of [x0 + 0.03, x1 - 0.09]) block(m, "underframe", c.X(x), c.X(x + 0.06), 0.33, 1.1, ...side(s, 1.12, 1.2));
        }
        block(m, "underframe", c.X(x0 + 0.1), c.X(x1 - 0.1), 0.9, 1.1, -1.2, 1.2);
      });
    });
  m.scope("underframe", () => {
    for (const s of sides) block(m, "solebar", c.X(0.3), c.X(15.3), 0.9, 1.1, ...side(s, 1.3, 1.48));
    block(m, "underframe", c.X(0.3), c.X(15.3), 0.9, 1.1, -0.95, 0.95);
    const tank = ngon(12, 0.2, 0, c.X(10.5), 0.55);
    m.sweep("underframe", "z", tank, -1.0, tank, 1.0);
  });
  m.scope("running gear", () => {
    m.scope("axle 1", () => c.axle(3.1, 0.45, 0.95));
    m.scope("axle 2", () => c.axle(12.5, 0.45, 0.95));
  });
  return m;
}

// --- Bi20 (12.6 m compartment coach with open end platforms) --------------------

export function csdBi20(): MeshBuilder {
  const H = 4;
  const c = new Coach(
    {
      green: { color: "#0f5c43", roughness: 0.55 },
      roof: { color: "#9a9a9a", roughness: 0.75 },
      brass: { color: "#b39316", metallic: 0.4, roughness: 0.4 },
      seam: { color: "#003a29", roughness: 0.8 },
      floor: { color: "#5b4a36", roughness: 0.85 },
      rail: { color: "#444444", metallic: 0.2, roughness: 0.6 },
    },
    6.3,
  );
  const m = c.m;
  const body: Volume = {
    name: "body",
    section: [[-1.2, 0.4], [1.2, 0.4], [1.4, 0.8], [1.4, 3.3], [-1.4, 3.3], [-1.4, 0.8]],
    plan: [[1.1, 1.4], [11.5, 1.4]],
    bottom: [[1.1, 0.8], [11.5, 0.8]],
    bands: [[0.8, 3.3, "green"]],
    endPaint: "green",
  };
  const roof: Volume = {
    name: "roof",
    section: [[-1.5, 3.3], [-1.3, 3.6], [-1, 3.7], [-0.45, 3.8], [0.45, 3.8], [1, 3.7], [1.3, 3.6], [1.5, 3.3]],
    plan: [[0.3, 1.2], [0.6, 1.4], [1.1, 1.5], [11.5, 1.5], [12.0, 1.4], [12.3, 1.2]],
    bands: [[3.3, 3.9, "roof"]],
  };
  const platform = (a: number, b: number, ha: number, hb: number): Volume => ({
    name: "platform",
    section: [[-1.4, 0.9], [1.4, 0.9], [1.4, 1.1], [-1.4, 1.1]],
    plan: [[a, ha], [b, hb]],
    bands: [[0.9, 1.05, "underframe"], [1.05, 1.1, "floor"]],
  });
  m.scope("body", () => {
    m.scope("compartments", () => c.volume(body));
    m.scope("roof", () => c.volume(roof));
    m.scope("platforms", () => {
      c.volume(platform(0.3, 1.1, 1.2, 1.4));
      c.volume(platform(11.5, 12.3, 1.4, 1.2));
    });
    onSides(
      c,
      doors(c, body, H, Array.from({ length: 6 }, (_, k) => ({ box: [16 + 17 * k, 7, 25 + 17 * k, 28] as PxBox, glass: [[17 + 17 * k, 9, 24 + 17 * k, 19] as PxBox] })), "green", { frame: "brass", fw: 0.06 }),
      // the brass class numerals on the end compartments' doors (native rows 21-24)
      (s) =>
        m.scope("class marks", () => {
          for (const x of [2.05, 10.55]) c.numeral(body, s, "2", x, 1.55, 0.4, 0.015);
        }),
      // on the panel between the third and fourth compartment doors
      numberPlate(c, body, 6.25, 1.5, RUNNING_NUMBERS.bi20.number, 0.09),
    );
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const fb = (b: PxBox) => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      const outer = e > 0 ? 12.3 : 0.3;
      m.scope("end door", () => {
        c.door(body, e, fb([10, 7, 20, 28]), "green", { end: true });
        m.scope("window", () => c.window(body, e, fb([12, 9, 18, 19]), { end: true, frame: "brass", fw: 0.05 }));
      });
      m.scope("railings", () => {
        const [p0, p1] = [c.X(outer), c.X(outer) + e * 0.1].sort((p, q) => p - q) as [number, number];
        for (const s of sides) {
          block(m, "rail", p0, p1, 1.1, 3.3, ...side(s, 1.0, 1.1));
          block(m, "rail", p0, p1, 1.1, 2.1, ...side(s, 0.3, 0.4));
          const [q0, q1] = [c.X(outer), c.X(e > 0 ? 11.5 : 1.1)].sort((p, q) => p - q) as [number, number];
          block(m, "rail", q0, q1, 2.1, 2.16, ...side(s, 1.3, 1.36));
          const gx = c.X(outer) - e * 0.65;
          block(m, "rail", gx - 0.025, gx + 0.025, 1.1, 2.1, ...side(s, 1.3, 1.36));
        }
        block(m, "rail", p0, p1, 2.1, 2.2, -1.0, 1.0);
      });
      // three side steps under each platform: native rows 31, 33 and 35
      m.scope("steps", () => {
        const [x0, x1] = e > 0 ? [11.55, 12.25] : [0.35, 1.05];
        for (const s of sides) {
          for (const y of [0.44, 0.64, 0.84]) block(m, "steel", c.X(x0), c.X(x1), y, y + 0.04, ...side(s, 1.0, 1.36));
          for (const x of [x0 + 0.02, x1 - 0.06]) block(m, "underframe", c.X(x), c.X(x + 0.04), 0.42, 0.9, ...side(s, 1.02, 1.3));
        }
      });
      m.scope("buffers", () => c.buffers(e, e > 0 ? 12.6 : 0, outer));
      m.scope("coupling", () => c.coupling(e, (e > 0 ? 12.6 : 0) + -e * 0.02, outer));
    });
  m.scope("underframe", () => {
    for (const s of sides) c.sideSweep("underframe", [[4.5, 0.8], [6.4, 0.5], [8.3, 0.8]], ...side(s, 1.15, 1.22));
    block(m, "underframe", c.X(6.35), c.X(6.45), 0.5, 0.8, -1.2, 1.2);
    // the long footboard under the compartment doors: the native side's dark line
    // at 1.0..1.1 m (rows 29..30), as on compartment coaches (photo, type reference)
    for (const s of sides) {
      block(m, "floor", c.X(1.5), c.X(11.1), 0.94, 0.98, ...side(s, 1.36, 1.54));
      for (const x of [1.7, 4.2, 6.3, 8.4, 10.9]) block(m, "underframe", c.X(x) - 0.03, c.X(x) + 0.03, 0.82, 0.94, ...side(s, 1.3, 1.5));
    }
  });
  m.scope("running gear", () => {
    m.scope("axle 1", () => c.axle(2.4, 0.45, 0.8));
    m.scope("axle 2", () => c.axle(10.3, 0.45, 0.8));
  });
  return m;
}

// --- Dsk (10.5 m two-axle luggage van) ------------------------------------------

export function csdDsk(): MeshBuilder {
  const H = 4;
  const c = new Coach(
    {
      green: { color: "#0d5838", roughness: 0.6 },
      roof: { color: "#8a8a8a", roughness: 0.75 },
      frame: { color: "#0f7a4e", roughness: 0.5 },
      post: { color: "#032010", roughness: 0.8 },
      floor: { color: "#5b4a36", roughness: 0.85 },
      rail: { color: "#9a9a9a", metallic: 0.2, roughness: 0.6 },
    },
    5.25,
  );
  const m = c.m;
  const body: Volume = {
    name: "body",
    section: [[1.4, 0.8], [-1.4, 0.8], [-1.4, 3.3], [1.4, 3.3]],
    plan: [[0.6, 1.4], [9.1, 1.4]],
    bands: [[0.8, 3.3, "green"]],
    endPaint: "green",
  };
  const roof: Volume = {
    name: "roof",
    section: [[-1.5, 3.3], [-1.3, 3.6], [-1, 3.7], [-0.4, 3.8], [0.4, 3.8], [1, 3.7], [1.3, 3.6], [1.5, 3.3]],
    plan: [[0.6, 1.5], [10.0, 1.5]],
    bands: [[3.3, 3.9, "roof"]],
  };
  const floor: Volume = {
    name: "platform",
    section: [[1.4, 0.8], [-1.4, 0.8], [-1.4, 1.2], [1.4, 1.2]],
    plan: [[9.1, 1.4], [10.0, 1.4]],
    bands: [[0.8, 1.15, "underframe"], [1.15, 1.2, "floor"]],
  };
  m.scope("body", () => {
    m.scope("van", () => c.volume(body));
    m.scope("roof", () => c.volume(roof));
    m.scope("platform", () => c.volume(floor));
    onSides(c, windows(c, body, H, [[8, 10, 15, 20], [29, 10, 36, 20], [60, 10, 67, 20]], { fw: 0.08 }), numberPlate(c, body, 1.1, 1.5, RUNNING_NUMBERS.dsk.number, 0.09, 0.009), (s) => {
        m.scope("sliding door", () => {
          c.door(body, s, px([39, 8, 57, 28], H), "green");
          c.sidePanel(body, "post", s, { x0: 4.75, y0: 1.225, x1: 4.85, y1: 3.175 }, 0.016);
          c.sidePanel(body, "post", s, { x0: 3.8, y0: 3.2, x1: 5.8, y1: 3.26 }, 0.03);
        });
        m.scope("framing", () => {
          for (const b of [[16, 8, 17, 28], [27, 8, 28, 28], [37, 8, 39, 28], [57, 8, 59, 28], [68, 8, 69, 28], [79, 8, 80, 28]] as PxBox[])
            c.sidePanel(body, "post", s, px(b, H), 0.012);
          c.sidePanel(body, "post", s, { ...px([6, 7, 91, 8], H), y0: 3.205 }, 0.012);
          // the diagonal braces of the two framed panels
          const z = s * 1.412;
          for (const [a, b] of [[[1.72, 1.25], [2.62, 3.15]], [[6.92, 3.15], [7.82, 1.25]]] as Array<[Pt, Pt]>) {
            const w = 0.05;
            m.slab("post", [[c.X(a[0]) - w, a[1], z], [c.X(a[0]) + w, a[1], z], [c.X(b[0]) + w, b[1], z], [c.X(b[0]) - w, b[1], z]], [0, 0, -s * 0.03]);
          }
          for (let y = 1.41; y < 3.15; y += 0.2) c.sidePanel(body, "post", s, { x0: 0.62, y0: y, x1: 9.08, y1: y + 0.012 }, 0.004, 0.02);
        });
    });
    m.scope("duckets", () => {
      for (const s of sides)
        m.scope(sideName(s), () => {
          const inner: Pt[] = [[c.X(8.0), 2.0], [c.X(9.1), 2.0], [c.X(9.1), 3.2], [c.X(8.0), 3.2]];
          const outer: Pt[] = [[c.X(8.3), 2.0], [c.X(8.8), 2.0], [c.X(8.8), 3.0], [c.X(8.3), 3.0]];
          // the XML face is at 1.6 m; 1.535 m keeps the van inside the 3.1 m envelope
          const f = 1.535;
          if (s > 0) m.sweep("green", "z", inner, 1.38, outer, f);
          else m.sweep("green", "z", outer, -f, inner, -1.38);
          m.scope("window", () => {
            // native z_both: glass columns 83..86, rows 12..18 (x 8.3..8.7, y 2.1..2.8)
            m.slab("frame", [[c.X(8.305), 2.05, s * (f + 0.006)], [c.X(8.795), 2.05, s * (f + 0.006)], [c.X(8.795), 2.95, s * (f + 0.006)], [c.X(8.305), 2.95, s * (f + 0.006)]], [0, 0, -s * 0.03]);
            m.slab("glass", [[c.X(8.32), 2.1, s * (f + 0.012)], [c.X(8.7), 2.1, s * (f + 0.012)], [c.X(8.7), 2.8, s * (f + 0.012)], [c.X(8.32), 2.8, s * (f + 0.012)]], [0, 0, -s * 0.004]);
          });
        });
    });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const fb = (b: PxBox) => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      if (e > 0) {
        m.scope("end door", () => {
          c.door(body, e, fb([11, 7, 19, 28]), "green", { end: true });
          m.scope("window", () => c.window(body, e, fb([12, 8, 18, 17]), { end: true, fw: 0.05 }));
        });
        m.scope("end framing", () => diagonals(c, 1, 9.1, [[[3, 10], [10, 24]], [[26, 10], [19, 24]]], H, 1.38));
        m.scope("railings", () => {
          const [p0, p1] = [c.X(9.8), c.X(9.9)];
          for (const s of sides) block(m, "rail", p0, p1, 1.2, 3.3, ...side(s, 1.2, 1.3));
          block(m, "rail", p0, p1, 2.1, 2.2, -1.3, 1.3);
          block(m, "green", p0, p1, 1.2, 2.1, -0.6, 0.6);
          for (const s of sides) block(m, "rail", c.X(9.15), c.X(9.85), 2.1, 2.16, ...side(s, 1.3, 1.36));
        });
      } else
        m.scope("end framing", () => {
          for (const b of [[9, 7, 10, 28], [20, 7, 21, 28]] as PxBox[]) c.endPanel(body, "post", e, fb(b), 0.012);
          // the three diagonal braces of x_dec, pixel (u, v) pairs, u = 10 * (z + 1.5)
          diagonals(c, -1, 0.6, [[[1, 8], [9, 25]], [[10, 8], [18, 25]], [[21, 12], [28, 26]]], H, 1.38);
        });
      const head = e > 0 ? 10.5 : 0;
      const beam = e > 0 ? 10.0 : 0.6;
      m.scope("buffers", () => c.buffers(e, head, beam));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, beam));
    });
  m.scope("underframe", () => {
    for (const poly of [
      [[4.0, 0.5], [5.8, 0.5], [5.7, 0.8], [4.1, 0.8]],
      [[2.7, 0.4], [3.7, 0.4], [3.7, 0.8], [2.7, 0.8]],
      [[6.1, 0.6], [7.4, 0.4], [7.5, 0.8], [5.9, 0.8]],
    ] as Pt[][])
      c.sideSweep("underframe", poly, -1.0, 1.0);
    // the platform's side steps (XML base 8.9..9.8 x 0.4..0.8; native rows 31 and 35)
    for (const s of sides) {
      for (const y of [0.42, 0.82]) block(m, "steel", c.X(9.05), c.X(9.75), y, y + 0.04, ...side(s, 1.0, 1.36));
      for (const x of [9.07, 9.69]) block(m, "underframe", c.X(x), c.X(x + 0.04), 0.4, 0.8, ...side(s, 1.02, 1.3));
    }
  });
  m.scope("running gear", () => {
    m.scope("axle 1", () => c.axle(1.9, 0.4, 0.8));
    m.scope("axle 2", () => c.axle(8.1, 0.4, 0.8));
  });
  return m;
}

/** The coach designs: ids, titles, builders, parameters, reference folders. */
export const CSD_COACHES = [
  { id: "proc-vehicle-csd-classic-green-coach", game: { weight: 40, power: 0, maxspeed: 140, accel: null }, title: "CSD Classic Green Coach", folder: "csd-classic-green", build: csdClassicGreenCoach, params: CLASSIC_GREEN_PARAMS },
  { id: "proc-vehicle-csd-balm", game: { weight: 29, power: 0, maxspeed: 120, accel: null }, title: "CSD Balm", folder: "csd-balm", build: csdBalm },
  { id: "proc-vehicle-csd-bam", game: { weight: 30, power: 0, maxspeed: 100, accel: null }, title: "CSD Bam", folder: "csd-bam", build: csdBam },
  { id: "proc-vehicle-csd-bdmtee", game: { weight: 46, power: 0, maxspeed: 160, accel: null }, title: "CSD Bdmtee", folder: "csd-bdmtee", build: csdBdmtee },
  { id: "proc-vehicle-csd-be31", game: { weight: 20, power: 0, maxspeed: 80, accel: null }, title: "CSD Be31", folder: "csd-be31", build: csdBe31 },
  { id: "proc-vehicle-csd-bi20", game: { weight: 10, power: 0, maxspeed: 80, accel: null }, title: "CSD Bi20", folder: "csd-bi20", build: csdBi20 },
  { id: "proc-vehicle-csd-dsk", game: { weight: 10, power: 0, maxspeed: 80, accel: null }, title: "CSD Dsk", folder: "csd-dsk", build: csdDsk },
] as const;
