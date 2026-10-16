import { colosseum } from './colosseum.ts';
export { colosseum } from './colosseum.ts';
import { lodBox, lodLoft, lodCylinder } from './lodPrimitives.ts';
// Remaining historical families, drawn in metres with a grounded origin.
import { MeshBuilder, ngon, rect } from './meshBuilder.ts';
import { arch, panel, beam, TOWER_PALETTE } from './towerParts.ts';
import { resolveParams, type ParamValues, type ProceduralDesign, type ParamSpec } from './design.ts';
const palette={...TOWER_PALETTE, plaster:{color:'#dfcba4'}, tile:{color:'#883a31'}, water:{color:'#7695a2'}};
function crenels(m:MeshBuilder,x:number,z:number,w:number,d:number,y:number):void {
  for(let a=-w/2+.5;a<w/2;a+=2){m.box('stone',x+a,z-d/2,.9,.8,y,y+1);m.box('stone',x+a,z+d/2,.9,.8,y,y+1);}
  for(let a=-d/2+1.5;a<d/2-1;a+=2){m.box('stone',x-w/2,z+a,.8,.9,y,y+1);m.box('stone',x+w/2,z+a,.8,.9,y,y+1);}
}
function tower(m:MeshBuilder,x:number,z:number,r:number,h:number,roof=false):void {
  m.scope('tower',()=>{
    m.prism('stone',ngon(12,r,0,x,z),0,h);m.prism('trim',ngon(12,r+.35,0,x,z),h,h+.5);
    if(roof)m.spire('tile',ngon(12,r+.6,0,x,z),h+.5,h+7);
    else for(let i=0;i<12;i++){const a=i*Math.PI/6;m.box('stone',x+r*Math.cos(a),z+r*Math.sin(a),.8,.8,h+.5,h+1.4);}
    for(let y=4;y<h-2;y+=4) for(const s of [-1,1])m.box('dark',x+s*(r-.04),z,.12,.32,y,y+1.5);
  });
}
const CASTLE_PARAMS:ParamSpec[]=[{name:'layout',title:'Layout',default:'courtyard',values:[{value:'courtyard',title:'Courtyard castle'},{value:'keep',title:'Fortified keep'},{value:'fortress',title:'Low fortress'}]}];
export function castle(given?:ParamValues):MeshBuilder {
  const p=resolveParams(CASTLE_PARAMS,given),m=new MeshBuilder(palette),keep=p.layout==='keep',fort=p.layout==='fortress';
  const w=keep?30:64,d=keep?26:54,h=fort?9:15;
  m.scope('courtyard',()=>m.box('sandstone',0,0,w-2.6,d-2.6,0,.12));
  m.scope('curtain-walls',()=>{
    m.box('stone',0,-d/2,w,2.5,0,h);crenels(m,0,-d/2,w,2.5,h);
    for(const x of [-w/2,w/2]){m.box('stone',x,0,2.5,d,0,h);crenels(m,x,0,2.5,d,h);}
    for(const x of [-1,1])m.box('stone',x*(w/4+2),d/2,w/2-4,2.5,0,h);
    m.box('stone',0,d/2,8,2.5,7,h);crenels(m,0,d/2,w,2.5,h);
    // Actual opening: the door does not conceal a solid curtain wall.
    for(const s of [-1,1])beam(m,'trim',[s*4,0,d/2+1.3],[s*4,7,d/2+1.3],.6);
  });
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])tower(m,x,z,3.6,h+4);
  if(!fort){m.scope('keep',()=>{m.box('stone',0,-6,16,15,0,h+9);
    for(const y of [5,10,15,20])if(y<h+7)for(const x of [-5,0,5])arch(m,'dark',0,x,y,.8,1.7,1.52);
    crenels(m,0,-6,16,15,h+9);});tower(m,-7,-10,3,h+14,true);}
  return m;
}
export function pagoda():MeshBuilder {
  const m=new MeshBuilder(palette);
  m.scope('storeys',()=>{for(let i=0;i<3;i++){
    const w=18-i*4,y=i*8;m.box('plaster',0,0,w,w,y,y+5);
    for(const side of [0,1,2,3])for(const x of [-w*.32,0,w*.32]){panel(m,'timber',side,x,y+1,2,3,w/2+.02);panel(m,'light',side,x,y+1.15,1.6,2.7,w/2+.04);for(let t=-.6;t<=.6;t+=.3)panel(m,'timber',side,x+t,y+1.15,.06,2.7,w/2+.06);}
    m.loft('roof',rect(w+5,w+5),y+5,rect(w+1,w+1),y+5.6);m.loft('roof',rect(w+1,w+1),y+5.6,rect(w-3,w-3),y+8);
  }m.spire('roof',rect(11,11),24,31);});return m;
}
export function palace():MeshBuilder {
  const m=new MeshBuilder(palette);
  m.scope('palace',()=>{
    m.box('sandstone',0,0,72,58,0,11);m.box('sandstone',0,-8,40,30,11,22);
    m.loft('tile',rect(43,33,0,-8),22,rect(25,18,0,-8),29);
    for(const side of [0,2])for(let x=-32;x<=32;x+=4)for(const y of [2,6])arch(m,'blue',side,x,y,1.5,2.5,29.02);
    for(const side of [1,3])for(let x=-24;x<=24;x+=4)for(const y of [2,6])arch(m,'blue',side,x,y,1.5,2.5,36.02);
    for(const x of [-30,30])for(const z of [-24,24]){
      m.box('sandstone',x,z,7,7,11,25);m.prism('gold',ngon(12,3.5,0,x,z),25,26);m.spire('tile',ngon(12,4,0,x,z),26,32);
    }
    m.prism('sandstone',ngon(12,4,0,0,-8),29,43);m.prism('gold',ngon(16,4.5,0,0,-8),43,45);m.spire('gold',ngon(16,4.5,0,0,-8),45,52);
  });return m;
}
export function stationHotel():MeshBuilder {
  const m=new MeshBuilder(palette);
  m.scope('station',()=>{
    m.box('stone',0,0,36,12,0,.5);m.box('plaster',0,0,34,10,.5,5);
    m.prism('tile',rect(35,11),5,5.2);m.loft('roof',rect(36,12),5.2,rect(36,.1),8.5);
    m.box('plaster',-10,0,10,10,5.3,10);m.loft('roof',rect(12,12,-10,0),10,rect(.1,12,-10,0),14);
    for(const side of [0,2])for(let x=-15;x<16;x+=3){panel(m,'timber',side,x,1,1.5,3,5.03);panel(m,'blue',side,x,1.15,1.2,2.6,5.05);}
    for(const x of [-13,-10,-7]){panel(m,'timber',0,x,7,1.4,2,5.03);panel(m,'blue',0,x,7.12,1.1,1.75,5.05);}
  });return m;
}
export const LEGACY_BUILDINGS:ProceduralDesign[]=[
  {id:'bld-castle',title:'Castle',build:castle,buildLod:castleLod,params:CASTLE_PARAMS},
  {id:'bld-hist-colosseum',title:'Colosseum',build:colosseum,buildLod:colosseumLod},
  {id:'bld-hist-pagoda',title:'Pagoda',build:pagoda,buildLod:pagodaLod},
  {id:'bld-hist-palace',title:'Palace',build:palace,buildLod:palaceLod},
  {id:'bld-station-hotel',title:'Station Hotel',build:stationHotel,buildLod:stationHotelLod},
].map(d=>({...d,catalog:{category:d.id==='bld-station-hotel'?'Station':'Historical',group:d.id==='bld-station-hotel'?'station':'hist_center',defaultScale:1,license:'CC0',author:'Rail Island',source:'Rail Island procedural reconstruction'}}));

