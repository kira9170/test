'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  SON : bruitages 8-bit et petit séquenceur de musique chiptune
 *  (tout est généré, aucun fichier audio requis)
 * ===================================================================== */
const Sfx = {
  ctx: null, master: null, musicBus: null, buf: null,

  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.connect(this.ctx.destination);
        this.ambBus = this.ctx.createGain();
        this.ambBus.connect(this.ctx.destination);
        this.applyVolumes();
      } catch (e) { this.ctx = null; return; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    Music.resume();
    Ambience.resume();
  },

  applyVolumes() {
    if (!this.ctx) return;
    const d = Settings.data;
    this.master.gain.value = 0.9 * (d.sfxVol != null ? d.sfxVol : 1);
    this.musicBus.gain.value = 0.2 * (d.musicVol != null ? d.musicVol : 0.75);
    this.ambBus.gain.value = 0.5 * (d.sfxVol != null ? d.sfxVol : 1);
  },

  tone(freq, dur, type = 'square', vol = 0.06, slideTo = null, delay = 0, bus = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus || this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },

  noise(dur, vol, freq, type = 'bandpass', delay = 0, bus = null, at = null) {
    if (!this.ctx) return;
    if (!this.buf) {
      const len = this.ctx.sampleRate;
      this.buf = this.ctx.createBuffer(1, len, len);
      const d = this.buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = at != null ? at : this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    src.buffer = this.buf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus || this.master);
    src.start(t); src.stop(t + dur + 0.02);
  },

  play(name) {
    if (!this.ctx || !Settings.data.sfx) return;
    switch (name) {
      case 'whoosh':   this.tone(500, 0.07, 'triangle', 0.035, 180); break;
      case 'slash':    this.noise(0.16, 0.1, 1600); this.tone(260, 0.12, 'sawtooth', 0.03, 80); break;
      case 'shot':     this.noise(0.1, 0.12, 2800); this.tone(900, 0.09, 'square', 0.04, 160); break;
      case 'zap':      this.tone(1500, 0.09, 'sawtooth', 0.035, 300); this.noise(0.08, 0.05, 5000, 'highpass'); break;
      case 'grind':    this.noise(0.25, 0.05, 3000, 'highpass'); break;
      case 'splash':   this.noise(0.35, 0.09, 700, 'lowpass'); this.tone(160, 0.2, 'sine', 0.05, 60); break;
      case 'hit':      this.tone(200, 0.1, 'square', 0.08, 70); break;
      case 'hitL':     this.tone(320, 0.06, 'square', 0.06, 140); this.noise(0.04, 0.05, 2500); break;
      case 'hitM':     this.tone(200, 0.1, 'square', 0.08, 70); this.noise(0.07, 0.06, 1400); break;
      case 'hitH':     this.tone(120, 0.2, 'sawtooth', 0.1, 35); this.noise(0.18, 0.09, 600, 'lowpass'); break;
      case 'land':     this.noise(0.05, 0.04, 400, 'lowpass'); break;
      case 'thud':     this.tone(90, 0.18, 'sine', 0.12, 40); this.noise(0.15, 0.07, 300, 'lowpass'); break;
      case 'tech':     this.tone(900, 0.06, 'square', 0.05, 1400); this.tone(1400, 0.08, 'square', 0.04, 900, 0.05); break;
      case 'clink':    this.tone(1800, 0.12, 'triangle', 0.06, 1600); this.noise(0.05, 0.04, 4000, 'highpass'); break;
      case 'reflect':  this.tone(600, 0.15, 'square', 0.05, 1800); break;
      case 'heal':     [660, 880, 1100].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.05, null, i * 0.07)); break;
      case 'net':      this.noise(0.2, 0.06, 900); this.tone(300, 0.1, 'triangle', 0.03, 200); break;
      case 'bounce':   this.tone(500, 0.06, 'sine', 0.05, 900); break;
      case 'charge':   this.tone(400 + Math.random() * 300, 0.04, 'sine', 0.02); break;
      case 'charged':  this.tone(1200, 0.2, 'triangle', 0.05, 1600); break;
      case 'bell':     [196, 392, 588, 941].forEach((f, i) => this.tone(f, 1.2 - i * 0.2, 'sine', 0.09 - i * 0.015)); break;
      case 'twang':    this.tone(220, 0.35, 'sawtooth', 0.04, 210); this.tone(330, 0.25, 'triangle', 0.03); break;
      case 'note':     this.tone(pick([523, 587, 659, 784, 880]), 0.15, 'triangle', 0.05); break;
      case 'chord':    [262, 330, 392, 523].forEach(f => this.tone(f, 0.4, 'sawtooth', 0.035)); break;
      case 'puppet':   this.tone(700, 0.04, 'square', 0.03); this.tone(500, 0.04, 'square', 0.03, null, 0.05); break;
      case 'sizzle':   this.noise(0.3, 0.06, 5000, 'highpass'); break;
      case 'pan':      this.tone(900, 0.25, 'triangle', 0.07, 850); this.tone(1350, 0.2, 'sine', 0.04); break;
      case 'servo':    this.tone(180, 0.08, 'sawtooth', 0.03, 420); break;
      case 'heavy':    this.tone(140, 0.18, 'sawtooth', 0.1, 40); this.tone(90, 0.2, 'square', 0.06, 30); break;
      case 'block':    this.tone(1100, 0.05, 'square', 0.04, 700); break;
      case 'clang':    this.tone(1300, 0.18, 'triangle', 0.06, 1200); this.tone(650, 0.2, 'square', 0.03, 600); break;
      case 'throw':    this.tone(110, 0.25, 'square', 0.09, 40); this.noise(0.2, 0.07, 400, 'lowpass'); break;
      case 'dash':     this.noise(0.08, 0.05, 1200); break;
      case 'teleport': this.tone(1200, 0.15, 'sine', 0.05, 200); this.noise(0.15, 0.04, 900); break;
      case 'freeze':   this.tone(1800, 0.12, 'triangle', 0.04, 2600); this.tone(2400, 0.2, 'sine', 0.03, 1200, 0.05); break;
      case 'shatter':  this.noise(0.25, 0.08, 5000, 'highpass'); this.tone(2200, 0.1, 'triangle', 0.03, 900); break;
      case 'howl':     this.tone(300, 0.25, 'sawtooth', 0.05, 700); this.tone(700, 0.5, 'sawtooth', 0.04, 260, 0.25); break;
      case 'counter':  this.tone(1600, 0.08, 'square', 0.05); this.tone(2400, 0.2, 'triangle', 0.05, null, 0.06); break;
      case 'super':    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'square', 0.05, null, i * 0.06)); this.noise(0.4, 0.05, 2000); break;
      case 'special':  this.tone(260, 0.25, 'sawtooth', 0.06, 900); break;
      case 'jump':     this.tone(280, 0.09, 'triangle', 0.035, 520); break;
      case 'ko':       this.tone(420, 0.7, 'sawtooth', 0.09, 35); break;
      case 'round':    this.tone(523, 0.1, 'square', 0.06); this.tone(659, 0.1, 'square', 0.06, null, 0.1); break;
      case 'fight':    this.tone(523, 0.08, 'square', 0.07); this.tone(784, 0.25, 'square', 0.07, null, 0.09); break;
      case 'select':   this.tone(880, 0.05, 'square', 0.04); break;
      case 'move':     this.tone(660, 0.03, 'square', 0.025); break;
    }
  },
};

