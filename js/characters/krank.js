'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  KRANK — LE FORGERON
 *  Colosse aux gantelets à vapeur. Encaisse les coups (armure),
 *  attrape (choppe imparable) et fait jaillir des geysers.
 * ===================================================================== */

/* ---------- Arme : gantelets à vapeur (un par main, remplacent les mains) ---------- */
WEAPONS.gauntlet = {
  dual: true, coversHand: true, reach: 6,
  draw(g, ax, f, J, front) {
    const base = front ? 'gauntlet' : 'gauntletDark';
    g.S(ax, -9, -1, -3, 3, base);                     // manchette
    g.S(ax, -9, -1, -3, -3, 'gauntletLight');
    g.S(ax, -7, -6, -3.5, 3.5, 'brass');              // bague de laiton
    g.S(ax, -8, -2, 3.5, 4.5, 'pipe');                // tuyau
    g.S(ax, -1, 5, -4, 4, base);                      // poing
    g.S(ax, 4.5, 5.5, -4, 4, 'gauntletLight');        // phalanges
    g.S(ax, 0, 4, -4, -4, 'gauntletLight');
    g.S(ax, 1, 1.5, -1, 1, 'gauntletDark');
    if (front && !g.tint && J.phase === 'active') {    // jets de vapeur
      for (let k = 0; k < 5; k++) {
        const u = -10 - Math.random() * 6, v = (Math.random() - 0.5) * 6;
        g.S(ax, u, u + 1, v, v + 1, Math.random() < 0.5 ? 'steam' : '#ffffff');
      }
    }
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  apron: {
    body(g, J) {
      // bavette + bretelles
      const r0 = J.row(J.sh.y + 3);
      g.R(r0.x + 3, J.sh.y + 3, r0.w - 5, J.hip.y - J.sh.y - 3, 'apron');
      g.R(r0.x + 3, J.sh.y + 3, 1, J.hip.y - J.sh.y - 3, 'apronShade');
      g.R(r0.x + 3, J.sh.y, 2, 4, 'strap');
      g.R(r0.x + r0.w - 4, J.sh.y, 2, 4, 'strap');
      g.R(r0.x + 5, J.sh.y + 8, 4, 3, 'apronShade');               // poche
      g.R(r0.x + 6, J.sh.y + 7, 1, 2, 'tool');                     // outil dans la poche
      // pan du tablier sur les cuisses
      const r = J.row(J.hip.y);
      for (let i = 0; i < 10; i++) g.R(r.x + 2, J.hip.y - 1 + i, r.w - 2, 1, i > 7 ? 'apronShade' : 'apron');
    },
  },
  baldGoggles: {
    head(g, J) {
      const h = J.head;
      g.R(h.x + 1, h.y, 3, 1, 'skinLight');                        // reflet du crâne
      g.R(h.x - 1, h.y + 2, h.w + 1, 2, 'strap');                  // sangle
      g.R(h.x + h.w - 6, h.y + 1, 3, 3, 'goggles');                // lunettes de forge
      g.R(h.x + h.w - 3, h.y + 1, 3, 3, 'goggles');
      g.R(h.x + h.w - 5, h.y + 2, 1, 1, 'lens');
      g.R(h.x + h.w - 2, h.y + 2, 1, 1, 'lens');
      const my = h.y + Math.round(h.h * 0.66);                     // grosse moustache
      g.R(h.x + h.w - 5, my, 6, 2, 'mustache');
      g.R(h.x + h.w - 6, my + 1, 2, 2, 'mustache');
      g.R(h.x + 2, h.y + Math.round(h.h * 0.5), 1, 2, 'soot');     // suie
    },
  },
});

