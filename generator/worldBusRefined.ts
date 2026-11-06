// The refined world buses' own fittings (docs/models/world-buses-detail.md): ten
// buses of the world fleet that carry the confirmed buses' fine detail
// (WorldBusSpec.detail) and, drawn here as their WorldBusSpec.extras, what makes each
// recognisable from the game's camera - the New Routemaster's glazed staircases, the
// AEC Routemaster's radiator and route boxes, the school bus's warning lamps and stop
// arm, a trolleybus's roof equipment, the RTO's roof rack and ladder, the
// Scenicruiser's fluted sides, the coaches' luggage bays, gutters, hatches and
// louvres. Every function takes the city bus context and its spec; u is metres from
// the nose, the factory's x is c.x(u).

import type { MeshBuilder, Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { endBadge, endBar, endLamp, endLettering, endPoint, endSlab, sidePoint, sideSlab, type BusFrame } from "./busKit.ts";
import { roofBox, type CityCtx } from "./cityBuses.ts";
import { block } from "./vehicleParts.ts";
import type { WorldBusSpec } from "./worldBusKit.ts";

type Extras = (c: CityCtx, s: WorldBusSpec) => void;

// ---------------------------------------------------------------------------
// the toolkit

/** The rigid bodies in u, front first. */
const bodiesOf = (s: WorldBusSpec): ReadonlyArray<readonly [number, number]> => s.bodies ?? [[0, s.length]];

/** A flat convex outline (x, y points) on side `sd`, laid on the shell `proud` out of it. Within one piece of the section. */
function sidePoly(m: MeshBuilder, mat: string, f: BusFrame, sd: number, pts: Array<[number, number]>, proud: number): void {
  m.slab(mat, pts.map(([x, y]) => sidePoint(f, sd, x, y, proud)), [0, 0, -sd * (2 * proud + 0.02)]);
}

/** A roof hatch at each u: its frame on the roof and the lid on it (`lid` the roof's colour), `half` wide each way and `len` long. */
function hatches(c: CityCtx, s: WorldBusSpec, us: readonly number[], lid = "pod", half = 0.42, len = 0.72): void {
  for (const u of us) {
    const [x0, x1] = [c.x(u + len / 2), c.x(u - len / 2)];
    roofBox(c, "roof hatches", x0, x1, -half, half, s.height + 0.035, "frame", s.height - 0.06);
    c.d.fit("roof hatches", (x0 + x1) / 2, () => block(c.m(), lid, x0 + 0.04, x1 - 0.04, s.height + 0.03, s.height + 0.065, -half + 0.04, half - 0.04));
  }
}

/** A rain gutter along both sides of every body at height y, under the eave. */
function gutters(c: CityCtx, s: WorldBusSpec, y: number): void {
  for (const [u0, u1] of bodiesOf(s)) {
    const [x0, x1] = [c.x(u1) + 0.15, c.x(u0) - 0.15 - (u0 === 0 ? s.front.rake + 0.25 : 0)];
    c.d.fit("gutters", (x0 + x1) / 2, () => {
      for (const sd of [-1, 1]) sideSlab(c.m(), "frame", c.frame, sd, x0, x1, y, y + 0.03, 0.026);
    });
  }
}

/** Louvres on side `sd` over u0..u1, y0..y1: a dark surround and its slats. */
function louvres(c: CityCtx, sd: number, u0: number, u1: number, y0: number, y1: number, mat = "grille"): void {
  const [x0, x1] = [c.x(u1), c.x(u0)];
  c.d.fit("louvres", (x0 + x1) / 2, () => {
    const m = c.m();
    sideSlab(m, "frame", c.frame, sd, x0 - 0.03, x1 + 0.03, y0 - 0.03, y1 + 0.03, 0.008);
    const n = Math.max(2, Math.floor((y1 - y0) / 0.065));
    const p = (y1 - y0) / n;
    for (let i = 0; i < n; i++) sideSlab(m, mat, c.frame, sd, x0, x1, y0 + i * p + p * 0.2, y0 + (i + 1) * p - p * 0.2, 0.018);
  });
}

/** Hinged flaps on side `sd` (luggage bays, engine and service doors): a seam round each and a chrome handle. */
function flaps(c: CityCtx, sd: number, runs: ReadonlyArray<readonly [number, number]>, y0: number, y1: number): void {
  for (const [u0, u1] of runs) {
    const [x0, x1] = [c.x(u1), c.x(u0)];
    c.d.fit("flaps", (x0 + x1) / 2, () => {
      const m = c.m();
      for (const [a, b, ya, yb] of [[x0, x1, y0, y0 + 0.014], [x0, x1, y1 - 0.014, y1], [x0, x0 + 0.014, y0, y1], [x1 - 0.014, x1, y0, y1]] as const) {
        sideSlab(m, "frame", c.frame, sd, a, b, ya, yb, 0.01);
      }
      const xm = (x0 + x1) / 2;
      sideSlab(m, "chrome", c.frame, sd, xm - 0.09, xm + 0.09, y1 - 0.12, y1 - 0.09, 0.02);
    });
  }
}

/** A name along side `sd` over u0..u1 at height y, read from afar: a row of strokes `pitch` apart. */
function sideName(c: CityCtx, sd: number, u0: number, u1: number, y: number, h: number, mat: string, pitch = 0.09): void {
  const [x0, x1] = [c.x(u1), c.x(u0)];
  c.d.fit("names", (x0 + x1) / 2, () => {
    const n = Math.max(3, Math.round((x1 - x0) / pitch));
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      // short strokes between the tall ones, as letters' bars read at a distance
      const tall = i % 3 !== 1;
      sideSlab(c.m(), mat, c.frame, sd, x0 + i * w + w * 0.2, x0 + (i + 1) * w - w * 0.2, tall ? y : y + h * 0.3, tall ? y + h : y + h * 0.7, 0.014);
    }
  });
}

