// The trucks and lorries from around the world (docs/models/world-trucks.md): 100
// tractors with their semi-trailers, rigid trucks, a road train, vans, fire
// engines, cranes and mining trucks, each a TruckSpec on the world truck kit
// (truckKit.ts, truckBodies.ts, the shared shapes in worldTruckPresets.ts) at its
// real size, modelled on the photographs in assets/<references>/ and the
// published figures in each folder's SOURCES.md. The ids are stored in the
// game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import type { BodyKind, CabSpec, Livery, TrailerSpec, TruckSpec } from "./truckKit.ts";
import { buildTruck, buildTruckLod } from "./truckBodies.ts";
import { TRUCK_CATALOG } from "./trucks.ts";
import {
  behindCab, body, drawbar, drive, euCab, steerDrive, euSemi, frame, group, narrowCab, oldBonnet, oldCab, rigid, squareBonnet, steer, tag, tractor, usCabover, usHood, usSemi,
  type SemiOpts,
} from "./worldTruckPresets.ts";

/** The low detail's budget of a spec: 100 triangles a section, at most 300 (lod.ts lodBudget). */
const lodOf = (s: TruckSpec): MeshBuilder => buildTruckLod(s, Math.min(300, 100 * (1 + (s.trailers?.length ?? 0))));

/** A parameter `name` over [value, title] pairs, the first the default. */
function param(name: string, title: string, values: Array<[string, string]>): ParamSpec[] {
  return [{ name, title, default: values[0]![0], values: values.map(([value, t]) => ({ value, title: t })) }];
}
const bodyParam = (...values: Array<[string, string]>): ParamSpec[] => param("body", "Body", values);
const colourParam = (...values: Array<[string, string]>): ParamSpec[] => param("colour", "Colour", values);

/** The body value a design was built with. */
const pick = (params: readonly ParamSpec[], p?: ParamValues): string => resolveParams(params, p)[params[0]!.name]!;

/** A European semi-trailer for a body value: curtain, box, reefer, tank, container, tipper, flatbed, low loader. */
function euTrailer(kind: string, o: SemiOpts = {}): TrailerSpec {
  if (kind === "lowLoader") return euSemi("lowLoader", { load: "machine", ...o });
  if (kind === "tipper") return euSemi("tipper", { load: "gravel", ...o });
  if (kind === "container") return euSemi("container", { top: 3.95, ...o });
  return euSemi(kind as BodyKind, o);
}

/** A US semi-trailer for a body value: dry van, reefer, flatbed, tank. */
function usTrailer(kind: string, o: SemiOpts = {}): TrailerSpec {
  return usSemi(kind === "dryVan" ? "box" : (kind as BodyKind), o);
}

const CURTAIN: [string, string] = ["curtain", "Curtain"];
const BOX: [string, string] = ["box", "Box"];
const TANK: [string, string] = ["tank", "Tank"];
const REEFER: [string, string] = ["reefer", "Reefer"];
const CONTAINER: [string, string] = ["container", "Container"];
const TIPPER: [string, string] = ["tipper", "Tipper"];
const DROPSIDE: [string, string] = ["dropside", "Dropside"];
const CANVAS: [string, string] = ["canvas", "Canvas tilt"];
const FLATBED: [string, string] = ["flatbed", "Flatbed"];
const DRY_VAN: [string, string] = ["dryVan", "Dry van"];
const MIXER: [string, string] = ["mixer", "Mixer"];

// ===========================================================================
// Europe

// --- Sweden

export const SCANIA_R_PARAMS = bodyParam(CURTAIN, BOX, TANK);
export function scaniaRSpec(p?: ParamValues): TruckSpec {
  return tractor(euCab("sleeper", { top: 3.35, stripe: [1.3, 1.4] }), euTrailer(pick(SCANIA_R_PARAMS, p)),
    { cab: "#c8102e", cab2: "#1d1f22", body: "#f2f2ee", canvas: "#2d5fa8" }, { fifth: 4.55 });
}
export function scaniaR(p?: ParamValues): MeshBuilder { return buildTruck(scaniaRSpec(p)); }
export function scaniaRLod(p?: ParamValues): MeshBuilder { return lodOf(scaniaRSpec(p)); }

export const SCANIA_S_PARAMS = bodyParam(CURTAIN, REEFER);
export function scaniaSV8Spec(p?: ParamValues): TruckSpec {
  return tractor(euCab("high", { top: 4.0, floor: 1.3, screen: [2.05, 2.95], grille: "bars", lamps: "slim", beacon: "amber" }), euTrailer(pick(SCANIA_S_PARAMS, p)),
    { cab: "#18233a", cab2: "#c9a13b", body: "#eef0f2", canvas: "#18233a" }, { axles: "6x2", fifth: 4.7 });
}
export function scaniaSV8(p?: ParamValues): MeshBuilder { return buildTruck(scaniaSV8Spec(p)); }
export function scaniaSV8Lod(p?: ParamValues): MeshBuilder { return lodOf(scaniaSV8Spec(p)); }

export const SCANIA_LB141_PARAMS = bodyParam(BOX, TANK);
export function scaniaLb141Spec(p?: ParamValues): TruckSpec {
  return tractor(oldCab({ length: 2.05, top: 3.0, floor: 1.25, screen: [1.95, 2.7], grille: "bars", lamps: "round" }), euTrailer(pick(SCANIA_LB141_PARAMS, p), { length: 12.0, axles: 2, dual: true }),
    { cab: "#d8462a", cab2: "#f1efe8", body: "#f1efe8" }, { fifth: 4.3, tanks: "box" });
}
export function scaniaLb141(p?: ParamValues): MeshBuilder { return buildTruck(scaniaLb141Spec(p)); }
export function scaniaLb141Lod(p?: ParamValues): MeshBuilder { return lodOf(scaniaLb141Spec(p)); }

export const VOLVO_FH16_PARAMS = bodyParam(["lowLoader", "Low loader"], CURTAIN);
export function volvoFh16Spec(p?: ParamValues): TruckSpec {
  return tractor(euCab("high", { top: 3.98, floor: 1.32, screen: [2.05, 3.0], lamps: "slim", beacon: "amber" }), euTrailer(pick(VOLVO_FH16_PARAMS, p), { axles: 3 }),
    { cab: "#1f4e9c", cab2: "#c8cdd3", body: "#e8eaec", canvas: "#1f4e9c", load: "#e9b11c" }, { axles: "6x4", wheel: 0.55, fifth: 4.7 });
}
export function volvoFh16(p?: ParamValues): MeshBuilder { return buildTruck(volvoFh16Spec(p)); }
export function volvoFh16Lod(p?: ParamValues): MeshBuilder { return lodOf(volvoFh16Spec(p)); }

export const VOLVO_F88_PARAMS = bodyParam(BOX, TANK);
export function volvoF88Spec(p?: ParamValues): TruckSpec {
  return tractor(oldCab({ length: 1.9, top: 2.9, floor: 1.2, screen: [1.9, 2.6], corner: 0.2, grille: "bars" }), euTrailer(pick(VOLVO_F88_PARAMS, p), { length: 11.0, axles: 2, dual: true }),
    { cab: "#b5121b", cab2: "#e9e6dd", body: "#e9e6dd" }, { fifth: 4.2 });
}
export function volvoF88(p?: ParamValues): MeshBuilder { return buildTruck(volvoF88Spec(p)); }
export function volvoF88Lod(p?: ParamValues): MeshBuilder { return lodOf(volvoF88Spec(p)); }

export function volvoFmxTipperSpec(): TruckSpec {
  const cab = euCab("day", { top: 3.15, floor: 1.38, screen: [2.12, 2.98], visor: false, band: 1.8, beacon: "amber" });
  const ch = frame(9.3, 0.55, [steer(1.5), steer(3.4), drive(6.4), drive(7.77)], { frame: 1.15 });
  return rigid(cab, ch, behindCab("tipper", cab, ch, 2.75, { floor: 1.45, load: "gravel" }), { cab: "#2b4f8e", cab2: "#3a3c40", body: "#6f7378", load: "#8d8273" });
}
export function volvoFmxTipper(): MeshBuilder { return buildTruck(volvoFmxTipperSpec()); }
export function volvoFmxTipperLod(): MeshBuilder { return lodOf(volvoFmxTipperSpec()); }

// --- Germany

export const ACTROS_PARAMS = bodyParam(CURTAIN, BOX);
export function mbActrosSpec(p?: ParamValues): TruckSpec {
  return tractor(euCab("high", { top: 3.9, screen: [2.0, 2.98], mirrors: "camera", lamps: "slim", grille: "bars" }), euTrailer(pick(ACTROS_PARAMS, p)),
    { cab: "#e9ebee", cab2: "#2a2c30", body: "#f4f4f2", canvas: "#8c9298" }, { fifth: 4.6 });
}
export function mbActros(p?: ParamValues): MeshBuilder { return buildTruck(mbActrosSpec(p)); }
export function mbActrosLod(p?: ParamValues): MeshBuilder { return lodOf(mbActrosSpec(p)); }

export function mbArocsSpec(): TruckSpec {
  const cab = euCab("day", { top: 3.1, floor: 1.35, screen: [2.1, 2.95], visor: false, band: 1.75, grille: "bars", beacon: "amber" });
  const ch = frame(7.9, 0.55, [steer(1.45), drive(4.95), drive(6.3)], { frame: 1.12 });
  return rigid(cab, ch, behindCab("tipper", cab, ch, 2.7, { floor: 1.42, load: "gravel" }), { cab: "#dcdfe2", cab2: "#2d2f33", body: "#d65a1f", load: "#a39784" });
}
export function mbArocs(): MeshBuilder { return buildTruck(mbArocsSpec()); }
export function mbArocsLod(): MeshBuilder { return lodOf(mbArocsSpec()); }

export const UNIMOG_PARAMS = bodyParam(FLATBED, ["plough", "Snowplough"]);
export function mbUnimogSpec(p?: ParamValues): TruckSpec {
  const kind = pick(UNIMOG_PARAMS, p);
  const cab: CabSpec = { kind: "cabover", length: 1.6, width: 2.3, floor: 1.45, top: 2.95, screen: [1.95, 2.65], rake: 0.12, corner: 0.18, grille: "slots", lamps: "round", mirrors: "arm", beacon: "amber" };
  const ch = frame(5.55, 0.6, [steerDrive(1.15), drive(4.75, false)], { frame: 1.25, tanks: "box", tyre: 0.42 });
  return rigid(cab, ch, behindCab(kind === "plough" ? "plough" : "flatbed", cab, ch, 1.95, { floor: 1.55, hw: 1.15 }), { cab: "#f39200", cab2: "#2b2b2b", body: "#f39200", art: "#e0a400" });
}
export function mbUnimog(p?: ParamValues): MeshBuilder { return buildTruck(mbUnimogSpec(p)); }
export function mbUnimogLod(p?: ParamValues): MeshBuilder { return lodOf(mbUnimogSpec(p)); }

export const KURZHAUBER_PARAMS = bodyParam(DROPSIDE, TIPPER);
export function mbKurzhauberSpec(p?: ParamValues): TruckSpec {
  const cab = oldBonnet({ width: 2.3, top: 2.5, floor: 1.15, screen: [1.7, 2.2], hood: { length: 1.25, top: 1.75, hw: 0.55 } });
  const ch = frame(7.2, 0.5, [steer(0.95), drive(5.0)], { frame: 0.95, tanks: "none" });
  const kind = pick(KURZHAUBER_PARAMS, p);
  return rigid(cab, ch, behindCab(kind === "tipper" ? "tipper" : "dropside", cab, ch, kind === "tipper" ? 2.0 : 1.75, { floor: 1.2, hw: 1.15, load: kind === "tipper" ? "gravel" : "none" }),
    { cab: "#2e5a87", body: "#8a6a45", rim: "#b8b8b0" });
}
export function mbKurzhauber(p?: ParamValues): MeshBuilder { return buildTruck(mbKurzhauberSpec(p)); }
export function mbKurzhauberLod(p?: ParamValues): MeshBuilder { return lodOf(mbKurzhauberSpec(p)); }

export const MB_NG_PARAMS = bodyParam(BOX, TANK);
export function mbNgSpec(p?: ParamValues): TruckSpec {
  return tractor(oldCab({ length: 2.1, top: 3.05, floor: 1.3, screen: [2.0, 2.7], rake: 0.1, corner: 0.1, grille: "slots", lamps: "rect" }), euTrailer(pick(MB_NG_PARAMS, p), { length: 12.5 }),
    { cab: "#c2a46b", cab2: "#2f3033", body: "#e7e4dc" }, { fifth: 4.4 });
}
export function mbNg(p?: ParamValues): MeshBuilder { return buildTruck(mbNgSpec(p)); }
export function mbNgLod(p?: ParamValues): MeshBuilder { return lodOf(mbNgSpec(p)); }

export const MAN_F8_PARAMS = bodyParam(BOX, DROPSIDE);
export function manF8Spec(p?: ParamValues): TruckSpec {
  const kind = pick(MAN_F8_PARAMS, p) as BodyKind;
  const cab = oldCab({ length: 1.85, top: 2.95, floor: 1.2, screen: [1.9, 2.62], corner: 0.18, grille: "bars" });
  const ch = frame(8.6, 0.52, [steer(1.45), drive(5.6)], { frame: 1.05, hitch: 0.85 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "box" ? 3.7 : 2.0, { floor: 1.25 }), { cab: "#e8e2cf", cab2: "#a3262a", body: "#a3262a" },
    { trailers: [drawbar(kind, 7.8, { top: kind === "box" ? 3.7 : 2.0, floor: 1.25 })], bendDeg: 55 });
}
export function manF8(p?: ParamValues): MeshBuilder { return buildTruck(manF8Spec(p)); }
export function manF8Lod(p?: ParamValues): MeshBuilder { return lodOf(manF8Spec(p)); }

export const MAN_TGL_PARAMS = bodyParam(BOX, CURTAIN);
export function manTglSpec(p?: ParamValues): TruckSpec {
  const cab = euCab("day", { length: 1.65, width: 2.24, floor: 1.05, top: 2.75, screen: [1.75, 2.55], corner: 0.16, visor: false, grille: "bars" });
  const ch = frame(7.7, 0.44, [steer(1.3), drive(5.0)], { frame: 0.9, guards: true });
  return rigid(cab, ch, behindCab(pick(MAN_TGL_PARAMS, p) as BodyKind, cab, ch, 3.55, { floor: 1.08, hw: 1.22 }), { cab: "#e9ebee", body: "#f4f4f2", canvas: "#3b6fb6" });
}
export function manTgl(p?: ParamValues): MeshBuilder { return buildTruck(manTglSpec(p)); }
export function manTglLod(p?: ParamValues): MeshBuilder { return lodOf(manTglSpec(p)); }

// --- the Netherlands

export const DAF_XF_PARAMS = bodyParam(CONTAINER, CURTAIN);
export function dafXfSpec(p?: ParamValues): TruckSpec {
  return tractor(euCab("high", { top: 3.95, screen: [2.0, 2.98], lamps: "slim", grille: "bars" }), euTrailer(pick(DAF_XF_PARAMS, p), { length: pick(DAF_XF_PARAMS, p) === "container" ? 12.5 : 13.6 }),
    { cab: "#e6e7e9", cab2: "#1b4f9c", body: "#b5302a", canvas: "#1b4f9c" }, { fifth: 4.6 });
}
export function dafXf(p?: ParamValues): MeshBuilder { return buildTruck(dafXfSpec(p)); }
export function dafXfLod(p?: ParamValues): MeshBuilder { return lodOf(dafXfSpec(p)); }

