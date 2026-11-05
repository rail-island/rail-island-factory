// The buses from around the world, second batch (docs/models/world-buses-2.md):
// 25 European city buses, coaches, double-deckers and a trolleybus on the world
// bus kit (worldBusKit.ts) with the first batch's four shapes (worldBuses.ts), each
// at its real size, modelled on the photographs in assets/<references>/ and the
// published figures in each folder's SOURCES.md. The ids are stored in the game's
// saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { worldBus, worldBusLod, type WorldBusSpec } from "./worldBusKit.ts";
import { coach, doubleDeck, highFloor, lowFloor, worldBusDesign, type WorldBus, g } from "./worldBuses.ts";

/** A livery parameter: its values (the default first), each an operator's name, a proper noun. */
export const liveryParam = (...values: Array<[string, string]>): readonly ParamSpec[] => [{
  name: "livery", title: "Livery", default: values[0]![0],
  values: values.map(([value, title]) => ({ value, title })),
}];

/** The colours of the livery `params` picks from `table`. */
const pick = (params: readonly ParamSpec[], table: Record<string, Record<string, string>>, p?: ParamValues): Record<string, string> =>
  table[resolveParams(params, p).livery as string]!;

// ---------------------------------------------------------------------------
// the designs' specs

export const ATLANTEAN_PARAMS = liveryParam(["ribble", "Ribble"], ["glasgow", "Glasgow"]);

export function atlanteanSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(ATLANTEAN_PARAMS, {
    ribble: { body: "#c8202e", band: "#15181c", cream: "#efe6c8" },
    glasgow: { body: "#2f6b3a", band: "#15181c", cream: "#f0c419" },
  }, p);
  return doubleDeck({
    length: 9.45, width: 2.5, height: 4.38,
    axles: [{ at: 2.1 }, { at: 7.05, drive: true }],
    doors: [[0.25, 1.4]],
    livery: l,
    paint: [[-1, 9.2, 1.01, 2.16, "band"], [-1, 10.5, 2.17, 2.55, "cream"], [-1, 9.2, 2.56, 4.24, "band"]],
    rake: 0.05,
  });
}

export const LODEKKA_PARAMS = liveryParam(["bristol", "Bristol Omnibus"], ["eastern", "Eastern Counties"]);

export function lodekkaSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(LODEKKA_PARAMS, {
    bristol: { body: "#1f5a35", band: "#15181c", cream: "#efe6c8" },
    eastern: { body: "#b3202a", band: "#15181c", cream: "#efe6c8" },
  }, p);
  const s = doubleDeck({
    length: 8.23, width: 2.44, height: 4.09,
    axles: [{ at: 1.35 }, { at: 6.23, drive: true }],
    doors: [[6.75, 7.75]],
    livery: l,
    paint: [[-1, 7.9, 1.01, 2.16, "band"], [-1, 9, 2.17, 2.5, "cream"], [-1, 7.9, 2.51, 3.95, "band"], [-1, 9, 0.3, 0.42, "cream"]],
    rake: 0.08,
  });
  // the front engine: its radiator grille in the front, none at the rear
  return { ...s, grille: [0.6, 1.4, 0.45], lamps: { kind: "round", y0: 0.85, y1: 1.05 }, back: { ...s.back, grille: undefined } };
}

export const PANORAMA_PARAMS = liveryParam(["wallaceArnold", "Wallace Arnold"], ["national", "National Express"]);

export function panoramaSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(PANORAMA_PARAMS, {
    wallaceArnold: { body: "#efe6c8", skirt: "#8f1d22", band: "#15181c" },
    national: { body: "#f4f4f2", skirt: "#d22630", band: "#15181c", blue: "#1d4f9c" },
  }, p);
  const s = coach({
    length: 11.0, width: 2.5, height: 3.15,
    axles: [{ at: 2.3 }, { at: 8.0, drive: true }],
    doors: [[0.3, 1.2]],
    livery: l,
    paint: [[-1, 12, 0.35, 0.8, "skirt"], [-1, 10.7, 1.82, 3.0, "band"]],
    rake: 0.12, mirrors: "arm",
  });
  return { ...s, grille: [0.62, 1.05, 0.7], lamps: { kind: "round", y0: 0.68, y1: 0.88 } };
}

