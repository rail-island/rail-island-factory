// North American freight cars and the San Francisco cable car: a cupola
// caboose, a 50 ft boxcar and a double-stack well car (its `cargo` single by
// default, double reaching the US double-stack gauge), and the Powell Street
// cable car. Boxes drawn with the hood kit's painted sweeps (usHoodKit.ts),
// US trucks and knuckle couplers. See docs/models/us-freight.md.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { bogieGeometry, exhaust, paint, type BogieSpec } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { decalX, decalZ, knuckleCoupler, paintedSweep, sideText, US_PALETTE, type Band } from "./usHoodKit.ts";
import { WAGON_CATALOG } from "./wagons.ts";
import { coil, extrude } from "./dieselParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { TRAM_CATALOG } from "./trams.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";
import { bogieParts, fitUnit, type UnitBody } from "./lodUnits.ts";
import type { LodPart } from "./lodKit.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;
const COUPLER_Y = 0.88;

const freightTruck = (wheelR = ft(0, 16.5), wb = 1.45, bolster = 1.0): BogieSpec => ({
  axles: [-wb / 2, wb / 2], wheelR, frameHalf: wb / 2 + wheelR + 0.15, frameTop: wheelR + 0.38, frameBottom: wheelR + 0.06, frameZ: [0.9, 1.02], primary: "leaf",
  secondary: [-0.12, 0.12], secondaryZ: 0.96, bolster,
});

/** The freight truck's wheelbase is 1.45 m (a real 70-ton truck's 5 ft 8 in is 1.73 m), its brake cylinders clear of the transoms. */

/** Trucks at +-centre and knuckle couplers at both ends (the end sills at |x| = sill, the faces at length / 2). */
function runningGear(m: MeshBuilder, centre: number, sill: number, length: number, truck: BogieSpec): void {
  m.scope("trucks", () => {
    m.scope("front truck", () => m.bogie(() => bogieGeometry(m, centre, truck)));
    m.scope("rear truck", () => m.bogie(() => bogieGeometry(m, -centre, truck)));
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front coupler" : "rear coupler", () => knuckleCoupler(m, e, sill, length / 2, COUPLER_Y));
}

/** A box body along x from x0 to x1: its section (z, y), painted by height, both ends closed. */
const box = (half: number, y0: number, y1: number, r = 0.08): Array<[number, number]> => [[-half, y0], [half, y0], [half, y1 - r], [half - r, y1], [-(half - r), y1], [-half, y1 - r]];

/** A plain distant model: one body box, its roof, and the trucks. */
function boxLod(palette: Record<string, MaterialSpec>, x0: number, x1: number, y0: number, y1: number, half: number, side: readonly LodBand[], roof: string, centre: number, truck: BogieSpec, windows: UnitBody["windows"] = []): MeshBuilder {
  const body: UnitBody = { y0, hw: [[y0, half], [y1 - 0.1, half], [y1, half - 0.1]], side, roof, front: { tip: [[y0, x1]] }, rear: { tip: [[y0, x0]] }, windows };
  const parts: LodPart[] = bogieParts([[centre, truck.frameHalf], [-centre, truck.frameHalf]], y0);
  return fitUnit({ palette, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// Cupola caboose

export const CABOOSE_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "santaFe",
  values: [{ value: "santaFe", title: "Santa Fe" }, { value: "unionPacific", title: "Union Pacific" }],
}];
const CABOOSE_LIVERIES: Record<string, { body: string; trim: string; text: string; palette: Record<string, MaterialSpec> }> = {
  santaFe: { body: "cabRed", trim: "cabWhite", text: "SANTA FE", palette: { cabRed: paint("#9e2a23"), cabWhite: paint("#ecebe6") } },
  unionPacific: { body: "upYellow", trim: "upRed", text: "UNION PACIFIC", palette: { upYellow: paint("#f4b92a"), upRed: paint("#b5202b") } },
};
export const CABOOSE_LENGTH = ft(36);
const CB = { sill: 5.0, body: 4.0, half: 1.5, deck: 1.15, top: 3.85, cupola: { x0: -1.2, x1: 1.2, half: 1.15, top: 4.6 }, centre: 3.0 };

export function caboose(params?: ParamValues): MeshBuilder {
  const l = CABOOSE_LIVERIES[resolveParams(CABOOSE_PARAMS, params).livery!]!;
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette });
  const paintOf = { bands: [[0, 9, l.body]] as readonly Band[], roofFrom: CB.top - 0.04, roof: l.body };
  m.scope("frame", () => {
    block(m, "black", -CB.sill, CB.sill, 0.95, CB.deck, -1.5, 1.5);
    block(m, "walk", -CB.sill, CB.sill, CB.deck, CB.deck + 0.04, -1.45, 1.45);
  });
  m.scope("body", () => {
    paintedSweep(m, "x", box(CB.half, CB.deck + 0.04, CB.top, 0.12), -CB.body, CB.body, paintOf);
    m.scope("cupola", () => paintedSweep(m, "x", box(CB.cupola.half, CB.top - 0.05, CB.cupola.top, 0.08), CB.cupola.x0, CB.cupola.x1, { ...paintOf, roofFrom: CB.cupola.top - 0.04 }));
    m.scope("roof walk", () => block(m, "walk", -CB.body - 0.1, CB.body + 0.1, CB.top, CB.top + 0.05, -0.3, 0.3));
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        for (const x of [-2.6, 2.6]) {
          decalZ(m, "rubber", s * (CB.half + 0.004), s, x - 0.4, x + 0.4, 2.3, 3.0);
          decalZ(m, "glass", s * (CB.half + 0.008), s, x - 0.35, x + 0.35, 2.35, 2.95);
        }
        for (const x of [-0.6, 0.6]) {
          decalZ(m, "rubber", s * (CB.cupola.half + 0.004), s, x - 0.35, x + 0.35, 4.0, 4.4);
          decalZ(m, "glass", s * (CB.cupola.half + 0.008), s, x - 0.3, x + 0.3, 4.04, 4.36);
        }
        sideText(m, l.trim, l.text, s, CB.half + 0.008, 0, 1.6, 0.3);
        decalZ(m, l.trim, s * (CB.half + 0.004), s, -CB.body, CB.body, 1.2, 1.26);
      });
    for (const e of [1, -1])
      m.scope(e > 0 ? "front end" : "rear end", () => {
        const x = e * CB.body;
        decalX(m, "rubber", x + e * 0.004, e, -0.4, 0.4, 1.3, 3.2);
        decalX(m, "glass", x + e * 0.008, e, -0.25, 0.25, 2.4, 3.0);
        // the platform railing and the ladder to the roof
        const xr = e * (CB.sill - 0.08);
        for (const sd of [-1, 1]) {
          m.prism("handrail", ngon(6, 0.025, 0, xr, sd * 1.35), CB.deck, CB.deck + 1.0);
          m.rod("handrail", [xr, CB.deck + 1.0, sd * 1.35], [xr, CB.deck + 1.0, sd * 0.45], 0.022, 6);
          m.rod("handrail", [xr, CB.deck + 1.0, sd * 1.35], [e * CB.body, CB.deck + 1.0, sd * 1.35], 0.022, 6);
        }
        for (const z of [-0.95, -0.65]) m.rod("handrail", [x + e * 0.12, CB.deck, z], [x + e * 0.12, CB.top + 0.1, z], 0.02, 6);
        for (let y = CB.deck + 0.3; y < CB.top; y += 0.35) m.rod("handrail", [x + e * 0.12, y, -0.95], [x + e * 0.12, y, -0.65], 0.016, 6);
        // marker lamps at the corners
        for (const sd of [-1, 1]) m.sweep(e > 0 ? "lampHead" : "lampRed", "x", ngon(8, 0.07, 0, sd * 1.3, 3.5), Math.min(x, x + e * 0.12), ngon(8, 0.07, 0, sd * 1.3, 3.5), Math.max(x, x + e * 0.12));
        for (const sd of [-1, 1]) for (const y of [0.55, 0.85]) block(m, "steel", ...(e > 0 ? [CB.sill - 0.6, CB.sill - 0.1] : [-CB.sill + 0.1, -CB.sill + 0.6]) as [number, number], y, y + 0.03, ...side(sd, 1.0, 1.45));
      });
    m.scope("stove pipe", () => exhaust(m, 2.0, -0.6, CB.top - 0.05, CB.top + 0.45, 0.14, 0.14));
  });
  runningGear(m, CB.centre, CB.sill, CABOOSE_LENGTH, freightTruck());
  return m;
}

