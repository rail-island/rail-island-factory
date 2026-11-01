// The sounds a model makes (generator/soundMapping.ts, docs/models/sounds.md):
// the checks against the imported designs, the defaults derived from traction,
// weight and hull length, the variants' overrides, and what the export carries.

import { describe, expect, it } from "vitest";
import { ALL_VEHICLES, BUILDINGS, catalogFields } from "../generator/generate.ts";
import { exportMeta, exportVehicleMeta, type ExportedGame } from "../generator/catalog.ts";
import type { ProceduralDesign } from "../generator/design.ts";
import {
  SOUNDS_CATALOG,
  checkDesignSounds,
  declaredSounds,
  derivedSounds,
  dieselEngine,
  railHorn,
  shipHorn,
  slotProblems,
  soundIdsOf,
  soundsFor,
  unknownTableIds,
  withSounds,
} from "../generator/soundMapping.ts";
import { DESIGNS } from "../generator/generate.ts";

const vehicles = exportVehicleMeta(ALL_VEHICLES).vehicles;
const byId = (id: string) => vehicles.find((v) => v.id === id)!;

describe("a slot's check", () => {
  it("passes a design of the slot's kind with character parameters in range", () => {
    expect(slotProblems("horn", { id: "loco-horn", params: { pitch: 300 } })).toEqual([]);
    expect(slotProblems("bell", { id: "big-ben", params: { chime: "hour", strikes: 6 } })).toEqual([]);
  });

  it("refuses an unknown design, the wrong kind, a runtime parameter and a value out of range", () => {
    expect(slotProblems("horn", { id: "foghorn" })[0]).toMatch(/no sound design "foghorn"/);
    expect(slotProblems("engine", { id: "loco-horn" })[0]).toMatch(/is a oneShot, the slot plays a loop/);
    expect(slotProblems("horn", { id: "loco-horn", params: { call: "tunnel" } })[0]).toMatch(/set by the game/);
    expect(slotProblems("engine", { id: "diesel-engine", params: { rpm: 0.5 } })[0]).toMatch(/set by the game/);
    expect(slotProblems("horn", { id: "loco-horn", params: { pitch: 9000 } })[0]).toMatch(/outside 150..500/);
    expect(slotProblems("bell", { id: "big-ben", params: { chime: "noon" } })[0]).toMatch(/no value "noon"/);
    expect(slotProblems("bell", { id: "church-bell", params: { tone: 1 } })[0]).toMatch(/no parameter "tone"/);
  });

  it("names the design, and keeps a building to its bell", () => {
    const d = { id: "x", title: "X", build: () => null } as unknown as ProceduralDesign;
    const table = { "proc-building-x": { sounds: { horn: { id: "loco-horn" } } } };
    expect(() => checkDesignSounds(d, false, undefined, table)).toThrow(/^x: sounds horn: not a building slot/);
    expect(() => checkDesignSounds(d, true, undefined, { "proc-vehicle-x": table["proc-building-x"] })).not.toThrow();
  });

  it("refuses sounds stated on the design itself, and a variant that is no real selection", () => {
    const own = { id: "x", title: "X", build: () => null, game: { sounds: { horn: { id: "loco-horn" } } } } as unknown as ProceduralDesign;
    expect(() => checkDesignSounds(own, true, undefined, {})).toThrow(/stated in generator\/soundTable.ts/);
    const d = { id: "proc-vehicle-y", title: "Y", build: () => null, params: [{ name: "livery", title: "L", default: "a", values: [{ value: "a", title: "A" }, { value: "b", title: "B" }] }] } as unknown as ProceduralDesign;
    const table = (params: Record<string, string>) => ({ "proc-vehicle-y": { variants: [{ params, sounds: { horn: null } }] } });
    expect(() => checkDesignSounds(d, true, undefined, table({ livery: "b" }))).not.toThrow();
    expect(() => checkDesignSounds(d, true, undefined, table({ livery: "a" }))).toThrow(/non-default/);
    expect(() => checkDesignSounds(d, true, undefined, table({ livery: "z" }))).toThrow(/has no value "z"/);
  });

  it("finds no table entry for a model that does not exist", () => {
    expect(unknownTableIds([...DESIGNS.values()])).toEqual([]);
    expect(unknownTableIds([], { "proc-building-gone": {} })).toEqual(["proc-building-gone"]);
  });
});

