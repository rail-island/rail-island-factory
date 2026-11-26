// The primary industries of the supply chain (docs/models/industry.md, "Farm",
// "Mine" and "Logging camp"): the sites that make the raw commodities grain, coal,
// iron ore and wood from nothing. An arable farm, a mine head over a shaft with its
// loadout over a siding, and a logging camp with its log decks and loader. Real-size
// metres, +Y up, ground y = 0; the front (+z) faces the road or the track.
//
// No node: imports: this module is the three designs' own JS bundle entry (generate.ts),
// so it imports nothing from industry.ts, whose designs would come along.
import { MeshBuilder, ngon, rect, type Ring } from './meshBuilder.ts';
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from './design.ts';
import { lodBox, lodCylinder, lodLoft } from './lodPrimitives.ts';

type V3 = [number, number, number];

const PALETTE = {
  yard: { color: '#9d9888', roughness: 0.95 },
  dirt: { color: '#8a7559', roughness: 1 },
  soil: { color: '#6e5136', roughness: 1 },
  crop: { color: '#cfae4f', roughness: 0.9 },
  grass: { color: '#6f8d4a', roughness: 1 },
  concrete: { color: '#a6aaa2' },
  render: { color: '#e6dcc6', roughness: 0.85 },
  brick: { color: '#a35f48', roughness: 0.85 },
  barn: { color: '#9c3b2d', roughness: 0.85 },
  board: { color: '#7f2f24', roughness: 0.85 },
  tile: { color: '#8f4a35', roughness: 0.8 },
  roof: { color: '#3f474d', roughness: 0.7 },
  sheet: { color: '#8f979b', metallic: 0.35, roughness: 0.6 },
  galv: { color: '#bfc6c9', metallic: 0.5, roughness: 0.45 },
  wood: { color: '#9a7650' },
  timber: { color: '#5e4530', roughness: 0.9 },
  bark: { color: '#5f4430', roughness: 1 },
  logEnd: { color: '#d9b27a', roughness: 0.9 },
  steel: { color: '#405560', metallic: 0.45 },
  frame: { color: '#2c3439', metallic: 0.45 },
  rust: { color: '#7c3a22', metallic: 0.3, roughness: 0.8 },
  rail: { color: '#6b6560', metallic: 0.6 },
  ballast: { color: '#7d7870', roughness: 1 },
  glass: { color: '#78b7bf', metallic: 0.3 },
  dark: { color: '#26343b' },
  tyre: { color: '#1e2124', roughness: 0.95 },
  yellow: { color: '#edb64c' },
  red: { color: '#bd5542' },
  green: { color: '#3f7a3a' },
  orange: { color: '#e07a2a' },
  coal: { color: '#232427', roughness: 0.9 },
  coalSpoil: { color: '#4b4a48', roughness: 1 },
  ore: { color: '#8e3d24', roughness: 0.95 },
  oreSpoil: { color: '#9a5a3c', roughness: 1 },
  hay: { color: '#d8c070', roughness: 1 },
  needle: { color: '#2f5a37', roughness: 1 },
};
type Mat = keyof typeof PALETTE;
const model = (): MeshBuilder => new MeshBuilder(PALETTE);

const choice = (name: string, title: string, values: [string, string][], initial = values[0]![0]): ParamSpec => ({ name, title, default: initial, values: values.map(([value, t]) => ({ value, title: t })) });
export const FARM_PARAMS: ParamSpec[] = [/* @__PURE__ */ choice('size', 'Site size', [['compact', 'Compact'], ['large', 'Large']])];
/** The mine's ore; `iron` mines the commodity `iron-ore` (a parameter value is a plain word). */
export const MINE_PARAMS: ParamSpec[] = [/* @__PURE__ */ choice('type', 'Mine type', [['coal', 'Coal'], ['iron', 'Iron ore']])];

// ---------------------------------------------------------------- shared kit

function cyl(m: MeshBuilder, mat: Mat, x: number, z: number, r: number, y0: number, y1: number, n = 16, top = true): void { m.prism(mat, ngon(n, r, 0, x, z), y0, y1, top); }
/** A deterministic wobble in [-1, 1]. */
const wob = (i: number, k = 1): number => Math.sin(i * 12.9898 * k + 78.233) * 0.5 + Math.sin(i * 4.1414 + k) * 0.5;

/**
 * A gabled roof over a w x d plan centred on (cx, cz), eaves at `e`, ridge `rise` above
 * them, along x (`ridge: 'x'`) or z, overhanging by `o`; with the wall material's
 * gable triangles under it.
 */
function gable(m: MeshBuilder, roofMat: Mat, wallMat: Mat | null, cx: number, cz: number, w: number, d: number, e: number, rise: number, ridge: 'x' | 'z' = 'x', o = 0.45, t = 0.18): void {
  // u runs along the ridge, v across it; map (u, y, v) to (x, y, z)
  const P = (u: number, y: number, v: number): V3 => ridge === 'x' ? [cx + u, y, cz + v] : [cx + v, y, cz + u];
  const L = ridge === 'x' ? w : d, S = ridge === 'x' ? d : w, slope = rise / (S / 2);
  for (const s of [-1, 1]) {
    const yE = e - o * slope, vE = s * (S / 2 + o);
    m.slab(roofMat, [P(-L / 2 - o, yE, vE), P(L / 2 + o, yE, vE), P(L / 2 + o, e + rise, 0), P(-L / 2 - o, e + rise, 0)], [0, -t, 0]);
  }
  if (wallMat) for (const s of [-1, 1]) {
    const u = s * L / 2, inward: V3 = ridge === 'x' ? [-s * 0.2, 0, 0] : [0, 0, -s * 0.2];
    m.slab(wallMat, [P(u, e, -S / 2), P(u, e, S / 2), P(u, e + rise - 0.05, 0)], inward);
  }
}
/** A mono-pitch roof sheet from (x0..x1) at the back z0 (height y0) to the front z1 (y1). */
function lean(m: MeshBuilder, mat: Mat, x0: number, x1: number, z0: number, y0: number, z1: number, y1: number, t = 0.15): void {
  m.slab(mat, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z1], [x0, y1, z1]], [0, -t, 0]);
}
/** A window: glass a few centimetres proud of a wall facing `dir`, a sill under it. */
function windowOn(m: MeshBuilder, face: 'x' | 'z', dir: 1 | -1, at: number, u: number, y0: number, w: number, h: number, frame: Mat = 'render'): void {
  // each part starts a little further out of the wall, so no two inner faces share its plane
  const box = (mat: Mat, du: number, dw: number, in0: number, dd: number, a: number, b: number): void => {
    const c = at + dir * (in0 + dd / 2);
    if (face === 'z') m.box(mat, u + du, c, dw, dd, a, b);
    else m.box(mat, c, u + du, dd, dw, a, b);
  };
  box(frame, 0, w + 0.24, 0, 0.08, y0 - 0.12, y0 + h + 0.12);
  box('glass', 0, w, 0.02, 0.1, y0, y0 + h);
  box(frame, 0, 0.08, 0.03, 0.13, y0 + 0.01, y0 + h - 0.01);
  box('concrete', 0, w + 0.4, 0.01, 0.21, y0 - 0.2, y0 - 0.08);
}
/** A post-and-rail fence along a straight run from (x0, z0) to (x1, z1). */
function fence(m: MeshBuilder, x0: number, z0: number, x1: number, z1: number, y = 0.15, mat: Mat = 'wood'): void {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    m.box('timber', x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 0.14, 0.14, y, y + 1.3);
  }
  const along = x1 !== x0;
  for (const h of [0.55, 1.05]) {
    if (along) m.box(mat, (x0 + x1) / 2, z0 + 0.1, Math.abs(x1 - x0), 0.06, y + h, y + h + 0.14);
    else m.box(mat, x0 + 0.1, (z0 + z1) / 2, 0.06, Math.abs(z1 - z0), y + h, y + h + 0.14);
  }
}
/** A wheel of radius r about (x, y, z), its axle along x, of width w. */
function wheelX(m: MeshBuilder, x: number, y: number, z: number, r: number, w: number, hub: Mat = 'yellow'): void {
  m.sweep('tyre', 'x', ngon(12, r, 0, z, y), x - w / 2, ngon(12, r, 0, z, y), x + w / 2);
  const s = Math.sign(x) || 1;
  m.sweep(hub, 'x', ngon(8, r * 0.55, 0, z, y), x + s * w / 2, ngon(8, r * 0.55, 0, z, y), x + s * (w / 2 + 0.04));
}
/** A wheel with its axle along z. */
function wheelZ(m: MeshBuilder, x: number, y: number, z: number, r: number, w: number, hub: Mat = 'dark'): void {
  m.sweep('tyre', 'z', ngon(12, r, 0, x, y), z - w / 2, ngon(12, r, 0, x, y), z + w / 2);
  const s = Math.sign(z) || 1;
  m.sweep(hub, 'z', ngon(8, r * 0.55, 0, x, y), z + s * w / 2, ngon(8, r * 0.55, 0, x, y), z + s * (w / 2 + 0.04));
}
/** A vertical ladder against a face, rails across x. */
function ladder(m: MeshBuilder, x: number, z: number, y: number, h: number): void {
  for (const dx of [-0.25, 0.25]) m.box('steel', x + dx, z, 0.07, 0.08, y, y + h);
  for (let a = y + 0.3; a < y + h; a += 0.6) m.box('steel', x, z, 0.5, 0.06, a, a + 0.05);
}
/** A yard lamp on a pole, its head toward `dir` along x. */
function lamp(m: MeshBuilder, x: number, z: number, y: number, dir: 1 | -1): void {
  cyl(m, 'steel', x, z, 0.08, y, y + 6, 8);
  m.box('steel', x + dir * 0.55, z, 1.1, 0.1, y + 5.9, y + 6);
  m.box('dark', x + dir * 1.05, z, 0.5, 0.3, y + 5.75, y + 5.95);
}
/** A straight standard-gauge siding along x on ballast and sleepers. */
function siding(m: MeshBuilder, x0: number, x1: number, z: number, y: number): number {
  m.sweep('ballast', 'x', [[z - 1.9, y], [z + 1.9, y], [z + 1.3, y + 0.35], [z - 1.3, y + 0.35]], x0, [[z - 1.9, y], [z + 1.9, y], [z + 1.3, y + 0.35], [z - 1.3, y + 0.35]], x1);
  for (let x = x0 + 0.4; x < x1 - 0.2; x += 1.2) m.box('timber', x, z, 0.26, 2.5, y + 0.35, y + 0.5);
  for (const s of [-1, 1]) m.box('rail', (x0 + x1) / 2, z + s * 0.7525, x1 - x0, 0.07, y + 0.5, y + 0.66);
  return y + 0.66;
}

