// The world's sailing ships and small craft (docs/models/world-ships-passenger.md):
// tall ships and a schooner, traditional craft under lateen, junk, sprit and
// crab-claw sails, a Viking longship, canal and river boats, and yachts and
// runabouts, each a ShipSpec on the hull kit (hullKit.ts) at its real size,
// modelled on the photographs in assets/<references>/ and the published figures
// in each folder's SOURCES.md. Metres from the stern (u), heights from the keel.
// The ids are stored in the game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamSpec, ParamValues } from "./design.ts";
import { hullGeometry, shipLod, worldShip, type HullForm, type Item, type Mast, type Sail, type ShipSpec } from "./hullKit.ts";
import type { Vec3 } from "./meshCore.ts";
import { colourParam, detailed, passengerFittings, pick, shipDesigns, type WorldShip } from "./worldShips.ts";

/** A rod between two points (u, y, z). */
const rod = (a: [number, number, number], b: [number, number, number], r: number, mat: string, name?: string): Item => ({ k: "rod", a, b, r, mat, ...(name ? { name } : {}) });

const COLOURS: Record<string, string> = { white: "#f2f0ea", green: "#2f6a45", blue: "#23426e", red: "#b02a22", yellow: "#e8bf2a", black: "#1d2024", navy: "#1f2f4f", grey: "#7d8287", orange: "#d9681e" };

/** A square-rigged mast's sails from the course up: [bottom, top, half-span at the foot] each, tapering 6 %. */
function squares(rows: ReadonlyArray<readonly [number, number, number]>): Sail[] {
  return rows.map(([y0, y1, w]) => ({ kind: "square" as const, y: [y0, y1] as const, w: [w, w * 0.94] as const }));
}

/** A tall ship's mast: its height and its square sails stepped from the deck at D. */
function squareMast(u: number, D: number, top: number, spans: readonly number[], r = 0.45): Mast {
  const n = spans.length;
  const y0 = D + 3;
  const yt = top - 4;
  const h = (yt - y0) / n;
  return { u, y: [D, top], r, sails: squares(spans.map((w, i) => [y0 + h * i + 0.3, y0 + h * (i + 1), w] as const)) };
}

/** A mast with head sails added to its own. */
function withJibs(ms: Mast, jibs: readonly Sail[]): Mast {
  return { ...ms, sails: [...ms.sails, ...jibs] };
}

/** A mast's shrouds: n each side from below its top to the chain plates, stepping aft. */
function shrouds(u: number, top: number, D: number, hw: number, n: number): Item[] {
  return Array.from({ length: n }, (_, k) => k).flatMap((k): Item[] => [1, -1].map((sd): Item => rod([u, top - k * 0.6, 0], [u - 0.6 - k * 0.7, D + 0.3, sd * hw], 0.03, "rope", "shroud")));
}

// ---------------------------------------------------------------------------
// tall ships and schooners

export function sedovSpec(): ShipSpec {
  const L = 108;
  const D = 8.5;
  return {
    kind: "sail",
    hull: { fine: true, length: L, beam: 14.6, depth: D, draft: 6.3, bow: "clipper", stern: "cruiser", section: "keel", entry: 0.3, run: 0.2, rake: 0.06, sheer: [1.2, 2.2], forecastle: [14, 2.2], poop: [16, 2.2], boot: 0.3, stripe: 1.4, screws: 1 },
    livery: { hull: "#1d2024", stripe: "#f2f0ea", bottom: "#b02a22", boot: "#1d2024", deck: "#a07a52", house: "#f2f0ea", sail: "#efe9da", spar: "#3b3f43" },
    items: detailed([
      { k: "tier", u: [44, 60], y: [D - 0.1, D + 2.4], hw: 4, windows: [{ y: 0.9, h: 0.8, w: 0.8, pitch: 1.8 }], name: "midship house" },
      { k: "tier", u: [6, 14], y: [D + 2, D + 4.2], hw: 3.4, front: { y: 0.6, h: 0.9, w: 0.8, n: 4 }, name: "chart house" },
      {
        k: "rig", bowsprit: { len: 9.5, rise: 3 },
        masts: [
          withJibs(squareMast(86, D, 56, [10.5, 9.6, 9, 7.6, 6.6, 5.2]), [{ kind: "jib", y: [D + 6, D + 38], tack: L + 9, len: 14 }, { kind: "jib", y: [D + 5, D + 30], tack: L + 5, len: 12 }]),
          squareMast(64, D, 58, [11, 10, 9.4, 8, 7, 5.6]),
          squareMast(42, D, 56, [10.5, 9.6, 9, 7.6, 6.6, 5.2]),
          { u: 20, y: [D, 46], r: 0.4, sails: [{ kind: "gaff", y: [D + 3, D + 22], len: 15, head: 11 }, { kind: "gaff", y: [D + 24, D + 32], len: 10, head: 0.5 }] },
        ],
      },
      { k: "boats", at: [52], z: 6.4, y: D + 2.6, len: 7, r: 0.9, mat: "white" },
      { k: "bulwark", u: [0, L], h: 1.1, t: 0.2 },
      { k: "strakes", u: [4, L - 4], y: [D - 1.2], w: 0.25, mat: "white", name: "painted band" },
      ...[86, 64, 42].flatMap((u) => shrouds(u, 50, D, 6.9, 4)),
      ...[30, 44, 58].map((u): Item => ({ k: "boats", at: [u], z: 6.6, y: D + 1.6, len: 6, r: 0.8, mat: "white", name: "boats" })),
      { k: "tier", u: [64, 76], y: [D - 0.1, D + 2.2], hw: 3, lip: 0.15, windows: [{ y: 0.8, h: 0.7, w: 0.7, pitch: 1.6 }], name: "forward house" },
      { k: "cyl", u: 10, z: 0, y: [D + 4.2, D + 5.6], r: 0.5, mat: "wood", name: "wheel" },
      { k: "anchors", u: L - 4, y: D - 0.6, s: 1.8 },
      { k: "mooring", at: [3, L - 6], hw: 5.6, s: 0.6, winch: true },
    ]),
  };
}

/**
 * The Cutty Sark (1869) as restored at Greenwich (assets/ship-cutty-sark): a black
 * hull over Muntz metal, a pale gilt line along the sheer, gilt scrollwork at the
 * bow and the counter, Nannie under the bowsprit; solid bulwarks white inside with a
 * teak cap amidships, open rails on the forecastle and the short poop; two teak
 * deckhouses (the after one carrying the boats under their davits); three masts
 * measured off the side photographs (fore 0.34, main 0.59, mizzen 0.81 of the hull
 * from the stem), white lower masts, varnished upper masts and black yards: fore and
 * main with course, double topsails, topgallant and royal, the main a skysail too,
 * the mizzen a bare crossjack yard under its topsails and the spanker. Every yard
 * hangs on its mast, every sail from its yard, the shrouds land on deadeyes on the
 * hull side and the bowsprit, jib-boom and flying jib-boom run out of the bow with
 * their stays, the jibs set on them.
 */
