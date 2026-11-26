// The oil well (industry-oil-pump; docs/models/industry.md): a beam pumpjack on its pad
// with its drive, wellhead, power and a tank battery. Its own JS bundle entry
// (generate.ts), so the mechanism's code rides with no other industry design, and no
// design's code rides with it; the palette and the small helpers restate industry.ts's.
import { MeshBuilder, ngon } from './meshBuilder.ts';
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from './design.ts';
import { lodBox, lodCylinder } from './lodPrimitives.ts';
import { PUMP_CLIP, pumpjackLayout, pumpjackTracks } from './pumpjack.ts';

const MACHINE_PARAMS: ParamSpec[] = [/* @__PURE__ */ { name: 'size', title: 'Machine size', default: 'compact', values: [{ value: 'compact', title: 'Compact' }, { value: 'large', title: 'Large' }] }];
/** industry.ts's palette, the materials the well uses. */
function model(): MeshBuilder {
  return new MeshBuilder({ wood: { color: '#9a7650' }, steel: { color: '#405560', metallic: .45 }, light: { color: '#d9ded6' }, roof: { color: '#394951' }, glass: { color: '#78b7bf', metallic: .3 }, concrete: { color: '#a6aaa2' }, yellow: { color: '#edb64c' }, red: { color: '#bd5542' }, dark: { color: '#26343b' } });
}
function cyl(m: MeshBuilder, mat: string, x: number, z: number, r: number, y: number, h: number, n = 20): void { m.prism(mat, ngon(n, r, 0, x, z), y, y + h); }
function ladder(m: MeshBuilder, x: number, z: number, y: number, h: number): void {
  for (const dx of [-.38, .38]) m.box('steel', x + dx, z, .09, .12, y, y + h);
  for (let a = y + .3; a < y + h; a += .45) m.box('steel', x, z + .03, .8, .1, a, a + .08);
}

