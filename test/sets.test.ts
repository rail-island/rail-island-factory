// The set registry (docs/models/sets.md): ids are stored in the game's saved maps,
// D1 collection keys and simulations, so they are frozen. A set whose definitions
// have not landed in the factory yet keeps exactly the game's list; a landed set may
// grow, but never loses or renames a shipped id (retire it with an alias instead).
import { describe, expect, it } from "vitest";
import { SETS, resolveSetId, setDef, type SetName } from "../generator/sets/registry.ts";
import { setMeta } from "../generator/sets/setsExport.ts";

/** Every id each set shipped with, in picker order: the game's lists when the registry was made. */
const SHIPPED: Record<SetName, readonly string[]> = {
  blockType: ["village", "village_red", "comm_classic", "comm_large", "comm_small", "comm_low", "comm_oldtown", "comm_street", "comm_tenement", "skyscraper_a", "skyscraper_b", "industry", "tower", "historical", "landmark"],
  busStop: ["shelter", "canopy", "cargo"],
  cableCarStation: ["open_gantry", "alpine_chalet", "glass_modern", "concrete_drive"],
  port: ["wooden_jetty", "concrete_quay", "passenger_terminal", "river_jetty", "river_quay", "river_terminal"],
  airport: ["grass_field", "regional", "international"],
  decoration: ["trees", "wall", "fence", "guardrail", "gallery"],
  tunnelPortal: ["stone"],
  railType: ["wooden_sleepers", "concrete_sleepers", "concrete_sleepers_wire"],
  roadType: ["narrow_asphalt", "narrow_paved", "wide_asphalt", "wide_paved", "narrow_asphalt_tram", "wide_asphalt_tram", "narrow_paved_tram", "wide_paved_tram", "tram_single", "tram_double"],
  dam: ["concrete", "concrete-lock", "weir", "weir-lock", "stone"],
  station: ["platforms_only", "platforms_shared", "arch_shed", "cantilever_wings", "concourse", "village_depot", "heritage_canopy", "grand_terminus"],
  roadStation: ["open_bays", "sawtooth_canopy", "terminal_hall", "gravel_yard", "loading_docks", "logistics_hub"],
  bridge: ["beam", "truss", "cantilever", "arch", "stone_arch", "brick_arch", "tied_arch", "suspension", "cable_stayed", "plate_girder", "timber_trestle", "box_girder", "deck_truss", "network_arch"],
  catenaryStyle: ["rail_mast", "tram_pole"],
};

describe("set registry", () => {
  it("lists every set once", () => {
    expect(SETS.map((s) => s.set).sort()).toEqual(Object.keys(SHIPPED).sort());
  });

  for (const def of SETS) {
    describe(def.set, () => {
      const ids = def.types.map((t) => t.id);
      it("keeps every shipped id; an unlanded set exactly the game's list", () => {
        if (def.landed) for (const id of SHIPPED[def.set]) expect(ids).toContain(id);
        else expect(ids).toEqual(SHIPPED[def.set]);
      });
      it("has unique ids the D1 item key accepts, an English name each, and a default among them", () => {
        expect(new Set(ids).size).toBe(ids.length);
        for (const t of def.types) {
          expect(t.id).toMatch(/^[A-Za-z0-9_-]+$/);
          expect(t.label.trim()).not.toBe("");
        }
        expect(ids).toContain(def.defaultId);
      });
      it("retires ids onto shipped ones, never a live id", () => {
        for (const [old, target] of Object.entries(def.retired)) {
          expect(ids).not.toContain(old);
          expect(ids).toContain(target);
        }
      });
      it("groups only its own types, each once", () => {
        const grouped = (def.groups ?? []).flatMap((g) => g.types);
        expect(new Set(grouped).size).toBe(grouped.length);
        for (const id of grouped) expect(ids).toContain(id);
      });
      it("resolves stored ids: itself, its alias, else the default", () => {
        for (const id of ids) expect(resolveSetId(def, id)).toBe(id);
        for (const [old, target] of Object.entries(def.retired)) expect(resolveSetId(def, old)).toBe(target);
        expect(resolveSetId(def, "no-such-type")).toBe(def.defaultId);
        expect(resolveSetId(def, null)).toBe(def.defaultId);
      });
      it("exports a meta without the English text, naming its module once landed", () => {
        const meta = setMeta(def);
        expect(meta.types.map((t) => t.id)).toEqual(ids);
        expect(JSON.stringify(meta)).not.toContain("\"label\"");
        expect(meta.module === undefined).toBe(!def.landed);
      });
    });
  }

  it("names collectible kinds only on the game's structure sets", () => {
    const kinds = SETS.flatMap((s) => (s.collectible ? [[s.set, s.collectible]] : []));
    expect(Object.fromEntries(kinds)).toEqual({
      busStop: "busStop", cableCarStation: "cableCarStation", port: "port", airport: "airport",
      dam: "dam", station: "station", roadStation: "roadStation", bridge: "bridge",
    });
    expect(setDef("bridge").defaultId).toBe("beam");
  });
});
