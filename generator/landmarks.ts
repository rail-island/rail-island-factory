import { lodBox } from './lodPrimitives.ts';
// The secular landmarks modelled on the photos in assets/: the Brandenburg Gate,
// the Louvre Pyramid and the White House. See docs/models/landmarks.md.
//
// Each design reproduces the hand-authored GLB of the same name in the webapp's
// model database (rail-island-webapp db/buildings/glb/), procedurally: the same
// axes, about the same bounding box (test/referenceModels.test.ts) and the same
// look, at a fraction of the triangles. The photos fill in what the reference
// leaves out (fluted columns, the Victoria's standard, the pyramid's lattice).
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin like the
// references: the gate's passages and the White House's south bow face +Z.
// Every design is deterministic, the same code gives the same bytes.
//
// The ids are what the game's saved maps store, so a design is never renamed
// once shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { CatalogFields, ProceduralDesign } from "./design.ts";

const PALETTE: Record<string, MaterialSpec> = {
  // Brandenburg Gate (the reference's colours)
  granite: { color: "#8d8880", roughness: 0.9 },
  sandstone: { color: "#d7cbb2", roughness: 0.9 },
  sandstoneShade: { color: "#bdae93", roughness: 0.9 },
  sandstoneLight: { color: "#e3d9c4", roughness: 0.85 },
  patina: { color: "#5c7a63", metallic: 0.35, roughness: 0.6 },
  gilt: { color: "#bd9a55", metallic: 0.6, roughness: 0.4 },
  // Louvre Pyramid
  glass: { color: "#bcd4de", metallic: 0.2, roughness: 0.15 },
  steel: { color: "#b9c1c7", metallic: 0.5, roughness: 0.4 },
  steelRib: { color: "#d7dcdf", metallic: 0.5, roughness: 0.4 },
  sill: { color: "#8e9397", metallic: 0.3, roughness: 0.5 },
  paving: { color: "#d8d2c4", roughness: 0.9 },
  // White House
  aquia: { color: "#f5f2ea", roughness: 0.9 },
  trim: { color: "#fdfbf6", roughness: 0.8 },
  leadRoof: { color: "#9aa0a3", metallic: 0.3, roughness: 0.6 },
  windowGlass: { color: "#333b45", metallic: 0.2, roughness: 0.2 },
};

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, mul(sub(b, a), t));

/** The two unit axes across the segment a -> b: `v` as close to `up` as it can be, `u` beside it. */
function frameOf(a: Vec3, b: Vec3, up: Vec3): { u: Vec3; v: Vec3 } {
  const d = unit(sub(b, a));
  let v = sub(up, mul(d, dot(up, d)));
  if (Math.hypot(v[0], v[1], v[2]) < 1e-6) v = Math.abs(d[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
  v = unit(sub(v, mul(d, dot(v, d))));
  return { u: cross(d, v), v };
}

/** A straight bar from a to b, w wide and h deep across it; `up` turns its h side. */
function beam(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, w: number, h: number, up: Vec3 = [0, 1, 0]): void {
  const { u, v } = frameOf(a, b, up);
  const c = (su: number, sv: number): Vec3 => add(a, add(mul(u, (su * w) / 2), mul(v, (sv * h) / 2)));
  m.slab(mat, [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)], sub(b, a));
}

/** A round bar (an n-gon section) of radius r from a to b. */
function rod(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, r: number, n = 8): void {
  const { u, v } = frameOf(a, b, [0, 1, 0]);
  const pts: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = ((i + 0.5) / n) * Math.PI * 2;
    pts.push(add(a, add(mul(u, r * Math.cos(t)), mul(v, r * Math.sin(t)))));
  }
  m.slab(mat, pts, sub(b, a));
}

/** A closed box spanning x0..x1, y0..y1, z0..z1: a box() plus its underside, `top` optional. */
function cube(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  const r = rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);
  m.prism(mat, r, y0, y1, top);
  m.cap(mat, r, y0, false);
}

/** A box() given by its spans instead of its centre and size; no underside. */
function span(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1, 0, top);
}

/** A circle of n points about (cx, cz), wound like ngon (rotated half a step so a side faces +X). */
const circle = (n: number, r: number, cx = 0, cz = 0): Ring => ngon(n, r, Math.PI / n, cx, cz);

/** A fluted shaft section: 2n points alternating between the arris radius r and the flute bottom. */
function fluted(n: number, r: number, cx: number, cz: number, depth = 0.07): Ring {
  const ring: Ring = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = (i / (2 * n)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * (1 - depth);
    ring.push([cx + rr * Math.cos(a), cz - rr * Math.sin(a)]);
  }
  return ring;
}

/**
 * The half disc of radius r on the +Z side of (cx, cz), `n` segments of arc and
 * the chord along z = cz: the plan of the White House's south bow.
 */
function bowRing(r: number, cx: number, cz: number, n: number, back = 0): Ring {
  const ring: Ring = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    ring.push([cx + r * Math.cos(a), cz - r * Math.sin(a)]);
  }
  // the chord hides inside the main block; `back` sets it deeper, so the
  // chords of two materials do not share the plane z = cz
  ring[0] = [ring[0]![0], cz - back];
  ring[n] = [ring[n]![0], cz - back];
  return ring;
}

/**
 * A Greek Doric column standing on y0 with its abacus top at yTop: a fluted,
 * tapering shaft, three annulets, the echinus and a square abacus.
 */
