'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  ARÈNE : GLACIER BORÉAL
 *  Lac gelé au pied des montagnes, aurore boréale animée,
 *  sapins enneigés et neige qui tombe.
 * ===================================================================== */
(function () {
  const rnd = seeded(91);
  const STARS = Array.from({ length: 80 }, () => ({ x: rnd() * 384, y: rnd() * 110, p: Math.floor(rnd() * 50) }));
  const SNOW = Array.from({ length: 70 }, () => ({ x: rnd() * 400, y: rnd() * 216, v: 0.3 + rnd() * 0.6, o: rnd() * 6, s: rnd() > 0.8 ? 2 : 1 }));

  function pine(g, x, base, h, snow) {
    R(g, x - 1, base - 4, 2, 4, '#2a1c14');
    for (let i = 0; i < h; i++) {
      const w = Math.round((i / h) * h * 0.45) + 1;
      const y = base - 4 - h + i;
      R(g, x - w, y, w * 2, 1, '#163028');
      if (i % 5 === 0 || i < 2) R(g, x - w, y, Math.max(1, w), 1, snow);
    }
  }

  registerStage({
    id: 'toundra',
    name: 'GLACIER BORÉAL',
    subtitle: "Un lac gelé sous les lueurs de l'aurore.",
    ambience: 'wind',
    music: {
      bpm: 84, root: 123.47, steps: 32,
      tracks: [
        { wave: 'triangle', oct: 1, vol: 0.09, len: 1.2, pattern: seq('0 7 12 15 12 7 0 7 -2 5 10 14 10 5 -2 5 -4 3 8 12 8 3 -4 3 -5 2 7 10 7 2 -5 2') },
        { wave: 'sine', oct: 2, vol: 0.05, len: 6, pattern: seq('15 _ _ _ _ _ _ _ 14 _ _ _ _ _ _ _ 12 _ _ _ _ _ _ _ 10 _ _ _ _ _ _ _') },
        { wave: 'triangle', oct: -1, vol: 0.16, len: 6, pattern: seq('0 _ _ _ _ _ _ _ -2 _ _ _ _ _ _ _ -4 _ _ _ _ _ _ _ -5 _ _ _ _ _ _ _') },
        { drum: true, vol: 0.5, pattern: seq('k _ _ _ _ _ _ _ h _ _ _ _ _ h _') },
      ],
    },

    build(g, W, H) {
      const r = seeded(13);
      ['#02040c', '#050a1a', '#081428', '#0c1e36', '#112a44', '#183652', '#20425e'].forEach((c, i) => R(g, 0, i * 18, W, 19, c));
      // montagnes enneigées
      for (let x = 0; x < W; x++) {
        const h1 = 84 + Math.abs(Math.sin(x * 0.018 + 1)) * -30 + Math.sin(x * 0.07) * 6;
        R(g, x, h1, 1, 150 - h1, '#2a3a52');
        const snow = h1 + 10 + Math.sin(x * 0.5) * 3;
        R(g, x, h1, 1, Math.max(0, snow - h1), '#c8d8ea');
        const h2 = 112 + Math.sin(x * 0.04 + 3) * 10 + Math.sin(x * 0.11) * 4;
        R(g, x, h2, 1, 150 - h2, '#1d2c40');
        R(g, x, h2, 1, 3, '#9fb4cc');
      }
      // forêt de sapins
      for (let i = 0; i < 22; i++) pine(g, 6 + i * 18 + r() * 8, 152, 16 + Math.round(r() * 14), '#dfe8f4');
      // berge enneigée
      R(g, 0, 150, W, 18, '#d8e4f0');
      for (let x = 0; x < W; x += 2) R(g, x, 150 - Math.round(Math.abs(Math.sin(x * 0.07)) * 3), 2, 3, '#e8f0f8');
      R(g, 0, 164, W, 4, '#b8c8dc');
      // lac gelé
      R(g, 0, 168, W, H - 168, '#9fcde4');
      R(g, 0, 168, W, 2, '#d8f0fa');
      g.fillStyle = '#7fb4d0';
      for (let i = 0; i < 14; i++) {                       // fissures
        let x = r() * W, y = 172 + r() * 40;
        for (let k = 0; k < 4; k++) { const nx = x + (r() - 0.5) * 30, ny = y + (r() - 0.5) * 8; pxLine(g, x, y, nx, ny, 1); x = nx; y = ny; }
      }
      for (let i = 0; i < 40; i++) R(g, r() * W, 170 + r() * 46, 3 + r() * 6, 1, '#c8e8f6');   // reflets
    },

    back(ctx, t) {
      for (const s of STARS) if ((t + s.p) % 50 < 40) R(ctx, s.x, s.y, 1, 1, '#e0ecff');
      // aurore boréale : rideaux ondulants
      const bands = [['#3fe0a0', 34, 0.6], ['#2fc8c8', 48, 0.45], ['#7a6cff', 26, 0.3]];
      for (const [col, base, a] of bands) {
        ctx.fillStyle = col;
        for (let x = 0; x < CONFIG.WIDTH; x += 2) {
          const y = base + Math.sin(x * 0.025 + t * 0.012 + base) * 10 + Math.sin(x * 0.07 - t * 0.02) * 4;
          const h = 14 + Math.sin(x * 0.05 + t * 0.03) * 8;
          ctx.globalAlpha = a * (0.5 + 0.5 * Math.sin(x * 0.02 + t * 0.015));
          ctx.fillRect(x, Math.round(y), 2, Math.max(2, Math.round(h)));
        }
      }
      ctx.globalAlpha = 1;
    },

    front(ctx, t) {
      for (const f of SNOW) {
        const x = ((f.x + Math.sin(t * 0.02 + f.o) * 10 - t * 0.2) % 400 + 400) % 400 - 8;
        const y = (f.y + t * f.v) % 216;
        R(ctx, x, y, f.s, f.s, '#ffffff');
      }
    },
  });
})();
