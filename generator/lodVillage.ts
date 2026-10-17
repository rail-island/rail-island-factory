// The dedicated low level of detail of the village house kit, the timber cottages and the alpine hut (village.ts): see lodBuildings.ts and
// docs/models/lod.md. No windows; masses, roofs and the kit's colours.

import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamValues } from "./design.ts";
import { lodPolygon, type LodPart } from "./lodKit.ts";
import { CLADDING_COLOURS, COTTAGE_PARAMS, FAMILY_HOUSE_PARAMS, House, L_HOUSE_PARAMS, MODERN_HOUSE_PARAMS, NARROW_HOUSE_PARAMS, OH as V_OH, PL as V_PL, RT as V_RT, ROOF_COLOURS, WALL_COLOURS, floorY, knee, palette as villagePalette, volume, type RoofKind, type Volume } from "./village.ts";
import { TIMBER_COTTAGE_PARAMS, roofs as T_ROOFS, timbers as T_TIMBERS, walls as T_WALLS } from "./timberCottages.ts";
import { ACCENTS as A_ACCENTS, ALPINE_HUT_PARAMS, ROOFS as A_ROOFS, TIMBERS as A_TIMBERS, WALLS as A_WALLS } from "./alpineHut.ts";
import { BUDGET, type XY, bounds, faceQuad, lodPost, lodBox, part, fit, lodRect, lodWalls, lodCap, lodParapet, lodGable, lodHip } from "./lodBuildings.ts";

// --- the village house kit (village.ts) -------------------------------------------------------------

/** A village wall face, as House.faces gives it: the plane `axis` = `at`, facing `s`. */
interface VFace { axis: "x" | "z"; s: 1 | -1; at: number }

function vFaces(vol: Volume): { front: VFace; back: VFace; right: VFace; left: VFace } {
  return {
    front: { axis: "z", s: 1, at: vol.cz + vol.d / 2 }, back: { axis: "z", s: -1, at: vol.cz - vol.d / 2 },
    right: { axis: "x", s: 1, at: vol.cx + vol.w / 2 }, left: { axis: "x", s: -1, at: vol.cx - vol.w / 2 },
  };
}
const vPoint = (f: VFace, u: number, y: number, off: number): Vec3 => (f.axis === "x" ? [f.at + f.s * off, y, u] : [u, y, f.at + f.s * off]);
const vNormal = (f: VFace): Vec3 => (f.axis === "x" ? [f.s, 0, 0] : [0, 0, f.s]);

/** A volume of the House kit: its walls on the dark plinth and its roof; `skip` leaves out walls against another block. */
function vVolume(vol: Volume, skip: number[] = []): LodPart {
  return part((m) => {
    const wall = vol.wallMat ?? "wall";
    lodWalls(m, lodRect(vol.cx, vol.cz, vol.w, vol.d), [[0, V_PL, "trim"], [V_PL, vol.eave, wall]], skip);
    vRoof(m, vol);
  });
}

function vRoof(m: MeshBuilder, vol: Volume): void {
  const t = V_RT * Math.hypot(1, vol.pitch);
  if (vol.roof === "gable") {
    lodGable(m, { cx: vol.cx, cz: vol.cz, w: vol.w, d: vol.d, axis: vol.axis, eave: vol.eave, pitch: vol.pitch, oh: V_OH, t, roof: "roof", gable: vol.wallMat ?? "wall", gables: vol.gables });
  } else if (vol.roof === "hip") {
    lodHip(m, { cx: vol.cx, cz: vol.cz, w: vol.w, d: vol.d, eave: vol.eave, pitch: vol.pitch, oh: V_OH, t, roof: "roof" });
  } else if (vol.roof === "flat") {
    const r = lodRect(vol.cx, vol.cz, vol.w + 0.4, vol.d + 0.4);
    lodWalls(m, r, [[vol.eave, vol.eave + 0.6, "trim"]]);
    lodCap(m, "trim", r, vol.eave, false);
    lodParapet(m, bounds(vol.cx, vol.cz, vol.w + 0.4, vol.d + 0.4), vol.eave + 0.3, vol.eave + 0.6, 0.3, "trim", "trim");
  }
}