export function cuttySarkSpec(): ShipSpec {
  const L = 64.7;
  const D = 7.1;
  const hull: HullForm = { fine: true, length: L, beam: 11, depth: D, draft: 6.1, bow: "clipper", stern: "cruiser", section: "keel", entry: 0.36, run: 0.3, rake: 0.07, sheer: [1.4, 2.2], forecastle: [9, 1.8], poop: [9.5, 1.5], boot: 0, stripe: 0, screws: 0 };
  const g = hullGeometry(hull);
  const cl = (u: number): number => Math.min(L, Math.max(0, u));
  const deck = (u: number): number => g.deck(cl(u));
  const side = (u: number, y: number): number => g.halfBeam(cl(u), y);
  /** The main deck's sheer line, under the raised forecastle and poop. */
  const sheer = (u: number): number => D + 1.4 * Math.max(0, (L / 2 - u) / (L / 2)) ** 2 + 2.2 * Math.max(0, (u - L / 2) / (L / 2)) ** 2;
  /** The stem's fore edge at height y (the clipper stem rising from its forefoot). */
  const stem = (y: number): number => {
    let lo = L * 0.75;
    let hi = L;
    for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (g.keel(mid) < y) lo = mid; else hi = mid; }
    return lo;
  };
  const BUL: readonly [number, number] = [9.6, 55.5];
  const items: Item[] = [];
  const rope = (a: Vec3, b: Vec3, r = 0.04): Item => ({ k: "rod", a, b, r, mat: "rope", n: 3, name: "rigging" });
  const spar = (a: Vec3, b: Vec3, r: number, mat: string, n = 8): Item => ({ k: "rod", a, b, r, mat, n, name: "spars" });
  const blk = (u0: number, u1: number, z0: number, z1: number, y0: number, y1: number, mat: string, name: string): Item => ({ k: "box", u: [u0, u1], z: [z0, z1], y: [y0, y1], mat, name });
  /** A deadeye on the hull's side (on the bulwark amidships, at the deck edge under an open rail), its chain plate down the side; the rope's foot. */
  const feet: Item[] = [];
  const deadeye = (u: number, sd: number): Vec3 => {
    const yd = deck(u);
    const onBulwark = u > BUL[0] + 0.3 && u < BUL[1] - 0.3;
    const [y0, y1] = onBulwark ? [yd + 0.7, yd + 1.05] : [yd - 0.4, yd - 0.05];
    const zs = side(u, yd);
    const z0 = sd * (zs - 0.12);
    const z1 = sd * (zs + 0.32);
    feet.push(blk(u - 0.17, u + 0.17, Math.min(z0, z1), Math.max(z0, z1), y0, y1, "black", "deadeyes"));
    const yc = yd - 1.1;
    feet.push({ k: "rod", a: [u, y0 + 0.02, sd * (zs + 0.1)], b: [u, yc, sd * (side(u, yc) + 0.02)], r: 0.04, mat: "black", n: 3, name: "chain plates" });
    return [u, y1 - 0.05, sd * (zs + 0.2)];
  };
  /** Ratlines across a fan of shrouds (first and last given, foot to head), every `step` metres up. */
  const ratlines = (a0: Vec3, a1: Vec3, b0: Vec3, b1: Vec3, y0: number, y1: number, step: number): Item[] => {
    const at = (p: Vec3, q: Vec3, y: number): Vec3 => { const t = (y - p[1]) / (q[1] - p[1]); return [p[0] + (q[0] - p[0]) * t, y, p[2] + (q[2] - p[2]) * t]; };
    const out: Item[] = [];
    for (let y = y0; y <= y1; y += step) out.push({ k: "rod", a: at(a0, a1, y), b: at(b0, b1, y), r: 0.022, mat: "rope", n: 3, name: "ratlines" });
    return out;
  };

  interface Rigged { mast: Mast; head: (name: "top" | "topmast" | "tgallant" | "royal" | "truck") => Vec3; axis: (y: number) => number }
  /**
   * A square-rigged mast: stepped at u, H metres from the deck to the truck, raked aft
   * `rake` at the truck; its yards at fractions of H with their full lengths, sails
   * from `first` up (the mizzen's crossjack is bare); white lower mast, varnished
   * topmast and topgallant pole, the top and the crosstrees, shrouds with ratlines,
   * backstays, a fife rail at its foot.
   */
  const rig = (u: number, H: number, rake: number, yards: ReadonlyArray<readonly [number, number]>, first: number, r: readonly [number, number, number], topHw: number, nShrouds: number): Rigged => {
    const yd = deck(u);
    const truck = yd + H;
    const base = yd - 0.1;
    const ax = (y: number): number => u - (rake * (y - base)) / (truck - base);
    const P = (y: number, z = 0): Vec3 => [ax(y), y, z];
    const Y = yards.map(([f]) => yd + f * H);
    const cap = Y[1]! - 0.35;
    const top = cap - 1.6;
    const tmHead = Y[2]! + 1.8;
    const cross = tmHead - 1.2;
    const tgHead = Y[3]! + 1.3;
    const royalHead = Y[4]! + 0.8;
    const [rLow, rTop, rTg] = r;
    // the mast in three spars, each overlapping the one below at its doubling
    items.push(spar(P(yd - 0.4), P(cap), rLow, "white", 10), spar(P(top + 0.05), P(tmHead), rTop, "white", 8), spar(P(cross - 0.1), P(truck + 0.1), rTg, "mast", 6));
    items.push(blk(ax(top) - 2.3, ax(top) + 0.3, -topHw, topHw, top - 0.22, top, "black", "tops"));
    items.push(blk(ax(cap) - 0.4, ax(cap) + 0.45, -0.42, 0.42, cap - 0.05, cap + 0.28, "white", "mast caps"));
    items.push(blk(ax(cross) - 1.3, ax(cross) + 0.25, -topHw * 0.62, topHw * 0.62, cross - 0.16, cross, "black", "crosstrees"));
    items.push(blk(ax(tmHead) - 0.32, ax(tmHead) + 0.3, -0.3, 0.3, tmHead - 0.05, tmHead + 0.22, "white", "mast caps"));
    // the fife rail round the foot
    items.push(blk(ax(yd) + 0.9, ax(yd) + 1.12, -1.1, 1.1, yd - 0.05, yd + 0.85, "teak", "fife rails"));
    for (const sd of [1, -1]) items.push(blk(ax(yd) - 0.9, ax(yd) + 0.9, sd > 0 ? 0.9 : -1.1, sd > 0 ? 1.1 : -0.9, yd - 0.05, yd + 0.85, "teak", "fife rails"));
    // the yards: slung on the mast, the sails hanging from them down to the yard below
    const radius = (y: number): number => (y <= cap ? rLow : y <= tmHead ? rTop : rTg);
    const sails: Sail[] = [];
    yards.forEach(([, len], i) => {
      const y = Y[i]!;
      const half = len / 2;
      const yr = Math.max(0.08, (half - 0.4) * 0.025);
      if (i >= first) {
        const y0 = i === 0 ? yd + 2.8 : Y[i - 1]!;
        const off = Math.max(radius(y0), radius(y - 0.2)) + 0.15;
        const w1 = half - 0.4;
        const w0 = i === 0 ? w1 * 1.04 : yards[i - 1]![1] / 2 - 0.7;
        sails.push({ kind: "square", y: [y0, y - 0.1], w: [w0, w1], off });
        items.push({ k: "rod", a: [ax(y), y, 0], b: [ax(y) + off - 0.05, y, 0], r: 0.1, mat: "black", n: 4, name: "slings" });
      } else {
        const off = radius(y) + 0.1;
        items.push(spar([ax(y) + off, y, -half], [ax(y) + off, y, half], yr, "spar", 5));
        items.push({ k: "rod", a: [ax(y), y, 0], b: [ax(y) + off, y, 0], r: 0.1, mat: "black", n: 4, name: "slings" });
      }
    });
    // the standing rigging: lower shrouds to deadeyes abreast and abaft the mast, with ratlines
    for (const sd of [1, -1]) {
      const head: Vec3 = [ax(top - 0.4), top - 0.4, sd * rLow * 0.8];
      const fs = Array.from({ length: nShrouds }, (_, k) => deadeye(u - 0.2 - k * 0.85, sd));
      for (const f of fs) items.push(rope(f, head, 0.045));
      items.push(...ratlines(fs[0]!, head, fs[fs.length - 1]!, head, fs[0]![1] + 0.8, top - 1.8, 0.75));
      // topmast shrouds to the top's rim, the futtocks under it
      const th: Vec3 = [ax(cross - 0.2), cross - 0.2, sd * rTop * 0.8];
      const tf = [0, 1, 2].map((k): Vec3 => [ax(top) - 0.1 - k * 0.75, top, sd * (topHw - 0.12)]);
      for (const f of tf) items.push(rope(f, th, 0.035));
      items.push(...ratlines(tf[0]!, th, tf[2]!, th, top + 0.7, cross - 1.5, 0.7));
      items.push(rope([ax(top) - 0.6, top - 0.15, sd * (topHw - 0.15)], [ax(top - 2.4), top - 2.4, sd * rLow * 0.9], 0.04));
      // topgallant shrouds to the crosstrees' ends
      for (const du of [0.1, -0.9]) items.push(rope([ax(cross) + du, cross - 0.05, sd * (topHw * 0.62 - 0.08)], [ax(tgHead), tgHead, sd * rTg * 0.7], 0.03));
      // the backstays: topmast (two), topgallant, royal (and skysail) to the side abaft the shrouds
      const heads = [tmHead - 1.3, tmHead - 1.3, tgHead, royalHead, ...(yards.length > 5 ? [Y[5]! + 0.6] : [])];
      heads.forEach((h, k) => items.push(rope(deadeye(u - 0.2 - (nShrouds + 0.4 + k) * 0.85, sd), [ax(h), h, sd * rTop * 0.6], 0.035)));
    }
    const heads = { top: P(top - 0.3), topmast: P(tmHead - 1.25), tgallant: P(tgHead), royal: P(royalHead), truck: P(truck - 0.3) };
    return { mast: { u, y: [yd, truck], r: 0.1, rake, sails }, head: (n) => heads[n], axis: ax };
  };

  // the masts, measured off the side photographs (fractions of the hull from the stem 0.336, 0.593, 0.813)
  const fore = rig(43.0, 35.2, 0.9, [[0.3, 22.6], [0.41, 20.2], [0.57, 18], [0.73, 14.2], [0.87, 11]], 0, [0.4, 0.28, 0.18], 2.2, 4);
  const main = rig(26.3, 39.5, 1.2, [[0.28, 23.8], [0.38, 21.3], [0.53, 18.9], [0.68, 14.9], [0.81, 11.6], [0.92, 8.8]], 0, [0.42, 0.29, 0.19], 2.4, 5);
  const mizzen = rig(12.2, 27.6, 1.4, [[0.32, 18.3], [0.43, 16.5], [0.59, 14.3], [0.75, 11], [0.89, 8.5]], 1, [0.34, 0.24, 0.15], 1.8, 3);
  // the spanker on the mizzen, its boom over the poop and out past the taffrail
  const boom = deck(5) + 2.1;
  const gaff = mizzen.head("top")[1] - 0.4;
  const mizzenMast: Mast = { ...mizzen.mast, sails: [...mizzen.mast.sails, { kind: "gaff", y: [boom, gaff], len: 13.9, head: 9 }] };

  // bowsprit, jib-boom and flying jib-boom on one line, steeved 14 degrees, out of the bow over the stem head
  const s0 = L - 3.2;
  const y0 = deck(s0) - 0.3;
  const bs = (u: number): Vec3 => [u, y0 + (u - s0) * 0.25, 0];
  items.push(spar(bs(s0), bs(L + 6.8), 0.38, "white", 10), spar(bs(L + 2), bs(L + 14.8), 0.24, "mast", 8), spar(bs(L + 13), bs(L + 19.3), 0.15, "mast", 6));
  items.push(blk(L + 6.55, L + 6.95, -0.36, 0.36, bs(L + 6.75)[1] - 0.42, bs(L + 6.75)[1] + 0.45, "white", "bowsprit cap"));
  // the dolphin striker under the cap, the martingale stays to the booms' ends and its back ropes to the bow
  const striker: Vec3 = [L + 6.3, bs(L + 6.7)[1] - 3, 0];
  items.push(spar([L + 6.7, bs(L + 6.7)[1] - 0.3, 0], striker, 0.1, "black", 5));
  items.push(rope(striker, bs(L + 14.7), 0.05), rope(striker, bs(L + 19.2), 0.04));
  for (const sd of [1, -1]) {
    const ub = L - 2.6;
    const yb = deck(ub) - 0.7;
    items.push(rope(striker, [ub, yb, sd * (side(ub, yb) + 0.02)], 0.05));
    // the bowsprit shrouds
    items.push(rope(bs(L + 5), [ub, yb + 0.3, sd * (side(ub, yb + 0.3) + 0.02)], 0.06));
  }
  // the bobstays from the cap and the bowsprit to the cutwater
  for (const [ub, y] of [[L + 6.5, 7.6], [L + 3.6, 8.6]] as const) items.push(rope(bs(ub), [stem(y) - 0.15, y, 0], 0.07));
  // the head stays: fore stay, fore topmast stay, inner and outer jib stays, flying jib stay; their jibs set on them
  const head = (from: Vec3, to: Vec3): Item => rope(from, to, 0.05);
  items.push(head(fore.head("top"), bs(L + 0.6)));
  const jibs: ReadonlyArray<readonly [Vec3, Vec3, number, number, number]> = [
    // [masthead, boom point, head fraction, clew u, clew height over the forecastle deck]
    [fore.head("topmast"), bs(L + 6.6), 0.7, L - 5.6, 2.3],
    [fore.head("topmast"), bs(L + 11), 0.74, L - 3, 3.8],
    [fore.head("tgallant"), bs(L + 14.6), 0.76, L + 0.6, 5.8],
    [fore.head("royal"), bs(L + 19.1), 0.78, L + 4.2, 8.2],
  ];
  for (const [mh, bp, f, cu, cy] of jibs) {
    items.push(head(mh, bp));
    const along = (t: number): readonly [number, number] => [bp[0] + (mh[0] - bp[0]) * t, bp[1] + (mh[1] - bp[1]) * t];
    items.push({ k: "plate", pts: [along(0.03), along(f), [cu, deck(L) + cy]], z: 0, t: 0.09, mat: "sail", name: "jibs" });
  }
  // the stays between the masts: each masthead to the next mast forward
  items.push(head(main.head("top"), [fore.axis(deck(43)) + 1.2, deck(44.2) + 0.9, 0]), head(main.head("topmast"), fore.head("top")), head(main.head("tgallant"), fore.head("topmast")), head(main.head("royal"), fore.head("tgallant")), head(main.head("truck"), fore.head("royal")));
  items.push(head(mizzen.head("top"), [main.axis(deck(26.3)) - 0.6, deck(26.3) + 2.5, 0]), head(mizzen.head("topmast"), main.head("top")), head(mizzen.head("tgallant"), main.head("topmast")), head(mizzen.head("royal"), main.head("tgallant")));

  // the hull's paint: the gilt line along the sheer, the scrollwork at the bow's trailboards and on the counter
  const line = (pts: ReadonlyArray<readonly [number, number]>, w: number, name: string): Item => ({ k: "hullLine", pts: pts.filter(([u, y]) => side(u, y) > 0.2 && g.keel(cl(u)) < y - 0.3), w, mat: "gilt", name });
  const sheerPts: Array<readonly [number, number]> = [];
  for (let u = 0.6; u < L; u += 1.6) sheerPts.push([u, sheer(u) - 0.45]);
  items.push(line(sheerPts, 0.16, "gilt line"));
  /** A band of scrollwork from u0 to u1 between two gilt borders `lo` and `hi` over the sheer, a running scroll between them. */
  const scroll = (u0: number, u1: number, lo: number, hi: number, turns: number, name: string): Item[] => {
    const n = Math.round((u1 - u0) / 0.45);
    const us = Array.from({ length: n + 1 }, (_, k) => u0 + ((u1 - u0) * k) / n);
    const amp = (hi - lo) * 0.32;
    return [
      line(us.map((u) => [u, sheer(u) + lo] as const), 0.14, name),
      line(us.map((u) => [u, sheer(u) + hi] as const), 0.14, name),
      line(us.map((u, k) => [u, sheer(u) + (lo + hi) / 2 + amp * Math.sin((k / n) * Math.PI * 2 * turns)] as const), 0.17, name),
    ];
  };
  items.push(...scroll(L - 9, L, 0.15, 1.25, 4, "bow scrollwork"));
  items.push(...scroll(0.3, 7.5, 0.1, 1.0, 3, "stern scrollwork"));
  // Nannie under the bowsprit: her body along the stem head, her head forward, her arm reaching out
  const fy = deck(L) - 0.35;
  items.push({ k: "plate", pts: [[stem(fy - 2.7) - 0.3, fy - 2.7], [stem(fy - 2.5) + 0.25, fy - 2.5], [stem(fy - 1.4) + 0.7, fy - 1.2], [stem(fy - 0.5) + 0.85, fy - 0.35], [stem(fy) + 0.3, fy], [stem(fy) - 0.5, fy]], z: 0, t: 0.7, mat: "white", name: "figurehead" });
  items.push({ k: "cyl", u: stem(fy - 0.4) + 0.75, y: [fy - 0.55, fy + 0.05], r: 0.27, mat: "white", n: 8, name: "figurehead" });
  for (const sd of [1, -1]) items.push({ k: "rod", a: [stem(fy - 1.0) + 0.5, fy - 0.9, sd * 0.3], b: [stem(fy - 1.0) + 1.6, fy - 0.55, sd * 0.45], r: 0.09, mat: "white", n: 5, name: "figurehead" });

  // decks: houses, hatches, capstan, catheads and anchors, the wheel, skylight and companion on the poop
  const poop = deck(5);
  const fc = deck(L - 6);
  items.push(
    { k: "tier", u: [33.6, 41.3], y: [deck(37) - 0.1, deck(37) + 2.1], hw: 2.2, mat: "teak", top: "white", windows: [{ y: 0.9, h: 0.6, w: 0.6, pitch: 1.5 }], name: "forward deckhouse" },
    { k: "tier", u: [16.8, 24.6], y: [deck(21) - 0.1, deck(21) + 2.1], hw: 2.3, mat: "teak", top: "white", windows: [{ y: 0.9, h: 0.6, w: 0.6, pitch: 1.5 }], name: "after deckhouse" },
    { k: "cyl", u: 35, z: 1, y: [deck(37) + 2.0, deck(37) + 3.1], r: 0.2, mat: "black", name: "galley chimney" },
    blk(28.6, 32.4, -1.7, 1.7, deck(30) - 0.05, deck(30) + 0.55, "teak", "hatches"), blk(28.75, 32.25, -1.55, 1.55, deck(30) + 0.5, deck(30) + 0.63, "black", "hatches"),
    blk(45.4, 48, -1.3, 1.3, deck(47) - 0.05, deck(47) + 0.55, "teak", "hatches"), blk(45.55, 47.85, -1.15, 1.15, deck(47) + 0.5, deck(47) + 0.63, "black", "hatches"),
    blk(13.8, 15.8, -1.1, 1.1, deck(15) - 0.05, deck(15) + 0.5, "teak", "hatches"),
    { k: "cyl", u: 58.6, y: [fc - 0.05, fc + 0.85], r: 0.42, mat: "teak", n: 10, name: "capstan" },
    { k: "cyl", u: 58.6, y: [fc + 0.85, fc + 1.0], r: 0.6, mat: "teak", n: 10, name: "capstan" },
    { k: "cyl", u: 56.6, z: 0.9, y: [fc - 0.05, fc + 0.7], r: 0.18, mat: "black", name: "bitts" },
    { k: "cyl", u: 56.6, z: -0.9, y: [fc - 0.05, fc + 0.7], r: 0.18, mat: "black", name: "bitts" },
    { k: "anchors", u: L - 6.2, y: deck(L - 6.2) - 1.6, s: 1.3 },
    blk(4.6, 7.2, -1, 1, poop - 0.05, poop + 0.75, "teak", "skylight"), blk(4.75, 7.05, -0.85, 0.85, poop + 0.7, poop + 0.82, "glass", "skylight"),
    blk(7.6, 8.8, -0.65, 0.65, poop - 0.05, poop + 1.05, "teak", "companion"),
    blk(1.3, 2.3, -0.35, 0.35, deck(1.8) - 0.05, deck(1.8) + 1.05, "teak", "wheel box"),
    { k: "rod", a: [2.25, deck(1.8) + 1.3, 0], b: [2.42, deck(1.8) + 1.3, 0], r: 0.8, mat: "teak", n: 12, name: "wheel" },
    { k: "cyl", u: 3.6, y: [deck(3.6) - 0.05, deck(3.6) + 1.15], r: 0.25, mat: "gilt", n: 8, name: "binnacle" },
  );
  for (const sd of [1, -1]) {
    const u = L - 6.2;
    const zs = side(u, fc);
    items.push(blk(u - 0.35, u + 0.35, sd > 0 ? zs - 0.3 : -zs - 0.9, sd > 0 ? zs + 0.9 : -zs + 0.3, fc - 0.3, fc + 0.45, "black", "catheads"));
  }
  // the boats on chocks on the after house under their davits
  const hy = deck(21) + 2.1;
  items.push({ k: "boats", at: [20.7], z: 1.15, y: hy + 0.85, len: 6.4, r: 0.7, mat: "white", name: "boats" });
  for (const sd of [1, -1]) {
    for (const du of [-1.8, 1.8]) items.push(blk(20.7 + du - 0.15, 20.7 + du + 0.15, sd * 1.15 - 0.55, sd * 1.15 + 0.55, hy - 0.02, hy + 0.32, "teak", "boat chocks"));
    for (const du of [-2.9, 2.9]) {
      const u = 20.7 + du;
      items.push({ k: "rod", a: [u, hy - 0.1, sd * 2.1], b: [u, hy + 2.4, sd * 2.1], r: 0.08, mat: "white", n: 5, name: "davits" });
      items.push({ k: "rod", a: [u, hy + 2.35, sd * 2.1], b: [u - Math.sign(du) * 0.2, hy + 2.75, sd * 1.15], r: 0.08, mat: "white", n: 5, name: "davits" });
      items.push(rope([u - Math.sign(du) * 0.2, hy + 2.7, sd * 1.15], [u - Math.sign(du) * 0.4, hy + 1.3, sd * 1.15], 0.03));
    }
  }

  return {
    kind: "sail",
    hull,
    livery: { hull: "#17191c", bottom: "#b08d3e", deck: "#a07a52", house: "#f2f0ea", sail: "#efe9da", spar: "#1d1f22", mast: "#b98a52", teak: "#7a4f2c", gilt: "#d6b45a", white: "#f1efe8", rope: "#2e2720" },
    items: detailed([
      { k: "rig", stays: false, masts: [fore.mast, main.mast, mizzenMast] },
      { k: "bulwark", u: BUL, h: 1.25, t: 0.2, mat: "black", inner: "white", cap: "teak" },
      { k: "edgeRail", u: [0.3, 10], h: 1, pitch: 0.9, mat: "white", name: "poop rail" },
      { k: "edgeRail", u: [55.3, L - 0.8], h: 0.95, pitch: 0.9, mat: "white", name: "forecastle rail" },
      ...items,
      ...feet,
    ]),
  };
}

