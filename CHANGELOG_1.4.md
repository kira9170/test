# Pixel Brawl 1.4 — jouable sur téléphone

## Commandes tactiles (téléphone, tablette)
Elles apparaissent automatiquement pendant les combats sur un écran tactile. Sur ordinateur, rien ne change.

- **Croix directionnelle** (à gauche) : 8 directions, on peut glisser le doigt sans le lever. Les quarts de cercle (↓ →) se font en glissant.
- **Boutons** (à droite) :
  - **POING**, **PIED** et **GARDE** : on peut les maintenir, par exemple pour garder ou pour charger un coup.
  - **P+K** : projection en un seul appui.
  - **SUPER** : fait ↓ → ↓ → + Poing automatiquement, dans le bon sens. Il devient doré quand la jauge est pleine.
- **II** (en bas au milieu) : pause. En ligne, ce bouton ouvre le petit menu et le combat continue.
- Toucher l'écran pendant le « VS » le fait passer.

Ces commandes appuient sur les touches du joueur 1 : modes IA, Arcade, Survie, Entraînement et **En ligne** fonctionnent tous au doigt.
Le 1 VS 1 local sur un seul téléphone n'est pas prévu, car l'écran est trop petit pour deux joueurs.

## Confort sur mobile
- Écran « Tournez votre téléphone » en mode portrait.
- Au premier toucher : plein écran et blocage en paysage, quand le navigateur l'autorise (Android). Sur iPhone, Safari ne permet pas le plein écran d'une page.
- **Ajout à l'écran d'accueil** : le jeu s'ouvre alors comme une application, en plein écran et en paysage (fichier `manifest.webmanifest` + icônes).
- Boutons de menu agrandis, aide adaptée sur le menu principal. Pas de zoom ni de sélection de texte quand on tapote.

## Correctif du mode en ligne (trouvé pendant ces tests)
- Si un message arrivait avant l'entrée dans le salon (selon l'ordre réseau), l'hôte pouvait planter (« Cannot set properties of null »).
  Les messages précoces sont maintenant mis de côté puis rejoués, et la poignée de main « hello » est renvoyée si besoin.

## Fichiers
| Fichier | Nature |
|---|---|
| `js/core/touch.js` | **NOUVEAU** : croix, boutons, plein écran |
| `manifest.webmanifest`, `icon-192.png`, `icon-512.png` | **NOUVEAUX** : installation sur l'écran d'accueil |
| `index.html` | balises mobiles, écran « tournez », aide tactile, script `touch.js` |
| `css/style.css` | styles tactiles et mobiles (en fin de fichier) |
| `js/core/main.js` | branchement de `TouchPad` |
| `js/core/net.js` | correctif de l'ordre des messages à la connexion |

`?touch=1` dans l'URL force l'affichage des commandes sur ordinateur (pour essayer), `?touch=0` les masque.

## Tests (émulation d'un téléphone Android en paysage, écran tactile)
- Croix → marcher, ↓ s'accroupir, ↑ sauter, relâcher → arrêt : OK.
- POING, PIED, P+K (projection), SUPER (jauge pleine → super lancée), GARDE maintenue, pause : OK.
- Navigation des menus au doigt (1 VS IA → difficulté → persos → arène → combat), écran En ligne : OK.
- Mode portrait → écran « Tournez votre téléphone » : OK.
- Sur ordinateur, les commandes tactiles restent cachées. Les tests clavier et le test en ligne à deux navigateurs passent toujours.
- **Pas testé sur un vrai téléphone** (émulation uniquement) : le ressenti des boutons et la place prise par les pouces sont à confirmer.
