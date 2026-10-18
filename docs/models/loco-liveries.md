# Locomotive liveries

**Covers** - the parametric electric locomotives: `veh-cd-150` (CD 150, CD 151, ZSR 350), `veh-cd-163` (CD 162, 163, 362, 363) and `veh-cd-263` (CD 263, 371, 372, DB 180) as `livery` values, the livery model (colour bands, cab paint, emblems, running numbers), the CD 263's own machine room, the native BMP evidence, deviations and tests.
**Code** - `generator/cd163.ts` (`Cd163Livery`, `Band`, `bandAt`, `bandPieces`, `splitHeights`, `runningNumber`, `cd163Body`, `cabPaint`, `grillesAndWindows`), `generator/cd163Family.ts` (`CD163_LIVERIES`, `CD263_LIVERIES`, `cd163`, `cd263`), `generator/cd150.ts` (`CD150_LIVERIES`, `CD150_PARAMS`), `generator/vehicles.ts`, `test/cd163Family.test.ts`, `assets/cd-163/native/liveries/`, `assets/cd-263/`, `assets/cd-150/native/liveries/`
**See also** - [vehicles.md](vehicles.md) (the CD 150 and CD 163 bodies), [cd-230.md](cd-230.md) (the laminatka), [parameters.md](parameters.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md), [the vlakosimdb-transfer skill](../../.agents/skills/vlakosimdb-transfer/SKILL.md)

## The idea

vlakosimdb holds many locomotives that share a body and differ in paint: the
CD 163 comes as 162, 163, 362 and 363 in green, turquoise, blue, silver and red;
the CD 151 and the ZSR 350 are drawn on the same body as the CD 150. Following
the parametric-model rule (variants of one body are one design,
[parameters.md](parameters.md)), each body is one design with a `livery` enum.
The CD 263, 371 and 372 share the 163's body and cabs but not its machine room,
so they are a design of their own built by the same code. The DB 180 is the
372 under its German number (DR 230, Skoda 66E): vlakosimdb's `db_180` and
`db ag_180` draw the 372's body, grilles and windows, so they are two more
`veh-cd-263` liveries (`db180`, `dbAg180`; red or orient red with a white line
at 1.7 to 1.8 m, no CD emblems, illustrative units 180 008 and 180 014 - the
DB scheme's check digit is the same as the CSD one).

| design | title | `livery` values (default first) | triangles |
|---|---|---|---|
| `veh-cd-163` | CD 163 / 363 | `cd163`, `cd162`, `cd162No022`, `cd163No022`, `cd163No021`, `cd362`, `cd362No054`, `cd363`, `cd363No044`, `cd363No037`, `cd363No009` | 15,300 to 16,000 |
| `veh-cd-263` | CD 263 / 371 / 372 | `cd263`, `cd263No015`, `cd371No002`, `cd371No005`, `cd372`, `db180`, `dbAg180` | 14,800 to 15,500 |
| `veh-cd-230` | CD 230 / 240 / 340 | `cd230`, `cd240`, `cd240No047`, `cd340`, `cd242` - its own body and livery model, see [cd-230.md](cd-230.md) | 15,600 to 15,900 |
| `veh-cd-150` | CD 150 / 151 / ZSR 350 | `cd150`, `cd151`, `cd151Cez`, `zsr350`, `zsr350No001` ... `zsr350No004` | 12,100 to 12,600 |

A value names its vlakosimdb model: `cd363No044` is `cd_363.044`, `zsr350No001`
is `zsr_350_001`; a value without a serial (`cd362`, `zsr350`) is the class's
generic model. The picker titles (`CD163_LIVERIES[...].title`) carry the number
and the paint. The defaults are the shipped models: their GLBs are byte for byte
what they were before the liveries existed (the 263 is new).

## The livery model

A livery (`Cd163Livery`, `Cd150Livery`) is data, not code:

- **`bands`** - the body's colour bands from the bottom of the body (1.03 m on
  the 163, 1.2 m on the 150) to the eave (3.7 m), low first, as
  `[y0, y1, material, ribMaterial?]`. The shell is lofted once per interval
  between the profile's kinks (the apron and the nose) and the band edges
  (`splitHeights`), so a band edge needs no geometry of its own. The pressed ribs
  take their band's material (the CD 150's cream band names its darker `rib`).
- **`cabBands`** (optional) - the cab sections' own bands, where a livery paints
  the cabs differently (the 363 037's silver cab ends, the ZSR 350's yellow cab
  stripes). `cabPaint` lays them as a one-sided skin 3 mm off the shell over
  both cab sides (from x = 6.07 m on the 163, 5.85 m on the 150), the corner
  chamfers and the end, split at the same kinks; on the 163 it stops 10 mm under
  the grey side apron so the two never share a plane. The cab doors and the ribs
  under the cab windows follow the cab bands.
