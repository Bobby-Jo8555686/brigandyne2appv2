C'est une excellente idée. On a passé pas mal de temps le nez dans le moteur, il est temps de faire briller la carrosserie. Avec les 9 fichiers que tu m'as fournis (fiches, combats, magie, objets, datamodels, etc.), j'ai largement de quoi te faire un mode d'emploi précis et sans aucune approximation, car toute ta logique métier est là.

Voici le manuel d'utilisation de ton système **Brigandyne 2 AppV2**, basé strictement sur ton code actuel.

---

### I. Les Personnages Joueurs (PJ)

La gestion des PJ est fortement automatisée pour faciliter la création et la survie.

* **Création Automatisée :** Lorsqu'un joueur glisse-dépose une "Origine" sur sa fiche, le système configure automatiquement ses points de Destin initiaux et crée instantanément les Atouts correspondants dans son inventaire (basés sur les champs "talents_auto" et "special").
* **Vices et Vertus :** Les joueurs gèrent leurs traits de personnalité via un système de curseur (de -3 à +3). Cliquer sur les modificateurs ajuste automatiquement la valeur du Vice ou de la Vertu opposée (ex: Avare vs Généreux).
* **Système de Repos :** Un bouton "Repos" permet de recharger les jauges d'activités. Le joueur choisit s'il s'agit d'une fin de combat, d'une fin de scène ou d'un repos long (journée). Le système ne recharge que les capacités correspondantes à la fréquence choisie.
* **Dépassement de soi :** Un PJ peut dépenser 2 points de Sang-Froid (s'il en a assez) pour ignorer totalement l'effet de ses handicaps en cliquant sur le bouton dédié.

### II. Les Personnages Non-Joueurs (PNJ)

Les fiches de PNJ sont pensées pour ne pas surcharger le MJ et s'adaptent selon leur rôle.

* **Quatre profils :** Un PNJ peut être défini comme Sbire, Intermédiaire, Boss ou Créature.
* **Interface dynamique :** L'onglet "Magie" disparaît automatiquement pour les Sbires. L'onglet "Biographie" est caché pour les Sbires, Intermédiaires et Créatures, afin d'aller à l'essentiel en combat.
* **La Règle du Sbire (One-Hit) :** Si l'option "Sbires vaincus en un coup" est cochée dans les paramètres du monde, le moindre point de dégât subi par un PNJ de type "Sbire" fait tomber ses PV à 0 instantanément.

### III. L'Équipement et les Objets (Items)

Les objets possèdent tous un "moteur d'activités" caché qui permet de déclencher des effets.

* **Le Filtrage Strict des Atouts :** Pour qu'un Talent ou une Spécialité apparaisse dans une fenêtre de jet (Combat, Tir ou Magie), le champ **"Stat. liée"** de l'atout doit *obligatoirement* être rempli avec `com`, `tir` ou `mag`. C'est ce qui garantit des fenêtres propres.
* **L'Armure et l'Encombrement :** Les armures équipées calculent automatiquement la protection globale, mais appliquent aussi directement leurs malus à l'Initiative, au Mouvement et à la Perception. Avoir un atout comme "Port d'armure" annule ces malus automatiquement.

### IV. Le Système de Combat

Le flux de combat est conçu pour réduire les allers-retours entre le MJ et le joueur.

* **Gestion de l'Allonge :** Quand un attaquant cible un adversaire, le système compare automatiquement l'allonge de leurs armes équipées. Si l'attaquant a une arme plus longue (ex: Lance contre Dague), la case "Avantage d'Allonge (+5%)" est précochée. Si la cible porte un bouclier, son allonge est considérée comme maximale pour contrer celle de l'attaquant.
* **Postures et Tactiques :** Avant de lancer les dés, le joueur choisit sa posture (Standard, Force, Finesse, Défensive, Attaques multiples ou Viser une faille d'armure). Le système applique de lui-même les modificateurs (Avantages/Désavantages, division des dégâts pour la finesse, etc.).
* **Coups Tordus (Chifoumi) :** Un joueur peut tenter une ruse. Une fenêtre de Pierre-Papier-Ciseaux s'ouvre. S'il gagne, il obtient 1 Avantage. S'il perd, le MJ l'a vu venir et il prend 1 Désavantage.
* **La Résolution en 1 Clic :** Si l'attaque réussit, un bouton "Appliquer les effets" apparaît dans le chat. Il permet au vainqueur (attaquant ou défenseur en cas de contre-attaque) de choisir ses effets tactiques (Blesser, Bousculer, Désengager). Une réussite Majeure (R+) débloque un second menu d'effets dévastateurs (Choc, Désarmement, Saignement, etc.). Le calcul des dégâts (Dés + Base + Bonus - Protection) est alors détaillé noir sur blanc.

### V. La Magie et le Grimoire

Le système de magie est régi par des règles de limites mémorielles et de sacrifices.

* **La Limite d'Apprentissage :** Un personnage ne peut pas mémoriser plus de "Tours" ou de "Sortilèges/Rituels" que son indice (la dizaine) de Connaissances (CNS). Glisser un sort en trop bloquera l'action.
* **L'Étude et l'Expérience :** Apprendre un sort coûte de l'XP (50 pour un Tour, 100 pour un Sortilège). Si le sort n'appartient pas à un Domaine Magique maîtrisé par le PJ, cela coûte 50 XP supplémentaires. Un jet de CNS est lancé automatiquement pour déterminer combien de jours ou semaines d'étude sont nécessaires.
* **L'Incantation et l'Épuisement :** Si un mage dépasse son nombre d'utilisations quotidiennes (défini par son indice de Magie + ses bonus de "Slots"), incanter lui arrachera des PV (2 pour un Tour, 4 pour un Sort, 6 pour un Rituel).
* **La Magie du Sang :** Un PJ peut sacrifier volontairement des PV dans la fenêtre de jet pour augmenter ses chances de succès (+1% par PV sacrifié, ou +2% s'il coche la case "Sang d'être magique").

---

Si tu veux que j'approfondisse une mécanique précise (comme le moteur d'activités universelles qui se cache dans `actor-activite.js`), ou si tu as des questions pour la rédaction de tes aides de jeu pour tes joueurs, n'hésite pas !
