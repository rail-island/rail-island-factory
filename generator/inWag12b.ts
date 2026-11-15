// The WAG-12B (Alstom Prima T8, Madhepura): two single-cab Bo-Bo sections
// coupled back to back, each a section of an articulated vehicle (articulate,
// tramKit.ts) hinged at the coupling plane between them, the gap covered by the
// narrow bellows duct the photographs show. Each section is drawn here from the
// Czech electric kit's pieces (czElectricKit.ts: surface panels, bogies,
// pantograph, insulators) on its own loft: the cab end raked back to its roof,
// its corners chamfered, the inner end flat. The face: the black mask round the
// two guarded windscreens with its vee-shaped lower edge, the light-blue nose
// block with the twin headlamps, the black lamp pods at the corners, the black
// buffer beam with the buffers and the centre coupler, the deep light-blue
// plough. The sides: the black mask over the cab door and side window, the
// light-blue chevrons at the inner end, the louvre and the tall black hatch,
// the lettering. The roof: one single-arm pantograph per section 4.5 m from the
// joint (the rear one raised), the cab's air-conditioning unit with the
// headlamp and horn, the roof hatches.
// Measured on the photographs of assets/ir-wag12b/ (SOURCES.md); figures from
// the class's published data (38.4 m over couplers, 3.215 m wide, pivots 10.2 m,
// bogie wheelbase 2.6 m, wheels 1,250 mm, pantographs 9.0 m apart).
// See docs/models/india-trains.md.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import {
  KIT_PALETTE, bogie, c, insulator, kinks, lerpTable, numberOn, onEnd, onSide, rect, roundRect, singleArm, surfacePanel,
  type Place, type ShellSpec,
} from "./czElectricKit.ts";
import { block } from "./vehicleParts.ts";
import { tubeX, type Band } from "./cd163.ts";
import { centreCoupler, enumParam } from "./emuParts.ts";
import { articulate } from "./tramKit.ts";
import { letters, wordWidth } from "./letters.ts";
import { fitLod, lodBogie, lodPantograph, lodRoofBox, lodSideBox, type LodPart, type LodShell } from "./lodKit.ts";

// --- measures (m), section 0: the front section, its cab at +x -------------------------

/** Half the length over the couplers (38.4 m). */
const HALF = 19.2;
/** The cab end's buffer beam; the buffers stand 0.6 m proud of it. */
const N = 18.6;
/** The inner end: the bodies stand 1.0 m apart. */
const XI = 0.5;
/** The coupling plane between the sections and its height. */
const HINGE_Y = 1.105;
const W = 1.6;
const Y0 = 1.45;
const ROOF = 4.02;
/** The half width by height: upright sides, the roof's rounded shoulders. */
const HW: ReadonlyArray<readonly [number, number]> = [[Y0, W], [3.72, W], [3.9, W - 0.14], [ROOF, W - 0.45]];
/** The cab end's centre line [y, x]: the beam upright, the face leaning back above the nose block, the windscreen raked to the roof. */
const TIP: ReadonlyArray<readonly [number, number]> = [[Y0, N], [1.6, N], [2.33, N - 0.04], [2.62, N - 0.1], [3.65, N - 0.42], [3.85, N - 0.62], [ROOF, N - 1.0]];
/** The cab end's plan at half width w: nearly flat, the corners chamfered. */
const endPlan = (_y: number, w: number): ReadonlyArray<readonly [number, number]> => [[0, 0], [w * 0.6, 0.03], [w * 0.9, 0.16], [w, 0.36]];
/** Bogie centres 10.2 m apart about the body's middle, axles 2.6 m apart, wheels 1,250 mm. */
const MID = (XI + N) / 2;
const PIVOT = 5.1, HALF_BASE = 1.3, WHEEL_R = 0.625;
/** Pantograph shoe centres 9.0 m apart: 4.5 m from the coupling plane. */
const PANTO_X = 4.5;
/** The windscreens: sill, head, inner and outer edges. */
const SCREEN = { y: [2.76, 3.62] as const, z: [0.07, 1.3] as const };
/** The light-blue line along the side's foot. */
const FOOT_LINE = 1.53;
/** The roof's dark grey from the shoulder up. */
const ROOF_LINE = 3.86;

// --- livery ---------------------------------------------------------------------------------

interface Livery { title: string; number: string; body: string; face: string; light: string }

