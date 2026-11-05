# Box locomotives in a few measures

**Covers** - `worldLocoSpec`, the compact statement of a box locomotive for the box locomotive kit: its measures, the nose types, the items it lays on the skin, the diesel exhausts, and what it leaves out.
**Code** - `generator/worldLocoKit.ts` (`worldLocoSpec`, `WorldLoco`), `generator/boxLocoKit.ts` (`buildBoxLoco`, `boxLocoLod`, optional `pantograph`, `exhausts`), `generator/deLocos.ts`
**See also** - [mainline-electrics.md](mainline-electrics.md) (the kit), [germany-trains.md](germany-trains.md), [world-steam.md](world-steam.md)

The box locomotive kit (`boxLocoKit.ts`) lofts a shell from three profile tables -
the end's centre line `tip(y)`, the half width `hw(y)` and the end's plan - and lays
windows, grilles, doors, paint, lamps and plates on it. The vlakosimdb transfers read
those tables from native XML; the eight-country families state them with
`worldLocoSpec` from a few measures instead:

| field | meaning |
|---|---|
| `length` | over the buffers; the buffer beam stands 0.62 m inside |
| `W`, `y0`, `roof` | the body's half width, the shell's bottom (the frame's top), the roof's crown |
| `nose` | the end's shape (below) |
| `bogies` | each `[centre, axle offsets, wheel radius]`: two axles draw the kit's bogie, any other count its multi-axle one (a pony axle, a rigid frame of coupled drivers) |
| `pantograph`, `pantographX` | the pantographs at +-x, the rear raised; omitted on a diesel |
| `exhausts` | a diesel's roof stacks (x); the kit draws them with the diesel parts' `exhaust` |
| `room` | the machine room's windows or grilles between the cab doors |
| `palette`, `side`, `end`, `paint`, `endPaint`, `number` | the livery |

## Nose types

- `flat` - upright, the roof's edge rounded (Re 4/4 II, Class 86).
- `raked` - the windscreen leaning back above the waist (BR 120, 101, E 18).
- `streamlined` - rounded in plan and elevation, low at the beam (BR 103, V 200, Re 460).
- `nezCasse` - Paul Arzens's broken nose: the windscreen leaning forward to a visor.
- `bonnets` - a short, lower nose ahead of the cab at each end (`bonnet` long, `hoodTop`
  high): the Class 37 and 55, the Indian and Chinese road diesels.
- `hoods` - a centre cab between lower hoods (a crocodile, the BR 218). The shell has
  one half width per height, so the hoods are as wide as the cab: a deviation each
  family's doc states.

The skin items are the usual ones: two windscreens with wipers, three headlights and
two tail lamps, a cab door and window at each end, number plates on the sides and ends.
A frame of coupled wheels in the middle (the E 18) leaves out the tanks between the
bogies, which would lie on its plates.

## Kit changes

`pantograph` became optional and `exhausts` new. A locomotive that states a
pantograph draws exactly as before: the box locomotives' 19 combinations (CD 180,
DNT 184.5, DB 111, DR 243, OBB 1012 and 1040, Vectron) were hashed before and after
the change, GLB and LOD, and are unchanged.
