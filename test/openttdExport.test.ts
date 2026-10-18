// The OpenTTD export's pure parts (src/openttd/): the vehicle figures and their
// fallbacks, lengths and ids, the sprite geometry and the pixel filtering; and the
// design check of the `openttd` block (generator/design.ts).

import { describe, expect, it } from "vitest";
import type { CatalogRecord } from "../src/catalogQuery";
import { catalogRecord, metaEntry } from "../generator/catalog";
import { checkOpenttdProperties, type ProceduralDesign } from "../generator/design";
import { ALL_VEHICLES, DESIGNS } from "../generator/generate";
import { downsamplePremultiplied, flipRows, unpremultiply, zoomImages } from "../src/openttd/pixels";
import { HEADINGS, RENDER_ZOOM, applyMatrix, spriteAnchor, spriteViews, vehicleScale, type ModelBox } from "../src/openttd/projection";
import {
  FIRST_LOCAL_ID, LAST_LOCAL_ID, assignIds, defaultOpenttdFields, fnv1a, grfIdOf, openttdFeature, partKey, partLengths, resolveVehicle, variantName,
} from "../src/openttd/properties";

function rec(extra: Partial<CatalogRecord> = {}): CatalogRecord {
  return {
    id: "proc-vehicle-x", title: "Loco X", category: "Rail vehicles", group: "loco", traction: "electric", js: "x.js", thumb: "x.png",
    license: "CC0", author: "Rail Island", source: "Rail Island", thumbUrl: "thumbs/x.png", jsUrl: "js/x.js",
    jsBytes: 1, jsGzipBytes: 1, thumbBytes: 1, triangles: 1, vertices: 3, primitives: 1, materials: 1, sizeX: 16, sizeY: 4, sizeZ: 3, references: [],
    params: [{ name: "livery", title: "Livery", default: "green", values: [{ value: "green", title: "Green" }, { value: "red", title: "Red" }] }],
    game: { weight: 85, power: 3480, maxspeed: 120, accel: null, variants: [{ params: { livery: "red" }, maxspeed: 140 }] },
    ...extra,
  };
}

describe("openttdFeature", () => {
  it("maps the catalog's categories to OpenTTD's vehicle types", () => {
    expect(openttdFeature({ category: "Rail vehicles", group: "loco" })).toBe("train");
    expect(openttdFeature({ category: "Rail vehicles", group: "tram" })).toBe("road");
    expect(openttdFeature({ category: "Road vehicles", group: "bus" })).toBe("road");
    expect(openttdFeature({ category: "Ships", group: "ship" })).toBe("ship");
    expect(openttdFeature({ category: "Aircraft", group: "aircraft" })).toBe("aircraft");
    expect(openttdFeature({ category: "Cable car", group: "cabin" })).toBeNull();
    expect(openttdFeature({ category: "Historical", group: "hist_center" })).toBeNull();
  });
});

describe("resolveVehicle", () => {
  it("fills what a design does not declare from its category", () => {
    const v = resolveVehicle(rec(), {});
    expect(v).toMatchObject({ feature: "train", name: "Loco X", weight: 85, power: 3480, speed: 120, traction: "electric", railType: "ELRL", capacity: 0, introYear: 1960 });
    expect(defaultOpenttdFields({ category: "Rail vehicles", group: "coach" })).toMatchObject({ capacity: 60, cargo: "PASS", railType: "RAIL" });
    expect(resolveVehicle(rec({ group: "coach", traction: undefined, game: { weight: 40, power: 0, maxspeed: 140, accel: null } }), {}).traction).toBeNull();
  });

  it("lets the declared block and its variant win, and the game variant set the running figures", () => {
    const r = rec({ openttd: { introYear: 1984, vehicleLife: 40, variants: [{ params: { livery: "red" }, introYear: 1990 }] } });
    expect(resolveVehicle(r, {})).toMatchObject({ introYear: 1984, vehicleLife: 40, speed: 120 });
    expect(resolveVehicle(r, { livery: "red" })).toMatchObject({ introYear: 1990, vehicleLife: 40, speed: 140, name: "Loco X (Red)" });
  });

  it("knows trams, small aircraft and refuses what OpenTTD cannot hold", () => {
    expect(resolveVehicle(rec({ group: "tram" }), {}).tram).toBe(true);
    expect(resolveVehicle(rec({ category: "Aircraft", group: "aircraft", game: { weight: 1, power: 1, maxspeed: 800, accel: null, sizeClass: "small" } }), {}).largeAircraft).toBe(false);
    expect(resolveVehicle(rec({ category: "Aircraft", group: "aircraft", game: { weight: 1, power: 1, maxspeed: 800, accel: null, sizeClass: "medium" } }), {}).largeAircraft).toBe(true);
    expect(() => resolveVehicle(rec({ category: "Cable car", group: "cabin" }), {})).toThrow(/not a vehicle/);
  });

  it("names a variant after its non-default values", () => {
    expect(variantName(rec(), { livery: "green" })).toBe("Loco X");
    expect(variantName(rec(), { livery: "red" })).toBe("Loco X (Red)");
  });
});

