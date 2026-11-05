# North American steam locomotives

**Covers** - the four North American steam designs (`proc-vehicle-up-big-boy`, `proc-vehicle-prr-k4s`, `proc-vehicle-nyc-hudson`, `proc-vehicle-american-440`): their specs on the steam kit, the US pilots and couplers, liveries, deviations and tests.
**Code** - `generator/usSteam.ts` (`US_STEAM`, `usSteamSpec`), `generator/steamLoco.ts`, `generator/steamGear.ts`, `test/usSteam.test.ts`, `assets/up-big-boy/`, `assets/prr-k4s/`, `assets/nyc-hudson/`, `assets/american-440/`
**See also** - [steam-locomotives.md](steam-locomotives.md), [loading-gauge.md](loading-gauge.md), [us-diesels.md](us-diesels.md), [openttd-figures.md](openttd-figures.md)

## The designs

| id | title | arrangement | drivers | parameters | triangles (loco / tender) |
|---|---|---|---|---|---|
| `proc-vehicle-up-big-boy` | UP Big Boy | 4-8-8-4, two engines | 68 in | `unit` | 16,000 / 4,300 |
| `proc-vehicle-prr-k4s` | PRR K4s | 4-6-2, Belpaire firebox | 80 in | `unit` | 10,700 / 3,700 |
| `proc-vehicle-nyc-hudson` | NYC J-3a Hudson | 4-6-4, Dreyfuss streamlining | 79 in | `unit` | about 9,000 / 3,800 |
| `proc-vehicle-american-440` | Golden Spike 4-4-0 | 4-4-0 American | 60 in | `unit`, `livery` (`jupiter`, `no119`) | 6,200 / 2,600 |

Each is a `LocoSpec` drawn by `buildLoco` (steamLoco.ts) in source x from the front coupler
face, the locomotive and its tender as the `unit` parameter (`UNIT_PARAM`), animated by the
steam kit's `running` clip (cylinders, rods and Walschaerts valve gear; the 4-4-0 has its
Stephenson gear inside and no outside valve gear). The Big Boy's two engines (`front`,
`rear`) are the articulated arrangement the CSD 636 Mallet uses. All are on the US loading
gauge: the Big Boy is 3.29 m over its cylinders and 4.95 m high (the real engine is 11 ft
wide over its cab: narrowed to the gauge's 3.3 m), the others 2.7 - 3.13 m.

US fittings replace the buffer beams (`beams: { front: false, rear: false }`): a pilot at the
front - a slatted plate leaning back from the coupler, or the 4-4-0's V-shaped cowcatcher -
and an AAR knuckle coupler (`knuckleCoupler`, usHoodKit.ts) at both ends of the train; a
drawbar to the tender; the headlight on the smokebox front (the 4-4-0's big oil headlamp
box), the bell, the railroad's name on the tender sides.

## Liveries

- **Big Boy** - black, graphite smokebox, silver lining and "UNION PACIFIC" on the tender; number 4014.
- **K4s** - Brunswick green, gold lining and "PENNSYLVANIA"; number 1361.
- **J-3a Hudson** - Dreyfuss's light grey with the dark grey band along the running board
  and the tender, the bullet nose with its fin, disc drivers; number 5450.
- **4-4-0** - `jupiter`: Central Pacific's royal blue jacket, maroon cab and tender, red wheels,
  brass, the balloon stack and a wood load (number 60); `no119`: Union Pacific No. 119's black
  jacket, maroon cab, the straight stack and coal.

## Deviations

- Wheels are the kit's spoked or disc wheels; the Big Boy's and Hudson's Boxpok and
  Scullin drivers are drawn as discs. Air pumps, feedwater heaters and pipework are reduced to
  a few cylinders; the K4s's keystone number plate is a plain plate.
- The tenders' lengths are their published lengths over the drawbar end and rear coupler;
  the 4-4-0's tender carries no water hatch or tool boxes.

## Checking

`pnpm exec vitest run test/usSteam.test.ts` (ids, parameters; the published wheel arrangement
and driver diameters; every combination inside the US gauge, 16,000 triangles, without
coplanar faces, a smoke emitter on each locomotive; the distant models; the Big Boy's two
engines; Jupiter's taller balloon stack). The motion and its posed frames are also checked
by the steam kit's generic tests.
