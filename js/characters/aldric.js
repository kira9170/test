'use strict';
// [1.2] NOUVEAU — personnage original ajouté en 1.2 (voir CHANGELOG_1.2.md)
/* =====================================================================
 *  ALDRIC — LE BOUCLIER D'ARGENT
 *  Chevalier en armure claire, masse d'armes et écu bleu. Son bouclier
 *  bloque automatiquement les coups pendant ses attaques (guard point)
 *  et renvoie les projectiles.
 *  Forces : défense, anti-projectiles, charges protégées.
 *  Faiblesses : lent, sauts lourds, peu de dégâts à distance.
 * ===================================================================== */

/* ---------- Armes : masse (main avant) et écu (main arrière) ---------- */
WEAPONS.maceShield = {
  dual: true, reach: 12, whiff: 'whoosh',
  draw(g, ax, f, J, front) {
    if (front) {
      const ext = J.wSpin > 0.5 ? 1 : 0;
      g.S(ax, -2, 8 + ext * 2, -0.5, 0.5, 'haft');                // manche
      const h0 = 8 + ext * 2;
      g.S(ax, h0, h0 + 5, -2.5, 2.5, 'maceHead');                 // tête à ailettes
      g.S(ax, h0 + 1, h0 + 4, -3.5, -2.5, 'armorShade');
      g.S(ax, h0 + 1, h0 + 4, 2.5, 3.5, 'armorShade');
      g.S(ax, h0, h0 + 5, -2.5, -2.5, 'armorLight');
      g.S(ax, h0 + 5, h0 + 6, -0.5, 0.5, 'armorShade');
      return;
    }
    // écu (vu de face) centré sur la main arrière
    const x = Math.round(ax.x), y = Math.round(ax.y);
    for (let dy = -8; dy <= 9; dy++) {
      const w = dy < 3 ? 6 : Math.max(1, Math.round(6 - (dy - 3) * 1.1));
      g.R(x - w, y + dy, w * 2, 1, 'shield');
      g.R(x - w, y + dy, 1, 1, 'shieldRim');
      g.R(x + w - 1, y + dy, 1, 1, 'shieldRim');
    }
    g.R(x - 6, y - 8, 12, 1, 'shieldRim');
    g.R(x - 1, y - 5, 3, 10, 'shieldEmblem');                     // tour héraldique
    g.R(x - 3, y - 6, 7, 2, 'shieldEmblem');
    g.R(x - 3, y - 7, 1, 1, 'shieldEmblem'); g.R(x + 3, y - 7, 1, 1, 'shieldEmblem');
    g.R(x - 5, y - 7, 1, 8, 'armorShade');
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  plume: {
    back(g, J, P, f) {
      const h = J.head, t = f.animTime || 0;
      for (let i = 0; i < 10; i++) {
        const x = h.x + 3 - i - Math.round(J.sway * i * 0.3), y = h.y - 4 + Math.round(i * 0.6 + Math.sin(t * 0.15 - i * 0.5) * (i * 0.12));
        g.R(x, y, 2, 2, i > 6 ? 'plumeShade' : 'plume');
      }
    },
  },
  greatHelm: {
    hidesEyes: true,
    head(g, J, P, f) {
      const h = J.head;
      g.R(h.x - 1, h.y - 2, h.w + 2, h.h + 2, 'armor');
      g.R(h.x - 1, h.y - 2, h.w + 2, 1, 'armorLight');
      g.R(h.x - 1, h.y - 2, 1, h.h + 2, 'armorShade');
      const vy = h.y + Math.round(h.h * 0.38);
      g.R(h.x + 2, vy, h.w, 2, 'armorDark');                     // fente de visière
      g.R(h.x + h.w - 3, vy, 2, 1, (f.animTime || 0) % 90 < 5 ? 'armorDark' : 'eyeGlow');
      for (let y = vy + 4; y < h.y + h.h - 1; y += 2) g.R(h.x + h.w - 2, y, 2, 1, 'armorDark');   // trous d'aération
      g.R(h.x + 3, h.y - 4, 3, 2, 'armorShade');                  // cimier
    },
  },
  tabard: {
    body(g, J) {
      for (let y = J.sh.y + 3; y <= J.hip.y; y++) {
        const r = J.row(y);
        g.R(r.x + 3, y, r.w - 5, 1, 'tabard');
      }
      const r = J.row(J.hip.y);
      for (let i = 0; i < 9; i++) g.R(r.x + 3, J.hip.y + i, r.w - 5, 1, i > 6 ? 'tabardShade' : 'tabard');
      const cx = J.sh.x + 1, cy = J.sh.y + Math.round((J.hip.y - J.sh.y) * 0.45);
      g.R(cx - 1, cy - 3, 2, 7, 'emblem');                         // tour brodée
      g.R(cx - 3, cy - 4, 6, 2, 'emblem');
      const rb = J.row(J.hip.y - 2);
      g.R(rb.x, J.hip.y - 2, rb.w, 2, 'belt');
    },
  },
  pauldron: {
    front(g, J) {
      g.R(J.sF.x - 4, J.sF.y - 3, 8, 4, 'armor');
      g.R(J.sF.x - 4, J.sF.y - 3, 8, 1, 'armorLight');
      g.R(J.sF.x - 4, J.sF.y + 1, 8, 1, 'armorShade');
    },
  },
  kneeCops: {
    legs(g, J) {
      g.R(J.kB.x - 2, J.kB.y - 2, 4, 4, 'armorShade');
      g.R(J.kF.x - 2, J.kF.y - 2, 5, 4, 'armorLight');
    },
  },
});