export function bluenoseSpec(): ShipSpec {
  const L = 43.6;
  const D = 5.2;
  return {
    kind: "sail",
    hull: { fine: true, length: L, beam: 8.2, depth: D, draft: 4.8, bow: "clipper", stern: "transom", section: "keel", entry: 0.4, run: 0.3, transom: 0.4, rake: 0.1, sheer: [0.6, 1.6], boot: 0.15, stripe: 0.25, screws: 0 },
    livery: { hull: "#1d2024", stripe: "#f2f0ea", bottom: "#b02a22", boot: "#f2f0ea", deck: "#a07a52", house: "#f2f0ea", sail: "#efe9da", spar: "#c9a14a" },
    items: detailed([
      { k: "tier", u: [6, 10], y: [D - 0.1, D + 0.9], hw: 1.6, mat: "white", name: "after house" },
      {
        k: "rig", bowsprit: { len: 7, rise: 1.2 },
        masts: [
          { u: 29, y: [D, D + 31], r: 0.3, sails: [{ kind: "gaff", y: [D + 1.6, D + 20], len: 11, head: 8 }, { kind: "gaff", y: [D + 21, D + 29], len: 6, head: 0.4 }, { kind: "jib", y: [D + 2, D + 21], tack: L + 6, len: 9 }, { kind: "jib", y: [D + 1.4, D + 16], tack: L - 0.5, len: 6 }] },
          { u: 16, y: [D, D + 35], r: 0.32, sails: [{ kind: "gaff", y: [D + 1.6, D + 24], len: 16, head: 11 }, { kind: "gaff", y: [D + 25, D + 33], len: 7, head: 0.4 }] },
        ],
      },
      { k: "bulwark", u: [0, L], h: 0.6, t: 0.15, mat: "black" },
      ...[29, 16].flatMap((u) => shrouds(u, D + 28, D, 3.8, 3)),
      ...[20, 23, 26].map((u): Item => ({ k: "boats", at: [u], z: 0, y: D + 0.3, len: 4.4, r: 0.55, mat: "wood", name: "dories" })),
      { k: "cyl", u: 3, z: 0, y: [D + 0.6, D + 1.4], r: 0.4, mat: "wood", name: "wheel" },
      { k: "anchors", u: L - 2.6, y: D - 0.4, s: 1 },
      { k: "mooring", at: [2, L - 3], hw: 3.4, s: 0.35, winch: true },
    ]),
  };
}

/**
 * SS Great Britain as preserved in Bristol, in her 1843 six-mast rig: masts 1 and 3-6
 * fore-and-aft (gaff) rigged, the second square-rigged with three yards, one round funnel
 * between masts 2 and 3. Positions are measured off the 1843 elevation in
 * assets/ship-ss-great-britain (11.4 px/m): masts at 81.4, 68.3, 51.1, 39.2, 25.4 and 12.6 m
 * from the stern, the funnel at 57 m. The black hull carries a white band with painted
 * gunports between two thin lines, the gilt trailboards at the bow and the stern carving;
 * the flush deck its buff deckhouses with white roofs, saloon skylights and boats in davits.
 */