function doricColumn(m: MeshBuilder, cx: number, cz: number, r: number, y0: number, yTop: number): void {
  m.scope("doric column", () => {
    const capH = 1.08 * Math.min(1, r / 0.86 + 0.2);
    const yShaft = yTop - capH;
    const rTop = r * 0.84;
    m.loft("sandstone", fluted(10, r, cx, cz), y0, fluted(10, rTop, cx, cz), yShaft, false);
    const ann = capH * 0.26;
    for (let i = 0; i < 3; i++) {
      const a0 = yShaft + (i * ann) / 3;
      m.prism("sandstoneShade", circle(16, rTop * 1.04, cx, cz), a0, a0 + (ann / 3) * 0.8, i === 2);
    }
    const yEch = yShaft + ann;
    const yAb = yTop - capH * 0.34;
    m.loft("sandstoneLight", circle(16, rTop * 1.02, cx, cz), yEch, circle(16, r * 1.33, cx, cz), yAb, false);
    cube(m, "sandstoneLight", cx - r * 1.32, cx + r * 1.32, yAb, yTop, cz - r * 1.32, cz + r * 1.32);
  });
}

/**
 * An Ionic column of the White House: square plinth, a torus base, a smooth
 * tapering shaft, necking, echinus, the two volutes (scrolls whose axis runs
 * along `face`, the direction the column faces) and the abacus.
 */
function ionicColumn(m: MeshBuilder, cx: number, cz: number, r: number, y0: number, yTop: number, face: number): void {
  m.scope("ionic column", () => {
    const fx = Math.sin(face);
    const fz = Math.cos(face);
    const sx = fz; // the scrolls sit either side, across the face
    const sz = -fx;
    const plinthH = r * 0.42;
    const ry = -face;
    m.box("trim", cx, cz, r * 2.9, r * 2.9, y0, y0 + plinthH, ry);
    const yb = y0 + plinthH;
    m.loft("trim", circle(16, r * 1.38, cx, cz), yb, circle(16, r * 1.38, cx, cz), yb + r * 0.18, false);
    m.loft("trim", circle(16, r * 1.38, cx, cz), yb + r * 0.18, circle(16, r * 1.05, cx, cz), yb + r * 0.42, false);
    const yNeck = yTop - r * 1.05;
    m.loft("trim", circle(16, r * 1.05, cx, cz), yb + r * 0.42, circle(16, r * 0.88, cx, cz), yNeck, false);
    m.prism("trim", circle(16, r * 0.93, cx, cz), yNeck, yNeck + r * 0.17, false);
    m.loft("trim", circle(16, r * 0.93, cx, cz), yNeck + r * 0.17, circle(16, r * 1.08, cx, cz), yNeck + r * 0.55, false);
    const yAb = yTop - r * 0.32;
    for (const s of [-1, 1]) {
      const vx = cx + s * sx * r * 1.0;
      const vz = cz + s * sz * r * 1.0;
      const half = r * 0.75;
      rod(m, "trim", [vx - fx * half, yAb - r * 0.28, vz - fz * half], [vx + fx * half, yAb - r * 0.28, vz + fz * half], r * 0.3, 8);
    }
    m.box("trim", cx, cz, r * 2.5, r * 2.5, yAb, yTop, ry);
  });
}

// --- the Brandenburg Gate -------------------------------------------------------------

/** The x centres of the gate's six piers (and their column pairs): five passages, the middle one widest. */
const GATE_PIERS = [-14.8, -9.25, -3.7, 3.7, 9.25, 14.8];

/** A horse of the quadriga at x, facing +Z: the body lofted from oval sections, neck, head, legs, tail. */
function horse(m: MeshBuilder, x: number, rearing: boolean): void {
  const P = "patina";
  m.scope("body", () => {
    // oval sections along z: [z, half width, half height, centre y]
    const secs: Array<[number, number, number, number]> = [
      [0.62, 0.28, 0.36, 25.62], [0.9, 0.55, 0.6, 25.66], [1.6, 0.6, 0.6, 25.62],
      [2.5, 0.56, 0.56, 25.6], [3.3, 0.6, 0.64, 25.7], [3.95, 0.34, 0.46, 25.8],
    ];
    const oval = (w: number, h: number, cy: number): Ring => {
      const ring: Ring = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        ring.push([x + w * Math.cos(a), cy + h * Math.sin(a)]);
      }
      return ring;
    };
    for (let i = 0; i + 1 < secs.length; i++) {
      const [z0, w0, h0, y0] = secs[i]!;
      const [z1, w1, h1, y1] = secs[i + 1]!;
      m.sweep(P, "z", oval(w0, h0, y0), z0, oval(w1, h1, y1), z1, i === 0 || i === secs.length - 2);
    }
  });
  m.scope("neck and head", () => {
    beam(m, P, [x, 25.75, 3.45], [x, 27.25, 4.25], 0.46, 0.62, [0, 0.4, -1]);
    beam(m, P, [x, 26.05, 3.2], [x, 27.5, 4.0], 0.14, 0.2, [0, 0.4, -1]); // mane
    beam(m, P, [x, 27.55, 4.05], [x, 26.85, 4.85], 0.36, 0.42, [0, 1, 1]);
    for (const s of [-1, 1]) beam(m, P, [x + s * 0.11, 27.45, 4.15], [x + s * 0.14, 27.78, 4.2], 0.08, 0.1);
  });
  m.scope("legs", () => {
    const leg = (pts: Vec3[]): void => {
      for (let i = 0; i + 1 < pts.length; i++) beam(m, P, pts[i]!, pts[i + 1]!, i === 0 ? 0.3 : 0.2, i === 0 ? 0.34 : 0.22, [0, 0, 1]);
      const h = pts[pts.length - 1]!;
      m.box(P, h[0], h[2], 0.3, 0.32, Math.max(23.75, h[1] - 0.05), Math.max(23.75, h[1] - 0.05) + 0.2);
    };
    const xl = x + 0.3;
    const xr = x - 0.3;
    if (rearing) {
      leg([[xl, 25.4, 3.55], [xl, 24.85, 4.15], [xl, 24.25, 3.95]]);
    } else {
      leg([[xl, 25.4, 3.55], [xl, 24.6, 3.7], [xl, 23.85, 3.6]]);
    }
    leg([[xr, 25.4, 3.5], [xr, 24.6, 3.6], [xr, 23.85, 3.5]]);
    for (const lx of [xl, xr]) leg([[lx, 25.5, 1.1], [lx, 24.55, 0.8], [lx, 23.85, 1.0]]);
  });
  m.scope("tail", () => beam(m, P, [x, 25.85, 0.66], [x, 24.55, 0.25], 0.16, 0.2, [0, 0, -1]));
}

