// The world trams of the Americas, Asia, Africa and Oceania, and the historic
// horse, steam and cable trams (docs/models/world-trams.md): each a WorldTramSpec
// on the world tram kit (worldTramKit.ts) at its real size, from the shapes of
// worldTramShapes.ts, modelled on the photographs in assets/<references>/ and the
// published figures in each folder's SOURCES.md. The ids are stored in the game's
// saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { worldTram, worldTramLod, tramLodBudget, type EndShape, type WorldTramSpec } from "./worldTramKit.ts";
import {
  arm, bogies, chimney, lowArm, chimneyLod, classic, doorsAt, doubleDeck, g, grip, jacobs, lay, liveryParam, lowFloor, lrv, NO_COLLECTOR, pole, secDoors, tramDesign, truck, vintage,
  type WorldTram,
} from "./worldTramShapes.ts";
import { citadis402 } from "./worldTramsEurope.ts";

const lod = (s: WorldTramSpec): MeshBuilder => worldTramLod(s, tramLodBudget(s));

// ---------------------------------------------------------------------------
// North and South America

export const PCC_PARAMS: readonly ParamSpec[] = [liveryParam(["pittsburgh", "Pittsburgh"], ["toronto", "Toronto"], ["philadelphia", "Philadelphia"])];

/** The PCC's streamlined end: a rounded vee, the screen leaning in a little under the domed roof. */
const PCC_NOSE: EndShape = {
  plan: [[0, 0.6], [0.2, 0.78], [0.5, 0.9], [0.9, 0.98], [1.2, 1]],
  upper: [[0, 0.52], [0.3, 0.74], [0.65, 0.89], [1.0, 0.97], [1.25, 1]],
  top: [[0, 0.64], [0.2, 0.82], [0.5, 0.93], [1.0, 1]],
  apron: [[0, 0.62], [0.3, -1]],
};

export function pccStreamlinerSpec(p?: ParamValues): WorldTramSpec {
  const v = resolveParams(PCC_PARAMS, p).livery;
  const red = v === "philadelphia" ? "#2e5e3a" : v === "toronto" ? "#c8102e" : "#9e1b32";
  return classic({
    sections: [14.2], width: 2.54, height: 3.1, front: "pcc",
    doors: [[1.4, 2.4], [7.5, 8.7]],
    trucks: bogies(1.9, 3.9, 10.3),
    collector: pole(10.3, 4.8),
    colors: { skirt: red, body: red, upper: "#efe6c8" },
    paint: [[1.55, "body"], [3.5, "upper"]],
    over: {
      pitch: 1.0,
      // the streamlined end: the screen in three panes, the destination sign over it, one head lamp
      // in the middle of the dash, the ribbed anticlimber over the apron
      frontShape: PCC_NOSE, screen: [1.68, 2.52], sign: 0,
      cabPaint: [[1.6, "body"], [3.5, "upper"]],
      nose: {
        heads: [[1.02, 0, 0.12]], tails: [[0.95, 0.98, 0.04]], housing: "steel",
        // the screen round the corners, its pillars, the sign laid on over it
        screenBand: true, pillars: [0.4, 0.98],
        panes: [{ y: [2.6, 2.78], z: [-0.6, 0.6], mat: "display" }],
        pillarPaint: "seam", wipers: [0.2, -0.6], wiperLength: 0.55,
        route: "", display: 0, ledPaint: "lettering", number: ["3318", 0.62, 1.45, 0.13, "upper"],
        grille: [0.66, 0.7, 0.75, 1, "steel"],
        bumper: [0.62, 0.74, "steel", 0.07],
      },
    },
  });
}

export function torontoClrvSpec(): WorldTramSpec {
  return classic({
    sections: [15.2], width: 2.54, height: 3.4, front: "angular",
    doors: [[0.55, 1.85], [8.2, 9.6]],
    trucks: bogies(1.83, 3.9, 11.3),
    collector: pole(11.6, 4.8),
    colors: { skirt: "#c8102e", body: "#c8102e", upper: "#c8102e", band: "#f2f2ee" },
    paint: [[1.45, "body"], [1.58, "band"], [3.5, "upper"]],
    over: { pitch: 1.3 },
  });
}

export function torontoFlexitySpec(): WorldTramSpec {
  const sections = [6.6, 5.2, 5.4, 5.2, 6.6];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.54, height: 3.84, front: "modern", doubleEnded: false,
    doors: [[2.15, 3.45], ...secDoors(l, 1.3, [1, 0.3], [1, 3.6], [3, 0.3], [3, 3.6])],
    trucks: bogies(1.8, l.at(0, 4.9), l.mid(2), l.at(4, 2.4)),
    collector: arm(l.mid(2) + 0.5),
    colors: { skirt: "#1d1f22", body: "#f2f2ee", band: "#c8102e" },
    paint: [[0.62, "skirt"], [1.0, "band"], [3.0, "body"], [3.9, "band"]],
    roofBoxes: [[0.8, 6.2, 0.95, 0.36, "body"], [l.at(4, 0.6), l.at(4, 6.0), 0.95, 0.36, "body"]],
  });
}

