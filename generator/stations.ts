// The station buildings, modelled on the photos in assets/: Prague main station
// (the Fanta building), a yellow-ochre stucco station with a long platform canopy,
// the Mikulasovice halt and a red-brick suburban station. Each is a function that
// builds the model from boxes, slabs and lofts (meshBuilder.ts); `pnpm build` runs
// them (generate.ts) and writes ordinary GLBs, thumbnails and the meta entries.
// See docs/models/stations.md.
//
// Each design reproduces the hand-authored GLB of the same name in the webapp's
// model database (rail-island-webapp db/buildings/glb/): the same axes (the
// platform or street front faces +Z, the long side runs along X, base at y = 0),
// about the same bounding box (test/referenceModels.test.ts), the same colours --
// with the detail of the source photos the reference lacks.
//
// Modelled in metres. Every design is deterministic: the same code gives the same
// bytes, which the game's LOD proxy cache keys on. The ids are stored in the
// game's saved maps, so a design is never renamed once shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { arc, block } from "./vehicleParts.ts";
import { pragueMainStationLod, stationBuildingLod, stationHaltLod, suburbanStationLod } from "./lodStations.ts";
export { pragueMainStationLod, stationBuildingLod, stationHaltLod, suburbanStationLod } from "./lodStations.ts";
import type { CatalogFields, ProceduralDesign } from "./design.ts";

// --- walls -----------------------------------------------------------------------
//
// A facade element is a block standing on a wall: `u` runs along the wall, `y` up
// and `d` out of it (d = 0 is the wall's face). Layers of one element (a window's
// glass, frame, bars, sill) start and end at different depths, so no two of them
// share a face plane -- the rule that keeps the model free of z-fighting.

type Face = "+z" | "-z" | "+x" | "-x";

/** A vertical wall plane: the way it faces and its coordinate on that axis. */
interface Wall {
  face: Face;
  at: number;
}

const wall = (face: Face, at: number): Wall => ({ face, at });

/** A block on wall `w`: u0..u1 along it, y0..y1 up, d0..d1 out of its face. */
function onWall(m: MeshBuilder, mat: string, w: Wall, u0: number, u1: number, y0: number, y1: number, d0: number, d1: number): void {
  switch (w.face) {
    case "+z": block(m, mat, u0, u1, y0, y1, w.at + d0, w.at + d1); break;
    case "-z": block(m, mat, u0, u1, y0, y1, w.at - d1, w.at - d0); break;
    case "+x": block(m, mat, w.at + d0, w.at + d1, y0, y1, u0, u1); break;
    case "-x": block(m, mat, w.at - d1, w.at - d0, y0, y1, u0, u1); break;
  }
}

/** The model point at (u, y) on wall `w`, `d` out of its face. */
function wallPoint(w: Wall, u: number, y: number, d: number): Vec3 {
  switch (w.face) {
    case "+z": return [u, y, w.at + d];
    case "-z": return [u, y, w.at - d];
    case "+x": return [w.at + d, y, u];
    case "-x": return [w.at - d, y, u];
  }
}

/** The outward unit normal of wall `w`. */
function wallNormal(w: Wall): Vec3 {
  switch (w.face) {
    case "+z": return [0, 0, 1];
    case "-z": return [0, 0, -1];
    case "+x": return [1, 0, 0];
    case "-x": return [-1, 0, 0];
  }
}

/**
 * A flat convex panel on wall `w`, its outline given as (u, y) points, from d0
 * out to d1: a gable field, a lunette, an archivolt segment.
 */
function wallSlab(m: MeshBuilder, mat: string, w: Wall, outline: Ring, d0: number, d1: number): void {
  const n = wallNormal(w);
  const face = outline.map(([u, y]) => wallPoint(w, u, y, d1));
  m.slab(mat, face, [-n[0] * (d1 - d0), -n[1] * (d1 - d0), -n[2] * (d1 - d0)]);
}

interface WindowStyle {
  glass: string;
  frame: string;
  /** Vertical panes (mullions + 1). */
  cols?: number;
  /** Transom heights as fractions of the opening, bottom up. */
  transoms?: number[];
  /** Frame bar width. */
  bar?: number;
  /** A plain surround (reveal) this far around the frame. */
  surround?: { mat: string; by: number };
  sill?: string;
  /** A projecting hood over the window. */
  head?: string;
  /** Two shutters beside the window. */
  shutters?: string;
}

/** A window (or glazed door) on wall `w`: opening `width` x `height`, its sill at y0, centred on u. */
function windowOn(m: MeshBuilder, w: Wall, u: number, y0: number, width: number, height: number, s: WindowStyle): void {
  m.scope("window", () => {
    const b = s.bar ?? 0.09;
    const hw = width / 2;
    const y1 = y0 + height;
    if (s.surround) {
      const k = s.surround.by;
      onWall(m, s.surround.mat, w, u - hw - k, u + hw + k, y0 - k, y1 + k, -0.04, 0.015);
    }
    onWall(m, s.glass, w, u - hw + b / 2, u + hw - b / 2, y0 + b / 2, y1 - b / 2, -0.07, 0.03);
    onWall(m, s.frame, w, u - hw, u - hw + b, y0, y1, -0.06, 0.09);
    onWall(m, s.frame, w, u + hw - b, u + hw, y0, y1, -0.06, 0.09);
    onWall(m, s.frame, w, u - hw + b, u + hw - b, y0, y0 + b, -0.06, 0.09);
    onWall(m, s.frame, w, u - hw + b, u + hw - b, y1 - b, y1, -0.06, 0.09);
    const cols = s.cols ?? 2;
    const bar = b * 0.6;
    for (let i = 1; i < cols; i++) {
      const c = u - hw + (width * i) / cols;
      onWall(m, s.frame, w, c - bar / 2, c + bar / 2, y0 + b, y1 - b, -0.05, 0.075);
    }
    for (const t of s.transoms ?? []) {
      const c = y0 + height * t;
      onWall(m, s.frame, w, u - hw + b, u + hw - b, c - bar / 2, c + bar / 2, -0.055, 0.07);
    }
    const reach = hw + (s.surround?.by ?? 0) + 0.07;
    if (s.sill) onWall(m, s.sill, w, u - reach, u + reach, y0 - 0.13, y0 + 0.01, -0.03, 0.17);
    if (s.head) onWall(m, s.head, w, u - reach - 0.03, u + reach + 0.03, y1 + 0.02, y1 + 0.2, -0.03, 0.15);
    if (s.shutters) {
      const k = s.surround?.by ?? 0;
      const sw = width * 0.42;
      onWall(m, s.shutters, w, u - hw - k - sw, u - hw - k, y0 - 0.02, y1 + 0.02, -0.02, 0.07);
      onWall(m, s.shutters, w, u + hw + k, u + hw + k + sw, y0 - 0.02, y1 + 0.02, -0.02, 0.07);
    }
  });
}

/** A panelled door on wall `w`, `width` x `height` from y0, with an optional glazed upper panel. */
function doorOn(m: MeshBuilder, w: Wall, u: number, y0: number, width: number, height: number, leaf: string, frame: string, glass?: string): void {
  m.scope("door", () => {
    const hw = width / 2;
    onWall(m, frame, w, u - hw - 0.12, u + hw + 0.12, y0, y0 + height + 0.12, -0.04, 0.05);
    onWall(m, leaf, w, u - hw, u + hw, y0 + 0.02, y0 + height, -0.06, 0.08);
    if (glass) onWall(m, glass, w, u - hw + 0.12, u + hw - 0.12, y0 + height * 0.45, y0 + height - 0.12, -0.07, 0.1);
  });
}

// --- roofs -----------------------------------------------------------------------
//
// A roof plane is a slab: its top surface, given as the outline, and a vertical
// thickness under it. Planes meeting at a hip or ridge overlap in volume only,
// never in a face plane.

/** One roof plane: the convex outline of its top surface, `t` thick. */
function roofPlane(m: MeshBuilder, mat: string, outline: Vec3[], t: number): void {
  m.slab(mat, outline, [0, -t, 0]);
}

/**
 * A hip roof over x0..x1 x z0..z1, eaves at y0, ridge at y1, the ridge along the
 * longer side; `hip` is how far the end planes reach in (half the short side --
 * a regular hip -- by default).
 */
function hipRoof(m: MeshBuilder, mat: string, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, t = 0.2, hip?: number): void {
  const alongX = x1 - x0 >= z1 - z0;
  if (alongX) {
    const zc = (z0 + z1) / 2;
    const h = Math.min(hip ?? (z1 - z0) / 2, (x1 - x0) / 2);
    const r0: Vec3 = [x0 + h, y1, zc];
    const r1: Vec3 = [x1 - h, y1, zc];
    roofPlane(m, mat, [[x0, y0, z1], [x1, y0, z1], r1, r0], t);
    roofPlane(m, mat, [[x1, y0, z0], [x0, y0, z0], r0, r1], t);
    roofPlane(m, mat, [[x0, y0, z0], [x0, y0, z1], r0], t);
    roofPlane(m, mat, [[x1, y0, z1], [x1, y0, z0], r1], t);
  } else {
    const xc = (x0 + x1) / 2;
    const h = Math.min(hip ?? (x1 - x0) / 2, (z1 - z0) / 2);
    const r0: Vec3 = [xc, y1, z0 + h];
    const r1: Vec3 = [xc, y1, z1 - h];
    roofPlane(m, mat, [[x1, y0, z1], [x1, y0, z0], r0, r1], t);
    roofPlane(m, mat, [[x0, y0, z0], [x0, y0, z1], r1, r0], t);
    roofPlane(m, mat, [[x0, y0, z1], [x1, y0, z1], r1], t);
    roofPlane(m, mat, [[x1, y0, z0], [x0, y0, z0], r0], t);
  }
}

