// Metre-scale replacements for the remaining hand-authored transport models.
import { MeshBuilder, ngon, chamferedRect, type Ring } from './meshBuilder.ts';
import { beam, panel } from './towerParts.ts';
import type { ProceduralDesign } from './design.ts';
const palette={ivory:{color:'#e5dfcc'},red:{color:'#ad4536'},glass:{color:'#283f4b',roughness:.15},steel:{color:'#737e80',metallic:.6},dark:{color:'#22292d'},white:{color:'#eeeeea'},blue:{color:'#163858'},deck:{color:'#bd9a55'},hull:{color:'#183d36'},brass:{color:'#bca45c',metallic:.4}};
export function classicCabin():MeshBuilder {
  const m=new MeshBuilder(palette),plan=chamferedRect(3.78,2.58,.4);
  m.scope('body',()=>{
    m.prism('ivory',plan,0,.24);m.prism('red',plan,.24,.29);
    m.prism('glass',chamferedRect(3.65,2.45,.38),.29,2.55);
    m.prism('red',plan,2.55,2.61);m.prism('ivory',plan,2.61,2.79);
    for(const s of [-1,1])for(const x of [-1.3,-.5,.5,1.3])m.box('ivory',x,s*1.24,.075,.10,.29,2.53);
    for(const x of [-1.84,1.84])m.box('ivory',x,0,.1,.075,.29,2.53);
    m.box('ivory',0,1.25,.08,.1,.29,2.53);m.box('dark',.12,1.32,.05,.03,1.2,1.45);
    m.box('dark',0,0,.7,.6,2.8,2.86);
  });
  m.scope('hanger',()=>{
    for(const x of [-.9,.9])for(const z of [-.8,.8])beam(m,'steel',[x,2.82,z],[0,4.25,0],.09);
    beam(m,'steel',[0,4.2,0],[0,5.45,0],.14);
    m.box('dark',0,0,1.5,.6,5.38,5.62);
    for(const x of [-.53,.53]){const wheel=ngon(20,.24,Math.PI/20,x,5.62);m.sweep('steel','z',wheel,-.17,wheel,.17);const hub=ngon(16,.11,0,x,5.62);m.sweep('dark','z',hub,-.19,hub,.19);}
  });return m;
}
function ellipse(z:number,y:number,rz:number,ry:number,n=24):Ring {return Array.from({length:n},(_,i)=>{const a=-i*Math.PI*2/n;return [z+rz*Math.cos(a),y+ry*Math.sin(a)];});}
export function boeing737():MeshBuilder {
  const m=new MeshBuilder(palette);
  m.part('airframe',[0,0,0],()=>{
    m.scope('fuselage',()=>{
      const stations=[[0,.08,.08,3.1],[2,1.3,1.4,3.5],[5,1.88,2,3.6],[29,1.88,2,3.6],[35,1.1,1.3,4],[39.5,.08,.08,4.4]];
      for(let i=1;i<stations.length;i++){const a=stations[i-1]!,b=stations[i]!;m.sweep('white','x',ellipse(0,a[3]!,a[1]!,a[2]!),a[0]!-19.75,ellipse(0,b[3]!,b[1]!,b[2]!),b[0]!-19.75,false);}
      for(const s of [-1,1])for(let x=-12;x<12;x+=.65)m.box('glass',x,s*1.87,.27,.035,4.02,4.42);
      for(const s of [-1,1])m.slab('glass',[[-18,3.9,s*.65],[-16.6,4.7,s*1.05],[-15.8,4.7,s*1.48],[-16.2,3.9,s*1.45]],[0,.02,s*.03]);
    });
    m.scope('wings',()=>{for(const s of [-1,1]){
      m.slab('white',[[-4,2.8,s*1.5],[4,2.8,s*17.9],[6,2.8,s*17.9],[5,2.8,s*1.5]],[0,.22,0]);
      m.slab('blue',[[4,3,s*17.9],[4.8,5.6,s*17.65],[5.8,5.6,s*17.65],[6,3,s*17.9]],[0,0,s*.12]);
      m.slab('white',[[13,4.5,s*.7],[17,4.5,s*7],[19,4.5,s*7],[18,4.5,s*.7]],[0,.18,0]);
      m.box('steel',-1.03,s*5.4,2,.28,1.8,2.8);
      const front=ellipse(s*5.4,1.8,1,1),back=ellipse(s*5.4,1.8,.7,.7);
      m.sweep('white','x',front,-4,back,0);m.sweep('dark','x',ellipse(s*5.4,1.8,.86,.86),-4.04,ellipse(s*5.4,1.8,.86,.86),-4.02);
      for(let i=0;i<16;i++){const a=i*Math.PI/8;beam(m,'steel',[-4.06,1.8,s*5.4],[-4.06,1.8+Math.sin(a)*.8,s*5.4+Math.cos(a)*.8],.05);}
    }m.slab('blue',[[12,5.2,-.12],[17,12.5,-.12],[19,12.5,-.12],[19.5,5.2,-.12]],[0,0,.24]);});
  });
  m.part('gear',[0,0,0],()=>{m.scope('landing-gear',()=>{for(const [x,z] of [[-14,0],[2,-2],[2,2]]){
    beam(m,'steel',[x!,.45,z!],[x!,2.6,z!],.12);for(const s of [-1,1]){const r=ellipse(x!,.44,.44,.44,16);m.sweep('dark','z',r,z!+s*.15-.12,r,z!+s*.15+.12);}
  }});});return m;
}
export function oceanLiner():MeshBuilder {
  const m=new MeshBuilder(palette);
  const plan=(length:number,width:number):Ring=>[[-length/2,0],[-length*.43,width*.42],[-length*.30,width/2],[length*.34,width/2],[length*.47,width*.24],[length/2,0],[length*.47,-width*.24],[length*.34,-width/2],[-length*.30,-width/2],[-length*.43,-width*.42]];
  m.scope('hull',()=>{m.loft('hull',plan(260,24),0,plan(269,28),15);m.prism('ivory',plan(269,28),15,16);m.cap('deck',plan(268,27),16.05);});
  m.scope('decks',()=>{for(let i=0;i<3;i++){
    const len=200-i*24,w=24-i*2,y=16.1+i*3.4;m.prism('white',plan(len,w),y,y+3);m.prism('deck',plan(len+1,w+1),y+3,y+3.2);
    for(const s of [-1,1])for(let x=-len*.30;x<len*.30;x+=3)m.box('glass',x,s*(w/2+.02),1.1,.03,y+.9,y+2);
  }});
  m.scope('funnels',()=>{for(const x of [-55,-18,19,56]){m.prism('red',ngon(20,4,0,x,0),26.1,41);m.prism('dark',ngon(20,4.1,0,x,0),41,44);for(const s of [-1,1])beam(m,'steel',[x,38,s*3.6],[x+8,26,s*10],.12);}});
  m.scope('fittings',()=>{
    for(const x of [-99,99]){beam(m,'brass',[x,16.1,0],[x,45,0],.45);beam(m,'brass',[x,38,-8],[x,38,8],.25);for(const s of [-1,1])beam(m,'steel',[x,43,0],[x-s*15,16,s*7],.09);}
    for(const s of [-1,1])for(let x=-65;x<=65;x+=13){m.loft('ivory',plan(9,2).map(([u,v])=>[u+x,v+s*10]),26.5,plan(10,2.4).map(([u,v])=>[u+x,v+s*10]),27.5);}
    for(const side of [0,2])for(let x=-98;x<99;x+=2)panel(m,'glass',side,x,11,.55,.55,13.9);
  });return m;
}
export const LEGACY_VEHICLES:ProceduralDesign[]=[
  {id:'veh-cabin-classic',title:'Classic Cable Car Cabin',build:classicCabin,catalog:{category:'Cable car',group:'cablecar',defaultScale:1,license:'CC0',author:'Rail Island',source:'Rail Island'}},
  {id:'veh-boeing-737',title:'Boeing 737-800',build:boeing737,catalog:{category:'Aircraft',yaw:0,group:'aircraft',defaultScale:1,license:'CC0',author:'Rail Island',source:'Rail Island'}},
  {id:'veh-ocean-liner',title:'Ocean Liner',build:oceanLiner,catalog:{category:'Ships',yaw:0,group:'ships',defaultScale:1,license:'CC0',author:'Rail Island',source:'Rail Island'}},
];