/** The quadriga on the attic: four horses abreast, the chariot and Victoria with her standard. */
function quadriga(m: MeshBuilder): void {
  m.scope("quadriga", () => {
    m.scope("horses", () => {
      [-2.98, -0.98, 0.98, 2.98].forEach((x, i) => m.scope(`horse ${i + 1}`, () => horse(m, x, i === 0 || i === 3)));
      m.scope("pole and yoke", () => {
        beam(m, "patina", [0, 24.75, -0.6], [0, 25.2, 2.85], 0.2, 0.2);
        beam(m, "patina", [-3.33, 25.2, 2.74], [3.33, 25.2, 2.74], 0.18, 0.18);
      });
    });
    m.scope("chariot", () => {
      const P = "patina";
      // a rounded tub, its gilt rim a ring of bars along the top edge
      const tub: Ring = [];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        tub.push([1.45 * Math.cos(a), -1.98 - 1.4 * Math.sin(a)]);
      }
      m.prism(P, tub, 24.7, 26.3);
      m.cap(P, tub, 24.7, false);
      for (let i = 0; i < tub.length; i++) {
        const [ax, az] = tub[i]!;
        const [bx, bz] = tub[(i + 1) % tub.length]!;
        beam(m, "gilt", [ax * 1.03, 26.36, -1.98 + (az + 1.98) * 1.03], [bx * 1.03, 26.36, -1.98 + (bz + 1.98) * 1.03], 0.12, 0.14);
      }
      m.scope("wheels", () => {
        rod(m, P, [-1.68, 24.7, -2.12], [1.68, 24.7, -2.12], 0.09, 6);
        for (const s of [-1, 1]) {
          const wx = s * 1.62;
          const c: Vec3 = [wx, 24.7, -2.12];
          const R = 0.95;
          const n = 16;
          for (let i = 0; i < n; i++) {
            const a0 = (i / n) * Math.PI * 2;
            const a1 = ((i + 1) / n) * Math.PI * 2;
            beam(m, P, [wx, c[1] + R * Math.sin(a0), c[2] + R * Math.cos(a0)], [wx, c[1] + R * Math.sin(a1), c[2] + R * Math.cos(a1)], 0.2, 0.14, [0, c[1], 0]);
          }
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI;
            const d: Vec3 = [0, Math.sin(a) * R, Math.cos(a) * R];
            beam(m, P, sub(c, d), add(c, d), 0.08, 0.08, [1, 0, 0]);
          }
          rod(m, "gilt", [wx - 0.2, 24.7, -2.12], [wx + 0.2, 24.7, -2.12], 0.2, 8);
        }
      });
    });
    m.scope("victoria", () => {
      const P = "patina";
      const cz = -1.9;
      m.loft(P, circle(10, 0.6, 0, cz), 24.82, circle(10, 0.4, 0, cz), 27.1, false);
      m.loft(P, circle(10, 0.4, 0, cz), 27.1, circle(10, 0.3, 0, cz), 27.84);
      m.prism(P, circle(8, 0.12, 0, cz), 27.84, 27.96, false);
      m.loft(P, circle(10, 0.17, 0, cz), 27.92, circle(10, 0.23, 0, cz), 28.1, false);
      m.loft(P, circle(10, 0.23, 0, cz), 28.1, circle(10, 0.16, 0, cz), 28.3, false);
      m.loft(P, circle(10, 0.16, 0, cz), 28.3, circle(10, 0.05, 0, cz), 28.36);
      // the wings, spread behind her shoulders
      for (const s of [-1, 1]) {
        m.slab(P, [[s * 0.18, 27.75, cz - 0.22], [s * 0.99, 28.27, cz - 0.15], [s * 0.85, 27.4, cz - 0.2], [s * 0.4, 26.75, cz - 0.24]], [0, 0, -0.1]);
      }
      // the right arm raised to the standard, the left lowered
      beam(m, P, [0.3, 27.7, cz], [0.78, 28.6, cz + 0.08], 0.16, 0.16);
      beam(m, P, [-0.3, 27.7, cz], [-0.68, 26.75, cz + 0.4], 0.16, 0.16);
      m.scope("standard", () => {
        const sx = 0.8;
        const sz = cz + 0.08;
        rod(m, P, [sx, 25.4, sz], [sx, 29.5, sz], 0.07, 6);
        const wc: Vec3 = [sx, 29.86, sz];
        const R = 0.44;
        const n = 14;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * Math.PI * 2;
          const a1 = ((i + 1) / n) * Math.PI * 2;
          beam(m, "gilt", [sx + R * Math.cos(a0), wc[1] + R * Math.sin(a0), sz], [sx + R * Math.cos(a1), wc[1] + R * Math.sin(a1), sz], 0.1, 0.12, [0, 0, 1]);
        }
        beam(m, "gilt", [sx, 29.5, sz], [sx, 30.22, sz], 0.14, 0.1, [0, 0, 1]);
        beam(m, "gilt", [sx - 0.3, 29.86, sz], [sx + 0.3, 29.86, sz], 0.14, 0.1, [0, 0, 1]);
      });
    });
  });
}

