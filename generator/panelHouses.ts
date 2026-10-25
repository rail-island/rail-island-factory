// Prefabricated panel houses (docs/models/panel-houses.md): the slab and the point
// tower block of a Czech housing estate (sidliste), drawn from the references in
// assets/panel-houses/. A raised ground floor on a dark plinth with cellar windows,
// 2.8 m storeys in a 2.25 m bay rhythm, one entrance and its staircase per section
// (the stair windows sit half a storey off the flats'), stacks of loggias or
// balconies, and a flat roof with its stair and lift penthouses or the low pitched
// roof many estates gained later. The facade is the original panels with their
// joints or the insulated render of a renovation, painted in colour fields.
// Metres, base at y = 0, street front +z, right +x.
//
// No node: imports.

import { MeshBuilder, rect, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { lodPolygon, type LodBand } from "./lodKit.ts";
import { anyBlank, blankSides, grownPlan, partyParams, partySlabs, windowed, type Blank } from "./partyWalls.ts";
import { bounds, faceQuad, fit, lodBox, lodCap, lodParapet, lodRect, lodWalls, part } from "./lodBuildings.ts";

const param = (name: string, title: string, values: Array<[string, string]>): ParamSpec => ({
  name, title, default: values[0]![0], values: values.map(([value, t]) => ({ value, title: t })),
});

/** The panel colours: the original concrete and the renders of a renovation. */
export const WALL_COLOURS: Record<string, string> = {
  grey: "#c9c6bf", cream: "#eedfb8", rose: "#e4bdb2", ochre: "#e6c56c", white: "#eeeee9", sage: "#c6d5bf",
};
/** The colour fields, balcony parapets and the entrance portal. */
export const ACCENT_COLOURS: Record<string, string> = {
  orange: "#e07a2e", gold: "#e9b93c", coral: "#d87560", red: "#b4483d", blue: "#6f9ccb", green: "#80ad6a",
};
/** A pitched roof's covering; on a flat roof the parapet's and the penthouses' coping. */
export const ROOF_COLOURS: Record<string, string> = {
  red: "#a8463b", brown: "#7a5842", slate: "#5c626a", green: "#5f7f5b",
};
const title = (v: string): string => v[0]!.toUpperCase() + v.slice(1);
const finish = (walls: string, accent: string, roof: string): ParamSpec[] => [
  { ...param("walls", "Wall colour", Object.keys(WALL_COLOURS).map((v) => [v, title(v)])), default: walls },
  { ...param("accent", "Colour field and balcony colour", Object.keys(ACCENT_COLOURS).map((v) => [v, title(v)])), default: accent },
  { ...param("roof", "Roof colour", Object.keys(ROOF_COLOURS).map((v) => [v, title(v)])), default: roof },
];
export const PANEL_FINISH_PARAMS: readonly string[] = ["walls", "accent", "roof"];

const ROOF_SHAPE = param("roofShape", "Roof", [["flat", "Flat"], ["pitched", "Pitched"]]);
const BALCONIES = param("balconies", "Balconies", [["loggia", "Loggias"], ["balcony", "Balconies"], ["none", "None"]]);
const facade = (first: "insulated" | "original"): ParamSpec => {
  const values: Array<[string, string]> = [["insulated", "Insulated"], ["original", "Original panels"]];
  return param("facade", "Facade", first === "insulated" ? values : [values[1]!, values[0]!]);
};

export const SLAB_PARAMS: ParamSpec[] = [
  param("sections", "Sections", [["3", "Three sections"], ["2", "Two sections"], ["1", "One section"]]),
  param("storeys", "Storeys", [["8", "Eight"], ["4", "Four"], ["6", "Six"], ["12", "Twelve"]]),
  ROOF_SHAPE, facade("insulated"), BALCONIES, ...finish("cream", "orange", "red"), ...partyParams(["left", "right"]),
];
export const TOWER_PARAMS: ParamSpec[] = [
  param("storeys", "Storeys", [["12", "Twelve"], ["10", "Ten"], ["14", "Fourteen"]]),
  ROOF_SHAPE, facade("original"), BALCONIES, ...finish("grey", "blue", "slate"),
];

export const PANEL_CATALOG: CatalogFields = {
  category: "Panel houses", group: "panel", defaultScale: 1,
  license: "CC0", author: "Rail Island", source: "Rail Island",
};

/** The bay (one panel's width), the storey, the raised ground floor's plinth and the slab's depth. */
export const BAY = 2.25;
export const ST = 2.8;
export const PL = 1.2;
export const SLAB_DEPTH = 10.8;
/** How far a balcony or loggia stands out of the wall; the pitched roof's rise per run and overhang. */
const OUT = 1.25;
const PITCH = 0.5;
const OVERHANG = 0.45;
/** The flat roof's parapet, over the wall top. */
const PARAPET = 0.7;

/** What a bay of a face holds: a flat's window, a balcony stack's door and window, or the staircase. */
type Bay = "W" | "B" | "S";

/** The bays of the slab's sections, along the street face: window, balcony, stair, balcony, window. */
const SECTION: readonly Bay[] = ["W", "B", "S", "B", "W"];
const TOWER_FRONT: readonly Bay[] = ["W", "B", "W", "S", "W", "B", "W"];

export interface Plan {
  kind: "slab" | "tower";
  w: number;
  d: number;
  floors: number;
  /** The bays of the front (+z) face, left to right. */
  front: Bay[];
  /** The bays of the back face, the sides (x faces; empty: the slab's end walls). */
  back: number;
  side: number;
  /** The centres (x) of the staircases. */
  stairs: number[];
}

export function plan(kind: "slab" | "tower", p: ParamValues): Plan {
  const floors = Number(p.storeys);
  if (kind === "tower") {
    const front = [...TOWER_FRONT];
    const w = front.length * BAY;
    return { kind, w, d: 6 * BAY, floors, front, back: front.length, side: 6, stairs: [0] };
  }
  const n = Number(p.sections);
  const front = Array.from({ length: n }, () => SECTION).flat();
  const w = front.length * BAY;
  const stairs = Array.from({ length: n }, (_, i) => -w / 2 + (i + 0.5) * SECTION.length * BAY);
  return { kind, w, d: SLAB_DEPTH, floors, front, back: front.length, side: 0, stairs };
}

/** The wall top: the plinth and the storeys. */
export const wallTop = (pl: Plan): number => PL + pl.floors * ST;

export function palette(p: ParamValues): Record<string, MaterialSpec> {
  return {
    wall: { color: WALL_COLOURS[p.walls!]! }, accent: { color: ACCENT_COLOURS[p.accent!]! }, roof: { color: ROOF_COLOURS[p.roof!]! },
    plinth: { color: "#7d6c5e" }, joint: { color: "#8e8c87" }, concrete: { color: "#b8b5ad" },
    membrane: { color: "#55585d" }, metal: { color: "#8f959c", metallic: 0.25 },
    frame: { color: "#f3f2ee" }, glass: { color: "#5d7d9b", metallic: 0.15, roughness: 0.3 },
    door: { color: "#4a3f37" },
  };
}

/** A face of the plan: the plane `axis` = `at` facing `sign`, `len` long about `mid`. */
interface Face { axis: "x" | "z"; sign: 1 | -1; at: number; len: number; mid: number }

const faceOf = (pl: Plan, side: "front" | "back" | "left" | "right"): Face => {
  if (side === "front") return { axis: "z", sign: 1, at: pl.d / 2, len: pl.w, mid: 0 };
  if (side === "back") return { axis: "z", sign: -1, at: -pl.d / 2, len: pl.w, mid: 0 };
  return { axis: "x", sign: side === "right" ? 1 : -1, at: (side === "right" ? 1 : -1) * pl.w / 2, len: pl.d, mid: 0 };
};

const point = (f: Face, u: number, y: number, off: number): Vec3 =>
  f.axis === "z" ? [u, y, f.at + f.sign * off] : [f.at + f.sign * off, y, u];
const normal = (f: Face): Vec3 => (f.axis === "z" ? [0, 0, f.sign] : [f.sign, 0, 0]);

/** The bay centres of a face with `n` bays across its length. */
const bayCentres = (f: Face, n: number): number[] => Array.from({ length: n }, (_, i) => f.mid - f.len / 2 + (i + 0.5) * (f.len / n));

class Panel {
  readonly m: MeshBuilder;
  readonly blank: Blank;
  readonly pl: Plan;
  readonly top: number;
  constructor(readonly kind: "slab" | "tower", readonly p: ParamValues) {
    this.m = new MeshBuilder(palette(p));
    this.blank = blankSides(p);
    this.pl = plan(kind, p);
    this.top = wallTop(this.pl);
  }

  /** A quad on a face, `off` out of its wall plane. */
  quad(mat: string, f: Face, u0: number, u1: number, y0: number, y1: number, off: number): void {
    faceQuad(this.m, mat, (u, y) => point(f, u, y, off), u0, u1, y0, y1, normal(f));
  }

  /** A box standing out of a face: `u` along it, from `z0` to `z1` out of the wall plane. */
  outBox(mat: string, f: Face, u: number, w: number, z0: number, z1: number, y0: number, y1: number, bottom = false): void {
    const c = f.at + f.sign * (z0 + z1) / 2;
    const [cx, cz, sx, sz] = f.axis === "z" ? [u, c, w, z1 - z0] : [c, u, z1 - z0, w];
    this.m.box(mat, cx, cz, sx, sz, y0, y1);
    if (bottom) this.m.cap(mat, rect(sx, sz, cx, cz), y0, false);
  }

  /** A framed window: the frame, the glass, a mullion when it is wide, and the sill. */
  window(f: Face, u: number, y: number, w: number, h: number, base = 0): void {
    this.m.scope("window", () => {
      this.quad("frame", f, u - w / 2 - 0.08, u + w / 2 + 0.08, y - 0.08, y + h + 0.08, base + 0.03);
      this.quad("glass", f, u - w / 2, u + w / 2, y, y + h, base + 0.05);
      if (w > 1.2) this.quad("frame", f, u - 0.03, u + 0.03, y, y + h, base + 0.06);
      this.quad("metal", f, u - w / 2 - 0.12, u + w / 2 + 0.12, y - 0.13, y - 0.06, base + 0.07);
    });
  }

  body(): void {
    const { pl, m } = this;
    m.scope("plinth", () => {
      const [cx, cz, w, d] = grownPlan(pl.w, pl.d, 0.06, this.blank);
      m.box("plinth", cx, cz, w, d, 0, PL);
    });
    m.scope("walls", () => m.box("wall", 0, 0, pl.w, pl.d, PL - 0.1, this.top, 0, false));
  }

  /** The faces that carry windows: the front and back, and the sides unless blank (the slab's end walls). */
  openFaces(): Array<{ f: Face; bays: Bay[] | null; n: number }> {
    const { pl } = this;
    const out: Array<{ f: Face; bays: Bay[] | null; n: number }> = [
      { f: faceOf(pl, "front"), bays: pl.front, n: pl.front.length },
      { f: faceOf(pl, "back"), bays: null, n: pl.back },
    ];
    for (const side of ["left", "right"] as const) {
      if (this.blank[side]) continue;
      out.push({ f: faceOf(pl, side), bays: null, n: pl.side });
    }
    return out;
  }

  /** The original panels' joints, or the insulated render's colour fields. */
  facade(): void {
    const { pl } = this;
    const faces = [faceOf(pl, "front"), faceOf(pl, "back"), faceOf(pl, "left"), faceOf(pl, "right")];
    if (this.p.facade === "original") {
      this.m.scope("panel joints", () => {
        for (const f of faces) {
          if (f.axis === "x" && this.blank[f.sign < 0 ? "left" : "right"]) continue;
          const n = f.axis === "z" ? pl.front.length : Math.max(2, pl.side);
          for (let i = 1; i < n; i++) {
            const u = f.mid - f.len / 2 + (i * f.len) / n;
            this.quad("joint", f, u - 0.025, u + 0.025, PL, this.top, 0.012);
          }
          for (let k = 1; k <= pl.floors; k++) {
            const y = PL + k * ST;
            this.quad("joint", f, f.mid - f.len / 2, f.mid + f.len / 2, y - 0.03 - (k === pl.floors ? 0.04 : 0), y + 0.02 - (k === pl.floors ? 0.04 : 0), 0.018);
          }
        }
      });
      return;
    }
    this.m.scope("colour fields", () => {
      const front = faces[0]!;
      const us = bayCentres(front, pl.front.length);
      // the balcony stacks' columns on the front, the staircases' line at the back
      pl.front.forEach((b, i) => { if (b === "B") this.quad("accent", front, us[i]! - BAY / 2, us[i]! + BAY / 2, PL, this.top, 0.012); });
      for (const x of pl.stairs) this.quad("accent", faces[1]!, x - BAY / 2, x + BAY / 2, PL, this.top, 0.012);
      if (pl.kind === "tower") for (const f of faces.slice(2)) this.quad("accent", f, -BAY, BAY, PL, this.top, 0.012);
    });
  }

  windows(): void {
    const { pl } = this;
    const balconies = this.p.balconies !== "none";
    for (let level = 0; level < pl.floors; level++) {
      const fy = PL + level * ST;
      this.m.scope(`storey ${level + 1}`, () => {
        for (const { f, bays, n } of this.openFaces()) {
          if (f.axis === "x" && n === 0) {
            // the slab's end wall: a corner room's window at the front and the back
            for (const s of [-1, 1]) this.window(f, s * (pl.d / 2 - 1.7), fy + 0.95, 1.1, 1.4);
            continue;
          }
          const us = bayCentres(f, n);
          for (let i = 0; i < n; i++) {
            const bay = bays?.[i] ?? "W";
            if (bay === "S") {
              // the half landing between this storey and the next
              if (level < pl.floors - 1) this.window(f, us[i]!, fy + 2.3, 0.95, 1.0);
            } else if (bay === "B" && balconies) this.window(f, us[i]!, fy + 0.15, 1.7, 2.15);
            else this.window(f, us[i]!, fy + 0.9, 1.5, 1.5);
          }
        }
      });
    }
  }

  balconies(): void {
    const { pl } = this;
    const kind = this.p.balconies;
    if (kind === "none") return;
    const f = faceOf(pl, "front");
    const us = bayCentres(f, pl.front.length);
    this.m.scope(kind === "loggia" ? "loggias" : "balconies", () => {
      pl.front.forEach((b, i) => {
        if (b !== "B") return;
        const u = us[i]!;
        this.m.scope("stack", () => {
          if (kind === "loggia") {
            for (const s of [-1, 1]) this.outBox("concrete", f, u + s * (BAY / 2 - 0.075), 0.15, -0.1, OUT, PL - 0.05, this.top);
            for (let level = 0; level <= pl.floors; level++) {
              const fy = PL + level * ST;
              // the floor slab stands a little over the floor line, clear of the plinth's top
              this.outBox("concrete", f, u, BAY - 0.2, -0.1, OUT - 0.03, fy - 0.13, fy + 0.02, true);
              if (level < pl.floors) this.outBox("accent", f, u, BAY - 0.22, OUT - 0.13, OUT - 0.05, fy + 0.02, fy + 1.05);
            }
          } else {
            for (let level = 0; level < pl.floors; level++) {
              const fy = PL + level * ST;
              const w = BAY - 0.1;
              this.outBox("concrete", f, u, w, -0.1, OUT, fy - 0.08, fy + 0.07, true);
              this.outBox("accent", f, u, w, OUT - 0.08, OUT, fy + 0.07, fy + 1.1);
              for (const s of [-1, 1]) this.outBox("accent", f, u + s * (w / 2 - 0.03), 0.06, 0.05, OUT - 0.08, fy + 0.07, fy + 1.1);
            }
          }
        });
      });
    });
  }

  /** The entrances: a portal in the accent colour, the door, a canopy and a step; cellar windows in the plinth. */
  ground(): void {
    const { pl } = this;
    const f = faceOf(pl, "front");
    this.m.scope("entrances", () => {
      for (const x of pl.stairs) {
        this.quad("accent", f, x - 0.95, x + 0.95, 0.15, 2.45, 0.09);
        this.quad("door", f, x - 0.72, x + 0.72, 0.15, 2.25, 0.11);
        this.quad("frame", f, x - 0.03, x + 0.03, 0.15, 2.25, 0.12);
        this.outBox("concrete", f, x, 2.7, -0.1, 1.6, 2.45, 2.62, true);
        this.outBox("concrete", f, x, 2.3, -0.1, 1.3, 0, 0.15);
      }
    });
    this.m.scope("cellar windows", () => {
      for (const side of ["front", "back"] as const) {
        const face = faceOf(pl, side);
        const bays = side === "front" ? pl.front : null;
        const n = side === "front" ? pl.front.length : pl.back;
        bayCentres(face, n).forEach((u, i) => {
          if ((bays?.[i] ?? "W") !== "W") return;
          this.quad("glass", face, u - 0.4, u + 0.4, 0.45, 0.8, 0.08);
        });
      }
    });
  }

  flatRoof(): void {
    const { pl, m, top } = this;
    m.scope("flat roof", () => {
      m.scope("parapet", () => {
        const t = 0.25;
        for (const s of [-1, 1]) m.box("wall", 0, s * (pl.d / 2 - t / 2), pl.w, t, top, top + PARAPET);
        for (const s of [-1, 1]) m.box("wall", s * (pl.w / 2 - t / 2), 0, t, pl.d - 2 * t, top, top + PARAPET);
        const [cx, cz, w, d] = grownPlan(pl.w, pl.d, 0.05, this.blank);
        // the coping: a frame round the roof, in the roof colour
        m.box("roof", cx, cz + d / 2 - 0.2, w, 0.4, top + PARAPET, top + PARAPET + 0.08);
        m.box("roof", cx, cz - d / 2 + 0.2, w, 0.4, top + PARAPET, top + PARAPET + 0.08);
        m.box("roof", cx - w / 2 + 0.2, cz, 0.4, d - 0.8, top + PARAPET, top + PARAPET + 0.08);
        m.box("roof", cx + w / 2 - 0.2, cz, 0.4, d - 0.8, top + PARAPET, top + PARAPET + 0.08);
      });
      m.cap("membrane", rect(pl.w - 0.5, pl.d - 0.5), top + 0.12);
      m.scope("penthouses", () => {
        for (const x of pl.stairs) {
          const z = pl.d / 2 - 3.2;
          m.box("wall", x, z, 3.4, 4.6, top + 0.12, top + 2.7);
          m.box("roof", x, z, 3.6, 4.8, top + 2.7, top + 2.82);
          m.cap("roof", rect(3.6, 4.8, x, z), top + 2.7, false);
          m.box("metal", x - 2.6, -pl.d / 2 + 2.2, 0.55, 0.55, top + 0.12, top + 1.1);
          m.box("metal", x + 2.6, -pl.d / 2 + 2.2, 0.55, 0.55, top + 0.12, top + 1.1);
        }
      });
    });
  }

  pitchedRoof(): void {
    const { pl, m, top } = this;
    m.scope("pitched roof", () => {
      const hipped = (side: "left" | "right"): boolean => !this.blank[side];
      // a blank (party) end runs out to the windowed variant's overhang as a gable
      const x0 = -pl.w / 2 - OVERHANG, x1 = pl.w / 2 + OVERHANG;
      const z0 = -pl.d / 2 - OVERHANG, z1 = pl.d / 2 + OVERHANG;
      const t = 0.2;
      const yE = top + t, run = (z1 - z0) / 2, yR = yE + run * PITCH;
      const r0 = hipped("left") ? x0 + run : x0, r1 = hipped("right") ? x1 - run : x1;
      const zm = 0;
      const e: Vec3[] = [[x0, yE, z0], [x1, yE, z0], [x1, yE, z1], [x0, yE, z1]];
      const R0: Vec3 = [r0, yR, zm], R1: Vec3 = [r1, yR, zm];
      lodPolygon(m, "roof", [e[3]!, e[2]!, R1, R0], [0, 1, PITCH]);
      lodPolygon(m, "roof", [e[0]!, e[1]!, R1, R0], [0, 1, -PITCH]);
      if (hipped("left")) lodPolygon(m, "roof", [e[0]!, e[3]!, R0], [-PITCH, 1, 0]);
      if (hipped("right")) lodPolygon(m, "roof", [e[1]!, e[2]!, R1], [PITCH, 1, 0]);
      // the fascia round the eaves and the soffit under the overhang
      const fascia = (a: Vec3, b: Vec3, n: Vec3): void => lodPolygon(m, "roof", [[a[0], top, a[2]], [b[0], top, b[2]], b, a], n);
      fascia(e[3]!, e[2]!, [0, 0, 1]);
      fascia(e[0]!, e[1]!, [0, 0, -1]);
      for (const [side, a, b, s] of [["left", e[0]!, e[3]!, -1], ["right", e[1]!, e[2]!, 1]] as const) {
        if (hipped(side)) {
          fascia(a, b, [s, 0, 0]);
        } else {
          // the gable: the end wall up under the roof, over the party slab
          const x = a[0];
          lodPolygon(m, "wall", [[x, top, z0], [x, top, z1], [x, yE, z1], [x, yR, zm], [x, yE, z0]], [s, 0, 0]);
        }
      }
      const sx0 = this.blank.left ? -pl.w / 2 : x0, sx1 = this.blank.right ? pl.w / 2 : x1;
      lodPolygon(m, "roof", [[sx0, top, z0], [sx1, top, z0], [sx1, top, z1], [sx0, top, z1]], [0, -1, 0]);
      // a vent hood per staircase on the front slope
      m.scope("roof vents", () => {
        for (const x of pl.stairs) {
          const z = run * 0.45;
          const y = yE + (z1 - z) * PITCH;
          m.box("roof", x, z, 1.8, 1.3, y - 0.4, y + 0.75);
          m.box("metal", x, z, 1.9, 1.4, y + 0.75, y + 0.85);
        }
      });
    });
  }
}

function build(kind: "slab" | "tower", specs: readonly ParamSpec[], given?: ParamValues): MeshBuilder {
  const p = resolveParams(specs, given);
  const c = new Panel(kind, p);
  c.body();
  c.facade();
  c.windows();
  c.balconies();
  c.ground();
  if (p.roofShape === "pitched") c.pitchedRoof();
  else c.flatRoof();
  if (anyBlank(c.blank)) {
    const ref = build(kind, specs, windowed(p)).positions();
    c.m.scope("party walls", () => partySlabs(c.m, ref, c.blank, c.pl.w, c.pl.d, c.top, "wall"));
  }
  return c.m;
}

export function panelSlab(p?: ParamValues): MeshBuilder { return build("slab", SLAB_PARAMS, p); }
export function panelTower(p?: ParamValues): MeshBuilder { return build("tower", TOWER_PARAMS, p); }

// --- the low level of detail (docs/models/lod.md): the mass in its plinth and wall
// bands, the colour fields, the roof and its penthouses, the balcony stacks; no windows

function lod(kind: "slab" | "tower", specs: readonly ParamSpec[], given?: ParamValues): MeshBuilder {
  const p = resolveParams(specs, given);
  const blank = blankSides(p);
  const pl = plan(kind, p);
  const top = wallTop(pl);
  const pitched = p.roofShape === "pitched";
  const bands: LodBand[] = [[0, PL, "plinth"], [PL, pitched ? top : top + PARAPET, "wall"]];
  const parts = [
    part((m) => lodWalls(m, lodRect(0, 0, pl.w, pl.d), bands)),
    part((m) => {
      if (!pitched) {
        lodParapet(m, bounds(0, 0, pl.w, pl.d), top + 0.12, top + PARAPET, 0.25, "membrane", "wall");
        return;
      }
      const x0 = -pl.w / 2 - OVERHANG, x1 = pl.w / 2 + OVERHANG, z0 = -pl.d / 2 - OVERHANG, z1 = pl.d / 2 + OVERHANG;
      const run = (z1 - z0) / 2, yE = top + 0.2, yR = yE + run * PITCH;
      const r0 = blank.left ? x0 : x0 + run, r1 = blank.right ? x1 : x1 - run;
      const e: Vec3[] = [[x0, yE, z0], [x1, yE, z0], [x1, yE, z1], [x0, yE, z1]];
      lodPolygon(m, "roof", [e[3]!, e[2]!, [r1, yR, 0], [r0, yR, 0]], [0, 1, PITCH]);
      lodPolygon(m, "roof", [e[0]!, e[1]!, [r1, yR, 0], [r0, yR, 0]], [0, 1, -PITCH]);
      if (!blank.left) lodPolygon(m, "roof", [e[0]!, e[3]!, [r0, yR, 0]], [-PITCH, 1, 0]);
      else lodPolygon(m, "wall", [[x0, top, z0], [x0, top, z1], [x0, yE, z1], [x0, yR, 0], [x0, yE, z0]], [-1, 0, 0]);
      if (!blank.right) lodPolygon(m, "roof", [e[1]!, e[2]!, [r1, yR, 0]], [PITCH, 1, 0]);
      else lodPolygon(m, "wall", [[x1, top, z0], [x1, top, z1], [x1, yE, z1], [x1, yR, 0], [x1, yE, z0]], [1, 0, 0]);
      lodCap(m, "roof", [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], top, false);
    }),
  ];
  const f = faceOf(pl, "front");
  const us = bayCentres(f, pl.front.length);
  if (p.facade === "insulated") {
    parts.push(part((m) => pl.front.forEach((b, i) => {
      if (b === "B") faceQuad(m, "accent", (u, y) => point(f, u, y, 0.02), us[i]! - BAY / 2, us[i]! + BAY / 2, PL, top, normal(f));
    }), 2));
  }
  if (p.balconies !== "none") {
    // each stack of balconies or loggias as one block in the parapets' colour
    parts.push(part((m) => pl.front.forEach((b, i) => {
      if (b === "B") lodBox(m, "accent", us[i]!, pl.d / 2 + OUT / 2 - 0.05, BAY - 0.15, OUT + 0.1, PL - 0.1, top - 1.6, "concrete");
    }), 3));
  }
  if (!pitched) parts.push(part((m) => { for (const x of pl.stairs) lodBox(m, "wall", x, pl.d / 2 - 3.2, 3.4, 4.6, top + 0.12, top + 2.7, "roof"); }, 1));
  return fit(palette(p), parts);
}

export function panelSlabLod(p?: ParamValues): MeshBuilder { return lod("slab", SLAB_PARAMS, p); }
export function panelTowerLod(p?: ParamValues): MeshBuilder { return lod("tower", TOWER_PARAMS, p); }

export const PANEL_HOUSES: readonly ProceduralDesign[] = [
  { id: "panel-slab", title: "Panel House", build: panelSlab, buildLod: panelSlabLod, params: SLAB_PARAMS },
  { id: "panel-tower", title: "Panel Tower Block", build: panelTower, buildLod: panelTowerLod, params: TOWER_PARAMS },
].map((d) => ({ ...d, catalog: PANEL_CATALOG, finishParams: PANEL_FINISH_PARAMS, references: "panel-houses" }));