/* ---------- Projectile : geyser de vapeur ---------- */
PROJECTILE_ART.geyser = {
  telegraph(ctx, p) {
    const k = (p.delay >> 1) % 2;
    R(ctx, p.x - 6, CONFIG.GROUND_Y - 1, 12, 1, k ? '#ffb347' : '#6b4f3a');
    if (k) { R(ctx, p.x - 3, CONFIG.GROUND_Y - 3, 1, 2, '#eef0f6'); R(ctx, p.x + 2, CONFIG.GROUND_Y - 4, 1, 3, '#eef0f6'); }
  },
  draw(ctx, p) {
    const grow = Math.min(1, p.t / 4), fade = Math.min(1, p.life / 8);
    const h = Math.round(p.h * grow), base = CONFIG.GROUND_Y;
    ctx.globalAlpha = fade;
    for (let y = 0; y < h; y++) {
      const w = Math.round(p.w * (0.45 + 0.55 * (y / h)) * (0.85 + 0.15 * Math.sin(p.t * 0.8 + y * 0.5)));
      R(ctx, p.x - w / 2, base - y, w, 1, y % 4 === 0 ? '#ffffff' : (y > h * 0.7 ? '#eef0f6' : '#c8ccd8'));
    }
    disc(ctx, p.x, base - h, Math.round(p.w * 0.55), '#ffffff');
    ctx.globalAlpha = 1;
  },
};

