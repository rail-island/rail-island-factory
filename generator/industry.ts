import { lodBox, lodLoft, lodCylinder } from './lodPrimitives.ts';
// Industrial architecture in metres. See docs/models/industry.md.
import { MeshBuilder, ngon, type Ring } from './meshBuilder.ts';
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
  return new MeshBuilder({ wall: { color: finish === 'blue' ? '#607f96' : finish === 'cream' ? '#d3c8ac' : '#a35f48' }, steel: { color: '#405560', metallic: .45 }, light: { color: '#d9ded6' }, roof: { color: '#394951' }, glass: { color: '#78b7bf', metallic: .3 }, concrete: { color: '#a6aaa2' }, yellow: { color: '#edb64c' }, red: { color: '#bd5542' }, dark: { color: '#26343b' } });
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
function stack(m: MeshBuilder, x: number, z: number, h: number, style = 'brick', y = .35): void {
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
function hall(m: MeshBuilder, w: number, d: number, h: number, roof: string): void {
  m.scope('Structure and facade', () => {
    m.box('wall', 0, 0, w, d, .35, h);
    for (let x = -w / 2 + .35; x < w / 2 - 2.5; x += 3) {
      for (const s of [-1, 1]) {
        m.box('concrete', x, s * (d / 2 + .1), .22, .22, .4, h + .1);
        for (let y = 2.3; y < h - 1; y += 2.8) {
          m.box('steel', x + 1.35, s * (d / 2 + .16), 2.25, .16, y, y + 1.65);
          m.box('glass', x + 1.35, s * (d / 2 + .26), 2, .08, y + .12, y + 1.5);
          m.box('light', x + 1.35, s * (d / 2 + .32), .08, .08, y + .13, y + 1.49);
        }
      }
    }
    for (const s of [-1, 1]) for (let z = -d / 2 + 2; z < d / 2; z += 3) {
      m.box('steel', s * (w / 2 + .12), z, .16, 2.3, 2, 4.1);
      m.box('glass', s * (w / 2 + .23), z, .08, 2.05, 2.15, 3.95);
    }
  });
  m.scope('Roof and daylight', () => {
    if (roof === 'saw') {
      for (let x = -w / 2; x < w / 2 - .1; x += 4) {
        const section: Ring = [[x, h], [x + 3.95, h], [x + 3.95, h + 2.3]];
        m.sweep('roof', 'z', section, -d / 2 - .18, section, d / 2 + .18);
        m.box('glass', x + 4, 0, .035, d - .8, h + .3, h + 2.1);
      }
    } else if (roof === 'gable') {
      const section: Ring = [[-w / 2 - .25, h], [w / 2 + .25, h], [0, h + 3]];
      m.sweep('roof', 'z', section, -d / 2 - .2, section, d / 2 + .2);
      m.box('steel', 0, 0, 1.3, d * .65, h + 2.9, h + 3.65);
    } else {
      m.box('roof', 0, 0, w + .4, d + .4, h + .02, h + .3);
      for (const s of [-1, 1]) m.box('light', 0, s * (d / 2 + .15), w + .5, .16, h + .3, h + .65);
      for (let x = -w / 2 + 2; x < w / 2; x += 5) {
        m.box('steel', x, -1, 2.2, 2.8, h + .31, h + .7);
        m.box('glass', x, -1, 1.9, 2.5, h + .71, h + .81);
        cyl(m, 'light', x, -d / 2 + 1.5, .45, h + .31, 1.1, 12);
        cyl(m, 'steel', x, -d / 2 + 1.5, .65, h + 1.42, .12, 12);
      }
    }
  });
}
function docks(m: MeshBuilder, w: number, z: number): void {
  m.scope('Loading docks', () => {
    for (let x = -w / 2 + 2.5; x < w / 2 - 2; x += 5) {
      m.box('dark', x, z + .2, 3.4, .25, .5, 3.6);
      m.box('light', x, z + .36, 2.9, .1, .8, 3.4);
      for (let y = 1; y < 3.4; y += .3) m.box('steel', x, z + .43, 2.85, .035, y, y + .035);
      m.box('steel', x, z + 1.1, 3.6, 2, .36, .75);
      for (const dx of [-1.8, 1.8]) cyl(m, 'yellow', x + dx, z + 1.7, .12, .35, 1.25, 8);
    }
  });
}
function building(kind: string, given?: ParamValues): MeshBuilder {
  const p = resolveParams(BUILDING_PARAMS, given), m = model(p.finish);
  const w = p.size === 'extended' ? 24 : 16, d = kind === 'warehouse' ? 18 : 14, h = kind === 'mill' ? 12 : 6;
  return m.scope("Industrial assembly", () => {
  base(m, w + 8, d + 8);
  hall(m, w, d, h, kind === 'saw' ? 'saw' : kind === 'hall' ? 'gable' : 'flat');
  docks(m, w, d / 2);
  if (kind === 'mill') {
    stack(m, -w / 2 - 2.4, -4, 22);
    m.box('steel', w / 2 + 1.2, -2, 2, 8, 6, 6.25);
    rail(m, w / 2 + 1.2, 2, 2, 6.25);
    ladder(m, w / 2 + 2.3, -2, .35, 6);
  }
  if (kind === 'warehouse') {
    m.box('steel', 0, d / 2 + 2, w, 3.6, 4, 4.2);
    for (let x = -w / 2 + .5; x < w / 2; x += 5) m.box('yellow', x, d / 2 + 3.5, .14, .14, .35, 4);
  }
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
  const ys = [.5, 2, 5, 9, 13, 17, 20], rs = [5.5, 5.2, 4.3, 3.3, 3, 3.3, 3.7];
  for (let i = 0; i < ys.length - 1; i++) m.loft('concrete', ngon(32, rs[i]!, 0, x, z), ys[i]!, ngon(32, rs[i + 1]!, 0, x, z), ys[i + 1]!, false);
  m.loft('light', ngon(32, 3.7, 0, x, z), 20, ngon(32, 3.4, 0, x, z), 20, false);
  m.loft('dark', ngon(32, 3.4, 0, x, z), 20, ngon(32, 3.1, 0, x, z), 17, false);
}
export function industrialPower(given?: ParamValues): MeshBuilder {
  const p = resolveParams(POWER_PARAMS, given), m = model('cream'); return m.scope("Industrial assembly", () => {
  base(m, 46, 38);
  m.scope('Turbine hall', () => { hall(m, 16, 12, 8, 'gable'); docks(m, 16, 6); });
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
  if (p.type === 'refinery') stack(m, 13, -8, 23, 'steel');
  return m;
  });
}
export function industrialFoundry(given?: ParamValues): MeshBuilder {
  const p = resolveParams(BUILDING_PARAMS, given), m = model(p.finish), w = p.size === 'extended' ? 24 : 16;
  return m.scope("Industrial assembly", () => {
  base(m, w + 12, 26); hall(m, w, 14, 10, 'saw'); docks(m, w, 7);
  for (const x of [-w / 2 + 2, 0, w / 2 - 2]) stack(m, x, -10, 24, 'striped');
  m.box('steel', w / 2 + 2.5, 0, 3, 10, 5, 5.25); rail(m, w / 2 + 2.5, 5, 3, 5.25);
  ladder(m, w / 2 + 4.1, 0, .35, 5); return m;
  });
}
export function industrialOilPump(given?: ParamValues): MeshBuilder {
  const p = resolveParams(MACHINE_PARAMS, given), m = model(), h = p.size === 'large' ? 9 : 6;
  return m.scope("Industrial assembly", () => {
  base(m, 14, 8);
  for (const z of [-1.3, 1.3]) {
    m.slab('steel', [[-2,.4,z],[-.8,h,z],[-.4,h,z],[-1.6,.4,z]], [0,0,.22]);
    m.slab('steel', [[.6,.4,z],[-.4,h,z],[0,h,z],[1,.4,z]], [0,0,.22]);
    for (let y = 1.5; y < h; y += 1.3) m.box('steel', -.5, z, 2.2 - y / h, .25, y, y + .14);
    m.slab('light', [[-3,2,z],[-3.15,h+.3,z],[-2.95,h+.3,z],[-2.8,2,z]], [0,0,.15]);
    const wheel = ngon(20, .95, 0, -2.7, 2);
    m.sweep('steel', 'z', wheel, z-.14, wheel, z+.14);
    const hub = ngon(12, .25, 0, -2.7, 2);
    m.sweep('yellow', 'z', hub, z-.2, hub, z+.2);
    m.box('yellow', -2.7, z, 2.5, .6, 1.1, 2.4);
  }
  m.box('steel', 0, 0, 1, 3.3, h, h + .6);
  m.slab('steel', [[-5,h+.5,-.35],[5,h+1,-.35],[5,h+1.6,-.35],[-5,h+1.1,-.35]], [0,0,.7]);
  m.slab('red', [[4.5,h+1,-.6],[5.5,h+1.8,-.6],[6,h+.8,-.6],[5.7,h-1,-.6],[4.9,h-1,-.6]], [0,0,1.2]);
  cyl(m, 'steel', 5.5, 0, .09, .6, h - 1.5, 8); cyl(m, 'yellow', 5.5, 0, .4, .4, .6);
  m.box('roof', -4, 0, 2.5, 2, .36, 1.4); ladder(m, -1, 1.65, .4, h); return m;
  });
}
export function industrialWind(given?: ParamValues): MeshBuilder {
  const p = resolveParams(MACHINE_PARAMS, given), m = model(), h = p.size === 'large' ? 42 : 28, r = h * .4;
  m.part('tower', [0,0,0], () => { base(m, 8, 8); m.loft('light', ngon(24, 1.4), .35, ngon(24, .65), h); m.box('light', 0, -.8, 2.4, 4, h - .6, h + 1); ladder(m, 0, 1.5, .35, 3); });
  m.part('rotor', [0,h,1.6], () => {
    const ring = ngon(16, .85, 0, 0, h); m.sweep('steel', 'z', ring, 1.3, ring, 2.5);
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3;
      const point = (x: number, y: number): [number, number, number] => [x * Math.cos(a) - y * Math.sin(a), h + x * Math.sin(a) + y * Math.cos(a), 1.8];
      m.slab('light', [point(-.45,.65),point(-.8,3),point(-.25,r),point(.22,r),point(.65,3),point(.45,.65)], [0,0,.2]);
    }
  });
  m.animate({ name: 'wind', times: [0, 2, 4, 6], tracks: [{ node: 'rotor', path: 'rotation', values: [0,0,0,1, 0,0,-Math.sin(Math.PI/3),Math.cos(Math.PI/3), 0,0,-Math.sin(2*Math.PI/3),Math.cos(2*Math.PI/3), 0,0,0,-1] }] });
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
  design('industry-wind-turbine', 'Wind turbine', industrialWind, MACHINE_PARAMS),
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
  lowHall(m,w,kind==='warehouse'?18:14,kind==='mill'?12:kind==='foundry'?10:6,kind==='hall'?'gable':'flat');
  if(kind==='mill')lowStack(m,-w/2-2.4,-4,22);
  if(kind==='foundry')for(const x of [-w/2+2,0,w/2-2])lowStack(m,x,-10,24,'light');
  return m;
}
export function industrialMillLod(p?:ParamValues):MeshBuilder{return lowBuilding('mill',p);}
export function industrialHallLod(p?:ParamValues):MeshBuilder{return lowBuilding('hall',p);}
export function industrialSawLod(given?:ParamValues):MeshBuilder{
  const p=resolveParams(BUILDING_PARAMS,given),m=model(p.finish),w=p.size==='extended'?24:16;
  lodBox(m,'wall',0,0,w,14,.35,6);
  for(let x=-w/2;x<w/2-.1;x+=4){const ring:Ring=[[x,6],[x+3.95,6],[x+3.95,8.3]];m.sweep('roof','z',ring,-7,ring,7);}
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
  lodBox(m,'roof',-4,0,2.5,2,.36,1.4);return m;
}
export function industrialWindLod(given?:ParamValues):MeshBuilder {
  const p=resolveParams(MACHINE_PARAMS,given),m=model(),h=p.size==='large'?42:28,r=h*.4;
  lodLoft(m,'light',ngon(6,1.4),.35,ngon(6,.65),h);lodBox(m,'light',0,-.8,2.4,4,h-.6,h+1);
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3,point=(x:number,y:number):[number,number,number]=>[x*Math.cos(a)-y*Math.sin(a),h+x*Math.sin(a)+y*Math.cos(a),1.8];
    m.slab('light',[point(-.45,.65),point(-.25,r),point(.22,r),point(.65,3)],[0,0,.2]);
  }return m;
}
