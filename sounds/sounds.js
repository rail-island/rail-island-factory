// sounds/nodes.ts
var FADE = 0.06;
var SILENT = 1e-4;
var noiseBuffers = /* @__PURE__ */ new WeakMap();
function noise(ctx) {
  let buf = noiseBuffers.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let s = 625341585;
    for (let i = 0; i < data.length; i++) {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      data[i] = (s >>> 0) / 4294967295 * 2 - 1;
    }
    noiseBuffers.set(ctx, buf);
  }
  return buf;
}
function noiseSource(ctx, loop2) {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  src.loop = loop2;
  return src;
}
function filter(ctx, type, freq, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}
function gain(ctx, level = 0) {
  const g = ctx.createGain();
  g.gain.value = level;
  return g;
}
function envelope(param, t, peak, attack, hold, release) {
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + attack);
  param.setValueAtTime(peak, t + attack + hold);
  param.linearRampToValueAtTime(0, t + attack + hold + release);
}
function strike(param, t, peak, decay) {
  param.setValueAtTime(SILENT, t);
  param.exponentialRampToValueAtTime(Math.max(SILENT, peak), t + 5e-3);
  param.exponentialRampToValueAtTime(SILENT, t + decay);
}
function voiceOf(out, sources, endsAt) {
  let stopped = false;
  return {
    endsAt,
    stop(at) {
      if (stopped) return;
      stopped = true;
      out.gain.cancelScheduledValues(at);
      out.gain.setValueAtTime(out.gain.value, at);
      out.gain.linearRampToValueAtTime(0, at + FADE);
      for (const s of sources) {
        try {
          s.stop(at + FADE + 0.01);
        } catch {
        }
      }
    }
  };
}
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function resolve(params, values) {
  const out = {};
  for (const p of params) {
    const v = values?.[p.name];
    if (p.kind === "number") {
      const n = typeof v === "number" && Number.isFinite(v) ? v : p.default;
      out[p.name] = Math.min(p.max, Math.max(p.min, n));
    } else {
      out[p.name] = typeof v === "string" && p.values.some((x) => x.value === v) ? v : p.default;
    }
  }
  return out;
}
function num(values, name) {
  return values[name];
}
function choice(values, name) {
  return values[name];
}
function oneShot(def) {
  return {
    id: def.id,
    title: def.title,
    category: def.category,
    description: def.description,
    params: def.params,
    kind: "oneShot",
    play: (ctx, dest, t, values) => def.play(ctx, dest, t, resolve(def.params, values))
  };
}
function loop(def) {
  return {
    id: def.id,
    title: def.title,
    category: def.category,
    description: def.description,
    params: def.params,
    kind: "loop",
    start: (ctx, dest, t, values) => {
      const voice = def.start(ctx, dest, t, resolve(def.params, values));
      return {
        get endsAt() {
          return voice.endsAt;
        },
        stop: (at) => voice.stop(at),
        tick: (now, horizon) => voice.tick(now, horizon),
        set: (next) => voice.set(resolve(def.params, next))
      };
    }
  };
}
var LEVEL = { name: "level", title: "Level", kind: "number", min: 0, max: 1, step: 0.05, default: 1 };

// sounds/designs/bells.ts
var CHURCH_PARTIALS = [
  { ratio: 0.5, level: 0.5, ring: 9 },
  { ratio: 1, level: 0.7, ring: 6 },
  { ratio: 1.2, level: 0.55, ring: 5 },
  { ratio: 1.5, level: 0.25, ring: 3.5 },
  { ratio: 2, level: 1, ring: 3.2 },
  { ratio: 2.5, level: 0.35, ring: 2 },
  { ratio: 2.67, level: 0.2, ring: 1.8 },
  { ratio: 3.01, level: 0.25, ring: 1.4 },
  { ratio: 4.02, level: 0.12, ring: 0.9 }
];
var GREAT_BELL_PARTIALS = [
  { ratio: 0.5, level: 0.6, ring: 14 },
  { ratio: 1, level: 0.7, ring: 9 },
  { ratio: 1.012, level: 0.4, ring: 8 },
  { ratio: 1.19, level: 0.55, ring: 7 },
  { ratio: 1.5, level: 0.2, ring: 5 },
  { ratio: 2, level: 1, ring: 4.5 },
  { ratio: 2.008, level: 0.45, ring: 4.2 },
  { ratio: 2.52, level: 0.3, ring: 2.6 },
  { ratio: 3.03, level: 0.22, ring: 1.8 },
  { ratio: 4.1, level: 0.1, ring: 1.1 }
];
var BOURDON_PARTIALS = [
  { ratio: 0.5, level: 0.75, ring: 22 },
  { ratio: 1, level: 0.8, ring: 15 },
  { ratio: 1.003, level: 0.3, ring: 14 },
  { ratio: 1.2, level: 0.5, ring: 11 },
  { ratio: 1.5, level: 0.22, ring: 8 },
  { ratio: 2, level: 1, ring: 7 },
  { ratio: 2.51, level: 0.3, ring: 4 },
  { ratio: 2.68, level: 0.18, ring: 3.5 },
  { ratio: 3.02, level: 0.2, ring: 2.5 },
  { ratio: 4.05, level: 0.08, ring: 1.4 }
];
function bellTail(partials, ring) {
  return Math.max(...partials.map((p) => p.ring)) * ring;
}
function strikeBell(ctx, out, at, pitch, partials, ring, loud) {
  const sources = [];
  for (const p of partials) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = pitch * p.ratio;
    const g = gain(ctx);
    osc.connect(g).connect(out);
    const decay = p.ring * ring;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(p.level * loud, at + 4e-3);
    g.gain.setTargetAtTime(0, at + 4e-3, decay / 6.9);
    osc.start(at);
    osc.stop(at + decay + 0.1);
    sources.push(osc);
  }
  const clang = noiseSource(ctx, false);
  const band = filter(ctx, "bandpass", Math.min(8e3, pitch * 3), 1.5);
  const cg = gain(ctx);
  clang.connect(band).connect(cg).connect(out);
  cg.gain.setValueAtTime(0, at);
  cg.gain.linearRampToValueAtTime(0.5 * loud, at + 2e-3);
  cg.gain.setTargetAtTime(0, at + 2e-3, 0.02);
  clang.start(at);
  clang.stop(at + 0.2);
  sources.push(clang);
  return sources;
}
var STRIKES = { name: "strikes", title: "Strikes", kind: "number", min: 1, max: 12, step: 1, default: 3 };
var RING = { name: "ring", title: "Ring", kind: "number", min: 0.3, max: 1.5, step: 0.05, default: 1 };
function toll(ctx, dest, t, level, pitch, partials, strikes, interval, ring, first = 0) {
  const out = gain(ctx, level);
  out.connect(dest);
  const sources = [];
  for (let i = 0; i < strikes; i++) sources.push(...strikeBell(ctx, out, t + first + i * interval, pitch, partials, ring, 0.1));
  return { out, sources, end: t + first + (strikes - 1) * interval + bellTail(partials, ring) };
}
var churchBell = /* @__PURE__ */ oneShot({
  id: "church-bell",
  title: "Church bell",
  category: "bells",
  description: "A village church's bell tolling: a bright, well-tuned bell struck a few times, ringing on between the strikes.",
  params: [
    { name: "pitch", title: "Strike note", kind: "number", min: 200, max: 900, step: 5, default: 440, unit: "Hz" },
    STRIKES,
    { name: "interval", title: "Strike every", kind: "number", min: 0.8, max: 6, step: 0.1, default: 2.2, unit: "s" },
    RING,
    LEVEL
  ],
  play(ctx, dest, t, v) {
    const { out, sources, end } = toll(ctx, dest, t, num(v, "level"), num(v, "pitch"), CHURCH_PARTIALS, num(v, "strikes"), num(v, "interval"), num(v, "ring"));
    return voiceOf(out, sources, end);
  }
});
var QUARTER_BELLS = { gs: 415.3, fs: 369.99, e: 329.63, b: 246.94 };
var WESTMINSTER_CHANGES = [
  ["gs", "fs", "e", "b"],
  ["e", "gs", "fs", "b"],
  ["e", "fs", "gs", "e"],
  ["gs", "e", "fs", "b"],
  ["b", "fs", "gs", "e"]
];
var QUARTER_NOTE = 0.7;
var CHANGE = 4 * QUARTER_NOTE + 0.9;
function hourChime() {
  const notes = [];
  WESTMINSTER_CHANGES.slice(1).forEach((change, c) => {
    change.forEach((bell, i) => notes.push([c * CHANGE + i * QUARTER_NOTE, bell]));
  });
  return { notes, length: 4 * CHANGE };
}
var bigBen = /* @__PURE__ */ oneShot({
  id: "big-ben",
  title: "Big Ben",
  category: "bells",
  description: "The Great Bell of the Westminster clock tower striking the hour in E, deep and a little harsh, optionally after the Westminster Quarters on the four quarter bells.",
  params: [
    { name: "pitch", title: "Strike note", kind: "number", min: 100, max: 260, step: 1, default: 165, unit: "Hz" },
    { ...STRIKES, title: "Hour" },
    {
      name: "chime",
      title: "Quarters first",
      kind: "choice",
      values: [
        { value: "quarters", title: "Westminster Quarters, then the hour" },
        { value: "hour", title: "The hour only" }
      ],
      default: "quarters"
    },
    RING,
    LEVEL
  ],
  play(ctx, dest, t, v) {
    const ring = num(v, "ring");
    const scale = num(v, "pitch") / 164.81;
    let first = 0;
    const chimes = [];
    const out0 = gain(ctx, num(v, "level"));
    out0.connect(dest);
    if (choice(v, "chime") === "quarters") {
      const { notes, length } = hourChime();
      for (const [at, bell] of notes) chimes.push(...strikeBell(ctx, out0, t + at, QUARTER_BELLS[bell] * scale, CHURCH_PARTIALS, ring * 0.8, 0.06));
      first = length + 2;
    }
    const hour = toll(ctx, dest, t, num(v, "level"), num(v, "pitch"), GREAT_BELL_PARTIALS, num(v, "strikes"), 4.5, ring, first);
    const hourVoice = voiceOf(hour.out, [...hour.sources], hour.end);
    const quarters = voiceOf(out0, chimes, hour.end);
    return {
      endsAt: hour.end,
      stop(at) {
        hourVoice.stop(at);
        quarters.stop(at);
      }
    };
  }
});
var notreDameBell = /* @__PURE__ */ oneShot({
  id: "notre-dame-bell",
  title: "Notre-Dame bourdon",
  category: "bells",
  description: "Emmanuel, the great bourdon of Notre-Dame de Paris: a very deep F-sharp, swung slowly, its hum ringing on long after each stroke.",
  params: [
    { name: "pitch", title: "Strike note", kind: "number", min: 60, max: 160, step: 0.5, default: 92.5, unit: "Hz" },
    { ...STRIKES, default: 4 },
    { name: "interval", title: "Strike every", kind: "number", min: 1.5, max: 8, step: 0.1, default: 3.4, unit: "s" },
    RING,
    LEVEL
  ],
  play(ctx, dest, t, v) {
    const { out, sources, end } = toll(ctx, dest, t, num(v, "level"), num(v, "pitch"), BOURDON_PARTIALS, num(v, "strikes"), num(v, "interval"), num(v, "ring"));
    return voiceOf(out, sources, end);
  }
});

