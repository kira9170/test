# Pixel Brawl 1.2 — journal des changements

Base : `Pixel_Brawl_1_1/pixel-brawl` (archive `Pixel_Brawl_1_2.zip`).
Chaque fichier modifié porte en 2ᵉ ligne le marqueur `[1.2] MODIFIÉ`, chaque fichier ajouté `[1.2] NOUVEAU`
(recherche rapide : `grep -rl "\[1.2\]" .`).

---

## 1. Inventaire des fichiers

### Fichiers ajoutés (7)
| Fichier | Contenu |
|---|---|
| `js/characters/baia.js` | Baïa, capoeiriste (personnage original) |
| `js/characters/tenzo.js` | Tenzo, moine à la cloche (personnage original) |
| `js/characters/marionne.js` | Marionne, marionnettiste + pantin Pipo (personnage original) |
| `js/characters/zara.js` | Zara, rétiaire trident + filet (personnage original) |
| `js/characters/aldric.js` | Aldric, chevalier au bouclier (personnage original) |
| `js/characters/paprika.js` | Paprika, cheffe de rue à la poêle (personnage original) |
| `js/characters/orphe.js` | Orphé, barde au luth (personnage original) |

Plus ce fichier `CHANGELOG_1.2.md`.

### Fichiers modifiés (25)
| Fichier | Nature |
|---|---|
| `index.html` | écrans Comment jouer / Arcade / Survie, options volume, plein écran, scripts des 7 nouveaux persos |
| `css/style.css` | styles des nouveaux écrans (tutoriel, résultats, réglages) |
| `README.md` | documentation 1.2 |
| `js/core/config.js` | nouvelles constantes de gameplay, réglages IA, options sauvegardées |
| `js/core/registry.js` | normalisation des attaques aériennes et des enchaînements `followUp` |
| `js/core/fighter.js` | états, annulations, jongles, projections, nouveaux types d'attaque (voir §2) |
| `js/core/pose.js` | poses de chute, au sol, relevé, défaite, coup bas, rotation |
| `js/core/render.js` | clignotement d'invulnérabilité, auras, filet, effets onde / balayage / flash |
| `js/core/projectile.js` | sbires, rebonds, ondulation, tête chercheuse, croissance par charge |
| `js/core/game.js` | ralenti + zoom de KO, renvoi, tech, données de frames, HUD entraînement |
| `js/core/audio.js` | volumes, bus musique/bruitages, nouveaux bruitages, ambiances d'arène |
| `js/core/ai.js` | IA réécrite par catégories de coups + mannequin « garde + riposte » |
| `js/core/ui.js` | modes Arcade et Survie, résultats dynamiques, tutoriel, volumes, plein écran |
| `js/core/main.js` | touches d'entraînement, focus au démarrage |
| `js/characters/capricorn.js` | refonte complète (voir §3) |
| `js/characters/astra.js`, `krank.js`, `torvald.js`, `varga.js`, `yselle.js` | équilibrage chiffré uniquement |
| `js/stages/*.js` (5) | ambiance sonore par arène |

### Fichiers volontairement NON modifiés
- **`goku.js`, `denji.js`, `shinra.js`, `itachi.js`, `kaneki.js`, `guts.js`, `kurumi.js`** — laissés intacts à la demande
  (« ne pas y toucher »). Vérifié par empreinte SHA-256 : identiques octet pour octet à l'archive reçue.
- `seiran.js`, `nokta.js`, `volta.js`, `_modele.js`, `js/core/input.js`, `js/core/utils.js`, `CHANGELOG_1.1.md`.

---

## 2. Moteur et mécaniques globales

**Sensation de jeu**
- Nouveaux états : atterrissage (`land`, 4 f / 7 f après une attaque aérienne), au sol (`down`, 28 f), relevé (`wakeup`, 14 f, invulnérable), défaite (`lose`), touché bas (`hurtLow`).
- Projections : fenêtre de **tech** de 8 f (appuyer Poing + Pied quand on est saisi → « TECH ! »), projections non utilisables en l'air ni sur un adversaire en hitstun.
- **Annulations** : un coup normal qui touche peut être annulé (6 f) en spécial ou super ; enchaînement Poing → Pied conservé.
- **Jongles** : limite de 5 coups en l'air, hitstun décroissant (×1,2 par coup) — fin des boucles infinies.
- KO final : ralenti + zoom sur l'impact ; message « PREMIER COUP » au premier contact du round.
- Paliers de sons d'impact selon les dégâts ; plafond de 350 particules (performance).
- **Correctif** : un appui sur Haut plus court qu'une frame (tap rapide) était ignoré → le saut part désormais aussi sur l'appui.

