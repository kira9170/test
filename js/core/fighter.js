'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  COMBATTANT : logique, physique, combos, jauge, statuts
 * ---------------------------------------------------------------------
 *  Propriétés d'attaque gérées ici (en plus de damage/startup/active/…):
 *   dash, lift, recoil      mouvement pendant la phase active
 *   hits, hitEvery          attaque multi-coups
 *   armor                   nombre de coups encaissés sans être interrompu
 *   grab                    choppe : imparable, rate un adversaire en l'air ou sonné
 *   techable                la projection peut être annulée (Poing + Pied au bon moment)
 *   counter {from,to,riposte}  parade : si on est touché dans la fenêtre → riposte
 *   guardPoint {from,to}    bloque automatiquement les coups venant de face pendant la fenêtre
 *   reflect {from,to}       renvoie les projectiles reçus pendant la fenêtre
 *   invuln / projInvuln {from,to}  invulnérable à tout / aux projectiles pendant la fenêtre
 *   chargeable {max, bonus} maintenir la touche prolonge l'armé et augmente les dégâts
 *   teleport {to,dist}      téléportation au début de la phase active
 *   buff {rage, haste}      bonus temporaire (rage : dégâts +30 % ; hâte : vitesse +25 %, récupération -30 %)
 *   heal                    rend des PV au début de la phase active
 *   status {chill, freeze, root}  effets infligés (ralenti / gelé / entravé)
 *   knockdown               fait tomber l'adversaire (balayage)
 *   followUp {…}            étape suivante enchaînée automatiquement (requireHit : seulement si touché ;
 *                           whiffRecovery : récupération si l'étape suivante n'a pas lieu)
 *   throwBehind             projette l'adversaire derrière soi
 *   fx, hitFx, trail, afterimages, screenFx, shake, sfx, hitSfx  (visuel / son)
 * ===================================================================== */
class Fighter {
  constructor(def, controller, side, useAltPalette = false) {
    this.def = def;
    this.controller = controller;
    this.side = side;
    this.palette = useAltPalette && def.altPalette ? Object.assign({}, def.palette, def.altPalette) : def.palette;
    this.maxHp = def.stats.maxHp;
    this.wins = 0;
    this.meter = 0;
    const mark = (atk, props) => {                    // propage les drapeaux aux étapes enchaînées
      let a = atk;
      while (a.followUp) {
        a.followUp = Object.assign({ name: atk.name }, a.followUp, props);
        a = a.followUp;
      }
      return atk;
    };
    const build = (c, extra) => {
      const base = def.attacks[c.move] || def.attacks.punch;
      const atk = Object.assign({}, base, c.overrides, {
        damage: Math.round(base.damage * c.damageMultiplier * 10) / 10, name: c.name, special: true,
        chargeButton: c.sequence ? c.sequence[c.sequence.length - 1] : 'punch' }, extra);
      return mark(atk, Object.assign({ special: true, silent: true }, extra));
    };
    this.comboList = def.combos
      .map(c => ({ name: c.name, sequence: c.sequence, window: c.window, attack: build(c) }))
      .sort((a, b) => b.sequence.length - a.sequence.length);
    this.superMove = def.super
      ? { name: def.super.name, sequence: def.super.sequence, window: def.super.window, attack: build(def.super, { super: true }) }
      : null;
    this.throwAttack = def.throwAttack;
    this.resetForRound(100, 1);
  }

  get w() { return this.def.hitbox.w; }
  get h() { return this.def.hitbox.h; }
  get onGround() { return this.y >= CONFIG.GROUND_Y; }
  get minX() { return CONFIG.STAGE_PADDING + this.w / 2; }
  get maxX() { return CONFIG.WIDTH - CONFIG.STAGE_PADDING - this.w / 2; }
  get speedMul() {
    return (this.status.chill > 0 ? 0.55 : 1) * (this.buffs.rage > 0 ? 1.2 : 1) * (this.buffs.haste > 0 ? 1.25 : 1);
  }
  get damageMul() { return this.buffs.rage > 0 ? 1.3 : 1; }

