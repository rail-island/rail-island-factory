// Notre-Dame and Prague Castle's St Vitus, in the reference GLBs' axes/metres.
// No input assets are needed at runtime. See docs/models/gothic-cathedrals.md.
import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import { Gothic, GOTHIC_PALETTE } from "./gothicParts.ts";
import type { CatalogFields, ProceduralDesign } from "./design.ts";

const PI = Math.PI;

/** Rear-facing half polygon joined to the nave at z. */
function apse(r: number, z: number, n = 10): Ring {
  return Array.from({ length: n + 1 }, (_, i) => [r * Math.cos(i * PI / n), z - r * Math.sin(i * PI / n)]);
}

/** Nave and polygonal choir with two levels of windows and flying buttresses. */
function vessel(g: Gothic, prague: boolean): void {
  const m = g.m;
  const front = prague ? 44.5 : 44;
  const back = prague ? -44.5 : -37;
  const half = prague ? 7.6 : 9.5;
  const aisle = prague ? 15.2 : 18.0;
  const eave = prague ? 33 : 34;
  const ridge = prague ? 41.6 : 45;
  m.scope("nave and choir", () => {
    m.scope("walls and roofs", () => {
      g.box("stone", 0, (front + back) / 2, half * 2, front - back, 0, eave);
      for (const s of [-1, 1]) {
        g.box("stone", s * (half + aisle) / 2, (front + back) / 2, aisle - half, front - back, 0, 16.8);
        g.slab("roof", [[s * (half - 0.1), 23.2, front - 0.12], [s * (aisle + 0.4), 17.1, front - 0.12], [s * (aisle + 0.4), 17.1, back + 0.15], [s * (half - 0.1), 23.2, back + 0.15]], [0, -0.25, 0]);
        g.box("trim", s * aisle, (front + back) / 2, 0.65, front - back + 0.3, 16.6, 17.05);
        g.box("trim", s * half, (front + back) / 2, 0.6, front - back + 0.12, eave - 0.4, eave + 0.1);
      }
      g.roof(0, (front + back) / 2, half * 2 + 0.7, front - back, eave + 0.12, ridge);
      g.box("lead", 0, (front + back) / 2, 0.26, front - back, ridge, ridge + 0.22);
      for (let z = back + 2; z < front; z += 5) {
        for (const s of [-1, 1]) g.beam("lead", [s * (half + 0.25), eave + 0.25, z], [s * 0.16, ridge + 0.08, z], 0.08);
        if (prague) g.pinnacle(0, z, ridge + 0.23, 1.4, 0.16);
      }
    });
    m.scope("side bays", () => {
      const bays = prague ? [39, 31, 23, 15, 7, -1, -9, -27, -35, -42] : [38, 29, 20, 11, 2, -20, -29];
      for (const s of [-1, 1]) for (const z of bays) {
        if (prague && s > 0 && z < 10 && z > -6) continue;
        m.scope(`bay ${s} ${z}`, () => {
          g.window(s * half, z, s * PI / 2, 4.6, 23.9, eave - 0.9);
          g.window(s * aisle, z, s * PI / 2, 4.8, 4.1, 15.6);
          const bz = z - 3.6;
          const outer = prague ? 18.0 : 22;
          g.buttress(s * outer, bz, s * PI / 2, 23.5);
          g.flying(s * outer, bz, s, 0, outer - half + 0.2, 22.4, 31.4);
          if (!prague) g.flying(s * outer, bz, s, 0, outer - half + 0.2, 17.8, 25.1);
          g.box("stone", s * half, bz, 1.1, 1.3, 17, eave + 0.8);
          g.pinnacle(s * half, bz, eave + 0.8, 4, 0.42);
        });
      }
    });
  });
  m.scope("polygonal apse", () => {
    g.loft("stone", apse(aisle, back), 0, apse(aisle, back), 16.8);
    g.loft("roof", apse(aisle + 0.35, back + 0.04), 17.1, apse(half - 0.04, back + 0.04), 23.2);
    g.loft("stone", apse(half, back), 16.8, apse(half, back), eave);
    const roofRing = apse(half + 0.35, back - 0.02);
    for (let i = 0; i + 1 < roofRing.length; i++) {
      const a = roofRing[i]!, b = roofRing[i + 1]!;
      m.facets("roof", [g.p([a[0], eave + 0.12, a[1]]), g.p([b[0], eave + 0.12, b[1]]), g.p([0, ridge, back])], [0, 1, 0]);
    }
    for (let i = 0; i < 10; i++) {
      const a = (i + 0.5) * PI / 10;
      const nx = Math.cos(a), nz = -Math.sin(a);
      const face = PI / 2 + a;
      const ap = Math.cos(PI / 20);
      g.window(aisle * nx * ap, back + aisle * nz * ap, face, 3.6, 4, 15.4);
      g.window(half * nx * ap, back + half * nz * ap, face, 2.1, 24, eave - 1, false);
      if (i % 2 === 0 || prague) {
        const outer = prague ? 16.6 : 19.1;
        g.buttress(outer * nx, back + outer * nz, face, 23.1);
        g.flying(outer * nx, back + outer * nz, nx, nz, outer - half + 0.2, 22.0, 31.3);
      }
    }
  });
}

