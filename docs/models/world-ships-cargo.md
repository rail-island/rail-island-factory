# World ships: cargo and service

**Covers** - the 49 cargo and service ships of the world fleet: container ships, tankers, gas and bulk carriers, ro-ro, heavy-lift and general cargo ships, river cargo, tugs, fishing vessels, icebreakers and research ships, offshore, rescue and pilot craft; their sizes, datums, parameters and deviations.
**Code** - `generator/worldShipsCargo.ts`, `generator/worldShipsService.ts` (on `generator/hullKit.ts`)
**See also** - [world-ships.md](world-ships.md) (the kit, datums, budgets, OpenTTD and checks), [world-ships-passenger.md](world-ships-passenger.md), [world-fleet.md](world-fleet.md)

Sizes are the built model's: length over the hull (a bowsprit or a stern wheel aside), the
moulded beam, the height from the keel to the highest point. The references and figures are
in `assets/ship-<name>/SOURCES.md`.

## Cargo ships (`worldShipsCargo.ts`)

| id | title | L x B x H (m) | draft (draftFrac) | bow / stern | triangles (LOD) | params |
|---|---|---|---|---|---|---|
| `veh-ship-triple-e` | Maersk Triple E Class | 399.0 x 59.0 x 75.4 | 14.5 (0.1923) | bulbous / transom | 5224 (99) | load: full, empty |
| `veh-ship-emma-maersk` | Emma Maersk | 397.7 x 56.4 x 71.6 | 15.5 (0.2165) | bulbous / transom | 4911 (99) | load: full, empty |
| `veh-ship-msc-gulsun` | MSC Gulsun Class | 399.9 x 61.5 x 78.6 | 16.0 (0.2036) | bulbous / transom | 5269 (99) | load: full, empty |
| `veh-ship-panamax-container` | Panamax Container Ship | 294.0 x 32.2 x 50.2 | 12.0 (0.239) | bulbous / transom | 3895 (89) | load: full, empty; livery: orange, green, blue |
| `veh-ship-feeder-container` | Feeder Container Ship | 134.0 x 22.5 x 45.8 | 8.0 (0.1747) | bulbous / transom | 2725 (99) | load: full, empty |
| `veh-ship-ideal-x` | Ideal X | 159.6 x 20.7 x 30.6 | 9.2 (0.3007) | raked / cruiser | 2112 (99) | - |
| `veh-ship-vlcc` | Very Large Crude Carrier | 330.0 x 60.0 x 62.9 | 21.0 (0.3339) | bulbous / transom | 2873 (99) | livery: navy, green, black |
| `veh-ship-seawise-giant` | Seawise Giant | 458.4 x 68.8 x 68.6 | 24.6 (0.3586) | raked / transom | 3040 (99) | - |
| `veh-ship-aframax` | Aframax Tanker | 245.0 x 42.0 x 49.6 | 14.8 (0.2984) | bulbous / transom | 2701 (99) | livery: red, navy, black |
| `veh-ship-product-tanker` | Product Tanker | 183.0 x 32.2 x 44.6 | 12.0 (0.2691) | bulbous / transom | 2655 (99) | livery: red, navy, green |
| `veh-ship-lng-moss` | Moss LNG Carrier | 290.0 x 48.0 x 60.9 | 11.5 (0.1888) | bulbous / transom | 3954 (99) | - |
| `veh-ship-lng-qmax` | Q-Max LNG Carrier | 345.0 x 53.8 x 61.4 | 12.0 (0.1954) | bulbous / transom | 2887 (99) | - |
| `veh-ship-lpg-carrier` | LPG Carrier | 120.0 x 19.6 x 32.6 | 7.2 (0.2209) | bulbous / transom | 2769 (89) | - |
| `veh-ship-chemical-tanker` | Chemical Tanker | 183.0 x 32.0 x 43.6 | 11.5 (0.2638) | bulbous / transom | 3131 (99) | livery: red, navy, green, black |
| `veh-ship-capesize` | Capesize Bulk Carrier | 292.0 x 45.0 x 53.3 | 18.2 (0.3415) | bulbous / transom | 2673 (85) | livery: black, red, blue |
| `veh-ship-valemax` | Valemax Ore Carrier | 362.0 x 65.0 x 65.5 | 23.0 (0.3511) | bulbous / transom | 2984 (85) | - |
| `veh-ship-handysize` | Handysize Bulk Carrier | 180.0 x 30.0 x 47.5 | 10.0 (0.2105) | bulbous / transom | 2733 (99) | livery: red, black, blue, grey |
| `veh-ship-laker` | Great Lakes Freighter | 222.5 x 22.9 x 25.7 | 7.9 (0.3074) | raked / transom | 2197 (89) | livery: red, black |
| `veh-ship-self-unloader` | Self-Unloading Laker | 304.8 x 32.0 x 31.4 | 9.4 (0.2994) | raked / transom | 2397 (99) | - |
| `veh-ship-pctc` | Pure Car and Truck Carrier | 199.9 x 32.3 x 46.4 | 9.5 (0.2047) | bulbous / transom | 1788 (69) | livery: blue, white, red |
| `veh-ship-roro` | Ro-Ro Cargo Ship | 190.0 x 26.0 x 38.4 | 7.5 (0.1953) | bulbous / transom | 2447 (89) | load: full, empty; livery: white, blue, orange |
| `veh-ship-heavy-lift` | Semi-Submersible Heavy-Lift Ship | 275.0 x 70.0 x 75.5 | 10.5 (0.1391) | raked / transom | 3012 (93) | load: full, empty |
| `veh-ship-reefer` | Refrigerated Cargo Ship | 150.0 x 23.0 x 35.6 | 9.0 (0.2528) | bulbous / transom | 2574 (97) | livery: white, blue, red |
| `veh-ship-liberty` | Liberty Ship | 134.6 x 17.3 x 31.4 | 8.5 (0.2707) | raked / cruiser | 2473 (95) | - |
| `veh-ship-victory` | Victory Ship | 138.8 x 18.9 x 34.0 | 8.7 (0.2559) | raked / cruiser | 2581 (95) | - |
| `veh-ship-europaschiff` | Rhine Motor Cargo Vessel | 80.0 x 9.5 x 9.9 | 2.5 (0.2525) | barge / transom | 1657 (94) | load: full, empty |
| `veh-ship-rhine-tanker` | Rhine Tanker Barge | 110.0 x 11.4 x 11.6 | 3.5 (0.3021) | barge / transom | 1937 (98) | - |
| `veh-ship-push-barge` | Push Barge | 76.5 x 11.4 x 6.2 | 3.5 (0.5645) | barge / sternwheel | 1162 (88) | load: full, empty |
| `veh-ship-yangtze-cargo` | Yangtze River Cargo Ship | 90.0 x 15.8 x 15.9 | 3.5 (0.2201) | raked / transom | 2090 (89) | load: full, empty |
| `veh-ship-volga-don` | Volga-Don River Ship | 138.3 x 16.5 x 17.9 | 3.5 (0.1955) | raked / transom | 1822 (85) | - |

