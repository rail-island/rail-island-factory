// Closed, deliberately coarse solids for model-specific distant silhouettes.
import { rect, ngon, type MeshBuilder, type Ring } from './meshBuilder.ts';
export function lodLoft(m: MeshBuilder, material: string, lower: Ring, y0: number, upper: Ring, y1: number): void {
  m.loft(material, lower, y0, upper, y1);
  m.cap(material, lower, y0, false);
}
export function lodBox(m: MeshBuilder, material: string, x: number, z: number, w: number, d: number, y0: number, y1: number): void {
  const ring = rect(w,d,x,z); lodLoft(m,material,ring,y0,ring,y1);
}
export function lodCylinder(m: MeshBuilder, material: string, x: number, z: number, r: number, y0: number, y1: number, n=6): void {
  const ring = ngon(n,r,0,x,z); lodLoft(m,material,ring,y0,ring,y1);
}
