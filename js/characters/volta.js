'use strict';
/* =====================================================================
 *  VOLTA — LA COURSIÈRE
 *  Patineuse urbaine aux tonfas électriques. Très mobile, rémanences
 *  néon et décharges au corps à corps.
 * ===================================================================== */

/* ---------- Arme : tonfas électriques (une par main) ---------- */
WEAPONS.tonfa = {
  dual: true, reach: 11,
  draw(g, ax, f, J, front) {
    const ext = J.wSpin > 0.5;                      // pivoté vers l'avant pour frapper
    const u0 = ext ? -3 : -10, u1 = ext ? 11 : 3;
    g.S(ax, u0, u1, -1, 0.5, 'baton');
    g.S(ax, u0, u1, -1, -1, 'batonLight');
    g.S(ax, u0 - 1, u0, -1, 0.5, 'neon');
    g.S(ax, u1, u1 + 1, -1, 0.5, 'neon');
    g.S(ax, -0.5, 0.5, 0.5, 3, 'baton');
    if (front && J.phase === 'active' && !g.tint) {
      for (let k = 0; k < 4; k++) {
        const u = u1 + 1 + Math.random() * 4, v = (Math.random() - 0.5) * 7;
        g.S(ax, u, u, v, v, Math.random() < 0.5 ? 'neon' : '#ffffff');
      }
    }
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  ponytail: {
    back(g, J, P, f) {
      const h = J.head, t = f.animTime || 0, bx = h.x - 1, by = h.y + 2;
      for (let i = 0; i < 9; i++) {
        const x = bx - i - Math.round(J.sway * i * 0.3);
        const y = by + Math.round(i * 0.7 + Math.sin(t * 0.25 - i * 0.6) * (0.4 + i * 0.2));
        g.R(x, y, 2, 2, i > 6 ? 'hairTip' : 'hair');
      }
    },
  },
  visorHelmet: {
    hidesEyes: true,
    head(g, J, P, f) {
      const h = J.head, t = f.animTime || 0, hh = Math.round(h.h * 0.62);
      g.R(h.x - 1, h.y - 2, h.w + 1, hh + 2, 'helmet');
      g.R(h.x - 1, h.y, 4, h.h - 2, 'helmet');
      g.R(h.x, h.y - 2, h.w - 2, 1, 'helmetLight');
      g.R(h.x + 1, h.y - 1, h.w - 3, 1, 'neon2');
      const vy = h.y + Math.round(h.h * 0.32);
      g.R(h.x + 3, vy, h.w, 3, 'visor');
      g.R(h.x + 3, vy + 2, h.w, 1, 'visorShade');
      if (!g.tint) { const gx = h.x + 3 + ((t >> 2) % (h.w + 8)); if (gx < h.x + 3 + h.w) g.R(gx, vy, 1, 1, '#ffffff'); }
      g.R(h.x + 1, vy, 2, 3, 'neon');
    },
  },
  neonJacket: {
    body(g, J) {
      for (let y = J.sh.y + 1; y <= J.hip.y - 2; y++) {
        const r = J.row(y);
        g.R(r.x + r.w - 1, y, 1, 1, 'neon');
        g.R(r.x + r.w - 4, y, 1, 1, 'zip');
      }
      const rb = J.row(J.hip.y - 3);
      g.R(rb.x, J.hip.y - 3, rb.w, 1, 'neon2');
      const r0 = J.row(J.sh.y);
      g.R(r0.x + 2, J.sh.y - 2, r0.w - 4, 2, 'top');
      g.R(r0.x + 2, J.sh.y - 2, r0.w - 4, 1, 'neon');
      g.R(J.sF.x - 3, J.sF.y - 3, 6, 3, 'pad');
      g.R(J.sF.x - 3, J.sF.y - 1, 6, 1, 'padShade');
    },
  },
  kneePads: {
    legs(g, J) {
      g.R(J.kB.x - 2, J.kB.y - 2, 4, 4, 'padShade');
      g.R(J.kF.x - 1, J.kF.y - 2, 4, 4, 'pad');
    },
  },
  skates: {
    legs(g, J, P, f) {
      const spin = Math.floor((f.animTime || 0) / 3) % 2;
      for (const ft of [J.fB, J.fF]) {
        const x = Math.round(ft.x) - 2, y = Math.round(ft.y);
        g.R(x, y, 7, 1, 'frame');
        for (let k = 0; k < 3; k++) g.R(x + k * 3 - 1, y + 1, 2, 2, (k + spin) % 2 ? 'wheelLight' : 'wheel');
      }
    },
  },
});

