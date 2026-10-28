'use strict';
/* =====================================================================
 *  NOKTA — L'OMBRE
 *  Ninja rapide et fragile. Kunaïs en éventail, téléportation dans le
 *  dos de l'adversaire et bombe toxique pour contrôler le terrain.
 * ===================================================================== */

/* ---------- Arme : kunaïs (une par main) ---------- */
WEAPONS.kunai = {
  dual: true, reach: 8,
  draw(g, ax, f, J) {
    const s = J.wSpin > 0.5 ? 1 : -1;               // lame vers l'avant ou en prise inversée
    g.S(ax, -s * 4.5, -s * 3.5, -1, 1, 'ring');
    g.S(ax, -s * 3, s * 0.5, -0.5, 0.5, 'handle');
    g.S(ax, s * 1, s * 5, -1.5, 1, 'blade');
    g.S(ax, s * 5, s * 7, -0.5, 0, 'blade');
    g.S(ax, s * 1, s * 6, -1.5, -1.5, 'bladeEdge');
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  ninjaScarf: {
    back(g, J, P, f) {
      const t = f.animTime || 0, nx = J.sh.x - 1, ny = J.sh.y - 2;
      for (const off of [0, 3]) {
        for (let i = 0; i < 12; i++) {
          const x = nx - 1 - i - Math.round(J.sway * i * 0.35);
          const y = ny + off + Math.round(i * 0.25 + Math.sin(t * 0.2 - i * 0.6 + off) * (0.4 + i * 0.22));
          g.R(x, y, 2, 2, i > 9 ? 'scarfShade' : 'scarf');
        }
      }
    },
    body(g, J) {
      const r = J.row(J.sh.y);
      g.R(r.x + 1, J.sh.y - 2, r.w - 2, 3, 'scarf');
    },
  },
  hood: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 2, h.y - 2, h.w + 2, 3, 'hood');
      g.R(h.x - 2, h.y - 1, 4, h.h + 2, 'hood');
      g.R(h.x - 2, h.y - 2, 2, h.h + 3, 'hoodShade');
      g.R(h.x + h.w - 1, h.y - 1, 1, 2, 'hood');
    },
  },
  mask: {
    head(g, J) {
      const h = J.head, y = h.y + Math.round(h.h * 0.62);
      g.R(h.x + 1, y, h.w + 1, h.h - (y - h.y), 'mask');
      g.R(h.x + 1, y, h.w + 1, 1, 'scarf');
    },
  },
  wraps: {
    legs(g, J) {
      for (const [k, f] of [[J.kB, J.fB], [J.kF, J.fF]]) {
        for (let i = 1; i < 4; i++) {
          const x = k.x + (f.x - k.x) * i / 4, y = k.y + (f.y - 2 - k.y) * i / 4;
          g.R(x - 2, y, 4, 1, 'wrap');
        }
      }
    },
    front(g, J) {
      for (let i = 1; i < 3; i++) {
        const x = J.eF.x + (J.hF.x - J.eF.x) * i / 3, y = J.eF.y + (J.hF.y - J.eF.y) * i / 3;
        g.R(x - 1, y - 1, 3, 1, 'wrap');
      }
    },
  },
});

