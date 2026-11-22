// A 19th-century covered market hall of cast iron and glass for a town square: a
// generic composite of Victor Baltard's pavilions of Les Halles in Paris (1850s, the
// surviving one re-erected at Nogent-sur-Marne), the great market halls of Budapest,
// Brno and Leipzig and the market at Covent Garden. A plaza landmark
// (docs/models/plaza-landmarks.md).
//
// The hall is a basilica in iron: a raised central nave along X over lower side aisles,
// crossed in the middle by a transept of the same section whose gable fronts are the
// entrances. Slender cast-iron columns (pedestal, collars, flared capital, abacus) stand
// on a 6 m x 7 m grid; between the outer ones a red brick dado with a stone coping, then
// tall glazed walls - mullions and transoms as real bars, the panes recessed behind them,
// a round-arched head in every bay with iron spandrels - a band of louvres under the
// cornice. The aisles carry lean-to zinc roofs up to the nave's glazed clerestory; the
// nave and the transept carry pitched zinc roofs with standing seams and a louvred
// lantern along the ridge, iron cresting and finials, and a square louvred lantern with
// a pyramid roof and a tall finial over the crossing. Each gable shows a great arched
// rib over its glazed lunette. The entrance front (+Z) stands between two brick piers:
// an open portal under an iron-and-glass canopy on brackets and slender columns, a great
// arched window with a clock, and a stone gable above. The -Z front repeats it without
// the clock and the canopy. Through the open portals the paved floor and rows of market
// stalls (counters, produce, striped awnings) can be seen.
//
// Modelled in metres, +Y up, base at y = 0, centred on the hall: about 49 m long (X),
// 30 m across the transept fronts (Z) and 25 m to the tip of the crossing finial; the
// entrance canopy reaches about 3 m further out on +Z.
//
// Sources: Wikipedia "Les Halles", "Great Market Hall (Budapest)", "Market hall"; the
// pictures in assets/market-hall/ (SOURCES.md). Deterministic: the same code gives the
// same bytes. The id is what the game's saved maps store, so the design is never renamed.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  iron: { color: "#2c4a40", metallic: 0.45, roughness: 0.55 },
  brick: { color: "#9a4632", roughness: 0.95 },
  stone: { color: "#d3c7a6", roughness: 0.9 },
  glass: { color: "#a8c0c6", metallic: 0.35, roughness: 0.15 },
  zinc: { color: "#7e888d", metallic: 0.5, roughness: 0.5 },
  gilt: { color: "#c9a44c", metallic: 0.7, roughness: 0.35 },
  enamel: { color: "#f1ecdc", roughness: 0.6 },
  timber: { color: "#7a5636", roughness: 0.85 },
  canvas: { color: "#b8362e", roughness: 0.9 },
  paving: { color: "#a39a89", roughness: 0.95 },
  produce: { color: "#d9862b", roughness: 0.8 },
  // the LOD's glazed walls: a pale band, never named as glass
  panes: { color: "#9fb4ba", roughness: 0.6 },
};

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

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

/** An octagon of radius r about (cx, cz). */
const oct = (r: number, cx = 0, cz = 0): Ring => ngon(8, r, Math.PI / 8, cx, cz);

/**
 * A vertical wall plane: `o` is its origin on the ground, `t` the horizontal direction
 * u runs along, `n` the outward normal. A point is (u along, y up, d out of the wall).
 */
interface Plane { o: Vec3; t: Vec3; n: Vec3 }
const at = (pl: Plane, u: number, y: number, d = 0): Vec3 => add(add(pl.o, mul(pl.t, u)), add([0, y, 0], mul(pl.n, d)));
/** The planes of the four sides: u runs along +X on the +-Z sides and along +Z on the +-X sides. */
const sideZ = (s: number, z: number): Plane => ({ o: [0, 0, z], t: [1, 0, 0], n: [0, 0, s] });
const sideX = (s: number, x: number): Plane => ({ o: [x, 0, 0], t: [0, 0, 1], n: [s, 0, 0] });

// --- dimensions -----------------------------------------------------------------

const FLOOR = 0.3; // top of the stone plinth, the hall's floor
const HX = 24; // the end walls stand at x = +-24
const HZ = 14; // the long walls at z = +-14
const NAVE = 7; // the nave's columns at z = +-7
const TR = 6; // the transept's side walls at x = +-6
const XS = [-24, -18, -12, -6, 0, 6, 12, 18, 24]; // the column lines across X
const DADO = 1.4; // top of the brick dado (the coping adds 0.12)
const SILL = DADO + 0.12;
const ARCH_SPRING = 5.9; // the aisle bays' arch springing
const BAY_TOP = 7.95; // top of the bays' spandrels
const CORNICE = 8.75; // foot of the aisle cornice
const EAVES = 9.15; // top of the aisle cornice
const FRONT = 14.5; // the transept fronts at z = +-14.5
const PIER_X = 6.3;

/** The aisle roof's top surface at |z| (from the clerestory at 7 to the eaves at 14.6). */
const aisleY = (z: number): number => 12.3 - (Math.abs(z) - NAVE) * 0.384;
const CLER_TOP = 14.65; // the clerestory's cornice foot
/** The nave roof's top surface at |z| (eaves at 7.6, lantern at 1.6). */
const naveY = (z: number): number => 17.6 - (Math.max(1.6, Math.abs(z)) - 1.6) * 0.4;
/** The transept roof's top surface at |x| (eaves at 6.4, lantern at 1.6). */
const transY = (x: number): number => 17.6 - (Math.max(1.6, Math.abs(x)) - 1.6) * 0.5;
const ROOF_T = 0.12; // roof sheet thickness
const LANTERN_TOP = 18.6; // top of the lantern louvres
const RIDGE = 19.25; // the lanterns' ridge
const TURRET = 2.4; // half width of the crossing lantern
const TURRET_EAVES = 20.75;
const TURRET_APEX = 22.9;
const FINIAL_TOP = 25.0;

// --- columns ----------------------------------------------------------------------

