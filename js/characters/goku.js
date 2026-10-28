'use strict';
/* =====================================================================
 *  GOKU — LE GUERRIER SAIYAN
 *  Combattant légendaire maître du Kaméhaméha et des enchaînements Ki.
 * ===================================================================== */

Object.assign(PARTS, {
  gokuHair: {
    head(g, J) {
      const h = J.head;
      // Silhouette en pics du Super Saiyan de base.
      g.R(h.x - 3, h.y - 3, h.w + 6, 4, 'hair');
      g.R(h.x - 5, h.y - 5, 4, 5, 'hair');
      g.R(h.x - 2, h.y - 8, 4, 6, 'hair');
      g.R(h.x + 2, h.y - 10, 4, 7, 'hair');
      g.R(h.x + 6, h.y - 8, 4, 6, 'hair');
      g.R(h.x + h.w + 1, h.y - 5, 4, 5, 'hair');
      g.R(h.x + 2, h.y - 1, 2, 3, 'hair');
    },
  },
  turtleDogi: {
    body(g, J) {
      g.R(J.sh.x + 2, J.sh.y + 2, 4, 4, 'sleeve');
    },
  },
  kiAura: {
    back(g, J, P, f) {
      if (!['jump', 'dash', 'attack'].includes(f.state)) return;
      const x = J.hip.x - 9, y = J.sh.y - 3;
      g.R(x, y + 4, 2, 12, 'kiBlue');
      g.R(x + 2, y, 2, 6, 'kiBlue');
      g.R(x + 13, y + 3, 2, 13, 'kiBlue');
      g.R(x + 11, y - 1, 2, 6, 'kiBlue');
      if (f.state === 'attack') g.R(x + 5, y - 3, 4, 3, 'kiCore');
    },
  },
});


/* ---------- Projectile : aura du Kamehameha ---------- */
PROJECTILE_ART.kamehameha = function (ctx, p) {
  const s = p.spec, x = Math.round(p.x), y = Math.round(p.y), dir = Math.sign(p.vx) || 1;
  ctx.globalAlpha = 0.28;
  R(ctx, x - dir * 17 - 8, y - 7, 34, 14, s.color || '#00f0ff');
  ctx.globalAlpha = 1;
  R(ctx, x - dir * 12 - 5, y - 4, 24, 8, s.color || '#00f0ff');
  R(ctx, x - dir * 8 - 3, y - 2, 16, 4, s.core || '#ffffff');
  R(ctx, x - 2, y - 3, 5, 6, '#ffffff');
};


Object.assign(PARTS, {
  gokuSignatureSilhouette: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 2, h.y - 2, h.w + 4, 3, 'hair');
      g.R(h.x - 3, h.y - 5, 4, 4, 'hair');
      g.R(h.x, h.y - 8, 3, 5, 'hair');
      g.R(h.x + 3, h.y - 6, 3, 4, 'hair');
      g.R(h.x + 6, h.y - 9, 3, 6, 'hair');
      g.R(h.x + h.w - 1, h.y - 5, 4, 4, 'hair');
      g.R(h.x + 2, h.y + 2, 2, 2, '#171717');
      g.R(h.x + h.w - 4, h.y + 2, 2, 2, '#171717');
    },
  },
});


