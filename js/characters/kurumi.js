'use strict';
/* =====================================================================
 *  KURUMI — L'ESPRIT DU TEMPS
 *  Tireuse magique invoquant le cadran temporel Zafkiel et tireurs d'horloge.
 * ===================================================================== */

/* ---------- Arme : Pistolets Horlogers (Flintlock) ---------- */
WEAPONS.flintlock = {
  twoHanded: false, length: 14,
  draw(g, ax) {
    g.S(ax, -8, -3, -1, 1.5, 'wood');
    g.S(ax, -3, 2, -1, 1, 'brass');
    g.S(ax, 2, 14, -1, 0, 'steel');
    g.S(ax, 13, 14, -1.5, 0.5, 'brass');
    g.S(ax, -1, 0, -2, -1, 'brass');
  },
};

/* ---------- Costume & Détails ---------- */
Object.assign(PARTS, {
  kurumiHair: {
    head(g, J) {
      const h = J.head;
      // Longs cheveux noirs, frange découpée et rubans rouges.
      g.R(h.x - 2, h.y - 3, h.w + 4, 4, 'hair');
      g.R(h.x + 1, h.y - 5, 3, 4, 'hair');
      g.R(h.x + 5, h.y - 4, 3, 3, 'hair');
      g.R(h.x - 2, h.y + 1, 3, h.h + 2, 'hair');
      g.R(h.x - 3, h.y + h.h - 1, 3, 7, 'hairShade');
      g.R(h.x + h.w - 1, h.y + 1, 3, h.h + 1, 'hair');
      g.R(h.x + h.w - 1, h.y - 2, 4, 3, 'ribbon');
      g.R(h.x - 3, h.y - 2, 4, 3, 'ribbon');
      g.R(h.x + h.w + 1, h.y + 2, 2, 5, 'ribbonDark');
      g.R(h.x - 4, h.y + 2, 2, 5, 'ribbonDark');
    },
  },
  gothicDress: {
    body(g, J) {
      for (let y = J.sh.y + 1; y <= J.hip.y; y++) {
        const r = J.row(y);
        g.R(r.x + 1, y, r.w - 2, 1, 'dressRed');
        if ((y - J.sh.y) % 4 === 0) g.R(r.x + 2, y, r.w - 4, 1, 'ribbonDark');
        g.R(r.x + r.w / 2 - 1, y, 2, 1, 'topShade');
      }
      const r = J.row(J.hip.y);
      for (let i = 0; i < 6; i++) {
        g.R(r.x - i, J.hip.y + i, r.w + i * 2, 1, i % 2 ? 'dressRed' : 'top');
      }
    },
  },
  ribbons: {
    body(g, J) {
      const r = J.row(J.sh.y + 2);
      g.R(r.x + 1, J.sh.y + 2, r.w - 2, 2, 'ribbon');
    },
  },
  clockEye: {
    hidesEyes: true,
    head(g, J) {
      const h = J.head, ey = h.y + Math.round(h.h * 0.42);
      g.R(h.x + h.w - 4, ey, 2, 2, 'eyeGold');
      g.R(h.x + 1, ey, 2, 2, 'eye');
    },
  },
});

/* ---------- Projectiles ---------- */
PROJECTILE_ART.clockBullet = function (ctx, p) {
  const s = p.spec, x = Math.round(p.x), y = Math.round(p.y);
  R(ctx, x - 4, y - 2, 8, 4, s.color);
  R(ctx, x - 2, y - 1, 4, 2, s.core);
};

/* ---------- Effet de Fond : Cadran Temporel Zafkiel ---------- */
SCREEN_FX.clockDial = {
  init(s) { s.cx = s.owner.x; s.cy = s.owner.y - 20; },
  draw(ctx, s) {
    const clampVal = (v, a, b) => Math.max(a, Math.min(b, v));
    const e = clampVal(Math.min(s.t / 10, (s.max - s.t) / 20), 0, 1), rad = 36;
    ctx.save();
    ctx.globalAlpha = 0.45 * e;
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(s.cx, s.cy, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd700';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      ctx.fillRect(Math.round(s.cx + Math.cos(a) * (rad - 4)), Math.round(s.cy + Math.sin(a) * (rad - 4)), 2, 2);
    }
    ctx.restore();
  },
};

/* ---------- Personnage ---------- */

