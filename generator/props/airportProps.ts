// An airport's fixed props (docs/models/props.md): the control tower and the
// windsock's fabric. Both are drawn at full size; the game places them at the
// airport's furniture scale (0.45..1, from the terminal pad), so a small field's
// tower is a smaller copy of a large one's. The radar on top of the tower and the
// windsock's pole are the game's: the radar turns, and the pole's height follows
// the terminal's roof.

import { resolveParams, type ParamSpec, type ProceduralDesign } from "../design.ts";
import { MeshBuilder } from "../meshBuilder.ts";
import type { Vec3 } from "../meshCore.ts";
import { propModel, propMaterial, type PropBox, type Rgb } from "./propKit.ts";

const C = {
  concrete: [177, 181, 177], steel: [83, 100, 110], roof: [57, 87, 104], glass: [132, 191, 211],
  white: [236, 231, 214], blue: [57, 111, 142],
} satisfies Record<string, Rgb>;

/** The tower's shaft height at full scale: a regional field's, and an international hub's. */
export const TOWER_HEIGHTS = { regional: 28, international: 48 } as const;

/** The control tower at full scale, standing at its origin: a stepped shaft, the cab with its gallery, and the radar mast. */
export function towerBoxes(th: number): PropBox[] {
  const out: PropBox[] = [];
  const add = (x: number, y: number, z: number, w: number, h: number, d: number, color: Rgb, material: string, shell = false): void => {
    out.push({ cx: x, cy: y, cz: z, sx: w, sy: h, sz: d, color, material, ...(shell ? { lod: "shell" as const } : {}) });
  };
  // bury joints into their supporting surface to avoid coincident faces
  const stand = (x: number, base: number, z: number, w: number, h: number, d: number, color: Rgb, material: string, shell = false): void =>
    add(x, base + h / 2 - 0.2, z, w, h + 0.4, d, color, material, shell);
  // the shaft stands on the pad (the one box not buried: the prop's base is its origin)
  add(0, th / 2, 0, 7, th, 7, C.concrete, "column", true);
  add(-3.6, th * 0.59, 0, 0.3, th * 0.67, 2.2, C.blue, "roof");
  stand(0, th - 1.4, 0, 13, 1.6, 13, C.steel, "steel", true);
  stand(0, th + 0.2, 0, 10, 5.8, 10, C.glass, "roof", true);
  stand(0, th + 6, 0, 12, 1.1, 12, C.roof, "roof", true);
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) stand(dx * 4.85, th, dz * 4.85, 0.5, 6.2, 0.5, C.white, "steel");
  for (const side of [-1, 1]) {
    add(side * 6.1, th + 1.9, 0, 0.3, 0.3, 11.8, C.white, "steel");
    add(0, th + 1.9, side * 6.1, 11.8, 0.3, 0.3, C.white, "steel");
    for (const t of [-1, 0, 1]) stand(side * 6.1, th + 0.15, t * 5.5, 0.25, 1.85, 0.25, C.white, "steel");
  }
  stand(0, th + 7.1, 0, 1.6, 3.2, 1.6, C.steel, "steel", true);
  stand(4, th + 7.1, 3, 0.3, 6, 0.3, C.white, "steel");
  return out;
}

const TOWER_PARAMS: ParamSpec[] = [{ name: "kind", title: "Airport", default: "regional", values: [{ value: "regional", title: "Regional" }, { value: "international", title: "International" }] }];
const heightOf = (values?: Record<string, string>): number => TOWER_HEIGHTS[resolveParams(TOWER_PARAMS, values).kind as keyof typeof TOWER_HEIGHTS];
export function airportTower(values?: Record<string, string>): MeshBuilder {
  return propModel(towerBoxes(heightOf(values)));
}
export function airportTowerLod(values?: Record<string, string>): MeshBuilder {
  return propModel(towerBoxes(heightOf(values)), true);
}

// --- the windsock ---
const SOCK_COLORS: readonly Rgb[] = [[236, 119, 44], [236, 231, 214]];
const SOCK_SEGMENTS = 5;
const SOCK_SIDES = 8;

/**
 * The windsock's fabric at full scale: five open cones in alternating orange and
 * white, tapering out along +X from the mast head at the origin. The game hangs it
 * on its own pivot and swings it in the wind.
 */
function drawSock(m: MeshBuilder, sides: number): void {
  for (let i = 0; i < SOCK_SEGMENTS; i++) {
    const r0 = 1.15 - i * 0.15;
    const r1 = r0 - 0.15;
    const x0 = i * 1.5, x1 = (i + 1) * 1.5;
    const mat = propMaterial("fabric", SOCK_COLORS[i % 2]!);
    const ring = (x: number, r: number, k: number): Vec3 => {
      const a = (k / sides) * Math.PI * 2;
      return [x, -r * Math.sin(a), r * Math.cos(a)];
    };
    m.scope(`segment-${i}`, () => {
      for (let k = 0; k < sides; k++) m.quad(mat, ring(x0, r0, k), ring(x0, r0, k + 1), ring(x1, r1, k + 1), ring(x1, r1, k));
    });
  }
}
const sockPalette = (): Record<string, { color: string; roughness: number; doubleSided: boolean }> =>
  Object.fromEntries(SOCK_COLORS.map((c) => [propMaterial("fabric", c), { color: `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`, roughness: 1, doubleSided: true }]));
export function airportWindsock(): MeshBuilder {
  const m = new MeshBuilder(sockPalette());
  drawSock(m, SOCK_SIDES);
  return m;
}
export function airportWindsockLod(): MeshBuilder {
  const m = new MeshBuilder(sockPalette());
  drawSock(m, 4);
  return m;
}

const PROP_CATALOG = { category: "Props", group: "props", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

export const AIRPORT_PROPS: ProceduralDesign[] = [
  {
    id: "proc-prop-airport-tower", title: "Control Tower", build: airportTower, buildLod: airportTowerLod, params: TOWER_PARAMS,
  },
  { id: "proc-prop-airport-windsock", title: "Windsock", build: airportWindsock, buildLod: airportWindsockLod },
].map((d) => ({ ...d, catalog: { ...PROP_CATALOG } }));
