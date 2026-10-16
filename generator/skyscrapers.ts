// The procedurally authored skyscrapers: ten designs, each a function that
// builds its model from rings, prisms and spires (meshBuilder.ts). Nothing they
// draw is committed -- `pnpm build` runs them (generate.ts) and writes ordinary
// GLBs, thumbnails and a meta.json into the export folder. See
// docs/models/skyscrapers.md.
//
// Modelled in metres, base at y = 0. Every design is deterministic: the same
// code gives the same bytes, which the game's LOD proxy cache keys on.
//
// The ids are what the game's saved maps store, so a design is never renamed
// once shipped.

import {
  MeshBuilder, grow, ngon, rect, scaleRing,
  type MaterialSpec, type Ring,
} from "./meshBuilder.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";

export type { ProceduralDesign } from "./design.ts";

export const PALETTE: Record<string, MaterialSpec> = {
  glass: { color: "#78a6c8", metallic: 0.2, roughness: 0.25 },
  glassDark: { color: "#33495e", metallic: 0.25, roughness: 0.2 },
  glassBlack: { color: "#22272e", metallic: 0.3, roughness: 0.2 },
  glassTeal: { color: "#62aaa6", metallic: 0.2, roughness: 0.25 },
  glassGold: { color: "#c9a25a", metallic: 0.3, roughness: 0.3 },
  glassGreen: { color: "#7fb39a", metallic: 0.2, roughness: 0.25 },
  slab: { color: "#e6e6e1" },
  white: { color: "#f3f1eb" },
  steel: { color: "#9ea7b0", metallic: 0.4, roughness: 0.45 },
  bronze: { color: "#7a5a3a", metallic: 0.4, roughness: 0.45 },
  dark: { color: "#3b3e44" },
  stone: { color: "#dccdae" },
  stoneDark: { color: "#b39f7d" },
  window: { color: "#4b5b6d", roughness: 0.3 },
  brick: { color: "#a05d45" },
  roofGreen: { color: "#6e9a4e" },
  crown: { color: "#cfd3d8", metallic: 0.5, roughness: 0.3 },
  red: { color: "#d43b2b" },
};

// --- parameters -------------------------------------------------------------------

/** Shared city-building choices; the original finish keeps each design's identity. */
export const SKYSCRAPER_PARAMS: readonly ParamSpec[] = [
  { name: "size", title: "Size", default: "standard", values: [
    { value: "lowrise", title: "Low-rise" }, { value: "compact", title: "Compact" },
    { value: "medium", title: "Medium" }, { value: "standard", title: "Standard" },
    { value: "landmark", title: "Landmark" },
  ] },
  { name: "glazing", title: "Glass colour", default: "original", values: [
    { value: "original", title: "Original" }, { value: "blue", title: "Midnight blue" },
    { value: "jade", title: "Jade green" }, { value: "bronze", title: "Warm bronze" },
  ] },
  { name: "structure", title: "Cladding", default: "original", values: [
    { value: "original", title: "Original" }, { value: "limestone", title: "Pale limestone" },
    { value: "graphite", title: "Graphite" },
  ] },
];

const TWISTED_PARAMS: readonly ParamSpec[] = [...SKYSCRAPER_PARAMS,
  { name: "twist", title: "Twist", default: "quarter", values: [
    { value: "straight", title: "Straight" }, { value: "quarter", title: "Quarter turn" },
    { value: "half", title: "Half turn" },
  ] },
];
const TERRACED_PARAMS: readonly ParamSpec[] = [...SKYSCRAPER_PARAMS,
  { name: "terraces", title: "Terrace count", default: "5", values:
    [3, 4, 5, 6].map((n) => ({ value: String(n), title: String(n) })) },
  { name: "terraceUse", title: "Terrace use", default: "gardens", values: [
    { value: "gardens", title: "Gardens" }, { value: "seating", title: "Seating" },
    { value: "solar", title: "Solar panels" },
  ] },
];

export const SKYSCRAPER_FINISH_PARAMS = ["glazing", "structure"] as const;

/** Each design chooses a storey count; all geometry stays in unscaled metres. */
class TowerMesh extends MeshBuilder {
  private readonly size: string;
  readonly choices: ParamValues;
  constructor(params?: ParamValues, specs: readonly ParamSpec[] = SKYSCRAPER_PARAMS) {
    const p = resolveParams(specs, params);
    const pal = Object.fromEntries(Object.entries(PALETTE).map(([key, spec]) => [key, { ...spec }]));
    const glass: Record<string, [string, string]> = {
      blue: ["#5388b8", "#203b60"], jade: ["#76b4a3", "#285c59"], bronze: ["#c6a779", "#66503e"],
    };
    if (p.glazing !== "original") {
      const [light, dark] = glass[p.glazing!]!;
      for (const key of ["glass", "glassTeal", "glassGold", "glassGreen"]) pal[key]!.color = light;
      for (const key of ["glassDark", "glassBlack", "window"]) pal[key]!.color = dark;
    }
    if (p.structure !== "original") {
      const light = p.structure === "limestone" ? "#e7ddc6" : "#555e69";
      const dark = p.structure === "limestone" ? "#b4a384" : "#303842";
      for (const key of ["slab", "white", "steel", "stone", "crown"]) pal[key]!.color = light;
      for (const key of ["bronze", "stoneDark", "brick"]) pal[key]!.color = dark;
    }
    super(pal);
    this.size = p.size!;
    this.choices = p;
  }

