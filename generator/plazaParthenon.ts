// The Parthenon on the Athenian Acropolis, shown complete - as built in 438 BC and
// as the full-scale replica in Nashville's Centennial Park stands today - so it reads
// as a temple on a city square, not as a ruin. A plaza landmark
// (docs/models/plaza-landmarks.md).
//
// Real dimensions: the stylobate is 69.5 x 30.9 m on a three-step crepidoma; the
// peristyle has 8 x 17 Doric columns (46 in all), 10.43 m tall with a lower diameter
// of 1.905 m (1.948 m at the corners), 20 flutes, tapered with a little entasis, and
// the corner bays contracted (3.68 m against 4.30 m). The entablature carries the
// architrave, the triglyph-and-metope frieze and the cornice with its mutules; low
// pediments with their sculpture groups close both short ends under a marble tiled
// roof. Inside the colonnade stand the cella walls with the six-column prostyle
// porches at both ends, the Ionic frieze along the top of the cella and the great
// bronze doors.
//
// Modelled in metres, +Y up, the base of the lowest step at y = 0, centred on the
// stylobate's footprint. The long axis runs along X and the east front (the main
// entrance) faces +X.
//
// Sources: Wikipedia "Parthenon" and "Parthenon (Nashville)", the photographs in
// assets/parthenon/ (SOURCES.md). Deterministic: the same code gives the same bytes.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  marble: { color: "#e6dcc8", roughness: 0.85 },
  marbleShade: { color: "#c9bb9f", roughness: 0.9 },
  marbleLight: { color: "#f0e9da", roughness: 0.8 },
  roofTile: { color: "#d8ccb4", roughness: 0.85 },
  triglyph: { color: "#4f5a66", roughness: 0.8 },
  paintBlue: { color: "#7d93a6", roughness: 0.8 },
  bronze: { color: "#6e5434", metallic: 0.5, roughness: 0.5 },
};

// --- helpers -----------------------------------------------------------------------

/** A box() given by its spans; no underside. */
function span(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1, 0, top);
}

/** A closed box spanning x0..x1, y0..y1, z0..z1 (with its underside), `top` optional. */
function cube(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  const r = rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);
  m.prism(mat, r, y0, y1, top);
  m.cap(mat, r, y0, false);
}

/** A circle of n points about (cx, cz). */
const circle = (n: number, r: number, cx = 0, cz = 0): Ring => ngon(n, r, Math.PI / n, cx, cz);

/** A fluted shaft section: 2n points alternating between the arris radius r and the flute bottom. */
function fluted(n: number, r: number, cx: number, cz: number, depth = 0.055): Ring {
  const ring: Ring = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = (i / (2 * n)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * (1 - depth);
    ring.push([cx + rr * Math.cos(a), cz - rr * Math.sin(a)]);
  }
  return ring;
}

/**
 * A Greek Doric column standing on y0 with its abacus top at yTop: a shaft of 20
 * flutes tapering from r to 0.78 r with a slight entasis (`segs` lofts), the
 * flaring echinus and the square abacus.
 */
function doricColumn(m: MeshBuilder, cx: number, cz: number, r: number, y0: number, yTop: number, segs: number): void {
  m.scope("doric column", () => {
    const capH = 0.86 * (r / 0.95);
    const abH = 0.32 * (r / 0.95);
    const yShaft = yTop - capH;
    const rTop = r * 0.78;
    const entasis = 0.025 * (r / 0.95);
    const radius = (t: number): number => r + (rTop - r) * t + entasis * Math.sin(Math.PI * t);
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs;
      const t1 = (i + 1) / segs;
      m.loft("marble", fluted(20, radius(t0), cx, cz), y0 + (yShaft - y0) * t0, fluted(20, radius(t1), cx, cz), y0 + (yShaft - y0) * t1, false);
    }
    const yAb = yTop - abH;
    const yMid = yShaft + (yAb - yShaft) * 0.45;
    m.loft("marbleLight", circle(20, rTop * 0.97, cx, cz), yShaft, circle(20, rTop * 1.24, cx, cz), yMid, false);
    m.loft("marbleLight", circle(20, rTop * 1.24, cx, cz), yMid, circle(20, r * 1.04, cx, cz), yAb, false);
    const h = r * 1.08;
    cube(m, "marbleLight", cx - h, cx + h, yAb, yTop, cz - h, cz + h);
  });
}

