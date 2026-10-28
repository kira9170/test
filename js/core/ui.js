'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
// [1.3] MODIFIÉ — mode en ligne (voir CHANGELOG_1.3.md)
/* =====================================================================
 *  INTERFACE : menus HTML, sélection des personnages et de l'arène,
 *  options, tutoriel, pause (liste des coups), résultats, modes arcade
 *  et survie, navigation clavier/manette
 * ===================================================================== */
const ARROWS = { down: '↓', up: '↑', forward: '→', back: '←', punch: 'P', kick: 'K' };
const seqText = s => s.map(t => ARROWS[t] || t).join(' ');

const UI = {
  show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    if (id) MenuNav.focusFirst();
  },
  active() {
    const s = $('.screen.active');
    return s ? s.id : null;
  },
  showResult(winner, game) {
    const [a, b] = game.fighters;
    const r = Run.active && game.opts.run ? Run.onMatchEnd(winner, game) : null;
    const who = winner === a ? 'JOUEUR 1' : (game.opts.mode === 'ai' ? "L'IA" : 'JOUEUR 2');
    $('#result-title').innerHTML = r ? `${r.title}<span>${r.subtitle}</span>` : `${winner.def.name}<span>${who} REMPORTE LE MATCH</span>`;
    $('#result-quote').textContent = `« ${pick(winner.def.quotes)} »`;
    $('#result-sub').textContent = r ? r.info : `Score : ${a.wins} - ${b.wins}`;
    const box = $('#result-buttons');
    box.innerHTML = '';
    const buttons = r ? r.buttons : [
      { label: 'REVANCHE', action: () => Menu.launch(), main: true },
      { label: 'CHANGER DE PERSO', action: () => Menu.openSelect() },
      { label: 'MENU', action: () => Menu.openMain(), back: true },
    ];
    for (const bt of buttons) {
      const el = document.createElement('button');
      el.textContent = bt.label;
      if (!bt.main) el.className = 'ghost';
      if (bt.main) el.dataset.default = '';
      if (bt.back) el.dataset.back = '';
      el.onclick = bt.action;
      box.appendChild(el);
    }
    this.show('result');
  },
};

/* Navigation spatiale dans les menus (flèches / ZQSD / croix directionnelle) */
const MenuNav = {
  focusables() {
    const scr = $('.screen.active');
    if (!scr) return [];
    return Array.from(scr.querySelectorAll('button, input')).filter(el => el.offsetParent !== null && !el.disabled);
  },
  focusFirst() {
    setTimeout(() => {
      const els = this.focusables();
      const pref = els.find(e => e.dataset.default != null) || els[0];
      if (pref) pref.focus({ preventScroll: true });
    }, 0);
  },
  move(dx, dy) {
    const els = this.focusables();
    if (!els.length) return;
    const cur = document.activeElement;
    if (!els.includes(cur)) { els[0].focus(); return; }
    const r0 = cur.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best = null, bestScore = Infinity;
    for (const el of els) {
      if (el === cur) continue;
      const r = el.getBoundingClientRect(), vx = r.left + r.width / 2 - cx, vy = r.top + r.height / 2 - cy;
      const along = vx * dx + vy * dy;
      if (along <= 2) continue;
      const score = along + Math.abs(vx * dy - vy * dx) * 2.5;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) { best.focus({ preventScroll: true }); Sfx.play('move'); }
  },
  confirm() {
    const el = document.activeElement;
    if (el && el.tagName === 'INPUT') return;
    if (el && this.focusables().includes(el)) el.click();
  },
  back() {
    const scr = $('.screen.active');
    const b = scr && Array.from(scr.querySelectorAll('[data-back]')).find(el => el.offsetParent !== null);
    if (b) b.click();
  },
  onKey(e) {
    const map = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
      ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    if (map[e.code]) { e.preventDefault(); this.move(...map[e.code]); }
    else if (['Enter', 'NumpadEnter', 'Space', 'KeyF', 'KeyK'].includes(e.code)) { e.preventDefault(); this.confirm(); }
    else if (e.code === 'Backspace') { e.preventDefault(); this.back(); }
  },
};