  resetForRound(x, facing) {
    Object.assign(this, {
      x, y: CONFIG.GROUND_Y, vx: 0, vy: 0, facing, hp: this.maxHp, displayHp: this.maxHp,
      state: 'idle', prevState: 'idle', animTime: 0, stun: 0, flash: 0,
      attack: null, attackFrame: 0, attackAir: false, attackId: 0, hitCount: 0, lastHitFrame: -99, armorLeft: 0,
      comboCount: 0, buffer: [], pendingAttack: null, dashRequest: null, ghosts: [], weaponOut: false,
      status: { chill: 0, freeze: 0, root: 0 }, buffs: { rage: 0, haste: 0 }, dashTimer: 0, dashDir: 0, guardLow: false,
      idleTimer: 0, juggle: 0, launched: false, downTimer: 0, wakeTimer: 0, landTimer: 0, hurtLow: false,
      chargeFrames: 0, chargeMul: 1, hitConfirmed: false, chained: false,
    });
  }

  isActionable() { return ['idle', 'walk', 'crouch', 'guard', 'jump'].includes(this.state); }
  attackPhase() { return this.attack ? phaseOf(this.attack, this.attackFrame) : null; }
  basicButton() {
    if (this.attack === this.def.attacks.punch) return 'punch';
    if (this.attack === this.def.attacks.kick) return 'kick';
    return null;
  }
  gainMeter(n) { this.meter = Math.min(CONFIG.METER_MAX, this.meter + n); }
  inWindow(w) { return !!w && this.attackFrame >= w.from && this.attackFrame <= w.to; }

  /* Invulnérabilité : au sol après une chute, pendant le relevé, ou pendant une fenêtre d'attaque */
  isInvulnerable(fromProjectile) {
    if (this.state === 'down' || this.state === 'wakeup') return true;
    if (this.state === 'attack' && this.attack) {
      if (this.inWindow(this.attack.invuln)) return true;
      if (fromProjectile && this.inWindow(this.attack.projInvuln)) return true;
    }
    return false;
  }

  /* Un coup normal qui a touché (ou été bloqué) peut être annulé en coup spécial */
  canCancel() {
    return this.state === 'attack' && this.hitConfirmed && !!this.basicButton() && !this.attackAir
      && this.attackFrame <= this.attack.startup + this.attack.active + CONFIG.CANCEL_WINDOW;
  }

  hurtbox() {
    let h = this.h;
    const lowGuard = (this.state === 'guard' || this.state === 'blockstun') && this.guardLow;
    if (this.state === 'crouch' || this.state === 'land' || lowGuard) h = Math.round(this.h * 0.68);
    else if (this.state === 'attack' && this.attack && this.attack.lowProfile && this.attackPhase() !== 'recovery') h = Math.round(this.h * 0.55);
    else if ((this.state === 'ko' || this.state === 'down') && this.onGround) h = Math.round(this.h * 0.3);
    else if (this.state === 'wakeup') h = Math.round(this.h * 0.6);
    return { x: this.x - this.w / 2, y: this.y - h, w: this.w, h };
  }

  activeHitbox() {
    if (this.state !== 'attack' || !this.attack.hitbox || this.attackPhase() !== 'active') return null;
    const a = this.attack, max = a.hits || 1;
    if (this.hitCount >= max) return null;
    if (this.hitCount > 0 && this.attackFrame - this.lastHitFrame < (a.hitEvery || 6)) return null;
    const hb = a.hitbox;
    const x = this.facing === 1 ? this.x + hb.x : this.x - hb.x - hb.w;
    return { x, y: this.y + hb.y, w: hb.w, h: hb.h };
  }

  /* Position monde de la pointe de l'arme */
  tipWorld(frame) {
    const J = Pose.compute(this, frame);
    return { x: this.x + this.facing * J.tip.x, y: this.y + J.tip.y, J };
  }

