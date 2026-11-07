# World trams

**Covers** - the 99 trams from around the world on the dimension-driven world tram kit: rigid cars on bogies or a single truck, two- and three-section articulated cars on Jacobs bogies, multi-articulated low-floor cars on floating modules, the ULF's portals, the rubber-tyred Translohr, double-deckers with a covered or open top deck, open cross-bench cars, the steam and cable trams; the kit's `WorldTramSpec`, its front library, shapes and extras, the collectors, the doors, the distant model, the parameters, game properties, OpenTTD figures and sounds, references, deviations and tests.
**Code** - `generator/worldTramKit.ts`, `generator/worldTramShapes.ts`, `generator/worldTramsEurope.ts`, `generator/worldTramsWorld.ts`, `generator/worldTrams.ts`, `generator/tramKit.ts` (`Tram`, `articulate`, the pantographs), `generator/csdCoachParts.ts` (volumes, windows, doors), `generator/lodTrams.ts` (`volumeShell`), `generator/openttdTable.ts`, `generator/soundTable.ts`, `test/worldTrams.test.ts`, `test/worldFleet.test.ts`, `test/doorsSuite.ts`, `test/pantographs.test.ts`
**See also** - [trams.md](trams.md) (the vlakosimdb trams the kit builds on), [world-fleet.md](world-fleet.md) (references, data checks, the sweep sample), [vehicle-rig.md](vehicle-rig.md), [doors.md](doors.md), [interiors.md](interiors.md), [loading-gauge.md](loading-gauge.md), [animation.md](animation.md) (liftable mechanisms, collector heights), [lod.md](lod.md), [openttd-figures.md](openttd-figures.md), [sounds.md](sounds.md)

## The designs

All at their real size, in the `tram` group (`TRAM_CATALOG`, category `Rail vehicles`; an
OpenTTD road vehicle on tram track), modelled on the photographs in `assets/<references>/`
(the folder named like the id without `veh-`), whose `SOURCES.md` gives the published figures
and marks the estimates. **The ids are stored in saved maps: never rename one.** Sizes are
over the bodies (length x width x roof crown, equipment aside); the running gear front to back
(B bogie, J Jacobs bogie under a joint, P portal, T single truck, G guided rubber-tyred axle);
the collector raised to the game's trolley wire; the real gauge in mm (the model rides on the
factory's standard-gauge wheelsets); the OpenTTD introduction year and capacity (seats and
standing room); exterior triangles at the defaults.

