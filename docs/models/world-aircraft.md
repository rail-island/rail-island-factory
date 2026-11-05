# World aircraft

**Covers** - the 100 aircraft from around the world on the airframe kit and the rotor kit (airliners, regional and business jets, turboprop and piston airliners, light aircraft, freighters, flying boats, four helicopters and the Zeppelin NT): the kits' specs and what they draw, the shared airline liveries, the helicopters' rotor clip, game properties, OpenTTD figures, sounds, references, deviations and tests.
**Code** - `generator/airframeKit.ts`, `generator/airframeShapes.ts`, `generator/rotorKit.ts`, `generator/airlineSchemes.ts`, `generator/worldAircraft.ts`, `generator/worldJets.ts`, `generator/worldProps.ts`, `generator/worldRotorcraft.ts`, `generator/lodAir.ts` (`airLod`), `generator/openttdTable.ts` (`worldAircraftTable`), `generator/worldFleet.ts`, `test/worldAircraft.test.ts`, `test/worldFleet.test.ts`
**See also** - [aircraft.md](aircraft.md) (the eight original aircraft and the body/decal technique), [world-fleet.md](world-fleet.md) (references, data checks, the sweep sample), [animation.md](animation.md) (time clips), [game-properties.md](game-properties.md), [../site/openttd-export.md](../site/openttd-export.md), [lod.md](lod.md)

## The designs

