// The general hospital (docs/models/hospital.md): the building budget, a grounded and
// deterministic model with no z-fighting, and the rooftop helipad the export measures
// (docs/models/game-properties.md, "Helipads").

import { describe, expect, it } from "vitest";
import { HOSPITALS, HOSPITAL_HELIPAD } from "../generator/hospital";
import { DESIGNS } from "../generator/generate";
import { HELIPAD_D } from "../generator/design";
import { exportMeta } from "../generator/catalog";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { isDraft } from "../generator/workshop";
import { proceduralId } from "../generator/modelId";

describe("hospital", () => {
  const d = DESIGNS.get("proc-building-hospital")!;

  it("is registered as a draft building in its own family", () => {
    expect(HOSPITALS.map((h) => proceduralId(h.id))).toEqual(["proc-building-hospital"]);
    expect(d).toBe(HOSPITALS[0]);
    expect(isDraft(d.id)).toBe(true);
  });

  it("stays within the building budget, grounded, deterministic and free of z-fighting", () => {
    const m = d.build();
    const glb = m.toGlb("hospital");
    expect(m.triangleCount()).toBeGreaterThan(2000);
    expect(m.triangleCount()).toBeLessThanOrEqual(10000);
    expect(Buffer.from(glb).equals(Buffer.from(d.build().toGlb("hospital")))).toBe(true);
    expect(findCoplanarOverlaps(glb)).toEqual([]);
    expect(glbStats(glb).min[1]).toBe(0);
    const low = buildLodModel(d);
    expect(low.triangleCount()).toBeLessThanOrEqual(100);
    expect(findCoplanarOverlaps(low.toGlb("hospital"))).toEqual([]);
  });

  it("exports a small pad on the raised rooftop deck, at least HELIPAD_D.small across", () => {
    const pad = exportMeta([d]).buildings[0]!.game!.helipad!;
    expect(pad).toEqual({ pad: "small", centre: [HOSPITAL_HELIPAD.x, HOSPITAL_HELIPAD.y1, HOSPITAL_HELIPAD.z], size: HOSPITAL_HELIPAD.side });
    expect(pad.size).toBeGreaterThanOrEqual(HELIPAD_D.small);
    // above the ward block's parapet; only the stair core and the flues rise higher
    const m = d.build();
    const tops = m.positions().filter((_, i) => i % 3 === 1).sort((a, b) => b - a);
    expect(pad.centre[1]).toBeGreaterThan(25.5);
    expect(tops[0]! - pad.centre[1]).toBeLessThan(3);
    // the low detail keeps the deck in the same place and size
    const lp = buildLodModel(d).materialPositions("helipad");
    const xs = lp.filter((_, i) => i % 3 === 0);
    expect(Math.min(...xs)).toBeCloseTo(HOSPITAL_HELIPAD.x - HOSPITAL_HELIPAD.side / 2, 5);
    expect(Math.max(...xs)).toBeCloseTo(HOSPITAL_HELIPAD.x + HOSPITAL_HELIPAD.side / 2, 5);
  });
});
