'use strict';
// [1.2] NOUVEAU — personnage original ajouté en 1.2 (voir CHANGELOG_1.2.md)
/* =====================================================================
 *  MARIONNE — LA MARIONNETTISTE
 *  Directrice d'un petit théâtre ambulant. Elle manie une croix de bois
 *  et des fils d'acier, et envoie Pipo, son pantin arlequin, se battre
 *  à sa place.
 *  Forces : contrôle de l'espace (pantin), attire l'adversaire, super à distance.
 *  Faiblesses : fragile, coups au corps à corps faibles, pantin destructible.
 * ===================================================================== */

/* ---------- Arme : croix de marionnettiste ---------- */
WEAPONS.controlBar = {
  twoHanded: false, length: 8, whiff: 'whoosh',
  draw(g, ax, f, J) {
    g.S(ax, -3, 7, -0.5, 0.5, 'wood');
    g.S(ax, 3, 4, -4, 4, 'wood');
    g.S(ax, -3, 7, -0.5, -0.5, 'woodLight');
    if (g.tint) return;
    for (const [u, v] of [[-3, 0], [7, 0], [3.5, -4], [3.5, 4]]) {     // fils qui pendent
      const x = ax.x + u * ax.ux + v * ax.nx, y = ax.y + u * ax.uy + v * ax.ny;
      g.L({ x, y }, { x: x + Math.sin((f.animTime || 0) * 0.1 + u) * 1.5, y: y + 9 }, 1, 'string');
    }
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  coatTailsTheatre: {
    back(g, J) {
      const len = 14, top = J.hip.y - 2;
      for (let i = 0; i < len; i++) {
        const k = i / len, x = Math.round(J.hip.x - J.B.hipW / 2 - 2 - k * (2 + J.sway * 2));
        g.R(x, top + i, 6 + Math.round(k * 2), 1, i > len - 3 ? 'gold' : (k > 0.5 ? 'topShade' : 'top'));
      }
    },
  },
  theatreCoat: {
    body(g, J) {
      for (let y = J.sh.y + 4; y < J.hip.y - 1; y += 4) { const r = J.row(y); g.R(r.x + r.w - 3, y, 1, 1, 'gold'); g.R(r.x + r.w - 6, y, 1, 1, 'gold'); }
      const r0 = J.row(J.sh.y);                                       // jabot en dentelle
      for (let i = 0; i < 5; i++) g.R(r0.x + r0.w - 5 + (i % 2), J.sh.y + i * 1.5, 3, 2, i % 2 ? 'jabotShade' : 'jabot');
      g.R(r0.x + 1, J.sh.y - 1, r0.w - 2, 2, 'topShade');
      const r = J.row(J.hip.y - 2);
      g.R(r.x, J.hip.y - 2, r.w, 2, 'gold');
    },
  },
  stockings: {
    legs(g, J) {
      for (const [k, ft] of [[J.kB, J.fB], [J.kF, J.fF]]) {
        for (let i = 1; i < 5; i++) {
          const x = k.x + (ft.x - k.x) * i / 5, y = k.y + (ft.y - 2 - k.y) * i / 5;
          g.R(x - 2, y, 4, 1, 'stripe');
        }
      }
    },
  },
  tricorne: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 1, h.y - 1, h.w + 1, 3, 'hair');                     // carré lilas
      g.R(h.x - 1, h.y, 3, h.h, 'hair');
      g.R(h.x + h.w - 4, h.y + 1, 4, 2, 'hair');
      g.R(h.x, h.y + h.h - 1, 3, 1, 'hairShade');
      g.R(h.x - 3, h.y - 3, h.w + 5, 2, 'hat');                      // tricorne noir
      g.R(h.x - 1, h.y - 6, h.w, 3, 'hat');
      g.R(h.x - 4, h.y - 4, 2, 2, 'hat');
      g.R(h.x + h.w + 1, h.y - 4, 2, 2, 'hat');
      g.R(h.x - 1, h.y - 3, h.w, 1, 'gold');
      g.R(h.x + h.w - 3, h.y - 7, 2, 2, 'feather');
      g.R(h.x + h.w - 2, h.y + Math.round(h.h * 0.62), 1, 1, 'blush');
    },
  },
});