/* ---------- Projectiles ---------- */
PROJECTILE_ART.kunai = function (ctx, p) {
  const P = p.owner.palette, a = Math.atan2(p.vy, p.vx) / DEG;
  const g = Painter(ctx, P, null, false);
  const ax = axis(p.x - Math.cos(a * DEG) * 3, p.y - Math.sin(a * DEG) * 3, a);
  g.S(ax, -4.5, -3.5, -1, 1, 'ring');
  g.S(ax, -3, 0.5, -0.5, 0.5, 'handle');
  g.S(ax, 1, 5, -1.5, 1, 'blade');
  g.S(ax, 5, 7, -0.5, 0, 'blade');
  ctx.globalAlpha = 0.4;
  R(ctx, p.x - Math.cos(a * DEG) * 10, p.y - Math.sin(a * DEG) * 10, 4, 1, '#ffffff');
  ctx.globalAlpha = 1;
};
PROJECTILE_ART.bomb = function (ctx, p) {
  disc(ctx, p.x, p.y, 3, '#1a1a26');
  R(ctx, p.x - 1, p.y - 2, 1, 1, '#6a6a7a');
  R(ctx, p.x + 1, p.y - 5, 1, 2, '#8a5a32');
  if ((p.t >> 1) % 2) R(ctx, p.x + 1, p.y - 6, 2, 1, '#ffb347');
};
PROJECTILE_ART.smoke = function (ctx, p) {
  const k = Math.min(1, p.t / 6) * Math.min(1, p.life / 12);
  ctx.globalAlpha = 0.65 * k;
  for (let i = 0; i < 9; i++) {
    const a = i * 0.7 + p.t * 0.04;
    const x = p.x + Math.cos(a) * p.w * 0.3, y = p.y + Math.sin(a * 1.3) * p.h * 0.25;
    disc(ctx, x, y, Math.round(p.h * 0.32), i % 2 ? '#7a5a9a' : '#5a4a6a');
  }
  ctx.globalAlpha = 1;
};

