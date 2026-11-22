# Plaza landmarks

**Covers** - the monuments and civic buildings made for a settlement's main square (first batch: Plague Column, Bandstand, Arc de Triomphe, Prague Old Town Hall, Parthenon, Temple of Heaven; second batch: War Memorial, Equestrian Statue, Leaning Tower of Pisa, Krakow Cloth Hall, Nelson's Column, Atomium): their plaza rules, triangle tiers, what each reproduces and where it departs from the real one.
**Code** - `generator/plazaLandmarks.ts` (index, tiers), `generator/plazaCatalog.ts`, `generator/plazaPlagueColumn.ts`, `generator/plazaBandstand.ts`, `generator/plazaArcDeTriomphe.ts`, `generator/plazaPragueOldTownHall.ts`, `generator/plazaParthenon.ts`, `generator/plazaTempleOfHeaven.ts`, `generator/plazaWarMemorial.ts`, `generator/plazaEquestrianStatue.ts`, `generator/plazaLeaningTowerOfPisa.ts`, `generator/plazaClothHall.ts`, `generator/plazaNelsonsColumn.ts`, `generator/plazaAtomium.ts`, `test/plazaLandmarks.test.ts`, `assets/<name>/`
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
| `bld-war-memorial` | War Memorial | village, town | 10.0 / 8.75 / 10.0 | 8,206 | 148 | `assets/war-memorial/` |
| `bld-equestrian-statue` | Equestrian Statue | town, city; radial, round | 12.0 / 12.8 / 12.0 | 7,530 | 432 | `assets/equestrian-statue/` |
| `bld-leaning-tower-of-pisa` | Leaning Tower of Pisa | town, city; radial, round | 27.0 / 56.6 / 27.0 | 29,902 | 482 | `assets/leaning-tower-of-pisa/` |
| `bld-cloth-hall` | Krakow Cloth Hall | town, city; rect, footprint | 118.4 / 30.1 / 32.4 | 29,054 | 264 | `assets/cloth-hall/` |
| `bld-nelsons-column` | Nelson's Column | city | 25.0 / 51.6 / 25.0 | 9,558 | 376 | `assets/nelsons-column/` |
| `bld-atomium` | Atomium | city; radial, round | 104.0 / 102.0 / 104.0 | 26,160 | 500 | `assets/atomium/` |

