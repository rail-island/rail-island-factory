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

// --- facade helpers ---------------------------------------------------------------

/** Horizontal floor slabs every `step` metres, standing `out` proud of the wall. */
function floorBands(m: MeshBuilder, mat: string, ring: Ring, y0: number, y1: number, step: number, h: number, out: number): void {
  const r = grow(ring, out);
  for (let y = y0 + step; y < y1 - step / 2; y += step) m.prism(mat, r, y - h / 2, y + h / 2);
}

/**
 * Vertical piers or mullions on the four faces of an axis-aligned w x d box,
 * `n` bays per face (n + 1 piers, the corner ones shared).
 */
function piers(
  m: MeshBuilder, mat: string, cx: number, cz: number, w: number, d: number,
  y0: number, y1: number, n: number, width: number, depth: number,
): void {
  for (let i = 0; i <= n; i++) {
    const tx = -w / 2 + (i / n) * w;
    const tz = -d / 2 + (i / n) * d;
    for (const s of [-1, 1]) {
      m.box(mat, cx + tx, cz + s * (d / 2 + depth / 2 - 0.05), width, depth, y0, y1);
      if (i > 0 && i < n) m.box(mat, cx + s * (w / 2 + depth / 2 - 0.05), cz + tz, depth, width, y0, y1);
    }
  }
}

/** A thin mast with a red aircraft-warning light on top. */
function mast(m: MeshBuilder, cx: number, cz: number, y0: number, h: number, r = 0.5): void {
  m.prism("steel", ngon(6, r, 0, cx, cz), y0, y0 + h * 0.6);
  m.prism("steel", ngon(6, r * 0.5, 0, cx, cz), y0 + h * 0.6, y0 + h);
  m.prism("red", ngon(6, r * 0.8, 0, cx, cz), y0 + h, y0 + h + 0.8);
}

/** A glass shaft with floor slabs and mullions -- the basic modern curtain wall. */
function curtainWall(
  m: MeshBuilder, glass: string, frame: string, cx: number, cz: number, w: number, d: number,
  y0: number, y1: number, opts: { floor?: number; bays?: number } = {},
): void {
  const floor = opts.floor ?? 4;
  m.box(glass, cx, cz, w, d, y0, y1);
  floorBands(m, "slab", rect(w, d, cx, cz), y0, y1, floor, 0.45, 0.25);
  piers(m, frame, cx, cz, w, d, y0, y1, opts.bays ?? 6, 0.35, 0.35);
}

// --- the designs -------------------------------------------------------------------

/** A square blue-glass office tower: stone podium, curtain wall, crown, mast. */
function glassOffice(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.box("dark", 0, 0, 30, 30, 0, 4);
  m.box("glassDark", 0, 0, 29, 29, 4, 11);
  m.box("slab", 0, 0, 30.5, 30.5, 11, 12);
  curtainWall(m, "glass", "steel", 0, 0, 22, 22, 12, 128, { bays: 6 });
  m.box("glassDark", 0, 0, 19, 19, 128, 136);
  floorBands(m, "steel", rect(19, 19), 128, 136, 2, 0.3, 0.3);
  m.box("steel", 0, 0, 20, 20, 136, 137);
  m.box("dark", 0, 0, 9, 9, 137, 141);
  mast(m, 0, 0, 141, 22);
  return m;
}

/** A 1930s setback tower in pale stone with dark window strips and a steel spire. */
function artDeco(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.box("stoneDark", 0, 0, 33, 29, 0, 4);
  const tiers: Array<[number, number, number, number, number]> = [
    // w, d, y0, y1, bays
    [31, 27, 4, 30, 6],
    [25, 22, 30, 82, 5],
    [20, 17, 82, 112, 4],
    [15, 13, 112, 128, 3],
    [10, 9, 128, 138, 2],
  ];
  for (const [w, d, y0, y1, bays] of tiers) {
    m.box("window", 0, 0, w, d, y0, y1);
    piers(m, "stone", 0, 0, w, d, y0, y1, bays, w / bays * 0.45, 0.6);
    floorBands(m, "stone", rect(w, d), y0, y1, 3.6, 1.0, 0.15);
    m.box("stoneDark", 0, 0, w + 1.4, d + 1.4, y1 - 1.2, y1);
  }
  const oct = ngon(8, 4.2, Math.PI / 8);
  m.loft("crown", oct, 138, scaleRing(oct, 0.7), 146);
  m.loft("crown", scaleRing(oct, 0.7), 146, scaleRing(oct, 0.42), 152);
  m.spire("crown", scaleRing(oct, 0.3), 152, 178);
  return m;
}

