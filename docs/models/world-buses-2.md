# World buses 2

**Covers** - the buses from around the world of the later batches, 75 of the list's 100 (European city buses, coaches and double-deckers; bonneted buses, school buses, minibuses and van-based buses; BRT and double-articulated buses; Asian, African, Latin American and Oceanian types; the Havana camello): the kit's additions (the bonnet, the half cab, the raised deck, the minibus shape, three bodies), the camello's tractor and semi-trailer, parameters, game properties, OpenTTD figures and sounds, references, deviations and tests.
**Code** - `generator/worldBuses2.ts`, `generator/worldBuses3.ts`, `generator/worldBuses4.ts`, `generator/worldBusKit.ts` (`Bonnet`, `Deck`, `bonnet`, `deck`, `sectionOf`, `fenderRadius`), `generator/worldBuses.ts` (the four shapes, `worldBusDesign`), `generator/openttdTable.ts`, `generator/soundTable.ts`, `test/worldBuses2.test.ts`, `test/worldFleet.test.ts`
**See also** - [world-buses.md](world-buses.md) (the first batch, the kit and its four shapes), [world-fleet.md](world-fleet.md) (references, data checks, the sweep sample), [buses.md](buses.md) (the shell builder), [vehicle-rig.md](vehicle-rig.md), [doors.md](doors.md), [openttd-figures.md](openttd-figures.md), [sounds.md](sounds.md)

## The designs

All at their real size, in the `bus` group (`BUS_CATALOG`, category `Road vehicles`),
modelled on the photographs in `assets/<references>/` (the folder named like the id without
`veh-`), whose `SOURCES.md` gives the published figures and marks the estimates. **The ids
are stored in saved maps: never rename one.** Sizes are over the body (length x width x roof
crown, pods and poles aside; a bonneted bus's length is to the bumper's face), axles in metres
from the nose, the OpenTTD introduction year and capacity (seats and standing room),
exterior triangles at the defaults. Three modules hold them, a batch each; the shapes
(`lowFloor`, `highFloor`, `coach`, `doubleDeck`) are the first batch's
([world-buses.md](world-buses.md)), the minibus and bonneted shapes are `worldBuses3.ts`'s.

Second batch, `worldBuses2.ts`:

| id | title | kind | size (m) | axles (m from the nose) | doors | OpenTTD year / capacity | triangles |
|---|---|---|---|---|---|---|---|
| `veh-leyland-atlantean` | Leyland Atlantean | double | 9.45 x 2.5 x 4.38 | 2.1 / 7.05 | 1 | 1958 / 78 | 2,958 |
| `veh-bristol-lodekka` | Bristol Lodekka | double | 8.23 x 2.44 x 4.09 | 1.35 / 6.23 | 1 | 1949 / 60 | 3,030 |
| `veh-plaxton-panorama` | Plaxton Panorama Elite | coach | 11 x 2.5 x 3.15 | 2.3 / 8 | 1 | 1968 / 49 | 2,616 |
| `veh-mb-o302` | Mercedes-Benz O 302 | coach | 11 x 2.5 x 3.1 | 2.4 / 8.35 | 1 | 1965 / 50 | 2,652 |
| `veh-man-sl200` | MAN SL 200 | city | 11.05 x 2.5 x 2.95 | 2.6 / 8.2 | 3 | 1973 / 100 | 3,154 |
| `veh-neoplan-cityliner` | Neoplan Cityliner | coach | 12 x 2.5 x 3.55 | 2.65 / 8.65 | 2 | 1971 / 49 | 2,672 |
| `veh-bussing-d2u` | Bussing D2U | double | 9.8 x 2.5 x 4.25 | 2.2 / 7.4 | 2 | 1951 / 100 | 3,246 |
| `veh-cobus-3000` | Cobus 3000 | city | 13.97 x 3 x 3 | 3.2 / 10.5 | 4 | 1999 / 110 | 3,128 |
| `veh-volvo-9700` | Volvo 9700 | coach | 12.3 x 2.55 x 3.55 | 2.75 / 8.95 | 2 | 2001 / 55 | 2,672 |
| `veh-van-hool-a330` | Van Hool A330 | city | 11.97 x 2.5 x 3.05 | 2.65 / 8.55 | 3 | 1995 / 100 | 2,968 |
| `veh-van-hool-astromega` | Van Hool TX Astromega | double | 13.88 x 2.55 x 4 | 2.85 / 9.4 / 10.75 | 2 | 2010 / 80 | 3,699 |
| `veh-vdl-citea` | VDL Citea | city | 12 x 2.55 x 3 | 2.7 / 8.65 | 3 | 2009 / 95 | 2,956 |
| `veh-irisbus-citelis` | Irisbus Citelis | city | 12 x 2.55 x 3 | 2.75 / 8.65 | 3 | 2005 / 100 | 2,944 |
| `veh-heuliez-gx337` | Heuliez GX 337 | city | 12.06 x 2.55 x 3.1 | 2.7 / 8.7 | 3 | 2013 / 100 | 2,944 |
| `veh-renault-pr100` | Renault PR100 | city | 11.4 x 2.5 x 2.92 | 2.5 / 8.2 | 3 | 1971 / 100 | 3,048 |
| `veh-iveco-crossway` | Iveco Crossway | city | 12.1 x 2.55 x 3.18 | 2.7 / 8.75 | 2 | 2006 / 60 | 2,676 |
| `veh-irizar-i8` | Irizar i8 | coach | 13 x 2.55 x 3.7 | 2.75 / 9.3 | 2 | 2014 / 55 | 2,684 |
| `veh-solaris-urbino-12e` | Solaris Urbino 12 Electric | city | 12 x 2.55 x 2.9 | 2.7 / 8.6 | 3 | 2013 / 90 | 2,968 |
| `veh-karosa-sm11` | Karosa SM 11 | city | 11.04 x 2.5 x 2.9 | 2.35 / 7.65 | 3 | 1964 / 100 | 3,000 |
| `veh-sor-nb12` | SOR NB 12 | city | 12 x 2.55 x 3 | 2.8 / 8.7 | 3 | 2010 / 100 | 2,956 |
| `veh-ikarus-55` | Ikarus 55 | coach | 9.5 x 2.5 x 3 | 2 / 6.7 | 1 | 1953 / 41 | 2,564 |
| `veh-laz-695` | LAZ-695 | city | 9.19 x 2.5 x 3 | 2.3 / 6.5 | 2 | 1956 / 67 | 2,871 |
| `veh-liaz-677` | LiAZ-677 | city | 10.53 x 2.5 x 3 | 2.5 / 7.65 | 2 | 1967 / 110 | 2,908 |
| `veh-liaz-5292` | LiAZ-5292 | city | 12 x 2.5 x 2.9 | 2.8 / 8.6 | 3 | 2004 / 108 | 2,956 |
| `veh-ziu-9` | ZiU-9 | city, trolley | 11.83 x 2.5 x 3 | 2.4 / 8.4 | 3 | 1972 / 120 | 3,210 |

Third batch, `worldBuses3.ts`:

| id | title | kind | size (m) | axles (m from the nose) | doors | OpenTTD year / capacity | triangles |
|---|---|---|---|---|---|---|---|
| `veh-aec-routemaster` | AEC Routemaster | double, half cab | 8.38 x 2.44 x 4.38 | 1.15 / 6.28 | 1 | 1956 / 64 | 2,706 |
| `veh-mb-o3500` | Mercedes-Benz O 3500 | city, bonnet | 9.3 x 2.48 x 2.95 | 1.25 / 5.75 | 2 | 1949 / 40 | 2,617 |
| `veh-magirus-saturn` | Magirus-Deutz Saturn II | city, bonnet | 10 x 2.5 x 3 | 1.3 / 6.3 | 2 | 1956 / 45 | 2,661 |
| `veh-vw-t1-samba` | Volkswagen Type 2 Samba | minibus | 4.28 x 1.75 x 1.94 | 0.7 / 3.1 | 1 | 1951 / 8 | 2,328 |
| `veh-chausson-aph` | Chausson APH | city, bonnet | 9.65 x 2.5 x 2.95 | 1.1 / 6 | 2 | 1950 / 60 | 2,545 |
| `veh-jelcz-043` | Jelcz 043 | city | 10.7 x 2.5 x 2.95 | 2.1 / 7.25 | 2 | 1964 / 45 | 3,520 |
| `veh-skoda-706-rto` | Skoda 706 RTO | city | 10.7 x 2.5 x 2.95 | 2.1 / 7.25 | 2 | 1958 / 41 | 3,520 |
| `veh-paz-672` | PAZ-672 | city | 7.15 x 2.44 x 2.95 | 1.5 / 5.1 | 2 | 1967 / 45 | 2,976 |
| `veh-saurer-postbus` | Saurer L4C Postbus | city, bonnet | 10 x 2.4 x 3 | 1.3 / 6 | 2 | 1959 / 37 | 2,585 |
| `veh-gm-new-look` | GM New Look | city | 12.2 x 2.59 x 3.05 | 2.1 / 9.34 | 2 | 1959 / 70 | 3,056 |
| `veh-gm-scenicruiser` | GM Scenicruiser | coach, raised deck | 12.2 x 2.44 x 2.95 (deck 3.4) | 2.3 / 9.25 / 10.45 | 1 | 1954 / 43 | 3,686 |
| `veh-flxible-clipper` | Flxible Clipper | coach | 10.06 x 2.44 x 2.9 | 2.5 / 7.6 | 1 | 1937 / 29 | 2,590 |
| `veh-blue-bird-vision` | Blue Bird Vision | city, bonnet | 11.7 x 2.44 x 3.2 | 1.1 / 7.2 | 1 | 2003 / 72 | 2,938 |
| `veh-thomas-saf-t-liner` | Thomas Saf-T-Liner C2 | city, bonnet | 11.9 x 2.44 x 3.2 | 1.2 / 7.3 | 1 | 2004 / 77 | 2,838 |
| `veh-chicken-bus` | Guatemalan Camioneta | city, bonnet | 10.7 x 2.44 x 3.05 | 1.2 / 6.9 | 1 | 1990 / 70 | 2,767 |
| `veh-toyota-coaster` | Toyota Coaster | minibus | 6.99 x 2.03 x 2.6 | 1.15 / 5.08 | 1 | 1969 / 29 | 2,608 |
| `veh-jeepney` | Philippine Jeepney | city, bonnet | 6.3 x 1.9 x 2.15 | 0.9 / 4.4 | 0 (open rear) | 1950 / 18 | 2,250 |
| `veh-songthaew` | Songthaew | city, bonnet | 5.3 x 1.8 x 2.3 | 0.85 / 3.9 | 0 (open rear) | 1980 / 12 | 1,962 |
| `veh-jingle-bus` | Pakistani Jingle Bus | city, bonnet | 9.5 x 2.45 x 3.2 | 1.3 / 6.3 | 2 | 1970 / 60 | 2,963 |
| `veh-matatu` | Matatu | minibus | 5.38 x 1.88 x 2.29 | 0.85 / 3.96 | 1 | 2000 / 14 | 2,712 |
| `veh-danfo` | Lagos Danfo | minibus | 4.57 x 1.84 x 1.95 | 0.85 / 3.31 | 1 | 1990 / 14 | 2,650 |
| `veh-mb-sprinter-minibus` | Mercedes-Benz Sprinter Minibus | minibus | 7 x 1.99 x 2.77 | 0.95 / 5.28 | 1 | 2006 / 20 | 2,334 |
| `veh-tatra-500-hb` | Tatra 500 HB | city | 10 x 2.5 x 2.9 | 2.1 / 7 | 2 | 1953 / 45 | 2,736 |
| `veh-otokar-kent` | Otokar Kent | city | 12 x 2.55 x 3.15 | 2.75 / 8.65 | 3 | 2008 / 100 | 2,944 |
| `veh-buenos-aires-colectivo` | Buenos Aires Colectivo | city | 10.5 x 2.5 x 3 | 2.2 / 7.4 | 2 | 1990 / 60 | 3,088 |

Fourth batch, `worldBuses4.ts`:

| id | title | kind | size (m) | axles (m from the nose) | doors | OpenTTD year / capacity | triangles |
|---|---|---|---|---|---|---|---|
| `veh-hess-lightram` | Hess lighTram | city, double articulated, trolley | 24.7 x 2.55 x 3.1 | 2.75 / 8.8 / 15.6 / 22.4 | 5 | 2003 / 210 | 5,886 |
| `veh-nova-lfs` | Nova Bus LFS | city | 12.2 x 2.59 x 3.2 | 2.1 / 8.3 | 2 | 1996 / 75 | 2,820 |
| `veh-proterra-catalyst` | Proterra Catalyst | city | 12.8 x 2.59 x 3.35 | 2.4 / 8.9 | 2 | 2014 / 77 | 2,808 |
| `veh-marcopolo-paradiso-dd` | Marcopolo Paradiso G7 1800 DD | double | 15 x 2.6 x 4.1 | 2.75 / 10.3 / 11.7 | 2 | 2009 / 66 | 3,699 |
| `veh-marcopolo-torino` | Marcopolo Torino | city | 12.5 x 2.5 x 3.2 | 2.4 / 8.4 | 3 | 2007 / 80 | 3,170 |
| `veh-curitiba-biarticulado` | Curitiba Biarticulated Bus | city, double articulated | 25 x 2.6 x 3.3 | 2.6 / 8.4 / 15.2 / 22.4 | 4 | 1992 / 270 | 5,797 |
| `veh-transmilenio` | TransMilenio Articulated | city, articulated | 18 x 2.6 x 3.3 | 2.7 / 9.2 / 15.4 | 4 | 2000 / 160 | 4,468 |
| `veh-havana-camello` | Havana Camello | tractor and semi-trailer | 21.3 x 2.5 x 3.75 | 1.1 / 5.0 / 18.4 / 19.7 | 3 (shut) | 1995 / 300 | 2,480 |
| `veh-hino-blue-ribbon` | Hino Blue Ribbon | city | 10.5 x 2.49 x 3.1 | 2.3 / 7.1 | 2 | 1982 / 77 | 2,952 |
| `veh-isuzu-erga` | Isuzu Erga | city | 10.5 x 2.49 x 3.1 | 2.4 / 7.2 | 2 | 2000 / 77 | 2,796 |
| `veh-fuso-aero-queen` | Mitsubishi Fuso Aero Queen | coach | 12 x 2.49 x 3.55 | 2.7 / 8.8 | 1 | 1982 / 55 | 2,524 |
| `veh-hyundai-elec-city` | Hyundai Elec City | city | 11 x 2.49 x 3 | 2.5 / 7.6 | 2 | 2017 / 70 | 2,796 |
| `veh-daewoo-bs106` | Daewoo BS106 | city | 11 x 2.49 x 3.1 | 2.4 / 8 | 2 | 1991 / 70 | 2,952 |
| `veh-yutong-e12` | Yutong E12 | city | 12 x 2.55 x 3 | 2.6 / 8.6 | 2 | 2016 / 80 | 2,808 |
| `veh-king-long-coach` | King Long XMQ6127 | coach | 12 x 2.55 x 3.7 | 2.6 / 8.6 | 2 | 2010 / 53 | 2,672 |
| `veh-dennis-trident-hk` | Dennis Trident | double | 12 x 2.5 x 4.4 | 2.5 / 8.55 / 9.9 | 2 | 1997 / 130 | 3,794 |
| `veh-singapore-double-deck` | MAN A95 | double | 11.97 x 2.55 x 4.2 | 2.6 / 8.3 / 9.65 | 2 | 2015 / 131 | 3,790 |
| `veh-ashok-leyland-viking` | Ashok Leyland Viking | city | 10.5 x 2.5 x 3.1 | 1.9 / 7.1 | 2 | 1980 / 70 | 3,020 |
| `veh-tata-starbus` | Tata Starbus | city | 11 x 2.6 x 3.2 | 2.2 / 7.8 | 2 | 2007 / 70 | 2,884 |
| `veh-cairo-cta-bus` | Cairo Transport Authority Bus | city | 12 x 2.5 x 3.2 | 2.6 / 8.3 | 2 | 2009 / 90 | 3,076 |
| `veh-za-rea-vaya` | Rea Vaya BRT Bus | city, articulated | 18 x 2.55 x 3.3 | 2.7 / 9 / 15.2 | 4 | 2009 / 112 | 4,396 |
| `veh-volgren-optimus` | Volgren Optimus | city | 12.5 x 2.5 x 3.2 | 2.5 / 8.6 | 2 | 2010 / 80 | 2,820 |
| `veh-designline-olymbus` | Designline Olymbus | city | 12 x 2.5 x 3.2 | 2.6 / 8.6 | 2 | 2004 / 70 | 2,820 |
| `veh-sydney-leyland-atlantean` | Sydney PTC Atlantean | double | 9.6 x 2.5 x 4.37 | 2.1 / 7.1 | 2 | 1970 / 85 | 3,004 |
| `veh-kyiv-12` | Kyiv-12 Trolleybus | city, articulated, trolley | 17.7 x 2.5 x 3.1 | 2.5 / 8.3 / 14.6 | 4 | 1993 / 165 | 4,632 |

### Parameters

Every parameter of the batches is a finish (`finishParams`): it changes colours only, never
the geometry, and each non-default value is an OpenTTD preset.