/** A gable roof whose ridge runs along z at x = (x0 + x1) / 2, eaves at y0, ridge at y1. */
function gableRoofZ(m: MeshBuilder, mat: string, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, t = 0.2): void {
  const xc = (x0 + x1) / 2;
  roofPlane(m, mat, [[x1, y0, z0], [x1, y0, z1], [xc, y1, z1], [xc, y1, z0]], t);
  roofPlane(m, mat, [[x0, y0, z1], [x0, y0, z0], [xc, y1, z0], [xc, y1, z1]], t);
}

/**
 * The triangular gable wall under a roof whose ridge runs along z: the section
 * x0..x1 rising from y0 to an apex at y1, swept from z0 to z1.
 */
function gableWallZ(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  const s: Ring = [[x0, y0], [x1, y0], [(x0 + x1) / 2, y1]];
  m.sweep(mat, "z", s, z0, s, z1);
}

/** Bargeboards along the two rakes of a gable facing +z at z, x0..x1, eaves y0, apex y1. */
function bargeboards(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z: number, depth: number, h = 0.22): void {
  const xc = (x0 + x1) / 2;
  m.slab(mat, [[x0, y0, z], [xc, y1, z], [xc, y1 - h, z], [x0, y0 - h, z]], [0, 0, -depth]);
  m.slab(mat, [[xc, y1, z], [x1, y0, z], [x1, y0 - h, z], [xc, y1 - h, z]], [0, 0, -depth]);
}

// --- round things ------------------------------------------------------------------

/**
 * A solid of revolution about (cx, cz): `profile` is (radius, y) bottom up; a
 * last radius of 0 closes it in a point, otherwise it is capped flat.
 */
function revolve(m: MeshBuilder, mat: string, profile: Array<[number, number]>, n: number, cx: number, cz: number, rot = 0): void {
  for (let i = 0; i + 1 < profile.length; i++) {
    const [r0, y0] = profile[i]!;
    const [r1, y1] = profile[i + 1]!;
    const last = i + 2 === profile.length;
    if (r1 <= 1e-6) m.spire(mat, ngon(n, r0, rot, cx, cz), y0, y1);
    else m.loft(mat, ngon(n, r0, rot, cx, cz), y0, ngon(n, r1, rot, cx, cz), y1, last);
  }
}

/** A disc lying in wall `w` (a clock face, a medallion): `n` sides, from d0 out to d1. */
function wallDisc(m: MeshBuilder, mat: string, w: Wall, u: number, y: number, r: number, n: number, d0: number, d1: number): void {
  const pts: Ring = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([u + r * Math.cos(a), y + r * Math.sin(a)]);
  }
  wallSlab(m, mat, w, pts, d0, d1);
}

/** A ring of quads in wall `w` between radii r0 and r1, from angle a0 to a1: an archivolt, a clock rim. */
function wallArc(m: MeshBuilder, mat: string, w: Wall, u: number, y: number, r0: number, r1: number, a0: number, a1: number, n: number, d0: number, d1: number): void {
  const inner = arc(u, y, r0, a0, a1, n);
  const outer = arc(u, y, r1, a0, a1, n);
  for (let i = 0; i < n; i++) wallSlab(m, mat, w, [inner[i]!, outer[i]!, outer[i + 1]!, inner[i + 1]!], d0, d1);
}

// --- lettering ---------------------------------------------------------------------
//
// Sign boards carry their names in a 3 x 5 block font: one small box per lit
// cell, a few millimetres proud of the board.

