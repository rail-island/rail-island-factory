# Vehicles

**Covers** - the procedurally generated road and rail vehicles (an articulated American
truck, the trucks reproduced from the game, and the vlakosimdb transfers: buses, electric, diesel and steam
locomotives, electric and diesel units, high-speed trains, coaches, freight wagons, trams and the metro car), their triangle budget and conventions, articulated vehicles'
parts, steered front wheels and animated running gear, the `sweep` primitive they are mostly built from, and
how to add one.
**Code** - `generator/vehicles.ts`, `generator/cd150.ts`, `generator/cd150Comparison.ts`, `generator/cd150Report.ts`, `test/cd150.test.ts`, `generator/cd163.ts`, `generator/cd163Family.ts`, `generator/cd230.ts`, `generator/cdLogo.ts`, `generator/vehicleParts.ts`, `generator/design.ts`, `generator/meshCore.ts` (`sweep`, `part`), `generator/meshBuilder.ts` (`toGlb`), `src/viewerHighlight.ts`, `test/models.test.ts`, `test/cdLogo.test.ts`, `test/viewerHighlight.test.ts`, `.agents/skills/road-vehicle/SKILL.md`, `.agents/skills/railroad-vehicle/SKILL.md`, `.agents/skills/vlakosimdb-transfer/SKILL.md`
**See also** - [buses.md](buses.md) (the buses), [vehicle-rig.md](vehicle-rig.md) (steered wheels, sections, joints), [trucks.md](trucks.md), [loco-liveries.md](loco-liveries.md) (the locomotives' liveries and the CD 263), [cd-230.md](cd-230.md) (the laminatka), [cz-electrics.md](cz-electrics.md) (CD 110, 130, 140, 169), [csd-coaches.md](csd-coaches.md) (the CSD coaches), [wagons.md](wagons.md) (the freight wagons), [cd-green-white.md](cd-green-white.md), [bmo-double-deck.md](bmo-double-deck.md), [skyscrapers.md](skyscrapers.md) (the mesh builder, "Flicker"), [export.md](export.md), [source-tree.md](source-tree.md), [wagons.md](wagons.md) and [freight-wagons.md](freight-wagons.md) (the freight wagons), [trams.md](trams.md) (the trams and the metro), [mainline-electrics.md](mainline-electrics.md) (CD 180 / 181 / 182, DNT 184.5, DB 111, DR 243 / DB 143 / 112, OBB 1012, 1040), [small-diesels.md](small-diesels.md) (CD 704, 710, 714, 742, DB 212, MUV 69), [czsk-coaches.md](czsk-coaches.md) (the CD Y, ZSR and UIC-Z coaches), [german-coaches.md](german-coaches.md)

## The designs

| id | title | look |
|---|---|---|
| `veh-american-truck` | American Truck | articulated: a long-nose conventional tractor (chrome grille, sleeper, twin stacks, tandem drive axle) and a 53 ft dry van; steered front wheels; 22.2 m, about 4,900 triangles |
| `veh-karosa-short`, `veh-karosa-long`, ... | the buses | the vlakosimdb buses: two parametric Karosa families (rigid and articulated) and the single models; see [buses.md](buses.md) |
| `veh-cd-150` | CD 150 / 151 / ZSR 350 | parametric (`livery`: cd150, the default, and the CD 151, 151 CEZ and five ZSR 350 liveries, [loco-liveries.md](loco-liveries.md)): rigid cream/green electric locomotive 150 222-8 reconstructed from native vlakosimdb XML/BMPs: tapered sloping cabs, a green skirt lowered between the bogies, opposite grille/window sides, asymmetric cooler and two linked-arm pantographs (rear raised, front folded, knees toward the cab ends), bogies with spoked wheels, axle boxes on equalisers with paired primary coils, a side frame dropped between the axles over large secondary coils, traction motors, brake cylinders and sandboxes; 16.80 m over buffers, 6.24 m operating height, about 12,600 triangles. [Source notes](../../assets/cd-150/SOURCES.md), [measured comparison](../../assets/cd-150/COMPARISON.md) |
| `veh-cd-163` | CD 163 / 363 | parametric (`livery`: cd163, the default, and ten 162, 163, 362 and 363 liveries, [loco-liveries.md](loco-liveries.md)): rigid rail vehicle (`cd163.ts`, `cd163Family.ts`): the Czech Railways class 163 Bo'Bo' electric 163 244-7 in the green livery with the yellow band - ribbed sides, four portholes opposite continuous intake shutters, the raised cooler box and cant grilles, raked framed windscreens, an upright period CD monogram and condensed number plates, two single-arm pantographs on shedded insulators (rear raised, front folded, knees toward the cab ends), bogies with coil springs, axle boxes, motors and sandboxes; 16.80 m over the buffers, 5.74 m high with the rear collector raised, about 15,600 triangles. Modelled from photographs, the vlakosimdb elevation drawings and the official emblem (`assets/cd-163/`, see `SOURCES.md` there) |
| `veh-cd-110` | CD 110 / 111 / 210 | parametric (`livery`: cd110, the default, cd111, cd210, [cz-electrics.md](cz-electrics.md)): the Skoda centre-cab "zehlicka" shunter 110 046-0 from native vlakosimdb XML/BMPs: frame and deck, leaning hoods with louvres, full-width cabinets with the ramp beside the cab, the tall cab with wrap-round windows, one raised half pantograph (the 210 with its AC breaker), railings, small-wheeled bogies; 14.40 m over buffers, about 9,700 to 10,000 triangles. [Source notes](../../assets/cd-110/SOURCES.md), [measured comparison](../../assets/cd-110/COMPARISON.md) |
| `veh-cd-130` | CD 123 / 130 | parametric (`livery`: cd130, the default, cd123, cd123No019, [cz-electrics.md](cz-electrics.md)): the Skoda 57E / 79E box-cab 130 036-7: raked ends with rounded corners, roof headlight, six lamps, four machine-room windows, the louvred roof hump; single-arm pantographs on the 130, diamond ones and longer bogies on the 123 (rear raised, front folded); 17.21 m over buffers, about 11,100 to 11,300 triangles. [Source notes](../../assets/cd-130/SOURCES.md), [measured comparison](../../assets/cd-130/COMPARISON.md) |
| `veh-cd-140` | CD 140 bobina | the Skoda 12E 140 040 in blue and light blue: the bowed nose with the white whiskers, six portholes a side, the resistor box between two diamond pantographs (rear raised, front folded); 15.74 m over buffers, about 11,200 triangles ([cz-electrics.md](cz-electrics.md)). [Source notes](../../assets/cd-140/SOURCES.md), [measured comparison](../../assets/cd-140/COMPARISON.md) |
| `veh-cd-169` | CD 169 | the Skoda 85E prototype 169 001-5: the long raked windscreen over a dark buffer band with four lamps, ribbed sides with the white-blue-white stripe, roof-edge grilles, two single-arm pantographs (rear raised, front folded); 18.00 m over buffers, about 9,700 triangles ([cz-electrics.md](cz-electrics.md)). [Source notes](../../assets/cd-169/SOURCES.md), [measured comparison](../../assets/cd-169/COMPARISON.md) |
| `veh-cd-180` | CD 180 / 181 / 182 | parametric (`livery`: cd180, cd181, the default, cd181Okd, cd182, [mainline-electrics.md](mainline-electrics.md)): the Skoda Co'Co' "sestikolak" 181 105 on two three-axle bogies: rounded ends, six machine-room windows (the 180's louvre banks), cab doors, the roof headlight, two diamond pantographs (rear raised, front folded); 18.80 m over buffers, about 13,200 to 13,500 triangles. [Source notes](../../assets/cd-181/SOURCES.md), [measured comparison](../../assets/cd-181/COMPARISON.md) |
| `veh-dnt-184-5` | DNT 184.5 | parametric (`livery`: dnt1845, the default, dnt1845No1, dnt1845No2, [mainline-electrics.md](mainline-electrics.md)): the Skoda 93E Bo'Bo'Bo' coal-line locomotive 184 503: raked windscreens, ribbed sides, windows on one side and ten grille bays on the other, three roof covers, single-arm pantographs; 20.35 m over buffers, about 12,300 to 12,400 triangles. [Source notes](../../assets/dnt-184/SOURCES.md), [measured comparison](../../assets/dnt-184/COMPARISON.md) |
| `veh-db-111` | DB 111 | parametric (`livery`: db111, the default, db111Bb, db111S, [mainline-electrics.md](mainline-electrics.md)): the DB 111 024 in verkehrsrot (ozeanblau-beige, S-Bahn): pointed ends, sides leaning in above the waist, two grille banks and three windows, the roof cover, single-arm pantographs; 16.75 m over buffers, about 11,700 to 12,100 triangles. [Source notes](../../assets/db-111/SOURCES.md), [measured comparison](../../assets/db-111/COMPARISON.md) |
| `veh-dr-243` | DR 243 / DB 143 / 112 | parametric (`livery`: dr243, the default, db143, db143vr, db112, [mainline-electrics.md](mainline-electrics.md)): the LEW body of the DR 243 864: the ribbed machine room, roof-edge grilles, cab doors and windows; the 112 on 8.4 m pivots; 16.64 m over buffers, about 12,900 to 13,100 triangles. [Source notes](../../assets/dr-243/SOURCES.md), [measured comparison](../../assets/dr-243/COMPARISON.md) |
| `veh-obb-1012` | OBB 1012 | the 1996 prototype 1012.001: long raked nose, one wide windscreen, the upper sides leaning in, white with the red machine room and cab sweeps, single-arm pantographs; 19.30 m over buffers, about 11,900 triangles ([mainline-electrics.md](mainline-electrics.md)). [Source notes](../../assets/obb-1012/SOURCES.md), [measured comparison](../../assets/obb-1012/COMPARISON.md) |
| `veh-obb-1040` | OBB 1040 | the Floridsdorf 1040 013 in red with the yellow line: the V-shaped ends, louvre panels and two windows, cab doors, the grey frame, two diamond pantographs; 12.92 m over buffers, about 10,200 triangles ([mainline-electrics.md](mainline-electrics.md)). [Source notes](../../assets/obb-1040/SOURCES.md), [measured comparison](../../assets/obb-1040/COMPARISON.md) |
| `veh-cd-230` | CD 230 / 240 / 340 | parametric (`livery`: cd230, the default, cd240, cd240No047, cd340, cd242, [cd-230.md](cd-230.md)): the Skoda 47E "laminatka" 230 025-9 reconstructed from native vlakosimdb XML/BMPs and photographs: rounded glass-fibre noses with the wrap-round windscreen, headlight housing, vents, lip grilles and lamps laid on the curved skin, louvred machine-room band under six windows, portholed cab doors, diamond pantographs (rear raised, front folded), bogies with coils, motors and brake cylinders; 16.44 m over buffers, 5.87 m operating height, about 15,600 to 15,900 triangles. [Source notes](../../assets/cd-230/SOURCES.md), [measured comparison](../../assets/cd-230/COMPARISON.md) |
| `veh-cd-263` | CD 263 / 371 / 372 | parametric (`livery`: cd263, cd263No015, cd371No002, cd371No005, cd372, db180, dbAg180 - the DB 180 is the 372): the CD 163's body, cabs, roof and running gear (`cd163Body`) with the 263's machine room - two banks of grilles on the right, square and divided windows on the left (four equal ones on the 371 005) - in the red liveries with a yellow or cream band; about 15,200 to 15,500 triangles. See [loco-liveries.md](loco-liveries.md) and `assets/cd-263/SOURCES.md` |
| `veh-cd-263` | CD 263 / 371 / 372 | parametric (`livery`: cd263, cd263No015, cd371No002, cd371No005, cd372): the CD 163's body, cabs, roof and running gear (`cd163Body`) with the 263's machine room - two banks of grilles on the right, square and divided windows on the left (four equal ones on the 371 005) - in the red liveries with a yellow or cream band; about 15,200 to 15,500 triangles. See [loco-liveries.md](loco-liveries.md) and `assets/cd-263/SOURCES.md` |
| `veh-cd-704`, `veh-cd-710`, `veh-cd-714`, `veh-cd-742`, `veh-db-212`, `veh-muv-69` | CD 704 / CSD T 234.0, CD 710 Rosnicka, CD 714, CD 740 / 742 / 743, DB V 100 / 212, MUV 69 | small and shunting diesels from vlakosimdb: the two-axle CKD shunter (`livery`: cd704, the default, t2380), the rod-coupled T 334.0, the rebuilt 714, the T 448.0 / T 466.2 hood family (`variant`: viamont742, the default, viamont740, cd743), the DB centre-cab V 100.20 (`livery`: oldRed, the default, oceanBlue, trafficRed) and the two-axle track motor car with its loading deck; 6.76 to 14.24 m, about 3,700 to 9,700 triangles. See [small-diesels.md](small-diesels.md) |

| `veh-csd-classic-green-coach`, `veh-csd-balm` ... `veh-csd-dsk` | CSD Classic Green Coach, Balm, Bam, Bdmtee, Be31, Bi20, Dsk | rigid coaches and a luggage van reconstructed from native vlakosimdb XML/BMPs by a shared coach builder (`csdCoaches.ts`, `csdCoachParts.ts`), with running numbers: the Y-type classic green coach (parametric, `variant` classA/classB = vlakosimdb CSD A/B, [parameters.md](parameters.md)), the Balm and Bam trailers, the Bdmtee commuter coach, the two-axle Be31, Bi20 and Dsk; 10.5 to 26.4 m, 3,200 to 6,200 triangles. See [csd-coaches.md](csd-coaches.md) |
| `veh-bmo-double-deck-coach` | Bmo Double-Deck Coach | parametric (`livery` csd/cdBlue/cdBlueGrey/cdRedDoors = vlakosimdb CSD Bmo and CD Bmo#1..#3): the double-deck coach with a dropped centre, 26.8 m, about 6,500 to 6,800 triangles. See [bmo-double-deck.md](bmo-double-deck.md) |
| `veh-cd-green-white-coach` | CD Green-White Coach | parametric (`variant` a/ab/b/bee/beel/bds/ds/bdmeer/bdmtee/beeBlue = vlakosimdb CD A ... CD Bdmtee, CD Bee 001): the CD green and white Y-type compartment coaches, luggage coach and van, and the 26.4 m BDmeer and Bdmtee; about 6,000 to 6,500 triangles. See [cd-green-white.md](cd-green-white.md) |
| `veh-cd-y-coach` | CD Y Coach | parametric (`variant` bcc/beer/bnb/wrrm = vlakosimdb CD Bcc, Beer, Bnb, WRRm): CD Y-family coaches in later liveries (couchette, Beer, Bnb, the 26.4 m WRRm dining car); about 6,000 to 6,300 triangles. See [czsk-coaches.md](czsk-coaches.md) |
| `veh-zsr-coach` | ZSR Coach | parametric (`variant` a/ab/b/bh/bds/bdmeer/wrrm/apee = vlakosimdb ZSR A ... ZSR Apee): the Slovak red (Bh green) Y coaches, the 26.4 m BDmeer and WRRm, the white and blue Apee; about 5,800 to 6,100 triangles. See [czsk-coaches.md](czsk-coaches.md) |
| `veh-cd-green-white-coach` | CD Green-White Coach | parametric (`variant` a/ab/b/bee/beel/bds/ds/bdmeer/bdmtee = vlakosimdb CD A ... CD Bdmtee): the CD green and white Y-type compartment coaches, luggage coach and van, and the 26.4 m BDmeer and Bdmtee; about 6,000 to 6,500 triangles. See [cd-green-white.md](cd-green-white.md) |
| `veh-db-dosto`, `veh-dr-sbahn-berlin` | DB Regio Double-Deck Coach, DR Double-Deck Coach (Berlin S-Bahn livery) | parametric German coaches from vlakosimdb (the n-Wagen are cars of `veh-db-628`): the Goerlitz double-deck coaches of DB Regio (`variant` firstClass/secondClass/drivingTrailer) and of the DR in the 1987 Berlin livery (`variant` coach/drivingTrailer, the DBmq); about 6,700 to 7,500 triangles. See [german-coaches.md](german-coaches.md) |
| `veh-uic-z-coach` | UIC-Z Coach | parametric (`variant` firstClass/secondClass/restaurant x `operator` cd/db/obb = vlakosimdb CD Ampz, Bmz, WRRmz, DB IC Ampz, Bmpz, WRmz, OBB Ampz, Bmpz, WRmz): the 26.4 m Eurofima-type coach with its skirt and plug doors; about 5,300 to 5,800 triangles. See [czsk-coaches.md](czsk-coaches.md) |
| `veh-nas-flat-wagon`, `veh-ua-open-wagon`, `veh-eas-open-wagon` | Nas Flat Wagon, Ua Open Wagon, Eas Open Wagon | parametric (`cargo`: Nas empty/wood/tubes/reels, Ua empty/coal/wood/sand, Eas empty/wood/coal = the vlakosimdb load variants): a 20.9 m flat wagon with stakes and two high-sided open wagons, about 4,000 to 10,300 triangles. See [wagons.md](wagons.md) |
| `veh-csd-433-0`, `veh-csd-456-0`, `veh-csd-475-1`, `veh-csd-477-0`, `veh-csd-498-1`, `veh-csd-556-0`, `veh-csd-636`, `veh-csd-386`, `veh-csd-m112` | CSD 433.0 ... CSD M 112.0 | the steam locomotives from vlakosimdb, their own family (`steamLocos.ts`): tank engines, tender engines with a `unit` parameter (`locomotive`, `tender`), a Mallet, a streamliner and a steam railcar, every wheelset and rod a part moved by the `running` animation clip; 3,000 to 14,400 triangles. See [steam-locomotives.md](steam-locomotives.md) and [animation.md](animation.md) |
| `veh-cd-471`, `veh-cd-680` | CD 471 CityElefant, CD 680 Pendolino | parametric electric units from vlakosimdb, one car per `unit` value: the Skoda double-deck set (motorCar 471, the default, trailer 071, drivingTrailer 971; `variant` cd471 or vlakosimdb's repainted cd675) with the low-floor centre between the bogies and both decks' windows, and the Alstom tilting train (endCar 681, the default, car683, car685, car686) with its tapered body; 25.7 to 27.7 m, about 5,900 to 8,100 triangles. See [czech-emus.md](czech-emus.md) |
| `veh-cd-750`, `veh-cd-749`, `veh-cd-781`, `veh-csd-t679-0`, `veh-csd-t499`, `veh-cd-771` | CD 750 / 753 / 754 Brejlovec, CD 749 Bardotka, CD 781 Sergej, CSD T 679.0 Pomeranc, CSD T 499.0 / CD 759 Kyklop, CD 770 / 771 Cmelak | the Czech mainline diesels from vlakosimdb, their own family (`dieselLocos.ts`): the T 478 Brejlovec and Bardotka, two designs on one builder (`livery`), the M62 and the hood unit (`livery`), the T 679.0 and T 499.0 prototypes; Bo'Bo' and Co'Co' bogies, 16.5 to 18.0 m over the buffers, 9,100 to 12,700 triangles. See [diesel-locos.md](diesel-locos.md) |
| `veh-cd-451`, `veh-cd-460`, `veh-cd-470` | CD 451 Zabotlam, CD 460, CD 470 | parametric older electric units from vlakosimdb, one car per `unit` value (motorCar, the default, or trailer): the 1964 Studenka set with its raked, lamp-podded nose and low floor (24.1 and 23.5 m), the 1970s Ostrava unit with the forward-leaning windscreen, two pantographs and buffers (24.5 m; `livery` cd, cd003, cd007, csd), and the 1991 double-deck prototype whose single-deck motor car rises to the trailer's roof at its inner end (26.4 m); about 4,700 to 8,100 triangles. See [czech-emus-classic.md](czech-emus-classic.md) |
| `veh-cd-810`, `veh-cd-843`, `veh-csd-m131`, `veh-csd-m240`, `veh-csd-m296` | CD 810 / 812 / 912, CD 843 / 943 / 043, CSD M 131.1 Hurvinek, CSD M 240.0 Singrovka, CSD M 296.1 / CD 853 / 854 | Czech diesel railcars from vlakosimdb, bodies lofted from the XML and laid out from the native BMPs: the two-axle 810 (`variant` cd810, the default, cd812, cd912; `livery` red, yellowBand, blueWhite, ivoryBand), the 843 family (`unit` motorCar, drivingTrailer, trailer), the two-axle Hurvinek (`unit` motorCar, trailer), the M 240.0 and the M 296.1 (`variant` m296, cd853, cd854); 12.1 to 25.2 m over the buffers, about 3,900 to 6,400 triangles. See [czech-dmus.md](czech-dmus.md) |
| `veh-db-628`, `veh-mav-mdmot`, `veh-ice-1`, `veh-tgv` | DB 628, MAV MDmot, ICE 1, TGV | parametric foreign units from vlakosimdb, one car per build: the DB 628 (motorCar, the default: the 628.2 motor car, 22.70 m to the short coupling; bn, abn, bdnrf: the set's 26.4 m n-Wagen coaches; `livery` mint, the default, or red), the MAV MDmot set (motorCar, the default, trailerAx, trailerBx, drivingTrailer; 15.52 to 22.40 m over buffers), the ICE 1 (powerCar, the default, coach, restaurant with its raised roof; 20.56 and 26.40 m) and the TGV (powerCar, the default, endCoach, coach; `livery` pse, the default, or atlantique; 22.15, 21.845 and 18.7 m, the coaches carrying half a Jacobs bogie at each joint); about 2,700 to 8,000 triangles. See [foreign-units.md](foreign-units.md) |
| `veh-raj-hopper-wagon`, `veh-rah-tank-wagon` | Raj Hopper Wagon, Rah Tank Wagon | rigid: the Raj with four yellow pressure-discharge hoppers and the silver CPAVEX ammonia tank wagon, about 4,200 and 4,400 triangles. See [wagons.md](wagons.md) |
| `veh-sqns-container-wagon`, `veh-pao-flat-wagon`, `veh-habis-sliding-wall-wagon`, `veh-hadgs-hopper-wagon`, `veh-faccs-hopper-wagon`, `veh-falls-hopper-wagon`, `veh-wap-hopper-wagon` | Sqns Container Wagon, Pao Flat Wagon, Habis Sliding-Wall Wagon, Hadgs Covered Hopper Wagon, Faccs, Falls and Wap Hopper Wagon | their own family (`freightWagons.ts`, `hopperWagons.ts`): the Sqns (`cargo` empty/maersk) and Pao (`cargo` empty/tubes) with their vlakosimdb loads, the Habis (`livery` tw1/tw2), Faccs (`livery` cd/viamont) and Falls (`livery` cd/sd/viamont) in their paints, the Hadgs and the loaded Wap; 12.8 to 23.2 m, about 3,500 to 5,100 triangles. See [freight-wagons.md](freight-wagons.md) |
| `veh-tatra-t3`, `veh-tatra-t6`, `veh-tatra-kt8`, `veh-tatra-kt4`, `veh-kvag-gt4`, `veh-metro-81-71` | Tatra T3, Tatra T6A5, Tatra KT8D5, Tatra KT4, GT4, Metro 81-71 | the trams and the metro car from vlakosimdb (`trams.ts`, `metro.ts`, `tramKit.ts`): the T3 (`variant` t3, t3m, t3prototype), the T6A5, the KT8D5 (`livery` redWhite, red, modern), the KT4 and the GT4 - the last three articulated, sections and joints in a rig without steering - and the 81-71 (`unit` headCar, middleCar) with third-rail shoes; one raised pantograph per tram; 5,500 to 11,800 triangles. See [trams.md](trams.md) |

`VEHICLES` in `vehicles.ts` lists them as `{ id, title, build }`, the same
`ProceduralDesign` shape as the skyscrapers (`design.ts`). `VEHICLE_CATALOG`
beside it holds the game-catalog fields they share - category `Road vehicles`,
group `truck`, `defaultScale` 1, CC0 by Rail Island - which the build writes into
`vehicles.meta.json` ([export.md](export.md)). Those values are a first guess
for the game's vehicle import; settle them when the webapp side is written.

A design may carry its own `catalog` (`ProceduralDesign.catalog`) in place of
`VEHICLE_CATALOG`: the locomotives use `RAIL_CATALOG` (category `Rail vehicles`,
group `loco`) and its own palette; the CSD coaches use `COACH_CATALOG` (category
`Rail vehicles`, group `coach`) and the freight wagons `WAGON_CATALOG` (group `wagon`). The repository rail envelope in
`test/models.test.ts` allows at most 3.1 m width and 4.7 m fixed-equipment height,
with a separate 6.5 m operating height limit for extended pantographs. These are
project limits rather than a universal loading gauge. Rail vehicles aim at about **15,000 triangles** (tested at most 16,000, so a
small overflow for a detail worth keeping passes) instead of 10,000: it is 16.8 m long and seen up close along the track. The
test also pins the CD 163's length (16.80 m) and axle positions (the bogie
pivots 8.30 m apart, 3.20 m wheelbase). The shared helpers (`block`, `side`,
`plate`, `arc`) live in `vehicleParts.ts`; `vehicles.ts` re-exports `cd150`, `cd163`, `cd263` and the coaches'
builders so the JS bundle finds every vehicle's build function in one module.

The CD 150 preserves the source XML's 1 m upper cab setback and different
2.6/2.7 m nose breaks. Panels split at the changes of slope. Its two sides have
different machine-room features: large intake banks versus four rectangular
windows, with a higher cooler on the window side. The green side skirt hangs
to 0.9 m above rail along the body, broken by the cab-door steps, and drops to
0.6 m over x=-1.1..1.1 m at the native BMPs' slope (0.3 m per 0.4 m). The
front mask follows the photographs in `assets/cd-150/` where they resolve more
than the BMP: the plate and the chrome-rimmed marker lamps sit just below the
cream/green boundary, the top headlight is a dark twin-lens housing, and the
green wraps down to the buffer beam; the wheels have spoked centres. Those
landmarks carry a photo-measured `photoBox` that the comparison uses in place
of the native estimate. Wheel contact is at y=0,
bogie centres are 8.40 m apart and the wheelbase is 3.30 m. Its collector arm
lengths are preserved between folded and raised poses. The dedicated tests
check these mechanical constraints and 39 native-raster landmarks; generic
model tests cover the envelope, deterministic output, source tree, GLB/JS
agreement and coplanar surfaces. Generate the review table and annotated
orthographic views with `pnpm exec tsx generator/cd150Report.ts` after a model
build. The initial authored-to-fitted MAE falls from 0.573 to 0.219 percentage
points on those annotations; this does not measure photographic accuracy.

### Running numbers

Each locomotive shows one full national running number on its side and front
plates, in the CSD/CD scheme of 1988: `ABC DEF-G` - class, serial and a check
digit (from the right, weights 2, 1, 2, ...; digit sums of the products; the
difference to the next multiple of ten). The CD 150 is `150 222-8`
(`CD150_NUMBER` in `cd150.ts`; a CD-era 150.2 unit, since the native plate does
not resolve digits), the CD 163 `163 244-7` (`CD163_GREEN.number` in `cd163.ts`, from its
photograph); every other livery's number comes from `runningNumber(class, serial)`
in `cd163.ts` ([loco-liveries.md](loco-liveries.md)). `test/cd150.test.ts` and
`test/cd163Family.test.ts` check the check digits. The
railroad-vehicle skill has the whole scheme.

The CD 163's body is lofted in plan rather than swept: horizontal octagons (the
cab ends' corners chamfered) stacked in colour bands, with both the upper and
lower cab faces raked inward from the nose, and a hipped roof. Cab and side
landmarks are calibrated to the original vlakosimdb BMPs, retained under
`assets/cd-163/native/`: `x_both.bmp` (30 by 60 pixels) and `z_dec.bmp` /
`z_inc.bmp` (170 by 60). The source XML maps these to 3 by 6 m and 17 by 6 m,
so each native pixel represents 0.10 m. The old 4x images are not measurement
sources. Photographs still establish mechanical dimensions, including buffer
spacing, wheel diameter and overall length.

The body runs from 1.03 to 3.70 m, with a yellow band at 1.70 to 2.30 m.
Grey roof aprons start at 3.50 m on the sides; the front stays green to 3.70 m,
matching the different paint boundaries in the native front and side BMPs.
The projecting nose is at the band's upper edge: the face recedes 0.20 m toward
the eave and 0.10 m toward the apron at 1.20 m. Below that apron the chassis
skirt is upright. Each colour band follows this same double-raked profile.
Each front glass is 1.20 m wide and approximately 0.70 m high (aspect 1.71),
from 2.70 to 3.40 m above rail, inside a metal surround and rubber gasket.
The 80 mm corner chamfers leave room for frames extending to 1.39 m either
side of the centreline. The side cab panes are 0.60 by 0.70 m with a sloping
leading edge; the door glazing is 0.50 by 0.70 m, aligned at 2.60 to 3.30 m.
Doors, handles, steps and handrails move together with the wider glazing.
Bottom-mounted wipers and front handrails stand proud of the shell.

Both red and white lower marker lenses are circular, 200 mm across, in equal
300 mm housings centred at 1.50 m above rail. Their lateral centres are 0.85
and 1.25 m either side of the centreline. The 1 by 2 pixel lens patches do not
justify stretching a circular lens to a narrow rectangle. Housings stay below
the yellow band, with about 150 mm above the buffer heads. The front number
plate's red field is 1,000 by 300 mm, inside a 1,040 by 340 mm surround; the
upper twin headlight has a 600 by 200 mm housing. The side number plates are
1,100 by 300 mm. Upright badges retain their outline proportions at 400 mm
height rather than copying the pixel stair steps.

Buffer heads are rounded 700 by 400 mm plates at the standard 1,750 mm spacing,
with separate housings and plungers; the locomotive stays 16.80 m long. The
coarse bitmap head outlines are ambiguous, so they do not override the standard
spacing. Broad, tilted snow ploughs span 0.10 to 0.50 m above rail and 0.40 to
1.40 m either side of the centreline. Their cutting edges project 170 mm ahead
of their tops, a rearward lean of approximately 23 degrees from vertical.
Horizontal corrugations use approximately 145 mm pitch and stop below the
gutters. Four 700 mm porthole panes sit at 2.85 m on the +Z side. The opposite
intake frame extends from 2.40 to 3.30 m, matching `z_inc`. The central cooler
has a skirt overlapping the upper side wall at 3.30 m and reaches 4.25 m, the
midpoint of the two side textures' half-pixel disagreement in its top edge.

`assets/cd-163/native/landmarks.json` records 50 independently annotated
native-pixel boxes and their model scopes. Regression checks project the actual
GLB vertices onto the same canvases: front `u = 1.5 - Z`, side `u = X + 8.5`,
vertical `v = 6 - Y`. Both side comparisons follow the bitmap's longitudinal
axis; the intake side is mirrored relative to a normal outside view. Tests
compare left/top coordinates and width/height within one pixel for clear
landmarks, two for ambiguous doors/buffers/ploughs. The painted band's
horizontal silhouette has a three-pixel tolerance because the texture extends
beyond the mesh; its vertical position and height are also covered by the
cab-profile and clearance tests. These are raster-layout tolerances, not claims
of engineering accuracy.

Across the same 50 annotated boxes, mean absolute error in normalized left, top,
width and height decreased from 1.736 percentage points in `421c9ce` to 0.356
(about 80%). Front error decreased from 1.732 to 0.657 pp; the porthole side
from 1.685 to 0.124 pp and the intake side from 1.804 to 0.153 pp. The metric
weights all four box components equally on the full texture canvases; it does
not measure photographic realism or the unannotated roof/underframe details.

Windows, lamps and plates are `slab`s laid on a face through a small `Surface`
mapping (the side wall and the two sloped cab faces). Marker lights, number
plates, the badge and lower handrails follow the lower plane and its outward
normal; the twin headlight follows the upper plane. Buffer heads remain
upright on the chassis, preserving the overall length. Lettering
uses connected condensed numeral strokes with diagonal legs and curved bowls,
rather than seven-segment digits. The period upright CD badge is an approximate
reconstruction: the official SVG outlines in `cdLogo.ts` are de-skewed and
narrowed to the photographed badge's proportions, normalized and triangulated
by ear clipping. It is not an exact historic logo tracing. These markings are
one-sided `facets` decals a few millimetres off their supporting surfaces.
Coil springs (`coil`, shared with the CD 150's bogies) are one lofted tube whose
radius swells and narrows once per turn, capped only on top; insulators are a
core with a few sheds. Round parts use as few sides as their size allows
(portholes 16, lamps 12, tanks and axle boxes 8-10): the model was trimmed
from about 22,400 to about 15,600 triangles this way. The intake shutters keep
their full 88 fine slats: thinning them made the side read worse.

The rear (-X) pantograph is raised to a 5.74 m collector height; the front one
remains folded at 4.64 m. On both locomotives the lower arm hinges toward the
middle of the roof and the knee points to the nearer cab end, as on the
photographs; the tests check this in both poses. This is a static operating pose in the rigid model,
not an animation. The raised linkage is solved from the folded arm lengths:
the knee moves at the intersection of hinge/head distance circles, preserving
both arm lengths while lifting the contact head 1.10 m. The collector strips
stay level, the base remains anchored, and the upper arm attaches 20 mm above
the lower knee. Tests cover exactly one raised collector, folded and operating
heights, constant arm lengths and joint continuity. Electric locomotives with
two pantographs use one raised and one folded in their default displayed pose.

Regression checks in `test/models.test.ts` cover the cab glazing aspect ratio
and rake, both cab setbacks and the upright skirt, the actual GLB surface
distances of lower fittings, door/window alignment, equal marker sizes and
clearances to the band, plate and buffers, snow-plough height and lean, buffer
head sizes, upright
badge proportions, and the different machine-room sides, alongside the overall
dimensions, axle positions, triangle budget and coplanar-overlap checks.

**The ids are stored in the game's saved maps**: never rename one that has
shipped. Vehicle ids start with `veh-`.

Use [road-vehicle](../../.agents/skills/road-vehicle/SKILL.md) for road models
and [railroad-vehicle](../../.agents/skills/railroad-vehicle/SKILL.md) for rail
models. When vlakosimdb is a source, also follow
[vlakosimdb-transfer](../../.agents/skills/vlakosimdb-transfer/SKILL.md): use XML
shapes and original BMPs, optimize an element-comparison table, and present
the final table and before/after errors to the user.

## Budget

At most **10,000 triangles** per road vehicle and about **15,000** per rail vehicle (tested at most 16,000); there is no file-size budget.
A vehicle's GLB is the same format as a skyscraper's: non-indexed triangle
soups with **flat normals stored** per face (tested). The normals are
redundant - a loader could compute the same ones - but storing them means no
step of the game's pipeline that recomputes normals on shared vertices (which
smooths every hard edge) can get them wrong.

## Steered front wheels

Every road vehicle's front wheels are parts of their own, children of the
front body's node (`truck`, a bus's `body` or `section0`), named for the
factory's frame on every vehicle: `wheel-front-left` at -Z and
`wheel-front-right` at +Z (the 8x4 mixer's second steered axle
`wheel-front-2-left` and `-right`; the rig's `steer.axles[].nodes` list each
pair, the -Z wheel first), each with its pivot at the wheel's centre: the game turns a wheel by rotating its node about its own Y axis,
as it spins the wind turbine's rotor. `steeredWheels()` (`vehicleParts.ts`) draws
them; the axle beam stays in the body. The model's `rig` names them, with the
inner wheel's lock, the wheelbase and the track for Ackermann angles
([vehicle-rig.md](vehicle-rig.md)). The truck's wheels lock at 40 degrees; the
tyre turns inside the fender's arch (its farthest point stays 0.54 m from the
wheel's centre, the arch's inside is 0.6 m out).

## Articulated vehicles: truck and trailer

A tractor with a semi-trailer is one model with **two named parts**, divided at
the coupling's rotation point - the king pin on the fifth wheel:

```ts
m.part("truck", [0, 0, 0], () => tractor(m));
m.part("trailer", PIVOT, () => trailer(m)); // PIVOT = the king pin
```

The design draws both in world coordinates as usual. `toGlb` writes a node per
part, named after it and translated to its pivot, with its mesh's positions
relative to that pivot: the `truck` node sits at the origin, the `trailer` node
at the king pin, so **the game turns the trailer by rotating that node about its
own Y axis**. Each part is also a top-level scope of the source tree, and a
material's triangle numbering runs across the parts in node order
([source-tree.md](source-tree.md)). Parts are top level, used once each, and
once a model has parts every triangle must be in one (`part()` and `toGlb`
throw otherwise).

An articulated bus is the same with more parts: `section0`, `section1`, ... each
hinged at the middle of the gap the bellows covers, and a `joint<i>` part per gap
whose triangles are drawn by the rig's joint renderer ([buses.md](buses.md),
[vehicle-rig.md](vehicle-rig.md)). A part may also name a parent part: its node is
then a child of the parent's node (the steered wheels inside the truck).

**Animated parts.** A rigid vehicle stays one node unless something must move.
The steam locomotives are the exception: a static `body` part, then a part per
wheelset, rod and valve-gear link, each pivoted at its joint and driven by an
animation clip ([animation.md](animation.md)).

The American truck's king pin is at x = 1.05 m, on the fifth wheel's top
(y = 1.18 m), 0.6 m behind the trailer's front. Its front corners sweep a
1.43 m circle about it and the sleeper starts 1.55 m ahead, so the trailer can
swing without touching the tractor; nothing of the trailer hangs below the fifth
wheel's top ahead of the landing gear (the body's rails start 1 cm above it), and
the landing gear stands behind the tractor's rear wheels. Its rig hinges the
trailer at the king pin and allows 75 degrees either way, which `test/rig.test.ts`
checks triangle by triangle; the model page's Trailer slider swings it.

