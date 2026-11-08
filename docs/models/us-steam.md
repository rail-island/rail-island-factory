# North American steam locomotives

**Covers** - the four North American steam designs (`proc-vehicle-up-big-boy`, `proc-vehicle-prr-k4s`, `proc-vehicle-nyc-hudson`, `proc-vehicle-american-440`): their specs on the steam kit, the US pilots and couplers, liveries, deviations and tests.
**Code** - `generator/usSteam.ts` (`US_STEAM`, `usSteamSpec`), `generator/steamLoco.ts`, `generator/steamGear.ts`, `test/usSteam.test.ts`, `assets/up-big-boy/`, `assets/prr-k4s/`, `assets/nyc-hudson/`, `assets/american-440/`
**See also** - [steam-locomotives.md](steam-locomotives.md), [loading-gauge.md](loading-gauge.md), [us-diesels.md](us-diesels.md), [openttd-figures.md](openttd-figures.md)

## The designs

| id | title | arrangement | drivers | parameters | triangles (loco / tender) |
|---|---|---|---|---|---|
| `proc-vehicle-up-big-boy` | UP Big Boy | 4-8-8-4, two engines | 68 in | `unit` | 15,900 / 4,500 |
| `proc-vehicle-prr-k4s` | PRR K4s | 4-6-2, Belpaire firebox | 80 in | `unit` | 10,700 / 3,700 |
| `proc-vehicle-nyc-hudson` | NYC J-3a Hudson | 4-6-4, Dreyfuss streamlining | 79 in | `unit` | about 9,000 / 3,800 |
| `proc-vehicle-american-440` | Golden Spike 4-4-0 | 4-4-0 American | 60 in | `unit`, `livery` (`jupiter`, `no119`) | 6,200 / 2,600 |