| id | title | sections | size (m) | front | gear | collector | gauge | OpenTTD year / capacity | triangles | parameters |
|---|---|---|---|---|---|---|---|---|---|---|
| `veh-tatra-t1` | Tatra T1 | 1 | 14.5 x 2.4 x 3.06 | pcc | BB | diamond | 1435 | 1952 / 95 | 5,086 | - |
| `veh-tatra-t2` | Tatra T2 | 1 | 15.2 x 2.5 x 3.06 | pcc | BB | diamond | 1435 | 1955 / 100 | 5,862 | - |
| `veh-tatra-t4` | Tatra T4D | 1 | 14 x 2.2 x 3.06 | tatra | BB | diamond | 1435 | 1968 / 105 | 5,558 | unit: motorCar, trailer |
| `veh-tatra-k2` | Tatra K2 | 2 | 20.4 x 2.5 x 3.15 | tatra | BBJ | diamond | 1435 | 1966 / 157 | 9,602 | livery: classic, modern |
| `veh-tatra-t5c5` | Tatra T5C5 | 1 | 14.7 x 2.5 x 3.15 | angular | BB | diamond | 1435 | 1979 / 116 | 5,152 | - |
| `veh-skoda-14t` | Skoda 14T | 5 | 31.2 x 2.46 x 3.46 | bulb, 2 cabs | BBB | arm | 1435 | 2005 / 202 | 8,534 | - |
| `veh-skoda-15t` | Skoda 15T ForCity | 4 | 31.6 x 2.46 x 3.5 | pointed, 2 cabs | BBBB | arm | 1435 | 2009 / 210 | 15,620 | livery: prague, riga |
| `veh-skoda-13t` | Skoda 13T | 5 | 32.4 x 2.46 x 3.47 | modern, 2 cabs | BBB | arm | 1435 | 2008 / 210 | 8,014 | - |
| `veh-skoda-29t` | Skoda 29T | 5 | 31.6 x 2.46 x 3.55 | pointed | BBB | arm | 1435 | 2015 / 200 | 7,434 | - |
| `veh-skoda-10t` | Skoda 10T | 3 | 20 x 2.46 x 3.5 | modern, 2 cabs | BB | arm | 1435 | 2001 / 157 | 6,366 | livery: portland, tacoma |
| `veh-vario-lf` | Vario LF | 1 | 15.1 x 2.48 x 3.15 | duewag | BB | arm | 1435 | 2004 / 120 | 5,384 | - |
| `veh-ganz-csmg` | Ganz CSMG | 2 | 26.9 x 2.35 x 3.2 | angular | BBJ | diamond | 1435 | 1967 / 170 | 7,604 | - |
| `veh-siemens-combino` | Siemens Combino | 5 | 31.5 x 2.3 x 3.4 | flat, 2 cabs | BBB | arm | 1435 | 1996 / 180 | 13,088 | length: 3, 5, 7; livery: basel, amsterdam, freiburg |
| `veh-siemens-combino-supra` | Siemens Combino Supra | 9 | 54.5 x 2.4 x 3.5 | flat, 2 cabs | BBBBB | arm | 1435 | 2006 / 350 | 12,388 | - |
| `veh-siemens-avenio` | Siemens Avenio | 4 | 38.15 x 2.4 x 3.55 | pointed, 2 cabs | BBBB | arm | 1435 | 2014 / 250 | 9,640 | livery: munich, hague |
| `veh-siemens-ulf` | Vienna ULF | 5 | 26.3 x 2.4 x 3.3 | flat, 2 cabs | PPPP | arm | 1435 | 1997 / 136 | 12,264 | length: a, b |
| `veh-vienna-e1` | Vienna Type E1 | 2 | 19.65 x 2.2 x 3.1 | duewag | BBJ | arm | 1435 | 1966 / 159 | 6,800 | unit: motorCar, trailer |
| `veh-vienna-flexity` | Vienna Flexity | 5 | 34.8 x 2.4 x 3.4 | modern | BBBB | arm | 1435 | 2018 / 211 | 9,168 | - |
| `veh-duewag-gt8` | Duewag GT8 | 3 | 26.7 x 2.35 x 3.2 | duewag | BBJJ | diamond | 1435 | 1956 / 190 | 8,698 | livery: rheinbahn, heidelberg |
| `veh-duewag-u2` | Duewag U2 | 2 | 22.7 x 2.65 x 3.7 | duewag, 2 cabs | BBJ | arm | 1435 | 1968 / 160 | 6,928 | livery: frankfurt, edmonton, calgary |
| `veh-duewag-b80` | Stadtbahnwagen B | 2 | 28.15 x 2.65 x 3.5 | duewag, 2 cabs | BBJ | arm | 1435 | 1973 / 180 | 7,256 | - |
| `veh-gotha-t2-62` | Gothawagen T2-62 | 1 | 10.9 x 2.2 x 3.1 | retro | T | diamond | 1000 | 1962 / 80 | 3,920 | unit: motorCar, trailer |
| `veh-berlin-flexity` | Berlin Flexity | 5 | 30 x 2.4 x 3.6 | modern, 2 cabs | BBB | arm | 1435 | 2011 / 180 | 7,488 | length: short, long |
| `veh-stadler-variobahn` | Stadler Variobahn | 5 | 31.8 x 2.3 x 3.4 | flat, 2 cabs | BBB | arm | 1435 | 2002 / 180 | 8,636 | livery: munich, graz |
| `veh-stadler-tango` | Stadler Tango | 4 | 43.75 x 2.3 x 3.5 | pointed, 2 cabs | BBBB | arm | 1435 | 2009 / 280 | 10,484 | livery: geneva, basel |
| `veh-zurich-cobra` | Zurich Cobra Be 5/6 | 5 | 37 x 2.4 x 3.6 | pointed | BBB | arm | 1000 | 2001 / 230 | 11,686 | - |
| `veh-zurich-tram-2000` | Zurich Tram 2000 | 2 | 21.65 x 2.2 x 3.3 | angular | BBJ | arm | 1000 | 1976 / 150 | 6,872 | - |
| `veh-swiss-standard-tram` | Swiss Standard Tram | 1 | 13.75 x 2.2 x 3.1 | pcc, 2 cabs | BB | diamond | 1000 | 1940 / 100 | 5,680 | - |
| `veh-brussels-pcc` | Brussels PCC 7900 | 3 | 27.8 x 2.2 x 3.2 | pcc, 2 cabs | BBJJ | arm | 1435 | 1971 / 160 | 9,324 | - |
| `veh-amsterdam-9g` | Amsterdam 9G | 2 | 20.65 x 2.35 x 3.25 | duewag | BBJ | arm | 1435 | 1979 / 140 | 7,164 | - |
| `veh-hague-gtl8` | HTM GTL8 | 3 | 28.7 x 2.35 x 3.3 | duewag | BBJJ | arm | 1435 | 1981 / 180 | 8,832 | - |
| `veh-lisbon-remodelado` | Lisbon Remodelado | 1 | 8.4 x 2.3 x 3.25 | retro, 2 cabs | T | pole | 900 | 1936 / 58 | 3,576 | - |
| `veh-milan-ventotto` | Milan Ventotto | 1 | 13.6 x 2.35 x 3.35 | retro | BB | diamond | 1445 | 1928 / 130 | 5,018 | - |
| `veh-florence-sirio` | AnsaldoBreda Sirio | 5 | 32.4 x 2.4 x 3.4 | modern, 2 cabs | BBB | arm | 1435 | 2002 / 190 | 8,884 | livery: florence, milan, gothenburg |
| `veh-alstom-citadis` | Alstom Citadis 402 | 7 | 44 x 2.4 x 3.3 | modern, 2 cabs | BBBB | arm | 1435 | 2006 / 300 | 15,914 | livery: bordeaux, dublin, dubai |
| `veh-alstom-citadis-x05` | Alstom Citadis X05 | 5 | 33.6 x 2.65 x 3.3 | modern, 2 cabs | BBB | arm | 1435 | 2016 / 210 | 8,916 | livery: sydney, nice |
| `veh-alstom-tfs` | Alstom TFS | 3 | 30.3 x 2.3 x 3.3 | modern, 2 cabs | BBBB | arm | 1435 | 1987 / 170 | 8,946 | - |
| `veh-translohr` | Translohr STE3 | 5 | 29.8 x 2.2 x 2.89 | pointed, 2 cabs | GGGG | arm | 1435 | 2006 / 127 | 7,266 | - |
| `veh-caf-urbos` | CAF Urbos 3 | 7 | 44.4 x 2.65 x 3.4 | pointed, 2 cabs | BBBB | arm | 1435 | 2011 / 250 | 10,382 | livery: edinburgh, belgrade, kaohsiung |
| `veh-flexity-outlook` | Bombardier Flexity Outlook | 5 | 32.8 x 2.3 x 3.45 | modern, 2 cabs | BBB | arm | 1435 | 2005 / 200 | 8,868 | livery: brussels, marseille, innsbruck |
| `veh-croydon-cr4000` | Croydon CR4000 | 3 | 30.2 x 2.65 x 3.5 | duewag, 2 cabs | BBB | arm | 1435 | 2000 / 208 | 7,640 | - |
| `veh-blackpool-balloon` | Blackpool Balloon | 1, double deck | 12.8 x 2.29 x 4.75 | pcc, 2 cabs | BB | pole | 1435 | 1934 / 94 | 9,750 | - |
| `veh-blackpool-flexity` | Blackpool Flexity 2 | 5 | 33 x 2.65 x 3.4 | modern, 2 cabs | BBB | arm | 1435 | 2012 / 222 | 8,916 | - |
| `veh-sheffield-supertram` | Sheffield Supertram | 3 | 34.8 x 2.65 x 3.6 | duewag, 2 cabs | BBJJ | arm | 1435 | 1994 / 250 | 9,050 | - |
| `veh-nottingham-incentro` | Nottingham Incentro | 5 | 33.4 x 2.4 x 3.4 | modern, 2 cabs | BBB | arm | 1435 | 2003 / 200 | 8,916 | - |
| `veh-konstal-105n` | Konstal 105N | 1 | 13.5 x 2.4 x 3.1 | angular | BB | diamond | 1435 | 1973 / 125 | 5,572 | - |
| `veh-pesa-swing` | Pesa Swing | 5 | 33.4 x 2.4 x 3.5 | pointed | BBB | arm | 1435 | 2011 / 220 | 7,752 | livery: warsaw, krakow |
| `veh-solaris-tramino` | Solaris Tramino | 5 | 33.4 x 2.4 x 3.4 | modern, 2 cabs | BBB | arm | 1435 | 2011 / 220 | 8,916 | livery: poznan, jena |
| `veh-ktm-5` | KTM-5 | 1 | 15 x 2.6 x 3.05 | angular | BB | diamond | 1435 | 1969 / 129 | 5,210 | - |
| `veh-lm-68` | LM-68 | 1 | 15 x 2.55 x 3.2 | duewag | BB | diamond | 1435 | 1968 / 120 | 5,194 | - |
| `veh-vityaz-m` | 71-931M Vityaz-M | 3 | 26.8 x 2.5 x 3.45 | pointed | BBB | arm | 1435 | 2017 / 260 | 7,340 | - |
| `veh-electron-t5l64` | Electron T5L64 | 5 | 26.4 x 2.5 x 3.5 | modern | BBB | arm | 1435 | 2014 / 200 | 7,640 | - |
| `veh-bucharest-v3a` | Bucharest V3A | 3 | 26.9 x 2.4 x 3.2 | angular | BBJJ | diamond | 1435 | 1973 / 230 | 8,622 | - |
| `veh-koncar-tmk2200` | Koncar TMK 2200 | 5 | 33.4 x 2.3 x 3.4 | pointed | BBB | arm | 1000 | 2005 / 200 | 7,616 | - |
| `veh-durmazlar-silkworm` | Durmazlar Silkworm | 5 | 33.4 x 2.65 x 3.45 | bulb, 2 cabs | BBB | arm | 1435 | 2013 / 280 | 8,812 | - |
| `veh-helsinki-artic` | Transtech Artic | 3 | 27.6 x 2.4 x 3.6 | pointed | BBB | arm | 1000 | 2013 / 160 | 6,872 | - |
| `veh-helsinki-valmet` | Valmet Nr I | 2 | 20.05 x 2.3 x 3.3 | angular | BBJ | arm | 1000 | 1973 / 130 | 6,784 | - |
| `veh-oslo-sl79` | Oslo SL79 | 2 | 21.65 x 2.5 x 3.3 | duewag | BBJ | arm | 1435 | 1982 / 170 | 6,780 | - |
| `veh-gothenburg-m29` | Gothenburg M29 | 1 | 15 x 2.65 x 3.3 | duewag | BB | arm | 1435 | 1969 / 100 | 5,098 | - |
| `veh-pcc-streamliner` | PCC Streamliner | 1 | 14.2 x 2.54 x 3.1 | pcc | BB | pole | 1435 | 1936 / 100 | 7,312 | livery: pittsburgh, toronto, philadelphia |
| `veh-toronto-clrv` | Toronto CLRV | 1 | 15.2 x 2.54 x 3.4 | angular | BB | pole | 1435 | 1979 / 132 | 4,896 | - |
| `veh-toronto-flexity` | Toronto Flexity Outlook | 5 | 30.6 x 2.54 x 3.84 | modern | BBB | arm | 1435 | 2014 / 251 | 8,002 | - |
| `veh-birney-safety-car` | Birney Safety Car | 1 | 8.5 x 2.4 x 3.3 | retro, 2 cabs | T | pole | 1435 | 1916 / 40 | 3,624 | - |
| `veh-new-orleans-perley-thomas` | New Orleans Perley Thomas | 1 | 14.6 x 2.6 x 3.45 | retro, 2 cabs | BB | pole | 1435 | 1923 / 100 | 5,116 | - |
| `veh-boston-type-8` | Boston Type 8 | 2 | 22.3 x 2.69 x 3.6 | duewag, 2 cabs | BBJ | arm | 1435 | 1999 / 165 | 7,176 | - |
| `veh-siemens-s70` | Siemens S70 | 3 | 28.5 x 2.65 x 3.8 | modern, 2 cabs | BBB | arm | 1435 | 2003 / 220 | 7,920 | livery: houston, sandiego, portland |
| `veh-kinki-sharyo-lrv` | Kinki Sharyo LRV | 2 | 28 x 2.65 x 3.8 | duewag, 2 cabs | BBJ | arm | 1435 | 1996 / 180 | 7,368 | livery: dallas, phoenix |
| `veh-brookville-liberty` | Brookville Liberty | 3 | 21.4 x 2.46 x 3.8 | modern, 2 cabs | BB | arm | 1435 | 2016 / 150 | 6,150 | livery: dallas, milwaukee |
| `veh-philadelphia-kawasaki` | Philadelphia Kawasaki LRV | 1 | 15.2 x 2.6 x 3.25 | angular | BB | pole | 1435 | 1981 / 100 | 5,120 | - |
| `veh-rio-bonde` | Santa Teresa Bonde | 1, open | 9.2 x 2.3 x 3.1 | retro, 2 cabs | T | pole | 1100 | 1896 / 32 | 4,172 | - |
| `veh-buenos-aires-premetro` | Buenos Aires Premetro | 1 | 15.6 x 2.6 x 3.3 | angular, 2 cabs | BB | arm | 1435 | 1987 / 120 | 5,978 | - |
| `veh-hong-kong-tram` | Hong Kong Tram | 1, double deck | 11.98 x 2 x 4.5 | retro | T | diamond (low) | 1067 | 1949 / 115 | 6,788 | livery: classic, advertising |
| `veh-hiroshima-green-mover` | Hiroshima Green Mover Max | 5 | 30.4 x 2.45 x 3.65 | modern, 2 cabs | BBB | arm | 1435 | 2005 / 150 | 8,868 | - |
| `veh-toei-9000` | Toei 9000 | 1 | 13 x 2.2 x 3.55 | retro | BB | arm | 1372 | 2007 / 62 | 4,884 | - |
| `veh-toyama-portram` | Toyama Portram | 2 | 18.4 x 2.4 x 3.6 | modern, 2 cabs | BB | arm | 1067 | 2006 / 80 | 6,180 | livery: red, green, blue |
| `veh-tokyu-300` | Tokyu 300 | 2 | 24.9 x 2.5 x 3.7 | duewag, 2 cabs | BBJ | arm | 1372 | 1999 / 120 | 7,144 | livery: blue, red, green |
| `veh-kolkata-tram` | Kolkata Tram | 2 | 18.5 x 2.2 x 3.3 | retro, 2 cabs | TT | pole | 1435 | 1940 / 200 | 5,888 | - |
| `veh-dalian-tram` | Dalian Tram | 1 | 13.5 x 2.4 x 3.5 | retro, 2 cabs | BB | arm | 1435 | 1936 / 90 | 5,092 | - |
| `veh-foshan-hydrogen` | Foshan Hydrogen Tram | 3 | 27.7 x 2.65 x 3.4 | modern, 2 cabs | BBB | none | 1435 | 2019 / 250 | 8,044 | - |
| `veh-alexandria-double-deck` | Alexandria Double-Deck Tram | 1, double deck | 13 x 2.4 x 4.6 | angular, 2 cabs | BB | diamond (low) | 1435 | 1995 / 200 | 6,890 | - |
| `veh-addis-ababa-lrt` | Addis Ababa Light Rail | 3 | 29.1 x 2.65 x 3.65 | pointed, 2 cabs | BBB | arm | 1435 | 2015 / 254 | 8,188 | - |
| `veh-melbourne-w-class` | Melbourne W Class | 1 | 14 x 2.74 x 3.25 | retro, 2 cabs | BB | pole | 1435 | 1923 / 80 | 5,258 | livery: green, maroon |
| `veh-melbourne-b-class` | Melbourne B Class | 2 | 23.6 x 2.8 x 3.4 | duewag, 2 cabs | BBJ | arm | 1435 | 1984 / 180 | 7,272 | - |
| `veh-melbourne-e-class` | Melbourne E Class | 3 | 33.4 x 2.65 x 3.4 | modern, 2 cabs | BBB | arm | 1435 | 2013 / 210 | 8,468 | - |
| `veh-glenelg-h-class` | Glenelg H Class | 1 | 18 x 2.64 x 3.35 | retro, 2 cabs | BB | pole | 1435 | 1929 / 110 | 5,378 | - |
| `veh-sydney-r-class` | Sydney R Class | 1 | 16.6 x 2.9 x 3.35 | retro, 2 cabs | BB | pole | 1435 | 1933 / 110 | 5,282 | - |
| `veh-christchurch-boon` | Christchurch Boon Tram | 1 | 9.6 x 2.3 x 3.2 | retro, 2 cabs | T | pole | 1435 | 1906 / 50 | 3,368 | - |
| `veh-steam-tram` | Steam Tram | 1 | 4.6 x 2.1 x 3.2 | angular, 2 cabs | T | none | 1435 | 1885 / 60 | 2,956 | unit: engine, trailer |
| `veh-cable-car-dunedin` | Dunedin Cable Car | 1, open | 6.6 x 2.2 x 3 | retro, 2 cabs | T | none | 1067 | 1881 / 50 | 3,572 | - |
| `veh-istanbul-nostalgic` | Istanbul Nostalgic Tram | 1 | 8.8 x 2.2 x 3.3 | retro, 2 cabs | T | pole | 1435 | 1914 / 50 | 3,624 | - |
| `veh-trieste-opicina` | Trieste Opicina Tram | 1 | 11 x 2.2 x 3.3 | retro, 2 cabs | BB | diamond | 1000 | 1935 / 90 | 5,116 | - |
| `veh-budapest-ganz-uv` | Ganz UV | 1 | 14.4 x 2.3 x 3.15 | duewag | BB | diamond | 1435 | 1956 / 105 | 5,092 | - |
| `veh-wroclaw-skoda-16t` | Skoda 16T | 5 | 31.2 x 2.4 x 3.46 | bulb | BBB | arm | 1435 | 2006 / 200 | 7,780 | - |
| `veh-strasbourg-eurotram` | Strasbourg Eurotram | 7 | 36.5 x 2.4 x 3.4 | bulb, 2 cabs | BBBB | arm | 1435 | 1994 / 210 | 13,534 | - |
| `veh-montpellier-citadis` | Montpellier Citadis 302 | 5 | 32.6 x 2.65 x 3.3 | modern, 2 cabs | BBB | arm | 1435 | 2000 / 220 | 8,176 | livery: line1, line2 |
| `veh-gmunden-vario` | Gmunden Traunseetram | 3 | 31.9 x 2.4 x 3.4 | flat, 2 cabs | BBB | arm | 1000 | 2014 / 170 | 8,196 | - |
| `veh-sarajevo-k2yu` | Tatra K2YU | 2 | 20.4 x 2.5 x 3.15 | tatra | BBJ | diamond | 1435 | 1973 / 157 | 7,208 | - |
| `veh-turin-2800` | Turin Series 2800 | 2 | 20.45 x 2.3 x 3.3 | duewag | BBJ | diamond | 1435 | 1958 / 150 | 6,700 | - |
| `veh-dubai-citadis` | Dubai Tram | 7 | 44 x 2.65 x 3.3 | modern, 2 cabs | BBBB | none | 1435 | 2014 / 300 | 15,502 | - |

