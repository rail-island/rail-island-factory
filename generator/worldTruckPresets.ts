// The shapes the world trucks share (docs/models/world-trucks.md): the cabs,
// the tractors, the rigid trucks and the trailers of the regions' trades as
// TruckSpec presets on the world truck kit (truckKit.ts, truckBodies.ts), so a
// design (worldTrucks.ts) states only what makes it itself - its sizes, axles,
// colours and bodies. Metres; `u` back from the unit's front.

import type { AxleSpec, BodyKind, BodySpec, CabSpec, ChassisSpec, Livery, TrailerSpec, TruckSpec } from "./truckKit.ts";

export const ax = (at: number, o: Partial<AxleSpec> = {}): AxleSpec => ({ at, ...o });
/** A steered front axle. */
export const steer = (at: number): AxleSpec => ({ at, steer: true });
/** A steered and driven front axle (all-wheel drive). */
export const steerDrive = (at: number): AxleSpec => ({ at, steer: true, drive: true });
/** Driven wheels, dual by default. */
export const drive = (at: number, dual = true): AxleSpec => ({ at, drive: true, dual });
/** A trailing (tag or trailer) axle. */
export const tag = (at: number, dual = false): AxleSpec => ({ at, dual, tag: true });

/** A trailer's axle group: n axles `pitch` apart, the last `rear` metres ahead of its rear. */
export function group(length: number, n: number, rear: number, pitch = 1.31, dual = false): AxleSpec[] {
  return Array.from({ length: n }, (_, i) => tag(length - rear - (n - 1 - i) * pitch, dual));
}

/** A body of `kind` from u0 to u1, its floor and top. */
export const body = (kind: BodyKind, from: number, to: number, floor: number, top: number, o: Partial<BodySpec> = {}): BodySpec => ({ kind, from, to, floor, top, ...o });

type HoodOpts = Omit<Partial<CabSpec>, "hood"> & { hood?: Partial<NonNullable<CabSpec["hood"]>> };

// ---------------------------------------------------------------------------
// cabs

/** A European cab-over: day (1.7 m), sleeper (2.3 m) or high-roof sleeper. */
export function euCab(roof: "day" | "sleeper" | "high", o: Partial<CabSpec> = {}): CabSpec {
  const len = roof === "day" ? 1.7 : 2.3;
  const top = roof === "high" ? 3.95 : roof === "sleeper" ? 3.3 : 3.05;
  return {
    kind: "cabover", length: len, width: 2.49, floor: 1.2, top, screen: [1.98, 2.88], rake: 0.22, corner: 0.2,
    grille: "bars", lamps: "rect", mirrors: "arm", visor: roof !== "high", ...o,
  };
}

/** An older flat-fronted cab-over (the 1960s-80s): upright screen, tighter corners. */
export function oldCab(o: Partial<CabSpec> = {}): CabSpec {
  return { kind: "cabover", length: 1.75, width: 2.4, floor: 1.15, top: 2.95, screen: [1.85, 2.6], rake: 0.08, corner: 0.12, grille: "slots", lamps: "round", mirrors: "small", ...o };
}

/** A US cab-over: tall, flat-faced, a chrome grille, round twin lamps, the West Coast mirrors. */
export function usCabover(o: Partial<CabSpec> = {}): CabSpec {
  return { kind: "cabover", length: 2.3, width: 2.44, floor: 1.45, top: 3.45, screen: [2.15, 2.95], rake: 0.06, corner: 0.08, grille: "chrome", lamps: "round", mirrors: "post", ...o };
}

/** A Japanese or Chinese narrow cab-over (the light trucks): 1.7 to 2.0 m wide. */
export function narrowCab(width: number, o: Partial<CabSpec> = {}): CabSpec {
  return { kind: "cabover", length: 1.55, width, floor: 0.92, top: 2.25, screen: [1.42, 2.05], rake: 0.14, corner: 0.14, grille: "slots", lamps: "rect", mirrors: "small", ...o };
}

/** A US conventional: hood, cab and a sleeper box, stacks and the West Coast mirrors. */
export function usHood(style: "square" | "aero", o: HoodOpts & { sleeperLen?: number; sleeperTop?: number } = {}): CabSpec {
  const { hood, sleeperLen, sleeperTop, ...rest } = o;
  const square = style === "square";
  return {
    kind: "hood", length: 1.3, width: 2.44, floor: 1.2, top: 2.95, screen: [2.0, 2.75], rake: square ? 0.06 : 0.3, corner: square ? 0.1 : 0.22,
    hood: { length: square ? 2.15 : 2.0, top: square ? 1.8 : 1.85, hw: square ? 0.56 : 1.15, style, ...hood },
    ...(sleeperLen === 0 ? {} : { sleeper: { length: sleeperLen ?? 1.8, top: sleeperTop ?? (square ? 3.25 : 3.7) } }),
    grille: square ? "chrome" : "bars", lamps: square ? "round" : "slim", mirrors: square ? "post" : "arm", stacks: square, ...rest,
  };
}

