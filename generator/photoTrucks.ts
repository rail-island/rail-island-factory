// Photo-based rigid trucks. Metres, +X forward, +Y up, +Z right.
import { MeshBuilder, ngon, type Ring, type MaterialSpec } from './meshBuilder.ts';
import { block, side, arc, plate, steeredWheels } from './vehicleParts.ts';
import { strokeText } from './strokeFont.ts';
import { rollWheels } from './rolling.ts';
import type { ProceduralDesign } from './design.ts';
import { blockPart, profileBody, sectionBody, truckLod } from './lodRoad.ts';

const palette: Record<string, MaterialSpec> = {
  paint: { color: '#a84548', roughness: .72 }, bed: { color: '#86423d', roughness: .9 },
  trim: { color: '#292d30' }, rubber: { color: '#262729', roughness: 1 },
  rim: { color: '#777b79', metallic: .25 }, glass: { color: '#334d59', roughness: .2, metallic: .15, glass: true },
  light: { color: '#f5efd8', lamp: { role: 'head' } }, amber: { color: '#e69935', lamp: { role: 'indicator' } }, red: { color: '#a52826', lamp: { role: 'tail' } },
  // the lettering and the side markers, in the lamps' colours but never lit
  letter: { color: '#f5efd8' }, marker: { color: '#e69935' },
  canvas: { color: '#aaa38c', roughness: 1 }, silver: { color: '#bdc3c3', metallic: .3 },
  grille: { color: '#171d20' },
};
type Kind = 'tatra' | 'praga' | 'atego';
interface Spec { kind: Kind; rear: number[]; front: number; r: number; end: number; nose: number; hw: number; }
const specs: Record<Kind, Spec> = {
  tatra: { kind: 'tatra', rear: [-2.28, - .96], front: 2.43, r: .57, end: -3.48, nose: 3.45, hw: 1.22 },
  praga: { kind: 'praga', rear: [-1.9, -.75], front: 2.0, r: .51, end: -2.95, nose: 3.02, hw: .99 },
  atego: { kind: 'atego', rear: [-2.62], front: 3.05, r: .47, end: -4.5, nose: 4.28, hw: 1.15 },
};
const ay = (s: Spec) => s.r * Math.cos(Math.PI / 16);
function disk(m: MeshBuilder, mat: string, axis: 'x' | 'z', u: number, v: number, radius: number, a: number, b: number, n = 16) {
  const ring = ngon(n, radius, Math.PI / n, u, v); m.sweep(mat, axis, ring, a, ring, b);
}
/**
 * One wheel: the tyre, and on its outer face (`face`) the rim, hub and wheel nuts
 * as the rolling part `spin` (rolling.ts) -- the plain tyre looks the same at any
 * angle and stays with the node that carries the wheel.
 */
