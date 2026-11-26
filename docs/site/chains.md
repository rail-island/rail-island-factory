# The Chains tab

**Covers** - the site's Chains tab next to Workshop: the supply-chain graph on a wide screen (three bands, the mail loop) with its side panel, the cards a node opens, the phone's list of chains, how the graph is derived and laid out from the catalog's records, its URL and its tests.
**Code** - `src/chains.ts` (`chainGraph`, `nodeCards`, `carriers`, `selectionsOf`, `COMMODITY_ORDER`, `COMMODITY_KIND`, `LAYOUT`), `src/ChainsView.tsx`, `src/App.tsx`, `src/catalogQuery.ts` (`Section`, `SECTIONS`, `sectionLabel`, `ViewState.chain`), `src/factory.css` (`factory-chains*`, `factory-chaincard*`, `factory-chainlist*`), `vite.config.ts` (the test-mode server compile), `test/chains.test.ts`, `test/chainsView.test.ts`, `test/catalogQuery.test.ts`
**See also** - [../models/traffic.md](../models/traffic.md) (the commodities, roles and recipes the tab draws), [catalog-site.md](catalog-site.md), [workshop.md](workshop.md), [seo-pages.md](seo-pages.md)

## What it shows

The tab draws the supply chain the exported numbers describe
([../models/traffic.md](../models/traffic.md)): what makes each commodity, which
recipes turn it into another and who takes it in the end, with the building designs
and the vehicles that play each part. It lists no model of its own, so it has no
count beside its name, no search, chips or totals: the toolbar holds only the
Catalog | Workshop | Chains switch. The app bar reads "Rail Island Supply Chains".

### Wide screen (900 px and up): the graph

Three bands, left to right, each titled:

| Band | Columns | Nodes |
|---|---|---|
| Raw materials | producers, raw commodities | per raw commodity, a **producer** box (its designs' titles, "N designs - 36-1800 t/min") beside the commodity's pill |
| Processing | per recipe depth: processors, then their outputs | a **processor** box per recipe ("0.5 t coal + 1 t iron ore -> 1 t steel", "360-540 t/min - stock 3600-5400 t"), then the processed commodity's pill |
| Consumers | one | **Towns** (every building that makes mail: homes, shops, offices, landmarks) and each other taker on its own (a tank farm, a power plant, a warehouse) |

Curves with arrowheads join them: producer -> raw commodity -> processor -> output
-> a later processor or a consumer; a raw commodity a sink takes directly (coal at
the coal power plant) runs straight to the consumers. A commodity pill says how many
vehicles may carry it. The graph is as wide as its columns (about 1,300 px with two
recipe depths) and scrolls sideways inside the page when the window is narrower.

**Mail** is drawn apart under the graph, as its own small loop: Towns -> Mail, and a
curve back from Mail to Towns; it is outside the industry chain.

**Nothing to show yet.** A raw commodity no building makes - grain, wood, coal and
iron ore until the farm, mine and logging camp land - gets a dashed "No producer
yet" box ("nothing makes grain"); a processed commodity no recipe makes is a dashed
pill reading "no recipe yet"; a commodity no vehicle carries reads "no vehicle
carries it". A node whose every design is a workshop draft has a dashed outline in
the accent colour.

**The side panel.** The graph and the mail loop fill the left column; a panel on the
right (28 % of the window, 300-420 px) holds the picked node's cards, so a click never
sends the reader scrolling down. The panel stays in view under the sticky toolbar
(`position: sticky`) and scrolls on its own when its cards are taller than the
window; the node's title and Close stay at its top. With nothing picked it holds a
hint: "Pick a commodity to see the vehicles that may carry it, or an industry or a
town to see its building designs." The graph scrolls sideways inside the left column
when the column is narrower than the graph.

**Picking a node** (a click on any box or pill) selects it: its outline and the
edges that touch it light up, and its cards fill the panel under the node's title
with a Close link. A second click on it, or Close, clears the selection.

### Phone (below 900 px): the list of chains

One chain per commodity some consumer takes, in the commodity order, then mail:

- *Coal -> Power generation plant*
- *Grain -> Food -> 3 consumers*
- *Oil -> Fuel -> 3 consumers*
- *Wood + Coal + Iron ore -> Steel -> Goods -> 3 consumers*
- *Mail: town to town*

The title joins a column's commodities with " + " and the columns with " -> ", then
names the consumers (two at most, else their count). Under it, its **steps**, top to
bottom: each raw commodity's producer just before the commodity, then the processors
and their outputs column by column, then the consumers. Each step is a full-width
button (at least 44 px tall) with the node's title and lines; a tap opens that
node's cards in place under it, a second tap closes them. A step shared by several
chains (Towns) opens in the chain it was tapped in; opened from a link, in the first
chain that has it.

## The cards

`nodeCards(graph, id)` gives the one group a node opens, a heading with its count.
What the reader clicked decides what it lists: a commodity its vehicles, anything
else its buildings. What makes and takes a commodity is not repeated as cards: the
lit edges show it in the graph, and a click on the maker opens its designs.

| Node | Group |
|---|---|
| A commodity | **Carries <commodity>**: the vehicles that may carry it |
| A producer | **Producers**: its designs, "Makes 36-72 t/min" |
| A processor | **Processors**: its designs, with their recipe and rate ("0.5 t coal + 1 t iron ore -> 1 t steel, 360-540 t/min") |
| Towns or another consumer | **Buildings**: its designs, "Takes food, goods, mail" |

A building card is a link to the model page: its thumbnail (`Thumb`, so a draft's is
rendered in the browser, [workshop.md](workshop.md)), its title, its line and, on a
draft, the **Workshop draft** badge the model page uses. A vehicle card is the same
with "60 t - oil, fuel": the most tonnes it carries over its variants and every
commodity it may take. Vehicles are listed biggest first; a group shows the first 12
with a **Show all N** button. An empty group says so ("No producer yet: nothing
makes coal.", "No vehicle carries mail yet."). The panel shows one column of cards;
a phone's opened step shows two columns and more, one below 600 px.

Opening a model from a card is a history entry; its page keeps `?section=chains&chain=`
in the URL, so closing it (the app bar's back arrow) returns to the tab with the node
still picked.

## Where the data comes from

Nothing is placed by hand: `chainGraph(records)` reads the `catalog.json` records
the site already loads - every building's `game.traffic` and every vehicle's
`game.capacity`, drafts included - so a new commodity, building or vehicle appears
by its numbers alone.

- **Selections.** A record's block is read at its defaults and at each variant,
  resolved the way the game resolves them (`selectionsOf`, the site's copy of
  `resolvedNumbers` in `generator/traffic.ts`, over `effectiveParams`). A rate
  shown as a range ("360-540 t/min") spans them. Every rate is per minute of game
  time ([../models/traffic.md](../models/traffic.md), "The unit marker"); an amount
  below 0.1 keeps two significant digits (a house's mail, "0.0017"), never 0
  (`formatAmount`).
- **Roles.** A building that `produces` a commodity other than mail is a producer of
  it; one with a `processes` recipe is a processor, one node per recipe signature
  (output and inputs: the two goods factories share one); one that makes mail is a
  town; any other that `accepts` something is a consumer of its own. One building may
  sit in several nodes (the offshore platform makes oil and takes food and goods).
- **Commodities.** Every commodity named anywhere, in `COMMODITY_ORDER` (the site's
  copy of `COMMODITIES`; `src/` may import only types from `generator/`, so the
  type checker fails when the generator gains one the copy lacks and
  `test/chains.test.ts` keeps the two equal), an unknown one after them. Its kind is
  `COMMODITY_KIND`, or for an unknown one: processed when a recipe makes it, raw when
  made from nothing.
- **Carriers.** A vehicle carries a commodity when a selection with `tonnes > 0` lists
  it.

### Layout

Columns: 0 the producers, 1 the raw commodities, then per recipe depth `d` (0 when a
recipe's inputs are all raw, else one more than the deepest recipe making an input)
column `2 + 2d` its processors and `3 + 2d` their outputs (a processed commodity no
recipe makes sits at column 3), then the consumers. Producers and processors are
176 px wide and 76 px tall, commodity pills 120 x 44, 44 px apart (`LAYOUT`). The raw
commodities stack in order on a 92 px pitch with each producer centred beside its
commodity; every later column is ordered by the mean height of what feeds each node
and pushed down so no two boxes overlap. Edges are cubic curves from a box's right
edge to the next one's left edge. Everything is deterministic: the same catalog draws
the same graph.

## URL

The tab is `?section=chains` (the plain `/` page with a query, like the workshop's
`?section=workshop`: neither has a page of its own, so the build prerenders nothing
for it, [seo-pages.md](seo-pages.md)), and the picked node `&chain=<id>`, kept only
with that section. Node ids: the commodity's own id (`steel`), `make-<raw commodity>`
(a producer), `process-<output>` (a processor; `-2`, `-3` for further recipes of
the same output), `towns`, and `takes-<model id without proc-building->` (any other
consumer). An unknown id selects nothing; one that is not lower-case letters, digits
and hyphens is dropped when read. Picking a node is a history entry.

## Tests

`test/chains.test.ts` drives `chainGraph` on a synthetic catalog: the node set, the
columns and depths, no overlapping boxes, the edges (mail kept apart), "No producer
yet", the recipe and rate lines, the towns, the cards (makers, takers and carriers,
a commodity's vehicles only, an industry's or the towns' buildings only, the draft
flag, biggest carrier first), the phone's chains and their steps, and a new
producer landing by its numbers. `test/chainsView.test.ts` renders `ChainsView` to a
string with `solid-js/web`'s `renderToString` - under Vitest the site's components
compile for the server (`vite.config.ts`), the production build is unchanged - and
checks the bands, the node links, the edges, the mail loop, the side panel's hint, a
picked commodity's vehicles and a picked industry's buildings in the panel (each
without the other) with model links and the draft badge, and the phone's list with a
step open.
`test/catalogQuery.test.ts` covers the URL.