describe("the derived defaults", () => {
  it("give a steam locomotive a whistle and its beat, a diesel a horn and its engine, the rest a horn", () => {
    expect(derivedSounds({ category: "Rail vehicles", traction: "steam" }, 90)).toEqual({ horn: railHorn(true, 90), engine: { id: "steam-chuff" } });
    expect(derivedSounds({ category: "Rail vehicles", traction: "diesel" }, 90)).toEqual({ horn: railHorn(false, 90), engine: dieselEngine(90) });
    expect(derivedSounds({ category: "Rail vehicles", traction: "electric" }, 90)).toEqual({ horn: railHorn(false, 90) });
    expect(derivedSounds({ category: "Rail vehicles" }, 30)).toEqual({ horn: railHorn(false, 30) });
    expect(derivedSounds({ category: "Road vehicles" }, 12)).toEqual({});
    expect(derivedSounds({ category: "Ships", hullStuds: 70 }, 500)).toEqual({ horn: shipHorn(70) });
  });

  it("deepen with weight and hull length as the game's rules did", () => {
    // the values rail-island-webapp's hornSpecFor / dieselDriveFor / shipHornFor gave
    expect(railHorn(false, 40).params!.pitch).toBe(370);
    expect(railHorn(false, 140).params!.pitch).toBe(220);
    expect(railHorn(false, 90).params!.pitch).toBe(295);
    expect(railHorn(true, 40).params!.pitch).toBe(880);
    expect(railHorn(true, 140).params!.pitch).toBe(520);
    expect(dieselEngine(115).params!.size).toBe(0.75);
    expect(shipHorn(20).params).toEqual({ pitch: 196, seconds: 0.7 });
    expect(shipHorn(120).params).toEqual({ pitch: 70, seconds: 2.2 });
  });
});

describe("a design's exported sounds", () => {
  it("take the declared slot over the derived one, and re-derive the others per variant", () => {
    const design = {
      id: "proc-vehicle-loco",
      game: { weight: 60, power: 1, maxspeed: 1, accel: null, variants: [{ params: { livery: "heavy" }, weight: 140 }] },
    } as unknown as ProceduralDesign;
    const table = {
      "proc-vehicle-loco": {
        sounds: { engine: { id: "diesel-engine", params: { size: 1 } } },
        variants: [{ params: { livery: "mute" }, sounds: { horn: null } }],
      },
    };
    expect(declaredSounds(design, table)).toBe(table["proc-vehicle-loco"]);
    const out = withSounds(design.game as ExportedGame, design, { category: "Rail vehicles", traction: "diesel" }, table)!;
    expect(out.sounds).toEqual({ horn: railHorn(false, 60), engine: { id: "diesel-engine", params: { size: 1 } } });
    // the heavier variant's horn is deeper; its engine stays the declared one
    expect(out.variants![0]!.sounds).toEqual({ horn: railHorn(false, 140) });
    // a variant only the table lists is appended with its parameters and sounds alone
    expect(out.variants![1]).toEqual({ params: { livery: "mute" }, sounds: { horn: null } });
    expect(soundsFor(out, { livery: "heavy" }).horn).toEqual(railHorn(false, 140));
    expect(soundsFor(out, { livery: "mute" })).toEqual({ engine: { id: "diesel-engine", params: { size: 1 } } });
    expect(soundsFor(out, {})).toEqual(out.sounds);
  });

  it("are on every exported vehicle, and every one plays", () => {
    for (const v of vehicles) {
      expect(v.game?.sounds, v.id).toBeDefined();
      for (const [slot, value] of Object.entries(v.game!.sounds!)) expect(slotProblems(slot as "horn", value!), v.id).toEqual([]);
      for (const variant of v.game!.variants ?? [])
        for (const [slot, value] of Object.entries(variant.sounds ?? {})) if (value) expect(slotProblems(slot as "horn", value), v.id).toEqual([]);
    }
  });

  it("follow traction and weight on the real vehicles", () => {
    const steam = vehicles.find((v) => v.traction === "steam")!;
    expect(steam.game!.sounds!.horn!.id).toBe("steam-whistle");
    expect(steam.game!.sounds!.engine!.id).toBe("steam-chuff");
    const diesel = vehicles.find((v) => v.traction === "diesel" && v.group === "loco")!;
    expect(diesel.game!.sounds).toEqual({ horn: railHorn(false, diesel.game!.weight!), engine: dieselEngine(diesel.game!.weight!) });
    const electric = vehicles.find((v) => v.traction === "electric")!;
    expect(Object.keys(electric.game!.sounds!)).toEqual(["horn"]);
    const bus = vehicles.find((v) => v.group === "bus")!;
    expect(bus.game!.sounds).toEqual({});
    // a livery that weighs more blows a different horn (CD 163's cd362 variant: 87 t)
    const cd163 = byId("proc-vehicle-cd-163");
    const heavy = cd163.game!.variants!.find((x) => x.params.livery === "cd362")!;
    expect(heavy.sounds?.horn).toEqual(railHorn(false, 87));
  });

  it("give every ship a horn by its hull, the bigger the deeper", () => {
    const ships = vehicles.filter((v) => v.category === "Ships");
    expect(ships.length).toBeGreaterThan(0);
    for (const s of ships) expect(s.game!.sounds!.horn!.id).toBe("ship-horn");
    const pitch = (id: string) => byId(id).game!.sounds!.horn!.params!.pitch as number;
    // the liner stands in for a long old model; the hydrofoil is small
    expect(pitch("proc-vehicle-cruise-ferry")).toBeLessThan(pitch("proc-vehicle-hydrofoil-ferry"));
    // a ship standing in for an old model is heard at that model's length: the old
    // hydrofoil was 26.67 m long, so 40 studs, whatever the new model measures
    expect(byId("proc-vehicle-hydrofoil-ferry").game!.sounds!.horn).toEqual(shipHorn(40));
    expect(byId("proc-vehicle-passenger-ferry").game!.sounds!.horn).toEqual(shipHorn(48));
  });
});