// --- dimensions --------------------------------------------------------------------

const STEP_H = 0.5; // three steps of the crepidoma
const Y_STYLO = 3 * STEP_H; // top of the stylobate
const STYLO_X = 34.75; // the stylobate's half length (69.5 m)
const STYLO_Z = 15.45; // and half width (30.9 m)
const COL_H = 10.43;
const Y_COL = Y_STYLO + COL_H; // top of the abaci
const R_COL = 0.9525; // 1.905 m lower diameter
const R_CORNER = 0.974; // 1.948 m at the corners

/** The column axes along one side: two contracted corner bays and the rest at 4.30 m. */
function axes(n: number): number[] {
  const span = 2 * 3.68 + (n - 3) * 4.3;
  const out: number[] = [-span / 2];
  for (let i = 1; i < n; i++) out.push(out[i - 1]! + (i === 1 || i === n - 1 ? 3.68 : 4.3));
  return out;
}
const COL_X = axes(17); // +-33.78
const COL_Z = axes(8); // +-14.43
const AX = COL_X[COL_X.length - 1]!;
const AZ = COL_Z[COL_Z.length - 1]!;

// entablature
const ARCH_X = AX + 0.95; // the architrave's face
const ARCH_Z = AZ + 0.95;
const FR_X = ARCH_X - 0.08; // the metope plane
const FR_Z = ARCH_Z - 0.08;
const Y_ARCH = Y_COL + 1.35; // top of the architrave
const Y_FRIEZE = Y_ARCH + 1.35; // top of the frieze, the ceiling
const Y_GEISON = Y_FRIEZE + 0.62; // top of the horizontal cornice
const GEI_X = ARCH_X + 0.82; // the cornice's edge
const GEI_Z = ARCH_Z + 0.82;
const TRI_W = 0.84; // a triglyph's width

// pediment and roof
const SLOPE = Math.tan((13 * Math.PI) / 180);
const ROOF_T = 0.32; // the roof slab's thickness
const COS = 1 / Math.sqrt(1 + SLOPE * SLOPE);
const SIN = SLOPE * COS;
/** The roof's underside at distance |z| from the ridge. */
const yRoof = (z: number): number => Y_GEISON + (GEI_Z - Math.abs(z)) * SLOPE;
/** The roof's top surface. */
const yRoofTop = (z: number): number => yRoof(z) + ROOF_T / COS;
const ROOF_X = GEI_X + 0.2; // the roof's ends, over the raking cornice
const TYMP_X = FR_X; // the tympanum stands in the frieze plane

// cella
const CELLA_Z = 10.9; // outer face of the cella's long walls
const DOOR_X = 24.3; // the door walls (east and west)
const ANTA_X = 26.0; // the ends of the long walls
const PORCH_X = 28.6; // the axes of the prostyle porches
const CENT_X = 29.4; // the cella entablature's ends
const CENT_Z = 11.0;
const Y_INNER = Y_STYLO + 0.7; // top of the cella's two steps
const Y_PORCH = 11.6; // top of the porch columns, underside of the cella entablature
const Y_IONIC = 12.75; // the Ionic frieze, 1 m high

// --- parts -------------------------------------------------------------------------

function crepidoma(m: MeshBuilder): void {
  m.scope("crepidoma", () => {
    for (let i = 0; i < 3; i++) {
      const g = (2 - i) * 0.7;
      span(m, i === 2 ? "marble" : "marbleShade", -STYLO_X - g, STYLO_X + g, i * STEP_H, (i + 1) * STEP_H, -STYLO_Z - g, STYLO_Z + g);
    }
  });
}

function peristyle(m: MeshBuilder): void {
  m.scope("peristyle", () => {
    for (const x of COL_X) {
      for (const z of [-AZ, AZ]) {
        const corner = Math.abs(x) === AX;
        doricColumn(m, x, z, corner ? R_CORNER : R_COL, Y_STYLO, Y_COL, 3);
      }
    }
    for (const x of [-AX, AX]) for (const z of COL_Z.slice(1, -1)) doricColumn(m, x, z, R_COL, Y_STYLO, Y_COL, 3);
  });
}

