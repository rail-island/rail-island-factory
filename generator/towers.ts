// All eight webapp Towers, rebuilt from primitives; see docs/models/towers.md.
import { MeshBuilder, ngon, rect } from './meshBuilder.ts';
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from './design.ts';
import { arch, bar, beam, dial, face, panel, TAU, TOWER_PALETTE } from './towerParts.ts';
import type { Vec3 } from './meshCore.ts';
const spec=(name:string,title:string,values:string[],def=values[0]!):ParamSpec=>({name,title,default:def,values:values.map(value=>({value,title:value}))});
const CLOCK:ParamSpec[]=[{name:'time',title:'Clock time',default:'time1010',values:[{value:'time1010',title:'10:10'},{value:'time0300',title:'3:00'}]}];
const BELL=[spec('storeys','Storeys',['3','4','5']),spec('roof','Roof finish',['teal','red'])];
const FORT=[spec('storeys','Storeys',['3','2','4']),spec('banners','Banners',['red','blue','none'])];
const TURRET=[spec('storeys','Storeys',['2','3','4']),spec('battlements','Battlements',['8','12'])];
const RADIO=[spec('bays','Mast bays',['8','6','10']),spec('dishes','Microwave dishes',['2','0','4'])];
const POWER=[spec('arms','Crossarm levels',['3','2']),spec('bays','Shaft bays',['6','5','7'])];
function model(roof='teal'):MeshBuilder{return new MeshBuilder({...TOWER_PALETTE,roof:{color:roof==='red'?'#9d4c3c':'#345f64'}});}
function band(m:MeshBuilder,mat:string,w:number,y:number,h:number,d=w):void{m.box(mat,0,0,w,d,y,y+h);}

export function bigBen(given?:ParamValues):MeshBuilder {
  const p=resolveParams(CLOCK,given),m=model();
  m.scope('Stone shaft and plinth',()=>{
    band(m,'sandstone',13.8,0,1.8); band(m,'light',13,1.8,.7);
    band(m,'sandstone',12,2.5,52.5);
    for(let level=0;level<6;level++){
      const y=6+level*7.6;
      band(m,'light',12.6,y-1,.45);
      for(let s=0;s<4;s++)for(const x of [-3.6,-1.2,1.2,3.6]){
        arch(m,'dark',s,x,y,1.35,5,6.025);
        for(const dx of [-.83,.83])bar(m,'light',s,x+dx,y-.15,x+dx,y+5.1,6.16,.20);
        bar(m,'sandstone',s,x,y,x,y+4.8,6.15,.12);
        bar(m,'light',s,x-.8,y+5.1,x,y+5.9,6.17,.16);
        bar(m,'light',s,x,y+5.9,x+.8,y+5.1,6.17,.16);
      }
    }
    for(const x of [-5.8,5.8])for(const z of [-5.8,5.8]){
      m.box('light',x,z,1.1,1.1,2.5,70.8);
      for(let y=4;y<54;y+=2.4)m.box('sandstone',x,z,1.22,1.22,y,y+.22);
    }
  });
  m.scope('Four clock faces',()=>{
    band(m,'light',13.2,54.9,1.1);band(m,'sandstone',12,56,11.8);
    for(let s=0;s<4;s++){
      panel(m,'light',s,0,57.1,10.7,9.5,6.04,.10);
      dial(m,s,61.8,6.2,4.1,p.time==='time0300'?3:10);
      for(const x of [-4.9,4.9])bar(m,'gold',s,x,57.4,x,66.3,6.22,.10);
    }
    band(m,'light',13.2,67.9,.75);band(m,'gold',13.35,68.68,.18);
  });
  m.scope('Belfry and Gothic roof',()=>{
    band(m,'sandstone',10.8,68.9,7.7);
    for(let s=0;s<4;s++)for(const x of [-3.4,-1.7,0,1.7,3.4]){
      arch(m,'dark',s,x,70,1.05,5.4,5.425);
      for(let y=70.3;y<74.9;y+=.48)panel(m,'gold',s,x,y,1,.10,5.48);
      bar(m,'light',s,x-.66,69.7,x-.66,75.3,5.52,.18);
    }
    band(m,'light',12.3,76.6,.7);
    m.loft('dark',rect(11.8,11.8),77.3,rect(5,5),86.8);
    for(let s=0;s<4;s++)for(const x of [-4,-2,0,2,4])beam(m,'gold',face(s,x,77.5,5.92),face(s,x*.42,86.8,2.51),.12);
    band(m,'gold',5.4,86.9,.3);band(m,'dark',4.4,87.2,3.5);
    for(let s=0;s<4;s++)for(const x of [-1.35,0,1.35])arch(m,'gold',s,x,87.5,.75,2.7,2.225);
    m.spire('dark',rect(5.3,5.3),90.7,95);
    m.spire('gold',ngon(8,.32),94.5,96);
    for(const x of [-5.65,5.65])for(const z of [-5.65,5.65]){
      m.prism('light',ngon(8,.48,0,x,z),76.9,80.1);m.spire('gold',ngon(8,.63,0,x,z),80.1,84);
    }
  });
  return m;
}