// sounds/designs/editor.ts
function knock(ctx, dest, t, v, demolish) {
  const out = gain(ctx, num(v, "level"));
  out.connect(dest);
  const thud = ctx.createOscillator();
  thud.type = "sine";
  const tg = gain(ctx);
  thud.connect(tg).connect(out);
  const grit = noiseSource(ctx, false);
  const gf = filter(ctx, "lowpass", demolish ? 900 : 1800);
  const gg = gain(ctx);
  grit.connect(gf).connect(gg).connect(out);
  const length = demolish ? 0.6 : 0.25;
  if (demolish) {
    thud.frequency.setValueAtTime(95, t);
    thud.frequency.exponentialRampToValueAtTime(40, t + 0.3);
    strike(tg.gain, t, 0.45, 0.35);
    strike(gg.gain, t, 0.4, 0.55);
  } else {
    thud.frequency.setValueAtTime(170, t);
    thud.frequency.exponentialRampToValueAtTime(65, t + 0.15);
    strike(tg.gain, t, 0.5, 0.22);
    strike(gg.gain, t, 0.25, 0.06);
  }
  thud.start(t);
  thud.stop(t + length + 0.05);
  grit.start(t);
  grit.stop(t + length + 0.05);
  return voiceOf(out, [thud, grit], t + length + 0.1);
}
var editBuild = /* @__PURE__ */ oneShot({
  id: "edit-build",
  title: "Build",
  category: "editor",
  description: "A committed build in the editor: a short wooden knock.",
  params: [LEVEL],
  play: (ctx, dest, t, v) => knock(ctx, dest, t, v, false)
});
var editDemolish = /* @__PURE__ */ oneShot({
  id: "edit-demolish",
  title: "Demolish",
  category: "editor",
  description: "A committed demolition or removal in the editor: a crumble.",
  params: [LEVEL],
  play: (ctx, dest, t, v) => knock(ctx, dest, t, v, true)
});

// sounds/designs/ships.ts
var shipHorn = /* @__PURE__ */ oneShot({
  id: "ship-horn",
  title: "Ship horn",
  category: "ships",
  description: "A ship's horn, leaving a berth (full length) and coming to rest at one (shorter).",
  params: [
    { name: "pitch", title: "Pitch", kind: "number", min: 50, max: 250, step: 1, default: 120, unit: "Hz" },
    { name: "seconds", title: "Length", kind: "number", min: 0.3, max: 3, step: 0.05, default: 1.5, unit: "s" },
    LEVEL
  ],
  play(ctx, dest, t, v) {
    const pitch = num(v, "pitch");
    const seconds = num(v, "seconds");
    const out = gain(ctx, num(v, "level"));
    out.connect(dest);
    const env = gain(ctx);
    const lp = filter(ctx, "lowpass", 800, 1.2);
    lp.connect(env).connect(out);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 4.5;
    const depth = gain(ctx, pitch * 0.012);
    lfo.connect(depth);
    const end = t + seconds + 0.7;
    const sources = [lfo];
    const reeds = [
      ["sawtooth", 1, 0.2],
      ["square", 1.004, 0.08],
      ["sawtooth", 2, 0.07]
    ];
    for (const [type, ratio, level] of reeds) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = pitch * ratio;
      depth.connect(osc.frequency);
      const g = gain(ctx, level);
      osc.connect(g).connect(lp);
      osc.start(t);
      osc.stop(end);
      sources.push(osc);
    }
    lfo.start(t);
    lfo.stop(end);
    envelope(env.gain, t, 1, 0.2, seconds, 0.5);
    return voiceOf(out, sources, end);
  }
});

