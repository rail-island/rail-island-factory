// The Chains tab's data (docs/site/chains.md): the supply chain the catalog's
// records describe - each building's `game.traffic` and each vehicle's
// `game.capacity` (docs/models/traffic.md) - as a graph laid out in columns, the
// cards a node opens, and the phone's list of chains. Pure functions: no Solid, no
// DOM, so test/chains.test.ts drives them on a synthetic catalog. Nothing here is
// placed by hand: a new commodity, building or vehicle in the export lands in the
// graph by its numbers alone.

import type { CatalogRecord } from "../generator/catalog.ts";
import type { BuildingTrafficFields, Commodity, TrafficVariant, VehicleCapacityFields } from "../generator/traffic.ts";
import { effectiveParams } from "./catalogQuery";

/** The commodities in the order every list shows them (generator/traffic.ts COMMODITIES; test/chains.test.ts keeps the two equal). */
export const COMMODITY_ORDER = ["grain", "wood", "coal", "iron-ore", "oil", "food", "steel", "fuel", "goods", "mail"] as const satisfies readonly Commodity[];
// a compile error here when traffic.ts gains a commodity this list lacks
const _complete: Exclude<Commodity, (typeof COMMODITY_ORDER)[number]> extends never ? true : never = true;
void _complete;

/** A commodity's place in the chain (generator/traffic.ts COMMODITY_KINDS). */
export type CommodityKind = "raw" | "processed" | "town";
export const COMMODITY_KIND: Readonly<Record<Commodity, CommodityKind>> = {
  grain: "raw",
  wood: "raw",
  coal: "raw",
  "iron-ore": "raw",
  oil: "raw",
  food: "processed",
  steel: "processed",
  fuel: "processed",
  goods: "processed",
  mail: "town",
};

/** What the chain reads of a record. */
export type ChainRecord = Pick<CatalogRecord, "id" | "title" | "draft" | "params" | "game">;

