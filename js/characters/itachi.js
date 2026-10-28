'use strict';
/* =====================================================================
 *  ITACHI — L'OMBRE D'AKATSUKI
 *  Maître du Mangekyō Sharingan et des flammes sombres Amaterasu.
 * ===================================================================== */

Object.assign(PARTS, {
  itachiHair: {
    head(g, J) {
      const h = J.head;
      // Frange découpée et mèches latérales.
      g.R(h.x - 2, h.y - 4, h.w + 4, 4, 'hair');
      g.R(h.x - 1, h.y - 1, 3, 4, 'hair');
      g.R(h.x + 3, h.y - 2, 2, 5, 'hair');
      g.R(h.x + h.w - 1, h.y + 1, 3, 5, 'hair');
    },
  },
  akatsukiCloak: {
    body(g, J) {
      // Nuage rouge Akatsuki avec contour sombre et bouton central.
      g.R(J.sh.x + 1, J.sh.y + 3, 7, 5, '#050508');
      g.R(J.sh.x + 2, J.sh.y + 3, 5, 4, 'cloudRed');
      g.R(J.sh.x + 3, J.sh.y + 4, 3, 1, '#ffffff');
      g.R(J.sh.x + 4, J.sh.y + 5, 1, 1, '#ffffff');
    },
  },
});


/* ---------- Projectile : flamme noire d'Amaterasu ---------- */
PROJECTILE_ART.amaterasuFlame = function (ctx, p) {
  const s = p.spec, x = Math.round(p.x), y = Math.round(p.y), dir = Math.sign(p.vx) || 1;
  R(ctx, x - 7, y - 5, 14, 10, '#050508');
  R(ctx, x - 5, y - 7, 5, 4, '#111115');
  R(ctx, x + dir * 3, y - 6, 4, 5, '#111115');
  R(ctx, x - 3, y - 2, 8, 4, s.core || '#7209b7');
  R(ctx, x + dir * 5, y - 1, 5, 2, s.color || '#000000');
};


Object.assign(PARTS, {
  itachiSignatureSilhouette: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 3, h.y - 3, h.w + 6, 4, 'hair');
      g.R(h.x - 4, h.y, 3, h.h + 5, 'hair');
      g.R(h.x + h.w + 1, h.y, 3, h.h + 5, 'hair');
      g.R(h.x + 1, h.y + 2, 2, 2, '#e63946');
      g.R(h.x + h.w - 3, h.y + 2, 2, 2, '#e63946');
      g.R(h.x + 1, h.y + h.h - 1, h.w - 2, 2, '#171717');
    },
  },
});


registerCharacter({
  id: 'itachi',
  name: 'ITACHI',
  title: "L'OMBRE D'AKATSUKI",
  description: "Maître du Mangekyō Sharingan et des flammes sombres Amaterasu.",
  quotes: ["Tu manques de haine.", "Chacun vit dans sa propre illusion."],
  stats: { maxHp: 95, walkSpeed: 1.8, jumpForce: 8.5, jumpSpeed: 2.4, defense: 0.95 },
  hitbox: { w: 18, h: 44 },
  body: { shoulderW: 14, hipW: 11, headW: 10, armT: 3, legT: 4 },
  locomotion: 'step',
  weapon: null,
  parts: ['itachiHair', 'akatsukiCloak', 'itachiSignatureSilhouette'],
  palette: {
    skin: '#f4e3d7', skinShade: '#d5bdaf', eye: '#e63946', eyeWhite: '#111115', brow: '#111115', mouth: '#111115',
    hair: '#111115', hairShade: '#050508',
    top: '#111115', topShade: '#050508', sleeve: '#111115', sleeveShade: '#050508',
    cloudRed: '#d62828',
    pants: '#111115', pantsShade: '#050508', shoes: '#2b2d42', shoesShade: '#141525',
    glove: '#111115', belt: '#d62828',
    accent: '#e63946', slash: '#ffffff', slashEdge: '#d62828',
  },
  altPalette: {
    top: '#2b2d42', topShade: '#141525', cloudRed: '#ff4d6d', accent: '#ff4d6d',
  },
  stance: {
    idle:   { hand: [4, 4], hand2: [5, 6], lean: -1 },
    guard:  { hand: [4, -4], hand2: [6, -2], lean: -1 },
    crouch: { hand: [6, 2], hand2: [5, 5] },
    jump:   { hand: [4, -3], hand2: [5, 1] },
    win:    { hand: [2, -10], hand2: [4, 4] },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 5, startup: 3, active: 3, recovery: 6, hitbox: { x: 6, y: -34, w: 20, h: 8 },
      knockback: 1.6, hitstun: 15, blockstun: 9, hitSfx: 'hit',
      anim: { windup: { hand: [2, 3] }, strike: { hand: [12, -1], lean: 2 } } },
    kick:  { damage: 7, startup: 4, active: 4, recovery: 9, hitbox: { x: 6, y: -24, w: 20, h: 10 },
      knockback: 2.2, hitstun: 16, blockstun: 10,
      anim: { windup: { footF: [5, -8], lean: -1 }, strike: { footF: [18, -14], lean: -3 } } },
  },
  combos: [
    { name: 'AMATERASU', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 2.4,
      overrides: { startup: 8, active: 4, recovery: 18, hitbox: null, fx: ['muzzle'], sfx: 'special',
        projectile: { shape: 'amaterasuFlame', speed: 5.8, w: 14, h: 14, y: -34, color: '#000000', core: '#7209b7', life: 100 },
        anim: { windup: { hand: [0, -4] }, strike: { hand: [10, -2], lean: 2 } } } },
    { name: 'BOULE DE FEU SUPRÊME', sequence: ['back', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 2.3,
      overrides: { startup: 9, active: 4, recovery: 20, hitbox: null, fx: ['muzzle'], sfx: 'shot',
        projectile: { shape: 'cannonBall', speed: 4.8, w: 16, h: 16, y: -34, color: '#e63946', core: '#ffb703', life: 110 },
        anim: { windup: { hand: [-2, 2] }, strike: { hand: [12, -1], lean: 3 } } } },
  ],
  super: {
    name: 'SUSANOO : LAME DU CORBEAU',
    move: 'punch', damageMultiplier: 1.1,
    overrides: { startup: 16, active: 3, recovery: 26, hitbox: null, screenFx: 'eclipse', screenFxTime: 34,
      shake: 8, fx: ['muzzle', 'ring'], sfx: 'special', hitSfx: 'heavy',
      projectile: { shape: 'cannonBall', speed: 5.2, w: 30, h: 24, y: -38, life: 105, color: '#5a189a', core: '#ff4d6d', hits: 3, hitEvery: 7 },
      anim: { windup: { hand: [-4, -10], hand2: [3, -8], lean: -3, ang: -70 },
              strike: { hand: [13, -2], hand2: [8, 0], lean: 3, ang: 0 } } },
  },
});