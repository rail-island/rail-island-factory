// The industrial hall kit of the factory buildings (docs/models/industry.md): walls
// built AROUND real openings -- windows, loading docks, doors and taking-in doors sit
// in reveals and cannot overlap, because the wall is filled only where no opening is
// planned -- with plinth, pilasters, lintels or string courses, and flat, gable or
// sawtooth roofs with their furniture. Metres, +Y up, ground y = 0, the apron top at
// y = 0.35. The front (+z) carries the loading docks.
import { MeshBuilder, ngon, type Ring } from './meshBuilder.ts';

export type Face = 'front' | 'rear' | 'left' | 'right';
export type OpeningKind = 'window' | 'clerestory' | 'dock' | 'door' | 'loading';
/** A planned opening: `u` runs along the face (x on front and rear, z on the ends). */
export interface Opening { face: Face; kind: OpeningKind; u0: number; u1: number; y0: number; y1: number }
export type Roof = 'flat' | 'gable' | 'saw';
export interface HallSpec {
  w: number; d: number; h: number; roof: Roof;
  /** Floor levels, the ground floor (the plinth top) first; one entry for a single-storey hall. */
  floors: number[];
  /** Taking-in doors with a hoist in the middle bay of the right end (a mill). */
  hoist?: boolean;
  /** One continuous canopy over all docks (a warehouse) instead of a hood over each. */
  longCanopy?: boolean;
}

export const FACES: readonly Face[] = ['front', 'right', 'rear', 'left'];
/** Top of the concrete plinth and the ground floor. */
export const PLINTH = .95;
/** Wall thickness: the depth of every reveal. */
const WALL = .4;
/** A flat roof's parapet above the roof line. */
const PARAPET = .9;
/** Pilaster half width and projection. */
const PIER = .225, PIER_OUT = .22;

export const faceLength = (s: HallSpec, f: Face): number => (f === 'front' || f === 'rear' ? s.w : s.d);
/** Bay centres along a face and the bay width: about 4 m on front and rear, 4.5 m on the ends. */
export function bayLayout(s: HallSpec, f: Face): { centres: number[]; bay: number } {
  const L = faceLength(s, f), n = Math.max(2, Math.round(L / (f === 'front' || f === 'rear' ? 4 : 4.5))), bay = L / n;
  return { centres: Array.from({ length: n }, (_, i) => -L / 2 + (i + .5) * bay), bay };
}
/** The wall top: a flat roof's parapet rises above the roof line. */
export const wallTop = (s: HallSpec): number => (s.roof === 'flat' ? s.h + PARAPET : s.h);

/** Every opening of the hall. The tests check that none overlaps another or a pilaster. */
export function hallOpenings(s: HallSpec): Opening[] {
  const out: Opening[] = [];
  const tops = [...s.floors.slice(1), s.h];
  for (const face of FACES) {
    const { centres, bay } = bayLayout(s, face), half = (bay - 1.5) / 2, mid = Math.floor(centres.length / 2);
    centres.forEach((c, i) => {
      for (let k = 0; k < s.floors.length; k++) {
        const f0 = s.floors[k]!, f1 = tops[k]!, y0 = f0 + (k ? .8 : .7), y1 = f1 - .55;
        const push = (kind: OpeningKind, u0: number, u1: number, a: number, b: number) => out.push({ face, kind, u0, u1, y0: a, y1: b });
        if (face === 'front' && k === 0) {
          if (i < centres.length - 1) {
            const top = Math.min(4.6, f1 - .9);
            push('dock', c - 1.4, c + 1.4, 1.25, top);
            if (f1 - top > 2.2) push('clerestory', c - half, c + half, top + .9, y1);
          } else {
            push('door', c - .6, c + .6, PLINTH + .15, PLINTH + 2.45);
            if (y1 - (PLINTH + 3.1) > 1) push('window', c - half, c + half, PLINTH + 3.1, y1);
          }
        } else if (face === 'rear' && k === 0 && i === 0) push('door', c - .6, c + .6, PLINTH + .15, PLINTH + 2.45);
        else if (face === 'right' && s.hoist && i === mid && k > 0) push('loading', c - .8, c + .8, f0 + .05, f0 + 2.3);
        else push('window', c - half, c + half, y0, y1);
      }
    });
  }
  return out;
}