// sounds/designs/trains.ts
var CALL = {
  name: "call",
  title: "Call",
  kind: "choice",
  values: [
    { value: "departure", title: "Departure (two blasts)" },
    { value: "crossing", title: "Level crossing (one long)" },
    { value: "tunnel", title: "Tunnel (one longer)" },
    { value: "player", title: "Player (one short)" }
  ],
  default: "departure"
};
function hornPattern(kind, call) {
  if (kind === "whistle") {
    if (call === "departure") return [[0, 0.35, 1], [0.5, 0.9, 1]];
    if (call === "crossing") return [[0, 1.1, 1]];
    if (call === "tunnel") return [[0, 1.4, 1]];
    return [[0, 0.8, 1]];
  }
  if (call === "departure") return [[0, 0.3, 1.26], [0.36, 0.45, 1]];
  if (call === "crossing") return [[0, 1, 1]];
  if (call === "tunnel") return [[0, 1.3, 1]];
  return [[0, 0.6, 1]];
}
var locoHorn = /* @__PURE__ */ oneShot({
  id: "loco-horn",
  title: "Locomotive horn",
  category: "trains",
  description: "A diesel's, an electric's or a multiple unit's two-tone air horn: leaving a platform, before a crossing or a tunnel, or on the player's Horn.",
  params: [
    { name: "pitch", title: "Pitch", kind: "number", min: 150, max: 500, step: 5, default: 300, unit: "Hz" },
    CALL,
    LEVEL
  ],
  play(ctx, dest, t, v) {
    const out = gain(ctx, num(v, "level"));
    out.connect(dest);
    const sources = [];
    let end = t;
    for (const [offset, length, factor] of hornPattern("horn", choice(v, "call"))) {
      const at = t + offset;
      const pitch = num(v, "pitch") * factor;
      const env = gain(ctx);
      const lp = filter(ctx, "lowpass", 2400);
      lp.connect(env).connect(out);
      [1, 1.25, 1.5].forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = pitch * ratio;
        osc.detune.value = (i - 1) * 6;
        const g = gain(ctx, 0.11);
        osc.connect(g).connect(lp);
        osc.start(at);
        osc.stop(at + length + 0.2);
        sources.push(osc);
      });
      envelope(env.gain, at, 1, 0.03, length, 0.12);
      end = Math.max(end, at + length + 0.4);
    }
    return voiceOf(out, sources, end);
  }
});
var WHISTLE_PIPES = [
  [0.357, 0.077],
  [1, 0.095],
  [1.438, 0.095],
  [1.727, 0.146]
];
var steamWhistle = /* @__PURE__ */ oneShot({
  id: "steam-whistle",
  title: "Steam whistle",
  category: "trains",
  description: "A steam locomotive's whistle, played where another locomotive would sound its horn.",
  params: [
    { name: "pitch", title: "Pitch", kind: "number", min: 400, max: 1100, step: 10, default: 700, unit: "Hz" },
    CALL,
    LEVEL
  ],
  play(ctx, dest, t, v) {
    const out = gain(ctx, num(v, "level"));
    out.connect(dest);
    const sources = [];
    let end = t;
    for (const [offset, length, factor] of hornPattern("whistle", choice(v, "call"))) {
      const at = t + offset;
      const pitch = num(v, "pitch") * factor;
      const env = gain(ctx);
      env.connect(out);
      const pipes = WHISTLE_PIPES;
      for (const [ratio, level] of pipes) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(pitch * ratio * 0.92, at);
        osc.frequency.exponentialRampToValueAtTime(pitch * ratio, at + 0.12);
        const g = gain(ctx, level);
        osc.connect(g).connect(env);
        osc.start(at);
        osc.stop(at + length + 0.35);
        sources.push(osc);
      }
      const hiss = noiseSource(ctx, true);
      const bp = filter(ctx, "bandpass", pitch * 1.2, 5);
      const hg = gain(ctx, 0.35);
      hiss.connect(bp).connect(hg).connect(env);
      hiss.start(at);
      hiss.stop(at + length + 0.35);
      sources.push(hiss);
      envelope(env.gain, at, 1, 0.08, length, 0.25);
      end = Math.max(end, at + length + 0.4);
    }
    return voiceOf(out, sources, end);
  }
});
function chuffLevel(intensity) {
  return 0.3 + 0.7 * Math.min(1, Math.max(0, intensity));
}
var steamChuff = /* @__PURE__ */ loop({
  id: "steam-chuff",
  title: "Steam exhaust beat",
  category: "trains",
  description: "A running steam locomotive's exhaust: one burst of steam per beat, at the rate its speed gives and as strong as it works.",
  params: [
    { name: "rate", title: "Beats per second", kind: "number", min: 0, max: 12, step: 0.1, default: 4, unit: "/s" },
    { name: "intensity", title: "Effort", kind: "number", min: 0, max: 1, step: 0.05, default: 0.5 },
    LEVEL
  ],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level"));
    out.connect(dest);
    const pulse = gain(ctx);
    const bp = filter(ctx, "bandpass", 650, 0.9);
    const lp = filter(ctx, "lowpass", 2600);
    const src = noiseSource(ctx, true);
    src.connect(bp).connect(lp).connect(pulse).connect(out);
    src.start(t);
    const base = voiceOf(out, [src], Infinity);
    let v = initial;
    let next = t;
    let beat = 0;
    return {
      endsAt: Infinity,
      stop: (at) => base.stop(at),
      set(values) {
        v = values;
      },
      tick(now, horizon) {
        const rate = num(v, "rate");
        if (rate <= 0) {
          next = now;
          return;
        }
        if (next < now) next = now;
        const level = chuffLevel(num(v, "intensity"));
        while (next < now + horizon) {
          const accent = beat % 4 === 0 ? 1 : 0.78;
          strike(pulse.gain, next, 0.9 * level * accent, Math.min(0.22, 0.75 / rate));
          next += 1 / rate;
          beat++;
        }
      }
    };
  }
});
var BELL_PARTIALS = [
  // ring: seconds to fall 60 dB
  { ratio: 0.566, level: 0.13, ring: 3.2 },
  { ratio: 1, level: 1, ring: 2.8 },
  { ratio: 1.0038, level: 0.45, ring: 2.8 },
  { ratio: 1.512, level: 0.6, ring: 2.2 },
  { ratio: 2.083, level: 0.06, ring: 1.2 },
  { ratio: 3.078, level: 0.03, ring: 0.9 }
];
function bellGap(n, interval, uneven) {
  return interval * (n % 2 === 0 ? 1 - uneven : 1 + uneven);
}
var crossingBell = /* @__PURE__ */ loop({
  id: "crossing-bell",
  title: "Level crossing bell",
  category: "trains",
  description: "A level crossing's electric bell, ringing for as long as its lamps blink.",
  params: [
    { name: "pitch", title: "Pitch", kind: "number", min: 600, max: 2400, step: 10, default: 1590, unit: "Hz" },
    { name: "interval", title: "Strike every", kind: "number", min: 0.15, max: 1.2, step: 0.01, default: 0.49, unit: "s" },
    { name: "uneven", title: "Uneven strokes", kind: "number", min: 0, max: 0.3, step: 5e-3, default: 0.085 },
    { name: "ring", title: "Ring", kind: "number", min: 0.2, max: 2, step: 0.05, default: 1 },
    LEVEL
  ],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level") * 0.22);
    out.connect(dest);
    const sources = [];
    const tones = BELL_PARTIALS.map((p) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = num(initial, "pitch") * p.ratio;
      const g = gain(ctx);
      osc.connect(g).connect(out);
      osc.start(t);
      sources.push(osc);
      return { osc, g, p };
    });
    const click = noiseSource(ctx, true);
    const hp = filter(ctx, "highpass", 3e3);
    const cg = gain(ctx);
    click.connect(hp).connect(cg).connect(out);
    click.start(t);
    sources.push(click);
    const base = voiceOf(out, sources, Infinity);
    let v = initial;
    let next = t;
    let n = 0;
    let stopped = false;
    return {
      endsAt: Infinity,
      stop(at) {
        stopped = true;
        base.stop(at);
      },
      set(values) {
        v = values;
      },
      tick(now, horizon) {
        if (stopped) return;
        if (next < now) next = now;
        while (next < now + horizon) {
          const ring = num(v, "ring");
          for (const { osc, g, p } of tones) {
            osc.frequency.setValueAtTime(num(v, "pitch") * p.ratio, next);
            g.gain.setTargetAtTime(p.level, next, 15e-4);
            g.gain.setTargetAtTime(0, next + 6e-3, p.ring * ring / 6.9);
          }
          cg.gain.setTargetAtTime(0.25, next, 5e-4);
          cg.gain.setTargetAtTime(0, next + 2e-3, 6e-3);
          next += bellGap(n, num(v, "interval"), num(v, "uneven"));
          n++;
        }
      }
    };
  }
});
var TRAM_BELL_PARTIALS = [
  { freq: 1565, level: 0.56, decay: 0.9 },
  { freq: 3647, level: 0.25, decay: 0.45 },
  { freq: 6230, level: 1, decay: 0.4 },
  { freq: 9295, level: 0.71, decay: 0.28 },
  { freq: 12452, level: 0.13, decay: 0.16 }
];
var TRAM_BELL_STRIKES = 50;
function tramBellPresses(call) {
  if (call === "warning") return [[0, 2.8]];
  return [
    [0, 0.27],
    [0.51, 0.29]
  ];
}
var tramBell = /* @__PURE__ */ oneShot({
  id: "tram-bell",
  title: "Tram bell",
  category: "trains",
  description: "The bell of a Czech Tatra tram: two short rings before it leaves a stop, or one long ring as a warning.",
  params: [
    {
      name: "call",
      title: "Call",
      kind: "choice",
      values: [
        { value: "departure", title: "Departure (two short rings)" },
        { value: "warning", title: "Warning (one long ring)" }
      ],
      default: "departure"
    },
    LEVEL
  ],
  play(ctx, dest, t, v) {
    const out = gain(ctx, num(v, "level") * 0.128);
    out.connect(dest);
    const presses = tramBellPresses(choice(v, "call"));
    const end = presses[presses.length - 1];
    const stopAt = t + end[0] + end[1] + 5 * Math.max(...TRAM_BELL_PARTIALS.map((p) => p.decay));
    const sources = [];
    const hammer = ctx.createOscillator();
    hammer.type = "sawtooth";
    hammer.frequency.value = TRAM_BELL_STRIKES;
    const depth = gain(ctx);
    hammer.connect(depth);
    hammer.start(t);
    hammer.stop(stopAt);
    sources.push(hammer);
    const ring = gain(ctx, 0.8);
    ring.connect(out);
    depth.connect(ring.gain);
    const tick = noiseSource(ctx, true);
    const hp = filter(ctx, "highpass", 4e3);
    const tickG = gain(ctx);
    tick.connect(hp).connect(tickG).connect(out);
    depth.connect(tickG.gain);
    tick.start(t);
    tick.stop(stopAt);
    sources.push(tick);
    const partials = TRAM_BELL_PARTIALS.map((p) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = p.freq;
      const g = gain(ctx);
      osc.connect(g).connect(ring);
      osc.start(t);
      osc.stop(stopAt);
      sources.push(osc);
      return { g, p };
    });
    for (const [offset, length] of presses) {
      const a = t + offset;
      const b = a + length;
      for (const { g, p } of partials) {
        g.gain.setTargetAtTime(p.level, a, 0.03);
        g.gain.setTargetAtTime(0, b, p.decay);
      }
      depth.gain.setTargetAtTime(0.2, a, 0.01);
      depth.gain.setTargetAtTime(0, b, 5e-3);
    }
    return voiceOf(out, sources, stopAt);
  }
});