Every parameter value title is in the 14 languages (`text/`): the city liveries with their own
names in other languages (Prague, Munich, The Hague, ...) are translated, the others and every
type designation are verbatim (`text/verbatim.json`); the generic titles (Steam
Tram, Hong Kong Tram, ...) are translated.

## The kit

`worldTram(spec)` and `worldTramLod(spec, budget)` (`worldTramKit.ts`) build a tram from one
`WorldTramSpec` in metres from the nose. Axes as every rail vehicle's: +X forward (the nose at
the largest x), +Y up, +Z right, centred on x 0 and z 0, the treads on y 0.

- **Sections.** `sections` lists the bodies' lengths front first, `gap` the joint between them.
  One section is a rigid car: one body node and its bogie nodes. More are drawn through
  `articulate` (tramKit.ts): every section a part, every gap a bellows joint re-skinned by the
  game, the hinge mid gap or over the Jacobs bogie or portal under it, at 0.9 m.
- **Volumes.** Each section is one to three csdCoachParts volumes - the front cab, the saloon,
  the rear end - over one cross-section (`roof`: `arched`, or `flat` with round shoulders) scaled
  along a plan and clamped by an elevation. The plan and elevation come from the end shapes and
  the trucks: the skirt (`floor`) rises over each truck's wheels unless `skirted`. The paint
  `stack` lists each band's top from the skirt to the eave; the roof above is `roof`.