interface Frame { axis: 'x' | 'z'; s: 1 | -1; P: number }
const frameOf = (s: HallSpec, f: Face): Frame =>
  f === 'front' ? { axis: 'z', s: 1, P: s.d / 2 } : f === 'rear' ? { axis: 'z', s: -1, P: s.d / 2 } : { axis: 'x', s: f === 'right' ? 1 : -1, P: s.w / 2 };
/** A box on a face: `u0..u1` along it, `o0..o1` outward from the wall plane, `y0..y1` up. */
function fbox(m: MeshBuilder, f: Frame, mat: string, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number): void {
  const n = f.s * (f.P + (o0 + o1) / 2), t = o1 - o0, u = (u0 + u1) / 2, du = u1 - u0;
  if (f.axis === 'z') m.box(mat, u, n, du, t, y0, y1); else m.box(mat, n, u, t, du, y0, y1);
}
/** The plan point `o` out from the face at `u`, as [x, z]. */
function fpoint(f: Frame, u: number, o: number): [number, number] {
  const n = f.s * (f.P + o);
  return f.axis === 'z' ? [u, n] : [n, u];
}
function post(m: MeshBuilder, mat: string, x: number, z: number, r: number, y0: number, y1: number, n = 8): void {
  m.prism(mat, ngon(n, r, 0, x, z), y0, y1);
}

/** The wall of a face between `a` and `b`, filled column by column around its openings. */
function wallFill(m: MeshBuilder, f: Frame, a: number, b: number, y0: number, y1: number, openings: Opening[]): void {
  const cuts = [...new Set([a, b, ...openings.flatMap(o => [o.u0, o.u1])])].filter(u => u >= a && u <= b).sort((p, q) => p - q);
  for (let i = 0; i + 1 < cuts.length; i++) {
    const u0 = cuts[i]!, u1 = cuts[i + 1]!;
    if (u1 - u0 < 1e-6) continue;
    let y = y0;
    for (const o of openings.filter(o => o.u0 <= u0 && o.u1 >= u1).sort((p, q) => p.y0 - q.y0)) {
      if (o.y0 > y) fbox(m, f, 'wall', u0, u1, -WALL, 0, y, o.y0);
      y = Math.max(y, o.y1);
    }
    if (y < y1) fbox(m, f, 'wall', u0, u1, -WALL, 0, y, y1);
  }
}

function glazing(m: MeshBuilder, f: Frame, o: Opening, lintel: boolean): void {
  const wide = o.u1 - o.u0, tall = o.y1 - o.y0;
  // a mill's small upper-floor windows are divided finer than a hall's tall ones
  const pane = lintel ? 1.1 : .8, cols = Math.max(2, Math.round(wide / pane)), rows = Math.max(lintel ? 1 : 2, Math.round(tall / 1.15));
  fbox(m, f, 'glass', o.u0, o.u1, -.3, -.22, o.y0, o.y1);
  for (let i = 1; i < cols; i++) { const u = o.u0 + wide * i / cols; fbox(m, f, 'light', u - .04, u + .04, -.22, -.16, o.y0, o.y1); }
  for (let j = 1; j < rows; j++) { const y = o.y0 + tall * j / rows; fbox(m, f, 'light', o.u0, o.u1, -.22, -.16, y - .04, y + .04); }
  fbox(m, f, 'light', o.u0 - .12, o.u1 + .12, -.22, .1, o.y0, o.y0 + .07);
  if (lintel) fbox(m, f, 'light', o.u0 - .18, o.u1 + .18, -.06, .06, o.y1, o.y1 + .3);
}