// sounds/designs/electric.ts
var SPEED = { name: "speed", title: "Speed", kind: "number", min: 0, max: 1, step: 0.01, default: 0.5 };
var LOAD = { name: "load", title: "Pull", kind: "number", min: 0, max: 1, step: 0.05, default: 0.5 };
var WHEEL = 1.25;
var GEAR_TEETH = 79;
function gearMesh(v) {
  return v / (Math.PI * WHEEL) * GEAR_TEETH;
}
var GLIDE = 0.25;
var NOTCH_BELOW = 0.66;
var CONVERTER_TONES = [
  { freq: 1180, level: 1 },
  { freq: 1830, level: 0.7 },
  { freq: 2420, level: 0.8 },
  { freq: 2750, level: 0.5 },
  { freq: 3070, level: 0.4 }
];
var AUX_TONE = 620;
var CONVERTER_RISE = 0.08;
var CONVERTER_RISE_AT = 0.35;
var TOP_SPEED = { resistor: 33, converter: 44, shinkansen: 83 };
function glide(param, value, at, tau = GLIDE) {
  param.setTargetAtTime(value, at, tau);
}
function rolling(ctx, out, t, cutoff) {
  const src = noiseSource(ctx, true);
  const lp = filter(ctx, "lowpass", cutoff);
  const hp = filter(ctx, "highpass", 45);
  const g = gain(ctx);
  src.connect(hp).connect(lp).connect(g).connect(out);
  src.start(t);
  return { src, g };
}
function rollingLevel(speed) {
  return Math.pow(Math.max(0, speed), 1.3);
}
function running(out, sources, initial, update, events) {
  const base = voiceOf(out, sources, Infinity);
  let v = initial;
  let scheduled = -Infinity;
  let stopped = false;
  return {
    endsAt: Infinity,
    stop(at) {
      stopped = true;
      base.stop(at);
    },
    set(values) {
      v = values;
    },
    tick(now, horizon) {
      if (stopped) return;
      update(v, now);
      const from = Math.max(now, scheduled);
      if (events && from < now + horizon) events(v, from, now + horizon);
      scheduled = Math.max(scheduled, now + horizon);
    }
  };
}
var electricEngineResistor = /* @__PURE__ */ loop({
  id: "electric-engine-resistor",
  title: "Electric locomotive, resistor control",
  category: "trains",
  description: "An old DC electric locomotive: blowers, a compressor while it stands, gears whining with its speed and the controller clacking notch by notch as it pulls away.",
  params: [SPEED, LOAD, LEVEL],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level") * 0.028);
    out.connect(dest);
    const sources = [];
    const fan = noiseSource(ctx, true);
    const fanLp = filter(ctx, "lowpass", 1400);
    const fanBlade = filter(ctx, "bandpass", 290, 4);
    const fanG = gain(ctx, 0.18);
    const bladeG = gain(ctx, 0.5);
    fan.connect(fanLp).connect(fanG).connect(out);
    fan.connect(fanBlade).connect(bladeG).connect(out);
    fan.start(t);
    sources.push(fan);
    const motor = gain(ctx);
    const notch = gain(ctx, 1);
    motor.connect(notch).connect(out);
    const tones = [
      [1, 0.5],
      [2, 0.22],
      [0.5, 0.18]
    ].map(([ratio, level]) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const g = gain(ctx, level);
      osc.connect(g).connect(motor);
      osc.start(t);
      sources.push(osc);
      return { osc, ratio };
    });
    const brush = noiseSource(ctx, true);
    const brushBp = filter(ctx, "bandpass", 2400, 1.5);
    const brushG = gain(ctx, 0.25);
    brush.connect(brushBp).connect(brushG).connect(motor);
    brush.start(t);
    sources.push(brush);
    const comp = noiseSource(ctx, true);
    const compLp = filter(ctx, "lowpass", 180, 0.9);
    const compG = gain(ctx);
    comp.connect(compLp).connect(compG).connect(out);
    comp.start(t);
    sources.push(comp);
    const clack = noiseSource(ctx, true);
    const clackBp = filter(ctx, "bandpass", 2600, 2);
    const clackG = gain(ctx);
    clack.connect(clackBp).connect(clackG).connect(out);
    clack.start(t);
    sources.push(clack);
    const roll = rolling(ctx, out, t, 1800);
    sources.push(roll.src);
    const random = seeded(31);
    let nextNotch = t;
    let nextStroke = t;
    return running(
      out,
      sources,
      initial,
      (v, at) => {
        const speed = num(v, "speed");
        const ms = speed * TOP_SPEED.resistor;
        for (const { osc, ratio } of tones) glide(osc.frequency, Math.max(1, gearMesh(ms) * ratio), at);
        glide(motor.gain, (0.25 + 0.75 * num(v, "load")) * Math.min(1, ms / 6) * 2.4, at);
        glide(roll.g.gain, rollingLevel(speed) * 0.9, at);
      },
      (v, from, to) => {
        const speed = num(v, "speed");
        if (speed <= 0) {
          if (nextStroke < from) nextStroke = from;
          while (nextStroke < to) {
            compG.gain.setTargetAtTime(2.2, nextStroke, 4e-3);
            compG.gain.setTargetAtTime(0, nextStroke + 0.015, 0.02);
            nextStroke += 1 / 12;
          }
        } else nextStroke = to;
        if (speed > 0 && speed < NOTCH_BELOW && num(v, "load") > 0.5) {
          if (nextNotch < from) nextNotch = from + 0.4;
          while (nextNotch < to) {
            clackG.gain.setTargetAtTime(1.6, nextNotch, 8e-4);
            clackG.gain.setTargetAtTime(0, nextNotch + 3e-3, 8e-3);
            notch.gain.setTargetAtTime(0.55, nextNotch, 0.01);
            notch.gain.setTargetAtTime(1, nextNotch + 0.04, 0.3);
            nextNotch += 1.1 + 0.3 * random();
          }
        } else nextNotch = to;
      }
    );
  }
});
var electricEngineConverter = /* @__PURE__ */ loop({
  id: "electric-engine-converter",
  title: "Electric train, three-phase",
  category: "trains",
  description: "A modern electric train or locomotive: the converters' cluster of high tones while it pulls, rising a little with its speed, over a steady hum.",
  params: [SPEED, LOAD, LEVEL],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level") * 0.079);
    out.connect(dest);
    const sources = [];
    const converter = gain(ctx);
    converter.connect(out);
    const tones = CONVERTER_TONES.map((c, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.detune.value = (i - 2) * 3;
      const g = gain(ctx, c.level * 0.12);
      osc.connect(g).connect(converter);
      osc.start(t);
      sources.push(osc);
      return { osc, freq: c.freq };
    });
    const aux = ctx.createOscillator();
    aux.type = "sine";
    aux.frequency.value = AUX_TONE;
    const auxG = gain(ctx, 0.05);
    aux.connect(auxG).connect(out);
    aux.start(t);
    sources.push(aux);
    const gear = ctx.createOscillator();
    gear.type = "sine";
    const gearG = gain(ctx);
    gear.connect(gearG).connect(out);
    gear.start(t);
    sources.push(gear);
    const fan = noiseSource(ctx, true);
    const fanBp = filter(ctx, "bandpass", 1800, 0.5);
    const fanG = gain(ctx, 0.12);
    fan.connect(fanBp).connect(fanG).connect(out);
    fan.start(t);
    sources.push(fan);
    const roll = rolling(ctx, out, t, 2200);
    sources.push(roll.src);
    return running(out, sources, initial, (v, at) => {
      const speed = num(v, "speed");
      const ms = speed * TOP_SPEED.converter;
      const rise = 1 + CONVERTER_RISE * Math.min(1, speed / CONVERTER_RISE_AT);
      for (const { osc, freq } of tones) glide(osc.frequency, freq * rise, at);
      const pulling = speed > 0 ? Math.min(1, num(v, "load") * 1.2) * Math.max(0.4, 1 - ms / 50) : 0;
      glide(converter.gain, pulling, at);
      glide(gear.frequency, Math.max(1, gearMesh(ms)), at);
      glide(gearG.gain, 0.25 * Math.min(1, ms / 10), at);
      glide(roll.g.gain, rollingLevel(speed) * 0.9, at);
    });
  }
});
var electricEngineShinkansen = /* @__PURE__ */ loop({
  id: "electric-engine-shinkansen",
  title: "Shinkansen",
  category: "trains",
  description: "A Japanese high-speed train: a soft inverter whine pulling out, the roar of the wind and the pantograph's hiss at speed.",
  params: [SPEED, LOAD, LEVEL],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level") * 0.112);
    out.connect(dest);
    const sources = [];
    const whine = gain(ctx);
    whine.connect(out);
    const partials = [
      [1, 0.5],
      [1.5, 0.18],
      [2, 0.15]
    ].map(([ratio, level]) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const g = gain(ctx, level);
      osc.connect(g).connect(whine);
      osc.start(t);
      sources.push(osc);
      return { osc, ratio };
    });
    const panto = noiseSource(ctx, true);
    const pantoHp = filter(ctx, "highpass", 2500);
    const pantoLp = filter(ctx, "lowpass", 9e3);
    const pantoG = gain(ctx);
    panto.connect(pantoHp).connect(pantoLp).connect(pantoG).connect(out);
    panto.start(t);
    sources.push(panto);
    const roll = rolling(ctx, out, t, 1200);
    sources.push(roll.src);
    return running(out, sources, initial, (v, at) => {
      const speed = num(v, "speed");
      const ms = speed * TOP_SPEED.shinkansen;
      const f = 420 + 24 * Math.min(ms, 45);
      for (const { osc, ratio } of partials) glide(osc.frequency, f * ratio, at);
      const level = ms < 0.3 ? 0 : Math.min(1, ms / 3) * Math.max(0.15, 1 - ms / 70) * (0.5 + 0.5 * num(v, "load"));
      glide(whine.gain, level * 0.6, at);
      glide(pantoG.gain, Math.pow(speed, 3) * 0.5, at);
      glide(roll.g.gain, rollingLevel(speed) * 1.6, at);
    });
  }
});

