# North American freight cars and the San Francisco cable car

**Covers** - the cupola caboose (`proc-vehicle-us-caboose`), the 50 ft boxcar (`proc-vehicle-us-boxcar`), the double-stack well car (`proc-vehicle-us-well-car`) and the San Francisco cable car (`proc-vehicle-sf-cable-car`): measures, parameters, the double-stack gauge, deviations and tests.
**Code** - `generator/usFreight.ts` (`US_FREIGHT`), `generator/usHoodKit.ts` (`paintedSweep`, `knuckleCoupler`), `test/usTransit.test.ts`, `assets/us-caboose/`, `assets/us-boxcar/`, `assets/us-well-car/`, `assets/sf-cable-car/`
**See also** - [us-transit.md](us-transit.md), [loading-gauge.md](loading-gauge.md), [wagons.md](wagons.md), [trams.md](trams.md)

## The designs

| id | title | parameters (default first) | over couplers | triangles |
|---|---|---|---|---|
| `proc-vehicle-us-caboose` | Cupola caboose | `livery`: `santaFe` (red), `unionPacific` (yellow) | 11.10 m | 6,700 / 6,800 |
| `proc-vehicle-us-boxcar` | 50 ft boxcar | `livery`: `boxcarRed`, `railbox` | 16.87 m | 9,300 / 8,200 |
| `proc-vehicle-us-well-car` | Double-stack well car | `cargo`: `single` (default), `empty`, `double` | 19.35 m | 11,000 / 8,700 / 13,300 |
| `proc-vehicle-sf-cable-car` | San Francisco cable car | `livery`: `powell` (Powell Street car), `california` (California Street car) | 8.38 m / 9.22 m | 5,500 / 6,600 |

The freight cars are wagons (`WAGON_CATALOG`) on two freight trucks with knuckle couplers; the
freight cars' liveries are `finishParams` and change no extent (the boxcar's also pick its doors and post pitch). The cable car is a tram (`TRAM_CATALOG`) with no
doors: its grip sections are open (`NO_DOORS` in test/doors.test.ts). Its `livery` picks the line's car,
body and length with it, so it is not a finish parameter.

- **Caboose** - two steel cupola cabooses measured from photographs (assets/us-caboose/SOURCES.md);
  the livery chooses the car as photographed, both 11.1 m over the couplers with the end sills and
  the roof's overhang at +-5.07 m, the side sheets from 0.90 m, on the boxcar's three-piece trucks.
  `santaFe` is Santa Fe Ce-3 999457 (104 px/m): an 8.68 m body to a 3.07 m eave, the cupola offset
  toward the -x end (1.74 m long, 4.35 m high, a two-pane window a side; on its outer end the
  number "457" and a vent), two windows a side, the yellow stripe at 1.8 m, "ATSF" and the number
  in white (the cross herald left out), the roof walk with its cross boards, the roof's overhang
  hooded over the platforms, the end grab irons painted white. `unionPacific` is UP 25687
  (49.8 px/m): an 8.12 m body, the cupola centred (2.48 m long, 4.24 m high, a two-lamp signal on
  each side), three windows a side (the other side the same turned end for end), "UNION PACIFIC"
  and "UP 25687" in red (the shield left out), no roof walk, the roof, railings and ladders red.
  Both: end platforms with three-tread steps at each corner, the end railing with its gate, a door
  with its window in each end wall (UP: a window beside it) and the number over it (Santa Fe),
  a ladder at one corner of each end (the corners turned end for end) rising through the overhang
  with its rails bent over as grab hoops, the brake wheel on the -x end's railing, marker lamps at
  the end walls' upper corners (white ahead, red behind), the round stove pipe (a smoke emitter),
  the side sills, centre sill, reservoir, brake cylinder and a tool box under the right side.
- **Boxcar** - a 1970s 70-ton Plate C car measured from photographs (assets/us-boxcar/SOURCES.md):
  the body 15.7 m long, its eave at 4.42 m and the shallow roof ridge at 15 ft 1 in; seven exterior
  hat-section posts (11 cm out, sloping flanks) each side of the door and the side sill; the diagonal-panel roof (ten panels, seam caps
  across and a raised diagonal in each, chevrons seen from above); improved Dreadnaught ends with six
  broad ribs, the end sill and striker; short side and end ladders at the corners with the sill
  steps; on the B end (-x) the vertical brake wheel, its housing, the brake step and the chain; the
  underframe's centre sill, bolsters, reservoir, AB valve and brake cylinder; its own three-piece
  70-ton trucks (33 in wheels, 5 ft 8 in wheelbase, cast side frames with spring nests, roller
  bearings, bolster and friction wedges). The livery chooses the car as photographed:
  `boxcarRed` is Southern Pacific's Hydra-Cushion car SP 245516 - a 16 ft double sliding door
  (two ribbed leaves locking in the middle, the track reaching both ways), posts 0.775 m apart,
  "SOUTHERN PACIFIC" right of the door, "HYDRA-CUSHION" in yellow, the reporting marks and the
  conspicuity reflectors; `railbox` is RBOX 33646 - a 10 ft single door painted black opening
  toward the right end, posts 0.87 m apart, "rail box" lettering with its outline logo, "next load",
  the red and blue X and "any road". The lettering reads alike on both sides (u from the viewer's
  left) and is repeated on the faces of the posts it crosses. Both liveries keep the same extent.
