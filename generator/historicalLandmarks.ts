// Detailed Historical landmarks. Shared by the legacy catalog and standalone JS.
import { MeshBuilder, ngon, rect, type MaterialSpec } from './meshBuilder.ts';
import { beam, face, panel, arch } from './towerParts.ts';
import { resolveParams, type ParamSpec, type ParamValues } from './design.ts';
import { lodBox, lodCylinder, lodLoft } from './lodPrimitives.ts';
const palette: Record<string, MaterialSpec> = {
  stone: {color:'#aaa393'}, trim: {color:'#c9c0aa'}, mortar: {color:'#817e72'},
  roof: {color:'#38565a'}, roofEdge: {color:'#58777a'}, timber: {color:'#703d2d'},
  plaster: {color:'#e5d5ad'}, dark: {color:'#283438'}, gold: {color:'#c8a257',metallic:.45},
  paving: {color:'#a89d87'}, tile: {color:'#804837'},
};
export const CASTLE_PARAMS: ParamSpec[] = [{name:'layout',title:'Layout',default:'courtyard',values:[
  {value:'courtyard',title:'Courtyard castle'}, {value:'keep',title:'Fortified keep'}, {value:'fortress',title:'Low fortress'},
]}];

// Four curved roof slopes; individual raised tile seams follow the same profile.
function pagodaRoof(m:MeshBuilder,w:number,y:number,rise:number):void {
  const inner=w*.28, outer=w*.5;
  const pt=(side:number,u:number,t:number,offset=0)=>{
    const r=inner+(outer-inner)*t;
    return face(side,u*r,y+rise*(1-t)**2+.45*t**8+offset,r);
  };
  for(let side=0;side<4;side++){
    for(let row=0;row<6;row++)for(let col=0;col<16;col++){
      const a=col/8-1,b=(col+1)/8-1,t=row/6,s=(row+1)/6;
      m.quad('roof',pt(side,a,s),pt(side,b,s),pt(side,b,t),pt(side,a,t));
    }
    for(let col=1;col<16;col++)for(let row=0;row<6;row++)
      beam(m,'roofEdge',pt(side,col/8-1,row/6,.10),pt(side,col/8-1,(row+1)/6,.10),.07);
    beam(m,'gold',pt(side,-1,1,.02),pt(side,1,1,.02),.16);
    for(let row=0;row<6;row++)beam(m,'gold',pt(side,-1,row/6,.12),pt(side,-1,(row+1)/6,.12),.16);
  }
  m.cap('roof',rect(inner*2,inner*2),y+rise);
}
export function pagoda():MeshBuilder {
  const m=new MeshBuilder(palette);
  m.scope('stone-terrace',()=>{
    m.box('stone',0,0,21,21,0,.5);m.box('trim',0,0,20,20,.5,.9);
    for(let i=0;i<5;i++)m.box('stone',0,10.5+i*.45,5,.44,0,.88-i*.16);
  });
  for(let level=0;level<3;level++)m.scope(`storey-${level+1}`,()=>{
    const w=16-level*4,y=.9+level*8;
    m.box('plaster',0,0,w,w,y,y+5.3);
    m.scope('gallery',()=>{
      m.box('timber',0,0,w+2,w+2,y+.15,y+.4);
      for(let side=0;side<4;side++){
        for(const h of [.8,1.5])beam(m,'timber',face(side,-w/2-.85,y+h,w/2+.85),face(side,w/2+.85,y+h,w/2+.85),.12);
        for(let i=0;i<=12;i++){
          const x=(i/12-.5)*(w+1.6);
          beam(m,'timber',face(side,x,y+.42,w/2+.85),face(side,x,y+1.6,w/2+.85),.12);
        }
        for(let bay=0;bay<5;bay++){
          const x=(bay-2)*w/5;
          panel(m,'timber',side,x,y+.8,w*.16,3.6,w/2+.025);
          panel(m,'dark',side,x,y+1,w*.14,3.2,w/2+.045);
          for(let i=0;i<5;i++)panel(m,'gold',side,x+(i-2)*w*.027,y+1,.055,3.2,w/2+.065);
          for(let i=0;i<7;i++)panel(m,'timber',side,x,y+1+i*.48,w*.14,.065,w/2+.08);
          beam(m,'timber',face(side,x,y+.4,w/2+.3),face(side,x,y+5.3,w/2+.3),.25);
          for(const sign of [-1,1])beam(m,'timber',face(side,x,y+4.1,w/2+.3),face(side,x+sign*.65,y+5.05,w/2+.5),.18);
        }
        beam(m,'timber',face(side,-w/2,y+4.8,w/2+.3),face(side,w/2,y+4.8,w/2+.3),.3);
      }
    });
    m.scope('curved-tiled-roof',()=>pagodaRoof(m,w+7,y+5.1,2.5));
  });
  m.scope('finial',()=>{
    m.spire('roof',rect(6,6),24,28.8);
    m.prism('gold',ngon(12,.16),28.6,31);
    for(let i=0;i<7;i++)m.loft('gold',ngon(16,.65-i*.065),28.8+i*.3,ngon(16,.36-i*.03),28.94+i*.3);
    m.spire('gold',ngon(12,.28),31,31.7);
  });
  return m;
}

