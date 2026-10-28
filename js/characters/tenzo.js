'use strict';
// [1.2] NOUVEAU — personnage original ajouté en 1.2 (voir CHANGELOG_1.2.md)
/* =====================================================================
 *  TENZO — LE MOINE DE LA CLOCHE
 *  Vieux moine aux longs sourcils blancs, une cloche de bronze sur le
 *  dos. Paumes lourdes, souffle chargé (maintenir Poing) et cloche qui
 *  repousse tout autour de lui.
 *  Forces : gros dégâts, attaque chargeable, défense autour de lui.
 *  Faiblesses : lent, sauts courts, récupérations longues.
 * ===================================================================== */

function drawBell(g, cx, top, P, swing) {
  const ax = axis(cx, top, 90 + (swing || 0));            // u = vers le bas de la cloche
  g.S(ax, -2, 0, -1, 1, 'rope');                           // anneau
  for (let u = 0; u <= 13; u += 0.5) {
    const w = 3 + u * 0.32 + (u > 11 ? (u - 11) * 0.9 : 0);
    g.S(ax, u, u, -w, w, u > 11 ? 'bronzeDark' : 'bronze');
  }
  g.S(ax, 1, 11, -2.5, -1.5, 'bronzeLight');               // reflet
  g.S(ax, 6, 7, -5, 5, 'bronzeDark');                       // bande gravée
  g.S(ax, 13.5, 15, -0.5, 0.5, 'bronzeDark');               // battant
}

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  bell: {
    back(g, J, P, f) {
      if (f.attack && f.attack.bellHeld && f.state === 'attack') return;
      const sx = J.sh.x - 9, sy = J.sh.y - 5;
      g.L({ x: J.sF.x - 2, y: J.sF.y - 1 }, { x: sx + 1, y: sy - 1 }, 1, 'rope');
      drawBell(g, sx, sy, P, Math.sin((f.animTime || 0) * 0.06) * 6 + (f.vx || 0) * -f.facing * 5);
    },
    front(g, J, P, f) {
      if (!(f.attack && f.attack.bellHeld && f.state === 'attack')) return;
      const cx = (J.hF.x + J.hB.x) / 2, cy = Math.min(J.hF.y, J.hB.y) - 1;
      const ring = f.attackFrame > f.attack.startup && f.attackFrame <= f.attack.startup + f.attack.active;
      drawBell(g, cx, cy, P, ring ? Math.sin(f.attackFrame * 1.5) * 14 : 0);
    },
  },
  kasaya: {
    body(g, J) {
      // drapé bordeaux sur une épaule, sous-robe grise sur l'autre
      for (let y = J.sh.y; y <= J.hip.y; y++) {
        const r = J.row(y), k = (y - J.sh.y) / (J.hip.y - J.sh.y);
        const cut = Math.round(r.w * (0.55 - k * 0.45));
        g.R(r.x, y, cut, 1, 'robe');
        g.R(r.x, y, 1, 1, 'robeShade');
        g.R(r.x + cut, y, 1, 1, 'sash');
      }
      const r = J.row(J.hip.y);                                // jupe longue
      for (let i = 0; i < 12; i++) {
        const ex = Math.round(i * 0.35);
        g.R(r.x - ex, J.hip.y - 1 + i, r.w + ex * 2, 1, i > 9 ? 'robeShade' : 'robe');
      }
      g.R(r.x + r.w - 4, J.hip.y - 1, 1, 11, 'sash');
    },
  },
  beads: {
    body(g, J) {
      const cx = J.sh.x + 2;
      for (let i = 0; i < 7; i++) {
        const a = (i / 6) * Math.PI, x = cx + Math.cos(a) * 5, y = J.sh.y + 1 + Math.sin(a) * 7;
        g.R(x - 1, y - 1, 2, 2, i % 3 === 0 ? 'beadsLight' : 'beads');
      }
      g.R(cx - 1, J.sh.y + 8, 3, 3, 'beadsLight');
    },
  },
  elderHead: {
    head(g, J, P, f) {
      const h = J.head, ey = h.y + Math.round(h.h * 0.42);
      g.R(h.x + 2, h.y, 3, 1, 'skinLight');                  // crâne rasé qui brille
      g.R(h.x + h.w - 5, ey - 2, 6, 1, 'eyebrow');           // longs sourcils blancs tombants
      g.R(h.x + h.w, ey - 1, 2, 3, 'eyebrow');
      const my = h.y + Math.round(h.h * 0.72);               // petite barbe blanche
      g.R(h.x + h.w - 4, my, 5, 2, 'eyebrow');
      g.R(h.x + h.w - 3, my + 2, 3, 3, 'eyebrow');
      g.R(h.x + h.w - 2, my + 5, 1, 1, 'eyebrow');
      if (f.state === 'idle' && (f.animTime || 0) % 160 > 120) g.R(h.x + h.w - 4, ey + 1, 3, 1, 'eye');   // yeux fermés, méditation
    },
  },
});

