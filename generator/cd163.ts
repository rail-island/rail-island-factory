// The CD 163: the Czech Railways class 163 (Skoda 71E) 3 kV DC Bo'Bo' electric
// locomotive, in the classic green livery with the yellow band. Modelled from
// photographs (assets/cd-163/) and the dimensions painted on the locomotive
// itself: 16.80 m over the buffers, 8.30 m between the bogie pivots, 3.20 m
// bogie wheelbase, 1.25 m wheels. See docs/models/vehicles.md.
//
// Metres, +X forward (the "front" cab; the locomotive is symmetric end for end
// but for its markings), +Y up, +Z right, the wheels standing on y = 0 (the top
// of the rail), centred on x = 0 and z = 0. Standard gauge. Rigid: one node.
//
// The body is lofted in plan: horizontal octagons (the cab ends' corners are
// chamfered) stacked in colour bands, the upper front raked back, the roof a
// hip over the whole body. Details sit on those faces, sunk a centimetre into
// them and standing a centimetre or more proud (docs/models/skyscrapers.md,
// "Flicker").

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { CatalogFields } from "./design.ts";
import { block, side } from "./vehicleParts.ts";

/** The catalog fields of a rail vehicle, in place of the road vehicles'. */
export const RAIL_CATALOG: CatalogFields = {
  category: "Rail vehicles",
  group: "loco",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

export const CD163_PALETTE: Record<string, MaterialSpec> = {
  green: { color: "#2f6b37", metallic: 0.1, roughness: 0.5 },
  yellow: { color: "#e3b72c", metallic: 0.1, roughness: 0.5 },
  roof: { color: "#77797c", roughness: 0.7 },
  underframe: { color: "#2a2c2f", roughness: 0.8 },
  bogie: { color: "#3c3e42", roughness: 0.75 },
  spring: { color: "#5a5d62", metallic: 0.2, roughness: 0.6 },
  steel: { color: "#8c9198", metallic: 0.3, roughness: 0.45 },
  wheel: { color: "#46484b", metallic: 0.2, roughness: 0.6 },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  glass: { color: "#24303c", metallic: 0.2, roughness: 0.15 },
  lampHead: { color: "#f3f5f6", roughness: 0.2 },
  lampRed: { color: "#c8202c", roughness: 0.3 },
  plate: { color: "#b3222c", roughness: 0.5 },
  white: { color: "#eeeeee", roughness: 0.5 },
  logo: { color: "#18181a", roughness: 0.6 },
  louvre: { color: "#35383c", roughness: 0.8 },
  slat: { color: "#686c71", roughness: 0.6 },
  insulator: { color: "#8a4a26", roughness: 0.4 },
  pantograph: { color: "#4b4f55", metallic: 0.2, roughness: 0.6 },
  carbon: { color: "#2f3033", roughness: 0.7 },
  copper: { color: "#b0733f", metallic: 0.4, roughness: 0.4 },
};

// --- dimensions -------------------------------------------------------------------

const HALF = 7.9; // the body's end faces (below the windscreen); buffers reach 8.40
const RAKE = 0.2; // how far the front sets back from the sill to the eave
const CH = 0.25; // the cab ends' corner chamfer, in plan
const HW = 1.47; // half the body's width (2.94 m)

const Y_BOTTOM = 1.15; // the body's lower edge
const Y_BAND0 = 1.6; // the yellow band
const Y_BAND1 = 2.2;
const Y_SILL = 2.35; // the front rakes back above here
const Y_EAVE = 3.35; // the side walls' top, where the roof's cant starts
const Y_CANT = 3.68;
const Y_ROOF = 3.86;
const CANT_HW = 1.17; // half the width at the top of the cant
const ROOF_HW = 0.86;

const WHEEL_R = 0.625; // 1250 mm wheels
const WHEEL_N = 24;
/** The axle height: a wheel is a 24-gon with a flat side, not a vertex, on the rail. */
const AXLE_Y = WHEEL_R * Math.cos(Math.PI / WHEEL_N);
const BOGIE_X = 4.15; // 8.30 m between the pivots
const HALF_BASE = 1.6; // 3.20 m bogie wheelbase
const PANTO_X = 4.15; // the pantographs stand over the bogies

// --- helpers ----------------------------------------------------------------------

/** `ring` wound the way loft() walls outward: clockwise in (x, z), as ngon() returns. */
function outward(ring: Ring): Ring {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i]!;
    const [x1, z1] = ring[(i + 1) % ring.length]!;
    a += x0 * z1 - x1 * z0;
  }
  return a > 0 ? [...ring].reverse() : ring;
}