export const O302_PARAMS = liveryParam(["bahnbus", "Bahnbus"], ["touring", "Touring"]);

export function o302Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(O302_PARAMS, {
    bahnbus: { body: "#efe6c8", skirt: "#8f1d22", band: "#15181c" },
    touring: { body: "#f2f1ea", skirt: "#1d3f7a", band: "#15181c" },
  }, p);
  const s = coach({
    length: 11.0, width: 2.5, height: 3.1,
    axles: [{ at: 2.4 }, { at: 8.35, drive: true }],
    doors: [[0.35, 1.25]],
    livery: l,
    paint: [[-1, 12, 0.35, 1.25, "skirt"], [-1, 10.7, 1.82, 2.95, "band"]],
    rake: 0.1, mirrors: "arm",
  });
  return { ...s, grille: [0.6, 1.0, 0.6], lamps: { kind: "round", y0: 0.66, y1: 0.86 } };
}

export const SL200_PARAMS = liveryParam(["hha", "HHA Hamburg"], ["mvg", "MVG M\u00fcnchen"]);

export function sl200Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(SL200_PARAMS, {
    hha: { body: "#d3252b", rub: "#3c3c3c", white: "#f2f1ea" },
    mvg: { body: "#f2f1ea", rub: "#3c3c3c", white: "#1d4f9c" },
  }, p);
  return highFloor({
    length: 11.05, height: 2.95,
    axles: [{ at: 2.6 }, { at: 8.2, drive: true }],
    doors: [[0.3, 1.5], [4.4, 5.6], [9.05, 10.25]],
    livery: l,
    paint: [[-1, 12, 0.78, 0.86, "rub"], [-1, 12, 2.7, 2.95, "white"], [-1, 12, 0.35, 0.7, "white"]],
  });
}

export function cityliner1Spec(): WorldBusSpec {
  return coach({
    length: 12.0, width: 2.5, height: 3.55,
    axles: [{ at: 2.65 }, { at: 8.65, drive: true }],
    doors: [[0.5, 1.4], [5.6, 6.4]],
    // white with the maker's dark glazing band raked up to the roof
    livery: { body: "#f2f2f0", skirt: "#5c6166", band: "#15181c" },
    rake: 0.5,
  });
}

export function d2uSpec(): WorldBusSpec {
  const s = doubleDeck({
    length: 9.8, width: 2.5, height: 4.25,
    axles: [{ at: 2.2 }, { at: 7.4, drive: true }],
    doors: [[0.3, 1.4], [7.8, 8.9]],
    // BVG Berlin's yellow, cream round the windows
    livery: { body: "#f2c500", band: "#15181c", cream: "#efe6c8" },
    paint: [[-1, 11, 0.3, 0.6, "band"], [-1, 9.55, 1.01, 2.16, "band"], [-1, 11, 2.17, 2.5, "cream"], [-1, 9.55, 2.51, 4.11, "band"]],
    rake: 0.1,
  });
  return { ...s, lamps: { kind: "round", y0: 0.7, y1: 0.9 } };
}

export const COBUS_PARAMS = liveryParam(["cobus", "Cobus"], ["fraport", "Fraport"]);

export function cobusSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(COBUS_PARAMS, {
    cobus: { body: "#f4f5f4", skirt: "#1d4f9c", band: "#15181c", pod: "#e9eaea" },
    fraport: { body: "#d9dde0", skirt: "#00427a", band: "#15181c", pod: "#d9dde0" },
  }, p);
  return lowFloor({
    length: 13.97, width: 3.0, height: 3.0,
    axles: [{ at: 3.2 }, { at: 10.5, drive: true }],
    doors: [[0.4, 1.8], [4.5, 5.9], [8.0, 9.4], [11.6, 13.0]],
    livery: l,
    roof: [[5.0, 7.5, 1.0, 3.25, "pod"]],
  });
}

export const VOLVO9700_PARAMS = liveryParam(["swebus", "Swebus"], ["flixbus", "FlixBus"]);