/**
 * The key is stored in saved maps: never rename it. Every photographed unit
 * (60051, 60185, 60222, 60227) wears the blue scheme: a mid-blue body, the
 * light-blue face, plough and chevrons, the dark grey frame and roof. The
 * single livery is not a parameter, so its title is not exported.
 */
const LIVERIES: Record<string, Livery> = {
  greyRed: { title: "Grey and red", number: "60185", body: "#1f63c9", face: "#3b98e3", light: "#4ea6ea" },
};

export const WAG12B_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const livery = (v?: ParamValues): Livery => LIVERIES[resolveParams(WAG12B_PARAMS, v).livery!]!;

function palette(l: Livery): Record<string, MaterialSpec> {
  return {
    ...KIT_PALETTE,
    body: c(l.body, 0.45), face: c(l.face, 0.45), light: c(l.light, 0.45),
    roof: { color: "#45484c", roughness: 0.75 }, frame: c("#33363a", 0.7), mask: c("#17181a", 0.5),
    ac: c("#c9cccd", 0.5), plate: c("#3a3b3d", 0.6), bellows: c("#1b1c1e", 0.9),
    saffron: c("#f08a24"), green: c("#138a36"), navy: c("#1d2b7a"), jumper: c("#9c3b22", 0.6),
  };
}

const SIDE: Band[] = [[Y0, FOOT_LINE, "light"], [FOOT_LINE, ROOF_LINE, "body"], [ROOF_LINE, 9, "roof"]];
const END: Band[] = [[Y0, 1.6, "mask"], [1.6, 9, "face"]];
const INNER: Band[] = [[Y0, ROOF_LINE, "light"], [ROOF_LINE, 9, "roof"]];

/** The placement spec of the cab end and the sides (its rear end is never drawn from it). */
const SP: ShellSpec = {
  heights: kinks(TIP, HW),
  tip: (y) => lerpTable(TIP, y),
  hw: (y) => lerpTable(HW, y),
  endPlan: (y) => endPlan(y, lerpTable(HW, y)),
  side: SIDE, end: END, corner: "end", roof: "roof",
};
const VB = kinks(TIP, HW);

// --- the shell ------------------------------------------------------------------------------

type Region = "end" | "side" | "inner";

/** The section's ring at height y, counter-clockwise from above: the cab end's centre, its -z corner, the inner end, the +z corner. */
function ring(y: number): Array<{ x: number; z: number; region: Region }> {
  const tip = lerpTable(TIP, y), w = lerpTable(HW, y);
  const plan = endPlan(y, w);
  const out: Array<{ x: number; z: number; region: Region }> = [];
  const n = plan.length - 1;
  for (let i = 0; i <= n; i++) out.push({ x: tip - plan[i]![1], z: -plan[i]![0], region: i === n ? "side" : "end" });
  out.push({ x: XI, z: -w, region: "inner" }, { x: XI, z: w, region: "side" });
  for (let i = n; i >= 1; i--) out.push({ x: tip - plan[i]![1], z: plan[i]![0], region: "end" });
  return out;
}

const bandAt = (bands: readonly Band[], y: number): string => (bands.find(([a, b]) => y >= a && y < b) ?? bands[bands.length - 1]!)[2];

/** Lofts the section's body between its rings, each face painted by its region's bands, and caps the roof. */
function shell(m: MeshBuilder): void {
  const hs = new Set<number>(VB);
  for (const bands of [SIDE, END, INNER]) for (const [a, b] of bands) for (const h of [a, b]) if (h > Y0 && h < ROOF) hs.add(h);
  const heights = [...hs].sort((a, b) => a - b);
  for (let i = 1; i < heights.length; i++) {
    const [ya, yb] = [heights[i - 1]!, heights[i]!];
    const [lo, hi] = [ring(ya), ring(yb)];
    const ym = (ya + yb) / 2;
    for (let j = 0; j < lo.length; j++) {
      const k = (j + 1) % lo.length;
      const reg = lo[j]!.region;
      const mat = bandAt(reg === "side" ? SIDE : reg === "end" ? END : INNER, ym);
      const a: Vec3 = [lo[j]!.x, ya, lo[j]!.z], b: Vec3 = [lo[k]!.x, ya, lo[k]!.z];
      const cc: Vec3 = [hi[k]!.x, yb, hi[k]!.z], d: Vec3 = [hi[j]!.x, yb, hi[j]!.z];
      // outward: away from the section's axis
      const out = (p: Vec3, q: Vec3, r: Vec3) => {
        const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
        const nn = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
        if (Math.hypot(nn[0]!, nn[1]!, nn[2]!) < 1e-9) return;
        const cx = (p[0] + q[0] + r[0]) / 3 - MID, cz = (p[2] + q[2] + r[2]) / 3;
        if (nn[0]! * cx + nn[2]! * cz >= 0) m.tri(mat, p, q, r);
        else m.tri(mat, p, r, q);
      };
      m.scope(reg === "side" ? `side ${a[2] + b[2] > 0 ? "right" : "left"}` : reg === "end" ? "cab end" : "inner end", () => {
        out(a, b, cc);
        out(a, cc, d);
      });
    }
  }
  m.scope("roof", () => m.cap("roof", ring(ROOF).map((p) => [p.x, p.z] as [number, number]), ROOF));
}

