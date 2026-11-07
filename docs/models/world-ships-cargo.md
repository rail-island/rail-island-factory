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
| `veh-ship-triple-e` | Maersk Triple E Class | 399.0 x 59.0 x 75.4 | 14.5 (0.1923) | bulbous / transom | 18772 (99) | load: full, empty |
| `veh-ship-emma-maersk` | Emma Maersk | 397.7 x 56.4 x 71.6 | 15.5 (0.2165) | bulbous / transom | 17827 (99) | load: full, empty |
| `veh-ship-msc-gulsun` | MSC Gulsun Class | 399.9 x 61.5 x 78.6 | 16.0 (0.2036) | bulbous / transom | 19433 (99) | load: full, empty |
| `veh-ship-panamax-container` | Panamax Container Ship | 294.0 x 32.2 x 51.5 | 12.0 (0.2331) | bulbous / transom | 11907 (99) | load: full, empty; livery: orange, green, blue |
| `veh-ship-feeder-container` | Feeder Container Ship | 134.0 x 22.5 x 45.8 | 8.0 (0.1747) | bulbous / transom | 7755 (99) | load: full, empty |
| `veh-ship-ideal-x` | Ideal X | 159.6 x 20.7 x 30.6 | 9.2 (0.3007) | raked / cruiser | 5840 (99) | - |
| `veh-ship-vlcc` | Very Large Crude Carrier | 330.0 x 60.0 x 64.6 | 21.0 (0.3252) | bulbous / transom | 9930 (99) | livery: navy, green, black |
| `veh-ship-seawise-giant` | Seawise Giant | 458.4 x 68.8 x 70.6 | 24.6 (0.3484) | raked / transom | 11115 (99) | - |
| `veh-ship-aframax` | Aframax Tanker | 245.0 x 42.0 x 50.9 | 14.8 (0.2909) | bulbous / transom | 9074 (99) | livery: red, navy, black |
| `veh-ship-product-tanker` | Product Tanker | 183.0 x 32.2 x 45.6 | 12.0 (0.2629) | bulbous / transom | 8598 (99) | livery: red, navy, green |
| `veh-ship-lng-moss` | Moss LNG Carrier | 290.0 x 48.0 x 60.8 | 11.5 (0.1891) | bulbous / transom | 16260 (99) | - |
| `veh-ship-lng-qmax` | Q-Max LNG Carrier | 345.0 x 53.8 x 63.0 | 12.0 (0.1905) | bulbous / transom | 9130 (99) | - |
| `veh-ship-lpg-carrier` | LPG Carrier | 120.0 x 19.6 x 32.6 | 7.2 (0.2209) | bulbous / transom | 7071 (99) | - |
| `veh-ship-chemical-tanker` | Chemical Tanker | 183.0 x 32.0 x 44.6 | 11.5 (0.2576) | bulbous / transom | 8925 (99) | livery: red, navy, green, black |
| `veh-ship-capesize` | Capesize Bulk Carrier | 292.0 x 45.0 x 54.6 | 18.2 (0.3335) | bulbous / transom | 9023 (99) | livery: black, red, blue |
| `veh-ship-valemax` | Valemax Ore Carrier | 362.0 x 65.0 x 67.3 | 23.0 (0.342) | bulbous / transom | 9506 (99) | - |
| `veh-ship-handysize` | Handysize Bulk Carrier | 180.0 x 30.0 x 47.5 | 10.0 (0.2105) | bulbous / transom | 8385 (99) | livery: red, black, blue, grey |
| `veh-ship-laker` | Great Lakes Freighter | 222.5 x 22.9 x 25.7 | 7.9 (0.3074) | raked / transom | 5316 (99) | livery: red, black |
| `veh-ship-self-unloader` | Self-Unloading Laker | 304.8 x 32.0 x 31.4 | 9.4 (0.2994) | raked / transom | 5742 (99) | - |
| `veh-ship-pctc` | Pure Car and Truck Carrier | 199.9 x 32.3 x 46.4 | 9.5 (0.2047) | bulbous / transom | 3862 (89) | livery: blue, white, red |
| `veh-ship-roro` | Ro-Ro Cargo Ship | 190.0 x 26.0 x 38.4 | 7.5 (0.1953) | bulbous / transom | 6695 (99) | load: full, empty; livery: white, blue, orange |
| `veh-ship-heavy-lift` | Semi-Submersible Heavy-Lift Ship | 275.0 x 70.0 x 75.5 | 10.5 (0.1391) | raked / transom | 6684 (93) | load: full, empty |
| `veh-ship-reefer` | Refrigerated Cargo Ship | 150.0 x 23.0 x 35.6 | 9.0 (0.2528) | bulbous / transom | 7378 (99) | livery: white, blue, red |
| `veh-ship-liberty` | Liberty Ship | 134.6 x 17.3 x 31.4 | 8.5 (0.2707) | raked / cruiser | 5731 (99) | - |
| `veh-ship-victory` | Victory Ship | 138.8 x 18.9 x 34.0 | 8.7 (0.2559) | raked / cruiser | 5839 (99) | - |
| `veh-ship-europaschiff` | Rhine Motor Cargo Vessel | 80.0 x 9.5 x 10.7 | 2.5 (0.2336) | barge / transom | 4951 (98) | load: full, empty |
| `veh-ship-rhine-tanker` | Rhine Tanker Barge | 110.0 x 11.4 x 12.8 | 3.5 (0.2734) | barge / transom | 6042 (98) | - |
| `veh-ship-push-barge` | Push Barge | 76.5 x 11.4 x 6.7 | 3.5 (0.5224) | barge / sternwheel | 3792 (98) | load: full, empty |
| `veh-ship-yangtze-cargo` | Yangtze River Cargo Ship | 90.0 x 15.8 x 15.9 | 3.5 (0.2201) | raked / transom | 5716 (99) | load: full, empty |
| `veh-ship-volga-don` | Volga-Don River Ship | 138.3 x 16.5 x 17.9 | 3.5 (0.1955) | raked / transom | 4274 (85) | - |