/** The body's plan at one height: ends at +-xEnd, sides at +-hw, corners chamfered by c. */
function plan(xEnd: number, hw: number, c: number): Ring {
  return outward([
    [xEnd, -hw + c], [xEnd, hw - c], [xEnd - c, hw], [-xEnd + c, hw],
    [-xEnd, hw - c], [-xEnd, -hw + c], [-xEnd + c, -hw], [xEnd - c, -hw],
  ]);
}

/** The end face's x at height y: upright to the sill, raked back above it. */
function frontX(y: number): number {
  return y <= Y_SILL ? HALF : HALF - (RAKE * (y - Y_SILL)) / (Y_EAVE - Y_SILL);
}

/** The x range a..b (both >= 0) at the end `e` (+1 front, -1 rear), low end first. */
function ex(e: number, a: number, b: number): [number, number] {
  return e > 0 ? [a, b] : [-b, -a];
}

/** The x range d0..d1 out from the upright end face at the end `e`. */
function face(e: number, d0: number, d1: number): [number, number] {
  return ex(e, HALF + d0, HALF + d1);
}

/**
 * A panel on the raked windscreen face of the end `e`: heights y0..y1 on the
 * face, z0..z1 across, d0..d1 along the face's outward normal.
 */
function raked(m: MeshBuilder, mat: string, e: number, y0: number, y1: number, z0: number, z1: number, d0: number, d1: number): void {
  const k = RAKE / (Y_EAVE - Y_SILL);
  const l = Math.hypot(1, k);
  const [nx, ny] = [1 / l, k / l];
  const p = (y: number, d: number): [number, number] => [e * (frontX(y) + nx * d), y + ny * d];
  const s: Ring = [p(y0, d0), p(y1, d0), p(y1, d1), p(y0, d1)];
  m.sweep(mat, "z", s, z0, s, z1);
}

/**
 * A panel on the roof's cant on the side `s`: t0..t1 of the way up the slope,
 * x0..x1 along the body, d0..d1 along the slope's outward normal.
 */
function onCant(m: MeshBuilder, mat: string, s: number, t0: number, t1: number, x0: number, x1: number, d0: number, d1: number): void {
  const dz = CANT_HW - HW;
  const dy = Y_CANT - Y_EAVE;
  const l = Math.hypot(dz, dy);
  const [nz, ny] = [dy / l, -dz / l];
  const p = (t: number, d: number): [number, number] => [s * (HW + dz * t + nz * d), Y_EAVE + dy * t + ny * d];
  const q: Ring = [p(t0, d0), p(t1, d0), p(t1, d1), p(t0, d1)];
  m.sweep(mat, "x", q, x0, q, x1);
}

/** A tube from (x0, y0, z0) to (x1, y1, z1), running mainly along x, its section upright. */
function tubeX(m: MeshBuilder, mat: string, r: number, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, n = 8): void {
  m.sweep(mat, "x", ngon(n, r, 0, z0, y0), x0, ngon(n, r, 0, z1, y1), x1);
}

/** A vertical coil spring: rings of alternating radius, `turns` of them, about (x, z). */
function coil(m: MeshBuilder, mat: string, x: number, z: number, y0: number, y1: number, r: number, turns: number): void {
  const h = (y1 - y0) / (2 * turns + 1);
  for (let i = 0; i <= 2 * turns; i++) {
    const rr = i % 2 === 0 ? r : r * 0.72;
    m.prism(mat, ngon(10, rr, 0, x, z), y0 + i * h, y0 + (i + 1) * h);
  }
}

