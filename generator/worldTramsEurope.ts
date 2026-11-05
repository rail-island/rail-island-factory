// The world trams of Europe (docs/models/world-trams.md): each a WorldTramSpec on
// the world tram kit (worldTramKit.ts) at its real size, from the shapes of
// worldTramShapes.ts, modelled on the photographs in assets/<references>/ and the
// published figures in each folder's SOURCES.md. The ids are stored in the game's
// saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { worldTram, worldTramLod, tramLodBudget, type WorldTramSpec } from "./worldTramKit.ts";
import {
  arm, bogies, classic, diamond, doorsAt, g, jacobs, lay, liveryParam, lowFloor, lrv, NO_COLLECTOR, pole, portals, pusherPlate, secDoors, tramDesign, guided, truck, vintage, doubleDeck,
  type WorldTram,
} from "./worldTramShapes.ts";

const lod = (s: WorldTramSpec): MeshBuilder => worldTramLod(s, tramLodBudget(s));

/** A unit parameter: the motor car (default) or its trailer. */
const unitParam = (trailerTitle: string): ParamSpec => ({
  name: "unit", title: "Unit", default: "motorCar",
  values: [{ value: "motorCar", title: "Motor car" }, { value: "trailer", title: trailerTitle }],
});
/** A trailer of a motor car's spec: no collector, no head lamps. */
const trailerOf = (s: WorldTramSpec): WorldTramSpec => ({ ...s, collector: NO_COLLECTOR, trailer: true, roofBoxes: [] });

// ---------------------------------------------------------------------------
// Czech and Slovak

export function tatraT1Spec(): WorldTramSpec {
  return classic({
    sections: [14.5], width: 2.4, height: 3.06, front: "pcc",
    doors: doorsAt(1.0, 1.4, 7.0, 12.1),
    trucks: bogies(1.9, 3.9, 10.6),
    collector: diamond(4.6),
    colors: { skirt: "#c8202a", body: "#c8202a", upper: "#ece4cc" },
    // cream below the red belt and over it (the photographed Ostrava car)
    paint: [[0.78, "upper"], [1.55, "body"], [3.5, "upper"]],
    roofBoxes: [[9.8, 11.8, 0.5, 0.3, "roofBox"]],
  });
}

export function tatraT2Spec(): WorldTramSpec {
  return classic({
    sections: [15.2], width: 2.5, height: 3.06, front: "pcc",
    doors: doorsAt(1.1, 1.4, 7.2, 12.6),
    trucks: bogies(1.9, 4.1, 11.1),
    collector: diamond(4.8),
    colors: { skirt: "#c8202a", body: "#c8202a", upper: "#ece4cc" },
    paint: [[0.9, "skirt"], [1.05, "upper"], [1.55, "body"], [3.5, "upper"]],
    roofBoxes: [[10.4, 12.4, 0.5, 0.3, "roofBox"]],
  });
}

export const T4_PARAMS: readonly ParamSpec[] = [unitParam("Trailer B4D")];

export function tatraT4Spec(p?: ParamValues): WorldTramSpec {
  const s = classic({
    sections: [14.0], width: 2.2, height: 3.06,
    doors: [[1.05, 2.25], [6.25, 7.65], [11.75, 12.95]],
    trucks: bogies(1.9, 3.75, 10.25),
    collector: diamond(4.4),
    // Dresden's ivory and red (the photographed Leipzig cars are yellow and white)
    colors: { skirt: "#f2c41a", body: "#f2c41a", upper: "#f4f1e6" },
    paint: [[1.55, "skirt"], [3.5, "upper"]],
    roofBoxes: [[9.5, 11.4, 0.5, 0.3, "roofBox"]],
  });
  return resolveParams(T4_PARAMS, p).unit === "trailer" ? trailerOf(s) : s;
}

export const K2_PARAMS: readonly ParamSpec[] = [liveryParam(["classic", "Classic"], ["modern", "Modern"])];

export function tatraK2Spec(p?: ParamValues): WorldTramSpec {
  const modern = resolveParams(K2_PARAMS, p).livery === "modern";
  return classic({
    sections: [9.95, 9.95], gap: 0.5, width: 2.5, height: 3.15,
    doors: [[1.05, 2.2], [6.0, 7.4], [12.9, 14.3], [18.2, 19.35]],
    trucks: [...bogies(1.9, 3.7, 16.7), ...jacobs(1.9, 10.2)],
    collector: diamond(4.3),
    colors: modern ? { skirt: "#c9242b", body: "#f2f2ee", upper: "#f2f2ee", band: "#5d6266" } : { skirt: "#c9242b", body: "#c9242b", upper: "#efe7cf", band: "#efe7cf" },
    paint: [[1.0, "skirt"], [1.12, "upper"], [1.55, "body"], [2.8, "band"], [3.5, "upper"]],
  });
}

export function tatraT5c5Spec(): WorldTramSpec {
  return classic({
    sections: [14.7], width: 2.5, height: 3.15, front: "angular",
    doors: doorsAt(1.4, 0.55, 6.6, 12.5),
    trucks: bogies(1.9, 3.85, 10.85),
    collector: diamond(4.6),
    colors: { skirt: "#f3c000", body: "#f3c000", upper: "#f3c000" },
    paint: [[3.5, "body"]],
    roofBoxes: [[9.6, 12.2, 0.6, 0.32, "roofBox"]],
  });
}

const PRAGUE_NEW = { skirt: "#d2232a", body: "#f3f3f1", band: "#6a6e72" };

export function skoda14tSpec(): WorldTramSpec {
  const l = lay([7.4, 4.4, 6.0, 4.4, 7.4], 0.4);
  return lowFloor({
    sections: [7.4, 4.4, 6.0, 4.4, 7.4], width: 2.46, height: 3.46, front: "bulb",
    doors: [[2.25, 3.55], ...secDoors(l, 1.3, [1, 1.55], [2, 0.25], [3, 1.55]), [27.6, 28.9]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.at(4, 2.4)),
    collector: arm(l.mid(2) + 0.6),
    colors: PRAGUE_NEW,
    paint: [[0.62, "skirt"], [0.95, "body"], [1.0, "skirt"], [3.6, "body"]],
    roofBoxes: [[0.6, 6.8, 0.95, 0.35, "body"], [24.4, 30.6, 0.95, 0.35, "body"]],
  });
}

export const SKODA_15T_PARAMS: readonly ParamSpec[] = [liveryParam(["prague", "Prague"], ["riga", "Riga"])];

export function skoda15tSpec(p?: ParamValues): WorldTramSpec {
  const riga = resolveParams(SKODA_15T_PARAMS, p).livery === "riga";
  const l = lay([7.6, 7.6, 7.6, 7.6], 0.4);
  return lowFloor({
    sections: [7.6, 7.6, 7.6, 7.6], width: 2.46, height: 3.5, front: "pointed",
    doors: [[1.95, 3.15], ...secDoors(l, 1.3, [1, 0.3], [1, 5.35], [2, 0.3], [2, 5.35]), [l.at(3, 4.6), l.at(3, 5.8)]],
    trucks: bogies(1.8, l.at(0, 4.6), l.mid(1), l.mid(2), l.at(3, 3.0)),
    collector: arm(l.mid(1) + 1.6),
    colors: riga ? { skirt: "#d1222b", body: "#f2f2ef", band: "#1d1f22" } : PRAGUE_NEW,
    paint: [[0.62, "skirt"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.38, "body"], [24.8, 30.6, 0.95, 0.38, "body"]],
  });
}

export function skoda13tSpec(): WorldTramSpec {
  const l = lay([7.6, 4.6, 6.4, 4.6, 7.6], 0.4);
  return lowFloor({
    sections: [7.6, 4.6, 6.4, 4.6, 7.6], width: 2.46, height: 3.47, front: "modern",
    doors: [[2.15, 3.45], ...secDoors(l, 1.3, [1, 1.65], [2, 0.25], [3, 1.65]), [l.at(4, 4.2), l.at(4, 5.5)]],
    trucks: bogies(1.8, l.at(0, 5.1), l.mid(2), l.at(4, 2.5)),
    collector: arm(l.mid(2) + 0.8),
    // Brno's red and white
    colors: { skirt: "#d3242c", body: "#f3f3f1" },
    paint: [[0.95, "skirt"], [3.6, "body"]],
    roofBoxes: [[0.8, 7.0, 0.95, 0.36, "body"], [25.8, 32.0, 0.95, 0.36, "body"]],
  });
}

export function skoda29tSpec(): WorldTramSpec {
  const l = lay([7.4, 4.4, 6.4, 4.4, 7.4], 0.4);
  return lowFloor({
    sections: [7.4, 4.4, 6.4, 4.4, 7.4], width: 2.46, height: 3.55, front: "pointed", doubleEnded: false,
    doors: [[1.95, 3.25], ...secDoors(l, 1.3, [1, 1.55], [2, 0.25], [3, 1.55]), [l.at(4, 4.3), l.at(4, 5.5)]],
    trucks: bogies(1.8, l.at(0, 4.8), l.mid(2), l.at(4, 2.5)),
    collector: arm(l.mid(2) + 0.8),
    // Bratislava's red over white
    colors: { skirt: "#d3242c", body: "#f3f3f1", band: "#d3242c" },
    paint: [[0.95, "skirt"], [3.0, "body"], [3.6, "band"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.36, "body"], [25.4, 31.4, 0.95, 0.36, "body"]],
  });
}

export const SKODA_10T_PARAMS: readonly ParamSpec[] = [liveryParam(["portland", "Portland"], ["tacoma", "Tacoma"])];

export function skoda10tSpec(p?: ParamValues): WorldTramSpec {
  const tacoma = resolveParams(SKODA_10T_PARAMS, p).livery === "tacoma";
  const l = lay([7.8, 3.6, 7.8], 0.4);
  return lowFloor({
    sections: [7.8, 3.6, 7.8], width: 2.46, height: 3.5, front: "modern",
    doors: [[5.2, 6.5], ...secDoors(l, 1.3, [1, 1.15]), [l.at(2, 1.3), l.at(2, 2.6)]],
    trucks: bogies(1.8, 3.6, l.at(2, 4.2)),
    collector: arm(l.mid(1)),
    colors: tacoma ? { skirt: "#1d4f9c", body: "#f2f2ee", band: "#1d4f9c" } : { skirt: "#5c6064", body: "#a6192e", band: "#d9dcde" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.6, 3.0, 0.95, 0.4, "body"], [l.at(2, 4.8), l.at(2, 7.2), 0.95, 0.4, "body"]],
  });
}

export function varioLfSpec(): WorldTramSpec {
  return classic({
    sections: [15.1], width: 2.48, height: 3.15, front: "duewag",
    doors: doorsAt(1.2, 0.95, 6.9, 12.95),
    trucks: bogies(1.8, 3.6, 11.5),
    collector: arm(5.6),
    colors: { skirt: "#d3242c", body: "#f3f3f1", upper: "#f3f3f1", band: "#5c6064" },
    paint: [[0.9, "skirt"], [1.55, "body"], [2.75, "band"], [3.5, "upper"]],
    roofBoxes: [[8.6, 11.0, 0.7, 0.3, "roofBox"]],
    over: { floor: 0.3, doorSill: 0.34, windows: [1.4, 2.66], screen: [1.35, 2.78], pitch: 1.6 },
  });
}

