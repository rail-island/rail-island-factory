// The container, flat, sliding-wall and covered hopper wagons transferred from
// vlakosimdb, and (from hopperWagons.ts) the open hoppers -- seven designs:
//
//   veh-sqns-container-wagon      n_sqns, n_sqns-full#1           `cargo`: empty, maersk
//   veh-pao-flat-wagon            n_pao-full#1, n_pao-full#2      `cargo`: empty, tubes
//   veh-habis-sliding-wall-wagon  n_habis_tw1, n_habis_tw2        `livery`: tw1, tw2
//   veh-hadgs-hopper-wagon        n_hadgs                         fixed
//   veh-faccs-hopper-wagon        n_faccs, viamont_faccs          `livery`: cd, viamont
//   veh-falls-hopper-wagon        n_falls, sd_falls, viamont_falls `livery`: cd, sd, viamont
//   veh-wap-hopper-wagon          n_wap-full#2                    fixed (loaded)
//
// Each follows its simplemodel's XML clip shapes and the native BMPs at 0.1 m a
// pixel (assets/wagon-<name>/native/<key>/landmarks.json). Source coordinates
// are the JT7 ones: x along the wagon from 0, y up from the rail, +z the side
// the native z_dec (or the sixth colorize direction) paints; the model is
// (x - centre, y, z) with the centre midway between the buffer heads.
// See docs/models/freight-wagons.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { GameProperties, ParamSpec, ParamValues, ProceduralDesign } from "./design.ts";
import { resolveParams } from "./design.ts";
import { WAGON_CATALOG } from "./wagons.ts";
import { Wagon } from "./wagonParts.ts";
import { FREIGHT_NUMBERS, boldText, clipSolid, container40, maerskStar, numberLines, type Pt } from "./freightWagonParts.ts";
import { faccsHopperWagon, fallsHopperWagon, wapHopperWagon, FACCS_PARAMS, FALLS_PARAMS } from "./hopperWagons.ts";
import { WAP_PARAMS } from "./hopperWagons.ts";

export { faccsHopperWagon, fallsHopperWagon, wapHopperWagon } from "./hopperWagons.ts";


export const SQNS_PARAMS: readonly ParamSpec[] = [
  { name: "cargo", title: "Cargo", default: "empty", values: [{ value: "empty", title: "Empty" }, { value: "maersk", title: "Maersk" }] },
];
export const PAO_PARAMS: readonly ParamSpec[] = [
  { name: "cargo", title: "Cargo", default: "tubes", values: [{ value: "empty", title: "Empty" },{ value: "tubes", title: "Steel tubes" }] },
];
export const HABIS_PARAMS: readonly ParamSpec[] = [
  { name: "livery", title: "Livery", default: "tw1", values: [{ value: "tw1", title: "Grey" }, { value: "tw2", title: "Brown" }] },
];

const sideName = (s: number) => (s > 0 ? "right side" : "left side");
const endName = (e: number) => (e > 0 ? "front end" : "rear end");

/** The materials the container, flat and sliding-wall wagons share; a wagon adds its own paint. */
const FREIGHT_PALETTE: Record<string, MaterialSpec> = {
  pin: { color: "#bfb340", roughness: 0.5 },
  container: { color: "#b8b6b4", metallic: 0.15, roughness: 0.55 },
  containerRib: { color: "#c9c7c5", metallic: 0.15, roughness: 0.55 },
  containerFrame: { color: "#9a9896", metallic: 0.2, roughness: 0.55 },
  maerskBlue: { color: "#8fa8c2", roughness: 0.5 },
  ink: { color: "#141414", roughness: 0.6 },
  tyre: { color: "#2a2a2c", roughness: 0.9 },
};

// --- the Sqns container wagon ----------------------------------------------------------

