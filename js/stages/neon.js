'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  ARÈNE : TOIT NÉON
 *  Toit d'immeuble dans une mégapole sous la pluie : gratte-ciel,
 *  enseignes qui clignotent, flaques qui reflètent les néons.
 * ===================================================================== */
(function () {
  const rnd = seeded(51);
  const RAIN = Array.from({ length: 90 }, () => ({ x: rnd() * 440, y: rnd() * 216, v: 4 + rnd() * 3 }));
  const SPLASH = Array.from({ length: 10 }, () => ({ x: rnd() * 384, p: Math.floor(rnd() * 30) }));
  const WINDOWS = [];

  function building(g, x, w, top, col, r) {
    R(g, x, top, w, 168 - top, col);
    R(g, x, top, w, 1, '#3a2f5c');
    for (let y = top + 4; y < 160; y += 5) {
      for (let wx = x + 2; wx < x + w - 2; wx += 4) {
        const v = r();
        if (v > 0.55) {
          const c = v > 0.92 ? '#3ff0ff' : v > 0.8 ? '#ff7ac8' : '#ffd88a';
          R(g, wx, y, 2, 2, c);
          if (v > 0.97) WINDOWS.push({ x: wx, y, c });
        } else R(g, wx, y, 2, 2, '#1c1636');
      }
    }
  }

  function sign(g, x, y, w, h, col, glyphs, r) {
    R(g, x - 1, y - 1, w + 2, h + 2, '#000');
    R(g, x, y, w, h, '#14102a');
    g.fillStyle = col;
    for (let i = 0; i < glyphs; i++) {                  // idéogrammes inventés
      const gx = x + 3 + i * 7, gy = y + 3;
      g.fillRect(gx, gy, 5, 1); g.fillRect(gx + 2, gy, 1, h - 6);
      if (r() > 0.5) g.fillRect(gx, gy + 3, 5, 1);
      if (r() > 0.5) g.fillRect(gx, gy + h - 7, 1, 3);
      if (r() > 0.5) g.fillRect(gx + 4, gy + 2, 1, 4);
    }
    R(g, x, y, w, 1, col); R(g, x, y + h - 1, w, 1, col);
  }

  registerStage({
    id: 'neon',
    name: 'TOIT NÉON',
    subtitle: 'Une mégapole sous la pluie, entre néons et hologrammes.',
    ambience: 'rain',
    music: {
      bpm: 120, root: 92.5, steps: 32,
      tracks: [
        { wave: 'sawtooth', oct: 0, vol: 0.07, len: 0.8, pattern: seq('0 0 12 0 0 12 0 12 -4 -4 8 -4 -4 8 -4 8 -2 -2 10 -2 -2 10 -2 10 -5 -5 7 -5 -5 7 -5 7') },
        { wave: 'square', oct: 2, vol: 0.04, len: 2.5, pattern: seq('12 _ _ 15 _ _ 19 _ 17 _ _ 15 _ _ 12 _ 10 _ _ 12 _ _ 15 _ 14 _ _ 12 _ _ 10 _') },
        { drum: true, vol: 0.9, pattern: seq('k _ h _ s _ h _ k k h _ s _ h h') },
      ],
    },

    build(g, W, H) {
      const r = seeded(77);
      WINDOWS.length = 0;
      ['#0c0618', '#140a26', '#1d0f33', '#2a1440', '#3a1a4c', '#4a1f52'].forEach((c, i) => R(g, 0, i * 20, W, 21, c));
      for (let i = 0; i < 6; i++) building(g, i * 70 - 10, 50, 40 + r() * 30, '#120c24', r);       // arrière-plan
      for (let i = 0; i < 8; i++) building(g, i * 52 - 6, 40, 70 + r() * 40, '#1a1230', r);         // premier plan
      sign(g, 60, 70, 36, 16, '#ff3fa4', 4, r);
      sign(g, 270, 60, 22, 30, '#3ff0ff', 2, r);
      sign(g, 180, 92, 44, 14, '#ffd23f', 5, r);
      // château d'eau + climatiseurs sur le toit
      R(g, 312, 120, 30, 26, '#2a2238'); R(g, 312, 120, 30, 2, '#3a3250');
      for (const lx of [314, 338]) R(g, lx, 146, 2, 22, '#2a2238');
      R(g, 40, 150, 22, 12, '#3a3448'); R(g, 44, 152, 14, 8, '#24202e'); R(g, 50, 152, 2, 8, '#4a4458');
      // garde-corps
      R(g, 0, 156, W, 2, '#4a4458');
      for (let x = 0; x < W; x += 12) R(g, x, 156, 1, 12, '#4a4458');
      // toit
      R(g, 0, 168, W, H - 168, '#24202e');
      R(g, 0, 168, W, 1, '#4a4458');
      for (let y = 172; y < H; y += 8) R(g, 0, y, W, 1, '#1c1826');
      for (let i = 0; i < 60; i++) R(g, r() * W, 170 + r() * 46, 1, 1, '#34303e');
      // flaques
      for (const [px, py, pw] of [[70, 182, 46], [210, 198, 60], [320, 188, 38]]) {
        R(g, px, py, pw, 3, '#1a2440'); R(g, px + 3, py - 1, pw - 6, 1, '#1a2440'); R(g, px + 3, py + 3, pw - 6, 1, '#1a2440');
      }
    },

    back(ctx, t) {
      // enseignes qui grésillent
      const flick = (Math.floor(t / 6) * 7919) % 13 === 0;
      if (!flick) {
        ctx.globalAlpha = 0.18;
        R(ctx, 56, 66, 44, 24, '#ff3fa4');
        R(ctx, 266, 56, 30, 38, '#3ff0ff');
        ctx.globalAlpha = 1;
      }
      for (const w of WINDOWS) if (Math.floor(t / 90 + w.x) % 3 === 0) R(ctx, w.x, w.y, 2, 2, '#1c1636');
      if (Math.floor(t / 30) % 2) R(ctx, 326, 118, 2, 2, '#ff3b3b');                  // balise
      // reflets dans les flaques
      for (const [px, py, pw, c] of [[70, 182, 46, '#ff3fa4'], [210, 198, 60, '#ffd23f'], [320, 188, 38, '#3ff0ff']]) {
        ctx.globalAlpha = 0.5;
        for (let k = 0; k < 3; k++) R(ctx, px + 4 + ((t * 0.3 + k * 13) % (pw - 10)), py + 1, 6, 1, c);
        ctx.globalAlpha = 1;
      }
    },

    front(ctx, t) {
      ctx.fillStyle = 'rgba(170,190,255,0.45)';
      for (const d of RAIN) {
        const y = (d.y + t * d.v) % 216, x = ((d.x - t * 1.4) % 440 + 440) % 440 - 30;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 5);
        ctx.fillRect(Math.round(x) - 1, Math.round(y) + 5, 1, 2);
      }
      for (const s of SPLASH) {
        const k = (t + s.p) % 30;
        if (k < 6) R(ctx, s.x - k / 2, 194 + (s.p % 18), k, 1, 'rgba(200,215,255,0.6)');
      }
    },
  });
})();