/** A post insulator standing on y0: a core with `sheds` discs and a steel cap. */
function insulator(m: MeshBuilder, x: number, z: number, y0: number, y1: number, sheds: number): void {
  m.prism("insulator", ngon(8, 0.04, 0, x, z), y0, y1 - 0.03);
  const span = y1 - y0 - 0.1;
  for (let i = 0; i < sheds; i++) {
    const y = y0 + 0.04 + (span * i) / Math.max(1, sheds - 1);
    m.prism("insulator", ngon(10, 0.075, Math.PI / 10, x, z), y, y + 0.018);
  }
  m.prism("steel", ngon(8, 0.05, Math.PI / 8, x, z), y1 - 0.035, y1);
}

/**
 * The ČD logo, drawn as strokes on a flat face. `at(u, v)` maps the logo's
 * plane (u to the reader's right, v up, metres from its lower left) to a
 * point; `rect` draws one stroke from (u0, v0) to (u1, v1).
 */
function logo(rect: (u0: number, u1: number, v0: number, v1: number) => void, w = 0.5, h = 0.28): void {
  const t = 0.045;
  // C: open to the right
  rect(0.035, 0.22, h - t, h);
  rect(0.035, 0.22, 0, t);
  rect(0, t, 0.035, h - 0.035);
  rect(0.012, 0.06, 0.012, 0.06);
  rect(0.012, 0.06, h - 0.06, h - 0.012);
  // D
  rect(0.25, 0.25 + t, 0, h);
  rect(0.25, w - 0.06, h - t, h);
  rect(0.25, w - 0.06, 0, t);
  rect(w - t, w, 0.06, h - 0.06);
  rect(w - 0.08, w - 0.015, h - 0.08, h - 0.015);
  rect(w - 0.08, w - 0.015, 0.015, 0.08);
  // the hacek over the C
  rect(0.06, 0.1, h + 0.045, h + 0.075);
  rect(0.09, 0.13, h + 0.02, h + 0.05);
  rect(0.12, 0.16, h + 0.045, h + 0.075);
}

// --- the body ---------------------------------------------------------------------

