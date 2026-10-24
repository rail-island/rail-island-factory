// The dedicated low level of detail of the stations (stations.ts): see lodBuildings.ts and
// docs/models/lod.md. No windows; masses, roofs and the kit's colours.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { lodHipRoof, lodNgon, lodPolygon, type LodPart } from "./lodKit.ts";
import { HALT, HOTEL, PRAGUE, STUCCO, SUBURBAN } from "./stations.ts";
import { type XY, bounds, distinct, faceQuad, lodPost, lodBox, part, fit, lodRect, lodWalls, lodCap, lodFrustum, lodSpire, lodRevolve, lodPlate, lodGable } from "./lodBuildings.ts";

// --- the stations (stations.ts) ---------------------------------------------------------------

/** The Mikulasovice halt: a stucco block under a red hip roof, a gabled centre bay and a platform canopy on posts. */
export function stationHaltLod(): MeshBuilder {
  const parts: LodPart[] = [
    part((m) => {
      lodWalls(m, lodRect(0, -1.73, 18, 8), [[0, 0.55, "plinth"], [0.55, 6.95, "stucco"]]);
      lodHipRoof(m, "tile", -9.7, 9.7, -6.43, 2.97, 6.95, 9.45, 4.7);
      lodWalls(m, lodRect(0, -1.73, 19.4, 9.4), [[6.73, 6.95, "tile"]]);
      // the centre bay: its walls, its gable and its own gable roof
      lodWalls(m, lodRect(0, 2.52, 6.8, 0.5), [[0, 0.55, "plinth"], [0.55, 7.4, "stucco"]], [0]);
      lodGable(m, { cx: 0, cz: 0.52, w: 6.8, d: 4.5, axis: "z", eave: 7.4, top: 7.12 + 0.6 * (2.33 / 4), pitch: 2.33 / 4, oh: 0.6, ends: [0, 0.33], t: 0.2, roof: "tile", rake: "timber", gable: "stucco", gables: [false, true] });
      // the platform canopy
      lodPolygon(m, "tile", [[-9.6, 4.16, 2.3], [9.6, 4.16, 2.3], [9.6, 3.66, 6.5], [-9.6, 3.66, 6.5]], [0, 4.2, 0.5]);
      faceQuad(m, "timber", (u, y) => [u, y, 6.56], -9.6, 9.6, 3.38, 3.66, [0, 0, 1]);
    }),
    // the blue name board on the bay
    part((m) => faceQuad(m, "sign", (u, y) => [u, y, 2.92], -1.78, 1.78, 6.28, 6.98, [0, 0, 1]), 6),
    part((m) => { for (const x of [-5.6, 5.6]) lodBox(m, "brick", x, -2.13, 0.86, 0.75, 7.6, 10.46, "plinth"); }, 4),
    // the corner pilasters in brick
    part((m) => {
      for (const s of [-1, 1]) {
        faceQuad(m, "brick", (u, y) => [u, y, 2.36], s > 0 ? 8.1 : -9.1, s > 0 ? 9.1 : -8.1, 0.6, 6.85, [0, 0, 1]);
        faceQuad(m, "brick", (u, y) => [s * 9.09, y, u], 1.27, 2.36, 0.6, 6.85, [s, 0, 0]);
        faceQuad(m, "brick", (u, y) => [u, y, 2.86], s > 0 ? 2.7 : -3.5, s > 0 ? 3.5 : -2.7, 0.6, 7.3, [0, 0, 1]);
      }
    }, 3),
  ];
  // the canopy posts, every other one first
  [[-9.0, 9.0], [-3.0, 3.0], [-6.0, 6.0]].forEach((xs, i) => parts.push(part((m) => { for (const x of xs) lodPost(m, "post", x, 6.15, 0.14, 0, 3.5); }, 5 - i)));
  return fit(HALT, parts);
}

