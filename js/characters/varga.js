'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  VARGA — LE LYCAN
 *  Loup-garou sauvage. Griffes, bonds en plongée (garde debout
 *  obligatoire) et hurlement qui le met en rage (+30 % dégâts).
 * ===================================================================== */

/* ---------- Arme : griffes (une par main) ---------- */
WEAPONS.claws = {
  dual: true, reach: 9,
  draw(g, ax, f, J) {
    const L = J.wSpin > 0.5 ? 7 : 4;
    for (const v of [-2, 0, 2]) {
      g.S(ax, 1, L, v - 0.5, v, 'claw');
      g.S(ax, L, L + 1, v + 0.5, v + 1, 'clawShade');
    }
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  wolfTail: {
    back(g, J, P, f) {
      const t = f.animTime || 0, x0 = J.hip.x - J.B.hipW / 2, y0 = J.hip.y - 2;
      for (let i = 0; i < 12; i++) {
        const k = i / 12, w = Math.round(4 - Math.abs(k - 0.45) * 5);
        const x = x0 - i - Math.round(J.sway * k * 2), y = y0 + Math.round(k * 6 + Math.sin(t * 0.18 - i * 0.4) * 2 * k);
        g.R(x, y, 2, Math.max(2, w), i > 9 ? 'furLight' : 'fur');
      }
    },
  },
  tornShirt: {
    body(g, J) {
      const r = J.row(J.hip.y - 1);
      for (let x = r.x; x < r.x + r.w; x++) if ((x * 7) % 5 < 2) g.R(x, J.hip.y - 1, 1, 2, 'fur');   // bas déchiré
      const rc = J.row(J.sh.y + 3);
      g.R(rc.x + rc.w - 6, J.sh.y + 1, 4, 5, 'furLight');                                     // touffe de poils
      g.R(rc.x + rc.w - 5, J.sh.y + 6, 2, 2, 'furLight');
      g.R(rc.x + 2, J.sh.y + 7, 1, 4, 'topShade');                                            // accroc
    },
  },
  wolfHead: {
    hidesEyes: true,
    head(g, J, P, f) {
      const h = J.head, t = f.animTime || 0;
      g.R(h.x - 2, h.y, 4, h.h + 3, 'fur');                       // crinière
      g.R(h.x - 3, h.y + 3, 2, h.h, 'furShade');
      g.R(h.x + 1, h.y - 4, 3, 4, 'fur');                          // oreilles
      g.R(h.x + 2, h.y - 5, 1, 1, 'fur');
      g.R(h.x + 2, h.y - 3, 1, 2, 'earInner');
      g.R(h.x + 5, h.y - 3, 3, 3, 'furShade');
      g.R(h.x + 6, h.y - 4, 1, 1, 'furShade');
      const my = h.y + Math.round(h.h * 0.45);                    // museau
      g.R(h.x + h.w - 2, my, 5, Math.round(h.h * 0.4), 'fur');
      g.R(h.x + h.w + 2, my, 2, 2, 'nose');
      g.R(h.x + h.w - 2, my + Math.round(h.h * 0.4) - 1, 5, 1, 'furShade');
      const angry = f.state === 'attack' || (f.buffs && f.buffs.rage > 0);
      if (angry || f.state === 'win') {                              // gueule ouverte, crocs
        g.R(h.x + h.w - 1, my + 3, 4, 2, 'mouth');
        g.R(h.x + h.w, my + 3, 1, 1, 'fang');
        g.R(h.x + h.w + 2, my + 3, 1, 1, 'fang');
      }
      const ey = h.y + Math.round(h.h * 0.32);                    // œil luisant
      const hurt = f.state === 'hurt' || f.state === 'ko';
      g.R(h.x + h.w - 4, ey, hurt ? 3 : 2, hurt ? 1 : 2, (t % 90 < 4 && !hurt) ? 'furShade' : 'eye');
      g.R(h.x + h.w - 5, ey - 1, 4, 1, 'furShade');                // arcade
    },
  },
});

