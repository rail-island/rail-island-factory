// The world aircraft (docs/models/world-aircraft.md): 100 aircraft from around the
// world, each a spec record at its real size on the airframe kit (airframeKit.ts)
// or the rotor kit (rotorKit.ts), in three source modules - the jets
// (worldJets.ts), the propeller aircraft, freighters and flying boats
// (worldProps.ts), the helicopters and the airship (worldRotorcraft.ts). This
// module holds what they share and the catalog lists. The ids are stored in the
// game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { schemeParam, type AirframeSpec, type EngineSpec, type FuselageSpec, type GearSpec, type NoseKind, type Scheme, type TailKind, type TipDevice, type WindowRow, type WingSpec } from "./airframeKit.ts";
import { AIRCRAFT_CATALOG } from "./aircraft.ts";

/**
 * An airframe in short (metres; positions d behind the nose tip): the fuselage
 * (L length, H height to the fin top, W width, D depth, k keel height, the nose
 * kind and its scale ns, tl the tail cone's length, ty its end's height, te its
 * end's half width), the wing (span, chords, sweep, dihedral, at its root's
 * leading edge, pos, dev the tip device and dh its height), the engines, the tail
 * (tk its kind; fin [root, tip, sweep, at, dorsal]; tp the tailplane [span,
 * root, tip, sweep, at, dihedral, y]), the gear (ng the nose leg [d, r, twin];
 * mg the main legs [d, z, r, twin, axles, top]; retract, gk its kind, gx more),
 * windows [from, to, pitch, y, w, h, shape] and doors.
 */
export interface Brief {
  L: number; H: number; W: number; D?: number; k: number; nose: NoseKind; ns?: number; tl: number; ty?: number; te?: number;
  corner?: number; hump?: FuselageSpec["hump"]; hull?: number; bulge?: FuselageSpec["bulge"]; n?: number;
  span: number; root: number; kink?: [number, number]; tip: number; sweep: number; dih: number; at: number; pos?: WingSpec["pos"];
  wy?: number; thick?: [number, number]; dev?: TipDevice; dh?: number; strut?: number; upper?: WingSpec["upper"]; plan?: WingSpec["plan"];
  eng: EngineSpec[];
  tk?: TailKind; fin: [number, number, number, number, number?]; tp?: [number, number, number, number, number, number?, number?];
  ng?: [number, number, boolean?]; mg?: Array<[number, number, number, boolean?, number?, number?]>; retract?: boolean; gk?: GearSpec["kind"]; gx?: Partial<GearSpec>;
  win?: Array<[number, number, number, number?, number?, number?, WindowRow["shape"]?]>; doors?: number[]; cargo?: boolean; extra?: AirframeSpec["extra"];
  /** Fowler flaps (WingSpec.flaps) and a drooping nose (FuselageSpec.droop). */
  flaps?: boolean; droop?: FuselageSpec["droop"];
}