/** The ochre stucco station: a long block under a hip roof, the central pavilion, the end pavilion and the platform canopy. */
export function stationBuildingLod(): MeshBuilder {
  const parts: LodPart[] = [
    part((m) => {
      // the long block: its east end is in the end pavilion
      lodWalls(m, lodRect(-2.29, -1.43, 22.0, 7.0), [[0, 0.62, "stone"], [0.62, 4.37, "ochre"]], [1]);
      lodHipRoof(m, "tile", -13.89, 9.31, -5.62, 2.72, 4.37, 5.52, 4.17);
      // the pavilion: walls over the long block's roof, a gable to the platform and a hip behind
      // (its sides show only over the long block)
      lodWalls(m, lodRect(-0.29, -1.18, 6.4, 7.9), [[0, 0.62, "stone"], [0.62, 6.75, "ochre"], [6.75, 6.97, "plaster"]], [1, 3]);
      lodWalls(m, lodRect(-0.29, -1.18, 6.4, 7.9), [[4.37, 6.75, "ochre"], [6.75, 6.97, "plaster"]], [0, 2]);
      const [x0, x1, z0, z1, y0, y1, xc] = [-4.04, 3.46, -5.62, 3.27, 6.85, 8.45, -0.29];
      lodPolygon(m, "tile", [[x1, y0, z0], [x1, y0, z1], [xc, y1, z1], [xc, y1, z0 + 2.6]], [1, 1, 0]);
      lodPolygon(m, "tile", [[x0, y0, z1], [x0, y0, z0], [xc, y1, z0 + 2.6], [xc, y1, z1]], [-1, 1, 0]);
      lodPolygon(m, "tile", [[x0, y0, z0], [x1, y0, z0], [xc, y1, z0 + 2.6]], [0, 1, -1]);
      lodPolygon(m, "ochre", [[xc - 3.0, 6.97, 2.77], [xc + 3.0, 6.97, 2.77], [xc, y1 - 0.2, 2.77]], [0, 0, 1]);
      lodPolygon(m, "green", [[x0, y0, z1 + 0.01], [xc, y1, z1 + 0.01], [xc, y1 - 0.3, z1 + 0.01], [x0, y0 - 0.3, z1 + 0.01]], [0, 0, 1]);
      lodPolygon(m, "green", [[xc, y1, z1 + 0.01], [x1, y0, z1 + 0.01], [x1, y0 - 0.3, z1 + 0.01], [xc, y1 - 0.3, z1 + 0.01]], [0, 0, 1]);
      // the end pavilion under its own gable roof
      lodWalls(m, lodRect(10.91, -0.73, 4.6, 8.8), [[0, 0.62, "stone"], [0.62, 4.77, "ochre"]]);
      lodGable(m, { cx: 10.91, cz: -0.73, w: 4.6, d: 8.8, axis: "z", eave: 4.77, top: 4.67 + 0.65 * (1.45 / 2.95), pitch: 1.45 / 2.95, oh: 0.65, ends: [0.67, 0.73], t: 0.3, roof: "tile", rake: "green", gable: "ochre" });
      // the platform canopy and its green valance
      lodPolygon(m, "canopy", [[-13.69, 3.78, 1.95], [8.91, 3.78, 1.95], [8.91, 3.28, 5.85], [-13.69, 3.28, 5.85]], [0, 3.9, 0.5]);
      faceQuad(m, "green", (u, y) => [u, y, 5.9], -13.69, 8.91, 2.92, 3.28, [0, 0, 1]);
    }),
    part((m) => lodBox(m, "ochre", -2.19, -3.33, 0.66, 0.66, 7.3, 8.64, "stone"), 4),
  ];
  // the canopy posts, flat to the platform, the end ones first
  [[0, 7], [3, 4], [1, 6], [2, 5]].forEach((is, k) => parts.push(part((m) => {
    for (const i of is) faceQuad(m, "wood", (u, y) => [u, y, 5.72], -12.79 + i! * 3 - 0.1, -12.79 + i! * 3 + 0.1, 0, 3.0, [0, 0, 1]);
  }, 5 - k)));
  return fit(STUCCO, parts);
}

