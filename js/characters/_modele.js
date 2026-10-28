'use strict';
/* =====================================================================
 *  MODÈLE DE PERSONNAGE — copiez ce fichier pour créer un combattant
 * ---------------------------------------------------------------------
 *  1. Copiez ce fichier : js/characters/monperso.js
 *  2. Changez id, name, palette, attaques…
 *  3. Ajoutez dans index.html (bloc « Personnages ») :
 *       <script src="js/characters/monperso.js"></script>
 *  C'est tout : il apparaît dans l'écran de sélection et l'IA sait le jouer.
 *
 *  Pour l'apparence, vous pouvez réutiliser les armes et pièces des autres
 *  fichiers (ex : weapon: { type: 'katana' }, parts: ['longHair', 'robe'])
 *  à condition que leur fichier soit chargé avant le vôtre, ou définir les
 *  vôtres ici comme dans seiran.js / krank.js.
 * ===================================================================== */

/* (Optionnel) une pièce de costume perso : un bandeau */
PARTS.modeleBandeau = {
  head(g, J) {
    const h = J.head;
    g.R(h.x - 1, h.y + 2, h.w + 1, 2, 'band');          // 'band' = clé de la palette
    g.R(h.x - 4, h.y + 3, 3, 2, 'band');
  },
};

registerCharacter({
  id: 'modele',                       // identifiant unique
  name: 'MODÈLE',
  title: 'LE COBAYE',
  description: 'Un combattant à mains nues pour servir de base.',
  quotes: ['Je ne suis qu’un exemple… mais un exemple qui frappe.'],

  stats: { maxHp: 100, walkSpeed: 1.6, jumpForce: 8.4, jumpSpeed: 2.2, defense: 1.0 },
  hitbox: { w: 18, h: 46 },           // taille du corps (sert aussi à l'échelle du dessin)
  body: { armT: 3, legT: 4 },         // épaisseur des bras/jambes (optionnel)
  locomotion: 'step',                 // 'step' | 'stomp' (lourd) | 'skate' (glisse)
  // weapon: { type: 'katana' },      // sans arme = poings nus
  parts: ['belt', 'modeleBandeau'],

  palette: {
    skin: '#f0c090', skinShade: '#c09060', hair: '#3a2a1a',
    top: '#3a7a3a', topShade: '#285a28', pants: '#2a2a3a', pantsShade: '#1a1a26',
    shoes: '#1a1a1a', belt: '#1a1a1a', buckle: '#c9a227', band: '#e63946',
    accent: '#7fe07f',
  },
  altPalette: { top: '#7a3a3a', topShade: '#5a2828', band: '#4cc9f0', accent: '#4cc9f0' },

  /* Poses de base. hand = main avant relative à l'épaule, hand2 = main arrière */
  stance: {
    idle:  { hand: [6, 2], hand2: [7, 4] },
    guard: { hand: [4, -4], hand2: [6, -3], lean: -1 },
    win:   { hand: [2, -12], hand2: [4, 6] },
  },

  attacks: {
    punch: { damage: 5, startup: 4, active: 3, recovery: 8, hitbox: { x: 6, y: -36, w: 16, h: 8 },
      knockback: 1.8, hitstun: 15, blockstun: 9,
      anim: { windup: { hand: [2, 2] }, strike: { hand: [14, -1], lean: 2 } } },
    kick:  { damage: 7, startup: 6, active: 4, recovery: 11, hitbox: { x: 6, y: -24, w: 20, h: 9 },
      knockback: 2.4, hitstun: 16, blockstun: 10,
      anim: { windup: { footF: [5, -10] }, strike: { footF: [18, -16], lean: -3 } } },
  },

  /* Coups spéciaux : séquence de touches → attaque de base modifiée */
  combos: [
    { name: 'BOULE DE KI', sequence: ['down', 'forward', 'punch'], move: 'punch', damageMultiplier: 1.8,
      overrides: { startup: 10, active: 2, recovery: 18, hitbox: null,
        projectile: { shape: 'orb', speed: 3.5, w: 12, h: 10, y: -34, life: 120, color: '#7fe07f', core: '#ffffff' },
        anim: { windup: { hand: [-2, 2] }, strike: { hand: [12, 0], hand2: [12, 2], lean: 3 } } } },
    { name: 'COUP DE GENOU VOLANT', sequence: ['back', 'forward', 'kick'], move: 'kick', damageMultiplier: 2,
      overrides: { startup: 6, active: 10, recovery: 14, dash: 4, lift: -4, level: 'high', hitbox: { x: 2, y: -40, w: 22, h: 20 },
        launch: -4, hitstun: 26, anim: { windup: { crouch: 6 }, strike: { footF: [10, -20], footB: [-4, -6], lean: 4 } } } },
  ],

  /* Super (↓ → ↓ → + Poing, jauge pleine) */
  super: { name: 'TEMPÊTE DE POINGS', move: 'punch', damageMultiplier: 1.0,
    overrides: { startup: 8, active: 28, recovery: 20, dash: 2, hits: 6, hitEvery: 5, hitbox: { x: 0, y: -44, w: 26, h: 30 },
      afterimages: true, knockback: 4, launch: -5, hitstun: 30,
      anim: { flurry: 6, windup: { hand: [2, 2], hand2: [13, 0] }, strike: { hand: [14, -1], hand2: [3, 3], lean: 3 } } } },
});
