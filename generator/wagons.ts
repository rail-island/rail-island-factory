// The freight wagons transferred from vlakosimdb: five designs, three of them
// parametric by their load. Each follows its simplemodel's XML clip shapes
// (alongx sections, alongy plans, alongz elevations) and the native BMPs at
// 0.1 m a pixel (assets/wagon-<name>/native/<key>/landmarks.json):
//
//   veh-nas-flat-wagon     n_nas, n_nas-full#1..#3   `cargo`: empty, wood, tubes, reels
//   veh-ua-open-wagon      n_ua-empty, n_ua#1..#3    `cargo`: empty, coal, wood, sand
//   veh-eas-open-wagon     n_eas, n_eas-drevo, -uhlo `cargo`: empty, wood, coal
//   veh-raj-hopper-wagon   n_raj                     fixed
//   veh-rah-tank-wagon     n_rah#1                   fixed
//
// Source coordinates are the JT7 ones: x along the wagon from 0, y up from the
// rail, +z the z_dec side; the model is (x - centre, y, z) with the centre midway
// between the buffer heads. See docs/models/wagons.md.

import { ngon, rect, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { CatalogFields, GameProperties, ParamSpec, ParamValues } from "./design.ts";
import { resolveParams } from "./design.ts";
import { Wagon } from "./wagonParts.ts";
import { strokeText } from "./strokeFont.ts";

/** The game-catalog fields of the wagons: rail vehicles in their own `wagon` group. */
export const WAGON_CATALOG: CatalogFields = {
  category: "Rail vehicles",
  group: "wagon",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/**
 * The running number each wagon carries on its sides: 12-digit UIC numbers with
 * their check digit, and where the number came from. See the wagons' SOURCES.md.
 */
export const WAGON_NUMBERS = {
  nas: { number: "31 54 4870 116-1", source: "illustrative: the native lettering is not legible; UIC format of a CD flat wagon" },
  ua: { number: "21 54 5352 118-3", source: "illustrative: the native lettering is not legible; UIC format of a CD open wagon" },
  eas: { number: "21 54 5927 504-0", source: "read from the native z_dec.bmp (21 RIV / 54 CD / 592 7 504-1); the printed check digit 1 does not verify, corrected to 0" },
  raj: { number: "31 54 0835 102-3", source: "illustrative: the native lettering is not legible; UIC format of a CD hopper wagon" },
  rah: { number: "33 54 7921 779-6", source: "read from the native z_dec.bmp (33 RIV / 54 CPAV / 792 1 779-0); the printed check digit 0 does not verify, corrected to 6" },
} as const;

const cargoParam = (values: Array<[string, string]>): readonly ParamSpec[] => [
  { name: "cargo", title: "Cargo", default: "empty", values: values.map(([value, title]) => ({ value, title })) },
];

export const NAS_PARAMS = cargoParam([["empty", "Empty"], ["wood", "Logs"], ["tubes", "Steel tubes"], ["reels", "Cable reels"]]);
export const UA_PARAMS = cargoParam([["empty", "Empty"], ["coal", "Coal"], ["wood", "Logs"], ["sand", "Sand"]]);
export const EAS_PARAMS = cargoParam([["empty", "Empty"], ["wood", "Logs"], ["coal", "Coal"]]);

const lerp = (pts: Array<[number, number]>, x: number): number => {
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [xa, ya] = pts[i - 1]!;
    const [xb, yb] = pts[i]!;
    if (x <= xb) return ya + ((x - xa) / (xb - xa)) * (yb - ya);
  }
  return pts[pts.length - 1]![1];
};

const sideName = (s: number) => (s > 0 ? "right side" : "left side");
const endName = (e: number) => (e > 0 ? "front end" : "rear end");

/** The UIC number in the three painted lines of the native lettering: exchange code, country and keeper, number. */
function numberLines(number: string, keeper: string, y: number, h: number, pitch = h * 1.6): Array<{ text: string; y: number; h: number }> {
  const [code, country, type, serial] = number.split(" ") as [string, string, string, string];
  return [
    { text: `${code} RIV`, y: y + 2 * pitch, h },
    { text: `${country} ${keeper}`, y: y + pitch, h },
    { text: `${type.slice(0, 3)} ${type.slice(3)} ${serial}`, y, h },
  ];
}

// --- the open wagons: Eas and Ua ---------------------------------------------------

const EAS_PALETTE: Record<string, MaterialSpec> = {
  body: { color: "#6f2302", roughness: 0.7 },
  bodyDark: { color: "#541a01", roughness: 0.75 },
  bodyLight: { color: "#822802", roughness: 0.7 },
  inside: { color: "#5a1d02", roughness: 0.85 },
  doorFrame: { color: "#3e2f24", roughness: 0.7 },
  coal: { color: "#161616", roughness: 0.95 },
};

/** The Eas side stanchions (XML alongz `bok`): source x of each 0.1 m post, corner posts included. */
const EAS_POSTS = [0.3, 1.4, 2.5, 3.6, 4.7, 5.8, 6.9, 8.0, 9.1, 10.2, 11.3, 12.4, 13.5];
/** The two-leaf doors: the posts that frame them (x of the left, middle and right posts). */
const EAS_DOORS = [[2.5, 3.6, 4.7], [9.1, 10.2, 11.3]];

/** The Eas high-sided open wagon (vlakosimdb n_eas, n_eas-drevo, n_eas-uhlo). */
export function easOpenWagon(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(EAS_PARAMS, params);
  const c = new Wagon(EAS_PALETTE, 6.95);
  const m = c.m;
  m.scope("body", () => {
    m.scope("floor", () => c.box("inside", 0.4, 13.5, 0.9, 1.1, -1.3, 1.3));
    for (const e of [-1, 1])
      m.scope(`${endName(e)} wall`, () => {
        const [x0, x1] = e < 0 ? [0.3, 0.4] : [13.5, 13.6];
        // the end posts and rails (XML `side`) stand outside the wall, x 0.2..0.3 and 13.6..13.7
        const xo = e < 0 ? [0.2, 0.3] : [13.6, 13.7];
        m.scope("wall", () => c.box("body", x0, x1, 1.1, 3.2, -1.3, 1.3));
        m.scope("top rail", () => c.box("body", xo[0]!, x1, 3.2, 3.3, -1.3, 1.3));
        [-1.3, -0.5, 0.4, 1.2].forEach((z, i) => m.scope(`post ${i + 1}`, () => c.box("bodyDark", xo[0]!, xo[1]!, 1.1, 3.1, z, z + 0.1)));
        [1.9, 3.0].forEach((y, i) => m.scope(`rail ${i + 1}`, () => c.box("bodyDark", xo[0]!, xo[1]!, y, y + 0.1, -1.3, 1.3)));
      });
    for (const s of [1, -1])
      m.scope(sideName(s), () => {
        m.scope("wall", () => c.sideBox("body", s, 0.3, 13.6, 0.9, 3.2, 1.3, 1.4));
        m.scope("top rail", () => c.sideBox("body", s, 0.2, 13.7, 3.2, 3.3, 1.3, 1.5));
        m.scope("solebar", () => c.sideBox("bodyDark", s, 0.3, 13.6, 0.8, 0.9, 1.2, 1.42));
        const doorPost = (x: number) => EAS_DOORS.some((d) => d.includes(x));
        m.scope("stanchions", () => {
          EAS_POSTS.forEach((x, i) =>
            m.scope(`stanchion ${i + 1}`, () => {
              // a door post is dark below the door and grey above (in the door's scope)
              c.sideBox("bodyDark", s, x, x + 0.1, 0.9, doorPost(x) ? 1.1 : 3.2, 1.4, 1.5);
            }),
          );
        });
        EAS_DOORS.forEach(([a, mid, b], i) =>
          m.scope(`door ${i + 1}`, () => {
            m.scope("frame", () => {
              c.sideBox("doorFrame", s, a! + 0.1, b!, 1.1, 1.2, 1.4, 1.46);
              c.sideBox("doorFrame", s, a!, b! + 0.1, 3.2, 3.3, 1.5, 1.505);
            });
            m.scope("posts", () => [a!, mid!, b!].forEach((x, k) => m.scope(`post ${k + 1}`, () => c.sideBox("doorFrame", s, x, x + 0.1, 1.1, 3.2, 1.4, 1.5))));
            m.scope("leaves", () => {
              for (const [x0, x1] of [[a! + 0.1, mid!], [mid! + 0.1, b!]]) c.sideBox("bodyLight", s, x0!, x1!, 1.2, 3.2, 1.4, 1.415);
            });
          }),
        );
        // the data panel and number at the x = 0 end of the +z side, the far end of the -z side
        const x0 = s > 0 ? 0.4 : 12.5;
        m.scope("data panel", () => c.sideBox("plate", s, x0, x0 + 1.0, 1.2, 1.8, 1.4, 1.41));
        m.scope("running number", () => c.letters(s, 1.416, x0 + 0.5, numberLines(WAGON_NUMBERS.eas.number, "\u010cD", 2.2, 0.1, 0.2)));
        m.scope("label", () => c.sideBox("letter", s, s > 0 ? 1.6 : 11.5, s > 0 ? 2.4 : 12.3, 2.3, 2.6, 1.4, 1.405));
      });
  });
  m.scope("underframe", () => {
    c.box("underframe", 0.4, 13.5, 0.62, 0.8, -0.18, 0.18);
    m.scope("brake cylinder", () => c.logX("underframe", 5.3, 6.1, 0.55, 0.62, 0.14, 10));
    m.scope("reservoir", () => c.logX("underframe", 7.4, 8.8, -0.55, 0.6, 0.18, 10));
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0, 0.2, 0.31, 0.78, 1.1, 1.38) : c.drawGear(1, 13.9, 13.7, 13.59, 0.78, 1.1, 1.38)));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(2.35, 2.0));
    m.scope("bogie 2", () => c.freightBogie(11.45, 2.0));
  });
  if (cargo === "coal")
    m.scope("cargo", () => {
      // the native load's visual hull: an elevation of four mounds and a section peaked mid-width
      const elev: Array<[number, number]> = [[0.4, 3.15], [0.9, 3.4], [1.7, 3.5], [3.6, 3.4], [5.9, 3.5], [8.3, 3.4], [9.0, 3.5], [9.6, 3.4], [11.7, 3.5], [12.3, 3.5], [13.5, 3.15]];
      const sect: Array<[number, number]> = [[-1.3, 3.15], [-0.65, 3.4], [-0.4, 3.5], [0.4, 3.5], [0.7, 3.4], [1.3, 3.15]];
      c.heap("coal", 0.4, 13.5, 1.3, 26, 8, (x, z) => Math.min(lerp(elev, x), lerp(sect, z)));
    });
  if (cargo === "wood")
    m.scope("cargo", () => {
      // fifteen bundles of five logs laid across the wagon, their tops 3.7 to 3.9 m (the native n_eas-drevo)
      for (let i = 0; i < 15; i++)
        m.scope(`bundle ${i + 1}`, () => {
          // the end bundles rest on the end walls' top rails, as the native load reaches 0.3..13.6 m
          const x = 0.735 + i * 0.888;
          const r = 0.145;
          const lift = [0, 0.04, 0, 0.06][i % 4]! + (i === 14 ? 0.08 : 0);
          for (const d of [-0.29, 0, 0.29]) c.logZ(i % 2 ? "bark" : "barkDark", x + d, 3.3 + lift, -1.27 + (i % 3) * 0.01, 1.27 - (i % 2) * 0.015, r, 8, "logEnd");
          for (const d of [-0.145, 0.145]) c.logZ(i % 2 ? "barkDark" : "bark", x + d, 3.3 + 0.25 + lift, -1.25 + (i % 2) * 0.02, 1.25 - (i % 3) * 0.02, r, 8, "logEnd");
        });
    });
  return m;
}

