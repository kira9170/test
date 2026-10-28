'use strict';
/* =====================================================================
 *  SEIRAN — LE RŌNIN
 *  Sabreur errant, maître du dégainé éclair. Sa lame reste au fourreau
 *  jusqu'au dernier instant. Parade-riposte et tempête de pétales.
 * ===================================================================== */

/* ---------- Arme : sabre + fourreau ----------
 * pose.sheathed = 1 : la lame est rangée, la poignée dépasse à la hanche.
 * pose.sheathed = 0 : la lame est tenue en main, le fourreau vide reste à la ceinture. */
WEAPONS.katana = {
  twoHanded: true, spread: 4, length: 23,
  sheath(g, J, withHilt) {
    const sx = J.hip.x + 2, sy = J.hip.y - 2;
    const sa = axis(sx, sy, 166);                   // fourreau vers l'arrière
    g.S(sa, 0, 21, -1, 1, 'saya');
    g.S(sa, 0, 21, -1, -1, 'sayaLight');
    g.S(sa, 3, 4, -1.5, 1.5, 'cord');
    g.S(sa, 20.5, 21.5, -1.5, 1.5, 'tsuba');
    if (!withHilt) return;
    const ha = axis(sx, sy, -12);                  // poignée vers l'avant
    g.S(ha, -0.5, 0.5, -2.5, 2.5, 'tsuba');
    g.S(ha, 1, 8, -1, 1, 'hiltWrap');
    for (let u = 2; u < 8; u += 2) g.S(ha, u, u, -1, 1, 'hilt');
    g.S(ha, 8, 8.5, -1, 1, 'tsuba');
  },
  draw(g, ax, f, J) {
    if (J.sheathed) { this.sheath(g, J, true); return; }
    this.sheath(g, J, false);
    g.S(ax, -7, 0, -1, 1, 'hiltWrap');               // poignée
    for (let u = -6; u < 0; u += 2) g.S(ax, u, u, -1, 1, 'hilt');
    g.S(ax, -7.5, -7, -1, 1, 'tsuba');
    g.S(ax, 0.5, 1.5, -2.5, 2.5, 'tsuba');            // garde
    g.S(ax, 2, 21, -1, 0, 'steel');                   // lame
    g.S(ax, 2, 21, 0.5, 0.5, 'edge');
    g.S(ax, 21, 23, -0.5, 0, 'steel');
    g.S(ax, 4, 15, -1, -1, 'steelShade');
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  topknot: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 1, h.y - 1, h.w + 1, 3, 'hair');
      g.R(h.x - 1, h.y, 4, h.h - 3, 'hair');
      g.R(h.x + h.w - 3, h.y + 1, 3, 1, 'hair');
      g.R(h.x + 1, h.y - 4, 4, 3, 'hair');           // chignon
      g.R(h.x + 2, h.y - 2, 2, 1, 'obi');            // lien rouge
      g.R(h.x + 1, h.y - 4, 2, 1, 'hairLight');
      g.R(h.x - 2, h.y + 2, 2, 5, 'hair');           // mèche
    },
  },
  kimono: {
    body(g, J) {
      // col croisé blanc en V
      const top = J.sh.y, mid = J.sh.y + Math.round((J.hip.y - J.sh.y) * 0.55);
      for (let y = top; y <= mid; y++) {
        const r = J.row(y), k = (y - top) / (mid - top);
        const x = r.x + r.w - 3 - Math.round(k * (r.w * 0.45));
        g.R(x, y, 2, 1, 'collar');
      }
      // ceinture (obi) + nœud dans le dos
      const r = J.row(J.hip.y - 3);
      g.R(r.x, J.hip.y - 4, r.w, 3, 'obi');
      g.R(r.x - 2, J.hip.y - 5, 3, 4, 'obiKnot');
      g.R(r.x + 2, J.hip.y - 3, r.w - 4, 1, 'obiKnot');
    },
  },
  hakama: {
    legs(g, J) {
      // jupe-culotte plissée qui recouvre le haut des jambes
      const r = J.row(J.hip.y);
      for (let i = 0; i < 9; i++) {
        const ex = Math.round(i * 0.5);
        g.R(r.x - ex, J.hip.y - 1 + i, r.w + ex * 2, 1, i > 6 ? 'pantsShade' : 'pants');
      }
      for (let x = r.x + 1; x < r.x + r.w; x += 3) g.R(x, J.hip.y + 1, 1, 7, 'pantsShade');
    },
  },
});

