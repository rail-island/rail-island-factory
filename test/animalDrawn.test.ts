// The draft animals and the animal-drawn vehicles (generator/draftAnimals.ts,
// generator/animalVehicleKit.ts, generator/animalTrams.ts, animalRail.ts,
// animalBuses.ts; docs/models/draft-animals.md, docs/models/animal-drawn-vehicles.md):
// the team's parameters and the counts each species is put to, the game figures
// derived per variant (each holds its top speed up a 5 % grade in the game), the
// hitches, the gait (a closed loop, the planted feet on the ground), the rig a rail
// car or a road coach is posed by, the budget, the distant model and the sounds.

import { describe, expect, it } from "vitest";
import { collectTriangles, parseGlb, type Tri } from "../generator/glbTriangles";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { paramCombinations, resolveParams, type ParamValues, type ProceduralDesign } from "../generator/design";
import {
  ANIMAL_PARAM, GAIT_CLIP, NO_TEAM, SPECIES, SPECIES_SPECS, TEAM_PARAM, gaitPose, gradeSpeed, placeTeam, rowsOf, teamFigures, teamGame, teamOf,
  teamParams, teamSelections,
} from "../generator/draftAnimals";
import { ANIMAL_TRAMS } from "../generator/animalTrams";
import { ANIMAL_RAIL } from "../generator/animalRail";
import { ANIMAL_BUSES } from "../generator/animalBuses";
import { DRAFT_ANIMALS } from "../generator/animalDesigns";
import { ANIMAL_DESIGNS, ALL_VEHICLES, DESIGNS } from "../generator/generate";
import { teamSounds, withSounds, soundsFor } from "../generator/soundMapping";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { proceduralId } from "../generator/modelId";
import type { VehicleRig } from "../generator/rig";
import type { ExportedGame } from "../generator/catalog";

const VEHICLES: readonly ProceduralDesign[] = [...ANIMAL_TRAMS, ...ANIMAL_RAIL, ...ANIMAL_BUSES];

const span = (ts: readonly Tri[], axis: number): [number, number] => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const t of ts) for (const p of t.p) { lo = Math.min(lo, p[axis]!); hi = Math.max(hi, p[axis]!); }
  return [lo, hi];
};

/** The budget of an animal-drawn vehicle: a rigid vehicle's 10,000, and 1,000 for every animal after the first. */
const budget = (count: number): number => 10_000 + 1_000 * Math.max(0, count - 1);

/** The selections a vehicle is checked at: the default, the biggest team of each species, a single elephant, the trailer. */
function checked(d: ProceduralDesign): ParamValues[] {
  const sels = teamSelections(d.params!);
  const out: ParamValues[] = [{}];
  for (const s of SPECIES) {
    const mine = sels.filter((x) => x[ANIMAL_PARAM] === s && x[TEAM_PARAM] !== NO_TEAM);
    out.push(mine[mine.length - 1]!);
  }
  if (sels.some((x) => x[TEAM_PARAM] === NO_TEAM)) out.push({ [TEAM_PARAM]: NO_TEAM });
  return out;
}

describe("the draft animals", () => {
  it("are six designs of their own category, in no game meta", () => {
    expect(DRAFT_ANIMALS.map((d) => d.id)).toEqual(SPECIES.map((s) => `proc-animal-${s}`));
    expect(ANIMAL_DESIGNS).toEqual(DRAFT_ANIMALS);
    for (const d of DRAFT_ANIMALS) {
      expect(d.catalog).toMatchObject({ category: "Animals", group: "animal" });
      expect(DESIGNS.get(d.id)).toBe(d);
      expect(ALL_VEHICLES).not.toContain(d);
    }
  });

  it.each(SPECIES.map((s) => [s] as const))("%s: stands on the ground in its harness, walks a closed gait, in a light budget", (species) => {
    const d = DRAFT_ANIMALS.find((x) => x.id === `proc-animal-${species}`)!;
    const m = d.build();
    expect(m.triangleCount()).toBeLessThanOrEqual(2_500);
    const { json, bin } = parseGlb(m.toGlb(d.id));
    const ts = collectTriangles(json, bin);
    expect(span(ts, 1)[0]).toBeCloseTo(0, 2);
    const clip = m.animations().find((c) => c.name === GAIT_CLIP)!;
    expect(clip.drive).toEqual({ drive: "distance", speed: 5 });
    for (const t of clip.tracks) expect(t.values.slice(-t.values.length / clip.times.length)).toEqual(t.values.slice(0, t.values.length / clip.times.length));
    expect(d.buildLod().triangleCount()).toBeLessThanOrEqual(100);
  });

  it("keeps a planted foot on the ground through the stride", () => {
    for (const s of SPECIES) {
      for (let k = 0; k < 24; k++) {
        const p = gaitPose(s, k / 24);
        // the lift puts the lowest sole at the ground: never sunk, never floating more than a few centimetres
        expect(Math.abs(p.lift)).toBeLessThan(0.15 * SPECIES_SPECS[s].legs.top);
      }
    }
  });

  it("are put to their species' hitches: pairs abreast, the camel and the elephant in single file", () => {
    expect(rowsOf("horse", 1)).toEqual([1]);
    expect(rowsOf("horse", 2)).toEqual([2]);
    expect(rowsOf("horse", 6)).toEqual([2, 2, 2]);
    expect(rowsOf("cow", 4)).toEqual([2, 2]);
    expect(rowsOf("camel", 3)).toEqual([1, 1, 1]);
    expect(rowsOf("elephant", 2)).toEqual([1, 1]);
    for (const s of SPECIES) for (const n of SPECIES_SPECS[s].counts) {
      const team = placeTeam(s, n, 3);
      expect(team).toHaveLength(n);
      // every animal ahead of the hitch, the leaders furthest, a pair mirrored across the centre line
      for (const a of team) expect(a.x).toBeGreaterThan(3);
      expect(team[0]!.x).toBe(Math.max(...team.map((a) => a.x)));
      expect(team.reduce((t, a) => t + a.z, 0)).toBeCloseTo(0, 9);
    }
  });
});