// sounds/designs/diesel.ts
var DIESEL_PROFILES = {
  railcar: {
    title: "Railcar (inline six)",
    cylinders: 6,
    strokes: 4,
    idleRpm: 600,
    maxRpm: 2e3,
    uneven: 0.4,
    pulse: 0.5,
    bright: [2e3, 3e3],
    body: [190, 1.4, 6],
    knock: [2300, 0.5],
    breath: 0.8,
    turbo: [2400, 5200, 0.012],
    fan: 0,
    rundown: 1.6,
    trim: 1.24
  },
  shunter: {
    title: "Shunter (medium-speed six)",
    cylinders: 6,
    strokes: 4,
    idleRpm: 420,
    maxRpm: 1250,
    uneven: 0.45,
    pulse: 0.55,
    bright: [1700, 2600],
    body: [120, 1.3, 7],
    knock: [1600, 0.45],
    breath: 0.9,
    turbo: [1800, 4200, 0.014],
    fan: 0,
    rundown: 2.6,
    trim: 1.26
  },
  mainline: {
    title: "Mainline (V12, turbocharged)",
    cylinders: 12,
    strokes: 4,
    idleRpm: 400,
    maxRpm: 1100,
    uneven: 0.35,
    pulse: 0.55,
    bright: [1800, 2800],
    body: [140, 1.2, 6],
    knock: [1500, 0.35],
    breath: 1,
    turbo: [1500, 3800, 0.03],
    fan: 0,
    rundown: 3.4,
    trim: 1
  },
  "two-stroke": {
    title: "Two-stroke (V16, turbocharged)",
    cylinders: 16,
    strokes: 2,
    idleRpm: 315,
    maxRpm: 904,
    uneven: 0.3,
    pulse: 0.6,
    bright: [2e3, 3e3],
    body: [170, 1.1, 5],
    knock: [1300, 0.25],
    breath: 1.1,
    turbo: [1200, 3400, 0.04],
    fan: 0,
    rundown: 4,
    trim: 0.84
  },
  bus: {
    title: "Bus (inline six, turbocharged)",
    cylinders: 6,
    strokes: 4,
    idleRpm: 600,
    maxRpm: 2200,
    uneven: 0.3,
    pulse: 0.55,
    bright: [1400, 2400],
    body: [180, 1.2, 5],
    knock: [2e3, 0.4],
    breath: 0.7,
    turbo: [2800, 6200, 0.01],
    fan: 0,
    rundown: 1.2,
    trim: 1.3
  },
  truck: {
    title: "Truck (air-cooled V8)",
    cylinders: 8,
    strokes: 4,
    idleRpm: 650,
    maxRpm: 2300,
    uneven: 0.5,
    pulse: 0.45,
    bright: [2400, 3400],
    body: [210, 1.5, 6],
    knock: [2500, 0.65],
    breath: 0.7,
    turbo: [0, 0, 0],
    fan: 0.25,
    rundown: 1.1,
    trim: 1.33
  }
};
function dieselProfile(engine) {
  return DIESEL_PROFILES[engine] ?? DIESEL_PROFILES.mainline;
}
var SIZE = { name: "size", title: "Size", kind: "number", min: 0, max: 1, step: 0.05, default: 0.5 };
function sizeScale(size) {
  return 1.2 - 0.4 * size;
}
function dieselRpm(engine, size, rpm) {
  const p = dieselProfile(engine);
  return (p.idleRpm + (p.maxRpm - p.idleRpm) * rpm) * sizeScale(size);
}
function cycleRate(p, revs) {
  return revs / 60 / (p.strokes === 4 ? 2 : 1);
}
function dieselLevel(rpm, load) {
  return 0.35 + 0.3 * rpm + 0.35 * load;
}
var HARMONICS = 192;
var SAMPLES = 2048;
function cycleShape(p, decay, power) {
  const rnd = seeded(p.cylinders * 977 + p.idleRpm);
  const n = p.cylinders;
  const gap = 1 / n;
  const out = new Float64Array(SAMPLES);
  for (let c = 0; c < n; c++) {
    const strength = 1 - p.uneven * rnd();
    const at = c * gap + (rnd() - 0.5) * p.uneven * 0.15 * gap;
    for (let i = 0; i < SAMPLES; i++) {
      let dt = i / SAMPLES - at;
      dt -= Math.floor(dt);
      const rise = 1 - Math.exp(-dt / (0.04 * gap));
      out[i] += strength * rise * Math.exp(-dt / (decay * gap)) ** power;
    }
  }
  return out;
}
function cycleSeries(shape) {
  const real = new Float32Array(HARMONICS + 1);
  const imag = new Float32Array(HARMONICS + 1);
  let mean = 0;
  let peak = 0;
  for (const v of shape) {
    mean += v;
    peak = Math.max(peak, v);
  }
  mean /= shape.length;
  for (let k = 1; k <= HARMONICS; k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const a = 2 * Math.PI * k * i / SAMPLES;
      re += shape[i] * Math.cos(a);
      im += shape[i] * Math.sin(a);
    }
    real[k] = 2 * re / SAMPLES;
    imag[k] = 2 * im / SAMPLES;
  }
  return { real, imag, mean, peak };
}
var waveCache = /* @__PURE__ */ new WeakMap();
function wavesOf(ctx, p) {
  let byProfile = waveCache.get(ctx);
  if (!byProfile) {
    byProfile = /* @__PURE__ */ new Map();
    waveCache.set(ctx, byProfile);
  }
  let w = byProfile.get(p);
  if (!w) {
    const make = (decay, power) => {
      const s = cycleSeries(cycleShape(p, decay, power));
      const scale = 1 / Math.max(1e-6, s.peak - s.mean);
      const real = s.real.map((v) => v * scale);
      const imag = s.imag.map((v) => v * scale);
      return { wave: ctx.createPeriodicWave(real, imag, { disableNormalization: true }), mean: s.mean * scale };
    };
    const tone = make(p.pulse, 1);
    const knock2 = make(0.1, 1);
    const breath = make(0.8, 1);
    w = { tone: tone.wave, knock: knock2.wave, breath: breath.wave, knockMean: knock2.mean, breathMean: breath.mean };
    byProfile.set(p, w);
  }
  return w;
}
var KNOCK_FLOOR = 0.35;
var BREATH_FLOOR = 0.8;
function buildEngine(ctx, into, t, p) {
  const w = wavesOf(ctx, p);
  const master = gain(ctx);
  master.connect(into);
  const dest = master;
  const tone = ctx.createOscillator();
  tone.setPeriodicWave(w.tone);
  const toneGain = gain(ctx);
  const lp = filter(ctx, "lowpass", p.bright[0], 0.8);
  const body = filter(ctx, "peaking", p.body[0], p.body[1]);
  body.gain.value = p.body[2];
  const shelf = filter(ctx, "lowshelf", 160);
  shelf.gain.value = -12;
  tone.connect(toneGain).connect(shelf).connect(body).connect(lp).connect(dest);
  const knockSrc = noiseSource(ctx, true);
  const knockBand = filter(ctx, "bandpass", p.knock[0], 0.9);
  const knockGate = gain(ctx);
  const knockLevel = gain(ctx);
  const knockOsc = ctx.createOscillator();
  knockOsc.setPeriodicWave(w.knock);
  const knockDepth = gain(ctx, 1);
  knockOsc.connect(knockDepth).connect(knockGate.gain);
  knockSrc.connect(knockBand).connect(knockGate).connect(knockLevel).connect(dest);
  const breathSrc = noiseSource(ctx, true);
  const breathLp = filter(ctx, "lowpass", 1200, 0.5);
  const breathGate = gain(ctx);
  const breathLevel = gain(ctx);
  const breathOsc = ctx.createOscillator();
  breathOsc.setPeriodicWave(w.breath);
  const breathDepth = gain(ctx, 1);
  breathOsc.connect(breathDepth).connect(breathGate.gain);
  breathSrc.connect(breathLp).connect(breathGate).connect(breathLevel).connect(dest);
  const turbo = ctx.createOscillator();
  turbo.type = "sine";
  const turboGain = gain(ctx);
  turbo.connect(turboGain).connect(dest);
  const fanSrc = noiseSource(ctx, true);
  const fanBand = filter(ctx, "bandpass", 900, 0.6);
  const fanGain = gain(ctx);
  fanSrc.connect(fanBand).connect(fanGain).connect(dest);
  const cyclers = [tone, knockOsc, breathOsc];
  for (const o of cyclers) o.frequency.value = 0;
  tone.start(t);
  knockOsc.start(t);
  breathOsc.start(t);
  turbo.start(t);
  knockSrc.start(t, 0);
  breathSrc.start(t, 0.61);
  fanSrc.start(t, 1.27);
  const driven = [
    ...cyclers.map((o) => o.frequency),
    toneGain.gain,
    lp.frequency,
    knockGate.gain,
    knockLevel.gain,
    knockBand.frequency,
    breathGate.gain,
    breathLevel.gain,
    breathLp.frequency,
    master.gain,
    turbo.frequency,
    turboGain.gain,
    fanGain.gain
  ];
  return {
    sources: [tone, knockOsc, breathOsc, turbo, knockSrc, breathSrc, fanSrc],
    cancel(at) {
      for (const param of driven) param.cancelScheduledValues(at);
    },
    drive(at, s, tau) {
      const idle = p.idleRpm;
      const turning = s.revs / idle;
      const speed = Math.min(1, turning);
      const rev01 = Math.max(0, Math.min(1, (s.revs - idle) / (p.maxRpm - idle)));
      const rate = cycleRate(p, s.revs);
      for (const o of cyclers) o.frequency.setTargetAtTime(rate, at, tau);
      const work = s.fire * (0.55 + 0.45 * s.load);
      toneGain.gain.setTargetAtTime(speed * (0.35 + 0.65 * s.fire) * (0.7 + 0.3 * rev01) * 0.4, at, tau);
      lp.frequency.setTargetAtTime(
        (0.45 + 0.55 * s.fire) * (p.bright[0] + (p.bright[1] - p.bright[0]) * Math.min(1, 0.5 * s.load + 0.5 * rev01)),
        at,
        tau
      );
      const k = p.knock[1] * s.fire * speed * (1 - 0.4 * s.load) * 0.5;
      knockGate.gain.setTargetAtTime(w.knockMean + KNOCK_FLOOR, at, tau);
      knockLevel.gain.setTargetAtTime(k, at, tau);
      knockBand.frequency.setTargetAtTime(p.knock[0] * (0.9 + 0.3 * rev01), at, tau);
      const b = p.breath * speed * (0.25 + 0.75 * work) * 0.6;
      breathGate.gain.setTargetAtTime(w.breathMean + BREATH_FLOOR, at, tau);
      breathLevel.gain.setTargetAtTime(b, at, tau);
      breathLp.frequency.setTargetAtTime(450 + 700 * rev01 + 350 * s.load, at, tau);
      master.gain.setTargetAtTime(dieselLevel(rev01, s.load) * p.trim, at, tau);
      const [tLo, tHi, tLevel] = p.turbo;
      turbo.frequency.setTargetAtTime(Math.max(1, tLo * 0.3 + (tHi - tLo * 0.3) * s.turbo), at, tau);
      turboGain.gain.setTargetAtTime(tLevel * Math.min(1, s.turbo * 1.6), at, tau);
      fanGain.gain.setTargetAtTime(p.fan * speed * (0.4 + 0.6 * rev01) * 0.3, at, tau);
    }
  };
}
function turboSpeed(rpm, load) {
  return 0.25 + 0.45 * rpm + 0.3 * load * (0.4 + 0.6 * rpm);
}
var DIESEL_TRIM = 0.138;
var STATE = {
  name: "state",
  title: "State",
  kind: "choice",
  values: [
    { value: "run", title: "Running" },
    { value: "start", title: "Starting" },
    { value: "stop", title: "Stopping" },
    { value: "off", title: "Off" }
  ],
  default: "run"
};
function dieselRuns(state) {
  return state === "run" || state === "start";
}
var COUGHING = 0.5;
function dieselStartTimes(_engine) {
  const catches = COUGHING;
  return { catches, idles: catches + 1.8 };
}
function dieselStopTimes(engine) {
  const p = dieselProfile(engine);
  const cut = 0.3;
  const still = cut + p.rundown;
  return { cut, still, ends: still + Math.max(0.6, p.turbo[2] > 0 ? p.rundown * 0.8 : 0.6) };
}
function playStart(engine, kind, p, idle, t) {
  const coughRevs = Math.min(220, idle * 0.45);
  const { catches } = dieselStartTimes(kind);
  const rnd = seeded(p.cylinders * 31 + p.idleRpm);
  const coughs = 6;
  for (let i = 0; i < coughs; i++) {
    const at = t + i * COUGHING / coughs;
    const fire = i % 2 === 0 ? 0.3 + 0.5 * rnd() : 0.05;
    engine.drive(at, { revs: coughRevs * (1 + i * 0.12), load: 0.3, fire, turbo: 0 }, 0.03);
  }
  engine.drive(t + catches, { revs: idle * 1.45, load: 0.6, fire: 1, turbo: 0.3 }, 0.22);
  engine.drive(t + catches + 0.8, { revs: idle, load: 0.1, fire: 1, turbo: turboSpeed(0, 0.1) }, 0.4);
}
function playStop(ctx, out, engine, kind, p, idle, t) {
  const { cut, still, ends } = dieselStopTimes(kind);
  engine.drive(t, { revs: idle, load: 0.1, fire: 1, turbo: turboSpeed(0, 0.1) }, 0.1);
  engine.drive(t + cut, { revs: idle * 0.55, load: 0, fire: 0, turbo: turboSpeed(0, 0.1) }, p.rundown * 0.25);
  engine.drive(t + cut + p.rundown * 0.45, { revs: 0, load: 0, fire: 0, turbo: 0 }, p.rundown * 0.22);
  engine.drive(t + still, { revs: 0, load: 0, fire: 0, turbo: 0 }, (ends - still) / 3);
  const thud = noiseSource(ctx, false);
  const lp = filter(ctx, "lowpass", 180, 1.5);
  const tg = gain(ctx);
  thud.connect(lp).connect(tg).connect(out);
  tg.gain.setValueAtTime(0, t + still - 0.1);
  tg.gain.linearRampToValueAtTime(0.9, t + still - 0.09);
  tg.gain.setTargetAtTime(0, t + still - 0.08, 0.06);
  thud.start(t + still - 0.1, 0.9);
  thud.stop(t + still + 0.4);
  return thud;
}
var ENGINE_WORDS = {
  railcar: "A diesel railcar's or DMU's underfloor inline six",
  shunter: "A shunting locomotive's medium-speed six",
  mainline: "A mainline diesel locomotive's turbocharged V12",
  "two-stroke": "A big two-stroke V16 locomotive engine, the EMD kind",
  bus: "A city bus's turbocharged inline six, muffled",
  truck: "A truck's air-cooled V8, open and clattering, with its fan"
};
function dieselEngineOf(kind) {
  const p = DIESEL_PROFILES[kind];
  return loop({
    id: `diesel-engine-${kind}`,
    title: `Diesel engine: ${p.title}`,
    category: "trains",
    description: `${ENGINE_WORDS[kind]}: idling and revving with the speed (\`rpm\`), growling and knocking harder as it works (\`load\`). \`state\` starts it (it coughs, catches and settles to idle) and shuts it down (it runs down and rocks to a stop).`,
    params: [
      { name: "rpm", title: "Revs", kind: "number", min: 0, max: 1, step: 0.05, default: 0.4 },
      { name: "load", title: "Effort", kind: "number", min: 0, max: 1, step: 0.05, default: 0.5 },
      SIZE,
      STATE,
      LEVEL
    ],
    start(ctx, dest, t, initial) {
      const out = gain(ctx, num(initial, "level") * DIESEL_TRIM);
      out.connect(dest);
      const engine = buildEngine(ctx, out, t, p);
      const sources = [...engine.sources];
      const base = voiceOf(out, sources, Infinity);
      const rnd = seeded(53733);
      let v = initial;
      let phase = "off";
      let until = t;
      let endsAt = Infinity;
      let next = t;
      let stopped = false;
      const idle = () => dieselRpm(kind, num(v, "size"), 0);
      const apply = (at, wobble, tau) => {
        const rpm = num(v, "rpm");
        const load = num(v, "load");
        engine.drive(at, { revs: dieselRpm(kind, num(v, "size"), rpm) * wobble, load, fire: 1, turbo: turboSpeed(rpm, load) }, tau);
      };
      const begin = (at) => {
        engine.cancel(at);
        playStart(engine, kind, p, idle(), at);
        phase = "starting";
        until = at + dieselStartTimes(kind).idles;
        endsAt = Infinity;
      };
      const end = (at) => {
        engine.cancel(at);
        sources.push(playStop(ctx, out, engine, kind, p, idle(), at));
        phase = "stopping";
        until = at + dieselStopTimes(kind).ends;
        endsAt = until;
      };
      const first = choice(initial, "state");
      if (first === "run") {
        phase = "running";
        apply(t, 1, 0.01);
        next = t + 0.3;
      } else if (first === "start") {
        begin(t);
      } else {
        phase = "off";
        engine.drive(t, { revs: 0, load: 0, fire: 0, turbo: 0 }, 0.01);
        endsAt = t;
      }
      return {
        get endsAt() {
          return endsAt;
        },
        stop(at) {
          stopped = true;
          base.stop(at);
        },
        set(values) {
          v = values;
        },
        tick(now, horizon) {
          if (stopped) return;
          const runs = phase === "starting" || phase === "running";
          if (dieselRuns(choice(v, "state")) !== runs) {
            if (runs) end(now);
            else begin(now);
          }
          if (phase === "stopping" && now >= until) phase = "off";
          if (phase === "starting" && until < now + horizon) {
            phase = "running";
            next = until;
          }
          if (phase !== "running") return;
          if (next < now) next = now;
          while (next < now + horizon) {
            apply(next, 0.99 + 0.02 * rnd(), 0.35);
            next += 0.3;
          }
        }
      };
    }
  });
}
var dieselEngineRailcar = /* @__PURE__ */ dieselEngineOf("railcar");
var dieselEngineShunter = /* @__PURE__ */ dieselEngineOf("shunter");
var dieselEngineMainline = /* @__PURE__ */ dieselEngineOf("mainline");
var dieselEngineTwoStroke = /* @__PURE__ */ dieselEngineOf("two-stroke");
var dieselEngineBus = /* @__PURE__ */ dieselEngineOf("bus");
var dieselEngineTruck = /* @__PURE__ */ dieselEngineOf("truck");

