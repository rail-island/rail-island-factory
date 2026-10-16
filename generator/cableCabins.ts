// The cable car cabins: an aerial tramway car and a small detachable gondola,
// modelled on the photos in assets/cablecar-cabin and assets/gondola-cabin.
//
// Each design reproduces the hand-authored GLB of the same name in the webapp's
// model database (rail-island-webapp db/cablecar/glb), procedurally: the same
// axes, about the same bounding box (test/referenceModels.test.ts), the same
// look. The ids are stored in the game's saved maps, so a design is never
// renamed once shipped.
//
// The webapp hangs a cabin from the rope by two fractions of the model's height
// in db/cablecar/cablecar.meta.json: ropeFrac (the sheave axis or grip) and
// boardFrac (the door sill). Both designs are drawn so those numbers stay true:
//
//   cablecar-cabin  y 0 .. 6.93, sheave axis 6.66 (0.960), door sill 0.70 (0.101)
//   gondola-cabin   y -0.10 .. 4.795, rope 4.14 (0.866), door sill 0.43 (0.109)
//
// The tramway car is authored ACROSS its length (long axis z, the webapp's yaw
// is 90); the gondola's rope runs along x (yaw 0). Units are metres; every
// cabin is a single mesh (no parts). See docs/models/cable-cabins.md.

import { MeshBuilder, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block } from "./vehicleParts.ts";
import type { CatalogFields, ProceduralDesign } from "./design.ts";

const PALETTE: Record<string, MaterialSpec> = {
  // the tramway car (the reference's colours)
  shell: { color: "#2b2e33", metallic: 0.3, roughness: 0.45 },
  glass: { color: "#0d1116", metallic: 0.35, roughness: 0.12 },
  stripe: { color: "#c8202b", metallic: 0.1, roughness: 0.35 },
  gear: { color: "#3c4046", metallic: 0.35, roughness: 0.5 },
  white: { color: "#d9dbdd", metallic: 0.3, roughness: 0.4 },
  lamp: { color: "#f2eccd", roughness: 0.3 },
  // the gondola
  red: { color: "#b81c17", metallic: 0.22, roughness: 0.32 },
  tint: { color: "#1b2429", metallic: 0.3, roughness: 0.06 },
  rubber: { color: "#2a2b2d", metallic: 0.02, roughness: 0.9 },
  steel: { color: "#b4b9bd", metallic: 0.38, roughness: 0.42 },
  trim: { color: "#191b1d", metallic: 0.15, roughness: 0.55 },
};

// ---------------------------------------------------------------------------
// helpers

const TAU = Math.PI * 2;

/** A point at angle `a` and radius `r`, in ngon()'s convention (a = 90 deg is -z). */
function polar(a: number, r: number): [number, number] {
  return [r * Math.cos(a), -r * Math.sin(a)];
}

/** A rounded rectangle of half extents hx, hz, corner radius r, `seg` segments a corner, wound like ngon(). */
function roundRect(hx: number, hz: number, r: number, seg: number): Ring {
  const ring: Ring = [];
  const centres: Array<[number, number]> = [[hx - r, -(hz - r)], [-(hx - r), -(hz - r)], [-(hx - r), hz - r], [hx - r, hz - r]];
  centres.forEach(([cx, cz], q) => {
    for (let i = 0; i <= seg; i++) {
      const [px, pz] = polar((q + i / seg) * (Math.PI / 2), r);
      ring.push([cx + px, cz + pz]);
    }
  });
  return ring;
}

/** One station of a lathed or lofted shell: height, size parameter and the material of the band above it. */
type Station = [y: number, s: number, mat: string];

/**
 * A closed shell lofted through `stations`, `ringAt(s)` giving the ring at each:
 * a band per pair of stations in the lower one's material, a bottom cap under the
 * first and a top cap over the last. Two stations at one height make a flat step
 * (a proud stripe's shoulder).
 */
