'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  CAPRICORN — CYBER-CYBORG  (refonte 1.2)
 *  Corps cybernétique noir, crête synthétique rose, visière verte et
 *  yeux HUD cyan. Des lames repliées dans les avant-bras se déploient
 *  pour frapper ; des propulseurs aux talons le font glisser au sol.
 *  Style : très rapide, fragile, mixups par téléportation dans sa super.
 * ===================================================================== */

/* ---------- Arme : lames d'avant-bras (repliées / déployées) ---------- */
WEAPONS.capricornBlades = {
  dual: true, reach: 14, whiff: 'servo',
  draw(g, ax, f, J, front) {
    g.S(ax, -9, -1, -1.5, 1.5, front ? 'housing' : 'housingShade');      // boîtier sur l'avant-bras
    g.S(ax, -8, -2, -1.5, -1.5, 'neonGreen');
    if (J.wSpin > 0.5) {                                                  // lame déployée, pointe recourbée
      g.S(ax, 0, 9, -2, -1, 'blade');
      g.S(ax, 0, 9, -2, -2, 'bladeCore');
      for (let i = 0; i <= 5; i++) g.S(ax, 9 + i, 10 + i, -1 + i * 0.6, i * 0.6, 'blade');
      g.S(ax, 14, 15, 2, 3, 'bladeCore');
      if (front && !g.tint && J.phase === 'active') g.S(ax, 4, 12, -3, -3, '#ffffff');
    } else {
      g.S(ax, -10, 0, -2.5, -2, 'blade');                                // lame repliée le long du bras
    }
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  capricornSpine: {
    back(g, J, P, f) {
      const pulse = Math.floor((f.animTime || 0) / 6) % 4;
      for (let i = 0; i < 5; i++) {
        const y = J.sh.y + 2 + i * 3, r = J.row(y);
        g.R(r.x - 1, y, 2, 2, i === pulse ? 'neonPink' : 'housingShade');
      }
    },
  },
  capricornArmor: {
    body(g, J) {
      // plaques segmentées + lignes de circuit
      for (let y = J.sh.y + 3; y < J.hip.y - 2; y += 4) { const r = J.row(y); g.R(r.x + 1, y, r.w - 2, 1, 'housingShade'); }
      const r0 = J.row(J.sh.y + 2);
      g.R(r0.x + r0.w - 4, J.sh.y + 2, 1, J.hip.y - J.sh.y - 4, 'neonCyan');
      g.R(r0.x + 2, J.sh.y + 5, 1, 6, 'neonGreen');
      g.R(r0.x + 2, J.sh.y + 11, 4, 1, 'neonGreen');
      // noyau lumineux à la ceinture
      const rc = J.row(J.hip.y - 2);
      g.R(rc.x + 1, J.hip.y - 3, rc.w - 2, 3, 'housing');
      g.R(rc.x + Math.round(rc.w / 2) - 1, J.hip.y - 3, 3, 3, 'neonGreen');
      g.R(rc.x + Math.round(rc.w / 2), J.hip.y - 2, 1, 1, '#ffffff');
      // épaulière avant anguleuse
      g.R(J.sF.x - 3, J.sF.y - 3, 7, 3, 'housing');
      g.R(J.sF.x - 3, J.sF.y - 3, 7, 1, 'neonGreen');
      g.R(J.sF.x + 3, J.sF.y - 2, 2, 2, 'housing');
    },
  },
  capricornLegs: {
    legs(g, J, P, f) {
      for (const [k, ft, front] of [[J.kB, J.fB, false], [J.kF, J.fF, true]]) {
        g.R(k.x - 1, k.y - 1, 3, 3, front ? 'neonPink' : 'housingShade');        // articulation du genou
        g.R(ft.x - 3, ft.y - 4, 2, 2, 'housing');                                  // propulseur de talon
        const moving = Math.abs(f.vx || 0) > 0.6 || f.state === 'dash' || f.state === 'jump';
        if (moving && !g.tint) {
          const fl = 2 + ((f.animTime || 0) + (front ? 1 : 0)) % 3;
          g.R(ft.x - 4 - fl, ft.y - 3, fl, 1, 'neonCyan');
          g.R(ft.x - 3 - fl, ft.y - 4, fl - 1, 1, '#ffffff');
        }
      }
    },
  },
  capricornHelmet: {
    hidesEyes: true,
    head(g, J, P, f) {
      const h = J.head, t = f.animTime || 0;
      // crête synthétique rose, rabattue vers l'arrière
      g.R(h.x - 1, h.y - 3, h.w - 2, 3, 'crest');
      g.R(h.x - 4, h.y - 4, 5, 3, 'crest');
      g.R(h.x - 7, h.y - 3, 4, 2, 'crestTip');
      g.R(h.x + 1, h.y - 6, 4, 3, 'crest');
      g.R(h.x - 2, h.y - 6, 3, 2, 'crestTip');
      g.R(h.x + 4, h.y - 5, 3, 2, 'crest');
      // casque noir
      g.R(h.x - 1, h.y - 1, h.w + 1, h.h + 1, 'housing');
      g.R(h.x - 1, h.y - 1, h.w + 1, 1, 'housingLight');
      // visière verte + yeux HUD
      const vy = h.y + Math.round(h.h * 0.32);
      g.R(h.x + 1, vy, h.w + 1, 3, 'visor');
      g.R(h.x + 1, vy + 2, h.w + 1, 1, 'visorShade');
      const blink = t % 120 < 4;
      if (!blink) { g.R(h.x + h.w - 3, vy + 1, 2, 1, 'eye'); g.R(h.x + h.w - 6, vy + 1, 1, 1, 'eye'); }
      // mâchoire avec évents roses
      g.R(h.x + h.w - 4, h.y + h.h - 3, 5, 3, 'housing');
      g.R(h.x + h.w - 3, h.y + h.h - 2, 1, 1, 'neonPink');
      g.R(h.x + h.w - 1, h.y + h.h - 2, 1, 1, 'neonPink');
      // antenne
      g.R(h.x + 1, h.y - 1, 1, 1, 'neonCyan');
    },
  },
});