/** One of the two side wings (the guardhouses), on the +X side when s = 1. */
function gateWing(m: MeshBuilder, s: number): void {
  const X = (a: number, b: number): [number, number] => (s > 0 ? [a, b] : [-b, -a]);
  m.scope(s > 0 ? "east wing" : "west wing", () => {
    m.scope("base", () => {
      span(m, "granite", ...X(17.15, 33.05), 0, 0.35, -3.25, 3.25);
      span(m, "sandstoneShade", ...X(17.6, 32.6), 0.35, 0.95, -2.8, 2.8);
    });
    m.scope("walls", () => {
      span(m, "sandstone", ...X(18.3, 31.9), 0.95, 8.25, -1.35, 1.35, false);
      span(m, "sandstone", ...X(17.6, 18.6), 0.95, 8.25, -2.8, 2.8, false);
      span(m, "sandstone", ...X(31.6, 32.6), 0.95, 8.25, -2.8, 2.8, false);
      for (const z of [-1, 1]) {
        for (const c of [21.0, 25.1, 29.2]) {
          const [a, b] = X(c - 0.75, c + 0.75);
          span(m, "sandstoneShade", a, b, 0.95, c === 25.1 ? 5.2 : 4.6, z > 0 ? 1.3 : -1.41, z > 0 ? 1.41 : -1.3);
          if (c !== 25.1) span(m, "sandstoneLight", a - 0.15, b + 0.15, 4.6, 4.85, z > 0 ? 1.3 : -1.46, z > 0 ? 1.46 : -1.3);
        }
      }
    });
    m.scope("colonnade", () => {
      for (let k = 0; k < 5; k++) for (const z of [-2.7, 2.7]) doricColumn(m, s * (19.54 + 2.78 * k), z, 0.5, 0.95, 8.25);
    });
    m.scope("entablature", () => {
      cube(m, "sandstoneLight", ...X(17.5, 32.7), 8.25, 8.95, -2.97, 2.97);
      span(m, "sandstone", ...X(17.6, 32.6), 8.95, 9.75, -2.83, 2.83, false);
      cube(m, "sandstoneLight", ...X(17.25, 32.95), 9.75, 10.25, -3.2, 3.2);
      span(m, "sandstoneShade", ...X(17.9, 32.3), 10.25, 11.0, -2.45, 2.45);
    });
  });
}

export function brandenburgGate(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("gate", () => {
    m.scope("steps", () => {
      span(m, "granite", -17.6, 17.6, 0, 0.45, -4.8, 4.8);
      span(m, "sandstoneShade", -16.95, 16.95, 0.45, 1.25, -4.35, 4.35);
    });
    m.scope("piers", () => {
      for (const x of GATE_PIERS) {
        span(m, "sandstone", x - 0.83, x + 0.83, 1.25, 14.63, -3.55, 3.55, false);
        for (const side of [-1, 1]) {
          const px = x + side * 0.83;
          span(m, "sandstoneLight", side > 0 ? px : px - 0.11, side > 0 ? px + 0.11 : px, 1.25, 14.08, -3.3, 3.3);
          // a shallow niche in the passage wall
          if (Math.abs(x) > 4 || side * x > 0) {
            span(m, "sandstoneShade", side > 0 ? px + 0.11 : px - 0.15, side > 0 ? px + 0.15 : px - 0.11, 3.0, 9.5, -1.4, 1.4);
          }
        }
      }
    });
    m.scope("columns", () => {
      for (const x of GATE_PIERS) for (const z of [-3.55, 3.55]) doricColumn(m, x, z, 0.86, 1.25, 14.63);
    });
    m.scope("passage soffits", () => {
      for (let i = 0; i + 1 < GATE_PIERS.length; i++) {
        const a = GATE_PIERS[i]! + 0.83;
        const b = GATE_PIERS[i + 1]! - 0.83;
        span(m, "sandstoneShade", a, b, 14.33, 14.63, -3.55, 3.55, false);
        m.cap("sandstoneShade", rect(b - a, 7.1, (a + b) / 2, 0), 14.33, false);
      }
    });
    m.scope("entablature", () => {
      m.scope("architrave", () => cube(m, "sandstoneLight", -17.0, 17.0, 14.63, 15.73, -4.25, 4.25));
      m.scope("frieze", () => {
        span(m, "sandstone", -16.7, 16.7, 15.73, 17.28, -4.05, 4.05, false);
        for (let k = 0; k <= 20; k++) {
          const x = -16.1 + 1.61 * k;
          for (const z of [-1, 1]) span(m, "sandstoneShade", x - 0.26, x + 0.26, 15.73, 17.27, z > 0 ? 4.0 : -4.17, z > 0 ? 4.17 : -4.0);
        }
        for (let k = 0; k < 5; k++) {
          const z = -3.3 + 1.65 * k;
          span(m, "sandstoneShade", 16.65, 16.83, 15.73, 17.27, z - 0.26, z + 0.26);
          span(m, "sandstoneShade", -16.83, -16.65, 15.73, 17.27, z - 0.26, z + 0.26);
        }
      });
      m.scope("cornice", () => {
        cube(m, "sandstoneShade", -17.1, 17.1, 17.28, 17.58, -4.45, 4.45, false);
        cube(m, "sandstoneLight", -17.45, 17.45, 17.58, 18.28, -4.75, 4.75);
      });
    });
    m.scope("attic", () => {
      span(m, "sandstoneShade", -15.3, 15.3, 18.28, 18.83, -3.8, 3.8);
      span(m, "sandstone", -14.8, 14.8, 18.83, 22.28, -3.55, 3.55, false);
      for (const z of [-1, 1]) {
        const [z0, z1] = z > 0 ? [3.5, 3.69] : [-3.69, -3.5];
        m.scope("inscription", () => span(m, "sandstoneLight", -4.7, 4.7, 19.33, 21.68, z0, z1));
        m.scope("reliefs", () => {
          for (const s of [-1, 1]) {
            const [a, b] = s > 0 ? [6.1, 13.7] : [-13.7, -6.1];
            span(m, "sandstoneShade", a, b, 19.53, 21.48, z0, z1);
            // a few raised figures in each relief
            for (let k = 0; k < 4; k++) {
              const fx = a + 1.0 + k * 1.85;
              const [f0, f1] = z > 0 ? [z1 - 0.02, z1 + 0.1] : [z0 - 0.1, z0 + 0.02];
              span(m, "sandstone", fx - 0.3, fx + 0.3, 19.7, 21.2 - (k % 2) * 0.25, f0, f1);
            }
          }
        });
      }
      cube(m, "sandstoneLight", -15.4, 15.4, 22.28, 22.9, -3.95, 3.95);
      m.scope("quadriga plinth", () => {
        span(m, "sandstone", -5.7, 5.7, 22.9, 23.55, -3.45, 3.45, false);
        cube(m, "sandstoneLight", -5.85, 5.85, 23.55, 23.75, -3.6, 3.6);
      });
    });
    quadriga(m);
    gateWing(m, -1);
    gateWing(m, 1);
  });
  return m;
}

