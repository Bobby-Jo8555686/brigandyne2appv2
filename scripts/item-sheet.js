const SPECIALITES_DATA = {
    // SPÉCIALITÉS GLOBALES (+10 / +20)
    "acrobaties": { nom: "Acrobaties", stat: "mou", bonus: 10, effet: "Sauter, pirouettes, équilibre, chute" },
    "agriculture": { nom: "Agriculture", stat: "cns", bonus: 20, effet: "Cultiver, saisons, folklore paysan" },
    "animaux": { nom: "Animaux", stat: "cns", bonus: 10, effet: "Faune, habitudes, points faibles" },
    "architecture": { nom: "Architecture", stat: "cns", bonus: 20, effet: "Planifier, retenir de mémoire" },
    "arts": { nom: "Arts", stat: "cns", bonus: 20, effet: "Peinture, artistes, histoire de l'art" },
    "astrologie": { nom: "Astrologie", stat: "cns", bonus: 20, effet: "Astres, constellations, lunes" },
    "attelages": { nom: "Attelages", stat: "hab", bonus: 10, effet: "Conduire chariot, réparer roue" },
    "botanique": { nom: "Botanique", stat: "cns", bonus: 10, effet: "Plantes, utilité, dangers" },
    "canotage": { nom: "Canotage", stat: "hab", bonus: 20, effet: "Petite embarcation, barque, radeau" },
    "cartographie": { nom: "Cartographie", stat: "cns", bonus: 20, effet: "Tracer/lire une carte" },
    "charme": { nom: "Charme", stat: "soc", bonus: 10, effet: "Séduire, plaire, flatter" },
    "cheveux_barbe": { nom: "Cheveux et barbe", stat: "hab", bonus: 20, effet: "Couper cheveux, tailler barbe" },
    "chiromancie": { nom: "Chiromancie", stat: "cns", bonus: 20, effet: "Lire l'avenir (mains)" },
    "comedie": { nom: "Comédie", stat: "soc", bonus: 20, effet: "Apprendre texte, pièces de théâtre" },
    "commandement": { nom: "Commandement", stat: "soc", bonus: 10, effet: "Diriger troupe, obéissance" },
    "commerce": { nom: "Commerce", stat: "soc", bonus: 10, effet: "Négocier prix, usages commerciaux" },
    "contorsion": { nom: "Contorsion", stat: "mou", bonus: 10, effet: "Se défaire de liens, conduit étroit" },
    "courage": { nom: "Courage", stat: "vol", bonus: 10, effet: "Résister peur, mort-vivant, démon" },
    "course": { nom: "Course", stat: "end", bonus: 10, effet: "Courir vite et longtemps" },
    "crochetage": { nom: "Crochetage", stat: "hab", bonus: 10, effet: "Serrurerie, crochets, pièges" },
    "cuisine": { nom: "Cuisine", stat: "hab", bonus: 20, effet: "Préparer, recettes" },
    "danse": { nom: "Danse", stat: "mou", bonus: 20, effet: "Danses paysannes, aristocratiques" },
    "deguisement": { nom: "Déguisement", stat: "soc", bonus: 10, effet: "Maquillage, travestissement" },
    "deplacement_silencieux": { nom: "Déplacement silencieux", stat: "dis", bonus: 10, effet: "Se mouvoir discrètement" },
    "diplomatie": { nom: "Diplomatie", stat: "soc", bonus: 10, effet: "Calmer conflit, négocier traité" },
    "discours": { nom: "Discours", stat: "soc", bonus: 10, effet: "Eloquence, foule, révolte" },
    "dissimulation": { nom: "Dissimulation d’objets", stat: "dis", bonus: 10, effet: "Cacher un objet" },
    "dressage": { nom: "Dressage", stat: "soc", bonus: 10, effet: "Calmer, apprendre tours (bête)" },
    "droit": { nom: "Droit et usages", stat: "cns", bonus: 10, effet: "Lois, système judiciaire" },
    "ecoute": { nom: "Écoute", stat: "per", bonus: 10, effet: "Entendre paroles, reconnaître voix" },
    "elevage": { nom: "Élevage", stat: "cns", bonus: 20, effet: "Troupeaux : bovins, ovins..." },
    "equitation": { nom: "Equitation", stat: "mou", bonus: 10, effet: "Monter à cheval, monture" },
    "escalade": { nom: "Escalade", stat: "mou", bonus: 10, effet: "Grimper vite/longtemps" },
    "estimation": { nom: "Estimation", stat: "cns", bonus: 20, effet: "Valeur objet/arme/magie" },
    "etiquette": { nom: "Etiquette", stat: "soc", bonus: 20, effet: "Usages bourgeois/aristocratiques" },
    "faire_pitie": { nom: "Faire pitié", stat: "soc", bonus: 20, effet: "Mendier, miséricorde" },
    "fouille": { nom: "Fouille", stat: "per", bonus: 10, effet: "Trouver indice, objet caché" },
    "gestion": { nom: "Gestion", stat: "cns", bonus: 20, effet: "Administrer commerce, repérer erreurs" },
    "jeux": { nom: "Jeux", stat: "hab", bonus: 10, effet: "Jeux de dés, cartes, paris" },
    "histoire": { nom: "Histoire", stat: "cns", bonus: 20, effet: "Faits historiques, batailles" },
    "ingenierie": { nom: "Ingénierie", stat: "cns", bonus: 20, effet: "Machines, conception, sabotage" },
    "intimidation": { nom: "Intimidation", stat: "soc", bonus: 10, effet: "Effrayer, autorité, chantage" },
    "intuition": { nom: "Intuition", stat: "per", bonus: 10, effet: "Jauger état d'esprit, mensonge" },
    "joaillerie": { nom: "Joaillerie", stat: "hab", bonus: 20, effet: "Estimer bijou, tailler pierre" },
    "jonglerie": { nom: "Jonglerie", stat: "hab", bonus: 20, effet: "Jongler (balles, couteaux...)" },
    "langage_demon": { nom: "Langage-Démon", stat: "cns", bonus: 10, effet: "Comprendre/parler langue démon" },
    "langue_etrangere": { nom: "Langue étrangère", stat: "cns", bonus: 10, effet: "Comprendre/parler langue/patois" },
    "legendes": { nom: "Légendes", stat: "cns", bonus: 10, effet: "Mythes, contes, héros, monstres" },
    "lettres": { nom: "Lettres", stat: "cns", bonus: 20, effet: "Lire, écrire, calligraphier" },
    "medecine": { nom: "Médecine", stat: "cns", bonus: 10, effet: "Diagnostiquer maladies, anatomie" },
    "milieu_naturel": { nom: "Milieu naturel", stat: "sur", bonus: 10, effet: "Abri, feu, dangers (forêt...)" },
    "musique_chant": { nom: "Musique et chant", stat: "soc", bonus: 10, effet: "Instrument et chanter juste" },
    "natation": { nom: "Natation", stat: "mou", bonus: 10, effet: "Nager, plonger, apnée" },
    "navigation": { nom: "Navigation", stat: "cns", bonus: 10, effet: "Piloter bateau, s'orienter (étoiles)" },
    "noblesse_politique": { nom: "Noblesse et politique", stat: "cns", bonus: 20, effet: "Dynasties, guerres, familles" },
    "noeuds": { nom: "Noeuds", stat: "hab", bonus: 20, effet: "Faire/défaire tous types de noeuds" },
    "occultisme": { nom: "Occultisme", stat: "cns", bonus: 10, effet: "Reconnaître magie, monstre étrange" },
    "odorat_gout": { nom: "Odorat-goût", stat: "per", bonus: 20, effet: "Odeur, parfum, goût, poison" },
    "orientation": { nom: "Orientation", stat: "sur", bonus: 20, effet: "Retrouver chemin, localisation" },
    "passe_passe": { nom: "Passe-passe", stat: "hab", bonus: 10, effet: "Prestidigitation, tours de passe-passe" },
    "parfumerie": { nom: "Parfumerie", stat: "hab", bonus: 20, effet: "Reconnaître parfum, confectionner" },
    "peche": { nom: "Pêche", stat: "sur", bonus: 20, effet: "Pêcher avec adresse" },
    "persuasion": { nom: "Persuasion", stat: "soc", bonus: 10, effet: "Argumenter, convaincre par la raison" },
    "pieges": { nom: "Pièges", stat: "hab", bonus: 10, effet: "Poser et désamorcer un piège" },
    "pistage": { nom: "Pistage", stat: "sur", bonus: 10, effet: "Empreintes, piste, traque" },
    "poesie": { nom: "Poésie", stat: "soc", bonus: 20, effet: "Poèmes, réciter avec emphase" },
    "poisons": { nom: "Poisons", stat: "cns", bonus: 10, effet: "Reconnaître/confectionner poison" },
    "potions": { nom: "Potions et remèdes", stat: "cns", bonus: 10, effet: "Reconnaître/confectionner potion" },
    "premiers_soins": { nom: "Premiers soins", stat: "cns", bonus: 10, effet: "Garrot, blessure, infection" },
    "reflexes": { nom: "Réflexes", stat: "mou", bonus: 10, effet: "Plonger, rattraper objet/personne" },
    "religions": { nom: "Religions", stat: "cns", bonus: 10, effet: "Rites, costumes, prières" },
    "renseignements": { nom: "Renseignements", stat: "soc", bonus: 10, effet: "Rumeurs, s'adresser aux bonnes personnes" },
    "reperage": { nom: "Repérage", stat: "per", bonus: 10, effet: "Déceler détail, ombre, bourse" },
    "resistance_alcool": { nom: "Résistance à l’alcool", stat: "end", bonus: 20, effet: "Gueules de bois, garder contrôle" },
    "resistance_magie": { nom: "Résistance à la magie", stat: "vol", bonus: 10, effet: "Résister aux sortilèges" },
    "resistance_maladies": { nom: "Résistance aux maladies", stat: "end", bonus: 10, effet: "Résister aux maladies/infections" },
    "resistance_poisons": { nom: "Résistance aux poisons", stat: "end", bonus: 10, effet: "Résister venins, poisons, gaz" },
    "resistance_privations": { nom: "Résistance aux privations", stat: "end", bonus: 10, effet: "Résister faim, soif, sommeil" },
    "resistance_chaleur": { nom: "Résistance à la chaleur/froid", stat: "end", bonus: 20, effet: "Résister températures extrêmes" },
    "se_cacher": { nom: "Se cacher", stat: "dis", bonus: 10, effet: "Se dissimuler, suivre quelqu'un" },
    "sexualite": { nom: "Sexualité", stat: "soc", bonus: 20, effet: "Pratiques, endurance, contraception" },
    "soins_animaux": { nom: "Soins des animaux", stat: "cns", bonus: 10, effet: "Soigner maladies/blessures (animaux)" },
    "souffle": { nom: "Souffle", stat: "end", bonus: 10, effet: "Endurance, apnée, résistance gaz" },
    "strategie": { nom: "Stratégie", stat: "cns", bonus: 10, effet: "Tactique, terrain, connaître l'ennemi" },
    "taromancie": { nom: "Taromancie", stat: "cns", bonus: 20, effet: "Lire l'avenir dans le tarot" },
    "torture": { nom: "Torture", stat: "hab", bonus: 10, effet: "Passer un prisonnier à la Question" },
    "travail_pierre": { nom: "Travail de la pierre", stat: "hab", bonus: 20, effet: "Maçonnerie, taille, sculpture" },
    "travail_bois": { nom: "Travail du bois", stat: "hab", bonus: 20, effet: "Charpenterie, bûcheronnage" },
    "travail_metal": { nom: "Travail du métal", stat: "hab", bonus: 20, effet: "Forge, rognure de monnaie" },
    "travail_tissu": { nom: "Travail du tissu", stat: "hab", bonus: 20, effet: "Couture, estimation tissu" },
    "travaux_force": { nom: "Travaux de force", stat: "for", bonus: 20, effet: "Soulever, maintenir charges" },
    "ventriloquie": { nom: "Ventriloquie", stat: "hab", bonus: 20, effet: "Articuler sans remuer les lèvres" },
    "vigilance": { nom: "Vigilance", stat: "per", bonus: 10, effet: "Sentir présence, sens du danger" },
    "vol_tire": { nom: "Vol à la tire", stat: "hab", bonus: 10, effet: "Couper une bourse discrètement" },

    // SPÉCIALITÉS MARTIALES (+5)
    "arcs": { nom: "Arcs", stat: "tir", bonus: 5, effet: "Tirer, flèches, corde" },
    "arbaletes": { nom: "Arbalètes", stat: "tir", bonus: 5, effet: "Tirer, réparer arbalète" },
    "armes_hast": { nom: "Armes d’hast", stat: "com", bonus: 5, effet: "Lance, hallebarde..." },
    "arquebuses": { nom: "Arquebuses", stat: "tir", bonus: 5, effet: "Tirer, entretenir arquebuse" },
    "batons": { nom: "Bâtons", stat: "com", bonus: 5, effet: "Gourdin, bâton" },
    "bombardes": { nom: "Bombardes & explosifs", stat: "tir", bonus: 5, effet: "Bombes artisanales" },
    "canons": { nom: "Canons & balistes", stat: "tir", bonus: 5, effet: "Charger, déclencher canon" },
    "couteaux": { nom: "Couteaux", stat: "com", bonus: 5, effet: "Dague, poignard..." },
    "couteaux_lancer": { nom: "Couteaux de lancer", stat: "tir", bonus: 5, effet: "Lancer couteau de jet" },
    "deux_armes": { nom: "Deux armes", stat: "com", bonus: 5, effet: "Arme dans chaque main" },
    "epees": { nom: "Épées", stat: "com", bonus: 5, effet: "Épée, sabre" },
    "escrime": { nom: "Escrime", stat: "com", bonus: 5, effet: "Rapière" },
    "espadons": { nom: "Espadons", stat: "com", bonus: 5, effet: "Épée à deux mains, espadon" },
    "fleaux": { nom: "Fléaux", stat: "com", bonus: 5, effet: "Fléau d'armes" },
    "fouets": { nom: "Fouets", stat: "com", bonus: 5, effet: "Manipuler le fouet" },
    "frondes": { nom: "Frondes", stat: "tir", bonus: 5, effet: "Tirer fronde, fustibale" },
    "haches_masses": { nom: "Haches & Masses", stat: "com", bonus: 5, effet: "Hache, masse d'armes" },
    "javelots": { nom: "Javelots", stat: "tir", bonus: 5, effet: "Jeter lance légère/javelot" },
    "pistolets": { nom: "Pistolets", stat: "tir", bonus: 5, effet: "Tirer, réparer pistolet" },
    "pugilat": { nom: "Pugilat", stat: "com", bonus: 5, effet: "Mains nues, lutte" },
    "tromblons": { nom: "Tromblons", stat: "tir", bonus: 5, effet: "Tirer, réparer tromblon" },

    // SPÉCIALITÉS MAGIQUES (+5)
    "mag_air": { nom: "Magie de l'Air", stat: "mag", bonus: 5, effet: "Élémentaire Air" },
    "mag_alchimie": { nom: "Alchimie", stat: "mag", bonus: 5, effet: "Alchimie" },
    "mag_animalisme": { nom: "Animalisme", stat: "mag", bonus: 5, effet: "Magie de l'Animalisme" },
    "mag_avarice": { nom: "Avarice", stat: "mag", bonus: 5, effet: "Infernale Avarice" },
    "mag_chatiment": { nom: "Châtiment", stat: "mag", bonus: 5, effet: "Magie du Châtiment" },
    "mag_colere": { nom: "Colère", stat: "mag", bonus: 5, effet: "Infernale Colère" },
    "mag_divination": { nom: "Divination", stat: "mag", bonus: 5, effet: "Magie de Divination" },
    "mag_eau": { nom: "Magie de l'Eau", stat: "mag", bonus: 5, effet: "Élémentaire Eau" },
    "mag_enchantements": { nom: "Enchantements", stat: "mag", bonus: 5, effet: "Magie des Enchantements" },
    "mag_envie": { nom: "Envie", stat: "mag", bonus: 5, effet: "Infernale Envie" },
    "mag_feu": { nom: "Magie du Feu", stat: "mag", bonus: 5, effet: "Élémentaire Feu" },
    "mag_gourmandise": { nom: "Gourmandise", stat: "mag", bonus: 5, effet: "Infernale Gourmandise" },
    "mag_guerre": { nom: "Guerre", stat: "mag", bonus: 5, effet: "Magie de la Guerre" },
    "mag_illusions": { nom: "Illusions", stat: "mag", bonus: 5, effet: "Magie des Illusions" },
    "mag_luxure": { nom: "Luxure", stat: "mag", bonus: 5, effet: "Infernale Luxure" },
    "mag_mentalisme": { nom: "Mentalisme", stat: "mag", bonus: 5, effet: "Magie du Mentalisme" },
    "mag_necromancie": { nom: "Nécromancie", stat: "mag", bonus: 5, effet: "Magie noire Nécromancie" },
    "mag_ombre": { nom: "Ombre", stat: "mag", bonus: 5, effet: "Magie de l'Ombre" },
    "mag_orgueil": { nom: "Orgueil", stat: "mag", bonus: 5, effet: "Infernale Orgueil" },
    "mag_paresse": { nom: "Paresse", stat: "mag", bonus: 5, effet: "Infernale Paresse" },
    "mag_protection": { nom: "Protection", stat: "mag", bonus: 5, effet: "Magie blanche Protection" },
    "mag_terre": { nom: "Magie de la Terre", stat: "mag", bonus: 5, effet: "Élémentaire Terre" },
    "mag_voyage": { nom: "Voyage", stat: "mag", bonus: 5, effet: "Magie du Voyage" }
};

