// Commercial plan families. Metres, ground at y=0, street front at +Z.
// Source inventory and provisional legacy correspondence: docs/models/commercial-streets.md.
import { MeshBuilder, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import { commercialModernLod, commercialBalconyLod, commercialAnnexLod, commercialBrickLod, commercialTenementLod, commercialShopLod, commercialBarrelLod, commercialTerraceLod, commercialGableLod, commercialBaroqueLod, commercialClassicalLod } from "./lodStreets.ts";
export { commercialModernLod, commercialBalconyLod, commercialAnnexLod, commercialBrickLod, commercialTenementLod, commercialShopLod, commercialBarrelLod, commercialTerraceLod, commercialGableLod, commercialBaroqueLod, commercialClassicalLod } from "./lodStreets.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { anyBlank, blankSides, faceBlank, grownPlan, partyParams, partySlabs, windowed, type Blank, type PartySide } from "./partyWalls.ts";

export const COMMERCIAL_CATALOG: CatalogFields = {
  category: "Commercial", group: "commercial", defaultScale: 1,
  license: "CC0", author: "Rail Island", source: "Procedural commercial architecture; Kenney and Quaternius reference silhouettes",
};
export type Style = "modern" | "balcony" | "annex" | "brick" | "tenement" | "shop" | "barrel" | "terrace" | "gable" | "baroque" | "classical";
const option = (name: string, title: string, values: string[], initial: string): ParamSpec => ({
  name, title, default: initial, values: values.map(value => ({ value, title: value[0].toUpperCase() + value.slice(1) })),
});
export const historic = (s: Style) => ["terrace", "gable", "baroque", "classical"].includes(s);
/** The sides a style can draw as a party wall: the shop wing stands at the right of the annex house. */
export const partySides = (s: Style): PartySide[] => s === "annex" ? ["left", "back"] : ["left", "right", "back"];
export function specs(s: Style): ParamSpec[] {
  return [
    option("storeys", "Storeys", s === "shop" ? ["1", "2"] : ["2", "3", "4", "5"], s === "tenement" ? "5" : s === "shop" ? "1" : "3"),
    option("width", "Facade width", ["narrow", "standard", "wide", ...(["brick", "tenement"].includes(s) ? ["extraWide"] : [])], "standard"),
    option("finish", "Facade finish", ["original", "sand", "sage", "brick"], "original"),
    ...(["brick", "tenement"].includes(s) ? [option("entrance", "Street entrance", ["level", "stoop", "paired"], "level")] : []),
    ...(["brick", "shop"].includes(s) ? [option("sign", "Shop sign", ["none", "board"], "none")] : []),
    ...(["shop", "brick", "tenement"].includes(s) ? [option("roof", "Roof form", ["flat", "pitched"], "flat")] : []),
    ...(s === "shop" || s === "modern" ? [option("awning", "Shop canopy", ["green", "ochre", "none"], "green")] : []),
    ...partyParams(partySides(s)),
  ];
}
// All face layers have distinct depths; the solid wall is behind the window glass.
function panel(m: MeshBuilder, mat: string, axis: "x" | "z", sign: number, at: number, u: number, y: number, w: number, h: number, depth: number, thickness = 0.06) {
  if (axis === "z") m.box(mat, u, sign * (at + depth), w, thickness, y, y + h);
  else m.box(mat, sign * (at + depth), u, thickness, w, y, y + h);
}
/**
 * How a family frames its windows: `plain` a slim white frame and a thin sill (the
 * modern houses), `stone` a flat stone surround, `moulded` a stepped surround - an
 * architrave and the fascia behind it - under a cornice head (the burgher houses),
 * `baroque` the stepped surround with a keystone under a curved hood.
 */
export type WindowKind = "plain" | "stone" | "moulded" | "baroque";
export const windowKind = (s: Style): WindowKind =>
  ["modern", "balcony", "annex"].includes(s) ? "plain" : s === "baroque" ? "baroque" : historic(s) ? "moulded" : "stone";
/**
 * A window set into the wall at `at`: a surround standing proud of the wall, whose
 * inner faces are the reveals, the glass set back in it near the wall plane,
 * glazing bars spanning the glass exactly, a sill under it and the head its
 * `kind` gives it. `u` and `y` are the glass's centre along the facade and its
 * bottom. Only the faces the street can see are drawn (no backs, no hidden ends).
 */
function window(m: MeshBuilder, axis: "x" | "z", sign: number, at: number, u: number, y: number, w: number, h: number, kind: WindowKind) {
  type V = [number, number, number];
  // facade-local (s along the facade from u, height, t out of the wall) to the model
  const P = (s: number, yy: number, t: number): V => axis === "z" ? [u + s, yy, sign * (at + t)] : [sign * (at + t), yy, u + s];
  const N = (ns: number, ny: number, nt: number): V => axis === "z" ? [ns, ny, sign * nt] : [sign * nt, ny, ns];
  const q = (mat: string, a: V, b: V, c: V, d: V, n: V) => m.facets(mat, [a, b, c, a, c, d], n);
  // the faces of the block s0..s1, y0..y1, t0..t1 named in `faces` (front, left, right, top, bottom)
  const block = (mat: string, s0: number, s1: number, y0: number, y1: number, t0: number, t1: number, faces: string) => {
    if (faces.includes("f")) q(mat, P(s0, y0, t1), P(s1, y0, t1), P(s1, y1, t1), P(s0, y1, t1), N(0, 0, 1));
    if (faces.includes("l")) q(mat, P(s0, y0, t0), P(s0, y0, t1), P(s0, y1, t1), P(s0, y1, t0), N(-1, 0, 0));
    if (faces.includes("r")) q(mat, P(s1, y0, t0), P(s1, y0, t1), P(s1, y1, t1), P(s1, y1, t0), N(1, 0, 0));
    if (faces.includes("t")) q(mat, P(s0, y1, t0), P(s1, y1, t0), P(s1, y1, t1), P(s0, y1, t1), N(0, 1, 0));
    if (faces.includes("b")) q(mat, P(s0, y0, t0), P(s1, y0, t0), P(s1, y0, t1), P(s0, y0, t1), N(0, -1, 0));
  };
  const half = w / 2;
  // a band `band` wide round the opening, `proud` of the wall: two jambs under a lintel
  // that runs over them, so the band's top is closed from above
  const surround = (mat: string, inner: number, band: number, proud: number, jamb: [string, string], lintel: string) => {
    const o = inner + band, top = y + h + (inner - half) + band;
    block(mat, -o, -inner, y, top - band, 0, proud, jamb[0]);
    block(mat, inner, o, y, top - band, 0, proud, jamb[1]);
    block(mat, -o, o, top - band, top, 0, proud, lintel);
    return { outer: o, top };
  };
  block("glass", -half, half, y, y + h, 0, 0.02, "f");
  if (kind === "plain") {
    // a slim frame flush with the glazing bar: one mullion, no transom
    const { outer } = surround("frame", half, 0.07, 0.07, ["flr", "flr"], "flrtb");
    block("frame", -0.025, 0.025, y, y + h, 0.02, 0.06, "flr");
    block("trim", -outer - 0.03, outer + 0.03, y - 0.06, y, 0, 0.12, "flrtb");
    return;
  }
  block("frame", -0.03, 0.03, y, y + h, 0.02, 0.07, "flr");
  block("frame", -half, half, y + h * 0.6 - 0.03, y + h * 0.6 + 0.03, 0.02, 0.07, "ftb");
  if (kind === "stone") {
    const { outer } = surround("trim", half, 0.13, 0.14, ["flr", "flr"], "flrtb");
    block("trim", -outer - 0.06, outer + 0.06, y - 0.12, y, 0, 0.2, "flrtb");
    return;
  }
  // the moulded surround: an architrave round the reveals, stepped back to a fascia
  const arch = surround("trim", half, 0.08, 0.14, ["fr", "fl"], "fb");
  block("trim", -arch.outer, -half, y, arch.top - 0.08, 0.08, 0.14, "l");
  block("trim", half, arch.outer, y, arch.top - 0.08, 0.08, 0.14, "r");
  block("trim", -arch.outer, arch.outer, arch.top - 0.08, arch.top, 0.08, 0.14, "lrt");
  const fascia = surround("trim", arch.outer, 0.07, 0.08, ["fl", "fr"], "flrt");
  const R = fascia.outer + 0.06;
  block("trim", -R, R, y - 0.12, y, 0, 0.2, "flrtb");
  if (kind === "moulded") {
    block("trim", -R, R, fascia.top, fascia.top + 0.16, 0, 0.2, "flrtb");
    return;
  }
  // baroque: a solid segmental pediment on the fascia, a keystone standing proud under it
  const rise = 0.24, thick = 0.13, steps = 4;
  const arc = (k: number) => { const sk = -R + (2 * R * k) / steps; return [sk, fascia.top + thick + rise * (1 - (sk / R) ** 2)] as const; };
  for (let k = 0; k < steps; k++) {
    const [s0, y0] = arc(k), [s1, y1] = arc(k + 1);
    q("trim", P(s0, fascia.top, 0.2), P(s1, fascia.top, 0.2), P(s1, y1, 0.2), P(s0, y0, 0.2), N(0, 0, 1));
    q("trim", P(s0, y0, 0), P(s1, y1, 0), P(s1, y1, 0.2), P(s0, y0, 0.2), N(0, 1, 0));
  }
  block("trim", -R, R, fascia.top, fascia.top + thick, 0, 0.2, "lrb");
  block("trim", -0.09, 0.09, y + h - 0.05, fascia.top, 0, 0.22, "flrtb");
}

function balcony(m: MeshBuilder, x: number, z: number, y: number, w: number) {
  m.box("trim", x, z + 0.65, w + 0.4, 1.5, y - 0.24, y - 0.08);
  m.box("metal", x, z + 1.35, w + 0.32, 0.09, y + 0.82, y + 0.92);
  for (const s of [-1, 1]) m.box("metal", x + s * (w / 2 + 0.12), z + 0.68, 0.09, 1.4, y + 0.82, y + 0.92);
  for (let i = 0; i <= 8; i++) m.box("metal", x - w / 2 + i * w / 8, z + 1.35, 0.055, 0.055, y - 0.06, y + 0.84);
}
function roof(m: MeshBuilder, s: Style, w: number, d: number, y: number, blank: Blank) {
  const [tx, tz, tw, td] = grownPlan(w, d, 0.25, blank);
  m.box("trim", tx, tz, tw, td, y, y + 0.25);
  if (["terrace", "gable", "classical"].includes(s)) {
    const rise = s === "classical" ? 2.1 : 3.2;
    const [rx, rz, rw, rd] = grownPlan(w, d, 0.325, blank);
    // A very narrow ridge avoids a collapsed loft ring and degenerate triangles.
    m.loft("roof", rect(rw, rd, rx, rz), y + 0.26,
      rect(s === "classical" ? w * 0.65 : rw, 0.08, s === "classical" ? 0 : rx, rz), y + rise);
    if (s !== "classical") for (const x of [-w * 0.26, w * 0.26]) {
      m.box("wall", x, d * 0.24, 1.5, 1.4, y + 0.6, y + 2.25);
      window(m, "z", 1, d * 0.24 + 0.7, x, y + 1.02, 0.85, 0.95, "stone");
      m.loft("roof", rect(1.8, 1.65, x, d * 0.24), y + 2.26, rect(0.08, 1.65, x, d * 0.24), y + 2.9);
    }
  } else if (s === "barrel") {
    const x0 = -w / 2 - (blank.left ? 0 : 0.2), x1 = w / 2 + (blank.right ? 0 : 0.2);
    const cx = (x0 + x1) / 2, hw = (x1 - x0) / 2;
    const section: Ring = [[x0, y + 0.26]];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI - i * Math.PI / 16;
      section.push([cx + Math.cos(a) * hw, y + 0.3 + Math.sin(a) * 3]);
    }
    section.push([x1, y + 0.26]);
    m.sweep("roof", "z", section, -d / 2 - (blank.back ? 0 : 0.25), section, d / 2 + 0.25);
  } else {
    m.box("roof", 0, 0, w - 0.1, d - 0.1, y + 0.26, y + 0.33);
    // the parapet: on a party wall it stands on the wall line, not beyond it
    for (const sign of [-1, 1]) {
      const zEdge = sign < 0 && blank.back ? -d / 2 + 0.09 : sign * (d / 2 + 0.12);
      const xEdge = (sign < 0 ? blank.left : blank.right) ? sign * (w / 2 - 0.09) : sign * (w / 2 + 0.12);
      m.box("trim", tx, zEdge, tw, 0.18, y + 0.27, y + 0.7);
      m.box("trim", xEdge, 0, 0.18, d + 0.12, y + 0.27, y + 0.7);
    }
    for (const x of [-w * 0.24, w * 0.24]) {
      m.box("metal", x, -d * 0.2, 1.5, 1.25, y + 0.34, y + 0.9);
      for (let i = 0; i < 5; i++) m.box("roof", x, -d * 0.2 - 0.4 + i * 0.2, 1.25, 0.07, y + 0.91, y + 0.96);
    }
  }
  if (historic(s)) {
    m.box("wall", -w * 0.34, -d * 0.23, 0.85, 0.8, y + 0.35, y + 3.6);
    m.box("trim", -w * 0.34, -d * 0.23, 1.08, 1, y + 3.6, y + 3.8);
    for (const x of [-0.22, 0.22]) m.box("roof", -w * 0.34 + x, -d * 0.23, 0.25, 0.3, y + 3.81, y + 4.14);
  }
}
/** The palette of a style with the chosen finish and canopy (the LOD paints with it too). */
export function streetPalette(s: Style, p: ParamValues): Record<string, MaterialSpec> {
  const colours: Record<string, string> = { sand: "#d6c8a5", sage: "#748e83", brick: "#975b49", original: historic(s) ? "#c7bba2" : ["modern", "balcony", "annex"].includes(s) ? "#e6e2dd" : "#995e50" };
  return { wall: { color: colours[p.finish!]! }, trim: { color: "#e4dbc6" },
    frame: { color: "#eee9de" }, glass: { color: "#6089a4", roughness: 0.3 },
    roof: { color: s === "terrace" || s === "gable" ? "#985442" : "#48525d" },
    metal: { color: "#47515a" }, door: { color: "#684a36" },
    awning: { color: p.awning === "ochre" ? "#d6a84e" : "#459b81" }, stone: { color: "#8d8a83" },
  };
}
function buildCommercial(s: Style, given?: ParamValues): MeshBuilder {
  const p = resolveParams(specs(s), given);
  const blank = blankSides(p);
  const n = Number(p.storeys), bays = p.width === "narrow" ? 2 : p.width === "wide" ? 5 : p.width === "extraWide" ? 8 : 3;
  const w = bays * 2.7, d = historic(s) ? 9 : 8, floor = 3.2, h = n * floor + 0.45;
  const m = new MeshBuilder(streetPalette(s, p));
  m.scope("masonry and storey bands", () => {
    const [px, pz, pw, pd] = grownPlan(w, d, 0.06, blank);
    m.box("stone", px, pz, pw, pd, 0, 0.45);
    m.box("wall", 0, 0, w, d, 0.45, h);
    const [bx, bz, bw, bd] = grownPlan(w, d, 0.11, blank);
    for (let f = 1; f < n; f++) m.box("trim", bx, bz, bw, bd, 0.45 + f * floor - 0.19, 0.45 + f * floor);
    if (!["modern", "balcony", "annex"].includes(s)) for (let f = 0; f < n * 4; f++) {
      const yy = 0.65 + f * 0.8;
      for (const sign of [-1, 1]) for (const axis of ["x", "z"] as const) {
        if (faceBlank(blank, axis, sign)) continue;
        const at = axis === "z" ? d / 2 : w / 2;
        const extent = axis === "z" ? w : d;
        for (const edge of [-1, 1]) panel(m, "trim", axis, sign, at, edge * (extent / 2 - 0.23), yy, f % 2 ? 0.38 : 0.65, 0.22, 0.07);
      }
    }
  });
  m.scope("windows and storefront", () => {
    for (const axis of ["z", "x"] as const) for (const sign of [-1, 1]) {
      if (faceBlank(blank, axis, sign)) continue;
      const at = (axis === "z" ? d : w) / 2, count = axis === "z" ? bays : 3;
      const span = axis === "z" ? w : d;
      for (let f = 0; f < n; f++) for (let i = 0; i < count; i++) {
        const u = -span / 2 + (i + 0.5) * span / count;
        const front = axis === "z" && sign === 1;
        const yy = 0.45 + f * floor;
        if (front && f === 0 && (["modern", "shop", "annex", "balcony", "gable"].includes(s) || (p.entrance === "paired" ? i === Math.floor(count / 3) || i === Math.floor(2 * count / 3) : i === Math.floor(count / 2)))) {
          const shop = ["modern", "shop", "annex", "balcony"].includes(s);
          if (!shop && p.entrance !== "level" && p.entrance !== undefined) {
            // Three 15 cm risers reach the masonry plinth without scaling the house.
            for (let step = 0; step < 3; step++) m.box("stone", u, at + 0.9 - step * 0.22, 1.65, 0.44, step * 0.15, (step + 1) * 0.15);
          }
          panel(m, shop ? "glass" : "door", axis, sign, at, u, yy + 0.05, shop ? 2.15 : 1.2, 2.45, 0.10);
          panel(m, "trim", axis, sign, at, u, yy + 2.52, shop ? 2.35 : 1.5, 0.18, 0.15);
          panel(m, "frame", axis, sign, at, u, yy + 0.12, 0.07, 2.32, 0.17);
          if (shop && p.awning !== "none") {
            m.box("awning", u, at + 0.65, 2.45, 1.3, yy + 2.75, yy + 2.9);
            panel(m, "awning", axis, sign, at, u, yy + 2.5, 2.45, 0.25, 1.26);
          }
        } else {
          window(m, axis, sign, at, u, yy + 0.7, 1.35, 1.75, windowKind(s));
          if (front && f > 0 && (s === "balcony" || (s === "tenement" && i % 2 === 0))) balcony(m, u, at, yy + 0.4, 1.7);
        }
      }
    }
  });
  if (p.sign === "board") m.scope("shop sign", () => {
    m.box("door", 0, d / 2 + 0.35, Math.min(w - 1, 4.8), 0.16, 3.06, 3.48);
    m.box("trim", 0, d / 2 + 0.45, Math.min(w - 1.2, 4.6), 0.05, 3.14, 3.4);
  });
  m.scope("roof and equipment", () => roof(m, p.roof === "pitched" ? "terrace" : s, w, d, h, blank));
  if (anyBlank(blank)) m.scope("party walls", () => partySlabs(m, buildCommercial(s, windowed(p)).positions(), blank, w, d, h, "wall"));
  if (s === "gable") m.scope("arcaded ground floor", () => {
    for (let i = 0; i < bays; i++) {
      const x = -w / 2 + (i + 0.5) * 2.7, z = d / 2 + 0.3;
      for (const sign of [-1, 1]) m.box("trim", x + sign * 0.85, z, 0.28, 0.4, 0.46, 2.1);
      for (let j = 0; j < 12; j++) {
        const a = j * Math.PI / 12, b = (j + 1) * Math.PI / 12;
        m.slab("trim", [
          [x + Math.cos(a) * 0.7, 2.1 + Math.sin(a) * 0.7, z + 0.2],
          [x + Math.cos(a), 2.1 + Math.sin(a), z + 0.2],
          [x + Math.cos(b), 2.1 + Math.sin(b), z + 0.2],
          [x + Math.cos(b) * 0.7, 2.1 + Math.sin(b) * 0.7, z + 0.2],
        ], [0, 0, -0.4]);
      }
    }
  });
  if (s === "annex") m.scope("side shop wing", () => {
    const x = w / 2 + 2.2, z = -1;
    m.box("wall", x, z, 4.4, 6, 0.05, 3.55);
    m.box("roof", x, z, 4.65, 6.25, 3.56, 3.85);
    window(m, "z", 1, 2, x, 0.7, 3.1, 1.9, "plain");
  });
  if (s === "baroque" || s === "gable") m.scope("street gable", () => {
    // Layered curved silhouette, a small central pediment and an attic window.
    const widths = s === "baroque" ? [0.86, 0.84, 0.75, 0.60, 0.49, 0.45, 0.43, 0.40, 0.30, 0.14] : [0.8, 0.65, 0.5, 0.35, 0.2];
    if (s === "baroque") {
      for (let i = 0; i < widths.length - 1; i++) {
        const a = w * widths[i] / 2, b = w * widths[i + 1] / 2;
        const y0 = h + 0.3 + i * 0.3, y1 = y0 + 0.3;
        const section: Ring = [[-a, y0], [a, y0], [b, y1], [-b, y1]];
        m.sweep("wall", "z", section, d / 2 - 0.3, section, d / 2 + 0.25);
        for (const sign of [-1, 1]) {
          const band: Ring = [[sign * a, y0], [sign * (a + 0.14), y0], [sign * (b + 0.14), y1], [sign * b, y1]];
          m.sweep("trim", "z", band, d / 2 - 0.34, band, d / 2 + 0.31);
        }
      }
    } else for (let i = 0; i < widths.length; i++) {
      m.box("wall", 0, d / 2 - 0.1, w * widths[i], 0.45, h + 0.3 + i * 0.48, h + 0.78 + i * 0.48);
      m.box("trim", 0, d / 2 - 0.1, w * widths[i] + 0.12, 0.58, h + 0.79 + i * 0.48, h + 0.89 + i * 0.48);
    }
    // on the face of the gable: the baroque sections stand 0.25 m proud, the gabled steps 0.125 m
    window(m, "z", 1, d / 2 + (s === "baroque" ? 0.25 : 0.125), 0, h + 0.7, 0.85, 1.05, s === "baroque" ? "moulded" : "stone");
  });
  if (s === "classical") m.scope("pilasters", () => {
    for (let i = 0; i <= bays; i++) {
      const x = -w / 2 + i * 2.7;
      m.box("trim", x, d / 2 + 0.2, 0.24, 0.25, 0.5, h - 0.1);
      m.box("trim", x, d / 2 + 0.22, 0.48, 0.3, h - 0.35, h - 0.12);
    }
  });
  return m;
}
export function commercialModern(p?: ParamValues) { return buildCommercial("modern", p); }
export function commercialBalcony(p?: ParamValues) { return buildCommercial("balcony", p); }
export function commercialAnnex(p?: ParamValues) { return buildCommercial("annex", p); }
export function commercialBrick(p?: ParamValues) { return buildCommercial("brick", p); }
export function commercialTenement(p?: ParamValues) { return buildCommercial("tenement", p); }
export function commercialShop(p?: ParamValues) { return buildCommercial("shop", p); }
export function commercialBarrel(p?: ParamValues) { return buildCommercial("barrel", p); }
export function commercialTerrace(p?: ParamValues) { return buildCommercial("terrace", p); }
export function commercialGable(p?: ParamValues) { return buildCommercial("gable", p); }
export function commercialBaroque(p?: ParamValues) { return buildCommercial("baroque", p); }
export function commercialClassical(p?: ParamValues) { return buildCommercial("classical", p); }
const definitions: [Style, string, ProceduralDesign["build"], NonNullable<ProceduralDesign["buildLod"]>][] = [
  ["modern", "Modern Shop House", commercialModern, commercialModernLod], ["balcony", "Balcony Apartment House", commercialBalcony, commercialBalconyLod],
  ["annex", "Shop House with Wing", commercialAnnex, commercialAnnexLod], ["brick", "Brick Street House", commercialBrick, commercialBrickLod],
  ["tenement", "Balcony Tenement", commercialTenement, commercialTenementLod], ["shop", "Neighbourhood Store", commercialShop, commercialShopLod],
  ["barrel", "Barrel Roof House", commercialBarrel, commercialBarrelLod], ["terrace", "Burgher Terrace", commercialTerrace, commercialTerraceLod],
  ["gable", "Gabled Arcade House", commercialGable, commercialGableLod], ["baroque", "Baroque Townhouse", commercialBaroque, commercialBaroqueLod],
  ["classical", "Classical Townhouse", commercialClassical, commercialClassicalLod],
];
export const COMMERCIAL: readonly ProceduralDesign[] = definitions.map(([s, title, build, buildLod]) => ({
  id: `commercial-${s}`, title, build, buildLod, params: specs(s), finishParams: ["finish"],
  catalog: COMMERCIAL_CATALOG, references: `commercial/${s}`,
}));