const FONT: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  I: ["111", "010", "010", "010", "111"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["110", "101", "101", "101", "101"],
  O: ["010", "101", "101", "101", "010"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
};

/** `text` centred at (u, y) on wall `w`, letters `h` tall, from d0 out to d1. */
function lettering(m: MeshBuilder, mat: string, w: Wall, text: string, u: number, y: number, h: number, d0: number, d1: number): void {
  m.scope("lettering", () => {
    const c = h / 5;
    const adv = c * 4;
    const width = text.length * adv - c;
    let x = u - width / 2;
    for (const ch of text) {
      const g = FONT[ch];
      if (g) {
        g.forEach((row, r) => {
          // runs of lit cells in a row become one bar
          for (let k = 0; k < 3; ) {
            if (row[k] !== "1") { k++; continue; }
            let e = k;
            while (e + 1 < 3 && row[e + 1] === "1") e++;
            const top = y + h / 2 - r * c;
            onWall(m, mat, w, x + k * c, x + (e + 1) * c, top - c, top, d0, d1);
            k = e + 1;
          }
        });
      }
      x += adv;
    }
  });
}

// --- the halt: Mikulasovice dolni nadrazi --------------------------------------------

export const HALT: Record<string, MaterialSpec> = {
  plinth: { color: "#8b8477" },
  stucco: { color: "#ecdfbd" },
  band: { color: "#e2d2ab" },
  brick: { color: "#a9553a" },
  tile: { color: "#c0492b" },
  timber: { color: "#6a452a" },
  post: { color: "#4f3220" },
  paintWhite: { color: "#f2ece0" },
  glass: { color: "#2c3a42", roughness: 0.3 },
  metal: { color: "#9a5a3c", metallic: 0.3, roughness: 0.5 },
  sign: { color: "#1a5ea8" },
  flowers: { color: "#d0507a" },
  leaves: { color: "#4f7a3a" },
};

/**
 * The Mikulasovice station: a cream stucco two-storey block under a red hip roof,
 * a gabled centre bay framed in brick pilasters with the blue name board, and a
 * platform canopy on dark timber posts with knee braces along the front (+Z).
 */
export function stationHalt(): MeshBuilder {
  const m = new MeshBuilder(HALT);
  const front = wall("+z", 2.27);
  const bay = wall("+z", 2.77);
  const rear = wall("-z", -5.73);
  const west = wall("-x", -9);
  const east = wall("+x", 9);
  const win: WindowStyle = { glass: "glass", frame: "timber", cols: 2, transoms: [0.68], surround: { mat: "paintWhite", by: 0.12 }, sill: "plinth" };

  m.scope("building", () => {
    m.scope("plinth", () => {
      m.box("plinth", 0, -1.73, 18.2, 8.2, 0, 0.55);
      m.box("plinth", 0, 2.17, 7.0, 1.4, 0, 0.55);
    });
    m.scope("walls", () => {
      m.box("stucco", 0, -1.73, 18, 8, 0.55, 7.3, 0, false);
      m.scope("floor band", () => m.box("band", 0, -1.73, 18.1, 8.1, 3.56, 3.74));
    });
    m.scope("centre bay", () => {
      m.box("stucco", 0, 2.52, 6.8, 0.5, 0.55, 7.4, 0, false);
      m.box("band", 0, 2.52, 6.9, 0.6, 3.56, 3.74);
      gableWallZ(m, "stucco", -3.4, 3.4, 7.39, 9.25, 1.0, 2.77);
    });
    m.scope("pilasters", () => {
      for (const s of [-1, 1]) {
        // corner pilasters wrap the corners, so no brick face lies in a wall plane
        onWall(m, "brick", front, s > 0 ? 8.1 : -9.12, s > 0 ? 9.12 : -8.1, 0.6, 7.0, -0.02, 0.13);
        onWall(m, "brick", rear, s > 0 ? 8.1 : -9.12, s > 0 ? 9.12 : -8.1, 0.6, 7.0, -0.02, 0.13);
        onWall(m, "brick", s > 0 ? east : west, 1.4, 2.4, 0.6, 7.0, -0.03, 0.12);
        onWall(m, "brick", s > 0 ? east : west, -5.86, -4.86, 0.6, 7.0, -0.03, 0.12);
        onWall(m, "brick", bay, s > 0 ? 2.7 : -3.52, s > 0 ? 3.52 : -2.7, 0.6, 7.35, -0.02, 0.13);
        onWall(m, "brick", wall(s > 0 ? "+x" : "-x", s * 3.4), 1.82, 2.9, 0.6, 7.35, -0.02, 0.12);
      }
    });
  });

  m.scope("roof", () => {
    m.scope("main roof", () => hipRoof(m, "tile", -9.7, 9.7, -6.43, 2.97, 6.95, 9.45, 0.22));
    m.scope("centre gable", () => {
      gableRoofZ(m, "tile", -4.0, 4.0, -1.73, 3.1, 7.12, 9.45, 0.2);
      bargeboards(m, "timber", -4.0, 4.0, 7.12, 9.45, 3.24, 0.14, 0.26);
    });
    m.scope("gutters", () => {
      m.box("metal", 0, 3.02, 19.5, 0.14, 6.83, 6.97);
      m.box("metal", 0, -6.49, 19.5, 0.14, 6.83, 6.97);
      for (const x of [-7.9, 7.9]) {
        m.prism("metal", ngon(8, 0.07, 0, x, 2.39), 0.2, 6.85);
        m.prism("metal", ngon(8, 0.07, 0, x, -5.85), 0.2, 6.85);
      }
    });
    m.scope("chimneys", () => {
      for (const x of [-5.6, 5.6]) {
        m.box("brick", x, -2.13, 0.86, 0.75, 7.6, 10.3);
        m.box("plinth", x, -2.13, 1.04, 0.95, 10.3, 10.46);
      }
    });
  });

  m.scope("upper floor", () => {
    const boxed = (w: Wall, u: number): void => {
      windowOn(m, w, u, 4.6, 1.5, 1.7, win);
      m.scope("flower box", () => {
        onWall(m, "timber", w, u - 0.64, u + 0.64, 4.28, 4.46, 0.18, 0.42);
        onWall(m, "leaves", w, u - 0.6, u + 0.6, 4.46, 4.58, 0.21, 0.39);
        for (let i = 0; i < 4; i++) onWall(m, "flowers", w, u - 0.5 + i * 0.3, u - 0.36 + i * 0.3, 4.58, 4.7, 0.25, 0.36);
      });
    };
    m.scope("front", () => {
      boxed(bay, 0);
      boxed(front, -5.2);
      boxed(front, 5.2);
    });
    m.scope("rear", () => {
      for (const u of [-7.2, -4.4, -1.6, 1.6, 4.4, 7.2]) windowOn(m, rear, u, 4.65, 1.2, 1.6, win);
    });
    m.scope("ends", () => {
      for (const w of [west, east]) for (const u of [-3.03, -0.43]) windowOn(m, w, u, 4.65, 1.1, 1.55, win);
    });
    m.scope("gable window", () => {
      windowOn(m, bay, 0, 7.6, 0.86, 1.0, { ...win, transoms: [], sill: "plinth" });
    });
    m.scope("name board", () => {
      onWall(m, "paintWhite", bay, -1.86, 1.86, 6.2, 7.06, 0.04, 0.1);
      onWall(m, "sign", bay, -1.78, 1.78, 6.28, 6.98, 0.06, 0.15);
      lettering(m, "paintWhite", bay, "MIKULASOVICE", -0.2, 6.63, 0.3, 0.1, 0.17);
    });
  });

  m.scope("ground floor", () => {
    m.scope("front", () => {
      windowOn(m, front, -6.6, 1.4, 2.2, 2.0, { ...win, cols: 2, transoms: [0.62] });
      windowOn(m, front, 6.6, 1.4, 2.2, 2.0, { ...win, cols: 2, transoms: [0.62] });
      windowOn(m, bay, -1.7, 1.4, 1.5, 2.0, win);
      windowOn(m, bay, 1.7, 1.4, 1.5, 2.0, win);
      doorOn(m, bay, 0, 0.55, 1.14, 2.5, "timber", "paintWhite");
      doorOn(m, front, -4.1, 0.55, 1.1, 2.4, "timber", "paintWhite", "glass");
      doorOn(m, front, 4.1, 0.55, 1.1, 2.4, "timber", "paintWhite", "glass");
    });
    m.scope("rear", () => {
      for (const u of [-6.8, -3.6, 3.6, 6.8]) windowOn(m, rear, u, 1.5, 1.4, 1.8, win);
      doorOn(m, rear, 0, 0.55, 1.1, 2.4, "timber", "paintWhite", "glass");
    });
    m.scope("ends", () => {
      for (const w of [west, east]) windowOn(m, w, -1.73, 1.5, 1.3, 1.8, win);
    });
  });

  m.scope("platform canopy", () => {
    m.scope("roof", () => {
      roofPlane(m, "tile", [[-9.6, 4.16, 2.3], [9.6, 4.16, 2.3], [9.6, 3.66, 6.5], [-9.6, 3.66, 6.5]], 0.16);
      m.box("timber", 0, 6.5, 19.14, 0.12, 3.38, 3.68);
      m.box("timber", 0, 2.41, 18.0, 0.16, 3.82, 4.02);
    });
    m.scope("posts", () => {
      const xs = [-9.0, -6.0, -3.0, 3.0, 6.0, 9.0];
      m.box("post", 0, 6.15, 18.4, 0.22, 3.26, 3.5);
      for (const x of xs) {
        m.box("post", x, 6.15, 0.2, 0.2, 0, 3.26);
        // the knee braces fork from the post to the beam along the platform
        for (const s of [-1, 1]) {
          if (Math.abs(x + s * 0.8) > 9.2) continue;
          m.slab("post", [[x, 2.55, 6.21], [x + s * 0.12, 2.55, 6.21], [x + s * 0.85, 3.26, 6.21], [x + s * 0.7, 3.26, 6.21]], [0, 0, -0.12]);
        }
        // a rafter from the beam back to the wall plate, under the roof
        m.slab("post", [[x - 0.06, 3.3, 6.1], [x - 0.06, 3.5, 6.1], [x - 0.06, 3.96, 2.42], [x - 0.06, 3.76, 2.42]], [0.12, 0, 0]);
      }
    });
  });
  return m;
}

// --- the station building ------------------------------------------------------------

export const STUCCO: Record<string, MaterialSpec> = {
  stone: { color: "#b6af9f" },
  ochre: { color: "#e8a22b" },
  plaster: { color: "#f1e9d8" },
  tile: { color: "#b2532e" },
  ridge: { color: "#9c4626" },
  green: { color: "#2e5b4c" },
  greenDark: { color: "#1f473b" },
  glass: { color: "#2a3a38", roughness: 0.3 },
  iron: { color: "#6a635b", metallic: 0.3, roughness: 0.5 },
  wood: { color: "#9a5b38" },
  canopy: { color: "#ece5d3" },
  lamp: { color: "#f3e3a6" },
  shrub: { color: "#4f7a3a" },
  flagBlue: { color: "#2a62b0" },
  flagWhite: { color: "#f4f4f4" },
};

/**
 * A roof whose ridge runs along z at the middle of x0..x1: a gable at the front
 * (z1) and a hip, reaching `hip` in, at the back (z0).
 */
function gableHipRoofZ(m: MeshBuilder, mat: string, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, hip: number, t = 0.2): void {
  const xc = (x0 + x1) / 2;
  roofPlane(m, mat, [[x1, y0, z0], [x1, y0, z1], [xc, y1, z1], [xc, y1, z0 + hip]], t);
  roofPlane(m, mat, [[x0, y0, z1], [x0, y0, z0], [xc, y1, z0 + hip], [xc, y1, z1]], t);
  roofPlane(m, mat, [[x0, y0, z0], [x1, y0, z0], [xc, y1, z0 + hip]], t);
}

/** A row of scalloped half-discs hanging from y on wall `w`, u0..u1: a fretwork valance. */
function scallops(m: MeshBuilder, mat: string, w: Wall, u0: number, u1: number, y: number, r: number, d0: number, d1: number): void {
  m.scope("scallops", () => {
    const n = Math.max(1, Math.round((u1 - u0) / (2 * r + 0.06)));
    const step = (u1 - u0) / n;
    for (let i = 0; i < n; i++) wallSlab(m, mat, w, arc(u0 + step * (i + 0.5), y, r, Math.PI, Math.PI * 2, 6), d0, d1);
  });
}

/**
 * The yellow-ochre station: a long single-storey building under a low red hip
 * roof, a two-storey pavilion in the middle with a decorated gable, a gabled end
 * pavilion, and a platform canopy on timber posts with green brackets and a
 * scalloped valance along the platform (+Z).
 */
export function stationBuilding(): MeshBuilder {
  const m = new MeshBuilder(STUCCO);
  const front = wall("+z", 2.07);
  const rear = wall("-z", -4.93);
  const west = wall("-x", -13.29);
  const pav = wall("+z", 2.77);
  const pavRear = wall("-z", -5.13);
  const endFront = wall("+z", 3.67);
  const endRear = wall("-z", -5.13);
  const east = wall("+x", 13.21);
  const win: WindowStyle = { glass: "glass", frame: "plaster", cols: 2, bar: 0.08, surround: { mat: "plaster", by: 0.16 }, shutters: "green" };

  m.scope("main block", () => {
    m.box("stone", -2.29, -1.43, 22.4, 7.3, 0, 0.62);
    m.box("ochre", -2.29, -1.43, 22.0, 7.0, 0.62, 4.4, 0, false);
    m.box("plaster", -2.29, -1.43, 22.1, 7.1, 0.62, 1.02);
    m.box("plaster", -2.29, -1.43, 22.6, 7.7, 4.15, 4.37);
    m.scope("roof", () => {
      hipRoof(m, "tile", -13.89, 9.31, -5.62, 2.72, 4.37, 5.52, 0.18);
      m.box("ridge", -2.29, -1.43, 14.8, 0.26, 5.4, 5.66);
    });
    m.scope("frieze", () => {
      for (const [u0, u1] of [[-13.29, -3.49], [2.91, 8.71]] as const) {
        onWall(m, "green", front, u0, u1, 3.98, 4.15, 0.0, 0.07);
        scallops(m, "green", front, u0, u1, 3.98, 0.13, 0.01, 0.06);
      }
    });
  });

  m.scope("pavilion", () => {
    // a 3.3 m ground storey and a 3 m upper storey under the gable: eaves E, ridge R
    const E = 6.85;
    const R = 8.45;
    m.box("stone", -0.29, -1.18, 6.6, 8.1, 0, 0.62);
    m.box("ochre", -0.29, -1.18, 6.4, 7.9, 0.62, 7.0, 0, false);
    m.box("plaster", -0.29, -1.18, 6.6, 8.1, 3.85, 4.01);
    m.box("plaster", -0.29, -1.18, 6.9, 8.4, E - 0.1, E + 0.12);
    m.scope("roof", () => {
      gableHipRoofZ(m, "tile", -4.04, 3.46, -5.62, 3.27, E, R, 2.6, 0.2);
      gableWallZ(m, "ochre", -3.49, 2.91, E + 0.11, E + 0.11 + 1.15, 0.0, 3.0);
    });
    m.scope("gable", () => {
      const g = wall("+z", 3.0);
      bargeboards(m, "green", -4.04, 3.46, E, R, 3.42, 0.14, 0.24);
      wallArc(m, "green", g, -0.29, E + 0.6, 0.38, 0.46, 0, Math.PI * 2, 20, -0.02, 0.07);
      wallDisc(m, "plaster", g, -0.29, E + 0.6, 0.39, 20, -0.03, 0.05);
      m.prism("green", ngon(6, 0.08, 0, -0.29, 3.35), R - 0.12, R + 0.51);
      m.scope("fretwork", () => {
        // white lattice under the bargeboards, as on the photo
        for (const s of [-1, 1]) {
          for (let i = 1; i <= 4; i++) {
            const x = -0.29 + s * i * 0.72;
            const top = R - (i * 0.72 * (R - E)) / 3.75 - 0.26;
            onWall(m, "plaster", g, x - 0.05, x + 0.05, top - 0.35, top, 0.06, 0.12);
          }
        }
      });
    });
    m.scope("upper windows", () => {
      for (const u of [-2.29, -0.29, 1.71]) windowOn(m, pav, u, 4.85, 0.82, 1.4, win);
      for (const u of [-1.98, 1.42]) windowOn(m, pavRear, u, 4.85, 0.82, 1.4, win);
    });
    m.scope("station sign", () => {
      onWall(m, "green", pav, -1.59, 1.01, 4.08, 4.58, 0.12, 0.22);
      lettering(m, "plaster", pav, "STATION", -0.29, 4.33, 0.26, 0.2, 0.25);
    });
    m.scope("chimney", () => {
      m.box("ochre", -2.19, -3.33, 0.66, 0.66, 7.3, 8.5);
      m.box("stone", -2.19, -3.33, 0.86, 0.86, 8.5, 8.64);
    });
  });

  m.scope("end pavilion", () => {
    m.box("stone", 10.91, -0.73, 4.8, 9.0, 0, 0.62);
    m.box("ochre", 10.91, -0.73, 4.6, 8.8, 0.62, 4.9, 0, false);
    m.box("plaster", 10.91, -0.73, 4.7, 8.9, 0.62, 1.02);
    m.box("plaster", 10.91, -0.73, 5.4, 9.6, 4.55, 4.77);
    m.scope("roof", () => {
      gableRoofZ(m, "tile", 7.96, 13.86, -5.8, 4.4, 4.67, 6.12, 0.18);
      m.box("ridge", 10.91, -0.7, 0.24, 10.16, 6.0, 6.24);
      gableWallZ(m, "ochre", 8.61, 13.21, 4.76, 5.9, -5.13, 3.67);
    });
    m.scope("gables", () => {
      bargeboards(m, "green", 7.93, 13.89, 4.67, 6.12, 4.5, 0.1, 0.22);
      m.slab("green", [[7.93, 4.67, -5.92], [10.91, 6.12, -5.92], [10.91, 5.9, -5.92], [7.93, 4.45, -5.92]], [0, 0, 0.12]);
      m.slab("green", [[10.91, 6.12, -5.92], [13.89, 4.67, -5.92], [13.89, 4.45, -5.92], [10.91, 5.9, -5.92]], [0, 0, 0.12]);
      onWall(m, "green", endFront, -2.55, 2.55, 4.43, 4.77, 0.13, 0.22);
      scallops(m, "green", wall("+z", 3.67), 8.4, 13.4, 4.43, 0.12, 0.15, 0.2);
      wallDisc(m, "plaster", wall("+z", 3.99), 10.91, 5.25, 0.28, 14, -0.02, 0.06);
    });
    m.scope("windows", () => {
      windowOn(m, endFront, 10.91, 1.3, 1.0, 1.8, win);
      windowOn(m, endRear, 10.91, 1.3, 0.86, 1.5, win);
      for (const u of [-2.83, 0.77]) windowOn(m, east, u, 1.4, 0.86, 1.5, win);
      windowOn(m, east, -1.03, 3.6, 0.66, 0.42, { ...win, shutters: undefined });
    });
    m.scope("flag", () => {
      m.slab("iron", [[13.065, 2.55, 2.16], [13.065, 2.6, 2.16], [13.065, 4.65, 2.97], [13.065, 4.6, 2.99]], [0.06, 0, 0]);
      m.slab("flagBlue", [[13.04, 4.0, 2.2], [13.04, 4.53, 2.65], [13.04, 3.75, 3.4], [13.04, 3.25, 2.95]], [0.03, 0, 0]);
      m.slab("flagWhite", [[13.08, 3.92, 2.5], [13.08, 4.15, 2.69], [13.08, 3.6, 3.22], [13.08, 3.4, 3.05]], [0.01, 0, 0]);
    });
  });

  m.scope("platform front", () => {
    m.scope("doors", () => {
      for (const u of [-11.89, -9.19, -6.49, -2.19, 1.61, 4.61, 7.21]) {
        const f = u > -3.49 && u < 2.91 ? pav : front;
        doorOn(m, f, u, 0.62, 1.16, 2.1, "greenDark", "plaster");
        windowOn(m, f, u, 2.86, 1.1, 0.24, { glass: "glass", frame: "greenDark", cols: 2, bar: 0.05 });
        onWall(m, "plaster", f, u - 0.87, u + 0.87, 3.12, 3.28, -0.02, 0.16);
      }
    });
    m.scope("windows", () => {
      for (const u of [-10.54, -7.84, -4.29, 5.91]) windowOn(m, front, u, 1.3, 0.86, 1.5, { ...win, shutters: undefined });
    });
  });

  m.scope("rear and ends", () => {
    for (const u of [-11.69, -8.89, -6.09, 4.91, 7.31]) windowOn(m, rear, u, 1.3, 0.86, 1.5, win);
    for (const u of [-1.98, 1.42]) windowOn(m, pavRear, u, 1.3, 0.86, 1.5, win);
    for (const u of [-3.03, 0.17]) windowOn(m, west, u, 1.3, 0.86, 1.5, win);
  });

  m.scope("canopy", () => {
    m.scope("roof", () => {
      roofPlane(m, "canopy", [[-13.69, 3.78, 1.95], [8.91, 3.78, 1.95], [8.91, 3.28, 5.85], [-13.69, 3.28, 5.85]], 0.14);
      m.box("wood", -2.39, 2.2, 22.5, 0.18, 3.38, 3.64);
      m.box("wood", -2.39, 5.72, 22.66, 0.2, 2.91, 3.21);
      for (let i = 0; i < 31; i++) {
        const x = -13.62 + (i * 22.36) / 30;
        m.slab("wood", [[x, 3.62, 2.2], [x, 3.12, 5.72], [x, 3.0, 5.72], [x, 3.5, 2.2]], [0.1, 0, 0]);
      }
    });
    m.scope("valance", () => {
      const v = wall("+z", 5.82);
      onWall(m, "green", v, -13.69, 8.91, 2.92, 3.24, 0.02, 0.08);
      scallops(m, "green", v, -13.69, 8.91, 2.93, 0.14, 0.03, 0.1);
    });
    m.scope("posts", () => {
      for (let i = 0; i < 8; i++) {
        const x = -12.79 + i * 3;
        m.box("stone", x, 5.72, 0.4, 0.4, 0, 0.3);
        m.box("wood", x, 5.72, 0.18, 0.18, 0.3, 2.91);
        m.box("wood", x, 5.72, 0.3, 0.3, 2.78, 2.91);
        // the arched brackets either side of the post, along the platform: a
        // quarter-round spandrel cut into vertical strips (each strip convex)
        for (const sd of [-1, 1]) {
          const pts = arc(x + sd * 0.7, 2.2, 0.62, sd < 0 ? 0 : Math.PI, Math.PI / 2, 4);
          for (let k = 0; k < 4; k++) {
            const a = pts[k]!;
            const b = pts[k + 1]!;
            m.slab("green", [[a[0], a[1], 5.77], [b[0], b[1], 5.77], [b[0], 2.9, 5.77], [a[0], 2.9, 5.77]], [0, 0, -0.1]);
          }
        }
      }
    });
    m.scope("lanterns", () => {
      for (const x of [-9.79, -3.79, 3.21, 7.71]) {
        m.box("iron", x, 3.97, 0.05, 0.05, 3.05, 3.34);
        m.box("lamp", x, 3.97, 0.26, 0.26, 2.64, 2.97);
        m.prism("iron", ngon(4, 0.23, Math.PI / 4, x, 3.97), 2.97, 3.05);
      }
    });
    m.scope("benches", () => {
      for (const x of [-6.79, 2.21]) {
        m.box("wood", x, 4.47, 1.7, 0.42, 0.41, 0.51);
        m.box("wood", x, 4.29, 1.7, 0.08, 0.52, 0.9);
        for (const s of [-1, 1]) m.box("iron", x + s * 0.7, 4.47, 0.08, 0.4, 0, 0.41);
      }
    });
    m.scope("planter", () => {
      m.box("stone", -0.49, 4.17, 0.8, 0.8, 0, 0.7);
      revolve(m, "shrub", [[0.3, 0.7], [0.38, 1.0], [0.3, 1.35], [0.0, 1.52]], 8, -0.49, 4.17);
    });
  });

  m.scope("chimneys", () => {
    for (const x of [-9.79, 6.11]) {
      m.box("ochre", x, -1.83, 0.7, 0.7, 4.6, 6.0);
      m.box("stone", x, -1.83, 0.9, 0.9, 6.0, 6.12);
    }
  });
  return m;
}

// --- the suburban station ------------------------------------------------------------

export const SUBURBAN: Record<string, MaterialSpec> = {
  stone: { color: "#b3aca0" },
  forecourt: { color: "#a39c90" },
  brick: { color: "#9c4a3d" },
  trim: { color: "#e6dbcb" },
  roof: { color: "#c9c1b2" },
  iron: { color: "#4a352f" },
  clockFace: { color: "#f3efe6" },
  glass: { color: "#3b4954", roughness: 0.3 },
  signYellow: { color: "#e0ac26" },
  signFrame: { color: "#6b4a1e" },
};

/** A clock on wall `w` at (u, y): rim, face, twelve ticks and two hands. */
function clock(m: MeshBuilder, w: Wall, u: number, y: number, r: number, rim: string, face: string, ink: string, d: number): void {
  m.scope("clock", () => {
    wallArc(m, rim, w, u, y, r * 0.86, r, 0, Math.PI * 2, 24, d - 0.06, d + 0.08);
    wallDisc(m, face, w, u, y, r * 0.88, 24, d - 0.05, d + 0.04);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const c: Ring = [[r * 0.66, -0.025], [r * 0.8, -0.025], [r * 0.8, 0.025], [r * 0.66, 0.025]];
      wallSlab(m, ink, w, c.map(([p, q]) => [u + p * Math.cos(a) - q * Math.sin(a), y + p * Math.sin(a) + q * Math.cos(a)]), d + 0.03, d + 0.06);
    }
    // ten past ten
    const hand = (a: number, len: number, wd: number, d0: number): void => {
      const c: Ring = [[-0.08, -wd], [len, -wd * 0.5], [len, wd * 0.5], [-0.08, wd]];
      wallSlab(m, ink, w, c.map(([p, q]) => [u + p * Math.cos(a) - q * Math.sin(a), y + p * Math.sin(a) + q * Math.cos(a)]), d0, d0 + 0.03);
    };
    hand(Math.PI * (90 - 300) / 180, r * 0.5, 0.05, d + 0.05);
    hand(Math.PI * (90 - 60) / 180, r * 0.72, 0.035, d + 0.075);
  });
}