export function ganzCsmgSpec(): WorldTramSpec {
  return classic({
    sections: [13.2, 13.2], gap: 0.5, width: 2.35, height: 3.2, front: "angular", doubleEnded: false,
    doors: [[0.55, 1.95], [6.9, 8.3], [15.0, 16.4], [19.3, 20.7], [25.0, 26.4]],
    trucks: [...bogies(1.9, 4.0, 22.9), ...jacobs(1.9, 13.45)],
    collector: diamond(4.6),
    colors: { skirt: "#f2c200", body: "#f2c200", upper: "#f2c200", band: "#efe9d6" },
    paint: [[1.5, "body"], [1.6, "band"], [3.5, "upper"]],
  });
}

// ---------------------------------------------------------------------------
// German, Austrian, Swiss

export const COMBINO_PARAMS: readonly ParamSpec[] = [
  { name: "length", title: "Length", default: "5", values: [{ value: "3", title: "3 sections" }, { value: "5", title: "5 sections" }, { value: "7", title: "7 sections" }] },
  liveryParam(["basel", "Basel"], ["amsterdam", "Amsterdam"], ["freiburg", "Freiburg"]),
];

/** The Combino's paint: a skirt, a stripe over it, the body, a band along the cant rail. */
const COMBINO_STACK: WorldTramSpec["paint"] = [[0.62, "skirt"], [0.78, "band"], [2.95, "body"], [3.6, "top"]];

const COMBINO_COLORS: Record<string, { colors: Record<string, string>; paint: WorldTramSpec["paint"] }> = {
  basel: { colors: { skirt: "#1c7a3e", band: "#1c7a3e", body: "#1c7a3e", top: "#f2f2ee" }, paint: COMBINO_STACK },
  amsterdam: { colors: { skirt: "#1e3f8c", band: "#d3242c", body: "#f2f2ee", top: "#f2f2ee" }, paint: COMBINO_STACK },
  freiburg: { colors: { skirt: "#d3242c", band: "#d3242c", body: "#f2f2ee", top: "#f2f2ee" }, paint: COMBINO_STACK },
};

export function siemensCombinoSpec(p?: ParamValues): WorldTramSpec {
  const v = resolveParams(COMBINO_PARAMS, p);
  const n = Number(v.length);
  // a cab module and a short bogie module at each end of the line, long floating modules between
  const sections = n === 3 ? [6.4, 6.6, 6.4] : n === 5 ? [6.4, 6.6, 3.9, 6.6, 6.4] : [6.4, 6.6, 3.9, 6.6, 3.9, 6.6, 6.4];
  const l = lay(sections, 0.4);
  const carried = sections.map((_, i) => i).filter((i) => i % 2 === 0);
  const end = sections.length - 1;
  const trucks = carried.map((i) => ({ at: i === 0 ? l.at(0, 3.9) : i === end ? l.at(end, 2.5) : l.mid(i), kind: "bogie" as const, wb: 1.8 }));
  const floating = sections.map((_, i) => i).filter((i) => i % 2 === 1);
  const L = COMBINO_COLORS[v.livery!]!;
  return lowFloor({
    sections, width: 2.3, height: 3.4, front: "flat",
    doors: [[0.75, 2.05], ...floating.flatMap((i) => secDoors(l, 1.3, [i, 0.5], [i, 4.8])), [l.at(end, 4.35), l.at(end, 5.65)]],
    trucks,
    collector: arm(l.mid(Math.floor(sections.length / 2)) + (n === 3 ? 1.4 : 0.6)),
    colors: L.colors, paint: L.paint,
    roofBoxes: [[0.8, 5.9, 0.95, 0.36, "body"], [l.at(end, 0.5), l.at(end, 5.6), 0.95, 0.36, "body"]],
  });
}

export function combinoSupraSpec(): WorldTramSpec {
  const sections = [6.6, 6.6, 3.9, 6.6, 3.9, 6.6, 3.9, 6.6, 6.6];
  const l = lay(sections, 0.4);
  const end = sections.length - 1;
  return lowFloor({
    sections, width: 2.4, height: 3.5, front: "flat",
    doors: [[0.75, 2.05], ...[1, 3, 5, 7].flatMap((i) => secDoors(l, 1.3, [i, 0.5], [i, 4.8])), [l.at(end, 4.55), l.at(end, 5.85)]],
    trucks: [...bogies(1.8, l.at(0, 3.9), l.mid(2), l.mid(4), l.mid(6), l.at(end, 2.7))],
    collector: arm(l.mid(4) + 0.6),
    colors: { skirt: "#f2c300", body: "#f2c300", band: "#ffffff" },
    paint: [[3.6, "body"]],
    roofBoxes: [[0.8, 6.0, 0.95, 0.36, "body"], [l.at(end, 0.6), l.at(end, 5.8), 0.95, 0.36, "body"]],
  });
}

export const AVENIO_PARAMS: readonly ParamSpec[] = [liveryParam(["munich", "Munich"], ["hague", "The Hague"])];

export function siemensAvenioSpec(p?: ParamValues): WorldTramSpec {
  const hague = resolveParams(AVENIO_PARAMS, p).livery === "hague";
  const sections = [9.2, 9.2, 9.2, 9.2];
  const l = lay(sections, 0.45);
  return lowFloor({
    sections, gap: 0.45, width: 2.4, height: 3.55, front: "pointed",
    doors: [[1.85, 3.15], ...[1, 2].flatMap((i) => secDoors(l, 1.3, [i, 1.0], [i, 6.9])), [l.at(3, 5.9), l.at(3, 7.2)]],
    trucks: bogies(1.8, l.at(0, 5.4), l.mid(1), l.mid(2), l.at(3, 3.8)),
    collector: arm(l.mid(1) + 1.5),
    colors: hague ? { skirt: "#c8102e", body: "#f0ece2", band: "#c8102e" } : { skirt: "#1d5fae", body: "#f3f3f1", band: "#1d5fae" },
    paint: [[0.62, "skirt"], [0.95, "band"], [3.6, "body"]],
    roofBoxes: [[0.6, 7.8, 0.95, 0.35, "body"], [l.at(3, 1.4), l.at(3, 8.6), 0.95, 0.35, "body"]],
  });
}

export const ULF_PARAMS: readonly ParamSpec[] = [{ name: "length", title: "Length", default: "a", values: [{ value: "a", title: "ULF A" }, { value: "b", title: "ULF B" }] }];

export function viennaUlfSpec(p?: ParamValues): WorldTramSpec {
  const b = resolveParams(ULF_PARAMS, p).length === "b";
  // the portals stand under the joints; every section hangs between them
  const sections = b ? [4.2, 5.3, 5.3, 5.3, 5.3, 5.3, 4.2] : [4.2, 5.3, 5.3, 5.3, 4.2];
  const l = lay(sections, 0.5);
  const n = sections.length;
  return lowFloor({
    sections, gap: 0.5, width: 2.4, height: 3.3, front: "flat",
    doors: [[1.0, 2.3], ...Array.from({ length: n - 2 }, (_, k) => k + 1).filter((i) => i % 2 === 1).flatMap((i) => secDoors(l, 1.3, [i, 2.0])), [l.at(n - 1, 1.9), l.at(n - 1, 3.2)]],
    trucks: portals(...Array.from({ length: n - 1 }, (_, i) => l.joint(i))),
    collector: arm(l.mid(Math.floor(n / 2))),
    colors: { skirt: "#d3242c", body: "#f2f2ee", band: "#d3242c" },
    paint: [[0.62, "skirt"], [2.95, "body"], [3.6, "band"]],
    over: { floor: 0.18, doorSill: 0.22, wheelRadius: 0.3, maxBendDeg: 25 },
    roofBoxes: [[0.6, 3.6, 0.95, 0.36, "body"], [l.at(n - 1, 0.6), l.at(n - 1, 3.6), 0.95, 0.36, "body"]],
  });
}

export const E1_PARAMS: readonly ParamSpec[] = [unitParam("Trailer c4")];

const VIENNA = { skirt: "#d3242c", body: "#d3242c", upper: "#f2efe6" };

export function viennaE1Spec(p?: ParamValues): WorldTramSpec {
  if (resolveParams(E1_PARAMS, p).unit === "trailer")
    // the c4: a rigid four-axle trailer
    return trailerOf(classic({
      sections: [14.6], width: 2.2, height: 3.05, front: "duewag",
      doors: [[0.95, 2.15], [6.7, 8.0], [12.45, 13.65]],
      trucks: bogies(1.8, 3.6, 11.0),
      collector: NO_COLLECTOR,
      colors: VIENNA, paint: [[1.55, "body"], [3.5, "upper"]],
    }));
  return classic({
    sections: [9.6, 9.6], gap: 0.45, width: 2.2, height: 3.1, front: "duewag",
    doors: [[1.0, 2.3], [7.1, 8.4], [11.3, 12.6], [17.3, 18.6]],
    trucks: [...bogies(1.8, 4.6, 15.05), ...jacobs(1.8, 9.82)],
    collector: arm(4.0),
    colors: VIENNA, paint: [[1.55, "body"], [3.5, "upper"]],
    roofBoxes: [[13.0, 15.5, 0.6, 0.3, "roofBox"]],
  });
}

export function viennaFlexitySpec(): WorldTramSpec {
  const sections = [7.0, 6.4, 6.4, 6.4, 7.0];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.4, height: 3.4, front: "modern", doubleEnded: false,
    doors: [[2.15, 3.45], ...secDoors(l, 1.3, [1, 0.3], [1, 4.8], [3, 0.3], [3, 4.8]), [l.at(4, 3.6), l.at(4, 4.9)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2) - 1.3, l.mid(2) + 1.3, l.at(4, 2.0)),
    collector: arm(l.mid(1) + 1.2),
    colors: { skirt: "#d3242c", body: "#f2f2ee", band: "#d3242c" },
    paint: [[0.62, "skirt"], [2.95, "body"], [3.6, "band"]],
    roofBoxes: [[0.8, 6.4, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.2), 0.95, 0.36, "body"]],
  });
}

export const GT8_PARAMS: readonly ParamSpec[] = [liveryParam(["rheinbahn", "Rheinbahn"], ["heidelberg", "Heidelberg"])];

export function duewagGt8Spec(p?: ParamValues): WorldTramSpec {
  const hd = resolveParams(GT8_PARAMS, p).livery === "heidelberg";
  return classic({
    sections: [10.1, 5.6, 10.1], gap: 0.45, width: 2.35, height: 3.2, front: "duewag",
    doors: [[1.0, 2.3], [6.6, 7.9], [11.8, 13.1], [18.6, 19.9], [24.3, 25.6]],
    trucks: [...bogies(1.8, 4.3, 22.5), ...jacobs(1.8, 10.32, 16.38)],
    collector: diamond(4.2),
    colors: hd ? { skirt: "#2d4f9c", body: "#f2efe2", upper: "#f2efe2" } : { skirt: "#c9242b", body: "#f2ead2", upper: "#f2ead2" },
    paint: [[1.0, "skirt"], [3.5, "body"]],
  });
}

export const U2_PARAMS: readonly ParamSpec[] = [liveryParam(["frankfurt", "Frankfurt"], ["edmonton", "Edmonton"], ["calgary", "Calgary"])];