registerCharacter({
  id: 'goku',
  name: 'GOKU',
  title: 'LE GUERRIER SAIYAN',
  description: "Combattant légendaire maître du Kaméhaméha et des enchaînements Ki.",
  quotes: ["Je m'appelle Goku !", "J'ai les ජávains qui frétillent !"],
  stats: { maxHp: 110, walkSpeed: 1.6, jumpForce: 8.6, jumpSpeed: 2.2, defense: 1.0 },
  hitbox: { w: 20, h: 46 },
  body: { shoulderW: 16, hipW: 12, headW: 10, armT: 4, legT: 4 },
  locomotion: 'step',
  weapon: null,
  parts: ['gokuHair', 'turtleDogi', 'kiAura', 'gokuSignatureSilhouette'],
  palette: {
    skin: '#f4d5b5', skinShade: '#d4a373', eye: '#111115', eyeWhite: '#ffffff', brow: '#111115', mouth: '#111115',
    hair: '#111115', hairShade: '#050508',
    top: '#fb8500', topShade: '#d00000', sleeve: '#219ebc', sleeveShade: '#023047',
    pants: '#fb8500', pantsShade: '#d00000', shoes: '#023047', shoesShade: '#001824',
    glove: '#f4d5b5', belt: '#023047',
    kiBlue: '#00f0ff', kiCore: '#ffffff',
    accent: '#00f0ff', slash: '#ffffff', slashEdge: '#fb8500',
  },
  altPalette: {
    hair: '#ffb703', hairShade: '#fb8500', eye: '#00f0ff', brow: '#ffb703', accent: '#ffb703',
  },
  stance: {
    idle:   { hand: [6, 2], hand2: [5, 5], lean: 1 },
    guard:  { hand: [4, -4], hand2: [6, -2], lean: -1 },
    crouch: { hand: [6, 2], hand2: [5, 5] },
    jump:   { hand: [4, -3], hand2: [5, 1] },
    win:    { hand: [2, -12], hand2: [4, 4] },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 6, startup: 3, active: 3, recovery: 7, hitbox: { x: 6, y: -36, w: 22, h: 8 },
      knockback: 2.0, hitstun: 15, blockstun: 9, hitSfx: 'hit',
      anim: { windup: { hand: [2, 4] }, strike: { hand: [14, 0], lean: 2, footF: [6, 0] } } },
    kick:  { damage: 7, startup: 5, active: 4, recovery: 9, hitbox: { x: 6, y: -26, w: 22, h: 10 },
      knockback: 2.5, hitstun: 16, blockstun: 10,
      anim: { windup: { footF: [5, -8], lean: -1 }, strike: { footF: [18, -14], lean: -3 } } },
  },
  combos: [
    { name: 'KAMEHAMEHA', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 2.5,
      overrides: { startup: 10, active: 4, recovery: 20, hitbox: null, fx: ['muzzle'], sfx: 'special', shake: 3,
        projectile: { shape: 'kamehameha', speed: 6.0, w: 16, h: 16, y: -34, color: '#00f0ff', core: '#ffffff', life: 110 },
        anim: { windup: { hand: [-4, 4], ang: -40 }, strike: { hand: [14, -2], ang: 0, lean: 3 } } } },
    { name: 'ENCHAÎNEMENT METEOR', sequence: ['back', 'forward', 'punch'], window: 20, move: 'punch', damageMultiplier: 2.2,
      overrides: { startup: 5, active: 8, recovery: 14, dash: 5.5, afterimages: true,
        hitbox: { x: 4, y: -40, w: 30, h: 20 }, knockback: 4.0, hitstun: 26, hitSfx: 'heavy',
        anim: { windup: { crouch: 3, lean: -2 }, strike: { lean: 5, footF: [10, 0] } } } },
  ],
  super: {
    name: 'ULTRA INSTINCT : POING DU DRAGON',
    move: 'punch', damageMultiplier: 1.1,
    overrides: { startup: 14, active: 30, recovery: 25, dash: 5.8, hits: 6, hitEvery: 5,
      hitbox: { x: -1, y: -46, w: 38, h: 38 }, knockback: 5.4, launch: -7, hitstun: 36,
      afterimages: true, trail: 'sparks', screenFx: 'overdrive', screenFxTime: 28, shake: 8,
      fx: ['ring', 'arc'], sfx: 'special', hitSfx: 'heavy',
      anim: { flurry: 6, windup: { crouch: 4, lean: -3, hand: [-3, 2], hand2: [7, -2] },
              strike: { lean: 6, hand: [16, -1], hand2: [10, -3], footF: [12, -2] } } },
  },
});