/* ---------------------------------------------------------------------
 *  MODES ARCADE ET SURVIE
 *  Arcade : 6 adversaires tirés au sort, difficulté croissante, score.
 *  Survie : adversaires à l'infini en 1 manche, la vie ne remonte que de 30 %.
 * --------------------------------------------------------------------- */
const Run = {
  active: null,

  start(mode, p1) {
    const pool = ROSTER.map((d, i) => i).filter(i => i !== p1);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    this.active = { mode, p1, pool, total: mode === 'arcade' ? Math.min(6, pool.length) : Infinity, index: 0, wins: 0, score: 0, hp: null, continues: 0 };
    this.next();
  },

  difficulty() {
    const r = this.active;
    if (r.mode === 'arcade') return r.index < 2 ? 'easy' : r.index < 4 ? 'medium' : 'hard';
    return r.wins < 3 ? 'easy' : r.wins < 7 ? 'medium' : 'hard';
  },

  next() {
    const r = this.active;
    const p2 = r.pool[r.index % r.pool.length];
    Menu.mode = 'ai';
    Menu.picks = [r.p1, p2];
    UI.show(null);
    Menu.game.startMatch({
      mode: 'ai', difficulty: this.difficulty(), p1: r.p1, p2, stage: Math.floor(Math.random() * STAGES.length),
      rounds: r.mode === 'survival' ? 1 : null, p1Hp: r.mode === 'survival' ? r.hp : null, run: this,
    });
  },

  label() {
    const r = this.active;
    if (!r) return '';
    const diff = AI_LEVELS[this.difficulty()].label.toUpperCase();
    return r.mode === 'arcade' ? `ARCADE ${r.index + 1}/${r.total} • ${diff} • SCORE ${r.score}`
      : `SURVIE • VICTOIRES ${r.wins} • ${diff}`;
  },

  onMatchEnd(winner, game) {
    const r = this.active, me = game.fighters[0], won = winner === me;
    const quit = { label: 'ABANDONNER', action: () => { Run.active = null; Menu.openMain(); }, back: true };
    if (r.mode === 'arcade') {
      if (won) {
        r.wins++;
        r.score += 1000 + Math.round(1000 * me.hp / me.maxHp) + (game.perfect ? 1500 : 0) + (isFinite(game.timeLeft) ? game.timeLeft * 20 : 0);
        r.index++;
        if (r.index >= r.total) {
          const best = Settings.data.arcadeBest = Math.max(Settings.data.arcadeBest || 0, r.score);
          Settings.save();
          return { title: 'CHAMPION !', subtitle: `${me.def.name} REMPORTE L'ARCADE`, info: `Score final : ${r.score}  •  Record : ${best}`,
            buttons: [{ label: 'MENU', action: () => { Run.active = null; Menu.openMain(); }, main: true, back: true },
                      { label: "REJOUER L'ARCADE", action: () => Run.start('arcade', r.p1) }] };
        }
        return { title: 'VICTOIRE', subtitle: `COMBAT ${r.index}/${r.total} REMPORTÉ`, info: `Score : ${r.score}`,
          buttons: [{ label: 'COMBAT SUIVANT', action: () => Run.next(), main: true }, quit] };
      }
      return { title: 'DÉFAITE', subtitle: `COMBAT ${r.index + 1}/${r.total}`, info: `Score : ${r.score}  •  Continuer divise le score par deux`,
        buttons: [{ label: 'CONTINUER', action: () => { r.score = Math.floor(r.score / 2); r.continues++; Run.next(); }, main: true }, quit] };
    }
    // survie
    if (won) {
      r.wins++;
      r.index++;
      r.hp = Math.min(me.maxHp, me.hp + me.maxHp * 0.3);
      return { title: 'VICTOIRE', subtitle: `${r.wins} ADVERSAIRE(S) VAINCU(S)`, info: `Vie récupérée : ${Math.round(r.hp)} / ${me.maxHp}`,
        buttons: [{ label: 'COMBAT SUIVANT', action: () => Run.next(), main: true }, quit] };
    }
    const best = Settings.data.survivalBest = Math.max(Settings.data.survivalBest || 0, r.wins);
    Settings.save();
    return { title: 'FIN DE LA SURVIE', subtitle: `${r.wins} VICTOIRE(S)`, info: `Record : ${best} victoire(s)`,
      buttons: [{ label: 'REJOUER', action: () => Run.start('survival', r.p1), main: true },
                { label: 'MENU', action: () => { Run.active = null; Menu.openMain(); }, back: true }] };
  },
};