export function birneySafetyCarSpec(): WorldTramSpec {
  return vintage({
    sections: [8.5], width: 2.4, height: 3.3,
    doors: doorsAt(0.8, 0.75, 6.95),
    trucks: truck(2.4, 4.25),
    collector: pole(5.6, 4.6),
    colors: { body: "#2e5e3a", upper: "#efe6c8" },
    over: { pitch: 0.9 },
  });
}

export function perleyThomasSpec(): WorldTramSpec {
  return vintage({
    sections: [14.6], width: 2.6, height: 3.45, wheelRadius: 0.36,
    doors: doorsAt(1.0, 0.75, 12.85),
    trucks: bogies(1.5, 3.4, 11.2),
    collector: pole(10.6, 4.8),
    colors: { body: "#3a5a2a", trim: "#8a1f22", upper: "#3a5a2a" },
    paint: [[1.47, "body"], [1.55, "trim"], [3.5, "upper"]],
    over: { pitch: 0.75 },
  });
}

export function bostonType8Spec(): WorldTramSpec {
  return lrv({
    sections: [10.9, 10.9], gap: 0.5, width: 2.69, height: 3.6,
    doors: [[1.0, 2.3], [7.4, 8.7], [13.6, 14.9], [20.0, 21.3]],
    trucks: [...bogies(1.8, 4.4, 17.9), ...jacobs(1.8, 11.15)],
    collector: arm(4.6),
    colors: { skirt: "#5c6064", body: "#e3e5e6", band: "#00843d" },
    paint: [[1.0, "skirt"], [1.4, "band"], [3.9, "body"]],
  });
}

export const S70_PARAMS: readonly ParamSpec[] = [liveryParam(["houston", "Houston"], ["sandiego", "San Diego"], ["portland", "Portland"])];

export function siemensS70Spec(p?: ParamValues): WorldTramSpec {
  const v = resolveParams(S70_PARAMS, p).livery;
  const l = lay([12.0, 3.6, 12.0], 0.45);
  return lowFloor({
    sections: [12.0, 3.6, 12.0], gap: 0.45, width: 2.65, height: 3.8, front: "modern",
    doors: [[6.4, 7.7], [9.6, 10.9], [l.at(2, 0.9), l.at(2, 2.2)], [l.at(2, 4.1), l.at(2, 5.4)]],
    trucks: bogies(1.8, 4.6, l.mid(1), l.at(2, 7.4)),
    collector: arm(9.0),
    colors: v === "sandiego" ? { skirt: "#c8102e", body: "#c8102e", band: "#f2f2ee" } : v === "portland" ? { skirt: "#1d4f9c", body: "#f2f2ee", band: "#f2c300" } : { skirt: "#5c6064", body: "#d9dcde", band: "#c8102e" },
    paint: [[0.62, "skirt"], [0.9, "band"], [3.9, "body"]],
    roofBoxes: [[0.8, 3.6, 0.95, 0.36, "body"], [l.at(2, 8.4), l.at(2, 11.2), 0.95, 0.36, "body"]],
  });
}

export const KINKI_PARAMS: readonly ParamSpec[] = [liveryParam(["dallas", "Dallas"], ["phoenix", "Phoenix"])];

export function kinkiSharyoLrvSpec(p?: ParamValues): WorldTramSpec {
  const phoenix = resolveParams(KINKI_PARAMS, p).livery === "phoenix";
  return lrv({
    sections: [13.7, 13.7], gap: 0.6, width: 2.65, height: 3.8,
    doors: [[1.0, 2.3], [8.4, 9.7], [18.3, 19.6], [25.7, 27.0]],
    trucks: [...bogies(1.9, 4.8, 23.2), ...jacobs(1.9, 14.0)],
    collector: arm(5.2),
    colors: phoenix ? { skirt: "#5c6064", body: "#f2f2ee", band: "#6d2077" } : { skirt: "#1d4f9c", body: "#f2f2ee", band: "#f2c300" },
    paint: [[1.0, "skirt"], [1.3, "band"], [3.9, "body"]],
  });
}

export const LIBERTY_PARAMS: readonly ParamSpec[] = [liveryParam(["dallas", "Dallas"], ["milwaukee", "Milwaukee"])];

export function brookvilleLibertySpec(p?: ParamValues): WorldTramSpec {
  const mke = resolveParams(LIBERTY_PARAMS, p).livery === "milwaukee";
  const l = lay([8.0, 4.6, 8.0], 0.4);
  return lowFloor({
    sections: [8.0, 4.6, 8.0], width: 2.46, height: 3.8, front: "modern",
    doors: [[6.9, 7.8], ...secDoors(l, 1.3, [1, 1.65]), [l.at(2, 0.2), l.at(2, 1.1)]],
    trucks: bogies(1.8, 4.4, l.at(2, 3.6)),
    collector: arm(l.mid(1)),
    colors: mke ? { skirt: "#1d4f9c", body: "#f2f2ee", band: "#1d4f9c" } : { skirt: "#5c6064", body: "#c8102e", band: "#d9dcde" },
    paint: [[0.62, "skirt"], [0.9, "band"], [3.9, "body"]],
    roofBoxes: [[0.6, 4.0, 0.95, 0.45, "body"], [l.at(2, 4.0), l.at(2, 7.4), 0.95, 0.45, "body"]],
  });
}