const SQNS_PALETTE: Record<string, MaterialSpec> = {
  ...FREIGHT_PALETTE,
  frame: { color: "#6f2f20", roughness: 0.7 },
  frameLight: { color: "#90473f", roughness: 0.7 },
  frameDark: { color: "#50271f", roughness: 0.75 },
};

/** The container pins (XML base2 1.2..1.3 m): source x of each 0.2 m pin pair, end beams included. */
export const SQNS_PINS = [0.5, 3.6, 6.7, 9.8, 12.9, 16.0, 19.1];
/** The cross members (XML alongy base;base2): x0..x1 of each. */
const SQNS_CROSS: Pt[] = [[2.0, 2.2], [3.6, 3.8], [6.7, 6.9], [9.8, 10.0], [12.9, 13.1], [16.0, 16.2], [17.6, 17.8]];

/** The Sqns 60 ft container wagon (vlakosimdb n_sqns, n_sqns-full#1). */
export function sqnsContainerWagon(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(SQNS_PARAMS, params);
  const c = new Wagon(SQNS_PALETTE, 9.9);
  const m = c.m;
  m.scope("frame", () => {
    for (const s of [1, -1])
      m.scope(sideName(s), () => {
        // the side beam 0.9..1.2 m, its lighter bottom flange, and the fishbelly 4.7..15.1 down to 0.5 m (XML alongz)
        m.scope("side beam", () => c.sideBox("frame", s, 0.7, 19.1, 0.95, 1.2, 1.3, 1.5));
        m.scope("flange", () => c.sideBox("frameLight", s, 0.7, 19.1, 0.9, 0.95, 1.3, 1.5));
        m.scope("fishbelly", () => c.sideSweep("frame", [[4.7, 0.9], [6.3, 0.5], [13.4, 0.5], [15.1, 0.9]], ...(s > 0 ? [1.34, 1.42] : [-1.42, -1.34]) as [number, number]));
        m.scope("lower flange", () => c.sideBox("frameLight", s, 6.3, 13.4, 0.49, 0.56, 1.3, 1.46));
        m.scope("pins", () => SQNS_PINS.forEach((x, i) => m.scope(`pin ${i + 1}`, () => c.sideBox("pin", s, x, x + 0.2, 1.2, 1.3, 1.3, 1.5))));
        // the yellow handbrake wheel on the fishbelly (native columns 60..64)
        m.scope("handbrake", () => {
          const wheel = ngon(10, 0.25, 0, c.X(6.25), 0.75);
          m.sweep("pin", "z", wheel, s > 0 ? 1.43 : -1.47, wheel, s > 0 ? 1.47 : -1.43);
        });
        const x0 = s > 0 ? 8.3 : 11.5;
        m.scope("running number", () => c.letters(s, 1.425, x0, numberLines(FREIGHT_NUMBERS.sqns.number, "\u010cD", 0.62, 0.08)));
      });
    m.scope("centre sill", () => c.box("frameDark", 0.7, 19.1, 0.8, 1.15, -0.12, 0.12));
    m.scope("cross members", () => SQNS_CROSS.forEach(([a, b]) => c.box("frameDark", a, b, 1.0, 1.15, -1.3, 1.3)));
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0, 0.5, 0.7, 0.85, 1.2, 1.5, "frame") : c.drawGear(1, 19.8, 19.3, 19.1, 0.85, 1.2, 1.5, "frame")));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(2.75, 1.8));
    m.scope("bogie 2", () => c.freightBogie(17.05, 1.8));
  });
  if (cargo === "maersk")
    m.scope("cargo", () => {
      // a 40 ft Maersk box on the pins: the star square at the low-x end of the +z side, MAERSK beside it (native z_dec/z_inc)
      const box = container40(c, 9.9, 1.3);
      for (const s of [1, -1])
        m.scope(`${sideName(s)} livery`, () => {
          const face = box.half + 0.012;
          maerskStar(c, s, face, s > 0 ? 5.45 : 14.25, 1.3 + 1.35, 1.45);
          m.scope("lettering", () => boldText(c, "ink", s, face + 0.004, s > 0 ? 10.65 : 9.05, 2.1, "MAERSK", 0.97, 0.98, 0.29, 0.18));
        });
    });
  return m;
}