export function volvo9700Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(VOLVO9700_PARAMS, {
    swebus: { body: "#f4f4f2", skirt: "#d22630", band: "#15181c" },
    flixbus: { body: "#73d700", skirt: "#ff5f00", band: "#15181c" },
  }, p);
  return coach({
    length: 12.3, height: 3.55,
    axles: [{ at: 2.75 }, { at: 8.95, drive: true }],
    doors: [[0.55, 1.5], [5.9, 6.8]],
    livery: l, rake: 0.35,
  });
}

export const A330_PARAMS = liveryParam(["delijn", "De Lijn"], ["stib", "STIB"]);

export function a330Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(A330_PARAMS, {
    delijn: { body: "#f4f4f1", skirt: "#ffd200", band: "#15181c", pod: "#f4f4f1" },
    stib: { body: "#c9cdd1", skirt: "#d3252b", band: "#15181c", pod: "#c9cdd1" },
  }, p);
  return lowFloor({
    length: 11.97, width: 2.5, height: 3.05,
    axles: [{ at: 2.65 }, { at: 8.55, drive: true }],
    doors: [[0.3, 1.6], [5.0, 6.3], [9.6, 10.9]],
    livery: l,
    roof: [[2.6, 4.6, 0.8, 3.25, "pod"]],
  });
}

export const ASTROMEGA_PARAMS = liveryParam(["flixbus", "FlixBus"], ["megabus", "Megabus"]);

export function astromegaSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(ASTROMEGA_PARAMS, {
    flixbus: { body: "#73d700", band: "#15181c", skirt: "#ff5f00" },
    megabus: { body: "#1f4fa3", band: "#15181c", skirt: "#f2c500" },
  }, p);
  return doubleDeck({
    coach: true, length: 13.88, height: 4.0,
    axles: [{ at: 2.85 }, { at: 9.4, drive: true }, { at: 10.75, dual: false }],
    doors: [[0.2, 1.2], [6.5, 7.4]],
    livery: l,
    paint: [[-1, 14.9, 0.35, 0.62, "skirt"], [-1, 13.6, 1.06, 2.09, "band"], [-1, 13.6, 2.49, 3.8, "band"]],
    rake: 0.45,
  });
}

export const CITEA_PARAMS = liveryParam(["arriva", "Arriva"], ["connexxion", "Connexxion"]);

export function citeaSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(CITEA_PARAMS, {
    arriva: { body: "#00b0b9", skirt: "#e9e4d0", band: "#15181c", pod: "#00b0b9" },
    connexxion: { body: "#f4f4f1", skirt: "#1d4f9c", band: "#15181c", pod: "#e9eaea" },
  }, p);
  return lowFloor({
    length: 12.0, height: 3.0,
    axles: [{ at: 2.7 }, { at: 8.65, drive: true }],
    doors: [[0.3, 1.6], [5.2, 6.5], [9.9, 11.2]],
    livery: l,
    roof: [[2.6, 4.6, 0.85, 3.25, "pod"]],
  });
}

export const CITELIS_PARAMS = liveryParam(["ratp", "RATP"], ["atm", "ATM Milano"]);

export function citelisSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(CITELIS_PARAMS, {
    ratp: { body: "#e9ecea", skirt: "#00a88f", band: "#15181c", pod: "#e9ecea" },
    atm: { body: "#f2a900", skirt: "#3c3c3c", band: "#15181c", pod: "#f2a900" },
  }, p);
  return lowFloor({
    length: 12.0, height: 3.0,
    axles: [{ at: 2.75 }, { at: 8.65, drive: true }],
    doors: [[0.3, 1.6], [5.1, 6.4], [9.9, 11.2]],
    livery: l, rake: 0.2,
    roof: [[2.6, 4.8, 0.85, 3.25, "pod"]],
  });
}

export const GX337_PARAMS = liveryParam(["ratp", "RATP"], ["tcl", "TCL Lyon"]);

export function gx337Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(GX337_PARAMS, {
    ratp: { body: "#e9ecea", skirt: "#00a88f", band: "#15181c", pod: "#e9ecea" },
    tcl: { body: "#f4f4f1", skirt: "#d3252b", band: "#15181c", pod: "#f4f4f1" },
  }, p);
  return lowFloor({
    length: 12.06, height: 3.1,
    axles: [{ at: 2.7 }, { at: 8.7, drive: true }],
    doors: [[0.3, 1.6], [5.2, 6.5], [9.9, 11.2]],
    livery: l, rake: 0.35,
    roof: [[2.4, 9.4, 0.95, 3.4, "pod"]],
  });
}