export function philadelphiaKawasakiSpec(): WorldTramSpec {
  return classic({
    sections: [15.2], width: 2.6, height: 3.25, front: "angular",
    doors: [[0.55, 1.85], [6.9, 8.2]],
    trucks: bogies(1.9, 4.1, 11.1),
    collector: pole(11.4, 4.8),
    colors: { skirt: "#5c6064", body: "#f2f2ee", upper: "#f2f2ee", band: "#1d4f9c", red: "#c8102e" },
    paint: [[0.95, "skirt"], [1.1, "red"], [1.25, "band"], [3.5, "body"]],
  });
}

export function rioBondeSpec(): WorldTramSpec {
  return vintage({
    sections: [9.2], width: 2.3, height: 3.1, gauge: 1100,
    doors: [],
    trucks: truck(2.6, 4.6),
    collector: pole(6.0, 4.6),
    colors: { body: "#f2c317", upper: "#f2c317" },
    over: { open: true, floor: 0.75, clerestory: false },
  });
}

export function buenosAiresPremetroSpec(): WorldTramSpec {
  return classic({
    sections: [15.6], width: 2.6, height: 3.3, front: "angular", doubleEnded: true,
    doors: [[0.55, 1.85], [13.3, 14.6], [6.4, 8.0]],
    trucks: bogies(1.9, 4.0, 11.6),
    collector: arm(4.6),
    colors: { skirt: "#1d4f9c", body: "#f2f2ee", upper: "#f2f2ee", band: "#1d4f9c" },
    paint: [[1.1, "skirt"], [3.5, "body"]],
  });
}

// ---------------------------------------------------------------------------
// Asia

export const HONG_KONG_PARAMS: readonly ParamSpec[] = [liveryParam(["classic", "Classic"], ["advertising", "Advertising"])];

/** The Hong Kong tram's end: flat and upright with round corners. */
const HONG_KONG_NOSE: EndShape = {
  plan: [[0, 0.9], [0.12, 0.97], [0.25, 1]],
  top: [[0, 0.93], [0.1, 0.98], [0.25, 1]],
};

export function hongKongTramSpec(p?: ParamValues): WorldTramSpec {
  const ad = resolveParams(HONG_KONG_PARAMS, p).livery === "advertising";
  return doubleDeck({
    sections: [11.98], width: 2.0, height: 4.5, doubleEnded: false, gauge: 1067,
    doors: [[0.75, 1.55], [10.4, 11.2]],
    trucks: truck(3.0, 6.0),
    collector: lowArm(7.2),
    colors: ad ? { skirt: "#c8102e", body: "#f2f2ee", upper: "#c8102e" } : { skirt: "#1f6b3a", body: "#efe6c8", upper: "#1f6b3a" },
    paint: [[1.25, "skirt"], [2.25, "body"], [2.9, "skirt"], [4.6, "upper"]],
    // the route number box on the roof's front
    roofBoxes: [[0.3, 1.3, 0.42, 0.22, "body"]],
    over: {
      pitch: 0.95,
      // the flat end: three windows on each deck, the display between them, one head lamp low in the
      // dash and the black fender under it (the photographed car)
      frontShape: HONG_KONG_NOSE, screen: [1.45, 2.3],
      nose: {
        heads: [[0.88, 0, 0.11]], tails: [[0.72, 0.8, 0.035], [0.86, 0.8, 0.035]], housing: "steel",
        panes: [
          { y: [1.45, 2.3], z: [-0.3, 0.3] }, { y: [1.45, 2.3], z: [0.38, 0.86] }, { y: [1.45, 2.3], z: [-0.86, -0.38] },
          { y: [2.62, 2.86], z: [-0.42, 0.42], mat: "display" },
          { y: [3.2, 4.02], z: [-0.3, 0.3] }, { y: [3.2, 4.02], z: [0.38, 0.86] }, { y: [3.2, 4.02], z: [-0.86, -0.38] },
        ],
        mirrors: "arm", mirrorY: 2.1,
        bumper: [0.3, 0.62, "underframe", 0.06],
        route: "1", display: 3, number: ["103", -0.55, 1.28, 0.1, "lampRed"], badges: [[1.12, 0, 0.06, "upper"]],
      },
    },
  });
}

export function hiroshimaGreenMoverSpec(): WorldTramSpec {
  const sections = [6.4, 5.4, 5.2, 5.4, 6.4];
  const l = lay(sections, 0.4);
  return lowFloor({
    sections, width: 2.45, height: 3.65, front: "modern", gauge: 1435,
    doors: [[2.15, 3.4], ...secDoors(l, 1.2, [1, 0.3], [1, 3.9], [3, 0.3], [3, 3.9]), [l.at(4, 3.0), l.at(4, 4.2)]],
    trucks: bogies(1.8, l.at(0, 4.8), l.mid(2), l.at(4, 1.6)),
    collector: arm(l.mid(2) + 0.6),
    colors: { skirt: "#00754a", body: "#f2f2ee", band: "#00754a" },
    paint: [[0.62, "skirt"], [0.9, "band"], [3.9, "body"]],
    roofBoxes: [[0.8, 6.0, 0.95, 0.38, "body"], [l.at(4, 0.4), l.at(4, 5.6), 0.95, 0.38, "body"]],
  });
}

