'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  RENDU DES COMBATTANTS + EFFETS GÉNÉRIQUES
 * ---------------------------------------------------------------------
 *  Ordre des couches : dos → bras arrière → jambes → torse → tête
 *  → arme → bras avant. Les PARTS ajoutent des détails sur chaque couche
 *  (back, legs, body, head, front), les WEAPONS dessinent l'arme.
 * ===================================================================== */

const SpriteBank = {
  cache: new Map(),
  load(spec) {
    if (typeof spec === 'string') spec = { src: spec };
    let entry = this.cache.get(spec.src);
    if (!entry) {
      const img = new Image();
      entry = { img, ok: false };
      img.onload = () => { entry.ok = true; };
      img.onerror = () => { entry.failed = true; console.warn('Sprite introuvable :', spec.src); };
      img.src = spec.src;
      this.cache.set(spec.src, entry);
    }
    return entry.ok ? { img: entry.img, spec } : null;
  },
  resolve(f) {
    const sprites = f.def.sprites;
    if (!sprites || !Object.keys(sprites).length) return null;
    const chainByState = { idle: ['idle'], walk: ['walk', 'idle'], dash: ['walk', 'idle'], crouch: ['crouch', 'idle'],
      guard: ['guard', 'idle'], blockstun: ['guard', 'hurt', 'idle'], jump: ['jump', 'idle'], hurt: ['hurt', 'idle'],
      ko: ['ko', 'hurt', 'idle'], win: ['win', 'idle'] };
    const chain = f.state === 'attack' && f.attack ? [f.attack.sprite, 'attack', 'idle'].filter(Boolean)
      : (chainByState[f.state] || ['idle']);
    for (const key of chain) {
      if (!sprites[key]) continue;
      const res = this.load(sprites[key]);
      if (res) return res;
    }
    return null;
  },
};

