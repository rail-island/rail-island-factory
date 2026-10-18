// The OpenTTD GRF encoder (src/openttd/grf.ts): its compression, the container
// layout OpenTTD reads, and the action bytes, checked against what nmlc 0.9
// writes for the equivalent NML (docs/site/openttd-export.md).

import { describe, expect, it } from "vitest";
import { daysSinceYearZero, encodeGrf, grfCompress, grfDecompress, GRF_ZOOM, type GrfImage, type GrfPart } from "../src/openttd/grf";
import type { ResolvedVehicle } from "../src/openttd/properties";

function vehicle(extra: Partial<ResolvedVehicle> = {}): ResolvedVehicle {
  return {
    feature: "train", name: "Loco", introYear: 1960, vehicleLife: 30, modelLife: 40, reliabilityDecay: 20,
    costFactor: 120, runningCostFactor: 100, capacity: 0, cargo: "PASS", climates: ["temperate", "arctic", "tropical"],
    railType: "ELRL", refitClasses: [], weight: 87, power: 3000, speed: 120, traction: "electric", tram: false, largeAircraft: false,
    ...extra,
  };
}

function image(zoom: GrfImage["zoom"], w: number, h: number, fill = 0): GrfImage {
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) if (fill && i % 3 === 0) rgba.set([fill, 20, 30, 255], i * 4);
  return { zoom, width: w, height: h, xOffs: -w / 2, yOffs: -h, rgba };
}

function part(id: number, length = 8): GrfPart {
  const dir = () => [image(GRF_ZOOM.in4x, 16, 12, 200), image(GRF_ZOOM.in2x, 8, 6, 100), image(GRF_ZOOM.normal, 4, 3, 50)];
  return { id, length, directions: Array.from({ length: 8 }, dir) };
}

/** The container as OpenTTD reads it: the data section's entries and the sprite section's images. */
function parse(grf: Uint8Array) {
  const v = new DataView(grf.buffer, grf.byteOffset, grf.byteLength);
  expect([...grf.subarray(0, 10)]).toEqual([0x00, 0x00, 0x47, 0x52, 0x46, 0x82, 0x0d, 0x0a, 0x1a, 0x0a]);
  const spriteSection = 14 + v.getUint32(10, true);
  expect(grf[14]).toBe(0); // no compression of the container
  let p = 15;
  const entries: Array<{ type: number; data: Uint8Array }> = [];
  for (;;) {
    const n = v.getUint32(p, true);
    p += 4;
    if (n === 0) break;
    const type = grf[p]!;
    entries.push({ type, data: grf.subarray(p + 1, p + 1 + n) });
    p += 1 + n;
  }
  expect(p).toBe(spriteSection);
  const sprites: Array<{ id: number; type: number; zoom: number; w: number; h: number; x: number; y: number; rgba: Uint8Array }> = [];
  for (;;) {
    const id = v.getUint32(p, true);
    p += 4;
    if (id === 0) break;
    const n = v.getUint32(p, true);
    const type = grf[p + 4]!;
    const zoom = grf[p + 5]!;
    const h = v.getUint16(p + 6, true);
    const w = v.getUint16(p + 8, true);
    const x = v.getInt16(p + 10, true);
    const y = v.getInt16(p + 12, true);
    const rgba = grfDecompress(grf.subarray(p + 14, p + 4 + n), w * h * 4);
    sprites.push({ id, type, zoom, w, h, x, y, rgba });
    p += 4 + n;
  }
  expect(p).toBe(grf.length);
  return { entries, sprites };
}

const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join(" ");

describe("grfCompress", () => {
  it("round-trips any bytes through OpenTTD's decompression", () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) & 0xff;
    for (const src of [
      new Uint8Array(0),
      new Uint8Array(5000),
      Uint8Array.from({ length: 4000 }, () => rnd()),
      Uint8Array.from({ length: 9000 }, (_, i) => (i % 4 === 3 ? 255 : (i >> 6) & 0xff)),
    ]) {
      expect(grfDecompress(grfCompress(src), src.length)).toEqual(src);
    }
  });

  it("packs transparent pixels: 16 bytes in 2", () => {
    expect(grfCompress(new Uint8Array(4096)).length).toBeLessThan(4096 / 7);
  });
});

describe("daysSinceYearZero", () => {
  it("is OpenTTD's long date", () => {
    expect(daysSinceYearZero(1920)).toBe(701265);
    expect(daysSinceYearZero(1960)).toBe(0x0aec63); // nmlc: date(1960,1,1)
  });
});

