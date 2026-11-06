// The general hospital (docs/models/hospital.md): a six-storey ward block, a two-storey
// treatment wing with the main entrance, the emergency department with its canopy and
// ambulance bay, a red cross on the facade, a blue "H" sign at the drive, rooftop plant
// and a raised rooftop helipad - the air-ambulance stop the game reads from
// `game.helipad` (docs/models/game-properties.md, "Helipads"). Real-size metres, +Y up,
// the ground at y = 0, the street side facing +Z.
//
// No node: imports: bundled into the standalone JS model.

import { MeshBuilder, ngon } from "./meshBuilder.ts";
import type { CatalogFields, ParamValues, ProceduralDesign } from "./design.ts";
import { lodBox } from "./lodPrimitives.ts";

const PALETTE = {
  paving: { color: "#b9b7ae", roughness: 0.95 },
  asphalt: { color: "#45474b", roughness: 0.9 },
  grass: { color: "#6f9350", roughness: 1 },
  roadPaint: { color: "#e6e3d8" },
  bayPaint: { color: "#e2b42a" },
  wall: { color: "#ece9e1", roughness: 0.85 },
  plinth: { color: "#8f9189", roughness: 0.9 },
  glass: { color: "#5d8aa2", metallic: 0.35, roughness: 0.25 },
  frame: { color: "#3a4047", metallic: 0.3 },
  accent: { color: "#4e9a93", roughness: 0.7 },
  roof: { color: "#7c8084", roughness: 0.95 },
  plant: { color: "#b4b8b9", roughness: 0.7 },
  louvre: { color: "#4b5257", metallic: 0.3 },
  steel: { color: "#5a636b", metallic: 0.45 },
  canopy: { color: "#f3f2ee", roughness: 0.6 },
  red: { color: "#c8202a" },
  signWhite: { color: "#f6f6f2" },
  signBlue: { color: "#1f58a8" },
  ambulance: { color: "#f1f0ea", roughness: 0.4 },
  stripe: { color: "#d7262e" },
  beacon: { color: "#2d5fd8" },
  tyre: { color: "#1f2124", roughness: 0.9 },
  cabGlass: { color: "#26313a", metallic: 0.4 },
  trunk: { color: "#6b5138" },
  leaves: { color: "#4f7d3a", roughness: 1 },
  // the touchdown surface (GameProperties.helipad): drawn in nothing else
  helipad: { color: "#4e545b", roughness: 0.8 },
  helipadPaint: { color: "#f1f0ea" },
  helipadMark: { color: "#e8b428" },
  helipadCross: { color: "#c8202a" },
  helipadLight: { color: "#3cc85a" },
  net: { color: "#2e3236", roughness: 0.9 },
};

type Mat = keyof typeof PALETTE;
const model = (): MeshBuilder => new MeshBuilder(PALETTE);

/** The site's paving top: every building stands on it. */
const G = 0.15;
/** The ward block's floor levels (m): the ground floor, then five upper storeys of 3.9 m. */
const WARD_FLOORS = [G, 4.8, 8.7, 12.6, 16.5, 20.4] as const;
/** The ward block's roof (the top of its glass core) and its parapet's top. */
const WARD_ROOF = 24.3;
const WARD_PARAPET = 25.5;
/** The roof slab's top: what the rooftop plant and the helipad's columns stand on. */
const WARD_DECK = WARD_ROOF + 0.4;

/** The helipad: a square deck HELIPAD_SIDE across (a small pad, HELIPAD_D.small 16 m, with its safety area), raised over the roof. */
export const HOSPITAL_HELIPAD = { x: -14, z: -9, side: 20, y0: 28, y1: 28.4 } as const;

type Face = "front" | "back" | "left" | "right";

interface Block {
  x0: number; x1: number; z0: number; z1: number;
  /** Floor levels, the ground floor's first. */
  floors: readonly number[];
  roof: number;
  parapet: number;
  /** The faces that carry the pier-and-band facade, with the bay width. */
  faces: readonly Face[];
  bay: number;
  /** A seed for the accent panels; none when absent. */
  accents?: number;
}