/** The floor bands of a volume, proud rings. */
function vBands(vol: Volume, rank: number): LodPart | null {
  if (!vol.bands.length) return null;
  return part((m) => { for (const y of vol.bands) lodWalls(m, lodRect(vol.cx, vol.cz, vol.w + 0.16, vol.d + 0.16), [[y, y + 0.22, "trim"]]); }, rank);
}

const roofTopOf = (vol: Volume, x: number, z: number): number => new House({}).roofTop(vol, x, z);

/** A brick chimney through a pitched roof at (x, z), as House.chimney. */
function vChimney(vol: Volume, x: number, z: number, rank?: number): LodPart {
  const corners = [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([dx, dz]) => roofTopOf(vol, x + dx!, z + dz!));
  const top = Math.max(...corners) + 0.9;
  return part((m) => lodBox(m, "stone", x, z, 0.8, 0.8, Math.min(...corners) - 0.1, top + 0.18, "trim"), rank);
}

/** A dormer on the front slope of a roof whose ridge runs along x, as House.dormer. */
function vDormer(vol: Volume, x: number, w = 1.4): (m: MeshBuilder) => void {
  const zf = vol.cz + (vol.d / 2) * 0.72;
  const yR = roofTopOf(vol, x, zf);
  const dorm: Volume = { cx: x, cz: zf - 1.0, w, d: 2.0, eave: yR + 1.25, roof: "gable", axis: "z", pitch: 0.5, bands: [], gables: [false, true], gutters: false };
  return (m) => {
    lodWalls(m, lodRect(dorm.cx, dorm.cz, dorm.w, dorm.d), [[yR - 0.6, dorm.eave, "wall"]], [0]);
    vRoof(m, dorm);
  };
}

/** A shed canopy over a door, and for a porch its deck and two posts, as House.canopy. */
function vCanopy(f: VFace, u: number, width: number, depth: number, y: number, posts: boolean, rank?: number): LodPart[] {
  const drop = 0.25 * depth, th = 0.16, u0 = u - width / 2, u1 = u + width / 2;
  const out: LodPart[] = [part((m) => {
    const up: Vec3 = f.axis === "x" ? [f.s * drop, depth, 0] : [0, depth, f.s * drop];
    lodPolygon(m, "roof", [vPoint(f, u0, y + th, -0.1), vPoint(f, u1, y + th, -0.1), vPoint(f, u1, y + th - drop, depth), vPoint(f, u0, y + th - drop, depth)], up);
    faceQuad(m, "roof", (uu, yy) => vPoint(f, uu, yy, depth), u0, u1, y - drop, y + th - drop, vNormal(f));
  }, rank)];
  if (posts) {
    out.push(part((m) => {
      for (const pu of [u0 + 0.2, u1 - 0.2]) {
        const c = vPoint(f, pu, 0, depth - 0.2);
        lodPost(m, "metal", c[0], c[2], 0.1, 0.34, y - drop + 0.1);
      }
      const a = vPoint(f, u0 + 0.05, 0, 0), b = vPoint(f, u1 - 0.05, 0, depth);
      lodBox(m, "trim", (a[0] + b[0]) / 2, (a[2] + b[2]) / 2, Math.abs(b[0] - a[0]), Math.abs(b[2] - a[2]), 0, 0.34);
    }, (rank ?? 6) - 0.5));
  }
  return out;
}

/** A planter box in front of a face with its bushes as one green top, as House.planter. */
function vPlanter(f: VFace, u: number, len: number, rank: number): LodPart {
  const a = vPoint(f, u - len / 2, 0, 0.3), b = vPoint(f, u + len / 2, 0, 1.0);
  return part((m) => lodBox(m, "planter", (a[0] + b[0]) / 2, (a[2] + b[2]) / 2, Math.abs(b[0] - a[0]), Math.abs(b[2] - a[2]), 0, 0.85, "bush"), rank);
}