/** A strip along side `sd` over u0..u1 at y0..y1, cut round the wheel arches and (on the right) the doors. */
function sideStrip(c: CityCtx, s: WorldBusSpec, sd: number, u0: number, u1: number, y0: number, y1: number, mat: string, proud = 0.012): void {
  const r = s.wheelRadius;
  const archTop = Math.max(r * 2.17, s.floor + 0.35);
  const cuts: Array<[number, number]> = [];
  if (y0 < archTop + 0.04) for (const a of s.axles) cuts.push([a.at - r - 0.2, a.at + r + 0.2]);
  if (sd > 0) for (const [d0, d1] of s.doors) cuts.push([d0 - 0.08, d1 + 0.08]);
  for (const [b0, b1] of bodiesOf(s)) cuts.push([b1 - 0.05, b1 + 1.0], [b0 - 1.0, b0 + 0.05]);
  cuts.sort((p, q) => p[0] - q[0]);
  let at = u0;
  const pieces: Array<[number, number]> = [];
  for (const [a, b] of cuts) {
    if (b <= at || a >= u1) continue;
    if (a - at > 0.25) pieces.push([at, a]);
    at = Math.max(at, b);
  }
  if (u1 - at > 0.25) pieces.push([at, u1]);
  for (const [a, b] of pieces) {
    const [x0, x1] = [c.x(b), c.x(a)];
    c.d.fit("strips", (x0 + x1) / 2, () => sideSlab(c.m(), mat, c.frame, sd, x0, x1, y0, y1, proud));
  }
}

/**
 * A double-decker's glazed staircase on side `sd`: a band of glass `w` long rising
 * diagonally from the lower deck's windows at ua to the upper deck's at ub, in a frame.
 */
function staircase(c: CityCtx, s: WorldBusSpec, sd: number, ua: number, ub: number, w: number): void {
  const low = s.screen.y1;
  const up = s.upper!.pane.glass[0];
  const [xa, xb] = [c.x(ua), c.x(ub)];
  const d = w * Math.sign(xb - xa);
  c.d.fit("staircase glazing", (xa + xb) / 2, () => {
    const m = c.m();
    sidePoly(m, "frame", c.frame, sd, [[xa - d * 0.06, low - 0.06], [xa + d * 1.06, low - 0.06], [xb + d * 1.06, up + 0.06], [xb - d * 0.06, up + 0.06]], 0.012);
    sidePoly(m, "glassDark", c.frame, sd, [[xa, low - 0.04], [xa + d, low - 0.04], [xb + d, up + 0.04], [xb, up + 0.04]], 0.03);
  });
}

/** The route box on the tail between the decks (or under the rear window): a dark box and its lit text. */
function rearRouteBox(c: CityCtx, y0: number, y1: number, half = 0.45): void {
  c.d.fit("rear route box", c.tail, () => {
    endSlab(c.m(), "sign", c.frame, -1, -half, half, y0, y1, 0.03);
    endSlab(c.m(), "signText", c.frame, -1, -half + 0.07, half - 0.07, y0 + 0.06, y1 - 0.06, 0.034);
  });
}

/** An open rear platform's grab pole: chrome, floor to ceiling, in the middle of the doorway, at its outer edge. */
function platformPole(c: CityCtx, s: WorldBusSpec): void {
  const [d0, d1] = s.doors[s.doors.length - 1]!;
  const xp = c.x((d0 + d1) / 2);
  c.d.fit("platform pole", xp, () => c.m().rod("chrome", [xp, s.door.bottom + 0.02, c.hw - 0.05], [xp, s.door.top - 0.02, c.hw - 0.05], 0.022, 8));
}

/** The maker's name on the nose at height y, and (`band`) the dark panel the head lamps sit in, across the nose. */
function noseName(c: CityCtx, s: WorldBusSpec, y: number, band = false): void {
  c.d.fit("nose name", c.nose, () => {
    const m = c.m();
    endLettering(m, c.frame, 1, -0.3, 0.3, y, 0.05, 0.02);
    if (band) endSlab(m, "frame", c.frame, 1, -c.hw + 0.06, c.hw - 0.06, s.lamps.y0 - 0.06, s.lamps.y1 + 0.06, 0.004);
  });
}

/**
 * A roof rack over u0..u1: two rails on posts and cross bars at its ends, and
 * (`ladder`) the ladder up the tail's right beside the rear window.
 */