/** Open four-sided truss between square rings; no opaque central core. */
function truss(m:MeshBuilder,mat:string,y0:number,y1:number,r0:number,r1:number,bays:number,w:number):void{
  const corners=(r:number,y:number):Vec3[]=>[[-r,y,-r],[r,y,-r],[r,y,r],[-r,y,r]];
  for(let k=0;k<bays;k++){
    const t=k/bays,u=(k+1)/bays,a=corners(r0+(r1-r0)*t,y0+(y1-y0)*t),b=corners(r0+(r1-r0)*u,y0+(y1-y0)*u);
    for(let s=0;s<4;s++){
      const n=(s+1)%4;
      beam(m,mat,a[s]!,b[s]!,w);beam(m,mat,a[s]!,a[n]!,w*.65);
      beam(m,mat,a[s]!,b[n]!,w*.5);beam(m,mat,a[n]!,b[s]!,w*.5);
    }
  }
}
export function eiffelTower(given?:ParamValues):MeshBuilder{
  resolveParams([],given); const m=model();
  m.scope('Four splayed lattice piers',()=>{
    for(const sx of [-1,1])for(const sz of [-1,1]){
      m.box('stone',sx*52,sz*52,21,21,0,5);
      const stages=[[5,52,8.5],[28,42,7],[57,29,5],[115,16,3.4]];
      for(let k=0;k<stages.length-1;k++){
        const [y0,c0,r0]=stages[k]!,[y1,c1,r1]=stages[k+1]!;
        const pts=(t:number):Vec3[]=>{const c=c0!+(c1!-c0!)*t,r=r0!+(r1!-r0!)*t,y=y0!+(y1!-y0!)*t;return [[sx*c-r,y,sz*c-r],[sx*c+r,y,sz*c-r],[sx*c+r,y,sz*c+r],[sx*c-r,y,sz*c+r]];};
        const n=k===2?3:2;
        for(let j=0;j<n;j++){
          const a=pts(j/n),b=pts((j+1)/n);
          for(let f=0;f<4;f++){const q=(f+1)%4;beam(m,'iron',a[f]!,b[f]!,1.0);beam(m,'iron',a[f]!,b[q]!,.48);beam(m,'iron',a[f]!,a[q]!,.5);}
        }
      }
    }
  });
  m.scope('Arches and observation decks',()=>{
    // Decorative arches span the open space underneath the first platform.
    for(let s=0;s<4;s++)for(let i=0;i<18;i++){
      const point=(t:number):Vec3=>{const y=8+42*Math.sin(t);return face(s,50*Math.cos(t),y,52-.36*y);};
      const a=i*Math.PI/18,b=(i+1)*Math.PI/18;
      beam(m,'iron',point(a),point(b),1.3);
      const p=point((a+b)/2),x=50*Math.cos((a+b)/2);if(Math.abs(x)<32)beam(m,'iron',p,face(s,x,56,33),.45);
    }
    for(const [y,w] of [[57,72],[115,42],[276,13]]){
      if(w!>20){
        const walk=w!>50?9:6;
        for(const sign of [-1,1]){
          m.box('iron',0,sign*(w!-walk)/2,w!,walk,y!,y!+3);
          m.box('iron',sign*(w!-walk)/2,0,walk,w!-2*walk,y!,y!+3);
        }
      }else band(m,'iron',w!,y!,3);
      for(let s=0;s<4;s++){
        bar(m,'iron',s,-w!/2,y!+5,w!/2,y!+5,w!/2,.35);
        for(let x=-w!/2+1;x<w!/2;x+=3.6)bar(m,'iron',s,x,y!+3,x,y!+5,w!/2,.22);
      }
    }
  });
  m.scope('Tapered upper lattice and antenna',()=>{
    truss(m,'iron',118,190,16,7.5,5,.9);truss(m,'iron',190,276,7.5,3.8,6,.7);
    band(m,'dark',8.8,279,5);m.loft('iron',rect(9,9),284,rect(3.8,3.8),296);
    m.prism('iron',ngon(8,1.5),296,314);m.prism('steel',ngon(8,.6),314,330);
  });return m;
}

