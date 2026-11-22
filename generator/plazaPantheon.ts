// The Pantheon on the Piazza della Rotonda in Rome, the temple of all the gods rebuilt
// under Hadrian (about AD 113-125) and a church since 609. A plaza landmark
// (docs/models/plaza-landmarks.md).
//
// Real dimensions: the rotunda is 43.3 m across inside and as high to the oculus,
// its brick-faced concrete wall about 6 m thick, so the drum stands about 56 m
// across. Outside, cornices divide the drum into three storeys; over the top cornice
// the stepped rings climb onto the shallow lead-covered dome, open at its crown in
// the 8.2 m oculus. Through the oculus the coffered inner dome shows: five rings of
// 28 recessed coffers and the smooth band up to the opening. In front stands the
// intermediate block, a rectangular transition with a second pediment over its
// cornice, and the portico facing +Z: sixteen monolithic granite Corinthian columns
// (shafts 11.8 m tall and about 1.5 m across) - eight grey ones across the front and
// two rows of four pink ones behind the first, third, sixth and eighth, forming
// the central nave to the great bronze doors and two aisles ending in niches - under
// the entablature with the bronze-lettered inscription M.AGRIPPA.L.F.COS.TERTIVM.FECIT,
// the pediment with the fixing holes of its lost bronze relief, and the tiled roof.
//
// Modelled in metres, +Y up, the piazza at y = 0, centred on the footprint; the
// portico faces +Z. Deterministic: the same code gives the same bytes.
//
// Sources: Wikipedia "Pantheon, Rome", the photographs in assets/pantheon/
// (SOURCES.md).
//
// The id is what the game's saved maps store, so the design is never renamed once
// shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  brick: { color: "#86705e", roughness: 0.95 },
  brickDark: { color: "#6f5a4a", roughness: 0.95 },
  stucco: { color: "#a9a091", roughness: 0.9 },
  lead: { color: "#7b7f83", metallic: 0.2, roughness: 0.6 },
  marble: { color: "#d9d1c0", roughness: 0.85 },
  marbleShade: { color: "#b9af9c", roughness: 0.9 },
  granite: { color: "#8b8c89", roughness: 0.8 },
  granitePink: { color: "#a8877b", roughness: 0.8 },
  bronze: { color: "#4a3b2a", metallic: 0.55, roughness: 0.5 },
  dark: { color: "#2a2521", roughness: 1 },
  interior: { color: "#a88f7c", roughness: 0.85 },
  coffer: { color: "#c3b8a3", roughness: 0.9 },
};

// --- helpers -----------------------------------------------------------------------

/** A box() given by its spans; no underside. */
function span(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1, 0, top);
}

/** A closed box spanning x0..x1, y0..y1, z0..z1 (with its underside). */
function cube(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  const r = rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);
  m.prism(mat, r, y0, y1, top);
  m.cap(mat, r, y0, false);
}

/**
 * A surface of revolution about the vertical through (cx, cz): the profile's points
 * (radius, height, material of the segment to the next point) joined by lofts of n
 * sides. A segment's face looks to the right of the path in the (r, y) plane, so a
 * path climbing the outside faces out and one coming down the inside faces in.
 */
function lathe(m: MeshBuilder, n: number, rot: number, pts: Array<[number, number, string]>, cx = 0, cz = 0): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [r0, y0, mat] = pts[i]!;
    const [r1, y1] = pts[i + 1]!;
    if (r0 === r1 && y0 === y1) continue;
    m.loft(mat, ngon(n, r0, rot, cx, cz), y0, ngon(n, r1, rot, cx, cz), y1, false);
  }
}

/** A planar quad turned to face along `n`. */
function face(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  m.facets(mat, [a, b, c, a, c, d], n);
}

/**
 * A rectangular ring of four vertical walls about x = 0: half width hx, from z0 to z1,
 * y0..y1, facing out (or in when `inward`).
 */
function rectRing(hx: number, z0: number, z1: number, inward = false): Ring {
  const r = rect(2 * hx, z1 - z0, 0, (z0 + z1) / 2);
  return inward ? [...r].reverse() : r;
}

// --- dimensions --------------------------------------------------------------------

// rotunda (z about the rotunda's centre; the whole model is moved by DZ at the end)
const N_OUT = 64; // facets of the drum and the dome
const R_DRUM = 27.6; // the drum's brick face (about 56 m across over the cornices)
const R_IN = 21.65; // the rotunda inside: 43.3 m across
const Y_SPRING = 20.2; // the inner dome springs here
const R_OCULUS = 4.1; // 8.2 m across
const Y_OCULUS = 43.3; // the oculus rim
const Y_TOP_CORNICE = 30.4;
const STEPS: Array<[number, number]> = [[27.2, 31.15], [26.6, 31.9], [26.0, 32.6], [25.4, 33.3], [24.8, 33.95], [24.2, 34.6]];
const R_DOME0 = 24.2; // the dome proper starts over the last step ring
const Y_DOME0 = 34.6;
const R_LIP = 4.6; // the outer edge of the oculus's bronze rim
// the outer dome: a spherical segment through (R_DOME0, Y_DOME0) and (R_LIP, Y_OCULUS)
const DOME_YC = (R_DOME0 * R_DOME0 + Y_DOME0 * Y_DOME0 - R_LIP * R_LIP - Y_OCULUS * Y_OCULUS) / (2 * (Y_DOME0 - Y_OCULUS));
const DOME_R = Math.hypot(R_DOME0, Y_DOME0 - DOME_YC);

