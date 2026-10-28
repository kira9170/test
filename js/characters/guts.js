'use strict';
/* =====================================================================
 *  GUTS — LE CHEVALIER NOIR
 *  Guerrier colossale. Tranche avec la Dragon Slayer et tire au canon.
 * ===================================================================== */

/* ---------- Arme : Dragon Slayer ---------- */
WEAPONS.dragonslayer = {
  twoHanded: true, spread: 7, length: 32,
  draw(g, ax) {
    g.S(ax, -18, -2, -1, 1, 'leather');
    g.S(ax, -19, -17, -2, 2, 'steelDark');
    g.S(ax, -2, 3, -4, 4, 'steelDark');
    g.S(ax, 3, 32, -3.5, 3.5, 'steel');
    g.S(ax, 3, 32, -1, 1, 'steelLight');
    g.S(ax, 30, 34, -1, 1, 'steelLight');
    g.S(ax, 5, 28, -3.5, -3, 'steelDark');
  },
};

/* ---------- Costume & Détails ---------- */
Object.assign(PARTS, {
  tatteredCape: {
    back(g, J) {
      const top = J.sh.y + 1, len = (J.hip.y - J.sh.y) + 12;
      for (let i = 0; i < len; i++) {
        const k = i / len, x = J.hip.x - J.B.hipW / 2 - Math.round(k * 4);
        g.R(x, top + i, J.B.hipW + Math.round(k * 4), 1, i % 3 === 0 ? 'capeShade' : 'cape');
      }
    },
  },
  berserkArmor: {
    body(g, J) {
      for (let y = J.sh.y; y <= J.hip.y; y++) {
        const r = J.row(y);
        g.R(r.x, y, r.w, 1, 'armor');
        g.R(r.x, y, 2, 1, 'armorDark');
      }
      g.R(J.sF.x - 3, J.sF.y - 3, 6, 4, 'armorLight');
      g.R(J.sF.x - 3, J.sF.y - 1, 6, 1, 'armorDark');
    },
  },
  gutsFace: {
    head(g, J) {
      const h = J.head;
      // Coupe courte en pointes et cicatrice visible.
      g.R(h.x - 1, h.y - 3, h.w + 2, 4, 'hair');
      g.R(h.x - 3, h.y - 1, 3, 4, 'hair');
      g.R(h.x + 2, h.y - 5, 3, 3, 'hair');
      g.R(h.x + h.w - 1, h.y - 2, 3, 4, 'hair');
      g.R(h.x + 1, h.y + Math.round(h.h * 0.42), 3, 1, 'skinShade');
      g.R(h.x + 2, h.y + Math.round(h.h * 0.42) - 2, 2, 1, 'armorDark');
    },
  },
  bandages: {
    body(g, J) {
      g.R(J.sh.x - 1, J.sh.y + 3, J.B.shoulderW - 2, 1, 'steelLight');
    },
  },
});

/* ---------- Projectiles ---------- */
PROJECTILE_ART.cannonBall = function (ctx, p) {
  const s = p.spec, x = Math.round(p.x), y = Math.round(p.y);
  R(ctx, x - 6, y - 6, 12, 12, '#212529');
  R(ctx, x - 4, y - 4, 8, 8, s.color);
  R(ctx, x - 2, y - 2, 4, 4, s.core);
};

/* ---------- Personnage ---------- */

Object.assign(PARTS, {
  gutsSignatureSilhouette: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 3, h.y - 3, h.w + 6, 4, 'hair');
      g.R(h.x - 4, h.y - 1, 4, 5, 'hair');
      g.R(h.x + h.w - 1, h.y - 2, 4, 4, 'hair');
      g.R(h.x + h.w - 3, h.y + 2, 3, 2, '#bfc4cc');
      g.R(h.x + 1, h.y + 2, 2, 2, '#171717');
      g.R(h.x + h.w - 4, h.y + 2, 2, 2, '#171717');
      g.R(h.x + 1, h.y + h.h - 1, h.w - 2, 2, '#8b929f');
    },
  },
});