/** A rectangular ring of four boxes between the outer half extents (ox, oz) and inner (ix, iz). */
function ring(m: MeshBuilder, mat: string, ox: number, oz: number, ix: number, iz: number, y0: number, y1: number, closed: boolean, top: boolean): void {
  const b = closed ? cube : span;
  for (const s of [-1, 1]) {
    b(m, mat, -ox, ox, y0, y1, s > 0 ? iz : -oz, s > 0 ? oz : -iz, top);
    b(m, mat, s > 0 ? ix : -ox, s > 0 ? ox : -ix, y0, y1, -iz, iz, top);
  }
}

/** The triglyph centres along one side: over every inner column, the bay middles, and the corners. */
function triglyphCentres(cols: number[], edge: number): number[] {
  const p = cols.slice();
  p[0] = -edge + TRI_W / 2;
  p[p.length - 1] = edge - TRI_W / 2;
  const out: number[] = [];
  for (let i = 0; i < p.length; i++) {
    out.push(p[i]!);
    if (i + 1 < p.length) out.push((p[i]! + p[i + 1]!) / 2);
  }
  return out;
}

function entablature(m: MeshBuilder): void {
  m.scope("entablature", () => {
    const depth = 1.95;
    m.scope("architrave", () => {
      ring(m, "marble", ARCH_X, ARCH_Z, ARCH_X - depth, ARCH_Z - depth, Y_COL, Y_ARCH - 0.1, true, false);
      // the taenia, the fillet that crowns the architrave
      ring(m, "marbleLight", ARCH_X + 0.05, ARCH_Z + 0.05, ARCH_X - depth, ARCH_Z - depth, Y_ARCH - 0.1, Y_ARCH, true, false);
    });
    m.scope("frieze", () => {
      ring(m, "marble", FR_X, FR_Z, ARCH_X - depth, ARCH_Z - depth, Y_ARCH, Y_FRIEZE, false, false);
      const tx = triglyphCentres(COL_X, FR_X);
      const tz = triglyphCentres(COL_Z, FR_Z);
      m.scope("triglyphs", () => {
        for (const s of [-1, 1]) {
          for (const x of tx.slice(1, -1)) span(m, "triglyph", x - TRI_W / 2, x + TRI_W / 2, Y_ARCH, Y_FRIEZE, s > 0 ? FR_Z - 0.1 : -ARCH_Z, s > 0 ? ARCH_Z : -FR_Z + 0.1, false);
          for (const z of tz.slice(1, -1)) span(m, "triglyph", s > 0 ? FR_X - 0.1 : -ARCH_X, s > 0 ? ARCH_X : -FR_X + 0.1, Y_ARCH, Y_FRIEZE, z - TRI_W / 2, z + TRI_W / 2, false);
          for (const t of [-1, 1]) {
            // the corner triglyph wraps both faces
            const x0 = s > 0 ? FR_X - TRI_W + 0.08 : -ARCH_X;
            const x1 = s > 0 ? ARCH_X : -FR_X + TRI_W - 0.08;
            const z0 = t > 0 ? FR_Z - TRI_W + 0.08 : -ARCH_Z;
            const z1 = t > 0 ? ARCH_Z : -FR_Z + TRI_W - 0.08;
            span(m, "triglyph", x0, x1, Y_ARCH, Y_FRIEZE, z0, z1, false);
          }
        }
      });
      m.scope("metopes", () => {
        // a sculpted group stands proud in every metope: a figure and its opponent
        const metope = (a: number, b: number, k: number, face: (u: number, v: number) => Vec3, out: Vec3): void => {
          const c = (a + b) / 2;
          const w = (b - a) * 0.36;
          const y0 = Y_ARCH + 0.12;
          const y1 = Y_FRIEZE - 0.1;
          const lean = (k % 3) - 1;
          m.slab("marbleLight", [face(c - w, y0), face(c + w * 0.2, y0), face(c + w * 0.1 + lean * 0.12, y1), face(c - w * 0.6 + lean * 0.12, y1 - 0.15)], out);
          m.slab("marbleLight", [face(c + w * 0.35, y0), face(c + w, y0), face(c + w * 0.8 - lean * 0.1, y1 - 0.25), face(c + w * 0.3 - lean * 0.1, y1 - 0.05)], out);
        };
        for (const s of [-1, 1]) {
          for (let i = 0; i + 1 < tx.length; i++) {
            const a = tx[i]! + TRI_W / 2 + 0.06;
            const b = tx[i + 1]! - TRI_W / 2 - 0.06;
            metope(a, b, i, (u, v) => [u, v, s * (FR_Z - 0.02)], [0, 0, s * 0.07]);
          }
          for (let i = 0; i + 1 < tz.length; i++) {
            const a = tz[i]! + TRI_W / 2 + 0.06;
            const b = tz[i + 1]! - TRI_W / 2 - 0.06;
            metope(a, b, i + 1, (u, v) => [s * (FR_X - 0.02), v, u], [s * 0.07, 0, 0]);
          }
        }
      });
      m.scope("mutules", () => {
        // a mutule under the cornice over every triglyph and metope
        for (const s of [-1, 1]) {
          for (const x of tx) cube(m, "marbleShade", x - 0.4, x + 0.4, Y_FRIEZE - 0.08, Y_FRIEZE, s > 0 ? FR_Z : -GEI_Z + 0.12, s > 0 ? GEI_Z - 0.12 : -FR_Z, false);
          for (const z of tz.slice(1, -1)) cube(m, "marbleShade", s > 0 ? FR_X : -GEI_X + 0.12, s > 0 ? GEI_X - 0.12 : -FR_X, Y_FRIEZE - 0.08, Y_FRIEZE, z - 0.4, z + 0.4, false);
        }
      });
    });
    m.scope("cornice", () => {
      ring(m, "marble", GEI_X, GEI_Z, ARCH_X - depth, ARCH_Z - depth, Y_FRIEZE, Y_GEISON, true, true);
    });
  });
}