const Renderer = {
  /* opts.tint = silhouette d'une seule couleur (rémanences) */
  drawFighter(ctx, f, opts = {}) {
    // disparition pendant une téléportation
    if (!opts.tint && f.state === 'attack' && f.attack && f.attack.teleport) {
      const fr = f.attackFrame, s = f.attack.startup;
      if (fr > s - 5 && fr <= s) return;
    }
    ctx.save();
    ctx.translate(Math.round(f.x), Math.round(f.y));
    if (f.facing < 0) ctx.scale(-1, 1);
    // clignotement pendant l'invulnérabilité (relevé, esquive)
    if (!opts.tint && f.isInvulnerable && f.isInvulnerable(true) && (f.animTime || 0) % 4 < 2) ctx.globalAlpha *= 0.55;
    const a0 = ctx.globalAlpha;
    if (!opts.tint) {
      const rage = f.buffs && f.buffs.rage > 0;
      const haste = f.buffs && f.buffs.haste > 0;
      const armor = f.state === 'attack' && f.attack && f.attack.armor && f.armorLeft > 0
        && f.attackFrame <= f.attack.startup + f.attack.active;
      const charging = f.state === 'attack' && f.chargeFrames > 0 && f.attack && f.attackFrame < f.attack.startup;
      const guardPt = f.state === 'attack' && f.attack && f.attack.guardPoint && f.inWindow && f.inWindow(f.attack.guardPoint);
      if (rage || armor || charging || haste || guardPt) {        // aura (contour coloré)
        const col = charging ? (f.chargeFrames >= f.attack.chargeable.max ? '#ffffff' : '#ffd166')
          : armor ? '#ffb347' : guardPt ? '#bfe3ff' : rage ? '#ff2e2e' : '#9fdcff';
        ctx.globalAlpha = a0 * (0.45 + 0.25 * Math.sin((f.animTime || 0) * 0.4));
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          ctx.save(); ctx.translate(dx, dy); this.drawBody(ctx, f, col); ctx.restore();
        }
        ctx.globalAlpha = a0;
      }
    }
    this.drawBody(ctx, f, opts.tint || null);
    if (!opts.tint && f.status) {
      if (f.status.chill > 0) { ctx.globalAlpha = a0 * 0.4; this.drawBody(ctx, f, '#a8e6ff'); ctx.globalAlpha = a0; }
      if (f.status.freeze > 0) this.drawIce(ctx, f);
      if (f.status.root > 0) this.drawNet(ctx, f);
    }
    ctx.restore();
  },

  drawNet(ctx, f) {
    const w = f.def.hitbox.w + 6, h = Math.round(f.def.hitbox.h * 0.75), a0 = ctx.globalAlpha;
    ctx.globalAlpha = a0 * 0.85;
    ctx.fillStyle = '#d8c79a';
    for (let i = -w; i <= w; i += 5) {
      pxLine(ctx, -w / 2 + i, -h, -w / 2 + i + h * 0.6, 0, 1);
      pxLine(ctx, w / 2 - i, -h, w / 2 - i - h * 0.6, 0, 1);
    }
    ctx.globalAlpha = a0;
  },

  drawBody(ctx, f, tint) {
    const sprite = tint ? null : SpriteBank.resolve(f);
    if (sprite) this.drawSprite(ctx, f, sprite);
    else this.drawProcedural(ctx, f, tint);
  },

  drawIce(ctx, f) {
    const w = f.def.hitbox.w + 8, h = f.def.hitbox.h + 4, a0 = ctx.globalAlpha;
    ctx.globalAlpha = a0 * 0.5;
    R(ctx, -w / 2, -h, w, h, '#bfefff');
    ctx.globalAlpha = a0 * 0.9;
    R(ctx, -w / 2, -h, w, 1, '#ffffff');
    R(ctx, -w / 2, -h, 1, h, '#e8fbff');
    R(ctx, w / 2 - 1, -h, 1, h, '#6fc6ee');
    R(ctx, -w / 2, -1, w, 1, '#6fc6ee');
    ctx.fillStyle = '#ffffff';
    pxLine(ctx, -w / 2 + 3, -h + 6, -w / 2 + 9, -h + 12, 1);
    pxLine(ctx, w / 2 - 6, -h / 2, w / 2 - 3, -h / 2 + 3, 1);
    ctx.globalAlpha = a0;
  },

  drawSprite(ctx, f, { img, spec }) {
    const frames = spec.frames || 1;
    const fw = spec.frameWidth || img.width / frames;
    const fh = spec.frameHeight || img.height;
    let idx;
    if (f.state === 'attack' && f.attack) {
      const total = f.attack.startup + f.attack.active + f.attack.recovery;
      idx = Math.min(frames - 1, Math.floor(f.attackFrame / total * frames));
    } else {
      const n = Math.floor(f.animTime * (spec.fps || 8) / 60);
      idx = spec.loop === false ? Math.min(frames - 1, n) : n % frames;
    }
    const sc = spec.scale || 1;
    if (f.flash > 0 && f.flash % 2) ctx.filter = 'brightness(3)';
    ctx.drawImage(img, idx * fw, 0, fw, fh,
      Math.round(-fw * sc / 2 + (spec.offsetX || 0)), Math.round(-fh * sc + (spec.offsetY || 0)),
      Math.round(fw * sc), Math.round(fh * sc));
    ctx.filter = 'none';
  },

  drawProcedural(ctx, f, tint) {
    const def = f.def, P = f.palette || def.palette, B = def.body;
    const J = Pose.compute(f);
    const g = Painter(ctx, P, tint, !tint && f.flash > 0 && f.flash % 2 === 0);
    const W = def.weapon ? WEAPONS[def.weapon.type] : null;
    const showW = !!W && !f.weaponOut;
    const parts = def.parts.map(n => PARTS[n]).filter(Boolean);
    const layer = name => { for (const pt of parts) if (pt[name]) pt[name](g, J, P, f); };
    const handAxis = (e, h) => axis(h.x, h.y, Math.atan2(h.y - e.y, h.x - e.x) / DEG);
    const hideHands = showW && W.coversHand;

    ctx.save();
    if (J.tilt) {
      ctx.translate(J.pivot.x, J.pivot.y);
      ctx.rotate(J.tilt * DEG);
      ctx.translate(-J.pivot.x, -J.pivot.y);
    }
    if (J.flip) ctx.scale(-1, 1);

    layer('back');
    if (showW && !W.dual && J.wBehind) W.draw(g, axis(J.hF.x, J.hF.y, J.ang), f, J, true);

    // Bras arrière : haut du bras derrière le torse ; avant-bras devant si la main passe devant le corps
    const backInFront = J.twoH || J.hB.x > J.sh.x;
    const foreArm = (e, h, front) => g.L(e, h, B.armT, B.sleeves === 'short' ? (front ? 'skin' : 'skinShade') : (front ? 'sleeve' : 'sleeveShade'));
    const hand = (h, front) => { if (!hideHands) g.R(h.x - 2, h.y - 2, B.armT + 1, B.armT + 1, front ? 'glove' : 'gloveShade'); };
    const backForearm = () => {
      foreArm(J.eB, J.hB, false);
      if (showW && W.dual) W.draw(g, handAxis(J.eB, J.hB), f, J, false);
      hand(J.hB, false);
    };
    g.L(J.sB, J.eB, B.armT, 'sleeveShade');
    if (!backInFront) backForearm();

    // Jambes
    for (const [hip, knee, foot, front] of [[J.hipB, J.kB, J.fB, false], [J.hipF, J.kF, J.fF, true]]) {
      const k = front ? 'pants' : 'pantsShade';
      g.L(hip, knee, B.legT, k);
      g.L(knee, { x: foot.x, y: foot.y - 2 }, B.legT - 1, k);
      g.R(foot.x - 2, foot.y - 3, B.legT + 3, 3, front ? 'shoes' : 'shoesShade');
    }
    layer('legs');

    // Cou + torse
    g.R(J.sh.x - 1, J.sh.y - B.neck - 1, 3, B.neck + 2, 'skinShade');
    for (let y = J.sh.y; y <= J.hip.y; y++) {
      const r = J.row(y), top = y === J.sh.y;
      g.R(r.x + (top ? 1 : 0), y, r.w - (top ? 2 : 0), 1, 'top');
      g.R(r.x + (top ? 1 : 0), y, 1, 1, 'topShade');
    }
    layer('body');

    // Tête
    this.drawHead(g, J, f, parts);
    layer('head');

    if (backInFront) backForearm();
    if (showW && !W.dual && !J.wBehind) W.draw(g, axis(J.hF.x, J.hF.y, J.ang), f, J, true);

    // Bras avant
    g.L(J.sF, J.eF, B.armT, 'sleeve');
    foreArm(J.eF, J.hF, true);
    if (showW && W.dual) W.draw(g, handAxis(J.eF, J.hF), f, J, true);
    hand(J.hF, true);
    layer('front');
    ctx.restore();
  },

  drawHead(g, J, f, parts) {
    const h = J.head;
    g.R(h.x, h.y, h.w, h.h, 'skin');
    g.R(h.x, h.y + h.h - 2, 3, 2, 'skinShade');
    g.R(h.x + 2, h.y + Math.round(h.h * 0.45), 2, 2, 'skinShade');
    const ex = h.x + h.w - 3, ey = h.y + Math.round(h.h * 0.42);
    g.R(h.x + h.w, ey + 1, 1, 2, 'skin');                        // nez
    const hurt = f.state === 'hurt' || f.state === 'ko';
    if (!parts.some(p => p.hidesEyes)) {
      if (hurt) g.R(ex - 1, ey + 1, 3, 1, 'eye');
      else { g.R(ex - 1, ey, 1, 2, 'eyeWhite'); g.R(ex, ey, 1, 2, 'eye'); }
      g.R(ex - 2, ey - 2 - (hurt ? 1 : 0), 4, 1, 'brow');
    }
    if (hurt) g.R(h.x + h.w - 2, ey + 4, 2, 2, 'mouth');
    else if (f.state === 'win') g.R(h.x + h.w - 3, ey + 4, 3, 1, 'mouth');
    else if (f.state === 'attack') g.R(h.x + h.w - 2, ey + 4, 2, 1, 'mouth');
  },

  drawProjectile(ctx, p) {
    const art = PROJECTILE_ART[p.shape] || PROJECTILE_ART.orb;
    if (p.delay > 0) {                                         // annonce (pluie, éruption…)
      if (art.telegraph) art.telegraph(ctx, p);
      else if (p.delay < 30 && (p.delay >> 2) % 2) {
        R(ctx, p.x - 4, CONFIG.GROUND_Y - 1, 9, 1, p.spec.color || '#ffffff');
        R(ctx, p.x, CONFIG.GROUND_Y - 3, 1, 3, p.spec.color || '#ffffff');
      }
      return;
    }
    (art.draw || art)(ctx, p);
  },
};