const UA_PALETTE: Record<string, MaterialSpec> = {
  body: { color: "#702f1f", roughness: 0.7 },
  bodyDark: { color: "#501f0f", roughness: 0.75 },
  bodyLight: { color: "#8f402f", roughness: 0.7 },
  inside: { color: "#60271f", roughness: 0.85 },
  handbrake: { color: "#b0242a", roughness: 0.5 },
  coal: { color: "#1a1b1b", roughness: 0.95 },
  sand: { color: "#9ea49a", roughness: 0.95 },
  // the native n_ua#2 load: weathered, lighter logs
  bark: { color: "#7a6034", roughness: 0.9 },
  barkDark: { color: "#5f381f", roughness: 0.9 },
};

/** The Ua's lighter painted stanchions (native z_both columns 15..121): source x and width of each. */
const UA_POSTS: Array<[number, number]> = [[1.5, 0.1], [2.5, 0.1], [4.5, 0.2], [5.6, 0.2], [6.7, 0.2], [7.8, 0.2], [8.8, 0.2], [10.9, 0.2], [12.0, 0.2]];
/** The two doors: x0, x1 and the two vertical locking bars, whose hooks reach 0.4 m toward -x (native columns 29..42, 93..106). */
const UA_DOORS: Array<[number, number, number, number]> = [[2.6, 4.5, 3.3, 4.2], [9.0, 10.9, 9.7, 10.6]];