function pediments(m: MeshBuilder): void {
  m.scope("attic and ceiling", () => {
    // the solid under the roof: its underside is the ceiling of the colonnade, its
    // ends the tympana (hidden behind their painted faces)
    const top = (z: number): number => yRoof(z) + 0.05;
    const section: Ring = [[-ARCH_Z, Y_FRIEZE], [ARCH_Z, Y_FRIEZE], [ARCH_Z, top(ARCH_Z)], [0, top(0)], [-ARCH_Z, top(ARCH_Z)]];
    m.sweep("marble", "x", section, -TYMP_X + 0.05, section, TYMP_X - 0.05);
  });
  for (const s of [-1, 1]) {
    m.scope(s > 0 ? "east pediment" : "west pediment", () => {
      const zb = GEI_Z - 0.3 / SLOPE; // where the tympanum's top meets the cornice
      m.scope("tympanum", () => {
        m.slab("paintBlue", [[s * TYMP_X, Y_GEISON, -zb], [s * TYMP_X, Y_GEISON, zb], [s * TYMP_X, yRoof(0) - 0.3, 0]], [-s * 0.05, 0, 0]);
      });
      m.scope("raking cornice", () => {
        for (const t of [-1, 1]) {
          const ze = t * GEI_Z;
          m.slab("marble", [[s * (TYMP_X - 0.1), yRoof(0) + 0.05, 0], [s * (TYMP_X - 0.1), yRoof(0) - 0.45, 0], [s * (TYMP_X - 0.1), yRoof(ze) - 0.45, ze], [s * (TYMP_X - 0.1), yRoof(ze) + 0.05, ze]], [s * (GEI_X - TYMP_X + 0.1), 0, 0]);
        }
      });
      m.scope("sculpture", () => {
        // the groups stand on the cornice: tall figures in the middle, seated and
        // reclining ones toward the corners, horses' heads in the angles
        const x0 = s * (TYMP_X + 0.02);
        const y0 = Y_GEISON;
        const room = (z: number): number => yRoof(z) - 0.45 - Y_GEISON - 0.08;
        // [z as a fraction of the half width, kind]: the birth of Athena in the east,
        // her contest with Poseidon in the west; Helios' and Selene's horses in the angles
        const groups: Array<[number, "stand" | "seat" | "recline" | "horse"]> = s > 0
          ? [[-0.8, "horse"], [-0.68, "recline"], [-0.53, "seat"], [-0.42, "seat"], [-0.29, "stand"], [-0.15, "stand"], [-0.04, "seat"], [0.07, "stand"], [0.18, "stand"], [0.31, "stand"], [0.44, "seat"], [0.56, "seat"], [0.69, "recline"], [0.8, "horse"]]
          : [[-0.8, "recline"], [-0.66, "recline"], [-0.52, "seat"], [-0.39, "stand"], [-0.25, "horse"], [-0.12, "stand"], [0.0, "stand"], [0.12, "stand"], [0.25, "horse"], [0.39, "stand"], [0.52, "seat"], [0.66, "recline"], [0.8, "recline"]];
        const toward = (z: number): number => (z > 0 ? -1 : 1); // toward the middle
        for (const [u, kind] of groups) {
          const z = u * 15.0;
          const t = toward(z);
          if (kind === "horse") {
            // a horse's head and neck rising from the corner, the muzzle toward the middle
            const h = Math.min(room(z + 0.9 * -t) * 0.95, 2.3);
            const P = (a: number, y: number): Vec3 => [x0, y0 + y, z + t * a];
            m.slab("marbleLight", [P(-0.45, 0), P(0.45, 0), P(0.55, h * 0.75), P(0.2, h), P(-0.35, h * 0.85)], [s * 0.7, 0, 0]);
            continue;
          }
          const w = kind === "recline" ? 2.0 : kind === "seat" ? 1.2 : 0.8;
          const r = room(Math.abs(z) + w / 2);
          if (r < 0.4) continue;
          const head = kind === "recline" ? 0.3 : 0.38;
          const h = (kind === "stand" ? Math.min(r * 0.92, 3.1) : kind === "seat" ? Math.min(r * 0.92, 2.2) : Math.min(r * 0.92, 1.1)) - head;
          // the torso: low toward the angle, raised toward the middle for a reclining figure
          const lo = kind === "recline" ? h * 0.45 : h * 0.8;
          const P = (a: number, y: number): Vec3 => [x0, y0 + y, z + t * a];
          const pts: Vec3[] = [P(-w / 2, 0), P(w / 2, 0), P(w * 0.32, h), P(w * 0.12, h), P(-w * 0.32, lo)];
          m.slab("marbleLight", pts, [s * 0.7, 0, 0]);
          const hz = kind === "recline" ? z + t * w * 0.3 : z;
          const hy = y0 + (kind === "recline" ? lo + (h - lo) * 0.9 : h);
          cube(m, "marbleLight", s > 0 ? x0 + 0.15 : x0 - 0.45, s > 0 ? x0 + 0.45 : x0 - 0.15, hy - 0.04, hy + head, hz - 0.15, hz + 0.15);
        }
      });
    });
  }
}

