// The site's export list (src/exportList.ts) and its store-only ZIP writer
// (src/zip.ts).

import { describe, expect, it } from "vitest";
import type { CatalogRecord } from "../src/catalogQuery";
import {
  DEFAULT_SET_NAME, EMPTY_EXPORT, EXPORT_VERSION, addEntry, entryFor, entryKey, glbFileName, hasEntry, parseExport, removeEntry, safeName,
  serializeExport, variantLabel, type ExportState,
} from "../src/exportList";
import { crc32, zipStore } from "../src/zip";

function rec(id: string, extra: Partial<CatalogRecord> = {}): CatalogRecord {
  return {
    id, title: id.toUpperCase(), category: "Rail vehicles", group: "loco", js: `${id}.js`, thumb: `${id}.png`,
    license: "CC0", author: "Rail Island", source: "Rail Island", thumbUrl: `thumbs/${id}.png`, jsUrl: `js/${id}.js`,
    jsBytes: 1, jsGzipBytes: 1, thumbBytes: 1, triangles: 1, vertices: 3, primitives: 1, materials: 1, sizeX: 1, sizeY: 1, sizeZ: 1, references: [],
    ...extra,
  };
}

const LIVERY = { name: "livery", title: "Livery", default: "green", values: [{ value: "green", title: "Green" }, { value: "red", title: "Red & white" }] };
const RECORDS = [rec("loco", { params: [LIVERY] }), rec("coach")];

describe("the export list", () => {
  it("adds a variant once, keeps other variants of the same model, removes by identity", () => {
    let s = addEntry(EMPTY_EXPORT, entryFor(RECORDS[0]!, {}));
    s = addEntry(s, entryFor(RECORDS[0]!, { livery: "green" })); // the default again: no-op
    s = addEntry(s, entryFor(RECORDS[0]!, { livery: "red" }));
    expect(s.entries).toEqual([{ id: "loco", params: {} }, { id: "loco", params: { livery: "red" } }]);
    expect(hasEntry(s.entries, { id: "loco", params: { livery: "red" } })).toBe(true);
    s = removeEntry(s, { id: "loco", params: {} });
    expect(s.entries).toEqual([{ id: "loco", params: { livery: "red" } }]);
    expect(entryKey({ id: "m", params: { b: "2", a: "1" } })).toBe("m?a=1&b=2");
  });

  it("round-trips through storage and drops what the catalog no longer has", () => {
    const state: ExportState = { name: "My set", entries: [{ id: "loco", params: { livery: "red" } }, { id: "coach", params: {} }] };
    expect(parseExport(serializeExport(state), RECORDS)).toEqual({ state, dropped: 0 });
    const stale = JSON.stringify({
      version: EXPORT_VERSION, name: "Old",
      entries: [
        { id: "gone", params: {} },
        { id: "loco", params: { livery: "blue" } },
        { id: "loco", params: { livery: "green" } }, // a default value stored: not what an entry holds
        { id: "loco", params: { colour: "red" } },
        { id: "coach", params: {} },
        { id: "coach", params: {} },
      ],
    });
    expect(parseExport(stale, RECORDS)).toEqual({ state: { name: "Old", entries: [{ id: "coach", params: {} }] }, dropped: 5 });
  });

  it("starts empty on nothing, garbage or another version", () => {
    for (const raw of [null, "", "{", JSON.stringify({ version: 99, name: "x", entries: [] }), JSON.stringify({ version: EXPORT_VERSION })]) {
      expect(parseExport(raw, RECORDS)).toEqual({ state: EMPTY_EXPORT, dropped: 0 });
    }
    expect(parseExport(JSON.stringify({ version: EXPORT_VERSION, name: " ", entries: [] }), RECORDS).state.name).toBe(DEFAULT_SET_NAME);
  });

  it("names files and labels variants", () => {
    expect(glbFileName({ id: "loco", params: {} })).toBe("loco.glb");
    expect(glbFileName({ id: "loco", params: { livery: "red", cars: "3" } })).toBe("loco--cars-3--livery-red.glb");
    expect(safeName("Sada CD / 2026")).toBe("Sada_CD_2026");
    expect(safeName("///")).toBe("export");
    expect(variantLabel(RECORDS[0], { id: "loco", params: { livery: "red" } })).toBe("Livery: Red & white");
    expect(variantLabel(RECORDS[0], { id: "loco", params: {} })).toBe("");
  });
});

describe("zipStore", () => {
  it("computes the CRC-32 a ZIP stores", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("writes stored entries a reader can list and extract", () => {
    const files = [
      { name: "a.glb", data: new Uint8Array([1, 2, 3]) },
      { name: "ČD.glb", data: new Uint8Array(1000).fill(7) },
    ];
    const zip = zipStore(files);
    const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const eocd = zip.length - 22;
    expect(v.getUint32(eocd, true)).toBe(0x06054b50);
    expect(v.getUint16(eocd + 10, true)).toBe(2);
    let p = v.getUint32(eocd + 16, true);
    for (const f of files) {
      expect(v.getUint32(p, true)).toBe(0x02014b50);
      const nameLen = v.getUint16(p + 28, true);
      expect(new TextDecoder().decode(zip.subarray(p + 46, p + 46 + nameLen))).toBe(f.name);
      expect(v.getUint32(p + 16, true)).toBe(crc32(f.data));
      const local = v.getUint32(p + 42, true);
      expect(v.getUint32(local, true)).toBe(0x04034b50);
      expect(v.getUint16(local + 8, true)).toBe(0); // stored
      const start = local + 30 + v.getUint16(local + 26, true);
      expect(zip.subarray(start, start + f.data.length)).toEqual(f.data);
      p += 46 + nameLen;
    }
    expect(zipStore(files)).toEqual(zip);
    expect(() => zipStore([files[0]!, files[0]!])).toThrow(/duplicate/);
  });
});
