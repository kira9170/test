'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  YSELLE — LA SORCIÈRE DU GIVRE
 *  Mage de contrôle : ralentit (froid), gèle sur place et fait jaillir
 *  des piliers de glace sous les pieds de l'adversaire.
 * ===================================================================== */

/* ---------- Arme : bâton de cristal ---------- */
WEAPONS.staff = {
  twoHanded: true, spread: 8, length: 22,
  draw(g, ax, f, J) {
    g.S(ax, -16, 17, -0.5, 0.5, 'wood');
    g.S(ax, -16, 17, -0.5, -0.5, 'woodShade');
    g.S(ax, 15, 16, -1.5, 1.5, 'circlet');           // bague
    g.S(ax, -17, -16, -1, 1, 'circlet');
    // cristal en losange
    for (let u = 17; u <= 25; u += 0.5) {
      const w = (u < 21 ? (u - 17) / 4 : (25 - u) / 4) * 3;
      g.S(ax, u, u, -w, w, 'crystal');
    }
    g.S(ax, 19, 22, -0.5, 0.5, 'crystalCore');
    g.S(ax, 18, 21, -2, -1.5, 'crystalShade');
    if (!g.tint && (J.phase === 'active' || (f.animTime || 0) % 40 < 4)) g.S(ax, 21, 21, -1, -1, '#ffffff');
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  longHair: {
    back(g, J, P, f) {
      const h = J.head, t = f.animTime || 0, len = 20;
      for (let i = 0; i < len; i++) {
        const sw = Math.round(Math.sin(t * 0.08 - i * 0.25) * (i / len) * 1.5 + J.sway * i * 0.15);
        g.R(h.x - 2 - sw, h.y + 2 + i, 5, 1, i > len - 4 ? 'hairShade' : 'hair');
      }
    },
    head(g, J) {
      const h = J.head;
      g.R(h.x - 1, h.y - 1, h.w + 1, 3, 'hair');
      g.R(h.x - 1, h.y, 4, h.h, 'hair');
      g.R(h.x + h.w - 4, h.y + 1, 4, 2, 'hair');
      g.R(h.x + h.w - 1, h.y + 2, 1, 5, 'hair');      // mèche devant le visage
      g.R(h.x + 1, h.y, 3, 1, 'hairLight');
    },
  },
  circlet: {
    head(g, J, P, f) {
      const h = J.head;
      g.R(h.x - 1, h.y + 1, h.w + 1, 1, 'circlet');
      g.R(h.x + h.w - 4, h.y - 1, 2, 3, 'crystal');
      g.R(h.x + h.w - 4, h.y - 1, 1, 1, (f.animTime || 0) % 50 < 6 ? '#ffffff' : 'crystalCore');
    },
  },
  furCollar: {
    body(g, J) {
      const r = J.row(J.sh.y);
      g.R(r.x - 1, J.sh.y - 2, r.w + 2, 3, 'fur');
      for (let x = r.x - 1; x < r.x + r.w + 1; x += 2) g.R(x, J.sh.y + 1, 1, 1, 'furShade');
    },
  },
  robe: {
    body(g, J) {
      // longue robe évasée jusqu'aux chevilles, ourlet de fourrure
      const r = J.row(J.hip.y), len = Math.max(6, -J.hip.y - 4 - J.B.footLift);
      for (let i = 0; i < len; i++) {
        const ex = Math.round(i * 0.35);
        g.R(r.x - ex, J.hip.y - 1 + i, r.w + ex * 2, 1, i >= len - 2 ? 'fur' : (i % 6 === 5 ? 'topShade' : 'top'));
      }
      g.R(r.x + r.w - 3, J.hip.y - 1, 1, len - 2, 'circlet');        // ouverture brodée
      g.R(r.x + r.w - 3, J.sh.y + 2, 1, J.hip.y - J.sh.y - 2, 'circlet');
    },
  },
});