/** The spec of a brief, all but its livery. */
export function brief(b: Brief): Omit<AirframeSpec, "scheme" | "schemeKey"> {
  const gk = b.gk ?? "tricycle";
  const leg = ([d, z, r, twin, axles, top]: [number, number, number, boolean?, number?, number?]) => ({ d, z, r, ...(twin ? { twin } : {}), ...(axles ? { axles } : {}), ...(top !== undefined ? { top } : {}) });
  return {
    length: b.L, height: b.H,
    fuselage: {
      width: b.W, ...(b.D ? { depth: b.D } : {}), keel: b.k, nose: b.nose, ...(b.ns ? { noseScale: b.ns } : {}), tailLen: b.tl,
      ...(b.ty !== undefined ? { tailY: b.ty } : {}), ...(b.te !== undefined ? { tailEnd: b.te } : {}), ...(b.corner !== undefined ? { corner: b.corner } : {}),
      ...(b.hump ? { hump: b.hump } : {}), ...(b.hull ? { hull: b.hull } : {}), ...(b.bulge ? { bulge: b.bulge } : {}), ...(b.n ? { n: b.n } : {}),
      ...(b.droop ? { droop: b.droop } : {}),
    },
    wing: {
      span: b.span, root: b.root, ...(b.kink ? { kink: { at: b.kink[0], chord: b.kink[1] } } : {}), tip: b.tip, sweep: b.sweep, dihedral: b.dih, at: b.at, pos: b.pos ?? "low",
      ...(b.wy !== undefined ? { y: b.wy } : {}), ...(b.thick ? { thick: b.thick } : {}), ...(b.dev ? { tipDevice: b.dev } : {}), ...(b.dh ? { devHeight: b.dh } : {}),
      ...(b.strut !== undefined ? { strut: b.strut } : {}), ...(b.upper ? { upper: b.upper } : {}), ...(b.plan ? { plan: b.plan } : {}),
      ...(b.flaps ? { flaps: true } : {}),
    },
    engines: b.eng,
    tail: {
      kind: b.tk ?? "conventional",
      fin: { root: b.fin[0], tip: b.fin[1], sweep: b.fin[2], at: b.fin[3], ...(b.fin[4] ? { dorsal: b.fin[4] } : {}) },
      ...(b.tp ? { plane: { span: b.tp[0], root: b.tp[1], tip: b.tp[2], sweep: b.tp[3], at: b.tp[4], ...(b.tp[5] !== undefined ? { dihedral: b.tp[5] } : {}), ...(b.tp[6] !== undefined ? { y: b.tp[6] } : {}) } } : {}),
    },
    gear: {
      kind: gk, retract: b.retract ?? (gk === "tricycle" || gk === "taildragger"),
      ...(b.ng ? { nose: { d: b.ng[0], z: 0, r: b.ng[1], ...(b.ng[2] ? { twin: true } : {}) } } : {}),
      mains: (b.mg ?? []).map(leg),
      ...b.gx,
    },
    windows: (b.win ?? []).map(([from, to, pitch, y, w, h, shape]) => ({ from, to, pitch, ...(y !== undefined ? { y } : {}), ...(w !== undefined ? { w } : {}), ...(h !== undefined ? { h } : {}), ...(shape ? { shape } : {}) })),
    doors: b.doors ?? [],
    ...(b.cargo ? { cargo: true } : {}),
    ...(b.extra ? { extra: b.extra } : {}),
  };
}

/** A fixed scheme (a design without a livery parameter). */
export const fixed = (schemes: Record<string, Scheme>, key: string): { scheme: Scheme; schemeKey: string } => ({ scheme: schemes[key]!, schemeKey: key });

type Builder = (p?: ParamValues) => MeshBuilder;

/** A world aircraft as its module lists it. */
export interface WorldAircraft {
  id: string;
  title: string;
  /** The airframe kit's spec (absent on a rotor-kit design, which has `rotor`). */
  spec?: (p?: ParamValues) => AirframeSpec;
  build: Builder;
  buildLod: Builder;
  params?: readonly ParamSpec[];
  finishParams?: readonly string[];
  game: GameProperties;
  references: string;
}

/** A livery parameter and its schemes, the first the default. */
export interface Liveries {
  schemes: Record<string, Scheme>;
  params: ParamSpec[];
}

/** The `livery` parameter over these schemes (or another parameter's name and title, e.g. a light aircraft's colour). */
export function liveries(s: Record<string, Scheme>, name = "livery", title = "Livery"): Liveries {
  return { schemes: s, params: [schemeParam(s, name, title)] };
}

/** The scheme the parameters choose, with its key. */
export function chosen(l: Liveries, p?: ParamValues, extra: readonly ParamSpec[] = []): { scheme: Scheme; schemeKey: string } {
  const v = resolveParams([...l.params, ...extra], p);
  const key = v[l.params[0]!.name]!;
  return { scheme: l.schemes[key]!, schemeKey: key };
}

/**
 * Game properties of an aircraft: mass (maximum take-off, t), power (kW: a jet's
 * total static thrust in kN times 10, as the original airliners state it; a
 * propeller aircraft's shaft power), cruising speed (km/h), the airport class and
 * the passenger seat.
 */
export const air = (weight: number, power: number, maxspeed: number, sizeClass: "small" | "medium" | "big", seatFrac: number, variants?: GameProperties["variants"]): GameProperties =>
  ({ weight, power, maxspeed, accel: null, sizeClass, seatFrac, ...(variants ? { variants } : {}) });

/** The catalog designs of a module's list. */
export function aircraftDesigns(list: readonly WorldAircraft[]): ProceduralDesign[] {
  return list.map((a) => ({
    id: a.id,
    title: a.title,
    game: a.game,
    build: a.build,
    buildLod: a.buildLod,
    ...(a.params ? { params: a.params } : {}),
    ...(a.finishParams ? { finishParams: a.finishParams } : {}),
    references: a.references,
    catalog: { ...AIRCRAFT_CATALOG, yaw: 180 },
  }));
}