function roofRack(c: CityCtx, s: WorldBusSpec, u0: number, u1: number, ladder: boolean): void {
  const [x0, x1] = [c.x(u1), c.x(u0)];
  const yr = s.height + 0.16;
  const zr = Math.min(0.88, c.hw - 0.37);
  c.d.roofItem(x0, x1, -zr - 0.04, zr + 0.04, s.height - 0.1, yr + 0.02, "frame");
  c.d.fit("roof rack", (x0 + x1) / 2, () => {
    const m = c.m();
    for (const z of [-zr, zr]) {
      m.rod("frame", [x0, yr, z], [x1, yr, z], 0.018, 6);
      for (let i = 0; i <= 5; i++) {
        const x = x0 + ((x1 - x0) * i) / 5;
        m.rod("frame", [x, s.height - 0.1, z * 0.95], [x, yr, z], 0.015, 6);
      }
    }
    for (const x of [x0, x1]) m.rod("frame", [x, yr, -zr], [x, yr, zr], 0.018, 6);
  });
  if (ladder) c.d.fit("ladder", c.tail, () => {
    const m = c.m();
    const at = (z: number, y: number): Vec3 => endPoint(c.frame, -1, z, y, 0.05);
    const [ya, yb] = [1.0, s.eave - 0.02];
    const [za, zb] = [c.hw - 0.27, c.hw - 0.09];
    for (const z of [za, zb]) m.rod("frame", at(z, ya), at(z, yb), 0.015, 6);
    for (let y = ya + 0.15; y < yb - 0.05; y += 0.25) m.rod("frame", at(za, y), at(zb, y), 0.012, 6);
  });
}

/**
 * A trolleybus's roof gear behind its poles' base (the poles' tips lie about u 9.8
 * lowered): the converter's box with ventilation grilles over u 4.7..8.1, the two
 * rope retrievers' reels at u 8.5 and the hooks the lowered poles rest in at u 9.15.
 * (The ropes are not drawn: the poles' clip moves rigid pieces, and a rope from a
 * fixed reel to a moving tip changes length.)
 */
function trolleyGear(c: CityCtx, s: WorldBusSpec): void {
  const H = s.height;
  const [x0, x1] = [c.x(8.1), c.x(4.7)];
  roofBox(c, "roof equipment", x0, x1, -0.95, 0.95, H + 0.32, "pod", H - 0.08);
  c.d.fit("roof equipment", (x0 + x1) / 2, () => {
    const m = c.m();
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
      const y = H + 0.06 + i * 0.075;
      const [z0, z1] = sd > 0 ? [0.94, 0.965] : [-0.965, -0.94];
      block(m, "grille", x0 + 0.2, x1 - 0.2, y, y + 0.04, z0, z1);
    }
  });
  // the retrievers: a housing and its drum under each pole
  const xr = c.x(8.5);
  c.d.roofItem(xr - 0.15, xr + 0.15, -0.44, 0.44, H - 0.06, H + 0.24, "frame");
  c.d.fit("retrievers", xr, () => {
    const m = c.m();
    for (const sd of [-1, 1]) {
      block(m, "frame", xr - 0.15, xr + 0.15, H - 0.06, H + 0.1, ...(sd > 0 ? [0.16, 0.44] as [number, number] : [-0.44, -0.16] as [number, number]));
      m.rod("pole", [xr, H + 0.15, sd * 0.19], [xr, H + 0.15, sd * 0.41], 0.085, 10);
    }
  });
  // the poles' hooks, under the lowered poles
  const xh = c.x(9.15);
  c.d.roofItem(xh - 0.06, xh + 0.06, -0.36, 0.36, H - 0.08, H + 0.38, "frame");
  c.d.fit("pole hooks", xh, () => {
    for (const z of [-0.3, 0.3]) {
      block(c.m(), "frame", xh - 0.04, xh + 0.04, H - 0.08, H + 0.34, z - 0.06, z - 0.045);
      block(c.m(), "frame", xh - 0.04, xh + 0.04, H - 0.08, H + 0.34, z + 0.045, z + 0.06);
    }
  });
}

/**
 * Wheel covers (spats) over the rear wheels' arches, both sides: a panel on the shell
 * from below the tyre's middle up over the arch, its back 5 mm into the shell, clear
 * of the tyres and hub caps behind it. The steered wheels stay open.
 */
function spats(c: CityCtx, s: WorldBusSpec, mat: string): void {
  const r = s.wheelRadius;
  const half = r + 0.12 + 0.07;
  const top = Math.max(r * 2.17, s.floor + 0.35) + 0.07;
  for (const a of s.axles.slice(1)) {
    const x = c.x(a.at);
    c.d.fit("wheel covers", x, () => {
      for (const sd of [-1, 1]) sideSlab(c.m(), mat, c.frame, sd, x - half, x + half, 0.4, top, 0.024, 0.005);
    });
  }
}

/**
 * Service flaps low on the left between the axles (the batteries, the fuel filler, the
 * heater): two flaps with handles, clear of the arches, and the filler's chrome cap.
 */
function serviceFlaps(c: CityCtx, s: WorldBusSpec): void {
  const r = s.wheelRadius + 0.12;
  const a0 = s.axles[0]!.at + r + 0.25;
  const a1 = s.axles[1]!.at - r - 0.25;
  if (a1 - a0 < 2.0) return;
  const top = Math.min(s.belt - 0.08, s.floor + 0.62);
  flaps(c, -1, [[a0, a0 + 0.9], [a1 - 0.9, a1]], s.floor + 0.08, top);
  const xf = c.x(a0 + 1.25);
  c.d.fit("fuel filler", xf, () => sideSlab(c.m(), "chrome", c.frame, -1, xf - 0.07, xf + 0.07, top - 0.16, top - 0.04, 0.016));
}