/** A box `t` deep set `off` in from `face`'s outer plane, centred at `u` along it, `len` long. */
function faceBox(m: MeshBuilder, mat: Mat, b: Block, face: Face, u: number, len: number, off: number, t: number, y0: number, y1: number, top = true): void {
  if (face === "front") m.box(mat, u, b.z1 - off - t / 2, len, t, y0, y1, 0, top);
  else if (face === "back") m.box(mat, u, b.z0 + off + t / 2, len, t, y0, y1, 0, top);
  else if (face === "right") m.box(mat, b.x1 - off - t / 2, u, t, len, y0, y1, 0, top);
  else m.box(mat, b.x0 + off + t / 2, u, t, len, y0, y1, 0, top);
}

function faceSpan(b: Block, face: Face): [number, number] {
  return face === "front" || face === "back" ? [b.x0, b.x1] : [b.z0, b.z1];
}

/** The bay lines of a face: evenly spaced, about `bay` apart, the corners included. */
function bayLines(b: Block, face: Face): number[] {
  const [u0, u1] = faceSpan(b, face);
  const n = Math.max(1, Math.round((u1 - u0) / b.bay));
  return Array.from({ length: n + 1 }, (_, i) => u0 + ((u1 - u0) * i) / n);
}

const INSET = 0.3;
const PIER = 0.45;

/**
 * A modern block: a glass core set INSET behind white floor bands and piers, a
 * concrete plinth, the roof slab inside a parapet, mullions in every bay and, where
 * `accents` is set, teal spandrel panels in a fixed pattern of bays.
 */
function block(m: MeshBuilder, b: Block): void {
  const w = b.x1 - b.x0;
  const d = b.z1 - b.z0;
  const cx = (b.x0 + b.x1) / 2;
  const cz = (b.z0 + b.z1) / 2;
  m.scope("core and roof", () => {
    m.box("glass", cx, cz, w - 2 * INSET, d - 2 * INSET, 0.7, b.roof, 0, false);
    m.box("plinth", cx, cz, w, d, G, 0.7);
    m.box("roof", cx, cz, w - 2 * INSET, d - 2 * INSET, b.roof, b.roof + 0.4);
  });
  m.scope("floor bands and parapet", () => {
    for (const f of b.floors.slice(1)) m.box("wall", cx, cz, w, d, f - 0.5, f + 0.9);
    const t = 0.4;
    m.box("wall", cx, b.z1 - t / 2, w, t, b.roof, b.parapet);
    m.box("wall", cx, b.z0 + t / 2, w, t, b.roof, b.parapet);
    m.box("wall", b.x0 + t / 2, cz, t, d - 2 * t, b.roof, b.parapet);
    m.box("wall", b.x1 - t / 2, cz, t, d - 2 * t, b.roof, b.parapet);
  });
  m.scope("piers and mullions", () => {
    for (const face of b.faces) {
      const lines = bayLines(b, face);
      const [u0, u1] = faceSpan(b, face);
      for (const u of lines) {
        const c = Math.min(u1 - PIER / 2, Math.max(u0 + PIER / 2, u));
        faceBox(m, "wall", b, face, c, PIER, 0, INSET, 0.7, b.roof, false);
      }
      for (let i = 0; i + 1 < lines.length; i++) {
        const mid = (lines[i]! + lines[i + 1]!) / 2;
        faceBox(m, "frame", b, face, mid, 0.1, INSET - 0.12, 0.12, 0.7, b.roof, false);
      }
    }
  });
  if (b.accents !== undefined) m.scope("spandrel panels", () => {
    for (const face of b.faces) {
      const lines = bayLines(b, face);
      for (let f = 1; f + 1 < b.floors.length + 1; f++) {
        const y0 = b.floors[f]! + 0.9;
        const y1 = (b.floors[f + 1] ?? b.roof) - 0.5;
        for (let i = 0; i + 1 < lines.length; i++) {
          if ((i * 3 + f * 2 + b.accents!) % 7 !== 0) continue;
          const mid = (lines[i]! + lines[i + 1]!) / 2;
          const len = lines[i + 1]! - lines[i]! - PIER;
          faceBox(m, "accent", b, face, mid, len, INSET - 0.1, 0.08, y0, y1);
        }
      }
    }
  });
}

