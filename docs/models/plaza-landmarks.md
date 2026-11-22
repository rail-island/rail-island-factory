# Plaza landmarks

**Covers** - the monuments and civic buildings made for a settlement's main square (first batch: Plague Column, Bandstand, Arc de Triomphe, Prague Old Town Hall, Parthenon, Temple of Heaven; second batch: War Memorial, Equestrian Statue, Leaning Tower of Pisa, Krakow Cloth Hall, Nelson's Column, Atomium; third batch: Market Cross, Half-Timbered Town Hall, Statue of Liberty, Pantheon, Taj Mahal, Gateway of India; fourth batch: Village Chapel, Belfry of Bruges, Brussels Town Hall, Market Hall, United States Capitol, Reichstag, Hagia Sophia, Gate of Heavenly Peace): their plaza rules, triangle tiers, what each reproduces and where it departs from the real one.
**Code** - `generator/plazaLandmarks.ts` (index, tiers), `generator/plazaCatalog.ts`, `generator/plazaPlagueColumn.ts`, `generator/plazaBandstand.ts`, `generator/plazaArcDeTriomphe.ts`, `generator/plazaPragueOldTownHall.ts`, `generator/plazaParthenon.ts`, `generator/plazaTempleOfHeaven.ts`, `generator/plazaWarMemorial.ts`, `generator/plazaEquestrianStatue.ts`, `generator/plazaLeaningTowerOfPisa.ts`, `generator/plazaClothHall.ts`, `generator/plazaNelsonsColumn.ts`, `generator/plazaAtomium.ts`, `generator/plazaMarketCross.ts`, `generator/plazaHalfTimberedTownHall.ts`, `generator/plazaStatueOfLiberty.ts`, `generator/plazaPantheon.ts`, `generator/plazaTajMahal.ts`, `generator/plazaGatewayOfIndia.ts`, `generator/plazaVillageChapel.ts`, `generator/plazaBelfryOfBruges.ts`, `generator/plazaBrusselsTownHall.ts`, `generator/plazaMarketHall.ts`, `generator/plazaUsCapitol.ts`, `generator/plazaReichstag.ts`, `generator/plazaHagiaSophia.ts`, `generator/plazaGateOfHeavenlyPeace.ts`, `test/plazaLandmarks.test.ts`, `assets/<name>/`
**See also** - [landmarks.md](landmarks.md) (the older secular landmarks), [game-properties.md](game-properties.md) (`plaza`), [historical.md](historical.md), [lod.md](lod.md), [../site/workshop.md](../site/workshop.md)

## The family

Each landmark has its own module, so its standalone JS bundles only its own geometry;
`plazaLandmarks.ts` lists the modules (`PLAZA_FAMILIES`, registered in `generate.ts`), all
the designs (`PLAZA_LANDMARKS`) and each one's triangle tier (`PLAZA_TIERS`). All share
`PLAZA_CATALOG`: category `Historical`, city pool `hist_center`, `defaultScale` 1, CC0 by
Rail Island. They have no parameters. Each has a stated rail-token price in
`LANDMARK_TOKEN_PRICES` ([token-prices.md](token-prices.md)): 300 RT for the bandstand and
the war memorial up to 2,500 RT for the Taj Mahal and the Statue of Liberty.

All are modelled in metres, +Y up, base at y = 0, centred on the origin. They are
**drafts** (workshop) until the user confirms them into `generator/catalogModels.json`.