export function toei9000Spec(): WorldTramSpec {
  return classic({
    sections: [13.0], width: 2.2, height: 3.55, front: "retro", gauge: 1372,
    doors: [[0.75, 1.75], [6.3, 7.5]],
    trucks: bogies(1.8, 3.6, 9.4),
    collector: arm(4.6),
    colors: { skirt: "#7a1f2b", body: "#7a1f2b", upper: "#efe2c2" },
    paint: [[1.55, "body"], [3.5, "upper"]],
    over: { pitch: 1.0, clerestory: true },
  });
}

export const PORTRAM_PARAMS: readonly ParamSpec[] = [liveryParam(["red", "Red"], ["green", "Green"], ["blue", "Blue"])];

export function toyamaPortramSpec(p?: ParamValues): WorldTramSpec {
  const v = resolveParams(PORTRAM_PARAMS, p).livery;
  const accent = v === "green" ? "#4aa02c" : v === "blue" ? "#1d6fd8" : "#d8262d";
  return lowFloor({
    sections: [9.0, 9.0], width: 2.4, height: 3.6, front: "modern", gauge: 1067,
    doors: [[2.15, 3.45], [7.2, 8.5], [9.7, 11.0], [14.4, 15.7]],
    trucks: bogies(1.8, 5.6, 12.8),
    collector: arm(12.0),
    colors: { skirt: accent, body: "#f2f2ee", band: accent },
    paint: [[0.62, "skirt"], [0.9, "band"], [3.9, "body"]],
  });
}

export const TOKYU_300_PARAMS: readonly ParamSpec[] = [liveryParam(["blue", "Blue"], ["red", "Red"], ["green", "Green"])];

export function tokyu300Spec(p?: ParamValues): WorldTramSpec {
  const v = resolveParams(TOKYU_300_PARAMS, p).livery;
  const accent = v === "green" ? "#3f8f3a" : v === "red" ? "#c8102e" : "#1d4f9c";
  return lrv({
    sections: [12.2, 12.2], gap: 0.5, width: 2.5, height: 3.7, gauge: 1372,
    doors: [[1.0, 2.1], [8.6, 9.7], [15.2, 16.3], [22.8, 23.9]],
    trucks: [...bogies(1.8, 4.2, 20.7), ...jacobs(1.8, 12.45)],
    collector: arm(4.4),
    colors: { skirt: accent, body: accent, band: "#f2f2ee" },
    paint: [[1.0, "skirt"], [1.6, "body"], [3.9, "band"]],
  });
}

export function kolkataTramSpec(): WorldTramSpec {
  return vintage({
    sections: [8.8, 8.8], gap: 0.9, width: 2.2, height: 3.3,
    doors: [[0.75, 1.65], [4.4, 5.6], [10.6, 11.8], [16.9, 17.75]],
    trucks: [...bogies(1.6, 3.0, 15.5), ...jacobs(1.6, 9.25)],
    collector: pole(3.4, 4.6),
    colors: { body: "#1d4f9c", upper: "#f2f2ee" },
    over: { clerestory: false, pitch: 1.0 },
  });
}

export function dalianTramSpec(): WorldTramSpec {
  return vintage({
    sections: [13.5], width: 2.4, height: 3.5, wheelRadius: 0.36,
    doors: doorsAt(1.0, 0.75, 11.75),
    trucks: bogies(1.6, 3.4, 10.1),
    collector: arm(6.8),
    colors: { body: "#7a2a22", upper: "#efe2c2" },
    paint: [[1.5, "body"], [3.5, "upper"]],
  });
}

export function foshanHydrogenSpec(): WorldTramSpec {
  const l = lay([10.4, 6.0, 10.4], 0.45);
  return lowFloor({
    sections: [10.4, 6.0, 10.4], gap: 0.45, width: 2.65, height: 3.4, front: "modern",
    doors: [[2.15, 3.45], [l.at(0, 7.4), l.at(0, 8.7)], ...secDoors(l, 1.3, [1, 0.3], [1, 4.4]), [l.at(2, 1.5), l.at(2, 2.8)], [l.at(2, 6.75), l.at(2, 8.05)]],
    trucks: bogies(1.8, 5.4, l.mid(1), l.at(2, 4.8)),
    collector: NO_COLLECTOR,
    colors: { skirt: "#00754a", body: "#f2f2ee", band: "#00754a" },
    paint: [[0.62, "skirt"], [0.9, "band"], [3.9, "body"]],
    // the hydrogen tanks and fuel cells on the roof
    roofBoxes: [[0.8, 9.6, 0.95, 0.5, "body"], [l.at(1, 0.4), l.at(1, 5.6), 0.95, 0.5, "body"], [l.at(2, 0.8), l.at(2, 9.6), 0.95, 0.5, "body"]],
  });
}

// ---------------------------------------------------------------------------
// Africa

export function alexandriaDoubleDeckSpec(): WorldTramSpec {
  return doubleDeck({
    sections: [13.0], width: 2.4, height: 4.6, front: "angular",
    doors: [[0.5, 1.6], [5.9, 7.1], [11.4, 12.5]],
    trucks: bogies(1.8, 3.4, 9.6),
    collector: lowArm(6.5),
    colors: { skirt: "#1d4f9c", body: "#efe6c8", upper: "#efe6c8" },
    paint: [[1.25, "skirt"], [2.25, "body"], [2.9, "skirt"], [4.6, "upper"]],
    over: { pitch: 1.3 },
  });
}