/** The Ua open wagon with a load (vlakosimdb n_ua-empty, n_ua#1..#3). */
export function uaOpenWagon(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(UA_PARAMS, params);
  const c = new Wagon(UA_PALETTE, 6.85);
  const m = c.m;
  m.scope("body", () => {
    m.scope("floor", () => c.box("inside", 0.8, 12.9, 0.9, 1.1, -1.3, 1.3));
    for (const e of [-1, 1])
      m.scope(`${endName(e)} wall`, () => {
        const [x0, x1] = e < 0 ? [0.6, 0.8] : [12.9, 13.1];
        c.box("body", x0, x1, 0.9, 3.2, -1.3, 1.3);
        c.box("body", e < 0 ? 0.5 : 12.9, e < 0 ? 0.8 : 13.2, 3.2, 3.3, -1.3, 1.3);
        // the end's corner posts, seen from both the side and the end
        m.scope("corner posts", () => {
          for (const s of [-1, 1]) c.sideBox("bodyDark", s, e < 0 ? 0.45 : 13.1, e < 0 ? 0.6 : 13.25, 0.95, 3.2, 1.2, 1.5);
        });
        // the four lighter posts on the end wall (native x_both columns 2, 9, 19 and 27)
        // (the outer two on the corner posts' end faces, the inner two on the wall)
        [-1.3, -0.6, 0.4, 1.2].forEach((z, i) => {
          const corner = Math.abs(z + 0.05) > 1;
          const xo = corner ? (e < 0 ? [0.42, 0.45] : [13.25, 13.28]) : e < 0 ? [0.56, 0.6] : [13.1, 13.14];
          m.scope(`end post ${i + 1}`, () => c.box("bodyLight", xo[0]!, xo[1]!, 1.2, 3.2, z, z + 0.1));
        });
      });
    for (const s of [1, -1])
      m.scope(sideName(s), () => {
        m.scope("wall", () => c.sideBox("body", s, 0.6, 13.1, 0.9, 3.2, 1.3, 1.5));
        m.scope("top rim", () => c.sideBox("bodyLight", s, 0.5, 13.2, 3.2, 3.3, 1.3, 1.53));
        m.scope("stanchions", () => UA_POSTS.forEach(([x, w], i) => m.scope(`stanchion ${i + 1}`, () => c.sideBox("bodyLight", s, x, x + w, 0.9, 3.2, 1.5, 1.53))));
        UA_DOORS.forEach(([x0, x1, b0, b1], i) =>
          m.scope(`door ${i + 1}`, () => {
            m.scope("leaves", () => c.sideBox("body", s, x0, x1, 1.0, 3.15, 1.5, 1.515));
            m.scope("seam", () => c.sideBox("bodyDark", s, (x0 + x1) / 2 - 0.02, (x0 + x1) / 2 + 0.02, 1.0, 3.15, 1.512, 1.52));
            for (const [k, x] of [b0, b1].entries())
              m.scope(`locking bar ${k + 1}`, () => {
                c.sideBox("bodyLight", s, x, x + 0.1, 1.4, 2.9, 1.515, 1.535);
                c.sideBox("bodyLight", s, x - 0.4, x + 0.1, 1.3, 1.4, 1.515, 1.535);
              });
            m.scope("sill", () => c.sideBox("inside", s, x0, x1 + 0.1, 0.8, 0.9, 1.3, 1.48));
          }),
        );
        const x0 = s > 0 ? 0.7 : 12.0;
        m.scope("running number", () => c.letters(s, 1.506, x0 + 0.4, numberLines(WAGON_NUMBERS.ua.number, "\u010cD", 1.95, 0.08, 0.2)));
      });
  });
  m.scope("underframe", () => {
    c.box("underframe", 0.8, 12.9, 0.66, 0.9, -0.18, 0.18);
    m.scope("buffer bars", () => {
      for (const s of [-1, 1]) c.sideBox("underframe", s, 0.6, 13.1, 0.8, 0.9, 0.85, 1.15);
    });
    m.scope("handbrake", () => {
      for (const s of [-1, 1]) c.sideBox("handbrake", s, 4.9, 5.4, 0.5, 1.0, 1.2, 1.45);
    });
    m.scope("reservoir", () => c.logX("bodyDark", 5.9, 7.7, 1.0, 0.7, 0.2, 10));
    m.scope("distributor", () => c.box("bodyDark", 7.8, 8.5, 0.6, 0.88, 0.7, 1.1));
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0.1, 0.35, 0.58, 0.78, 1.12, 1.38) : c.drawGear(1, 13.6, 13.35, 13.12, 0.78, 1.12, 1.38)));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(2.35, 1.8));
    m.scope("bogie 2", () => c.freightBogie(11.35, 1.8));
  });
  if (cargo === "coal" || cargo === "sand")
    m.scope("cargo", () => {
      // the native `load` visual hull: a section peaked off-centre and two heaps along the wagon
      const coal = cargo === "coal";
      const sect: Array<[number, number]> = coal ? [[-1.3, 3.0], [-0.8, 3.3], [0.4, 3.6], [1.3, 3.1]] : [[-1.3, 3.1], [-0.8, 3.4], [0.4, 3.7], [1.3, 3.1]];
      const elev: Array<[number, number]> = coal
        ? [[0.8, 2.8], [1.3, 3.2], [2.7, 3.4], [5.3, 3.6], [7.4, 3.2], [7.9, 3.0], [8.5, 3.3], [9.8, 3.6], [11.2, 3.5], [12.9, 3.1]]
        : [[0.8, 2.9], [1.6, 3.2], [2.7, 3.5], [5.3, 3.6], [7.9, 3.1], [8.5, 3.5], [9.8, 3.7], [11.2, 3.5], [12.9, 3.1]];
      c.heap(cargo, 0.8, 12.9, 1.3, 30, 8, (x, z) => Math.max(3.3, Math.min(lerp(elev, x), lerp(sect, z))));
    });
  if (cargo === "wood")
    m.scope("cargo", () => {
      // logs along the wagon, their top layer 3.4 to 3.6 m (the native n_ua#2 `load`)
      m.scope("logs", () => {
        for (let k = 0; k < 7; k++) {
          const z = -1.08 + k * 0.36;
          c.logX(k % 2 ? "bark" : "barkDark", 0.85 + (k % 3) * 0.04, 12.85 - (k % 2) * 0.05, z, 3.21, 0.18, 8, "logEnd");
        }
        for (let k = 0; k < 6; k++) {
          const z = -0.9 + k * 0.36;
          c.logX(k % 2 ? "barkDark" : "bark", 1.4 - (k % 2) * 0.1, 12.3 + (k % 3) * 0.12, z, 3.43, 0.18, 8, "logEnd");
        }
      });
      // four steel straps over the load and down both sides (native z_both columns 23, 55, 81, 112)
      m.scope("straps", () => {
        [2.3, 5.5, 8.1, 11.2].forEach((x, i) =>
          m.scope(`strap ${i + 1}`, () => {
            c.box("strap", x, x + 0.1, 3.61, 3.63, -1.545, 1.545);
            for (const s of [-1, 1]) c.sideBox("strap", s, x, x + 0.1, 0.95, 3.61, 1.535, 1.545);
          }),
        );
      });
    });
  return m;
}

