// Original commercial buildings using the visual vocabulary of the webapp's
// Kenney comm-building-a .. -n: pale walls, charcoal bands, blue glazing,
// balconies, colourful shop awnings and flat parapet roofs. Metres, +z street.
import { MeshBuilder, chamferedRect, ngon, rect, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";

const option = (value: string, title: string) => ({ value, title });
const param = (name: string, title: string, values: Array<[string, string]>): ParamSpec => ({
  name, title, default: values[0]![0], values: values.map(([v, t]) => option(v, t)),
});
const WALL_COLOURS: Record<string, string> = {
  chalk: "#eeedf1", cream: "#eee2c6", sage: "#cad9ca", rose: "#e5c2bd", charcoal: "#555a6c",
};
const ACCENT_COLOURS: Record<string, string> = {
  green: "#4bb981", gold: "#edb647", coral: "#d87560", blue: "#578dbd", plum: "#987ca9",
};
const FINISH: ParamSpec[] = [
  param("walls", "Wall colour", Object.keys(WALL_COLOURS).map((v) => [v, v[0]!.toUpperCase() + v.slice(1)])),
  param("accent", "Shop and canopy colour", Object.keys(ACCENT_COLOURS).map((v) => [v, v[0]!.toUpperCase() + v.slice(1)])),
];
const finishes = (walls = "chalk", accent = "green"): ParamSpec[] => FINISH.map((p) => ({
  ...p, default: p.name === "walls" ? walls : accent,
}));
const FRONTAGE = param("frontage", "Shop frontage", [["awning", "Sloping awning"], ["sign", "Sign fascia"]]);
const WIDTH = param("width", "Width", [["compact", "Two bays"], ["broad", "Three bays"]]);
const ROOF = param("roof", "Roof use", [["plant", "Plant and vents"], ["garden", "Roof garden"]]);
export const COMMERCIAL_FINISH_PARAMS: readonly string[] = ["walls", "accent"];
export const COMMERCIAL_CATALOG: CatalogFields = {
  category: "Commercial", group: "comm_classic", defaultScale: 1,
  license: "CC0", author: "Rail Island", source: "Rail Island",
};

const SHOP_PARAMS = [param("storeys", "Storeys", [["three", "Three"], ["two", "Two"], ["four", "Four"]]), WIDTH, FRONTAGE, ROOF, ...FINISH];
const BALCONY_PARAMS = [param("storeys", "Storeys", [["four", "Four"], ["three", "Three"], ["five", "Five"]]), WIDTH,
  param("balconies", "Balconies", [["paired", "Balconies"], ["gallery", "Galleries"]]), ROOF, ...finishes("chalk", "gold")];
const BLOCK_PARAMS = [param("storeys", "Storeys", [["three", "Three"], ["four", "Four"]]),
  param("bays", "Shop bays", [["four", "Four"], ["five", "Five"], ["six", "Six"]]), FRONTAGE, ROOF, ...finishes("cream", "gold")];
const TERRACE_PARAMS = [param("storeys", "Storeys", [["four", "Four"], ["three", "Three"], ["five", "Five"]]),
  param("setback", "Terrace plan", [["front", "Street terrace"], ["corner", "Corner terrace"]]), FRONTAGE,
  param("roof", "Terrace use", [["garden", "Pergola"], ["solar", "Solar panels"]]), ...FINISH];
const OFFICE_PARAMS = [param("storeys", "Storeys", [["seven", "Seven"], ["five", "Five"], ["nine", "Nine"]]), WIDTH,
  param("facade", "Facade", [["grid", "Framed windows"], ["ribbon", "Ribbon glazing"]]), ROOF, ...finishes("charcoal", "blue")];
const NUM: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, nine: 9 };
const PL = 0.45;
const ST = 3.25;
interface Face { axis: "x" | "z"; sign: 1 | -1; at: number }
interface Footprint { w: number; d: number; x: number; z: number }

