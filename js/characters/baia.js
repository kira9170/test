'use strict';
// [1.2] NOUVEAU — personnage original ajouté en 1.2 (voir CHANGELOG_1.2.md)
/* =====================================================================
 *  BAÏA — LA CAPOEIRISTE
 *  Acrobate aux pieds nus. Toujours en mouvement (ginga), elle frappe
 *  avec des coups de pied circulaires, passe sous les projectiles en
 *  roue (aú) et renverse l'adversaire au sol (rasteira).
 *  Forces : portée des jambes, mobilité, esquive des projectiles.
 *  Faiblesses : peu de PV, coups de poing faibles, pas de projectile.
 * ===================================================================== */

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  afroPuff: {
    head(g, J, P, f) {
      const h = J.head, ctx = g.ctx;
      ctx.fillStyle = g.col('hair');
      for (let dy = -7; dy <= 7; dy++) {                   // gros chignon rond à l'arrière du crâne
        const hw = Math.round(Math.sqrt(49 - dy * dy));
        ctx.fillRect(Math.round(h.x + 1 - hw), Math.round(h.y - 2 + dy), hw * 2, 1);
      }
      g.R(h.x - 1, h.y - 1, h.w + 1, 3, 'hair');
      g.R(h.x - 1, h.y, 3, h.h - 3, 'hair');
      g.R(h.x - 3, h.y - 6, 3, 2, 'hairLight');
      g.R(h.x + 1, h.y - 8, 3, 1, 'hairLight');
      g.R(h.x, h.y + 2, h.w - 1, 1, 'headband');           // bandeau
      g.R(h.x + 2, h.y + Math.round(h.h * 0.6), 1, 2, 'gold');   // boucle d'oreille
    },
  },
  cropTop: {
    body(g, J) {
      const mid = J.sh.y + Math.round((J.hip.y - J.sh.y) * 0.55);
      for (let y = mid; y <= J.hip.y - 2; y++) {           // ventre découvert
        const r = J.row(y);
        g.R(r.x + 1, y, r.w - 1, 1, 'skin');
        g.R(r.x, y, 1, 1, 'skinShade');
      }
      const r = J.row(mid - 1);
      g.R(r.x, mid - 1, r.w, 1, 'topShade');
      g.R(r.x + r.w - 3, J.sh.y + 1, 1, mid - J.sh.y - 2, 'gold');
    },
  },
  corda: {
    body(g, J, P, f) {
      const r = J.row(J.hip.y - 2), t = f.animTime || 0;
      g.R(r.x - 1, J.hip.y - 2, r.w + 1, 2, 'cord');
      const kx = r.x + r.w - 3, ky = J.hip.y - 1;          // nœud + glands qui se balancent
      g.R(kx - 1, ky - 1, 3, 3, 'cord');
      const sw = Math.round(Math.sin(t * 0.15) * 1.5 + (f.vx || 0) * -f.facing * 0.8);
      g.R(kx + sw, ky + 2, 1, 6, 'cord');
      g.R(kx + 2 + sw, ky + 2, 1, 5, 'cord');
      g.R(kx + sw, ky + 8, 1, 1, 'cordTip');
      g.R(kx + 2 + sw, ky + 7, 1, 1, 'cordTip');
    },
  },
  wristbands: {
    front(g, J) {
      const x = J.eF.x + (J.hF.x - J.eF.x) * 0.7, y = J.eF.y + (J.hF.y - J.eF.y) * 0.7;
      g.R(x - 1, y - 1, 3, 3, 'headband');
    },
  },
});

