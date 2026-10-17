// The suburban village houses: five parametric designs in the style of the
// game's Kenney suburban houses (village-building-type-a .. -u in the webapp) --
// off-white walls on a dark plinth, a dark band between the storeys, chunky
// rounded window frames with light blue glass, thick overhanging roofs, chimney
// pots, planters with round bushes. Not copies: each design is a plan family,
// and its enum parameters pick the storeys, the roof, the entrance and the
// extras, plus the roof and wall colours. See docs/models/village.md.
//
// Two Quaternius-inspired timber families are registered below; their builder
// lives in timberCottages.ts.
//
// Modelled in metres, base at y = 0, the street front facing +z. Every design is
// deterministic. The ids (and the parameter names and values) are stored in the
// game's saved maps, so none is renamed once shipped.

import { MeshBuilder, chamferedRect, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";

import { villageTimberCottageLod, villageTimberHouseLod, villageCottageLod, villageLHouseLod, villageFamilyHouseLod, villageModernHouseLod, villageNarrowHouseLod, villageAlpineHutLod } from "./lodBuildings.ts";
export { villageTimberCottageLod, villageTimberHouseLod, villageCottageLod, villageLHouseLod, villageFamilyHouseLod, villageModernHouseLod, villageNarrowHouseLod, villageAlpineHutLod } from "./lodBuildings.ts";
import { TIMBER_COTTAGE_PARAMS, villageTimberCottage, villageTimberHouse } from "./timberCottages.ts";
export { villageTimberCottage, villageTimberHouse } from "./timberCottages.ts";
import { ALPINE_HUT_PARAMS, villageAlpineHut } from "./alpineHut.ts";
export { villageAlpineHut } from "./alpineHut.ts";

type Vec3 = [number, number, number];

// --- colours ------------------------------------------------------------------------

/** The roof colours, by parameter value. Green is the Kenney houses' own. */
export const ROOF_COLOURS: Record<string, string> = {
  green: "#4dbd84",
  red: "#c4553e",
  brown: "#8b5e3c",
  slate: "#5f6b7d",
  blue: "#4f7fb8",
};

/** The wall render colours, by parameter value. */
export const WALL_COLOURS: Record<string, string> = {
  white: "#eeedf0",
  cream: "#f2e6c4",
  ochre: "#e2bf78",
  rose: "#e8b9a9",
  sage: "#cfe0c8",
};

/** The modern house's cladding colours, by parameter value. */
export const CLADDING_COLOURS: Record<string, string> = {
  anthracite: "#3f4350",
  timber: "#9a6b45",
  sand: "#c9b48e",
  teal: "#3f6f73",
};

/** Every house's palette: `roof`, `wall` and `cladding` take the chosen colours. */
export function palette(roof: string, wall: string, cladding = "#3f4350"): Record<string, MaterialSpec> {
  return {
    roof: { color: roof, roughness: 0.7 },
    wall: { color: wall },
    cladding: { color: cladding },
    trim: { color: "#4a4d5b" },
    glass: { color: "#7ea3d9", metallic: 0.1, roughness: 0.3 },
    door: { color: "#6a4a36" },
    garageDoor: { color: "#d9dbe0" },
    stone: { color: "#8f909c" },
    metal: { color: "#c5cad3", metallic: 0.2, roughness: 0.5 },
    planter: { color: "#d9733f" },
    bush: { color: "#3fa864" },
    solar: { color: "#2b3d63", metallic: 0.3, roughness: 0.3 },
    // shutters take the roof's colour
    shutter: { color: roof, roughness: 0.8 },
    flowers: { color: "#e2607f" },
    lamp: { color: "#ffd27a", roughness: 0.4 },
  };
}

// --- the parameters ----------------------------------------------------------------

const v = (value: string, title: string): { value: string; title: string } => ({ value, title });

const ROOF_PARAM: ParamSpec = {
  name: "roof", title: "Roof colour", default: "green",
  values: [v("green", "Green"), v("red", "Red tiles"), v("brown", "Brown"), v("slate", "Slate grey"), v("blue", "Blue")],
};

const WALLS_PARAM: ParamSpec = {
  name: "walls", title: "Wall colour", default: "white",
  values: [v("white", "White"), v("cream", "Cream"), v("ochre", "Ochre"), v("rose", "Rose"), v("sage", "Sage green")],
};

const CLADDING_PARAM: ParamSpec = {
  name: "cladding", title: "Cladding", default: "anthracite",
  values: [v("anthracite", "Anthracite"), v("timber", "Timber"), v("sand", "Sand"), v("teal", "Teal")],
};

const ROOF_SHAPE_PARAM: ParamSpec = {
  name: "roofShape", title: "Roof shape", default: "gable",
  values: [v("gable", "Gable"), v("hip", "Hipped")],
};

const CHIMNEY_PARAM: ParamSpec = {
  name: "chimney", title: "Chimney", default: "brick",
  values: [v("brick", "Chimney"), v("none", "No chimney")],
};

/**
 * The parameters that only recolour a house: they change no geometry, so the
 * tests build their values one at a time rather than every combination.
 */
export const VILLAGE_FINISH_PARAMS: readonly string[] = ["roof", "walls", "cladding", "timber", "accent"];

// --- dimensions ---------------------------------------------------------------------

/** Top of the plinth, where the walls and the ground-floor doors start. */
export const PL = 0.5;
/** Floor-to-floor height. */
export const ST = 3;
/** The chamfer of the wall corners. */
export const CH = 0.15;
/** Roof thickness (along its normal), and how far it overhangs the walls. */
export const RT = 0.25;
export const OH = 0.45;
/** Window sill and height above a storey's floor. */
const WIN_Y = 0.85;
const WIN_H = 1.45;

/** The storey's floor level, storey 0 the ground floor. */
export const floorY = (storey: number): number => PL + storey * ST;

// --- the house builder ----------------------------------------------------------------

/** A wall face: the plane `axis` = `at`, facing `s` along that axis; `u` runs along the other horizontal axis. */
interface Face {
  axis: "x" | "z";
  s: 1 | -1;
  at: number;
}

export type RoofKind = "gable" | "hip" | "flat" | "none";

/** One box-shaped block of a house, from the plinth to its eaves, and its roof. */
export interface Volume {
  cx: number;
  cz: number;
  /** Extent along x and along z. */
  w: number;
  d: number;
  /** Height of the wall tops (the roof's underside at the wall line). */
  eave: number;
  roof: RoofKind;
  /** The ridge direction of a gable or hip roof. */
  axis: "x" | "z";
  /** Rise per run of the roof slopes. */
  pitch: number;
  /** Floor bands at these heights. */
  bands: number[];
  /** Draw the gable triangle at the low / high end of the ridge (a gable butting into another block is hidden). */
  gables?: [boolean, boolean];
  /** The walls' material, "wall" unless set. */
  wallMat?: string;
  /** Sides of a flat roof left without a parapet (where a terrace meets a taller block). */
  open?: Array<"front" | "back" | "left" | "right">;
  /** Gutters along the eaves of a gable or hip roof; on unless false. */
  gutters?: boolean;
}

/**
 * The mesh builder plus a mirror: a design draws its plan once, and the `side`
 * parameters mirror it in x. Every point and ring goes through here.
 */
export class House {
  readonly m: MeshBuilder;
  /** Shutters beside every ordinary window. */
  shutters = false;
  /** Flower boxes under the upper storeys' ordinary windows. */
  flowerBoxes = false;

  constructor(pal: Record<string, MaterialSpec>, private readonly mx: 1 | -1 = 1) {
    this.m = new MeshBuilder(pal);
  }

  scope<T>(name: string, fn: () => T): T {
    return this.m.scope(name, fn);
  }

  p(x: number, y: number, z: number): Vec3 {
    return [this.mx * x, y, z];
  }

  /** A ring mirrored and, when mirrored, re-wound counter-clockwise. */
  ring(r: Ring): Ring {
    return this.mx === 1 ? r : r.map(([x, z]): [number, number] => [-x, z]).reverse();
  }

  /** A box; `bottom` also closes its underside (a slab seen from below). */
  box(mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, top = true, bottom = false): void {
    this.m.box(mat, this.mx * cx, cz, w, d, y0, y1, 0, top);
    if (bottom) this.m.cap(mat, rect(w, d, this.mx * cx, cz), y0, false);
  }

  prism(mat: string, r: Ring, y0: number, y1: number, top = true): void {
    this.m.prism(mat, this.ring(r), y0, y1, top);
  }

  loft(mat: string, lower: Ring, y0: number, upper: Ring, y1: number, top = true): void {
    this.m.loft(mat, this.ring(lower), y0, this.ring(upper), y1, top);
  }

  cap(mat: string, r: Ring, y: number, up = true): void {
    this.m.cap(mat, this.ring(r), y, up);
  }

  spire(mat: string, r: Ring, y0: number, y1: number): void {
    this.m.spire(mat, this.ring(r), y0, y1);
  }

  slab(mat: string, outline: Vec3[], depth: Vec3): void {
    this.m.slab(mat, outline.map((q) => this.p(...q)), this.p(...depth));
  }

  /** A point on a face: `u` along it, `y` up, `off` out of it. */
  onFace(f: Face, u: number, y: number, off: number): Vec3 {
    return f.axis === "x" ? [f.at + f.s * off, y, u] : [u, y, f.at + f.s * off];
  }

  /** A flat panel on a face: the outline (u, y) pushed out from `off0` to `off1`. */
  panel(mat: string, f: Face, outline: Array<[number, number]>, off0: number, off1: number): void {
    const front = outline.map(([u, y]) => this.onFace(f, u, y, off1));
    const back = this.onFace(f, 0, 0, off0 - off1);
    const origin = this.onFace(f, 0, 0, 0);
    this.slab(mat, front, [back[0] - origin[0], back[1] - origin[1], back[2] - origin[2]]);
  }

  // --- volumes ---------------------------------------------------------------------

  /** The faces of a volume: front (+z), back, right (+x), left. */
  faces(vol: Volume): { front: Face; back: Face; right: Face; left: Face } {
    return {
      front: { axis: "z", s: 1, at: vol.cz + vol.d / 2 },
      back: { axis: "z", s: -1, at: vol.cz - vol.d / 2 },
      right: { axis: "x", s: 1, at: vol.cx + vol.w / 2 },
      left: { axis: "x", s: -1, at: vol.cx - vol.w / 2 },
    };
  }

  /** Plinth, walls and floor bands of a volume; the roof draws the rest. */
  walls(vol: Volume, wallMat = vol.wallMat ?? "wall"): void {
    const { cx, cz, w, d } = vol;
    this.scope("plinth", () => {
      this.prism("trim", chamferedRect(w + 0.5, d + 0.5, CH + 0.2, cx, cz), 0, PL - 0.15, false);
      this.loft("trim", chamferedRect(w + 0.5, d + 0.5, CH + 0.2, cx, cz), PL - 0.15, chamferedRect(w + 0.24, d + 0.24, CH + 0.1, cx, cz), PL);
    });
    this.scope("walls", () => this.prism(wallMat, chamferedRect(w, d, CH, cx, cz), PL - 0.05, vol.eave, false));
    if (vol.bands.length) {
      this.scope("floor bands", () => {
        for (const y of vol.bands) {
          const r = chamferedRect(w + 0.16, d + 0.16, CH + 0.05, cx, cz);
          this.prism("trim", r, y, y + 0.22);
          this.cap("trim", r, y, false);
        }
      });
    }
  }

  /** Maps a roof's ridge frame (a along the ridge, b across it) to the model. */
  private ridgeFrame(vol: Volume): {
    A: number;
    B: number;
    at: (a: number, y: number, b: number) => Vec3;
    dir: (a: number, y: number, b: number) => Vec3;
  } {
    const alongX = vol.axis === "x";
    return {
      A: (alongX ? vol.w : vol.d) / 2,
      B: (alongX ? vol.d : vol.w) / 2,
      at: (a, y, b) => (alongX ? [vol.cx + a, y, vol.cz + b] : [vol.cx + b, y, vol.cz + a]),
      dir: (a, y, b) => (alongX ? [a, y, b] : [b, y, a]),
    };
  }

  /** The height of the roof's top surface over a point (x, z) of a gable or hip volume. */
  roofTop(vol: Volume, x: number, z: number): number {
    const alongX = vol.axis === "x";
    const a = Math.abs(alongX ? x - vol.cx : z - vol.cz);
    const b = Math.abs(alongX ? z - vol.cz : x - vol.cx);
    const { A, B } = this.ridgeFrame(vol);
    const tv = RT * Math.hypot(1, vol.pitch);
    const run = vol.roof === "hip" ? Math.min(B - b, A - a) : B - b;
    return vol.eave + tv + run * vol.pitch;
  }

  /** The volume's roof: thick sloped slabs (and gable walls), or a flat roof with a parapet. */
  roof(vol: Volume): void {
    if (vol.roof === "none") return;
    if (vol.roof === "flat") {
      this.scope("flat roof", () => {
        const r = chamferedRect(vol.w + 0.4, vol.d + 0.4, CH + 0.1, vol.cx, vol.cz);
        this.prism("trim", r, vol.eave, vol.eave + 0.3);
        this.cap("trim", r, vol.eave, false);
        const { cx, cz, w, d } = vol;
        const y0 = vol.eave + 0.25;
        const y1 = vol.eave + 0.6;
        const open = vol.open ?? [];
        if (!open.includes("front")) this.box("trim", cx, cz + d / 2 + 0.05, w + 0.3, 0.3, y0, y1);
        if (!open.includes("back")) this.box("trim", cx, cz - d / 2 - 0.05, w + 0.3, 0.3, y0, y1);
        if (!open.includes("right")) this.box("trim", cx + w / 2 + 0.05, cz, 0.3, d - 0.3, y0, y1);
        if (!open.includes("left")) this.box("trim", cx - w / 2 - 0.05, cz, 0.3, d - 0.3, y0, y1);
      });
      return;
    }
    const { A, B, at, dir } = this.ridgeFrame(vol);
    const s = vol.pitch;
    const k = Math.hypot(1, s);
    const tv = RT * k; // the slab's vertical thickness
    // into the roof along a slope's normal: (na s, 1, nb s) / k is the outward normal of the slope facing (na, nb)
    const dn = (na: number, nb: number): Vec3 => dir((-RT * na * s) / k, -RT / k, (-RT * nb * s) / k);
    if (vol.roof === "gable") {
      this.scope("roof", () => {
        const yAt = (b: number): number => vol.eave + tv + (B - Math.abs(b)) * s;
        for (const sb of [1, -1]) {
          const e = sb * (B + OH);
          this.slab("roof", [
            at(-A - OH, yAt(0), 0), at(A + OH, yAt(0), 0), at(A + OH, yAt(e), e), at(-A - OH, yAt(e), e),
          ], dn(0, sb));
        }
      });
      this.scope("gables", () => {
        const ends = vol.gables ?? [true, true];
        for (const sa of [-1, 1]) {
          if (!ends[sa < 0 ? 0 : 1]) continue;
          const a = sa * A;
          const e = B - CH;
          const outline = [
            at(a, vol.eave, -e), at(a, vol.eave, e), at(a, vol.eave + CH * s, e),
            at(a, vol.eave + B * s, 0), at(a, vol.eave + CH * s, -e),
          ];
          this.slab(vol.wallMat ?? "wall", outline, dir(-sa * 0.3, 0, 0));
        }
      });
      if (vol.gutters !== false) {
        this.scope("gutters", () => {
          // under the eave edge, 5 cm short of the roof's ends so no end face is shared
          for (const sb of [1, -1]) this.gutter(vol, 0, sb * (B + OH + 0.08), 2 * (A + OH) - 0.1, vol.eave - OH * s);
        });
      }
      return;
    }
    // hip: four slabs whose top surfaces meet on the hips and the ridge
    this.scope("roof", () => {
      const ye = vol.eave + tv - OH * s;
      const ridge = A - B;
      const yr = ye + (B + OH) * s;
      const E = A + OH;
      const F = B + OH;
      for (const sb of [1, -1]) {
        this.slab("roof", [at(-E, ye, sb * F), at(E, ye, sb * F), at(ridge, yr, 0), at(-ridge, yr, 0)], dn(0, sb));
      }
      for (const sa of [1, -1]) {
        this.slab("roof", [at(sa * E, ye, F), at(sa * E, ye, -F), at(sa * ridge, yr, 0)], dn(sa, 0));
      }
    });
    if (vol.gutters !== false) {
      this.scope("gutters", () => {
        const y = vol.eave - OH * s;
        for (const sb of [1, -1]) this.gutter(vol, 0, sb * (B + OH + 0.08), 2 * (A + OH) + 0.32, y);
        for (const sa of [1, -1]) this.gutter(vol, sa * (A + OH + 0.08), 0, 0.16, y, 2 * (B + OH) + 0.32);
      });
    }
  }

  /**
   * A gutter centred at (a, b) of a roof's ridge frame, `la` long along the ridge
   * (`lb` across it), its top 10 cm under `y`, the roof's underside at the eave edge.
   */
  private gutter(vol: Volume, a: number, b: number, la: number, y: number, lb = 0.16): void {
    const { at } = this.ridgeFrame(vol);
    const c = at(a, 0, b);
    const alongX = vol.axis === "x";
    this.box("stone", c[0], c[2], alongX ? la : lb, alongX ? lb : la, y - 0.12, y + 0.1);
  }

  // --- openings ----------------------------------------------------------------------

  /** A window: a rounded dark frame, light blue glass, `bars` vertical mullions and a sill. */
  window(f: Face, u: number, y0: number, w = 1.3, h = WIN_H, bars = 1): void {
    this.scope("window", () => {
      this.panel("trim", f, roundRect(u, y0 + h / 2, w + 0.26, h + 0.26, 0.2), -0.03, 0.07);
      this.panel("glass", f, roundRect(u, y0 + h / 2, w, h, 0.1), 0.02, 0.1);
      for (let i = 1; i <= bars; i++) {
        const bu = u - w / 2 + (i * w) / (bars + 1);
        this.panel("trim", f, rectOutline(bu, y0 + h / 2, 0.08, h - 0.04), 0.05, 0.13);
      }
      // the transom, a third of the way down
      if (h > 1.1) this.panel("trim", f, rectOutline(u, y0 + h * 0.68, w - 0.04, 0.07), 0.05, 0.13);
      this.panel("trim", f, rectOutline(u, y0 - 0.18, w + 0.5, 0.14), -0.03, 0.2);
      const ordinary = w <= 1.4 && h <= WIN_H;
      if (this.shutters && ordinary) {
        const sw = w * 0.42;
        for (const side of [-1, 1]) {
          const su = u + side * (w / 2 + 0.15 + sw / 2);
          this.panel("shutter", f, rectOutline(su, y0 + h / 2, sw, h + 0.2), -0.03, 0.06);
          for (let i = 0; i < 4; i++) {
            this.panel("shutter", f, rectOutline(su, y0 + 0.1 + ((i + 0.5) * (h - 0.2)) / 4, sw - 0.12, 0.06), 0.05, 0.09);
          }
        }
      }
      if (this.flowerBoxes && ordinary && y0 > floorY(1)) {
        this.panel("planter", f, rectOutline(u, y0 - 0.32, w + 0.3, 0.26), -0.05, 0.32);
        for (let i = 0; i < 3; i++) {
          const c = this.onFace(f, u - w / 2 + ((i + 0.5) * w) / 3, 0, 0.17);
          this.bush(c[0], c[2], y0 - 0.22, 0.17, "flowers");
        }
      }
    });
  }

  /** A round attic window, centred at (u, y). */
  roundWindow(f: Face, u: number, y: number, r = 0.42): void {
    this.scope("round window", () => {
      this.panel("trim", f, circle(u, y, r + 0.13, 12), -0.03, 0.07);
      this.panel("glass", f, circle(u, y, r, 12), 0.02, 0.1);
      this.panel("trim", f, rectOutline(u, y, 0.07, 2 * r - 0.04), 0.05, 0.13);
    });
  }

  /** A front door with a round-topped frame and a doorstep; `glazed` makes it a glass terrace door. */
  door(f: Face, u: number, y0 = PL, glazed = false): void {
    this.scope("door", () => {
      const w = 1.1;
      const h = 2.2;
      this.panel("trim", f, archOutline(u, y0, w + 0.28, h + 0.14, 0.3), -0.03, 0.07);
      // 2 cm up, so its bottom face is not the frame's
      this.panel(glazed ? "glass" : "door", f, archOutline(u, y0 + 0.02, w, h - 0.02, 0.2), 0.02, 0.1);
      if (glazed) {
        this.panel("trim", f, rectOutline(u, y0 + h / 2, 0.08, h - 0.4), 0.05, 0.13);
      } else {
        this.panel("metal", f, rectOutline(u + w / 2 - 0.18, y0 + 1.05, 0.08, 0.08), 0.06, 0.16);
        for (const py of [0.55, 1.5]) this.panel("door", f, rectOutline(u - 0.06, y0 + py, w - 0.42, 0.7), 0.08, 0.13);
      }
      if (y0 === PL) {
        // a wall lamp beside the door
        const lu = u + w / 2 + 0.45;
        this.panel("trim", f, rectOutline(lu, y0 + 1.95, 0.2, 0.32), -0.03, 0.1);
        this.panel("lamp", f, rectOutline(lu, y0 + 1.95, 0.13, 0.22), 0.08, 0.2);
        // the doorstep, on the ground in front of the plinth
        this.panel("trim", f, rectOutline(u, PL / 2 - 0.08, w + 0.7, PL - 0.16), 0.0, 0.75);
      }
    });
  }

  /** A sectional garage door, its bottom on the ground. */
  garageDoor(f: Face, u: number, w = 2.6, h = 2.3): void {
    this.scope("garage door", () => {
      // stood out past the plinth, whose edge it cuts through
      this.panel("trim", f, rectOutline(u, h / 2 + 0.05, w + 0.3, h + 0.1), -0.03, 0.33);
      this.panel("garageDoor", f, rectOutline(u, h / 2 + 0.02, w, h - 0.04), 0.28, 0.36);
      for (let i = 1; i < 5; i++) this.panel("trim", f, rectOutline(u, (i * h) / 5, w - 0.04, 0.05), 0.31, 0.39);
    });
  }

  // --- details ------------------------------------------------------------------------

  /** A brick chimney with two pots, rising through a gable or hip roof at (x, z). */
  chimney(vol: Volume, x: number, z: number): void {
    this.scope("chimney", () => {
      const top = Math.max(
        this.roofTop(vol, x - 0.4, z - 0.4), this.roofTop(vol, x + 0.4, z - 0.4),
        this.roofTop(vol, x - 0.4, z + 0.4), this.roofTop(vol, x + 0.4, z + 0.4),
      ) + 0.9;
      this.box("stone", x, z, 0.8, 0.8, vol.eave, top, false);
      this.box("trim", x, z, 1.0, 1.0, top, top + 0.18);
      for (const dx of [-0.2, 0.2]) {
        this.prism("stone", ngon(8, 0.13, Math.PI / 8, x + dx, z), top + 0.1, top + 0.55);
      }
    });
  }

  /** A planter box on the ground in front of a face, with round bushes. */
  planter(f: Face, u: number, len = 2.2, bushes = 3): void {
    this.scope("planter", () => {
      const off0 = 0.3;
      const off1 = 1.0;
      const a = this.onFace(f, u - len / 2, 0, off0);
      const b = this.onFace(f, u + len / 2, 0, off1);
      const cx = (a[0] + b[0]) / 2;
      const cz = (a[2] + b[2]) / 2;
      const w = Math.abs(b[0] - a[0]);
      const d = Math.abs(b[2] - a[2]);
      this.box("planter", cx, cz, w, d, 0, 0.55);
      for (let i = 0; i < bushes; i++) {
        const t = (i + 0.5) / bushes;
        const c = this.onFace(f, u - len / 2 + t * len, 0, (off0 + off1) / 2);
        this.bush(c[0], c[2], 0.5, 0.36 + 0.06 * ((i * 7) % 3));
      }
    });
  }

  /** A round low-poly bush standing at (x, y0, z). */
  bush(x: number, z: number, y0: number, r: number, mat = "bush"): void {
    const ring = (rr: number): Ring => ngon(8, rr, Math.PI / 8, x, z);
    this.loft(mat, ring(r * 0.6), y0, ring(r), y0 + r * 0.6, false);
    this.loft(mat, ring(r), y0 + r * 0.6, ring(r * 0.75), y0 + r * 1.3, false);
    this.spire(mat, ring(r * 0.75), y0 + r * 1.3, y0 + r * 1.75);
  }

  /**
   * A dormer on the front (+z) slope of a gable or hip roof whose ridge runs
   * along x: a small gabled box, `w` wide, centred at x, with a window. It
   * reaches back far enough for its ridge to die into the main roof.
   */
  dormer(vol: Volume, x: number, w = 1.4): void {
    this.scope("dormer", () => {
      const B = vol.d / 2;
      const zf = vol.cz + B * 0.72;
      const yR = this.roofTop(vol, x, zf);
      const pitch = 0.5;
      const dorm: Volume = {
        cx: x, cz: zf - 1.0, w, d: 2.0, eave: yR + 1.25, roof: "gable", axis: "z", pitch,
        bands: [], gables: [false, true], gutters: false,
      };
      this.prism("wall", chamferedRect(w, dorm.d, CH, dorm.cx, dorm.cz), yR - 0.6, dorm.eave, false);
      this.roof(dorm);
      this.window({ axis: "z", s: 1, at: zf }, x, yR + 0.14, w - 0.55, 0.85);
    });
  }

  /** Vertical battens on a clad face from u0 to u1, every `step`, skipping the given (u, half-width) openings. */
  battens(f: Face, u0: number, u1: number, y0: number, y1: number, skip: Array<[number, number]>, step = 0.45): void {
    this.scope("battens", () => {
      const n = Math.floor((u1 - u0) / step);
      for (let i = 0; i <= n; i++) {
        const u = u0 + (u1 - u0 - n * step) / 2 + i * step;
        if (skip.some(([c, hw]) => Math.abs(u - c) < hw + 0.12)) continue;
        this.panel("cladding", f, rectOutline(u, (y0 + y1) / 2, 0.07, y1 - y0), -0.02, 0.05);
      }
    });
  }

  /** A drainpipe down a wall, beside the corner at `u`. */
  drainpipe(f: Face, u: number, top: number): void {
    this.scope("drainpipe", () => {
      this.panel("stone", f, rectOutline(u, (PL + top) / 2 + 0.05, 0.14, top - PL - 0.1), -0.02, 0.16);
    });
  }

  /** A shed canopy over a door: a sloping roof slab on two brackets, or on posts with a deck for a porch. */
  canopy(f: Face, u: number, width: number, depth: number, y: number, posts: boolean): void {
    this.scope(posts ? "porch" : "canopy", () => {
      const drop = 0.25 * depth;
      const th = 0.16;
      const u0 = u - width / 2;
      const u1 = u + width / 2;
      const outline: Vec3[] = [
        this.onFace(f, u0, y + th, -0.1), this.onFace(f, u1, y + th, -0.1),
        this.onFace(f, u1, y + th - drop, depth), this.onFace(f, u0, y + th - drop, depth),
      ];
      this.slab("roof", outline, [0, -th, 0]);
      if (posts) {
        for (const pu of [u0 + 0.2, u1 - 0.2]) {
          const c = this.onFace(f, pu, 0, depth - 0.2);
          this.prism("metal", ngon(6, 0.09, 0, c[0], c[2]), PL - 0.25, y - drop + 0.1);
        }
        this.panel("trim", f, rectOutline(u, PL / 2 - 0.08, width - 0.1, PL - 0.16), 0.0, depth);
      } else {
        for (const bu of [u0 + 0.12, u1 - 0.12]) {
          this.slab("trim", [
            this.onFace(f, bu - 0.05, y, 0.05), this.onFace(f, bu - 0.05, y - 0.6, 0.05), this.onFace(f, bu - 0.05, y - drop * 0.6, depth * 0.6),
          ], f.axis === "z" ? [0.1, 0, 0] : [0, 0, 0.1]);
        }
      }
    });
  }

  /** A rectangular grid of solar panels lying on the +b or -b slope of a gable or hip roof. */
  solar(vol: Volume, x0: number, x1: number, z0: number, z1: number, cols: number, rows: number): void {
    this.scope("solar panels", () => {
      const s = vol.pitch;
      const k = Math.hypot(1, s);
      // the slope's normal from the roof height gradient
      const gx = (this.roofTop(vol, (x0 + x1) / 2 + 0.01, (z0 + z1) / 2) - this.roofTop(vol, (x0 + x1) / 2 - 0.01, (z0 + z1) / 2)) / 0.02;
      const gz = (this.roofTop(vol, (x0 + x1) / 2, (z0 + z1) / 2 + 0.01) - this.roofTop(vol, (x0 + x1) / 2, (z0 + z1) / 2 - 0.01)) / 0.02;
      const n: Vec3 = [-gx / k, 1 / k, -gz / k];
      const pt = (x: number, z: number, lift: number): Vec3 => [x + n[0] * lift, this.roofTop(vol, x, z) + n[1] * lift, z + n[2] * lift];
      const quad = (mat: string, ax: number, bx: number, az: number, bz: number, lift: number, thick: number): void => {
        this.slab(mat, [pt(ax, az, lift), pt(bx, az, lift), pt(bx, bz, lift), pt(ax, bz, lift)], [-n[0] * thick, -n[1] * thick, -n[2] * thick]);
      };
      quad("metal", x0, x1, z0, z1, 0.06, 0.12);
      const gap = 0.08;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const ax = x0 + gap + ((x1 - x0 - gap) * i) / cols;
          const bx = x0 + ((x1 - x0 - gap) * (i + 1)) / cols;
          const az = z0 + gap + ((z1 - z0 - gap) * j) / rows;
          const bz = z0 + ((z1 - z0 - gap) * (j + 1)) / rows;
          quad("solar", ax, bx, az, bz, 0.1, 0.06);
        }
      }
    });
  }

  /** A railing: posts and a top rail from (x0, z0) to (x1, z1) at deck height y. */
  railing(x0: number, z0: number, x1: number, z1: number, y: number, h = 1.0): void {
    this.scope("railing", () => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const n = Math.max(2, Math.round(len / 1.2) + 1);
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        this.box("metal", x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 0.08, 0.08, y, y + h - 0.06, false);
      }
      const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      this.box("metal", cx, cz, alongX ? len + 0.12 : 0.12, alongX ? 0.12 : len + 0.12, y + h - 0.08, y + h);
      this.box("metal", cx, cz, alongX ? len : 0.05, alongX ? 0.05 : len, y + 0.45, y + 0.5);
    });
  }
}

