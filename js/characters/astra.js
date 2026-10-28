'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  ASTRA — L'ASTRONOME
 *  Tireuse d'élite au fusil-télescope. Garde ses distances, fait
 *  pleuvoir les étoiles et finit au rayon cosmique.
 * ===================================================================== */

/* ---------- Arme : fusil-télescope ---------- */
WEAPONS.rifle = {
  twoHanded: true, spread: 7, length: 18,
  draw(g, ax) {
    g.S(ax, -16, -9, -1, 2, 'wood');              // crosse
    g.S(ax, -16.5, -16, -1, 2.5, 'brass');
    g.S(ax, -9, -2, -1.5, 1.5, 'brass');           // mécanisme
    g.S(ax, -6, -4, 2, 3, 'brassDark');            // pontet
    g.S(ax, -3, 4, 0.5, 2, 'wood');                // garde-main
    g.S(ax, -2, 17, -1, 0, 'steel');               // canon
    g.S(ax, 4, 4.5, -1.5, 0.5, 'brass');
    g.S(ax, 10, 10.5, -1.5, 0.5, 'brass');
    g.S(ax, 16.5, 18, -1.5, 0.5, 'brass');         // bouche
    g.S(ax, -7, 5, -4, -2.5, 'brass');             // lunette
    g.S(ax, -6, -5, -2.5, -1.5, 'brassDark');
    g.S(ax, 2, 3, -2.5, -1.5, 'brassDark');
    g.S(ax, -8, -7, -4.5, -2, 'brassDark');
    g.S(ax, 5, 6, -4, -2.5, 'lens');
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  starCape: {
    back(g, J, P, f) {
      const top = J.sh.y + 1, len = (J.hip.y - J.sh.y) + 9;
      const xAt = i => { const k = i / len, r = J.row(Math.min(J.hip.y, top + i)); return r.x - 2 - Math.round(k * (2 + J.sway * 1.8)); };
      for (let i = 0; i < len; i++) {
        const k = i / len, x = xAt(i);
        g.R(x, top + i, 5 + Math.round(k * 3), 1, i >= len - 1 ? 'trim' : 'cape');
        g.R(x, top + i, 1, 1, 'capeShade');
      }
      const tw = Math.floor((f.animTime || 0) / 10) % 3;
      [[2, 0.3], [4, 0.58], [1, 0.82]].forEach(([dx, k], i) => {
        const iy = Math.round(k * len);
        g.R(xAt(iy) + dx, top + iy, 1, 1, i === tw ? 'star' : 'gold');
      });
    },
  },
  astraScarf: {
    back(g, J, P, f) {
      const t = f.animTime || 0, nx = J.sh.x - 2, ny = J.sh.y - 1;
      for (let i = 0; i < 9; i++) {
        const x = nx - 1 - i - Math.round(J.sway * i * 0.25);
        const y = ny + Math.round(i * 0.35 + Math.sin(t * 0.15 - i * 0.7) * (0.5 + i * 0.18));
        g.R(x, y, 2, 2, i > 6 ? 'scarfShade' : 'scarf');
      }
    },
    body(g, J) {
      const r = J.row(J.sh.y);
      g.R(r.x + 1, J.sh.y - 2, r.w - 2, 3, 'scarf');
      g.R(r.x + 1, J.sh.y, r.w - 2, 1, 'scarfShade');
    },
  },
  navyCoat: {
    body(g, J) {
      for (let y = J.sh.y + 2; y <= J.hip.y; y++) { const r = J.row(y); g.R(r.x + r.w - 4, y, 1, 1, 'trim'); }
      for (let y = J.sh.y + 4; y < J.hip.y - 2; y += 4) { const r = J.row(y); g.R(r.x + r.w - 3, y, 1, 1, 'gold'); }
      const r = J.row(J.hip.y);
      for (let i = 0; i < 8; i++) {
        const ex = Math.round(i * 0.4);
        g.R(r.x - ex - 1, J.hip.y - 1 + i, r.w + 2 + ex * 2, 1, i === 7 ? 'trim' : (i > 4 ? 'topShade' : 'top'));
      }
      g.R(r.x + r.w - 3, J.hip.y - 1, 1, 8, 'trim');
      g.R(J.sF.x - 2, J.sF.y - 2, 4, 2, 'trim');
    },
  },
  bobHair: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 1, h.y - 1, h.w + 1, 3, 'hair');
      g.R(h.x - 1, h.y, 5, h.h + 1, 'hair');
      g.R(h.x + h.w - 5, h.y + 1, 5, 2, 'hair');
      g.R(h.x + h.w - 2, h.y + 2, 1, 2, 'hair');
      g.R(h.x + 1, h.y, 3, 1, 'hairLight');
      g.R(h.x - 1, h.y + h.h, 5, 1, 'hairShade');
    },
  },
  beret: {
    head(g, J, P, f) {
      const h = J.head;
      g.R(h.x - 3, h.y - 3, h.w + 2, 3, 'beret');
      g.R(h.x - 1, h.y - 4, h.w - 2, 1, 'beret');
      g.R(h.x - 3, h.y - 1, h.w + 2, 1, 'beretShade');
      g.R(h.x + 2, h.y - 5, 1, 1, 'beretShade');
      const cx = h.x + h.w - 3, cy = h.y - 2, tw = Math.floor((f.animTime || 0) / 12) % 4 === 0;
      g.R(cx - 1, cy, 3, 1, 'gold');
      g.R(cx, cy - 1, 1, 3, 'gold');
      g.R(cx, cy, 1, 1, tw ? '#ffffff' : 'gold');
    },
  },
});

