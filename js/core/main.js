'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
// [1.3] MODIFIÉ — mode en ligne (voir CHANGELOG_1.3.md)
/* =====================================================================
 *  DÉMARRAGE & BOUCLE PRINCIPALE (pas de temps fixe à 60 Hz)
 * ===================================================================== */
Settings.load();
CONFIG.DEBUG = !!Settings.data.hitboxes;

const game = new Game($('#game'));
Menu.init(game);
Net.initUI();
MenuNav.focusFirst();
Music.play(MENU_THEME);   // démarre au premier clic ou à la première touche (règle des navigateurs)

window.addEventListener('keydown', e => {
  Sfx.init();
  const scr = UI.active();
  if (e.code === 'F2') {
    CONFIG.DEBUG = !CONFIG.DEBUG;
    Settings.data.hitboxes = CONFIG.DEBUG;
    Settings.save();
    Menu.refreshOptions();
    e.preventDefault();
    return;
  }
  if (Net.inGame) {                                   // en ligne : pas de pause, le combat continue
    if (e.code === 'Escape' || e.code === 'KeyP') { Net.toggleMenu(); e.preventDefault(); return; }
    if (scr) MenuNav.onKey(e);
    else if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    return;
  }
  if (game.state === 'versus' && !game.paused && ['Enter', 'NumpadEnter', 'Space', 'KeyF', 'KeyK'].includes(e.code)) {
    game.skipVersus();
    return;
  }
  if (game.training && !game.paused && game.inMatch) {
    if (/^Digit[1-6]$/.test(e.code)) { game.dummyMode = +e.code.slice(5) - 1; return; }
    if (e.code === 'KeyR') { game.resetTraining(); return; }
    if (e.code === 'KeyT') { game.trainMeter = !game.trainMeter; return; }
  }
  if (e.code === 'Escape' || (e.code === 'KeyP' && game.inMatch)) {
    if (game.inMatch && game.state !== 'matchEnd') { game.togglePause(); e.preventDefault(); return; }
    if (scr) { MenuNav.back(); e.preventDefault(); }
    return;
  }
  if (scr) MenuNav.onKey(e);
});
window.addEventListener('keyup', e => { if (e.code === 'Space' && UI.active()) e.preventDefault(); });
document.addEventListener('pointerdown', () => Sfx.init());

/* Manette dans les menus */
function padMenu() {
  if (Net.inGame) {
    if (Pads.anyPressed('start')) Net.toggleMenu();
    else if (UI.active() && Pads.anyPressed('confirm')) MenuNav.confirm();
    return;
  }
  if (Pads.anyPressed('start') && game.inMatch && game.state !== 'matchEnd') { game.togglePause(); return; }
  if (Pads.anyPressed('back') && game.training && game.inMatch && !game.paused) { game.resetTraining(); return; }
  if (Net.inGame) {                                   // en ligne : pas de pause, le combat continue
    if (e.code === 'Escape' || e.code === 'KeyP') { Net.toggleMenu(); e.preventDefault(); return; }
    if (scr) MenuNav.onKey(e);
    else if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    return;
  }
  if (game.state === 'versus' && !game.paused && (Pads.anyPressed('confirm') || Pads.anyPressed('punch'))) game.skipVersus();
  if (!UI.active()) return;
  if (Pads.anyPressed('up')) MenuNav.move(0, -1);
  else if (Pads.anyPressed('down')) MenuNav.move(0, 1);
  else if (Pads.anyPressed('left')) MenuNav.move(-1, 0);
  else if (Pads.anyPressed('right')) MenuNav.move(1, 0);
  else if (Pads.anyPressed('confirm')) { Sfx.init(); MenuNav.confirm(); }
  else if (Pads.anyPressed('cancel')) MenuNav.back();
}

const STEP = 1000 / 60;
let last = performance.now(), acc = 0;
function loop(now) {
  acc += Math.min(100, now - last);
  last = now;
  while (acc >= STEP) {
    Pads.poll();
    padMenu();
    Net.tick(game);
    acc -= STEP;
  }
  game.render();
  Net.drawOverlay(game.ctx);
  Menu.renderPreviews(game.globalTime);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