// ---------------------------------------------------------------- farm

/** The farm's plan for a size: the whole site, the field strip on -x and the yard. */
export function farmPlan(size: string): { w: number; d: number; field: number } {
  return size === 'large' ? { w: 56, d: 38, field: 18 } : { w: 42, d: 30, field: 12 };
}
const FARM_Y = 0.15;

function farmhouse(m: MeshBuilder, x: number, z: number): void {
  m.scope('Farmhouse', () => {
    const w = 9, d = 7.5, e = 5.8, y = FARM_Y;
    m.box('concrete', x, z, w + 0.3, d + 0.3, y, y + 0.5);
    m.box('render', x, z, w, d, y + 0.5, e, 0, false);
    gable(m, 'tile', 'render', x, z, w, d, e, 3.4, 'x');
    // the chimney through the ridge and the front porch
    m.box('brick', x + 2.4, z - 0.6, 0.7, 0.7, e + 1.5, e + 4.6);
    m.box('dark', x + 2.4, z - 0.6, 0.5, 0.5, e + 4.6, e + 4.72);
    const fz = z + d / 2;
    m.box('timber', x - 1.4, fz + 0.06, 1.1, 0.12, y + 0.5, y + 2.7);
    m.box('concrete', x - 1.4, fz + 1, 2.6, 2, y, y + 0.35);
    for (const dx of [-2.5, -0.3]) m.box('wood', x + dx, fz + 1.8, 0.14, 0.14, y + 0.35, y + 3);
    lean(m, 'tile', x - 2.8, x, fz, y + 3.3, fz + 2.2, y + 2.95);
    for (const [u, yy] of [[1.4, 1.4], [3.4, 1.4], [-3.4, 1.4], [-3.4, 3.8], [-1.4, 3.8], [1.4, 3.8], [3.4, 3.8]] as const) windowOn(m, 'z', 1, fz, x + u, y + yy, 1.1, 1.4, 'wood');
    for (const u of [-2.6, 0, 2.6]) for (const yy of [1.4, 3.8]) windowOn(m, 'z', -1, z - d / 2, x + u, y + yy, 1.1, 1.4, 'wood');
    for (const u of [-1.6, 1.6]) windowOn(m, 'x', 1, x + w / 2, z + u, y + 3.8, 1, 1.3, 'wood');
    windowOn(m, 'x', 1, x + w / 2, z, y + e + 0.6, 0.8, 1, 'wood');
  });
}

function barn(m: MeshBuilder, x: number, z: number, w: number): void {
  m.scope('Barn', () => {
    const d = 11, e = 5.2, y = FARM_Y;
    m.box('concrete', x, z, w + 0.3, d + 0.3, y, y + 0.6);
    m.box('barn', x, z, w, d, y + 0.6, e, 0, false);
    gable(m, 'roof', 'barn', x, z, w, d, e, 4.4, 'x', 0.6);
    // vertical battens on the long faces and on the gables
    for (const s of [-1, 1]) for (let u = -w / 2 + 0.6; u < w / 2 - 0.3; u += 1.2) m.box('board', x + u, z + s * (d / 2 + 0.04), 0.12, 0.08, y + 0.6, e - 0.1);
    // the big double doors in the front face, on a rail; a hay door in the gable
    const fz = z + d / 2;
    for (const dx of [-1.7, 1.7]) {
      m.box('board', x + dx, fz + 0.1, 3.3, 0.14, y + 0.6, y + 4.4);
      m.slab('wood', [[x + dx - 1.5, y + 0.8, fz + 0.18], [x + dx + 1.5, y + 4.2, fz + 0.18], [x + dx + 1.5, y + 3.95, fz + 0.18], [x + dx - 1.5, y + 0.55 + 0.3, fz + 0.18]], [0, 0, 0.05]);
      m.box('wood', x + dx, fz + 0.2, 3.1, 0.08, y + 2.4, y + 2.6);
    }
    m.box('steel', x, fz + 0.12, 7.6, 0.16, y + 4.55, y + 4.7);
    m.box('board', x + w / 2 + 0.06, z, 0.12, 2, e + 0.6, e + 2.4);
    m.box('timber', x + w / 2 + 0.5, z, 0.9, 0.18, e + 2.6, e + 2.78);
    // ridge ventilators
    for (const u of [-w / 4, w / 4]) { m.box('roof', x + u, z, 1.4, 1.4, e + 4.15, e + 4.75); m.box('roof', x + u, z, 1.9, 1.9, e + 4.75, e + 4.9); }
  });
}

/** A corrugated grain bin of radius r and wall height h on its ring footing, with a ladder. */
function bin(m: MeshBuilder, x: number, z: number, r: number, h: number): void {
  const y = FARM_Y;
  cyl(m, 'concrete', x, z, r + 0.3, y, y + 0.4, 20);
  cyl(m, 'galv', x, z, r, y + 0.4, y + h, 20, false);
  for (let a = y + 1.4; a < y + h - 0.3; a += 1.2) cyl(m, 'sheet', x, z, r + 0.05, a, a + 0.12, 20, false);
  m.loft('galv', ngon(20, r + 0.22, 0, x, z), y + h, ngon(20, 0.7, 0, x, z), y + h + r * 0.55, false);
  cyl(m, 'sheet', x, z, 0.7, y + h + r * 0.55, y + h + r * 0.55 + 0.5, 10);
  // the roof's fan and the unloading auger's sump at the foot
  m.box('sheet', x - r - 0.3, z + 0.6, 0.8, 0.8, y + 0.4, y + 1.2);
  cyl(m, 'dark', x - r - 0.3, z + 0.6, 0.3, y + 1.2, y + 1.3, 10);
  ladder(m, x, z + r + 0.12, y + 0.5, h - 0.2);
}