function body(m: MeshBuilder): void {
  m.scope("shell", () => {
    const low = plan(HALF, HW, CH);
    m.cap("underframe", low, Y_BOTTOM, false);
    m.loft("green", low, Y_BOTTOM, low, Y_BAND0, false);
    m.loft("yellow", low, Y_BAND0, low, Y_BAND1, false);
    m.loft("green", low, Y_BAND1, low, Y_SILL, false);
    // above the sill the end faces rake back to the eave
    m.loft("green", low, Y_SILL, plan(frontX(Y_EAVE), HW, CH), Y_EAVE, false);
  });
  m.scope("roof", () => {
    const eave = plan(frontX(Y_EAVE), HW, CH);
    const cant = plan(frontX(Y_EAVE) - 0.22, CANT_HW, 0.22);
    m.loft("roof", eave, Y_EAVE, cant, Y_CANT, false);
    m.loft("roof", cant, Y_CANT, plan(frontX(Y_EAVE) - 0.42, ROOF_HW, 0.2), Y_ROOF);
    m.scope("gutters", () => {
      for (const s of [-1, 1]) block(m, "roof", -7.35, 7.35, Y_EAVE - 0.035, Y_EAVE - 0.005, ...side(s, HW - 0.01, HW + 0.012));
    });
    m.scope("hatch seams", () => {
      for (const x of [-5.4, -3.0, -0.75, 0.75, 3.0, 5.4]) block(m, "underframe", x - 0.015, x + 0.015, Y_ROOF - 0.01, Y_ROOF + 0.012, -ROOF_HW + 0.2, ROOF_HW - 0.2);
    });
  });

  // the side walls are ribbed: horizontal pressings every 10 cm, in the colour
  // of the band they sit in, along the machine room and under the cab windows
  m.scope("ribs", () => {
    for (let k = 0; k < 20; k++) {
      const y = 1.25 + k * 0.1;
      const mat = y >= Y_BAND0 && y < Y_BAND1 ? "yellow" : "green";
      for (const s of [-1, 1]) {
        const z = side(s, HW - 0.01, HW + 0.012);
        block(m, mat, -5.9, 5.9, y, y + 0.03, ...z);
        if (y < 2.3) for (const e of [-1, 1]) block(m, mat, ...ex(e, 6.95, 7.6), y, y + 0.03, ...z);
      }
    }
  });

  m.scope("portholes", () => {
    for (const x of [-5.3, -4.55, 4.55, 5.3]) {
      for (const s of [-1, 1]) {
        const rim = ngon(20, 0.245, 0, x, 2.85);
        const pane = ngon(20, 0.205, 0, x, 2.85);
        m.sweep("rubber", "z", rim, side(s, HW - 0.02, HW + 0.024)[0], rim, side(s, HW - 0.02, HW + 0.024)[1]);
        m.sweep("glass", "z", pane, side(s, HW - 0.005, HW + 0.036)[0], pane, side(s, HW - 0.005, HW + 0.036)[1]);
      }
    }
  });

  m.scope("cant louvres", () => {
    for (const [x0, x1] of [[0.95, 2.15], [2.3, 3.5], [-2.15, -0.95], [-3.5, -2.3]] as const) {
      for (const s of [-1, 1]) {
        onCant(m, "louvre", s, 0.1, 0.9, x0, x1, -0.01, 0.012);
        for (let i = 0; i < 6; i++) {
          const t = 0.16 + i * 0.12;
          onCant(m, "slat", s, t, t + 0.05, x0 + 0.03, x1 - 0.03, 0.005, 0.03);
        }
      }
    }
  });

  m.scope("side markings", () => {
    for (const s of [-1, 1]) {
      const z = (d0: number, d1: number) => side(s, HW + d0, HW + d1);
      // the number plate on the yellow band
      block(m, "plate", 0.6, 1.25, 1.83, 1.97, ...z(0.005, 0.026));
      for (let i = 0; i < 7; i++) {
        const x = 0.66 + i * 0.08 + (i >= 3 ? 0.04 : 0);
        block(m, "white", x, x + 0.045, 1.86, 1.94, ...z(0.02, 0.032));
      }
      // the logo, near the rear cab, read from outside
      // (the reader's right is +x on the right side, -x on the left)
      const xc = -5.0;
      logo((a, b, v0, v1) => {
        const [x0, x1] = s > 0 ? [xc - 0.25 + a, xc - 0.25 + b] : [xc + 0.25 - b, xc + 0.25 - a];
        block(m, "logo", x0, x1, 1.84 + v0, 1.84 + v1, ...z(0.005, 0.026));
      });
    }
  });
}

// --- the cabs ---------------------------------------------------------------------