/** A round lamp on an end in a dark housing, `mat` its lens. */
const endRound = (m: MeshBuilder, f: BusFrame, end: 1 | -1, mat: string, z: number, y: number, r: number, proud = 0.026): void =>
  endLamp(m, mat, f, end, z, y, r, proud, "frame", 10);

/** A ring of n points round (z, y) on an end, for an outline. */
const ringOn = (n: number, r: number, z: number, y: number, rot = 0): Ring =>
  Array.from({ length: n }, (_, i): [number, number] => [z + r * Math.cos(rot + (i / n) * 2 * Math.PI), y + r * Math.sin(rot + (i / n) * 2 * Math.PI)]);

// ---------------------------------------------------------------------------
// the designs

/**
 * New Routemaster: the two glazed staircases - a band of glass rising diagonally
 * from the lower deck's windows to the upper deck's, at the front on the left
 * (the offside) and at the rear on the right over the rear platform's door -, the
 * route number over the middle door, two roof hatches and a gutter.
 */
export const newRoutemaster: Extras = (c, s) => {
  staircase(c, s, -1, 1.0, 2.6, 1.25);
  staircase(c, s, 1, 10.95, 9.2, 1.25);
  // the route number over the middle door, in the upper deck's first right-hand window
  const up = s.upper!.pane.glass[0];
  const xd = c.x(5.1);
  c.d.fit("route number", xd, () => {
    sideSlab(c.m(), "sign", c.frame, 1, xd - 0.32, xd + 0.32, up + 0.1, up + 0.36, 0.034);
    sideSlab(c.m(), "signText", c.frame, 1, xd - 0.25, xd + 0.25, up + 0.16, up + 0.3, 0.038);
  });
  hatches(c, s, [3.0, 7.6]);
  gutters(c, s, s.eave - 0.08);
};

/**
 * AEC Routemaster: the chrome radiator surround on the bonnet with the maker's
 * triangle, the route number and "via" boxes over the
 * cab, the upper deck's split front windows with their top vents, the rear route
 * box, the open rear platform (no doors: DoorStyle.open) with its grab pole, roof
 * vents over the front, the lower saloon's front window over the bonnet (and, in the
 * kit's bonnet, the solid wings and the apron a detailed bus has).
 */
export const routemaster: Extras = (c, s) => {
  const L = s.length;
  const xf = L - 0.1;
  const b = s.bonnet!;
  const [g0, g1, gh] = b.grille!;
  const zr = 0.05; // the half cab's left edge: the radiator stands left of it
  c.d.fit("radiator", L - 0.3, () => {
    const m = c.m();
    block(m, "chrome", xf - 0.012, xf + 0.006, g0 - 0.05, g1 + 0.06, -gh - 0.06, zr - 0.02);
    // the maker's triangle on top of the radiator
    const yt = g1 + 0.06;
    m.slab("chrome", [[xf + 0.02, yt - 0.02, -0.25], [xf + 0.02, yt - 0.02, -0.05], [xf + 0.02, yt + 0.12, -0.15]], [-0.03, 0, 0]);
  });
  // the front of the body carried over the bonnet: route boxes and the upper front windows' pillar and vents
  const [u0, u1] = s.screen.upper!;
  c.d.fit("route boxes", L - 0.05, () => {
    const m = c.m();
    block(m, "sign", L - 0.02, L + 0.03, 2.2, 2.52, 0.66, 1.0);
    block(m, "signText", L + 0.025, L + 0.038, 2.27, 2.45, 0.71, 0.95);
    block(m, "frame", L - 0.02, L + 0.04, u0 - 0.02, u1 + 0.02, -0.035, 0.035);
    for (const [z0, z1] of [[-s.screen.half + 0.03, -0.06], [0.06, s.screen.half - 0.03]] as const) block(m, "frame", L - 0.02, L + 0.04, u1 - 0.24, u1 - 0.2, z0, z1);
    // two vents in the roof dome over the front
    for (const z of [-0.45, 0.45]) block(m, "frame", L - 0.55, L - 0.25, s.height - 0.06, s.height + 0.03, z - 0.18, z + 0.18);
  });
  c.d.roofItem(L - 0.55, L - 0.25, -0.63, 0.63, s.height - 0.06, s.height + 0.03, "frame");
  // the lower saloon's front window over the bonnet, left of the cab, in its frame
  const hood = Math.max(...b.top);
  c.d.fit("bulkhead window", c.nose, () => {
    endSlab(c.m(), "frame", c.frame, 1, -c.hw + 0.08, zr - 0.06, hood + 0.08, s.screen.y1 - 0.02, 0.01);
    endSlab(c.m(), "glass", c.frame, 1, -c.hw + 0.13, zr - 0.11, hood + 0.13, s.screen.y1 - 0.07, 0.02);
  });
  rearRouteBox(c, 2.24, 2.5);
  platformPole(c, s);
  gutters(c, s, s.eave - 0.08);
};

