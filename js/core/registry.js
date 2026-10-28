'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  REGISTRES
 *  Les fichiers de js/characters/ et js/stages/ viennent s'inscrire ici.
 *  Un personnage peut aussi ajouter ses propres armes (WEAPONS), pièces
 *  de costume (PARTS), effets (FX, SCREEN_FX) et projectiles (PROJECTILE_ART).
 * ===================================================================== */
const ROSTER = [];
const STAGES = [];
const WEAPONS = {};
const PARTS = {};
const FX = {};
const SCREEN_FX = {};
const PROJECTILE_ART = {};

/* Valeurs par défaut d'une attaque */
const DEFAULT_ATTACK = {
  damage: 5, startup: 4, active: 3, recovery: 8,
  hitbox: { x: 6, y: -36, w: 14, h: 8 },
  knockback: 2, hitstun: 14, blockstun: 9,
  level: 'mid',          // 'mid' (garde debout ou basse) | 'low' (garde basse) | 'high' (garde debout)
};

/* Projection universelle (Poing + Pied à bout portant) */
const DEFAULT_THROW = {
  name: 'PROJECTION', grab: true, damage: 10, startup: 4, active: 3, recovery: 24,
  hitbox: { x: 2, y: -40, w: 14, h: 36 }, knockback: 3.2, launch: -6.5, hitstun: 34, blockstun: 0,
  throwBehind: true, techable: true, sfx: 'whoosh', hitSfx: 'throw', level: 'mid',
  anim: { windup: { hand: [9, 2], hand2: [9, 4], grip: 1, lean: 2, sheathed: 1 },
          strike: { hand: [2, -10], hand2: [0, -8], grip: 1, lean: -3, sheathed: 1 } },
};

/* Normalise la définition d'un personnage (valeurs par défaut, proportions du corps) */
function defineCharacter(def) {
  def.stats = Object.assign({ maxHp: 100, walkSpeed: 1.5, jumpForce: 8, jumpSpeed: 2, defense: 1 }, def.stats);
  def.hitbox = Object.assign({ w: 20, h: 46 }, def.hitbox);
  const H = def.hitbox.h, W = def.hitbox.w;
  const B = def.body = Object.assign({ shoulderW: Math.round(W * 0.85), hipW: Math.round(W * 0.7),
    headW: Math.max(8, Math.round(W * 0.6)), armT: 3, legT: 4, neck: 2, footLift: 0, sleeves: 'long' }, def.body);
  B.hipY = -Math.round(H * 0.42);
  B.torso = Math.round(H * 0.32);
  B.headH = H + B.hipY - B.torso - B.neck;
  B.leg = (-B.hipY - B.footLift) / 2 + 0.4;
  B.arm = Math.round(H * 0.17);

  const P = def.palette;
  def.palette = Object.assign({ sleeve: P.top, sleeveShade: P.topShade, glove: P.skin, gloveShade: P.skinShade,
    shoesShade: P.shoes, eye: '#111111', eyeWhite: '#ffffff', brow: P.hair || '#2a1a12', mouth: '#5a2a2a',
    slash: '#ffffff', slashEdge: P.accent || '#ffd23f', accent: '#ffd23f' }, P);

  def.stance = def.stance || {};
  def.stance.idle = def.stance.idle || {};
  def.parts = def.parts || [];
  def.locomotion = def.locomotion || 'step';
  def.quotes = def.quotes || ['...'];
  def.attacks = def.attacks || {};
  for (const k of ['punch', 'kick']) def.attacks[k] = Object.assign({}, DEFAULT_ATTACK, def.attacks[k]);
  // Attaques aériennes dédiées (optionnelles) : sinon les attaques au sol sont réutilisées en l'air
  if (def.airAttacks) {
    for (const k of ['punch', 'kick']) {
      if (def.airAttacks[k]) def.airAttacks[k] = Object.assign({}, DEFAULT_ATTACK, { level: 'high' }, def.airAttacks[k]);
    }
  }

  // Étapes enchaînées (followUp) : chaque étape est une attaque complète
  const normFollow = atk => {
    let f = atk && atk.followUp;
    if (f && !f._ready) {
      f = atk.followUp = Object.assign({}, DEFAULT_ATTACK, f, { _ready: true });
      normFollow(f);
    }
  };
  const normCombo = c => {
    c = Object.assign({ window: 24, damageMultiplier: 1.5, move: 'punch', overrides: {} }, c);
    const ctr = c.overrides.counter;
    if (ctr && ctr.riposte && !ctr.riposte._ready) {
      ctr.riposte = Object.assign({}, DEFAULT_ATTACK, ctr.riposte, { special: true, name: ctr.riposte.name || 'RIPOSTE', _ready: true });
    }
    normFollow(c.overrides);
    return c;
  };
  def.combos = (def.combos || []).map(normCombo);
  def.super = def.super ? normCombo(Object.assign({ sequence: ['down', 'forward', 'down', 'forward', 'punch'], window: 45, damageMultiplier: 1 }, def.super)) : null;
  def.throwAttack = Object.assign({}, DEFAULT_THROW, def.throw || {});
  def.sprites = def.sprites || {};
  return def;
}

/* Appelé par chaque fichier de js/characters/ */
function registerCharacter(def) {
  ROSTER.push(defineCharacter(def));
}

/* Appelé par chaque fichier de js/stages/ */
function registerStage(stage) {
  STAGES.push(Object.assign({ name: 'ARÈNE', subtitle: '', music: null, build: null, back: null, front: null }, stage));
}

/* Dessine le fond d'une arène (décor fixe mis en cache + animations) */
function drawStageBack(ctx, stage, t) {
  if (!stage.cache) {
    const cv = document.createElement('canvas');
    cv.width = CONFIG.WIDTH; cv.height = CONFIG.HEIGHT;
    const g = cv.getContext('2d');
    if (stage.build) stage.build(g, CONFIG.WIDTH, CONFIG.HEIGHT);
    stage.cache = cv;
  }
  ctx.drawImage(stage.cache, 0, 0);
  if (stage.back) stage.back(ctx, t);
}

function drawStageFront(ctx, stage, t) {
  if (stage.front) stage.front(ctx, t);
}
