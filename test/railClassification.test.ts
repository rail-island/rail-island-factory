// How the rail vehicles are filed (catalog group + traction), which the site's
// filter chips read: a locomotive hauls a train, a unit has power and carries
// passengers, and both name their traction.

import { describe, expect, it } from "vitest";
import { ALL_VEHICLES } from "../generator/generate.ts";
import { VEHICLE_CATALOG } from "../generator/vehicles.ts";

const fields = (id: string) => {
  const d = ALL_VEHICLES.find((v) => v.id === id);
  if (!d) throw new Error(`no design ${id}`);
  return d.catalog ?? VEHICLE_CATALOG;
};

describe("the rail vehicles' classification", () => {
  it("files the multiple units and railcars as units, with their traction", () => {
    const units: Record<string, string> = {
      "proc-vehicle-cd-471": "electric", "proc-vehicle-cd-680": "electric", "proc-vehicle-cd-451": "electric",
      "proc-vehicle-cd-460": "electric", "proc-vehicle-cd-470": "electric", "proc-vehicle-ice-1": "electric", "proc-vehicle-tgv": "electric",
      "proc-vehicle-cd-810": "diesel", "proc-vehicle-cd-843": "diesel", "proc-vehicle-csd-m131": "diesel", "proc-vehicle-csd-m240": "diesel",
      "proc-vehicle-csd-m296": "diesel", "proc-vehicle-db-628": "diesel", "proc-vehicle-mav-mdmot": "diesel",
      "proc-vehicle-csd-m112": "steam",
    };
    for (const [id, traction] of Object.entries(units)) expect([id, fields(id)]).toMatchObject([id, { group: "unit", traction }]);
  });

  it("files the locomotives as locos, with their traction", () => {
    expect(fields("proc-vehicle-cd-150")).toMatchObject({ group: "loco", traction: "electric" });
    expect(fields("proc-vehicle-cd-750")).toMatchObject({ group: "loco", traction: "diesel" });
    expect(fields("proc-vehicle-csd-433-0")).toMatchObject({ group: "loco", traction: "steam" });
  });

  it("gives every locomotive and unit a traction, and nothing else one", () => {
    for (const d of ALL_VEHICLES) {
      const f = d.catalog ?? VEHICLE_CATALOG;
      const powered = f.group === "loco" || f.group === "unit";
      expect([d.id, !!f.traction]).toEqual([d.id, powered]);
    }
  });
});
