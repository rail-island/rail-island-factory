// Conditional parameter values (ParamValue.when, design.ts): which values of a
// parameter the values chosen before it offer, and resolution that refuses the
// others. Apart from design.ts on purpose: design.ts's runtime (resolveParams)
// is bundled into every standalone JS model, and any change to that module moves
// every model's minified bytes; only a design with conditional values imports this.

import { resolveParams, type ParamSpec, type ParamValue, type ParamValues } from "./design.ts";

/** Whether a value is offered under the values chosen so far (see ParamValue.when). */
export function valueApplies(value: ParamValue, chosen: ParamValues): boolean {
  return !value.when || value.when.values.includes(chosen[value.when.name] ?? "");
}

/** The values of a parameter offered under the values chosen so far, in order. */
export function offeredValues(spec: ParamSpec, chosen: ParamValues): ParamValue[] {
  return spec.values.filter((v) => valueApplies(v, chosen));
}

/**
 * resolveParams for a design with conditional values (ParamValue.when): also
 * throws on a value the values before it do not offer, so a combination that
 * never ran is never built. Kept apart from resolveParams, which every standalone
 * JS model carries, so only such a design's bundle holds the check.
 */
export function resolveOfferedParams(specs: readonly ParamSpec[], given: ParamValues = {}): ParamValues {
  const out = resolveParams(specs, given);
  for (const s of specs) {
    const value = s.values.find((x) => x.value === out[s.name]);
    if (value && !valueApplies(value, out)) {
      throw new Error(`parameter "${s.name}" does not offer "${value.value}" with ${value.when!.name} "${out[value.when!.name] ?? ""}" (only with ${value.when!.values.join(", ")})`);
    }
  }
  return out;
}