function shell(m: MeshBuilder, stations: Station[], ringAt: (s: number) => Ring): void {
  const first = stations[0]!;
  const last = stations[stations.length - 1]!;
  m.cap(first[2], ringAt(first[1]), first[0], false);
  for (let i = 0; i + 1 < stations.length; i++) {
    const [y0, s0, mat] = stations[i]!;
    const [y1, s1] = stations[i + 1]!;
    m.loft(mat, ringAt(s0), y0, ringAt(s1), y1, false);
  }
  m.cap(stations[stations.length - 2]![2], ringAt(last[1]), last[0]);
}

/** A straight n-sided bar of radius r from p to q, capped at both ends. */
function bar(m: MeshBuilder, mat: string, p: Vec3, q: Vec3, r: number, n = 4): void {
  const d: Vec3 = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
  const len = Math.hypot(d[0], d[1], d[2]);
  const u: Vec3 = [d[0] / len, d[1] / len, d[2] / len];
  // a unit vector across the bar: horizontal unless the bar is (nearly) vertical
  const ref: Vec3 = Math.abs(u[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const cr = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  let a = cr(u, ref);
  const la = Math.hypot(a[0], a[1], a[2]);
  a = [a[0] / la, a[1] / la, a[2] / la];
  const b = cr(u, a);
  const outline: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = Math.PI / n + (i / n) * TAU;
    const c = Math.cos(t) * r;
    const s = Math.sin(t) * r;
    outline.push([p[0] + a[0] * c + b[0] * s, p[1] + a[1] * c + b[1] * s, p[2] + a[2] * c + b[2] * s]);
  }
  m.slab(mat, outline, d);
}

/** A disc (wheel) of radius r and n sides, axle along `axis`, centred at (c0, cy) in its section plane, spanning a0..a1. */
function disc(m: MeshBuilder, mat: string, axis: "x" | "z", c0: number, cy: number, r: number, a0: number, a1: number, n: number): void {
  const s: Ring = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    s.push([c0 + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  m.sweep(mat, axis, s, a0, s, a1);
}

// ---------------------------------------------------------------------------
// the aerial tramway car

const CAR = {
  hx: 1.55, // half width of the body shell
  hz: 5.05, // half length
  corner: 0.6, // plan radius of the body's vertical corners
  sill: 0.7, // door sill (boardFrac 0.1009 of 6.93)
  axis: 6.66, // sheave axis (ropeFrac 0.9603 of 6.93)
  roof: 3.07, // top of the body shell
};

/** The window posts on a long side, z (the middle one of each door is the door's centre joint). */
const MULLIONS = [-3.81, -2.54, -1.27, 0, 1.27, 2.54, 3.81];
/** The doors' frame posts, z (two doors a side, 1.17 m clear). */
const DOOR_POSTS = [-3.17, -1.93, 1.93, 3.17];

function carBody(m: MeshBuilder): void {
  // inset from the outer body line, and the band's material above each station
  const stations: Station[] = [
    [0.0, 0.34, "shell"], [0.06, 0.18, "shell"], [0.16, 0.08, "shell"], [0.3, 0.02, "shell"], [0.45, 0, "shell"],
    [0.8, 0, "stripe"], [0.8, -0.03, "stripe"], [1.02, -0.03, "stripe"], [1.02, 0, "shell"],
    [1.1, 0, "glass"], [1.1, 0.03, "glass"], [2.55, 0.03, "shell"], [2.55, 0, "shell"],
    [2.565, 0, "stripe"], [2.565, -0.03, "stripe"], [2.735, -0.03, "stripe"], [2.735, 0, "shell"],
    [2.9, 0, "shell"], [2.97, 0.04, "shell"], [3.03, 0.1, "shell"], [CAR.roof, 0.18, "shell"],
  ];
  m.scope("shell", () => shell(m, stations, (d) => roundRect(CAR.hx - d, CAR.hz - d, CAR.corner - d, 6)));

  for (const s of [-1, 1]) {
    const name = s > 0 ? "right side" : "left side";
    m.scope(name, () => {
      const x0 = s * (CAR.hx - 0.045);
      const x1 = s * (CAR.hx + 0.055);
      m.scope("window posts", () => {
        for (const z of MULLIONS) block(m, "shell", Math.min(x0, x1), Math.max(x0, x1), 1.09, 2.56, z - 0.05, z + 0.05);
      });
      m.scope("door frames", () => {
        const fx0 = s * (CAR.hx - 0.035);
        const fx1 = s * (CAR.hx + 0.065);
        for (const z of DOOR_POSTS) block(m, "gear", Math.min(fx0, fx1), Math.max(fx0, fx1), CAR.sill, 2.62, z - 0.035, z + 0.035);
      });
      m.scope("door steps", () => {
        // the sill plate a passenger steps over, flush under the door frames
        const tx0 = s * (CAR.hx - 0.05);
        const tx1 = s * (CAR.hx + 0.06);
        for (const zc of [-2.55, 2.55]) block(m, "gear", Math.min(tx0, tx1), Math.max(tx0, tx1), 0.62, CAR.sill, zc - 0.585, zc + 0.585);
      });
    });
  }

  for (const s of [-1, 1]) {
    m.scope(s > 0 ? "front end" : "rear end", () => {
      const zEnd = s * CAR.hz;
      m.scope("bumper", () => block(m, "gear", -1.15, 1.15, 0.17, 0.39, Math.min(zEnd - s * 0.2, zEnd + s * -0.01), Math.max(zEnd - s * 0.2, zEnd - s * 0.01)));
      m.scope("lamps", () => {
        for (const x of [-0.8, 0.8]) {
          const z0 = zEnd - s * 0.03;
          const z1 = zEnd + s * 0.02;
          block(m, "lamp", x - 0.13, x + 0.13, 0.54, 0.66, Math.min(z0, z1), Math.max(z0, z1));
        }
      });
      m.scope("pillar", () => {
        // the windscreen's centre post
        const z0 = zEnd - s * 0.06;
        const z1 = zEnd + s * 0.02;
        block(m, "shell", -0.045, 0.045, 1.09, 2.56, Math.min(z0, z1), Math.max(z0, z1));
      });
    });
  }
}

function carRoof(m: MeshBuilder): void {
  const y0 = CAR.roof - 0.02; // everything on the roof is let into it, never laid on its cap
  m.scope("air conditioner", () => {
    block(m, "gear", -0.55, 0.55, y0, 3.37, -3.85, -2.35);
    for (let i = 0; i < 4; i++) block(m, "shell", -0.45, 0.45, 3.36, 3.4, -3.7 + i * 0.36, -3.58 + i * 0.36);
  });
  m.scope("equipment box", () => block(m, "gear", -0.4, 0.4, y0, 3.29, 2.7, 3.7));
  m.scope("antennas", () => {
    for (const z of [-1.9, 1.9]) bar(m, "gear", [0.75, y0, z], [0.75, 3.5, z], 0.05, 6);
  });
  m.scope("yoke", () => {
    m.scope("base", () => block(m, "white", -0.75, 0.75, y0, 3.47, -1.2, 1.2));
    m.scope("pivots", () => {
      for (const s of [-1, 1]) disc(m, "gear", "x", 0, 3.62, 0.13, s > 0 ? 0.37 : -0.87, s > 0 ? 0.87 : -0.37, 10);
    });
  });
}

/** The lattice mast between the yoke and the carriage, and its two bracing booms. */
function carMast(m: MeshBuilder): void {
  const yb = 3.5;
  const yt = 6.2;
  // corner (x, z) at the foot and the head; the head leans toward +z
  const foot = { x: 0.36, zb: -0.76, zf: 0.79 };
  const head = { x: 0.28, zb: -0.17, zf: 0.41 };
  const at = (t: number, sx: number, front: boolean): Vec3 => {
    const x = sx * (foot.x + (head.x - foot.x) * t);
    const z = front ? foot.zf + (head.zf - foot.zf) * t : foot.zb + (head.zb - foot.zb) * t;
    return [x, yb + (yt - yb) * t, z];
  };
  m.scope("chords", () => {
    for (const sx of [-1, 1]) for (const front of [false, true]) {
      const p = at(0, sx, front);
      const q = at(1, sx, front);
      bar(m, "white", [p[0], 3.45, p[2]], q, 0.05);
    }
  });
  const levels = 8;
  m.scope("rungs", () => {
    for (let k = 0; k < levels; k++) {
      const t = (k + 0.15) / (levels - 0.55);
      bar(m, "white", at(t, -1, false), at(t, 1, false), 0.03);
      bar(m, "white", at(t, -1, true), at(t, 1, true), 0.03);
      bar(m, "white", at(t, -1, false), at(t, -1, true), 0.03);
      bar(m, "white", at(t, 1, false), at(t, 1, true), 0.03);
    }
  });
  m.scope("diagonals", () => {
    for (let k = 0; k + 1 < levels; k++) {
      const t0 = (k + 0.15) / (levels - 0.55);
      const t1 = (k + 1.15) / (levels - 0.55);
      const odd = k % 2 === 1;
      bar(m, "white", at(t0, -1, odd), at(t1, -1, !odd), 0.025);
      bar(m, "white", at(t0, 1, !odd), at(t1, 1, odd), 0.025);
      bar(m, "white", at(t0, odd ? 1 : -1, false), at(t1, odd ? -1 : 1, false), 0.025);
      bar(m, "white", at(t0, odd ? -1 : 1, true), at(t1, odd ? 1 : -1, true), 0.025);
    }
  });
  m.scope("booms", () => {
    m.scope("feet", () => {
      block(m, "gear", -0.12, 0.12, 3.25, 3.44, 3.28, 3.52);
      block(m, "gear", -0.12, 0.12, 3.33, 3.45, -3.52, -3.28);
    });
    bar(m, "white", [0, 3.4, 3.4], [0, 5.72, 0.3], 0.05, 6);
    bar(m, "white", [0, 3.4, -3.4], [0, 5.72, -0.24], 0.05, 6);
  });
}

/** The carriage on the mast head: the beam, the four running sheaves and the haul rope grip. */
function carCarriage(m: MeshBuilder): void {
  m.scope("head", () => block(m, "gear", -0.25, 0.25, 6.06, 6.3, -0.35, 0.55));
  m.scope("beam", () => block(m, "gear", -0.17, 0.17, 6.22, 6.36, -1.5, 1.7));
  for (const z of [-1.15, -0.4, 0.6, 1.35]) {
    m.scope(`sheave z ${z.toFixed(2)}`, () => {
      m.scope("cheeks", () => {
        block(m, "white", -0.12, -0.09, 6.3, 6.74, z - 0.08, z + 0.08);
        block(m, "white", 0.09, 0.12, 6.3, 6.74, z - 0.08, z + 0.08);
      });
      m.scope("axle", () => disc(m, "gear", "x", z, CAR.axis, 0.045, -0.14, 0.14, 8));
      m.scope("wheel", () => disc(m, "gear", "x", z, CAR.axis, 0.235, -0.07, 0.07, 16));
      m.scope("rim", () => disc(m, "white", "x", z, CAR.axis, 0.271, -0.035, 0.035, 20));
    });
  }
  m.scope("haul rope grip", () => {
    block(m, "gear", 0.61, 0.83, 5.97, 6.47, -0.07, 0.27);
    bar(m, "gear", [0.2, 6.23, 0.1], [0.65, 6.23, 0.1], 0.05, 6);
  });
}

export function cablecarCabin(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => carBody(m));
  m.scope("roof", () => carRoof(m));
  m.scope("mast", () => carMast(m));
  m.scope("carriage", () => carCarriage(m));
  return m;
}

// ---------------------------------------------------------------------------
// the small gondola

const GON = {
  n: 36, // sides of the lathed body (a vertex every 10 degrees, on every rib)
  sill: 0.43, // door sill: top of the rubber bumper (boardFrac 0.109)
  rope: 4.14, // haul rope axis (ropeFrac 0.866 of -0.10 .. 4.795)
  door: (3 * Math.PI) / 2, // the door faces +z
};

/** The lathe profile: height, radius, material of the band above. */
const GON_PROFILE: Station[] = [
  [-0.1, 0.36, "red"], [-0.06, 0.52, "red"], [0.02, 0.62, "red"], [0.14, 0.68, "red"], [0.28, 0.72, "red"],
  [0.28, 0.8, "rubber"], [GON.sill, 0.8, "rubber"], [GON.sill, 0.78, "red"],
  [0.55, 0.86, "red"], [0.7, 0.93, "red"], [0.85, 0.98, "red"], [0.92, 1.0, "red"],
  [0.92, 1.035, "red"], [1.04, 1.035, "red"], [1.04, 1.01, "tint"],
  [1.3, 1.02, "tint"], [1.6, 1.015, "tint"], [1.9, 0.99, "tint"], [2.2, 0.945, "tint"], [2.45, 0.885, "tint"], [2.6, 0.83, "red"],
  [2.6, 0.865, "red"], [2.7, 0.865, "red"], [2.7, 0.8, "red"],
  [2.8, 0.74, "red"], [2.92, 0.64, "red"], [3.0, 0.52, "red"], [3.07, 0.32, "red"],
];

/** The body's radius at height y along the smooth outer line (the rails' steps left out). */
function gonRadius(y: number): number {
  const pts: Array<[number, number]> = [
    [0.43, 0.78], [0.55, 0.86], [0.7, 0.93], [0.85, 0.98], [1.04, 1.01], [1.3, 1.02], [1.6, 1.015], [1.9, 0.99],
    [2.2, 0.945], [2.45, 0.885], [2.6, 0.83],
  ];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [y0, r0] = pts[i]!;
    const [y1, r1] = pts[i + 1]!;
    if (y <= y1 || i + 2 === pts.length) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return pts[0]![1];
}

/**
 * A strip laid on the body at angle `a`, `w` wide and `t` proud, from y0 to y1,
 * following the body's curve: a window rib, a door edge.
 */
function gonStrip(m: MeshBuilder, mat: string, a: number, w: number, t: number, y0: number, y1: number): void {
  const ys = [y0, ...[0.55, 0.7, 0.85, 1.04, 1.3, 1.6, 1.9, 2.2, 2.45].filter((y) => y > y0 + 0.01 && y < y1 - 0.01), y1];
  const ring = (y: number): Ring => {
    const r = gonRadius(y);
    const da = w / 2 / r;
    return [polar(a - da, r - 0.015), polar(a - da, r + t), polar(a + da, r + t), polar(a + da, r - 0.015)];
  };
  m.cap(mat, ring(ys[0]!), ys[0]!, false);
  for (let i = 0; i + 1 < ys.length; i++) m.loft(mat, ring(ys[i]!), ys[i]!, ring(ys[i + 1]!), ys[i + 1]!, i + 2 === ys.length);
}

function gonBody(m: MeshBuilder): void {
  m.scope("shell", () => shell(m, GON_PROFILE, (r) => ngon36(r)));
  m.scope("window ribs", () => {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const doorEdge = Math.abs(a - (GON.door - Math.PI / 6)) < 1e-6 || Math.abs(a - (GON.door + Math.PI / 6)) < 1e-6;
      // the two ribs that frame the door run down to the sill
      gonStrip(m, "red", a, 0.13, 0.022, doorEdge ? GON.sill + 0.005 : 1.0, 2.64);
    }
  });
  m.scope("door", () => {
    m.scope("joint", () => gonStrip(m, "trim", GON.door, 0.035, 0.012, GON.sill + 0.005, 2.6));
    m.scope("edges", () => {
      for (const s of [-1, 1]) gonStrip(m, "trim", GON.door + s * (Math.PI / 6 - 0.085), 0.025, 0.01, GON.sill + 0.005, 1.0);
    });
    m.scope("handle", () => bar(m, "steel", [-0.2, 1.11, 1.06], [0.22, 1.11, 1.06], 0.022, 6));
  });
}

function ngon36(r: number): Ring {
  const ring: Ring = [];
  for (let i = 0; i < GON.n; i++) ring.push(polar((i / GON.n) * TAU, r));
  return ring;
}

function gonRoof(m: MeshBuilder): void {
  m.scope("vents", () => {
    for (let i = 0; i < 6; i++) {
      const [x, z] = polar(Math.PI / 6 + (i * Math.PI) / 3, 0.63);
      m.prism("trim", ngonAt(8, 0.035, x, z), 2.76, 2.88);
    }
  });
  m.scope("hanger plate", () => m.prism("steel", ngonAt(16, 0.24, 0, 0), 3.04, 3.1));
}

function ngonAt(n: number, r: number, cx: number, cz: number): Ring {
  const ring: Ring = [];
  for (let i = 0; i < n; i++) {
    const [x, z] = polar((i / n) * TAU, r);
    ring.push([cx + x, cz + z]);
  }
  return ring;
}

/** The hanger and the detachable grip: the jaws close on the rope at GON.rope, the running wheels ride above it. */
function gonHanger(m: MeshBuilder): void {
  m.scope("arm", () => {
    m.prism("steel", ngonAt(12, 0.1, 0, 0), 3.08, 3.92);
    m.prism("trim", ngonAt(12, 0.14, 0, 0), 3.12, 3.24);
  });
  m.scope("grip", () => {
    m.scope("body", () => block(m, "trim", -0.46, 0.46, 3.9, 4.06, -0.13, 0.13));
    m.scope("jaws", () => {
      for (const s of [-1, 1]) disc(m, "steel", "x", 0, GON.rope, 0.085, s > 0 ? 0.18 : -0.42, s > 0 ? 0.42 : -0.18, 10);
    });
    m.scope("spring box", () => block(m, "steel", -0.26, 0.26, 3.98, 4.44, 0.12, 0.24));
    m.scope("carriage", () => block(m, "steel", -0.52, 0.52, 4.42, 4.5, -0.04, 0.3));
    m.scope("running wheels", () => {
      for (const x of [-0.33, 0.33]) {
        disc(m, "trim", "z", x, 4.65, 0.145, -0.02, 0.1, 14);
        disc(m, "steel", "z", x, 4.65, 0.05, 0.1, 0.16, 8);
      }
    });
  });
  m.scope("haul rope", () => disc(m, "rubber", "x", 0, GON.rope, 0.032, -0.75, 0.75, 8));
}

export function gondolaCabin(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => gonBody(m));
  m.scope("roof", () => gonRoof(m));
  m.scope("hanger", () => gonHanger(m));
  return m;
}

/** The catalog fields of the family (meta.json, catalog.ts); a design may override the scale. */
export const CABLE_CABIN_CATALOG: CatalogFields = {
  category: "Cable car",
  group: "cabin",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Every design of the family, by catalog id; `references` is the folder of its source photos under assets/. */
export const CABLE_CABINS: ProceduralDesign[] = [
  { id: "proc-vehicle-cablecar-cabin", title: "Aerial Tramway Car", build: cablecarCabin, references: "cablecar-cabin", catalog: CABLE_CABIN_CATALOG },
  { id: "proc-vehicle-gondola-cabin", title: "Small Gondola", build: gondolaCabin, references: "gondola-cabin", catalog: CABLE_CABIN_CATALOG },
];