/* ---------------------------------------------------------------------
 *  MUSIQUE : séquenceur pas-à-pas (doubles croches).
 *  Une chanson = { bpm, root (Hz), steps, tracks: [{ wave, oct, vol, len, pattern }] }
 *  Un pattern est écrit avec seq('0 _ 3 _ 7') : demi-tons au-dessus de root, '_' = silence.
 *  Piste de batterie : { drum: true, pattern: seq('k _ h _ s _ h _') } (k=grosse caisse, s=caisse claire, h=charleston)
 * --------------------------------------------------------------------- */
function seq(str) {
  return str.trim().split(/\s+/).map(x => (x === '_' || x === '.') ? null : (isNaN(+x) ? x : +x));
}

const Music = {
  song: null, timer: null, step: 0, nextTime: 0,

  play(song) {
    if (this.song === song && this.timer) return;
    this.stop();
    this.song = song;
    this.resume();
  },
  resume() {
    if (!this.song || this.timer || !Sfx.ctx || !Settings.data.music) return;
    this.step = 0;
    this.nextTime = Sfx.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.tick(), 25);
  },
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  },
  tick() {
    const ctx = Sfx.ctx, s = this.song;
    if (!ctx || !s) return;
    const dt = 60 / s.bpm / 4;
    if (this.nextTime < ctx.currentTime - 0.3) this.nextTime = ctx.currentTime + 0.02;  // onglet en arrière-plan
    while (this.nextTime < ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime, dt);
      this.nextTime += dt;
      this.step = (this.step + 1) % (s.steps || 32);
    }
  },
  playStep(i, t, dt) {
    for (const tr of this.song.tracks) {
      const n = tr.pattern[i % tr.pattern.length];
      if (n == null) continue;
      if (tr.drum) { this.drum(n, t, tr.vol || 1); continue; }
      const f = this.song.root * Math.pow(2, (n + (tr.oct || 0) * 12) / 12);
      this.voice(tr.wave || 'square', f, t, dt * (tr.len || 0.9), tr.vol || 0.1);
    }
  },
  voice(wave, f, t, d, vol) {
    const ctx = Sfx.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(Sfx.musicBus);
    o.start(t); o.stop(t + d + 0.02);
  },
  drum(k, t, vol) {
    const ctx = Sfx.ctx;
    if (k === 'k') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.5 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g).connect(Sfx.musicBus); o.start(t); o.stop(t + 0.16);
    } else if (k === 's') Sfx.noise(0.1, 0.22 * vol, 1800, 'bandpass', 0, Sfx.musicBus, t);
    else if (k === 'h') Sfx.noise(0.03, 0.12 * vol, 7000, 'highpass', 0, Sfx.musicBus, t);
  },
};