/**
 * The red-brick suburban station: a tall central hall with three big gridded
 * windows and a clock on top, lower wings either side, a yellow SUBURBAN STATION
 * board over a cream canopy on slender posts along the street front (+Z).
 */
export function suburbanStation(): MeshBuilder {
  const m = new MeshBuilder(SUBURBAN);
  const front = wall("+z", 5);
  const rear = wall("-z", -5);
  const west = wall("-x", -12);
  const east = wall("+x", 12);
  const win: WindowStyle = { glass: "glass", frame: "trim", cols: 2, transoms: [0.5], bar: 0.14, sill: "trim", head: "trim" };

  m.scope("plinth", () => {
    m.box("stone", 0, 0, 25.2, 10.6, 0, 0.45);
    m.box("forecourt", 0, 6.81, 25.2, 2.98, 0, 0.3);
  });
  m.scope("wings", () => {
    for (const s of [-1, 1]) {
      m.scope(s < 0 ? "west wing" : "east wing", () => {
        const cx = s * 8.5;
        m.box("brick", cx, 0, 7, 10, 0.45, 6.9, 0, false);
        m.box("trim", cx, 0, 7.4, 10.4, 6.58, 7.0);
        m.box("roof", cx, 0, 7.0, 10.0, 7.0, 7.18);
        // cream corner pilasters, wrapping the outer corners
        onWall(m, "trim", front, s < 0 ? -12.14 : 11.7, s < 0 ? -11.7 : 12.14, 0.45, 6.58, -0.02, 0.14);
        onWall(m, "trim", rear, s < 0 ? -12.14 : 11.7, s < 0 ? -11.7 : 12.14, 0.45, 6.58, -0.02, 0.14);
        onWall(m, "trim", s < 0 ? west : east, 4.56, 5.14, 0.45, 6.58, -0.02, 0.14);
        onWall(m, "trim", s < 0 ? west : east, -5.14, -4.56, 0.45, 6.58, -0.02, 0.14);
      });
    }
  });
  m.scope("hall", () => {
    m.box("brick", 0, 0, 10, 10, 0.45, 10.0, 0, false);
    m.box("trim", 0, 0, 10.2, 10.24, 4.9, 5.2);
    m.box("trim", 0, 0, 10.5, 10.5, 9.7, 10.2);
    m.box("roof", 0, 0, 10, 10, 10.2, 10.38);
    m.scope("pilasters", () => {
      for (const x of [-4.75, -1.38, 1.38, 4.75]) onWall(m, "trim", front, x - 0.22, x + 0.22, 5.2, 9.7, -0.02, 0.16);
    });
    m.scope("attic", () => {
      m.box("trim", 0, 0, 7, 8.6, 10.2, 11.2, 0, false);
      m.box("trim", 0, 0, 7.4, 9.0, 11.2, 11.42);
    });
    m.scope("clock tower", () => {
      m.box("trim", 0, 2.9, 4.4, 2.8, 11.42, 13.62, 0, false);
      m.box("trim", 0, 2.9, 4.9, 3.3, 13.62, 13.88);
      m.box("trim", -2.4, 2.9, 0.9, 2.6, 11.42, 11.92);
      m.box("trim", 2.4, 2.9, 0.9, 2.6, 11.42, 11.92);
      const face = wall("+z", 4.3);
      onWall(m, "brick", face, -1.0, 1.0, 11.62, 13.42, -0.02, 0.05);
      clock(m, face, 0, 12.55, 0.87, "iron", "clockFace", "iron", 0.1);
    });
  });

  m.scope("street front", () => {
    m.scope("hall windows", () => {
      for (const x of [-2.75, 0, 2.75]) windowOn(m, front, x, 5.48, 2.0, 3.7, { ...win, cols: 3, transoms: [0.25, 0.5, 0.75], head: undefined });
      m.box("trim", 0, 5.08, 8.0, 0.36, 9.2, 9.42);
    });
    m.scope("wing windows", () => {
      for (const x of [-10, -7, 7, 10]) windowOn(m, front, x, 5.1, 1.4, 1.6, win);
    });
    m.scope("shop windows", () => {
      for (const x of [-10, -7, -3.9, 3.9, 7, 10]) windowOn(m, front, x, 0.95, 1.85, 2.45, { ...win, cols: 3, transoms: [0.33, 0.66], head: undefined });
    });
    m.scope("entrance", () => {
      for (const x of [-1.35, 1.35]) {
        windowOn(m, front, x, 0.5, 1.7, 3.0, { ...win, cols: 2, transoms: [0.25, 0.5, 0.75], sill: undefined, head: undefined });
        m.box("stone", x, 5.6, 2.1, 1.0, 0.3, 0.48);
      }
    });
    m.scope("name board", () => {
      onWall(m, "signFrame", front, -3.95, 3.95, 4.5, 5.4, 0.18, 0.26);
      onWall(m, "signYellow", front, -3.82, 3.82, 4.57, 5.33, 0.22, 0.32);
      lettering(m, "iron", front, "SUBURBAN STATION", 0, 4.95, 0.48, 0.3, 0.35);
    });
    m.scope("plaques", () => {
      const plaque = (u: number, text: string, w: number): void => {
        onWall(m, "iron", front, u - w / 2 - 0.08, u + w / 2 + 0.08, 3.3, 3.8, 0.02, 0.14);
        onWall(m, "signYellow", front, u - w / 2, u + w / 2, 3.36, 3.74, 0.06, 0.2);
        lettering(m, "iron", front, text, u, 3.55, 0.2, 0.18, 0.23);
      };
      plaque(-5.6, "TICKETS", 1.9);
      plaque(6.4, "CAFE", 1.15);
    });
    m.scope("lamps", () => {
      for (const x of [-4.6, 4.6]) {
        onWall(m, "iron", front, x - 0.05, x + 0.05, 6.3, 6.8, 0.0, 0.2);
        revolve(m, "clockFace", [[0.08, 6.0], [0.2, 6.1], [0.2, 6.3], [0.08, 6.4]], 10, x, 5.16);
      }
    });
  });

  m.scope("canopy", () => {
    m.box("trim", 0, 6.5, 24.8, 3.0, 4.2, 4.5);
    m.box("trim", 0, 7.92, 24.84, 0.18, 3.97, 4.32);
    m.box("brick", 0, 7.9, 24.7, 0.1, 3.76, 3.97);
    m.scope("posts", () => {
      for (let i = 0; i <= 8; i++) {
        const x = -11.6 + i * 2.9;
        m.box("trim", x, 7.75, 0.2, 0.2, 0.3, 4.2);
        m.box("trim", x, 7.75, 0.32, 0.32, 0.3, 0.6);
        m.slab("iron", [[x - 0.06, 3.6, 7.65], [x - 0.06, 4.18, 7.15], [x - 0.06, 4.18, 7.65]], [0.12, 0, 0]);
      }
    });
  });

  m.scope("ends", () => {
    for (const w of [west, east]) {
      for (const u of [-2.6, 0, 2.6]) {
        windowOn(m, w, u, 4.85, 1.2, 1.5, win);
        windowOn(m, w, u, 1.4, 1.2, 1.8, win);
      }
    }
  });
  m.scope("rear", () => {
    for (const x of [-9, -6, 6, 9]) windowOn(m, rear, x, 4.85, 1.3, 1.5, win);
    for (const x of [-9, -6, 6, 9]) windowOn(m, rear, x, 1.4, 1.3, 1.8, win);
    for (const x of [-3, 3]) windowOn(m, rear, x, 1.5, 1.6, 2.2, win);
    for (const x of [-3, 0, 3]) windowOn(m, rear, x, 6.0, 1.6, 2.8, { ...win, cols: 2, transoms: [0.33, 0.66] });
    doorOn(m, rear, 0, 0.45, 1.6, 2.85, "iron", "trim");
  });
  return m;
}

