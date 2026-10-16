// Remaining freight body families from the native XML profiles.
import { MeshBuilder, type Ring } from './meshBuilder.ts';
import { Wagon } from './wagonParts.ts';
import { WAGON_CATALOG } from './wagons.ts';
import { numberLines } from './freightWagonParts.ts';
import { resolveParams, type ParamValues, type ParamSpec, type ProceduralDesign } from './design.ts';
const BODY:ParamSpec[]=[{name:'body',title:'Body',default:'box',values:[{value:'box',title:'Z covered wagon'},{value:'beer',title:'Lp refrigerated wagon'},{value:'sliding',title:'Zaz bogie covered wagon'}]}];
const palette={body:{color:'#934b34'},rib:{color:'#ad6044'},roof:{color:'#665b53'},cream:{color:'#dddcc7'},frame:{color:'#292a29'},ink:{color:'#e4dec8'},glass:{color:'#647a81'}};
function chassis(c:Wagon,length:number,axles:number[],bogies=false):void {
 const m=c.m;
 m.scope('underframe',()=>{c.box('frame',.5,length-.5,.78,1.1,-1.3,1.3);for(const x of axles){if(bogies)c.freightBogie(x,1.9);else{c.wheelset(c.X(x),.46);m.axleAt(c.X(x),.46*Math.cos(Math.PI/24));}}});
 for(const s of [-1,1])m.scope(s>0?'front gear':'rear gear',()=>c.drawGear(s,s>0?length:0,s>0?length-.45:.45,s>0?length-.5:.5,.8,1.1,1.4,'frame'));
}
export function coveredWagon(given?:ParamValues):MeshBuilder {
 const {body}=resolveParams(BODY,given),beer=body==='beer',sliding=body==='sliding';
 const length=beer?11.9:sliding?16.4:14,h=beer?4.1:sliding?4.2:3.9,wall=beer?3.5:sliding?3.7:3.4;
 const c=new Wagon({...palette,body:beer?palette.cream:palette.body},length/2),m=c.m;
 chassis(c,length,beer?[2.45,9.45]:sliding?[2.75,13.65]:[3,11.1],sliding);
 m.scope('body',()=>{
  c.box('body',.55,length-.55,1.1,wall,-1.4,1.4);
  const roof:Ring=[[-1.4,wall],[-1.2,wall+.2],[-.7,h-.1],[-.2,h],[.2,h],[.7,h-.1],[1.2,wall+.2],[1.4,wall]];
  m.sweep('roof','x',roof,c.X(.54),roof,c.X(length-.54));
  for(const s of [-1,1]){
   m.scope(s>0?'right side':'left side',()=>{
    if(beer){for(let y=1.3;y<wall;y+=.2)c.sideBox('roof',s,.6,length-.6,y,y+.025,1.4,1.415);}
    else for(let x=.7;x<length-.6;x+=1.3)c.sideBox('rib',s,x,x+.075,1.12,wall,1.4,1.48);
    const doorW=beer?2:sliding?5.1:2.5;
    c.sideBox('body',s,(length-doorW)/2,(length+doorW)/2,1.12,wall-.12,1.48,1.51);
    for(const x of [(length-doorW)/2,(length+doorW)/2,length/2])c.sideBox('rib',s,x,x+.055,1.12,wall-.12,1.51,1.54);
    c.sideBox('frame',s,length/2+.12,length/2+.17,1.9,2.25,1.535,1.545);
    c.sideBox('rib',s,(length-doorW)/2-.2,(length+doorW)/2+.2,wall-.08,wall,1.48,1.53);
    c.letters(s,1.49,1.5,numberLines('21 54 1500 001-1','CD',1.35,.09),'ink');
   });
  }
 });return m;
}
export function vteWagon():MeshBuilder {
 const c=new Wagon(palette,4.9),m=c.m;chassis(c,9.8,[1.95,7.85]);
 m.scope('open body',()=>{
  c.box('body',.6,9.2,1.1,1.2,-1.4,1.4);
  for(const s of [-1,1]){
   c.sideBox('body',s,.6,9.2,1.2,2.7,1.35,1.45);c.sideBox('rib',s,.6,9.2,2.7,2.8,1.33,1.5);
   for(let x=.6;x<=9.2;x+=1.1)c.sideBox('rib',s,x,x+.07,1.2,2.7,1.451,1.5);
   c.sideBox('rib',s,3.8,6.1,1.2,2.6,1.5,1.52);
   c.letters(s,1.53,1.4,numberLines('21 54 1500 001-1','CD',1.5,.09),'ink');
  }
  for(const x of [.6,9.1])c.box('body',x,x+.1,1.2,2.79,-1.34,1.34);
 });return m;
}
export function heavyWagon():MeshBuilder {
 const c=new Wagon(palette,12.05),m=c.m;
 m.scope('running gear',()=>{for(const x of [3.15,20.75])c.freightBogie(x,2.5);});
 m.scope('low deck',()=>{
  const section:Ring=[[2.9,.9],[5.5,.9],[6.8,.2],[17.4,.2],[18.7,.9],[21.5,.9],[21.5,1.3],[18.7,1.3],[17.4,.6],[6.8,.6],[5.5,1.3],[2.9,1.3]];
  c.sideSweep('body',section,-1.4,1.4);
  for(const s of [-1,1])for(let x=7.6;x<17;x+=1.5)c.sideBox('rib',s,x,x+.1,.6,1.7,1.401,1.5);
  for(const s of [-1,1])for(const x of [4.1,5.6,18.7,20.2])c.sideBox('rib',s,x,x+.1,1.3,2.6,1.401,1.5);
  c.box('frame',1.2,1.9,.8,2.6,-.9,.9);c.box('glass',1.19,1.91,1.5,2.3,-.91,.91);
  c.box('frame',1.1,2,2.6,2.7,-1,1);
  for(const s of [-1,1])c.letters(s,1.51,7,numberLines('31 54 3999 001-3','CD',.65,.07),'ink');
 });
 for(const s of [-1,1])m.scope('buffers',()=>c.drawGear(s,s>0?23.2:.9,s>0?22.75:1.35,s>0?22.7:1.4,.75,1.05,1.4,'frame'));
 return m;
}
export const WAGON_EXTRAS:ProceduralDesign[]=[
 {id:'veh-legacy-covered-wagon',title:'Covered Freight Wagon',build:coveredWagon,params:BODY},
 {id:'veh-legacy-open-wagon',title:'Vte Open Wagon',build:vteWagon},
 {id:'veh-legacy-heavy-wagon',title:'Uaaikk Low Loader',build:heavyWagon},
].map(d=>({...d,catalog:WAGON_CATALOG,references:'remaining-wagons'}));