describe("partLengths", () => {
  it("is a metre an eighth, split into parts of at most 8/8, longest first", () => {
    expect(partLengths(4.2, "road")).toEqual([4]);
    expect(partLengths(16.4, "train")).toEqual([8, 8]);
    expect(partLengths(26.4, "train")).toEqual([7, 7, 6, 6]);
    expect(partLengths(0.1, "train")).toEqual([1]);
    expect(partLengths(80, "ship")).toEqual([8]);
    expect(partLengths(70, "aircraft")).toEqual([8]);
    for (const m of [3, 9.7, 17, 25.9, 63]) expect(partLengths(m, "train").reduce((a, b) => a + b, 0)).toBe(Math.round(m));
  });
});

describe("ids", () => {
  it("hashes keys into the local id range, independent of their order", () => {
    const keys = ["a?#0", "b?livery=red#0", "b?livery=red#1", "c?#0"];
    const a = assignIds(keys);
    const b = assignIds([...keys].reverse());
    expect([...a.entries()].sort()).toEqual([...b.entries()].sort());
    for (const id of a.values()) expect(id >= FIRST_LOCAL_ID && id <= LAST_LOCAL_ID).toBe(true);
    expect(new Set(a.values()).size).toBe(keys.length);
  });

  it("keeps a vehicle's id when others are added, and probes on a collision", () => {
    const base = assignIds(["x?#0"]);
    expect(assignIds(["x?#0", "y?#0", "z?#0"]).get("x?#0")).toBe(base.get("x?#0"));
    // force a collision: find a key hashing to the same slot as "x?#0"
    const span = LAST_LOCAL_ID - FIRST_LOCAL_ID + 1;
    let other = "";
    for (let i = 0; !other; i++) if (fnv1a(`k${i}`) % span === fnv1a("x?#0") % span) other = `k${i}`;
    const both = assignIds(["x?#0", other]);
    expect(new Set(both.values()).size).toBe(2);
  });

  it("keys parts by model, sorted values and index; names the GRF after the set", () => {
    expect(partKey("m", { b: "2", a: "1" }, 1)).toBe("m?a=1&b=2#1");
    expect([...grfIdOf("My set")].slice(0, 2)).toEqual([0x52, 0x49]);
    expect(grfIdOf("My set")).toEqual(grfIdOf(" My set "));
    expect(grfIdOf("My set")).not.toEqual(grfIdOf("Other set"));
  });
});