// --- the Louvre Pyramid -----------------------------------------------------------

export function louvrePyramid(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const h = 17.71; // half the base of the glass
  const y0 = 0.5; // the glass stands on the paving
  const apexY = 22.08;
  const divisions = 18; // lattice bays along a base edge
  m.scope("pyramid", () => {
    m.scope("paving", () => m.box("paving", 0, 0, 38.82, 38.82, 0, y0));
    m.scope("glazing", () => m.spire("glass", rect(2 * h, 2 * h), y0, apexY));
    m.scope("sill", () => {
      for (const s of [-1, 1]) {
        span(m, "sill", -18.04, 18.04, y0, 1.06, s > 0 ? 17.48 : -18.04, s > 0 ? 18.04 : -17.48);
        span(m, "sill", s > 0 ? 17.48 : -18.04, s > 0 ? 18.04 : -17.48, y0, 1.06, -17.48, 17.48);
      }
    });
    // each face: B0 -> B1 along the base (counter-clockwise from above), A the apex
    const apex: Vec3 = [0, apexY, 0];
    const corners: Vec3[] = [[-h, y0, h], [h, y0, h], [h, y0, -h], [-h, y0, -h]];
    const faces = ["south", "east", "north", "west"];
    const out = 0.07; // the lattice stands this far proud of the glass
    for (let f = 0; f < 4; f++) {
      const B0 = corners[f]!;
      const B1 = corners[(f + 1) % 4]!;
      const n = unit(cross(sub(B1, B0), sub(apex, B0)));
      const off = (p: Vec3): Vec3 => add(p, mul(n, out));
      m.scope(`${faces[f]} lattice`, () => {
        for (let k = 1; k < divisions; k++) {
          const u = k / divisions;
          const p0 = lerp3(B0, B1, u);
          // parallel to the right hip, up to the left one; and the mirror
          beam(m, "steel", off(p0), off(lerp3(B0, apex, u)), 0.09, 0.08, n);
          beam(m, "steel", off(p0), off(lerp3(B1, apex, 1 - u)), 0.09, 0.08, n);
        }
      });
    }
    m.scope("hip ribs", () => {
      for (const c of corners) {
        const d = unit(sub(apex, c));
        const n = unit([c[0], 0, c[2]]);
        beam(m, "steelRib", add(c, mul(n, 0.05)), add(sub(apex, mul(d, 0.3)), mul(n, 0.05)), 0.26, 0.22, add(n, [0, 1, 0]));
      }
    });
    m.scope("apex node", () => {
      m.loft("steelRib", rect(0.84, 0.84), 21.72, rect(0.5, 0.5), 22.3, false);
      m.spire("steelRib", rect(0.5, 0.5), 22.3, 22.56);
    });
  });
  return m;
}

// --- the White House ----------------------------------------------------------------

/** The bays of the main block's north and south fronts: eleven, 4.3 m apart. */
const WH_BAYS = [-21.5, -17.2, -12.9, -8.6, -4.3, 0, 4.3, 8.6, 12.9, 17.2, 21.5];
/** The bays of the east and west ends: five. */
const WH_END_BAYS = [-9.2, -4.6, 0, 4.6, 9.2];
/** The three storeys of windows: [bottom, top] of the surround. */
const WH_ROWS: Array<[number, number]> = [[1.2, 4.8], [6.25, 10.55], [11.3, 14.5]];