export function cabooseLod(params?: ParamValues): MeshBuilder {
  const l = CABOOSE_LIVERIES[resolveParams(CABOOSE_PARAMS, params).livery!]!;
  return boxLod({ ...US_PALETTE, ...l.palette }, -CB.sill, CB.sill, 0.95, CB.top, CB.half, [[0.95, CB.deck, "black"], [CB.deck, CB.top, l.body]], l.body, CB.centre, freightTruck(),
    [{ u: [-3.0, -2.2], y: [2.3, 3.0], mat: LOD_GLASS, optional: 2 }, { u: [2.2, 3.0], y: [2.3, 3.0], mat: LOD_GLASS, optional: 2 }]);
}

// ---------------------------------------------------------------------------
// 50 ft boxcar: a 1970s 70-ton Plate C car with exterior posts, a diagonal-panel
// roof and improved Dreadnaught ends, measured from assets/us-boxcar/ (Railbox
// 33646 side-on at 57.3 px/m, SP 245516 at 63 px/m). The livery chooses the
// car's doors: Southern Pacific's Hydra-Cushion car has a 16 ft double door,
// Railbox's car a 10 ft single door, painted black. Along a side, u runs from the
// viewer's left to right (x = s * u), so both sides read alike.

export const BOXCAR_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "boxcarRed",
  values: [{ value: "boxcarRed", title: "Boxcar red" }, { value: "railbox", title: "Railbox" }],
}];
type BxUV = [number, number];
/** One painted mark on the sides: triangles in (u, v), a material, and a layer (0.003 m apart). */
interface BxMark { mat: string; tris: BxUV[]; layer?: number; /** Off the sheathing by this much instead (the side sill), not repeated on the posts. */ z?: number }
interface BoxcarLivery {
  body: string; door: string;
  palette: Record<string, MaterialSpec>;
  /** Door leaves [u0, u1], the door track's reach, the edge the lock bars stand at (per leaf). */
  leaves: ReadonlyArray<readonly [number, number]>; track: readonly [number, number]; locks: readonly number[];
  /** The exterior posts' |u| from the door outward (the first is the door post); the door's ribs. */
  posts: readonly number[]; ribs: number;
  marks: () => BxMark[];
}
export const BOXCAR_LENGTH = ft(55, 4);
const BX = { sill: 7.95, body: 7.85, half: 1.49, bottom: 0.86, sheet: 1.02, eave: 4.42, ridge: ft(15, 1), centre: ft(40, 6) / 2, post: 0.07, doorIn: 0.075, doorOut: 0.1, doorTop: 4.3, doorFoot: 0.98 };
const bxPosts = (first: number, pitch: number, n: number): number[] => Array.from({ length: n }, (_, i) => Math.round((first + i * pitch) * 1000) / 1000);

/** Bars along polylines in (u, v), `stroke` wide, as triangles (strokeText's construction). */
function bxBars(lines: ReadonlyArray<ReadonlyArray<BxUV>>, stroke: number): BxUV[] {
  const out: BxUV[] = [];
  for (const line of lines)
    for (let j = 1; j < line.length; j++) {
      const [[x0, y0], [x1, y1]] = [line[j - 1]!, line[j]!];
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      const [dx, dy] = [((x1 - x0) / len) * (stroke / 2), ((y1 - y0) / len) * (stroke / 2)];
      const q: BxUV[] = [[x0 - dx - dy, y0 - dy + dx], [x0 - dx + dy, y0 - dy - dx], [x1 + dx + dy, y1 + dy - dx], [x1 + dx - dy, y1 + dy + dx]];
      for (const k of [0, 1, 2, 0, 2, 3]) out.push(q[k]!);
    }
  return out;
}