// portico
const Y_POD = 1.3; // the podium, five steps above the piazza
const COL_X = [-15.75, -11.25, -6.75, -2.25, 2.25, 6.75, 11.25, 15.75];
const ROW_Z = [47.6, 43.0, 38.4]; // the front row and the two rows behind
const INNER_X = [-15.75, -6.75, 6.75, 15.75]; // behind the 1st, 3rd, 6th and 8th
const Y_SHAFT0 = 1.97;
const Y_SHAFT1 = 13.77; // 11.8 m shafts
const Y_CAP = 15.45; // top of the abacus, underside of the architrave
const Y_ARCH = 16.95;
const Y_FRIEZE = 18.35;
const Y_CORNICE = 19.45;
const Y_CEIL = 18.05; // the portico's ceiling
const EX = 16.6; // architrave half width
const EZ = 48.45; // architrave front face
const GX = 17.4; // the cornice's edge
const GZ = 49.25;
const Z_BACK = 21.0; // where the entablature dies into the drum
const POD_Z = 49.0; // the podium's front
const STEP_D = 0.36;
const STEP_H = Y_POD / 5;
const Z_FRONT = POD_Z + 4 * STEP_D;
const SLOPE = Math.tan((23 * Math.PI) / 180);
const ROOF_T = 0.32;
const Z_TYMP = 48.3; // the tympanum, recessed behind the frieze

// intermediate block
const BX = 16.3;
const BZ0 = 19.5;
const BZ1 = 33.0; // its front wall, the portico's back
const Y_BLOCK = 29.0;
const Y_BLOCK_CORNICE = 30.0;
const BGX = 17.0; // its cornice's edge
const BGZ = 33.7;

const DZ = -(Z_FRONT - (R_DRUM + 1.0)) / 2; // centres the footprint on z = 0

// --- rotunda -----------------------------------------------------------------------

function domePoint(t: number): [number, number] {
  // t = 0 at the dome's foot, 1 at the oculus rim
  const a0 = Math.atan2(Y_DOME0 - DOME_YC, R_DOME0);
  const a1 = Math.atan2(Y_OCULUS - DOME_YC, R_LIP);
  const a = a0 + (a1 - a0) * t;
  return [DOME_R * Math.cos(a), DOME_YC + DOME_R * Math.sin(a)];
}

function rotunda(m: MeshBuilder): void {
  m.scope("rotunda", () => {
    m.scope("drum and dome", () => {
      const p: Array<[number, number, string]> = [
        // the plinth
        [28.0, 0, "stucco"], [28.0, 0.9, "stucco"], [R_DRUM, 0.9, "brick"],
        // first storey and its cornice
        [R_DRUM, 11.6, "stucco"], [27.9, 11.6, "stucco"], [28.05, 11.85, "stucco"], [28.05, 12.2, "stucco"], [R_DRUM, 12.2, "brick"],
        // second storey and its cornice
        [R_DRUM, 19.0, "stucco"], [27.85, 19.0, "stucco"], [27.95, 19.2, "stucco"], [27.95, 19.5, "stucco"], [R_DRUM, 19.5, "brick"],
        // third storey and the top cornice with its dentil course
        [R_DRUM, 29.0, "stucco"], [27.85, 29.0, "stucco"], [28.3, 29.5, "stucco"], [28.45, 29.5, "stucco"], [28.45, 29.85, "stucco"],
        [28.6, 30.05, "stucco"], [28.6, Y_TOP_CORNICE, "stucco"],
      ];
      // the step rings
      let r = 28.6;
      let y = Y_TOP_CORNICE;
      for (const [rs, ys] of STEPS) {
        p.push([rs, y, "stucco"]);
        r = rs;
        y = ys;
        p.push([r, y, "stucco"]);
      }
      p[p.length - 1]![2] = "lead";
      // the dome
      const rows = 14;
      for (let i = 1; i <= rows; i++) {
        const [dr, dy] = domePoint(i / rows);
        p.push([dr, dy, i === rows ? "bronze" : "lead"]);
      }
      // the oculus's bronze rim and its bore, down past the inner dome
      p.push([R_LIP, Y_OCULUS + 0.3, "bronze"], [R_OCULUS, Y_OCULUS + 0.3, "bronze"], [R_OCULUS, 41.0, "bronze"]);
      lathe(m, N_OUT, 0, p);
    });
    interior(m);
    drumWindows(m);
    relievingArches(m);
  });
}

