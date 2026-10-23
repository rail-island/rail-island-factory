// The one hash both repositories pin a set's output with -- a copy of the game's
// src/core/setPins.ts, held to the same vector by test/pinHash.test.ts (docs/models/sets.md,
// the spec's "accept, flag on import"). Before a set's definitions move into the
// factory, the game writes a baseline -- fixed inputs and the hash of what each type
// builds from them -- which the game's test/setPins.test.ts keeps and the factory's
// own test reproduces; an import that changes a shipped type's output then fails
// until the pin is updated on purpose (`pnpm sets:baseline`).
//
// The hash covers every own enumerable field of the output, keys sorted, numbers
// rounded to 1e-4 (so a float-order change in the last bits does not count), arrays
// in order. Pure: no Node, no DOM.

const SCALE = 1e4;

/** The canonical JSON text a hash is taken of. */
export function canonicalJson(value: unknown): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return JSON.stringify(String(value));
    const r = Math.round(value * SCALE) / SCALE;
    return JSON.stringify(Object.is(r, -0) ? 0 : r);
  }
  if (value === null || typeof value !== "object") return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}

/** FNV-1a 64-bit over the canonical text, as 16 hex digits: stable, dependency-free. */
export function pinHash(value: unknown): string {
  const text = canonicalJson(value);
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < text.length; i++) {
    h ^= BigInt(text.charCodeAt(i));
    h = (h * prime) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, "0");
}
