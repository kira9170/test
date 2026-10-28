'use strict';
/* =====================================================================
 *  KANEKI — LE GHOUL AU MASQUE
 *  Combats rapides au corps à corps avec son Kagune Rinkaku et masque ghoul.
 * ===================================================================== */

Object.assign(PARTS, {
  kanekiHair: {
    head(g, J) {
      const h = J.head;
      // Chevelure blanche en mèches irrégulières.
      g.R(h.x - 2, h.y - 4, h.w + 4, 5, 'hair');
      g.R(h.x - 3, h.y - 2, 3, 5, 'hair');
      g.R(h.x + 1, h.y - 6, 3, 5, 'hair');
      g.R(h.x + 5, h.y - 5, 3, 4, 'hair');
      g.R(h.x + h.w - 1, h.y - 2, 3, 5, 'hair');
      g.R(h.x - 2, h.y, 3, h.h, 'hair');
      g.R(h.x + h.w - 1, h.y, 3, h.h, 'hair');
    },
  },
  ghoulMask: {
    hidesEyes: true,
    head(g, J) {
      const h = J.head, ey = h.y + Math.round(h.h * 0.42);
      g.R(h.x - 1, h.y + 2, h.w + 2, h.h - 1, 'mask');
      g.R(h.x + h.w - 4, ey, 3, 3, 'eye');
      g.R(h.x + h.w - 3, ey + 1, 1, 1, 'maskEye');
    },
  },
  rinkakuKagune: {
    back(g, J, P, f) {
      if (f.state === 'attack' || f.state === 'jump') {
        const top = J.sh.y + 4;
        // Quatre segments de kagune en éventail, visibles pendant l'action.
        g.R(J.hip.x - 9, top + 2, 3, 8, 'kaguneDark');
        g.R(J.hip.x - 12, top - 2, 3, 9, 'kagune');
        g.R(J.hip.x - 15, top - 6, 3, 8, 'kaguneDark');
        g.R(J.hip.x + 4, top - 4, 4, 10, 'kagune');
        g.R(J.hip.x + 8, top - 8, 3, 9, 'kaguneDark');
        g.R(J.hip.x + 11, top - 12, 3, 8, 'kagune');
        g.R(J.hip.x - 8, top + 9, 3, 8, 'kagune');
      }
    },
  },
});


Object.assign(PARTS, {
  kanekiSignatureSilhouette: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 3, h.y - 3, h.w + 6, 4, 'hair');
      g.R(h.x - 4, h.y, 3, h.h + 5, 'hair');
      g.R(h.x + h.w + 1, h.y, 3, h.h + 4, 'hair');
      const ey = h.y + Math.round(h.h * .43);
      g.R(h.x + 1, ey, 3, 2, '#b00020');
      g.R(h.x + h.w - 4, ey, 3, 2, '#b00020');
      g.R(h.x + 2, ey + 2, h.w - 4, 1, '#101014');
      g.R(h.x + h.w - 3, ey + 1, 2, 3, '#f2f2f2');
    },
  },
});


