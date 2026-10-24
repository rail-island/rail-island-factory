// The build's thumbnails (generator/renderGlbThumb.ts): a road or rail vehicle in
// the game's side view -- orthographic, nose on the left, a fixed scale and a
// fixed height window from just below the rail -- and everything else in the
// square three-quarter view.

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MeshBuilder } from "../generator/meshBuilder";
import {
  SIDE_BOTTOM_M, SIDE_MARGIN_M, SIDE_PX_PER_M, SIDE_TOP_M, glbSideFrame, renderGlbSideThumb, renderGlbThumb, sideFrame,
} from "../generator/renderGlbThumb";
import { isSideViewCategory } from "../generator/catalog";
import { RAIL_COLLECTOR_TOP, TRAM_COLLECTOR_TOP } from "../generator/collector";

/** A 10 m long grey body standing 0.5 m above the rail, its nose (+X) painted red. */
function testVehicle(): string {
  const m = new MeshBuilder({ body: { color: "#808080" }, nose: { color: "#ff0000" } });
  m.box("body", -0.25, 0, 9.5, 2, 0.5, 3);
  m.box("nose", 4.75, 0, 0.5, 2.2, 0.5, 3.2);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-thumb-"));
  const file = path.join(dir, "v.glb");
  fs.writeFileSync(file, m.toGlb("test", "vehicle"));
  return file;
}

const alpha = (png: { width: number; data: Uint8Array }, x: number, y: number) => png.data[(y * png.width + x) * 4 + 3]!;

describe("the side view", () => {
  it("reaches above every raised collector, so no pantograph is cut off", () => {
    expect(SIDE_TOP_M).toBeGreaterThan(Math.max(RAIL_COLLECTOR_TOP, TRAM_COLLECTOR_TOP));
  });

  it("is framed as the game frames its own: a fixed scale and height window", () => {
    const glb = testVehicle();
    const { png, frame } = renderGlbSideThumb(glb);
    expect(frame).toEqual({ widthM: 10 + 2 * SIDE_MARGIN_M, heightM: SIDE_TOP_M - SIDE_BOTTOM_M, bottomM: SIDE_BOTTOM_M });
    expect(png.width).toBe(Math.round(frame.widthM * SIDE_PX_PER_M));
    expect(png.height).toBe(Math.round(frame.heightM * SIDE_PX_PER_M));
    // The frame alone, without rendering, is the same.
    expect(glbSideFrame(glb)).toEqual(frame);
    // A longer vehicle keeps the scale; the height never changes.
    expect(sideFrame(0, 25).height).toBe(png.height);
    expect(sideFrame(0, 25).width / sideFrame(0, 25).widthM).toBeCloseTo(SIDE_PX_PER_M, 1);
  });

  it("puts the nose on the left and the rail on a fixed line", () => {
    const { png } = renderGlbSideThumb(testVehicle());
    let redX = 0;
    let red = 0;
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const o = (y * png.width + x) * 4;
        if (png.data[o + 3]! > 200 && png.data[o]! > 3 * png.data[o + 1]!) {
          redX += x;
          red++;
        }
      }
    }
    expect(red).toBeGreaterThan(0);
    expect(redX / red).toBeLessThan(png.width * 0.1);
    // The body stands from 0.5 m to 3 m above the rail.
    const row = (m: number) => Math.floor((SIDE_TOP_M - m) * SIDE_PX_PER_M);
    const mid = Math.floor(png.width / 2);
    expect(alpha(png, mid, row(1.5))).toBe(255);
    expect(alpha(png, mid, row(0.2))).toBe(0);
    expect(alpha(png, mid, row(3.5))).toBe(0);
  });

  it("is what the road and rail vehicles get, and nothing else", () => {
    expect(isSideViewCategory("Road vehicles")).toBe(true);
    expect(isSideViewCategory("Rail vehicles")).toBe(true);
    for (const c of ["Ships", "Aircraft", "Cable car", "Commercial", "Village"]) expect(isSideViewCategory(c)).toBe(false);
  });
});

describe("the three-quarter view", () => {
  it("is a square of the asked size", () => {
    const png = renderGlbThumb(testVehicle(), 64);
    expect([png.width, png.height]).toEqual([64, 64]);
  });
});