/** The room under the dome: the coffered inner dome, the walls and the floor. */
function interior(m: MeshBuilder): void {
  m.scope("interior", () => {
    const N = 28;
    const rot = Math.PI / 2 + Math.PI / N; // a coffer column centred on +Z
    const sph = (phi: number): [number, number] => [R_IN * Math.cos(phi), Y_SPRING + R_IN * Math.sin(phi)];
    const phiTop = Math.acos((R_OCULUS / Math.cos(Math.PI / N)) / R_IN);
    const PH0 = (2 * Math.PI) / 180;
    const PH5 = (57 * Math.PI) / 180;
    m.scope("smooth crown", () => {
      const p: Array<[number, number, string]> = [];
      const rows = 4;
      for (let i = 0; i <= rows; i++) {
        const [r, y] = sph(phiTop + ((PH5 - phiTop) * i) / rows);
        p.push([r, y, "coffer"]);
      }
      lathe(m, N, rot, p);
    });
    m.scope("walls and floor", () => {
      const [r0, y0] = sph(PH0);
      lathe(m, N, rot, [
        [r0, y0, "coffer"], [R_IN, Y_SPRING, "interior"],
        // the main cornice and the attic's sill
        [R_IN, 13.4, "marble"], [R_IN - 0.6, 13.4, "marble"], [R_IN - 0.6, 12.6, "marble"], [R_IN, 12.6, "interior"],
        [R_IN, 0, "marbleShade"], [0, 0, "marbleShade"],
      ]);
    });
    m.scope("coffers", () => {
      // five rings of 28, each a frame flush with the dome and a sunk panel
      const D = 0.7;
      const P = (a: number, phi: number, rr: number): Vec3 => {
        const c = Math.cos(phi) * rr;
        return [c * Math.cos(a), Y_SPRING + rr * Math.sin(phi), -c * Math.sin(a)];
      };
      const centre: Vec3 = [0, Y_SPRING, 0];
      for (let j = 0; j < 5; j++) {
        const f0 = PH0 + ((PH5 - PH0) * j) / 5;
        const f1 = PH0 + ((PH5 - PH0) * (j + 1)) / 5;
        for (let i = 0; i < N; i++) {
          const a0 = rot + (i / N) * Math.PI * 2;
          const a1 = rot + ((i + 1) / N) * Math.PI * 2;
          const ia0 = a0 + (a1 - a0) * 0.17;
          const ia1 = a1 - (a1 - a0) * 0.17;
          const if0 = f0 + (f1 - f0) * 0.2;
          const if1 = f1 - (f1 - f0) * 0.14;
          // the outer cell on the sphere, as the lathe's rings would draw it
          const cr = (a: number, phi: number): Vec3 => P(a, phi, R_IN);
          const o = [cr(a0, f0), cr(a1, f0), cr(a1, f1), cr(a0, f1)];
          const n = [cr(ia0, if0), cr(ia1, if0), cr(ia1, if1), cr(ia0, if1)];
          // the panel is sunk along the dome's normal; the recess narrows a little
          const sa0 = ia0 + (ia1 - ia0) * 0.08;
          const sa1 = ia1 - (ia1 - ia0) * 0.08;
          const sf0 = if0 + (if1 - if0) * 0.12;
          const sf1 = if1 - (if1 - if0) * 0.04;
          const d = [P(sa0, sf0, R_IN + D), P(sa1, sf0, R_IN + D), P(sa1, sf1, R_IN + D), P(sa0, sf1, R_IN + D)];
          const toC = (q: Vec3): Vec3 => [centre[0] - q[0], centre[1] - q[1], centre[2] - q[2]];
          for (let k = 0; k < 4; k++) {
            const l = (k + 1) % 4;
            face(m, "coffer", o[k]!, o[l]!, n[l]!, n[k]!, toC(o[k]!));
            // the recess wall faces the middle of the coffer
            const mid: Vec3 = [(n[0]![0] + n[2]![0]) / 2, (n[0]![1] + n[2]![1]) / 2, (n[0]![2] + n[2]![2]) / 2];
            const em: Vec3 = [(n[k]![0] + n[l]![0]) / 2, (n[k]![1] + n[l]![1]) / 2, (n[k]![2] + n[l]![2]) / 2];
            face(m, "coffer", n[k]!, n[l]!, d[l]!, d[k]!, [mid[0] - em[0], mid[1] - em[1], mid[2] - em[2]]);
          }
          face(m, "marbleShade", d[0]!, d[1]!, d[2]!, d[3]!, toC(d[0]!));
        }
      }
    });
  });
}

/** The small windows of the drum's upper storeys. */
function drumWindows(m: MeshBuilder): void {
  m.scope("windows", () => {
    const step = (Math.PI * 2) / N_OUT;
    const apo = R_DRUM * Math.cos(step / 2);
    for (let k = 2; k < N_OUT; k += 8) {
      const a = (k + 0.5) * step; // the middle of a facet
      const u: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
      if (u[2] > 0.55) continue; // behind the intermediate block
      const s: Vec3 = [-u[2], 0, u[0]];
      for (const [y0, y1] of [[14.6, 16.4], [22.8, 24.6]] as Array<[number, number]>) {
        const c = (t: number, y: number): Vec3 => [u[0] * (apo + 0.03) + s[0] * t, y, u[2] * (apo + 0.03) + s[2] * t];
        face(m, "dark", c(-0.55, y0), c(0.55, y0), c(0.55, y1), c(-0.55, y1), u);
      }
    }
  });
}

