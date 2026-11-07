// Every aircraft has a kind for the site's Aircraft chips (generator/airframeKinds.ts).
import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate.ts";
import { airframeKind } from "../generator/airframeKinds.ts";

describe("airframe kinds", () => {
  const aircraft = [...DESIGNS.values()].filter((d) => d.catalog?.category === "Aircraft");

  it("gives every aircraft a kind, and nothing else one", () => {
    for (const d of aircraft) expect(airframeKind(d.id), d.id).not.toBeNull();
    for (const d of DESIGNS.values()) if (d.catalog?.category !== "Aircraft") expect(airframeKind(d.id), d.id).toBeNull();
  });

  it("files the helicopters by their game kind, the Zeppelin as an airship and the hand-built aircraft by engine", () => {
    const of = (kind: string) => aircraft.filter((d) => airframeKind(d.id) === kind).map((d) => d.id);
    expect(of("helicopter").sort()).toEqual(aircraft.filter((d) => d.game?.aircraftKind === "helicopter").map((d) => d.id).sort());
    expect(of("helicopter")).toContain("proc-vehicle-bell-206");
    expect(of("airship")).toEqual(["proc-vehicle-zeppelin-nt"]);
    expect(of("propeller")).toEqual(expect.arrayContaining(["proc-vehicle-small-airplane", "proc-vehicle-aero-a10"]));
    expect(of("jet")).toEqual(expect.arrayContaining(["proc-vehicle-boeing-737", "proc-vehicle-airbus-a380"]));
  });
});