// --- skin helpers ------------------------------------------------------------------------------

/** A framed window: frame, glass. */
function windowOn(m: MeshBuilder, at: Place, n: Vec3, poly: Ring, inner: Ring, uB: readonly number[] = []): void {
  m.scope("frame", () => surfacePanel(m, "rubber", at, n, poly, -0.01, 0.012, uB, VB));
  m.scope("glass", () => surfacePanel(m, "glass", at, n, inner, -0.005, 0.02, uB, VB));
}

/** The cab end's plan corners at every height an item spans: where its panels must break. */
const uBreaks = (y: readonly [number, number]): number[] =>
  [...new Set([y[0], (y[0] + y[1]) / 2, y[1], ...VB.filter((h) => h > y[0] && h < y[1])].flatMap((h) => SP.endPlan(h).map(([z]) => z)).flatMap((z) => [z, -z]))].sort((a, b) => a - b);

// --- the sides --------------------------------------------------------------------------------

/** One side (sd +1 right) of the front section; `english` the lettering "INDIAN RAILWAYS". */
function sideSkin(m: MeshBuilder, sd: number, l: Livery, english: boolean): void {
  const at = onSide(SP, sd);
  const n: Vec3 = [0, 0, sd];
  const top = 3.72, mid = (FOOT_LINE + top) / 2;
  const paint = (name: string, mat: string, poly: Ring, layer = 0) => m.scope(name, () => surfacePanel(m, mat, at, n, poly, 0.001 + 0.002 * layer, 0.003 + 0.002 * layer, [], VB));
  // the inner end's light-blue chevron field and the chevron band
  paint("end chevron", "light", [[XI, FOOT_LINE], [XI + 0.12, FOOT_LINE], [XI + 0.7, mid], [XI + 0.12, top], [XI, top]]);
  for (const [lo, hi] of [[FOOT_LINE, mid], [mid, top]] as const) {
    const up = hi === top;
    const xe = (y: number, x0: number) => x0 + 0.77 * (up ? (top - y) : (y - FOOT_LINE)) / (top - mid);
    paint(up ? "chevron upper" : "chevron lower", "light", [[xe(lo, XI + 1.55), lo], [xe(lo, XI + 2.25), lo], [xe(hi, XI + 2.25), hi], [xe(hi, XI + 1.55), hi]]);
  }
  // the small louvre in the dark arrow, the tall black hatch behind the chevron
  m.scope("louvre", () => {
    surfacePanel(m, "louvre", at, n, rect(XI + 0.86, 2.62, XI + 1.42, 3.48), -0.006, 0.006, [], VB);
    for (let y = 2.7; y < 3.42; y += 0.09) surfacePanel(m, "slat", at, n, rect(XI + 0.9, y, XI + 1.38, y + 0.035), -0.002, 0.012, [], VB);
  });
  m.scope("hatch", () => {
    surfacePanel(m, "mask", at, n, roundRect(XI + 3.9, XI + 4.95, 1.62, 3.66, 0.03), -0.004, 0.008, [], VB);
    for (const x of [XI + 3.92, XI + 4.93]) surfacePanel(m, "rubber", at, n, rect(x - 0.012, 1.64, x + 0.012, 3.64), 0.0, 0.011, [], VB);
  });
  // the cab: the black mask over the door and the side window, the door, its handrails
  const [d0, d1] = [N - 2.62, N - 1.82], [w0, w1] = [N - 1.62, N - 1.0];
  // its front edge follows the side wall's end, where the face's chamfer takes it round the corner
  const wallEnd = (y: number) => lerpTable(TIP, y) - endPlan(y, W)[3]![1] - 0.02;
  paint("cab mask", "mask", [[N - 2.82, 2.86], [wallEnd(2.86), 2.86], [wallEnd(top), top], [N - 2.82, top]], 1);
  m.scope("cab door", () => {
    for (const q of [rect(d0, 1.62, d1, 1.645), rect(d0, 3.635, d1, 3.66), rect(d0, 1.645, d0 + 0.025, 3.635), rect(d1 - 0.025, 1.645, d1, 3.635)])
      surfacePanel(m, "rubber", at, n, q, 0.0, 0.008, [], VB);
    windowOn(m, at, n, roundRect(d0 + 0.12, d1 - 0.12, 2.98, 3.52, 0.06), roundRect(d0 + 0.16, d1 - 0.16, 3.02, 3.48, 0.04));
  });
  m.scope("cab window", () => windowOn(m, at, n, roundRect(w0, w1, 2.98, 3.52, 0.08), roundRect(w0 + 0.04, w1 - 0.04, 3.02, 3.48, 0.06)));
  m.scope("handrails", () => {
    for (const hx of [d0 - 0.08, d1 + 0.08]) {
      const z = sd * (W + 0.03);
      m.prism("steel", ngon(6, 0.016, 0, hx, z), 1.7, 3.4);
      for (const hy of [1.72, 3.36]) block(m, "steel", hx - 0.014, hx + 0.014, hy, hy + 0.025, ...(sd > 0 ? [W - 0.01, W + 0.04] as const : [-W - 0.04, -W + 0.01] as const));
    }
  });
  m.scope("steps", () => {
    for (const y of [0.42, 0.78]) block(m, "steel", d0 + 0.08, d1 - 0.08, y, y + 0.04, ...(sd > 0 ? [W - 0.24, W - 0.02] as const : [-W + 0.02, -W + 0.24] as const));
    for (const hx of [d0 + 0.08, d1 - 0.12]) block(m, "steel", hx, hx + 0.04, 0.42, 1.06, ...(sd > 0 ? [W - 0.1, W - 0.04] as const : [-W + 0.04, -W + 0.1] as const));
  });
  // the lettering and the number, white on the blue
  const x = XI + 9.2;
  m.scope("lettering", () => {
    if (english) {
      const text = "INDIAN RAILWAYS", h = 0.34, style = { weight: 0.17, width: 0.58, gap: 0.14 };
      const w = wordWidth(text, h, style);
      const tris = letters(text, sd > 0 ? x - w / 2 : x + w / 2, 3.0, h, sd < 0, style);
      m.facets("white", tris.map(([u, v]) => at(u, v, 0.0045)), n);
    } else {
      // "Bharatiya Rail" in Devanagari: its headline bar and the stems the photos read at a distance
      const h = 0.4, y = 2.98, [w1, w2] = [devanagariWidth("barbab", h), devanagariWidth("eb", h)];
      const x0 = x - (w1 + w2 + 0.3) / 2;
      m.facets("white", [...devanagari(x0, "barbab", y, h), ...devanagari(x0 + w1 + 0.3, "eb", y, h)].map(([u, v]) => at(u, v, 0.0045)), n);
    }
    numberOn(m, at, n, l.number, x, 2.5, 0.28, 0.0045, sd < 0);
  });
}