/* ---------- Effet de fond : forge (super) ---------- */
SCREEN_FX.forge = {
  init(s) { s.e = Array.from({ length: 50 }, () => ({ x: Math.random() * 384, y: Math.random() * 216, v: 0.6 + Math.random() * 1.5 })); },
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 6, (s.max - s.t) / 12), 0, 1);
    ctx.fillStyle = `rgba(60,10,0,${0.55 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = e;
    for (const q of s.e) R(ctx, q.x + Math.sin(s.t * 0.1 + q.y) * 2, (q.y - s.t * q.v + H) % H, 1, 2, q.v > 1.4 ? '#ffd166' : '#ff7b2e');
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'krank',
  name: 'KRANK',
  title: 'LE FORGERON',
  description: 'Colosse aux gantelets à vapeur. Encaisse, attrape et écrase.',
  quotes: ['Le fer se plie. Toi aussi.', 'Encore un peu de pression...', 'Retourne à la forge, il te reste des défauts.'],
  stats: { maxHp: 112, walkSpeed: 1.0, jumpForce: 7.0, jumpSpeed: 1.5, defense: 1.02 },
  hitbox: { w: 26, h: 50 },
  body: { shoulderW: 22, hipW: 16, headW: 11, armT: 5, legT: 6, sleeves: 'short' },
  locomotion: 'stomp',
  weapon: { type: 'gauntlet' },
  parts: ['apron', 'belt', 'baldGoggles'],
  palette: {
    skin: '#8d5a3b', skinShade: '#6a4029', skinLight: '#b07a55', eye: '#1a1a1a', brow: '#2a1a12', hair: '#2a1a12',
    mustache: '#2a1a12', soot: '#4a3020',
    top: '#8d5a3b', topShade: '#6a4029', sleeve: '#8d5a3b', sleeveShade: '#6a4029',
    apron: '#6b4a2e', apronShade: '#4e3420', strap: '#3a2616', tool: '#9aa0b0',
    pants: '#3d3f4a', pantsShade: '#2a2c35', shoes: '#2a1d14', shoesShade: '#1a120c',
    goggles: '#c9a227', lens: '#ff9f43',
    gauntlet: '#7a828c', gauntletLight: '#b3bcc6', gauntletDark: '#454b53', brass: '#c9a227', pipe: '#9a5a2e', steam: '#eef0f6',
    belt: '#3a2616', buckle: '#c9a227', accent: '#ff9f43', slash: '#ffffff', slashEdge: '#ff9f43',
  },
  altPalette: {
    skin: '#e0b48a', skinShade: '#b88a62', skinLight: '#f4cfa8', top: '#e0b48a', topShade: '#b88a62', sleeve: '#e0b48a', sleeveShade: '#b88a62',
    apron: '#2b3a4a', apronShade: '#1c2733', gauntlet: '#9a6a3a', gauntletLight: '#d49a5a', gauntletDark: '#5a3a1e',
    mustache: '#e8e8e8', accent: '#4cc9f0', slashEdge: '#4cc9f0',
  },
  stance: {
    idle:   { hand: [6, 6], hand2: [8, 8], lean: 1 },
    guard:  { hand: [6, -2], hand2: [8, 0], lean: -1 },
    crouch: { hand: [7, 4], hand2: [9, 6] },
    jump:   { hand: [5, -2], hand2: [7, 0] },
    win:    { hand: [4, -14], hand2: [5, -12], lean: -1 },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 8, startup: 7, active: 3, recovery: 14, hitbox: { x: 6, y: -44, w: 22, h: 14 },
      knockback: 2.8, hitstun: 17, blockstun: 12, fx: ['steam'], hitSfx: 'heavy',
      anim: { windup: { hand: [-2, 2], lean: -2 }, strike: { hand: [15, -2], lean: 3, footF: [8, 0] } } },
    kick:  { damage: 9, startup: 8, active: 4, recovery: 14, hitbox: { x: 6, y: -30, w: 20, h: 14 },
      knockback: 3, hitstun: 17, blockstun: 12, hitSfx: 'heavy',
      anim: { windup: { footF: [5, -12], lean: -1 }, strike: { footF: [15, -18], lean: -2 } } },
  },
  combos: [
    { name: 'ÉTAU', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 2.2,
      overrides: { grab: true, startup: 6, active: 4, recovery: 28, hitbox: { x: 4, y: -44, w: 16, h: 40 },
        knockback: 2, launch: -7, hitstun: 36, shake: 0, hitSfx: 'throw', fx: [],
        anim: { windup: { hand: [10, 0], hand2: [11, 2], lean: 3 }, strike: { hand: [4, -16], hand2: [5, -14], lean: -3 } } } },
    { name: 'PISTON', sequence: ['back', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 2.2,
      overrides: { armor: 1, startup: 14, active: 5, recovery: 18, dash: 3, hitbox: { x: 4, y: -44, w: 26, h: 20 },
        knockback: 6, launch: -3, hitstun: 26, shake: 5, fx: ['steam'], hitSfx: 'heavy',
        anim: { windup: { hand: [-6, 2], hand2: [2, 4], lean: -4, crouch: 2 },
                strike: { hand: [17, -2], lean: 5, footF: [10, 0], footB: [-8, 0] } } } },
    { name: 'GEYSER', sequence: ['down', 'down', 'kick'], window: 24, move: 'kick', damageMultiplier: 1.4,
      overrides: { startup: 12, active: 2, recovery: 22, hitbox: null, shake: 4, fx: ['ring'], launch: -6, knockback: 1.5, hitstun: 30,
        hitSfx: 'heavy', sfx: 'heavy',
        projectile: { shape: 'geyser', pattern: 'erupt', target: 'line', count: 3, start: 30, step: 26, delay: 10, interval: 8,
                      w: 16, h: 48, life: 22, activeFrom: 3 },
        anim: { windup: { footF: [5, -14], hand: [2, -6], hand2: [3, -4] },
                strike: { footF: [8, 0], crouch: 6, hand: [8, 10], hand2: [9, 10], lean: 3 } } } },
  ],
  super: {
    name: 'SURCHAUFFE', move: 'punch', damageMultiplier: 0.9,
    overrides: { armor: 2, startup: 14, active: 24, recovery: 24, dash: 2.6, hits: 4, hitEvery: 6, hitbox: { x: 2, y: -48, w: 30, h: 44 },
      screenFx: 'forge', screenFxTime: 30, fx: ['steam'], trail: 'embers', knockback: 6, launch: -6, hitstun: 36, hitSfx: 'heavy',
      anim: { flurry: 8, windup: { hand: [-2, 2], hand2: [12, -2], lean: 1 }, strike: { hand: [16, -2], hand2: [2, 4], lean: 4 } } },
  },
});