export function bellTower(given?:ParamValues):MeshBuilder{
  const p=resolveParams(BELL,given),n=+p.storeys!,m=model(p.roof),h=n*4.8;
  m.scope('Stone and timber storeys',()=>{
    band(m,'stone',9,0,.7);band(m,'stone',7.4,.7,h-.7);
    for(let k=0;k<n;k++){
      const y=k*4.8;
      band(m,'timber',8.2,y+.8,.38);
      for(let s=0;s<4;s++){
        for(const x of [-3.45,3.45])bar(m,'timber',s,x,y+1.2,x,y+4.7,3.8,.34);
        arch(m,'dark',s,0,y+1.8,1.6,2.1,3.725);
        bar(m,'timber',s,-3.3,y+1.3,-1.5,y+4.5,3.83,.24);
        bar(m,'timber',s,3.3,y+1.3,1.5,y+4.5,3.83,.24);
        for(const x of [-2.6,2.6])panel(m,'trim',s,x,y+2,.6,.45,3.72);
      }
    }
  });
  m.scope('Open belfry and bell',()=>{
    band(m,'timber',8.4,h,.5);
    for(const x of [-3.4,3.4])for(const z of [-3.4,3.4])m.box('timber',x,z,.55,.55,h+.5,h+5);
    for(let s=0;s<4;s++){
      bar(m,'timber',s,-3.4,h+4.8,3.4,h+4.8,3.4,.45);
      bar(m,'timber',s,-3.4,h+2.8,-1.5,h+4.8,3.4,.28);
      bar(m,'timber',s,3.4,h+2.8,1.5,h+4.8,3.4,.28);
    }
    beam(m,'timber',[-3.4,h+4,0],[3.4,h+4,0],.4);
    m.loft('gold',ngon(24,1.3),h+1.3,ngon(24,.8),h+2.2);
    m.loft('gold',ngon(24,.8),h+2.2,ngon(24,.45),h+3.5);
    m.prism('dark',ngon(12,.15),h+1,h+3.9);
  });
  m.scope('Steep gabled roof',()=>{
    m.slab('roof',[[-4.7,h+4.93,-4.5],[4.7,h+4.93,-4.5],[0,h+10,-4.5]],[0,0,9]);
    for(const z of [-4.56,4.56]){
      beam(m,'timber',[-4.8,h+4.9,z],[0,h+10.1,z],.25);beam(m,'timber',[0,h+10.1,z],[4.8,h+4.9,z],.25);
      beam(m,'timber',[-4.4,h+5,z],[4.4,h+5,z],.2);
      for(const x of [-2.2,0,2.2])beam(m,'timber',[x,h+5,z],[0,h+9.8,z],.18);
    }
  });return m;
}