## Conventions

- Metres, **+X forward**, +Y up, +Z to the vehicle's right; centred on z = 0.
- The wheels **stand on y = 0**. A tyre is a 16-gon with a flat side down, so the
  axle sits at `WHEEL_R * cos(pi / 16)`, not at the radius.
- Real proportions: the tests hold a vehicle under 2.7 m wide (2.6 m legal,
  plus mirrors) and 4.115 m high (13 ft 6 in), and longer than twice its width.
- The GLB's generator string is `Rail Island procedural vehicle (<id>)`; a rigid
  rail vehicle's one node is named `vehicle` (a steam locomotive's are `body`,
  `wheelset-<n>` and its rods', `main-rod-right`, ...); a road vehicle's are its parts
  (`truck`, `trailer`, `body`, `section0`, `joint0`, and the steered wheels inside
  the front one).
- Chrome is only mildly metallic (0.45): the game and the site light models with
  no environment map, where a fully metallic surface renders nearly black.

## Sweeps

A building is lofted between horizontal rings; a vehicle is mostly the same loft
laid on its side. `m.sweep(mat, axis, s0, a0, s1, a1, caps = true)` draws the
walls between two vertical cross-sections at `a0` and `a1` along the horizontal
`axis` (`"x"` or `"z"`), with both end caps unless `caps` is false:

- a section's points are **(x, y) for a sweep along z** and **(z, y) for one
  along x**, in either winding - the sweep normalises it, so the walls always
  face out (tested);
- both sections must be convex (caps are triangle fans) and of equal length.

What the truck builds with it:

| part | sweep |
|---|---|
| a wheel, an axle | an `ngon` in (x, y) along z |
| the cab, the sleeper, the visor | the side profile in (x, y) along z |
| the hood | a chamfered (z, y) section along x, to a slightly smaller one |
| a fuel tank, an air horn | an `ngon` in (z, y) along x |
| the trailer's body, rails, posts, doors | `block()`s |
| a closed box (`block()`) | a (z, y) rectangle along x - six faces, unlike `box()`, which has no floor |
| a fender (`plate()`) | quads between two parallel side-view polylines, each along z |

A non-convex outline, such as a fender's arch, is several convex sweeps: `plate()`
makes one quad per segment, and neighbouring quads meet back to back.

Vertical cylinders (exhaust stacks, air cleaners) are ordinary `prism`s.

## Flicker

The same rule as the skyscrapers ([skyscrapers.md](skyscrapers.md), "Flicker"),
and the same build guard. Details that sit on a surface (windows, lamps, door
handles, a grille's bars) are **sunk into it**, a centimetre or two behind the
face they sit on, and stand a centimetre or more proud of it: never flush with a
face of another material. The grille's dark mesh starts 1 cm inside the chrome
shell for that reason - flush, its back face shared a plane with the bars'.

## Adding a vehicle

Follow the applicable road or railroad vehicle skill linked above:

1. Write a function in `vehicles.ts` that returns a `MeshBuilder` over
   `VEHICLE_PALETTE`, and add it to `VEHICLES` with a `veh-` id and a title.
   Wrap every part in a named `m.scope(...)` - chassis, each axle, hood, cab - so
   the site's Source tab reads like the design. An articulated vehicle draws
   its tractor and trailer in `m.part("truck", ...)` and `m.part("trailer", pivot, ...)`.
2. `pnpm build:models`, then look at `export/thumbs/<id>.png` and the triangle
   count.
3. `pnpm test` - every design's z-fighting, scope and source-tree checks run
   over the vehicles too, plus the vehicle shape and triangle budget checks above.

The former Nas tram load and Pao Karosa bus load are intentionally omitted. Legacy IDs map to their corresponding empty wagon with scale multiplier 1.
