# Boarding door

**Covers** - where the game's jet bridge docks to an aeroplane: how the build measures the forward left main-deck door on every aeroplane's model (the `door` material's panels, upright ones only, the lowest deck, the front-most), the frame it is exported in, and the `door` field of the vehicle meta.
**Code** - `generator/boardingDoor.ts` (`leftDoorPanels`, `doorOfPanels`, `boardingDoor`), `generator/generate.ts` (`measuresDoor`, `aircraftDoor`, `generateModels`, `exportAll`), `generator/buildCache.ts` (`DesignFacts.door`, `BOARDING_DOOR_SOURCE`), `generator/catalog.ts` (`MetaEntry.door`, `metaEntry`, `exportVehicleMeta`), `test/boardingDoor.test.ts`
**See also** - [rider-seat.md](rider-seat.md) (measured the same way), [airfield.md](airfield.md) (the jet bridges), [aircraft.md](aircraft.md), [export.md](export.md), the game's `docs/gameplay/aircraft.md`

## What it is for

An international airport's jet bridges swing, telescope and lift to the parked
aircraft's door (the bridge is drawn here, posed by the game: [airfield.md](airfield.md),
"Jet bridges"). The game needs to know where that door is on each airframe; nothing a
design declares says so, and a door's place is already drawn on every model. So the
build **measures** it, as it measures the rider seat, and every new aeroplane gets one
without stating anything.

## How it is measured

`measuresDoor` picks the designs: every `Aircraft` that is not a helicopter (a
helicopter uses pads, never a stand). For each, on the default build:

1. The triangles drawn in the **`door` material** are taken - the airframe kit's door
   decals and the hand-built airliners' door panels - and turned into the game's vehicle
   frame (`gameYaw`: nose at min X; the model's **left side is +Z** there).
2. Those on the left side (a triangle's centre at z > 0) are grouped into **panels**:
   two triangles whose boxes come within 0.25 m of each other belong to one panel.
3. A panel counts as a **door** when it is upright: at least 0.4 m tall and at least
   0.8 times as tall as it is wide. A passenger door is (a kit decal about square, a
   hand-built panel more than twice as tall as wide); the landing gear doors some
   airliners draw in the same material lie wide and low, and are dropped.
4. Of the doors, the **main deck** is those whose sill is within 0.6 m of the lowest
   sill - an A380's or a 747's upper deck is not where the bridge docks.
5. The **front-most** main-deck door is the one: the forward left door, the one a jet
   bridge serves. On an aeroplane whose only left door is aft (a DC-3, a Twin Otter)
   that rear door is the one.
6. The point is the middle of that door's **sill** (its lowest edge), on the skin (its
   outermost z), turned back into the model's own frame and rounded to 0.1 mm.

A model that draws no upright door panel (a light aeroplane, the airship) has none.

## Export

`metaEntry` writes the door as `door: [x, y, z]` - metres, the model's own frame, the
frame its `rider` seat is in - on the aeroplane's entry in `vehicles.meta.json` (and the
site's catalog record). It is a measurement, not a game property, so it sits beside
`rider` rather than in `game`. Only the default variant is measured; the game uses it
for every variant of the design. The game carries the point into its vehicle frame with
the model's yaw and scale, as it carries the rider seat.

## The build cache

The door is a fact of the design's build (`DesignFacts.door`). Its measurement is part
of an **aircraft's** key only (`keySettings` adds the hash of `boardingDoor.ts` to an
aeroplane's settings), not of the shared `PIPELINE`, so changing it rebuilds the
aeroplanes and no other design ([../guide/build-cache.md](../guide/build-cache.md)).

## Checks

`test/boardingDoor.test.ts` checks the search on synthetic panels (the front-most left
door, the right side ignored, a gear door dropped, an upper-deck door passed over, none
without an upright panel, the frame turn) and the measured doors: measured on the
aeroplanes only; on a hand-built airliner with gear doors (the 747), a kit airliner (the
A320) and the double-decker (the A380), the forward left door ahead of a fifth of the
body, on the skin, as the cache holds it; every aeroplane's cached door inside its
bounds; and the meta entry's `door`.
