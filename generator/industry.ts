import { lodBox, lodLoft, lodCylinder } from './lodPrimitives.ts';
// Industrial architecture in metres. See docs/models/industry.md.
import { chamferedRect, MeshBuilder, ngon, type Ring } from './meshBuilder.ts';
import { airUnit, drums, hall, lamp, pallets, PLINTH, roofVent, rooflight, type HallSpec } from './industryHall.ts';
import { PUMP_CLIP, pumpjackLayout, pumpjackTracks } from './pumpjack.ts';
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign, type CatalogFields } from './design.ts';

export const INDUSTRY_CATALOG: CatalogFields = { category: 'Industry', group: 'industry', defaultScale: 1, license: 'CC0', author: 'Rail Island', source: 'Rail Island procedural industry' };
const choice = (name: string, title: string, values: string[], initial = values[0]!): ParamSpec => ({ name, title, default: initial, values: values.map(value => ({ value, title: value[0]!.toUpperCase() + value.slice(1) })) });
const SIZE = choice('size', 'Site size', ['compact', 'extended']);
const FINISH = choice('finish', 'Cladding', ['brick', 'blue', 'cream']);
const BUILDING_PARAMS = [SIZE, FINISH];
const CHIMNEY_PARAMS = [choice('height', 'Stack height', ['short', 'medium', 'tall']), choice('style', 'Construction', ['brick', 'striped', 'steel'])];
const TANK_PARAMS = [choice('layout', 'Tank arrangement', ['horizontal', 'vertical', 'cluster'])];
const POWER_PARAMS = [choice('type', 'Plant type', ['thermal', 'coal', 'nuclear'])];
const PROCESS_PARAMS = [choice('type', 'Process plant', ['chemical', 'refinery'])];
const MACHINE_PARAMS = [choice('size', 'Machine size', ['compact', 'large'])];
function model(finish = 'brick'): MeshBuilder {
  return new MeshBuilder({ wall: { color: finish === 'blue' ? '#607f96' : finish === 'cream' ? '#d3c8ac' : '#a35f48' }, trim: { color: TRIM[finish] ?? TRIM.brick! }, wood: { color: '#9a7650' }, steel: { color: '#405560', metallic: .45 }, light: { color: '#d9ded6' }, roof: { color: '#394951' }, glass: { color: '#78b7bf', metallic: .3 }, concrete: { color: '#a6aaa2' }, yellow: { color: '#edb64c' }, red: { color: '#bd5542' }, dark: { color: '#26343b' } });
}
function cyl(m: MeshBuilder, mat: string, x: number, z: number, r: number, y: number, h: number, n = 20): void { m.prism(mat, ngon(n, r, 0, x, z), y, y + h); }
function base(m: MeshBuilder, w: number, d: number): void { m.box('concrete', 0, 0, w, d, 0, .35); }
function ladder(m: MeshBuilder, x: number, z: number, y: number, h: number): void {
  for (const dx of [-.38, .38]) m.box('steel', x + dx, z, .09, .12, y, y + h);
  for (let a = y + .3; a < y + h; a += .45) m.box('steel', x, z + .03, .8, .1, a, a + .08);
}
function rail(m: MeshBuilder, x: number, z: number, w: number, y: number): void {
  for (let a = -w / 2; a <= w / 2; a += 2) m.box('yellow', x + a, z, .09, .09, y, y + 1.05);
  for (const h of [.5, 1]) m.box('yellow', x, z, w, .08, y + h, y + h + .08);
}
/** A chimney; it smokes from its mouth, or burns as a gas flare when `flare` is set. */
function stack(m: MeshBuilder, x: number, z: number, h: number, style = 'brick', y = .35, flare = false): void {
  if (flare) m.emit('flame', [x, y + h + .7, z], .59, { height: 5, color: '#ff8a2a' });
  else m.emit('smoke', [x, y + h + .7, z], .59);
  m.scope('Chimney and service ladder', () => {
    cyl(m, 'concrete', x, z, 2, y, .7);
    const radius = (t: number) => 1.35 - .6 * t;
    for (let i = 0; i < 8; i++) m.loft(style === 'striped' && i % 2 ? 'red' : style === 'brick' ? 'wall' : 'light', ngon(24, radius(i / 8), 0, x, z), y + .7 + h * i / 8, ngon(24, radius((i + 1) / 8), 0, x, z), y + .7 + h * (i + 1) / 8, false);
    // Recessed dark mouth with a thick visible rim, not a capped solid pole.
    m.loft('steel', ngon(24, .75, 0, x, z), y + h + .7, ngon(24, .59, 0, x, z), y + h + .7, false);
    m.prism('dark', ngon(24, .59, 0, x, z), y + h + .15, y + h + .2);
    ladder(m, x, z + 1.45, y + .8, h - .4);
  });
}
const TRIM: Record<string, string> = { brick: '#86452f', blue: '#4b677c', cream: '#b5a888' };
/** The hall spec of a factory building: footprint, eaves height, roof and floors. */
export function buildingSpec(kind: string, size: string): HallSpec {
  const w = size === 'extended' ? 24 : 16;
  if (kind === 'mill') return { w, d: 14, h: 14, roof: 'flat', floors: [PLINTH, 4.95, 7.95, 10.95], hoist: true };
  if (kind === 'warehouse') return { w, d: 18, h: 7.2, roof: 'flat', floors: [PLINTH], longCanopy: true };
  return { w, d: 14, h: 7.2, roof: kind === 'saw' ? 'saw' : 'gable', floors: [PLINTH] };
}
function building(kind: string, given?: ParamValues): MeshBuilder {
  const p = resolveParams(BUILDING_PARAMS, given), m = model(p.finish), s = buildingSpec(kind, p.size), { w, d, h } = s;
  return m.scope("Industrial assembly", () => {
  base(m, w + 8, d + 8);
  hall(m, s);
  m.scope('Yard', () => {
    lamp(m, -w / 2 - 2.8, d / 2 + 2.6, 1);
    lamp(m, w / 2 + 2.8, d / 2 + 2.6, -1);
    pallets(m, w / 2 + 2.2, d / 2 - 1.5, 4); pallets(m, w / 2 + 2.3, d / 2 - 3, 2);
    drums(m, -w / 2 - 2.6, -d / 2 + 1.5);
  });
  if (kind === 'mill') m.scope('Mill roof and stack', () => {
    stack(m, -w / 2 - 2.4, -4, 26);
    // the stair tower above the roof, the water tank on its stand, rooflights and vents
    const tx = -w / 2 + 2.2, tz = -d / 2 + 2.2, t0 = h + .9, t1 = h + 4;
    m.box('wall', tx, tz, 4.4, 4.4, t0, t1, 0, false);
    m.box('light', tx, tz, 4.6, 4.6, t1, t1 + .15);
    m.box('glass', tx, tz + 2.2, .9, .12, t0 + .9, t1 - .5);
    m.box('glass', tx + 2.2, tz, .12, .9, t0 + .9, t1 - .5);
    const wx = w / 2 - 3.2, wz = -d / 2 + 3.4;
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) m.box('steel', wx + dx * .9, wz + dz * .9, .16, .16, h + .12, h + 3);
    m.box('steel', wx, wz, 2.4, 2.4, h + 3, h + 3.15);
    cyl(m, 'wall', wx, wz, 1.25, h + 3.15, 2.3, 16);
    for (const y of [h + 3.7, h + 4.6]) cyl(m, 'steel', wx, wz, 1.29, y, .1, 16);
    m.spire('roof', ngon(16, 1.35, 0, wx, wz), h + 5.45, h + 6.2);
    for (const x of [-w / 4 + 1, w / 4 - 1]) rooflight(m, x, 1.6, 2.2, 3.2, h + .12);
    for (const x of [-1.5, 1.5, w / 2 - 3]) roofVent(m, x, 4.5, h + .12);
  });
  if (kind === 'hall') m.scope('Compressor house', () => {
    const cx = -w / 2 - 2.4;
    m.box('wall', cx, -2, 2.4, 4, .35, 2.9);
    m.box('roof', cx, -2, 2.7, 4.3, 2.9, 3.05);
    m.box('steel', cx, .03, 1.1, .06, .35, 2.4);
    cyl(m, 'light', cx, 1.4, .55, .35, 2.4, 12);
    m.spire('light', ngon(12, .55, 0, cx, 1.4), 2.75, 3.1);
  });
  if (kind === 'saw') m.scope('Dust extraction', () => {
    const cx = -w / 2 - 2.4, cz = 2;
    for (const dx of [-.8, .8]) for (const dz of [-.8, .8]) m.box('steel', cx + dx, cz + dz, .14, .14, .35, 3.4);
    m.box('steel', cx, cz, 2, 2, 3.4, 3.55);
    m.loft('light', ngon(16, .25, 0, cx, cz), 3.55, ngon(16, 1.1, 0, cx, cz), 5.4, false);
    cyl(m, 'light', cx, cz, 1.1, 5.4, 2.2, 16);
    m.loft('light', ngon(16, 1.1, 0, cx, cz), 7.6, ngon(16, .35, 0, cx, cz), 8.1, false);
    cyl(m, 'steel', cx, cz, .35, 8.1, .9, 10);
    m.rod('steel', [cx + .9, 7.0, cz], [-w / 2 - .1, 7.0, cz], .32, 10);
    m.box('wood', cx, cz - 2.1, 1.8, 1.4, .35, 1.3);
  });
  if (kind === 'warehouse') m.scope('Dock canopy and roof plant', () => {
    // one cantilevered canopy over the docks, hung from the pilasters on brackets and ties
    const cw = w - 4.45, cx = -1.775, y0 = 5.2;
    m.box('steel', cx, d / 2 + 2.04, cw, 4.12, y0, y0 + .2);
    m.box('light', cx, d / 2 + 4.12, cw + .1, .14, y0 - .15, y0 + .3);
    for (let x = -w / 2; x <= w / 2 - 4 + .01; x += 4) {
      m.slab('steel', [[x - .08, y0, d / 2], [x - .08, y0, d / 2 + 2.5], [x - .08, y0 - 1.2, d / 2]], [.16, 0, 0]);
      m.rod('steel', [x, y0 + 1.3, d / 2 + .25], [x, y0 + .2, d / 2 + 3.8], .04, 6);
    }
    for (const x of [-w / 2 + 4, 2, w / 2 - 4]) airUnit(m, x, -d / 2 + 3, h + .12);
    for (let x = -w / 2 + 3; x < w / 2 - 2; x += 4) for (const z of [-1, 3.5]) rooflight(m, x, z, 1.6, 2.4, h + .12);
    for (const x of [-w / 4, w / 4]) roofVent(m, x, d / 2 - 2, h + .12);
    // the name board on the front parapet
    m.box('red', cx, d / 2 + .27, 7, .1, h + .05, h + .85);
    for (let i = 0; i < 5; i++) m.box('light', cx - 2.6 + i * 1.3, d / 2 + .34, .9, .04, h + .3, h + .6);
  });
  return m;
  });
}
export function industrialMill(p?: ParamValues): MeshBuilder { return building('mill', p); }
export function industrialHall(p?: ParamValues): MeshBuilder { return building('hall', p); }
export function industrialSaw(p?: ParamValues): MeshBuilder { return building('saw', p); }
export function industrialWarehouse(p?: ParamValues): MeshBuilder { return building('warehouse', p); }
export function industrialChimney(given?: ParamValues): MeshBuilder {
  const p = resolveParams(CHIMNEY_PARAMS, given), m = model();
  return m.scope("Industrial assembly", () => {
  base(m, 6, 6); stack(m, 0, 0, p.height === 'short' ? 14 : p.height === 'medium' ? 26 : 40, p.style); return m;
  });
}
function tank(m: MeshBuilder, x: number, z: number, r = 2.4, h = 7): void {
  cyl(m, 'concrete', x, z, r + .4, .35, .4);
  cyl(m, 'light', x, z, r, .76, h);
  for (const y of [1.1, h * .5, h + .5]) cyl(m, 'steel', x, z, r + .06, y, .14);
  m.loft('light', ngon(24, r, 0, x, z), h + .77, ngon(24, .3, 0, x, z), h + 1.6);
  cyl(m, 'steel', x, z, .3, h + 1.61, .45);
  ladder(m, x, z + r + .2, .8, h);
}
export function industrialTank(given?: ParamValues): MeshBuilder {
  const p = resolveParams(TANK_PARAMS, given), m = model(); return m.scope("Industrial assembly", () => {
  base(m, 15, 11);
  if (p.layout === 'horizontal') {
    const ring = ngon(24, 2.4, 0, 0, 3.7);
    m.sweep('light', 'x', ring, -5, ring, 5);
    for (const x of [-3.6, 3.6]) { m.box('concrete', x, 0, 1, 4, .35, 2); m.tube('yellow', 'x', 0, 3.7, 2.5, 2.41, x - .15, x + .15, 24); }
    cyl(m, 'steel', 0, 0, .5, 6.12, .6); ladder(m, 0, 2.6, .35, 6);
  } else for (const x of p.layout === 'cluster' ? [-3.5, 3.5] : [0]) tank(m, x, 0);
  return m;
  });
}
function coolingTower(m: MeshBuilder, x: number, z: number): void {
  m.emit('steam', [x, 20, z], 3.1);
  const ys = [.5, 2, 5, 9, 13, 17, 20], rs = [5.5, 5.2, 4.3, 3.3, 3, 3.3, 3.7];
  for (let i = 0; i < ys.length - 1; i++) m.loft('concrete', ngon(32, rs[i]!, 0, x, z), ys[i]!, ngon(32, rs[i + 1]!, 0, x, z), ys[i + 1]!, false);
  m.loft('light', ngon(32, 3.7, 0, x, z), 20, ngon(32, 3.4, 0, x, z), 20, false);
  m.loft('dark', ngon(32, 3.4, 0, x, z), 20, ngon(32, 3.1, 0, x, z), 17, false);
}
export function industrialPower(given?: ParamValues): MeshBuilder {
  const p = resolveParams(POWER_PARAMS, given), m = model('cream'); return m.scope("Industrial assembly", () => {
  base(m, 46, 38);
  m.scope('Turbine hall', () => { hall(m, { w: 16, d: 12, h: 8, roof: 'gable', floors: [PLINTH] }); });
  m.scope('Cooling circuit', () => { coolingTower(m, -15, -8); if (p.type === 'nuclear') coolingTower(m, 15, -8); else stack(m, 15, -8, 28, 'striped'); });
  m.scope('Switchyard', () => { for (let x = -16; x <= 16; x += 8) {
    m.box('steel', x, 13, 3.5, 3, .36, 2.3);
    for (const dx of [-1, 0, 1]) { cyl(m, 'dark', x + dx, 13, .2, 2.31, 1.7, 8); for (let y = 2.5; y < 4; y += .3) cyl(m, 'light', x + dx, 13, .35, y, .1, 8); }
  } });
  if (p.type === 'coal') { m.box('dark', -14, 7, 9, 7, .4, 1.6); for (let x = -17; x < -10; x += 2) m.spire('dark', ngon(8, 2, 0, x, 7), 1.61, 3.4); }
  if (p.type === 'nuclear') { cyl(m, 'light', 0, -12, 4, .36, 6); m.loft('light', ngon(24, 4, 0, 0, -12), 6.01, ngon(24, .5, 0, 0, -12), 9); }
  return m;
  });
}
export function industrialProcess(given?: ParamValues): MeshBuilder {
  const p = resolveParams(PROCESS_PARAMS, given), m = model('blue'); return m.scope("Industrial assembly", () => {
  base(m, 36, 28);
  m.scope('Storage vessels', () => { for (const x of [-11, -4, 3]) tank(m, x, 8, 2.5, 6); });
  m.scope('Distillation train', () => { for (let i = 0; i < 3; i++) {
    const x = -11 + i * 7, h = (p.type === 'refinery' ? 18 : 12) + i * 2;
    tank(m, x, -6, 1.6, h);
    for (let y = 5; y < h; y += 5) { m.box('steel', x, -6, 4.5, 4.5, y, y + .18); rail(m, x, -3.8, 4.5, y + .18); }
  } });
  m.scope('Pipe rack', () => { for (let x = -14; x < 10; x += 4) { for (const z of [-1.3, 1.3]) m.box('steel', x, z, .18, .18, .36, 4.5); m.box('steel', x, 0, .2, 3, 4.5, 4.7); }
    for (const z of [-.8, 0, .8]) m.tube('yellow', 'x', z, 5.05, .22, .16, -15, 10, 12);
  });
  m.box('wall', 13, 6, 6, 9, .36, 4); m.box('roof', 13, 6, 6.4, 9.4, 4.02, 4.3);
  for (const x of [11.3, 13, 14.7]) m.box('glass', x, 10.56, 1.2, .08, 2.1, 3.3);
  for (const x of [-11, -4, 3]) {
    const pipe = ngon(12, .18, 0, x, 1.2);
    m.sweep('steel', 'z', pipe, 1.5, pipe, 5.6);
    cyl(m, 'yellow', x, 3, .35, 1.4, .15, 12);
  }
  // A refinery's stack is its gas flare; a chemical plant vents steam from the two
  // tallest distillation columns.
  if (p.type === 'refinery') stack(m, 13, -8, 23, 'steel', .35, true);
  else for (const i of [1, 2]) m.emit('steam', [-11 + i * 7, 12 + i * 2 + 2.06, -6], .3);
  return m;
  });
}
export function industrialFoundry(given?: ParamValues): MeshBuilder {
  const p = resolveParams(BUILDING_PARAMS, given), m = model(p.finish), w = p.size === 'extended' ? 24 : 16;
  return m.scope("Industrial assembly", () => {
  base(m, w + 12, 26); hall(m, { w, d: 14, h: 10, roof: 'saw', floors: [PLINTH] });
  for (const x of [-w / 2 + 2, 0, w / 2 - 2]) stack(m, x, -10, 24, 'striped');
  m.box('steel', w / 2 + 2.5, 0, 3, 10, 5, 5.25); rail(m, w / 2 + 2.5, 5, 3, 5.25);
  ladder(m, w / 2 + 4.1, 0, .35, 5); return m;
  });
}
export function industrialOilPump(given?: ParamValues): MeshBuilder {
  const p = resolveParams(MACHINE_PARAMS, given), m = model(), h = p.size === 'large' ? 9 : 6;
  const l = pumpjackLayout(h), [cx, cy] = l.crank, [ex, ey] = l.equalizer, [kx, ky] = l.pin;
  const rodTop: [number, number, number] = [5.5, h - .9, 0];
  // a straight link of width w from a to b in the side view, between z0 and z1
  const link = (mat: string, a: [number, number], b: [number, number], w: number, z0: number, z1: number) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len * w / 2, ny = (b[0] - a[0]) / len * w / 2;
    m.slab(mat, [[a[0] - nx, a[1] - ny, z0], [b[0] - nx, b[1] - ny, z0], [b[0] + nx, b[1] + ny, z0], [a[0] + nx, a[1] + ny, z0]], [0, 0, z1 - z0]);
  };
  m.part('frame', [0, 0, 0], () => {
    base(m, 14, 8);
    for (const z of [-1.3, 1.3]) {
      m.slab('steel', [[-2,.4,z],[-.8,h,z],[-.4,h,z],[-1.6,.4,z]], [0,0,.22]);
      m.slab('steel', [[.6,.4,z],[-.4,h,z],[0,h,z],[1,.4,z]], [0,0,.22]);
      for (let y = 1.5; y < h; y += 1.3) m.box('steel', -.5, z, 2.2 - y / h, .25, y, y + .14);
    }
    m.box('steel', 0, 0, 1, 3.3, h, h + .6);
    cyl(m, 'yellow', 5.5, 0, .4, .4, .6);
    m.box('roof', cx, 0, 1.6, 2, .36, 2.3); ladder(m, -1, 1.65, .4, h);
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
      const z0 = out > 0 ? 1.08 : -1.46;
      m.slab('yellow', [[cx-.45,cy-.5,z0],[cx-.45,cy+.5,z0],[cx-1.15,cy+.65,z0],[cx-1.15,cy-.65,z0]], [0,0,.38]);
    }
  });
  // the walking beam with the equalizer at its tail and the horsehead at its nose
  m.part('beam', [l.saddle[0], l.saddle[1], 0], () => {
    m.slab('steel', [[-5,h+.5,-.35],[5,h+1,-.35],[5,h+1.6,-.35],[-5,h+1.1,-.35]], [0,0,.7]);
    m.slab('red', [[4.5,h+1,-.6],[5.5,h+1.8,-.6],[6,h+.8,-.6],[5.7,h-1,-.6],[4.9,h-1,-.6]], [0,0,1.2]);
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
    cyl(m, 'steel', rodTop[0], 0, .09, 1.6, rodTop[1] - 1.6, 8);
    m.box('steel', rodTop[0], 0, .3, .5, rodTop[1] - .12, rodTop[1]);
  });
  const motion = pumpjackTracks(l, rodTop);
  m.animate({ name: PUMP_CLIP, times: motion.times, tracks: motion.tracks, drive: { drive: 'time' } });
  return m;
}
/** The rotor's hub height above the tower top, and its plane in front of the tower. */
const HUB_RISE = 1.05, BLADE_Z = 2.05;
// A blade's stations from root to tip: span (absolute metres, or a fraction of the
// rotor radius), chord and thickness as fractions of the radius and the chord, twist
// in degrees; `red` paints the segment that ends at the station (the tip marking).
const BLADE: { at: number; abs?: boolean; c: number; t: number; tw: number; red?: boolean }[] = [
  { at: .55, abs: true, c: .76, t: 1, tw: 0 }, { at: 1.1, abs: true, c: .76, t: 1, tw: 0 },
  { at: .13, c: .066, t: .55, tw: 16 }, { at: .2, c: .085, t: .32, tw: 13 }, { at: .32, c: .076, t: .23, tw: 10 },
  { at: .45, c: .066, t: .19, tw: 7 }, { at: .58, c: .056, t: .17, tw: 5 }, { at: .7, c: .047, t: .15, tw: 3 },
  { at: .8, c: .041, t: .14, tw: 2 }, { at: .86, c: .037, t: .13, tw: 1.5 }, { at: .93, c: .032, t: .12, tw: 1, red: true },
  { at: .965, c: .028, t: .12, tw: .5 }, { at: 1, c: .02, t: .12, tw: 0, red: true },
];
// The aerofoil, leading edge first over the suction side: (chord fraction, thickness fraction).
const AEROFOIL: [number, number][] = [[0, 0], [.04, .38], [.15, .55], [.35, .48], [.6, .28], [1, .02], [.6, -.14], [.35, -.3], [.15, -.36], [.04, -.28]];
/** One blade turned `a` about the hub at (0, hy): lofted aerofoil stations, root round, tip marked red. */
function blade(m: MeshBuilder, hy: number, r: number, a: number): void {
  const radial = [-Math.sin(a), Math.cos(a)], tangent = [Math.cos(a), Math.sin(a)];
  const rings = BLADE.map(st => {
    const span = st.abs ? st.at : st.at * r, tw = st.tw * Math.PI / 180;
    // chord along the rotation, turned by the twist toward the rotor axis
    const cd = [tangent[0]! * Math.cos(tw), tangent[1]! * Math.cos(tw), Math.sin(tw)], td = [-tangent[0]! * Math.sin(tw), -tangent[1]! * Math.sin(tw), Math.cos(tw)];
    const centre: [number, number, number] = [radial[0]! * span, hy + radial[1]! * span, BLADE_Z];
    const ring = AEROFOIL.map(([u, v], j): [number, number] => {
      if (st.abs) { const f = Math.PI - j * 2 * Math.PI / AEROFOIL.length; return [Math.cos(f) * st.c / 2, Math.sin(f) * st.c / 2]; }
      const c = st.c * r; return [(u - .3) * c, v * st.t * c];
    });
    return { centre, red: !!st.red, pts: ring.map(([u, v]): [number, number, number] => [centre[0] + u * cd[0]! + v * td[0]!, centre[1] + u * cd[1]! + v * td[1]!, centre[2] + u * cd[2]! + v * td[2]!]) };
  });
  type V = [number, number, number];
  const out = (mat: string, p: V[], o: V) => {
    // wind the face outward from `o`, a point on the blade's axis
    const [a0, a1, a2] = p, u = [a1![0] - a0![0], a1![1] - a0![1], a1![2] - a0![2]], v = [a2![0] - a0![0], a2![1] - a0![1], a2![2] - a0![2]];
    const n = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
    const c = p.reduce((s, q) => [s[0] + q[0] / p.length, s[1] + q[1] / p.length, s[2] + q[2] / p.length], [0, 0, 0]);
    const flip = n[0]! * (c[0] - o[0]) + n[1]! * (c[1] - o[1]) + n[2]! * (c[2] - o[2]) < 0;
    const q = flip ? [...p].reverse() : p;
    if (q.length === 4) m.quad(mat, q[0]!, q[1]!, q[2]!, q[3]!); else m.tri(mat, q[0]!, q[1]!, q[2]!);
  };
  for (let k = 0; k + 1 < rings.length; k++) {
    const A = rings[k]!, B = rings[k + 1]!, mat = B.red ? 'red' : 'light', n = A.pts.length;
    const o: V = [(A.centre[0] + B.centre[0]) / 2, (A.centre[1] + B.centre[1]) / 2, BLADE_Z];
    for (let j = 0; j < n; j++) out(mat, [A.pts[j]!, A.pts[(j + 1) % n]!, B.pts[(j + 1) % n]!, B.pts[j]!], o);
  }
  const tip = rings[rings.length - 1]!, beyond: V = [tip.centre[0] - radial[0]!, tip.centre[1] - radial[1]!, BLADE_Z];
  for (let j = 1; j + 1 < tip.pts.length; j++) out('red', [tip.pts[0]!, tip.pts[j]!, tip.pts[j + 1]!], beyond);
}
export function industrialWind(given?: ParamValues): MeshBuilder {
  const p = resolveParams(MACHINE_PARAMS, given), m = model(), h = p.size === 'large' ? 42 : 28, r = h * .4, hy = h + HUB_RISE;
  const radius = (y: number) => 1.45 - .8 * y / h;
  m.part('tower', [0,0,0], () => {
    m.scope('Foundation and tower', () => {
      base(m, 8, 8);
      m.prism('concrete', ngon(24, 2.2), .35, .75);
      // three tapered steel sections, the bolted flanges marked at the joints
      const joints = [.75, h * .38, h * .7, h - .25];
      for (let i = 0; i + 1 < joints.length; i++) m.loft('light', ngon(32, radius(joints[i]!)), joints[i]!, ngon(32, radius(joints[i + 1]!)), joints[i + 1]!, false);
      for (const y of joints.slice(1, -1)) m.prism('steel', ngon(32, radius(y) + .04), y - .05, y + .05);
      m.prism('steel', ngon(32, radius(.75) + .04), .75, .95);
    });
    m.scope('Entrance', () => {
      const z = radius(2) - .02;
      m.box('dark', 0, z, 1.05, .14, .95, 3.2);
      m.box('steel', 0, z + .02, .85, .14, 1.05, 3.05);
      m.box('steel', 0, z + .85, 1.6, 1.5, 1.0, 1.08);
      for (let i = 0; i < 3; i++) m.box('steel', 1.15 + i * .3, z + .85, .3, 1.2, .35, 1.0 - i * .22);
      for (const x of [-.75, .75]) m.box('steel', x, z + 1.55, .06, .06, .35, 2.05);
      m.box('steel', 0, z + 1.55, 1.56, .05, 2.0, 2.05);
      m.box('yellow', 0, z + .1, .3, .02, 3.3, 3.6);
    });
    m.scope('Transformer kiosk', () => {
      m.box('light', 2.6, -2.2, 1.9, 1.4, .35, 2.3);
      m.box('steel', 2.6, -2.2, 2.1, 1.6, 2.3, 2.42);
      m.box('dark', 2.6, -1.48, 1.2, .04, .6, 1.2);
      m.box('steel', 2.6, -1.48, .8, .04, 1.3, 2.1);
      m.box('yellow', 3.3, -1.48, .25, .04, 1.6, 1.85);
    });
    m.scope('Nacelle', () => {
      m.prism('steel', ngon(32, .74), h - .3, h - .05);
      const sec = (k: number) => chamferedRect(2.3 * k, 2.4 * k, .5 * k, 0, hy);
      m.sweep('light', 'z', sec(.86), 1.25, sec(1), .35);
      m.sweep('light', 'z', sec(1), .35, sec(1), -3.3, false);
      m.sweep('light', 'z', sec(1), -3.3, sec(.78), -4.4);
      // a seam round the body, the cooler on top, the hatch, the wind sensors and the obstruction light
      m.sweep('steel', 'z', sec(1.02), -1.05, sec(1.02), -.95, false);
      const top = hy + 1.2;
      m.box('light', 0, -3.4, 1.5, 1.2, top - .1, top + .45);
      for (let x = -.6; x <= .61; x += .3) m.box('steel', x, -3.4, .05, 1.22, top + .45, top + .6);
      m.box('steel', 0, -.3, .9, 1.1, top - .05, top + .06);
      m.rod('steel', [0, top + .45, -4.05], [0, top + 1.5, -4.05], .04, 6);
      m.box('steel', 0, -4.05, 1.1, .06, top + 1.45, top + 1.51);
      for (const x of [-.55, .55]) m.box('dark', x, -4.05, .12, .12, top + 1.51, top + 1.66);
      m.prism('red', ngon(8, .1, 0, 0, -4.05), top + 1.5, top + 1.68);
    });
  });
  m.part('rotor', [0, hy, BLADE_Z], () => {
    m.scope('Hub and spinner', () => {
      const zs = [1.25, 1.6, 2.5, 3.05, 3.4, 3.58], rs = [.92, 1.02, 1.02, .82, .45, .1];
      for (let i = 0; i + 1 < zs.length; i++) m.sweep('light', 'z', ngon(20, rs[i]!, 0, 0, hy), zs[i]!, ngon(20, rs[i + 1]!, 0, 0, hy), zs[i + 1]!, i === 0 || i + 2 === zs.length);
    });
    m.scope('Blades', () => { for (let i = 0; i < 3; i++) blade(m, hy, r, i * Math.PI * 2 / 3); });
  });
  m.animate({ name: 'wind', times: [0, 2, 4, 6], tracks: [{ node: 'rotor', path: 'rotation', values: [0,0,0,1, 0,0,-Math.sin(Math.PI/3),Math.cos(Math.PI/3), 0,0,-Math.sin(2*Math.PI/3),Math.cos(2*Math.PI/3), 0,0,0,-1] }], drive: { drive: 'time' } });
  return m;
}
const lowBuilders: Record<string, ProceduralDesign['build']> = {industrialMill:industrialMillLod,industrialHall:industrialHallLod,industrialSaw:industrialSawLod,industrialWarehouse:industrialWarehouseLod,industrialChimney:industrialChimneyLod,industrialTank:industrialTankLod,industrialFoundry:industrialFoundryLod,industrialPower:industrialPowerLod,industrialProcess:industrialProcessLod,industrialOilPump:industrialOilPumpLod,industrialWind:industrialWindLod};
const design = (id: string, title: string, build: ProceduralDesign['build'], params: ParamSpec[]): ProceduralDesign => ({ id, title, build, buildLod:lowBuilders[build.name], lodTriangles: /power-plant|chemical-factory/.test(id) ? 500 : 100, params, catalog: INDUSTRY_CATALOG, ...(params.includes(FINISH) ? { finishParams: ['finish'] } : {}) });
export const INDUSTRY: readonly ProceduralDesign[] = [
  design('ind-building-a', 'Brick manufacturing mill', industrialMill, BUILDING_PARAMS),
  design('ind-building-h', 'Ventilated assembly hall', industrialHall, BUILDING_PARAMS),
  design('ind-building-k', 'Daylight sawtooth works', industrialSaw, BUILDING_PARAMS),
  design('ind-building-s', 'Loading warehouse', industrialWarehouse, BUILDING_PARAMS),
  design('ind-chimney-basic', 'Industrial chimney', industrialChimney, CHIMNEY_PARAMS),
  design('ind-detail-tank', 'Industrial storage tanks', industrialTank, TANK_PARAMS),
  design('industry-factory-a', 'Heavy industrial works', industrialFoundry, BUILDING_PARAMS),
  design('industry-power-plant', 'Power generation plant', industrialPower, POWER_PARAMS),
  design('chemical-factory', 'Chemical and refining plant', industrialProcess, PROCESS_PARAMS),
  design('industry-oil-pump', 'Oil pumpjack', industrialOilPump, MACHINE_PARAMS),
  { ...design('industry-wind-turbine', 'Wind turbine', industrialWind, MACHINE_PARAMS), game: { block: { rects: [{ x: 0, z: 0, w: 0.2, d: 0.59 }] } } },
];

