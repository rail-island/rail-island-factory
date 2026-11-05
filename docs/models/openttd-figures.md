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
| `mtr-m-train` | MTR M-Train | train ELRL | 1979 | 230 PASS | 102 / 55 | 6 | 8 cars |
| `tgv-duplex` | TGV Duplex | train ELRL | 1996 | 0 PASS | 194 / 98 | 7 | power cars, 8 trailers |
| `cd-y-coach` | CD Y Coach | train RAIL | 1970* | 54 PASS | 42 / 12 | 4 | - |
| `zsr-coach` | ZSR Coach | train RAIL | 1993 | 80 PASS | 51 / 15 | 7 | - |
| `uic-z-coach` | UIC-Z Coach | train RAIL | 1980 | 66 PASS | 52 / 13 | 7 | - |
| `db-dosto` | DB Regio Double-Deck Coach | train RAIL | 1994 | 126 PASS | 64 / 21 | 3 | 3 coaches, driving trailer |
| `dr-sbahn-berlin` | DR Double-Deck Coach (Berlin S-Bahn livery) | train RAIL | 1974* | 126 PASS | 64 / 21 | 2 | 4 coaches, driving trailer |
