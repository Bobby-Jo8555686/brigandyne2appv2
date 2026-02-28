import { BrigandyneActorSheet } from "./actor-sheet.js";
import { BrigandyneActor } from "./actor.js"; 
import { BrigandyneItemSheet } from "./item-sheet.js";
import { PersonnageData, PnjData } from "./datamodels.mjs";

Hooks.once("init", async function() {
    console.log("Brigandyne | Chargement du système en AppV2 et DataModels !");

// ==========================================
    // 0. PARAMÈTRES DU SYSTÈME (SETTINGS)
    // ==========================================
    game.settings.register("brigandyne2appv2", "sbireOneHit", {
        name: "Sbires vaincus en un coup",
        hint: "Règle optionnelle (Cinématique) : Si cette case est cochée, le moindre point de dégât subi par un PNJ de type Sbire réduira ses PV à 0 instantanément.",
        scope: "world",      
        config: true,        
        type: Boolean,
        default: true        
    });
    game.settings.register("brigandyne2appv2", "enableTokenHUD", {
        name: "Actions rapides sur les Tokens (HUD)",
        hint: "Affiche automatiquement les armes et les sorts du personnage à côté du menu circulaire lors d'un clic droit sur son Token.",
        scope: "client",     // "client" permet à chaque joueur de choisir son propre confort d'interface !
        config: true,        
        type: Boolean,
        default: true        // Activé par défaut, comme tu le souhaites
    });
    game.settings.register("brigandyne2appv2", "strictMagicDomains", {
        name: "Restriction des Domaines Magiques",
        hint: "Si activé, un PJ ne peut recevoir (glisser-déposer) que les sorts listés dans les Domaines Magiques qu'il possède déjà dans son inventaire.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

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
    // ==========================================
    // TOKEN HUD : ACTIONS RAPIDES (Universel V12/V13)
    // ==========================================
    Hooks.on("renderTokenHUD", (hud, html, tokenData) => {
        // 1. Vérification de l'option
        if (!game.settings.get("brigandyne2appv2", "enableTokenHUD")) return;

        const actor = hud.object?.actor;
        if (!actor) return;

        // 2. Récupération des objets
        const armes = actor.items.filter(i => i.type === "arme");
        const sorts = actor.items.filter(i => i.type === "sort");

        if (armes.length === 0 && sorts.length === 0) return;

        // 3. Bouclier de compatibilité V12/V13 (jQuery vs DOM Natif)
        const htmlElement = html.length ? html[0] : html;

        // 4. Création du container en DOM Natif
        const actionCol = document.createElement("div");
        actionCol.className = "col right brigandyne-hud-col";
        actionCol.style.cssText = "right: -190px; width: 180px; top: 0; position: absolute; display: flex; flex-direction: column; gap: 4px; z-index: 100;";

        let innerHTML = "";

        // --- SECTION ARMES ---
        if (armes.length > 0) {
            innerHTML += `<div style="color: white; font-weight: bold; border-bottom: 2px solid #8b0000; text-align: center; text-transform: uppercase; font-size: 0.8em; margin-bottom: 4px; text-shadow: 1px 1px 2px black;">⚔️ Armes</div>`;
            
            armes.forEach(arme => {
                innerHTML += `
                    <div class="control-icon brigandyne-action" data-type="weapon" data-id="${arme.id}" title="${arme.name}" style="width: 100%; display: flex; align-items: center; justify-content: flex-start; padding: 2px 5px; border-radius: 5px; background: rgba(0,0,0,0.7); border: 1px solid #444; margin: 0; box-sizing: border-box; cursor: pointer; transition: background 0.2s;">
                        <img src="${arme.img}" style="width: 24px; height: 24px; border: none; margin-right: 8px; border-radius: 3px;">
                        <span style="color: white; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Georgia', serif;">${arme.name}</span>
                    </div>
                `;
            });
        }

        // --- SECTION MAGIE ---
        if (sorts.length > 0) {
            innerHTML += `<div style="color: white; font-weight: bold; border-bottom: 2px solid #4a6491; text-align: center; text-transform: uppercase; font-size: 0.8em; margin-top: 8px; margin-bottom: 4px; text-shadow: 1px 1px 2px black;">✨ Magie</div>`;
            
            sorts.forEach(sort => {
                innerHTML += `
                    <div class="control-icon brigandyne-action" data-type="spell" data-id="${sort.id}" title="${sort.name}" style="width: 100%; display: flex; align-items: center; justify-content: flex-start; padding: 2px 5px; border-radius: 5px; background: rgba(0,0,0,0.7); border: 1px solid #444; margin: 0; box-sizing: border-box; cursor: pointer; transition: background 0.2s;">
                        <img src="${sort.img}" style="width: 24px; height: 24px; border: none; margin-right: 8px; border-radius: 3px;">
                        <span style="color: white; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Georgia', serif;">${sort.name}</span>
                    </div>
                `;
            });
        }

        actionCol.innerHTML = innerHTML;

        // 5. Ajout des événements de clic et de survol en JavaScript Pur
        const actionButtons = actionCol.querySelectorAll('.brigandyne-action');
        actionButtons.forEach(btn => {
            
            // Clic sur l'action
            btn.addEventListener('click', async (ev) => {
                ev.preventDefault();
                const type = ev.currentTarget.dataset.type;
                const itemId = ev.currentTarget.dataset.id;
                
                if (type === "weapon") await actor.rollWeapon(itemId);
                if (type === "spell") await actor.rollSpell(itemId);
                
                hud.clear(); // Ferme le HUD
            });

            // Effet de survol (Hover)
            btn.addEventListener('mouseenter', () => {
                btn.style.background = "rgba(139, 0, 0, 0.8)";
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = "rgba(0, 0, 0, 0.7)";
            });
        });

        // 6. Injection dans l'élément natif du HUD (compatible V13)
        htmlElement.appendChild(actionCol);
    });
});
