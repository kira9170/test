'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  PROJECTILES
 * ---------------------------------------------------------------------
 *  Propriétés reconnues dans attack.projectile :
 *   shape        forme (clé de PROJECTILE_ART)
 *   speed, vy    vitesse horizontale / verticale     gravity  chute (lancer en cloche)
 *   w, h, y      taille, hauteur (relative aux pieds) life     durée de vie (frames)
 *   fromTip      part de la pointe de l'arme          level    'mid' | 'low' | 'high'
 *   hits, hitEvery   projectile multi-coups           tether   revient vers le lanceur
 *   pattern      'rain' (tombe sur l'adversaire), 'fan' (éventail), 'erupt' (jaillit du sol)
 *   follow       reste collé à l'arme du lanceur (rayon)
 *   stationary   ne bouge pas                         activeFrom  frames avant de pouvoir toucher
 *   burst        { shape, w, h, life, hits... } projectile créé à l'atterrissage
 *   bounce       nombre de rebonds au sol (bounceDamp = amortissement)
 *   wave         { amp, freq } trajectoire ondulée
 *   homing       vitesse de virage vers l'adversaire (radians / frame)
 *   pattern 'stream'  plusieurs projectiles à la suite (count, interval)
 *   minion       { speed, range, every, windup, active, hp } : créature qui marche vers
 *                l'adversaire et frappe (hits = nombre d'attaques), destructible
 *   growWithCharge  la taille augmente avec la charge (attaques chargeables)
 * ===================================================================== */
class Projectile {
  constructor(owner, atk, opts = {}) {
    const s = atk.projectile;
    this.id = ++Projectile.counter;
    this.owner = owner;
    this.attack = atk;
    this.spec = s;
    this.shape = s.shape || 'orb';
    this.w = s.w || 10; this.h = s.h || 10;
    this.x = opts.x != null ? opts.x : owner.x + owner.facing * (owner.w / 2 + this.w / 2);
    this.y = opts.y != null ? opts.y : owner.y + (s.y != null ? s.y : -32);
    this.vx = opts.vx != null ? opts.vx : owner.facing * (s.speed || 3);
    this.vy = opts.vy != null ? opts.vy : (s.vy || 0);
    this.dir = Math.sign(this.vx) || owner.facing;
    this.delay = opts.delay || 0;
    this.life = s.life || 120;
    this.t = 0;
    this.gravity = s.gravity || 0;
    this.stationary = !!(s.stationary || s.follow);
    this.hitsLeft = s.hits || 1;
    this.hitEvery = s.hitEvery || 8;
    this.cool = 0;
    this.level = s.level || atk.level || 'mid';
    this.tether = !!s.tether;
    this.returning = false;
    this.spent = false;
    this.dead = false;
    this.landed = false;
    this.dmgMul = opts.dmgMul || 1;
    this.bounces = s.bounce || 0;
    this.baseY = this.y;
    if (s.minion) {
      this.minion = Object.assign({ speed: 1.2, range: 16, every: 34, windup: 10, active: 6, hp: 2 }, s.minion);
      this.minionHp = this.minion.hp;
      this.mState = 'walk';
      this.mTimer = 0;
      this.stationary = true;          // se déplace par lui-même
      this.lastHitBy = -1;
    }
  }

  get live() {
    if (this.minion) return !this.dead && this.attackingNow && this.cool <= 0;
    return !this.dead && !this.spent && this.delay <= 0 && this.cool <= 0 && this.t >= (this.spec.activeFrom || 0);
  }

  get attackingNow() {
    const m = this.minion;
    return this.mState === 'attack' && this.mTimer >= m.windup && this.mTimer < m.windup + m.active;
  }

  update(game) {
    if (this.delay > 0) { this.delay--; return; }
    this.t++;
    if (this.cool > 0) this.cool--;
    if (this.minion && game) {
      const tgt = game.opponentOf(this.owner), dx = tgt.x - this.x, m = this.minion;
      if (this.mState === 'walk') {
        this.dir = Math.sign(dx) || this.dir;
        if (Math.abs(dx) > m.range + tgt.w / 2) this.x += this.dir * m.speed;
        else { this.mState = 'attack'; this.mTimer = 0; }
      } else if (++this.mTimer >= m.every) this.mState = 'walk';
      this.y = CONFIG.GROUND_Y - this.h / 2;
    }
    if (this.spec.homing && game && !this.minion) {
      const tgt = game.opponentOf(this.owner);
      const want = Math.atan2(tgt.y - tgt.h * 0.55 - this.y, tgt.x - this.x), cur = Math.atan2(this.vy, this.vx);
      let d = want - cur;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const na = cur + clamp(d, -this.spec.homing, this.spec.homing), sp = Math.hypot(this.vx, this.vy);
      this.vx = Math.cos(na) * sp; this.vy = Math.sin(na) * sp;
      this.dir = Math.sign(this.vx) || this.dir;
    }
    if (this.spec.follow) {
      const o = this.owner;
      if (o.state !== 'attack') { this.dead = true; return; }
      const tip = o.tipWorld();
      this.x = tip.x + o.facing * this.w / 2;
      this.y = tip.y;
      this.dir = o.facing;
    }
    if (this.tether) {
      const W = CONFIG.WIDTH;
      if (!this.returning && (this.t >= (this.spec.returnAt || 20) || this.x < 8 || this.x > W - 8)) this.returning = true;
      if (this.returning) {
        const o = this.owner, dx = o.x + o.facing * 10 - this.x;
        this.vx = Math.sign(dx) * Math.max(4, Math.abs(this.spec.speed || 4));
        if (Math.abs(dx) <= Math.abs(this.vx) + 1) this.dead = true;
      }
    }
    if (!this.stationary) {
      this.x += this.vx;
      if (this.spec.wave) {
        this.baseY += this.vy;
        this.y = this.baseY + Math.sin(this.t * this.spec.wave.freq) * this.spec.wave.amp;
      } else this.y += this.vy;
      this.vy += this.gravity;
      if ((this.vy > 0 || this.gravity) && !this.spec.wave && this.y + this.h / 2 >= CONFIG.GROUND_Y) {
        this.y = CONFIG.GROUND_Y - this.h / 2;
        if (this.bounces > 0) {
          this.bounces--;
          this.vy = -Math.abs(this.vy) * (this.spec.bounceDamp || 0.7);
          if (game) game.dust(this.x, CONFIG.GROUND_Y, 3);
          Sfx.play('bounce');
        } else {
          this.dead = true;
          this.landed = true;
        }
      }
    }
    if (--this.life <= 0 && (!this.tether || this.life < -90)) this.dead = true;
    if (this.x < -60 - this.w || this.x > CONFIG.WIDTH + 60 + this.w) this.dead = true;
  }

  /* appelé quand le projectile touche ou se heurte à un autre */
  kill() {
    if (this.tether) { this.spent = true; this.returning = true; return; }
    if (this.minion) {
      if (--this.hitsLeft > 0) { this.cool = this.minion.every; return; }
      this.dead = true; return;
    }
    if (--this.hitsLeft > 0) { this.cool = this.hitEvery; return; }
    this.dead = true;
  }

  rect() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }
}
Projectile.counter = 0;
