'use strict';
/* =====================================================================
 *  ENTRÉES : clavier, manettes, contrôleur humain
 *  Un contrôleur expose : held (touches maintenues) et pressed (pressées cette frame).
 *  Le combattant ne sait pas s'il est piloté par un humain, une IA ou un mannequin.
 * ===================================================================== */
class Keyboard {
  constructor() {
    this.down = new Set();
    this.justPressed = new Set();
    window.addEventListener('keydown', e => {
      if (!this.down.has(e.code)) this.justPressed.add(e.code);
      this.down.add(e.code);
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', e => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
  }
}

/* Manettes : interrogées une fois par frame */
const Pads = {
  cur: [], prev: [],
  poll() {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    this.prev = this.cur;
    this.cur = [];
    for (let i = 0; i < 4; i++) {
      const gp = list && list[i];
      if (!gp || !gp.connected) { this.cur[i] = null; continue; }
      const b = k => !!(gp.buttons[k] && gp.buttons[k].pressed);
      const any = arr => arr.some(b);
      const ax = gp.axes || [];
      this.cur[i] = {
        left: b(14) || ax[0] < -0.5, right: b(15) || ax[0] > 0.5,
        up: b(12) || ax[1] < -0.5, down: b(13) || ax[1] > 0.5,
        punch: any(PAD_BUTTONS.punch) || any(PAD_BUTTONS.both),
        kick: any(PAD_BUTTONS.kick) || any(PAD_BUTTONS.both),
        guard: any(PAD_BUTTONS.guard),
        start: any(PAD_BUTTONS.start), back: any(PAD_BUTTONS.back),
        confirm: b(0), cancel: b(1),
      };
    }
  },
  held(i, a) { const s = this.cur[i]; return !!(s && s[a]); },
  pressed(i, a) { const s = this.cur[i], p = this.prev[i]; return !!(s && s[a] && !(p && p[a])); },
  anyPressed(a) { for (let i = 0; i < 4; i++) if (this.pressed(i, a)) return true; return false; },
};

class HumanController {
  constructor(keyboard, keymap, padIndex = null) {
    this.kb = keyboard;
    this.keymap = keymap;
    this.pad = padIndex;
    this.held = {};
    this.pressed = new Set();
  }
  update() {
    this.pressed.clear();
    for (const action in this.keymap) {
      const codes = this.keymap[action];
      const kbHeld = codes.some(c => this.kb.down.has(c));
      const kbPressed = codes.some(c => this.kb.justPressed.has(c));
      codes.forEach(c => this.kb.justPressed.delete(c));
      const p = this.pad;
      this.held[action] = kbHeld || (p != null && Pads.held(p, action));
      if (kbPressed || (p != null && Pads.pressed(p, action))) this.pressed.add(action);
    }
  }
}