/**
 * A window on a wall facing `face` (radians about +Y, 0 = +Z), its centre on the
 * wall face at (cx, cz): a white surround, the dark sash, a cross of muntins,
 * a sill and, on the main floor, a lintel with a triangular or segmental pediment.
 */
function whWindow(m: MeshBuilder, cx: number, cz: number, face: number, y0: number, y1: number, w: number, crown: "none" | "lintel" | "triangle" | "segment"): void {
  const fx = Math.sin(face);
  const fz = Math.cos(face);
  const at = (d: number): [number, number] => [cx + fx * d, cz + fz * d];
  const ry = face;
  const box = (mat: string, w2: number, d0: number, d1: number, a: number, b: number, top = true): void => {
    const [x, z] = at((d0 + d1) / 2);
    m.box(mat, x, z, w2, d1 - d0, a, b, ry, top);
  };
  m.scope("window", () => {
    box("trim", w, -0.1, 0.22, y0, y1);
    box("windowGlass", w - 0.7, -0.05, 0.27, y0 + 0.35, y1 - 0.35);
    box("trim", 0.08, -0.1, 0.31, y0 + 0.36, y1 - 0.36);
    const ym = (y0 + y1) / 2;
    box("trim", w - 0.72, -0.1, 0.31, ym - 0.04, ym + 0.04);
    box("trim", w + 0.4, -0.1, 0.4, y0 - 0.17, y0 + 0.03);
    if (crown !== "none") {
      box("trim", w + 0.6, -0.1, 0.45, y1 + 0.07, y1 + 0.33);
      const yb = y1 + 0.33;
      const hw = (w + 0.6) / 2;
      const ux = Math.cos(face);
      const uz = -Math.sin(face);
      const pt = (s: number, y: number, d: number): Vec3 => [cx + ux * s + fx * d, y, cz + uz * s + fz * d];
      if (crown === "triangle") {
        m.slab("trim", [pt(-hw, yb, 0.45), pt(hw, yb, 0.45), pt(0, yb + 0.72, 0.45)], [-fx * 0.55, 0, -fz * 0.55]);
      } else if (crown === "segment") {
        const pts: Vec3[] = [];
        for (let i = 0; i <= 8; i++) {
          const a = Math.PI - (i / 8) * Math.PI;
          pts.push(pt(hw * Math.cos(a), yb + 0.55 * Math.sin(a), 0.45));
        }
        m.slab("trim", pts, [-fx * 0.55, 0, -fz * 0.55]);
      }
    }
  });
}

/** A balustrade from a to b (same height): bottom rail, square balusters, top rail. */
function balustrade(m: MeshBuilder, a: Vec3, b: Vec3, h = 1.5, pitch = 0.72): void {
  m.scope("balustrade", () => {
    const y = a[1];
    beam(m, "trim", [a[0], y, a[2]], [b[0], y, b[2]], 0.62, 0.2, [0, 1, 0]);
    // beams' sections are centred on the axis: lift them by half their depth
    const lift = (p: Vec3, dy: number): Vec3 => [p[0], p[1] + dy, p[2]];
    const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const n = Math.max(1, Math.round(len / pitch));
    for (let i = 0; i <= n; i++) {
      const p = lerp3(a, b, i / n);
      m.box("trim", p[0], p[2], 0.22, 0.22, y + 0.1, y + h - 0.32, Math.atan2(b[0] - a[0], b[2] - a[2]), false);
    }
    beam(m, "trim", lift(a, h - 0.2), lift(b, h - 0.2), 0.74, 0.24, [0, 1, 0]);
  });
}

/** A balustrade along a polyline. */
function balustradeAlong(m: MeshBuilder, pts: Vec3[], h = 1.5): void {
  for (let i = 0; i + 1 < pts.length; i++) balustrade(m, pts[i]!, pts[i + 1]!, h);
}

/** The points of an arc about (cx, cz) of radius r, from angle a0 to a1 (0 = +X, pi/2 = +Z). */
function arcPts(cx: number, cz: number, r: number, a0: number, a1: number, n: number, y: number): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]);
  }
  return pts;
}

/** A low wing with its colonnade and the end pavilion, on the +X side when s = 1. */
function whWing(m: MeshBuilder, s: number): void {
  const X = (a: number, b: number): [number, number] => (s > 0 ? [a, b] : [-b, -a]);
  m.scope(s > 0 ? "east wing" : "west wing", () => {
    m.scope("block", () => {
      span(m, "aquia", ...X(26.0, 45.0), 0, 5.4, -7.25, 1.25, false);
      cube(m, "trim", ...X(25.6, 45.4), 5.4, 5.9, -7.65, 1.65);
      // windows on the south side
      for (let k = 0; k < 6; k++) whWindow(m, s * (28.6 + 2.9 * k), 1.25, 0, 1.4, 4.2, 1.6, "none");
    });
    m.scope("colonnade", () => {
      for (let k = 0; k < 7; k++) ionicColumn(m, s * (28.4 + 2.6 * k), -7.75, 0.42, 0, 4.9, Math.PI);
      cube(m, "trim", ...X(26.0, 45.0), 4.9, 5.4, -8.55, -7.25, false);
      span(m, "trim", ...X(26.0, 45.0), 4.9, 5.8, -8.55, -7.65);
      // the colonnade's ceiling
      const [a, b] = X(26.0, 45.0);
      m.cap("trim", rect(b - a, 1.3, (a + b) / 2, -7.9), 4.9, false);
      // french doors behind the colonnade
      for (let k = 0; k < 6; k++) whWindow(m, s * (29.7 + 2.6 * k), -7.25, Math.PI, 0.3, 3.9, 1.5, "none");
    });
    m.scope("balustrade", () => {
      const [a, b] = X(26.4, 44.6);
      balustrade(m, [a, 5.9, -7.25], [b, 5.9, -7.25], 1.5);
    });
    m.scope("pavilion", () => {
      span(m, "aquia", ...X(45.0, 54.2), 0, 7.8, -8.75, 2.75, false);
      cube(m, "trim", ...X(44.6, 54.6), 7.8, 8.3, -9.15, 3.15);
      for (let k = 0; k < 3; k++) {
        const x = s * (47.0 + 2.6 * k);
        whWindow(m, x, -8.75, Math.PI, 1.7, 5.1, 2.3, "lintel");
        whWindow(m, x, 2.75, 0, 1.7, 5.1, 2.3, "lintel");
      }
      whWindow(m, s * 54.2, -3.0, s * Math.PI / 2, 1.7, 5.1, 2.3, "lintel");
    });
  });
}