/** A bonneted truck of the 1940s-70s: a narrow bonnet, round fenders and lamps, a split screen. */
export function oldBonnet(o: HoodOpts = {}): CabSpec {
  const { hood, ...rest } = o;
  return {
    kind: "bonnet", length: 1.45, width: 2.2, floor: 1.08, top: 2.3, screen: [1.62, 2.05], rake: 0.06, corner: 0.12,
    hood: { length: 1.7, top: 1.6, hw: 0.45, style: "round", ...hood },
    grille: "round", lamps: "round", mirrors: "small", split: true, ...rest,
  };
}

/** A later bonneted truck: a hood between square fenders over the wheels (the Tatra 148, the Ural, the Zetros). */
export function squareBonnet(o: HoodOpts = {}): CabSpec {
  const { hood, ...rest } = o;
  return {
    kind: "hood", length: 1.6, width: 2.45, floor: 1.3, top: 2.75, screen: [1.95, 2.5], rake: 0.08, corner: 0.1,
    hood: { length: 1.6, top: 1.85, hw: 1.0, style: "square", ...hood },
    grille: "bars", lamps: "round", mirrors: "arm", ...rest,
  };
}

// ---------------------------------------------------------------------------
// chassis

/** The common chassis: frame, tyre radius, axles; the rest by default. */
export function frame(length: number, wheel: number, axles: AxleSpec[], o: Partial<ChassisSpec> = {}): ChassisSpec {
  return { length, wheel, axles, frame: 1.0, tanks: "box", ...o };
}

/** How far a cab reaches back of the nose: its hood, cab and sleeper. */
export function cabLength(c: CabSpec): number {
  return (c.hood ? c.hood.length + (c.kind === "bonnet" ? 0.12 : 0.18) : 0.06) + c.length + (c.sleeper?.length ?? 0);
}

// ---------------------------------------------------------------------------
// trailers

export interface SemiOpts {
  length?: number; floor?: number; top?: number; load?: BodySpec["load"]; pin?: number; round?: boolean; axles?: number;
  /** Twin tyres on a smaller wheel (the older trailers) instead of wide singles. */
  dual?: boolean; wheel?: number; rear?: number;
}

/** A European semi-trailer: 13.6 m, three axles of wide singles, the king pin 1.6 m back by default. */
export function euSemi(kind: BodyKind, o: SemiOpts = {}): TrailerSpec {
  const length = o.length ?? 13.6;
  const top = o.top ?? (kind === "tank" ? 3.65 : kind === "flatbed" || kind === "lowLoader" ? 1.45 : kind === "tipper" ? 3.35 : 4.0);
  const floor = o.floor ?? (kind === "tank" ? 1.45 : kind === "lowLoader" ? 1.4 : 1.34);
  const n = o.axles ?? 3;
  const dual = o.dual ?? false;
  return {
    kind: "semi", length, pin: o.pin ?? 1.6, axles: group(length, n, o.rear ?? 1.9, dual ? 1.25 : 1.31, dual), wheel: o.wheel ?? (dual ? 0.5 : 0.53), tyre: dual ? 0.27 : 0.385,
    body: body(kind, kind === "tank" ? 0.4 : 0, length, floor, top, { ...(o.load ? { load: o.load } : {}), ...(o.round !== undefined ? { round: o.round } : {}) }),
    ...(kind === "lowLoader" ? { legs: 1.2 } : {}),
  };
}

/** A US semi-trailer (53 ft van by default; king pin 0.9 m back), tandem axles of twin tyres at the rear. */
export function usSemi(kind: BodyKind, o: SemiOpts = {}): TrailerSpec {
  const length = o.length ?? 16.15;
  const top = o.top ?? (kind === "flatbed" ? 1.55 : kind === "tank" ? 3.5 : 4.1);
  return {
    kind: "semi", length, pin: o.pin ?? 0.9, axles: group(length, o.axles ?? 2, o.rear ?? (kind === "flatbed" ? 1.0 : 1.4), 1.25, true), wheel: 0.51, tyre: 0.28,
    body: body(kind, kind === "tank" ? 0.3 : 0, length, o.floor ?? (kind === "tank" ? 1.48 : kind === "flatbed" ? 1.44 : 1.36), top, o.load ? { load: o.load } : {}),
  };
}