/** The red-brick suburban station: two flat-roofed wings, the tall hall with its attic and clock tower, the street canopy. */
export function suburbanStationLod(): MeshBuilder {
  const parts: LodPart[] = [
    part((m) => {
      lodWalls(m, lodRect(0, 0, 24, 10), [[0, 0.45, "stone"], [0.45, 6.58, "brick"], [6.58, 7.0, "trim"]]);
      lodCap(m, "roof", lodRect(0, 0, 24, 10), 7.0);
      lodWalls(m, lodRect(0, 0, 10, 10), [[7.0, 9.7, "brick"], [9.7, 10.2, "trim"]]);
      lodCap(m, "roof", lodRect(0, 0, 10, 10), 10.2);
      lodBox(m, "trim", 0, 0, 7, 8.6, 10.2, 11.42);
      lodBox(m, "trim", 0, 2.9, 4.4, 2.8, 11.42, 13.88);
      // the street canopy, a slab on posts
      lodBox(m, "trim", 0, 6.5, 24.8, 3.0, 4.2, 4.5);
      lodCap(m, "trim", lodRect(0, 6.5, 24.8, 3.0), 4.2, false);
      lodPolygon(m, "forecourt", [[-12.6, 0.3, 5.32], [12.6, 0.3, 5.32], [12.6, 0.3, 8.3], [-12.6, 0.3, 8.3]], [0, 1, 0]);
      faceQuad(m, "forecourt", (u, y) => [u, y, 8.3], -12.6, 12.6, 0, 0.3, [0, 0, 1]);
    }),
  ];
  // the clock face on the tower and the hall's string course
  parts.push(part((m) => {
    const ring = lodNgon(8, 0.85, 0, 12.65, Math.PI / 8);
    lodPolygon(m, "clockFace", ring.map(([x, y]): Vec3 => [x, y, 4.36]), [0, 0, 1]);
  }, 6));
  parts.push(part((m) => faceQuad(m, "trim", (u, y) => [u, y, 5.06], -5.1, 5.1, 4.9, 5.2, [0, 0, 1]), 2));
  [[0, 8], [4], [2, 6], [1, 7], [3, 5]].forEach((is, k) => parts.push(part((m) => {
    for (const i of is) lodPost(m, "trim", -11.6 + i! * 2.9, 7.75, 0.14, 0.3, 4.2);
  }, 5 - k * 0.5)));
  return fit(SUBURBAN, parts);
}