**Nouvelles propriétés d'attaque** (utilisables dans n'importe quel fichier personnage)
`guardPoint` (parade automatique sur une fenêtre), `reflect` (renvoie les projectiles, « RENVOI ! »), `chargeable { max, bonus }`
(maintenir la touche), `heal`, `buff { haste }`, `status { root }` (immobilisé), `knockdown`, `followUp` (super en plusieurs temps,
`requireHit`, `whiffRecovery` = récupération punissable si la 1ʳᵉ partie rate), `lowProfile`, `projInvuln`, `throwBehind`.
Projectiles : `minion` (sbire autonome avec PV), `bounce`/`bounceDamp`, `wave`, `homing`, `growWithCharge`, `pattern: 'stream'`.

**IA**
- Réécrite : classement des coups par rôle (anti-aérien, projectile, approche, punition, soin, invocation), annulations, attaques chargées, patience au relevé, renvoi de projectiles.
- Paramètres par difficulté : `techChance` 5/30/55 %, `antiAir` 10/35/70 %, `cancelChance` 10/40/75 %.

**Modes**
- **Arcade** : 6 combats à difficulté croissante, score, « CONTINUER » (score divisé par deux), meilleur score sauvegardé.
- **Survie** : combats en 1 manche, +30 % de la vie max récupérés après chaque victoire, record sauvegardé.
- **Entraînement** : mannequin 1-6 (dont « garde + riposte »), **R** = replacer, **T** = jauge de super pleine, panneau de données de frames
  (démarrage / actif / récupération / avantage à la garde) du dernier coup.

**Interface et confort**
- Écran **Comment jouer** (menu principal) avec accès direct à l'entraînement.
- Options : volume musique et bruitages (par pas de 25 %), bouton **plein écran**.
- Pause : **Recommencer** le combat ; écran de résultats adapté au mode.

**Audio** : ambiances générées (vent, mer + mouettes, pluie, ville), une par arène, réglées sur le volume musique.

---

## 3. Personnages

### Capricorn (refonte — personnage de l'utilisateur)
Cyborg original : les termes repris d'une licence (« Lames Mantis », « Sandevistan », « Mantis Overdrive ») ont été remplacés.
PV 92. Effet d'écran « glitch » retravaillé.
- ←→P **SURCADENCE** · ↓→P **TRANCHE NÉON** · ↓←K **DRONE TRAQUEUR** (drone à tête chercheuse)
- Super ↓→↓→P **EXÉCUTION OVERCLOCK** : surcadence invulnérable → téléportation dans le dos → retour devant (seulement si le 2ᵉ coup touche) ; punissable s'il rate.

### Sept nouveaux personnages originaux
| Perso | Style | Coups spéciaux | Super (↓→↓→P) |
|---|---|---|---|
| **Baïa** — la capoeiriste (PV 100) | mobile, ginga permanente, coups circulaires | ↓←K **AÚ** (roue, traverse les projectiles) · ↓→K **QUEIXADA** · ↓↓K **RASTEIRA** (balayage bas qui met au sol) | **RODA SOLAIRE** (6 coups tournoyants) |
| **Tenzo** — moine de la cloche (PV 126) | lourd, coups chargeables | ↓→P **PAUME CÉLESTE** (maintenir P pour charger, onde qui grossit) · ↓↓P **GLAS** · ←→K **CLOCHE TOMBANTE** | **CENT HUIT COUPS** (8 coups) |
| **Marionne** — la marionnettiste (PV 104) | invocation, contrôle à distance | ↓→P **PIPO, EN SCÈNE !** (pantin autonome qui marche et frappe, 2 PV) · ↓←P **FILS D'ACIER** (fil qui ramène) · ←→K **CABRIOLE** | **GRAND GUIGNOL** (pluie de pantins) |
| **Zara** — la rétiaire (PV 106) | allonge du trident, entraves | ↓→P **FILET** (immobilise ~1 s) · ←→P **TRIPLE POINTE** · ↓↓K **SAUT À LA PERCHE** | **VERDICT DE L'ARÈNE** (filet puis assaut de 5 coups si le filet prend) |
| **Aldric** — le bouclier d'argent (PV 120) | défensif, parades | ←→K **CHARGE AU BOUCLIER** (pare pendant la charge) · ↓→P **JUGEMENT** · ↓↓P **REMPART** (renvoie les projectiles) | **SERMENT D'ARGENT** (super-armure) |
| **Paprika** — la cheffe de rue (PV 128) | zone + soin | ↓→P **PIMENT REBONDISSANT** · ←→P **FLAMBÉ** · ↓↓K **PAUSE GOÛTER** (soigne 12 PV, très punissable) | **COUP DE FEU EN CUISINE** |
| **Orphé** — le barde (PV 100) | projectiles ondulants, buff | ↓→P **BALLADE** (3 notes en vague) · ↓↓K **TEMPO ALLEGRO** (accélération 5 s) · ←→P **ACCORD DISSONANT** | **SYMPHONIE FINALE** (rayon sonore) |