// --- the Nas flat wagon with stakes ----------------------------------------------------

const NAS_PALETTE: Record<string, MaterialSpec> = {
  frame: { color: "#5f2710", roughness: 0.75 },
  side: { color: "#903720", roughness: 0.7 },
  sideLight: { color: "#a0482f", roughness: 0.7 },
  deck: { color: "#505750", roughness: 0.9 },
  plankGap: { color: "#2f2f2f", roughness: 0.9 },
  tube: { color: "#8a8d90", metallic: 0.3, roughness: 0.45 },
  bore: { color: "#2b2c2e", roughness: 0.7 },
  reel: { color: "#7f3f00", roughness: 0.8 },
  cable: { color: "#26292a", roughness: 0.8 },
};

/** The stakes (XML alongz `zside`): source x of each 0.1 m stake between the end posts. */
const NAS_STAKES = [2.7, 4.9, 7.1, 9.3, 11.5, 13.7, 15.9, 18.1];

/** The Nas flat wagon with drop sides and stakes (vlakosimdb n_nas, n_nas-full#1..#3). */
export function nasFlatWagon(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(NAS_PARAMS, params);
  const c = new Wagon(NAS_PALETTE, 10.45);
  const m = c.m;
  m.scope("body", () => {
    m.scope("deck", () => {
      c.box("deck", 0.6, 20.3, 1.1, 1.2, -1.3, 1.3);
      // the gaps between the deck planks (native y_dec: every 0.4 m from column 7)
      for (let k = 0; k < 49; k++) c.box("plankGap", 0.7 + k * 0.4, 0.8 + k * 0.4, 1.2, 1.203, -1.28, 1.28);
    });
    m.scope("centre sill", () => c.box("frame", 0.62, 20.28, 0.75, 1.1, -0.25, 0.25));
    for (const e of [-1, 1])
      m.scope(`${endName(e)} wall`, () => {
        const [x0, x1] = e < 0 ? [0.5, 0.6] : [20.3, 20.4];
        m.scope("wall", () => c.box("side", x0, x1, 1.2, 2.0, -1.4, 1.4));
        for (const s of [-1, 1]) m.scope(s > 0 ? "right post" : "left post", () => c.sideBox("side", s, x0, x1, 0.8, 2.7, 1.4, 1.48));
      });
    for (const s of [1, -1])
      m.scope(sideName(s), () => {
        m.scope("solebar", () => c.sideBox("frame", s, 0.6, 20.3, 0.8, 1.2, 1.3, 1.44));
        // the fishbelly between the bogies (XML alongz base)
        m.scope("fishbelly", () => c.sideSweep("frame", [[4.8, 0.8], [6.1, 0.4], [15.0, 0.4], [16.4, 0.8]], ...(s > 0 ? [1.32, 1.42] : [-1.42, -1.32]) as [number, number]));
        m.scope("drop side", () => {
          c.sideBox("side", s, 0.6, 20.3, 1.2, 1.7, 1.36, 1.44);
          c.sideBox("sideLight", s, 0.6, 20.3, 1.62, 1.7, 1.44, 1.45);
          c.sideBox("sideLight", s, 0.6, 20.3, 1.42, 1.47, 1.44, 1.45);
        });
        m.scope("stakes", () =>
          NAS_STAKES.forEach((x, i) =>
            m.scope(`stake ${i + 1}`, () => {
              c.sideBox("side", s, x, x + 0.1, 0.7, 2.9, 1.45, 1.53);
              c.sideBox("frame", s, x - 0.03, x + 0.13, 0.8, 0.95, 1.44, 1.55);
            }),
          ),
        );
        const x0 = s > 0 ? 1.2 : 19.7;
        m.scope("running number", () => c.letters(s, 1.446, x0, [{ text: WAGON_NUMBERS.nas.number, y: 0.93, h: 0.08 }, { text: "54 \u010cD", y: 1.06, h: 0.07 }]));
      });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0, 0.4, 0.62, 0.78, 1.12, 1.38) : c.drawGear(1, 20.9, 20.5, 20.28, 0.78, 1.12, 1.38)));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(2.65, 2.0));
    m.scope("bogie 2", () => c.freightBogie(18.35, 2.0));
  });
  if (cargo === "wood")
    m.scope("cargo", () => {
      // a pile of 25 logs in five layers, 2.9 to 18.1 m (n_nas-full#1's wood inlines)
      const counts = [7, 6, 5, 4, 3];
      let n = 0;
      counts.forEach((count, layer) =>
        m.scope(`layer ${layer + 1}`, () => {
          for (let k = 0; k < count; k++) {
            const z = (k - (count - 1) / 2) * 0.4;
            const y = 1.2 + 0.2 + layer * 0.3464;
            const j = n++ % 5;
            c.logX(j % 2 ? "bark" : "barkDark", 2.82 + j * 0.04, 18.18 - ((j * 3) % 5) * 0.04, z, y, 0.2, 8, "logEnd");
          }
        }),
      );
    });
  if (cargo === "tubes")
    m.scope("cargo", () => {
      // five steel tubes 0.9 m across, three below and two above (n_nas-full#2's tube inlines)
      for (const [z, y] of [[-0.95, 1.65], [0.0, 1.65], [0.95, 1.65], [-0.475, 2.42], [0.475, 2.42]] as Array<[number, number]>)
        m.scope("tube", () => c.tube("tube", "bore", 2.8, 18.3, z, y, 0.45, 0.04, 16));
    });
  if (cargo === "reels")
    m.scope("cargo", () => {
      // six cable reels standing across the wagon, 2 m across (n_nas-full#3's reel inlines)
      for (const x of [2.9, 5.8, 9.0, 11.9, 15.1, 18.0])
        m.scope("reel", () => {
          const flange = ngon(8, 1.0 / Math.cos(Math.PI / 8), Math.PI / 8, c.X(x), 2.205);
          for (const [z0, z1] of [[-1.0, -0.9], [0.9, 1.0]]) m.sweep("reel", "z", flange, z0!, flange, z1!);
          const core = ngon(8, 0.8 / Math.cos(Math.PI / 8), Math.PI / 8, c.X(x), 2.205);
          m.sweep("cable", "z", core, -0.9, core, 0.9, false);
        });
    });
  return m;
}

