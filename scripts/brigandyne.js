import { BrigandyneActorSheet } from "./actor-sheet.js";
import { BrigandyneActor } from "./actor.js"; 
import { BrigandyneItemSheet } from "./item-sheet.js";
import { PersonnageData, PnjData, ArmeData, ArmureData, ObjetData, SortData, AtoutData, DomaineData, OrigineData, ArchetypeData, CarriereData } from "./datamodels.mjs";

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
        scope: "client",
        config: true,        
        type: Boolean,
        default: true
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
    CONFIG.Actor.documentClass = BrigandyneActor; 

    // Enregistrement des modèles d'Acteurs
    CONFIG.Actor.dataModels = {
        personnage: PersonnageData,
        pnj: PnjData
    };

    // Enregistrement des modèles d'Objets
    CONFIG.Item.dataModels = {
        arme: ArmeData,
        armure: ArmureData,
        objet: ObjetData,
        sort: SortData,
        atout: AtoutData,
        domaine: DomaineData,
        origine: OrigineData,
        archetype: ArchetypeData,
        carriere: CarriereData
    };

    // ==========================================
    // 2. RÈGLES DU JEU
    // ==========================================
    CONFIG.Combat.initiative = {
        formula: "1d10 + @initiative.value", 
        decimals: 2
    };
  
    // ==========================================
    // 3. ENREGISTREMENT DES FICHES APPV2
    // ==========================================
    Actors.unregisterSheet("core", ActorSheet);
    Items.unregisterSheet("core", ItemSheet);

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

    Handlebars.registerHelper('or', function () {
        const args = Array.prototype.slice.call(arguments, 0, -1);
        return args.some(Boolean);
    });

    // ==========================================
    // 5. PRÉCHARGEMENT DES PARTIALS (FRAGMENTS HTML)
    // ==========================================
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
        "systems/brigandyne2appv2/templates/item/parts/item-activities.hbs", // 🔥 CRUCIAL POUR LES ACTIVITÉS

        // --- PARTS DES ACTEURS ---
        "systems/brigandyne2appv2/templates/actor/parts/header.hbs",
        "systems/brigandyne2appv2/templates/actor/parts/tabs.hbs",
        "systems/brigandyne2appv2/templates/actor/parts/stats.hbs",
        "systems/brigandyne2appv2/templates/actor/parts/inventory.hbs",
        "systems/brigandyne2appv2/templates/actor/parts/magic.hbs",
        "systems/brigandyne2appv2/templates/actor/parts/biography.hbs"
    ]);

    // ==========================================
    // TOKEN HUD : ACTIONS RAPIDES
    // ==========================================
    Hooks.on("renderTokenHUD", (hud, html, tokenData) => {
        if (!game.settings.get("brigandyne2appv2", "enableTokenHUD")) return;

        const tokenDoc = hud.document || hud.object?.document;
        const actor = tokenDoc?.actor || canvas.tokens.get(tokenData.id || tokenData._id)?.actor;
        if (!actor) return;

        const armes = actor.items.filter(i => i.type === "arme");
        const sorts = actor.items.filter(i => i.type === "sort");
        if (armes.length === 0 && sorts.length === 0) return;

        const htmlElement = html.length ? html[0] : html;
        const targetHud = htmlElement.id === "token-hud" ? htmlElement : (document.getElementById("token-hud") || htmlElement);

        const oldCol = targetHud.querySelector(".brigandyne-hud-col");
        if (oldCol) oldCol.remove();

        const actionCol = document.createElement("div");
        actionCol.className = "col right brigandyne-hud-col";
        actionCol.style.cssText = "position: absolute; left: calc(100% + 60px); top: 0; display: flex; flex-direction: column; gap: 4px; z-index: 100; width: max-content; min-width: 150px;";

        let innerHTML = "";

        if (armes.length > 0) {
            innerHTML += `<div style="color: white; font-weight: bold; border-bottom: 2px solid #8b0000; text-align: center; text-transform: uppercase; font-size: 0.8em; margin-bottom: 4px; text-shadow: 1px 1px 2px black;">⚔️ Armes</div>`;
            armes.forEach(arme => {
                innerHTML += `
                    <div class="control-icon brigandyne-action" data-type="weapon" data-id="${arme.id}" title="${arme.name}" style="display: flex; align-items: center; justify-content: flex-start; padding: 4px 10px 4px 5px; border-radius: 5px; background: rgba(0,0,0,0.7); border: 1px solid #444; margin: 0; box-sizing: border-box; cursor: pointer; transition: background 0.2s;">
                        <img src="${arme.img}" style="width: 24px; height: 24px; border: none; margin-right: 8px; border-radius: 3px;">
                        <span style="color: white; font-size: 0.9em; white-space: nowrap; font-family: 'Georgia', serif;">${arme.name}</span>
                    </div>`;
            });
        }

        if (sorts.length > 0) {
            innerHTML += `<div style="color: white; font-weight: bold; border-bottom: 2px solid #4a6491; text-align: center; text-transform: uppercase; font-size: 0.8em; margin-top: 8px; margin-bottom: 4px; text-shadow: 1px 1px 2px black;">✨ Magie</div>`;
            sorts.forEach(sort => {
                innerHTML += `
                    <div class="control-icon brigandyne-action" data-type="spell" data-id="${sort.id}" title="${sort.name}" style="display: flex; align-items: center; justify-content: flex-start; padding: 4px 10px 4px 5px; border-radius: 5px; background: rgba(0,0,0,0.7); border: 1px solid #444; margin: 0; box-sizing: border-box; cursor: pointer; transition: background 0.2s;">
                        <img src="${sort.img}" style="width: 24px; height: 24px; border: none; margin-right: 8px; border-radius: 3px;">
                        <span style="color: white; font-size: 0.9em; white-space: nowrap; font-family: 'Georgia', serif;">${sort.name}</span>
                    </div>`;
            });
        }

        actionCol.innerHTML = innerHTML;

        const actionButtons = actionCol.querySelectorAll('.brigandyne-action');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', async (ev) => {
                ev.preventDefault();
                ev.stopPropagation(); 
                const type = ev.currentTarget.dataset.type;
                const itemId = ev.currentTarget.dataset.id;
                
                if (type === "weapon") await actor.rollWeapon(itemId);
                if (type === "spell") await actor.rollSpell(itemId);
                
                if (hud.clear) hud.clear();
                else if (hud.close) hud.close(); 
            });
            btn.addEventListener('mouseenter', () => btn.style.background = "rgba(139, 0, 0, 0.8)");
            btn.addEventListener('mouseleave', () => btn.style.background = "rgba(0, 0, 0, 0.7)");
        });

        targetHud.appendChild(actionCol);
    });

    // ==========================================
    // BOUTONS DANS LE CHAT (Sauvegardes & Inversions de dés)
    // 🔥 V13+ STRICT : Remplacé par du Vanilla JS pur (Zéro jQuery)
    // ==========================================
    Hooks.on("renderChatLog", (app, html, data) => {
        const chatLog = html.length ? html[0] : html;
        
        chatLog.addEventListener("click", async (ev) => {
            // 1. Bouton : Jet de Sauvegarde
            let btn = ev.target.closest(".chat-save-btn");
            if (btn) {
                ev.preventDefault();
                const actor = game.actors.get(btn.dataset.actorId);
                if (!actor || !actor.isOwner) return ui.notifications.warn("Vous ne possédez pas ce personnage !");
                actor.rollSave(btn.dataset.stat, parseInt(btn.dataset.mod) || 0);
                return;
            }

            // 2. Bouton : Inverser un test de Statistique ("Doué")
            btn = ev.target.closest(".invert-stat-btn");
            if (btn) {
                ev.preventDefault();
                const actor = game.actors.get(btn.dataset.actorId);
                if (!actor || !actor.isOwner) return;

                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-check"></i> Inversion utilisée !`;
                btn.style.opacity = "0.5";

                try {
                    const options = JSON.parse(btn.dataset.options);
                    const forcedResult = parseInt(btn.dataset.inverted);
                    const targetToken = options.targetId ? canvas.tokens.get(options.targetId) : null;
                    await actor._executeStatRoll(btn.dataset.stat, targetToken, options.targetStatKey, options.modDifficulte, options.totalBonusAtouts, forcedResult);
                } catch (err) { console.error(err); }
                return;
            }

            // 3. Bouton : Inverser une attaque à l'Arme ("Arme Fétiche" ou "Doué")
            btn = ev.target.closest(".invert-weapon-btn");
            if (btn) {
                ev.preventDefault();
                const actor = game.actors.get(btn.dataset.actorId);
                if (!actor || !actor.isOwner) return;

                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-check"></i> Inversion utilisée !`;
                btn.style.opacity = "0.5";

                const weapon = actor.items.get(btn.dataset.weaponId);
                const options = JSON.parse(btn.dataset.options);
                const forcedResult = parseInt(btn.dataset.inverted);
                await actor._executeWeaponRoll(weapon, options, forcedResult);
                return;
            }

            // 4. Bouton : Inverser un Sort ("Sort Fétiche" ou "Magie Contrôlée")
            btn = ev.target.closest(".invert-spell-btn");
            if (btn) {
                ev.preventDefault();
                const actor = game.actors.get(btn.dataset.actorId);
                if (!actor || !actor.isOwner) return;

                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-check"></i> Magie Inversée !`;
                btn.style.opacity = "0.5";

                const sort = actor.items.get(btn.dataset.spellId);
                const options = JSON.parse(btn.dataset.options);
                const forcedResult = parseInt(btn.dataset.inverted);
                await actor._executeSpellRoll(sort, options, forcedResult);
                return;
            }
        });
    });
});