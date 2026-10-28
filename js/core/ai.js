'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  INTELLIGENCE ARTIFICIELLE + MANNEQUIN D'ENTRAÎNEMENT
 *  L'IA lit les coups du personnage (combos, super, projection) et les
 *  classe automatiquement : un nouveau personnage est jouable par l'IA
 *  sans code supplémentaire. Elle ne lit pas les touches du joueur : elle
 *  réagit à ce qui est visible à l'écran (attaque en cours, projectile),
 *  avec un temps de réaction qui dépend de la difficulté.
 * ===================================================================== */
class AIController {
  constructor(levelKey) {
    this.cfg = AI_LEVELS[levelKey] || AI_LEVELS.medium;
    this.held = {};
    this.pressed = new Set();
    this.plan = [];
    this.holding = null;
    this.decisionTimer = 30;
    this.moveHold = null;
    this.guardTimer = 0;
    this.guardLow = false;
    this.lastThreat = null;
    this.projCooldown = 0;
    this.cancelDone = -1;
  }

  static reach(self, atk) {
    const hb = atk && atk.hitbox;
    return hb ? hb.x + hb.w - self.w / 2 : 0;
  }

  static categorize(self) {
    const cats = { melee: [], ranged: [], approach: [], buff: [], grab: [], counter: [], heal: [], reflect: [], summon: [], antiair: [] };
    for (const c of self.comboList) {
      const a = c.attack;
      if (a.counter) cats.counter.push(c);
      else if (a.reflect) cats.reflect.push(c);
      else if (a.heal) cats.heal.push(c);
      else if (a.buff) cats.buff.push(c);
      else if (a.projectile && a.projectile.minion) cats.summon.push(c);
      else if (a.projectile) cats.ranged.push(c);
      else if (a.grab) cats.grab.push(c);
      else if (a.teleport || (a.dash && a.dash >= 4)) cats.approach.push(c);
      else cats.melee.push(c);
      if (!a.projectile && a.hitbox && a.hitbox.y < -48 && (a.lift || a.launch)) cats.antiair.push(c);
    }
    return cats;
  }

