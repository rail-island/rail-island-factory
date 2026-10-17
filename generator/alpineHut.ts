// The parametric alpine hut: a two-storey (or one-storey) chalet on a stone
// plinth, white plaster in a dark half-timber frame, a boarded gable under a
// broad gable roof, a carved front balcony and shuttered windows. Inspired by
// the community GLB in assets/alpine-hut/; original procedural geometry.
// Metres, +z street front (the gable), y = 0 ground. No imported meshes.
//
// Every applied part (posts, beams, frames, snow) starts a few centimetres
// inside what carries it, so no two materials share a plane (coplanar.ts).
import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { Ring, Vec3 } from "./meshCore.ts";

const choice = (name: string, title: string, values: string[], when?: ParamSpec["when"]): ParamSpec => ({
  name, title, default: values[0], values: values.map(value => ({ value, title: value[0].toUpperCase() + value.slice(1) })), ...(when ? { when } : {}),
});

export const ALPINE_HUT_PARAMS: readonly ParamSpec[] = [
  choice("storeys", "Storeys", ["two", "one"]),
  choice("balcony", "Balcony", ["front", "wrap", "none"], { name: "storeys", values: ["two"] }),
  choice("entrance", "Entrance", ["step", "porch"]),
  choice("chimney", "Chimney", ["stone", "none"]),
  choice("season", "Season", ["winter", "summer"]),
  choice("roof", "Roof colour", ["green", "red", "slate", "brown"]),
  choice("walls", "Plaster colour", ["white", "cream", "ochre"]),
  choice("timber", "Timber finish", ["walnut", "oak", "weathered"]),
  choice("accent", "Shutter colour", ["red", "green", "blue"]),
];

const ROOFS: Record<string, string> = { green: "#1f5a52", red: "#8f2f26", slate: "#4b5866", brown: "#5c4031" };
const WALLS: Record<string, string> = { white: "#e9ecee", cream: "#eadfc4", ochre: "#dcbf86" };
const TIMBERS: Record<string, [string, string]> = { walnut: ["#4a2a1a", "#6b4630"], oak: ["#6e4a2a", "#8f6a43"], weathered: ["#4f4a44", "#706a61"] };
const ACCENTS: Record<string, string> = { red: "#8e1f33", green: "#2f5e3c", blue: "#2c4f7c" };

type Face = "front" | "back" | "right" | "left";
const EMBED: Record<string, number> = { glass: 0.01, trim: 0.02, iron: 0.025, accent: 0.03, flower: 0.035, leaf: 0.035, snow: 0.04, block: 0.015 };