function fortress(given:ParamValues|undefined,watch:boolean):MeshBuilder{
  const p=resolveParams(FORT,given),m=model(),h=+p.storeys!*6;
  m.scope('Masonry and corner quoins',()=>{
    band(m,'stone',watch?13:10,0,1);band(m,'stone',8.8,1,h-1);
    for(let s=0;s<4;s++){
      arch(m,'dark',s,0,1,2.1,4,4.425);
      for(let k=1;k<+p.storeys!;k++)arch(m,'dark',s,0,k*6+1,1,3,4.425);
      for(const x of [-4.15,4.15])for(let y=1.1;y<h-.5;y+=1.4)panel(m,'trim',s,x,y,.7,.75,4.44,.12);
      for(let y=1.5;y<h-1;y+=1.6)for(let x=-2.8;x<3;x+=1.9){const bx=x+(Math.round(y)%2)*.25;if(Math.abs(bx)>1.5)panel(m,'trim',s,bx,y,.7,.23,4.46);}
    }
  });
  m.scope('Machicolations and battlements',()=>{
    for(let s=0;s<4;s++)for(let x=-4;x<=4;x+=1.6)panel(m,'trim',s,x,h-1.8,.65,1.3,4.48,.35);
    band(m,'trim',10.5,h-.4,.6);band(m,'stone',10.3,h+.2,1.5);
    for(let s=0;s<4;s++)for(const x of [-4.35,-1.45,1.45,4.35]){
      const pos=face(s,x,0,4.65);m.box('trim',pos[0],pos[2],1.4,1.4,h+1.7,h+3.6);
    }
    // The recessed roof is visible between merlons.
    band(m,'dark',8.5,h+1.71,.03);
  });
  m.scope('Banners and approach',()=>{
    if(p.banners!=='none')for(const s of [0,2]){
      bar(m,'timber',s,-3.1,h-.1,-.9,h-.1,5.35,.15);
      panel(m,p.banners==='blue'?'blue':'red',s,-2,h-5.5,1.6,5.1,5.4,.05);
    }
    for(let i=0;i<4;i++)m.box('stone',0,5+i*.65,3.6,.66,0,1-i*.23);
    if(watch)for(const x of [-5.6,5.6])for(const z of [-5.6,5.6]){
      m.box('trim',x,z,1.2,1.2,1,2.8);m.spire('roof',ngon(8,.7,0,x,z),2.8,5);
    }
  });return m;
}
export function stoneTower(p?:ParamValues):MeshBuilder{return fortress(p,false);}
export function watchTower(p?:ParamValues):MeshBuilder{return fortress(p,true);}
export function stoneTurret(given?:ParamValues):MeshBuilder{
  const p=resolveParams(TURRET,given),m=model(),h=+p.storeys!*5,n=+p.battlements!;
  m.scope('Octagonal stone drum',()=>{
    m.prism('trim',ngon(8,6,Math.PI/8),0,1.2);m.prism('stone',ngon(8,5.4,Math.PI/8),1.2,h);
    for(let y=5;y<h;y+=5){m.prism('timber',ngon(8,5.8,Math.PI/8),y,y+.4);}
    for(let i=0;i<8;i++){
      const a=i*TAU/8,x=5.3*Math.cos(a),z=5.3*Math.sin(a);
      m.loft('trim',rect(1.2,1.6,x,z,-a),.2,rect(.7,1,x,z,-a),2.6);
    }
    for(let s=0;s<4;s++)for(let y=1.7;y<h-1;y+=1.5)for(const x of [-1.55,1.55])panel(m,'trim',s,x,y,.7,.22,5.015);
    for(let s=0;s<4;s++)for(let y=2;y<h-1;y+=5)arch(m,'dark',s,0,y,.8,1.9,5.02);
  });
  m.scope('Corbelled crown',()=>{
    m.loft('trim',ngon(8,5.4,Math.PI/8),h,ngon(8,6.1,Math.PI/8),h+1.2);
    m.prism('stone',ngon(8,6.1,Math.PI/8),h+1.2,h+2);m.prism('dark',ngon(8,5.2,Math.PI/8),h+2.02,h+2.05);
    for(let i=0;i<n;i++){
      const a=i*TAU/n;m.box('trim',5.5*Math.cos(a),5.5*Math.sin(a),1.5,1.5,h+2,h+3.5,-a);
    }
  });return m;
}