/** The bucket elevator leg beside the bins, its head and spouts to each bin's top. */
function elevator(m: MeshBuilder, x: number, z: number, h: number, bins: [number, number, number][]): void {
  const y = FARM_Y;
  m.box('concrete', x, z, 2.4, 2.4, y, y + 0.5);
  for (const dx of [-0.8, 0.8]) for (const dz of [-0.8, 0.8]) m.box('steel', x + dx, z + dz, 0.12, 0.12, y + 0.5, h);
  for (let a = y + 2; a < h; a += 2.5) {
    for (const s of [-1, 1]) { m.box('steel', x, z + s * 0.8, 1.72, 0.1, a, a + 0.1); m.box('steel', x + s * 0.8, z, 0.1, 1.5, a, a + 0.1); }
  }
  m.box('galv', x, z, 0.7, 0.45, y + 0.5, h + 0.5);
  m.box('galv', x, z, 1.4, 1, h + 0.5, h + 1.7);
  gable(m, 'galv', null, x, z, 1.4, 1, h + 1.7, 0.3, 'z', 0.1, 0.1);
  for (const [bx, bz, top] of bins) {
    const ang = Math.atan2(bz - z, bx - x), ex = bx - Math.cos(ang) * 0.6, ez = bz - Math.sin(ang) * 0.6;
    m.rod('galv', [x, h + 0.8, z], [ex, top + 0.6, ez], 0.12, 6);
  }
  // the receiving pit's hopper and its grate under a lean-to
  m.box('steel', x + 2, z + 2.2, 2.2, 2.2, y, y + 0.12);
}

function tractor(m: MeshBuilder, x: number, z: number, y: number): void {
  m.scope('Tractor', () => {
    m.box('green', x, z + 0.4, 1, 2.4, y + 0.8, y + 1.7);
    m.box('green', x, z - 1.1, 1.3, 1.2, y + 0.8, y + 1.9);
    m.box('dark', x, z + 1.65, 0.9, 0.08, y + 0.9, y + 1.6);
    for (const dx of [-0.62, 0.62]) for (const dz of [-0.55, 0.55]) m.box('frame', x + dx, z - 1.1 + dz, 0.06, 0.06, y + 1.9, y + 2.9);
    m.box('glass', x, z - 1.1, 1.18, 1.05, y + 1.95, y + 2.85, 0, false);
    m.box('green', x, z - 1.1, 1.45, 1.3, y + 2.9, y + 3.02);
    cyl(m, 'frame', x - 0.25, z + 1.1, 0.06, y + 1.7, y + 2.6, 6);
    for (const s of [-1, 1]) { wheelX(m, x + s * 0.9, y + 0.8, z - 1.1, 0.8, 0.45); wheelX(m, x + s * 0.72, y + 0.48, z + 1.2, 0.48, 0.3); }
  });
}

function machineryShed(m: MeshBuilder, x: number, z: number, w: number): void {
  m.scope('Machinery shed', () => {
    const d = 7, y = FARM_Y;
    m.box('concrete', x, z, w, d, y, y + 0.12);
    // closed back and ends in sheeting, open front on steel posts
    m.box('sheet', x, z - d / 2 + 0.08, w, 0.16, y + 0.12, y + 4.6);
    for (const s of [-1, 1]) m.slab('sheet', [[x + s * (w / 2 - 0.08), y + 0.12, z - d / 2], [x + s * (w / 2 - 0.08), y + 0.12, z + d / 2], [x + s * (w / 2 - 0.08), y + 3.6, z + d / 2], [x + s * (w / 2 - 0.08), y + 4.6, z - d / 2]], [-s * 0.16, 0, 0]);
    for (let u = -w / 2 + 0.2; u <= w / 2 - 0.19; u += (w - 0.4) / 3) m.box('steel', x + u, z + d / 2 - 0.2, 0.2, 0.2, y + 0.12, y + 3.6);
    m.box('steel', x, z + d / 2 - 0.2, w, 0.25, y + 3.3, y + 3.6);
    lean(m, 'sheet', x - w / 2 - 0.3, x + w / 2 + 0.3, z - d / 2 - 0.3, y + 4.75, z + d / 2 + 0.5, y + 3.75);
    tractor(m, x - w / 4, z + 0.2, y + 0.12);
    // a trailer and a seed drill under it
    m.box('red', x + w / 5, z - 0.2, 2.2, 4, y + 1, y + 1.7);
    for (const s of [-1, 1]) wheelX(m, x + w / 5 + s * 1.2, y + 0.6, z - 0.4, 0.48, 0.3, 'red');
    m.box('frame', x + w / 5, z + 2.3, 0.12, 1.2, y + 0.85, y + 0.95);
    m.box('orange', x + w / 3 + 1.4, z - 1.6, 3, 0.9, y + 0.6, y + 1.3);
  });
}

function haystack(m: MeshBuilder, x: number, z: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const row = i < n / 2 ? 0 : 1, k = row ? i - Math.ceil(n / 2) : i;
    const rz = z + k * 1.3 + row * 0.65, y = FARM_Y + row * 1.2 + 0.6;
    m.sweep('hay', 'x', ngon(10, 0.6, 0, rz, y), x - 0.6, ngon(10, 0.6, 0, rz, y), x + 0.6);
  }
}

/** The arable farm at full detail. */
export function farm(given?: ParamValues): MeshBuilder {
  const p = resolveParams(FARM_PARAMS, given), m = model(), large = p.size === 'large', { w, d, field } = farmPlan(p.size);
  const x0 = -w / 2 + field; // the yard's west edge
  return m.scope('Arable farm', () => {
    m.scope('Ground', () => {
      m.box('yard', (x0 + w / 2) / 2, 0, w / 2 - x0, d, 0, FARM_Y);
      // the field strip: tilled soil and rows of ripe grain, a headland on its east edge
      m.box('soil', -w / 2 + field / 2, 0, field, d, 0, 0.2);
      for (let x = -w / 2 + 0.6; x < x0 - 1.4; x += 1.1) m.box('crop', x, -1, 0.75, d - 4, 0.2, 0.85 + 0.08 * wob(x));
      m.box('grass', x0 - 0.6, 0, 1.2, d, 0.2, 0.32);
    });
    m.scope('Fence', () => {
      fence(m, x0, -d / 2 + 0.3, w / 2 - 0.3, -d / 2 + 0.3);
      fence(m, w / 2 - 0.3, -d / 2 + 0.3, w / 2 - 0.3, d / 2 - 0.3);
      // the front fence leaves the gateway open
      fence(m, x0, d / 2 - 0.3, x0 + 6, d / 2 - 0.3);
      fence(m, x0 + 12, d / 2 - 0.3, w / 2 - 0.3, d / 2 - 0.3);
      for (const gx of [x0 + 6.3, x0 + 11.7]) m.box('timber', gx, d / 2 - 0.3, 0.3, 0.3, FARM_Y, FARM_Y + 1.7);
    });
    farmhouse(m, w / 2 - 6.5, d / 2 - 7.5);
    barn(m, large ? 1 : -2, -d / 2 + 7.5, large ? 20 : 14);
    machineryShed(m, w / 2 - 7.5, -d / 2 + 5, large ? 11 : 9);
    m.scope('Grain bins', () => {
      const bx = x0 + 4.5, r = large ? 3.2 : 2.8, h = large ? 7 : 6;
      const spots: [number, number][] = large ? [[bx, 2], [bx + 7.4, 2], [bx, 9.2], [bx + 7.4, 9.2]] : [[bx, 3], [bx + 6.6, 3]];
      for (const [x, z] of spots) bin(m, x, z, r, h);
      const ex = large ? bx + 3.7 : bx + 3.3, ez = large ? 5.6 : 7.2;
      elevator(m, ex, ez, h + r * 0.55 + 4, spots.map(([x, z]) => [x, z, FARM_Y + h + r * 0.55]));
    });
    m.scope('Yard', () => {
      haystack(m, large ? 8 : x0 + 3, large ? 10 : 9, large ? 8 : 6);
      lamp(m, w / 2 - 12, d / 2 - 2.5, FARM_Y, -1);
      // the yard's water trough and a diesel tank on its stand
      m.box('concrete', w / 2 - 1.8, 2.5, 0.9, 2.4, FARM_Y, FARM_Y + 0.7);
      const tz = -d / 2 + 11.5, tx = w / 2 - 2.2;
      for (const dz of [-0.8, 0.8]) m.box('steel', tx, tz + dz, 0.8, 0.12, FARM_Y, FARM_Y + 1);
      m.sweep('green', 'z', ngon(12, 0.6, 0, tx, FARM_Y + 1.55), tz - 1.2, ngon(12, 0.6, 0, tx, FARM_Y + 1.55), tz + 1.2);
    });
    return m;
  });
}
/** The farm's low detail: field, yard, buildings as blocks with their roofs, bins as hexagonal drums. */
export function farmLod(given?: ParamValues): MeshBuilder {
  const p = resolveParams(FARM_PARAMS, given), m = model(), large = p.size === 'large', { w, d, field } = farmPlan(p.size), x0 = -w / 2 + field;
  lodBox(m, 'yard', (x0 + w / 2) / 2, 0, w / 2 - x0, d, 0, FARM_Y);
  lodBox(m, 'crop', -w / 2 + field / 2, 0, field, d, 0, 0.8);
  const block = (wall: Mat, roofMat: Mat, x: number, z: number, bw: number, bd: number, e: number, rise: number): void => {
    lodBox(m, wall, x, z, bw, bd, FARM_Y, e);
    const s: Ring = [[z - bd / 2 - 0.3, e - 0.1], [z + bd / 2 + 0.3, e - 0.1], [z, e + rise]];
    m.sweep(roofMat, 'x', s, x - bw / 2 - 0.3, s, x + bw / 2 + 0.3);
  };
  block('render', 'tile', w / 2 - 6.5, d / 2 - 7.5, 9, 7.5, 5.8, 3.4);
  block('barn', 'roof', large ? 1 : -2, -d / 2 + 7.5, large ? 20 : 14, 11, 5.2, 4.4);
  const sw = large ? 11 : 9;
  lodBox(m, 'sheet', w / 2 - 7.5, -d / 2 + 5, sw, 7, FARM_Y, 4.5);
  const bx = x0 + 4.5, r = large ? 3.2 : 2.8, h = large ? 7 : 6;
  const spots: [number, number][] = large ? [[bx, 2], [bx + 7.4, 2], [bx, 9.2], [bx + 7.4, 9.2]] : [[bx, 3], [bx + 6.6, 3]];
  for (const [x, z] of spots) { lodCylinder(m, 'galv', x, z, r, FARM_Y, FARM_Y + h); m.spire('galv', ngon(6, r + 0.2, 0, x, z), FARM_Y + h, FARM_Y + h + r * 0.55); }
  lodBox(m, 'galv', large ? bx + 3.7 : bx + 3.3, large ? 5.6 : 7.2, 1.4, 1.4, FARM_Y, FARM_Y + h + r * 0.55 + 5.7);
  return m;
}