/** A drawbar trailer behind a rigid truck: two axles of twin tyres, `bar` metres of drawbar. */
export function drawbar(kind: BodyKind, length: number, o: { bar?: number; floor?: number; top?: number; wheel?: number; axles?: AxleSpec[]; hitch?: number; dolly?: number; wheels?: ChassisSpec["wheels"]; load?: BodySpec["load"]; hw?: number } = {}): TrailerSpec {
  const wheel = o.wheel ?? 0.5;
  const floor = o.floor ?? 1.3;
  return {
    kind: "drawbar", length, pin: o.bar ?? 1.9, wheel, axles: o.axles ?? [tag(1.4, true), tag(length - 1.4, true)],
    frame: floor - 0.12, body: body(kind, 0, length, floor, o.top ?? 3.6, { ...(o.load ? { load: o.load } : {}), ...(o.hw ? { hw: o.hw } : {}) }),
    ...(o.hitch !== undefined ? { hitch: o.hitch } : {}), ...(o.dolly !== undefined ? { dolly: o.dolly } : {}), ...(o.wheels ? { wheels: o.wheels } : {}),
  };
}

/** How far ahead of its king pin a semi-trailer reaches above the fifth wheel, in plan: its front corners' swing radius. */
export function swingRadius(t: TrailerSpec): number {
  const k = t.body.kind;
  const hw = t.body.hw ?? 1.27;
  if (k === "reefer") return Math.max(Math.hypot(t.pin + 0.42, 0.95), Math.hypot(t.pin, hw));
  if (k === "tank") return Math.hypot(t.pin - t.body.from + 0.05, Math.min(hw, (t.body.top - t.body.floor) / 2 + 0.1));
  if (k === "lowLoader") return Math.hypot(t.pin, 1.15);
  return Math.hypot(t.pin, hw + 0.03);
}

// ---------------------------------------------------------------------------
// whole trucks

export interface TractorOpts {
  /** Driven axles: one (4x2), a tandem (6x4), a drive and a tag (6x2). */
  axles?: "4x2" | "6x2" | "6x4";
  /** The front axle, metres back of the nose; the tyre radius; the frame's top. */
  front?: number;
  wheel?: number;
  frameY?: number;
  /** The fifth wheel no further forward than this (a longer wheelbase). */
  fifth?: number;
  tanks?: ChassisSpec["tanks"];
  /** Later trailers of a road train. */
  more?: TrailerSpec[];
  extra?: Partial<TruckSpec>;
  chassis?: Partial<ChassisSpec>;
}

/**
 * A tractor of `cab` with its semi-trailer: the fifth wheel placed so the
 * trailer's front swings clear of the cab's back (swingRadius, plus 12 cm), the
 * drive axle(s) just behind it, the frame ending a metre behind them.
 */
export function tractor(cab: CabSpec, trailer: TrailerSpec, livery: Livery, o: TractorOpts = {}): TruckSpec {
  const back = cabLength(cab) + (cab.stacks ? 0.3 : 0);
  const fifth = Math.max(o.fifth ?? 0, back + swingRadius(trailer) + 0.12);
  const front = o.front ?? (cab.kind === "cabover" ? 1.45 : 1.0);
  const wheel = o.wheel ?? 0.53;
  const kind = o.axles ?? "4x2";
  const rear: AxleSpec[] = kind === "4x2" ? [drive(fifth + 0.45)] : kind === "6x4" ? [drive(fifth - 0.35), drive(fifth + 0.97)] : [drive(fifth - 0.2), tag(fifth + 1.1, false)];
  const last = rear[rear.length - 1]!.at;
  const frameY = o.frameY ?? 1.0;
  const chassis: ChassisSpec = { length: last + 0.95, wheel, axles: [steer(front), ...rear], frame: frameY, tanks: o.tanks ?? "box", fifth: { at: fifth, y: frameY + 0.2 }, ...o.chassis };
  return { livery, cab, chassis, body: body("none", 0, 0, 0, 0), trailers: [trailer, ...(o.more ?? [])], ...o.extra };
}

/** A rigid truck with its body. */
export function rigid(cab: CabSpec, chassis: ChassisSpec, b: BodySpec, livery: Livery, o: Partial<TruckSpec> = {}): TruckSpec {
  return { livery, cab, chassis, body: b, ...o };
}

/** A rigid truck's body behind its cab: from `gap` behind the cab's back to `to` (the frame's end by default). */
export function behindCab(kind: BodyKind, cab: CabSpec, chassis: ChassisSpec, top: number, o: Partial<BodySpec> & { gap?: number } = {}): BodySpec {
  const { gap, ...rest } = o;
  return body(kind, cabLength(cab) + (gap ?? 0.12), rest.to ?? chassis.length, rest.floor ?? chassis.frame + 0.15, top, rest);
}