export const PR100_PARAMS = liveryParam(["ratp", "RATP"], ["tcl", "TCL Lyon"]);

export function pr100Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(PR100_PARAMS, {
    ratp: { body: "#e9ecea", rub: "#3c3c3c", green: "#1f6b4a" },
    tcl: { body: "#f4f4f1", rub: "#3c3c3c", green: "#d3252b" },
  }, p);
  return highFloor({
    length: 11.4, height: 2.92,
    axles: [{ at: 2.5 }, { at: 8.2, drive: true }],
    doors: [[0.3, 1.5], [4.4, 5.6], [9.2, 10.4]],
    livery: l,
    paint: [[-1, 12.4, 0.35, 0.86, "green"], [-1, 12.4, 0.78, 0.86, "rub"]],
  });
}

export const CROSSWAY_PARAMS = liveryParam(["arriva", "Arriva"], ["postbus", "\u00d6BB Postbus"]);

export function crosswaySpec(p?: ParamValues): WorldBusSpec {
  const l = pick(CROSSWAY_PARAMS, {
    arriva: { body: "#00b0b9", skirt: "#e9e4d0", band: "#15181c" },
    postbus: { body: "#f6c900", skirt: "#d3252b", band: "#15181c" },
  }, p);
  const s = coach({
    length: 12.1, height: 3.18,
    axles: [{ at: 2.7 }, { at: 8.75, drive: true }],
    doors: [[0.5, 1.45], [5.9, 7.1]],
    livery: l, rake: 0.25,
    paint: [[-1, 13, 0.35, 0.62, "skirt"], [-1, 11.8, 1.3, 3.0, "band"]],
  });
  return { ...s, kind: "city", belt: 1.25, pane: { glass: [1.3, s.eave - 0.1], inset: 0.02, glassMat: "glassDark" } };
}

export const I8_PARAMS = liveryParam(["irizar", "Irizar"], ["alsa", "ALSA"]);

export function i8Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(I8_PARAMS, {
    irizar: { body: "#f4f4f2", skirt: "#5c6166", band: "#15181c" },
    alsa: { body: "#f4f4f2", skirt: "#00539b", band: "#15181c" },
  }, p);
  return coach({
    length: 13.0, height: 3.7,
    axles: [{ at: 2.75 }, { at: 9.3, drive: true }],
    doors: [[0.55, 1.5], [6.3, 7.2]],
    livery: l, rake: 0.5,
  });
}

export const URBINO12E_PARAMS = liveryParam(["mpk", "MPK Krak\u00f3w"], ["bvg", "BVG"]);

export function urbino12eSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(URBINO12E_PARAMS, {
    mpk: { body: "#1d4f9c", skirt: "#1d4f9c", band: "#15181c", pod: "#d9dde0" },
    bvg: { body: "#f6cf00", skirt: "#f6cf00", band: "#15181c", pod: "#e9eaea" },
  }, p);
  return lowFloor({
    length: 12.0, height: 2.9,
    axles: [{ at: 2.7 }, { at: 8.6, drive: true }],
    doors: [[0.3, 1.6], [5.1, 6.4], [9.7, 11.0]],
    livery: l,
    // the battery packs over the front half of the roof, the inverters behind
    roof: [[2.4, 7.4, 1.0, 3.28, "pod"], [8.6, 10.4, 0.7, 3.2, "pod"]],
  });
}

export const SM11_PARAMS = liveryParam(["dpp", "DPP Praha"], ["csad", "\u010cSAD"]);

export function sm11Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(SM11_PARAMS, {
    dpp: { body: "#efe3c0", rub: "#3c3c3c", red: "#c42a26" },
    csad: { body: "#efe3c0", rub: "#3c3c3c", red: "#2a5aa8" },
  }, p);
  return highFloor({
    length: 11.04, height: 2.9,
    axles: [{ at: 2.35 }, { at: 7.65, drive: true }],
    doors: [[0.3, 1.5], [4.4, 5.6], [8.9, 10.1]],
    livery: l, rake: 0.05,
    paint: [[-1, 12, 0.35, 0.86, "red"], [-1, 12, 0.78, 0.86, "rub"]],
  });
}