/**
 * The relieving arches built into the drum's brick face, standing a few centimetres
 * proud: a ring of brick 0.7 m deep over each bay of the inner niches.
 */
function relievingArches(m: MeshBuilder): void {
  m.scope("relieving arches", () => {
    const R = R_DRUM + 0.05; // outside every facet
    const on = (a: number, y: number): Vec3 => [R * Math.cos(a), y, -R * Math.sin(a)];
    const arch = (ac: number, half: number, ySpring: number, rise: number): void => {
      const segs = 10;
      const pts = (k: number, inset: number): Vec3 => {
        const t = Math.PI - (k / segs) * Math.PI;
        const s = Math.cos(t) * (half - inset);
        const y = ySpring + Math.sin(t) * (rise - inset);
        return on(ac + s / R, y);
      };
      for (let k = 0; k < segs; k++) {
        const a = pts(k, 0);
        const b = pts(k + 1, 0);
        const c = pts(k + 1, 0.7);
        const d = pts(k, 0.7);
        const mid = (a[0] + b[0]) / 2;
        const midz = (a[2] + b[2]) / 2;
        face(m, "brickDark", a, b, c, d, [mid, 0, midz]);
      }
    };
    for (let i = 0; i < 16; i++) {
      const a = ((i + 0.5) / 16) * Math.PI * 2;
      const u = -Math.sin(a); // z of the direction
      if (u > 0.5) continue; // behind the intermediate block
      arch(a, 4.6, 22.0, 4.2);
      arch(a + Math.PI / 16, 3.4, 13.4, 3.0);
    }
  });
}

// --- the Corinthian column ------------------------------------------------------------

function corinthianColumn(m: MeshBuilder, cx: number, cz: number, mat: string): void {
  m.scope("column", () => {
    cube(m, "marble", cx - 0.95, cx + 0.95, Y_POD, Y_POD + 0.25, cz - 0.95, cz + 0.95);
    lathe(m, 20, Math.PI / 20, [
      [0.93, Y_POD + 0.25, "marble"], [0.95, Y_POD + 0.36, "marble"], [0.88, Y_POD + 0.48, "marble"], [0.8, Y_POD + 0.52, "marble"],
      [0.84, Y_POD + 0.6, "marble"], [0.76, Y_SHAFT0, mat],
      [0.75, 5.9, mat], [0.72, 9.85, mat], [0.65, Y_SHAFT1, "marble"],
      [0.7, Y_SHAFT1, "marble"], [0.7, Y_SHAFT1 + 0.12, "marble"], [0.64, Y_SHAFT1 + 0.12, "marble"], [0.84, 15.15, "marble"],
    ], cx, cz);
    // the abacus with its corners reaching out over the volutes
    cube(m, "marble", cx - 1.02, cx + 1.02, 15.15, Y_CAP, cz - 1.02, cz + 1.02, false);
    const yb = Y_SHAFT1 + 0.12;
    const bell = (y: number): number => 0.64 + ((y - yb) / (15.15 - yb)) * 0.2;
    m.scope("acanthus", () => {
      const leaf = (a: number, y0: number, y1: number, half: number, out: number): void => {
        const u: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
        const s: Vec3 = [-u[2], 0, u[0]];
        const r0 = bell(y0) - 0.02;
        const r1 = bell(y1) + out;
        const at = (t: number, f: number): Vec3 => {
          const y = y0 + (y1 - y0) * f;
          const r = r0 + (r1 - r0) * f;
          return [cx + u[0] * r + s[0] * t, y, cz + u[2] * r + s[2] * t];
        };
        m.slab("marble", [at(-half * 0.7, 0), at(half * 0.7, 0), at(half, 0.6), at(0, 1), at(-half, 0.6)], [-u[0] * 0.1, 0, -u[2] * 0.1]);
      };
      for (let i = 0; i < 8; i++) leaf(((i + 0.5) / 8) * Math.PI * 2, yb, yb + 0.55, 0.26, 0.12);
      for (let i = 0; i < 8; i++) leaf((i / 8) * Math.PI * 2, yb + 0.25, yb + 1.0, 0.24, 0.14);
    });
    m.scope("volutes", () => {
      for (let i = 0; i < 4; i++) {
        const a = ((i + 0.5) / 4) * Math.PI * 2;
        const u: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
        const s: Vec3 = [-u[2], 0, u[0]];
        const r = 1.02 * Math.SQRT2 - 0.3;
        const c = (t: number, y: number): Vec3 => [cx + u[0] * r + s[0] * t, y, cz + u[2] * r + s[2] * t];
        m.slab("marble", [c(-0.2, 14.62), c(0.2, 14.62), c(0.24, 14.9), c(0.12, 15.15), c(-0.12, 15.15), c(-0.24, 14.9)], [-u[0] * 0.55, 0, -u[2] * 0.55]);
      }
    });
  });
}

// --- portico ---------------------------------------------------------------------------

