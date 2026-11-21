// Fixtures of the constructs the C# transpiler supports (docs/guide/cs-transpiler.md):
// each exported function returns a JSON value, and `pnpm cs:pilot --fixtures` runs it in
// Node and as transpiled C#, and compares the two exactly. A case covers one construct
// and the edge cases JS gives it; add one with each construct the transpiler learns.

// --- arr.entries() -----------------------------------------------------------------------

export function entriesLoop(): unknown {
  const out: number[] = [];
  for (const [i, x] of [5, 6, 7].entries()) out.push(i * 10 + x);
  return out;
}

/** An array iterator is live: an element pushed during the loop is visited. */
export function entriesLive(): unknown {
  const a = [1, 2];
  const seen: number[] = [];
  for (const [i, x] of a.entries()) {
    if (i === 0) a.push(9);
    seen.push(x);
  }
  return seen;
}

export function entriesObjects(): unknown {
  const names = ["a", "b", "c"];
  const out: string[] = [];
  for (const [i, n] of names.entries()) {
    if (i === 1) continue;
    out.push(`${n}${i}`);
  }
  return out;
}

export function entriesPattern(): unknown {
  const pts: Array<[number, number]> = [[1, 2], [3, 4]];
  const out: number[] = [];
  for (const [, [x, y]] of pts.entries()) out.push(x * y);
  for (const [i] of pts.entries()) out.push(i);
  return out;
}

export function entriesAsValue(): unknown {
  return [...[3, 4].entries(), ...["x"].entries()];
}

// --- switch ------------------------------------------------------------------------------

function classify(k: string): string {
  let out = "";
  switch (k) {
    case "a":
      out += "a";
    // falls through
    case "b": {
      out += "b";
      if (out.length > 1) break;
      out += "!";
      break;
    }
    default:
      out += "d";
    // falls through
    case "c":
      out += "c";
      break;
    case "r":
      return "returned";
  }
  return out;
}

function kind(n: number): string {
  switch (n) {
    case 1: return "one";
    case 2: return "two";
    default: return "many";
  }
}

export function switchCases(): unknown {
  const out: string[] = ["a", "b", "c", "z", "r"].map(classify);
  // `continue` inside a switch continues the loop; `break` in a loop inside a case leaves that loop
  for (let i = 0; i < 4; i++) {
    switch (i % 2) {
      case 0:
        if (i === 2) continue;
        for (let j = 0; j < 9; j++) if (j === 1) break;
        out.push(`even${i}`);
        break;
      default:
        out.push(`odd${i}`);
    }
  }
  return [...out, kind(1), kind(2), kind(7)];
}

// --- rest parameters -----------------------------------------------------------------------

function sum(...xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function label(head: string, ...parts: string[]): string {
  return `${head}:${parts.length}:${parts.join("-")}`;
}

export function restParameters(): unknown {
  const more = [4, 5];
  return [sum(), sum(1, 2, 3), sum(...more), sum(1, ...more, 6), label("h"), label("h", "a", "b"), label("h", ...["x", "y"])];
}

// --- Math with spreads ------------------------------------------------------------------------

export function mathSpreads(): unknown {
  const v = [3, 4, 12];
  const xs = [5, 2];
  return [Math.hypot(...v), Math.hypot(...[3, 4]), Math.max(1, ...xs, 3), Math.min(...xs, 7), Math.min(9, ...[]), Math.max(...xs.map((x) => x * 2))];
}

// --- push with spreads -------------------------------------------------------------------------

export function pushSpreads(): unknown {
  const a = [1];
  a.push(...[2, 3], 4, ...[5]);
  // every argument is read before anything is pushed: a spread of the array itself
  const b = [7, 8];
  b.push(...b, ...b);
  const c: string[] = [];
  c.push("x", ...["y", "z"]);
  return [a, b, c];
}