// --- the Pao flat wagon -------------------------------------------------------------

const PAO_PALETTE: Record<string, MaterialSpec> = {
  ...FREIGHT_PALETTE,
  frame: { color: "#252c35", roughness: 0.75 },
  frameLight: { color: "#303f4f", roughness: 0.7 },
  deck: { color: "#505750", roughness: 0.9 },
  plankGap: { color: "#2f2f2f", roughness: 0.9 },
  bolster: { color: "#709880", roughness: 0.85 },
  tube: { color: "#7f6a1c", metallic: 0.25, roughness: 0.5 },
  tubeDark: { color: "#6d3d0c", metallic: 0.25, roughness: 0.5 },
  bore: { color: "#2b2420", roughness: 0.7 },
};

/** The Pao flat wagon with a load (vlakosimdb n_pao-full#1, n_pao-full#2). */
export function paoFlatWagon(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(PAO_PARAMS, params);
  const c = new Wagon(PAO_PALETTE, 7.65);
  const m = c.m;
  m.scope("frame", () => {
    m.scope("deck", () => {
      c.box("deck", 0.5, 14.8, 1.1, 1.2, -1.45, 1.45);
      // the gaps between the deck's transverse planks (native y_dec: every 0.4 m from column 8)
      for (let k = 0; k < 35; k++) c.box("plankGap", 0.8 + k * 0.4, 0.9 + k * 0.4, 1.2, 1.203, -1.43, 1.43);
    });
    for (const s of [1, -1])
      m.scope(sideName(s), () => {
        m.scope("solebar", () => c.sideBox("frame", s, 0.5, 14.8, 0.7, 1.1, 1.36, 1.5));
        m.scope("deck edge", () => c.sideBox("frameLight", s, 0.5, 14.8, 1.1, 1.2, 1.45, 1.5));
        // the fishbelly 3.8..11.5 m down to 0.5 m (XML alongz base)
        m.scope("fishbelly", () => c.sideSweep("frame", [[3.8, 0.7], [4.9, 0.5], [10.4, 0.5], [11.5, 0.7]], ...(s > 0 ? [1.36, 1.46] : [-1.46, -1.36]) as [number, number]));
        // the stake pockets along the solebar
        m.scope("stake pockets", () => {
          for (let k = 0; k < 6; k++) c.sideBox("frameLight", s, 1.9 + k * 2.3, 2.05 + k * 2.3, 0.85, 1.1, 1.5, 1.54);
        });
        m.scope("running number", () => c.letters(s, 1.506, 7.7, numberLines(FREIGHT_NUMBERS.pao.number, "\u010cD", 0.74, 0.07)));
      });
    m.scope("centre sill", () => c.box("frame", 0.6, 14.7, 0.65, 1.1, -0.25, 0.25));
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0, 0.45, 0.5, 0.8, 1.19, 1.45, "frame") : c.drawGear(1, 15.3, 14.85, 14.8, 0.8, 1.19, 1.45, "frame")));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(2.6, 1.9));
    m.scope("bogie 2", () => c.freightBogie(12.7, 1.9));
  });
  if (cargo === "tubes")
    m.scope("cargo", () => {
      // two timber bolsters (XML `load` 3.8..4.8 and 10.5..11.5, 1.2..1.4 m) under a bundle of 21 tubes, 2.8..12.5 m up to 1.7 m
      m.scope("bolsters", () => {
        ([[3.8, 4.8], [10.5, 11.5]] as Pt[]).forEach(([x0, x1], i) => m.scope(`bolster ${i + 1}`, () => c.sideSweep("bolster", [[x0, 1.205], [x1, 1.205], [x1, 1.4], [x0, 1.4]], -1.25, 1.25)));
      });
      m.scope("tubes", () => {
        const r = 0.06;
        [8, 7, 6].forEach((count, layer) => {
          for (let k = 0; k < count; k++) {
            const z = (k - (count - 1) / 2) * 2 * r;
            const y = 1.4 + r + layer * r * Math.sqrt(3);
            c.tube((k + layer) % 3 ? "tube" : "tubeDark", "bore", 2.8 + (k % 2) * 0.02, 12.5 - ((k + 1) % 2) * 0.02, z, y, r, 0.012, 8);
          }
        });
      });
    });
  return m;
}