export const DAF_2600_PARAMS = bodyParam(BOX, TANK);
export function daf2600Spec(p?: ParamValues): TruckSpec {
  return tractor(oldCab({ length: 2.05, top: 2.9, floor: 1.15, screen: [1.85, 2.55], rake: 0.06, corner: 0.22, grille: "bars", lamps: "round" }), euTrailer(pick(DAF_2600_PARAMS, p), { length: 10.5, axles: 2, dual: true }),
    { cab: "#b12a25", cab2: "#e8e4d8", body: "#e8e4d8" }, { fifth: 4.2 });
}
export function daf2600(p?: ParamValues): MeshBuilder { return buildTruck(daf2600Spec(p)); }
export function daf2600Lod(p?: ParamValues): MeshBuilder { return lodOf(daf2600Spec(p)); }

export const DAF_CF_REFUSE_PARAMS = param("livery", "Livery", [["white", "White"], ["green", "Green"]]);
export function dafCfRefuseSpec(p?: ParamValues): TruckSpec {
  const green = pick(DAF_CF_REFUSE_PARAMS, p) === "green";
  const cab = euCab("day", { length: 1.75, top: 3.05, floor: 1.25, screen: [2.0, 2.85], visor: false, beacon: "amber", grille: "bars" });
  const ch = frame(9.1, 0.5, [steer(1.4), drive(5.45), tag(6.8, false)], { frame: 1.05 });
  return rigid(cab, ch, behindCab("refuse", cab, ch, 3.5, { floor: 1.2, to: 8.0 }),
    green ? { cab: "#2f8f4e", body: "#2f8f4e", body2: "#2f8f4e", cab2: "#f2c230" } : { cab: "#f2f3f2", body: "#f2f3f2", body2: "#e5e7e9", cab2: "#f28c1c" });
}
export function dafCfRefuse(p?: ParamValues): MeshBuilder { return buildTruck(dafCfRefuseSpec(p)); }
export function dafCfRefuseLod(p?: ParamValues): MeshBuilder { return lodOf(dafCfRefuseSpec(p)); }

// --- Italy

export const IVECO_S_WAY_PARAMS = bodyParam(CURTAIN, TANK);
export function ivecoSWaySpec(p?: ParamValues): TruckSpec {
  return tractor(euCab("high", { top: 3.95, screen: [2.0, 2.98], lamps: "slim", grille: "bars" }), euTrailer(pick(IVECO_S_WAY_PARAMS, p)),
    { cab: "#1a4fa0", cab2: "#2b2d31", body: "#eef0f2", canvas: "#1a4fa0" }, { fifth: 4.6 });
}
export function ivecoSWay(p?: ParamValues): MeshBuilder { return buildTruck(ivecoSWaySpec(p)); }
export function ivecoSWayLod(p?: ParamValues): MeshBuilder { return lodOf(ivecoSWaySpec(p)); }

export const TURBOSTAR_PARAMS = bodyParam(BOX, CURTAIN);
export function ivecoTurbostarSpec(p?: ParamValues): TruckSpec {
  return tractor(oldCab({ length: 2.2, top: 3.35, floor: 1.3, screen: [2.0, 2.75], rake: 0.1, corner: 0.12, grille: "slots", lamps: "rect", mirrors: "arm", deflector: 3.9 }), euTrailer(pick(TURBOSTAR_PARAMS, p)),
    { cab: "#f2f1ec", cab2: "#c41f2a", body: "#f2f1ec", canvas: "#c41f2a" }, { fifth: 4.5, axles: "6x2" });
}
export function ivecoTurbostar(p?: ParamValues): MeshBuilder { return buildTruck(ivecoTurbostarSpec(p)); }
export function ivecoTurbostarLod(p?: ParamValues): MeshBuilder { return lodOf(ivecoTurbostarSpec(p)); }

export const IVECO_DAILY_PARAMS = bodyParam(["van", "Van"], DROPSIDE);
export function ivecoDailySpec(p?: ParamValues): TruckSpec {
  const van = pick(IVECO_DAILY_PARAMS, p) === "van";
  const cab: CabSpec = { kind: "van", length: van ? 5.6 : 1.85, width: 2.0, floor: 0.42, top: van ? 2.7 : 2.3, screen: [1.25, 1.95], rake: 0.4, corner: 0.15, bonnet: { length: 0.55, y: 1.2 }, grille: "slots", lamps: "rect", mirrors: "small" };
  const ch = frame(van ? 5.68 : 5.9, 0.36, [steer(0.85), drive(4.45)], { frame: 0.75, tanks: "none" });
  return rigid(cab, ch, van ? body("none", 0, 0, 0, 0) : behindCab("dropside", cab, ch, 1.4, { floor: 0.92, hw: 1.0, gap: 0.08 }), { cab: "#f1f2f0", body: "#c4c7ca" });
}
export function ivecoDaily(p?: ParamValues): MeshBuilder { return buildTruck(ivecoDailySpec(p)); }
export function ivecoDailyLod(p?: ParamValues): MeshBuilder { return lodOf(ivecoDailySpec(p)); }

export const FIAT_682_PARAMS = bodyParam(DROPSIDE, TANK);
export function fiat682Spec(p?: ParamValues): TruckSpec {
  const kind = pick(FIAT_682_PARAMS, p);
  const cab = oldBonnet({ width: 2.4, top: 2.6, floor: 1.25, screen: [1.85, 2.35], hood: { length: 1.75, top: 1.95, hw: 0.55 } });
  const ch = frame(9.0, 0.55, [steer(1.1), drive(6.2)], { frame: 1.05, tanks: "none" });
  return rigid(cab, ch, behindCab(kind === "tank" ? "tank" : "dropside", cab, ch, kind === "tank" ? 2.95 : 1.95, { floor: kind === "tank" ? 1.2 : 1.3, hw: 1.2 }),
    { cab: "#6d8e9b", body: kind === "tank" ? "#cfd3d6" : "#7a5c3f", rim: "#c5c1b5" });
}
export function fiat682(p?: ParamValues): MeshBuilder { return buildTruck(fiat682Spec(p)); }
export function fiat682Lod(p?: ParamValues): MeshBuilder { return lodOf(fiat682Spec(p)); }

// --- France and Spain

export const RENAULT_T_PARAMS = bodyParam(CURTAIN, BOX);
export function renaultTSpec(p?: ParamValues): TruckSpec {
  return tractor(euCab("high", { top: 3.95, screen: [2.02, 2.98], corner: 0.24, lamps: "slim", grille: "bars" }), euTrailer(pick(RENAULT_T_PARAMS, p)),
    { cab: "#d4a017", cab2: "#202225", body: "#f3f3f1", canvas: "#d4a017" }, { fifth: 4.6 });
}
export function renaultT(p?: ParamValues): MeshBuilder { return buildTruck(renaultTSpec(p)); }
export function renaultTLod(p?: ParamValues): MeshBuilder { return lodOf(renaultTSpec(p)); }

export const MAGNUM_PARAMS = bodyParam(CURTAIN, REEFER);
export function renaultMagnumSpec(p?: ParamValues): TruckSpec {
  // the flat-floored cab on its own deck, high above the engine
  return tractor(euCab("high", { length: 2.35, floor: 1.6, top: 4.0, screen: [2.25, 3.15], rake: 0.12, corner: 0.12, grille: "slots", lamps: "rect", visor: false }), euTrailer(pick(MAGNUM_PARAMS, p)),
    { cab: "#8c1f27", cab2: "#2a2b2e", body: "#f2f2f0", canvas: "#8c1f27" }, { fifth: 4.6 });
}
export function renaultMagnum(p?: ParamValues): MeshBuilder { return buildTruck(renaultMagnumSpec(p)); }
export function renaultMagnumLod(p?: ParamValues): MeshBuilder { return lodOf(renaultMagnumSpec(p)); }

export function berlietT100Spec(): TruckSpec {
  const cab = squareBonnet({ length: 2.2, width: 3.2, floor: 2.6, top: 4.7, screen: [3.45, 4.25], hood: { length: 3.2, top: 3.4, hw: 1.6 }, grille: "bars", mirrors: "arm" });
  const ch = frame(13.4, 1.15, [steerDrive(2.1), drive(8.2, false), drive(10.4, false)], { frame: 2.0, track: 2.45, tyre: 0.8, tanks: "box" });
  return rigid(cab, ch, behindCab("tipper", cab, ch, 4.85, { floor: 2.6, hw: 2.4, gap: 0.3 }), { cab: "#c79a2b", cab2: "#3a3b3e", body: "#b98d27" }, { steerDeg: 32 });
}
export function berlietT100(): MeshBuilder { return buildTruck(berlietT100Spec()); }
export function berlietT100Lod(): MeshBuilder { return lodOf(berlietT100Spec()); }

export const CITROEN_H_PARAMS = colourParam(["grey", "Grey"], ["red", "Red"], ["blue", "Blue"]);
const CITROEN_H_COLOURS: Record<string, string> = { grey: "#9a9e9f", red: "#a4282b", blue: "#2c4c7a" };
export function citroenHVanSpec(p?: ParamValues): TruckSpec {
  const c = CITROEN_H_COLOURS[pick(CITROEN_H_PARAMS, p)]!;
  return rigid({ kind: "van", length: 4.26, width: 1.99, floor: 0.32, top: 2.35, screen: [1.25, 1.75], rake: 0.12, corner: 0.2, bonnet: { length: 0.45, y: 1.15 }, grille: "bars", lamps: "round", mirrors: "small", ribs: 0.11 },
    frame(4.2, 0.34, [steer(0.62), drive(3.15, false)], { frame: 0.55, tanks: "none" }), body("none", 0, 0, 0, 0), { cab: c, rim: "#c9ccce" });
}
export function citroenHVan(p?: ParamValues): MeshBuilder { return buildTruck(citroenHVanSpec(p)); }
export function citroenHVanLod(p?: ParamValues): MeshBuilder { return lodOf(citroenHVanSpec(p)); }

export const PEGASO_COMET_PARAMS = bodyParam(DROPSIDE, BOX);
export function pegasoCometSpec(p?: ParamValues): TruckSpec {
  const cab = oldCab({ length: 1.7, top: 2.75, floor: 1.15, screen: [1.8, 2.45], corner: 0.22, grille: "bars", lamps: "round" });
  const ch = frame(7.3, 0.5, [steer(1.35), drive(5.0)], { frame: 1.0 });
  const kind = pick(PEGASO_COMET_PARAMS, p) as BodyKind;
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "box" ? 3.4 : 1.85, { floor: 1.2, hw: 1.2 }), { cab: "#3c74a8", cab2: "#ece9df", body: kind === "box" ? "#ece9df" : "#7f5f3f" });
}
export function pegasoComet(p?: ParamValues): MeshBuilder { return buildTruck(pegasoCometSpec(p)); }
export function pegasoCometLod(p?: ParamValues): MeshBuilder { return lodOf(pegasoCometSpec(p)); }

// --- Czechoslovakia, Poland, Hungary

export const TATRA_148_PARAMS = bodyParam(TIPPER, DROPSIDE);
export function tatra148Spec(p?: ParamValues): TruckSpec {
  const kind = pick(TATRA_148_PARAMS, p);
  const cab = squareBonnet({ length: 1.55, width: 2.5, floor: 1.35, top: 2.85, screen: [1.95, 2.55], hood: { length: 1.75, top: 1.9, hw: 0.75, style: "round" }, grille: "slots", lamps: "round", mirrors: "small" });
  const ch = frame(8.3, 0.56, [steerDrive(1.15), drive(5.25), drive(6.57)], { frame: 1.2, tanks: "box" });
  return rigid(cab, ch, behindCab(kind === "tipper" ? "tipper" : "dropside", cab, ch, kind === "tipper" ? 2.55 : 2.1, { floor: 1.45, hw: 1.24, load: kind === "tipper" ? "gravel" : "none" }),
    { cab: "#e07b1f", cab2: "#2a2b2d", body: kind === "tipper" ? "#e07b1f" : "#6e6a5e" });
}
export function tatra148(p?: ParamValues): MeshBuilder { return buildTruck(tatra148Spec(p)); }
export function tatra148Lod(p?: ParamValues): MeshBuilder { return lodOf(tatra148Spec(p)); }

export const TATRA_815_PARAMS = bodyParam(TIPPER, ["crane", "Crane"]);
export function tatra815Spec(p?: ParamValues): TruckSpec {
  const kind = pick(TATRA_815_PARAMS, p);
  const cab = oldCab({ length: 1.95, width: 2.5, floor: 1.5, top: 3.2, screen: [2.15, 2.85], rake: 0.12, corner: 0.1, grille: "bars", lamps: "round", mirrors: "arm" });
  const ch = frame(9.6, 0.6, [steerDrive(1.5), steerDrive(3.15), drive(6.6), drive(8.05)], { frame: 1.3 });
  return rigid(cab, ch, behindCab(kind === "crane" ? "crane" : "tipper", cab, ch, kind === "crane" ? 2.1 : 2.95, { floor: 1.6, hw: 1.24, load: kind === "tipper" ? "gravel" : "none", gap: kind === "crane" ? 1.0 : 0.12 }),
    { cab: "#cf2d27", cab2: "#2b2c2e", body: kind === "crane" ? "#5e5d58" : "#cf2d27", body2: kind === "crane" ? "#2f6fb7" : "#a32420" });
}
export function tatra815(p?: ParamValues): MeshBuilder { return buildTruck(tatra815Spec(p)); }
export function tatra815Lod(p?: ParamValues): MeshBuilder { return lodOf(tatra815Spec(p)); }

export const TATRA_PHOENIX_PARAMS = bodyParam(TIPPER, MIXER);
export function tatraPhoenixSpec(p?: ParamValues): TruckSpec {
  const kind = pick(TATRA_PHOENIX_PARAMS, p);
  const cab = euCab("day", { length: 1.75, width: 2.5, floor: 1.55, top: 3.3, screen: [2.25, 3.05], visor: false, band: 1.95, grille: "bars" });
  const ch = frame(8.2, 0.57, [steerDrive(1.5), drive(5.0), drive(6.35)], { frame: 1.3 });
  return rigid(cab, ch, behindCab(kind === "mixer" ? "mixer" : "tipper", cab, ch, kind === "mixer" ? 3.95 : 2.95, { floor: 1.55, load: "gravel" }),
    { cab: "#2a6db3", cab2: "#3a3b3f", body: kind === "mixer" ? "#eceeef" : "#5b5d61", body2: "#9fa4aa" });
}
export function tatraPhoenix(p?: ParamValues): MeshBuilder { return buildTruck(tatraPhoenixSpec(p)); }
export function tatraPhoenixLod(p?: ParamValues): MeshBuilder { return lodOf(tatraPhoenixSpec(p)); }

export const AVIA_A31_PARAMS = bodyParam(DROPSIDE, BOX);
export function aviaA31Spec(p?: ParamValues): TruckSpec {
  const kind = pick(AVIA_A31_PARAMS, p) as BodyKind;
  const cab = narrowCab(2.1, { length: 1.55, floor: 0.95, top: 2.3, screen: [1.45, 2.05], rake: 0.1, corner: 0.16, grille: "slots", lamps: "round" });
  const ch = frame(5.9, 0.4, [steer(1.0), drive(3.95)], { frame: 0.82 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "box" ? 3.0 : 1.45, { floor: 0.98, hw: 1.05 }), { cab: "#e4dfcf", cab2: "#3a6ea5", body: kind === "box" ? "#d9d4c4" : "#5d6b4b" });
}
export function aviaA31(p?: ParamValues): MeshBuilder { return buildTruck(aviaA31Spec(p)); }
export function aviaA31Lod(p?: ParamValues): MeshBuilder { return lodOf(aviaA31Spec(p)); }