// --- Prague main station (the Fanta building) ----------------------------------------

export const PRAGUE: Record<string, MaterialSpec> = {
  stone: { color: "#e7e0ce" },
  trim: { color: "#cabfa8" },
  glazing: { color: "#39454f", roughness: 0.3 },
  copper: { color: "#6e9c85", metallic: 0.2, roughness: 0.55 },
  copperDark: { color: "#55836d", metallic: 0.2, roughness: 0.55 },
  ochre: { color: "#a9564a" },
  slate: { color: "#6b6560" },
  gilt: { color: "#c8a552", metallic: 0.5, roughness: 0.35 },
  lantern: { color: "#7d9cc0", metallic: 0.2, roughness: 0.25 },
};

/** A box standing on a regular n-gon's face `i` (rot 0, as ngon draws it): w wide, from the apothem out by d0..d1. */
function onRing(m: MeshBuilder, mat: string, n: number, i: number, apothem: number, cx: number, cz: number, w: number, y0: number, y1: number, d0: number, d1: number): void {
  const a = ((i + 0.5) / n) * Math.PI * 2;
  const r = apothem + (d0 + d1) / 2;
  m.box(mat, cx + r * Math.cos(a), cz - r * Math.sin(a), w, d1 - d0, y0, y1, Math.atan2(Math.cos(a), -Math.sin(a)));
}

