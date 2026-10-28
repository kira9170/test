'use strict';
// [1.2] NOUVEAU — personnage original ajouté en 1.2 (voir CHANGELOG_1.2.md)
/* =====================================================================
 *  PAPRIKA — LA CHEFFE DE RUE
 *  Cuisinière de stand de rue, poêle en fonte à la main. Elle lance des
 *  piments qui rebondissent, flambe tout ce qui approche et prend une
 *  pause goûter pour reprendre des forces.
 *  Forces : solide, se soigne, projectile difficile à lire (rebonds).
 *  Faiblesses : lente, soin très risqué, peu de mobilité.
 * ===================================================================== */

/* ---------- Arme : poêle en fonte ---------- */
WEAPONS.pan = {
  twoHanded: false, length: 15, whiff: 'whoosh',
  draw(g, ax) {
    g.S(ax, -1, 7, -0.5, 0.5, 'panHandle');
    g.S(ax, -1, 0, -0.5, 0.5, 'panLight');
    for (let u = 7; u <= 17; u += 0.5) {                 // poêle vue de face
      const w = Math.sqrt(Math.max(0, 25 - (u - 12) * (u - 12)));
      g.S(ax, u, u, -w, w, 'pan');
      if (w > 1.5) g.S(ax, u, u, -w + 1, w - 1, u < 12 ? 'panLight' : 'pan');
    }
    g.S(ax, 10, 11, -3, -2, '#ffffff');
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  bandana: {
    back(g, J, P, f) {
      const h = J.head, t = f.animTime || 0;
      const sw = Math.round(Math.sin(t * 0.2) * 1 + J.sway);
      g.R(h.x - 3 - sw, h.y + 1, 3, 2, 'bandana');               // nœud qui flotte
      g.R(h.x - 5 - sw, h.y + 2 + (t >> 3) % 2, 2, 3, 'bandanaShade');
    },
    head(g, J) {
      const h = J.head;
      g.R(h.x - 2, h.y + 2, 2, 4, 'hair');                       // boucles rousses
      g.R(h.x + h.w - 1, h.y + 2, 2, 3, 'hair');
      g.R(h.x - 1, h.y - 2, h.w + 2, 4, 'bandana');
      g.R(h.x - 1, h.y + 1, h.w + 2, 1, 'bandanaShade');
      for (let x = h.x; x < h.x + h.w; x += 3) g.R(x, h.y - 1, 1, 1, '#ffffff');   // pois blancs
      g.R(h.x + h.w - 3, h.y + Math.round(h.h * 0.62), 2, 1, 'blush');
    },
  },
  chefJacket: {
    body(g, J) {
      for (let y = J.sh.y + 3; y < J.hip.y - 1; y += 3) {
        const r = J.row(y);
        g.R(r.x + r.w - 4, y, 1, 1, 'buttons');
        g.R(r.x + r.w - 7, y, 1, 1, 'buttons');
      }
      const r0 = J.row(J.sh.y);
      g.R(r0.x + r0.w - 6, J.sh.y - 1, 5, 3, 'bandana');          // foulard noué
      g.R(r0.x + r0.w - 5, J.sh.y + 2, 3, 2, 'bandanaShade');
      g.R(r0.x + 1, J.sh.y - 1, r0.w - 7, 2, 'topShade');
      const r = J.row(J.hip.y);                                   // pans de veste
      for (let i = 0; i < 4; i++) g.R(r.x - 1, J.hip.y - 1 + i, r.w + 2, 1, i === 3 ? 'topShade' : 'top');
    },
  },
  checkPants: {
    legs(g, J) {
      for (const [hip, k, ft] of [[J.hipB, J.kB, J.fB], [J.hipF, J.kF, J.fF]]) {
        for (let i = 1; i < 8; i++) {
          const a = i < 4 ? hip : k, b = i < 4 ? k : ft, q = (i % 4) / 4 + (i >= 4 ? 0.25 : 0);
          const x = a.x + (b.x - a.x) * q, y = a.y + (b.y - 2 - a.y) * q;
          g.R(x - 1 + (i % 2) * 2, y, 1, 1, 'check');
        }
      }
    },
  },
});