export function radioTower(given?:ParamValues):MeshBuilder{
  const p=resolveParams(RADIO,given),m=model(),n=+p.bays!,h=n*4;
  m.scope('Painted lattice mast',()=>{
    for(const x of [-2.3,2.3])for(const z of [-2.3,2.3])m.box('stone',x,z,1.2,1.2,0,1);
    for(let i=0;i<n;i++)truss(m,i%2?'white':'red',1.10+i*4,4.90+i*4,2.3,2.3,1,.18);
    band(m,'steel',5,h+1,.2);
    for(let s=0;s<4;s++){
      beam(m,'steel',face(s,-2.5,h+2.3,2.5),face(s,2.5,h+2.3,2.5),.1);
      for(const x of [-2.4,0,2.4])beam(m,'steel',face(s,x,h+1.2,2.5),face(s,x,h+2.3,2.5),.1);
    }
    for(let y=1;y<h;y+=.5)bar(m,'steel',0,-.3,y,.3,y,2.45,.06);
    for(const x of [-.35,.35])bar(m,'steel',0,x,1,x,h+1,2.45,.07);
    m.prism('white',ngon(8,.1,0,0,0),h+1.2,h+5);
  });
  m.scope('Microwave dishes and panel antennas',()=>{
    for(let i=0;i<+p.dishes!;i++){
      const s=i%4,y=h*(.42+i*.14),z=3.4;
      bar(m,'steel',s,0,y,0,y+1,2.8,.18);
      // Shallow paraboloid, open toward the receiver with a solid back skin.
      const center=face(s,0,y,z),rings=[.45,.9,1.4];
      let prev=0;
      for(const r of rings){for(let j=0;j<24;j++){
        const point=(rad:number,k:number)=>face(s,rad*Math.cos(k*TAU/24),y+rad*Math.sin(k*TAU/24),z+.32*(rad/1.4)**2);
        const back=(p:Vec3):Vec3=>{const d=face(s,0,0,.04);return [p[0]-d[0],p[1],p[2]-d[2]];};
        if(prev===0){m.tri('white',center,point(r,j),point(r,j+1));m.tri('white',back(center),back(point(r,j+1)),back(point(r,j)));}
        else {m.quad('white',point(prev,j),point(r,j),point(r,j+1),point(prev,j+1));m.quad('white',back(point(prev,j+1)),back(point(r,j+1)),back(point(r,j)),back(point(prev,j)));}
        if(r===1.4)m.quad('white',point(r,j),back(point(r,j)),back(point(r,j+1)),point(r,j+1));
        const a=point(r,j),b=point(r,j+1);if(r===1.4)beam(m,'steel',a,b,.055);
      }prev=r;}
      beam(m,'steel',center,face(s,0,y,z+1),.12);
    }
    for(const s of [1,3])panel(m,'white',s,0,h-4,.65,3,2.65,.28);
  });return m;
}
export function transmissionTower(given?:ParamValues):MeshBuilder{
  const p=resolveParams(POWER,given),m=model(),n=+p.bays!,h=n*5;
  m.scope('Galvanized lattice shaft',()=>{
    for(const x of [-4,4])for(const z of [-4,4])m.box('stone',x,z,1.5,1.5,0,.8);
    truss(m,'steel',.8,h,4,1.1,n,.22);truss(m,'steel',h,h+8,1.1,.35,3,.16);
  });
  m.scope('Crossarms and hanging insulators',()=>{
    const levels=+p.arms!;
    for(let k=0;k<levels;k++){
      const y=h-10+k*6,w=7-k*.8;
      for(const sz of [-1,1]){
        beam(m,'steel',[-w,y,sz],[w,y,sz],.22);
        beam(m,'steel',[-w,y,sz],[0,y+2,sz],.18);beam(m,'steel', [0,y+2,sz],[w,y,sz],.18);
        for(let x=-w+1;x<w;x+=1.5)beam(m,'steel',[x,y,sz],[x+1,y+1,sz],.10);
      }
      for(const x of [-w,w]){
        beam(m,'steel',[x,y,-1],[x,y,1],.2);
        m.prism('steel',ngon(8,.08,0,x,0),y-2.8,y);
        for(let j=0;j<9;j++)m.prism('insulator',ngon(12,.30,0,x,0),y-2.6+j*.26,y-2.48+j*.26);
      }
    }
  });return m;
}

// Geometry is centred, grounded and in metres. Legacy placement compensation
// lives in legacy-models.json; Eiffel alone has an exceptional display scale.
const entry=(id:string,title:string,build:ProceduralDesign['build'],_height:number,_placedHeight:number,params?:ParamSpec[],credit?:string):ProceduralDesign=>({
  id,title,build,params,references:id,catalog:{category:'Towers',group:'towers',defaultScale:id==='tower-eiffel'?0.55:1,
    license:credit?'CC-BY-3.0':'CC0',author:credit?`Rail Island; reference: ${credit}`:'Rail Island',source:'Rail Island procedural reconstruction; see docs/models/towers.md'},
});
export const TOWERS:readonly ProceduralDesign[]=[
  entry('tower-bell','Bell Tower',bellTower,24.584785,34.18117,BELL),
  entry('tower-bigben','Big Ben',bigBen,96,81.52325,CLOCK,'Daqian Dong'),
  entry('tower-eiffel','Eiffel Tower',eiffelTower,330,183.02439,undefined,'Scott Marshall'),
  entry('tower-radio','Radio Tower',radioTower,37,51.99029,RADIO,'Poly by Google'),
  entry('tower-stone','Stone Tower',stoneTower,21.6,41.66234,FORT),
  entry('tower-kenney','Stone Turret',stoneTurret,13.5,34.6981,TURRET),
  entry('tower-transmission','Transmission Tower',transmissionTower,38.017048,48.56582,POWER),
  entry('tower-watch','Watch Tower',watchTower,21.6,55.87389,FORT),
];