function roof(m: MeshBuilder): void {
  m.scope("roof", () => {
    for (const t of [-1, 1]) {
      m.scope(t > 0 ? "north slope" : "south slope", () => {
        const n: Vec3 = [0, COS, t * SIN];
        const ze = t * GEI_Z;
        m.slab("roofTile", [[-ROOF_X, yRoof(ze), ze], [ROOF_X, yRoof(ze), ze], [ROOF_X, yRoof(0), 0], [-ROOF_X, yRoof(0), 0]], [n[0] * ROOF_T, n[1] * ROOF_T, n[2] * ROOF_T]);
        // the cover-tile ribs down the slope, an antefix at the foot of each
        const zt = t * (GEI_Z + ROOF_T * SIN); // the top edge of the eave
        const yt = yRoof(GEI_Z) + ROOF_T * COS;
        const zr = t * 0.25;
        const yr = yRoofTop(0.25);
        const count = 50;
        for (let i = 0; i < count; i++) {
          const x = -ROOF_X + 0.7 + ((2 * ROOF_X - 1.4) * i) / (count - 1);
          m.scope("rib", () => {
            m.slab("marbleLight", [[x - 0.12, yt, zt], [x + 0.12, yt, zt], [x, yt + 0.13, zt]], [0, yr - yt, zr - zt]);
          });
          m.scope("antefix", () => {
            m.slab("marbleLight", [[x - 0.17, yt - 0.02, zt], [x + 0.17, yt - 0.02, zt], [x, yt + 0.4, zt]], [0, 0, -t * 0.07]);
          });
        }
      });
    }
    m.scope("ridge", () => span(m, "marbleLight", -ROOF_X - 0.05, ROOF_X + 0.05, yRoofTop(0) - 0.2, yRoofTop(0) + 0.1, -0.25, 0.25));
    m.scope("acroteria", () => {
      // a palmette over each apex, a smaller one at each corner
      for (const s of [-1, 1]) {
        const x = s * (ROOF_X - 0.3);
        const y = yRoofTop(0) + 0.1;
        m.slab("marbleLight", [[x, y, -0.6], [x, y, 0.6], [x, y + 0.75, 0.75], [x, y + 1.25, 0.35], [x, y + 1.35, 0], [x, y + 1.25, -0.35], [x, y + 0.75, -0.75]], [s * 0.25, 0, 0]);
        for (const t of [-1, 1]) {
          const z = t * (GEI_Z - 0.5);
          const yc = yRoofTop(GEI_Z - 0.5) - 0.05;
          m.slab("marbleLight", [[x, yc, z - 0.4], [x, yc, z + 0.4], [x, yc + 0.6, z + 0.35], [x, yc + 0.85, z], [x, yc + 0.6, z - 0.35]], [s * 0.25, 0, 0]);
        }
      }
    });
  });
}