  /** Add or remove complete floors, keeping floor pitch and detail dimensions fixed. */
  floors(standard: number): number {
    return Math.max(1, Math.round(standard * ({ lowrise: 0.4, compact: 0.6, medium: 0.8, standard: 1, landmark: 1.2 }[this.size] ?? 1)));
  }
}

// --- facade helpers ---------------------------------------------------------------
//
// Each helper opens its own scope of the source tree (MeshBuilder.scope), so its
// primitives read as one "piers" or "mast" node wherever it is called from.

/** Horizontal floor slabs every `step` metres, standing `out` proud of the wall. */
function floorBands(m: MeshBuilder, mat: string, ring: Ring, y0: number, y1: number, step: number, h: number, out: number): void {
  m.scope("floor bands", () => {
    const r = grow(ring, out);
    for (let y = y0 + step; y < y1 - step / 2; y += step) m.prism(mat, r, y - h / 2, y + h / 2);
  });
}

/**
 * Vertical piers or mullions on the four faces of an axis-aligned w x d box,
 * `n` bays per face (n + 1 piers, the corner ones shared).
 */
function piers(
  m: MeshBuilder, mat: string, cx: number, cz: number, w: number, d: number,
  y0: number, y1: number, n: number, width: number, depth: number,
): void {
  m.scope("piers", () => {
    for (let i = 0; i <= n; i++) {
      const tx = -w / 2 + (i / n) * w;
      const tz = -d / 2 + (i / n) * d;
      for (const s of [-1, 1]) {
        m.box(mat, cx + tx, cz + s * (d / 2 + depth / 2 - 0.05), width, depth, y0, y1);
        if (i > 0 && i < n) m.box(mat, cx + s * (w / 2 + depth / 2 - 0.05), cz + tz, depth, width, y0, y1);
      }
    }
  });
}

/** A thin mast with a red aircraft-warning light on top. */
function mast(m: MeshBuilder, cx: number, cz: number, y0: number, h: number, r = 0.5): void {
  m.scope("mast", () => {
    m.prism("steel", ngon(6, r, 0, cx, cz), y0, y0 + h * 0.6);
    m.prism("steel", ngon(6, r * 0.5, 0, cx, cz), y0 + h * 0.6, y0 + h);
    m.prism("red", ngon(6, r * 0.8, 0, cx, cz), y0 + h, y0 + h + 0.8);
  });
}

/**
 * A glass shaft with floor slabs and mullions -- the basic modern curtain wall.
 * It has no roof of its own: the caller caps it with a slab or cornice wider
 * than the mullions, or the glass roof and the mullion tops would z-fight.
 */
function curtainWall(
  m: MeshBuilder, glass: string, frame: string, cx: number, cz: number, w: number, d: number,
  y0: number, y1: number, opts: { floor?: number; bays?: number } = {},
): void {
  m.scope("curtain wall", () => {
    const floor = opts.floor ?? 4;
    m.scope("glass", () => m.box(glass, cx, cz, w, d, y0, y1, 0, false));
    floorBands(m, "slab", rect(w, d, cx, cz), y0, y1, floor, 0.45, 0.25);
    piers(m, frame, cx, cz, w, d, y0, y1, opts.bays ?? 6, 0.35, 0.35);
  });
}

/** Segmented curtain-wall panels, inset between floor bands and piers. */
function facadePanels(m: MeshBuilder, ring: Ring, y0: number, y1: number, step: number, bays: number, material = "glassDark"): void {
  m.scope("facade panels", () => {
    for (let y = y0 + 0.8, floor = 0; y + step < y1; y += step, floor++) {
      for (let edge = 0; edge < ring.length; edge++) {
        const a = ring[edge]!;
        const b = ring[(edge + 1) % ring.length]!;
        const dx = b[0] - a[0], dz = b[1] - a[1];
        const length = Math.hypot(dx, dz);
        const angle = Math.atan2(-dz, dx);
        // Leave a generous margin around each panel: the surface belongs only to it.
        for (let bay = 0; bay < bays; bay++) {
          if ((bay + floor + edge) % 3 === 0) continue;
          const t = (bay + 0.5) / bays;
          m.box(material, a[0] + dx * t - dz / length * 0.08,
            a[1] + dz * t + dx / length * 0.08,
            length / bays * 0.62, 0.1, y, y + step * 0.52, angle);
        }
      }
    }
  });
}

/** Fine vertical fins following the corners of a polygon, not a cylindrical approximation. */
function ringFins(m: MeshBuilder, ring: Ring, y0: number, y1: number, material = "steel"): void {
  m.scope("vertical fins", () => {
    for (const [x, z] of grow(ring, 0.18)) m.box(material, x, z, 0.32, 0.32, y0, y1);
  });
}

