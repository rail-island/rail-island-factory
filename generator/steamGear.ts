// The running gear of the steam locomotives and tenders (steamLocos.ts): spoked
// wheelsets, coupling rods, main rods, crossheads and Walschaerts valve gear --
// every moving piece a part of the model (MeshCore.part), and one looping
// animation clip, "running", that turns the wheels and drives the rods through
// one revolution of the driving wheels. See docs/models/animation.md.
//
// The kinematics are solved here at N_SAMPLES points per revolution: a crank
// pin runs on a circle about its axle, the crosshead slides on its bars, the
// main rod joins the two; the eccentric rod swings the expansion link about its
// trunnion, the radius rod and the union link position the combination lever.
// Each rigid link becomes a node translated to one of its joints and turned
// about Z, so the clip is plain glTF node animation, linear between samples.
//
// Coordinates are the Factory's: metres, +X forward, +Y up, +Z right, rail top
// at y = 0. A spec gives positions in vlakosimdb source x (from the front buffer,
// growing rearward); `Steam.X` maps them.

import { ngon, type MeshBuilder, type Ring } from "./meshBuilder.ts";
import type { AnimationTrack, Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";

/** Samples per revolution of the driving wheels (plus the closing one). */
export const N_SAMPLES = 48;

/**
 * The speed the clip runs at, in metres per second: one cycle lasts as long as
 * the reference wheel takes to roll its circumference at this speed. A consumer
 * plays the clip at `timeScale = speed / RUNNING_SPEED`.
 */
export const RUNNING_SPEED = 5;

/** The name of the clip. */
export const RUNNING_CLIP = "running";

/** The z planes of the gear, outward from the wheel's back face (metres from the centre line). */
const Z = {
  tyre0: 0.68,
  tyre1: 0.815,
  spoke0: 0.71,
  spoke1: 0.795,
  hub1: 0.86,
  weight0: 0.745,
  weight1: 0.835,
  boss1: 0.885,
  coupling0: 0.893,
  coupling1: 0.947,
  main0: 0.957,
  main1: 1.013,
  crosshead0: 0.95,
  returnCrank0: 1.019,
  returnCrank1: 1.043,
  eccentric0: 1.049,
  eccentric1: 1.077,
  link0: 1.083,
  link1: 1.127,
  radius0: 1.133,
  radius1: 1.157,
  lever0: 1.163,
  lever1: 1.187,
  union0: 1.193,
  union1: 1.215,
};

/** One wheelset. */
export interface SteamWheel {
  /** Source x of the axle. */
  x: number;
  /** Tread diameter, metres. */
  d: number;
  /** Spokes; 0 draws a disc wheel. */
  spokes: number;
  /** Axle boxes and springs outside the wheels (carrying axles of a truck, tender axles). */
  outsideBoxes?: boolean;
}

/** One engine: a cylinder per side driving a group of coupled wheels. */
export interface SteamEngine {
  /** Indices into `wheels` of the coupled wheels; one is `main`. */
  coupled: number[];
  /** The index of the driving wheel the main rod works. */
  main: number;
  /** The cylinder: source x range, axis height, radius (with lagging). */
  cylinder: { x0: number; x1: number; y: number; r: number };
  /** Crank radius: half the piston stroke. */
  crank: number;
  /** The right crank's angle at rest (radians, 0 = forward, counter-clockwise seen from the right). */
  phase: number;
  /** Walschaerts valve gear outside the frames. */
  valveGear?: boolean;
  /** A suffix telling the engines of an articulated locomotive apart ("front", "rear"). */
  name?: string;
}

export interface RunningGearSpec {
  wheels: SteamWheel[];
  engines: SteamEngine[];
  /** The z of the cylinders' axes (right side; mirrored left). */
  cylinderZ: number;
  /** The wheel the cycle is one turn of: the main driver, or a tender's first axle. */
  reference: number;
  /** Paint of spokes, hubs and counterweights. */
  wheelMaterial: string;
}

type P2 = [number, number];

const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const scale = (a: P2, k: number): P2 => [a[0] * k, a[1] * k];
const dist = (a: P2, b: P2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const polar = (r: number, a: number): P2 => [r * Math.cos(a), r * Math.sin(a)];

/** The tyre's facets and the axle height they give with a flat side down. */
export const tyreSides = (d: number): number => (d >= 1.2 ? 24 : 18);
export const axleHeight = (d: number): number => (d / 2) * Math.cos(Math.PI / tyreSides(d));

/** Turns per cycle of a wheel of diameter d, rounded so its spokes (or facets) come back where they started. */
function turnsPerCycle(w: SteamWheel, ref: SteamWheel): number {
  if (w.d === ref.d) return 1;
  const k = w.spokes || tyreSides(w.d);
  return Math.round((k * ref.d) / w.d) / k;
}

/** Where every joint of one side of one engine is at crank angle phi (model coordinates). */
interface EnginePose {
  crank: P2;
  crosshead: P2;
  returnCrank?: P2;
  linkFoot?: P2;
  die?: P2;
  spindle?: P2;
  leverTop?: P2;
  leverFoot?: P2;
  unionPin?: P2;
}

/** The fixed layout of one side of one engine, and its pose at any crank angle. */
class EngineSide {
  readonly axle: P2;
  readonly d: number; // +1: the cylinder is ahead of the driving axle
  readonly cyl: { near: number; far: number; y: number; r: number };
  readonly mainRod: number;
  readonly crossheadMid: number;
  readonly pistonRod: number;
  readonly gap = 0.3;
  // valve gear
  readonly trunnion: P2 = [0, 0];
  readonly footR = 0.36;
  readonly dieR = 0.17;
  readonly eccentricR: number;
  readonly eccentricRod: number = 0;
  readonly valveY: number = 0;
  readonly leverTopA = 0.14;
  readonly leverFootB: number = 0;
  readonly radiusRod: number = 0;
  readonly unionLink: number = 0;
  readonly armDrop = 0.3;
  private last: { psi: number; xs: number; lam: number } | null = null;

  constructor(readonly e: SteamEngine, readonly sign: number, readonly phaseOffset: number, axle: P2, cylX0: number, cylX1: number) {
    this.axle = axle;
    const mid = (cylX0 + cylX1) / 2;
    this.d = Math.sign(mid - axle[0]);
    const near = this.d > 0 ? Math.min(cylX0, cylX1) : Math.max(cylX0, cylX1);
    const far = this.d > 0 ? Math.max(cylX0, cylX1) : Math.min(cylX0, cylX1);
    this.cyl = { near, far, y: e.cylinder.y, r: e.cylinder.r };
    this.crossheadMid = near - this.d * (this.gap + e.crank);
    this.mainRod = Math.hypot(this.crossheadMid - axle[0], e.cylinder.y - axle[1]);
    this.pistonRod = Math.min(this.gap + 2 * e.crank + 0.08, this.gap + Math.abs(far - near) - 0.05);
    this.eccentricR = 0.45 * e.crank;
    if (e.valveGear) {
      this.valveY = e.cylinder.y + e.cylinder.r + 0.17;
      this.trunnion = [this.crossheadMid - this.d * (e.crank + 0.5), e.cylinder.y + 0.38];
      this.eccentricRod = dist([this.trunnion[0], this.trunnion[1] - this.footR], axle);
      this.leverFootB = this.valveY - (e.cylinder.y - this.armDrop);
      // the rods' lengths from mid gear: link upright, lever upright, crosshead mid-stroke
      const T = this.trunnion;
      const die: P2 = [T[0], T[1] + this.dieR];
      const xs = this.cyl.near - this.d * 0.12;
      this.radiusRod = dist([xs, this.valveY + this.leverTopA], die);
      this.unionLink = dist([xs, this.valveY - this.leverFootB], [this.crossheadMid, e.cylinder.y - this.armDrop]);
    }
  }

  /** The crank angle at cycle angle theta (the wheels turn clockwise seen from the right when running forward). */
  phi(theta: number): number {
    return this.restPhi() - theta;
  }

  restPhi(): number {
    // the left crank trails the right by a quarter turn
    return this.e.phase + this.phaseOffset + (this.sign < 0 ? Math.PI / 2 : 0);
  }

  /** The joints at crank angle phi. Call in order of phi: the valve gear's solution starts from the previous one. */
  solve(phi: number): EnginePose {
    const e = this.e;
    const crank = add(this.axle, polar(e.crank, phi));
    const dy = e.cylinder.y - crank[1];
    const crosshead: P2 = [crank[0] + this.d * Math.sqrt(this.mainRod ** 2 - dy * dy), e.cylinder.y];
    if (!e.valveGear) return { crank, crosshead };
    const returnCrank = add(this.axle, polar(this.eccentricR, phi + this.d * Math.PI / 2));
    // the link foot: on the circle about the trunnion, an eccentric rod's length from the return crank
    const T = this.trunnion;
    const foot = circleIntersect(T, this.footR, returnCrank, this.eccentricRod, [T[0], T[1] - this.footR]);
    const f = scale(add(foot, scale(T, -1)), 1 / this.footR);
    const die = add(T, scale(f, -this.dieR));
    const unionPin: P2 = [crosshead[0], e.cylinder.y - this.armDrop];
    const lever = (xs: number, lam: number) => {
      const down: P2 = [Math.sin(lam), -Math.cos(lam)];
      const spindle: P2 = [xs, this.valveY];
      return { spindle, top: add(spindle, scale(down, -this.leverTopA)), foot: add(spindle, scale(down, this.leverFootB)) };
    };
    // two unknowns, the spindle's x and the lever's lean: Newton on the two rod lengths
    let { xs, lam } = this.last ?? { xs: this.cyl.near - this.d * 0.12, lam: 0 };
    const g = (x: number, l: number): [number, number] => {
      const p = lever(x, l);
      return [dist(p.top, die) - this.radiusRod, dist(p.foot, unionPin) - this.unionLink];
    };
    for (let it = 0; it < 200; it++) {
      const [g1, g2] = g(xs, lam);
      if (Math.abs(g1) + Math.abs(g2) < 1e-10) break;
      const h = 1e-6;
      const [a1, a2] = g(xs + h, lam);
      const [b1, b2] = g(xs, lam + h);
      const j11 = (a1 - g1) / h, j21 = (a2 - g2) / h, j12 = (b1 - g1) / h, j22 = (b2 - g2) / h;
      const det = j11 * j22 - j12 * j21;
      if (Math.abs(det) < 1e-14) throw new Error("valve gear: singular linkage");
      const dx = (g1 * j22 - g2 * j12) / det;
      const dl = (j11 * g2 - j21 * g1) / det;
      const k = Math.min(1, 0.2 / Math.max(Math.abs(dx), Math.abs(dl)));
      xs -= dx * k;
      lam -= dl * k;
    }
    const [g1, g2] = g(xs, lam);
    if (Math.abs(g1) + Math.abs(g2) > 1e-6) throw new Error(`valve gear: the linkage does not close at phi ${phi.toFixed(3)} (${g1}, ${g2})`);
    this.last = { psi: 0, xs, lam };
    const l = lever(xs, lam);
    return { crank, crosshead, returnCrank, linkFoot: foot, die, spindle: l.spindle, leverTop: l.top, leverFoot: l.foot, unionPin };
  }
}

/** The intersection of two circles nearest to `near`. */
function circleIntersect(c0: P2, r0: number, c1: P2, r1: number, near: P2): P2 {
  const dd = dist(c0, c1);
  const a = (r0 * r0 - r1 * r1 + dd * dd) / (2 * dd);
  const h2 = r0 * r0 - a * a;
  if (h2 < -1e-9) throw new Error("valve gear: the eccentric rod cannot reach the link");
  const h = Math.sqrt(Math.max(0, h2));
  const u = scale(add(c1, scale(c0, -1)), 1 / dd);
  const m = add(c0, scale(u, a));
  const p1: P2 = [m[0] - u[1] * h, m[1] + u[0] * h];
  const p2: P2 = [m[0] + u[1] * h, m[1] - u[0] * h];
  return dist(p1, near) <= dist(p2, near) ? p1 : p2;
}

const quatZ = (a: number): number[] => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];

/**
 * A flat bar on side s from A to B (model x, y), half-widths wa and wb, in the
 * z range z0..z1 (positive, mirrored for s < 0), with round bosses at both ends.
 */
export function bar(m: MeshBuilder, mat: string, s: number, A: P2, B: P2, wa: number, wb: number, z0: number, z1: number, bosses = true): void {
  const [za, zb] = side(s, z0, z1);
  const zo = s > 0 ? zb : za;
  const L = dist(A, B);
  const u: P2 = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
  const v: P2 = [-u[1], u[0]];
  const pts: P2[] = [add(A, scale(v, -wa)), add(B, scale(v, -wb)), add(B, scale(v, wb)), add(A, scale(v, wa))];
  m.slab(mat, pts.map(([x, y]): Vec3 => [x, y, zo]), [0, 0, -s * (z1 - z0)]);
  if (bosses) {
    for (const [p, w] of [[A, wa], [B, wb]] as const) {
      const ring = ngon(10, w * 1.25, 0, p[0], p[1]);
      m.sweep(mat, "z", ring, za - 0.004, ring, zb + 0.004);
    }
  }
}

/** A pin along z through (x, y), radius r, from z0 to z1 on side s. */
function pin(m: MeshBuilder, mat: string, s: number, p: P2, r: number, z0: number, z1: number, n = 8): void {
  const ring = ngon(n, r, 0, p[0], p[1]);
  const [a, b] = side(s, z0, z1);
  m.sweep(mat, "z", ring, a, ring, b);
}

/** The running gear of one vehicle, laid out from its spec in model coordinates. */
export class RunningGear {
  readonly sides: Array<{ engine: SteamEngine; index: number; s: number; side: EngineSide }> = [];
  readonly duration: number;
  readonly times: number[];

  constructor(readonly spec: RunningGearSpec, readonly X: (x: number) => number) {
    const ref = spec.wheels[spec.reference]!;
    this.duration = (Math.PI * ref.d) / RUNNING_SPEED;
    this.times = Array.from({ length: N_SAMPLES + 1 }, (_, k) => Math.round(((k * this.duration) / N_SAMPLES) * 1e6) / 1e6);
    spec.engines.forEach((engine, index) => {
      const w = spec.wheels[engine.main]!;
      const axle: P2 = [X(w.x), axleHeight(w.d)];
      for (const s of [1, -1]) {
        this.sides.push({ engine, index, s, side: new EngineSide(engine, s, 0, axle, X(engine.cylinder.x0), X(engine.cylinder.x1)) });
      }
    });
  }

  /** "right", "left", plus the engine's name for an articulated locomotive. */
  private suffix(engine: SteamEngine, s: number): string {
    return `${s > 0 ? "right" : "left"}${engine.name ? `-${engine.name}` : ""}`;
  }

  /** The engine side whose crank a coupled wheel carries. */
  private engineOf(wheel: number): SteamEngine | null {
    return this.spec.engines.find((e) => e.coupled.includes(wheel)) ?? null;
  }

  /**
   * The static gear, drawn inside the body part: cylinders with covers and valve
   * chests, slide bars, the expansion link brackets, and the axle boxes of the
   * carrying wheels.
   */
  drawStatic(m: MeshBuilder, paint: string): void {
    const z = this.spec.cylinderZ;
    for (const { engine, s, side: es } of this.sides) {
      m.scope(`cylinder ${this.suffix(engine, s)}`, () => {
        const { near, far, y, r } = es.cyl;
        const [x0, x1] = [Math.min(near, far), Math.max(near, far)];
        const zc = s * z;
        m.sweep(paint, "x", ngon(16, r, Math.PI / 16, zc, y), x0 + 0.06, ngon(16, r, Math.PI / 16, zc, y), x1 - 0.06);
        for (const xc of [x0 + 0.03, x1 - 0.03]) {
          const cover = ngon(16, r + 0.035, Math.PI / 16, zc, y);
          m.sweep("steel", "x", cover, xc - 0.03, cover, xc + 0.03);
        }
        // the piston valve's chest on top, reaching back to the spindle's gland
        const vy = y + r + 0.17 - 0.02;
        const chest = ngon(12, 0.17, Math.PI / 12, zc, vy);
        m.sweep(paint, "x", chest, x0 + 0.08, chest, x1 - 0.08);
        block(m, paint, x0 + 0.2, x1 - 0.2, y + r - 0.12, vy - 0.1, zc - 0.16, zc + 0.16);
        // the slide bars over and under the crosshead's travel
        const xa = es.d > 0 ? near : near;
        const xb = near - es.d * (es.gap + 2 * engine.crank + 0.22);
        const [b0, b1] = [Math.min(xa, xb), Math.max(xa, xb)];
        for (const dy of [0.115, -0.115]) block(m, "rod", b0, b1, y + dy - 0.025, y + dy + 0.025, ...side(s, Z.crosshead0 + 0.03, z + 0.06));
        // the motion bracket closing the bars' far end
        const xm = xb - es.d * 0.04;
        block(m, "black", Math.min(xm, xb), Math.max(xm, xb), y - 0.2, y + 0.6, ...side(s, 0.62, z + 0.07));
        if (engine.valveGear) {
          const [tx, ty] = es.trunnion;
          // the link's trunnion bracket hangs from the motion bracket
          block(m, "black", tx - 0.06, tx + 0.06, ty - 0.07, ty + 0.07, ...side(s, 0.62, Z.link0 - 0.004));
          block(m, "black", Math.min(tx, xm) , Math.max(tx, xm), ty + 0.07, ty + 0.15, ...side(s, 0.62, Z.link0 - 0.004));
          // the valve spindle's guide behind the chest
          const gx = near - es.d * 0.05;
          block(m, "steel", Math.min(gx, near), Math.max(gx, near) + 0.001, es.valveY - 0.06, es.valveY + 0.06, ...side(s, z - 0.06, z + 0.06));
        }
      });
    }
    this.spec.wheels.forEach((w, i) => {
      if (!w.outsideBoxes) return;
      const X = this.X(w.x);
      const ay = axleHeight(w.d);
      m.scope(`axle boxes ${i + 1}`, () => {
        for (const s of [-1, 1]) {
          block(m, "black", X - 0.17, X + 0.17, ay - 0.14, ay + 0.16, ...side(s, 0.9, 1.06));
          // a leaf spring above the box
          block(m, "steel", X - 0.45, X + 0.45, ay + 0.2, ay + 0.3, ...side(s, 0.93, 1.03));
          block(m, "black", X - 0.05, X + 0.05, ay + 0.16, ay + 0.34, ...side(s, 0.92, 1.04));
        }
      });
    });
  }

  /**
   * The moving gear as parts, then the animation clip: a wheelset part per axle
   * (wheels, axle, crank pins, counterweights, return cranks), then per engine
   * side the coupling rod, crosshead, main rod and valve gear. Call after the
   * body part.
   */
  drawParts(m: MeshBuilder): void {
    const spec = this.spec;
    const ref = spec.wheels[spec.reference]!;
    const tracks: AnimationTrack[] = [];
    const thetas = this.times.map((_, k) => (2 * Math.PI * k) / N_SAMPLES);

    spec.wheels.forEach((w, i) => {
      const name = `wheelset-${i + 1}`;
      const X = this.X(w.x);
      const ay = axleHeight(w.d);
      const engine = this.engineOf(i);
      m.part(name, [X, ay, 0], () => {
        m.scope("axle", () => {
          const axle = ngon(8, 0.085, 0, X, ay);
          m.sweep("steel", "z", axle, -Z.tyre0 - 0.004, axle, Z.tyre0 + 0.004);
        });
        for (const s of [1, -1]) {
          m.scope(s > 0 ? "right wheel" : "left wheel", () => {
            const es = engine ? this.sides.find((x) => x.engine === engine && x.s === s)!.side : null;
            this.wheel(m, s, X, ay, w, es ? es.restPhi() : null, es && engine?.main === i ? es : null);
          });
        }
      });
      const turns = turnsPerCycle(w, ref);
      tracks.push({ node: name, path: "rotation", values: thetas.flatMap((t) => quatZ(-t * turns)) });
    });

    for (const { engine, s, side: es } of this.sides) {
      const sfx = this.suffix(engine, s);
      const poses = thetas.map((t) => es.solve(es.phi(t)));
      const rest = poses[0]!;
      // a rigid link: drawn at rest between joints a and b, turned with them
      const link = (name: string, a: (p: EnginePose) => P2, b: (p: EnginePose) => P2, draw: () => void, turn = true) => {
        const a0 = a(rest);
        m.part(`${name}-${sfx}`, [a0[0], a0[1], 0], draw);
        tracks.push({ node: `${name}-${sfx}`, path: "translation", values: poses.flatMap((p) => [...a(p), 0]) });
        if (turn) {
          const ang0 = Math.atan2(b(rest)[1] - a0[1], b(rest)[0] - a0[0]);
          let prev = 0;
          tracks.push({
            node: `${name}-${sfx}`, path: "rotation",
            values: poses.flatMap((p) => {
              const q = a(p);
              const r = b(p);
              let ang = Math.atan2(r[1] - q[1], r[0] - q[0]) - ang0;
              while (ang - prev > Math.PI) ang -= 2 * Math.PI;
              while (ang - prev < -Math.PI) ang += 2 * Math.PI;
              prev = ang;
              return quatZ(ang);
            }),
          });
        }
      };

      if (engine.coupled.length > 1) {
        const xs = engine.coupled.map((i) => this.X(spec.wheels[i]!.x));
        const crankAt = (x: number, p: EnginePose): P2 => [p.crank[0] + (x - es.axle[0]), p.crank[1]];
        const front = Math.max(...xs);
        const back = Math.min(...xs);
        link("coupling-rod", (p) => crankAt(back, p), (p) => crankAt(front, p), () => {
          const a = crankAt(back, rest);
          const b = crankAt(front, rest);
          bar(m, "rod", s, a, b, 0.06, 0.06, Z.coupling0, Z.coupling1, false);
          for (const x of xs) {
            pin(m, "rod", s, crankAt(x, rest), 0.1, Z.coupling0 - 0.004, Z.coupling1 + 0.004, 12);
          }
        }, false);
      }
      link("crosshead", (p) => p.crosshead, (p) => p.crosshead, () => {
        const [cx, cy] = rest.crosshead;
        const z = spec.cylinderZ;
        block(m, "steel", cx - 0.17, cx + 0.17, cy - 0.085, cy + 0.085, ...side(s, Z.crosshead0, z + 0.035));
        // the piston rod into the cylinder
        const rod = ngon(8, 0.045, 0, s * z, cy);
        const x2 = cx + es.d * es.pistonRod;
        m.sweep("rod", "x", rod, Math.min(cx, x2), rod, Math.max(cx, x2));
        if (engine.valveGear) {
          // the drop arm for the union link
          const [ux, uy] = rest.unionPin!;
          block(m, "steel", ux - 0.04, ux + 0.04, uy - 0.03, cy - 0.085, ...side(s, Z.union0 - 0.04, Z.union0 - 0.002));
          pin(m, "steel", s, [ux, uy], 0.035, Z.union0 - 0.04, Z.union1 + 0.006);
        }
      }, false);
      link("main-rod", (p) => p.crosshead, (p) => p.crank, () => {
        bar(m, "rod", s, rest.crosshead, rest.crank, 0.055, 0.08, Z.main0, Z.main1);
      });
      if (engine.valveGear) {
        link("eccentric-rod", (p) => p.returnCrank!, (p) => p.linkFoot!, () => {
          bar(m, "rod", s, rest.returnCrank!, rest.linkFoot!, 0.035, 0.03, Z.eccentric0, Z.eccentric1);
        });
        link("expansion-link", () => es.trunnion, (p) => p.linkFoot!, () => {
          const T = es.trunnion;
          // the curved link, slotted for the die block, from just above the die to the foot
          const pts: P2[] = [];
          for (const k of [-1.2, -0.6, 0, 0.6, 1.0]) pts.push([T[0] + k * 0.02 * es.d, T[1] - k * es.footR]);
          for (let i = 0; i + 1 < pts.length; i++) bar(m, "rod", s, pts[i]!, pts[i + 1]!, 0.05, 0.05, Z.link0, Z.link1, false);
          pin(m, "steel", s, T, 0.055, Z.link0 - 0.004, Z.link1 + 0.004, 10);
        });
        link("radius-rod", (p) => p.die!, (p) => p.leverTop!, () => {
          bar(m, "rod", s, rest.die!, rest.leverTop!, 0.035, 0.03, Z.radius0, Z.radius1);
        });
        link("combination-lever", (p) => p.leverTop!, (p) => p.leverFoot!, () => {
          bar(m, "rod", s, rest.leverTop!, rest.leverFoot!, 0.035, 0.035, Z.lever0, Z.lever1);
        });
        link("union-link", (p) => p.unionPin!, (p) => p.leverFoot!, () => {
          bar(m, "rod", s, rest.unionPin!, rest.leverFoot!, 0.03, 0.03, Z.union0, Z.union1);
        });
        link("valve-spindle", (p) => p.spindle!, (p) => p.spindle!, () => {
          const [sx, sy] = rest.spindle!;
          const z = spec.cylinderZ;
          // the spindle crosshead pinned to the lever, the spindle into the chest
          block(m, "steel", sx - 0.06, sx + 0.06, sy - 0.05, sy + 0.05, ...side(s, z - 0.05, Z.lever0 - 0.003));
          const rod = ngon(8, 0.03, 0, s * z, sy);
          const x2 = sx + es.d * 0.3;
          m.sweep("rod", "x", rod, Math.min(sx, x2), rod, Math.max(sx, x2));
        }, false);
      }
    }
    m.animate({ name: RUNNING_CLIP, times: this.times, tracks });
  }

  /**
   * One wheel on side s at rest: tyre, hub, spokes or disc, and on a coupled
   * wheel its crank pin (crank angle `phi`) with a counterweight opposite; the
   * main driver also carries the main rod's pin and the return crank.
   */
  private wheel(m: MeshBuilder, s: number, X: number, ay: number, w: SteamWheel, phi: number | null, main: EngineSide | null): void {
    const R = w.d / 2;
    const n = tyreSides(w.d);
    const ri = R - Math.max(0.065, R * 0.085);
    const mat = this.spec.wheelMaterial;
    m.scope("tyre", () => m.tube("tyre", "z", X, ay, R, ri, ...side(s, Z.tyre0, Z.tyre1), n, -Math.PI / 2 + Math.PI / n));
    const hubR = Math.max(0.13, R * 0.2);
    m.scope("hub", () => pin(m, mat, s, [X, ay], hubR, Z.tyre0 + 0.01, Z.hub1, 12));
    const zo = s * Z.spoke1;
    if (w.spokes > 0) {
      m.scope("spokes", () => {
        for (let k = 0; k < w.spokes; k++) {
          const a = ((k + 0.5) / w.spokes) * Math.PI * 2;
          const u: P2 = polar(1, a);
          const v: P2 = [-u[1], u[0]];
          const c: P2 = [X, ay];
          const w0 = Math.min(0.055, R * 0.075);
          const w1 = w0 * 0.7;
          const r0 = hubR - 0.02;
          const r1 = ri + 0.015;
          const pts: P2[] = [add(c, add(scale(u, r0), scale(v, -w0))), add(c, add(scale(u, r1), scale(v, -w1))), add(c, add(scale(u, r1), scale(v, w1))), add(c, add(scale(u, r0), scale(v, w0)))];
          m.slab(mat, pts.map(([x, y]): Vec3 => [x, y, zo]), [0, 0, -s * (Z.spoke1 - Z.spoke0)]);
        }
      });
    } else {
      m.scope("disc", () => {
        const disc = ngon(n, ri + 0.01, -Math.PI / 2 + Math.PI / n, X, ay);
        const [a, b] = side(s, Z.spoke0 + 0.02, Z.spoke1 - 0.02);
        m.sweep(mat, "z", disc, a, disc, b);
      });
    }
    if (phi === null) return;
    const rc = main ? main.e.crank : this.spec.engines.find((e) => e.coupled.some((i) => this.spec.wheels[i] === w))?.crank ?? 0.3;
    const crank = add([X, ay], polar(rc, phi));
    m.scope("counterweight", () => {
      const a = phi + Math.PI;
      const span = 0.95;
      const pts: P2[] = [];
      for (let k = 0; k <= 6; k++) pts.push(add([X, ay], polar(ri - 0.005, a - span + (2 * span * k) / 6)));
      m.slab(mat, pts.map(([x, y]): Vec3 => [x, y, s * Z.weight1]), [0, 0, -s * (Z.weight1 - Z.weight0)]);
    });
    m.scope("crank pin", () => {
      // the boss on the wheel, and the pin through the rods outside it
      pin(m, mat, s, crank, 0.13, Z.spoke0, Z.boss1, 12);
      pin(m, "steel", s, crank, 0.05, Z.boss1 - 0.01, main ? Z.main1 + 0.012 : Z.coupling1 + 0.012);
    });
    if (main?.e.valveGear) {
      m.scope("return crank", () => {
        const E = add([X, ay], polar(main.eccentricR, phi + main.d * Math.PI / 2));
        bar(m, "steel", s, crank, E, 0.06, 0.04, Z.returnCrank0, Z.returnCrank1);
        pin(m, "steel", s, E, 0.03, Z.returnCrank1 - 0.005, Z.eccentric1 + 0.006);
      });
    }
  }
}

/** A ring of `n` points about (cx, cy) in the x-y plane. */
export function circle(n: number, r: number, cx: number, cy: number, rot = 0): Ring {
  return ngon(n, r, rot, cx, cy);
}
