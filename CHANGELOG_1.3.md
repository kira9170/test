# Pixel Brawl 1.3 — mode en ligne

## Nouveauté : jouer à distance contre un ami
Menu principal → **EN LIGNE**.

1. Le joueur 1 clique sur **CRÉER UNE PARTIE**. Un code de 5 caractères s'affiche, ainsi qu'un bouton **COPIER LE LIEN D'INVITATION**.
2. Le joueur 2 entre ce code puis clique sur **REJOINDRE**, ou ouvre simplement le lien d'invitation.
3. Dans le salon, chacun choisit son personnage puis clique sur **PRÊT !**. C'est le joueur 1 qui choisit l'arène, la durée des rounds et le nombre de manches (ses options).
4. En fin de match : **REVANCHE** (il faut que les deux joueurs cliquent), **CHANGER DE PERSO** ou **QUITTER**.

En ligne, chacun joue avec **ZQSD/WASD + F G H** ou **les flèches + K L M**, au choix, ou avec une manette.
**Échap** ouvre un petit menu, mais le combat **ne se met pas en pause**.

## Fonctionnement technique
- **Connexion directe pair-à-pair (WebRTC)**, sans serveur de jeu à héberger.
- **Mise en relation** : le serveur public et gratuit de PeerJS (`0.peerjs.com`) sert uniquement à ce que les deux navigateurs se trouvent. Ensuite, tout passe en direct.
  - Un autre serveur compatible peut être utilisé avec `?peer=wss://adresse:port/` dans l'URL.
  - Si la connexion directe est impossible, les serveurs relais TURN publics de PeerJS sont essayés.
- **Synchronisation « lockstep » avec délai** :
  - Les deux navigateurs font tourner la même simulation, avec les mêmes touches et un hasard commun (graine tirée par l'hôte).
  - Les touches sont appliquées après un délai de 3 à 12 frames, calculé à partir du ping mesuré dans le salon (environ 4 frames pour un ping de 50 ms).
- **Contrôle de cohérence** : chaque seconde, les deux navigateurs comparent un résumé de l'état du jeu. En cas d'écart, un avertissement s'affiche.
- **Sécurités** :
  - Versions du jeu différentes : refus avec un message.
  - Code introuvable, partie déjà complète, adversaire parti ou connexion perdue (plus de 12 s sans données) : message clair et retour au menu en ligne.

## Correctif 1.3.1
- Erreur « Connexion au serveur perdue » au moment de rejoindre : la mise en relation passe maintenant par la **bibliothèque officielle PeerJS**
  (chargée depuis unpkg.com), qui parle exactement le protocole du serveur public. Le client intégré ne sert plus que de secours
  (hors ligne ou avec `?peer=`).
- Messages d'erreur plus précis (code introuvable, réseau, navigateur incompatible), nouvelle version réseau (les anciennes pages en cache sont refusées proprement).

## Fichiers
| Fichier | Nature |
|---|---|
| `js/core/net.js` | **NOUVEAU** : connexion, salon, synchronisation |
| `js/core/game.js` | contrôleurs fournis par le mode en ligne, durée de round de l'hôte, HUD « VOUS », fin de match en ligne |
| `js/core/main.js` | boucle 60 Hz pilotée par `Net.tick`, pas de pause en ligne, affichage du ping |
| `js/core/ui.js` | écran En ligne, champ de saisie dans la navigation clavier, aperçus du salon |
| `index.html` | bouton EN LIGNE, écrans « En ligne », « Salon » et menu en combat, script `net.js` |
| `css/style.css` | styles du mode en ligne (en fin de fichier) |
| `.nojekyll` | **NOUVEAU** : publication telle quelle sur GitHub Pages |

Les fichiers de personnages ne sont pas modifiés.

## Tests effectués
- **Deux navigateurs Chromium** reliés en WebRTC, avec un serveur de mise en relation local qui reproduit le protocole PeerJS.
  - Match complet avec des touches aléatoires des deux côtés : 4 472 frames comparées image par image, **aucune divergence**.
  - Revanche, menu en combat, départ d'un joueur et code inexistant : comportements corrects, aucune erreur console.
- **Même test avec 70 à 110 ms de latence simulée et de l'irrégularité** : aucune divergence. Le match a duré environ 7 % plus longtemps, à cause de courtes attentes.
- **Modes locaux** (arcade, survie, entraînement, simulation IA) : toujours fonctionnels.

## Limites connues
- Le serveur public `0.peerjs.com` n'a **pas pu être testé d'ici** : l'environnement de développement n'a pas accès à internet. Le protocole a été reproduit à l'identique en local.
  - Si ce serveur est indisponible, le jeu affiche « serveur injoignable ».
- Certains réseaux très fermés (entreprise, école) bloquent WebRTC.
- Pas de *rollback* : avec un gros ping, les commandes répondent avec un léger retard (délai d'entrée).
- Si un joueur change d'onglet, sa partie se fige et l'autre attend. Au-delà de 12 s, la connexion est coupée.
- Navigateurs différents (Chrome contre Firefox) : la simulation repose sur des calculs flottants identiques. C'est le cas en pratique, mais ce n'est pas garanti à 100 %. Utiliser le même navigateur est le plus sûr.