// sounds/designs/nature.ts
var BIRD_CALLS = ["chirps", "whistle", "trill"];
function birdGap(density, birds, r) {
  return (2 + 6 * r) / (0.15 + 1.2 * birds * (0.3 + 0.7 * density));
}
var woods = /* @__PURE__ */ loop({
  id: "woods",
  title: "Woods",
  category: "nature",
  description: "A forest around the listener: leaves rustling softly in the wind, and now and then a bird chirping, whistling or trilling somewhere among the trees.",
  params: [
    { name: "density", title: "Density", kind: "number", min: 0, max: 1, step: 0.05, default: 0.6 },
    { name: "birds", title: "Birds", kind: "number", min: 0, max: 1, step: 0.05, default: 0.6 },
    LEVEL
  ],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level") * 0.24);
    out.connect(dest);
    const air = noiseSource(ctx, true);
    const leaves = filter(ctx, "bandpass", 3200, 0.5);
    const leavesSoft = filter(ctx, "lowpass", 6500, 0.5);
    const leavesGain = gain(ctx, 0.04);
    const wind = filter(ctx, "lowpass", 300, 0.6);
    const windGain = gain(ctx, 0.05);
    air.connect(leaves).connect(leavesSoft).connect(leavesGain).connect(out);
    air.connect(wind).connect(windGain).connect(out);
    air.start(t);
    const base = voiceOf(out, [air], Infinity);
    const rnd = seeded(45525);
    let v = initial;
    let nextGust = t;
    let nextBird = t + 0.8;
    let stopped = false;
    const flock = Array.from({ length: 5 }, () => ({ pitch: 2200 + rnd() * 2800, level: 0.25 + 0.75 * rnd(), call: BIRD_CALLS[Math.floor(rnd() * BIRD_CALLS.length)] }));
    const note = (at, from, to, length, peak) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(from, at);
      osc.frequency.exponentialRampToValueAtTime(to, at + length);
      const g = gain(ctx);
      osc.connect(g).connect(out);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(peak, at + Math.min(0.015, length / 3));
      g.gain.linearRampToValueAtTime(0, at + length);
      osc.start(at);
      osc.stop(at + length + 0.02);
    };
    const call = (at, bird, loud) => {
      const p = bird.pitch * (0.95 + 0.1 * rnd());
      const peak = 0.05 * bird.level * loud;
      if (bird.call === "chirps") {
        const n = 2 + Math.floor(rnd() * 4);
        for (let i = 0; i < n; i++) note(at + i * (0.09 + 0.05 * rnd()), p * 1.25, p * 0.85, 0.05 + 0.03 * rnd(), peak);
      } else if (bird.call === "whistle") {
        const len = 0.18 + 0.12 * rnd();
        const second = rnd() < 0.5 ? 0.84 : 1.19;
        note(at, p * 0.6, p * 0.62, len, peak * 0.8);
        note(at + len + 0.06, p * 0.6 * second, p * 0.6 * second * 0.98, len * 1.2, peak * 0.8);
      } else {
        const n = 8 + Math.floor(rnd() * 8);
        for (let i = 0; i < n; i++) {
          const f = p * (i % 2 === 0 ? 1 : 1.12);
          note(at + i * 0.045, f, f * 0.97, 0.035, peak * (0.6 + 0.4 * (1 - i / n)));
        }
      }
    };
    return {
      endsAt: Infinity,
      stop(at) {
        stopped = true;
        base.stop(at);
      },
      set(values) {
        v = values;
      },
      tick(now, horizon) {
        if (stopped) return;
        if (nextGust < now) nextGust = now;
        if (nextBird < now) nextBird = now;
        const density = num(v, "density");
        while (nextGust < now + horizon) {
          const gust = 0.5 + rnd();
          leavesGain.gain.setTargetAtTime((0.02 + 0.05 * density) * gust, nextGust, 0.8);
          windGain.gain.setTargetAtTime((0.03 + 0.03 * density) * (0.6 + 0.8 * rnd()), nextGust, 1);
          leaves.frequency.setTargetAtTime(2600 + 1400 * rnd(), nextGust, 0.8);
          nextGust += 1.2;
        }
        while (nextBird < now + horizon) {
          const birds = num(v, "birds");
          if (birds > 0) call(nextBird, flock[Math.floor(rnd() * flock.length)], 0.5 + 0.5 * density);
          nextBird += birdGap(density, birds, rnd());
        }
      }
    };
  }
});