function column(m: MeshBuilder, x: number, z: number, yTop: number): void {
  m.box("iron", x, z, 0.52, 0.52, FLOOR, 1.0);
  m.loft("iron", oct(0.25, x, z), 1.0, oct(0.19, x, z), 1.2, false);
  m.prism("iron", oct(0.19, x, z), 1.2, yTop - 0.7, false);
  for (const y of [3.2, yTop - 2.2]) m.prism("iron", oct(0.24, x, z), y, y + 0.14);
  m.loft("iron", oct(0.19, x, z), yTop - 0.7, oct(0.34, x, z), yTop - 0.25, false);
  m.box("iron", x, z, 0.72, 0.72, yTop - 0.25, yTop);
}

// --- glazed bays --------------------------------------------------------------------

interface BayOpts {
  /** The arch's springing; with `rise` 0 the head is flat at this height. */
  spring: number;
  rise: number;
  /** The top of the spandrel above the arch at u (a gable line or a flat top). */
  top: (u: number) => number;
  mullions: number;
  transoms: number[];
  segs: number;
  /** Extra u where `top` has a kink (a gable's apex, a lantern's foot). */
  kinks?: number[];
  rib?: number;
  panel?: string;
}

/**
 * A glazed bay between u0 and u1 from y0: a recessed pane under a segmental arch, the
 * mullions and transoms as real bars in front of it, the arch rib, the spandrel panels
 * from the arch up to `top`, and a sill.
 */
function glazedBay(m: MeshBuilder, pl: Plane, u0: number, u1: number, y0: number, o: BayOpts): void {
  const um = (u0 + u1) / 2;
  const c = (u1 - u0) / 2;
  const R = o.rise > 0 ? (c * c + o.rise * o.rise) / (2 * o.rise) : 0;
  const cy = o.spring + o.rise - R;
  const archY = (u: number): number => (o.rise > 0 ? cy + Math.sqrt(Math.max(0, R * R - (u - um) * (u - um))) : o.spring);
  const us: number[] = [];
  for (let k = 0; k <= o.segs; k++) us.push(u0 + ((u1 - u0) * k) / o.segs);
  for (const k of o.kinks ?? []) if (k > u0 + 0.05 && k < u1 - 0.05 && us.every((v) => Math.abs(v - k) > 0.05)) us.push(k);
  us.sort((a, b) => a - b);
  const rise = o.rise > 0;
  // the pane, recessed behind the bars
  const outline: Vec3[] = [at(pl, u0, y0, -0.07), at(pl, u1, y0, -0.07)];
  if (rise) for (let k = us.length - 1; k >= 0; k--) outline.push(at(pl, us[k]!, archY(us[k]!), -0.07));
  else outline.push(at(pl, u1, o.spring, -0.07), at(pl, u0, o.spring, -0.07));
  m.slab("glass", outline, mul(pl.n, -0.02));
  // the sill
  beam(m, "iron", at(pl, u0 + 0.02, y0, 0.02), at(pl, u1 - 0.02, y0, 0.02), 0.14, 0.18, pl.n);
  // mullions and transoms
  for (let k = 1; k <= o.mullions; k++) {
    const u = u0 + ((u1 - u0) * k) / (o.mullions + 1);
    beam(m, "iron", at(pl, u, y0), at(pl, u, archY(u)), 0.07, 0.12, pl.n);
  }
  for (const y of o.transoms) {
    let a = u0;
    let b = u1;
    if (rise && y > o.spring) {
      const h = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
      a = um - h;
      b = um + h;
    }
    if (b - a > 0.3) beam(m, "iron", at(pl, a, y), at(pl, b, y), 0.08, 0.1, pl.n);
  }
  // the arch rib (or the head beam) and the spandrel above it
  const rib = o.rib ?? 0.16;
  if (rise) {
    for (let k = 0; k + 1 < us.length; k++) {
      beam(m, "iron", at(pl, us[k]!, archY(us[k]!)), at(pl, us[k + 1]!, archY(us[k + 1]!)), rib, rib, pl.n);
    }
  } else {
    beam(m, "iron", at(pl, u0, o.spring), at(pl, u1, o.spring), rib, rib, pl.n);
  }
  const panel = o.panel ?? "iron";
  for (let k = 0; k + 1 < us.length; k++) {
    const a = us[k]!;
    const b = us[k + 1]!;
    const ya = archY(a);
    const yb = archY(b);
    const ta = o.top(a);
    const tb = o.top(b);
    if (ta - ya < 0.03 && tb - yb < 0.03) continue;
    m.slab(panel, [at(pl, a, ya, 0.03), at(pl, b, yb, 0.03), at(pl, b, Math.max(tb, yb + 0.03), 0.03), at(pl, a, Math.max(ta, ya + 0.03), 0.03)], mul(pl.n, -0.075));
  }
}

/** A band of inclined louvre slats between y0 and y1. */
function louvres(m: MeshBuilder, pl: Plane, u0: number, u1: number, y0: number, y1: number, n: number, mat = "iron"): void {
  const h = (y1 - y0) / n;
  for (let k = 0; k < n; k++) {
    const y = y0 + k * h;
    m.slab(mat, [at(pl, u0, y, 0.07), at(pl, u1, y, 0.07), at(pl, u1, y + h * 1.25, -0.07), at(pl, u0, y + h * 1.25, -0.07)], [0, -0.03, 0]);
  }
}