/* ---------- Pipo, le pantin ---------- */
function drawPuppet(ctx, x, y, P, dir, t, attacking, swing) {
  const g = Painter(ctx, P, null, false);
  x = Math.round(x); y = Math.round(y);
  const step = attacking ? 0 : Math.round(Math.sin(t * 0.3) * 2);
  g.R(x - 2 + step, y - 6, 2, 6, 'puppetDark');                 // jambes
  g.R(x + 1 - step, y - 6, 2, 6, 'puppetDark');
  g.R(x - 3, y - 14, 7, 8, 'puppetRed');                         // corps losangé
  g.R(x - 1, y - 12, 2, 2, 'puppetGold'); g.R(x + 2, y - 10, 2, 2, 'puppetGold'); g.R(x - 3, y - 9, 2, 2, 'puppetGold');
  disc(ctx, x + 0.5, y - 18, 3, P.puppetFace);                  // tête en bois
  R(ctx, x + dir * 2, y - 19, 1, 1, '#1a1a1a');
  R(ctx, x + dir * 2, y - 17, 1, 1, P.puppetRed);
  g.R(x - 3, y - 22, 6, 2, 'puppetRed');                         // bonnet à grelot
  g.R(x - 4 - dir, y - 21, 2, 1, 'puppetRed');
  g.R(x - 5 - dir, y - 21, 1, 1, 'puppetGold');
  const a = attacking ? swing : -0.6;                            // petite épée
  const hx = x + dir * 3, hy = y - 12;
  ctx.fillStyle = '#d8dce6';
  pxLine(ctx, hx, hy, hx + dir * Math.cos(a) * 8, hy + Math.sin(a) * 8, 1);
}

PROJECTILE_ART.puppet = function (ctx, p) {
  const o = p.owner, P = o.palette, y = CONFIG.GROUND_Y;
  const atk = p.attackingNow, m = p.minion;
  const swing = atk ? -1.2 + (p.mTimer - m.windup) / m.active * 2.2 : 0;
  if (o.state !== 'hurt' && o.state !== 'ko' && o.state !== 'down') {   // fils reliés à la croix
    const J = Pose.compute(o);
    const hx = o.x + o.facing * J.hF.x, hy = o.y + J.hF.y;
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = P.string;
    pxLine(ctx, hx, hy, p.x, y - 22, 1);
    pxLine(ctx, hx, hy, p.x + p.dir * 3, y - 12, 1);
    ctx.globalAlpha = 1;
  }
  drawPuppet(ctx, p.x, y, P, p.dir, p.t, p.mState === 'attack' && p.mTimer >= m.windup - 4, swing);
  if (p.minionHp < p.minion.hp) R(ctx, p.x - 2, y - 27, 1, 2, '#ffffff');      // fêlure
};

/* fils d'acier qui harponnent l'adversaire */
PROJECTILE_ART.strings = function (ctx, p) {
  const o = p.owner, J = Pose.compute(o), P = o.palette;
  const hx = o.x + o.facing * J.hF.x, hy = o.y + J.hF.y;
  ctx.fillStyle = P.string;
  for (let i = -1; i <= 1; i++) pxLine(ctx, hx, hy, p.x, p.y + i * 3, 1);
  R(ctx, p.x - 2, p.y - 4, 4, 8, P.gold);
  R(ctx, p.x + p.dir * 2, p.y - 1, 2, 2, '#ffffff');
};

/* pantins qui tombent du ciel (super) */
PROJECTILE_ART.puppetDrop = {
  telegraph(ctx, p) {
    ctx.globalAlpha = 0.5;
    R(ctx, p.x - 6, CONFIG.GROUND_Y - 1, 12, 2, '#000000');
    ctx.globalAlpha = 1;
  },
  draw(ctx, p) {
    const P = p.owner.palette, fall = Math.min(1, p.t / 6), y = CONFIG.GROUND_Y - 30 + 30 * fall;
    ctx.fillStyle = P.string;
    pxLine(ctx, p.x, 0, p.x, y - 22, 1);
    const dir = p.x < p.owner.x ? 1 : -1;
    drawPuppet(ctx, p.x, y, P, dir, p.t, true, -1.2 + Math.min(1, p.t / 10) * 2.4);
    if (p.t > 4 && p.t < 12) {
      ctx.fillStyle = '#ffffff';
      pxLine(ctx, p.x - 10, y - 26, p.x + 10, y - 4, 1);
    }
  },
};