function wheel(m: MeshBuilder, s: Spec, x: number, z0: number, z1: number, face: number, spin: string) {
  disk(m, 'rubber', 'z', x, ay(s), s.r, z0 + .025, z1 - .025);
  disk(m, 'rubber', 'z', x, ay(s), s.r * .94, z0, z1);
  const f = face > 0 ? z1 : z0;
  m.spin(spin, [x, ay(s), (z0 + z1) / 2], () => {
    disk(m, 'rim', 'z', x, ay(s), s.r * .61, f - face * .02, f + face * .018);
    disk(m, 'trim', 'z', x, ay(s), s.r * .24, f, f + face * .07, 10);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      disk(m, 'grille', 'z', x + Math.cos(a) * s.r * .43, ay(s) + Math.sin(a) * s.r * .43, .032, f + face * .012, f + face * .027, 6);
    }
  });
}
/** The rolling part of a rear wheel (rolling.ts): wheel-rear-<axle, from the front>-<left|right>. */
function rearWheel(s: Spec, x: number, sign: number): string {
  return `wheel-rear-${s.rear.indexOf(x) + 1}-${sign < 0 ? 'left' : 'right'}`;
}
function frontText(m: MeshBuilder, text: string, x: number, y: number, h: number, width: number) {
  m.facets('letter', strokeText(text, width / 2, y, h, width / text.length * .7, width / text.length * .3, true).map(([z, yy]) => [x, yy, z]), [1, 0, 0]);
}
function chassis(m: MeshBuilder, s: Spec) {
  m.scope('chassis and running gear', () => {
    for (const sign of [-1, 1]) block(m, 'trim', s.end + .12, s.nose - .15, .66, .86, ...side(sign, s.kind === 'praga' ? .24 : .32, s.kind === 'praga' ? .34 : .43));
    for (const x of [s.front, ...s.rear]) {
      m.scope(`axle ${x}`, () => {
        disk(m, 'trim', 'z', x, ay(s), .065, -.81, .81, 8);
        if (x !== s.front) for (const sign of [-1, 1]) {
          const [z0, z1] = side(sign, s.hw - .33, s.hw);
          wheel(m, s, x, z0, z1, sign, rearWheel(s, x, sign));
        }
      });
    }
    for (const sign of [-1, 1]) {
      block(m, 'trim', s.end + .05, s.end + .2, .4, .55, ...side(sign, .5, s.hw));
      block(m, 'red', s.end + .025, s.end + .07, .58, .73, ...side(sign, .62, s.hw - .1));
      block(m, 'rim', -.1, .85, .52, .99, ...side(sign, .47, .89));
      for (const x of [.02, .7]) block(m, 'trim', x, x + .045, .5, 1.01, ...side(sign, .88, .91));
    }
  });
}
function arch(m: MeshBuilder, s: Spec, x: number, sign: number, mat: string) {
  plate(m, mat, arc(x, ay(s), s.r + .18, 0, Math.PI, 12), arc(x, ay(s), s.r + .12, 0, Math.PI, 12), ...side(sign, s.hw - .4, s.hw + .035));
}
/** A cab-over's measures: its back wall, roof, glass's bottom and side profile (x, y), swept across the cab. */
function caboverShape(s: Spec) {
  const a = s.kind === 'atego'; const back = a ? 2.12 : 1.18; const top = a ? 2.93 : 3.04;
  const front = s.nose; const glassBottom = a ? 1.89 : 2.02;
  const profile: Ring = [[back, 1.29], [front, 1.29], [front, glassBottom], [front - .23, top - .12], [front - .35, top], [back + .1, top], [back, top - .1]];
  return { a, back, top, front, glassBottom, profile };
}
function cabover(m: MeshBuilder, s: Spec) {
  const { a, back, top, front, glassBottom, profile } = caboverShape(s);
  m.scope('cab shell and glazing', () => {
    m.sweep('paint', 'z', profile, -s.hw, profile, s.hw);
    const xf = (y: number) => front - .23 * (y - glassBottom) / (top - .12 - glassBottom);
    m.slab('glass', [[xf(glassBottom+.07)+.015,glassBottom+.07,-s.hw+.13],[xf(glassBottom+.07)+.015,glassBottom+.07,s.hw-.13],[xf(top-.19)+.015,top-.19,s.hw-.13],[xf(top-.19)+.015,top-.19,-s.hw+.13]], [-.035,0,0]);
    for (const sign of [-1, 1]) {
      const windowBack = back + (a ? .18 : .62);
      m.slab('glass', [[windowBack, glassBottom+.05, sign*(s.hw+.012)], [front-.3,glassBottom+.05,sign*(s.hw+.012)], [front-.48,top-.2,sign*(s.hw+.012)],[windowBack,top-.2,sign*(s.hw+.012)]], [0,0,-sign*.035]);
      block(m,'trim',back+.16,back+.42,1.76,1.8,...side(sign,s.hw-.01,s.hw+.025));
      block(m,'trim',back+.08,back+.1,1.35,glassBottom,...side(sign,s.hw-.01,s.hw+.012));
      block(m,'trim',front-.48,front-.43,2.25,2.75,...side(sign,s.hw+.045,s.hw+.15));
      block(m,'rim',front-.5,front-.45,2.65,2.69,...side(sign,s.hw-.015,s.hw+.15));
      arch(m,s,s.front,sign,'trim');
      block(m,'trim',back-.12,back+.1,.6,1.15,...side(sign,s.hw-.28,s.hw));
      block(m,'silver',back-.15,back+.14,.68,.73,...side(sign,s.hw-.29,s.hw+.02));
      block(m,'silver',back-.15,back+.14,.98,1.03,...side(sign,s.hw-.29,s.hw+.02));
      m.slab('trim', [[xf(glassBottom+.09)+.03,glassBottom+.09,sign*.13],[xf(glassBottom+.09)+.03,glassBottom+.09,sign*.16],[xf(glassBottom+.25)+.03,glassBottom+.25,sign*.77],[xf(glassBottom+.27)+.03,glassBottom+.27,sign*.77]],[-.015,0,0]);
    }
  });
  m.scope('bumper grille and badges', () => {
    block(m,'trim',front-.1,front+.07,.48,.89,-s.hw,s.hw);
    for (const sign of [-1,1]) {
      if (a) block(m,'light',front+.055,front+.09,.6,.79,...side(sign,.74,1.04));
      else disk(m,'light','x',sign*.87,.69,.115,front+.055,front+.09);
      block(m,'amber',front+.055,front+.092,.64,.76,...side(sign,1.06,1.14));
    }
    for (const y of a ? [1.38,1.5,1.62] : [1.4,1.63]) block(m,'grille',front-.01,front+.018,y,y+.085,-.55,.55);
    block(m,'silver',front+.07,front+.092,.5,.61,-.27,.27);
    if (!a) frontText(m,'TATRA',front+.025,1.82,.13,1.02);
    else {
      disk(m,'silver','x',0,1.74,.13,front+.02,front+.04);
      disk(m,'grille','x',0,1.74,.105,front+.035,front+.045);
      for (let i=0;i<3;i++) { const angle=i*Math.PI*2/3; m.slab('silver',[[front+.052,1.74,0],[front+.052,1.74+Math.cos(angle)*.1,Math.sin(angle)*.1],[front+.052,1.74+Math.cos(angle+.13)*.1,Math.sin(angle+.13)*.1]],[-.01,0,0]); }
    }
  });
}
function bed(m: MeshBuilder, s: Spec, front: number, y: number, height: number) {
  m.scope('cargo bed and tailgate', () => {
    block(m,'bed',s.end,front,y,y+.12,-s.hw,s.hw);
    for(const sign of [-1,1]) {
      block(m,'bed',s.end,front,y+.1,y+height,...side(sign,s.hw-.085,s.hw));
      for(const yy of [y+.15,y+height/2,y+height-.06]) block(m,'paint',s.end-.025,front+.025,yy,yy+.055,...side(sign,s.hw-.02,s.hw+.025));
      for(let x=s.end+.1;x<front;x+=.88) block(m,'paint',x,x+.065,y+.09,y+height+.03,...side(sign,s.hw-.02,s.hw+.04));
    }
    for (const x of [s.end,front-.08]) block(m,'bed',x,x+.08,y+.12,y+height,-s.hw+.086,s.hw-.086);
    for(const sign of [-1,1]) for(const x of [s.end+.12,front-.2]) block(m,'trim',x,x+.12,y+.2,y+.31,...side(sign,s.hw+.025,s.hw+.06));
  });
}
function tatra(m: MeshBuilder, s: Spec) {
  cabover(m,s); bed(m,s,.83,1.36,1.05);
  m.scope('tipper headboard and hydraulics',()=>{
    block(m,'bed',.77,.9,1.48,2.94,-1.22,1.22);
    block(m,'bed',.78,1.14,2.9,2.98,-1.22,1.22);
    block(m,'rim',-.4,.1,.9,1.35,-.18,.18);
    disk(m,'trim','z',1,1.94,.39,-1.02,-.78);
    block(m,'trim',1.05,1.15,1.35,3.22,.77,.86);
  });
}
/** The Praga's cab side profile (x, y), bonnet and canopy cross-sections (z, y). */
const PRAGA_CAB: Ring = [[.35,1.08],[1.62,1.08],[1.62,2.41],[1.51,2.57],[.48,2.57],[.35,2.44]];
const PRAGA_BONNET: Ring = [[-.57,1.03],[.57,1.03],[.57,1.86],[.45,2.02],[-.45,2.02],[-.57,1.86]];
const PRAGA_CANOPY: Ring = [[-.98,1.85],[.98,1.85],[.98,2.58],[.88,2.88],[.58,3.02],[-.58,3.02],[-.88,2.88],[-.98,2.58]];
function praga(m: MeshBuilder, s: Spec) {
  m.scope('rounded cab',()=>{
    const p = PRAGA_CAB;
    m.sweep('paint','z',p,-.94,p,.94);
    for(const sign of [-1,1]) {
      block(m,'glass',1.61,1.64,1.87,2.42,...side(sign,.055,.83));
      block(m,'glass',.49,1.44,1.86,2.4,...side(sign,.93,.956));
      block(m,'trim',.5,.73,1.66,1.7,...side(sign,.94,.97));
      block(m,'paint',.36,1.35,.73,.79,...side(sign,.65,1.02));
      arch(m,s,s.front,sign,'paint');
      disk(m,'paint','x',sign*.85,1.47,.19,2.77,2.96);
      disk(m,'light','x',sign*.85,1.47,.15,2.955,2.978);
      disk(m,'rim','x',sign*1.02,2.13,.09,1.55,1.59);
    }
  });
  m.scope('long bonnet radiator and bumper',()=>{
    const p = PRAGA_BONNET;
    m.sweep('paint','x',p,1.6,p,2.91);
    block(m,'grille',2.9,2.935,1.02,1.85,-.49,.49);
    for(let z=-.43;z<.5;z+=.107) block(m,'rim',2.93,2.947,1.04,1.83,z,z+.015);
    for(let y=1.1;y<1.85;y+=.12) block(m,'trim',2.936,2.95,y,y+.012,-.48,.48);
    block(m,'paint',2.95,3.07,.88,.98,-1.12,1.12);
    for(const sign of [-1,1]) for(let x=1.78;x<2.72;x+=.115) block(m,'trim',x,x+.025,1.65,1.84,...side(sign,.56,.59));
    block(m,'trim',3.065,3.09,.69,.86,-.3,.3); frontText(m,'4.171',3.095,.73,.09,.49);
  });
  bed(m,s,.18,1.16,.69);
  m.scope('canvas canopy with bows and ties',()=>{
    const p = PRAGA_CANOPY;
    m.sweep('canvas','x',p,s.end+.02,p,.16);
    for(const sign of [-1,1]) for(let x=s.end+.18;x<.16;x+=.55) {
      block(m,'trim',x,x+.025,1.72,1.95,...side(sign,.97,1.005));
      block(m,'canvas',x,x+.035,1.96,2.56,...side(sign,.975,.995));
    }
  });
}
function atego(m: MeshBuilder,s: Spec) {
  cabover(m,s);
  m.scope('curtainside body',()=>{
    block(m,'canvas',s.end,1.9,1.25,3.8,-1.23,1.23);
    block(m,'paint',1.88,2,1.2,3.86,-1.25,1.25);
    for(const sign of [-1,1]) {
      for(const y of [1.22,3.78]) block(m,'silver',s.end-.03,1.94,y,y+.07,...side(sign,1.21,1.26));
      block(m,'paint',s.end-.035,s.end+.055,1.24,3.84,...side(sign,1.2,1.265));
      for(let x=s.end+.18;x<1.8;x+=.37) block(m,'trim',x,x+.035,1.26,1.35,...side(sign,1.23,1.25));
      block(m,'trim',-1.98,1.95,.61,.76,...side(sign,.99,1.09));
      for(const x of [-1.5,.1,1.6]) block(m,'marker',x,x+.095,1.19,1.25,...side(sign,1.23,1.27));
      arch(m,s,s.rear[0]!,sign,'trim');
      block(m,'silver',2.14,4.05,1.57,1.615,...side(sign,s.hw-.01,s.hw+.02));
    }
    block(m,'silver',s.end-.035,s.end+.01,1.3,3.79,-1.16,1.16);
    for(const z of [-.82,-.04,.04,.82]) block(m,'trim',s.end-.06,s.end-.02,1.4,3.7,z-.016,z+.016);
    for(const y of [1.6,2.4,3.2]) for(const sign of [-1,1]) block(m,'rim',s.end-.075,s.end-.03,y,y+.055,...side(sign,.96,1.19));
  });
}
function colorsOf(kind: Kind): Record<string, MaterialSpec> {
  const colors={...palette};
  if(kind==='praga') { colors.paint={color:'#747762'}; colors.bed={color:'#737561'}; colors.rim={color:'#737561'}; }
  if(kind==='atego') { colors.paint={color:'#008fc5'}; colors.canvas={color:'#d5d7d5',roughness:.92}; colors.rim={color:'#b8bfc3',metallic:.3}; }
  return colors;
}
function build(kind: Kind, draw: (m: MeshBuilder, s: Spec) => void): MeshBuilder {
  const s=specs[kind]; const colors=colorsOf(kind);
  const m=new MeshBuilder(colors);
  m.part('body',[0,0,0],()=>{ chassis(m,s); draw(m,s); });
  const tyre: [number,number]=[s.hw-.32,s.hw];
  // a steered wheel steers its node and rolls a child of it, so the two turns never meet
  const spin=(sign:number)=>`wheel-front-${sign<0?'left':'right'}-spin`;
  const nodes=steeredWheels(m,'body',s.front,ay(s),(sign,z0,z1)=>m.scope('tyre rim and hub',()=>wheel(m,s,s.front,z0,z1,sign,spin(sign))),tyre);
  m.rig={steer:{axles:[{nodes,wheelbase:s.front-s.rear.reduce((a,b)=>a+b,0)/s.rear.length}],track:tyre[0]+tyre[1],maxAngleDeg:40}};
  // the wheel nuts roll with the distance travelled
  rollWheels(m,[spin(-1),spin(1),...s.rear.flatMap((x)=>[-1,1].map((sign)=>rearWheel(s,x,sign)))],2*s.r);
  return m;
}
export function tatra815Tipper(){return build('tatra', tatra);}
export function pragaRv(){return build('praga', praga);}
export function mercedesAtego1224(){return build('atego', atego);}