/* ---------- Effet de fond : éclipse (super) ---------- */
SCREEN_FX.eclipse = {
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 6, (s.max - s.t) / 12), 0, 1);
    ctx.fillStyle = `rgba(10,0,20,${0.7 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = e;
    disc(ctx, W / 2, 50, 26, '#b57edc');
    disc(ctx, W / 2, 50, 24, '#ffffff');
    disc(ctx, W / 2 + 3, 49, 24, '#0a0014');
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'nokta',
  name: 'NOKTA',
  title: "L'OMBRE",
  description: 'Ninja insaisissable : kunaïs, fumée et attaques dans le dos.',
  quotes: ["Tu n'as vu qu'une ombre.", 'Le silence est ma meilleure arme.', "Regarde derrière toi. Trop tard."],
  stats: { maxHp: 95, walkSpeed: 2.0, jumpForce: 9.2, jumpSpeed: 2.7, defense: 0.9 },
  hitbox: { w: 16, h: 44 },
  body: { shoulderW: 14, hipW: 11, headW: 10, armT: 3, legT: 4 },
  locomotion: 'step',
  weapon: { type: 'kunai' },
  parts: ['ninjaScarf', 'belt', 'wraps', 'hood', 'mask'],
  palette: {
    skin: '#d9a77e', skinShade: '#a9774e', eye: '#ffd23f', eyeWhite: '#1a1a26', brow: '#14141c', hair: '#14141c',
    top: '#2a2a3a', topShade: '#1a1a26', sleeve: '#2a2a3a', sleeveShade: '#1a1a26',
    wrap: '#c8c0b0', scarf: '#6a2c91', scarfShade: '#4a1d66', mask: '#1a1a26', hood: '#2a2a3a', hoodShade: '#1a1a26',
    pants: '#2a2a3a', pantsShade: '#1a1a26', shoes: '#14141c', shoesShade: '#0a0a10', glove: '#14141c', gloveShade: '#0a0a10',
    blade: '#c8ced8', bladeEdge: '#ffffff', ring: '#8a8f9a', handle: '#6a2c91', belt: '#6a2c91', buckle: '#c8c0b0',
    smoke: '#7a5a9a', neon: '#b57edc', neon2: '#3a1d56',
    accent: '#b57edc', slash: '#ffffff', slashEdge: '#b57edc',
  },
  altPalette: {
    top: '#e8e4dc', topShade: '#b8b2a6', sleeve: '#e8e4dc', sleeveShade: '#b8b2a6', pants: '#e8e4dc', pantsShade: '#b8b2a6',
    hood: '#e8e4dc', hoodShade: '#b8b2a6', scarf: '#b3263a', scarfShade: '#7a1626', handle: '#b3263a', belt: '#b3263a',
    eye: '#4cc9f0', accent: '#ff6b6b', neon: '#ff6b6b', neon2: '#7a1626',
  },
  stance: {
    idle:   { hand: [6, 4], hand2: [8, 6], lean: 1, crouch: 2 },
    guard:  { hand: [4, -3], hand2: [6, -2], lean: -1 },
    crouch: { hand: [7, 2], hand2: [8, 4] },
    jump:   { hand: [4, -2], hand2: [-4, 2] },
    win:    { hand: [3, -2], hand2: [2, -1], lean: 0 },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 4, startup: 3, active: 2, recovery: 6, hitbox: { x: 6, y: -34, w: 16, h: 8 },
      knockback: 1.4, hitstun: 14, blockstun: 8, hitFx: 'cuts', sfx: 'whoosh',
      anim: { windup: { hand: [2, 2], wSpin: 1 }, strike: { hand: [13, -1], wSpin: 1, lean: 2, footF: [7, 0] } } },
    kick:  { damage: 6, startup: 5, active: 4, recovery: 10, hitbox: { x: 4, y: -40, w: 20, h: 12 },
      knockback: 2.2, hitstun: 16, blockstun: 10,
      anim: { windup: { footF: [4, -14], lean: -3 }, strike: { footF: [15, -26], footB: [-2, 0], lean: -6 } } },
  },
  combos: [
    { name: 'ÉVENTAIL DE KUNAÏS', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 0.9,
      overrides: { startup: 8, active: 2, recovery: 16, hitbox: null, sfx: 'whoosh', knockback: 1.4, hitstun: 16,
        projectile: { shape: 'kunai', pattern: 'fan', count: 3, spread: 0.9, speed: 5, w: 10, h: 6, life: 70, fromTip: true },
        anim: { windup: { hand: [-4, -4], wSpin: 1, lean: -2 }, strike: { hand: [12, -2], wSpin: 0, lean: 3 } } } },
    { name: "PAS DE L'OMBRE", sequence: ['down', 'back', 'kick'], window: 24, move: 'kick', damageMultiplier: 1.8,
      overrides: { startup: 10, active: 5, recovery: 14, teleport: { to: 'behind', dist: 22 },
        hitbox: { x: 4, y: -42, w: 22, h: 16 }, knockback: 3, launch: -4, hitstun: 26, sfx: 'teleport',
        anim: { windup: { crouch: 6, hand: [-2, 4], hand2: [-3, 5] }, strike: { footF: [16, -24], footB: [-2, 0], lean: -5 } } } },
    { name: 'BOMBE TOXIQUE', sequence: ['down', 'down', 'punch'], window: 24, move: 'punch', damageMultiplier: 0.5,
      overrides: { startup: 9, active: 2, recovery: 18, hitbox: null, sfx: 'whoosh', knockback: 0.8, hitstun: 18,
        projectile: { shape: 'bomb', speed: 2.6, vy: -4, gravity: 0.25, w: 7, h: 7, life: 90, fromTip: true,
                      burst: { shape: 'smoke', w: 44, h: 32, life: 60, hits: 3, hitEvery: 14, color: '#7a5a9a' } },
        anim: { windup: { hand: [-4, -6], lean: -2 }, strike: { hand: [10, -8], lean: 2 } } } },
  ],
  super: {
    name: 'DANSE DES OMBRES', move: 'punch', damageMultiplier: 1.4,
    overrides: { startup: 10, active: 28, recovery: 20, teleport: { to: 'behind', dist: 20 }, hits: 6, hitEvery: 5,
      hitbox: { x: -6, y: -44, w: 32, h: 42 }, screenFx: 'eclipse', screenFxTime: 30, afterimages: true, hitFx: 'cuts',
      knockback: 4, launch: -6, hitstun: 34, sfx: 'teleport',
      anim: { flurry: 6, windup: { hand: [2, 2], hand2: [10, -4], wSpin: 1 },
              strike: { hand: [13, -1], hand2: [2, 4], wSpin: 1, lean: 3, footF: [8, 0] } } },
  },
});