describe("encodeGrf", () => {
  const set = { grfid: new Uint8Array([0x52, 0x49, 0x01, 0x02]), name: "Test set", description: "Desc", vehicles: [{ vehicle: vehicle(), parts: [part(0x200, 6)] }] };

  it("writes a container OpenTTD reads: header, actions, one sprite per direction at three zooms", () => {
    const { entries, sprites } = parse(encodeGrf(set));
    expect(hex(entries[0]!.data)).toBe(hex(new Uint8Array([entries.length - 1, 0, 0, 0])));
    const actions = entries.filter((e) => e.type === 0xff).map((e) => e.data[0]);
    expect(actions.slice(1)).toEqual([0x14, 0x08, 0x00, 0x00, 0x00, 0x04, 0x01, 0x02, 0x03]);
    expect(entries.filter((e) => e.type === 0xfd)).toHaveLength(8);
    expect(sprites).toHaveLength(24);
    expect(new Set(sprites.map((s) => s.id))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8]));
    expect(sprites.every((s) => s.type === 0x03)).toBe(true);
    expect(sprites.slice(0, 3).map((s) => [s.zoom, s.w, s.h, s.x, s.y])).toEqual([[1, 16, 12, -8, -12], [2, 8, 6, -4, -6], [0, 4, 3, -2, -3]]);
    expect(sprites[0]!.rgba).toEqual(set.vehicles[0]!.parts[0]!.directions[0]![0]!.rgba);
  });

  it("writes the GRF header, the tables and the train's properties as nmlc does", () => {
    const { entries } = parse(encodeGrf(set));
    const pseudo = entries.filter((e) => e.type === 0xff).map((e) => hex(e.data));
    expect(pseudo[1]).toBe("14 43 49 4e 46 4f 42 50 41 4c 53 01 00 44 42 42 4c 54 52 01 00 33 00 00");
    expect(pseudo[2]).toBe(`08 08 52 49 01 02 ${hex(new TextEncoder().encode("Test set"))} 00 44 65 73 63 00`);
    expect(pseudo[3]).toBe("00 08 01 02 00 12 52 41 49 4c 45 4c 52 4c"); // RAIL, ELRL
    expect(pseudo[4]).toBe("00 08 01 01 00 09 50 41 53 53"); // PASS
    // nmlc 0.9 for the same item: climates 07, date 1960, lives, ELRL (1), 120 km/h, 3000 kW = 4023 hp, 87 t, electric.
    expect(pseudo[5]).toBe([
      "00 00 18 01 ff 00 02", "06 07", "2a 63 ec 0a 00", "04 28", "03 1e", "02 14", "07 05", "05 01", "09 78 00", "0b b7 0f",
      "16 57", "24 00", "0e 3c 4c 00 00", "19 28", "0d 64", "17 78", "14 00", "15 00", "28 00 00", "1d 00 00 00 00",
      "29 00 00", "1d 00 00 00 00", "1f 4d", "21 02", "12 fd",
    ].join(" "));
    expect(pseudo[6]).toBe("04 00 7f 01 ff 00 02 4c 6f 63 6f 00"); // name
    expect(pseudo[7]).toBe("01 00 01 ff 08 00"); // one set of 8
    expect(pseudo[8]).toBe("02 00 00 01 01 00 00 00 00");
    expect(pseudo[9]).toBe("03 00 01 ff 00 02 00 00 00");
  });

  // Regression: a GRF's new engine has no tractive effort until the GRF sets it, so
  // with realistic acceleration an exported locomotive barely moved (0 kN in OpenTTD).
  it("gives every train and road vehicle OpenTTD's tractive effort coefficient, 0.3", () => {
    const vehicles = [
      { vehicle: vehicle(), parts: [part(0x200, 6)] },
      { vehicle: vehicle({ feature: "road", speed: 80, power: 200, weight: 12 }), parts: [part(0x300, 5)] },
    ];
    const { entries } = parse(encodeGrf({ ...set, vehicles }));
    const props = entries.filter((e) => e.type === 0xff && e.data[0] === 0x00 && e.data[1] !== 0x08).map((e) => hex(e.data));
    expect(props[0]).toContain(" 1f 4d ");
    expect(props[1]).toContain(" 18 4d ");
  });

  it("chains an articulated vehicle's parts through callback 16", () => {
    const { entries } = parse(encodeGrf({ ...set, vehicles: [{ vehicle: vehicle(), parts: [part(0x200, 8), part(0x201, 8), part(0x202, 4)] }] }));
    const pseudo = entries.filter((e) => e.type === 0xff).map((e) => hex(e.data));
    expect(pseudo[5]).toContain("1e 10"); // the articulated-part callback
    expect(pseudo[6]).toBe("00 00 06 01 ff 01 02 06 00 05 01 0b 00 00 14 00 21 00 12 fd");
    expect(pseudo[7]).toBe("00 00 06 01 ff 02 02 06 00 05 01 0b 00 00 14 00 21 04 12 fd");
    // var 10: part 1 -> 0x201, part 2 -> 0x202, else no more parts (as nmlc's switch)
    expect(pseudo).toContain("02 00 fe 89 10 00 ff 00 00 00 02 01 82 01 00 00 00 01 00 00 00 02 82 02 00 00 00 02 00 00 00 ff ff");
    // var 0C: callback 16 -> the switch above, drawing -> set 0
    expect(pseudo).toContain("02 00 ff 89 0c 00 ff ff 00 00 01 fe 00 16 00 00 00 16 00 00 00 00 00");
    expect(pseudo).toContain("03 00 01 ff 00 02 00 ff 00");
    expect(pseudo).toContain("03 00 01 ff 01 02 00 01 00");
    expect(pseudo).toContain("03 00 01 ff 02 02 00 02 00");
  });

  it("writes road vehicles, ships and aircraft with their own property numbers", () => {
    const vehicles = [
      { vehicle: vehicle({ feature: "road", speed: 80, power: 200, weight: 12, capacity: 60, tram: true }), parts: [part(0x300, 5)] },
      { vehicle: vehicle({ feature: "ship", speed: 30, capacity: 200 }), parts: [part(0x400)] },
      { vehicle: vehicle({ feature: "aircraft", speed: 800, capacity: 150, largeAircraft: true }), parts: [part(0x500)] },
    ];
    const { entries } = parse(encodeGrf({ ...set, vehicles }));
    const props = entries.filter((e) => e.type === 0xff && e.data[0] === 0x00 && e.data[1] !== 0x08).map((e) => hex(e.data));
    // nmlc: speed 80 km/h = a0, 200 kW = 1b (10 hp), 12 t = 30 (1/4 t), length 5 = shorten 3; a tram's flag
    expect(props[0]).toMatch(/^00 01 .. 01 ff 00 03 06 07 1f 63 ec 0a 00 04 28 03 1e 02 14 07 05 08 a0 13 1b 14 30 0a 48 4c 00 00 /);
    expect(props[0]).toContain(" 18 4d 23 03 0e ff ");
    expect(props[0]).toMatch(/1c 01$/);
    // nmlc: 30 km/h = 3c, capacity 200 as a word
    expect(props[1]).toContain(" 0b 3c 0f 64 0a 78 0d c8 00 0c 00 08 ff ");
    // nmlc: 800 km/h = 3e, 150 passengers, 10 mail, a large aeroplane
    expect(props[2]).toContain(" 0c 3e 0e 64 0b 78 0f 96 00 11 0a 09 02 0a 01 08 ff ");
    // an aircraft without a refittable cargo is disabled by OpenTTD: passengers always are
    expect(props[2]).toMatch(/18 01 00 13 00 00 00 00$/);
  });

  it("marks a non-ASCII name as UTF-8", () => {
    const { entries } = parse(encodeGrf({ ...set, name: "Sada ČD" }));
    expect(hex(entries[2]!.data)).toContain("c3 9e 53 61 64 61");
  });

  it("is deterministic", () => {
    expect(encodeGrf(set)).toEqual(encodeGrf(set));
  });

  it("refuses a malformed set", () => {
    expect(() => encodeGrf({ ...set, grfid: new Uint8Array(3) })).toThrow(/four bytes/);
    expect(() => encodeGrf({ ...set, vehicles: [{ vehicle: vehicle(), parts: [] }] })).toThrow(/parts/);
    expect(() => encodeGrf({ ...set, vehicles: [{ vehicle: vehicle({ feature: "ship" }), parts: [part(1), part(2)] }] })).toThrow(/articulate/);
    const bad = part(3);
    bad.directions[0]![0] = { ...bad.directions[0]![0]!, rgba: new Uint8Array(3) };
    expect(() => encodeGrf({ ...set, vehicles: [{ vehicle: vehicle(), parts: [bad] }] })).toThrow(/needs/);
  });
});