/* ---------- Projectiles ---------- */
PROJECTILE_ART.star = function (ctx, p) {
  const s = p.spec, x = Math.round(p.x), y = Math.round(p.y);
  const dx = -Math.sign(p.vx), dy = -Math.sign(p.vy);
  ctx.globalAlpha = 0.55;
  for (let i = 1; i <= 4; i++) { const z = i < 3 ? 2 : 1; R(ctx, x + dx * i * 4, y + dy * i * 4, z, z, s.color); }
  ctx.globalAlpha = 1;
  const r = (p.t >> 2) % 2 ? 4 : 5;
  R(ctx, x - r, y, r * 2 + 1, 1, s.color);
  R(ctx, x, y - r, 1, r * 2 + 1, s.color);
  R(ctx, x - 2, y - 1, 5, 3, s.color);
  R(ctx, x - 1, y - 2, 3, 5, s.color);
  R(ctx, x - 1, y - 1, 3, 3, s.core);
  if ((p.t >> 1) % 2) { R(ctx, x - 3, y - 3, 1, 1, s.core); R(ctx, x + 3, y + 3, 1, 1, s.core); }
  else { R(ctx, x + 3, y - 3, 1, 1, s.core); R(ctx, x - 3, y + 3, 1, 1, s.core); }
};

/* rayon (super) : collé à la bouche du fusil */
PROJECTILE_ART.beam = function (ctx, p) {
  const s = p.spec, dir = p.dir, x0 = p.x - dir * p.w / 2, y = Math.round(p.y);
  const grow = Math.min(1, p.t / 5), fade = Math.min(1, p.life / 6);
  const hh = Math.max(1, Math.round(p.h / 2 * grow * fade * (0.85 + 0.15 * Math.sin(p.t * 1.3))));
  const len = p.w;
  R(ctx, x0, y - hh, dir * len, hh * 2, s.color);
  R(ctx, x0, y - Math.ceil(hh / 2), dir * len, Math.ceil(hh / 2) * 2, s.core);
  for (let i = 0; i < 10; i++) {
    const k = ((i * 37 + p.t * 7) % len);
    R(ctx, x0 + dir * k, y + ((i * 13) % (hh * 2 + 4)) - hh - 2, 2, 1, '#ffffff');
  }
  disc(ctx, x0, y, hh + 3, s.color);
  disc(ctx, x0, y, hh, s.core);
};