describe("the team's parameters and figures", () => {
  it("offer the species first and only the counts each is put to, the trailer on rail only", () => {
    const [animal, team] = teamParams({ trailer: true });
    expect(animal!.name).toBe(ANIMAL_PARAM);
    expect(team!.name).toBe(TEAM_PARAM);
    expect(team!.values[0]!.value).toBe(NO_TEAM);
    expect(teamParams({ trailer: false })[1]!.values.map((v) => v.value)).not.toContain(NO_TEAM);
    const sels = teamSelections(teamParams({ trailer: false }));
    for (const s of SPECIES) expect(sels.filter((x) => x[ANIMAL_PARAM] === s).map((x) => Number(x[TEAM_PARAM]))).toEqual([...SPECIES_SPECS[s].counts]);
    // the selections are what resolving accepts
    for (const sel of sels) expect(resolveParams(teamParams({ trailer: false }), sel)).toEqual(sel);
    // a count no picker offers for the species builds its biggest team no larger, never a throw mid-build
    expect(teamOf({ animal: "elephant", team: "6" })).toEqual({ species: "elephant", count: 2 });
    expect(teamOf({ animal: "horse", team: "3" })).toEqual({ species: "horse", count: 2 });
    expect(() => teamOf({ animal: "horse", team: "x" })).toThrow();
    expect(paramCombinations(teamParams({ trailer: true }))).toHaveLength(sels.length + SPECIES.length);
  });

  it("derive the power, weight and top speed of every team, each holding its speed up a 5 % grade", () => {
    const vehicle = { weight: 3, maxspeed: 15 };
    for (const s of SPECIES) for (const n of SPECIES_SPECS[s].counts) {
      const f = teamFigures(s, n, vehicle);
      expect(f.power).toBeCloseTo(n * SPECIES_SPECS[s].power, 6);
      expect(f.weight).toBeCloseTo(vehicle.weight + n * SPECIES_SPECS[s].weight, 6);
      expect(f.maxspeed).toBeLessThanOrEqual(SPECIES_SPECS[s].pace);
      expect(gradeSpeed(f.power, f.weight)).toBeGreaterThanOrEqual(f.maxspeed);
    }
    // the trailer has no power of its own
    expect(teamFigures("horse", 0, vehicle)).toEqual({ weight: 3, power: 0, maxspeed: 15 });
    // a heavy load slows a small team below its pace
    expect(teamFigures("donkey", 1, { weight: 12, maxspeed: 15 }).maxspeed).toBeLessThan(SPECIES_SPECS.donkey.pace);
  });

  it("list a variant for each selection whose figures differ from the default's", () => {
    const g = teamGame({ weight: 2, maxspeed: 15 }, { trailer: true });
    expect(g).toMatchObject(teamFigures("horse", 1, { weight: 2, maxspeed: 15 }));
    const keys = g.variants.map((v) => JSON.stringify(v.params));
    expect(new Set(keys).size).toBe(keys.length);
    const trailer = g.variants.find((v) => v.params[TEAM_PARAM] === NO_TEAM && !v.params[ANIMAL_PARAM])!;
    expect(trailer).toMatchObject({ power: 0, weight: 2 });
    for (const v of g.variants) {
      const t = teamOf(v.params);
      const f = teamFigures(t.species, t.count, { weight: 2, maxspeed: 15 });
      expect({ ...teamFigures("horse", 1, { weight: 2, maxspeed: 15 }), ...v, params: undefined }).toMatchObject(f);
    }
  });
});

