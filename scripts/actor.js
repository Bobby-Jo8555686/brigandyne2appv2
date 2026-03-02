export class BrigandyneActor extends Actor {
    
    // ============================================
    // 1. CALCULS AUTOMATIQUES (Dérivées)
    // ============================================
    prepareDerivedData() {
        // SÉCURITÉS ABSOLUES
        this.system = this.system || {};
        const system = this.system;
        
        system.stats = system.stats || {};
        system.vitalite = system.vitalite || { value: 0, max: 0 };
        system.sangfroid = system.sangfroid || { value: 0, max: 0 };
        system.initiative = system.initiative || { value: 0 };
        system.options = system.options || {};

        const stats = system.stats;

        // Calcul du TOTAL de base
        for (let [key, stat] of Object.entries(stats)) {
            let base = Number(stat.value) || 0;
            let prog = Number(stat.progression) || 0; 
            
            stat.total = base + (prog * 5);
            stat.isModified = (prog > 0); 
        }

        // Application des modificateurs d'Origine et d'Archétype
        for (let item of this.items) {
            if ((item.type === "origine" || item.type === "archetype") && item.system.stats) {
                for (let [key, stat] of Object.entries(stats)) {
                    let mod = Number(item.system.stats[key]) || 0;
                    if (mod !== 0) {
                        stat.total += mod;
                        stat.isModified = true;
                    }
                }
            }
            if (item.type === "carriere" && item.system.stats) {
                for (let [key, stat] of Object.entries(stats)) {
                    stat.maxProgression = Number(item.system.stats[key]) || 0;
                }
            }
        }

        // Initialisation de la protection, malus et bonus d'origine
        let totalProtection = 0;
        let totalMalusInit = 0;
        let totalMalusMou = 0;
        let originVitBonus = 0;
        let originSfBonus = 0;

        for (let item of this.items) {
            if (item.type === "armure" && item.system.equipe) {
                totalProtection += Number(item.system.protection) || 0;
                totalMalusInit += Number(item.system.malus_init) || 0;
                totalMalusMou += Number(item.system.malus_mou) || 0;
            }
            if (item.type === "origine") {
                originVitBonus += Number(item.system.bonus_vit) || 0;
                originSfBonus += Number(item.system.bonus_sf) || 0;
            }
        }
        system.protection = { value: totalProtection };

        if (system.options?.malus_armure && totalMalusMou > 0) {
            stats.mou.total -= totalMalusMou;
            stats.mou.isModified = true;
        }

        // Calcul des indices (dizaines)
        for (let [key, stat] of Object.entries(stats)) {
            stat.indice = Math.floor(stat.total / 10);
        }
        
        if (this.type === "personnage") {
            system.vitalite.max = Math.floor(stats.for.total / 5) + Math.floor(stats.end.total / 5) + stats.vol.indice + originVitBonus;
            system.sangfroid.max = Math.floor(stats.vol.total / 5) + Math.floor(stats.cns.total / 5) + stats.com.indice + originSfBonus;
        } else if (this.type === "pnj") {
            // 1. Calcul complet (comme les PJ) pour les Boss, Créatures
            let vitMax = Math.floor(stats.for.total / 5) + Math.floor(stats.end.total / 5) + stats.vol.indice;
            let sfMax = Math.floor(stats.vol.total / 5) + Math.floor(stats.cns.total / 5) + stats.com.indice;

            // 2. Règle stricte du livre pour les "PNJ mineurs" (Sbires)
            if (system.type_pnj === "sbire"|| system.type_pnj === "intermediaire") {
                // (FOR/5) + (END/10) et pas de bonus de Volonté
                vitMax = Math.floor(stats.for.total / 5) + Math.floor(stats.end.total / 10);
                
                sfMax = Math.floor(sfMax / 2); 
            }

            system.vitalite.max = vitMax;
            system.sangfroid.max = sfMax;
        }
        
        let initBase = stats.com.indice + stats.mou.indice + stats.per.indice;
        if (system.options?.malus_armure) {
            initBase -= totalMalusInit;
        }
        system.initiative = { value: initBase };
    }

    // ============================================
    // 2. JETS DE DÉS (Compétences & Oppositions)
    // ============================================
    async rollStat(statKey) {
        const stat = this.system.stats[statKey];
        let target = Array.from(game.user.targets)[0];
        
        let statOptions = "";
        for (let [k, s] of Object.entries(this.system.stats)) {
            statOptions += `<option value="${k}" ${k === statKey ? 'selected' : ''}>${s.label}</option>`;
        }

        const relevantAtouts = this.items.filter(i => i.type === "atout" && (i.system.stat_liee === statKey || i.system.stat_liee === ""));
        let atoutsHtml = "";
        if (relevantAtouts.length > 0) {
            atoutsHtml = `
            <div style="margin-bottom: 12px; background: rgba(212, 175, 55, 0.05); padding: 5px; border: 1px dashed #d4af37; border-radius: 3px;">
                <div style="font-weight: bold; color: #8b6d05; font-size: 0.85em; margin-bottom: 4px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 2px;">Spécialités & Talents :</div>
                <div style="display: flex; flex-direction: column; gap: 2px;">`;
            
            for (let a of relevantAtouts) {
                const bonus = Number(a.system.bonus) || 0;
                const effetText = a.system.effet ? ` - <span style="color: #555;">${a.system.effet}</span>` : "";
                if (bonus > 0) {
                    atoutsHtml += `
                    <label style="display: flex; align-items: baseline; gap: 4px; cursor: pointer; font-size: 0.8em; line-height: 1.2; margin: 0; font-weight: normal; color: #111;">
                        <input type="checkbox" class="atout-bonus" value="${bonus}" title="${a.system.effet}" style="margin: 0; width: 12px; height: 12px; transform: translateY(2px);"/>
                        <span><strong>${a.name} (+${bonus})</strong>${effetText}</span>
                    </label>`;
                } else {
                    atoutsHtml += `
                    <div style="padding-left: 16px; font-size: 0.8em; color: #333; line-height: 1.2; margin: 0;">
                        <strong>${a.name}</strong> (Talent)${effetText}
                    </div>`;
                }
            }
            atoutsHtml += `</div></div>`;
        }

        let dialogContent = `
        <form>
            ${target ? `
            <div class="form-group" style="margin-bottom: 15px; background: rgba(139, 0, 0, 0.05); padding: 5px; border: 1px dashed #8b0000; border-radius: 3px;">
                <label style="font-weight: bold; color: #8b0000;">Opposition face à ${target.name} :</label>
                <select id="targetStat" style="width: 100%; margin-top: 5px;">
                    ${statOptions}
                </select>
            </div>
            ` : ''}
            ${atoutsHtml} 
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="font-weight: bold; color: #111;">Difficulté :</label>
                <select id="difficulte" style="width: 100%; padding: 3px;">
                    <option value="40">+40 Triviale</option>
                    <option value="30">+30 Simple</option>
                    <option value="20">+20 Aisée</option>
                    <option value="10">+10 Faisable</option>
                    <option value="0" selected>0 Assez difficile (test sec)</option>
                    <option value="-10">-10 Difficile</option>
                    <option value="-20">-20 Ardue</option>
                    <option value="-30">-30 Complexe</option>
                    <option value="-40">-40 Infaisable</option>
                </select>
            </div>
        </form>
        `;

        new Dialog({
            title: `Test de ${stat.label}`,
            content: dialogContent,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-dice-d20"></i>',
                    label: target ? "Jet d'Opposition" : "Jet Standard",
                    callback: async (html) => {
                        const modDifficulte = parseInt(html.find('#difficulte').val()) || 0;
                        const targetStatKey = target ? html.find('#targetStat').val() : null;
                        let totalBonusAtouts = 0;
                        html.find('.atout-bonus:checked').each(function() { totalBonusAtouts += Number($(this).val()); });
                        await this._executeStatRoll(statKey, target, targetStatKey, modDifficulte, totalBonusAtouts);
                    }
                }
            },
            default: "roll"
        }).render(true);
    }

    async _executeStatRoll(statKey, target, targetStatKey, modDifficulte, totalBonusAtouts) {
        const stat = this.system.stats[statKey];
        const handicaps = this.system.handicaps || {};
        
        let scoreBase = stat.total !== undefined ? stat.total : stat.value;
        let handicapLabels = [];
        let desavantages = 0;

        if (handicaps.aveugle && (statKey === "tir" || statKey === "per")) {
            scoreBase = 0; handicapLabels.push("Aveuglé (Score = 0)");
        }
        if (handicaps.affaibli) {
            desavantages += 1; handicapLabels.push("Affaibli (-10)");
        }
        if (handicaps.aveugle && statKey === "com") {
            desavantages += 2; handicapLabels.push("Aveuglé (-20)");
        }

        let score = scoreBase + totalBonusAtouts + modDifficulte - (desavantages * 10);
        let modo = 0; let targetActor = null; let targetStatLabel = "";

        if (target && targetStatKey) {
            targetActor = target.actor;
            const targetStatScore = targetActor.system.stats[targetStatKey].total || targetActor.system.stats[targetStatKey].value;
            targetStatLabel = targetActor.system.stats[targetStatKey].label;
            modo = 50 - targetStatScore;
            score += modo;
        }

        let recapHtml = `
        <div style="font-size: 0.9em; background: rgba(0,0,0,0.4); padding: 5px; border-radius: 3px; margin-bottom: 8px; text-align: left; border: 1px solid #444;">
            <div><strong style="color:#e0e0e0;">Base (${stat.label}) :</strong> <span style="color:#fff;">${scoreBase}</span></div>
            ${totalBonusAtouts > 0 ? `<div style="color: #d4af37;"><strong>Bonus Spécialités :</strong> +${totalBonusAtouts}</div>` : ''}
            ${targetActor ? `<div><strong style="color:#e0e0e0;">MODO (${target.name} - ${targetStatLabel}) :</strong> <span style="color:#ffcccc;">${modo > 0 ? '+'+modo : modo}</span></div>` : ''}
            ${modDifficulte !== 0 ? `<div><strong style="color:#e0e0e0;">Difficulté :</strong> <span style="color:#85c1e9;">${modDifficulte > 0 ? '+'+modDifficulte : modDifficulte}</span></div>` : ''}
            ${handicapLabels.length > 0 ? `<div style="color: #ff5252; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #ff5252;"><strong>Handicaps :</strong> ${handicapLabels.join(", ")}</div>` : ''}
            <div style="border-top: 1px solid #555; margin-top: 5px; padding-top: 3px; text-align: center; font-size: 1.1em; color: #fff;">
                <strong>Seuil final : ${score}</strong>
            </div>
        </div>`;

        const roll = new Roll("1d100"); await roll.evaluate(); const result = roll.total;
        let ru = result % 10; let isCrit = (ru === 0);
        let message = "Échec"; let cssClass = "fail";

        if (result <= score) {
            if (isCrit) { message = "Réussite Critique !"; cssClass = "crit-success"; }
            else if (result <= 9 && score >= 20) { message = "Réussite Majeure !"; cssClass = "major-success"; }
            else { message = "Réussite"; cssClass = "success"; }
        } else {
            if (isCrit) { message = "Échec Critique !"; cssClass = "crit-fail"; }
            else if (result >= 91 && score < 80) { message = "Échec Majeur"; cssClass = "major-fail"; }
        }

        const content = `<div class="brigandyne2-roll"><h3 style="border-bottom: 1px solid #444; padding-bottom: 3px; margin-bottom: 5px; color: #fff;">${targetActor ? `Opposition : ${stat.label} vs ${targetStatLabel}` : `Test : ${stat.label}`}</h3>${recapHtml}<div class="dice-result"><div class="dice-total ${cssClass}">${result}</div></div><div class="roll-result ${cssClass}" style="text-align: center; font-weight: bold; margin-bottom: 5px;">${message}</div></div>`;
        ChatMessage.create({ user: game.user._id, speaker: ChatMessage.getSpeaker({ actor: this }), content: content, rolls: [roll] });
    }

    // ============================================
    // 3. JETS DE MAGIE ULTIMES
    // ============================================
    async rollSpell(itemId) {
        const sort = this.items.get(itemId);
        if (!sort) return;

        const statIncantationKey = this.system.stat_magie_defaut || "mag";
        const scoreIncantation = this.system.stats[statIncantationKey]?.total || 0;

        // 1. Calcul des Utilisations Quotidiennes
        const uses = this.getFlag("brigandyne2appv2", "magicUses") || { tour: 0, sortilege: 0, rituel: 0 };
        const typeSort = sort.system.type_sort || "sortilege"; 
        const isTour = typeSort === "tour";
        
        const magTotal = this.system.stats.mag?.total || 0;
        const magIndice = Math.floor(magTotal / 10);
        let maxUses = typeSort === "rituel" ? 1 : magIndice;
        let currentUses = uses[typeSort] || 0;
        let limitExceeded = currentUses >= maxUses;
        
        // S'il dépasse la limite, le sort va puiser dans les PV
        let extraCost = 0;
        if (limitExceeded) {
            if (isTour) extraCost = 2;
            else if (typeSort === "sortilege") extraCost = 4;
            else extraCost = 6;
        }

        // =====================================
        // GESTION DE LA CIBLE (TARGETING NATIF)
        // =====================================
        let target = Array.from(game.user.targets)[0];
        let targetHtml = "";
        let statOptions = "";
        
        if (target) {
            for (let [k, s] of Object.entries(this.system.stats)) {
                // Par défaut, on présélectionne la Volonté pour la résistance magique
                let selected = (k === 'vol') ? 'selected' : '';
                statOptions += `<option value="${k}" ${selected}>${s.label}</option>`;
            }
            targetHtml = `
                <div class="form-group" style="margin-bottom: 10px; padding: 10px; background: rgba(139, 0, 0, 0.1); border: 1px dashed #8b0000; border-radius: 5px;">
                    <label style="font-weight: bold; color: #8b0000;">Cible : ${target.name}</label>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                        <span style="font-size: 0.9em; color: #333;">Caractéristique de Résistance :</span>
                        <select id="targetResistStat" style="width: 50%;">
                            ${statOptions}
                        </select>
                    </div>
                </div>
            `;
        } else if (isTour) {
            targetHtml = `
                <div style="margin-bottom: 10px; padding: 10px; background: rgba(76, 175, 80, 0.1); border: 1px dashed #4CAF50; border-radius: 5px; text-align: center; color: #2E7D32; font-weight: bold;">
                    Aucune cible sélectionnée.<br>Ce Tour réussira automatiquement (sans jet).
                </div>
            `;
        }

        // 2. Création de la boîte de dialogue
        let dialogContent = `
            <div style="margin-bottom: 10px; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 5px; border-left: 3px solid #673ab7;">
                <p><b>Utilisations d'aujourd'hui :</b> ${currentUses} / ${maxUses} (${typeSort}s)</p>
                ${limitExceeded ? `<p style="color: darkred; font-weight: bold;">⚠️ Limite dépassée ! Ce sort va arracher ${extraCost} PV de votre énergie vitale.</p>` : `<p style="color: green;">Dans la limite autorisée.</p>`}
            </div>
            
            ${targetHtml}

            <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-weight: bold;">Difficulté du sort :</label>
                <input type="number" id="spellDiff" value="${Number(sort.system.difficulte) || 0}" style="width: 100%; text-align: center;">
            </div>
            
            <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-weight: bold;">Avantages / Désav. circonstanciels :</label>
                <input type="number" id="advC" value="0" style="width: 100%; text-align: center;">
            </div>

            <hr>
            <h4 style="text-align: center; color: #8b0000; margin-bottom: 5px; font-family: 'Georgia', serif;">🩸 Magie du Sang 🩸</h4>
            
            <div class="form-group" style="margin-bottom: 5px; display: flex; justify-content: space-between;">
                <label>Sacrifier des PV (+1% par PV) :</label>
                <input type="number" id="sacrificedPV" value="0" min="0" style="width: 50px; text-align: center;">
            </div>
            
            <div class="form-group" style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                <label>Sang d'être magique (Bonus x2) :</label>
                <input type="checkbox" id="sangMagique">
            </div>
        `;

        new Dialog({
            title: `Grimoire : ${sort.name}`,
            content: dialogContent,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-magic"></i>',
                    label: "Incanter",
                    callback: async (html) => {
                        const options = {
                            spellDiff: parseInt(html.find('#spellDiff').val()) || 0,
                            advC: parseInt(html.find('#advC').val()) || 0,
                            sacrificedPV: Math.max(0, parseInt(html.find('#sacrificedPV').val()) || 0),
                            sangMagique: html.find('#sangMagique').is(':checked'),
                            extraCost: extraCost,
                            typeSort: typeSort,
                            scoreIncantation: scoreIncantation,
                            isTour: isTour,
                            targetId: target ? target.id : null,
                            targetResistStat: target ? html.find('#targetResistStat').val() : null
                        };
                        await this._executeSpellRoll(sort, options);
                    }
                },
                cancel: { icon: '<i class="fas fa-times"></i>', label: "Annuler" }
            },
            default: "roll"
        }).render(true);
    }

    async _executeSpellRoll(sort, options) {
        // 1. Déduction des Points de Vie (Sacrifice + Dépassement de limite)
        let totalPVLoss = options.sacrificedPV + options.extraCost;
        if (totalPVLoss > 0) {
            let newPV = Math.max(0, this.system.vitalite.value - totalPVLoss);
            await this.update({"system.vitalite.value": newPV});
        }

        // 2. On incrémente le Flag d'utilisations quotidiennes
        let uses = this.getFlag("brigandyne2appv2", "magicUses") || { tour: 0, sortilege: 0, rituel: 0 };
        uses[options.typeSort] = (uses[options.typeSort] || 0) + 1;
        await this.setFlag("brigandyne2appv2", "magicUses", uses);

        // =====================================
        // CAS SPÉCIAL : TOUR SANS CIBLE
        // =====================================
        if (options.isTour && !options.targetId) {
            let messageAuto = `
                <div style="background: rgba(103, 58, 183, 0.1); padding: 10px; border: 2px solid #673ab7; border-radius: 5px;">
                    <h3 style="color: #673ab7; text-align: center; border-bottom: 1px solid #673ab7; font-family: 'Georgia', serif;">✨ ${sort.name}</h3>
                    <div style="text-align: center; font-size: 1.2em; font-weight: bold; margin: 10px 0; color: #4CAF50;">
                        ✅ Succès Automatique (Tour)
                    </div>
            `;
            if (totalPVLoss > 0) {
                messageAuto += `<p style="color: darkred; font-size: 0.9em; text-align: center;">🩸 Le mage a sacrifié ou puisé <b>${totalPVLoss} PV</b> de son corps pour alimenter ce tour !</p>`;
            }
            messageAuto += `<hr><p style="font-size: 0.9em;">${sort.system.description}</p></div>`;
            
            return ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this }),
                content: messageAuto
            });
        }

        // =====================================
        // CAS NORMAL : JET DE DÉS (Sort, Rituel ou Tour AVEC Cible)
        // =====================================
        let baseScore = options.scoreIncantation;
        let sacrificeBonus = options.sacrificedPV * (options.sangMagique ? 2 : 1);
        
        let modo = 0;
        let targetLabel = "";
        
        // Si une cible est sélectionnée, on calcule son MODO de résistance
        if (options.targetId) {
            const targetToken = canvas.tokens.get(options.targetId);
            if (targetToken && targetToken.actor) {
                const targetStatScore = targetToken.actor.system.stats[options.targetResistStat]?.total || targetToken.actor.system.stats[options.targetResistStat]?.value || 0;
                const targetStatName = targetToken.actor.system.stats[options.targetResistStat]?.label || options.targetResistStat;
                modo = 50 - targetStatScore; // Formule du MODO de Brigandyne
                targetLabel = `<br><span style="font-size: 0.85em; color: #ffcccc;">MODO de la cible (${targetStatName}) : ${modo > 0 ? '+'+modo : modo}</span>`;
            }
        }

        let finalScore = baseScore + options.spellDiff + (options.advC * 10) + sacrificeBonus + 5 + modo; 

        let roll = new Roll("1d100");
        await roll.evaluate({async: true});
        let result = roll.total;
        let ru = result % 10;
        
        let isSuccess = result <= finalScore;
        let isCrit = ru === 0 && isSuccess;
        let isFumble = ru === 0 && !isSuccess;
        let isMajSuccess = isSuccess && result <= 9;
        let isMajFail = !isSuccess && result >= 91;

        let message = `
            <div style="background: rgba(103, 58, 183, 0.1); padding: 10px; border: 2px solid #673ab7; border-radius: 5px;">
                <h3 style="color: #673ab7; text-align: center; border-bottom: 1px solid #673ab7; font-family: 'Georgia', serif;">✨ ${sort.name}</h3>
                <p><b>Chances de succès :</b> ${finalScore}% ${targetLabel}</p>
                <div style="text-align: center; font-size: 1.5em; font-weight: bold; margin: 10px 0;">
                    Jet : ${result} ${isSuccess ? "✅" : "❌"}
                </div>
        `;

        if (totalPVLoss > 0) {
            message += `<p style="color: darkred; font-size: 0.9em;">🩸 Le mage a sacrifié ou puisé <b>${totalPVLoss} PV</b> de son corps pour alimenter ce sort !</p>`;
        }

        if (isSuccess) {
            message += `<p><b>Résultat des Unités (RU) :</b> ${ru}</p>`;
            if (isCrit) message += `<p style="color: #4CAF50; font-weight: bold;">🌟 RÉUSSITE CRITIQUE ! Le joueur choisit : RU explosif OU l'effet spécial.</p>`;
            else if (isMajSuccess) message += `<p style="color: #4CAF50; font-weight: bold;">⭐ RÉUSSITE MAJEURE ! Effet Spécial : ${sort.system.r_plus || 'Aucun'}</p>`;
            else message += `<p style="font-size: 0.9em; font-style: italic;">Réussite Mineure. Le mage peut "Forcer la Magie" (1x/jour) pour obtenir l'effet majeur, mais doit tirer une complication mineure.</p>`;
            
            message += `<hr><p style="font-size: 0.9em;">${sort.system.description}</p>`;
        } else {
            if (isFumble) {
                message += `<p style="color: #b71c1c; font-weight: bold; text-align: center;">💥 ÉCHEC CRITIQUE 💥</p>
                            <p style="color: #b71c1c;">La magie se déchaîne ! Le sort échoue, le mage perd 1 PV ou 1 SF, et le MJ doit tirer une <b>Complication Majeure</b> !</p>`;
            } else if (isMajFail) {
                message += `<p style="color: #b71c1c; font-weight: bold; text-align: center;">❌ ÉCHEC MAJEUR ❌</p>
                            <p style="color: #b71c1c;">Erreur dramatique ! Le sort échoue et entraîne une <b>Complication Mineure</b>.</p>
                            <p style="font-size: 0.9em; font-style: italic;">Le mage peut "Forcer la Magie" (1x/jour) pour forcer la réussite du sort, mais la complication devient MAJEURE.</p>`;
            } else {
                message += `<p style="color: #e65100; font-weight: bold; text-align: center;">Échec Mineur</p>
                            <p>L'incantation s'étouffe. Rien ne se passe.</p>
                            <p style="font-size: 0.9em; font-style: italic;">Le mage peut "Forcer la Magie" (1x/jour) pour forcer la réussite du sort, mais doit tirer une <b>Complication Mineure</b>.</p>`;
            }
        }

        message += `</div>`;

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: message
        });
    }

    async _applyMagicCosts(pertePV, perteSF) {
        if (pertePV === 0 && perteSF === 0) return;
        let updates = {};
        if (pertePV > 0) updates["system.vitalite.value"] = Math.max(0, this.system.vitalite.value - pertePV);
        if (perteSF > 0) updates["system.sangfroid.value"] = Math.max(0, this.system.sangfroid.value - perteSF);
        await this.update(updates);
    }