function cab(m: MeshBuilder, e: number): void {
  m.scope("windscreen", () => {
    raked(m, "yellow", e, 2.42, 3.28, -1.12, 1.12, -0.01, 0.012); // the frame
    for (const s of [-1, 1]) {
      raked(m, "glass", e, 2.47, 3.22, ...side(s, 0.06, 1.07), -0.005, 0.024);
      raked(m, "rubber", e, 2.52, 2.55, ...side(s, 0.2, 0.78), 0.02, 0.036); // the wiper
    }
  });

  m.scope("lamps", () => {
    // the twin headlight under the windscreen
    block(m, "rubber", ...face(e, -0.01, 0.05), 2.16, 2.33, -0.24, 0.24);
    for (const s of [-1, 1]) {
      const lens = ngon(12, 0.06, 0, s * 0.11, 2.245);
      m.sweep("lampHead", "x", lens, face(e, 0.04, 0.066)[0], lens, face(e, 0.04, 0.066)[1]);
    }
    // a white and a red lamp low on each side
    for (const s of [-1, 1]) {
      for (const [z, mat] of [[s * 0.6, "lampHead"], [s * 0.86, "lampRed"]] as const) {
        const rim = ngon(14, 0.09, 0, z, 1.72);
        const lens = ngon(14, 0.066, 0, z, 1.72);
        m.sweep("rubber", "x", rim, face(e, -0.01, 0.025)[0], rim, face(e, -0.01, 0.025)[1]);
        m.sweep(mat, "x", lens, face(e, 0.0, 0.037)[0], lens, face(e, 0.0, 0.037)[1]);
      }
    }
  });

  m.scope("front markings", () => {
    block(m, "plate", ...face(e, -0.01, 0.02), 1.64, 1.8, -0.33, 0.33);
    for (let i = 0; i < 7; i++) {
      const z = -0.27 + i * 0.08 + (i >= 3 ? 0.04 : 0);
      block(m, "white", ...face(e, 0.01, 0.032), 1.67, 1.77, z, z + 0.045);
    }
    // the logo on the yellow band, to the reader's right: -z on the front, +z on the rear
    const u0 = 0.18;
    logo((a, b, v0, v1) => {
      const [z0, z1] = e > 0 ? [-(u0 + b), -(u0 + a)] : [u0 + a, u0 + b];
      block(m, "logo", ...face(e, -0.005, 0.02), 1.84 + v0, 1.84 + v1, z0, z1);
    });
  });

  for (const s of [-1, 1]) {
    m.scope(s > 0 ? "right side" : "left side", () => {
      const z = (d0: number, d1: number) => side(s, HW + d0, HW + d1);
      m.scope("side window", () => {
        block(m, "rubber", ...ex(e, 6.93, 7.45), 2.42, 3.23, ...z(-0.01, 0.012));
        block(m, "glass", ...ex(e, 6.96, 7.42), 2.45, 3.2, ...z(-0.005, 0.024));
      });
      m.scope("door", () => {
        block(m, "rubber", ...ex(e, 6.07, 6.85), 1.22, 3.3, ...z(-0.01, 0.012)); // the gap around it
        block(m, "green", ...ex(e, 6.1, 6.82), 1.25, Y_BAND0, ...z(-0.005, 0.024));
        block(m, "yellow", ...ex(e, 6.1, 6.82), Y_BAND0, Y_BAND1, ...z(-0.005, 0.024));
        block(m, "green", ...ex(e, 6.1, 6.82), Y_BAND1, 3.27, ...z(-0.005, 0.024));
        block(m, "glass", ...ex(e, 6.25, 6.67), 2.55, 3.15, ...z(0.01, 0.036));
        block(m, "steel", ...ex(e, 6.7, 6.78), 2.3, 2.34, ...z(0.02, 0.05)); // the handle
      });
      m.scope("handrails", () => {
        for (const x of [6.0, 6.92]) {
          m.prism("steel", ngon(6, 0.018, 0, e * x, s * (HW + 0.055)), 1.3, 3.05);
          for (const y of [1.33, 2.98]) block(m, "steel", ...ex(e, x - 0.015, x + 0.015), y, y + 0.03, ...z(-0.01, 0.06));
        }
      });
      m.scope("steps", () => {
        for (const x of [6.12, 6.77]) block(m, "underframe", ...ex(e, x, x + 0.03), 0.45, Y_BOTTOM + 0.02, ...z(-0.17, -0.11));
        for (const y of [0.48, 0.82]) {
          block(m, "steel", ...ex(e, 6.15, 6.77), y, y + 0.035, ...z(-0.25, -0.07));
          block(m, "yellow", ...ex(e, 6.15, 6.77), y - 0.005, y + 0.04, ...z(-0.07, -0.055));
        }
      });
    });
  }

  m.scope("roof box", () => {
    block(m, "roof", ...ex(e, 6.25, 7.05), Y_ROOF - 0.01, 4.08, -0.62, 0.62);
    block(m, "louvre", ...ex(e, 6.35, 6.95), 4.07, 4.095, -0.52, 0.52);
    for (let i = 0; i < 6; i++) {
      const x = 6.42 + i * 0.09;
      block(m, "slat", ...ex(e, x, x + 0.03), 4.09, 4.11, -0.5, 0.5);
    }
  });
  m.scope("horns", () => {
    for (const z of [-0.25, 0.25]) {
      block(m, "underframe", ...ex(e, 7.06, 7.14), Y_ROOF - 0.01, 3.94, z - 0.04, z + 0.04);
      const [a, b] = ex(e, 7.08, 7.24);
      const narrow = ngon(8, 0.025, 0, z, 3.97);
      const bell = ngon(8, 0.06, 0, z, 3.97);
      m.sweep("steel", "x", e > 0 ? narrow : bell, a, e > 0 ? bell : narrow, b);
    }
  });

  m.scope("buffer beam", () => {
    block(m, "underframe", ...face(e, -0.12, 0.1), 0.82, Y_BOTTOM + 0.02, -1.32, 1.32);
    m.scope("buffers", () => {
      for (const z of [-0.875, 0.875]) {
        const housing = ngon(12, 0.12, 0, z, 1.065);
        const plunger = ngon(12, 0.085, 0, z, 1.065);
        m.sweep("underframe", "x", housing, face(e, 0.09, 0.32)[0], housing, face(e, 0.09, 0.32)[1]);
        m.sweep("steel", "x", plunger, face(e, 0.31, 0.44)[0], plunger, face(e, 0.31, 0.44)[1]);
        block(m, "steel", ...face(e, 0.43, 0.5), 0.9, 1.23, z - 0.22, z + 0.22);
      }
    });
    m.scope("coupling", () => {
      block(m, "underframe", ...face(e, 0.1, 0.48), 1.0, 1.12, -0.045, 0.045);
      block(m, "steel", ...face(e, 0.36, 0.46), 0.82, 1.0, -0.1, 0.1);
    });
    m.scope("hoses", () => {
      for (const [z, mat] of [[-0.32, "lampRed"], [0.32, "lampRed"], [-0.55, "yellow"], [0.55, "yellow"]] as const) {
        const x = e * (HALF + 0.2);
        m.prism("rubber", ngon(6, 0.025, 0, x, z), 0.7, 1.0);
        block(m, mat, ...face(e, 0.17, 0.23), 0.98, 1.04, z - 0.03, z + 0.03);
      }
    });
  });

  m.scope("track clearers", () => {
    // a plate ahead of each rail, its foot swept forward, hung from the buffer beam
    const q: Ring = [[e * 7.86, 0.13], [e * 7.9, 0.13], [e * 7.86, 0.84], [e * 7.82, 0.84]];
    for (const s of [-1, 1]) m.sweep("yellow", "z", q, side(s, 0.5, 0.95)[0], q, side(s, 0.5, 0.95)[1]);
  });

  m.scope("air reservoir", () => {
    const tank = ngon(16, 0.25, 0, e * 7.0, 0.7);
    m.sweep("steel", "z", tank, -1.15, tank, 1.15);
    const strap = ngon(16, 0.262, 0, e * 7.0, 0.7);
    for (const z of [-0.7, 0.7]) m.sweep("underframe", "z", strap, z - 0.03, strap, z + 0.03);
  });
}