registerCharacter({
  id: 'guts',
  name: 'GUTS',
  title: 'LE CHEVALIER NOIR',
  description: "Tranche tout avec la Dragon Slayer et tire au canon de bras.",
  quotes: ["Même si je dois ramper, je continuerai à avancer.", "N'attends pas les miracles. Crée-les."],
  stats: { maxHp: 130, walkSpeed: 1.15, jumpForce: 7.2, jumpSpeed: 1.6, defense: 1.25 },
  hitbox: { w: 24, h: 52 },
  body: { shoulderW: 20, hipW: 15, headW: 11, armT: 4, legT: 5 },
  locomotion: 'stomp',
  weapon: { type: 'dragonslayer' },
  parts: ['tatteredCape', 'berserkArmor', 'gutsFace', 'bandages', 'gutsSignatureSilhouette'],
  palette: {
    skin: '#df9f67', skinShade: '#ad6e3e', eye: '#111111', brow: '#111111', mouth: '#4a1515',
    hair: '#111115', hairShade: '#050508',
    top: '#212529', topShade: '#0b090a', sleeve: '#212529', sleeveShade: '#0b090a',
    armor: '#343a40', armorLight: '#6c757d', armorDark: '#14171a',
    cape: '#111115', capeShade: '#050508',
    pants: '#212529', pantsShade: '#0b090a', shoes: '#14171a', shoesShade: '#050508',
    glove: '#495057', belt: '#495057', buckle: '#6c757d',
    steel: '#8d99ae', steelLight: '#edf2f4', steelDark: '#2b2d42', leather: '#5c3d2e',
    accent: '#e63946', slash: '#edf2f4', slashEdge: '#e63946',
  },
  altPalette: {
    armor: '#5c1d1d', armorLight: '#9b2226', cape: '#3a0909',
    steel: '#c0c0c0', accent: '#ff4d6d', slashEdge: '#ff758f',
  },
  stance: {
    idle:   { hand: [2, 6], ang: -140, grip: 2, wBehind: true },
    guard:  { hand: [6, 0], ang: -80, grip: 2, lean: -1, wBehind: false },
    crouch: { hand: [6, 4], ang: -50, grip: 2, wBehind: false },
    jump:   { hand: [4, -2], ang: -110, grip: 2, wBehind: false },
    win:    { hand: [3, -12], ang: -90, grip: 1, hand2: [2, 5], wBehind: false },
    hurt:   { hand: [-2, 8], ang: 110, grip: 1 },
  },
  attacks: {
    punch: { damage: 10, startup: 10, active: 5, recovery: 18, hitbox: { x: 4, y: -58, w: 42, h: 48 },
      knockback: 3.5, hitstun: 20, blockstun: 14, fx: ['arc'], arcWidth: 9, sfx: 'slash', hitSfx: 'heavy',
      anim: { windup: { hand: [-4, -8], ang: -160, grip: 2, wBehind: false, lean: -3 },
              strike: { hand: [10, 6], ang: 40, grip: 2, wBehind: false, lean: 4, footF: [10, 0], footB: [-8, 0] } } },
    kick:  { damage: 8, startup: 7, active: 4, recovery: 13, hitbox: { x: 6, y: -26, w: 22, h: 10 },
      knockback: 3.0, hitstun: 17, blockstun: 11,
      anim: { windup: { footF: [6, -10], lean: -1 }, strike: { footF: [18, -15], lean: -3 } } },
  },
  combos: [
    { name: 'DRAGON SLAYER : FRACTURE', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 2.5,
      overrides: { startup: 14, active: 6, recovery: 22, shake: 6, knockback: 5.0, hitstun: 32, launch: -4,
        hitbox: { x: 2, y: -64, w: 48, h: 54 }, arcWidth: 12, fx: ['arc', 'ring'], sfx: 'slash', hitSfx: 'heavy',
        anim: { windup: { hand: [0, -14], ang: -95, grip: 2, wBehind: false, lean: -2 },
                strike: { hand: [12, 10], ang: 75, grip: 2, wBehind: false, lean: 5, crouch: 6, footF: [10, 0] } } } },
    { name: 'CANON DE BRAS PROTHÉSIQUE', sequence: ['back', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 2.2,
      overrides: { startup: 9, active: 3, recovery: 24, hitbox: null, fx: ['muzzle'], sfx: 'shot', shake: 4,
        projectile: { shape: 'cannonBall', speed: 4.2, w: 16, h: 16, y: -34, color: '#e63946', core: '#ffffff', life: 130 },
        anim: { windup: { hand: [0, 4], ang: -10, grip: 1, hand2: [-6, 6] }, strike: { hand: [10, 2], ang: 0, grip: 1, lean: -2 } } } },
    { name: 'RAGE DU BERSERKER', sequence: ['down', 'back', 'kick'], window: 24, move: 'kick', damageMultiplier: 2.3,
      overrides: { startup: 8, active: 14, recovery: 18, dash: 3.8, lift: -4, pose: 'spin', shake: 3,
        hitbox: { x: -14, y: -42, w: 44, h: 20 }, knockback: 4.2, hitstun: 28, arcWidth: 8, fx: ['arc'], sfx: 'slash',
        anim: { windup: { crouch: 4, lean: -3 }, strike: { lean: 5, footF: [16, -12] } } } },
  ],
  super: {
    name: 'ARMURE DU BERSERKER : FENTE APOCALYPTIQUE',
    move: 'punch', damageMultiplier: 1.15,
    overrides: { startup: 17, active: 5, recovery: 30, dash: 2.8, armor: 2,
      hitbox: { x: 0, y: -62, w: 52, h: 56 }, knockback: 7, launch: -8, hitstun: 38,
      shake: 11, screenFx: 'bloodMoon', screenFxTime: 28, fx: ['arc', 'ring'], sfx: 'slash', hitSfx: 'heavy',
      anim: { windup: { crouch: 7, lean: -5, hand: [-4, -12], ang: -110, grip: 2 },
              strike: { crouch: 1, lean: 7, hand: [13, 10], ang: 65, grip: 2, footF: [12, 0], footB: [-8, 0] } } },
  },
});