// --- the Raj hopper wagon ----------------------------------------------------------

const RAJ_PALETTE: Record<string, MaterialSpec> = {
  red: { color: "#a03830", roughness: 0.65 },
  frame: { color: "#2f282f", roughness: 0.8 },
  hopper: { color: "#e3df62", roughness: 0.5 },
  hopperShade: { color: "#c4c048", roughness: 0.55 },
  lid: { color: "#9c9c9c", metallic: 0.2, roughness: 0.5 },
  steelwork: { color: "#40505f", roughness: 0.6 },
  grating: { color: "#33383d", roughness: 0.7 },
};

/** The hoppers' rotation profile (XML `r1`..`r4`, radius about the hopper's axis, y) and their axes. */
const RAJ_PROFILE: Array<[number, number]> = [[0.8, 2.0], [1.4, 2.8], [1.4, 3.6], [1.3, 3.8], [0.3, 4.5]];
const RAJ_HOPPERS = [3.0, 6.0, 8.9, 11.9];

/** The Raj wagon with four pressure-discharge hoppers (vlakosimdb n_raj). */
export function rajHopperWagon(): MeshBuilder {
  const c = new Wagon(RAJ_PALETTE, 7.2);
  const m = c.m;
  m.scope("frame", () => {
    m.scope("underframe", () => c.box("frame", 1.2, 13.9, 0.8, 1.2, -1.5, 1.5));
    // the red body: a 1.3..13.8 m rectangle 2.8 m wide at 1.2 m to a 1.9..13.1 m one 2.0 m wide at 2.0 m
    m.scope("body", () => m.loft("red", rect(12.5, 2.8, c.X(7.55)), 1.2, rect(11.2, 2.0, c.X(7.5)), 2.0));
    m.scope("centre sill", () => c.sideSweep("frame", [[2.5, 0.8], [5.4, 0.4], [9.8, 0.4], [12.7, 0.8]], -0.45, 0.45));
  });
  m.scope("hoppers", () =>
    RAJ_HOPPERS.forEach((xc, i) =>
      m.scope(`hopper ${i + 1}`, () => {
        const ring = (r: number) => ngon(10, r, Math.PI / 10, c.X(xc), 0);
        m.scope("shell", () => {
          m.cap("hopperShade", ring(0.8), 2.0, false);
          for (let k = 0; k + 1 < RAJ_PROFILE.length; k++) {
            const [r0, y0] = RAJ_PROFILE[k]!;
            const [r1, y1] = RAJ_PROFILE[k + 1]!;
            m.loft(k === 0 ? "hopperShade" : "hopper", ring(r0), y0, ring(r1), y1, false);
          }
        });
        m.scope("lid", () => m.prism("lid", ring(0.3), 4.5, 4.56));
        // the discharge pipe stubs either side (XML `tank` at x 2.9..3.0 and its kin)
        m.scope("outlets", () => {
          for (const s of [-1, 1]) c.sideBox("hopper", s, xc - 0.05, xc + 0.05, 1.75, 2.25, 0.95, 1.2);
        });
      }),
    ),
  );
  m.scope("platforms", () => {
    for (const [x0, x1, lx] of [[3.0, 6.0, 4.2], [8.9, 11.9, 10.1]] as Array<[number, number, number]>)
      m.scope("platform", () => {
        m.scope("grating", () => c.box("grating", x0, x1, 3.95, 4.0, -0.7, 0.7));
        m.scope("handrails", () => {
          // the top rails 4.35..4.45 m: native rows 5..6 (the XML's 4.3..4.4, 0.05 m higher)
          m.scope("top rails", () => {
            for (const s of [-1, 1]) c.sideBox("steelwork", s, x0 + 0.3, x1 - 0.3, 4.35, 4.45, 0.65, 0.7);
          });
          m.scope("posts", () => {
            for (const s of [-1, 1]) for (const x of [x0 + 0.3, x1 - 0.35]) c.sideBox("steelwork", s, x, x + 0.05, 4.0, 4.35, 0.65, 0.7);
          });
        });
        m.scope("ladder", () => {
          for (const x of [lx, lx + 0.5]) c.sideBox("steelwork", 1, x, x + 0.1, 2.0, 4.3, 0.62, 0.72);
          for (let k = 0; k < 6; k++) c.sideBox("steelwork", 1, lx + 0.1, lx + 0.5, 2.3 + k * 0.3, 2.35 + k * 0.3, 0.65, 0.69);
        });
      });
  });
  m.scope("brake platform", () => {
    c.box("frame", 0.5, 1.2, 1.12, 1.2, -1.4, 1.4);
    for (const s of [-1, 1]) {
      for (const x of [0.5, 1.1]) c.sideBox("steelwork", s, x, x + 0.1, 1.2, 2.1, 1.4, 1.5);
      c.sideBox("steelwork", s, 0.5, 1.2, 2.0, 2.1, 1.4, 1.5);
      c.sideBox("steelwork", s, 0.5, 0.6, 1.2, 2.0, 1.0, 1.1);
      c.sideBox("steelwork", s, 0.5, 1.2, 0.4, 0.5, 1.1, 1.4);
      c.sideBox("steelwork", s, 0.5, 0.6, 0.5, 1.12, 1.1, 1.2);
    }
    c.box("steelwork", 0.5, 0.6, 2.0, 2.1, -1.4, 1.4);
  });
  for (const s of [1, -1]) m.scope(`${sideName(s)} number`, () => c.letters(s, 1.506, s > 0 ? 2.4 : 12.4, [{ text: WAGON_NUMBERS.raj.number, y: 0.92, h: 0.1 }]));
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0, 0.48, 0.64, 0.82, 1.1, 1.38) : c.drawGear(1, 14.4, 13.92, 13.82, 0.82, 1.1, 1.38)));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(3.5, 1.9));
    m.scope("bogie 2", () => c.freightBogie(11.6, 1.9));
  });
  return m;
}