/** Neoplan Skyliner: luggage bays both sides, the rear corners' engine louvres, a chrome strip, roof air conditioning and hatches. */
export const skyliner: Extras = (c, s) => {
  for (const sd of [-1, 1]) {
    flaps(c, sd, [[3.55, 4.85], [4.95, 6.2]], 0.42, 1.0);
    flaps(c, sd, [[7.35, 8.5]], 0.42, 1.0);
    louvres(c, sd, 11.35, 13.3, 0.55, 1.0);
    sideStrip(c, s, sd, 0.3, s.length - 0.3, 1.02, 1.045, "chrome", 0.016);
  }
  // the left side has a bay where the right has its middle door
  flaps(c, -1, [[6.3, 7.2]], 0.42, 1.0);
  roofBox(c, "roof", c.x(11.2), c.x(8.6), -0.95, 0.95, s.height + 0.22, "pod", s.height - 0.08);
  hatches(c, s, [3.4, 6.4]);
};

/** Ikarus 280: rain gutters, three roof hatches, the underfloor engine's grille on the left, the maker's name on the nose. */
export const ikarus280: Extras = (c, s) => {
  gutters(c, s, s.eave - 0.12);
  hatches(c, s, [3.6, 7.2, 13.0]);
  louvres(c, -1, 5.0, 6.6, 0.45, 0.72);
  noseName(c, s, s.lamps.y1 + 0.22, true);
};

/**
 * Skoda 15Tr: the trolleybus's roof gear (trolleyGear: the converter's box, the rope
 * retrievers' reels, the poles' hooks), hatches, gutters and the traction motor's grille.
 */
export const skoda15tr: Extras = (c, s) => {
  trolleyGear(c, s);
  hatches(c, s, [2.2, 12.2, 15.2]);
  gutters(c, s, s.eave - 0.1);
  louvres(c, -1, 13.0, 14.0, 0.95, 1.32);
};

/**
 * Van Hool Exqui.City: the tram's look - the roof fairings ramped down at their
 * ends, a light strip across the nose, the rear wheels behind covers, the
 * driver's door on the left, a chin spoiler in the skirt's colour (and, in its
 * spec, the nose's plan rounded wide).
 */
export const exquiCity: Extras = (c, s) => {
  for (const [u0, u1, half, top, mat] of s.roof ?? []) {
    // a ramp ahead of and behind each fairing, from the roof up to its top
    for (const [u, dir] of [[u0, 1], [u1, -1]] as const) {
      const xe = c.x(u);
      const xr = xe + dir * 0.7;
      c.d.roofItem(Math.min(xe, xr), Math.max(xe, xr), -half, half, s.height - 0.08, top, mat);
      c.d.fit("fairing ramps", xe, () => {
        const prof: Ring = dir > 0 ? [[xe - 0.02, s.height - 0.08], [xr, s.height - 0.08], [xe - 0.02, top]] : [[xr, s.height - 0.08], [xe + 0.02, s.height - 0.08], [xe + 0.02, top]];
        c.m().sweep(mat, "z", prof, -half + 0.05, prof, half - 0.05);
      });
    }
  }
  c.d.fit("light strip", c.nose, () => {
    const m = c.m();
    endSlab(m, "frame", c.frame, 1, -c.hw + 0.25, c.hw - 0.25, 1.0, 1.08, 0.01);
    endSlab(m, "lampHead", c.frame, 1, -c.hw + 0.3, c.hw - 0.3, 1.02, 1.06, 0.018);
    endSlab(m, "skirt", c.frame, 1, -c.hw + 0.05, c.hw - 0.05, s.floor + 0.02, s.floor + 0.09, 0.024);
  });
  spats(c, s, "body");
  // the driver's door on the left, ahead of the front axle
  flaps(c, -1, [[0.75, 1.55]], 0.4, s.eave - 0.3);
  c.d.fit("driver's window", c.x(1.15), () => sideSlab(c.m(), "glassDark", c.frame, -1, c.x(1.5), c.x(0.8), 1.3, s.eave - 0.4, 0.03));
  gutters(c, s, s.eave - 0.06);
};

/**
 * Blue Bird Vision, a US school bus: the eight-way warning lamps (amber inside, red
 * outside) either side of the SCHOOL BUS sign on the front and rear caps, the stop
 * arm folded on the left side, the crossing arm folded on the front bumper, the
 * cross-view mirrors on stalks, the rear emergency door, the district's name, the
 * clearance lamps, two roof hatches.
 */