/** The oil well's pad: concrete under the jack, the tank battery behind it (-z). */
export const OIL_PAD = { x: -1.5, z: -2.7, w: 17, d: 13.4 };
/** The tank battery: the stock tanks' centres along x (one compact, two large), their row, radius and the separator. */
const oilTanks = (large: boolean): number[] => large ? [-5.8, -2.1] : [-2.6];
const TANK_Z = -6.6, TANK_R = 1.6, SEP_X = 1.6;
export function industrialOilPump(given?: ParamValues): MeshBuilder {
  const p = resolveParams(MACHINE_PARAMS, given), m = model(), large = p.size === 'large', h = large ? 9 : 6;
  const l = pumpjackLayout(h), [cx, cy] = l.crank, [ex, ey] = l.equalizer, [kx, ky] = l.pin;
  const rodTop: [number, number, number] = [5.5, h - .9, 0];
  const tangent: [number, number, number] = [l.head, l.saddle[1], 0];
  // a straight link of width w from a to b in the side view, between z0 and z1
  const link = (mat: string, a: [number, number], b: [number, number], w: number, z0: number, z1: number) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len * w / 2, ny = (b[0] - a[0]) / len * w / 2;
    m.slab(mat, [[a[0] - nx, a[1] - ny, z0], [b[0] - nx, b[1] - ny, z0], [b[0] + nx, b[1] + ny, z0], [a[0] + nx, a[1] + ny, z0]], [0, 0, z1 - z0]);
  };
  const pipe = (pts: [number, number, number][], r = .08, mat = 'dark') => {
    for (let i = 0; i + 1 < pts.length; i++) m.rod(mat, pts[i]!, pts[i + 1]!, r, 6);
    for (const q of pts.slice(1, -1)) m.box(mat, q[0], q[2], r * 2.6, r * 2.6, q[1] - r * 1.3, q[1] + r * 1.3);
  };
  const tanks = oilTanks(large), th = large ? 5.2 : 4.6;
  m.part('frame', [0, 0, 0], () => {
    m.scope('Pad', () => { m.box('concrete', OIL_PAD.x, OIL_PAD.z, OIL_PAD.w, OIL_PAD.d, 0, .35); });
    m.scope('Samson post', () => {
      for (const z of [-1.3, 1.3]) {
        m.slab('steel', [[-2,.4,z],[-.8,h,z],[-.4,h,z],[-1.6,.4,z]], [0,0,.22]);
        m.slab('steel', [[.6,.4,z],[-.4,h,z],[0,h,z],[1,.4,z]], [0,0,.22]);
        for (let y = 1.5; y < h; y += 1.3) m.box('steel', -.5, z, 2.2 - y / h, .25, y, y + .14);
        m.box('steel', -.5, z + .11, 3.4, .5, .35, .42);
      }
      m.box('steel', 0, 0, 1, 3.3, h, h + .6);
      // the saddle bearing's housings either side of the beam
      for (const z of [-.7, .7]) m.box('yellow', 0, z, .7, .3, h + .6, h + .74);
      ladder(m, -1, 1.65, .4, h);
    });
    m.scope('Gear reducer and drive', () => {
      // the reducer: a rounded housing round the crank axle on its base, the input shaft out to the belt guard
      m.box('steel', cx, 0, 2.2, 1.9, .35, 1);
      m.sweep('red', 'z', ngon(14, .95, 0, cx, cy), -.75, ngon(14, .95, 0, cx, cy), .75);
      m.sweep('red', 'z', ngon(10, .55, 0, cx - .9, 1.25), -.75, ngon(10, .55, 0, cx - .9, 1.25), .65);
      m.box('dark', cx, 0, .5, 1.62, cy + .9, cy + 1.02);
      m.sweep('steel', 'z', ngon(8, .1, 0, cx - .9, 1.25), -1.9, ngon(8, .1, 0, cx - .9, 1.25), -.75);
      // the belt guard over both sheaves
      const mx = -8.2, my = .95, rg = .85;
      const guard: [number, number, number][] = [[cx - .9 - rg, 1.25 - rg * .4, -2.2], [cx - .9 - rg * .3, 1.25 - rg, -2.2], [cx - .9 + rg * .4, 1.25 - rg * .8, -2.2], [cx - .9 + rg * .6, 1.25 + rg * .6, -2.2], [cx - .9, 1.25 + rg, -2.2], [mx, my + .42, -2.2], [mx - .42, my, -2.2], [mx, my - .42, -2.2]];
      m.slab('yellow', guard.map(([x, y]) => [x, y, -1.95] as [number, number, number]), [0, 0, -.3]);
      // the electric motor on its slide rails, cooling fins, terminal box
      m.box('steel', mx, -1.25, 1.2, 1.6, .35, .5);
      m.sweep('light', 'z', ngon(12, .45, 0, mx, my), -1.9, ngon(12, .45, 0, mx, my), -.6);
      for (const z of [-1.6, -1.25, -.9]) m.sweep('steel', 'z', ngon(12, .5, 0, mx, my), z, ngon(12, .5, 0, mx, my), z + .08);
      m.sweep('steel', 'z', ngon(12, .38, 0, mx, my), -.62, ngon(12, .38, 0, mx, my), -.45);
      m.box('dark', mx, -1.1, .4, .45, my + .4, my + .72);
    });
    m.scope('Crank guard', () => {
      // pipe railing round the cranks on both sides and across the back
      const x0 = -8.9, x1 = -2.5;
      for (const z of [-2.65, 2.65]) {
        for (let x = x0; x <= x1 + 1e-6; x += (x1 - x0) / 4) m.box('yellow', x, z, .1, .1, .35, 1.45);
        for (const y of [.8, 1.35]) m.rod('yellow', [x0, y, z], [x1, y, z], .045, 6);
      }
      for (const y of [.8, 1.35]) m.rod('yellow', [x0, y, -2.65], [x0, y, 2.65], .045, 6);
    });
    m.scope('Power and control', () => {
      // a wooden pole with its cross-arm, insulators and transformer, the conduit down to the starter cabinet
      const px = -9.6, pz = 3.2;
      m.prism('wood', ngon(8, .14, 0, px, pz), .35, 9.5);
      m.box('wood', px, pz, .14, 1.6, 8.8, 8.98);
      for (const dz of [-.7, 0, .7]) m.prism('light', ngon(6, .06, 0, px, pz + dz), 8.98, 9.2);
      m.prism('light', ngon(10, .3, 0, px + .45, pz), 6, 7.1);
      m.prism('dark', ngon(10, .32, 0, px + .45, pz), 7.1, 7.2);
      m.rod('dark', [px + .2, 6, pz], [px + .2, 2.1, pz - 1], .04, 4);
      const bz = 2;
      for (const dz of [-.3, .3]) m.box('steel', px, bz + dz, .1, .1, .35, 1.1);
      m.box('light', px, bz, .45, .9, 1.1, 2.2);
      m.box('dark', px + .24, bz, .04, .7, 1.25, 2.05);
      m.box('steel', px, bz, .6, 1.05, 2.2, 2.28);
      pipe([[px + .1, 1.1, bz - .3], [px + .1, .45, bz - .3], [-8.2, .45, -.45]], .05);
    });
    m.scope('Wellhead', () => {
      // casing head and flanges, the tubing head, the tee to the flowline with its valve, the stuffing box and gauge
      const wx = 5.5;
      m.prism('steel', ngon(14, .38, 0, wx, 0), .35, .9);
      m.prism('steel', ngon(14, .52, 0, wx, 0), .9, 1.04);
      m.prism('steel', ngon(12, .24, 0, wx, 0), 1.04, 1.5);
      m.prism('steel', ngon(12, .36, 0, wx, 0), 1.5, 1.6);
      m.prism('yellow', ngon(10, .17, 0, wx, 0), 1.6, 1.95);
      m.rod('steel', [wx, 1.25, -.2], [wx, 1.25, -.75], .12, 8);
      m.box('red', wx, -.95, .36, .36, 1.07, 1.43);
      m.prism('red', ngon(10, .22, 0, wx, -.95), 1.75, 1.79);
      m.rod('red', [wx, 1.43, -.95], [wx, 1.75, -.95], .03, 4);
      m.rod('steel', [wx, 1.25, .2], [wx, 1.25, .52], .05, 6);
      m.sweep('light', 'z', ngon(10, .12, 0, wx, 1.25), .5, ngon(10, .12, 0, wx, 1.25), .58);
      pipe([[wx, 1.25, -1.1], [wx, 1.25, -3.4], [SEP_X, 1.25, -3.4], [SEP_X, 1.25, TANK_Z + .6]]);
      for (const at of [[wx, -2.3], [3.5, -3.4], [SEP_X, -3.4]] as const) m.box('steel', at[0], at[1], .12, .3, .35, 1.17);
    });
    m.scope('Tank battery', () => {
      // a firewall of low concrete walls round the stock tanks and the separator
      const bx0 = tanks[0]! - TANK_R - .9, bx1 = SEP_X + 1.2, bz0 = OIL_PAD.z - OIL_PAD.d / 2 + .25, bz1 = TANK_Z + TANK_R + .9;
      for (const z of [bz0, bz1]) m.box('concrete', (bx0 + bx1) / 2, z, bx1 - bx0, .25, .35, 1.05);
      for (const x of [bx0, bx1]) m.box('concrete', x, (bz0 + bz1) / 2, .25, bz1 - bz0 - .2, .35, 1);
      for (const tx of tanks) {
        m.prism('dark', ngon(20, TANK_R + .1, 0, tx, TANK_Z), .35, .5);
        m.prism('light', ngon(20, TANK_R, 0, tx, TANK_Z), .5, th, false);
        for (const y of [th * .35, th * .7]) m.prism('steel', ngon(20, TANK_R + .03, 0, tx, TANK_Z), y, y + .07, false);
        m.loft('light', ngon(20, TANK_R + .05, 0, tx, TANK_Z), th, ngon(20, .35, 0, tx, TANK_Z), th + .45, false);
        m.prism('steel', ngon(10, .32, 0, tx, TANK_Z), th + .45, th + .6);
        m.prism('steel', ngon(8, .1, 0, tx + .6, TANK_Z - .4), th + .1, th + .95);
        m.prism('dark', ngon(8, .16, 0, tx + .6, TANK_Z - .4), th + .95, th + 1.05);
        m.box('red', tx, TANK_Z - TANK_R - .01, 1.4, .02, th * .5, th * .5 + .5);
        ladder(m, tx, TANK_Z + TANK_R + .1, .4, th - .15);
      }
      // the separator's oil line to the nearest tank, an equalizing line between the tanks
      pipe([[SEP_X - .5, 2.4, TANK_Z], [tanks[tanks.length - 1]! + TANK_R - .05, 2.4, TANK_Z]], .07);
      for (let k = 1; k < tanks.length; k++) pipe([[tanks[k - 1]! + TANK_R - .05, 1.2, TANK_Z], [tanks[k]! - TANK_R + .05, 1.2, TANK_Z]], .07);
      // the catwalk over the tank tops from the ladders, its railing
      const cw0 = tanks[0]! - .4, cw1 = tanks[tanks.length - 1]! + .4, cz = TANK_Z + 1.2;
      m.box('steel', (cw0 + cw1) / 2, cz, cw1 - cw0, .8, th + .25, th + .33);
      for (const z of [cz - .36, cz + .36]) m.rod('yellow', [cw0, th + 1.33, z], [cw1, th + 1.33, z], .04, 6);
      for (const x of [cw0 + .05, cw1 - .05]) for (const z of [cz - .36, cz + .36]) m.box('yellow', x, z, .07, .07, th + .33, th + 1.33);
      // the vertical separator on its legs: a domed shell, the gas vent up, a sight glass
      m.box('concrete', SEP_X, TANK_Z, 1.5, 1.5, .35, .5);
      for (const [dx, dz] of [[-.35, -.35], [.35, -.35], [-.35, .35], [.35, .35]]) m.box('steel', SEP_X + dx, TANK_Z + dz, .1, .1, .5, 1.1);
      m.loft('light', ngon(14, .25, 0, SEP_X, TANK_Z), .9, ngon(14, .55, 0, SEP_X, TANK_Z), 1.2, false);
      m.prism('light', ngon(14, .55, 0, SEP_X, TANK_Z), 1.2, 3.6, false);
      m.loft('light', ngon(14, .55, 0, SEP_X, TANK_Z), 3.6, ngon(14, .2, 0, SEP_X, TANK_Z), 3.9);
      m.prism('steel', ngon(8, .07, 0, SEP_X, TANK_Z), 3.9, 6.2);
      m.box('glass', SEP_X + .56, TANK_Z, .04, .12, 1.6, 2.8);
    });
  });
  // the crank axle, a crank disc, pin and counterweight (opposite the pin) each side, turning about the axle
  m.part('cranks', [cx, cy, 0], () => {
    const shaft = ngon(12, .15, 0, cx, cy);
    m.sweep('steel', 'z', shaft, -1.2, shaft, 1.2);
    for (const z of [-1.3, 1.3]) {
      const wheel = ngon(20, .95, 0, cx, cy);
      m.sweep('steel', 'z', wheel, z-.14, wheel, z+.14);
      const hub = ngon(12, .25, 0, cx, cy);
      m.sweep('yellow', 'z', hub, z-.2, hub, z+.2);
      const out = Math.sign(z), pin = ngon(10, .12, 0, kx, ky);
      m.sweep('steel', 'z', pin, z + out * .05, pin, z + out * .45);
      // the counterweight: a fan of plate opposite the pin
      const z0 = out > 0 ? 1.08 : -1.46, fan: [number, number, number][] = [];
      for (let k = 0; k <= 6; k++) { const a = Math.PI - .7 + 1.4 * k / 6; fan.push([cx + Math.cos(a) * 1.45, cy + Math.sin(a) * 1.45, z0]); }
      fan.push([cx - .45, cy - .35, z0], [cx - .45, cy + .35, z0]);
      m.slab('yellow', fan, [0,0,.38]);
    }
  });
  // the walking beam, an I-section with its flanges, the equalizer at its tail and the curved horsehead at its nose
  m.part('beam', [l.saddle[0], l.saddle[1], 0], () => {
    m.slab('steel', [[-5,h+.5,-.3],[5,h+1,-.3],[5,h+1.6,-.3],[-5,h+1.1,-.3]], [0,0,.6]);
    m.slab('steel', [[-5.1,h+1.08,-.45],[5,h+1.58,-.45],[5,h+1.7,-.45],[-5.1,h+1.2,-.45]], [0,0,.9]);
    m.slab('steel', [[-5.1,h+.4,-.45],[5,h+.9,-.45],[5,h+1.02,-.45],[-5.1,h+.52,-.45]], [0,0,.9]);
    for (const x of [-3, -1.2, 1.2, 3]) m.slab('steel', [[x,h+.79+.05*x,-.38],[x+.1,h+.795+.05*x,-.38],[x+.1,h+1.315+.05*x,-.38],[x,h+1.31+.05*x,-.38]], [0,0,.76]);
    // the horsehead: its face an arc about the saddle, so the bridle always hangs plumb over the well
    const sy = l.saddle[1], head: [number, number, number][] = [[4.3, h + 1.75, -.6]];
    for (let k = 0; k <= 8; k++) { const a = .42 - .9 * k / 8; head.push([l.head * Math.cos(a), sy + l.head * Math.sin(a), -.6]); }
    head.push([4.3, h - 1.6, -.6]);
    m.slab('red', head, [0,0,1.2]);
    const bar = ngon(10, .15, 0, ex, ey);
    m.sweep('steel', 'z', bar, -1.75, bar, 1.75);
  });
  // both pitman arms, from the crank pins up to the equalizer
  m.part('pitman-arms', [kx, ky, 0], () => {
    link('light', [kx, ky], [ex, ey], .22, 1.5, 1.65);
    link('light', [kx, ky], [ex, ey], .22, -1.65, -1.5);
  });
  // the polished rod and its carrier bar, hanging from the horsehead into the wellhead
  m.part('polished-rod', rodTop, () => {
    cyl(m, 'steel', rodTop[0], 0, .09, 1.6, rodTop[1] - 1.6 + .5, 8);
    m.box('steel', rodTop[0], 0, .3, .9, rodTop[1] - .12, rodTop[1]);
    m.box('dark', rodTop[0], 0, .2, .2, rodTop[1], rodTop[1] + .25);
  });
  // the bridle's two wire lines from the horsehead's face down to the carrier bar: they stretch and shorten
  m.part('bridle', tangent, () => {
    for (const z of [-.35, .35]) m.rod('dark', [tangent[0] + .04, tangent[1], z], [tangent[0] + .04, rodTop[1], z], .03, 4);
  });
  const motion = pumpjackTracks(l, rodTop, tangent);
  m.animate({ name: PUMP_CLIP, times: motion.times, tracks: motion.tracks, drive: { drive: 'time' } });
  return m;
}
export function industrialOilPumpLod(given?:ParamValues):MeshBuilder {
  const p=resolveParams(MACHINE_PARAMS,given),m=model(),large=p.size==='large',h=large?9:6,th=large?5.2:4.6;
  lodBox(m,'concrete',OIL_PAD.x,OIL_PAD.z,OIL_PAD.w,OIL_PAD.d,0,.35);
  for(const z of [-1.3,1.3]){
    m.slab('steel',[[-2,.4,z],[-.8,h,z],[-.4,h,z],[-1.6,.4,z]],[0,0,.22]);
    m.slab('steel',[[.6,.4,z],[-.4,h,z],[0,h,z],[1,.4,z]],[0,0,.22]);
  }
  m.slab('steel',[[-5,h+.5,-.35],[5,h+1,-.35],[5,h+1.6,-.35],[-5,h+1.1,-.35]],[0,0,.7]);
  m.slab('red',[[4.3,h+1.75,-.6],[5.05,h+3,-.6],[5.5,h+.75,-.6],[5.05,h-1.5,-.6],[4.3,h-1.6,-.6]],[0,0,1.2]);
  lodBox(m,'red',-4.4,0,1.9,1.5,.36,2.85);lodBox(m,'light',-8.2,-1.25,.9,1.3,.36,1.4);
  for(const tx of oilTanks(large)){lodCylinder(m,'light',tx,TANK_Z,TANK_R,.36,th,8);m.spire('light',ngon(8,TANK_R,0,tx,TANK_Z),th,th+.45);}
  lodCylinder(m,'light',SEP_X,TANK_Z,.55,.36,3.9,6);
  return m;
}

/** industry.ts's INDUSTRY_CATALOG, restated so this bundle does not import that module. */
const CATALOG: CatalogFields = { category: 'Industry', group: 'industry', defaultScale: 1, license: 'CC0', author: 'Rail Island', source: 'Rail Island procedural industry' };
/** The oil well: a site of several pieces of plant, so its low detail has the process plants' 500 triangles. */
export const OIL_WELL: readonly ProceduralDesign[] = [
  { id: 'industry-oil-pump', title: 'Oil pumpjack', build: industrialOilPump, buildLod: industrialOilPumpLod, lodTriangles: 500, params: MACHINE_PARAMS, catalog: CATALOG },
];