export function duewagU2Spec(p?: ParamValues): WorldTramSpec {
  const v = resolveParams(U2_PARAMS, p).livery;
  return lrv({
    sections: [11.1, 11.1], gap: 0.5, width: 2.65, height: 3.7,
    doors: [[1.0, 2.3], [7.5, 8.8], [13.9, 15.2], [20.4, 21.7]],
    trucks: [...bogies(1.8, 4.5, 18.2), ...jacobs(1.8, 11.35)],
    collector: arm(4.9),
    colors: v === "edmonton" ? { skirt: "#1d4f9c", body: "#f2f2ee" } : v === "calgary" ? { skirt: "#c8102e", body: "#f2f2ee" } : { skirt: "#c8102e", body: "#f2ead2" },
    paint: [[1.4, "skirt"], [3.9, "body"]],
  });
}

export function duewagB80Spec(): WorldTramSpec {
  return lrv({
    sections: [13.8, 13.8], gap: 0.55, width: 2.65, height: 3.5,
    doors: [[1.0, 2.3], [8.4, 9.7], [18.6, 19.9], [25.9, 27.2]],
    trucks: [...bogies(2.1, 5.2, 22.95), ...jacobs(2.1, 14.07)],
    collector: arm(4.6),
    colors: { skirt: "#d3242c", body: "#f2f2ee", band: "#d3242c" },
    paint: [[1.15, "skirt"], [3.0, "body"], [3.9, "band"]],
  });
}

export const GOTHA_PARAMS: readonly ParamSpec[] = [unitParam("Trailer B2-62")];

export function gothaT262Spec(p?: ParamValues): WorldTramSpec {
  const s = classic({
    sections: [10.9], width: 2.2, height: 3.1, front: "retro", gauge: 1000,
    doors: doorsAt(1.2, 0.75, 9.0),
    trucks: truck(3.0, 5.45),
    collector: diamond(5.0, 1.05),
    colors: { skirt: "#e8d8a8", body: "#c7232a", upper: "#efe4c4" },
    paint: [[0.95, "skirt"], [1.55, "body"], [3.5, "upper"]],
  });
  return resolveParams(GOTHA_PARAMS, p).unit === "trailer" ? trailerOf(s) : s;
}

export const BERLIN_FLEXITY_PARAMS: readonly ParamSpec[] = [{ name: "length", title: "Length", default: "short", values: [{ value: "short", title: "Short" }, { value: "long", title: "Long" }] }];

export function berlinFlexitySpec(p?: ParamValues): WorldTramSpec {
  const long = resolveParams(BERLIN_FLEXITY_PARAMS, p).length === "long";
  const sections = long ? [7.0, 4.2, 6.0, 4.2, 6.0, 4.2, 7.0] : [7.0, 4.2, 6.0, 4.2, 7.0];
  const l = lay(sections, 0.4);
  const end = sections.length - 1;
  const carried = sections.map((_, i) => i).filter((i) => i % 2 === 0);
  return lowFloor({
    sections, width: 2.4, height: 3.6, front: "modern",
    doors: [[2.15, 3.45], ...sections.map((_, i) => i).filter((i) => i % 2 === 1).flatMap((i) => secDoors(l, 1.3, [i, 1.45])), [l.at(end, 3.55), l.at(end, 4.85)]],
    trucks: carried.map((i) => ({ at: i === 0 ? l.at(0, 4.9) : i === end ? l.at(end, 2.1) : l.mid(i), kind: "bogie" as const, wb: 1.8 })),
    collector: arm(l.mid(2) + 1.2),
    colors: { skirt: "#f0c300", body: "#f0c300", band: "#ffffff" },
    paint: [[3.6, "body"]],
    roofBoxes: [[0.8, 6.4, 0.95, 0.36, "body"], [l.at(end, 0.6), l.at(end, 6.2), 0.95, 0.36, "body"]],
  });
}

export const VARIOBAHN_PARAMS: readonly ParamSpec[] = [liveryParam(["munich", "Munich"], ["graz", "Graz"])];

export function stadlerVariobahnSpec(p?: ParamValues): WorldTramSpec {
  const graz = resolveParams(VARIOBAHN_PARAMS, p).livery === "graz";
  const sections = [6.8, 6.2, 4.2, 6.2, 6.8];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.3, height: 3.4, front: "flat",
    doors: [[0.75, 2.05], ...secDoors(l, 1.3, [1, 0.4], [1, 4.5], [3, 0.4], [3, 4.5]), [l.at(4, 4.75), l.at(4, 6.05)]],
    trucks: bogies(1.6, l.at(0, 4.0), l.mid(2), l.at(4, 2.8)),
    collector: arm(l.mid(2) + 0.5),
    colors: graz ? { skirt: "#d3242c", body: "#f2f2ee", band: "#d3242c" } : { skirt: "#1d5fae", body: "#f2f2ee", band: "#1d5fae" },
    paint: [[0.62, "skirt"], [0.95, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.2, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.0), 0.95, 0.36, "body"]],
  });
}

export const TANGO_PARAMS: readonly ParamSpec[] = [liveryParam(["geneva", "Geneva"], ["basel", "Basel"])];

export function stadlerTangoSpec(p?: ParamValues): WorldTramSpec {
  const basel = resolveParams(TANGO_PARAMS, p).livery === "basel";
  const sections = [10.6, 10.6, 10.6, 10.6];
  const l = lay(sections, 0.45);
  return lowFloor({
    sections, gap: 0.45, width: 2.3, height: 3.5, front: "pointed",
    doors: [[1.85, 3.15], [l.at(0, 7.6), l.at(0, 8.9)], ...[1, 2].flatMap((i) => secDoors(l, 1.3, [i, 0.6], [i, 8.7])), [l.at(3, 1.7), l.at(3, 3.0)], [l.at(3, 7.45), l.at(3, 8.75)]],
    trucks: bogies(1.8, l.at(0, 5.3), l.mid(1), l.mid(2), l.at(3, 5.3)),
    collector: arm(l.mid(1) + 1.6),
    colors: basel ? { skirt: "#1c7a3e", band: "#1c7a3e", body: "#1c7a3e", top: "#f2f2ee" } : { skirt: "#c8102e", band: "#6f7377", body: "#f2f2ee", top: "#f2f2ee" },
    paint: [[0.62, "skirt"], [0.98, "band"], [2.95, "body"], [3.6, "top"]],
    roofBoxes: [[0.6, 9.6, 0.95, 0.36, "body"], [l.at(3, 1.0), l.at(3, 10.0), 0.95, 0.36, "body"]],
  });
}

const ZURICH = { skirt: "#0a58a6", body: "#f2f2ee", band: "#0a58a6" };

export function zurichCobraSpec(): WorldTramSpec {
  const sections = [7.4, 7.0, 6.6, 7.0, 7.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.4, height: 3.6, front: "pointed", doubleEnded: false, gauge: 1000,
    doors: [[1.85, 3.15], ...secDoors(l, 1.3, [1, 0.5], [1, 5.2], [3, 0.5], [3, 5.2]), [l.at(4, 4.3), l.at(4, 5.6)]],
    trucks: bogies(1.8, l.at(0, 4.9), l.mid(2), l.at(4, 2.5)),
    collector: arm(l.mid(2) + 0.5),
    colors: ZURICH,
    paint: [[0.62, "band"], [2.95, "body"], [3.6, "band"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.38, "body"], [l.at(4, 0.6), l.at(4, 6.8), 0.95, 0.38, "body"]],
  });
}

export function zurichTram2000Spec(): WorldTramSpec {
  return classic({
    sections: [10.6, 10.6], gap: 0.45, width: 2.2, height: 3.3, front: "angular", gauge: 1000,
    doors: [[0.55, 1.85], [6.6, 7.9], [13.0, 14.3], [19.6, 20.9]],
    trucks: [...bogies(1.8, 3.6, 18.1), ...jacobs(1.8, 10.82)],
    collector: arm(4.4),
    colors: ZURICH,
    paint: [[0.9, "band"], [3.5, "body"]],
    over: { pitch: 1.8, windows: [1.5, 2.85], screen: [1.45, 2.95] },
  });
}

export function swissStandardTramSpec(): WorldTramSpec {
  return classic({
    sections: [13.75], width: 2.2, height: 3.1, front: "pcc", doubleEnded: true, gauge: 1000,
    doors: doorsAt(1.2, 1.4, 11.15),
    trucks: bogies(1.8, 4.3, 9.45),
    collector: diamond(6.9, 1.05),
    colors: ZURICH,
    paint: [[1.55, "band"], [3.5, "body"]],
    over: { pitch: 1.1 },
  });
}

// ---------------------------------------------------------------------------
// Benelux, Iberia, Italy, France

export function brusselsPccSpec(): WorldTramSpec {
  return classic({
    sections: [9.6, 7.6, 9.6], gap: 0.5, width: 2.2, height: 3.2, front: "pcc", doubleEnded: true,
    doors: [[1.4, 2.7], [11.3, 12.6], [15.0, 16.3], [24.6, 25.9]],
    trucks: [...bogies(1.8, 4.3, 23.0), ...jacobs(1.8, 9.85, 17.95)],
    collector: arm(4.9),
    colors: { skirt: "#f2c300", body: "#f2c300", upper: "#f2e9c8" },
    paint: [[1.55, "body"], [3.5, "upper"]],
  });
}
/** A three-section layout. */
function l3(a: number, b: number, gap: number): ReturnType<typeof lay> { return lay([a, b, a], gap); }

export function amsterdam9gSpec(): WorldTramSpec {
  return classic({
    sections: [10.1, 10.1], gap: 0.45, width: 2.35, height: 3.25, front: "duewag",
    doors: [[1.0, 2.3], [6.6, 7.9], [12.6, 13.9], [18.3, 19.6]],
    trucks: [...bogies(1.8, 4.3, 16.35), ...jacobs(1.8, 10.32)],
    collector: arm(4.0),
    colors: { skirt: "#1e3f8c", body: "#f2f2ee", upper: "#f2f2ee", band: "#d3242c" },
    paint: [[0.95, "skirt"], [1.1, "band"], [3.5, "body"]],
  });
}

export function hagueGtl8Spec(): WorldTramSpec {
  return classic({
    sections: [10.4, 7.0, 10.4], gap: 0.45, width: 2.35, height: 3.3, front: "duewag",
    doors: [[1.0, 2.3], [6.9, 8.2], [12.1, 13.4], [15.0, 16.3], [19.6, 20.9], [25.5, 26.8]],
    trucks: [...bogies(1.8, 4.2, 23.9), ...jacobs(1.8, 10.62, 18.08)],
    collector: arm(4.9),
    colors: { skirt: "#c8102e", body: "#c8102e", upper: "#efe6cf" },
    paint: [[1.55, "skirt"], [3.5, "upper"]],
  });
}

export function lisbonRemodeladoSpec(): WorldTramSpec {
  return vintage({
    sections: [8.4], width: 2.3, height: 3.25, gauge: 900,
    doors: doorsAt(0.8, 0.75, 6.85),
    trucks: truck(2.5, 4.2),
    collector: pole(3.0, 4.6),
    colors: { body: "#f2c317", upper: "#f2e6c8" },
    paint: [[1.5, "body"], [3.5, "upper"]],
  });
}

