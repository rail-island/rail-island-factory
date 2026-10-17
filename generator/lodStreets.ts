// The dedicated low level of detail of the commercial street kit (commercialStreets.ts): see lodBuildings.ts and
// docs/models/lod.md. No windows; masses, roofs and the kit's colours.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamValues } from "./design.ts";
import { lodPolygon, type LodPart } from "./lodKit.ts";
import { historic, specs as streetSpecs, streetPalette, type Style } from "./commercialStreets.ts";
import { type XY, bounds, faceQuad, lodBox, part, fit, lodRect, lodWalls, lodCap, lodParapet, lodFrustum, lodPlate, lodHull } from "./lodBuildings.ts";

// --- the commercial street kit (commercialStreets.ts) ---------------------------------------------

function streetLod(s: Style, given?: ParamValues): MeshBuilder {
  const p = resolveParams(streetSpecs(s), given);
  const n = Number(p.storeys), bays = p.width === "narrow" ? 2 : p.width === "wide" ? 5 : p.width === "extraWide" ? 8 : 3;
  const w = bays * 2.7, d = historic(s) ? 9 : 8, floor = 3.2, h = n * floor + 0.45;
  const roof = p.roof === "pitched" ? "terrace" : s;
  const flat = !["terrace", "gable", "classical", "barrel"].includes(roof);
  const parts: LodPart[] = [];
  // the walls on a stone plinth; a flat roof's parapet stands out over the cornice
  parts.push(part((m) => {
    lodWalls(m, lodRect(0, 0, w, d), [[0, 0.45, "stone"], [0.45, h, "wall"]]);
    if (flat) {
      lodWalls(m, lodRect(0, 0, w + 0.5, d + 0.5), [[h, h + 0.7, "trim"]]);
      lodCap(m, "trim", lodRect(0, 0, w + 0.5, d + 0.5), h, false);
      lodParapet(m, bounds(0, 0, w + 0.5, d + 0.5), h + 0.33, h + 0.7, 0.3, "roof", "trim");
    } else {
      lodWalls(m, lodRect(0, 0, w + 0.5, d + 0.5), [[h, h + 0.26, "trim"]]);
      lodCap(m, "trim", lodRect(0, 0, w + 0.5, d + 0.5), h, false);
    }
  }));
  for (let f = 1; f < n; f++) {
    const y = 0.45 + f * floor;
    parts.push(part((m) => lodWalls(m, lodRect(0, 0, w + 0.22, d + 0.22), [[y - 0.19, y, "trim"]]), 1 - f / 20));
  }
  // the roof
  if (roof === "terrace" || roof === "gable" || roof === "classical") {
    const rise = roof === "classical" ? 2.1 : 3.2;
    const rw = roof === "classical" ? w * 0.65 : w + 0.65;
    parts.push(part((m) => lodFrustum(m, "roof", bounds(0, 0, w + 0.65, d + 0.65), h + 0.26, bounds(0, 0, rw, 0.08), h + rise)));
    if (roof !== "classical") {
      parts.push(part((m) => {
        for (const x of [-w * 0.26, w * 0.26]) {
          const z = d * 0.24;
          lodWalls(m, lodRect(x, z, 1.5, 1.4), [[h + 1.2, h + 2.25, "wall"]], [0]);
          lodFrustum(m, "roof", bounds(x, z, 1.8, 1.65), h + 2.26, bounds(x, z, 0.08, 1.65), h + 2.9, null);
        }
      }, 3));
    }
  } else if (roof === "barrel") {
    parts.push(part((m) => {
      const sec: XY[] = [[-w / 2 - 0.2, h + 0.26]];
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI - (i * Math.PI) / 8;
        sec.push([Math.cos(a) * (w / 2 + 0.2), h + 0.3 + Math.sin(a) * 3]);
      }
      sec.push([w / 2 + 0.2, h + 0.26]);
      lodPlate(m, "roof", sec, -d / 2 - 0.25, d / 2 + 0.25);
    }));
  } else {
    parts.push(part((m) => { for (const x of [-w * 0.24, w * 0.24]) lodBox(m, "metal", x, -d * 0.2, 1.5, 1.25, h + 0.33, h + 0.96); }, 2));
  }
  if (historic(s)) parts.push(part((m) => lodBox(m, "wall", -w * 0.34, -d * 0.23, 0.85, 0.8, h + 0.35, h + 3.8, "trim"), 4));
  // the shop canopies, the balconies and the sign board on the street front
  const shop = ["modern", "shop", "annex", "balcony"].includes(s);
  if (shop && p.awning !== "none") {
    parts.push(part((m) => {
      const x0 = -w / 2 + 0.125, x1 = w / 2 - 0.125, z = d / 2;
      lodCap(m, "awning", [[x0, z], [x1, z], [x1, z + 1.3], [x0, z + 1.3]], 3.35);
      lodWalls(m, [[x0, z], [x1, z], [x1, z + 1.3], [x0, z + 1.3]], [[2.95, 3.35, "awning"]], [0]);
    }));
  }
  const balconyRows = s === "balcony" ? [[0, bays]] : s === "tenement" ? Array.from({ length: Math.ceil(bays / 2) }, (_, k) => [2 * k, 2 * k + 1]) : [];
  for (let f = 1; f < n && balconyRows.length; f++) {
    const y = 0.45 + f * floor + 0.4;
    parts.push(part((m) => {
      for (const [i0, i1] of balconyRows) {
        const x0 = -w / 2 + i0! * 2.7 + 0.3, x1 = -w / 2 + i1! * 2.7 - 0.3, z = d / 2;
        lodCap(m, "trim", [[x0, z], [x1, z], [x1, z + 1.4], [x0, z + 1.4]], y - 0.08);
        faceQuad(m, "trim", (u, yy) => [u, yy, z + 1.4], x0, x1, y - 0.24, y + 0.92, [0, 0, 1]);
      }
    }, 5 - f / 10));
  }
  if (p.sign === "board") {
    parts.push(part((m) => {
      const bw = Math.min(w - 1, 4.8) / 2;
      faceQuad(m, "door", (u, y) => [u, y, d / 2 + 0.43], -bw, bw, 3.06, 3.48, [0, 0, 1]);
      lodCap(m, "door", [[-bw, d / 2], [bw, d / 2], [bw, d / 2 + 0.43], [-bw, d / 2 + 0.43]], 3.48);
    }, 6));
  }
  if (s === "annex") {
    parts.push(part((m) => {
      const x = w / 2 + 2.2;
      lodWalls(m, lodRect(x, -1, 4.4, 6), [[0.05, 3.56, "wall"]], [3]);
      lodBox(m, "roof", x, -1, 4.65, 6.25, 3.56, 3.85);
    }));
  }
  if (s === "baroque") {
    // the layered curved gable, in two convex pieces
    const widths = [0.86, 0.84, 0.75, 0.60, 0.49, 0.45, 0.43, 0.40, 0.30, 0.14];
    const pts = widths.map((k, i): [number, number] => [w * k / 2 + 0.14, h + 0.3 + i * 0.3]);
    const piece = (from: number, to: number): XY[] => lodHull(pts.slice(from, to + 1).flatMap(([x, y]) => [[x, y], [-x, y]] as XY[]));
    parts.push(part((m) => {
      lodPlate(m, "wall", piece(0, 4), d / 2 - 0.34, d / 2 + 0.31);
      lodPlate(m, "wall", piece(4, 9), d / 2 - 0.34, d / 2 + 0.31);
    }));
  }
  if (s === "gable") {
    // the stepped street gable: each step's face, its trim top and its ends
    const widths = [0.8, 0.65, 0.5, 0.35, 0.2];
    parts.push(part((m) => {
      widths.forEach((k, i) => {
        const hw = (w * k) / 2, y0 = h + 0.3 + i * 0.48, y1 = y0 + 0.48, z0 = d / 2 - 0.325, z1 = d / 2 + 0.165;
        faceQuad(m, "wall", (u, y) => [u, y, z1], -hw, hw, y0, y1, [0, 0, 1]);
        lodCap(m, "trim", [[-hw, z0], [hw, z0], [hw, z1], [-hw, z1]], y1);
        for (const sx of [-1, 1]) lodPolygon(m, "wall", [[sx * hw, y0, z0], [sx * hw, y0, z1], [sx * hw, y1, z1], [sx * hw, y1, z0]], [sx, 0, 0]);
      });
    }));
  }
  return fit(streetPalette(s, p), parts);
}

export function commercialModernLod(p?: ParamValues): MeshBuilder { return streetLod("modern", p); }
export function commercialBalconyLod(p?: ParamValues): MeshBuilder { return streetLod("balcony", p); }
export function commercialAnnexLod(p?: ParamValues): MeshBuilder { return streetLod("annex", p); }
export function commercialBrickLod(p?: ParamValues): MeshBuilder { return streetLod("brick", p); }
export function commercialTenementLod(p?: ParamValues): MeshBuilder { return streetLod("tenement", p); }
export function commercialShopLod(p?: ParamValues): MeshBuilder { return streetLod("shop", p); }
export function commercialBarrelLod(p?: ParamValues): MeshBuilder { return streetLod("barrel", p); }
export function commercialTerraceLod(p?: ParamValues): MeshBuilder { return streetLod("terrace", p); }
export function commercialGableLod(p?: ParamValues): MeshBuilder { return streetLod("gable", p); }
export function commercialBaroqueLod(p?: ParamValues): MeshBuilder { return streetLod("baroque", p); }
export function commercialClassicalLod(p?: ParamValues): MeshBuilder { return streetLod("classical", p); }
