'use strict';
// [1.3] NOUVEAU — mode en ligne (voir CHANGELOG_1.3.md)
/* =====================================================================
 *  EN LIGNE : deux navigateurs reliés en pair-à-pair (WebRTC)
 *
 *  1. Mise en relation : les deux joueurs se retrouvent grâce au serveur
 *     public gratuit de PeerJS (0.peerjs.com), qui ne fait que transmettre
 *     les messages d'ouverture de connexion. Ensuite, tout passe en direct
 *     d'un navigateur à l'autre (canal de données WebRTC).
 *  2. Synchronisation « lockstep » : chaque frame, chaque joueur envoie ses
 *     touches. Les deux navigateurs font tourner exactement la même
 *     simulation avec les mêmes touches et le même hasard (graine commune).
 *     Les touches sont appliquées avec quelques frames de délai (selon le
 *     ping) pour laisser le temps au réseau de les transporter.
 *
 *  Serveur de mise en relation personnalisé (facultatif) :
 *    index.html?peer=wss://mon-serveur.exemple:443/   (serveur « peer » de PeerJS)
 * ===================================================================== */
const NET_VERSION = 'pixel-brawl-net-2';
const NET_ACTIONS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'guard'];
const NET_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const NET_PREFIX = 'pixelbrawl-n2-';
const NET_ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
];
const SYS_RANDOM = Math.random;

/* Générateur pseudo-aléatoire reproductible (même graine → même suite) */
function seededRandom(seed) {
  let a = seed >>> 0;
  const f = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.state = () => a;
  return f;
}

/* Les sons et la musique ne doivent jamais consommer le hasard partagé :
 * ils dépendent des options de chaque joueur (son coupé, etc.). */
function withSystemRandom(obj, name) {
  const fn = obj[name];
  obj[name] = function (...args) {
    const r = Math.random;
    Math.random = SYS_RANDOM;
    try { return fn.apply(this, args); } finally { Math.random = r; }
  };
}
withSystemRandom(Sfx, 'play');
withSystemRandom(Music, 'play');
withSystemRandom(Ambience, 'play');

/* Contrôleur alimenté par les touches reçues (local ou distant, traités pareil) */
class NetController {
  constructor() { this.held = {}; this.pressed = new Set(); this.acc = 0; }
  feed(bits) {
    NET_ACTIONS.forEach((a, i) => { this.held[a] = !!(bits & (1 << i)); });
    this.acc |= (bits >> 7) & 0x7f;                  // les appuis s'accumulent jusqu'à la lecture
  }
  update() {
    this.pressed.clear();
    NET_ACTIONS.forEach((a, i) => { if (this.acc & (1 << i)) this.pressed.add(a); });
    this.acc = 0;
  }
  reset() { this.acc = 0; this.pressed.clear(); }
}

/* --------------------------------------------------------------------
 *  Mise en relation : client minimal du protocole du serveur PeerJS
 * -------------------------------------------------------------------- */
class Signal {
  constructor(id, h) {
    this.id = id;
    this.h = h;
    this.open = false;
    const base = Net.serverURL();
    const token = Math.random().toString(36).slice(2, 12);
    try {
      this.ws = new WebSocket(`${base}peerjs?key=peerjs&id=${encodeURIComponent(id)}&token=${token}&version=1.5.4`);
    } catch (e) { setTimeout(() => h.error('server'), 0); return; }
    this.ws.onopen = () => { this.beat = setInterval(() => this.raw({ type: 'HEARTBEAT' }), 5000); };
    this.ws.onmessage = ev => {
      let m;
      try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.type === 'OPEN') { this.open = true; h.open(); }
      else if (m.type === 'ID-TAKEN') h.error('taken');
      else if (m.type === 'ERROR') h.error('server', m.payload && m.payload.msg);
      else if (m.type === 'EXPIRE') h.error('unavailable');
      else if (m.type !== 'HEARTBEAT') h.message(m);
    };
    this.ws.onerror = () => { if (!this.open) h.error('server'); };
    this.ws.onclose = () => { clearInterval(this.beat); if (this.open && h.close) h.close(); this.open = false; };
  }
  raw(m) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); }
  send(type, dst, payload) { this.raw({ type, dst, payload }); }
  close() {
    clearInterval(this.beat);
    this.h = { open() {}, error() {}, message() {}, close() {} };
    try { if (this.ws) this.ws.close(); } catch (e) { /* déjà fermé */ }
  }
}