// --- 2D outlines on a face ------------------------------------------------------------

/** A w x h rectangle centred at (u, y). */
function rectOutline(u: number, y: number, w: number, h: number): Array<[number, number]> {
  return [[u - w / 2, y - h / 2], [u + w / 2, y - h / 2], [u + w / 2, y + h / 2], [u - w / 2, y + h / 2]];
}

/** A w x h rectangle centred at (u, y) with corners rounded by r (three points a corner). */
function roundRect(u: number, y: number, w: number, h: number, r: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const corners: Array<[number, number, number]> = [
    [u + w / 2 - r, y - h / 2 + r, -Math.PI / 2], [u + w / 2 - r, y + h / 2 - r, 0],
    [u - w / 2 + r, y + h / 2 - r, Math.PI / 2], [u - w / 2 + r, y - h / 2 + r, Math.PI],
  ];
  for (const [cu, cy, a0] of corners) {
    for (let i = 0; i < 3; i++) {
      const a = a0 + (i / 2) * (Math.PI / 2);
      out.push([cu + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return out;
}

/** A door outline: square at the bottom (y0), its two top corners rounded by r. */
function archOutline(u: number, y0: number, w: number, h: number, r: number): Array<[number, number]> {
  const out: Array<[number, number]> = [[u - w / 2, y0], [u + w / 2, y0]];
  for (const [cu, a0] of [[u + w / 2 - r, 0], [u - w / 2 + r, Math.PI / 2]] as const) {
    for (let i = 0; i < 4; i++) {
      const a = a0 + (i / 3) * (Math.PI / 2);
      out.push([cu + r * Math.cos(a), y0 + h - r + r * Math.sin(a)]);
    }
  }
  return out;
}

/** A regular n-gon of radius r about (u, y) on a face. */
function circle(u: number, y: number, r: number, n: number): Array<[number, number]> {
  return Array.from({ length: n }, (_, i): [number, number] => {
    const a = (i / n) * Math.PI * 2;
    return [u + r * Math.cos(a), y + r * Math.sin(a)];
  });
}

/** A volume of `storeys` floors with bands between them. */
export function volume(cx: number, cz: number, w: number, d: number, storeys: number, roof: RoofKind, axis: "x" | "z", pitch = 0.8): Volume {
  return {
    cx, cz, w, d, roof, axis, pitch,
    eave: floorY(storeys),
    bands: Array.from({ length: storeys - 1 }, (_, i) => floorY(i + 1) - 0.11),
  };
}

/**
 * The knee wall of a one-storey pitched-roof house: its eaves sit 40 cm above
 * the storey, so the overhang and the gutters clear the window heads.
 */
export const knee = (storeys: number): number => (storeys === 1 ? 0.4 : 0);

/** Windows spread over a storey of a face at the given `u` positions. */
function windows(h: House, f: Face, storey: number, us: number[], w = 1.3): void {
  for (const u of us) h.window(f, u, floorY(storey) + WIN_Y, w);
}

/** The gable's attic window: centred on the gable of a ridge along `axis`. */
function atticWindow(h: House, vol: Volume, f: Face): void {
  const B = (vol.axis === "x" ? vol.d : vol.w) / 2;
  const rise = B * vol.pitch;
  if (rise < 1.6) return;
  const u = f.axis === "x" ? vol.cz : vol.cx;
  h.roundWindow(f, u, vol.eave + rise * 0.42, Math.min(0.42, rise * 0.2));
}

// --- the designs ---------------------------------------------------------------------

export const COTTAGE_PARAMS: readonly ParamSpec[] = [
  { name: "storeys", title: "Storeys", default: "two", values: [v("one", "One storey"), v("two", "Two storeys")] },
  ROOF_SHAPE_PARAM,
  {
    name: "entrance", title: "Entrance", default: "canopy",
    values: [v("step", "Doorstep"), v("canopy", "Canopy"), v("porch", "Porch on posts"), v("garden", "Planters")],
  },
  CHIMNEY_PARAM,
  { name: "dormers", title: "Dormers", default: "none", values: [v("none", "None"), v("dormers", "Front dormers")] },
  ROOF_PARAM,
  WALLS_PARAM,
];

/** A one-block house: one or two storeys, a gable or hipped roof, a choice of entrance. */
export function villageCottage(params?: ParamValues): MeshBuilder {
  const p = resolveParams(COTTAGE_PARAMS, params);
  const h = new House(palette(ROOF_COLOURS[p.roof]!, WALL_COLOURS[p.walls]!));
  const storeys = p.storeys === "two" ? 2 : 1;
  h.flowerBoxes = p.entrance === "garden";
  const main = volume(0, 0, 9, 7, storeys, p.roofShape === "hip" ? "hip" : "gable", "x");
  main.eave += knee(storeys);
  const f = h.faces(main);
  h.scope("house", () => {
    h.walls(main);
    h.roof(main);
  });
  h.scope("front", () => {
    h.door(f.front, -1.2);
    windows(h, f.front, 0, [-3.4, 1.4, 3.2]);
    for (let s = 1; s < storeys; s++) windows(h, f.front, s, [-3.2, -1.2, 1.4, 3.2]);
    if (p.entrance === "canopy") h.canopy(f.front, -1.2, 2.0, 1.1, PL + 2.65, false);
    if (p.entrance === "porch") h.canopy(f.front, -1.2, 2.6, 2.0, PL + 2.75, true);
    if (p.entrance === "garden") {
      h.planter(f.front, 2.3, 2.6, 3);
      h.planter(f.right, -1.2, 2.2, 2);
    }
    h.drainpipe(f.front, 4.2, main.eave);
  });
  h.scope("sides", () => {
    for (let s = 0; s < storeys; s++) {
      windows(h, f.right, s, [-1.4, 1.6]);
      windows(h, f.left, s, [0]);
      windows(h, f.back, s, [-2.6, 0.2, 2.8]);
    }
    if (main.roof === "gable") {
      atticWindow(h, main, f.right);
      atticWindow(h, main, f.left);
    }
  });
  if (p.dormers === "dormers") {
    // a hipped roof's front slope narrows toward the ridge: one dormer in the middle
    if (main.roof === "gable") {
      h.dormer(main, -2.2);
      h.dormer(main, 2.3);
    } else {
      h.dormer(main, 0, 1.3);
    }
  }
  if (p.chimney === "brick") h.chimney(main, -2.6, -1.0);
  return h.m;
}

export const L_HOUSE_PARAMS: readonly ParamSpec[] = [
  { name: "storeys", title: "Storeys", default: "two", values: [v("one", "One storey"), v("two", "Two storeys")] },
  ROOF_SHAPE_PARAM,
  { name: "side", title: "Front wing", default: "left", values: [v("left", "Left"), v("right", "Right")] },
  {
    name: "extras", title: "Extras", default: "planters",
    values: [v("none", "None"), v("planters", "Planters"), v("solar", "Solar panels")],
  },
  ROOF_PARAM,
  WALLS_PARAM,
];

/** An L-shaped house: a main block along the street and a gabled wing reaching forward. */
export function villageLHouse(params?: ParamValues): MeshBuilder {
  const p = resolveParams(L_HOUSE_PARAMS, params);
  const h = new House(palette(ROOF_COLOURS[p.roof]!, WALL_COLOURS[p.walls]!), p.side === "left" ? -1 : 1);
  const storeys = p.storeys === "two" ? 2 : 1;
  const shape = p.roofShape === "hip" ? "hip" : "gable";
  const main = volume(0, -1.5, 10, 7, storeys, shape, "x");
  main.eave += knee(storeys);
  // the wing runs from the main block's ridge to 4 m in front of it
  // (its eaves stop short of the main block's end wall)
  const wing: Volume = { ...volume(1.9, 1.5, 4.6, 6, storeys, shape, "z"), gables: [false, true] };
  wing.eave += knee(storeys);
  const fm = h.faces(main);
  const fw = h.faces(wing);
  h.flowerBoxes = p.extras === "planters";
  h.scope("main block", () => {
    h.walls(main);
    h.roof(main);
  });
  h.scope("wing", () => {
    h.walls(wing);
    h.roof(wing);
  });
  h.scope("front", () => {
    h.door(fm.front, -1.6);
    windows(h, fm.front, 0, [-3.7]);
    for (let s = 1; s < storeys; s++) windows(h, fm.front, s, [-3.7, -1.6]);
    for (let s = 0; s < storeys; s++) h.window(fw.front, wing.cx, floorY(s) + WIN_Y, s === 0 ? 2.2 : 1.4, WIN_H, s === 0 ? 2 : 1);
    if (shape === "gable") atticWindow(h, wing, fw.front);
    h.canopy(fm.front, -1.6, 2.0, 1.0, PL + 2.65, false);
    h.drainpipe(fm.front, -4.65, main.eave);
  });
  h.scope("sides", () => {
    for (let s = 0; s < storeys; s++) {
      windows(h, fw.left, s, [3.4]);
      windows(h, fw.right, s, [3.4]);
      windows(h, fm.right, s, [-3.4]);
      windows(h, fm.left, s, [-2.6, -0.2]);
      windows(h, fm.back, s, [-3.4, -1.0, 1.4, 3.6]);
    }
    if (shape === "gable") {
      atticWindow(h, main, fm.left);
      atticWindow(h, main, fm.right);
    }
  });
  if (p.extras === "planters") {
    h.scope("garden", () => {
      h.planter(fm.front, -3.6, 1.8, 2);
      h.planter(fw.left, 3.65, 1.5, 2);
    });
  }
  // a hipped roof's front slope narrows toward the ridge: the panels stay inside it
  if (p.extras === "solar") {
    if (shape === "gable") h.solar(main, -4.4, -0.9, -1.0, 1.4, 4, 2);
    else h.solar(main, -2.2, -0.9, -0.5, 1.4, 2, 2);
  }
  h.chimney(main, -2.2, -3.0);
  return h.m;
}

export const FAMILY_HOUSE_PARAMS: readonly ParamSpec[] = [
  ROOF_SHAPE_PARAM,
  {
    name: "annex", title: "Side annex", default: "garage",
    values: [v("garage", "Garage"), v("terrace", "Roof terrace"), v("wing", "Living wing")],
  },
  { name: "side", title: "Annex side", default: "right", values: [v("right", "Right"), v("left", "Left")] },
  CHIMNEY_PARAM,
  ROOF_PARAM,
  WALLS_PARAM,
];

/** A square two-storey house with a one-storey annex beside it: a garage, a roof terrace or a living wing. */
export function villageFamilyHouse(params?: ParamValues): MeshBuilder {
  const p = resolveParams(FAMILY_HOUSE_PARAMS, params);
  const h = new House(palette(ROOF_COLOURS[p.roof]!, WALL_COLOURS[p.walls]!), p.side === "left" ? -1 : 1);
  const shape = p.roofShape === "hip" ? "hip" : "gable";
  const main = volume(-1.5, 0, 8, 8, 2, shape, "x", 0.85);
  const annexRoof: RoofKind = p.annex === "terrace" ? "flat" : p.annex === "garage" ? "gable" : shape;
  // the annex's ridge runs front to back, so its roof meets the house at the eaves, under the upper windows
  const annex: Volume = {
    ...volume(4.75, -0.5, 4.5, 6.5, 1, annexRoof, "z", 0.6),
    eave: p.annex === "garage" ? PL + 2.6 : floorY(1) - 0.11,
    open: ["left"],
  };
  const fm = h.faces(main);
  const fa = h.faces(annex);
  h.scope("house", () => {
    h.walls(main);
    h.roof(main);
  });
  h.scope(p.annex === "garage" ? "garage" : p.annex === "terrace" ? "terrace annex" : "wing", () => {
    h.walls(annex);
    h.roof(annex);
  });
  h.scope("front", () => {
    h.door(fm.front, -2.6);
    windows(h, fm.front, 0, [0.4]);
    windows(h, fm.front, 1, [-3.6, -1.5, 0.6]);
    h.canopy(fm.front, -2.6, 2.4, 1.6, PL + 2.7, true);
    h.drainpipe(fm.front, -5.15, main.eave);
  });
  h.scope("annex front", () => {
    if (p.annex === "garage") {
      h.garageDoor(fa.front, annex.cx);
      h.window(fa.right, -0.5, PL + 1.1, 1.0, 1.0);
    } else {
      h.window(fa.front, annex.cx, PL + 0.6, 2.8, 1.75, 2);
      h.window(fa.right, -0.5, PL + WIN_Y, 1.6, WIN_H, 1);
      h.planter(fa.front, annex.cx, 2.6, 3);
    }
    if (p.annex === "terrace") {
      // the railing stands on the parapet; the side against the house has none
      const y = annex.eave + 0.6;
      const x0 = annex.cx - annex.w / 2 + 0.05;
      const x1 = annex.cx + annex.w / 2 + 0.05;
      const z0 = annex.cz - annex.d / 2 - 0.05;
      const z1 = annex.cz + annex.d / 2 + 0.05;
      h.railing(x0, z1, x1, z1, y, 0.9);
      h.railing(x1, z0, x1, z1, y, 0.9);
      h.railing(x0, z0, x1, z0, y, 0.9);
      h.door(fm.right, -0.5, annex.eave + 0.3, true);
    }
  });
  h.scope("sides", () => {
    for (let s = 0; s < 2; s++) {
      windows(h, fm.left, s, [-1.8, 1.8]);
      windows(h, fm.back, s, [-3.4, 0.4]);
    }
    if (p.annex !== "terrace") windows(h, fm.right, 1, [-1.8, 1.8]);
    else windows(h, fm.right, 1, [2.0]);
    windows(h, fa.back, 0, [annex.cx]);
    if (shape === "gable") atticWindow(h, main, fm.left);
  });
  if (p.chimney === "brick") h.chimney(main, -3.2, -1.4);
  return h.m;
}

export const MODERN_HOUSE_PARAMS: readonly ParamSpec[] = [
  { name: "storeys", title: "Storeys", default: "two", values: [v("one", "One storey"), v("two", "Two storeys")] },
  {
    name: "annex", title: "Annex", default: "carport",
    values: [v("none", "None"), v("carport", "Carport"), v("wing", "Glass wing")],
  },
  { name: "solar", title: "Solar panels", default: "none", values: [v("none", "None"), v("panels", "Panels")] },
  CLADDING_PARAM,
  WALLS_PARAM,
];

/** A flat-roofed modern house: a rendered ground floor, a clad (and cantilevered) upper storey. */
export function villageModernHouse(params?: ParamValues): MeshBuilder {
  const p = resolveParams(MODERN_HOUSE_PARAMS, params);
  const h = new House(palette(ROOF_COLOURS.slate!, WALL_COLOURS[p.walls]!, CLADDING_COLOURS[p.cladding]!));
  const two = p.storeys === "two";
  const ground: Volume = { ...volume(0, -0.8, 10, 7.4, 1, two ? "none" : "flat", "x"), bands: [] };
  const fg = h.faces(ground);
  // the upper storey overhangs the ground floor at the front, on two columns
  const upper: Volume = { ...volume(0.25, 0, 10.5, 9, 1, "flat", "x"), eave: floorY(2), bands: [], wallMat: "cladding" };
  const fu = h.faces(upper);
  h.scope("ground floor", () => h.walls(ground));
  if (two) {
    h.scope("upper storey", () => {
      const r = chamferedRect(upper.w + 0.16, upper.d + 0.16, CH + 0.05, upper.cx, upper.cz);
      h.prism("trim", r, floorY(1) - 0.11, floorY(1) + 0.15);
      h.cap("trim", r, floorY(1) - 0.11, false);
      h.prism("cladding", chamferedRect(upper.w, upper.d, CH, upper.cx, upper.cz), floorY(1) + 0.1, upper.eave, false);
      for (const x of [-4.5, 5.0]) h.prism("metal", ngon(8, 0.16, Math.PI / 8, x, 3.9), PL - 0.1, floorY(1) - 0.05);
    });
    h.roof(upper);
  } else {
    h.roof(ground);
  }
  h.scope("front", () => {
    if (two) {
      h.door(fg.front, -2.8, PL, true);
    } else {
      // a clad entrance block standing out of the front, the door in it
      // its back face sits 10 cm inside the wall, clear of the parapet's
      const block: Face = { axis: "z", s: 1, at: fg.front.at + 1.04 };
      h.scope("entrance block", () => {
        h.box("cladding", -2.8, fg.front.at + 0.42, 2.4, 1.24, 0, ground.eave + 0.75);
        h.battens(block, -3.9, -1.7, 0.3, ground.eave + 0.7, [[-2.8, 0.69], [-1.8, 0.1]]);
      });
      h.door(block, -2.8, PL, true);
    }
    h.window(fg.front, 1.6, PL + 0.6, 3.6, 1.8, 2);
    if (two) {
      h.window(fu.front, -2.6, floorY(1) + 0.8, 3.0, 1.3, 2);
      h.window(fu.front, 2.6, floorY(1) + 0.8, 3.0, 1.3, 2);
    }
  });
  h.scope("sides", () => {
    if (p.annex !== "wing") h.window(fg.left, -0.8, PL + WIN_Y, 2.4, 1.3, 1);
    h.window(fg.right, -0.8, PL + WIN_Y, 2.4, 1.3, 1);
    h.window(fg.back, -2.0, PL + WIN_Y, 2.4, 1.3, 1);
    if (two) {
      h.window(fu.left, -1.0, floorY(1) + 0.8, 2.6, 1.3, 1);
      h.window(fu.right, -1.0, floorY(1) + 0.8, 2.6, 1.3, 1);
      h.window(fu.back, 0.25, floorY(1) + 0.8, 4.0, 1.3, 2);
    }
  });
  if (two) {
    // vertical battens over the cladding, between the windows; they reach up into the roof slab
    h.scope("cladding", () => {
      const y0 = floorY(1) + 0.15;
      const y1 = upper.eave + 0.05;
      const x0 = upper.cx - upper.w / 2 + 0.35;
      const x1 = upper.cx + upper.w / 2 - 0.35;
      const z0 = upper.cz - upper.d / 2 + 0.35;
      const z1 = upper.cz + upper.d / 2 - 0.35;
      h.battens(fu.front, x0, x1, y0, y1, [[-2.6, 1.63], [2.6, 1.63]]);
      h.battens(fu.back, x0, x1, y0, y1, [[0.25, 2.13]]);
      h.battens(fu.left, z0, z1, y0, y1, [[-1.0, 1.43]]);
      h.battens(fu.right, z0, z1, y0, y1, [[-1.0, 1.43]]);
    });
  }
  h.scope("roof vent", () => {
    const roofY = (two ? upper.eave : ground.eave) + 0.3;
    h.box("stone", 4.2, 2.0, 0.7, 0.7, roofY - 0.1, roofY + 0.45, false);
    h.box("trim", 4.2, 2.0, 0.9, 0.9, roofY + 0.45, roofY + 0.55, true, true);
  });
  if (p.annex === "carport") {
    h.scope("carport", () => {
      const y = PL + 2.55;
      h.box("trim", 7.35, -0.3, 4.9, 6.4, y, y + 0.25, true, true);
      for (const [x, z] of [[9.5, 2.6], [9.5, -3.2]] as const) h.prism("metal", ngon(8, 0.12, Math.PI / 8, x, z), 0, y + 0.05);
      h.box("trim", 7.6, -0.3, 4.0, 6.0, 0, 0.08);
    });
  }
  if (p.annex === "wing") {
    const wing: Volume = { ...volume(-7.4, -1.6, 4.8, 5.8, 1, "flat", "x"), eave: PL + 2.8, bands: [] };
    const fw = h.faces(wing);
    h.scope("glass wing", () => {
      h.walls(wing);
      h.roof(wing);
      h.window(fw.front, wing.cx, PL + 0.3, 3.8, 2.2, 3);
      h.window(fw.left, wing.cz, PL + 0.3, 4.2, 2.2, 3);
    });
  }
  if (p.solar === "panels") {
    h.scope("solar panels", () => {
      const roofY = (two ? upper.eave : ground.eave) + 0.3;
      for (const z of [-2.6, 0.6]) {
        for (const x of [-2.7, 1.5]) {
          const pts: Vec3[] = [[x - 1.9, roofY + 0.95, z - 1.0], [x + 1.9, roofY + 0.95, z - 1.0], [x + 1.9, roofY + 0.25, z + 0.6], [x - 1.9, roofY + 0.25, z + 0.6]];
          // tilted toward the street (+z), on four legs
          h.slab("solar", pts, [0, -0.08, -0.035]);
          for (const lx of [x - 1.6, x + 1.6]) {
            h.box("metal", lx, z - 0.85, 0.1, 0.1, roofY - 0.05, roofY + 0.84, false);
            h.box("metal", lx, z + 0.45, 0.1, 0.1, roofY - 0.05, roofY + 0.27, false);
          }
        }
      }
    });
  }
  return h.m;
}

export const NARROW_HOUSE_PARAMS: readonly ParamSpec[] = [
  { name: "storeys", title: "Storeys", default: "two", values: [v("two", "Two storeys"), v("three", "Three storeys")] },
  {
    name: "entrance", title: "Entrance", default: "porch",
    values: [v("step", "Doorstep"), v("canopy", "Canopy"), v("porch", "Porch on posts")],
  },
  { name: "balcony", title: "Balcony", default: "none", values: [v("none", "None"), v("balcony", "Gable balcony")] },
  { name: "shutters", title: "Shutters", default: "shutters", values: [v("shutters", "Shutters"), v("none", "None")] },
  ROOF_PARAM,
  WALLS_PARAM,
];

/** A narrow, steep-roofed house with its gable to the street. */
export function villageNarrowHouse(params?: ParamValues): MeshBuilder {
  const p = resolveParams(NARROW_HOUSE_PARAMS, params);
  const h = new House(palette(ROOF_COLOURS[p.roof]!, WALL_COLOURS[p.walls]!));
  const storeys = p.storeys === "three" ? 3 : 2;
  h.shutters = p.shutters === "shutters";
  const main = volume(0, 0, 6.2, 8.5, storeys, "gable", "z", 1.05);
  const f = h.faces(main);
  h.scope("house", () => {
    h.walls(main);
    h.roof(main);
  });
  const top = storeys - 1;
  h.scope("front", () => {
    h.door(f.front, -1.4);
    windows(h, f.front, 0, [1.4]);
    for (let s = 1; s < storeys; s++) {
      if (s === top && p.balcony === "balcony") {
        h.door(f.front, -1.2, floorY(s), true);
        windows(h, f.front, s, [1.4]);
      } else {
        windows(h, f.front, s, [-1.4, 1.4]);
      }
    }
    atticWindow(h, main, f.front);
    if (p.entrance === "canopy") h.canopy(f.front, -1.4, 1.9, 1.0, PL + 2.6, false);
    if (p.entrance === "porch") h.canopy(f.front, -0.4, 5.0, 2.0, PL + 2.7, true);
    if (p.entrance !== "porch") h.planter(f.front, 1.5, 2.0, 2);
    h.drainpipe(f.right, 3.95, main.eave);
  });
  if (p.balcony === "balcony") {
    h.scope("balcony", () => {
      const y = floorY(top) - 0.11;
      const z0 = f.front.at;
      h.box("trim", 0, z0 + 0.7, 5.2, 1.4, y - 0.2, y + 0.11, true, true);
      h.railing(-2.55, z0 + 1.35, 2.55, z0 + 1.35, y + 0.11);
      h.railing(-2.55, z0 + 0.1, -2.55, z0 + 1.35, y + 0.11);
      h.railing(2.55, z0 + 0.1, 2.55, z0 + 1.35, y + 0.11);
    });
  }
  h.scope("sides", () => {
    for (let s = 0; s < storeys; s++) {
      windows(h, f.right, s, [-2.2, 1.6]);
      windows(h, f.left, s, [-2.2, 1.6]);
      windows(h, f.back, s, [0]);
    }
    atticWindow(h, main, f.back);
  });
  h.chimney(main, 1.2, -2.2);
  return h.m;
}

// --- the catalog ----------------------------------------------------------------------

/** Village geometry is in metres; legacy placement factors live in the mapping. */
export const VILLAGE_CATALOG: CatalogFields = {
  category: "Village",
  group: "village",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

export const TIMBER_CATALOG: CatalogFields = { ...VILLAGE_CATALOG, group: "village_red" };

/** Every procedural village house, by catalog id. The ids are stored in saved maps. */
export const VILLAGE_HOUSES: ProceduralDesign[] = [
  { id: "village-timber-cottage", title: "Village Timber Cottage", build: villageTimberCottage, buildLod: villageTimberCottageLod, params: TIMBER_COTTAGE_PARAMS },
  { id: "village-timber-house", title: "Village Timber House", build: villageTimberHouse, buildLod: villageTimberHouseLod, params: TIMBER_COTTAGE_PARAMS },
  { id: "village-cottage", title: "Village Cottage", build: villageCottage, buildLod: villageCottageLod, params: COTTAGE_PARAMS },
  { id: "village-l-house", title: "Village L-House", build: villageLHouse, buildLod: villageLHouseLod, params: L_HOUSE_PARAMS },
  { id: "village-family-house", title: "Village Family House", build: villageFamilyHouse, buildLod: villageFamilyHouseLod, params: FAMILY_HOUSE_PARAMS },
  { id: "village-modern-house", title: "Village Modern House", build: villageModernHouse, buildLod: villageModernHouseLod, params: MODERN_HOUSE_PARAMS },
  { id: "village-narrow-house", title: "Village Narrow House", build: villageNarrowHouse, buildLod: villageNarrowHouseLod, params: NARROW_HOUSE_PARAMS },
  { id: "village-alpine-hut", title: "Alpine Hut", build: villageAlpineHut, buildLod: villageAlpineHutLod, params: ALPINE_HUT_PARAMS, references: "alpine-hut" },
].map((d) => ({ ...d, catalog: d.id.startsWith("village-timber-") ? TIMBER_CATALOG : VILLAGE_CATALOG, finishParams: d.params.map((p) => p.name).filter((n) => VILLAGE_FINISH_PARAMS.includes(n)) }));
