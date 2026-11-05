# World trucks

**Covers** - the 100 trucks and lorries from around the world on the world truck kit: the kit's `TruckSpec` (cab library, chassis and axle layouts, bodies, trailers), the chain of trailers in the rig and its clearances, the steered axles, the low detail, the parameters, game properties, OpenTTD figures and sounds, references, deviations and tests.
**Code** - `generator/truckKit.ts`, `generator/truckBodies.ts`, `generator/worldTruckPresets.ts`, `generator/worldTrucks.ts`, `generator/rig.ts`, `generator/vehicleParts.ts` (`steeredWheels`, `plate`, `arc`), `generator/lodKit.ts` (`fitLod`), `generator/openttdTable.ts`, `generator/soundTable.ts`, `generator/worldFleet.ts` (`truckFeatures`), `test/worldTrucks.test.ts`, `test/rig.test.ts`, `test/worldFleet.test.ts`
**See also** - [trucks.md](trucks.md) (the reproduced trucks and their cab shell, which the kit's shell follows), [vehicles.md](vehicles.md) (the American truck), [vehicle-rig.md](vehicle-rig.md), [world-fleet.md](world-fleet.md) (references, data checks, the sweep sample), [lod.md](lod.md), [openttd-figures.md](openttd-figures.md), [sounds.md](sounds.md), [../specs/2026-11-05-world-vehicle-fleet-list.md](../specs/2026-11-05-world-vehicle-fleet-list.md)

## The designs

All at their real size, in the `truck` group (`TRUCK_CATALOG`, category `Road vehicles`),
modelled on the photographs in `assets/<references>/` (the folder named like the id without
`veh-`), whose `SOURCES.md` gives the published figures and marks the estimates. **The ids
are stored in saved maps: never rename one.** The kit column is the cab kind (and hood
style), the axle layout of the truck or tractor (wheels x driven wheels, each axle counted
as two wheels) and the trailers; sizes are over everything at the defaults (length x width
over the mirrors x height); OpenTTD is the introduction year, the payload (tonnes, a tank's
kilolitres) and the cargo at the defaults; triangles at the defaults.

| id | title | kit | params (default first) | size (m) | OpenTTD | triangles |
|---|---|---|---|---|---|---|
| `veh-scania-r` | Scania R 500 | cabover, 4x2, semi | body: curtain, box, tank | 16.55 x 3.21 x 4.00 | 2004 / 25 GOOD | 3,054 |
| `veh-scania-s-v8` | Scania S 730 V8 | cabover, 6x2, semi | body: curtain, reefer | 16.70 x 3.21 x 4.14 | 2016 / 25 GOOD | 3,314 |
| `veh-scania-lb141` | Scania LB 141 | cabover, 4x2, semi | body: box, tank | 14.70 x 2.84 x 4.00 | 1976 / 22 GOOD | 2,730 |
| `veh-volvo-fh16` | Volvo FH16 | cabover, 6x4, semi | body: lowLoader, curtain | 16.70 x 3.21 x 4.12 | 1993 / 45 STEL | 3,060 |
| `veh-volvo-f88` | Volvo F88 | cabover, 4x2, semi | body: box, tank | 13.60 x 2.84 x 4.00 | 1965 / 18 GOOD | 2,730 |
| `veh-volvo-fmx-tipper` | Volvo FMX Tipper | cabover, 8x4 | - | 9.30 x 3.21 x 3.29 | 2010 / 18 COAL | 2,746 |
| `veh-mb-actros` | Mercedes-Benz Actros | cabover, 4x2, semi | body: curtain, box | 16.60 x 3.17 x 4.00 | 2018 / 25 GOOD | 2,994 |
| `veh-mb-arocs` | Mercedes-Benz Arocs Tipper | cabover, 6x4 | - | 7.90 x 3.21 x 3.24 | 2013 / 15 COAL | 2,302 |
| `veh-mb-unimog` | Mercedes-Benz Unimog U 5023 | cabover, 4x4 | body: flatbed, plough | 5.55 x 3.02 x 3.09 | 2013 / 5 STEL | 1,608 |
| `veh-mb-kurzhauber` | Mercedes-Benz L 911 | bonnet/round, 4x2 | body: dropside, tipper | 7.20 x 2.74 x 2.54 | 1959 / 5 GOOD | 1,850 |
| `veh-mb-ng` | Mercedes-Benz NG 1632 | cabover, 4x2, semi | body: box, tank | 15.30 x 2.84 x 4.00 | 1973 / 22 GOOD | 2,790 |
| `veh-man-f8` | MAN F8 | cabover, 4x2, drawbar | body: box, dropside | 18.55 x 2.84 x 3.70 | 1967 / 22 GOOD | 2,960 |
| `veh-man-tgl` | MAN TGL Box Truck | cabover, 4x2 | body: box, curtain | 7.70 x 2.96 x 3.55 | 2005 / 5 GOOD | 1,758 |
| `veh-daf-xf` | DAF XF | cabover, 4x2, semi | body: container, curtain | 15.50 x 3.21 x 3.99 | 2017 / 25 GOOD | 3,306 |
| `veh-daf-2600` | DAF 2600 | cabover, 4x2, semi | body: box, tank | 13.19 x 2.84 x 4.00 | 1962 / 15 GOOD | 2,730 |
| `veh-daf-cf-refuse` | DAF CF Refuse Truck | cabover, 6x2 | livery: white, green | 9.10 x 3.21 x 3.52 | 2001 / 10 GOOD | 1,946 |
| `veh-iveco-s-way` | Iveco S-Way | cabover, 4x2, semi | body: curtain, tank | 16.60 x 3.21 x 4.00 | 2019 / 25 GOOD | 3,018 |
| `veh-iveco-turbostar` | Iveco TurboStar | cabover, 6x2, semi | body: box, curtain | 16.50 x 3.12 x 4.00 | 1984 / 24 GOOD | 3,126 |
| `veh-iveco-daily` | Iveco Daily | van, 4x2 | body: van, dropside | 5.68 x 2.36 x 2.70 | 1978 / 1 GOOD | 1,614 |
| `veh-fiat-682` | Fiat 682 | bonnet/round, 4x2 | body: dropside, tank | 9.00 x 2.84 x 2.64 | 1952 / 9 GOOD | 1,874 |
| `veh-renault-t` | Renault Trucks T | cabover, 4x2, semi | body: curtain, box | 16.60 x 3.21 x 4.00 | 2013 / 25 GOOD | 3,018 |
| `veh-renault-magnum` | Renault Magnum | cabover, 4x2, semi | body: curtain, reefer | 16.60 x 3.21 x 4.04 | 1990 / 24 GOOD | 3,030 |
| `veh-berliet-t100` | Berliet T100 | hood/square, 6x6 | - | 13.40 x 5.04 x 5.10 | 1957 / 50 COAL | 2,396 |
| `veh-citroen-h-van` | Citroen H Van | van, 4x2 | colour: grey, red, blue | 4.20 x 2.35 x 2.35 | 1947 / 1 GOOD | 2,082 |
| `veh-pegaso-comet` | Pegaso Comet | cabover, 4x2 | body: dropside, box | 7.30 x 2.84 x 2.79 | 1964 / 8 GOOD | 1,698 |
| `veh-tatra-148` | Tatra 148 | hood/round, 6x6 | body: tipper, dropside | 8.30 x 2.94 x 2.89 | 1969 / 14 COAL | 2,540 |
| `veh-tatra-815` | Tatra 815 | cabover, 8x8 | body: tipper, crane | 9.60 x 3.22 x 3.24 | 1983 / 20 COAL | 2,794 |
| `veh-tatra-phoenix` | Tatra Phoenix | cabover, 6x6 | body: tipper, mixer | 8.20 x 3.22 x 3.34 | 2011 / 18 COAL | 2,316 |
| `veh-avia-a31` | Avia A31 | cabover, 4x2 | body: dropside, box | 5.90 x 2.54 x 2.34 | 1968 / 3 GOOD | 1,722 |
| `veh-liaz-100` | Liaz 100 | cabover, 4x2, semi | body: box, tank | 14.70 x 3.12 x 4.00 | 1974 / 22 GOOD | 2,706 |
| `veh-praga-v3s` | Praga V3S | bonnet/square, 6x6 | body: canvas, dropside | 6.90 x 2.74 x 2.90 | 1953 / 5 GOOD | 2,382 |
| `veh-skoda-706-rt` | Skoda 706 RT | cabover, 4x2, drawbar | body: dropside, box | 18.05 x 2.89 x 2.89 | 1957 / 15 GOOD | 2,900 |
| `veh-star-266` | Star 266 | cabover, 6x6 | body: canvas, dropside | 7.00 x 2.94 x 3.00 | 1973 / 4 GOOD | 2,302 |
| `veh-csepel-d450` | Csepel D-450 | bonnet/round, 4x2 | body: dropside, tipper | 6.70 x 2.79 x 2.44 | 1960 / 5 GOOD | 1,826 |
| `veh-kamaz-5320` | KamAZ-5320 | cabover, 6x4 | body: canvas, dropside | 7.45 x 3.22 x 3.40 | 1976 / 8 GOOD | 2,304 |
| `veh-kamaz-54901` | KamAZ-54901 | cabover, 4x2, semi | body: curtain, tank | 16.60 x 3.21 x 4.00 | 2019 / 25 GOOD | 3,018 |
| `veh-zil-130` | ZIL-130 | hood/round, 4x2 | body: dropside, tanker | 6.67 x 2.94 x 2.44 | 1964 / 6 GOOD | 1,826 |
| `veh-gaz-51` | GAZ-51 | bonnet/round, 4x2 | - | 5.72 x 2.64 x 2.17 | 1946 / 3 GOOD | 1,778 |
| `veh-gaz-66` | GAZ-66 | cabover, 4x4 | body: canvas, dropside | 5.65 x 2.76 x 2.54 | 1964 / 2 GOOD | 1,764 |
| `veh-maz-500` | MAZ-500 | cabover, 4x2 | body: dropside, tipper | 7.14 x 2.94 x 2.69 | 1965 / 8 GOOD | 1,698 |
| `veh-belaz-75710` | BelAZ 75710 | mining, 8x8 | - | 20.60 x 10.12 x 8.30 | 2013 / 450 COAL | 2,644 |
| `veh-kraz-255` | KrAZ-255 | hood/square, 6x6 | body: dropside, canvas | 8.65 x 3.19 x 2.98 | 1967 / 7 GOOD | 2,146 |
| `veh-ural-4320` | Ural-4320 | hood/round, 6x6 | body: canvas, dropside | 7.37 x 2.94 x 3.00 | 1977 / 6 GOOD | 2,238 |
| `veh-bedford-tk` | Bedford TK | cabover, 4x2 | body: dropside, box | 7.00 x 2.74 x 2.49 | 1960 / 5 GOOD | 1,698 |
| `veh-aec-mammoth-major` | AEC Mammoth Major | bonnet/square, 8x4 | body: dropside, tanker | 9.10 x 2.79 x 2.64 | 1948 / 15 GOOD | 2,568 |
| `veh-scammell-contractor` | Scammell Contractor | hood/square, 6x4, semi | - | 18.80 x 3.32 x 3.77 | 1964 / 100 STEL | 4,052 |
| `veh-ford-transit-mk1` | Ford Transit Mk1 | van, 4x2 | colour: white, red, blue | 4.40 x 2.33 x 2.00 | 1965 / 1 GOOD | 1,506 |
| `veh-dennis-fire-engine` | Dennis Sabre Fire Engine | cabover, 4x2 | - | 8.40 x 3.17 x 3.15 | 1995 / 0 GOOD | 2,094 |
| `veh-magirus-ladder` | Magirus Turntable Ladder | cabover, 6x2 | - | 10.00 x 3.22 x 3.60 | 2010 / 0 GOOD | 2,200 |
| `veh-rosenbauer-panther` | Rosenbauer Panther | cabover, 6x6 | - | 12.00 x 3.72 x 3.97 | 2005 / 0 GOOD | 2,386 |
| `veh-liebherr-ltm` | Liebherr LTM 1100 Mobile Crane | cabover, 10x4 | - | 13.80 x 3.34 x 4.00 | 2010 / 0 GOOD | 2,788 |
| `veh-lohr-car-transporter` | Car Transporter | cabover, 4x2, semi | load: cars, empty | 16.20 x 3.21 x 4.09 | 2010 / 12 GOOD | 3,382 |
| `veh-peterbilt-379` | Peterbilt 379 | hood/square, 6x4, semi | body: dryVan, flatbed | 22.58 x 3.16 x 4.10 | 1987 / 20 GOOD | 3,708 |
| `veh-peterbilt-579` | Peterbilt 579 | hood/aero, 6x4, semi | body: dryVan, reefer | 22.48 x 3.16 x 4.10 | 2012 / 20 GOOD | 3,444 |
| `veh-kenworth-w900` | Kenworth W900 | hood/square, 6x4, semi | body: dryVan, tank | 23.08 x 3.16 x 4.10 | 1961 / 20 GOOD | 3,708 |
| `veh-kenworth-t680` | Kenworth T680 | hood/aero, 6x4, semi | body: dryVan, flatbed | 22.33 x 3.16 x 4.10 | 2013 / 20 GOOD | 3,432 |
| `veh-kenworth-k100` | Kenworth K100 | cabover, 6x4, semi | body: dryVan, tank | 17.91 x 3.16 x 4.10 | 1960 / 20 GOOD | 3,284 |
| `veh-kenworth-c500-log` | Kenworth C500 Log Truck | hood/square, 6x4, drawbar | - | 22.55 x 3.27 x 3.60 | 1970 / 30 WOOD | 5,072 |
| `veh-kenworth-t909-road-train` | Kenworth T909 Road Train | hood/square, 6x4, semi, drawbar+dolly | load: 2, 3 | 33.51 x 3.22 x 3.80 | 2009 / 75 COAL | 5,594 |
| `veh-freightliner-cascadia` | Freightliner Cascadia | hood/sloped, 6x4, semi | body: dryVan, reefer | 22.38 x 3.16 x 4.10 | 2007 / 20 GOOD | 3,432 |
| `veh-mack-b61` | Mack B-61 | bonnet/round, 6x4, semi | body: box, tank | 15.37 x 2.84 x 3.80 | 1953 / 15 GOOD | 3,448 |
| `veh-mack-anthem` | Mack Anthem | hood/aero, 6x4, semi | body: dryVan, tank | 22.23 x 3.16 x 4.10 | 2018 / 20 GOOD | 3,444 |
| `veh-mack-granite-dump` | Mack Granite Dump Truck | hood/square, 6x4 | - | 8.50 x 3.16 x 3.14 | 2002 / 14 COAL | 2,594 |
| `veh-international-transtar` | International Transtar Cabover | cabover, 6x4, semi | body: dryVan, tank | 16.86 x 3.16 x 4.10 | 1968 / 20 GOOD | 3,172 |
| `veh-international-acco` | International ACCO | cabover, 6x4 | body: dropside, tipper | 7.60 x 2.89 x 2.89 | 1965 / 10 GOOD | 2,164 |
| `veh-western-star-4900` | Western Star 4900 | hood/square, 6x4, semi | body: dryVan, flatbed | 22.93 x 3.16 x 4.10 | 1990 / 20 GOOD | 3,720 |
| `veh-volvo-vnl` | Volvo VNL 860 | hood/aero, 6x4, semi | body: dryVan, reefer | 22.73 x 3.16 x 4.10 | 2018 / 20 GOOD | 3,444 |
| `veh-tesla-semi` | Tesla Semi | cabover, 6x4, semi | body: dryVan, reefer | 20.61 x 3.18 x 4.10 | 2022 / 19 GOOD | 3,052 |
| `veh-ford-model-tt` | Ford Model TT | bonnet/square, 4x2 | body: stake, box | 4.70 x 2.09 x 2.29 | 1917 / 1 GOOD | 1,874 |
| `veh-white-3000` | White 3000 | cabover, 4x2, semi | body: box, tank | 12.36 x 2.74 x 3.60 | 1949 / 13 GOOD | 2,718 |
| `veh-autocar-acx-refuse` | Autocar ACX Refuse Truck | cabover, 6x4 | - | 9.60 x 3.17 x 3.77 | 2005 / 12 GOOD | 2,052 |
| `veh-pierce-arrow-xt` | Pierce Arrow XT Fire Engine | cabover, 4x2 | - | 10.20 x 3.22 x 3.20 | 2010 / 0 GOOD | 2,226 |
| `veh-american-lafrance` | American LaFrance 700 | cabover, 4x2 | - | 9.40 x 2.79 x 2.55 | 1947 / 0 GOOD | 2,058 |
| `veh-cat-797` | Caterpillar 797F | mining, 4x2 | - | 15.08 x 10.14 x 8.24 | 2009 / 363 COAL | 1,834 |
| `veh-mb-l1113` | Mercedes-Benz L 1113 | hood/round, 4x2 | body: dropside, tanker | 7.70 x 2.84 x 2.59 | 1969 / 7 GOOD | 1,898 |
| `veh-vw-constellation` | Volkswagen Constellation | cabover, 6x4 | body: dropside, tipper | 8.70 x 3.17 x 3.04 | 2005 / 15 GOOD | 2,140 |
| `veh-scania-111` | Scania 111 | hood/square, 6x4, semi | body: box, tank | 16.96 x 3.22 x 4.00 | 1976 / 22 GOOD | 3,816 |
| `veh-ford-cargo` | Ford Cargo | cabover, 4x2 | body: box, dropside | 8.20 x 3.07 x 3.60 | 1981 / 9 GOOD | 1,734 |
| `veh-hino-300` | Hino 300 | cabover, 4x2 | body: box, dropside | 6.20 x 2.29 x 3.05 | 1999 / 3 GOOD | 1,698 |
| `veh-hino-profia` | Hino Profia | cabover, 8x4 | body: wing, tipper | 11.90 x 3.21 x 3.75 | 1992 / 13 GOOD | 2,692 |
| `veh-isuzu-elf` | Isuzu Elf | cabover, 4x2 | body: dropside, box | 6.00 x 2.30 x 2.24 | 1959 / 3 GOOD | 1,674 |
| `veh-isuzu-giga` | Isuzu Giga | cabover, 8x4 | body: wing, tipper | 11.80 x 3.21 x 3.75 | 1994 / 13 GOOD | 2,692 |
| `veh-fuso-canter` | Mitsubishi Fuso Canter | cabover, 4x2 | body: box, dropside | 5.40 x 2.14 x 2.85 | 1963 / 3 GOOD | 1,734 |
| `veh-fuso-super-great` | Mitsubishi Fuso Super Great | cabover, 6x4, semi | body: box, tank | 15.30 x 3.21 x 4.00 | 1996 / 22 GOOD | 2,908 |
| `veh-ud-quon` | UD Quon | cabover, 8x4 | body: box, mixer | 11.60 x 3.21 x 3.75 | 2004 / 13 GOOD | 2,692 |
| `veh-kei-truck` | Kei Truck | cabover, 4x2 | colour: white, silver, red, green | 3.38 x 1.91 x 1.82 | 1961 / 1 GOOD | 1,446 |
| `veh-dekotora` | Dekotora | cabover, 8x4 | colour: gold, blue, pink | 11.60 x 3.21 x 3.75 | 1975 / 13 GOOD | 4,024 |
| `veh-hyundai-xcient` | Hyundai Xcient | cabover, 6x2, semi | variant: diesel, fuelCell | 16.60 x 3.21 x 4.00 | 2013 / 25 GOOD | 3,318 |
| `veh-tata-lpt` | Tata LPT 1613 | hood/round, 4x2 | colour: orange, blue, green | 8.00 x 2.84 x 3.00 | 1980 / 10 GOOD | 2,522 |
| `veh-ashok-leyland-captain` | Ashok Leyland Captain | cabover, 6x4 | body: tipper, dropside | 8.40 x 3.17 x 2.99 | 2010 / 18 COAL | 2,306 |
| `veh-pakistani-truck-art` | Pakistani Truck Art | bonnet/square, 4x2 | colour: red, green, blue | 8.00 x 2.79 x 3.60 | 1970 / 10 GOOD | 2,594 |
| `veh-faw-jiefang-ca10` | FAW Jiefang CA10 | bonnet/round, 4x2 | body: dropside, canvas | 6.60 x 2.74 x 2.22 | 1956 / 4 GOOD | 1,826 |
| `veh-faw-j7` | FAW Jiefang J7 | cabover, 6x4, semi | body: curtain, tank | 16.70 x 3.21 x 4.00 | 2018 / 30 GOOD | 3,460 |
| `veh-dongfeng-eq140` | Dongfeng EQ140 | hood/round, 4x2 | body: dropside, canvas | 6.90 x 2.84 x 2.34 | 1978 / 5 GOOD | 1,850 |
| `veh-sinotruk-howo` | Sinotruk HOWO A7 | cabover, 6x4, semi | body: curtain, tank | 16.70 x 3.21 x 4.00 | 2007 / 30 GOOD | 3,472 |
| `veh-shacman-x3000` | Shacman X3000 | cabover, 8x4 | body: tipper, mixer | 9.60 x 3.21 x 3.44 | 2012 / 20 COAL | 2,762 |
| `veh-mb-zetros` | Mercedes-Benz Zetros | hood/square, 6x6 | body: canvas, dropside | 7.60 x 3.22 x 3.40 | 2008 / 8 GOOD | 2,214 |
| `veh-bell-b60e` | Bell B60E | hood/sloped, 2x0, drawbar | - | 13.30 x 3.64 x 4.10 | 2017 / 55 COAL | 2,256 |
| `veh-man-cla` | MAN CLA | cabover, 6x4 | body: tipper, dropside | 8.60 x 3.17 x 3.09 | 2006 / 18 COAL | 2,282 |
| `veh-mb-econic` | Mercedes-Benz Econic | cabover, 6x2 | body: refuse, sweeper | 9.00 x 3.22 x 3.52 | 1998 / 10 GOOD | 1,958 |

No list row was replaced; the titles and years are the list's. Two hold an approximation
the list does not state: `veh-lohr-car-transporter` is a generic Lohr-style car carrier
semi-trailer behind a European day-cab tractor, and `veh-magirus-ladder` is a Magirus
M32-class ladder on a generic crew cab.

## The kit

A truck is a `TruckSpec` (`truckKit.ts`): its `livery` (colours by role: cab, cab2, body,
canvas, chassis, rim, bumper, art, load), its `cab`, its `chassis`, the `body` on the
truck and its `trailers`. Lengths are `u`, metres back from the unit's front (the truck's
nose, a trailer's front wall); the assembly (`truckBodies.ts` `layoutTruck`) places the units
and centres the whole on x = 0. The presets (`worldTruckPresets.ts`) give the trades' shapes:
`euCab` (day, sleeper, high roof), `oldCab`, `usCabover`, `narrowCab`, `usHood` (square or
aero), `oldBonnet`, `squareBonnet`; `euSemi`, `usSemi`, `drawbar`; `tractor`, `rigid`,
`behindCab`.

### Cabs

- **cabover**: a shell lofted between levels of a rounded plan (the shell of
  [trucks.md](trucks.md)): an upright lower front, the raked windscreen, a roof edge rounded
  in, a high roof's visor band; the windscreen (whole or split), side windows and door
  seams, grille (bars, slots, mesh, chrome), lamps (round, rectangular, slim), bumper with
  indicators and plate, steps and mudguards behind the front wheel, mirrors (arm, camera,
  West Coast post, small), roof deflector, beacons or a light bar, clearance lamps, a colour
  band and a stripe; a crew cab's second doors; an open cab (body to the belt, the
  windscreen on its posts). A **low cab** (Econic, Autocar ACX, Tesla Semi, Rosenbauer
  Panther) whose bottom is below the front wheels' sweep is cut round the arch: the shell
  starts above the arch, the lower band ahead of and behind it. A cab may sit off the centre
  line (`offset`: the crane carrier's, the mining trucks').
