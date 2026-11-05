// The world rotorcraft and the airship (docs/models/world-aircraft.md): four
// helicopters on the rotor kit (rotorKit.ts), their main and tail rotors turning on
// the `time` clip "rotor", and the Zeppelin NT, each at its real size from the
// photographs and the published figures in assets/<references>/. The ids are
// stored in the game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import { airship, airshipLod, rotorcraft, rotorcraftLod, type AirshipSpec, type RotorSpec } from "./rotorKit.ts";
import { colourSchemes, COLOURS, schemes } from "./airlineSchemes.ts";
import { air, aircraftDesigns, chosen, liveries, type WorldAircraft } from "./worldAircraft.ts";

const S92 = /* @__PURE__ */ liveries(schemes("offshore", "rescue"));
export const sikorskyS92Spec = (p?: ParamValues): RotorSpec => ({
  length: 17.1, height: 4.95, width: 2.1, depth: 2.05, keel: 0.55, noseLen: 1.7, podLen: 10.8,
  boom: { r0: 0.75, r1: 0.35, y: 3.0 },
  main: { d: 6.6, r: 8.58, blades: 4, chord: 0.53, dir: 1 },
  tail: { kind: "rotor", r: 1.68, blades: 4, side: -1 },
  fin: { root: 2.2, tip: 1.2, top: 4.55, sweep: 25 }, stab: { span: 3.4, chord: 0.8, d: 16.0, y: 4.6 },
  deck: { d0: 3.0, d1: 9.5, hw: 0.85, h: 0.8 },
  sponsons: { d0: 5.6, d1: 9.4, hw: 1.2, y: 0.95, r: 0.45 },
  gear: { kind: "wheels", retract: true, nose: { d: 2.0, r: 0.3, twin: true }, mains: { d: 7.3, z: 1.55, r: 0.38, twin: true } },
  windows: [{ from: 4.2, to: 9.6, pitch: 0.9, y: 0.6, w: 0.25, h: 0.22 }], doors: [[2.6, 3.8]],
  ...chosen(S92, p),
});

const H145 = /* @__PURE__ */ liveries(schemes("airAmbulance", "police"));
export const airbusH145Spec = (p?: ParamValues): RotorSpec => ({
  length: 11.64, height: 3.96, width: 1.73, depth: 1.7, keel: 0.55, noseLen: 1.25, podLen: 6.6,
  boom: { r0: 0.45, r1: 0.25, y: 2.35 },
  main: { d: 3.9, r: 5.5, blades: 5, chord: 0.32, dir: -1 },
  tail: { kind: "fenestron", r: 0.5, blades: 10, side: 1 },
  fin: { root: 1.6, tip: 0.9, top: 3.75, sweep: 20 }, stab: { span: 2.4, chord: 0.5, d: 9.0, y: 2.35 },
  deck: { d0: 2.0, d1: 5.8, hw: 0.65, h: 0.55 },
  gear: { kind: "skids", track: 2.3, d0: 0.8, d1: 5.6 },
  windows: [{ from: 2.9, to: 4.6, pitch: 0.85, y: 0.62, w: 0.3, h: 0.3 }], doors: [[2.3, 3.4]],
  ...chosen(H145, p),
});

const MI8 = /* @__PURE__ */ liveries(schemes("aeroflot", "utair"));
export const milMi8Spec = (p?: ParamValues): RotorSpec => ({
  length: 18.17, height: 5.65, width: 2.5, depth: 2.4, keel: 0.6, noseLen: 1.9, podLen: 12.0,
  boom: { r0: 0.7, r1: 0.35, y: 3.1 },
  main: { d: 6.0, r: 10.65, blades: 5, chord: 0.52, dir: -1 },
  tail: { kind: "rotor", r: 1.95, blades: 3, side: 1 },
  fin: { root: 2.5, tip: 1.2, top: 4.7, sweep: 45 }, stab: { span: 2.8, chord: 0.8, d: 15.0, y: 2.6 },
  deck: { d0: 1.8, d1: 9.0, hw: 0.95, h: 0.95, intakes: true },
  sponsons: { d0: 4.6, d1: 7.8, hw: 1.4, y: 1.15, r: 0.5 },
  gear: { kind: "wheels", retract: false, nose: { d: 2.0, r: 0.3, twin: true }, mains: { d: 6.6, z: 2.25, r: 0.45 } },
  windows: [{ from: 4.2, to: 9.6, pitch: 0.9, y: 0.6, w: 0.2, h: 0.2 }], doors: [[3.0, 4.0]],
  ...chosen(MI8, p),
});