/**
 * A Devanagari word read from afar, as (u, v) triangles: the headline (shirorekha) over
 * its letters, each drawn by kind - `b` a bowl against its stem (bha, ta, ya, la),
 * `a` the stem alone (the aa and ii signs), `r` the open hook of ra, `e` ra with
 * the e sign over the headline.
 */
function devanagari(u0: number, kinds: string, v: number, h: number): Array<[number, number]> {
  const t = h * 0.13, out: Array<[number, number]> = [];
  const quad = (a: number, b: number, c: number, d: number) => out.push([a, c], [b, c], [b, d], [a, c], [b, d], [a, d]);
  let u = u0;
  for (const k of kinds) {
    const w = k === "a" ? h * 0.3 : h * 0.62;
    const s = u + w - t;
    if (k === "a") quad(s, s + t, v, v + h - t);
    else if (k === "r" || k === "e") {
      quad(u + h * 0.12, u + h * 0.12 + t, v + h * 0.4, v + h - t);
      quad(u + h * 0.12, u + h * 0.48, v + h * 0.4, v + h * 0.4 + t);
      quad(u + h * 0.38, u + h * 0.38 + t, v + h * 0.05, v + h * 0.4);
      if (k === "e") quad(u + h * 0.3, u + h * 0.3 + t, v + h, v + h * 1.25);
    } else {
      quad(s, s + t, v, v + h - t);
      quad(u + h * 0.04, s, v + h * 0.36, v + h * 0.36 + t);
      quad(u + h * 0.04, u + h * 0.04 + t, v + h * 0.36 + t, v + h * 0.72);
    }
    u += w + h * 0.04;
  }
  quad(u0 - h * 0.04, u, v + h - t, v + h);
  return out;
}

