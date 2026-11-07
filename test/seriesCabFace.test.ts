import { describe, it, expect } from "vitest";
import { DE_UNITS, VT98 } from "../generator/deUnits.ts";
import { DE1, MAT46, NL_UNITS } from "../generator/nlUnits.ts";
import { FR_UNITS, MI09, X3800 } from "../generator/frUnits.ts";
import { DELHI_METRO, IN_UNITS } from "../generator/inUnits.ts";
import { ES_UNITS, TALGO_III } from "../generator/esUnits.ts";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import type { ProceduralDesign } from "../generator/design.ts";
import type { ShinkansenSeries } from "../generator/shinkansen.ts";

// the series kit's cab faces (generator/seriesCab.ts, docs/models/shinkansen.md) on the
// units that had the generic short nose with the windscreens on its crown
// rake: how far the face's top at the panes may stand behind its foot (default 0.5 m, an upright face)
const CASES: Array<{ design: ProceduralDesign; series: ShinkansenSeries; panes: number; single: boolean; rake?: number }> = [
  { design: DE_UNITS.find((d) => d.id === "proc-vehicle-db-vt98")!, series: VT98, panes: 2, single: true },
  { design: NL_UNITS.find((d) => d.id === "proc-vehicle-ns-mat46")!, series: MAT46, panes: 5, single: false },
  { design: NL_UNITS.find((d) => d.id === "proc-vehicle-ns-de1")!, series: DE1, panes: 5, single: true },
  { design: FR_UNITS.find((d) => d.id === "proc-vehicle-sncf-x3800")!, series: X3800, panes: 4, single: true },
  { design: FR_UNITS.find((d) => d.id === "proc-vehicle-ratp-mi09")!, series: MI09, panes: 1, single: false, rake: 0.75 },
  { design: IN_UNITS.find((d) => d.id === "proc-vehicle-dmrc-rs1")!, series: DELHI_METRO, panes: 3, single: false },
  // the Talgo III's tail car: no windscreen at all
  { design: ES_UNITS.find((d) => d.id === "proc-vehicle-talgo-iii")!, series: TALGO_III, panes: 0, single: false },
];

function points(d: ProceduralDesign) {
  const m = d.build({});
  const glb = m.toGlb("test");
  const { json, bin } = parseGlb(glb);
  return { m, glb, pts: collectTriangles(json, bin).flatMap((t) => t.p) };
}

function ids(d: ProceduralDesign): string[] {
  const out: string[] = [];
  const walk = (n: any) => { out.push(n.id); for (const k of n.children ?? []) walk(k); };
  walk(d.build({}).sourceTree(d.id, d.title).root);
  return out;
}