/* ---------------------------------------------------------------------
 *  EFFETS GÉNÉRIQUES (FX). Chaque entrée : { life, at, draw(ctx, e) }
 *  at = où l'effet apparaît quand il est déclaré dans attack.fx :
 *       'tip' (pointe de l'arme), 'body' (centre du corps), 'ground', 'front'
 *  e.P = palette du lanceur, e.facing = orientation.
 * --------------------------------------------------------------------- */
Object.assign(FX, {
  /* Arc de taille qui suit le mouvement de l'arme (calculé par le combattant) */
  arc: {
    life: 12,
    draw(ctx, e) {
      const p = 1 - e.life / e.max, span = e.a1 - e.a0;
      const start = e.a0 + span * Math.min(1, p * 1.3);
      const steps = Math.ceil(Math.abs(span) * e.r * 1.2);
      ctx.globalAlpha = 1 - p * 0.5;
      for (let i = 0; i <= steps; i++) {
        const s = i / steps, a = e.a0 + span * s;
        if ((span > 0 && a < start) || (span < 0 && a > start)) continue;
        const w = Math.max(1, Math.round(e.width * Math.sin(Math.PI * Math.min(1, s * 1.05)) * (1 - p * 0.6)));
        const ca = Math.cos(a), sa = Math.sin(a);
        for (let d = 0; d < w; d++) {
          const rr = e.r + 1 - d;
          ctx.fillStyle = d === 0 ? '#ffffff' : d < w * 0.5 ? e.core : e.edge;
          ctx.fillRect(Math.round(e.x + e.facing * ca * rr), Math.round(e.y + sa * rr), 1, 1);
        }
      }
      ctx.globalAlpha = 1;
    },
  },
  muzzle: {
    life: 7, at: 'tip',
    draw(ctx, e) {
      const n = e.max - e.life, x = Math.round(e.x), y = Math.round(e.y), s = n < 3 ? 5 : 3;
      R(ctx, x, y - 1, e.facing * (s + 5), 3, e.P.accent || '#ffd166');
      R(ctx, x - s, y, s * 2 + 1, 1, '#fff3b0');
      R(ctx, x, y - s + 1, 1, (s - 1) * 2 + 1, '#fff3b0');
      R(ctx, x - 1, y - 1, 3, 3, '#ffffff');
    },
  },
  ring: {
    life: 22, at: 'ground',
    draw(ctx, e) {
      const p = 1 - e.life / e.max, rx = 4 + p * (e.r || 46), ry = Math.max(1, rx * 0.2);
      ctx.globalAlpha = 1 - p;
      for (let i = 0; i < 48; i++) {
        const a = i / 48 * Math.PI * 2;
        R(ctx, e.x + Math.cos(a) * rx, e.y + Math.sin(a) * ry - 1, 2, 1, i % 2 ? '#ffffff' : (e.P.accent || '#e0fbff'));
      }
      ctx.globalAlpha = 1;
    },
  },
  lightning: {
    life: 14, at: 'body',
    draw(ctx, e) {
      const cols = [e.P.neon || e.P.accent, '#ffffff', e.P.neon2 || e.P.accent];
      const r = e.r || 34, n = e.n || 6;
      for (let b = 0; b < n; b++) {
        let x = e.x, y = e.y;
        const a = Math.random() * Math.PI * 2;
        ctx.fillStyle = cols[b % cols.length];
        for (let s = 0; s < 4; s++) {
          const nx = x + Math.cos(a) * r / 4 + (Math.random() - 0.5) * 6;
          const ny = y + Math.sin(a) * r / 4 + (Math.random() - 0.5) * 6;
          pxLine(ctx, x, y, nx, ny, 1);
          x = nx; y = ny;
        }
      }
      if (e.life > e.max / 2) R(ctx, e.x - 2, e.y - 2, 5, 5, '#ffffff');
    },
  },
  /* petit éclair d'impact */
  zap: {
    life: 10,
    draw(ctx, e) { FX.lightning.draw(ctx, Object.assign({}, e, { r: 14, n: 4 })); },
  },
  /* bouffées de fumée / vapeur */
  smoke: {
    life: 24, at: 'body',
    draw(ctx, e) {
      const p = 1 - e.life / e.max, col = e.color || '#b8b8c8';
      ctx.globalAlpha = (1 - p) * 0.8;
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2 + i;
        const d = 3 + p * (e.r || 14);
        disc(ctx, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d * 0.7 - p * 6, Math.max(1, Math.round(5 - p * 3)), col);
      }
      ctx.globalAlpha = 1;
    },
  },
  steam: {
    life: 16, at: 'tip',
    draw(ctx, e) { FX.smoke.draw(ctx, Object.assign({}, e, { color: '#eef0f6', r: 10 })); },
  },
  /* entailles de lame qui se croisent sur la cible */
  cuts: {
    life: 16,
    draw(ctx, e) {
      const p = 1 - e.life / e.max;
      if (!e.lines) e.lines = Array.from({ length: 4 }, () => ({ a: Math.random() * Math.PI, l: 10 + Math.random() * 10 }));
      ctx.globalAlpha = 1 - p * 0.7;
      for (const l of e.lines) {
        const len = l.l * Math.min(1, p * 4 + 0.2), dx = Math.cos(l.a) * len, dy = Math.sin(l.a) * len;
        ctx.fillStyle = e.P.slashEdge || '#ffffff';
        pxLine(ctx, e.x - dx, e.y - dy + 1, e.x + dx, e.y + dy + 1, 1);
        ctx.fillStyle = '#ffffff';
        pxLine(ctx, e.x - dx, e.y - dy, e.x + dx, e.y + dy, 1);
      }
      ctx.globalAlpha = 1;
    },
  },
  /* croissant de coup de pied / de balayage devant le combattant */
  swoosh: {
    life: 10, at: 'front',
    draw(ctx, e) {
      const p = 1 - e.life / e.max, r = 14 + p * 6;
      ctx.globalAlpha = 1 - p;
      for (let i = 0; i <= 24; i++) {
        const a = (-110 + i * 9) * DEG, w = Math.max(1, Math.round(3 * Math.sin(i / 24 * Math.PI)));
        for (let d = 0; d < w; d++) {
          ctx.fillStyle = d === 0 ? '#ffffff' : (e.P.slashEdge || '#ffffff');
          ctx.fillRect(Math.round(e.x - e.facing * 10 + e.facing * Math.cos(a) * (r - d)), Math.round(e.y + Math.sin(a) * (r - d)), 1, 1);
        }
      }
      ctx.globalAlpha = 1;
    },
  },
  /* ondes sonores concentriques */
  soundwave: {
    life: 22, at: 'body',
    draw(ctx, e) {
      const p = 1 - e.life / e.max;
      for (let k = 0; k < 3; k++) {
        const q = p - k * 0.18;
        if (q <= 0) continue;
        const r = 6 + q * (e.r || 40);
        ctx.globalAlpha = Math.max(0, 1 - q);
        for (let i = 0; i < 40; i++) {
          const a = i / 40 * Math.PI * 2;
          R(ctx, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.8, 2, 1, k % 2 ? '#ffffff' : (e.P.accent || '#ffd166'));
        }
      }
      ctx.globalAlpha = 1;
    },
  },
  /* éclair de lumière sur tout l'écran (impact final) */
  flashScreen: {
    life: 8,
    draw(ctx, e) {
      ctx.globalAlpha = (e.life / e.max) * 0.5;
      R(ctx, 0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, '#ffffff');
      ctx.globalAlpha = 1;
    },
  },
});