/** A front door, its leaf a flat panel on the wall. */
function vDoor(f: VFace, u: number, mat = "door", rank = 0.5): LodPart {
  return part((m) => faceQuad(m, mat, (uu, y) => vPoint(f, uu, y, 0.1), u - 0.55, u + 0.55, V_PL, V_PL + 2.2, vNormal(f)), rank);
}

/** Solar panels lying on the slope of a pitched roof over x0..x1, z0..z1, as House.solar. */
function vSolar(vol: Volume, x0: number, x1: number, z0: number, z1: number): LodPart {
  return part((m) => {
    const pt = (x: number, z: number): Vec3 => [x, roofTopOf(vol, x, z) + 0.14, z];
    const pts = [pt(x0, z0), pt(x1, z0), pt(x1, z1), pt(x0, z1)];
    lodPolygon(m, "solar", pts, [0, 1, 0]);
  }, 5);
}

function villageFit(pal: Record<string, MaterialSpec>, parts: Array<LodPart | null>, mx: 1 | -1 = 1): MeshBuilder {
  return fit(pal, parts.filter((p): p is LodPart => p !== null), BUDGET, mx);
}

export function villageCottageLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(COTTAGE_PARAMS, params);
  const storeys = p.storeys === "two" ? 2 : 1;
  const main = volume(0, 0, 9, 7, storeys, p.roofShape === "hip" ? "hip" : "gable", "x");
  main.eave += knee(storeys);
  const f = vFaces(main);
  const parts: Array<LodPart | null> = [vVolume(main), vBands(main, 1), vDoor(f.front, -1.2)];
  if (p.entrance === "canopy") parts.push(...vCanopy(f.front, -1.2, 2.0, 1.1, V_PL + 2.65, false));
  if (p.entrance === "porch") parts.push(...vCanopy(f.front, -1.2, 2.6, 2.0, V_PL + 2.75, true));
  if (p.entrance === "garden") parts.push(vPlanter(f.front, 2.3, 2.6, 2), vPlanter(f.right, -1.2, 2.2, 1.5));
  if (p.dormers === "dormers") {
    parts.push(main.roof === "gable" ? part((m) => { vDormer(main, -2.2)(m); vDormer(main, 2.3)(m); }) : part(vDormer(main, 0, 1.3)));
  }
  if (p.chimney === "brick") parts.push(vChimney(main, -2.6, -1.0));
  return villageFit(villagePalette(ROOF_COLOURS[p.roof!]!, WALL_COLOURS[p.walls!]!), parts);
}

export function villageLHouseLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(L_HOUSE_PARAMS, params);
  const storeys = p.storeys === "two" ? 2 : 1;
  const shape: RoofKind = p.roofShape === "hip" ? "hip" : "gable";
  const main = volume(0, -1.5, 10, 7, storeys, shape, "x");
  main.eave += knee(storeys);
  const wing: Volume = { ...volume(1.9, 1.5, 4.6, 6, storeys, shape, "z"), gables: [false, true] };
  wing.eave += knee(storeys);
  const fm = vFaces(main), fw = vFaces(wing);
  const parts: Array<LodPart | null> = [
    vVolume(main), vVolume(wing, [0]), vBands(main, 1), vBands(wing, 0.9), vDoor(fm.front, -1.6),
    ...vCanopy(fm.front, -1.6, 2.0, 1.0, V_PL + 2.65, false, 3), vChimney(main, -2.2, -3.0, 4),
  ];
  if (p.extras === "planters") parts.push(vPlanter(fm.front, -3.6, 1.8, 2), vPlanter(fw.left, 3.65, 1.5, 1.5));
  if (p.extras === "solar") parts.push(shape === "gable" ? vSolar(main, -4.4, -0.9, -1.0, 1.4) : vSolar(main, -2.2, -0.9, -0.5, 1.4));
  return villageFit(villagePalette(ROOF_COLOURS[p.roof!]!, WALL_COLOURS[p.walls!]!), parts, p.side === "left" ? -1 : 1);
}