export function milanVentottoSpec(): WorldTramSpec {
  return vintage({
    sections: [13.6], width: 2.35, height: 3.35, front: "retro", doubleEnded: false, gauge: 1445,
    // the Peter Witt plan: board at the front door, pay at the middle, leave there
    doors: doorsAt(1.0, 0.75, 6.2, 11.7),
    trucks: bogies(1.6, 3.3, 10.3),
    collector: diamond(6.8, 1.05),
    colors: { body: "#ee8a1d", upper: "#efe2c2" },
    paint: [[1.5, "body"], [3.5, "upper"]],
    over: { pitch: 1.05 },
  });
}

export const SIRIO_PARAMS: readonly ParamSpec[] = [liveryParam(["florence", "Florence"], ["milan", "Milan"], ["gothenburg", "Gothenburg"])];

export function florenceSirioSpec(p?: ParamValues): WorldTramSpec {
  const v = resolveParams(SIRIO_PARAMS, p).livery;
  const sections = [7.4, 4.4, 7.2, 4.4, 7.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.4, height: 3.4, front: "modern",
    doors: [[2.15, 3.45], ...secDoors(l, 1.3, [1, 1.55], [2, 0.25], [2, 5.65], [3, 1.55]), [l.at(4, 4.0), l.at(4, 5.3)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.at(4, 2.4)),
    collector: arm(l.mid(2) + 0.5),
    colors: v === "milan" ? { skirt: "#ee8a1d", body: "#ee8a1d", band: "#f2f2ee" } : v === "gothenburg" ? { skirt: "#1d5fae", body: "#f2f2ee", band: "#1d5fae" } : { skirt: "#5c6064", body: "#f2f2ee", band: "#c8102e" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.6), 0.95, 0.36, "body"]],
  });
}

export const CITADIS_PARAMS: readonly ParamSpec[] = [liveryParam(["bordeaux", "Bordeaux"], ["dublin", "Dublin"], ["dubai", "Dubai"])];

/** The Citadis 402: seven sections, bogies under the cab sections and the third and fifth. */
export function citadis402(colors: Record<string, string>, paint: WorldTramSpec["paint"], o: { width?: number; collector?: WorldTramSpec["collector"] } = {}): WorldTramSpec {
  const sections = [7.5, 4.6, 6.4, 4.6, 6.4, 4.6, 7.5];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: o.width ?? 2.4, height: 3.3, front: "modern",
    doors: [[2.15, 3.45], ...[1, 3, 5].flatMap((i) => secDoors(l, 1.3, [i, 1.65])), [l.at(6, 4.1), l.at(6, 5.4)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.mid(4), l.at(6, 2.5)),
    collector: o.collector ?? arm(l.mid(3)),
    colors, paint,
    roofBoxes: [[0.8, 6.9, 0.95, 0.36, "body"], [l.at(2, 0.4), l.at(2, 6.0), 0.95, 0.36, "body"], [l.at(6, 0.6), l.at(6, 6.7), 0.95, 0.36, "body"]],
  });
}

export function alstomCitadisSpec(p?: ParamValues): WorldTramSpec {
  const v = resolveParams(CITADIS_PARAMS, p).livery;
  if (v === "dublin") return citadis402({ skirt: "#5c6064", body: "#d9dcde", band: "#6d2077" }, [[0.62, "skirt"], [0.82, "band"], [3.6, "body"]]);
  if (v === "dubai") return citadis402({ skirt: "#5c6064", body: "#e9ecef", band: "#1d5fae" }, [[0.62, "skirt"], [0.82, "band"], [3.6, "body"]], { width: 2.65 });
  return citadis402({ skirt: "#4a4d51", body: "#d9dcde", band: "#a7aaad" }, [[0.62, "skirt"], [2.95, "body"], [3.6, "band"]]);
}

export const CITADIS_X05_PARAMS: readonly ParamSpec[] = [liveryParam(["sydney", "Sydney"], ["nice", "Nice"])];

export function citadisX05Spec(p?: ParamValues): WorldTramSpec {
  const nice = resolveParams(CITADIS_X05_PARAMS, p).livery === "nice";
  const sections = [7.4, 5.4, 6.4, 5.4, 7.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.65, height: 3.3, front: "modern",
    doors: [[2.15, 3.45], ...secDoors(l, 1.4, [1, 0.3], [1, 3.7], [3, 0.3], [3, 3.7]), [l.at(4, 3.9), l.at(4, 5.3)]],
    trucks: bogies(1.8, l.at(0, 5.1), l.mid(2), l.at(4, 2.3)),
    collector: arm(l.mid(2) + 0.6),
    colors: nice ? { skirt: "#5c6064", body: "#e9ecef", band: "#1d5fae" } : { skirt: "#c8102e", body: "#dcdee0", band: "#c8102e" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.6), 0.95, 0.36, "body"]],
  });
}

export function alstomTfsSpec(): WorldTramSpec {
  const l = lay([12.0, 5.3, 12.0], 0.5);
  return lrv({
    sections: [12.0, 5.3, 12.0], width: 2.3, height: 3.3, front: "modern",
    doors: [[2.2, 3.5], [7.6, 8.9], ...secDoors(l, 1.3, [1, 2.0]), [l.at(2, 2.9), l.at(2, 4.2)], [l.at(2, 8.5), l.at(2, 9.8)]],
    trucks: bogies(1.8, 5.6, l.at(0, 10.6), l.at(2, 1.4), l.at(2, 6.4)),
    collector: arm(5.1),
    colors: { skirt: "#5c6064", body: "#f2f2ee", band: "#2b8a3e" },
    paint: [[0.95, "skirt"], [1.1, "band"], [3.9, "body"]],
    over: { floor: 0.36, doorSill: 0.4, windows: [1.45, 2.8], screen: [1.1, 2.9] },
  });
}

export function translohrSpec(): WorldTramSpec {
  const sections = [6.6, 4.4, 6.4, 4.4, 6.6];
  const l = lay(sections, 0.35);
  return lowFloor({
    sections, gap: 0.35, width: 2.2, height: 2.89, front: "pointed",
    doors: [[1.85, 3.05], ...secDoors(l, 1.2, [1, 0.25], [2, 2.6], [3, 0.25]), [l.at(4, 3.55), l.at(4, 4.75)]],
    trucks: guided(l.at(0, 4.6), l.mid(1), l.mid(3), l.at(4, 2.0)),
    collector: arm(l.mid(2) + 1.0),
    colors: { skirt: "#5c6064", body: "#f2f2ee", band: "#c8102e" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    over: { floor: 0.25, doorSill: 0.3, wheelRadius: 0.36 },
  });
}

export const URBOS_PARAMS: readonly ParamSpec[] = [liveryParam(["edinburgh", "Edinburgh"], ["belgrade", "Belgrade"], ["kaohsiung", "Kaohsiung"])];

export function cafUrbosSpec(p?: ParamValues): WorldTramSpec {
  const v = resolveParams(URBOS_PARAMS, p).livery;
  const sections = [7.6, 4.4, 6.8, 4.4, 6.8, 4.4, 7.6];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.65, height: 3.4, front: "pointed",
    doors: [[1.85, 3.15], ...[1, 3, 5].flatMap((i) => secDoors(l, 1.3, [i, 1.55])), [l.at(6, 4.5), l.at(6, 5.8)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.mid(4), l.at(6, 2.6)),
    collector: v === "kaohsiung" ? NO_COLLECTOR : arm(l.mid(3)),
    colors: v === "belgrade" ? { skirt: "#c8102e", body: "#f2f2ee", band: "#c8102e" } : v === "kaohsiung" ? { skirt: "#2b8a3e", body: "#f2f2ee", band: "#2b8a3e" } : { skirt: "#1d1f22", body: "#f2f2ee", band: "#b5121b" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 7.0, 0.95, 0.36, "body"], [l.at(2, 0.4), l.at(2, 6.4), 0.95, 0.38, "body"], [l.at(6, 0.6), l.at(6, 6.8), 0.95, 0.36, "body"]],
  });
}

// ---------------------------------------------------------------------------
// Bombardier and British

export const FLEXITY_OUTLOOK_PARAMS: readonly ParamSpec[] = [liveryParam(["brussels", "Brussels"], ["marseille", "Marseille"], ["innsbruck", "Innsbruck"])];

export function flexityOutlookSpec(p?: ParamValues): WorldTramSpec {
  const v = resolveParams(FLEXITY_OUTLOOK_PARAMS, p).livery;
  const sections = [7.0, 5.6, 6.0, 5.6, 7.0];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.3, height: 3.45, front: "modern",
    doors: [[2.15, 3.45], ...secDoors(l, 1.3, [1, 0.3], [1, 4.0], [3, 0.3], [3, 4.0]), [l.at(4, 3.6), l.at(4, 4.9)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.at(4, 2.0)),
    collector: arm(l.mid(2) + 0.6),
    colors: v === "marseille" ? { skirt: "#1d1f22", body: "#c9ccce", band: "#1d1f22" } : v === "innsbruck" ? { skirt: "#c8102e", body: "#f2f2ee", band: "#c8102e" } : { skirt: "#5c6064", body: "#f2f2ee", band: "#f2c300" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.4, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.2), 0.95, 0.36, "body"]],
  });
}

export function croydonCr4000Spec(): WorldTramSpec {
  const l = lay([12.6, 4.2, 12.6], 0.4);
  return lrv({
    sections: [12.6, 4.2, 12.6], gap: 0.4, width: 2.65, height: 3.5, front: "duewag",
    doors: [[1.0, 2.3], [7.0, 8.3], [l.at(2, 4.3), l.at(2, 5.6)], [l.at(2, 10.3), l.at(2, 11.6)]],
    trucks: bogies(1.8, 4.6, l.mid(1), l.at(2, 8.0)),
    collector: arm(9.6),
    colors: { skirt: "#5c6064", body: "#f2f2ee", band: "#2b8a3e" },
    paint: [[1.0, "skirt"], [1.2, "band"], [3.9, "body"]],
  });
}

export function blackpoolBalloonSpec(): WorldTramSpec {
  return doubleDeck({
    sections: [12.8], width: 2.29, height: 4.75, front: "pcc", doubleEnded: true,
    doors: doorsAt(1.1, 5.85),
    trucks: bogies(1.5, 3.3, 9.5),
    collector: pole(6.4, 4.6),
    colors: { skirt: "#1f6b3a", body: "#efe6c8", upper: "#efe6c8" },
    paint: [[1.25, "skirt"], [2.25, "body"], [2.9, "skirt"], [4.6, "upper"]],
    over: { pitch: 1.1 },
  });
}

export function blackpoolFlexitySpec(): WorldTramSpec {
  const sections = [7.4, 5.0, 6.6, 5.0, 7.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.65, height: 3.4, front: "modern",
    doors: [[2.15, 3.45], ...secDoors(l, 1.3, [1, 0.3], [1, 3.4], [3, 0.3], [3, 3.4]), [l.at(4, 4.0), l.at(4, 5.3)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.at(4, 2.4)),
    collector: arm(l.mid(2) + 0.6),
    colors: { skirt: "#4b2a7b", body: "#f2f2ee", band: "#4b2a7b" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.8), 0.95, 0.36, "body"]],
  });
}

