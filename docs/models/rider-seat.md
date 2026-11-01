# Rider seat

**Covers** - where the game's avatar sits when it rides a vehicle: how the build measures the seat on every vehicle's model (the roof's height map, the head section first, clear of pantographs and roof equipment, never inside), the frame it is exported in, and the `rider` field of the vehicle meta.
**Code** - `generator/riderSeat.ts` (`heightMap`, `seatOnMap`, `riderSeat`, `gameYaw`), `generator/generate.ts` (`vehicleSeat`, `generateModels`, `exportAll`), `generator/catalog.ts` (`MetaEntry.rider`, `metaEntry`, `exportVehicleMeta`), `test/riderSeat.test.ts`
**See also** - [game-properties.md](game-properties.md), [vehicle-rig.md](vehicle-rig.md), [export.md](export.md), [vehicles.md](vehicles.md)

## What it is for

The game's avatar can board any vehicle and ride it. It sits **on top**: on the roof
of the car (or section) nearest to it, visibly, in the head section of that roof -
as near the front end as the roof allows - and never inside a cab or a cabin. The
spot does not have to be realistic or safe; it has to be on the roof, flat enough
to sit on and clear of what stands on the roof. The game reads it from the vehicle
meta (rail-island-webapp, `docs/gameplay/avatar.md`, "Riding a vehicle").

## How it is measured

The seat is **measured on the built model** by the build, not declared on the
design, so every vehicle - a locomotive, a coach, a wagon, a bus, a truck, a tram, a
ship, an aircraft, a cable car cabin - has one, and a new design needs nothing to
get it (`vehicleSeat`, called from `generateModels` for every vehicle id).

1. The model's triangles (its exterior; the interior is left out) are turned into
   the game's vehicle frame - the nose at min X - by the yaw the game turns the
   model by (`gameYaw`: the design's catalog `yaw`, else 180 for the road and rail
   vehicles the factory builds nose-first along +X, else 0).
2. They are laid out as a **height map** seen from above, 0.1 m cells: the highest
   surface over each cell (`heightMap`).
3. The **roof's height** is the typical top of the centreline - the 75th
   percentile of its cells - so a tail fin, a funnel or a raised pantograph does
   not count as the roof.
4. A seat's footprint (0.8 m along, 0.6 m across, on the centreline) is slid from
   the nose back (`seatOnMap`). The first place that passes every test is the seat:
   - every cell under it has a surface;
   - it is **at roof level**: at least 70 % of the roof's height over the body's
     bottom (not a buffer beam, a coupler or a low bonnet), and at most 0.35 m over
     the roof (not on top of an air conditioner or a pantograph's frame);
   - it is **flat enough** to sit on: at most 0.25 m between its lowest and highest
     cell (a cab roof's gentle slope still seats a figure);
   - it is **clear**: nothing within 0.3 m along and 0.2 m across stands more than
     0.15 m above it. Pantographs are drawn raised at rest, so a raised pantograph
     keeps the seat off its whole plan.
5. Without such a place the seat is the flattest place at roof level; without
   that, the top of the body's middle.
6. The point - the seat's highest cell, on the centreline - is turned back into the
   model's own frame and rounded to 0.1 mm.

The head section wins because the search starts at the nose: a locomotive's seat
is on its leading cab roof ahead of the pantograph, a bus's over the windscreen, an
aircraft's behind the cockpit. A steam locomotive, whose boiler carries a chimney
and domes, sits on the cab roof; a unit's car with a pantograph on its front end
sits just behind it.

## Export

`metaEntry` writes the seat as `rider: [x, y, z]` - metres, the model's own frame,
the frame its `rig` and its emitters are in - on the vehicle's entry in
`vehicles.meta.json` (and the site's catalog record). Only the default variant is
measured; the game uses it for every variant of the design. The game carries the
point into its vehicle frame with the model's yaw and scale, as it carries the
smoke anchors, and falls back to the front of the roof for an old model id that has
no seat.

## Checks

`test/riderSeat.test.ts` checks the search on synthetic bodies (a plain roof, a
pantograph over the front, a low buffer beam, a tall fin, the frame turn) and the
measured seats of a sample of real vehicles: in the front half, on the top surface,
clear of every pantograph triangle.