/** The width devanagari() gives a word. */
const devanagariWidth = (kinds: string, h: number): number => [...kinds].reduce((a, k) => a + (k === "a" ? h * 0.3 : h * 0.62) + h * 0.04, 0);

// --- the cab end ------------------------------------------------------------------------------

function cabEnd(m: MeshBuilder, l: Livery): void {
  const at = onEnd(SP, 1);
  const n: Vec3 = [1, 0, 0];
  const panel = (mat: string, poly: Ring, d0: number, d1: number, y: readonly [number, number]) => surfacePanel(m, mat, at, n, poly, d0, d1, uBreaks(y), VB);
  // the black mask round the windscreens, its lower edge a shallow vee down to the nose block
  m.scope("mask", () => panel("mask", [[-W + 0.005, 2.62], [-0.6, 2.33], [0.6, 2.33], [W - 0.005, 2.62], [W - 0.005, 3.72], [-W + 0.005, 3.72]], 0.001, 0.003, [2.33, 3.72]));
  // the two windscreens behind their stone guards
  for (const s of [-1, 1])
    m.scope(s > 0 ? "windscreen left" : "windscreen right", () => {
      const [z0, z1] = s > 0 ? [SCREEN.z[0], SCREEN.z[1]] : [-SCREEN.z[1], -SCREEN.z[0]];
      windowOn(m, at, n, roundRect(z0, z1, SCREEN.y[0], SCREEN.y[1], 0.05), roundRect(z0 + 0.04, z1 - 0.04, SCREEN.y[0] + 0.04, SCREEN.y[1] - 0.04, 0.03), uBreaks(SCREEN.y));
      m.scope("guard", () => {
        const k = 13;
        for (let i = 1; i < k; i++) {
          const z = z0 + ((z1 - z0) * i) / k;
          panel("rubber", rect(z - 0.008, SCREEN.y[0] + 0.03, z + 0.008, SCREEN.y[1] - 0.03), 0.02, 0.045, SCREEN.y);
        }
      });
      m.scope("wiper", () => panel("rubber", [[z0 + 0.3, SCREEN.y[0] + 0.1], [z0 + 0.33, SCREEN.y[0] + 0.07], [z0 + 0.82, SCREEN.y[0] + 0.48], [z0 + 0.79, SCREEN.y[0] + 0.51]], 0.045, 0.06, SCREEN.y));
    });
  // the nose block standing 0.12 m off the face, the twin headlamps on it, the logo above
  m.scope("nose block", () => {
    panel("face", rect(-0.34, 1.6, 0.34, 2.33), -0.02, 0.12, [1.6, 2.33]);
    for (const z of [-0.13, 0.13])
      m.scope(z > 0 ? "headlamp left" : "headlamp right", () => {
        panel("rim", ngon(12, 0.1, 0, z, 2.13), 0.11, 0.135, [2.03, 2.23]);
        panel("lampHead", ngon(12, 0.075, 0, z, 2.13), 0.12, 0.145, [2.05, 2.21]);
      });
    panel("mask", rect(-0.33, 1.92, 0.33, 1.94), 0.115, 0.125, [1.92, 1.94]);
  });
  m.scope("logo", () => panel("white", ngon(12, 0.07, 0, 0, 2.48), 0.003, 0.005, [2.41, 2.55]));
  // the lamp pods at the corners: a headlamp and a marker each
  for (const s of [-1, 1])
    m.scope(s > 0 ? "lamp pod left" : "lamp pod right", () => {
      const [z0, z1] = s > 0 ? [0.9, 1.56] : [-1.56, -0.9];
      panel("mask", roundRect(z0, z1, 1.6, 2.0, 0.04), -0.01, 0.05, [1.6, 2.0]);
      const zh = s * 1.33, zm = s * 1.1;
      panel("rim", ngon(10, 0.075, 0, zh, 1.78), 0.04, 0.06, [1.7, 1.86]);
      panel("lampHead", ngon(10, 0.055, 0, zh, 1.78), 0.045, 0.065, [1.72, 1.84]);
      panel("lampRed", ngon(10, 0.04, 0, zm, 1.78), 0.045, 0.065, [1.74, 1.82]);
    });
  // the flag on the viewer's left (+z), the class and the number below the lamps' line
  m.scope("flag", () => {
    const [z0, z1] = [0.86, 1.28];
    panel("saffron", rect(z0, 2.3, z1, 2.4), 0.003, 0.005, [2.3, 2.4]);
    panel("white", rect(z0, 2.2, z1, 2.3), 0.003, 0.005, [2.2, 2.3]);
    panel("green", rect(z0, 2.1, z1, 2.2), 0.003, 0.005, [2.1, 2.2]);
    panel("navy", ngon(8, 0.035, 0, (z0 + z1) / 2, 2.25), 0.005, 0.007, [2.21, 2.29]);
  });
  m.scope("class", () => {
    const h = 0.15, text = "WAG12B", style = { weight: 0.18, width: 0.62, gap: 0.12 };
    const w = wordWidth(text, h, style), zc = 0.6;
    const tris = letters(text, zc + w / 2, 1.62, h, true, style);
    m.facets("white", tris.map(([u, v]) => at(u, v, 0.006)), n);
  });
  m.scope("number", () => numberOn(m, at, n, l.number, -0.66, 1.695, 0.15, 0.006, true));
}