export function villageFamilyHouseLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(FAMILY_HOUSE_PARAMS, params);
  const shape: RoofKind = p.roofShape === "hip" ? "hip" : "gable";
  const main = volume(-1.5, 0, 8, 8, 2, shape, "x", 0.85);
  const annexRoof: RoofKind = p.annex === "terrace" ? "flat" : p.annex === "garage" ? "gable" : shape;
  const annex: Volume = { ...volume(4.75, -0.5, 4.5, 6.5, 1, annexRoof, "z", 0.6), eave: p.annex === "garage" ? V_PL + 2.6 : floorY(1) - 0.11, open: ["left"] };
  const fm = vFaces(main), fa = vFaces(annex);
  const parts: Array<LodPart | null> = [
    vVolume(main), vVolume(annex, [3]), vBands(main, 1), vDoor(fm.front, -2.6),
    ...vCanopy(fm.front, -2.6, 2.4, 1.6, V_PL + 2.7, true, 4),
  ];
  if (p.annex === "garage") {
    parts.push(part((m) => faceQuad(m, "garageDoor", (u, y) => vPoint(fa.front, u, y, 0.36), annex.cx - 1.3, annex.cx + 1.3, 0.04, 2.3, vNormal(fa.front)), 6));
  } else {
    parts.push(vPlanter(fa.front, annex.cx, 2.6, 2));
  }
  if (p.annex === "terrace") {
    parts.push(part((m) => {
      const y = annex.eave + 0.6;
      lodWalls(m, lodRect(annex.cx + 0.05, annex.cz, annex.w + 0.1, annex.d + 0.1), [[y, y + 0.9, "metal"]], [3]);
    }, 3));
  }
  if (p.chimney === "brick") parts.push(vChimney(main, -3.2, -1.4));
  return villageFit(villagePalette(ROOF_COLOURS[p.roof!]!, WALL_COLOURS[p.walls!]!), parts, p.side === "left" ? -1 : 1);
}

export function villageModernHouseLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(MODERN_HOUSE_PARAMS, params);
  const two = p.storeys === "two";
  // under an upper storey the ground floor's walls stop at its floor band
  const ground: Volume = { ...volume(0, -0.8, 10, 7.4, 1, two ? "none" : "flat", "x"), bands: [], ...(two ? { eave: floorY(1) - 0.11 } : {}) };
  const upper: Volume = { ...volume(0.25, 0, 10.5, 9, 1, "flat", "x"), eave: floorY(2), bands: [], wallMat: "cladding" };
  const fg = vFaces(ground);
  const roofY = (two ? upper.eave : ground.eave) + 0.3;
  const parts: Array<LodPart | null> = [vVolume(ground)];
  if (two) {
    parts.push(part((m) => {
      const r = lodRect(upper.cx, upper.cz, upper.w, upper.d);
      lodWalls(m, r, [[floorY(1) - 0.11, floorY(1) + 0.15, "trim"], [floorY(1) + 0.15, upper.eave, "cladding"]]);
      lodCap(m, "trim", r, floorY(1) - 0.11, false);
      vRoof(m, upper);
    }));
    parts.push(part((m) => { for (const x of [-4.5, 5.0]) lodPost(m, "metal", x, 3.9, 0.16, V_PL - 0.1, floorY(1) - 0.11); }, 4));
  } else {
    // the clad entrance block standing out of the front
    parts.push(part((m) => lodWalls(m, lodRect(-2.8, fg.front.at + 0.42, 2.4, 1.24), [[0, ground.eave + 0.75, "cladding"]], [0]) ));
    parts.push(part((m) => lodCap(m, "cladding", lodRect(-2.8, fg.front.at + 0.42, 2.4, 1.24), ground.eave + 0.75)));
  }
  parts.push(part((m) => lodBox(m, "stone", 4.2, 2.0, 0.7, 0.7, roofY - 0.1, roofY + 0.55, "trim"), 1));
  if (p.annex === "carport") {
    parts.push(part((m) => {
      const y = V_PL + 2.55;
      // (from the ground floor's side wall out)
      lodBox(m, "trim", 7.4, -0.3, 4.8, 6.4, y, y + 0.25);
      lodCap(m, "trim", lodRect(7.4, -0.3, 4.8, 6.4), y, false);
    }));
    parts.push(part((m) => { for (const [x, z] of [[9.5, 2.6], [9.5, -3.2]] as const) lodPost(m, "metal", x, z, 0.14, 0, V_PL + 2.55); }, 4));
  }
  if (p.annex === "wing") parts.push(vVolume({ ...volume(-7.4, -1.6, 4.8, 5.8, 1, "flat", "x"), eave: V_PL + 2.8, bands: [] }, [1]));
  if (p.solar === "panels") {
    parts.push(part((m) => {
      for (const z of [-2.6, 0.6]) for (const x of [-2.7, 1.5]) {
        lodPolygon(m, "solar", [[x - 1.9, roofY + 0.95, z - 1.0], [x + 1.9, roofY + 0.95, z - 1.0], [x + 1.9, roofY + 0.25, z + 0.6], [x - 1.9, roofY + 0.25, z + 0.6]], [0, 1.6, 0.7]);
      }
    }, 5));
  }
  return villageFit(villagePalette(ROOF_COLOURS.slate!, WALL_COLOURS[p.walls!]!, CLADDING_COLOURS[p.cladding!]!), parts);
}