  snapshot() {
    return { def: this.def, palette: this.palette, x: this.x, y: this.y, vy: this.vy, facing: this.facing, state: this.state,
      animTime: this.animTime, attack: this.attack, attackFrame: this.attackFrame, attackAir: this.attackAir,
      vx: this.vx, flash: 0, weaponOut: this.weaponOut, guardLow: this.guardLow, dashDir: this.dashDir,
      hurtLow: this.hurtLow, wakeTimer: this.wakeTimer };
  }

  /* --- Historique des touches → combos, dashs --- */
  pushInput(token, frame) {
    if (token === 'left') token = this.facing === 1 ? 'back' : 'forward';
    else if (token === 'right') token = this.facing === 1 ? 'forward' : 'back';
    const prev = this.buffer[this.buffer.length - 1];
    if ((token === 'forward' || token === 'back') && prev && prev.token === token && frame - prev.frame <= CONFIG.DASH_WINDOW) {
      this.dashRequest = { dir: token === 'forward' ? 1 : -1, frame };
    }
    this.buffer.push({ token, frame });
    if (this.buffer.length > CONFIG.INPUT_HISTORY) this.buffer.shift();
  }

  pressedRecently(token, frame, within) {
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      const b = this.buffer[i];
      if (frame - b.frame > within) break;
      if (b.token === token) return true;
    }
    return false;
  }

  matchSeq(c, frame) {
    const seq = c.sequence;
    let i = seq.length - 1;
    for (let j = this.buffer.length - 1; j >= 0 && i >= 0; j--) {
      const e = this.buffer[j];
      if (frame - e.frame > c.window) break;
      if (e.token === seq[i]) i--;
      else if (i === seq.length - 1 && e.frame !== frame) break;   // la dernière touche doit venir d'être pressée
    }
    return i < 0;
  }

  matchCombo(frame, game) {
    for (const c of this.comboList) {
      if (!this.matchSeq(c, frame)) continue;
      const pr = c.attack.projectile;
      if (pr && game && game.hasProjectile(this, pr.shape)) continue;   // un seul exemplaire à la fois
      return c;
    }
    return null;
  }

  trySuper(game) {
    if (this.superMove && this.meter >= CONFIG.METER_MAX && this.matchSeq(this.superMove, game.frame)) {
      this.buffer.length = 0;
      game.startSuper(this, this.superMove);
      return true;
    }
    return false;
  }

  /* --- Boucle principale --- */
  update(game) {
    const opp = game.opponentOf(this);
    const ctrl = this.controller;
    ctrl.update(this, opp, game);
    for (const tok of ctrl.pressed) this.pushInput(tok, game.frame);

    if (this.flash > 0) this.flash--;
    for (const g of this.ghosts) g.life--;
    if (this.ghosts.length) this.ghosts = this.ghosts.filter(g => g.life > 0);
    if (this.status.chill > 0) {
      this.status.chill--;
      if (game.frame % 6 === 0) game.addParticle({ x: this.x + (Math.random() - 0.5) * this.w, y: this.y - Math.random() * this.h,
        vx: 0, vy: 0.3, life: 20, color: '#dff6ff', size: 1, grav: 0 });
    }
    if (this.status.root > 0) this.status.root--;
    if (this.buffs.rage > 0) {
      this.buffs.rage--;
      if (game.frame % 3 === 0) game.addParticle({ x: this.x + (Math.random() - 0.5) * this.w, y: this.y - Math.random() * this.h * 0.8,
        vx: 0, vy: -0.8, life: 16, color: Math.random() < 0.5 ? '#ff2e2e' : '#ff9f43', size: 1, grav: 0 });
    }
    if (this.buffs.haste > 0) {
      this.buffs.haste--;
      if (game.frame % 4 === 0 && Math.abs(this.vx) > 0.5) this.ghosts.push({ snap: this.snapshot(), life: 8, n: game.frame });
    }
    const frozen = this.status.freeze > 0;
    if (frozen && --this.status.freeze === 0) game.shatter(this);

    if (this.state === 'hurt' || this.state === 'blockstun') {
      if (--this.stun <= 0 && this.onGround) { this.state = 'idle'; this.launched = false; this.juggle = 0; }
    }
    if (this.state === 'down' && --this.downTimer <= 0) { this.state = 'wakeup'; this.wakeTimer = CONFIG.WAKE_FRAMES; }
    if (this.state === 'wakeup' && --this.wakeTimer <= 0) this.state = 'idle';
    if (this.state === 'land' && --this.landTimer <= 0) this.state = 'idle';
    if (this.state === 'dash' && --this.dashTimer <= 0) { this.state = 'idle'; this.vx = 0; }
    if (this.state === 'attack') this.updateAttack(game);

    if (game.state === 'fight') {
      const P = ctrl.pressed.has('punch'), K = ctrl.pressed.has('kick');
      const basic = this.state === 'attack' ? this.basicButton() : null;
      if (basic && !this.attackAir && this.attackFrame <= CONFIG.PK_LENIENCY && ((basic === 'punch' && K) || (basic === 'kick' && P))) {
        this.tryThrow(game);                         // Poing + Pied presque ensemble → projection
      } else if ((P || K) && this.canCancel()) {
        this.tryCancel(P, K, game);
      } else if (this.isActionable() || this.state === 'dash') {
        this.handleControls(ctrl, game);
      } else if (P || K) {
        this.pendingAttack = { token: P ? 'punch' : 'kick', both: P && K, frame: game.frame };
      }
    } else if (this.onGround && ['walk', 'crouch', 'guard', 'dash'].includes(this.state)) {
      this.state = 'idle'; this.vx = 0;
    }

    if (this.onGround && ['idle', 'walk', 'crouch', 'guard', 'land'].includes(this.state)) {
      this.facing = opp.x >= this.x ? 1 : -1;
    }

    this.applyPhysics(game);

    if (this.state !== this.prevState) { this.animTime = 0; this.prevState = this.state; }
    else if (!frozen) this.animTime++;
  }

  /* Annulation d'un coup normal qui a touché : super > spécial > enchaînement Poing → Pied */
  tryCancel(P, K, game) {
    if (this.trySuper(game)) return;
    const combo = this.matchCombo(game.frame, game);
    if (combo) {
      this.buffer.length = 0;
      game.announce(this, 'ANNULATION', '#9fdcff');
      return this.startAttack(combo.attack, game);
    }
    if (this.basicButton() === 'punch' && K && !this.chained) {
      this.startAttack(this.def.attacks.kick, game);
      this.chained = true;
      return;
    }
    this.pendingAttack = { token: P ? 'punch' : 'kick', both: P && K, frame: game.frame };
  }

  handleControls(ctrl, game) {
    const held = ctrl.held;
    const P = ctrl.pressed.has('punch'), K = ctrl.pressed.has('kick');
    let atk = P ? 'punch' : K ? 'kick' : null, both = P && K;
    if (!atk && this.pendingAttack && game.frame - this.pendingAttack.frame <= CONFIG.ATTACK_BUFFER) {
      atk = this.pendingAttack.token; both = this.pendingAttack.both;
    }
    this.pendingAttack = null;
    if (this.weaponOut) atk = null;                 // l'arme est lancée : on attend son retour

    if (atk) {
      if (this.onGround) {
        if (this.trySuper(game)) return;
        if (both) return this.tryThrow(game);
        const combo = this.matchCombo(game.frame, game);
        if (combo) {
          this.buffer.length = 0;
          return this.startAttack(combo.attack, game);
        }
        return this.startAttack(this.def.attacks[atk], game);
      }
      const air = this.def.airAttacks && this.def.airAttacks[atk];
      return this.startAttack(air || this.def.attacks[atk], game);
    }
    if (this.state === 'dash' || !this.onGround) return;

    const rooted = this.status.root > 0;
    if (this.dashRequest && game.frame - this.dashRequest.frame <= 1 && !rooted) {
      const d = this.dashRequest.dir;
      this.dashRequest = null;
      this.state = 'dash'; this.dashDir = d; this.dashTimer = CONFIG.DASH_FRAMES;
      this.vx = this.facing * d * (d > 0 ? CONFIG.DASH_SPEED : CONFIG.BACKDASH_SPEED) * this.speedMul;
      game.dust(this.x, this.y, 4);
      Sfx.play('dash');
      return;
    }

    const dir = rooted ? 0 : (held.right ? 1 : 0) - (held.left ? 1 : 0);
    if (held.guard) { this.state = 'guard'; this.guardLow = !!held.down; this.vx = 0; return; }
    // un appui très bref (relâché avant la frame suivante) compte aussi : sinon le saut « saute »
    if ((held.up || ctrl.pressed.has('up')) && !rooted) {
      this.state = 'jump';
      this.vy = -this.def.stats.jumpForce * (this.status.chill > 0 ? 0.85 : 1);
      this.vx = dir * this.def.stats.jumpSpeed * this.speedMul;
      Sfx.play('jump');
      return;
    }
    if (held.down) { this.state = 'crouch'; this.vx = 0; return; }
    if (dir) {
      this.state = 'walk';
      this.vx = dir * this.def.stats.walkSpeed * this.speedMul * (dir === this.facing ? 1 : 0.8);
    } else { this.state = 'idle'; this.vx = 0; }
  }

  tryThrow(game) {
    if (!this.onGround || this.weaponOut) return;
    this.attack = null;
    this.startAttack(this.throwAttack, game);
  }

  startAttack(atk, game) {
    this.state = 'attack';
    this.attack = atk;
    this.attackFrame = 0;
    this.hitCount = 0;
    this.lastHitFrame = -99;
    this.armorLeft = atk.armor || 0;
    this.hitConfirmed = false;
    this.chained = false;
    this.chargeFrames = 0;
    this.chargeMul = 1;
    this.attackId = ++Fighter.attackCounter;
    this.attackAir = !this.onGround;
    if (!this.attackAir && !atk.keepMomentum) this.vx = 0;
    if (atk.special && !atk.super && !atk.silent) {
      game.announce(this, atk.name);
      Sfx.play('special');
      this.gainMeter(CONFIG.METER_ON_SPECIAL);
    }
    const W = this.def.weapon ? WEAPONS[this.def.weapon.type] : null;
    Sfx.play(atk.sfx || (W && W.whiff) || 'whoosh');
  }

  updateAttack(game) {
    const a = this.attack;
    let f = ++this.attackFrame;
    const s = a.startup, act = a.active;
    // Attaque chargée : maintenir la touche fige la fin de l'armé
    if (a.chargeable && f === s && this.chargeFrames < a.chargeable.max && this.controller.held[a.chargeButton || 'punch']) {
      this.chargeFrames++;
      this.attackFrame--;
      if (this.chargeFrames % 3 === 0) game.chargeFx(this);
      if (this.chargeFrames === a.chargeable.max) { this.flash = 4; Sfx.play('charged'); }
      return;
    }
    if (f === 1 && a.screenFx) game.addScreenFx(a.screenFx, this, s + act + (a.screenFxTime || 40));
    if (f === s + 1) {                                 // première frame active
      this.chargeMul = a.chargeable ? 1 + a.chargeable.bonus * this.chargeFrames / a.chargeable.max : 1;
      if (a.teleport) game.teleport(this, a.teleport);
      if (a.projectile) game.spawnProjectile(this, a);
      if (a.lift && this.onGround) this.vy = a.lift;
      if (a.recoil) this.vx = -this.facing * a.recoil;
      if (a.shake) { game.shake(a.shake, 14); game.dust(this.x, this.y, 14); }
      if (a.buff) {
        if (a.buff.rage) { this.buffs.rage = a.buff.rage; game.announce(this, 'RAGE !', '#ff2e2e'); }
        if (a.buff.haste) { this.buffs.haste = a.buff.haste; game.announce(this, 'HÂTE !', '#9fdcff'); }
      }
      if (a.heal) {
        this.hp = Math.min(this.maxHp, this.hp + a.heal);
        game.announce(this, `+${a.heal} PV`, '#7fe07f');
        Sfx.play('heal');
      }
      this.spawnFx(game);
    }
    const active = f > s && f <= s + act;
    if (active) {
      if (a.dash) this.vx = a.dash * this.facing * (this.buffs.rage > 0 ? 1.15 : 1);
      if (a.trail) game.trail(this, a.trail);
    } else if (f > s + act && a.dash && this.onGround) this.vx *= 0.75;
    if (a.recoil && f > s + 1) this.vx *= 0.85;
    if (a.afterimages && f <= s + act && f % 2 === 0) this.ghosts.push({ snap: this.snapshot(), life: 14, n: f });
    const rec = Math.round(a.recovery * (this.buffs.haste > 0 ? 0.7 : 1));
    if (f >= s + act + rec) {
      const next = a.followUp;
      if (next && (!next.requireHit || this.hitCount > 0)) return this.startAttack(next, game);
      if (next && a.whiffRecovery) {                 // l'étape suivante n'a pas lieu : récupération punissable
        return this.startAttack(Object.assign({}, DEFAULT_ATTACK, { startup: 1, active: 1, recovery: a.whiffRecovery, hitbox: null,
          anim: { windup: a.anim && a.anim.strike, strike: a.anim && a.anim.strike }, silent: true, sfx: 'none' }), game);
      }
      this.attack = null;
      this.state = this.onGround ? 'idle' : 'jump';
      if (this.onGround) this.vx = 0;
    }
  }

  /* Effets visuels déclenchés au début de la phase active (déclarés dans attack.fx) */
  spawnFx(game) {
    const a = this.attack, P = this.palette;
    for (const type of [].concat(a.fx || [])) {
      const def = FX[type];
      if (!def) continue;
      if (type === 'arc') {
        if (!(a.anim && a.anim.windup && a.anim.strike)) continue;
        const Jw = Pose.compute(this, a.startup), Js = Pose.compute(this, a.startup + Math.min(a.active, 4));
        const piv = Js.sF;
        const a0 = Math.atan2(Jw.tip.y - piv.y, Jw.tip.x - piv.x);
        const sweep = ((a.anim.strike.ang != null ? a.anim.strike.ang : 20) - (a.anim.windup.ang != null ? a.anim.windup.ang : 20)) * DEG;
        const r = Math.hypot(Js.tip.x - piv.x, Js.tip.y - piv.y);
        game.addFx({ type: 'arc', x: this.x + this.facing * piv.x, y: this.y + piv.y, facing: this.facing, P,
          a0, a1: a0 + sweep, r, width: a.arcWidth || 6, core: P.slash, edge: P.slashEdge, life: 12 });
        continue;
      }
      let x, y;
      if (def.at === 'body') { x = this.x; y = this.y - this.h * 0.55; }
      else if (def.at === 'front') { x = this.x + this.facing * (this.w / 2 + 14); y = this.y - this.h * 0.55; }
      else if (def.at === 'feet') { x = this.x; y = CONFIG.GROUND_Y; }
      else {
        const t = this.tipWorld();
        x = t.x; y = def.at === 'ground' ? CONFIG.GROUND_Y : t.y;
      }
      game.addFx({ type, x, y, facing: this.facing, P, life: def.life || 12 });
    }
  }

  /* Résultat : 'hit' | 'blocked' | 'miss' | 'parried' | 'armored' | 'reflect' | 'none' */
  receiveHit(atk, attacker, sourceX, impact, game, opts = {}) {
    if (this.state === 'ko') return 'none';
    if (this.isInvulnerable(!!opts.projectile)) return 'miss';
    // Limite de jongle : un adversaire déjà trop jonglé n'est plus touchable (sauf super)
    if (!this.onGround && (this.state === 'hurt') && this.juggle >= CONFIG.JUGGLE_MAX && !atk.super) return 'miss';
    const level = opts.level || (attacker.attackAir && !opts.projectile ? 'high' : (atk.level || 'mid'));
    const facesSource = Math.sign(sourceX - this.x) === this.facing || sourceX === this.x;

    // Choppes : seulement au sol, pas sur un adversaire sonné ou en garde-stun
    if (atk.grab && (!this.onGround || ['hurt', 'blockstun', 'jump', 'land'].includes(this.state))) return 'miss';

    // Se libérer d'une projection (Poing + Pied au bon moment, ou projection simultanée)
    if (atk.grab && atk.techable) {
      let teched = this.state === 'attack' && this.attack && this.attack.techable && this.attackFrame <= this.attack.startup + 2;
      if (!teched && this.controller instanceof AIController) teched = Math.random() < (this.controller.cfg.techChance || 0);
      else if (!teched) teched = this.pressedRecently('punch', game.frame, CONFIG.TECH_WINDOW) && this.pressedRecently('kick', game.frame, CONFIG.TECH_WINDOW);
      if (teched) { game.onTech(this, attacker); return 'blocked'; }
    }

    if (this.state === 'attack' && this.attack && !atk.grab) {
      const mine = this.attack;
      // Parade (posture de contre)
      if (mine.counter && this.attackFrame >= mine.counter.from && this.attackFrame <= mine.counter.to) {
        this.facing = Math.sign(attacker.x - this.x) || this.facing;
        game.onParry(this, attacker, impact);
        this.startAttack(mine.counter.riposte, game);
        return 'parried';
      }
      // Renvoi des projectiles
      if (opts.projectile && this.inWindow(mine.reflect) && facesSource) return 'reflect';
      // Guard point : bloque ce qui arrive de face
      if (this.inWindow(mine.guardPoint) && facesSource) {
        game.onGuardPoint(this, impact);
        return 'blocked';
      }
    }

    // Garde
    const guarding = this.onGround && (this.state === 'guard' || this.state === 'blockstun');
    const levelOk = level === 'mid' || (level === 'low' && this.guardLow) || (level === 'high' && !this.guardLow);
    const pushDir = atk.throwBehind ? -attacker.facing : (Math.sign(this.x - sourceX) || -this.facing);
    if (guarding && facesSource && levelOk && !atk.grab && !atk.unblockable) {
      this.hp = Math.max(1, this.hp - atk.damage * CONFIG.CHIP_DAMAGE / this.def.stats.defense);
      this.state = 'blockstun';
      this.stun = atk.blockstun;
      this.vx = pushDir * atk.knockback * 0.7;
      this.gainMeter(CONFIG.METER_ON_BLOCK);
      attacker.gainMeter(CONFIG.METER_ON_BLOCK);
      if (!opts.projectile) attacker.hitConfirmed = true;
      game.onImpact(attacker, this, atk, impact, true, 0, false);
      return 'blocked';
    }

    // Armure : on encaisse sans être interrompu
    if (this.state === 'attack' && this.armorLeft > 0 && this.attackPhase() !== 'recovery' && !atk.grab) {
      this.armorLeft--;
      this.hp = Math.max(game.training ? 1 : 0, this.hp - atk.damage * attacker.damageMul * 0.5 / this.def.stats.defense);
      this.flash = 6;
      game.onArmor(this, impact);
      if (this.hp <= 0) { this.state = 'ko'; this.vy = -4.5; this.vx = pushDir * 2.5; game.endRound(this, 'ko'); }
      return 'armored';
    }

    // Touché !
    const counterHit = this.state === 'attack' && this.attackPhase() === 'startup';
    attacker.comboCount = this.state === 'hurt' ? attacker.comboCount + 1 : 1;
    const scale = Math.max(CONFIG.MIN_COMBO_SCALING, 1 - (attacker.comboCount - 1) * CONFIG.COMBO_SCALING);
    const mul = opts.dmgMul || (atk.chargeable && atk === attacker.attack ? attacker.chargeMul : 1);
    const dmg = atk.damage * mul * attacker.damageMul * scale * (counterHit ? CONFIG.COUNTER_HIT_BONUS : 1) / this.def.stats.defense;
    const wasAir = !this.onGround;
    this.hp = Math.max(0, this.hp - dmg);
    if (game.training && this.hp <= 0) this.hp = 1;
    if (this.status.freeze > 0 && !(atk.status && atk.status.freeze)) { this.status.freeze = 0; game.shatter(this); }
    this.flash = 8;
    this.attack = null;
    this.state = 'hurt';
    this.hurtLow = !wasAir && impact.y > this.y - this.h * 0.45;
    const decay = Math.max(0, attacker.comboCount - 3) * CONFIG.HITSTUN_DECAY;
    this.stun = Math.max(8, Math.round(atk.hitstun + (counterHit ? 6 : 0) - decay));
    this.vx = pushDir * atk.knockback * (mul > 1 ? Math.min(1.6, mul) : 1);
    if (atk.launch) { this.vy = atk.launch; this.launched = true; }
    else if (atk.knockdown) { this.vy = Math.min(this.vy, -2.5); this.launched = true; }
    else if (wasAir) { this.vy = Math.min(this.vy, -2.5); this.launched = true; }
    if (wasAir || atk.launch) this.juggle++;
    if (!opts.projectile) attacker.hitConfirmed = true;
    if (atk.status) {
      if (atk.status.chill) this.status.chill = Math.max(this.status.chill, atk.status.chill);
      if (atk.status.root) { this.status.root = Math.max(this.status.root, atk.status.root); Sfx.play('net'); }
      if (atk.status.freeze) {
        this.status.freeze = atk.status.freeze;
        this.stun = Math.max(this.stun, atk.status.freeze);
        this.vx = 0;
        Sfx.play('freeze');
      }
    }
    attacker.gainMeter(atk.super ? 0 : CONFIG.METER_ON_HIT);
    this.gainMeter(CONFIG.METER_ON_TAKEN);
    game.onImpact(attacker, this, atk, impact, false, dmg, counterHit);

    if (this.hp <= 0) {
      this.state = 'ko';
      this.vy = -4.5;
      this.vx = pushDir * 2.5;
      game.endRound(this, 'ko');
    }
    return 'hit';
  }

  applyPhysics(game) {
    const wasAir = !this.onGround;
    if (this.status.freeze > 0 && this.onGround) this.vx = 0;
    this.vy += CONFIG.GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    if (this.y >= CONFIG.GROUND_Y) {
      this.y = CONFIG.GROUND_Y;
      const impactV = this.vy;
      this.vy = 0;
      if (wasAir) this.onLand(game, impactV);
    }
    if (this.onGround && ['hurt', 'blockstun', 'ko', 'down'].includes(this.state)) this.vx *= 0.82;
    this.clampToStage();
  }

  onLand(game, impactV) {
    if (this.state === 'jump') {
      this.state = 'land'; this.landTimer = CONFIG.LAND_FRAMES; this.vx = 0;
      game.dust(this.x, this.y, 3);
      Sfx.play('land');
    } else if (this.state === 'attack' && this.attackAir) {
      this.attack = null; this.state = 'land'; this.landTimer = CONFIG.AIR_LAND_FRAMES; this.vx = 0;
      game.dust(this.x, this.y, 4);
      Sfx.play('land');
    } else if (this.state === 'hurt') {
      if (this.launched) {
        this.state = 'down'; this.downTimer = CONFIG.DOWN_FRAMES;
        this.launched = false; this.juggle = 0; this.vx *= 0.3;
        game.knockdownFx(this, impactV);
      } else { this.vx *= 0.5; game.dust(this.x, this.y, 6); }
    } else if (this.state === 'ko') {
      this.vx *= 0.5;
      game.knockdownFx(this, impactV);
    }
  }

  clampToStage() { this.x = Math.max(this.minX, Math.min(this.maxX, this.x)); }
}
Fighter.attackCounter = 0;