/** A planted box with a raised rim and clustered low-poly shrubs. */
function planter(m: MeshBuilder, x: number, z: number, y: number, w: number, d: number): void {
  m.scope("planter", () => {
    m.box("stoneDark", x, z, w, d, y, y + 0.65);
    m.box("roofGreen", x, z, w - 0.3, d - 0.3, y + 0.65, y + 0.8);
    for (let i = 0; i < 3; i++) {
      const cx = x + (i - 1) * (w - 1.4) / 3;
      m.loft("roofGreen", ngon(6, 0.65, 0, cx, z), y + 0.8, ngon(6, 0.85, 0, cx, z), y + 1.45);
      m.spire("roofGreen", ngon(6, 0.85, 0, cx, z), y + 1.45, y + 2.1);
    }
  });
}

/** Entry canopy and a glazed door, placed outside a podium's front face. */
function entrance(m: MeshBuilder, front: number, y: number, material = "steel"): void {
  m.scope("entrance", () => {
    m.box("glassDark", 0, front + 0.12, 4.8, 0.16, y, y + 3.5);
    for (const x of [-2.55, 0, 2.55]) m.box(material, x, front + 0.3, 0.16, 0.22, y, y + 3.6);
    m.box(material, 0, front + 1.7, 7.5, 3.7, y + 3.6, y + 4.1);
    for (const x of [-3.3, 3.3]) m.box(material, x, front + 3.2, 0.25, 0.25, y, y + 3.6);
  });
}

// --- the designs -------------------------------------------------------------------
//
// Every primitive sits in a named scope -- podium, tier 3, crown -- so the
// site's source tree reads like the design (test/models.test.ts checks it).

/** A square blue-glass office tower: stone podium, curtain wall, crown, mast. */
export function glassOffice(params?: ParamValues): MeshBuilder {
  const m = new TowerMesh(params);
  const floors = m.floors(29);
  const top = 12 + floors * 4;
  const belt = 12 + (Math.floor(floors / 2) + 1) * 4;
  m.scope("podium", () => {
    m.box("dark", 0, 0, 30, 30, 0, 4);
    m.box("glassDark", 0, 0, 29, 29, 4, 11);
    m.box("slab", 0, 0, 30.5, 30.5, 11, 12);
  });
  m.scope("shaft", () => {
    curtainWall(m, "glass", "steel", 0, 0, 22, 22, 12, top, { bays: 6 });
    m.box("slab", 0, 0, 23, 23, top, top + 0.6);
  });
  m.scope("crown", () => {
    m.box("glassDark", 0, 0, 19, 19, top, top + 8);
    floorBands(m, "steel", rect(19, 19), top, top + 8, 2, 0.3, 0.3);
    m.box("steel", 0, 0, 20, 20, top + 8, top + 9);
    m.box("dark", 0, 0, 9, 9, top + 9, top + 13);
  });
  mast(m, 0, 0, top + 13, 22);
  entrance(m, 15, 0);
  m.scope("sky garden belt", () => {
    m.box("steel", 0, 0, 25, 25, belt - 1, belt);
    for (const z of [-11.8, 11.8]) planter(m, 0, z, belt, 8, 1.3);
    for (const x of [-11.8, 11.8]) m.box("steel", x, 0, 0.6, 22, belt, belt + 6);
  });
  facadePanels(m, rect(22, 22), 12, top, 4, 6);
  m.scope("crown blades", () => {
    for (const x of [-8, -4, 0, 4, 8]) m.box("crown", x, 0, 0.35, 20.8, top + 2, top + 12 - Math.abs(x) * 0.35);
  });
  return m;
}

/** A 1930s setback tower in pale stone with dark window strips and a steel spire. */
export function artDeco(params?: ParamValues): MeshBuilder {
  const m = new TowerMesh(params);
  m.scope("plinth", () => m.box("stoneDark", 0, 0, 33, 29, 0, 4));
  let level = 4;
  const tiers: Array<[number, number, number, number, number]> = [
    // width, depth, standard storeys, bays
    [31, 27, 7, 6], [25, 22, 14, 5], [20, 17, 8, 4],
    [15, 13, 4, 3], [10, 9, 3, 2],
  ].map(([w, d, floors, bays]) => {
    const bottom = level;
    level += m.floors(floors!) * 3.6 + 1.2;
    return [w!, d!, bottom, level, bays!];
  });
  const top = level;
  tiers.forEach(([w, d, y0, y1, bays], i) => m.scope(`tier ${i + 1}`, () => {
    // the cornice caps the tier: the core has no roof and the piers stop under
    // it, or three roofs would share one height and z-fight
    m.scope("core", () => m.box("window", 0, 0, w, d, y0, y1, 0, false));
    piers(m, "stone", 0, 0, w, d, y0, y1 - 1.2, bays, w / bays * 0.45, 0.6);
    floorBands(m, "stone", rect(w, d), y0, y1, 3.6, 1.0, 0.15);
    m.scope("cornice", () => m.box("stoneDark", 0, 0, w + 1.4, d + 1.4, y1 - 1.2, y1));
  }));
  m.scope("crown", () => {
    const oct = ngon(8, 4.2, Math.PI / 8);
    m.loft("crown", oct, top, scaleRing(oct, 0.7), top + 8);
    m.loft("crown", scaleRing(oct, 0.7), top + 8, scaleRing(oct, 0.42), top + 14);
    m.scope("spire", () => m.spire("crown", scaleRing(oct, 0.3), top + 14, top + 40));
  });
  entrance(m, 14.5, 0, "bronze");
  tiers.forEach(([w, d, y0, y1, bays], i) => m.scope(`tier ${i + 1} details`, () => {
    facadePanels(m, rect(w, d), y0, y1 - 1.2, 3.6, bays);
    // Narrow gilded crown ribs project beyond the stonework at each setback.
    for (const x of [-w * 0.32, 0, w * 0.32]) {
      for (const sign of [-1, 1]) m.box("bronze", x, sign * (d / 2 + 0.55), 0.45, 0.35, y1 - 7, y1 + 1.2);
    }
  }));
  m.scope("crown flutes", () => {
    for (const [x, z] of ngon(8, 3.9, Math.PI / 8)) m.box("bronze", x, z, 0.45, 0.45, top, top + 10);
  });
  return m;
}