// --- the Habis sliding-wall wagon -----------------------------------------------------

/** The Habis liveries: walls, the light top band and roof, posts, the underframe and the name plate. */
const HABIS_LIVERIES: Record<string, Record<string, MaterialSpec>> = {
  tw1: {
    wall: { color: "#6f5f5f", roughness: 0.6 },
    post: { color: "#8f7f70", roughness: 0.6 },
    band: { color: "#b0a99f", roughness: 0.6 },
    roof: { color: "#909080", roughness: 0.65 },
    frame: { color: "#6f3730", roughness: 0.75 },
    frameDark: { color: "#50282f", roughness: 0.8 },
    plate: { color: "#c0b060", roughness: 0.55 },
    label: { color: "#cfc0b0", roughness: 0.6 },
  },
  tw2: {
    wall: { color: "#4a3929", roughness: 0.75 },
    post: { color: "#5a4a39", roughness: 0.75 },
    band: { color: "#735242", roughness: 0.75 },
    roof: { color: "#634a31", roughness: 0.8 },
    frame: { color: "#522929", roughness: 0.8 },
    frameDark: { color: "#3a1c1c", roughness: 0.85 },
    plate: { color: "#9c8c84", roughness: 0.7 },
    label: { color: "#b8b0a8", roughness: 0.7 },
  },
};

/** The Habis section: the sliding walls at |z| 1.5 from 1.1 to 3.2 m, then the roof to 4.1 m (XML `base2`). */
const HABIS_WALLS: Pt[] = [[-1.5, 1.1], [1.5, 1.1], [1.5, 3.2], [-1.5, 3.2]];
const HABIS_ROOF: Pt[] = [[-1.5, 3.2], [1.5, 3.2], [1.3, 3.6], [0.5, 4.1], [-0.5, 4.1], [-1.3, 3.6]];
/** The wall posts (XML `base2` 0.1 m bars): source x of each, both halves. */
const HABIS_POSTS = [1.6, 2.7, 3.8, 4.9, 6.0, 7.1, 8.2, 9.3, 10.4, 12.7, 13.8, 14.9, 16.0, 17.1, 18.2, 19.3, 20.4, 21.5];