function palette(p: ParamValues): Record<string, MaterialSpec> {
  return {
    wall: { color: WALL_COLOURS[p.walls!]! }, accent: { color: ACCENT_COLOURS[p.accent!]! },
    trim: { color: "#484b5c" }, roof: { color: "#363a49" },
    glass: { color: "#7ca6d8", metallic: 0.12, roughness: 0.3 },
    lightGlass: { color: "#b4cfe7", metallic: 0.1, roughness: 0.35 },
    metal: { color: "#a6acb9", metallic: 0.25 }, stone: { color: "#a4a3af" },
    planter: { color: "#d7804d" }, foliage: { color: "#4eaa6b" },
    timber: { color: "#9c7652" }, solar: { color: "#314f74", metallic: 0.2 },
    lamp: { color: "#ffe2a0" },
  };
}

/** Shared facade kit. Panels sit proud of the opaque wall, each successive
 * layer a few centimetres farther out, so differently coloured faces never fight. */
class Commercial {
  readonly m: MeshBuilder;
  constructor(readonly p: ParamValues) { this.m = new MeshBuilder(palette(p)); }
  box(mat: string, x: number, z: number, w: number, d: number, lo: number, hi: number, bottom = false): void {
    this.m.box(mat, x, z, w, d, lo, hi);
    if (bottom) this.m.cap(mat, rect(w, d, x, z), lo, false);
  }
  faces(b: Footprint): Face[] {
    return [{ axis: "z", sign: 1, at: b.z + b.d / 2 }, { axis: "x", sign: 1, at: b.x + b.w / 2 },
      { axis: "z", sign: -1, at: b.z - b.d / 2 }, { axis: "x", sign: -1, at: b.x - b.w / 2 }];
  }
  point(f: Face, u: number, y: number, off: number): Vec3 {
    return f.axis === "z" ? [u, y, f.at + f.sign * off] : [f.at + f.sign * off, y, u];
  }
  panel(mat: string, f: Face, u: number, y: number, w: number, h: number, off: number, depth = 0.08, bevel = 0): void {
    const outline = bevel ? chamferedRect(w, h, bevel, u, y) : rect(w, h, u, y);
    const dir: Vec3 = f.axis === "z" ? [0, 0, -f.sign * depth] : [-f.sign * depth, 0, 0];
    this.m.slab(mat, outline.map(([a, b]) => this.point(f, a, b, off)), dir);
  }
  reflection(f: Face, u: number, y: number, w: number, h: number): void {
    const corners = rect(w, h, u, y).map(([a, b]) => this.point(f, a, b, 0.15));
    if ((f.axis === "z" && f.sign === 1) || (f.axis === "x" && f.sign === -1)) corners.reverse();
    this.m.quad("lightGlass", corners[0]!, corners[1]!, corners[2]!, corners[3]!);
  }
  base(b: Footprint): void {
    this.m.scope("bevelled plinth", () => {
      const lower = chamferedRect(b.w + 0.5, b.d + 0.5, 0.25, b.x, b.z);
      const upper = chamferedRect(b.w + 0.18, b.d + 0.18, 0.18, b.x, b.z);
      this.m.prism("trim", lower, 0, PL - 0.15, false);
      this.m.loft("trim", lower, PL - 0.15, upper, PL);
    });
  }
  floor(b: Footprint, level: number, dark = false): void {
    const y = PL + level * ST;
    this.m.scope(`storey ${level + 1}`, () => {
      this.m.prism(dark ? "trim" : "wall", chamferedRect(b.w, b.d, 0.18, b.x, b.z), level === 0 ? y - 0.03 : y + 0.02, y + ST - 0.1, false);
      this.m.scope("floor belt", () => {
        const ring = chamferedRect(b.w + 0.22, b.d + 0.22, 0.24, b.x, b.z);
        this.m.prism("trim", ring, y + ST - 0.2, y + ST + 0.02);
        this.m.cap("trim", ring, y + ST - 0.2, false);
      });
    });
  }
  window(f: Face, u: number, y: number, w: number, h = 1.65, door = false): void {
    this.m.scope(door ? "glazed entrance" : "framed window", () => {
      this.panel("trim", f, u, y, w + 0.26, h + 0.24, 0.09, 0.13, 0.12);
      this.panel("glass", f, u, y, w, h, 0.13, 0.06);
      this.reflection(f, u - w * 0.25, y + h * 0.22, w * 0.35, h * 0.44);
      this.panel("trim", f, u, y, 0.07, h - 0.04, 0.19, 0.06);
      this.panel("trim", f, u, y + h * 0.18, w - 0.04, 0.07, 0.19, 0.06);
      this.panel("stone", f, u, y - h / 2 - 0.16, w + 0.42, 0.12, 0.27, 0.28);
      if (door) this.panel("metal", f, u + 0.18, y - 0.12, 0.045, 0.35, 0.25, 0.07);
    });
  }
  windows(b: Footprint, level: number, frontBays: number, ribbon = false): void {
    this.m.scope(`storey ${level + 1} glazing`, () => {
      for (const f of this.faces(b)) {
        const len = f.axis === "z" ? b.w : b.d;
        const centre = f.axis === "z" ? b.x : b.z;
        const bays = f.axis === "z" ? frontBays : Math.max(2, Math.round(b.d / 3.2));
        const pitch = (len - 0.8) / bays;
        for (let i = 0; i < bays; i++) {
          this.window(f, centre + (i - (bays - 1) / 2) * pitch, PL + level * ST + 1.55,
            pitch - (ribbon ? 0.32 : 0.82), ribbon ? 1.9 : 1.65);
        }
      }
    });
  }
  shops(b: Footprint, bays: number, corner = false): void {
    this.m.scope("street shops", () => {
      for (const f of this.faces(b).slice(0, corner ? 2 : 1)) {
        const len = f.axis === "z" ? b.w : b.d;
        const centre = f.axis === "z" ? b.x : b.z;
        const count = f.axis === "z" ? bays : 2;
        const pitch = (len - 0.8) / count;
        for (let i = 0; i < count; i++) {
          const u = centre + (i - (count - 1) / 2) * pitch;
          this.window(f, u, PL + 1.25, pitch - 0.45, 2.15, i === 0);
          this.m.scope("shop canopy", () => {
            if (this.p.frontage === "sign") {
              this.panel("accent", f, u, PL + 2.65, pitch - 0.2, 0.36, 0.27, 0.23);
              // A simple cream emblem, rather than baked-in language or fake text.
              this.panel("wall", f, u, PL + 2.65, 0.35, 0.18, 0.31, 0.03);
            } else {
              const points = [[u - pitch / 2 + 0.1, PL + 2.82, 0.04], [u + pitch / 2 - 0.1, PL + 2.82, 0.04],
                [u + pitch / 2 - 0.1, PL + 2.55, 0.95], [u - pitch / 2 + 0.1, PL + 2.55, 0.95]];
              const down: Vec3 = [0, -0.1, 0];
              this.m.slab("accent", points.map(([a, y, off]) => this.point(f, a!, y!, off!)), down);
              this.panel("accent", f, u, PL + 2.47, pitch - 0.2, 0.18, 0.96, 0.09);
            }
          });
        }
      }
      this.box("stone", b.x - b.w / 2 + 1.8, b.z + b.d / 2 + 0.38, 2.5, 0.75, 0.02, PL + 0.01);
    });
  }
  rail(x: number, z: number, w: number, d: number, y: number): void {
    this.m.scope("terrace railing", () => {
      this.box("trim", x, z + d / 2, w + 0.08, 0.09, y + 0.95, y + 1.05);
      for (const side of [-1, 1]) this.box("trim", x + side * w / 2, z, 0.09, d, y + 0.95, y + 1.05);
      const n = Math.ceil(w / 0.65);
      for (let i = 0; i <= n; i++) this.box("metal", x - w / 2 + i * w / n, z + d / 2, 0.055, 0.055, y, y + 0.98);
      for (const side of [-1, 1]) for (let i = 0; i < Math.ceil(d / 0.65); i++) {
        this.box("metal", x + side * w / 2, z - d / 2 + i * 0.65, 0.055, 0.055, y, y + 0.98);
      }
    });
  }
  balcony(b: Footprint, level: number, bays: number, gallery: boolean): void {
    this.m.scope(`storey ${level + 1} balconies`, () => {
      const pitch = (b.w - 0.8) / bays;
      const count = gallery ? 1 : bays;
      for (let i = 0; i < count; i++) {
        const w = gallery ? b.w - 0.65 : pitch - 0.45;
        const x = gallery ? b.x : b.x + (i - (bays - 1) / 2) * pitch;
        const z = b.z + b.d / 2 + 0.62;
        const y = PL + level * ST + 0.18;
        this.box("stone", x, z, w + 0.12, 1.5, y - 0.17, y, true);
        this.rail(x, z, w, 1.32, y + 0.02);
      }
    });
  }
  planter(x: number, z: number, y: number, w = 1.4): void {
    this.m.scope("terracotta planter", () => {
      this.box("planter", x, z, w, 0.75, y, y + 0.42);
      for (let i = 0; i < 2; i++) {
        const ring = ngon(7, 0.36, 0, x + (i - 0.5) * w * 0.45, z);
        this.m.loft("foliage", ring, y + 0.35, ngon(7, 0.43, 0.2, x + (i - 0.5) * w * 0.45, z), y + 0.75, false);
        this.m.spire("foliage", ngon(7, 0.43, 0.2, x + (i - 0.5) * w * 0.45, z), y + 0.75, y + 1.04);
      }
    });
  }
  roof(b: Footprint, y: number, use = this.p.roof): void {
    this.m.scope("parapet roof", () => {
      this.box("roof", b.x, b.z, b.w + 0.14, b.d + 0.14, y, y + 0.22, true);
      for (const side of [-1, 1]) {
        this.box("trim", b.x, b.z + side * (b.d / 2 - 0.06), b.w + 0.35, 0.28, y + 0.18, y + 0.7);
        this.box("trim", b.x + side * (b.w / 2 - 0.06), b.z, 0.28, b.d - 0.35, y + 0.18, y + 0.7);
      }
      if (use === "plant") {
        this.m.scope("rooftop plant", () => {
          this.box("metal", b.x + 1.1, b.z - 0.7, 2, 1.45, y + 0.23, y + 0.85);
          for (const x of [b.x + 0.65, b.x + 1.55]) {
            this.m.prism("trim", ngon(12, 0.34, 0, x, b.z - 0.7), y + 0.87, y + 0.95);
            this.box("metal", x, b.z - 0.7, 0.58, 0.07, y + 0.96, y + 1.01);
          }
          this.m.prism("stone", ngon(8, 0.2, 0, b.x - 1.5, b.z - 1.2), y + 0.24, y + 1.15);
          this.m.prism("trim", ngon(8, 0.3, 0, b.x - 1.5, b.z - 1.2), y + 1.16, y + 1.25);
        });
      } else if (use === "garden") {
        this.planter(b.x - b.w / 2 + 1.2, b.z + b.d / 2 - 1.2, y + 0.24, 1.7);
        this.planter(b.x + b.w / 2 - 1.2, b.z + b.d / 2 - 1.2, y + 0.24, 1.7);
        this.m.scope("pergola", () => {
          for (const x of [-1.4, 1.4]) for (const z of [-1.1, 1.1]) this.box("timber", b.x + x, b.z + z, 0.12, 0.12, y + 0.23, y + 2.6);
          for (const z of [-1.1, 1.1]) this.box("timber", b.x, b.z + z, 3.55, 0.16, y + 2.48, y + 2.62);
          for (let i = 0; i < 7; i++) this.box("timber", b.x - 1.65 + i * 0.55, b.z, 0.12, 2.7, y + 2.58, y + 2.73);
        });
      }
    });
  }
  details(b: Footprint): void {
    this.m.scope("street furniture", () => {
      this.planter(b.x + b.w / 2 - 0.9, b.z + b.d / 2 + 0.65, 0.02);
      const f = this.faces(b)[0]!;
      this.panel("trim", f, b.x - b.w / 2 + 0.35, PL + 2, 0.22, 0.5, 0.24, 0.27);
      this.panel("lamp", f, b.x - b.w / 2 + 0.35, PL + 2, 0.14, 0.34, 0.27, 0.02);
    });
  }
}