| id | title | plaza rule | size x / y / z (m) | triangles | LOD | photos |
|---|---|---|---|---|---|---|
| `bld-plague-column` | Plague Column | village, town | 10.6 / 17.2 / 10.6 | 8,410 | 376 | `assets/plague-column/` |
| `bld-bandstand` | Bandstand | village, town | 9.6 / 8.7 / 10.9 | 9,804 | 308 | `assets/bandstand/` |
| `bld-arc-de-triomphe` | Arc de Triomphe | city; radial, round | 48.0 / 50.0 / 30.4 | 29,580 | 348 | `assets/arc-de-triomphe/` |
| `bld-prague-old-town-hall` | Prague Old Town Hall | town, city; rect, footprint | 56.7 / 69.5 / 22.6 | 23,336 | 240 | `assets/prague-old-town-hall/` |
| `bld-parthenon` | Parthenon | city; rect, footprint | 72.3 / 20.8 / 33.7 | 26,270 | 444 | `assets/parthenon/` |
| `bld-temple-of-heaven` | Temple of Heaven | town, city; radial, round | 69.8 / 44.0 / 69.8 | 29,288 | 418 | `assets/temple-of-heaven/` |
| `bld-war-memorial` | War Memorial | village, town | 10.0 / 8.75 / 10.0 | 8,206 | 148 | `assets/war-memorial/` |
| `bld-equestrian-statue` | Equestrian Statue | town, city; radial, round | 12.0 / 12.8 / 12.0 | 7,530 | 432 | `assets/equestrian-statue/` |
| `bld-leaning-tower-of-pisa` | Leaning Tower of Pisa | town, city; radial, round | 27.0 / 56.6 / 27.0 | 29,902 | 482 | `assets/leaning-tower-of-pisa/` |
| `bld-cloth-hall` | Krakow Cloth Hall | town, city; rect, footprint | 118.4 / 30.1 / 32.4 | 29,054 | 264 | `assets/cloth-hall/` |
| `bld-nelsons-column` | Nelson's Column | city | 25.0 / 51.6 / 25.0 | 9,558 | 376 | `assets/nelsons-column/` |
| `bld-atomium` | Atomium | city; radial, round | 104.0 / 102.0 / 104.0 | 26,160 | 500 | `assets/atomium/` |
| `bld-market-cross` | Market Cross | village, town; radial, round | 9.8 / 14.6 / 9.8 | 7,896 | 416 | `assets/market-cross/` |
| `bld-half-timbered-town-hall` | Half-Timbered Town Hall | village, town; rect, footprint | 22.3 / 30.2 / 16.5 | 23,312 | 408 | `assets/half-timbered-town-hall/` |
| `bld-statue-of-liberty` | Statue of Liberty | city; radial, round | 76.7 / 93.0 / 76.4 | 24,169 | 268 | `assets/statue-of-liberty/` |
| `bld-pantheon` | Pantheon | city; rect, footprint | 57.2 / 43.6 / 79.0 | 25,226 | 410 | `assets/pantheon/` |
| `bld-taj-mahal` | Taj Mahal | city; rect, footprint | 95.7 / 73.0 / 95.7 | 29,588 | 498 | `assets/taj-mahal/` |
| `bld-gateway-of-india` | Gateway of India | city; rect, footprint | 43.4 / 26.0 / 27.4 | 28,936 | 448 | `assets/gateway-of-india/` |
| `bld-village-chapel` | Village Chapel | village; rect | 7.2 / 14.2 / 10.9 | 4,180 | 260 | `assets/village-chapel/` |
| `bld-belfry-of-bruges` | Belfry of Bruges | town, city; rect, footprint | 45.4 / 83.0 / 53.1 | 27,876 | 238 | `assets/belfry-of-bruges/` |
| `bld-brussels-town-hall` | Brussels Town Hall | town, city; rect, footprint | 71.4 / 96.0 / 49.1 | 25,390 | 296 | `assets/brussels-town-hall/` |
| `bld-market-hall` | Market Hall | town, city; rect, footprint | 49.2 / 25.0 / 34.4 | 26,030 | 194 | `assets/market-hall/` |
| `bld-us-capitol` | United States Capitol | city; rect, footprint | 195.2 / 88.0 / 104.4 | 28,528 | 432 | `assets/us-capitol/` |
| `bld-reichstag` | Reichstag | city; rect, footprint | 139.6 / 50.1 / 99.7 | 29,313 | 436 | `assets/reichstag/` |
| `bld-hagia-sophia` | Hagia Sophia | city; rect, footprint | 87.9 / 60.0 / 87.3 | 20,939 | 478 | `assets/hagia-sophia/` |
| `bld-gate-of-heavenly-peace` | Gate of Heavenly Peace | city; rect, footprint | 66.0 / 32.6 / 57.0 | 26,750 | 284 | `assets/gate-of-heavenly-peace/` |

Tiers (the building skill): the small monuments (Plague Column, Bandstand, War Memorial, Equestrian Statue, Nelson's Column, Market Cross, Village Chapel) 4,000-10,000 triangles, the
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
  +Z, Resistance and Paix on -Z). Each is a pyramid of figures about 2.5 times life size
  carved from a shallow block set into the pier (in the darker stone, so it reads as the
  shadow between the figures): a heap of drapery and bodies along the plinth, overlapping
  figures with torsos lofted from 8-sided rings, heads, limbs 0.4-0.7 m thick and robes,
  tunics and cloaks as solid volumes, busts in the middle rank, and the winged genius, Fame
  or Minerva at the top with wings as thick layered feather slabs.