const WARD: Block = { x0: -28, x1: 28, z0: -18, z1: 0, floors: WARD_FLOORS, roof: WARD_ROOF, parapet: WARD_PARAPET, faces: ["front", "back", "left", "right"], bay: 3.5, accents: 2 };
const WING: Block = { x0: -28, x1: 4, z0: 0, z1: 16, floors: [G, 4.8], roof: 8.7, parapet: 9.9, faces: ["front", "left", "right"], bay: 3.5, accents: 5 };

/** The emergency department: a single storey of white wall, its ambulance doors under the canopy. */
function emergency(m: MeshBuilder): void {
  const x0 = 4, x1 = 28, z0 = 0, z1 = 9, top = 5.2, parapet = 6;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
  m.scope("emergency department", () => {
    m.scope("walls and roof", () => {
      m.box("wall", cx, cz, w, d, G, top, 0, false);
      m.box("roof", cx, cz, w - 0.8, d - 0.8, top - 0.4, top);
      const t = 0.4;
      m.box("wall", cx, z1 - t / 2, w, t, top, parapet);
      m.box("wall", cx, z0 + t / 2, w, t, top, parapet);
      m.box("wall", x1 - t / 2, cz, t, d - 2 * t, top, parapet);
      m.box("wall", x0 + t / 2, cz, t, d - 2 * t, top, parapet);
      m.box("plinth", cx, cz, w + 0.1, d + 0.1, G, 0.6);
    });
    m.scope("ambulance doors", () => {
      for (const x of [13, 21]) {
        m.box("frame", x, z1 + 0.03, 3.8, 0.06, 0.6, 3.5);
        m.box("glass", x, z1 + 0.07, 3.2, 0.04, 0.6, 3.2);
        m.box("frame", x, z1 + 0.1, 0.08, 0.04, 0.6, 3.2);
      }
    });
    m.scope("windows", () => {
      m.box("glass", 6, z1 + 0.04, 3, 0.08, 1.2, 3.6);
      for (const z of [2.2, 6.6]) m.box("glass", x1 + 0.04, z, 0.08, 3.2, 1.2, 3.6);
    });
    m.scope("canopy", () => {
      const c0 = 8, c1 = 26, front = 16.2, y0 = 4.5, y1 = 4.9;
      m.box("canopy", (c0 + c1) / 2, (z1 + front) / 2, c1 - c0, front - z1, y0, y1);
      // the red fascia round its free edges, a white panel with a red cross at its centre
      m.box("red", (c0 + c1) / 2, front + 0.2, c1 - c0 + 0.8, 0.4, 4.1, 5.3);
      for (const x of [c0 - 0.2, c1 + 0.2]) m.box("red", x, (z1 + front) / 2, 0.4, front - z1, 4.3, 5.3);
      m.box("signWhite", 17, front + 0.43, 1.0, 0.06, 4.2, 5.2);
      m.box("red", 17, front + 0.48, 0.72, 0.04, 4.6, 4.8);
      m.box("red", 17, front + 0.48, 0.2, 0.04, 4.34, 5.06);
      for (const x of [9, 17, 25]) m.prism("canopy", ngon(10, 0.25, 0, x, front - 0.7), 0.18, y0, false);
    });
  });
}