function upright(specs: ParamSpec[], given: ParamValues | undefined, kind: "shop" | "balcony" | "block" | "office"): MeshBuilder {
  const p = resolveParams(specs, given);
  const c = new Commercial(p);
  const floors = NUM[p.storeys!]!;
  const bays = kind === "block" ? NUM[p.bays!]! : p.width === "broad" ? 3 : 2;
  const b: Footprint = { w: bays * 3.25 + 0.8, d: kind === "office" ? 9.6 : 8.4, x: 0, z: 0 };
  c.base(b);
  for (let level = 0; level < floors; level++) {
    c.floor(b, level, level === 0);
    if (level === 0) {
      c.shops(b, bays, kind === "shop");
      c.m.scope("rear service windows", () => {
        for (const f of c.faces(b).slice(kind === "shop" ? 2 : 1)) {
          const centre = f.axis === "z" ? b.x : b.z;
          c.window(f, centre - 1.7, PL + 1.6, 1.6);
          c.window(f, centre + 1.7, PL + 1.6, 1.6);
        }
      });
    } else {
      c.windows(b, level, bays, p.facade === "ribbon");
      if (kind === "balcony") c.balcony(b, level, bays, p.balconies === "gallery");
    }
  }
  c.roof(b, PL + floors * ST);
  c.details(b);
  return c.m;
}