/** Railbox's lower-case letters: centre lines in a unit cell (x-height 0 .. 1, ascenders to 1.5). */
const BX_GLYPHS: Record<string, BxUV[][]> = {
  r: [[[0.15, 0.15], [0.15, 0.85], [0.88, 0.85]]],
  a: [[[0.15, 0.85], [0.85, 0.85], [0.85, 0.15], [0.15, 0.15], [0.15, 0.5], [0.85, 0.5]]],
  i: [[[0.5, 0.15], [0.5, 0.85]], [[0.5, 1.15], [0.5, 1.3]]],
  l: [[[0.5, 0.15], [0.5, 1.4]]],
  b: [[[0.15, 1.5], [0.15, 0.15], [0.85, 0.15], [0.85, 0.85], [0.15, 0.85]]],
  o: [[[0.15, 0.15], [0.85, 0.15], [0.85, 0.85], [0.15, 0.85], [0.15, 0.15]]],
  x: [[[0.12, 0.15], [0.88, 0.85]], [[0.12, 0.85], [0.88, 0.15]]],
  n: [[[0.15, 0.15], [0.15, 0.85], [0.85, 0.85], [0.85, 0.15]]],
  e: [[[0.85, 0.15], [0.15, 0.15], [0.15, 0.85], [0.85, 0.85], [0.85, 0.5], [0.15, 0.5]]],
  t: [[[0.4, 1.3], [0.4, 0.15], [0.8, 0.15]], [[0.1, 0.85], [0.8, 0.85]]],
  d: [[[0.85, 1.5], [0.85, 0.15], [0.15, 0.15], [0.15, 0.85], [0.85, 0.85]]],
  y: [[[0.15, 0.85], [0.15, 0.15], [0.85, 0.15]], [[0.85, 0.85], [0.85, -0.5], [0.15, -0.5]]],
};
/** One glyph in the box u0 .. u1, x-height xh from v0, leaning `slant` (u per v). */
const bxGlyph = (ch: string, u0: number, u1: number, v0: number, xh: number, stroke: number, slant = 0.22): BxUV[] =>
  bxBars(BX_GLYPHS[ch]!.map((l) => l.map(([a, b]): BxUV => [u0 + a * (u1 - u0) + b * xh * slant, v0 + b * xh])), stroke);
/** A lower-case word centred at uc. */
const bxWord = (word: string, uc: number, v0: number, xh: number, w: number, gap: number, stroke: number): BxUV[] => {
  const u0 = uc - (word.length * w + (word.length - 1) * gap) / 2;
  return [...word].flatMap((ch, i) => bxGlyph(ch, u0 + i * (w + gap), u0 + i * (w + gap) + w, v0, xh, stroke));
};
/** Upper-case text (the stroke font) centred at uc. */
const bxText = (text: string, uc: number, v0: number, h: number, w: number, gap: number, stroke = h * 0.15): BxUV[] =>
  strokeText(text, uc - strokeWidth(text, w, gap) / 2, v0, h, w, gap, false, stroke);
const bxRect = (u0: number, u1: number, v0: number, v1: number): BxUV[] => [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]];

/** Southern Pacific's Hydra-Cushion car (SP 245516): white road name right of the door, yellow cushion slogan left. */
function spMarks(): BxMark[] {
  return [
    { mat: "bxWhite", tris: [...bxText("SOUTHERN", 5.15, 3.22, 0.58, 0.36, 0.11, 0.1), ...bxText("PACIFIC", 5.15, 2.48, 0.55, 0.3, 0.1, 0.1)] },
    { mat: "safety", tris: bxText("HYDRA-CUSHION", -5.37, 3.37, 0.52, 0.27, 0.08, 0.09) },
    { mat: "bxWhite", tris: [...bxText("S P", -6.42, 2.62, 0.2, 0.25, 0.14), ...bxText("245516", -6.13, 2.15, 0.22, 0.21, 0.09)] },
    // the data panel and the conspicuity reflectors on the sill
    { mat: "bxWhite", tris: [...bxText("LD LMT", -3.9, 1.55, 0.07, 0.05, 0.02, 0.012), ...bxText("LT WT", -3.95, 1.43, 0.07, 0.05, 0.02, 0.012)] },
    { mat: "safety", tris: [...bxRect(-4.25, -3.75, 0.9, 0.97), ...bxRect(2.55, 3.05, 0.9, 0.97)], z: 0.028 },
    { mat: "safety", tris: [...bxRect(-7.38, -7.32, 1.25, 1.65), ...bxRect(7.5, 7.56, 1.25, 1.65)] },
  ];
}

/** Railbox (RBOX 33646): the "rail box" lettering and its outline logo, "next load", the X, "any road". */
function railboxMarks(): BxMark[] {
  const row1: Array<[string, number, number]> = [["r", -6.75, -6.28], ["a", -5.89, -5.45], ["i", -4.95, -4.67], ["l", -4.06, -3.78]];
  const row2: Array<[string, number, number]> = [["b", -4.15, -3.66], ["o", -3.28, -2.79], ["x", -2.44, -1.92]];
  // the outline logo under "rai", traced from the photograph
  const logo: BxUV[] = [[-6.33, 3.53], [-4.67, 3.53], [-4.8, 3.17], [-5.48, 3.17], [-5.4, 3.39], [-5.78, 3.39], [-5.94, 2.89], [-6.57, 2.89], [-6.33, 3.53]];
  // the X: two blue strokes crossing, a red chevron inside each side
  const [xc, yc] = [4.92, 3.57];
  return [
    {
      mat: "bxBlack", tris: [
        ...row1.flatMap(([c, a, b]) => bxGlyph(c, a, b, 3.63, 0.23, 0.1)),
        ...row2.flatMap(([c, a, b]) => bxGlyph(c, a, b, 3.25, 0.19, 0.095)),
        ...bxBars([logo], 0.04),
        ...bxText("RB OX", -5.24, 2.43, 0.3, 0.2, 0.08, 0.04), ...bxText("33 646", -5.24, 2.09, 0.25, 0.16, 0.06, 0.035),
        ...bxWord("next", 4.04, 3.6, 0.1, 0.09, 0.04, 0.03), ...bxWord("load", 4.04, 3.44, 0.1, 0.09, 0.04, 0.03),
        ...bxWord("any", 5.78, 3.6, 0.1, 0.09, 0.04, 0.03), ...bxWord("road", 5.78, 3.44, 0.1, 0.09, 0.04, 0.03),
        ...bxText("LD LMT", -6.1, 1.62, 0.07, 0.05, 0.02, 0.012), ...bxText("LT WT", -6.15, 1.5, 0.07, 0.05, 0.02, 0.012),
      ],
    },
    { mat: "rbBlue", layer: 2, tris: bxBars([[[xc - 0.27, yc + 0.21], [xc + 0.27, yc - 0.21]], [[xc - 0.27, yc - 0.21], [xc + 0.27, yc + 0.21]]], 0.075) },
    { mat: "rbRed", layer: 1, tris: bxBars([[[xc - 0.29, yc + 0.11], [xc - 0.05, yc], [xc - 0.29, yc - 0.11]], [[xc + 0.29, yc + 0.11], [xc + 0.05, yc], [xc + 0.29, yc - 0.11]]], 0.05) },
    // the white consolidated stencil and the ACI label near the right end
    { mat: "bxWhite", tris: [...bxRect(5.6, 6.02, 1.45, 1.74), ...bxRect(5.7, 5.92, 1.2, 1.36)] },
  ];
}