/** One aisle bay between the columns at u0c and u1c: dado, coping, glazed arch, louvres. */
function aisleBay(m: MeshBuilder, pl: Plane, u0c: number, u1c: number, endA = 0.12, endB = 0.12): void {
  const u0 = u0c + endA;
  const u1 = u1c - endB;
  const um = (u0 + u1) / 2;
  const c = at(pl, um, 0, -0.02);
  const alongX = Math.abs(pl.t[0]) > 0.5;
  const len = u1 - u0;
  // the brick dado and its coping (boxes are axis-aligned: width along t, depth along n)
  const w = alongX ? len : 0.36;
  const d = alongX ? 0.36 : len;
  m.box("brick", c[0], c[2], w, d, FLOOR, DADO, 0, false);
  const cw = alongX ? len : 0.48;
  const cd = alongX ? 0.48 : len;
  m.box("stone", c[0], c[2], cw, cd, DADO, SILL);
  glazedBay(m, pl, u0, u1, SILL, {
    spring: ARCH_SPRING, rise: Math.min(1.6, len * 0.28), top: () => BAY_TOP,
    mullions: len > 6 ? 4 : 3, transoms: [3.4, 5.9], segs: 8,
  });
  beam(m, "iron", at(pl, u0, BAY_TOP + 0.04), at(pl, u1, BAY_TOP + 0.04), 0.12, 0.16, pl.n);
  louvres(m, pl, u0, u1, BAY_TOP + 0.12, CORNICE, 4);
}

// --- the walls ----------------------------------------------------------------------

function longSides(m: MeshBuilder): void {
  for (const s of [1, -1]) {
    m.scope(s > 0 ? "south aisle wall" : "north aisle wall", () => {
      const pl = sideZ(s, s * HZ);
      for (let k = 0; k + 1 < XS.length; k++) {
        const x0 = XS[k]!;
        const x1 = XS[k + 1]!;
        if (x0 >= -TR && x1 <= TR) continue; // the transept front stands there
        // the bays next to the transept end inside its brick piers
        if (x1 === -TR) aisleBay(m, pl, x0, PIER_X * -1 - 0.5 + 0.08, 0.12, 0);
        else if (x0 === TR) aisleBay(m, pl, PIER_X + 0.5 - 0.08, x1, 0, 0.12);
        else aisleBay(m, pl, x0, x1);
      }
      m.scope("cornice", () => {
        for (const sx of [-1, 1]) {
          const xa = sx * (PIER_X + 0.4);
          const xb = sx * (HX - 0.3);
          const cx = (xa + xb) / 2;
          const w = Math.abs(xb - xa);
          m.box("iron", cx, s * HZ, w, 0.62, CORNICE, CORNICE + 0.18);
          m.box("iron", cx, s * (HZ + 0.06), w, 0.86, CORNICE + 0.18, EAVES);
          // the wall head up into the roof
          const xw = sx * (HX - 0.05);
          m.box("iron", (xa + xw) / 2, s * HZ, Math.abs(xw - xa), 0.16, EAVES, aisleY(HZ) - 0.02, 0, false);
          // the corner block over the corner column
          m.box("iron", sx * (HX + 0.05), s * (HZ + 0.05), 0.95, 0.95, CORNICE - 0.05, EAVES + 0.15);
        }
      });
    });
  }
}

function endWalls(m: MeshBuilder): void {
  for (const s of [1, -1]) {
    m.scope(s > 0 ? "east end" : "west end", () => {
      const pl = sideX(s, s * HX);
      for (const [a, b] of [[-14, -7], [-7, 0], [0, 7], [7, 14]] as const) aisleBay(m, pl, a, b);
      m.box("iron", s * HX, 0, 0.62, 2 * HZ - 0.6, CORNICE, CORNICE + 0.18);
      m.box("iron", s * (HX + 0.06), 0, 0.86, 2 * HZ - 0.6, CORNICE + 0.18, EAVES);
      m.scope("aisle gables", () => {
        for (const sz of [1, -1]) {
          const z0 = sz * (NAVE + 0.15);
          const z1 = sz * (HZ + 0.3);
          m.slab("iron", [[s * HX, EAVES - 0.05, z0], [s * HX, EAVES - 0.05, z1], [s * HX, aisleY(z1) - 0.14, z1], [s * HX, aisleY(z0) - 0.14, z0]], [-s * 0.1, 0, 0]);
        }
      });
      m.scope("nave gable", () => {
        const top = (u: number): number => naveY(u) - 0.16;
        glazedBay(m, pl, -6.85, 6.85, EAVES + 0.1, {
          spring: 12.0, rise: 4.6, top, mullions: 7, transoms: [11.0, 13.6], segs: 16, kinks: [-1.6, 1.6], rib: 0.32,
        });
        // the lantern's end
        m.slab("iron", [at(pl, -1.6, naveY(1.6) - 0.16, 0.03), at(pl, 1.6, naveY(1.6) - 0.16, 0.03), at(pl, 1.6, LANTERN_TOP, 0.03), at(pl, 0, RIDGE - 0.12, 0.03), at(pl, -1.6, LANTERN_TOP, 0.03)], mul(pl.n, -0.1));
      });
    });
  }
}

function clerestories(m: MeshBuilder): void {
  m.scope("nave clerestory", () => {
    for (const s of [1, -1]) {
      const pl = sideZ(s, s * NAVE);
      for (let k = 0; k + 1 < XS.length; k++) {
        const x0 = XS[k]!;
        const x1 = XS[k + 1]!;
        if (x0 >= -TR && x1 <= TR) continue;
        glazedBay(m, pl, x0 + 0.12, x1 - 0.12, aisleY(NAVE) + 0.05, { spring: CLER_TOP - 0.05, rise: 0, top: () => CLER_TOP - 0.05, mullions: 3, transoms: [], segs: 1 });
      }
      for (const sx of [-1, 1]) {
        const xa = sx * TR;
        const xb = sx * (HX + 0.35);
        const cx = (xa + xb) / 2;
        const w = Math.abs(xb - xa);
        m.box("iron", cx, s * (NAVE + 0.05), w, 0.7, CLER_TOP, CLER_TOP + 0.3);
        m.box("iron", cx, s * NAVE, w, 0.16, CLER_TOP + 0.3, naveY(NAVE) - 0.02, 0, false);
      }
    }
  });
  m.scope("transept clerestory", () => {
    for (const sx of [1, -1]) {
      const pl = sideX(sx, sx * TR);
      for (const sz of [1, -1]) {
        const z0 = sz * (NAVE + 0.15);
        const z1 = sz * (FRONT - 0.3);
        // the iron panel between the aisle roof and the clerestory
        m.slab("iron", [[sx * TR, aisleY(z1) - 0.1, z1], [sx * TR, aisleY(NAVE) + 0.05, z1], [sx * TR, aisleY(NAVE) + 0.05, z0], [sx * TR, aisleY(z0) - 0.1, z0]], [-sx * 0.1, 0, 0]);
        const [ua, ub] = sz > 0 ? [z0, z1] : [z1, z0];
        glazedBay(m, pl, ua, ub, aisleY(NAVE) + 0.05, { spring: CLER_TOP - 0.05, rise: 0, top: () => CLER_TOP - 0.05, mullions: 4, transoms: [], segs: 1 });
      }
      m.box("iron", sx * (TR + 0.05), 0, 0.7, 2 * FRONT + 0.6, CLER_TOP, CLER_TOP + 0.35);
      for (const sz of [1, -1]) {
        m.box("iron", sx * TR, sz * (NAVE + FRONT + 0.3) / 2, 0.16, FRONT + 0.3 - NAVE, CLER_TOP + 0.35, transY(TR) - 0.02, 0, false);
      }
    }
  });
}