All 30 are **detailed ships** (see "Detail" in [world-ships.md](world-ships.md)): a fine
hull, houses with deck edges and front windows, the fittings at bow and stern, draft marks,
and the cargo gear of their type. The river ships share `riverFittings` (bollards along both
sides, bow anchor, rubbing strake, draft marks) and `riverAft` (the accommodation, the
wheelhouse on its lift, the car on the roof, the radar mast).

Notes:

- **Container ships** carry a `load` parameter: full (stacks on the hatch covers) or empty
  (the covers on their coamings alone). Each stack is one row of boxes (2.5 m) in two colours,
  its height and colours from a fixed seed, with lashing bridges in the bay gaps. The Triple E has its island bridge forward of midships and twin uptakes aft,
  Emma Maersk the bridge two-thirds forward, MSC Gulsun the bridge well forward.
- **Tankers** share the deck (`tankDeck`): cargo lines on their supports, the red fire main,
  the catwalk on its posts, the manifold with its crossovers, the hose cranes, the tank hatches,
  the vent risers and the foam monitor platform; liveries recolour the hull. The Seawise Giant is at her lengthened 458.45 m.
- **Gas carriers**: the Moss carrier is drawn after the photographed Gulf Energy: five tank
  covers nearly touching at a 40 m pitch, each a skirt from the deck to the walkway round the
  sphere's equator (4 m up, closed, railed) and a dome 12 m over it (`spheres` with `cap` and
  `ring`); the pipe rack over their crowns from the house to the forecastle, its cargo and vapour
  lines on cross beams, resting on legs on each cover and on braced trestles in the gaps with
  their vent masts; the tank domes with their gooseneck vents; the fire main and deck line on
  supports; the manifolds, the cargo machinery house to starboard with its hose crane; the
  accommodation tower with the funnel on a low deckhouse aft of it; the forward mast on its
  deckhouse. Its distant model, as before, has room for the hull and the five covers only. The Q-Max's membrane trunk deck with its domes, walkway, vent
  masts and compressor house; a
  pressurised LPG carrier with three pairs of cylindrical tanks (the list's "LPG Carrier" is
  read as that type, not a 225 m VLGC).