/** Prague main station: the central hall with its arched front and gable, the two domed towers, the links and the mansard wings. */
export function pragueMainStationLod(): MeshBuilder {
  const BIG = 500;
  const parts: LodPart[] = [];
  // the central hall
  parts.push(part((m) => {
    lodWalls(m, lodRect(0, -2.8, 26, 19.6), [[0, 2.6, "trim"], [2.6, 21.5, "stone"]], [2]);
    lodWalls(m, lodRect(0, -2, 27.6, 22), [[21.5, 22.5, "trim"]]);
    lodCap(m, "trim", lodRect(0, -2, 27.6, 22), 22.5);
    // the front: piers, lintel, the lower block of the doors and the great arch's recess
    const z = 8.6, n: Vec3 = [0, 0, 1];
    for (const s of [-1, 1]) {
      faceQuad(m, "trim", (u, y) => [s * u, y, z], 7.5, 13, 0, 2.6, [0, 0, 1]);
      faceQuad(m, "stone", (u, y) => [s * u, y, z], 7.5, 13, 2.6, 21.5, [0, 0, 1]);
      // the step from the piers back to the doors' block
      lodPolygon(m, "stone", [[s * 7.5, 0, 8.2], [s * 7.5, 0, z], [s * 7.5, 7.6, z], [s * 7.5, 7.6, 8.2]], [-s, 0, 0]);
    }
    faceQuad(m, "stone", (u, y) => [u, y, z], -7.5, 7.5, 19.5, 21.5, n);
    faceQuad(m, "trim", (u, y) => [u, y, 8.2], -7.5, 7.5, 0, 2.6, n);
    faceQuad(m, "stone", (u, y) => [u, y, 8.2], -7.5, 7.5, 2.6, 7.6, n);
    lodCap(m, "stone", [[-7.5, 7.4], [7.5, 7.4], [7.5, 8.2], [-7.5, 8.2]], 7.6);
    const k = 6, arc = Array.from({ length: k + 1 }, (_, i): XY => [7.5 * Math.cos(Math.PI - (i * Math.PI) / k), 12 + 7.5 * Math.sin(Math.PI - (i * Math.PI) / k)]);
    for (let i = 0; i < k; i++) {
      const [a, b] = [arc[i]!, arc[i + 1]!];
      // the spandrel over the arc, the arch's soffit back to the recess
      lodPolygon(m, "stone", distinct([[a[0], a[1], z], [b[0], b[1], z], [b[0], 19.5, z], [a[0], 19.5, z]]), n);
      lodPolygon(m, "trim", [[a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], 7.4], [a[0], a[1], 7.4]], [-(a[0] + b[0]) / 2, 12 - (a[1] + b[1]) / 2, 0]);
    }
    lodPolygon(m, "trim", [[-7.5, 7.6, z], [-7.5, 12, z], [-7.5, 12, 7.4], [-7.5, 7.6, 7.4]], [1, 0, 0]);
    lodPolygon(m, "trim", [[7.5, 7.6, z], [7.5, 12, z], [7.5, 12, 7.4], [7.5, 7.6, 7.4]], [-1, 0, 0]);
    // the recess's back wall
    lodPolygon(m, "trim", arc.map(([x, y]): Vec3 => [x, y, 7.4]), n);
    faceQuad(m, "trim", (u, y) => [u, y, 7.4], -7.5, 7.5, 7.6, 12, n);
    // the hall's barrel roof and its stone rear gable
    const sec = Array.from({ length: 7 }, (_, i): XY => {
      const a0 = Math.asin((22.4 - 13.5) / 11.4), a = a0 + (i * (Math.PI - 2 * a0)) / 6;
      return [11.4 * Math.cos(a), 13.5 + 11.4 * Math.sin(a)];
    });
    // its front end is behind the gable screen
    lodPlate(m, "slate", sec, 5.15, -12.35, false);
  }));
  // the archivolt round the great arch
  parts.push(part((m) => {
    const k = 6, at = (r: number, i: number): Vec3 => [r * Math.cos(Math.PI - (i * Math.PI) / k), 12 + r * Math.sin(Math.PI - (i * Math.PI) / k), 9.02];
    for (let i = 0; i < k; i++) lodPolygon(m, "trim", [at(7.5, i), at(7.5, i + 1), at(8.55, i + 1), at(8.55, i)], [0, 0, 1]);
  }, 5));
  // the gable screen with its red panels
  parts.push(part((m) => {
    const pieces: XY[][] = [[[-12.25, 22.3], [12.25, 22.3], [12.25, 25.2], [-12.25, 25.2]],
      [[-8, 25.2], [8, 25.2], [8, 27.4], [4.8, 31.5], [-4.8, 31.5], [-8, 27.4]],
      [[8, 25.2], [12.25, 25.2], [8, 27.4]], [[-8, 25.2], [-8, 27.4], [-12.25, 25.2]]];
    // the pieces' edges against each other are left out; the lowest piece's back is behind the hall roof
    lodPlate(m, "stone", pieces[0]!, 4.4, 7.4, false, [2]);
    lodPlate(m, "stone", pieces[1]!, 4.4, 7.4, true, [1, 5]);
    lodPlate(m, "stone", pieces[2]!, 4.4, 7.4, true, [2]);
    lodPlate(m, "stone", pieces[3]!, 4.4, 7.4, true, [0]);
    const fields: XY[][] = [[[-11.9, 22.8], [11.9, 22.8], [11.9, 24.9], [-11.9, 24.9]], [[-4.5, 25.5], [4.5, 25.5], [4.5, 31.1], [-4.5, 31.1]]];
    for (const s of [-1, 1]) {
      fields.push([[s * 8.3, 25.5], [s * 11.3, 25.5], [s * 8.3, 27.04]]);
      fields.push([[s * 5.1, 25.5], [s * 7.7, 25.5], [s * 7.7, 27.4], [s * 5.1, 30.7]]);
    }
    for (const f of fields) lodPolygon(m, "ochre", f.map(([x, y]): Vec3 => [x, y, 7.48]), [0, 0, 1]);
  }));
  parts.push(part((m) => {
    for (const s of [-1, 1]) for (const [x, y0, y1, w] of [[11.4, 24.5, 25.9, 1.8], [8, 26.8, 28.0, 1.5]] as const) {
      lodBox(m, "trim", s * x, 5.9, w, 3.9, y0, y1);
      lodSpire(m, "slate", lodRect(s * x, 5.9, w * 0.8, 3.0), y1, y1 + 1.2);
    }
  }, 6));
  // the copper entrance canopy on its columns
  parts.push(part((m) => {
    const prof = (t: number): XY => [8.62 + 4.72 * Math.sin(t), 5.1 + 2.85 * Math.cos(t)];
    for (let k = 0; k < 4; k++) {
      const [a, b] = [prof((k / 4) * Math.PI / 2), prof(((k + 1) / 4) * Math.PI / 2)];
      lodPolygon(m, "copper", [[-12, a[1], a[0]], [12, a[1], a[0]], [12, b[1], b[0]], [-12, b[1], b[0]]], [0, a[1] - b[1], b[0] - a[0]]);
    }
  }, 7));
  // its columns, flat to the street
  parts.push(part((m) => { for (let i = 0; i < 7; i++) faceQuad(m, "copper", (u, y) => [u, y, 12.5], -11.1 + i * 3.7 - 0.25, -11.1 + i * 3.7 + 0.25, 0, 5.4, [0, 0, 1]); }, 7.5));
  // the towers
  for (const s of [-1, 1]) {
    const cx = s * 15.5, cz = 5.5;
    parts.push(part((m) => {
      lodWalls(m, lodRect(cx, cz, 8.4, 9), [[0, 3, "trim"], [3, 27, "stone"], [27, 29.8, "trim"]]);
      lodCap(m, "trim", lodRect(cx, cz, 8.4, 9), 29.8);
      lodWalls(m, lodNgon(8, 3.42, cx, cz, Math.PI / 8), [[29.8, 32.6, "stone"]]);
      lodWalls(m, lodNgon(8, 3.95, cx, cz, Math.PI / 8), [[32.6, 33.0, "trim"]]);
      // the dome, open at its crown under the lantern, and the lantern
      lodRevolve(m, "copper", 8, cx, cz, [[3.95, 33.0], [3.2, 35.5], [1.15, 37.3]], Math.PI / 8, false);
      lodWalls(m, lodNgon(6, 1.12, cx, cz), [[37.0, 39.45, "copper"]]);
      lodRevolve(m, "copper", 6, cx, cz, [[1.25, 39.45], [0, 40.5]]);
      lodSpire(m, "gilt", lodNgon(4, 0.2, cx, cz), 40.4, 42.1);
    }));
  }
  // the links and the mansard wings
  for (const s of [-1, 1]) {
    parts.push(part((m) => {
      // only the link's back and its face behind the tower show
      lodWalls(m, lodRect(s * 20.2, -0.7, 4.2, 14.6), [[0, 2.6, "trim"], [2.6, 13, "stone"], [13, 13.8, "trim"]], [2, s > 0 ? 1 : 3]);
      lodCap(m, "trim", lodRect(s * 20.2, -0.7, 4.2, 14.6), 13.8);
      const cx = s * 25.5;
      lodWalls(m, lodRect(cx, -1.5, 12, 17), [[0, 2.8, "trim"], [2.8, 16, "stone"], [16, 16.9, "trim"]]);
      lodCap(m, "trim", lodRect(cx, -1.5, 12, 17), 16.9);
      lodWalls(m, lodRect(cx, -1.5, 11, 16), [[16.9, 19.05, "stone"]]);
      lodFrustum(m, "slate", bounds(cx, -1.5, 11.2, 16.2), 19.05, bounds(cx, -1.5, 9.18, 13.28), 20.95, null);
      lodHipRoof(m, "slate", cx - 4.59, cx + 4.59, -8.14, 5.14, 20.95, 21.9, 4.59);
    }));
    parts.push(part((m) => lodWalls(m, lodRect(s * 25.5, -1.5, 12.16, 17.16), [[8.0, 8.35, "trim"]]), 2));
    parts.push(part((m) => {
      for (const k of [-1, 0, 1]) {
        const x = s * 25.5 + k * 3.4;
        lodWalls(m, lodRect(x, 5.7, 1.5, 1.2), [[19.45, 20.95, "trim"]], [0]);
        lodFrustum(m, "slate", bounds(x, 5.725, 1.8, 1.45), 20.85, bounds(x, 5.725, 0.08, 1.45), 21.55, null);
      }
    }, 3));
    parts.push(part((m) => {
      for (const y of [9.25, 17.25]) lodWalls(m, lodRect(s * 15.5, 5.5, 8.56, 9.16), [[y, y + 0.5, "trim"]]);
    }, 1));
  }
  return fit(PRAGUE, parts, BIG);
}