- **The front library** (`FRONTS`): `tatra` (round plan, upright screen, domed roof end), `pcc`
  (streamlined round nose, raked screen, sloped apron), `duewag` (flat with angled corners),
  `angular` (flat, chamfered, upright), `modern` (Citadis-like rounded nose, deep raked screen),
  `pointed` (Cobra, Avenio, Tango), `flat` (Combino, ULF, Variobahn), `bulb` (the Skoda 14T's
  Porsche nose), `retro` (a bowed dash under the roof carried over the vestibule). Each is a plan
  taper, a top line (fractions from the windscreen's foot to the roof) and an apron. The cab
  volume paints the windscreen (`screen`) as glass and the destination display above it.
- **A design's own nose.** `frontShape` (and `rearShape`, defaulting to the front's) replaces the
  library's shape with one drawn from the design's photographs; an `EndShape` may add an `upper`
  plan, the plan at the eave, which the cab narrows to from the screen's foot up (the
  csdCoachParts `Volume.upper`: the screen's corners leaning in under a hood). `cabPaint` gives
  the cab its own stack (a lamp band, a screen frame, a cap over the display). `nose`
  (`NoseDress`) lays on the end's surface, found by searching back from the end at each point
  (`noseAt`): `heads` and `tails` lamps (replacing the default pair), screen `pillars` and
  `bars`, parked `wipers`, `mirrors` on arms or camera arms at the cab's top corners, a `bumper`
  across the nose, and `panes` - framed windows and display boxes laid on the end in place of
  the screen band (an old car's three front windows, a double-decker's rows; `screenBand` keeps
  the band as well); the destination display's lit text (`route`: the route number in the
  stroke font and a row of lit characters for the destination, amber `displayLed` by default,
  on the band's sign or the pane `display`), the `number` painted on the nose, `badges` (a disc
  in a steel ring), amber `indicators`, a `grille` of slats; a rubber gasket runs along the
  screen band's foot and head (`noGasket` leaves it out), the wipers have arm and blade, the
  lamps a chrome reflector ring. A cab roof box takes a sixth figure, its `rake`: a fairing sloping down to
  the roof in two steps. The distant model keeps the shape but paints the cab in the body's
  stack. These ten designs have their own noses (the reference photos in `assets/<name>/`):
  - `veh-skoda-15t`: the ForCity's near-upright screen with leaning corners under a rounded hood,
    the silver lamp band with paired head lamps, the red bumper with its black strip, the
    Prague livery corrected to the photographed red, silver and black, one wiper, mirrors;
  - `veh-siemens-combino`: the flat upright front, the screen from 1.25 m under the display's
    black band, the big round lamps in silver bezels, the black coupler cover;
  - `veh-alstom-citadis` (and `veh-dubai-citadis`, the same 402): the rounded bumper bulging
    ahead of the raked screen, its corners leaning in, the lamps in a black band at its foot;
  - `veh-strasbourg-eurotram`: the glass bubble sweeping back and in to the roof over the green
    lamp panel, the white rim round the nose, CTS green, white and champagne silver;
  - `veh-siemens-ulf`: the box front, the screen in a black frame, the lamps in black recesses in
    the white panel, Wiener Linien grey, red and white;
  - `veh-zurich-cobra`: the pointed blue jaw, the black lamp band, the screen leaning far back
    under the blue display cap, VBZ blue below and over the windows;
  - `veh-tatra-k2`: the round front, the wide screen and its corner panes in a cream frame, the
    big head lamps in the red apron, the bumper rail over the cream skirt, the route number box;
  - `veh-pcc-streamliner`: the rounded vee, the screen in three lights round the corners under the
    sign, one head lamp in the dash, the anticlimber;
  - `veh-blackpool-balloon`: the driver's screen in three lights, the indicator box between the
    decks, the upper deck's two front windows;
  - `veh-hong-kong-tram`: the flat end with three windows on each deck, the display between
    them, one head lamp, the black fender and the route number box on the roof.
  Each carries its route and fleet number as photographed where the font allows (15T "18" and
  9203, Combino "8" and 326, Citadis "1", Eurotram "A" and 1003, ULF "J" and 25, Cobra "9" and
  3002, K2 1123 in gold, PCC 3318, Balloon 726, Hong Kong "1" and 103).
