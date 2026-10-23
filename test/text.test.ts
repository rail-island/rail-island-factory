// The exported text (docs/models/text.md): every language complete, nothing stale,
// and the exported files deterministic.
import { describe, expect, it } from "vitest";
import { LOCALES, TRANSLATED_LOCALES, exportedText, localizedText, readVerbatim, textGaps } from "../generator/text.ts";

const text = exportedText();

describe("exported text", () => {
  it("covers the game's 14 languages, English first", () => {
    expect(LOCALES[0]).toBe("en");
    expect([...LOCALES].sort()).toEqual(["cs", "de", "en", "es", "fr", "hu", "it", "ja", "ko", "nl", "pl", "pt", "sk", "zh"]);
  });

  it("gives every exported key a non-empty English text", () => {
    expect(text.size).toBeGreaterThan(1000);
    for (const [key, en] of text) {
      expect(key).toMatch(/^(model|set|woods|species|category|traction)\./);
      expect(en.trim(), key).not.toBe("");
    }
  });

  it("lists only exported English as verbatim", () => {
    const used = new Set(text.values());
    for (const en of readVerbatim()) expect(used.has(en), en).toBe(true);
  });

  for (const locale of TRANSLATED_LOCALES) {
    it(`${locale}: translates everything, keeps nothing stale`, () => {
      const gaps = textGaps(locale, text);
      expect(gaps.missing, `${locale} missing (run the translate-text skill)`).toEqual([]);
      expect(gaps.stale, `${locale} stale phrases`).toEqual([]);
      expect(gaps.unusedOverrides, `${locale} overrides of keys not exported`).toEqual([]);
    });
  }

  it("exports every key in every language, in a stable order", () => {
    const keys = [...text.keys()].sort();
    for (const locale of LOCALES) {
      const out = localizedText(locale, text);
      expect(Object.keys(out)).toEqual(keys);
    }
    expect(localizedText("en", text)["set.bridge.beam"]).toBe("Beam Bridge");
  });
});
