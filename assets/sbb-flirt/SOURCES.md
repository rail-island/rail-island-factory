# SBB FLIRT source references

**Covers** - provenance of the SBB FLIRT model (`proc-vehicle-sbb-flirt`, a RABe 523 in SBB Regio paint): photographs, a type drawing and the published figures.
**Code** - `generator/chUnits.ts` (`SBB_FLIRT`, `FLIRT_FACE`, `FLIRT_SBB`)
**See also** - [the reference](../../docs/models/switzerland-trains.md)

## Photographs

Downloaded from Wikimedia Commons at 1280 px wide (`pnpm refs:fetch`). The model carries the running number
**523 021** ("La Veveyse"), the unit in `photo-flirt-523-021.jpg`.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-flirt-523-021.jpg` | FLIRT-523-021.jpg | https://commons.wikimedia.org/wiki/File:FLIRT-523-021.jpg | Albins | CC BY-SA 4.0 | three-quarter view of the modelled unit in Regio paint: the red round the windscreen up to the roof stripe, the cab side window, the number |
| `photo-ffs-rabe-522-205-basel-sbb-180611.jpg` | FFS RABe 522 205 Basel SBB 180611.jpg | https://commons.wikimedia.org/wiki/File:FFS_RABe_522_205_Basel_SBB_180611.jpg | NAC | CC BY-SA 3.0 | front view (same body and paint): face outline, windscreen and dome, lamp pods, bumper, grille boxes, coupler; heights measured at 94 px/m over the 2.88 m width |
| `photo-rabe523-flirt-yverdon-3-sep-2011.jpg` | RABe523 FLIRT Yverdon 3 Sep 2011.png | https://commons.wikimedia.org/wiki/File:RABe523_FLIRT_Yverdon_3_Sep_2011.png | Lionel Amiguet | CC BY 3.0 | near-side view of a four-car unit: doors and windows per car (fitted to the joints by a projective map), heights of the bands, windows and doors, the roof stripe on every car |
| `photo-rames-rabe523-flirt-montreux-290910.jpg` | Rames RABe523 Flirt Montreux 290910.png | https://commons.wikimedia.org/wiki/File:Rames_RABe523_Flirt_Montreux_290910.png | Lionel Amiguet | CC BY 3.0 | the nose close up from the side (523 025): windscreen rake, cab side window, the red band's course, the raised window behind the cab |
| `photo-rabe522-renens-vd.jpg` | Rabe522-renens-vd.jpg | https://commons.wikimedia.org/wiki/File:Rabe522-renens-vd.jpg | Remontees | CC BY-SA 4.0 | the doors close up: red double leaves with tall windows, the grey foot across them |
| `photo-tilo-2-gekoppelte-etr-524-stadler-flirt-in-biasca-2026.jpg` | TILO - 2 gekoppelte ETR 524 (Stadler Flirt) in Biasca (2026).jpg | https://commons.wikimedia.org/wiki/File:TILO_-_2_gekoppelte_ETR_524_(Stadler_Flirt)_in_Biasca_(2026).jpg | JoachimKohler-HB | CC BY-SA 4.0 | the cab corner close up (RABe 524, TILO paint): the face's profile, bumper and cab side window |
| `photo-rabe-524-010-in-paradiso.jpg` | RABe 524 010 in Paradiso.jpg | https://commons.wikimedia.org/wiki/File:RABe_524_010_in_Paradiso.jpg | MrNoxaso | CC BY-SA 4.0 | front view of the sister class: face and lamps (TILO paint, not modelled) |
| `photo-capolago-riva-s-vitale-etr-524.jpg` | Capolago-Riva S Vitale ETR 524.jpg | https://commons.wikimedia.org/wiki/File:Capolago-Riva_S_Vitale_ETR_524.jpg | Andrzej Otrębski | CC BY-SA 4.0 | three-quarter view of the sister class: the nose and the end car's side |
| `photo-rabe-523-076.jpg` | RABe 523 076.jpg | https://commons.wikimedia.org/wiki/File:RABe_523_076.jpg | Heitersberg | CC BY-SA 4.0 | a RABe 523 in transN paint: the body's shape and the articulation (paint not modelled) |
| `photo-rabe-521-017.jpg` | RABe 521 017.jpg | https://commons.wikimedia.org/wiki/File:RABe_521_017.jpg | Heitersberg | CC BY-SA 4.0 | a RABe 521 in an Aargau advertising paint: the red face round the windscreen (paint not modelled) |
| `photo-stadler-flirt-typenskizze.jpg` | Stadler Flirt Typenskizze.png | https://commons.wikimedia.org/wiki/File:Stadler_Flirt_Typenskizze.png | WestRail642fan, Plutowiki | CC BY-SA 4.0 | type drawing of a three-car FLIRT to scale (22 px/m): the motor bogie 5.1 m behind the front, the Jacobs bogies under the joints, the pantograph on the middle car over its leading bogie |
| `photo-keolis-flirt-7407-te-amersfoort-38748360521.jpg` | Keolis FLIRT 7407 te Amersfoort (38748360521).jpg | https://commons.wikimedia.org/wiki/File:Keolis_FLIRT_7407_te_Amersfoort_(38748360521).jpg | Roel Hemkes from Amersfoort, Netherlands | CC BY 2.0 | a Dutch FLIRT 3 (a later front, not the modelled one): kept as the first reference |

## Published figures

- **Figures** - de.wikipedia, [Stadler Flirt](https://de.wikipedia.org/wiki/Stadler_Flirt) (Stadler data sheets): four-car 74.266 m, three-car 58.166 m (so end cars 21.03 m to the joint, middle cars 16.1 m), width 2.88 m, height 4.185 m, entrance 580 mm, axle arrangement Bo'2'2'2'Bo'; the pantograph on a middle car, the transformer on the roof behind the cabs. Power, top speed and first year as the design states them (`generator/chUnits.ts`, `generator/openttdTable.ts`, [switzerland-trains.md](../../docs/models/switzerland-trains.md)).