// ============================================
    // 4. JETS D'ARMES
    // ============================================
    async rollWeapon(itemId) {
        const weapon = this.items.get(itemId);
        if (!weapon) return;

        const hasShield = this.items.some(i => i.type === "armure" && i.system.equipe && i.name.toLowerCase().includes("bouclier"));
        const forIndice = this.system.stats.for.indice || 0;
        
        const typeArme = weapon.system.type_arme || "melee";
        const isDistance = typeArme === "distance";
        const statKey = isDistance ? "tir" : "com";

        const relevantAtouts = this.items.filter(i => i.type === "atout" && (i.system.stat_liee === statKey || i.system.stat_liee === ""));
        let atoutsHtml = "";
        if (relevantAtouts.length > 0) {
            atoutsHtml = `
            <div style="margin-bottom: 12px; background: rgba(212, 175, 55, 0.05); padding: 5px; border: 1px dashed #d4af37; border-radius: 3px;">
                <div style="font-weight: bold; color: #8b6d05; font-size: 0.85em; margin-bottom: 4px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 2px;">Spécialités & Talents :</div>
                <div style="display: flex; flex-direction: column; gap: 2px;">`;
            
            for (let a of relevantAtouts) {
                const bonus = Number(a.system.bonus) || 0;
                const effetText = a.system.effet ? ` - <span style="color: #555;">${a.system.effet}</span>` : "";
                if (bonus > 0) {
                    atoutsHtml += `<label style="display: flex; align-items: baseline; gap: 4px; cursor: pointer; font-size: 0.8em; line-height: 1.2; margin: 0; font-weight: normal; color: #111;"><input type="checkbox" class="atout-bonus" value="${bonus}" title="${a.system.effet}" style="margin: 0; width: 12px; height: 12px; transform: translateY(2px);"/><span><strong>${a.name} (+${bonus})</strong>${effetText}</span></label>`;
                } else {
                    atoutsHtml += `<div style="padding-left: 16px; font-size: 0.8em; color: #333; line-height: 1.2; margin: 0;"><strong>${a.name}</strong> (Talent)${effetText}</div>`;
                }
            }
            atoutsHtml += `</div></div>`;
        }

        let dialogContent = `
        <form>
            ${isDistance ? `
            <div class="form-group" style="margin-bottom: 5px; background: rgba(74, 100, 145, 0.1); padding: 5px; border: 1px dashed #4a6491; border-radius: 3px;">
                <label style="font-weight: bold; color: #4a6491;">Difficulté du tir :</label>
                <select id="modTir" style="width: 100%; margin-top: 5px;">
                    <option value="0">Normal / Cible en mouvement (0)</option>
                    <option value="10">Cible grande (+2m50) ou immobile (+10)</option>
                    <option value="-10">Cible petite (-50cm), rapide, ou mauvais temps (-10)</option>
                    <option value="-20">Longue portée + Couvert partiel... (-20)</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                <label title="Prend la pire difficulté entre le tir et le MODO de MOU de la cible." style="color: #333;">Cible consciente du tir ?</label>
                <input type="checkbox" id="cibleConsciente" checked />
            </div>
            <div class="form-group" style="margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                <label title="Donne 1 Désavantage. Sur un Échec Majeur/Critique, touche l'allié !" style="color: #8b0000; font-weight: bold;">Cible dans une mêlée (Avec allié)</label>
                <input type="checkbox" id="tirMelee" />
            </div>
            <div class="form-group" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <label title="Arbalète ou arme à poudre chargée uniquement (+20)." style="color: #333;">Tir engagé au corps-à-corps</label>
                <input type="checkbox" id="tirBoutPortant" />
            </div>
            ` : `
            <div class="form-group" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; background: rgba(74, 100, 145, 0.1); padding: 5px; border: 1px dashed #4a6491; border-radius: 3px;">
                <label style="font-weight: bold; color: #4a6491;" title="Utilise la compétence TIR. Portée Courte (Moyenne pour lance).">Lancer l'arme (Test de Tir)</label>
                <input type="checkbox" id="lancerArme" />
            </div>
            `}

            <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-weight: bold; color: #111;">Posture de combat :</label>
                <select id="tactique" style="width: 100%;">
                    <option value="standard">Efficace (Standard)</option>
                    ${!isDistance ? `
                    <option value="force">En force (+${forIndice} Dégâts, 1 Désavantage)</option>
                    <option value="finesse">En finesse (Dégâts / 2, 1 Avantage)</option>
                    <option value="defensive">Sur la défensive (0 Dégâts, ${hasShield ? '3' : '2'} Avantages)</option>
                    ` : ''}
                    <option value="viser5">Viser: Armure partielle (-5 au jet, ignore armure)</option>
                    <option value="viser10">Viser: Armure complète (-10 au jet, ignore armure)</option>
                    <option value="viser15">Viser: Complète + 1 accessoire (-15 au jet, ignore armure)</option>
                    <option value="viser20">Viser: Complète + 2 accessoires (-20 au jet, ignore armure)</option>
                    <option value="multi">Attaques multiples (1 Désavantage)</option>
                </select>
            </div>
            
            ${atoutsHtml}

            <div class="form-group" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #8b0000; padding: 5px 8px; border-radius: 3px; background: rgba(139, 0, 0, 0.05);">
                <label style="font-weight: bold; color: #8b0000; font-family: 'Georgia', serif; text-transform: uppercase;">Tenter un Coup Tordu</label>
                <input type="checkbox" id="tenterChifoumi" style="width: 18px; height: 18px; cursor: pointer;">
            </div>

            <div class="form-group" style="margin-bottom: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
                <label style="font-weight: bold; color: #111;">Avantages / Désav. circonstanciels :</label>
                <input type="number" id="advCirconstances" value="0" style="width: 100%; text-align: center;">
            </div>
        </form>
        `;

        new Dialog({
            title: `Attaque avec ${weapon.name}`,
            content: dialogContent,
            buttons: {
                attaquer: {
                    icon: '<i class="fas fa-crosshairs"></i>',
                    label: "Lancer l'attaque",
                    callback: async (html) => {
                        let totalBonusAtouts = 0;
                        html.find('.atout-bonus:checked').each(function() { totalBonusAtouts += Number($(this).val()); });

                        const wantsChifoumi = html.find('#tenterChifoumi').is(':checked');
                        let chifoumiResult = "none";

                        // ==========================================
                        // LE MINI-JEU DANS UNE FENÊTRE DÉDIÉE
                        // ==========================================
                        if (wantsChifoumi) {
                            chifoumiResult = await new Promise((resolve) => {
                                let chifoumiHtml = `
                                <div style="text-align: center; margin-bottom: 10px; font-family: 'Georgia', serif;">
                                    <p style="color: #333; font-weight: bold;">Choisissez votre ruse :</p>
                                    <div style="display: flex; justify-content: space-around; align-items: center;">
                                        <label class="chifoumi-choice" style="cursor: pointer; opacity: 1; border: 2px solid #8b0000; border-radius: 5px; padding: 2px; transition: all 0.2s; background: #fff;" title="Pierre">
                                            <input type="radio" name="chifoumi" value="pierre" checked style="display: none;">
                                            <img src="systems/brigandyne2appv2/assets/ui/Pierre.webp" style="width: 70px; height: 70px; border: none; border-radius: 3px; object-fit: cover;">
                                        </label>
                                        <label class="chifoumi-choice" style="cursor: pointer; opacity: 0.4; border: 2px solid transparent; border-radius: 5px; padding: 2px; transition: all 0.2s;" title="Feuille">
                                            <input type="radio" name="chifoumi" value="feuille" style="display: none;">
                                            <img src="systems/brigandyne2appv2/assets/ui/Papier.webp" style="width: 70px; height: 70px; border: none; border-radius: 3px; object-fit: cover;">
                                        </label>
                                        <label class="chifoumi-choice" style="cursor: pointer; opacity: 0.4; border: 2px solid transparent; border-radius: 5px; padding: 2px; transition: all 0.2s;" title="Ciseaux">
                                            <input type="radio" name="chifoumi" value="ciseaux" style="display: none;">
                                            <img src="systems/brigandyne2appv2/assets/ui/Ciseaux.webp" style="width: 70px; height: 70px; border: none; border-radius: 3px; object-fit: cover;">
                                        </label>
                                    </div>
                                </div>
                                `;

                                new Dialog({
                                    title: "Coup Tordu !",
                                    content: chifoumiHtml,
                                    render: (h) => {
                                        h.find('.chifoumi-choice').click(function() {
                                            h.find('.chifoumi-choice').css({ opacity: 0.4, borderColor: "transparent", background: "transparent" });
                                            $(this).css({ opacity: 1, borderColor: "#8b0000", background: "#fff" });
                                        });
                                    },
                                    buttons: {
                                        jouer: {
                                            icon: '<i class="fas fa-fist-raised"></i>',
                                            label: "Tenter le coup !",
                                            callback: (h) => {
                                                const playerChoice = h.find('input[name="chifoumi"]:checked').val();
                                                const mjChoices = ["pierre", "feuille", "ciseaux"];
                                                const mjRoll = mjChoices[Math.floor(Math.random() * mjChoices.length)];
                                                
                                                const imgChifoumi = {
                                                    pierre: "systems/brigandyne2appv2/assets/ui/Pierre.webp",
                                                    feuille: "systems/brigandyne2appv2/assets/ui/Papier.webp",
                                                    ciseaux: "systems/brigandyne2appv2/assets/ui/Ciseaux.webp"
                                                };

                                                let finalRes = "none";
                                                let headerColor = "";
                                                let chifoumiMsg = "";

                                                if (playerChoice === mjRoll) {
                                                    finalRes = "none";
                                                    headerColor = "#b0bec5";
                                                    chifoumiMsg = `
                                                        <b style="color: #333; font-size: 1.1em; text-transform: uppercase;">Égalité !</b>
                                                        <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin: 10px 0;">
                                                            <img src="${imgChifoumi[playerChoice]}" width="45" height="45" style="border: 2px solid #333; border-radius: 5px; box-shadow: 2px 2px 5px rgba(0,0,0,0.3);">
                                                            <span style="font-weight: bold; font-size: 1.2em; color: #555;">VS</span>
                                                            <img src="${imgChifoumi[mjRoll]}" width="45" height="45" style="border: 2px solid #333; border-radius: 5px; box-shadow: 2px 2px 5px rgba(0,0,0,0.3);">
                                                        </div>
                                                        <i style="color: #333;">Aucun avantage ni désavantage.</i>`;
                                                } else if (
                                                    (playerChoice === "pierre" && mjRoll === "ciseaux") ||
                                                    (playerChoice === "feuille" && mjRoll === "pierre") ||
                                                    (playerChoice === "ciseaux" && mjRoll === "feuille")
                                                ) {
                                                    finalRes = "win";
                                                    headerColor = "#4CAF50";
                                                    chifoumiMsg = `
                                                        <b style="color: #2E7D32; font-size: 1.1em; text-transform: uppercase;">Coup Tordu réussi !</b>
                                                        <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin: 10px 0;">
                                                            <img src="${imgChifoumi[playerChoice]}" width="45" height="45" style="border: 3px solid #4CAF50; border-radius: 5px; box-shadow: 0 0 10px #4CAF50;">
                                                            <span style="font-weight: bold; font-size: 1.2em; color: #555;">VS</span>
                                                            <img src="${imgChifoumi[mjRoll]}" width="45" height="45" style="border: 2px solid #b71c1c; opacity: 0.6; border-radius: 5px; filter: grayscale(50%);">
                                                        </div>
                                                        <i style="color: #2E7D32; font-weight: bold;">Vous gagnez +1 Avantage !</i>`;
                                                } else {
                                                    finalRes = "lose";
                                                    headerColor = "#b71c1c";
                                                    chifoumiMsg = `
                                                        <b style="color: #b71c1c; font-size: 1.1em; text-transform: uppercase;">Coup Tordu raté...</b>
                                                        <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin: 10px 0;">
                                                            <img src="${imgChifoumi[playerChoice]}" width="45" height="45" style="border: 2px solid #b71c1c; opacity: 0.6; border-radius: 5px; filter: grayscale(50%);">
                                                            <span style="font-weight: bold; font-size: 1.2em; color: #555;">VS</span>
                                                            <img src="${imgChifoumi[mjRoll]}" width="45" height="45" style="border: 3px solid #4CAF50; border-radius: 5px; box-shadow: 0 0 10px #4CAF50;">
                                                        </div>
                                                        <i style="color: #b71c1c; font-weight: bold;">Le MJ vous a vu venir : 1 Désavantage...</i>`;
                                                }

                                                ChatMessage.create({
                                                    speaker: ChatMessage.getSpeaker({ actor: this }),
                                                    content: `
                                                    <div style="border: 2px solid ${headerColor}; padding: 8px; border-radius: 5px; background: rgba(0,0,0,0.05); text-align: center; font-family: 'Georgia', serif;">
                                                        ${chifoumiMsg}
                                                    </div>`
                                                });

                                                resolve(finalRes);
                                            }
                                        },
                                        annuler: {
                                            icon: '<i class="fas fa-times"></i>',
                                            label: "Annuler le coup",
                                            callback: () => resolve("none") // On fait l'attaque sans bonus/malus si le joueur se dégonfle
                                        }
                                    },
                                    default: "jouer",
                                    close: () => resolve("cancel") // Si on ferme avec la croix, on annule carrément l'attaque pour éviter les erreurs
                                }).render(true);
                            });
                        }

                        // Sécurité : si le joueur a fermé la fenêtre du chifoumi avec la croix rouge, on stoppe l'attaque
                        if (chifoumiResult === "cancel") return;

                        const options = {
                            tactique: html.find('#tactique').val(), 
                            chifoumi: chifoumiResult, 
                            advC: parseInt(html.find('#advCirconstances').val()) || 0,
                            hasShield: hasShield, 
                            forIndice: forIndice, 
                            totalBonusAtouts: totalBonusAtouts,
                            tirMelee: html.find('#tirMelee').is(':checked'), 
                            tirBoutPortant: html.find('#tirBoutPortant').is(':checked'),
                            modTir: parseInt(html.find('#modTir').val()) || 0, 
                            cibleConsciente: html.find('#cibleConsciente').is(':checked'), 
                            lancerArme: html.find('#lancerArme').is(':checked')
                        };
                        
                        // L'attaque se lance toute seule avec le bon modificateur !
                        await this._executeWeaponRoll(weapon, options);
                    }
                }
            },
            default: "attaquer"
        }).render(true);
    }

    async _executeWeaponRoll(weapon, options) {
        const { tactique, chifoumi, advC, hasShield, forIndice, totalBonusAtouts, tirMelee, tirBoutPortant, modTir, cibleConsciente, lancerArme } = options;
        const handicaps = this.system.handicaps || {};

        let finalDamageNum = Number(weapon.system.degats_fixe) || 0;
        let isSpecialDamage = false; 
        
        if (weapon.system.utilise_force) {
            finalDamageNum += (this.system.stats.for.indice || 0);
        }

        let rawDamage = weapon.system.utilise_force ? `FOR${weapon.system.degats_fixe > 0 ? '+'+weapon.system.degats_fixe : (weapon.system.degats_fixe < 0 ? weapon.system.degats_fixe : '')}` : `${weapon.system.degats_fixe}`;

        const typeArme = weapon.system.type_arme || "melee";
        const isDistance = typeArme === "distance" || lancerArme;
        let statLabel = isDistance ? "Tir" : "Combat";
        let statKey = isDistance ? "tir" : "com";
        
        let scoreBase = this.system.stats[statKey].total !== undefined ? this.system.stats[statKey].total : this.system.stats[statKey].value;
        let handicapLabels = [];

        if (handicaps.aveugle && isDistance) { scoreBase = 0; handicapLabels.push("Aveuglé"); }
        let score = scoreBase + totalBonusAtouts;
        
        let avantages = 0; let desavantages = 0; let malusVisee = 0;
        let ignoreArmor = false; let degatsBonus = 0; let degatsDiviseur = 1;
        let degatsNul = false; let tactiqueLabel = "Standard";

        if (handicaps.affaibli) { desavantages += 1; handicapLabels.push("Affaibli"); }
        if (handicaps.aveugle && !isDistance) { desavantages += 2; handicapLabels.push("Aveuglé au CàC"); }
        
        let bloqueRPlus = handicaps.affame || handicaps.demoralise;
        if (handicaps.affame) handicapLabels.push("Affamé");
        if (handicaps.demoralise) handicapLabels.push("Démoralisé");

        if (advC > 0) avantages += advC;
        if (advC < 0) desavantages += Math.abs(advC);

        if (tactique === "force") { desavantages += 1; degatsBonus = forIndice; tactiqueLabel = "En Force"; }
        else if (tactique === "finesse") { avantages += 1; degatsDiviseur = 2; tactiqueLabel = "En Finesse"; }
        else if (tactique === "defensive") { avantages += (hasShield ? 3 : 2); degatsNul = true; tactiqueLabel = "Défensive"; }
        else if (tactique === "multi") { desavantages += 1; tactiqueLabel = "Attaques multiples"; }
        else if (tactique.startsWith("viser")) {
            ignoreArmor = true; tactiqueLabel = "Viser";
            if (tactique === "viser5") malusVisee = -5;
            if (tactique === "viser10") malusVisee = -10;
            if (tactique === "viser15") malusVisee = -15;
            if (tactique === "viser20") malusVisee = -20;
        }

        if (chifoumi === "win") { avantages += 1; tactiqueLabel += " (+ Coup Tordu)"; }
        else if (chifoumi === "lose") { desavantages += 1; tactiqueLabel += " (Coup Tordu raté)"; }
        if (lancerArme) { tactiqueLabel += " (Arme lancée)"; }
        if (tirMelee) { desavantages += 1; tactiqueLabel += " (Dans la mêlée)"; }
        if (tirBoutPortant) { score += 20; tactiqueLabel += " (Bout portant chargé)"; }

        let netAdv = Math.max(-3, Math.min(3, avantages - desavantages)); 
        let bonusAvantage = netAdv * 10; 
        score += bonusAvantage + malusVisee;

        let target = Array.from(game.user.targets)[0];
        let modo = 0; let targetActor = null; let detailResistance = "";

        if (target) {
            targetActor = target.actor;
            if (isDistance) {
                const targetStat = targetActor.system.stats.mou.total || targetActor.system.stats.mou.value;
                const modoMou = 50 - targetStat;
                if (cibleConsciente) {
                    modo = Math.min(modTir, modoMou);
                    detailResistance = `Pire entre Tir (${modTir > 0 ? '+'+modTir : modTir}) et MODO Cible (${modoMou > 0 ? '+'+modoMou : modoMou})`;
                } else {
                    modo = modTir; detailResistance = `Difficulté Tir (${modTir > 0 ? '+'+modTir : modTir}) - Cible ignorante`;
                }
            } else {
                const targetStat = targetActor.system.stats.com.total || targetActor.system.stats.com.value;
                modo = 50 - targetStat; detailResistance = `MODO Combat cible`;
            }
            score += modo; 
        } else if (isDistance) {
            modo = modTir; score += modo; detailResistance = `Difficulté du Tir`;
        }

        let recapHtml = `
        <div style="font-size: 0.9em; background: rgba(0,0,0,0.4); padding: 5px; border-radius: 3px; margin-bottom: 8px; text-align: left; border: 1px solid #444;">
            <div><strong style="color:#e0e0e0;">Base (${statLabel}) :</strong> <span style="color:#fff;">${scoreBase}</span></div>
            ${totalBonusAtouts > 0 ? `<div style="color: #d4af37;"><strong>Bonus Spécialités :</strong> +${totalBonusAtouts}</div>` : ''}
            ${tirBoutPortant ? `<div style="color: #85c1e9;"><strong>Bout Portant :</strong> +20</div>` : ''}
            ${(target || isDistance) && modo !== 0 ? `<div><strong style="color:#e0e0e0;">MODO/Diff. :</strong> <span style="color:#ffcccc;">${modo > 0 ? '+'+modo : modo}</span> <small style="color:#aaa;">(${detailResistance})</small></div>` : ''}
            ${netAdv !== 0 ? `<div><strong style="color:#e0e0e0;">Avantages net (${netAdv}) :</strong> <span style="color:#85c1e9;">${bonusAvantage > 0 ? '+'+bonusAvantage : bonusAvantage}</span></div>` : ''}
            ${malusVisee !== 0 ? `<div><strong style="color:#e0e0e0;">Malus de Visée :</strong> <span style="color:#ffcccc;">${malusVisee}</span></div>` : ''}
            ${handicapLabels.length > 0 ? `<div style="color: #ff5252; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #ff5252;"><strong>Handicaps :</strong> ${handicapLabels.join(", ")}</div>` : ''}
            <div style="border-top: 1px solid #555; margin-top: 5px; padding-top: 3px; text-align: center; font-size: 1.1em; color: #fff;"><strong>Seuil final : ${score}</strong></div>
            <div style="text-align: center; font-style: italic; color: #aaa; margin-top: 4px; font-size: 0.85em;">Posture : ${tactiqueLabel}</div>
        </div>`;

        const roll = new Roll("1d100"); await roll.evaluate(); const result = roll.total;
        let ru = result % 10; let isCrit = false; if (ru === 0) { ru = 10; isCrit = true; } 
        let isSuccess = result <= score;
        let message = ""; let cssClass = ""; let damageHtml = "";

        const rollExplosion = async () => {
            let degatsExplosion = 10; let texteExplosion = "10"; let relance = 10;
            while (relance === 10) {
                let exploRoll = new Roll("1d10"); await exploRoll.evaluate();
                relance = exploRoll.total; degatsExplosion += relance; texteExplosion += ` + ${relance}`;
            }
            return { total: degatsExplosion, texte: texteExplosion };
        };

        if (isSuccess) {
            if (bloqueRPlus) {
                isCrit = false; message = "Réussite (R+ Bloqué !)"; cssClass = "success";
            } else {
                message = isCrit ? "Réussite Critique !" : (result <= 9 && score >= 20 ? "Réussite Majeure !" : "Réussite");
                cssClass = isCrit ? "crit-success" : (result <= 9 && score >= 20 ? "major-success" : "success");
            }
            
            let degatsBruts = 0; let texteJet = `${ru}`;
            
            if (isSpecialDamage) {
                damageHtml = `<div class="weapon-damage success-box" style="color:#fff;">Dégâts : <strong>${rawDamage}</strong></div>`;
            } else {
                if (isCrit) {
                    let explosion = await rollExplosion();
                    degatsBruts = explosion.total + finalDamageNum + degatsBonus; texteJet = explosion.texte;
                } else { degatsBruts = ru + finalDamageNum + degatsBonus; }
                degatsBruts = Math.floor(degatsBruts / degatsDiviseur);
                
                if (bloqueRPlus) degatsBruts = Math.max(0, degatsBruts - 1);
                if (degatsNul) degatsBruts = 0;

                if (targetActor) {
                    let protection = ignoreArmor ? 0 : (Number(targetActor.system.protection?.value) || 0);
                    let degatsFinaux = Math.max(0, degatsBruts - protection);
                    let noteSbire = "";
                    try {
                        let nouvelleVie = targetActor.system.vitalite.value - degatsFinaux;
                        if (game.settings.get("brigandyne2appv2", "sbireOneHit") && targetActor.type === "pnj" && targetActor.system.type_pnj === "sbire" && degatsFinaux > 0) {
                            nouvelleVie = 0; noteSbire = "<br><span style='color: #ffcccc; font-weight: bold;'>💥 Le sbire est vaincu sur le coup !</span>";
                        }
                        await targetActor.update({ "system.vitalite.value": Math.max(0, nouvelleVie) });
                    } catch(e) {}

                    damageHtml = `<div class="weapon-damage ${isCrit ? 'crit-box' : 'success-box'}">Dégâts infligés : <strong><span style="font-size: 1.2em; color: #fff;">${degatsFinaux}</span></strong><br><small style="color: #ccc;">(Base: ${texteJet} + Arme: ${finalDamageNum} ${degatsBonus>0?'+ Force: '+degatsBonus:''} ${degatsDiviseur>1?'/ 2':''} - Armure cible: ${protection})</small>${bloqueRPlus ? '<br><span style="color:#ffcccc; font-weight:bold;">-1 Dégât (Handicap)</span>' : ''}${noteSbire}</div>`;
                    if (degatsNul) damageHtml = `<div class="weapon-damage" style="color: #aaa;"><em>Esquive et Parade pures. Aucun dégât infligé.</em></div>`;
                } else { 
                    damageHtml = `<div class="weapon-damage ${isCrit ? 'crit-box' : 'success-box'}" style="color: #fff;">Dégâts potentiels : <strong>${degatsBruts}</strong> ${bloqueRPlus ? '<span style="color:#ffcccc; font-weight:bold;">(-1 Dégât Handicap)</span>' : ''}</div>`; 
                }
            }
        } else {
            message = isCrit ? "Échec Critique !" : (result >= 91 && score < 80 ? "Échec Majeur" : "Échec");
            cssClass = isCrit ? "crit-fail" : (result >= 91 && score < 80 ? "major-fail" : "fail");
            
            let noteAllie = "";
            if (tirMelee && (isCrit || (result >= 91 && score < 80))) {
                noteAllie = `<div style="margin-top: 8px; color: #ffcccc; font-weight: bold; font-size: 1.1em; border-top: 1px dashed #ffcccc; padding-top: 5px;">💥 Aïe ! Le tir touche un allié dans la mêlée !</div>`;
            }

            if (targetActor && typeArme === "melee" && !lancerArme) {
                let targetWeapon = targetActor.items.find(i => i.type === "arme" && i.system.type_arme !== "distance");
                let targetFinalDamageNum = 0;
                
                if (targetWeapon) {
                    targetFinalDamageNum = Number(targetWeapon.system.degats_fixe) || 0;
                    if (targetWeapon.system.utilise_force) targetFinalDamageNum += (targetActor.system.stats.for.indice || 0);
                }

                let degatsBruts = 0; let texteJet = `${ru}`;
                if (isCrit) {
                    let explosion = await rollExplosion();
                    degatsBruts = explosion.total + targetFinalDamageNum; texteJet = explosion.texte;
                } else { degatsBruts = ru + targetFinalDamageNum; }
                let protection = Number(this.system.protection?.value) || 0;
                let degatsFinaux = Math.max(0, degatsBruts - protection);
                let noteSbire = ""; let nouvelleVie = this.system.vitalite.value - degatsFinaux;
                if (game.settings.get("brigandyne2appv2", "sbireOneHit") && this.type === "pnj" && this.system.type_pnj === "sbire" && degatsFinaux > 0) {
                    nouvelleVie = 0; noteSbire = "<br><span style='color: #ffcccc; font-weight: bold;'>💥 Le sbire est fauché par la contre-attaque !</span>";
                }
                await this.update({ "system.vitalite.value": Math.max(0, nouvelleVie) });
                damageHtml = `<div class="weapon-damage counter-attack-box"><strong style="color: #ffcccc;">Contre-attaque subie !</strong><br>Dégâts reçus : <strong><span style="font-size: 1.2em; color: #fff;">${degatsFinaux}</span></strong><br><small style="color: #ccc;">(Jet adverse: ${texteJet} + Son arme: ${targetFinalDamageNum} - Ton armure: ${protection})</small>${noteSbire}</div>`;
            } else { damageHtml = `<div class="weapon-damage" style="background: rgba(0,0,0,0.5); border: 1px solid #444; color: #ccc;"><em>Attaque manquée.</em>${noteAllie}</div>`; }
        }

        const content = `<div class="brigandyne2-roll"><h3 style="border-bottom: 1px solid #444; margin-bottom: 5px; color: #fff;">Attaque : ${weapon.name}</h3>${recapHtml}<div class="dice-result"><div class="dice-total ${cssClass}">${result}</div></div><div class="roll-result ${cssClass}" style="text-align: center; font-weight: bold; margin-bottom: 5px;">${message}</div>${damageHtml}</div>`;
        ChatMessage.create({ user: game.user._id, speaker: ChatMessage.getSpeaker({ actor: this }), content: content, rolls: [roll] });
    }
}