Notes:

- **Container ships** carry a `load` parameter: full (stacks on the hatch covers) or empty
  (the covers alone). The stacks are blocks a few rows wide, their heights and colours from a
  fixed seed. The Triple E has its island bridge forward of midships and twin uptakes aft,
  Emma Maersk the bridge two-thirds forward, MSC Gulsun the bridge well forward.
- **Tankers** share the deck of pipe runs, catwalk, manifold and hose cranes; liveries recolour
  the hull. The Seawise Giant is at her lengthened 458.45 m.
- **Gas carriers**: five Moss spheres on their skirts; the Q-Max's membrane trunk deck; a
  pressurised LPG carrier with three pairs of cylindrical tanks (the list's "LPG Carrier" is
  read as that type, not a 225 m VLGC).
- **Bulkers** carry hatch covers; the Handysize its four cranes; the lakers their pilothouse at
  the bow, the self-unloader its 79 m boom stowed along the deck.
- **Ro-ro and car carriers**: the PCTC is a box of car decks to 37 m with its quarter ramp
  stowed; the ro-ro ship carries trailers when loaded.
- **Heavy lift**: Boka Vanguard with its forward house and helideck; loaded it carries a jack-up
  rig's hull and legs.
- **Liberty and Victory ships**: three-island hulls, midship houses, kingposts and derricks.
- **River cargo**: the Europaschiff (containers or closed hatches), the Rhine tanker, a Europa II
  push barge (coal heaped or light: its draft changes, and its `draftFrac` with it), the Yangtze
  ship and the Volgo-Don.

## Service ships (`worldShipsService.ts`)