// --- the running gear ---------------------------------------------------------------

function bogie(m: MeshBuilder, xb: number): void {
  for (const dx of [-HALF_BASE, HALF_BASE]) {
    const ax = xb + dx;
    m.scope("wheelset", () => {
      const axle = ngon(10, 0.085, 0, ax, AXLE_Y);
      m.sweep("steel", "z", axle, -1.0, axle, 1.0);
      for (const s of [-1, 1]) {
        const tread = ngon(WHEEL_N, WHEEL_R, Math.PI / WHEEL_N, ax, AXLE_Y);
        const disc = ngon(20, 0.5, 0, ax, AXLE_Y);
        const hub = ngon(12, 0.17, 0, ax, AXLE_Y);
        const box = ngon(12, 0.16, Math.PI / 12, ax, AXLE_Y);
        m.sweep("steel", "z", tread, side(s, 0.665, 0.8)[0], tread, side(s, 0.665, 0.8)[1]);
        m.sweep("wheel", "z", disc, side(s, 0.7, 0.812)[0], disc, side(s, 0.7, 0.812)[1]);
        m.sweep("bogie", "z", hub, side(s, 0.8, 0.86)[0], hub, side(s, 0.8, 0.86)[1]);
        // the axle box outside the wheel, with its arms and primary springs
        m.sweep("bogie", "z", box, side(s, 0.85, 1.05)[0], box, side(s, 0.85, 1.05)[1]);
        block(m, "bogie", ax - 0.2, ax + 0.2, AXLE_Y + 0.05, AXLE_Y + 0.2, ...side(s, 0.88, 1.03));
        block(m, "bogie", ax - 0.44, ax + 0.44, AXLE_Y + 0.14, AXLE_Y + 0.22, ...side(s, 0.9, 1.02));
        for (const sx of [-0.34, 0.34]) coil(m, "spring", ax + sx, s * 0.96, AXLE_Y + 0.22, 1.0, 0.075, 3);
      }
      // the traction motor, hung toward the bogie's centre
      const motor = ngon(14, 0.36, 0, ax - Math.sign(dx) * 0.62, 0.64);
      m.sweep("bogie", "z", motor, -0.5, motor, 0.5);
    });
  }
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      block(m, "bogie", xb - 2.05, xb + 2.05, 0.98, 1.12, ...side(s, 0.9, 1.08)); // the side frame
      block(m, "bogie", xb - 0.5, xb + 0.5, 0.36, 0.99, ...side(s, 0.92, 1.06)); // its dropped centre
      block(m, "bogie", xb - 0.5, xb + 0.5, 0.29, 0.37, ...side(s, 0.95, 1.36)); // the spring plank
    }
    for (const x of [xb - 0.45, xb + 0.45]) block(m, "bogie", x - 0.08, x + 0.08, 0.75, 0.99, -0.92, 0.92); // transoms
    for (const x of [xb - 2.0, xb + 2.0]) block(m, "bogie", x - 0.05, x + 0.05, 0.85, 1.05, -1.0, 1.0); // headstocks
  });
  m.scope("secondary suspension", () => {
    for (const s of [-1, 1]) {
      for (const sx of [-0.3, 0.3]) coil(m, "spring", xb + sx, s * 1.2, 0.37, 1.1, 0.13, 6);
      block(m, "underframe", xb - 0.55, xb + 0.55, 1.1, Y_BOTTOM + 0.02, ...side(s, 1.0, 1.42)); // the body's bracket
    }
  });
  m.scope("sandboxes", () => {
    for (const ox of [-1, 1]) {
      const x = xb + ox * 2.36;
      for (const s of [-1, 1]) {
        block(m, "bogie", x - 0.1, x + 0.1, 0.6, 1.0, ...side(s, 0.6, 0.9));
        m.prism("underframe", ngon(6, 0.02, 0, x - ox * 0.06, s * 0.73), 0.1, 0.62);
      }
    }
  });
}