/** An octagonal tower of tapering gold-glass segments, each with a flared rim. */
export function pagoda(params?: ParamValues): MeshBuilder {
  const m = new TowerMesh(params);
  const rot = Math.PI / 8;
  const segmentHeight = (i: number): number => m.floors(5 - Math.floor(i / 3)) * 3 + 2;
  m.scope("base", () => {
    m.prism("stone", ngon(8, 17, rot), 0, 6);
    m.prism("stoneDark", ngon(8, 13.5, rot), 6, 9);
  });
  let y = 9;
  let r = 12.5;
  for (let i = 0; i < 7; i++) {
    m.scope(`segment ${i + 1}`, () => {
      const h = segmentHeight(i);
      const r1 = r * 1.06; // each segment flares outward, like a stacked pagoda
      m.scope("glass", () => m.loft("glassGold", ngon(8, r, rot), y, ngon(8, r1, rot), y + h, false));
      m.scope("bands", () => {
        for (let k = 3; k < h - 1; k += 3) {
          const t = k / h;
          const rr = r + (r1 - r) * t + 0.15;
          m.prism("steel", ngon(8, rr, rot), y + k - 0.2, y + k + 0.2);
        }
      });
      m.scope("rim", () => m.loft("crown", ngon(8, r1, rot), y + h, ngon(8, r1 + 1.2, rot), y + h + 1, true));
      y += h + 1;
      r *= 0.9;
    });
  }
  m.scope("crown", () => {
    m.loft("crown", ngon(8, r, rot), y, ngon(8, r * 0.55, rot), y + 6);
    m.scope("spire", () => m.spire("crown", ngon(8, r * 0.35, rot), y + 6, y + 30));
  });
  entrance(m, 15.7, 0, "bronze");
  let fy = 9, fr = 12.5;
  m.scope("segment buttresses", () => {
    for (let i = 0; i < 7; i++) {
      const h = segmentHeight(i);
      const lower = ngon(8, fr + 0.35, rot), upper = ngon(8, fr * 1.06 + 0.35, rot);
      for (let j = 0; j < 8; j++) {
        const a = lower[j]!, b = upper[j]!;
        m.loft("bronze", rect(0.5, 0.5, ...a), fy, rect(0.5, 0.5, ...b), fy + h + 0.4);
      }
      facadePanels(m, ngon(8, fr * 1.02, rot), fy + 1, fy + h - 1, 3, 2);
      fy += h + 1;
      fr *= 0.9;
    }
  });
  return m;
}

/** A brick apartment high-rise with balconies and a timber water tank on the roof. */
export function brickResidential(params?: ParamValues): MeshBuilder {
  const m = new TowerMesh(params);
  const w = 24;
  const d = 18;
  const top = 7 + m.floors(26) * 3.2 + 1.8;
  m.scope("plinth", () => m.box("stone", 0, 0, w + 1, d + 1, 0, 7));
  m.scope("shaft", () => {
    m.scope("core", () => m.box("window", 0, 0, w, d, 7, top, 0, false));
    piers(m, "brick", 0, 0, w, d, 7, top, 8, 1.6, 0.5);
    floorBands(m, "brick", rect(w, d), 7, top, 3.2, 1.1, 0.5);
  });
  // balconies: a slab and a rail, every floor on the front, every other at the back
  m.scope("balconies", () => {
    for (let y = 10.2, floor = 0; y < top - 3; y += 3.2, floor++) {
      m.scope(`floor ${floor + 1}`, () => {
        for (const s of floor % 2 ? [1] : [-1, 1]) {
          for (const x of [-7.5, 0, 7.5]) {
            // 4.4 wide, so a balcony's ends fall between the piers' faces, not on them
            m.box("white", x, s * (d / 2 + 1.1), 4.4, 2.2, y - 0.15, y + 0.15);
            m.box("steel", x, s * (d / 2 + 2.15), 4.4, 0.12, y + 0.15, y + 1.0);
          }
        }
      });
    }
  });
  m.scope("roof", () => {
    m.box("stone", 0, 0, w + 1.6, d + 1.6, top, top + 1.4);
    m.scope("stair house", () => m.box("brick", 5, 2, 8, 6, top + 1.4, top + 6));
    // the water tank on four legs, with a conical lid
    m.scope("water tank", () => {
      const tx = -5.5;
      const tz = -3;
      for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]]) m.box("dark", tx + x, tz + z, 0.3, 0.3, top + 1.4, top + 5.5);
      m.prism("stoneDark", ngon(10, 2.6, 0, tx, tz), top + 5.5, top + 10);
      m.spire("dark", ngon(10, 2.8, 0, tx, tz), top + 10, top + 12.2);
    });
  });
  entrance(m, d / 2 + 0.5, 0, "dark");
  facadePanels(m, rect(w, d), 7, top, 6.4, 8, "glass");
  m.scope("balcony returns", () => {
    for (let y = 10.2, floor = 0; y < top - 3; y += 3.2, floor++) {
      for (const sign of floor % 2 ? [1] : [-1, 1]) {
        for (const x of [-7.5, 0, 7.5]) {
          for (const side of [-1, 1]) m.box("steel", x + side * 2.14, sign * (d / 2 + 1.1), 0.12, 1.9, y + 0.16, y + 0.96);
        }
      }
    }
  });
  m.scope("roof garden", () => planter(m, 4, -5.5, top + 1.4, 8, 1.6));
  return m;
}

