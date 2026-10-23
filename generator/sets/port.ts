// The port types (docs/models/sets.md). Six ids, but only two things vary: the
// FAMILY -- the shape of the harbour, which decides the axis its rows stack along --
// and the GRADE, which decides the materials and the furniture. The game's layout,
// berth and approach solvers branch on these two, never on the ids. The furniture
// itself (crane, containers, hut, floodlights, bollards, mooring posts) is the
// factory's props (generator/props/portProps.ts); the game lays them out.
//
// Pure data, no imports: bundled into export/sets/port.js for the game.

export type PortFamily = "sea" | "river";
export type PortGrade = "timber" | "concrete" | "terminal";

/** Per type: its family and grade. */
export const TYPE_META: Record<string, { family: PortFamily; grade: PortGrade }> = {
  wooden_jetty: { family: "sea", grade: "timber" },
  concrete_quay: { family: "sea", grade: "concrete" },
  passenger_terminal: { family: "sea", grade: "terminal" },
  river_jetty: { family: "river", grade: "timber" },
  river_quay: { family: "river", grade: "concrete" },
  river_terminal: { family: "river", grade: "terminal" },
};

/** The props a port is furnished with, by role: the game names a role, the factory the model. */
export const PROPS: Record<string, string> = {
  crane: "proc-prop-port-crane",
  container: "proc-prop-port-container",
  hut: "proc-prop-port-hut",
  floodlight: "proc-prop-port-floodlight",
  bollard: "proc-prop-port-bollard",
  mooringPost: "proc-prop-port-mooring-post",
};

/** How many container liveries there are (the container prop's `livery` values 0..n-1). */
export const CONTAINER_LIVERIES = 6;