// sounds/designs/water.ts
var WATER_TRIM = {
  "river-rapids": 0.12,
  waterfall: 0.14,
  "spring-fountain": 0.15,
  "sea-surf": 0.25
};
function waterLoop(ctx, out, sources, t, initial, seed, step, wander, gap, event) {
  const base = voiceOf(out, sources, Infinity);
  const rnd = seeded(seed);
  let v = initial;
  let nextWander = t;
  let nextEvent = t;
  let stopped = false;
  void ctx;
  return {
    endsAt: Infinity,
    stop(at) {
      stopped = true;
      base.stop(at);
    },
    set(values) {
      v = values;
    },
    tick(now, horizon) {
      if (stopped) return;
      if (nextWander < now) nextWander = now;
      if (nextEvent < now) nextEvent = now;
      while (nextWander < now + horizon) {
        wander(nextWander, v, rnd);
        nextWander += step;
      }
      while (nextEvent < now + horizon) {
        event(nextEvent, v, rnd);
        nextEvent += gap(v, rnd);
      }
    }
  };
}
var riverRapids = /* @__PURE__ */ loop({
  id: "river-rapids",
  title: "River rapids",
  category: "water",
  description: "A river running fast over rocks: a rushing bed of water with bubbles and gurgles on top, stronger the steeper and wider the rapid.",
  params: [
    { name: "strength", title: "Strength", kind: "number", min: 0, max: 1, step: 0.05, default: 0.5 },
    LEVEL
  ],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level") * WATER_TRIM["river-rapids"]);
    out.connect(dest);
    const bed = noiseSource(ctx, true);
    const low = filter(ctx, "bandpass", 500, 0.7);
    const high = filter(ctx, "bandpass", 1800, 1.1);
    const lowGain = gain(ctx, 0.5);
    const highGain = gain(ctx, 0.22);
    const soften = filter(ctx, "lowpass", 2600, 0.5);
    soften.connect(out);
    bed.connect(low).connect(lowGain).connect(soften);
    bed.connect(high).connect(highGain).connect(soften);
    bed.start(t);
    return waterLoop(
      ctx,
      out,
      [bed],
      t,
      initial,
      20907,
      0.12,
      (at, v, rnd) => {
        const s = num(v, "strength");
        low.frequency.setTargetAtTime(380 + rnd() * 380, at, 0.08);
        high.frequency.setTargetAtTime(1300 + rnd() * 1300, at, 0.06);
        lowGain.gain.setTargetAtTime((0.35 + 0.35 * s) * (0.8 + 0.4 * rnd()), at, 0.1);
        highGain.gain.setTargetAtTime((0.12 + 0.2 * s) * (0.6 + 0.8 * rnd()), at, 0.05);
      },
      // more bubbles the stronger the rapid
      (v, rnd) => (0.03 + rnd() * 0.12) / (0.5 + num(v, "strength")),
      (at, v, rnd) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        const f = 350 + rnd() * 900;
        osc.frequency.setValueAtTime(f, at);
        osc.frequency.exponentialRampToValueAtTime(f * (1.6 + rnd()), at + 0.04);
        const g = gain(ctx);
        osc.connect(g).connect(out);
        strike(g.gain, at, (0.04 + 0.08 * rnd()) * (0.5 + num(v, "strength")), 0.05 + rnd() * 0.04);
        osc.start(at);
        osc.stop(at + 0.12);
      }
    );
  }
});
var waterfall = /* @__PURE__ */ loop({
  id: "waterfall",
  title: "Waterfall",
  category: "water",
  description: "Water falling over a lip into a pool: a steady roar, deeper and louder the bigger the fall, with a hiss of spray.",
  params: [
    { name: "size", title: "Size", kind: "number", min: 0, max: 1, step: 0.05, default: 0.5 },
    LEVEL
  ],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level") * WATER_TRIM["waterfall"]);
    out.connect(dest);
    const roar = noiseSource(ctx, true);
    const body = filter(ctx, "lowpass", 900, 0.5);
    const bodyGain = gain(ctx, 0.6);
    const spray = filter(ctx, "bandpass", 3200, 0.8);
    const sprayGain = gain(ctx, 0.08);
    const spraySoft = filter(ctx, "lowpass", 5e3, 0.5);
    const thunder = filter(ctx, "lowpass", 180, 0.7);
    const thunderGain = gain(ctx, 0.5);
    roar.connect(body).connect(bodyGain).connect(out);
    roar.connect(spray).connect(spraySoft).connect(sprayGain).connect(out);
    roar.connect(thunder).connect(thunderGain).connect(out);
    roar.start(t);
    return waterLoop(
      ctx,
      out,
      [roar],
      t,
      initial,
      64017,
      0.25,
      (at, v, rnd) => {
        const s = num(v, "size");
        body.frequency.setTargetAtTime((1100 - 600 * s) * (0.9 + 0.2 * rnd()), at, 0.2);
        bodyGain.gain.setTargetAtTime((0.45 + 0.35 * s) * (0.9 + 0.2 * rnd()), at, 0.2);
        thunderGain.gain.setTargetAtTime((0.15 + 0.9 * s) * (0.85 + 0.3 * rnd()), at, 0.25);
        sprayGain.gain.setTargetAtTime((0.05 + 0.05 * s) * (0.8 + 0.4 * rnd()), at, 0.1);
      },
      () => 1,
      () => {
      }
    );
  }
});
var springFountain = /* @__PURE__ */ loop({
  id: "spring-fountain",
  title: "Spring fountain",
  category: "water",
  description: "A spring, which the game draws as a fountain: jets splashing back into a basin, a bright patter of droplets over a soft hiss.",
  params: [
    { name: "size", title: "Size", kind: "number", min: 0, max: 1, step: 0.05, default: 0.5 },
    LEVEL
  ],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level") * WATER_TRIM["spring-fountain"]);
    out.connect(dest);
    const hiss = noiseSource(ctx, true);
    const jet = filter(ctx, "highpass", 2500, 0.6);
    const jetGain = gain(ctx, 0.08);
    const basin = filter(ctx, "bandpass", 1100, 0.9);
    const basinGain = gain(ctx, 0.25);
    hiss.connect(jet).connect(jetGain).connect(out);
    hiss.connect(basin).connect(basinGain).connect(out);
    hiss.start(t);
    const drops = noiseSource(ctx, true);
    const dropFilter = filter(ctx, "bandpass", 3e3, 3);
    const dropGain = gain(ctx);
    drops.connect(dropFilter).connect(dropGain).connect(out);
    drops.start(t);
    return waterLoop(
      ctx,
      out,
      [hiss, drops],
      t,
      initial,
      61680,
      0.15,
      (at, v, rnd) => {
        const s = num(v, "size");
        basin.frequency.setTargetAtTime(900 + rnd() * 500, at, 0.1);
        basinGain.gain.setTargetAtTime((0.15 + 0.2 * s) * (0.8 + 0.4 * rnd()), at, 0.08);
        jetGain.gain.setTargetAtTime((0.05 + 0.06 * s) * (0.85 + 0.3 * rnd()), at, 0.1);
      },
      (v, rnd) => (0.012 + rnd() * 0.04) / (0.6 + num(v, "size")),
      (at, v, rnd) => {
        dropFilter.frequency.setValueAtTime(1800 + rnd() * 4200, at);
        strike(dropGain.gain, at, (0.15 + 0.35 * rnd()) * (0.6 + 0.6 * num(v, "size")), 0.012 + rnd() * 0.02);
      }
    );
  }
});
var seaSurf = /* @__PURE__ */ loop({
  id: "sea-surf",
  title: "Sea surf",
  category: "water",
  description: "The sea on the shore: a steady wash that slowly swells and settles, fuller the stronger.",
  params: [
    { name: "strength", title: "Strength", kind: "number", min: 0, max: 1, step: 0.05, default: 0.5 },
    LEVEL
  ],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level") * WATER_TRIM["sea-surf"]);
    out.connect(dest);
    const sea = noiseSource(ctx, true);
    const rush = filter(ctx, "lowpass", 700, 0.5);
    const rushGain = gain(ctx, 0.3);
    const hiss = filter(ctx, "bandpass", 2400, 0.6);
    const hissGain = gain(ctx, 0.05);
    sea.connect(rush).connect(rushGain).connect(out);
    sea.connect(hiss).connect(hissGain).connect(out);
    sea.start(t);
    return waterLoop(
      ctx,
      out,
      [sea],
      t,
      initial,
      24133,
      0.7,
      (at, v, rnd) => {
        const s = num(v, "strength");
        rush.frequency.setTargetAtTime(500 + 300 * s + rnd() * 250, at, 0.9);
        rushGain.gain.setTargetAtTime((0.18 + 0.22 * s) * (0.8 + 0.4 * rnd()), at, 0.9);
        hissGain.gain.setTargetAtTime((0.03 + 0.04 * s) * (0.7 + 0.6 * rnd()), at, 0.7);
      },
      () => 1,
      () => {
      }
    );
  }
});