// --- the Rah tank wagon -----------------------------------------------------------

const RAH_PALETTE: Record<string, MaterialSpec> = {
  tank: { color: "#c9c9c9", metallic: 0.25, roughness: 0.4 },
  band: { color: "#c08820", roughness: 0.55 },
  frame: { color: "#35353f", roughness: 0.75 },
  steelwork: { color: "#5f585f", roughness: 0.6 },
  ink: { color: "#151515", roughness: 0.6 },
  grating: { color: "#3b3b3b", roughness: 0.7 },
};

/** The tank's rotation profile about y = 2.45 (XML `tank`: x, radius). */
const RAH_AXIS = 2.45;
const RAH_PROFILE: Array<[number, number]> = [[0.9, 0.45], [1.1, 0.95], [11.1, 0.95], [11.3, 0.45]];
const RAH_SIDES = 16;
/** The orange band's height on the tank sides (native rows 23..27). */
const RAH_BAND: [number, number] = [2.2, 2.7];

/** The heights of the shell's facet edges on the sides (the 16-gon's vertices). */
const RAH_FACET_EDGES = ngon(RAH_SIDES, 0.95, Math.PI / RAH_SIDES, 0, RAH_AXIS).map(([, y]) => y);

/** A convex polygon (u, v) cut by the line v = y: the pieces on either side (one, if it does not cross). */
function splitAtY(poly: Array<[number, number]>, y: number): Array<Array<[number, number]>> {
  const below: Array<[number, number]> = [];
  const above: Array<[number, number]> = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    if (a[1] <= y) below.push(a);
    if (a[1] >= y) above.push(a);
    if ((a[1] - y) * (b[1] - y) < 0) {
      const p: [number, number] = [a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]), y];
      below.push(p);
      above.push(p);
    }
  }
  return [below, above].filter((q) => q.length >= 3);
}