function cella(m: MeshBuilder): void {
  m.scope("cella", () => {
    m.scope("steps", () => {
      span(m, "marbleShade", -CENT_X - 1.1, CENT_X + 1.1, Y_STYLO, Y_STYLO + 0.35, -CENT_Z - 0.9, CENT_Z + 0.9);
      span(m, "marble", -CENT_X - 0.7, CENT_X + 0.7, Y_STYLO + 0.35, Y_INNER, -CENT_Z - 0.5, CENT_Z + 0.5);
    });
    m.scope("walls", () => {
      span(m, "marble", -DOOR_X, DOOR_X, Y_INNER, Y_PORCH, -CELLA_Z, CELLA_Z, false);
      // the long walls run on as antae to the porches
      for (const s of [-1, 1]) {
        for (const t of [-1, 1]) {
          span(m, "marble", s > 0 ? DOOR_X : -ANTA_X, s > 0 ? ANTA_X : -DOOR_X, Y_INNER, Y_PORCH, t > 0 ? CELLA_Z - 1.2 : -CELLA_Z, t > 0 ? CELLA_Z : -CELLA_Z + 1.2, false);
          // the anta capital
          span(m, "marbleLight", s > 0 ? ANTA_X - 0.6 : -ANTA_X - 0.08, s > 0 ? ANTA_X + 0.08 : -ANTA_X + 0.6, Y_PORCH - 0.45, Y_PORCH, t > 0 ? CELLA_Z - 1.28 : -CELLA_Z - 0.08, t > 0 ? CELLA_Z + 0.08 : -CELLA_Z + 1.28, false);
        }
      }
    });
    m.scope("doors", () => {
      for (const s of [-1, 1]) {
        const w = s > 0 ? 2.45 : 2.1; // the east door is the great one
        const yTop = s > 0 ? 10.4 : 9.6;
        const xf = s * DOOR_X;
        const out = (a: number): [number, number] => (s > 0 ? [xf, xf + a] : [xf - a, xf]);
        // the frame stands 0.2 m proud, the bronze leaves 0.04 m
        span(m, "marbleLight", ...out(0.2), Y_INNER, yTop, w, w + 0.6);
        span(m, "marbleLight", ...out(0.2), Y_INNER, yTop, -w - 0.6, -w);
        span(m, "marbleLight", ...out(0.28), yTop, yTop + 0.7, -w - 0.9, w + 0.9);
        span(m, "bronze", ...out(0.04), Y_INNER, yTop, -w, w);
        for (const z of [-w / 2, w / 2]) {
          for (const y of [Y_INNER + 1.2, Y_INNER + (yTop - Y_INNER) / 2 + 0.3]) {
            span(m, "bronze", ...out(0.09), y, y + (yTop - Y_INNER) / 2 - 1.6, z - w * 0.38, z + w * 0.38);
          }
        }
      }
    });
    m.scope("prostyle porches", () => {
      for (const s of [-1, 1]) {
        for (let i = 0; i < 6; i++) doricColumn(m, s * PORCH_X, -9.25 + 3.7 * i, 0.82, Y_INNER, Y_PORCH, 2);
      }
    });
    m.scope("entablature", () => {
      cube(m, "marble", -CENT_X, CENT_X, Y_PORCH, Y_FRIEZE, -CENT_Z, CENT_Z, false);
      span(m, "marbleLight", -CENT_X - 0.05, CENT_X + 0.05, Y_IONIC - 0.15, Y_IONIC, -CENT_Z - 0.05, CENT_Z + 0.05, false);
    });
    m.scope("ionic frieze", () => {
      // the Panathenaic procession: a painted band with riders and walkers in relief
      const y0 = Y_IONIC;
      const y1 = Y_IONIC + 1.0;
      const d = 0.08;
      for (const s of [-1, 1]) {
        span(m, "paintBlue", -CENT_X - d, CENT_X + d, y0, y1, s > 0 ? CENT_Z : -CENT_Z - d, s > 0 ? CENT_Z + d : -CENT_Z, false);
        span(m, "paintBlue", s > 0 ? CENT_X : -CENT_X - d, s > 0 ? CENT_X + d : -CENT_X, y0, y1, -CENT_Z, CENT_Z, false);
        const fig = (k: number): [number, number] => (k % 3 === 0 ? [0.62, 0.82] : [0.34, 0.74]);
        for (let k = 0; k < 42; k++) {
          const x = -CENT_X + 0.9 + k * ((2 * CENT_X - 1.8) / 41);
          const [w, h] = fig(k);
          span(m, "marbleLight", x - w / 2, x + w / 2, y0 + 0.1, y0 + 0.1 + h, s > 0 ? CENT_Z + d - 0.01 : -CENT_Z - d - 0.06, s > 0 ? CENT_Z + d + 0.06 : -CENT_Z - d + 0.01);
        }
        for (let k = 0; k < 15; k++) {
          const z = -CENT_Z + 0.8 + k * ((2 * CENT_Z - 1.6) / 14);
          const [w, h] = fig(k + 1);
          span(m, "marbleLight", s > 0 ? CENT_X + d - 0.01 : -CENT_X - d - 0.06, s > 0 ? CENT_X + d + 0.06 : -CENT_X - d + 0.01, y0 + 0.1, y0 + 0.1 + h, z - w / 2, z + w / 2);
        }
      }
    });
  });
}