/** A transept front (+Z or -Z): brick piers, portal, side glazing, the great arched window, the gable. */
function front(m: MeshBuilder, s: number): void {
  const pl = sideZ(s, s * FRONT);
  const u = (x: number): number => x * s; // u along t = +X
  m.scope(s > 0 ? "entrance front" : "north front", () => {
    m.scope("piers", () => {
      for (const sx of [-1, 1]) {
        const x = sx * PIER_X;
        const z = s * (FRONT - 0.1);
        m.box("stone", x, z, 1.2, 1.4, 0, 0.9, 0, false);
        m.box("brick", x, z, 1.0, 1.3, 0.9, 15.6, 0, false);
        for (const y of [5.4, 10.2]) m.box("stone", x, z, 1.12, 1.32, y, y + 0.3);
        m.box("stone", x, z, 1.24, 1.44, 15.6, 16.0);
        m.loft("stone", rect(0.8, 0.9, x, z), 16.0, rect(0.5, 0.6, x, z), 16.6, true);
        m.rod("iron", [x, 16.55, z], [x, 17.2, z], 0.05, 6);
        m.loft("gilt", oct(0.08, x, z), 17.2, oct(0.2, x, z), 17.4, false);
        m.loft("gilt", oct(0.2, x, z), 17.4, oct(0.06, x, z), 17.65, false);
        m.spire("gilt", oct(0.06, x, z), 17.65, 18.1);
      }
    });
    m.scope("portal", () => {
      for (const sx of [-1, 1]) {
        // brick dado and glazing beside the portal
        const xa = sx * 3.15;
        const xb = sx * 5.8;
        const cx = (xa + xb) / 2;
        m.box("brick", cx, s * FRONT, 2.65, 0.4, FLOOR, DADO, 0, false);
        m.box("stone", cx, s * FRONT, 2.65, 0.52, DADO, SILL);
        const [ua, ub] = u(xa) < u(xb) ? [u(xa), u(xb)] : [u(xb), u(xa)];
        glazedBay(m, pl, ua, ub, SILL, { spring: 5.5, rise: 0, top: () => 5.5, mullions: 2, transoms: [3.4], segs: 1 });
        // the portal's jambs
        beam(m, "iron", at(pl, u(sx * 3.05), FLOOR - 0.05), at(pl, u(sx * 3.05), 5.6), 0.22, 0.3, pl.n);
      }
      m.box("stone", 0, s * FRONT, 11.7, 0.6, 5.6, 6.2);
      // the folded-back door leaves
      for (const sx of [-1, 1]) {
        const x = sx * 2.85;
        m.slab("iron", [[x, FLOOR + 0.06, s * (FRONT - 0.2)], [x, 4.6, s * (FRONT - 0.2)], [x, 4.6, s * (FRONT - 1.6)], [x, FLOOR + 0.06, s * (FRONT - 1.6)]], [-sx * 0.06, 0, 0]);
      }
    });
    m.scope("great window", () => {
      const top = (uu: number): number => transY(uu) - 0.16;
      glazedBay(m, pl, -5.75, 5.75, 6.25, {
        spring: 9.2, rise: 5.4, top, mullions: 7, transoms: [7.9, 10.6], segs: 16, kinks: [-1.6, 1.6], rib: 0.34, panel: "stone",
      });
      // the outer archivolt, proud of the spandrel
      const R = (5.75 * 5.75 + 5.4 * 5.4) / (2 * 5.4);
      const cy = 9.2 + 5.4 - R;
      const N = 16;
      for (let k = 0; k < N; k++) {
        const ua = -5.75 + (11.5 * k) / N;
        const ub = -5.75 + (11.5 * (k + 1)) / N;
        const ya = cy + Math.sqrt(R * R - ua * ua) + 0.32;
        const yb = cy + Math.sqrt(R * R - ub * ub) + 0.32;
        beam(m, "brick", at(pl, ua * 1.03, ya, 0.06), at(pl, ub * 1.03, yb, 0.06), 0.3, 0.12, pl.n);
      }
      // the keystone
      m.box("stone", 0, s * (FRONT + 0.12), 0.7, 0.2, 14.75, 15.5);
      // the lantern's end above the gable
      m.slab("iron", [at(pl, -1.6, transY(1.6) - 0.16, 0.03), at(pl, 1.6, transY(1.6) - 0.16, 0.03), at(pl, 1.6, LANTERN_TOP, 0.03), at(pl, 0, RIDGE - 0.12, 0.03), at(pl, -1.6, LANTERN_TOP, 0.03)], mul(pl.n, -0.1));
    });
    if (s > 0) clock(m, pl);
  });
}

