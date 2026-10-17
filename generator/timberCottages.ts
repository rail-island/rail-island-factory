// Original parametric cottages inspired by the Quaternius cottage vocabulary.
// Metres, +z street front, y=0 ground. No imported meshes or textures.
import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { Vec3 } from "./meshCore.ts";

const choice = (name: string, title: string, values: string[]): ParamSpec => ({
  name, title, default: values[0], values: values.map(value => ({ value, title: value[0].toUpperCase() + value.slice(1) })),
});
export const TIMBER_COTTAGE_PARAMS: readonly ParamSpec[] = [
  choice("pitch", "Roof pitch", ["steep", "gentle"]),
  choice("framing", "Timber framing", ["braced", "simple"]),
  choice("entrance", "Entrance", ["porch", "step", "awning"]),
  choice("chimney", "Chimney", ["stone", "none"]),
  choice("roof", "Tile colour", ["terracotta", "ochre", "slate", "moss"]),
  choice("walls", "Plaster colour", ["ivory", "cream", "sage"]),
  choice("timber", "Timber finish", ["oak", "walnut", "weathered"]),
];
export const roofs: Record<string, string> = { terracotta: "#c76750", ochre: "#be914e", slate: "#64768b", moss: "#73865a" };
export const walls: Record<string, string> = { ivory: "#e5e1d2", cream: "#e8d5ab", sage: "#c3cdb4" };
export const timbers: Record<string, string> = { oak: "#927044", walnut: "#624835", weathered: "#858072" };

