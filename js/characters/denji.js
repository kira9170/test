'use strict';
/* =====================================================================
 *  DENJI — CHAINSAW MAN
 *  Brave tout à la tronçonneuse avec des lames sur le crâne et les bras.
 * ===================================================================== */

WEAPONS.chainsawArms = {
  twoHanded: false, length: 18,
  draw(g, ax, f, J) {
    if (J.phase === 'active' || f.state === 'attack') {
      g.S(ax, -2, 18, -1, 1, 'steel');
      g.S(ax, 0, 16, -0.5, 0.5, 'bloodRed');
    }
  },
};

Object.assign(PARTS, {
  chainsawHead: {
    hidesEyes: true,
    head(g, J) {
      const h = J.head;
      // Casque-tronçonneuse : carter, dents métalliques, poignée et lame frontale.
      g.R(h.x - 2, h.y - 5, h.w + 4, h.h + 5, 'steelDark');
      g.R(h.x - 1, h.y - 4, h.w + 2, h.h + 3, 'steel');
      g.R(h.x - 4, h.y - 8, h.w + 3, 3, 'steelLight');
      for (let i = 0; i < 5; i++) g.R(h.x - 3 + i * 3, h.y - 5, 2, 2, i % 2 ? 'steelLight' : 'bloodRed');
      g.R(h.x + h.w - 1, h.y + 2, 5, 3, 'bloodRed');
      g.R(h.x + h.w + 2, h.y + 5, 2, 5, 'steelLight');
    },
  },
  devilShirt: {
    body(g, J) {
      g.R(J.sh.x + 4, J.sh.y + 1, 2, 6, 'tie');
    },
  },
  sawArms: {
    body(g, J, P, f) {
      if (f.state !== 'attack') return;
      for (const s of [J.sF, J.sB]) {
        g.R(s.x - 2, s.y + 1, 5, 3, 'steelDark');
        g.R(s.x + 2, s.y + 2, 2, 2, 'steelLight');
        g.R(s.x - 3, s.y + 4, 2, 2, 'bloodRed');
      }
    },
  },
});


/* ---------- Projectile : étincelles de tronçonneuse ---------- */
PROJECTILE_ART.sawBurst = function (ctx, p) {
  const s = p.spec, x = Math.round(p.x), y = Math.round(p.y), dir = Math.sign(p.vx) || 1;
  R(ctx, x - 5, y - 3, 10, 6, s.color || '#d62828');
  R(ctx, x - 3, y - 5, 3, 3, s.core || '#ffffff');
  R(ctx, x + dir * 3, y - 4, 3, 3, '#edf2f4');
  R(ctx, x - dir * 4, y + 2, 3, 3, '#edf2f4');
};


Object.assign(PARTS, {
  denjiSignatureSilhouette: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 3, h.y - 2, h.w + 6, 5, '#d7d9df');
      g.R(h.x - 5, h.y - 1, 3, 5, '#8b929f');
      g.R(h.x + h.w + 2, h.y - 1, 3, 5, '#8b929f');
      for (let i = 0; i < 5; i++) g.R(h.x - 3 + i * 3, h.y + 2, 2, 2, '#20232b');
      g.R(h.x + 1, h.y - 5, 3, 4, 'hair');
      g.R(h.x + 5, h.y - 4, 3, 3, 'hair');
      g.R(h.x + 2, h.y + h.h - 1, h.w - 4, 2, 'ribbonDark');
    },
  },
});