export const NB12_PARAMS = liveryParam(["dpp", "DPP Praha"], ["dpmb", "DPMB Brno"]);

export function nb12Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(NB12_PARAMS, {
    dpp: { body: "#f4f4f1", skirt: "#c42a26", band: "#15181c", pod: "#f4f4f1" },
    dpmb: { body: "#f4f4f1", skirt: "#d3252b", band: "#15181c", pod: "#d9dde0" },
  }, p);
  return lowFloor({
    length: 12.0, height: 3.0,
    axles: [{ at: 2.8 }, { at: 8.7, drive: true }],
    doors: [[0.4, 1.7], [5.1, 6.4], [9.8, 11.1]],
    livery: l, rake: 0.1,
    roof: [[2.6, 4.6, 0.85, 3.25, "pod"]],
  });
}

export function ikarus55Spec(): WorldBusSpec {
  const s = coach({
    length: 9.5, width: 2.5, height: 3.0,
    axles: [{ at: 2.0 }, { at: 6.7, drive: true }],
    doors: [[0.8, 1.6]],
    // cream over red, the rounded nose of the "Lux"
    livery: { body: "#efe6c8", skirt: "#b3202a", band: "#15181c" },
    paint: [[-1, 10.5, 0.35, 1.1, "skirt"]],
    rake: 0.7, mirrors: "arm",
  });
  return { ...s, kind: "coach", belt: 1.3, pane: { glass: [1.45, s.eave - 0.12], surround: [1.4, s.eave - 0.08], inset: 0.05 },
    front: { ...s.front, from: 1.0, chamfer: [0.6, 0.45] }, lamps: { kind: "round", y0: 0.7, y1: 0.9 }, grille: [0.5, 0.95, 0.5] };
}

export function laz695Spec(): WorldBusSpec {
  const s = highFloor({
    length: 9.19, height: 3.0,
    axles: [{ at: 2.3 }, { at: 6.5, drive: true }],
    doors: [[0.3, 1.4], [6.9, 8.0]],
    // cream with a red waist and the roof's glazed edge
    livery: { body: "#efe3c0", rub: "#3c3c3c", red: "#b3202a" },
    paint: [[-1, 10.2, 0.35, 1.0, "red"], [-1, 10.2, 0.78, 0.86, "rub"]],
    rake: 0.35,
  });
  return { ...s, front: { ...s.front, chamfer: [0.45, 0.3] } };
}

export function liaz677Spec(): WorldBusSpec {
  return highFloor({
    length: 10.53, height: 3.0,
    axles: [{ at: 2.5 }, { at: 7.65, drive: true }],
    doors: [[0.4, 1.7], [8.3, 9.6]],
    // the yellow city livery with a cream roof
    livery: { body: "#f2b200", rub: "#3c3c3c", white: "#efe6c8" },
    paint: [[-1, 11.6, 0.78, 0.86, "rub"], [-1, 11.6, 2.62, 3.0, "white"]],
    rake: 0.15,
  });
}

export function liaz5292Spec(): WorldBusSpec {
  return lowFloor({
    length: 12.0, width: 2.5, height: 2.9,
    axles: [{ at: 2.8 }, { at: 8.6, drive: true }],
    doors: [[0.3, 1.6], [5.0, 6.3], [9.7, 11.0]],
    // Mosgortrans white with a blue skirt
    livery: { body: "#f4f4f1", skirt: "#1d4f9c", band: "#15181c", pod: "#f4f4f1" },
    roof: [[2.6, 4.6, 0.85, 3.15, "pod"]],
  });
}