function dock(m: MeshBuilder, f: Frame, o: Opening, hood: boolean): void {
  // the roller shutter in the reveal, its slats, the black dock seal round the
  // opening, rubber buffers and the leveller lip at the truck bed's height
  fbox(m, f, 'light', o.u0, o.u1, -.34, -.3, o.y0, o.y1);
  for (let y = o.y0 + .3; y < o.y1 - .1; y += .3) fbox(m, f, 'steel', o.u0, o.u1, -.3, -.27, y, y + .04);
  for (const [a, b] of [[o.u0 - .3, o.u0], [o.u1, o.u1 + .3]] as const) fbox(m, f, 'dark', a, b, 0, .45, o.y0 - .1, o.y1 + .05);
  fbox(m, f, 'dark', o.u0 - .3, o.u1 + .3, -.08, .45, o.y1 + .05, o.y1 + .45);
  for (const u of [o.u0 + .3, o.u1 - .3]) fbox(m, f, 'dark', u - .15, u + .15, 0, .18, o.y0 - .55, o.y0 - .1);
  fbox(m, f, 'steel', o.u0 + .1, o.u1 - .1, 0, .35, o.y0 - .08, o.y0);
  if (hood) {
    fbox(m, f, 'steel', o.u0 - .45, o.u1 + .45, -.03, 1.6, o.y1 + .6, o.y1 + .72);
    for (const u of [o.u0 - .25, o.u1 + .25]) {
      const [x0, z0] = fpoint(f, u, .05), [x1, z1] = fpoint(f, u, 1.5);
      m.rod('steel', [x0, o.y1 + 1.5, z0], [x1, o.y1 + .72, z1], .035, 6);
    }
  }
  // guard posts beside the opening and the painted lines the trucks back along
  for (const u of [o.u0 - .55, o.u1 + .55]) {
    const [x, z] = fpoint(f, u, .5);
    post(m, 'yellow', x, z, .13, .35, 1.35);
    post(m, 'dark', x, z, .14, 1.35, 1.45);
  }
  for (const u of [o.u0 - .1, o.u1 + .1]) fbox(m, f, 'yellow', u - .06, u + .06, 1.1, 3.7, .35, .37);
}

function door(m: MeshBuilder, f: Frame, o: Opening): void {
  fbox(m, f, 'steel', o.u0, o.u1, -.26, -.2, o.y0, o.y1);
  fbox(m, f, 'glass', o.u0 + .3, o.u1 - .3, -.2, -.17, o.y0 + 1.25, o.y1 - .3);
  fbox(m, f, 'light', o.u0 - .12, o.u1 + .12, -.06, .06, o.y1, o.y1 + .12);
  fbox(m, f, 'concrete', o.u0 - .5, o.u1 + .5, 0, 1.1, .35, o.y0);
  fbox(m, f, 'steel', o.u0 - .5, o.u1 + .5, -.03, 1.1, o.y1 + .35, o.y1 + .45);
  fbox(m, f, 'yellow', o.u0 - .1, o.u1 + .1, -.04, .12, o.y1 + .2, o.y1 + .3);
}

function takingIn(m: MeshBuilder, f: Frame, o: Opening): void {
  // two-leaf loading doors on an upper floor, a guard bar across them
  fbox(m, f, 'red', o.u0, o.u1, -.26, -.2, o.y0, o.y1);
  const c = (o.u0 + o.u1) / 2;
  fbox(m, f, 'dark', c - .03, c + .03, -.2, -.16, o.y0 + .08, o.y1);
  fbox(m, f, 'light', o.u0 - .15, o.u1 + .15, -.06, .06, o.y1, o.y1 + .3);
  fbox(m, f, 'light', o.u0 - .12, o.u1 + .12, -.2, .12, o.y0, o.y0 + .08);
  fbox(m, f, 'steel', o.u0 - .05, o.u1 + .05, .1, .16, o.y0 + .9, o.y0 + .98);
}