/* ---------- Projectile : colonne de lumière (super) ---------- */
PROJECTILE_ART.holyPillar = {
  telegraph(ctx, p) {
    if ((p.delay >> 1) % 2) R(ctx, p.x - 5, CONFIG.GROUND_Y - 1, 10, 1, '#fff3c4');
  },
  draw(ctx, p) {
    const grow = Math.min(1, p.t / 3), fade = Math.min(1, p.life / 6), h = Math.round(p.h * grow), base = CONFIG.GROUND_Y;
    ctx.globalAlpha = 0.85 * fade;
    R(ctx, p.x - p.w / 2, base - h, p.w, h, '#ffd166');
    R(ctx, p.x - p.w / 4, base - h, p.w / 2, h, '#fff8e0');
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) R(ctx, p.x + Math.sin(p.t + i * 2) * p.w * 0.4, base - ((p.t * 4 + i * 20) % h), 1, 2, '#ffffff');
  },
};

/* ---------- Effet de fond : lumière sacrée ---------- */
SCREEN_FX.holyLight = {
  draw(ctx, s) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 10, (s.max - s.t) / 14), 0, 1);
    ctx.fillStyle = `rgba(20,24,50,${0.45 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.25 * e;
    ctx.fillStyle = '#fff3c4';
    const cx = s.owner.x;
    ctx.beginPath();
    ctx.moveTo(cx - 10, 0); ctx.lineTo(cx + 10, 0); ctx.lineTo(cx + 40, H); ctx.lineTo(cx - 40, H);
    ctx.fill();
    for (let i = 0; i < 20; i++) R(ctx, (cx + Math.sin(i * 7 + s.t * 0.05) * 60 + W) % W, (i * 23 + s.t * 1.5) % H, 1, 3, '#ffffff');
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'aldric',
  name: 'ALDRIC',
  title: "LE BOUCLIER D'ARGENT",
  description: "Chevalier à la masse et à l'écu : il bloque en attaquant et renvoie les projectiles.",
  quotes: ['Mon serment tient. Ton attaque, non.', 'Relève-toi. Avec honneur.', 'Aucune flèche ne passe ce bouclier.'],
  stats: { maxHp: 120, walkSpeed: 1.15, jumpForce: 7.2, jumpSpeed: 1.6, defense: 1.15 },
  hitbox: { w: 22, h: 50 },
  body: { shoulderW: 20, hipW: 15, headW: 11, armT: 4, legT: 5 },
  locomotion: 'stomp',
  weapon: { type: 'maceShield' },
  parts: ['plume', 'tabard', 'kneeCops', 'greatHelm', 'pauldron'],
  palette: {
    skin: '#c8ced8', skinShade: '#8a92a6', mouth: '#5a6278', eyeGlow: '#9fdcff',
    armor: '#c8ced8', armorLight: '#ffffff', armorShade: '#8a92a6', armorDark: '#3a4052',
    top: '#c8ced8', topShade: '#8a92a6', sleeve: '#a8b0c0', sleeveShade: '#7a8296',
    tabard: '#2b5aa8', tabardShade: '#1c3d75', emblem: '#ffd166', belt: '#5a3a22',
    pants: '#a8b0c0', pantsShade: '#7a8296', shoes: '#8a92a6', shoesShade: '#5a6278',
    glove: '#8a92a6', gloveShade: '#5a6278', plume: '#4cc9f0', plumeShade: '#2a8ab0',
    haft: '#6a4a2a', maceHead: '#c8ced8', shield: '#e8ecf4', shieldRim: '#d4a73a', shieldEmblem: '#2b5aa8',
    accent: '#9fdcff', slash: '#ffffff', slashEdge: '#9fdcff',
  },
  altPalette: {
    tabard: '#a82a33', tabardShade: '#7a1626', shieldEmblem: '#a82a33', plume: '#ffd166', plumeShade: '#c9a227',
    armor: '#d8c08a', armorLight: '#fff3c4', armorShade: '#a08a5a', top: '#d8c08a', topShade: '#a08a5a', maceHead: '#d8c08a',
    accent: '#ffd166', slashEdge: '#ffd166',
  },
  stance: {
    idle:   { hand: [6, 7], hand2: [12, 1], wSpin: 1 },
    walk:   { hand: [6, 8], hand2: [12, 1], wSpin: 1 },
    guard:  { hand: [3, 4], hand2: [10, -4], wSpin: 1, lean: -1 },
    crouch: { hand: [7, 5], hand2: [10, 0], wSpin: 1 },
    jump:   { hand: [5, -2], hand2: [8, 0], wSpin: 1 },
    win:    { hand: [3, -14], hand2: [8, 3], wSpin: 1 },
    lose:   { hand: [2, 11], hand2: [4, 8], crouch: 6, lean: 3 },
    hurt:   { hand: [-3, 6], hand2: [-2, 4] },
  },
  attacks: {
    punch: { damage: 7, startup: 6, active: 3, recovery: 12, hitbox: { x: 6, y: -52, w: 24, h: 38 },
      knockback: 2.6, hitstun: 17, blockstun: 12, fx: ['arc'], arcWidth: 5, hitSfx: 'hitH', name: 'MASSE',
      anim: { windup: { hand: [-4, -8], ang: -130, wSpin: 1 }, strike: { hand: [13, 4], ang: 30, wSpin: 1, lean: 3, footF: [8, 0] } } },
    kick:  { damage: 7, startup: 6, active: 4, recovery: 12, hitbox: { x: 6, y: -46, w: 18, h: 32 }, guardPoint: { from: 1, to: 9 },
      knockback: 3.5, hitstun: 16, blockstun: 12, sfx: 'clink', hitSfx: 'clink', name: 'COUP DE BOUCLIER',
      anim: { windup: { hand2: [2, -2], lean: -2 }, strike: { hand2: [16, -4], lean: 4, footF: [9, 0] } } },
  },
  airAttacks: {
    punch: { damage: 7, startup: 6, active: 5, recovery: 10, hitbox: { x: 2, y: -30, w: 24, h: 28 }, knockback: 2.6, hitstun: 17,
      blockstun: 11, fx: ['arc'], arcWidth: 4,
      anim: { windup: { hand: [-2, -12], ang: -100, wSpin: 1 }, strike: { hand: [10, 8], ang: 60, wSpin: 1, lean: 3 } } },
    kick: { damage: 6, startup: 5, active: 7, recovery: 9, hitbox: { x: 2, y: -34, w: 18, h: 30 }, guardPoint: { from: 1, to: 12 },
      knockback: 2.6, hitstun: 15, blockstun: 10, sfx: 'clink',
      anim: { windup: { hand2: [4, 0] }, strike: { hand2: [14, 4], lean: 3, footF: [4, -10] } } },
  },
  combos: [
    { name: 'CHARGE AU BOUCLIER', sequence: ['back', 'forward', 'kick'], window: 22, move: 'kick', damageMultiplier: 1.4,
      overrides: { startup: 6, active: 12, recovery: 18, dash: 4.5, guardPoint: { from: 1, to: 18 }, hitbox: { x: 4, y: -46, w: 20, h: 40 },
        knockback: 5, hitstun: 22, sfx: 'clink',
        anim: { windup: { hand2: [4, -2], crouch: 3, lean: -2 }, strike: { hand2: [15, -4], lean: 6, footF: [10, 0], footB: [-9, 0] } } } },
    { name: 'JUGEMENT', sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 2.0,
      overrides: { startup: 13, active: 4, recovery: 20, level: 'high', hitbox: { x: 4, y: -58, w: 28, h: 58 }, knockdown: true,
        knockback: 2.5, hitstun: 26, shake: 5, fx: ['arc', 'ring'], arcWidth: 7,
        anim: { windup: { hand: [-2, -16], ang: -120, wSpin: 1, lean: -3 }, strike: { hand: [14, 8], ang: 60, wSpin: 1, lean: 5, crouch: 4 } } } },
    { name: 'REMPART', sequence: ['down', 'down', 'punch'], window: 24, move: 'punch', damageMultiplier: 1,
      overrides: { startup: 3, active: 30, recovery: 14, hitbox: null, reflect: { from: 2, to: 33 }, guardPoint: { from: 2, to: 33 }, sfx: 'clink',
        anim: { windup: { hand2: [9, -4], crouch: 3 }, strike: { hand2: [10, -5], crouch: 3 } } } },
  ],
  super: {
    name: "SERMENT D'ARGENT", move: 'punch', damageMultiplier: 1,
    // 1) lève la masse vers le ciel (armure)
    overrides: { startup: 6, active: 18, recovery: 0, armor: 3, hitbox: null, screenFx: 'holyLight', screenFxTime: 60, sfx: 'charged',
      anim: { windup: { hand: [3, -16], ang: -90, wSpin: 1 }, strike: { hand: [3, -18], ang: -92, wSpin: 1, lean: -2 } },
      // 2) frappe le sol : colonnes de lumière
      followUp: { damage: 7, startup: 8, active: 4, recovery: 30, hitbox: { x: 0, y: -60, w: 34, h: 60 }, launch: -6, knockback: 3,
        hitstun: 32, shake: 9, fx: ['ring'], hitSfx: 'hitH', sfx: 'heavy',
        projectile: { shape: 'holyPillar', pattern: 'erupt', target: 'line', count: 4, start: 34, step: 24, delay: 4, interval: 5,
                      w: 14, h: 70, life: 20, activeFrom: 2 },
        anim: { windup: { hand: [3, -18], ang: -92, wSpin: 1 }, strike: { hand: [14, 10], ang: 70, wSpin: 1, lean: 6, crouch: 6 } } } },
  },
});