describe("spriteViews", () => {
  const box: ModelBox = { min: [-8.2, 0, -1.5], max: [8.2, 4.4, 1.5] };

  it("keeps the model's proportions: width and length at one scale, height at twice it", () => {
    const k = vehicleScale("train", box, 16);
    expect(k.along).toBeCloseTo(16 / 16.4, 6);
    expect(k.across).toBe(k.along);
    expect(k.up).toBe(2 * k.along);
    const ship = vehicleScale("ship", { min: [-40, 0, -6], max: [40, 20, 6] }, 8, 0.25);
    expect(ship.along).toBeCloseTo(16 / 80, 6);
    expect(ship.sink).toBeCloseTo(0.25 * 20 * 2 * (16 / 80), 6);
  });

  it("draws each part about its own centre, its front ceil(length / 2) ahead", () => {
    const views = spriteViews("train", box, [8, 8]);
    expect(views).toHaveLength(2);
    for (const part of views) expect(part).toHaveLength(8);
    // heading NE (-x): the model's front (max X) lands 4 units ahead of the head's centre
    const ne = views[0]![1]!;
    const [x, y, z] = applyMatrix(ne.model, [box.max[0], 0, 0]);
    expect(x).toBeCloseTo(-4, 6);
    expect(y).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(0, 6);
    // the second part's front is the head's rear: 4 units ahead of its own centre
    const [x2] = applyMatrix(views[1]![1]!.model, [box.max[0] - 8 * (16.4 / 16), 0, 0]);
    expect(x2).toBeCloseTo(-4, 6);
    // the model's right (+Z) lies to the vehicle's right: heading NE (-x, up-right on screen), right is +y (down-right)
    const [, yr] = applyMatrix(ne.model, [0, 0, 1]);
    expect(yr).toBeGreaterThan(0);
  });

  it("frames each image in whole normal-zoom pixels and clips each part to its slice", () => {
    for (const part of spriteViews("train", box, [8, 8])) {
      for (const [d, v] of part.entries()) {
        for (const n of [v.width, v.height, v.xOffs, v.yOffs]) expect(Math.abs(n % RENDER_ZOOM)).toBe(0);
        expect(v.clip).toHaveLength(2);
        const [hx, hy] = HEADINGS[d]!;
        // the centre is kept; points 5 units ahead or behind are clipped
        const kept = (p: [number, number, number]) => v.clip.every((c) => c.normal[0] * p[0] + c.normal[1] * p[1] + c.normal[2] * p[2] + c.constant >= 0);
        expect(kept([0, 0, 0])).toBe(true);
        expect(kept([5 * hx, 5 * hy, 0])).toBe(false);
        expect(kept([-5 * hx, -5 * hy, 0])).toBe(false);
        // the model's corners within the slice land inside clip space
        for (const X of [box.min[0], box.max[0]]) {
          const t = applyMatrix(v.model, [X, box.max[1], box.max[2]]);
          if (!kept(t)) continue;
          const [nx, ny, nz] = applyMatrix(v.projection, t);
          for (const c of [nx, ny, nz]) expect(Math.abs(c)).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("stretches a train's diagonal views by the track metric, not a ship's or aircraft's", () => {
    const train = spriteViews("train", box, [8, 8])[0]!;
    const len = (v: (typeof train)[number]) => {
      const a = applyMatrix(v.model, [box.max[0], 0, 0]);
      const b = applyMatrix(v.model, [box.min[0], 0, 0]);
      return Math.hypot(a[0] - b[0], a[1] - b[1]);
    };
    expect(len(train[0]!) / len(train[1]!)).toBeCloseTo(Math.SQRT2, 6);
    const plane = spriteViews("aircraft", { min: [-20, 0, -18], max: [20, 12, 18] }, [8])[0]!;
    expect(len(plane[0]!) / len(plane[1]!)).toBeCloseTo(1, 6);
  });

  // Regression: OpenTTD draws a vehicle's sprite from a corner of its bounding
  // box, not from its position, so trains sat beside the rails and an articulated
  // coach's 7/8 and 6/8 slices did not line up (OpenTTD 13.4 Train::UpdateDeltaXY).
  it("counts the offsets from OpenTTD's sprite anchor", () => {
    expect(spriteAnchor("train", 1, 8)).toEqual([-3, -1]); // NE: 1 - (8 + 1) / 2
    expect(spriteAnchor("train", 1, 7)).toEqual([-3, -1]);
    expect(spriteAnchor("train", 1, 6)).toEqual([-2, -1]);
    expect(spriteAnchor("train", 5, 6)).toEqual([-4, -1]); // SW: 1 + (6 + 1) / 2 - 8
    expect(spriteAnchor("train", 3, 8)).toEqual([-1, -3]); // SE
    expect(spriteAnchor("train", 7, 5)).toEqual([-1, -2]); // NW
    expect(spriteAnchor("train", 0, 8)).toEqual([-1, -1]); // N, full length
    expect(spriteAnchor("train", 2, 4)).toEqual([1, -3]); // E, half_shorten 2 against (-1, +1)
    expect(spriteAnchor("road", 1, 6)).toEqual([-3, -1]);
    expect(spriteAnchor("road", 7, 6)).toEqual([-1, -3]);
    expect(spriteAnchor("ship", 3, 8)).toEqual([-3, -16]);
    expect(spriteAnchor("aircraft", 4, 8)).toEqual([-1, -1]);
    // undoing the anchor, every part's frame holds the part's own position (its centre
    // on the rail) and stays on whole normal-zoom pixels
    const box: ModelBox = { min: [-13, 0, -1.4], max: [13, 4.6, 1.4] };
    const views = spriteViews("train", box, [7, 7, 6, 6]);
    for (const [k, len] of [7, 7, 6, 6].entries()) {
      for (const [d, v] of views[k]!.entries()) {
        const [ax, ay] = spriteAnchor("train", d, len);
        const left = v.xOffs + RENDER_ZOOM * 2 * (ay - ax);
        const top = v.yOffs + RENDER_ZOOM * (ax + ay);
        expect(left).toBeLessThanOrEqual(0);
        expect(left + v.width).toBeGreaterThanOrEqual(0);
        expect(top).toBeLessThanOrEqual(0);
        expect(top + v.height).toBeGreaterThanOrEqual(0);
        expect(Math.abs(v.xOffs % RENDER_ZOOM)).toBe(0);
        expect(Math.abs(v.yOffs % RENDER_ZOOM)).toBe(0);
      }
    }
  });

  it("does not slice a ship or aircraft", () => {
    const views = spriteViews("aircraft", { min: [-20, 0, -18], max: [20, 12, 18] }, [8]);
    expect(views).toHaveLength(1);
    expect(views[0]!.every((v) => v.clip.length === 0)).toBe(true);
  });
});

describe("pixels", () => {
  it("box-filters premultiplied colour and unpremultiplies it", () => {
    // a 2x2 block: one opaque red pixel, three transparent
    const src = new Uint8Array([200, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const half = downsamplePremultiplied(src, 2, 2, 2);
    expect([...half]).toEqual([50, 0, 0, 64]);
    expect([...unpremultiply(half)]).toEqual([199, 0, 0, 64]);
    expect([...unpremultiply(new Uint8Array([9, 9, 9, 0]))]).toEqual([0, 0, 0, 0]);
  });

  it("flips rows and makes the three zoom levels with matching offsets", () => {
    expect([...flipRows(new Uint8Array([1, 1, 1, 1, 2, 2, 2, 2]), 1, 2)]).toEqual([2, 2, 2, 2, 1, 1, 1, 1]);
    const view = { model: [], projection: [], clip: [], width: 8, height: 4, xOffs: -4, yOffs: -8 };
    const frame = new Uint8Array(16 * 8 * 4).fill(255);
    const [z4, z2, z1] = zoomImages(frame, view, 2);
    expect([z4!.zoom, z4!.width, z4!.height, z4!.xOffs, z4!.yOffs]).toEqual([1, 8, 4, -4, -8]);
    expect([z2!.zoom, z2!.width, z2!.height, z2!.xOffs, z2!.yOffs]).toEqual([2, 4, 2, -2, -4]);
    expect([z1!.zoom, z1!.width, z1!.height, z1!.xOffs, z1!.yOffs]).toEqual([0, 2, 1, -1, -2]);
    expect(z1!.rgba.every((b) => b === 255)).toBe(true);
  });
});

describe("checkOpenttdProperties", () => {
  const design = (openttd: ProceduralDesign["openttd"]): ProceduralDesign => ({
    id: "d", title: "D", build: () => { throw new Error("unused"); }, buildLod: () => { throw new Error("unused"); },
    params: [{ name: "livery", title: "Livery", default: "a", values: [{ value: "a", title: "A" }, { value: "b", title: "B" }] }],
    openttd,
  });

  it("accepts a valid block and no block", () => {
    expect(() => checkOpenttdProperties(design(undefined), true)).not.toThrow();
    expect(() => checkOpenttdProperties(design({ introYear: 1984, cargo: "PASS", climates: ["arctic"], refitClasses: ["bulk"], variants: [{ params: { livery: "b" }, capacity: 10 }] }), true)).not.toThrow();
  });

  it("refuses a building's block, bad figures, labels and variants", () => {
    expect(() => checkOpenttdProperties(design({ introYear: 1984 }), false)).toThrow(/vehicles only/);
    expect(() => checkOpenttdProperties(design({ vehicleLife: 300 }), true)).toThrow(/vehicleLife/);
    expect(() => checkOpenttdProperties(design({ costFactor: 1.5 }), true)).toThrow(/costFactor/);
    expect(() => checkOpenttdProperties(design({ cargo: "PASSENGERS" }), true)).toThrow(/cargo/);
    expect(() => checkOpenttdProperties(design({ climates: ["moon" as never] }), true)).toThrow(/climate/);
    expect(() => checkOpenttdProperties(design({ variants: [{ params: { livery: "a" } }] }), true)).toThrow(/default/);
    expect(() => checkOpenttdProperties(design({ variants: [{ params: { livery: "z" } }] }), true)).toThrow(/does not resolve/);
    expect(() => checkOpenttdProperties(design({ variants: [{ params: { livery: "b" } }, { params: { livery: "b" } }] }), true)).toThrow(/twice/);
    expect(() => checkOpenttdProperties(design({ speed: 3 } as never), true)).toThrow(/unknown field/);
  });
});

describe("the openttd block in the build", () => {
  it("passes the check on every vehicle that declares one", () => {
    const declared = ALL_VEHICLES.filter((d) => d.openttd);
    expect(declared.length).toBeGreaterThan(0);
    for (const d of declared) expect(() => checkOpenttdProperties(d, true)).not.toThrow();
  });

  it("reaches the site's catalog record but not the game's meta entry", () => {
    const d = DESIGNS.get("proc-vehicle-cd-163")!;
    const entry = metaEntry(d);
    expect("openttd" in entry).toBe(false);
    const facts = { jsBytes: 1, jsGzipBytes: 1, thumbBytes: 1, triangles: 1, vertices: 3, primitives: 1, materials: 1, min: [0, 0, 0] as [number, number, number], max: [1, 1, 1] as [number, number, number] };
    expect(catalogRecord(entry, facts, [], d.openttd).openttd).toEqual(d.openttd);
    expect("openttd" in catalogRecord(entry, facts, [])).toBe(false);
  });
});
