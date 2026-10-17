// A tiered palace with a ceremonial loggia and an inhabited roof silhouette.
import { MeshBuilder, rect, ngon, type MaterialSpec } from './meshBuilder.ts';
import { face, panel, arch, beam } from './towerParts.ts';
import { resolveParams, type ParamSpec, type ParamValues } from './design.ts';
import { lodBox, lodLoft, lodCylinder } from './lodPrimitives.ts';
const palette:Record<string,MaterialSpec>={
  stone:{color:'#d7bd89'},trim:{color:'#f0dfb5'},roof:{color:'#843e35'},
  dark:{color:'#273e46'},gold:{color:'#caa252',metallic:.45},door:{color:'#624330'},
};
export const PALACE_PARAMS:ParamSpec[]=[
  {name:'walls',title:'Parapets',default:'balustrade',values:[{value:'balustrade',title:'Balustraded'},{value:'crenellated',title:'Crenellated'}]},
  {name:'roof',title:'Roof profile',default:'onion',values:[{value:'onion',title:'Onion domes'},{value:'conical',title:'Conical spires'}]},
  {name:'towers',title:'Corner towers',default:'square',values:[{value:'square',title:'Square'},{value:'round',title:'Round'}]},
  {name:'windows',title:'Windows',default:'arched',values:[{value:'arched',title:'Arched'},{value:'rectangular',title:'Rectangular'}]},
];
// Open frames: relief is built around the glazing rather than stacked flat panels.
function window(m:MeshBuilder,p:ParamValues,side:number,x:number,y:number,z:number,w=1.5,h=2.8):void{
  const spring=y+h-w/2;
  if(p.windows==='arched')arch(m,'dark',side,x,y,w,h,z+.025);
  else panel(m,'dark',side,x,y,w,h,z+.025);
  for(const sign of [-1,1])panel(m,'trim',side,x+sign*(w/2+.13),y-.08,.22,p.windows==='arched'?h-w/2+.08:h+.08,z+.06,.18);
  if(p.windows==='arched')for(let i=0;i<8;i++){
    const a=i*Math.PI/8,b=(i+1)*Math.PI/8,r=w/2;
    const point=(angle:number,radius:number,depth:number)=>face(side,x+radius*Math.cos(angle),spring+radius*Math.sin(angle),depth);
    m.quad('trim',point(a,r,z+.24),point(a,r+.25,z+.24),point(b,r+.25,z+.24),point(b,r,z+.24));
    m.quad('trim',point(a,r,z+.04),point(a,r,z+.24),point(b,r,z+.24),point(b,r,z+.04));
  }else{
    panel(m,'trim',side,x,y+h,w+.48,.25,z+.06,.18);
    // A dentilled lintel retains the same level of architectural detail.
    for(let i=0;i<2;i++)panel(m,'trim',side,x+(i-.5)*(w+.45)/2,y+h+.3,.12,.18,z+.07,.16);
  }
  panel(m,'trim',side,x,y-.25,w+.7,.22,z+.07,.35);
  panel(m,'gold',side,x,y,.07,h-.3,z+.09);
  panel(m,'gold',side,x,y+h*.45,w,.08,z+.095);
}
function crown(m:MeshBuilder,p:ParamValues,x:number,z:number,r:number,y:number,h:number,lod=false):void{
  const n=lod?6:24,mat=y>40?'gold':'roof';
  if(p.roof==='conical')m.spire(mat,ngon(n,r,0,x,z),y,y+h);
  else{
    const profile=[[1,0],[1.12,.18],[.92,.5],[.52,.76],[.12,.94]];
    for(let i=0;i<profile.length-1;i++){
      const [a,b]=profile[i]!,[c,d]=profile[i+1]!;
      m.loft(mat,ngon(n,r*a,0,x,z),y+h*b,ngon(n,r*c,0,x,z),y+h*d,false);
    }
    m.spire(mat,ngon(n,r*.12,0,x,z),y+h*.94,y+h);
  }
  if(!lod){m.prism('gold',ngon(12,.12,0,x,z),y+h-.05,y+h+.9);m.spire('gold',ngon(12,.25,0,x,z),y+h+.7,y+h+1.3);}
}
function parapet(m:MeshBuilder,p:ParamValues,side:number,length:number,depth:number,y:number):void{
  const count=Math.floor(length/1.25);
  for(let i=0;i<count;i++){
    const x=(i+.5)*length/count-length/2,c=face(side,x,0,depth);
    if(p.walls==='crenellated')m.box('trim',c[0],c[2],.65,.65,y,y+1.25,side*Math.PI/2);
    else{
      m.loft('trim',rect(.34,.34,c[0],c[2]),y,rect(.17,.17,c[0],c[2]),y+.5);
      m.loft('trim',rect(.17,.17,c[0],c[2]),y+.5,rect(.32,.32,c[0],c[2]),y+.95);
    }
  }
  if(p.walls==='balustrade')panel(m,'trim',side,0,y+1,length,.22,depth-.3,.6);
}
export function palace(given?:ParamValues):MeshBuilder{
  const p=resolveParams(PALACE_PARAMS,given),m=new MeshBuilder(palette);
  m.scope('terraced-palace',()=>{
    m.box('stone',0,0,72,58,0,11);
    m.box('stone',0,-8,40,30,11.05,22);
    m.loft('roof',rect(43,33,0,-8),22.03,rect(25,18,0,-8),29);
    for(const side of [0,1,2,3])m.scope(`facade-${side}`,()=>{
      const length=side%2?58:72,depth=side%2?36:29;
      for(const y of [.35,5.5,10.55])panel(m,'trim',side,0,y,length+.5,.3,depth+.04,.3);
      const count=side%2?10:14;
      for(let i=0;i<count;i++){
        const x=(i+.5)*length/count-length/2;
        for(const y of [1.6,6.8])window(m,p,side,x,y,depth+.04);
        panel(m,'trim',side,x+length/count*.43,.75,.4,9.7,depth+.06,.25);
        for(let row=0;row<2;row++)panel(m,'stone',side,x, .8+row*5.2,length/count-.6,.6,depth+.015,.075);
      }
      parapet(m,p,side,length,depth,11.08);
    });
    m.scope('upper-residence',()=>{
      for(const side of [0,1,2,3]){
        const length=side%2?30:40,depth=(side%2?20:15)+(side===0?-8:side===2?8:0),shift=side===1?8:side===3?-8:0;
        for(let i=0;i<8;i++)for(const y of [12.2,17.2])window(m,p,side,(i-3.5)*length/8+shift,y,depth+.04);
        panel(m,'trim',side,shift,21.5,length+.4,.4,depth+.03,.4);
      }
    });
  });
  m.scope('ceremonial-loggia',()=>{
    // A projecting arcade; its bays are genuinely open below the entablature.
    m.box('stone',0,32.6,42,6.6,0,.45);
    for(let i=0;i<10;i++){
      const x=(i-4.5)*4.4;
      m.prism('trim',ngon(12,.48,0,x,34),.45,7.8);
      for(const y of [.5,1,7.35])m.prism('trim',ngon(12,.7,0,x,34),y,y+.3);
    }
    m.box('trim',0,33,42,4,7.85,8.5);
    m.box('roof',0,33,42.5,4.5,8.53,8.85);
    for(let i=0;i<60;i++)m.box('trim',(i-29.5)*.69,35.1,.28,.4,7.65,7.83);
    for(let i=0;i<5;i++)m.box('trim',0,36.4+i*.45,12,.42,0,.44-i*.08);
    panel(m,'door',0,0,.5,3.4,4.6,29.45,.2);
    arch(m,'gold',0,0,5.4,3.4,2,29.5);
  });
  m.scope('corner-pavilions',()=>{
    for(const x of [-30,30])for(const z of [-24,24]){
      const ring=(r:number)=>p.towers==='square'?rect(r*2,r*2,x,z):ngon(24,r,Math.PI/24,x,z);
      m.prism('stone',ring(3.5),11.04,25);
      for(const y of [12,18,24.5])m.prism('trim',ring(3.7),y,y+.35);
      for(let side=0;side<4;side++){
        const local=face(-side,x,0,z);
        for(const y of [14,20])window(m,p,side,local[0],y,local[2]+3.53,1.3,2.7);
      }
      crown(m,p,x,z,4,25.38,6.6);
    }
  });
  m.scope('central-lantern',()=>{
    m.prism('stone',ngon(24,4,Math.PI/24,0,-8),29.03,43);
    for(const y of [30,35,40,42.6])m.prism('gold',ngon(24,4.18,Math.PI/24,0,-8),y,y+.32);
    for(let side=0;side<4;side++){
      const c=face(-side,0,0,-8);
      for(const y of [31.1,36.3])window(m,p,side,c[0],y,c[2]+4.02,1.7,3.1);
    }
    crown(m,p,0,-8,4.5,43.05,8);
  });
  m.scope('dormers-and-chimneys',()=>{
    for(const side of [-1,1])for(let i=0;i<7;i++){
      const x=(i-3)*5,z=-8+side*13;
      m.box('stone',x,z,2,2,23.3,26.5);
      m.spire('roof',rect(2.5,2.6,x,z),26.53,28.2);
      window(m,p,side===1?0:2,side*x,24,side*z+1.04,.8,1.6);
    }
    for(const x of [-15,15])for(const z of [-13,-3]){
      m.box('stone',x,z,1.1,1.4,26.5,30);
      m.box('trim',x,z,1.5,1.8,30.03,30.4);
    }
    for(const x of [-20,20])beam(m,'gold',[x,22.2,8],[x*.6,29,-.5],.15);
  });
  return m;
}
export function palaceLod(given?:ParamValues):MeshBuilder{
  const p=resolveParams(PALACE_PARAMS,given),m=new MeshBuilder(palette);
  lodBox(m,'stone',0,0,72,58,0,11);
  lodBox(m,'stone',0,-8,40,30,11.05,22);
  lodLoft(m,'roof',rect(43,33,0,-8),22.03,rect(25,18,0,-8),29);
  for(const x of [-30,30])for(const z of [-24,24]){
    if(p.towers==='square')lodBox(m,'stone',x,z,7,7,11.04,25);
    else lodCylinder(m,'stone',x,z,3.5,11.04,25,6);
    crown(m,p,x,z,4,25.38,6.6,true);
  }
  lodCylinder(m,'stone',0,-8,4,29.03,43,8);
  crown(m,p,0,-8,4.5,43.05,8,true);
  lodBox(m,'trim',0,33,42,4,7.85,8.5);
  for(const x of [-19.8,-6.6,6.6,19.8])lodBox(m,'trim',x,34,1,1,0,7.8);
  return m;
}