Object.assign(PARTS, {
  kurumiSignatureSilhouette: {
    head(g, J) {
      const h = J.head, cx = h.x + h.w / 2;
      // Volumineuse coiffe gothique à volants rouges, inspirée de son apparence canonique.
      g.R(h.x - 4, h.y - 7, h.w + 8, 3, 'ribbonDark');
      g.R(h.x - 5, h.y - 5, h.w + 10, 2, 'ribbon');
      for (let i = 0; i < 7; i++) {
        const x = h.x - 4 + i * 3;
        g.R(x, h.y - 9 - (i % 2), 3, 4, i % 2 ? 'dressRed' : 'ribbon');
        g.R(x + 1, h.y - 8 - (i % 2), 1, 2, '#ff7777');
      }
      // Twin tails and bows.
      g.R(h.x - 5, h.y + 2, 3, h.h + 9, 'hair');
      g.R(h.x - 7, h.y + h.h + 4, 4, 5, 'hairShade');
      g.R(h.x + h.w + 2, h.y + 2, 3, h.h + 9, 'hair');
      g.R(h.x + h.w + 3, h.y + h.h + 4, 4, 5, 'hairShade');
      g.R(h.x - 7, h.y - 1, 5, 2, 'ribbon');
      g.R(h.x - 6, h.y + 1, 3, 3, 'ribbonDark');
      g.R(h.x + h.w + 2, h.y - 1, 5, 2, 'ribbon');
      g.R(h.x + h.w + 3, h.y + 1, 3, 3, 'ribbonDark');
      // Heterochromia: left eye crimson, right eye clock-gold.
      const ey = h.y + Math.round(h.h * 0.43);
      g.R(h.x + 1, ey, 3, 2, '#f72545');
      g.R(h.x + 2, ey, 1, 2, '#ffb3c1');
      g.R(h.x + h.w - 4, ey, 3, 2, 'eyeGold');
      g.R(h.x + h.w - 3, ey, 1, 2, '#fff2a6');
      // Black lace choker and tiny red heart detail.
      g.R(h.x + 1, h.y + h.h + 1, h.w - 2, 2, '#171018');
      g.R(cx, h.y + h.h + 1, 2, 2, 'ribbon');
    },
  },
  kurumiCorsetDetail: {
    body(g, J) {
      const r = J.row(J.sh.y + 4);
      g.R(r.x + 2, J.sh.y + 5, 2, 7, 'ribbon');
      g.R(r.x + r.w - 4, J.sh.y + 5, 2, 7, 'ribbon');
      g.R(r.x + Math.floor(r.w / 2), J.sh.y + 5, 2, 10, 'brass');
      g.R(r.x + 2, J.sh.y + 12, r.w - 4, 1, 'ribbonDark');
    },
  },
});