// sounds/index.ts
var SOUNDS_FORMAT = 1;
var SOUNDS = [
  locoHorn,
  steamWhistle,
  steamChuff,
  dieselEngineRailcar,
  dieselEngineShunter,
  dieselEngineMainline,
  dieselEngineTwoStroke,
  dieselEngineBus,
  dieselEngineTruck,
  electricEngineResistor,
  electricEngineConverter,
  electricEngineShinkansen,
  crossingBell,
  tramBell,
  shipHorn,
  riverRapids,
  waterfall,
  springFountain,
  seaSurf,
  woods,
  churchBell,
  bigBen,
  notreDameBell,
  editBuild,
  editDemolish
];
var CATEGORIES = [
  { id: "trains", title: "Trains", description: "Locomotives and the railway: horns, whistles, the exhaust beat, diesel engines (railcars, shunters, mainline locomotives, buses and trucks) running, starting and stopping, electric locomotives and trains old and new, the Shinkansen, the level crossing's bell and the tram bell." },
  { id: "ships", title: "Ships", description: "Vessels in port and at sea." },
  { id: "water", title: "Water", description: "Ambient water, played while it is in view: rivers, waterfalls, springs and the sea." },
  { id: "nature", title: "Nature", description: "Ambient life of the land: woods and their birds." },
  { id: "bells", title: "Bells", description: "Tower bells tolling: a village church, Westminster's Great Bell and Notre-Dame's bourdon." },
  { id: "editor", title: "Editor", description: "Feedback of the map editor: building and demolishing." }
];
function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id);
}
function soundsIn(category) {
  return SOUNDS.filter((s) => s.category === category);
}
function soundById(id) {
  return SOUNDS.find((s) => s.id === id);
}
function soundMeta(s) {
  return { id: s.id, title: s.title, category: s.category, description: s.description, kind: s.kind, params: s.params };
}
export {
  CATEGORIES,
  SOUNDS,
  SOUNDS_FORMAT,
  categoryById,
  resolve as resolveValues,
  soundById,
  soundMeta,
  soundsIn
};
