// Metre-scale fountains. The stone is the model; the water the game animates -- its
// pools and jets -- is recorded where each basin, bowl and nozzle is drawn
// (MeshCore.pool / jet, docs/models/emitters.md), so the two always agree.
import { MeshBuilder, ngon, rect, type Ring } from './meshBuilder.ts';
import type { ProceduralDesign } from './design.ts';
import { classicalFountainLod, modernFountainLod, obeliskFountainLod } from './lodFountains.ts';
export { classicalFountainLod, modernFountainLod, obeliskFountainLod } from './lodFountains.ts';
export const palette = { stone:{color:'#d9d5c4'}, water:{color:'#7397a3',roughness:.2}, bronze:{color:'#859e86'}, granite:{color:'#a89b94'}, trim:{color:'#eee8d7'}, dark:{color:'#b4aa95'} };
function basin(m:MeshBuilder, outer:Ring, inner:Ring, height:number):void {
  m.scope('basin',()=>{
    m.loft('dark',outer.map(([x,z])=>[x*1.025,z*1.025]),0,outer,.08,false);
    m.loft('stone',outer,.08,outer,height-.08,false);
    m.loft('trim',outer,height-.08,outer.map(([x,z])=>[x*1.018,z*1.018]),height,false);
    m.loft('stone',[...inner].reverse(),.12,[...inner].reverse(),height,false);
    for(let i=0;i<outer.length;i++) { const j=(i+1)%outer.length; const a=outer[i]!,b=outer[j]!,c=inner[j]!,d=inner[i]!;
      m.quad('trim',[a[0]*1.018,height,a[1]*1.018],[b[0]*1.018,height,b[1]*1.018],[c[0],height,c[1]],[d[0],height,d[1]]);
    }
    // the still water stands a hand below the rim
    m.cap('water',inner,height-.1);
    m.pool(inner,height-.1);
  });
}
/** The water level of a basin of `height` (see basin). */
const level=(height:number):number=>height-.1;
export function classicalFountain():MeshBuilder {
  const m=new MeshBuilder(palette); m.fountainStyle('classical'); basin(m,ngon(48,3.35),ngon(48,3.02),.55);
  m.scope('tiers',()=>{
    m.loft('stone',ngon(24,.5),.19,ngon(24,.23),.5);
    m.prism('stone',ngon(32,.23),.5,2.8);
    // Sculpted bowls: convex undersides, rounded lips and recessed water.
    for(const [y,r] of [[1.6,1.32],[2.5,.62]]) {
      const profile=[[y-.32,r*.22],[y-.24,r*.45],[y-.13,r*.78],[y-.04,r],[y+.04,r*1.01],[y+.10,r*.95]];
      for(let i=1;i<profile.length;i++)m.loft(i===profile.length-1?'trim':'stone',ngon(48,profile[i-1]![1]!),profile[i-1]![0]!,ngon(48,profile[i]![1]!),profile[i]![0]!,false);
      m.cap('water',ngon(48,r*.9),y+.065);
      m.pool(ngon(48,r*.9),y+.065);
      for(let i=0;i<16;i++){const a=i*Math.PI/8;m.prism('trim',ngon(8,.035,0,Math.cos(a)*r*.78,Math.sin(a)*r*.78),y-.14,y-.05);}
    }
    // Fluted pedestal and its mouldings.
    for(let i=0;i<16;i++){const a=i*Math.PI/8;m.prism('trim',ngon(8,.025,0,Math.cos(a)*.225,Math.sin(a)*.225),.55,1.22);}
    m.prism('trim',ngon(32,.29),.48,.55);
    m.spire('stone',ngon(16,.16),2.8,2.95);
  });
  // A crown jet from the finial falls back into the upper bowl; the lower bowl
  // overflows from eight points of its lip into the basin.
  m.jet({at:[0,2.95,0],rise:1.4,reach:0,land:2.5+.065,radius:.07});
  for(let i=0;i<8;i++){const a=i*Math.PI/4,dx=Math.cos(a),dz=Math.sin(a),r=1.32*1.01;m.jet({at:[dx*r,1.6+.04,dz*r],dir:[dx,dz],rise:.05,reach:.55,land:level(.55),radius:.05});}
  return m;
}
export function modernFountain():MeshBuilder {
  const m=new MeshBuilder(palette);m.fountainStyle('modern');basin(m,rect(6.4,6.4),rect(5.9,5.9),.45);
  // nine nozzles in a grid: the centre jet the tallest, the corners the lowest
  m.scope('nozzles',()=>{for(const x of [-1.7,0,1.7])for(const z of [-1.7,0,1.7]){m.prism('bronze',ngon(20,.16,0,x,z),.19,.24);m.loft('trim',ngon(16,.12,0,x,z),.24,ngon(16,.08,0,x,z),.34);m.prism('dark',ngon(12,.035,0,x,z),.34,.355);
    const edge=(x!==0?1:0)+(z!==0?1:0);m.jet({at:[x,.355,z],rise:[2.4,1.9,1.4][edge]!,reach:0,land:level(.45),radius:.07});}});return m;
}
export function obeliskFountain():MeshBuilder {
  const m=new MeshBuilder(palette);m.fountainStyle('sculptural');basin(m,ngon(8,3.3,Math.PI/8),ngon(8,2.98,Math.PI/8),.5);
  m.scope('obelisk',()=>{
    m.box('granite',0,0,1.3,1.3,.19,1.35);m.box('granite',0,0,1.6,1.6,1.35,1.53);
    m.loft('granite',rect(.96,.96),1.53,rect(.65,.65),5.02);m.spire('bronze',rect(.65,.65),5.02,5.48);
    for(const s of [-1,1]){m.box('bronze',s*.8,0,.3,.14,.8,.94);m.box('bronze',0,s*.8,.14,.3,.8,.94);}
  });
  // each of the four bronze spouts arcs a jet out into the basin
  for(const [dx,dz] of [[1,0],[0,-1],[-1,0],[0,1]] as const)m.jet({at:[dx*.95,.87,dz*.95],dir:[dx,dz],rise:.3,reach:1.3,land:level(.5),radius:.07});
  return m;
}
export const FOUNTAINS:ProceduralDesign[]=[
  {id:'bld-fountain-classical',title:'Classical Fountain',build:classicalFountain,buildLod:classicalFountainLod},
  {id:'bld-fountain-modern',title:'Modern Fountain',build:modernFountain,buildLod:modernFountainLod},
  {id:'bld-fountain-obelisk',title:'Obelisk Fountain',build:obeliskFountain,buildLod:obeliskFountainLod},
].map(d=>({...d,catalog:{category:'Decor',group:'decor',defaultScale:1,license:'CC0',author:'Rail Island',source:'Rail Island'}}));
