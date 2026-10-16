// Shared, Node-free tower geometry. Dimensions are metres, base on y=0.
import { MeshBuilder, type MaterialSpec } from './meshBuilder.ts';
import type { Vec3 } from './meshCore.ts';
export const TOWER_PALETTE: Record<string, MaterialSpec> = {
  stone: { color: '#a5a499' }, trim: { color: '#d1cbbc' }, sandstone: { color: '#cbb18a' },
  light: { color: '#ead7b4' }, dark: { color: '#343b3f' }, roof: { color: '#345f64' },
  timber: { color: '#795336' }, gold: { color: '#cba554', metallic: .55 },
  clock: { color: '#f2e9d1' }, blue: { color: '#18475d' }, red: { color: '#a64d36' },
  steel: { color: '#8f9a9e', metallic: .5 }, white: { color: '#dddcd2' },
  iron: { color: '#88715d', metallic: .45 }, insulator: { color: '#81978d' },
};
export const TAU = Math.PI * 2;
export function beam(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, width: number): void {
  const d = b.map((v,i)=>v-a[i]!) as Vec3;
  const length = Math.hypot(...d);
  const n = d.map(v=>v/length) as Vec3;
  const up: Vec3 = Math.abs(n[1])>.9 ? [1,0,0] : [0,1,0];
  const u: Vec3 = [n[1]*up[2]-n[2]*up[1], n[2]*up[0]-n[0]*up[2], n[0]*up[1]-n[1]*up[0]];
  const ul = Math.hypot(...u); for(let i=0;i<3;i++) u[i]=u[i]!/ul;
  const v: Vec3 = [n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
  m.slab(mat, [[-1,-1],[1,-1],[1,1],[-1,1]].map(([s,t])=>a.map((x,i)=>x+width/2*(s!*u[i]!+t!*v[i]!)) as Vec3),d);
}
/** A local facade point (horizontal, height, outward depth), rotated about Y. */
export function face(side: number, x: number, y: number, z: number): Vec3 {
  const a=side*Math.PI/2; return [x*Math.cos(a)+z*Math.sin(a),y,-x*Math.sin(a)+z*Math.cos(a)];
}
export function bar(m: MeshBuilder, mat: string, side: number, x0: number,y0: number,x1: number,y1: number,z: number,w: number): void {
  if(w<=.18){
    const len=Math.hypot(x1-x0,y1-y0),dx=-(y1-y0)/len*w/2,dy=(x1-x0)/len*w/2;
    m.quad(mat,face(side,x0-dx,y0-dy,z),face(side,x1-dx,y1-dy,z),face(side,x1+dx,y1+dy,z),face(side,x0+dx,y0+dy,z));
  }else beam(m,mat,face(side,x0,y0,z),face(side,x1,y1,z),w);
}
export function panel(m: MeshBuilder, mat: string, side: number,x: number,y: number,w: number,h: number,z: number,depth=.04): void {
  const pts=[[x-w/2,y],[x+w/2,y],[x+w/2,y+h],[x-w/2,y+h]].map(([u,v])=>face(side,u!,v!,z));
  if(depth<=.05)m.quad(mat,pts[0]!,pts[1]!,pts[2]!,pts[3]!);
  else m.slab(mat,pts,face(side,0,0,depth));
}
export function arch(m: MeshBuilder, mat: string, side: number,x: number,y: number,w: number,h: number,z: number): void {
  const r=w/2, spring=y+h-r;
  const pts: Vec3[]=[face(side,x-r,y,z),face(side,x+r,y,z)];
  for(let i=0;i<=12;i++){ const a=i*Math.PI/12; pts.push(face(side,x+r*Math.cos(a),spring+r*Math.sin(a),z)); }
  for(let i=1;i<pts.length-1;i++)m.tri(mat,pts[0]!,pts[i]!,pts[i+1]!);
}
export function dial(m: MeshBuilder,side: number,y: number,z: number,r: number,hour: number): void {
  // Independent depth layers keep gold, enamel, indices and hands from flickering.
  const disk=(mat:string,rad:number,d:number)=>{for(let i=0;i<48;i++)m.tri(mat,face(side,0,y,d),face(side,rad*Math.cos(i*TAU/48),y+rad*Math.sin(i*TAU/48),d),face(side,rad*Math.cos((i+1)*TAU/48),y+rad*Math.sin((i+1)*TAU/48),d));};
  disk('gold',r,z); disk('blue',r*.94,z+.06); disk('clock',r*.87,z+.12);
  for(let i=0;i<60;i++){
    const a=i*TAU/60, rr=r*(i%5===0?.73:.83);
    bar(m,'blue',side,rr*Math.sin(a),y+rr*Math.cos(a),r*.86*Math.sin(a),y+r*.86*Math.cos(a),z+.20,r*(i%5===0?.035:.014));
  }
  // Roman numerals in a radial frame: XII, I ... XI.
  const numerals=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
  for(let i=0;i<12;i++){
    const a=i*TAU/12, word=numerals[i]!, scale=r*.095;
    const pt=(x:number,v:number):[number,number]=>[Math.sin(a)*r*.66+Math.cos(a)*x+Math.sin(a)*v,y+Math.cos(a)*r*.66-Math.sin(a)*x+Math.cos(a)*v];
    [...word].forEach((c,j)=>{
      const x=(j-(word.length-1)/2)*scale*.75;
      const strokes=c==='I'?[[0,-1,0,1]]:c==='V'?[[-.35,1,0,-1],[0,-1,.35,1]]:[[-.35,-1,.35,1],[-.35,1,.35,-1]];
      for(const [u,v,s,t] of strokes){const p=pt(x+u!*scale,v!*scale),q=pt(x+s!*scale,t!*scale);bar(m,'blue',side,...p,...q,z+.22,scale*.16);}
    });
  }
  const minute=hour===3?0:10, ha=(hour+minute/60)*TAU/12, ma=minute*TAU/60;
  for(const [a,len,w] of [[ha,.45,.07],[ma,.7,.045]])bar(m,'blue',side,0,y,r*len!*Math.sin(a!),y+r*len!*Math.cos(a!),z+.30,r*w!);
  disk('gold',r*.065,z+.36);
}