/* ---------- Projectile : piment rebondissant ---------- */
PROJECTILE_ART.pepper = function (ctx, p) {
  const g = Painter(ctx, p.owner.palette, null, false);
  const ax = axis(p.x, p.y, p.t * 18 * p.dir);
  g.S(ax, -4, 3, -1.5, 1.5, 'pepper');
  g.S(ax, 3, 5, -1, 0.5, 'pepper');
  g.S(ax, -3, 1, -1.5, -1.5, '#ff8a8a');
  g.S(ax, -6, -4, -0.5, 0.5, 'pepperStem');
  if ((p.t >> 1) % 2) R(ctx, p.x - p.dir * 6, p.y + 2, 1, 1, '#ff9f1c');
};

/* ---------- Effet de fond : coup de feu en cuisine ---------- */
SCREEN_FX.kitchenFire = {
  init(s) { s.f = Array.from({ length: 40 }, () => ({ x: Math.random() * 384, p: Math.random() * 10, h: 10 + Math.random() * 30 })); },
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 8, (s.max - s.t) / 12), 0, 1);
    ctx.fillStyle = `rgba(60,10,0,${0.45 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.7 * e;
    for (const q of s.f) {
      const h = q.h * (0.7 + 0.3 * Math.sin(s.t * 0.4 + q.p));
      R(ctx, q.x, H - h, 4, h, '#ff5a1f');
      R(ctx, q.x + 1, H - h * 0.7, 2, h * 0.7, '#ff9f1c');
      R(ctx, q.x + 1, H - h * 0.35, 2, h * 0.35, '#ffe066');
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'paprika',
  name: 'PAPRIKA',
  title: 'LA CHEFFE DE RUE',
  description: 'Cuisinière de rue : poêle en fonte, piments rebondissants et pause goûter.',
  quotes: ['Service ! Une raclée, bien cuite.', 'Trop salé pour toi ?', 'Reviens quand tu auras faim.'],
  stats: { maxHp: 128, walkSpeed: 1.45, jumpForce: 7.6, jumpSpeed: 1.8, defense: 1.08 },
  hitbox: { w: 22, h: 46 },
  body: { shoulderW: 20, hipW: 17, headW: 11, armT: 4, legT: 5, sleeves: 'short' },
  locomotion: 'stomp',
  weapon: { type: 'pan' },
  parts: ['bandana', 'chefJacket', 'checkPants'],
  palette: {
    skin: '#f0c39a', skinShade: '#c8966a', eye: '#1a1a1a', brow: '#7a2a10', mouth: '#7a2a2a', blush: '#f0907a',
    hair: '#b8401a', top: '#f4f1ea', topShade: '#c8c2b4', sleeve: '#f4f1ea', sleeveShade: '#c8c2b4', buttons: '#3a3a4a',
    bandana: '#e63946', bandanaShade: '#a82a33',
    pants: '#2a2a3a', pantsShade: '#1c1c28', check: '#f4f1ea', shoes: '#3a8a4a', shoesShade: '#2a6a38',
    pan: '#2a2a32', panLight: '#5a5a68', panHandle: '#5a3a22', pepper: '#e63946', pepperStem: '#3a8a4a',
    accent: '#ff9f1c', slash: '#ffe066', slashEdge: '#ff9f1c',
  },
  altPalette: {
    bandana: '#2b5aa8', bandanaShade: '#1c3d75', top: '#2a2a3a', topShade: '#1c1c28', sleeve: '#2a2a3a', sleeveShade: '#1c1c28',
    buttons: '#ffd166', pants: '#7a2a2a', pantsShade: '#5a1a1a', hair: '#3a2418', accent: '#4cc9f0', slashEdge: '#4cc9f0',
  },
  stance: {
    idle:   { hand: [5, 2], ang: -60, grip: 1, hand2: [6, 6] },
    walk:   { hand: [5, 3], ang: -55, grip: 1, hand2: [5, 7] },
    guard:  { hand: [6, -4], ang: -90, grip: 1, hand2: [7, -1], lean: -1 },
    crouch: { hand: [6, 2], ang: -40, grip: 1, hand2: [7, 5] },
    jump:   { hand: [4, -6], ang: -110, grip: 1, hand2: [-2, -2] },
    win:    { hand: [3, -12], ang: -100, grip: 1, hand2: [6, 1] },
    lose:   { hand: [2, 11], ang: 90, grip: 1, hand2: [1, 11], crouch: 6, lean: 3 },
    hurt:   { hand: [-3, 6], ang: 100, grip: 1 },
  },
  attacks: {
    punch: { damage: 6, startup: 5, active: 3, recovery: 11, hitbox: { x: 6, y: -46, w: 22, h: 22 },
      knockback: 2.2, hitstun: 16, blockstun: 10, fx: ['arc'], arcWidth: 4, hitSfx: 'pan', name: 'COUP DE POÊLE',
      anim: { windup: { hand: [-2, -6], ang: -120 }, strike: { hand: [12, 2], ang: 20, lean: 3, footF: [7, 0] } } },
    kick:  { damage: 8, startup: 7, active: 4, recovery: 13, hitbox: { x: 6, y: -22, w: 22, h: 12 },
      knockback: 2.8, hitstun: 17, blockstun: 11, name: 'SABOT',
      anim: { windup: { footF: [5, -10], lean: -1 }, strike: { footF: [18, -12], lean: -3 } } },
  },
  airAttacks: {
    punch: { damage: 7, startup: 6, active: 5, recovery: 10, hitbox: { x: 2, y: -30, w: 24, h: 30 }, knockback: 2.6, hitstun: 17,
      blockstun: 11, hitSfx: 'pan', fx: ['arc'], arcWidth: 4,
      anim: { windup: { hand: [-2, -12], ang: -130 }, strike: { hand: [10, 8], ang: 50, lean: 3 } } },
    kick: { name: 'PLONGEON GOURMAND', damage: 8, startup: 6, active: 8, recovery: 10, hitbox: { x: -8, y: -24, w: 30, h: 24 },
      knockback: 2.4, hitstun: 17, blockstun: 11, hitSfx: 'hitH',
      anim: { windup: { footF: [4, -10], lean: -2 }, strike: { footF: [8, -4], footB: [-6, -4], lean: 6, tilt: 30 } } },
  },
  combos: [
    { name: 'PIMENT REBONDISSANT', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 1.0,
      overrides: { startup: 9, active: 2, recovery: 18, hitbox: null, knockback: 1.5, hitstun: 18, sfx: 'whoosh', hitSfx: 'sizzle',
        projectile: { shape: 'pepper', speed: 2.8, vy: -3.5, gravity: 0.22, bounce: 2, bounceDamp: 0.7, w: 8, h: 8, life: 150, fromTip: true },
        anim: { windup: { hand: [-4, -8], ang: -140 }, strike: { hand: [10, -8], ang: -40, lean: 2 } } } },
    { name: 'FLAMBÉ', sequence: ['back', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 0.7,
      overrides: { startup: 8, active: 14, recovery: 18, hits: 3, hitEvery: 5, hitbox: { x: 8, y: -48, w: 30, h: 28 },
        knockback: 2.5, launch: -3, hitstun: 22, trail: 'fire', sfx: 'sizzle', hitSfx: 'sizzle',
        anim: { windup: { hand: [2, 4], ang: -10 }, strike: { hand: [12, -2], ang: -30, lean: 2 } } } },
    { name: 'PAUSE GOÛTER', sequence: ['down', 'down', 'kick'], window: 24, move: 'kick', damageMultiplier: 1,
      overrides: { startup: 20, active: 2, recovery: 24, hitbox: null, heal: 12, sfx: 'none',
        anim: { windup: { hand2: [2, -8], hand: [4, 4], ang: 20 }, strike: { hand2: [3, -12], hand: [4, 4], ang: 20 } } } },
  ],
  super: {
    name: 'COUP DE FEU EN CUISINE', move: 'punch', damageMultiplier: 0.75,
    // 1) rafale de coups de poêle enflammée
    overrides: { startup: 8, active: 25, recovery: 0, whiffRecovery: 24, hits: 5, hitEvery: 5, dash: 2.5, hitbox: { x: 4, y: -48, w: 26, h: 32 },
      knockback: 1, hitstun: 30, screenFx: 'kitchenFire', screenFxTime: 50, trail: 'fire', sfx: 'pan', hitSfx: 'pan',
      anim: { flurry: 6, windup: { hand: [-2, -6], ang: -120 }, strike: { hand: [12, 2], ang: 20, lean: 3 } },
      // 2) la poêle géante pour conclure
      followUp: { requireHit: true, damage: 13, startup: 6, active: 4, recovery: 28, hitbox: { x: 0, y: -58, w: 32, h: 58 },
        launch: -7, knockback: 3, hitstun: 36, shake: 8, fx: ['ring', 'arc'], arcWidth: 9, hitSfx: 'pan',
        anim: { windup: { hand: [0, -18], ang: -100 }, strike: { hand: [14, 8], ang: 60, lean: 5, crouch: 4 } } } },
  },
});
