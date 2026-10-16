// Present-day ruin, in metres, +Y up. Geometry references: docs/models/landmarks.md.
import { MeshBuilder, ngon, type MaterialSpec, type Ring } from './meshBuilder.ts';

const palette: Record<string, MaterialSpec> = {
  stone: { color: '#c4ad89', roughness: 1 },
  pale: { color: '#d8c5a3', roughness: 1 },
  worn: { color: '#b39a77', roughness: 1 },
  brick: { color: '#9c8063', roughness: 1 },
  earth: { color: '#82715b', roughness: 1 },
};
const TAU = Math.PI * 2;
const BAYS = 80;
const step = TAU / BAYS;

/** A curved masonry strip; each wedge has outward winding via prism(). */
function band(m: MeshBuilder, mat: string, rx: number, rz: number, depth: number, y0: number, y1: number, start = 0, end = BAYS): void {
  for (let i = start; i < end; i++) {
    const a = i * step, b = (i + 1) * step;
    const ring: Ring = [[rx * Math.cos(a), rz * Math.sin(a)], [rx * Math.cos(b), rz * Math.sin(b)], [(rx - depth) * Math.cos(b), (rz - depth) * Math.sin(b)], [(rx - depth) * Math.cos(a), (rz - depth) * Math.sin(a)]];
    const p = (j: number, y: number): [number, number, number] => [ring[j]![0], y, ring[j]![1]];
    // Adjacent wedges share their radial sides; omit those buried faces.
    m.quad(mat, p(0, y0), p(0, y1), p(1, y1), p(1, y0));
    m.quad(mat, p(2, y0), p(2, y1), p(3, y1), p(3, y0));
    m.quad(mat, p(0, y1), p(3, y1), p(2, y1), p(1, y1));
  }
}

/** Real open arch, with convex spandrel slices and a deep intrados. */
function arcade(m: MeshBuilder, rx: number, rz: number, y: number, h: number, start: number, end: number, columns: boolean): void {
  for (let i = start; i < end; i++) m.scope(`bay ${i + 1}`, () => {
    const a = (i + 0.5) * step;
    const cx = rx * Math.cos(a), cz = rz * Math.sin(a);
    const tx = -rx * Math.sin(a), tz = rz * Math.cos(a);
    const length = Math.hypot(tx, tz), ux = tx / length, uz = tz / length;
    const nx = uz, nz = -ux;
    const width = length * step, r = width * 0.32, spring = y + h - r - 1.3;
    const point = (x: number, yy: number, d = 0): [number, number, number] => [cx + ux * x + nx * d, yy, cz + uz * x + nz * d];
    const panel = (mat: string, x0: number, x1: number, y0: number, y1: number, front = 0, depth = 2.8) => {
      m.slab(mat, [point(x0, y0, front), point(x1, y0, front), point(x1, y1, front), point(x0, y1, front)], [-nx * depth, 0, -nz * depth]);
    };
    const mat = i % 5 === 0 ? 'worn' : 'stone';
    panel(mat, -width / 2 + 0.16, -r, y, y + h);
    panel(mat, r, width / 2 - 0.16, y, y + h);
    const segments = columns ? 6 : 4;
    for (let j = 0; j < segments; j++) {
      const t0 = Math.PI - j * Math.PI / segments, t1 = Math.PI - (j + 1) * Math.PI / segments;
      const x0 = r * Math.cos(t0), x1 = r * Math.cos(t1);
      const l = spring + r * Math.sin(t0), rY = spring + r * Math.sin(t1);
      m.quad(mat, point(x0, y + h), point(x1, y + h), point(x1, rY), point(x0, l));
      m.quad(mat, point(x1, y + h, -2.8), point(x0, y + h, -2.8), point(x0, l, -2.8), point(x1, rY, -2.8));
      m.quad(mat, point(x0, l), point(x1, rY), point(x1, rY, -2.8), point(x0, l, -2.8));
    }
    if (columns) {
      // Engaged Tuscan/Ionic/Corinthian shafts read separately from the piers.
      const x = -width / 2 + 0.55;
      panel('pale', x - 0.5, x + 0.5, y + 0.3, y + 0.85, 0.38, 0.5);
      panel('pale', x - 0.33, x + 0.33, y + 0.85, y + h - 0.7, 0.28, 0.4);
      panel('pale', x - 0.6, x + 0.6, y + h - 0.7, y + h - 0.18, 0.48, 0.6);
    }
  });
}