- **Bulkers** carry side-rolling hatch covers on coamings, ridged and ribbed, and hold vents;
  the Handysize its four cranes on pedestals with their cabs; the lakers their pilothouse at
  the bow, the self-unloader its 79 m boom stowed along the deck.
- **Ro-ro and car carriers**: the PCTC is a box of car decks to 37 m with its quarter ramp
  stowed; the ro-ro ship carries trailers when loaded.
- **Heavy lift**: Boka Vanguard with its forward house and helideck; loaded it carries a jack-up
  rig's hull and legs.
- **Liberty and Victory ships**: three-island hulls with bulwarks, midship houses, kingposts
  and derricks with their mast houses, cowl ventilators; the Liberty's gun tubs fore and aft.
- **River cargo**: the Europaschiff (containers or closed hatches), the Rhine tanker, a Europa II
  push barge (coal heaped or light: its draft changes, and its `draftFrac` with it), the Yangtze
  ship and the Volgo-Don.

## Service ships (`worldShipsService.ts`)

| id | title | L x B x H (m) | draft (draftFrac) | bow / stern | triangles (LOD) | params |
|---|---|---|---|---|---|---|
| `veh-ship-cable-layer` | Cable Layer | 140.0 x 30.0 x 38.4 | 7.0 (0.1823) | raked / transom | 7530 (99) | - |
| `veh-ship-ocean-tug` | Ocean-Going Tug | 80.0 x 18.0 x 30.4 | 6.5 (0.2138) | bulbous / transom | 6142 (99) | livery: black, red, blue |
| `veh-ship-harbour-tug` | Harbour Tug | 32.0 x 12.8 x 15.8 | 3.6 (0.2278) | raked / transom | 5202 (99) | livery: red, black, green |
| `veh-ship-towboat` | Mississippi Towboat | 60.0 x 16.0 x 20.8 | 2.7 (0.1298) | barge / transom | 5550 (94) | - |
| `veh-ship-stern-trawler` | Stern Trawler | 70.0 x 15.0 x 27.4 | 6.5 (0.2372) | bulbous / transom | 5588 (99) | livery: red, blue, green |
| `veh-ship-purse-seiner` | Tuna Purse Seiner | 80.0 x 14.0 x 33.5 | 6.0 (0.1791) | raked / transom | 5345 (99) | - |
| `veh-ship-shrimp-trawler` | Shrimp Trawler | 23.0 x 7.0 x 14.2 | 2.7 (0.1901) | raked / transom | 3368 (93) | - |
| `veh-ship-lobster-boat` | Maine Lobster Boat | 12.0 x 4.2 x 6.0 | 1.1 (0.1833) | raked / transom | 3281 (93) | colour: white, green, blue, red, yellow |
| `veh-ship-arktika` | Arktika Class Icebreaker | 159.6 x 30.0 x 47.6 | 11.0 (0.2311) | ice / transom | 8472 (99) | - |
| `veh-ship-polarstern` | Polarstern | 118.0 x 25.0 x 41.0 | 11.2 (0.2732) | ice / transom | 6349 (99) | - |
| `veh-ship-attenborough` | RRS Sir David Attenborough | 128.9 x 24.0 x 40.4 | 7.5 (0.1856) | ice / transom | 6618 (99) | - |
| `veh-ship-hopper-dredger` | Trailing Suction Hopper Dredger | 150.0 x 32.0 x 37.4 | 11.0 (0.2941) | bulbous / transom | 7048 (99) | - |
| `veh-ship-supply-vessel` | Platform Supply Vessel | 89.0 x 19.0 x 30.0 | 6.3 (0.21) | raked / transom | 5427 (99) | livery: red, blue, orange |
| `veh-ship-anchor-handler` | Anchor Handling Tug | 91.0 x 22.0 x 33.9 | 7.8 (0.2301) | raked / transom | 5591 (99) | - |
| `veh-ship-crane-vessel` | Semi-Submersible Crane Vessel | 220.0 x 102.0 x 184.1 | 12.0 (0.0652) | barge / sternwheel, twin | 15012 (94) | - |
| `veh-ship-drillship` | Drillship | 228.0 x 42.0 x 96.0 | 12.0 (0.125) | raked / transom | 9560 (93) | - |
| `veh-ship-fireboat` | Fire Fighter | 40.5 x 9.1 x 14.5 | 3.0 (0.2062) | raked / cruiser | 4818 (99) | - |
| `veh-ship-rnli-shannon` | RNLI Shannon Class | 13.6 x 4.5 x 5.8 | 0.9 (0.1552) | raked / transom | 2672 (93) | - |
| `veh-ship-pilot-boat` | Pilot Boat | 17.0 x 5.5 x 6.7 | 1.4 (0.2105) | raked / transom | 2736 (93) | - |