- Six framed high-relief panels: figures in two overlapping ranks carved as rounded half
  volumes 0.4-0.6 m proud of the sunk ground, a horseman and a fallen soldier in each. The
  spandrel Victories recline along the arch's back with solid bodies, a wreath held out to
  the keystone, a palm and a layered wing.
- The entablature with the grand frieze, modillions and a 0.9 m corona; the attic with 30
  round shields, its cornice, the roof terrace, parapet and stair house; the Tomb of the
  Unknown Soldier under the arch.
- Deviations: figures are stylised rounded masses (no faces or hands; few attributes),
  scenes generic, a sparse frieze procession (2.5 m pitch), coffers as pyramids, panel and
  attic heights estimated (about +-1 m).

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

## Market Cross

An English late-Gothic covered market cross, a composite of Chichester, Malmesbury and the
Salisbury Poultry Cross; the octagon's flat sides face the axes.

- A three-step octagonal base 9.8 m across; eight walls with real open pointed arches (2 m
  wide, about 3.5 m high) under hood moulds and crocketed finials.
- Stepped three-stage buttresses at the corners rising into crocketed pinnacles.
- Inside: a central pillar with a stone bench round its foot and a ribbed fan spreading
  from its capital to the walls.
- A cornice and pierced parapet with leaf cresting, a low lead roof, a stone attic with four
  clock faces, eight crocketed flying ribs curving to the central turret, an open lantern of
  eight colonnettes, a lead cupola and spire, a gilt ball and cross at 14.6 m.
- Deviations: a composite; the clocks sit on an attic below the ribs; plain arches without
  ogee gablets; no niches or statues; four-sided ribs; no weathervane.

## Half-Timbered Town Hall

A German half-timbered town hall, a composite of Wernigerode (twin oriel spires, clock
gable), Alsfeld (stone arcade) and Michelstadt (tiled helmets); the broad front faces +Z.

- An open stone market hall about 5 m high with see-through pointed arches (four in front,
  three on each end), a paved floor, a joisted ceiling and a beam on two braced oak posts;
  a closed back wall with a door and barred windows.