export const LIAZ_100_PARAMS = bodyParam(BOX, TANK);
export function liaz100Spec(p?: ParamValues): TruckSpec {
  return tractor(oldCab({ length: 1.95, top: 3.0, floor: 1.3, screen: [1.98, 2.7], rake: 0.1, corner: 0.1, grille: "slots", lamps: "rect", mirrors: "arm" }), euTrailer(pick(LIAZ_100_PARAMS, p), { length: 12.0, axles: 2, dual: true }),
    { cab: "#3e6c3a", cab2: "#e9e6dc", body: "#e9e6dc" }, { fifth: 4.3 });
}
export function liaz100(p?: ParamValues): MeshBuilder { return buildTruck(liaz100Spec(p)); }
export function liaz100Lod(p?: ParamValues): MeshBuilder { return lodOf(liaz100Spec(p)); }

export const PRAGA_V3S_PARAMS = bodyParam(CANVAS, DROPSIDE);
export function pragaV3sSpec(p?: ParamValues): TruckSpec {
  const kind = pick(PRAGA_V3S_PARAMS, p) as BodyKind;
  const cab = oldBonnet({ width: 2.3, top: 2.5, floor: 1.3, screen: [1.8, 2.25], hood: { length: 1.55, top: 1.95, hw: 0.5, style: "square" }, split: true });
  const ch = frame(6.9, 0.53, [steerDrive(1.0), drive(4.4), drive(5.52)], { frame: 1.1, tanks: "none" });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "canvas" ? 2.9 : 1.95, { floor: 1.35, hw: 1.15 }), { cab: "#556b3a", body: "#556b3a", canvas: "#5f6b4c", rim: "#4a5a33" });
}
export function pragaV3s(p?: ParamValues): MeshBuilder { return buildTruck(pragaV3sSpec(p)); }
export function pragaV3sLod(p?: ParamValues): MeshBuilder { return lodOf(pragaV3sSpec(p)); }

export const SKODA_706_RT_PARAMS = bodyParam(DROPSIDE, BOX);
export function skoda706RtSpec(p?: ParamValues): TruckSpec {
  const kind = pick(SKODA_706_RT_PARAMS, p) as BodyKind;
  const cab = oldCab({ length: 1.75, width: 2.45, top: 2.85, floor: 1.2, screen: [1.85, 2.5], rake: 0.12, corner: 0.28, grille: "bars", lamps: "round" });
  const ch = frame(8.4, 0.55, [steer(1.4), drive(5.6)], { frame: 1.1, hitch: 0.85 });
  const top = kind === "box" ? 3.5 : 2.0;
  return rigid(cab, ch, behindCab(kind, cab, ch, top, { floor: 1.3 }), { cab: "#2f6aa3", cab2: "#e8e3d3", body: kind === "box" ? "#e8e3d3" : "#6b5a3e" },
    { trailers: [drawbar(kind, 7.5, { top, floor: 1.3 })], bendDeg: 55 });
}
export function skoda706Rt(p?: ParamValues): MeshBuilder { return buildTruck(skoda706RtSpec(p)); }
export function skoda706RtLod(p?: ParamValues): MeshBuilder { return lodOf(skoda706RtSpec(p)); }

export const STAR_266_PARAMS = bodyParam(CANVAS, DROPSIDE);
export function star266Spec(p?: ParamValues): TruckSpec {
  const kind = pick(STAR_266_PARAMS, p) as BodyKind;
  const cab = oldCab({ length: 1.75, width: 2.5, floor: 1.45, top: 2.95, screen: [2.05, 2.62], rake: 0.12, corner: 0.08, grille: "slots", lamps: "round", mirrors: "small" });
  const ch = frame(7.0, 0.56, [steerDrive(1.35), drive(4.6), drive(5.85)], { frame: 1.2 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "canvas" ? 3.0 : 2.1, { floor: 1.45, hw: 1.22 }), { cab: "#4e5d3a", body: "#4e5d3a", canvas: "#59664a", rim: "#3e4a30" });
}
export function star266(p?: ParamValues): MeshBuilder { return buildTruck(star266Spec(p)); }
export function star266Lod(p?: ParamValues): MeshBuilder { return lodOf(star266Spec(p)); }

export const CSEPEL_PARAMS = bodyParam(DROPSIDE, TIPPER);
export function csepelD450Spec(p?: ParamValues): TruckSpec {
  const kind = pick(CSEPEL_PARAMS, p);
  const cab = oldBonnet({ width: 2.35, top: 2.4, floor: 1.15, screen: [1.72, 2.15], hood: { length: 1.55, top: 1.75, hw: 0.5 } });
  const ch = frame(6.7, 0.5, [steer(1.0), drive(4.6)], { frame: 1.0, tanks: "none" });
  return rigid(cab, ch, behindCab(kind === "tipper" ? "tipper" : "dropside", cab, ch, kind === "tipper" ? 2.0 : 1.75, { floor: 1.2, hw: 1.15, load: kind === "tipper" ? "gravel" : "none" }),
    { cab: "#7b2a26", body: "#5f6b4e", rim: "#3d3e3a" });
}
export function csepelD450(p?: ParamValues): MeshBuilder { return buildTruck(csepelD450Spec(p)); }
export function csepelD450Lod(p?: ParamValues): MeshBuilder { return lodOf(csepelD450Spec(p)); }

// --- the Soviet Union and its successors

export const KAMAZ_5320_PARAMS = bodyParam(CANVAS, DROPSIDE);
export function kamaz5320Spec(p?: ParamValues): TruckSpec {
  const kind = pick(KAMAZ_5320_PARAMS, p) as BodyKind;
  const cab = oldCab({ length: 1.95, width: 2.5, floor: 1.35, top: 3.05, screen: [2.0, 2.7], rake: 0.12, corner: 0.08, grille: "slots", lamps: "round", mirrors: "arm" });
  const ch = frame(7.45, 0.52, [steer(1.3), drive(4.8), drive(6.12)], { frame: 1.15 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "canvas" ? 3.4 : 2.05, { floor: 1.38, hw: 1.24 }), { cab: "#2c5d9a", cab2: "#e9e6dc", body: "#5d6b4c", canvas: "#4f6b8c" });
}
export function kamaz5320(p?: ParamValues): MeshBuilder { return buildTruck(kamaz5320Spec(p)); }
export function kamaz5320Lod(p?: ParamValues): MeshBuilder { return lodOf(kamaz5320Spec(p)); }

export const KAMAZ_54901_PARAMS = bodyParam(CURTAIN, TANK);
export function kamaz54901Spec(p?: ParamValues): TruckSpec {
  return tractor(euCab("high", { top: 3.95, screen: [2.0, 2.98], lamps: "slim", grille: "bars" }), euTrailer(pick(KAMAZ_54901_PARAMS, p)),
    { cab: "#1d3f8c", cab2: "#e2e4e6", body: "#eef0f2", canvas: "#1d3f8c" }, { fifth: 4.6 });
}
export function kamaz54901(p?: ParamValues): MeshBuilder { return buildTruck(kamaz54901Spec(p)); }
export function kamaz54901Lod(p?: ParamValues): MeshBuilder { return lodOf(kamaz54901Spec(p)); }

export const ZIL_130_PARAMS = bodyParam(DROPSIDE, ["tanker", "Tanker"]);
export function zil130Spec(p?: ParamValues): TruckSpec {
  const tank = pick(ZIL_130_PARAMS, p) === "tanker";
  const cab = squareBonnet({ length: 1.5, width: 2.5, floor: 1.15, top: 2.4, screen: [1.7, 2.15], rake: 0.12, corner: 0.2, hood: { length: 1.75, top: 1.62, hw: 0.95, style: "round" }, grille: "bars", lamps: "round", mirrors: "small" });
  const ch = frame(6.67, 0.48, [steer(1.0), drive(4.8)], { frame: 0.95, tanks: "none" });
  return rigid(cab, ch, behindCab(tank ? "tank" : "dropside", cab, ch, tank ? 2.5 : 1.75, { floor: tank ? 1.05 : 1.15, hw: tank ? 1.0 : 1.2 }),
    { cab: "#3f6f9e", body: tank ? "#cf5a1f" : "#5f6b4d", rim: "#c3c3bc" });
}
export function zil130(p?: ParamValues): MeshBuilder { return buildTruck(zil130Spec(p)); }
export function zil130Lod(p?: ParamValues): MeshBuilder { return lodOf(zil130Spec(p)); }

export function gaz51Spec(): TruckSpec {
  const cab = oldBonnet({ width: 2.2, top: 2.13, floor: 1.05, screen: [1.55, 1.95], hood: { length: 1.55, top: 1.55, hw: 0.42 } });
  const ch = frame(5.72, 0.46, [steer(1.0), drive(4.3)], { frame: 0.9, tanks: "none" });
  return rigid(cab, ch, behindCab("dropside", cab, ch, 1.75, { floor: 1.15, hw: 1.1 }), { cab: "#4f6b3f", body: "#6b5a3e", rim: "#3f4a33" });
}
export function gaz51(): MeshBuilder { return buildTruck(gaz51Spec()); }
export function gaz51Lod(): MeshBuilder { return lodOf(gaz51Spec()); }

export const GAZ_66_PARAMS = bodyParam(CANVAS, DROPSIDE);
export function gaz66Spec(p?: ParamValues): TruckSpec {
  const kind = pick(GAZ_66_PARAMS, p) as BodyKind;
  const cab = oldCab({ length: 1.55, width: 2.32, floor: 1.4, top: 2.5, screen: [1.85, 2.3], rake: 0.08, corner: 0.15, grille: "slots", lamps: "round", mirrors: "small", split: true });
  const ch = frame(5.65, 0.55, [steerDrive(1.2), drive(4.5)], { frame: 1.2, tanks: "none", tyre: 0.33 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "canvas" ? 2.52 : 1.95, { floor: 1.35, hw: 1.1 }), { cab: "#4f5d3a", body: "#4f5d3a", canvas: "#5a664a", rim: "#3e4a30" }, { steerDeg: 36 });
}
export function gaz66(p?: ParamValues): MeshBuilder { return buildTruck(gaz66Spec(p)); }
export function gaz66Lod(p?: ParamValues): MeshBuilder { return lodOf(gaz66Spec(p)); }

export const MAZ_500_PARAMS = bodyParam(DROPSIDE, TIPPER);
export function maz500Spec(p?: ParamValues): TruckSpec {
  const kind = pick(MAZ_500_PARAMS, p);
  const cab = oldCab({ length: 1.75, width: 2.5, floor: 1.3, top: 2.65, screen: [1.9, 2.4], rake: 0.06, corner: 0.08, grille: "bars", lamps: "round", mirrors: "small", split: true });
  const ch = frame(7.14, 0.55, [steer(1.35), drive(5.2)], { frame: 1.1 });
  return rigid(cab, ch, behindCab(kind === "tipper" ? "tipper" : "dropside", cab, ch, kind === "tipper" ? 2.35 : 1.95, { floor: 1.3, hw: 1.22, load: kind === "tipper" ? "gravel" : "none" }),
    { cab: "#3d6a3a", cab2: "#dcd6c4", body: kind === "tipper" ? "#3d6a3a" : "#6b5a3e" });
}
export function maz500(p?: ParamValues): MeshBuilder { return buildTruck(maz500Spec(p)); }
export function maz500Lod(p?: ParamValues): MeshBuilder { return lodOf(maz500Spec(p)); }

export function belaz75710Spec(): TruckSpec {
  return {
    livery: { cab: "#f1f1ee", cab2: "#2b2b2b", body: "#f1f1ee", body2: "#1f7a3a", load: "#6d5f50" },
    cab: { kind: "mining", length: 2.6, width: 2.3, floor: 6.0, top: 8.16, screen: [6.7, 7.9], rake: 0.1, grille: "bars", lamps: "rect", mirrors: "arm", deck: { y: 6.0, to: 5.0 }, offset: -3.4 },
    chassis: frame(19.6, 1.78, [steerDrive(3.1), steerDrive(6.4), drive(13.8), drive(17.1)], { frame: 3.2, tanks: "none", track: 4.9, tyre: 1.45 }),
    body: body("dump", 4.6, 20.6, 3.6, 7.6, { hw: 4.94, load: "none" }),
    steerDeg: 30,
  };
}
export function belaz75710(): MeshBuilder { return buildTruck(belaz75710Spec()); }
export function belaz75710Lod(): MeshBuilder { return lodOf(belaz75710Spec()); }

export const KRAZ_255_PARAMS = bodyParam(DROPSIDE, CANVAS);
export function kraz255Spec(p?: ParamValues): TruckSpec {
  const kind = pick(KRAZ_255_PARAMS, p) as BodyKind;
  const cab = squareBonnet({ length: 1.6, width: 2.75, floor: 1.45, top: 2.94, screen: [2.05, 2.6], hood: { length: 2.2, top: 2.0, hw: 1.15 }, grille: "bars", lamps: "round", mirrors: "small", split: true });
  const ch = frame(8.65, 0.69, [steerDrive(1.3), drive(6.0, false), drive(7.4, false)], { frame: 1.3, tanks: "box", tyre: 0.42, track: 1.36 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "canvas" ? 3.1 : 2.3, { floor: 1.6, hw: 1.3 }), { cab: "#4d5a35", body: "#4d5a35", canvas: "#59644a", rim: "#3a4428" }, { steerDeg: 34 });
}
export function kraz255(p?: ParamValues): MeshBuilder { return buildTruck(kraz255Spec(p)); }
export function kraz255Lod(p?: ParamValues): MeshBuilder { return lodOf(kraz255Spec(p)); }

export const URAL_4320_PARAMS = bodyParam(CANVAS, DROPSIDE);
export function ural4320Spec(p?: ParamValues): TruckSpec {
  const kind = pick(URAL_4320_PARAMS, p) as BodyKind;
  const cab = squareBonnet({ length: 1.55, width: 2.5, floor: 1.55, top: 2.87, screen: [2.1, 2.6], hood: { length: 1.9, top: 2.0, hw: 1.05, style: "round" }, grille: "slots", lamps: "round", mirrors: "small", split: true });
  const ch = frame(7.37, 0.61, [steerDrive(1.2), drive(4.9, false), drive(6.3, false)], { frame: 1.35, tanks: "box", tyre: 0.38, track: 1.25 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "canvas" ? 3.0 : 2.3, { floor: 1.55, hw: 1.22 }), { cab: "#4b5a38", body: "#4b5a38", canvas: "#57634a", rim: "#384428" }, { steerDeg: 34 });
}
export function ural4320(p?: ParamValues): MeshBuilder { return buildTruck(ural4320Spec(p)); }
export function ural4320Lod(p?: ParamValues): MeshBuilder { return lodOf(ural4320Spec(p)); }

// --- Britain

export const BEDFORD_TK_PARAMS = bodyParam(DROPSIDE, BOX);
export function bedfordTkSpec(p?: ParamValues): TruckSpec {
  const kind = pick(BEDFORD_TK_PARAMS, p) as BodyKind;
  // the TK's cab sits behind the engine, low over the front wheels
  const cab = oldCab({ length: 1.6, width: 2.3, floor: 0.85, top: 2.45, screen: [1.45, 2.15], rake: 0.12, corner: 0.18, grille: "bars", lamps: "round" });
  const ch = frame(7.0, 0.47, [steer(1.15), drive(4.9)], { frame: 0.95 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "box" ? 3.5 : 1.75, { floor: 1.12, hw: 1.2 }), { cab: "#1e6b3a", cab2: "#e9e3cf", body: kind === "box" ? "#e9e3cf" : "#7a5c3f" });
}
export function bedfordTk(p?: ParamValues): MeshBuilder { return buildTruck(bedfordTkSpec(p)); }
export function bedfordTkLod(p?: ParamValues): MeshBuilder { return lodOf(bedfordTkSpec(p)); }