// --- from afar (lodRoad.ts truckLod) ---------------------------------------------------------
//
// The cab (a cab-over's profile carried down to its bumper, or the Praga's cab
// and bonnet), the load as masses -- the tipper's body and headboard, the
// canopy over its bed, the curtainside box --, the chassis between the wheels,
// and a dark disc per wheel.

/** The wheels of `s` as discs just outside its sides. */
const lodWheels = (s: Spec) => ({ mat: 'trim', r: s.r, axles: [s.front, ...s.rear].map((x) => ({ x, z: s.hw + .04 })) });
/** A cab-over from afar: its profile from the bumper up, the lower part dark, the windscreen, side windows and grille. */
function caboverLod(s: Spec) {
  const { back, top, front, glassBottom, profile } = caboverShape(s);
  const low: Ring = profile.map(([x, y]) => [x, y === 1.29 ? .48 : y]);
  return {
    body: profileBody(low, s.hw, { side: [[.48, 1.29, 'trim'], [1.29, top, 'paint']], frontEnd: [[.48, .89, 'trim'], [.89, top, 'paint']], roof: 'paint' }),
    windscreen: { half: s.hw - .13, y: [glassBottom + .07, top - .19] as const },
    sideWindows: [{ x: [back + (s.kind === 'atego' ? .18 : .62), front - .42] as const, y: [glassBottom + .05, top - .2] as const }],
    front: [{ half: .55, y: [1.38, s.kind === 'atego' ? 1.705 : 1.715] as const, mat: 'grille', optional: 15 }],
  };
}
export function tatra815TipperLod(): MeshBuilder {
  const s = specs.tatra;
  return truckLod({
    palette: colorsOf('tatra'), cab: caboverLod(s),
    parts: [
      blockPart('chassis', 'trim', [s.end + .12, 1.18], [.62, 1.36], [-.9, .9], { top: false }),
      blockPart('tipper body', 'bed', [s.end, .83], [1.36, 2.41], [-s.hw, s.hw]),
      blockPart('headboard', 'bed', [.77, 1.14], [2.41, 2.98], [-s.hw, s.hw], { optional: 18 }),
    ],
    wheels: lodWheels(s),
  }, 100);
}
export function pragaRvLod(): MeshBuilder {
  const s = specs.praga;
  const cab = profileBody(PRAGA_CAB.map(([x, y]) => [x, y === 1.08 ? .73 : y] as [number, number]), .94, { side: [[.73, 2.57, 'paint']], roof: 'paint' });
  return truckLod({
    palette: colorsOf('praga'),
    cab: { body: cab, windscreen: { half: .83, y: [1.87, 2.4] }, sideWindows: [{ x: [.49, 1.44], y: [1.86, 2.4] }] },
    masses: [
      { name: 'bonnet', body: sectionBody(PRAGA_BONNET, 1.6, 2.91, { side: [[1.03, 2.02, 'paint']], roof: 'paint', ends: [1] }), rects: [{ end: 1, u: [-.49, .49], y: [1.03, 1.84], mat: 'grille', optional: 16 }] },
      { name: 'bed and canopy', body: sectionBody([[-s.hw, 1.16], [s.hw, 1.16], ...PRAGA_CANOPY.slice(2, 6), [-s.hw, 2.58]], s.end, .18, { side: [[1.16, 1.85, 'bed'], [1.85, 3.02, 'canvas']], roof: 'canvas' }) },
    ],
    parts: [
      blockPart('fenders and running boards', 'paint', [.36, 2.7], [.73, 1.12], [-1.02, 1.02], { optional: 17 }),
      blockPart('chassis', 'trim', [s.end + .12, .35], [.62, 1.16], [-.6, .6], { top: false }),
    ],
    wheels: lodWheels(s),
  }, 100);
}
export function mercedesAtego1224Lod(): MeshBuilder {
  const s = specs.atego;
  const box: Ring = [[-1.23, 1.25], [1.23, 1.25], [1.23, 3.8], [-1.23, 3.8]];
  return truckLod({
    palette: colorsOf('atego'), cab: caboverLod(s),
    masses: [{ name: 'curtainside body', body: sectionBody(box, s.end, 2, { side: [[1.25, 1.32, 'silver'], [1.32, 3.73, 'canvas'], [3.73, 3.8, 'silver']], frontEnd: [[1.25, 3.8, 'paint']], rearEnd: [[1.25, 3.8, 'silver']], roof: 'canvas' }) }],
    parts: [blockPart('chassis', 'trim', [s.end + .1, 2.14], [.58, 1.25], [-1.06, 1.06], { top: false })],
    wheels: lodWheels(s),
  }, 100);
}
const catalog = {category:'Road vehicles',group:'truck',defaultScale:1,license:'CC0',author:'Rail Island',source:'Rail Island'};
export const PHOTO_TRUCKS: ProceduralDesign[] = [
  {id:'proc-vehicle-tatra-815-tipper',game:{ weight: 15, power: 250, maxspeed: 80, accel: null },title:'Tatra 815 Tipper',build:tatra815Tipper,buildLod:tatra815TipperLod,references:'tatra-815-tipper',catalog},
  {id:'proc-vehicle-praga-rv',game:{ weight: 15, power: 250, maxspeed: 80, accel: null },title:'Praga RV',build:pragaRv,buildLod:pragaRvLod,references:'praga-rv',catalog},
  {id:'proc-vehicle-mercedes-atego-1224',game:{ weight: 15, power: 250, maxspeed: 80, accel: null },title:'Mercedes-Benz Atego 1224',build:mercedesAtego1224,buildLod:mercedesAtego1224Lod,references:'mercedes-atego-1224',catalog},
];