function underframe(m: MeshBuilder): void {
  m.scope("air tanks", () => {
    for (const z of [-0.5, 0.5]) {
      const tank = ngon(14, 0.21, 0, z, 0.72);
      m.sweep("steel", "x", tank, -1.5, tank, 1.5);
      const strap = ngon(14, 0.222, 0, z, 0.72);
      for (const x of [-1.0, 1.0]) m.sweep("underframe", "x", strap, x - 0.03, strap, x + 0.03);
    }
  });
  m.scope("equipment boxes", () => {
    for (const s of [-1, 1]) {
      for (const [x0, x1] of [[-1.45, -0.15], [0.15, 1.45]] as const) {
        block(m, "underframe", x0, x1, 0.55, Y_BOTTOM + 0.02, ...side(s, 0.85, 1.38));
        block(m, "bogie", x0 + 0.05, x1 - 0.05, 0.62, 1.08, ...side(s, 1.37, 1.395)); // the lid
      }
    }
  });
}

// --- the roof equipment --------------------------------------------------------------

/** A single-arm pantograph, folded down, its base centred at xc; `h` points to its hinge end. */
function pantograph(m: MeshBuilder, xc: number, h: number): void {
  m.scope("insulators", () => {
    for (const dx of [-0.55, 0.55]) for (const z of [-0.48, 0.48]) insulator(m, xc + dx, z, Y_ROOF - 0.01, 4.14, 3);
  });
  m.scope("base", () => {
    for (const z of [-0.48, 0.48]) block(m, "pantograph", xc - 0.7, xc + 0.7, 4.14, 4.2, z - 0.03, z + 0.03);
    for (const dx of [-0.62, 0.62]) block(m, "pantograph", xc + dx - 0.03, xc + dx + 0.03, 4.135, 4.195, -0.51, 0.51);
    block(m, "pantograph", ...(h > 0 ? [xc + 0.1, xc + 0.45] : [xc - 0.45, xc - 0.1]) as [number, number], 4.19, 4.3, -0.15, 0.15); // the drive
  });
  const xh = xc + h * 0.55; // the hinge
  const kx = xc - h * 1.05; // the knee, folded toward the middle of the roof
  const hx = xc + h * 0.15; // the head
  m.scope("arms", () => {
    for (const s of [-1, 1]) block(m, "pantograph", xh - 0.04, xh + 0.04, 4.18, 4.28, ...side(s, 0.36, 0.44));
    m.sweep("pantograph", "z", ngon(8, 0.035, 0, xh, 4.25), -0.42, ngon(8, 0.035, 0, xh, 4.25), 0.42);
    // the lower arm: an A-frame from the hinge shaft to the knee
    for (const s of [-1, 1]) tubeX(m, "pantograph", 0.04, xh, 4.25, s * 0.3, kx, 4.36, s * 0.04);
    tubeX(m, "pantograph", 0.016, xc + h * 0.68, 4.22, 0, kx + h * 0.1, 4.33, 0, 6); // the push rod
    m.sweep("pantograph", "z", ngon(8, 0.05, 0, kx, 4.365), -0.08, ngon(8, 0.05, 0, kx, 4.365), 0.08);
    // the upper arm: two tubes spreading from the knee to the head
    for (const s of [-1, 1]) tubeX(m, "pantograph", 0.026, kx, 4.38, s * 0.04, hx, 4.47, s * 0.32);
  });
  m.scope("head", () => {
    for (const s of [-1, 1]) block(m, "pantograph", hx - 0.15, hx + 0.15, 4.465, 4.495, ...side(s, 0.28, 0.36));
    for (const dx of [-0.12, 0.12]) {
      const x = hx + dx;
      block(m, "carbon", x - 0.03, x + 0.03, 4.49, 4.54, -0.62, 0.62);
      for (const s of [-1, 1]) {
        // the horns bend down at both ends of the collector strip
        const top: Ring = [[x - 0.03, 4.49], [x + 0.03, 4.49], [x + 0.03, 4.54], [x - 0.03, 4.54]];
        const tip: Ring = [[x - 0.02, 4.4], [x + 0.02, 4.4], [x + 0.02, 4.44], [x - 0.02, 4.44]];
        m.sweep("pantograph", "z", s > 0 ? top : tip, s > 0 ? 0.61 : -0.92, s > 0 ? tip : top, s > 0 ? 0.92 : -0.61);
      }
    }
  });
}