/* ---------- Projectile : paume spirituelle (grossit avec la charge) ---------- */
PROJECTILE_ART.spiritPalm = function (ctx, p) {
  const s = p.spec, d = p.dir, x = Math.round(p.x), y = Math.round(p.y), w = p.w, h = p.h;
  ctx.globalAlpha = 0.35;
  R(ctx, x - d * (w / 2 + 6), y - h / 4, d * 6, h / 2, s.color);
  ctx.globalAlpha = 0.85;
  R(ctx, x - w / 2, y - h / 2 + 3, w * 0.6, h - 6, s.color);                 // paume
  for (let i = 0; i < 4; i++) {                                               // doigts
    const fy = y - h / 2 + 2 + i * (h - 4) / 4;
    R(ctx, d > 0 ? x + w * 0.1 : x - w * 0.5, fy, w * 0.4, Math.max(1, (h - 4) / 4 - 1), s.color);
  }
  R(ctx, x - w * 0.2, y + h / 2 - 2, w * 0.3, 3, s.color);                   // pouce
  ctx.globalAlpha = 1;
  R(ctx, x - w * 0.25, y - 2, w * 0.3, 4, s.core);
  if ((p.t >> 2) % 2) R(ctx, x - d * w / 2, y - h / 2, 1, 1, '#ffffff');
};

