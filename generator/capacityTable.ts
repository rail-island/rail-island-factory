// Every vehicle's seats and cargo space, stated by hand (docs/models/traffic.md):
// passengers (seated and standing), and tonnes of freight with the commodities it
// may carry (one at a time), at its default parameters, with variants where a
// parameter (a unit's car or car count, a bus type) changes them. Keyed by the
// exported model id, split by family under generator/capacity/. Every vehicle but
// the locomotives and the cable car machinery must have an entry (traffic.ts
// mustCarry); the export writes `game.capacity`, `{}` for the rest. `source` names
// the real type's published figures, or "size" where the numbers are judged from
// the model.
//
// The commodities follow the body: an open wagon, hopper or tipper takes coal,
// iron ore and grain (a covered grain hopper grain alone); a tank oil and fuel; a
// reefer food; a box van, covered wagon, curtainsider or container goods and food;
// a flat wagon or low loader steel, wood and goods; an aircraft's hold goods and
// mail; a luggage van or mail room mail. A vehicle with several holds states their
// tonnes summed and the union of what they take.

import type { VehicleCapacityEntry } from "./traffic.ts";
import { RAIL_UNITS_A } from "./capacity/railUnitsA.ts";
import { RAIL_UNITS_B } from "./capacity/railUnitsB.ts";
import { RAIL_CARS } from "./capacity/railCars.ts";
import { ROAD_WATER_AIR } from "./capacity/roadWaterAir.ts";

export const VEHICLE_CAPACITY: Readonly<Record<string, VehicleCapacityEntry>> = {
  ...RAIL_UNITS_A,
  ...RAIL_UNITS_B,
  ...RAIL_CARS,
  ...ROAD_WATER_AIR,
};