/* ---------- Effet de fond : la roda ---------- */
SCREEN_FX.roda = {
  draw(ctx, s, game) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 8, (s.max - s.t) / 12), 0, 1);
    const cx = s.owner.x, cy = s.owner.y - 30;
    ctx.fillStyle = `rgba(70,25,0,${0.5 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.22 * e;
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 12; i++) {                          // rayons de soleil qui tournent
      const a = i / 12 * Math.PI * 2 + s.t * 0.01;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - 0.08) * 400, cy + Math.sin(a - 0.08) * 400);
      ctx.lineTo(cx + Math.cos(a + 0.08) * 400, cy + Math.sin(a + 0.08) * 400);
      ctx.fill();
    }
    ctx.globalAlpha = e;
    const beat = (s.t % 15) / 15;                           // pulsation au rythme du berimbau
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * Math.PI * 2, r = 30 + beat * 40;
      R(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5 + 24, 2, 1, `rgba(255,220,140,${1 - beat})`);
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'baia',
  name: 'BAÏA',
  title: 'LA CAPOEIRISTE',
  description: 'Acrobate insaisissable : coups de pied circulaires, roue et balayages.',
  quotes: ['Tu as regardé mes mains. Erreur.', 'La roda ne s’arrête jamais.', 'Encore une danse ?'],
  stats: { maxHp: 100, walkSpeed: 1.85, jumpForce: 9.0, jumpSpeed: 2.6, defense: 0.96 },
  hitbox: { w: 16, h: 46 },
  body: { shoulderW: 14, hipW: 12, headW: 10, armT: 3, legT: 4, sleeves: 'short' },
  locomotion: 'ginga',
  weapon: null,
  parts: ['cropTop', 'corda', 'wristbands', 'afroPuff'],
  palette: {
    skin: '#7a4a2e', skinShade: '#5a3420', eye: '#1a1210', brow: '#1c120c', mouth: '#4a2018',
    hair: '#1c120c', hairLight: '#3a2418', headband: '#ffd166', gold: '#ffd166',
    top: '#2ec4b6', topShade: '#1f8a80', sleeve: '#7a4a2e', sleeveShade: '#5a3420',
    pants: '#f4f1ea', pantsShade: '#c8c2b4', shoes: '#7a4a2e', shoesShade: '#5a3420',
    glove: '#7a4a2e', gloveShade: '#5a3420', cord: '#ffd166', cordTip: '#e09b2d',
    accent: '#ffd166', slash: '#ffffff', slashEdge: '#ffd166', neon: '#ffd166', neon2: '#2ec4b6',
  },
  altPalette: {
    top: '#e63946', topShade: '#a82a33', cord: '#4cc9f0', cordTip: '#2a8ab0', headband: '#4cc9f0',
    pants: '#2a2238', pantsShade: '#1a1426', accent: '#4cc9f0', slashEdge: '#4cc9f0',
  },
  stance: {
    idle:   { guardHand: [3, -6], lowHand: [7, 5] },
    guard:  { hand: [3, -6], hand2: [5, -4], lean: -1, crouch: 3 },
    crouch: { hand: [6, 3], hand2: [7, 5] },
    jump:   { hand: [4, -6], hand2: [-3, -4], footF: [6, -9], footB: [-3, -6] },
    fall:   { hand: [5, -4], hand2: [-4, -2] },
    win:    { hand: [2, -14], hand2: [3, -13], lean: -1 },
    lose:   { hand: [2, 11], hand2: [0, 12], crouch: 8, lean: 4 },
    hurt:   { hand: [-3, 5], hand2: [-4, 4] },
  },
  attacks: {
    punch: { damage: 4, startup: 3, active: 3, recovery: 6, hitbox: { x: 6, y: -36, w: 16, h: 9 },
      knockback: 1.4, hitstun: 14, blockstun: 8,
      anim: { windup: { hand: [0, -2] }, strike: { hand: [13, -2], lean: 2, footF: [6, 0] } } },
    kick:  { damage: 8, startup: 7, active: 5, recovery: 14, hitbox: { x: 2, y: -46, w: 28, h: 24 },
      knockback: 2.6, hitstun: 18, blockstun: 11, fx: ['swoosh'], name: 'MEIA LUA',
      anim: { windup: { footF: [-4, -10], lean: -2, hand: [-2, 2], hand2: [-3, 4] },
              strike: { footF: [15, -30], footB: [-3, 0], lean: -6, hand: [-2, 6], hand2: [-4, 8] } } },
  },
  airAttacks: {
    punch: { name: 'JOELHADA', damage: 6, startup: 4, active: 6, recovery: 8, hitbox: { x: 2, y: -36, w: 18, h: 18 },
      knockback: 2, hitstun: 16, blockstun: 10,
      anim: { windup: { footF: [2, -8] }, strike: { footF: [7, -20], footB: [-4, -4], lean: 4, hand: [2, -6] } } },
    kick: { name: 'ARMADA', damage: 7, startup: 5, active: 6, recovery: 9, hitbox: { x: -4, y: -32, w: 30, h: 18 },
      knockback: 2.4, hitstun: 16, blockstun: 10, fx: ['swoosh'],
      anim: { spin: true, windup: { footF: [2, -10] }, strike: { footF: [16, -16], lean: -3 } } },
  },
  combos: [
    { name: 'AÚ', sequence: ['down', 'back', 'kick'], window: 24, move: 'kick', damageMultiplier: 0.9,
      overrides: { startup: 4, active: 14, recovery: 12, dash: 3.4, projInvuln: { from: 1, to: 18 }, lowProfile: true,
        hitbox: { x: 0, y: -30, w: 20, h: 24 }, knockback: 2.5, hitstun: 20, fx: [], sfx: 'whoosh',
        anim: { linear: true, windup: { crouch: 6, hand: [6, 10], hand2: [4, 10] },
                strike: { tilt: 360, footF: [6, -26], footB: [-6, -24], hand: [4, 12], hand2: [-4, 12], crouch: 4 } } } },
    { name: 'QUEIXADA', sequence: ['down', 'forward', 'kick'], window: 22, move: 'kick', damageMultiplier: 1.6,
      overrides: { startup: 9, active: 5, recovery: 18, hitbox: { x: 0, y: -54, w: 30, h: 32 }, launch: -6, knockback: 2, hitstun: 28,
        fx: ['swoosh'],
        anim: { spin: 4, windup: { footF: [-6, -4], lean: -4, crouch: 4 },
                strike: { footF: [12, -34], footB: [-2, 0], lean: -7, tilt: -15, crouch: 0 } } } },
    { name: 'RASTEIRA', sequence: ['down', 'down', 'kick'], window: 24, move: 'kick', damageMultiplier: 1.0,
      overrides: { startup: 6, active: 5, recovery: 16, hitbox: { x: 2, y: -10, w: 30, h: 10 }, level: 'low', knockdown: true,
        lowProfile: true, knockback: 1.5, hitstun: 24, fx: [],
        anim: { windup: { crouch: 14, footF: [6, -1], hand: [2, 10], hand2: [-2, 12] },
                strike: { crouch: 16, footF: [24, -2], footB: [-4, 0], hand: [0, 12], hand2: [-4, 13], lean: -3 } } } },
  ],
  super: {
    name: 'RODA SOLAIRE', move: 'kick', damageMultiplier: 0.55,
    // 1) appui renversé : toupie de coups de pied
    overrides: { startup: 10, active: 30, recovery: 0, whiffRecovery: 24, hits: 6, hitEvery: 5, dash: 2.2, hitbox: { x: -6, y: -50, w: 36, h: 44 },
      screenFx: 'roda', screenFxTime: 50, sfx: 'twang', knockback: 1.5, hitstun: 30, trail: 'sparkle',
      anim: { spin: 3, windup: { crouch: 8, hand: [6, 10], hand2: [4, 10] },
              strike: { tilt: 180, footF: [13, -4], footB: [-13, -4], hand: [1, 14], hand2: [-1, 14], crouch: 0 } },
      // 2) conclusion : martelo qui éjecte (seulement si la toupie a touché)
      followUp: { requireHit: true, damage: 12, startup: 4, active: 4, recovery: 26, hitbox: { x: 2, y: -56, w: 28, h: 34 },
        launch: -7, knockback: 3.5, hitstun: 34, fx: ['swoosh'], shake: 6, hitSfx: 'hitH',
        anim: { windup: { footF: [-4, -6], lean: -3, crouch: 4 }, strike: { footF: [16, -34], footB: [-3, 0], lean: -7, crouch: 0 } } } },
  },
});