/** "iron-ore" -> "Iron ore". */
export function commodityLabel(c: string): string {
  const s = c.replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "iron-ore" -> "iron ore", for a list inside a sentence. */
function lower(c: string): string {
  return c.replace(/-/g, " ");
}

/** A number as the cards print it: at most two decimals, trailing zeros dropped. */
export function formatAmount(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** "3 t/h" or "3-6 t/h": the range of a set of numbers. */
function range(values: readonly number[], unit: string): string {
  const lo = Math.min(...values), hi = Math.max(...values);
  return lo === hi ? `${formatAmount(lo)}${unit}` : `${formatAmount(lo)}-${formatAmount(hi)}${unit}`;
}

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

// ------------------------------------------------------------- reading the records

type Block<F> = F & { variants?: TrafficVariant<F>[] };

/**
 * Every selection a block names - its defaults and each variant - resolved the way
 * the game resolves them (generator/traffic.ts resolvedNumbers): the design's
 * fields, then each variant whose every parameter matches, later ones winning.
 */
export function selectionsOf<F extends object>(record: Pick<CatalogRecord, "params">, block: Block<F>): F[] {
  const { variants, ...base } = block;
  const resolve = (given: Record<string, string>): F => {
    const values = effectiveParams(record, given);
    let out = { ...base } as F;
    for (const v of variants ?? []) {
      const { params, ...f } = v;
      if (Object.entries(params).every(([k, x]) => values[k] === x)) out = { ...out, ...f };
    }
    return out;
  };
  return [resolve({}), ...(variants ?? []).map((v) => resolve(v.params))];
}

/** One recipe a building runs, by its signature (output and inputs), with its rates and stocks over its selections. */
interface RecipeUse {
  key: string;
  output: string;
  inputs: Array<[string, number]>;
  rates: number[];
  stocks: number[];
}

/** What one building does in the chain, over all its selections. */
interface BuildingFacts {
  id: string;
  title: string;
  draft: boolean;
  /** Made from nothing: tonnes per hour by commodity, every selection's rate. */
  produces: Map<string, number[]>;
  /** Consumed on delivery. */
  accepts: Set<string>;
  recipes: Map<string, RecipeUse>;
}

/** What one vehicle carries: its tonnes by commodity, every selection's. */
interface VehicleFacts {
  id: string;
  title: string;
  draft: boolean;
  tonnes: Map<string, number[]>;
}

function recipeKey(output: string, inputs: ReadonlyArray<[string, number]>): string {
  return `${output}<${inputs.map(([c, n]) => `${c}:${n}`).join(",")}`;
}

function buildingFacts(r: ChainRecord): BuildingFacts | null {
  const block = r.game?.traffic as Block<BuildingTrafficFields> | undefined;
  if (!block) return null;
  const facts: BuildingFacts = { id: r.id, title: r.title, draft: !!r.draft, produces: new Map(), accepts: new Set(), recipes: new Map() };
  for (const f of selectionsOf(r, block)) {
    for (const [c, n] of Object.entries(f.produces ?? {})) if (typeof n === "number" && n > 0) push(facts.produces, c, n);
    for (const c of f.accepts ?? []) facts.accepts.add(c);
    const p = f.processes;
    if (p) {
      const inputs = Object.entries(p.inputs ?? {})
        .filter((e): e is [string, number] => typeof e[1] === "number")
        .sort((a, b) => order(a[0]) - order(b[0]) || a[0].localeCompare(b[0]));
      const key = recipeKey(p.output, inputs);
      const use = facts.recipes.get(key) ?? { key, output: p.output, inputs, rates: [], stocks: [] };
      use.rates.push(p.rate);
      use.stocks.push(p.stock);
      facts.recipes.set(key, use);
    }
  }
  return facts.produces.size || facts.accepts.size || facts.recipes.size ? facts : null;
}

function vehicleFacts(r: ChainRecord): VehicleFacts | null {
  const block = r.game?.capacity as Block<VehicleCapacityFields> | undefined;
  if (!block) return null;
  const facts: VehicleFacts = { id: r.id, title: r.title, draft: !!r.draft, tonnes: new Map() };
  for (const f of selectionsOf(r, block)) if ((f.tonnes ?? 0) > 0) for (const c of f.commodities ?? []) push(facts.tonnes, c, f.tonnes!);
  return facts.tonnes.size ? facts : null;
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const list = m.get(k);
  if (list) list.push(v);
  else m.set(k, [v]);
}

/** A commodity's place in the order: the known ones first, any other after them. */
function order(c: string): number {
  const i = (COMMODITY_ORDER as readonly string[]).indexOf(c);
  return i < 0 ? COMMODITY_ORDER.length : i;
}

function byOrder(a: string, b: string): number {
  return order(a) - order(b) || a.localeCompare(b);
}

// ------------------------------------------------------------- the graph

export type NodeKind = "producer" | "commodity" | "processor" | "consumer";

/** A node of the graph: a commodity, or the buildings that play one role. */
export interface ChainNode {
  /** Stable and URL-safe: the commodity id, `make-<raw>`, `process-<output>[-n]`, `towns` or `takes-<model>`. */
  id: string;
  kind: NodeKind;
  title: string;
  /** The short lines under the title. */
  lines: string[];
  /** The commodities the node is about: its own (a commodity), what it makes and takes (an industry). */
  commodities: string[];
  /** A commodity's kind (commodity nodes only). */
  commodityKind?: CommodityKind;
  /** The building designs in this role (industry nodes). */
  buildings: string[];
  /** A processor's recipe signature. */
  recipe?: string;
  /** Nothing plays the role yet: a raw commodity's producer, or a processed commodity no recipe makes. */
  empty: boolean;
  /** Every design in it is a workshop draft. */
  draft: boolean;
  /** Its column (0 = the producers) and box, px. */
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChainEdge {
  from: string;
  to: string;
  /** The commodity that flows along it. */
  commodity: string;
  /** An SVG path from the right edge of `from` to the left edge of `to`. */
  path: string;
}

/** A small drawing of its own: the nodes' boxes and the edges between them. */
export interface ChainDrawing {
  nodes: Array<Pick<ChainNode, "id" | "x" | "y" | "w" | "h">>;
  edges: ChainEdge[];
  width: number;
  height: number;
}

/** One chain of the phone's list: "Wood + Coal + Iron ore -> Steel -> Goods -> Towns". */
export interface ChainPath {
  /** Its end commodity (or "mail"). */
  id: string;
  title: string;
  /** Node ids, from the raw end to the consumers. */
  steps: string[];
}

export interface ChainGraph {
  /** Every node, the main graph's and the mail loop's, by id. */
  nodes: Map<string, ChainNode>;
  edges: ChainEdge[];
  /** The three bands' left edges and widths, px: raw materials, processing, consumers. */
  bands: Array<{ title: string; x: number; w: number }>;
  width: number;
  height: number;
  /** Mail, drawn apart as a town-to-town loop; null when no building makes mail. */
  mail: ChainDrawing | null;
  chains: ChainPath[];
  /** Internal facts the cards read. */
  buildingFacts: Map<string, BuildingFacts>;
  vehicleFacts: Map<string, VehicleFacts>;
}

/** The layout's sizes, px. */
export const LAYOUT = { industryW: 176, commodityW: 120, industryH: 76, commodityH: 44, gap: 44, pitch: 92, bandGap: 20 } as const;

function idPart(s: string): string {
  return s.replace(/^proc-(building-)?/, "").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

/** The supply chain of a catalog, laid out. */
export function chainGraph(records: readonly ChainRecord[]): ChainGraph {
  const buildings = new Map<string, BuildingFacts>();
  const vehicles = new Map<string, VehicleFacts>();
  for (const r of records) {
    const b = buildingFacts(r);
    if (b) buildings.set(r.id, b);
    const v = vehicleFacts(r);
    if (v) vehicles.set(r.id, v);
  }
  const sortedBuildings = [...buildings.values()].sort((a, b) => collator.compare(a.title, b.title) || a.id.localeCompare(b.id));

  // every commodity named anywhere, and its kind
  const outputs = new Set<string>();
  const madeFromNothing = new Set<string>();
  const named = new Set<string>(COMMODITY_ORDER);
  for (const b of sortedBuildings) {
    for (const c of b.produces.keys()) named.add(c), madeFromNothing.add(c);
    for (const c of b.accepts) named.add(c);
    for (const r of b.recipes.values()) {
      outputs.add(r.output);
      named.add(r.output);
      for (const [c] of r.inputs) named.add(c);
    }
  }
  for (const v of vehicles.values()) for (const c of v.tonnes.keys()) named.add(c);
  const kindOf = (c: string): CommodityKind =>
    (COMMODITY_KIND as Record<string, CommodityKind>)[c] ?? (outputs.has(c) ? "processed" : madeFromNothing.has(c) ? "raw" : "processed");
  const commodities = [...named].sort(byOrder);
  const carriersOf = (c: string) => [...vehicles.values()].filter((v) => v.tonnes.has(c)).length;

  const nodes = new Map<string, ChainNode>();
  const add = (n: Omit<ChainNode, "col" | "x" | "y" | "w" | "h">) => {
    const node: ChainNode = { ...n, col: 0, x: 0, y: 0, w: 0, h: 0 };
    nodes.set(n.id, node);
    return node;
  };
  const draftOf = (ids: readonly string[]) => ids.length > 0 && ids.every((id) => buildings.get(id)!.draft);
  const vehiclesLine = (c: string) => {
    const n = carriersOf(c);
    return n === 0 ? "no vehicle carries it" : n === 1 ? "1 vehicle" : `${n} vehicles`;
  };

  // commodity nodes, and a producer node per raw commodity
  for (const c of commodities) {
    const kind = kindOf(c);
    const makers = sortedBuildings.filter((b) => b.produces.has(c) || [...b.recipes.values()].some((r) => r.output === c)).map((b) => b.id);
    add({
      id: c,
      kind: "commodity",
      title: commodityLabel(c),
      lines: [kind === "processed" && !makers.length ? "no recipe yet" : vehiclesLine(c)],
      commodities: [c],
      commodityKind: kind,
      buildings: [],
      empty: kind === "processed" && !makers.length,
      draft: false,
    });
    if (kind !== "raw") continue;
    const producers = sortedBuildings.filter((b) => b.produces.has(c));
    const ids = producers.map((b) => b.id);
    add({
      id: `make-${c}`,
      kind: "producer",
      title: producers.length ? producers.map((b) => b.title).join(", ") : "No producer yet",
      lines: producers.length ? [`${countLine(ids.length)} - ${range(producers.flatMap((b) => b.produces.get(c)!), " t/h")}`] : [`nothing makes ${lower(c)}`],
      commodities: [c],
      buildings: ids,
      empty: !producers.length,
      draft: draftOf(ids),
    });
  }

  // processors: one node per recipe signature
  const recipes = new Map<string, { use: RecipeUse; ids: string[]; rates: number[]; stocks: number[] }>();
  for (const b of sortedBuildings) {
    for (const r of b.recipes.values()) {
      const entry = recipes.get(r.key) ?? { use: r, ids: [], rates: [], stocks: [] };
      entry.ids.push(b.id);
      entry.rates.push(...r.rates);
      entry.stocks.push(...r.stocks);
      recipes.set(r.key, entry);
    }
  }
  const recipeList = [...recipes.values()].sort((a, b) => byOrder(a.use.output, b.use.output) || a.use.key.localeCompare(b.use.key));
  const perOutput = new Map<string, number>();
  const processorOf = new Map<string, ChainNode>();
  for (const r of recipeList) {
    const n = (perOutput.get(r.use.output) ?? 0) + 1;
    perOutput.set(r.use.output, n);
    const node = add({
      id: `process-${idPart(r.use.output)}${n > 1 ? `-${n}` : ""}`,
      kind: "processor",
      title: r.ids.map((id) => buildings.get(id)!.title).join(", "),
      lines: [recipeText(r.use), `${range(r.rates, " t/h")} - stock ${range(r.stocks, " t")}`],
      commodities: [...r.use.inputs.map(([c]) => c), r.use.output],
      buildings: r.ids,
      recipe: r.use.key,
      empty: false,
      draft: draftOf(r.ids),
    });
    processorOf.set(r.use.key, node);
  }

  // consumers: the towns (the buildings that make mail) together, every other taker on its own
  const towns = sortedBuildings.filter((b) => b.produces.has("mail"));
  const townTakes = [...new Set(towns.flatMap((b) => [...b.accepts]))].sort(byOrder);
  if (towns.length) {
    add({
      id: "towns",
      kind: "consumer",
      title: "Towns",
      lines: [`${countLine(towns.length)} - homes, shops, offices`, `take ${townTakes.map(lower).join(", ") || "nothing"}`],
      commodities: [...new Set(["mail", ...townTakes])].sort(byOrder),
      buildings: towns.map((b) => b.id),
      empty: false,
      draft: draftOf(towns.map((b) => b.id)),
    });
  }
  const sinks = sortedBuildings.filter((b) => !b.produces.has("mail") && b.accepts.size);
  for (const b of sinks) {
    const takes = [...b.accepts].sort(byOrder);
    add({
      id: `takes-${idPart(b.id)}`,
      kind: "consumer",
      title: b.title,
      lines: [`takes ${takes.map(lower).join(", ")}`],
      commodities: takes,
      buildings: [b.id],
      empty: false,
      draft: b.draft,
    });
  }

  // edges (the mail loop's apart)
  const edges: Array<Omit<ChainEdge, "path">> = [];
  for (const c of commodities) if (nodes.get(`make-${c}`)) edges.push({ from: `make-${c}`, to: c, commodity: c });
  for (const r of recipeList) {
    const p = processorOf.get(r.use.key)!;
    for (const [c] of r.use.inputs) if (kindOf(c) !== "town") edges.push({ from: c, to: p.id, commodity: c });
    edges.push({ from: p.id, to: r.use.output, commodity: r.use.output });
  }
  const consumers = [...nodes.values()].filter((n) => n.kind === "consumer");
  for (const n of consumers) for (const c of n.commodities) if (kindOf(c) !== "town" && (n.id !== "towns" || townTakes.includes(c))) edges.push({ from: c, to: n.id, commodity: c });

  // columns: producers, raw commodities, then a processor column and its outputs' per depth, then the consumers
  const depth = new Map<string, number>();
  for (let pass = 0; pass < recipeList.length + 1; pass++) {
    for (const r of recipeList) {
      const p = processorOf.get(r.use.key)!;
      let d = 0;
      for (const [c] of r.use.inputs) {
        for (const q of recipeList) if (q.use.output === c && q !== r && depth.has(processorOf.get(q.use.key)!.id)) d = Math.max(d, depth.get(processorOf.get(q.use.key)!.id)! + 1);
      }
      depth.set(p.id, Math.min(d, recipeList.length));
    }
  }
  const maxDepth = Math.max(-1, ...depth.values());
  const consumerCol = 2 + 2 * (maxDepth + 1);
  for (const n of nodes.values()) {
    if (n.kind === "producer") n.col = 0;
    else if (n.kind === "processor") n.col = 2 + 2 * depth.get(n.id)!;
    else if (n.kind === "consumer") n.col = consumerCol;
    else if (n.commodityKind === "raw") n.col = 1;
    else if (n.commodityKind === "processed") {
      const makers = recipeList.filter((r) => r.use.output === n.id).map((r) => depth.get(processorOf.get(r.use.key)!.id)!);
      n.col = 3 + 2 * (makers.length ? Math.max(...makers) : 0);
    }
  }
  const mainNodes = [...nodes.values()].filter((n) => n.commodityKind !== "town");

  // x by column
  const colWidth = (col: number) => (col === consumerCol || col % 2 === 0 ? LAYOUT.industryW : LAYOUT.commodityW);
  const colX: number[] = [];
  let x = 0;
  for (let col = 0; col <= consumerCol; col++) {
    colX.push(x);
    x += colWidth(col) + LAYOUT.gap;
  }
  const width = x - LAYOUT.gap;
  for (const n of mainNodes) {
    n.x = colX[n.col]!;
    n.w = colWidth(n.col);
    n.h = n.kind === "commodity" ? LAYOUT.commodityH : LAYOUT.industryH;
  }

  // y: the raw commodities in order, each producer beside its commodity; every later
  // column near the mean of what feeds it, pushed down so no two boxes overlap
  const centre = new Map<string, number>();
  const incoming = (id: string) => edges.filter((e) => e.to === id).map((e) => centre.get(e.from)).filter((v): v is number => v !== undefined);
  const seq = new Map(mainNodes.map((n, i) => [n.id, i]));
  for (let col = 1; col <= consumerCol; col++) {
    const inCol = mainNodes.filter((n) => n.col === col);
    const target = (n: ChainNode) => {
      const feeds = incoming(n.id);
      return col === 1 || !feeds.length ? Number.POSITIVE_INFINITY : feeds.reduce((s, v) => s + v, 0) / feeds.length;
    };
    const placed = inCol.map((n) => ({ n, t: target(n) })).sort((a, b) => a.t - b.t || seq.get(a.n.id)! - seq.get(b.n.id)!);
    let next = LAYOUT.pitch / 2;
    for (const { n, t } of placed) {
      const c = Number.isFinite(t) ? Math.max(t, next) : next;
      centre.set(n.id, c);
      next = c + LAYOUT.pitch;
    }
    if (col === 1) for (const n of mainNodes.filter((m) => m.col === 0)) centre.set(n.id, centre.get(n.commodities[0]!) ?? LAYOUT.pitch / 2);
  }
  let height = 0;
  for (const n of mainNodes) {
    const c = centre.get(n.id) ?? LAYOUT.pitch / 2;
    n.y = Math.round(c - n.h / 2);
    height = Math.max(height, Math.round(c + LAYOUT.pitch / 2));
  }
  const pathed = edges.map((e) => ({ ...e, path: edgePath(nodes.get(e.from)!, nodes.get(e.to)!) }));

  const bandX = (from: number, to: number) => ({ x: colX[from]! - LAYOUT.bandGap / 2, w: colX[to]! + colWidth(to) - colX[from]! + LAYOUT.bandGap });
  const bands = [
    { title: "Raw materials", ...bandX(0, 1) },
    ...(maxDepth >= 0 ? [{ title: "Processing", ...bandX(2, consumerCol - 1) }] : []),
    { title: "Consumers", ...bandX(consumerCol, consumerCol) },
  ];

  const graph: ChainGraph = { nodes, edges: pathed, bands, width, height, mail: mailLoop(nodes), chains: [], buildingFacts: buildings, vehicleFacts: vehicles };
  graph.chains = chainPaths(graph);
  return graph;
}

function countLine(n: number): string {
  return n === 1 ? "1 design" : `${n} designs`;
}

/** "1 t iron ore + 0.5 t coal -> 1 t steel". */
function recipeText(r: Pick<RecipeUse, "inputs" | "output">): string {
  return `${r.inputs.map(([c, n]) => `${formatAmount(n)} t ${lower(c)}`).join(" + ")} -> 1 t ${lower(r.output)}`;
}

/** A curve from the right edge of one box to the left edge of another. */
function edgePath(a: Pick<ChainNode, "x" | "y" | "w" | "h">, b: Pick<ChainNode, "x" | "y" | "w" | "h">): string {
  const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
  const dx = Math.max(24, (x2 - x1) / 2);
  return `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
}

/** Mail's own drawing: the towns send it, the towns take it - a loop. */
function mailLoop(nodes: Map<string, ChainNode>): ChainDrawing | null {
  const mail = nodes.get("mail");
  const towns = nodes.get("towns");
  if (!mail || !towns) return null;
  const t = { id: "towns", x: 0, y: 12, w: LAYOUT.industryW, h: LAYOUT.industryH };
  const m = { id: "mail", x: LAYOUT.industryW + 3 * LAYOUT.gap, y: 12 + (LAYOUT.industryH - LAYOUT.commodityH) / 2, w: LAYOUT.commodityW, h: LAYOUT.commodityH };
  const bottom = t.y + t.h + 28;
  // back from the mail's bottom to the towns' bottom, under both boxes
  const back = `M${m.x + m.w / 2} ${m.y + m.h} C${m.x + m.w / 2} ${bottom} ${t.x + t.w / 2} ${bottom} ${t.x + t.w / 2} ${t.y + t.h}`;
  return {
    nodes: [t, m],
    edges: [
      { from: "towns", to: "mail", commodity: "mail", path: edgePath(t, m) },
      { from: "mail", to: "towns", commodity: "mail", path: back },
    ],
    width: m.x + m.w,
    height: bottom + 8,
  };
}

/**
 * The phone's list: one chain per commodity a consumer takes, from its raw
 * materials through its processors to its consumers, then mail.
 */
function chainPaths(g: ChainGraph): ChainPath[] {
  const out: ChainPath[] = [];
  const edgesTo = (id: string) => g.edges.filter((e) => e.to === id);
  const ends = [...g.nodes.values()].filter((n) => n.kind === "commodity" && n.commodityKind !== "town" && g.edges.some((e) => e.from === n.id && g.nodes.get(e.to)!.kind === "consumer"));
  for (const end of ends) {
    const seen = new Set<string>();
    const walk = (id: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      for (const e of edgesTo(id)) walk(e.from);
    };
    walk(end.id);
    const at = (id: string) => g.nodes.get(id)!;
    // a producer just before its commodity, then column by column, top to bottom
    const key = (id: string) => {
      const n = at(id);
      return [n.kind === "producer" ? 1 : n.col, n.y + n.h / 2, n.kind === "producer" ? 0 : 1] as const;
    };
    const upstream = [...seen].sort((a, b) => {
      const ka = key(a), kb = key(b);
      return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
    });
    const takers = g.edges.filter((e) => e.from === end.id && at(e.to).kind === "consumer").map((e) => e.to);
    const stages = new Map<number, string[]>();
    for (const id of upstream) if (at(id).kind === "commodity") push(stages, at(id).col, at(id).title);
    const takerText = takers.length <= 2 ? takers.map((id) => at(id).title).join(", ") : `${takers.length} consumers`;
    out.push({ id: end.id, title: [...[...stages.values()].map((s) => s.join(" + ")), takerText].join(" -> "), steps: [...upstream, ...takers] });
  }
  if (g.mail) out.push({ id: "mail", title: "Mail: town to town", steps: ["towns", "mail"] });
  return out;
}

// ------------------------------------------------------------- the cards

export interface BuildingCard {
  id: string;
  title: string;
  draft: boolean;
  /** What it does in this role: "Makes 3-6 t/h", a recipe, "Takes food, goods". */
  line: string;
}

export interface VehicleCard {
  id: string;
  title: string;
  draft: boolean;
  /** The most tonnes it carries of the commodity, over its variants. */
  tonnes: number;
  line: string;
}

export interface CardGroup {
  title: string;
  /** Shown when the group has no card. */
  empty: string;
  buildings?: BuildingCard[];
  vehicles?: VehicleCard[];
}

/**
 * The cards a node opens: a commodity its carriers (the vehicles that may take it), an
 * industry or a consumer its building designs. What makes and takes a commodity is
 * read from the graph's lit edges, so the commodity's cards hold only vehicles.
 */
export function nodeCards(g: ChainGraph, id: string): CardGroup[] {
  const node = g.nodes.get(id);
  if (!node) return [];
  if (node.kind === "commodity") return [{ title: `Carries ${lower(id)}`, empty: `No vehicle carries ${lower(id)} yet.`, vehicles: carriers(g, id) }];
  const line = (bid: string): string => {
    const b = g.buildingFacts.get(bid)!;
    if (node.kind === "producer") return `Makes ${range(b.produces.get(node.commodities[0]!)!, " t/h")}`;
    if (node.kind === "processor") {
      const r = node.recipe ? b.recipes.get(node.recipe) : undefined;
      return r ? `${recipeText(r)}, ${range(r.rates, " t/h")}` : "";
    }
    return `Takes ${[...b.accepts].sort(byOrder).map(lower).join(", ")}`;
  };
  const cards: BuildingCard[] = node.buildings.map((bid) => {
    const b = g.buildingFacts.get(bid)!;
    return { id: b.id, title: b.title, draft: b.draft, line: line(bid) };
  });
  cards.sort((a, b) => collator.compare(a.title, b.title) || a.id.localeCompare(b.id));
  return [
    {
      title: node.kind === "producer" ? "Producers" : node.kind === "processor" ? "Processors" : "Buildings",
      empty: node.kind === "producer" ? `No producer yet: nothing makes ${lower(node.commodities[0]!)}.` : "No building yet.",
      buildings: cards,
    },
  ];
}

/** The vehicles that may carry a commodity, the biggest first. */
export function carriers(g: ChainGraph, c: string): VehicleCard[] {
  const out: VehicleCard[] = [];
  for (const v of g.vehicleFacts.values()) {
    const tonnes = v.tonnes.get(c);
    if (!tonnes) continue;
    const all = [...v.tonnes.keys()].sort(byOrder);
    out.push({ id: v.id, title: v.title, draft: v.draft, tonnes: Math.max(...tonnes), line: `${range(tonnes, " t")} - ${all.map(lower).join(", ")}` });
  }
  return out.sort((a, b) => b.tonnes - a.tonnes || collator.compare(a.title, b.title) || a.id.localeCompare(b.id));
}

/** The edges that touch a node, for its highlight. */
export function touches(e: Pick<ChainEdge, "from" | "to">, id: string | null): boolean {
  return id !== null && (e.from === id || e.to === id);
}