/* --------------------------------------------------------------------
 *  Net : connexion, salon, synchronisation des frames
 * -------------------------------------------------------------------- */
const Net = {
  phase: 'off',          // off | hosting | joining | lobby | game | result
  inGame: false,
  role: null,            // 'host' (joueur 1) ou 'guest' (joueur 2)

  serverURL() {
    const p = new URLSearchParams(location.search).get('peer');
    if (p) return p.endsWith('/') ? p : p + '/';
    return 'wss://0.peerjs.com:443/';
  },

  version() { return NET_VERSION + '|' + ROSTER.map(d => d.id).join(',') + '|' + STAGES.map(s => s.id || s.name).join(','); },

  status(text, kind) {
    const el = $('#net-status');
    if (!el) return;
    el.innerHTML = text;
    el.className = 'net-status' + (kind ? ' ' + kind : '');
  },

  /* ---------- Créer une partie ---------- */
  /* La bibliothèque officielle PeerJS (chargée depuis unpkg dans index.html) est utilisée si
   * elle est disponible ; sinon (hors ligne, serveur personnalisé ?peer=…), client intégré. */
  useLib() { return typeof window.Peer === 'function' && !new URLSearchParams(location.search).get('peer'); },

  libErrorText(err) {
    const t = err && err.type;
    if (t === 'peer-unavailable') return `Aucune partie trouvée avec le code ${this.code}. Vérifiez le code, et que votre ami est bien sur l'écran « En attente ».`;
    if (t === 'browser-incompatible') return 'Ce navigateur ne gère pas le jeu en ligne (WebRTC). Essayez Chrome, Edge ou Firefox à jour.';
    if (t === 'webrtc' || t === 'negotiation-failed') return "Impossible d'établir la connexion directe avec votre ami (réseau trop restrictif ?).";
    return `Serveur de mise en relation injoignable ou connexion perdue. Réessayez dans un instant. (${t || 'erreur'})`;
  },

  newPeer(id) {
    const peer = new window.Peer(id, { config: { iceServers: NET_ICE }, debug: 1 });
    peer.on('disconnected', () => {
      // simple perte du serveur de mise en relation : sans gravité une fois connectés
      if ((this.phase === 'hosting' || this.phase === 'joining') && this.peer === peer && !peer.destroyed) {
        setTimeout(() => { try { if (!peer.destroyed) peer.reconnect(); } catch (e) { /* */ } }, 1000);
      }
    });
    return peer;
  },

  bindConn(conn) {
    this.conn = conn;
    this.link = { send: m => { if (conn.open) conn.send(m); }, close: () => { try { conn.close(); } catch (e) { /* */ } } };
    conn.on('open', () => this.send({ t: 'hello', v: this.version() }));
    conn.on('data', m => { if (typeof m === 'string') { try { m = JSON.parse(m); } catch (e) { return; } } this.onData(m); });
    conn.on('close', () => { if (this.conn === conn) this.lost(); });
    conn.on('error', () => { if (this.conn === conn && this.phase === 'joining') this.fail(this.libErrorText({ type: 'webrtc' })); });
  },

  host() {
    this.reset();
    this.role = 'host';
    this.phase = 'hosting';
    this.code = Array.from({ length: 5 }, () => NET_ALPHABET[Math.floor(SYS_RANDOM() * NET_ALPHABET.length)]).join('');
    this.status('Connexion au serveur de mise en relation…');
    if (this.useLib()) {
      const peer = this.peer = this.newPeer(NET_PREFIX + this.code);
      peer.on('open', () => {
        if (this.peer !== peer || this.phase !== 'hosting') return;
        this.status(`CODE DE LA PARTIE<b class="code">${this.code}</b>Donnez ce code à votre ami (ou envoyez-lui le lien).<br>En attente de son arrivée…`);
        $('#btn-net-copy').classList.remove('hidden');
      });
      peer.on('connection', conn => {
        if (this.conn) {                              // partie déjà complète
          conn.on('open', () => { conn.send({ t: 'bye', why: 'full' }); setTimeout(() => conn.close(), 500); });
          return;
        }
        this.status('Un joueur arrive…');
        this.bindConn(conn);
      });
      peer.on('error', err => {
        if (this.peer !== peer) return;
        if (err.type === 'unavailable-id') { this.host(); return; }
        if (this.phase === 'hosting') this.fail(this.libErrorText(err));
      });
      return;
    }
    this.sig = new Signal(NET_PREFIX + this.code, {
      open: () => {
        this.status(`CODE DE LA PARTIE<b class="code">${this.code}</b>Donnez ce code à votre ami (ou envoyez-lui le lien).<br>En attente de son arrivée…`);
        $('#btn-net-copy').classList.remove('hidden');
      },
      error: (kind, msg) => {
        if (kind === 'taken') return this.host();
        this.fail(kind === 'server' ? 'Serveur de mise en relation injoignable. Vérifiez votre connexion internet.' + (msg ? ` (${msg})` : '') : 'Erreur de connexion.');
      },
      message: m => this.onSignal(m),
      close: () => { if (this.phase === 'hosting') this.fail('Connexion au serveur perdue.'); },
    });
  },

  inviteLink() {
    return location.origin + location.pathname + '?join=' + this.code + (new URLSearchParams(location.search).get('peer') ? '&peer=' + encodeURIComponent(this.serverURL()) : '');
  },

  copyLink() {
    const link = this.inviteLink();
    const done = () => { $('#btn-net-copy').textContent = 'LIEN COPIÉ !'; setTimeout(() => { $('#btn-net-copy').textContent = "COPIER LE LIEN D'INVITATION"; }, 2000); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(link).then(done, () => prompt('Lien à envoyer :', link));
    else prompt('Lien à envoyer :', link);
  },

  /* ---------- Rejoindre ---------- */
  join(code) {
    code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) { this.status('Entrez le code donné par votre ami.', 'err'); return; }
    this.reset();
    this.role = 'guest';
    this.phase = 'joining';
    this.code = code;
    this.status(`Recherche de la partie <b>${code}</b>…`);
    const myId = NET_PREFIX + 'g' + Math.floor(SYS_RANDOM() * 1e12).toString(36);
    this.hostId = NET_PREFIX + code;
    this.joinTimer = setTimeout(() => { if (this.phase === 'joining') this.fail("Impossible d'établir la connexion directe avec votre ami (réseau trop restrictif ?)."); }, 25000);
    if (this.useLib()) {
      const peer = this.peer = this.newPeer(myId);
      peer.on('open', () => {
        if (this.peer !== peer || this.phase !== 'joining' || this.conn) return;
        this.status(`Connexion à la partie <b>${code}</b>…`);
        this.bindConn(peer.connect(this.hostId, { reliable: true, serialization: 'json' }));
      });
      peer.on('error', err => {
        if (this.peer !== peer) return;
        if (err.type === 'unavailable-id') { this.join(code); return; }
        if (this.phase === 'joining') this.fail(this.libErrorText(err));
      });
      return;
    }
    this.sig = new Signal(myId, {
      open: () => this.makePeer(true),
      error: kind => this.fail(kind === 'unavailable' ? `Aucune partie trouvée avec le code ${code}.`
        : kind === 'server' ? 'Serveur de mise en relation injoignable. Vérifiez votre connexion internet.' : 'Erreur de connexion.'),
      message: m => this.onSignal(m),
      close: () => { if (this.phase === 'joining') this.fail('Connexion au serveur perdue.'); },
    });
  },

  /* ---------- WebRTC ---------- */
  makePeer(initiator) {
    const pc = this.pc = new RTCPeerConnection({ iceServers: NET_ICE });
    this.pendingIce = [];
    pc.onicecandidate = e => { if (e.candidate) this.sig.send('CANDIDATE', this.peerId(), { candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') this.lost(); };
    if (initiator) {
      this.bindChannel(pc.createDataChannel('pixel-brawl', { ordered: true }));
      pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => {
        this.sig.send('OFFER', this.hostId, { sdp: pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription, game: 'pixel-brawl' });
      }).catch(() => this.fail('Erreur WebRTC.'));
    } else {
      pc.ondatachannel = e => this.bindChannel(e.channel);
    }
  },

  peerId() { return this.role === 'host' ? this.guestId : this.hostId; },

  onSignal(m) {
    const p = m.payload || {};
    if (m.type === 'OFFER' && this.role === 'host') {
      if (this.pc) { this.sig.send('ANSWER', m.src, { busy: true }); return; }
      this.guestId = m.src;
      this.makePeer(false);
      this.status('Un joueur arrive…');
      this.pc.setRemoteDescription(p.sdp)
        .then(() => this.flushIce())
        .then(() => this.pc.createAnswer())
        .then(a => this.pc.setLocalDescription(a))
        .then(() => this.sig.send('ANSWER', m.src, { sdp: this.pc.localDescription.toJSON ? this.pc.localDescription.toJSON() : this.pc.localDescription }))
        .catch(() => this.fail('Erreur WebRTC.'));
    } else if (m.type === 'ANSWER' && this.role === 'guest' && m.src === this.hostId) {
      if (p.busy) { this.fail('Cette partie est déjà complète.'); return; }
      this.pc.setRemoteDescription(p.sdp).then(() => this.flushIce()).catch(() => this.fail('Erreur WebRTC.'));
    } else if (m.type === 'CANDIDATE' && this.pc && m.src === this.peerId()) {
      if (this.pc.remoteDescription) this.pc.addIceCandidate(p.candidate).catch(() => {});
      else this.pendingIce.push(p.candidate);
    }
  },

  flushIce() {
    const list = this.pendingIce || [];
    this.pendingIce = [];
    return Promise.all(list.map(c => this.pc.addIceCandidate(c).catch(() => {})));
  },

  bindChannel(ch) {
    this.ch = ch;
    this.link = { send: m => { if (ch.readyState === 'open') ch.send(JSON.stringify(m)); }, close: () => { try { ch.close(); } catch (e) { /* */ } } };
    ch.onopen = () => this.send({ t: 'hello', v: this.version() });
    ch.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (err) { return; } this.onData(m); };
    ch.onclose = () => this.lost();
  },

  send(m) { if (this.link) this.link.send(m); },

  onData(m) {
    switch (m.t) {
      case 'hello':
        if (m.v !== this.version()) { this.send({ t: 'bye', why: 'version' }); this.fail("Vos deux versions du jeu sont différentes. Rechargez la page (Ctrl+F5) des deux côtés."); return; }
        clearTimeout(this.joinTimer);
        this.rtt = 0; this.rtts = [];
        this.send({ t: 'ping', ts: performance.now() });
        this.pingTimer = setInterval(() => this.send({ t: 'ping', ts: performance.now() }), 1000);
        if (this.sig) { this.sig.close(); this.sig = null; }   // la suite se passe en direct
        if (this.peer && !this.peer.destroyed) { try { this.peer.disconnect(); } catch (e) { /* */ } }
        this.openLobby();
        break;
      case 'ping': this.send({ t: 'pong', ts: m.ts }); break;
      case 'pong': {
        const v = performance.now() - m.ts;
        this.rtts = (this.rtts || []).concat(v).slice(-6);
        this.rtt = this.rtts.length === 1 ? v : this.rtt * 0.7 + v * 0.3;
        this.refreshLobbyInfo();
        break;
      }
      case 'pick': this.them.pick = m.c; this.them.ready = m.ready; this.refreshLobby(); this.maybeStart(); break;
      case 'stage': this.stage = m.s; this.refreshLobby(); break;
      case 'start': if (this.role === 'guest') this.beginMatch(m); break;
      case 'i': if (m.m === this.matchId) this.remote.set(m.f, m.b); break;
      case 'h': if (m.m === this.matchId) this.checkHash(m.f, m.h, true); break;
      case 'again': this.them.again = true; this.maybeRematch(); this.refreshResultInfo(); break;
      case 'lobby': this.openLobby(); break;
      case 'bye': if (m.why === 'full') { this.fail('Cette partie est déjà complète.'); break; }
        this.lost(m.why === 'version' ? "Vos deux versions du jeu sont différentes. Rechargez la page des deux côtés." : 'Votre adversaire a quitté la partie.'); break;
    }
  },

  /* ---------- Salon : choix des personnages ---------- */
  openLobby() {
    this.phase = 'lobby';
    this.inGame = false;
    const game = Menu.game;
    game.state = 'menu'; game.fighters = []; game.paused = false;
    this.me = this.me || { pick: Menu.picks[0] || 0 };
    this.them = this.them || { pick: 0 };
    this.me.ready = false; this.them.ready = false; this.me.again = false; this.them.again = false;
    if (this.stage == null) this.stage = Menu.stageIndex != null ? Menu.stageIndex : 0;
    Music.play(MENU_THEME);
    Ambience.stop();
    UI.show('lobby');
    this.sendPick();
    if (this.role === 'host') this.send({ t: 'stage', s: this.stage });
    this.refreshLobby();
    setTimeout(() => { const b = $$('#lobby-roster .portrait')[this.me.pick]; if (b) b.focus({ preventScroll: true }); }, 0);
  },

  myIndex() { return this.role === 'host' ? 0 : 1; },
  picksBySide() { return this.role === 'host' ? [this.me.pick, this.them.pick] : [this.them.pick, this.me.pick]; },

  setPick(i) {
    if (this.phase !== 'lobby') return;
    this.me.pick = i;
    this.me.ready = false;
    this.sendPick();
    this.refreshLobby();
    setTimeout(() => $('#btn-lobby-ready').focus({ preventScroll: true }), 0);
  },

  sendPick() { this.send({ t: 'pick', c: this.me.pick, ready: !!this.me.ready }); },

  toggleReady() {
    this.me.ready = !this.me.ready;
    this.sendPick();
    this.refreshLobby();
    this.maybeStart();
  },

  cycleStage() {
    if (this.role !== 'host') return;
    const n = STAGES.length + 1;                    // + aléatoire (-1)
    const cur = this.stage === -1 ? STAGES.length : this.stage;
    const next = (cur + 1) % n;
    this.stage = next === STAGES.length ? -1 : next;
    this.send({ t: 'stage', s: this.stage });
    this.refreshLobby();
  },

  buildLobbyRoster() {
    const box = $('#lobby-roster');
    box.innerHTML = '';
    ROSTER.forEach((def, i) => {
      const b = document.createElement('button');
      b.className = 'portrait';
      b.title = def.name;
      b.innerHTML = `<canvas width="40" height="56"></canvas><span class="nm">${def.name}</span><i class="badge p1">1</i><i class="badge p2">2</i>`;
      b.onclick = () => this.setPick(i);
      box.appendChild(b);
      const ctx = b.querySelector('canvas').getContext('2d');
      ctx.imageSmoothingEnabled = false;
      Renderer.drawFighter(ctx, { def, palette: def.palette, x: 20, y: 54, facing: 1, vx: 0, state: 'idle',
        animTime: 0, flash: 0, attack: null, weaponOut: false, status: null });
    });
  },

  refreshLobby() {
    if (UI.active() !== 'lobby') return;
    const [p1, p2] = this.picksBySide();
    $$('#lobby-roster .portrait').forEach((b, i) => { b.classList.toggle('sel1', p1 === i); b.classList.toggle('sel2', p2 === i); });
    const mine = this.myIndex();
    [0, 1].forEach(side => {
      const def = ROSTER[side === 0 ? p1 : p2];
      const root = $(`#lpick-${side}`);
      const isMe = side === mine;
      const ready = isMe ? this.me.ready : this.them.ready;
      root.classList.toggle('active', isMe);
      root.querySelector('.pick-label').textContent = (isMe ? 'VOUS' : 'ADVERSAIRE') + (side === 0 ? ' (J1)' : ' (J2)');
      root.querySelector('.pick-name').textContent = def.name;
      root.querySelector('.pick-title').textContent = def.title || '';
      root.querySelector('.ready').textContent = ready ? 'PRÊT !' : 'CHOISIT…';
      root.querySelector('.ready').classList.toggle('on', !!ready);
    });
    const st = STAGES[this.stage];
    $('#btn-lobby-stage').textContent = `ARÈNE : ${st ? st.name : 'ALÉATOIRE'}${this.role === 'host' ? ' ▶' : ''}`;
    $('#btn-lobby-stage').disabled = this.role !== 'host';
    $('#btn-lobby-ready').textContent = this.me.ready ? 'ANNULER' : 'PRÊT !';
    this.refreshLobbyInfo();
  },

  refreshLobbyInfo() {
    const el = $('#lobby-info');
    if (!el || UI.active() !== 'lobby') return;
    const both = this.me.ready && this.them.ready;
    el.textContent = `PING ${Math.round(this.rtt || 0)} MS • ${this.role === 'host' ? "VOUS CHOISISSEZ L'ARÈNE" : "L'HÔTE CHOISIT L'ARÈNE"}` +
      (both ? ' • LANCEMENT…' : this.me.ready ? " • EN ATTENTE DE L'ADVERSAIRE" : '');
  },

  renderLobby(t) {
    const [p1, p2] = this.picksBySide();
    [0, 1].forEach(side => {
      const cv = $(`#lpick-${side} canvas`), ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      const def = ROSTER[side === 0 ? p1 : p2];
      const mirror = side === 1 && p1 === p2;
      const palette = mirror && def.altPalette ? Object.assign({}, def.palette, def.altPalette) : def.palette;
      R(ctx, 26, 79, 44, 2, 'rgba(0,0,0,0.4)');
      const ready = side === this.myIndex() ? this.me.ready : this.them.ready;
      Renderer.drawFighter(ctx, { def, palette, x: 48, y: 80, facing: side === 0 ? 1 : -1, vx: 0,
        state: ready ? 'win' : 'idle', animTime: t, flash: 0, attack: null, weaponOut: false, status: null });
    });
  },

  maybeStart() {
    if (this.role !== 'host' || this.phase !== 'lobby' || !this.me.ready || !this.them.ready) return;
    this.hostStart();
  },

  hostStart() {
    const [p1, p2] = this.picksBySide();
    const stage = this.stage === -1 ? Math.floor(SYS_RANDOM() * STAGES.length) : this.stage;
    const m = { t: 'start', p1, p2, stage, seed: Math.floor(SYS_RANDOM() * 4294967296), delay: this.pickDelay(),
      roundTime: Settings.data.roundTime, rounds: Settings.data.rounds };
    this.send(m);
    this.beginMatch(m);
  },

  /* Délai d'application des touches (en frames) : couvre l'aller simple du
   * réseau sur les dernières mesures, + 2 frames de marge. Ping 50 ms → 4 frames. */
  pickDelay() {
    const worst = Math.max(this.rtt || 100, ...(this.rtts && this.rtts.length ? this.rtts : [100]));
    return clamp(Math.ceil(worst / 2 / (1000 / 60)) + 2, 3, 12);
  },

  /* ---------- Match ---------- */
  beginMatch(m) {
    this.phase = 'game';
    this.lastStart = m;
    this.delay = m.delay;
    this.rng = seededRandom(m.seed);
    this.frame = 0;
    this.stall = 0;
    this.desync = false;
    this.matchId = m.seed;                         // les messages d'un ancien match sont ignorés
    this.local = new Map();
    this.remote = new Map();
    this.hashes = new Map();
    this.remoteHashes = new Map();
    for (let f = 0; f < this.delay; f++) { this.local.set(f, 0); this.remote.set(f, 0); }
    this.ctrls = [new NetController(), new NetController()];
    this.me.again = false; this.them.again = false;
    UI.show(null);
    this.inGame = true;
    this.withRng(() => Menu.game.startMatch({ mode: 'online', online: true, p1: m.p1, p2: m.p2, stage: m.stage,
      rounds: m.rounds, roundTime: m.roundTime, controllers: this.ctrls, netSide: this.myIndex() }));
    this.sampleLocal();
  },

  withRng(fn) {
    const r = Math.random;
    Math.random = this.rng;
    try { return fn(); } finally { Math.random = r; }
  },

  /* Touches de ce joueur (ZQSD/WASD ou flèches, au choix, + manette) */
  sampleLocal() {
    const target = this.frame + this.delay;
    if (this.local.has(target)) return;
    const kb = Menu.game.keyboard;
    let bits = 0;
    if (!UI.active()) {
      NET_ACTIONS.forEach((a, i) => {
        const codes = KEYMAPS.p1[a].concat(KEYMAPS.p2[a]);
        let held = codes.some(c => kb.down.has(c)), pressed = codes.some(c => kb.justPressed.has(c));
        for (let p = 0; p < 4; p++) { held = held || Pads.held(p, a); pressed = pressed || Pads.pressed(p, a); }
        if (held) bits |= 1 << i;
        if (pressed) bits |= 1 << (i + 7);
      });
    }
    kb.justPressed.clear();
    this.local.set(target, bits);
    this.send({ t: 'i', m: this.matchId, f: target, b: bits });
  },

  /* Appelé 60 fois par seconde à la place de game.update() */
  tick(game) {
    if (!this.inGame) { game.update(); return; }
    let steps = 0;
    while (steps < 2 && this.remote.has(this.frame) && this.local.has(this.frame)) {
      this.advance(game);
      steps++;
      if (!this.inGame || !this.remote.has(this.frame + this.delay)) break;   // on ne rattrape que si on a du retard
    }
    if (steps) this.stall = 0;
    else if (++this.stall > 60 * 12) this.lost('La connexion avec votre adversaire a été perdue.');
  },

  advance(game) {
    const f = this.frame, me = this.myIndex();
    this.ctrls[me].feed(this.local.get(f));
    this.ctrls[1 - me].feed(this.remote.get(f));
    this.local.delete(f); this.remote.delete(f);
    this.withRng(() => game.update());
    if (f % 60 === 30) {
      const h = this.hash(game);
      this.hashes.set(f, h);
      this.send({ t: 'h', m: this.matchId, f, h });
      this.checkHash(f, h, false);
    }
    this.frame++;
    if (this.inGame) this.sampleLocal();
  },

  hash(game) {
    let s = `${game.frame}|${game.state}|${this.rng.state()}|${game.projectiles.length}`;
    for (const fi of game.fighters) s += `|${fi.x},${fi.y},${fi.vx},${fi.vy},${fi.hp},${fi.meter},${fi.state},${fi.wins},${fi.attackFrame}`;
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  },

  checkHash(f, h, remote) {
    if (remote) {
      this.remoteHashes = this.remoteHashes || new Map();
      this.remoteHashes.set(f, h);
    }
    const mine = this.hashes && this.hashes.get(f), theirs = this.remoteHashes && this.remoteHashes.get(f);
    if (mine == null || theirs == null) return;
    if (mine !== theirs && !this.desync) {
      this.desync = true;
      console.warn('[Pixel Brawl] désynchronisation à la frame', f);
    }
    this.hashes.delete(f); this.remoteHashes.delete(f);
  },

  /* Petit affichage par-dessus le jeu : ping, attente, alerte */
  drawOverlay(ctx) {
    if (!this.inGame) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.7;
    drawText(ctx, `PING ${Math.round(this.rtt || 0)}`, CONFIG.WIDTH / 2, 28, 6, '#9fdcff', 'center');
    ctx.globalAlpha = 1;
    if (this.stall > 20) {
      R(ctx, 0, 92, CONFIG.WIDTH, 24, 'rgba(0,0,0,0.7)');
      drawText(ctx, "EN ATTENTE DE L'ADVERSAIRE…", CONFIG.WIDTH / 2, 100, 8, '#ffd23f', 'center');
    }
    if (this.desync) drawText(ctx, 'DÉSYNCHRONISATION : RELANCEZ LE MATCH', CONFIG.WIDTH / 2, 38, 6, '#ff6b6b', 'center');
    ctx.restore();
  },

  /* ---------- Fin de match ---------- */
  onMatchEnd(winner, game) {
    this.inGame = false;
    this.phase = 'result';
    const won = game.fighters.indexOf(winner) === this.myIndex();
    const [a, b] = game.fighters;
    $('#result-title').innerHTML = `${won ? 'VICTOIRE !' : 'DÉFAITE'}<span>${winner.def.name} REMPORTE LE MATCH</span>`;
    $('#result-quote').textContent = `« ${pick(winner.def.quotes)} »`;
    this.resultScore = `Score : ${a.wins} - ${b.wins}`;
    const box = $('#result-buttons');
    box.innerHTML = '';
    const mk = (label, action, main, back) => {
      const el = document.createElement('button');
      el.textContent = label;
      if (main) el.dataset.default = ''; else el.className = 'ghost';
      if (back) el.dataset.back = '';
      el.onclick = action;
      box.appendChild(el);
      return el;
    };
    mk('REVANCHE', () => { this.me.again = true; this.send({ t: 'again' }); this.refreshResultInfo(); this.maybeRematch(); }, true);
    mk('CHANGER DE PERSO', () => { this.send({ t: 'lobby' }); this.openLobby(); });
    mk('QUITTER', () => this.leave(), false, true);
    UI.show('result');
    this.refreshResultInfo();
  },

  refreshResultInfo() {
    if (this.phase !== 'result') return;
    const w = this.me.again ? "En attente de l'adversaire…" : this.them.again ? "Votre adversaire veut sa revanche !" : '';
    $('#result-sub').textContent = this.resultScore + (w ? '  •  ' + w : '');
  },

  maybeRematch() {
    if (this.phase !== 'result' || this.role !== 'host' || !this.me.again || !this.them.again) return;
    const m = Object.assign({}, this.lastStart, { seed: Math.floor(SYS_RANDOM() * 4294967296),
      delay: this.pickDelay() });
    if (this.stage === -1) m.stage = Math.floor(SYS_RANDOM() * STAGES.length);
    this.send(m);
    this.beginMatch(m);
  },

  /* ---------- Menu pendant le combat (le jeu continue !) ---------- */
  toggleMenu() {
    if (UI.active() === 'netmenu') UI.show(null);
    else if (!UI.active()) UI.show('netmenu');
  },

  /* ---------- Fin de connexion ---------- */
  fail(msg) {
    const wasLobby = this.phase === 'lobby' || this.phase === 'game' || this.phase === 'result';
    this.reset();
    if (wasLobby) { Menu.openMain(); }
    Menu.openOnline();
    this.status(msg, 'err');
  },

  lost(msg) {
    if (this.phase === 'off') return;
    if (this.phase === 'hosting' || this.phase === 'joining') { this.fail(msg || 'Connexion impossible.'); return; }
    this.fail(msg || 'Votre adversaire s\'est déconnecté.');
  },

  leave() {
    this.send({ t: 'bye' });
    this.reset();
    Menu.openMain();
  },

  reset() {
    this.phase = 'off';
    this.inGame = false;
    clearTimeout(this.joinTimer);
    clearInterval(this.pingTimer);
    if (this.sig) { this.sig.close(); this.sig = null; }
    if (this.ch) { this.ch.onclose = null; try { this.ch.close(); } catch (e) { /* */ } this.ch = null; }
    const conn = this.conn, peer = this.peer;
    this.conn = null; this.peer = null; this.link = null;
    // fermeture différée : laisse partir un éventuel dernier message (« bye »)
    setTimeout(() => {
      if (conn) { try { conn.close(); } catch (e) { /* */ } }
      if (peer) { try { peer.destroy(); } catch (e) { /* */ } }
    }, 300);
    if (this.pc) { this.pc.onconnectionstatechange = null; try { this.pc.close(); } catch (e) { /* */ } this.pc = null; }
    this.me = null; this.them = null; this.stage = null;
    this.remote = new Map(); this.remoteHashes = new Map(); this.hashes = new Map();
    this.guestId = null; this.hostId = null;
    const copy = $('#btn-net-copy');
    if (copy) copy.classList.add('hidden');
  },

  /* ---------- Branchement de l'interface ---------- */
  initUI() {
    $('#btn-online').onclick = () => Menu.openOnline();
    $('#btn-net-host').onclick = () => this.host();
    $('#btn-net-join').onclick = () => this.join($('#net-code').value);
    $('#btn-net-copy').onclick = () => this.copyLink();
    $('#btn-net-back').onclick = () => { this.reset(); Menu.openMain(); };
    $('#net-code').addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); this.join($('#net-code').value); }
      else if (e.code === 'Escape') { e.preventDefault(); $('#net-code').blur(); $('#btn-net-back').focus(); }
      else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { e.preventDefault(); MenuNav.move(0, e.code === 'ArrowUp' ? -1 : 1); }
    });
    $('#net-code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
    $('#btn-lobby-ready').onclick = () => this.toggleReady();
    $('#btn-lobby-stage').onclick = () => this.cycleStage();
    $('#btn-lobby-quit').onclick = () => this.leave();
    $('#btn-netmenu-resume').onclick = () => UI.show(null);
    $('#btn-netmenu-quit').onclick = () => this.leave();
    this.buildLobbyRoster();
    const join = new URLSearchParams(location.search).get('join');
    if (join) {
      Menu.openOnline();
      $('#net-code').value = join.toUpperCase();
      this.join(join);
    }
  },
};