function cottage(tall: boolean, values?: ParamValues): MeshBuilder {
  const p = resolveParams(TIMBER_COTTAGE_PARAMS, values);
  const pal: Record<string, MaterialSpec> = {
    tile: { color: roofs[p.roof] }, plaster: { color: walls[p.walls] }, timber: { color: timbers[p.timber] },
    stone: { color: "#989a91" }, quoin: { color: "#b9bbae" }, door: { color: "#ad8b55" },
    glass: { color: "#4e6870", roughness: 0.45 }, iron: { color: "#343a38" },
  };
  const m = new MeshBuilder(pal);
  const w = tall ? 7.8 : 7, d = tall ? 8.6 : 6.6;
  const eave = tall ? 6.2 : 3.5, pitch = p.pitch === "steep" ? 1.12 : 0.85;
  const half = w / 2 + 0.6, ridge = eave + w / 2 * pitch;
  const roofY = (x: number) => ridge - Math.abs(x) * pitch;
  // Sloped beams in the x/y plane, extruded through z.
  const beam = (a: [number, number], b: [number, number], z: number, width = 0.24, depth = 0.24) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / len * width / 2, ny = (b[0] - a[0]) / len * width / 2;
    m.slab("timber", [[a[0]+nx,a[1]+ny,z], [b[0]+nx,b[1]+ny,z], [b[0]-nx,b[1]-ny,z], [a[0]-nx,a[1]-ny,z]], [0,0,-depth]);
  };
  // Wall panel coordinates: u across the face, out away from the wall.
  const panel = (side: boolean, sign: number, u: number, y: number, width: number, height: number, mat: string, out: number, depth: number) => {
    if (side) m.box(mat, sign * (w/2 + out), u, depth, width, y, y + height);
    else m.box(mat, u, sign * (d/2 + out), width, depth, y, y + height);
  };
  m.scope("plaster and stone shell", () => {
    m.box("stone", 0, 0, w + 0.14, d + 0.14, 0, tall ? 2.95 : 0.55);
    m.box("plaster", 0, 0, w, d, tall ? 2.93 : 0.53, eave, 0, false);
    for (const s of [-1,1]) {
      m.slab("plaster", [[-w/2,eave,s*d/2], [w/2,eave,s*d/2], [0,ridge,s*d/2]], [0,0,-s*0.18]);
      for (const x of [-w/2,w/2]) {
        for (let row = 0; row < (tall ? 6 : 1); row++) {
          m.box("quoin", x, s*d/2, row%2 ? 0.55 : 0.38, row%2 ? 0.38 : 0.55, row*0.48+0.035, row*0.48+0.46);
        }
      }
    }
  });
  m.scope("half timber frame", () => {
    const bottom = tall ? 3.02 : 0.6;
    for (const s of [-1,1]) {
      for (const y of [bottom, eave-0.25]) {
        panel(false,s,0,y,w+0.22,0.22,"timber",0.07,0.24);
        panel(true,s,0,y,d-0.3,0.22,"timber",0.08,0.22);
      }
      for (const x of [-w/2+0.12,0,w/2-0.12]) panel(false,s,x,bottom+0.24,0.22,eave-bottom-0.5,"timber",0.09,0.25);
      for (const z of [-d/2+0.12,0,d/2-0.12]) panel(true,s,z,bottom+0.25,0.22,eave-bottom-0.51,"timber",0.08,0.22);
      const z = s*(d/2+0.21);
      // The far gable beam extrudes outward, staying clear of the plaster.
      const faceZ = s > 0 ? z : z + 0.24;
      beam([-half,roofY(half)+0.05],[0,ridge+0.05],faceZ,0.3);
      beam([0,ridge+0.05],[half,roofY(half)+0.05],faceZ,0.3);
      beam([0,eave+0.03],[0,ridge-0.22],faceZ,0.22);
      if (p.framing === "braced") {
        for (const x of [-1,1]) beam([x*(w/2-0.35),bottom+0.35],[x*(w/2-1.2),bottom+1.05],faceZ,0.18);
      }
    }
  });
  m.scope("sculpted barrel tiles", () => {
    const rows = tall ? 12 : 10, columns = tall ? 14 : 12;
    const z0 = -d/2-0.48, dz = (d+0.96)/columns;
    const run = half/rows;
    for (const sign of [-1,1]) {
      // Continuous roof backing closes the tile gaps and has a visible thick eave.
      m.slab("timber", [[0,ridge-0.025,z0], [sign*half,roofY(half)-0.025,z0], [sign*half,roofY(half)-0.025,-z0], [0,ridge-0.025,-z0]], [0,-0.16,0]);
      for (let row=0; row<rows; row++) for (let col=0; col<columns; col++) {
        const x0 = sign*(row*run+0.02), x1 = sign*((row+1)*run-0.012);
        const za = z0+col*dz+0.018, zb = z0+(col+1)*dz-0.018;
        // A convex six-point cross section, extruded down the roof slope.
        const profile: Vec3[] = [
          [x0,roofY(x0)+0.035,za], [x0,roofY(x0)+0.14,za],
          [x0,roofY(x0)+0.23,za+(zb-za)/3], [x0,roofY(x0)+0.23,za+2*(zb-za)/3],
          [x0,roofY(x0)+0.14,zb], [x0,roofY(x0)+0.035,zb],
        ];
        m.slab("tile", profile, [x1-x0,roofY(x1)-roofY(x0),0]);
      }
    }
    m.box("timber",0,0,0.34,d+1.55,ridge+0.24,ridge+0.52);
  });
  m.scope("windows and shutters", () => {
    for (const side of [false,true]) for (const s of [-1,1]) {
      for (const u of (side ? [-d*0.26,d*0.26] : [-w*0.26,w*0.26])) {
        for (const y of (tall ? [1.05,4.05] : [1.32])) {
          panel(side,s,u,y,1.04,1.25,"timber",0.12,0.20);
          panel(side,s,u,y+0.1,0.82,1.04,"glass",0.231,0.04);
          panel(side,s,u,y+0.11,0.07,1.02,"door",0.265,0.04);
          panel(side,s,u,y+0.58,0.80,0.07,"door",0.269,0.05);
          panel(side,s,u,y-0.12,1.24,0.14,"timber",0.23,0.36);
          for (const edge of [-1,1]) {
            panel(side,s,u+edge*0.75,y+0.025,0.32,1.20,"door",0.11,0.15);
            for (const dy of [0.2,0.9]) panel(side,s,u+edge*0.75,y+dy,0.30,0.075,"iron",0.20,0.04);
          }
        }
      }
    }
  });
  m.scope("plank door and entrance", () => {
    panel(false,1,0,0.36,1.62,2.3,"timber",0.16,0.28);
    for (let i=0;i<7;i++) panel(false,1,(i-3)*0.18,0.4,0.165,2.10,"door",0.32,0.075);
    for (const y of [0.77,1.95]) panel(false,1,0,y,1.23,0.09,"iron",0.377,0.045);
    panel(false,1,0.43,1.35,0.10,0.18,"iron",0.42,0.10);
    m.box("stone",0,d/2+0.55,2.1,1.0,0,0.28);
    if (p.entrance !== "step") {
      const reach = p.entrance === "porch" ? 1.9 : 1.05;
      const z = d/2;
      m.slab("tile", [[-1.3,2.95,z], [1.3,2.95,z], [1.3,2.63,z+reach], [-1.3,2.63,z+reach]], [0,-0.16,0]);
      if (p.entrance === "porch") {
        for (const x of [-1.13,1.13]) m.box("timber",x,z+reach-0.16,0.19,0.19,0.03,2.55);
        m.box("stone",0,z+1.0,2.75,2.2,0,0.16);
      }
    }
  });
  if (p.chimney === "stone") m.scope("stone chimney", () => {
    const x = w*0.24, z = -d*0.23, top = ridge+0.65;
    m.box("stone",x,z,0.72,0.86,roofY(x)-0.65,top);
    m.box("quoin",x,z,0.94,1.06,top-0.06,top+0.16);
    m.box("iron",x,z,0.52,0.64,top+0.165,top+0.18);
  });
  return m;
}
export function villageTimberCottage(params?: ParamValues): MeshBuilder { return cottage(false, params); }
export function villageTimberHouse(params?: ParamValues): MeshBuilder { return cottage(true, params); }