/* ---------- Effet de fond : rideau de théâtre ---------- */
SCREEN_FX.curtain = {
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, q = s.t / s.max;
    const close = q < 0.25 ? q / 0.25 : q < 0.45 ? 1 : Math.max(0, 1 - (q - 0.45) / 0.35);
    const cw = Math.round((W / 2) * 0.45 * close);
    for (const side of [0, 1]) {
      const x0 = side ? W - cw : 0;
      R(ctx, x0, 0, cw, H, '#7a0f1e');
      for (let x = x0 + 3; x < x0 + cw; x += 7) R(ctx, x, 0, 2, H, '#5a0a16');
      R(ctx, side ? x0 : x0 + cw - 2, 0, 2, H, '#d4a73a');
    }
    R(ctx, 0, 0, W, Math.round(16 * Math.min(1, s.t / 6)), '#5a0a16');
    R(ctx, 0, Math.round(16 * Math.min(1, s.t / 6)), W, 2, '#d4a73a');
    const e = clamp(Math.min(s.t / 8, (s.max - s.t) / 12), 0, 1), o = s.owner;
    ctx.globalAlpha = 0.18 * e;                                    // projecteur
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.moveTo(o.x - 6, 0); ctx.lineTo(o.x + 6, 0); ctx.lineTo(o.x + 26, CONFIG.GROUND_Y); ctx.lineTo(o.x - 26, CONFIG.GROUND_Y);
    ctx.fill();
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'marionne',
  name: 'MARIONNE',
  title: 'LA MARIONNETTISTE',
  description: 'Fils d’acier et pantin arlequin : elle fait combattre Pipo à sa place.',
  quotes: ['Le spectacle est terminé. Applaudissez.', 'Pipo, salue le public.', 'Tu dansais très bien… au bout de mes fils.'],
  stats: { maxHp: 104, walkSpeed: 1.65, jumpForce: 8.6, jumpSpeed: 2.3, defense: 0.96 },
  hitbox: { w: 16, h: 46 },
  body: { shoulderW: 13, hipW: 12, headW: 10, armT: 3, legT: 4 },
  locomotion: 'step',
  weapon: { type: 'controlBar' },
  parts: ['coatTailsTheatre', 'theatreCoat', 'stockings', 'tricorne'],
  palette: {
    skin: '#f4dccb', skinShade: '#d0b09a', eye: '#2a8a7a', brow: '#9a88c0', mouth: '#a0525a', blush: '#f0a0a0',
    hair: '#c8b8e8', hairShade: '#9a88c0', hat: '#2a2238', feather: '#7fe0c8',
    top: '#1f6f68', topShade: '#144d48', sleeve: '#1f6f68', sleeveShade: '#144d48', jabot: '#ffffff', jabotShade: '#d8d8e0', gold: '#d4a73a',
    pants: '#2a2238', pantsShade: '#1a1426', stripe: '#f4f1ea', shoes: '#5a1e2a', shoesShade: '#3a1018',
    glove: '#f4f1ea', gloveShade: '#c8c2b4', wood: '#c08850', woodLight: '#e0a868', string: '#e8e8f0',
    puppetRed: '#c83b3b', puppetGold: '#ffd166', puppetFace: '#f0d0a0', puppetDark: '#2a2238',
    accent: '#7fe0c8', slash: '#ffffff', slashEdge: '#7fe0c8',
  },
  altPalette: {
    top: '#5a1e2a', topShade: '#3a1018', sleeve: '#5a1e2a', sleeveShade: '#3a1018', hair: '#2a2238', hairShade: '#14101e',
    feather: '#ffd166', puppetRed: '#2b5aa8', accent: '#ffd166', slashEdge: '#ffd166',
  },
  stance: {
    idle:   { hand: [6, -2], ang: 0, hand2: [4, 7], lean: -1 },
    walk:   { hand: [6, -1], ang: 0, hand2: [4, 7] },
    guard:  { hand: [4, -5], ang: -20, hand2: [6, -2], lean: -1 },
    crouch: { hand: [7, -1], ang: 0, hand2: [5, 5] },
    jump:   { hand: [5, -6], ang: -20, hand2: [-3, -2] },
    win:    { hand: [4, -12], ang: -10, hand2: [8, 2], lean: -1 },
    lose:   { hand: [2, 11], ang: 70, hand2: [1, 12], crouch: 5, lean: 3 },
    hurt:   { hand: [-3, 6], hand2: [-4, 5], ang: 60 },
  },
  attacks: {
    punch: { damage: 5, startup: 4, active: 4, recovery: 8, hitbox: { x: 8, y: -42, w: 24, h: 12 },
      knockback: 1.4, hitstun: 14, blockstun: 8, fx: ['arc'], arcWidth: 2,
      anim: { windup: { hand: [2, -8], ang: -60 }, strike: { hand: [12, 0], ang: 10, lean: 2 } } },
    kick:  { damage: 8, startup: 6, active: 4, recovery: 12, hitbox: { x: 4, y: -30, w: 22, h: 14 },
      knockback: 2.4, hitstun: 17, blockstun: 10, fx: ['swoosh'],
      anim: { spin: true, windup: { footF: [3, -8] }, strike: { footF: [17, -18], lean: -3 } } },
  },
  airAttacks: {
    punch: { damage: 5, startup: 4, active: 6, recovery: 8, hitbox: { x: 2, y: -24, w: 20, h: 20 }, knockback: 1.8, hitstun: 15,
      blockstun: 9, anim: { windup: { hand: [2, -10], ang: -70 }, strike: { hand: [8, 8], ang: 40, lean: 3 } } },
    kick: { damage: 6, startup: 5, active: 6, recovery: 9, hitbox: { x: -2, y: -26, w: 24, h: 16 }, knockback: 2.2, hitstun: 16,
      blockstun: 10, anim: { windup: { footF: [-2, -10], footB: [2, -6] }, strike: { footF: [14, -12], footB: [-8, -8] } } },
  },
  combos: [
    { name: 'PIPO, EN SCÈNE !', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 1.4,
      overrides: { startup: 12, active: 2, recovery: 18, hitbox: null, sfx: 'puppet', hitSfx: 'hitM', knockback: 2, hitstun: 18,
        projectile: { shape: 'puppet', minion: { speed: 1.6, range: 10, every: 30, windup: 12, active: 6, hp: 2 }, hits: 3,
                      w: 14, h: 24, y: -12, life: 320 },
        anim: { windup: { hand: [2, -10], ang: -30 }, strike: { hand: [12, -6], ang: 10, lean: 2 } } } },
    { name: "FILS D'ACIER", sequence: ['down', 'back', 'punch'], window: 24, move: 'punch', damageMultiplier: 1.5,
      overrides: { startup: 8, active: 2, recovery: 24, hitbox: null, knockback: -4, hitstun: 26, blockstun: 12, sfx: 'whoosh',
        projectile: { shape: 'strings', tether: true, returnAt: 16, speed: 5, w: 12, h: 10, life: 60, fromTip: true },
        anim: { windup: { hand: [-4, -4], ang: -40 }, strike: { hand: [14, -2], ang: 0, lean: 3 } } } },
    { name: 'CABRIOLE', sequence: ['back', 'forward', 'kick'], window: 22, move: 'kick', damageMultiplier: 1.4,
      overrides: { startup: 7, active: 14, recovery: 12, lift: -5.5, dash: 3.4, level: 'high', hitbox: { x: -2, y: -28, w: 24, h: 22 },
        knockback: 2.5, launch: -3, hitstun: 24,
        anim: { linear: true, windup: { crouch: 6 }, strike: { tilt: -360, footF: [12, -14], footB: [-10, -10], hand: [4, -10] } } } },
  ],
  super: {
    name: 'GRAND GUIGNOL', move: 'punch', damageMultiplier: 1.6,
    overrides: { startup: 14, active: 2, recovery: 30, hitbox: null, screenFx: 'curtain', screenFxTime: 50, sfx: 'puppet', hitSfx: 'hitM',
      launch: -4, knockback: 2, hitstun: 30,
      projectile: { shape: 'puppetDrop', pattern: 'erupt', target: 'opponent', count: 3, step: 26, delay: 16, interval: 10,
                    w: 18, h: 40, life: 22, activeFrom: 5 },
      anim: { windup: { hand: [3, -14], ang: -10, hand2: [6, -10] }, strike: { hand: [5, -16], ang: 0, hand2: [9, -12], lean: -1 } } },
  },
});