export function addisAbabaLrtSpec(): WorldTramSpec {
  const l = lay([10.6, 7.0, 10.6], 0.45);
  return lowFloor({
    sections: [10.6, 7.0, 10.6], gap: 0.45, width: 2.65, height: 3.65, front: "pointed",
    doors: [[1.85, 3.15], [l.at(0, 7.6), l.at(0, 8.9)], ...secDoors(l, 1.3, [1, 0.3], [1, 5.4]), [l.at(2, 1.7), l.at(2, 3.0)], [l.at(2, 7.45), l.at(2, 8.75)]],
    trucks: bogies(1.8, 5.3, l.mid(1), l.at(2, 5.3)),
    collector: arm(l.mid(1) + 1.6),
    colors: { skirt: "#00754a", body: "#f2f2ee", band: "#f2c300" },
    paint: [[0.62, "skirt"], [0.9, "band"], [3.9, "body"]],
    roofBoxes: [[0.8, 9.6, 0.95, 0.38, "body"], [l.at(2, 1.0), l.at(2, 9.8), 0.95, 0.38, "body"]],
  });
}

export function dubaiCitadisSpec(): WorldTramSpec {
  // ground power (APS) along the whole line: no collector on the roof
  return citadis402({ skirt: "#5c6064", body: "#e9ecef", band: "#1d5fae" }, [[0.62, "skirt"], [0.82, "band"], [3.6, "body"]], { width: 2.65, collector: NO_COLLECTOR });
}

// ---------------------------------------------------------------------------
// Oceania

export const W_CLASS_PARAMS: readonly ParamSpec[] = [liveryParam(["green", "Green"], ["maroon", "Maroon"])];

export function melbourneWClassSpec(p?: ParamValues): WorldTramSpec {
  const maroon = resolveParams(W_CLASS_PARAMS, p).livery === "maroon";
  return vintage({
    sections: [14.0], width: 2.74, height: 3.25,
    doors: [[0.75, 1.6], [6.4, 7.6], [12.4, 13.25]],
    trucks: bogies(1.5, 3.3, 10.7),
    collector: pole(10.4, 4.8),
    colors: maroon ? { body: "#6e1f2a", upper: "#6e1f2a", trim: "#c9a227" } : { body: "#2e5e3a", upper: "#c9b58a", trim: "#c9a227" },
    paint: [[1.47, "body"], [1.55, "trim"], [3.5, "upper"]],
    over: { pitch: 0.9 },
  });
}

const YARRA = { skirt: "#5c6064", body: "#f2f2ee", band: "#7ab51d" };

export function melbourneBClassSpec(): WorldTramSpec {
  return lrv({
    sections: [11.6, 11.6], gap: 0.4, width: 2.8, height: 3.4,
    doors: [[1.0, 2.3], [7.4, 8.7], [14.9, 16.2], [21.3, 22.6]],
    trucks: [...bogies(1.8, 4.4, 19.2), ...jacobs(1.8, 11.8)],
    collector: arm(4.6),
    colors: YARRA,
    paint: [[0.95, "skirt"], [1.25, "band"], [3.9, "body"]],
    over: { floor: 0.4, doorSill: 0.44, windows: [1.45, 2.9], screen: [1.35, 3.0] },
  });
}

export function melbourneEClassSpec(): WorldTramSpec {
  const l = lay([12.0, 8.5, 12.0], 0.45);
  return lowFloor({
    sections: [12.0, 8.5, 12.0], gap: 0.45, width: 2.65, height: 3.4, front: "modern",
    doors: [[2.15, 3.45], [l.at(0, 7.6), l.at(0, 8.9)], ...secDoors(l, 1.3, [1, 0.4], [1, 6.8]), [l.at(2, 3.1), l.at(2, 4.4)], [l.at(2, 8.55), l.at(2, 9.85)]],
    trucks: bogies(1.8, 5.5, l.mid(1), l.at(2, 6.5)),
    collector: arm(l.mid(1) + 2.0),
    colors: YARRA,
    paint: [[0.62, "skirt"], [0.9, "band"], [3.9, "body"]],
    roofBoxes: [[0.8, 4.6, 0.95, 0.36, "body"], [l.at(2, 7.4), l.at(2, 11.2), 0.95, 0.36, "body"]],
  });
}

export function glenelgHClassSpec(): WorldTramSpec {
  return vintage({
    sections: [18.0], width: 2.64, height: 3.35,
    doors: [[0.75, 1.75], [8.4, 9.6], [16.25, 17.25]],
    trucks: bogies(1.7, 4.0, 14.0),
    collector: pole(13.4, 4.8),
    colors: { body: "#6e1f2a", upper: "#efe2c2" },
    paint: [[1.5, "body"], [3.5, "upper"]],
  });
}

export function sydneyRClassSpec(): WorldTramSpec {
  return vintage({
    sections: [16.6], width: 2.9, height: 3.35,
    doors: [[0.75, 1.65], [7.6, 9.0], [14.95, 15.85]],
    trucks: bogies(1.7, 4.0, 12.6),
    collector: pole(12.2, 4.8),
    colors: { body: "#2e5e3a", upper: "#efe2c2" },
    paint: [[1.5, "body"], [3.5, "upper"]],
  });
}