function transept(g: Gothic, prague: boolean): void {
  const z = prague ? -19.5 : -8;
  const width = prague ? 40.8 : 49.4;
  const depth = prague ? 14 : 15;
  const eave = prague ? 33 : 34;
  g.m.scope("transept", () => {
    g.box("stone", 0, z, width, depth, 0.04, eave - 0.1);
    g.roof(0, z, width + 0.4, depth + 0.6, eave + 0.16, prague ? 41 : 45.05, true);
    for (const s of [-1, 1]) {
      const x = s * width / 2, face = s * PI / 2;
      g.portal(x, z, face, 7.5, 13.8);
      g.rose(x, z, face, 25.5, prague ? 4.4 : 5.1);
      g.panel("stone", x, z, face, [[-depth / 2, eave], [0, prague ? 41 : 45], [depth / 2, eave]], 0.45);
      g.line("trim", x, z, face, [[-depth / 2, eave + 0.2], [0, prague ? 41.3 : 45.3], [depth / 2, eave + 0.2]], 0.6, 0.35);
      for (const dz of [-depth / 2 + 0.5, depth / 2 - 0.5]) {
        g.box("stone", x, z + dz, 1.3, 1.6, 0.1, eave + 0.4);
        g.pinnacle(x, z + dz, eave + 0.4, 6, 0.6);
      }
    }
  });
}

/** Open pairs of tall belfry arches: piers, arch voussoirs and spandrels. */
function openBelfry(g: Gothic, x: number, z: number, w: number, d: number, y0: number, y1: number): void {
  g.m.scope("open belfry", () => {
    g.box("recess", x, z, w - 1.6, d - 1.6, y0 - 0.1, y0 + 0.08);
    g.box("stone", x, z, w, d, y1 - 1.0, y1);
    for (const [face, span, cx, cz] of [[0, w, x, z + d / 2], [PI, w, x, z - d / 2], [PI / 2, d, x + w / 2, z], [-PI / 2, d, x - w / 2, z]] as const) {
      const opening = (span - 3) / 2;
      for (const u of [-span / 2 + 0.5, 0, span / 2 - 0.5]) {
        const p = g.at(cx, cz, face, u, y0);
        g.box("stone", p[0], p[2], 1.0, 1.0, y0, y1 - 0.5, face);
      }
      for (const side of [-1, 1]) {
        const u = side * (span - 1) / 4;
        const spring = y1 - opening * 0.72 - 1;
        for (let i = 0; i < 12; i++) {
          const a = -1 + i / 6, b = -1 + (i + 1) / 6;
          const ya = spring + opening * 0.72 * (1 - a * a);
          const yb = spring + opening * 0.72 * (1 - b * b);
          g.panel("stone", cx, cz, face, [[u + a * opening / 2, ya], [u + b * opening / 2, yb], [u + b * opening / 2, y1 - 0.51], [u + a * opening / 2, y1 - 0.51]], 0.34);
        }
      }
    }
  });
}