/* ---------- Projectile : tourbillon de pétales ---------- */
PROJECTILE_ART.petals = function (ctx, p) {
  const s = p.spec, n = 12;
  for (let i = 0; i < n; i++) {
    const a = p.t * 0.25 + i / n * Math.PI * 2, r = (p.w / 2) * (0.5 + 0.5 * ((i % 3) / 2));
    const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 0.75;
    R(ctx, x, y, 2, 1, i % 3 ? s.color : s.dark);
    if (i % 4 === 0) R(ctx, x + 1, y + 1, 1, 1, '#ffffff');
  }
  ctx.globalAlpha = 0.5;
  disc(ctx, p.x, p.y, 3, '#ffffff');
  ctx.globalAlpha = 1;
};

/* ---------- Effets de fond ---------- */
SCREEN_FX.iaido = {
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 3, (s.max - s.t) / 6), 0, 1);
    const bar = Math.round(26 * e);
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    ctx.fillStyle = `rgba(255,240,245,${0.12 * e})`;
    ctx.fillRect(0, 0, W, H);
  },
};
SCREEN_FX.sakuraStorm = {
  init(s) { s.p = Array.from({ length: 80 }, () => ({ x: Math.random() * 420, y: Math.random() * 216, v: 2 + Math.random() * 4, o: Math.random() * 6 })); s.dir = s.owner.facing; },
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 8, (s.max - s.t) / 12), 0, 1);
    ctx.fillStyle = `rgba(40,0,20,${0.55 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = e;
    for (const q of s.p) {
      const x = ((q.x + s.t * q.v * s.dir) % (W + 40) + W + 40) % (W + 40) - 20;
      const y = (q.y + Math.sin(s.t * 0.1 + q.o) * 6 + s.t * 0.4) % H;
      R(ctx, x, y, 2, 1, q.o > 3 ? '#ffb7d0' : '#ffe1ec');
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'seiran',
  name: 'SEIRAN',
  title: 'LE RŌNIN',
  description: 'Sabreur errant. Dégaine, frappe et rengaine en un battement de cils.',
  quotes: ["Ma lame ne quitte son fourreau qu'une fois par combat.", 'Les pétales tombent. Toi aussi.', 'Tu as bougé. Tu as perdu.'],
  stats: { maxHp: 100, walkSpeed: 1.55, jumpForce: 8.4, jumpSpeed: 2.2, defense: 1.0 },
  hitbox: { w: 18, h: 48 },
  body: { shoulderW: 16, hipW: 13, headW: 10, armT: 3, legT: 5 },
  locomotion: 'step',
  weapon: { type: 'katana' },
  parts: ['kimono', 'hakama', 'topknot'],
  palette: {
    skin: '#f1c9a0', skinShade: '#c99a70', hair: '#1c1c28', hairLight: '#3a3a52', brow: '#1c1c28', eye: '#1a1a1a',
    top: '#2b3a67', topShade: '#1c2748', sleeve: '#2b3a67', sleeveShade: '#1c2748', collar: '#ece6d8',
    obi: '#b3263a', obiKnot: '#7a1626',
    pants: '#5a5f6e', pantsShade: '#3d414c', shoes: '#7a5230', shoesShade: '#5a3a20',
    steel: '#cfd6e0', steelShade: '#8d97a6', edge: '#ffffff', tsuba: '#d4a73a', hilt: '#1c1c28', hiltWrap: '#ece6d8',
    saya: '#1a1a22', sayaLight: '#3a3a48', cord: '#b3263a',
    petal: '#ffb7d0', neon: '#ffffff', neon2: '#ffb7d0',
    accent: '#ff8fb8', slash: '#ffffff', slashEdge: '#ffb3cf',
  },
  altPalette: {
    top: '#e8e2d4', topShade: '#b8b0a0', sleeve: '#e8e2d4', sleeveShade: '#b8b0a0', collar: '#2b2b38',
    obi: '#2b5aa8', obiKnot: '#1c3d75', pants: '#2b2b38', pantsShade: '#1c1c26', hair: '#d8d8e0', hairLight: '#ffffff',
    brow: '#d8d8e0', saya: '#7a1626', accent: '#7fc8ff', slashEdge: '#9fd8ff', neon2: '#9fd8ff',
  },
  stance: {
    idle:   { sheathed: 1, hand: [4, 9], hand2: [6, 11], grip: 1, lean: 1, crouch: 2, footF: [6, 0], footB: [-6, 0] },
    guard:  { sheathed: 0, hand: [6, 0], ang: -70, grip: 2, lean: -1 },
    crouch: { sheathed: 1, hand: [4, 8], hand2: [6, 10] },
    jump:   { sheathed: 0, hand: [5, 0], ang: -45, grip: 2 },
    win:    { sheathed: 1, hand: [4, 9], hand2: [6, 11], lean: 0 },
    hurt:   { sheathed: 1 },
  },
  attacks: {
    punch: { damage: 6, startup: 5, active: 3, recovery: 11, hitbox: { x: 6, y: -46, w: 26, h: 32 },
      knockback: 2, hitstun: 16, blockstun: 10, fx: ['arc'], arcWidth: 5, sfx: 'slash', hitFx: 'cuts',
      anim: { windup: { sheathed: 0, hand: [2, 6], ang: -40, grip: 2, lean: 0, crouch: 0 },
              strike: { sheathed: 0, hand: [10, 4], ang: 25, grip: 2, lean: 3, crouch: 0, footF: [8, 0] } } },
    kick:  { damage: 6, startup: 5, active: 4, recovery: 11, hitbox: { x: 6, y: -26, w: 20, h: 9 },
      knockback: 2.4, hitstun: 16, blockstun: 10,
      anim: { windup: { footF: [5, -10], lean: -1, crouch: 0 }, strike: { footF: [18, -16], lean: -3, crouch: 0 } } },
  },
  combos: [
    { name: 'IAÏ ÉCLAIR', sequence: ['back', 'forward', 'punch'], window: 20, move: 'punch', damageMultiplier: 2.4,
      overrides: { startup: 10, active: 6, recovery: 20, dash: 7, hitbox: { x: 0, y: -40, w: 28, h: 24 }, fx: [],
        knockback: 3, hitstun: 30, hitFx: 'cuts', screenFx: 'iaido', screenFxTime: 14, afterimages: true, sfx: 'slash',
        anim: { windup: { sheathed: 1, hand: [4, 9], crouch: 7, lean: 2, footF: [9, 0], footB: [-8, 0] },
                strike: { sheathed: 0, hand: [12, 6], ang: 0, grip: 2, crouch: 5, lean: 5, footF: [10, 0], footB: [-10, 0] } } } },
    { name: 'PÉTALES TRANCHANTS', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 0.75,
      overrides: { startup: 12, active: 2, recovery: 20, hitbox: null, sfx: 'slash', fx: ['arc'], knockback: 1.6, hitstun: 18,
        projectile: { shape: 'petals', speed: 2.4, w: 22, h: 20, y: -30, life: 110, hits: 3, hitEvery: 9, fromTip: true,
                      color: '#ffb7d0', dark: '#e07aa0' },
        anim: { windup: { sheathed: 0, hand: [0, -6], ang: -120, grip: 2, crouch: 0 },
                strike: { sheathed: 0, hand: [11, 6], ang: 30, grip: 2, lean: 2, crouch: 0 } } } },
    { name: 'GARDE DU SAULE', sequence: ['down', 'back', 'punch'], window: 24, move: 'punch', damageMultiplier: 1,
      overrides: { startup: 2, active: 26, recovery: 18, hitbox: null, fx: [], sfx: 'whoosh',
        counter: { from: 2, to: 28, riposte: { name: 'RIPOSTE', damage: 15, startup: 2, active: 6, recovery: 18, dash: 5,
          hitbox: { x: 0, y: -46, w: 30, h: 32 }, knockback: 3.5, launch: -5, hitstun: 30, blockstun: 14,
          fx: ['arc'], hitFx: 'cuts', sfx: 'slash', arcWidth: 7,
          anim: { windup: { sheathed: 1, hand: [4, 9], ang: 150, crouch: 4 },
                  strike: { sheathed: 0, hand: [11, -2], ang: -30, grip: 2, lean: 4, crouch: 0 } } } },
        anim: { windup: { sheathed: 1, hand: [4, 9], crouch: 6, lean: -1 }, strike: { sheathed: 1, hand: [4, 9], crouch: 6, lean: -1 } } } },
  ],
  super: {
    name: 'MILLE PÉTALES', move: 'punch', damageMultiplier: 0.9,
    overrides: { startup: 12, active: 30, recovery: 22, hits: 6, hitEvery: 5, dash: 1.6, hitbox: { x: -4, y: -50, w: 38, h: 46 },
      screenFx: 'sakuraStorm', screenFxTime: 30, hitFx: 'cuts', trail: 'petals', sfx: 'slash', knockback: 4, launch: -6, hitstun: 34,
      anim: { flurry: 7, windup: { sheathed: 0, hand: [0, -6], ang: -120, grip: 2, crouch: 0 },
              strike: { sheathed: 0, hand: [11, 6], ang: 40, grip: 2, lean: 3, crouch: 0 } } },
  },
});