- **Well car** - a stand-alone 40 ft car of TTX's DTTX 45xxxx series (Gunderson's Husky-Stack
  type) measured from DTTX 455501 side-on at 43.9 px/m (assets/us-well-car/SOURCES.md): 17.7 m over
  the end sills, trucks at 52 ft centres. The side girders are 1.0 m deep plates from 0.2 m above
  the rail to the top chord at 1.25 m (a box section 0.28 m wide with its lip), their bottoms flat
  over 12.3 m and sloping up over 0.8 m to 0.68 m under the end structures; stiffeners inside at the
  floor's seven cross-bearers, X braces in the six bays between them, the container pedestals with
  their locating cones at the 40 ft corners. Each end structure has the well's end wall, the box over
  the truck with its raised cover, perforated walkways across the well's end, across the car's end
  and along the chords, flared container guides at the well's corners, the end ladders whose stiles
  rise above the platform as grab irons, the sill steps and grab irons, the angle cock and hose; the
  B end (-x) carries the brake wheel on its stand, the reservoir and the AB valve. The trucks are the
  boxcar's 70-ton trucks. The car is TTX yellow with DTTX 455501's lettering on both sides alike (u
  from the viewer's left): "40", the reporting marks in their black panel, the red TTX mark with
  "FORWARD THINKING", the data and stencil, the conspicuity reflectors. The cargo is a 40 ft
  high-cube container (12.19 by 2.44 by 2.9 m) in the well (`single`, the default, blue), a second
  on inter-box connectors on it (`double`, oxide red), or none: corrugated sides (0.278 m pitch) and
  blind end, a ribbed roof, the door end at -x with two leaves, hinges and four locking bars with
  their keepers and handles, the eight corner castings with their apertures, the owner's code and
  number (RIXU, valid check digits) and the high-cube stripes. The distant model is the girders' box,
  the container(s) over the well and the trucks. The double stack reaches 6.18 m: this design is held
  to the `usDoubleStack` gauge (3.3 by 6.2 m; [loading-gauge.md](loading-gauge.md)).
- **Cable car** - measured from photographs (assets/sf-cable-car/SOURCES.md; Powell car 5 side-on at
  50.6 px/m). `powell` is the single-ended Powell Street car (27 ft 6 in, car 24): the open grip section
  at the front (+X, 3.0 m), the closed saloon (4.17 m) and the open rear platform (1.2 m) with its brake
  wheel and the folding gate on the left side; it is turned on turntables. `california` is the
  double-ended California Street car (30 ft 3 in, car 55's number): grip sections of 2.6 m at both ends
  of a 3.9 m saloon, a headlamp at each end. Both have: the glazed end over the dash (three windows in
  varnished frames between maroon posts), the dash with its lining, sign, number, advertisement and
  headlamp (Powell: white with the maroon POWELL AND MARKET sign; California: maroon with the cream
  VAN NESS AVE. CALIFORNIA / & MARKET / STREETS scrolls), the black bumper and the cream fender
  (Powell: at the front only); outward-facing slatted benches back to back along each grip section,
  varnished posts from the floor with iron brackets under the eave and white grab poles on brass
  brackets; the grip lever, the wheel and track brake levers and the grip's shank in the slot; the
  saloon's four arched windows a side between cream pilasters, the maroon panel with gold lining, the
  car number and an advertisement frame, the pale blue band with SAN FRANCISCO MUNICIPAL RAILWAY on a
  cream label, the bulkheads' door and windows; the pale blue risers and the running boards on their
  brackets; the cambered lower roof with its thin maroon fascia, the clerestory with its small windows,
  an end window under each hood and the roof lamp; the line's name - Powell: POWELL & MASON STS. on a
  board standing on the roof's edge; California: VAN NESS AVENUE, CALIFORNIA STREET, MARKET STREET on
  the maroon eave letterboards; two small four-wheel trucks (0.54 m wheels, 1.24 m wheelbase) with the
  pine track brakes between the wheels. The distant model keeps the roof and clerestory, the blue band,
  the maroon saloon panel and its varnished window band, the dark open sections and the dash colour.

## Deviations

- The well car rides on the boxcar's 70-ton trucks (33 in wheels, 5 ft 8 in wheelbase), where the
  real car's 100-ton trucks have 36 in wheels and a 5 ft 10 in wheelbase.
- The caboose rides on the boxcar's 70-ton trucks (5 ft 8 in wheelbase; the photographed caboose trucks measure 5 ft 6 in).
- The cable car's grip into the slot is a lever and a shank; its wheels stand on the game's standard gauge (the real cars run on 3 ft 6 in), and the truck centres are estimated (the photographs hide the trucks).

## Checking

`test/usTransit.test.ts` (with the passenger cars): every combination inside its gauge, the
budget, without coplanar faces, at its length on two supports (the cable car's per line); the well
car's stacks against the US and double-stack gauges, single by default; the Powell car's single grip
section, headlamp and rear tail lamp against the California car's two grip sections and headlamps.