export function christchurchBoonSpec(): WorldTramSpec {
  return vintage({
    sections: [9.6], width: 2.3, height: 3.2,
    // the passengers board over the open end platforms: no side doors
    doors: [],
    trucks: truck(2.6, 4.8),
    collector: pole(6.4, 4.6),
    colors: { body: "#2e5e3a", upper: "#efe2c2" },
  });
}

// ---------------------------------------------------------------------------
// the historic horse, steam and cable trams

export const STEAM_TRAM_PARAMS: readonly ParamSpec[] = [{
  name: "unit", title: "Unit", default: "engine",
  values: [{ value: "engine", title: "Tram engine" }, { value: "trailer", title: "Trailer" }],
}];

export function steamTramSpec(p?: ParamValues): WorldTramSpec {
  if (resolveParams(STEAM_TRAM_PARAMS, p).unit === "trailer")
    // a bogie double-deck trailer with a covered top
    return { ...doubleDeck({
      sections: [9.6], width: 2.1, height: 4.3, front: "retro",
      doors: [],
      trucks: bogies(1.4, 2.6, 7.0),
      collector: NO_COLLECTOR,
      colors: { skirt: "#6e1f2a", body: "#efe2c2", upper: "#efe2c2" },
      over: { pitch: 0.9 },
    }), trailer: true };
  // the tram engine: a box body over its wheels and motion, a cab window all round, the chimney through the roof
  return vintage({
    sections: [4.6], width: 2.1, height: 3.2, front: "angular",
    doors: [],
    trucks: truck(1.7, 2.3),
    collector: NO_COLLECTOR,
    colors: { body: "#5a2a1a", upper: "#5a2a1a" },
    paint: [[1.35, "body"], [3.5, "upper"]],
    over: { floor: 0.12, skirted: true, windows: [1.45, 2.6], screen: [1.45, 2.6], pitch: 0.95, clerestory: false, extra: chimney(1.6), extraLod: chimneyLod(1.6), extraFeatures: ["chimney"] },
  });
}