/** The buffer beam's gear: the buffers, the centre coupler between them, the plough under them. */
function frontGear(m: MeshBuilder): void {
  m.scope("buffers", () => {
    for (const z of [-0.95, 0.95])
      m.scope(z > 0 ? "right" : "left", () => {
        const casing = ngon(12, 0.14, 0, z, HINGE_Y);
        m.sweep("frame", "x", casing, N - 0.01, casing, HALF - 0.3);
        const plunger = ngon(12, 0.09, 0, z, HINGE_Y);
        m.sweep("steel", "x", plunger, HALF - 0.3, plunger, HALF - 0.06);
        m.scope("head", () => m.sweep("underframe", "x", ngon(16, 0.24, 0, z, HINGE_Y), HALF - 0.06, ngon(16, 0.24, 0, z, HINGE_Y), HALF));
      });
  });
  m.scope("coupler", () => centreCoupler(m, 1, N - 0.01, HALF - 0.02, HINGE_Y - 0.03, "underframe"));
  m.scope("plough", () => {
    const sec = (x0: number, x1: number, w: number): Ring => [[x1, -w], [x1, w], [x0, w], [x0, -w]];
    // deep and nearly as wide as the body, its foot reaching forward under the buffers
    m.loft("face", sec(N - 0.1, N + 0.5, 1.45), 0.14, sec(N - 0.1, N + 0.4, 1.52), 1.0);
    m.cap("face", sec(N - 0.1, N + 0.5, 1.45), 0.14, false);
  });
}

// --- the roof ---------------------------------------------------------------------------------

