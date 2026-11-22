# Plaza landmarks

**Covers** - the monuments and civic buildings made for a settlement's main square (first batch: Plague Column, Bandstand, Arc de Triomphe, Prague Old Town Hall, Parthenon, Temple of Heaven): their plaza rules, triangle tiers, what each reproduces and where it departs from the real one.
**Code** - `generator/plazaLandmarks.ts` (index, tiers), `generator/plazaCatalog.ts`, `generator/plazaPlagueColumn.ts`, `generator/plazaBandstand.ts`, `generator/plazaArcDeTriomphe.ts`, `generator/plazaPragueOldTownHall.ts`, `generator/plazaParthenon.ts`, `generator/plazaTempleOfHeaven.ts`, `test/plazaLandmarks.test.ts`, `assets/<name>/`
**See also** - [landmarks.md](landmarks.md) (the older secular landmarks), [game-properties.md](game-properties.md) (`plaza`), [historical.md](historical.md), [lod.md](lod.md), [../site/workshop.md](../site/workshop.md)

## The family

Each landmark has its own module, so its standalone JS bundles only its own geometry;
`plazaLandmarks.ts` lists the modules (`PLAZA_FAMILIES`, registered in `generate.ts`), all
the designs (`PLAZA_LANDMARKS`) and each one's triangle tier (`PLAZA_TIERS`). All share
`PLAZA_CATALOG`: category `Historical`, city pool `hist_center`, `defaultScale` 1, CC0 by
Rail Island. They have no parameters.

All are modelled in metres, +Y up, base at y = 0, centred on the origin. They are
**drafts** (workshop) until the user confirms them into `generator/catalogModels.json`.

| id | title | plaza rule | size x / y / z (m) | triangles | LOD | photos |
|---|---|---|---|---|---|---|
| `bld-plague-column` | Plague Column | village, town | 10.6 / 17.2 / 10.6 | 8,410 | 376 | `assets/plague-column/` |
| `bld-bandstand` | Bandstand | village, town | 9.6 / 8.7 / 10.9 | 9,804 | 308 | `assets/bandstand/` |
| `bld-arc-de-triomphe` | Arc de Triomphe | city; radial, round | 48.0 / 50.0 / 30.4 | 26,418 | 348 | `assets/arc-de-triomphe/` |
| `bld-prague-old-town-hall` | Prague Old Town Hall | town, city; rect, footprint | 56.7 / 69.5 / 22.6 | 23,336 | 240 | `assets/prague-old-town-hall/` |
| `bld-parthenon` | Parthenon | city; rect, footprint | 72.3 / 20.8 / 33.7 | 26,270 | 444 | `assets/parthenon/` |
| `bld-temple-of-heaven` | Temple of Heaven | town, city; radial, round | 69.8 / 44.0 / 69.8 | 29,288 | 418 | `assets/temple-of-heaven/` |

Tiers (the building skill): the two small monuments 4,000-10,000 triangles, the four
large landmarks 20,000-30,000; every LOD 101-500 triangles, no windows, the full model's
height and plan. `test/plazaLandmarks.test.ts` checks the tiers, the ground, at most 12
materials, determinism, coplanar overlaps, degenerate triangles, the LODs, the plaza rule,
the committed references and that the designs are still drafts.

## Plague Column