registerCharacter({
  id: 'kurumi',
  name: 'KURUMI',
  title: 'L’ESPRIT DU TEMPS',
  description: "Invoque le cadran temporel Zafkiel et tire avec ses pistolets horlogers.",
  quotes: ["Mon nom est Kurumi Tokisaki.", "Le temps attend personne... encore moins vous."],
  stats: { maxHp: 95, walkSpeed: 1.7, jumpForce: 8.5, jumpSpeed: 2.2, defense: 0.9 },
  hitbox: { w: 18, h: 44 },
  body: { shoulderW: 14, hipW: 12, headW: 12, armT: 3, legT: 4 },
  locomotion: 'step',
  weapon: { type: 'flintlock' },
  parts: ['kurumiHair', 'gothicDress', 'ribbons', 'clockEye', 'kurumiSignatureSilhouette'],
  palette: {
    skin: '#fff0eb', skinShade: '#e5bfae', eye: '#e63946', eyeGold: '#ffd700', brow: '#1a1a1a', mouth: '#a03030',
    hair: '#17131d', hairShade: '#08070c',
    top: '#1a1018', topShade: '#0d070c', sleeve: '#1a1018', sleeveShade: '#0d070c',
    ribbon: '#d62828', ribbonDark: '#800f0f', dressRed: '#ba181b', dressShade: '#660708',
    pants: '#111115', pantsShade: '#050508', shoes: '#1a1018', shoesShade: '#0d070c',
    glove: '#fff0eb', belt: '#d62828', brass: '#ffd700', steel: '#4a4e69', wood: '#3d2314',
    accent: '#ffd700', slash: '#ffffff', slashEdge: '#d62828',
  },
  altPalette: {
    top: '#2b1e3a', topShade: '#170f23', dressRed: '#7209b7', dressShade: '#3a0ca3',
    ribbon: '#4cc9f0', ribbonDark: '#4361ee', accent: '#4cc9f0',
  },
  stance: {
    idle:   { hand: [6, 4], ang: -10, grip: 1, hand2: [4, 7] },
    guard:  { hand: [4, -2], ang: -75, grip: 1, hand2: [6, -4], lean: -1 },
    crouch: { hand: [6, 2], ang: 0, grip: 1, hand2: [5, 5] },
    jump:   { hand: [5, -2], ang: -30, grip: 1 },
    win:    { hand: [2, -12], ang: -90, grip: 1, hand2: [6, 0] },
    hurt:   { hand: [-2, 6], ang: 60, grip: 1 },
  },
  attacks: {
    punch: { damage: 5, startup: 3, active: 3, recovery: 7, hitbox: { x: 8, y: -36, w: 22, h: 8 },
      knockback: 1.6, hitstun: 15, blockstun: 9, fx: ['muzzle'], sfx: 'shot',
      anim: { windup: { hand: [2, 4], ang: 10 }, strike: { hand: [12, 1], ang: -5, lean: 2 } } },
    kick:  { damage: 7, startup: 5, active: 4, recovery: 10, hitbox: { x: 6, y: -24, w: 20, h: 10 },
      knockback: 2.3, hitstun: 16, blockstun: 10,
      anim: { windup: { footF: [4, -10], lean: -1 }, strike: { footF: [18, -16], lean: -3 } } },
  },
  combos: [
    { name: 'ZAFKIEL : BALLE ALEPH', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 1.9,
      overrides: { startup: 7, active: 2, recovery: 16, hitbox: null, fx: ['muzzle'], sfx: 'shot',
        projectile: { shape: 'clockBullet', speed: 5.5, w: 12, h: 8, life: 100, fromTip: true, color: '#ffd700', core: '#ffffff' },
        anim: { windup: { hand: [4, 2], ang: -20 }, strike: { hand: [10, 0], ang: -5, lean: -1 } } } },
    { name: 'CHRONO DISTORSION (DALET)', sequence: ['down', 'back', 'kick'], window: 24, move: 'kick', damageMultiplier: 2.1,
      overrides: { startup: 8, active: 10, recovery: 14, dash: 4.5, pose: 'spin', lift: -3.5,
        hitbox: { x: -10, y: -34, w: 34, h: 14 }, knockback: 3.5, hitstun: 26, trail: 'sparkle',
        anim: { windup: { crouch: 4, lean: -2 }, strike: { lean: 4, footF: [16, -10] } } } },
    { name: 'JARDIN DU TEMPS (ZAFKIEL)', sequence: ['back', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 2.6,
      overrides: { startup: 10, active: 4, recovery: 22, hitbox: null, fx: ['muzzle'], sfx: 'shot', screenFx: 'clockDial', screenFxTime: 65,
        projectile: { shape: 'clockBullet', speed: 6.2, w: 16, h: 10, life: 110, fromTip: true, color: '#e63946', core: '#ffd700' },
        anim: { windup: { hand: [-2, -6], ang: -80 }, strike: { hand: [12, 0], ang: 0, lean: 3 } } } },
  ],
  super: {
    name: 'ZAFKIEL : SEPTIÈME BALLE',
    move: 'punch', damageMultiplier: 1.05,
    overrides: { startup: 16, active: 3, recovery: 28, hitbox: null, screenFx: 'clockDial', screenFxTime: 75,
      shake: 6, sfx: 'special', fx: ['muzzle'],
      projectile: { shape: 'clockBullet', pattern: 'fan', count: 5, spread: 16, speed: 5.2, w: 14, h: 10, y: -36,
        life: 110, fromTip: true, color: '#d62828', core: '#ffd700', hits: 2, hitEvery: 6 },
      anim: { windup: { hand: [-2, -8], hand2: [4, -4], ang: -80, lean: -2 },
              strike: { hand: [12, 0], hand2: [8, -2], ang: 0, lean: 3 } } },
  },
});