/** Draws the walls, openings, pilasters and roof of a hall; returns its openings. */
export function hall(m: MeshBuilder, s: HallSpec): Opening[] {
  const openings = hallOpenings(s), top = wallTop(s);
  m.scope('Walls and openings', () => {
    m.box('concrete', 0, 0, s.w + .3, s.d + .3, .35, PLINTH);
    for (const face of FACES) {
      const f = frameOf(s, face), L = faceLength(s, face), mine = openings.filter(o => o.face === face);
      // front and rear run corner to corner; the ends fit between them
      const end = face === 'front' || face === 'rear' ? 0 : WALL;
      wallFill(m, f, -L / 2 + end, L / 2 - end, .35, top, mine);
      for (const o of mine) {
        if (o.kind === 'window' || o.kind === 'clerestory') glazing(m, f, o, s.floors.length === 1);
        else if (o.kind === 'dock') dock(m, f, o, !s.longCanopy);
        else if (o.kind === 'door') door(m, f, o);
        else takingIn(m, f, o);
      }
    }
  });
  m.scope('Pilasters and string courses', () => {
    for (const face of FACES) {
      const f = frameOf(s, face), { centres, bay } = bayLayout(s, face);
      for (const c of centres.slice(1)) fbox(m, f, 'trim', c - bay / 2 - PIER, c - bay / 2 + PIER, -.1, PIER_OUT, PLINTH, top + .04);
      const L = faceLength(s, face);
      // a multi-storey hall bands each floor at its window heads
      if (s.floors.length > 1) {
        const heads = [...s.floors.slice(1), s.h].map(y => y - .55);
        for (const y of heads) fbox(m, f, 'light', -L / 2 + .2, L / 2 - .2, -.06, .06, y, y + .25);
      } else fbox(m, f, 'trim', -L / 2 + .2, L / 2 - .2, -.12, .3, s.h - .3, s.h + .03);
    }
    for (const x of [-1, 1]) for (const z of [-1, 1]) m.box('trim', x * (s.w / 2 + .05), z * (s.d / 2 + .05), .7, .7, PLINTH, top + .04);
  });
  m.scope('Roof', () => {
    if (s.roof === 'flat') flatRoof(m, s);
    else if (s.roof === 'gable') gableRoof(m, s);
    else sawRoof(m, s);
  });
  if (s.hoist) m.scope('Hoist', () => {
    const f = frameOf(s, 'right'), { centres } = bayLayout(s, 'right'), c = centres[Math.floor(centres.length / 2)]!;
    fbox(m, f, 'steel', c - .12, c + .12, -.03, 1.7, s.h - .62, s.h - .32);
    fbox(m, f, 'roof', c - 1.1, c + 1.1, -.09, 2, s.h - .3, s.h - .1);
    const [x, z] = fpoint(f, c, 1.5);
    m.rod('dark', [x, s.h - .6, z], [x, s.floors[1]! + 3.2, z], .02, 4);
    m.box('steel', x, z, .25, .25, s.floors[1]! + 2.9, s.floors[1]! + 3.2);
  });
  return openings;
}

function flatRoof(m: MeshBuilder, s: HallSpec): void {
  const t = s.h + PARAPET;
  // coping on the parapet: front and rear corner to corner, the ends between them
  for (const z of [-1, 1]) m.box('light', 0, z * (s.d / 2 - .075), s.w + .6, .75, t, t + .12);
  for (const x of [-1, 1]) m.box('light', x * (s.w / 2 - .075), 0, .75, s.d - .9, t, t + .12);
  m.box('roof', 0, 0, s.w - 2 * WALL, s.d - 2 * WALL, s.h - .3, s.h + .12);
}