function podium(m: MeshBuilder): void {
  m.scope("podium", () => {
    span(m, "marbleShade", -17.2, 17.2, 0, Y_POD, BZ1 - 0.5, POD_Z);
    m.scope("steps", () => {
      const W = 17.2;
      for (let i = 0; i < 4; i++) {
        const zr = POD_Z + (4 - i) * STEP_D; // this step's riser
        const y0 = i * STEP_H;
        const y1 = (i + 1) * STEP_H;
        face(m, "marbleShade", [-W, y0, zr], [W, y0, zr], [W, y1, zr], [-W, y1, zr], [0, 0, 1]);
        face(m, "marble", [-W, y1, zr - STEP_D], [W, y1, zr - STEP_D], [W, y1, zr], [-W, y1, zr], [0, 1, 0]);
        for (const s of [-1, 1]) face(m, "marbleShade", [s * W, y0, POD_Z], [s * W, y0, zr], [s * W, y1, zr], [s * W, y1, POD_Z], [s, 0, 0]);
      }
    });
  });
}

function colonnade(m: MeshBuilder): void {
  m.scope("colonnade", () => {
    for (const x of COL_X) corinthianColumn(m, x, ROW_Z[0]!, "granite");
    for (const z of ROW_Z.slice(1)) for (const x of INNER_X) corinthianColumn(m, x, z, "granitePink");
    m.scope("antae", () => {
      for (const s of [-1, 1]) {
        const x0 = s > 0 ? 14.9 : -16.5;
        const x1 = s > 0 ? 16.5 : -14.9;
        span(m, "marble", x0, x1, Y_POD, Y_CAP + 0.1, BZ1 + 0.1, 35.2, false);
        span(m, "marble", x0 - 0.1, x1 + 0.1, 13.9, 14.9, BZ1 + 0.1, 35.3, true);
      }
    });
  });
}

function entablature(m: MeshBuilder): void {
  m.scope("entablature", () => {
    // the beams run round the portico and on along the block's sides into the drum
    // the architrave's three fasciae, each a little proud of the one below
    const fasciae: Array<[number, number, number]> = [[-0.08, Y_CAP, Y_CAP + 0.45], [-0.04, Y_CAP + 0.45, Y_CAP + 0.95], [0, Y_CAP + 0.95, Y_ARCH - 0.12]];
    for (const [d, y0, y1] of fasciae) {
      m.prism("marble", rectRing(EX + d, Z_BACK, EZ + d), y0, y1, false);
      if (d < 0) m.loft("marbleShade", rectRing(EX + d, Z_BACK, EZ + d), y1, rectRing(EX + d + 0.04, Z_BACK, EZ + d + 0.04), y1, false);
    }
    m.prism("marbleShade", rectRing(EX + 0.04, Z_BACK, EZ + 0.04), Y_ARCH - 0.12, Y_ARCH, false);
    m.loft("marbleShade", rectRing(EX + 0.04, Z_BACK, EZ + 0.04), Y_ARCH, rectRing(EX - 0.05, Z_BACK, EZ - 0.05), Y_ARCH, false);
    m.prism("marble", rectRing(EX - 0.05, Z_BACK, EZ - 0.05), Y_ARCH, Y_FRIEZE, false);
    // the cornice: a sloped soffit, the corona and its top
    m.loft("marbleShade", rectRing(EX - 0.05, Z_BACK, EZ - 0.05), Y_FRIEZE, rectRing(GX, Z_BACK, GZ), Y_FRIEZE + 0.6, false);
    m.prism("marble", rectRing(GX, Z_BACK, GZ), Y_FRIEZE + 0.6, Y_CORNICE, false);
    m.loft("marble", rectRing(GX, Z_BACK, GZ), Y_CORNICE, rectRing(16.2, Z_BACK, EZ - 0.2), Y_CORNICE, false);
    // the inside of the portico: the beams' inner faces and their soffits
    const IX = 15.0;
    const IZ = EZ - 1.6;
    m.prism("marble", rectRing(IX, BZ1 - 0.1, IZ, true), Y_CAP, Y_CEIL + 0.05, false);
    m.loft("marbleShade", rectRing(IX, BZ1 - 0.1, IZ), Y_CAP, rectRing(EX - 0.08, Z_BACK, EZ - 0.08), Y_CAP, false);
    // the architraves over the inner rows, dividing nave and aisles
    for (const x of [-6.75, 6.75]) {
      span(m, "marble", x - 0.7, x + 0.7, Y_CAP, Y_CEIL + 0.05, BZ1 - 0.1, IZ + 0.05, false);
      m.cap("marble", rect(1.4, IZ - BZ1 + 0.1, x, (BZ1 - 0.1 + IZ) / 2), Y_CAP, false);
    }
  });
  inscription(m);
}