/** A rect-and-semicircle opening outline (u, y): `w` wide, straight sides from y0 up to the spring at ys. */
function archOutline(u: number, w: number, y0: number, ys: number, n = 8): Ring {
  return [[u - w / 2, y0], [u + w / 2, y0], ...arc(u, ys, w / 2, 0, Math.PI, n)];
}

/** One corner tower: square shaft, clocks, round belvedere, ribbed copper dome, glazed lantern, gilt finial. */
function pragueTower(m: MeshBuilder, s: number): void {
  const cx = s * 15.5;
  const cz = 5.5;
  const front = wall("+z", 10);
  const back = wall("-z", 1);
  const outer = wall(s > 0 ? "+x" : "-x", cx + s * 4.2);
  const win: WindowStyle = { glass: "glazing", frame: "trim", cols: 2, transoms: [0.7], bar: 0.12, head: "trim" };
  m.scope("shaft", () => {
    m.box("stone", cx, cz, 8.4, 9, 0, 27, 0, false);
    m.box("trim", cx, cz, 9.1, 9.7, 0, 3);
    for (const y of [9.25, 17.25]) m.box("trim", cx, cz, 8.56, 9.16, y, y + 0.5);
    m.scope("corner pilasters", () => {
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) m.box("trim", cx + dx * 3.9, cz + dz * 4.2, 1.1, 1.1, 3, 26.8);
    });
  });
  m.scope("windows", () => {
    for (const y of [5.2, 12.2]) for (const k of [-1, 0, 1]) windowOn(m, front, cx + k * 2.4, y, 1.5, 2.6, win);
    for (const y of [5.2, 12.2, 19.2]) windowOn(m, back, cx, y, 1.5, 2.6, win);
    for (const y of [5.2, 12.2]) for (const k of [-1, 1]) windowOn(m, outer, cz + k * 2.2, y, 1.4, 2.6, win);
    // the tall balcony window of the upper stage
    windowOn(m, outer, cz, 18.3, 1.6, 4.2, { ...win, transoms: [0.35, 0.7] });
    m.box("trim", cx + s * 4.5, cz, 0.6, 2.4, 17.95, 18.2);
  });
  m.scope("clocks", () => {
    clock(m, front, cx, 21.2, 1.72, "gilt", "stone", "slate", 0.08);
    clock(m, wall(s > 0 ? "+x" : "-x", cx + s * 4.2), cz - 0.1, 23.6, 1.3, "gilt", "stone", "slate", 0.08);
  });
  m.scope("cornice", () => {
    m.box("trim", cx, cz, 10.2, 10.8, 27, 28.2);
    m.box("stone", cx, cz, 9.4, 10, 28.2, 29.6, 0, false);
    m.box("trim", cx, cz, 9.6, 10.2, 29.6, 29.8);
    // balusters: dark slits in the parapet
    for (const k of [-3, -2, -1, 0, 1, 2, 3]) {
      onWall(m, "slate", wall("+z", cz + 5), cx + k * 1.15 - 0.3, cx + k * 1.15 + 0.3, 28.5, 29.35, -0.04, 0.02);
      onWall(m, "slate", wall(s > 0 ? "+x" : "-x", cx + s * 4.7), cz + k * 1.25 - 0.3, cz + k * 1.25 + 0.3, 28.5, 29.35, -0.04, 0.02);
    }
  });
  m.scope("belvedere", () => {
    const n = 16;
    const r = 3.42;
    const ap = r * Math.cos(Math.PI / n);
    m.prism("stone", ngon(n, r, 0, cx, cz), 29.8, 32.6, false);
    for (let i = 0; i < n; i += 2) onRing(m, "glazing", n, i, ap, cx, cz, 0.85, 30.2, 32.1, -0.05, 0.04);
    for (let i = 1; i < n; i += 2) onRing(m, "trim", n, i, ap, cx, cz, 0.55, 29.8, 32.6, -0.05, 0.12);
    m.prism("trim", ngon(n, 3.95, 0, cx, cz), 32.6, 33.0);
  });
  m.scope("dome", () => {
    const n = 24;
    const prof: Array<[number, number]> = [[3.82, 33.0], [3.8, 33.7], [3.6, 34.6], [3.16, 35.5], [2.48, 36.3], [1.6, 36.95], [1.15, 37.3]];
    revolve(m, "copper", prof, n, cx, cz);
    m.scope("ribs", () => {
      for (let k = 0; k < 8; k++) {
        const a = ((k * 3 + 0.5) / n) * Math.PI * 2;
        const ca = Math.cos(a);
        const sa = -Math.sin(a);
        const t: Vec3 = [-sa * 0.14, 0, ca * 0.14];
        const P = (r: number, y: number): Vec3 => [cx + r * ca - t[0] / 2, y, cz + r * sa - t[2] / 2];
        for (let j = 0; j + 2 < prof.length; j++) {
          const [r0, y0] = prof[j]!;
          const [r1, y1] = prof[j + 1]!;
          m.slab("copperDark", [P(r0 - 0.08, y0), P(r1 - 0.08, y1), P(r1 + 0.1, y1), P(r0 + 0.1, y0)], t);
        }
      }
    });
  });
  m.scope("lantern", () => {
    m.prism("copper", ngon(12, 1.3, 0, cx, cz), 37.25, 37.75);
    m.prism("lantern", ngon(6, 0.95, 0, cx, cz), 37.75, 39.45, false);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      m.prism("copper", ngon(6, 0.1, 0, cx + 0.95 * Math.cos(a), cz - 0.95 * Math.sin(a)), 37.75, 39.45, false);
    }
    revolve(m, "copper", [[1.08, 39.45], [0.95, 39.8], [0.62, 40.15], [0.2, 40.45], [0.0, 40.5]], 12, cx, cz);
  });
  m.scope("finial", () => {
    m.prism("gilt", ngon(6, 0.07, 0, cx, cz), 40.3, 42.1, true);
    revolve(m, "gilt", [[0.0001, 40.26], [0.24, 40.36], [0.34, 40.6], [0.24, 40.84], [0.0, 40.94]], 8, cx, cz);
  });
}