registerCharacter({
  id: 'denji',
  name: 'DENJI',
  title: 'CHAINSAW MAN',
  description: "Brave tout à la tronçonneuse avec des lames sur le crâne et les bras.",
  quotes: ["Je veux toucher des seins !", "Un démon de la tronçonneuse est arrivé !"],
  stats: { maxHp: 115, walkSpeed: 1.5, jumpForce: 7.8, jumpSpeed: 2.0, defense: 1.1 },
  hitbox: { w: 20, h: 46 },
  body: { shoulderW: 16, hipW: 12, headW: 10, armT: 4, legT: 4 },
  locomotion: 'step',
  weapon: { type: 'chainsawArms' },
  parts: ['chainsawHead', 'devilShirt', 'sawArms', 'denjiSignatureSilhouette'],
  palette: {
    skin: '#f4d5b5', skinShade: '#d4a373', eye: '#ffb703', eyeWhite: '#ffffff', brow: '#111115', mouth: '#d62828',
    hair: '#ffb703', hairShade: '#fb8500',
    top: '#ffffff', topShade: '#d8d8d8', sleeve: '#ffffff', sleeveShade: '#d8d8d8',
    pants: '#111115', pantsShade: '#050508', shoes: '#111115', shoesShade: '#050508',
    glove: '#111115', tie: '#111115',
    steel: '#8d99ae', steelLight: '#edf2f4', steelDark: '#2b2d42', bloodRed: '#d62828',
    accent: '#d62828', slash: '#edf2f4', slashEdge: '#d62828',
  },
  altPalette: {
    bloodRed: '#7209b7', accent: '#7209b7', slashEdge: '#7209b7',
  },
  stance: {
    idle:   { hand: [6, 4], hand2: [5, 6], lean: 3 },
    guard:  { hand: [4, -4], hand2: [6, -2], lean: -1 },
    crouch: { hand: [6, 2], hand2: [5, 5] },
    jump:   { hand: [4, -3], hand2: [5, 1] },
    win:    { hand: [2, -12], hand2: [4, 4] },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 8, startup: 4, active: 4, recovery: 9, hitbox: { x: 6, y: -40, w: 26, h: 14 },
      knockback: 2.8, hitstun: 18, blockstun: 11, fx: ['arc'], arcWidth: 8, sfx: 'slash', hitSfx: 'heavy',
      anim: { windup: { hand: [-2, 4], ang: -40 }, strike: { hand: [14, 0], ang: 30, lean: 4 } } },
    kick:  { damage: 7, startup: 5, active: 4, recovery: 10, hitbox: { x: 6, y: -26, w: 22, h: 10 },
      knockback: 2.4, hitstun: 16, blockstun: 10,
      anim: { windup: { footF: [5, -8], lean: -1 }, strike: { footF: [18, -14], lean: -3 } } },
  },
  combos: [
    { name: 'TRANCHE DE TRONÇONNEUSE', sequence: ['down', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 2.3,
      overrides: { startup: 6, active: 8, recovery: 16, dash: 4.8, shake: 4,
        hitbox: { x: 4, y: -44, w: 34, h: 22 }, knockback: 4.2, hitstun: 28, fx: ['arc', 'ring'], sfx: 'slash', hitSfx: 'heavy',
        anim: { windup: { crouch: 4, lean: -3 }, strike: { lean: 6, hand: [16, -2], footF: [12, 0] } } } },
    { name: 'RAGE DU DÉMON', sequence: ['back', 'forward', 'punch'], window: 20, move: 'punch', damageMultiplier: 2.5,
      overrides: { startup: 8, active: 10, recovery: 18, dash: 6.2, shake: 6, afterimages: true,
        hitbox: { x: 2, y: -46, w: 38, h: 26 }, knockback: 5.0, hitstun: 32, fx: ['arc'], sfx: 'slash', hitSfx: 'heavy',
        anim: { windup: { crouch: 6, lean: -4 }, strike: { lean: 7, hand: [18, -4], footF: [14, 0] } } } },
  ],
  super: {
    name: 'MOTEUR DU DÉMON : CARNAGE',
    move: 'punch', damageMultiplier: 1.15,
    overrides: { startup: 12, active: 26, recovery: 24, dash: 3.8, hits: 7, hitEvery: 4,
      hitbox: { x: 0, y: -48, w: 38, h: 42 }, knockback: 5.2, launch: -5.5, hitstun: 34,
      afterimages: true, trail: 'embers', screenFx: 'bloodMoon', screenFxTime: 26, shake: 7,
      fx: ['arc', 'ring'], sfx: 'slash', hitSfx: 'heavy',
      anim: { flurry: 5, windup: { crouch: 5, lean: -4, hand: [-3, 5], hand2: [8, 2] },
              strike: { lean: 7, hand: [18, -2], hand2: [12, 0], footF: [14, -2] } } },
  },
});