/** Twin round towers of stepped glass drums joined by a sky bridge. */
export function twinTowers(params?: ParamValues): MeshBuilder {
  const m = new TowerMesh(params);
  const drums = [14, 7, 4, 2].map((floors) => m.floors(floors) * 4 + 2);
  const bridge = 10 + drums[0]! - 2;
  m.scope("podium", () => {
    m.box("dark", 0, 0, 44, 22, 0, 4);
    m.box("glassDark", 0, 0, 43, 21, 4, 9);
    m.box("slab", 0, 0, 44.5, 22.5, 9, 10);
  });
  for (const sx of [-12, 12]) {
    m.scope(sx < 0 ? "west tower" : "east tower", () => {
      let r = 9.5;
      let y = 10;
      drums.forEach((h, i) => m.scope(`drum ${i + 1}`, () => {
        const ring = ngon(16, r, 0, sx, 0);
        m.prism("glass", ring, y, y + h, false);
        floorBands(m, "steel", ring, y, y + h, 4, 0.4, 0.25);
        m.prism("crown", grow(ring, 0.7), y + h, y + h + 1.2);
        y += h + 1.2;
        r *= 0.8;
      }));
      m.scope("spire", () => m.spire("crown", ngon(16, r, 0, sx, 0), y, y + 28));
    });
  }
  // The bridge follows the upper floors of the first drum, with fixed-size framing.
  m.scope("sky bridge", () => {
    m.box("steel", 0, 0, 15, 4.2, bridge, bridge + 4.5);
    m.box("glassDark", 0, 0, 15.2, 3.2, bridge + 0.6, bridge + 3.9);
    m.scope("struts", () => {
      for (const s of [-1, 1]) {
        m.loft("steel", rect(1, 1, s * 3.5, 0), bridge, rect(1, 1, s * 5.8, 0), bridge - 14, false);
      }
    });
  });
  entrance(m, 11, 0);
  m.scope("tower ribs", () => {
    for (const sx of [-12, 12]) {
      let y = 10, r = 9.5;
      for (const h of drums) {
        ringFins(m, ngon(16, r, 0, sx, 0), y, y + h);
        y += h + 1.2;
        r *= 0.8;
      }
    }
  });
  m.scope("bridge frame", () => {
    for (const sign of [-1, 1]) {
      for (let x = -6; x <= 6; x += 2) m.box("crown", x, sign * 1.72, 0.18, 0.2, bridge + 0.7, bridge + 3.8);
      m.box("crown", 0, sign * 1.72, 14.4, 0.2, bridge + 3.8, bridge + 4.1);
    }
  });
  return m;
}

/** A white-and-teal tower whose floor plates turn a little each storey. */
export function twisted(params?: ParamValues): MeshBuilder {
  const m = new TowerMesh(params, TWISTED_PARAMS);
  m.scope("plinth", () => m.box("dark", 0, 0, 28, 28, 0, 6));
  const floors = m.floors(36);
  const fh = 3.6;
  const turn = m.choices.twist === "straight" ? 0 : m.choices.twist === "half" ? Math.PI : Math.PI / 2;
  m.scope("floors", () => {
    for (let i = 0; i < floors; i++) {
      m.scope(`floor ${i + 1}`, () => {
        const y = 6 + i * fh;
        const a = (i / floors) * turn;
        m.prism("glassTeal", rect(19, 19, 0, 0, a), y, y + fh - 0.6, false);
        m.prism("white", rect(21, 21, 0, 0, a), y + fh - 0.6, y + fh);
      });
    }
  });
  const top = 6 + floors * fh;
  m.scope("crown", () => {
    m.prism("glassTeal", rect(16, 16, 0, 0, turn), top, top + 5);
    m.prism("white", rect(17, 17, 0, 0, turn), top + 5, top + 6);
  });
  mast(m, 0, 0, top + 6, 10, 0.4);
  entrance(m, 14, 0, "white");
  m.scope("turning facade fins", () => {
    for (let i = 0; i < floors; i++) {
      const y = 6 + i * fh, a = i / floors * turn;
      ringFins(m, rect(19, 19, 0, 0, a), y, y + fh - 0.62, "white");
      facadePanels(m, rect(19, 19, 0, 0, a), y - 0.3, y + fh, 2.5, 4);
    }
  });
  m.scope("rooftop pergola", () => {
    for (const x of [-6, -3, 3, 6]) m.box("white", x, 0, 0.3, 17, top + 6.1, top + 8.5);
    for (const z of [-7, 7]) m.box("steel", 0, z, 15, 0.3, top + 8.5, top + 8.8);
  });
  return m;
}