export function castle(given?:ParamValues):MeshBuilder {
  const p=resolveParams(CASTLE_PARAMS,given),m=new MeshBuilder(palette);
  const keep=p.layout==='keep',fort=p.layout==='fortress',w=keep?30:64,d=keep?26:54,h=fort?9:15;
  m.scope('courtyard',()=>m.box('paving',0,0,w-2.7,d-2.7,0,.14));
  m.scope('curtain-walls',()=>{
    for(let side=0;side<4;side++){
      const length=side%2?d:w,depth=(side%2?w:d)/2;
      const box=(x:number,width:number,y0:number,y1:number)=>{const c=face(side,x,0,depth);m.box('mortar',c[0],c[2],width,2.5,y0,y1,side*Math.PI/2);};
      if(side===0){box(-(length/4+2),length/2-4,0,h);box(length/4+2,length/2-4,0,h);box(0,8,7,h);}
      else box(0,length,0,h);
      for(let row=0;row<10;row++)for(let col=0;col<24;col++){
        const x=(col+.5)*length/24-length/2,y=row*h/10+.06;
        if(side===0 && Math.abs(x)<4+length/48 && y<7.02)continue;
        panel(m,(row+col)%7===0?'trim':'stone',side,x,y,length/24-.09,h/10-.12,depth+1.26,.13);
      }
      for(let i=0;i<Math.floor(length/1.5);i++){
        const x=(i+.5)*length/Math.floor(length/1.5)-length/2,c=face(side,x,0,depth);
        m.box('trim',c[0],c[2],.8,2.62,h+.025,h+1,side*Math.PI/2);
      }
      for(let i=1;i<8;i++)panel(m,'dark',side,(i/8-.5)*length,h*.6,.22,1.7,depth+1.42);
    }
  });
  const turret=(x:number,z:number,r:number,height:number,roof=false)=>m.scope('round-tower',()=>{
    m.prism('stone',ngon(24,r,0,x,z),0,height,false);
    for(const y of [1.2,height*.5,height-1])m.prism('trim',ngon(24,r+.18,0,x,z),y,y+.3);
    m.loft('trim',ngon(24,r,0,x,z),height-1,ngon(24,r+.55,0,x,z),height,false);
    m.prism('stone',ngon(24,r+.55,0,x,z),height,height+.55);
    if(roof)m.spire('tile',ngon(24,r+.75,0,x,z),height+.57,height+7);
    else for(let i=0;i<16;i++){
      const a=i*Math.PI/8;m.box('trim',x+(r+.25)*Math.sin(a),z+(r+.25)*Math.cos(a),.65,.75,height+.57,height+1.55,a);
    }
    for(let row=0;row<7;row++)for(let i=0;i<24;i++){
      const a=(i+.5)*Math.PI/12,rr=r*Math.cos(Math.PI/24)+.04;
      const cx=x+rr*Math.cos(a),cz=z+rr*Math.sin(a);
      m.box((row+i)%6===0?'trim':'stone',cx,cz,r*.245,.13,.15+row*(height-1.5)/7,.15+(row+.87)*(height-1.5)/7,Math.PI/2-a);
    }
    for(let side=0;side<4;side++)for(const y of [height*.38,height*.7]){
      const c=face(side,0,0,r+.13);
      m.box('dark',x+c[0],z+c[2],.3,.06,y,y+1.5,side*Math.PI/2);
    }
  });
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])turret(x,z,3.6,h+4);
  m.scope('gatehouse',()=>{
    for(const x of [-6,6])turret(x,d/2+1,2.4,h+2,true);
    // Open gate with raised iron grille and a stone voussoir arch.
    for(let i=0;i<16;i++){
      const a=i*Math.PI/16,b=(i+1)*Math.PI/16;
      m.slab('trim',[[4*Math.cos(a),4+3*Math.sin(a),d/2+1.5],[4*Math.cos(b),4+3*Math.sin(b),d/2+1.5],[4.6*Math.cos(b),4+3.6*Math.sin(b),d/2+1.5],[4.6*Math.cos(a),4+3.6*Math.sin(a),d/2+1.5]],[0,0,.35]);
    }
    for(let i=-3;i<=3;i++)beam(m,'dark',[i,5.8,d/2+1.4],[i,8.8,d/2+1.4],.09);
  });
  m.scope('great-hall',()=>{
    const hw=keep?12:24,hd=keep?9:14,hz=-d/2+hd/2+4,hh=fort?7:18;
    m.box('stone',0,hz,hw,hd,0,hh);
    m.loft('tile',rect(hw+1,hd+1,0,hz),hh+.02,rect(hw+1,.15,0,hz),hh+5);
    for(const side of [0,2])for(let i=0;i<7;i++){
      const x=(i-3)*hw/8,z=side===0?hz+hd/2+.03:-hz+hd/2+.03;
      for(const y of [2,hh-4]){arch(m,'trim',side,x,y,1.5,2.7,z);arch(m,'dark',side,x,y+.2,1.1,2.2,z+.02);}
    }
    for(const x of [-hw*.3,hw*.3])m.box('stone',x,hz,1.2,1.2,hh+2,hh+6.5);
  });
  if(!fort)turret(-w*.2,-d*.13,3,h+14,true);
  return m;
}