export const AEC_MAMMOTH_PARAMS = bodyParam(DROPSIDE, ["tanker", "Tanker"]);
export function aecMammothMajorSpec(p?: ParamValues): TruckSpec {
  const tank = pick(AEC_MAMMOTH_PARAMS, p) === "tanker";
  const cab = oldBonnet({ width: 2.35, top: 2.6, floor: 1.25, screen: [1.85, 2.3], hood: { length: 1.55, top: 1.95, hw: 0.55, style: "square" } });
  const ch = frame(9.1, 0.5, [steer(0.95), steer(2.4), drive(6.4), drive(7.7)], { frame: 1.05, tanks: "none" });
  return rigid(cab, ch, behindCab(tank ? "tank" : "dropside", cab, ch, tank ? 2.8 : 1.9, { floor: tank ? 1.15 : 1.25, hw: 1.15 }),
    { cab: "#1f3f6f", body: tank ? "#c9c2ad" : "#7a5c3f", rim: "#1f3f6f" });
}
export function aecMammothMajor(p?: ParamValues): MeshBuilder { return buildTruck(aecMammothMajorSpec(p)); }
export function aecMammothMajorLod(p?: ParamValues): MeshBuilder { return lodOf(aecMammothMajorSpec(p)); }

export function scammellContractorSpec(): TruckSpec {
  const cab = squareBonnet({ length: 1.9, width: 2.6, floor: 1.45, top: 3.1, screen: [2.1, 2.75], hood: { length: 2.2, top: 2.1, hw: 1.2 }, grille: "bars", lamps: "round", mirrors: "arm", beacon: "amber" });
  return tractor(cab, euSemi("lowLoader", { load: "machine", axles: 4, length: 14.0, wheel: 0.42, dual: true, rear: 1.2 }),
    { cab: "#c4422b", cab2: "#2b2c2e", body: "#2f3034", art: "#e8b41c", load: "#e8b41c" }, { axles: "6x4", front: 1.1, wheel: 0.58, frameY: 1.1, fifth: 6.4, extra: { bendDeg: 60 } });
}
export function scammellContractor(): MeshBuilder { return buildTruck(scammellContractorSpec()); }
export function scammellContractorLod(): MeshBuilder { return lodOf(scammellContractorSpec()); }

export const TRANSIT_PARAMS = colourParam(["white", "White"], ["red", "Red"], ["blue", "Blue"]);
const TRANSIT_COLOURS: Record<string, string> = { white: "#ecebe4", red: "#b02a25", blue: "#2b4f86" };
export function fordTransitMk1Spec(p?: ParamValues): TruckSpec {
  return rigid(
    { kind: "van", length: 4.42, width: 1.97, floor: 0.32, top: 2.0, screen: [1.0, 1.55], rake: 0.35, corner: 0.18, bonnet: { length: 0.75, y: 0.98 }, grille: "bars", lamps: "round", mirrors: "small" },
    frame(4.4, 0.33, [steer(0.85), drive(3.6, false)], { frame: 0.55, tanks: "none" }),
    body("none", 0, 0, 0, 0), { cab: TRANSIT_COLOURS[pick(TRANSIT_PARAMS, p)]!, rim: "#c6c9ce" },
  );
}
export function fordTransitMk1(p?: ParamValues): MeshBuilder { return buildTruck(fordTransitMk1Spec(p)); }
export function fordTransitMk1Lod(p?: ParamValues): MeshBuilder { return lodOf(fordTransitMk1Spec(p)); }

/** A fire engine's crew cab and its locker body, red with the reflective band. */
function fireEngine(cab: CabSpec, length: number, axles: TruckSpec["chassis"]["axles"], wheel: number, top: number, livery: Livery, o: { kind?: BodyKind; monitor?: boolean; frameY?: number } = {}): TruckSpec {
  const ch = frame(length, wheel, axles, { frame: o.frameY ?? 1.0, tanks: "none" });
  return rigid(cab, ch, behindCab(o.kind ?? "fire", cab, ch, top, { floor: (o.frameY ?? 1.0) + 0.05, gap: 0.05, ...(o.monitor ? { load: "machine" } : {}) }), livery);
}
const FIRE_RED: Livery = { cab: "#c01b1b", cab2: "#f2f2ee", body: "#c01b1b", body2: "#c9ccd0", art: "#f2e23a" };

export function dennisSabreSpec(): TruckSpec {
  return fireEngine(euCab("day", { length: 2.75, width: 2.45, floor: 0.95, top: 3.0, screen: [1.75, 2.65], crew: true, beacon: "bar", grille: "bars", visor: false, band: 1.25 }),
    8.4, [steer(1.45), drive(5.25)], 0.48, 3.0, FIRE_RED);
}
export function dennisSabre(): MeshBuilder { return buildTruck(dennisSabreSpec()); }
export function dennisSabreLod(): MeshBuilder { return lodOf(dennisSabreSpec()); }

export function magirusLadderSpec(): TruckSpec {
  return fireEngine(euCab("day", { length: 2.5, width: 2.5, floor: 1.15, top: 3.05, screen: [1.95, 2.8], crew: true, beacon: "bar", grille: "bars", visor: false, band: 1.4 }),
    10.0, [steer(1.5), drive(5.7), tag(7.0, false)], 0.52, 3.0, { ...FIRE_RED, body2: "#d9dcdf" }, { kind: "ladder", frameY: 1.05 });
}
export function magirusLadder(): MeshBuilder { return buildTruck(magirusLadderSpec()); }
export function magirusLadderLod(): MeshBuilder { return lodOf(magirusLadderSpec()); }

export function rosenbauerPantherSpec(): TruckSpec {
  const cab: CabSpec = { kind: "cabover", length: 2.3, width: 3.0, floor: 0.8, top: 3.4, screen: [1.75, 3.05], rake: 0.75, corner: 0.35, grille: "none", lamps: "slim", mirrors: "arm", beacon: "bar", crew: true, band: 1.2 };
  return fireEngine(cab, 12.0, [steerDrive(1.75), drive(6.9, false), drive(8.6, false)], 0.62, 3.45, { cab: "#d42a1f", cab2: "#ece9e2", body: "#d42a1f", body2: "#c8cbcf", art: "#ece9e2" }, { monitor: true, frameY: 1.15 });
}
export function rosenbauerPanther(): MeshBuilder { return buildTruck(rosenbauerPantherSpec()); }
export function rosenbauerPantherLod(): MeshBuilder { return lodOf(rosenbauerPantherSpec()); }

export function liebherrLtmSpec(): TruckSpec {
  // the carrier's cab at the front left, the boom laid forward beside it over the front
  const cab: CabSpec = { kind: "cabover", length: 1.75, width: 1.2, floor: 1.35, top: 3.2, screen: [2.0, 2.95], rake: 0.2, corner: 0.12, grille: "none", lamps: "rect", mirrors: "small", offset: -0.85, beacon: "amber" };
  const ch = frame(13.5, 0.62, [steer(1.75), steer(3.4), drive(6.9), drive(8.55), tag(10.2, false)], { frame: 1.3, tanks: "none", tyre: 0.42, track: 1.5 });
  return rigid(cab, ch, body("boom", 2.2, 13.8, 2.0, 3.6, { hw: 1.45 }), { cab: "#f5c400", cab2: "#2b2b2b", body: "#f5c400", body2: "#e0b300", art: "#2b2b2b" }, { steerDeg: 35 });
}
export function liebherrLtm(): MeshBuilder { return buildTruck(liebherrLtmSpec()); }
export function liebherrLtmLod(): MeshBuilder { return lodOf(liebherrLtmSpec()); }

export const LOHR_PARAMS = param("load", "Load", [["cars", "Cars"], ["empty", "Empty"]]);
export function lohrCarTransporterSpec(p?: ParamValues): TruckSpec {
  const cars = pick(LOHR_PARAMS, p) === "cars";
  const t = euSemi("carCarrier", { length: 13.4, floor: 0.95, top: 3.95, wheel: 0.4, dual: false, rear: 1.4, pin: 1.2 });
  // the decks begin behind the gooseneck, clear of the tractor's rear wheels
  t.body.from = 3.5;
  t.body.load = cars ? "cars" : "none";
  return tractor(euCab("day", { top: 2.95, grille: "bars", visor: false }), t,
    { cab: "#e7e9eb", cab2: "#2b2d31", body: "#3b3e43", body2: "#c8cbd0", load: "#b22a2a", art: "#2a5aa8", art2: "#d9dcdf" }, { fifth: 4.0 });
}
export function lohrCarTransporter(p?: ParamValues): MeshBuilder { return buildTruck(lohrCarTransporterSpec(p)); }
export function lohrCarTransporterLod(p?: ParamValues): MeshBuilder { return lodOf(lohrCarTransporterSpec(p)); }

// ===========================================================================
// North America