function gableRoof(m: MeshBuilder, s: HallSpec): void {
  const R = s.w * .2, e = .55, k = R / (s.w / 2), z0 = -s.d / 2 - .45, z1 = s.d / 2 + .45, ye = s.h - e * k, ridge = s.h + R;
  for (const sx of [-1, 1]) {
    const xe = sx * (s.w / 2 + e);
    m.slab('roof', [[xe, ye, z0], [0, ridge, z0], [0, ridge + .25, z0], [xe, ye + .25, z0]], [0, 0, z1 - z0]);
    // standing seams down the slope, a rooflight strip, the eaves gutter and downpipes
    for (let z = z0 + .35; z < z1 - .2; z += .9)
      m.slab('steel', [[xe, ye + .25, z], [sx * .12, ridge + .25 - .12 * k, z], [sx * .12, ridge + .31 - .12 * k, z], [xe, ye + .31, z]], [0, 0, .06]);
    const a = .3, b = .52, x0 = sx * s.w / 2 * a, x1 = sx * s.w / 2 * b, y = (x: number) => ridge - Math.abs(x) * k + .26;
    m.slab('glass', [[x0, y(x0), z0 + 1.2], [x1, y(x1), z0 + 1.2], [x1, y(x1), z1 - 1.2], [x0, y(x0), z1 - 1.2]], [0, .035, 0]);
    m.box('steel', sx * (s.w / 2 + e + .12), 0, .26, z1 - z0, ye - .2, ye + .08);
    for (const z of [-1, 1]) {
      m.box('steel', sx * (s.w / 2 + .12), z * (s.d / 2 - .75), .14, .14, .35, ye - .2);
      m.box('steel', sx * (s.w / 2 + e / 2 + .12), z * (s.d / 2 - .75), e + .14, .14, ye - .34, ye - .2);
    }
  }
  m.box('light', 0, 0, .55, z1 - z0 + .1, ridge + .1, ridge + .38);
  // the gables, each with a round louvred vent
  for (const sz of [-1, 1]) {
    const zf = sz * s.d / 2, yc = s.h + R * .42, r = Math.min(1, R * .22);
    m.slab('wall', [[-s.w / 2, s.h, zf], [s.w / 2, s.h, zf], [0, ridge, zf]], [0, 0, -sz * WALL]);
    const disc = ngon(16, r, 0, 0, yc);
    m.sweep('dark', 'z', disc, zf, disc, zf + sz * .06);
    m.tube('light', 'z', 0, yc, r + .16, r, zf, zf + sz * .14, 16);
    for (let j = -2; j <= 2; j++) {
      const yy = yc + j * r * .36, half = Math.sqrt(Math.max(0, r * r - (j * r * .36) ** 2));
      m.box('steel', 0, zf + sz * .1, 2 * half, .06, yy - .05, yy + .05);
    }
  }
  // the ridge ventilator: a louvred lantern under its own small roof
  const L = s.d * .6;
  m.box('steel', 0, 0, 1.4, L, ridge - .3, ridge + .8);
  for (const sx of [-1, 1]) {
    for (let j = 0; j < 3; j++) m.box('dark', sx * .74, 0, .08, L - .4, ridge + .12 + j * .22, ridge + .22 + j * .22);
    m.slab('roof', [[sx * 1.05, ridge + .7, -L / 2 - .3], [0, ridge + 1.15, -L / 2 - .3], [0, ridge + 1.27, -L / 2 - .3], [sx * 1.05, ridge + .82, -L / 2 - .3]], [0, 0, L + .6]);
  }
}