/* ---------- Projectile : drone traqueur ---------- */
PROJECTILE_ART.drone = function (ctx, p) {
  const x = Math.round(p.x), y = Math.round(p.y), P = p.owner.palette, blink = (p.t >> 2) % 2;
  R(ctx, x - 4, y - 2, 8, 4, P.housing);
  R(ctx, x - 3, y - 3, 6, 1, P.housingLight);
  R(ctx, x - 6, y - 4 + ((p.t >> 1) % 2), 4, 1, P.neonCyan);      // hélices
  R(ctx, x + 2, y - 4 + ((p.t >> 1 + 1) % 2), 4, 1, P.neonCyan);
  R(ctx, x + (p.dir > 0 ? 2 : -3), y - 1, 2, 2, blink ? P.neonPink : '#ffffff');
  ctx.globalAlpha = 0.5;
  R(ctx, x - p.dir * 8, y, 3, 1, P.neonGreen);
  ctx.globalAlpha = 1;
};

/* ---------- Effet de fond : surcadence (glitch numérique) ---------- */
SCREEN_FX.cyberGlitch = {
  init(s) { s.bars = Array.from({ length: 10 }, () => ({ y: Math.random() * 216, h: 2 + Math.random() * 8, o: Math.random() * 20 - 10 })); },
  draw(ctx, s, game) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, e = clamp(Math.min(s.t / 3, (s.max - s.t) / 8), 0, 1), P = s.owner.palette;
    ctx.fillStyle = `rgba(0,10,8,${0.45 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.25 * e;
    ctx.fillStyle = P.neonGreen;
    for (let y = game.globalTime % 4; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 0.35 * e;
    for (const b of s.bars) {
      if ((s.t + b.o) % 9 < 3) {
        ctx.fillStyle = b.o > 0 ? P.neonPink : P.neonCyan;
        ctx.fillRect(0, Math.round((b.y + s.t * 3) % H), W, Math.round(b.h));
      }
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'capricorn',
  name: 'CAPRICORN',
  title: 'CYBER-CYBORG',
  description: 'Cyborg noir aux néons : lames dans les avant-bras, propulseurs et drone traqueur.',
  quotes: ['Système en surchauffe.', 'Optimisation des cibles terminée.', 'Ta réaction : 340 ms. La mienne : 4.'],
  stats: { maxHp: 92, walkSpeed: 2.0, jumpForce: 8.8, jumpSpeed: 2.6, defense: 0.92 },
  hitbox: { w: 18, h: 46 },
  body: { shoulderW: 15, hipW: 11, headW: 11, armT: 3, legT: 4 },
  locomotion: 'skate',
  weapon: { type: 'capricornBlades' },
  parts: ['capricornSpine', 'capricornArmor', 'capricornLegs', 'capricornHelmet'],
  palette: {
    skin: '#101018', skinShade: '#06060a', eye: '#00f0ff', mouth: '#050508',
    top: '#14141c', topShade: '#08080c', sleeve: '#14141c', sleeveShade: '#08080c',
    housing: '#1c1c26', housingShade: '#0b0b10', housingLight: '#3a3a4c',
    crest: '#ff0055', crestTip: '#ff5599', visor: '#00ff87', visorShade: '#00b359',
    neonPink: '#ff0055', neonCyan: '#00f0ff', neonGreen: '#00ff87', neon: '#00ff87', neon2: '#ff0055',
    blade: '#00ff87', bladeCore: '#d8fff0',
    pants: '#14141c', pantsShade: '#08080c', shoes: '#1c1c26', shoesShade: '#0b0b10',
    glove: '#1c1c26', gloveShade: '#0b0b10', belt: '#1c1c26', buckle: '#00ff87',
    accent: '#00ff87', slash: '#ffffff', slashEdge: '#00ff87',
  },
  altPalette: {
    crest: '#ffb703', crestTip: '#ffd166', visor: '#7a5cff', visorShade: '#5a3cd0',
    neonPink: '#ffb703', neonGreen: '#7a5cff', neon: '#7a5cff', neon2: '#ffb703', blade: '#7a5cff', bladeCore: '#e8e0ff',
    buckle: '#7a5cff', accent: '#ffb703', slashEdge: '#7a5cff',
  },
  stance: {
    idle:   { hand: [7, 3], hand2: [8, 5], lean: 2, crouch: 2 },
    walk:   { hand: [7, 4], hand2: [5, 6], lean: 3 },
    guard:  { hand: [4, -5], hand2: [6, -4], lean: -1, wSpin: 1 },
    crouch: { hand: [7, 1], hand2: [8, 3] },
    jump:   { hand: [6, -3], hand2: [-3, 2], lean: 2 },
    fall:   { hand: [6, 2], hand2: [-2, 6], footF: [6, -2], footB: [-4, 0] },
    land:   { hand: [8, 6], hand2: [9, 8] },
    win:    { hand: [3, -12], hand2: [9, 2], wSpin: 1, lean: -1 },
    lose:   { hand: [1, 12], hand2: [0, 12], lean: 3, crouch: 6 },
    hurt:   { hand: [-3, 6], hand2: [-4, 5] },
  },
  attacks: {
    punch: { damage: 5, startup: 3, active: 3, recovery: 7, hitbox: { x: 6, y: -36, w: 22, h: 9 },
      knockback: 1.6, hitstun: 15, blockstun: 9, hitFx: 'cuts', sfx: 'servo',
      anim: { windup: { hand: [2, 2], wSpin: 1 }, strike: { hand: [14, -1], wSpin: 1, lean: 3, footF: [7, 0] } } },
    kick:  { damage: 8, startup: 6, active: 4, recovery: 12, hitbox: { x: 6, y: -30, w: 22, h: 12 },
      knockback: 2.6, hitstun: 17, blockstun: 11, fx: ['swoosh'],
      anim: { windup: { footF: [4, -12], lean: -2 }, strike: { footF: [18, -20], footB: [-3, 0], lean: -4 } } },
  },
  airAttacks: {
    punch: { damage: 6, startup: 4, active: 5, recovery: 8, hitbox: { x: 2, y: -30, w: 24, h: 22 }, knockback: 2, hitstun: 16,
      blockstun: 10, hitFx: 'cuts', sfx: 'servo',
      anim: { windup: { hand: [0, -8], wSpin: 1 }, strike: { hand: [12, 8], hand2: [10, 10], wSpin: 1, lean: 4 } } },
    kick: { damage: 7, startup: 5, active: 6, recovery: 9, hitbox: { x: -2, y: -16, w: 20, h: 18 }, knockback: 2.4, hitstun: 16,
      blockstun: 10,
      anim: { windup: { footF: [2, -10] }, strike: { footF: [10, 4], footB: [-4, -6], lean: 2 } } },
  },
  combos: [
    { name: 'SURCADENCE', sequence: ['back', 'forward', 'punch'], window: 20, move: 'punch', damageMultiplier: 1.3,
      overrides: { startup: 5, active: 12, recovery: 15, dash: 6.6, hits: 2, hitEvery: 6, afterimages: true,
        screenFx: 'cyberGlitch', screenFxTime: 12, hitbox: { x: 2, y: -40, w: 24, h: 28 }, knockback: 3.4, hitstun: 26,
        hitFx: 'cuts', sfx: 'servo', trail: 'sparks',
        anim: { windup: { crouch: 5, lean: -2, hand: [-2, 3], hand2: [-3, 4], wSpin: 1 },
                strike: { lean: 6, hand: [15, -1], hand2: [12, 2], wSpin: 1, footF: [10, 0], footB: [-10, -2], crouch: 2 } } } },
    { name: 'TRANCHE NÉON', sequence: ['down', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 1.8,
      overrides: { startup: 5, active: 6, recovery: 16, lift: -4.5, hitbox: { x: 0, y: -60, w: 26, h: 44 },
        knockback: 1.8, launch: -6.5, hitstun: 28, fx: ['arc'], arcWidth: 6, hitFx: 'cuts', sfx: 'slash',
        anim: { windup: { hand: [6, 8], ang: 60, wSpin: 1, crouch: 6 },
                strike: { hand: [6, -16], ang: -90, wSpin: 1, lean: 2, footF: [4, -6], crouch: 0 } } } },
    { name: 'DRONE TRAQUEUR', sequence: ['down', 'back', 'kick'], window: 24, move: 'kick', damageMultiplier: 0.9,
      overrides: { startup: 9, active: 2, recovery: 16, hitbox: null, sfx: 'servo', knockback: 1.6, hitstun: 18,
        projectile: { shape: 'drone', speed: 2.6, homing: 0.035, w: 10, h: 8, y: -38, life: 150 },
        anim: { windup: { hand: [-2, -6], hand2: [-3, -5] }, strike: { hand: [10, -10], hand2: [4, -6], lean: 1 } } } },
  ],
  super: {
    name: 'EXÉCUTION OVERCLOCK', move: 'punch', damageMultiplier: 1,
    // 1) préparation : surcadence, invulnérable
    overrides: { startup: 8, active: 6, recovery: 0, hitbox: null, invuln: { from: 1, to: 14 }, screenFx: 'cyberGlitch', screenFxTime: 60,
      sfx: 'servo', fx: ['lightning'],
      anim: { windup: { crouch: 6, hand: [-2, 4], hand2: [-3, 5], wSpin: 1 }, strike: { crouch: 6, hand: [-2, 2], hand2: [-3, 3], wSpin: 1 } },
      // 2) apparaît dans le dos et tranche
      followUp: { damage: 7, startup: 2, active: 5, recovery: 2, whiffRecovery: 22, teleport: { to: 'behind', dist: 20 }, hitbox: { x: 2, y: -44, w: 26, h: 34 },
        knockback: 0.5, hitstun: 30, hitFx: 'cuts', sfx: 'slash', afterimages: true,
        anim: { windup: { hand: [0, -6], wSpin: 1 }, strike: { hand: [14, 4], wSpin: 1, lean: 4 } },
        // 3) réapparaît devant (seulement si la tranche a touché)
        followUp: { requireHit: true, damage: 7, startup: 2, active: 5, recovery: 2, whiffRecovery: 20, teleport: { to: 'front', dist: 20 },
          hitbox: { x: 2, y: -44, w: 26, h: 34 }, knockback: 0.5, hitstun: 30, hitFx: 'cuts', sfx: 'slash', afterimages: true,
          anim: { windup: { hand: [12, 6], wSpin: 1 }, strike: { hand: [2, -12], wSpin: 1, lean: 2 } },
          // 4) conclusion : tranche en X qui éjecte
          followUp: { requireHit: true, damage: 12, startup: 4, active: 4, recovery: 26, hitbox: { x: 0, y: -52, w: 30, h: 44 },
            knockback: 4.5, launch: -7, hitstun: 36, hitFx: 'cuts', fx: ['ring'], sfx: 'slash', shake: 6,
            anim: { windup: { hand: [-2, -10], hand2: [-1, 8], wSpin: 1, crouch: 3 },
                    strike: { hand: [15, 6], hand2: [14, -8], wSpin: 1, lean: 5 } } } } } },
  },
});
