# Freight wagons in a few measures

**Covers** - the freight wagon generator of the eight-country plan: an open wagon with its load and a covered wagon, on three-piece trucks with knuckle couplers, and the designs drawn with it.
**Code** - `generator/worldWagons.ts` (`WorldWagon`, `buildWagon`, `buildWagonLod`, `WORLD_WAGONS`), `generator/usHoodKit.ts` (`paintedSweep`, `knuckleCoupler`)
**See also** - [us-freight.md](us-freight.md), [india-trains.md](india-trains.md), [china-trains.md](china-trains.md)

A `WorldWagon` is its length over the couplers, the body's half length and half width,
the floor and the sides' top (or the eaves and the roof's rise), the trucks' centres
and wheels, the paint and the lettering. A design pairs an open and a covered wagon as
its `unit`. The trucks have a 2.1 m wheelbase: the shared bogie geometry draws its brake
cylinders clear of the transoms from 2.05 m.

| id | country | open | covered |
|---|---|---|---|
| `proc-vehicle-ir-boxn-wagon` | India | BOXN, 10.71 m | BCNA, 15.43 m |
| `proc-vehicle-cr-c70-wagon` | China | C70, 13.98 m | P70, 17.0 m |
