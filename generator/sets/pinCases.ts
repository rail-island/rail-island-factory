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
import * as station from "./station.ts";
import * as roadStation from "./roadStation.ts";
import * as bridge from "./bridge.ts";
import * as catenaryStyle from "./catenaryStyle.ts";
import { pinHash } from "./pinHash.ts";

/** A fixed solved road station: three islands either side of two stands, two mount points. */
const ROAD_STATION_SITE: roadStation.DressSite = {
  islands: [-12, 0, 12].map((cx) => ({ cx, cz: 0, dirX: 0, dirZ: 1, width: 5, length: 34 })),
  stands: 2,
  mps: [{ x: -20, z: -24, outX: -1, outZ: 0 }, { x: 20, z: 24, outX: 1, outZ: 0 }],
  layout: "drive_through",
  standLength: 30,
  islandTop: 1.27,
  clearance: 9.5,
};

/** A fixed crossing of a valley: 240 studs of straight path 10 studs over the lowest ground. */
const BRIDGE_PATH = bridge.pathFromPoints([{ x: -60, y: 10, z: 0 }, { x: 60, y: 11, z: 10 }, { x: 180, y: 12, z: 0 }], 9, 0, 0.67, 9.9)!;
const BRIDGE_VALLEY = (x: number, z: number): number => 4 - 14 * Math.exp(-(((x - 60) / 34) ** 2)) + 0.02 * z;

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

/** A fixed sequence of draws for the fill's pins. */
function pinRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** One street frontage filled with a fixed pool of candidates at `spacing`: what the fill stands, where. */
function recordFill(spacing: string): unknown {
  const colours = [{ name: "walls", values: [{ value: "rose", palettes: ["pastel", "warm"] }, { value: "charcoal", palettes: ["stone"] }, { value: "plain", palettes: [] }] }];
  const list: blockType.FillCandidate[] = [
    { key: "narrow", group: "commercial", w: 8.1, d: 8, band: "low", party: ["left", "right", "back"], colours },
    { key: "wide", group: "commercial", w: 13.5, d: 9, band: "mid", party: ["left", "right"], colours },
    { key: "tall", group: "comm_classic", w: 10.55, d: 9.6, band: "tall", colours },
  ];
  const pools = new Map([["commercial", list.slice(0, 2)], ["comm_classic", list.slice(2)]]);
  return blockType.fillRun({ length: 96, depthLimit: 24 }, {
    typeId: "street", params: { spacing, colour: "pastel", height: "mixed" }, pools, density: 0.8, random: pinRandom(11), retryStep: 4,
    keyOf: (c, v) => `${c.key}|${v.walls ?? ""}`,
  }, (at) => (at > 40 && at < 44 ? { skipTo: 46, party: true } : at < 70 || at > 80)).map((p) => ({ at: p.at, key: p.key }));
}

export type PinCase = { name: string; build: () => unknown };

export function setPinCases(): Record<string, PinCase[]> {
  const pads: Array<[string, airport.TerminalPad]> = [["small", { cx: 0, cz: 0, w: 26, d: 90 }], ["big", { cx: 30, cz: -12, w: 48, d: 180 }]];
  return {
    blockType: [
      { name: "types", build: () => blockType.TYPE_META },
      { name: "params", build: () => Object.keys(blockType.TYPE_META).map((id) => blockType.rollBlockParams(id, pinRandom(7), { palettes: ["brick"] })) },
      ...Object.keys(blockType.SPACINGS).map((spacing) => ({ name: `fill.${spacing}`, build: () => recordFill(spacing) })),
      { name: "party", build: () => blockType.touchingSides([
        { x: 0, z: 0, rot: 0, w: 10, d: 8 }, { x: 10, z: 0, rot: 0, w: 10, d: 8 }, { x: -1, z: -9, rot: 270, w: 10, d: 8 }, { x: 30, z: 0, rot: 90, w: 6, d: 6 },
      ]) },
    ],
    busStop: busStop.TYPES.flatMap((t) => [4.5, 7, 10].map((lateral) => ({ name: `${t}.${lateral}`, build: () => busStop.buildSide(t, lateral) }))),
    cableCarStation: [
      { name: "types", build: () => cableCarStation.TYPE_META },
      ...Object.keys(cableCarStation.TYPE_META).flatMap((t) => [false, true].map((circulating) => ({
        name: `${t}.${circulating ? "ring" : "shuttle"}`, build: () => cableCarStation.buildStation(t, { ...cableCarStation.DEFAULT_VIEW, circulating }),
      }))),
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
    station: [
      { name: "types", build: () => station.TYPE_META },
      // the default layout and every type's row signatures: a placed default station
      // stores no layout, and a stored one renders only while its signature matches
      ...Object.keys(station.TYPE_META).flatMap((type) => [1, 2, 3, 4, 5, 6].map((tracks) => ({ name: `${type}.layout.${tracks}`, build: () => station.buildLayout(type, tracks) }))),
      ...Object.keys(station.TYPE_META).flatMap((type) => [1, 4].map((tracks) => ({ name: `${type}.${tracks}x120`, build: () => station.furnish(type, 120, station.buildLayout(type, tracks)) }))),
    ],
    roadStation: [
      { name: "types", build: () => roadStation.TYPE_META },
      ...Object.keys(roadStation.TYPE_META).map((type) => ({ name: `${type}.site`, build: () => roadStation.dress(type, ROAD_STATION_SITE) })),
    ],
    bridge: [
      { name: "types", build: () => bridge.TYPE_META },
      ...Object.keys(bridge.TYPE_META).flatMap((type) => [
        { name: `${type}.overhead`, build: () => [40, 150, 300].map((l) => bridge.overheadMembers(type, l, 9, 9.9)) },
        { name: `${type}.valley`, build: () => bridge.buildBridge(type, BRIDGE_PATH, BRIDGE_VALLEY) },
      ]),
    ],
    catenaryStyle: [
      { name: "types", build: () => catenaryStyle.TYPE_META },
      ...([["trackside", [4], [0, -8], false], ["portal", [-4, 12], [0, 8], false], ["deck", [3.4], [0], true]] as const).map(([name, uprights, drops, deck]) => ({
        name: `rail_mast.${name}`,
        build: () => catenaryStyle.mast("rail_mast", { uprights: [...uprights], drops: [...drops], deck, groundY: 10, railTop: 1.56, contact: 6.2, messenger: 7.5, deckRise: 0.67, deckFootingWidth: 1.1, wire: 0.08 }),
      })),
      ...([["single", 5, [0], false], ["double", -7.6, [-4, 4], false], ["deck", 6.2, [-4, 4], true]] as const).map(([name, offset, offsets, deck]) => ({
        name: `tram_pole.${name}`,
        build: () => catenaryStyle.pole("tram_pole", { offset, offsets: [...offsets], groundY: 10, trackYs: offsets.map((o) => 10.2 + o * 0.01), wireLift: 7.7, deck, deckRise: 0.67, wire: 0.08 }),
      })),
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