function sawRoof(m: MeshBuilder, s: HallSpec): void {
  const n = Math.max(2, Math.round(s.w / 4)), tw = s.w / n, H = 2.6, z0 = -s.d / 2 - .3, z1 = s.d / 2 + .3, zi = s.d / 2 - WALL;
  for (let i = 0; i < n; i++) {
    const x = -s.w / 2 + i * tw, xg = x + tw - .12;
    m.slab('roof', [[x, s.h, z0], [xg, s.h + H, z0], [xg, s.h + H + .22, z0], [x, s.h + .22, z0]], [0, 0, z1 - z0]);
    // the north-light glazing with its mullions and transom, capped; the valley gutter
    m.box('glass', xg + .03, 0, .06, 2 * zi, s.h + .04, s.h + H);
    for (let z = -zi + 1.2; z < zi - .6; z += 1.4) m.box('steel', xg + .09, z, .06, .08, s.h, s.h + H);
    m.box('steel', xg + .09, 0, .06, 2 * zi, s.h + H * .5 - .04, s.h + H * .5 + .04);
    m.box('steel', xg + .02, 0, .3, z1 - z0 + .1, s.h + H + .1, s.h + H + .32);
    m.box('steel', x + tw + .12, 0, .4, z1 - z0 + .1, s.h - .06, s.h + .12);
    // the end walls of the tooth, flush with the front and rear faces
    for (const sz of [-1, 1]) m.slab('wall', [[x, s.h, sz * s.d / 2], [x + tw, s.h, sz * s.d / 2], [x + tw, s.h + H, sz * s.d / 2], [xg, s.h + H, sz * s.d / 2]], [0, 0, -sz * WALL]);
  }
}

/** A domed rooflight on its upstand. */
export function rooflight(m: MeshBuilder, x: number, z: number, w: number, d: number, y: number): void {
  m.box('steel', x, z, w, d, y, y + .35);
  const s0: Ring = [[x - w / 2 + .1, y + .35], [x + w / 2 - .1, y + .35], [x + w / 4, y + .7], [x - w / 4, y + .7]];
  m.sweep('glass', 'z', s0, z - d / 2 + .1, s0, z + d / 2 - .1);
}
/** A turbine roof ventilator: a neck and a ribbed spinning head. */
export function roofVent(m: MeshBuilder, x: number, z: number, y: number): void {
  post(m, 'steel', x, z, .2, y, y + .5, 10);
  const r = [.22, .42, .46, .38, .12], ys = [.5, .62, .82, 1.0, 1.1];
  for (let i = 0; i + 1 < r.length; i++) m.loft('light', ngon(10, r[i]!, 0, x, z), y + ys[i]!, ngon(10, r[i + 1]!, 0, x, z), y + ys[i + 1]!, i + 2 === r.length);
}
/** A packaged air-handling unit with two fans on top. */
export function airUnit(m: MeshBuilder, x: number, z: number, y: number): void {
  m.box('light', x, z, 2.6, 1.4, y, y + 1.1);
  m.box('steel', x, z, 2.8, 1.6, y - .02, y + .15);
  for (const dx of [-.65, .65]) {
    post(m, 'dark', x + dx, z, .5, y + 1.1, y + 1.16, 12);
    post(m, 'steel', x + dx, z, .12, y + 1.16, y + 1.24, 8);
  }
  m.box('steel', x - 1.6, z, .5, .5, y + .2, y + .7);
}
/** A stack of pallets. */
export function pallets(m: MeshBuilder, x: number, z: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const y = .35 + i * .16, ry = (i % 2) * .08;
    m.box('wood', x, z, 1.2, 1, y, y + .14, ry);
  }
}
/** Two steel drums. */
export function drums(m: MeshBuilder, x: number, z: number): void {
  for (const [dx, mat] of [[0, 'red'], [.66, 'steel']] as const) {
    post(m, mat, x + dx, z, .3, .35, 1.25, 10);
    post(m, 'dark', x + dx, z, .31, .75, .8, 10);
  }
}
/** A yard lamp: a pole with an arm and a lantern. */
export function lamp(m: MeshBuilder, x: number, z: number, dir: 1 | -1): void {
  post(m, 'steel', x, z, .09, .35, 6.4, 8);
  m.box('steel', x + dir * .6, z, 1.2, .1, 6.3, 6.4);
  m.box('dark', x + dir * 1.15, z, .5, .3, 6.15, 6.35);
  m.box('light', x + dir * 1.15, z, .42, .22, 6.12, 6.15);
}