// ---------------------------------------------------------------- mine

/** The mine head's site and its parts' positions. */
export const MINE = {
  w: 46, d: 32,
  /** the shaft under the headframe */
  shaft: { x: -12, z: 6 },
  /** the headframe's sheave axle height */
  sheave: 23,
  /** the bunker over the siding */
  bunker: { x: 10, z: 7.5, y0: 8, y1: 13.5 },
  /** the siding's centre line */
  track: 7.5,
  /** how far behind the shaft the back legs stand, and the winding house */
  legs: 13, house: 17.4,
};
const MINE_Y = 0.2;

function headframe(m: MeshBuilder, paint: Mat): void {
  const { x, z } = MINE.shaft, top = MINE.sheave - 1.6, a = 2.4;
  m.scope('Headframe', () => {
    // the shaft collar and the banking deck round the cage
    m.box('concrete', x, z, 7, 7, MINE_Y, MINE_Y + 1.2);
    m.box('dark', x, z, 3.2, 4.4, MINE_Y + 1.2, MINE_Y + 1.25);
    // four legs of the tower, girts every 4 m, X bracing on the two side faces
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box(paint, x + sx * a, z + sz * a, 0.45, 0.45, MINE_Y + 1.2, top);
    for (let y = MINE_Y + 5; y < top; y += 4) for (const s of [-1, 1]) {
      m.box(paint, x, z + s * a, 2 * a, 0.3, y, y + 0.3);
      m.box(paint, x + s * a, z, 0.3, 2 * a, y, y + 0.3);
    }
    for (let y = MINE_Y + 1.2; y + 4 <= top; y += 4) for (const s of [-1, 1]) {
      const y1 = Math.min(y + 4, top);
      m.rod(paint, [x + s * a, y, z - a], [x + s * a, y1, z + a], 0.1, 6);
      m.rod(paint, [x + s * a, y, z + a], [x + s * a, y1, z - a], 0.1, 6);
    }
    // the cage guides and the cage at bank
    for (const dz of [-1.2, 1.2]) m.box('timber', x, z + dz, 0.2, 0.2, MINE_Y + 1.25, top - 1);
    m.box('steel', x, z, 1.6, 2, MINE_Y + 1.25, MINE_Y + 4.2);
    m.box('yellow', x, z, 1.7, 2.1, MINE_Y + 4.2, MINE_Y + 4.4);
    // the back legs, raking down toward the winding house behind (-z)
    for (const sx of [-1, 1]) m.rod(paint, [x + sx * a, top, z - a + 0.2], [x + sx * (a + 0.6), MINE_Y + 1.2, z - MINE.legs], 0.32, 8);
    for (const f of [0.35, 0.65]) {
      const yy = top + (MINE_Y + 1.2 - top) * f, zz = z - a + (-MINE.legs + a) * f;
      m.rod(paint, [x - a - 0.6 * f, yy, zz], [x + a + 0.6 * f, yy, zz], 0.14, 6);
      m.rod(paint, [x - a, top - 4, z - a], [x + a * 0.2, yy, zz], 0.1, 6);
    }
    for (const sx of [-1, 1]) m.box('concrete', x + sx * (a + 0.6), z - MINE.legs, 1.4, 1.4, MINE_Y, MINE_Y + 1.25);
    // the sheave deck with its railing, and the two sheave wheels side by side
    m.box(paint, x, z - 0.6, 2 * a + 1.6, 2 * a + 2.8, top, top + 0.4);
    for (const s of [-1, 1]) {
      m.box('yellow', x + s * (a + 0.7), z - 0.6, 0.06, 2 * a + 2.8, top + 1.4, top + 1.5);
      for (let u = -a - 1.2; u <= a + 0.6; u += 1.6) m.box('yellow', x + s * (a + 0.7), z + u, 0.06, 0.06, top + 0.4, top + 1.4);
    }
    for (const dx of [-0.75, 0.75]) {
      const cx = x + dx, cy = MINE.sheave, r = 2.1;
      m.tube('frame', 'x', z, cy, r, r - 0.22, cx - 0.12, cx + 0.12, 24);
      m.sweep('frame', 'x', ngon(10, 0.32, 0, z, cy), cx - 0.25, ngon(10, 0.32, 0, z, cy), cx + 0.25);
      for (let k = 0; k < 8; k++) {
        const t = k * Math.PI / 4 + (dx > 0 ? 0.2 : 0);
        m.rod('frame', [cx, cy + 0.3 * Math.sin(t), z + 0.3 * Math.cos(t)], [cx, cy + (r - 0.2) * Math.sin(t), z + (r - 0.2) * Math.cos(t)], 0.05, 4);
      }
      m.box(paint, cx, z - 0.6, 0.4, 1.2, top + 0.4, cy - 0.2);
      // the winding rope down the shaft and back to the drum in the winding house
      m.rod('dark', [cx, cy, z + r], [cx, MINE_Y + 4.4, z + r - 0.1], 0.04, 4);
      m.rod('dark', [cx, cy + r * 0.8, z - r * 0.6], [cx, MINE_Y + 9.1, z - MINE.house + 4], 0.04, 4);
    }
    // a stair up the side to the sheave deck
    for (let y = MINE_Y + 1.2; y < top - 2; y += 4) m.slab('steel', [[x + a + 0.3, y, z - 1.5], [x + a + 0.3, y + 4, z + 1.5], [x + a + 1.2, y + 4, z + 1.5], [x + a + 1.2, y, z - 1.5]], [0, 0.15, 0]);
  });
}