export function colosseum(): MeshBuilder {
  const m = new MeshBuilder(palette);
  m.scope('Colosseum', () => {
    m.scope('foundation and exposed hypogeum', () => {
      m.prism('earth', ngon(80, 1).map(([x, z]) => [x * 93, z * 78]), 0, 0.6);
      band(m, 'stone', 94, 79, 4, 0, 1.3);
      // Longitudinal service corridors, crossed by the animal-cell walls.
      for (const z of [-17, -10, -3, 3, 10, 17]) {
        const half = 37 * Math.sqrt(1 - (z / 24) ** 2);
        m.box('brick', 0, z, half * 2, 1.1, 0.62, 3.2 + (z % 3) * 0.12);
        for (let x = -half + 4; x < half - 2; x += 7) m.box('worn', x, z + 2.8, 0.9, 4.5, 0.65, 2.8);
      }
      band(m, 'pale', 43, 28, 2.5, 0.61, 5);
    });
    m.scope('inner surviving arcade', () => {
      arcade(m, 82, 67, 1.4, 10.5, 0, 80, false);
      arcade(m, 82, 67, 12.3, 10.5, 0, 80, false);
      band(m, 'stone', 82.1, 67.1, 3, 11.91, 12.29);
      band(m, 'stone', 82.1, 67.1, 3, 22.81, 23.2);
    });
    m.scope('cavea terraces and radial stairs', () => {
      for (let j = 0; j < 9; j++) {
        // Gaps preserve the radial access aisles and expose the ruin's structure.
        const rx = 47 + j * 3.6, rz = 32 + j * 3.6, y = 5 + j * 1.4;
        for (let bay = 0; bay < BAYS; bay++) {
          if (bay % 10 === 0 || (bay > 5 && bay < 29 && j > 4 + bay % 3)) continue;
          band(m, j % 4 === 0 ? 'worn' : 'stone', rx, rz, 3.5, y, y + 1.25, bay, bay + 1);
        }
      }
      for (let i = 0; i < 8; i++) for (let j = 0; j < 25; j++) {
        const a = (i * 10 + 0.5) * step, r = 45 + j * 1.28;
        m.box('pale', r * Math.cos(a), (r - 15) * Math.sin(a), 1.5, 1.28, 4.5 + j * 0.52, 5 + j * 0.52, -a);
      }
    });
    m.scope('surviving outer facade', () => {
      // High north wall on -Z, collapsed south wall opens the arena to the view.
      for (let level = 0; level < 3; level++) m.scope(`arcade storey ${level + 1}`, () => {
        const start = 36 + level, end = 79 - level;
        arcade(m, 92, 77, 1.4 + level * 10.7, 10.2, start, end, true);
        band(m, 'pale', 92.7, 77.7, 4, 11.6 + level * 10.7, 12.1 + level * 10.7, start, end);
      });
      m.scope('attic windows pilasters and cornice', () => {
        for (let i = 39; i < 76; i++) {
          // Alternating square openings rather than a fourth tier of arches.
          const y = 33.5, top = 47.3 - (i === 39 || i === 75 ? 2 : 0);
          band(m, 'stone', 92, 77, 2.9, y, y + 3, i, i + 1);
          band(m, 'stone', 92, 77, 2.9, y + 6, top, i, i + 1);
          const a = (i + 0.12) * step;
          m.box('pale', 91.1 * Math.cos(a), 76.1 * Math.sin(a), 2.7, 3.4, y + 3, y + 6, -a);
          band(m, 'pale', 92.5, 77.5, 3.5, top, top + 0.7, i, i + 1);
        }
      });
    });
  });
  return m;
}