export const PETERBILT_379_PARAMS = bodyParam(DRY_VAN, FLATBED);
export function peterbilt379Spec(p?: ParamValues): TruckSpec {
  return tractor(usHood("square", { hood: { length: 2.25 }, sleeperLen: 1.6, sleeperTop: 3.2, cleaners: true }), usTrailer(pick(PETERBILT_379_PARAMS, p)),
    { cab: "#7a1420", body: "#e9eaec", rim: "#d8dbe0" }, { axles: "6x4", front: 0.95, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function peterbilt379(p?: ParamValues): MeshBuilder { return buildTruck(peterbilt379Spec(p)); }
export function peterbilt379Lod(p?: ParamValues): MeshBuilder { return lodOf(peterbilt379Spec(p)); }

export const PETERBILT_579_PARAMS = bodyParam(DRY_VAN, REEFER);
export function peterbilt579Spec(p?: ParamValues): TruckSpec {
  return tractor(usHood("aero", { hood: { length: 2.05, top: 1.9 }, sleeperLen: 2.0, sleeperTop: 3.85, deflector: 3.85 }), usTrailer(pick(PETERBILT_579_PARAMS, p)),
    { cab: "#1d3c6e", body: "#eceeef", rim: "#d8dbe0" }, { axles: "6x4", front: 0.95, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function peterbilt579(p?: ParamValues): MeshBuilder { return buildTruck(peterbilt579Spec(p)); }
export function peterbilt579Lod(p?: ParamValues): MeshBuilder { return lodOf(peterbilt579Spec(p)); }

export const W900_PARAMS = bodyParam(DRY_VAN, TANK);
export function kenworthW900Spec(p?: ParamValues): TruckSpec {
  return tractor(usHood("square", { hood: { length: 2.35, top: 1.85, hw: 0.58 }, sleeperLen: 2.0, sleeperTop: 3.6, cleaners: true }), usTrailer(pick(W900_PARAMS, p)),
    { cab: "#151719", cab2: "#c2a14a", body: "#d7dade", rim: "#d8dbe0" }, { axles: "6x4", front: 1.0, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function kenworthW900(p?: ParamValues): MeshBuilder { return buildTruck(kenworthW900Spec(p)); }
export function kenworthW900Lod(p?: ParamValues): MeshBuilder { return lodOf(kenworthW900Spec(p)); }

export const T680_PARAMS = bodyParam(DRY_VAN, FLATBED);
export function kenworthT680Spec(p?: ParamValues): TruckSpec {
  return tractor(usHood("aero", { hood: { length: 2.0, top: 1.88 }, sleeperLen: 1.9, sleeperTop: 3.85, deflector: 3.85 }), usTrailer(pick(T680_PARAMS, p)),
    { cab: "#e9eaec", cab2: "#2b2d31", body: "#d8dade", rim: "#d8dbe0" }, { axles: "6x4", front: 0.95, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function kenworthT680(p?: ParamValues): MeshBuilder { return buildTruck(kenworthT680Spec(p)); }
export function kenworthT680Lod(p?: ParamValues): MeshBuilder { return lodOf(kenworthT680Spec(p)); }

export const K100_PARAMS = bodyParam(DRY_VAN, TANK);
export function kenworthK100Spec(p?: ParamValues): TruckSpec {
  return tractor(usCabover({ length: 2.45, top: 3.55 }), usTrailer(pick(K100_PARAMS, p), { length: 14.6 }),
    { cab: "#f2efe6", cab2: "#b12a25", body: "#dfe2e5", rim: "#d8dbe0" }, { axles: "6x4", front: 1.35, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function kenworthK100(p?: ParamValues): MeshBuilder { return buildTruck(kenworthK100Spec(p)); }
export function kenworthK100Lod(p?: ParamValues): MeshBuilder { return lodOf(kenworthK100Spec(p)); }

export function kenworthC500LogSpec(): TruckSpec {
  const cab = usHood("square", { width: 2.55, hood: { length: 2.3, top: 2.05, hw: 0.7 }, sleeperLen: 0, top: 3.15, floor: 1.4, screen: [2.15, 2.9], cleaners: true });
  const ch = frame(7.6, 0.56, [steer(1.05), drive(5.75), drive(7.1)], { frame: 1.15, tanks: "round" });
  // the logs on the truck's swivel bunk over the tandem and on the pole trailer's bunk
  const logs: TrailerSpec = { kind: "drawbar", length: 17.0, pin: 6.45, axles: [tag(13.2, true), tag(14.5, true)], wheel: 0.53, body: body("logs", 0, 17.0, 1.75, 3.2, { hw: 1.25 }) };
  return rigid(cab, ch, body("none", 0, 0, 0, 0), { cab: "#d8c37a", cab2: "#2a2b2d", body: "#5a4a3a", load: "#6d5137", rim: "#d8dbe0" }, { trailers: [logs], bendDeg: 40 });
}
export function kenworthC500Log(): MeshBuilder { return buildTruck(kenworthC500LogSpec()); }
export function kenworthC500LogLod(): MeshBuilder { return lodOf(kenworthC500LogSpec()); }

export const T909_PARAMS = param("load", "Trailers", [["2", "2 trailers"], ["3", "3 trailers"]]);
export function kenworthT909Spec(p?: ParamValues): TruckSpec {
  const n = Number(pick(T909_PARAMS, p));
  const first: TrailerSpec = { ...euSemi("tipper", { length: 12.2, top: 3.4, load: "gravel" }), wheels: "lite", hitch: 0.9 };
  const dolly = (hitch: boolean): TrailerSpec => drawbar("tipper", 12.2, {
    bar: 2.4, floor: 1.45, top: 3.4, dolly: 1.4, wheels: "lite", load: "gravel", axles: [tag(0.9, true), tag(1.9, true), ...group(12.2, 3, 1.6, 1.31)], ...(hitch ? { hitch: 0.9 } : {}),
  });
  const more = n === 3 ? [dolly(true), dolly(false)] : [dolly(false)];
  return tractor(usHood("square", { width: 2.5, hood: { length: 2.2, top: 1.95, hw: 0.62 }, sleeperLen: 1.9, sleeperTop: 3.35, cleaners: true }), first,
    { cab: "#f2f2ee", cab2: "#c8102e", body: "#b7bcc2", rim: "#d8dbe0", load: "#a8573a" }, { axles: "6x4", front: 1.0, frameY: 1.05, tanks: "round", more, extra: { bendDeg: 45 } });
}
export function kenworthT909RoadTrain(p?: ParamValues): MeshBuilder { return buildTruck(kenworthT909Spec(p)); }
export function kenworthT909RoadTrainLod(p?: ParamValues): MeshBuilder { return lodOf(kenworthT909Spec(p)); }

export const CASCADIA_PARAMS = bodyParam(DRY_VAN, REEFER);
export function freightlinerCascadiaSpec(p?: ParamValues): TruckSpec {
  return tractor(usHood("aero", { hood: { length: 2.0, top: 1.85, style: "sloped" }, sleeperLen: 1.95, sleeperTop: 3.9, deflector: 3.9 }), usTrailer(pick(CASCADIA_PARAMS, p)),
    { cab: "#f0f1f2", cab2: "#1f4b8f", body: "#eceeef", rim: "#d8dbe0" }, { axles: "6x4", front: 0.95, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function freightlinerCascadia(p?: ParamValues): MeshBuilder { return buildTruck(freightlinerCascadiaSpec(p)); }
export function freightlinerCascadiaLod(p?: ParamValues): MeshBuilder { return lodOf(freightlinerCascadiaSpec(p)); }

export const MACK_B61_PARAMS = bodyParam(BOX, TANK);
export function mackB61Spec(p?: ParamValues): TruckSpec {
  const cab = oldBonnet({ width: 2.4, top: 2.65, floor: 1.3, screen: [1.9, 2.35], hood: { length: 2.0, top: 1.95, hw: 0.55, style: "round" }, grille: "chrome" });
  return tractor(cab, usTrailer(pick(MACK_B61_PARAMS, p), { length: 11.0, top: 3.8 }),
    { cab: "#e2c030", cab2: "#2b2b2b", body: "#d9dbdd", rim: "#c9ccd0" }, { axles: "6x4", front: 1.0, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function mackB61(p?: ParamValues): MeshBuilder { return buildTruck(mackB61Spec(p)); }
export function mackB61Lod(p?: ParamValues): MeshBuilder { return lodOf(mackB61Spec(p)); }

export const MACK_ANTHEM_PARAMS = bodyParam(DRY_VAN, TANK);
export function mackAnthemSpec(p?: ParamValues): TruckSpec {
  return tractor(usHood("aero", { hood: { length: 2.0, top: 1.95 }, sleeperLen: 1.8, sleeperTop: 3.8, deflector: 3.8, grille: "chrome" }), usTrailer(pick(MACK_ANTHEM_PARAMS, p)),
    { cab: "#272a2f", cab2: "#c9a13b", body: "#dfe1e4", rim: "#d8dbe0" }, { axles: "6x4", front: 0.95, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function mackAnthem(p?: ParamValues): MeshBuilder { return buildTruck(mackAnthemSpec(p)); }
export function mackAnthemLod(p?: ParamValues): MeshBuilder { return lodOf(mackAnthemSpec(p)); }

export function mackGraniteDumpSpec(): TruckSpec {
  const cab = usHood("square", { sleeperLen: 0, hood: { length: 1.8, top: 2.0, hw: 0.95 }, top: 3.1, floor: 1.35, screen: [2.1, 2.85], grille: "chrome", mirrors: "post", stacks: false });
  const ch = frame(8.5, 0.53, [steer(1.0), drive(5.4), drive(6.75)], { frame: 1.12, tanks: "round" });
  return rigid(cab, ch, behindCab("tipper", cab, ch, 2.75, { floor: 1.4, load: "gravel" }), { cab: "#d22b24", body: "#b6babf", rim: "#d8dbe0", load: "#9b8f7d" });
}
export function mackGraniteDump(): MeshBuilder { return buildTruck(mackGraniteDumpSpec()); }
export function mackGraniteDumpLod(): MeshBuilder { return lodOf(mackGraniteDumpSpec()); }

export const TRANSTAR_PARAMS = bodyParam(DRY_VAN, TANK);
export function internationalTranstarSpec(p?: ParamValues): TruckSpec {
  return tractor(usCabover({ length: 2.3, top: 3.4, grille: "bars", corner: 0.06 }), usTrailer(pick(TRANSTAR_PARAMS, p), { length: 13.7 }),
    { cab: "#e8e0c8", cab2: "#c2562a", body: "#e4e6e8", rim: "#d8dbe0" }, { axles: "6x4", front: 1.35, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function internationalTranstar(p?: ParamValues): MeshBuilder { return buildTruck(internationalTranstarSpec(p)); }
export function internationalTranstarLod(p?: ParamValues): MeshBuilder { return lodOf(internationalTranstarSpec(p)); }

export const ACCO_PARAMS = bodyParam(DROPSIDE, TIPPER);
export function internationalAccoSpec(p?: ParamValues): TruckSpec {
  const kind = pick(ACCO_PARAMS, p);
  const cab = oldCab({ length: 1.8, width: 2.45, floor: 1.25, top: 2.85, screen: [1.9, 2.55], rake: 0.08, corner: 0.1, grille: "bars", lamps: "round" });
  const ch = frame(7.6, 0.5, [steer(1.35), drive(5.0), drive(6.25)], { frame: 1.05 });
  return rigid(cab, ch, behindCab(kind === "tipper" ? "tipper" : "dropside", cab, ch, kind === "tipper" ? 2.4 : 1.9, { floor: 1.3, load: kind === "tipper" ? "gravel" : "none" }),
    { cab: "#f2efe4", cab2: "#c8352a", body: kind === "tipper" ? "#c8352a" : "#7a5c3f" });
}
export function internationalAcco(p?: ParamValues): MeshBuilder { return buildTruck(internationalAccoSpec(p)); }
export function internationalAccoLod(p?: ParamValues): MeshBuilder { return lodOf(internationalAccoSpec(p)); }

export const WS4900_PARAMS = bodyParam(DRY_VAN, FLATBED);
export function westernStar4900Spec(p?: ParamValues): TruckSpec {
  return tractor(usHood("square", { hood: { length: 2.3, top: 1.95, hw: 0.62 }, sleeperLen: 1.9, sleeperTop: 3.5, cleaners: true }), usTrailer(pick(WS4900_PARAMS, p)),
    { cab: "#22427a", cab2: "#c9ccd0", body: "#e2e4e7", rim: "#d8dbe0" }, { axles: "6x4", front: 1.0, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function westernStar4900(p?: ParamValues): MeshBuilder { return buildTruck(westernStar4900Spec(p)); }
export function westernStar4900Lod(p?: ParamValues): MeshBuilder { return lodOf(westernStar4900Spec(p)); }

export const VNL_PARAMS = bodyParam(DRY_VAN, REEFER);
export function volvoVnlSpec(p?: ParamValues): TruckSpec {
  return tractor(usHood("aero", { hood: { length: 2.0, top: 1.9 }, sleeperLen: 2.3, sleeperTop: 4.0, deflector: 4.0 }), usTrailer(pick(VNL_PARAMS, p)),
    { cab: "#9aa3ad", cab2: "#1f3a63", body: "#eceeef", rim: "#d8dbe0" }, { axles: "6x4", front: 0.95, wheel: 0.52, frameY: 1.05, tanks: "round" });
}
export function volvoVnl(p?: ParamValues): MeshBuilder { return buildTruck(volvoVnlSpec(p)); }
export function volvoVnlLod(p?: ParamValues): MeshBuilder { return lodOf(volvoVnlSpec(p)); }

export const TESLA_SEMI_PARAMS = bodyParam(DRY_VAN, REEFER);
export function teslaSemiSpec(p?: ParamValues): TruckSpec {
  // the bullet nose: a cab-over shape raked from the bumper to the roof, the driver in the middle
  const cab: CabSpec = { kind: "cabover", length: 3.6, width: 2.5, floor: 0.9, top: 3.95, screen: [1.75, 3.2], rake: 1.35, corner: 0.55, grille: "none", lamps: "slim", mirrors: "camera", visor: false };
  return tractor(cab, usTrailer(pick(TESLA_SEMI_PARAMS, p)), { cab: "#d9dcdf", cab2: "#26282b", body: "#eef0f1", rim: "#2b2d31" },
    { axles: "6x4", front: 1.7, wheel: 0.52, frameY: 1.05, tanks: "none" });
}
export function teslaSemi(p?: ParamValues): MeshBuilder { return buildTruck(teslaSemiSpec(p)); }
export function teslaSemiLod(p?: ParamValues): MeshBuilder { return lodOf(teslaSemiSpec(p)); }

export const MODEL_TT_PARAMS = bodyParam(["stake", "Flatbed"], BOX);
export function fordModelTtSpec(p?: ParamValues): TruckSpec {
  const kind = pick(MODEL_TT_PARAMS, p);
  const cab: CabSpec = { kind: "bonnet", length: 1.0, width: 1.65, floor: 0.95, top: 2.25, screen: [1.45, 1.9], rake: 0.02, corner: 0.05, hood: { length: 0.95, top: 1.38, hw: 0.32, style: "square" }, grille: "round", lamps: "round", mirrors: "small" };
  const ch = frame(4.7, 0.41, [steer(0.55), drive(3.4, false)], { frame: 0.85, tanks: "none", wheels: "spoke", tyre: 0.1, track: 0.82 });
  return rigid(cab, ch, behindCab(kind === "box" ? "box" : "dropside", cab, ch, kind === "box" ? 2.3 : 1.25, { floor: 0.95, hw: 0.85 }), { cab: "#1b1c1e", body: kind === "box" ? "#2f5a3a" : "#7a5c3f", rim: "#2b2c2e" }, { steerDeg: 32 });
}
export function fordModelTt(p?: ParamValues): MeshBuilder { return buildTruck(fordModelTtSpec(p)); }
export function fordModelTtLod(p?: ParamValues): MeshBuilder { return lodOf(fordModelTtSpec(p)); }

export const WHITE_3000_PARAMS = bodyParam(BOX, TANK);
export function white3000Spec(p?: ParamValues): TruckSpec {
  return tractor(oldCab({ length: 1.7, width: 2.3, top: 2.85, floor: 1.25, screen: [1.85, 2.45], rake: 0.18, corner: 0.35, grille: "chrome", lamps: "round" }), usTrailer(pick(WHITE_3000_PARAMS, p), { length: 9.8, top: 3.6 }),
    { cab: "#2f5d3b", cab2: "#e9e3cf", body: "#c9ccd0", rim: "#c9ccd0" }, { front: 1.3, wheel: 0.5 });
}
export function white3000(p?: ParamValues): MeshBuilder { return buildTruck(white3000Spec(p)); }
export function white3000Lod(p?: ParamValues): MeshBuilder { return lodOf(white3000Spec(p)); }

export function autocarAcxSpec(): TruckSpec {
  const cab: CabSpec = { kind: "cabover", length: 2.0, width: 2.45, floor: 0.55, top: 2.95, screen: [1.45, 2.65], rake: 0.18, corner: 0.15, grille: "bars", lamps: "rect", mirrors: "post", beacon: "amber", band: 0.95 };
  const ch = frame(9.6, 0.53, [steer(1.65), drive(6.4), drive(7.75)], { frame: 1.05, tanks: "none" });
  return rigid(cab, ch, behindCab("refuse", cab, ch, 3.75, { floor: 1.2, to: 8.6, gap: 0.1 }), { cab: "#f2f3f2", cab2: "#1f6b3a", body: "#1f6b3a", body2: "#1f6b3a" });
}
export function autocarAcx(): MeshBuilder { return buildTruck(autocarAcxSpec()); }
export function autocarAcxLod(): MeshBuilder { return lodOf(autocarAcxSpec()); }

export function pierceArrowXtSpec(): TruckSpec {
  return fireEngine({ kind: "cabover", length: 3.0, width: 2.5, floor: 1.15, top: 3.1, screen: [1.95, 2.85], rake: 0.06, corner: 0.06, grille: "chrome", lamps: "rect", mirrors: "post", beacon: "bar", crew: true, band: 1.55 },
    10.2, [steer(1.75), drive(6.25)], 0.55, 3.0, { cab: "#b5121b", cab2: "#ece9e2", body: "#b5121b", body2: "#cfd2d6", art: "#ece9e2" }, { frameY: 1.05 });
}
export function pierceArrowXt(): MeshBuilder { return buildTruck(pierceArrowXtSpec()); }
export function pierceArrowXtLod(): MeshBuilder { return lodOf(pierceArrowXtSpec()); }

export function americanLaFranceSpec(): TruckSpec {
  return fireEngine({ kind: "cabover", length: 2.6, width: 2.35, floor: 0.95, top: 2.3, screen: [1.62, 2.15], rake: 0.12, corner: 0.35, grille: "chrome", lamps: "round", mirrors: "small", open: true, crew: true },
    9.4, [steer(1.5), drive(5.9)], 0.5, 2.4, { cab: "#b5121b", cab2: "#e9dfc0", body: "#b5121b", body2: "#d8d2c0", art: "#e9dfc0" });
}
export function americanLaFrance(): MeshBuilder { return buildTruck(americanLaFranceSpec()); }
export function americanLaFranceLod(): MeshBuilder { return lodOf(americanLaFranceSpec()); }

export function cat797Spec(): TruckSpec {
  return {
    livery: { cab: "#f2b705", cab2: "#2b2b2b", body: "#f2b705", body2: "#d39e05", load: "#7d6a55" },
    cab: { kind: "mining", length: 2.3, width: 2.0, floor: 5.9, top: 8.1, screen: [6.6, 7.8], rake: 0.1, grille: "bars", lamps: "rect", mirrors: "arm", deck: { y: 5.9, to: 4.0 }, offset: -2.9 },
    chassis: frame(14.0, 1.98, [steer(3.0), drive(10.0)], { frame: 2.9, tanks: "none", track: 4.85, tyre: 1.12 }),
    body: body("dump", 3.6, 15.08, 3.2, 7.4, { hw: 4.95, load: "none" }),
    steerDeg: 34,
  };
}
export function cat797(): MeshBuilder { return buildTruck(cat797Spec()); }
export function cat797Lod(): MeshBuilder { return lodOf(cat797Spec()); }

// ===========================================================================
// South America

export const MB_L1113_PARAMS = bodyParam(DROPSIDE, ["tanker", "Tanker"]);
export function mbL1113Spec(p?: ParamValues): TruckSpec {
  const tank = pick(MB_L1113_PARAMS, p) === "tanker";
  const cab = squareBonnet({ length: 1.45, width: 2.4, floor: 1.2, top: 2.55, screen: [1.75, 2.25], rake: 0.06, corner: 0.18, hood: { length: 1.45, top: 1.7, hw: 0.95, style: "round" }, grille: "bars", lamps: "round", mirrors: "small" });
  const ch = frame(7.7, 0.5, [steer(1.0), drive(5.4)], { frame: 1.0, tanks: "box" });
  return rigid(cab, ch, behindCab(tank ? "tank" : "dropside", cab, ch, tank ? 2.75 : 2.0, { floor: tank ? 1.15 : 1.2, hw: 1.2 }), { cab: "#2e64a3", cab2: "#ece9e0", body: tank ? "#d9dcdf" : "#8a6a45" });
}
export function mbL1113(p?: ParamValues): MeshBuilder { return buildTruck(mbL1113Spec(p)); }
export function mbL1113Lod(p?: ParamValues): MeshBuilder { return lodOf(mbL1113Spec(p)); }

export const CONSTELLATION_PARAMS = bodyParam(DROPSIDE, TIPPER);
export function vwConstellationSpec(p?: ParamValues): TruckSpec {
  const kind = pick(CONSTELLATION_PARAMS, p);
  const cab = euCab("day", { length: 1.9, width: 2.45, floor: 1.25, top: 3.0, screen: [1.95, 2.8], rake: 0.18, corner: 0.18, grille: "bars", visor: false });
  const ch = frame(8.7, 0.53, [steer(1.4), drive(5.6), drive(6.95)], { frame: 1.05 });
  return rigid(cab, ch, behindCab(kind === "tipper" ? "tipper" : "dropside", cab, ch, kind === "tipper" ? 2.6 : 2.1, { floor: 1.3, load: kind === "tipper" ? "gravel" : "none" }),
    { cab: "#f0f1f2", cab2: "#1c4f9a", body: kind === "tipper" ? "#6f7378" : "#1c4f9a" });
}
export function vwConstellation(p?: ParamValues): MeshBuilder { return buildTruck(vwConstellationSpec(p)); }
export function vwConstellationLod(p?: ParamValues): MeshBuilder { return lodOf(vwConstellationSpec(p)); }

export const SCANIA_111_PARAMS = bodyParam(BOX, TANK);
export function scania111Spec(p?: ParamValues): TruckSpec {
  const cab = squareBonnet({ length: 1.7, width: 2.5, floor: 1.3, top: 2.85, screen: [1.95, 2.55], rake: 0.06, corner: 0.15, hood: { length: 2.0, top: 1.9, hw: 1.0, style: "square" }, grille: "bars", lamps: "round", mirrors: "arm" });
  return tractor(cab, euTrailer(pick(SCANIA_111_PARAMS, p), { length: 12.5, axles: 3, dual: true }),
    { cab: "#c86a1e", cab2: "#ece9e0", body: "#ece9e0" }, { axles: "6x4", front: 1.0, wheel: 0.52, frameY: 1.05 });
}
export function scania111(p?: ParamValues): MeshBuilder { return buildTruck(scania111Spec(p)); }
export function scania111Lod(p?: ParamValues): MeshBuilder { return lodOf(scania111Spec(p)); }

export const FORD_CARGO_PARAMS = bodyParam(BOX, DROPSIDE);
export function fordCargoSpec(p?: ParamValues): TruckSpec {
  const kind = pick(FORD_CARGO_PARAMS, p) as BodyKind;
  const cab = oldCab({ length: 1.75, width: 2.35, floor: 1.1, top: 2.85, screen: [1.75, 2.6], rake: 0.2, corner: 0.12, grille: "slots", lamps: "rect", mirrors: "arm" });
  const ch = frame(8.2, 0.48, [steer(1.3), drive(5.5)], { frame: 0.98 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "box" ? 3.6 : 1.85, { floor: 1.15 }), { cab: "#f2f1ec", cab2: "#1d3f7a", body: kind === "box" ? "#e6e7e5" : "#7a5c3f" });
}
export function fordCargo(p?: ParamValues): MeshBuilder { return buildTruck(fordCargoSpec(p)); }
export function fordCargoLod(p?: ParamValues): MeshBuilder { return lodOf(fordCargoSpec(p)); }

// ===========================================================================
// Japan and Korea

export const HINO_300_PARAMS = bodyParam(BOX, DROPSIDE);
export function hino300Spec(p?: ParamValues): TruckSpec {
  const kind = pick(HINO_300_PARAMS, p) as BodyKind;
  const cab = narrowCab(1.85, { top: 2.25, screen: [1.4, 2.02], grille: "bars" });
  const ch = frame(6.2, 0.38, [steer(1.05), drive(4.0)], { frame: 0.78 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "box" ? 3.05 : 1.3, { floor: 0.95, hw: 0.95 }), { cab: "#f3f3f1", cab2: "#2b5aa3", body: kind === "box" ? "#dfe1e3" : "#c9ccd0" });
}
export function hino300(p?: ParamValues): MeshBuilder { return buildTruck(hino300Spec(p)); }
export function hino300Lod(p?: ParamValues): MeshBuilder { return lodOf(hino300Spec(p)); }

/** A Japanese heavy cab-over: wide, flat-faced, the wing van's aluminium box behind it. */
function jpHeavy(o: Partial<CabSpec> = {}): CabSpec {
  return euCab("sleeper", { length: 2.0, width: 2.49, floor: 1.25, top: 3.25, screen: [1.95, 2.9], rake: 0.12, corner: 0.12, grille: "slots", lamps: "rect", mirrors: "arm", visor: false, ...o });
}

export const PROFIA_PARAMS = bodyParam(["wing", "Wing van"], TIPPER);
export function hinoProfiaSpec(p?: ParamValues): TruckSpec {
  const kind = pick(PROFIA_PARAMS, p);
  const cab = jpHeavy({ top: 3.3 });
  const ch = frame(11.9, 0.52, [steer(1.4), steer(3.2), drive(8.8), drive(10.1)], { frame: 1.05, guards: true });
  return rigid(cab, ch, behindCab(kind === "tipper" ? "tipper" : "box", cab, ch, kind === "tipper" ? 2.65 : 3.75, { floor: 1.2, load: "gravel" }), { cab: "#eef0f1", cab2: "#1c6bb5", body: kind === "tipper" ? "#6f7378" : "#c7cbd0", body2: "#a9aeb4" });
}
export function hinoProfia(p?: ParamValues): MeshBuilder { return buildTruck(hinoProfiaSpec(p)); }
export function hinoProfiaLod(p?: ParamValues): MeshBuilder { return lodOf(hinoProfiaSpec(p)); }

export const ELF_PARAMS = bodyParam(DROPSIDE, BOX);
export function isuzuElfSpec(p?: ParamValues): TruckSpec {
  const kind = pick(ELF_PARAMS, p) as BodyKind;
  const cab = narrowCab(1.86, { top: 2.2, screen: [1.38, 2.0] });
  const ch = frame(6.0, 0.38, [steer(1.05), drive(3.85)], { frame: 0.78 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "box" ? 3.0 : 1.3, { floor: 0.95, hw: 1.02 }), { cab: "#f3f3f0", body: kind === "box" ? "#e4e6e8" : "#c9ccd0" });
}
export function isuzuElf(p?: ParamValues): MeshBuilder { return buildTruck(isuzuElfSpec(p)); }
export function isuzuElfLod(p?: ParamValues): MeshBuilder { return lodOf(isuzuElfSpec(p)); }

export const GIGA_PARAMS = bodyParam(["wing", "Wing van"], TIPPER);
export function isuzuGigaSpec(p?: ParamValues): TruckSpec {
  const kind = pick(GIGA_PARAMS, p);
  const cab = jpHeavy({ top: 3.2, corner: 0.18 });
  const ch = frame(11.8, 0.52, [steer(1.4), steer(3.2), drive(8.7), drive(10.0)], { frame: 1.05, guards: true });
  return rigid(cab, ch, behindCab(kind === "tipper" ? "tipper" : "box", cab, ch, kind === "tipper" ? 2.65 : 3.75, { floor: 1.2, load: "gravel" }), { cab: "#f1f2f2", cab2: "#c8102e", body: kind === "tipper" ? "#6f7378" : "#c7cbd0", body2: "#a9aeb4" });
}
export function isuzuGiga(p?: ParamValues): MeshBuilder { return buildTruck(isuzuGigaSpec(p)); }
export function isuzuGigaLod(p?: ParamValues): MeshBuilder { return lodOf(isuzuGigaSpec(p)); }

export const CANTER_PARAMS = bodyParam(BOX, DROPSIDE);
export function fusoCanterSpec(p?: ParamValues): TruckSpec {
  const kind = pick(CANTER_PARAMS, p) as BodyKind;
  const cab = narrowCab(1.7, { top: 2.15, screen: [1.35, 1.95], corner: 0.18 });
  const ch = frame(5.4, 0.36, [steer(1.0), drive(3.5)], { frame: 0.75 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "box" ? 2.85 : 1.25, { floor: 0.9, hw: 0.92 }), { cab: "#eceeef", cab2: "#c8102e", body: kind === "box" ? "#e0e2e4" : "#c9ccd0" });
}
export function fusoCanter(p?: ParamValues): MeshBuilder { return buildTruck(fusoCanterSpec(p)); }
export function fusoCanterLod(p?: ParamValues): MeshBuilder { return lodOf(fusoCanterSpec(p)); }

export const SUPER_GREAT_PARAMS = bodyParam(BOX, TANK);
export function fusoSuperGreatSpec(p?: ParamValues): TruckSpec {
  return tractor(jpHeavy({ top: 3.25, length: 2.1 }), euTrailer(pick(SUPER_GREAT_PARAMS, p), { length: 12.2, axles: 2 }),
    { cab: "#eef0f1", cab2: "#c8102e", body: "#e5e7e9" }, { axles: "6x4", fifth: 4.7 });
}
export function fusoSuperGreat(p?: ParamValues): MeshBuilder { return buildTruck(fusoSuperGreatSpec(p)); }
export function fusoSuperGreatLod(p?: ParamValues): MeshBuilder { return lodOf(fusoSuperGreatSpec(p)); }

export const QUON_PARAMS = bodyParam(BOX, MIXER);
export function udQuonSpec(p?: ParamValues): TruckSpec {
  const kind = pick(QUON_PARAMS, p) as BodyKind;
  const cab = jpHeavy({ top: 3.15, corner: 0.2 });
  const ch = frame(kind === "mixer" ? 8.0 : 11.6, 0.52, kind === "mixer" ? [steer(1.4), drive(4.8), drive(6.1)] : [steer(1.4), steer(3.2), drive(8.6), drive(9.9)], { frame: 1.05, guards: true });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "mixer" ? 3.75 : 3.75, { floor: kind === "mixer" ? 1.2 : 1.2 }), { cab: "#eceeef", cab2: "#1f3f7a", body: kind === "mixer" ? "#eceeef" : "#c7cbd0", body2: "#a9aeb4" });
}
export function udQuon(p?: ParamValues): MeshBuilder { return buildTruck(udQuonSpec(p)); }
export function udQuonLod(p?: ParamValues): MeshBuilder { return lodOf(udQuonSpec(p)); }

export const KEI_PARAMS = colourParam(["white", "White"], ["silver", "Silver"], ["red", "Red"], ["green", "Green"]);
const KEI_COLOURS: Record<string, string> = { white: "#f2f2ef", silver: "#b9bdc2", red: "#b5221f", green: "#4f7a4a" };
export function keiTruckSpec(p?: ParamValues): TruckSpec {
  const c = KEI_COLOURS[pick(KEI_PARAMS, p)]!;
  const cab = narrowCab(1.47, { length: 1.25, floor: 0.68, top: 1.78, screen: [1.08, 1.6], rake: 0.12, corner: 0.12, lamps: "rect" });
  const ch = frame(3.38, 0.28, [steer(0.55), drive(2.45, false)], { frame: 0.58, tanks: "none", tyre: 0.15 });
  return rigid(cab, ch, behindCab("dropside", cab, ch, 0.95, { floor: 0.68, hw: 0.72, gap: 0.04 }), { cab: c, body: c, body2: c }, { steerDeg: 38 });
}
export function keiTruck(p?: ParamValues): MeshBuilder { return buildTruck(keiTruckSpec(p)); }
export function keiTruckLod(p?: ParamValues): MeshBuilder { return lodOf(keiTruckSpec(p)); }

export const DEKOTORA_PARAMS = colourParam(["gold", "Gold"], ["blue", "Blue"], ["pink", "Pink"]);
const DEKOTORA_ART: Record<string, [string, string]> = { gold: ["#e2b21f", "#d1302b"], blue: ["#2a8fd0", "#e2b21f"], pink: ["#e04f9a", "#2ab0c0"] };
export function dekotoraSpec(p?: ParamValues): TruckSpec {
  const [art, art2] = DEKOTORA_ART[pick(DEKOTORA_PARAMS, p)]!;
  const cab = jpHeavy({ top: 3.2, visor: true });
  const ch = frame(11.6, 0.52, [steer(1.4), steer(3.2), drive(8.6), drive(9.9)], { frame: 1.05, guards: true });
  return rigid(cab, ch, behindCab("artBox", cab, ch, 3.75, { floor: 1.2 }), { cab: "#f1f1ee", cab2: art2, body: "#d4d7db", body2: "#e7c95a", art, art2 }, { art: "dekotora" });
}
export function dekotora(p?: ParamValues): MeshBuilder { return buildTruck(dekotoraSpec(p)); }
export function dekotoraLod(p?: ParamValues): MeshBuilder { return lodOf(dekotoraSpec(p)); }

export const XCIENT_PARAMS = param("variant", "Variant", [["diesel", "Diesel"], ["fuelCell", "Fuel cell"]]);
export function hyundaiXcientSpec(p?: ParamValues): TruckSpec {
  const fuelCell = pick(XCIENT_PARAMS, p) === "fuelCell";
  if (!fuelCell) {
    return tractor(euCab("high", { top: 3.85, screen: [2.0, 2.95], corner: 0.22, lamps: "slim" }), euTrailer("curtain"),
      { cab: "#eceeef", cab2: "#1f3d7a", body: "#eef0f2", canvas: "#1f3d7a" }, { fifth: 4.6, axles: "6x2" });
  }
  // the fuel cell truck: a rigid box, the hydrogen tanks in a housing behind the cab
  const cab = euCab("sleeper", { top: 3.75, screen: [2.0, 2.95], corner: 0.22, lamps: "slim", deflector: 3.95 });
  const ch = frame(9.75, 0.53, [steer(1.45), drive(6.45)], { frame: 1.05, guards: true, tanks: "none" });
  return rigid(cab, ch, behindCab("box", cab, ch, 3.95, { floor: 1.25, gap: 1.0 }), { cab: "#eceeef", cab2: "#2fa36b", body: "#eef0f2" });
}
export function hyundaiXcient(p?: ParamValues): MeshBuilder { return buildTruck(hyundaiXcientSpec(p)); }
export function hyundaiXcientLod(p?: ParamValues): MeshBuilder { return lodOf(hyundaiXcientSpec(p)); }

// ===========================================================================
// South Asia

export const TATA_PARAMS = colourParam(["orange", "Orange"], ["blue", "Blue"], ["green", "Green"]);
const TATA_COLOURS: Record<string, [string, string, string]> = { orange: ["#e86f1c", "#2a62b5", "#e0b21f"], blue: ["#2a62b5", "#e86f1c", "#e0b21f"], green: ["#2f8a4a", "#d23a2a", "#e0b21f"] };
export function tataLptSpec(p?: ParamValues): TruckSpec {
  const [c, a, a2] = TATA_COLOURS[pick(TATA_PARAMS, p)]!;
  const cab = squareBonnet({ length: 1.55, width: 2.4, floor: 1.25, top: 2.65, screen: [1.8, 2.35], rake: 0.06, corner: 0.1, hood: { length: 1.6, top: 1.85, hw: 0.95, style: "round" }, grille: "bars", lamps: "round", mirrors: "small", stripe: [1.5, 1.62] });
  const ch = frame(8.0, 0.5, [steer(1.0), drive(5.6)], { frame: 1.0, tanks: "box" });
  return rigid(cab, ch, behindCab("artBox", cab, ch, 2.75, { floor: 1.25, hw: 1.2 }), { cab: c, cab2: a2, body: "#e8d9b0", art: a, art2: a2 }, { art: "painted" });
}
export function tataLpt(p?: ParamValues): MeshBuilder { return buildTruck(tataLptSpec(p)); }
export function tataLptLod(p?: ParamValues): MeshBuilder { return lodOf(tataLptSpec(p)); }

export const CAPTAIN_PARAMS = bodyParam(TIPPER, DROPSIDE);
export function ashokLeylandCaptainSpec(p?: ParamValues): TruckSpec {
  const kind = pick(CAPTAIN_PARAMS, p);
  const cab = euCab("day", { length: 1.8, width: 2.45, floor: 1.3, top: 2.95, screen: [1.98, 2.75], rake: 0.12, corner: 0.15, grille: "slots", visor: false });
  const ch = frame(8.4, 0.53, [steer(1.4), drive(5.4), drive(6.75)], { frame: 1.1 });
  return rigid(cab, ch, behindCab(kind === "tipper" ? "tipper" : "dropside", cab, ch, kind === "tipper" ? 2.6 : 2.2, { floor: 1.35, load: kind === "tipper" ? "gravel" : "none" }),
    { cab: "#e8e9ea", cab2: "#1f4f9c", body: kind === "tipper" ? "#d0661e" : "#1f4f9c" });
}
export function ashokLeylandCaptain(p?: ParamValues): MeshBuilder { return buildTruck(ashokLeylandCaptainSpec(p)); }
export function ashokLeylandCaptainLod(p?: ParamValues): MeshBuilder { return lodOf(ashokLeylandCaptainSpec(p)); }

export const PAK_PARAMS = colourParam(["red", "Red"], ["green", "Green"], ["blue", "Blue"]);
const PAK_COLOURS: Record<string, [string, string, string]> = { red: ["#c4262a", "#e6b21f", "#1f8a5a"], green: ["#1f8a5a", "#e04f9a", "#e6b21f"], blue: ["#2a62b5", "#e6b21f", "#d23a2a"] };
export function pakistaniTruckArtSpec(p?: ParamValues): TruckSpec {
  const [c, a, a2] = PAK_COLOURS[pick(PAK_PARAMS, p)]!;
  const cab = oldBonnet({ width: 2.35, top: 2.55, floor: 1.2, screen: [1.8, 2.25], hood: { length: 1.6, top: 1.85, hw: 0.55, style: "square" }, grille: "chrome" });
  const ch = frame(8.0, 0.5, [steer(1.0), drive(5.5)], { frame: 1.0, tanks: "none" });
  return rigid(cab, ch, behindCab("artBox", cab, ch, 3.6, { floor: 1.25, hw: 1.22 }), { cab: c, cab2: a, body: a2, body2: "#e9d38a", art: a, art2: c }, { art: "jingle" });
}
export function pakistaniTruckArt(p?: ParamValues): MeshBuilder { return buildTruck(pakistaniTruckArtSpec(p)); }
export function pakistaniTruckArtLod(p?: ParamValues): MeshBuilder { return lodOf(pakistaniTruckArtSpec(p)); }

export const MAN_CLA_PARAMS = bodyParam(TIPPER, DROPSIDE);
export function manClaSpec(p?: ParamValues): TruckSpec {
  const kind = pick(MAN_CLA_PARAMS, p);
  const cab = euCab("day", { length: 1.85, width: 2.45, floor: 1.3, top: 3.05, screen: [2.0, 2.8], rake: 0.14, corner: 0.16, grille: "bars", visor: false });
  const ch = frame(8.6, 0.53, [steer(1.4), drive(5.55), drive(6.9)], { frame: 1.1 });
  return rigid(cab, ch, behindCab(kind === "tipper" ? "tipper" : "dropside", cab, ch, kind === "tipper" ? 2.6 : 2.2, { floor: 1.35, load: kind === "tipper" ? "gravel" : "none" }),
    { cab: "#f0f1f2", cab2: "#2b2d31", body: kind === "tipper" ? "#6f7378" : "#2b6fb3" });
}
export function manCla(p?: ParamValues): MeshBuilder { return buildTruck(manClaSpec(p)); }
export function manClaLod(p?: ParamValues): MeshBuilder { return lodOf(manClaSpec(p)); }

// ===========================================================================
// China

export const CA10_PARAMS = bodyParam(DROPSIDE, CANVAS);
export function fawJiefangCa10Spec(p?: ParamValues): TruckSpec {
  const kind = pick(CA10_PARAMS, p) as BodyKind;
  const cab = oldBonnet({ width: 2.3, top: 2.18, floor: 1.08, screen: [1.6, 2.0], hood: { length: 1.85, top: 1.65, hw: 0.48 } });
  const ch = frame(6.6, 0.5, [steer(1.05), drive(5.0)], { frame: 0.95, tanks: "none" });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "canvas" ? 2.7 : 1.8, { floor: 1.2, hw: 1.15 }), { cab: "#4b6b45", body: "#4b6b45", canvas: "#5b6a4c", rim: "#3b4a33" });
}
export function fawJiefangCa10(p?: ParamValues): MeshBuilder { return buildTruck(fawJiefangCa10Spec(p)); }
export function fawJiefangCa10Lod(p?: ParamValues): MeshBuilder { return lodOf(fawJiefangCa10Spec(p)); }

export const J7_PARAMS = bodyParam(CURTAIN, TANK);
export function fawJ7Spec(p?: ParamValues): TruckSpec {
  return tractor(euCab("high", { top: 3.95, screen: [2.02, 3.0], corner: 0.24, lamps: "slim" }), euTrailer(pick(J7_PARAMS, p)),
    { cab: "#c8102e", cab2: "#2b2d31", body: "#eef0f2", canvas: "#3b4a63" }, { axles: "6x4", fifth: 4.7 });
}
export function fawJ7(p?: ParamValues): MeshBuilder { return buildTruck(fawJ7Spec(p)); }
export function fawJ7Lod(p?: ParamValues): MeshBuilder { return lodOf(fawJ7Spec(p)); }

export const EQ140_PARAMS = bodyParam(DROPSIDE, CANVAS);
export function dongfengEq140Spec(p?: ParamValues): TruckSpec {
  const kind = pick(EQ140_PARAMS, p) as BodyKind;
  const cab = squareBonnet({ length: 1.45, width: 2.4, floor: 1.15, top: 2.3, screen: [1.68, 2.1], rake: 0.12, corner: 0.18, hood: { length: 1.6, top: 1.6, hw: 0.9, style: "round" }, grille: "bars", lamps: "round", mirrors: "small" });
  const ch = frame(6.9, 0.48, [steer(1.0), drive(4.95)], { frame: 0.95, tanks: "none" });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "canvas" ? 2.6 : 1.8, { floor: 1.15, hw: 1.2 }), { cab: "#2f5f9e", body: "#5f6b4d", canvas: "#5b6a4c" });
}
export function dongfengEq140(p?: ParamValues): MeshBuilder { return buildTruck(dongfengEq140Spec(p)); }
export function dongfengEq140Lod(p?: ParamValues): MeshBuilder { return lodOf(dongfengEq140Spec(p)); }

export const HOWO_PARAMS = bodyParam(CURTAIN, TANK);
export function sinotrukHowoSpec(p?: ParamValues): TruckSpec {
  return tractor(euCab("high", { top: 3.85, screen: [2.0, 2.95], corner: 0.18, grille: "slots" }), euTrailer(pick(HOWO_PARAMS, p)),
    { cab: "#e7e8e9", cab2: "#c8102e", body: "#eef0f2", canvas: "#2f5f9e" }, { axles: "6x4", fifth: 4.7 });
}
export function sinotrukHowo(p?: ParamValues): MeshBuilder { return buildTruck(sinotrukHowoSpec(p)); }
export function sinotrukHowoLod(p?: ParamValues): MeshBuilder { return lodOf(sinotrukHowoSpec(p)); }

export const X3000_PARAMS = bodyParam(TIPPER, MIXER);
export function shacmanX3000Spec(p?: ParamValues): TruckSpec {
  const kind = pick(X3000_PARAMS, p) as BodyKind;
  const cab = euCab("sleeper", { top: 3.4, floor: 1.35, screen: [2.05, 2.95], corner: 0.2, grille: "bars" });
  const ch = frame(9.6, 0.55, [steer(1.5), steer(3.3), drive(6.6), drive(7.95)], { frame: 1.15 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "mixer" ? 3.95 : 2.8, { floor: 1.45, load: "gravel" }), { cab: "#e9c11c", cab2: "#2b2c2e", body: kind === "mixer" ? "#eceeef" : "#c8521f", body2: "#9fa4aa" });
}
export function shacmanX3000(p?: ParamValues): MeshBuilder { return buildTruck(shacmanX3000Spec(p)); }
export function shacmanX3000Lod(p?: ParamValues): MeshBuilder { return lodOf(shacmanX3000Spec(p)); }

// ===========================================================================
// Off-road, Africa and the special trucks

export const ZETROS_PARAMS = bodyParam(CANVAS, DROPSIDE);
export function mbZetrosSpec(p?: ParamValues): TruckSpec {
  const kind = pick(ZETROS_PARAMS, p) as BodyKind;
  const cab = squareBonnet({ length: 1.7, width: 2.5, floor: 1.55, top: 3.2, screen: [2.15, 2.9], rake: 0.1, corner: 0.12, hood: { length: 1.7, top: 2.2, hw: 1.05 }, grille: "bars", lamps: "rect", mirrors: "arm" });
  const ch = frame(7.6, 0.65, [steerDrive(1.15), drive(5.0, false), drive(6.45, false)], { frame: 1.35, tyre: 0.42, track: 1.25 });
  return rigid(cab, ch, behindCab(kind, cab, ch, kind === "canvas" ? 3.4 : 2.4, { floor: 1.6, hw: 1.24 }), { cab: "#c8b48a", body: "#c8b48a", canvas: "#b5a37c", cab2: "#2b2b2b" }, { steerDeg: 36 });
}
export function mbZetros(p?: ParamValues): MeshBuilder { return buildTruck(mbZetrosSpec(p)); }
export function mbZetrosLod(p?: ParamValues): MeshBuilder { return lodOf(mbZetrosSpec(p)); }

export function bellB60eSpec(): TruckSpec {
  // the front unit (cab over the engine, one axle) and the dump unit on its bogie, hinged behind the cab
  const cab = squareBonnet({ length: 1.8, width: 2.6, floor: 2.05, top: 3.95, screen: [2.75, 3.75], rake: 0.18, corner: 0.18, hood: { length: 1.6, top: 2.55, hw: 1.35, style: "sloped" }, grille: "bars", lamps: "rect", mirrors: "arm", beacon: "amber" });
  const ch = frame(4.4, 0.95, [steer(1.75)], { frame: 1.5, tanks: "none", tyre: 0.8, track: 1.75, hitch: 1.4 });
  const dump: TrailerSpec = { kind: "drawbar", length: 8.2, pin: 0.45, axles: [tag(4.3), tag(6.25)], wheel: 0.95, tyre: 0.8, frame: 1.6, body: body("tipper", 0.6, 8.2, 2.0, 3.85, { hw: 1.75, load: "gravel" }) };
  return rigid(cab, ch, body("none", 0, 0, 0, 0), { cab: "#f3c300", cab2: "#2b2b2b", body: "#f3c300", body2: "#d6ab00", load: "#8c7b65" }, { trailers: [dump], steerDeg: 12, bendDeg: 45 });
}
export function bellB60e(): MeshBuilder { return buildTruck(bellB60eSpec()); }
export function bellB60eLod(): MeshBuilder { return lodOf(bellB60eSpec()); }

export const ECONIC_PARAMS = bodyParam(["refuse", "Refuse"], ["sweeper", "Sweeper"]);
export function mbEconicSpec(p?: ParamValues): TruckSpec {
  const kind = pick(ECONIC_PARAMS, p) as BodyKind;
  // the low-entry cab: its floor below the front wheels' tops, the panoramic glazing down to the step
  const cab: CabSpec = { kind: "cabover", length: 2.2, width: 2.5, floor: 0.6, top: 3.0, screen: [1.4, 2.75], rake: 0.2, corner: 0.2, grille: "slots", lamps: "rect", mirrors: "arm", beacon: "amber", band: 0.95 };
  const sweeper = kind === "sweeper";
  const ch = frame(sweeper ? 7.0 : 9.0, 0.5, sweeper ? [steer(1.5), drive(5.2)] : [steer(1.5), drive(5.6), tag(6.95, false)], { frame: 1.05, tanks: "none" });
  return rigid(cab, ch, behindCab(kind, cab, ch, sweeper ? 3.0 : 3.5, { floor: 1.2, to: sweeper ? 6.9 : 8.0, gap: 0.08 }), { cab: "#f2f3f2", cab2: "#f28c1c", body: "#f2f3f2", body2: "#e3e5e7", art: "#2b2d31" });
}
export function mbEconic(p?: ParamValues): MeshBuilder { return buildTruck(mbEconicSpec(p)); }
export function mbEconicLod(p?: ParamValues): MeshBuilder { return lodOf(mbEconicSpec(p)); }

// ===========================================================================
// the designs

type Builder = (p?: ParamValues) => MeshBuilder;

export interface WorldTruck {
  id: string;
  title: string;
  spec: (p?: ParamValues) => TruckSpec;
  build: Builder;
  buildLod: Builder;
  params?: readonly ParamSpec[];
  finishParams?: readonly string[];
  game: GameProperties;
  references: string;
}

const g = (weight: number, power: number, maxspeed: number, variants?: GameProperties["variants"]): GameProperties =>
  ({ weight, power, maxspeed, accel: null, ...(variants ? { variants } : {}) });

/** One design: its id, title, builders, parameters and game figures; the references folder is the id without `veh-`. */
function t(id: string, title: string, spec: WorldTruck["spec"], build: Builder, buildLod: Builder, game: GameProperties, params?: readonly ParamSpec[], finishParams?: readonly string[]): WorldTruck {
  return { id, title, spec, build, buildLod, game, references: id.replace(/^veh-/, ""), ...(params ? { params } : {}), ...(finishParams ? { finishParams } : {}) };
}

/** The family, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md). */
export const WORLD_TRUCK_SPECS: readonly WorldTruck[] = [
  t("veh-scania-r", "Scania R 500", scaniaRSpec, scaniaR, scaniaRLod, g(40, 368, 90), SCANIA_R_PARAMS),
  t("veh-scania-s-v8", "Scania S 730 V8", scaniaSV8Spec, scaniaSV8, scaniaSV8Lod, g(44, 537, 90), SCANIA_S_PARAMS),
  t("veh-scania-lb141", "Scania LB 141", scaniaLb141Spec, scaniaLb141, scaniaLb141Lod, g(38, 276, 85), SCANIA_LB141_PARAMS),
  t("veh-volvo-fh16", "Volvo FH16", volvoFh16Spec, volvoFh16, volvoFh16Lod, g(60, 552, 90, [{ params: { body: "curtain" }, weight: 44 }]), VOLVO_FH16_PARAMS),
  t("veh-volvo-f88", "Volvo F88", volvoF88Spec, volvoF88, volvoF88Lod, g(32, 213, 80), VOLVO_F88_PARAMS),
  t("veh-volvo-fmx-tipper", "Volvo FMX Tipper", volvoFmxTipperSpec, volvoFmxTipper, volvoFmxTipperLod, g(32, 368, 85)),
  t("veh-mb-actros", "Mercedes-Benz Actros", mbActrosSpec, mbActros, mbActrosLod, g(40, 390, 90), ACTROS_PARAMS),
  t("veh-mb-arocs", "Mercedes-Benz Arocs Tipper", mbArocsSpec, mbArocs, mbArocsLod, g(26, 350, 85)),
  t("veh-mb-unimog", "Mercedes-Benz Unimog U 5023", mbUnimogSpec, mbUnimog, mbUnimogLod, g(14.5, 170, 90), UNIMOG_PARAMS),
  t("veh-mb-kurzhauber", "Mercedes-Benz L 911", mbKurzhauberSpec, mbKurzhauber, mbKurzhauberLod, g(10.5, 81, 75), KURZHAUBER_PARAMS),
  t("veh-mb-ng", "Mercedes-Benz NG 1632", mbNgSpec, mbNg, mbNgLod, g(38, 235, 85), MB_NG_PARAMS),
  t("veh-man-f8", "MAN F8", manF8Spec, manF8, manF8Lod, g(38, 177, 80), MAN_F8_PARAMS),
  t("veh-man-tgl", "MAN TGL Box Truck", manTglSpec, manTgl, manTglLod, g(12, 132, 90), MAN_TGL_PARAMS),
  t("veh-daf-xf", "DAF XF", dafXfSpec, dafXf, dafXfLod, g(40, 390, 90), DAF_XF_PARAMS),
  t("veh-daf-2600", "DAF 2600", daf2600Spec, daf2600, daf2600Lod, g(30, 121, 80), DAF_2600_PARAMS),
  t("veh-daf-cf-refuse", "DAF CF Refuse Truck", dafCfRefuseSpec, dafCfRefuse, dafCfRefuseLod, g(26, 265, 85), DAF_CF_REFUSE_PARAMS, ["livery"]),
  t("veh-iveco-s-way", "Iveco S-Way", ivecoSWaySpec, ivecoSWay, ivecoSWayLod, g(40, 390, 90), IVECO_S_WAY_PARAMS),
  t("veh-iveco-turbostar", "Iveco TurboStar", ivecoTurbostarSpec, ivecoTurbostar, ivecoTurbostarLod, g(40, 309, 90), TURBOSTAR_PARAMS),
  t("veh-iveco-daily", "Iveco Daily", ivecoDailySpec, ivecoDaily, ivecoDailyLod, g(3.5, 85, 130), IVECO_DAILY_PARAMS),
  t("veh-fiat-682", "Fiat 682", fiat682Spec, fiat682, fiat682Lod, g(18, 110, 65), FIAT_682_PARAMS),
  t("veh-renault-t", "Renault Trucks T", renaultTSpec, renaultT, renaultTLod, g(40, 382, 90), RENAULT_T_PARAMS),
  t("veh-renault-magnum", "Renault Magnum", renaultMagnumSpec, renaultMagnum, renaultMagnumLod, g(40, 353, 90), MAGNUM_PARAMS),
  t("veh-berliet-t100", "Berliet T100", berlietT100Spec, berlietT100, berlietT100Lod, g(100, 515, 34)),
  t("veh-citroen-h-van", "Citroen H Van", citroenHVanSpec, citroenHVan, citroenHVanLod, g(2.5, 37, 78), CITROEN_H_PARAMS, ["colour"]),
  t("veh-pegaso-comet", "Pegaso Comet", pegasoCometSpec, pegasoComet, pegasoCometLod, g(14, 92, 80), PEGASO_COMET_PARAMS),
  t("veh-tatra-148", "Tatra 148", tatra148Spec, tatra148, tatra148Lod, g(22.5, 157, 71), TATRA_148_PARAMS),
  t("veh-tatra-815", "Tatra 815", tatra815Spec, tatra815, tatra815Lod, g(37, 208, 75), TATRA_815_PARAMS),
  t("veh-tatra-phoenix", "Tatra Phoenix", tatraPhoenixSpec, tatraPhoenix, tatraPhoenixLod, g(33, 325, 85), TATRA_PHOENIX_PARAMS),
  t("veh-avia-a31", "Avia A31", aviaA31Spec, aviaA31, aviaA31Lod, g(6.5, 60, 95), AVIA_A31_PARAMS),
  t("veh-liaz-100", "Liaz 100", liaz100Spec, liaz100, liaz100Lod, g(38, 200, 87), LIAZ_100_PARAMS),
  t("veh-praga-v3s", "Praga V3S", pragaV3sSpec, pragaV3s, pragaV3sLod, g(10.6, 72, 62), PRAGA_V3S_PARAMS),
  t("veh-skoda-706-rt", "Skoda 706 RT", skoda706RtSpec, skoda706Rt, skoda706RtLod, g(28, 118, 70), SKODA_706_RT_PARAMS),
  t("veh-star-266", "Star 266", star266Spec, star266, star266Lod, g(13.6, 110, 86), STAR_266_PARAMS),
  t("veh-csepel-d450", "Csepel D-450", csepelD450Spec, csepelD450, csepelD450Lod, g(9.4, 70, 70), CSEPEL_PARAMS),
  t("veh-kamaz-5320", "KamAZ-5320", kamaz5320Spec, kamaz5320, kamaz5320Lod, g(15.3, 154, 85), KAMAZ_5320_PARAMS),
  t("veh-kamaz-54901", "KamAZ-54901", kamaz54901Spec, kamaz54901, kamaz54901Lod, g(44, 390, 90), KAMAZ_54901_PARAMS),
  t("veh-zil-130", "ZIL-130", zil130Spec, zil130, zil130Lod, g(10.5, 110, 90), ZIL_130_PARAMS),
  t("veh-gaz-51", "GAZ-51", gaz51Spec, gaz51, gaz51Lod, g(5.4, 52, 70)),
  t("veh-gaz-66", "GAZ-66", gaz66Spec, gaz66, gaz66Lod, g(5.8, 85, 90), GAZ_66_PARAMS),
  t("veh-maz-500", "MAZ-500", maz500Spec, maz500, maz500Lod, g(14.8, 132, 75), MAZ_500_PARAMS),
  t("veh-belaz-75710", "BelAZ 75710", belaz75710Spec, belaz75710, belaz75710Lod, g(810, 3430, 64)),
  t("veh-kraz-255", "KrAZ-255", kraz255Spec, kraz255, kraz255Lod, g(19.5, 176, 71), KRAZ_255_PARAMS),
  t("veh-ural-4320", "Ural-4320", ural4320Spec, ural4320, ural4320Lod, g(15.2, 154, 85), URAL_4320_PARAMS),
  t("veh-bedford-tk", "Bedford TK", bedfordTkSpec, bedfordTk, bedfordTkLod, g(9, 75, 80), BEDFORD_TK_PARAMS),
  t("veh-aec-mammoth-major", "AEC Mammoth Major", aecMammothMajorSpec, aecMammothMajor, aecMammothMajorLod, g(22, 93, 50), AEC_MAMMOTH_PARAMS),
  t("veh-scammell-contractor", "Scammell Contractor", scammellContractorSpec, scammellContractor, scammellContractorLod, g(150, 250, 65)),
  t("veh-ford-transit-mk1", "Ford Transit Mk1", fordTransitMk1Spec, fordTransitMk1, fordTransitMk1Lod, g(2.4, 55, 120), TRANSIT_PARAMS, ["colour"]),
  t("veh-dennis-fire-engine", "Dennis Sabre Fire Engine", dennisSabreSpec, dennisSabre, dennisSabreLod, g(15, 186, 110)),
  t("veh-magirus-ladder", "Magirus Turntable Ladder", magirusLadderSpec, magirusLadder, magirusLadderLod, g(16, 210, 100)),
  t("veh-rosenbauer-panther", "Rosenbauer Panther", rosenbauerPantherSpec, rosenbauerPanther, rosenbauerPantherLod, g(39, 515, 115)),
  t("veh-liebherr-ltm", "Liebherr LTM 1100 Mobile Crane", liebherrLtmSpec, liebherrLtm, liebherrLtmLod, g(60, 450, 80)),
  t("veh-lohr-car-transporter", "Car Transporter", lohrCarTransporterSpec, lohrCarTransporter, lohrCarTransporterLod, g(40, 338, 90, [{ params: { load: "empty" }, weight: 26 }]), LOHR_PARAMS),
  t("veh-peterbilt-379", "Peterbilt 379", peterbilt379Spec, peterbilt379, peterbilt379Lod, g(36, 410, 110), PETERBILT_379_PARAMS),
  t("veh-peterbilt-579", "Peterbilt 579", peterbilt579Spec, peterbilt579, peterbilt579Lod, g(36, 380, 110), PETERBILT_579_PARAMS),
  t("veh-kenworth-w900", "Kenworth W900", kenworthW900Spec, kenworthW900, kenworthW900Lod, g(36, 410, 110), W900_PARAMS),
  t("veh-kenworth-t680", "Kenworth T680", kenworthT680Spec, kenworthT680, kenworthT680Lod, g(36, 380, 110), T680_PARAMS),
  t("veh-kenworth-k100", "Kenworth K100", kenworthK100Spec, kenworthK100, kenworthK100Lod, g(36, 300, 105), K100_PARAMS),
  t("veh-kenworth-c500-log", "Kenworth C500 Log Truck", kenworthC500LogSpec, kenworthC500Log, kenworthC500LogLod, g(45, 330, 90)),
  t("veh-kenworth-t909-road-train", "Kenworth T909 Road Train", kenworthT909Spec, kenworthT909RoadTrain, kenworthT909RoadTrainLod, g(115, 450, 100, [{ params: { load: "3" }, weight: 160 }]), T909_PARAMS),
  t("veh-freightliner-cascadia", "Freightliner Cascadia", freightlinerCascadiaSpec, freightlinerCascadia, freightlinerCascadiaLod, g(36, 375, 110), CASCADIA_PARAMS),
  t("veh-mack-b61", "Mack B-61", mackB61Spec, mackB61, mackB61Lod, g(30, 157, 80), MACK_B61_PARAMS),
  t("veh-mack-anthem", "Mack Anthem", mackAnthemSpec, mackAnthem, mackAnthemLod, g(36, 373, 110), MACK_ANTHEM_PARAMS),
  t("veh-mack-granite-dump", "Mack Granite Dump Truck", mackGraniteDumpSpec, mackGraniteDump, mackGraniteDumpLod, g(30, 324, 100)),
  t("veh-international-transtar", "International Transtar Cabover", internationalTranstarSpec, internationalTranstar, internationalTranstarLod, g(36, 250, 100), TRANSTAR_PARAMS),
  t("veh-international-acco", "International ACCO", internationalAccoSpec, internationalAcco, internationalAccoLod, g(22, 150, 85), ACCO_PARAMS),
  t("veh-western-star-4900", "Western Star 4900", westernStar4900Spec, westernStar4900, westernStar4900Lod, g(36, 410, 110), WS4900_PARAMS),
  t("veh-volvo-vnl", "Volvo VNL 860", volvoVnlSpec, volvoVnl, volvoVnlLod, g(36, 373, 110), VNL_PARAMS),
  t("veh-tesla-semi", "Tesla Semi", teslaSemiSpec, teslaSemi, teslaSemiLod, g(37, 800, 105), TESLA_SEMI_PARAMS),
  t("veh-ford-model-tt", "Ford Model TT", fordModelTtSpec, fordModelTt, fordModelTtLod, g(2.4, 15, 35), MODEL_TT_PARAMS),
  t("veh-white-3000", "White 3000", white3000Spec, white3000, white3000Lod, g(25, 112, 80), WHITE_3000_PARAMS),
  t("veh-autocar-acx-refuse", "Autocar ACX Refuse Truck", autocarAcxSpec, autocarAcx, autocarAcxLod, g(30, 261, 90)),
  t("veh-pierce-arrow-xt", "Pierce Arrow XT Fire Engine", pierceArrowXtSpec, pierceArrowXt, pierceArrowXtLod, g(20, 336, 110)),
  t("veh-american-lafrance", "American LaFrance 700", americanLaFranceSpec, americanLaFrance, americanLaFranceLod, g(12, 179, 95)),
  t("veh-cat-797", "Caterpillar 797F", cat797Spec, cat797, cat797Lod, g(623, 2983, 68)),
  t("veh-mb-l1113", "Mercedes-Benz L 1113", mbL1113Spec, mbL1113, mbL1113Lod, g(11, 96, 80), MB_L1113_PARAMS),
  t("veh-vw-constellation", "Volkswagen Constellation", vwConstellationSpec, vwConstellation, vwConstellationLod, g(23, 239, 90), CONSTELLATION_PARAMS),
  t("veh-scania-111", "Scania 111", scania111Spec, scania111, scania111Lod, g(40, 221, 85), SCANIA_111_PARAMS),
  t("veh-ford-cargo", "Ford Cargo", fordCargoSpec, fordCargo, fordCargoLod, g(16, 125, 90), FORD_CARGO_PARAMS),
  t("veh-hino-300", "Hino 300", hino300Spec, hino300, hino300Lod, g(7.5, 110, 110), HINO_300_PARAMS),
  t("veh-hino-profia", "Hino Profia", hinoProfiaSpec, hinoProfia, hinoProfiaLod, g(25, 279, 90), PROFIA_PARAMS),
  t("veh-isuzu-elf", "Isuzu Elf", isuzuElfSpec, isuzuElf, isuzuElfLod, g(7.5, 110, 110), ELF_PARAMS),
  t("veh-isuzu-giga", "Isuzu Giga", isuzuGigaSpec, isuzuGiga, isuzuGigaLod, g(25, 279, 90), GIGA_PARAMS),
  t("veh-fuso-canter", "Mitsubishi Fuso Canter", fusoCanterSpec, fusoCanter, fusoCanterLod, g(7.5, 110, 110), CANTER_PARAMS),
  t("veh-fuso-super-great", "Mitsubishi Fuso Super Great", fusoSuperGreatSpec, fusoSuperGreat, fusoSuperGreatLod, g(36, 338, 90), SUPER_GREAT_PARAMS),
  t("veh-ud-quon", "UD Quon", udQuonSpec, udQuon, udQuonLod, g(25, 280, 90), QUON_PARAMS),
  t("veh-kei-truck", "Kei Truck", keiTruckSpec, keiTruck, keiTruckLod, g(1.2, 39, 110), KEI_PARAMS, ["colour"]),
  t("veh-dekotora", "Dekotora", dekotoraSpec, dekotora, dekotoraLod, g(25, 279, 90), DEKOTORA_PARAMS, ["colour"]),
  t("veh-hyundai-xcient", "Hyundai Xcient", hyundaiXcientSpec, hyundaiXcient, hyundaiXcientLod, g(40, 382, 90, [{ params: { variant: "fuelCell" }, weight: 34, power: 350, maxspeed: 85 }]), XCIENT_PARAMS),
  t("veh-tata-lpt", "Tata LPT 1613", tataLptSpec, tataLpt, tataLptLod, g(16.2, 96, 80), TATA_PARAMS, ["colour"]),
  t("veh-ashok-leyland-captain", "Ashok Leyland Captain", ashokLeylandCaptainSpec, ashokLeylandCaptain, ashokLeylandCaptainLod, g(31, 186, 80), CAPTAIN_PARAMS),
  t("veh-pakistani-truck-art", "Pakistani Truck Art", pakistaniTruckArtSpec, pakistaniTruckArt, pakistaniTruckArtLod, g(16, 100, 70), PAK_PARAMS, ["colour"]),
  t("veh-faw-jiefang-ca10", "FAW Jiefang CA10", fawJiefangCa10Spec, fawJiefangCa10, fawJiefangCa10Lod, g(7.9, 66, 65), CA10_PARAMS),
  t("veh-faw-j7", "FAW Jiefang J7", fawJ7Spec, fawJ7, fawJ7Lod, g(49, 412, 90), J7_PARAMS),
  t("veh-dongfeng-eq140", "Dongfeng EQ140", dongfengEq140Spec, dongfengEq140, dongfengEq140Lod, g(9.3, 99, 90), EQ140_PARAMS),
  t("veh-sinotruk-howo", "Sinotruk HOWO A7", sinotrukHowoSpec, sinotrukHowo, sinotrukHowoLod, g(49, 309, 90), HOWO_PARAMS),
  t("veh-shacman-x3000", "Shacman X3000", shacmanX3000Spec, shacmanX3000, shacmanX3000Lod, g(31, 324, 85), X3000_PARAMS),
  t("veh-mb-zetros", "Mercedes-Benz Zetros", mbZetrosSpec, mbZetros, mbZetrosLod, g(18, 240, 90), ZETROS_PARAMS),
  t("veh-bell-b60e", "Bell B60E", bellB60eSpec, bellB60e, bellB60eLod, g(108, 485, 50)),
  t("veh-man-cla", "MAN CLA", manClaSpec, manCla, manClaLod, g(31, 206, 80), MAN_CLA_PARAMS),
  t("veh-mb-econic", "Mercedes-Benz Econic", mbEconicSpec, mbEconic, mbEconicLod, g(26, 220, 85, [{ params: { body: "sweeper" }, weight: 18 }]), ECONIC_PARAMS),
];

export const WORLD_TRUCKS: ProceduralDesign[] = /* @__PURE__ */ WORLD_TRUCK_SPECS.map((d) => ({
  id: d.id,
  title: d.title,
  game: d.game,
  build: d.build,
  buildLod: d.buildLod,
  ...(d.params ? { params: d.params } : {}),
  ...(d.finishParams ? { finishParams: d.finishParams } : {}),
  references: d.references,
  catalog: TRUCK_CATALOG,
}));