/** The Habis two-part sliding-wall wagon (vlakosimdb n_habis_tw1, n_habis_tw2). */
export function habisSlidingWallWagon(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(HABIS_PARAMS, params);
  const c = new Wagon({ ...FREIGHT_PALETTE, ...HABIS_LIVERIES[livery]! }, 11.6);
  const m = c.m;
  m.scope("body", () => {
    // the two halves of each side are one sliding wall each: 0.5..11.5 and 11.7..22.7, the centre post between them
    for (const [i, [x0, x1]] of ([[0.5, 11.5], [11.7, 22.7]] as Pt[]).entries())
      m.scope(`wall ${i + 1}`, () => clipSolid(c, "wall", { section: HABIS_WALLS, elevation: [[x0, 1.1], [x1, 1.1], [x1, 3.2], [x0, 3.2]] }, (n) => n[1] < 0.999));
    m.scope("centre post", () => c.box("frameDark", 11.5, 11.7, 1.1, 3.2, -1.46, 1.46));
    m.scope("roof", () => clipSolid(c, "roof", { section: HABIS_ROOF, elevation: [[0.5, 3.2], [22.7, 3.2], [22.7, 4.1], [0.5, 4.1]] }, (n) => n[1] > -0.999));
    m.scope("ridge", () => c.box("frame", 0.6, 22.6, 4.1, 4.3, -0.4, 0.4));
    for (const s of [1, -1])
      m.scope(sideName(s), () => {
        // the light top rail and the bottom rail of the walls (native rows 14..17 and 37..38)
        m.scope("top rail", () => c.sideBox("band", s, 0.52, 22.68, 3.2, 3.32, 1.49, 1.52));
        m.scope("bottom rail", () => c.sideBox("post", s, 0.52, 22.68, 1.12, 1.3, 1.49, 1.52));
        m.scope("posts", () => HABIS_POSTS.forEach((x) => c.sideBox("post", s, x, x + 0.1, 1.3, 3.2, 1.49, 1.515)));
        // TRANSWAGGON on its plate mid-wagon (native columns 87..143, rows 23..29)
        m.scope("name plate", () => {
          c.sideBox("plate", s, s > 0 ? 8.7 : 8.6, s > 0 ? 14.6 : 14.5, 2.0, 2.7, 1.5, 1.525);
          boldText(c, "ink", s, 1.529, s > 0 ? 11.65 : 11.55, 2.12, "TRANSWAGGON", 0.44, 0.37, 0.13, 0.07);
        });
        // the label boards and the black data panel at the -x end of the +z side, the +x end of the -z side
        m.scope("label board", () => {
          const [a, b] = s > 0 ? [0.7, 1.9] : [21.0, 22.5];
          c.sideBox("label", s, a, b, 1.33, 3.1, 1.5, 1.522);
        });
        m.scope("data panel", () => {
          const [d0, d1] = s > 0 ? [1.8, 3.4] : [19.8, 21.4];
          c.sideBox("ink", s, d0, d1, 1.22, 1.6, 1.505, 1.527);
        });
        m.scope("running number", () => c.letters(s, 1.523, s > 0 ? 4.4 : 18.8, numberLines(FREIGHT_NUMBERS.habis.number, "MAV", 1.42, 0.08)));
      });
    // the end frames (XML `front`: 0.3..0.6 and 22.6..22.9 up to 4.3 m), narrowing above
    for (const e of [-1, 1])
      m.scope(`${endName(e)} frame`, () => {
        const [x0, x1] = e < 0 ? [0.3, 0.5] : [22.7, 22.9];
        // the section narrows to 0.8 m at 3.6 m and runs up straight: two convex pieces
        clipSolid(c, "frame", { section: [[-0.7, 1.1], [0.7, 1.1], [0.4, 3.6], [-0.4, 3.6]], elevation: [[x0, 1.1], [x1, 1.1], [x1, 3.6], [x0, 3.6]] }, (n) => n[1] < 0.999);
        clipSolid(c, "frame", { section: [[-0.4, 3.6], [0.4, 3.6], [0.4, 4.3], [-0.4, 4.3]], elevation: [[x0, 3.6], [x1, 3.6], [x1, 4.3], [x0, 4.3]] }, (n) => n[1] > -0.999);
      });
  });
  m.scope("underframe", () => {
    m.scope("frame", () => c.box("frame", 0.5, 22.7, 0.8, 1.1, -1.45, 1.45));
    for (const s of [1, -1]) m.scope(`${sideName(s)} fishbelly`, () => c.sideSweep("frame", [[5.2, 0.8], [6.1, 0.3], [17.0, 0.3], [18.0, 0.8]], ...(s > 0 ? [1.3, 1.4] : [-1.4, -1.3]) as [number, number]));
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0, 0.5, 0.6, 0.8, 1.1, 1.45, "frame") : c.drawGear(1, 23.2, 22.7, 22.6, 0.8, 1.1, 1.45, "frame")));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(2.85, 1.8));
    m.scope("bogie 2", () => c.freightBogie(20.45, 1.8));
  });
  return m;
}