function clock(m: MeshBuilder, pl: Plane): void {
  m.scope("clock", () => {
    const yc = 12.3;
    const ring = (r: number, d: number): Vec3[] => Array.from({ length: 20 }, (_, i) => {
      const a = (i / 20) * Math.PI * 2;
      return at(pl, r * Math.cos(a), yc + r * Math.sin(a), d);
    });
    m.slab("iron", ring(1.18, 0.2), mul(pl.n, -0.1));
    m.slab("enamel", ring(1.0, 0.27), mul(pl.n, -0.06));
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const p = (r: number): Vec3 => at(pl, r * Math.cos(a), yc + r * Math.sin(a), 0.28);
      beam(m, "iron", p(0.78), p(k % 3 === 0 ? 0.94 : 0.9), k % 3 === 0 ? 0.08 : 0.05, 0.03, pl.n);
    }
    beam(m, "iron", at(pl, 0, yc - 0.05, 0.29), at(pl, 0, yc + 0.72, 0.29), 0.07, 0.03, pl.n);
    beam(m, "iron", at(pl, -0.03, yc + 0.03, 0.31), at(pl, 0.5, yc - 0.18, 0.31), 0.08, 0.03, pl.n);
    m.slab("gilt", ring(0.07, 0.33), mul(pl.n, -0.04));
  });
}

/** The iron-and-glass canopy over the +Z portal. */
function canopy(m: MeshBuilder): void {
  m.scope("entrance canopy", () => {
    const z0 = FRONT + 0.2;
    const z1 = FRONT + 3.2;
    const y0 = 6.15;
    const y1 = 5.75;
    const hw = 4.6;
    const yAt = (z: number): number => y0 + ((z - z0) / (z1 - z0)) * (y1 - y0);
    m.slab("glass", [[-hw, y0, z0], [hw, y0, z0], [hw, y1, z1], [-hw, y1, z1]], [0, -0.04, 0]);
    // rafters on top of the glass, the fascia and the valance
    for (let k = 0; k <= 8; k++) {
      const x = -hw + 0.1 + ((2 * hw - 0.2) * k) / 8;
      beam(m, "iron", [x, y0 + 0.02, z0 - 0.05], [x, y1 + 0.02, z1 + 0.05], 0.07, 0.12);
    }
    beam(m, "iron", [-hw - 0.05, y1 - 0.02, z1 + 0.06], [hw + 0.05, y1 - 0.02, z1 + 0.06], 0.22, 0.3, [0, 0, 1]);
    for (const sx of [-1, 1]) beam(m, "iron", [sx * (hw + 0.06), y0 - 0.02, z0], [sx * (hw + 0.06), y1 - 0.02, z1 + 0.06], 0.12, 0.3);
    m.scope("valance", () => {
      const n = 18;
      const w = (2 * hw) / n;
      for (let k = 0; k < n; k++) {
        const xa = -hw + k * w + 0.02;
        const xb = xa + w - 0.04;
        const z = z1 + 0.2;
        m.slab("iron", [[xa, y1 - 0.17, z], [xb, y1 - 0.17, z], [xb, y1 - 0.35, z], [(xa + xb) / 2, y1 - 0.55, z], [xa, y1 - 0.35, z]], [0, 0, -0.03]);
      }
    });
    m.scope("brackets", () => {
      for (const x of [-3.4, 3.4]) {
        const zc = FRONT + 0.05;
        m.slab("iron", [[x - 0.04, yAt(z0) - 0.1, zc], [x - 0.04, yAt(z0 + 2.2) - 0.1, z0 + 2.2], [x - 0.04, 4.4, zc]], [0.08, 0, 0]);
      }
    });
    m.scope("columns", () => {
      for (const sx of [-1, 1]) {
        const x = sx * (hw - 0.3);
        const z = z1 - 0.3;
        m.box("iron", x, z, 0.34, 0.34, 0.15, 0.7);
        m.prism("iron", oct(0.1, x, z), 0.7, y1 - 0.4, false);
        m.loft("iron", oct(0.1, x, z), y1 - 0.4, oct(0.2, x, z), y1 - 0.15, false);
        m.box("iron", x, z, 0.42, 0.42, y1 - 0.15, y1 - 0.04);
        beam(m, "iron", [x, y1 - 0.12, z], [x, yAt(z0) - 0.12, z0], 0.06, 0.1);
      }
    });
    // the lettering board over the portal
    m.box("enamel", 0, FRONT + 0.32, 5.2, 0.06, 6.3, 6.95);
    m.box("iron", 0, FRONT + 0.3, 5.4, 0.08, 6.25, 7.0, 0, false);
  });
}

// --- roofs --------------------------------------------------------------------------

/** A roof sheet: a slab whose top face is the quad a b c d, ROOF_T thick downwards. */
function sheet(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3): void {
  m.slab(mat, [a, b, c, d], [0, -ROOF_T, 0]);
}

/** A glazed band across a roof slope between fractions f0 and f1 of the way up, inset at the ends. */
function skylight(m: MeshBuilder, lowA: Vec3, lowB: Vec3, highA: Vec3, highB: Vec3, f0: number, f1: number, inset: number): void {
  const along = unit(sub(lowB, lowA));
  const p = (lo: Vec3, hi: Vec3, f: number, e: number): Vec3 => add(add(lo, mul(sub(hi, lo), f)), add(mul(along, e), [0, 0.045, 0]));
  m.slab("glass", [p(lowA, highA, f0, inset), p(lowB, highB, f0, -inset), p(lowB, highB, f1, -inset), p(lowA, highA, f1, inset)], [0, -0.03, 0]);
}

/** Standing seams on a slope: n bars from the low edge to the high edge. */
function seams(m: MeshBuilder, lowA: Vec3, lowB: Vec3, highA: Vec3, highB: Vec3, n: number): void {
  for (let k = 1; k < n; k++) {
    const t = k / n;
    const lo = add(lowA, mul(sub(lowB, lowA), t));
    const hi = add(highA, mul(sub(highB, highA), t));
    beam(m, "zinc", add(lo, [0, 0.03, 0]), add(hi, [0, 0.03, 0]), 0.05, 0.06);
  }
}