// Closed low-detail structural volumes retain the full model's new silhouette.
export function castleLod(given?:ParamValues):MeshBuilder {
  const p=resolveParams(CASTLE_PARAMS,given),m=new MeshBuilder(palette);
  const keep=p.layout==='keep',fort=p.layout==='fortress',w=keep?30:64,d=keep?26:54,h=fort?9:15;
  lodBox(m,'stone',0,-d/2,w,2.5,0,h);
  for(const x of [-w/2,w/2])lodBox(m,'stone',x,0,2.5,d,0,h);
  for(const s of [-1,1])lodBox(m,'stone',s*(w/4+2),d/2,w/2-4,2.5,0,h);
  lodBox(m,'stone',0,d/2,8,2.5,7,h);
  const tower=(x:number,z:number,r:number,height:number,roof=false)=>{
    lodCylinder(m,'stone',x,z,r,0,height,8);
    if(roof){m.spire('tile',ngon(8,r+.75,0,x,z),height+.02,height+7);m.cap('tile',ngon(8,r+.75,0,x,z),height+.02,false);}
  };
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])tower(x,z,4.15,h+4.55);
  for(const x of [-6,6])tower(x,d/2+1,2.4,h+2.57,true);
  const hw=keep?12:24,hd=keep?9:14,hz=-d/2+hd/2+4,hh=fort?7:18;
  lodBox(m,'stone',0,hz,hw,hd,0,hh);
  lodLoft(m,'tile',rect(hw+1,hd+1,0,hz),hh+.02,rect(hw+1,.15,0,hz),hh+5);
  if(!fort)tower(-w*.2,-d*.13,3,h+14.57,true);
  return m;
}
export function pagodaLod():MeshBuilder {
  const m=new MeshBuilder(palette);
  lodBox(m,'stone',0,0,21,21,0,.9);
  for(let i=0;i<3;i++){
    const w=16-i*4,y=.9+i*8,outer=(w+7)/2,inner=(w+7)*.28;
    lodBox(m,'plaster',0,0,w,w,y,y+5.3);
    // A three-ring roof retains the flared eave and upper slope.
    lodLoft(m,'roof',rect(outer*2,outer*2),y+5.55,rect((outer+inner),(outer+inner)),y+5.73);
    lodLoft(m,'roof',rect((outer+inner),(outer+inner)),y+5.75,rect(inner*2,inner*2),y+7.6);
  }
  m.spire('roof',rect(6,6),24,28.8);m.cap('roof',rect(6,6),24,false);
  lodCylinder(m,'gold',0,0,.3,28.82,31.7,6);
  return m;
}