// --- the Hadgs covered hopper ----------------------------------------------------------

const HADGS_PALETTE: Record<string, MaterialSpec> = {
  ...FREIGHT_PALETTE,
  body: { color: "#733929", roughness: 0.7 },
  rib: { color: "#8c4231", roughness: 0.7 },
  ribShade: { color: "#4a2118", roughness: 0.75 },
  roof: { color: "#b5735a", roughness: 0.65 },
  frame: { color: "#3a2a24", roughness: 0.8 },
  handle: { color: "#e1e100", roughness: 0.5 },
  wheelRed: { color: "#c42a20", roughness: 0.5 },
};

/** The Hadgs body (XML `base`, its notch under the sills left to the sills): section (z, y). */
const HADGS_SECTION: Pt[] = [[-1.45, 1.0], [1.45, 1.0], [1.45, 3.7], [1.27, 3.9], [0.7, 4.2], [0.2, 4.3], [-0.2, 4.3], [-0.7, 4.2], [-1.27, 3.9], [-1.45, 3.7]];
/** The side posts outside the doors (native z_both columns 3, 16, 66..103, 151, 164: a light and a dark column each), source x. */
const HADGS_RIBS = [0.32, 1.6, 6.6, 7.2, 7.8, 8.5, 9.1, 9.7, 10.3, 15.1, 16.38];
/** The two sliding doors (XML `door`, x0..x1). */
const HADGS_DOORS: Pt[] = [[3.0, 6.0], [10.8, 13.8]];