- **Ends.** `doubleEnded` gives both ends a cab and head lamps; a single-ended car's rear end has
  a rear window and tail lamps. `trailer` marks a unit's trailer: no head lamps, no collector.
- **Windows and doors.** The side windows (`windows`, `pitch`, a double-decker's `upper`) fill
  each section's straight side between the doors and the tapered ends. The doors (`doors`, metres
  from the nose; on the right only for a single-ended car, on both sides for a double-ended one)
  are `plug`, `fold` or `swing` doors (doors.ts), their lights on the leaves, each opening onto
  the generic cabin behind its doorway (coachCabin.ts). A car whose passengers board over open
  end platforms, and an open car, opens none.
- **Running gear** (`trucks`): `bogie` (an `m.bogie` node), `jacobs` (a bogie under a joint
  carrying both sections), `portal` (one pair of wheels under a joint, the ULF's), `truck` (two
  axles in the body's rigid frame: lone wheelsets) and `guided` (a rubber-tyred axle and its two
  guide rollers on the central rail, the Translohr's). The side frames keep within a narrow body.
- **Collectors** (`collector`): a `diamond` or `single` arm pantograph (tramKit.ts) raised to
  `TRAM_COLLECTOR_TOP` as a `liftable` mechanism; a double-decker's `low` diamond stands sunk
  0.15 m on its insulators so it folds half a metre under the wire; a trolley `pole` trailing
  back from its base to the wire, its own `trolleypole` lowering clip, never longer than its
  lowered shoe reaches over the rear end; or `none` (the battery, hydrogen, ground-power,
  steam and cable trams).
- **Decks.** A double-decker draws its upper windows and upper front glazing; `deck: "open"`
  instead puts an open top deck on the saloon's roof: a floor, a railing with decency boards, a
  knifeboard bench and a stair at each end.
- **Open sides** (`open`): a cross-bench car - underframe, floor, dashes, posts, benches of slats
  on cast-iron ends, curtain rails, the roof, running boards, truss rods, lifeguards.
- **Roof equipment** (`roofBoxes`) and a `clerestory`.
- **Extras** (`extra`, `extraLod`, `extraSection`): what the kit cannot say, from `worldTramShapes.ts` - the
  tram engine's chimney (with its smoke emitter), the
  cable car's grip and lever, the pusher buffer under the Opicina car's lower end.
- **`checkSpec(spec)`** lists what the kit cannot draw well: a door off the straight side or over
  a truck's cut-out, a truck not under a section (or a joint, for a Jacobs bogie or portal), the
  collector off the body, a section too short for its ends. Every combination of every design
  passes it (test/worldTrams.test.ts).

### The shapes

`worldTramShapes.ts` gives the bases a spec starts from, so a design is mostly its sizes, doors,
trucks and colours: `classic` (a high-floor car of the 1950s to 1990s: underside 0.36 m, folding
doors, 700 mm wheels), `lrv` (a high-floor light rail car, plug doors), `lowFloor` (underside
0.22 m, plug doors, 600 mm wheels, a flat roof), `vintage` (a wooden or early steel car: a high
body, a clerestory, swinging doors) and `doubleDeck`; the layout helpers `lay`, `secDoors`,
`bogies`, `jacobs`, `portals`, `guided`, `truck`; the collectors `diamond`, `lowDiamond`, `arm`,
`pole`.

## Triangle budget

A rigid tram - one section, on bogies or a single truck - has at most **10,000 triangles** at
full detail, like a road vehicle; an articulated tram gets **5,000 more for each joint**: 15,000
with one joint, 20,000 with two, 30,000 for a five-section car (`tramTriangleBudget`;
`test/worldTrams.test.ts` and `test/trams.test.ts`, exterior triangles; the interior behind the
doors has its own 2,000, [interiors.md](interiors.md)). Spend the room on the nose first. Every
tram is within them today: the rigid cars up to 9,946, the articulated ones up
to the Citadis 402's 15,914 (of its 40,000).

## The distant model

`worldTramLod` reads the same spec: each section one `fitLod` shell from the same volumes
(`volumeShell`), its cab ends shaped and painted in the cab bands (the windscreen in LOD glass),
its joint ends flat; the windows as bands; the trucks as dark side boxes (a long car's Jacobs
bogies optional); roof boxes optional; the raised collector; the extra's distant part. An
articulated tram keeps the full rig's sections and pivots, with four-sided bellows. The budget
(`tramLodBudget`, the design's `lodTriangles`) is 100 a section up to three sections and 500 for
four or more (a design with a length parameter takes its longest).

## Parameters

- `livery` - operators' colours; a finish parameter only where the liveries share one paint
  stack (the test checks that only the colours differ). The Citadis 402's Dubai livery is wider,
  the Urbos 3's Kaohsiung livery has no pantograph (it runs on supercapacitors), so neither is a
  finish there.
- `length` - the Combino's 3, 5 or 7 sections, the ULF A and B, the Berlin Flexity short and long.
- `unit` - a motor car's trailer (the T4D's B4D, the E1's c4, the T2-62's B2-62) or the steam
  tram's trailer.

## Game properties, OpenTTD and sounds

Each design states its weight, power and top speed from its published data (the trailers and
the steam tram's trailer as variants). Its OpenTTD entry (`openttdTable.ts`, the trams' block) is
a passenger road vehicle on tram track with seats and standing room; its presets export every
livery, length and unit; `pnpm openttd:ids` gave the ids. A tram rings the derived tram bell;
the steam tram's engine whistles and beats (`soundTable.ts`), its trailer is silent. No sound
design fits a cable's hum yet (a request to rail-island-music). The horse tram moved to the
animal-drawn trams ([animal-drawn-vehicles.md](animal-drawn-vehicles.md)).

## Deviations

- **One kit, approximate layouts.** Door counts, truck positions and section lengths follow the
  published lengths and the photographs only roughly; the multi-section cars share their module
  pattern (a cab module and alternate carried and floating modules), which suits the Combino,
  Citadis and Urbos better than the Avenio or Tango, whose every module has a bogie.
- **Doors on the game's kerb side.** A single-ended car opens on the right (+z) only, whatever
  side the real car opens on (Hong Kong's, Japan's and Australia's open on the left).
- **Gauge.** The real gauge is recorded; every tram rides on standard-gauge wheelsets.
- **Collectors at the game's wire.** Every collector reaches the 5.5 m trolley wire. The double-
  deckers' low diamonds stand sunk into the roof; the Blackpool Balloon keeps its historic pole.
- **Kit hint corrections.** The Philadelphia Kawasaki car is the rigid K-car (the list said two
  sections). The Sydney R class is a closed drop-centre saloon, not a cross-bench car. The
  Kolkata two-car set is drawn as two sections joined by a short bellows. The steam tram's
  OpenTTD capacity stands for the engine and its trailer.
- **Simplifications.** Roofs are one grey; the roof fairings are boxes in the body colour (the
  dressed noses' raked); mirrors and wipers only on the ten dressed noses, no fleet numbers; the clerestory is a raised box. The Opicina car's cable
  pusher is only the buffer it leans on.
- **Sizes.** Most figures are from the type's Wikipedia infobox and the operators' data; the
  heights of the historic cars and every door position are read off photographs (approx. in the
  folders' `SOURCES.md`).

## Checking

- `pnpm exec vitest run test/worldTrams.test.ts` - the triangle budgets, sizes, centring, collectors and their clips,
  sections, joints and supports, door sides, LOD budget and glazing, `checkSpec` on every
  combination, the finish liveries, the special rows' parts (about 20 s).
- `pnpm exec vitest run test/worldFleet.test.ts` - the registry, references, OpenTTD entries.
- The covering sample (`FLEET_SWEEP_SAMPLE`, 14 of the 100 trams, the Combino Supra the
  largest) gets the full catalog sweep, doors, interiors and pantograph suites;
  `pnpm build` checks all 100.
- Contact sheets: `pnpm exec tsx generator/contactSheet.ts <out.png> --view 3q|side --cols 5
  --cell 300 <ids...>`.
