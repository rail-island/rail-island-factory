# Blue Train 24 series source references

**Covers** - provenance of the Blue Train 24 series model (`proc-vehicle-blue-train-24`): photographs, the measurements taken from them and published dimensions.
**Code** - `generator/jpLocos.ts`
**See also** - [the reference](../../docs/models/jnr-locos.md)

## Photographs

Downloaded from Wikimedia Commons and scaled to at most 1600 px on the long side.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-24-series-jinyamachi.jpg` | 711 series 24 series Jinyamachi Rinkai Yard 20150703.jpg | https://commons.wikimedia.org/wiki/File:711_series_24_series_Jinyamachi_Rinkai_Yard_20150703.jpg | Sappoatu | CC BY 2.5 | an intermediate car end: gangway door, the tail lamps beside it, the roof-end air conditioner housing |
| `photo-jnr-pc-ohane25-118.jpg` | JNR PC ohane25-118.jpg | https://commons.wikimedia.org/wiki/File:JNR_PC_ohane25-118.jpg | 永尾信幸 | CC BY-SA 3.0 | the modelled sleeper (OHaNe 25 118, JNR stainless lines): berth side window row, folding door, louvre, toilet windows, the two lines and where they stop, underfloor; running number |
| `photo-jnr-pc-ohanefu25-211.jpg` | JNR PC ohanefu25-211.jpg | https://commons.wikimedia.org/wiki/File:JNR_PC_ohanefu25-211.jpg | 永尾信幸 | CC BY-SA 3.0 | the end face's heights (eaves, crown, lines, lamps, gangway door), the lines wrapping round the end, the berth side's window heights |
| `photo-jnr-pc-ohane25-29.jpg` | JNR PC ohane25-29.JPG | https://commons.wikimedia.org/wiki/File:JNR_PC_ohane25-29.JPG | ５１６ | CC BY-SA 3.0 | the corridor side (JR East gold-line livery, not modelled): deck window, tall corridor windows, washroom, toilet ovals, destination board, hatches |
| `photo-jnr-pc-oshi24-101.jpg` | JNR PC oshi24-101.jpg | https://commons.wikimedia.org/wiki/File:JNR_PC_oshi24-101.jpg | 永尾信幸 | CC BY-SA 3.0 | the modelled dining car (OShi 24 101): kitchen sliding door, 4 + 5 windows, vent, water tanks; running number |
| `photo-jnr-pc-oshi24-704.jpg` | JNR PC oshi24-704.jpg | https://commons.wikimedia.org/wiki/File:JNR_PC_oshi24-704.jpg | 永尾信幸 | CC BY-SA 3.0 | a second OShi 24 (same side) confirming the window layout and the roof-end housings |

## Measurements

All photos are perspective views along the car. Positions along the side come from a 1-D projective
fit x = (a d + b) / (c d + 1) over the body ends (20.0 m apart), the bogie centres (14.15 m apart)
and equal window pitch; heights from the two stainless lines and the body's foot, scaled by the end
face of OHaNeFu 25-211 (about 89 px/m there; body foot 1.05 m, crown 3.98 m). Rectified side strips
at 32 px/m were compared with the model. Uncertainty along the side about 0.3 m in the middle of a car.

- **Section** - foot 1.05 m, eaves 3.55 m, crown 3.98 m (3.9 m at the end wall), air conditioner housings
  to 4.085 m; stainless lines 1.12-1.17 m and 1.94-2.0 m.
- **Sleeper, berth side** - folding door 0.35-1.15 m from the door end (two narrow windows 2.07-3.18 m),
  louvre 1.3-1.85 m, a small window 2.45-3.05 m, eight windows 1.15 m wide at a 1.87 m pitch from 3.98 m,
  sill 2.09 m, head 2.78 m; two toilet windows 2.68-2.95 m high at 18.6 and 19.3 m.
- **Sleeper, corridor side** - deck window 1.7-2.05 m (2.13-3.05 m high), seven windows 1.07 m wide at a
  1.84 m pitch from 2.7 m, sill 2.09 m, head 3.03 m; washroom window 15.75-16.9 m; toilet ovals 17.5 and
  18.6 m at 2.58-2.86 m.
- **Dining car** - kitchen door 1.3-2.15 m, windows 1.2 m wide at 2.38-3.0 m: four at a 1.58 m pitch from
  3.12 m, a vent at 9.3 m, five at a 1.68 m pitch from 10.1 m.
- **End** - gangway door 0.74 m wide to 3.28 m, its window 2.46-3.02 m; tail lamps at +-0.98 m, 1.66 m high.

## Published figures

- **Dimensions** - Wikipedia "24 series": 20.8 m coaches, 2.95 m wide, 4.09 m high, from 1973 (the 25 sub-series' two-berth sleepers from 1974); bogie centres 14.15 m, TR217 bogies, 860 mm wheels.
- **Gauge** - the prototype's track is 1,067 mm; the model keeps its real body on the game's standard-gauge wheelsets.