- **`palette`** - materials added to the base palette (`blue`, `cream`, `red`,
  `silver`, ...) or replacing one (`roof` for the light grey roofs of the later
  repaints, `pantograph` for the 363 037's red collectors, `logo` for a white
  emblem on dark paint).
- **`frame`** - the 163 family's windscreen frame material.
- **`sideEmblem`, `frontEmblem`** - whether the CD monogram is painted (the 362
  carries none, the 362 054 only on the ends, the ZSR 350 none).
- **`number`** - the running number on every plate, built by
  `runningNumber(class, serial)` with its check digit
  ([vehicles.md](vehicles.md), "Running numbers"). A vlakosimdb model named by a
  serial gets that serial; a generic one an illustrative unit of the class
  (`numberSource` says which).

The track clearers, steps, hoses and warning parts keep the base `yellow`; a
livery's band uses its own material, so a cream or white band does not repaint
them.

## Reading the native BMPs

Each livery is read from its vlakosimdb side BMPs, kept unchanged under
`assets/cd-163/native/liveries/<model>/`, `assets/cd-263/native/<model>/` and
`assets/cd-150/native/liveries/<model>/` (from `janproch/vlakosimdb` commit
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`). The XML colorize maps a 170 by 60
pixel side onto 17 by 6 m: row r spans 6.0 - (r + 1) / 10 to 6.0 - r / 10 m,
column c sits at x = c / 10 - 8.5 m. `cd_163.022` is the exception: 169 by 57
pixels onto 16.9 by 6.1 m (0.107 m rows). The band rows are read in a clear
machine-room column (60 on the 163 family, 62 on the 150) and the cab rows in
column 8 (10 on the 150); the comment above each livery lists the rows. Colours
are the native ones toned down the way the shipped default's were (the native
`#005100`/`#003000` stripes became `#245b42`).

## The CD 263 machine room

`cd163Body(livery, layout)` builds the 163's body, cabs, roof equipment and
running gear for every layout; only the machine room's sides differ.
`"163"` is the shipped 163: four portholes on the right (+z, `z_dec`) and 88-slat
intake shutters on the left. `"263"` and `"371"` (`grillesAndWindows`) follow
`cd_263`:

- right (+z, `z_dec`): two grille banks at x = -5.6..-2.5 and 2.4..5.5 m, three
  rows each (1.9-2.3, 2.4-2.8, 2.9-3.3 m), every row two panels of a grey housing,
  a dark louvre and three slats; the emblem moves beside the number plate
  (x = -1.85 m) between the banks;
- left (-z, `z_inc`): two square windows (x = -4.5..-3.5 and 3.4..4.4 m,
  2.5-3.2 m) and two divided ones (x = -1.8..-0.8 and 0.7..1.7 m, panes
  2.5-2.8 and 2.9-3.1 m);
- `"371"` (`cd371No005` only): four equal windows, 0.8 m wide, 2.5-3.1 m, as
  `cd_371.005` draws them.

`cd_371_002` draws its grilles on `z_inc` and its windows on `z_dec`; the
design keeps one arrangement for the whole family, the grilles on the right.

## Deviations

- The CD 151 and the ZSR 350 are drawn on the CD 150's body (vlakosimdb draws
  them that way too); the real 66E and 55E differ in detail.
- The 151 CEZ advertising artwork (the lightning and the lettering) is not
  modelled: the livery is the plain blue.
- One-pixel lines are left out where the triangle budget would not allow them
  (the 363 037's navy line at the top of the machine room, its dark grey bottom
  row on the cabs) or where they are too thin to matter.
- `cd_163.022` draws portholes on both sides; the model keeps the 163's shutters.
- The DB 180 liveries carry no DB emblem (the native "keks" is two pixels).
- `cd_363_009` sits among the 263s in the webapp's list, but its BMPs show the
  163 body (portholes, shutters), so it is a `veh-cd-163` livery.
- The 162 and 163 (and the 362 and 363) share the same native side BMPs; their
  liveries differ in number, roof and windscreen frame only.

## Tests

`test/cd163Family.test.ts`: every number has a valid check digit and no two
liveries share one; the defaults build the shipped models; for every livery the
material nearest to each native pixel of its machine-room column (and of its
cab column where it has cab bands) is the band the model paints at that height,
with at most one row off (a shaded rib or the 0.107 m rows of `cd_163.022`); the
263's grilles, windows and the 371 005's four windows sit where the native BMP
has them; every livery of the three designs stays within 16,000 triangles.
The catalog sweep (`test/catalogSweep.ts`) builds the defaults and a fixed sample of the other combinations (every one with `TEST_ALL_VARIANTS=1`, [../guide/setup-and-build.md](../guide/setup-and-build.md)) for determinism, z-fighting, the rail
envelope and the JS model.