// a 3 x 5 block alphabet for the inscription: [x0, y0, x1, y1] strokes
const GLYPHS: Record<string, Array<[number, number, number, number]>> = {
  M: [[0, 0, 0.8, 5], [2.2, 0, 3, 5], [0.8, 3.4, 1.3, 4.6], [1.7, 3.4, 2.2, 4.6], [1.2, 2.4, 1.8, 3.6]],
  A: [[0, 0, 0.8, 4], [2.2, 0, 3, 4], [0.5, 4, 2.5, 5], [0.8, 1.8, 2.2, 2.6]],
  G: [[0, 0.6, 0.8, 4.4], [0.4, 4.2, 3, 5], [0.4, 0, 3, 0.8], [2.2, 0.8, 3, 2.6], [1.5, 2.0, 2.2, 2.6]],
  R: [[0, 0, 0.8, 5], [0.8, 4.2, 2.6, 5], [2.2, 2.6, 3, 4.2], [0.8, 2.0, 2.4, 2.8], [2.0, 0, 2.8, 2.0]],
  I: [[0, 0, 0.8, 5]],
  P: [[0, 0, 0.8, 5], [0.8, 4.2, 2.6, 5], [2.2, 2.4, 3, 4.2], [0.8, 2.0, 2.4, 2.8]],
  L: [[0, 0, 0.8, 5], [0.8, 0, 2.8, 0.8]],
  F: [[0, 0, 0.8, 5], [0.8, 4.2, 2.8, 5], [0.8, 2.2, 2.3, 3]],
  C: [[0, 0.6, 0.8, 4.4], [0.4, 4.2, 3, 5], [0.4, 0, 3, 0.8]],
  O: [[0, 0.6, 0.8, 4.4], [2.2, 0.6, 3, 4.4], [0.4, 4.2, 2.6, 5], [0.4, 0, 2.6, 0.8]],
  S: [[0.3, 4.2, 3, 5], [0, 2.6, 0.8, 4.4], [0.4, 2.1, 2.6, 2.9], [2.2, 0.6, 3, 2.4], [0, 0, 2.7, 0.8]],
  E: [[0, 0, 0.8, 5], [0.8, 4.2, 2.8, 5], [0.8, 2.1, 2.3, 2.9], [0.8, 0, 2.8, 0.8]],
  T: [[0, 4.2, 3, 5], [1.1, 0, 1.9, 4.2]],
  V: [[0, 1.2, 0.8, 5], [2.2, 1.2, 3, 5], [0.6, 0, 2.4, 1.2]],
  ".": [[0, 2.1, 0.7, 2.8]],
};
const TEXT = "M.AGRIPPA.L.F.COS.TERTIVM.FECIT";

function inscription(m: MeshBuilder): void {
  m.scope("inscription", () => {
    const adv = (c: string): number => (c === "." ? 1.0 : c === "I" ? 1.4 : c === "M" ? 3.6 : 3.6);
    let w = 0;
    for (const c of TEXT) w += adv(c);
    const unit = 28.8 / w; // the letters span the frieze from the first column to the last
    const h = 0.18; // a unit's height: 0.9 m letters
    const y0 = Y_ARCH + (Y_FRIEZE - Y_ARCH - 5 * h) / 2;
    const zf = EZ - 0.05;
    let x = -14.4;
    for (const c of TEXT) {
      for (const [a, b, p, q] of GLYPHS[c]!) {
        cube(m, "bronze", x + a * unit, x + p * unit, y0 + b * h, y0 + q * h, zf - 0.02, zf + 0.06);
      }
      x += adv(c) * unit;
    }
  });
}

/** The pediment and the gabled roof over a front: faces +Z at zt, eaves at +-gx on yc. */
function gable(m: MeshBuilder, name: string, gx: number, yc: number, z0: number, zt: number, zRoof: number, inner: number, yBase: number, attic: string, holes: boolean): void {
  const yRoof = (x: number): number => yc + (gx - Math.abs(x)) * SLOPE;
  const COS = 1 / Math.sqrt(1 + SLOPE * SLOPE);
  const SIN = SLOPE * COS;
  const yApex = yRoof(0);
  m.scope(name, () => {
    m.scope("tympanum", () => {
      const top = (x: number): number => yRoof(x) + 0.05;
      const sec: Ring = [[-inner, yBase], [inner, yBase], [inner, top(inner)], [0, top(0)], [-inner, top(inner)]];
      m.sweep(attic, "z", sec, z0, sec, zt);
    });
    m.scope("raking cornice", () => {
      for (const t of [-1, 1]) {
        const xe = t * gx;
        m.slab("marble", [[0, yApex + 0.06, zt - 0.1], [0, yApex - 0.55, zt - 0.1], [xe, yRoof(xe) - 0.55, zt - 0.1], [xe, yRoof(xe) + 0.06, zt - 0.1]], [0, 0, zRoof - zt + 0.05]);
      }
    });
    if (holes) {
      m.scope("fixing holes", () => {
        // the holes left by the bronze relief of the tympanum
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 4; j++) {
            const x = -12 + i * 3 + (j % 2) * 1.5;
            const y = yc + 1.0 + j * 1.45;
            if (y + 0.25 > yRoof(x) - 0.7) continue;
            const hx = ((i * 7 + j * 3) % 5) * 0.11 - 0.2;
            face(m, "dark", [x + hx - 0.1, y - 0.1, zt + 0.03], [x + hx + 0.1, y - 0.1, zt + 0.03], [x + hx + 0.1, y + 0.1, zt + 0.03], [x + hx - 0.1, y + 0.1, zt + 0.03], [0, 0, 1]);
          }
        }
      });
    }
    m.scope("roof", () => {
      for (const t of [-1, 1]) {
        const xe = t * gx;
        const n: Vec3 = [t * SIN, COS, 0];
        m.slab("lead", [[xe, yRoof(xe), z0 + 0.2], [xe, yRoof(xe), zRoof], [0, yApex, zRoof], [0, yApex, z0 + 0.2]], [n[0] * ROOF_T, n[1] * ROOF_T, n[2] * ROOF_T]);
        // the cover-tile ribs down the slope
        const xt = t * (gx + ROOF_T * SIN);
        const yt = yRoof(gx) + ROOF_T * COS;
        const xr = t * 0.3;
        const yr = yRoof(0.3) + ROOF_T / COS;
        const count = Math.round((zRoof - z0) / 1.1);
        for (let i = 0; i < count; i++) {
          const z = z0 + 0.6 + ((zRoof - z0 - 1.2) * i) / (count - 1);
          m.slab("stucco", [[xt, yt, z - 0.11], [xt, yt, z + 0.11], [xt, yt + 0.12, z]], [xr - xt, yr - yt, 0]);
        }
      }
      span(m, "stucco", -0.28, 0.28, yApex + ROOF_T / COS - 0.2, yApex + ROOF_T / COS + 0.1, z0 + 0.4, zRoof + 0.05);
    });
  });
}