/** A black-glass slab with bronze mullions, a recessed glass lobby and a plant floor. */
export function darkSlab(params?: ParamValues): MeshBuilder {
  const m = new TowerMesh(params);
  const w = 28;
  const d = 15;
  const top = 8 + m.floors(29) * 3.8 + 1.8;
  m.scope("plaza", () => m.box("stone", 0, 0, w + 10, d + 10, 0, 0.6));
  m.scope("lobby", () => {
    m.box("glass", 0, 0, w - 3, d - 3, 0.6, 8, 0, false);
    m.scope("columns", () => {
      for (const x of [-1, -0.5, 0, 0.5, 1]) m.box("bronze", x * (w / 2 - 1), 0, 0.8, d - 1, 0.6, 8);
    });
  });
  m.scope("shaft", () => {
    m.scope("glass", () => m.box("glassBlack", 0, 0, w, d, 8, top, 0, false));
    floorBands(m, "bronze", rect(w, d), 8, top, 3.8, 0.35, 0.12);
    piers(m, "bronze", 0, 0, w, d, 8, top, 9, 0.25, 0.4);
    m.scope("cornice", () => m.box("bronze", 0, 0, w + 0.6, d + 0.6, top, top + 1));
  });
  m.scope("plant floor", () => {
    m.scope("glass", () => m.box("glassBlack", 0, 0, w - 2, d - 2, top + 1, top + 7, 0, false));
    piers(m, "bronze", 0, 0, w - 2, d - 2, top + 1, top + 7, 18, 0.4, 0.3);
    m.scope("roof", () => m.box("bronze", 0, 0, w - 1.6, d - 1.6, top + 7, top + 8));
  });
  entrance(m, d / 2 - 1.5, 0.6, "bronze");
  facadePanels(m, rect(w, d), 8, top, 3.8, 8, "glassDark");
  m.scope("bronze sunshades", () => {
    for (const sign of [-1, 1]) {
      for (let y = 19; y < top - 2; y += 11.4) m.box("bronze", 0, sign * (d / 2 + 0.55), w + 0.5, 1.2, y, y + 0.22);
    }
  });
  m.scope("plaza planting", () => {
    for (const x of [-15.5, 15.5]) planter(m, x, 0, 0.6, 3, 8);
  });
  return m;
}

/** A round, bullet-shaped tower banded in light and dark glass. */
export function bullet(params?: ParamValues): MeshBuilder {
  const m = new TowerMesh(params);
  const n = 20;
  m.scope("plinth", () => m.prism("dark", ngon(n, 15, 0), 0, 4));
  // radius as a function of height: swells a little, then curves into the tip
  const floors = m.floors(33);
  const H = 4 + (floors + 1) * 4;
  const radius = (y: number): number => {
    const t = y / H;
    return 12 * (1 + 0.18 * Math.sin(Math.PI * Math.min(t, 0.55) / 1.1)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, t - 0.55) / 0.45, 2)));
  };
  const step = 4;
  m.scope("glass bands", () => {
    for (let y = 4, i = 0; y < H - step; y += step, i++) {
      const r0 = radius(y - 4);
      const r1 = radius(y + step - 4);
      m.loft(i % 2 ? "glassDark" : "glass", ngon(n, r0, 0), y, ngon(n, r1, 0), y + step, false);
    }
  });
  // The tip starts at the last glass band, without an open gap below it.
  const yTop = H - step;
  m.scope("tip", () => m.spire("glassDark", ngon(n, radius(yTop - 4), 0), yTop, H + 4));
  // diagonal "diagrid" ribs: a few steel fins tracking the profile
  m.scope("ribs", () => {
    for (let k = 0; k < 6; k++) {
      m.scope(`rib ${k + 1}`, () => {
        const a = (k / 6) * Math.PI * 2;
        for (let y = 4; y < H - 18; y += 8) {
          const r0 = radius(y - 4) + 0.15;
          const r1 = radius(y + 8 - 4) + 0.15;
          const a0 = a + y * 0.012;
          const a1 = a + (y + 8) * 0.012;
          m.loft(
            "steel",
            rect(0.5, 0.5, r0 * Math.cos(a0), -r0 * Math.sin(a0), a0), y,
            rect(0.5, 0.5, r1 * Math.cos(a1), -r1 * Math.sin(a1), a1), y + 8, false,
          );
        }
      });
    }
  });
  entrance(m, 15, 0);
  m.scope("counter spiral", () => {
    for (let k = 0; k < 6; k++) {
      for (let y = 4; y < H - 18; y += 4) {
        const a0 = k / 6 * Math.PI * 2 - y * 0.012;
        const a1 = k / 6 * Math.PI * 2 - (y + 4) * 0.012;
        const r0 = radius(y - 4) + 0.2, r1 = radius(y) + 0.2;
        m.loft("crown", rect(0.3, 0.3, r0 * Math.cos(a0), -r0 * Math.sin(a0)), y,
          rect(0.3, 0.3, r1 * Math.cos(a1), -r1 * Math.sin(a1)), y + 4, false);
      }
    }
  });
  m.scope("observation band", () => {
    const level = 4 + Math.floor(floors * 0.82) * 4;
    const r = radius(level) + 0.5;
    m.prism("crown", ngon(n, r), level + 3.2, level + 3.7);
    m.prism("crown", ngon(n, r - 0.5), level + 7.1, level + 7.6);
  });
  return m;
}