export function villageNarrowHouseLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(NARROW_HOUSE_PARAMS, params);
  const storeys = p.storeys === "three" ? 3 : 2;
  const main = volume(0, 0, 6.2, 8.5, storeys, "gable", "z", 1.05);
  const f = vFaces(main);
  const top = storeys - 1;
  const balcony = p.balcony === "balcony";
  const parts: Array<LodPart | null> = [vVolume(main), vBands(main, 1), vDoor(f.front, -1.4), vChimney(main, 1.2, -2.2, 4)];
  if (p.entrance === "canopy") parts.push(...vCanopy(f.front, -1.4, 1.9, 1.0, V_PL + 2.6, false));
  if (p.entrance === "porch") parts.push(...vCanopy(f.front, -0.4, 5.0, 2.0, V_PL + 2.7, true));
  if (p.entrance !== "porch") parts.push(vPlanter(f.front, 1.5, 2.0, 2));
  if (balcony) {
    parts.push(part((m) => {
      const y = floorY(top) - 0.11, z0 = f.front.at;
      lodBox(m, "trim", 0, z0 + 0.7, 5.2, 1.4, y - 0.2, y + 0.11);
      lodWalls(m, [[-2.55, z0 + 0.1], [2.55, z0 + 0.1], [2.55, z0 + 1.35], [-2.55, z0 + 1.35]], [[y + 0.11, y + 1.11, "metal"]], [0]);
    }));
  }
  if (p.shutters === "shutters") {
    // the shutters beside the front windows, in the roof's colour
    parts.push(part((m) => {
      for (let s = 0; s < storeys; s++) {
        const us = s === 0 ? [1.4] : s === top && balcony ? [1.4] : [-1.4, 1.4];
        const y0 = floorY(s) + 0.85;
        for (const u of us) for (const side of [-1, 1]) {
          const su = u + side * (0.65 + 0.15 + 0.273);
          faceQuad(m, "shutter", (uu, y) => vPoint(f.front, uu, y, 0.06), su - 0.273, su + 0.273, y0 - 0.1, y0 + 1.55, vNormal(f.front));
        }
      }
    }, 3));
  }
  return villageFit(villagePalette(ROOF_COLOURS[p.roof!]!, WALL_COLOURS[p.walls!]!), parts);
}

// --- the timber cottages (timberCottages.ts) -----------------------------------------------------