export function notreDame(): MeshBuilder {
  const m = new MeshBuilder(GOTHIC_PALETTE), g = new Gothic(m);
  vessel(g, false);
  transept(g, false);
  m.scope("west facade", () => {
    g.box("stone", 0, 49, 43, 12, 0, 40);
    for (const x of [-14.6, 0, 14.6]) {
      g.portal(x, 55, 0, x === 0 ? 11 : 9.5, x === 0 ? 14.6 : 13);
      g.box("stone", x, 56, x === 0 ? 12 : 10.5, 3.7, 0, 0.35);
    }
    for (const y of [15.8, 20.9, 33.4, 39.5]) g.box("trim", 0, 49, 44.2, 13.2, y, y + 0.55);
    m.scope("gallery of kings", () => {
      for (let i = 0; i < 28; i++) {
        const x = -19.8 + i * 1.465;
        g.panel("recess", x, 55, 0, [[-0.53, 16.7], [-0.53, 19.8], [0.53, 19.8], [0.53, 16.7]], 0.19);
        g.statue(x, 55.6, 16.8, 2.4);
        g.box("trim", x + 0.68, 55.35, 0.15, 0.4, 16.5, 20.5);
      }
    });
    g.rose(0, 55, 0, 27.3, 4.8);
    for (const x of [-14.6, 14.6]) {
      g.window(x - 2.2, 55, 0, 3.7, 23, 31.7);
      g.window(x + 2.2, 55, 0, 3.7, 23, 31.7);
    }
    m.scope("upper arcade", () => {
      for (let i = 0; i < 19; i++) g.window(-19.8 + i * 2.2, 55.05, 0, 1.75, 34.6, 38.8, false);
    });
    for (const x of [-20.5, -7.4, 7.4, 20.5]) g.box("stone", x, 55.8, 1.4, 1.6, 0.4, 41);
  });
  for (const x of [-14.6, 14.6]) m.scope(x < 0 ? "north tower" : "south tower", () => {
    openBelfry(g, x, 48.8, 13.6, 11.0, 40.1, 68.3);
    m.scope("bell and timber yoke", () => {
      g.box("door", x, 48.8, 8.4, 0.8, 61.5, 62.2);
      g.box("recess", x, 48.8, 0.3, 0.3, 57.8, 61.5);
      g.loft("recess", ngon(12, 2.0, 0, x, 48.8), 55.5, ngon(12, 1.3, 0, x, 48.8), 56.3, false);
      g.loft("recess", ngon(12, 1.3, 0, x, 48.8), 56.3, ngon(12, 0.6, 0, x, 48.8), 59.0);
    });
    for (const dx of [-6.3, 6.3]) for (const dz of [-5.0, 5.0]) {
      g.box("stone", x + dx, 48.8 + dz, 1.2, 1.2, 39.9, 69.2);
      g.box("trim", x + dx, 48.8 + dz, 1.65, 1.65, 66.8, 67.3);
    }
    g.box("trim", x, 48.8, 14.7, 12.1, 68.3, 69.1);
    g.box("roof", x, 48.8, 12.3, 9.7, 69.12, 69.22);
    for (const s of [-1, 1]) {
      g.box("trim", x, 48.8 + s * 5.5, 13.7, 0.36, 71.1, 71.5);
      g.box("trim", x + s * 6.7, 48.8, 0.36, 11, 71.1, 71.5);
      for (let i = 0; i < 12; i++) g.box("stone", x - 6.3 + i * 1.15, 48.8 + s * 5.5, 0.24, 0.26, 69.1, 71.1);
      for (let i = 0; i < 9; i++) g.box("stone", x + s * 6.7, 44 + i * 1.2, 0.26, 0.24, 69.1, 71.1);
    }
  });
  m.scope("crossing fleche", () => {
    g.loft("lead", ngon(8, 4.7, PI / 8, 0, -8), 42.8, ngon(8, 3.3, PI / 8, 0, -8), 49.8);
    g.loft("roof", ngon(8, 3.3, PI / 8, 0, -8), 49.8, ngon(8, 2.8, PI / 8, 0, -8), 62);
    for (let i = 0; i < 8; i++) {
      const a = i * PI / 4, x = 3.08 * Math.cos(a), z = -8 + 3.08 * Math.sin(a);
      g.window(x, z, PI / 2 - a, 1.5, 51.5, 60.8, false);
      g.beam("lead", [3.35 * Math.cos(a), 49.9, -8 + 3.35 * Math.sin(a)], [0, 91.4, -8], 0.13);
    }
    g.spire("roof", ngon(8, 3.0, PI / 8, 0, -8), 62, 91.4);
    g.cross(0, -8, 91.4, 2.8);
    for (let i = 0; i < 12; i++) {
      const a = i * PI / 6;
      g.statue(5.3 * Math.cos(a), -8 + 5.3 * Math.sin(a), 44.5, 1.8);
    }
  });
  return m;
}