function windingHouse(m: MeshBuilder): void {
  const x = MINE.shaft.x, z = MINE.shaft.z - MINE.house, w = 10, d = 8, e = 8;
  m.scope('Winding house', () => {
    m.box('concrete', x, z, w + 0.4, d + 0.4, MINE_Y, MINE_Y + 0.8);
    m.box('brick', x, z, w, d, MINE_Y + 0.8, e, 0, false);
    gable(m, 'roof', 'brick', x, z, w, d, e, 2.6, 'z');
    // tall round-headed engine windows on the long faces, the rope openings in the front gable
    for (const s of [-1, 1]) for (const u of [-2.4, 0, 2.4]) {
      windowOn(m, 'x', s as 1 | -1, x + s * w / 2, z + u, MINE_Y + 2, 1.3, 3.8, 'concrete');
    }
    for (const dx of [-0.75, 0.75]) m.box('dark', x + dx, z + d / 2 + 0.03, 0.5, 0.06, MINE_Y + 8.6, MINE_Y + 9.6);
    m.box('timber', x - 2.5, z + d / 2 + 0.06, 1.6, 0.12, MINE_Y + 0.8, MINE_Y + 3.4);
    // pilasters at the corners and a string course
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box('brick', x + sx * (w / 2 - 0.15), z + sz * (d / 2 - 0.15), 0.6, 0.6, MINE_Y + 0.8, e);
    m.box('concrete', x, z, w + 0.45, d + 0.45, e - 0.5, e - 0.3);
    // the roof ventilator
    m.box('roof', x, z, 1.3, 2.4, e + 2.4, e + 3.1);
  });
}

function bunker(m: MeshBuilder, mat: Mat, load: Mat): void {
  const { x, z, y0, y1 } = MINE.bunker, w = 9, d = 6.4;
  m.scope('Bunker and loadout', () => {
    // four legs on footings straddling the siding, the bin and its two hoppers
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      m.box('concrete', x + sx * (w / 2 - 0.4), z + sz * (d / 2 - 0.4), 1.1, 1.1, MINE_Y, MINE_Y + 0.5);
      m.box('frame', x + sx * (w / 2 - 0.4), z + sz * (d / 2 - 0.4), 0.5, 0.5, MINE_Y + 0.5, y0);
    }
    for (const sx of [-1, 1]) m.rod('frame', [x + sx * (w / 2 - 0.4), MINE_Y + 0.6, z - d / 2 + 0.4], [x + sx * (w / 2 - 0.4), y0 - 0.4, z + d / 2 - 0.4], 0.1, 6);
    m.box(mat, x, z, w, d, y0, y1, 0, false);
    m.box('frame', x, z, w + 0.3, d + 0.3, y1, y1 + 0.3);
    for (let u = -w / 2 + 1.5; u < w / 2; u += 1.5) for (const s of [-1, 1]) m.box('frame', x + u, z + s * (d / 2 + 0.06), 0.25, 0.12, y0, y1);
    for (const dx of [-w / 4, w / 4]) {
      m.loft(mat, rect(1.4, 1.4, x + dx, z), y0 - 2.2, rect(w / 2 - 0.1, d - 0.1, x + dx, z), y0 - 0.01, false);
      // the chute's gate and the spout down to the wagon
      m.box('frame', x + dx, z, 1.5, 1.5, y0 - 2.6, y0 - 2.2);
      m.slab('steel', [[x + dx - 0.5, y0 - 2.6, z - 0.5], [x + dx + 0.5, y0 - 2.6, z - 0.5], [x + dx + 0.4, y0 - 3.3, z - 0.3], [x + dx - 0.4, y0 - 3.3, z - 0.3]], [0, 0, 0.8]);
    }
    // the gallery on the roof where the conveyor tips, with a railing
    m.box('sheet', x - 1.5, z, 5, 3.4, y1 + 0.3, y1 + 2.6);
    gable(m, 'roof', 'sheet', x - 1.5, z, 5, 3.4, y1 + 2.6, 0.6, 'x', 0.2, 0.12);
    for (let u = -w / 2 + 0.2; u <= w / 2; u += 1.5) m.box('yellow', x + u, z + d / 2 + 0.1, 0.06, 0.06, y1 + 0.3, y1 + 1.3);
    m.box('yellow', x, z + d / 2 + 0.1, w, 0.06, y1 + 1.25, y1 + 1.35);
    // the hopper wagon under the chutes, part loaded
    const ty = siding(m, -4, MINE.w / 2, MINE.track, MINE_Y);
    const wx = x - 0.5, wl = 10;
    m.box('frame', wx, z, wl, 2.4, ty + 0.9, ty + 1.3);
    for (const s of [-1, 1]) {
      m.box('frame', wx + s * (wl / 2 - 1.8), z, 2.4, 2.2, ty + 0.4, ty + 0.9);
      for (const dx of [-0.9, 0.9]) for (const dz of [-0.75, 0.75]) wheelZ(m, wx + s * (wl / 2 - 1.8) + dx, ty + 0.46, z + dz, 0.46, 0.14);
      m.loft(mat === 'rust' ? 'rust' : 'steel', rect(2, 2.6, wx + s * 2.3, z), ty + 1.3, rect(4.4, 3, wx + s * 2.3, z), ty + 3.4, false);
    }
    m.box(mat === 'rust' ? 'rust' : 'steel', wx, z, wl - 0.4, 3, ty + 3.4, ty + 3.9, 0, false);
    m.loft(load, rect(wl - 0.6, 2.8, wx, z), ty + 3.3, rect(wl - 2.6, 1.4, wx, z), ty + 4.1);
  });
}

function conveyor(m: MeshBuilder): void {
  const xa = MINE.shaft.x + 3.6, ya = MINE_Y + 4.5, xb = MINE.bunker.x - 3.6, yb = MINE.bunker.y1 + 0.8, z = MINE.shaft.z + 1.5, wd = 2.2;
  m.scope('Conveyor gallery', () => {
    const at = (t: number): [number, number] => [xa + (xb - xa) * t, ya + (yb - ya) * t];
    // the enclosed gallery: a sheeted box laid on the incline, its roof and a strip of windows
    m.slab('sheet', [[xa, ya, z - wd / 2], [xb, yb, z - wd / 2], [xb, yb + 2, z - wd / 2], [xa, ya + 2, z - wd / 2]], [0, 0, wd]);
    m.slab('roof', [[xa - 0.2, ya + 2, z - wd / 2 - 0.2], [xb + 0.2, yb + 2, z - wd / 2 - 0.2], [xb + 0.2, yb + 2, z + wd / 2 + 0.2], [xa - 0.2, ya + 2, z + wd / 2 + 0.2]], [0, 0.15, 0]);
    for (let t = 0.08; t < 0.95; t += 0.12) {
      const [x0, y0] = at(t), [x1, y1] = at(t + 0.07);
      for (const s of [-1, 1]) m.slab('glass', [[x0, y0 + 1, z + s * (wd / 2 + 0.02)], [x1, y1 + 1, z + s * (wd / 2 + 0.02)], [x1, y1 + 1.6, z + s * (wd / 2 + 0.02)], [x0, y0 + 1.6, z + s * (wd / 2 + 0.02)]], [0, 0, s * 0.03]);
    }
    // trestles under it
    for (const t of [0.3, 0.62]) {
      const [x, y] = at(t);
      for (const s of [-1, 1]) m.box('frame', x, z + s * (wd / 2 - 0.2), 0.3, 0.3, MINE_Y, y);
      m.box('frame', x, z, 0.3, wd - 0.2, y - 0.6, y);
      m.rod('frame', [x, MINE_Y + 0.3, z - wd / 2 + 0.15], [x, y - 0.6, z + wd / 2 - 0.15], 0.07, 4);
    }
  });
}

/** An irregular heap: stacked rings that narrow to a rounded crest, about (x, z), stretched along x by `sx`. */
function heap(m: MeshBuilder, mat: Mat, x: number, z: number, r: number, h: number, sx = 1, seed = 1): void {
  const n = 14, levels = [0, 0.35, 0.65, 0.88, 1], rs = [1, 0.78, 0.52, 0.27, 0.06];
  const ring = (k: number): Ring => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, j = 1 + 0.09 * wob(i + k * 7 + seed * 31, seed);
    return [x + Math.cos(a) * r * rs[k]! * j * sx, z - Math.sin(a) * r * rs[k]! * j];
  });
  for (let k = 0; k + 1 < levels.length; k++) m.loft(mat, ring(k), MINE_Y + h * levels[k]!, ring(k + 1), MINE_Y + h * levels[k + 1]!, k + 2 === levels.length);
}

