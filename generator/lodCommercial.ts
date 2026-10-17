// The dedicated low level of detail of the commercial house kit (commercial.ts): see lodBuildings.ts and
// docs/models/lod.md. No windows; masses, roofs and the kit's colours.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { lodPolygon, type LodBand, type LodPart } from "./lodKit.ts";
import { BALCONY_PARAMS, BLOCK_PARAMS, NUM as K_NUM, OFFICE_PARAMS, PL as K_PL, SHOP_PARAMS, ST as K_ST, TERRACE_PARAMS, palette as kenneyPalette } from "./commercial.ts";
import { bounds, faceQuad, lodPost, lodBox, part, fit, lodRect, lodWalls, lodCap, lodBlock, lodParapet } from "./lodBuildings.ts";

// --- the commercial house kit (commercial.ts) ----------------------------------------------------

interface KFootprint { w: number; d: number; x: number; z: number }
/** A face of a footprint: the plane `axis` = `at`, facing `sign`; `len` and `mid` along it. */
interface KFace { axis: "x" | "z"; sign: 1 | -1; at: number; len: number; mid: number }

function kFaces(b: KFootprint): KFace[] {
  return [
    { axis: "z", sign: 1, at: b.z + b.d / 2, len: b.w, mid: b.x }, { axis: "x", sign: 1, at: b.x + b.w / 2, len: b.d, mid: b.z },
    { axis: "z", sign: -1, at: b.z - b.d / 2, len: b.w, mid: b.x }, { axis: "x", sign: -1, at: b.x - b.w / 2, len: b.d, mid: b.z },
  ];
}
const kPoint = (f: KFace, u: number, y: number, off: number): Vec3 => (f.axis === "z" ? [u, y, f.at + f.sign * off] : [f.at + f.sign * off, y, u]);
const kNormal = (f: KFace, up = 0): Vec3 => (f.axis === "z" ? [0, up, f.sign] : [f.sign, up, 0]);

/** A storey stack: walls from y0 to the roof at `top` in the kit's bands, the parapet and the flat roof. */
function kenneyMass(m: MeshBuilder, b: KFootprint, bands: LodBand[], top: number): void {
  lodWalls(m, lodRect(b.x, b.z, b.w, b.d), [...bands, [top, top + 0.7, "trim"]]);
  lodParapet(m, bounds(b.x, b.z, b.w, b.d), top + 0.22, top + 0.7, 0.28, "roof", "trim");
}

/** The floor belt over storey `level` (a proud ring, no top). */
function kenneyBelt(b: KFootprint, level: number, rank: number): LodPart {
  const y = K_PL + level * K_ST;
  return part((m) => lodWalls(m, lodRect(b.x, b.z, b.w + 0.22, b.d + 0.22), [[y + K_ST - 0.2, y + K_ST + 0.02, "trim"]]), rank);
}

/** The shop canopies along the faces' ground floor: a sloping awning with its valance, or a sign fascia. */
function kenneyShops(b: KFootprint, frontage: string, corner: boolean): LodPart {
  return part((m) => {
    for (const f of kFaces(b).slice(0, corner ? 2 : 1)) {
      const u0 = f.mid - (f.len - 0.8) / 2 + 0.1, u1 = f.mid + (f.len - 0.8) / 2 - 0.1;
      if (frontage === "sign") {
        faceQuad(m, "accent", (u, y) => kPoint(f, u, y, 0.27), u0, u1, K_PL + 2.47, K_PL + 2.83, kNormal(f));
        lodPolygon(m, "accent", [kPoint(f, u0, K_PL + 2.83, 0.04), kPoint(f, u1, K_PL + 2.83, 0.04), kPoint(f, u1, K_PL + 2.83, 0.27), kPoint(f, u0, K_PL + 2.83, 0.27)], [0, 1, 0]);
      } else {
        lodPolygon(m, "accent", [kPoint(f, u0, K_PL + 2.82, 0.04), kPoint(f, u1, K_PL + 2.82, 0.04), kPoint(f, u1, K_PL + 2.55, 0.96), kPoint(f, u0, K_PL + 2.55, 0.96)], kNormal(f, 3));
        faceQuad(m, "accent", (u, y) => kPoint(f, u, y, 0.96), u0, u1, K_PL + 2.38, K_PL + 2.55, kNormal(f));
      }
    }
  });
}

/** The roof's use on a flat roof at y: a plant box, or planters and a pergola. */
function kenneyRoofUse(b: KFootprint, y: number, use: string, rank: number): LodPart[] {
  if (use === "plant") return [part((m) => lodBox(m, "metal", b.x + 1.1, b.z - 0.7, 2, 1.45, y + 0.22, y + 0.85), rank)];
  if (use !== "garden") return [];
  return [
    part((m) => { for (const s of [-1, 1]) lodBox(m, "planter", b.x + s * (b.w / 2 - 1.2), b.z + b.d / 2 - 1.2, 1.7, 0.75, y + 0.22, y + 0.9, "foliage"); }, rank),
    part((m) => {
      lodBox(m, "timber", b.x, b.z, 3.55, 2.7, y + 2.48, y + 2.73);
      for (const x of [-1.4, 1.4]) for (const z of [-1.1, 1.1]) lodPost(m, "timber", b.x + x, b.z + z, 0.1, y + 0.22, y + 2.48);
    }, rank - 0.5),
  ];
}

