'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
// [1.3] MODIFIÉ — mode en ligne (voir CHANGELOG_1.3.md)
/* =====================================================================
 *  JEU : déroulement des rounds, collisions, effets, HUD
 *  États : menu → versus → intro → fight → roundEnd → (intro…) → matchEnd
 * ===================================================================== */
const HUD_ARROWS = { down: '↓', up: '↑', forward: '→', back: '←', punch: 'P', kick: 'K', guard: 'G' };

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.keyboard = new Keyboard();
    this.state = 'menu';
    this.paused = false;
    this.globalTime = 0;
    this.frame = 0;
    this.fighters = [];
    this.projectiles = [];
    this.particles = [];
    this.texts = [];
    this.fx = [];
    this.screenFx = [];
    this.shakeTime = 0; this.shakeMag = 0;
    this.hitstop = 0;
    this.cinematic = null;
    this.training = false;
    this.dummyMode = 1;
    this.stage = null;
  }

  opponentOf(f) { return this.fighters[0] === f ? this.fighters[1] : this.fighters[0]; }
  hasProjectile(f, shape) { return this.projectiles.some(p => p.owner === f && !p.dead && (!shape || p.shape === shape)); }
  addParticle(p) { if (this.particles.length < CONFIG.PARTICLE_MAX) this.particles.push(p); }
  get inMatch() { return ['versus', 'intro', 'fight', 'roundEnd', 'matchEnd'].includes(this.state) && this.fighters.length > 0; }

  /* opts : { mode: 'pvp'|'ai'|'training', difficulty, p1, p2, stage } */
  startMatch(opts) {
    this.opts = opts;
    this.training = opts.mode === 'training';
    const d1 = ROSTER[opts.p1], d2 = ROSTER[opts.p2];
    let c1 = new HumanController(this.keyboard, KEYMAPS.p1, 0);
    let c2;
    if (opts.controllers) [c1, c2] = opts.controllers;          // en ligne : touches synchronisées
    else if (opts.mode === 'ai') c2 = new AIController(opts.difficulty);
    else if (this.training) c2 = new DummyController();
    else c2 = new HumanController(this.keyboard, KEYMAPS.p2, 1);
    this.fighters = [new Fighter(d1, c1, 'p1'), new Fighter(d2, c2, 'p2', d1.id === d2.id)];
    this.stage = STAGES[opts.stage] || STAGES[0];
    this.roundTime = this.training ? 0 : (opts.roundTime != null ? opts.roundTime : Settings.data.roundTime);
    this.roundsToWin = opts.rounds || Settings.data.rounds;
    this.trainMeter = true;
    this.slowmo = null;
    this.slowAcc = 0;
    this.round = 1;
    this.paused = false;
    this.trainInfo = { dmg: 0, hits: 0, best: 0, last: null };
    Music.play(this.stage.music);
    Ambience.play(this.stage.ambience);
    this.startRound();
    if (opts.p1Hp) { this.fighters[0].hp = this.fighters[0].displayHp = Math.min(this.fighters[0].maxHp, opts.p1Hp); }
    if (!opts.skipVersus) { this.state = 'versus'; this.stateTimer = 0; }
  }

  startRound() {
    const [a, b] = this.fighters;
    a.resetForRound(CONFIG.WIDTH * 0.3, 1);
    b.resetForRound(CONFIG.WIDTH * 0.7, -1);
    this.projectiles = []; this.particles = []; this.texts = []; this.fx = []; this.screenFx = [];
    this.comboDisplay = { p1: null, p2: null };
    this.timeLeft = this.roundTime > 0 ? this.roundTime : Infinity;
    this.timerFrames = 0;
    this.state = this.training ? 'fight' : 'intro';
    this.stateTimer = 0;
    this.roundWinner = null;
    this.perfect = false;
    this.firstHit = false;
    this.hitstop = 0;
    this.cinematic = null;
    this.slowmo = null;
    this.keyboard.justPressed.clear();
    for (const f of this.fighters) if (f.controller.reset) f.controller.reset();
    if (!this.training) Sfx.play('round');
  }

  skipVersus() {
    if (this.state !== 'versus') return;
    this.state = this.training ? 'fight' : 'intro';
    this.stateTimer = 0;
    if (!this.training) Sfx.play('round');
  }

  endRound(loser, reason) {
    if (this.state !== 'fight' || this.training) return;
    const [a, b] = this.fighters;
    let winner = null;
    if (loser) winner = this.opponentOf(loser);
    else if (a.hp !== b.hp) winner = a.hp > b.hp ? a : b;
    if (winner) winner.wins++;
    this.roundWinner = winner;
    this.roundReason = reason;
    this.perfect = !!winner && winner.hp >= winner.maxHp;
    this.state = 'roundEnd';
    this.stateTimer = 0;
    if (reason === 'ko') {
      this.hitstop = 18; this.shake(6, 24); Sfx.play('ko');
      this.slowmo = { t: 0, max: 80, scale: 0.35, focus: loser };
      this.addFx({ type: 'flashScreen', x: 0, y: 0, facing: 1, P: {}, life: 8 });
    }
  }

  endMatch(winner) {
    this.state = 'matchEnd';
    if (this.opts.online) Net.onMatchEnd(winner, this);
    else UI.showResult(winner, this);
  }

  togglePause(force) {
    if (!['versus', 'intro', 'fight', 'roundEnd'].includes(this.state)) return;
    this.paused = force !== undefined ? force : !this.paused;
    if (this.paused) Menu.openPause(); else UI.show(null);
  }

  /* ----- Mise à jour (60 fois par seconde) ----- */
  update() {
    this.globalTime++;
    if (!this.inMatch || this.state === 'matchEnd' || this.paused) return;
    if (this.state === 'versus') {
      if (++this.stateTimer >= 150) this.skipVersus();
      return;
    }
    if (this.slowmo) {                                // ralenti (KO, fin de super)
      if (++this.slowmo.t >= this.slowmo.max) this.slowmo = null;
      else {
        this.slowAcc += this.slowmo.scale;
        if (this.slowAcc < 1) return;
        this.slowAcc -= 1;
      }
    }
    if (this.shakeTime > 0) this.shakeTime--;
    this.updateEffects();
    if (this.cinematic && ++this.cinematic.t >= this.cinematic.max) this.cinematic = null;
    if (this.hitstop > 0) { this.hitstop--; return; }

    this.frame++;
    this.stateTimer++;
    this.updateRoundFlow();
    for (const f of this.fighters) f.update(this);
    this.resolvePush();
    this.updateProjectiles();
    this.resolveHits();
    for (const f of this.fighters) {
      if (f.displayHp > f.hp) f.displayHp = Math.max(f.hp, f.displayHp - Math.max(0.25, (f.displayHp - f.hp) * 0.05));
      else f.displayHp = f.hp;
    }
    if (this.training) this.updateTraining();
  }

  updateRoundFlow() {
    if (this.state === 'intro') {
      if (this.stateTimer === 60) Sfx.play('fight');
      if (this.stateTimer >= 100) { this.state = 'fight'; this.stateTimer = 0; }
    } else if (this.state === 'fight') {
      if (isFinite(this.timeLeft) && ++this.timerFrames >= 60) {
        this.timerFrames = 0;
        if (--this.timeLeft <= 0) { this.timeLeft = 0; this.endRound(null, 'time'); }
      }
    } else if (this.state === 'roundEnd') {
      const w = this.roundWinner;
      if (w && this.stateTimer > 50 && w.onGround && ['idle', 'walk', 'crouch', 'guard', 'jump', 'dash'].includes(w.state)) {
        w.state = 'win'; w.vx = 0;
      }
      if (this.stateTimer >= 210) {
        if (w && w.wins >= this.roundsToWin) this.endMatch(w);
        else { this.round++; this.startRound(); }
      }
    }
  }

  updateTraining() {
    for (const f of this.fighters) {
      f.idleTimer = (f.state === 'hurt' || f.state === 'blockstun') ? 0 : f.idleTimer + 1;
      if (f.idleTimer > 50 && f.hp < f.maxHp) { f.hp = f.maxHp; f.displayHp = f.maxHp; }
      if (this.trainMeter && (f.side === 'p1' || f.idleTimer > 50)) f.meter = CONFIG.METER_MAX;
    }
  }

  resolvePush() {
    const [a, b] = this.fighters;
    const ha = a.hurtbox(), hb = b.hurtbox();
    if (!(ha.y < hb.y + hb.h && hb.y < ha.y + ha.h)) return;
    const min = (a.w + b.w) / 2;
    const dx = b.x - a.x;
    if (Math.abs(dx) >= min) return;
    const s = dx === 0 ? a.facing : Math.sign(dx);
    const push = (min - Math.abs(dx)) / 2;
    a.x -= s * push; b.x += s * push;
    a.clampToStage(); b.clampToStage();
    if (Math.abs(b.x - a.x) < min - 0.01) {        // l'un des deux est coincé contre un mur
      const aStuck = a.x <= a.minX + 0.01 || a.x >= a.maxX - 0.01;
      if (aStuck) b.x = a.x + s * min; else a.x = b.x - s * min;
      a.clampToStage(); b.clampToStage();
    }
  }

  /* Coup intermédiaire d'une attaque multi-coups : pas d'éjection */
  static softHit(atk, every) {
    return Object.assign({}, atk, { launch: 0, knockback: atk.knockback * 0.25, hitstun: Math.max((every || 6) + 10, 14),
      throwBehind: false });
  }

  resolveHits() {
    if (this.state !== 'fight') return;
    const hits = [];
    for (const att of this.fighters) {
      const target = this.opponentOf(att);
      const hb = att.activeHitbox();
      if (!hb) continue;
      const hurt = target.hurtbox();
      if (overlap(hb, hurt)) {
        const ix = (Math.max(hb.x, hurt.x) + Math.min(hb.x + hb.w, hurt.x + hurt.w)) / 2;
        const iy = (Math.max(hb.y, hurt.y) + Math.min(hb.y + hb.h, hurt.y + hurt.h)) / 2;
        hits.push([att, target, { x: ix, y: iy }, att.attack]);
      }
    }
    for (const att of this.fighters) {               // les coups au corps à corps détruisent les invocations
      const hb = att.activeHitbox();
      if (!hb) continue;
      for (const p of this.projectiles) {
        if (!p.minion || p.owner === att || p.dead || p.lastHitBy === att.attackId) continue;
        if (!overlap(hb, p.rect())) continue;
        p.lastHitBy = att.attackId;
        this.spawnSparks(p.x, p.y, '#ffd166', 8, 1.8);
        Sfx.play('hitL');
        if (--p.minionHp <= 0) { p.dead = true; this.addFx({ type: 'smoke', x: p.x, y: p.y, facing: 1, P: p.owner.palette, life: 18 }); }
      }
    }
    for (const [att, target, pt, atk] of hits) {     // échanges de coups simultanés possibles
      const final = att.hitCount + 1 >= (atk.hits || 1);
      const res = target.receiveHit(final ? atk : Game.softHit(atk, atk.hitEvery), att, att.x, pt, this);
      if (res !== 'miss') { att.hitCount++; att.lastHitFrame = att.attackFrame; }
    }
  }

  spawnProjectile(owner, atk) {
    const s = atk.projectile, opp = this.opponentOf(owner), W = CONFIG.WIDTH;
    if (s.pattern === 'rain') {                       // tombe du ciel au-dessus de l'adversaire
      const n = s.count || 3;
      for (let i = 0; i < n; i++) {
        const x = clamp(opp.x + (i - (n - 1) / 2) * (s.spacing || 16), 12, W - 12);
        this.projectiles.push(new Projectile(owner, atk, { x, y: -12, vx: 0, vy: s.speed || 5, delay: (s.delay || 20) + i * (s.interval || 8) }));
      }
      return;
    }
    if (s.pattern === 'erupt') {                      // jaillit du sol (sous l'adversaire ou en ligne)
      const n = s.count || 1;
      for (let i = 0; i < n; i++) {
        const x = s.target === 'opponent' ? opp.x + (i - (n - 1) / 2) * (s.step || 20)
          : owner.x + owner.facing * ((s.start || 30) + i * (s.step || 24));
        if (x < 6 || x > W - 6) continue;
        const spec = Object.assign({ stationary: true }, s);
        this.projectiles.push(new Projectile(owner, Object.assign({}, atk, { projectile: spec }),
          { x, y: CONFIG.GROUND_Y - s.h / 2, vx: 0, vy: 0, delay: (s.delay || 10) + i * (s.interval || 8) }));
      }
      return;
    }
    const base = { dmgMul: owner.chargeMul || 1 };
    if (s.fromTip) {
      const t = owner.tipWorld();
      base.x = t.x;
      base.y = s.y != null ? owner.y + s.y : t.y;
    }
    if (s.minion) base.vx = 0;
    if (s.pattern === 'stream') {                     // plusieurs projectiles à la suite
      const n = s.count || 3;
      for (let i = 0; i < n; i++) this.projectiles.push(new Projectile(owner, atk, Object.assign({}, base, { delay: i * (s.interval || 6) })));
      return;
    }
    if (s.pattern === 'fan') {                        // éventail
      const n = s.count || 3;
      for (let i = 0; i < n; i++) {
        this.projectiles.push(new Projectile(owner, atk, Object.assign({}, base, { vy: (i - (n - 1) / 2) * (s.spread || 0.8) })));
      }
      return;
    }
    if (s.tether) owner.weaponOut = true;
    const p = new Projectile(owner, atk, base);
    if (s.growWithCharge && base.dmgMul > 1) { p.w = Math.round(p.w * base.dmgMul); p.h = Math.round(p.h * base.dmgMul); }
    this.projectiles.push(p);
  }

  updateProjectiles() {
    for (const p of this.projectiles) p.update(this);
    // collisions entre projectiles adverses
    for (let i = 0; i < this.projectiles.length; i++) {
      for (let j = i + 1; j < this.projectiles.length; j++) {
        const a = this.projectiles[i], b = this.projectiles[j];
        if (a.owner === b.owner || a.dead || b.dead || a.delay > 0 || b.delay > 0) continue;
        if (a.minion || b.minion) {                    // un projectile abîme une invocation
          const [m, o] = a.minion ? [a, b] : [b, a];
          if (o.minion || !o.live || !overlap(m.rect(), o.rect())) continue;
          o.kill();
          this.spawnSparks(m.x, m.y, '#ffffff', 8, 1.8);
          if (--m.minionHp <= 0) m.dead = true;
          continue;
        }
        if (a.live && b.live && !a.spec.follow && !b.spec.follow && overlap(a.rect(), b.rect())) {
          a.kill(); b.kill();
          this.spawnSparks((a.x + b.x) / 2, a.y, '#ffffff', 12, 2.2);
          Sfx.play('block');
        }
      }
    }
    if (this.state === 'fight') {
      for (const p of this.projectiles) {
        if (!p.live) continue;
        const target = this.opponentOf(p.owner);
        if (!overlap(p.rect(), target.hurtbox())) continue;
        const final = p.hitsLeft <= 1;
        const atk = final ? p.attack : Game.softHit(p.attack, p.hitEvery);
        const sourceX = (p.tether || p.vx === 0 || p.stationary) ? p.owner.x : p.x - p.vx * 4;
        const res = target.receiveHit(atk, p.owner, sourceX, { x: clamp(p.x, target.x - target.w / 2, target.x + target.w / 2), y: p.y }, this,
          { projectile: true, level: p.level, dmgMul: p.dmgMul });
        if (res === 'miss' || res === 'none') continue;
        if (res === 'reflect') {                       // renvoyé à l'envoyeur
          p.owner = target; p.vx = -p.vx; p.dir = -p.dir; p.cool = 6; p.tether = false; p.homing = 0;
          this.spawnSparks(p.x, p.y, '#bfe3ff', 10, 2);
          this.announce(target, 'RENVOI !', '#bfe3ff');
          Sfx.play('reflect');
          continue;
        }
        if (res === 'parried') { if (p.tether) p.kill(); else p.dead = true; continue; }
        p.kill();
      }
    }
    for (const p of this.projectiles) {
      if (!p.dead) continue;
      if (p.tether) p.owner.weaponOut = false;
      if (p.landed) {
        this.spawnSparks(p.x, CONFIG.GROUND_Y - 2, p.spec.color || '#ffffff', 8, 1.6, true);
        if (p.spec.burst) {
          const b = p.spec.burst;
          const atk2 = Object.assign({}, p.attack, { projectile: Object.assign({ stationary: true }, b) });
          this.projectiles.push(new Projectile(p.owner, atk2, { x: p.x, y: CONFIG.GROUND_Y - (b.h || 30) / 2, vx: 0, vy: 0 }));
          this.addFx({ type: 'smoke', x: p.x, y: CONFIG.GROUND_Y - 10, facing: 1, P: p.owner.palette, life: 24, color: b.color });
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  teleport(f, spec) {
    const opp = this.opponentOf(f), dist = spec.dist || 24;
    this.addFx({ type: 'smoke', x: f.x, y: f.y - f.h / 2, facing: 1, P: f.palette, life: 22, color: f.palette.smoke });
    let nx = spec.to === 'front' ? opp.x + opp.facing * dist : opp.x - opp.facing * dist;
    if (nx < f.minX || nx > f.maxX) nx = opp.x + (nx < f.minX ? 1 : -1) * dist;
    f.x = clamp(nx, f.minX, f.maxX);
    f.facing = Math.sign(opp.x - f.x) || f.facing;
    this.addFx({ type: 'smoke', x: f.x, y: f.y - f.h / 2, facing: 1, P: f.palette, life: 18, color: f.palette.smoke });
    Sfx.play('teleport');
  }

  startSuper(f, move) {
    f.meter = 0;
    f.startAttack(move.attack, this);
    this.cinematic = { owner: f, t: 0, max: CONFIG.SUPER_FREEZE, name: move.name };
    this.hitstop = CONFIG.SUPER_FREEZE;
    f.flash = 0;
    Sfx.play('super');
  }

  /* ----- Effets ----- */
  onImpact(attacker, victim, atk, pt, blocked, dmg, counterHit) {
    if (blocked) {
      this.spawnSparks(pt.x, pt.y, '#8ecae6', 6, 1.5);
      this.hitstop = 3;
      Sfx.play('block');
      if (this.training && attacker.side === 'p1') this.recordFrameData(attacker, victim, atk, true);
      return;
    }
    const heavy = atk.special || atk.damage >= 9 || atk.grab;
    const P = attacker.palette;
    this.spawnSparks(pt.x, pt.y, heavy ? (P.accent || '#ff6b6b') : '#ffd23f', heavy ? 14 : 8, heavy ? 2.6 : 1.8);
    if (atk.hitFx && FX[atk.hitFx]) this.addFx({ type: atk.hitFx, x: pt.x, y: pt.y, facing: attacker.facing, P, life: FX[atk.hitFx].life || 12 });
    this.hitstop = heavy ? 8 : CONFIG.HITSTOP;
    if (heavy) this.shake(4, 10);
    if (counterHit) this.announce(victim, 'CONTRE !', '#ff9f43');
    if (!this.firstHit && !this.training) { this.firstHit = true; this.announce(attacker, 'PREMIER COUP !', '#ffffff'); }
    Sfx.play(atk.hitSfx || (atk.damage >= 10 || atk.grab ? 'hitH' : atk.damage >= 6 ? 'hitM' : 'hitL'));
    if (atk.super && (atk.launch || atk.knockdown) && !this.slowmo && victim.hp > 0) {   // impact final d'une super
      this.slowmo = { t: 0, max: 26, scale: 0.45, focus: victim };
      this.addFx({ type: 'flashScreen', x: 0, y: 0, facing: 1, P: {}, life: 6 });
    }
    if (attacker.comboCount >= 2) this.comboDisplay[attacker.side] = { count: attacker.comboCount, life: 80 };
    if (this.training && attacker.side === 'p1') {
      if (attacker.comboCount === 1) { this.trainInfo.dmg = 0; }
      this.trainInfo.dmg += dmg;
      this.trainInfo.hits = attacker.comboCount;
      this.trainInfo.best = Math.max(this.trainInfo.best, this.trainInfo.dmg);
    }
    if (this.training && attacker.side === 'p1') this.recordFrameData(attacker, victim, atk, false);
  }

  /* Données de frames pour l'entraînement : avantage = étourdissement adverse - récupération restante */
  recordFrameData(att, victim, atk, blocked) {
    const a = att.attack === atk ? atk : null;
    const remain = a ? Math.max(0, a.startup + a.active + a.recovery - att.attackFrame) : 0;
    this.trainInfo.last = { name: atk.name || (atk === att.def.attacks.punch ? 'POING' : atk === att.def.attacks.kick ? 'PIED' : 'COUP'),
      s: atk.startup, a: atk.active, r: atk.recovery, adv: Math.round(victim.stun - remain), blocked };
  }

  onTech(victim, attacker) {
    this.announce(victim, 'LIBÉRÉ !', '#9fdcff');
    for (const f of [victim, attacker]) {
      f.attack = null; f.state = 'blockstun'; f.stun = 14;
      f.vx = Math.sign(f.x - this.opponentOf(f).x || f.facing * -1) * 3;
    }
    this.spawnSparks((victim.x + attacker.x) / 2, victim.y - victim.h * 0.6, '#9fdcff', 10, 2);
    this.hitstop = 6;
    Sfx.play('tech');
  }

  onGuardPoint(f, pt) {
    this.spawnSparks(pt.x, pt.y, '#bfe3ff', 10, 2);
    this.addFx({ type: 'ring', x: f.x + f.facing * f.w / 2, y: pt.y, facing: f.facing, P: f.palette, life: 10, r: 14 });
    this.hitstop = 5;
    Sfx.play('clink');
  }

  knockdownFx(f, impactV) {
    this.dust(f.x - f.facing * 6, f.y, 10);
    this.dust(f.x + f.facing * 6, f.y, 6);
    if (impactV > 5) this.shake(3, 8);
    Sfx.play('thud');
  }

  chargeFx(f) {
    const a = Math.random() * Math.PI * 2, d = 18;
    const t = f.tipWorld();
    this.addParticle({ x: t.x + Math.cos(a) * d, y: t.y + Math.sin(a) * d, vx: -Math.cos(a) * 1.4, vy: -Math.sin(a) * 1.4,
      life: 12, color: Math.random() < 0.5 ? (f.palette.accent || '#ffd166') : '#ffffff', size: 1, grav: 0 });
    Sfx.play('charge');
  }

  resetTraining() {
    const [a, b] = this.fighters;
    a.resetForRound(CONFIG.WIDTH * 0.4, 1);
    b.resetForRound(CONFIG.WIDTH * 0.6, -1);
    this.projectiles = []; this.fx = []; this.screenFx = []; this.particles = [];
    this.trainInfo.dmg = 0; this.trainInfo.hits = 0;
    this.announce(a, 'POSITIONS RÉINITIALISÉES', '#ffffff');
  }

  onParry(defender, attacker, pt) {
    this.announce(defender, 'PARADE !', '#ffffff');
    this.spawnSparks(pt.x, pt.y, '#ffffff', 16, 2.4);
    this.addFx({ type: 'ring', x: defender.x, y: defender.y - defender.h * 0.5, facing: 1, P: defender.palette, life: 16, r: 30 });
    this.hitstop = 12;
    Sfx.play('counter');
  }

  onArmor(f, pt) {
    this.spawnSparks(pt.x, pt.y, '#ffb347', 10, 2);
    this.hitstop = 4;
    Sfx.play('clang');
  }

  shatter(f) {
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 2.2;
      this.addParticle({ x: f.x + (Math.random() - 0.5) * f.w, y: f.y - Math.random() * f.h, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1,
        life: 20 + randInt(0, 10), color: Math.random() < 0.5 ? '#ffffff' : '#9be7ff', size: 2, grav: 0.15 });
    }
    Sfx.play('shatter');
  }

  announce(f, text, color) {
    const stacked = this.texts.filter(t => t.owner === f && t.life > 45).length;   // évite les chevauchements
    this.texts.push({ text, owner: f, x: f.x, y: f.y - f.h - 16 - stacked * 11, life: 70, color: color || f.palette.accent || '#ffd23f' });
  }

  addFx(e) { e.max = e.life; this.fx.push(e); }

  addScreenFx(type, owner, dur) {
    const def = SCREEN_FX[type];
    if (!def) return;
    const s = { type, owner, t: 0, max: dur };
    if (def.init) def.init(s, this);
    this.screenFx.push(s);
  }

  trail(f, type) {
    const P = f.palette;
    if (type === 'sparkle') {
      for (let i = 0; i < 2; i++) {
        this.addParticle({ x: f.x + (Math.random() - 0.5) * 16, y: f.y - f.h * 0.5 + (Math.random() - 0.5) * 24,
          vx: (Math.random() - 0.5) * 0.6, vy: Math.random() * 0.4, life: 16 + randInt(0, 8),
          color: Math.random() < 0.5 ? (P.gold || '#ffd166') : '#ffffff', size: 1, grav: 0, star: Math.random() < 0.5 });
      }
    } else if (type === 'sparks') {
      for (let i = 0; i < 3; i++) {
        this.addParticle({ x: f.x - f.facing * 4, y: CONFIG.GROUND_Y - 1, vx: -f.facing * (0.5 + Math.random() * 2),
          vy: -Math.random() * 1.6, life: 10 + randInt(0, 6), color: Math.random() < 0.5 ? '#fff3b0' : (P.neon || '#ffd23f'), size: 1, grav: 0.12 });
      }
    } else if (type === 'petals') {
      for (let i = 0; i < 2; i++) {
        this.addParticle({ x: f.x - f.facing * 6 + (Math.random() - 0.5) * 8, y: f.y - f.h * 0.5 + (Math.random() - 0.5) * 20,
          vx: -f.facing * Math.random() * 1.2, vy: (Math.random() - 0.5) * 0.6, life: 22 + randInt(0, 10),
          color: Math.random() < 0.6 ? (P.petal || '#ffb7d0') : '#ffffff', size: 2, grav: 0.02 });
      }
    } else if (type === 'fire') {
      const t = f.tipWorld();
      for (let i = 0; i < 3; i++) {
        this.addParticle({ x: t.x + f.facing * Math.random() * 14, y: t.y + (Math.random() - 0.5) * 10, vx: f.facing * (1 + Math.random() * 2),
          vy: -0.4 - Math.random() * 0.8, life: 10 + randInt(0, 8), color: pick(['#ff9f1c', '#ffe066', '#ff5a1f']), size: 2, grav: -0.02 });
      }
    } else if (type === 'embers') {
      this.addParticle({ x: f.x + (Math.random() - 0.5) * f.w, y: f.y - Math.random() * f.h, vx: -f.facing * Math.random(),
        vy: -0.6 - Math.random(), life: 18, color: Math.random() < 0.5 ? '#ff9f43' : '#ffd166', size: 1, grav: 0 });
    }
  }

  shake(mag, frames) {
    if (!Settings.data.shake) return;
    this.shakeMag = Math.max(this.shakeMag * (this.shakeTime > 0 ? 1 : 0), mag);
    this.shakeTime = frames;
  }

  spawnSparks(x, y, color, n, speed, star = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random());
      this.addParticle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 14 + randInt(0, 8), color,
        size: Math.random() > 0.6 ? 2 : 1, grav: 0.05, star: star && i % 3 === 0 });
    }
  }

  dust(x, y, n) {
    for (let i = 0; i < n; i++) {
      this.addParticle({ x: x + (Math.random() - 0.5) * 20, y: y - 1, vx: (Math.random() - 0.5) * 1.6, vy: -Math.random() * 1.2,
        life: 18 + randInt(0, 10), color: '#b89a7a', size: 2, grav: 0.02 });
    }
  }

  updateEffects() {
    for (const p of this.particles) { p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.life--; }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const t of this.texts) { t.y -= 0.35; t.life--; }
    this.texts = this.texts.filter(t => t.life > 0);
    for (const e of this.fx) e.life--;
    this.fx = this.fx.filter(e => e.life > 0);
    for (const s of this.screenFx) s.t++;
    this.screenFx = this.screenFx.filter(s => s.t < s.max);
    for (const k in this.comboDisplay) {
      const cd = this.comboDisplay[k];
      if (cd && --cd.life <= 0) this.comboDisplay[k] = null;
    }
  }

  /* ----- Rendu ----- */
  render() {
    const ctx = this.ctx, W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const inGame = this.inMatch;
    const stage = inGame ? this.stage : (Menu.backgroundStage() || STAGES[0]);
    ctx.save();
    if (this.shakeTime > 0 && inGame) {
      const m = this.shakeMag * (this.shakeTime / 20 + 0.3);
      ctx.translate(Math.round((Math.random() - 0.5) * m), Math.round((Math.random() - 0.5) * m));
    }
    if (inGame && this.slowmo && this.slowmo.focus) {     // léger zoom pendant le ralenti
      const sm = this.slowmo, k = 1 + 0.1 * Math.min(1, sm.t / 10, (sm.max - sm.t) / 14);
      const fx = clamp(sm.focus.x, 60, W - 60), fy = clamp(sm.focus.y - sm.focus.h * 0.5, 60, H - 30);
      ctx.translate(fx, fy); ctx.scale(k, k); ctx.translate(-fx, -fy);
    }
    if (stage) drawStageBack(ctx, stage, this.globalTime);
    if (!inGame) {
      if (stage) drawStageFront(ctx, stage, this.globalTime);
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, W, H);
      return;
    }
    if (this.state === 'versus') { ctx.restore(); this.renderVersus(ctx); return; }

    for (const s of this.screenFx) SCREEN_FX[s.type].draw(ctx, s, this);
    if (this.cinematic) {
      const e = clamp(Math.min(this.cinematic.t / 6, (this.cinematic.max - this.cinematic.t) / 8), 0, 1);
      ctx.fillStyle = `rgba(0,0,0,${0.65 * e})`; ctx.fillRect(-10, -10, W + 20, H + 20);
    }
    for (const f of this.fighters) {
      const k = Math.max(0.4, 1 - (CONFIG.GROUND_Y - f.y) / 120);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(Math.round(f.x - f.w * 0.7 * k), CONFIG.GROUND_Y - 1, Math.round(f.w * 1.4 * k), 3);
    }
    for (const f of this.fighters) {                   // rémanences
      for (const gh of f.ghosts) {
        ctx.globalAlpha = (gh.life / 14) * 0.6;
        Renderer.drawFighter(ctx, gh.snap, { tint: gh.n % 4 < 2 ? (f.palette.neon || '#3ff0ff') : (f.palette.neon2 || '#ff3fa4') });
      }
    }
    ctx.globalAlpha = 1;
    const order = [...this.fighters].sort((a, b) => (a.state === 'attack') - (b.state === 'attack'));
    for (const f of order) Renderer.drawFighter(ctx, f);
    for (const p of this.projectiles) Renderer.drawProjectile(ctx, p);
    for (const e of this.fx) FX[e.type].draw(ctx, e, this);
    for (const p of this.particles) {
      if (p.star) { R(ctx, p.x - 1, p.y, 3, 1, p.color); R(ctx, p.x, p.y - 1, 1, 3, p.color); }
      else R(ctx, p.x, p.y, p.size, p.size, p.color);
    }
    drawStageFront(ctx, stage, this.globalTime);
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life / 20);
      drawText(ctx, t.text, Math.round(clamp(t.x, 60, W - 60)), Math.round(t.y), 8, t.color, 'center');
      ctx.globalAlpha = 1;
    }
    if (CONFIG.DEBUG) this.drawDebug(ctx);
    ctx.restore();
    if (this.cinematic) this.drawCinematicBanner(ctx);
    this.drawHUD(ctx);
  }

  renderVersus(ctx) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, t = this.stateTimer;
    const [a, b] = this.fighters;
    ctx.fillStyle = 'rgba(8,4,20,0.75)'; ctx.fillRect(0, 0, W, H);
    const slide = (1 - easeOut(Math.min(1, t / 22))) * 220;
    // bandes diagonales aux couleurs des combattants
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = a.palette.accent; ctx.beginPath();
    ctx.moveTo(-slide, 40); ctx.lineTo(W / 2 + 20 - slide, 40); ctx.lineTo(W / 2 - 20 - slide, 170); ctx.lineTo(-slide, 170); ctx.fill();
    ctx.fillStyle = b.palette.accent; ctx.beginPath();
    ctx.moveTo(W + slide, 40); ctx.lineTo(W / 2 + 24 + slide, 40); ctx.lineTo(W / 2 - 16 + slide, 170); ctx.lineTo(W + slide, 170); ctx.fill();
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#000';
    for (let y = 40; y < 170; y += 3) ctx.fillRect(0, y, W, 1);
    ctx.restore();
    const drawBig = (f, x, facing) => {
      ctx.save();
      ctx.translate(x, 158);
      ctx.scale(2, 2);
      Renderer.drawFighter(ctx, { def: f.def, palette: f.palette, x: 0, y: 0, facing, vx: 0, state: t > 40 ? 'win' : 'idle',
        animTime: t, flash: 0, attack: null, weaponOut: false, status: null });
      ctx.restore();
    };
    drawBig(a, 96 - slide, 1);
    drawBig(b, W - 96 + slide, -1);
    drawText(ctx, a.def.name, 20 - slide, 170, 12, '#ffffff');
    drawText(ctx, a.def.title || '', 20 - slide, 186, 6, '#ffd23f');
    drawText(ctx, b.def.name, W - 20 + slide, 170, 12, '#ffffff', 'right');
    drawText(ctx, b.def.title || '', W - 20 + slide, 186, 6, '#ffd23f', 'right');
    const vsScale = t < 25 ? 0 : Math.min(1, (t - 25) / 8);
    if (vsScale > 0) drawText(ctx, 'VS', W / 2, 84, Math.round(30 * vsScale) || 1, '#e63946', 'center');
    drawText(ctx, this.stage.name, W / 2, 16, 8, '#ffffff', 'center');
    if (t > 30 && Math.floor(t / 20) % 2) drawText(ctx, 'ENTRÉE : PASSER', W / 2, 202, 6, '#c9b8ff', 'center');
  }

  drawCinematicBanner(ctx) {
    const c = this.cinematic, W = CONFIG.WIDTH, f = c.owner;
    const k = easeOut(Math.min(1, c.t / 8)), out = Math.min(1, (c.max - c.t) / 6);
    const h = Math.round(30 * k * out), y = 96 - h / 2;
    if (h <= 0) return;
    R(ctx, 0, y, W, h, '#000');
    ctx.fillStyle = f.palette.accent;
    for (let i = 0; i < 14; i++) {
      const lx = ((i * 53 + c.t * 9 * (f.facing || 1)) % (W + 60) + W + 60) % (W + 60) - 30;
      ctx.fillRect(Math.round(lx), y + 3 + (i * 7) % Math.max(1, h - 6), 24, 1);
    }
    R(ctx, 0, y, W, 1, f.palette.accent);
    R(ctx, 0, y + h - 1, W, 1, f.palette.accent);
    if (h > 18) {
      drawText(ctx, 'SUPER', 12, y + 4, 6, f.palette.accent);
      drawText(ctx, c.name, W / 2, y + 10, 12, '#ffffff', 'center');
    }
  }

  drawDebug(ctx) {
    ctx.lineWidth = 1;
    for (const f of this.fighters) {
      const h = f.hurtbox();
      ctx.strokeStyle = '#00ff66'; ctx.strokeRect(h.x + 0.5, h.y + 0.5, h.w - 1, h.h - 1);
      const a = f.activeHitbox();
      if (a) { ctx.strokeStyle = f.attack && f.attack.grab ? '#ffff00' : '#ff2244'; ctx.strokeRect(a.x + 0.5, a.y + 0.5, a.w - 1, a.h - 1); }
    }
    for (const p of this.projectiles) {
      if (p.delay > 0) continue;
      const r = p.rect(); ctx.strokeStyle = '#ff9f1c'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    }
  }

  drawBar(ctx, f, x, y, w, rightAligned) {
    R(ctx, x - 2, y - 2, w + 4, 12, '#000');
    R(ctx, x, y, w, 8, '#3a0d12');
    const wd = Math.round(w * f.displayHp / f.maxHp), wh = Math.round(w * f.hp / f.maxHp);
    const low = f.hp / f.maxHp < 0.3;
    const col = low && Math.floor(this.globalTime / 8) % 2 ? '#ff6b35' : '#ffd23f';
    R(ctx, rightAligned ? x + w - wd : x, y, wd, 8, '#e63946');
    R(ctx, rightAligned ? x + w - wh : x, y, wh, 8, col);
    R(ctx, rightAligned ? x + w - wh : x, y, wh, 2, '#fff3b0');
  }

  drawMeter(ctx, f, x, y, w, right) {
    const full = f.meter >= CONFIG.METER_MAX;
    R(ctx, x - 1, y - 1, w + 2, 6, '#000');
    R(ctx, x, y, w, 4, '#14102a');
    const fill = Math.round(w * f.meter / CONFIG.METER_MAX);
    const col = full ? (Math.floor(this.globalTime / 5) % 2 ? '#4cc9f0' : '#ffffff') : '#3a7bd5';
    R(ctx, right ? x + w - fill : x, y, fill, 4, col);
    R(ctx, right ? x + w - fill : x, y, fill, 1, '#9fdcff');
    for (let i = 1; i < 4; i++) R(ctx, x + Math.round(w * i / 4), y, 1, 4, '#000');
    if (full) drawText(ctx, 'SUPER', right ? x - 4 : x + w + 4, y - 1, 6, '#4cc9f0', right ? 'right' : 'left');
  }

  drawHUD(ctx) {
    const [a, b] = this.fighters;
    const W = CONFIG.WIDTH, BW = 150, BY = 8;
    this.drawBar(ctx, a, 10, BY, BW, false);
    this.drawBar(ctx, b, W - 10 - BW, BY, BW, true);
    const on = this.opts.online, me = this.opts.netSide;
    const p2Label = this.opts.mode === 'ai' ? 'IA' : this.training ? 'MANNEQUIN' : on ? (me === 1 ? 'VOUS' : 'J2') : 'J2';
    drawText(ctx, `${on && me === 0 ? 'VOUS' : 'J1'} ${a.def.name}`, 10, BY + 13, 8, '#ffffff', 'left');
    drawText(ctx, `${b.def.name} ${p2Label}`, W - 10, BY + 13, 8, '#ffffff', 'right');
    if (!this.training) {
      for (let i = 0; i < this.roundsToWin; i++) {
        R(ctx, 10 + BW - 8 - i * 10, BY + 13, 7, 7, '#000');
        R(ctx, 11 + BW - 8 - i * 10, BY + 14, 5, 5, a.wins > i ? '#ffd23f' : '#3a2a4a');
        R(ctx, W - 10 - BW + 1 + i * 10, BY + 13, 7, 7, '#000');
        R(ctx, W - 10 - BW + 2 + i * 10, BY + 14, 5, 5, b.wins > i ? '#ffd23f' : '#3a2a4a');
      }
    }
    this.drawMeter(ctx, a, 10, BY + 25, 80, false);
    this.drawMeter(ctx, b, W - 90, BY + 25, 80, true);

    R(ctx, W / 2 - 17, 3, 34, 22, '#000');
    R(ctx, W / 2 - 15, 5, 30, 18, '#1a1033');
    const tl = this.timeLeft;
    const tCol = isFinite(tl) && tl <= 10 && Math.floor(this.globalTime / 15) % 2 ? '#e63946' : '#ffffff';
    drawText(ctx, isFinite(tl) ? String(tl).padStart(2, '0') : '∞', W / 2, 8, 12, tCol, 'center', false);

    for (const [side, x, align] of [['p1', 10, 'left'], ['p2', W - 10, 'right']]) {
      const cd = this.comboDisplay[side];
      if (!cd) continue;
      drawText(ctx, `${cd.count} COUPS`, x, 44, 10, '#ffd23f', align);
      drawText(ctx, 'COMBO !', x, 57, 8, '#ff6b6b', align);
    }

    const st = this.stateTimer;
    let msg = null, size = 20, col = '#ffd23f', sub = null;
    if (this.state === 'intro') {
      msg = st < 60 ? `ROUND ${this.round}` : 'FIGHT !';
      if (st >= 60) { col = '#ff6b6b'; size = 24; }
    } else if (this.state === 'roundEnd') {
      if (st < 90) {
        msg = this.roundReason === 'ko' ? 'K.O.' : 'TEMPS !';
        if (this.roundReason === 'ko') { size = 32; col = '#e63946'; }
      } else {
        msg = this.roundWinner ? `${this.roundWinner.def.name} GAGNE` : 'MATCH NUL'; size = 14; col = '#ffffff';
        if (this.perfect) sub = 'PARFAIT !';
      }
    }
    if (msg) drawText(ctx, msg, W / 2, 78, size, col, 'center');
    if (sub) drawText(ctx, sub, W / 2, 100, 10, '#ffd23f', 'center');

    if (this.training) this.drawTrainingHUD(ctx);
    else {
      const run = this.opts.run;
      const tag = run ? run.label()
        : this.opts.mode === 'ai' ? `VS IA - ${AI_LEVELS[this.opts.difficulty].label.toUpperCase()}`
        : this.opts.online ? 'EN LIGNE' : 'LOCAL 1 VS 1';
      ctx.globalAlpha = 0.6;
      if (!this.opts.online) drawText(ctx, `${tag} • ${this.stage.name}`, W / 2, 205, 6, '#ffffff', 'center');
      else drawText(ctx, this.stage.name, W / 2, 205, 6, '#ffffff', 'center');
      ctx.globalAlpha = 1;
    }
  }

  drawTrainingHUD(ctx) {
    const W = CONFIG.WIDTH, p1 = this.fighters[0];
    const toks = p1.buffer.filter(b => this.frame - b.frame < 120).slice(-10).map(b => HUD_ARROWS[b.token] || '').join(' ');
    const L = this.trainInfo.last;
    R(ctx, 6, 68, 168, L ? 48 : 30, 'rgba(0,0,0,0.5)');
    drawText(ctx, `ENTRÉES : ${toks}`, 10, 71, 6, '#ffffff');
    drawText(ctx, `COMBO : ${this.trainInfo.hits} COUP(S) / ${Math.round(this.trainInfo.dmg)} DÉG.`, 10, 80, 6, '#ffd23f');
    drawText(ctx, `RECORD : ${Math.round(this.trainInfo.best)} DÉG.`, 10, 89, 6, '#c9b8ff');
    if (L) {
      drawText(ctx, `${L.name.slice(0, 18)} : ${L.s}/${L.a}/${L.r} F`, 10, 98, 6, '#9fdcff');
      const adv = `${L.adv > 0 ? '+' : ''}${L.adv}`;
      drawText(ctx, `AVANTAGE ${L.blocked ? 'EN GARDE' : 'TOUCHÉ'} : ${adv}`, 10, 107, 6, L.adv >= 0 ? '#7fe07f' : '#ff6b6b');
    }
    ctx.globalAlpha = 0.75;
    drawText(ctx, `MANNEQUIN [1-6] : ${DUMMY_MODES[this.dummyMode].label} • R : RESET • T : JAUGE ${this.trainMeter ? 'INFINIE' : 'NORMALE'}`, W / 2, 205, 6, '#ffffff', 'center');
    ctx.globalAlpha = 1;
  }
}