/** The mine head at full detail: coal or iron ore. */
export function mine(given?: ParamValues): MeshBuilder {
  const p = resolveParams(MINE_PARAMS, given), m = model(), ore = p.type === 'iron';
  const paint: Mat = ore ? 'red' : 'frame', bin: Mat = ore ? 'rust' : 'steel', load: Mat = ore ? 'ore' : 'coal', spoil: Mat = ore ? 'oreSpoil' : 'coalSpoil';
  return m.scope('Mine head', () => {
    m.box('yard', 0, 0, MINE.w, MINE.d, 0, MINE_Y);
    headframe(m, paint);
    windingHouse(m);
    bunker(m, bin, load);
    conveyor(m);
    m.scope('Spoil heap', () => { heap(m, spoil, 13, -7.5, 7.4, 9, 1.25, ore ? 2 : 1); });
    m.scope('Stockpile', () => { heap(m, load, -15, 12.6, 2.6, 2.6, 1.3, ore ? 4 : 3); });
    if (ore) m.scope('Crusher house', () => {
      // iron ore: the primary crusher between the shaft and the conveyor's foot, and the ore car tippler
      const x = MINE.shaft.x + 6.5, z = MINE.shaft.z - 6;
      m.box('sheet', x, z, 6, 5, MINE_Y, 7, 0, false);
      gable(m, 'roof', 'sheet', x, z, 6, 5, 7, 1.4, 'z', 0.3, 0.12);
      m.box('rust', x + 3.4, z, 0.8, 2.4, MINE_Y, 5.5);
      m.box('dark', x, z + 2.53, 2.6, 0.06, MINE_Y, 3.4);
      for (const dz of [-1, 1]) windowOn(m, 'x', -1, x - 3, z + dz, 4.2, 0.9, 1.2, 'sheet');
    });
    else m.scope('Screening house', () => {
      // coal: the screens and picking belts in a sheeted house on legs beside the shaft
      const x = MINE.shaft.x + 6.5, z = MINE.shaft.z - 6;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box('frame', x + sx * 2.6, z + sz * 2, 0.4, 0.4, MINE_Y, 4);
      m.box('sheet', x, z, 6, 5, 4, 8.4, 0, false);
      gable(m, 'roof', 'sheet', x, z, 6, 5, 8.4, 1.4, 'z', 0.3, 0.12);
      for (const dx of [-1.6, 0, 1.6]) windowOn(m, 'z', 1, z + 2.5, x + dx, 5.6, 0.9, 1.2, 'sheet');
      m.loft('steel', rect(1, 1, x, z), 2.4, rect(2.6, 2.6, x, z), 3.99, false);
    });
    m.scope('Yard', () => {
      lamp(m, -MINE.w / 2 + 1.5, -1, MINE_Y, 1);
      lamp(m, -1, -MINE.d / 2 + 4, MINE_Y, -1);
      // spare mine cars on a short stub, a pile of pit props
      for (let i = 0; i < 3; i++) {
        const cx = -MINE.w / 2 + 3 + i * 2.2, cz = -4;
        m.box(bin, cx, cz, 1.6, 1, MINE_Y + 0.4, MINE_Y + 1.3, 0, false);
        m.box(load, cx, cz, 1.4, 0.8, MINE_Y + 1.1, MINE_Y + 1.38);
        for (const dx of [-0.5, 0.5]) wheelZ(m, cx + dx, MINE_Y + 0.25, cz, 0.25, 1.1);
      }
      for (let i = 0; i < 7; i++) {
        const row = i < 4 ? 0 : 1, k = row ? i - 4 : i, pz = -MINE.d / 2 + 2 + k * 0.42 + row * 0.21, py = MINE_Y + 0.2 + row * 0.36;
        m.sweep('wood', 'x', ngon(6, 0.2, 0, pz, py), -3.5, ngon(6, 0.2, 0, pz, py), 0.5);
      }
    });
    return m;
  });
}
/** The mine head's low detail: the tower and its back legs as plates, the sheaves, the house, bunker, gallery and heap. */
export function mineLod(given?: ParamValues): MeshBuilder {
  const p = resolveParams(MINE_PARAMS, given), m = model(), ore = p.type === 'iron';
  const paint: Mat = ore ? 'red' : 'frame', bin: Mat = ore ? 'rust' : 'steel';
  const { x, z } = MINE.shaft, a = 2.4, top = MINE.sheave - 1.6;
  lodBox(m, 'yard', 0, 0, MINE.w, MINE.d, 0, MINE_Y);
  for (const s of [-1, 1]) lodBox(m, paint, x + s * a, z, 0.5, 2 * a + 0.4, MINE_Y, top);
  lodBox(m, paint, x, z - 0.6, 2 * a + 1.6, 2 * a + 2.8, top, top + 0.4);
  for (const s of [-1, 1]) m.slab(paint, [[x + s * (a + 0.3), top, z - a], [x + s * (a + 0.3), top, z - a + 0.8], [x + s * (a + 0.3), MINE_Y, z - MINE.legs + 0.8], [x + s * (a + 0.3), MINE_Y, z - MINE.legs]], [-s * 0.5, 0, 0]);
  m.sweep('frame', 'x', ngon(8, 2.1, 0, z, MINE.sheave), x - 0.9, ngon(8, 2.1, 0, z, MINE.sheave), x + 0.9);
  const hz = z - MINE.house;
  lodBox(m, 'brick', x, hz, 10, 8, MINE_Y, 8);
  const s: Ring = [[x - 5.4, 7.9], [x + 5.4, 7.9], [x, 10.6]];
  m.sweep('roof', 'z', s, hz - 4.4, s, hz + 4.4);
  const { x: bx, z: bz, y0, y1 } = MINE.bunker;
  lodBox(m, bin, bx, bz, 9, 6.4, y0 - 2, y1 + 2.6);
  lodBox(m, 'frame', bx, bz, 7, 5, MINE_Y, y0 - 2);
  const xa = x + 3.6, ya = MINE_Y + 4.5, xb = bx - 3.6, yb = y1 + 0.8, cz = z + 1.5;
  m.slab('sheet', [[xa, ya, cz - 1.1], [xb, yb, cz - 1.1], [xb, yb + 2, cz - 1.1], [xa, ya + 2, cz - 1.1]], [0, 0, 2.2]);
  lodBox(m, 'sheet', x + 6.5, z - 6, 6, 5, MINE_Y, 8.4);
  lodLoft(m, ore ? 'oreSpoil' : 'coalSpoil', ngon(7, 8, 0, 13, -7.5), MINE_Y, ngon(7, 2, 0, 13, -7.5), MINE_Y + 9);
  return m;
}

// ---------------------------------------------------------------- logging camp

export const CAMP = { w: 44, d: 32 };
const CAMP_Y = 0.15;