const BOXCAR_LIVERIES: Record<string, BoxcarLivery> = {
  boxcarRed: {
    body: "bxRed", door: "bxRed", palette: { bxRed: paint("#7b2b22", 0.7), bxWhite: paint("#e8e6df") },
    leaves: [[-2.58, 0], [0, 2.58]], track: [-5.2, 5.2], locks: [-0.1, 0.1], posts: bxPosts(2.66, 0.775, 7), ribs: 22, marks: spMarks,
  },
  railbox: {
    body: "bxYellow", door: "rbDoor", palette: { bxYellow: paint("#e9b92a", 0.6), bxBlack: paint("#1f2022"), rbDoor: paint("#2c2e31", 0.8), bxWhite: paint("#e8e6df"), rbRed: paint("#c0322c"), rbBlue: paint("#2c4f9c") },
    leaves: [[-1.615, 1.615]], track: [-1.615, 4.88], locks: [-1.5], posts: bxPosts(1.81, 0.87, 7), ribs: 16, marks: railboxMarks,
  },
};

/** The part of triangle soup `tris` between u = a and u = b, as triangles. */
function bxClipU(tris: readonly BxUV[], a: number, b: number): BxUV[] {
  const out: BxUV[] = [];
  const cut = (poly: BxUV[], keep: (u: number) => boolean, at: number): BxUV[] => {
    const r: BxUV[] = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!, q = poly[(i + 1) % poly.length]!;
      if (keep(p[0])) r.push(p);
      if (keep(p[0]) !== keep(q[0])) {
        const t = (at - p[0]) / (q[0] - p[0]);
        r.push([at, p[1] + (q[1] - p[1]) * t]);
      }
    }
    return r;
  };
  for (let i = 0; i + 2 < tris.length; i += 3) {
    const us = [tris[i]![0], tris[i + 1]![0], tris[i + 2]![0]];
    if (Math.max(...us) <= a || Math.min(...us) >= b) continue;
    const poly = cut(cut([tris[i]!, tris[i + 1]!, tris[i + 2]!], (u) => u >= a, a), (u) => u <= b, b);
    for (let j = 1; j + 1 < poly.length; j++) out.push(poly[0]!, poly[j]!, poly[j + 1]!);
  }
  return out;
}

/** A point on the roof: along x, t from the eave (0) to the ridge (1) on side s, lifted off the sheet. */
function bxRoof(x: number, t: number, s: number, lift = 0): Vec3 {
  const d = BX.ridge - BX.eave, l = Math.hypot(d, BX.half);
  return [x, BX.eave + d * t + lift * (BX.half / l), s * (BX.half * (1 - t) + lift * (d / l))];
}

/** A 70-ton three-piece freight truck at xc (33 in wheels, 5 ft 8 in wheelbase): cast side frames with their spring nests, roller bearings, the bolster. */
function bxTruck(m: MeshBuilder, xc: number): void {
  const N = 20, r = ft(0, 16.5), a = ft(5, 8) / 2;
  const ay = r * Math.cos(Math.PI / N);
  for (const dx of [-a, a])
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.08, 0, x, ay);
      m.sweep("steel", "z", axle, -0.95, axle, 0.95);
      for (const s of [-1, 1]) {
        extrude(m, "steel", "z", ngon(N, r, Math.PI / N, x, ay), side(s, 0.665, 0.8));
        extrude(m, "wheel", "z", ngon(16, r * 0.8, 0, x, ay), side(s, 0.8, 0.815));
        m.scope("roller bearing", () => {
          extrude(m, "spring", "z", ngon(10, 0.11, 0, x, ay), side(s, 0.95, 1.12));
          extrude(m, "bogie", "z", ngon(10, 0.075, 0, x, ay), side(s, 1.12, 1.15));
          block(m, "bogie", x - 0.13, x + 0.13, ay + 0.1, ay + 0.15, ...side(s, 0.94, 1.08));
        });
      }
    });
  m.scope("side frames", () => {
    for (const s of [-1, 1]) {
      const z = side(s, 0.95, 1.07);
      for (const k of [-1, 1]) {
        const X = (u: number): number => xc + k * u;
        const piece = (pts: BxUV[]): void => extrude(m, "bogie", "z", (k > 0 ? pts : [...pts].reverse()).map(([u, y]): [number, number] => [X(u), y]), z);
        // the pedestal over the bearing, the top chord rising to the column, the tension member under it
        piece([[a - 0.2, ay + 0.15], [a + 0.17, ay + 0.15], [a + 0.24, ay + 0.2], [a + 0.24, ay + 0.27], [a - 0.2, ay + 0.3]]);
        piece([[0.4, 0.62], [a - 0.2, ay + 0.15], [a - 0.2, ay + 0.3], [0.4, 0.79]]);
        piece([[0.4, 0.2], [a - 0.18, ay + 0.02], [a - 0.18, ay + 0.15], [0.4, 0.33]]);
        piece([[0.28, 0.2], [0.4, 0.2], [0.4, 0.79], [0.28, 0.79]]);
        // the pedestal jaws round the bearing adapter
        for (const j of [-1, 1]) block(m, "bogie", Math.min(X(a + j * 0.14), X(a + j * 0.19)), Math.max(X(a + j * 0.14), X(a + j * 0.19)), ay + 0.04, ay + 0.15, ...z);
      }
      block(m, "bogie", xc - 0.28, xc + 0.28, 0.2, 0.32, ...z);
      block(m, "bogie", xc - 0.28, xc + 0.28, 0.72, 0.79, ...z);
      // the spring nest in the window
      m.scope("springs", () => { for (const d of [-0.17, 0, 0.17]) coil(m, "spring", xc + d, s * 1.01, 0.32, 0.5, 0.075, 2, 6); });
    }
  });
  m.scope("bolster", () => {
    block(m, "bogie", xc - 0.24, xc + 0.24, 0.5, 0.7, -1.09, 1.09);
    // the friction wedges beside it in each window
    for (const s of [-1, 1]) for (const d of [-1, 1]) block(m, "spring", Math.min(xc + d * 0.24, xc + d * 0.28), Math.max(xc + d * 0.24, xc + d * 0.28), 0.54, 0.7, ...side(s, 0.96, 1.08));
  });
  m.scope("brake beams", () => { for (const d of [-1, 1]) block(m, "bogie", xc + d * 0.43 - 0.04, xc + d * 0.43 + 0.04, 0.36, 0.46, -0.86, 0.86); });
}

/** A grab iron: a bar from p to q standing `off` out along n, with its two legs. */
function bxGrab(m: MeshBuilder, p: Vec3, q: Vec3, n: Vec3, off: number): void {
  const o = (v: Vec3): Vec3 => [v[0] + n[0] * off, v[1] + n[1] * off, v[2] + n[2] * off];
  m.rod("handrail", o(p), o(q), 0.016, 6);
  for (const v of [p, q]) m.rod("handrail", v, o(v), 0.014, 4, false);
}