/** The station hotel: the slate-roofed block, the taller corner pavilion under its steep hip, the entrance canopy. */
export function stationHotelLod(): MeshBuilder {
  const parts: LodPart[] = [
    part((m) => {
      lodWalls(m, lodRect(0, 0, 36, 12), [[0, 0.8, "plinth"], [0.8, 11.2, "plaster"], [11.2, 11.8, "stone"]]);
      lodHipRoof(m, "slate", -18.4, 18.4, -6.4, 6.4, 11.8, 15.6, 6.4);
      lodWalls(m, lodRect(-10, 0.15, 8, 12.9), [[0, 0.8, "plinth"], [0.8, 15.0, "plaster"], [15.0, 15.6, "stone"]]);
      lodHipRoof(m, "slate", -14.45, -5.55, -6.85, 7.15, 15.6, 21.0, 3.6);
      lodPolygon(m, "iron", [[-13.2, 4.0, 6.6], [-6.8, 4.0, 6.6], [-6.8, 3.7, 9.4], [-13.2, 3.7, 9.4]], [0, 1, 0.1]);
    }),
    part((m) => { for (const x of [-16, 2, 12]) lodBox(m, "brick", x, -1.2, 0.9, 1.6, 13.5, 17.45, "stone"); }, 3),
  ];
  return fit(HOTEL, parts);
}