/** The log decks: centre x and z, log length, logs per row from the bottom, radius, seed. */
const DECKS: [number, number, number, number[], number, number][] = [
  [-12.5, -6.5, 8, [8, 7, 6, 5, 3], 0.34, 1],
  [-1, -7, 8, [9, 8, 7, 5, 3], 0.32, 2],
  [10, -7.5, 6, [7, 6, 5, 4], 0.38, 3],
  [-14, 5, 6, [5, 4, 3], 0.3, 4],
];
/** One log along x from x0 to x1 about (z, y): bark round, sawn ends. */
function log(m: MeshBuilder, x0: number, x1: number, z: number, y: number, r: number): void {
  const ring = ngon(6, r, Math.PI / 6, z, y);
  m.sweep('bark', 'x', ring, x0 + 0.04, ring, x1 - 0.04, false);
  m.sweep('logEnd', 'x', ring, x0, ring, x0 + 0.04);
  m.sweep('logEnd', 'x', ring, x1 - 0.04, ring, x1);
}
/** A log deck: rows of logs along x on two bearers, each row narrower, about (x, z); `rows` from the bottom. */
function logDeck(m: MeshBuilder, x: number, z: number, len: number, rows: number[], r: number, seed: number): void {
  for (const dx of [-len / 3, len / 3]) m.box('timber', x + dx, z, 0.35, rows[0]! * 2 * r + 0.6, CAMP_Y, CAMP_Y + 0.3);
  const step = r * 1.74;
  rows.forEach((n, row) => {
    const y = CAMP_Y + 0.3 + r * 0.87 + row * step * 0.87;
    for (let i = 0; i < n; i++) {
      const zz = z + (i - (n - 1) / 2) * step, k = row * 13 + i, jog = 0.25 * wob(k, seed);
      log(m, x - len / 2 + jog, x + len / 2 + jog * 0.6, zz, y, r * (0.92 + 0.08 * wob(k + 5, seed)));
    }
  });
}
function cabin(m: MeshBuilder, x: number, z: number): void {
  const w = 7, d = 5.5, e = 3.2, y = CAMP_Y;
  m.scope('Cabin', () => {
    m.box('concrete', x, z, w + 0.2, d + 0.2, y, y + 0.4);
    m.box('timber', x, z, w, d, y + 0.4, e, 0, false);
    // the wall logs as courses proud of the core, crossing out at the corners
    for (let c = y + 0.6; c < e - 0.1; c += 0.42) {
      m.sweep('bark', 'x', ngon(6, 0.2, Math.PI / 6, z + d / 2 - 0.05, c), x - w / 2 - 0.35, ngon(6, 0.2, Math.PI / 6, z + d / 2 - 0.05, c), x + w / 2 + 0.35, true);
      m.sweep('bark', 'x', ngon(6, 0.2, Math.PI / 6, z - d / 2 + 0.05, c), x - w / 2 - 0.35, ngon(6, 0.2, Math.PI / 6, z - d / 2 + 0.05, c), x + w / 2 + 0.35, true);
      for (const s of [-1, 1]) m.sweep('bark', 'z', ngon(6, 0.2, 0, x + s * (w / 2 - 0.05), c + 0.21), z - d / 2 - 0.35, ngon(6, 0.2, 0, x + s * (w / 2 - 0.05), c + 0.21), z + d / 2 + 0.35, true);
    }
    gable(m, 'roof', 'timber', x, z, w, d, e, 2.2, 'x', 0.6);
    // the stone chimney on the west end, a door and windows facing the yard (+z), a porch
    m.box('concrete', x - w / 2 - 0.55, z, 1, 1.3, y, e + 3);
    const fz = z + d / 2 + 0.2;
    m.box('wood', x + 1.4, fz + 0.03, 1, 0.06, y + 0.4, y + 2.4);
    for (const u of [-1.6]) windowOn(m, 'z', 1, fz, x + u, y + 1.3, 1, 1, 'wood');
    windowOn(m, 'x', 1, x + w / 2 + 0.2, z, y + 1.3, 0.9, 0.9, 'wood');
    m.box('wood', x, fz + 1, w, 2, y, y + 0.3);
    for (const dx of [-w / 2 + 0.2, 0, w / 2 - 0.2]) m.box('timber', x + dx, fz + 1.85, 0.18, 0.18, y + 0.3, e - 0.3);
    lean(m, 'roof', x - w / 2 - 0.2, x + w / 2 + 0.2, fz - 0.15, e - 0.1, fz + 2.3, e - 0.75, 0.12);
  });
}
function sawShed(m: MeshBuilder, x: number, z: number): void {
  const w = 6, d = 4, y = CAMP_Y;
  m.scope('Saw shed', () => {
    m.box('wood', x, z, w, d, y, y + 0.15);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box('timber', x + sx * (w / 2 - 0.15), z + sz * (d / 2 - 0.15), 0.2, 0.2, y + 0.15, y + (sz < 0 ? 3.2 : 2.6));
    m.box('board', x, z - d / 2 + 0.1, w - 0.4, 0.08, y + 0.15, y + 3.1);
    lean(m, 'sheet', x - w / 2 - 0.3, x + w / 2 + 0.3, z - d / 2 - 0.3, y + 3.35, z + d / 2 + 0.4, y + 2.7);
    // two sawhorses with a log across them, the chopping block and its axe, split firewood
    for (const dx of [-1.1, 1.1]) for (const s of [-1, 1]) {
      m.rod('wood', [x + dx, y + 0.15, z - 0.45 * s], [x + dx, y + 1.05, z + 0.45 * s], 0.05, 4);
    }
    log(m, x - 1.8, x + 1.8, z, y + 0.98, 0.22);
    cyl(m, 'logEnd', x + 2, z + 1.2, 0.35, y + 0.15, y + 0.7, 8);
    m.rod('wood', [x + 2, y + 0.7, z + 1.2], [x + 2.4, y + 1.3, z + 1.4], 0.03, 4);
    for (let i = 0; i < 6; i++) m.box('logEnd', x - 2.2 + i * 0.36, z - d / 2 + 0.45, 0.3, 0.5, y + 0.15, y + 0.5 + (i % 3) * 0.3);
  });
}
function loader(m: MeshBuilder, x: number, z: number): void {
  m.scope('Log loader', () => {
    const y = CAMP_Y;
    // pedestal on its footing, the slewing deck, the operator's cab
    m.box('concrete', x, z, 3, 3, y, y + 0.5);
    cyl(m, 'yellow', x, z, 0.7, y + 0.5, y + 3.2, 12);
    cyl(m, 'frame', x, z, 1.3, y + 3.2, y + 3.6, 12);
    m.box('yellow', x - 0.4, z - 0.9, 1.6, 1.4, y + 3.6, y + 4.3);
    m.box('frame', x + 0.5, z - 0.9, 0.1, 1.3, y + 4.3, y + 6.1);
    m.box('glass', x - 0.2, z - 0.9, 1.25, 1.25, y + 4.3, y + 6, 0, false);
    m.box('yellow', x - 0.2, z - 0.9, 1.4, 1.4, y + 6, y + 6.15);
    m.box('frame', x - 1.3, z + 0.4, 1.4, 1.4, y + 3.6, y + 4.5);
    // the main boom up and out toward the truck bay (+z), the knuckle, the stick down to the grapple
    const knuckle: V3 = [x + 0.4, y + 10, z + 5.5], tip: V3 = [x + 0.4, y + 6.2, z + 9.5];
    const beam = (a: V3, b: V3, w: number): void => {
      const len = Math.hypot(b[1] - a[1], b[2] - a[2]), ny = -(b[2] - a[2]) / len * w / 2, nz = (b[1] - a[1]) / len * w / 2;
      m.slab('yellow', [[a[0] - 0.25, a[1] - ny, a[2] - nz], [a[0] - 0.25, b[1] - ny, b[2] - nz], [a[0] - 0.25, b[1] + ny, b[2] + nz], [a[0] - 0.25, a[1] + ny, a[2] + nz]], [0.5, 0, 0]);
    };
    beam([x + 0.4, y + 3.9, z + 0.3], knuckle, 0.7);
    beam(knuckle, tip, 0.5);
    m.rod('dark', [x + 0.4, y + 4.4, z + 1], [x + 0.4, y + 7.7, z + 3.6], 0.14, 8);
    m.rod('dark', [x + 0.4, y + 9.8, z + 4.7], [x + 0.4, y + 9, z + 7.2], 0.11, 8);
    // the rotator and the two tongs of the grapple round a log
    m.rod('frame', [tip[0], tip[1], tip[2]], [tip[0], tip[1] - 0.8, tip[2]], 0.15, 8);
    m.box('frame', tip[0], tip[2], 0.6, 0.4, tip[1] - 1.1, tip[1] - 0.8);
    for (const s of [-1, 1]) {
      m.slab('frame', [[tip[0] - 0.3, tip[1] - 1, tip[2] + s * 0.15], [tip[0] - 0.3, tip[1] - 1.9, tip[2] + s * 0.85], [tip[0] - 0.3, tip[1] - 2.6, tip[2] + s * 0.45], [tip[0] - 0.3, tip[1] - 2.3, tip[2] + s * 0.3]], [0.6, 0, 0]);
    }
    log(m, tip[0] - 3, tip[0] + 3, tip[2], tip[1] - 2.3, 0.3);
  });
}
function logTruck(m: MeshBuilder, x: number, z: number): void {
  m.scope('Log truck', () => {
    const y = CAMP_Y, cab = x + 6;
    // chassis, cab and hood, stakes, a load of logs, the wheels
    m.box('frame', x, z, 13, 0.9, y + 0.9, y + 1.3);
    m.box('red', cab + 0.8, z, 1.8, 2.4, y + 1.3, y + 2.3);
    m.box('red', cab - 0.5, z, 1.6, 2.5, y + 1.3, y + 3.5);
    m.box('glass', cab + 0.32, z, 0.08, 2.2, y + 2.5, y + 3.3);
    for (const s of [-1, 1]) m.box('glass', cab - 0.5, z + s * 1.27, 1, 0.06, y + 2.5, y + 3.3);
    m.box('red', cab - 0.5, z, 1.7, 2.6, y + 3.5, y + 3.6);
    cyl(m, 'frame', cab - 1.45, z + 0.9, 0.09, y + 1.3, y + 4.2, 6);
    m.box('dark', cab + 1.72, z, 0.06, 2, y + 1.4, y + 2.1);
    for (const bx of [x - 4.5, x - 1, x + 2.5]) {
      m.box('frame', bx, z, 0.25, 2.5, y + 1.3, y + 1.5);
      for (const s of [-1, 1]) m.box('frame', bx, z + s * 1.2, 0.14, 0.14, y + 1.5, y + 3.6);
    }
    const rows = [5, 4, 3], r = 0.27;
    rows.forEach((n, row) => {
      for (let i = 0; i < n; i++) log(m, x - 5.6, x + 3.4, z + (i - (n - 1) / 2) * r * 1.74, y + 1.5 + r * 0.87 + row * r * 1.51, r);
    });
    for (const wx of [cab + 0.6, x - 1.8, x - 3.2]) for (const s of [-1, 1]) wheelZ(m, wx, y + 0.55, z + s * 1.05, 0.55, 0.4);
  });
}
/** A spruce at the edge of the camp: a trunk and three tiers. */
function spruce(m: MeshBuilder, x: number, z: number, h: number): void {
  cyl(m, 'bark', x, z, 0.2, 0, h * 0.25, 6);
  for (const [y0, y1, r] of [[0.18, 0.55, 0.18], [0.42, 0.8, 0.13], [0.66, 1, 0.08]] as const) {
    m.spire('needle', ngon(8, h * r, 0.2, x, z), h * y0, h * y1);
    m.cap('needle', ngon(8, h * r, 0.2, x, z), h * y0, false);
  }
}