export const vision: Extras = (c, s) => {
  const hw = c.hw;
  const cap0 = s.screen.y1 + 0.06;
  const capTop = s.eave + 0.02;
  const cap = (end: 1 | -1): void => {
    const m = c.m();
    const yc = (cap0 + capTop) / 2;
    endSlab(m, "black", c.frame, end, -0.5, 0.5, yc - 0.12, yc + 0.12, 0.012);
    endSlab(m, "plateYellow", c.frame, end, -0.46, 0.46, yc - 0.09, yc + 0.09, 0.018);
    endLettering(m, c.frame, end, -0.4, 0.4, yc - 0.045, 0.09, 0.024, "black");
    for (const sd of [-1, 1]) {
      endRound(m, c.frame, end, "warnAmber", sd * 0.7, yc, 0.085);
      endRound(m, c.frame, end, "warnRed", sd * (hw - 0.22), yc, 0.085);
      // the clearance lamps at the cap's top corners
      endSlab(m, end > 0 ? "marker" : "reflector", c.frame, end, sd * (hw - 0.12) - 0.04, sd * (hw - 0.12) + 0.04, capTop + 0.02, capTop + 0.07, 0.02);
    }
  };
  c.d.fit("front cap", c.nose, () => cap(1));
  c.d.fit("rear cap", c.tail, () => {
    cap(-1);
    const m = c.m();
    // the emergency door round the rear window, its handle and hinges
    const [w0, w1, wh] = s.back.window!;
    const zd = wh + 0.12;
    const [y0, y1] = [s.floor + 0.3, w1 + 0.07];
    for (const [a, b] of [[[-zd, y0], [-zd, y1]], [[zd, y0], [zd, y1]], [[-zd, y1], [zd, y1]], [[-zd, y0], [zd, y0]]] as Array<[[number, number], [number, number]]>) endBar(m, "black", c.frame, -1, a, b, 0.018, 0.012);
    endSlab(m, "chrome", c.frame, -1, zd - 0.32, zd - 0.06, w0 - 0.22, w0 - 0.18, 0.024);
    for (const y of [y0 + 0.25, (y0 + y1) / 2, y1 - 0.25]) endSlab(m, "frame", c.frame, -1, -zd - 0.03, -zd + 0.05, y - 0.05, y + 0.05, 0.02);
  });
  // the stop arm folded on the left, behind the driver's window, its two red lamps
  const xs = c.x(2.25);
  c.d.fit("stop arm", xs, () => {
    const m = c.m();
    const yc = 1.22;
    sidePoly(m, "black", c.frame, -1, ringOn(8, 0.26, xs, yc, Math.PI / 8), 0.016);
    sidePoly(m, "warnRed", c.frame, -1, ringOn(8, 0.24, xs, yc, Math.PI / 8), 0.026);
    for (let i = 0; i < 4; i++) sideSlab(m, "plate", c.frame, -1, xs - 0.15 + i * 0.08, xs - 0.1 + i * 0.08, yc - 0.06, yc + 0.06, 0.032);
    for (const dy of [-0.18, 0.18]) sidePoly(m, "warnAmber", c.frame, -1, ringOn(8, 0.035, xs, yc + dy), 0.036);
    sideSlab(m, "black", c.frame, -1, xs + 0.24, xs + 0.34, yc - 0.12, yc + 0.12, 0.02);
  });
  // the crossing arm folded along the front bumper's top, its base on the right
  const L = s.length;
  c.d.fit("crossing arm", L - 0.1, () => {
    const m = c.m();
    block(m, "body", L - 0.07, L - 0.02, 0.555, 0.6, 0.3, hw - 0.14);
    block(m, "black", L - 0.085, L - 0.005, 0.55, 0.65, hw - 0.24, hw - 0.06);
    // the cross-view mirrors on stalks from the bumper's corners
    for (const sd of [-1, 1]) {
      const z = sd * (hw - 0.1);
      m.rod("frame", [L - 0.04, 0.5, z], [L + 0.12, 1.55, z + sd * 0.02], 0.015, 6);
      block(m, "frame", L + 0.06, L + 0.2, 1.55, 1.75, z - 0.09, z + 0.09);
    }
  });
  // the hood's badge
  c.d.fit("hood badge", L - 0.1, () => block(c.m(), "chrome", L - 0.1, L - 0.08, 1.28, 1.34, -0.12, 0.12));
  for (const sd of [-1, 1]) sideName(c, sd, 3.6, 6.4, 1.71, 0.16, "black", 0.11);
  // the black stripe just under the side glass
  for (const sd of [-1, 1]) sideStrip(c, s, sd, s.bonnet!.length + 0.05, L - 0.12, 1.9, 1.96, "black");
  hatches(c, s, [4.4, 8.0]);
  // side marker lamps at the cap's ends
  c.d.fit("side lamps", c.nose - 0.3, () => {
    for (const sd of [-1, 1]) sideSlab(c.m(), "marker", c.frame, sd, c.nose - 0.36, c.nose - 0.26, s.eave - 0.1, s.eave - 0.04, 0.02);
  });
  c.d.fit("rear side lamps", c.tail + 0.3, () => {
    for (const sd of [-1, 1]) sideSlab(c.m(), "reflector", c.frame, sd, c.tail + 0.26, c.tail + 0.36, s.eave - 0.1, s.eave - 0.04, 0.02);
  });
};

/** GM Scenicruiser: the fluted aluminium sides, the split windscreen's pillar, the clearance lamps, the name on the tail. */
export const scenicruiser: Extras = (c, s) => {
  for (const sd of [-1, 1]) for (let y = 0.68; y < 1.5; y += 0.085) sideStrip(c, s, sd, 0.25, s.length - 0.25, y, y + 0.03, "chrome", 0.012);
  c.d.fit("windscreen pillar", c.nose, () => {
    const m = c.m();
    endSlab(m, "frame", c.frame, 1, -0.035, 0.035, s.screen.y0 + 0.005, (s.screen.sign ? s.screen.sign[0] : s.screen.y1) - 0.005, 0.03);
    for (const z of [-0.3, 0, 0.3]) endSlab(m, "marker", c.frame, 1, z - 0.04, z + 0.04, s.eave - 0.02, s.eave + 0.04, 0.02);
  });
  c.d.fit("tail lamps", c.tail, () => {
    for (const z of [-0.3, 0, 0.3]) endSlab(c.m(), "reflector", c.frame, -1, z - 0.04, z + 0.04, s.eave - 0.02, s.eave + 0.04, 0.02);
  });
  hatches(c, s, [1.8], "pod", 0.38, 0.6);
};