  update(self, opp, game) {
    this.pressed.clear();
    for (const k of ['left', 'right', 'up', 'down', 'punch', 'kick', 'guard']) this.held[k] = false;
    if (game.state !== 'fight') { this.plan.length = 0; this.guardTimer = 0; this.holding = null; return; }
    if (this.projCooldown > 0) this.projCooldown--;
    if (!this.cats) this.cats = AIController.categorize(self);

    const cfg = this.cfg, cats = this.cats;
    const fwdKey = self.facing === 1 ? 'right' : 'left';
    const backKey = self.facing === 1 ? 'left' : 'right';
    const abs = t => (t === 'forward' ? fwdKey : t === 'back' ? backKey : t);
    const press = t => {
      if (t === 'pk') { press('punch'); press('kick'); return; }
      const k = abs(t); this.pressed.add(k); this.held[k] = true;
    };
    const gap = Math.abs(opp.x - self.x) - (self.w + opp.w) / 2;

    if (self.state === 'hurt' || self.state === 'down') { this.plan.length = 0; this.holding = null; }

    // 0) Maintien d'une touche (attaques chargées)
    if (this.holding) {
      this.held[this.holding.key] = true;
      if (--this.holding.frames <= 0) this.holding = null;
    }

    // 1) Annulation sur touche : un coup normal a touché → enchaîner un spécial
    if (!this.plan.length && self.canCancel() && this.cancelDone !== self.attackId && Math.random() < cfg.cancelChance) {
      this.cancelDone = self.attackId;
      const pool = cats.melee.concat(cats.approach, cats.ranged.filter(c => !game.hasProjectile(self, c.attack.projectile.shape)));
      if (self.superMove && self.meter >= CONFIG.METER_MAX && Math.random() < cfg.superChance) return this.queue(self.superMove.sequence, 1);
      if (pool.length) return this.queue(pick(pool).sequence, 1);
    }

    // 2) Séquence programmée en cours (combo, super, dash…)
    if (this.plan.length) {
      const step = this.plan[0];
      if (--step.delay <= 0) {
        this.plan.shift();
        press(step.token);
        if (step.hold) this.holding = { key: abs(step.token), frames: step.hold };
      }
      return;
    }

    // 3) Défense
    if (this.guardTimer > 0) { this.guardTimer--; this.held.guard = true; this.held.down = this.guardLow; return; }
    const threat = this.detectThreat(self, opp, game, gap);
    if (threat && threat.id !== this.lastThreat) {
      this.lastThreat = threat.id;
      if (cats.counter.length && !threat.projectile && self.isActionable() && self.onGround
          && Math.random() < cfg.blockChance * 0.3) return this.queue(pick(cats.counter).sequence);
      if (cats.reflect.length && threat.projectile && !threat.rain && self.isActionable() && self.onGround
          && Math.random() < cfg.antiProjectile * 0.5) return this.queue(pick(cats.reflect).sequence, 1);
      const chance = threat.projectile ? cfg.antiProjectile : cfg.blockChance;
      if (Math.random() < chance) {
        if (threat.projectile && !threat.rain && Math.random() < 0.35) { press('up'); this.held[fwdKey] = true; }
        else {
          this.guardTimer = threat.duration;
          this.guardLow = threat.level === 'low' ? Math.random() < cfg.lowBlock
            : threat.level === 'high' ? false : Math.random() < 0.3;
          this.held.guard = true; this.held.down = this.guardLow;
        }
        return;
      }
    }

    // 4) Anti-air : l'adversaire saute vers nous
    if ((opp.state === 'jump' || (opp.state === 'attack' && opp.attackAir)) && gap < 34 && self.isActionable() && self.onGround
        && Math.sign(opp.vx) === -Math.sign(opp.x - self.x) && Math.random() < cfg.antiAir * 0.25) {
      if (cats.antiair.length && Math.random() < 0.6) return this.queue(pick(cats.antiair).sequence, 1);
      press('kick');
      return;
    }

    // 5) Punition d'une attaque ratée
    if (opp.state === 'attack' && opp.attackPhase() === 'recovery' && self.isActionable() && self.onGround
        && gap <= AIController.reach(self, self.def.attacks.kick) && Math.random() < cfg.punish * 0.15) {
      press(gap <= AIController.reach(self, self.def.attacks.punch) ? 'punch' : 'kick');
      return;
    }

    // 6) Attaque aérienne
    if (!self.onGround && self.state === 'jump' && gap < 22 && Math.random() < 0.25) { press(Math.random() < 0.5 ? 'kick' : 'punch'); return; }

    // 7) Décision tactique
    if (--this.decisionTimer > 0) {
      if (this.moveHold) this.held[abs(this.moveHold)] = true;
      return;
    }
    this.decisionTimer = randInt(cfg.reaction[0], cfg.reaction[1]);
    this.moveHold = null;
    if (!self.isActionable() || !self.onGround) return;

    // Adversaire au sol ou en train de se relever (invulnérable) : on se replace sans frapper dans le vide
    if (opp.state === 'down' || opp.state === 'wakeup') {
      this.moveHold = gap > 30 ? 'forward' : (Math.random() < 0.5 ? null : 'back');
      if (this.moveHold) this.held[abs(this.moveHold)] = true;
      return;
    }

    // Super attaque
    if (self.superMove && self.meter >= CONFIG.METER_MAX && Math.random() < cfg.superChance) {
      const sa = self.superMove.attack;
      const r = AIController.reach(self, sa) + (sa.dash ? sa.dash * sa.active * 0.5 : 0);
      if (sa.projectile || sa.teleport || gap <= r + 4) return this.queue(self.superMove.sequence, 2);
    }

    // Soin quand la vie est basse et l'adversaire loin
    if (cats.heal.length && self.hp < self.maxHp * 0.45 && gap > 90 && Math.random() < 0.5) return this.queue(pick(cats.heal).sequence);

    const pr = AIController.reach(self, self.def.attacks.punch);
    const kr = AIController.reach(self, self.def.attacks.kick);
    const shots = cats.ranged.filter(c => !game.hasProjectile(self, c.attack.projectile.shape));
    const summons = cats.summon.filter(c => !game.hasProjectile(self, c.attack.projectile.shape));
    const close = cats.melee.concat(cats.grab);
    const queueCharged = c => this.queue(c.sequence, 3, c.attack.chargeable ? randInt(0, c.attack.chargeable.max) : 0);

    if (gap <= kr + 2) {
      if ((opp.state === 'guard' || opp.state === 'crouch') && Math.random() < cfg.throwChance) {
        return this.queue(cats.grab.length && Math.random() < 0.5 ? pick(cats.grab).sequence : ['pk']);
      }
      if (shots.length && Math.random() < cfg.retreatChance * 1.5) return this.queue(['back', 'back']);   // un tireur reprend ses distances
      if (Math.random() < cfg.attackChance) {
        if (close.length && Math.random() < cfg.comboChance) return queueCharged(pick(close));
        press(gap <= pr ? (Math.random() < 0.55 ? 'punch' : 'kick') : 'kick');
        return;
      }
      if (Math.random() < cfg.retreatChance) this.moveHold = 'back';
      else if (Math.random() < 0.3) { this.guardTimer = 14; this.guardLow = Math.random() < 0.4; }
    } else if (summons.length && gap > 50 && Math.random() < cfg.comboChance * 0.7) {
      return this.queue(pick(summons).sequence);
    } else if (cats.buff.length && !(self.buffs.rage > 0 || self.buffs.haste > 0) && gap > 60 && Math.random() < cfg.comboChance * 0.6) {
      return this.queue(pick(cats.buff).sequence);
    } else if (gap > 70 && shots.length && this.projCooldown <= 0 && Math.random() < cfg.comboChance) {
      this.projCooldown = 70;
      return queueCharged(pick(shots));
    } else if (gap > 28 && gap < 130 && cats.approach.length && Math.random() < cfg.comboChance * 0.45) {
      return this.queue(pick(cats.approach).sequence);
    } else if (gap > 50 && Math.random() < 0.1 + cfg.attackChance * 0.1) {
      return this.queue(['forward', 'forward']);              // dash vers l'adversaire
    } else if (Math.random() < cfg.jumpChance) {
      press('up'); this.held[fwdKey] = true;
    } else {
      this.moveHold = Math.random() < cfg.retreatChance * 0.5 ? 'back' : 'forward';
    }
    if (this.moveHold) this.held[abs(this.moveHold)] = true;
  }