/** An octagonal tower of tapering gold-glass segments, each with a flared rim. */
function pagoda(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const rot = Math.PI / 8;
  m.prism("stone", ngon(8, 17, rot), 0, 6);
  m.prism("stoneDark", ngon(8, 13.5, rot), 6, 9);
  let y = 9;
  let r = 12.5;
  for (let i = 0; i < 7; i++) {
    const h = 17 - i;
    const r1 = r * 1.06; // each segment flares outward, like a stacked pagoda
    m.loft("glassGold", ngon(8, r, rot), y, ngon(8, r1, rot), y + h, false);
    for (let k = 3; k < h - 1; k += 3) {
      const t = k / h;
      const rr = r + (r1 - r) * t + 0.15;
      m.prism("steel", ngon(8, rr, rot), y + k - 0.2, y + k + 0.2);
    }
    m.loft("crown", ngon(8, r1, rot), y + h, ngon(8, r1 + 1.2, rot), y + h + 1, true);
    y += h + 1;
    r *= 0.9;
  }
  m.loft("crown", ngon(8, r, rot), y, ngon(8, r * 0.55, rot), y + 6);
  m.spire("crown", ngon(8, r * 0.35, rot), y + 6, y + 30);
  return m;
}

/** A brick apartment high-rise with balconies and a timber water tank on the roof. */
function brickResidential(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const w = 24;
  const d = 18;
  const top = 92;
  m.box("stone", 0, 0, w + 1, d + 1, 0, 7);
  m.box("window", 0, 0, w, d, 7, top);
  piers(m, "brick", 0, 0, w, d, 7, top, 8, 1.6, 0.5);
  floorBands(m, "brick", rect(w, d), 7, top, 3.2, 1.1, 0.5);
  // balconies: a slab and a rail, every floor on the front, every other at the back
  for (let y = 10.2, floor = 0; y < top - 3; y += 3.2, floor++) {
    for (const s of floor % 2 ? [1] : [-1, 1]) {
      for (const x of [-7.5, 0, 7.5]) {
        m.box("white", x, s * (d / 2 + 1.1), 4.6, 2.2, y - 0.15, y + 0.15);
        m.box("steel", x, s * (d / 2 + 2.15), 4.6, 0.12, y + 0.15, y + 1.0);
      }
    }
  }
  m.box("stone", 0, 0, w + 1.6, d + 1.6, top, top + 1.4);
  m.box("brick", 5, 2, 8, 6, top + 1.4, top + 6);
  // the water tank on four legs, with a conical lid
  const tx = -5.5;
  const tz = -3;
  for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]]) m.box("dark", tx + x, tz + z, 0.3, 0.3, top + 1.4, top + 5.5);
  m.prism("stoneDark", ngon(10, 2.6, 0, tx, tz), top + 5.5, top + 10);
  m.spire("dark", ngon(10, 2.8, 0, tx, tz), top + 10, top + 12.2);
  return m;
}