Each is a `LocoSpec` drawn by `buildLoco` (steamLoco.ts) in source x from the front coupler
face, the locomotive and its tender as the `unit` parameter (`UNIT_PARAM`), animated by the
steam kit's `running` clip (cylinders, rods and Walschaerts valve gear; the 4-4-0 has its
Stephenson gear inside and no outside valve gear). The Big Boy's two engines (`front`,
`rear`) are the articulated arrangement the CSD 636 Mallet uses. Like every long steam
wheelbase its running gear rides turning units the game turns on the track
([steam-locomotives.md](steam-locomotives.md), "On curves"): the four-wheel lead truck
(`bogie0`), the front engine - four drivers, cylinders, rods, valve gear and its frame to
source x 12.0 (`bogie1`), the rear engine (`bogie2`) and the trailing truck (`bogie3`), with
the body resting on the two trucks. The real Big Boy's rear engine is fixed to the boiler; here
it turns too, so its drivers stay on the rails (they stood two studs off them on a 40-stud
curve). The K4s, the Hudson and the 4-4-0 ride their trucks and their engine the same way.
The front pilots reach back to the frames (`pilot`'s `depth`), so no gap shows between the
pilot and the frames behind it. All are on the US loading
gauge: the Big Boy is 3.29 m over its cylinders and 4.93 m high over its sand domes (the real engine is 11 ft 2 in
wide over its cab: narrowed to the gauge's 3.3 m), the others 2.7 - 3.13 m.

US fittings replace the buffer beams (`beams: { front: false, rear: false }`): a pilot at the
front - a slatted plate leaning back from the coupler, or the 4-4-0's V-shaped cowcatcher -
and an AAR knuckle coupler (`knuckleCoupler`, usHoodKit.ts) at both ends of the train; a
drawbar to the tender; the headlight on the smokebox front (the 4-4-0's big oil headlamp
box), the bell, the railroad's name on the tender sides.

## Liveries

- **Big Boy** - black, 4014's graphite smokebox and stack casing, the running board's silver edge, "UNION PACIFIC"
  widely spaced on the tender; 4014 on the cab sides and the number box, X4014 on the number boards.
- **K4s** - Brunswick green, gold lining and "PENNSYLVANIA"; number 1361.
- **J-3a Hudson** - Dreyfuss's light grey with the dark grey band along the running board
  and the tender, the bullet nose with its fin, disc drivers; number 5450.
- **4-4-0** - `jupiter`: Central Pacific's royal blue jacket, maroon cab and tender, red wheels,
  brass, the balloon stack and a wood load (number 60); `no119`: Union Pacific No. 119's black
  jacket, maroon cab, the straight stack and coal.

## The Big Boy's shape

Measured on 4014 and its preserved sisters (`assets/up-big-boy/SOURCES.md`, "Measurements"): 85 ft 3.4 in
over the engine, its axles to the published 72 ft 5.5 in wheelbase, the tender 14.47 m to the
published 132 ft 9.25 in over both, its last axle 117 ft 7 in behind the engine's first.

- **Boiler** - centre 3.2 m; the front ring 1.2 m in radius under the 4.55 m graphite smokebox, a
  conical course from 7.3 to 9.5 m to the rear rings' 1.3 m (drawn over the kit's barrel), into the cab.
- **Top** - the feedwater heater and the two stacks in tandem under one flat-topped casing (3.1 - 6.2 m),
  two long round-topped sand domes (`bbSandDome`) either side of the round steam dome, the safety
  valves, and the turret with the whistle under its angled shield ahead of the cab. The distant model
  draws all three domes (`BB_DOMES`) and gets 200 triangles (`lodTriangles`) for the deck shield and
  the stack casing.
- **Front** - the slotted pilot with its corners cut back, the pilot beam and the deck on it; on the
  deck the louvred shield over the air pumps, the headlight on it on the centre line, the number box on
  its right side, the Union Pacific shield below and left of it (seen from ahead: right); the smokebox door's lighter ring and dogs, the grab rails up to the smokebox and the steps up to the running board; on the
  smokebox's front ring the two number boards turned outward either side of the bell, and the marker
  lamps.
- **Sides** - the running board at 3.15 m along the boiler's widest part, the boiler's lower half and
  the pipes under it: on the right the front engine's flexible pipe down and forward to its cylinders
  under a long pipe, on the left the rear engine's steam pipe down from the smokebox and back to its
  cylinders under a reservoir drum, the front engine's steam pipe and the feedwater pump, the main
  reservoirs over the rear engine, all in a glossy pipe black that reads against the boiler; the firebox's sides
  down to the trailing truck.
- **Cab** - its crown level with the boiler's top (4.6 m), a small window ahead of the big one, 4014
  under it, the ladder at its rear corners.
- **Tender** - flat sides with the top edge rounded and the lower edge tucked in behind a full-depth
  front, the coal space's raised sides with railings, the water hatch, the rear ladders.
- **Drivers** - dark grey discs with six dark Boxpok openings each (the kit's `discOpenings`).
- **Triangles** - the sixteen 68 in disc drivers use the kit's `leanWheels` (their rims, hidden in
  the tyres, left out; 8-sided hubs and crank bosses), about 1,500 triangles spent on the above.

## Deviations

- Wheels are the kit's spoked or disc wheels; the Big Boy's Boxpok drivers are discs with
  openings drawn on them, the Hudson's Scullin drivers plain discs. Air pumps, feedwater heaters and pipework are reduced to
  a few cylinders (the Big Boy's air pumps stand behind their shield, its feedwater heater inside the
  stack casing, its pipes are a few 8-sided rods); the K4s's keystone number plate is a plain plate.
- The Big Boy keeps the kit's smokebox door with its hinge straps and its cylinders' bright covers; it
  has no smoke deflectors (4014 has none); its trailing truck is the kit's truck frame, not the cast
  Delta truck.
- The tenders' lengths are their published lengths over the drawbar end and rear coupler;
  the 4-4-0's tender carries no water hatch or tool boxes.

## Checking

`pnpm exec vitest run test/usSteam.test.ts` (ids, parameters; the published wheel arrangement
and driver diameters; every combination inside the US gauge, 16,000 triangles, without
coplanar faces, a smoke emitter on each locomotive; the distant models; the Big Boy's two
engines, its trucks and engines as four bogies, each engine's motion in its own, animated
within the bogies exactly as on a rigid frame; Jupiter's taller balloon stack);
`test/steamOnCurve.test.ts` checks every wheel on the rails on a curve and the pilots against
the frames. The motion and its posed frames are also checked
by the steam kit's generic tests.