function block(m: MeshBuilder): void {
  m.scope("intermediate block", () => {
    m.prism("brick", rect(2 * BX, BZ1 - BZ0, 0, (BZ0 + BZ1) / 2), 0, Y_BLOCK, false);
    const ZC = BZ0 + 0.3; // the cornices' hidden ends, inside the drum
    // the drum's storey cornices run on across the block
    m.scope("cornices", () => {
      for (const [y0, y1] of [[11.6, 12.2]] as Array<[number, number]>) {
        m.loft("stucco", rectRing(BX, ZC, BZ1), y0, rectRing(BX + 0.35, ZC, BZ1 + 0.35), y0 + 0.25, false);
        m.prism("stucco", rectRing(BX + 0.35, ZC, BZ1 + 0.35), y0 + 0.25, y1, false);
        m.loft("stucco", rectRing(BX + 0.35, ZC, BZ1 + 0.35), y1, rectRing(BX, ZC, BZ1), y1, false);
      }
      m.loft("stucco", rectRing(BX, ZC, BZ1), Y_BLOCK, rectRing(BGX, ZC, BGZ), Y_BLOCK + 0.55, false);
      m.prism("stucco", rectRing(BGX, ZC, BGZ), Y_BLOCK + 0.55, Y_BLOCK_CORNICE, false);
      m.loft("stucco", rectRing(BGX, ZC, BGZ), Y_BLOCK_CORNICE, rectRing(BX - 0.1, ZC, BZ1 - 0.1), Y_BLOCK_CORNICE, false);
    });
    gable(m, "upper pediment", BGX + 0.1, Y_BLOCK_CORNICE, BZ0 + 0.6, BZ1 - 0.1, BGZ + 0.15, BX - 0.05, Y_BLOCK - 0.1, "brick", false);
    m.scope("front wall", () => {
      // the marble facing of the portico's back wall
      span(m, "marble", -16.2, 16.2, Y_POD, Y_CEIL - 0.05, BZ1 - 0.1, BZ1 + 0.15);
      const zf = BZ1 + 0.15;
      m.scope("doors", () => {
        const w = 3.0;
        const yTop = 9.2;
        span(m, "marble", -w - 0.9, -w, Y_POD, 12.4, zf - 0.05, zf + 0.3);
        span(m, "marble", w, w + 0.9, Y_POD, 12.4, zf - 0.05, zf + 0.3);
        span(m, "marble", -w - 1.2, w + 1.2, 12.4, 13.2, zf - 0.05, zf + 0.4);
        // the bronze leaves and the grille over them
        span(m, "bronze", -w, w, Y_POD, yTop, zf - 0.05, zf + 0.06);
        span(m, "dark", -w + 0.02, w - 0.02, yTop, 12.4, zf - 0.04, zf + 0.02, false);
        for (let i = 0; i <= 6; i++) {
          const x = -w + (2 * w * i) / 6;
          span(m, "bronze", x - (i === 0 ? 0 : 0.08), x + (i === 6 ? 0 : 0.08), yTop, 12.4, zf - 0.05, zf + 0.08, false);
        }
        for (const x of [-w / 2, w / 2]) {
          for (const [y0, y1] of [[Y_POD + 0.8, 4.9], [5.5, 8.6]] as Array<[number, number]>) {
            span(m, "bronze", x - w * 0.36, x + w * 0.36, y0, y1, zf, zf + 0.12);
          }
        }
        span(m, "dark", -0.04, 0.04, Y_POD, yTop, zf + 0.06, zf + 0.09);
      });
      m.scope("niches", () => {
        // the apses at the ends of the aisles, where Augustus and Agrippa stood
        for (const s of [-1, 1]) {
          const x = s * 11.25;
          const pts: Vec3[] = [[x - 2.1, Y_POD + 1.0, zf + 0.03], [x + 2.1, Y_POD + 1.0, zf + 0.03]];
          for (let k = 0; k <= 6; k++) {
            const a = (k / 6) * Math.PI;
            pts.push([x + 2.1 * Math.cos(a), 8.8 + 2.1 * Math.sin(a), zf + 0.03]);
          }
          m.facets("dark", pts.slice(2).flatMap((p, k, arr) => (k + 1 < arr.length ? [[x, Y_POD + 1.0, zf + 0.03] as Vec3, p, arr[k + 1]!] : [])), [0, 0, 1]);
          face(m, "dark", pts[0]!, pts[1]!, [x + 2.1, 8.8, zf + 0.03], [x - 2.1, 8.8, zf + 0.03], [0, 0, 1]);
        }
      });
    });
  });
}

