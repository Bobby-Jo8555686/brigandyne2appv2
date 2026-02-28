# **Bienvenue, Maîtres de Jeu et rôlistes de l'ombre !**
Si vous lisez ces lignes, c'est que vous avez décidé de plonger vos joueurs dans la Renaissance sombre et sanglante de Thalios avec le système Brigandyne (2e Édition) pour Foundry VTT.
J'ai conçu ce système (brigandyne2appv2) pour qu'il soit à la fois respectueux de la brutalité du jeu de rôle original et à la pointe de la technologie Foundry (il utilise la toute nouvelle architecture AppV2 pour une fluidité et une robustesse maximales). Puisque vous connaissez déjà Foundry, je ne vais pas vous expliquer comment créer un dossier, mais plutôt vous guider à travers les outils spécifiques que j'ai forgés pour vous faciliter la vie.
Voici votre guide de survie.
________________________________________
## **1. Configuration et Options (Settings)**
Avant de lancer votre première bagarre dans une taverne, allez faire un tour dans les paramètres du système (Configuration des options > System Settings). J'y ai intégré deux options particulièrement utiles :
- Sbires vaincus en un coup (Monde) : Une règle optionnelle "cinématique". Si vous l'activez, le moindre point de dégât infligé à un PNJ de type "Sbire" fera tomber sa Vitalité à 0. Parfait pour les scènes épiques où les héros fendent la foule !
- Actions rapides sur les Tokens / HUD (Client) : Activée par défaut, cette option ajoute un menu rapide directement sur le Token (voir section 4). Chaque joueur peut l'activer ou la désactiver selon ses préférences d'interface.
________________________________________
## **2. Les Fiches de Personnages (Actors)**
Le système gère deux grands types d'Acteurs : les Personnages (PJ) et les PNJ.
### **Le Verrouillage de la Fiche (Le Cadenas)**
Vous remarquerez un petit cadenas en haut des fiches. L'AppV2 est très réactive, et un coup de molette accidentel est vite arrivé.
- Cadenas ouvert (Vert) : Mode édition. Vous pouvez modifier les caractéristiques de base, glisser-déposer des objets/sorts, ou les supprimer.
- Cadenas fermé (Rouge) : Mode jeu. La fiche est verrouillée ! Impossible de supprimer une arme par erreur ou de modifier la Force. Cependant, les joueurs peuvent toujours modifier leurs jauges dynamiques (Vitalité, Sang-Froid, Destin) et utiliser leurs objets. C'est le mode recommandé en pleine partie.
### **La Gestion Intelligente des PNJ**
Pour vous faire gagner du temps, les statistiques des PNJ (Vitalité et Sang-Froid) se calculent automatiquement selon les règles officielles en fonction du "Type de PNJ" que vous sélectionnez dans le menu déroulant :
- Boss / Intermédiaire / Créature : Bénéficient de la formule complète et sont aussi robustes que les PJ.
- Sbire : Considérés comme des "PNJ mineurs", leur formule de Vitalité est bridée (pas de bonus de Volonté, Endurance divisée par 10) et leur Sang-Froid réduit de moitié pour refléter leur lâcheté.
________________________________________
##**3. L'Inventaire et le Drag & Drop**
Le système utilise un glisser-déposer (Drag & Drop) universel conçu spécifiquement pour ne pas créer de "clones" d'objets (un problème courant sur les nouvelles versions de Foundry).
>	Carrières, Armes, Domaines et Sorts : Glissez-les directement depuis vos compendiums vers la fiche du personnage (cadenas ouvert !).
>	Domaines Magiques : Vous pouvez ouvrir la fiche d'un "Domaine" pour y voir tous les sorts associés grâce à des liens dynamiques, et glisser ces sorts directement depuis le Domaine vers l'onglet Magie du PJ.
________________________________________
##**4. Le Cœur du Système : Combats et Jets de Dés**
Brigandyne est un jeu mortel où tout se résout avec un D100. J'ai entièrement automatisé la mécanique pour vous éviter les calculs d'apothicaire à 2h du matin.
Comment attaquer ?
>	Ciblez un ennemi (avec la touche 'T' ou le double clic droit habituel de Foundry).
>	Ouvrez votre fiche et cliquez sur l'icône de dé à côté de votre arme.
>	Une fenêtre de dialogue s'ouvre : vous pouvez y choisir votre posture martiale (Tactique : Efficace, En force, En finesse...), indiquer des avantages/désavantages, utiliser du Sang-Froid ou choisir de "Viser".
>	Cliquez sur "Frapper".
**La magie de l'automatisation fait le reste** : Le système jette le dé, calcule le Résultat des Unités (RU), ajoute les dégâts de l'arme et la Force, soustrait automatiquement la protection de l'armure de la cible ciblée, et lui retire ses Points de Vitalité ! S'il y a un coup critique (RU = 0), le système gère même l'explosion du dé.
###**Le "Token HUD" (L'arme secrète du MJ)**
Vous avez 8 gobelins et 2 ogres sur la carte et vous ne voulez pas ouvrir 10 fiches de personnages ? J'ai pensé à vous.
Faites un **Clic Droit** sur n'importe quel Token. Une colonne translucide apparaît sur la droite du menu circulaire natif de Foundry. Elle liste instantanément **toutes les armes et tous les sorts** de ce personnage. Un clic sur une arme dans ce menu déclenche l'attaque avec la même automatisation que depuis la fiche.
________________________________________
##**5. La Magie (Le Grimoire)**
La magie de Brigandyne est puissante mais dangereuse. Sur l'onglet "Magie" de la fiche, vous retrouverez les sorts divisés en Tours, Sortilèges et Rituels.
>	Lancer un Sort : Comme pour les armes, cliquez sur le dé du sort. Une boîte de dialogue s'ouvre pour vous demander la difficulté (préremplie si bien configurée dans le sort) et si vous récitez la formule ou dépensez des PV/SF pour vous aider.
>	Utilisations quotidiennes : Chaque sort possède une case à cocher pour tracker son utilisation. Rappelez aux joueurs que dépasser la limite leur coûtera des Points de Vitalité !
________________________________________
##**Le mot de la fin**
Ce système a été pensé pour s'effacer au profit de l'histoire. Laissez l'automatisation gérer les soustractions d'armure et les calculs de RU, gardez vos fiches verrouillées en jeu, abusez du Token HUD pour vos monstres, et profitez de l'ambiance impitoyable de Thalios.
Si vous trouvez un bug ou si votre hallebarde refuse de trancher un gobelin, n'hésitez pas à faire des retours. Bon jeu, et que le Destin veille sur vos PJ... ils en auront besoin !