/** The Hadgs covered grain hopper with sliding doors (vlakosimdb n_hadgs). */
export function hadgsHopperWagon(): MeshBuilder {
  const c = new Wagon(HADGS_PALETTE, 8.4);
  const m = c.m;
  m.scope("body", () => {
    // the body colour up to the roof's shoulder at 3.9 m, the roof colour above it (native rows 1..3)
    const elevation: Pt[] = [[0.3, 1.0], [16.5, 1.0], [16.5, 4.3], [0.3, 4.3]];
    m.scope("shell", () => clipSolid(c, "body", { section: HADGS_SECTION.filter(([, y]) => y <= 3.9), elevation }, (n) => n[1] < 0.999));
    // the roof colour stops 0.2 m short of the -x end and 0.1 m of the +x end, as the BMP paints it
    const roof = HADGS_SECTION.filter(([, y]) => y >= 3.9);
    const piece = (x0: number, x1: number): Pt[] => [[x0, 3.9], [x1, 3.9], [x1, 4.3], [x0, 4.3]];
    m.scope("roof", () => clipSolid(c, "roof", { section: roof, elevation: piece(0.5, 16.4) }, (n) => n[1] > -0.999 && Math.abs(n[0]) < 0.999));
    m.scope("roof ends", () => {
      clipSolid(c, "body", { section: roof, elevation: piece(0.3, 0.5) }, (n) => n[1] > -0.999 && n[0] < 0.999);
      clipSolid(c, "body", { section: roof, elevation: piece(16.4, 16.5) }, (n) => n[1] > -0.999 && n[0] > -0.999);
    });
    m.scope("roof hatches", () => {
      for (const x of [2.2, 5.6, 9.0, 12.4]) c.box("rib", x, x + 1.8, 4.27, 4.33, -0.35, 0.35);
    });
    for (const s of [1, -1])
      m.scope(sideName(s), () => {
        // the posts between the door rails stop at the rails
        m.scope("ribs", () => HADGS_RIBS.forEach((x, i) => m.scope(`rib ${i + 1}`, () => (x >= 3.0 && x < 13.8 ? c.sideBox("rib", s, x, x + 0.1, 1.1, 3.6, 1.44, 1.48) : c.sideBox("rib", s, x, x + 0.1, 1.0, 3.7, 1.44, 1.48)))));
        m.scope("sills", () => {
          c.sideBox("body", s, 0.3, 16.5, 0.8, 1.0, 1.4, 1.5);
          for (const [x0, x1] of [[3.0, 5.0], [11.8, 13.8]] as Pt[]) c.sideBox("body", s, x0, x1, 0.7, 0.8, 1.4, 1.5);
        });
        m.scope("door rails", () => {
          c.sideBox("ribShade", s, 3.0, 13.8, 1.0, 1.1, 1.45, 1.54);
          c.sideBox("ribShade", s, 3.0, 13.8, 3.6, 3.7, 1.45, 1.54);
        });
        HADGS_DOORS.forEach(([x0, x1], i) =>
          m.scope(`door ${i + 1}`, () => {
            m.scope("leaf", () => c.sideBox("body", s, x0, x1, 1.1, 3.6, 1.47, 1.52));
            // the leaf's five stiffeners every 0.7 m (native columns 31..59, 109..137) and its top rail
            m.scope("frame", () => {
              for (let k = 0; k < 5; k++) m.scope(`stiffener ${k + 1}`, () => c.sideBox("rib", s, x0 + 0.08 + k * 0.7, x0 + 0.16 + k * 0.7, 1.1, 3.6, 1.52, 1.53));
              c.sideBox("rib", s, x0, x1, 3.5, 3.6, 1.52, 1.53);
            });
            // the inverted-V braces of each leaf half (native columns 30..45 and 95..110)
            m.scope("braces", () => {
              const z = s * 1.526;
              for (const [a, b] of [[x0 + 0.16, x0 + 1.48], [x0 + 1.56, x0 + 2.88]] as Pt[]) {
                const mid = (a + b) / 2;
                const bar = (xa: number, ya: number, xb: number, yb: number): Vec3[] => {
                  const [dx, dy] = [xb - xa, yb - ya];
                  const l = Math.hypot(dx, dy);
                  const [nx, ny] = [(-dy / l) * 0.04, (dx / l) * 0.04];
                  const q: Vec3[] = [[c.X(xa + nx), ya + ny, z], [c.X(xa - nx), ya - ny, z], [c.X(xb - nx), yb - ny, z], [c.X(xb + nx), yb + ny, z]];
                  return [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!];
                };
                m.facets("ribShade", [...bar(a + 0.05, 1.2, mid, 3.4), ...bar(mid, 3.4, b - 0.05, 1.2)], [0, 0, s]);
              }
            });
            m.scope("handle", () => c.sideBox("handle", s, x1 - 0.35, x1 - 0.25, 2.0, 2.3, 1.53, 1.545));
          }),
        );
        m.scope("running number", () => c.letters(s, 1.481, s > 0 ? 1.0 : 15.8, numberLines(FREIGHT_NUMBERS.hadgs.number, "ČD", 2.0, 0.08)));
      });
    // the end walls' X braces (native x_both)
    for (const e of [-1, 1])
      m.scope(`${endName(e)} braces`, () => {
        const x = e < 0 ? 0.3 - 0.02 : 16.5 + 0.02;
        const bar = (za: number, ya: number, zb: number, yb: number): Vec3[] => {
          const [dz, dy] = [zb - za, yb - ya];
          const l = Math.hypot(dz, dy);
          const [nz, ny] = [(-dy / l) * 0.05, (dz / l) * 0.05];
          const q: Vec3[] = [[c.X(x), ya + ny, za + nz], [c.X(x), ya - ny, za - nz], [c.X(x), yb - ny, zb - nz], [c.X(x), yb + ny, zb + nz]];
          return [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!];
        };
        m.facets("ribShade", [...bar(-1.3, 3.5, 0, 1.2), ...bar(0, 1.2, 1.3, 3.5)], [e, 0, 0]);
        for (const z of [-0.85, 0.85]) c.box("rib", e < 0 ? 0.24 : 16.505, e < 0 ? 0.295 : 16.56, 1.0, 3.7, z - 0.05, z + 0.05);
      });
  });
  m.scope("underframe", () => {
    m.scope("frame", () => c.box("frame", 0.35, 16.45, 0.65, 1.0, -1.35, 1.35));
    m.scope("brake gear", () => {
      c.box("frame", 8.0, 8.8, 0.5, 0.65, -0.9, 0.9);
      c.box("frame", 10.5, 11.2, 0.5, 0.65, -0.9, 0.9);
      // the red handbrake wheel at the -x end of the +z side (native columns 63..67)
      const wheel = ngon(12, 0.18, 0, c.X(6.6), 0.78);
      m.sweep("wheelRed", "z", wheel, 1.505, wheel, 1.54);
    });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0, 0.2, 0.3, 0.8, 1.1, 1.45, "frame") : c.drawGear(1, 16.8, 16.6, 16.5, 0.8, 1.1, 1.45, "frame")));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(2.9, 1.8));
    m.scope("bogie 2", () => c.freightBogie(13.8, 1.8));
  });
  return m;
}