function portico(m: MeshBuilder): void {
  m.scope("portico", () => {
    podium(m);
    colonnade(m);
    entablature(m);
    gable(m, "pediment", GX, Y_CORNICE, BZ1 - 1.0, Z_TYMP, GZ + 0.15, 16.25, Y_CEIL, "marble", true);
  });
}

export function pantheon(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.moved(([x, y, z]) => [x, y, z + DZ], () => {
    m.scope("pantheon", () => {
      rotunda(m);
      block(m);
      portico(m);
    });
  });
  return m;
}

export function pantheonLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.moved(([x, y, z]) => [x, y, z + DZ], () => {
    const n = 16;
    // the drum with its top cornice, the step rings and the dome
    m.prism("brick", ngon(n, R_DRUM, 0), 0, 29.0, false);
    m.prism("stucco", ngon(n, 28.6, 0), 29.0, Y_TOP_CORNICE, false);
    m.loft("stucco", ngon(n, 28.6, 0), Y_TOP_CORNICE, ngon(n, R_DOME0, 0), Y_DOME0, false);
    const [r1, y1] = domePoint(0.55);
    m.loft("lead", ngon(n, R_DOME0, 0), Y_DOME0, ngon(n, r1, 0), y1, false);
    m.loft("lead", ngon(n, r1, 0), y1, ngon(n, R_LIP, 0), Y_OCULUS, false);
    m.cap("dark", ngon(n, R_LIP, 0), Y_OCULUS);
    // the intermediate block with its gable
    lodBox(m, "brick", 0, (BZ0 + BZ1) / 2, 2 * BX, BZ1 - BZ0, 0, Y_BLOCK_CORNICE);
    const ya = Y_BLOCK_CORNICE + BGX * SLOPE;
    m.sweep("lead", "z", [[-BGX, Y_BLOCK_CORNICE], [BGX, Y_BLOCK_CORNICE], [0, ya]], BZ0, [[-BGX, Y_BLOCK_CORNICE], [BGX, Y_BLOCK_CORNICE], [0, ya]], BGZ);
    // the portico: podium, the front row as posts, the inner rows as one dark mass
    lodBox(m, "marbleShade", 0, (BZ1 + Z_FRONT) / 2, 34.4, Z_FRONT - BZ1, 0, Y_POD);
    for (const x of COL_X) m.prism("granite", rect(1.4, 1.4, x, ROW_Z[0]!), Y_POD, Y_CAP, false);
    m.prism("dark", rect(30.0, 10.0, 0, 41.5), Y_POD, Y_CAP, false);
    lodBox(m, "marble", 0, (BZ1 + EZ) / 2, 2 * EX, EZ - BZ1, Y_CAP, Y_CORNICE);
    const yp = Y_CORNICE + GX * SLOPE;
    m.sweep("lead", "z", [[-GX, Y_CORNICE], [GX, Y_CORNICE], [0, yp]], BZ1, [[-GX, Y_CORNICE], [GX, Y_CORNICE], [0, yp]], GZ);
    // the tympana, just proud of the gables' ends
    m.slab("marble", [[-GX + 0.8, Y_CORNICE + 0.2, GZ + 0.02], [GX - 0.8, Y_CORNICE + 0.2, GZ + 0.02], [0, yp - 0.4, GZ + 0.02]], [0, 0, 0.04]);
    m.slab("marble", [[-BGX + 0.8, Y_BLOCK_CORNICE + 0.2, BGZ + 0.02], [BGX - 0.8, Y_BLOCK_CORNICE + 0.2, BGZ + 0.02], [0, ya - 0.4, BGZ + 0.02]], [0, 0, 0.04]);
    // the drum's middle cornice
    m.loft("stucco", ngon(n, R_DRUM, 0), 18.9, ngon(n, 28.0, 0), 19.2, false);
    m.prism("stucco", ngon(n, 28.0, 0), 19.2, 19.6, false);
    m.loft("stucco", ngon(n, 28.0, 0), 19.6, ngon(n, R_DRUM, 0), 19.6, false);
  });
  return m;
}

export const PANTHEON: ProceduralDesign[] = [
  {
    id: "bld-pantheon",
    game: { plaza: { cities: ["city"], layouts: ["rect"], fit: "footprint" } },
    title: "Pantheon",
    build: pantheon,
    buildLod: pantheonLod,
    references: "pantheon",
    catalog: PLAZA_CATALOG,
  },
];