function timberLod(tall: boolean, values?: ParamValues): MeshBuilder {
  const p = resolveParams(TIMBER_COTTAGE_PARAMS, values);
  const pal: Record<string, MaterialSpec> = {
    tile: { color: T_ROOFS[p.roof!]! }, plaster: { color: T_WALLS[p.walls!]! }, timber: { color: T_TIMBERS[p.timber!]! },
    stone: { color: "#989a91" }, quoin: { color: "#b9bbae" }, door: { color: "#ad8b55" },
  };
  const w = tall ? 7.8 : 7, d = tall ? 8.6 : 6.6;
  const eave = tall ? 6.2 : 3.5, pitch = p.pitch === "steep" ? 1.12 : 0.85;
  const ridge = eave + (w / 2) * pitch;
  const roofY = (x: number) => ridge - Math.abs(x) * pitch;
  const base = tall ? 2.95 : 0.55, bottom = tall ? 3.02 : 0.6;
  const parts: LodPart[] = [
    // stone base, the sill beam and the wall plate of the frame, plaster between
    part((m) => {
      lodWalls(m, lodRect(0, 0, w, d), [[0, base, "stone"], [base, bottom + 0.22, "timber"], [bottom + 0.22, eave - 0.25, "plaster"], [eave - 0.25, eave, "timber"]]);
      lodGable(m, { cx: 0, cz: 0, w, d, axis: "z", eave, pitch, oh: 0.6, ends: [0.48, 0.48], t: 0.42, top: eave + 0.23, roof: "tile", edge: "timber", gable: "plaster" });
    }),
    // the ridge beam
    part((m) => lodBox(m, "timber", 0, 0, 0.34, d + 1.55, ridge + 0.1, ridge + 0.52), 3),
    // the framing posts on the four faces, and the braces of a braced frame
    part((m) => {
      for (const s of [-1, 1]) {
        for (const x of [-w / 2 + 0.12, 0, w / 2 - 0.12]) faceQuad(m, "timber", (u, y) => [u, y, s * (d / 2 + 0.2)], x - 0.11, x + 0.11, bottom + 0.22, eave - 0.25, [0, 0, s]);
        for (const z of [-d / 2 + 0.12, 0, d / 2 - 0.12]) faceQuad(m, "timber", (u, y) => [s * (w / 2 + 0.19), y, u], z - 0.11, z + 0.11, bottom + 0.22, eave - 0.25, [s, 0, 0]);
      }
    }, 1),
    part((m) => {
      for (const s of [-1, 1]) {
        const z = s * (d / 2 + 0.24);
        // the king post up the gable
        faceQuad(m, "timber", (u, y) => [u, y, z], -0.11, 0.11, eave + 0.03, ridge - 0.22, [0, 0, s]);
        if (p.framing === "braced") for (const x of [-1, 1]) {
          const a: XY = [x * (w / 2 - 0.35), bottom + 0.35], b: XY = [x * (w / 2 - 1.2), bottom + 1.05];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (-(b[1] - a[1]) / len) * 0.09, ny = ((b[0] - a[0]) / len) * 0.09;
          lodPolygon(m, "timber", [[a[0] + nx, a[1] + ny, z], [b[0] + nx, b[1] + ny, z], [b[0] - nx, b[1] - ny, z], [a[0] - nx, a[1] - ny, z]], [0, 0, s]);
        }
      }
    }, 2),
    part((m) => faceQuad(m, "door", (u, y) => [u, y, d / 2 + 0.3], -0.81, 0.81, 0.36, 2.66, [0, 0, 1]), 4),
  ];
  if (p.entrance !== "step") {
    const reach = p.entrance === "porch" ? 1.9 : 1.05, z = d / 2;
    parts.push(part((m) => {
      lodPolygon(m, "tile", [[-1.3, 2.95, z], [1.3, 2.95, z], [1.3, 2.63, z + reach], [-1.3, 2.63, z + reach]], [0, reach, 0.32]);
      faceQuad(m, "tile", (u, y) => [u, y, z + reach], -1.3, 1.3, 2.47, 2.63, [0, 0, 1]);
    }, 5));
    if (p.entrance === "porch") {
      parts.push(part((m) => {
        for (const x of [-1.13, 1.13]) lodPost(m, "timber", x, z + reach - 0.16, 0.12, 0.16, 2.47);
        lodBox(m, "stone", 0, z + 1.0, 2.75, 2.2, 0, 0.16);
      }, 4.5));
    }
  } else {
    parts.push(part((m) => lodBox(m, "stone", 0, d / 2 + 0.55, 2.1, 1.0, 0, 0.28), 0.5));
  }
  if (p.chimney === "stone") {
    const x = w * 0.24, z = -d * 0.23, top = ridge + 0.65;
    parts.push(part((m) => lodBox(m, "stone", x, z, 0.72, 0.86, roofY(x) - 0.2, top + 0.16, "quoin")));
  }
  return fit(pal, parts);
}