export function villageAlpineHut(values?: ParamValues): MeshBuilder {
  const p = resolveParams(ALPINE_HUT_PARAMS, values);
  const [timber, boards] = TIMBERS[p.timber]!;
  const pal: Record<string, MaterialSpec> = {
    plaster: { color: WALLS[p.walls]! }, timber: { color: timber }, boards: { color: boards },
    trim: { color: "#b98450" }, roof: { color: ROOFS[p.roof]! }, snow: { color: "#f4f8fb", roughness: 0.9 },
    stone: { color: "#56616c" }, block: { color: "#9ba4ac" }, glass: { color: "#f3b04c", roughness: 0.3 },
    accent: { color: ACCENTS[p.accent]! }, iron: { color: "#272c30", metallic: 0.5 }, log: { color: "#a77a4c" },
    flower: { color: "#d0283e" }, leaf: { color: "#3e7a33" },
  };
  const m = new MeshBuilder(pal);
  const winter = p.season === "winter";
  const two = p.storeys === "two";
  const balcony = two ? p.balcony : "none";
  const W = 5.6, D = 4.8, P = 0.55, H = 2.55;
  const F = P + H; // the upper floor
  const E = two ? P + 2 * H : P + H + 0.55; // the eaves (a knee wall under a one-storey roof)
  const k = 0.62; // roof pitch
  const hx = W / 2 + (balcony === "wrap" ? 1.3 : 0.55);
  const zf = D / 2 + (balcony !== "none" ? 1.35 : p.entrance === "porch" ? 1.1 : 0.65);
  const zb = -D / 2 - 0.6;
  const R = E + 0.2 + (W / 2) * k; // the roof's top surface at the ridge
  const roofTop = (x: number) => R - Math.abs(x) * k;
  const under = (x: number) => E + (W / 2 - Math.abs(x)) * k; // the gable wall's top edge

  // A box on a wall face: u across the face (left to right seen from outside),
  // out0..out1 off the wall plane.
  const wallBox = (mat: string, f: Face, u: number, w: number, y0: number, y1: number, out0: number, out1: number, base = 0) => {
    // a part that reaches the wall is sunk into it by a depth of its own material,
    // so the hidden backs of a window's glass, frame and sill never share a plane
    if (out0 <= 0) out0 = Math.min(out0, -0.02) - (EMBED[mat] ?? 0);
    out0 += base; out1 += base;
    const o = (out0 + out1) / 2, t = out1 - out0;
    if (f === "front") m.box(mat, u, D / 2 + o, w, t, y0, y1);
    else if (f === "back") m.box(mat, -u, -D / 2 - o, w, t, y0, y1);
    else if (f === "right") m.box(mat, W / 2 + o, -u, t, w, y0, y1);
    else m.box(mat, -W / 2 - o, u, t, w, y0, y1);
  };
  const fbox = wallBox;
  const facePoint = (f: Face, u: number, y: number, out: number): Vec3 =>
    f === "front" ? [u, y, D / 2 + out] : f === "back" ? [-u, y, -D / 2 - out] : f === "right" ? [W / 2 + out, y, -u] : [-W / 2 - out, y, u];
  const outward = (f: Face, d: number): Vec3 => (f === "front" ? [0, 0, d] : f === "back" ? [0, 0, -d] : f === "right" ? [d, 0, 0] : [-d, 0, 0]);
  // A flat bar on a face from (u0, y0) to (u1, y1): a brace.
  const brace = (f: Face, u0: number, y0: number, u1: number, y1: number, width: number, out0: number, out1: number) => {
    const len = Math.hypot(u1 - u0, y1 - y0);
    const nu = -(y1 - y0) / len * width / 2, ny = (u1 - u0) / len * width / 2;
    m.slab("timber", [facePoint(f, u0 + nu, y0 + ny, out1), facePoint(f, u1 + nu, y1 + ny, out1), facePoint(f, u1 - nu, y1 - ny, out1), facePoint(f, u0 - nu, y0 - ny, out1)], outward(f, out0 - out1));
  };
  const faceWidth = (f: Face) => (f === "front" || f === "back" ? W : D);

  m.scope("main block", () => {
    m.box("stone", 0, 0, W + 0.16, D + 0.16, 0, P);
    m.box("plaster", 0, 0, W, D, P - 0.02, E, 0, false);
  });

  m.scope("stone plinth", () => {
    for (const f of ["front", "back", "right", "left"] as Face[]) {
      const half = faceWidth(f) / 2 + 0.08;
      for (let row = 0; row < 2; row++) {
        const n = Math.round((2 * half) / 0.62);
        const len = (2 * half) / n;
        for (let i = 0; i < n + (row % 2); i++) {
          let u0 = -half + (i - (row % 2) * 0.5) * len + 0.025, u1 = u0 + len - 0.05;
          u0 = Math.max(u0, -half + 0.03); u1 = Math.min(u1, half - 0.03);
          if (f === "front" && p.entrance === "step" && Math.abs((u0 + u1) / 2) < 0.95) continue;
          fbox("block", f, (u0 + u1) / 2, u1 - u0, 0.04 + row * 0.25, 0.26 + row * 0.25, 0.06, 0.105);
        }
      }
    }
    if (winter) {
      // snow lying on the plinth's ledge, interrupted at the door
      for (const s of [-1, 1]) m.box("snow", s * (W / 2 + 0.03), 0, 0.14, D + 0.04, P - 0.02, P + 0.05);
      m.box("snow", 0, -D / 2 - 0.03, W - 0.1, 0.14, P - 0.02, P + 0.05);
      for (const s of [-1, 1]) m.box("snow", s * (W / 4 + 0.3), D / 2 + 0.03, W / 2 - 0.75, 0.14, P - 0.02, P + 0.05);
    }
  });

  m.scope("half timber frame", () => {
    const top = E - 0.02;
    for (const f of ["front", "back", "right", "left"] as Face[]) {
      const half = faceWidth(f) / 2;
      for (const u of [-half + 0.06, half - 0.06]) fbox("timber", f, u, 0.24, P - 0.05, top, -0.02, 0.075);
      fbox("timber", f, 0, 2 * half + 0.1, P - 0.03, P + 0.18, -0.02, 0.06);
      fbox("timber", f, 0, 2 * half + 0.1, E - 0.24, top, -0.02, 0.06);
      if (two) fbox("timber", f, 0, 2 * half + 0.1, F - 0.1, F + 0.1, -0.02, 0.06);
      const storeys = two ? [[P + 0.18, F - 0.1], [F + 0.1, E - 0.24]] : [[P + 0.18, E - 0.24]];
      for (const [y0, y1] of storeys) {
        // knee braces from the corner posts
        if (f !== "front" || y0! > F - 0.5) for (const s of [-1, 1]) brace(f, s * (half - 0.15), y0! + 0.05, s * (half - 0.6), y0! + 0.6, 0.15, -0.02, 0.05);
        if (f !== "front") fbox("timber", f, 0, 0.2, y0!, y1!, -0.02, 0.055);
        else if (y0! > F - 0.5) for (const s of [-1, 1]) brace(f, s * 0.7, y0! + 0.04, s * 0.7, y1! - 0.04, 0.18, -0.02, 0.055);
      }
      if (f === "front") for (const s of [-1, 1]) fbox("timber", f, s * 0.68, 0.18, P + 0.18, two ? F - 0.1 : E - 0.24, -0.02, 0.055);
    }
  });

  m.scope("boarded gables", () => {
    for (const s of [-1, 1]) {
      const z = s * (D / 2 + 0.04);
      m.slab("boards", [[-W / 2, E, z], [W / 2, E, z], [0, under(0), z]], [0, 0, -s * 0.22]);
      for (let x = -W / 2 + 0.35; x < W / 2 - 0.2; x += 0.35) {
        const a = x - 0.035, b = x + 0.035, zz = s * (D / 2 + 0.075);
        if (under(a) - E < 0.25 || under(b) - E < 0.25 || (!two && Math.abs(x) < 0.5)) continue;
        m.slab("timber", [[a, E + 0.02, zz], [b, E + 0.02, zz], [b, under(b) - 0.04, zz], [a, under(a) - 0.04, zz]], [0, 0, -s * 0.06]);
      }
      // the collar beam under the gable
      m.box("timber", 0, s * (D / 2 + 0.05), W + 0.2, 0.14, E - 0.04, E + 0.16);
    }
  });

  m.scope("alpine roof", () => {
    for (const s of [-1, 1]) {
      m.slab("roof", [[0, R, zb], [s * hx, roofTop(hx), zb], [s * hx, roofTop(hx), zf], [0, R, zf]], [0, -0.2, 0]);
      // bargeboards on both gable ends
      for (const [z, d] of [[zf - 0.03, 0.1], [zb + 0.03, -0.1]] as const) {
        const a: [number, number] = [s * (hx + 0.02), roofTop(hx) - 0.09], b: [number, number] = [0, R - 0.09];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const nx = -(b[1] - a[1]) / len * 0.15, ny = (b[0] - a[0]) / len * 0.15;
        m.slab("trim", [[a[0] + nx, a[1] + ny, z + d], [b[0] + nx, b[1] + ny, z + d], [b[0] - nx, b[1] - ny, z + d], [a[0] - nx, a[1] - ny, z + d]], [0, 0, -d]);
      }
      // purlin ends under the eaves
      for (const z of [zb + 0.2, (zb + zf) / 2, zf - 0.25]) m.box("timber", s * (W / 2 + 0.25), z, 0.62, 0.16, E - 0.3, under(W / 2 + 0.58) - 0.02);
      if (winter) {
        const x1 = s * (hx - 0.06);
        m.slab("snow", [[s * 0.01, roofTop(0.01) + 0.12, zb + 0.08], [x1, roofTop(x1) + 0.12, zb + 0.08], [x1, roofTop(x1) + 0.12, zf - 0.08], [s * 0.01, roofTop(0.01) + 0.12, zf - 0.08]], [0, -0.16, 0]);
        // snow pillows hanging over the eaves
        const n = Math.round((zf - zb) / 1.25);
        const len = (zf - zb - 0.2) / n;
        for (let i = 0; i < n; i++) pillow(m, s * (hx - 0.12), roofTop(hx) + 0.1, zb + 0.1 + i * len + 0.04, zb + 0.1 + (i + 1) * len - 0.04, s);
      } else {
        // standing seams of the sheet metal roof
        for (let z = zb + 0.3; z < zf - 0.2; z += 0.5) {
          m.slab("roof", [[s * 0.06, roofTop(0.06) + 0.05, z - 0.025], [s * (hx - 0.02), roofTop(hx - 0.02) + 0.05, z - 0.025], [s * (hx - 0.02), roofTop(hx - 0.02) + 0.05, z + 0.025], [s * 0.06, roofTop(0.06) + 0.05, z + 0.025]], [0, -0.09, 0]);
        }
      }
    }
    const ridge: Ring = [[-0.16, 0], [0.16, 0], [0.11, 0.1], [0, 0.14], [-0.11, 0.1]];
    const lift = winter ? 0.08 : -0.02;
    m.sweep(winter ? "snow" : "roof", "z", ridge.map(([x, y]) => [x, R + lift + y]), zb + (winter ? 0.1 : 0), ridge.map(([x, y]) => [x, R + lift + y]), zf - (winter ? 0.1 : 0));
  });

  const window = (f: Face, u: number, y0: number, w: number, h: number, shutters: boolean, flowers: boolean, base = 0) => {
    // base: how far the carrying surface stands proud of the wall (a boarded gable)
    const fbox = (mat: string, f: Face, u: number, w: number, y0: number, y1: number, out0: number, out1: number) => wallBox(mat, f, u, w, y0, y1, out0, out1, base);
    m.scope("window", () => {
      fbox("glass", f, u, w, y0, y0 + h, -0.02, 0.03);
      for (const s of [-1, 1]) fbox("timber", f, u + s * (w / 2 + 0.03), 0.1, y0 - 0.04, y0 + h + 0.06, -0.02, 0.075);
      fbox("timber", f, u, w + 0.16, y0 + h - 0.02, y0 + h + 0.1, -0.02, 0.07);
      fbox("timber", f, u, 0.06, y0 + 0.01, y0 + h - 0.01, -0.02, 0.055);
      fbox("timber", f, u, w - 0.02, y0 + h * 0.58 - 0.03, y0 + h * 0.58 + 0.03, -0.02, 0.05);
      fbox("trim", f, u, w + 0.32, y0 - 0.08, y0, -0.02, 0.15);
      if (winter) fbox("snow", f, u, w + 0.24, y0 - 0.02, y0 + 0.05, 0.0, 0.13);
      if (shutters) {
        for (const s of [-1, 1]) {
          const c = u + s * (w / 2 + 0.09 + w / 4 + 0.02);
          fbox("accent", f, c, w / 2 + 0.04, y0 - 0.02, y0 + h + 0.04, 0.0, 0.05);
          for (const y of [y0 + 0.15, y0 + h - 0.15]) fbox("timber", f, c, w / 2, y - 0.03, y + 0.03, 0.03, 0.07);
        }
      }
      if (flowers && !winter) flowerBox(fbox, f, u, w + 0.2, y0 - 0.08, 0.15);
    });
  };

  m.scope("windows and shutters", () => {
    const yl = P + 0.85, hl = 1.15;
    const yu = F + 0.75, hu = 1.05;
    // front: ground floor either side of the door, upper floor three across
    for (const s of [-1, 1]) window("front", s * 1.7, yl, 0.72, hl, true, false);
    if (two) {
      for (const s of [-1, 1]) window("front", s * 1.75, yu, 0.72, hu, false, balcony === "none");
      if (balcony === "none") window("front", 0, yu, 0.72, hu, false, true);
    } else {
      window("front", 0, E + 0.4, 0.6, 0.8, false, false, 0.05);
    }
    for (const f of ["right", "left"] as Face[]) {
      window(f, -0.9, yl, 0.72, hl, true, false);
      if (two) window(f, 0.9, yu, 0.72, hu, false, balcony !== "wrap");
    }
    for (const s of [-1, 1]) window("back", s * 1.3, yl, 0.72, hl, false, false);
    if (two) for (const s of [-1, 1]) window("back", s * 1.3, yu, 0.72, hu, false, false);
  });

  m.scope("plank door", () => {
    const y0 = P, h = 2.05, w = 1.0;
    fbox("accent", "front", 0, w, y0 - 0.02, y0 + h, -0.02, 0.04);
    for (const u of [-0.25, 0, 0.25]) fbox("timber", "front", u, 0.025, y0 + 0.05, y0 + 1.3, 0.03, 0.05);
    fbox("glass", "front", 0, 0.5, y0 + 1.42, y0 + 1.85, 0.02, 0.055);
    for (const s of [-1, 1]) fbox("timber", "front", s * (w / 2 + 0.05), 0.12, y0 - 0.02, y0 + h + 0.08, -0.02, 0.085);
    fbox("timber", "front", 0, w + 0.22, y0 + h - 0.02, y0 + h + 0.14, -0.02, 0.09);
    fbox("iron", "front", 0.33, 0.06, y0 + 1.0, y0 + 1.16, 0.03, 0.09);
    // the lantern beside the door
    fbox("iron", "front", 0.95, 0.06, y0 + 1.95, y0 + 2.0, -0.02, 0.25);
    fbox("iron", "front", 0.95, 0.18, y0 + 1.78, y0 + 1.8, 0.14, 0.34);
    fbox("glass", "front", 0.95, 0.14, y0 + 1.6, y0 + 1.78, 0.16, 0.32);
    fbox("iron", "front", 0.95, 0.2, y0 + 1.56, y0 + 1.6, 0.14, 0.34);
    if (p.entrance === "step") {
      m.box("stone", 0, D / 2 + 0.3, 1.6, 0.6, 0, P);
      m.box("stone", 0, D / 2 + 0.7, 1.6, 0.4, 0, P / 2);
      if (winter) m.box("snow", 0.5, D / 2 + 0.75, 0.5, 0.25, P / 2 - 0.02, P / 2 + 0.04);
    }
  });

  if (p.entrance === "porch") m.scope("porch", () => {
    const depth = balcony !== "none" ? 1.2 : 1.0;
    const z1 = D / 2 + depth;
    // a timber deck on stone, two posts and (without a balcony) its own little roof
    m.box("stone", 0, D / 2 + depth / 2, 2.4, depth, 0, P - 0.12);
    m.box("trim", 0, D / 2 + depth / 2 - 0.03, 2.5, depth + 0.1, P - 0.13, P - 0.02);
    m.box("stone", 0, z1 + 0.3, 1.2, 0.4, 0, (P - 0.12) / 2);
    const postTop = balcony !== "none" ? F - 0.04 : P + 2.6;
    for (const s of [-1, 1]) m.box("timber", s * 1.08, z1 - 0.12, 0.16, 0.16, P - 0.04, postTop);
    if (balcony === "none") {
      const y = P + 2.6, rise = 0.55, hw = 1.45;
      m.box("timber", 0, z1 - 0.12, 2.4, 0.16, y - 0.18, y + 0.02);
      for (const s of [-1, 1]) {
        m.slab("roof", [[0, y + rise + 0.12, D / 2 - 0.07], [s * hw, y + 0.12 - 0.08, D / 2 - 0.07], [s * hw, y + 0.12 - 0.08, z1 + 0.2], [0, y + rise + 0.12, z1 + 0.2]], [0, -0.12, 0]);
        if (winter) m.slab("snow", [[s * 0.01, y + rise + 0.2 - 0.01 * rise / hw, D / 2], [s * (hw - 0.05), y + 0.12 - 0.05 + 0.03, D / 2], [s * (hw - 0.05), y + 0.12 - 0.05 + 0.03, z1 + 0.14], [s * 0.01, y + rise + 0.2 - 0.01 * rise / hw, z1 + 0.14]], [0, -0.12, 0]);
      }
      m.slab("boards", [[-hw + 0.25, y + 0.02, z1 + 0.12], [hw - 0.25, y + 0.02, z1 + 0.12], [0, y + rise - 0.06, z1 + 0.12]], [0, 0, -0.06]);
    }
  });

  if (balcony !== "none") m.scope("balcony", () => {
    const out = 1.15;
    const deckY = F + 0.12;
    const zEdge = D / 2 + out;
    const wrap = balcony === "wrap";
    const x0 = wrap ? W / 2 + out : W / 2 - 0.35; // the front run's half width
    const zBack = -D / 2 + 0.7; // where a wrapped side run ends
    m.box("trim", 0, D / 2 + out / 2 - 0.025, 2 * x0, out + 0.05, F - 0.05, deckY);
    if (wrap) for (const s of [-1, 1]) m.box("trim", s * (W / 2 + out / 2 - 0.025), (zBack + D / 2) / 2, out + 0.05, D / 2 - zBack - 0.02, F - 0.05, deckY);
    // joists and brackets under the deck (the porch's posts carry it instead)
    const joist = (x: number) => {
      m.box("timber", x, D / 2 + out / 2 - 0.05, 0.14, out + 0.06, F - 0.24, F - 0.03);
      if (p.entrance === "porch" && Math.abs(x) < 1.3) return;
      const a: [number, number] = [D / 2 - 0.02, F - 1.05], b: [number, number] = [D / 2 + out - 0.2, F - 0.2];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nz = -(b[1] - a[1]) / len * 0.07, ny = (b[0] - a[0]) / len * 0.07;
      m.slab("timber", [[x - 0.06, a[1] + ny, a[0] + nz], [x - 0.06, b[1] + ny, b[0] + nz], [x - 0.06, b[1] - ny, b[0] - nz], [x - 0.06, a[1] - ny, a[0] - nz]], [0.12, 0, 0]);
    };
    for (const x of [-x0 + 0.25, -1.1, 1.1, x0 - 0.25]) if (!wrap || Math.abs(x) < W / 2) joist(x);
    if (wrap) for (const s of [-1, 1]) for (const z of [zBack + 0.3, 0.6]) {
      m.box("timber", s * (W / 2 + out / 2 - 0.05), z, out + 0.06, 0.14, F - 0.24, F - 0.03);
    }
    // a railing of sawn boards along a run from a to b (in plan)
    const run = (ax: number, az: number, bx: number, bz: number, flowers: boolean) => {
      const len = Math.hypot(bx - ax, bz - az);
      const ux = (bx - ax) / len, uz = (bz - az) / len;
      const along = Math.abs(ux) > 0.5;
      const rail = (y0: number, y1: number, t: number, mat = "trim") => {
        const l = mat === "snow" ? len - 0.06 : len;
        m.box(mat, (ax + bx) / 2, (az + bz) / 2, along ? l : t, along ? t : l, y0, y1);
      };
      rail(deckY + 0.1, deckY + 0.18, 0.06);
      rail(deckY + 0.92, deckY + 1.02, 0.12);
      if (winter) rail(deckY + 1.0, deckY + 1.07, 0.1, "snow");
      const n = Math.floor(len / 0.19);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) * (len / n);
        m.box("trim", ax + ux * t, az + uz * t, along ? 0.12 : 0.03, along ? 0.03 : 0.12, deckY - 0.02, deckY + 0.94);
      }
      if (flowers && !winter) {
        const ox = along ? 0 : Math.sign(ax) * 0.15, oz = along ? 0.15 : 0;
        for (let t = 0.6; t + 0.9 <= len; t += 1.4) {
          const cx = ax + ux * (t + 0.45) + ox, cz = az + uz * (t + 0.45) + oz;
          m.box("trim", cx, cz, along ? 0.9 : 0.2, along ? 0.2 : 0.9, deckY + 0.66, deckY + 0.88);
          for (let j = 0; j < 4; j++) {
            const bx2 = ax + ux * (t + 0.12 + j * 0.22) + ox, bz2 = az + uz * (t + 0.12 + j * 0.22) + oz;
            m.loft(j % 2 ? "flower" : "leaf", ring(0.11, bx2, bz2), deckY + 0.86, ring(0.15, bx2, bz2), deckY + 0.98, false);
            m.loft(j % 2 ? "flower" : "leaf", ring(0.15, bx2, bz2), deckY + 0.98, ring(0.08, bx2, bz2), deckY + 1.08);
          }
        }
      }
    };
    run(-x0 + 0.05, zEdge - 0.05, x0 - 0.05, zEdge - 0.05, true);
    if (wrap) for (const s of [-1, 1]) run(s * (x0 - 0.05), zEdge - 0.05, s * (x0 - 0.05), zBack + 0.05, true);
    else for (const s of [-1, 1]) run(s * (x0 - 0.05), zEdge - 0.05, s * (x0 - 0.05), D / 2, false);
    const corners: Array<[number, number]> = [[-x0 + 0.05, zEdge - 0.05], [x0 - 0.05, zEdge - 0.05]];
    if (wrap) corners.push([-x0 + 0.05, zBack + 0.05], [x0 - 0.05, zBack + 0.05]);
    for (const [x, z] of corners) m.box("timber", x, z, 0.13, 0.13, F - 0.05, deckY + 1.05);
    // the balcony door in the middle of the upper front
    fbox("glass", "front", 0, 0.82, deckY, deckY + 2.0, -0.02, 0.03);
    for (const s of [-1, 1]) fbox("timber", "front", s * 0.47, 0.1, deckY - 0.02, deckY + 2.08, -0.02, 0.075);
    fbox("timber", "front", 0, 1.04, deckY + 1.98, deckY + 2.1, -0.02, 0.07);
    fbox("timber", "front", 0, 0.8, deckY + 0.02, deckY + 0.8, -0.02, 0.05);
    fbox("timber", "front", 0, 0.06, deckY + 0.8, deckY + 1.99, -0.02, 0.05);
    fbox("timber", "front", 0, 0.8, deckY + 1.4, deckY + 1.46, -0.02, 0.05);
  });

  if (p.chimney === "stone") m.scope("stone chimney", () => {
    const x = 1.25, z = -0.9, top = R + 0.75;
    m.box("stone", x, z, 0.62, 0.62, roofTop(x + 0.31) - 0.5, top);
    m.box("block", x, z, 0.8, 0.8, top, top + 0.08);
    for (const s of [-1, 1]) m.box("stone", x + s * 0.2, z, 0.14, 0.5, top + 0.08, top + 0.3);
    m.box("block", x, z, 0.74, 0.74, top + 0.3, top + 0.36);
    if (winter) m.box("snow", x, z, 0.66, 0.66, top + 0.34, top + 0.44);
  });

  m.scope("woodpile", () => {
    // split logs stacked against the left wall under the eaves
    const r = 0.11, x0 = -W / 2 - 0.1, x1 = -W / 2 - 0.62;
    const sec = (z: number, y: number): Ring => Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2;
      return [z + r * Math.cos(a), y + r * Math.sin(a)] as [number, number];
    });
    for (let row = 0; row < 4; row++) for (let i = 0; i < 7 - (row % 2); i++) {
      const z = 0.45 + (row % 2) * r + i * 2.02 * r, y = r + row * 0.19;
      m.sweep("log", "x", sec(z, y), x1, sec(z, y), x0 + (i % 2) * 0.03);
    }
    m.box("timber", -W / 2 - 0.38, 0.45 + 6.1 * r, 0.7, 0.08, 0.01, 0.04);
    if (winter) m.box("snow", -W / 2 - 0.36, 0.45 + 6 * r, 0.62, 13 * r, 3 * 0.19 + 2 * r - 0.05, 3 * 0.19 + 2 * r + 0.03);
  });
  return m;
}

