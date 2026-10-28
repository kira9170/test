'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  TORVALD — LE LOUP DES QUAIS
 *  Docker colossal armé d'une ancre de navire. Lent, puissant, contrôle
 *  le sol avec ses vagues et attire l'adversaire avec sa chaîne.
 * ===================================================================== */

/* ---------- Arme : ancre ---------- */
WEAPONS.anchor = {
  twoHanded: true, spread: 6, length: 24,
  draw(g, ax) {
    g.S(ax, -13, 21, -1, 0.5, 'iron');             // verge
    g.S(ax, -13, 21, -1, -1, 'ironLight');
    g.S(ax, -17, -14, -1.5, 1.5, 'iron');          // organeau
    g.S(ax, -16, -15, -0.5, 0.5, 'ironDark');
    g.S(ax, -11, -9.5, -5, 5, 'wood');             // jas en bois
    g.S(ax, -11, -11, -5, 5, 'woodLight');
    g.S(ax, 20, 24, -2, 2, 'iron');                // diamant
    g.S(ax, 23.5, 24.5, -1, 1, 'ironLight');
    for (const s of [-1, 1]) {                     // bras recourbés + pattes
      for (let i = 0; i <= 8; i++) {
        const u = 23 - i * i * 0.1, v = s * (1.5 + i * 0.85);
        g.S(ax, u - 0.75, u + 0.75, v - 0.75, v + 0.75, i % 3 === 0 ? 'ironLight' : 'iron');
      }
      g.S(ax, 14.5, 18.5, s * 7, s * 9.5, 'iron');
      g.S(ax, 13.5, 14.5, s * 8, s * 8.5, 'ironDark');
    }
    g.S(ax, 5, 6, -0.5, 0.5, 'rust');
    g.S(ax, 13, 14, -1, 0, 'rust');
  },
};

/* ---------- Costume ---------- */
Object.assign(PARTS, {
  coatTails: {
    back(g, J) {
      const len = Math.round(J.B.leg * 1.3), top = J.hip.y - 3, w0 = J.B.hipW + 2;
      for (let i = 0; i < len; i++) {
        const k = i / len, x = Math.round(J.hip.x - w0 / 2 - k * (1.5 + J.sway * 1.6));
        g.R(x, top + i, w0 + Math.round(k * 2), 1, i >= len - 2 ? 'coatTrim' : (k > 0.55 ? 'coatShade' : 'coat'));
      }
    },
  },
  sailorStripes: {
    body(g, J) {
      for (let y = J.sh.y + 3; y <= J.hip.y - 3; y++) {
        if ((y - J.sh.y) % 3) continue;
        const r = J.row(y);
        g.R(r.x + 4, y, r.w - 7, 1, 'stripe');
      }
    },
  },
  sailorBelt: {
    body(g, J) {
      const r = J.row(J.hip.y - 2);
      g.R(r.x, J.hip.y - 2, r.w, 2, 'belt');
      g.R(r.x + r.w - 4, J.hip.y - 2, 2, 2, 'buckle');
    },
  },
  longCoat: {
    body(g, J) {
      for (let y = J.sh.y; y <= J.hip.y; y++) {
        const r = J.row(y);
        g.R(r.x, y, 4, 1, 'coat');
        g.R(r.x + r.w - 3, y, 3, 1, 'coat');
        g.R(r.x, y, 1, 1, 'coatShade');
      }
      const r0 = J.row(J.sh.y);
      g.R(r0.x - 1, J.sh.y - 2, 5, 4, 'coat');
      g.R(r0.x + r0.w - 4, J.sh.y - 1, 4, 3, 'coat');
      g.R(r0.x + r0.w - 4, J.sh.y + 2, 2, 3, 'coatShade');
      for (let y = J.sh.y + 5; y < J.hip.y - 2; y += 4) { const r = J.row(y); g.R(r.x + r.w - 3, y, 1, 1, 'brass'); }
    },
  },
  seaBeard: {
    head(g, J) {
      const h = J.head, my = h.y + Math.round(h.h * 0.62);
      g.R(h.x + 1, h.y + 3, 3, h.h - 3, 'beard');
      g.R(h.x + 2, my, h.w - 1, h.h - (my - h.y) + 2, 'beard');
      g.R(h.x + h.w - 4, my - 1, 5, 2, 'beardDark');
      const bx = h.x + h.w - 4, by = h.y + h.h + 2;
      g.R(bx, by, 3, 4, 'beard');
      g.R(bx, by + 1, 3, 1, 'brass');
      g.R(bx + 1, by + 4, 1, 1, 'beard');
    },
  },
  knitCap: {
    head(g, J) {
      const h = J.head;
      g.R(h.x - 1, h.y - 3, h.w + 1, 4, 'cap');
      g.R(h.x, h.y - 4, h.w - 2, 1, 'cap');
      g.R(h.x - 1, h.y + 1, h.w + 1, 2, 'capFold');
      for (let x = h.x; x < h.x + h.w; x += 2) g.R(x, h.y + 1, 1, 2, 'capShade');
      g.R(h.x - 1, h.y + 3, 2, 3, 'hair');
    },
  },
  pipe: {
    head(g, J, P, f) {
      const h = J.head, y = h.y + Math.round(h.h * 0.72), x = h.x + h.w;
      g.R(x - 1, y, 4, 1, 'pipe');
      g.R(x + 2, y - 3, 3, 4, 'pipe');
      g.R(x + 2, y - 3, 3, 1, 'pipeRim');
      if (g.tint || !['idle', 'walk', 'win', 'crouch'].includes(f.state)) return;
      const ctx = g.ctx, a0 = ctx.globalAlpha;
      for (let i = 0; i < 3; i++) {
        const ph = ((f.animTime || 0) + i * 22) % 66, s = ph > 30 ? 2 : 1;
        ctx.globalAlpha = a0 * (1 - ph / 66) * 0.7;
        g.R(x + 3 + Math.round(Math.sin(ph * 0.12 + i) * 1.5), y - 5 - Math.round(ph * 0.22), s, s, 'smoke');
      }
      ctx.globalAlpha = a0;
    },
  },
});

