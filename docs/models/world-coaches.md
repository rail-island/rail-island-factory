# Coaches in a few measures

**Covers** - the coach generator on the passenger car builder: the measures a coach design states, its types of car and liveries, and the designs drawn with it.
**Code** - `generator/worldCoaches.ts` (`WorldCoach`, `buildCoach`, `buildCoachLod`, `coachDesign`, `WORLD_COACHES`), `generator/deIcCoach.ts` (the DB Intercity coach, laid out per side through `layout`), `generator/usTransit.ts` (`drawCar`, `carLod`, the `buffers` coupler)
**See also** - [us-transit.md](us-transit.md) (the car builder), [germany-trains.md](germany-trains.md)

A `WorldCoach` states a locomotive-hauled coach: its length over the buffers (or
couplers), the body's half width, belly, eaves and crown, the skirt, the window rows,
the doors at each end, the bogies and the coupler (`buffers`: a beam, two buffers and a
screw coupling 0.65 m beyond the body; `knuckle`; `centre`). Each type of car (`unit`)
has its own window count and width, number and weight; each livery its paints and side
bands; a first-class type (`first`) takes a livery's first-class bands, and a livery may paint the door leaves
and the ends apart (`doorBands`, `ends`: bands up to the doors' inner edges and the end walls' paint). Optional
`details` (`CoachDetails`, default none, so the plain coaches are unchanged) add what a characteristic car needs:
the tumblehome, an end window beside each door (with a louvred vent), the door window's size, door leaves reaching
below the body, rounded roof end caps and corners, longitudinal roof ribs, a roof-end air intake, rubber-roll
gangways with the end doors and tail lamps, the class numerals on their panels, the railway's emblem and the
number's place (the EW IV uses them all). The car builder draws the shell, windows, opening plug doors onto the cabin,
the gangway diaphragms, the bogies and the couplers; the LOD is its `carLod`.

A coach that is more than its window row reshapes the car the measures describe with
`adapt` (the car definition: its windows, doors, paint through the car builder's `repaint`
hook, extra shell stations through `CarbodySpec.stations`, extras) and its distant body with
`lodBody`; without them a design builds as before. The Glacier Express's panorama car uses
both (its glazed roof, red ends and single entrance; [switzerland-trains.md](switzerland-trains.md)).
A coach whose body the measures cannot state supplies its own `layout` (the car as the
kit laid it out, the type of car and the body's length in, the car out) and `lod` (the
distant body, the bogies' top and extra parts). The IC 2000 uses them
(`ic2000Layout`, [switzerland-trains.md](switzerland-trains.md)): skirt `cuts` over its
end sections step the bottom up, the car builder's `strips` paint its door and class
strips (their edges become stations, `CarbodySpec.stations`), a short plan rounding gives
its end walls round corners, and its LOD draws the dark lower body and the door strips
as boxes beside a shell from the white up.

## The designs

| id | country | length | units | liveries |
|---|---|---|---|---|
| `proc-vehicle-db-ic-coach` | Germany | 26.4 m | `avmz` (first class), `bpmz` (second class) | `tee`, `oceanBlue`, `intercity` |
| `proc-vehicle-sncf-corail-coach` | France | 26.4 m | `a10tu`, `b11tu` | `corail`, `teoz` |
| `proc-vehicle-sncf-grand-confort` | France | 24.5 m | `a8u` (compartments), `a7d` (bar car) | `capitole`, `tee` |
| `proc-vehicle-ciwl-car` | France | 23.45 m | `pullman`, `sleeping` | `pullman`, `ciwlBlue` |
| `proc-vehicle-ns-icr-coach` | the Netherlands | 26.4 m | `a`, `b` | `yellowGrey`, `yellowBlue` |
| `proc-vehicle-sbb-ew4-coach` | Switzerland | 26.4 m | `a`, `b` | `redGrey`, `sbb`, `greenGrey` |
| `proc-vehicle-sbb-ic2000` | Switzerland | 26.8 m, double-deck, stepped ends | `a`, `b` | - |
| `proc-vehicle-glacier-express` | Switzerland | 18.4 m, metre gauge | `first`, `second` | - |
| `proc-vehicle-ir-lhb-coach` | India | 24.0 m, knuckle couplers | `ac3`, `chairCar` | `rajdhani`, `shatabdi`, `humsafar`, `tejas` |
| `proc-vehicle-ir-icf-coach` | India | 22.3 m | `sleeper`, `general` | `blue`, `maroon` |
| `proc-vehicle-cr-25t-coach` | China | 26.6 m, knuckle couplers | `softSleeper`, `hardSeat` | `z25t`, `green25b` |
| `proc-vehicle-br-mk1-coach` | the United Kingdom | 19.66 m, W6a gauge | `tso`, `bsk` | `crimsonCream`, `maroon`, `southernGreen` |
