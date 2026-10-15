// The shared parts of the freight wagons transferred from vlakosimdb (wagons.ts):
// Y25-style two-axle bogies, buffer beams, boxes and posts laid out in source
// coordinates, cargo (log piles, tubes, cable reels, bulk heaps, straps) and
// painted lettering on flat faces. Built on the coaches' Coach (csdCoachParts.ts),
// so source x is Factory x + centre, y is up from the rail and +z is the z_dec side.

import { ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { Coach } from "./csdCoachParts.ts";
import { block, side } from "./vehicleParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";

/** Wheel radius of the freight bogies: the standard 920 mm wheel. */
export const WAGON_WHEEL_R = 0.46;

/** Materials every wagon shares; a wagon adds its own paint. */
export const WAGON_PALETTE: Record<string, MaterialSpec> = {
  bogie: { color: "#2b2b2d", roughness: 0.85 },
  underframe: { color: "#222224", roughness: 0.85 },
  letter: { color: "#e8e6df", roughness: 0.6 },
  plate: { color: "#151515", roughness: 0.7 },
  marker: { color: "#e3d33a", roughness: 0.5 },
  bark: { color: "#5a3a1e", roughness: 0.95 },
  barkDark: { color: "#43291a", roughness: 0.95 },
  logEnd: { color: "#c9a46a", roughness: 0.8 },
  strap: { color: "#c3c6c8", metallic: 0.2, roughness: 0.5 },
};

/** A wagon builder: a Coach with the wagon palette and box helpers in source coordinates. */
export class Wagon extends Coach {
  constructor(palette: Record<string, MaterialSpec>, centre: number) {
    super({ ...WAGON_PALETTE, ...palette }, centre);
  }

  /** A closed box over source x0..x1, y0..y1, z0..z1. */
  box(mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    block(this.m, mat, this.X(Math.min(x0, x1)), this.X(Math.max(x0, x1)), y0, y1, Math.min(z0, z1), Math.max(z0, z1));
  }

  /** The same box on side s (+1 the +z side): z from a to b, both >= 0, mirrored for s < 0. */
  sideBox(mat: string, s: number, x0: number, x1: number, y0: number, y1: number, a: number, b: number): void {
    this.box(mat, x0, x1, y0, y1, ...side(s, a, b));
  }

  /**
   * A Y25-style freight bogie centred at source x `xc`: two wheelsets `wb` apart,
   * axle boxes, side frames with their spring nests, a bolster and brake blocks.
   */
  freightBogie(xc: number, wb: number, r = WAGON_WHEEL_R): void {
    const m = this.m;
    const ay = r * Math.cos(Math.PI / 24);
    for (const dx of [-wb / 2, wb / 2]) m.scope("wheelset", () => this.wheelset(this.X(xc + dx), r));
    m.scope("frame", () => {
      for (const s of [-1, 1]) {
        // the side frame's upper chord over both axle boxes, and the spring nest below it
        this.sideBox("bogie", s, xc - wb / 2 - 0.42, xc + wb / 2 + 0.42, ay + 0.13, ay + 0.29, 0.97, 1.09);
        this.sideBox("bogie", s, xc - 0.42, xc + 0.42, ay - 0.17, ay + 0.13, 0.975, 1.085);
        for (const dx of [-wb / 2, wb / 2]) {
          // the axle box over the axle end, and the guide arms either side of it
          this.sideBox("bogie", s, xc + dx - 0.14, xc + dx + 0.14, ay - 0.12, ay + 0.13, 0.84, 1.12);
          for (const d of [-0.32, 0.32]) this.sideBox("bogie", s, xc + dx + d - 0.04, xc + dx + d + 0.04, ay - 0.06, ay + 0.13, 0.99, 1.07);
          // the brake block on the wheel tread, toward the bogie centre
          const xb = xc + dx - Math.sign(dx) * (r + 0.035);
          this.sideBox("underframe", s, xb - 0.035, xb + 0.035, ay - 0.16, ay + 0.16, 0.68, 0.79);
        }
        for (const d of [-0.18, 0.18]) m.prism("spring", ngon(8, 0.065, 0, this.X(xc + d), s * 1.03), ay - 0.25, ay - 0.17);
      }
      // the bolster across, and the brake beams between the wheelsets
      this.box("bogie", xc - 0.2, xc + 0.2, ay - 0.1, ay + 0.24, -0.975, 0.975);
      for (const dx of [-wb / 2, wb / 2]) {
        const xb = xc + dx - Math.sign(dx) * (r + 0.035);
        this.box("underframe", xb - 0.03, xb + 0.03, ay - 0.04, ay + 0.04, -0.68, 0.68);
      }
    });
  }

  /**
   * The buffers and screw coupling on end e (+1 the high-x end): heads at source
   * x `head`, the buffer beam's face at `beam`, `depth` deep, y0..y1, `half` wide.
   */
  drawGear(e: number, head: number, beam: number, beam1: number, y0: number, y1: number, half: number, beamMat = "underframe"): void {
    const m = this.m;
    m.scope("buffer beam", () => this.box(beamMat, beam, beam1, y0, y1, -half, half));
    m.scope("buffers", () => this.buffers(e, head, beam));
    m.scope("coupling", () => this.coupling(e, head - e * 0.02, beam));
  }

  /**
   * A horizontal cylinder along x (a log, a tube), centre (z, y), radius r, from
   * source x0 to x1, `n` sides with a flat side down.
   */
  logX(mat: string, x0: number, x1: number, z: number, y: number, r: number, n = 8, ends?: string): void {
    const ring = ngon(n, r, Math.PI / n, z, y);
    this.m.sweep(mat, "x", ring, this.X(x0), ring, this.X(x1));
    if (ends) {
      const face = ngon(n, r * 0.86, Math.PI / n, z, y);
      for (const x of [x0 - 0.008, x1 + 0.008]) this.m.sweep(ends, "x", face, this.X(x) - 0.006, face, this.X(x) + 0.006);
    }
  }

  /** A horizontal cylinder across the wagon (along z), centre (x, y), from z0 to z1. */
  logZ(mat: string, x: number, y: number, z0: number, z1: number, r: number, n = 8, ends?: string): void {
    const ring: Ring = ngon(n, r, Math.PI / n, this.X(x), y);
    this.m.sweep(mat, "z", ring, z0, ring, z1);
    if (ends) {
      const face = ngon(n, r * 0.86, Math.PI / n, this.X(x), y);
      for (const z of [z0 - 0.008, z1 + 0.008]) this.m.sweep(ends, "z", face, z - 0.006, face, z + 0.006);
    }
  }

  /**
   * A hollow tube along x: outer radius r, wall `t`, from x0 to x1, its bore in
   * `bore` and the ring at each end in `mat`.
   */
  tube(mat: string, bore: string, x0: number, x1: number, z: number, y: number, r: number, t: number, n = 12): void {
    const m = this.m;
    const outer = ngon(n, r, Math.PI / n, z, y);
    const inner = ngon(n, r - t, Math.PI / n, z, y);
    m.sweep(mat, "x", outer, this.X(x0), outer, this.X(x1), false);
    const p = (x: number, q: [number, number]): Vec3 => [this.X(x), q[1], q[0]];
    const pts: Vec3[] = [];
    for (let i = 0; i < n; i++) {
      const [a, b] = [inner[i]!, inner[(i + 1) % n]!];
      // the bore's facets face the tube's axis
      m.facets(bore, [p(x0, a), p(x1, a), p(x1, b), p(x0, a), p(x1, b), p(x0, b)], [0, y - (a[1] + b[1]) / 2, z - (a[0] + b[0]) / 2]);
      for (const x of [x0, x1]) {
        const [c, d] = [outer[i]!, outer[(i + 1) % n]!];
        pts.push(p(x, c), p(x, d), p(x, b), p(x, c), p(x, b), p(x, a));
      }
    }
    // the end rings: the first half of each pair of quads at x0, the second at x1
    const at0 = pts.filter((_, k) => Math.floor(k / 6) % 2 === 0);
    const at1 = pts.filter((_, k) => Math.floor(k / 6) % 2 === 1);
    m.facets(mat, at0, [-1, 0, 0]);
    m.facets(mat, at1, [1, 0, 0]);
  }

  /**
   * A bulk load's top surface: a height field over source x0..x1 and z -half..half
   * on an nx by nz grid, height `h(x, z)`, drawn as flat-shaded facets.
   */
  heap(mat: string, x0: number, x1: number, half: number, nx: number, nz: number, h: (x: number, z: number) => number): void {
    const m = this.m;
    const P = (i: number, j: number): Vec3 => {
      const x = x0 + ((x1 - x0) * i) / nx;
      const z = -half + (2 * half * j) / nz;
      return [this.X(x), h(x, z), z];
    };
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const [a, b, c, d] = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
        m.facets(mat, [a, c, d, a, b, c], [0, 1, 0]);
      }
  }

  /**
   * Painted lettering on a flat face facing side s (+1: +z) at |z| = `face`, each
   * line centred at source x, its foot at y, h tall (characters `widthFactor` x h
   * wide), reading from outside.
   */
  letters(s: number, face: number, x: number, lines: Array<{ text: string; y: number; h: number }>, mat = "letter", widthFactor = 0.58): void {
    for (const line of lines) {
      const w = line.h * widthFactor;
      const gap = line.h * 0.16;
      const width = strokeWidth(line.text, w, gap);
      const u0 = this.X(x) + (s > 0 ? -width / 2 : width / 2);
      this.m.facets(mat, strokeText(line.text, u0, line.y, line.h, w, gap, s < 0).map(([u, v]): Vec3 => [u, v, s * face]), [0, 0, s]);
    }
  }
}