export function sheffieldSupertramSpec(): WorldTramSpec {
  return lrv({
    sections: [12.4, 9.0, 12.4], gap: 0.5, width: 2.65, height: 3.6, front: "duewag",
    doors: [[1.0, 2.3], [7.2, 8.5], [l3(12.4, 9.0, 0.5).at(1, 3.85), l3(12.4, 9.0, 0.5).at(1, 5.15)], [l3(12.4, 9.0, 0.5).at(2, 3.9), l3(12.4, 9.0, 0.5).at(2, 5.2)], [l3(12.4, 9.0, 0.5).at(2, 10.1), l3(12.4, 9.0, 0.5).at(2, 11.4)]],
    trucks: [...bogies(1.8, 4.7, 30.1), ...jacobs(1.8, 12.65, 22.15)],
    collector: arm(l3(12.4, 9.0, 0.5).mid(1)),
    colors: { skirt: "#1f3f8f", body: "#f2f2ee", band: "#e8551e" },
    paint: [[1.0, "skirt"], [1.2, "band"], [3.9, "body"]],
  });
}

export function nottinghamIncentroSpec(): WorldTramSpec {
  const sections = [7.4, 5.2, 6.6, 5.2, 7.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.4, height: 3.4, front: "modern",
    doors: [[2.15, 3.45], ...secDoors(l, 1.3, [1, 0.3], [1, 3.6], [3, 0.3], [3, 3.6]), [l.at(4, 4.0), l.at(4, 5.3)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.at(4, 2.4)),
    collector: arm(l.mid(2) + 0.6),
    colors: { skirt: "#1d1f22", body: "#c9ccce", band: "#2b8a3e" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.8), 0.95, 0.36, "body"]],
  });
}

// ---------------------------------------------------------------------------
// Poland, the Soviet Union and its successors, Romania, Croatia, Turkey

export function konstal105nSpec(): WorldTramSpec {
  return classic({
    sections: [13.5], width: 2.4, height: 3.1, front: "angular",
    doors: doorsAt(1.25, 0.5, 4.95, 7.3, 11.75),
    trucks: bogies(1.8, 3.35, 10.15),
    collector: diamond(4.5),
    colors: { skirt: "#c8102e", body: "#f2c300", upper: "#f2c300" },
    paint: [[0.95, "skirt"], [3.5, "body"]],
    over: { pitch: 1.4 },
  });
}

export const SWING_PARAMS: readonly ParamSpec[] = [liveryParam(["warsaw", "Warsaw"], ["krakow", "Krakow"])];

export function pesaSwingSpec(p?: ParamValues): WorldTramSpec {
  const krakow = resolveParams(SWING_PARAMS, p).livery === "krakow";
  const sections = [7.4, 5.2, 6.6, 5.2, 7.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.4, height: 3.5, front: "pointed", doubleEnded: false,
    doors: [[1.85, 3.15], ...secDoors(l, 1.3, [1, 0.3], [1, 3.6], [3, 0.3], [3, 3.6]), [l.at(4, 4.3), l.at(4, 5.6)]],
    trucks: bogies(1.8, l.at(0, 4.8), l.mid(2), l.at(4, 2.6)),
    collector: arm(l.mid(2) + 0.6),
    colors: krakow ? { skirt: "#1d2f6e", body: "#f2f2ee", band: "#1d2f6e" } : { skirt: "#c8102e", body: "#f2c300", band: "#c8102e" },
    paint: [[0.62, "skirt"], [0.95, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.8), 0.95, 0.36, "body"]],
  });
}

export const TRAMINO_PARAMS: readonly ParamSpec[] = [liveryParam(["poznan", "Poznan"], ["jena", "Jena"])];

export function solarisTraminoSpec(p?: ParamValues): WorldTramSpec {
  const jena = resolveParams(TRAMINO_PARAMS, p).livery === "jena";
  const sections = [7.4, 5.2, 6.6, 5.2, 7.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.4, height: 3.4, front: "modern",
    doors: [[2.15, 3.45], ...secDoors(l, 1.3, [1, 0.3], [1, 3.6], [3, 0.3], [3, 3.6]), [l.at(4, 4.0), l.at(4, 5.3)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.at(4, 2.4)),
    collector: arm(l.mid(2) + 0.6),
    colors: jena ? { skirt: "#c8102e", body: "#f2f2ee", band: "#c8102e" } : { skirt: "#2b8a3e", body: "#f2f2ee", band: "#f2c300" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.8), 0.95, 0.36, "body"]],
  });
}

const SOVIET = { skirt: "#c8102e", body: "#c8102e", upper: "#efe6cf" };

export function ktm5Spec(): WorldTramSpec {
  return classic({
    sections: [15.0], width: 2.6, height: 3.05, front: "angular",
    doors: doorsAt(1.4, 0.55, 6.8, 13.05),
    trucks: bogies(1.94, 3.9, 11.1),
    collector: diamond(4.6),
    colors: SOVIET,
    paint: [[1.55, "body"], [3.5, "upper"]],
    over: { pitch: 1.55 },
  });
}

export function lm68Spec(): WorldTramSpec {
  return classic({
    sections: [15.0], width: 2.55, height: 3.2, front: "duewag",
    doors: doorsAt(1.4, 1.0, 6.8, 12.6),
    trucks: bogies(1.94, 3.95, 11.05),
    collector: diamond(4.6),
    colors: SOVIET,
    paint: [[1.55, "body"], [3.5, "upper"]],
  });
}

export function vityazMSpec(): WorldTramSpec {
  const sections = [10.0, 6.0, 10.0];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.5, height: 3.45, front: "pointed", doubleEnded: false,
    doors: [[1.85, 3.15], [l.at(0, 7.5), l.at(0, 8.8)], ...secDoors(l, 1.3, [1, 0.25]), [l.at(1, 4.45), l.at(1, 5.75)], [l.at(2, 1.0), l.at(2, 2.3)], [l.at(2, 6.75), l.at(2, 8.05)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(1), l.at(2, 4.5)),
    collector: arm(l.mid(1) + 1.5),
    colors: { skirt: "#1d4f9c", body: "#f2f2ee", band: "#1d4f9c" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 9.4, 0.95, 0.36, "body"], [l.at(2, 0.6), l.at(2, 9.2), 0.95, 0.36, "body"]],
  });
}

export function electronT5l64Spec(): WorldTramSpec {
  const sections = [6.6, 3.6, 4.4, 3.6, 6.6];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.5, height: 3.5, front: "modern", doubleEnded: false,
    doors: [[2.15, 3.45], ...secDoors(l, 1.3, [1, 1.15], [3, 1.15]), [l.at(4, 3.2), l.at(4, 4.5)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.at(4, 1.6)),
    collector: arm(l.mid(2) + 0.4),
    colors: { skirt: "#c8102e", body: "#f2f2ee", band: "#c8102e" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
  });
}

export function bucharestV3aSpec(): WorldTramSpec {
  return classic({
    sections: [10.6, 4.8, 10.6], gap: 0.45, width: 2.4, height: 3.2, front: "angular",
    doors: [[0.55, 1.95], [6.6, 8.0], [12.3, 13.7], [17.55, 18.95], [24.5, 25.9]],
    trucks: [...bogies(1.8, 3.7, 23.0), ...jacobs(1.8, 10.82, 16.07)],
    collector: diamond(4.8),
    colors: { skirt: "#c8102e", body: "#c8102e", upper: "#f2d000" },
    paint: [[1.55, "body"], [3.5, "upper"]],
  });
}

export function koncarTmk2200Spec(): WorldTramSpec {
  const sections = [7.4, 5.2, 6.6, 5.2, 7.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.3, height: 3.4, front: "pointed", doubleEnded: false, gauge: 1000,
    doors: [[1.85, 3.15], ...secDoors(l, 1.3, [1, 0.3], [1, 3.6], [3, 0.3], [3, 3.6]), [l.at(4, 4.3), l.at(4, 5.6)]],
    trucks: bogies(1.8, l.at(0, 4.8), l.mid(2), l.at(4, 2.6)),
    collector: arm(l.mid(2) + 0.6),
    colors: { skirt: "#1d4f9c", body: "#1d4f9c", band: "#f2f2ee" },
    paint: [[0.95, "skirt"], [1.05, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.8), 0.95, 0.36, "body"]],
  });
}

export function durmazlarSilkwormSpec(): WorldTramSpec {
  const sections = [7.4, 5.2, 6.6, 5.2, 7.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.65, height: 3.45, front: "bulb",
    doors: [[2.25, 3.55], ...secDoors(l, 1.3, [1, 0.3], [1, 3.6], [3, 0.3], [3, 3.6]), [l.at(4, 3.85), l.at(4, 5.15)]],
    trucks: bogies(1.8, l.at(0, 5.1), l.mid(2), l.at(4, 2.3)),
    collector: arm(l.mid(2) + 0.6),
    colors: { skirt: "#2b8a3e", body: "#f2f2ee", band: "#2b8a3e" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 6.8, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.8), 0.95, 0.36, "body"]],
  });
}

// ---------------------------------------------------------------------------
// the Nordic countries

const HELSINKI = { skirt: "#00754a", body: "#00754a", upper: "#f2c300", band: "#f2f2ee" };

export function helsinkiArticSpec(): WorldTramSpec {
  const sections = [9.4, 8.0, 9.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.4, height: 3.6, front: "pointed", doubleEnded: false, gauge: 1000,
    doors: [[1.85, 3.15], [l.at(0, 7.4), l.at(0, 8.7)], ...secDoors(l, 1.3, [1, 0.3], [1, 6.4]), [l.at(2, 0.4), l.at(2, 1.7)], [l.at(2, 6.3), l.at(2, 7.6)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(1), l.at(2, 4.0)),
    collector: arm(l.mid(1) + 1.4),
    colors: HELSINKI,
    paint: [[0.95, "skirt"], [3.6, "band"]],
    over: { colors: { ...HELSINKI, doorLeaf: "#00754a" } },
    roofBoxes: [[0.8, 8.8, 0.95, 0.36, "body"], [l.at(2, 0.6), l.at(2, 8.8), 0.95, 0.36, "body"]],
  });
}

export function helsinkiValmetSpec(): WorldTramSpec {
  return classic({
    sections: [9.8, 9.8], gap: 0.45, width: 2.3, height: 3.3, front: "angular", gauge: 1000,
    doors: [[0.55, 1.85], [6.3, 7.6], [12.0, 13.3], [18.15, 19.45]],
    trucks: [...bogies(1.8, 3.5, 16.55), ...jacobs(1.8, 10.02)],
    collector: arm(4.4),
    colors: HELSINKI,
    paint: [[1.55, "body"], [3.5, "upper"]],
  });
}

export function osloSl79Spec(): WorldTramSpec {
  return classic({
    sections: [10.6, 10.6], gap: 0.45, width: 2.5, height: 3.3, front: "duewag",
    doors: [[1.0, 2.3], [6.9, 8.2], [12.9, 14.2], [19.0, 20.3]],
    trucks: [...bogies(1.8, 4.2, 17.45), ...jacobs(1.8, 10.82)],
    collector: arm(4.6),
    colors: { skirt: "#1d4f9c", body: "#1d4f9c", upper: "#efe6cf" },
    paint: [[1.55, "body"], [3.5, "upper"]],
  });
}