const PCT = v => `${Math.round(v * 100)} %`;
const OPTION_DEFS = [
  { key: 'roundTime', label: 'DURÉE DU ROUND', values: [30, 60, 99, 0], fmt: v => (v ? v + ' S' : '∞') },
  { key: 'rounds', label: 'MANCHES GAGNANTES', values: [1, 2, 3], fmt: v => String(v) },
  { key: 'music', label: 'MUSIQUE', values: [true, false], fmt: v => (v ? 'OUI' : 'NON') },
  { key: 'musicVol', label: 'VOLUME MUSIQUE', values: [0.25, 0.5, 0.75, 1], fmt: PCT },
  { key: 'sfx', label: 'BRUITAGES', values: [true, false], fmt: v => (v ? 'OUI' : 'NON') },
  { key: 'sfxVol', label: 'VOLUME BRUITAGES', values: [0.25, 0.5, 0.75, 1], fmt: PCT },
  { key: 'shake', label: "SECOUSSES D'ÉCRAN", values: [true, false], fmt: v => (v ? 'OUI' : 'NON') },
  { key: 'hitboxes', label: 'AFFICHER LES HITBOXES', values: [false, true], fmt: v => (v ? 'OUI' : 'NON') },
];

function toggleFullscreen() {
  const el = $('#app');
  try {
    if (!document.fullscreenElement) { if (el.requestFullscreen) el.requestFullscreen(); }
    else if (document.exitFullscreen) document.exitFullscreen();
  } catch (e) { /* plein écran refusé par le navigateur */ }
}