- Two jettied timber-framed storeys: raised framing 8 cm proud of cream plaster (sill,
  plates, posts, rails, "Mann" figures, St Andrew's crosses), rows of small leaded windows,
  carved corner posts.
- Two octagonal corner oriels corbelled out from the front corners, rising to tall pointed
  tiled helmets with gilt finials.
- A steep 55-degree tiled roof with framed gables and three rows of dormers; the central
  clock gable with a blue and gilt dial; a roof turret with an open bell lantern and a copper
  onion (top 30.2 m); an outside stone stair at the back to the first floor.
- Deviations: a composite; the stair at the back; gables not jettied; no carved ornament,
  arms or flower boxes; tiles as course bands.

## Statue of Liberty

She faces +Z; 93.0 m from the ground to the torch tip.

- Fort Wood: an 11-pointed star of granite walls 6.6 m high (points on a 76 m circle, shrunk
  from over 100 m to fit a square), a paved terreplein and the sally port on +Z.
- The foundation's terraces and stepped pyramid to 19.8 m, and Hunt's 27 m pedestal: the
  course of discs, a rusticated die, a loggia of four Doric columns on every face, the
  entablature, the balcony gallery with real openings and the observation parapet.
- The 46.1 m copper statue in verdigris: a stola lofted in rings with deep folds and the
  overfold, the mantle, the striding knee and raised right heel, the raised arm with the
  torch's balcony and gilt flame, the tablet inscribed JULY / IV / MDCCLXXVI in raised blocks,
  a face, hair, the crown with its window band and seven rays, and the broken chain.
- Deviations: a smaller, evenly pointed fort; a simplified foundation; a pedestal at 0.9 of
  its plan; 9 crown windows instead of 25; block lettering.

## Pantheon

The portico faces +Z.

- The brick rotunda (55.2 m across) in three cornice-banded storeys with relieving arches,
  six stepped rings and the shallow lead dome to 43.3 m, with the real 8.2 m oculus and its
  bronze rim; through it the coffered inner dome (five rings of 28), the wall and the floor.
- The intermediate block with its second pediment.
- The portico on a 1.3 m podium: 16 Corinthian columns 11.8 m tall (eight grey granite
  across the front, two rows of four pink granite behind), antae, the bronze doors and the
  aisle niches; the entablature with M.AGRIPPA.L.F.COS.TERTIVM.FECIT in raised bronze
  letters; the pediment with fixing holes in its tympanum and a tiled lead roof.
- Deviations: the inner dome springs at 20.2 m to stay under the outer dome; flat niches;
  simplified capitals and no modillions; smooth 20-sided shafts.

## Taj Mahal

The mausoleum on its plinth with the four minarets; the mosque, guest house and gardens are
left out. The main stair is on +Z.

- The 95 m square, 7 m plinth with a band of pointed-arch niches and a 20-step stair.
- The 57 m mausoleum with chamfered corners: on each face the pishtaq and the 14 m iwan
  recessed 6.2 m with its calligraphy frame, jali window and doorway; two storeys of niches
  on the side bays and chamfers; the parapet, finials and 16 guldastas.
- The drum (23.6 m across, top at 41.4 m) with its blind arcade, carrying an onion bulb
  measured on the front photos: it swells out at once into a shoulder overhanging the drum,
  widest (27.9 m, 1.18 times the drum) 5.3 m up, closes over a full body and runs up a
  concave neck to a point at 64.4 m; sixteen lotus petals in relief hang over its top and
  the gilt finial (collar, three balls, crescent) reaches 73 m. Four open chattris on the
  roof; their domes, and the minarets' chattri domes, are small onions of the same kind.
- Four minarets 40.5 m above the plinth with three corbelled balconies and a chattri each.
- White marble with raised (never coplanar) inlay and dark calligraphy.
- Deviations: the bulb slightly more elongated than the photos (0.66 against about 0.6 of
  its width); a flat iwan back without the half-dome; single niches; plumb minarets; a flat
  roof deck; no arches between the chattri columns.

## Gateway of India

The city side faces +Z; the sea side mirrors it (the steps to the water are left out).

- A two-step plinth, the open pointed central arch along Z (8.4 m wide, 12 m to the crown)
  with its barrel vault and archivolt, and the 13 m domed hall behind it with side arches
  into the wings.
- The upper central block: corbels under the chhajja, the attic with its inscription
  panel, the crenellated parapet; four corner turrets with jali niches, an octagonal drum
  of jali windows, stepped ribbed domes and finials at 26 m.
- Two 16 m wings with recessed bays, lattice jali lunettes, doors into the wing halls, a
  wrapping chhajja and a jali frieze.
- Deviations: the arch measured from the photos (the brief's 15 m is the dome's span); 38 m
  wide; no flagpole; jali with a dark back, not see-through.

## Village Chapel

A generic Central European village chapel (Czech "kaple na navsi", Bavarian Dorfkapelle);
the entrance gable faces +Z.

- An ochre-rendered nave 6.4 x 7 m on a stone plinth, a rounded apse at the back under a
  conical tile roof, white lesenes and a moulded cornice, round-arched windows with stone
  surrounds.
- The +Z front: a round-arched door with a panelled double leaf, a two-step porch with two
  benches, a niche with a saint, and a curved volute gable with scrolls, vases, an oculus,
  a pediment and a ball finial.
- A steep red tile roof and a square ridge turret with an open belfry, louvres, a small
  bronze bell, a copper onion helmet and a gilt cross at 14.24 m.
- Deviations: a composite, richer than most real village chapels; a tile apse roof.

## Belfry of Bruges

The tower front faces the Markt (+Z).

- The halls: a brick ring 44 m along the Markt and 50 m deep (shortened from about 84 m)
  round a 26 m courtyard, 14 m walls, a corbelled crenellated parapet, corner turrets,
  pointed shop arches and two-light windows on the front, slate roofs with stepped back gables.
- A real gate passage under the tower into the courtyard.
- The tower to 83 m: the brick square shaft with octagonal corner turrets, the Virgin's
  niche and blind arcades; the machicolated gallery; the upper square stage with the lower
  clocks, great corner pinnacles and an openwork balustrade; the white stone octagon with
  two-light belfry openings and the upper clocks; the crenellated crown, slate roof and finial.
- Deviations: shorter halls; no lean; stage heights estimated from photos; dark (not
  see-through) belfry openings.

## Brussels Town Hall

The Gothic front faces the Grand-Place (+Z).

- A 66 m front between octagonal corner turrets, the tower right of centre; a real
  ground-floor arcade 4 m deep; an openwork band; two storeys of pointed windows with
  mullions, transoms and tracery heads; about 70 statues in canopied niches; a crenellated
  parapet with pinnacles; steep slate roofs with rows of dormers.
- The tower: a square base over the real entrance arch to the courtyard, a square shaft
  above the roof with a pinnacled gallery, three tapering octagonal openwork stages, the
  openwork spire and the gilded St Michael at 96 m.
- Wings round a 38 x 18 m courtyard under hipped roofs.
- Deviations: a regular plan; a simplified Baroque back wing; approximate bay counts; a
  crenellated (not openwork) parapet; blocky statues.

## Market Hall

A 19th-century cast-iron and glass market hall, a composite of the Baltard pavilions, the
Budapest Great Market Hall and Nogent; the main entrance faces +Z.

- A basilica in iron: a raised nave along X over side aisles, crossed by a transept whose
  gable fronts (+-Z) are the entrances; cast-iron columns on a 6 x 7 m grid.
- Brick bases, tall glazed round-headed bays with real bars and recessed panes, louvres,
  lean-to zinc aisle roofs, a glazed clerestory, pitched zinc roofs with skylights, louvred
  ridge lanterns with cresting and a square crossing lantern with a gilt finial at 25 m.
- The +Z front: brick piers, an open portal, a great arched window, an enamel clock, a stone
  gable and an iron-and-glass canopy; inside, 16 market stalls with awnings, seen through
  the open portals.
- Deviations: a composite with an added transept; opaque glass; no inner trusses; a blank
  sign board.

## United States Capitol

The east front faces +Z; compressed to about 195 m long (real 229 m), depth and heights real.

- The central block: a rusticated ground storey, two storeys of pedimented windows, the
  balustrade; the east portico of 8 Corinthian columns before a 14-column colonnade, the
  tympanum sculpture and a 20-step grand stair.
- The Senate (-X) and House (+X) wings with pedimented porticos and colonnades; the
  connecting corridors with small cupolas; a simplified west front and terrace.
- The dome: the peristyle of 36 columns round a windowed drum, the attic with 36 windows,
  the ribbed shell with 36 ribs, the tholos and the bronze Statue of Freedom at 88 m.
- Deviations: shortened; one west terrace; simplified capitals and balustrades; six-column
  wing porticos; no flagpoles.

## Reichstag

The west front (Platz der Republik) faces +Z.

- The 132 x 81 m body round two light courts: a rusticated base, giant pilasters, arched
  and pedimented windows, the cornice, attic and balustrade with urns; the east and short
  projections.
- Four 20 m square corner towers to about 40 m with arched windows, sculpture groups, a
  stepped crown and a German flag each.
- The west portico: a 16-step grand stair, six Corinthian columns, the glazed entrance
  wall, corner piers with pinnacles, DEM DEUTSCHEN VOLKE in raised bronze letters and the
  pediment.
- Foster's dome: a 40 m elliptical shell 23.5 m high of 24 ribs and 17 rings with
  see-through glass, the two spiral ramps and the mirrored cone inside.
- Deviations: about 99.7 m deep with the full stair; the dome top about 2.5 m high;
  simplified sculpture, balusters and courts; generic pier pinnacles.

## Hagia Sophia

The long axis is X, the narthex and entrance at -X (west), the apse at +X.

- The central dome 34 m across, crown at 55.6 m, with 40 ribs on a drum of 40 windows and
  small buttresses; the square block with the north and south great arches over recessed
  red-orange tympana with rows of windows.
- The east and west semidomes with their four exedra semidomes, the east apse, the four
  stepped buttress towers and Ottoman sloping buttresses; the aisle and gallery block, the
  inner narthex and the exonarthex arcade.
- Four Ottoman minarets of 58.5-60 m with pencil caps and one or two balconies, the
  south-east one in red brick.
- Deviations: a rectangular plan; no pendentives, tombs or fountain; recessed arches and
  dark windows; simplified minaret positions.

## Gate of Heavenly Peace

The front faces +Z (south). The central panel above the main gateway is plain red: no
portrait, banner or text.

- The 66 x 37 m, 12 m battered red podium with a grey plinth, coping and a white marble
  balustrade; five semicircular gateways through it along Z, the central one largest.
- The gate tower: a nine-by-five-bay hall of 28 red columns with lattice doors, painted beams
  and dougong bands under a double-eaved hip-and-gable roof of golden glazed tiles with
  upturned corners, ridge beasts and chiwen (to 32.6 m).
- The forecourt: the Jinshui river with five arched marble bridges and two huabiao.
- Deviations: the podium capped at 66 m; a straight river and a 20 m forecourt; lattice as
  panels; blocky carvings.