Chaque personnage a sa silhouette (squelette articulé + pièces de costume dessinées en code), sa palette alternative (2ᵉ joueur / miroir),
ses poses, ses effets et sa réplique de victoire.

### Équilibrage des personnages originaux existants (valeurs uniquement)
astra PV 95→106, Poing 5→6 · krank PV 125→112, défense 1,1→1,02 · torvald PV 125→118, défense 1,15→1,12 · varga PV 110→104, Griffes en X ×1,4→×1,25 · yselle PV 100→110, défense 0,95→1,0.

---

## 4. Tests effectués

| Test | Méthode | Résultat |
|---|---|---|
| Syntaxe de tous les fichiers JS | `node --check` | OK, 0 erreur |
| Fichiers anime intacts | SHA-256 avant / après | 7/7 identiques |
| Stabilité moteur, roster complet | simulation Node (DOM simulé), IA vs IA, toutes les paires, difficulté moyenne | 529 matchs, **0 erreur**, tous terminés |
| Nouveaux persos en facile + difficile | idem, 8 persos × roster × 2 difficultés | 608 matchs, **0 erreur** |
| Chaque spécial/super se déclenche et touche | compteurs d'utilisation et de résultats (hit / garde / parade / renvoi) | tous utilisés et efficaces au moins une fois |
| Mécaniques visuelles | captures en jeu (Chromium + Playwright) : 8 supers, pantin, filet, paume chargée, renvoi | rendu correct |
| Parcours menus | Playwright : menu → tutoriel → retour, arcade (sélection, VS, combat, victoire, combat suivant), défaite → continuer, survie (2 victoires puis fin + record), pause → recommencer, entraînement (mannequin 6, données de frames, R), options | tous OK, **0 erreur console** |
| Commandes clavier réelles (J1) | Playwright, touches physiques : marche, saut, dash, garde basse, Poing→Pied, projection, super | OK après correctif du saut « tap » |

### Taux de victoire IA vs IA (difficulté moyenne, 46 matchs par perso, dernière simulation)
denji 96 · kaneki 85 · shinra 83 · goku 83 · guts 80 · torvald 63 · zara 52 · itachi 50 · volta 48 · krank 48 · orphe 48 · varga 43 ·
paprika 41 · capricorn 39 · tenzo 39 · marionne 39 · aldric 39 · kurumi 37 · seiran 33 · nokta 30 · baia 30 · astra 22 · yselle 22.

À lire avec prudence : l'échantillon est petit (± 7 points d'une simulation à l'autre) et l'IA ne joue pas comme un humain.

---

## 5. Problèmes connus / limites

1. **Équilibrage des 7 fichiers anime** : non modifiés à la demande, ils dominent nettement (80-96 % de victoires).
   Causes principales et valeurs suggérées si vous souhaitez les retoucher vous-même :
   - `denji.js` : Poing 8 dégâts / démarrage 4 / hitbox 26 px (le plus fort du jeu) → 6 / 5 / 20 ; PV 115 et défense 1,1 → 105 et 1,0.
   - `shinra.js` : Pied 9 dégâts / démarrage 4 → 7 / 6 ; spéciaux ×2,3 et ×2,5 avec dash 6,5–8 → ×1,8 et récupération ≥ 20.
   - `kaneki.js`, `goku.js` : spéciaux ×2,2–2,5 → ×1,8–2,0 et récupération ≥ 18.
   - `guts.js` : PV 130 + défense 1,25 → défense 1,1.
   Les personnages originaux sont réglés autour de ×1,6–2,0 sur les spéciaux.
2. **Pas de sprites dessinés à la main** : tous les personnages sont dessinés en code (pixel art procédural). Le moteur accepte des
   planches de sprites (`sprites: {...}`) mais aucune n'est fournie.
3. **Police** « Press Start 2P » chargée depuis Google Fonts : hors ligne, une police de secours s'affiche.
4. **Non testé faute de matériel** : manettes physiques (code inchangé depuis 1.1), écoute réelle du son (le code audio s'exécute sans
   erreur mais la qualité sonore n'a pas été évaluée à l'oreille), navigateurs autres que Chromium.
5. L'équilibrage mesuré est IA contre IA ; il reste à confirmer en matchs humains.
