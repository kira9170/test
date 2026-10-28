'use strict';
// [1.2] NOUVEAU — personnage original ajouté en 1.2 (voir CHANGELOG_1.2.md)
/* =====================================================================
 *  ZARA — LA RÉTIAIRE
 *  Gladiatrice au trident et au filet. Elle tient l'adversaire à
 *  distance avec de longues estocades, l'entrave dans son filet et
 *  saute à la perche par-dessus lui.
 *  Forces : portée, contrôle (entrave), super en trois temps.
 *  Faiblesses : récupérations longues au trident, peu de défense au corps à corps.
 * ===================================================================== */

/* ---------- Arme : trident ---------- */
WEAPONS.trident = {
  twoHanded: true, spread: 8, length: 27, whiff: 'whoosh',
  draw(g, ax) {
    g.S(ax, -15, 20, -0.5, 0.5, 'shaft');
    g.S(ax, -15, 20, -0.5, -0.5, 'shaftLight');
    g.S(ax, -16, -15, -1, 1, 'bronze');
    g.S(ax, 19.5, 21, -4, 4, 'bronze');                 // traverse
    g.S(ax, 21, 27, -0.5, 0.5, 'bronze');               // pointe centrale
    g.S(ax, 26.5, 28, -1, 1, 'bronzeLight');
    for (const s of [-1, 1]) {                          // pointes latérales + barbillons
      g.S(ax, 21, 25.5, s * 3.5, s * 4, 'bronze');
      g.S(ax, 25, 26.5, s * 3, s * 4, 'bronzeLight');
      g.S(ax, 23, 24, s * 2.5, s * 3, 'bronzeDark');
    }
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  braid: {
    back(g, J, P, f) {
      const h = J.head, t = f.animTime || 0;
      for (let i = 0; i < 14; i++) {
        const x = h.x - 1 - i * 0.6 - Math.round(J.sway * i * 0.25), y = h.y + 3 + i;
        const sw = Math.round(Math.sin(t * 0.12 - i * 0.4) * (i / 14) * 2);
        g.R(x + sw, y, 2, 1, i % 3 === 0 ? 'hairLight' : 'hair');
      }
      g.R(h.x - 9 - Math.round(J.sway * 3), h.y + 17, 2, 2, 'bronze');
    },
  },
  gladiatorTunic: {
    body(g, J) {
      const mid = J.sh.y + Math.round((J.hip.y - J.sh.y) * 0.45);
      for (let y = J.sh.y; y < mid; y++) { const r = J.row(y); g.R(r.x + 2, y, r.w - 4, 1, 'band'); }   // bandeau de cuir
      const r = J.row(J.hip.y - 3);
      g.R(r.x - 1, J.hip.y - 4, r.w + 2, 4, 'bronze');                                             // large ceinture (balteus)
      g.R(r.x - 1, J.hip.y - 4, r.w + 2, 1, 'bronzeLight');
      for (let x = r.x + 1; x < r.x + r.w; x += 3) g.R(x, J.hip.y - 2, 1, 1, 'bronzeDark');
      const rh = J.row(J.hip.y);                                                                    // tunique rouge
      for (let i = 0; i < 7; i++) g.R(rh.x - 1, J.hip.y + i, rh.w + 2, 1, i > 4 ? 'tunicShade' : 'tunic');
    },
  },
  galerus: {
    front(g, J) {
      // protège-épaule en bronze dressé sur l'épaule avant
      const x = J.sF.x - 3, y = J.sF.y - 6;
      g.R(x, y, 6, 8, 'bronze');
      g.R(x + 1, y - 2, 4, 2, 'bronze');
      g.R(x, y, 1, 8, 'bronzeLight');
      g.R(x + 5, y + 1, 1, 7, 'bronzeDark');
    },
  },
  sandalStraps: {
    legs(g, J) {
      for (const [k, ft] of [[J.kB, J.fB], [J.kF, J.fF]]) {
        for (let i = 2; i < 6; i++) {
          const x = k.x + (ft.x - k.x) * i / 6, y = k.y + (ft.y - 2 - k.y) * i / 6;
          g.R(x - 2 + (i % 2), y, 3, 1, 'strap');
        }
      }
    },
  },
});

