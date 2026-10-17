// The contact sheet (generator/contactSheet.ts): many thumbnails on one labelled
// PNG for the chat, and the sources it expands - ids, prefixes, parameters, variants.

import { describe, expect, it } from "vitest";
import { PNG } from "pngjs";
import { composeSheet, expandSources, varyCombinations, wrap } from "../generator/contactSheet";
import { MeshBuilder } from "../generator/meshBuilder";
import type { ProceduralDesign } from "../generator/design";

/** A solid `w` x `h` image of one colour. */
function solid(w: number, h: number, rgb: [number, number, number]): PNG {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h; i++) png.data.set([...rgb, 255], i * 4);
  return png;
}

const px = (png: PNG, x: number, y: number) => [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];

const design = (id: string, params?: ProceduralDesign["params"]): ProceduralDesign =>
  ({ id, title: id, build: () => new MeshBuilder({}), buildLod: () => new MeshBuilder({}), params });

const DESIGNS = new Map<string, ProceduralDesign>([
  ["proc-a-1", design("proc-a-1", [
    { name: "colour", title: "Colour", values: [{ value: "red", title: "Red" }, { value: "blue", title: "Blue" }], default: "red" },
    { name: "size", title: "Size", values: [{ value: "s", title: "S" }, { value: "l", title: "L" }], default: "s" },
  ])],
  ["proc-a-2", design("proc-a-2")],
  ["proc-b-1", design("proc-b-1")],
]);

describe("the contact sheet", () => {
  it("lays tiles out in a grid on an opaque background, each one labelled", () => {
    const tiles = [0, 1, 2].map((i) => ({ label: `tile-${i}`, png: solid(100, 100, [200, 0, 0]) }));
    const sheet = composeSheet(tiles, { cols: 2, cell: 100 });
    // two columns of 100 px with 12 px gutters; every pixel opaque
    expect(sheet.width).toBe(2 * 100 + 3 * 12);
    expect([...sheet.data].filter((_, i) => i % 4 === 3).every((a) => a === 255)).toBe(true);
    // the first tile is drawn at its full size in the first cell
    expect(px(sheet, 12 + 50, 12 + 50)).toEqual([200, 0, 0, 255]);
    // and a label is drawn under it (some dark text pixel)
    let dark = false;
    for (let y = 12 + 100 + 12; y < 12 + 100 + 12 + 18; y++) {
      for (let x = 12; x < 112; x++) if (px(sheet, x, y)[0]! < 100) dark = true;
    }
    expect(dark).toBe(true);
  });

  it("draws side views at one shared scale, so their lengths compare", () => {
    const long = { label: "long", png: solid(400, 50, [0, 0, 200]), side: true };
    const short = { label: "short", png: solid(200, 50, [0, 0, 200]), side: true };
    const sheet = composeSheet([long, short], { cols: 2, cell: 200 });
    const blueRun = (x0: number) => {
      let n = 0;
      for (let x = x0; x < x0 + 200; x++) if (px(sheet, x, 12 + 24)[2] === 200) n++;
      return n;
    };
    expect(blueRun(12)).toBe(200); // the long one halved to fit
    expect(blueRun(12 + 200 + 12)).toBe(100); // the short one at the same half scale
  });

  it("leaves the label row out when no tile has a label", () => {
    const tile = (label: string) => ({ label, png: solid(100, 100, [200, 0, 0]) });
    expect(composeSheet([tile("")], { cell: 100 }).height).toBe(12 + 100 + 12 + 12 + 12);
    expect(composeSheet([tile("a")], { cell: 100 }).height).toBe(12 + 100 + 12 + 18 + 12 + 12);
  });

  it("is deterministic", () => {
    const tiles = [{ label: "a", png: solid(64, 64, [10, 20, 30]) }];
    expect(PNG.sync.write(composeSheet(tiles))).toEqual(PNG.sync.write(composeSheet(tiles)));
  });

  it("wraps long labels after a space or a dash", () => {
    expect(wrap("proc-vehicle-cd-150 livery=red", 14)).toEqual(["proc-vehicle-", "cd-150", "livery=red"]);
  });
});

describe("the contact sheet's sources", () => {
  it("expands ids, prefixes, parameters and files in order", () => {
    expect(expandSources(["proc-a*", "proc-b-1?", "x.png"], DESIGNS).map((s) => s.label))
      .toEqual(["proc-a-1", "proc-a-2", "proc-b-1 (default)", "x.png"]);
    expect(expandSources(["proc-a-1?size=l"], DESIGNS)).toEqual([
      { label: "proc-a-1 size=l", id: "proc-a-1", params: { colour: "red", size: "l" } },
    ]);
  });

  it("expands every variant, or only the parameters asked for", () => {
    expect(expandSources(["proc-a-1"], DESIGNS, true)).toHaveLength(4);
    expect(varyCombinations(DESIGNS.get("proc-a-1")!, ["colour"]))
      .toEqual([{ colour: "red", size: "s" }, { colour: "blue", size: "s" }]);
    // a fixed design is one tile either way
    expect(expandSources(["proc-a-2"], DESIGNS, ["colour"])).toHaveLength(1);
  });

  it("rejects an unknown id, prefix or parameter", () => {
    expect(() => expandSources(["proc-z"], DESIGNS)).toThrow(/no procedural model/);
    expect(() => expandSources(["proc-z*"], DESIGNS)).toThrow(/starts with/);
    expect(() => expandSources(["proc-a-1?wheels=3"], DESIGNS)).toThrow(/unknown parameter/);
    expect(() => expandSources(["proc-a-1"], DESIGNS, ["wheels"])).toThrow(/no parameter "wheels"/);
  });
});