export function greatBritainSpec(): ShipSpec {
  const L = 98;
  const D = 9.8;
  const hull: HullForm = { fine: true, length: L, beam: 15.4, depth: D, draft: 5.5, bow: "clipper", stern: "cruiser", section: "round", entry: 0.3, run: 0.22, rake: 0.07, sheer: [0.8, 1.6], boot: 0, stripe: 0, screws: 1 };
  const g = hullGeometry(hull);
  const dk = (u: number): number => g.deck(u);
  const hb = (u: number): number => g.halfBeam(u, g.deck(u));
  const spacedPts = (a: number, b: number, pitch: number): number[] => {
    const n = Math.max(1, Math.round((b - a) / pitch));
    return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  };
  // a line painted along the sheer, `off` below the deck edge
  const band = (u0: number, u1: number, off: number, w: number, mat: string, name: string): Item =>
    ({ k: "hullLine", pts: spacedPts(u0, u1, 3).map((u) => [u, dk(u) - off] as const), w, mat, name });
  // the trailboard on the bow, from L - 12 to the stem, rising from `off0` to `off1` below the deck edge
  const trail = (off0: number, off1: number, w: number, mat: string, name: string): Item =>
    ({ k: "hullLine", pts: spacedPts(L - 12, L - 1.4, 0.8).map((u) => [u, dk(u) - off0 + ((off0 - off1) * (u - L + 12)) / 10.6] as const), w, mat, name });
  // the band's painted gunports: white panels with the black hull showing between them
  const portPitch = 2.6;
  const portW = 0.7;
  const panels: Item[] = [];
  for (let u = 7; u + portPitch <= L - 12; u += portPitch) {
    const a = u + portW / 2;
    const b = u + portPitch - portW / 2;
    panels.push({ k: "hullLine", pts: [[a, dk(a) - 1.5], [b, dk(b) - 1.5]], w: 1.1, mat: "white", name: "painted band" });
  }
  // the bowsprit's centreline height at u (the kit's: from the deck at L - 1 to len 13, rise 6)
  const sprit = (u: number): number => dk(L) + (6 * (u - (L - 1))) / 14;
  const masts: Array<[number, number]> = [[81.4, 31], [68.3, 35], [51.1, 29], [39.2, 29], [25.4, 29], [12.6, 26]];
  // shrouds from below each masthead to the chain plates inside the bulwark
  const shroudsOf = (u: number, top: number, n: number): Item[] => Array.from({ length: n }, (_, k) => k).flatMap((k): Item[] => {
    const uf = u - 0.6 - k * 0.7;
    return [1, -1].map((sd): Item => rod([u, top - k * 0.6, 0], [uf, dk(uf) + 0.3, sd * (hb(uf) - 0.4)], 0.03, "rope", "shroud"));
  });
  // a boat hanging in its two davits outboard of the bulwark
  const davitBoat = (u: number, len: number, r: number): Item[] => {
    const zi = hb(u) - 0.5;
    const zb = hb(u) + 1.05;
    const yb = dk(u) + 2.2;
    return [
      { k: "boats", at: [u], z: zb, y: yb, len, r, mat: "white", name: "boats" },
      ...[1, -1].flatMap((sd): Item[] => [-1, 1].map((e): Item => ({ k: "box", u: [u + (e * len) / 2 - 0.08, u + (e * len) / 2 + 0.08], z: [sd * zb - 0.26, sd * zb + 0.26], y: [yb - 0.26, yb + 0.26], mat: "white", name: "boat stem" }))),
      ...[1, -1].flatMap((sd): Item[] => [-1, 1].flatMap((e): Item[] => {
        const ud = u + e * len * 0.32;
        return [
          rod([ud, dk(ud) - 0.1, sd * zi], [ud, yb + 1.8, sd * zi], 0.1, "black", "davit"),
          rod([ud, yb + 1.8, sd * zi], [ud, yb + 2.05, sd * zb], 0.1, "black", "davit"),
          rod([ud, yb + 2.05, sd * zb], [ud, yb + r * 0.8, sd * zb], 0.03, "rope", "falls"),
        ];
      })),
    ];
  };
  // a companionway: a buff house under a white hood
  const companion = (u0: number, u1: number, hw: number, h: number): Item[] => [
    { k: "tier", u: [u0, u1], y: [dk((u0 + u1) / 2) - 0.1, D + h], hw, mat: "buff", top: "white", lip: 0, windows: [{ y: h * 0.35, h: h * 0.3, w: 0.5, pitch: 1.4 }], name: "companionway" },
    { k: "canopy", u: [u0 - 0.1, u1 + 0.1], hw: hw + 0.12, y: D + h, h: 0.5, mat: "white", name: "companionway hood" },
  ];
  // a saloon skylight: a low buff coaming with its glazed top
  const skylight = (u0: number, u1: number, hw: number): Item[] => [
    { k: "tier", u: [u0, u1], y: [dk((u0 + u1) / 2) - 0.1, D + 0.9], hw, mat: "buff", top: "white", lip: 0.08, name: "saloon skylight" },
    { k: "box", u: [u0 + 0.3, u1 - 0.3], z: [-hw + 0.3, hw - 0.3], y: [D + 0.95, D + 1.25], mat: "glass", name: "skylight glazing" },
  ];
  return {
    kind: "sail",
    hull,
    livery: { hull: "#1d2024", stripe: "#f2f0ea", bottom: "#3a3e42", deck: "#b39a74", house: "#f2f0ea", buff: "#dcc08a", gold: "#c9a14a", sail: "#efe9da", spar: "#dcc08a", funnel: "#1d2024" },
    items: detailed([
      // the painted band, its two lines and the gilt work at the bow and the stern
      ...panels,
      band(5, L - 12, 2.2, 0.12, "white", "band line"),
      band(5, L - 12, 0.8, 0.1, "gold", "band line"),
      trail(1.55, 0.95, 1.3, "white", "trailboard"),
      trail(0.8, 0.2, 0.18, "gold", "trailboard gilt"),
      trail(2.3, 1.7, 0.18, "gold", "trailboard gilt"),
      { k: "hullLine", pts: spacedPts(0.6, 4.5, 0.8).map((u) => [u, dk(u) - 1 - (u - 0.6) * 0.05] as const), w: 0.9, mat: "gold", name: "stern carving" },
      { k: "plate", pts: [[L - 1.4, dk(L) - 2], [L + 0.2, dk(L) - 0.6], [L + 0.3, dk(L) + 1.9], [L - 0.6, dk(L) + 2.4], [L - 1.2, dk(L) + 1]], z: 0, t: 0.6, mat: "gold", name: "stem crest" },
      // the funnel on the engine-room casing
      { k: "funnel", u: [55.4, 58.6], hw: 1.6, y: [D - 0.1, D + 12], rake: 0, round: true, bands: [["funnel", 0.5], ["black", 0.53], ["funnel", 1]], name: "funnel" },
      { k: "tier", u: [53.8, 62.2], y: [D - 0.1, D + 1.8], hw: 2.6, mat: "buff", top: "white", lip: 0.1, windows: [{ y: 0.7, h: 0.6, w: 0.6, pitch: 1.6 }], name: "engine-room casing" },
      ...companion(63.4, 66.4, 1.4, 2),
      ...companion(43.6, 47.2, 1.5, 2),
      ...companion(19, 22, 1.4, 2),
      ...skylight(27.5, 36.5, 1.5),
      ...skylight(14.6, 18.4, 1.3),
      ...skylight(5.5, 10.5, 1.4),
      { k: "box", u: [72, 76], z: [-1.6, 1.6], y: [dk(74) - 0.1, dk(74) + 0.7], mat: "buff", name: "fore hatch" },
      { k: "box", u: [72.3, 75.7], z: [-1.3, 1.3], y: [dk(74) + 0.7, dk(74) + 0.9], mat: "wood", name: "hatch cover" },
      // the wheel aft
      { k: "box", u: [2.6, 3.4], z: [-0.25, 0.25], y: [dk(3) - 0.1, dk(3) + 1], mat: "wood", name: "wheel box" },
      rod([3, dk(3) + 1.3, -0.3], [3, dk(3) + 1.3, 0.3], 0.75, "wood", "wheel"),
      {
        k: "rig", bowsprit: { len: 13, rise: 6 },
        masts: [
          { u: 81.4, y: [D, D + 31], r: 0.42, sails: [{ kind: "gaff", y: [D + 2.4, D + 18], len: 7.6, head: 5.6 }] },
          squareMast(68.3, D, D + 35, [11, 8.6, 6.2], 0.46),
          ...masts.slice(2).map(([u, h]): Mast => ({ u, y: [D, D + h], r: 0.38, sails: [{ kind: "gaff", y: [D + 2.4, D + h - 11], len: 8, head: 5.8 }] })),
        ],
      },
      // the jibs set on the bowsprit (the kit's jib tacks at deck height, below this steep bowsprit):
      // the outer one's luff on the fore stay to the bowsprit's end, the inner one's on its own stay
      { k: "plate", pts: [[L + 12.4, sprit(L + 12.4) - 0.1], [88.8, D + 24.7], [L - 3, dk(L - 3) + 3.2]], z: 0, t: 0.04, mat: "sail", name: "outer jib" },
      { k: "plate", pts: [[L + 6, sprit(L + 6) - 0.1], [82, D + 19], [L - 8, dk(L - 8) + 2.6]], z: 0.3, t: 0.04, mat: "sail", name: "inner jib" },
      rod([81.4, D + 19.3, 0], [L + 6, sprit(L + 6), 0], 0.04, "rope", "inner stay"),
      // the main mast's white lower mast with its black bands and black doubling
      { k: "cyl", u: 68.3, z: 0, y: [dk(68.3) - 0.1, D + 15], r: 0.52, n: 10, mat: "white", name: "main mast paint" },
      ...[D + 3.5, D + 8, D + 12.5].map((y): Item => ({ k: "cyl", u: 68.3, z: 0, y: [y, y + 0.35], r: 0.58, n: 10, mat: "black", name: "mast band" })),
      { k: "cyl", u: 68.3, z: 0, y: [D + 14.9, D + 22], r: 0.5, n: 10, mat: "black", name: "main mast doubling" },
      { k: "bulwark", u: [0, L], h: 1.0, t: 0.25, mat: "black" },
      // the iron railing standing on the bulwark
      { k: "edgeRail", u: [4, L - 6], h: 1.9, pitch: 2.6, mat: "black", name: "railing" },
      ...masts.flatMap(([u, h], i): Item[] => shroudsOf(u, D + h - 4, i < 2 ? 3 : 2)),
      ...davitBoat(31, 7, 0.8),
      ...davitBoat(60.5, 7, 0.8),
      ...davitBoat(9, 6, 0.75),
      { k: "vents", at: [[52.8, 3], [52.8, -3], [63, 3.2], [63, -3.2]], h: 1.6, r: 0.4, cowl: true, mat: "white", name: "ventilators" },
      { k: "anchors", u: L - 4.5, y: D - 2.2, s: 1.6 },
      { k: "mooring", at: [3, L - 6], hw: 6.6, s: 0.55, winch: true },
    ]),
  };
}

// ---------------------------------------------------------------------------
// traditional sailing craft

export function thamesBargeSpec(): ShipSpec {
  const L = 25;
  const D = 2;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 6, depth: D, draft: 1, bow: "plumb", stern: "transom", section: "flat", entry: 0.22, run: 0.12, transom: 0.7, sheer: [0.3, 0.6], boot: 0.1, stripe: 0.3, rudder: true, screws: 0, fine: true },
    livery: { hull: "#1d2024", stripe: "#c23128", bottom: "#1d2024", boot: "#c9a14a", deck: "#7d6a55", house: "#7d6a55", sail: "#9a4a2a", spar: "#5a3b20", wood: "#4a3420" },
    items: [
      { k: "bulwark", u: [0, L], h: 0.45, t: 0.12, mat: "wood" },
      { k: "strakes", u: [0, L], y: [0.6, 1.0, 1.4], w: 0.04, mat: "black", name: "plank seams" },
      { k: "box", u: [6, 19], z: [-2.4, 2.4], y: [D - 0.1, D + 0.6], mat: "house", name: "hatch coamings" },
      { k: "hatches", u: [6.2, 18.8], n: 2, hw: 2.25, y: D + 0.6, h: 0.25, gap: 0.6, mat: "black", ridge: 0.15, ribs: 3, name: "hatch covers" },
      ...[1, -1].flatMap((sd): Item[] => [
        { k: "plate", pts: [[9, 0.2], [13, 0.4], [13, D + 0.3], [9, D + 0.3]], z: sd * 3.1, t: 0.15, mat: "wood", name: sd > 0 ? "starboard leeboard" : "port leeboard" },
        rod([11, D + 0.5, sd * 2.6], [11, D + 0.5, sd * 1.6], 0.2, "wood", "leeboard winch"),
      ]),
      // the windlass on the fore deck, the wheel and its shelter aft, the cabin skylight, the boat on its davits
      rod([22.6, D + 0.4, -1.2], [22.6, D + 0.4, 1.2], 0.25, "wood", "windlass"),
      { k: "box", u: [2.6, 4.6], z: [-1.6, 1.6], y: [D - 0.05, D + 0.5], mat: "wood", name: "cabin top" },
      { k: "box", u: [3.2, 4], z: [-0.6, 0.6], y: [D + 0.5, D + 0.8], mat: "glass", name: "skylight" },
      { k: "cyl", u: 1.8, z: 0, y: [D, D + 0.9], r: 0.08, mat: "wood", name: "wheel post" },
      { k: "cyl", u: 1.8, z: 0, y: [D + 0.9, D + 1.0], r: 0.4, mat: "wood", name: "wheel" },
      { k: "cyl", u: 5, z: 1.6, y: [D + 0.5, D + 1.3], r: 0.1, mat: "black", name: "cabin chimney" },
      { k: "boats", at: [-1.4], z: 0, y: D + 0.4, len: 3.6, r: 0.5, mat: "wood", name: "tender" },
      { k: "anchors", u: L - 0.8, y: D - 0.3, s: 0.6 },
      {
        k: "rig", bowsprit: { len: 3, rise: 0.6 },
        masts: [
          { u: 17, y: [D, D + 24], r: 0.25, sails: [{ kind: "sprit", y: [D + 0.8, D + 14], len: 10, head: 8 }, { kind: "gaff", y: [D + 15, D + 22], len: 5, head: 0.3 }, { kind: "jib", y: [D + 1, D + 13], tack: L + 2.6, len: 6 }] },
          { u: 1, y: [D, D + 8], r: 0.12, sails: [{ kind: "sprit", y: [D + 1, D + 7], len: 3, head: 2.6 }] },
        ],
      },
      // the sprit, the vangs from its peak and the mast's shrouds
      rod([17, D + 1.4, 0.3], [7.4, D + 15, 0.3], 0.14, "spar", "sprit"),
      ...[1, -1].map((sd): Item => rod([7.4, D + 15, 0.3], [5, D + 0.4, sd * 2.8], 0.025, "rope", "vang")),
    ],
  };
}

export function dhowSpec(): ShipSpec {
  const L = 20;
  const D = 3;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 6, depth: D, draft: 2.5, bow: "clipper", stern: "transom", section: "round", entry: 0.4, run: 0.25, transom: 0.6, rake: 0.18, sheer: [1.2, 1.4], poop: [5, 0.8], boot: 0.1, stripe: 0.3, screws: 0, fine: true },
    livery: { hull: "#a87a4a", stripe: "#f2f0ea", bottom: "#f2f0ea", boot: "#5a3b20", deck: "#8a5a33", sail: "#f2ead8", spar: "#5a3b20" },
    items: [
      { k: "strakes", u: [0, L], y: [1.4, 1.8, 2.2, 2.6, 3.0, 3.4], w: 0.035, mat: "spar", name: "plank seams" },
      { k: "bulwark", u: [0, L], h: 0.5, t: 0.12, mat: "wood" },
      { k: "rig", masts: [{ u: 12, y: [D, D + 15], r: 0.25, rake: -1.2, sails: [{ kind: "lateen", y: [D + 1.6, D + 19], len: 22, fwd: 9.5 }] }] },
      { k: "box", u: [1, 5], z: [-2.4, 2.4], y: [D + 0.7, D + 1.6], mat: "wood", name: "poop rail" },
      ...[1.4, 2.6, 3.8].flatMap((u): Item[] => [2.3, -2.3].map((z): Item => ({ k: "cyl", u, z, y: [D + 1.6, D + 2.2], r: 0.07, mat: "wood", name: "rail post" }))),
      { k: "box", u: [0.8, 5.2], z: [-2.5, 2.5], y: [D + 2.2, D + 2.35], mat: "wood", name: "poop rail top" },
      // the carved transom board, the rudder and its tiller lines, the crew's shelter, the water jars, the boat
      { k: "box", u: [-0.15, 0.1], z: [-1.6, 1.6], y: [D + 1.2, D + 2.8], mat: "spar", name: "transom board" },
      { k: "plate", pts: [[-0.6, 0.2], [0.2, 0.2], [0.2, D + 1.6], [-0.2, D + 1.6]], z: 0, t: 0.15, mat: "spar", name: "rudder" },
      ...[1, -1].map((sd): Item => rod([-0.1, D + 1.2, 0], [1, D + 1.2, sd * 2.3], 0.02, "rope", "rudder line")),
      { k: "canopy", u: [5.6, 8.4], hw: 1.6, y: D + 1.2, h: 0.8, mat: "sail", posts: "wood", name: "crew shelter" },
      ...[[14.4, 0.8], [14.4, -0.8], [15.4, 0]].map(([u, z]): Item => ({ k: "cyl", u: u!, z: z!, y: [D, D + 0.7], r: 0.3, mat: "red", name: "water jar" })),
      { k: "boats", at: [16.5], z: 0, y: D + 0.4, len: 3, r: 0.4, mat: "wood", name: "boat" },
      rod([12, D + 0.3, 0], [12, D + 0.3, 0.01], 0.4, "wood", "mast step"),
    ],
  };
}