function roofs(m: MeshBuilder): void {
  m.scope("aisle roofs", () => {
    for (const s of [1, -1]) {
      for (const sx of [-1, 1]) {
        const xa = sx * (TR - 0.05);
        const xb = sx * (HX + 0.4);
        const zl = s * (HZ + 0.6);
        const zh = s * NAVE;
        const lA: Vec3 = [xa, aisleY(zl), zl];
        const lB: Vec3 = [xb, aisleY(zl), zl];
        const hA: Vec3 = [xa, aisleY(zh), zh];
        const hB: Vec3 = [xb, aisleY(zh), zh];
        sheet(m, "zinc", lA, lB, hB, hA);
        seams(m, lA, lB, hA, hB, 15);
        beam(m, "iron", add(lA, [sx * 0.05, -0.06, s * 0.04]), add(lB, [sx * 0.05, -0.06, s * 0.04]), 0.1, 0.18, [0, 0, s]);
      }
    }
  });
  m.scope("nave roof", () => {
    for (const s of [1, -1]) {
      for (const sx of [-1, 1]) {
        const xa = sx * (TURRET + 0.05);
        const xb = sx * (HX + 0.4);
        const zl = s * 7.6;
        const zh = s * 1.45;
        const lA: Vec3 = [xa, naveY(zl), zl];
        const lB: Vec3 = [xb, naveY(zl), zl];
        const hA: Vec3 = [xa, naveY(1.6) + 0.06, zh];
        const hB: Vec3 = [xb, naveY(1.6) + 0.06, zh];
        sheet(m, "zinc", lA, lB, hB, hA);
        seams(m, lA, lB, hA, hB, 17);
        skylight(m, lA, lB, hA, hB, 0.3, 0.68, 4.4);
        beam(m, "iron", add(lA, [sx * 0.05, -0.06, s * 0.04]), add(lB, [sx * 0.05, -0.06, s * 0.04]), 0.1, 0.18, [0, 0, s]);
      }
      // the bargeboards at the gables
      for (const sx of [-1, 1]) {
        beam(m, "iron", [sx * (HX + 0.45), naveY(7.6) + 0.02, s * 7.65], [sx * (HX + 0.45), naveY(1.6) + 0.06, s * 1.5], 0.1, 0.26, [0, 1, 0]);
      }
    }
  });
  m.scope("transept roof", () => {
    for (const sx of [1, -1]) {
      for (const s of [-1, 1]) {
        const za = s * (TURRET + 0.05);
        const zb = s * (FRONT + 0.4);
        const xl = sx * 6.4;
        const xh = sx * 1.45;
        const lA: Vec3 = [xl, transY(xl), za];
        const lB: Vec3 = [xl, transY(xl), zb];
        const hA: Vec3 = [xh, transY(1.6) + 0.06, za];
        const hB: Vec3 = [xh, transY(1.6) + 0.06, zb];
        sheet(m, "zinc", lA, lB, hB, hA);
        seams(m, lA, lB, hA, hB, 9);
        skylight(m, lA, lB, hA, hB, 0.3, 0.68, 4.6);
        beam(m, "iron", add(lA, [sx * 0.04, -0.06, s * 0.05]), add(lB, [sx * 0.04, -0.06, s * 0.05]), 0.1, 0.18, [sx, 0, 0]);
        beam(m, "iron", [sx * 6.45, transY(6.4) + 0.02, s * (FRONT + 0.45)], [sx * 1.5, transY(1.6) + 0.06, s * (FRONT + 0.45)], 0.1, 0.26, [0, 1, 0]);
      }
    }
  });
}

/** A ridge lantern along X (axis "x") or Z between a0 and a1 (|a| from the crossing out). */
function lantern(m: MeshBuilder, axis: "x" | "z", a0: number, a1: number, ridgeBase: number): void {
  const P = (along: number, across: number, y: number): Vec3 => (axis === "x" ? [along, y, across] : [across, y, along]);
  const len = Math.abs(a1 - a0);
  const sg = Math.sign(a1 - a0);
  // louvred sides with posts
  for (const s of [1, -1]) {
    const across = s * 1.6;
    const posts = Math.max(2, Math.round(len / 2.2));
    for (let k = 0; k <= posts; k++) {
      const al = a0 + (sg * len * k) / posts;
      beam(m, "iron", P(al, across, ridgeBase - 0.1), P(al, across, LANTERN_TOP + 0.05), 0.1, 0.12, [0, 0, 1]);
    }
    for (let k = 0; k < 3; k++) {
      const y = ridgeBase + 0.05 + k * 0.34;
      const out = s * 0.07;
      m.slab("iron", [P(a0, across + out, y), P(a1, across + out, y), P(a1, across - out, y + 0.42), P(a0, across - out, y + 0.42)], [0, -0.03, 0]);
    }
    beam(m, "iron", P(a0, across, LANTERN_TOP), P(a1, across, LANTERN_TOP), 0.16, 0.16, axis === "x" ? [0, 0, 1] : [1, 0, 0]);
    // the lantern roof
    const over = RIDGE + (0.05 / 2.0) * (RIDGE - LANTERN_TOP + 0.05);
    const b0 = a0 - sg * 0.08;
    const b1 = a1 + sg * 0.1;
    sheet(m, "zinc", P(b0, s * 2.0, LANTERN_TOP - 0.05), P(b1, s * 2.0, LANTERN_TOP - 0.05), P(b1, -s * 0.05, over), P(b0, -s * 0.05, over));
  }
  // the cresting along the ridge
  beam(m, "iron", P(a0, 0, RIDGE + 0.42), P(a1, 0, RIDGE + 0.42), 0.05, 0.06, axis === "x" ? [0, 0, 1] : [1, 0, 0]);
  beam(m, "iron", P(a0, 0, RIDGE - 0.02), P(a1, 0, RIDGE - 0.02), 0.14, 0.12, axis === "x" ? [0, 0, 1] : [1, 0, 0]);
  const n = Math.max(2, Math.round(len / 0.75));
  const side: Vec3 = axis === "x" ? [0, 0, 0.02] : [0.02, 0, 0];
  for (let k = 0; k <= n; k++) {
    const al = a0 + (sg * len * k) / n;
    const tip = k % 2 === 0 ? 0.78 : 0.6;
    beam(m, "iron", P(al, 0, RIDGE + 0.02), P(al, 0, RIDGE + tip - 0.12), 0.04, 0.04, axis === "x" ? [0, 0, 1] : [1, 0, 0]);
    const c = P(al, 0, RIDGE + tip - 0.12);
    const e = axis === "x" ? [1, 0, 0] : [0, 0, 1];
    const d = 0.09;
    m.slab("iron", [add(c, [-e[0] * d, -0.08, -e[2] * d]), add(c, [e[0] * d, -0.08, e[2] * d]), add(c, [0, 0.12, 0])], mul(side, -2) as Vec3);
  }
  // the finial at the outer end
  const end = P(a1, 0, RIDGE);
  m.rod("iron", end, add(end, [0, 0.9, 0]), 0.05, 6);
  m.loft("gilt", oct(0.06, end[0], end[2]), RIDGE + 0.9, oct(0.16, end[0], end[2]), RIDGE + 1.05, false);
  m.loft("gilt", oct(0.16, end[0], end[2]), RIDGE + 1.05, oct(0.05, end[0], end[2]), RIDGE + 1.25, false);
  m.spire("gilt", oct(0.05, end[0], end[2]), RIDGE + 1.25, RIDGE + 1.7);
}