const B206 = /* @__PURE__ */ liveries(colourSchemes(...COLOURS), "colour", "Colour");
export const bell206Spec = (p?: ParamValues): RotorSpec => ({
  length: 9.5, height: 2.91, width: 1.3, depth: 1.45, keel: 0.6, noseLen: 1.15, podLen: 4.4,
  boom: { r0: 0.35, r1: 0.18, y: 1.85 },
  main: { d: 2.6, r: 5.08, blades: 2, chord: 0.33, dir: 1 },
  tail: { kind: "rotor", r: 0.82, blades: 2, side: -1 },
  fin: { root: 1.0, tip: 0.6, top: 2.75, sweep: 30 }, stab: { span: 2.0, chord: 0.45, d: 6.6, y: 1.85 },
  deck: { d0: 2.0, d1: 4.2, hw: 0.45, h: 0.5 },
  gear: { kind: "skids", track: 1.9, d0: 0.5, d1: 3.5 },
  windows: [{ from: 2.0, to: 2.9, pitch: 0.9, y: 0.62, w: 0.3, h: 0.28 }], doors: [[1.5, 2.5]],
  ...chosen(B206, p),
});

const ZEPPELIN = /* @__PURE__ */ liveries(schemes("zeppelin", "goodyear"));
export const zeppelinNtSpec = (p?: ParamValues): AirshipSpec => ({
  length: 75.1, diameter: 14.16, axisY: 9.83, gondola: { d0: 20.5, d1: 31.5, hw: 1.3, h: 2.6 },
  fins: { root: 9.0, tip: 6.0, span: 4.6, at: 61.0 }, props: { d: 27.5, r: 1.35, stern: 1.5 },
  ...chosen(ZEPPELIN, p),
});

// the builders: named exports, so a design's JS model imports them by name (jsModel.ts)
export function sikorskyS92(p?: ParamValues): MeshBuilder { return rotorcraft(sikorskyS92Spec(p)); }
export function sikorskyS92Lod(p?: ParamValues): MeshBuilder { return rotorcraftLod(sikorskyS92Spec(p)); }
export function airbusH145(p?: ParamValues): MeshBuilder { return rotorcraft(airbusH145Spec(p)); }
export function airbusH145Lod(p?: ParamValues): MeshBuilder { return rotorcraftLod(airbusH145Spec(p)); }
export function milMi8(p?: ParamValues): MeshBuilder { return rotorcraft(milMi8Spec(p)); }
export function milMi8Lod(p?: ParamValues): MeshBuilder { return rotorcraftLod(milMi8Spec(p)); }
export function bell206(p?: ParamValues): MeshBuilder { return rotorcraft(bell206Spec(p)); }
export function bell206Lod(p?: ParamValues): MeshBuilder { return rotorcraftLod(bell206Spec(p)); }
export function zeppelinNt(p?: ParamValues): MeshBuilder { return airship(zeppelinNtSpec(p)); }
export function zeppelinNtLod(p?: ParamValues): MeshBuilder { return airshipLod(zeppelinNtSpec(p)); }

/** The rotorcraft in the list's order: game properties from the published mass, shaft power and cruising speed. */
export const WORLD_ROTORCRAFT_SPECS: readonly WorldAircraft[] = [
  { id: "veh-sikorsky-s92", title: "Sikorsky S-92", build: sikorskyS92, buildLod: sikorskyS92Lod, params: S92.params, finishParams: ["livery"], game: air(12.0, 3760, 280, "small", 0.3), references: "sikorsky-s92" },
  { id: "veh-airbus-h145", title: "Airbus Helicopters H145", build: airbusH145, buildLod: airbusH145Lod, params: H145.params, finishParams: ["livery"], game: air(3.8, 1540, 246, "small", 0.3), references: "airbus-h145" },
  { id: "veh-mil-mi8", title: "Mil Mi-8", build: milMi8, buildLod: milMi8Lod, params: MI8.params, finishParams: ["livery"], game: air(12.0, 2500, 230, "small", 0.3), references: "mil-mi8" },
  { id: "veh-bell-206", title: "Bell 206 JetRanger", build: bell206, buildLod: bell206Lod, params: B206.params, finishParams: ["colour"], game: air(1.45, 313, 216, "small", 0.25), references: "bell-206" },
  { id: "veh-zeppelin-nt", title: "Zeppelin NT", build: zeppelinNt, buildLod: zeppelinNtLod, params: ZEPPELIN.params, finishParams: ["livery"], game: air(10.7, 441, 125, "small", 0.35), references: "zeppelin-nt" },
];

/** The helicopters' specs by id (tests and the fleet harness). */
export const ROTOR_SPECS: Record<string, (p?: ParamValues) => RotorSpec> = {
  "veh-sikorsky-s92": sikorskyS92Spec, "veh-airbus-h145": airbusH145Spec, "veh-mil-mi8": milMi8Spec, "veh-bell-206": bell206Spec,
};

export const WORLD_ROTORCRAFT = /* @__PURE__ */ aircraftDesigns(WORLD_ROTORCRAFT_SPECS);