/**
 * Skoda 706 RTO: the chrome bars across the grille, the maker's name over it, a chrome
 * strip at the belt, the long-distance bus's roof rack and the ladder up the rear,
 * hatches and gutters.
 */
export const rto: Extras = (c, s) => {
  const [g0, g1, gh] = s.grille!;
  c.d.fit("grille bars", c.nose, () => {
    const m = c.m();
    for (let i = 0; i < 4; i++) {
      const y = g0 + 0.04 + (i * (g1 - g0 - 0.08)) / 3;
      endSlab(m, "chrome", c.frame, 1, -gh - 0.02, gh + 0.02, y - 0.018, y + 0.018, 0.026);
    }
    endLettering(m, c.frame, 1, -0.28, 0.28, g1 + 0.06, 0.05, 0.02);
  });
  for (const sd of [-1, 1]) sideStrip(c, s, sd, 0.6, s.length - 0.6, 1.26, 1.29, "chrome", 0.014);
  roofRack(c, s, 2.2, 9.4, true);
  hatches(c, s, [1.4], "cream");
  gutters(c, s, s.eave - 0.08);
};

/**
 * Curitiba's bi-articulated bus: the boarding flaps folded under each door's sill
 * (they bridge the gap to the tube stations' floor), the three sections' roof air
 * conditioning, hatches and gutters.
 */
export const biarticulado: Extras = (c, s) => {
  const sill = s.door.bottom;
  for (const [d0, d1] of s.doors) {
    const [x0, x1] = [c.x(d1), c.x(d0)];
    c.d.fit("boarding flaps", (x0 + x1) / 2, () => {
      const m = c.m();
      block(m, "frame", x0 + 0.08, x1 - 0.08, sill - 0.09, sill - 0.025, c.hw - 0.02, c.hw + 0.04);
      block(m, "chrome", x0 + 0.1, x1 - 0.1, sill - 0.035, sill - 0.02, c.hw - 0.01, c.hw + 0.045);
    });
  }
  for (const [u0, u1] of [[3.2, 6.2], [12.6, 15.6], [19.6, 22.6]] as const) roofBox(c, "roof", c.x(u1), c.x(u0), -0.85, 0.85, s.height + 0.24, "white", s.height - 0.08);
  hatches(c, s, [7.6, 16.4, 23.6], "white");
  gutters(c, s, s.eave - 0.24);
  c.d.fit("nose name", c.nose, () => endLettering(c.m(), c.frame, 1, -0.32, 0.32, s.lamps.y1 + 0.24, 0.05, 0.02));
};

// ---------------------------------------------------------------------------
// the second batch

/** Ikarus 260: the 280's solo sister - gutters, hatches, the rear engine's grille on the left, the dark lamp panel and the name. */
export const ikarus260: Extras = (c, s) => {
  gutters(c, s, s.eave - 0.12);
  hatches(c, s, [3.0, 7.0]);
  louvres(c, -1, 9.4, 10.5, 0.48, 0.78);
  noseName(c, s, s.lamps.y1 + 0.22, true);
  serviceFlaps(c, s);
};

/**
 * Leyland National: its trademark roof pod at the rear (the heating unit) faired at
 * its front and slatted along its sides, hatches, gutters, the engine's louvres low on
 * the rear left.
 */
export const leylandNational: Extras = (c, s) => {
  const [u0, u1, half, top, mat] = s.roof![0]!;
  const xe = c.x(u0);
  const xr = xe + 0.8;
  const base = s.height - 0.08;
  c.d.roofItem(xe, xr, -half, half, base, top, mat);
  c.d.fit("pod fairing", xe, () => {
    const m = c.m();
    const prof: Ring = [[xe - 0.02, base], [xr, base], [xe - 0.02, top]];
    m.sweep(mat, "z", prof, -half + 0.05, prof, half - 0.05);
    const x1 = c.x(u1);
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
      const y = s.height + 0.08 + i * 0.09;
      const [z0, z1] = sd > 0 ? [half - 0.01, half + 0.015] : [-half - 0.015, -half + 0.01];
      block(m, "grille", x1 + 0.15, xe - 0.15, y, y + 0.05, z0, z1);
    }
  });
  hatches(c, s, [3.0, 6.2]);
  gutters(c, s, s.eave - 0.1);
  louvres(c, -1, 9.6, 10.8, 0.45, 0.75);
  serviceFlaps(c, s);
};

/** Mercedes-Benz O 305, the German standard bus: the dark lamp band, the star on the nose (its finish) and the tail, hatches in the red roof, gutters, the engine's louvres. */
export const o305: Extras = (c, s) => {
  noseName(c, s, s.lamps.y1 + 0.3, true);
  c.d.fit("rear star", c.tail, () => endBadge(c.m(), c.frame, -1, 0, s.back.grille![1] + 0.14, 0.07, 0.026, true));
  hatches(c, s, [2.6, 6.0, 9.0], "red");
  gutters(c, s, s.eave - 0.1);
  louvres(c, -1, 9.0, 10.4, 0.5, 0.8);
  serviceFlaps(c, s);
};