export function junkSpec(): ShipSpec {
  const L = 30;
  const D = 3.5;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 7, depth: D, draft: 2.5, bow: "barge", stern: "transom", section: "round", entry: 0.18, run: 0.22, transom: 0.7, rake: 0.08, sheer: [2.4, 1.4], poop: [8, 1.6], boot: 0.1, stripe: 0.4, screws: 0, fine: true },
    livery: { hull: "#5a3b20", stripe: "#c23128", bottom: "#2b2d30", boot: "#2b2d30", deck: "#8a5a33", house: "#8a5a33", sail: "#a8452e", spar: "#3b2a1a" },
    items: [
      { k: "strakes", u: [0, L], y: [1.6, 2.1, 2.6, 3.1], w: 0.05, mat: "spar", name: "wales" },
      { k: "bulwark", u: [0, L], h: 0.6, t: 0.14, mat: "house" },
      // the stern cabin with its windows and its gallery, the wheelhouse roof and the lanterns
      { k: "tier", u: [1.5, 7], y: [D + 1.4, D + 3.2], hw: 2.4, mat: "house", top: "red", lip: 0.3, windows: [{ y: 0.6, h: 0.6, w: 0.5, pitch: 1 }], front: { y: 0.6, h: 0.6, w: 0.5, n: 4 }, name: "stern cabin" },
      { k: "rail", u: [1.8, 6.8], y: D + 3.2, hw: 2.4, h: 0.6, mat: "red", name: "cabin roof rail" },
      ...[2, 6.4].map((u): Item => ({ k: "cyl", u, z: 2.6, y: [D + 3.2, D + 3.7], r: 0.15, mat: "red", name: "lantern" })),
      // the painted eye on the bow, the great rudder, the windlass and the anchor
      { k: "marks", at: [], y: [D - 1.4, D - 0.6], s: 0.26, thruster: L - 1.8, eye: true, mat: "white", name: "bow eye" },
      { k: "plate", pts: [[-1.4, 0.4], [0.3, 0.2], [0.3, D + 2], [-0.6, D + 2]], z: 0, t: 0.2, mat: "spar", name: "rudder" },
      rod([0.2, D + 2.4, 0], [3, D + 2.6, 0], 0.08, "spar", "tiller"),
      rod([26, D + 0.6, -1.2], [26, D + 0.6, 1.2], 0.25, "spar", "windlass"),
      { k: "anchors", u: L - 1.2, y: D + 0.4, s: 0.9 },
      { k: "box", u: [10, 20], z: [-2.4, 2.4], y: [D - 0.05, D + 0.5], mat: "house", name: "hatch" },
      ...[11.6, 14.2, 16.8].map((u): Item => ({ k: "box", u: [u - 1.1, u + 1.1], z: [-2.2, 2.2], y: [D + 0.5, D + 0.7], mat: "spar", name: "hatch boards" })),
      {
        k: "rig", stays: false,
        masts: [
          { u: 25, y: [D, D + 14], r: 0.22, rake: -0.8, sails: [{ kind: "junk", y: [D + 1.6, D + 13], len: 7 }] },
          { u: 16, y: [D, D + 21], r: 0.3, sails: [{ kind: "junk", y: [D + 1.6, D + 20], len: 11 }] },
          { u: 6, y: [D + 1.4, D + 13], r: 0.18, sails: [{ kind: "junk", y: [D + 3.4, D + 12.4], len: 5.5 }] },
        ],
      },
      // the sheets fanning from the battens' ends to the deck aft of each mast
      ...[[16, 11, 20], [25, 7, 13], [6, 5.5, 12.4]].flatMap(([u, len, top]): Item[] => [0.35, 0.6, 0.85].map((f): Item => rod([u! - len!, D + 1.6 + (top! - 1.6) * f, 0], [u! - len! * 0.55, D + 0.8, 0], 0.02, "rope", "sheet"))),
    ],
  };
}

export function feluccaSpec(): ShipSpec {
  const L = 9;
  const D = 1;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 3, depth: D, draft: 0.6, bow: "clipper", stern: "transom", section: "round", entry: 0.45, run: 0.25, transom: 0.6, rake: 0.15, sheer: [0.3, 0.5], boot: 0.08, stripe: 0.15, screws: 0, fine: true },
    livery: { hull: "#f2f0ea", stripe: "#2a6fae", bottom: "#2a6fae", boot: "#1d2024", deck: "#a07a52", sail: "#f4efe2", spar: "#5a3b20", red: "#c23128" },
    items: [
      { k: "bulwark", u: [0, L], h: 0.18, t: 0.07, mat: "red" },
      { k: "strakes", u: [0.3, L - 0.3], y: [0.55, 0.7], w: 0.04, mat: "red", name: "painted bands" },
      { k: "rig", stays: false, masts: [{ u: 6, y: [D, D + 7], r: 0.1, sails: [{ kind: "lateen", y: [D + 0.6, D + 12], len: 14, fwd: 5 }] }] },
      rod([6, D + 6.8, 0], [L + 0.1, D + 0.1, 0], 0.015, "rope", "forestay"),
      ...[1, -1].map((sd): Item => rod([6, D + 6.6, 0], [5.4, D + 0.1, sd * 1.35], 0.012, "rope", "shroud")),
      // the cushioned benches round the cockpit, the awning poles, the rudder and its tiller
      ...[1, -1].map((sd): Item => ({ k: "box", u: [1.2, 5.2], z: sd > 0 ? [0.7, 1.3] : [-1.3, -0.7], y: [D - 0.05, D + 0.35], mat: "red", name: "bench" })),
      { k: "box", u: [0.8, 1.4], z: [-1.2, 1.2], y: [D - 0.05, D + 0.35], mat: "red", name: "stern bench" },
      ...[1, 5].flatMap((u): Item[] => [1.2, -1.2].map((z): Item => ({ k: "cyl", u, z, y: [D, D + 1.8], r: 0.03, mat: "wood", name: "awning pole" }))),
      { k: "box", u: [1, 5], z: [-1.25, 1.25], y: [D + 1.8, D + 1.84], mat: "canopy", name: "awning" },
      { k: "plate", pts: [[-0.4, 0.1], [0.15, 0.1], [0.15, D + 0.3], [-0.1, D + 0.3]], z: 0, t: 0.09, mat: "spar", name: "rudder" },
      rod([0, D + 0.4, 0], [1.4, D + 0.55, 0], 0.03, "spar", "tiller"),
      { k: "mooring", at: [L - 0.8], hw: 0.6, s: 0.15 },
    ],
  };
}

export function vikingSpec(): ShipSpec {
  const L = 23;
  const D = 1.6;
  return {
    kind: "sail", small: true,
    hull: { fine: true, length: L, beam: 5.2, depth: D, draft: 1, bow: "canoe", stern: "canoe", section: "vee", entry: 0.36, run: 0.36, rake: 0.14, sheer: [1.8, 2], boot: 0, stripe: 0.2, rudder: false },
    livery: { hull: "#8a5a33", stripe: "#5a3b20", bottom: "#3b2a1a", deck: "#a07a52", sail: "#b02a22", spar: "#5a3b20", yellow: "#e8bf2a", red: "#b02a22" },
    items: detailed([
      // the shields along the gunwale, the steering oar, the stem's dragon
      { k: "portholes", u: [6, 17], y: D - 0.05, pitch: 1.1, r: 0.42, mat: "yellow", name: "shields" },
      { k: "plate", pts: [[L - 0.3, D + 1.6], [L + 0.5, D + 2.6], [L + 0.1, D + 3.2], [L - 0.5, D + 2.2]], z: 0, t: 0.15, mat: "wood", name: "dragon head" },
      { k: "plate", pts: [[2.2, 0.3], [2.8, 0.3], [3.4, D + 1.2], [2.9, D + 1.2]], z: 2.5, t: 0.12, mat: "wood", name: "steering oar" },
      { k: "rig", stays: true, masts: [{ u: 11.5, y: [D, D + 11], r: 0.18, sails: [{ kind: "square", y: [D + 2.4, D + 10.4], w: [5.2, 5] }] }] },
      { k: "strakes", u: [0, L], y: [0.45, 0.75, 1.05, 1.35], w: 0.06, mat: "spar", name: "clinker lands" },
      // the oars run out through the oar ports, the shrouds, the sea chests the rowers sit on
      ...[7, 9, 11, 13, 15, 17].flatMap((u): Item[] => [1, -1].map((sd): Item => rod([u, D + 0.1, sd * 2.2], [u - 1.2, 0.6, sd * 5.2], 0.04, "wood", "oar"))),
      ...[7, 9, 11, 13, 15, 17].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [u - 0.4, u + 0.4], z: sd > 0 ? [1.2, 1.9] : [-1.9, -1.2], y: [D - 0.6, D - 0.2], mat: "wood", name: "sea chest" }))),
      ...shrouds(11.5, D + 10.6, D - 0.2, 2.3, 2),
      { k: "plate", pts: [[0.3, D + 1.6], [-0.4, D + 2.4], [-0.1, D + 2.8], [0.5, D + 2.1]], z: 0, t: 0.15, mat: "wood", name: "stern post" },
    ]),
  };
}

export function voyagingCanoeSpec(): ShipSpec {
  const L = 18.7;
  const D = 1.6;
  return {
    kind: "sail", small: true,
    hull: { fine: true, length: L, beam: 5.4, depth: D, draft: 0.75, twin: 1.4, bow: "canoe", stern: "canoe", section: "vee", entry: 0.36, run: 0.36, rake: 0.1, sheer: [0.8, 0.9], boot: 0, stripe: 0.3, rudder: false },
    livery: { hull: "#3b2a1a", stripe: "#c9a14a", bottom: "#1d2024", deck: "#3b2a1a", sail: "#d9c79a", spar: "#5a3b20", wood: "#8a6a3a" },
    items: detailed([
      { k: "box", u: [3, 15.7], z: [-2.7, 2.7], y: [D + 0.1, D + 0.3], mat: "wood", name: "deck platform" },
      ...[4, 7.6, 11.2, 14.8].map((u, i): Item => ({ k: "rod", a: [u, D + 0.05, -2.78], b: [u, D + 0.05, 2.78], r: 0.12, mat: "spar", name: `cross beam ${i + 1}` })),
      { k: "box", u: [7, 10], z: [-1.2, 1.2], y: [D + 0.3, D + 1.2], mat: "sail", name: "deck shelter" },
      { k: "rig", stays: false, masts: [
        { u: 12.4, y: [D, D + 9], r: 0.12, sails: [{ kind: "crabclaw", y: [D + 0.6, D + 11], len: 8, fwd: 2 }] },
        { u: 6.6, y: [D, D + 8], r: 0.11, sails: [{ kind: "crabclaw", y: [D + 0.6, D + 9.5], len: 7, fwd: 1.6 }] },
      ] },
      { k: "plate", pts: [[0.3, 0.4], [0.8, 0.4], [1.6, D + 1.4], [1.1, D + 1.4]], z: 2, t: 0.1, mat: "wood", name: "steering paddle" },
      { k: "strakes", u: [0, L], y: [1.1, 1.35], w: 0.05, mat: "stripe", name: "lashings" },
      { k: "rail", u: [3.4, 15.3], y: D + 0.3, hw: 2.6, h: 0.6, mat: "wood", name: "deck rail" },
      ...[12.4, 6.6].flatMap((u) => shrouds(u, D + 8.6, D + 0.3, 2.6, 2)),
      ...[[9, 0.6, "red"], [9.6, -0.6, "yellow"]].map(([u, z, mat]): Item => ({ k: "cyl", u: u as number, z: z as number, y: [D + 1.2, D + 1.6], r: 0.25, mat: mat as string, name: "provisions" })),
      ...[4.6, 14.2].map((u): Item => ({ k: "box", u: [u - 0.6, u + 0.6], z: [-1.6, 1.6], y: [D + 0.3, D + 0.6], mat: "wood", name: "hatch" })),
    ]),
  };
}