- **hood** and **bonnet**: a hood whose core between the front wheels stays narrower than
  the steered tyres' sweep and widens over them (square, round, aero, sloped), the grille
  and lamps on it, fenders arched over the wheels, the bumper; the cab box behind, a US
  sleeper (raised and faired in when taller), chrome stacks and air cleaners. A `bonnet`
  (historic) has round fenders with the lamps on them and running boards.
- **van**: bonnet, windscreen and box in one shell, cut round both axles' arches (Iveco
  Daily, Ford Transit, the corrugated Citroen H).
- **mining**: the deck across the front over the radiator, its handrails and the diagonal
  stair, the cab on the deck's left, the bumper; the dump body's canopy reaches over it.

### Chassis

Frame rails (inside the steered tyres' sweep), the engine block, axles with differentials,
single or dual tyres (16-gons with a flat side on the road; `lite` 12-gons for a road
train's trailers; spoked for the Model TT), mudguards below whatever rides over them, box or
round fuel tanks and side guards fitted into the gaps between the wheels' sweeps, the fifth
wheel, a hitch. Any number of axles may steer (8x4 tippers, the AEC Mammoth Major, the
BelAZ, the crane carrier): each steered axle is a pair of parts in the truck's node
(`wheel-front-left`, `wheel-front-2-left`, ...), its wheelbase to the mean of the fixed
axles, so the rig's Ackermann angles turn the second axle less.

### Bodies

`box`, `curtain`, `reefer` (unit on the front wall), `container`, `tank` (round or
elliptical, bands, walkway, manholes, saddles), `tipper` (bin, headboard, ribs, ram, a gravel
load), `dump` (a mining body with its canopy), `flatbed`, `dropside`, `canvas` (dropside and
tilt), `logs`, `mixer` (the tilted drum, its stripe, water tank, hopper and chute), `refuse`
(rounded body, rear loader), `crane` (loader crane behind the cab), `boom` (a mobile
crane's superstructure; the boom is a part), `carCarrier` (two decks, cars as `load`),
`fire` (roller-shutter lockers, roof ladder or monitor), `ladder` (turntable; the ladder set
is a part), `sweeper`, `plough` (front blade), `lowLoader` (gooseneck, well deck, an
excavator as `load`), `artBox` (painted panels and lamps), `van`/`none`.

### Trailers: a chain of sections

The rig ([vehicle-rig.md](vehicle-rig.md)) holds any number of sections hinged in a chain, so
a truck is the part `truck` and one part per trailer: `trailer`, `trailer2`, `trailer3`, each
pivoted at its hinge with the unit ahead, no joints (no bellows):

- a **semi-trailer** hinges at the king pin on the tractor's fifth wheel. `tractor()` places
  the fifth wheel so the trailer's front swings clear of the cab's back (`swingRadius` plus
  12 cm) and the drive axles just behind it; the trailer's underframe starts 1 cm above the
  fifth wheel; what of it hangs lower (landing gear, a low loader's well deck, a car
  carrier's lower deck) stands outside the circle the tractor's rear wheels sweep;
- a **drawbar trailer** (MAN F8, Skoda 706 RT) hinges at the hitch behind the unit ahead. Its
  drawbar and front axle are rigid with it: the real turntable is a second hinge the chain
  leaves out;
- a **road train** (Kenworth T909, `load`: 2 or 3 trailers) is a semi-trailer with a rear
  hitch and one or two converter dollies, each dolly rigid with the semi-trailer it carries,
  hinged at the hitch ahead (the dolly's fifth wheel is the hinge left out);
- the **log truck** (Kenworth C500) hinges at the truck's swivel bunk: the logs, the pole
  and the trailer's bunk and axles turn about it, as a real pole trailer is pulled through
  its load;
- the **articulated dump truck** (Bell B60E) is two units: the front unit and the dump unit
  hinged behind the cab. The real truck steers by its hinge alone; every road vehicle here
  has steered front wheels (the rig and its test require them), so the front axle has a
  nominal 12-degree lock.

The largest bend is the rig's `maxBendDeg` (70 degrees by default; the road train 45, the log
truck 40, drawbar trailers 55). The game's truck import names its nodes `truck` and
`trailer`; a road train's `trailer2` and `trailer3` need the game to follow the chain (it
moves an articulated bus's sections the same way).

### The low detail

`buildTruckLod` draws the masses the full model keeps (`Kit.keep`/`mass`: the shells' bounds,
the bodies, bumpers, tanks, fenders), each a box in its colour in its section, the
windscreens and side windows in the LOD glass on their shells' boxes, the wheels as hexagonal
discs, within 100 triangles a section (at most 300; `fitLod` drops the ranked details
first). The sections are the full rig's.

## Parameters, game properties, OpenTTD and sounds

- `body` picks the trailer's or the rigid's body (2 to 3 values); `colour` and `livery` only
  recolour (`finishParams`); `load` is the road train's trailers or the car carrier's cars;
  `variant` the Xcient's diesel tractor or fuel cell rigid.
- `game`: weight in tonnes (gross, a combination's), power in kW, top speed in km/h, from
  the makers' figures; variants where a body changes the weight.
- OpenTTD (`openttdTable.ts`): the introduction year, the payload; cargo and refits follow
  the body - a tank `OIL_`/liquid, a tipper or dump `COAL`/bulk, a log truck `WOOD`, a flatbed
  or low loader `STEL`, a box or curtain `GOOD`/piece, covered, express, a reefer with the
  refrigerated class; fire engines, the ladder, the crane and the sweeper carry nothing
  (capacity 0). Presets: the default and every other body, colour or load.
- Sounds: the derived truck diesel; the Tesla Semi and the fuel cell Xcient run on the
  inverter motor (`soundTable.ts`).

## Real sizes

The mining trucks are at their real size: the BelAZ 75710 20.6 x 10.1 x 8.3 m (over its body's ribs), the
Caterpillar 797F 15.1 x 10.1 x 8.2 m, the Berliet T100 13.6 m long; the road train with three trailers is
47 m long. No shared test holds them to the road envelope: `test/models.test.ts` checks the
2.7 m width and 4.115 m height of the `VEHICLES` list only, and the fleet's own checks hold
each truck to its spec instead (`test/worldTrucks.test.ts`). The game needs a size class for
them (the spec's open risk).

## Deviations

- Cab shapes are generic per kind: a design is its sizes, axles, colours and kit options, not a
  surface traced from photographs; makers' badges, lettering and liveries' logos are left out.
- Doors open nowhere; cabs have no interiors.
- Drawbar trailers and road train dollies have one hinge each, not two (above).
- The mobile crane's boom and the turntable ladder are parts (`boom`, `ladder`) the game may
  turn, with no clip; the tipper bins do not tip.
- The Bell B60E's nominal front-wheel lock (above).
- The Pakistani and Indian trucks' painting is panels in three colours, not the real art.

## Checks

- `test/worldTrucks.test.ts`: all 100 in the catalog with their OpenTTD entries; cargo by
  body; the electric motors; real sizes (BelAZ, kei truck, road train); colours change only
  colours; for every design's sampled parameters the budget (10,000), standing on y = 0, its
  length, the rig's steered axles and chain, the LOD within its budget, as long, glazed and on
  the road, the head lamps; and for **every** truck (not only the sample) the steered tyres
  at full lock and each hinge at its largest bend and half of it, triangle against triangle.
- `test/rig.test.ts` swings every hinge of the sampled trucks' chains (the "semi-trucks" check,
  generalised from one trailer to a chain).
- `test/worldFleet.test.ts`: references, licences, published figures, the covering sample.
- The catalog sweep (`pnpm exec vitest run catalog -t "<id>"`) for the sampled trucks; `pnpm
  build` builds all 100 with their budgets and the z-fighting guard.