export function whiteHouse(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("white house", () => {
    m.scope("terrace", () => span(m, "aquia", -28.25, 28.25, 0, 0.75, -15.25, 15.25));
    m.scope("residence", () => {
      m.scope("walls", () => {
        span(m, "aquia", -26.0, 26.0, 0.75, 15.4, -13.0, 13.0, false);
        span(m, "aquia", -26.25, 26.25, 0.75, 5.3, -13.25, 13.25, false);
        cube(m, "trim", -26.45, 26.45, 5.3, 5.68, -13.45, 13.45, false);
        // corner pilasters
        for (const x of [-25.6, 25.6]) for (const z of [-12.6, 12.6]) span(m, "aquia", x - 0.8, x + 0.8, 5.68, 15.4, z - 0.6, z + 0.6, false);
      });
      m.scope("south bow", () => {
        m.prism("aquia", bowRing(9.0, 0, 9.0, 24), 0.75, 15.4, false);
        m.prism("aquia", bowRing(9.25, 0, 9.0, 24), 0.75, 5.3, false);
        m.prism("trim", bowRing(9.45, 0, 9.0, 24, 0.4), 5.3, 5.68, false);
      });
      m.scope("cornice", () => {
        cube(m, "trim", -26.8, 26.8, 15.4, 16.5, -13.8, 13.8);
      });
      m.scope("roof", () => {
        span(m, "leadRoof", -25.8, 25.8, 16.5, 16.8, -12.8, 12.8);
      });
      m.scope("roof balustrade", () => {
        const y = 16.5;
        const e = 26.4;
        const n = -13.4;
        const sZ = 13.4;
        balustradeAlong(m, [[-8.6, y, sZ], [-e, y, sZ], [-e, y, n], [e, y, n], [e, y, sZ], [8.6, y, sZ]]);
        balustradeAlong(m, arcPts(0, 9.0, 9.4, Math.PI - 0.32, 0.32, 10, y).reverse());
      });
      m.scope("chimneys", () => {
        for (const x of [-21.0, -12.5, 12.5, 21.0]) {
          for (const z of [-7.5, 7.5]) {
            span(m, "aquia", x - 1.0, x + 1.0, 16.8, 19.7, z - 0.68, z + 0.68);
            cube(m, "trim", x - 1.23, x + 1.23, 19.7, 20.04, z - 0.9, z + 0.9);
          }
        }
      });
      m.scope("windows", () => {
        WH_ROWS.forEach(([y0, y1], row) => {
          const w = row === 0 ? 2.46 : 2.6;
          const crown = (k: number): "none" | "lintel" | "triangle" | "segment" => (row === 1 ? (k % 2 === 0 ? "triangle" : "segment") : row === 2 ? "lintel" : "none");
          WH_BAYS.forEach((x, k) => {
            if (!(row === 0 && x === 0)) whWindow(m, x, -13.0, Math.PI, y0, y1, w, crown(k));
            if (Math.abs(x) > 10) whWindow(m, x, 13.0, 0, y0, y1, w, crown(k));
          });
          WH_END_BAYS.forEach((z, k) => {
            whWindow(m, 26.0, z, Math.PI / 2, y0, y1, w, crown(k));
            whWindow(m, -26.0, z, -Math.PI / 2, y0, y1, w, crown(k));
          });
          for (let k = 0; k < 5; k++) {
            const a = Math.PI / 2 + (k - 2) * 0.62;
            whWindow(m, 9.0 * Math.cos(a), 9.0 + 9.0 * Math.sin(a), Math.PI / 2 - a, y0, y1, w, row === 0 ? "none" : "lintel");
          }
        });
      });
    });
    m.scope("north portico", () => {
      span(m, "aquia", -9.2, 9.2, 0, 0.75, -20.0, -13.0);
      for (const [k, x] of [-7.0, -2.35, 2.35, 7.0].entries()) m.scope(`column ${k + 1}`, () => ionicColumn(m, x, -18.7, 0.82, 0.75, 14.15, Math.PI));
      for (const x of [-7.0, 7.0]) span(m, "trim", x - 0.75, x + 0.75, 0.75, 14.15, -14.05, -13.0, false);
      cube(m, "trim", -9.2, 9.2, 14.15, 15.85, -20.0, -13.0);
      cube(m, "trim", -9.8, 9.8, 15.85, 16.21, -20.3, -12.9);
      m.scope("pediment", () => {
        m.slab("trim", [[-9.8, 16.21, -20.6], [9.8, 16.21, -20.6], [0, 19.31, -20.6]], [0, 0, 7.6]);
        m.slab("aquia", [[-8.6, 16.45, -20.64], [8.6, 16.45, -20.64], [0, 18.95, -20.64]], [0, 0, 0.1]);
      });
      m.scope("door", () => {
        span(m, "trim", -2.0, 2.0, 0.75, 5.9, -13.44, -13.0);
        span(m, "windowGlass", -1.45, 1.45, 0.75, 4.3, -13.64, -13.4);
        m.slab("windowGlass", arcPts(0, 0, 1.55, Math.PI, 0, 8, 0).map(([x, , y]): Vec3 => [x, 4.42 + Math.abs(y), -13.5]), [0, 0, 0.1]);
      });
      m.scope("lantern", () => {
        rod(m, "windowGlass", [0, 15.85, -16.5], [0, 13.2, -16.5], 0.03, 4);
        m.prism("windowGlass", circle(8, 0.45, 0, -16.5), 11.8, 13.2);
      });
    });
    m.scope("south portico", () => {
      m.scope("ground arcade", () => {
        for (let k = 0; k < 7; k++) {
          const a = Math.PI / 2 + (k - 3) * 0.42;
          const x = 11.6 * Math.cos(a);
          const z = 9.0 + 11.6 * Math.sin(a);
          m.box("aquia", x, z, 1.4, 1.4, 0.75, 4.34, Math.PI / 2 - a, false);
        }
      });
      m.scope("terrace", () => {
        m.prism("aquia", bowRing(12.1, 0, 9.0, 28), 4.34, 4.9);
        m.cap("aquia", bowRing(12.1, 0, 9.0, 28), 4.34, false);
        balustradeAlong(m, arcPts(0, 9.0, 11.75, Math.PI, Math.PI / 2 + 1.12, 4, 4.9));
        balustradeAlong(m, arcPts(0, 9.0, 11.75, Math.PI / 2 - 1.12, 0, 4, 4.9));
      });
      m.scope("stairs", () => {
        // the two flights down from the terrace on either side of the bow
        for (const s of [-1, 1]) {
          for (let i = 0; i < 7; i++) {
            const y = 0.75 + (i + 1) * ((4.34 - 0.75) / 8);
            const [a, b] = [12.1 + i * 0.45, 14.0 + i * 0.45];
            span(m, "aquia", s > 0 ? a : -b, s > 0 ? b : -a, 0.75, y, 10.0, 12.6);
          }
        }
      });
      m.scope("columns", () => {
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 2 + (k - 2.5) * 0.36;
          const x = 10.7 * Math.cos(a);
          const z = 9.0 + 10.7 * Math.sin(a);
          m.scope(`column ${k + 1}`, () => ionicColumn(m, x, z, 0.74, 4.9, 15.15, Math.PI / 2 - a));
        }
      });
      m.scope("truman balcony", () => {
        m.prism("trim", bowRing(11.55, 0, 9.0, 28, 0.4), 10.29, 10.71);
        m.cap("trim", bowRing(11.55, 0, 9.0, 28, 0.4), 10.29, false);
        balustradeAlong(m, arcPts(0, 9.0, 11.2, Math.PI - 0.08, 0.08, 14, 10.71), 1.3);
      });
      m.scope("entablature", () => {
        m.prism("trim", bowRing(12.05, 0, 9.0, 28, 0.4), 15.15, 16.65, false);
        m.cap("trim", bowRing(12.05, 0, 9.0, 28, 0.4), 15.15, false);
        m.prism("trim", bowRing(12.45, 0, 9.0, 28, 0.4), 16.65, 17.06);
        m.cap("trim", bowRing(12.45, 0, 9.0, 28, 0.4), 16.65, false);
        balustradeAlong(m, arcPts(0, 9.0, 12.0, Math.PI - 0.05, 0.05, 14, 17.06), 1.3);
      });
    });
    whWing(m, -1);
    whWing(m, 1);
  });
  return m;
}