All 19 are detailed ships:
fine hulls, detailed houses with radomes, monkey-island rails and fire monitors, the
fittings, and their working gear - the tugs' winch drums, towing pins and staples and their
rubber fenders (the harbour tug's sheer band, bow and stern fenders and tyres), the
trawlers' net drums, trawl doors and winches, the seiner's helideck, power block and net
pile, the research ships' laboratory containers and deep-sea winches, the dredger's drag
heads, hopper beams and rainbow nozzle, the offshore vessels' crash rails, cargo and
tuggers, the crane vessel's lattice booms, hook blocks, grillage and fairleads, the cable
layer's carousel rim, tensioner frames, plough and ROV hangar; the drillship's braced derrick,
drill pipe and risers; the fireboat's hose reels and searchlight; the Shannon's fender collar and
the pilot boat's heavy fenders and boarding deck rail.

Notes:

- The **crane vessel** (Sleipnir) is drawn at transit draught: the two pontoons awash, four
  columns on each (the corner ones longest, flared into the pontoon at their feet) reaching up into
  the 13 m deck box over the open water gap; the two cranes on the stern corners - slewing tub, red
  house with its cab, the black A-frame (box legs, girts, platforms, one diagonal per panel) and the
  144 m lattice boom on its foot pins, raised forward, its luffing wires from the A-frame cap and
  the hook block on its falls - with their boom rests on the deck; two red funnel casings each side;
  the 7-deck accommodation forward with lifeboats under davits on platforms along both sides and
  the helideck cantilevered over the bow on its girders, posts and knee braces; red-pedestal
  auxiliary cranes on the bow corners. Its distant model is its own (the twin pontoons' plan rings
  alone would take the kit's 100 triangles): the deck box on its corner columns, the crane houses,
  A-frames and booms.
- The **drillship's** derrick is a tapering four-leg tower with girts, not a lattice.
- The **fishing vessels'** nets are boxes; the shrimp trawler's outriggers are lowered, the
  fishing cutter's (small module) raised.
- Icebreakers and research ships have an ice bow; Polarstern and the Attenborough carry stern
  A-frames, Arktika its reactor ventilation stack and helideck aft.

## Deviations

- No hull lettering or company logos (trade marks), funnel colours only.
- Container stacks are one block per row and bay, not single boxes (the 25,000-triangle
  budget would hold about a tenth of a Triple E's 18,000 TEU).
- Railings, ladders and running rigging are left out; cranes are a pedestal, cab
  and a round jib.
- The figures of the generic types (Panamax, VLCC, Aframax, the tugs, the offshore vessels) are
  typical ones, marked approx. in their `SOURCES.md`.