describe("the bells", () => {
  const buildings = exportMeta(BUILDINGS).buildings;
  const bells = buildings.filter((b) => b.game?.sounds?.bell);

  it("ring from every church, cathedral and bell tower", () => {
    expect(bells.map((b) => b.id).sort()).toEqual(
      [
        "proc-building-baroque-church",
        "proc-building-church-vrchlabi",
        "proc-building-notre-dame",
        "proc-building-prague-castle-st-vitus",
        "proc-building-st-basils-cathedral",
        "proc-building-st-nicholas-church",
        "proc-building-twin-tower-baroque-church",
        "proc-building-tower-bell",
        "proc-building-tower-bigben",
      ].sort(),
    );
    expect(buildings.find((b) => b.id === "proc-building-tower-bigben")!.game!.sounds!.bell!.id).toBe("big-ben");
    expect(buildings.find((b) => b.id === "proc-building-notre-dame")!.game!.sounds!.bell!.id).toBe("notre-dame-bell");
  });

  it("leave every other building without sounds", () => {
    for (const b of buildings) if (!bells.includes(b)) expect(b.game?.sounds, b.id).toBeUndefined();
  });
});

describe("the catalog's Sounds column", () => {
  it("lists every design id a model names, its variants' included", () => {
    expect(soundIdsOf({ sounds: { horn: { id: "loco-horn" }, engine: { id: "diesel-engine" } }, variants: [{ sounds: { horn: { id: "steam-whistle" } } }] })).toEqual([
      "loco-horn",
      "diesel-engine",
      "steam-whistle",
    ]);
    expect(soundIdsOf(undefined)).toEqual([]);
  });

  it("names only designs the factory imported", () => {
    const known = new Set(SOUNDS_CATALOG.sounds.map((s) => s.id));
    for (const e of [...vehicles, ...exportMeta(BUILDINGS).buildings]) for (const id of soundIdsOf(e.game)) expect(known.has(id), `${e.id} ${id}`).toBe(true);
    expect(catalogFields(ALL_VEHICLES[0]!).category).toBeTruthy();
  });
});
