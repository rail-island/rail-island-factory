// What drives each aircraft, for the catalog site's Aircraft chips (docs/site/catalog-site.md):
// a helicopter (game.aircraftKind), an airship, a propeller aircraft or a jet. Read off
// the module each design is listed in - the world jets and the world propeller aircraft
// are lists of their own, the rotor kit draws the helicopters and the airship - and, for
// the hand-built aircraft (aircraft.ts), the table below. Site metadata only: it never
// reaches a design's JS model or a game meta file.

import type { ProceduralDesign } from "./design.ts";
import type { AirframeKind } from "./catalog.ts";
import { AIRCRAFT } from "./aircraft.ts";
import { WORLD_JETS } from "./worldJets.ts";
import { WORLD_PROPS } from "./worldProps.ts";
import { WORLD_ROTORCRAFT } from "./worldRotorcraft.ts";

/** The hand-built aircraft (aircraft.ts) that fly on propellers; every other one there is a jet. */
const PROPELLER_AIRCRAFT: ReadonlySet<string> = new Set(["proc-vehicle-aero-a10", "proc-vehicle-small-airplane"]);

function kindOf(design: ProceduralDesign, list: "aircraft" | "jets" | "props" | "rotorcraft"): AirframeKind {
  if (design.game?.aircraftKind === "helicopter") return "helicopter";
  if (list === "rotorcraft") return "airship";
  if (list === "props") return "propeller";
  if (list === "jets") return "jet";
  return PROPELLER_AIRCRAFT.has(design.id) ? "propeller" : "jet";
}

// built on first use: the lists are not initialised yet when generate.ts imports this
let kinds: ReadonlyMap<string, AirframeKind> | null = null;
function table(): ReadonlyMap<string, AirframeKind> {
  kinds ??= new Map([
    ...AIRCRAFT.map((d) => [d.id, kindOf(d, "aircraft")] as const),
    ...WORLD_JETS.map((d) => [d.id, kindOf(d, "jets")] as const),
    ...WORLD_PROPS.map((d) => [d.id, kindOf(d, "props")] as const),
    ...WORLD_ROTORCRAFT.map((d) => [d.id, kindOf(d, "rotorcraft")] as const),
  ]);
  return kinds;
}

/** An aircraft's kind, or null for anything that is not an aircraft. */
export function airframeKind(id: string): AirframeKind | null {
  return table().get(id) ?? null;
}

/** The record field: `{ airframe }` for an aircraft, nothing for anything else. */
export function airframeField(id: string): { airframe?: AirframeKind } {
  const kind = airframeKind(id);
  return kind ? { airframe: kind } : {};
}