/** Half the width of the tank's 16-sided shell at height y. */
function shellHalf(y: number): number {
  const ring = ngon(RAH_SIDES, 0.95, Math.PI / RAH_SIDES, 0, RAH_AXIS);
  let best = 0;
  for (let i = 0; i < ring.length; i++) {
    const [za, ya] = ring[i]!;
    const [zb, yb] = ring[(i + 1) % ring.length]!;
    if ((ya - y) * (yb - y) <= 0 && Math.abs(yb - ya) > 1e-9) best = Math.max(best, Math.abs(za + ((y - ya) / (yb - ya)) * (zb - za)));
  }
  return best;
}

/** The face of the polygon (y0..y1 cut of the planar quad `q`), a few millimetres proud along its normal. */
function bandPiece(c: Wagon, q: Vec3[], y0: number, y1: number, proud: number): void {
  const cut = (ring: Vec3[], h: number, above: boolean): Vec3[] => {
    const out: Vec3[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % ring.length]!;
      const inA = above ? a[1] >= h - 1e-9 : a[1] <= h + 1e-9;
      const inB = above ? b[1] >= h - 1e-9 : b[1] <= h + 1e-9;
      if (inA) out.push(a);
      if (inA !== inB) {
        const t = (h - a[1]) / (b[1] - a[1]);
        out.push([a[0] + t * (b[0] - a[0]), h, a[2] + t * (b[2] - a[2])]);
      }
    }
    return out;
  };
  const poly = cut(cut(q, y0, true), y1, false);
  if (poly.length < 3) return;
  const u = [q[1]![0] - q[0]![0], q[1]![1] - q[0]![1], q[1]![2] - q[0]![2]];
  const v = [q[2]![0] - q[0]![0], q[2]![1] - q[0]![1], q[2]![2] - q[0]![2]];
  let n = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
  const l = Math.hypot(n[0]!, n[1]!, n[2]!);
  n = n.map((x) => x / l);
  // outward: away from the tank's axis
  const mid = q.reduce((s, p) => [s[0]! + p[0] / 4, s[1]! + p[1] / 4, s[2]! + p[2] / 4], [0, 0, 0]);
  if (n[1]! * (mid[1]! - RAH_AXIS) + n[2]! * mid[2]! < 0) n = n.map((x) => -x);
  const off = (p: Vec3): Vec3 => [p[0] + n[0]! * proud, p[1] + n[1]! * proud, p[2] + n[2]! * proud];
  c.m.slab("band", poly.map(off), [-n[0]! * 0.003, -n[1]! * 0.003, -n[2]! * 0.003]);
}

/** The Rah ammonia tank wagon (vlakosimdb n_rah#1). */
export function rahTankWagon(): MeshBuilder {
  const c = new Wagon(RAH_PALETTE, 6.35);
  const m = c.m;
  const ring = (r: number) => ngon(RAH_SIDES, r, Math.PI / RAH_SIDES, 0, RAH_AXIS);
  m.scope("frame", () => {
    m.scope("underframe", () => c.box("frame", 0.5, 12.2, 0.8, 1.2, -1.4, 1.4));
    m.scope("saddles", () => {
      for (const [x0, x1] of [[1.5, 4.2], [8.1, 10.8]]) c.box("frame", x0!, x1!, 1.2, 1.7, -0.6, 0.6);
    });
  });
  m.scope("tank", () => {
    m.scope("shell", () => {
      for (let k = 0; k + 1 < RAH_PROFILE.length; k++) {
        const [x0, r0] = RAH_PROFILE[k]!;
        const [x1, r1] = RAH_PROFILE[k + 1]!;
        m.sweep("tank", "x", ring(r0), c.X(x0), ring(r1), c.X(x1), k === 0 || k === RAH_PROFILE.length - 2);
      }
    });
    m.scope("band", () => {
      // the orange band, painted on every shell facet it crosses
      for (let k = 0; k + 1 < RAH_PROFILE.length; k++) {
        const [x0, r0] = RAH_PROFILE[k]!;
        const [x1, r1] = RAH_PROFILE[k + 1]!;
        const [a, b] = [ring(r0), ring(r1)];
        for (let i = 0; i < RAH_SIDES; i++) {
          const j = (i + 1) % RAH_SIDES;
          const q: Vec3[] = [[c.X(x0), a[i]![1], a[i]![0]], [c.X(x1), b[i]![1], b[i]![0]], [c.X(x1), b[j]![1], b[j]![0]], [c.X(x0), a[j]![1], a[j]![0]]];
          if (Math.min(...q.map((p) => p[1])) < RAH_BAND[1] && Math.max(...q.map((p) => p[1])) > RAH_BAND[0]) bandPiece(c, q, RAH_BAND[0], RAH_BAND[1], 0.004);
        }
      }
      for (const [x, e] of [[0.9, -1], [11.3, 1]] as Array<[number, number]>) {
        const d = ngon(RAH_SIDES, 0.45, Math.PI / RAH_SIDES, 0, RAH_AXIS);
        const pts = d.map(([z, y]): Vec3 => [c.X(x) + e * 0.004, y, z]);
        bandPiece(c, pts.length > 4 ? pts : pts, RAH_BAND[0], RAH_BAND[1], 0);
      }
    });
    m.scope("dome", () => m.loft("tank", rect(0.9, 0.8, c.X(6.45)), 3.3, rect(0.5, 0.6, c.X(6.45)), 4.0));
    m.scope("walkway", () => c.box("grating", 5.2, 7.7, 3.38, 3.42, -0.42, 0.42));
    m.scope("walkway handrail", () => {
      for (const s of [-1, 1]) {
        for (const x of [5.8, 7.4]) c.sideBox("steelwork", s, x, x + 0.06, 3.42, 3.9, 0.4, 0.45);
        c.sideBox("steelwork", s, 5.8, 7.46, 3.84, 3.9, 0.4, 0.45);
      }
    });
    // bold black capitals over the band (native columns 50..70, rows 23..27), laid on the shell's facets
    m.scope("lettering", () => {
      for (const s of [-1, 1]) {
        const h = 0.38;
        const [w, gap] = [0.29, 0.07];
        const u0 = c.X(6.05) + (s > 0 ? -1 : 1) * (6 * w + 5 * gap) / 2;
        // cut the bars at the shell's facet edges, so every piece lies on one flat facet
        const flat = strokeText("\u010cPAVEX", u0, 2.235, h, w, gap, s < 0, 0.07);
        let polys: Array<Array<[number, number]>> = [];
        for (let i = 0; i + 2 < flat.length; i += 3) polys.push([flat[i]!, flat[i + 1]!, flat[i + 2]!]);
        for (const cut of RAH_FACET_EDGES) polys = polys.flatMap((poly) => splitAtY(poly, cut));
        const pts: Vec3[] = [];
        for (const poly of polys)
          for (let i = 1; i + 1 < poly.length; i++)
            for (const [u, v] of [poly[0]!, poly[i]!, poly[i + 1]!]) pts.push([u, v, s * (shellHalf(v) + 0.008)]);
        c.m.facets("ink", pts, [0, 0, s]);
      }
    });
  });
  for (const s of [1, -1])
    m.scope(`${sideName(s)} boards`, () => {
      for (const [i, [x0, x1]] of [[1.6, 4.1], [8.2, 10.7]].entries()) m.scope(`board ${i + 1}`, () => c.sideBox("ink", s, x0!, x1!, 1.2, 2.0, 0.85, 0.9));
      m.scope("running number", () => c.letters(s, 0.906, 2.45, numberLines(WAGON_NUMBERS.rah.number, "\u010cPAV", 1.25, 0.12, 0.24), "letter", 0.84));
      // the side ladder from below the frame to the walkway (native columns 52..57, rows 11..44)
      m.scope("ladder", () => {
        for (const x0 of [5.2, 5.7]) c.sideBox("steelwork", s, x0, x0 + 0.06, 0.55, 3.95, 0.98, 1.04);
        for (let k = 0; k < 11; k++) c.sideBox("steelwork", s, 5.26, 5.7, 0.65 + k * 0.3, 0.69 + k * 0.3, 0.99, 1.03);
      });
    });
  // the brake platform's railing at the +x end (XML `rail`: x 12.1..12.2)
  m.scope("platform railing", () => {
    for (const s of [-1, 1]) {
      c.sideBox("steelwork", s, 12.1, 12.2, 1.2, 2.3, 1.3, 1.4);
      c.sideBox("steelwork", s, 12.1, 12.2, 1.2, 2.2, 0.5, 0.6);
    }
    c.box("steelwork", 12.1, 12.2, 2.2, 2.3, -1.3, 1.3);
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0.05, 0.48, 0.6, 0.82, 1.1, 1.38) : c.drawGear(1, 12.65, 12.22, 12.1, 0.82, 1.1, 1.38)));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(2.675, 1.95));
    m.scope("bogie 2", () => c.freightBogie(9.6, 1.9));
  });
  return m;
}