export function boxcar(params?: ParamValues): MeshBuilder {
  const l = BOXCAR_LIVERIES[resolveParams(BOXCAR_PARAMS, params).livery!]!;
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette });
  const H = BX.half;
  const posts = [...l.posts.map((p) => -p), ...l.posts].sort((a, b) => a - b);
  m.scope("underframe", () => {
    block(m, "black", -BX.body, BX.body, BX.bottom - 0.06, BX.bottom, -1.45, 1.45);
    block(m, "black", -BX.sill, BX.sill, 0.6, BX.bottom - 0.06, -0.3, 0.3);
    for (const e of [1, -1]) block(m, "black", e * BX.centre - 0.22, e * BX.centre + 0.22, 0.7, BX.bottom - 0.06, -1.3, 1.3);
    for (const x of [-3.6, -1.2, 1.2, 3.6]) block(m, "black", x - 0.08, x + 0.08, 0.66, BX.bottom - 0.06, -1.35, 1.35);
    m.scope("brake gear", () => {
      // the reservoir, the AB valve and the brake cylinder hung under one side
      m.sweep("black", "x", ngon(10, 0.17, 0, 0.75, 0.56), -2.7, ngon(10, 0.17, 0, 0.75, 0.56), -1.5);
      block(m, "black", -1.25, -0.9, 0.42, 0.74, 0.5, 0.85);
      m.sweep("black", "x", ngon(10, 0.14, 0, -0.75, 0.6), 0.4, ngon(10, 0.14, 0, -0.75, 0.6), 1.05);
      m.rod("steel", [1.05, 0.6, -0.75], [5.4, 0.62, -0.4], 0.02, 4);
    });
  });
  m.scope("body", () => {
    const sec: Array<[number, number]> = [[-H, BX.bottom], [H, BX.bottom], [H, BX.eave], [0, BX.ridge], [-H, BX.eave]];
    paintedSweep(m, "x", sec, -BX.body, BX.body, { bands: [[0, 9, l.body]], roofFrom: BX.eave + 0.01, roof: l.body });
    m.scope("roof", () => {
      // the diagonal-panel roof: seam caps across, a raised diagonal in each panel, chevrons seen from above
      const n = 10, pitch = (2 * BX.body) / n;
      for (const s of [-1, 1])
        for (let i = 0; i < n; i++) {
          const x0 = -BX.body + i * pitch, x1 = x0 + pitch;
          const dep = (v: Vec3, w: Vec3): Vec3 => [w[0] - v[0], w[1] - v[1], w[2] - v[2]];
          if (i > 0) m.slab(l.body, [bxRoof(x0 - 0.045, 0, s, 0.035), bxRoof(x0 + 0.045, 0, s, 0.035), bxRoof(x0 + 0.045, 1, s, 0.035), bxRoof(x0 - 0.045, 1, s, 0.035)], dep(bxRoof(0, 0, s, 0.035), bxRoof(0, 0, s, -0.01)));
          m.slab(l.body, [bxRoof(x0 + 0.14, 0.08, s, 0.025), bxRoof(x0 + 0.42, 0.08, s, 0.025), bxRoof(x1 - 0.14, 0.92, s, 0.025), bxRoof(x1 - 0.42, 0.92, s, 0.025)], dep(bxRoof(0, 0, s, 0.025), bxRoof(0, 0, s, -0.01)));
        }
      for (const s of [-1, 1]) block(m, l.body, -BX.body - 0.03, BX.body + 0.03, BX.eave - 0.07, BX.eave + 0.02, ...side(s, H - 0.02, H + 0.03));
    });
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        const X = (u: number): number => s * u;
        const span = (u0: number, u1: number): [number, number] => [Math.min(X(u0), X(u1)), Math.max(X(u0), X(u1))];
        block(m, l.body, -BX.body, BX.body, BX.bottom, BX.sheet, ...side(s, H, H + 0.025));
        m.scope("posts", () => {
          for (const u of posts) {
            const door = Math.abs(Math.abs(u) - l.posts[0]!) < 1e-6;
            const w = door ? 0.07 : 0.045;
            block(m, l.body, ...span(u - w, u + w), BX.sheet, BX.eave - 0.07, ...side(s, H - 0.01, H + BX.post + (door ? 0.01 : 0)));
          }
          // the corner posts
          for (const e of [-1, 1]) block(m, l.body, ...span(e * (BX.body - 0.08), e * (BX.body + 0.04)), BX.bottom, BX.eave - 0.07, ...side(s, H - 0.08, H + 0.035));
        });
        m.scope("door", () => {
          for (const [u0, u1] of l.leaves) {
            block(m, l.door, ...span(u0, u1), BX.doorFoot, BX.doorTop, ...side(s, H + BX.doorIn, H + BX.doorOut));
            // the leaf's frame and its horizontal corrugations
            for (const [a, b] of [[u0, u0 + 0.07], [u1 - 0.07, u1]] as const) block(m, l.door, ...span(a, b), BX.doorFoot, BX.doorTop, ...side(s, H + BX.doorOut, H + BX.doorOut + 0.025));
            block(m, l.door, ...span(u0 + 0.07, u1 - 0.07), BX.doorTop - 0.12, BX.doorTop, ...side(s, H + BX.doorOut, H + BX.doorOut + 0.025));
            block(m, l.door, ...span(u0 + 0.07, u1 - 0.07), BX.doorFoot, BX.doorFoot + 0.12, ...side(s, H + BX.doorOut, H + BX.doorOut + 0.025));
            const y0 = BX.doorFoot + 0.2, step = (BX.doorTop - 0.2 - y0) / l.ribs;
            for (let i = 0; i < l.ribs; i++) block(m, l.door, ...span(u0 + 0.07, u1 - 0.07), y0 + i * step + step * 0.3, y0 + i * step + step * 0.7, ...side(s, H + BX.doorOut, H + BX.doorOut + 0.018));
          }
          // the lock bars with their handles, the top track and the bottom track the door rolls on, the door stops
          for (const u of l.locks) {
            m.rod("steel", [X(u), BX.doorFoot + 0.15, s * (H + 0.135)], [X(u), BX.doorTop - 0.15, s * (H + 0.135)], 0.016, 6);
            for (const y of [BX.doorFoot + 0.15, BX.doorTop - 0.15]) m.rod("steel", [X(u), y, s * (H + BX.doorOut + 0.02)], [X(u), y, s * (H + 0.135)], 0.018, 4, false);
            m.rod("steel", [X(u), 1.7, s * (H + 0.135)], [X(u + Math.sign(u) * 0.25), 1.55, s * (H + 0.135)], 0.018, 4);
          }
          block(m, "steel", ...span(l.track[0] - 0.05, l.track[1] + 0.05), BX.doorTop, BX.eave - 0.075, ...side(s, H, H + 0.12));
          block(m, l.body, ...span(l.track[0] - 0.05, l.track[1] + 0.05), BX.doorFoot - 0.06, BX.doorFoot, ...side(s, H + 0.025, H + 0.1));
          for (const u of l.track) block(m, "black", ...span(u - 0.05, u + 0.05), BX.doorFoot - 0.02, BX.doorFoot + 0.12, ...side(s, H + 0.03, H + BX.doorIn));
        });
        m.scope("lettering", () => {
          for (const k of l.marks()) {
            const lay = 0.003 * (1 + (k.layer ?? 0));
            const put = (tris: readonly BxUV[], z: number): void => m.facets(k.mat, tris.map(([u, v]): Vec3 => [X(u), v, s * z]), [0, 0, s]);
            if (k.z !== undefined) { put(k.tris, H + k.z); continue; }
            put(k.tris, H + lay);
            // the same marks on the posts' faces they cross
            for (const u of posts) {
              const door = Math.abs(Math.abs(u) - l.posts[0]!) < 1e-6;
              const w = door ? 0.07 : 0.045;
              const on = bxClipU(k.tris, u - w, u + w);
              if (on.length) put(on, H + BX.post + (door ? 0.01 : 0) + lay);
            }
          }
        });
        m.scope("ladders", () => {
          // short side ladders at both ends, the sill steps under them
          for (const e of [-1, 1]) {
            const [ua, ub] = [e * (BX.body - 0.12), e * Math.max(l.posts[l.posts.length - 1]! + 0.1, BX.body - 0.74)];
            for (const y of [1.12, 1.6, 2.08, 2.56]) bxGrab(m, [X(ua), y, s * H], [X(ub), y, s * H], [0, 0, s], 0.1);
            const st = [X(e * (BX.body - 0.15)), X(e * (BX.body - 0.5))];
            for (const x of st) m.rod("handrail", [x, BX.bottom, s * (H + 0.04)], [x, 0.45, s * (H + 0.06)], 0.018, 4, false);
            m.rod("handrail", [st[0]!, 0.45, s * (H + 0.06)], [st[1]!, 0.45, s * (H + 0.06)], 0.02, 4);
          }
        });
      });
    for (const e of [1, -1])
      m.scope(e > 0 ? "front end" : "rear end", () => {
        const x = e * BX.body;
        const ax = (a: number, b: number): [number, number] => [Math.min(x + e * a, x + e * b), Math.max(x + e * a, x + e * b)];
        // the improved Dreadnaught end: six broad ribs, the end sill and the striker
        m.scope("corrugations", () => {
          const pitch = (BX.eave - 0.1 - (BX.sheet + 0.04)) / 6;
          for (let i = 0; i < 6; i++) {
            const y0 = BX.sheet + 0.04 + i * pitch, y1 = y0 + pitch * 0.8;
            const ring: Array<[number, number]> = [[x - e * 0.01, y0], [x + e * 0.04, y0], [x + e * 0.1, y0 + 0.06], [x + e * 0.13, y0 + 0.14], [x + e * 0.13, y1 - 0.14], [x + e * 0.1, y1 - 0.06], [x + e * 0.04, y1], [x - e * 0.01, y1]];
            extrude(m, l.body, "z", e > 0 ? ring : [...ring].reverse(), [-1.36, 1.36]);
          }
        });
        block(m, l.body, ...ax(0, 0.12), 0.64, BX.sheet, -1.42, 1.42);
        block(m, "knuckle", ...ax(0.12, 0.18), 0.66, 1.06, -0.26, 0.26);
        // the end ladder at the right-hand corner seen from the end
        const zl = -e * 1.18;
        for (const y of [1.12, 1.6, 2.08, 2.56, 3.04]) bxGrab(m, [x + e * 0.13, y, zl - 0.2], [x + e * 0.13, y, zl + 0.2], [e, 0, 0], 0.1);
        if (e < 0)
          m.scope("hand brake", () => {
            // the B end: the vertical brake wheel, its housing, the brake step under it and the chain down to the gear
            const zb = 0.5, yb = 3.1;
            block(m, "black", ...ax(0.13, 0.28), yb - 0.48, yb - 0.1, zb - 0.16, zb + 0.16);
            m.tube("black", "x", zb, yb, 0.28, 0.25, ...ax(0.34, 0.37), 12);
            for (const t of [0, 1, 2]) {
              const ang = Math.PI / 2 + (t * 2 * Math.PI) / 3;
              m.rod("black", [x + e * 0.355, yb, zb], [x + e * 0.355, yb + Math.sin(ang) * 0.255, zb + Math.cos(ang) * 0.255], 0.015, 4, false);
            }
            m.rod("black", [x + e * 0.28, yb, zb], [x + e * 0.37, yb, zb], 0.04, 6);
            block(m, "steel", ...ax(0.13, 0.44), 2.02, 2.06, zb - 0.45, zb + 0.45);
            for (const z of [zb - 0.4, zb + 0.4]) m.rod("steel", [x + e * 0.13, 1.8, z], [x + e * 0.42, 2.02, z], 0.015, 4, false);
            m.rod("steel", [x + e * 0.2, yb - 0.48, zb], [x + e * 0.2, 1.02, zb], 0.015, 4, false);
          });
      });
  });
  m.scope("trucks", () => {
    m.scope("front truck", () => m.bogie(() => bxTruck(m, BX.centre)));
    m.scope("rear truck", () => m.bogie(() => bxTruck(m, -BX.centre)));
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front coupler" : "rear coupler", () => knuckleCoupler(m, e, BX.sill, BOXCAR_LENGTH / 2, COUPLER_Y));
  return m;
}

export function boxcarLod(params?: ParamValues): MeshBuilder {
  const l = BOXCAR_LIVERIES[resolveParams(BOXCAR_PARAMS, params).livery!]!;
  const body: UnitBody = {
    y0: BX.bottom, hw: [[BX.bottom, BX.half + 0.03], [BX.eave, BX.half + 0.03], [BX.ridge, 0.3]], side: [[BX.bottom, BX.ridge, l.body]], roof: l.body,
    front: { tip: [[BX.bottom, BX.body + 0.08]] }, rear: { tip: [[BX.bottom, -BX.body - 0.08]] },
    windows: l.door === l.body ? [] : l.leaves.map(([u0, u1]) => ({ u: [u0, u1] as const, y: [BX.doorFoot, BX.doorTop] as const, mat: l.door })),
  };
  const parts: LodPart[] = bogieParts([[BX.centre, 1.3], [-BX.centre, 1.3]], BX.bottom);
  return fitUnit({ palette: { ...US_PALETTE, ...l.palette }, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// Double-stack well car

export const WELL_PARAMS: readonly ParamSpec[] = [{
  name: "cargo", title: "Cargo", default: "single",
  values: [{ value: "empty", title: "Empty" }, { value: "single", title: "Single stack" }, { value: "double", title: "Double stack" }],
}];
export const WELL_LENGTH = ft(63, 6);
const WL = { sill: 9.2, well: 6.25, deck: 0.36, girder: 1.75, half: 1.42, centre: ft(52) / 2 };
/** An ISO 40 ft high-cube container: 12.19 by 2.44 by 2.9 m. */
const CONTAINER = { len: 12.19, half: 1.22, h: 2.9 };

function container(m: MeshBuilder, y0: number, mat: string): void {
  const [x0, x1] = [-CONTAINER.len / 2, CONTAINER.len / 2];
  block(m, mat, x0, x1, y0, y0 + CONTAINER.h, -CONTAINER.half, CONTAINER.half);
  // the corrugated sides and the doors at the rear
  for (const s of [-1, 1]) for (let x = x0 + 0.3; x < x1 - 0.3; x += 0.3) decalZ(m, "louvre", s * (CONTAINER.half + 0.003), s, x, x + 0.1, y0 + 0.1, y0 + CONTAINER.h - 0.1);
  for (const z of [-0.6, 0.6]) decalX(m, "steel", x0 - 0.003, -1, z - 0.55, z + 0.55, y0 + 0.1, y0 + CONTAINER.h - 0.1);
}

export function wellCar(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(WELL_PARAMS, params);
  const m = new MeshBuilder({ ...US_PALETTE, wcGrey: paint("#5d6266", 0.7), cBlue: paint("#24508f", 0.6), cRed: paint("#a3281f", 0.6) });
  m.scope("car", () => {
    // the two end platforms over the trucks and the side girders round the well
    for (const e of [1, -1]) block(m, "wcGrey", ...(e > 0 ? [WL.well, WL.sill] : [-WL.sill, -WL.well]) as [number, number], 0.95, 1.35, -1.4, 1.4);
    for (const s of [-1, 1]) {
      const sec: Array<[number, number]> = [[-WL.sill + 0.05, 0.95], [-WL.well, 0.95], [-WL.well + 0.6, 0.3], [WL.well - 0.6, 0.3], [WL.well, 0.95], [WL.sill - 0.05, 0.95]];
      // the girder: a plate from its deep middle to the ends, its top rail along
      for (let i = 0; i + 1 < sec.length; i++) {
        const [[xa, ya], [xb, yb]] = [sec[i]!, sec[i + 1]!];
        const q: Vec3[] = [[xa, ya, s * WL.half], [xb, yb, s * WL.half], [xb, WL.girder, s * WL.half], [xa, WL.girder, s * WL.half]];
        m.slab("wcGrey", q, [0, 0, -s * 0.1]);
      }
      block(m, "steel", -WL.sill + 0.05, WL.sill - 0.05, WL.girder, WL.girder + 0.06, ...side(s, WL.half - 0.12, WL.half + 0.04));
    }
    block(m, "wcGrey", -WL.well + 0.6, WL.well - 0.6, WL.deck - 0.1, WL.deck, -1.32, 1.32);
    if (cargo === "empty") for (const x of [-4.0, 0, 4.0]) block(m, "wcGrey", x - 0.1, x + 0.1, WL.deck, 0.8, -1.32, 1.32);
  });
  if (cargo !== "empty")
    m.scope("containers", () => {
      m.scope("lower", () => container(m, WL.deck, "cBlue"));
      if (cargo === "double") m.scope("upper", () => container(m, WL.deck + CONTAINER.h + 0.02, "cRed"));
    });
  runningGear(m, WL.centre, WL.sill, WELL_LENGTH, freightTruck());
  return m;
}

export function wellCarLod(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(WELL_PARAMS, params);
  const top = cargo === "empty" ? WL.girder : WL.deck + CONTAINER.h * (cargo === "double" ? 2 : 1);
  const bands: LodBand[] = cargo === "empty" ? [[0.3, WL.girder, "wcGrey"]] : [[0.3, WL.girder, "wcGrey"], [WL.girder, WL.deck + CONTAINER.h, "cBlue"], ...(cargo === "double" ? [[WL.deck + CONTAINER.h, top, "cRed"] as LodBand] : [])];
  return boxLod({ ...US_PALETTE, wcGrey: paint("#5d6266", 0.7), cBlue: paint("#24508f", 0.6), cRed: paint("#a3281f", 0.6) }, -WL.sill, WL.sill, 0.3, top, WL.half, bands, cargo === "double" ? "cRed" : cargo === "single" ? "cBlue" : "wcGrey", WL.centre, freightTruck());
}

// ---------------------------------------------------------------------------
// San Francisco cable car (the Powell Street type): an open grip section and a closed cabin

export const CABLE_CAR_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "powell",
  values: [{ value: "powell", title: "Powell Street" }, { value: "california", title: "California St" }],
}];
const CABLE_LIVERIES: Record<string, Record<string, MaterialSpec>> = {
  powell: { ccBody: paint("#6e1f24"), ccPanel: paint("#e6dcc1"), ccTrim: paint("#2b4a7a"), ccRoof: paint("#e9e4d7") },
  california: { ccBody: paint("#a3201f"), ccPanel: paint("#e6dcc1"), ccTrim: paint("#1f2022"), ccRoof: paint("#e9e4d7") },
};
export const CABLE_CAR_LENGTH = ft(27, 6);
const CC = { half: ft(4), floor: 0.85, roof: ft(10, 3) - 0.15, cabin: 1.9, end: CABLE_CAR_LENGTH / 2 - 0.06, centre: 2.0 };

export function cableCar(params?: ParamValues): MeshBuilder {
  const livery = resolveParams(CABLE_CAR_PARAMS, params).livery!;
  const pal = CABLE_LIVERIES[livery]!;
  const m = new MeshBuilder({ ...US_PALETTE, ...pal, wood: paint("#8a5a33", 0.8), brass: { color: "#b8913a", metallic: 0.45, roughness: 0.35 } });
  m.scope("floor", () => {
    block(m, "black", -CC.end, CC.end, CC.floor - 0.15, CC.floor, -CC.half, CC.half);
    // the running boards along the open sections, the wooden step
    for (const s of [-1, 1]) for (const [a, b] of [[-CC.end, -CC.cabin], [CC.cabin, CC.end]] as const) block(m, "wood", a, b, CC.floor - 0.3, CC.floor - 0.24, ...side(s, CC.half, CC.half + 0.25));
  });
  m.scope("cabin", () => {
    paintedSweep(m, "x", box(CC.half, CC.floor, CC.roof - 0.1, 0.05), -CC.cabin, CC.cabin, { bands: [[0, 1.55, "ccBody"], [1.55, 2.4, "ccPanel"], [2.4, 9, "ccBody"]], roofFrom: CC.roof, roof: "ccBody" });
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const x = -CC.cabin + 0.25 + i * 0.9;
      decalZ(m, "rubber", s * (CC.half + 0.004), s, x, x + 0.7, 1.62, 2.32);
      decalZ(m, "glass", s * (CC.half + 0.008), s, x + 0.05, x + 0.65, 1.67, 2.27);
    }
  });
  m.scope("open sections", () => {
    for (const e of [1, -1]) {
      const [a, b] = e > 0 ? [CC.cabin, CC.end] : [-CC.end, -CC.cabin];
      // the outward-facing benches, the dash panel at the end, the brass poles
      for (const s of [-1, 1]) {
        block(m, "wood", a + 0.1, b - 0.3, CC.floor + 0.45, CC.floor + 0.5, ...side(s, CC.half - 0.55, CC.half - 0.05));
        block(m, "ccBody", a + 0.1, b - 0.3, CC.floor, CC.floor + 0.45, ...side(s, CC.half - 0.5, CC.half - 0.45));
        for (let x = a + 0.2; x < b - 0.2; x += 0.75) m.prism("brass", ngon(6, 0.025, 0, x, s * (CC.half - 0.02)), CC.floor, CC.roof - 0.1);
      }
      block(m, "ccBody", e > 0 ? b - 0.12 : a, e > 0 ? b : a + 0.12, CC.floor, CC.floor + 1.1, -CC.half, CC.half);
      decalX(m, "ccPanel", e * (CC.end + 0.004), e, -0.7, 0.7, CC.floor + 0.6, CC.floor + 1.0);
      m.sweep("lampHead", "x", ngon(10, 0.1, 0, 0, CC.floor + 0.85), Math.min(e * CC.end, e * (CC.end + 0.06)), ngon(10, 0.1, 0, 0, CC.floor + 0.85), Math.max(e * CC.end, e * (CC.end + 0.06)));
    }
  });
  m.scope("roof", () => {
    paintedSweep(m, "x", [[-CC.half - 0.12, CC.roof - 0.1], [CC.half + 0.12, CC.roof - 0.1], [CC.half - 0.2, CC.roof + 0.05], [-(CC.half - 0.2), CC.roof + 0.05]], -CC.end - 0.04, CC.end + 0.04, { bands: [[0, 9, "ccTrim"]], roofFrom: CC.roof + 0.04, roof: "ccRoof" });
    paintedSweep(m, "x", box(0.7, CC.roof + 0.05, CC.roof + 0.3, 0.04), -CC.end + 0.8, CC.end - 0.8, { bands: [[0, 9, "ccPanel"]], roofFrom: CC.roof + 0.28, roof: "ccRoof" });
    for (const s of [-1, 1]) sideText(m, "ccPanel", livery === "powell" ? "POWELL AND MASON" : "CALIFORNIA ST", s, CC.half + 0.124, 0, CC.roof - 0.07, 0.1);
  });
  m.scope("grip", () => {
    m.rod("steel", [CC.cabin + 0.6, CC.floor, 0], [CC.cabin + 0.75, CC.floor + 1.3, 0], 0.03, 6);
    m.prism("black", ngon(8, 0.08, 0, CC.cabin + 0.6, 0), 0.25, CC.floor - 0.15);
  });
  m.scope("trucks", () => {
    const t: BogieSpec = freightTruck(0.3, 1.5, CC.floor - 0.15);
    m.scope("front truck", () => m.bogie(() => bogieGeometry(m, CC.centre + 0.4, t)));
    m.scope("rear truck", () => m.bogie(() => bogieGeometry(m, -CC.centre - 0.4, t)));
  });
  return m;
}

export function cableCarLod(params?: ParamValues): MeshBuilder {
  const pal = CABLE_LIVERIES[resolveParams(CABLE_CAR_PARAMS, params).livery!]!;
  const t: BogieSpec = freightTruck(0.3, 1.5, CC.floor - 0.15);
  return boxLod({ ...US_PALETTE, ...pal }, -CC.end, CC.end, CC.floor - 0.15, CC.roof + 0.05, CC.half, [[CC.floor - 0.15, 1.55, "ccBody"], [1.55, 2.4, "ccPanel"], [2.4, CC.roof + 0.05, "ccBody"]], "ccRoof", CC.centre + 0.4, t,
    [{ u: [-CC.cabin + 0.25, CC.cabin - 0.25], y: [1.62, 2.32], mat: LOD_GLASS }]);
}

// ---------------------------------------------------------------------------

const wagonGame = (weight: number, variants: GameProperties["variants"] = []): GameProperties => ({ weight, power: 0, maxspeed: 113, accel: null, ...(variants.length ? { variants } : {}) });

export const US_FREIGHT: ProceduralDesign[] = [
  { id: "proc-vehicle-us-caboose", title: "Cupola caboose", build: caboose, buildLod: cabooseLod, params: CABOOSE_PARAMS, finishParams: ["livery"], game: wagonGame(22), catalog: WAGON_CATALOG, loadingGauge: "us", references: "us-caboose" },
  { id: "proc-vehicle-us-boxcar", title: "50 ft boxcar", build: boxcar, buildLod: boxcarLod, params: BOXCAR_PARAMS, finishParams: ["livery"], game: wagonGame(30), catalog: WAGON_CATALOG, loadingGauge: "us", references: "us-boxcar" },
  { id: "proc-vehicle-us-well-car", title: "Double-stack well car", build: wellCar, buildLod: wellCarLod, params: WELL_PARAMS, game: wagonGame(32, [{ params: { cargo: "empty" }, weight: 22 }, { params: { cargo: "double" }, weight: 42 }]), catalog: WAGON_CATALOG, loadingGauge: "usDoubleStack", references: "us-well-car" },
  { id: "proc-vehicle-sf-cable-car", title: "San Francisco cable car", build: cableCar, buildLod: cableCarLod, params: CABLE_CAR_PARAMS, finishParams: ["livery"], game: { weight: 7, power: 40, maxspeed: 15, accel: null }, catalog: TRAM_CATALOG, loadingGauge: "us", references: "sf-cable-car" },
];