/** One side wing: three storeys, an attic with a red panel, a slate mansard with dormers, an arcaded ground floor. */
function pragueWing(m: MeshBuilder, s: number): void {
  const cx = s * 25.5;
  const x0 = cx - 6;
  const x1 = cx + 6;
  const front = wall("+z", 7);
  const plinthFront = wall("+z", 7.25);
  const side = wall(s > 0 ? "+x" : "-x", cx + s * 6);
  const rear = wall("-z", -10);
  const win: WindowStyle = { glass: "glazing", frame: "trim", cols: 2, transoms: [0.7], bar: 0.12, head: "trim", sill: "trim" };
  m.scope("mass", () => {
    m.box("stone", cx, -1.5, 12, 17, 0, 16, 0, false);
    m.box("trim", cx, -1.5, 12.5, 17.5, 0, 2.8);
    m.box("trim", cx, -1.5, 13.4, 18.4, 16, 16.9);
    m.box("trim", cx, -1.5, 12.16, 17.16, 8.0, 8.35);
  });
  m.scope("attic", () => {
    m.box("stone", cx, -1.5, 11, 16, 16.9, 19.1, 0, false);
    onWall(m, "ochre", wall("+z", 6.5), cx - 4, cx + 4, 17.3, 18.7, -0.04, 0.07);
    for (const k of [-3, -1, 1, 3]) onWall(m, "trim", wall("+z", 6.5), cx + k * 0.9 - 0.12, cx + k * 0.9 + 0.12, 17.25, 18.75, -0.03, 0.11);
  });
  m.scope("mansard", () => {
    m.loft("slate", rect(11.2, 16.2, cx, -1.5), 19.05, rect(9.18, 13.28, cx, -1.5), 20.95, false);
    hipRoof(m, "slate", cx - 4.59, cx + 4.59, -8.14, 5.14, 20.9, 21.9, 0.15);
    m.scope("dormers", () => {
      for (const k of [-1, 0, 1]) {
        const x = cx + k * 3.4;
        m.box("trim", x, 5.7, 1.5, 1.2, 19.45, 20.95, 0, false);
        onWall(m, "glazing", wall("+z", 6.3), x - 0.5, x + 0.5, 19.6, 20.6, -0.04, 0.06);
        gableRoofZ(m, "slate", x - 0.9, x + 0.9, 5.0, 6.45, 20.85, 21.55, 0.12);
        m.sweep("trim", "z", [[x - 0.75, 20.94], [x + 0.75, 20.94], [x, 21.4]], 5.1, [[x - 0.75, 20.94], [x + 0.75, 20.94], [x, 21.4]], 6.3);
      }
    });
  });
  m.scope("windows", () => {
    // floors at about 3.3, 8.35 (the band) and 12.2: a 5 m piano nobile, then two 3.85 m storeys
    const tall = (y: number, top: number): number => (y > 12 ? 2.2 : y > 8 ? 2.6 : top);
    for (const y of [4.0, 9.0]) for (const x of [cx + s * 0.0, cx + s * 3.6]) windowOn(m, front, x, y, 1.7, tall(y, 3.0), win);
    for (const y of [12.9]) for (const x of [cx, cx + s * 3.6]) windowOn(m, front, x, y + 0.1, 1.7, 2.2, { ...win, head: undefined });
    for (const y of [4.0, 9.0, 12.9]) for (const u of [-6.1, -1.5, 3.1]) windowOn(m, side, u, y, 1.7, tall(y, 3.0), win);
    for (const y of [4.05, 9.05, 12.9]) for (const x of [x0 + 2.4, cx, x1 - 2.4]) windowOn(m, rear, x, y, 1.7, tall(y, 2.9), win);
  });
  m.scope("arcade", () => {
    for (const x of [cx, cx + s * 3.6, cx - s * 3.6]) {
      if (Math.abs(x) < 22.8) continue;
      wallSlab(m, "glazing", plinthFront, archOutline(x, 2.0, 0.3, 1.75), -0.04, 0.05);
      wallArc(m, "trim", plinthFront, x, 1.75, 1.0, 1.28, 0, Math.PI, 8, -0.02, 0.12);
    }
  });
}

/**
 * Prague main station, the art nouveau Fanta building: a central hall whose
 * front is one huge arched window under a stepped gable with red panels, two
 * corner towers with clocks, belvederes and domed copper caps, lower side wings
 * under slate mansards, and a green iron canopy over the entrance (+Z).
 */
