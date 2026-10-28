'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  ARÈNE : TOITS DU CRÉPUSCULE
 *  build(g, W, H)  → décor fixe, dessiné une seule fois (mis en cache)
 *  back(ctx, t)    → animations derrière les combattants
 *  front(ctx, t)   → animations devant les combattants (pluie, pétales…)
 *  Le sol est toujours à CONFIG.GROUND_Y (194).
 * ===================================================================== */
registerStage({
  id: 'crepuscule',
  name: 'TOITS DU CRÉPUSCULE',
  subtitle: 'Un dojo perché face au soleil couchant.',
  ambience: 'wind',
  music: {
    bpm: 128, root: 110, steps: 32,
    tracks: [
      { wave: 'square', oct: 1, vol: 0.06, len: 1.8, pattern: seq('7 _ 10 _ 12 _ _ 10 7 _ 5 _ 3 _ 5 _ 7 _ 10 _ 12 _ 15 _ 14 _ 12 _ 10 _ _ _') },
      { wave: 'triangle', oct: 0, vol: 0.16, len: 1.4, pattern: seq('0 _ 0 _ 12 _ 0 _ -4 _ -4 _ 8 _ -4 _ -2 _ -2 _ 10 _ -2 _ -5 _ -5 _ 7 _ -5 _') },
      { drum: true, vol: 0.8, pattern: seq('k _ h _ s _ h _ k _ h _ s _ h h') },
    ],
  },
  build(g, W, H) {
    const rnd = seeded(42);
    const sky = ['#1a1033', '#2a1745', '#3f1f57', '#5e2a63', '#8a3a6b', '#b9506b', '#e0705f', '#f59e5b'];
    sky.forEach((col, i) => R(g, 0, i * 19, W, 20, col));
    for (let i = 0; i < 50; i++) R(g, rnd() * W, rnd() * 60, 1, 1, rnd() > 0.7 ? '#ffffff' : '#bfa8ff');
    const cx = 290, cy = 118, rad = 26;
    for (let dy = -rad; dy <= rad; dy++) {
      if (dy > 0 && dy % 6 < 2) continue;
      const hw = Math.round(Math.sqrt(rad * rad - dy * dy));
      R(g, cx - hw, cy + dy, hw * 2, 1, dy < 0 ? '#ffd166' : '#ff9f5a');
    }
    for (let x = 0; x < W; x++) {
      const h = 34 + Math.sin(x * 0.031) * 12 + Math.sin(x * 0.077 + 1) * 7 + Math.sin(x * 0.19) * 2;
      R(g, x, 150 - h, 1, h, '#4a2d5e');
      R(g, x, 150 - h, 1, 1, '#6a4a7e');
    }
    for (let x = 0; x < W; x++) {
      const h = 14 + Math.sin(x * 0.05 + 2) * 6 + Math.sin(x * 0.11) * 3;
      R(g, x, 160 - h, 1, h + 10, '#2b1a3d');
    }
    R(g, 0, 160, W, 8, '#3a2433');
    for (let x = 0; x < W; x += 24) R(g, x, 158, 4, 10, '#4a3042');
    R(g, 0, 168, W, H - 168, '#6b4f3a');
    R(g, 0, 168, W, 2, '#9a7656');
    const rows = [170, 175, 181, 188, 196, 205, 216];
    for (let i = 0; i < rows.length - 1; i++) {
      R(g, 0, rows[i], W, 1, '#4e3829');
      const sp = 16 + i * 8, off = (i % 2) * sp / 2;
      for (let x = off; x < W; x += sp) R(g, x, rows[i], 1, rows[i + 1] - rows[i], '#4e3829');
    }
    for (let i = 0; i < 120; i++) R(g, rnd() * W, 170 + rnd() * 46, 1, 1, rnd() > 0.5 ? '#7d5d45' : '#5a4130');
    for (const lx of [36, W - 36]) R(g, lx - 1, 126, 3, 44, '#2a1a12');
  },
  back(ctx, t) {
    // vol d'oiseaux qui traverse le ciel
    const bx = ((t * 0.35) % 560) - 90;
    ctx.fillStyle = '#2b1a3d';
    for (let i = 0; i < 7; i++) {
      const x = bx - (i % 2 ? i * 7 : i * 6), y = 46 + Math.abs(i - 3) * 4 + Math.sin(t * 0.05 + i) * 2, up = Math.floor(t / 8 + i) % 2;
      ctx.fillRect(Math.round(x) - 2, Math.round(y) - up, 2, 1); ctx.fillRect(Math.round(x), Math.round(y), 1, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) - up, 2, 1);
    }
    ctx.fillStyle = 'rgba(255,190,190,0.14)';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 110 + t * 0.08 * (1 + i * 0.3)) % (CONFIG.WIDTH + 80)) - 40, y = 30 + i * 14;
      ctx.fillRect(Math.round(x), y, 34, 4); ctx.fillRect(Math.round(x) + 6, y - 3, 20, 3);
    }
  },
});