/** A glass tower stepping back in green roof terraces towards one corner. */
export function terraced(params?: ParamValues): MeshBuilder {
  const m = new TowerMesh(params, TERRACED_PARAMS);
  const count = Number(m.choices.terraces);
  const width = 12 + (count - 1) * 4;
  const use = m.choices.terraceUse;
  m.scope("plinth", () => m.box("stone", 0, 0, width + 2, width + 2, 0, 5));
  let level = 5;
  const steps: Array<[number, number, number, number, number]> = Array.from({ length: count }, (_, i) => {
    // Fixed four-metre setbacks leave usable decks and a twelve-metre top floor.
    const standard = count === 5 ? [8, 7, 7, 6, 4][i]! : Math.floor(32 / count) + (i < 32 % count ? 1 : 0);
    const top = level + m.floors(standard) * 3.6 + 0.2;
    level = top + 0.8;
    return [width - i * 4, width - i * 4, -i * 2, -i * 2, top];
  });
  let y = 5;
  steps.forEach(([w, d, cx, cz, top], i) => m.scope(`step ${i + 1}`, () => {
    curtainWall(m, "glassGreen", "white", cx, cz, w, d, y, top, { floor: 3.6, bays: 5 });
    m.scope("cornice", () => m.box("white", cx, cz, w + 0.8, d + 0.8, top, top + 0.8));
    // Keep each deck usable: planting, benches or panel racks on the exposed edges.
    m.scope("terrace", () => {
      m.box(use === "gardens" ? "roofGreen" : "stone", cx, cz, w - 1, d - 1, top + 0.8, top + 1.2);
      for (const [tx, tz] of [[w / 2 - 2.5, d / 2 - 2.5], [w / 2 - 2.5, -d / 2 + 4], [-w / 2 + 4, d / 2 - 2.5]]) {
        if (use === "gardens") m.spire("roofGreen", ngon(6, 1.5, 0, cx + tx, cz + tz), top + 1.2, top + 4.5);
        else m.scope(use === "seating" ? "bench" : "solar panel", () => {
          const x = cx + tx, z = cz + tz, base = top + 1.2;
          for (const dx of [-0.8, 0.8]) m.box("steel", x + dx, z, 0.15, 0.6, base, base + 0.5);
          m.box(use === "seating" ? "stoneDark" : "glassBlack", x, z, 2.2, 1, base + 0.5, base + 0.65);
          if (use === "seating") m.box("stoneDark", x, z - 0.45, 2.2, 0.15, base + 0.65, base + 1.2);
        });
      }
    });
    y = top + 0.8;
  }));
  mast(m, -(count - 1) * 2, -(count - 1) * 2, steps[count - 1]![4] + 1.2, 14, 0.35);
  entrance(m, width / 2 + 1, 0, "white");
  steps.forEach(([w, d, cx, cz, top], i) => m.scope(`garden deck ${i + 1}`, () => {
    const baseY = i === 0 ? 5 : steps[i - 1]![4] + 0.8;
    facadePanels(m, rect(w, d, cx, cz), baseY, top, 3.6, 5);
    // Only the south/east edges are exposed; the next tier rises on the north/west.
    for (const x of [cx - w / 2 + 1, cx + w / 2 - 1]) m.box("steel", x, cz + d / 2 - 0.25, 0.15, 0.15, top + 1.2, top + 2.5);
    m.box("steel", cx, cz + d / 2 - 0.25, w - 1.8, 0.14, top + 2.4, top + 2.55);
    m.box("steel", cx + w / 2 - 0.25, cz, 0.14, d - 1.8, top + 2.4, top + 2.55);
    if (use === "gardens") planter(m, cx + w / 2 - 1.3, cz + 0.5, top + 1.2, 1.5, 4);
    if (use === "gardens") planter(m, cx, cz + d / 2 - 1.2, top + 1.2, Math.min(6, w / 2), 1.2);
  }));
  return m;
}

