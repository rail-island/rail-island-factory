// The primary industries of the supply chain (docs/models/industry.md, "Farm",
// "Mine" and "Logging camp"): the sites that make the raw commodities grain, coal,
// iron ore and wood from nothing. An arable farm, a mine head over a shaft with its
// loadout over a siding, and a logging camp with its sawmill and log decks. Real-size
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
  shingle: { color: '#6b5544', roughness: 0.95 },
  weathered: { color: '#8a7e6e', roughness: 0.95 },
  plank: { color: '#d6b98a', roughness: 0.85 },
  sawdust: { color: '#c7a676', roughness: 1 },
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

/**
 * The farm's plan for a size: the fenced farmstead alone. Its fields are not part of
 * the model: the game lays them out freely on the map around it.
 */
export function farmPlan(size: string): { w: number; d: number } {
  return size === 'large' ? { w: 38, d: 38 } : { w: 30, d: 30 };
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

/** The barn's centre: its west gable a little inside the west fence. */
const farmBarnX = (w: number, large: boolean): number => -w / 2 + 1.2 + (large ? 20 : 14) / 2;

/** The arable farm at full detail. */
export function farm(given?: ParamValues): MeshBuilder {
  const p = resolveParams(FARM_PARAMS, given), m = model(), large = p.size === 'large', { w, d } = farmPlan(p.size);
  const x0 = -w / 2; // the yard's west edge
  return m.scope('Arable farm', () => {
    m.scope('Ground', () => {
      m.box('yard', 0, 0, w, d, 0, FARM_Y);
      // the farmhouse's front garden
      m.box('grass', w / 2 - 6.5, d / 2 - 1.1, 10, 1.2, FARM_Y, FARM_Y + 0.05);
    });
    m.scope('Fence', () => {
      fence(m, x0 + 0.3, -d / 2 + 0.3, x0 + 0.3, d / 2 - 0.3);
      fence(m, x0 + 0.3, -d / 2 + 0.3, w / 2 - 0.3, -d / 2 + 0.3);
      fence(m, w / 2 - 0.3, -d / 2 + 0.3, w / 2 - 0.3, d / 2 - 0.3);
      // the front fence leaves the gateway open
      fence(m, x0 + 0.3, d / 2 - 0.3, x0 + 6, d / 2 - 0.3);
      fence(m, x0 + 12, d / 2 - 0.3, w / 2 - 0.3, d / 2 - 0.3);
      for (const gx of [x0 + 6.3, x0 + 11.7]) m.box('timber', gx, d / 2 - 0.3, 0.3, 0.3, FARM_Y, FARM_Y + 1.7);
    });
    farmhouse(m, w / 2 - 6.5, d / 2 - 7.5);
    barn(m, farmBarnX(w, large), -d / 2 + 7.5, large ? 20 : 14);
    machineryShed(m, w / 2 - 7.5, -d / 2 + 5, large ? 11 : 9);
    m.scope('Grain bins', () => {
      const bx = x0 + 4.5, r = large ? 3.2 : 2.8, h = large ? 7 : 6;
      const spots: [number, number][] = large ? [[bx, 2], [bx + 7.4, 2], [bx, 9.2], [bx + 7.4, 9.2]] : [[bx, 3], [bx + 6.6, 3]];
      for (const [x, z] of spots) bin(m, x, z, r, h);
      const ex = large ? bx + 3.7 : bx + 3.3, ez = large ? 5.6 : 7.2;
      elevator(m, ex, ez, h + r * 0.55 + 4, spots.map(([x, z]) => [x, z, FARM_Y + h + r * 0.55]));
    });
    m.scope('Yard', () => {
      haystack(m, large ? x0 + 18 : x0 + 3, large ? 10 : 9, large ? 8 : 6);
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
/** The farm's low detail: the yard, buildings as blocks with their roofs, bins as hexagonal drums. */
export function farmLod(given?: ParamValues): MeshBuilder {
  const p = resolveParams(FARM_PARAMS, given), m = model(), large = p.size === 'large', { w, d } = farmPlan(p.size), x0 = -w / 2;
  lodBox(m, 'yard', 0, 0, w, d, 0, FARM_Y);
  const block = (wall: Mat, roofMat: Mat, x: number, z: number, bw: number, bd: number, e: number, rise: number): void => {
    lodBox(m, wall, x, z, bw, bd, FARM_Y, e);
    const s: Ring = [[z - bd / 2 - 0.3, e - 0.1], [z + bd / 2 + 0.3, e - 0.1], [z, e + rise]];
    m.sweep(roofMat, 'x', s, x - bw / 2 - 0.3, s, x + bw / 2 + 0.3);
  };
  block('render', 'tile', w / 2 - 6.5, d / 2 - 7.5, 9, 7.5, 5.8, 3.4);
  block('barn', 'roof', farmBarnX(w, large), -d / 2 + 7.5, large ? 20 : 14, 11, 5.2, 4.4);
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
    // the guides of the two cages, one under each sheave (the cages themselves are parts: windingGear)
    for (const dx of [-SHEAVE_DX, SHEAVE_DX]) for (const dz of [-1.15, 1.15]) m.box('timber', x + dx, z + dz, 0.2, 0.2, MINE_Y + 1.25, top - 1);
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
    // the sheaves' bearing pedestals (the wheels turn: windingGear), each rope back to
    // the drum in the winding house, and the second cage's rope down into the shaft
    for (const dx of [-SHEAVE_DX, SHEAVE_DX]) {
      const cx = x + dx, cy = MINE.sheave, sz = z - SHEAVE_R;
      for (const s of [-1, 1]) m.box(paint, cx + s * 0.42, sz, 0.3, 1.2, top + 0.4, cy - 0.2);
      m.rod('dark', [cx, cy + SHEAVE_R * 0.8, sz - SHEAVE_R * 0.6], [cx, MINE_Y + 9.1, z - MINE.house + 4], 0.04, 4);
    }
    m.rod('dark', [x + SHEAVE_DX, MINE.sheave, z], [x + SHEAVE_DX, MINE_Y + 1.25, z], 0.04, 4);
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
    // the roof ventilator, and the boiler's chimney beside the house, smoking
    m.box('roof', x, z, 1.3, 2.4, e + 2.4, e + 3.1);
    const sx = x + w / 2 + 1.6, sz = z - d / 2 + 1.2;
    m.box('concrete', sx, sz, 2.2, 2.2, MINE_Y, MINE_Y + 1);
    m.loft('brick', rect(1.7, 1.7, sx, sz), MINE_Y + 1, rect(1.1, 1.1, sx, sz), 18, false);
    m.box('dark', sx, sz, 1.35, 1.35, 18, 18.6);
    m.emit('smoke', [sx, 18.6, sz], 0.5);
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

/** The headframe's two sheaves: their radius and their offset either side of the shaft (x). */
const SHEAVE_R = 2.1, SHEAVE_DX = 0.75;
/** The cage at bank: its floor, and the top of its bridle where the rope is made fast. */
const CAGE_FLOOR = MINE_Y + 1.27, CAGE_TOP = MINE_Y + 4.65;
/** The mine head's clip: the winder runs a cage down the shaft and back up. */
export const WINDING_CLIP = 'winding';
/** Seconds of one winding cycle and between its samples. */
export const WINDING_CYCLE = 40;
const WINDING_STEP = 0.25;
/** Metres of rope a wind runs, and how far the cage at bank is seen to sink: past that it is in the shaft. */
export const WIND_DEPTH = 90, CAGE_SINK = 4.6;

/**
 * The rope run (metres from bank) at time `t` of the winding cycle: the cage waits at
 * bank, winds down (easing in and out), waits at the bottom, winds back up and waits again.
 */
export function windingRun(t: number): number {
  const ease = (u: number): number => u - Math.sin(2 * Math.PI * u) / (2 * Math.PI);
  if (t <= 6) return 0;
  if (t < 18) return WIND_DEPTH * ease((t - 6) / 12);
  if (t <= 24) return WIND_DEPTH;
  if (t < 36) return WIND_DEPTH * (1 - ease((t - 24) / 12));
  return 0;
}

/**
 * The winder's moving parts and their clip: the two sheave wheels, which turn the
 * rope's run over their radius (the second against the first: its cage rises as the
 * first sinks), the cage at bank sinking into the shaft, and its rope lengthening.
 */
function windingGear(m: MeshBuilder): void {
  const { x, z } = MINE.shaft, cy = MINE.sheave, sz = z - SHEAVE_R;
  for (const [name, dx, turn] of [['sheave-a', -SHEAVE_DX, 0], ['sheave-b', SHEAVE_DX, 0.2]] as const) {
    m.part(name, [x + dx, cy, sz], () => {
      const cx = x + dx, r = SHEAVE_R;
      m.tube('frame', 'x', sz, cy, r, r - 0.22, cx - 0.12, cx + 0.12, 24);
      m.sweep('frame', 'x', ngon(10, 0.32, 0, sz, cy), cx - 0.25, ngon(10, 0.32, 0, sz, cy), cx + 0.25);
      for (let k = 0; k < 8; k++) {
        const t = k * Math.PI / 4 + turn;
        m.rod(k % 2 ? 'frame' : 'yellow', [cx, cy + 0.3 * Math.sin(t), sz + 0.3 * Math.cos(t)], [cx, cy + (r - 0.2) * Math.sin(t), sz + (r - 0.2) * Math.cos(t)], 0.05, 4);
      }
    });
  }
  const cx = x - SHEAVE_DX;
  m.part('cage', [cx, CAGE_FLOOR, z], () => {
    // a deck, corner posts and sheeted ends, a middle deck, gate bars, a roof, the bridle chains up to the cappel
    m.box('steel', cx, z, 1.3, 2, CAGE_FLOOR, CAGE_FLOOR + 0.12);
    for (const sx of [-1, 1]) for (const sz2 of [-1, 1]) m.box('yellow', cx + sx * 0.6, z + sz2 * 0.94, 0.1, 0.12, CAGE_FLOOR + 0.12, CAGE_FLOOR + 3.05);
    for (const sx of [-1, 1]) m.box('galv', cx + sx * 0.6, z, 0.06, 1.76, CAGE_FLOOR + 0.12, CAGE_FLOOR + 3.05);
    m.box('steel', cx, z, 1.08, 1.76, CAGE_FLOOR + 1.5, CAGE_FLOOR + 1.62);
    for (const dz of [-1, 1]) for (const yy of [0.6, 2.1]) m.box('yellow', cx, z + dz * 0.97, 1.1, 0.04, CAGE_FLOOR + yy, CAGE_FLOOR + yy + 0.1);
    m.box('yellow', cx, z, 1.4, 2.1, CAGE_FLOOR + 3.05, CAGE_FLOOR + 3.2);
    for (const dz of [-0.7, 0.7]) m.rod('dark', [cx, CAGE_FLOOR + 3.2, z + dz], [cx, CAGE_TOP - 0.1, z], 0.03, 4);
    m.box('frame', cx, z, 0.25, 0.25, CAGE_TOP - 0.15, CAGE_TOP);
  });
  const ropeTop: V3 = [cx, cy, z];
  m.part('rope', ropeTop, () => { m.rod('dark', ropeTop, [cx, CAGE_TOP, z], 0.04, 4); });

  const times: number[] = [];
  for (let k = 0; k * WINDING_STEP <= WINDING_CYCLE + 1e-9; k++) times.push(k * WINDING_STEP);
  const quatX = (a: number): number[] => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];
  const run = times.map(windingRun), sink = run.map(s => Math.min(s, CAGE_SINK)), rest = cy - CAGE_TOP;
  m.animate({
    name: WINDING_CLIP, times, drive: { drive: 'time' },
    tracks: [
      // a positive turn about +x carries the wheel's front (+z), where the rope hangs, down
      { node: 'sheave-a', path: 'rotation', values: run.flatMap(s => quatX(s / SHEAVE_R)) },
      { node: 'sheave-b', path: 'rotation', values: run.flatMap(s => quatX(-s / SHEAVE_R)) },
      { node: 'cage', path: 'translation', values: sink.flatMap(k => [cx, CAGE_FLOOR - k, z]) },
      { node: 'rope', path: 'scale', values: sink.flatMap(k => [1, (rest + k) / rest, 1]) },
    ],
  });
}

/** The mine head at full detail: coal or iron ore. */
export function mine(given?: ParamValues): MeshBuilder {
  const p = resolveParams(MINE_PARAMS, given), m = model(), ore = p.type === 'iron';
  const paint: Mat = ore ? 'red' : 'frame', bin: Mat = ore ? 'rust' : 'steel', load: Mat = ore ? 'ore' : 'coal', spoil: Mat = ore ? 'oreSpoil' : 'coalSpoil';
  m.part('site', [0, 0, 0], () => {
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
  });
  windingGear(m);
  return m;
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
  m.sweep('frame', 'x', ngon(8, SHEAVE_R, 0, z - SHEAVE_R, MINE.sheave), x - 0.9, ngon(8, SHEAVE_R, 0, z - SHEAVE_R, MINE.sheave), x + 0.9);
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

/** The log decks behind the mill: centre x and z, log length, logs per row from the bottom, radius, seed. */
const DECKS: [number, number, number, number[], number, number][] = [
  [-16, -10.5, 8, [8, 7, 6, 5, 3], 0.34, 1],
  [-6, -11, 8, [9, 8, 7, 5, 3], 0.32, 2],
  [3, -12, 6, [7, 6, 5, 4], 0.38, 3],
];
/** The sawmill: its plan along x, the floor raised on piles, the eaves, and the wigwam burner. */
export const SAWMILL = { x: 1, z: -1, w: 18, d: 8, floor: 1.8, eaves: 6.8 };
export const BURNER = { x: 15, z: -10, r0: 4.2, r1: 2.4, h: 10 };

/** One log along x from x0 to x1 about (z, y): a round of bark closed by its pale sawn ends. */
function log(m: MeshBuilder, x0: number, x1: number, z: number, y: number, r: number): void {
  const ring = ngon(6, r, Math.PI / 6, z, y);
  m.sweep('bark', 'x', ring, x0, ring, x1, false);
  for (const [x, dir] of [[x0, -1], [x1, 1]] as const) {
    const pts: V3[] = [];
    for (let i = 1; i + 1 < ring.length; i++) pts.push([x, ring[0]![1], ring[0]![0]], [x, ring[i]![1], ring[i]![0]], [x, ring[i + 1]![1], ring[i + 1]![0]]);
    m.facets('logEnd', pts, [dir, 0, 0]);
  }
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
/** A door: a plank leaf a little proud of a wall facing `dir`, its frame round it. */
function doorOn(m: MeshBuilder, face: 'x' | 'z', dir: 1 | -1, at: number, u: number, y0: number, w: number, h: number, leaf: Mat = 'board'): void {
  const box = (mat: Mat, dw: number, in0: number, dd: number, a: number, b: number): void => {
    const c = at + dir * (in0 + dd / 2);
    if (face === 'z') m.box(mat, u, c, dw, dd, a, b); else m.box(mat, c, u, dd, dw, a, b);
  };
  box('timber', w + 0.3, 0, 0.08, y0, y0 + h + 0.15);
  box(leaf, w, 0.02, 0.08, y0, y0 + h);
}

/**
 * A log building on a plan w x d about (x, z): the wall logs as courses proud of the
 * core, crossing out at the corners, a gabled roof along x, and a porch roofed down
 * from the eaves on the side `porch` (+1: +z, -1: -z).
 */
function logBuilding(m: MeshBuilder, x: number, z: number, w: number, d: number, e: number, porch: 1 | -1): void {
  const y = CAMP_Y;
  m.box('concrete', x, z, w + 0.4, d + 0.4, y, y + 0.4);
  m.box('timber', x, z, w, d, y + 0.4, e, 0, false);
  for (let c = y + 0.6; c < e - 0.1; c += 0.42) {
    for (const s of [-1, 1]) {
      const ring = ngon(6, 0.2, Math.PI / 6, z + s * (d / 2 - 0.05), c);
      m.sweep('bark', 'x', ring, x - w / 2 - 0.35, ring, x + w / 2 + 0.35, true);
    }
    for (const s of [-1, 1]) {
      const ring = ngon(6, 0.2, 0, x + s * (w / 2 - 0.05), c + 0.21);
      m.sweep('bark', 'z', ring, z - d / 2 - 0.35, ring, z + d / 2 + 0.35, true);
    }
  }
  gable(m, 'shingle', 'timber', x, z, w, d, e, 2.4, 'x', 0.6);
  // the porch: a plank floor on its sill, posts, a roof sheet down from under the eaves
  const fz = z + porch * (d / 2 + 0.2), pz = fz + porch * 1.12;
  m.box('wood', x, pz, w, 2.2, y, y + 0.3);
  for (let u = -w / 2 + 0.2; u <= w / 2 - 0.19; u += (w - 0.4) / 4) m.box('timber', x + u, fz + porch * 1.95, 0.18, 0.18, y + 0.3, e - 0.55);
  for (let u = -w / 2 + 0.2; u < w / 2 - 0.3; u += (w - 0.4) / 4) m.box('wood', x + u + (w - 0.4) / 8, fz + porch * 1.95, (w - 0.4) / 4 - 0.2, 0.06, y + 1.1, y + 1.2);
  const ePorch = e - 0.75;
  if (porch > 0) lean(m, 'shingle', x - w / 2 - 0.2, x + w / 2 + 0.2, fz - 0.15, e - 0.1, fz + 2.3, ePorch, 0.12);
  else lean(m, 'shingle', x - w / 2 - 0.2, x + w / 2 + 0.2, fz - 2.3, ePorch, fz + 0.15, e - 0.1, 0.12);
}

/** The bunkhouse: a long log house with a porch on the lane, two stovepipes, a bench and a wash stand. */
function bunkhouse(m: MeshBuilder, x: number, z: number): void {
  const w = 12, d = 5.5, e = 3.4, y = CAMP_Y;
  m.scope('Bunkhouse', () => {
    logBuilding(m, x, z, w, d, e, -1);
    const fz = z - d / 2 - 0.2;
    for (const u of [-3.6, 3.6]) doorOn(m, 'z', -1, fz, x + u, y + 0.4, 1, 2.1);
    for (const u of [-5, -1.8, 0, 1.8, 5]) windowOn(m, 'z', -1, fz, x + u, y + 1.35, 0.8, 0.9, 'wood');
    for (const u of [-3.5, 0, 3.5]) windowOn(m, 'z', 1, z + d / 2 + 0.2, x + u, y + 1.35, 0.8, 0.9, 'wood');
    windowOn(m, 'x', 1, x + w / 2 + 0.2, z, y + 1.35, 0.8, 0.9, 'wood');
    // the stovepipes through the back slope, each with its rain cap
    for (const u of [-3, 3]) {
      cyl(m, 'dark', x + u, z + 1.2, 0.14, e + 1.2, e + 3.1, 8);
      m.spire('dark', ngon(8, 0.3, 0, x + u, z + 1.2), e + 3.2, e + 3.5);
      m.cap('dark', ngon(8, 0.3, 0, x + u, z + 1.2), e + 3.2, false);
    }
    // a bench under the porch and the wash stand with its basin, the boot rack
    m.box('wood', x - 1.2, fz - 0.45, 2.2, 0.4, y + 0.7, y + 0.78);
    for (const dx of [-0.9, 0.9]) m.box('timber', x - 1.2 + dx, fz - 0.45, 0.1, 0.35, y + 0.3, y + 0.7);
    m.box('wood', x + 1.6, fz - 0.4, 0.9, 0.5, y + 0.3, y + 1.05);
    cyl(m, 'galv', x + 1.6, fz - 0.4, 0.22, y + 1.05, y + 1.2, 10);
  });
}

/** The cookhouse: board and batten, its gable to the lane, a covered entry, a stone chimney and the dinner bell. */
function cookhouse(m: MeshBuilder, x: number, z: number): void {
  const w = 7, d = 8, e = 3.6, y = CAMP_Y, wins = [-2.4, 0, 2.2];
  m.scope('Cookhouse', () => {
    m.box('concrete', x, z, w + 0.3, d + 0.3, y, y + 0.5);
    m.box('wood', x, z, w, d, y + 0.5, e, 0, false);
    gable(m, 'shingle', 'wood', x, z, w, d, e, 2.6, 'z', 0.5);
    for (const s of [-1, 1]) {
      for (let u = -d / 2 + 0.5; u < d / 2 - 0.2; u += 0.9) if (!wins.some(c => Math.abs(u - c) < 0.9)) m.box('timber', x + s * (w / 2 + 0.03), z + u, 0.06, 0.1, y + 0.5, e - 0.1);
      for (const u of wins) windowOn(m, 'x', s as 1 | -1, x + s * (w / 2 + 0.06), z + u, y + 1.4, 1, 1.1, 'timber');
    }
    // the lane gable: a door under a little gabled hood on brackets, a window over it
    const fz = z - d / 2;
    doorOn(m, 'z', -1, fz, x, y + 0.5, 1.2, 2.2);
    gable(m, 'shingle', null, x, fz - 0.75, 2, 1.5, y + 3, 0.5, 'z', 0.1, 0.1);
    for (const dx of [-0.85, 0.85]) m.rod('timber', [x + dx, y + 2.3, fz - 0.02], [x + dx, y + 2.98, fz - 1.3], 0.06, 4);
    windowOn(m, 'z', -1, fz, x, e + 0.4, 0.9, 0.9, 'timber');
    m.box('wood', x, fz - 0.7, 2.6, 1.4, y, y + 0.45);
    // the stone chimney up the west wall, the cook's stovepipe
    m.box('concrete', x - w / 2 - 0.6, z + 3.4, 1.1, 1, y, e + 3.4);
    m.box('dark', x - w / 2 - 0.6, z + 3.4, 0.7, 0.6, e + 3.4, e + 3.5);
    cyl(m, 'dark', x - 1.3, z + 1, 0.13, e + 1.2, e + 3.4, 8);
    // the dinner bell in its yoke on a post, the rope down
    const bx = x - w / 2 - 1.2, bz = fz - 0.4;
    m.box('timber', bx, bz, 0.22, 0.22, y, y + 4.2);
    m.box('timber', bx, bz, 1.1, 0.16, y + 4.2, y + 4.36);
    for (const dx of [-0.42, 0.42]) m.box('timber', bx + dx, bz, 0.12, 0.16, y + 4.36, y + 5);
    m.box('timber', bx, bz, 1, 0.16, y + 5, y + 5.12);
    m.loft('yellow', ngon(10, 0.36, 0, bx, bz), y + 4.4, ngon(10, 0.18, 0, bx, bz), y + 4.95);
    m.rod('wood', [bx + 0.3, y + 4.45, bz], [bx + 0.3, y + 1.6, bz + 0.1], 0.02, 4);
    // split firewood stacked against the east wall
    for (let i = 0; i < 7; i++) m.box(i % 2 ? 'logEnd' : 'wood', x + w / 2 + 0.8, z - 2.6 + i * 0.75, 0.7, 0.7, y, y + 1.3 + 0.12 * wob(i, 2));
  });
}

/** The camp's wooden water tank on its timber trestle, with a hooped tank, a conical roof and the fill spout. */
function waterTower(m: MeshBuilder, x: number, z: number): void {
  const y = CAMP_Y, a = 1.5, deck = y + 6, r = 2.1, th = 3.2;
  m.scope('Water tower', () => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      m.box('concrete', x + sx * a, z + sz * a, 0.8, 0.8, y, y + 0.5);
      m.rod('timber', [x + sx * (a + 0.15), y + 0.5, z + sz * (a + 0.15)], [x + sx * (a - 0.2), deck, z + sz * (a - 0.2)], 0.15, 4);
    }
    // girts and X braces on each face, the deck beams
    for (const yy of [y + 2.6, y + 4.8]) {
      for (const s of [-1, 1]) { m.box('timber', x, z + s * (a - 0.05), 2 * a - 0.1, 0.14, yy, yy + 0.18); m.box('timber', x + s * (a - 0.05), z, 0.14, 2 * a - 0.4, yy, yy + 0.18); }
    }
    for (const s of [-1, 1]) {
      m.rod('wood', [x - a, y + 0.6, z + s * (a + 0.12)], [x + a, y + 2.6, z + s * (a + 0.12)], 0.06, 4);
      m.rod('wood', [x + a, y + 0.6, z + s * (a + 0.12)], [x - a, y + 2.6, z + s * (a + 0.12)], 0.06, 4);
      m.rod('wood', [x + s * (a + 0.12), y + 2.8, z - a], [x + s * (a + 0.12), y + 4.8, z + a], 0.06, 4);
      m.rod('wood', [x + s * (a + 0.12), y + 2.8, z + a], [x + s * (a + 0.12), y + 4.8, z - a], 0.06, 4);
    }
    m.box('timber', x, z, 2 * a + 1.2, 2 * a + 1.2, deck, deck + 0.3);
    cyl(m, 'wood', x, z, r, deck + 0.3, deck + 0.3 + th, 16, false);
    for (const k of [0.25, 0.55, 0.85]) cyl(m, 'frame', x, z, r + 0.04, deck + 0.3 + th * k, deck + 0.38 + th * k, 16, false);
    m.spire('shingle', ngon(16, r + 0.3, 0, x, z), deck + 0.3 + th, deck + th + 1.9);
    m.cap('shingle', ngon(16, r + 0.3, 0, x, z), deck + 0.3 + th, false);
    // the outlet pipe and its hinged spout swung toward the lane, the ladder
    m.rod('frame', [x + 0.6, deck, z - 0.6], [x + 0.6, y + 3.4, z - 0.6], 0.12, 6);
    m.rod('frame', [x + 0.6, y + 3.4, z - 0.6], [x + 0.6, y + 2.6, z - 2.6], 0.12, 6);
    ladder(m, x - 0.6, z - r - 0.12, deck + 0.3, th);
  });
}

/** The camp office and store: a boarded shed with a false front on the lane, its sign, a boardwalk and an awning. */
function office(m: MeshBuilder, x: number, z: number): void {
  const w = 6, d = 6.5, e = 3.6, y = CAMP_Y;
  m.scope('Office', () => {
    m.box('timber', x, z, w + 0.2, d + 0.2, y, y + 0.5);
    m.box('wood', x, z, w, d, y + 0.5, e, 0, false);
    gable(m, 'roof', 'wood', x, z, w, d, e, 1.6, 'z', 0.35);
    // the false front: a tall square facade rising over the gable, its cornice and sign
    const fz = z - d / 2 - 0.15;
    m.box('wood', x, fz, w + 0.4, 0.3, y + 0.5, e + 2.45);
    m.box('timber', x, fz - 0.05, w + 0.9, 0.5, e + 2.4, e + 2.65);
    for (const s of [-1, 1]) m.box('timber', x + s * (w / 2 + 0.05), fz - 0.06, 0.36, 0.3, y + 0.5, e + 2.4);
    m.box('yellow', x, fz - 0.19, w - 1.2, 0.08, e + 0.7, e + 1.9);
    m.box('red', x, fz - 0.23, w - 1.8, 0.04, e + 1.05, e + 1.55);
    doorOn(m, 'z', -1, fz - 0.15, x, y + 0.5, 1.1, 2.2);
    for (const u of [-1.9, 1.9]) windowOn(m, 'z', -1, fz - 0.15, x + u, y + 1.2, 1.1, 1.4, 'timber');
    for (const u of [-1.5, 1.5]) windowOn(m, 'x', 1, x + w / 2, z + u, y + 1.4, 0.9, 1, 'timber');
    // the boardwalk and the awning over it on posts
    m.box('wood', x, fz - 1.15, w + 0.4, 1.7, y, y + 0.45);
    for (const s of [-1, 1]) m.box('timber', x + s * (w / 2 - 0.1), fz - 1.85, 0.16, 0.16, y + 0.45, y + 2.85);
    lean(m, 'sheet', x - w / 2 - 0.2, x + w / 2 + 0.2, fz - 2.15, y + 2.8, fz - 0.15, y + 3.2, 0.1);
  });
}

/**
 * The sawmill: a boarded mill on timber piles with a clerestory monitor along its
 * ridge, the jackladder hauling logs up into its west end, the brick boiler house and
 * its guyed stack behind it, the sorting deck out of its east end and the sawdust
 * conveyor up to the wigwam burner.
 */
function sawmill(m: MeshBuilder): void {
  const { x, z, w, d, floor, eaves: e } = SAWMILL, y = CAMP_Y, rise = 2.6;
  m.scope('Sawmill', () => {
    // piles, sills and the floor
    for (let u = -w / 2 + 0.3; u <= w / 2 - 0.29; u += (w - 0.6) / 6) for (const v of [-d / 2 + 0.3, 0, d / 2 - 0.3]) {
      m.box('concrete', x + u, z + v, 0.6, 0.6, y, y + 0.25);
      m.box('timber', x + u, z + v, 0.32, 0.32, y + 0.25, floor - 0.25);
    }
    for (const v of [-d / 2 + 0.3, 0, d / 2 - 0.3]) m.box('timber', x, z + v, w - 0.2, 0.4, floor - 0.25, floor - 0.02);
    m.box('wood', x, z, w + 0.2, d + 0.2, floor - 0.02, floor + 0.2);
    // the boarded walls with battens, windows along the long faces
    m.box('weathered', x, z, w, d, floor + 0.2, e, 0, false);
    const wins = [-6.5, -3.5, -0.5, 2.5, 5.5];
    for (const s of [-1, 1]) for (let u = -w / 2 + 0.5; u < w / 2 - 0.2; u += 1.0) {
      if (!wins.some(c => Math.abs(u - c) < 1)) m.box('timber', x + u, z + s * (d / 2 + 0.03), 0.1, 0.06, floor + 0.2, e - 0.1);
    }
    // the back's east windows would open into the boiler house
    for (const u of wins) for (const s of [-1, 1]) if (s > 0 || u < 1) windowOn(m, 'z', s as 1 | -1, z + s * (d / 2 + 0.06), x + u, floor + 2.1, 1.4, 1.5, 'timber');
    gable(m, 'sheet', 'weathered', x, z, w, d, e, rise, 'x', 0.6);
    // the monitor along the ridge: louvred sides under its own little gable
    const mw = w * 0.62, md = 1.8, my = e + rise - 0.6;
    m.box('weathered', x, z, mw, md, my, my + 1.4, 0, false);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) m.box('dark', x, z + s * (md / 2 + 0.02), mw - 0.6, 0.04, my + 0.75 + k * 0.22, my + 0.87 + k * 0.22);
    gable(m, 'sheet', 'weathered', x, z, mw, md, my + 1.4, 0.55, 'x', 0.3, 0.1);
    // the log door in the west gable and the lumber door in the east gable
    m.box('dark', x - w / 2 - 0.03, z, 0.06, 2.6, floor + 0.2, floor + 2.6);
    m.box('dark', x + w / 2 + 0.03, z, 0.06, 3.2, floor + 0.2, floor + 3.3);
    m.box('timber', x - w / 2 - 0.08, z, 0.1, 3, floor + 2.6, floor + 2.8);
    m.box('timber', x + w / 2 + 0.08, z, 0.1, 3.6, floor + 3.3, floor + 3.5);
  });
  m.scope('Jackladder', () => {
    // an inclined trough on trestles from the log pond's landing up to the log door, a log riding up it
    const x0 = x - w / 2 - 7, x1 = x - w / 2 - 0.1, y0 = y + 0.4, y1 = floor + 0.25, hw = 0.6;
    const at = (t: number): [number, number] => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    m.slab('wood', [[x0, y0, z - hw], [x1, y1, z - hw], [x1, y1, z + hw], [x0, y0, z + hw]], [0, -0.15, 0]);
    for (const s of [-1, 1]) m.slab('timber', [[x0, y0 - 0.15, z + s * hw], [x1, y1 - 0.15, z + s * hw], [x1, y1 + 0.45, z + s * hw], [x0, y0 + 0.45, z + s * hw]], [0, 0, s * 0.12]);
    for (const t of [0.35, 0.75]) {
      const [tx, ty] = at(t);
      for (const s of [-1, 1]) m.box('timber', tx, z + s * (hw + 0.1), 0.22, 0.22, y, ty - 0.15);
    }
    m.box('timber', x0 - 0.3, z, 0.6, 2 * hw + 0.6, y, y0);
    const [lx, ly] = at(0.55), slope = Math.atan2(y1 - y0, x1 - x0), half = 2.2;
    m.rod('bark', [lx - Math.cos(slope) * half, ly + 0.33 - Math.sin(slope) * half, z], [lx + Math.cos(slope) * half, ly + 0.33 + Math.sin(slope) * half, z], 0.3, 6);
  });
  m.scope('Boiler house', () => {
    const bx = x + 4.5, bw = 7, bz = z - d / 2 - 2.1, bd = 4;
    m.box('concrete', bx, bz, bw + 0.3, bd + 0.2, y, y + 0.4);
    m.box('brick', bx, bz, bw, bd, y + 0.4, floor + 3.8, 0, false);
    for (const u of [-2.3, 0, 2.3]) windowOn(m, 'z', -1, bz - bd / 2, bx + u, y + 1.6, 1, 1.8, 'concrete');
    doorOn(m, 'x', -1, bx - bw / 2, bz, y + 0.4, 1.4, 2.6, 'dark');
    lean(m, 'roof', bx - bw / 2 - 0.3, bx + bw / 2 + 0.3, z - d / 2 + 0.1, floor + 4.6, bz - bd / 2 - 0.4, floor + 3.6, 0.15);
    // the guyed steel stack, its ring and three guys to ground anchors; it smokes
    const sx = bx + 1.8, sz = bz - 0.4, top = 17;
    cyl(m, 'frame', sx, sz, 0.45, floor + 3.8, top, 12, false);
    cyl(m, 'frame', sx, sz, 0.58, top - 0.5, top, 12, false);
    cyl(m, 'frame', sx, sz, 0.55, top - 8, top - 7.8, 12, false);
    for (const [gx, gz] of [[sx - 6, sz + 0.5], [sx + 3, sz - 6], [sx + 3.5, sz + 1]] as const) {
      m.rod('dark', [sx, top - 7.8, sz], [gx, y + 0.3, gz], 0.025, 4);
      m.box('concrete', gx, gz, 0.4, 0.4, y, y + 0.3);
    }
    m.emit('smoke', [sx, top, sz], 0.45);
  });
  m.scope('Sorting deck', () => {
    // the green chain's deck out of the lumber door, on posts, boards sliding across it
    const dx0 = x + w / 2, dx1 = dx0 + 4.5, dz = z, dd = 6;
    for (const u of [0.3, 2.2, 4.2]) for (const v of [-dd / 2 + 0.3, dd / 2 - 0.3]) m.box('timber', dx0 + u, dz + v, 0.26, 0.26, y, floor - 0.02);
    m.box('wood', (dx0 + dx1) / 2, dz, dx1 - dx0, dd, floor - 0.02, floor + 0.2);
    for (const v of [-2, -0.7, 0.6, 1.9]) m.box('dark', (dx0 + dx1) / 2, dz + v, dx1 - dx0 - 0.2, 0.1, floor + 0.2, floor + 0.26);
    for (let i = 0; i < 5; i++) m.box('plank', dx0 + 0.6 + i * 0.75, dz, 0.28, 4.6, floor + 0.26, floor + 0.34);
  });
  m.scope('Sawdust conveyor', () => {
    // an enclosed conveyor from the mill's back wall up into the burner's shoulder, on one trestle
    const a: V3 = [x + w / 2 + 0.6, e - 1, z - d / 2 + 0.8];
    const dirx = BURNER.x - a[0], dirz = BURNER.z - a[2], len = Math.hypot(dirx, dirz), hy = 9.2;
    const rAt = BURNER.r0 + (BURNER.r1 - BURNER.r0) * (hy / BURNER.h);
    const b: V3 = [BURNER.x - dirx / len * (rAt - 0.2), hy, BURNER.z - dirz / len * (rAt - 0.2)];
    m.rod('sheet', a, b, 0.55, 4);
    const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (const s of [-1, 1]) m.box('frame', mid[0] + s * 0.5, mid[2], 0.2, 0.2, y, mid[1] - 0.35);
    m.box('frame', mid[0], mid[2], 1.3, 0.3, mid[1] - 0.6, mid[1] - 0.35);
  });
}

/** The wigwam burner that burns the mill's slabs and sawdust: a steel cone, its bands, door, mesh dome and smoke. */
function burner(m: MeshBuilder): void {
  const { x, z, r0, r1, h } = BURNER, y = CAMP_Y;
  const rAt = (yy: number): number => r0 + (r1 - r0) * ((yy - y - 0.6) / h);
  m.scope('Wigwam burner', () => {
    cyl(m, 'concrete', x, z, r0 + 0.4, y, y + 0.6, 24);
    m.loft('rust', ngon(24, r0, 0, x, z), y + 0.6, ngon(24, r1, 0, x, z), y + 0.6 + h, false);
    for (const k of [0.3, 0.62]) {
      const yy = y + 0.6 + h * k;
      m.loft('frame', ngon(24, rAt(yy) + 0.06, 0, x, z), yy, ngon(24, rAt(yy + 0.25) + 0.06, 0, x, z), yy + 0.25, false);
    }
    m.loft('frame', ngon(24, r1 + 0.12, 0, x, z), y + 0.35 + h, ngon(24, r1 + 0.12, 0, x, z), y + 0.6 + h, false);
    // the spark-arrester dome of wire mesh over the mouth, its ribs
    m.spire('dark', ngon(24, r1, 0, x, z), y + 0.6 + h, y + 0.6 + h + 1.4);
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      m.rod('frame', [x + Math.cos(a) * r1, y + 0.6 + h, z + Math.sin(a) * r1], [x, y + 0.6 + h + 1.45, z], 0.05, 4);
    }
    // the charging door toward the mill and a sawdust spill below it
    const da = Math.atan2(SAWMILL.z - z, SAWMILL.x - x), dr = rAt(y + 1.8) + 0.05;
    m.box('dark', x + Math.cos(da) * dr, z + Math.sin(da) * dr, 1.4, 1.4, y + 0.6, y + 2.6, -da);
    m.emit('smoke', [x, y + 0.6 + h + 1.45, z], 1.2);
  });
}

/** A stickered lumber pile: layers of boards with sticks across between them, about (x, z), long along z. */
function lumberPile(m: MeshBuilder, x: number, z: number, len: number, layers: number): void {
  for (const v of [-len / 3, 0, len / 3]) m.box('timber', x, z + v, 1.6, 0.3, CAMP_Y, CAMP_Y + 0.25);
  let yy = CAMP_Y + 0.25;
  for (let k = 0; k < layers; k++) {
    m.box('plank', x, z, 1.4, len, yy, yy + 0.26);
    yy += 0.26;
    if (k + 1 < layers) {
      for (const v of [-len / 2 + 0.3, -len / 6, len / 6, len / 2 - 0.3]) m.box('timber', x, z + v, 1.5, 0.08, yy, yy + 0.07);
      yy += 0.07;
    }
  }
  // a tin roof on the top layer, weighted down
  m.slab('sheet', [[x - 0.85, yy + 0.25, z - len / 2 - 0.2], [x + 0.85, yy + 0.05, z - len / 2 - 0.2], [x + 0.85, yy + 0.05, z + len / 2 + 0.2], [x - 0.85, yy + 0.25, z + len / 2 + 0.2]], [0, -0.04, 0]);
  for (const v of [-len / 4, len / 4]) m.box('logEnd', x, z + v, 0.3, 0.3, yy + 0.21, yy + 0.45);
  for (const v of [-len / 2 + 0.3, 0, len / 2 - 0.3]) m.box('timber', x, z + v, 0.12, 0.12, yy - 0.05, yy + 0.2);
}

/** The logging camp at full detail: its sawmill, burner and lumber yard, the decks of logs, and the camp's houses. */
export function loggingCamp(_given?: ParamValues): MeshBuilder {
  const m = model(), { w, d } = CAMP;
  return m.scope('Logging camp', () => {
    m.scope('Ground', () => {
      m.box('dirt', 0, 0, w, d, 0, CAMP_Y);
      // the gravel lane between the mill and the houses, and a sawdust apron round the mill
      m.box('yard', 0, 5.6, w - 2, 3.4, CAMP_Y, CAMP_Y + 0.05);
      m.box('sawdust', SAWMILL.x + 2, SAWMILL.z - 1.5, SAWMILL.w + 6, SAWMILL.d + 5, CAMP_Y, CAMP_Y + 0.03);
    });
    m.scope('Log decks', () => {
      for (const [x, z, len, rows, r, seed] of DECKS) logDeck(m, x, z, len, rows, r, seed);
    });
    sawmill(m);
    burner(m);
    m.scope('Lumber yard', () => {
      lumberPile(m, 17.2, 0.5, 5, 6);
      lumberPile(m, 19.6, 0.5, 5, 5);
      lumberPile(m, 20.4, -5.2, 3.6, 4);
    });
    bunkhouse(m, -14.5, 11.5);
    cookhouse(m, -2, 11);
    waterTower(m, 6.5, 11);
    office(m, 15.5, 11.6);
    m.scope('Yard', () => {
      lamp(m, -w / 2 + 1.5, 4, CAMP_Y, 1);
      lamp(m, 10.5, 4, CAMP_Y, -1);
      // the fuel tank on its cradle by the boiler house
      const tx = -w / 2 + 3, tz = -3;
      for (const dx of [-0.9, 0.9]) m.box('steel', tx + dx, tz, 0.15, 1, CAMP_Y, CAMP_Y + 1);
      m.sweep('red', 'x', ngon(12, 0.65, 0, tz, CAMP_Y + 1.6), tx - 1.4, ngon(12, 0.65, 0, tz, CAMP_Y + 1.6), tx + 1.4);
    });
    return m;
  });
}
/** The logging camp's low detail: the decks, the mill with its monitor, boiler house and stack, the burner, the piles and the houses. */
export function loggingCampLod(_given?: ParamValues): MeshBuilder {
  const m = model(), { w, d } = CAMP, y = CAMP_Y;
  lodBox(m, 'dirt', 0, 0, w, d, 0, y);
  for (const [x, z, len, rows, r] of DECKS) {
    const half = rows[0]! * r * 0.87, top = y + 0.3 + rows.length * r * 1.51 + 0.4 * r;
    const s: Ring = [[z - half, y], [z + half, y], [z + half * 0.4, top], [z - half * 0.4, top]];
    m.sweep('bark', 'x', s, x - len / 2, s, x + len / 2);
  }
  const roofed = (wall: Mat, roofMat: Mat, x: number, z: number, bw: number, bd: number, y0: number, e: number, rise: number, along: 'x' | 'z'): void => {
    lodBox(m, wall, x, z, bw, bd, y0, e);
    if (along === 'x') { const s: Ring = [[z - bd / 2 - 0.3, e - 0.1], [z + bd / 2 + 0.3, e - 0.1], [z, e + rise]]; m.sweep(roofMat, 'x', s, x - bw / 2 - 0.3, s, x + bw / 2 + 0.3); }
    else { const s: Ring = [[x - bw / 2 - 0.3, e - 0.1], [x + bw / 2 + 0.3, e - 0.1], [x, e + rise]]; m.sweep(roofMat, 'z', s, z - bd / 2 - 0.3, s, z + bd / 2 + 0.3); }
  };
  const { x, z, w: mw, d: md, floor, eaves } = SAWMILL;
  lodBox(m, 'timber', x, z, mw - 1, md - 1, y, floor - 0.05);
  roofed('weathered', 'sheet', x, z, mw, md, floor, eaves, 2.6, 'x');
  roofed('weathered', 'sheet', x, z, mw * 0.62, 1.8, eaves + 2, eaves + 3.4, 0.55, 'x');
  lodBox(m, 'brick', x + 4.5, z - md / 2 - 2.1, 7, 4, y, floor + 3.8);
  lodCylinder(m, 'frame', x + 6.3, z - md / 2 - 2.5, 0.5, floor + 3.8, 17, 5);
  m.slab('wood', [[x - mw / 2 - 7, y + 0.4, z - 0.6], [x - mw / 2 - 0.1, floor + 0.25, z - 0.6], [x - mw / 2 - 0.1, floor + 0.25, z + 0.6], [x - mw / 2 - 7, y + 0.4, z + 0.6]], [0, -0.4, 0]);
  lodBox(m, 'wood', x + mw / 2 + 2.25, z, 4.5, 6, y, floor + 0.2);
  lodLoft(m, 'rust', ngon(10, BURNER.r0, 0, BURNER.x, BURNER.z), y, ngon(10, BURNER.r1, 0, BURNER.x, BURNER.z), y + 0.6 + BURNER.h);
  m.spire('dark', ngon(10, BURNER.r1, 0, BURNER.x, BURNER.z), y + 0.6 + BURNER.h, y + 2 + BURNER.h);
  lodBox(m, 'plank', 18.4, 0.5, 4, 5, y, y + 2);
  lodBox(m, 'plank', 20.4, -5.2, 1.6, 3.6, y, y + 1.5);
  roofed('timber', 'shingle', -14.5, 11.5, 12, 5.5, y, 3.4, 2.4, 'x');
  roofed('wood', 'shingle', -2, 11, 7, 8, y, 3.6, 2.6, 'z');
  lodBox(m, 'wood', 15.5, 11.6 - 3.45, 6.4, 0.3, y, 6);
  roofed('wood', 'roof', 15.5, 11.6, 6, 6.5, y, 3.6, 1.6, 'z');
  lodBox(m, 'timber', 6.5, 11, 3, 3, y, 6.3);
  lodCylinder(m, 'wood', 6.5, 11, 2.1, 6.3, 9.5, 8);
  m.spire('shingle', ngon(8, 2.4, 0, 6.5, 11), 9.5, 11.4);
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
