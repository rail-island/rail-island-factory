# Bus 1 references

Source files for `veh-bus-1` (generator/buses.ts, generator/cityBuses.ts). Not shipped
with any model.

Bus 1 is vlakosimdb's generic coach, not a reproduction of a real type, so there are no
photographs: the model follows the native files alone.

## Native vlakosimdb files

`native/bus_1/` - vlakosimdb `db/motocar/bus_1` at commit `b170acf`: `index.xml`, the
model XML as `model.xml` and the original BMPs (10 pixels a metre; `x_inc` the front,
`x_dec` the rear, `z_inc` / `z_dec` the right and left sides, `y_dec` the underside). The XML
gives the shell's outlines (section, side, plan); the BMPs the window band, the doors,
the wheel positions and the mint sweep. The model keeps the texture's axle positions and
its 11.3 m length; the body is 2.40 m wide.