/** Skoda 14Tr: the trolleybus's roof gear (trolleyGear), hatches, gutters, the traction motor's grille. */
export const skoda14tr: Extras = (c, s) => {
  trolleyGear(c, s);
  hatches(c, s, [2.2, 10.3]);
  gutters(c, s, s.eave - 0.1);
  louvres(c, -1, 8.7, 9.7, 0.95, 1.32);
  serviceFlaps(c, s);
};

/** Alexander Dennis Enviro400: the staircase window behind the driver, the engine bay's louvres at the rear corners, the rear route box, hatches and gutters. */
export const enviro400: Extras = (c, s) => {
  staircase(c, s, -1, 1.3, 2.5, 0.85);
  for (const sd of [-1, 1]) louvres(c, sd, 9.4, 10.5, 0.5, 0.95);
  rearRouteBox(c, 2.22, 2.48);
  hatches(c, s, [3.0, 7.6]);
  gutters(c, s, s.eave - 0.08);
};

/** Karosa SM 11: the dark lamp band and the name on the nose, three hatches, gutters, the engine's grille behind the rear axle on the left. */
export const sm11: Extras = (c, s) => {
  noseName(c, s, s.lamps.y1 + 0.22, true);
  hatches(c, s, [2.5, 6.0, 9.5]);
  gutters(c, s, s.eave - 0.1);
  louvres(c, -1, 8.9, 10.4, 0.5, 0.8);
  serviceFlaps(c, s);
};

/**
 * LiAZ-677: the glazed roof edge over the windows (skylights both sides), a chrome bar
 * across the nose under the lamps, hatches, the engine's louvres at the rear left.
 */
export const liaz677: Extras = (c, s) => {
  for (const [u0, u1] of s.windows) {
    const n = Math.max(1, Math.round((u1 - u0) / s.pitch));
    const w = (u1 - u0) / n;
    for (let i = 0; i < n; i++) {
      const [x0, x1] = [c.x(u0 + (i + 1) * w) + 0.08, c.x(u0 + i * w) - 0.08];
      c.d.fit("skylights", (x0 + x1) / 2, () => {
        for (const sd of [-1, 1]) {
          sideSlab(c.m(), "frame", c.frame, sd, x0 - 0.03, x1 + 0.03, s.eave + 0.004, s.eave + 0.075, 0.008);
          sideSlab(c.m(), "glassLight", c.frame, sd, x0, x1, s.eave + 0.014, s.eave + 0.065, 0.016);
        }
      });
    }
  }
  c.d.fit("nose bar", c.nose, () => endSlab(c.m(), "chrome", c.frame, 1, -c.hw + 0.62, c.hw - 0.62, s.lamps.y0 - 0.02, s.lamps.y0 + 0.015, 0.02));
  hatches(c, s, [3.0, 7.0], "white");
  louvres(c, -1, 8.6, 9.9, 0.48, 0.78);
  serviceFlaps(c, s);
};

/**
 * Bristol Lodekka: the radiator in its chrome surround with the badge on it, the open
 * rear platform (DoorStyle.open) and its pole, the rear route box, the split upper
 * front windows, hatches and gutters.
 */
export const lodekka: Extras = (c, s) => {
  const [g0, g1, gh] = s.grille!;
  c.d.fit("radiator", c.nose, () => endSlab(c.m(), "chrome", c.frame, 1, -gh - 0.06, gh + 0.06, g0 - 0.06, g1 + 0.05, 0.012));
  platformPole(c, s);
  rearRouteBox(c, 2.22, 2.48);
  hatches(c, s, [2.5, 5.6]);
  gutters(c, s, s.eave - 0.08);
};

/** Bussing D2U: the staircase window behind the driver, the engine's louvres at the rear left, the rear route box, hatches and gutters. */
export const d2u: Extras = (c, s) => {
  staircase(c, s, -1, 1.4, 2.6, 0.9);
  louvres(c, -1, 8.4, 9.4, 0.5, 0.95);
  rearRouteBox(c, 2.22, 2.48);
  hatches(c, s, [3.0, 6.8]);
  gutters(c, s, s.eave - 0.08);
};

/**
 * Tatra 500 HB: chrome strips along the skirt's top and under the windows, the rear
 * engine's air intakes on both sides, the long-distance bus's roof rack and ladder, a hatch,
 * the chrome bars across the nose, the service flaps.
 */
export const tatra500: Extras = (c, s) => {
  for (const sd of [-1, 1]) {
    sideStrip(c, s, sd, 0.5, s.length - 0.6, 1.29, 1.32, "chrome", 0.014);
    louvres(c, sd, 8.7, 9.6, 0.55, 1.05);
  }
  roofRack(c, s, 2.0, 8.8, true);
  hatches(c, s, [1.3]);
  // the chrome bars swept across the nose between the lamps, and the badge over them
  c.d.fit("nose chrome", c.nose, () => {
    const m = c.m();
    for (let i = 0; i < 3; i++) endSlab(m, "chrome", c.frame, 1, -0.62 + i * 0.06, 0.62 - i * 0.06, 0.56 + i * 0.09, 0.585 + i * 0.09, 0.024);
  });
  serviceFlaps(c, s);
};