function pragueWestTower(g: Gothic, x: number): void {
  g.m.scope(x < 0 ? "north west tower" : "south west tower", () => {
    g.box("stone", x, 51, 13, 13, 0, 44);
    for (const [face, cx, cz] of [[0, x, 57.5], [PI / 2, x + 6.5, 51], [-PI / 2, x - 6.5, 51], [PI, x, 44.5]] as const) {
      g.window(cx, cz, face, 4.0, 18, 34);
      g.window(cx, cz, face, 3.5, 36, 42.6, false);
    }
    for (const dx of [-5.9, 5.9]) for (const dz of [-5.9, 5.9]) {
      g.box("stone", x + dx, 51 + dz, 1.4, 1.4, 0.2, 45.3);
      g.pinnacle(x + dx, 51 + dz, 45.3, 16, 0.8);
    }
    g.box("trim", x, 51, 14.3, 14.3, 44, 45.1);
    openBelfry(g, x, 51, 10.5, 10.5, 45.2, 53.1);
    g.spire("roof", ngon(8, 6.1, PI / 8, x, 51), 53.15, 83.3);
    for (let i = 0; i < 8; i++) {
      const a = PI / 8 + i * PI / 4;
      g.beam("lead", [x + 6.1 * Math.cos(a), 53.2, 51 - 6.1 * Math.sin(a)], [x, 83.3, 51], 0.17);
      for (const t of [0.15, 0.28, 0.41, 0.54, 0.67, 0.80]) {
        const r = 6.1 * (1 - t);
        const cx = x + r * Math.cos(a), cz = 51 - r * Math.sin(a), y = 53.2 + 30.1 * t;
        g.spire("stone", ngon(4, 0.38 * (1 - t * 0.6), 0, cx, cz), y, y + 0.65);
      }
    }
    g.cross(x, 51, 83.3, 3.2);
  });
}

