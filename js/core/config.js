'use strict';
// [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md
/* =====================================================================
 *  CONFIGURATION GLOBALE
 *  Toutes les valeurs d'équilibrage générales sont ici.
 * ===================================================================== */
const CONFIG = {
  WIDTH: 384,
  HEIGHT: 216,
  GROUND_Y: 194,            // ligne du sol (pieds des combattants)
  STAGE_PADDING: 10,        // marge gauche/droite de l'arène
  GRAVITY: 0.5,
  CHIP_DAMAGE: 0.12,        // % des dégâts subis en garde
  COMBO_SCALING: 0.1,       // -10% de dégâts par coup supplémentaire dans un combo
  MIN_COMBO_SCALING: 0.4,
  HITSTOP: 5,               // gel d'image à l'impact
  ATTACK_BUFFER: 6,         // une attaque pressée pendant un recovery est mémorisée N frames
  INPUT_HISTORY: 40,        // taille de l'historique des touches (combos)
  DASH_WINDOW: 12,          // délai max entre deux appuis pour un dash
  DASH_FRAMES: 14,
  DASH_SPEED: 4.2,
  BACKDASH_SPEED: 3.4,
  PK_LENIENCY: 3,           // frames de tolérance pour "Poing + Pied ensemble"
  METER_MAX: 100,           // jauge de super
  METER_ON_HIT: 7,
  METER_ON_TAKEN: 5,
  METER_ON_BLOCK: 2,
  METER_ON_SPECIAL: 3,
  COUNTER_HIT_BONUS: 1.2,   // bonus de dégâts quand on frappe un adversaire en plein démarrage
  SUPER_FREEZE: 42,         // durée de l'arrêt sur image cinématique d'une super
  LAND_FRAMES: 4,           // petite récupération à la réception d'un saut
  AIR_LAND_FRAMES: 7,       // … après une attaque aérienne
  DOWN_FRAMES: 28,          // au sol après une éjection (invulnérable)
  WAKE_FRAMES: 14,          // relevé (invulnérable)
  JUGGLE_MAX: 5,            // coups max sur un adversaire en l'air (hors super) → pas de jongle infini
  HITSTUN_DECAY: 1.2,       // le hitstun diminue au-delà du 3e coup d'un combo
  CANCEL_WINDOW: 6,         // frames de récupération pendant lesquelles un coup normal peut être annulé
  TECH_WINDOW: 8,           // frames pour se libérer d'une projection (Poing + Pied)
  PARTICLE_MAX: 350,
  DEBUG: false,             // F2 : afficher les hitboxes
};

/* Touches clavier (event.code = position physique → AZERTY et QWERTY fonctionnent) */
const KEYMAPS = {
  p1: { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'],
        punch: ['KeyF'], kick: ['KeyG'], guard: ['KeyH'] },
  p2: { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
        punch: ['KeyK', 'Numpad1'], kick: ['KeyL', 'Numpad2'], guard: ['Semicolon', 'Numpad3'] },
};

/* Manette (Gamepad API, disposition "standard" Xbox / PlayStation) */
const PAD_BUTTONS = {
  punch: [2],        // X / Carré
  kick: [0],         // A / Croix
  guard: [1, 5, 7],  // B / Rond, RB, RT
  both: [3],         // Y / Triangle = Poing + Pied (projection)
  start: [9],
  back: [8],
};

/* Niveaux de l'IA */
const AI_LEVELS = {
  easy:   { label: 'Facile',    reaction: [26, 44], blockDelay: 7, attackChance: 0.35, blockChance: 0.12, lowBlock: 0.3,
            comboChance: 0.08, jumpChance: 0.04, retreatChance: 0.15, antiProjectile: 0.15, punish: 0.05,
            superChance: 0.15, throwChance: 0.05, techChance: 0.05, antiAir: 0.1, cancelChance: 0.1 },
  medium: { label: 'Moyen',     reaction: [13, 24], blockDelay: 3, attackChance: 0.6,  blockChance: 0.42, lowBlock: 0.6,
            comboChance: 0.3,  jumpChance: 0.06, retreatChance: 0.1,  antiProjectile: 0.45, punish: 0.3,
            superChance: 0.4, throwChance: 0.15, techChance: 0.3, antiAir: 0.35, cancelChance: 0.4 },
  hard:   { label: 'Difficile', reaction: [5, 11],  blockDelay: 1, attackChance: 0.85, blockChance: 0.75, lowBlock: 0.9,
            comboChance: 0.55, jumpChance: 0.07, retreatChance: 0.06, antiProjectile: 0.8,  punish: 0.75,
            superChance: 0.8, throwChance: 0.3, techChance: 0.55, antiAir: 0.7, cancelChance: 0.75 },
};

/* Options du joueur, sauvegardées dans le navigateur */
const Settings = {
  KEY: 'pixel-brawl.settings.v1',
  data: { roundTime: 60, rounds: 2, music: true, sfx: true, shake: true, hitboxes: false,
          musicVol: 0.75, sfxVol: 1, arcadeBest: 0, survivalBest: 0 },
  load() {
    try { Object.assign(this.data, JSON.parse(localStorage.getItem(this.KEY) || '{}')); } catch (e) { /* stockage indisponible */ }
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* stockage indisponible */ }
  },
};