/** The catalog fields of the family (meta.json, catalog.ts); a design may override the scale. */
export const LANDMARK_CATALOG: CatalogFields = {
  category: "Historical",
  group: "hist_center",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Every design of the family, by catalog id; `references` is the folder of its source photos under assets/. */
export const LANDMARKS: ProceduralDesign[] = [
  { id: "bld-brandenburg-gate", title: "Brandenburg Gate", build: brandenburgGate, buildLod: brandenburgGateLod, references: "brandenburg-gate", catalog: LANDMARK_CATALOG },
  { id: "bld-louvre-pyramid", title: "Louvre Pyramid", build: louvrePyramid, references: "louvre-pyramid", catalog: LANDMARK_CATALOG },
  { id: "bld-white-house", title: "White House", build: whiteHouse, references: "white-house", catalog: LANDMARK_CATALOG },
];

export function brandenburgGateLod(): MeshBuilder {
  const m=new MeshBuilder(PALETTE);
  for(const x of GATE_PIERS) lodBox(m,'sandstone',x,0,1.66,7.1,1.25,14.63);
  lodBox(m,'sandstone',0,0,34.9,9.5,14.63,18.28);
  lodBox(m,'sandstone',0,0,30.8,7.9,18.28,22.9);
  for(const s of [-1,1])lodBox(m,'sandstone',s*25.1,0,15,5.7,0,11);
  return m;
}