/** An octagon-ish ring for the flower blobs. */
function ring(r: number, cx: number, cz: number): Ring {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return [cx + r * Math.cos(a), cz + r * Math.sin(a)] as [number, number];
  });
}

/** A rounded pillow of snow lying along z on the eave at (x, y), drooping outward (side s). */
function pillow(m: MeshBuilder, x: number, y: number, z0: number, z1: number, s: number): void {
  const sec = (scale: number): Ring => [
    [x - s * 0.22 * scale, y - 0.02], [x + s * 0.02, y - 0.13 * scale], [x + s * 0.2 * scale, y - 0.08 * scale],
    [x + s * 0.24 * scale, y + 0.03 * scale], [x + s * 0.08 * scale, y + 0.11 * scale], [x - s * 0.18 * scale, y + 0.07 * scale],
  ].map(([a, b]) => [a!, b!] as [number, number]);
  const t = Math.min(0.28, (z1 - z0) / 3);
  m.sweep("snow", "z", sec(0.35), z0, sec(1), z0 + t);
  m.sweep("snow", "z", sec(1), z0 + t, sec(1), z1 - t, false);
  m.sweep("snow", "z", sec(1), z1 - t, sec(0.35), z1);
}

type FBox = (mat: string, f: Face, u: number, w: number, y0: number, y1: number, out0: number, out1: number) => void;

/** A window box of geraniums hung under a sill. */
function flowerBox(fbox: FBox, f: Face, u: number, w: number, y: number, out: number): void {
  fbox("trim", f, u, w, y - 0.22, y - 0.02, 0.02, out + 0.2);
  const n = Math.max(2, Math.round(w / 0.24));
  for (let i = 0; i < n; i++) {
    const t = u - w / 2 + (i + 0.5) * (w / n);
    fbox(i % 2 ? "leaf" : "flower", f, t, w / n - 0.02, y - 0.04, y + 0.12, out + 0.04, out + 0.18);
  }
}
