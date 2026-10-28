'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  ARÈNE : TEMPLE DES CERISIERS (thème Japon)
 *  Mont enneigé, pagode, torii vermillon, cerisiers en fleur,
 *  lanternes de pierre et pluie de pétales.
 * ===================================================================== */
(function () {
  const rnd = seeded(7);
  const PETALS_BACK = Array.from({ length: 30 }, () => ({ x: rnd() * 400, y: rnd() * 200, vx: 0.2 + rnd() * 0.35, vy: 0.25 + rnd() * 0.35, f: 0.02 + rnd() * 0.03, o: rnd() * 6 }));
  const PETALS_FRONT = Array.from({ length: 12 }, () => ({ x: rnd() * 400, y: rnd() * 216, vx: 0.5 + rnd() * 0.6, vy: 0.6 + rnd() * 0.5, f: 0.03 + rnd() * 0.03, o: rnd() * 6 }));
  const PINKS = ['#e889ad', '#f7a8c4', '#fbc8da', '#ffe4ee'];

  function tree(g, x, baseY, topY, r, seed) {
    const tr = seeded(seed);
    // tronc + branches
    g.fillStyle = '#4a2f2a';
    pxLine(g, x, baseY, x + 2, topY + r * 0.6, 4);
    pxLine(g, x + 1, topY + r * 0.9, x - r * 0.6, topY + r * 0.2, 2);
    pxLine(g, x + 2, topY + r * 0.8, x + r * 0.7, topY + r * 0.1, 2);
    R(g, x - 1, baseY - 20, 1, 14, '#6a4a40');
    // feuillage en grappes
    for (let layer = 0; layer < 4; layer++) {
      for (let i = 0; i < 12; i++) {
        const a = tr() * Math.PI * 2, d = tr() * r * 0.85;
        const cx = x + Math.cos(a) * d * 1.3 - layer * 1.5, cy = topY + r * 0.4 + Math.sin(a) * d * 0.7 - layer * 2;
        disc(g, cx, cy, Math.max(2, Math.round(r * (0.32 - layer * 0.05) + tr() * 3)), PINKS[layer]);
      }
    }
  }

  function lantern(g, x, y) {
    R(g, x - 6, y - 3, 12, 3, '#76716a');
    R(g, x - 2, y - 12, 4, 9, '#9a958c');
    R(g, x - 5, y - 13, 10, 2, '#76716a');
    R(g, x - 4, y - 20, 8, 7, '#9a958c');
    R(g, x - 2, y - 18, 4, 3, '#2a2420');
    R(g, x - 7, y - 23, 14, 3, '#76716a');
    R(g, x - 5, y - 24, 10, 1, '#9a958c');
    R(g, x - 1, y - 27, 2, 3, '#76716a');
  }

  registerStage({
    id: 'sakura',
    name: 'TEMPLE DES CERISIERS',
    subtitle: 'Japon, printemps : torii, pagode et pétales au vent.',
    ambience: 'wind',
    music: {
      bpm: 92, root: 164.81, steps: 32,
      tracks: [
        { wave: 'triangle', oct: 1, vol: 0.12, len: 0.7, pattern: seq('12 _ 13 _ 17 _ 19 _ 20 _ 19 17 13 _ 12 _ 8 _ 7 _ 5 _ 7 8 7 _ 5 _ 1 _ 0 _') },
        { wave: 'square', oct: 1, vol: 0.03, len: 2.5, pattern: seq('_ _ _ _ _ _ _ _ 24 _ _ _ 20 _ _ _ _ _ _ _ _ _ _ _ 17 _ _ _ 19 _ _ _') },
        { wave: 'triangle', oct: -1, vol: 0.18, len: 2, pattern: seq('0 _ _ _ 0 _ 7 _ -4 _ _ _ -4 _ 5 _ 1 _ _ _ 1 _ 8 _ -5 _ _ _ 0 _ _ _') },
        { drum: true, vol: 0.9, pattern: seq('k _ _ _ _ _ k _ s _ _ _ k _ _ _') },
      ],
    },

    build(g, W, H) {
      const r = seeded(11);
      // ciel pastel
      ['#6fa8dc', '#86b6e2', '#9fc4e8', '#b8d2ee', '#d0dff2', '#e6e6f2', '#f6dce6', '#fbd0dc'].forEach((c, i) => R(g, 0, i * 19, W, 20, c));
      disc(g, 304, 66, 20, '#ffeef3');
      disc(g, 304, 66, 16, '#fff8ee');
      // mont enneigé
      for (let x = 60; x < 360; x++) {
        const top = 46 + Math.abs(x - 210) * 0.66 + Math.sin(x * 0.21) * 1.5;
        R(g, x, top, 1, 152 - top, x > 210 ? '#6a7bab' : '#7d8fc0');
        const snow = 64 + Math.sin(x * 0.35) * 3 + ((x * 7) % 5);
        if (top < snow) R(g, x, top, 1, snow - top, x > 210 ? '#d8def2' : '#f4f6ff');
      }
      // collines lointaines
      for (let x = 0; x < W; x++) {
        const h = 132 + Math.sin(x * 0.03) * 6 + Math.sin(x * 0.09 + 2) * 3;
        R(g, x, h, 1, 160 - h, '#8d9cc6');
      }
      // pagode à cinq toits
      let py = 152;
      const pcx = 58;
      for (let i = 0; i < 5; i++) {
        const bw = 26 - i * 4;
        R(g, pcx - bw / 2, py - 7, bw, 7, '#8a2b2b');
        for (let wx = -bw / 2 + 3; wx < bw / 2 - 2; wx += 4) R(g, pcx + wx, py - 5, 2, 3, '#3a1414');
        R(g, pcx - bw / 2 - 5, py - 10, bw + 10, 3, '#2b2b3a');
        R(g, pcx - bw / 2 - 5, py - 10, bw + 10, 1, '#4a4a5e');
        R(g, pcx - bw / 2 - 6, py - 11, 2, 1, '#2b2b3a');
        R(g, pcx + bw / 2 + 4, py - 11, 2, 1, '#2b2b3a');
        py -= 10;
      }
      R(g, pcx - 1, py - 12, 2, 12, '#c9a227');
      for (let k = 0; k < 4; k++) R(g, pcx - 2, py - 11 + k * 3, 4, 1, '#c9a227');
      // cerisiers derrière le mur
      tree(g, 128, 160, 86, 30, 3);
      tree(g, 238, 160, 108, 18, 5);
      tree(g, 362, 160, 76, 34, 9);
      // mur du temple
      R(g, 0, 146, W, 3, '#3a3a4a');
      R(g, 0, 145, W, 1, '#55556a');
      for (let x = 0; x < W; x += 6) R(g, x, 148, 3, 1, '#2b2b3a');
      R(g, 0, 149, W, 19, '#efe6d8');
      R(g, 0, 165, W, 3, '#d8ccba');
      for (let x = 8; x < W; x += 40) R(g, x, 149, 3, 19, '#8a5a3a');
      // torii vermillon
      const tx = 300;
      R(g, tx - 24, 104, 48, 4, '#1f1f2a');
      R(g, tx - 26, 102, 3, 3, '#1f1f2a'); R(g, tx + 23, 102, 3, 3, '#1f1f2a');
      R(g, tx - 22, 108, 44, 3, '#d93a2b');
      R(g, tx - 18, 120, 36, 3, '#d93a2b');
      R(g, tx - 2, 111, 4, 9, '#1f1f2a'); R(g, tx - 1, 114, 2, 2, '#c9a227');
      for (const px of [tx - 15, tx + 11]) {
        R(g, px, 108, 4, 60, '#d93a2b');
        R(g, px + 3, 108, 1, 60, '#a82a1f');
        R(g, px - 1, 162, 6, 6, '#1f1f2a');
      }
      // lanternes de pierre
      lantern(g, 92, 168);
      lantern(g, 214, 168);
      // sol en dalles de pierre
      R(g, 0, 168, W, H - 168, '#b5a58f');
      R(g, 0, 168, W, 2, '#d6c8b0');
      const rows = [170, 176, 184, 194, 206, 216];
      for (let i = 0; i < rows.length - 1; i++) {
        R(g, 0, rows[i], W, 1, '#8f806c');
        const sp = 22 + i * 10, off = (i % 2) * sp / 2;
        for (let x = off; x < W; x += sp) R(g, x, rows[i], 1, rows[i + 1] - rows[i], '#8f806c');
      }
      for (let i = 0; i < 90; i++) R(g, r() * W, 170 + r() * 46, 1, 1, r() > 0.5 ? '#a39480' : '#c7b8a0');
      for (let i = 0; i < 45; i++) R(g, r() * W, 171 + r() * 44, r() > 0.5 ? 2 : 1, 1, r() > 0.4 ? '#f7a8c4' : '#ffe4ee');
    },

    back(ctx, t) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 3; i++) {
        const x = ((i * 140 + t * 0.06 * (1 + i * 0.4)) % (CONFIG.WIDTH + 80)) - 40, y = 24 + i * 16;
        ctx.fillRect(Math.round(x), y, 40, 3); ctx.fillRect(Math.round(x) + 8, y - 2, 22, 2);
      }
      for (const lx of [92, 214]) {
        const on = Math.sin(t * 0.2 + lx) > -0.6;
        R(ctx, lx - 2, 150, 4, 3, on ? '#ffd166' : '#e0a050');
      }
      for (const p of PETALS_BACK) {
        const x = ((p.x + t * p.vx + Math.sin(t * p.f + p.o) * 12) % 410 + 410) % 410 - 13;
        const y = (p.y + t * p.vy) % 200;
        const flip = Math.sin(t * p.f * 3 + p.o) > 0;
        R(ctx, x, y, flip ? 2 : 1, flip ? 1 : 2, p.o > 3 ? '#f7a8c4' : '#ffe4ee');
      }
    },

    front(ctx, t) {
      for (const p of PETALS_FRONT) {
        const x = ((p.x + t * p.vx + Math.sin(t * p.f + p.o) * 16) % 420 + 420) % 420 - 18;
        const y = (p.y + t * p.vy) % 216;
        const flip = Math.sin(t * p.f * 3 + p.o) > 0;
        R(ctx, x, y, flip ? 3 : 2, flip ? 2 : 3, '#f7a8c4');
        R(ctx, x, y, 1, 1, '#ffe4ee');
      }
    },
  });
})();