export function parthenon(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("parthenon", () => {
    crepidoma(m);
    cella(m);
    peristyle(m);
    entablature(m);
    pediments(m);
    roof(m);
  });
  return m;
}

export function parthenonLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  lodBox(m, "marbleShade", 0, 0, 2 * (STYLO_X + 1.4), 2 * (STYLO_Z + 1.4), 0, Y_STYLO);
  // the colonnade as square posts, the cella behind them
  const post = (x: number, z: number): void => m.prism("marble", rect(1.7, 1.7, x, z), Y_STYLO, Y_COL, false);
  for (const x of COL_X) for (const z of [-AZ, AZ]) post(x, z);
  for (const x of [-AX, AX]) for (const z of COL_Z.slice(1, -1)) post(x, z);
  m.prism("marbleShade", rect(2 * CENT_X, 2 * CENT_Z), Y_STYLO, Y_COL, false);
  // the entablature with its dark frieze band, the cornice and the roof
  lodBox(m, "marble", 0, 0, 2 * ARCH_X, 2 * ARCH_Z, Y_COL, Y_ARCH);
  m.prism("marbleShade", rect(2 * FR_X, 2 * FR_Z), Y_ARCH, Y_FRIEZE, false);
  m.prism("marble", rect(2 * GEI_X, 2 * GEI_Z), Y_FRIEZE, Y_GEISON);
  m.cap("marble", rect(2 * GEI_X, 2 * GEI_Z), Y_FRIEZE, false);
  const yTop = yRoofTop(0) + 0.1;
  const sec: Ring = [[-GEI_Z - 0.05, Y_GEISON + 0.02], [GEI_Z + 0.05, Y_GEISON + 0.02], [0, yTop]];
  m.sweep("roofTile", "x", sec, -ROOF_X, sec, ROOF_X);
  // the painted tympana, just proud of the roof's ends
  for (const s of [-1, 1]) {
    const x = s * (ROOF_X + 0.05);
    m.slab("paintBlue", [[x, Y_GEISON + 0.3, -GEI_Z + 1.6], [x, Y_GEISON + 0.3, GEI_Z - 1.6], [x, yTop - 0.6, 0]], [-s * 0.05, 0, 0]);
  }
  return m;
}

export const PARTHENON: ProceduralDesign[] = [
  {
    id: "bld-parthenon",
    game: { plaza: { cities: ["city"], layouts: ["rect"], fit: "footprint" } },
    title: "Parthenon",
    build: parthenon,
    buildLod: parthenonLod,
    references: "parthenon",
    catalog: PLAZA_CATALOG,
  },
];