/** A parked ambulance at (x, z), its nose toward +Z: box body, lower cab, red band, blue beacons. */
function ambulance(m: MeshBuilder, x: number, z: number): void {
  const yb = 0.18;
  m.scope("ambulance", () => {
    m.box("ambulance", x, z - 0.8, 2.3, 4.8, yb + 0.45, yb + 2.85);
    m.box("ambulance", x, z + 2.4, 2.2, 1.6, yb + 0.45, yb + 2.1);
    m.box("cabGlass", x, z + 2.45, 2.22, 1.56, yb + 1.4, yb + 2.0);
    m.box("stripe", x, z - 0.8, 2.32, 4.82, yb + 1.1, yb + 1.45);
    m.box("beacon", x, z + 1.3, 1.6, 0.35, yb + 2.85, yb + 3.05);
    for (const wz of [z - 2.2, z + 2.2]) {
      for (const s of [-1, 1]) m.sweep("tyre", "x", ngon(8, 0.42, 0, wz, yb + 0.42), x + s * 0.88, ngon(8, 0.42, 0, wz, yb + 0.42), x + s * 1.18);
    }
  });
}

/** A small street tree: trunk and an eight-sided crown. */
function tree(m: MeshBuilder, x: number, z: number, h: number): void {
  m.prism("trunk", ngon(5, 0.16, 0, x, z), 0.2, h * 0.45, false);
  m.loft("leaves", ngon(8, 0.9, 0, x, z), h * 0.35, ngon(8, 1.6, 0, x, z), h * 0.6, false);
  m.loft("leaves", ngon(8, 1.6, 0, x, z), h * 0.6, ngon(8, 0.5, 0, x, z), h, true);
}

function site(m: MeshBuilder): void {
  m.scope("site", () => {
    m.scope("paving and lawns", () => {
      m.box("paving", 0, 2, 68, 48, 0, G);
      m.box("grass", -22, 18.5, 12, 2.6, G, 0.2);
      m.box("grass", -2, 18.5, 12, 2.6, G, 0.2);
    });
    m.scope("road and ambulance bay", () => {
      m.box("asphalt", 0, 23, 68, 6, G, 0.18);
      m.box("asphalt", 17, 14.5, 20, 11, G, 0.18);
      for (let x = -31; x < 32; x += 6) m.box("roadPaint", x, 23, 3, 0.15, 0.18, 0.19);
      // the ambulance bays' yellow outlines
      for (const x of [9.5, 15.5, 18.5, 24.5]) m.box("bayPaint", x, 14, 0.15, 8, 0.18, 0.19);
      for (const x of [12.5, 21.5]) m.box("bayPaint", x, 10.2, 6.15, 0.15, 0.18, 0.19);
    });
    m.scope("trees", () => { for (const x of [-26, -21, -3, 2]) tree(m, x, 18.5, 6.5); });
    m.scope("hospital sign", () => {
      // the blue "H" sign at the drive's entrance
      m.box("steel", 31, 18.5, 0.16, 0.16, G, 4.4);
      m.box("signBlue", 31, 18.6, 2, 0.12, 2.8, 4.8);
      for (const s of [-1, 1]) m.box("signWhite", 31 + s * 0.45, 18.68, 0.28, 0.04, 3.15, 4.45);
      m.box("signWhite", 31, 18.69, 0.64, 0.04, 3.68, 3.92);
    });
    m.scope("ambulances", () => { ambulance(m, 12.5, 13.6); ambulance(m, 21.5, 13.6); });
  });
}

function wardBlock(m: MeshBuilder): void {
  m.scope("ward block", () => {
    block(m, WARD);
    m.scope("red cross", () => {
      // a white panel with the red cross high on the street front, over the emergency department
      m.box("signWhite", 20, 0.15, 5.2, 0.3, 16.2, 21.4);
      m.box("red", 20, 0.34, 3.8, 0.08, 18.2, 19.4);
      m.box("red", 20, 0.34, 1.2, 0.08, 16.9, 20.7);
    });
  });
}