describe("the animal-drawn vehicles", () => {
  it("are the four trams, the four railway vehicles and the four road coaches, each with its OpenTTD entry", () => {
    expect(ANIMAL_TRAMS.map((d) => proceduralId(d.id))).toEqual(["double-deck", "closed", "toastrack", "bobtail"].map((n) => `proc-vehicle-animal-tram-${n}`));
    expect(ANIMAL_RAIL.map((d) => proceduralId(d.id))).toEqual(["budweis-coach", "budweis-wagon", "mine-tub", "trolley"].map((n) => `proc-vehicle-animal-rail-${n}`));
    expect(ANIMAL_BUSES.map((d) => proceduralId(d.id))).toEqual(["knifeboard-omnibus", "stagecoach", "paris-omnibus", "wagonette"].map((n) => `proc-vehicle-animal-bus-${n}`));
    for (const d of VEHICLES) {
      expect(DESIGNS.get(proceduralId(d.id))).toBe(d);
      expect(OPENTTD_TABLE[proceduralId(d.id)], d.id).toBeDefined();
      expect(d.params!.map((p) => p.name)).toEqual([ANIMAL_PARAM, TEAM_PARAM]);
    }
    for (const d of ANIMAL_TRAMS) expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "tram" });
    for (const d of ANIMAL_RAIL) expect(d.catalog?.category).toBe("Rail vehicles");
    for (const d of ANIMAL_BUSES) expect(d.catalog).toMatchObject({ category: "Road vehicles", group: "bus" });
    expect(DESIGNS.has("proc-vehicle-horse-tram")).toBe(false);
  });

  for (const d of VEHICLES) {
    const road = d.catalog?.category === "Road vehicles";
    describe(d.id, () => {
      it.each(checked(d).map((p) => [JSON.stringify(p), p] as const))("is drawn by its team, rigged and in budget (%s)", (_n, params) => {
        const m = d.build(params);
        const t = teamOf(resolveParams(d.params!, params), { pair: road });
        expect(m.triangleCount() - m.interiorTriangleCount()).toBeLessThanOrEqual(budget(t.count));
        const glb = m.toGlb(d.id);
        // the catalog sweep builds only the defaults (test/catalogCache.ts): no flicker at any team
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        const { json, bin } = parseGlb(glb);
        const ts = collectTriangles(json, bin);
        expect(span(ts, 1)[0]).toBeGreaterThan(-0.05);
        const rig = m.rig as VehicleRig | null;
        const clip = m.animations().find((c) => c.name === GAIT_CLIP);
        if (!t.count) {
          // the trailer: a rigid car, no team, no gait
          expect(rig?.sections).toBeUndefined();
          expect(clip).toBeUndefined();
          return;
        }
        expect(clip?.tracks.filter((k) => k.path === "translation")).toHaveLength(t.count);
        const sections = rig!.sections!;
        expect(sections).toHaveLength(2);
        expect(rig!.joints).toEqual([]);
        if (road) {
          // the team and fore-carriage tow the body, hinged at the king bolt, steered under the leaders
          expect(rig!.team).toEqual({ section: 0, rehitchable: false });
          expect(rig!.steer!.axles[0]!.nodes).toEqual(["wheel-front-left", "wheel-front-right"]);
          expect(rig!.steer!.axles[0]!.wheelbase).toBeGreaterThan(0);
        } else {
          // the car and the team ahead of it, hinged at the draw hook, the team on two lone supports between the rails
          expect(rig!.team).toEqual({ section: 1, rehitchable: true });
          const hitch = sections[1]!.pivot;
          const own = rig!.supports!.filter((s) => s.sections.includes(1));
          expect(own).toHaveLength(2);
          for (const s of own) expect(s.x).toBeGreaterThan(hitch[0]);
          // the team's rear support behind its leaders' forelegs
          expect(own[0]!.x).toBeLessThan(own[1]!.x);
          // no animal reaches outside the platform edge
          expect(Math.max(...span(ts, 2).map(Math.abs))).toBeLessThanOrEqual(1.7);
        }
      }, 60_000);

      it("has a distant model in budget, sectioned like the full one", () => {
        for (const p of checked(d)) {
          const lod = d.buildLod(p);
          expect(lod.triangleCount()).toBeLessThanOrEqual(d.lodTriangles ?? 500);
          expect((lod.rig as VehicleRig | null)?.sections?.map((s) => s.node)).toEqual((d.build(p).rig as VehicleRig | null)?.sections?.map((s) => s.node));
        }
      }, 60_000);

      it("sounds its team: the hoof beat, the animal's call, a tram's bell; the trailer silent", () => {
        const src = { category: d.catalog!.category, group: d.catalog!.group };
        const game = withSounds(d.game as ExportedGame, d, src)!;
        expect(game.sounds?.engine?.id).toBe("hoof-beat");
        expect(game.sounds?.call).toEqual({ id: "animal-call", params: { species: "horse" } });
        expect(game.sounds?.horn?.id).toBe(d.catalog!.group === "tram" ? "tram-bell" : undefined);
        for (const sel of teamSelections(d.params!)) {
          const nonDefault = Object.fromEntries(Object.entries(sel).filter(([k, v]) => d.params!.find((p) => p.name === k)!.default !== v));
          expect(soundsFor(game, nonDefault), JSON.stringify(sel)).toEqual(teamSounds(src, sel));
        }
      });
    });
  }
});