// Preserve the large openings, separate towers and tiered roofs at map scale.
export function castleLod(given?: ParamValues): MeshBuilder {
  const p=resolveParams(CASTLE_PARAMS,given),m=new MeshBuilder(palette),keep=p.layout==='keep',fort=p.layout==='fortress';
  const w=keep?30:64,d=keep?26:54,h=fort?9:15;
  lodBox(m,'stone',0,-d/2,w,2.5,0,h);
  for(const x of [-w/2,w/2]) lodBox(m,'stone',x,0,2.5,d,0,h);
  for(const s of [-1,1]) lodBox(m,'stone',s*(w/4+2),d/2,w/2-4,2.5,0,h);
  lodBox(m,'stone',0,d/2,8,2.5,7,h);
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])lodCylinder(m,'stone',x,z,3.6,0,h+4,8);
  if(!fort){lodBox(m,'stone',0,-6,16,15,0,h+9);lodCylinder(m,'stone',-7,-10,3,h+9,h+14,8);m.spire('tile',ngon(8,3.6,0,-7,-10),h+14,h+21);m.cap('tile',ngon(8,3.6,0,-7,-10),h+14,false);}
  return m;
}
export function colosseumLod(): MeshBuilder {
  const m=new MeshBuilder(palette),n=16;
  for(let i=0;i<n;i++){
    const a=-i*Math.PI*2/n,b=-(i+1)*Math.PI*2/n;
    const point=(t:number,r:number,y:number):[number,number,number]=>[94*r*Math.cos(t),y,79*r*Math.sin(t)];
    const oa=point(a,1,0),ob=point(b,1,0),ia=point(a,.52,0),ib=point(b,.52,0);
    const height=(t:number)=>Math.sin(t)<-0.01?48:23.2;
    const oat=point(a,1,height(a)),obt=point(b,1,height(b)),iat=point(a,.52,8),ibt=point(b,.52,8);
    m.quad('sandstone',oa,ob,obt,oat);m.quad('sandstone',ib,ia,iat,ibt);
    m.quad('sandstone',oat,obt,ibt,iat);m.quad('sandstone',ob,oa,ia,ib);
  }return m;
}
export function pagodaLod(): MeshBuilder {
  const m=new MeshBuilder(palette);
  for(let i=0;i<3;i++){const w=18-i*4,y=i*8;lodBox(m,'plaster',0,0,w,w,y,y+5);lodLoft(m,'roof',rect(w+5,w+5),y+5,rect(w-3,w-3),y+8);}
  m.spire('roof',rect(11,11),24,31);m.cap('roof',rect(11,11),24,false);return m;
}
export function palaceLod(): MeshBuilder {
  const m=new MeshBuilder(palette);
  lodBox(m,'sandstone',0,0,72,58,0,11);lodBox(m,'sandstone',0,-8,40,30,11,22);
  lodLoft(m,'tile',rect(43,33,0,-8),22,rect(25,18,0,-8),29);
  for(const x of [-30,30])for(const z of [-24,24]){lodBox(m,'sandstone',x,z,7,7,11,26);m.spire('tile',ngon(6,4,0,x,z),26,32);m.cap('tile',ngon(6,4,0,x,z),26,false);}
  lodCylinder(m,'sandstone',0,-8,4,29,45,8);m.spire('gold',ngon(8,4.5,0,0,-8),45,52);m.cap('gold',ngon(8,4.5,0,0,-8),45,false);return m;
}
export function stationHotelLod(): MeshBuilder {
  const m=new MeshBuilder(palette);
  lodBox(m,'plaster',0,0,34,10,0,5.2);
  lodLoft(m,'roof',rect(36,12),5.2,rect(36,.1),8.5);
  lodBox(m,'plaster',-10,0,10,10,5.3,10);lodLoft(m,'roof',rect(12,12,-10,0),10,rect(.1,12,-10,0),14);return m;
}