/** A wagon design: id, title, builder, parameters and its reference folder (assets/<folder>/). */
export interface WagonDesign {
  id: string;
  title: string;
  folder: string;
  build: (params?: ParamValues) => MeshBuilder;
  params?: readonly ParamSpec[];
  /** What the game needs of it beyond its geometry (design.ts GameProperties). */
  game: GameProperties;
}

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const NAS_FLAT_WAGON_GAME: GameProperties = {
  weight: 25,
  power: 0,
  maxspeed: 120,
  accel: null,
  variants: [
    { params: { cargo: "reels" }, weight: 33 },
    { params: { cargo: "wood" }, weight: 50 },
    { params: { cargo: "tubes" }, weight: 35 },
  ],
};

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const UA_OPEN_WAGON_GAME: GameProperties = {
  weight: 30,
  power: 0,
  maxspeed: 120,
  accel: null,
  variants: [
    { params: { cargo: "coal" }, weight: 60 },
    { params: { cargo: "wood" }, weight: 50 },
    { params: { cargo: "sand" }, weight: 60 },
  ],
};

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const EAS_OPEN_WAGON_GAME: GameProperties = {
  weight: 23.5,
  power: 0,
  maxspeed: 90,
  accel: null,
  variants: [
    { params: { cargo: "coal" }, weight: 65.5 },
    { params: { cargo: "wood" }, weight: 65.5 },
  ],
};

/** Every wagon design, in catalog order. The ids are stored in saved maps. */
export const WAGON_DESIGNS: readonly WagonDesign[] = [
  { id: "proc-vehicle-nas-flat-wagon", game: NAS_FLAT_WAGON_GAME, title: "Nas Flat Wagon", folder: "wagon-nas", build: nasFlatWagon, params: NAS_PARAMS },
  { id: "proc-vehicle-ua-open-wagon", game: UA_OPEN_WAGON_GAME, title: "Ua Open Wagon", folder: "wagon-ua", build: uaOpenWagon, params: UA_PARAMS },
  { id: "proc-vehicle-eas-open-wagon", game: EAS_OPEN_WAGON_GAME, title: "Eas Open Wagon", folder: "wagon-eas", build: easOpenWagon, params: EAS_PARAMS },
  { id: "proc-vehicle-raj-hopper-wagon", game: { weight: 50, power: 0, maxspeed: 90, accel: null }, title: "Raj Hopper Wagon", folder: "wagon-raj", build: rajHopperWagon },
  { id: "proc-vehicle-rah-tank-wagon", game: { weight: 40, power: 0, maxspeed: 100, accel: null }, title: "Rah Tank Wagon", folder: "wagon-rah", build: rahTankWagon },
];