function greatSouthTower(g: Gothic): void {
  const x = 14, z = -2.5;
  g.m.scope("great south tower", () => {
    g.box("stone", x, z, 14, 14, 0, 52);
    for (const [face, cx, cz] of [[PI / 2, x + 7, z], [0, x, z + 7], [PI, x, z - 7]] as const) {
      g.window(cx, cz, face, 3.4, 6, 20);
      for (const u of [-2.3, 2.3]) {
        const p = g.at(cx, cz, face, u, 0);
        g.window(p[0], p[2], face, 3.4, 27, 41.5);
      }
      g.m.scope("clock", () => {
        const disc: Array<[number, number]> = Array.from({ length: 32 }, (_, i) => [2.3 * Math.cos(i * PI / 16), 46.7 + 2.3 * Math.sin(i * PI / 16)]);
        g.panel("recess", cx, cz, face, disc, 0.26);
        g.circle(cx, cz, face, 0, 46.7, 2.35, 0.18, 0.44, "gold");
        for (let i = 0; i < 12; i++) {
          const a = i * PI / 6;
          g.line("gold", cx, cz, face, [[1.75 * Math.sin(a), 46.7 + 1.75 * Math.cos(a)], [2.04 * Math.sin(a), 46.7 + 2.04 * Math.cos(a)]], 0.48, 0.11);
        }
        g.line("gold", cx, cz, face, [[-1.1, 47.5], [0, 46.7], [0.7, 48.4]], 0.5, 0.12);
      });
    }
    for (const dx of [-6.6, 6.6]) for (const dz of [-6.6, 6.6]) g.box("trim", x + dx, z + dz, 0.5, 0.5, 0.2, 52.03);
    g.box("trim", x, z, 16.6, 16.6, 52, 53.5);
    g.box("stone", x, z, 14.7, 14.7, 53.5, 56.4);
    const profile: Array<[number, number]> = [[56.4, 7.0], [58.0, 7.3], [60.2, 5.2], [61.5, 4.5], [64.0, 3.9], [66.4, 2.4], [67.7, 2.2]];
    for (let i = 0; i + 1 < profile.length; i++) {
      const a = profile[i]!, b = profile[i + 1]!;
      g.loft("copper", ngon(20, a[1], 0, x, z), a[0], ngon(20, b[1], 0, x, z), b[0], false);
    }
    g.loft("recess", ngon(12, 1.55, 0, x, z), 67.7, ngon(12, 1.55, 0, x, z), 74.2);
    for (let i = 0; i < 8; i++) {
      const a = i * PI / 4;
      g.box("trim", x + 1.9 * Math.cos(a), z + 1.9 * Math.sin(a), 0.3, 0.3, 67.6, 74.3);
    }
    g.loft("copper", ngon(16, 2.4, 0, x, z), 74.3, ngon(16, 1.35, 0, x, z), 77.3);
    g.spire("copper", ngon(12, 1.35, 0, x, z), 77.3, 88.5);
    g.loft("gold", ngon(12, 0.45, 0, x, z), 88.2, ngon(12, 0.55, 0, x, z), 88.8);
    g.cross(x, z, 88.8, 2.8);
    for (const dx of [-5.8, 5.8]) for (const dz of [-5.8, 5.8]) {
      g.loft("copper", ngon(10, 1.25, 0, x + dx, z + dz), 56.4, ngon(10, 1.0, 0, x + dx, z + dz), 58.3);
      g.spire("copper", ngon(10, 1, 0, x + dx, z + dz), 58.3, 61.5);
    }
  });
}

export function pragueCastleStVitus(): MeshBuilder {
  const m = new MeshBuilder({ ...GOTHIC_PALETTE, stone: { color: "#b4ac99", roughness: 0.95 } });
  const g = new Gothic(m, -PI / 2, -4.5); // west front -X, south +Z
  vessel(g, true);
  transept(g, true);
  m.scope("west facade", () => {
    g.box("stone", 0, 51, 12.5, 13, 0.05, 40);
    g.portal(0, 57.5, 0, 9.8, 17.5);
    g.rose(0, 57.5, 0, 28.5, 5.2);
    g.panel("stone", 0, 57.5, 0, [[-6.25, 40], [0, 49], [6.25, 40]], 0.25);
    g.line("trim", 0, 57.5, 0, [[-6.5, 40], [0, 49.5], [6.5, 40]], 0.5, 0.36);
    g.window(0, 57.75, 0, 2.5, 39.2, 45.8);
    for (const y of [18.3, 36.3, 39.6]) g.box("trim", 0, 57.6, 13.0, 0.65, y, y + 0.45);
    for (const x of [-10.5, 10.5]) g.portal(x, 57.5, 0, 7.4, 13.8);
    for (let i = 0; i < 9; i++) g.statue(-5.4 + i * 1.35, 58.1, 36.8, 1.6);
    g.box("stone", 0, 59.7, 35, 5, 0, 0.35);
  });
  pragueWestTower(g, -10.5);
  pragueWestTower(g, 10.5);
  greatSouthTower(g);
  return m;
}

export const GOTHIC_CATALOG: CatalogFields = {
  category: "Historical", group: "hist_center", defaultScale: 1,
  license: "CC0", author: "Rail Island", source: "Rail Island",
};

export const GOTHIC_CATHEDRALS: ProceduralDesign[] = [
  { id: "bld-notre-dame", title: "Notre-Dame", build: notreDame, references: "notre-dame", catalog: GOTHIC_CATALOG },
  { id: "bld-prague-castle-st-vitus", title: "Prague Castle (St Vitus)", build: pragueCastleStVitus, references: "prague-castle-st-vitus", catalog: GOTHIC_CATALOG },
];