function lanterns(m: MeshBuilder): void {
  m.scope("ridge lanterns", () => {
    for (const s of [1, -1]) lantern(m, "x", s * (TURRET - 0.1), s * (HX + 0.4), naveY(1.6));
    for (const s of [1, -1]) lantern(m, "z", s * (TURRET - 0.1), s * (FRONT + 0.4), transY(1.6));
  });
  m.scope("crossing lantern", () => {
    const h = TURRET;
    m.box("zinc", 0, 0, 2 * h, 2 * h, 17.3, 18.1, 0, false);
    m.box("iron", 0, 0, 2 * h + 0.2, 2 * h + 0.2, 18.1, 18.3);
    for (const [cx, cz] of [[h, h], [-h, h], [-h, -h], [h, -h]] as const) m.box("iron", cx, cz, 0.3, 0.3, 18.3, TURRET_EAVES - 0.3);
    for (let i = 0; i < 4; i++) {
      const pl: Plane = i === 0 ? sideZ(1, h) : i === 1 ? sideZ(-1, -h) : i === 2 ? sideX(1, h) : sideX(-1, -h);
      glazedBay(m, pl, -h + 0.15, h - 0.15, 18.3, { spring: 19.7, rise: 0.65, top: () => TURRET_EAVES - 0.3, mullions: 3, transoms: [], segs: 6 });
    }
    m.box("iron", 0, 0, 2 * h + 0.3, 2 * h + 0.3, TURRET_EAVES - 0.3, TURRET_EAVES, 0, false);
    m.cap("zinc", rect(2 * h + 0.7, 2 * h + 0.7), TURRET_EAVES, false);
    m.loft("zinc", rect(2 * h + 0.7, 2 * h + 0.7), TURRET_EAVES, rect(1.0, 1.0), TURRET_APEX - 0.5, false);
    m.loft("zinc", rect(1.0, 1.0), TURRET_APEX - 0.5, rect(0.5, 0.5), TURRET_APEX, true);
    // the hip rolls
    for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]] as const) {
      const a: Vec3 = [sx * (h + 0.35), TURRET_EAVES + 0.03, sz * (h + 0.35)];
      const b: Vec3 = [sx * 0.5, TURRET_APEX - 0.47, sz * 0.5];
      m.rod("iron", a, b, 0.05, 5);
    }
    // the finial
    m.rod("iron", [0, TURRET_APEX - 0.05, 0], [0, 23.7, 0], 0.08, 6);
    m.loft("gilt", oct(0.1), 23.7, oct(0.26), 23.9, false);
    m.loft("gilt", oct(0.26), 23.9, oct(0.08), 24.2, false);
    m.rod("gilt", [0, 24.2, 0], [0, 24.6, 0], 0.04, 6);
    m.spire("gilt", oct(0.08), 24.55, FINIAL_TOP);
    beam(m, "gilt", [-0.35, 24.3, 0], [0.35, 24.3, 0], 0.04, 0.04);
    beam(m, "gilt", [0, 24.3, -0.35], [0, 24.3, 0.35], 0.05, 0.05);
  });
}

// --- inside ---------------------------------------------------------------------------

function stall(m: MeshBuilder, x: number, z: number, sx: number, k: number): void {
  // a counter 2.4 m long (along Z) facing the central aisle (toward -sx*x), awning above
  const L = 2.4;
  const front = x - sx * 0.55;
  m.box("timber", x, z, 1.1, L, FLOOR + 0.02, 1.15);
  m.box("produce", x - sx * 0.2, z, 0.5, L - 0.3, 1.15, 1.32);
  m.box(k % 2 === 0 ? "canvas" : "enamel", front - sx * 0.03, z, 0.04, L, 0.5, 1.05, 0, false);
  for (const dz of [-L / 2 + 0.05, L / 2 - 0.05]) beam(m, "timber", [x + sx * 0.5, FLOOR - 0.02, z + dz], [x + sx * 0.5, 2.7, z + dz], 0.08, 0.08);
  m.slab(k % 2 === 0 ? "canvas" : "enamel", [[x + sx * 0.55, 2.7, z - L / 2], [x + sx * 0.55, 2.7, z + L / 2], [front - sx * 0.6, 2.25, z + L / 2], [front - sx * 0.6, 2.25, z - L / 2]], [0, -0.04, 0]);
  m.box("produce", x + sx * 0.3, z, 0.4, L - 0.4, 1.15, 1.25);
}

