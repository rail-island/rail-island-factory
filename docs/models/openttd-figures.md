# OpenTTD figures

**Covers** - every vehicle a GRF can hold, with the OpenTTD facts it states (introduction year, capacity, cargo, rail type), the balance figures the formula derives from them, how many presets the one-click download exports and the formations it offers; which figures are estimates.
**Code** - `generator/openttdTable.ts` (the facts, presets and formations), `generator/openttd.ts` (`deriveBalance`, `catalogOpenttd`)
**See also** - [../site/openttd-export.md](../site/openttd-export.md), [game-properties.md](game-properties.md), [vehicles.md](vehicles.md)

The figures are real-world ones, researched from each design's references and
published data: the year the type entered service and its seats (with standing
room for a metro, a tram or a city bus), a freight vehicle's payload in tonnes
or a tank's in kilolitres. A year marked * is an estimate (`// approx.` in the
table): an unclear first-service year, or a seat count taken from a sister type.
A variant's own figures (a livery's later year, a class's seats) are in the
table's `variants` and not repeated here; nor are the climates (temperate,
sub-arctic and sub-tropical for every vehicle) and the refits.

Costs are the purchase and running cost factors the balance formula gives at the
default variant ([../site/openttd-export.md](../site/openttd-export.md), "The
balance formula"); the CD 163 / 363 states a longer vehicle life of its own.

The table is the state of `generator/openttdTable.ts` when it was written; that
file is the authority.

| Model | Title | OpenTTD type | Year | Capacity | Costs | Presets | Formations |
|---|---|---|---|---|---|---|---|
| `legacy-covered-wagon` | Covered Freight Wagon | train RAIL | 1950* | 25 GOOD | 30 / 8 | 3 | - |
| `legacy-open-wagon` | Vte Open Wagon | train RAIL | 1955* | 30 COAL | 30 / 9 | 1 | - |
| `legacy-heavy-wagon` | Uaaikk Low Loader | train RAIL | 1970* | 150 GOOD | 69 / 24 | 1 | - |
| `ocean-liner` | Ocean Liner | ship | 1930* | 2000 PASS | 255 / 180 | 1 | - |
| `american-truck` | American Truck | road | 1980* | 25 GOOD | 103 / 52 | 1 | - |
| `cd-150` | CD 150 / 151 / ZSR 350 | train ELRL | 1978 | 0 PASS | 148 / 90 | 4 | - |
| `cd-163` | CD 163 / 363 | train ELRL | 1984 | 0 PASS | 131 / 80 | 6 | - |
| `cd-230` | CD 230 / 240 / 340 | train ELRL | 1966 | 0 PASS | 119 / 72 | 5 | - |
| `cd-263` | CD 263 / 371 / 372 | train ELRL | 1984 | 0 PASS | 121 / 71 | 5 | - |
| `csd-classic-green-coach` | CSD Classic Green Coach | train RAIL | 1960 | 54 PASS | 42 / 12 | 2 | - |
| `csd-balm` | CSD Balm | train RAIL | 1928* | 64 PASS | 43 / 13 | 1 | - |
| `csd-bam` | CSD Bam | train RAIL | 1928* | 60 PASS | 40 / 13 | 1 | - |
| `csd-bdmtee` | CSD Bdmtee | train RAIL | 1970 | 48 PASS | 42 / 11 | 1 | - |
| `csd-be31` | CSD Be31 | train RAIL | 1931* | 72 PASS | 42 / 14 | 1 | - |
| `csd-bi20` | CSD Bi20 | train RAIL | 1920* | 50 PASS | 35 / 11 | 1 | - |
| `csd-dsk` | CSD Dsk | train RAIL | 1930* | 20 MAIL | 25 / 8 | 1 | - |
| `bmo-double-deck-coach` | Bmo Double-Deck Coach | train RAIL | 1976 | 126 PASS | 64 / 21 | 3 | - |
| `cd-green-white-coach` | CD Green-White Coach | train RAIL | 1995 | 80 PASS | 51 / 15 | 7 | - |
| `nas-flat-wagon` | Nas Flat Wagon | train RAIL | 1975* | 50 WOOD | 39 / 11 | 1 | - |
| `ua-open-wagon` | Ua Open Wagon | train RAIL | 1970* | 50 COAL | 39 / 11 | 1 | - |
| `eas-open-wagon` | Eas Open Wagon | train RAIL | 1970 | 55 COAL | 37 / 12 | 1 | - |
| `raj-hopper-wagon` | Raj Hopper Wagon | train RAIL | 1980* | 55 COAL | 37 / 12 | 1 | - |
| `rah-tank-wagon` | Rah Tank Wagon | train RAIL | 1975* | 60 OIL_ | 40 / 13 | 1 | - |
| `csd-433-0` | CSD 433.0 | train RAIL | 1909* | 0 PASS | 45 / 20 | 2 | - |
| `csd-456-0` | CSD 456.0 | train RAIL | 1925* | 0 PASS | 79 / 41 | 1 | - |
| `csd-475-1` | CSD 475.1 | train RAIL | 1947 | 0 PASS | 84 / 45 | 2 | with tender |
| `csd-477-0` | CSD 477.0 | train RAIL | 1951 | 0 PASS | 79 / 41 | 1 | - |
| `csd-498-1` | CSD 498.1 | train RAIL | 1954 | 0 PASS | 74 / 34 | 2 | with tender |
| `csd-556-0` | CSD 556.0 | train RAIL | 1951 | 0 PASS | 74 / 40 | 2 | with tender |
| `csd-636` | CSD 636 Mallet | train RAIL | 1921* | 0 PASS | 85 / 52 | 2 | with tender |
| `csd-386` | CSD 386 Streamlined | train RAIL | 1934* | 0 PASS | 70 / 32 | 2 | with tender |
| `csd-m112` | CSD M 112.0 Steam Railcar | train RAIL | 1905* | 40 PASS | 48 / 19 | 1 | - |
| `cd-110` | CD 110 / 111 / 210 | train ELRL | 1971 | 0 PASS | 56 / 26 | 4 | - |
| `cd-130` | CD 123 / 130 | train ELRL | 1977 | 0 PASS | 91 / 51 | 2 | - |
| `cd-140` | CD 140 bobina | train ELRL | 1953 | 0 PASS | 95 / 51 | 1 | - |
| `cd-169` | CD 169 | train ELRL | 2014* | 0 PASS | 152 / 90 | 1 | - |
| `sqns-container-wagon` | Sqns Container Wagon | train RAIL | 2005 | 60 GOOD | 42 / 13 | 1 | - |
| `pao-flat-wagon` | Pao Flat Wagon | train RAIL | 1970* | 50 STEL | 39 / 11 | 1 | - |
| `habis-sliding-wall-wagon` | Habis Sliding-Wall Wagon | train RAIL | 1985 | 60 GOOD | 46 / 13 | 2 | - |
| `hadgs-hopper-wagon` | Hadgs Covered Hopper Wagon | train RAIL | 1975* | 55 GRAI | 40 / 12 | 1 | - |
| `faccs-hopper-wagon` | Faccs Hopper Wagon | train RAIL | 1985* | 55 COAL | 37 / 12 | 2 | - |
| `falls-hopper-wagon` | Falls Hopper Wagon | train RAIL | 1980* | 60 COAL | 39 / 13 | 3 | - |
| `wap-hopper-wagon` | Wap Hopper Wagon | train RAIL | 1960* | 60 COAL | 39 / 13 | 1 | - |
| `cd-180` | CD 180 / 181 / 182 | train ELRL | 1961 | 0 PASS | 108 / 66 | 4 | - |
| `dnt-184-5` | DNT 184.5 | train ELRL | 1967* | 0 PASS | 170 / 114 | 2 | - |
| `db-111` | DB 111 | train ELRL | 1974 | 0 PASS | 121 / 71 | 3 | - |
| `dr-243` | DR 243 / DB 143 / 112 | train ELRL | 1984 | 0 PASS | 137 / 84 | 4 | - |
| `obb-1012` | OBB 1012 | train ELRL | 1996 | 0 PASS | 152 / 90 | 1 | - |
| `obb-1040` | OBB 1040 | train ELRL | 1953 | 0 PASS | 119 / 72 | 1 | - |
| `vectron` | Siemens Vectron | train ELRL | 2011 | 0 PASS | 220 / 138 | 3 | - |
| `cd-704` | CD 704 / CSD T 234.0 | train RAIL | 1988* | 0 PASS | 38 / 15 | 2 | - |
| `cd-710` | CD 710 Rosnicka | train RAIL | 1958 | 0 PASS | 40 / 16 | 1 | - |
| `cd-714` | CD 714 | train RAIL | 1992 | 0 PASS | 64 / 30 | 1 | - |
| `cd-742` | CD 740 / 742 / 743 | train RAIL | 1977 | 0 PASS | 101 / 60 | 3 | - |
| `db-212` | DB V 100 / 212 | train RAIL | 1962 | 0 PASS | 64 / 30 | 3 | - |
| `muv-69` | MUV 69 | train RAIL | 1971* | 6 PASS | 25 / 11 | 1 | - |
| `cistern-semi-truck` | Cistern Semi-Truck | road | 1990* | 30 OIL_ | 96 / 48 | 1 | - |
| `mixer-truck` | Concrete Mixer Truck | road | 1985* | 10 GOOD | 83 / 42 | 1 | - |
| `reefer-semi-truck` | Reefer Semi-Truck | road | 1995* | 25 GOOD | 94 / 47 | 1 | - |
| `tatra-815-tipper` | Tatra 815 Tipper | road | 1983 | 15 COAL | 75 / 38 | 1 | - |
| `praga-rv` | Praga RV | road | 1935 | 2 GOOD | 71 / 35 | 1 | - |
| `mercedes-atego-1224` | Mercedes-Benz Atego 1224 | road | 1998 | 6 GOOD | 72 / 36 | 1 | - |
| `karosa-short` | Karosa Short | road | 1981 | 90 PASS | 70 / 35 | 6 | - |
| `karosa-long` | Karosa Long | road | 1991 | 140 PASS | 91 / 45 | 3 | - |
| `karosa-renault-citybus-12m` | Karosa Renault City Bus 12M | road | 1996 | 100 PASS | 73 / 37 | 1 | - |
| `karosa-renault-citybus-18m` | Karosa Renault City Bus 18M | road | 2001 | 150 PASS | 94 / 47 | 1 | - |
| `mb-citaro` | Mercedes-Benz Citaro | road | 1997 | 100 PASS | 73 / 37 | 1 | - |
| `mb-citaro-blue` | Mercedes-Benz Citaro (blue) | road | 1997 | 100 PASS | 73 / 37 | 1 | - |
| `mb-o345-g` | Mercedes-Benz O 345 G | road | 1994 | 140 PASS | 91 / 45 | 1 | - |
| `solaris-urbino-15` | Solaris Urbino 15 | road | 1999 | 130 PASS | 102 / 51 | 1 | - |
| `bus-1` | Bus 1 | road | 1990* | 80 PASS | 77 / 38 | 1 | - |
| `mcdonnell-douglas-md11` | McDonnell Douglas MD-11 | aircraft | 1990 | 290 PASS | 177 / 113 | 4 | - |
| `boeing-747` | Boeing 747-400 | aircraft | 1989 | 416 PASS | 219 / 138 | 4 | - |
| `airbus-beluga` | Airbus Beluga A300-600ST | aircraft | 1995 | 47 GOOD | 96 / 64 | 1 | - |
| `aero-a10` | Aero A.10 | aircraft | 1922 | 4 PASS | 64 / 34 | 1 | - |
| `airbus-a380` | Airbus A380 | aircraft | 2007 | 555 PASS | 255 / 255 | 6 | - |
| `boeing-737` | Boeing 737-800 | aircraft | 1998 | 189 PASS | 147 / 98 | 6 | - |
| `light-jet` | Light Jet | aircraft | 2000* | 7 PASS | 66 / 36 | 1 | - |
| `small-airplane` | Small Airplane | aircraft | 1960* | 3 PASS | 62 / 32 | 4 | - |
| `cruise-ferry` | Cruise Ferry | ship | 1990* | 2000 PASS | 255 / 160 | 1 | - |
| `hydrofoil-ferry` | Hydrofoil Ferry | ship | 1960* | 150 PASS | 67 / 43 | 1 | - |
| `passenger-ferry` | Passenger Ferry | ship | 1950* | 300 PASS | 78 / 45 | 1 | - |
| `cd-471` | CD 471 CityElefant | train ELRL | 1997 | 92 PASS | 96 / 45 | 5 | 3 cars |
| `cd-680` | CD 680 Pendolino | train ELRL | 2004* | 44 PASS | 101 / 47 | 4 | 7 cars |
| `cd-750` | CD 750 / 753 / 754 Brejlovec | train RAIL | 1992 | 0 PASS | 73 / 37 | 4 | - |
| `cd-749` | CD 749 Bardotka | train RAIL | 1992 | 0 PASS | 68 / 32 | 2 | - |
| `cd-781` | CD 781 Sergej | train RAIL | 1966 | 0 PASS | 77 / 39 | 2 | - |
| `csd-t679-0` | CSD T 679.0 Pomeranc | train RAIL | 1963 | 0 PASS | 77 / 39 | 1 | - |
| `csd-t499` | CSD T 499.0 / CD 759 Kyklop | train RAIL | 1973 | 0 PASS | 123 / 70 | 1 | - |
| `cd-771` | CD 770 / 771 Cmelak | train RAIL | 1968 | 0 PASS | 58 / 25 | 3 | - |
| `emd-gp9` | EMD GP9 | train RAIL | 1954 | 0 PASS | 74 / 36 | 3 | - |
| `emd-sd40-2` | EMD SD40-2 | train RAIL | 1972 | 0 PASS | 97 / 55 | 3 | - |
| `ge-es44ac` | GE ES44AC | train RAIL | 2005 | 0 PASS | 126 / 76 | 3 | - |
| `emd-sd70ace` | EMD SD70ACe | train RAIL | 2004 | 0 PASS | 123 / 74 | 3 | - |
| `emd-f7` | EMD F7 | train RAIL | 1949 | 0 PASS | 72 / 32 | 3 | - |
| `ge-p42dc` | GE P42DC Genesis | train RAIL | 1996 | 0 PASS | 135 / 73 | 3 | - |
| `siemens-alc42` | Siemens ALC-42 Charger | train RAIL | 2022 | 0 PASS | 139 / 73 | 2 | - |
| `prr-gg1` | PRR GG1 | train ELRL | 1935 | 0 PASS | 138 / 79 | 3 | - |
| `amtrak-superliner` | Amtrak Superliner | train RAIL | 1979 | 74 PASS | 51 / 14 | 2 | - |
| `amtrak-acela` | Acela Express | train ELRL | 2000 | 0 PASS | 183 / 102 | 4 | 8 cars |
| `budd-rdc` | Budd RDC | train RAIL | 1949 | 90 PASS | 80 / 33 | 2 | - |
| `pioneer-zephyr` | Pioneer Zephyr | train RAIL | 1934 | 0 PASS | 67 / 19 | 3 | 3 cars |
| `nyc-r160` | NYC Subway R160 | train ELRL | 2005 | 240 PASS | 106 / 57 | 2 | - |
| `cta-5000` | Chicago 'L' 5000-series | train ELRL | 2009 | 110 PASS | 73 / 35 | 1 | - |
| `us-caboose` | Cupola caboose | train RAIL | 1925* | 5 MAIL | 23 / 6 | 2 | - |
| `us-boxcar` | 50 ft boxcar | train RAIL | 1970* | 70 GOOD | 45 / 14 | 2 | - |
| `us-well-car` | Double-stack well car | train RAIL | 1984 | 40 GOOD | 35 / 10 | 3 | - |
| `sf-cable-car` | San Francisco cable car | road | 1888* | 60 PASS | 48 / 24 | 2 | - |
| `up-big-boy` | UP Big Boy | train RAIL | 1941 | 0 PASS | 163 / 104 | 2 | with tender |
| `prr-k4s` | PRR K4s | train RAIL | 1914 | 0 PASS | 112 / 58 | 2 | with tender |
| `nyc-hudson` | NYC J-3a Hudson | train RAIL | 1938 | 0 PASS | 140 / 80 | 2 | with tender |
| `american-440` | Golden Spike 4-4-0 | train RAIL | 1868 | 0 PASS | 45 / 17 | 4 | with tender, No. 119 with tender |
| `tatra-t3` | Tatra T3 | road | 1962 | 110 PASS | 92 / 46 | 3 | - |
| `tatra-t6` | Tatra T6A5 | road | 1991 | 130 PASS | 99 / 50 | 1 | - |
| `tatra-kt8` | Tatra KT8D5 | road | 1986 | 230 PASS | 137 / 68 | 3 | - |
| `tatra-kt4` | Tatra KT4 | road | 1974 | 120 PASS | 80 / 40 | 1 | - |
| `kvag-gt4` | GT4 | road | 1959 | 100 PASS | 73 / 37 | 1 | - |
| `metro-81-71` | Metro 81-71 | train ELRL | 1974 | 160 PASS | 84 / 43 | 2 | 5 cars |
| `cd-451` | CD 451 Zabotlam | train ELRL | 1964 | 80 PASS | 77 / 37 | 3 | 4 cars |
| `cd-460` | CD 460 | train ELRL | 1974 | 64 PASS | 85 / 41 | 4 | 5 cars |
| `cd-470` | CD 470 | train ELRL | 1991 | 110 PASS | 97 / 48 | 2 | 5 cars |
| `cd-810` | CD 810 | train RAIL | 1975 | 55 PASS | 54 / 22 | 4 | - |
| `cd-812` | CD 812 / 912 Esmeralda | train RAIL | 2007 | 45 PASS | 53 / 22 | 2 | with driving trailer |
| `cd-843` | CD 843 / 943 / 043 | train RAIL | 1995 | 64 PASS | 67 / 29 | 4 | 3 cars |
| `csd-m131` | CSD M 131.1 Hurvinek | train RAIL | 1948 | 48 PASS | 52 / 21 | 2 | with trailer |
| `csd-m240` | CSD M 240.0 Singrovka | train RAIL | 1963 | 64 PASS | 56 / 26 | 1 | - |
| `csd-m296` | CSD M 296.1 / CD 853 / 854 | train RAIL | 1981* | 64 PASS | 75 / 33 | 4 | - |
| `db-628` | DB 628 | train RAIL | 1986 | 64 PASS | 67 / 29 | 5 | with n-coaches |
| `jr-kiha40` | JR KiHa 40 | train RAIL | 1977 | 66 PASS | 62 / 26 | 3 | - |
| `dr-vt1816` | DR VT 18.16 Delfin | train RAIL | 1964 | 48 PASS | 82 / 33 | 4 | 4 cars |
| `mav-mdmot` | MAV MDmot | train RAIL | 1966* | 40 PASS | 65 / 28 | 4 | 4 cars |
| `ice-1` | ICE 1 | train ELRL | 1991 | 0 PASS | 255 / 202 | 3 | power cars, 6 coaches |
| `tgv` | TGV | train ELRL | 1981 | 0 PASS | 157 / 75 | 4 | power cars, 6 trailers |
| `shinkansen-0` | Shinkansen 0 series | train ELRL | 1964 | 75 PASS | 101 / 37 | 7 | 8 cars |
| `shinkansen-n700s` | Shinkansen N700S | train ELRL | 2020 | 60 PASS | 126 / 44 | 3 | 8 cars |
| `shinkansen-e5` | Shinkansen E5 / H5 | train ELRL | 2011 | 29 PASS | 121 / 39 | 3 | 8 cars |
| `shinkansen-500` | Shinkansen 500 series | train ELRL | 1997 | 53 PASS | 122 / 42 | 3 | 8 cars |
| `shinkansen-700` | Shinkansen 700 / 923 | train ELRL | 1999 | 65 PASS | 121 / 43 | 3 | 8 cars |
| `shinkansen-e6` | Shinkansen E6 | train ELRL | 2013 | 22 PASS | 120 / 38 | 3 | 8 cars |
| `shinkansen-100` | Shinkansen 100 series | train ELRL | 1985 | 65 PASS | 105 / 39 | 3 | 8 cars |
| `shinkansen-e4` | Shinkansen E4 Max | train ELRL | 1997 | 75 PASS | 108 / 39 | 3 | 8 cars |
| `jr-e235` | JR E235 | train ELRL | 2015 | 40 PASS | 68 / 28 | 3 | 6 cars |
| `jnr-103` | JNR 103 series | train ELRL | 1963 | 48 PASS | 63 / 27 | 3 | 6 cars |
| `odakyu-gse` | Odakyu Romancecar GSE | train ELRL | 2018 | 42 PASS | 62 / 25 | 3 | 6 cars |
| `kintetsu-hinotori` | Kintetsu Hinotori | train ELRL | 2020 | 32 PASS | 62 / 21 | 3 | 6 cars |
| `jr-e259` | JR E259 Narita Express | train ELRL | 2009 | 28 PASS | 67 / 25 | 3 | 6 cars |
| `jnr-485` | JNR 485 series | train ELRL | 1964 | 48 PASS | 68 / 28 | 3 | 6 cars |
| `hankyu-9000` | Hankyu 9000 series | train ELRL | 2006 | 120 PASS | 88 / 42 | 3 | 6 cars |
| `jnr-c62` | JNR C62 | train RAIL | 1948 | 0 PASS | 70 / 34 | 2 | with tender |
| `jnr-d51` | JNR D51 | train RAIL | 1936 | 0 PASS | 61 / 29 | 3 | with tender, Namekuji with tender |
| `jnr-ef66` | JNR EF66 | train ELRL | 1968 | 0 PASS | 140 / 88 | 2 | - |
| `jnr-dd51` | JNR DD51 | train RAIL | 1962 | 0 PASS | 80 / 43 | 2 | - |
| `blue-train-24` | Blue Train 24 series | train RAIL | 1973 | 34 PASS | 32 / 9 | 2 | - |
| `db-ice3` | ICE 3 | train ELRL | 2000 | 50 PASS | 124 / 38 | 3 | 8 cars |
| `db-ice4` | ICE 4 | train ELRL | 2017 | 60 PASS | 106 / 37 | 3 | 8 cars |
| `db-ice-t` | ICE T | train ELRL | 1999 | 45 PASS | 90 / 28 | 3 | 7 cars |
| `db-ice2` | ICE 2 | train ELRL | 1996 | 0 PASS | 196 / 106 | 3 | 7 cars |
| `db-423` | DB 423 | train ELRL | 1998 | 50 PASS | 75 / 30 | 2 | 4 cars |
| `db-642` | DB 642 Desiro | train RAIL | 2000 | 60 PASS | 66 / 26 | 2 | 2 cars |
| `db-650` | RegioShuttle RS1 | train RAIL | 1996 | 71 PASS | 75 / 32 | 2 | - |
| `db-vt98` | Uerdingen railbus VT 98 | train RAIL | 1955 | 56 PASS | 58 / 24 | 2 | - |
| `drg-svt877` | Fliegender Hamburger | train RAIL | 1933 | 51 PASS | 72 / 25 | 2 | 2 cars |
| `db-103` | DB 103 | train ELRL | 1970 | 0 PASS | 246 / 159 | 3 | - |
| `db-101` | DB 101 | train ELRL | 1996 | 0 PASS | 224 / 138 | 2 | - |
| `db-120` | DB 120 | train ELRL | 1979 | 0 PASS | 200 / 122 | 2 | - |
| `drg-e18` | DRG E 18 | train ELRL | 1935 | 0 PASS | 126 / 71 | 1 | - |
| `drg-e94` | DRG E 94 | train ELRL | 1940 | 0 PASS | 121 / 76 | 1 | - |
| `db-v200` | DB V 200 | train RAIL | 1953 | 0 PASS | 89 / 42 | 2 | - |
| `db-218` | DB 218 | train RAIL | 1968 | 0 PASS | 94 / 47 | 3 | - |
| `drg-01` | DRG 01 | train RAIL | 1926 | 0 PASS | 88 / 43 | 2 | with tender |
| `dr-52` | DR 52 | train RAIL | 1942 | 0 PASS | 66 / 34 | 2 | with tender |
| `kpev-p8` | Prussian P 8 | train RAIL | 1906 | 0 PASS | 62 / 27 | 3 | with tender |
| `db-ic-coach` | DB Intercity coach | train RAIL | 1971 | 54 PASS | 48 / 12 | 4 | - |
| `sncf-tgv-m` | TGV M | train ELRL | 2025 | 40 PASS | 119 / 37 | 3 | 8 cars |
| `sncf-z20500` | SNCF Z 20500 | train ELRL | 1988 | 140 PASS | 101 / 47 | 3 | 4 cars |
| `ratp-mi09` | RER MI 09 | train ELRL | 2011 | 100 PASS | 88 / 42 | 2 | 5 cars |
| `sncf-regio2n` | Regio 2N | train ELRL | 2014 | 90 PASS | 87 / 35 | 3 | 4 cars |
| `sncf-regiolis` | Regiolis | train ELRL | 2014 | 60 PASS | 78 / 29 | 3 | 4 cars |
| `sncf-x3800` | SNCF X 3800 Picasso | train RAIL | 1950 | 62 PASS | 66 / 25 | 1 | - |
| `sncf-x73500` | SNCF X 73500 | train RAIL | 1999 | 64 PASS | 77 / 31 | 2 | - |
| `sncf-cc6500` | SNCF CC 6500 | train ELRL | 1969 | 0 PASS | 208 / 128 | 3 | - |
| `sncf-cc40100` | SNCF CC 40100 | train ELRL | 1964 | 0 PASS | 164 / 100 | 1 | - |
| `sncf-bb22200` | SNCF BB 22200 | train ELRL | 1976 | 0 PASS | 161 / 97 | 3 | - |
| `sncf-cc7100` | SNCF CC 7100 | train ELRL | 1952 | 0 PASS | 137 / 80 | 2 | - |
| `sncf-bb9200` | SNCF BB 9200 | train ELRL | 1957 | 0 PASS | 148 / 87 | 2 | - |
| `sncf-bb27000` | SNCF BB 27000 Prima | train ELRL | 2001 | 0 PASS | 153 / 94 | 1 | - |
| `sncf-bb67400` | SNCF BB 67400 | train RAIL | 1969 | 0 PASS | 92 / 45 | 2 | - |
| `sncf-cc72000` | SNCF CC 72000 | train RAIL | 1967 | 0 PASS | 118 / 63 | 2 | - |
| `sncf-241p` | SNCF 241 P | train RAIL | 1948 | 0 PASS | 119 / 70 | 2 | with tender |
| `sncf-141r` | SNCF 141 R | train RAIL | 1945 | 0 PASS | 86 / 47 | 2 | with tender |
| `sncf-corail-coach` | SNCF Corail coach | train RAIL | 1975 | 58 PASS | 49 / 12 | 3 | - |
| `sncf-grand-confort` | SNCF Grand Confort | train RAIL | 1970 | 48 PASS | 46 / 11 | 3 | - |
| `ciwl-car` | Wagons-Lits car | train RAIL | 1929 | 28 PASS | 33 / 9 | 3 | - |
| `ns-mat46` | NS Mat '46 | train ELRL | 1949 | 76 PASS | 70 / 28 | 2 | 2 cars |
| `ns-mat54` | NS Mat '54 Hondekop | train ELRL | 1957 | 64 PASS | 72 / 27 | 3 | 4 cars |
| `ns-plan-v` | NS Plan V | train ELRL | 1966 | 72 PASS | 74 / 28 | 2 | 2 cars |
| `ns-de1` | NS DE-I Blauwe Engel | train RAIL | 1954 | 64 PASS | 68 / 27 | 1 | - |
| `ns-icm` | NS ICM Koploper | train ELRL | 1977 | 64 PASS | 76 / 27 | 3 | 4 cars |
| `ns-virm` | NS VIRM | train ELRL | 1994 | 100 PASS | 85 / 33 | 3 | 6 cars |
| `ns-ddz` | NS DDZ | train ELRL | 1992 | 110 PASS | 86 / 36 | 3 | 4 cars |
| `ns-sgm` | NS SGM Sprinter | train ELRL | 1975 | 76 PASS | 72 / 29 | 3 | 3 cars |
| `ns-slt` | NS SLT | train ELRL | 2009 | 40 PASS | 72 / 24 | 2 | 4 cars |
| `ns-sng` | NS SNG | train ELRL | 2018 | 44 PASS | 72 / 25 | 2 | 4 cars |
| `ns-icng` | NS ICNG | train ELRL | 2023 | 50 PASS | 83 / 26 | 2 | 5 cars |
| `ns-flirt` | NS Flirt | train ELRL | 2016 | 44 PASS | 72 / 25 | 2 | 4 cars |
| `ns-v250` | Fyra V250 | train ELRL | 2012 | 40 PASS | 97 / 30 | 2 | 8 cars |
| `ns-1700` | NS 1600 / 1700 | train ELRL | 1981 | 0 PASS | 166 / 101 | 2 | - |
| `ns-1100` | NS 1100 | train ELRL | 1950 | 0 PASS | 106 / 57 | 2 | - |
| `ns-1300` | NS 1300 | train ELRL | 1952 | 0 PASS | 106 / 57 | 2 | - |
| `ns-1200` | NS 1200 | train ELRL | 1951 | 0 PASS | 109 / 57 | 2 | - |
| `ns-2200` | NS 2200 | train RAIL | 1955 | 0 PASS | 57 / 23 | 2 | - |
| `ns-3700` | NS 3700 | train RAIL | 1910 | 0 PASS | 63 / 28 | 2 | with tender |
| `ns-icr-coach` | NS ICR coach | train RAIL | 1981 | 52 PASS | 43 / 12 | 3 | - |
| `sbb-rae-tee` | SBB RAe TEE II | train ELRL | 1961 | 30 PASS | 74 / 27 | 3 | 6 cars |
| `sbb-roter-pfeil` | SBB Roter Pfeil | train ELRL | 1935 | 70 PASS | 72 / 29 | 1 | - |
| `sbb-icn` | SBB ICN | train ELRL | 2000 | 50 PASS | 91 / 33 | 2 | 7 cars |
| `sbb-giruno` | SBB Giruno | train ELRL | 2019 | 40 PASS | 99 / 32 | 2 | 8 cars |
| `sbb-fv-dosto` | SBB FV-Dosto | train ELRL | 2018 | 90 PASS | 95 / 35 | 2 | 8 cars |
| `sbb-flirt` | SBB FLIRT | train ELRL | 2004 | 50 PASS | 81 / 31 | 2 | 4 cars |
| `sbb-kiss` | SBB KISS | train ELRL | 2012 | 90 PASS | 100 / 45 | 2 | 6 cars |
| `rhb-allegra` | RhB Allegra | train ELRL | 2010 | 40 PASS | 80 / 38 | 2 | 3 cars |
| `sbb-re460` | SBB Re 460 | train ELRL | 1992 | 0 PASS | 219 / 132 | 1 | - |
| `sbb-re420` | SBB Re 4/4 II | train ELRL | 1964 | 0 PASS | 166 / 104 | 2 | - |
| `sbb-re620` | SBB Re 6/6 | train ELRL | 1972 | 0 PASS | 244 / 167 | 2 | - |
| `sbb-ae66` | SBB Ae 6/6 | train ELRL | 1952 | 0 PASS | 153 / 96 | 2 | - |
| `sbb-ce68` | SBB Ce 6/8 II Krokodil | train ELRL | 1919 | 0 PASS | 101 / 64 | 2 | - |
| `sbb-ae814` | SBB Ae 8/14 Landi | train ELRL | 1939 | 0 PASS | 246 / 173 | 1 | - |
| `rhb-ge443` | RhB Ge 4/4 III | train ELRL | 1993 | 0 PASS | 100 / 58 | 1 | - |
| `rhb-ge66` | RhB Ge 6/6 I Krokodil | train ELRL | 1921 | 0 PASS | 51 / 26 | 2 | - |
| `mgb-hge442` | MGB HGe 4/4 II | train ELRL | 1985 | 0 PASS | 86 / 49 | 1 | - |
| `sbb-ew4-coach` | SBB EW IV coach | train RAIL | 1981 | 54 PASS | 48 / 12 | 3 | - |
| `sbb-ic2000` | SBB IC 2000 coach | train RAIL | 1997 | 100 PASS | 63 / 18 | 2 | - |
| `glacier-express` | Glacier Express coach | train RAIL | 2006 | 36 PASS | 31 / 10 | 2 | - |
| `renfe-s100` | AVE S-100 | train ELRL | 1992 | 40 PASS | 118 / 39 | 3 | 8 cars |
| `renfe-s103` | AVE S-103 | train ELRL | 2007 | 40 PASS | 128 / 39 | 2 | 8 cars |
| `renfe-s102` | AVE S-102 Pato | train ELRL | 2005 | 0 PASS | 136 / 50 | 3 | 8 cars |
| `renfe-s106` | Talgo Avril S-106 | train ELRL | 2022 | 30 PASS | 114 / 31 | 3 | 8 cars |
| `renfe-s130` | Alvia S-130 | train ELRL | 2007 | 0 PASS | 130 / 58 | 2 | 8 cars |
| `talgo-iii` | Talgo III | train RAIL | 1964 | 22 PASS | 31 / 8 | 2 | 8 cars |
| `renfe-s120` | Renfe S-120 | train ELRL | 2006 | 60 PASS | 113 / 42 | 3 | 4 cars |
| `renfe-civia` | Renfe Civia | train ELRL | 2003 | 80 PASS | 78 / 34 | 2 | 4 cars |
| `renfe-446` | Renfe 446 | train ELRL | 1989 | 70 PASS | 65 / 27 | 2 | 3 cars |
| `renfe-440` | Renfe 440 | train ELRL | 1974 | 76 PASS | 74 / 28 | 3 | 3 cars |
| `renfe-592` | Renfe 592 | train RAIL | 1981 | 76 PASS | 70 / 28 | 3 | 3 cars |
| `iryo-s109` | Iryo Frecciarossa 1000 | train ELRL | 2022 | 40 PASS | 130 / 39 | 2 | 8 cars |
| `renfe-354` | Renfe 354 Virgen | train RAIL | 1964 | 0 PASS | 106 / 50 | 1 | - |
| `renfe-252` | Renfe 252 | train ELRL | 1991 | 0 PASS | 204 / 122 | 2 | - |
| `renfe-269` | Renfe 269 | train ELRL | 1973 | 0 PASS | 126 / 72 | 2 | - |
| `renfe-277` | Renfe 277 | train ELRL | 1952 | 0 PASS | 110 / 64 | 2 | - |
| `renfe-319` | Renfe 319 | train RAIL | 1965 | 0 PASS | 82 / 40 | 2 | - |
| `renfe-333` | Renfe 333 | train RAIL | 1974 | 0 PASS | 110 / 56 | 2 | - |
| `renfe-141f` | Renfe 141F Mikado | train RAIL | 1953 | 0 PASS | 75 / 39 | 2 | with tender |
| `renfe-242f` | Renfe 242F | train RAIL | 1956 | 0 PASS | 100 / 52 | 2 | with tender |
| `br-hst` | InterCity 125 | train RAIL | 1976 | 0 PASS | 102 / 44 | 3 | 8 cars |
| `br-ic225` | InterCity 225 | train ELRL | 1988 | 0 PASS | 183 / 104 | 3 | 8 cars |
| `br-class-800` | Class 800 IET | train ELRL | 2017 | 60 PASS | 93 / 34 | 3 | 5 cars |
| `br-class-390` | Class 390 Pendolino | train ELRL | 2002 | 40 PASS | 96 / 34 | 3 | 8 cars |
| `eurostar-373` | Eurostar e300 | train ELRL | 1994 | 0 PASS | 118 / 40 | 3 | 8 cars |
| `br-class-158` | Class 158 | train RAIL | 1989 | 70 PASS | 73 / 27 | 2 | 2 cars |
| `br-class-142` | Class 142 Pacer | train RAIL | 1985 | 56 PASS | 62 / 23 | 2 | 2 cars |
| `lu-1938-stock` | London 1938 Stock | train ELRL | 1938 | 100 PASS | 66 / 32 | 2 | 7 cars |
| `br-class-55` | Class 55 Deltic | train RAIL | 1961 | 0 PASS | 114 / 59 | 2 | - |
| `br-class-37` | Class 37 | train RAIL | 1960 | 0 PASS | 82 / 36 | 3 | - |
| `br-class-47` | Class 47 | train RAIL | 1962 | 0 PASS | 99 / 49 | 3 | - |
| `br-class-66` | Class 66 | train RAIL | 1998 | 0 PASS | 104 / 58 | 3 | - |
| `br-class-86` | Class 86 | train ELRL | 1965 | 0 PASS | 127 / 70 | 2 | - |
| `lner-a4` | LNER A4 | train RAIL | 1935 | 0 PASS | 86 / 37 | 3 | with tender |
| `lner-a3` | LNER A3 | train RAIL | 1923 | 0 PASS | 85 / 36 | 3 | with tender |
| `gwr-castle` | GWR Castle | train RAIL | 1923 | 0 PASS | 77 / 32 | 2 | with tender |
| `lms-black-five` | LMS Black Five | train RAIL | 1934 | 0 PASS | 71 / 30 | 2 | with tender |
| `br-9f` | BR 9F | train RAIL | 1954 | 0 PASS | 87 / 40 | 3 | with tender |
| `rocket` | Stephenson's Rocket | train RAIL | 1829 | 0 PASS | 30 / 10 | 2 | with tender |
| `br-mk1-coach` | BR Mk1 coach | train RAIL | 1951 | 64 PASS | 46 / 13 | 4 | - |
| `ir-vande-bharat` | Vande Bharat | train ELRL | 2019 | 44 PASS | 95 / 39 | 3 | 8 cars |
| `ncrtc-namo-bharat` | Namo Bharat | train ELRL | 2023 | 60 PASS | 94 / 38 | 2 | 6 cars |
| `ir-mumbai-emu` | Mumbai suburban EMU | train ELRL | 2007 | 100 PASS | 88 / 45 | 3 | 6 cars |
| `ir-memu` | IR MEMU | train ELRL | 1995 | 90 PASS | 88 / 43 | 3 | 8 cars |
| `dmrc-rs1` | Delhi Metro RS1 | train ELRL | 2002 | 240 PASS | 109 / 60 | 2 | 6 cars |
| `ir-wdm2` | IR WDM-2 | train RAIL | 1962 | 0 PASS | 93 / 49 | 2 | - |
| `ir-wdp4d` | IR WDP-4D | train RAIL | 2010 | 0 PASS | 135 / 76 | 1 | - |
| `ir-wdg4g` | IR WDG-4G | train RAIL | 2018 | 0 PASS | 125 / 78 | 1 | - |
| `ir-wam4` | IR WAM-4 | train ELRL | 1971 | 0 PASS | 112 / 64 | 2 | - |
| `ir-wap4` | IR WAP-4 | train ELRL | 1994 | 0 PASS | 143 / 86 | 2 | - |
| `ir-wap7` | IR WAP-7 / WAG-9 | train ELRL | 2000 | 0 PASS | 161 / 100 | 3 | - |
| `ir-wap5` | IR WAP-5 | train ELRL | 1995 | 0 PASS | 152 / 90 | 2 | - |
| `ir-wag12b` | IR WAG-12B | train ELRL | 2017 | 0 PASS | 255 / 190 | 1 | - |
| `ir-wp` | IR WP | train RAIL | 1947 | 0 PASS | 78 / 39 | 3 | with tender |
| `ir-wg` | IR WG | train RAIL | 1950 | 0 PASS | 76 / 42 | 2 | with tender |
| `eir-fairy-queen` | Fairy Queen | train RAIL | 1855 | 0 PASS | 30 / 12 | 2 | with tender |
| `dhr-b-class` | DHR B class | train RAIL | 1889 | 0 PASS | 28 / 11 | 2 | with tender |
| `ir-lhb-coach` | IR LHB coach | train RAIL | 2000 | 72 PASS | 50 / 14 | 5 | - |
| `ir-icf-coach` | IR ICF coach | train RAIL | 1955 | 72 PASS | 45 / 14 | 3 | - |
| `ir-boxn-wagon` | IR BOXN / BCNA wagon | train RAIL | 1981 | 58 COAL | 39 / 12 | 2 | - |
| `cr-c70-wagon` | CR C70 / P70 wagon | train RAIL | 2006 | 70 COAL | 45 / 14 | 2 | - |
| `cr-cr400af` | Fuxing CR400AF | train ELRL | 2017 | 40 PASS | 131 / 42 | 3 | 8 cars |
| `cr-cr400bf` | Fuxing CR400BF | train ELRL | 2017 | 40 PASS | 131 / 42 | 3 | 8 cars |
| `cr-crh380a` | CRH380A | train ELRL | 2010 | 40 PASS | 130 / 41 | 2 | 8 cars |
| `cr-crh2a` | CRH2A | train ELRL | 2007 | 50 PASS | 109 / 39 | 2 | 8 cars |
| `cr-crh3c` | CRH3C | train ELRL | 2008 | 40 PASS | 128 / 39 | 2 | 8 cars |
| `cr-crh5a` | CRH5A | train ELRL | 2007 | 50 PASS | 110 / 40 | 2 | 8 cars |
| `cr-cr200j` | Fuxing CR200J | train ELRL | 2019 | 0 PASS | 192 / 122 | 3 | 8 cars |
| `cr-crh6a` | CRH6A | train ELRL | 2014 | 60 PASS | 90 / 32 | 2 | 8 cars |
| `cr-hxn5` | CR HXN5 | train RAIL | 2008 | 0 PASS | 161 / 103 | 1 | - |
| `cr-hxd1` | CR HXD1 | train ELRL | 2006 | 0 PASS | 255 / 202 | 1 | - |
| `cr-hxd3d` | CR HXD3D | train ELRL | 2013 | 0 PASS | 232 / 154 | 1 | - |
| `cr-ss1` | CR SS1 Shaoshan | train ELRL | 1958 | 0 PASS | 134 / 86 | 1 | - |
| `cr-ss8` | CR SS8 Shaoshan | train ELRL | 1997 | 0 PASS | 144 / 82 | 1 | - |
| `cr-df4` | CR DF4 Dongfeng | train RAIL | 1969 | 0 PASS | 90 / 50 | 2 | - |
| `cr-df11` | CR DF11 Dongfeng | train RAIL | 1992 | 0 PASS | 130 / 71 | 1 | - |
| `cr-qj` | CR QJ | train RAIL | 1956 | 0 PASS | 91 / 54 | 2 | with tender |
| `cr-sy` | CR SY | train RAIL | 1960 | 0 PASS | 64 / 32 | 2 | with tender |
| `cr-js` | CR JS | train RAIL | 1957 | 0 PASS | 75 / 40 | 2 | with tender |
| `cr-25t-coach` | CR 25-series coach | train RAIL | 1999 | 36 PASS | 38 / 10 | 3 | - |
| `mtr-m-train` | MTR M-Train | train ELRL | 1979 | 230 PASS | 102 / 55 | 6 | 8 cars |
| `tgv-duplex` | TGV Duplex | train ELRL | 1996 | 0 PASS | 194 / 98 | 7 | power cars, 8 trailers |
| `cd-y-coach` | CD Y Coach | train RAIL | 1970* | 54 PASS | 42 / 12 | 4 | - |
| `zsr-coach` | ZSR Coach | train RAIL | 1993 | 80 PASS | 51 / 15 | 7 | - |
| `uic-z-coach` | UIC-Z Coach | train RAIL | 1980 | 66 PASS | 52 / 13 | 7 | - |
| `db-dosto` | DB Regio Double-Deck Coach | train RAIL | 1994 | 126 PASS | 64 / 21 | 3 | 3 coaches, driving trailer |
| `dr-sbahn-berlin` | DR Double-Deck Coach (Berlin S-Bahn livery) | train RAIL | 1974* | 126 PASS | 64 / 21 | 2 | 4 coaches, driving trailer |