- `livery` (title "Livery"): two operators' colours, the default first, each value's title
  the operator's name, kept verbatim in every language (`text/verbatim.json`): Ribble /
  Glasgow (Atlantean), Bristol Omnibus / Eastern Counties (Lodekka), Wallace Arnold / National
  Express, Bahnbus / Touring (O 302), HHA Hamburg / MVG Muenchen, Cobus / Fraport, Swebus /
  FlixBus, De Lijn / STIB, FlixBus / Megabus, Arriva / Connexxion, RATP / ATM Milano, RATP /
  TCL Lyon (GX 337, PR100), Arriva / OeBB Postbus, Irizar / ALSA, MPK Krakow / BVG, DPP Praha /
  CSAD (SM 11), DPP Praha / DPMB Brno, London Transport / Green Line (Routemaster), CSAD / Cedok
  (706 RTO), TTC / NYCTA, IETT / ESHOT, STM / TTC, Proterra / King County, Cometa / Itapemirim,
  SPTrans / URBS, Toei / Yokohama, Toei / Kyoto City, JR Bus / Nishitetsu, KMB / Citybus, BEST
  / DTC, BMTC / BEST, Transperth / Translink, Red Bus / Metro (the diacritics are in the titles;
  the source spells them as `\u` escapes, ASCII only).
- `colour` (title "Colour"): body colours by their phrasebook names (Red, Blue, Green, Yellow,
  White, Black): the Samba's lower half, the camioneta, the Coaster, the jeepney, the
  songthaew, the jingle bus, the matatu, the Sprinter, the colectivo, the Elec City, the
  BS106, the E12 and the King Long.

Game properties: `weight` (tonnes, empty), `power` (kW), `maxspeed` (km/h), from the
published figures in each `SOURCES.md` (approx. where read from a sister type).

## What the kit adds

### The bonnet

`WorldBusSpec.bonnet` (`Bonnet`) puts a bonnet ahead of a shorter shell: the shell starts
`length` behind the nose, at the windscreen's foot (`worldCitySpec` sets the city bus's nose
there, u still metres from the nose, the axles placed by `u`), and the kit draws ahead of it
(`bonnet` in `worldBusKit.ts`), in the front body's part:

- the **hood**: its side profile (bottom over the tyres, top from `top[0]` at the grille to
  `top[1]` at the windscreen) swept across `half` either side, 2 cm into the shell;
- the **engine** under it, no wider than the tyres' inner paths at full lock;
- a **fender** over each steered wheel: a bent plate arched about the axle, its inside radius
  `fenderRadius(r, w)` = r + w/2 + 6 cm, clear of the tyre's side outline at any lock (a tyre
  turning about its vertical shows a disc shifted by at most half its width), from the hood
  out to the body's side, and its nose down ahead of the tyre;
- the **bumper** and the plate, the **grille** (`grille`), the round **head lamps** and amber
  indicators on the hood's front (on the engine's below the hood's bottom).