export function ziu9Spec(): WorldBusSpec {
  return highFloor({
    length: 11.83, height: 3.0,
    axles: [{ at: 2.4 }, { at: 8.4, drive: true }],
    doors: [[0.3, 1.6], [4.6, 5.9], [9.8, 11.1]],
    // cream with a red skirt and roof edge
    livery: { body: "#efe6c8", rub: "#3c3c3c", red: "#b3202a" },
    paint: [[-1, 12.9, 0.35, 0.86, "red"], [-1, 12.9, 0.78, 0.86, "rub"], [-1, 12.9, 2.72, 2.87, "red"]],
    trolley: 3.4,
  });
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names (jsModel.ts)

export function leylandAtlantean(p?: ParamValues): MeshBuilder { return worldBus(atlanteanSpec(p)); }
export function leylandAtlanteanLod(p?: ParamValues): MeshBuilder { return worldBusLod(atlanteanSpec(p)); }
export function bristolLodekka(p?: ParamValues): MeshBuilder { return worldBus(lodekkaSpec(p)); }
export function bristolLodekkaLod(p?: ParamValues): MeshBuilder { return worldBusLod(lodekkaSpec(p)); }
export function plaxtonPanorama(p?: ParamValues): MeshBuilder { return worldBus(panoramaSpec(p)); }
export function plaxtonPanoramaLod(p?: ParamValues): MeshBuilder { return worldBusLod(panoramaSpec(p)); }
export function mbO302(p?: ParamValues): MeshBuilder { return worldBus(o302Spec(p)); }
export function mbO302Lod(p?: ParamValues): MeshBuilder { return worldBusLod(o302Spec(p)); }
export function manSl200(p?: ParamValues): MeshBuilder { return worldBus(sl200Spec(p)); }
export function manSl200Lod(p?: ParamValues): MeshBuilder { return worldBusLod(sl200Spec(p)); }
export function neoplanCityliner(): MeshBuilder { return worldBus(cityliner1Spec()); }
export function neoplanCitylinerLod(): MeshBuilder { return worldBusLod(cityliner1Spec()); }
export function bussingD2u(): MeshBuilder { return worldBus(d2uSpec()); }
export function bussingD2uLod(): MeshBuilder { return worldBusLod(d2uSpec()); }
export function cobus3000(p?: ParamValues): MeshBuilder { return worldBus(cobusSpec(p)); }
export function cobus3000Lod(p?: ParamValues): MeshBuilder { return worldBusLod(cobusSpec(p)); }
export function volvo9700(p?: ParamValues): MeshBuilder { return worldBus(volvo9700Spec(p)); }
export function volvo9700Lod(p?: ParamValues): MeshBuilder { return worldBusLod(volvo9700Spec(p)); }
export function vanHoolA330(p?: ParamValues): MeshBuilder { return worldBus(a330Spec(p)); }
export function vanHoolA330Lod(p?: ParamValues): MeshBuilder { return worldBusLod(a330Spec(p)); }
export function vanHoolAstromega(p?: ParamValues): MeshBuilder { return worldBus(astromegaSpec(p)); }
export function vanHoolAstromegaLod(p?: ParamValues): MeshBuilder { return worldBusLod(astromegaSpec(p)); }
export function vdlCitea(p?: ParamValues): MeshBuilder { return worldBus(citeaSpec(p)); }
export function vdlCiteaLod(p?: ParamValues): MeshBuilder { return worldBusLod(citeaSpec(p)); }
export function irisbusCitelis(p?: ParamValues): MeshBuilder { return worldBus(citelisSpec(p)); }
export function irisbusCitelisLod(p?: ParamValues): MeshBuilder { return worldBusLod(citelisSpec(p)); }
export function heuliezGx337(p?: ParamValues): MeshBuilder { return worldBus(gx337Spec(p)); }
export function heuliezGx337Lod(p?: ParamValues): MeshBuilder { return worldBusLod(gx337Spec(p)); }
export function renaultPr100(p?: ParamValues): MeshBuilder { return worldBus(pr100Spec(p)); }
export function renaultPr100Lod(p?: ParamValues): MeshBuilder { return worldBusLod(pr100Spec(p)); }
export function ivecoCrossway(p?: ParamValues): MeshBuilder { return worldBus(crosswaySpec(p)); }
export function ivecoCrosswayLod(p?: ParamValues): MeshBuilder { return worldBusLod(crosswaySpec(p)); }
export function irizarI8(p?: ParamValues): MeshBuilder { return worldBus(i8Spec(p)); }
export function irizarI8Lod(p?: ParamValues): MeshBuilder { return worldBusLod(i8Spec(p)); }
export function solarisUrbino12e(p?: ParamValues): MeshBuilder { return worldBus(urbino12eSpec(p)); }
export function solarisUrbino12eLod(p?: ParamValues): MeshBuilder { return worldBusLod(urbino12eSpec(p)); }
export function karosaSm11(p?: ParamValues): MeshBuilder { return worldBus(sm11Spec(p)); }
export function karosaSm11Lod(p?: ParamValues): MeshBuilder { return worldBusLod(sm11Spec(p)); }
export function sorNb12(p?: ParamValues): MeshBuilder { return worldBus(nb12Spec(p)); }
export function sorNb12Lod(p?: ParamValues): MeshBuilder { return worldBusLod(nb12Spec(p)); }
export function ikarus55(): MeshBuilder { return worldBus(ikarus55Spec()); }
export function ikarus55Lod(): MeshBuilder { return worldBusLod(ikarus55Spec()); }
export function laz695(): MeshBuilder { return worldBus(laz695Spec()); }
export function laz695Lod(): MeshBuilder { return worldBusLod(laz695Spec()); }
export function liaz677(): MeshBuilder { return worldBus(liaz677Spec()); }
export function liaz677Lod(): MeshBuilder { return worldBusLod(liaz677Spec()); }
export function liaz5292(): MeshBuilder { return worldBus(liaz5292Spec()); }
export function liaz5292Lod(): MeshBuilder { return worldBusLod(liaz5292Spec()); }
export function ziu9(): MeshBuilder { return worldBus(ziu9Spec()); }
export function ziu9Lod(): MeshBuilder { return worldBusLod(ziu9Spec()); }

// ---------------------------------------------------------------------------
// the designs

/** The batch, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md). */
export const WORLD_BUS_SPECS_2: readonly WorldBus[] = [
  { id: "veh-leyland-atlantean", title: "Leyland Atlantean", spec: atlanteanSpec, build: leylandAtlantean, buildLod: leylandAtlanteanLod, params: ATLANTEAN_PARAMS, finishParams: ["livery"], game: g(9.5, 127, 70), references: "leyland-atlantean" },
  { id: "veh-bristol-lodekka", title: "Bristol Lodekka", spec: lodekkaSpec, build: bristolLodekka, buildLod: bristolLodekkaLod, params: LODEKKA_PARAMS, finishParams: ["livery"], game: g(8.0, 84, 60), references: "bristol-lodekka" },
  { id: "veh-plaxton-panorama", title: "Plaxton Panorama Elite", spec: panoramaSpec, build: plaxtonPanorama, buildLod: plaxtonPanoramaLod, params: PANORAMA_PARAMS, finishParams: ["livery"], game: g(9.5, 130, 100), references: "plaxton-panorama" },
  { id: "veh-mb-o302", title: "Mercedes-Benz O 302", spec: o302Spec, build: mbO302, buildLod: mbO302Lod, params: O302_PARAMS, finishParams: ["livery"], game: g(10.0, 147, 100), references: "mb-o302" },
  { id: "veh-man-sl200", title: "MAN SL 200", spec: sl200Spec, build: manSl200, buildLod: manSl200Lod, params: SL200_PARAMS, finishParams: ["livery"], game: g(10.0, 141, 70), references: "man-sl200" },
  { id: "veh-neoplan-cityliner", title: "Neoplan Cityliner", spec: cityliner1Spec, build: neoplanCityliner, buildLod: neoplanCitylinerLod, game: g(13.0, 260, 100), references: "neoplan-cityliner" },
  { id: "veh-bussing-d2u", title: "Bussing D2U", spec: d2uSpec, build: bussingD2u, buildLod: bussingD2uLod, game: g(10.0, 110, 60), references: "bussing-d2u" },
  { id: "veh-cobus-3000", title: "Cobus 3000", spec: cobusSpec, build: cobus3000, buildLod: cobus3000Lod, params: COBUS_PARAMS, finishParams: ["livery"], game: g(13.0, 185, 50), references: "cobus-3000" },
  { id: "veh-volvo-9700", title: "Volvo 9700", spec: volvo9700Spec, build: volvo9700, buildLod: volvo9700Lod, params: VOLVO9700_PARAMS, finishParams: ["livery"], game: g(13.0, 309, 100), references: "volvo-9700" },
  { id: "veh-van-hool-a330", title: "Van Hool A330", spec: a330Spec, build: vanHoolA330, buildLod: vanHoolA330Lod, params: A330_PARAMS, finishParams: ["livery"], game: g(11.0, 191, 80), references: "van-hool-a330" },
  { id: "veh-van-hool-astromega", title: "Van Hool TX Astromega", spec: astromegaSpec, build: vanHoolAstromega, buildLod: vanHoolAstromegaLod, params: ASTROMEGA_PARAMS, finishParams: ["livery"], game: g(19.0, 375, 100), references: "van-hool-astromega" },
  { id: "veh-vdl-citea", title: "VDL Citea", spec: citeaSpec, build: vdlCitea, buildLod: vdlCiteaLod, params: CITEA_PARAMS, finishParams: ["livery"], game: g(10.5, 210, 80), references: "vdl-citea" },
  { id: "veh-irisbus-citelis", title: "Irisbus Citelis", spec: citelisSpec, build: irisbusCitelis, buildLod: irisbusCitelisLod, params: CITELIS_PARAMS, finishParams: ["livery"], game: g(11.0, 213, 80), references: "irisbus-citelis" },
  { id: "veh-heuliez-gx337", title: "Heuliez GX 337", spec: gx337Spec, build: heuliezGx337, buildLod: heuliezGx337Lod, params: GX337_PARAMS, finishParams: ["livery"], game: g(11.5, 213, 80), references: "heuliez-gx337" },
  { id: "veh-renault-pr100", title: "Renault PR100", spec: pr100Spec, build: renaultPr100, buildLod: renaultPr100Lod, params: PR100_PARAMS, finishParams: ["livery"], game: g(10.0, 154, 75), references: "renault-pr100" },
  { id: "veh-iveco-crossway", title: "Iveco Crossway", spec: crosswaySpec, build: ivecoCrossway, buildLod: ivecoCrosswayLod, params: CROSSWAY_PARAMS, finishParams: ["livery"], game: g(11.5, 265, 100), references: "iveco-crossway" },
  { id: "veh-irizar-i8", title: "Irizar i8", spec: i8Spec, build: irizarI8, buildLod: irizarI8Lod, params: I8_PARAMS, finishParams: ["livery"], game: g(14.5, 375, 100), references: "irizar-i8" },
  { id: "veh-solaris-urbino-12e", title: "Solaris Urbino 12 Electric", spec: urbino12eSpec, build: solarisUrbino12e, buildLod: solarisUrbino12eLod, params: URBINO12E_PARAMS, finishParams: ["livery"], game: g(13.0, 160, 70), references: "solaris-urbino-12e" },
  { id: "veh-karosa-sm11", title: "Karosa SM 11", spec: sm11Spec, build: karosaSm11, buildLod: karosaSm11Lod, params: SM11_PARAMS, finishParams: ["livery"], game: g(9.0, 154, 70), references: "karosa-sm11" },
  { id: "veh-sor-nb12", title: "SOR NB 12", spec: nb12Spec, build: sorNb12, buildLod: sorNb12Lod, params: NB12_PARAMS, finishParams: ["livery"], game: g(11.0, 213, 80), references: "sor-nb12" },
  { id: "veh-ikarus-55", title: "Ikarus 55", spec: ikarus55Spec, build: ikarus55, buildLod: ikarus55Lod, game: g(8.0, 107, 90), references: "ikarus-55" },
  { id: "veh-laz-695", title: "LAZ-695", spec: laz695Spec, build: laz695, buildLod: laz695Lod, game: g(7.4, 110, 70), references: "laz-695" },
  { id: "veh-liaz-677", title: "LiAZ-677", spec: liaz677Spec, build: liaz677, buildLod: liaz677Lod, game: g(8.4, 132, 70), references: "liaz-677" },
  { id: "veh-liaz-5292", title: "LiAZ-5292", spec: liaz5292Spec, build: liaz5292, buildLod: liaz5292Lod, game: g(11.6, 180, 80), references: "liaz-5292" },
  { id: "veh-ziu-9", title: "ZiU-9", spec: ziu9Spec, build: ziu9, buildLod: ziu9Lod, game: g(10.4, 110, 68), references: "ziu-9" },
];

export const WORLD_BUSES_2: ProceduralDesign[] = WORLD_BUS_SPECS_2.map(worldBusDesign);