/* ---------- Effet de fond : constellation ---------- */
SCREEN_FX.constellation = {
  init(s) {
    const W = CONFIG.WIDTH, rnd = seeded(Math.floor(Math.random() * 1e9));
    const cx = clamp(s.owner.x, 70, W - 70);
    s.pts = [];
    for (let i = 0; i < 7; i++) s.pts.push({ x: Math.round(cx - 60 + i * 20 + (rnd() - 0.5) * 12), y: Math.round(30 + rnd() * 50) });
    s.bg = [];
    for (let i = 0; i < 60; i++) s.bg.push({ x: Math.round(rnd() * W), y: Math.round(rnd() * 150), p: Math.floor(rnd() * 40) });
    s.moon = { x: cx + 75 > W - 20 ? cx - 85 : cx + 75, y: 34 };
  },
  draw(ctx, s, game) {
    const e = clamp(Math.min(s.t / 10, (s.max - s.t) / 20), 0, 1), W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    ctx.fillStyle = `rgba(4,6,28,${0.62 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = e;
    for (const b of s.bg) if ((game.globalTime + b.p) % 40 < 28) R(ctx, b.x, b.y, 1, 1, '#cfd8ff');
    ctx.fillStyle = '#fff3c4';
    for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
      if (dx * dx + dy * dy <= 64 && (dx - 4) * (dx - 4) + (dy + 2) * (dy + 2) > 49) ctx.fillRect(s.moon.x + dx, s.moon.y + dy, 1, 1);
    }
    const reveal = clamp((s.t - 4) / 5, 0, s.pts.length - 1);
    ctx.fillStyle = 'rgba(170,205,255,0.85)';
    for (let i = 0; i < s.pts.length - 1; i++) {
      const k = Math.min(1, reveal - i);
      if (k <= 0) break;
      const a = s.pts[i], b = s.pts[i + 1];
      pxLine(ctx, a.x, a.y, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 1);
    }
    for (let i = 0; i <= Math.floor(reveal); i++) {
      const p = s.pts[i], big = (game.globalTime >> 3) % s.pts.length === i, r = big ? 3 : 2;
      R(ctx, p.x - r, p.y, r * 2 + 1, 1, big ? '#fff3b0' : '#ffd166');
      R(ctx, p.x, p.y - r, 1, r * 2 + 1, big ? '#fff3b0' : '#ffd166');
      R(ctx, p.x, p.y, 1, 1, '#ffffff');
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'astra',
  name: 'ASTRA',
  title: "L'ASTRONOME",
  description: "Tireuse d'élite au fusil-télescope. Fait pleuvoir les étoiles.",
  quotes: ["J'avais calculé ta trajectoire avant même ton premier pas.", "Les étoiles ne mentent jamais.", "Belle nuit pour perdre, non ?"],
  stats: { maxHp: 106, walkSpeed: 1.65, jumpForce: 8.6, jumpSpeed: 2.3, defense: 0.98 },
  hitbox: { w: 16, h: 46 },
  body: { shoulderW: 14, hipW: 12, headW: 10, armT: 3, legT: 4 },
  locomotion: 'step',
  weapon: { type: 'rifle' },
  parts: ['starCape', 'astraScarf', 'navyCoat', 'belt', 'bobHair', 'beret'],
  palette: {
    skin: '#f3d2b5', skinShade: '#cfa587', eye: '#2a6f97', brow: '#aab3cc', mouth: '#a0525a',
    hair: '#d9dfee', hairLight: '#ffffff', hairShade: '#9aa3bb',
    top: '#1d2a5c', topShade: '#131c40', sleeve: '#1d2a5c', sleeveShade: '#131c40',
    trim: '#e3b53b', gold: '#ffd166', star: '#ffffff',
    cape: '#0f1638', capeShade: '#080c24', scarf: '#3fb7c7', scarfShade: '#2a8793',
    beret: '#3fb7c7', beretShade: '#2a8793',
    pants: '#2a2f45', pantsShade: '#1b1f30', shoes: '#6b4428', shoesShade: '#4a2e1a',
    glove: '#f3f0e6', gloveShade: '#c9c4b5', belt: '#6b4428', buckle: '#e3b53b',
    steel: '#3b4252', brass: '#d4a73a', brassDark: '#8a6a1f', wood: '#6d3f22', lens: '#7ff0ff',
    accent: '#9be7ff', slash: '#ffffff', slashEdge: '#9be7ff',
  },
  altPalette: {
    top: '#5c1d3a', topShade: '#3d1226', sleeve: '#5c1d3a', sleeveShade: '#3d1226',
    cape: '#2b0f1f', capeShade: '#1a0812', scarf: '#f2a541', scarfShade: '#c47f25', beret: '#f2a541', beretShade: '#c47f25',
    hair: '#3a3550', hairLight: '#6a6485', hairShade: '#24203a', brow: '#3a3550', accent: '#ffb3c6',
  },
  stance: {
    idle:   { hand: [5, 9], ang: 22, grip: 2 },
    guard:  { hand: [5, 0], ang: -80, grip: 2, lean: -1 },
    crouch: { hand: [7, 3], ang: 0, grip: 2 },
    jump:   { hand: [4, 5], ang: -25, grip: 2 },
    win:    { hand: [3, -10], ang: -88, grip: 1, hand2: [2, 5] },
    hurt:   { hand: [-2, 8], ang: 70, grip: 1 },
  },
  attacks: {
    punch: { damage: 6, startup: 4, active: 3, recovery: 8, hitbox: { x: 10, y: -36, w: 22, h: 9 },
      knockback: 1.8, hitstun: 15, blockstun: 9,
      anim: { windup: { hand: [1, 5], ang: 0 }, strike: { hand: [10, 3], ang: -4, lean: 2, footF: [7, 0], footB: [-5, 0] } } },
    kick:  { damage: 7, startup: 6, active: 4, recovery: 12, hitbox: { x: 6, y: -35, w: 20, h: 12 },
      knockback: 2.5, hitstun: 17, blockstun: 11,
      anim: { windup: { footF: [4, -12], lean: -2 },
              strike: { footF: [16, -26], footB: [-3, 0], lean: -5, hand: [0, 9], ang: 50 } } },
  },
  combos: [
    { name: 'TIR POLAIRE', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 1.8,
      overrides: { startup: 9, active: 2, recovery: 18, hitbox: null, recoil: 1.8, fx: ['muzzle'], sfx: 'shot',
        projectile: { shape: 'star', speed: 5.5, w: 10, h: 8, life: 100, fromTip: true, color: '#9be7ff', core: '#ffffff' },
        anim: { windup: { hand: [6, 1], ang: 0, lean: -1 }, strike: { hand: [4, 1], ang: -8, lean: -2 } } } },
    { name: "PLUIE D'ÉTOILES", sequence: ['down', 'back', 'punch'], window: 24, move: 'punch', damageMultiplier: 0.9,
      overrides: { startup: 14, active: 2, recovery: 26, hitbox: null, fx: ['muzzle'], sfx: 'shot',
        screenFx: 'constellation', screenFxTime: 70, knockback: 1.5, hitstun: 20,
        projectile: { shape: 'star', pattern: 'rain', count: 3, spacing: 18, delay: 24, interval: 8, speed: 5,
                      w: 10, h: 10, life: 90, color: '#ffd166', core: '#ffffff' },
        anim: { windup: { hand: [3, -2], ang: -60 }, strike: { hand: [2, -8], ang: -86, lean: -2 } } } },
    { name: 'ÉCLAT ZÉNITH', sequence: ['back', 'forward', 'kick'], window: 20, move: 'kick', damageMultiplier: 2.0,
      overrides: { startup: 5, active: 14, recovery: 14, lift: -6.5, hitbox: { x: -4, y: -58, w: 26, h: 36 },
        launch: -6, knockback: 2, hitstun: 30, trail: 'sparkle', sfx: 'whoosh',
        anim: { linear: true, windup: { crouch: 6, footF: [5, 0], footB: [-4, 0] },
                strike: { tilt: -360, footF: [12, -26], footB: [-2, -10], hand: [0, 7], ang: 60, crouch: 0 } } } },
  ],
  super: {
    name: 'SUPERNOVA', move: 'punch', damageMultiplier: 1.1,
    overrides: { startup: 18, active: 32, recovery: 24, hitbox: null, screenFx: 'constellation', screenFxTime: 30,
      sfx: 'shot', fx: ['muzzle'], knockback: 3.5, launch: -4, hitstun: 30,
      projectile: { shape: 'beam', follow: true, w: 300, h: 16, life: 32, hits: 5, hitEvery: 6, color: '#9be7ff', core: '#ffffff' },
      anim: { windup: { hand: [6, 1], ang: 0, crouch: 4, lean: -2 }, strike: { hand: [5, 1], ang: -2, lean: -3, crouch: 4 } } },
  },
});