/* ---------------------------------------------------------------------
 *  AMBIANCE SONORE DES ARÈNES : bruit filtré en boucle (vent, mer, pluie, ville)
 *  Une arène déclare  ambience: 'wind' | 'sea' | 'rain' | 'city'
 * --------------------------------------------------------------------- */
const Ambience = {
  kind: null, nodes: null,
  PRESETS: {
    wind: { type: 'bandpass', freq: 500, q: 0.6, vol: 0.05, lfo: 0.15, depth: 0.03 },
    sea:  { type: 'lowpass', freq: 520, q: 0.4, vol: 0.07, lfo: 0.12, depth: 0.05 },
    rain: { type: 'highpass', freq: 2500, q: 0.3, vol: 0.04, lfo: 0.5, depth: 0.008 },
    city: { type: 'lowpass', freq: 260, q: 0.3, vol: 0.05, lfo: 0.07, depth: 0.015 },
  },
  play(kind) {
    if (this.kind === kind && this.nodes) return;
    this.stop();
    this.kind = kind || null;
    this.resume();
  },
  resume() {
    const ctx = Sfx.ctx, pr = this.PRESETS[this.kind];
    if (!ctx || !pr || this.nodes || !Settings.data.sfx) return;
    if (!Sfx.buf) Sfx.noise(0.01, 0.0001, 100);           // crée le tampon de bruit
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    src.buffer = Sfx.buf; src.loop = true;
    f.type = pr.type; f.frequency.value = pr.freq; f.Q.value = pr.q;
    g.gain.value = pr.vol;
    lfo.frequency.value = pr.lfo; lg.gain.value = pr.depth;
    lfo.connect(lg).connect(g.gain);
    src.connect(f).connect(g).connect(Sfx.ambBus);
    src.start(); lfo.start();
    this.nodes = { src, lfo };
  },
  stop() {
    if (this.nodes) { try { this.nodes.src.stop(); this.nodes.lfo.stop(); } catch (e) { /* déjà arrêté */ } }
    this.nodes = null;
  },
};

/* Thème des menus */
const MENU_THEME = {
  bpm: 132, root: 110, steps: 32,
  tracks: [
    { wave: 'square', oct: 1, vol: 0.07, len: 1.6, pattern: seq('12 _ 15 _ 19 _ 15 _ 12 _ 10 _ 7 _ 10 _ 12 _ 15 _ 19 _ 22 _ 24 _ 22 _ 19 _ 15 _') },
    { wave: 'triangle', oct: 0, vol: 0.16, len: 1.6, pattern: seq('0 _ 0 _ 0 _ 0 _ -4 _ -4 _ -4 _ -4 _ -2 _ -2 _ -2 _ -2 _ -5 _ -5 _ 0 _ 0 _') },
    { drum: true, vol: 0.8, pattern: seq('k _ h _ s _ h _ k _ h k s _ h h') },
  ],
};