/* ---------- Effet de fond : overdrive ---------- */
SCREEN_FX.overdrive = {
  init(s) {
    s.lines = Array.from({ length: 16 }, () => ({ y: 20 + Math.random() * 170, x: Math.random() * CONFIG.WIDTH, len: 15 + Math.random() * 30 }));
    s.dir = s.owner.facing;
  },
  draw(ctx, s, game) {
    const e = clamp(Math.min(s.t / 3, (s.max - s.t) / 8), 0, 1), W = CONFIG.WIDTH, H = CONFIG.HEIGHT, P = s.owner.palette;
    ctx.fillStyle = `rgba(20,0,30,${0.38 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.14 * e;
    ctx.fillStyle = P.neon2;
    for (let y = game.globalTime % 3; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 0.55 * e;
    ctx.fillStyle = P.neon;
    for (const l of s.lines) {
      const x = ((l.x - s.t * 14 * s.dir) % (W + 60) + W + 60) % (W + 60) - 30;
      ctx.fillRect(Math.round(x), Math.round(l.y), Math.round(l.len), 1);
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'volta',
  name: 'VOLTA',
  title: 'LA COURSIÈRE',
  description: 'Patineuse urbaine armée de deux tonfas électriques.',
  quotes: ['Livraison express. Signature pas nécessaire.', 'Trop lent, même pour un piéton.', 'Je repasse dans 3 secondes. Ou 2.'],
  stats: { maxHp: 105, walkSpeed: 1.9, jumpForce: 8.2, jumpSpeed: 2.6, defense: 0.95 },
  hitbox: { w: 16, h: 44 },
  body: { shoulderW: 14, hipW: 11, headW: 10, armT: 3, legT: 4, footLift: 3 },
  locomotion: 'skate',
  weapon: { type: 'tonfa' },
  parts: ['ponytail', 'neonJacket', 'belt', 'kneePads', 'skates', 'visorHelmet'],
  palette: {
    skin: '#c68863', skinShade: '#9a6544', mouth: '#5a2a2a',
    hair: '#ff3fa4', hairTip: '#ffd1ea',
    helmet: '#1c1c24', helmetLight: '#3a3a48', visor: '#3ff0ff', visorShade: '#1fa5b8',
    top: '#15151c', topShade: '#0b0b10', sleeve: '#15151c', sleeveShade: '#0b0b10',
    neon: '#3ff0ff', neon2: '#ff3fa4', zip: '#9aa0b0', pad: '#c7f000', padShade: '#8fa800',
    pants: '#2b2b38', pantsShade: '#1d1d27', shoes: '#e9e9f0', shoesShade: '#b0b0bc',
    frame: '#9aa0b0', wheel: '#c7f000', wheelLight: '#f4ff9a',
    glove: '#2b2b38', gloveShade: '#1d1d27', baton: '#3a3d4a', batonLight: '#6a6f80',
    belt: '#0b0b10', buckle: '#c7f000',
    accent: '#3ff0ff', slash: '#ffffff', slashEdge: '#ff3fa4',
  },
  altPalette: {
    neon: '#ffb000', neon2: '#7a5cff', visor: '#ffb000', visorShade: '#b37a00', hair: '#7a5cff', hairTip: '#d6ccff',
    pad: '#ff4d4d', padShade: '#b33636', wheel: '#ff4d4d', wheelLight: '#ffb0b0', top: '#2a1240', topShade: '#1a0b29',
    sleeve: '#2a1240', sleeveShade: '#1a0b29', accent: '#ffb000',
  },
  stance: {
    idle:   { hand: [6, 3], hand2: [7, 5] },
    guard:  { hand: [5, -4], hand2: [7, -3], lean: -1 },
    crouch: { hand: [6, 2], hand2: [7, 4] },
    jump:   { hand: [5, -1], hand2: [6, 3] },
    win:    { hand: [2, -12], hand2: [4, 6] },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 5, startup: 3, active: 3, recovery: 6, hitbox: { x: 6, y: -34, w: 18, h: 8 },
      knockback: 1.5, hitstun: 14, blockstun: 8, hitFx: 'zap', hitSfx: 'zap',
      anim: { windup: { hand: [3, 3] }, strike: { hand: [13, 0], lean: 2, wSpin: 1, footF: [6, 0] } } },
    kick:  { damage: 6, startup: 5, active: 4, recovery: 9, hitbox: { x: 6, y: -22, w: 20, h: 9 },
      knockback: 2.2, hitstun: 16, blockstun: 10,
      anim: { windup: { footF: [5, -8], lean: -1 }, strike: { footF: [17, -12], footB: [-3, 0], lean: -3 } } },
  },
  combos: [
    { name: 'OVERDRIVE', sequence: ['back', 'forward', 'punch'], window: 20, move: 'punch', damageMultiplier: 2.6,
      overrides: { startup: 6, active: 12, recovery: 16, dash: 6, afterimages: true, screenFx: 'overdrive', screenFxTime: 14,
        hitbox: { x: 2, y: -40, w: 20, h: 30 }, knockback: 4, hitstun: 28, launch: -3, hitFx: 'zap', hitSfx: 'zap',
        anim: { windup: { crouch: 4, lean: -2, hand: [-2, 4], hand2: [-1, 5] },
                strike: { lean: 5, hand: [14, 0], hand2: [13, 3], wSpin: 1, footF: [9, 0], footB: [-10, -2], crouch: 2 } } } },
    { name: 'COURT-CIRCUIT', sequence: ['down', 'down', 'punch'], window: 24, move: 'punch', damageMultiplier: 2.2,
      overrides: { startup: 10, active: 6, recovery: 18, hitbox: { x: -26, y: -46, w: 52, h: 46 }, fx: ['lightning'],
        sfx: 'zap', hitSfx: 'zap', hitFx: 'zap', knockback: 3.5, launch: -3.5, hitstun: 26, shake: 3,
        anim: { windup: { hand: [4, -1], hand2: [7, 0], crouch: 3 },
                strike: { hand: [-1, -12], hand2: [9, -10], wSpin: 1, crouch: 0 } } } },
    { name: 'GLISSADE RAIL', sequence: ['down', 'forward', 'kick'], window: 24, move: 'kick', damageMultiplier: 1.9,
      overrides: { startup: 5, active: 14, recovery: 14, dash: 4.5, trail: 'sparks', hitbox: { x: 0, y: -14, w: 24, h: 14 },
        knockback: 2.5, launch: -4, hitstun: 26, sfx: 'grind', level: 'low', lowProfile: true,
        anim: { windup: { crouch: 8, lean: -1 },
                strike: { crouch: 14, lean: -5, footF: [17, -2], footB: [-6, 0], hand: [-4, 6], hand2: [-6, 8] } } } },
  ],
  super: {
    name: 'SURCHARGE', move: 'punch', damageMultiplier: 1.4,
    overrides: { startup: 8, active: 30, recovery: 20, dash: 3.2, hits: 6, hitEvery: 5, afterimages: true,
      screenFx: 'overdrive', screenFxTime: 20, hitbox: { x: 0, y: -44, w: 26, h: 40 }, knockback: 4.5, launch: -5, hitstun: 30,
      hitFx: 'zap', hitSfx: 'zap', fx: ['lightning'],
      anim: { flurry: 6, windup: { hand: [2, 3], hand2: [12, 0], wSpin: 1, lean: 3 },
              strike: { hand: [14, 0], hand2: [3, 4], wSpin: 1, lean: 5, footF: [9, 0], footB: [-9, -2] } } },
  },
});