// ---------------------------------------------------------------------------
// canal and river craft

export const NARROWBOAT_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ colourParam(["green", "Green"], ["red", "Red"], ["blue", "Blue"], ["black", "Black"])];
export function narrowboatSpec(p?: ParamValues): ShipSpec {
  const L = 21;
  const D = 1.0;
  const c = COLOURS[pick(NARROWBOAT_PARAMS, p, "colour")]!;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 2.08, depth: D, draft: 0.6, bow: "raked", stern: "cruiser", section: "flat", entry: 0.14, run: 0.1, rake: 0.04, sheer: [0.1, 0.35], boot: 0.08, stripe: 0, screws: 1, fine: true },
    livery: { hull: "#1d2024", bottom: "#1d2024", boot: "#c23128", deck: "#3b3f43", house: c, roof: "#c23128", yellow: "#e8bf2a" },
    items: [
      { k: "tier", u: [2.4, 18.2], y: [D - 0.05, D + 1.2], hw: 0.98, lip: 0.04, windows: [{ y: 0.4, h: 0.45, w: 0.5, pitch: 1.4, to: 12 }, { y: 0.55, h: 0.22, w: 0.22, pitch: 0.9, from: 13, to: 17.4 }], front: { y: 0.3, h: 0.5, w: 0.35, n: 2 }, name: "cabin" },
      { k: "strakes", u: [0.3, L - 0.3], y: [D - 0.35, D - 0.2], w: 0.05, mat: "yellow", name: "rubbing strakes" },
      // the cabin doors aft and the side hatches, the roof's mushroom vents, plants, water can and pole
      { k: "box", u: [2.35, 2.42], z: [-0.5, 0.5], y: [D + 0.05, D + 1.1], mat: "roof", name: "stern doors" },
      ...[1, -1].map((sd): Item => ({ k: "box", u: [8, 9], z: sd > 0 ? [0.98, 1.0] : [-1.0, -0.98], y: [D + 0.15, D + 0.9], mat: "roof", name: "side hatch" })),
      { k: "vents", at: [[5, 0.3], [9, -0.3], [14, 0.3]], y: D + 1.2, h: 0.08, r: 0.08, mat: "yellow", name: "mushroom vents" },
      { k: "box", u: [4, 4.9], z: [-0.25, 0.25], y: [D + 1.2, D + 1.45], mat: "green", name: "plant box" },
      { k: "cyl", u: 6, z: -0.5, y: [D + 1.2, D + 1.55], r: 0.13, mat: "red", name: "water can" },
      rod([3, D + 1.25, -0.7], [15, D + 1.25, -0.7], 0.025, "wood", "boat pole"),
      // the tiller and the rudder, the button fenders at bow and stern, the cratch
      { k: "plate", pts: [[-0.5, 0.05], [0.1, 0.05], [0.1, D + 0.1], [-0.3, D + 0.1]], z: 0, t: 0.05, mat: "black", name: "rudder" },
      rod([-0.2, D + 0.2, 0], [1.4, D + 0.9, 0], 0.025, "yellow", "tiller"),
      { k: "cyl", u: L - 0.05, z: 0, y: [D - 0.4, D], r: 0.18, n: 8, mat: "wood", name: "bow button" },
      { k: "cyl", u: 0.05, z: 0, y: [D - 0.4, D], r: 0.16, n: 8, mat: "wood", name: "stern button" },
      { k: "plate", pts: [[18.2, D + 1.1], [19.6, D + 0.1], [18.2, D + 0.1]], z: 0, t: 0.04, mat: "yellow", name: "cratch board" },
      { k: "mooring", at: [1, L - 1.4], hw: 0.7, s: 0.15 },
      { k: "box", u: [2.6, 18], z: [0.99, 1.01], y: [D + 0.95, D + 1.05], mat: "yellow", name: "starboard coach line" },
      { k: "box", u: [2.6, 18], z: [-1.01, -0.99], y: [D + 0.95, D + 1.05], mat: "yellow", name: "port coach line" },
      { k: "cyl", u: 16.8, z: 0.4, y: [D + 1.2, D + 1.75], r: 0.07, mat: "black", name: "chimney" },
      { k: "box", u: [10, 13], z: [-0.3, 0.3], y: [D + 1.2, D + 1.35], mat: "wood", name: "roof plank" },
    ],
  };
}

export function kettuvallamSpec(): ShipSpec {
  const L = 20;
  const D = 1.4;
  return {
    kind: "small", small: true,
    hull: { fine: true, length: L, beam: 4.5, depth: D, draft: 0.8, bow: "canoe", stern: "canoe", section: "round", entry: 0.32, run: 0.32, rake: 0.12, sheer: [0.6, 0.8], boot: 0, stripe: 0.25, rudder: false },
    livery: { hull: "#4a3420", stripe: "#6b4a2a", bottom: "#2b2018", deck: "#8a6a3a", canopy: "#b8945a", wood: "#6b4a2a" },
    items: detailed([
      // the thatched coir and bamboo roof on its posts, the cabin under it
      { k: "box", u: [4.5, 15.5], z: [-1.9, 1.9], y: [D - 0.05, D + 1.4], mat: "wood", name: "cabin walls" },
      { k: "canopy", u: [3, 17], hw: 2.15, y: D + 1.4, h: 1.5, mat: "canopy", posts: "wood", name: "thatched roof" },
      { k: "canopy", u: [15.6, 17.6], hw: 1.4, y: D + 1.4, h: 1, mat: "canopy", name: "bow canopy" },
      { k: "strakes", u: [0, L], y: [0.5, 0.75, 1.0, 1.25], w: 0.04, mat: "stripe", name: "plank seams" },
      // the cabin's windows, the front veranda's seats, the punting poles and the cook's corner
      { k: "box", u: [5, 15], z: [1.9, 1.94], y: [D + 0.5, D + 1.1], mat: "glass", name: "starboard windows" },
      { k: "box", u: [5, 15], z: [-1.94, -1.9], y: [D + 0.5, D + 1.1], mat: "glass", name: "port windows" },
      ...[15.8, 16.8].map((u): Item => ({ k: "box", u: [u - 0.3, u + 0.3], z: [-1, 1], y: [D - 0.05, D + 0.45], mat: "red", name: "veranda seat" })),
      ...[1, -1].map((sd): Item => rod([2, D + 0.1, sd * 1.7], [16, D + 0.3, sd * 1.9], 0.04, "wood", "punting pole")),
      { k: "box", u: [2.4, 3.8], z: [-1, 1], y: [D - 0.05, D + 0.7], mat: "wood", name: "galley" },
    ]),
  };
}

export function gondolaSpec(): ShipSpec {
  const L = 11;
  const D = 0.6;
  return {
    kind: "small", small: true,
    hull: { fine: true, length: L, beam: 1.4, depth: D, draft: 0.25, bow: "canoe", stern: "canoe", section: "round", entry: 0.38, run: 0.36, rake: 0.16, sheer: [0.7, 0.9], boot: 0, stripe: 0.08, rudder: false },
    livery: { hull: "#16181b", stripe: "#c9a14a", bottom: "#16181b", deck: "#3b2a1a", steel: "#c9c9c4", red: "#8f2a22", wood: "#3b2a1a" },
    items: detailed([
      // the ferro on the bow, the forcola and the oar, the seats
      { k: "plate", pts: [[L - 0.4, D + 0.6], [L + 0.35, D + 0.8], [L + 0.35, D + 1.7], [L - 0.1, D + 1.5]], z: 0, t: 0.03, mat: "steel", name: "ferro" },
      { k: "box", u: [4.2, 6], z: [-0.55, 0.55], y: [D - 0.2, D + 0.15], mat: "red", name: "seats" },
      { k: "cyl", u: 2.3, z: 0.55, y: [D - 0.05, D + 0.55], r: 0.07, mat: "wood", name: "forcola" },
      { k: "rod", a: [2.3, D + 0.55, 0.6], b: [0.2, 0.05, 1.6], r: 0.04, mat: "wood", name: "oar" },
      { k: "strakes", u: [0.6, L - 0.6], y: [D - 0.12], w: 0.03, mat: "stripe", name: "gilt band" },
      // the felze's cushions, the carved seat backs, the rich gilt horses, the stern platform
      { k: "box", u: [4.4, 5.8], z: [-0.5, 0.5], y: [D + 0.15, D + 0.5], mat: "red", name: "seat back" },
      ...[1, -1].map((sd): Item => ({ k: "plate", pts: [[5.2, D + 0.05], [5.8, D + 0.05], [5.9, D + 0.55], [5.4, D + 0.65]], z: sd * 0.56, t: 0.04, mat: "stripe", name: "gilt horse" })),
      { k: "box", u: [1.4, 2.6], z: [-0.5, 0.5], y: [D - 0.05, D + 0.05], mat: "wood", name: "stern platform" },
      { k: "box", u: [7, 8.4], z: [-0.45, 0.45], y: [D - 0.15, D + 0.05], mat: "red", name: "carpet" },
      { k: "cyl", u: 6.4, z: 0.3, y: [D, D + 0.4], r: 0.08, mat: "stripe", name: "lantern" },
    ]),
  };
}

export function longtailSpec(): ShipSpec {
  const L = 10;
  const D = 0.8;
  return {
    kind: "small", small: true,
    hull: { fine: true, length: L, beam: 1.8, depth: D, draft: 0.4, bow: "canoe", stern: "transom", section: "round", entry: 0.4, run: 0.15, transom: 0.6, rake: 0.25, sheer: [0.1, 1.1], boot: 0, stripe: 0.12, rudder: false },
    livery: { hull: "#6b4a2a", stripe: "#2a6fae", bottom: "#4a3420", deck: "#8a6a3a", steel: "#9ba1a4", red: "#c23128", yellow: "#e8bf2a", green: "#2f7a4b", canopy: "#2a6fae" },
    items: detailed([
      // the car engine on its swivel and the long shaft to the propeller astern
      { k: "box", u: [0.4, 1.3], z: [-0.3, 0.3], y: [D + 0.1, D + 0.65], mat: "steel", name: "engine" },
      { k: "rod", a: [0.85, D + 0.35, 0], b: [-3.8, 0.08, 0], r: 0.04, mat: "steel", name: "long tail shaft" },
      { k: "rod", a: [0.6, D + 0.6, 0], b: [2.2, D + 1.1, 0], r: 0.025, mat: "steel", name: "tiller" },
      // the garlands on the bow post, the awning
      { k: "box", u: [L - 0.6, L - 0.2], z: [-0.12, 0.12], y: [D + 0.9, D + 1.25], mat: "red", name: "garland red" },
      { k: "box", u: [L - 0.7, L - 0.3], z: [-0.1, 0.1], y: [D + 0.6, D + 0.9], mat: "yellow", name: "garland yellow" },
      { k: "canopy", u: [3, 7], hw: 0.85, y: D + 1.1, h: 0.25, mat: "canopy", posts: "wood", name: "awning" },
      { k: "box", u: [3.2, 6.8], z: [-0.7, 0.7], y: [D - 0.25, D - 0.05], mat: "deck", name: "benches" },
      { k: "strakes", u: [0.3, L - 0.3], y: [D - 0.3, D - 0.5], w: 0.04, mat: "yellow", name: "painted bands" },
      { k: "bulwark", u: [0, L], h: 0.08, t: 0.06, mat: "stripe" },
      ...[1, -1].map((sd): Item => ({ k: "cyl", u: 4.4, z: sd * 0.82, y: [D + 0.1, D + 0.4], r: 0.16, n: 8, mat: "orange", name: "life vest" })),
      { k: "rod", a: [-3.8, 0.08, 0], b: [-3.95, 0.08, 0], r: 0.075, n: 3, mat: "steel", name: "propeller" },
      { k: "cyl", u: L - 0.4, z: 0, y: [D + 1.25, D + 1.6], r: 0.06, mat: "green", name: "garland green" },
      { k: "mooring", at: [L - 1], hw: 0.4, s: 0.12 },
    ]),
  };
}