/** A wagon design: id, title, builder, parameters and its reference folder (assets/<folder>/). */
interface FreightDesign {
  id: string;
  title: string;
  folder: string;
  build: (params?: ParamValues) => MeshBuilder;
  params?: readonly ParamSpec[];
  /** What the game needs of it beyond its geometry (design.ts GameProperties). */
  game: GameProperties;
}

const DESIGNS: readonly FreightDesign[] = [
  { id: "proc-vehicle-sqns-container-wagon", game: { weight: 25, power: 0, maxspeed: 120, accel: null, variants: [{ params: { cargo: "maersk" }, weight: 50 }] }, title: "Sqns Container Wagon", folder: "wagon-sqns", build: sqnsContainerWagon, params: SQNS_PARAMS },
  { id: "proc-vehicle-pao-flat-wagon", game: { weight: 22, power: 0, maxspeed: 120, accel: null, variants: [{ params: { cargo: "empty" }, weight: 20 }] }, title: "Pao Flat Wagon", folder: "wagon-pao", build: paoFlatWagon, params: PAO_PARAMS },
  { id: "proc-vehicle-habis-sliding-wall-wagon", game: { weight: 50, power: 0, maxspeed: 160, accel: null }, title: "Habis Sliding-Wall Wagon", folder: "wagon-habis", build: habisSlidingWallWagon, params: HABIS_PARAMS },
  { id: "proc-vehicle-hadgs-hopper-wagon", game: { weight: 25, power: 0, maxspeed: 120, accel: null }, title: "Hadgs Covered Hopper Wagon", folder: "wagon-hadgs", build: hadgsHopperWagon },
  { id: "proc-vehicle-faccs-hopper-wagon", game: { weight: 38, power: 0, maxspeed: 90, accel: null }, title: "Faccs Hopper Wagon", folder: "wagon-faccs", build: faccsHopperWagon, params: FACCS_PARAMS },
  { id: "proc-vehicle-falls-hopper-wagon", game: { weight: 37, power: 0, maxspeed: 90, accel: null }, title: "Falls Hopper Wagon", folder: "wagon-falls", build: fallsHopperWagon, params: FALLS_PARAMS },
  { id: "proc-vehicle-wap-hopper-wagon", game: { weight: 60, power: 0, maxspeed: 90, accel: null, variants: [{ params: { cargo: "empty" }, weight: 37 }] }, title: "Wap Hopper Wagon", folder: "wagon-wap", build: wapHopperWagon, params: WAP_PARAMS },
];

/** Every freight wagon design of this family, in catalog order. The ids are stored in saved maps. */
export const FREIGHT_WAGONS: readonly ProceduralDesign[] = DESIGNS.map((w) => ({
  id: w.id,
  title: w.title,
  build: w.build,
  game: w.game,
  catalog: WAGON_CATALOG,
  references: w.folder,
  ...(w.params ? { params: w.params } : {}),
}));

