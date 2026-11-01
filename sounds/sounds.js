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
      const pipes = [
        [1, 0.16],
        [1.19, 0.11],
        [1.5, 0.07]
      ];
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
function dieselFiring(size, rpm) {
  const idle = 30 - 10 * size;
  const full = 110 - 40 * size;
  return idle + (full - idle) * rpm;
}
function dieselLevel(rpm, load) {
  return 0.35 + 0.3 * rpm + 0.35 * load;
}
var dieselEngine = /* @__PURE__ */ loop({
  id: "diesel-engine",
  title: "Diesel engine",
  category: "trains",
  description: "A diesel locomotive's or railcar's engine: a low chugging drone that revs up with the speed and growls harder as it works, with a turbo's whine on top.",
  params: [
    { name: "rpm", title: "Revs", kind: "number", min: 0, max: 1, step: 0.05, default: 0.4 },
    { name: "load", title: "Effort", kind: "number", min: 0, max: 1, step: 0.05, default: 0.5 },
    { name: "size", title: "Size", kind: "number", min: 0, max: 1, step: 0.05, default: 0.5 },
    LEVEL
  ],
  start(ctx, dest, t, initial) {
    const out = gain(ctx, num(initial, "level") * 0.12);
    out.connect(dest);
    const body = gain(ctx, 0);
    body.connect(out);
    const fire = dieselFiring(num(initial, "size"), num(initial, "rpm"));
    const tone = filter(ctx, "lowpass", 260, 1.2);
    tone.connect(body);
    const saw = ctx.createOscillator();
    saw.type = "sawtooth";
    saw.frequency.value = fire;
    const sawGain = gain(ctx, 0.5);
    saw.connect(sawGain).connect(tone);
    const half = ctx.createOscillator();
    half.type = "square";
    half.frequency.value = fire / 2;
    const halfGain = gain(ctx, 0.22);
    half.connect(halfGain).connect(tone);
    const exhaust = noiseSource(ctx, true);
    const exBand = filter(ctx, "bandpass", 420, 0.8);
    const exGain = gain(ctx, 0.35);
    const chop = ctx.createOscillator();
    chop.type = "sine";
    chop.frequency.value = fire;
    const chopDepth = gain(ctx, 0.25);
    chop.connect(chopDepth).connect(exGain.gain);
    exhaust.connect(exBand).connect(exGain).connect(body);
    const turbo = ctx.createOscillator();
    turbo.type = "sine";
    turbo.frequency.value = 1800;
    const turboGain = gain(ctx, 0);
    turbo.connect(turboGain).connect(body);
    const sources = [saw, half, exhaust, chop, turbo];
    for (const s of sources) s.start(t);
    const base = voiceOf(out, sources, Infinity);
    const rnd = seeded(53733);
    let v = initial;
    let next = t;
    let stopped = false;
    const apply = (at, wobble) => {
      const rpm = num(v, "rpm");
      const load = num(v, "load");
      const f = dieselFiring(num(v, "size"), rpm) * wobble;
      saw.frequency.setTargetAtTime(f, at, 0.35);
      half.frequency.setTargetAtTime(f / 2, at, 0.35);
      chop.frequency.setTargetAtTime(f, at, 0.35);
      tone.frequency.setTargetAtTime(200 + 500 * load + 300 * rpm, at, 0.3);
      exBand.frequency.setTargetAtTime(300 + 400 * rpm, at, 0.3);
      exGain.gain.setTargetAtTime(0.2 + 0.3 * load, at, 0.3);
      turbo.frequency.setTargetAtTime(1500 + 1600 * rpm, at, 0.8);
      turboGain.gain.setTargetAtTime(0.012 * rpm * (0.3 + load), at, 0.6);
      body.gain.setTargetAtTime(dieselLevel(rpm, load), at, 0.3);
    };
    apply(t, 1);
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
          apply(next, 0.985 + 0.03 * rnd());
          next += 0.3;
        }
      }
    };
  }
});

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
  dieselEngine,
  crossingBell,
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
  { id: "trains", title: "Trains", description: "Locomotives and the railway: horns, whistles, the exhaust beat, the diesel engine, the level crossing's bell." },
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
