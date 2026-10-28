'use strict';
// [1.2] NOUVEAU — personnage original ajouté en 1.2 (voir CHANGELOG_1.2.md)
/* =====================================================================
 *  ORPHÉ — LE BARDE
 *  Ménestrel au luth et au chapeau à plume. Ses notes ondulent dans
 *  l'air, son accord dissonant repousse l'adversaire, et un air
 *  « allegro » le rend plus rapide.
 *  Forces : zonage (notes ondulées), hâte, repousse.
 *  Faiblesses : peu de PV, dégâts faibles au corps à corps.
 * ===================================================================== */

/* ---------- Arme : luth ---------- */
WEAPONS.lute = {
  twoHanded: false, length: 13, whiff: 'twang',
  draw(g, ax) {
    for (let u = -12; u <= -2; u += 0.5) {                // caisse bombée
      const w = 5 * Math.sin(Math.PI * (u + 12) / 10);
      g.S(ax, u, u, -w, w, 'lute');
      if (w > 2) g.S(ax, u, u, -w, -w + 1, 'luteLight');
    }
    g.S(ax, -8, -6, -1, 1, 'luteDark');                    // rosace
    g.S(ax, -2, 11, -1, 0.5, 'luteDark');                  // manche
    g.S(ax, 11, 14, 0, 2, 'luteDark');                     // chevillier coudé
    g.S(ax, 11.5, 13.5, 2.5, 2.5, 'luteLight');
    g.S(ax, -11, 11, -0.5, -0.5, 'strings');               // cordes
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  bardCape: {
    back(g, J) {
      const top = J.sh.y, len = 18;
      for (let i = 0; i < len; i++) {
        const k = i / len, r = J.row(Math.min(J.hip.y, top + i));
        const x = r.x - 1 - Math.round(k * (2 + J.sway * 2));
        g.R(x, top + i, 4 + Math.round(k * 4), 1, i > len - 3 ? 'capeShade' : 'cape');
      }
    },
  },
  wavyHair: {
    back(g, J, P, f) {
      const h = J.head, t = f.animTime || 0;
      for (let i = 0; i < 8; i++) g.R(h.x - 2 + Math.round(Math.sin(i * 0.9 + t * 0.06)), h.y + 2 + i, 4, 1, i % 3 ? 'hair' : 'hairShade');
    },
    head(g, J) {
      const h = J.head;
      g.R(h.x - 1, h.y - 1, h.w + 1, 3, 'hair');
      g.R(h.x - 1, h.y, 3, h.h, 'hair');
      g.R(h.x + h.w - 3, h.y + 1, 3, 2, 'hair');
      g.R(h.x + h.w - 4, h.y + h.h - 3, 4, 1, 'hairShade');   // petite barbiche
      g.R(h.x + h.w - 2, h.y + h.h - 2, 2, 2, 'hair');
    },
  },
  featherCap: {
    head(g, J, P, f) {
      const h = J.head, t = f.animTime || 0;
      g.R(h.x - 2, h.y - 3, h.w + 3, 3, 'hat');
      g.R(h.x, h.y - 5, h.w - 2, 2, 'hat');
      g.R(h.x + h.w - 2, h.y - 2, 3, 1, 'hat');
      g.R(h.x - 2, h.y - 1, h.w + 3, 1, 'hatShade');
      for (let i = 0; i < 9; i++) {                           // longue plume rouge
        const x = h.x + 2 - i - Math.round(J.sway * i * 0.2), y = h.y - 6 + Math.round(i * 0.4 + Math.sin(t * 0.12 - i * 0.5) * i * 0.12);
        g.R(x, y, 2, 1, i > 5 ? 'featherLight' : 'feather');
      }
    },
  },
  doublet: {
    body(g, J) {
      const cx = J.row(J.sh.y + 4);
      const mx = cx.x + cx.w - 5;
      for (let y = J.sh.y + 2; y < J.hip.y - 2; y += 3) {     // laçage doré en X
        g.R(mx, y, 1, 1, 'lacing'); g.R(mx + 2, y + 1, 1, 1, 'lacing');
        g.R(mx + 2, y, 1, 1, 'lacing'); g.R(mx, y + 1, 1, 1, 'lacing');
      }
      const r = J.row(J.hip.y - 2);
      g.R(r.x, J.hip.y - 2, r.w, 2, 'belt');
      g.R(r.x + 1, J.hip.y - 1, 2, 4, 'pouch');
    },
  },
});

/* ---------- Projectiles ---------- */
PROJECTILE_ART.note = function (ctx, p) {
  const x = Math.round(p.x), y = Math.round(p.y), col = p.owner.palette.note, glow = (p.t >> 2) % 2;
  ctx.globalAlpha = 0.35;
  disc(ctx, x, y + 2, 5, col);
  ctx.globalAlpha = 1;
  R(ctx, x - 3, y + 1, 4, 3, col);                           // tête de note
  R(ctx, x, y - 6, 1, 8, col);                               // hampe
  R(ctx, x + 1, y - 6, 2, 1, col); R(ctx, x + 2, y - 5, 1, 2, col);   // crochet
  if (glow) R(ctx, x - 2, y + 1, 1, 1, '#ffffff');
};