const Menu = {
  mode: 'pvp',
  difficulty: 'medium',
  picks: [0, 1],
  picking: 0,
  stageIndex: 0,
  focusStage: 0,
  winPose: [0, 0],

  init(game) {
    this.game = game;
    this.picks = [0, Math.min(1, ROSTER.length - 1)];
    $('#btn-pvp').onclick = () => this.chooseMode('pvp');
    $('#btn-ai').onclick = () => {
      $('#mode-buttons').classList.add('hidden');
      $('#diff-buttons').classList.remove('hidden');
      MenuNav.focusFirst();
    };
    $('#btn-arcade').onclick = () => this.chooseMode('arcade');
    $('#btn-survival').onclick = () => this.chooseMode('survival');
    $('#btn-training').onclick = () => this.chooseMode('training');
    $('#btn-howto').onclick = () => UI.show('howto');
    $('#btn-howto-back').onclick = () => this.openMain();
    $('#btn-howto-try').onclick = () => this.chooseMode('training');
    $('#btn-options').onclick = () => { this.refreshOptions(); UI.show('options'); };
    $('#btn-diff-back').onclick = () => this.openMain();
    $$('[data-diff]').forEach(b => { b.onclick = () => this.chooseMode('ai', b.dataset.diff); });
    $$('.pick-nav button').forEach(b => { b.onclick = () => this.cycle(+b.dataset.player, +b.dataset.dir); });
    $$('.pick-label').forEach((el, i) => { el.onclick = () => { if (!this.isRun()) { this.picking = i; this.refresh(); } }; });
    $('#btn-select-back').onclick = () => this.openMain();
    $('#btn-select-next').onclick = () => (this.isRun() ? Run.start(this.mode, this.picks[0]) : this.openStages());
    $('#btn-stage-back').onclick = () => this.openSelect();
    $('#btn-stage-go').onclick = () => this.launch();
    $('#btn-resume').onclick = () => game.togglePause(false);
    $('#btn-restart').onclick = () => { game.paused = false; UI.show(null); game.startMatch(Object.assign({}, game.opts, { skipVersus: true })); };
    $('#btn-reset').onclick = () => { game.resetTraining(); game.togglePause(false); };
    $('#btn-dummy').onclick = () => { game.dummyMode = (game.dummyMode + 1) % DUMMY_MODES.length; this.refreshPause(); };
    $('#btn-quit').onclick = () => { Run.active = null; this.openMain(); };
    $('#btn-options-back').onclick = () => this.openMain();
    $('#btn-fullscreen').onclick = () => toggleFullscreen();
    document.addEventListener('click', e => { if (e.target.closest && e.target.closest('button')) Sfx.play('select'); });
    this.buildRoster();
    this.buildStages();
    this.buildOptions();
    this.refresh();
  },

  isRun() { return this.mode === 'arcade' || this.mode === 'survival'; },

  backgroundStage() {
    if (UI.active() === 'stage') return STAGES[this.focusStage] || STAGES[0];
    return STAGES[Math.floor(this.game.globalTime / 600) % Math.max(1, STAGES.length)];
  },

  chooseMode(mode, diff) {
    this.mode = mode;
    if (diff) this.difficulty = diff;
    this.picking = 0;
    this.openSelect();
  },

  openMain() {
    this.game.state = 'menu';
    this.game.paused = false;
    this.game.fighters = [];
    Run.active = null;
    $('#mode-buttons').classList.remove('hidden');
    $('#diff-buttons').classList.add('hidden');
    UI.show('menu');
    Music.play(MENU_THEME);
    Ambience.stop();
  },

  /* ---------- Sélection des personnages ---------- */
  buildRoster() {
    const box = $('#roster');
    box.innerHTML = '';
    ROSTER.forEach((def, i) => {
      const b = document.createElement('button');
      b.className = 'portrait';
      b.title = def.name;
      b.innerHTML = `<canvas width="40" height="56"></canvas><span class="nm">${def.name}</span>
        <i class="badge p1">1</i><i class="badge p2">2</i>`;
      b.onclick = () => this.pickChar(i);
      box.appendChild(b);
      const ctx = b.querySelector('canvas').getContext('2d');
      ctx.imageSmoothingEnabled = false;
      Renderer.drawFighter(ctx, { def, palette: def.palette, x: 20, y: 54, facing: 1, vx: 0, state: 'idle',
        animTime: 0, flash: 0, attack: null, weaponOut: false, status: null });
    });
  },

  openSelect() {
    const run = this.isRun();
    const label = run ? 'ADVERSAIRES ALÉATOIRES'
      : this.mode === 'ai' ? `IA - ${AI_LEVELS[this.difficulty].label.toUpperCase()}`
      : this.mode === 'training' ? 'MANNEQUIN' : 'JOUEUR 2';
    $('#pick-1 .pick-label').textContent = label;
    $('#pick-1').classList.toggle('dimmed', run);
    $('#btn-select-next').textContent = run ? (this.mode === 'arcade' ? "LANCER L'ARCADE ▶" : 'LANCER LA SURVIE ▶') : "CHOISIR L'ARÈNE ▶";
    this.game.state = 'menu';
    this.game.fighters = [];
    this.picking = 0;
    this.refresh();
    UI.show('select');
    setTimeout(() => { const b = $$('#roster .portrait')[this.picks[0]]; if (b) b.focus({ preventScroll: true }); }, 0);
    Music.play(MENU_THEME);
    Ambience.stop();
  },

  pickChar(i) {
    this.picks[this.picking] = i;
    this.winPose[this.picking] = 45;
    if (this.picking === 0 && !this.isRun()) this.picking = 1;
    else setTimeout(() => $('#btn-select-next').focus({ preventScroll: true }), 0);
    this.refresh();
  },

  cycle(p, dir) {
    this.picks[p] = (this.picks[p] + dir + ROSTER.length) % ROSTER.length;
    this.winPose[p] = 45;
    this.refresh();
  },

  refresh() {
    const run = this.isRun();
    $$('#roster .portrait').forEach((b, i) => {
      b.classList.toggle('sel1', this.picks[0] === i);
      b.classList.toggle('sel2', !run && this.picks[1] === i);
    });
    [0, 1].forEach(p => {
      const def = ROSTER[this.picks[p]];
      const root = $(`#pick-${p}`);
      root.classList.toggle('active', this.picking === p);
      if (p === 1 && run) {
        root.querySelector('.pick-name').textContent = '?';
        root.querySelector('.pick-title').textContent = this.mode === 'arcade' ? '6 COMBATS, DIFFICULTÉ CROISSANTE' : "JUSQU'À LA DÉFAITE";
        root.querySelector('.pick-desc').textContent = this.mode === 'arcade'
          ? `Record : ${Settings.data.arcadeBest || 0} points` : `Record : ${Settings.data.survivalBest || 0} victoire(s)`;
        root.querySelector('.stats').innerHTML = '';
        root.querySelector('.combos').innerHTML = '';
        return;
      }
      root.querySelector('.pick-name').textContent = def.name;
      root.querySelector('.pick-title').textContent = def.title || '';
      root.querySelector('.pick-desc').textContent = def.description || '';
      const power = (def.attacks.punch.damage + def.attacks.kick.damage) / 18;
      const stats = [['PV', def.stats.maxHp / 135], ['VITESSE', def.stats.walkSpeed / 2], ['PUISSANCE', power], ['DÉFENSE', def.stats.defense / 1.3]];
      root.querySelector('.stats').innerHTML = stats
        .map(([n, v]) => `<div class="stat"><span>${n}</span><i style="--v:${Math.round(Math.min(1, v) * 100)}%"></i></div>`).join('');
      const rows = def.combos.map(c => `<b>${seqText(c.sequence)}</b> ${c.name}`);
      if (def.super) rows.push(`<b class="sup">${seqText(def.super.sequence)}</b> ★ ${def.super.name}`);
      root.querySelector('.combos').innerHTML = rows.join('<br>');
    });
  },

  /* ---------- Sélection de l'arène ---------- */
  buildStages() {
    const box = $('#stage-list');
    box.innerHTML = '';
    STAGES.forEach((st, i) => {
      const b = document.createElement('button');
      b.className = 'stage-card';
      b.innerHTML = `<canvas width="${CONFIG.WIDTH}" height="${CONFIG.HEIGHT}"></canvas><span>${st.name}</span>`;
      b.onclick = () => this.pickStage(i);
      b.onfocus = () => { this.focusStage = i; this.showStageInfo(i); };
      box.appendChild(b);
    });
    const r = document.createElement('button');
    r.className = 'stage-card random';
    r.innerHTML = '<div class="q">?</div><span>ALÉATOIRE</span>';
    r.onclick = () => this.pickStage(-1);
    r.onfocus = () => this.showStageInfo(-1);
    box.appendChild(r);
  },

  openStages() {
    UI.show('stage');
    this.highlightStage();
    this.showStageInfo(this.stageIndex);
    setTimeout(() => {
      const cards = $$('#stage-list .stage-card');
      const c = this.stageIndex === -1 ? cards[cards.length - 1] : cards[this.stageIndex];
      if (c) c.focus({ preventScroll: true });
    }, 0);
  },

  pickStage(i) {
    this.stageIndex = i;
    this.highlightStage();
    this.showStageInfo(i);
    setTimeout(() => $('#btn-stage-go').focus({ preventScroll: true }), 0);
  },

  highlightStage() {
    const cards = $$('#stage-list .stage-card');
    cards.forEach((c, i) => c.classList.toggle('selected', i === (this.stageIndex === -1 ? cards.length - 1 : this.stageIndex)));
  },

  showStageInfo(i) {
    const st = STAGES[i];
    $('#stage-info').textContent = st ? `${st.name} — ${st.subtitle}` : 'ARÈNE TIRÉE AU SORT';
  },

  /* ---------- Options ---------- */
  buildOptions() {
    const box = $('#options-list');
    box.innerHTML = '';
    OPTION_DEFS.forEach(o => {
      const b = document.createElement('button');
      b.className = 'ghost opt';
      b.dataset.key = o.key;
      b.onclick = () => {
        const vals = o.values, cur = vals.indexOf(Settings.data[o.key]);
        Settings.data[o.key] = vals[(cur + 1) % vals.length];
        Settings.save();
        this.applySettings();
        this.refreshOptions();
      };
      box.appendChild(b);
    });
    this.refreshOptions();
  },

  refreshOptions() {
    $$('#options-list .opt').forEach(b => {
      const o = OPTION_DEFS.find(d => d.key === b.dataset.key);
      b.textContent = `${o.label} : ${o.fmt(Settings.data[o.key])}`;
    });
  },

  applySettings() {
    CONFIG.DEBUG = !!Settings.data.hitboxes;
    Sfx.applyVolumes();
    if (Settings.data.music) Music.resume(); else Music.stop();
    if (!Settings.data.sfx) Ambience.stop(); else if (this.game.inMatch) Ambience.resume();
  },

  /* ---------- Pause : liste des coups ---------- */
  openPause() {
    this.refreshPause();
    UI.show('pause');
  },

  refreshPause() {
    const g = this.game;
    $('#btn-dummy').classList.toggle('hidden', !g.training);
    $('#btn-reset').classList.toggle('hidden', !g.training);
    $('#btn-dummy').textContent = `MANNEQUIN : ${DUMMY_MODES[g.dummyMode].label}`;
    $('#movelist').innerHTML = g.fighters.map(f => this.movelistHTML(f.def)).join('');
  },

  movelistHTML(def) {
    const rows = def.combos.map(c => [seqText(c.sequence), c.name]);
    if (def.super) rows.push([seqText(def.super.sequence) + ' ★', def.super.name + ' (JAUGE PLEINE)']);
    rows.push(['P puis K (touché)', 'ENCHAÎNEMENT'], ['P/K + spécial', 'ANNULATION SUR TOUCHE'],
      ['P + K (PRÈS)', 'PROJECTION'], ['→ → / ← ←', 'DASH'], ['GARDE + ↓', 'GARDE BASSE']);
    return `<div class="ml"><h3>${def.name}</h3>${rows.map(r => `<div><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}</div>`;
  },

  /* ---------- Aperçus animés ---------- */
  openOnline() {
    this.game.state = 'menu';
    this.game.fighters = [];
    UI.show('online');
    Music.play(MENU_THEME);
    Ambience.stop();
  },

  renderPreviews(t) {
    const scr = UI.active();
    if (scr === 'lobby') Net.renderLobby(t);
    if (scr === 'select') {
      [0, 1].forEach(p => {
        const cv = $(`#pick-${p} canvas`), ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, cv.width, cv.height);
        if (p === 1 && this.isRun()) {
          drawText(ctx, '?', 48, 26, 28, '#ffd23f', 'center');
          return;
        }
        const def = ROSTER[this.picks[p]];
        const mirror = p === 1 && this.picks[0] === this.picks[1];
        const palette = mirror && def.altPalette ? Object.assign({}, def.palette, def.altPalette) : def.palette;
        if (this.winPose[p] > 0) this.winPose[p]--;
        R(ctx, 26, 79, 44, 2, 'rgba(0,0,0,0.4)');
        Renderer.drawFighter(ctx, { def, palette, x: 48, y: 80, facing: p === 0 ? 1 : -1, vx: 0,
          state: this.winPose[p] > 0 ? 'win' : 'idle', animTime: t, flash: 0, attack: null, weaponOut: false, status: null });
      });
    } else if (scr === 'stage' && t % 2 === 0) {
      $$('#stage-list .stage-card canvas').forEach((cv, i) => {
        const ctx = cv.getContext('2d');
        drawStageBack(ctx, STAGES[i], t);
        drawStageFront(ctx, STAGES[i], t);
      });
    }
  },

  launch() {
    Sfx.init();
    if (Run.active && this.game.opts && this.game.opts.run) { Run.next(); return; }
    UI.show(null);
    const stage = this.stageIndex === -1 ? Math.floor(Math.random() * STAGES.length) : this.stageIndex;
    this.game.startMatch({ mode: this.mode, difficulty: this.difficulty, p1: this.picks[0], p2: this.picks[1], stage });
  },
};