// Explicit distant silhouettes: no facade panels, pipework, ladders or railings.
function lowStack(m:MeshBuilder,x:number,z:number,h:number,material='wall'):void {
  lodLoft(m,material,ngon(6,1.35,0,x,z),1.05,ngon(6,.75,0,x,z),h+1.05);
}
function lowHall(m:MeshBuilder,w:number,d:number,h:number,roof='flat'):void {
  lodBox(m,'wall',0,0,w,d,.35,h);
  if(roof==='gable')m.sweep('roof','z',[[-w/2,h],[w/2,h],[0,h+3]],-d/2,[[-w/2,h],[w/2,h],[0,h+3]],d/2);
  else lodBox(m,'roof',0,0,w,d,h,h+.3);
}
function lowBuilding(kind:string,given?:ParamValues):MeshBuilder {
  const p=resolveParams(BUILDING_PARAMS,given),m=model(p.finish),w=p.size==='extended'?24:16;
  if(kind==='foundry')lowHall(m,w,14,10);
  else{
    const s=buildingSpec(kind,p.size);
    if(s.roof==='gable'){lodBox(m,'wall',0,0,s.w,s.d,.35,s.h);m.sweep('roof','z',[[-s.w/2-.5,s.h-.2],[s.w/2+.5,s.h-.2],[0,s.h+s.w*.2]],-s.d/2-.4,[[-s.w/2-.5,s.h-.2],[s.w/2+.5,s.h-.2],[0,s.h+s.w*.2]],s.d/2+.4);}
    else{lodBox(m,'wall',0,0,s.w,s.d,.35,s.h+.9);lodBox(m,'roof',0,0,s.w-.8,s.d-.8,s.h+.9,s.h+.95);}
  }
  if(kind==='mill'){lowStack(m,-w/2-2.4,-4,26);lodBox(m,'wall',-w/2+2.2,-4.8,4.4,4.4,14.95,18.1);}
  if(kind==='warehouse')lodBox(m,'steel',-1.775,9+2.04,w-4.45,4.12,5.2,5.4);
  if(kind==='foundry')for(const x of [-w/2+2,0,w/2-2])lowStack(m,x,-10,24,'light');
  return m;
}
export function industrialMillLod(p?:ParamValues):MeshBuilder{return lowBuilding('mill',p);}
export function industrialHallLod(p?:ParamValues):MeshBuilder{return lowBuilding('hall',p);}
export function industrialSawLod(given?:ParamValues):MeshBuilder{
  const p=resolveParams(BUILDING_PARAMS,given),m=model(p.finish),s=buildingSpec('saw',p.size),tw=s.w/Math.round(s.w/4);
  lodBox(m,'wall',0,0,s.w,s.d,.35,s.h);
  for(let x=-s.w/2;x<s.w/2-.1;x+=tw){const ring:Ring=[[x,s.h],[x+tw-.1,s.h],[x+tw-.1,s.h+2.7]];m.sweep('roof','z',ring,-s.d/2-.3,ring,s.d/2+.3);}
  return m;
}
export function industrialWarehouseLod(p?:ParamValues):MeshBuilder{return lowBuilding('warehouse',p);}
export function industrialFoundryLod(p?:ParamValues):MeshBuilder{return lowBuilding('foundry',p);}
export function industrialChimneyLod(given?:ParamValues):MeshBuilder{
  const p=resolveParams(CHIMNEY_PARAMS,given),m=model();lowStack(m,0,0,p.height==='short'?14:p.height==='medium'?26:40,p.style==='brick'?'wall':'light');return m;
}
export function industrialTankLod(given?:ParamValues):MeshBuilder {
  const p=resolveParams(TANK_PARAMS,given),m=model();
  if(p.layout==='horizontal'){const ring=ngon(8,2.4,0,0,3.7);m.sweep('light','x',ring,-5,ring,5);}
  else for(const x of p.layout==='cluster'?[-3.5,3.5]:[0])lodCylinder(m,'light',x,0,2.4,.76,8.6,8);
  return m;
}
function lowCooling(m:MeshBuilder,x:number,z:number):void{
  const a=ngon(8,5.5,0,x,z),b=ngon(8,3,0,x,z),c=ngon(8,3.7,0,x,z);
  m.loft('concrete',a,.5,b,13,false);m.loft('concrete',b,13,c,20,true);m.cap('concrete',a,.5,false);
}
export function industrialPowerLod(given?:ParamValues):MeshBuilder {
  const p=resolveParams(POWER_PARAMS,given),m=model('cream');lowHall(m,16,12,8,'gable');lowCooling(m,-15,-8);
  if(p.type==='nuclear'){lowCooling(m,15,-8);lodCylinder(m,'light',0,-12,4,.36,9,8);}
  else lowStack(m,15,-8,28,'light');
  if(p.type==='coal')lodBox(m,'dark',-14,7,9,7,.4,3.4);
  return m;
}
export function industrialProcessLod(given?:ParamValues):MeshBuilder {
  const p=resolveParams(PROCESS_PARAMS,given),m=model('blue');
  for(let i=0;i<3;i++){const x=-11+i*7;lodCylinder(m,'light',x,8,2.5,.76,7.6,8);lodCylinder(m,'light',x,-6,1.6,.76,(p.type==='refinery'?18:12)+i*2+1.6,8);}
  lodBox(m,'wall',13,6,6,9,.36,4.3);if(p.type==='refinery')lowStack(m,13,-8,23,'light');return m;
}
export function industrialOilPumpLod(given?:ParamValues):MeshBuilder {
  const p=resolveParams(MACHINE_PARAMS,given),m=model(),h=p.size==='large'?9:6;
  for(const z of [-1.3,1.3]){
    m.slab('steel',[[-2,.4,z],[-.8,h,z],[-.4,h,z],[-1.6,.4,z]],[0,0,.22]);
    m.slab('steel',[[.6,.4,z],[-.4,h,z],[0,h,z],[1,.4,z]],[0,0,.22]);
  }
  m.slab('steel',[[-5,h+.5,-.35],[5,h+1,-.35],[5,h+1.6,-.35],[-5,h+1.1,-.35]],[0,0,.7]);
  m.slab('red',[[4.5,h+1,-.6],[5.5,h+1.8,-.6],[6,h+.8,-.6],[5.7,h-1,-.6],[4.9,h-1,-.6]],[0,0,1.2]);
  lodBox(m,'roof',-4.4,0,1.6,2,.36,2.3);return m;
}
export function industrialWindLod(given?:ParamValues):MeshBuilder {
  const p=resolveParams(MACHINE_PARAMS,given),m=model(),h=p.size==='large'?42:28,r=h*.4,hy=h+HUB_RISE;
  lodLoft(m,'light',ngon(6,1.45),.35,ngon(6,.65),h);lodBox(m,'light',0,-1.55,2.3,5.6,hy-1.2,hy+1.2);
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3,point=(x:number,y:number):[number,number,number]=>[x*Math.cos(a)-y*Math.sin(a),hy+x*Math.sin(a)+y*Math.cos(a),BLADE_Z-.1];
    m.slab('light',[point(-.45,.65),point(-.25,r),point(.22,r),point(.65,3)],[0,0,.2]);
  }return m;
}