| id | title | L x B x H (m) | draft (draftFrac) | bow / stern | triangles (LOD) | params |
|---|---|---|---|---|---|---|
| `veh-ship-cable-layer` | Cable Layer | 140.0 x 30.0 x 38.4 | 7.0 (0.1823) | raked / transom | 2547 (99) | - |
| `veh-ship-ocean-tug` | Ocean-Going Tug | 80.0 x 18.0 x 30.4 | 6.5 (0.2138) | bulbous / transom | 2276 (99) | livery: black, red, blue |
| `veh-ship-harbour-tug` | Harbour Tug | 32.0 x 12.8 x 15.8 | 3.6 (0.2278) | raked / transom | 1652 (99) | livery: red, black, green |
| `veh-ship-towboat` | Mississippi Towboat | 60.0 x 16.0 x 20.8 | 2.7 (0.1298) | barge / transom | 2076 (94) | - |
| `veh-ship-stern-trawler` | Stern Trawler | 70.0 x 15.0 x 27.4 | 6.5 (0.2372) | bulbous / transom | 1979 (99) | livery: red, blue, green |
| `veh-ship-purse-seiner` | Tuna Purse Seiner | 80.0 x 14.0 x 33.5 | 6.0 (0.1791) | raked / transom | 1949 (95) | - |
| `veh-ship-shrimp-trawler` | Shrimp Trawler | 23.0 x 7.0 x 14.2 | 2.7 (0.1901) | raked / transom | 892 (83) | - |
| `veh-ship-lobster-boat` | Maine Lobster Boat | 12.0 x 4.2 x 5.4 | 1.1 (0.2037) | raked / transom | 1007 (93) | colour: white, green, blue, red, yellow |
| `veh-ship-arktika` | Arktika Class Icebreaker | 159.6 x 30.0 x 47.6 | 11.0 (0.2311) | ice / transom | 2494 (99) | - |
| `veh-ship-polarstern` | Polarstern | 118.0 x 25.0 x 41.0 | 11.2 (0.2732) | ice / transom | 2281 (99) | - |
| `veh-ship-attenborough` | RRS Sir David Attenborough | 128.9 x 24.0 x 40.4 | 7.5 (0.1856) | ice / transom | 2438 (99) | - |
| `veh-ship-hopper-dredger` | Trailing Suction Hopper Dredger | 150.0 x 32.0 x 37.4 | 11.0 (0.2941) | bulbous / transom | 2303 (99) | - |
| `veh-ship-supply-vessel` | Platform Supply Vessel | 89.0 x 19.0 x 30.0 | 6.3 (0.21) | raked / transom | 2181 (99) | livery: red, blue, orange |
| `veh-ship-anchor-handler` | Anchor Handling Tug | 91.0 x 22.0 x 33.9 | 7.8 (0.2301) | raked / transom | 2329 (99) | - |
| `veh-ship-crane-vessel` | Semi-Submersible Crane Vessel | 220.0 x 102.0 x 176.6 | 12.0 (0.0679) | barge / sternwheel, twin | 3823 (96) | - |
| `veh-ship-drillship` | Drillship | 228.0 x 42.0 x 96.0 | 12.0 (0.125) | raked / transom | 2642 (93) | - |
| `veh-ship-fireboat` | Fire Fighter | 40.5 x 9.1 x 14.5 | 3.0 (0.2062) | raked / cruiser | 1780 (79) | - |
| `veh-ship-rnli-shannon` | RNLI Shannon Class | 13.6 x 4.5 x 5.7 | 0.9 (0.1593) | raked / transom | 746 (83) | - |
| `veh-ship-pilot-boat` | Pilot Boat | 17.0 x 5.5 x 6.7 | 1.4 (0.2105) | raked / transom | 896 (83) | - |

Notes:

- The **crane vessel** (Sleipnir) is drawn at transit draught: the two pontoons awash, the
  columns, the deck box, the two cranes with their booms raised; the cranes' 10,000 t blocks are
  left out.
- The **drillship's** derrick is a tapering four-leg tower with girts, not a lattice.
- The **fishing vessels'** nets are boxes; the shrimp trawler's outriggers are lowered, the
  fishing cutter's (small module) raised.
- Icebreakers and research ships have an ice bow; Polarstern and the Attenborough carry stern
  A-frames, Arktika its reactor ventilation stack and helideck aft.

## Deviations

- No hull lettering or company logos (trade marks), funnel colours only.
- Container stacks are blocks, not single boxes (the 20,000-triangle budget would hold about a
  tenth of a Triple E's 18,000 TEU).
- Railings, ladders, mooring gear and most cargo gear are left out; cranes are a pedestal, cab
  and a round jib.
- The figures of the generic types (Panamax, VLCC, Aframax, the tugs, the offshore vessels) are
  typical ones, marked approx. in their `SOURCES.md`.