function wing(m: MeshBuilder): void {
  m.scope("treatment wing", () => {
    block(m, WING);
    m.scope("main entrance", () => {
      m.box("canopy", -12, 17.6, 10, 3.2, 3.7, 4.05);
      for (const x of [-16.5, -7.5]) m.prism("canopy", ngon(10, 0.2, 0, x, 18.9), 0.2, 3.7, false);
      m.box("frame", -12, WING.z1 - INSET + 0.05, 3, 0.1, 0.7, 3.4);
      m.box("glass", -12, WING.z1 - INSET + 0.12, 2.6, 0.04, 0.7, 3.1);
    });
    m.scope("roof plant", () => {
      for (const x of [-22, -12]) m.box("glass", x, 10.5, 4, 3, 9.1, 9.6);
      // the operating theatres' air handling units and their duct
      for (const x of [-21, -13.5]) {
        m.box("plant", x, 4, 5, 2.6, 9.1, 11.1);
        for (const s of [-1, 1]) m.prism("louvre", ngon(12, 0.75, 0, x + s * 1.2, 4), 11.1, 11.3);
      }
      m.box("steel", -4, 6, 1.2, 9, 9.1, 10.3);
      m.box("plant", -4, 12, 3, 2, 9.1, 10.8);
    });
  });
}

function rooftopPlant(m: MeshBuilder): void {
  m.scope("rooftop plant", () => {
    m.scope("plant room", () => {
      m.box("plant", 15, -9, 18, 11, WARD_DECK, 28.3);
      for (const x of [9, 15, 21]) m.box("louvre", x, -3.45, 4, 0.1, 25.5, 27.6);
      for (const z of [-12, -6]) m.box("louvre", 24.05, z, 0.1, 3, 25.5, 27.6);
    });
    m.scope("air handling units", () => {
      for (const z of [-14.5, -3.5]) {
        m.box("steel", 25.9, z, 3, 3, WARD_DECK, 26.6);
        m.prism("louvre", ngon(12, 0.9, 0, 25.9, z), 26.6, 26.8);
      }
    });
    m.scope("flues", () => {
      for (const x of [11, 13]) m.prism("steel", ngon(10, 0.35, 0, x, -12.5), 28.3, 31);
    });
  });
}

/**
 * The raised helipad on the ward block's roof: a square deck HOSPITAL_HELIPAD.side
 * across on a steel frame, its touchdown surface in the material `helipad`, with the
 * white edge, the yellow aiming circle, the white "H", a red cross in one corner, green lights
 * round the edge, a safety net on three sides and the stair core it is reached by.
 */