The kit refuses a bonnet too short for the front axle (the shell would cut the tyre) or an
axle too near the nose (no room for the fender's nose). The shell's windscreen stands over
the hood; the spec's lamps and grille go onto the bonnet; mirrors are side arms at the shell's
corners. The distant model has the hood and fenders as one box.

`bonnet.halfCab` is a front-engined double-decker's half cab (the AEC Routemaster): the body
above `from` is carried forward over the bonnet to the nose (a convex shell piece of its own
with the main section, its upper deck's front windows and the destination display on its
front), the driver's cab is a box under it on the right with its windscreen and side window,
and the hood covers the left. The distant model has the lower front and the carried body as
two boxes.

### The raised deck

`WorldBusSpec.deck` (`Deck`) is a split-level coach's raised rear deck (the GM Scenicruiser):
a second convex shell standing on the roof from `from` to the tail, 1 cm inside the sides (so
its sides never lie in the main shell's planes), raked at its front, up to `height`, with its
own window runs both sides and its front glass. The distant model has it as a box.

### The minibus shape

`minibus` (`worldBuses3.ts`): a short, narrow body (1.75 to 2.03 m) on small wheels, the floor
at 0.24 to 0.38 m, framed windows, one sliding door on the right with its leaf in the body's
colour, round head lamps, side-arm mirrors, a 45 degree lock. `from` and `rake` set the
front: near upright for a forward-control van (the Samba, the danfo), leaning back for a
modern van (the matatu), a long slope for a van's bonnet running into its windscreen (the
Sprinter, `rake` 1.25). The kit's `kind` is `minibus`.

### Bonneted, BRT and three-bodied buses

- `bonneted` (`worldBuses3.ts`): the high-floor shape behind a `Bonnet`, the windscreen over
  the hood's top, the windows and doors behind the bonnet.
- `brt` (`worldBuses4.ts`): the high-floor shape with its doors' sills at the stations'
  platform height (0.9 to 0.95 m): the cabin's floor is at the sill.
- Three bodies: `bodies` with three ranges (`threeBodies`) makes `section0` to `section2` and
  two bellows joints; the bellows' profile and the 300-triangle distant model come from the
  kit as for two ([world-buses.md](world-buses.md)).

## The Havana camello

`havanaCamello` (`worldBuses4.ts`) is not a `WorldBusSpec`: it is a tractor and its
semi-trailer bus, split at the king pin as the road-vehicle skill's semi-trucks are
(`truck` and `trailer` parts, the trailer's pivot the king pin at 1.30 m on the fifth wheel,
`maxBendDeg` 60):

- the tractor: a cab-over cab high over the steered front wheels, the chassis rails inside
  the tyres' paths at lock, the bumper, the fenders over the driven twin wheels, the fuel
  tank, the fifth wheel;
- the trailer: three convex shell pieces of the kit's section (`sectionOf`), the two humps
  and the low middle the "camel" is named for - the front hump over the tractor (its bottom
  above everything of the tractor, its front corners nearer the king pin than the cab's back),
  the low middle between the axles, the rear hump over the tandem axles - each with its
  window band, the rear with its window and lamps; the middle's three doors on the right are
  drawn shut (the kit cannot cut doors in these pieces; `test/doorsSuite.ts` lists it with the
  open-rear jeepney and songthaew among the passenger vehicles with no door to open).

Its distant model is the semi-truck's (`truckLod`): the cab, the three pieces on the trailer's
section, the wheels, no joint.

## OpenTTD and sounds

Every bus has its entry in `openttdTable.ts` (`pax`: introduction year, capacity, presets: the
default and each other livery or colour) and its ids in `openttdIds.json` (`pnpm
openttd:ids`); capacities are seats plus standing room as the makers state them, marked
approx. where estimated (the camello's 300 is the commonly reported load). In `soundTable.ts`:
the battery buses (Urbino 12 Electric, Proterra Catalyst, Elec City, Yutong E12) and the
lighTram state the inverter engine (`electric-engine-converter`), the ZiU-9 and Kyiv-12
trolleybuses the resistor one; the rest keep the derived bus diesel.

## Deviations

- **Doors on the right**, the game's kerb side, as in the first batch: also for the British,
  Japanese, Hong Kong, Singapore, Indian and Australian buses and for the BRT buses whose
  platform doors are on the left.
- **The Routemaster's rear platform** is an ordinary door near the rear on the right; its real
  open platform is on the left. Its front axle stands 1.15 m behind the nose (the real one a
  little further back) so the half cab fits the fender's clearance.
- **Jelcz 043 and Skoda 706 RTO**: the list's kit hint says bonneted, but the 706 RTO (and the
  Jelcz 043, built under its licence) has a full front over the engine; both are drawn with a
  full, rounded front, their ribbed sides as bands.
- **The jeepney and the songthaew** have no side doors (the passengers board at the open rear,
  which the kit does not draw open) and their open window bays are dark glass.
- **The camello's tractor** is a generic cab-over: the real camellos were pulled by many makes.
- Liveries are one operator's colours as plain bands; no wordmarks, logos, fileteado or truck
  art (the jingle bus and the camioneta's paint are bands of colour).
- Wheelbases, overhangs and heights not published in the sources are read off the photographs
  (approx. in `SOURCES.md`).

## Checking

`pnpm exec vitest run test/worldBuses2.test.ts test/worldFleet.test.ts`: every bus's size,
axles, sections and joints, budgets (exterior 10,000, interior 1,500, the distant model 100 a
section) for its sampled parameter combinations; every bonnet's windscreen on the shell's
front and its fenders clear of the tyre at lock; the half cab's body carried to the nose; the
raised deck's height; the finish parameters changing colours only. The shared vehicle suites
(`test/rig.test.ts` with the camello among the semi-trucks, `test/doors*.test.ts`,
`test/interiors.test.ts`, `test/lod.test.ts`) and the catalog sweep cover the sampled ones
(the Routemaster, the O 3500, the Samba, the Scenicruiser, the lighTram, the biarticulado,
the camello); `pnpm build` checks every one. Render with `pnpm exec tsx
generator/contactSheet.ts <out.png> --cols 5 --cell 300 [--variants] <ids...>`.