function kenneyUpright(specs: readonly ParamSpec[], given: ParamValues | undefined, kind: "shop" | "balcony" | "block" | "office"): MeshBuilder {
  const p = resolveParams(specs, given);
  const floors = K_NUM[p.storeys!]!;
  const bays = kind === "block" ? K_NUM[p.bays!]! : p.width === "broad" ? 3 : 2;
  const b: KFootprint = { w: bays * 3.25 + 0.8, d: kind === "office" ? 9.6 : 8.4, x: 0, z: 0 };
  const top = K_PL + floors * K_ST;
  const parts: LodPart[] = [
    // the ground floor is dark (trim), the upper storeys the wall colour
    part((m) => kenneyMass(m, b, [[0, K_PL + K_ST, "trim"], [K_PL + K_ST, top, "wall"]], top)),
    kenneyShops(b, kind === "office" || kind === "balcony" ? "awning" : p.frontage!, kind === "shop"),
    ...kenneyRoofUse(b, top, p.roof!, 2),
  ];
  for (let level = 1; level < floors - 1; level++) parts.push(kenneyBelt(b, level, 1 - level / 20));
  if (kind === "balcony") {
    const pitch = (b.w - 0.8) / bays;
    const gallery = p.balconies === "gallery";
    for (let level = 1; level < floors; level++) {
      const y = K_PL + level * K_ST + 0.18, z = b.z + b.d / 2;
      parts.push(part((m) => {
        for (let i = 0; i < (gallery ? 1 : bays); i++) {
          const w = gallery ? b.w - 0.65 : pitch - 0.45;
          const x = gallery ? b.x : b.x + (i - (bays - 1) / 2) * pitch;
          lodCap(m, "stone", lodRect(x, z + 0.68, w + 0.12, 1.36), y);
          faceQuad(m, "metal", (u, yy) => [u, yy, z + 1.36], x - w / 2 - 0.06, x + w / 2 + 0.06, y - 0.17, y + 1.05, [0, 0, 1]);
        }
      }, 5 - level / 10));
    }
  }
  return fit(kenneyPalette(p), parts);
}

export function cornerShopLod(p?: ParamValues): MeshBuilder { return kenneyUpright(SHOP_PARAMS, p, "shop"); }
export function balconyHouseLod(p?: ParamValues): MeshBuilder { return kenneyUpright(BALCONY_PARAMS, p, "balcony"); }
export function marketBlockLod(p?: ParamValues): MeshBuilder { return kenneyUpright(BLOCK_PARAMS, p, "block"); }
export function officeHouseLod(p?: ParamValues): MeshBuilder { return kenneyUpright(OFFICE_PARAMS, p, "office"); }

/** The terraced house: a lower stack whose roof is a terrace, the top two storeys set back. */
export function terraceHouseLod(given?: ParamValues): MeshBuilder {
  const p = resolveParams(TERRACE_PARAMS, given);
  const floors = K_NUM[p.storeys!]!;
  const corner = p.setback === "corner";
  const lower: KFootprint = { w: 12.4, d: 10.2, x: 0, z: 0 };
  const upper: KFootprint = { w: corner ? 8 : lower.w, d: 6.6, x: corner ? -2.2 : 0, z: -1.8 };
  const terraceY = K_PL + (floors - 2) * K_ST + 0.12;
  const top = K_PL + floors * K_ST;
  const parts: LodPart[] = [
    part((m) => {
      lodBlock(m, lodRect(lower.x, lower.z, lower.w, lower.d),
        [[0, K_PL + K_ST, "trim"], [K_PL + K_ST, terraceY - 0.32, "wall"], [terraceY - 0.32, terraceY, "trim"]], "stone");
      kenneyMass(m, upper, [[terraceY, top, "wall"]], top);
    }),
    kenneyShops(lower, p.frontage!, true),
    // the terrace railings: along the front, and around the corner terrace
    part((m) => {
      const y0 = terraceY + 0.02, y1 = terraceY + 1.07;
      lodWalls(m, [[-6, 1.75], [6, 1.75], [6, 4.95], [-6, 4.95]], [[y0, y1, "metal"]], [0]);
      if (corner) lodWalls(m, [[2, -4.85], [6.2, -4.85], [6.2, 1.25], [2, 1.25]], [[y0, y1, "metal"]], [0]);
    }, 4),
    ...kenneyRoofUse(upper, top, p.roof === "garden" ? "garden" : "plant", 2),
  ];
  for (let level = 1; level < floors - 1; level++) if (level !== floors - 3) parts.push(kenneyBelt(level >= floors - 2 ? upper : lower, level, 1 - level / 20));
  if (p.roof === "garden") {
    parts.push(part((m) => { for (const x of [-4.5, 4.5]) lodBox(m, "planter", x, 4.4, 1.7, 0.75, terraceY, terraceY + 0.7, "foliage"); }, 3));
  } else {
    parts.push(part((m) => { for (let i = 0; i < 3; i++) lodBox(m, "solar", -3.6 + i * 3.6, 3.4, 2.7, 1.7, terraceY, terraceY + 0.4); }, 3));
  }
  return fit(kenneyPalette(p), parts);
}