registerCharacter({
  id: 'kaneki',
  name: 'KANEKI',
  title: 'LE GHOUL AU MASQUE',
  description: "Combats rapides au corps à corps avec son Kagune Rinkaku et masque ghoul.",
  quotes: ["Ce n'est pas moi qui suis dans l'erreur, c'est le monde.", "Je suis un ghoul."],
  stats: { maxHp: 105, walkSpeed: 1.85, jumpForce: 8.4, jumpSpeed: 2.3, defense: 0.95 },
  hitbox: { w: 18, h: 44 },
  body: { shoulderW: 14, hipW: 11, headW: 10, armT: 3, legT: 4 },
  locomotion: 'step',
  weapon: null,
  parts: ['kanekiHair', 'ghoulMask', 'rinkakuKagune', 'kanekiSignatureSilhouette'],
  palette: {
    skin: '#f4e3d7', skinShade: '#d5bdaf', eye: '#e63946', maskEye: '#ffffff', brow: '#111115', mouth: '#e63946',
    hair: '#ffffff', hairShade: '#d8d8d8',
    top: '#111115', topShade: '#050508', sleeve: '#111115', sleeveShade: '#050508',
    mask: '#1a1a1a', pants: '#111115', pantsShade: '#050508', shoes: '#111115', shoesShade: '#050508',
    glove: '#111115', belt: '#e63946',
    kagune: '#d62828', kaguneDark: '#800f0f',
    accent: '#e63946', slash: '#ffffff', slashEdge: '#d62828',
  },
  altPalette: {
    hair: '#111115', hairShade: '#050508', top: '#2b2d42', topShade: '#141525',
    kagune: '#ff4d6d', accent: '#ff4d6d', slashEdge: '#ff758f',
  },
  stance: {
    idle:   { hand: [6, 2], hand2: [5, 4], lean: 1 },
    guard:  { hand: [4, -4], hand2: [6, -2], lean: -1 },
    crouch: { hand: [6, 2], hand2: [5, 5] },
    jump:   { hand: [4, -3], hand2: [5, 1] },
    win:    { hand: [2, -10], hand2: [4, 4] },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 6, startup: 3, active: 3, recovery: 7, hitbox: { x: 6, y: -34, w: 22, h: 8 },
      knockback: 1.8, hitstun: 15, blockstun: 9, hitSfx: 'hit',
      anim: { windup: { hand: [2, 3] }, strike: { hand: [14, -1], lean: 2, footF: [6, 0] } } },
    kick:  { damage: 8, startup: 5, active: 4, recovery: 9, hitbox: { x: 6, y: -24, w: 22, h: 10 },
      knockback: 2.4, hitstun: 16, blockstun: 10,
      anim: { windup: { footF: [5, -8], lean: -1 }, strike: { footF: [18, -14], lean: -3 } } },
  },
  combos: [
    { name: 'KAGUNE RINKAKU : FOUET', sequence: ['down', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 2.2,
      overrides: { startup: 6, active: 6, recovery: 14, dash: 4.5, hitbox: { x: 4, y: -44, w: 32, h: 22 },
        knockback: 3.8, hitstun: 26, fx: ['arc'], arcWidth: 10, sfx: 'slash', hitSfx: 'heavy',
        anim: { windup: { hand: [-2, 4], lean: -2 }, strike: { hand: [14, 0], lean: 4 } } } },
    { name: 'CENTIPEDE ATTACK', sequence: ['back', 'forward', 'punch'], window: 20, move: 'punch', damageMultiplier: 2.4,
      overrides: { startup: 8, active: 10, recovery: 16, dash: 6.0, afterimages: true,
        hitbox: { x: 2, y: -40, w: 36, h: 24 }, knockback: 4.2, hitstun: 28, fx: ['arc'], sfx: 'slash', hitSfx: 'heavy',
        anim: { windup: { crouch: 4, lean: -3 }, strike: { lean: 6, footF: [12, 0] } } } },
  ],
  super: {
    name: 'KAKUJA : MILLE POINTES',
    move: 'punch', damageMultiplier: 1.05,
    overrides: { startup: 12, active: 30, recovery: 25, dash: 5.4, hits: 8, hitEvery: 4,
      hitbox: { x: -2, y: -48, w: 42, h: 42 }, knockback: 4.8, launch: -6, hitstun: 36,
      afterimages: true, trail: 'embers', screenFx: 'bloodMoon', screenFxTime: 30, shake: 8,
      fx: ['arc', 'ring'], sfx: 'slash', hitSfx: 'heavy',
      anim: { flurry: 4, windup: { crouch: 5, lean: -4, hand: [-4, 4], hand2: [-3, 6] },
              strike: { lean: 7, hand: [16, -2], hand2: [13, -4], footF: [12, -2] } } },
  },
});