'use strict';
/* =====================================================================
 *  OUTILS PARTAGÉS : maths, dessin pixel art, peintre, cinématique inverse
 * ===================================================================== */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const DEG = Math.PI / 180;
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const easeOut = k => 1 - (1 - k) * (1 - k);
const easeInOut = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

/* Rectangle aligné sur la grille de pixels */
function R(ctx, x, y, w, h, color) {
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/* Ligne pixel art épaisse (t×t pixels) */
function pxLine(ctx, x0, y0, x1, y1, t) {
  const dx = x1 - x0, dy = y1 - y0;
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const o = t / 2;
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + dx * i / n - o), Math.round(y0 + dy * i / n - o), t, t);
}

/* Disque plein pixel art */
function disc(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const hw = Math.round(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2, 1);
  }
}

/* Repère orienté (u = le long de l'objet, v = perpendiculaire) */
function axis(x, y, deg) {
  const a = deg * DEG;
  return { x, y, ux: Math.cos(a), uy: Math.sin(a), nx: -Math.sin(a), ny: Math.cos(a) };
}

function drawText(ctx, text, x, y, size, color, align = 'left', outline = true) {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  if (outline) {
    ctx.fillStyle = '#000';
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [2, 2]]) ctx.fillText(text, x + dx, y + dy);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/* Générateur pseudo-aléatoire reproductible (décors) */
function seeded(seed) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/* Peintre : traduit les clés de palette en couleurs.
 * tint = silhouette d'une seule couleur (rémanences, auras) ; flash = blanc (impact). */
function Painter(ctx, P, tint, flash) {
  const col = k => tint || (flash ? '#ffffff' : (k.charAt(0) === '#' || k.startsWith('rgb') ? k : (P[k] || '#ff00ff')));
  return {
    ctx, P, tint, col,
    R(x, y, w, h, k) { R(ctx, x, y, w, h, col(k)); },
    L(a, b, t, k) { ctx.fillStyle = col(k); pxLine(ctx, a.x, a.y, b.x, b.y, t); },
    /* remplit le rectangle [u0,u1]×[v0,v1] du repère orienté ax */
    S(ax, u0, u1, v0, v1, k) {
      if (u0 > u1) [u0, u1] = [u1, u0];
      if (v0 > v1) [v0, v1] = [v1, v0];
      ctx.fillStyle = col(k);
      for (let u = u0; u <= u1 + 1e-6; u += 0.5) {
        for (let v = v0; v <= v1 + 1e-6; v += 0.5) {
          ctx.fillRect(Math.floor(ax.x + u * ax.ux + v * ax.nx), Math.floor(ax.y + u * ax.uy + v * ax.ny), 1, 1);
        }
      }
    },
  };
}

/* Cinématique inverse à 2 segments (bras, jambes). bend = côté de pliure. */
function ik(a, b, L, bend, clampEnd) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
  if (d >= 2 * L) {
    const end = clampEnd ? { x: a.x + dx * 2 * L / d, y: a.y + dy * 2 * L / d } : b;
    return { j: { x: (a.x + end.x) / 2, y: (a.y + end.y) / 2 }, end };
  }
  const h = Math.sqrt(L * L - d * d / 4);
  return { j: { x: (a.x + b.x) / 2 - dy / d * h * bend, y: (a.y + b.y) / 2 + dx / d * h * bend }, end: b };
}