/* Pièce de costume générique, utilisable par tous les personnages */
PARTS.belt = {
  body(g, J) {
    const r = J.row(J.hip.y - 2);
    g.R(r.x, J.hip.y - 2, r.w, 2, 'belt');
    g.R(r.x + r.w - 4, J.hip.y - 2, 2, 2, 'buckle');
  },
};

/* Projectile par défaut : boule d'énergie */
PROJECTILE_ART.orb = function (ctx, p) {
  const s = p.spec, x = Math.round(p.x), y = Math.round(p.y), dir = Math.sign(p.vx) || 1, pulse = (p.t >> 2) % 2;
  const col = s.color || '#ffd166', core = s.core || '#ffffff';
  ctx.globalAlpha = 0.5;
  for (let i = 1; i <= 3; i++) R(ctx, x - dir * (i * 5 + 2) - 2, y - 3 + (i % 2), 5 - i, 5 - i, col);
  ctx.globalAlpha = 1;
  R(ctx, x - p.w / 2, y - p.h / 2 + 2, p.w, p.h - 4, col);
  R(ctx, x - p.w / 2 + 2, y - p.h / 2, p.w - 4, p.h, col);
  R(ctx, x - 2 - pulse, y - 2 - pulse, 4 + pulse * 2, 4 + pulse * 2, core);
};