/** A white tapering pyramid tower with two side wings and a spire. */
export function pyramid(params?: ParamValues): MeshBuilder {
  const m = new TowerMesh(params);
  const spireFrom = 1 + m.floors(28) * 4;
  const H = spireFrom + 28;
  const base = 26;
  const at = (y: number): number => base * (1 - (y / H) * 0.92);
  m.scope("plinth", () => m.box("dark", 0, 0, base + 3, base + 3, 0, 1));
  // window bands: alternating white and dark rings, every floor
  const step = 4;
  m.scope("floors", () => {
    for (let y = 1, i = 0; y < spireFrom; y += step, i++) {
      m.scope(`floor ${i + 1}`, () => {
        const s0 = at(y);
        const s1 = at(y + step);
        m.loft("white", rect(s0, s0), y, rect(s1, s1), y + step * 0.55, false);
        m.loft("window", rect(s0 - (s0 - s1) * 0.55, s0 - (s0 - s1) * 0.55), y + step * 0.55, rect(s1, s1), y + step, false);
      });
    }
  });
  m.scope("spire", () => m.spire("white", rect(at(spireFrom), at(spireFrom)), spireFrom, H + 10));
  // the two wings that carry the lift shafts, from mid-height to the spire
  for (const s of [-1, 1]) {
    m.scope(s < 0 ? "west wing" : "east wing", () => {
      const wingFrom = 1 + Math.floor(m.floors(28) / 2) * 4;
      const x0 = s * at(wingFrom) / 2;
      const x1 = s * at(spireFrom) / 2;
      m.loft("white", rect(3.2, 6, x0 + s * 1.2, 0), wingFrom, rect(2.6, 4.5, x1 + s * 1.0, 0), spireFrom + 6);
    });
  }
  entrance(m, base / 2 + 1.5, 0, "white");
  m.scope("tapered facade ribs", () => {
    for (let y = 1; y < spireFrom - 3; y += 4) {
      const s0 = at(y), s1 = at(y + 4);
      for (const sign of [-1, 1]) {
        for (const t of [-0.7, -0.35, 0, 0.35, 0.7]) {
          m.loft("stoneDark", rect(0.18, 0.3, t * s0 / 2, sign * (s0 / 2 + 0.15)), y,
            rect(0.18, 0.3, t * s1 / 2, sign * (s1 / 2 + 0.15)), y + 3.8);
          m.loft("stoneDark", rect(0.3, 0.18, sign * (s0 / 2 + 0.15), t * s0 / 2), y,
            rect(0.3, 0.18, sign * (s1 / 2 + 0.15), t * s1 / 2), y + 3.8);
        }
      }
    }
  });
  return m;
}

/**
 * The game-catalog fields every skyscraper shares, written into each one's
 * meta.json entry (generate.ts). They are what the game's building catalog needs
 * beyond the GLB: the picker category, the city block pool the towers are drawn
 * from, the on-map size, and the attribution.
 */
export const SKYSCRAPER_CATALOG: CatalogFields = {
  category: "Commercial",
  group: "skyscraper_c",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Every procedural skyscraper, by catalog id. The ids are stored in saved maps. */
export const SKYSCRAPERS: ProceduralDesign[] = [
  { params: SKYSCRAPER_PARAMS, finishParams: SKYSCRAPER_FINISH_PARAMS, id: "sky-glass-office", title: "Glass Office Tower", build: glassOffice },
  { params: SKYSCRAPER_PARAMS, finishParams: SKYSCRAPER_FINISH_PARAMS, id: "sky-art-deco", title: "Art Deco Tower", build: artDeco },
  { params: SKYSCRAPER_PARAMS, finishParams: SKYSCRAPER_FINISH_PARAMS, id: "sky-pagoda", title: "Pagoda Tower", build: pagoda },
  { params: SKYSCRAPER_PARAMS, finishParams: SKYSCRAPER_FINISH_PARAMS, id: "sky-brick-residential", title: "Brick Apartment Tower", build: brickResidential },
  { params: SKYSCRAPER_PARAMS, finishParams: SKYSCRAPER_FINISH_PARAMS, id: "sky-twin-towers", title: "Twin Towers", build: twinTowers },
  { params: TWISTED_PARAMS, finishParams: SKYSCRAPER_FINISH_PARAMS, id: "sky-twisted", title: "Twisting Tower", build: twisted },
  { params: SKYSCRAPER_PARAMS, finishParams: SKYSCRAPER_FINISH_PARAMS, id: "sky-dark-slab", title: "Black Glass Slab", build: darkSlab },
  { params: SKYSCRAPER_PARAMS, finishParams: SKYSCRAPER_FINISH_PARAMS, id: "sky-bullet", title: "Bullet Tower", build: bullet },
  { params: TERRACED_PARAMS, finishParams: SKYSCRAPER_FINISH_PARAMS, id: "sky-terraced", title: "Terraced Green Tower", build: terraced },
  { params: SKYSCRAPER_PARAMS, finishParams: SKYSCRAPER_FINISH_PARAMS, id: "sky-pyramid", title: "Pyramid Tower", build: pyramid },
];