/** Twin round towers of stepped glass drums joined by a sky bridge. */
function twinTowers(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.box("dark", 0, 0, 44, 22, 0, 4);
  m.box("glassDark", 0, 0, 43, 21, 4, 9);
  m.box("slab", 0, 0, 44.5, 22.5, 9, 10);
  for (const sx of [-12, 12]) {
    let r = 9.5;
    let y = 10;
    for (const h of [58, 30, 18, 10]) {
      const ring = ngon(16, r, 0, sx, 0);
      m.prism("glass", ring, y, y + h, false);
      floorBands(m, "steel", ring, y, y + h, 4, 0.4, 0.25);
      m.prism("crown", grow(ring, 0.7), y + h, y + h + 1.2);
      y += h + 1.2;
      r *= 0.8;
    }
    m.spire("crown", ngon(16, r, 0, sx, 0), y, y + 28);
  }
  // the bridge between the 15th and 16th floors, on a pair of struts
  m.box("steel", 0, 0, 15, 4.2, 66, 70.5);
  m.box("glassDark", 0, 0, 15.2, 3.2, 66.6, 69.9);
  for (const s of [-1, 1]) {
    m.loft("steel", rect(1, 1, s * 3.5, 0), 66, rect(1, 1, s * 5.8, 0), 52, false);
  }
  return m;
}

/** A white-and-teal tower whose floor plates turn a little each storey. */
function twisted(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.box("dark", 0, 0, 28, 28, 0, 6);
  const floors = 36;
  const fh = 3.6;
  const turn = Math.PI / 2;
  for (let i = 0; i < floors; i++) {
    const y = 6 + i * fh;
    const a = (i / floors) * turn;
    m.prism("glassTeal", rect(19, 19, 0, 0, a), y, y + fh - 0.6, false);
    m.prism("white", rect(21, 21, 0, 0, a), y + fh - 0.6, y + fh);
  }
  const top = 6 + floors * fh;
  m.prism("glassTeal", rect(16, 16, 0, 0, turn), top, top + 5);
  m.prism("white", rect(17, 17, 0, 0, turn), top + 5, top + 6);
  mast(m, 0, 0, top + 6, 10, 0.4);
  return m;
}

/** A black-glass slab with bronze mullions, a recessed glass lobby and a plant floor. */
function darkSlab(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const w = 28;
  const d = 15;
  m.box("stone", 0, 0, w + 10, d + 10, 0, 0.6); // the plaza
  m.box("glass", 0, 0, w - 3, d - 3, 0.6, 8);
  for (const x of [-1, -0.5, 0, 0.5, 1]) m.box("bronze", x * (w / 2 - 1), 0, 0.8, d - 1, 0.6, 8);
  m.box("glassBlack", 0, 0, w, d, 8, 120);
  floorBands(m, "bronze", rect(w, d), 8, 120, 3.8, 0.35, 0.12);
  piers(m, "bronze", 0, 0, w, d, 8, 120, 9, 0.25, 0.4);
  m.box("bronze", 0, 0, w + 0.6, d + 0.6, 120, 121);
  m.box("glassBlack", 0, 0, w - 2, d - 2, 121, 127);
  piers(m, "bronze", 0, 0, w - 2, d - 2, 121, 127, 18, 0.4, 0.3);
  m.box("bronze", 0, 0, w - 1.6, d - 1.6, 127, 128);
  return m;
}

/** A round, bullet-shaped tower banded in light and dark glass. */
function bullet(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const n = 20;
  m.prism("dark", ngon(n, 15, 0), 0, 4);
  // radius as a function of height: swells a little, then curves into the tip
  const H = 140;
  const radius = (y: number): number => {
    const t = y / H;
    return 12 * (1 + 0.18 * Math.sin(Math.PI * Math.min(t, 0.55) / 1.1)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, t - 0.55) / 0.45, 2)));
  };
  const step = 4;
  for (let y = 4, i = 0; y < H - step; y += step, i++) {
    const r0 = radius(y - 4);
    const r1 = radius(y + step - 4);
    m.loft(i % 2 ? "glassDark" : "glass", ngon(n, r0, 0), y, ngon(n, r1, 0), y + step, false);
  }
  const yTop = 4 + Math.floor((H - step - 4) / step) * step + step;
  m.spire("glassDark", ngon(n, radius(yTop - 4), 0), yTop, H + 4);
  // diagonal "diagrid" ribs: a few steel fins tracking the profile
  for (let k = 0; k < 6; k++) {
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
  }
  return m;
}

