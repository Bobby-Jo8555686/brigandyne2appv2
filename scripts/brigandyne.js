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
        "systems/brigandyne2appv2/templates/item/parts/item-activities.hbs",

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
    // ==========================================
    Hooks.once("ready", () => {
        document.body.addEventListener("click", async (ev) => {
            
            // 1. GESTION DES TACTIQUES DE COMBAT
            let btn = ev.target.closest(".resolve-tactics-btn");
            if (btn) {
                ev.preventDefault();
                const payloadStr = btn.dataset.payload;
                if (!payloadStr) return;
                const payload = JSON.parse(payloadStr.replace(/&quot;/g, '"'));
                
                let { winnerId, loserId } = payload;

                let winnerActor = await fromUuid(winnerId);
                if (!winnerActor) winnerActor = game.actors.get(winnerId);

                let loserActor = null;
                if (loserId) {
                    loserActor = await fromUuid(loserId);
                    if (!loserActor) loserActor = game.actors.get(loserId);
                    
                    if (loserActor && !loserActor.isToken && canvas.ready) {
                        const currentTarget = Array.from(game.user.targets)[0];
                        if (currentTarget && currentTarget.actor) {
                            loserActor = currentTarget.actor;
                        }
                    }
                }

                if (!game.user.isGM && (!winnerActor || !winnerActor.isOwner)) {
                    return ui.notifications.warn("Vous n'êtes pas l'auteur de cette passe d'armes !");
                }

                const card = btn.closest('.combat-tactics-card');
                const messageEl = btn.closest('.message');
                const chatMessage = messageEl ? game.messages.get(messageEl.dataset.messageId) : null;

                const effect1 = card.querySelector('.tactic-effect-1').value;
                const effect2El = card.querySelector('.tactic-effect-2');
                const effect2 = effect2El ? effect2El.value : "none";

                if (effect2 !== "none" && effect1 === effect2) {
                    return ui.notifications.warn("Vous ne pouvez pas choisir deux fois le même effet !");
                }

                let finalDamage = 0;
                let appliedEffectsText = [];
                let isBlesser = (effect1 === "blesser" || effect2 === "blesser");
                let isPrecision = (effect1 === "precision" || effect2 === "precision");
                let isPuissance = (effect1 === "puissance" || effect2 === "puissance");
                
                let currentHandicaps = {};
                if (loserActor) currentHandicaps = foundry.utils.deepClone(loserActor.system.handicaps || {});
                let hasHandicapChanges = false;

                const checkEffect = (eff) => {
                    switch(eff) {
                        case "devastateur": appliedEffectsText.push("💥 <b>Coup Dévastateur</b> (Le dé explose !)"); break;
                        case "blesser": appliedEffectsText.push("🗡️ <b>Blessure infligée</b>"); break;
                        case "bousculer": appliedEffectsText.push("🛡️ <b>Bousculé</b>"); break;
                        case "desengager": appliedEffectsText.push("💨 <b>Désengagement</b>"); break;
                        case "choc": appliedEffectsText.push("💫 <b>Choc</b> (Sonné)"); currentHandicaps.sonne = true; hasHandicapChanges = true; break;
                        case "precision": appliedEffectsText.push("🎯 <b>Précision</b>"); break;
                        case "puissance": appliedEffectsText.push("💪 <b>Puissance</b> (+1 DG)"); break;
                        case "lateral": appliedEffectsText.push("🔄 <b>Coup latéral</b>"); break;
                        case "handicapant": appliedEffectsText.push("🦵 <b>Coup handicapant</b> (Ralenti)"); currentHandicaps.ralenti = true; hasHandicapChanges = true; break;
                        case "illegal": appliedEffectsText.push("👁️ <b>Coup illégal</b> (Affaibli)"); currentHandicaps.affaibli = true; hasHandicapChanges = true; break;
                        case "desarmement": appliedEffectsText.push("⚔️ <b>Désarmement</b>"); break;
                        case "enchainement": appliedEffectsText.push("⚡ <b>Enchaînement</b>"); break;
                        case "saignement": appliedEffectsText.push("🩸 <b>Saignement</b> (Ensanglanté)"); currentHandicaps.ensanglante = true; hasHandicapChanges = true; break;
                        case "immobilisation": appliedEffectsText.push("🤼 <b>Immobilisation</b>"); break;
                    }
                };

                checkEffect(effect1);
                if (effect2 !== "none") checkEffect(effect2);

                let resultHtml = `<div style="text-align: left; margin-top: 10px; border-top: 1px dashed #555; padding-top: 5px;">
                    <strong style="color: #fff;">Effets appliqués :</strong><ul style="margin: 5px 0; padding-left: 20px; color: #e0e0e0; font-size: 0.95em;">`;
                appliedEffectsText.forEach(t => resultHtml += `<li>${t}</li>`);
                resultHtml += `</ul>`;

                // ==========================================
                // VÉRIFICATION DU COUP CRITIQUE (Le fameux "Ou")
                // ==========================================
                let finalDegatsBruts = payload.degatsBruts;
                let finalDetDie = payload.detDie;

                if (payload.isCrit && effect2 !== "devastateur") {
                    // Si on a fait un 0 mais qu'on a choisi un autre effet tactique, on perd l'explosion
                    finalDegatsBruts = payload.degatsFlat;
                    finalDetDie = payload.texteFlat;
                }

                if (isBlesser && !payload.degatsNul) {
                    if (isPrecision) { payload.protection = 0; payload.armorPiercingNote = " (Précision)"; }
                    if (isPuissance) { finalDegatsBruts += 1; }
                    
                    // RÈGLE : 1 point de dégât minimum si l'attaque blesse
                    finalDamage = Math.max(1, finalDegatsBruts - payload.protection);
                    
                    if (loserActor) {
                        let newHp = Math.max(0, loserActor.system.vitalite.value - finalDamage);
                        if (payload.sbireOneHit && loserActor.type === "pnj" && loserActor.system.type_pnj === "sbire" && finalDamage > 0) newHp = 0;
                        
                        let finalUpdates = { "system.vitalite.value": newHp };
                        if (hasHandicapChanges) finalUpdates["system.handicaps"] = currentHandicaps;
                        
                        await loserActor.update(finalUpdates);
                        
                        // Préparation de la formule de calcul en clair
                        let detailCalcul = `${finalDetDie} <small>RU</small> + ${payload.detBase} <small>Base</small> + ${payload.detBonus} <small>Bonus</small>`;
                        if (payload.detDiv > 1) detailCalcul = `(${detailCalcul}) / ${payload.detDiv}`;

                        let boxColor = payload.isCounter ? "counter-attack-box" : "success-box";

                        resultHtml += `
                        <div class="weapon-damage ${boxColor}" style="margin-top: 10px; padding: 10px; border-radius: 5px; background: rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2);">
                            <div style="font-size: 1.2em; font-weight: bold; color: #fff; text-align: center;">Dégâts : ${finalDamage} PV</div>
                            
                            <div style="font-size: 0.85em; color: #aaa; margin-top: 5px; border-top: 1px dashed #555; padding-top: 5px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>Calcul Bruts :</span>
                                    <span>(${detailCalcul}) = <b>${finalDegatsBruts}</b></span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                                    <span>Réduction :</span>
                                    <span>- ${payload.protection} <small>Prot.</small>${payload.armorPiercingNote}</span>
                                </div>
                            </div>
                        </div>`;
                    }
                } else {
                    if (loserActor && hasHandicapChanges) await loserActor.update({"system.handicaps": currentHandicaps});
                    resultHtml += `<div style="text-align: center; color: #aaa; font-style: italic;">Aucun dégât direct.</div>`;
                }
                resultHtml += `</div>`;

                if (chatMessage) {
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(chatMessage.content, 'text/html');
                    let cardEl = doc.querySelector('.combat-tactics-card');
                    if (cardEl) {
                        let headerColor = payload.isCounter ? "#b71c1c" : "#4CAF50";
                        cardEl.innerHTML = `<h4 style="margin: 0; color: ${headerColor}; text-align: center; border-bottom: 1px solid ${headerColor};"><i class="fas fa-check-circle"></i> Résolu</h4>${resultHtml}`;
                        await chatMessage.update({ content: doc.body.innerHTML });
                    }
                }
                return;
            }

            // ==========================================
            // 1.5 GESTION DES ÉGALITÉS (DOUBLÉS)
            // ==========================================
            let tieBtn = ev.target.closest(".resolve-tie-btn");
            if (tieBtn) {
                ev.preventDefault();
                const payloadStr = tieBtn.dataset.payload;
                if (!payloadStr) return;
                const payload = JSON.parse(payloadStr.replace(/&quot;/g, '"'));
                const tieType = tieBtn.dataset.type; // "parade" ou "frappe"
                
                let pjActor = await fromUuid(payload.pjId);
                let pnjActor = await fromUuid(payload.pnjId);
                if (!pjActor && payload.pjId) pjActor = game.actors.get(payload.pjId);
                if (!pnjActor && payload.pnjId) pnjActor = game.actors.get(payload.pnjId);

                const card = tieBtn.closest('.combat-tactics-card');
                const messageEl = tieBtn.closest('.message');
                const chatMessage = messageEl ? game.messages.get(messageEl.dataset.messageId) : null;
                
                let resultHtml = "";
                
                if (tieType === "parade") {
                    resultHtml = `<div style="text-align: center; color: #ccc; padding: 10px;"><em>Les deux combattants parent ou esquivent. Aucun dégât.</em></div>`;
                } else if (tieType === "frappe") {
                    // Dégâts minimum de 1 garantis
                    let dmgToPnj = Math.max(1, payload.pjDegatsBruts - payload.pnjProtection);
                    let dmgToPj = Math.max(1, payload.pnjDegatsBruts - payload.pjProtection);
                    
                    if (pnjActor) {
                        let newPnjHp = Math.max(0, pnjActor.system.vitalite.value - dmgToPnj);
                        if (payload.sbireOneHit && pnjActor.type === "pnj" && pnjActor.system.type_pnj === "sbire" && dmgToPnj > 0) newPnjHp = 0;
                        await pnjActor.update({"system.vitalite.value": newPnjHp});
                    }
                    if (pjActor) {
                        let newPjHp = Math.max(0, pjActor.system.vitalite.value - dmgToPj);
                        await pjActor.update({"system.vitalite.value": newPjHp});
                    }
                    
                    resultHtml = `
                    <div style="display: flex; justify-content: space-between; gap: 10px; margin-top: 10px;">
                        <div style="flex: 1; background: rgba(183,28,28,0.2); padding: 5px; border: 1px solid #b71c1c; border-radius: 3px; text-align: center;">
                            <strong style="color: #ffcccc;">${pjActor ? pjActor.name : 'PJ'} subit :</strong><br>
                            <span style="font-size: 1.2em; font-weight: bold; color: #fff;">${dmgToPj} PV</span>
                            <div style="font-size: 0.8em; color: #aaa;">(${payload.pnjDegatsBruts} Br. - ${payload.pjProtection} Pr.)</div>
                        </div>
                        <div style="flex: 1; background: rgba(183,28,28,0.2); padding: 5px; border: 1px solid #b71c1c; border-radius: 3px; text-align: center;">
                            <strong style="color: #ffcccc;">${pnjActor ? pnjActor.name : 'PNJ'} subit :</strong><br>
                            <span style="font-size: 1.2em; font-weight: bold; color: #fff;">${dmgToPnj} PV</span>
                            <div style="font-size: 0.8em; color: #aaa;">(${payload.pjDegatsBruts} Br. - ${payload.pnjProtection} Pr.)</div>
                        </div>
                    </div>`;
                }

                if (chatMessage && card) {
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(chatMessage.content, 'text/html');
                    let cardEl = doc.querySelector('.combat-tactics-card');
                    if (cardEl) {
                        cardEl.innerHTML = `<h4 style="margin: 0; color: #b0bec5; text-align: center; border-bottom: 1px solid #b0bec5;"><i class="fas fa-check-circle"></i> Égalité Résolue</h4>${resultHtml}`;
                        await chatMessage.update({ content: doc.body.innerHTML });
                    }
                }
                return;
            }

            // 2. GESTION DES SAUVEGARDES
            btn = ev.target.closest(".chat-save-btn");
            if (btn) {
                ev.preventDefault();
                const actor = game.actors.get(btn.dataset.actorId);
                if (!actor || !actor.isOwner) return ui.notifications.warn("Vous ne possédez pas ce personnage !");
                actor.rollSave(btn.dataset.stat, parseInt(btn.dataset.mod) || 0);
                return;
            }

            // 3. INVERSION DE STAT
            btn = ev.target.closest(".invert-stat-btn");
            if (btn) {
                ev.preventDefault();
                const actor = game.actors.get(btn.dataset.actorId);
                if (!actor || !actor.isOwner) return;
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-check"></i> Inversion utilisée !`;
                try {
                    const options = JSON.parse(btn.dataset.options.replace(/&quot;/g, '"'));
                    const targetToken = options.targetId ? canvas.tokens.get(options.targetId) : null;
                    await actor._executeStatRoll(btn.dataset.stat, targetToken, options.targetStatKey, options.modDifficulte, options.totalBonusAtouts, parseInt(btn.dataset.inverted));
                } catch (err) { console.error(err); }
                return;
            }

            // 4. INVERSION D'ARME (Arme fétiche, etc.)
            btn = ev.target.closest(".invert-weapon-btn");
            if (btn) {
                ev.preventDefault();
                const actor = game.actors.get(btn.dataset.actorId);
                if (!actor || !actor.isOwner) return;
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-check"></i> Inversion utilisée !`;
                try {
                    const weapon = actor.items.get(btn.dataset.weaponId);
                    const options = JSON.parse(btn.dataset.options.replace(/&quot;/g, '"'));
                    await actor._executeWeaponRoll(weapon, options, parseInt(btn.dataset.inverted));
                } catch (err) { console.error(err); }
                return;
            }

            // 5. INVERSION DE SORT
            btn = ev.target.closest(".invert-spell-btn");
            if (btn) {
                ev.preventDefault();
                const actor = game.actors.get(btn.dataset.actorId);
                if (!actor || !actor.isOwner) return;
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-check"></i> Magie Inversée !`;
                try {
                    const sort = actor.items.get(btn.dataset.spellId);
                    const options = JSON.parse(btn.dataset.options.replace(/&quot;/g, '"'));
                    await actor._executeSpellRoll(sort, options, parseInt(btn.dataset.inverted));
                } catch (err) { console.error(err); }
                return;
            }
            // 6. DEUXIÈME TIR RAPIDE (Armes à distance)
            btn = ev.target.closest(".rplus-tir-btn");
            if (btn) {
                ev.preventDefault();
                const actor = game.actors.get(btn.dataset.actorId);
                if (!actor || !actor.isOwner) return ui.notifications.warn("Vous ne possédez pas ce personnage !");
                
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-check"></i> Second tir lancé !`;
                btn.style.opacity = "0.5";

                try {
                    await actor.rollWeapon(btn.dataset.weaponId, { forcedAdv: -1 });
                } catch (err) { console.error(err); }
                return;
            }
        });
    });
});