function roofEquipment(m: MeshBuilder): void {
  m.scope("pantographs", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => pantograph(m, e * PANTO_X, e));
  });
  m.scope("high-voltage line", () => {
    for (const x of [-2.4, -1.0, 1.0, 2.4]) insulator(m, x, 0, Y_ROOF - 0.01, 4.15, 2);
    for (const e of [-1, 1]) tubeX(m, "copper", 0.022, e * 0.25, 4.17, 0, e * (PANTO_X - 0.7), 4.17, 0, 6);
  });
  m.scope("main breaker", () => {
    block(m, "pantograph", -0.4, 0.4, Y_ROOF - 0.01, 4.04, -0.35, 0.35);
    for (const x of [-0.2, 0.2]) insulator(m, x, 0, 4.03, 4.2, 3);
    block(m, "steel", -0.24, 0.24, 4.19, 4.23, -0.05, 0.05);
  });
}

export function cd163(): MeshBuilder {
  const m = new MeshBuilder(CD163_PALETTE);
  m.scope("body", () => body(m));
  for (const e of [-1, 1]) m.scope(e > 0 ? "front cab" : "rear cab", () => cab(m, e));
  m.scope("roof equipment", () => roofEquipment(m));
  m.scope("bogies", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => bogie(m, e * BOGIE_X));
  });
  m.scope("underframe", () => underframe(m));
  return m;
}