function interior(m: MeshBuilder): void {
  m.scope("floor", () => {
    m.box("paving", 0, 0, 2 * HX - 0.6, 2 * HZ - 0.6, FLOOR, FLOOR + 0.02, 0);
    // the stone walk down the transept
    m.box("stone", 0, 0, 3.2, 2 * FRONT - 0.6, FLOOR + 0.02, FLOOR + 0.035);
  });
  m.scope("market stalls", () => {
    let k = 0;
    for (const s of [1, -1]) {
      for (const zc of [3.6, 6.6, 9.6, 12.4]) {
        for (const sx of [-1, 1]) stall(m, sx * 3.7, s * zc, sx, k++);
      }
    }
  });
  m.scope("girders", () => {
    // the longitudinal girders over the nave columns and the crossing arches
    for (const s of [1, -1]) {
      for (const sx of [-1, 1]) beam(m, "iron", [sx * TR, 11.6, s * NAVE], [sx * HX, 11.6, s * NAVE], 0.8, 0.2, [0, 0, 1]);
      beam(m, "iron", [-TR + 0.15, 11.6, s * NAVE], [TR - 0.15, 11.6, s * NAVE], 0.8, 0.2, [0, 0, 1]);
      beam(m, "iron", [s * TR, 11.5, -NAVE + 0.12], [s * TR, 11.5, NAVE - 0.12], 0.6, 0.2, [1, 0, 0]);
    }
  });
}

// --- the hall -------------------------------------------------------------------------

export function marketHall(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("market hall", () => {
    m.scope("plinth", () => {
      m.box("stone", 0, 0, 2 * HX + 1.2, 2 * HZ + 1.2, 0, FLOOR);
      m.box("stone", 0, FRONT + 1.7, 10.4, 3.4, 0, 0.15);
      m.box("stone", 0, -FRONT - 1.0, 10.4, 2.0, 0, 0.15);
    });
    m.scope("columns", () => {
      for (const s of [1, -1]) {
        for (const x of XS) if (Math.abs(x) > TR) column(m, x, s * HZ, CORNICE);
        for (const z of [-NAVE, 0, NAVE]) if (z === 0) column(m, s * HX, 0, CORNICE);
        for (const x of XS) if (x !== 0 && Math.abs(x) < HX) column(m, x, s * NAVE, CLER_TOP);
        for (const z of [NAVE, -NAVE]) column(m, s * HX, z, CLER_TOP);
      }
    });
    longSides(m);
    endWalls(m);
    clerestories(m);
    front(m, 1);
    front(m, -1);
    canopy(m);
    roofs(m);
    lanterns(m);
    interior(m);
  });
  return m;
}

/** Low detail: the stepped basilica section in bands, the crossing spire, the fronts and the canopy. */
export function marketHallLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  lodBox(m, "stone", 0, 0, 2 * HX + 1.2, 2 * HZ + 1.2, 0, FLOOR);
  m.box("brick", 0, 0, 2 * HX, 2 * HZ, FLOOR, SILL, 0, false);
  m.box("panes", 0, 0, 2 * HX, 2 * HZ, SILL, CORNICE, 0, false);
  m.box("iron", 0, 0, 2 * HX + 0.7, 2 * HZ + 0.7, CORNICE, EAVES, 0, false);
  // the aisle roofs and the clerestory as one stepped section along X
  m.sweep("zinc", "x", [[-HZ - 0.6, EAVES], [HZ + 0.6, EAVES], [NAVE, aisleY(NAVE)], [-NAVE, aisleY(NAVE)]], -HX - 0.4, [[-HZ - 0.6, EAVES], [HZ + 0.6, EAVES], [NAVE, aisleY(NAVE)], [-NAVE, aisleY(NAVE)]], HX + 0.4);
  m.box("panes", 0, 0, 2 * HX, 2 * NAVE, aisleY(NAVE), CLER_TOP, 0, false);
  const nave: Ring = [[-7.6, CLER_TOP], [7.6, CLER_TOP], [1.6, naveY(1.6)], [0, RIDGE], [-1.6, naveY(1.6)]];
  m.sweep("zinc", "x", nave, -HX - 0.4, nave, HX + 0.4);
  // the transept: its fronts and its roof
  m.box("panes", 0, 0, 2 * TR, 2 * FRONT, aisleY(NAVE), CLER_TOP, 0, false);
  m.box("stone", 0, 0, 2 * TR, 2 * FRONT, FLOOR, aisleY(NAVE), 0, false);
  const trans: Ring = [[-6.4, CLER_TOP - 0.01], [6.4, CLER_TOP - 0.01], [1.6, transY(1.6)], [0, RIDGE], [-1.6, transY(1.6)]];
  m.sweep("zinc", "z", trans, -FRONT - 0.4, trans, FRONT + 0.4);
  for (const s of [1, -1]) for (const sx of [-1, 1]) m.box("brick", sx * PIER_X, s * (FRONT - 0.1), 1.2, 1.4, 0, 16.6);
  // the crossing lantern and its finial
  lodBox(m, "iron", 0, 0, 2 * TURRET + 0.3, 2 * TURRET + 0.3, 17.3, TURRET_EAVES);
  m.loft("zinc", rect(2 * TURRET + 0.7, 2 * TURRET + 0.7), TURRET_EAVES, rect(0.5, 0.5), TURRET_APEX, true);
  m.spire("gilt", ngon(4, 0.3, Math.PI / 4), TURRET_APEX, FINIAL_TOP);
  // the canopy
  lodBox(m, "iron", 0, FRONT + 1.7, 9.2, 3.0, 5.4, 6.1);
  lodBox(m, "stone", 0, FRONT + 1.7, 10.4, 3.4, 0, 0.15);
  return m;
}

export const MARKET_HALL: ProceduralDesign[] = [
  {
    id: "bld-market-hall",
    game: { plaza: { cities: ["town", "city"], layouts: ["rect"], fit: "footprint" } },
    title: "Market Hall",
    build: marketHall,
    buildLod: marketHallLod,
    references: "market-hall",
    catalog: PLAZA_CATALOG,
  },
];
