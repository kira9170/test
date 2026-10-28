'use strict';
/* =====================================================================
 *  SHINRA — LE DÉMON AUX PIEDS DE FEU
 *  Propulsion pyrotechnique sous les pieds, coups de pied dévastateurs.
 * ===================================================================== */

Object.assign(PARTS, {
  shinraHair: {
    head(g, J) {
      const h = J.head;
      // Cheveux noirs en pointes reconnaissables.
      g.R(h.x - 2, h.y - 3, h.w + 4, 4, 'hair');
      g.R(h.x - 3, h.y - 5, 3, 4, 'hair');
      g.R(h.x + 1, h.y - 7, 3, 5, 'hair');
      g.R(h.x + 5, h.y - 6, 3, 4, 'hair');
      g.R(h.x + h.w - 1, h.y - 3, 3, 4, 'hair');
    },
  },
  fireForceUniform: {
    body(g, J) {
      g.R(J.sh.x - 1, J.sh.y + 4, J.B.shoulderW - 2, 2, 'stripeBlue');
      g.R(J.sh.x + 2, J.sh.y + 7, 3, 5, 'fireRed');
      g.R(J.sh.x + 3, J.sh.y + 8, 2, 4, 'fireOrange');
      // Insigne Fire Force miniature.
      g.R(J.sh.x + J.B.shoulderW / 2 - 2, J.sh.y + 2, 4, 2, 'fireOrange');
    },
  },
  shinraJets: {
    back(g, J, P, f) {
      if (!['jump', 'dash', 'attack'].includes(f.state)) return;
      for (const foot of [J.fF, J.fB]) {
        const x = foot.x - 2, y = foot.y - 1;
        g.R(x, y, 4, 3, 'fireRed');
        g.R(x + 1, y + 2, 2, 4, 'fireOrange');
        g.R(x + 1, y + 5, 1, 3, '#fff3b0');
      }
    },
  },
});


Object.assign(PARTS, {
  shinraSignatureSilhouette: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 2, h.y - 4, h.w + 4, 4, 'hair');
      g.R(h.x - 3, h.y - 2, 4, 4, 'hair');
      g.R(h.x + 1, h.y - 6, 3, 4, 'hair');
      g.R(h.x + 5, h.y - 5, 3, 4, 'hair');
      g.R(h.x + h.w - 1, h.y - 3, 4, 3, 'hair');
      const ey = h.y + Math.round(h.h * .45);
      g.R(h.x + 1, ey, 2, 2, '#111827');
      g.R(h.x + h.w - 3, ey, 2, 2, '#111827');
      g.R(h.x + 2, h.y + h.h - 2, h.w - 4, 2, '#f4f4f5');
    },
  },
});


registerCharacter({
  id: 'shinra',
  name: 'SHINRA',
  title: 'LE DÉMON AUX PIEDS DE FEU',
  description: "Propulsion pyrotechnique sous les pieds et style acrobatique.",
  quotes: ["Je vais devenir un héros !", "Sourire est mon réflexe quand je suis stressé."],
  stats: { maxHp: 100, walkSpeed: 2.1, jumpForce: 9.2, jumpSpeed: 2.7, defense: 0.9 },
  hitbox: { w: 18, h: 44 },
  body: { shoulderW: 14, hipW: 11, headW: 10, armT: 3, legT: 4 },
  locomotion: 'step',
  weapon: null,
  parts: ['shinraHair', 'fireForceUniform', 'shinraJets', 'shinraSignatureSilhouette'],
  palette: {
    skin: '#f4d5b5', skinShade: '#d4a373', eye: '#e63946', eyeWhite: '#ffffff', brow: '#111115', mouth: '#111115',
    hair: '#111115', hairShade: '#050508',
    top: '#111115', topShade: '#050508', sleeve: '#111115', sleeveShade: '#050508',
    stripeBlue: '#00f0ff', fireOrange: '#ffb703', fireRed: '#e63946',
    pants: '#111115', pantsShade: '#050508', shoes: '#111115', shoesShade: '#050508',
    glove: '#111115',
    accent: '#ffb703', slash: '#ffffff', slashEdge: '#e63946',
  },
  altPalette: {
    fireOrange: '#4cc9f0', fireRed: '#4361ee', accent: '#4cc9f0', slashEdge: '#4361ee',
  },
  stance: {
    idle:   { hand: [4, 4], hand2: [5, 6], lean: 2, footF: [6, -2] },
    guard:  { hand: [4, -4], hand2: [6, -2], lean: -1 },
    crouch: { hand: [6, 2], hand2: [5, 5] },
    jump:   { hand: [4, -4], hand2: [5, 2], footF: [8, -6] },
    win:    { hand: [2, -12], hand2: [4, 4] },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 5, startup: 3, active: 3, recovery: 6, hitbox: { x: 6, y: -34, w: 20, h: 8 },
      knockback: 1.5, hitstun: 14, blockstun: 8, hitSfx: 'hit',
      anim: { windup: { hand: [2, 3] }, strike: { hand: [12, -1], lean: 2 } } },
    kick:  { damage: 9, startup: 4, active: 5, recovery: 9, hitbox: { x: 6, y: -26, w: 26, h: 12 },
      knockback: 3.0, hitstun: 18, blockstun: 11, fx: ['arc'], sfx: 'whoosh', hitSfx: 'heavy',
      anim: { windup: { footF: [5, -10], lean: -2 }, strike: { footF: [20, -16], lean: -4 } } },
  },
  combos: [
    { name: 'JET IMPERIAL', sequence: ['down', 'forward', 'kick'], window: 20, move: 'kick', damageMultiplier: 2.3,
      overrides: { startup: 5, active: 8, recovery: 14, dash: 6.5, lift: -3.0, afterimages: true,
        hitbox: { x: 4, y: -36, w: 34, h: 18 }, knockback: 4.5, hitstun: 28, fx: ['arc', 'ring'], sfx: 'shot', hitSfx: 'heavy',
        anim: { windup: { crouch: 4, lean: -3 }, strike: { lean: 6, footF: [22, -12] } } } },
    { name: 'VITESSE SUPERSONIQUE', sequence: ['back', 'forward', 'kick'], window: 18, move: 'kick', damageMultiplier: 2.5,
      overrides: { startup: 3, active: 10, recovery: 16, dash: 8.0, afterimages: true,
        hitbox: { x: 2, y: -40, w: 36, h: 22 }, knockback: 5.0, hitstun: 30, fx: ['ring'], sfx: 'zap', hitSfx: 'heavy',
        anim: { windup: { crouch: 6, lean: -4 }, strike: { lean: 7, footF: [24, -10] } } } },
  ],
  super: {
    name: 'JETS NOIRS : IMPACT DU DIABLE',
    move: 'kick', damageMultiplier: 1.05,
    overrides: { startup: 13, active: 24, recovery: 23, dash: 6.8, lift: -4.5, hits: 5, hitEvery: 5,
      hitbox: { x: 0, y: -42, w: 38, h: 32 }, knockback: 5.1, launch: -7, hitstun: 34,
      afterimages: true, trail: 'embers', screenFx: 'overdrive', screenFxTime: 24, shake: 7,
      fx: ['ring', 'arc'], sfx: 'shot', hitSfx: 'heavy',
      anim: { flurry: 7, windup: { crouch: 5, lean: -4, footF: [8, -8], hand: [0, 4] },
              strike: { lean: 6, footF: [24, -14], footB: [-8, 0], hand: [12, -2] } } },
  },
});