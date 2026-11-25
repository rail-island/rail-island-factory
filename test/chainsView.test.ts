// The Chains tab's markup (src/ChainsView.tsx), rendered to a string: Vitest
// compiles the site's components for the server (vite.config.ts), so the graph, the
// cards and the phone's list are checked without a browser.

import { describe, expect, it } from "vitest";
import { renderToString } from "solid-js/web";
import { ChainsView, type ChainsProps } from "../src/ChainsView";
import { chainGraph, type ChainRecord } from "../src/chains";
import { prepareRows } from "../src/catalogQuery";
import type { CatalogRecord } from "../generator/catalog.ts";

function record(id: string, title: string, game: ChainRecord["game"], draft = false): CatalogRecord {
  return {
    id, title, category: "Industrial", group: "industrial", js: `${id}.js`, thumb: `${id}.png`, license: "CC0", author: "x", source: "x",
    thumbUrl: `thumbs/${id}.png`, jsUrl: `js/${id}.js`, jsBytes: 1, jsGzipBytes: 1, thumbBytes: 1, triangles: 1, vertices: 1, primitives: 1, materials: 1,
    sizeX: 1, sizeY: 1, sizeZ: 1, references: [], game, ...(draft ? { draft: true as const } : {}),
  } as CatalogRecord;
}

const ROWS = prepareRows([
  record("proc-building-pump", "Oil pump", { traffic: { produces: { oil: 3 } } } as ChainRecord["game"]),
  record("proc-building-refinery", "Refinery", { traffic: { processes: { output: "fuel", inputs: { oil: 1 }, rate: 40, stock: 400 } } } as ChainRecord["game"]),
  record("proc-building-house", "House", { traffic: { produces: { mail: 0.1 }, accepts: ["fuel", "mail"] } } as ChainRecord["game"]),
  record("proc-vehicle-tank", "Tank wagon", { capacity: { tonnes: 60, commodities: ["oil", "fuel"] } } as ChainRecord["game"], true),
]);

function render(over: Partial<ChainsProps>): string {
  const graph = chainGraph(ROWS);
  const props: ChainsProps = {
    graph, rows: ROWS, wide: true, selected: null, onSelect: () => {}, hrefSelect: (id) => (id ? `/?section=chains&chain=${id}` : "/?section=chains"),
    onOpen: () => {}, hrefOpen: (r) => `/model/${r.id}/`, ...over,
  };
  return renderToString(() => ChainsView(props)).replace(/ data-hk="[^"]*"/g, "").replace(/<!--[^>]*-->/g, "");
}

describe("the Chains tab", () => {
  it("draws the graph: bands, every node as a link that selects it, edges and the mail loop", () => {
    const html = render({});
    for (const band of ["Raw materials", "Processing", "Consumers"]) expect(html).toContain(band);
    expect(html).toContain('href="/?section=chains&amp;chain=process-fuel"');
    expect(html).toContain("1 t oil -> 1 t fuel");
    // a raw commodity nothing makes yet
    expect(html).toContain("No producer yet");
    expect(html).toMatch(/class="factory-chains__edge ?"[^>]*d="M/);
    expect(html).toContain("Mail between towns");
    // no node picked: no cards
    expect(html).not.toContain("factory-chaincards");
  });

  it("opens a picked node's cards, with links to the models and the draft badge", () => {
    const html = render({ selected: "fuel" });
    expect(html).toContain("factory-chains__node--on");
    expect(html).toContain("factory-chains__edge--on");
    expect(html).toContain("Made by");
    expect(html).toContain('href="/model/proc-building-refinery/"');
    expect(html).toContain("Carries fuel");
    expect(html).toContain('href="/model/proc-vehicle-tank/"');
    expect(html).toContain("60 t - oil, fuel");
    expect(html).toContain("Workshop draft");
    // picking the picked node again clears it
    expect(html).toContain('href="/?section=chains"');
  });

  it("lists the chains on a phone, a picked step open in place", () => {
    const closed = render({ wide: false });
    expect(closed).toContain("factory-chainlist");
    expect(closed).toContain("Oil -> Fuel -> Towns");
    expect(closed).toContain("Mail: town to town");
    expect(closed).not.toContain("factory-chains__canvas");
    const open = render({ wide: false, selected: "process-fuel" });
    expect(open).toContain("factory-chainlist__button--on");
    expect(open).toContain("Processors");
    expect(open).toContain('href="/model/proc-building-refinery/"');
  });
});