export function sampanSpec(): ShipSpec {
  const L = 7;
  const D = 0.8;
  return {
    kind: "small", small: true,
    hull: { fine: true, length: L, beam: 2, depth: D, draft: 0.35, bow: "barge", stern: "transom", section: "flat", entry: 0.2, run: 0.15, transom: 0.7, rake: 0.12, sheer: [0.3, 0.4], boot: 0, stripe: 0.12, rudder: false },
    livery: { hull: "#6b4a2a", stripe: "#3b2a1a", bottom: "#3b2a1a", deck: "#8a6a3a", canopy: "#8a7048", wood: "#5a3b20", steel: "#5b6266" },
    items: detailed([
      { k: "canopy", u: [2, 5], hw: 0.9, y: D + 0.1, h: 0.9, mat: "canopy", posts: "wood", name: "canopy" },
      { k: "box", u: [0.2, 0.6], z: [-0.25, 0.25], y: [D - 0.1, D + 0.35], mat: "steel", name: "outboard" },
      { k: "rod", a: [0.4, D + 0.1, 0.5], b: [-1.8, 0.05, 0.9], r: 0.03, mat: "wood", name: "yuloh" },
      { k: "strakes", u: [0.2, L - 0.2], y: [0.4, 0.6], w: 0.03, mat: "stripe", name: "plank seams" },
      { k: "bulwark", u: [0, L], h: 0.1, t: 0.06, mat: "wood" },
      // the canopy's ribs, the floor boards, the baskets, the bow's mooring post
      ...[2.3, 3, 3.7, 4.4].map((u): Item => ({ k: "box", u: [u - 0.04, u + 0.04], z: [-0.92, 0.92], y: [D + 0.95, D + 1.02], mat: "wood", name: "canopy rib" })),
      { k: "box", u: [1, 6], z: [-0.7, 0.7], y: [D - 0.2, D - 0.15], mat: "wood", name: "floor boards" },
      ...[[5.4, 0.4], [5.8, -0.3]].map(([u, z]): Item => ({ k: "cyl", u: u!, z: z!, y: [D - 0.15, D + 0.15], r: 0.2, mat: "canopy", name: "basket" })),
      { k: "cyl", u: L - 0.5, z: 0, y: [D, D + 0.5], r: 0.05, mat: "wood", name: "mooring post" },
    ]),
  };
}

// ---------------------------------------------------------------------------
// yachts, runabouts and a fishing cutter

export const SUPERYACHT_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ colourParam(["white", "White"], ["navy", "Navy"], ["grey", "Grey"], ["black", "Black"])];
export function superyachtSpec(p?: ParamValues): ShipSpec {
  const L = 90;
  const D = 7.5;
  const c = COLOURS[pick(SUPERYACHT_PARAMS, p, "colour")]!;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 14, depth: D, draft: 4, bow: "raked", stern: "transom", section: "round", entry: 0.34, run: 0.1, transom: 0.85, rake: 0.08, sheer: [0, 1.2], boot: 0.2, stripe: 0, screws: 2 },
    livery: { hull: c, bottom: "#1d2024", boot: "#1d2024", deck: "#b08a5a", house: "#f4f4f0", roof: "#f4f4f0", glass: "#141a20" },
    items: detailed([
      { k: "tier", u: [10, L - 14], y: [D - 0.2, D + 3], inset: 0.4, round: [6, 18], windows: [{ y: 0.6, h: 1.8, w: 2.6, pitch: 3 }], name: "main deck" },
      { k: "tier", u: [16, L - 22], y: [D + 3, D + 6], inset: 1.1, round: [6, 16], windows: [{ y: 0.6, h: 1.8, w: 2.6, pitch: 3 }], name: "upper deck" },
      { k: "tier", u: [26, L - 30], y: [D + 6, D + 8.8], inset: 2, round: [6, 12], windows: [{ y: 0.5, h: 1.7, w: 2.6, pitch: 3 }], name: "bridge deck" },
      { k: "tier", u: [38, L - 40], y: [D + 8.8, D + 11], inset: 3.4, round: [5, 8], windows: [{ y: 0.4, h: 1.4, w: 2.6, pitch: 3 }], name: "sun deck" },
      { k: "cyl", u: 50, z: 0, y: [D + 11, D + 16], r: 0.5, mat: "house", name: "mast" },
      { k: "spheres", u: [48, 52], n: 1, r: 1, y: D + 16, base: D + 15.9, mat: "white", cover: "white", name: "radome" },
      { k: "boats", at: [16], z: 4.2, y: D + 3.8, len: 7, r: 0.9, mat: "white", name: "tenders" },
      // the rails along every deck's edge, the tender garage door, the sun deck's loungers and spa
      ...[[10.4, L - 14.4, D + 3, 6.2], [16.4, L - 22.4, D + 6, 5.4], [26.4, L - 30.4, D + 8.8, 4.6], [38.4, L - 40.4, D + 11, 3.3]].map(([a, b, y, hw], i): Item => ({ k: "rail", u: [a!, b!], y: y!, hw: hw!, h: 1, mat: "glass", name: `deck ${i + 2} rail` })),
      { k: "rail", u: [L - 13, L - 3], y: D + 0.6, hw: 5.6, h: 1, name: "foredeck rail" },
      { k: "plate", pts: [[0.3, D - 3.4], [0.3, D - 0.4], [0.5, D - 0.4], [0.5, D - 3.4]], z: 0, t: 6, mat: "steel", name: "garage door" },
      ...[42, 45, 48].map((u): Item => ({ k: "box", u: [u - 1, u + 1], z: [-2.8, -1.8], y: [D + 11, D + 11.35], mat: "white", name: "sun lounger" })),
      { k: "cyl", u: 44, z: 2.4, y: [D + 11, D + 11.6], r: 1.2, n: 12, mat: "blue", name: "spa pool" },
      { k: "boats", at: [24], z: -4.2, y: D + 3.8, len: 7, r: 0.9, mat: "white", name: "tender port" },
      ...passengerFittings({ L, B: 14, D, T: 4, fender: 0 }),
    ]),
  };
}

export const SAILING_YACHT_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ colourParam(["white", "White"], ["navy", "Navy"], ["red", "Red"], ["green", "Green"])];
export function sailingYachtSpec(p?: ParamValues): ShipSpec {
  const L = 12;
  const lift = 1.4;
  const D = 1.5 + lift;
  const c = COLOURS[pick(SAILING_YACHT_PARAMS, p, "colour")]!;
  return {
    kind: "sail", small: true,
    hull: { fine: true, length: L, beam: 3.9, depth: D - lift, draft: 2, lift, bow: "raked", stern: "transom", section: "vee", entry: 0.45, run: 0.2, transom: 0.75, rake: 0.1, sheer: [0, 0.3], boot: 0.08, stripe: 0.1, rudder: false },
    livery: { hull: c, stripe: "#1d2024", bottom: "#1f2f4f", boot: "#1d2024", deck: "#d6d0c2", house: "#f2f0ea", sail: "#f4f4f0", spar: "#c9c9c4", wood: "#8a6a3a" },
    items: detailed([
      // the fin keel with its bulb, the spade rudder
      { k: "plate", pts: [[4.6, 0], [6.4, 0], [6.8, lift + 0.2], [5, lift + 0.2]], z: 0, t: 0.18, mat: "bottom", name: "fin keel" },
      { k: "rod", a: [4.4, 0.27, 0], b: [6.6, 0.27, 0], r: 0.24, mat: "bottom", name: "keel bulb" },
      { k: "plate", pts: [[0.9, 0.6], [1.5, 0.6], [1.5, lift + 0.3], [0.9, lift + 0.3]], z: 0, t: 0.08, mat: "bottom", name: "rudder" },
      { k: "tier", u: [4.4, 8], y: [D - 0.05, D + 0.6], hw: 1.3, round: [0, 1], windows: [{ y: 0.15, h: 0.3, w: 0.6, pitch: 0.9 }], name: "coachroof" },
      { k: "rig", masts: [{ u: 7.6, y: [D, D + 16], r: 0.09, sails: [{ kind: "bermuda", y: [D + 1.4, D + 15.6], len: 5.6 }, { kind: "jib", y: [D + 0.9, D + 14], tack: L - 0.2, len: 4.6 }] }] },
      // the stanchions and lifelines, the pulpit, the wheel and cockpit, the winches, the spreaders
      { k: "edgeRail", u: [0.6, L - 0.8], h: 0.6, pitch: 1.5, mat: "steel", name: "lifelines" },
      { k: "cyl", u: 2.2, z: 0, y: [D + 0.1, D + 0.9], r: 0.45, n: 12, mat: "steel", name: "wheel" },
      { k: "box", u: [1.6, 4.2], z: [-1.2, 1.2], y: [D - 0.35, D - 0.05], mat: "wood", name: "cockpit sole" },
      ...[1, -1].map((sd): Item => ({ k: "cyl", u: 3.4, z: sd * 1.3, y: [D, D + 0.25], r: 0.12, mat: "black", name: "winch" })),
      { k: "rod", a: [7.6, D + 9, -1.4], b: [7.6, D + 9, 1.4], r: 0.04, mat: "spar", name: "spreaders" },
      ...[1, -1].map((sd): Item => rod([7.6, D + 15.6, 0], [7.2, D, sd * 1.8], 0.015, "rope", "shroud")),
      rod([7.6, D + 15.8, 0], [0.2, D + 0.2, 0], 0.015, "rope", "backstay"),
      { k: "box", u: [4.6, 5.2], z: [-0.4, 0.4], y: [D + 0.6, D + 0.68], mat: "glass", name: "hatch" },
    ]),
  };
}

export function rivaAquaramaSpec(): ShipSpec {
  const L = 8.02;
  const D = 1.1;
  return {
    kind: "small", small: true,
    hull: { fine: true, length: L, beam: 2.6, depth: D, draft: 0.7, bow: "raked", stern: "transom", section: "vee", entry: 0.5, run: 0.1, transom: 0.85, rake: 0.14, sheer: [0, 0.2], boot: 0.06, stripe: 0, screws: 0 },
    livery: { hull: "#7a3a1a", bottom: "#f2f0ea", boot: "#1f2f4f", deck: "#8a4a22", house: "#efe6cf", white: "#efe6cf" },
    items: detailed([
      // the windscreen, the cream sunbed and seats, the engine hatch
      { k: "tier", u: [4.6, 5.0], y: [D - 0.05, D + 0.45], hw: 1.1, mat: "glass", name: "windscreen" },
      { k: "box", u: [3.4, 4.5], z: [-1, 1], y: [D - 0.1, D + 0.3], mat: "white", name: "seats" },
      { k: "box", u: [0.4, 2.4], z: [-1, 1], y: [D - 0.1, D + 0.12], mat: "white", name: "sunbed" },
      { k: "box", u: [2.5, 3.3], z: [-0.9, 0.9], y: [D - 0.1, D + 0.06], mat: "deck", name: "engine hatch" },
      { k: "cyl", u: 0.3, z: 0, y: [D, D + 0.8], r: 0.02, mat: "steel", name: "flagstaff" },
      { k: "strakes", u: [0.4, L - 0.4], y: [D - 0.25], w: 0.04, mat: "white", name: "caulking line" },
      // the mahogany deck's caulked seams, the chrome cleats and the steering wheel
      ...[-0.8, -0.4, 0, 0.4, 0.8].map((z, i): Item => ({ k: "box", u: [5, L - 0.4], z: [z - 0.015, z + 0.015], y: [D - 0.02, D + 0.01], mat: "white", name: `deck seam ${i + 1}` })),
      { k: "cyl", u: 4.1, z: 0.5, y: [D + 0.3, D + 0.38], r: 0.2, n: 12, mat: "white", name: "steering wheel" },
      { k: "mooring", at: [0.5, L - 0.8], hw: 1.1, s: 0.12 },
      { k: "rod", a: [0.15, 0.25, 0], b: [-0.05, 0.25, 0], r: 0.22, n: 3, mat: "steel", name: "propeller" },
    ]),
  };
}