/** The logging camp at full detail. */
export function loggingCamp(_given?: ParamValues): MeshBuilder {
  const m = model(), { w, d } = CAMP;
  return m.scope('Logging camp', () => {
    m.scope('Ground', () => {
      m.box('dirt', 0, 0, w, d, 0, CAMP_Y);
      // the truck bay's gravel along the front
      m.box('yard', 2, d / 2 - 4.5, w - 8, 7, CAMP_Y, CAMP_Y + 0.05);
    });
    m.scope('Log decks', () => {
      for (const [x, z, len, rows, r, seed] of DECKS) logDeck(m, x, z, len, rows, r, seed);
    });
    loader(m, 2.5, 2);
    logTruck(m, 2, d / 2 - 4.5 + 0.2);
    cabin(m, w / 2 - 6, 3.5);
    sawShed(m, w / 2 - 5, -10);
    m.scope('Yard', () => {
      lamp(m, -w / 2 + 2.5, d / 2 - 1.5, CAMP_Y, 1);
      // the fuel tank on its cradle, a slash pile of bark and offcuts
      const tx = -w / 2 + 4, tz = d / 2 - 9;
      for (const dx of [-0.9, 0.9]) m.box('steel', tx + dx, tz, 0.15, 1, CAMP_Y, CAMP_Y + 1);
      m.sweep('red', 'x', ngon(12, 0.65, 0, tz, CAMP_Y + 1.6), tx - 1.4, ngon(12, 0.65, 0, tz, CAMP_Y + 1.6), tx + 1.4);
      const ring = (r: number, k: number): Ring => Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2, j = 1 + 0.15 * wob(i + k * 5, 3); return [9 + Math.cos(a) * r * j * 1.4, 6 - Math.sin(a) * r * j]; });
      m.loft('timber', ring(2.4, 0), CAMP_Y, ring(1.3, 1), CAMP_Y + 1, false);
      m.loft('timber', ring(1.3, 1), CAMP_Y + 1, ring(0.3, 2), CAMP_Y + 1.5);
    });
    m.scope('Forest edge', () => {
      const trees: [number, number, number][] = [[-19.5, -13.5, 13], [-15, -13.6, 11], [-10.5, -13.4, 14], [-5.8, -13.8, 12], [-19.6, -8.6, 12], [20, -4, 11]];
      for (const [tx, tz, h] of trees) spruce(m, tx, tz, h);
    });
    return m;
  });
}
/** The logging camp's low detail: the decks as blocks with their sawn faces, the loader, cabin, shed, truck and the forest edge. */
export function loggingCampLod(_given?: ParamValues): MeshBuilder {
  const m = model(), { w, d } = CAMP;
  lodBox(m, 'dirt', 0, 0, w, d, 0, CAMP_Y);
  for (const [x, z, len, rows, r] of DECKS) {
    const half = rows[0]! * r * 0.87, top = CAMP_Y + 0.3 + rows.length * r * 1.51 + 0.4 * r;
    const s: Ring = [[z - half, CAMP_Y], [z + half, CAMP_Y], [z + half * 0.4, top], [z - half * 0.4, top]];
    m.sweep('bark', 'x', s, x - len / 2, s, x + len / 2);
  }
  lodBox(m, 'yellow', 2.5, 2, 1.4, 1.4, CAMP_Y, CAMP_Y + 4.3);
  m.slab('yellow', [[2.65, CAMP_Y + 3.9, 2.2], [2.65, CAMP_Y + 10.3, 7.5], [2.65, CAMP_Y + 6.2, 11.5], [2.65, CAMP_Y + 5.4, 11.5]], [0.5, 0, 0]);
  lodBox(m, 'red', 8.5, d / 2 - 4.3, 2.5, 2.5, CAMP_Y, CAMP_Y + 3.6);
  lodBox(m, 'bark', 1, d / 2 - 4.3, 9, 2.4, CAMP_Y + 0.9, CAMP_Y + 3.2);
  lodBox(m, 'timber', w / 2 - 6, 3.5, 7, 5.5, CAMP_Y, 3.2);
  const s: Ring = [[3.5 - 3.3, 3.1], [3.5 + 3.3, 3.1], [3.5, 5.4]];
  m.sweep('roof', 'x', s, w / 2 - 9.9, s, w / 2 - 2.1);
  lodBox(m, 'sheet', w / 2 - 5, -10, 6, 4, CAMP_Y, CAMP_Y + 3.2);
  for (const [tx, tz, h] of [[-19.5, -13.5, 13], [-10.5, -13.4, 14], [20, -4, 11]] as const) m.spire('needle', ngon(5, h * 0.18, 0, tx, tz), 0, h);
  return m;
}

/** industry.ts's INDUSTRY_CATALOG, restated so this bundle does not import that module. */
const CATALOG: CatalogFields = { category: 'Industry', group: 'industry', defaultScale: 1, license: 'CC0', author: 'Rail Island', source: 'Rail Island procedural industry' };
/**
 * The primary industries of the supply chain (docs/models/industry.md, "Primary industries"),
 * drafts until confirmed: sites of several buildings, so their low detail has the process
 * plants' 500 triangles.
 */
export const PRIMARY_INDUSTRY: readonly ProceduralDesign[] = [
  { id: 'industry-farm', title: 'Arable farm', build: farm, buildLod: farmLod, lodTriangles: 500, params: FARM_PARAMS, references: 'industry-farm', catalog: CATALOG },
  { id: 'industry-mine', title: 'Mine head', build: mine, buildLod: mineLod, lodTriangles: 500, params: MINE_PARAMS, references: 'industry-mine', catalog: CATALOG },
  { id: 'industry-logging-camp', title: 'Logging camp', build: loggingCamp, buildLod: loggingCampLod, lodTriangles: 500, references: 'industry-logging-camp', catalog: CATALOG },
];
