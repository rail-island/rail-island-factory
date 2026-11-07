// Saved airport layouts the airport preview pages and the set pins draw on
// (docs/models/airfield.md). The game's layout solver (rail-island-webapp,
// src/core/air/AirportLayout.ts) wrote them: each is exactly what a saved map holds for
// that type and size (default runway length, three stands, the type's helipads), plus
// a two-runway field as the solver laid it out while several runways were buildable
// (the webapp's test/helpers/legacyAirportLayouts.ts). The game never re-solves a placed
// airport, so these stay valid whatever its solver does next; regenerating them is
// optional and moves the airport pins. To regenerate, run in the webapp:
//
//   buildLayout(defaultRunwayLengthFor(size), 1, 3, size, type)     // "<type>.<size>"
//   buildLayout(defaultRunwayLengthFor("medium"), 1, 3, "medium", "heliport")
//   twoRunwayLayout()                                                // "regional.tworunways"
//
// and paste the JSON below. Not part of the exported set module.

import type { AirfieldLayout } from "./airport.ts";

/** The preview's airport sizes, smallest first. */
export const AIRFIELD_SIZES = ["small", "medium", "big"] as const;
export type AirfieldSize = typeof AIRFIELD_SIZES[number];

const LAYOUTS = {
  "grass_field.small": {
    version: 1,
    nodes: [
      {"id": 1, "x": -57.5, "z": -140},
      {"id": 2, "x": -57.5, "z": 140},
      {"id": 3, "x": -13.5, "z": -140},
      {"id": 4, "x": -13.5, "z": 140},
      {"id": 5, "x": -13.5, "z": -44},
      {"id": 6, "x": 26.5, "z": -44},
      {"id": 7, "x": -13.5, "z": 0},
      {"id": 8, "x": 26.5, "z": 0},
      {"id": 9, "x": -13.5, "z": 44},
      {"id": 10, "x": 26.5, "z": 44},
    ],
    edges: [
      {"id": 1, "a": 1, "b": 3, "width": 16, "kind": "runwayLink", "crosses": [1]},
      {"id": 2, "a": 2, "b": 4, "width": 16, "kind": "runwayLink", "crosses": [1]},
      {"id": 3, "a": 3, "b": 5, "width": 16, "kind": "spine", "crosses": []},
      {"id": 4, "a": 5, "b": 7, "width": 16, "kind": "spine", "crosses": []},
      {"id": 5, "a": 7, "b": 9, "width": 16, "kind": "spine", "crosses": []},
      {"id": 6, "a": 9, "b": 4, "width": 16, "kind": "spine", "crosses": []},
      {"id": 7, "a": 5, "b": 6, "width": 16, "kind": "standLink", "crosses": []},
      {"id": 8, "a": 7, "b": 8, "width": 16, "kind": "standLink", "crosses": []},
      {"id": 9, "a": 9, "b": 10, "width": 16, "kind": "standLink", "crosses": []},
    ],
    runways: [
      {"id": 1, "cx": -57.5, "cz": 0, "length": 280, "width": 42, "endNodes": [1, 2]},
    ],
    stands: [
      {"id": 1, "x": 26.5, "z": -44, "headingDeg": 90, "nodeId": 6},
      {"id": 2, "x": 26.5, "z": 0, "headingDeg": 90, "nodeId": 8},
      {"id": 3, "x": 26.5, "z": 44, "headingDeg": 90, "nodeId": 10},
    ],
    building: {"cx": 73.5, "cz": 0, "w": 26, "d": 162},
    footprint: {"cx": 0, "cz": 0, "w": 173, "d": 320},
  },
  "grass_field.medium": {
    version: 1,
    nodes: [
      {"id": 1, "x": -88.5, "z": -180},
      {"id": 2, "x": -88.5, "z": 180},
      {"id": 3, "x": -18.5, "z": -180},
      {"id": 4, "x": -18.5, "z": 180},
      {"id": 5, "x": -18.5, "z": -68},
      {"id": 6, "x": 45.5, "z": -68},
      {"id": 7, "x": -18.5, "z": 0},
      {"id": 8, "x": 45.5, "z": 0},
      {"id": 9, "x": -18.5, "z": 68},
      {"id": 10, "x": 45.5, "z": 68},
    ],
    edges: [
      {"id": 1, "a": 1, "b": 3, "width": 24, "kind": "runwayLink", "crosses": [1]},
      {"id": 2, "a": 2, "b": 4, "width": 24, "kind": "runwayLink", "crosses": [1]},
      {"id": 3, "a": 3, "b": 5, "width": 24, "kind": "spine", "crosses": []},
      {"id": 4, "a": 5, "b": 7, "width": 24, "kind": "spine", "crosses": []},
      {"id": 5, "a": 7, "b": 9, "width": 24, "kind": "spine", "crosses": []},
      {"id": 6, "a": 9, "b": 4, "width": 24, "kind": "spine", "crosses": []},
      {"id": 7, "a": 5, "b": 6, "width": 24, "kind": "standLink", "crosses": []},
      {"id": 8, "a": 7, "b": 8, "width": 24, "kind": "standLink", "crosses": []},
      {"id": 9, "a": 9, "b": 10, "width": 24, "kind": "standLink", "crosses": []},
    ],
    runways: [
      {"id": 1, "cx": -88.5, "cz": 0, "length": 360, "width": 70, "endNodes": [1, 2]},
    ],
    stands: [
      {"id": 1, "x": 45.5, "z": -68, "headingDeg": 90, "nodeId": 6},
      {"id": 2, "x": 45.5, "z": 0, "headingDeg": 90, "nodeId": 8},
      {"id": 3, "x": 45.5, "z": 68, "headingDeg": 90, "nodeId": 10},
    ],
    building: {"cx": 112.5, "cz": 0, "w": 38, "d": 234},
    footprint: {"cx": 0, "cz": 0, "w": 263, "d": 400},
  },
  "grass_field.big": {
    version: 1,
    nodes: [
      {"id": 1, "x": -112, "z": -220},
      {"id": 2, "x": -112, "z": 220},
      {"id": 3, "x": -20, "z": -220},
      {"id": 4, "x": -20, "z": 220},
      {"id": 5, "x": -20, "z": -88},
      {"id": 6, "x": 66, "z": -88},
      {"id": 7, "x": -20, "z": 0},
      {"id": 8, "x": 66, "z": 0},
      {"id": 9, "x": -20, "z": 88},
      {"id": 10, "x": 66, "z": 88},
    ],
    edges: [
      {"id": 1, "a": 1, "b": 3, "width": 30, "kind": "runwayLink", "crosses": [1]},
      {"id": 2, "a": 2, "b": 4, "width": 30, "kind": "runwayLink", "crosses": [1]},
      {"id": 3, "a": 3, "b": 5, "width": 30, "kind": "spine", "crosses": []},
      {"id": 4, "a": 5, "b": 7, "width": 30, "kind": "spine", "crosses": []},
      {"id": 5, "a": 7, "b": 9, "width": 30, "kind": "spine", "crosses": []},
      {"id": 6, "a": 9, "b": 4, "width": 30, "kind": "spine", "crosses": []},
      {"id": 7, "a": 5, "b": 6, "width": 30, "kind": "standLink", "crosses": []},
      {"id": 8, "a": 7, "b": 8, "width": 30, "kind": "standLink", "crosses": []},
      {"id": 9, "a": 9, "b": 10, "width": 30, "kind": "standLink", "crosses": []},
    ],
    runways: [
      {"id": 1, "cx": -112, "cz": 0, "length": 440, "width": 92, "endNodes": [1, 2]},
    ],
    stands: [
      {"id": 1, "x": 66, "z": -88, "headingDeg": 90, "nodeId": 6},
      {"id": 2, "x": 66, "z": 0, "headingDeg": 90, "nodeId": 8},
      {"id": 3, "x": 66, "z": 88, "headingDeg": 90, "nodeId": 10},
    ],
    building: {"cx": 142, "cz": 0, "w": 48, "d": 294},
    footprint: {"cx": 0, "cz": 0, "w": 332, "d": 480},
  },
  "regional.small": {
    version: 1,
    nodes: [
      {"id": 1, "x": -57.5, "z": -140},
      {"id": 2, "x": -57.5, "z": 140},
      {"id": 3, "x": -13.5, "z": -140},
      {"id": 4, "x": -13.5, "z": 140},
      {"id": 5, "x": -13.5, "z": -44},
      {"id": 6, "x": 26.5, "z": -44},
      {"id": 7, "x": -13.5, "z": 0},
      {"id": 8, "x": 26.5, "z": 0},
      {"id": 9, "x": -13.5, "z": 44},
      {"id": 10, "x": 26.5, "z": 44},
    ],
    edges: [
      {"id": 1, "a": 1, "b": 3, "width": 16, "kind": "runwayLink", "crosses": [1]},
      {"id": 2, "a": 2, "b": 4, "width": 16, "kind": "runwayLink", "crosses": [1]},
      {"id": 3, "a": 3, "b": 5, "width": 16, "kind": "spine", "crosses": []},
      {"id": 4, "a": 5, "b": 7, "width": 16, "kind": "spine", "crosses": []},
      {"id": 5, "a": 7, "b": 9, "width": 16, "kind": "spine", "crosses": []},
      {"id": 6, "a": 9, "b": 4, "width": 16, "kind": "spine", "crosses": []},
      {"id": 7, "a": 5, "b": 6, "width": 16, "kind": "standLink", "crosses": []},
      {"id": 8, "a": 7, "b": 8, "width": 16, "kind": "standLink", "crosses": []},
      {"id": 9, "a": 9, "b": 10, "width": 16, "kind": "standLink", "crosses": []},
    ],
    runways: [
      {"id": 1, "cx": -57.5, "cz": 0, "length": 280, "width": 42, "endNodes": [1, 2]},
    ],
    stands: [
      {"id": 1, "x": 26.5, "z": -44, "headingDeg": 90, "nodeId": 6},
      {"id": 2, "x": 26.5, "z": 0, "headingDeg": 90, "nodeId": 8},
      {"id": 3, "x": 26.5, "z": 44, "headingDeg": 90, "nodeId": 10},
    ],
    pads: [
      {"id": 1, "cx": 63, "cz": 108.5, "headingDeg": 0, "pad": "large"},
    ],
    building: {"cx": 73.5, "cz": 0, "w": 26, "d": 162},
    footprint: {"cx": 0, "cz": 0, "w": 173, "d": 320},
  },
  "regional.medium": {
    version: 1,
    nodes: [
      {"id": 1, "x": -88.5, "z": -180},
      {"id": 2, "x": -88.5, "z": 180},
      {"id": 3, "x": -18.5, "z": -180},
      {"id": 4, "x": -18.5, "z": 180},
      {"id": 5, "x": -18.5, "z": -68},
      {"id": 6, "x": 45.5, "z": -68},
      {"id": 7, "x": -18.5, "z": 0},
      {"id": 8, "x": 45.5, "z": 0},
      {"id": 9, "x": -18.5, "z": 68},
      {"id": 10, "x": 45.5, "z": 68},
    ],
    edges: [
      {"id": 1, "a": 1, "b": 3, "width": 24, "kind": "runwayLink", "crosses": [1]},
      {"id": 2, "a": 2, "b": 4, "width": 24, "kind": "runwayLink", "crosses": [1]},
      {"id": 3, "a": 3, "b": 5, "width": 24, "kind": "spine", "crosses": []},
      {"id": 4, "a": 5, "b": 7, "width": 24, "kind": "spine", "crosses": []},
      {"id": 5, "a": 7, "b": 9, "width": 24, "kind": "spine", "crosses": []},
      {"id": 6, "a": 9, "b": 4, "width": 24, "kind": "spine", "crosses": []},
      {"id": 7, "a": 5, "b": 6, "width": 24, "kind": "standLink", "crosses": []},
      {"id": 8, "a": 7, "b": 8, "width": 24, "kind": "standLink", "crosses": []},
      {"id": 9, "a": 9, "b": 10, "width": 24, "kind": "standLink", "crosses": []},
    ],
    runways: [
      {"id": 1, "cx": -88.5, "cz": 0, "length": 360, "width": 70, "endNodes": [1, 2]},
    ],
    stands: [
      {"id": 1, "x": 45.5, "z": -68, "headingDeg": 90, "nodeId": 6},
      {"id": 2, "x": 45.5, "z": 0, "headingDeg": 90, "nodeId": 8},
      {"id": 3, "x": 45.5, "z": 68, "headingDeg": 90, "nodeId": 10},
    ],
    pads: [
      {"id": 1, "cx": 108, "cz": 144.5, "headingDeg": 0, "pad": "large"},
    ],
    building: {"cx": 112.5, "cz": 0, "w": 38, "d": 234},
    footprint: {"cx": 0, "cz": 0, "w": 263, "d": 400},
  },
  "regional.big": {
    version: 1,
    nodes: [
      {"id": 1, "x": -112, "z": -220},
      {"id": 2, "x": -112, "z": 220},
      {"id": 3, "x": -20, "z": -220},
      {"id": 4, "x": -20, "z": 220},
      {"id": 5, "x": -20, "z": -88},
      {"id": 6, "x": 66, "z": -88},
      {"id": 7, "x": -20, "z": 0},
      {"id": 8, "x": 66, "z": 0},
      {"id": 9, "x": -20, "z": 88},
      {"id": 10, "x": 66, "z": 88},
    ],
    edges: [
      {"id": 1, "a": 1, "b": 3, "width": 30, "kind": "runwayLink", "crosses": [1]},
      {"id": 2, "a": 2, "b": 4, "width": 30, "kind": "runwayLink", "crosses": [1]},
      {"id": 3, "a": 3, "b": 5, "width": 30, "kind": "spine", "crosses": []},
      {"id": 4, "a": 5, "b": 7, "width": 30, "kind": "spine", "crosses": []},
      {"id": 5, "a": 7, "b": 9, "width": 30, "kind": "spine", "crosses": []},
      {"id": 6, "a": 9, "b": 4, "width": 30, "kind": "spine", "crosses": []},
      {"id": 7, "a": 5, "b": 6, "width": 30, "kind": "standLink", "crosses": []},
      {"id": 8, "a": 7, "b": 8, "width": 30, "kind": "standLink", "crosses": []},
      {"id": 9, "a": 9, "b": 10, "width": 30, "kind": "standLink", "crosses": []},
    ],
    runways: [
      {"id": 1, "cx": -112, "cz": 0, "length": 440, "width": 92, "endNodes": [1, 2]},
    ],
    stands: [
      {"id": 1, "x": 66, "z": -88, "headingDeg": 90, "nodeId": 6},
      {"id": 2, "x": 66, "z": 0, "headingDeg": 90, "nodeId": 8},
      {"id": 3, "x": 66, "z": 88, "headingDeg": 90, "nodeId": 10},
    ],
    pads: [
      {"id": 1, "cx": 142.5, "cz": 174.5, "headingDeg": 0, "pad": "large"},
    ],
    building: {"cx": 142, "cz": 0, "w": 48, "d": 294},
    footprint: {"cx": 0, "cz": 0, "w": 332, "d": 480},
  },
  "international.small": {
    version: 1,
    nodes: [
      {"id": 1, "x": -57.5, "z": -140},
      {"id": 2, "x": -57.5, "z": 140},
      {"id": 3, "x": -13.5, "z": -140},
      {"id": 4, "x": -13.5, "z": 140},
      {"id": 5, "x": -13.5, "z": -44},
      {"id": 6, "x": 26.5, "z": -44},
      {"id": 7, "x": -13.5, "z": 0},
      {"id": 8, "x": 26.5, "z": 0},
      {"id": 9, "x": -13.5, "z": 44},
      {"id": 10, "x": 26.5, "z": 44},
    ],
    edges: [
      {"id": 1, "a": 1, "b": 3, "width": 16, "kind": "runwayLink", "crosses": [1]},
      {"id": 2, "a": 2, "b": 4, "width": 16, "kind": "runwayLink", "crosses": [1]},
      {"id": 3, "a": 3, "b": 5, "width": 16, "kind": "spine", "crosses": []},
      {"id": 4, "a": 5, "b": 7, "width": 16, "kind": "spine", "crosses": []},
      {"id": 5, "a": 7, "b": 9, "width": 16, "kind": "spine", "crosses": []},
      {"id": 6, "a": 9, "b": 4, "width": 16, "kind": "spine", "crosses": []},
      {"id": 7, "a": 5, "b": 6, "width": 16, "kind": "standLink", "crosses": []},
      {"id": 8, "a": 7, "b": 8, "width": 16, "kind": "standLink", "crosses": []},
      {"id": 9, "a": 9, "b": 10, "width": 16, "kind": "standLink", "crosses": []},
    ],
    runways: [
      {"id": 1, "cx": -57.5, "cz": 0, "length": 280, "width": 42, "endNodes": [1, 2]},
    ],
    stands: [
      {"id": 1, "x": 26.5, "z": -44, "headingDeg": 90, "nodeId": 6},
      {"id": 2, "x": 26.5, "z": 0, "headingDeg": 90, "nodeId": 8},
      {"id": 3, "x": 26.5, "z": 44, "headingDeg": 90, "nodeId": 10},
    ],
    pads: [
      {"id": 1, "cx": 63, "cz": 108.5, "headingDeg": 0, "pad": "large"},
      {"id": 2, "cx": 63, "cz": 155.5, "headingDeg": 0, "pad": "large"},
    ],
    building: {"cx": 73.5, "cz": 0, "w": 26, "d": 162},
    footprint: {"cx": 0, "cz": 11.5, "w": 173, "d": 343},
  },
  "international.medium": {
    version: 1,
    nodes: [
      {"id": 1, "x": -88.5, "z": -180},
      {"id": 2, "x": -88.5, "z": 180},
      {"id": 3, "x": -18.5, "z": -180},
      {"id": 4, "x": -18.5, "z": 180},
      {"id": 5, "x": -18.5, "z": -68},
      {"id": 6, "x": 45.5, "z": -68},
      {"id": 7, "x": -18.5, "z": 0},
      {"id": 8, "x": 45.5, "z": 0},
      {"id": 9, "x": -18.5, "z": 68},
      {"id": 10, "x": 45.5, "z": 68},
    ],
    edges: [
      {"id": 1, "a": 1, "b": 3, "width": 24, "kind": "runwayLink", "crosses": [1]},
      {"id": 2, "a": 2, "b": 4, "width": 24, "kind": "runwayLink", "crosses": [1]},
      {"id": 3, "a": 3, "b": 5, "width": 24, "kind": "spine", "crosses": []},
      {"id": 4, "a": 5, "b": 7, "width": 24, "kind": "spine", "crosses": []},
      {"id": 5, "a": 7, "b": 9, "width": 24, "kind": "spine", "crosses": []},
      {"id": 6, "a": 9, "b": 4, "width": 24, "kind": "spine", "crosses": []},
      {"id": 7, "a": 5, "b": 6, "width": 24, "kind": "standLink", "crosses": []},
      {"id": 8, "a": 7, "b": 8, "width": 24, "kind": "standLink", "crosses": []},
      {"id": 9, "a": 9, "b": 10, "width": 24, "kind": "standLink", "crosses": []},
    ],
    runways: [
      {"id": 1, "cx": -88.5, "cz": 0, "length": 360, "width": 70, "endNodes": [1, 2]},
    ],
    stands: [
      {"id": 1, "x": 45.5, "z": -68, "headingDeg": 90, "nodeId": 6},
      {"id": 2, "x": 45.5, "z": 0, "headingDeg": 90, "nodeId": 8},
      {"id": 3, "x": 45.5, "z": 68, "headingDeg": 90, "nodeId": 10},
    ],
    pads: [
      {"id": 1, "cx": 108, "cz": 144.5, "headingDeg": 0, "pad": "large"},
      {"id": 2, "cx": 108, "cz": 191.5, "headingDeg": 0, "pad": "large"},
    ],
    building: {"cx": 112.5, "cz": 0, "w": 38, "d": 234},
    footprint: {"cx": 0, "cz": 9.5, "w": 263, "d": 419},
  },
  "international.big": {
    version: 1,
    nodes: [
      {"id": 1, "x": -112, "z": -220},
      {"id": 2, "x": -112, "z": 220},
      {"id": 3, "x": -20, "z": -220},
      {"id": 4, "x": -20, "z": 220},
      {"id": 5, "x": -20, "z": -88},
      {"id": 6, "x": 66, "z": -88},
      {"id": 7, "x": -20, "z": 0},
      {"id": 8, "x": 66, "z": 0},
      {"id": 9, "x": -20, "z": 88},
      {"id": 10, "x": 66, "z": 88},
    ],
    edges: [
      {"id": 1, "a": 1, "b": 3, "width": 30, "kind": "runwayLink", "crosses": [1]},
      {"id": 2, "a": 2, "b": 4, "width": 30, "kind": "runwayLink", "crosses": [1]},
      {"id": 3, "a": 3, "b": 5, "width": 30, "kind": "spine", "crosses": []},
      {"id": 4, "a": 5, "b": 7, "width": 30, "kind": "spine", "crosses": []},
      {"id": 5, "a": 7, "b": 9, "width": 30, "kind": "spine", "crosses": []},
      {"id": 6, "a": 9, "b": 4, "width": 30, "kind": "spine", "crosses": []},
      {"id": 7, "a": 5, "b": 6, "width": 30, "kind": "standLink", "crosses": []},
      {"id": 8, "a": 7, "b": 8, "width": 30, "kind": "standLink", "crosses": []},
      {"id": 9, "a": 9, "b": 10, "width": 30, "kind": "standLink", "crosses": []},
    ],
    runways: [
      {"id": 1, "cx": -112, "cz": 0, "length": 440, "width": 92, "endNodes": [1, 2]},
    ],
    stands: [
      {"id": 1, "x": 66, "z": -88, "headingDeg": 90, "nodeId": 6},
      {"id": 2, "x": 66, "z": 0, "headingDeg": 90, "nodeId": 8},
      {"id": 3, "x": 66, "z": 88, "headingDeg": 90, "nodeId": 10},
    ],
    pads: [
      {"id": 1, "cx": 142.5, "cz": 174.5, "headingDeg": 0, "pad": "large"},
      {"id": 2, "cx": 142.5, "cz": 221.5, "headingDeg": 0, "pad": "large"},
    ],
    building: {"cx": 142, "cz": 0, "w": 48, "d": 294},
    footprint: {"cx": 0, "cz": 4.5, "w": 332, "d": 489},
  },
  "heliport": {
    version: 1,
    nodes: [],
    edges: [],
    runways: [],
    stands: [],
    pads: [
      {"id": 1, "cx": 12.5, "cz": -23.5, "headingDeg": 0, "pad": "large"},
      {"id": 2, "cx": 12.5, "cz": 23.5, "headingDeg": 0, "pad": "large"},
      {"id": 3, "cx": -34.5, "cz": -23.5, "headingDeg": 0, "pad": "large"},
      {"id": 4, "cx": -34.5, "cz": 23.5, "headingDeg": 0, "pad": "large"},
    ],
    building: {"cx": 51, "cz": 0, "w": 22, "d": 40},
    footprint: {"cx": 0, "cz": 0, "w": 124, "d": 102},
  },
  "regional.tworunways": {
    version: 1,
    nodes: [
      {"id": 1, "x": -88.5, "z": -180},
      {"id": 2, "x": -88.5, "z": 180},
      {"id": 3, "x": -18.5, "z": -180},
      {"id": 4, "x": -18.5, "z": 180},
      {"id": 5, "x": -18.5, "z": -102},
      {"id": 6, "x": 45.5, "z": -102},
      {"id": 7, "x": -18.5, "z": -34},
      {"id": 8, "x": 45.5, "z": -34},
      {"id": 9, "x": -18.5, "z": 34},
      {"id": 10, "x": 45.5, "z": 34},
      {"id": 11, "x": -18.5, "z": 102},
      {"id": 12, "x": 45.5, "z": 102},
      {"id": 13, "x": -208.5, "z": -180},
      {"id": 14, "x": -208.5, "z": 180},
    ],
    edges: [
      {"id": 1, "a": 1, "b": 3, "width": 24, "kind": "runwayLink", "crosses": [1]},
      {"id": 2, "a": 2, "b": 4, "width": 24, "kind": "runwayLink", "crosses": [1]},
      {"id": 3, "a": 3, "b": 5, "width": 24, "kind": "spine", "crosses": []},
      {"id": 4, "a": 5, "b": 7, "width": 24, "kind": "spine", "crosses": []},
      {"id": 5, "a": 7, "b": 9, "width": 24, "kind": "spine", "crosses": []},
      {"id": 6, "a": 9, "b": 11, "width": 24, "kind": "spine", "crosses": []},
      {"id": 7, "a": 11, "b": 4, "width": 24, "kind": "spine", "crosses": []},
      {"id": 8, "a": 5, "b": 6, "width": 24, "kind": "standLink", "crosses": []},
      {"id": 9, "a": 7, "b": 8, "width": 24, "kind": "standLink", "crosses": []},
      {"id": 10, "a": 9, "b": 10, "width": 24, "kind": "standLink", "crosses": []},
      {"id": 11, "a": 11, "b": 12, "width": 24, "kind": "standLink", "crosses": []},
      {"id": 12, "a": 13, "b": 1, "width": 24, "kind": "runwayLink", "crosses": [2, 1]},
      {"id": 13, "a": 14, "b": 2, "width": 24, "kind": "runwayLink", "crosses": [2, 1]},
    ],
    runways: [
      {"id": 1, "cx": -88.5, "cz": 0, "length": 360, "width": 70, "endNodes": [1, 2]},
      {"id": 2, "cx": -208.5, "cz": 0, "length": 360, "width": 70, "endNodes": [13, 14]},
    ],
    stands: [
      {"id": 1, "x": 45.5, "z": -102, "headingDeg": 90, "nodeId": 6},
      {"id": 2, "x": 45.5, "z": -34, "headingDeg": 90, "nodeId": 8},
      {"id": 3, "x": 45.5, "z": 34, "headingDeg": 90, "nodeId": 10},
      {"id": 4, "x": 45.5, "z": 102, "headingDeg": 90, "nodeId": 12},
    ],
    pads: [
      {"id": 1, "cx": 108, "cz": 178.5, "headingDeg": 0, "pad": "large"},
    ],
    building: {"cx": 112.5, "cz": 0, "w": 38, "d": 302},
    footprint: {"cx": -60, "cz": 3, "w": 383, "d": 406},
  },
} as const;

/** Every fixture by name: `<type>.<size>` for the runway types, `heliport`, `regional.tworunways`. */
export const AIRFIELD_FIXTURES: Readonly<Record<string, AirfieldLayout>> = LAYOUTS;

/** The layout a type's preview draws at a size: its own `<type>.<size>`, the heliport's one layout at every size. */
export function airfieldFixture(type: string, size: AirfieldSize): AirfieldLayout {
  return AIRFIELD_FIXTURES[type === "heliport" ? "heliport" : `${type}.${size}`] ?? AIRFIELD_FIXTURES[`regional.${size}`]!;
}
