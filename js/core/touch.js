'use strict';
// [1.4] NOUVEAU — commandes tactiles pour téléphone / tablette (voir CHANGELOG_1.4.md)
/* =====================================================================
 *  COMMANDES TACTILES
 *  Une croix directionnelle (à gauche) et des boutons (à droite) apparaissent
 *  pendant les combats sur les écrans tactiles. Ils « appuient » sur les
 *  touches clavier du joueur 1 : tout le reste du jeu (combos, IA, mode en
 *  ligne…) fonctionne sans modification.
 *  Forcer l'affichage sur ordinateur : index.html?touch=1
 * ===================================================================== */
const TouchPad = {
  enabled: false,
  dirs: new Set(),
  held: new Set(),           // touches enfoncées par l'écran tactile

  init(game) {
    this.game = game;
    const q = new URLSearchParams(location.search).get('touch');
    this.enabled = q === '1' || (q !== '0' && matchMedia('(pointer: coarse)').matches);
    if (!this.enabled) return;
    document.body.classList.add('touch');
    const app = $('#app');
    const root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML = `
      <div class="t-pad"><div class="t-ring"></div><div class="t-knob"></div></div>
      <div class="t-btns">
        <button class="t-btn t-guard" data-key="KeyH">GARDE</button>
        <button class="t-btn t-kick" data-key="KeyG">PIED</button>
        <button class="t-btn t-punch" data-key="KeyF">POING</button>
        <button class="t-btn t-throw" data-macro="throw">P+K</button>
        <button class="t-btn t-super" data-macro="super">SUPER</button>
      </div>
      <button class="t-pause" aria-label="Pause">II</button>`;
    app.appendChild(root);
    this.root = root;
    this.bindPad(root.querySelector('.t-pad'));
    root.querySelectorAll('.t-btn').forEach(b => this.bindButton(b));
    root.querySelector('.t-pause').addEventListener('pointerdown', e => {
      e.preventDefault();
      if (typeof Net !== 'undefined' && Net.inGame) Net.toggleMenu();
      else if (game.inMatch && game.state !== 'matchEnd') game.togglePause();
    });
    root.addEventListener('contextmenu', e => e.preventDefault());
    // écran VS : toucher pour passer (hors ligne)
    $('#game').addEventListener('pointerdown', () => {
      if (game.state === 'versus' && !game.paused && !(typeof Net !== 'undefined' && Net.inGame)) game.skipVersus();
    });
    // premier contact : plein écran + paysage quand le navigateur l'autorise (Android)
    const first = () => {
      document.removeEventListener('pointerup', first);
      this.goFullscreen();
    };
    document.addEventListener('pointerup', first);
  },

  goFullscreen() {
    const el = document.documentElement;
    try {
      const p = !document.fullscreenElement && el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null;
      const lock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) { /* */ } };
      if (p && p.then) p.then(lock, () => {}); else lock();
    } catch (e) { /* plein écran indisponible (iPhone) : le jeu reste jouable */ }
  },

  /* ---------- touches virtuelles ---------- */
  press(code) {
    const kb = this.game.keyboard;
    if (!kb.down.has(code)) kb.justPressed.add(code);
    kb.down.add(code);
    this.held.add(code);
  },
  release(code) { if (this.held.delete(code)) this.game.keyboard.down.delete(code); },
  tap(code, ms = 50) { this.press(code); setTimeout(() => this.release(code), ms); },

  /* ---------- croix directionnelle (8 directions, on peut glisser) ---------- */
  bindPad(pad) {
    const knob = pad.querySelector('.t-knob');
    let id = null;
    const set = (dirs) => {
      const map = { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS' };
      for (const d of this.dirs) if (!dirs.has(d)) this.release(map[d]);
      for (const d of dirs) if (!this.dirs.has(d)) this.press(map[d]);
      this.dirs = dirs;
    };
    const move = e => {
      const r = pad.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, R0 = r.width / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      const dirs = new Set();
      if (len > R0 * 0.22) {
        const nx = dx / len, ny = dy / len;              // secteurs de 45° : diagonales comprises
        if (nx > 0.38) dirs.add('right'); else if (nx < -0.38) dirs.add('left');
        if (ny > 0.38) dirs.add('down'); else if (ny < -0.38) dirs.add('up');
      }
      const k = Math.min(1, (R0 * 0.55) / Math.max(1, len));
      knob.style.transform = `translate(calc(-50% + ${dx * k}px), calc(-50% + ${dy * k}px))`;
      set(dirs);
    };
    const end = e => {
      if (e.pointerId !== id) return;
      id = null;
      knob.style.transform = '';
      pad.classList.remove('on');
      set(new Set());
    };
    pad.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (id !== null) return;
      id = e.pointerId;
      try { pad.setPointerCapture(id); } catch (err) { /* */ }
      pad.classList.add('on');
      move(e);
    });
    pad.addEventListener('pointermove', e => { if (e.pointerId === id) { e.preventDefault(); move(e); } });
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    pad.addEventListener('lostpointercapture', end);
  },

  /* ---------- boutons d'action ---------- */
  bindButton(b) {
    const down = e => {
      e.preventDefault();
      b.classList.add('on');
      try { b.setPointerCapture(e.pointerId); } catch (err) { /* */ }
      if (b.dataset.key) this.press(b.dataset.key);
      else if (b.dataset.macro === 'throw') { this.tap('KeyF', 60); this.tap('KeyG', 60); }
      else if (b.dataset.macro === 'super') this.superMotion();
    };
    const up = e => {
      e.preventDefault();
      b.classList.remove('on');
      if (b.dataset.key) this.release(b.dataset.key);
    };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', () => { b.classList.remove('on'); if (b.dataset.key) this.release(b.dataset.key); });
  },

  myFighter() {
    const g = this.game;
    if (!g.fighters.length) return null;
    return g.fighters[typeof Net !== 'undefined' && Net.inGame ? Net.myIndex() : 0];
  },

  /* Le bouton SUPER enchaîne ↓ → ↓ → + Poing (dans le bon sens) à la place du joueur */
  superMotion() {
    const f = this.myFighter();
    if (!f) return;
    const fwd = f.facing === 1 ? 'KeyD' : 'KeyA';
    const seq = ['KeyS', fwd, 'KeyS', fwd, 'KeyF'];
    seq.forEach((code, i) => setTimeout(() => this.tap(code, 30), i * 50));
  },

  /* Appelé à chaque image : n'afficher les commandes qu'en plein combat */
  update() {
    if (!this.enabled) return;
    const g = this.game;
    const show = g.inMatch && g.state !== 'matchEnd' && !UI.active();
    this.root.classList.toggle('show', show);
    if (!show && this.held.size) {
      for (const c of Array.from(this.held)) this.release(c);
      this.dirs = new Set();
      this.root.querySelectorAll('.on').forEach(el => el.classList.remove('on'));
      this.root.querySelector('.t-knob').style.transform = '';
    }
    const f = this.myFighter();
    if (f) this.root.querySelector('.t-super').classList.toggle('ready', f.meter >= CONFIG.METER_MAX);
  },
};