function roof(m: MeshBuilder, raised: boolean): void {
  m.scope("roof hatches", () => {
    const sec = (w: number): Ring => [[N - 2.35, w], [N - 2.35, -w], [XI + 0.25, -w], [XI + 0.25, w]];
    m.loft("roof", sec(1.08), ROOF - 0.01, sec(1.02), ROOF + 0.05);
  });
  m.scope("air conditioning", () => {
    const sec = (w: number): Ring => [[N - 1.0, w], [N - 1.0, -w], [N - 2.05, -w], [N - 2.05, w]];
    m.loft("ac", sec(0.74), ROOF - 0.01, sec(0.7), ROOF + 0.34);
    surfacePanel(m, "louvre", (u, v, d) => [u, v, 0.72 + d], [0, 0, 1], rect(N - 1.95, ROOF + 0.06, N - 1.45, ROOF + 0.26), -0.004, 0.006);
    surfacePanel(m, "louvre", (u, v, d) => [u, v, -0.72 - d], [0, 0, -1], rect(N - 1.95, ROOF + 0.06, N - 1.45, ROOF + 0.26), -0.004, 0.006);
  });
  m.scope("headlamp", () => {
    const body = ngon(12, 0.12, 0, -0.18, ROOF + 0.2), lens = ngon(12, 0.09, 0, -0.18, ROOF + 0.2);
    m.sweep("mask", "x", body, N - 1.2, body, N - 0.93);
    m.sweep("lampHead", "x", lens, N - 0.93, lens, N - 0.91);
  });
  m.scope("horn", () => {
    const stem = ngon(8, 0.04, 0, 0.22, ROOF + 0.2), bell = ngon(8, 0.075, 0, 0.22, ROOF + 0.2);
    m.sweep("mask", "x", stem, N - 1.25, stem, N - 1.1);
    m.sweep("mask", "x", stem, N - 1.1, bell, N - 0.95);
  });
  m.scope("pantograph", () => singleArm(m, { xc: PANTO_X, roofY: ROOF + 0.05, baseY: ROOF + 0.22, h: -1, raised }));
  m.scope("roof gear", () => {
    // the main circuit breaker and the line to the jumper over the joint
    m.scope("circuit breaker", () => {
      m.prism("frame", ngon(8, 0.12, Math.PI / 8, PANTO_X + 2.2, -0.3), ROOF + 0.05, ROOF + 0.22);
      m.prism("insulator", ngon(8, 0.06, 0, PANTO_X + 2.2, -0.3), ROOF + 0.22, ROOF + 0.52);
    });
    for (const x of [PANTO_X + 1.6, XI + 0.7]) m.scope("post insulator", () => insulator(m, x, 0.3, ROOF + 0.05, ROOF + 0.42));
    m.scope("line", () => {
      tubeX(m, "copper", 0.018, XI + 0.7, ROOF + 0.42, 0.3, PANTO_X + 1.6, ROOF + 0.42, 0.3, 6);
      tubeX(m, "copper", 0.018, PANTO_X + 0.6, ROOF + 0.42, 0.3, PANTO_X + 1.6, ROOF + 0.42, 0.3, 6);
    });
    // half the roof jumper's coil hanging toward the coupling plane
    m.scope("jumper", () => tubeX(m, "jumper", 0.035, 0.06, ROOF + 0.3, 0.3, XI + 0.7, ROOF + 0.4, 0.3, 8));
  });
}

// --- the section ----------------------------------------------------------------------------

/** The front section, its cab at +x; the rear one is the same turned about the coupling plane. */
function section(m: MeshBuilder, l: Livery, raised: boolean): void {
  m.scope("body", () => {
    m.scope("shell", () => shell(m));
    m.scope("frame", () => {
      const [a, b, w, k] = [N, XI, W - 0.03, 0.12];
      const r: Ring = [[a, -w + k], [a - k, -w], [b, -w], [b, w], [a - k, w], [a, w - k]];
      m.prism("frame", r, 1.05, Y0, false);
      m.cap("underframe", r, 1.05, false);
      // the buffer beam's black face
      block(m, "mask", N + 0.003, N + 0.015, 1.06, Y0 - 0.01, -W + 0.17, W - 0.17);
    });
    m.scope("equipment", () => {
      block(m, "underframe", MID - 2.35, MID + 2.35, 0.62, 1.05, -1.15, 1.15);
      block(m, "frame", MID - 2.1, MID - 0.6, 0.5, 0.62, -0.9, 0.9);
    });
    // the drawbar half to the coupling plane
    m.scope("drawbar", () => block(m, "underframe", 0.03, XI + 0.01, HINGE_Y - 0.09, HINGE_Y + 0.09, -0.12, 0.12));
  });
  m.scope("sides", () => {
    m.scope("right side", () => sideSkin(m, 1, l, false));
    m.scope("left side", () => sideSkin(m, -1, l, true));
  });
  m.scope("cab", () => {
    cabEnd(m, l);
    m.scope("lower end", () => frontGear(m));
  });
  m.scope("bogies", () => {
    for (const xc of [MID - PIVOT, MID + PIVOT])
      m.scope(xc > MID ? "front bogie" : "rear bogie", () => bogie(m, { xc, halfBase: HALF_BASE, wheelR: WHEEL_R, frameTop: WHEEL_R + 0.25 }));
  });
  m.scope("roof equipment", () => roof(m, raised));
}

/** The bellows duct between the inner ends (z, y). */
const DUCT: Array<[number, number]> = [[-0.22, 1.62], [0.22, 1.62], [0.22, 3.85], [-0.22, 3.85]];