export function dunedinCableCarSpec(): WorldTramSpec {
  return vintage({
    sections: [6.6], width: 2.2, height: 3.0, gauge: 1067, wheelRadius: 0.33,
    doors: [],
    trucks: truck(2.0, 3.3),
    collector: NO_COLLECTOR,
    colors: { body: "#8a1f22", upper: "#efe2c2" },
    over: { open: true, floor: 0.62, clerestory: false, extra: grip(3.3), extraFeatures: ["grip"] },
  });
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names: the JS model imports a
// design's builders by name from this module (jsModel.ts)

export function pccStreamliner(p?: ParamValues): MeshBuilder { return worldTram(pccStreamlinerSpec(p)); }
export function pccStreamlinerLod(p?: ParamValues): MeshBuilder { return lod(pccStreamlinerSpec(p)); }
export function torontoClrv(): MeshBuilder { return worldTram(torontoClrvSpec()); }
export function torontoClrvLod(): MeshBuilder { return lod(torontoClrvSpec()); }
export function torontoFlexity(): MeshBuilder { return worldTram(torontoFlexitySpec()); }
export function torontoFlexityLod(): MeshBuilder { return lod(torontoFlexitySpec()); }
export function birneySafetyCar(): MeshBuilder { return worldTram(birneySafetyCarSpec()); }
export function birneySafetyCarLod(): MeshBuilder { return lod(birneySafetyCarSpec()); }
export function perleyThomas(): MeshBuilder { return worldTram(perleyThomasSpec()); }
export function perleyThomasLod(): MeshBuilder { return lod(perleyThomasSpec()); }
export function bostonType8(): MeshBuilder { return worldTram(bostonType8Spec()); }
export function bostonType8Lod(): MeshBuilder { return lod(bostonType8Spec()); }
export function siemensS70(p?: ParamValues): MeshBuilder { return worldTram(siemensS70Spec(p)); }
export function siemensS70Lod(p?: ParamValues): MeshBuilder { return lod(siemensS70Spec(p)); }
export function kinkiSharyoLrv(p?: ParamValues): MeshBuilder { return worldTram(kinkiSharyoLrvSpec(p)); }
export function kinkiSharyoLrvLod(p?: ParamValues): MeshBuilder { return lod(kinkiSharyoLrvSpec(p)); }
export function brookvilleLiberty(p?: ParamValues): MeshBuilder { return worldTram(brookvilleLibertySpec(p)); }
export function brookvilleLibertyLod(p?: ParamValues): MeshBuilder { return lod(brookvilleLibertySpec(p)); }
export function philadelphiaKawasaki(): MeshBuilder { return worldTram(philadelphiaKawasakiSpec()); }
export function philadelphiaKawasakiLod(): MeshBuilder { return lod(philadelphiaKawasakiSpec()); }
export function rioBonde(): MeshBuilder { return worldTram(rioBondeSpec()); }
export function rioBondeLod(): MeshBuilder { return lod(rioBondeSpec()); }
export function buenosAiresPremetro(): MeshBuilder { return worldTram(buenosAiresPremetroSpec()); }
export function buenosAiresPremetroLod(): MeshBuilder { return lod(buenosAiresPremetroSpec()); }
export function hongKongTram(p?: ParamValues): MeshBuilder { return worldTram(hongKongTramSpec(p)); }
export function hongKongTramLod(p?: ParamValues): MeshBuilder { return lod(hongKongTramSpec(p)); }
export function hiroshimaGreenMover(): MeshBuilder { return worldTram(hiroshimaGreenMoverSpec()); }
export function hiroshimaGreenMoverLod(): MeshBuilder { return lod(hiroshimaGreenMoverSpec()); }
export function toei9000(): MeshBuilder { return worldTram(toei9000Spec()); }
export function toei9000Lod(): MeshBuilder { return lod(toei9000Spec()); }
export function toyamaPortram(p?: ParamValues): MeshBuilder { return worldTram(toyamaPortramSpec(p)); }
export function toyamaPortramLod(p?: ParamValues): MeshBuilder { return lod(toyamaPortramSpec(p)); }
export function tokyu300(p?: ParamValues): MeshBuilder { return worldTram(tokyu300Spec(p)); }
export function tokyu300Lod(p?: ParamValues): MeshBuilder { return lod(tokyu300Spec(p)); }
export function kolkataTram(): MeshBuilder { return worldTram(kolkataTramSpec()); }
export function kolkataTramLod(): MeshBuilder { return lod(kolkataTramSpec()); }
export function dalianTram(): MeshBuilder { return worldTram(dalianTramSpec()); }
export function dalianTramLod(): MeshBuilder { return lod(dalianTramSpec()); }
export function foshanHydrogen(): MeshBuilder { return worldTram(foshanHydrogenSpec()); }
export function foshanHydrogenLod(): MeshBuilder { return lod(foshanHydrogenSpec()); }
export function alexandriaDoubleDeck(): MeshBuilder { return worldTram(alexandriaDoubleDeckSpec()); }
export function alexandriaDoubleDeckLod(): MeshBuilder { return lod(alexandriaDoubleDeckSpec()); }
export function addisAbabaLrt(): MeshBuilder { return worldTram(addisAbabaLrtSpec()); }
export function addisAbabaLrtLod(): MeshBuilder { return lod(addisAbabaLrtSpec()); }
export function melbourneWClass(p?: ParamValues): MeshBuilder { return worldTram(melbourneWClassSpec(p)); }
export function melbourneWClassLod(p?: ParamValues): MeshBuilder { return lod(melbourneWClassSpec(p)); }
export function melbourneBClass(): MeshBuilder { return worldTram(melbourneBClassSpec()); }
export function melbourneBClassLod(): MeshBuilder { return lod(melbourneBClassSpec()); }
export function melbourneEClass(): MeshBuilder { return worldTram(melbourneEClassSpec()); }
export function melbourneEClassLod(): MeshBuilder { return lod(melbourneEClassSpec()); }
export function glenelgHClass(): MeshBuilder { return worldTram(glenelgHClassSpec()); }
export function glenelgHClassLod(): MeshBuilder { return lod(glenelgHClassSpec()); }
export function sydneyRClass(): MeshBuilder { return worldTram(sydneyRClassSpec()); }
export function sydneyRClassLod(): MeshBuilder { return lod(sydneyRClassSpec()); }
export function christchurchBoon(): MeshBuilder { return worldTram(christchurchBoonSpec()); }
export function christchurchBoonLod(): MeshBuilder { return lod(christchurchBoonSpec()); }
export function steamTram(p?: ParamValues): MeshBuilder { return worldTram(steamTramSpec(p)); }
export function steamTramLod(p?: ParamValues): MeshBuilder { return lod(steamTramSpec(p)); }
export function dunedinCableCar(): MeshBuilder { return worldTram(dunedinCableCarSpec()); }
export function dunedinCableCarLod(): MeshBuilder { return lod(dunedinCableCarSpec()); }
export function dubaiCitadis(): MeshBuilder { return worldTram(dubaiCitadisSpec()); }
export function dubaiCitadisLod(): MeshBuilder { return lod(dubaiCitadisSpec()); }

// ---------------------------------------------------------------------------
// the designs, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md)

const T = (id: string, title: string, spec: WorldTram["spec"], build: WorldTram["build"], buildLod: WorldTram["buildLod"], game: WorldTram["game"], extra: Partial<WorldTram> = {}): WorldTram =>
  ({ id: `veh-${id}`, title, spec, build, buildLod, game, references: id, ...extra });

export const WORLD_REGION_TRAM_SPECS: readonly WorldTram[] = [
  T("pcc-streamliner", "PCC Streamliner", pccStreamlinerSpec, pccStreamliner, pccStreamlinerLod, g(17.0, 164, 70), { params: PCC_PARAMS, finishParams: ["livery"] }),
  T("toronto-clrv", "Toronto CLRV", torontoClrvSpec, torontoClrv, torontoClrvLod, g(22.7, 238, 80)),
  T("toronto-flexity", "Toronto Flexity Outlook", torontoFlexitySpec, torontoFlexity, torontoFlexityLod, g(48.2, 520, 70)),
  T("birney-safety-car", "Birney Safety Car", birneySafetyCarSpec, birneySafetyCar, birneySafetyCarLod, g(7.5, 37, 40)),
  T("new-orleans-perley-thomas", "New Orleans Perley Thomas", perleyThomasSpec, perleyThomas, perleyThomasLod, g(21.0, 120, 50)),
  T("boston-type-8", "Boston Type 8", bostonType8Spec, bostonType8, bostonType8Lod, g(38.0, 400, 90)),
  T("siemens-s70", "Siemens S70", siemensS70Spec, siemensS70, siemensS70Lod, g(44.0, 570, 105), { params: S70_PARAMS, finishParams: ["livery"] }),
  T("kinki-sharyo-lrv", "Kinki Sharyo LRV", kinkiSharyoLrvSpec, kinkiSharyoLrv, kinkiSharyoLrvLod, g(49.0, 600, 105), { params: KINKI_PARAMS, finishParams: ["livery"] }),
  T("brookville-liberty", "Brookville Liberty", brookvilleLibertySpec, brookvilleLiberty, brookvilleLibertyLod, g(36.0, 400, 70), { params: LIBERTY_PARAMS, finishParams: ["livery"] }),
  T("philadelphia-kawasaki", "Philadelphia Kawasaki LRV", philadelphiaKawasakiSpec, philadelphiaKawasaki, philadelphiaKawasakiLod, g(26.0, 224, 80)),
  T("rio-bonde", "Santa Teresa Bonde", rioBondeSpec, rioBonde, rioBondeLod, g(9.0, 60, 25)),
  T("buenos-aires-premetro", "Buenos Aires Premetro", buenosAiresPremetroSpec, buenosAiresPremetro, buenosAiresPremetroLod, g(24.0, 240, 60)),
  T("hong-kong-tram", "Hong Kong Tram", hongKongTramSpec, hongKongTram, hongKongTramLod, g(13.0, 60, 40), { params: HONG_KONG_PARAMS, finishParams: ["livery"] }),
  T("hiroshima-green-mover", "Hiroshima Green Mover Max", hiroshimaGreenMoverSpec, hiroshimaGreenMover, hiroshimaGreenMoverLod, g(34.0, 400, 80)),
  T("toei-9000", "Toei 9000", toei9000Spec, toei9000, toei9000Lod, g(17.8, 120, 40)),
  T("toyama-portram", "Toyama Portram", toyamaPortramSpec, toyamaPortram, toyamaPortramLod, g(28.5, 300, 70), { params: PORTRAM_PARAMS, finishParams: ["livery"] }),
  T("tokyu-300", "Tokyu 300", tokyu300Spec, tokyu300, tokyu300Lod, g(32.0, 240, 40), { params: TOKYU_300_PARAMS, finishParams: ["livery"] }),
  T("kolkata-tram", "Kolkata Tram", kolkataTramSpec, kolkataTram, kolkataTramLod, g(18.0, 120, 40)),
  T("dalian-tram", "Dalian Tram", dalianTramSpec, dalianTram, dalianTramLod, g(17.0, 120, 40)),
  T("foshan-hydrogen", "Foshan Hydrogen Tram", foshanHydrogenSpec, foshanHydrogen, foshanHydrogenLod, g(45.0, 400, 70)),
  T("alexandria-double-deck", "Alexandria Double-Deck Tram", alexandriaDoubleDeckSpec, alexandriaDoubleDeck, alexandriaDoubleDeckLod, g(22.0, 200, 50)),
  T("addis-ababa-lrt", "Addis Ababa Light Rail", addisAbabaLrtSpec, addisAbabaLrt, addisAbabaLrtLod, g(45.0, 540, 70)),
  T("melbourne-w-class", "Melbourne W Class", melbourneWClassSpec, melbourneWClass, melbourneWClassLod, g(16.0, 150, 55), { params: W_CLASS_PARAMS, finishParams: ["livery"] }),
  T("melbourne-b-class", "Melbourne B Class", melbourneBClassSpec, melbourneBClass, melbourneBClassLod, g(37.0, 390, 70)),
  T("melbourne-e-class", "Melbourne E Class", melbourneEClassSpec, melbourneEClass, melbourneEClassLod, g(51.0, 540, 70)),
  T("glenelg-h-class", "Glenelg H Class", glenelgHClassSpec, glenelgHClass, glenelgHClassLod, g(24.0, 180, 60)),
  T("sydney-r-class", "Sydney R Class", sydneyRClassSpec, sydneyRClass, sydneyRClassLod, g(19.0, 160, 55)),
  T("christchurch-boon", "Christchurch Boon Tram", christchurchBoonSpec, christchurchBoon, christchurchBoonLod, g(9.0, 50, 35)),
  T("steam-tram", "Steam Tram", steamTramSpec, steamTram, steamTramLod, g(9.0, 75, 25, [{ params: { unit: "trailer" }, weight: 6.5, power: 0 }]), { params: STEAM_TRAM_PARAMS, traction: "steam" }),
  T("cable-car-dunedin", "Dunedin Cable Car", dunedinCableCarSpec, dunedinCableCar, dunedinCableCarLod, g(4.5, 0, 16), { traction: "cable" }),
  T("dubai-citadis", "Dubai Tram", dubaiCitadisSpec, dubaiCitadis, dubaiCitadisLod, g(58.0, 720, 70)),
];

export const WORLD_REGION_TRAMS = WORLD_REGION_TRAM_SPECS.map(tramDesign);