/* portée musicale géante (super) : 5 lignes et des notes qui défilent */
PROJECTILE_ART.staffBeam = function (ctx, p) {
  const P = p.owner.palette, dir = p.dir, x0 = p.x - dir * p.w / 2, y0 = Math.round(p.y - p.h / 2);
  const grow = Math.min(1, p.t / 5), fade = Math.min(1, p.life / 6), len = p.w * grow;
  ctx.globalAlpha = fade;
  R(ctx, x0, y0 - 2, dir * len, p.h + 4, 'rgba(255,240,200,0.18)');
  for (let i = 0; i < 5; i++) R(ctx, x0, y0 + i * p.h / 4, dir * len, 1, i === 2 ? '#ffffff' : P.note);
  for (let i = 0; i < 8; i++) {
    const k = ((i * 41 + p.t * 6) % len), ny = y0 + ((i * 7) % 5) * p.h / 4;
    R(ctx, x0 + dir * k - 2, ny - 1, 3, 3, P.note);
    R(ctx, x0 + dir * k + 1, ny - 6, 1, 6, P.note);
  }
  ctx.globalAlpha = 1;
};

/* ---------- Effet de fond : concert ---------- */
SCREEN_FX.concert = {
  draw(ctx, s, game) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 8, (s.max - s.t) / 12), 0, 1), o = s.owner;
    ctx.fillStyle = `rgba(10,5,25,${0.6 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.2 * e;
    ctx.fillStyle = '#fff3c4';
    for (const sx of [40, W - 40]) {                         // deux projecteurs qui convergent
      ctx.beginPath();
      ctx.moveTo(sx - 4, 0); ctx.lineTo(sx + 4, 0); ctx.lineTo(o.x + 20, CONFIG.GROUND_Y); ctx.lineTo(o.x - 20, CONFIG.GROUND_Y);
      ctx.fill();
    }
    ctx.globalAlpha = e;
    for (let i = 0; i < 10; i++) {
      const x = (i * 43 + game.globalTime * 0.6) % W, y = 40 + Math.sin(game.globalTime * 0.05 + i) * 20 + (i % 3) * 25;
      R(ctx, x, y, 3, 2, o.palette.note); R(ctx, x + 2, y - 5, 1, 5, o.palette.note);
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'orphe',
  name: 'ORPHÉ',
  title: 'LE BARDE',
  description: 'Ménestrel au luth : notes ondulantes, accord qui repousse et tempo accéléré.',
  quotes: ['Je composerai une ballade sur ta défaite.', 'Un peu faux, mais efficace.', 'Rappel ! Ah non, tu es KO.'],
  stats: { maxHp: 100, walkSpeed: 1.7, jumpForce: 8.6, jumpSpeed: 2.3, defense: 0.95 },
  hitbox: { w: 16, h: 46 },
  body: { shoulderW: 14, hipW: 11, headW: 10, armT: 3, legT: 4 },
  locomotion: 'step',
  weapon: { type: 'lute' },
  parts: ['bardCape', 'wavyHair', 'doublet', 'featherCap'],
  palette: {
    skin: '#f4d2b0', skinShade: '#d0aa88', eye: '#3a6a2a', brow: '#8a3a1a', mouth: '#8a3a2a',
    hair: '#a0461e', hairShade: '#7a3214',
    top: '#5c2a6e', topShade: '#3e1c4a', sleeve: '#e8dcc0', sleeveShade: '#c8bca0', lacing: '#e3b53b',
    cape: '#2e7d4a', capeShade: '#1f5a34', hat: '#2e7d4a', hatShade: '#1f5a34', feather: '#e63946', featherLight: '#ff8a8a',
    pants: '#3e1c4a', pantsShade: '#2a1232', shoes: '#6a4428', shoesShade: '#4a2e18', belt: '#6a4428', pouch: '#8a5a32',
    glove: '#f4d2b0', gloveShade: '#d0aa88',
    lute: '#b8762e', luteDark: '#7a4a1a', luteLight: '#e0a050', strings: '#f4f1ea', note: '#ffd166',
    accent: '#ffd166', slash: '#ffffff', slashEdge: '#ffd166',
  },
  altPalette: {
    top: '#2b5aa8', topShade: '#1c3d75', cape: '#a82a33', capeShade: '#7a1626', hat: '#a82a33', hatShade: '#7a1626',
    feather: '#ffd166', featherLight: '#fff3b0', hair: '#e8d8a0', hairShade: '#b8a870', note: '#9fdcff', accent: '#9fdcff', slashEdge: '#9fdcff',
  },
  stance: {
    idle:   { hand: [3, 8], ang: -35, grip: 1, hand2: [4, 10] },
    walk:   { hand: [3, 9], ang: -30, grip: 1, hand2: [4, 11] },
    guard:  { hand: [5, -2], ang: -80, grip: 1, hand2: [6, 0], lean: -1 },
    crouch: { hand: [4, 6], ang: -25, grip: 1, hand2: [5, 8] },
    jump:   { hand: [4, 2], ang: -50, grip: 1, hand2: [-2, -2] },
    win:    { hand: [3, -10], ang: -70, grip: 1, hand2: [5, -4] },
    lose:   { hand: [2, 11], ang: 80, grip: 1, hand2: [1, 12], crouch: 5, lean: 3 },
    hurt:   { hand: [-3, 6], ang: 90, grip: 1 },
  },
  attacks: {
    punch: { damage: 5, startup: 4, active: 3, recovery: 8, hitbox: { x: 10, y: -40, w: 20, h: 10 },
      knockback: 1.5, hitstun: 14, blockstun: 8, name: 'PIQUE DU MANCHE',
      anim: { windup: { hand: [0, 4], ang: -5 }, strike: { hand: [10, 2], ang: -5, lean: 2, footF: [6, 0] } } },
    kick:  { damage: 9, startup: 7, active: 4, recovery: 14, hitbox: { x: 4, y: -50, w: 26, h: 34 },
      knockback: 2.8, hitstun: 17, blockstun: 11, fx: ['arc'], arcWidth: 5, hitSfx: 'twang', name: 'COUP DE LUTH',
      anim: { windup: { hand: [-4, -8], ang: -150 }, strike: { hand: [12, 2], ang: 30, lean: 4, footF: [8, 0] } } },
  },
  airAttacks: {
    punch: { damage: 5, startup: 4, active: 6, recovery: 8, hitbox: { x: 4, y: -26, w: 20, h: 20 }, knockback: 1.8, hitstun: 15,
      blockstun: 9, anim: { windup: { hand: [2, -6], ang: -60 }, strike: { hand: [9, 6], ang: 40 } } },
    kick: { damage: 6, startup: 5, active: 6, recovery: 9, hitbox: { x: 2, y: -30, w: 20, h: 16 }, knockback: 2.2, hitstun: 15,
      blockstun: 9, anim: { windup: { footF: [2, -10] }, strike: { footF: [14, -14], lean: -2 } } },
  },
  combos: [
    { name: 'BALLADE', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 1.0,
      overrides: { startup: 9, active: 2, recovery: 20, hitbox: null, knockback: 1.2, hitstun: 16, sfx: 'note', hitSfx: 'note',
        projectile: { shape: 'note', pattern: 'stream', count: 3, interval: 7, speed: 3, wave: { amp: 8, freq: 0.18 },
                      w: 8, h: 10, life: 110, fromTip: true },
        anim: { windup: { hand2: [2, 8], ang: -35 }, strike: { hand2: [6, 6], ang: -30 } } } },
    { name: 'TEMPO ALLEGRO', sequence: ['down', 'down', 'kick'], window: 24, move: 'kick', damageMultiplier: 1,
      overrides: { startup: 10, active: 16, recovery: 8, hitbox: null, buff: { haste: 300 }, sfx: 'chord', fx: ['soundwave'],
        anim: { flurry: 4, windup: { hand2: [2, 8], ang: -35 }, strike: { hand2: [6, 10], ang: -35 } } } },
    { name: 'ACCORD DISSONANT', sequence: ['back', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 2.0,
      overrides: { startup: 7, active: 4, recovery: 18, hitbox: { x: 6, y: -48, w: 30, h: 36 }, knockback: 5.5, hitstun: 18,
        fx: ['soundwave'], sfx: 'chord', hitSfx: 'twang',
        anim: { windup: { hand2: [0, 6], ang: -40, lean: -2 }, strike: { hand2: [8, 4], ang: -10, lean: 3 } } } },
  ],
  super: {
    name: 'SYMPHONIE FINALE', move: 'punch', damageMultiplier: 1,
    // 1) prélude : il accorde son luth sous les projecteurs
    overrides: { startup: 16, active: 4, recovery: 0, hitbox: null, screenFx: 'concert', screenFxTime: 60, sfx: 'chord', invuln: { from: 1, to: 12 },
      anim: { flurry: 5, windup: { hand2: [2, 8], ang: -35 }, strike: { hand2: [6, 10], ang: -30 } },
      // 2) la portée géante traverse l'écran
      followUp: { damage: 5, startup: 4, active: 34, recovery: 24, hitbox: null, knockback: 3, launch: -5, hitstun: 30, sfx: 'chord', hitSfx: 'note',
        projectile: { shape: 'staffBeam', follow: true, w: 300, h: 26, life: 34, hits: 6, hitEvery: 5 },
        anim: { windup: { ang: -20, hand2: [8, 4] }, strike: { ang: -5, hand2: [10, 2], lean: -2 } } } },
  },
});