A generic central European baroque Marian / plague column, a composite of Kremnica, Zwettl,
Prague and Munich (not a copy of Olomouc's 35 m column).

- A three-step octagonal base (10.6 m across flats, platform at 0.54 m) and an octagonal
  balustrade of vase balusters with corner posts and ball finials, open at the front (+Z).
- Four 2.0 m saints on moulded pedestals on the diagonal sides, facing out (staff and cross,
  raised arms, open arms, praying).
- The central pedestal: socle, a chamfered die with framed oval cartouches (a gilt
  inscription plate at the front, relief bosses elsewhere), corner console scrolls, a
  cornice carrying four smaller saints, an upper stage and the column's plinth.
- A 16-sided tapering shaft wreathed by a spiralling cloud mass with cherub heads; a
  Corinthian capital (abacus at 14.42 m); a cloud globe with a gilt crescent and the 2.3 m
  gilded Immaculata with a ring of 12 gilt stars (top 17.23 m).
- Deviations: simple robed figures, a horizontal star ring for the halo, no fountain basin,
  no gate in the balustrade opening.

## Bandstand

A Victorian cast-iron bandstand mixing Eastleigh's green ironwork and cream spandrels with
the red roofs of Sefton Park and Horniman Gardens.

- A 1.2 m octagonal red-brick plinth (9.9 m across corners) with a stone base course,
  coping, corner piers and vent grilles; a timber deck; five stone steps on +Z between
  sloping cheeks with iron handrails.
- Eight dark green cast-iron columns (pedestal, flared base, octagonal shaft, cream collars
  and capital) with eaves brackets; a lacy railing (three rails, balusters every 0.19 m, a
  diamond row) in every bay but the steps'.
- Arched cream spandrels with scrolls and drops, a fascia, soffit and a dagger-board
  valance; an ogee bell roof lofted from 13 octagonal rings, red-oxide with cream rolled
  hips; a finial with gilt ball, compass arms and weather vane.
- Deviations: columns a little thicker than real (legible from the game camera),
  simplified lace, no lettering on the vane, a bare deck.

## Arc de Triomphe

The long axis is X; the main arch passes along Z with the Champs-Elysees face at +Z; the
transverse arches pass along X through the piers. 45 x 22 m walls, 50 m high; the
sculpture groups stand out about 4 m from the main faces.

- Four piers with real open barrel vaults: the main arch 29.19 x 14.62 m, the transverse
  arches 18.68 x 8.44 m. Coffered soffits (96 coffers in the main vault, 56 in each
  transverse one) with real depth and rosettes; socle, impost bands, archivolts, keystones
  and the generals' name tablets.
- The four sculpture groups on stepped pedestals (Depart de 1792 and Triomphe de 1810 on
  +Z, Resistance and Paix on -Z), six framed high-relief panels and the spandrel Victories.
- The entablature with the grand frieze, modillions and a 0.9 m corona; the attic with 30
  round shields, its cornice, the roof terrace, parapet and stair house; the Tomb of the
  Unknown Soldier under the arch.
- Deviations: figures are stylised low-poly masses, frieze scenes generic, coffers as
  pyramids, panel and attic heights estimated (about +-1 m).

## Prague Old Town Hall

The square faces +Z; the tower stands at the +X end of the row of houses. The surviving
complex only (the east wing destroyed in 1945 is left out).

- The 11.5 m square Gothic tower to 69.5 m: buttresses, lancet windows, clock dials on
  three faces, a blind-arch frieze, the projecting gallery with openwork parapet, four
  corbelled corner turrets with slate spires and the steep roof with dormers and gilt
  finials.
- The Orloj on the tower's south face: the astronomical dial (raised rings, zodiac ring,
  sun, moon and star hands), the calendar dial, the Gothic frame, eight flanking statues,
  the apostle windows, the cockerel niche and the canopy.
- The chapel oriel on the east face under its octagonal spire.
- West of the tower: the Kriz house (the great Renaissance window and its "Praga caput
  regni" band), the Mikes house, the House at the Rooster (front gable with the gilt
  rooster) and the House at the Minute (sgraffito panels, a see-through ground arcade).
- Deviations: lettering, sgraffito, tracery and heraldry are reduced to panels and blocks;
  the canopy is a six-segment bell; the Orloj sits 1.2 m east of the tower face's middle.

## Parthenon

Shown complete, as built (like the Nashville replica), so it reads as a temple on a city
square. The long axis is X; the east front faces +X.

- A three-step crepidoma and the 69.5 x 30.9 m stylobate; 8 x 17 fluted Doric columns
  (10.43 m, 20 flutes, entasis, contracted corner bays).
- The entablature: architrave, triglyphs (painted dark blue) and metopes with two-figure
  reliefs, mutules and the cornice; low pediments with the east and west sculpture groups
  on blue tympana; a tiled roof with cover-tile ribs, antefixes and acroteria.
- The cella with six-column porches at both ends, the Ionic frieze band and bronze doors.
- Deviations: the apex at about 19.6 m (real about 18.8 m); no curvature beyond entasis;
  schematic sculpture; a solid cella and flat ceiling; the painted triglyphs, tympana and
  frieze follow ancient polychromy.

## Temple of Heaven

The Hall of Prayer for Good Harvests on the Altar of Prayer for Grain; the main stairs
face +Z (south).

- Three round white-marble tiers of 2 m each with copings and balustrades (posts with
  rounded heads and panels), stairs on four axes and the carved dragon ramp between the
  south and north flights.
- The hall: 12 red lacquered columns on a 30 m circle, recessed lattice doors (the south
  one open into a dark recess), painted beams, three courses of bracket sets, three round
  blue-tiled roofs with upturned eaves and real tile ribs, the name board and the gilded
  finial at 44 m.
- Deviations: the terraces are reduced to 63 / 53 / 43 m across (real lowest about 90 m)
  to fit a square; doors are framed panels; no drain spouts or incense burners.
