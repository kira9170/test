'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  ARÈNE : PORT DE MINUIT
 *  Ponton en bois sous la pleine lune, phare au faisceau tournant,
 *  mer animée et caisses de marchandises.
 * ===================================================================== */
(function () {
  const rnd = seeded(23);
  const STARS = Array.from({ length: 70 }, () => ({ x: rnd() * 384, y: rnd() * 100, p: Math.floor(rnd() * 60) }));
  const FOG = Array.from({ length: 6 }, (_, i) => ({ x: rnd() * 400, y: 176 + rnd() * 30, w: 40 + rnd() * 50, v: 0.15 + rnd() * 0.2 }));

  function crate(g, x, y, w, h) {
    R(g, x, y, w, h, '#8a6038');
    R(g, x, y, w, 1, '#a8784a');
    R(g, x, y, 1, h, '#a8784a');
    R(g, x + w - 1, y, 1, h, '#5a3c22');
    R(g, x, y + h - 1, w, 1, '#5a3c22');
    g.fillStyle = '#5a3c22';
    pxLine(g, x + 1, y + 1, x + w - 2, y + h - 2, 1);
    pxLine(g, x + w - 2, y + 1, x + 1, y + h - 2, 1);
  }

  registerStage({
    id: 'port',
    name: 'PORT DE MINUIT',
    subtitle: 'Un ponton battu par les vagues, sous la pleine lune.',
    ambience: 'sea',
    music: {
      bpm: 112, root: 146.83, steps: 32,
      tracks: [
        { wave: 'square', oct: 1, vol: 0.055, len: 1.5, pattern: seq('0 _ 3 5 7 _ 7 _ 5 _ 3 _ 2 _ 0 _ 3 _ 5 7 8 _ 8 _ 7 _ 5 _ 3 _ 2 _') },
        { wave: 'triangle', oct: 0, vol: 0.17, len: 1.5, pattern: seq('0 _ 7 _ 0 _ 7 _ -2 _ 5 _ -2 _ 5 _ -4 _ 3 _ -4 _ 3 _ -5 _ 2 _ -5 _ 2 _') },
        { drum: true, vol: 0.7, pattern: seq('k _ h _ s _ h _ k h _ h s _ h _') },
      ],
    },

    build(g, W, H) {
      const r = seeded(31);
      ['#070b1e', '#0b1230', '#101a40', '#16234f', '#1d2d5e', '#26386b'].forEach((c, i) => R(g, 0, i * 20, W, 21, c));
      disc(g, 298, 46, 20, '#f2efd8');                          // lune
      disc(g, 291, 40, 4, '#d8d4b8'); disc(g, 304, 52, 3, '#d8d4b8'); disc(g, 306, 38, 2, '#d8d4b8');
      for (let x = 0; x < W; x++) {                             // côte lointaine
        const h = 112 + Math.sin(x * 0.04) * 5 + Math.sin(x * 0.13) * 2;
        R(g, x, h, 1, 124 - h, '#141c3a');
      }
      for (let i = 0; i < 18; i++) R(g, 150 + r() * 220, 116 + r() * 6, 1, 1, '#ffd166');   // lumières lointaines
      // rochers + phare
      for (let x = 0; x < 110; x++) {
        const h = 128 + Math.abs(Math.sin(x * 0.09)) * -10 + (x > 70 ? (x - 70) * 0.4 : 0);
        R(g, x, h, 1, 140 - h, '#232838');
      }
      const lx = 52;
      for (let y = 60; y < 124; y++) {
        const w = Math.round(10 + (y - 60) * 0.12);
        R(g, lx - w / 2, y, w, 1, Math.floor((y - 60) / 9) % 2 ? '#c83b3b' : '#e8e4dc');
      }
      R(g, lx - 8, 56, 16, 4, '#2a2a36');
      R(g, lx - 5, 46, 10, 10, '#ffe9a0');
      R(g, lx - 5, 46, 10, 1, '#2a2a36'); R(g, lx - 1, 46, 2, 10, '#2a2a36');
      R(g, lx - 6, 42, 12, 4, '#c83b3b');
      R(g, lx - 1, 38, 2, 4, '#2a2a36');
      // mer
      R(g, 0, 124, W, 44, '#0f2448');
      for (let y = 126; y < 168; y += 3) for (let x = 0; x < W; x += 9) if (r() > 0.55) R(g, x + r() * 6, y, 3 + r() * 4, 1, '#1d3a6a');
      // bateau au mouillage
      R(g, 220, 132, 34, 4, '#1a1a26');
      R(g, 224, 136, 26, 2, '#1a1a26');
      R(g, 236, 108, 1, 24, '#1a1a26');
      g.fillStyle = '#2a2a3a';
      for (let y = 110; y < 130; y++) g.fillRect(237, y, Math.round((y - 110) * 0.6), 1);
      // ponton
      R(g, 0, 162, W, 6, '#3a2a1c');
      for (let x = 6; x < W; x += 46) { R(g, x, 150, 5, 18, '#4a3624'); R(g, x, 150, 5, 2, '#6a5034'); }
      g.fillStyle = '#b8a070';
      for (let x = 8; x < W - 46; x += 46) for (let k = 0; k < 44; k += 2) g.fillRect(x + k, 153 + Math.round(Math.sin(k / 44 * Math.PI) * 4), 2, 1);
      crate(g, 14, 140, 20, 22); crate(g, 30, 148, 14, 14); crate(g, 346, 142, 22, 20);
      R(g, 330, 146, 12, 16, '#5a3a20'); R(g, 330, 149, 12, 1, '#8a6038'); R(g, 330, 157, 12, 1, '#8a6038');   // tonneau
      // planches du quai
      R(g, 0, 168, W, H - 168, '#6a4c32');
      for (let y = 168; y < H; y += 6) R(g, 0, y, W, 1, '#4a3420');
      for (let y = 168, i = 0; y < H; y += 6, i++) for (let x = (i % 2) * 30; x < W; x += 60) R(g, x, y, 1, 6, '#4a3420');
      for (let i = 0; i < 80; i++) R(g, r() * W, 169 + r() * 46, 2, 1, r() > 0.5 ? '#7a5a3c' : '#5a3e28');
      for (let x = 20; x < W; x += 60) { R(g, x, 172, 1, 1, '#9aa0b0'); R(g, x + 30, 184, 1, 1, '#9aa0b0'); }
    },

    back(ctx, t) {
      for (const s of STARS) if ((t + s.p) % 60 < 48) R(ctx, s.x, s.y, 1, 1, '#c8d4ff');
      // mouettes qui tournent au-dessus du port
      for (let i = 0; i < 3; i++) {
        const a = t * 0.012 + i * 2.1, x = 190 + Math.cos(a) * (70 + i * 25), y = 70 + Math.sin(a * 1.3) * 14 + i * 8, up = Math.floor(t / 7 + i) % 2;
        ctx.fillStyle = '#d8dcea';
        ctx.fillRect(Math.round(x) - 3, Math.round(y) - up, 3, 1); ctx.fillRect(Math.round(x), Math.round(y), 1, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) - up, 3, 1);
      }
      // faisceau du phare
      const a = Math.sin(t * 0.02) * 0.9;
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ffe9a0';
      ctx.beginPath();
      ctx.moveTo(52, 51);
      ctx.lineTo(52 + Math.cos(a) * 340, 51 + Math.sin(a) * 60 - 18);
      ctx.lineTo(52 + Math.cos(a) * 340, 51 + Math.sin(a) * 60 + 18);
      ctx.fill();
      ctx.restore();
      // reflet de la lune et vagues
      for (let y = 126; y < 166; y += 2) {
        const w = 6 + Math.sin(t * 0.08 + y) * 4;
        R(ctx, 298 - w / 2 + Math.sin(t * 0.05 + y * 0.3) * 3, y, w, 1, (y + Math.floor(t / 8)) % 4 ? '#e8e4c8' : '#8aa0c8');
      }
      ctx.fillStyle = '#3a5c94';
      for (let i = 0; i < 26; i++) {
        const x = ((i * 47 + t * (0.3 + (i % 3) * 0.15)) % 420) - 20, y = 128 + (i * 13) % 34;
        ctx.fillRect(Math.round(x), y, 5 + (i % 4), 1);
      }
    },

    front(ctx, t) {
      ctx.fillStyle = 'rgba(200,215,255,0.07)';
      for (const f of FOG) {
        const x = ((f.x + t * f.v) % (CONFIG.WIDTH + f.w * 2)) - f.w;
        ctx.fillRect(Math.round(x), Math.round(f.y), Math.round(f.w), 6);
        ctx.fillRect(Math.round(x + 8), Math.round(f.y - 3), Math.round(f.w * 0.6), 3);
      }
    },
  });
})();
