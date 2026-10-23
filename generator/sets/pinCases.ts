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
import * as decoration from "./decoration.ts";
import * as tunnelPortal from "./tunnelPortal.ts";
import * as railType from "./railType.ts";
import * as roadType from "./roadType.ts";
import * as dam from "./dam.ts";
import { pinHash } from "./pinHash.ts";

/** Everything one decoration module draws, recorded call by call. */
function recordPiece(kind: string, side: decoration.DecorationSide, detail: string): unknown[] {
  const calls: unknown[] = [];
  const a = { x: 0, y: 10, z: 0, tx: 0.98, tz: 0.2 }, b = { x: 3.92, y: 10.3, z: 0.8, tx: 0.98, tz: 0.2 };
  decoration.buildPiece(kind, { a, b, left: 7, right: -7, leftVisible: true, rightVisible: side !== "left", side },
    { heightAt: (x, z) => 10 + x * 0.02 + z * 0.03, detail, shoulderY: 0.92 }, {
      sweep: (...args) => calls.push(["sweep", ...args]),
      box: (...args) => calls.push(["box", ...args]),
      tree: (...args) => calls.push(["tree", ...args]),
    });
  return calls;
}

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
    decoration: [
      { name: "types", build: () => decoration.TYPE_META },
      ...["trees", "wall", "fence", "guardrail", "gallery"].flatMap((kind) => (kind === "gallery" ? ["both", "left", "none"] as const : ["both"] as const)
        .flatMap((side) => ["high", "low"].map((detail) => ({ name: `${kind}.${side}.${detail}`, build: () => recordPiece(kind, side, detail) })))),
    ],
    tunnelPortal: [
      { name: "types", build: () => tunnelPortal.TYPE_META },
      ...[3.5, 9, 12].map((half) => ({ name: `stone.${half}`, build: () => tunnelPortal.buildPortal("stone", half, {
        centerY: 4.85, verticalRadius: 6.85, floorDrop: 2, clearHeight: 11.7, bedY: 0.46, bedThickness: 0.42, segments: 18, wingReach: 5,
      }) })),
    ],
    railType: [{ name: "types", build: () => railType.TYPE_META }],
    roadType: [{ name: "types", build: () => roadType.TYPE_META }],
    dam: [
      { name: "types", build: () => ({ types: dam.TYPE_META, colors: dam.COLORS }) },
      ...[false, true].map((simplified) => ({ name: `gravity.${simplified ? "far" : "near"}`, build: () => dam.gravityParts({ left: -20, right: 18, halfWidth: 3, base: -2, top: 12, height: 14, batter: 3.3 }, simplified) })),
      ...[false, true].map((simplified) => ({ name: `lock.${simplified ? "far" : "near"}`, build: () => dam.lockParts({ left: -9.5, right: 9.5, centre: 0, upstream: 30, downstream: -30 }, dam.TYPE_META["weir-lock"]!.lock!, 4, 13.5, -3, simplified) })),
      ...[false, true].map((simplified) => ({ name: `arcade.${simplified ? "far" : "near"}`, build: () => dam.arcadeParts({ left: -40, right: 44, halfWidth: 3, base: -2, wingTop: 11.5, simplified }) })),
    ],
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