/** A glass tower stepping back in green roof terraces towards one corner. */
function terraced(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.box("stone", 0, 0, 30, 30, 0, 5);
  const steps: Array<[number, number, number, number, number]> = [
    // w, d, cx, cz, top
    [28, 28, 0, 0, 34],
    [24, 24, -2, -2, 62],
    [20, 20, -4, -4, 88],
    [16, 16, -6, -6, 110],
    [12, 12, -8, -8, 126],
  ];
  let y = 5;
  for (const [w, d, cx, cz, top] of steps) {
    curtainWall(m, "glassGreen", "white", cx, cz, w, d, y, top, { floor: 3.6, bays: 5 });
    m.box("white", cx, cz, w + 0.8, d + 0.8, top, top + 0.8);
    // a planted terrace on the step: a lawn and a few tree crowns
    m.box("roofGreen", cx, cz, w - 1, d - 1, top + 0.8, top + 1.2);
    for (const [tx, tz] of [[w / 2 - 2.5, d / 2 - 2.5], [w / 2 - 2.5, -d / 2 + 4], [-w / 2 + 4, d / 2 - 2.5]]) {
      m.spire("roofGreen", ngon(6, 1.5, 0, cx + tx, cz + tz), top + 1.2, top + 4.5);
    }
    y = top + 0.8;
  }
  mast(m, -8, -8, 127.2, 14, 0.35);
  return m;
}

/** A white tapering pyramid tower with two side wings and a spire. */
function pyramid(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const H = 140;
  const base = 26;
  const spireFrom = 112;
  const at = (y: number): number => base * (1 - (y / H) * 0.92);
  m.box("dark", 0, 0, base + 3, base + 3, 0, 1);
  // window bands: alternating white and dark rings, every floor
  const step = 4;
  for (let y = 1, i = 0; y < spireFrom; y += step, i++) {
    const s0 = at(y);
    const s1 = at(y + step);
    m.loft("white", rect(s0, s0), y, rect(s1, s1), y + step * 0.55, false);
    m.loft("window", rect(s0 - (s0 - s1) * 0.55, s0 - (s0 - s1) * 0.55), y + step * 0.55, rect(s1, s1), y + step, false);
  }
  m.spire("white", rect(at(spireFrom), at(spireFrom)), spireFrom, H + 10);
  // the two wings that carry the lift shafts, from mid-height to the spire
  for (const s of [-1, 1]) {
    const x0 = s * at(60) / 2;
    const x1 = s * at(spireFrom) / 2;
    m.loft("white", rect(3.2, 6, x0 + s * 1.2, 0), 60, rect(2.6, 4.5, x1 + s * 1.0, 0), spireFrom + 6);
  }
  return m;
}

export interface ProceduralDesign {
  id: string;
  title: string;
  build: () => MeshBuilder;
}

/**
 * The game-catalog fields every skyscraper shares, written into each one's
 * meta.json entry (generate.ts). They are what the game's building catalog needs
 * beyond the GLB: the picker category, the city block pool the towers are drawn
 * from, the on-map size, and the attribution.
 */
export const SKYSCRAPER_CATALOG = {
  category: "Commercial",
  group: "skyscraper_c",
  defaultScale: 0.5,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
} as const;

/** Every procedural skyscraper, by catalog id. The ids are stored in saved maps. */
export const SKYSCRAPERS: ProceduralDesign[] = [
  { id: "sky-glass-office", title: "Glass Office Tower", build: glassOffice },
  { id: "sky-art-deco", title: "Art Deco Tower", build: artDeco },
  { id: "sky-pagoda", title: "Pagoda Tower", build: pagoda },
  { id: "sky-brick-residential", title: "Brick Apartment Tower", build: brickResidential },
  { id: "sky-twin-towers", title: "Twin Towers", build: twinTowers },
  { id: "sky-twisted", title: "Twisting Tower", build: twisted },
  { id: "sky-dark-slab", title: "Black Glass Slab", build: darkSlab },
  { id: "sky-bullet", title: "Bullet Tower", build: bullet },
  { id: "sky-terraced", title: "Terraced Green Tower", build: terraced },
  { id: "sky-pyramid", title: "Pyramid Tower", build: pyramid },
];