/* ---------- Effets ---------- */
FX.claw = {
  life: 14,
  draw(ctx, e) {
    const p = 1 - e.life / e.max, len = 16 * Math.min(1, p * 4 + 0.3);
    ctx.globalAlpha = 1 - p * 0.6;
    for (let i = -1; i <= 1; i++) {
      const ox = e.x + i * 4, oy = e.y + i * 2;
      ctx.fillStyle = e.P.accent; pxLine(ctx, ox - e.facing * len / 2, oy - len / 2 + 1, ox + e.facing * len / 2, oy + len / 2 + 1, 1);
      ctx.fillStyle = '#ffffff'; pxLine(ctx, ox - e.facing * len / 2, oy - len / 2, ox + e.facing * len / 2, oy + len / 2, 1);
    }
    ctx.globalAlpha = 1;
  },
};
FX.xslash = {
  life: 16, at: 'front',
  draw(ctx, e) {
    const p = 1 - e.life / e.max, L = 20 * Math.min(1, p * 3 + 0.2);
    ctx.globalAlpha = 1 - p * 0.7;
    for (const s of [-1, 1]) {
      ctx.fillStyle = e.P.accent; pxLine(ctx, e.x - L, e.y - s * L, e.x + L, e.y + s * L, 3);
      ctx.fillStyle = '#ffffff'; pxLine(ctx, e.x - L, e.y - s * L, e.x + L, e.y + s * L, 1);
    }
    ctx.globalAlpha = 1;
  },
};
SCREEN_FX.bloodMoon = {
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 8, (s.max - s.t) / 14), 0, 1);
    ctx.fillStyle = `rgba(40,0,0,${0.6 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = e;
    disc(ctx, W * 0.72, 46, 30, '#7a0f12');
    disc(ctx, W * 0.72, 46, 27, '#c4262b');
    disc(ctx, W * 0.72 - 7, 40, 6, '#a01c20');
    disc(ctx, W * 0.72 + 9, 54, 4, '#a01c20');
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'varga',
  name: 'VARGA',
  title: 'LE LYCAN',
  description: 'Loup-garou sauvage : griffes, bonds plongeants et rage sanguinaire.',
  quotes: ['La lune a faim.', "Je sens ta peur d'ici.", 'Cours. Ça rend la chasse amusante.'],
  stats: { maxHp: 104, walkSpeed: 1.75, jumpForce: 9.0, jumpSpeed: 2.6, defense: 1.0 },
  hitbox: { w: 20, h: 50 },
  body: { shoulderW: 18, hipW: 13, headW: 11, armT: 4, legT: 5, sleeves: 'long' },
  locomotion: 'step',
  weapon: { type: 'claws' },
  parts: ['wolfTail', 'tornShirt', 'belt', 'wolfHead'],
  palette: {
    skin: '#7d7f8a', skinShade: '#5a5c66', fur: '#7d7f8a', furShade: '#5a5c66', furLight: '#a8aab4', earInner: '#c48a8a',
    eye: '#ffd23f', nose: '#1a1a1a', mouth: '#3a0f0f', fang: '#ffffff',
    top: '#8a2a2a', topShade: '#5e1c1c', sleeve: '#7d7f8a', sleeveShade: '#5a5c66',
    pants: '#3a3550', pantsShade: '#272338', shoes: '#5a5c66', shoesShade: '#45474f',
    glove: '#5a5c66', gloveShade: '#45474f', claw: '#f4f0e6', clawShade: '#c8c0b0',
    belt: '#3a2616', buckle: '#8a8f9a', neon: '#ff4d2e', neon2: '#ffd23f',
    accent: '#ff4d2e', slash: '#ffffff', slashEdge: '#ff4d2e',
  },
  altPalette: {
    skin: '#3a2e2a', skinShade: '#241c1a', fur: '#3a2e2a', furShade: '#241c1a', furLight: '#5e4a42', sleeve: '#3a2e2a', sleeveShade: '#241c1a',
    glove: '#241c1a', gloveShade: '#140e0c', shoes: '#241c1a', eye: '#7fe0ff', top: '#2b4a3a', topShade: '#1c3227',
    accent: '#7fe0ff', slashEdge: '#7fe0ff', neon: '#7fe0ff',
  },
  stance: {
    idle:   { hand: [6, 6], hand2: [6, 8], lean: 3, crouch: 3 },
    guard:  { hand: [5, -4], hand2: [7, -2], lean: 1, crouch: 3 },
    crouch: { hand: [8, 4], hand2: [9, 6] },
    jump:   { hand: [6, -4], hand2: [5, -2], wSpin: 1 },
    win:    { hand: [1, -14], hand2: [3, -12], lean: -3, wSpin: 1 },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 6, startup: 4, active: 3, recovery: 9, hitbox: { x: 6, y: -44, w: 20, h: 22 },
      knockback: 1.8, hitstun: 15, blockstun: 9, hitFx: 'claw', sfx: 'slash',
      anim: { windup: { hand: [-2, -8], lean: 1, wSpin: 1 }, strike: { hand: [14, 4], lean: 5, wSpin: 1, footF: [8, 0] } } },
    kick:  { damage: 7, startup: 6, active: 4, recovery: 12, hitbox: { x: 6, y: -26, w: 22, h: 12 },
      knockback: 2.6, hitstun: 17, blockstun: 11,
      anim: { windup: { footF: [5, -12], lean: 0 }, strike: { footF: [19, -16], lean: -2 } } },
  },
  combos: [
    { name: 'BOND PRÉDATEUR', sequence: ['down', 'forward', 'kick'], window: 24, move: 'kick', damageMultiplier: 1.9,
      overrides: { startup: 8, active: 16, recovery: 12, lift: -5, dash: 4.5, level: 'high', hitbox: { x: 0, y: -46, w: 24, h: 30 },
        knockback: 2.5, launch: -3, hitstun: 26, hitFx: 'claw', sfx: 'slash',
        anim: { windup: { crouch: 10, lean: 4 },
                strike: { hand: [14, -2], hand2: [12, 2], wSpin: 1, lean: 6, crouch: 0, footF: [2, -12], footB: [-8, -6] } } } },
    { name: 'GRIFFES EN X', sequence: ['back', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 1.25,
      overrides: { startup: 7, active: 10, recovery: 16, dash: 2.5, hits: 2, hitEvery: 6, hitbox: { x: 2, y: -48, w: 24, h: 36 },
        knockback: 3, launch: -3, hitstun: 24, hitFx: 'claw', fx: ['xslash'], sfx: 'slash',
        anim: { flurry: 10, windup: { hand: [-2, -10], hand2: [-1, 8], wSpin: 1 },
                strike: { hand: [14, 6], hand2: [13, -8], wSpin: 1, lean: 4 } } } },
    { name: 'HURLEMENT', sequence: ['down', 'down', 'punch'], window: 24, move: 'punch', damageMultiplier: 1,
      overrides: { startup: 10, active: 20, recovery: 10, hitbox: null, buff: { rage: 360 }, screenFx: 'bloodMoon', screenFxTime: 30,
        sfx: 'howl', fx: ['ring'],
        anim: { windup: { lean: -3, hand: [-3, 6], hand2: [-4, 6] }, strike: { lean: -6, hand: [-4, 2], hand2: [-6, 2], crouch: 0, wSpin: 1 } } } },
  ],
  super: {
    name: 'CURÉE SANGLANTE', move: 'punch', damageMultiplier: 0.8,
    overrides: { startup: 10, active: 30, recovery: 22, dash: 2.2, hits: 7, hitEvery: 4, hitbox: { x: 0, y: -48, w: 30, h: 44 },
      afterimages: true, screenFx: 'bloodMoon', screenFxTime: 30, hitFx: 'claw', sfx: 'howl', knockback: 5, launch: -6, hitstun: 34,
      anim: { flurry: 6, windup: { hand: [-2, -10], hand2: [-1, 8], wSpin: 1 },
              strike: { hand: [14, 6], hand2: [13, -8], wSpin: 1, lean: 5 } } },
  },
});