/* ---------- Projectile : filet lesté ---------- */
PROJECTILE_ART.net = function (ctx, p) {
  const open = Math.min(1, p.t / 10), w = p.w * (0.4 + 0.6 * open), h = p.h * (0.4 + 0.6 * open);
  const x0 = p.x - w / 2, y0 = p.y - h / 2;
  ctx.fillStyle = '#d8c79a';
  for (let i = 0; i <= 4; i++) {
    pxLine(ctx, x0 + i * w / 4, y0, x0 + i * w / 4 + (i % 2 ? 2 : -2), y0 + h, 1);
    pxLine(ctx, x0, y0 + i * h / 4, x0 + w, y0 + i * h / 4 + (i % 2 ? 1 : -1), 1);
  }
  for (const [cx, cy] of [[x0, y0], [x0 + w, y0], [x0, y0 + h], [x0 + w, y0 + h]]) R(ctx, cx - 1, cy - 1, 3, 3, '#7a6a52');
};

/* ---------- Effet de fond : l'arène acclame ---------- */
SCREEN_FX.arena = {
  init(s) { s.crowd = Array.from({ length: 48 }, (_, i) => ({ x: i * 8 + Math.random() * 4, p: Math.random() * 6, c: pick(['#3a2418', '#5a3a28', '#2a1a10']) })); },
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 8, (s.max - s.t) / 12), 0, 1);
    ctx.fillStyle = `rgba(80,50,10,${0.4 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = e;
    for (const c of s.crowd) {                                  // foule qui lève les bras
      const up = Math.sin(s.t * 0.4 + c.p) > 0 ? 3 : 0;
      R(ctx, c.x, 30, 6, 12, c.c);
      disc(ctx, c.x + 3, 27, 3, c.c);
      R(ctx, c.x - 1, 28 - up, 1, 4, c.c);
      R(ctx, c.x + 6, 28 - up, 1, 4, c.c);
    }
    R(ctx, 0, 42, W, 2, '#7a5418');
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'zara',
  name: 'ZARA',
  title: 'LA RÉTIAIRE',
  description: 'Gladiatrice au trident et au filet : longue portée et entraves.',
  quotes: ['La foule a choisi. Pouce vers le bas.', 'Pris au filet, comme les autres.', 'Mon arène, mes règles.'],
  stats: { maxHp: 106, walkSpeed: 1.6, jumpForce: 8.4, jumpSpeed: 2.2, defense: 1.0 },
  hitbox: { w: 18, h: 48 },
  body: { shoulderW: 16, hipW: 12, headW: 10, armT: 3, legT: 4 },
  locomotion: 'step',
  weapon: { type: 'trident' },
  parts: ['braid', 'gladiatorTunic', 'sandalStraps', 'galerus'],
  palette: {
    skin: '#c98b5c', skinShade: '#9a6640', eye: '#2a1a10', brow: '#1a1210', mouth: '#6a2a1a',
    hair: '#1a1210', hairLight: '#3a2a20',
    top: '#c98b5c', topShade: '#9a6640', band: '#7a4a2a', sleeve: '#e8dcc0', sleeveShade: '#c8bca0',
    tunic: '#b23a3a', tunicShade: '#7a2626',
    pants: '#c98b5c', pantsShade: '#9a6640', shoes: '#6a4428', shoesShade: '#4a2e18', strap: '#6a4428',
    glove: '#e8dcc0', gloveShade: '#c8bca0',
    bronze: '#c08a3a', bronzeLight: '#e8b860', bronzeDark: '#7a5418', shaft: '#8a6a40', shaftLight: '#b08a5a',
    accent: '#e8b860', slash: '#ffffff', slashEdge: '#e8b860',
  },
  altPalette: {
    tunic: '#2b5aa8', tunicShade: '#1c3d75', band: '#2a2238', bronze: '#9aa0b0', bronzeLight: '#d8dce6', bronzeDark: '#5a6070',
    hair: '#b8401a', hairLight: '#e06a3a', accent: '#9fdcff', slashEdge: '#9fdcff',
  },
  stance: {
    idle:   { hand: [6, 4], ang: -8, grip: 2, lean: 1 },
    walk:   { hand: [6, 4], ang: -6, grip: 2 },
    guard:  { hand: [5, -2], ang: -80, grip: 2, lean: -1 },
    crouch: { hand: [7, 3], ang: 0, grip: 2 },
    jump:   { hand: [4, 0], ang: -30, grip: 2 },
    win:    { hand: [3, -10], ang: -90, grip: 1, hand2: [4, 4] },
    lose:   { hand: [2, 10], ang: 80, grip: 1, hand2: [1, 11], crouch: 5, lean: 3 },
    hurt:   { hand: [-2, 8], ang: 70, grip: 1 },
  },
  attacks: {
    punch: { damage: 5, startup: 6, active: 3, recovery: 11, hitbox: { x: 14, y: -40, w: 22, h: 8 },
      knockback: 1.8, hitstun: 15, blockstun: 9, name: 'ESTOC',
      anim: { windup: { hand: [0, 4], ang: -6 }, strike: { hand: [11, 2], ang: -4, lean: 3, footF: [8, 0] } } },
    kick:  { damage: 7, startup: 7, active: 4, recovery: 14, hitbox: { x: 6, y: -10, w: 30, h: 10 }, level: 'low',
      knockback: 2, hitstun: 17, blockstun: 11, fx: ['arc'], arcWidth: 4, name: 'FAUCHAGE',
      anim: { windup: { hand: [4, 4], ang: -40, crouch: 6 }, strike: { hand: [10, 10], ang: 25, crouch: 12, lean: 3 } } },
  },
  airAttacks: {
    punch: { damage: 6, startup: 5, active: 6, recovery: 9, hitbox: { x: 6, y: -16, w: 22, h: 22 }, knockback: 2, hitstun: 16,
      blockstun: 10, anim: { windup: { hand: [4, -6], ang: -40 }, strike: { hand: [8, 8], ang: 60 } } },
    kick: { damage: 6, startup: 4, active: 6, recovery: 9, hitbox: { x: 2, y: -32, w: 18, h: 18 }, knockback: 2, hitstun: 15,
      blockstun: 9, anim: { windup: { footF: [2, -8] }, strike: { footF: [8, -18], footB: [-4, -4] } } },
  },
  combos: [
    { name: 'FILET', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 0.6,
      overrides: { startup: 10, active: 2, recovery: 20, hitbox: null, status: { root: 70 }, knockback: 0.5, hitstun: 16, sfx: 'whoosh',
        projectile: { shape: 'net', speed: 3.4, vy: -1.2, gravity: 0.06, w: 22, h: 18, y: -36, life: 80 },
        anim: { windup: { hand2: [-6, -6], grip: 1, hand: [4, 6], ang: -20 }, strike: { hand2: [12, -4], grip: 1, hand: [4, 6], ang: -20 } } } },
    { name: 'TRIPLE POINTE', sequence: ['back', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 0.8,
      overrides: { startup: 7, active: 15, recovery: 16, dash: 3, hits: 3, hitEvery: 5, hitbox: { x: 12, y: -42, w: 26, h: 12 },
        knockback: 3, hitstun: 22,
        anim: { flurry: 5, windup: { hand: [2, 3], ang: -4 }, strike: { hand: [13, 1], ang: -4, lean: 4, footF: [10, 0], footB: [-8, 0] } } } },
    { name: 'SAUT À LA PERCHE', sequence: ['down', 'down', 'kick'], window: 24, move: 'kick', damageMultiplier: 1.4,
      overrides: { startup: 8, active: 20, recovery: 14, lift: -7, dash: 3.6, level: 'high', hitbox: { x: 0, y: -26, w: 22, h: 22 },
        knockback: 2.5, launch: -3, hitstun: 24, fx: [],
        anim: { windup: { hand: [6, 8], ang: 70, crouch: 6 }, strike: { hand: [2, 4], ang: 110, footF: [10, 6], footB: [4, 4], lean: 4, crouch: 0 } } } },
  ],
  super: {
    name: "VERDICT DE L'ARÈNE", move: 'punch', damageMultiplier: 0.6,
    // 1) jet du filet
    overrides: { startup: 10, active: 2, recovery: 6, hitbox: null, status: { root: 60 }, knockback: 0.3, hitstun: 26,
      screenFx: 'arena', screenFxTime: 70, sfx: 'whoosh',
      projectile: { shape: 'net', speed: 5, w: 24, h: 20, y: -34, life: 60 },
      anim: { windup: { hand2: [-6, -6], grip: 1, hand: [4, 6], ang: -20 }, strike: { hand2: [12, -4], grip: 1, hand: [4, 6], ang: -20 } },
      // 2) estocades en rafale
      followUp: { damage: 4.5, startup: 4, active: 22, recovery: 2, whiffRecovery: 22, dash: 3.2, hits: 5, hitEvery: 4,
        hitbox: { x: 12, y: -42, w: 26, h: 14 }, knockback: 0.8, hitstun: 28,
        anim: { flurry: 4, windup: { hand: [2, 3], ang: -4 }, strike: { hand: [13, 1], ang: -4, lean: 4, footF: [10, 0], footB: [-8, 0] } },
        // 3) soulève l'adversaire au bout du trident
        followUp: { requireHit: true, damage: 12, startup: 5, active: 4, recovery: 24, hitbox: { x: 6, y: -60, w: 28, h: 54 },
          launch: -8, knockback: 2, hitstun: 36, shake: 6, fx: ['arc'], arcWidth: 7, hitSfx: 'hitH',
          anim: { windup: { hand: [10, 8], ang: 30, crouch: 6 }, strike: { hand: [6, -14], ang: -80, lean: -2, crouch: 0 } } } } },
  },
});