export const CUTTER_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ colourParam(["blue", "Blue"], ["green", "Green"], ["red", "Red"], ["black", "Black"])];
export function fishingCutterSpec(p?: ParamValues): ShipSpec {
  const L = 24;
  const D = 3.6;
  const c = COLOURS[pick(CUTTER_PARAMS, p, "colour")]!;
  return {
    kind: "small", small: true,
    hull: { fine: true, length: L, beam: 7, depth: D, draft: 2.8, bow: "raked", stern: "cruiser", section: "round", entry: 0.38, run: 0.24, rake: 0.08, sheer: [0.4, 1.4], boot: 0.15, stripe: 0.3, screws: 1 },
    livery: { hull: c, stripe: "#f2f0ea", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#7d6a55", house: "#f2f0ea", mast: "#d8d6cf", grey: "#5b6266" },
    items: detailed([
      { k: "tier", u: [4, 9], y: [D - 0.1, D + 2.3], hw: 2.4, front: { y: 1.2, h: 0.8, w: 0.8, n: 3 }, windows: [{ y: 1.2, h: 0.8, w: 0.8, pitch: 1.3 }], name: "wheelhouse" },
      { k: "cyl", u: 13, z: 0, y: [D, D + 10], r: 0.18, mat: "mast", name: "mast" },
      // the two beam trawl booms, raised, and the beams hanging from them
      { k: "rod", a: [13, D + 1.2, 0.3], b: [13, D + 8, 7.5], r: 0.12, mat: "mast", name: "starboard boom" },
      { k: "rod", a: [13, D + 1.2, -0.3], b: [13, D + 8, -7.5], r: 0.12, mat: "mast", name: "port boom" },
      { k: "rod", a: [9, D + 4, 7.4], b: [17, D + 4, 7.4], r: 0.14, mat: "grey", name: "starboard beam" },
      { k: "rod", a: [9, D + 4, -7.4], b: [17, D + 4, -7.4], r: 0.14, mat: "grey", name: "port beam" },
      { k: "cyl", u: 6, z: 1.6, y: [D + 2.3, D + 3.8], r: 0.2, mat: "black", name: "exhaust" },
      { k: "box", u: [15, 19], z: [-1.5, 1.5], y: [D, D + 0.8], mat: "grey", name: "winch" },
      { k: "bulwark", u: [0, L], h: 0.8, t: 0.15 },
      { k: "tier", u: [4.6, 8.4], y: [D + 2.3, D + 2.45], hw: 2.2, mat: "white", name: "wheelhouse roof" },
      { k: "rail", u: [4.8, 8.2], y: D + 2.45, hw: 2.1, h: 0.6, name: "wheelhouse roof rail" },
      { k: "cyl", u: 7.6, z: 0, y: [D + 2.45, D + 4], r: 0.05, mat: "white", name: "radar mast" },
      { k: "box", u: [7.2, 8], z: [-0.6, 0.6], y: [D + 4, D + 4.12], mat: "black", name: "radar" },
      // the nets hanging from the beams, the gallows and the fish boxes
      ...[1, -1].flatMap((sd): Item[] => [[10, 0.5], [13, 0.4], [16, 0.5]].map(([u, r]): Item => rod([u!, D + 4, sd * 7.4], [u!, D + 1.6, sd * 7.2], r!, "green", "net"))),
      ...[18.4, 19.6].map((u): Item => ({ k: "box", u: [u - 0.5, u + 0.5], z: [1.8, 2.6], y: [D, D + 0.4], mat: "blue", name: "fish boxes" })),
      { k: "anchors", u: L - 1.8, y: D - 0.4, s: 0.7 },
      { k: "mooring", at: [1.6, L - 2.6], hw: 2.6, s: 0.3 },
    ]),
  };
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names (jsModel.ts imports a design's builders by name)

export function shipNarrowboat(p?: ParamValues): MeshBuilder { return worldShip(narrowboatSpec(p)); }
export function shipNarrowboatLod(p?: ParamValues): MeshBuilder { return shipLod(narrowboatSpec(p)); }
export function shipThamesBarge(): MeshBuilder { return worldShip(thamesBargeSpec()); }
export function shipThamesBargeLod(): MeshBuilder { return shipLod(thamesBargeSpec()); }
export function shipDhow(): MeshBuilder { return worldShip(dhowSpec()); }
export function shipDhowLod(): MeshBuilder { return shipLod(dhowSpec()); }
export function shipJunk(): MeshBuilder { return worldShip(junkSpec()); }
export function shipJunkLod(): MeshBuilder { return shipLod(junkSpec()); }
export function shipFelucca(): MeshBuilder { return worldShip(feluccaSpec()); }
export function shipFeluccaLod(): MeshBuilder { return shipLod(feluccaSpec()); }
export function shipKettuvallam(): MeshBuilder { return worldShip(kettuvallamSpec()); }
export function shipKettuvallamLod(): MeshBuilder { return shipLod(kettuvallamSpec()); }
export function shipSedov(): MeshBuilder { return worldShip(sedovSpec()); }
export function shipSedovLod(): MeshBuilder { return shipLod(sedovSpec()); }
export function shipCuttySark(): MeshBuilder { return worldShip(cuttySarkSpec()); }
export function shipCuttySarkLod(): MeshBuilder { return shipLod(cuttySarkSpec()); }
export function shipBluenose(): MeshBuilder { return worldShip(bluenoseSpec()); }
export function shipBluenoseLod(): MeshBuilder { return shipLod(bluenoseSpec()); }
export function shipGreatBritain(): MeshBuilder { return worldShip(greatBritainSpec()); }
export function shipGreatBritainLod(): MeshBuilder { return shipLod(greatBritainSpec()); }
export function shipVikingLongship(): MeshBuilder { return worldShip(vikingSpec()); }
export function shipVikingLongshipLod(): MeshBuilder { return shipLod(vikingSpec()); }
export function shipVoyagingCanoe(): MeshBuilder { return worldShip(voyagingCanoeSpec()); }
export function shipVoyagingCanoeLod(): MeshBuilder { return shipLod(voyagingCanoeSpec()); }
export function shipGondola(): MeshBuilder { return worldShip(gondolaSpec()); }
export function shipGondolaLod(): MeshBuilder { return shipLod(gondolaSpec()); }
export function shipLongtail(): MeshBuilder { return worldShip(longtailSpec()); }
export function shipLongtailLod(): MeshBuilder { return shipLod(longtailSpec()); }
export function shipSuperyacht(p?: ParamValues): MeshBuilder { return worldShip(superyachtSpec(p)); }
export function shipSuperyachtLod(p?: ParamValues): MeshBuilder { return shipLod(superyachtSpec(p)); }
export function shipSailingYacht(p?: ParamValues): MeshBuilder { return worldShip(sailingYachtSpec(p)); }
export function shipSailingYachtLod(p?: ParamValues): MeshBuilder { return shipLod(sailingYachtSpec(p)); }
export function shipRivaAquarama(): MeshBuilder { return worldShip(rivaAquaramaSpec()); }
export function shipRivaAquaramaLod(): MeshBuilder { return shipLod(rivaAquaramaSpec()); }
export function shipFishingCutter(p?: ParamValues): MeshBuilder { return worldShip(fishingCutterSpec(p)); }
export function shipFishingCutterLod(p?: ParamValues): MeshBuilder { return shipLod(fishingCutterSpec(p)); }
export function shipSampan(): MeshBuilder { return worldShip(sampanSpec()); }
export function shipSampanLod(): MeshBuilder { return shipLod(sampanSpec()); }

// ---------------------------------------------------------------------------
// the designs, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md)

export const SMALL_SHIP_SPECS: readonly WorldShip[] = [
  { id: "veh-ship-narrowboat", title: "Canal Narrowboat", spec: narrowboatSpec, build: shipNarrowboat, buildLod: shipNarrowboatLod, params: NARROWBOAT_PARAMS, finishParams: ["colour"], game: { weight: 18, power: 30, maxspeed: 6 }, references: "ship-narrowboat" },
  { id: "veh-ship-thames-barge", title: "Thames Sailing Barge", spec: thamesBargeSpec, build: shipThamesBarge, buildLod: shipThamesBargeLod, game: { weight: 150, power: 0, maxspeed: 13 }, references: "ship-thames-barge" },
  { id: "veh-ship-dhow", title: "Dhow", spec: dhowSpec, build: shipDhow, buildLod: shipDhowLod, game: { weight: 100, power: 0, maxspeed: 15 }, references: "ship-dhow" },
  { id: "veh-ship-junk", title: "Chinese Junk", spec: junkSpec, build: shipJunk, buildLod: shipJunkLod, game: { weight: 250, power: 0, maxspeed: 13 }, references: "ship-junk" },
  { id: "veh-ship-felucca", title: "Felucca", spec: feluccaSpec, build: shipFelucca, buildLod: shipFeluccaLod, game: { weight: 3, power: 0, maxspeed: 10 }, references: "ship-felucca" },
  { id: "veh-ship-kettuvallam", title: "Kerala Houseboat", spec: kettuvallamSpec, build: shipKettuvallam, buildLod: shipKettuvallamLod, game: { weight: 25, power: 50, maxspeed: 10 }, references: "ship-kettuvallam" },
  { id: "veh-ship-sedov", title: "Sedov", spec: sedovSpec, build: shipSedov, buildLod: shipSedovLod, game: { weight: 7_320, power: 1_300, maxspeed: 33 }, references: "ship-sedov" },
  { id: "veh-ship-cutty-sark", title: "Cutty Sark", spec: cuttySarkSpec, build: shipCuttySark, buildLod: shipCuttySarkLod, game: { weight: 2_100, power: 0, maxspeed: 32 }, references: "ship-cutty-sark" },
  { id: "veh-ship-bluenose", title: "Bluenose", spec: bluenoseSpec, build: shipBluenose, buildLod: shipBluenoseLod, game: { weight: 285, power: 0, maxspeed: 30 }, references: "ship-bluenose" },
  { id: "veh-ship-ss-great-britain", title: "SS Great Britain", spec: greatBritainSpec, build: shipGreatBritain, buildLod: shipGreatBritainLod, game: { weight: 3_675, power: 750, maxspeed: 20 }, references: "ship-ss-great-britain" },
  { id: "veh-ship-viking-longship", title: "Viking Longship", spec: vikingSpec, build: shipVikingLongship, buildLod: shipVikingLongshipLod, game: { weight: 20, power: 0, maxspeed: 15 }, references: "ship-viking-longship" },
  { id: "veh-ship-voyaging-canoe", title: "Polynesian Voyaging Canoe", spec: voyagingCanoeSpec, build: shipVoyagingCanoe, buildLod: shipVoyagingCanoeLod, game: { weight: 12, power: 0, maxspeed: 10 }, references: "ship-voyaging-canoe" },
  { id: "veh-ship-gondola", title: "Venetian Gondola", spec: gondolaSpec, build: shipGondola, buildLod: shipGondolaLod, game: { weight: 0.6, power: 0, maxspeed: 5 }, references: "ship-gondola" },
  { id: "veh-ship-longtail", title: "Thai Longtail Boat", spec: longtailSpec, build: shipLongtail, buildLod: shipLongtailLod, game: { weight: 1.5, power: 75, maxspeed: 35 }, references: "ship-longtail" },
  { id: "veh-ship-superyacht", title: "Superyacht", spec: superyachtSpec, build: shipSuperyacht, buildLod: shipSuperyachtLod, params: SUPERYACHT_PARAMS, finishParams: ["colour"], game: { weight: 2_400, power: 6_000, maxspeed: 31 }, references: "ship-superyacht" },
  { id: "veh-ship-sailing-yacht", title: "Sailing Yacht", spec: sailingYachtSpec, build: shipSailingYacht, buildLod: shipSailingYachtLod, params: SAILING_YACHT_PARAMS, finishParams: ["colour"], game: { weight: 8, power: 40, maxspeed: 15 }, references: "ship-sailing-yacht" },
  { id: "veh-ship-riva-aquarama", title: "Riva Aquarama", spec: rivaAquaramaSpec, build: shipRivaAquarama, buildLod: shipRivaAquaramaLod, game: { weight: 3, power: 440, maxspeed: 83 }, references: "ship-riva-aquarama" },
  { id: "veh-ship-fishing-cutter", title: "North Sea Fishing Cutter", spec: fishingCutterSpec, build: shipFishingCutter, buildLod: shipFishingCutterLod, params: CUTTER_PARAMS, finishParams: ["colour"], game: { weight: 120, power: 300, maxspeed: 19 }, references: "ship-fishing-cutter" },
  { id: "veh-ship-sampan", title: "Sampan", spec: sampanSpec, build: shipSampan, buildLod: shipSampanLod, game: { weight: 0.8, power: 10, maxspeed: 10 }, references: "ship-sampan" },
];

export const SMALL_SHIPS = /* @__PURE__ */ shipDesigns(SMALL_SHIP_SPECS);