Tiers (the building skill): the small monuments (Plague Column, Bandstand, War Memorial, Equestrian Statue, Nelson's Column) 4,000-10,000 triangles, the
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

## War Memorial

A generic First World War village memorial, a composite of French, German and Finnish ones
(the Lanrelas poilu for the soldier).

- A paved platform 8.6 m across on two steps (10 m overall), nine granite bollards with
  sagging iron chains of alternating flat links, open at the front (+Z).
- A stepped plinth, a 2.3 m die with a dark polished name tablet on each face (gilt raised
  blocks for the names, 4 cm proud), a cornice, a bronze laurel wreath and the obelisk with
  a gilt cross and "1914 / 1918", 8.75 m to the top.
- A 2.1 m bronze soldier in a greatcoat and helmet, head bowed, hands folded on the muzzle
  of his rifle; two bronze wreaths and two flower beds at the foot.
- Deviations: abstract lettering, a stylised soldier, flat chain links.

## Equestrian Statue

A generic 19th-century ruler on horseback, after St Wenceslas in Prague, Marcus Aurelius and
the Great Elector; the horse walks toward +Z.

- Three round granite steps 12 m across and a bronze railing with spear-tipped bars between
  eight capped granite posts.
- The pedestal to 6.4 m: socle, a die with bronze relief processions on the long sides and
  oval cartouches front and back, a dark frieze with gilt lettering, cornice and attic.
- Four robed bronze saints 2.5 m tall on plinths at the corners (cross-staff, praying, open
  arms, raised arms).
- The horse, about 1.7 times life size, right foreleg raised: a barrel lofted from oval
  sections, an arched neck with crest mane, a head with ears, eyes and nostrils, jointed
  legs (knee or hock, fetlock, hoof) and a full tail. The armoured rider with cloak and
  crested helmet holds the reins and a raised lance with a gilt pennant (top 12.8 m).
- Deviations: a generic composite with a round base; simple saints and flat reliefs; no
  stirrups; a single-ridge mane.

## Leaning Tower of Pisa

Drawn upright, then turned 3.97 degrees about the z axis through the origin, the top toward
+X; the foot drum's lower edge is cut so that after the turn it sits exactly on y = 0. The
top railing stands about 56.6 m high on the high side.

- The ground storey (15.48 m across): 15 blind arches on engaged columns, inlaid lozenges,
  faint grey bands and the door on +Z.
- Six open galleries of 30 columns each: a real pierced arcade, a walkable floor, the
  shaded inner wall with stair doors, and cornices between the storeys.
- The bell chamber: 12 pierced arches with seven bronze bells on timber headstocks, railings
  on the terrace and the roof.
- A paved round plinth 27 m across with an inlaid ring and a low kerb.
- Deviations: no banana curve; a raised plinth instead of the sunken ring; a simplified bell
  chamber.

## Krakow Cloth Hall

The long axis is X; the long fronts face +Z and -Z.

- The 108 x 18 m hall: a shaded ground storey behind the arcades, the red brick storey with
  cream pilasters and round-headed windows, a white cornice at 15 m.
- The neo-Gothic arcades along both long fronts: pointed arches pierced through the arcade
  wall on round columns, floor, ribbed ceiling, shop doors and an openwork balustrade over a
  lean-to roof.
- The Renaissance attic ("Polish parapet") hiding the roof: a scalloped crest, two blind
  arches and a mask per bay, a pinnacle on every pilaster.
- The central pavilions with the open passage through the hall along Z, crests up to about
  30 m; four corner pavilions with domed octagonal turrets; stair towers with stepped gables
  at the ends.
- Deviations: fully symmetric (the real ends differ); flat ribbed arcade ceilings; a
  simplified frieze and central crest.

## Nelson's Column

The Trafalgar relief faces +Z; 51.56 m overall. The two fountains of the square are left out.

- A five-step granite flight 25 m square, the pedestal (die 8.8 m across) with a raised
  bronze relief on each face (Trafalgar with the dying Nelson, the Nile, Cape St Vincent,
  Copenhagen).
- Landseer's four bronze lions on granite plinths at the corners: body, mane, head with
  face, outstretched paws, curled tail.
- The fluted Corinthian granite column (24 flutes, 3.2 to 2.8 m), the bronze capital with
  three rows of acanthus and volutes, the drum, and the 5.3 m statue of Nelson in his
  bicorne with the pinned sleeve, sword and coil of rope.
- Deviations: generic relief crowds, smooth lions, a square abacus, V-shaped flutes.

## Atomium

A body-centred cubic cell of nine 18 m spheres standing on one corner, its body diagonal
vertical; the cube edge is 45.6 m centre to centre (from the 102 m height, the lowest
sphere 5 m off the ground). The diagonal plane through the lowest, centre and top spheres
is z = 0, facing +Z.

- Each sphere is clad in 288 triangular steel plates standing 10 cm proud of dark seams,
  lighter on the upper half; the top sphere has the restaurant's window band, the visited
  spheres bands of glazed triangles.
- Twenty 3.3 m tubes (12 edges, 8 half-diagonals including the lift tube) with collars and
  rows of small windows.
- Three tapering lattice pylons carrying the lower spheres; the lowest sphere on a short
  column over a round glazed entrance pavilion with a canopy toward +Z; a round paved plaza
  52 m in radius with lawns, which sets the plan extent.
- Deviations: the plate net is offset latitude rings, not the real geodesic net; a generic
  pavilion; simplified pylons; a stylised round plaza.
