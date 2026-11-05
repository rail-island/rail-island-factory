# Coaches in a few measures

**Covers** - the coach generator on the passenger car builder: the measures a coach design states, its types of car and liveries, and the designs drawn with it.
**Code** - `generator/worldCoaches.ts` (`WorldCoach`, `buildCoach`, `buildCoachLod`, `coachDesign`, `WORLD_COACHES`), `generator/usTransit.ts` (`drawCar`, `carLod`, the `buffers` coupler)
**See also** - [us-transit.md](us-transit.md) (the car builder), [germany-trains.md](germany-trains.md)

A `WorldCoach` states a locomotive-hauled coach: its length over the buffers (or
couplers), the body's half width, belly, eaves and crown, the skirt, the window rows,
the doors at each end, the bogies and the coupler (`buffers`: a beam, two buffers and a
screw coupling 0.65 m beyond the body; `knuckle`; `centre`). Each type of car (`unit`)
has its own window count and width, number and weight; each livery its paints and side
bands. The car builder draws the shell, windows, opening plug doors onto the cabin,
the gangway diaphragms, the bogies and the couplers; the LOD is its `carLod`.

## The designs

| id | country | length | units | liveries |
|---|---|---|---|---|
| `proc-vehicle-db-ic-coach` | Germany | 26.4 m | `avmz` (first class), `bpmz` (second class) | `tee`, `oceanBlue`, `intercity` |
| `proc-vehicle-sncf-corail-coach` | France | 26.4 m | `a10tu`, `b11tu` | `corail`, `teoz` |
| `proc-vehicle-sncf-grand-confort` | France | 24.5 m | `a8u` (compartments), `a7d` (bar car) | `capitole`, `tee` |
| `proc-vehicle-ciwl-car` | France | 23.45 m | `pullman`, `sleeping` | `pullman`, `ciwlBlue` |
| `proc-vehicle-ns-icr-coach` | the Netherlands | 26.4 m | `a`, `b` | `yellowGrey`, `yellowBlue` |
| `proc-vehicle-sbb-ew4-coach` | Switzerland | 26.4 m | `a`, `b` | `redGrey`, `sbb` |
| `proc-vehicle-sbb-ic2000` | Switzerland | 26.8 m, double-deck | `a`, `b` | - |
| `proc-vehicle-glacier-express` | Switzerland | 18.4 m, metre gauge | `first`, `second` | - |
| `proc-vehicle-ir-lhb-coach` | India | 24.0 m, knuckle couplers | `ac3`, `chairCar` | `rajdhani`, `shatabdi`, `humsafar`, `tejas` |
| `proc-vehicle-ir-icf-coach` | India | 22.3 m | `sleeper`, `general` | `blue`, `maroon` |
| `proc-vehicle-cr-25t-coach` | China | 26.6 m, knuckle couplers | `softSleeper`, `hardSeat` | `z25t`, `green25b` |
| `proc-vehicle-br-mk1-coach` | the United Kingdom | 19.66 m, W6a gauge | `tso`, `bsk` | `crimsonCream`, `maroon`, `southernGreen` |
