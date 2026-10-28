# Pixel Brawl
<!-- [1.2] MODIFIÉ — détail des changements dans CHANGELOG_1.2.md -->
<!-- [1.3] MODIFIÉ — section « Jouer en ligne » -->

Jeu de combat 2D en pixel art, en HTML/CSS/JavaScript pur (Canvas API).
Ouvrez `index.html` dans un navigateur : aucune installation ni serveur nécessaire.

## Structure

```
index.html                 écrans + liste des scripts (l'ordre compte)
css/style.css              mise en page des menus
js/core/                   le moteur (rarement à modifier)
  config.js                réglages, touches, niveaux d'IA, options sauvegardées
  utils.js                 dessin pixel art, maths
  registry.js              registres + defineCharacter / registerCharacter / registerStage
  audio.js                 bruitages et séquenceur de musique chiptune
  input.js                 clavier, manettes
  pose.js                  squelette articulé et animations par poses clés
  render.js                rendu des combattants, effets génériques
  projectile.js            projectiles (rafales, pluie, éruption, rayon, chaîne…)
  fighter.js               logique d'un combattant (combos, garde, statuts, super…)
  ai.js                    IA + mannequin d'entraînement
  game.js                  rounds, collisions, HUD, écran VS, cinématique de super
  ui.js                    menus, sélection perso/arène, options, pause
  net.js                   mode en ligne (WebRTC, salon, synchronisation)
  main.js                  démarrage et boucle 60 Hz
js/characters/             UN FICHIER PAR PERSONNAGE
  _modele.js               modèle commenté à copier
js/stages/                 UN FICHIER PAR ARÈNE
```

## Jouer en ligne (1.3)

Menu **EN LIGNE** : un joueur crée la partie et reçoit un code (ou un lien d'invitation) ; l'autre entre le code.
Chacun choisit son perso, clique PRÊT, et le combat se joue en direct entre les deux navigateurs (WebRTC).
Le jeu doit être ouvert depuis la même adresse des deux côtés (par exemple la page GitHub Pages du projet).
Détails et limites : **`CHANGELOG_1.3.md`**.

### Publier sur GitHub Pages
1. Envoyez le contenu de ce dossier dans un dépôt GitHub public (le fichier `index.html` à la racine).
2. Sur GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a branch**, branche `main`, dossier `/ (root)`, **Save**.
3. Après une minute, le jeu est disponible à `https://VOTRE-PSEUDO.github.io/NOM-DU-DEPOT/`.

## Version 1.2

Détail complet, liste des fichiers modifiés / ajoutés, tests et problèmes connus : **`CHANGELOG_1.2.md`**.
Les fichiers touchés en 1.2 portent le marqueur `[1.2]` en 2ᵉ ligne.

- **23 combattants**, dont 7 nouveaux personnages originaux : Baïa, Tenzo, Marionne, Zara, Aldric, Paprika, Orphé ;
  Capricorn entièrement refait.
- Modes **Arcade** (6 combats, score) et **Survie** (record sauvegardé), écran **Comment jouer**, plein écran, volumes.
- Mécaniques : tech de projection, annulations, limite de jongle, mise au sol / relevé, parade automatique, renvoi de projectiles,
  attaques chargées, sbires, soin, entraves.
- Entraînement : données de frames, replacer (R), jauge pleine (T), mannequin « garde + riposte ».
- IA réécrite, ambiances sonores par arène.

## Ajouter un personnage

1. Copiez `js/characters/_modele.js` → `js/characters/monperso.js`.
2. Modifiez `id`, `name`, `palette`, `stats`, `attacks`, `combos`, `super`.
3. Ajoutez `<script src="js/characters/monperso.js"></script>` dans le bloc « Personnages » de `index.html`.

Il apparaît automatiquement dans la sélection, la liste des coups et l'IA sait l'utiliser.

**Apparence** : réutilisez une arme (`weapon: { type: 'katana' | 'anchor' | 'rifle' | 'tonfa' | 'kunai' | 'gauntlet' | 'staff' | 'claws' }`)
et des pièces de costume (`parts: [...]`) définies dans les autres fichiers, ou créez les vôtres dans votre fichier
(`WEAPONS.monArme = { draw(g, ax) {...} }`, `PARTS.maPiece = { head(g, J) {...} }`).
Pour utiliser de vrais sprites, renseignez `sprites: { idle: { src: 'img/idle.png', frames: 4, fps: 8 }, walk, attack, hurt, win }`.

**Propriétés d'attaque utiles** (dans `attacks` ou `overrides`) :
`dash`, `lift`, `recoil`, `hits`/`hitEvery` (multi-coups), `armor`, `grab`, `counter`, `teleport`, `buff`,
`status: { chill | freeze | root }`, `guardPoint`, `reflect`, `chargeable`, `heal`, `knockdown`, `followUp`, `lowProfile`, `projInvuln`, `level: 'low' | 'high'`, `projectile: {...}`, `fx`, `hitFx`, `trail`,
`afterimages`, `screenFx`, `shake`, `sfx`, `hitSfx`. La liste complète est en tête de `fighter.js` et `projectile.js`.

## Ajouter une arène

Copiez un fichier de `js/stages/`, changez `id`/`name`, dessinez le décor fixe dans `build(g, W, H)`,
les animations dans `back(ctx, t)` (derrière les combattants) et `front(ctx, t)` (devant),
choisissez une `music`, puis ajoutez la balise `<script>` dans `index.html`. Le sol est à `y = 194`.

## Commandes

| | Joueur 1 | Joueur 2 |
|---|---|---|
| Déplacements | Z Q S D (AZERTY) / W A S D | Flèches |
| Poing / Pied / Garde | F / G / H | K / L / M (ou pavé 1 / 2 / 3) |

- **Garde + Bas** : garde basse (obligatoire contre les coups bas, inefficace contre les attaques sautées)
- **Poing + Pied** près de l'adversaire : projection (imparable) — le même appui au moment d'être saisi = **tech** (on se libère)
- Un coup normal qui touche peut être **annulé** en coup spécial ou en super
- **Double appui avant/arrière** : dash
- **↓ → ↓ → + Poing** avec la jauge pleine : super attaque
- **Échap / P** : pause (liste des coups) • **F2** : hitboxes • **1 à 6** en entraînement : comportement du mannequin, **R** : replacer, **T** : jauge pleine
- Manettes : croix = déplacements, X/□ poing, A/✕ pied, B/○ ou gâchettes = garde, Y/△ = projection, Start = pause