export function villageTimberCottageLod(params?: ParamValues): MeshBuilder { return timberLod(false, params); }
export function villageTimberHouseLod(params?: ParamValues): MeshBuilder { return timberLod(true, params); }

// --- the alpine hut (alpineHut.ts) ------------------------------------------------------------

export function villageAlpineHutLod(values?: ParamValues): MeshBuilder {
  const p = resolveParams(ALPINE_HUT_PARAMS, values);
  const [timber, boards] = A_TIMBERS[p.timber!]!;
  const pal: Record<string, MaterialSpec> = {
    plaster: { color: A_WALLS[p.walls!]! }, timber: { color: timber }, boards: { color: boards }, trim: { color: "#b98450" },
    roof: { color: A_ROOFS[p.roof!]! }, snow: { color: "#f4f8fb", roughness: 0.9 }, stone: { color: "#56616c" },
    block: { color: "#9ba4ac" }, accent: { color: A_ACCENTS[p.accent!]! }, log: { color: "#a77a4c" },
  };
  const winter = p.season === "winter";
  const two = p.storeys === "two";
  const balcony = two ? p.balcony : "none";
  const W = 5.6, D = 4.8, P = 0.55, H = 2.55, F = P + H;
  const E = two ? P + 2 * H : P + H + 0.55, k = 0.62;
  const hx = W / 2 + (balcony === "wrap" ? 1.3 : 0.55);
  const zf = D / 2 + (balcony !== "none" ? 1.35 : p.entrance === "porch" ? 1.1 : 0.65);
  const zb = -D / 2 - 0.6;
  const R = E + 0.2 + (W / 2) * k;
  const roofTop = (x: number) => R - Math.abs(x) * k;
  const front = (u: number, y: number, off: number): Vec3 => [u, y, D / 2 + off];
  const parts: LodPart[] = [
    part((m) => {
      lodWalls(m, lodRect(0, 0, W, D), [[0, P, "stone"], [P, E - 0.24, "plaster"], [E - 0.24, E, "timber"]]);
      lodGable(m, { cx: 0, cz: 0, w: W, d: D, axis: "z", eave: E, pitch: k, oh: hx - W / 2, ends: [-zb - D / 2, zf - D / 2], t: 0.2, roof: winter ? "snow" : "roof", edge: "roof", rake: "trim", gable: "boards" });
    }),
    // the plank door and the ground floor's shutters, in the accent colour
    part((m) => {
      faceQuad(m, "accent", (u, y) => front(u, y, 0.04), -0.5, 0.5, P, P + 2.05, [0, 0, 1]);
      for (const s of [-1, 1]) for (const e of [-1, 1]) {
        const c = s * 1.7 + e * (0.36 + 0.09 + 0.18 + 0.02);
        faceQuad(m, "accent", (u, y) => front(u, y, 0.05), c - 0.2, c + 0.2, P + 0.83, P + 2.04, [0, 0, 1]);
      }
    }),
    part((m) => {
      for (const s of [-1, 1]) for (const e of [-1, 1]) {
        const c = s * 0.9 + e * 0.65;
        faceQuad(m, "accent", (u, y) => [s * (W / 2 + 0.05), y, u], c - 0.2, c + 0.2, P + 0.83, P + 2.04, [s, 0, 0]);
      }
    }, 2),
    // the half-timber frame: the corner posts, the sill and floor beams
    part((m) => {
      for (const s of [-1, 1]) for (const e of [-1, 1]) {
        faceQuad(m, "timber", (u, y) => [u, y, s * (D / 2 + 0.07)], e * (W / 2 - 0.06) - 0.12, e * (W / 2 - 0.06) + 0.12, P + 0.18, E - 0.24, [0, 0, s]);
        faceQuad(m, "timber", (u, y) => [s * (W / 2 + 0.07), y, u], e * (D / 2 - 0.06) - 0.12, e * (D / 2 - 0.06) + 0.12, P + 0.18, E - 0.24, [s, 0, 0]);
      }
    }, 1),
    part((m) => lodWalls(m, lodRect(0, 0, W + 0.12, D + 0.12), [[P - 0.03, P + 0.18, "timber"]]), 0.5),
  ];
  if (two) parts.push(part((m) => lodWalls(m, lodRect(0, 0, W + 0.12, D + 0.12), [[F - 0.1, F + 0.1, "timber"]]), 0.6));
  if (p.chimney === "stone") {
    parts.push(part((m) => lodBox(m, "stone", 1.25, -0.9, 0.62, 0.62, roofTop(1.25 + 0.31) - 0.5, R + 0.75 + 0.3, winter ? "snow" : "block")));
  }
  if (balcony !== "none") {
    const out = 1.15, deckY = F + 0.12, zEdge = D / 2 + out, wrap = balcony === "wrap";
    const x0 = wrap ? W / 2 + out : W / 2 - 0.35, zBack = -D / 2 + 0.7;
    parts.push(part((m) => {
      lodBox(m, "trim", 0, D / 2 + out / 2, 2 * x0, out, F - 0.05, deckY);
      lodCap(m, "trim", lodRect(0, D / 2 + out / 2, 2 * x0, out), F - 0.05, false);
      if (wrap) for (const s of [-1, 1]) {
        const r = lodRect(s * (W / 2 + out / 2), (zBack + D / 2) / 2, out, D / 2 - zBack);
        lodWalls(m, r, [[F - 0.05, deckY, "trim"]], [s > 0 ? 3 : 1, 2]);
        lodCap(m, "trim", r, deckY);
      }
      // the boarded railing
      const y0 = deckY, y1 = deckY + 1.02;
      if (wrap) lodWalls(m, [[-x0, zBack], [x0, zBack], [x0, zEdge], [-x0, zEdge]], [[y0, y1, "trim"]], [0]);
      else lodWalls(m, [[-x0, D / 2], [x0, D / 2], [x0, zEdge], [-x0, zEdge]], [[y0, y1, "trim"]], [0]);
    }));
  }
  if (p.entrance === "porch") {
    const depth = balcony !== "none" ? 1.2 : 1.0, z1 = D / 2 + depth;
    parts.push(part((m) => lodBox(m, "stone", 0, D / 2 + depth / 2, 2.5, depth, 0, P - 0.02), 3));
    const postTop = balcony !== "none" ? F - 0.05 : P + 2.6;
    parts.push(part((m) => { for (const s of [-1, 1]) lodPost(m, "timber", s * 1.08, z1 - 0.12, 0.11, P - 0.02, postTop); }, 2.5));
    if (balcony === "none") {
      parts.push(part((m) => {
        const y = P + 2.6, rise = 0.55, hw = 1.45;
        lodGable(m, { cx: 0, cz: (D / 2 - 0.07 + z1 + 0.12) / 2, w: 2 * hw - 0.5, d: z1 + 0.19 - D / 2, axis: "z", eave: y + 0.02, top: y + 0.04 + 0.25 * (rise / hw), pitch: rise / hw, oh: 0.25, ends: [0, 0.08], roof: winter ? "snow" : "roof", gable: "boards", gables: [false, true] });
      }, 4));
    }
  } else {
    parts.push(part((m) => lodBox(m, "stone", 0, D / 2 + 0.45, 1.6, 0.9, 0, P), 1.5));
  }
  parts.push(part((m) => lodBox(m, "log", -W / 2 - 0.36, 0.45 + 6.1 * 0.11, 0.52, 13 * 0.11, 0, 0.8, winter ? "snow" : "log"), 0.2));
  return fit(pal, parts);
}