/* ---------- Projectiles ---------- */
PROJECTILE_ART.wave = function (ctx, p) {
  const s = p.spec, dir = p.dir, x0 = Math.round(p.x - p.w / 2), base = Math.round(p.y + p.h / 2);
  for (let i = 0; i < p.w; i++) {
    const k = dir > 0 ? i / p.w : 1 - i / p.w;
    const hgt = Math.max(1, Math.round(p.h * Math.sin(Math.min(1, k * 1.1) * Math.PI * 0.8) * (0.85 + 0.15 * Math.sin(p.t * 0.5 + i))));
    R(ctx, x0 + i, base - hgt, 1, hgt, s.color);
    if (i % 3 === 0) R(ctx, x0 + i, base - hgt + 3, 1, Math.max(0, hgt - 6), s.deep || s.color);
    R(ctx, x0 + i, base - hgt, 1, 2, s.core);
  }
  for (let i = 0; i < 3 + p.w / 10; i++) {
    const ph = (p.t * 2 + i * 7) % 14;
    R(ctx, p.x + dir * (p.w / 2 - 2 + ph * 0.4), base - p.h - 1 - ph * 0.4 + (i % 4), 1, 1, s.core);
  }
};

PROJECTILE_ART.anchor = function (ctx, p) {
  const o = p.owner, J = Pose.compute(o);
  const hx = o.x + o.facing * J.hF.x, hy = o.y + J.hF.y;
  const dir = Math.sign(p.x - o.x) || o.facing;
  const ox = p.x + dir * 6 - dir * 24, oy = p.y;
  const rx = ox - dir * 15.5;
  const n = Math.max(1, Math.round(Math.hypot(rx - hx, oy - hy) / 3));
  for (let i = 0; i <= n; i++) {
    const x = hx + (rx - hx) * i / n, y = hy + (oy - hy) * i / n + Math.sin(i / n * Math.PI) * 2;
    R(ctx, x - 1, y - 1, i % 2 ? 2 : 3, i % 2 ? 2 : 1, i % 2 ? o.palette.iron : o.palette.ironLight);
  }
  WEAPONS.anchor.draw(Painter(ctx, o.palette, null, false), axis(ox, oy, dir > 0 ? 0 : 180));
};