export function pragueMainStation(): MeshBuilder {
  const m = new MeshBuilder(PRAGUE);
  const face = wall("+z", 8.6);
  const lower = wall("+z", 8.2);
  const gable = wall("+z", 7.4);
  const rear = wall("-z", -12.6);

  m.scope("central hall", () => {
    m.scope("mass", () => {
      m.box("stone", 0, -2.8, 26, 19.6, 0, 21.5, 0, false);
      m.box("trim", 0, -2.6, 26.8, 20.6, 0, 2.6);
      m.box("trim", 0, -2, 27.6, 22, 21.5, 22.5);
    });
    m.scope("facade", () => {
      // block() closes its boxes underneath: the ground-level ones start a few
      // millimetres apart so their bottoms never share a plane
      block(m, "stone", -13, -7.5, 0.02, 21.5, 7.4, 8.6);
      block(m, "stone", 7.5, 13, 0.02, 21.5, 7.4, 8.6);
      block(m, "stone", -7.5, 7.5, 19.5, 21.5, 7.4, 8.6);
      block(m, "stone", -7.5, 7.5, 0.02, 7.6, 7.4, 8.2);
      m.scope("spandrels", () => {
        const pts = arc(0, 12, 7.5, 0, Math.PI, 24);
        for (let k = 0; k < 24; k++) {
          const a = pts[k]!;
          const b = pts[k + 1]!;
          if (19.5 - Math.max(a[1], b[1]) < 1e-3 && 19.5 - Math.min(a[1], b[1]) < 0.02) continue;
          wallSlab(m, "stone", face, [a, b, [b[0], 19.5], [a[0], 19.5]], -1.2, 0);
        }
      });
      m.scope("pilasters", () => {
        for (const x of [-10.5, 10.5]) onWall(m, "trim", face, x - 0.7, x + 0.7, 2.6, 20, -0.15, 0.35);
        for (const x of [-12.55, 12.55]) onWall(m, "trim", face, x - 0.4, x + 0.4, 2.6, 21.4, -0.15, 0.2);
        onWall(m, "trim", face, -13.4, 13.4, 0.01, 2.6, -0.1, 0.12);
      });
      m.scope("archivolt", () => {
        wallArc(m, "trim", face, 0, 12, 7.45, 8.55, 0, Math.PI, 24, -0.6, 0.42);
        for (const x of [-8.0, 8.0]) onWall(m, "trim", face, x - 0.8, x + 0.8, 11.65, 12.35, -0.6, 0.45);
        onWall(m, "trim", face, -1.0, 1.0, 19.3, 21.3, -0.1, 0.55);
      });
    });
    m.scope("great window", () => {
      wallSlab(m, "glazing", wall("+z", 7.35), archOutline(0, 15, 7.6, 12, 24), -0.2, 0);
      m.scope("tracery", () => {
        for (let k = -5; k <= 5; k++) {
          const x = k * 1.25;
          const top = 12 + Math.sqrt(7.5 * 7.5 - x * x) - 0.05;
          block(m, "copper", x - 0.11, x + 0.11, 7.62, k === 0 ? top : Math.min(top, 12), 7.3, 7.6);
        }
        for (const y of [9.8, 12]) block(m, "copper", -7.6, 7.6, y - 0.11, y + 0.11, 7.41, 7.69);
        wallArc(m, "copper", wall("+z", 7.35), 0, 12, 4.6, 4.85, 0, Math.PI, 16, 0.08, 0.4);
        wallArc(m, "copper", wall("+z", 7.35), 0, 12, 7.2, 7.46, 0, Math.PI, 24, 0.07, 0.38);
        for (const deg of [22.5, 45, 67.5, 112.5, 135, 157.5]) {
          const a = (deg * Math.PI) / 180;
          const r0 = deg % 45 === 0 ? 0.3 : 4.85;
          const c = Math.cos(a);
          const sn = Math.sin(a);
          const n: [number, number] = [-sn * 0.1, c * 0.1];
          wallSlab(m, "copper", wall("+z", 7.35), [[r0 * c - n[0], 12 + r0 * sn - n[1]], [7.2 * c - n[0], 12 + 7.2 * sn - n[1]], [7.2 * c + n[0], 12 + 7.2 * sn + n[1]], [r0 * c + n[0], 12 + r0 * sn + n[1]]], 0.09, 0.36);
        }
      });
    });
    m.scope("doors", () => {
      for (const k of [-2, -1, 0, 1, 2]) {
        const x = k * 2.96;
        wallSlab(m, "glazing", lower, archOutline(x, 2.0, 0.04, 3.4), -0.05, 0.05);
        onWall(m, "ochre", lower, x - 1.25, x - 1.0, 0.06, 3.4, -0.03, 0.14);
        onWall(m, "ochre", lower, x + 1.0, x + 1.25, 0.06, 3.4, -0.03, 0.14);
        wallArc(m, "ochre", lower, x, 3.4, 1.0, 1.25, 0, Math.PI, 8, -0.03, 0.14);
        onWall(m, "copper", lower, x - 0.05, x + 0.05, 0.08, 3.4, 0.0, 0.1);
      }
    });
    m.scope("gable", () => {
      m.scope("screen", () => {
        const pieces: Ring[] = [
          [[-12.25, 22.3], [12.25, 22.3], [12.25, 25.2], [-12.25, 25.2]],
          [[-4.8, 25.2], [4.8, 25.2], [4.8, 31.5], [-4.8, 31.5]],
        ];
        for (const s of [-1, 1]) {
          pieces.push([[s * 8, 25.2], [s * 12.25, 25.2], [s * 8, 27.4]]);
          pieces.push([[s * 4.8, 25.2], [s * 8, 25.2], [s * 8, 27.4], [s * 4.8, 31.5]]);
        }
        for (const p of pieces) wallSlab(m, "stone", gable, p, -3, 0);
      });
      m.scope("red panels", () => {
        const fields: Ring[] = [
          [[-11.9, 22.8], [11.9, 22.8], [11.9, 24.9], [-11.9, 24.9]],
          [[-4.5, 25.5], [4.5, 25.5], [4.5, 31.1], [-4.5, 31.1]],
        ];
        for (const s of [-1, 1]) {
          fields.push([[s * 8.3, 25.5], [s * 11.3, 25.5], [s * 8.3, 27.04]]);
          fields.push([[s * 5.1, 25.5], [s * 7.7, 25.5], [s * 7.7, 27.4], [s * 5.1, 30.7]]);
        }
        for (const f of fields) wallSlab(m, "ochre", gable, f, -0.05, 0.08);
      });
      m.scope("windows", () => {
        for (const x of [-5.6, -2.2, 2.2, 5.6]) {
          onWall(m, "trim", gable, x - 0.95, x + 0.95, 22.85, 24.85, 0.04, 0.12);
          onWall(m, "glazing", gable, x - 0.75, x + 0.75, 23.0, 24.6, 0.08, 0.16);
          onWall(m, "trim", gable, x - 0.06, x + 0.06, 23.02, 24.58, 0.1, 0.2);
        }
        for (const x of [-1.5, 1.5]) {
          onWall(m, "trim", gable, x - 0.85, x + 0.85, 26.2, 28.6, 0.04, 0.12);
          onWall(m, "glazing", gable, x - 0.65, x + 0.65, 26.4, 28.4, 0.08, 0.16);
          onWall(m, "trim", gable, x - 0.06, x + 0.06, 26.42, 28.38, 0.1, 0.2);
        }
        for (const x of [-9.6, 9.6]) onWall(m, "trim", gable, x - 0.8, x + 0.8, 23.0, 24.7, 0.04, 0.3);
      });
      m.scope("crest", () => {
        wallSlab(m, "trim", gable, [[-1.3, 29.2], [1.3, 29.2], [1.3, 31.2], [0, 32.0], [-1.3, 31.2]], 0.04, 0.3);
        wallDisc(m, "gilt", gable, 0, 30.3, 0.5, 10, 0.2, 0.38);
        block(m, "trim", -4.85, 4.85, 31.45, 32.05, 4.0, 7.8);
      });
      m.scope("pinnacles", () => {
        const pin = (x: number, y0: number, y1: number, w: number): void => {
          block(m, "trim", x - w / 2, x + w / 2, y0, y1, 3.95, 7.85);
          m.spire("slate", rect(w * 0.8, 3.0, x, 5.9), y1, y1 + 1.2);
        };
        for (const s of [-1, 1]) {
          pin(s * 11.4, 24.5, 25.9, 1.8);
          pin(s * 8, 26.8, 28.0, 1.5);
          pin(s * 4.2, 29.8, 31.0, 1.5);
        }
      });
    });
    m.scope("hall roof", () => {
      const sec = arc(0, 13.5, 11.4, Math.asin((22.4 - 13.5) / 11.4), Math.PI - Math.asin((22.4 - 13.5) / 11.4), 14);
      m.sweep("slate", "z", sec, -12.35, sec, 5.15);
      const end = arc(0, 13.5, 11.5, Math.asin((22.45 - 13.5) / 11.5), Math.PI - Math.asin((22.45 - 13.5) / 11.5), 14);
      m.sweep("stone", "z", end, -12.55, end, -12.2);
      block(m, "copper", -0.8, 0.8, 24.8, 25.35, -12.3, 5.1);
      for (const x of [-5.1, -1.7, 1.7, 5.1]) {
        const top = 13.5 + Math.sqrt(11.5 * 11.5 - (Math.abs(x) + 0.25) ** 2) - 0.1;
        block(m, "trim", x - 0.25, x + 0.25, 21.4, top, -13.15, -12.65);
      }
      for (const s of [-1, 1]) block(m, "trim", s * 11.65, s * 13.15, 21.45, 22.35, -13.8, -12.2);
    });
    m.scope("rear windows", () => {
      const win: WindowStyle = { glass: "glazing", frame: "trim", cols: 2, transoms: [0.7], bar: 0.12, head: "trim" };
      for (const y of [3.05, 8.05, 13.05]) for (let k = -3; k <= 3; k++) windowOn(m, rear, k * 3.3, y, 1.7, 2.9, win);
      for (const s of [-1, 1]) {
        const sw = wall(s > 0 ? "+x" : "-x", s * 13);
        for (const u of [-10.2, -6.6, -3.0]) windowOn(m, sw, u, 14.5, 1.6, 3.0, win);
      }
    });
  });

  m.scope("entrance canopy", () => {
    const N = 10;
    const prof = (t: number, grow: number): [number, number] => [8.62 + grow / 2 + (4.72 + grow / 2) * Math.sin(t), 5.1 + (2.85 + grow) * Math.cos(t)];
    m.scope("shell", () => {
      for (let k = 0; k < N; k++) {
        const a = prof((k / N) * Math.PI / 2, 0);
        const b = prof(((k + 1) / N) * Math.PI / 2, 0);
        m.slab("copper", [[-12, a[1], a[0]], [-12, b[1], b[0]], [-12, b[1] - 0.12, b[0]], [-12, a[1] - 0.12, a[0]]], [24, 0, 0]);
      }
      block(m, "copper", -12, 12, 7.1, 7.7, 8.6, 8.75);
      block(m, "copper", -11.9, 11.9, 4.8, 5.15, 12.9, 13.3);
    });
    m.scope("ribs", () => {
      for (let i = 0; i < 17; i++) {
        const x = -11.6 + i * 1.45;
        for (let k = 0; k < N; k++) {
          const a = prof((k / N) * Math.PI / 2, 0.08);
          const b = prof(((k + 1) / N) * Math.PI / 2, 0.08);
          m.slab("copperDark", [[x - 0.06, a[1], a[0]], [x - 0.06, b[1], b[0]], [x - 0.06, b[1] - 0.12, b[0]], [x - 0.06, a[1] - 0.12, a[0]]], [0.12, 0, 0]);
        }
      }
    });
    m.scope("columns", () => {
      for (let i = 0; i < 7; i++) {
        const x = -11.1 + i * 3.7;
        m.prism("copper", ngon(8, 0.2, 0, x, 12.5), 0, 5.6, false);
        m.prism("copper", ngon(8, 0.32, 0, x, 12.5), 0, 0.5);
        const t = Math.asin((12.5 - 8.62) / 4.72);
        m.loft("copper", ngon(8, 0.2, 0, x, 12.5), 5.6, ngon(8, 0.42, 0, x, 12.5), 5.1 + 2.85 * Math.cos(t) - 0.08, false);
      }
    });
  });

  for (const s of [-1, 1]) {
    m.scope(s < 0 ? "west tower" : "east tower", () => pragueTower(m, s));
    m.scope(s < 0 ? "west wing" : "east wing", () => pragueWing(m, s));
    m.scope(s < 0 ? "west link" : "east link", () => {
      m.box("stone", s * 20.2, -0.7, 4.2, 14.6, 0, 13, 0, false);
      m.box("trim", s * 20.2, -0.7, 4.4, 14.8, 0, 2.6);
      m.box("trim", s * 20.2, -0.7, 4.6, 15.0, 13, 13.8);
    });
  }
  return m;
}

// --- the catalog -------------------------------------------------------------------

/** The catalog fields of the family (meta.json, catalog.ts); a design may override the scale. */
export const STATION_CATALOG: CatalogFields = {
  category: "Station",
  group: "station",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Every design of the family, by catalog id; `references` is the folder of its source photos under assets/. */
export const STATIONS: ProceduralDesign[] = [
  { id: "bld-prague-main-station", title: "Prague Main Station", build: pragueMainStation, buildLod: pragueMainStationLod, references: "prague-main-station", catalog: { ...STATION_CATALOG, defaultScale: 1 } },
  { id: "bld-station-building", title: "Station Building", build: stationBuilding, buildLod: stationBuildingLod, references: "station-building", catalog: { ...STATION_CATALOG, defaultScale: 1 } },
  { id: "bld-station-halt", title: "Station Halt", build: stationHalt, buildLod: stationHaltLod, references: "station-halt", catalog: { ...STATION_CATALOG, defaultScale: 1 } },
  { id: "bld-suburban-station", title: "Suburban Station", build: suburbanStation, buildLod: suburbanStationLod, references: "suburban-station", catalog: { ...STATION_CATALOG, defaultScale: 1 } },
];
