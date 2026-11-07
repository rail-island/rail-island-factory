// The trams from around the world (docs/models/world-trams.md): the family's
// designs in the list's order, from the two modules that define them (Europe's
// in worldTramsEurope.ts, the rest of the world's and the historic steam
// and cable trams in worldTramsWorld.ts), and what the whole-catalog suites need
// to know of them: which open no doors and which open on the right only.

import { EUROPE_TRAM_SPECS } from "./worldTramsEurope.ts";
import { WORLD_REGION_TRAM_SPECS } from "./worldTramsWorld.ts";
import type { WorldTram } from "./worldTramShapes.ts";
import { proceduralId } from "./modelId.ts";

export type { WorldTram } from "./worldTramShapes.ts";

const LIST_ORDER = [
  "tatra-t1", "tatra-t2", "tatra-t4", "tatra-k2", "tatra-t5c5", "skoda-14t", "skoda-15t", "skoda-13t", "skoda-29t", "skoda-10t",
  "vario-lf", "ganz-csmg", "siemens-combino", "siemens-combino-supra", "siemens-avenio", "siemens-ulf", "vienna-e1", "vienna-flexity", "duewag-gt8", "duewag-u2",
  "duewag-b80", "gotha-t2-62", "berlin-flexity", "stadler-variobahn", "stadler-tango", "zurich-cobra", "zurich-tram-2000", "swiss-standard-tram", "brussels-pcc", "amsterdam-9g",
  "hague-gtl8", "lisbon-remodelado", "milan-ventotto", "florence-sirio", "alstom-citadis", "alstom-citadis-x05", "alstom-tfs", "translohr", "caf-urbos", "flexity-outlook",
  "croydon-cr4000", "blackpool-balloon", "blackpool-flexity", "sheffield-supertram", "nottingham-incentro", "konstal-105n", "pesa-swing", "solaris-tramino", "ktm-5", "lm-68",
  "vityaz-m", "electron-t5l64", "bucharest-v3a", "koncar-tmk2200", "durmazlar-silkworm", "helsinki-artic", "helsinki-valmet", "oslo-sl79", "gothenburg-m29", "pcc-streamliner",
  "toronto-clrv", "toronto-flexity", "birney-safety-car", "new-orleans-perley-thomas", "boston-type-8", "siemens-s70", "kinki-sharyo-lrv", "brookville-liberty", "philadelphia-kawasaki", "rio-bonde",
  "buenos-aires-premetro", "hong-kong-tram", "hiroshima-green-mover", "toei-9000", "toyama-portram", "tokyu-300", "kolkata-tram", "dalian-tram", "foshan-hydrogen", "alexandria-double-deck",
  "addis-ababa-lrt", "melbourne-w-class", "melbourne-b-class", "melbourne-e-class", "glenelg-h-class", "sydney-r-class", "christchurch-boon", "steam-tram", "cable-car-dunedin",
  "istanbul-nostalgic", "trieste-opicina", "budapest-ganz-uv", "wroclaw-skoda-16t", "strasbourg-eurotram", "montpellier-citadis", "gmunden-vario", "sarajevo-k2yu", "turin-2800", "dubai-citadis",
].map((n) => `veh-${n}`);

/** Every world tram, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md). */
export const WORLD_TRAM_SPECS: readonly WorldTram[] = [...EUROPE_TRAM_SPECS, ...WORLD_REGION_TRAM_SPECS]
  .filter((t) => LIST_ORDER.includes(t.id))
  .sort((a, b) => LIST_ORDER.indexOf(a.id) - LIST_ORDER.indexOf(b.id));

/** Whether a tram opens doors in any of its units, and on which sides. */
function doorSides(t: WorldTram): "none" | "right" | "both" {
  const units = (t.params ?? []).find((p) => p.name === "unit")?.values.map((v) => ({ unit: v.value })) ?? [{}];
  const specs = units.map((u) => t.spec(u));
  if (specs.every((s) => s.open || !s.doors.length)) return "none";
  return specs.some((s) => s.doubleEnded && s.doors.length && !s.open) ? "both" : "right";
}

/** The world trams that open no doors (catalog ids): the open cars and the end-platform cars (test/doorsSuite.ts). */
export const WORLD_TRAMS_WITHOUT_DOORS: ReadonlySet<string> = new Set(WORLD_TRAM_SPECS.filter((t) => doorSides(t) === "none").map((t) => proceduralId(t.id)));
/** The single-ended world trams, whose doors open on the right only (catalog ids). */
export const WORLD_TRAMS_RIGHT_ONLY: ReadonlySet<string> = new Set(WORLD_TRAM_SPECS.filter((t) => doorSides(t) === "right").map((t) => proceduralId(t.id)));