const TALENTS_DATA = {
    "agile": { nom: "Agile [1x/S]", stat: "", bonus: 0, effet: "En mêlée : compétence MOU au lieu de COM" },
    "arme_fetiche": { nom: "Arme fétiche [1x/S]", stat: "", bonus: 0, effet: "Inversion des résultats des dés avec une arme précise" },
    "bagarre": { nom: "Bagarre", stat: "", bonus: 0, effet: "Dégâts mains nues : *FOR*-1, allonge courte (D)" },
    "brute": { nom: "Brute [1x/S]", stat: "", bonus: 0, effet: "En mêlée : compétence FOR au lieu de COM" },
    "calme": { nom: "Calme", stat: "", bonus: 0, effet: "SF +2" },
    "chance_insolente": { nom: "Chance insolente [1x/S]", stat: "", bonus: 0, effet: "Coût SF /2 pour relancer un test" },
    "combat_sol": { nom: "Combat au sol", stat: "", bonus: 0, effet: "Si à terre, l'ennemi n'a pas d'Avantage" },
    "compagnon_animal": { nom: "Compagnon animal", stat: "", bonus: 0, effet: "Un animal fidèle vous suit" },
    "confiance_en_soi": { nom: "Confiance en soi [1x/S]", stat: "", bonus: 0, effet: "Coût SF/2 pour gagner 1 Avantage" },
    "coup_acrobatique": { nom: "Coup acrobatique [1x/S]", stat: "", bonus: 0, effet: "+*MOU* aux dégâts de mêlée" },
    "coup_adroit": { nom: "Coup adroit [1x/S]", stat: "", bonus: 0, effet: "+*HAB* aux dégâts de mêlée" },
    "coup_de_maitre": { nom: "Coup de maître [1x/S]", stat: "", bonus: 0, effet: "+*COM* aux dégâts de mêlée" },
    "coup_du_predateur": { nom: "Coup du prédateur [1x/S]", stat: "", bonus: 0, effet: "+*SUR* aux dégâts de mêlée" },
    "coup_en_traitre": { nom: "Coup en traître [1x/S]", stat: "", bonus: 0, effet: "+*DIS* aux dégâts de mêlée" },
    "coups_precis": { nom: "Coups précis", stat: "", bonus: 0, effet: "Protection adverse /2 en mêlée" },
    "coups_puissants": { nom: "Coups puissants", stat: "", bonus: 0, effet: "Dégâts de mêlée +1" },
    "coup_surnaturel": { nom: "Coup surnaturel [1x/S]", stat: "", bonus: 0, effet: "+*MAG* aux dégâts de mêlée" },
    "cri_de_guerre": { nom: "Cri de guerre [1x/S]", stat: "", bonus: 0, effet: "Les ennemis au COM et VOL < vous sont apeurés" },
    "devoue_serviteur": { nom: "Dévoué serviteur", stat: "", bonus: 0, effet: "Un fidèle compagnon vous suit" },
    "distraction": { nom: "Distraction [1x/S]", stat: "", bonus: 0, effet: "1 Désavantage à une cible" },
    "doue": { nom: "Doué (xxx) [1x/S]", stat: "", bonus: 0, effet: "Inversion des résultats des dés sur une carac." },
    "esquive": { nom: "Esquive", stat: "", bonus: 0, effet: "Protection +1 si pas d'armure lourde, bouclier ou casque" },
    "esprit_competition": { nom: "Esprit de compétition [1x/S]", stat: "", bonus: 0, effet: "Si meilleure réussite qu'un allié, +*SOC* ou *VOL* SF" },
    "esprit_gardien": { nom: "Esprit gardien [1x/S]", stat: "", bonus: 0, effet: "+*MAG* à la protection" },
    "fascination": { nom: "Fascination [1x/S]", stat: "", bonus: 0, effet: "Une cible fait évoluer positivement son avis sur vous" },
    "festoyeur": { nom: "Festoyeur", stat: "", bonus: 0, effet: "Regain de SF x2 (bons moments, repos, idées)" },
    "gardien": { nom: "Gardien [1x/S]", stat: "", bonus: 0, effet: "Vous sauvez un allié et encaissez la moitié des dégâts" },
    "guerison_rapide": { nom: "Guérison rapide", stat: "", bonus: 0, effet: "Regain de PV x2" },
    "inoffensif": { nom: "Inoffensif [1x/S]", stat: "", bonus: 0, effet: "Un adversaire vous ignore pour ce tour" },
    "insaisissable": { nom: "Insaisissable [1x/S]", stat: "", bonus: 0, effet: "Désengagement gratuit" },
    "inspiration": { nom: "Inspiration [1x/S]", stat: "", bonus: 0, effet: "+1 Avantage à vos alliés pendant un tour" },
    "instinct_survie": { nom: "Instinct de survie [1x/S]", stat: "", bonus: 0, effet: "+*SUR* à la protection" },
    "mains_blanches": { nom: "Mains blanches [1x/S]", stat: "", bonus: 0, effet: "+*HAB* PV aux soins" },
    "magie_controlee": { nom: "Magie contrôlée [1x/S]", stat: "", bonus: 0, effet: "Inversion des résultats des dés pour les complications magiques" },
    "magie_destructrice": { nom: "Magie destructrice", stat: "", bonus: 0, effet: "Dégâts magiques +1" },
    "magie_innee": { nom: "Magie innée", stat: "", bonus: 0, effet: "+1 tour et +1 sortilège par jour" },
    "magie_insidieuse": { nom: "Magie insidieuse", stat: "", bonus: 0, effet: "Protection adverse /2 avec vos dégâts magiques" },
    "magie_invisible": { nom: "Magie invisible", stat: "", bonus: 0, effet: "Nature magique indétectable" },
    "magie_sanglante": { nom: "Magie sanglante", stat: "", bonus: 0, effet: "Sacrifice : 1 PV = +2%" },
    "maitre_armes": { nom: "Maître d'armes", stat: "", bonus: 0, effet: "Encerclé, vous pouvez blesser deux adversaires par tour" },
    "maitrise_bouclier": { nom: "Maîtrise du bouclier", stat: "", bonus: 0, effet: "+1 protection si bouclier" },
    "maitrise_poudre": { nom: "Maîtrise de la poudre", stat: "", bonus: 0, effet: "Pas d'effets secondaires avec les armes à poudre" },
    "memoire_sans_faille": { nom: "Mémoire sans faille", stat: "", bonus: 0, effet: "Tests mémoriels réussissent automatiquement" },
    "mensonge_ehonte": { nom: "Mensonge éhonté [1x/J]", stat: "", bonus: 0, effet: "Mensonge crédible cru pendant *SOC* minutes" },
    "nyctalopie": { nom: "Nyctalopie", stat: "", bonus: 0, effet: "Pas de malus dû à l'obscurité" },
    "panache": { nom: "Panache", stat: "", bonus: 0, effet: "Si relance, +1 Avantage" },
    "pattes_de_chat": { nom: "Pattes de chat", stat: "", bonus: 0, effet: "Dégâts de chute/2" },
    "polyglotte": { nom: "Polyglotte", stat: "", bonus: 0, effet: "+*CNS* langues supplémentaires" },
    "port_armure": { nom: "Port d'armure", stat: "", bonus: 0, effet: "Pas de malus d'Initiative ou de MOU (armures/boucliers)" },
    "provocation": { nom: "Provocation [1x/S]", stat: "", bonus: 0, effet: "+*SOC* aux dégâts de mêlée" },
    "prudent": { nom: "Prudent [1x/S]", stat: "", bonus: 0, effet: "1 coup de pouce du Destin gratuit pour la préparation" },
    "recharge_rapide": { nom: "Recharge rapide [1x/S]", stat: "", bonus: 0, effet: "Arme lente rechargée immédiatement" },
    "relations": { nom: "Relations [1x/J]", stat: "", bonus: 0, effet: "Connaissance providentielle" },
    "resilience": { nom: "Résilience [1x/S]", stat: "", bonus: 0, effet: "+*VOL* à la protection" },
    "reflexes_eclairs": { nom: "Réflexes éclairs [1x/S]", stat: "", bonus: 0, effet: "+*MOU* à la protection" },
    "resistance_magique": { nom: "Résistance magique", stat: "", bonus: 0, effet: "Protection +2 contre les dégâts magiques" },
    "riposte": { nom: "Riposte [1x/S]", stat: "", bonus: 0, effet: "Si touché en mêlée, vous infligez des dégâts (même RU)" },
    "sain_esprit": { nom: "Sain d'esprit", stat: "", bonus: 0, effet: "Si Folie ratée, perte de SF/2 ; Instabilité -1" },
    "sauvagerie": { nom: "Sauvagerie", stat: "", bonus: 0, effet: "Dégâts +1 si vous restez sous la moitié de vos PV" },
    "sauvegarde": { nom: "Sauvegarde", stat: "", bonus: 0, effet: "Suppression handicap coût /2" },
    "second_souffle": { nom: "Second souffle [1x/J]", stat: "", bonus: 0, effet: "Si 0 PV, regain immédiat de *END* PV" },
    "sixieme_sens": { nom: "Sixième sens", stat: "", bonus: 0, effet: "Pas d'attaque surprise contre vous" },
    "solidite": { nom: "Solidité", stat: "", bonus: 0, effet: "Vitalité +2" },
    "sommeil_leger": { nom: "Sommeil léger", stat: "", bonus: 0, effet: "Sommeil 4h/jour" },
    "sort_fetiche": { nom: "Sort fétiche [1x/S]", stat: "", bonus: 0, effet: "Inversion des résultats des dés avec un sort précis" },
    "souffle_de_vie": { nom: "Souffle de vie [1x/J]", stat: "", bonus: 0, effet: "Si 0 PV, regain immédiat de *MAG* PV" },
    "spectacle": { nom: "Spectacle [1x/J]", stat: "", bonus: 0, effet: "+*SOC* SF à vos alliés" },
    "suivre_exemple": { nom: "Suivre l'exemple [1x/S]", stat: "", bonus: 0, effet: "Prenez le score obtenu par un allié" },
    "surnombre": { nom: "Surnombre", stat: "", bonus: 0, effet: "Si en surnombre, dégâts de mêlée +1 pour alliés/vous" },
    "travail_equipe": { nom: "Travail d'équipe [1x/S]", stat: "", bonus: 0, effet: "+10% à toute l'équipe lors d'un test de coopération" },
    "tir_precis": { nom: "Tir précis", stat: "", bonus: 0, effet: "Protection adverse /2 à distance" },
    "tireur_elite": { nom: "Tireur d'élite", stat: "", bonus: 0, effet: "Dégâts à distance +1" },
    "tir_chasseur": { nom: "Tir du chasseur [1x/S]", stat: "", bonus: 0, effet: "+*SUR* aux dégâts à distance" },
    "tir_cible": { nom: "Tir ciblé [1x/S]", stat: "", bonus: 0, effet: "+*PER* aux dégâts à distance" },
    "vivacite": { nom: "Vivacité", stat: "", bonus: 0, effet: "Initiative +2" }
};

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class BrigandyneItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ["brigandyne2appv2", "sheet", "item"],
        position: { width: 520, height: 480 },
        form: { submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        sheet: { template: "systems/brigandyne2appv2/templates/item-sheet.hbs" }
    };

    get item() { return this.document; }

    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      
      // 🔥 CORRECTION : Clonage profond pour éviter la corruption de la base de données Foundry V11+
      context.system = foundry.utils.deepClone(this.item.system);
      
      context.item = this.item;
      context.editable = this.isEditable;         
      context.owner = this.document.isOwner;      
  
      context.isArme = this.item.type === "arme";
      context.isArmure = this.item.type === "armure";
      context.isObjet = this.item.type === "objet";
      context.isSort = this.item.type === "sort";
      context.isAtout = this.item.type === "atout";
      context.isOrigine = this.item.type === "origine";
      context.isArchetype = this.item.type === "archetype";
      context.isCarriere = this.item.type === "carriere";
      context.isDomaine = this.item.type === "domaine";
      context.isNotTour = this.item.system.type_sort !== "tour";
      context.choixTypeArme = { "melee": "Mêlée (Combat)", "distance": "Distance (Tir)" };
      context.choixMains = { "1": "1 Main", "2": "2 Mains" };
      context.choixTypeAtout = { "Spécialité": "Spécialité", "Talent": "Talent" };
      context.choixStats = { "": "- Aucune -", "com": "Combat", "cns": "Connaissances", "dis": "Discrétion", "end": "Endurance", "for": "Force", "hab": "Habileté", "mag": "Magie", "mou": "Mouvement", "per": "Perception", "soc": "Sociabilité", "sur": "Survie", "tir": "Tir", "vol": "Volonté" };
      context.choixTypeSort = { "sortilege": "Sortilège (Normal)", "tour": "Tour de Magie", "rituel": "Rituel (Action longue)" };
      context.choixPortee = { "Contact": "Contact (1 m)", "Courte": "Courte (5 m)", "Moyenne": "Moyenne (20 m)", "Longue": "Longue (50 m)", "Extrême": "Extrême (100 m)", "Vue": "À vue", "Personnel": "Personnel" };

      // LES MENUS DÉROULANTS RÉPARÉS ET COMPLETS
      context.choixTypeActivite = { "attaque": "Attaque (Arme)", "soin": "Soin", "utilitaire": "Utilitaire (Magie/Objet)", "talent": "Déclenchement Talent", "buff": "Buff / Débuff" };
      context.choixRessource = { "aucun": "Gratuit", "pv": "Points de Vie", "sf": "Sang-Froid", "utilisation": "Utilisation (Charge)" };
      context.choixFrequence = { "toujours": "À volonté (Aucune)", "combat": "Par Combat", "jour": "Par Jour", "session": "Par Session", "permanent": "Permanent" };
      context.choixEtats = { "": "- Aucun -", "affaibli": "Affaibli", "affame": "Affamé", "apeure": "Apeuré", "aveugle": "Aveuglé", "confus": "Confus", "demoralise": "Démoralisé", "ensanglante": "Ensanglanté", "essouffle": "Essoufflé", "paralyse": "Paralysé", "ralenti": "Ralenti", "sonne": "Sonné", "terrorise": "Terrorisé" };

      if (context.isDomaine) {
          let spells = context.system.spells || [];
          context.toursList = spells.map((s, idx) => ({ ...s, originalIndex: idx })).filter(s => s.type_sort === "tour");
          context.sortsList = spells.map((s, idx) => ({ ...s, originalIndex: idx })).filter(s => s.type_sort !== "tour");
      }

      context.specialitesList = {};
      for (let [key, data] of Object.entries(SPECIALITES_DATA)) {
          context.specialitesList[key] = `${data.nom} (+${data.bonus})`;
      }

      context.talentsList = {};
      for (let [key, data] of Object.entries(TALENTS_DATA)) {
          context.talentsList[key] = data.nom; 
      }

      if (context.isOrigine || context.isArchetype || context.isCarriere) {
          context.system.stats = context.system.stats || {};
          const statKeys = ["com", "cns", "dis", "end", "for", "hab", "mag", "mou", "per", "soc", "sur", "tir", "vol"];
          for (let k of statKeys) {
              if (context.system.stats[k] === undefined) {
                  context.system.stats[k] = 0;
              }
          }
      }
      
      context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(this.item.system.description || "", { async: true });

      return context;
    }

    _onRender(context, options) {
        super._onRender(context, options);
        const html = $(this.element);

        this._activeTab = this._activeTab || "details"; 

        html.find('[data-action="changeTab"]').click(ev => {
            ev.preventDefault();
            const tabName = $(ev.currentTarget).data('tab');
            this._activeTab = tabName; 
            
            html.find('[data-action="changeTab"]').removeClass('active');
            $(ev.currentTarget).addClass('active');
            html.find('.tab').hide();
            html.find(`.tab.${tabName}`).show();
        });

        html.find('[data-action="editImage"]').click(ev => {
            new FilePicker({
                type: "image",
                current: this.item.img,
                callback: path => this.item.update({ img: path })
            }).browse();
        });
        
        html.find(`[data-action="changeTab"][data-tab="${this._activeTab}"]`).addClass('active');
        html.find('.tab').hide();
        html.find(`.tab.${this._activeTab}`).show();

        html.find('textarea').each(function() {
            this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px; overflow-y:hidden;');
        }).on('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        if (this.isEditable) {
            this.element.ondragover = (event) => {
                event.preventDefault();
            };
            
            this.element.ondrop = (event) => {
                event.preventDefault();
                event.stopPropagation(); 
                this._onDrop(event);
            };
        }

        html.find('.spell-delete, [data-action="deleteSpell"]').click(ev => {
            const index = ev.currentTarget.dataset.index;
            const spells = [...this.item.system.spells];
            spells.splice(index, 1);
            this.item.update({ "system.spells": spells });
        });

        html.find('select[name="system.specialite"]').change(ev => {
            const selectedKey = ev.currentTarget.value;
            if (!selectedKey) return; 
            const data = SPECIALITES_DATA[selectedKey];
            if (data) {
                this.item.update({ name: `Spécialité : ${data.nom}`, "system.stat_liee": data.stat, "system.bonus": data.bonus, "system.effet": data.effet });
            }
        });

        html.find('.search-list').on('input', function() {
            const targetSelector = $(this).data('target');
            const searchStr = $(this).val().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
            html.find(targetSelector + ' option').each(function() {
                const text = $(this).text().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if ($(this).val() === "" || text.includes(searchStr)) $(this).show(); else $(this).hide();
            });
        });

        html.find('select[name="system.talent"]').change(ev => {
            const selectedKey = ev.currentTarget.value;
            if (!selectedKey) return; 
            const data = TALENTS_DATA[selectedKey];
            if (data) {
                this.item.update({ name: `Talent : ${data.nom}`, "system.stat_liee": data.stat, "system.bonus": data.bonus, "system.effet": data.effet });
            }
        });

        // ==========================================
        // GESTION DES ACTIVITÉS (BLINDÉE + AUTO-RÉPARATION)
        // ==========================================
        
        // 1. Bouton Ajouter
        html.find('[data-action="addActivity"]').click(async ev => {
            ev.preventDefault();
            
            if (Array.isArray(this.item.system.activities)) {
                await this.item.update({ "system.activities": {} });
            }

            const id = foundry.utils.randomID();
            
            await this.item.update({ 
                [`system.activities.${id}`]: {
                    id: id,
                    nom: "Nouvelle action",
                    type: "utilitaire",
                    cout: { valeur: 0, ressource: "aucun" },
                    utilisations: { value: 0, max: 0, frequence: "toujours" },
                    effet: { 
                        formule_jet: "", 
                        degats: "", 
                        applique_etat: "",
                        sauvegarde: { stat: "", mod: 0 },
                        // 🔥 INITIALISATION CORRECTE POUR ENREGISTREMENT
                        buff: { stat: "", valeur: 0 }
                    }
                }
            });
        });

        // 2. Bouton Supprimer
        html.find('[data-action="deleteActivity"]').click(async ev => {
            ev.preventDefault();
            const actId = ev.currentTarget.dataset.id || ev.currentTarget.dataset.index;
            await this.item.update({ [`system.activities.-=${actId}`]: null });
        });

        // 3. Intercepteur de saisie pour les activités dynamiques
        html.find('.act-input').change(async ev => {
            ev.preventDefault();
            const el = ev.currentTarget;
            const index = el.dataset.index;
            const field = el.dataset.field; 
            
            let val = el.value;
            if (el.type === "number") val = Number(val) || 0;
            if (el.type === "checkbox") val = el.checked;

            let activities = foundry.utils.deepClone(this.item.system.activities || {});
            
            if (Array.isArray(activities)) {
                activities = {};
                await this.item.update({ "system.activities": activities });
            }

            if (activities[index]) {
                foundry.utils.setProperty(activities[index], field, val);
                await this.item.update({ "system.activities": activities });
            }
        });

        // ==========================================
        // 🔥 SÉCURITÉ ABSOLUE DE SAUVEGARDE GLOBALE
        // ==========================================
        html.find('input[name^="system."], select[name^="system."], textarea[name^="system."]').change(async ev => {
            if (ev.currentTarget.classList.contains('act-input')) return; 
            
            const name = ev.currentTarget.name;
            let value = ev.currentTarget.value;
            
            if (ev.currentTarget.type === "checkbox") value = ev.currentTarget.checked;
            if (ev.currentTarget.type === "number") value = Number(value) || 0;
            
            let updates = { [name]: value };

            // 🔥 BONUS : Remplacement dynamique du nom du talent Doué
            if (name === "system.stat_liee" && this.item.name.toLowerCase().includes("doué")) {
                const statLabel = value ? value.toUpperCase() : "XXX";
                updates.name = `Doué (${statLabel}) [1x/S]`;
            }
            
            await this.item.update(updates);
        });
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.getDragEventData(event);
        if (data.type !== "Item") {
            if (super._onDrop) return super._onDrop(event);
            return false;
        }
        
        if (this.item.type !== "domaine") return;

        const droppedItem = await Item.implementation.fromDropData(data);
        
        if (droppedItem.type !== "sort") { 
            ui.notifications.warn("Seuls les sorts peuvent être ajoutés à un domaine."); 
            return false; 
        }

        const spells = this.item.system.spells ? [...this.item.system.spells] : [];
        
        if (spells.find(s => s.name === droppedItem.name)) { 
            ui.notifications.info("Ce sort est déjà présent dans le domaine."); 
            return false; 
        }

        spells.push({ 
            name: droppedItem.name, 
            img: droppedItem.img, 
            type_sort: droppedItem.system.type_sort || "sortilege", 
            difficulte: droppedItem.system.difficulte || 0 
        });
        
        await this.item.update({ "system.spells": spells });
    }
}