export function gothenburgM29Spec(): WorldTramSpec {
  return classic({
    sections: [15.0], width: 2.65, height: 3.3, front: "duewag",
    doors: doorsAt(1.3, 1.0, 6.9, 12.7),
    trucks: bogies(1.8, 3.95, 11.05),
    collector: arm(4.6),
    colors: { skirt: "#1d5fae", body: "#1d5fae", upper: "#f2f2ee" },
    paint: [[1.55, "body"], [3.5, "upper"]],
  });
}

// ---------------------------------------------------------------------------
// historic and later European

export function istanbulNostalgicSpec(): WorldTramSpec {
  return vintage({
    sections: [8.8], width: 2.2, height: 3.3,
    doors: doorsAt(0.8, 0.75, 7.25),
    trucks: truck(2.8, 4.4),
    collector: pole(3.2, 4.6),
    colors: { body: "#a8202a", upper: "#efe2c2" },
    paint: [[1.5, "body"], [3.5, "upper"]],
  });
}

export function triesteOpicinaSpec(): WorldTramSpec {
  return vintage({
    sections: [11.0], width: 2.2, height: 3.3, gauge: 1000,
    doors: doorsAt(0.8, 0.75, 9.45),
    trucks: bogies(1.6, 3.0, 8.0),
    collector: diamond(5.5, 1.05),
    colors: { body: "#1d4f9c", upper: "#efe6cf" },
    paint: [[1.5, "body"], [3.5, "upper"]],
    over: { extra: pusherPlate(10.82), extraFeatures: ["pusher-buffer"] },
  });
}

export function budapestGanzUvSpec(): WorldTramSpec {
  return classic({
    sections: [14.4], width: 2.3, height: 3.15, front: "duewag",
    doors: doorsAt(1.2, 1.0, 6.6, 12.2),
    trucks: bogies(1.9, 3.9, 10.5),
    collector: diamond(4.6),
    colors: { skirt: "#f2c200", body: "#f2c200", upper: "#f2c200" },
    paint: [[3.5, "body"]],
  });
}

export function skoda16tSpec(): WorldTramSpec {
  const l = lay([7.4, 4.4, 6.0, 4.4, 7.4], 0.4);
  return lowFloor({
    sections: [7.4, 4.4, 6.0, 4.4, 7.4], width: 2.4, height: 3.46, front: "bulb", doubleEnded: false,
    doors: [[2.25, 3.55], ...secDoors(l, 1.3, [1, 1.55], [2, 0.25], [3, 1.55]), [27.6, 28.9]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.at(4, 2.4)),
    collector: arm(l.mid(2) + 0.6),
    // Wroclaw's white with blue and red
    colors: { skirt: "#1d4f9c", body: "#f3f3f1", band: "#c8102e" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    roofBoxes: [[0.6, 6.8, 0.95, 0.35, "body"], [24.4, 30.6, 0.95, 0.35, "body"]],
  });
}

export function strasbourgEurotramSpec(): WorldTramSpec {
  const sections = [6.0, 3.9, 5.2, 3.9, 5.2, 3.9, 6.0];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.4, height: 3.4, front: "bulb",
    doors: [...[1, 3, 5].flatMap((i) => secDoors(l, 1.3, [i, 1.3]))],
    trucks: bogies(1.8, l.at(0, 3.6), l.mid(2), l.mid(4), l.at(6, 2.4)),
    collector: arm(l.mid(3)),
    colors: { skirt: "#5c6064", body: "#e3e5e6", band: "#9aa0a6" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
    // the bay windows: glazing almost to the floor
    over: { windows: [0.75, 3.0], pitch: 2.0 },
  });
}

export const MONTPELLIER_PARAMS: readonly ParamSpec[] = [liveryParam(["line1", "Swallows"], ["line2", "Flowers"])];

export function montpellierCitadisSpec(p?: ParamValues): WorldTramSpec {
  const flowers = resolveParams(MONTPELLIER_PARAMS, p).livery === "line2";
  const sections = [7.6, 4.6, 6.6, 4.6, 7.6];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.65, height: 3.3, front: "modern",
    doors: [[2.15, 3.45], ...secDoors(l, 1.3, [1, 1.65], [3, 1.65]), [l.at(4, 4.2), l.at(4, 5.5)]],
    trucks: bogies(1.8, l.at(0, 5.0), l.mid(2), l.at(4, 2.6)),
    collector: arm(l.mid(2) + 0.6),
    colors: flowers ? { skirt: "#f2f2ee", body: "#f2f2ee", band: "#e8551e" } : { skirt: "#1d4f9c", body: "#1d4f9c", band: "#f2f2ee" },
    paint: [[0.85, "skirt"], [0.98, "band"], [3.6, "body"]],
    roofBoxes: [[0.8, 7.0, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 7.0), 0.95, 0.36, "body"]],
  });
}

export function gmundenVarioSpec(): WorldTramSpec {
  const sections = [11.2, 8.6, 11.2];
  const l = lay(sections, 0.45);
  return lowFloor({
    sections, gap: 0.45, width: 2.4, height: 3.4, front: "flat", gauge: 1000,
    doors: [[0.75, 2.05], [l.at(0, 7.6), l.at(0, 8.9)], ...secDoors(l, 1.3, [1, 0.4], [1, 6.9]), [l.at(2, 2.3), l.at(2, 3.6)], [l.at(2, 9.15), l.at(2, 10.45)]],
    trucks: bogies(1.8, l.at(0, 4.8), l.mid(1), l.at(2, 6.4)),
    collector: arm(l.mid(1) + 2.0),
    colors: { skirt: "#c8102e", body: "#f2f2ee", band: "#c8102e" },
    paint: [[0.62, "skirt"], [0.85, "band"], [3.6, "body"]],
  });
}

export function tatraK2yuSpec(): WorldTramSpec {
  return classic({
    sections: [9.95, 9.95], gap: 0.5, width: 2.5, height: 3.15,
    doors: [[1.05, 2.2], [6.0, 7.4], [12.9, 14.3], [18.2, 19.35]],
    trucks: [...bogies(1.9, 3.7, 16.7), ...jacobs(1.9, 10.2)],
    collector: diamond(4.3),
    colors: { skirt: "#e8641e", body: "#e8641e", upper: "#efe6cf" },
    paint: [[1.55, "body"], [3.5, "upper"]],
  });
}