export function irWag12b(v?: ParamValues): MeshBuilder {
  const l = livery(v);
  const m = new MeshBuilder(palette(l));
  articulate({ m }, [
    { x0: XI, x1: HALF, draw: () => m.scope("front section", () => section(m, l, false)) },
    { x0: -HALF, x1: -XI, draw: () => m.scope("rear section", () => m.turned(0, () => section(m, l, true))) },
  ], HINGE_Y, { profile: DUCT, folds: 4, depth: 0.03 }, 8, [0]);
  return m;
}

// --- low level of detail ---------------------------------------------------------------------

/** The two sections for distant views: each body with its cab end and flat inner end, the bogies, the roof boxes, the pantographs. */
export function irWag12bLod(v?: ParamValues): MeshBuilder {
  const l = livery(v);
  const ys = kinks(TIP, HW);
  const setback = ys.map((y) => [y, endPlan(y, lerpTable(HW, y))[3]![1]] as const);
  const flat = [[Y0, XI], [ROOF, XI]] as const;
  // the face's black mask round the windscreens, the sides' over the cab door and window
  const glass = (e: number) => ({ u: [-W + 0.1, W - 0.1] as const, y: [2.62, 3.7] as const, mat: "mask", ends: [e] });
  const cabSide = (e: number) => {
    const [a, b] = [e * (N - 2.82), e * (N - 0.62)].sort((p, q) => p - q) as [number, number];
    return [{ x0: a, x1: b, side: [[Y0, FOOT_LINE, "light"], [FOOT_LINE, 2.86, "body"], [2.86, 3.72, "mask"], [3.72, ROOF_LINE, "body"], [ROOF_LINE, 9, "roof"]] as Band[] }];
  };
  const shellOf = (e: number, k: number): LodShell => ({
    y0: Y0, hw: HW, roof: "roof", side: SIDE, end: END, section: k,
    ...(e > 0
      ? { front: { tip: TIP, setback }, rear: { tip: flat.map(([y, x]) => [y, x] as const), paint: INNER } }
      : { front: { tip: flat.map(([y, x]) => [y, -x] as const), paint: INNER }, rear: { tip: TIP.map(([y, x]) => [y, -x] as const), setback } }),
    endWindows: [glass(e)], cabs: cabSide(e),
  });
  const parts: LodPart[] = [];
  for (const [e, k] of [[1, 0], [-1, 1]] as const) {
    const X = (x: number) => e * x;
    const sorted = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a]);
    parts.push(
      { section: k, draw: (mm) => mm.scope("running gear", () => { for (const xc of [MID - PIVOT, MID + PIVOT]) lodBogie(mm, X(xc), HALF_BASE + WHEEL_R + 0.2, 1.05); }) },
      { section: k, optional: 40, draw: (mm) => mm.scope("frame", () => { const [a, b] = sorted(X(XI), X(N)); lodSideBox(mm, "frame", [[a, 1.05], [b, 1.05], [b, Y0], [a, Y0]], -W + 0.03, W - 0.03); }) },
      { section: k, optional: 20, draw: (mm) => mm.scope("plough", () => { const [a, b] = sorted(X(N - 0.1), X(N + 0.45)); lodSideBox(mm, "face", [[a, 0.14], [b, 0.14], [b, 1.0], [a, 1.0]], -1.45, 1.45); }) },
      { section: k, optional: 15, draw: (mm) => mm.scope("air conditioning", () => { const [a, b] = sorted(X(N - 2.05), X(N - 1.0)); lodRoofBox(mm, "ac", a, b, 0.74, 0.7, ROOF - 0.01, ROOF + 0.34); }) },
      {
        section: k, ...(k === 0 ? { optional: 0 } : {}),
        draw: (mm) => mm.scope(k === 1 ? "raised pantograph" : "folded pantograph", () => lodPantograph(mm, { x: X(PANTO_X), roofY: ROOF + 0.05, baseY: ROOF + 0.22, h: -e, raised: k === 1 })),
      },
    );
  }
  return fitLod({
    palette: palette(l), shells: [shellOf(1, 0), shellOf(-1, 1)], parts,
    sections: { pivots: [[0, 0, 0], [0, HINGE_Y, 0]], joints: [{ sections: [0, 1], front: XI, rear: -XI, profile: DUCT }], maxBendDeg: 8 },
  }, 200);
}
