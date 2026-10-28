'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  POSES : squelette articulé calculé à partir de "poses clés"
 * ---------------------------------------------------------------------
 *  Une pose = { hand:[x,y] (main avant, relative à l'épaule avant),
 *    hand2:[x,y] (main arrière, relative à l'épaule arrière),
 *    ang (angle de l'arme, 0 = devant, -90 = haut), grip (1 ou 2 mains),
 *    lean, crouch, bob, footF/footB:[x,y], tilt (rotation du corps),
 *    wSpin (arme pivotée vers l'avant), wBehind (arme derrière le corps),
 *    sheathed (arme au fourreau) }
 * ===================================================================== */
const KP_DEFAULT = { lean: 0, crouch: 0, bob: 0, hand: [5, 6], hand2: null, ang: 20, grip: 2,
  footF: [4, 0], footB: [-4, 0], tilt: 0, wSpin: 0, wBehind: false, sheathed: 0, flip: 0 };
const HURT_POSE = { lean: -3, hand: [-4, 5], hand2: [-5, 4], footF: [6, 0], footB: [-6, 0], ang: 100, grip: 1, wBehind: false };
const KP_NUM = ['lean', 'crouch', 'bob', 'ang', 'tilt', 'wSpin', 'sheathed', 'flip'];
const FALL_POSE = { footF: [5, -3], footB: [-3, -1] };
const LOSE_POSE = { lean: -2, crouch: 4, hand: [2, 12], hand2: [1, 12], ang: 100, grip: 1, wBehind: false };
const KP_VEC = ['hand', 'hand2', 'footF', 'footB'];

function normKP(p) {
  if (!p.hand2) p.hand2 = [p.hand[0] - 1, p.hand[1] + 2];
  return p;
}
function lerpKP(a, b, k) {
  const o = Object.assign({}, a);
  for (const n of KP_NUM) o[n] = a[n] + (b[n] - a[n]) * k;
  for (const n of KP_VEC) o[n] = [a[n][0] + (b[n][0] - a[n][0]) * k, a[n][1] + (b[n][1] - a[n][1]) * k];
  o.grip = k < 0.5 ? a.grip : b.grip;
  o.wBehind = k < 0.5 ? a.wBehind : b.wBehind;
  return o;
}

function phaseOf(a, f) {
  if (f <= a.startup) return 'startup';
  if (f <= a.startup + a.active) return 'active';
  return 'recovery';
}

const Pose = {
  make(def, name) {
    const S = def.stance;
    const extra = name === 'hurt' ? HURT_POSE : name === 'fall' ? FALL_POSE : name === 'lose' ? LOSE_POSE : null;
    return normKP(Object.assign({}, KP_DEFAULT, S.idle, extra, name && name !== 'idle' ? S[name] : null));
  },

  /* Pose clé pour l'état courant (frame = image d'attaque à simuler, optionnelle) */
  key(f, frame) {
    const def = f.def, S = def.stance, t = f.animTime || 0, H = def.hitbox.h, loco = def.locomotion;
    let p;
    switch (f.state) {
      case 'walk': {
        p = this.make(def, 'walk');
        if (loco === 'ginga') {                      // balancement de capoeira, plus ample en marchant
          this.ginga(p, t * 1.6, f.def.stance);
        } else if (loco === 'skate') {
          const s = Math.sin(t * 0.12);
          p.footF = [4 + s * 5, 0]; p.footB = [-4 - s * 5, 0]; p.lean += 1;
        } else {
          const heavy = loco === 'stomp', back = (f.vx || 0) * f.facing < 0 ? -1 : 1;
          const ph = t * (heavy ? 0.15 : 0.22) * back, s = Math.sin(ph), st = heavy ? 5 : 4;
          p.footF = [3 + s * st, s > 0.3 ? -Math.round(s * 3) : 0];
          p.footB = [-3 - s * st, s < -0.3 ? Math.round(s * 3) : 0];
          p.bob += Math.abs(Math.cos(ph)) > 0.75 ? (heavy ? 2 : 1) : 0;
        }
        break;
      }
      case 'dash': {
        p = this.make(def, 'walk');
        const fwd = f.dashDir === 1;
        p.lean += fwd ? 3 : -3;
        p.footF = fwd ? [8, 0] : [3, -3];
        p.footB = fwd ? [-7, -3] : [-8, 0];
        break;
      }
      case 'crouch':
        p = this.make(def, 'crouch');
        if (!(S.crouch && S.crouch.crouch)) p.crouch = Math.round(H * 0.26);
        if (!(S.crouch && S.crouch.footF)) { p.footF = [7, 0]; p.footB = [-6, 0]; }
        break;
      case 'guard': case 'blockstun':
        p = this.make(def, 'guard');
        if (f.state === 'blockstun') p.lean -= 1;
        if (f.guardLow) { p.crouch = Math.max(p.crouch, Math.round(H * 0.26)); p.footF = [7, 0]; p.footB = [-6, 0]; }
        break;
      case 'jump':
        if ((f.vy || 0) > 1.2) {                     // descente : jambes tendues vers le sol
          p = this.make(def, 'fall');
          if (S.jump && S.jump.hand && !(S.fall && S.fall.hand)) { p.hand = S.jump.hand.slice(); if (S.jump.hand2) p.hand2 = S.jump.hand2.slice(); if (S.jump.ang != null) p.ang = S.jump.ang; if (S.jump.grip) p.grip = S.jump.grip; }
        } else {
          p = this.make(def, 'jump');
          if (!(S.jump && S.jump.footF)) { p.footF = [5, -8]; p.footB = [-2, -5]; }
        }
        break;
      case 'land':                                   // réception : on amortit
        p = this.make(def, 'land');
        p.crouch = Math.max(p.crouch, Math.round(H * 0.16));
        p.footF = [7, 0]; p.footB = [-6, 0];
        break;
      case 'hurt': case 'ko': case 'down':
        p = this.make(def, 'hurt');
        if (f.state === 'hurt' && f.hurtLow) { p.lean = 3; p.crouch = Math.max(p.crouch, 4); p.hand = [3, 9]; p.hand2 = [2, 9]; }
        if (f.state === 'down' || (f.state === 'ko' && f.y >= CONFIG.GROUND_Y)) { p.tilt = -90; p.footF = [1, 0]; p.footB = [-1, 0]; }
        else if (f.state === 'ko' || (f.state === 'hurt' && f.y < CONFIG.GROUND_Y - 6 && (f.vy || 0) < 0)) p.tilt = f.state === 'ko' ? -35 : -15;
        break;
      case 'wakeup': {                               // se relève (tilt -90 → 0)
        p = this.make(def, 'hurt');
        const k = clamp(1 - (f.wakeTimer || 0) / CONFIG.WAKE_FRAMES, 0, 1);
        p.tilt = -90 * (1 - easeOut(k));
        p.crouch = Math.round(H * 0.25 * (1 - k));
        p.footF = [3, 0]; p.footB = [-3, 0];
        break;
      }
      case 'lose':
        p = this.make(def, 'lose');
        break;
      case 'win':
        p = this.make(def, 'win');
        p.bob = Math.floor(t / 14) % 2;
        break;
      case 'attack':
        p = f.attack ? this.attackKey(f, frame) : this.make(def, 'idle');
        break;
      default:
        p = this.make(def, 'idle');
        if (loco === 'ginga') this.ginga(p, t, S);
        else p.bob += loco === 'skate' ? Math.round((Math.sin(t * 0.2) + 1) * 0.8)
          : Math.floor(t / (loco === 'stomp' ? 26 : 20)) % 2;
    }
    return p;
  },

  /* Ginga : pas de balancier de la capoeira (jambe arrière qui va et vient, bras qui protègent le visage) */
  ginga(p, t, S) {
    const s = Math.sin(t * 0.09), k = (s + 1) / 2;
    p.footF = [4 + Math.max(0, -s) * 5, 0];
    p.footB = [-4 - Math.max(0, s) * 7, 0];
    p.lean += Math.round(s * 2);
    p.crouch += 3 + Math.round(Math.abs(s) * 2);
    const up = (S.idle && S.idle.guardHand) || [3, -6], down = (S.idle && S.idle.lowHand) || [6, 5];
    p.hand = [lerp(down[0], up[0], k), lerp(down[1], up[1], k)];
    p.hand2 = [lerp(up[0] + 4, down[0], k), lerp(up[1] + 1, down[1], k)];
  },

  /* Interpolation repos → armé (windup) → frappe (strike) → repos.
   * anim.linear : interpolation régulière pendant la phase active (vrilles)
   * anim.flurry : alterne armé/frappe en boucle (rafales multi-coups) */
  attackKey(f, frame) {
    const def = f.def, a = f.attack, an = a.anim || {};
    const fr = frame != null ? frame : f.attackFrame;
    const base = this.make(def, f.attackAir ? 'jump' : 'idle');
    if (f.attackAir && !(def.stance.jump && def.stance.jump.footF)) { base.footF = [5, -8]; base.footB = [-2, -5]; }
    const W = normKP(Object.assign({}, base, an.windup)), S = normKP(Object.assign({}, base, an.strike));
    const s = Math.max(1, a.startup), act = Math.max(1, a.active), rec = Math.max(1, a.recovery);
    if (fr <= s) return lerpKP(base, W, easeOut(fr / s));
    if (fr <= s + act) {
      let kp;
      if (an.flurry) {
        const per = an.flurry === true ? 8 : an.flurry;
        const ph = ((fr - s) % per) / per;
        kp = lerpKP(W, S, ph < 0.5 ? easeOut(ph * 2) : 1 - easeOut((ph - 0.5) * 2));
      } else {
        const q = (fr - s) / act;
        kp = lerpKP(W, S, an.linear ? q : easeOut(Math.min(1, q / 0.4)));
      }
      if (an.spin) kp.flip = Math.floor((fr - s) / (an.spin === true ? 3 : an.spin)) % 2;   // rotation sur soi-même
      return kp;
    }
    const S2 = Object.assign({}, S, { tilt: S.tilt % 360, flip: 0 });
    return lerpKP(S2, base, easeInOut(Math.min(1, (fr - s - act) / rec)));
  },

  /* Squelette complet en coordonnées locales (pieds en 0,0, tourné vers la droite) */
  compute(f, frame) {
    const def = f.def, B = def.body, p = this.key(f, frame);
    const hipY = B.hipY + Math.round(p.crouch) + Math.round(p.bob);
    const lean = Math.round(p.lean);
    const hip = { x: Math.round(lean * 0.3), y: hipY };
    const sh = { x: lean, y: hipY - B.torso };
    const half = Math.round(B.shoulderW / 2);
    const sF = { x: sh.x + half - 3, y: sh.y + 2 }, sB = { x: sh.x - half + 3, y: sh.y + 2 };
    const head = { x: sh.x - Math.floor(B.headW / 2) + 1, y: sh.y - B.neck - B.headH, w: B.headW, h: B.headH };
    const wpn = def.weapon ? WEAPONS[def.weapon.type] : null;
    const dir = { x: Math.cos(p.ang * DEG), y: Math.sin(p.ang * DEG) };
    const hF = { x: sF.x + p.hand[0], y: sF.y + p.hand[1] };
    const twoH = !!(wpn && wpn.twoHanded && p.grip === 2 && !f.weaponOut && p.sheathed < 0.5);
    const hB = twoH ? { x: hF.x - dir.x * wpn.spread, y: hF.y - dir.y * wpn.spread }
      : { x: sB.x + p.hand2[0], y: sB.y + p.hand2[1] };
    const eF = ik(sF, hF, B.arm, 1, false).j, eB = ik(sB, hB, B.arm, 1, false).j;
    const lift = B.footLift;
    const hipF = { x: hip.x + 1, y: hip.y }, hipB = { x: hip.x - 2, y: hip.y };
    const lf = ik(hipF, { x: p.footF[0], y: p.footF[1] - lift }, B.leg, -1, true);
    const lb = ik(hipB, { x: p.footB[0], y: p.footB[1] - lift }, B.leg, -1, true);
    let tip;
    if (wpn && wpn.dual) {
      const a = Math.atan2(hF.y - eF.y, hF.x - eF.x), L = p.wSpin > 0.5 ? (wpn.reach || 11) : 3;
      tip = { x: hF.x + Math.cos(a) * L, y: hF.y + Math.sin(a) * L };
    } else {
      const L = wpn ? wpn.length : 3;
      tip = { x: hF.x + dir.x * L, y: hF.y + dir.y * L };
    }
    const t = f.animTime || 0;
    const sway = Math.min(3, Math.abs(f.vx || 0) * 1.3) + (f.y < CONFIG.GROUND_Y ? 1.5 : 0) + Math.sin(t * 0.07) * 0.6;
    const fr = frame != null ? frame : f.attackFrame;
    const phase = f.state === 'attack' && f.attack ? phaseOf(f.attack, fr) : null;
    const grounded = (f.state === 'ko' || f.state === 'down' || f.state === 'wakeup') && f.y >= CONFIG.GROUND_Y;
    const pivot = grounded ? { x: 0, y: -Math.round(B.shoulderW / 2) } : { x: 0, y: hipY - 4 };
    const row = y => {
      const k = clamp((y - sh.y) / (hip.y - sh.y), 0, 1);
      const w = Math.round(B.shoulderW + (B.hipW - B.shoulderW) * k);
      return { x: Math.round(sh.x + (hip.x - sh.x) * k - w / 2), w };
    };
    return { B, p, hip, sh, sF, sB, head, hF, hB, eF, eB, hipF, hipB, kF: lf.j, kB: lb.j, fF: lf.end, fB: lb.end,
      dir, tip, twoH, ang: p.ang, wSpin: p.wSpin, wBehind: p.wBehind, sheathed: p.sheathed > 0.5, flip: p.flip > 0.5,
      tilt: p.tilt, pivot, sway, t, phase, row };
  },
};