export function turin2800Spec(): WorldTramSpec {
  return classic({
    sections: [10.0, 10.0], gap: 0.45, width: 2.3, height: 3.3, front: "duewag",
    doors: [[1.0, 2.3], [6.3, 7.6], [12.9, 14.2], [18.1, 19.4]],
    trucks: [...bogies(1.8, 4.3, 16.15), ...jacobs(1.8, 10.22)],
    collector: diamond(4.0),
    colors: { skirt: "#ee8a1d", body: "#ee8a1d", upper: "#ee8a1d" },
    paint: [[3.5, "body"]],
  });
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names: the JS model imports a
// design's builders by name from this module (jsModel.ts)

export function tatraT1(): MeshBuilder { return worldTram(tatraT1Spec()); }
export function tatraT1Lod(): MeshBuilder { return lod(tatraT1Spec()); }
export function tatraT2(): MeshBuilder { return worldTram(tatraT2Spec()); }
export function tatraT2Lod(): MeshBuilder { return lod(tatraT2Spec()); }
export function tatraT4(p?: ParamValues): MeshBuilder { return worldTram(tatraT4Spec(p)); }
export function tatraT4Lod(p?: ParamValues): MeshBuilder { return lod(tatraT4Spec(p)); }
export function tatraK2(p?: ParamValues): MeshBuilder { return worldTram(tatraK2Spec(p)); }
export function tatraK2Lod(p?: ParamValues): MeshBuilder { return lod(tatraK2Spec(p)); }
export function tatraT5c5(): MeshBuilder { return worldTram(tatraT5c5Spec()); }
export function tatraT5c5Lod(): MeshBuilder { return lod(tatraT5c5Spec()); }
export function skoda14t(): MeshBuilder { return worldTram(skoda14tSpec()); }
export function skoda14tLod(): MeshBuilder { return lod(skoda14tSpec()); }
export function skoda15t(p?: ParamValues): MeshBuilder { return worldTram(skoda15tSpec(p)); }
export function skoda15tLod(p?: ParamValues): MeshBuilder { return lod(skoda15tSpec(p)); }
export function skoda13t(): MeshBuilder { return worldTram(skoda13tSpec()); }
export function skoda13tLod(): MeshBuilder { return lod(skoda13tSpec()); }
export function skoda29t(): MeshBuilder { return worldTram(skoda29tSpec()); }
export function skoda29tLod(): MeshBuilder { return lod(skoda29tSpec()); }
export function skoda10t(p?: ParamValues): MeshBuilder { return worldTram(skoda10tSpec(p)); }
export function skoda10tLod(p?: ParamValues): MeshBuilder { return lod(skoda10tSpec(p)); }
export function varioLf(): MeshBuilder { return worldTram(varioLfSpec()); }
export function varioLfLod(): MeshBuilder { return lod(varioLfSpec()); }
export function ganzCsmg(): MeshBuilder { return worldTram(ganzCsmgSpec()); }
export function ganzCsmgLod(): MeshBuilder { return lod(ganzCsmgSpec()); }
export function siemensCombino(p?: ParamValues): MeshBuilder { return worldTram(siemensCombinoSpec(p)); }
export function siemensCombinoLod(p?: ParamValues): MeshBuilder { return lod(siemensCombinoSpec(p)); }
export function combinoSupra(): MeshBuilder { return worldTram(combinoSupraSpec()); }
export function combinoSupraLod(): MeshBuilder { return lod(combinoSupraSpec()); }
export function siemensAvenio(p?: ParamValues): MeshBuilder { return worldTram(siemensAvenioSpec(p)); }
export function siemensAvenioLod(p?: ParamValues): MeshBuilder { return lod(siemensAvenioSpec(p)); }
export function viennaUlf(p?: ParamValues): MeshBuilder { return worldTram(viennaUlfSpec(p)); }
export function viennaUlfLod(p?: ParamValues): MeshBuilder { return lod(viennaUlfSpec(p)); }
export function viennaE1(p?: ParamValues): MeshBuilder { return worldTram(viennaE1Spec(p)); }
export function viennaE1Lod(p?: ParamValues): MeshBuilder { return lod(viennaE1Spec(p)); }
export function viennaFlexity(): MeshBuilder { return worldTram(viennaFlexitySpec()); }
export function viennaFlexityLod(): MeshBuilder { return lod(viennaFlexitySpec()); }
export function duewagGt8(p?: ParamValues): MeshBuilder { return worldTram(duewagGt8Spec(p)); }
export function duewagGt8Lod(p?: ParamValues): MeshBuilder { return lod(duewagGt8Spec(p)); }
export function duewagU2(p?: ParamValues): MeshBuilder { return worldTram(duewagU2Spec(p)); }
export function duewagU2Lod(p?: ParamValues): MeshBuilder { return lod(duewagU2Spec(p)); }
export function duewagB80(): MeshBuilder { return worldTram(duewagB80Spec()); }
export function duewagB80Lod(): MeshBuilder { return lod(duewagB80Spec()); }
export function gothaT262(p?: ParamValues): MeshBuilder { return worldTram(gothaT262Spec(p)); }
export function gothaT262Lod(p?: ParamValues): MeshBuilder { return lod(gothaT262Spec(p)); }
export function berlinFlexity(p?: ParamValues): MeshBuilder { return worldTram(berlinFlexitySpec(p)); }
export function berlinFlexityLod(p?: ParamValues): MeshBuilder { return lod(berlinFlexitySpec(p)); }
export function stadlerVariobahn(p?: ParamValues): MeshBuilder { return worldTram(stadlerVariobahnSpec(p)); }
export function stadlerVariobahnLod(p?: ParamValues): MeshBuilder { return lod(stadlerVariobahnSpec(p)); }
export function stadlerTango(p?: ParamValues): MeshBuilder { return worldTram(stadlerTangoSpec(p)); }
export function stadlerTangoLod(p?: ParamValues): MeshBuilder { return lod(stadlerTangoSpec(p)); }
export function zurichCobra(): MeshBuilder { return worldTram(zurichCobraSpec()); }
export function zurichCobraLod(): MeshBuilder { return lod(zurichCobraSpec()); }
export function zurichTram2000(): MeshBuilder { return worldTram(zurichTram2000Spec()); }
export function zurichTram2000Lod(): MeshBuilder { return lod(zurichTram2000Spec()); }
export function swissStandardTram(): MeshBuilder { return worldTram(swissStandardTramSpec()); }
export function swissStandardTramLod(): MeshBuilder { return lod(swissStandardTramSpec()); }
export function brusselsPcc(): MeshBuilder { return worldTram(brusselsPccSpec()); }
export function brusselsPccLod(): MeshBuilder { return lod(brusselsPccSpec()); }
export function amsterdam9g(): MeshBuilder { return worldTram(amsterdam9gSpec()); }
export function amsterdam9gLod(): MeshBuilder { return lod(amsterdam9gSpec()); }
export function hagueGtl8(): MeshBuilder { return worldTram(hagueGtl8Spec()); }
export function hagueGtl8Lod(): MeshBuilder { return lod(hagueGtl8Spec()); }
export function lisbonRemodelado(): MeshBuilder { return worldTram(lisbonRemodeladoSpec()); }
export function lisbonRemodeladoLod(): MeshBuilder { return lod(lisbonRemodeladoSpec()); }
export function milanVentotto(): MeshBuilder { return worldTram(milanVentottoSpec()); }
export function milanVentottoLod(): MeshBuilder { return lod(milanVentottoSpec()); }
export function florenceSirio(p?: ParamValues): MeshBuilder { return worldTram(florenceSirioSpec(p)); }
export function florenceSirioLod(p?: ParamValues): MeshBuilder { return lod(florenceSirioSpec(p)); }
export function alstomCitadis(p?: ParamValues): MeshBuilder { return worldTram(alstomCitadisSpec(p)); }
export function alstomCitadisLod(p?: ParamValues): MeshBuilder { return lod(alstomCitadisSpec(p)); }
export function citadisX05(p?: ParamValues): MeshBuilder { return worldTram(citadisX05Spec(p)); }
export function citadisX05Lod(p?: ParamValues): MeshBuilder { return lod(citadisX05Spec(p)); }
export function alstomTfs(): MeshBuilder { return worldTram(alstomTfsSpec()); }
export function alstomTfsLod(): MeshBuilder { return lod(alstomTfsSpec()); }
export function translohr(): MeshBuilder { return worldTram(translohrSpec()); }
export function translohrLod(): MeshBuilder { return lod(translohrSpec()); }
export function cafUrbos(p?: ParamValues): MeshBuilder { return worldTram(cafUrbosSpec(p)); }
export function cafUrbosLod(p?: ParamValues): MeshBuilder { return lod(cafUrbosSpec(p)); }
export function flexityOutlook(p?: ParamValues): MeshBuilder { return worldTram(flexityOutlookSpec(p)); }
export function flexityOutlookLod(p?: ParamValues): MeshBuilder { return lod(flexityOutlookSpec(p)); }
export function croydonCr4000(): MeshBuilder { return worldTram(croydonCr4000Spec()); }
export function croydonCr4000Lod(): MeshBuilder { return lod(croydonCr4000Spec()); }
export function blackpoolBalloon(): MeshBuilder { return worldTram(blackpoolBalloonSpec()); }
export function blackpoolBalloonLod(): MeshBuilder { return lod(blackpoolBalloonSpec()); }
export function blackpoolFlexity(): MeshBuilder { return worldTram(blackpoolFlexitySpec()); }
export function blackpoolFlexityLod(): MeshBuilder { return lod(blackpoolFlexitySpec()); }
export function sheffieldSupertram(): MeshBuilder { return worldTram(sheffieldSupertramSpec()); }
export function sheffieldSupertramLod(): MeshBuilder { return lod(sheffieldSupertramSpec()); }
export function nottinghamIncentro(): MeshBuilder { return worldTram(nottinghamIncentroSpec()); }
export function nottinghamIncentroLod(): MeshBuilder { return lod(nottinghamIncentroSpec()); }
export function konstal105n(): MeshBuilder { return worldTram(konstal105nSpec()); }
export function konstal105nLod(): MeshBuilder { return lod(konstal105nSpec()); }
export function pesaSwing(p?: ParamValues): MeshBuilder { return worldTram(pesaSwingSpec(p)); }
export function pesaSwingLod(p?: ParamValues): MeshBuilder { return lod(pesaSwingSpec(p)); }
export function solarisTramino(p?: ParamValues): MeshBuilder { return worldTram(solarisTraminoSpec(p)); }
export function solarisTraminoLod(p?: ParamValues): MeshBuilder { return lod(solarisTraminoSpec(p)); }
export function ktm5(): MeshBuilder { return worldTram(ktm5Spec()); }
export function ktm5Lod(): MeshBuilder { return lod(ktm5Spec()); }
export function lm68(): MeshBuilder { return worldTram(lm68Spec()); }
export function lm68Lod(): MeshBuilder { return lod(lm68Spec()); }
export function vityazM(): MeshBuilder { return worldTram(vityazMSpec()); }
export function vityazMLod(): MeshBuilder { return lod(vityazMSpec()); }
export function electronT5l64(): MeshBuilder { return worldTram(electronT5l64Spec()); }
export function electronT5l64Lod(): MeshBuilder { return lod(electronT5l64Spec()); }
export function bucharestV3a(): MeshBuilder { return worldTram(bucharestV3aSpec()); }
export function bucharestV3aLod(): MeshBuilder { return lod(bucharestV3aSpec()); }
export function koncarTmk2200(): MeshBuilder { return worldTram(koncarTmk2200Spec()); }
export function koncarTmk2200Lod(): MeshBuilder { return lod(koncarTmk2200Spec()); }
export function durmazlarSilkworm(): MeshBuilder { return worldTram(durmazlarSilkwormSpec()); }
export function durmazlarSilkwormLod(): MeshBuilder { return lod(durmazlarSilkwormSpec()); }
export function helsinkiArtic(): MeshBuilder { return worldTram(helsinkiArticSpec()); }
export function helsinkiArticLod(): MeshBuilder { return lod(helsinkiArticSpec()); }
export function helsinkiValmet(): MeshBuilder { return worldTram(helsinkiValmetSpec()); }
export function helsinkiValmetLod(): MeshBuilder { return lod(helsinkiValmetSpec()); }
export function osloSl79(): MeshBuilder { return worldTram(osloSl79Spec()); }
export function osloSl79Lod(): MeshBuilder { return lod(osloSl79Spec()); }
export function gothenburgM29(): MeshBuilder { return worldTram(gothenburgM29Spec()); }
export function gothenburgM29Lod(): MeshBuilder { return lod(gothenburgM29Spec()); }
export function istanbulNostalgic(): MeshBuilder { return worldTram(istanbulNostalgicSpec()); }
export function istanbulNostalgicLod(): MeshBuilder { return lod(istanbulNostalgicSpec()); }
export function triesteOpicina(): MeshBuilder { return worldTram(triesteOpicinaSpec()); }
export function triesteOpicinaLod(): MeshBuilder { return lod(triesteOpicinaSpec()); }
export function budapestGanzUv(): MeshBuilder { return worldTram(budapestGanzUvSpec()); }
export function budapestGanzUvLod(): MeshBuilder { return lod(budapestGanzUvSpec()); }
export function skoda16t(): MeshBuilder { return worldTram(skoda16tSpec()); }
export function skoda16tLod(): MeshBuilder { return lod(skoda16tSpec()); }
export function strasbourgEurotram(): MeshBuilder { return worldTram(strasbourgEurotramSpec()); }
export function strasbourgEurotramLod(): MeshBuilder { return lod(strasbourgEurotramSpec()); }
export function montpellierCitadis(p?: ParamValues): MeshBuilder { return worldTram(montpellierCitadisSpec(p)); }
export function montpellierCitadisLod(p?: ParamValues): MeshBuilder { return lod(montpellierCitadisSpec(p)); }
export function gmundenVario(): MeshBuilder { return worldTram(gmundenVarioSpec()); }
export function gmundenVarioLod(): MeshBuilder { return lod(gmundenVarioSpec()); }
export function tatraK2yu(): MeshBuilder { return worldTram(tatraK2yuSpec()); }
export function tatraK2yuLod(): MeshBuilder { return lod(tatraK2yuSpec()); }
export function turin2800(): MeshBuilder { return worldTram(turin2800Spec()); }
export function turin2800Lod(): MeshBuilder { return lod(turin2800Spec()); }

// ---------------------------------------------------------------------------
// the designs, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md)

const T = (id: string, title: string, spec: WorldTram["spec"], build: WorldTram["build"], buildLod: WorldTram["buildLod"], game: WorldTram["game"], extra: Partial<WorldTram> = {}): WorldTram =>
  ({ id: `veh-${id}`, title, spec, build, buildLod, game, references: id, ...extra });

export const EUROPE_TRAM_SPECS: readonly WorldTram[] = [
  T("tatra-t1", "Tatra T1", tatraT1Spec, tatraT1, tatraT1Lod, g(15.8, 160, 60)),
  T("tatra-t2", "Tatra T2", tatraT2Spec, tatraT2, tatraT2Lod, g(16.5, 160, 55)),
  T("tatra-t4", "Tatra T4D", tatraT4Spec, tatraT4, tatraT4Lod, g(16.0, 176, 55, [{ params: { unit: "trailer" }, weight: 10.5, power: 0 }]), { params: T4_PARAMS }),
  T("tatra-k2", "Tatra K2", tatraK2Spec, tatraK2, tatraK2Lod, g(22.0, 160, 65), { params: K2_PARAMS, finishParams: ["livery"] }),
  T("tatra-t5c5", "Tatra T5C5", tatraT5c5Spec, tatraT5c5, tatraT5c5Lod, g(18.0, 176, 65)),
  T("skoda-14t", "Skoda 14T", skoda14tSpec, skoda14t, skoda14tLod, g(39.0, 540, 60)),
  T("skoda-15t", "Skoda 15T ForCity", skoda15tSpec, skoda15t, skoda15tLod, g(41.0, 600, 60), { params: SKODA_15T_PARAMS, finishParams: ["livery"] }),
  T("skoda-13t", "Skoda 13T", skoda13tSpec, skoda13t, skoda13tLod, g(39.0, 540, 70)),
  T("skoda-29t", "Skoda 29T", skoda29tSpec, skoda29t, skoda29tLod, g(40.0, 600, 70)),
  T("skoda-10t", "Skoda 10T", skoda10tSpec, skoda10t, skoda10tLod, g(28.8, 360, 70), { params: SKODA_10T_PARAMS, finishParams: ["livery"] }),
  T("vario-lf", "Vario LF", varioLfSpec, varioLf, varioLfLod, g(19.0, 320, 60)),
  T("ganz-csmg", "Ganz CSMG", ganzCsmgSpec, ganzCsmg, ganzCsmgLod, g(29.0, 260, 60)),
  T("siemens-combino", "Siemens Combino", siemensCombinoSpec, siemensCombino, siemensCombinoLod, g(32.0, 400, 70, [{ params: { length: "3" }, weight: 20.0, power: 200 }, { params: { length: "7" }, weight: 45.0, power: 600 }]), { params: COMBINO_PARAMS, finishParams: ["livery"] }),
  T("siemens-combino-supra", "Siemens Combino Supra", combinoSupraSpec, combinoSupra, combinoSupraLod, g(64.0, 800, 70)),
  T("siemens-avenio", "Siemens Avenio", siemensAvenioSpec, siemensAvenio, siemensAvenioLod, g(42.0, 560, 80), { params: AVENIO_PARAMS, finishParams: ["livery"] }),
  T("siemens-ulf", "Vienna ULF", viennaUlfSpec, viennaUlf, viennaUlfLod, g(29.0, 320, 70, [{ params: { length: "b" }, weight: 42.0, power: 480 }]), { params: ULF_PARAMS }),
  T("vienna-e1", "Vienna Type E1", viennaE1Spec, viennaE1, viennaE1Lod, g(21.0, 300, 70, [{ params: { unit: "trailer" }, weight: 10.5, power: 0 }]), { params: E1_PARAMS }),
  T("vienna-flexity", "Vienna Flexity", viennaFlexitySpec, viennaFlexity, viennaFlexityLod, g(43.0, 560, 70)),
  T("duewag-gt8", "Duewag GT8", duewagGt8Spec, duewagGt8, duewagGt8Lod, g(31.0, 300, 70), { params: GT8_PARAMS, finishParams: ["livery"] }),
  T("duewag-u2", "Duewag U2", duewagU2Spec, duewagU2, duewagU2Lod, g(31.5, 300, 80), { params: U2_PARAMS, finishParams: ["livery"] }),
  T("duewag-b80", "Stadtbahnwagen B", duewagB80Spec, duewagB80, duewagB80Lod, g(39.0, 470, 100)),
  T("gotha-t2-62", "Gothawagen T2-62", gothaT262Spec, gothaT262, gothaT262Lod, g(12.5, 120, 55, [{ params: { unit: "trailer" }, weight: 8.0, power: 0 }]), { params: GOTHA_PARAMS }),
  T("berlin-flexity", "Berlin Flexity", berlinFlexitySpec, berlinFlexity, berlinFlexityLod, g(39.0, 360, 70, [{ params: { length: "long" }, weight: 50.0, power: 480 }]), { params: BERLIN_FLEXITY_PARAMS }),
  T("stadler-variobahn", "Stadler Variobahn", stadlerVariobahnSpec, stadlerVariobahn, stadlerVariobahnLod, g(39.0, 480, 70), { params: VARIOBAHN_PARAMS, finishParams: ["livery"] }),
  T("stadler-tango", "Stadler Tango", stadlerTangoSpec, stadlerTango, stadlerTangoLod, g(60.0, 1000, 70), { params: TANGO_PARAMS, finishParams: ["livery"] }),
  T("zurich-cobra", "Zurich Cobra Be 5/6", zurichCobraSpec, zurichCobra, zurichCobraLod, g(39.0, 600, 65)),
  T("zurich-tram-2000", "Zurich Tram 2000", zurichTram2000Spec, zurichTram2000, zurichTram2000Lod, g(26.0, 300, 65)),
  T("swiss-standard-tram", "Swiss Standard Tram", swissStandardTramSpec, swissStandardTram, swissStandardTramLod, g(17.0, 240, 50)),
  T("brussels-pcc", "Brussels PCC 7900", brusselsPccSpec, brusselsPcc, brusselsPccLod, g(29.0, 300, 65)),
  T("amsterdam-9g", "Amsterdam 9G", amsterdam9gSpec, amsterdam9g, amsterdam9gLod, g(21.0, 200, 60)),
  T("hague-gtl8", "HTM GTL8", hagueGtl8Spec, hagueGtl8, hagueGtl8Lod, g(31.5, 300, 70)),
  T("lisbon-remodelado", "Lisbon Remodelado", lisbonRemodeladoSpec, lisbonRemodelado, lisbonRemodeladoLod, g(10.5, 70, 50)),
  T("milan-ventotto", "Milan Ventotto", milanVentottoSpec, milanVentotto, milanVentottoLod, g(16.5, 160, 50)),
  T("florence-sirio", "AnsaldoBreda Sirio", florenceSirioSpec, florenceSirio, florenceSirioLod, g(40.0, 520, 70), { params: SIRIO_PARAMS, finishParams: ["livery"] }),
  T("alstom-citadis", "Alstom Citadis 402", alstomCitadisSpec, alstomCitadis, alstomCitadisLod, g(56.0, 720, 70), { params: CITADIS_PARAMS }),
  T("alstom-citadis-x05", "Alstom Citadis X05", citadisX05Spec, citadisX05, citadisX05Lod, g(44.0, 540, 70), { params: CITADIS_X05_PARAMS, finishParams: ["livery"] }),
  T("alstom-tfs", "Alstom TFS", alstomTfsSpec, alstomTfs, alstomTfsLod, g(44.0, 550, 70)),
  T("translohr", "Translohr STE3", translohrSpec, translohr, translohrLod, g(23.0, 250, 70)),
  T("caf-urbos", "CAF Urbos 3", cafUrbosSpec, cafUrbos, cafUrbosLod, g(56.0, 720, 70), { params: URBOS_PARAMS }),
  T("flexity-outlook", "Bombardier Flexity Outlook", flexityOutlookSpec, flexityOutlook, flexityOutlookLod, g(40.0, 480, 70), { params: FLEXITY_OUTLOOK_PARAMS, finishParams: ["livery"] }),
  T("croydon-cr4000", "Croydon CR4000", croydonCr4000Spec, croydonCr4000, croydonCr4000Lod, g(36.3, 480, 80)),
  T("blackpool-balloon", "Blackpool Balloon", blackpoolBalloonSpec, blackpoolBalloon, blackpoolBalloonLod, g(19.0, 160, 55)),
  T("blackpool-flexity", "Blackpool Flexity 2", blackpoolFlexitySpec, blackpoolFlexity, blackpoolFlexityLod, g(40.9, 480, 70)),
  T("sheffield-supertram", "Sheffield Supertram", sheffieldSupertramSpec, sheffieldSupertram, sheffieldSupertramLod, g(46.5, 554, 80)),
  T("nottingham-incentro", "Nottingham Incentro", nottinghamIncentroSpec, nottinghamIncentro, nottinghamIncentroLod, g(36.7, 480, 80)),
  T("konstal-105n", "Konstal 105N", konstal105nSpec, konstal105n, konstal105nLod, g(16.5, 166, 70)),
  T("pesa-swing", "Pesa Swing", pesaSwingSpec, pesaSwing, pesaSwingLod, g(41.0, 400, 70), { params: SWING_PARAMS, finishParams: ["livery"] }),
  T("solaris-tramino", "Solaris Tramino", solarisTraminoSpec, solarisTramino, solarisTraminoLod, g(41.0, 480, 70), { params: TRAMINO_PARAMS, finishParams: ["livery"] }),
  T("ktm-5", "KTM-5", ktm5Spec, ktm5, ktm5Lod, g(20.0, 180, 75)),
  T("lm-68", "LM-68", lm68Spec, lm68, lm68Lod, g(19.0, 180, 65)),
  T("vityaz-m", "71-931M Vityaz-M", vityazMSpec, vityazM, vityazMLod, g(37.0, 576, 75)),
  T("electron-t5l64", "Electron T5L64", electronT5l64Spec, electronT5l64, electronT5l64Lod, g(30.0, 360, 65)),
  T("bucharest-v3a", "Bucharest V3A", bucharestV3aSpec, bucharestV3a, bucharestV3aLod, g(30.0, 250, 60)),
  T("koncar-tmk2200", "Koncar TMK 2200", koncarTmk2200Spec, koncarTmk2200, koncarTmk2200Lod, g(42.0, 520, 70)),
  T("durmazlar-silkworm", "Durmazlar Silkworm", durmazlarSilkwormSpec, durmazlarSilkworm, durmazlarSilkwormLod, g(40.0, 520, 70)),
  T("helsinki-artic", "Transtech Artic", helsinkiArticSpec, helsinkiArtic, helsinkiArticLod, g(41.0, 520, 80)),
  T("helsinki-valmet", "Valmet Nr I", helsinkiValmetSpec, helsinkiValmet, helsinkiValmetLod, g(25.0, 260, 60)),
  T("oslo-sl79", "Oslo SL79", osloSl79Spec, osloSl79, osloSl79Lod, g(29.0, 300, 70)),
  T("gothenburg-m29", "Gothenburg M29", gothenburgM29Spec, gothenburgM29, gothenburgM29Lod, g(20.0, 200, 60)),
  T("istanbul-nostalgic", "Istanbul Nostalgic Tram", istanbulNostalgicSpec, istanbulNostalgic, istanbulNostalgicLod, g(10.0, 60, 30)),
  T("trieste-opicina", "Trieste Opicina Tram", triesteOpicinaSpec, triesteOpicina, triesteOpicinaLod, g(16.0, 160, 40)),
  T("budapest-ganz-uv", "Ganz UV", budapestGanzUvSpec, budapestGanzUv, budapestGanzUvLod, g(18.0, 200, 55)),
  T("wroclaw-skoda-16t", "Skoda 16T", skoda16tSpec, skoda16t, skoda16tLod, g(39.0, 540, 70)),
  T("strasbourg-eurotram", "Strasbourg Eurotram", strasbourgEurotramSpec, strasbourgEurotram, strasbourgEurotramLod, g(40.0, 600, 70)),
  T("montpellier-citadis", "Montpellier Citadis 302", montpellierCitadisSpec, montpellierCitadis, montpellierCitadisLod, g(40.0, 520, 70), { params: MONTPELLIER_PARAMS, finishParams: ["livery"] }),
  T("gmunden-vario", "Gmunden Traunseetram", gmundenVarioSpec, gmundenVario, gmundenVarioLod, g(42.0, 480, 70)),
  T("sarajevo-k2yu", "Tatra K2YU", tatraK2yuSpec, tatraK2yu, tatraK2yuLod, g(22.0, 160, 65)),
  T("turin-2800", "Turin Series 2800", turin2800Spec, turin2800, turin2800Lod, g(25.0, 200, 60)),
];

export const EUROPE_TRAMS = EUROPE_TRAM_SPECS.map(tramDesign);

void lrv; void vintage; void doubleDeck; void portals; void guided; void pole;