/* ---------- Effet de fond : tempête (super) ---------- */
SCREEN_FX.storm = {
  init(s) { s.drops = Array.from({ length: 70 }, () => ({ x: Math.random() * 420, y: Math.random() * 216, v: 5 + Math.random() * 3 })); },
  draw(ctx, s) {
    const e = clamp(Math.min(s.t / 8, (s.max - s.t) / 15), 0, 1), W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const flash = s.t % 40 < 3 && s.t > 10;
    ctx.fillStyle = flash ? `rgba(220,235,255,${0.5 * e})` : `rgba(8,20,40,${0.6 * e})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.6 * e;
    ctx.fillStyle = '#9fc8ff';
    for (const d of s.drops) {
      const y = (d.y + s.t * d.v) % H, x = (d.x - s.t * 2) % (W + 40);
      ctx.fillRect(Math.round(x), Math.round(y), 1, 4);
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------- Personnage ---------- */
registerCharacter({
  id: 'torvald',
  name: 'TORVALD',
  title: 'LE LOUP DES QUAIS',
  description: "Docker colossal qui se bat avec une ancre de navire.",
  quotes: ["La mer m'a appris à frapper fort. Et à frapper deux fois.", "Retourne à quai, moussaillon.", "Tu tangues ? C'est normal."],
  stats: { maxHp: 118, walkSpeed: 1.1, jumpForce: 7.4, jumpSpeed: 1.6, defense: 1.12 },
  hitbox: { w: 24, h: 52 },
  body: { shoulderW: 20, hipW: 15, headW: 11, armT: 4, legT: 5 },
  locomotion: 'stomp',
  weapon: { type: 'anchor' },
  parts: ['coatTails', 'sailorStripes', 'sailorBelt', 'longCoat', 'seaBeard', 'knitCap', 'pipe'],
  palette: {
    skin: '#e0a878', skinShade: '#b07a50', eye: '#1a1a1a', brow: '#c8642a', mouth: '#5a2a1a',
    hair: '#c8642a', beard: '#c8642a', beardDark: '#9a4a1c',
    top: '#ece6d8', topShade: '#bdb5a3', stripe: '#2b4a7a',
    coat: '#2f5d62', coatShade: '#1f4044', coatTrim: '#c9a227', sleeve: '#2f5d62', sleeveShade: '#1f4044',
    pants: '#5b4636', pantsShade: '#3e2f24', shoes: '#2a1d14', shoesShade: '#1a120c',
    belt: '#3e2f24', buckle: '#c9a227', brass: '#c9a227',
    cap: '#b23a3a', capFold: '#8e2b2b', capShade: '#6e2020',
    pipe: '#5a3a22', pipeRim: '#8a5a32', smoke: '#d8d8e0',
    iron: '#5d6670', ironLight: '#a3adb6', ironDark: '#2c3238', wood: '#7a5230', woodLight: '#a07040', rust: '#9a5a2e',
    accent: '#5fd3e6', slash: '#dff4ff', slashEdge: '#5fb8d6',
  },
  altPalette: {
    coat: '#5a3d6b', coatShade: '#3d2a4a', sleeve: '#5a3d6b', sleeveShade: '#3d2a4a', stripe: '#8e2b2b',
    cap: '#2e6f40', capFold: '#235532', capShade: '#183d23',
    hair: '#e8e8e8', beard: '#e8e8e8', beardDark: '#b8b8c0', brow: '#e8e8e8',
    iron: '#6f5f4a', ironLight: '#b39b78', accent: '#ffb347', slashEdge: '#ff9f43',
  },
  stance: {
    idle:   { hand: [1, 8], ang: -152, grip: 1, hand2: [0, 10] },   // ancre posée sur l'épaule
    guard:  { hand: [6, 2], ang: -82, grip: 2, lean: -1 },
    crouch: { hand: [6, 6], ang: -55, grip: 2 },
    jump:   { hand: [4, 0], ang: -120, grip: 2 },
    win:    { hand: [2, -10], ang: -100, grip: 1, hand2: [3, 4] },
    hurt:   { hand: [-2, 8], ang: 120, grip: 1 },
  },
  attacks: {
    punch: { damage: 9, startup: 9, active: 4, recovery: 16, hitbox: { x: 4, y: -54, w: 34, h: 44 },
      knockback: 3, hitstun: 18, blockstun: 13, fx: ['arc'], arcWidth: 6, sfx: 'slash', hitSfx: 'heavy',
      anim: { windup: { hand: [-3, -6], ang: -150, grip: 2, lean: -2 },
              strike: { hand: [9, 8], ang: 35, grip: 2, lean: 3, footF: [8, 0], footB: [-6, 0] } } },
    kick:  { damage: 7, startup: 6, active: 4, recovery: 12, hitbox: { x: 6, y: -24, w: 22, h: 10 },
      knockback: 2.8, hitstun: 16, blockstun: 11,
      anim: { windup: { footF: [6, -10], lean: -1 }, strike: { footF: [20, -17], lean: -3 } } },
  },
  combos: [
    { name: 'BRISE-QUILLE', sequence: ['back', 'forward', 'punch'], window: 22, move: 'punch', damageMultiplier: 2.1,
      overrides: { startup: 12, active: 8, recovery: 20, dash: 2.2, launch: -5, knockback: 3.5, hitstun: 30, shake: 4,
        hitbox: { x: -6, y: -62, w: 46, h: 58 }, arcWidth: 9,
        anim: { windup: { hand: [-6, -2], ang: -205, grip: 2, lean: -4, crouch: 2 },
                strike: { hand: [10, 7], ang: 60, grip: 2, lean: 4, footF: [10, 0], footB: [-8, 0] } } } },
    { name: 'RAZ-DE-MARÉE', sequence: ['down', 'down', 'kick'], window: 24, move: 'kick', damageMultiplier: 1.7,
      overrides: { startup: 14, active: 3, recovery: 22, hitbox: null, shake: 6, fx: ['ring'], sfx: 'slash', hitSfx: 'splash',
        knockback: 2.5, launch: -4.5, hitstun: 28, level: 'low',
        projectile: { shape: 'wave', speed: 2.8, w: 20, h: 16, y: -8, life: 95, fromTip: true, color: '#3fa7d6', deep: '#2b7bb9', core: '#e0fbff' },
        anim: { windup: { hand: [2, -14], ang: -95, grip: 2, lean: -2, footF: [5, -5] },
                strike: { hand: [10, 9], ang: 78, grip: 2, lean: 5, crouch: 7, footF: [9, 0], footB: [-7, 0] } } } },
    { name: "ANCRE D'ABORDAGE", sequence: ['down', 'forward', 'punch'], window: 24, move: 'punch', damageMultiplier: 1.5,
      overrides: { startup: 11, active: 2, recovery: 28, hitbox: null, fx: [], sfx: 'whoosh', hitSfx: 'heavy',
        knockback: -4.5, hitstun: 30, blockstun: 14,   // knockback négatif = attire l'adversaire
        projectile: { shape: 'anchor', tether: true, returnAt: 22, speed: 4.4, w: 18, h: 16, life: 80, fromTip: true },
        anim: { windup: { hand: [-6, -3], ang: -165, grip: 1, hand2: [3, 8], lean: -3 },
                strike: { hand: [13, 3], ang: 0, grip: 1, hand2: [4, 8], lean: 3, footF: [8, 0] } } } },
  ],
  super: {
    name: 'LÉVIATHAN', move: 'kick', damageMultiplier: 1.0,
    overrides: { startup: 16, active: 3, recovery: 30, hitbox: null, shake: 10, fx: ['ring'], screenFx: 'storm', screenFxTime: 70,
      sfx: 'splash', hitSfx: 'splash', level: 'low', knockback: 3.5, launch: -6, hitstun: 32,
      projectile: { shape: 'wave', speed: 3.2, w: 42, h: 34, y: -17, life: 130, fromTip: true, hits: 4, hitEvery: 8,
                    color: '#2b7bb9', deep: '#1d5a8a', core: '#e0fbff' },
      anim: { windup: { hand: [0, -18], ang: -92, grip: 2, lean: -4, footF: [5, -8] },
              strike: { hand: [11, 10], ang: 82, grip: 2, lean: 6, crouch: 9, footF: [10, 0], footB: [-8, 0] } } },
  },
});