function helipad(m: MeshBuilder): void {
  const { x: cx, z: cz, side, y0, y1 } = HOSPITAL_HELIPAD;
  const half = side / 2;
  const paint = y1 + 0.03;
  m.scope("helipad", () => {
    m.scope("frame", () => {
      for (const dx of [-7.5, 0, 7.5]) for (const dz of [-6.8, 0, 6.8]) m.box("steel", cx + dx, cz + dz, 0.6, 0.6, WARD_DECK, y0 - 0.6, 0, false);
      for (const dz of [-6.8, 0, 6.8]) m.box("steel", cx, cz + dz, side - 0.4, 0.5, y0 - 0.6, y0);
      for (const dx of [-7.5, 0, 7.5]) m.box("steel", cx + dx, cz, 0.45, side - 0.4, y0 - 0.55, y0 - 0.05);
      for (const dz of [-6.8, 6.8]) {
        m.rod("steel", [cx - 7.5, WARD_DECK, cz + dz], [cx, y0 - 0.6, cz + dz], 0.12, 6);
        m.rod("steel", [cx + 7.5, WARD_DECK, cz + dz], [cx, y0 - 0.6, cz + dz], 0.12, 6);
      }
    });
    m.scope("deck", () => m.box("helipad", cx, cz, side, side, y0, y1));
    m.scope("markings", () => {
      const e = 0.5;
      for (const sg of [-1, 1]) {
        m.box("helipadPaint", cx, cz + sg * (half - 0.5), side - 0.6, e, y1, paint);
        m.box("helipadPaint", cx + sg * (half - 0.5), cz, e, side - 1.8, y1, paint);
      }
      // the aiming circle: sixteen yellow segments
      const r = half * 0.66;
      const chord = 2 * r * Math.tan(Math.PI / 16) + 0.05;
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        m.box("helipadMark", cx + r * Math.cos(a), cz + r * Math.sin(a), 0.6, chord, y1, paint + 0.01, -a);
      }
      // a red cross on a white square in the street-side corner, outside the circle
      const qx = cx + half - 3, qz = cz + half - 3;
      m.box("helipadPaint", qx, qz, 2.6, 2.6, y1, paint);
      m.box("helipadCross", qx, qz, 2, 0.6, y1, paint + 0.01);
      m.box("helipadCross", qx, qz, 0.6, 2, y1, paint + 0.015);
      const hh = side * 0.28;
      const hw = side * 0.2;
      for (const sg of [-1, 1]) m.box("helipadPaint", cx + sg * (hw / 2 - 0.4), cz, 0.8, hh, y1, paint + 0.03);
      m.box("helipadPaint", cx, cz, hw - 1.6, 0.8, y1, paint + 0.04);
    });
    m.scope("perimeter lights", () => {
      const inset = half - 0.6;
      for (let i = 0; i < 4; i++) {
        const t = -inset + (2 * inset * i) / 3;
        for (const sg of [-1, 1]) {
          m.box("helipadLight", cx + t, cz + sg * inset, 0.35, 0.35, y1, y1 + 0.28);
          if (i > 0 && i < 3) m.box("helipadLight", cx + sg * inset, cz + t, 0.35, 0.35, y1, y1 + 0.28);
        }
      }
    });
    m.scope("safety net", () => {
      for (const sg of [-1, 1]) m.box("net", cx, cz + sg * (half + 0.75), side + 1.5, 1.5, y0 - 0.25, y0 - 0.1);
      m.box("net", cx - half - 0.75, cz, 1.5, side, y0 - 0.25, y0 - 0.1);
    });
    m.scope("stair core", () => {
      // beside the deck's +X edge: the lift and stair up from the ward floors, a door onto the deck
      m.box("wall", cx + half + 2, cz, 4, 7, WARD_DECK, 31.2);
      m.box("frame", cx + half - 0.04, cz, 0.08, 1.8, y1, y1 + 2.3);
    });
  });
}

/** The general hospital at full detail. */
export function hospital(_p?: ParamValues): MeshBuilder {
  const m = model();
  return m.scope("Hospital", () => {
    site(m);
    wardBlock(m);
    wing(m);
    emergency(m);
    rooftopPlant(m);
    helipad(m);
    return m;
  });
}

/** The low level of detail (no paving): the three blocks, the canopy, the plant room, the stair core and the helipad's deck on its support. */
export function hospitalLod(_p?: ParamValues): MeshBuilder {
  const m = model();
  const { x: cx, z: cz, side, y0, y1 } = HOSPITAL_HELIPAD;
  m.box("wall", 0, -9, 56, 18, 0, WARD_PARAPET);
  m.box("wall", -12, 8, 32, 16, 0, WING.parapet);
  m.box("wall", 16, 4.5, 24, 9, 0, 6);
  m.box("canopy", 17, 12.8, 18.8, 7.6, 4.3, 5.3);
  m.box("plant", 15, -9, 18, 11, WARD_PARAPET, 28.3);
  m.box("steel", cx, cz, 15, 13.6, WARD_PARAPET, y0);
  lodBox(m, "helipad", cx, cz, side, side, y0, y1);
  m.box("wall", cx + side / 2 + 2, cz, 4, 7, WARD_PARAPET, 31.2);
  return m;
}

/** The family's catalog fields: listed with the commercial buildings, placed by hand (no city pool). */
export const HOSPITAL_CATALOG: CatalogFields = {
  category: "Commercial",
  group: "civic",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** The hospitals, by catalog id. The ids are stored in saved maps. */
export const HOSPITALS: readonly ProceduralDesign[] = [
  {
    id: "hospital",
    title: "Hospital",
    build: hospital,
    buildLod: hospitalLod,
    references: "hospital",
    catalog: HOSPITAL_CATALOG,
    game: { helipad: { material: "helipad", pad: "small" } },
  },
];
