// The world vehicle fleet's data checks (docs/models/world-fleet.md): every fleet
// design, built or not, is in the catalog with its game properties and its own
// LOD, is on the spec's list under its id, and has committed, freely licensed
// references listed file by file in SOURCES.md. The covering sample the catalog
// sweep checks in full covers every kit option of every family.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate";
import { freeLicence, refFileName, thumbWidth } from "../generator/fetchRefs";
import { coverSample, FLEET_SWEEP_SAMPLE, WORLD_FLEET, type FleetEntry } from "../generator/worldFleet";
import { proceduralId } from "../generator/modelId";

const LIST = readFileSync("docs/specs/2026-11-05-world-vehicle-fleet-list.md", "utf8");
const LISTED = new Set([...LIST.matchAll(/`(veh-[a-z0-9-]+)`/g)].map((m) => proceduralId(m[1]!)));

/** The rows of a SOURCES.md table whose first cell names a file: [file, ...cells]. */
function sourceRows(md: string): string[][] {
  return md.split("\n").filter((l) => /^\| `[^`]+` \|/.test(l)).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
}

describe("the world fleet", () => {
  it("lists only catalog designs, each once, each on the spec's list", () => {
    const ids = WORLD_FLEET.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => !DESIGNS.has(id))).toEqual([]);
    expect(ids.filter((id) => !LISTED.has(id))).toEqual([]);
  });

  it.each(WORLD_FLEET.map((e) => [e.id] as const))("%s states its game properties, its LOD and its references", (id) => {
    const d = DESIGNS.get(id)!;
    expect(d.game?.maxspeed, "maxspeed").toBeGreaterThan(0);
    expect(typeof d.buildLod).toBe("function");
    expect(d.references, "references").toMatch(/^[a-z0-9-]+$/);
  });

  const folders = WORLD_FLEET.flatMap((e) => [DESIGNS.get(e.id)?.references ?? ""].flat().map((f) => [e.id, f] as const));
  it.each(folders)("%s has its references in assets/%s, every file listed with a free licence", (_id, folder) => {
    const dir = join("assets", folder);
    expect(existsSync(join(dir, "SOURCES.md")), `${dir}/SOURCES.md`).toBe(true);
    const md = readFileSync(join(dir, "SOURCES.md"), "utf8");
    expect(md.startsWith("# "), "a title").toBe(true);
    expect(md).toContain("## Published figures");
    const rows = sourceRows(md);
    const listed = rows.map((r) => r[0]!.replace(/`/g, ""));
    const files = readdirSync(dir).filter((f) => f !== "SOURCES.md").sort();
    expect(files.length, "at least one reference file").toBeGreaterThan(0);
    expect(files.filter((f) => !listed.includes(f)), "files not in SOURCES.md").toEqual([]);
    expect(listed.filter((f) => !files.includes(f)), "listed files missing").toEqual([]);
    // the photographs' table: file, original, URL, author, licence, use
    for (const r of rows.filter((r) => r[2]?.startsWith("https://"))) expect(freeLicence(r[4] ?? ""), `${r[0]} licence ${r[4]}`).toBe(true);
  });

  it("sweeps a sample that covers every kit option of every family, and each family's largest design", () => {
    const sample = WORLD_FLEET.filter((e) => FLEET_SWEEP_SAMPLE.has(e.id));
    for (const family of new Set(WORLD_FLEET.map((e) => e.family))) {
      const all = WORLD_FLEET.filter((e) => e.family === family);
      const options = new Set(all.flatMap((e) => e.features));
      const covered = new Set(sample.filter((e) => e.family === family).flatMap((e) => e.features));
      expect([...options].filter((o) => !covered.has(o)), family).toEqual([]);
      const largest = all.reduce((a, b) => (b.size > a.size ? b : a));
      expect(FLEET_SWEEP_SAMPLE.has(largest.id), `${family} largest`).toBe(true);
    }
  });
});

describe("the covering sample", () => {
  const e = (id: string, family: string, features: string[], size = 1): FleetEntry => ({ id, family, features, size });

  it("picks the fewest designs that cover every option, greedily and in list order, plus the largest", () => {
    const list = [e("a", "f", ["x"]), e("b", "f", ["x", "y"]), e("c", "f", ["z"]), e("d", "f", ["y"], 9), e("g", "h", ["x"])];
    expect(coverSample(list)).toEqual(["b", "c", "d", "g"]);
  });

  it("gives the same sample for the same list", () => {
    expect(coverSample(WORLD_FLEET)).toEqual(coverSample(WORLD_FLEET));
  });
});

describe("refs:fetch", () => {
  it("takes only free licences", () => {
    for (const l of ["CC0", "CC BY 2.0", "CC BY-SA 4.0", "Public domain", "PD-self"]) expect(freeLicence(l), l).toBe(true);
    for (const l of ["CC BY-NC 2.0", "CC BY-ND 3.0", "All rights reserved", "Fair use", "unknown"]) expect(freeLicence(l), l).toBe(false);
  });

  it("names a file after its Commons title, lower case and ascii", () => {
    expect(refFileName("File:Bondinho do Pão de Açúcar by Diego Baravelli.jpg")).toBe("photo-bondinho-do-pao-de-acucar-by-diego-baravelli.jpg");
  });

  it("asks only for the thumbnail widths Wikimedia serves, never wider than the original", () => {
    expect(thumbWidth(4000, 3000)).toBe(1280);
    expect(thumbWidth(1024, 768)).toBe(960);
    expect(thumbWidth(3000, 4000)).toBe(960);
    expect(thumbWidth(400, 300)).toBe(330);
  });
});