/* ---------- Projectiles ---------- */
PROJECTILE_ART.shard = function (ctx, p) {
  const a = Math.atan2(p.vy, p.vx || 0.0001);
  const g = Painter(ctx, p.owner.palette, null, false);
  const ax = axis(p.x, p.y, a / DEG);
  g.S(ax, -6, 4, -1.5, 1.5, 'ice');
  g.S(ax, 4, 7, -0.5, 0.5, 'ice');
  g.S(ax, -6, 5, -0.5, 0, '#ffffff');
  g.S(ax, -5, 3, 1, 1.5, 'iceShade');
  ctx.globalAlpha = 0.6;
  for (let i = 1; i <= 3; i++) R(ctx, p.x - Math.cos(a) * (6 + i * 4), p.y - Math.sin(a) * (6 + i * 4) + ((i * 3) % 3) - 1, 1, 1, '#dff6ff');
  ctx.globalAlpha = 1;
};
PROJECTILE_ART.icePillar = {
  telegraph(ctx, p) {
    if ((p.delay >> 2) % 2) return;
    ctx.globalAlpha = 0.8;
    R(ctx, p.x - 9, CONFIG.GROUND_Y - 1, 18, 1, '#bfefff');
    R(ctx, p.x - 5, CONFIG.GROUND_Y - 2, 10, 1, '#ffffff');
    ctx.globalAlpha = 1;
  },
  draw(ctx, p) {
    const grow = Math.min(1, p.t / 4), fade = Math.min(1, p.life / 6);
    const h = Math.round(p.h * grow), base = CONFIG.GROUND_Y, w = p.w;
    ctx.globalAlpha = fade;
    for (let y = 0; y < h; y++) {
      const k = y / h, ww = Math.max(1, Math.round(w * (1 - k * 0.7)));
      R(ctx, p.x - ww / 2, base - y, ww, 1, '#9fe4ff');
      R(ctx, p.x - ww / 2, base - y, 2, 1, '#ffffff');
      R(ctx, p.x + ww / 2 - 2, base - y, 2, 1, '#5fb8e6');
    }
    for (const s of [-1, 1]) {                       // éclats latéraux
      for (let y = 0; y < h * 0.5; y++) R(ctx, p.x + s * (w / 2 + 2 - y * 0.25), base - y, 2, 1, '#bfefff');
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Effets ---------- */
FX.frost = {
  life: 16, at: 'tip',
  draw(ctx, e) {
    const p = 1 - e.life / e.max;
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2, d = 4 + p * 22;
      R(ctx, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, 2, 2, i % 2 ? '#ffffff' : '#9be7ff');
    }
  },
};
SCREEN_FX.blizzard = {
  init(s) { s.f = Array.from({ length: 110 }, () => ({ x: Math.random() * 420, y: Math.random() * 216, v: 1 + Math.random() * 2.5 })); },
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 10, (s.max - s.t) / 15), 0, 1);
    ctx.fillStyle = `rgba(190,230,255,${0.32 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = e;
    for (const q of s.f) {
      const x = ((q.x - s.t * q.v * 2.2) % (W + 40) + W + 40) % (W + 40) - 20, y = (q.y + s.t * q.v) % H;
      R(ctx, x, y, q.v > 2.5 ? 2 : 1, q.v > 2.5 ? 2 : 1, '#ffffff');
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'yselle',
  name: 'YSELLE',
  title: 'LA SORCIÈRE DU GIVRE',
  description: "Mage du froid : ralentit, gèle sur place et contrôle l'espace.",
  quotes: ["L'hiver ne pardonne pas.", 'Reste immobile... pour toujours.', 'Ton souffle gèle déjà.'],
  stats: { maxHp: 110, walkSpeed: 1.55, jumpForce: 8.2, jumpSpeed: 2.0, defense: 1.0 },
  hitbox: { w: 16, h: 46 },
  body: { shoulderW: 14, hipW: 12, headW: 10, armT: 3, legT: 4 },
  locomotion: 'step',
  weapon: { type: 'staff' },
  parts: ['longHair', 'robe', 'furCollar', 'circlet'],
  palette: {
    skin: '#f6dfd0', skinShade: '#d8b8a6', eye: '#3fb4ff', brow: '#cfe8ff', mouth: '#a0525a',
    hair: '#e8f4ff', hairShade: '#a8c8e8', hairLight: '#ffffff',
    top: '#3d6fa8', topShade: '#2a4f7a', sleeve: '#3d6fa8', sleeveShade: '#2a4f7a', fur: '#f4f8ff', furShade: '#c8d8ea',
    pants: '#2a4f7a', pantsShade: '#1c3656', shoes: '#e8f4ff', shoesShade: '#a8c8e8', glove: '#f4f8ff', gloveShade: '#c8d8ea',
    wood: '#c8ccd8', woodShade: '#8a92a6', crystal: '#9be7ff', crystalCore: '#ffffff', crystalShade: '#4fb3e0', circlet: '#cfe8ff',
    ice: '#bfefff', iceShade: '#6fc6ee',
    accent: '#9be7ff', slash: '#ffffff', slashEdge: '#9be7ff',
  },
  altPalette: {
    top: '#5a2a7a', topShade: '#3d1c54', sleeve: '#5a2a7a', sleeveShade: '#3d1c54', pants: '#3d1c54', pantsShade: '#2a1238',
    hair: '#2a2a3a', hairShade: '#14141e', hairLight: '#4a4a62', brow: '#2a2a3a', crystal: '#d69bff', crystalShade: '#9a4fe0',
    ice: '#e8c8ff', iceShade: '#b07ae0', accent: '#d69bff', slashEdge: '#d69bff',
  },
  stance: {
    idle:   { hand: [5, 8], ang: -70, grip: 1, hand2: [2, 10] },
    guard:  { hand: [6, 0], ang: -95, grip: 2, lean: -1 },
    crouch: { hand: [6, 4], ang: -50, grip: 1 },
    jump:   { hand: [4, 2], ang: -30, grip: 2 },
    win:    { hand: [3, -8], ang: -88, grip: 1, hand2: [2, 8] },
    hurt:   { hand: [-2, 8], ang: 70, grip: 1 },
  },
  attacks: {
    punch: { damage: 6, startup: 5, active: 3, recovery: 9, hitbox: { x: 10, y: -38, w: 26, h: 10 },
      knockback: 1.8, hitstun: 15, blockstun: 9,
      anim: { windup: { hand: [2, 4], ang: 0, grip: 2 }, strike: { hand: [10, 3], ang: -5, grip: 2, lean: 2, footF: [7, 0] } } },
    kick:  { damage: 6, startup: 6, active: 4, recovery: 13, hitbox: { x: 4, y: -10, w: 30, h: 10 }, level: 'low',
      knockback: 2, hitstun: 18, blockstun: 10, fx: ['arc'], arcWidth: 4,
      anim: { windup: { hand: [4, 2], ang: -40, grip: 2, crouch: 6 }, strike: { hand: [9, 10], ang: 25, grip: 2, crouch: 10, lean: 3 } } },
  },
  combos: [
    { name: 'ÉCLAT DE GIVRE', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 1.6,
      overrides: { startup: 10, active: 2, recovery: 18, hitbox: null, sfx: 'freeze', status: { chill: 150 }, knockback: 1.5, hitstun: 18,
        projectile: { shape: 'shard', speed: 4.2, w: 12, h: 6, life: 100, fromTip: true },
        anim: { windup: { hand: [4, 0], ang: -20, grip: 2 }, strike: { hand: [8, 2], ang: 0, grip: 2, lean: 2 } } } },
    { name: 'PILIER DE GLACE', sequence: ['down', 'back', 'punch'], window: 24, move: 'punch', damageMultiplier: 2.0,
      overrides: { startup: 12, active: 2, recovery: 22, hitbox: null, sfx: 'freeze', launch: -7, knockback: 1, hitstun: 32, hitSfx: 'shatter',
        projectile: { shape: 'icePillar', pattern: 'erupt', target: 'opponent', count: 1, delay: 24, w: 18, h: 50, life: 28, activeFrom: 3 },
        anim: { windup: { hand: [3, -10], ang: -90, grip: 1, hand2: [3, 6] }, strike: { hand: [8, 8], ang: 80, grip: 2, crouch: 4 } } } },
    { name: 'PRISON GELÉE', sequence: ['back', 'forward', 'kick'], window: 22, move: 'kick', damageMultiplier: 0.8,
      overrides: { startup: 9, active: 4, recovery: 20, hitbox: { x: 4, y: -48, w: 26, h: 48 }, status: { freeze: 55 },
        knockback: 0.5, hitstun: 10, fx: ['frost'], sfx: 'freeze', level: 'mid',
        anim: { windup: { hand: [3, -4], ang: -60, grip: 2 }, strike: { hand: [11, 0], ang: -10, grip: 2, lean: 3 } } } },
  ],
  super: {
    name: 'BLIZZARD ÉTERNEL', move: 'punch', damageMultiplier: 1.0,
    overrides: { startup: 16, active: 2, recovery: 26, hitbox: null, screenFx: 'blizzard', screenFxTime: 80, sfx: 'freeze',
      status: { chill: 220 }, knockback: 1.5, hitstun: 22,
      projectile: { shape: 'shard', pattern: 'rain', count: 6, spacing: 14, delay: 18, interval: 6, speed: 5.5, w: 10, h: 10, life: 90 },
      anim: { windup: { hand: [3, -10], ang: -90, grip: 1 }, strike: { hand: [3, -12], ang: -92, grip: 1, lean: -2 } } },
  },
});