All at their real size, in the catalog's `Aircraft` category (`AIRCRAFT_CATALOG`, yaw 180),
modelled on the photographs in `assets/<references>/` (the folder named like the id without
`veh-`), whose `SOURCES.md` gives the published figures and marks the estimates. **The ids
are stored in saved maps: never rename one.** Size is length x span x height in metres (a
helicopter's fuselage, rotor diameter and height to the rotor head); the OpenTTD
introduction year and capacity (seats, or a freighter's payload in tonnes); triangles at the
defaults (budget 10,000, LOD 200). Parameters list their values, the default first.

| id | title | kit | size (m) | parameters | OpenTTD year / capacity | triangles |
|---|---|---|---|---|---|---|
| `veh-boeing-707` | Boeing 707-320 | airliner nose, low wing, pods x4, conventional tail, tricycle | 46.61 x 44.42 x 12.93 | livery: panAm, qantas, lufthansa | 1959 / 189 | 5,432 |
| `veh-boeing-727` | Boeing 727-200 | airliner nose, low wing, rear x2 + tail (S-duct), T tail, tricycle | 46.68 x 32.92 x 10.36 | livery: eastern, lufthansa, american | 1967 / 189 | 4,436 |
| `veh-boeing-737-200` | Boeing 737-200 | airliner nose, low wing, pods x2, conventional tail, tricycle | 30.53 x 28.35 x 11.28 | livery: lufthansa, united, malaysia | 1968 / 130 | 4,084 |
| `veh-boeing-737-max` | Boeing 737 MAX 8 | airliner nose, low wing, pods x2, conventional tail, tricycle | 39.52 x 35.92 x 12.3 | livery: southwest, ryanair, aeromexico | 2017 / 189 | 3,932 |
| `veh-boeing-747-8` | Boeing 747-8 | airliner nose, low wing, pods x4, conventional tail, tricycle | 76.25 x 68.4 x 19.35 | variant: passenger, freighter | 2011 / 467 | 8,520 |
| `veh-boeing-757` | Boeing 757-200 | airliner nose, low wing, pods x2, conventional tail, tricycle | 47.32 x 38.05 x 13.56 | livery: delta, britishAirways, icelandair | 1983 / 200 | 4,494 |
| `veh-boeing-767` | Boeing 767-300ER | airliner nose, low wing, pods x2, conventional tail, tricycle | 54.94 x 47.57 x 15.85 | livery: ana, american, lot | 1986 / 269 | 4,884 |
| `veh-boeing-777` | Boeing 777-300ER | airliner nose, low wing, pods x2, conventional tail, tricycle | 73.86 x 64.8 x 18.5 | livery: emirates, airFrance, cathay | 2004 / 396 | 5,744 |
| `veh-boeing-787` | Boeing 787-9 | airliner nose, low wing, pods x2, conventional tail, tricycle | 62.81 x 60.12 x 17.02 | livery: airNewZealand, qatar, united | 2014 / 296 | 5,388 |
| `veh-douglas-dc8` | Douglas DC-8-63 | airliner nose, low wing, pods x4, conventional tail, tricycle | 57.12 x 45.23 x 12.92 | livery: klm, sas, united | 1967 / 259 | 5,410 |
| `veh-douglas-dc9` | McDonnell Douglas DC-9-30 | airliner nose, low wing, rear x2, T tail, tricycle | 36.37 x 28.47 x 8.38 | livery: swissair, delta, alitalia | 1967 / 115 | 4,032 |
| `veh-md-80` | McDonnell Douglas MD-82 | airliner nose, low wing, rear x2, T tail, tricycle | 45.06 x 32.87 x 9.04 | livery: american, alitalia, sas | 1981 / 155 | 4,264 |
| `veh-douglas-dc10` | McDonnell Douglas DC-10-30 | airliner nose, low wing, pods x2 + tail (straight), conventional tail, tricycle | 55.5 x 50.4 x 17.7 | livery: american, lufthansa, swissair | 1972 / 270 | 5,926 |
| `veh-lockheed-tristar` | Lockheed L-1011 TriStar | airliner nose, low wing, pods x2 + tail (S-duct), conventional tail, tricycle | 54.17 x 47.35 x 16.87 | livery: eastern, twa, britishAirways | 1972 / 256 | 5,432 |
| `veh-convair-880` | Convair 880 | airliner nose, low wing, pods x4, conventional tail, tricycle | 39.42 x 36.58 x 11 | livery: delta, twa, cathay | 1960 / 110 | 5,186 |
| `veh-airbus-a300` | Airbus A300B4 | airliner nose, low wing, pods x2, conventional tail, tricycle | 53.62 x 44.84 x 16.53 | livery: airFrance, lufthansa, thai | 1974 / 266 | 5,040 |
| `veh-airbus-a310` | Airbus A310 | airliner nose, low wing, pods x2, conventional tail, tricycle | 46.66 x 43.9 x 15.8 | livery: swissair, lufthansa, airIndia | 1983 / 220 | 5,024 |
| `veh-airbus-a320` | Airbus A320 | airliner nose, low wing, pods x2, conventional tail, tricycle | 37.57 x 34.1 x 11.76 | length: a319, a320, a321; livery: lufthansa, easyJet, iberia | 1988 / 180 | 4,184 |
| `veh-airbus-a320neo` | Airbus A321neo | airliner nose, low wing, pods x2, conventional tail, tricycle | 44.51 x 35.8 x 11.76 | livery: wizz, turkish, chinaSouthern | 2017 / 220 | 4,092 |
| `veh-airbus-a330` | Airbus A330-300 | airliner nose, low wing, pods x2, conventional tail, tricycle | 63.66 x 60.3 x 16.79 | livery: cathay, turkish, aerLingus | 1994 / 300 | 5,354 |
| `veh-airbus-a340` | Airbus A340-600 | airliner nose, low wing, pods x4, conventional tail, tricycle | 75.36 x 63.45 x 17.22 | livery: lufthansa2018, iberia, etihad | 2002 / 380 | 7,096 |
| `veh-airbus-a350` | Airbus A350-900 | airliner nose, low wing, pods x2, conventional tail, tricycle | 66.8 x 64.75 x 17.05 | livery: qatar, singapore, finnair | 2015 / 325 | 5,154 |
| `veh-airbus-a220` | Airbus A220-300 | airliner nose, low wing, pods x2, conventional tail, tricycle | 38.71 x 35.1 x 11.5 | livery: swiss, airCanada, delta | 2016 / 140 | 4,084 |
| `veh-concorde` | Concorde | pointed nose, low wing, pods x4, conventional tail, tricycle | 61.66 x 25.6 x 12.2 | livery: britishAirways, airFrance | 1976 / 100 | 5,624 |
| `veh-caravelle` | Sud Aviation Caravelle | airliner nose, low wing, rear x2, cruciform tail, tricycle | 32.01 x 34.3 x 8.72 | livery: airFrance, sas, sabena | 1959 / 80 | 4,152 |
| `veh-dh-comet` | de Havilland Comet 4 | airliner nose, low wing, buried x4, conventional tail, tricycle | 33.99 x 35 x 8.99 | livery: boac, bea, aerolineas | 1958 / 81 | 4,900 |
| `veh-vickers-vc10` | Vickers VC10 | airliner nose, low wing, rear x4, T tail, tricycle | 48.36 x 44.55 x 12.04 | livery: boac, britishAirways, kenya | 1964 / 135 | 5,200 |
| `veh-hs-trident` | Hawker Siddeley Trident | airliner nose, low wing, rear x2 + tail (S-duct), T tail, tricycle | 35 x 29.87 x 8.23 | livery: bea, britishAirways, airChina | 1964 / 115 | 4,436 |
| `veh-bac-111` | BAC One-Eleven | airliner nose, low wing, rear x2, T tail, tricycle | 32.61 x 28.5 x 7.47 | livery: bea, tarom, aerLingus | 1965 / 119 | 3,776 |
| `veh-bae-146` | BAe 146-200 | blunt nose, high wing, pods x4, T tail, tricycle | 28.6 x 26.21 x 8.61 | livery: britishAirways, lufthansa, swiss | 1983 / 100 | 5,220 |
| `veh-fokker-f28` | Fokker F28 Fellowship | airliner nose, low wing, rear x2, T tail, tricycle | 29.61 x 25.07 x 8.47 | livery: klm, garuda, sas | 1969 / 65 | 3,698 |
| `veh-fokker-100` | Fokker 100 | airliner nose, low wing, rear x2, T tail, tricycle | 35.53 x 28.08 x 8.5 | livery: klm, swissair, american | 1988 / 107 | 3,778 |
| `veh-tupolev-tu104` | Tupolev Tu-104 | glazed nose, low wing, buried x2, conventional tail, tricycle | 38.85 x 34.54 x 11.9 | livery: aeroflot, csa | 1956 / 70 | 4,568 |
| `veh-tupolev-tu134` | Tupolev Tu-134 | glazed nose, low wing, rear x2, T tail, tricycle | 37.1 x 29.01 x 9.02 | livery: aeroflot, csa, interflug | 1967 / 76 | 4,508 |
| `veh-tupolev-tu154` | Tupolev Tu-154M | airliner nose, low wing, rear x2 + tail (S-duct), T tail, tricycle | 47.9 x 37.55 x 11.4 | livery: aeroflot, balkan, malev | 1972 / 164 | 5,356 |
| `veh-tupolev-tu144` | Tupolev Tu-144 | pointed nose, low wing, pods x4, conventional tail, tricycle | 65.7 x 28.8 x 12.5 | livery: aeroflot, plain | 1977 / 140 | 5,848 |
| `veh-ilyushin-il62` | Ilyushin Il-62M | airliner nose, low wing, rear x4, T tail, tricycle | 53.12 x 43.2 x 12.35 | livery: aeroflot, csa, interflug | 1967 / 174 | 5,704 |
| `veh-ilyushin-il86` | Ilyushin Il-86 | airliner nose, low wing, pods x4, conventional tail, tricycle | 59.54 x 48.06 x 15.81 | livery: aeroflot, aeroflotNew | 1980 / 350 | 6,616 |
| `veh-ilyushin-il96` | Ilyushin Il-96-300 | airliner nose, low wing, pods x4, conventional tail, tricycle | 55.35 x 57.66 x 17.57 | livery: aeroflotNew, cubana, rossiya | 1993 / 262 | 6,528 |
| `veh-yakovlev-yak40` | Yakovlev Yak-40 | blunt nose, low wing, rear x2 + tail (S-duct), T tail, tricycle | 20.36 x 25 x 6.5 | livery: aeroflot, csa | 1968 / 32 | 3,640 |
| `veh-yakovlev-yak42` | Yakovlev Yak-42 | airliner nose, low wing, rear x2 + tail (S-duct), T tail, tricycle | 36.38 x 34.88 x 9.83 | livery: aeroflot, cubana | 1980 / 120 | 4,840 |
| `veh-sukhoi-superjet` | Sukhoi Superjet 100 | airliner nose, low wing, pods x2, conventional tail, tricycle | 29.94 x 27.8 x 10.28 | livery: aeroflotNew, rossiya | 2011 / 98 | 4,012 |
| `veh-antonov-an148` | Antonov An-148 | blunt nose, high wing, pods x2, T tail, tricycle | 29.13 x 28.91 x 8.19 | livery: rossiya, ukraine | 2009 / 75 | 4,200 |
| `veh-embraer-e190` | Embraer E190 | airliner nose, low wing, pods x2, conventional tail, tricycle | 36.24 x 28.72 x 10.57 | livery: klm, lot, aeromexico | 2005 / 100 | 3,930 |
| `veh-embraer-e195-e2` | Embraer E195-E2 | airliner nose, low wing, pods x2, conventional tail, tricycle | 41.5 x 35.12 x 10.9 | livery: azul, embraer, klm | 2019 / 132 | 3,988 |
| `veh-embraer-erj145` | Embraer ERJ 145 | bizjet nose, low wing, rear x2, T tail, tricycle | 29.87 x 20.04 x 6.76 | livery: american, airFrance, lot | 1997 / 50 | 3,896 |
| `veh-bombardier-crj200` | Bombardier CRJ200 | bizjet nose, low wing, rear x2, T tail, tricycle | 26.77 x 21.21 x 6.22 | livery: lufthansa, delta, airCanada | 1992 / 50 | 4,016 |
| `veh-bombardier-crj900` | Bombardier CRJ900 | bizjet nose, low wing, rear x2, T tail, tricycle | 36.2 x 24.85 x 7.51 | livery: delta, lufthansa, garuda | 2003 / 90 | 3,942 |
| `veh-comac-c919` | COMAC C919 | airliner nose, low wing, pods x2, conventional tail, tricycle | 38.9 x 35.8 x 11.95 | livery: chinaEastern, comac, airChina | 2023 / 168 | 4,252 |
| `veh-comac-arj21` | COMAC ARJ21 | airliner nose, low wing, rear x2, T tail, tricycle | 33.46 x 27.29 x 8.44 | livery: comac, chinaSouthern, airChina | 2016 / 90 | 3,940 |
| `veh-gulfstream-g650` | Gulfstream G650 | bizjet nose, low wing, rear x2, T tail, tricycle | 30.41 x 30.36 x 7.82 | colour: blue, red, green, gold, black | 2012 / 19 | 3,404 |
| `veh-bombardier-global` | Bombardier Global 7500 | bizjet nose, low wing, rear x2, T tail, tricycle | 33.88 x 31.68 x 8.23 | colour: blue, red, green, gold, black | 2018 / 19 | 3,612 |
| `veh-dassault-falcon-7x` | Dassault Falcon 7X | bizjet nose, low wing, rear x2 + tail (S-duct), cruciform tail, tricycle | 23.38 x 26.21 x 7.83 | colour: blue, red, green, gold, black | 2007 / 16 | 3,604 |
| `veh-learjet-35` | Learjet 35 | bizjet nose, low wing, rear x2, T tail, tricycle | 14.83 x 12.04 x 3.73 | colour: blue, red, green, gold, black | 1974 / 8 | 3,044 |
| `veh-embraer-phenom-300` | Embraer Phenom 300 | bizjet nose, low wing, rear x2, T tail, tricycle | 15.64 x 16.2 x 5.1 | colour: blue, red, green, gold, black | 2009 / 9 | 2,824 |
| `veh-hondajet` | HondaJet HA-420 | bizjet nose, low wing, pods x2 over-wing, conventional tail, tricycle | 12.99 x 12.12 x 4.54 | colour: blue, red, green, gold, black | 2015 / 6 | 2,840 |
| `veh-namc-ys11` | NAMC YS-11 | blunt nose, low wing, turboprop x2, conventional tail, tricycle | 26.3 x 32 x 8.99 | livery: ana, jalClassic, olympic | 1965 / 64 | 3,456 |
| `veh-atr-72` | ATR 72-600 | blunt nose, high wing, turboprop x2, T tail, tricycle | 27.17 x 27.05 x 7.65 | length: 42, 72; livery: airFrance, alitalia, malaysia | 2011 / 72 | 4,000 |
| `veh-dhc-dash8` | De Havilland Canada Dash 8 Q400 | blunt nose, high wing, turboprop x2, T tail, tricycle | 32.81 x 28.42 x 8.34 | livery: alaska, airCanada, sas | 2000 / 78 | 3,824 |
| `veh-dhc-twin-otter` | DHC-6 Twin Otter | blunt nose, high wing, turboprop x2, conventional tail, tricycle (fixed) | 15.77 x 19.81 x 5.94 | gear: wheels, floats, skis | 1966 / 19 | 2,568 |
| `veh-dhc-beaver` | DHC-2 Beaver | cowl nose, high wing, radial nose x1, conventional tail, taildragger (fixed) | 9.22 x 14.63 x 2.74 | gear: wheels, floats | 1948 / 6 | 2,128 |
| `veh-saab-340` | Saab 340 | blunt nose, low wing, turboprop x2, conventional tail, tricycle | 19.73 x 21.44 x 6.97 | livery: sas, swissair, finnair | 1984 / 34 | 3,428 |
| `veh-saab-2000` | Saab 2000 | blunt nose, low wing, turboprop x2, conventional tail, tricycle | 27.28 x 24.76 x 7.73 | livery: swissair, swiss | 1994 / 50 | 3,796 |
| `veh-fokker-f27` | Fokker F27 Friendship | blunt nose, high wing, turboprop x2, conventional tail, tricycle | 23.56 x 29 x 8.5 | livery: klm, aerLingus, sabena | 1958 / 48 | 3,514 |
| `veh-fokker-50` | Fokker 50 | blunt nose, high wing, turboprop x2, conventional tail, tricycle | 25.25 x 29 x 8.32 | livery: klm, sas, austrian | 1987 / 56 | 3,578 |
| `veh-embraer-brasilia` | Embraer EMB 120 Brasilia | blunt nose, low wing, turboprop x2, T tail, tricycle | 20 x 19.78 x 6.35 | livery: delta, united, embraer | 1985 / 30 | 3,462 |
| `veh-embraer-bandeirante` | Embraer EMB 110 Bandeirante | blunt nose, low wing, turboprop x2, conventional tail, tricycle | 15.1 x 15.33 x 4.92 | livery: embraer, navyBand | 1973 / 18 | 2,848 |
| `veh-let-l410` | Let L-410 Turbolet | blunt nose, high wing, turboprop x2, conventional tail, tricycle | 14.42 x 19.98 x 5.83 | livery: csa, aeroflot, navyBand | 1971 / 19 | 3,008 |
| `veh-xian-ma60` | Xian MA60 | blunt nose, high wing, turboprop x2, conventional tail, tricycle | 24.71 x 29.2 x 8.85 | livery: chinaSouthern, garuda, plain | 2000 / 60 | 3,904 |
| `veh-antonov-an24` | Antonov An-24 | glazed nose, high wing, turboprop x2, conventional tail, tricycle | 23.53 x 29.2 x 8.32 | livery: aeroflot, interflug, cubana | 1962 / 50 | 3,788 |
| `veh-ilyushin-il18` | Ilyushin Il-18 | blunt nose, low wing, turboprop x4, conventional tail, tricycle | 35.9 x 37.4 x 10.17 | livery: aeroflot, interflug, csa | 1959 / 100 | 5,080 |
| `veh-vickers-viscount` | Vickers Viscount | blunt nose, low wing, turboprop x4, conventional tail, tricycle | 26.11 x 28.56 x 8.15 | livery: bea, aerLingus, lufthansa | 1953 / 75 | 4,300 |
| `veh-lockheed-electra` | Lockheed L-188 Electra | blunt nose, low wing, turboprop x4, conventional tail, tricycle | 31.85 x 30.18 x 10 | livery: eastern, american, klm | 1959 / 98 | 4,532 |
| `veh-douglas-dc3` | Douglas DC-3 | blunt nose, low wing, radial x2, conventional tail, taildragger | 19.7 x 29 x 5.16 | livery: american, klm, swissair | 1936 / 28 | 3,392 |
| `veh-douglas-dc6` | Douglas DC-6B | blunt nose, low wing, radial x4, conventional tail, tricycle | 32.18 x 35.81 x 8.74 | livery: panAm, sas, sabena | 1951 / 102 | 4,324 |
| `veh-lockheed-constellation` | Lockheed L-1049 Super Constellation | blunt nose, low wing, radial x4, triple tail, tricycle | 35.42 x 37.49 x 7.54 | livery: twa, lufthansa, airFrance | 1951 / 95 | 4,448 |
| `veh-boeing-377` | Boeing 377 Stratocruiser | blunt nose, low wing, radial x4, conventional tail, tricycle | 33.63 x 43.05 x 11.66 | livery: panAm, boac, united | 1949 / 100 | 5,152 |
| `veh-ford-trimotor` | Ford Trimotor | cowl nose, high wing, radial nose x1 + radial x2, conventional tail, taildragger (fixed) | 15.32 x 23.72 x 3.86 | - | 1926 / 15 | 2,728 |
| `veh-junkers-ju52` | Junkers Ju 52/3m | cowl nose, low wing, radial nose x1 + radial x2, conventional tail, taildragger (fixed) | 18.9 x 29.25 x 4.5 | livery: bareMetal, lufthansa | 1932 / 17 | 3,032 |
| `veh-dh-dragon-rapide` | de Havilland Dragon Rapide | blunt nose, low wing (biplane), inline x2, conventional tail, taildragger (fixed) | 10.52 x 14.63 x 3.12 | - | 1935 / 8 | 2,884 |
| `veh-bn-islander` | Britten-Norman Islander | blunt nose, high wing, inline x2, conventional tail, tricycle (fixed) | 10.86 x 14.94 x 4.18 | livery: navyBand, coastGuard, plain | 1967 / 9 | 2,436 |
| `veh-pilatus-pc12` | Pilatus PC-12 | cowl nose, low wing, turboprop nose x1, T tail, tricycle | 14.4 x 16.28 x 4.26 | livery: rfds, navyBand, plain | 1994 / 9 | 2,332 |
| `veh-cessna-172` | Cessna 172 Skyhawk | cowl nose, high wing, inline nose x1, conventional tail, tricycle (fixed) | 8.28 x 11 x 2.72 | colour: blue, red, green, gold, black | 1956 / 3 | 2,124 |
| `veh-cessna-caravan` | Cessna 208 Caravan | cowl nose, high wing, turboprop nose x1, conventional tail, tricycle (fixed) | 11.46 x 15.88 x 4.53 | gear: wheels, floats | 1985 / 13 | 1,984 |
| `veh-piper-cherokee` | Piper PA-28 Cherokee | cowl nose, low wing, inline nose x1, conventional tail, tricycle (fixed) | 7.25 x 9.14 x 2.22 | colour: blue, red, green, gold, black | 1961 / 3 | 2,080 |
| `veh-beech-king-air` | Beechcraft King Air 350 | bizjet nose, low wing, turboprop x2, T tail, tricycle | 14.22 x 17.65 x 4.37 | colour: blue, red, green, gold, black | 1990 / 11 | 2,864 |
| `veh-antonov-an124` | Antonov An-124 Ruslan | airliner nose, shoulder wing, pods x4, conventional tail, tricycle | 69.1 x 73.3 x 20.78 | livery: antonov, volgaDnepr | 1986 / 150 t | 7,324 |
| `veh-antonov-an225` | Antonov An-225 Mriya | airliner nose, shoulder wing, pods x6, twin tail, tricycle | 84 x 88.4 x 18.1 | - | 1988 / 250 t | 9,372 |
| `veh-antonov-an2` | Antonov An-2 | cowl nose, low wing (biplane), radial nose x1, conventional tail, taildragger (fixed) | 12.4 x 18.18 x 4.1 | gear: wheels, floats | 1949 / 12 | 2,636 |
| `veh-lockheed-l100` | Lockheed L-100 Hercules | blunt nose, high wing, turboprop x4, conventional tail, tricycle | 34.37 x 40.41 x 11.66 | livery: plain, navyBand, saa | 1965 / 22 t | 4,372 |
| `veh-boeing-dreamlifter` | Boeing 747 Dreamlifter | airliner nose, low wing, pods x4, conventional tail, tricycle | 71.68 x 64.44 x 21.54 | - | 2007 / 113 t | 7,048 |
| `veh-airbus-beluga-xl` | Airbus BelugaXL | airliner nose, low wing, pods x2, conventional tail, tricycle | 63.1 x 60.3 x 18.9 | - | 2020 / 51 t | 4,592 |
| `veh-canadair-cl415` | Canadair CL-415 | boat nose, high wing, turboprop x2, T tail, tricycle | 19.82 x 28.6 x 8.98 | livery: firefighter, coastGuard | 1994 / 8 | 3,416 |
| `veh-shinmaywa-us2` | ShinMaywa US-2 | boat nose, high wing, turboprop x4, T tail, tricycle | 33.46 x 33.15 x 9.8 | - | 2007 / 20 | 4,500 |
| `veh-boeing-314` | Boeing 314 Clipper | boat nose, high wing, radial x4, triple tail, none (fixed) | 32.31 x 46.36 x 8.41 | - | 1939 / 74 | 3,944 |
| `veh-sikorsky-s92` | Sikorsky S-92 | rotor kit: 4-blade rotor, tail rotor, wheels | 17.1 x 17.16 (rotor) x 4.95 | livery: offshore, rescue | 2004 / 19 | 2,358 |
| `veh-airbus-h145` | Airbus Helicopters H145 | rotor kit: 5-blade rotor, fenestron, skids | 11.64 x 11 (rotor) x 3.96 | livery: airAmbulance, police | 2014 / 9 | 1,894 |
| `veh-mil-mi8` | Mil Mi-8 | rotor kit: 5-blade rotor, tail rotor, wheels | 18.17 x 21.3 (rotor) x 5.65 | livery: aeroflot, utair | 1967 / 24 | 2,214 |
| `veh-bell-206` | Bell 206 JetRanger | rotor kit: 2-blade rotor, tail rotor, skids | 9.5 x 10.16 (rotor) x 2.91 | colour: blue, red, green, gold, black | 1967 / 4 | 1,626 |
| `veh-zeppelin-nt` | Zeppelin NT | airship: envelope, Y fins, gondola, three propellers | 75.1 x 14.16 (diameter) | livery: zeppelin, goodyear | 1997 / 12 | 1,812 |

The list's ids and titles are kept; no row was replaced. Corrections against the list: the
A320 row is the A320 family (`length` A319, A320, A321) and the ATR row the ATR 42/72
(`length`), as the list's params say; the 747-8's `variant` gives the passenger
Intercontinental in Lufthansa's 2018 colours and the freighter in Cargolux's.

## Axes and datums

As the wide bodies of `aircraft.ts`: metres, nose at +X (catalog yaw 180), wings along Z,
+Y up, the fuselage centred on x = 0 (the published length from the nose tip, the spinner
of a nose propeller included, to the tail cone or the fin's trailing edge), the wheels -
floats, skis, a flying boat's keel - on y = 0. The fin's top is the published height. A
taildragger stands level, its tail wheel on a long leg, as the Aero A.10 does: the game flies
the model as it stands.

## The airframe kit

`airframe(spec)` builds an aircraft from one `AirframeSpec`; `airframeLod(spec)` feeds the
same spec to `airLod` (lodAir.ts); `geometry(spec)` derives what both share. The designs
write their specs as a `Brief` (`worldAircraft.ts brief`): short fields, positions `d` in
metres behind the nose tip. The kit draws:

- **The fuselage**: stations of two-lobe sections (`hullSec`, as the wide bodies' are),
  dense at the nose and along the tail cone, two along the cabin. The profile (keel, crown,
  half width, the widest point's height) closes towards the nose by superellipses whose
  lengths and powers the nose kind sets - `airliner`, `blunt` (turboprops), `bizjet`,
  `pointed` (Concorde, Tu-144), `glazed` (the navigator's nose of the Tu-104, Tu-134 and
  An-24, with its panes), `cowl` (a single engine's cowl, closing to the spinner's face),
  `boat` (a flying boat's bow) - scaled by `noseScale`; and rises along the tail cone to the
  end's height `tailY` and half width `tailEnd` (an S-duct trijet's nozzle). Options: a
  rounded-box section (`corner`: light aircraft, Ju 52, Islander), an upper lobe (`hump`:
  the 747's upper deck, the Stratocruiser's double bubble), a narrow keel lobe (`hull`:
  CL-415, US-2, Boeing 314), an extra lobe by position (`bulge`: the Dreamlifter's and the
  Beluga XL's cargo holds).
- **The wing**: from span, root, kink and tip chords, leading-edge sweep, dihedral, root
  position and `pos` (low, mid, high, shoulder), or an explicit planform (`plan`: the
  deltas). Tip devices: `blended`, `split` (737 MAX), `sharklet`, `curved` (A350),
  `canted` (A330, A340, Il-96), `fence` (A310, A320ceo), `raked` (the last part swept back
  harder: 747-8, 777, 787, E195-E2) and `tiptank` (Learjet). Struts (`strut`) from the
  fuselage's lower side; a biplane's upper wing with interplane and cabane struts (`upper`).
- **The engines**: turbofan pods under the wing (`pod`, `jet` for a long-ducted turbojet)
  or over it (HondaJet); rear-fuselage pods, single or paired (VC10, Il-62); a centre
  engine through the fin root (DC-10) or behind an S-duct intake on the spine (727,
  TriStar, Trident, Tu-154, Yak-40, Yak-42, Falcon 7X), its nozzle at the tail cone's end;
  engines buried in the wing roots (Comet, Tu-104); propeller engines on the wing or the
  nose - turboprop nacelles deep under a high wing or with their axis above a low one,
  radial cowls with the cylinders' dark face, inline nacelles - each with a spinner and its
  blades standing still. All nacelles are `nacelle` (aircraft.ts's turbofan) or bodies.
- **The empennage**: `conventional`, `T`, `cruciform`, `twin` (end-plate fins, An-225) and
  `triple` (Constellation, Boeing 314), a dorsal fillet, or no tailplane (the deltas). The
  fin and tailplane move forward as a whole when they would reach past the published length.
- **The gear**: tricycle or taildragger legs (single or twin wheels, bogies of 2 or 3
  axles, five or seven legs a side on the Antonovs), retractable as the part `gear` (the
  game hides it in flight), fixed with optional spats; fairings low on the fuselage the
  legs retract into (`fairing`: ATR, BAe 146, An-124, Hercules), gear pods behind the wing
  (Tu-104, Tu-134, Tu-154), floats, skis, a flying boat's wingtip floats and sponsons.
- **Windows and doors**: rows of oval, round, rectangular or triangular (Caravelle) panes
  as decals, broken at the doors; an upper-deck row; the windscreen on the nose and the
  side panes behind it. A freighter (`cargo`) has none but its crew door.
- **The livery** (`Scheme`, `airlineSchemes.ts`): one record per carrier and era in the
  kit's relative terms, so one scheme fits every airframe - the skin by section height
  (belly, crown, bands), a tail colour behind a slanted cut, a nose colour, cheatlines by
  height above the keel, fin bands by fin height and fin shapes in (chord fraction, height
  fraction), cowl, winglet and wing colours, and plain titles along the upper fuselage in
  the stroke font. Simplified colour fields and plain lettering only: no logos. A
  light aircraft or business jet has a `colour` parameter (white with a coloured cheatline
  and fin band, `colourSchemes`).
- **`extra(m, g)`**: what the kit cannot say - the Tu-144's canards, the Beluga XL's eyes
  and smile.

The kit copies aircraft.ts's shapes into `airframeShapes.ts` rather than importing them:
exporting them from `aircraft.ts` renames the minified symbols of the eight original
aircraft's JS models, whose bytes must not change. Change a shape in both files together.

## The rotor kit

`rotorcraft(spec)` builds a helicopter from a `RotorSpec`: the cabin pod and the tail boom as
one fuselage of stations (the nose closing to the wrap-round glazing), the engine deck (with
the Mi-8's intakes), sponsons (the S-92's gear housings, the Mi-8's tanks), the fin, the
stabilizer, skids or wheels (the S-92's retract, the part `gear`), windows, doors and a
`Scheme`. The main rotor is the part `rotor` (pivot on the mast at the hub), the tail rotor
or the fenestron's fan the part `tailrotor` (pivot on its hub, turning about Z); the clip
**`rotor`** (drive `time`, `ROTOR_PERIOD` = 0.48 s, 12 samples) turns the main rotor once,
anticlockwise seen from above on the US designs and clockwise on the Airbus and Mil ones,
and the tail rotor four times. Each step is under half a turn, so the interpolation turns the
right way, and the loop closes on the first pose. The LOD stands the blades still.

`airship(spec)` builds the Zeppelin NT: a body of revolution, three fins in a Y (one on top),
the gondola with its wheel on the ground, the two side propellers on outriggers and the stern
propeller.

## Game properties, OpenTTD and sounds

- `game`: `weight` the maximum take-off mass (t), `power` a jet's total static thrust in kN
  times 10 (as the original airliners state it) or a propeller aircraft's shaft power (kW),
  `maxspeed` the cruising speed, `accel` null, `sizeClass` (small: light aircraft, business
  jets, small turboprops, helicopters and the airship; medium: narrow bodies, regional jets,
  larger turboprops; big: wide bodies and the big freighters) and `seatFrac`.
- OpenTTD (`worldAircraftTable` in openttdTable.ts): the introduction year, typical seats
  (every aircraft is refittable to passengers), the freighters' payload in tonnes of goods
  (An-124, An-225, L-100, Dreamlifter, Beluga XL, the 747-8F variant), and presets of the
  other liveries, lengths and gear. **The GRF encoder writes every aircraft as a plane**
  (property 09 = 2): it has no helicopter subtype, so the helicopters and the airship are
  planes in OpenTTD and need an airport. Supporting the subtype is a change to
  `src/openttd/grf.ts` and the OpenTTD properties, not made here.
- Sounds: none. `soundMapping.ts` derives no aircraft sound and rail-island-music has no
  jet, propeller or rotor design yet; a rotor sound for the helicopters is a request to that
  repository.

## References

Each folder has one or two Commons photographs fetched by `pnpm refs:fetch` (free licences
only; many airliner photos on Commons are GFDL-only and were refused) and a `## Published
figures` section: the year, length, span, height, typical seats or payload, mass, thrust or
power and cruising speed from the Wikipedia articles' infoboxes; positions of the wing,
engines, tail, gear, doors and windows are read off photographs and three-views (approx.).

## Deviations

- Every airframe is a kit approximation: noses, tail cones, wing-root fairings and fillets
  are generic for the nose kind; there are no belly fairings, flap-track fairings or
  antennas on the kit's airliners (the original aircraft have them).
- Propellers stand still; only the helicopters' rotors turn.
- Taildraggers stand level, not tail-down.
- The Concorde's nose is not drooped; the Tu-144's canards are flat plates.
- The Beluga XL's eyes and smile are simplified decals; the Dreamlifter's swing tail and
  the An-124's visor are not drawn as separate parts.
- Liveries are simplified colour fields with plain titles; emblems are basic shapes.
- The Twin Otter, Beaver, Caravan and An-2 on floats or skis keep their wheel-stance
  heights plus the floats; the amphibian Caravan's wheels in its floats are not drawn.
- The helicopters' main rotor turns on the time clip whatever the model does, at a visual
  rate (0.48 s a turn), not the real rotor speed.

## Checking

- `pnpm exec vitest run test/worldAircraft.test.ts` - all 100 designs, sampled parameter
  combinations: the published length, span and height, on y = 0, the 10,000-triangle
  budget, the LOD between 110 and 200, the gear part, liveries changing colours, the
  empennage inside the length, the rotor clip.
- `pnpm exec vitest run test/worldFleet.test.ts` - catalog, list ids, game properties,
  LOD, OpenTTD entries and ids, references; the covering sample covers every kit option.
- `pnpm exec vitest run catalog -t "boeing|airbus|antonov"` - the catalog sweep of the
  sampled designs (flicker, determinism, the JS model against the generator).
- Contact sheets: `pnpm exec tsx generator/contactSheet.ts <out.png> --cols 5 --cell 300 <ids>`.