/* ---------- Effet de fond : lumière du temple ---------- */
SCREEN_FX.templeGold = {
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 8, (s.max - s.t) / 14), 0, 1);
    ctx.fillStyle = `rgba(40,20,0,${0.5 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.18 * e;
    ctx.fillStyle = '#ffe9a0';
    const cx = s.owner.x;
    for (let i = -4; i <= 4; i++) {
      const sw = Math.sin(s.t * 0.05 + i) * 6;
      ctx.beginPath();
      ctx.moveTo(cx + i * 10, 0);
      ctx.lineTo(cx + i * 34 + sw - 10, H);
      ctx.lineTo(cx + i * 34 + sw + 10, H);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'tenzo',
  name: 'TENZO',
  title: 'LE MOINE DE LA CLOCHE',
  description: 'Vieux moine : paumes lourdes, souffle chargé et cloche de bronze.',
  quotes: ['Le silence après la cloche… voilà ma victoire.', 'Respire. Tu frapperas mieux la prochaine fois.', 'Cent huit coups, et pas un de trop.'],
  stats: { maxHp: 126, walkSpeed: 1.2, jumpForce: 7.4, jumpSpeed: 1.7, defense: 1.12 },
  hitbox: { w: 22, h: 50 },
  body: { shoulderW: 20, hipW: 15, headW: 11, armT: 4, legT: 5 },
  locomotion: 'step',
  weapon: null,
  parts: ['bell', 'kasaya', 'beads', 'elderHead'],
  palette: {
    skin: '#e8b98a', skinShade: '#b98a5e', skinLight: '#f8d8b0', eye: '#1a1a1a', brow: '#f4f1ea', eyebrow: '#f4f1ea', mouth: '#5a2a1a',
    top: '#4a4a52', topShade: '#34343a', sleeve: '#4a4a52', sleeveShade: '#34343a',
    robe: '#7a1f2b', robeShade: '#561520', sash: '#d4a73a',
    pants: '#4a4a52', pantsShade: '#34343a', shoes: '#8a6a40', shoesShade: '#6a4a28',
    beads: '#5a3a22', beadsLight: '#8a5a32', rope: '#c8b48a',
    bronze: '#b8862e', bronzeLight: '#e0b050', bronzeDark: '#7a5418',
    accent: '#ffd166', slash: '#fff3c4', slashEdge: '#ffd166',
  },
  altPalette: {
    robe: '#e0a526', robeShade: '#b07a14', sash: '#7a1f2b', top: '#6a5a4a', topShade: '#4a3e32', sleeve: '#6a5a4a', sleeveShade: '#4a3e32',
    bronze: '#7f8c96', bronzeLight: '#c8d2da', bronzeDark: '#4a545c', accent: '#9fdcff', slashEdge: '#9fdcff',
  },
  stance: {
    idle:   { hand: [6, 2], hand2: [5, 6] },
    walk:   { hand: [6, 4], hand2: [4, 7] },
    guard:  { hand: [5, -3], hand2: [6, -1], lean: -1 },
    crouch: { hand: [7, 2], hand2: [6, 4] },
    jump:   { hand: [5, -4], hand2: [4, -2] },
    win:    { hand: [4, -2], hand2: [4, -1], lean: -1 },
    lose:   { hand: [3, 10], hand2: [2, 11], crouch: 6, lean: 3 },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 6, startup: 5, active: 3, recovery: 10, hitbox: { x: 6, y: -42, w: 20, h: 14 },
      knockback: 2.2, hitstun: 16, blockstun: 10,
      anim: { windup: { hand: [-2, 3] }, strike: { hand: [15, -2], lean: 3, footF: [8, 0] } } },
    kick:  { damage: 9, startup: 9, active: 4, recovery: 15, hitbox: { x: 6, y: -22, w: 22, h: 12 },
      knockback: 3, hitstun: 18, blockstun: 12, hitSfx: 'hitH',
      anim: { windup: { footF: [5, -14], lean: -2 }, strike: { footF: [19, -12], lean: -3 } } },
  },
  airAttacks: {
    punch: { damage: 7, startup: 5, active: 6, recovery: 9, hitbox: { x: -2, y: -26, w: 22, h: 22 }, knockback: 2.5, hitstun: 17,
      blockstun: 10, anim: { windup: { hand: [-2, -8] }, strike: { hand: [6, 8], hand2: [4, 6], lean: 4 } } },
    kick: { damage: 7, startup: 5, active: 6, recovery: 9, hitbox: { x: 0, y: -30, w: 20, h: 18 }, knockback: 2.4, hitstun: 16,
      blockstun: 10, anim: { windup: { footF: [3, -8] }, strike: { footF: [9, -16], footB: [3, -14] } } },
  },
  combos: [
    { name: 'PAUME CÉLESTE', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 1.4,
      overrides: { startup: 10, active: 2, recovery: 18, hitbox: null, chargeable: { max: 50, bonus: 1.2 },
        knockback: 2.5, hitstun: 20, sfx: 'whoosh',
        projectile: { shape: 'spiritPalm', speed: 3.2, w: 14, h: 16, y: -38, life: 110, growWithCharge: true, color: '#ffe9a0', core: '#ffffff' },
        anim: { windup: { hand: [-6, 2], hand2: [-4, 4], lean: -2, crouch: 2 }, strike: { hand: [16, -2], hand2: [13, 0], lean: 4, footF: [9, 0] } } } },
    { name: 'GLAS', sequence: ['down', 'down', 'punch'], window: 24, move: 'punch', damageMultiplier: 1.1,
      overrides: { startup: 12, active: 4, recovery: 22, hitbox: { x: -34, y: -50, w: 68, h: 50 }, bellHeld: true, knockback: 5, hitstun: 20,
        fx: ['soundwave'], sfx: 'whoosh', hitSfx: 'bell',
        anim: { windup: { hand: [4, -10], hand2: [5, -8] }, strike: { hand: [6, -6], hand2: [7, -4], crouch: 2 } } } },
    { name: 'CLOCHE TOMBANTE', sequence: ['back', 'forward', 'kick'], window: 22, move: 'kick', damageMultiplier: 1.5,
      overrides: { startup: 10, active: 14, recovery: 18, lift: -6, dash: 3, level: 'high', bellHeld: true,
        hitbox: { x: 2, y: -32, w: 26, h: 32 }, launch: -4, knockback: 3, hitstun: 26, shake: 5, hitSfx: 'bell',
        anim: { windup: { hand: [2, -14], hand2: [3, -12], crouch: 6 },
                strike: { hand: [10, 6], hand2: [11, 8], lean: 5, footF: [6, -6], footB: [-6, -4], crouch: 0 } } } },
  ],
  super: {
    name: 'CENT HUIT COUPS', move: 'punch', damageMultiplier: 0.6,
    // 1) rafale de paumes
    overrides: { startup: 10, active: 26, recovery: 0, whiffRecovery: 26, hits: 8, hitEvery: 3, dash: 1.2,
      hitbox: { x: 4, y: -48, w: 26, h: 30 }, knockback: 1, hitstun: 30, screenFx: 'templeGold', screenFxTime: 50, hitSfx: 'hitL',
      anim: { flurry: 6, windup: { hand: [14, -4], hand2: [2, 2], lean: 3 }, strike: { hand: [2, 2], hand2: [14, 0], lean: 3 } },
      // 2) la cloche, pour finir
      followUp: { requireHit: true, damage: 14, startup: 6, active: 4, recovery: 26, bellHeld: true, hitbox: { x: -8, y: -58, w: 46, h: 58 },
        launch: -7, knockback: 4, hitstun: 36, fx: ['soundwave'], hitSfx: 'bell', shake: 8,
        anim: { windup: { hand: [3, -14], hand2: [4, -12] }, strike: { hand: [10, -4], hand2: [11, -2], lean: 4 } } } },
  },
});