export function cornerShop(p?: ParamValues): MeshBuilder { return upright(SHOP_PARAMS, p, "shop"); }
export function balconyHouse(p?: ParamValues): MeshBuilder { return upright(BALCONY_PARAMS, p, "balcony"); }
export function marketBlock(p?: ParamValues): MeshBuilder { return upright(BLOCK_PARAMS, p, "block"); }
export function officeHouse(p?: ParamValues): MeshBuilder { return upright(OFFICE_PARAMS, p, "office"); }

export function terraceHouse(given?: ParamValues): MeshBuilder {
  const p = resolveParams(TERRACE_PARAMS, given);
  const c = new Commercial(p);
  const floors = NUM[p.storeys!]!;
  const lower: Footprint = { w: 12.4, d: 10.2, x: 0, z: 0 };
  const upper: Footprint = { w: p.setback === "corner" ? 8 : lower.w, d: 6.6, x: p.setback === "corner" ? -2.2 : 0, z: -1.8 };
  c.base(lower);
  for (let level = 0; level < floors; level++) {
    const b = level >= floors - 2 ? upper : lower;
    c.floor(b, level, level === 0);
    if (level === 0) c.shops(b, 3, true);
    else c.windows(b, level, b.w < 10 ? 2 : 3);
  }
  const terraceY = PL + (floors - 2) * ST + 0.12;
  c.m.scope("setback terrace", () => {
    c.box("stone", 0, 3.35, 12.6, 3.7, terraceY - 0.1, terraceY, true);
    c.rail(0, 3.35, 12, 3.2, terraceY + 0.02);
    if (p.setback === "corner") {
      c.box("stone", 4.1, -1.8, 4.5, 6.6, terraceY - 0.1, terraceY);
      c.rail(4.1, -1.8, 4.2, 6.1, terraceY + 0.02);
    }
    if (p.roof === "garden") {
      c.planter(-4.5, 4.4, terraceY + 0.03, 1.7);
      c.planter(4.5, 4.4, terraceY + 0.03, 1.7);
    } else {
      for (let i = 0; i < 3; i++) {
        const x = -3.6 + i * 3.6;
        c.box("trim", x, 3.4, 2.7, 1.7, terraceY + 0.15, terraceY + 0.3);
        c.box("solar", x, 3.4, 2.55, 1.55, terraceY + 0.32, terraceY + 0.4);
      }
    }
  });
  c.roof(upper, PL + floors * ST, p.roof === "garden" ? "garden" : "plant");
  c.details(lower);
  return c.m;
}

export const COMMERCIAL_BUILDINGS: readonly ProceduralDesign[] = [
  { id: "comm-corner-shop", title: "Corner Shop House", build: cornerShop, params: SHOP_PARAMS },
  { id: "comm-balcony-house", title: "Balcony Shop House", build: balconyHouse, params: BALCONY_PARAMS },
  { id: "comm-market-block", title: "Market Block", build: marketBlock, params: BLOCK_PARAMS },
  { id: "comm-terrace-house", title: "Terraced Commercial House", build: terraceHouse, params: TERRACE_PARAMS },
  { id: "comm-office-house", title: "Commercial Office House", build: officeHouse, params: OFFICE_PARAMS },
].map((d) => ({ ...d, catalog: COMMERCIAL_CATALOG, finishParams: COMMERCIAL_FINISH_PARAMS }));