describe("series cab faces", () => {
  for (const c of CASES) {
    it(`${c.design.id}: a cab face with its panes in place of the crown windscreen, no coplanar faces`, () => {
      const tree = ids(c.design);
      const ends = c.single ? ["cab-face", "rear-cab-face"] : ["cab-face"];
      for (const e of ends) expect(tree.filter((id) => new RegExp(`(^|/)${e}/skin/pane-\\d+$`).test(id)), e).toHaveLength(c.panes);
      expect(tree.some((id) => /(^|\/)windscreen(\/|$)/.test(id))).toBe(false);
      const { glb } = points(c.design);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

    it(`${c.design.id}: the face stands at the car's end, upright at the windscreens (not a hood behind a low tip)`, () => {
      const { pts } = points(c.design);
      const s = c.series;
      const maxX = Math.max(...pts.map((p) => p[0]!));
      const front = (y0: number, y1: number) => Math.max(...pts.filter((p) => p[1]! >= y0 && p[1]! <= y1 && Math.abs(p[2]!) < 0.9).map((p) => p[0]!));
      // the coupling plane lies the buffers' or the coupler's reach ahead of the face; the face's top at the panes stays within 0.5 m of its foot
      // above a buffer beam
      const foot = front(Math.max(s.A + 0.2, 1.35), s.A + 0.8);
      const top = s.cabFace!.panes.length ? Math.max(...s.cabFace!.panes.map((p) => p.y[1])) : 2.6;
      expect(foot - front(top - 0.3, top)).toBeLessThan(c.rake ?? 0.5);
      expect(maxX - foot).toBeLessThan(0.9);
    });
  }

  it("sets the Picasso's driver in a turret on the roof, off to one side, in the full and the distant model", () => {
    const d = FR_UNITS.find((x) => x.id === "proc-vehicle-sncf-x3800")!;
    const { pts } = points(d);
    const top = Math.max(...pts.map((p) => p[1]!));
    expect(top).toBeGreaterThan(X3800.C + 0.5);
    const high = pts.filter((p) => p[1]! > X3800.C + 0.3);
    // off to one side: all of it on one side of the roof's middle
    expect(Math.min(...high.map((p) => p[2]!))).toBeGreaterThan(0);
    // near the front end
    expect(Math.min(...high.map((p) => p[0]!))).toBeGreaterThan(X3800.endLength / 2 - 4.5);
    expect(ids(d).filter((id) => /turret\/(front|rear)-windscreen$/.test(id))).toHaveLength(2);
    const lod = d.buildLod({}).toGlb("lod");
    const { json, bin } = parseGlb(lod);
    expect(Math.max(...collectTriangles(json, bin).flatMap((t) => t.p).map((p) => p[1]!))).toBeGreaterThan(X3800.C + 0.5);
  });

  it("flutes the Talgo III's stainless sides below and above the red band and ribs its roof", () => {
    const d = ES_UNITS.find((x) => x.id === "proc-vehicle-talgo-iii")!;
    const tree = ids(d);
    for (const side of ["right-side", "left-side"]) expect(tree.filter((id) => new RegExp(`^body/${side}/fluting`).test(id)).length, side).toBeGreaterThan(0);
    expect(tree.some((id) => /(^|\/)roof-ribs$/.test(id))).toBe(true);
    // ribs in both bands: some fluting scopes low on the stainless skirt, some over the windows
    const tri = d.build({}).sourceTree(d.id, d.title).root;
    const ys: number[] = [];
    const walk = (n: any) => { if (/^body\/right-side\/fluting/.test(n.id) && n.min && n.max) ys.push(n.min[1], n.max[1]); for (const k of n.children ?? []) walk(k); };
    walk(tri);
    expect(Math.min(...ys)).toBeLessThan(1.1);
    expect(Math.max(...ys)).toBeGreaterThan(2.8);
  });

  it("curves the Picasso's turret windscreens over its rounded top and louvres its engine room", () => {
    const d = FR_UNITS.find((x) => x.id === "proc-vehicle-sncf-x3800")!;
    const root = d.build({}).sourceTree(d.id, d.title).root;
    let screenTop = 0;
    const walk = (n: any) => { if (/turret\/front-windscreen$/.test(n.id)) screenTop = n.max[1]; for (const k of n.children ?? []) walk(k); };
    walk(root);
    // past the upright part (the top's radius below the turret's top)
    expect(screenTop).toBeGreaterThan(4.3 - 0.3 + 0.1);
    expect(ids(d).filter((id) => /^grilles/.test(id)).length).toBeGreaterThan(0);
  });

  it("hangs a single axle's horn guides up into the body: no gap over the wheels", () => {
    for (const c of CASES.filter((x) => x.series.wheelbase === 0)) {
      const { m, pts } = points(c.design);
      for (const sp of m.rig!.supports!) {
        const near = pts.filter((p) => Math.abs(p[0]! - sp.x) < 0.35 && Math.abs(p[2]!) >= 0.9 && Math.abs(p[2]!) <= 1.06);
        expect(Math.max(...near.map((p) => p[1]!)), `${c.design.id} at ${sp.x}`).toBeGreaterThanOrEqual(c.series.A);
      }
    }
  });
});

// drawCabFace records a face's skin once and replays it into later builds with the same face,
// end and paint (generator/seriesCab.ts, SKINS): a replayed build must be byte-identical to one
// that works the face out afresh (a copy of the face spec misses the cache).
describe("cab face skin replay", () => {
  it("builds the same bytes from a replayed skin as from a fresh one", async () => {
    const { E6, N700S, buildSeries, seriesParams } = await import("../generator/shinkansen.ts");
    for (const s of [E6, N700S]) {
      const params = seriesParams(s);
      for (const v of [{ unit: "endCar" }, { unit: "train", cars: "3" }] as Array<Record<string, string>>) {
        const first = buildSeries(s, params, v).toGlb("replay");
        const again = buildSeries(s, params, v).toGlb("replay");
        const fresh = buildSeries({ ...s, cabFace: { ...s.cabFace! } }, params, v).toGlb("replay");
        expect(Buffer.from(again).equals(Buffer.from(first))).toBe(true);
        expect(Buffer.from(fresh).equals(Buffer.from(first))).toBe(true);
      }
    }
  });
});