  /* hold = nombre de frames pendant lesquelles la dernière touche reste enfoncée (charge) */
  queue(sequence, spacing = 3, hold = 0) {
    this.plan = sequence.map((token, i) => ({ token, delay: i === 0 ? 1 : spacing, hold: i === sequence.length - 1 ? hold : 0 }));
  }

  detectThreat(self, opp, game, gap) {
    if (opp.state === 'attack' && opp.attack.hitbox && opp.attackFrame >= this.cfg.blockDelay) {
      const a = opp.attack;
      const remaining = a.startup + a.active - opp.attackFrame;
      const range = AIController.reach(opp, a) + 12 + (a.dash ? a.dash * a.active : 0);
      if (remaining >= 0 && gap <= range && !a.grab) {
        return { id: 'a' + opp.attackId, duration: remaining + 6, projectile: false,
          level: opp.attackAir ? 'high' : (a.level || 'mid') };
      }
    }
    for (const p of game.projectiles) {
      if (p.owner !== opp || p.spent || p.delay > 14) continue;
      const dx = self.x - p.x;
      if (p.minion) {
        if (Math.abs(dx) < 34) return { id: 'm' + p.id + '-' + Math.floor(p.t / 30), duration: 18, projectile: false, level: 'mid' };
        continue;
      }
      if (p.spec.follow) return { id: 'p' + p.id, duration: p.life + 4, projectile: true, rain: true, level: p.level };
      if (p.vx === 0 || p.stationary) {
        if (Math.abs(dx) < 26) return { id: 'p' + p.id, duration: p.delay + 22, projectile: true, rain: true, level: p.level };
        continue;
      }
      if (Math.sign(dx) === Math.sign(p.vx) && Math.abs(dx) < 70) {
        return { id: 'p' + p.id, duration: Math.ceil(Math.abs(dx) / Math.abs(p.vx)) + 6, projectile: true, level: p.level };
      }
    }
    return null;
  }
}

/* Mannequin du mode entraînement */
const DUMMY_MODES = [
  { id: 'stand', label: 'IMMOBILE' },
  { id: 'guard', label: 'GARDE AUTO' },
  { id: 'crouch', label: 'ACCROUPI' },
  { id: 'jump', label: 'SAUTE' },
  { id: 'ai', label: 'IA (MOYEN)' },
  { id: 'riposte', label: 'GARDE + RIPOSTE' },
];

class DummyController {
  constructor() {
    this.held = {};
    this.pressed = new Set();
    this.ai = new AIController('medium');
    this.t = 0;
  }
  update(self, opp, game) {
    const mode = DUMMY_MODES[game.dummyMode].id;
    if (mode === 'ai') {
      this.ai.update(self, opp, game);
      this.held = this.ai.held; this.pressed = this.ai.pressed;
      return;
    }
    this.held = {}; this.pressed = new Set();
    if (mode === 'guard' || mode === 'riposte') {
      this.held.guard = true;
      const low = (opp.state === 'attack' && opp.attack && !opp.attackAir && opp.attack.level === 'low')
        || game.projectiles.some(p => p.owner === opp && p.level === 'low');
      this.held.down = low;
      if (mode === 'riposte' && self.state === 'blockstun' && self.stun <= 1) {
        this.held.guard = false; this.held.down = false; this.pressed.add('punch'); this.held.punch = true;
      }
    } else if (mode === 'crouch') {
      this.held.down = true;
    } else if (mode === 'jump' && self.onGround && self.isActionable() && ++this.t % 40 === 0) {
      this.held.up = true; this.pressed.add('up');
    }
  }
}
