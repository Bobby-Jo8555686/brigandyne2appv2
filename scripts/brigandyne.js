import { BrigandyneActorSheet } from "./actor-sheet.js";
import { BrigandyneActor } from "./actor.js"; 
import { BrigandyneItemSheet } from "./item-sheet.js";
import { PersonnageData, PnjData } from "./datamodels.mjs";

Hooks.once("init", async function() {
    console.log("Brigandyne | Chargement du système en AppV2 et DataModels !");

    // ==========================================
    // 1. CLASSES ET DONNÉES (DATAMODELS)
    // ==========================================
    // Définir la classe d'acteur personnalisée
    CONFIG.Actor.documentClass = BrigandyneActor; 

    // Enregistrer les DataModels pour structurer la base de données
    CONFIG.Actor.dataModels = {
        personnage: PersonnageData,
        pnj: PnjData
    };

    // ==========================================
    // 2. RÈGLES DU JEU
    // ==========================================
    // Formule d'initiative dans le Combat Tracker
    CONFIG.Combat.initiative = {
        formula: "1d10 + @initiative.value", 
        decimals: 2
    };
  
    // ==========================================
    // 3. ENREGISTREMENT DES FICHES APPV2
    // ==========================================
    // Désenregistrement des feuilles de base
    Actors.unregisterSheet("core", ActorSheet);
    Items.unregisterSheet("core", ItemSheet);

    // Enregistrement des nouvelles feuilles avec le bon identifiant
    DocumentSheetConfig.registerSheet(Actor, "brigandyne2appv2", BrigandyneActorSheet, { makeDefault: true });
    DocumentSheetConfig.registerSheet(Item, "brigandyne2appv2", BrigandyneItemSheet, { makeDefault: true });

    // ==========================================
    // 4. HELPERS HANDLEBARS
    // ==========================================
    Handlebars.registerHelper('brigandyne-dizaine', function(value) {
        return Math.floor(value / 10);
    });
    
    Handlebars.registerHelper('eq', function (a, b) {
        return a === b;
    });

    // Helper "or" permettant de vérifier plusieurs conditions (ex: {{#if (or cond1 cond2)}})
    Handlebars.registerHelper('or', function () {
        // On récupère tous les arguments passés au helper (sauf le dernier qui est l'objet options de Handlebars)
        const args = Array.prototype.slice.call(arguments, 0, -1);
        return args.some(Boolean);
    });

    // ==========================================
    // 5. PRÉCHARGEMENT DES PARTIALS (FRAGMENTS HTML)
    // ==========================================
    // Indispensable pour pouvoir utiliser {{> "chemin/vers/fichier.hbs"}} dans les templates maîtres
    await loadTemplates([
        // --- PARTS DES OBJETS ---
        "systems/brigandyne2appv2/templates/item/parts/header.hbs",
        "systems/brigandyne2appv2/templates/item/parts/tabs.hbs",
        "systems/brigandyne2appv2/templates/item/parts/arme.hbs",
        "systems/brigandyne2appv2/templates/item/parts/armure.hbs",
        "systems/brigandyne2appv2/templates/item/parts/objet.hbs",
        "systems/brigandyne2appv2/templates/item/parts/atout.hbs",
        "systems/brigandyne2appv2/templates/item/parts/sort.hbs",
        "systems/brigandyne2appv2/templates/item/parts/domaine.hbs",
        "systems/brigandyne2appv2/templates/item/parts/origine.hbs",
        "systems/brigandyne2appv2/templates/item/parts/archetype.hbs",
        "systems/brigandyne2appv2/templates/item/parts/carriere.hbs",
        "systems/brigandyne2appv2/templates/item/parts/description.hbs",

        // --- PARTS DES ACTEURS ---
        "systems/brigandyne2appv2/templates/actor/parts/header.hbs",
        "systems/brigandyne2appv2/templates/actor/parts/tabs.hbs",
        "systems/brigandyne2appv2/templates/actor/parts/stats.hbs",
        "systems/brigandyne2appv2/templates/actor/parts/inventory.hbs",
        "systems/brigandyne2appv2/templates/actor/parts/magic.hbs",
        "systems/brigandyne2appv2/templates/actor/parts/biography.hbs"
    ]);
});