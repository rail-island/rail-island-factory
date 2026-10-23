// The fixed inputs every landed set module is pinned with (docs/models/sets.md):
// test/setPins.test.ts hashes what each case builds (pinHash.ts, the hash the game
// shares) against test/fixtures/set-pins.json, and the export writes the same
// hashes to export/sets/pins.json so the game's import names every case a factory
// change redraws. Node-only; never bundled.

import * as blockType from "./blockType.ts";
import * as busStop from "./busStop.ts";
import * as cableCarStation from "./cableCarStation.ts";
import * as port from "./port.ts";
import * as airport from "./airport.ts";
import { pinHash } from "./pinHash.ts";

export type PinCase = { name: string; build: () => unknown };

export function setPinCases(): Record<string, PinCase[]> {
  const pads: Array<[string, airport.TerminalPad]> = [["small", { cx: 0, cz: 0, w: 26, d: 90 }], ["big", { cx: 30, cz: -12, w: 48, d: 180 }]];
  return {
    blockType: [{ name: "types", build: () => blockType.TYPE_META }],
    busStop: busStop.TYPES.flatMap((t) => [4.5, 7, 10].map((lateral) => ({ name: `${t}.${lateral}`, build: () => busStop.buildSide(t, lateral) }))),
    cableCarStation: [
      { name: "types", build: () => cableCarStation.TYPE_META },
      ...[12, 31.5, 60].map((h) => ({ name: `pylon.${h}`, build: () => cableCarStation.buildPylon(h) })),
    ],
    port: [{ name: "types", build: () => ({ types: port.TYPE_META, props: port.PROPS }) }],
    airport: [
      { name: "types", build: () => airport.TYPE_META },
      ...Object.keys(airport.TYPE_META).flatMap((t) => pads.map(([n, pad]) => ({
        name: `${t}.${n}`, build: () => ({ terminal: airport.terminal(pad, t), furniture: airport.furniture(pad, t) }),
      }))),
    ],
  };
}

/** Every case's hash, by set: what export/sets/pins.json holds. */
export function setPins(): Record<string, Record<string, string>> {
  return Object.fromEntries(Object.entries(setPinCases()).map(([set, cases]) => [set, Object.fromEntries(cases.map((c) => [c.name, pinHash(c.build())]))]));
}
