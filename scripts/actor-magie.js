export async function rollSpell(itemId) {
        const sort = this.items.get(itemId);
        if (!sort) return;

        const statIncantationKey = this.system.stat_magie_defaut || "mag";
        const scoreIncantation = this.system.stats[statIncantationKey]?.total || 0;

        const uses = this.getFlag("brigandyne2appv2", "magicUses") || { tour: 0, sortilege: 0, rituel: 0 };
        const typeSort = sort.system.type_sort || "sortilege"; 
        const isTour = typeSort === "tour";
        
        const magTotal = this.system.stats.mag?.total || 0;
        const magIndice = Math.floor(magTotal / 10);
        const bonusSlots = this.system.magie?.bonus_slots || 0;
        
        let maxUses = typeSort === "rituel" ? 1 : (magIndice + bonusSlots);
        let currentUses = uses[typeSort] || 0;
        let limitExceeded = currentUses >= maxUses;
        
        let extraCost = 0;
        if (limitExceeded) {
            if (isTour) extraCost = 2;
            else if (typeSort === "sortilege") extraCost = 4;
            else extraCost = 6;
        }

        let target = Array.from(game.user.targets)[0];
        let targetHtml = "";
        let statOptions = "";
        
        if (target) {
            for (let [k, s] of Object.entries(this.system.stats)) {
                let selected = (k === 'vol') ? 'selected' : '';
                statOptions += `<option value="${k}" ${selected}>${s.label}</option>`;
            }
            targetHtml = `<div class="form-group" style="margin-bottom: 10px; padding: 10px; background: rgba(139, 0, 0, 0.1); border: 1px dashed #8b0000; border-radius: 5px;"><label style="font-weight: bold; color: #8b0000;">Cible : ${target.name}</label><div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;"><span style="font-size: 0.9em; color: #333;">Caractéristique de Résistance :</span><select id="targetResistStat" style="width: 50%;">${statOptions}</select></div></div>`;
        } else if (isTour) {
            targetHtml = `<div style="margin-bottom: 10px; padding: 10px; background: rgba(76, 175, 80, 0.1); border: 1px dashed #4CAF50; border-radius: 5px; text-align: center; color: #2E7D32; font-weight: bold;">Aucune cible sélectionnée.<br>Ce Tour réussira automatiquement (sans jet).</div>`;
        }

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

    export async function _executeSpellRoll(sort, options, forcedResult = null) {
        let totalPVLoss = options.sacrificedPV + options.extraCost;
        if (totalPVLoss > 0 && (forcedResult === null || forcedResult === false)) {
            let newPV = Math.max(0, this.system.vitalite.value - totalPVLoss);
            await this.update({"system.vitalite.value": newPV});
        }

        if (forcedResult === null || forcedResult === false) {
            let uses = this.getFlag("brigandyne2appv2", "magicUses") || { tour: 0, sortilege: 0, rituel: 0 };
            uses[options.typeSort] = (uses[options.typeSort] || 0) + 1;
            await this.setFlag("brigandyne2appv2", "magicUses", uses);
        }

        let isSuccess = false;
        let ru = 0;

        if (options.isTour && !options.targetId) {
            isSuccess = true;
            let messageAuto = `<div style="background: rgba(103, 58, 183, 0.1); padding: 10px; border: 2px solid #673ab7; border-radius: 5px;"><h3 style="color: #673ab7; text-align: center; border-bottom: 1px solid #673ab7; font-family: 'Georgia', serif;">✨ ${sort.name}</h3><div style="text-align: center; font-size: 1.2em; font-weight: bold; margin: 10px 0; color: #4CAF50;">✅ Succès Automatique (Tour)</div>`;
            if (totalPVLoss > 0) messageAuto += `<p style="color: darkred; font-size: 0.9em; text-align: center;">🩸 Le mage a sacrifié <b>${totalPVLoss} PV</b> !</p>`;
            messageAuto += `<hr><p style="font-size: 0.9em;">${sort.system.description}</p></div>`;
            ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: messageAuto });
        } else {
            let baseScore = options.scoreIncantation;
            let sacrificeBonus = options.sacrificedPV * (options.sangMagique ? 2 : 1);
            let modo = 0; let targetLabel = "";
            
            if (options.targetId) {
                const targetToken = canvas.tokens.get(options.targetId);
                if (targetToken && targetToken.actor) {
                    const targetStatScore = targetToken.actor.system.stats[options.targetResistStat]?.total || targetToken.actor.system.stats[options.targetResistStat]?.value || 0;
                    const targetStatName = targetToken.actor.system.stats[options.targetResistStat]?.label || options.targetResistStat;
                    modo = 50 - targetStatScore; 
                    targetLabel = `<br><span style="font-size: 0.85em; color: #ffcccc;">MODO de la cible (${targetStatName}) : ${modo > 0 ? '+'+modo : modo}</span>`;
                }
            }

            let finalScore = baseScore + options.spellDiff + (options.advC * 10) + sacrificeBonus + 5 + modo; 
            
            let result; let roll = null;
            if (forcedResult !== null && forcedResult !== false) {
                result = forcedResult; roll = new Roll(`${result}`); await roll.evaluate();
            } else {
                roll = new Roll("1d100"); await roll.evaluate(); result = roll.total;
            }

            ru = result % 10;
            if (ru === 0) ru = 10;
            isSuccess = result <= finalScore;

            // 🔥 CORRECTION 4 : Ajout de la Durée et R+ stylisé
            let dureeStr = sort.system.duree ? `<p style="font-size: 0.9em; color: #555; margin: 5px 0;"><b>⏳ Durée :</b> ${sort.system.duree}</p>` : '';

            let message = `<div style="background: rgba(103, 58, 183, 0.1); padding: 10px; border: 2px solid #673ab7; border-radius: 5px;">`;
            if (forcedResult !== null && forcedResult !== false) message += `<div style="background: rgba(212, 175, 55, 0.2); border: 1px dashed #d4af37; color: #d4af37; padding: 5px; text-align: center; font-weight: bold; margin-bottom: 5px; border-radius: 3px;">🪄 Jet inversé par un Talent !</div>`;
            
            message += `<h3 style="color: #673ab7; text-align: center; border-bottom: 1px solid #673ab7; font-family: 'Georgia', serif; margin-bottom: 5px;">✨ ${sort.name}</h3>`;
            message += `<p style="margin: 5px 0;"><b>Chances de succès :</b> ${finalScore}% ${targetLabel}</p>`;
            message += dureeStr;
            message += `<div style="text-align: center; font-size: 1.5em; font-weight: bold; margin: 10px 0;">Jet : ${result} ${isSuccess ? "✅" : "❌"}</div>`;
            
            if (totalPVLoss > 0) message += `<p style="color: darkred; font-size: 0.9em; text-align: center;">🩸 Le mage a sacrifié <b>${totalPVLoss} PV</b> !</p>`;

            if (isSuccess) {
                message += `<p style="margin: 5px 0;"><b>Résultat des Unités (RU) :</b> ${ru}</p>`;
                
                // Si la compétence a un effet R+ renseigné, on le prépare en vert vif
                let rPlusText = sort.system.r_plus ? `<div style="margin-top: 8px; padding: 6px; background: rgba(76, 175, 80, 0.15); border-left: 4px solid #4CAF50; color: #2E7D32; font-size: 0.95em;"><b>🌟 Effet R+ :</b> ${sort.system.r_plus}</div>` : '';

                if (result % 10 === 0) message += `<p style="color: #4CAF50; font-weight: bold; margin: 5px 0;">🌟 RÉUSSITE CRITIQUE !</p>${rPlusText}`;
                else if (result <= 9) message += `<p style="color: #4CAF50; font-weight: bold; margin: 5px 0;">⭐ RÉUSSITE MAJEURE !</p>${rPlusText}`;
                
                message += `<hr><p style="font-size: 0.9em; margin-top: 5px;">${sort.system.description}</p>`;
            } else {
                if (result % 10 === 0) message += `<p style="color: #b71c1c; font-weight: bold; text-align: center;">💥 ÉCHEC CRITIQUE 💥</p>`;
                else if (result >= 91) message += `<p style="color: #b71c1c; font-weight: bold; text-align: center;">❌ ÉCHEC MAJEUR ❌</p>`;
                else message += `<p style="color: #e65100; font-weight: bold; text-align: center;">Échec Mineur</p>`;
            }

            // BOUTON MAGIE CONTRÔLÉE / SORT FÉTICHE
            if (forcedResult === null || forcedResult === false) {
                const hasSortFetiche = this.items.some(i => i.type === "atout" && (i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("sort fetiche") || i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("magie controlee")));
                if (hasSortFetiche) {
                    let inverted = result === 100 ? 100 : (result % 10) * 10 + Math.floor(result / 10);
                    if (inverted === 0) inverted = 100;
                    let safeOptions = JSON.stringify(options).replace(/"/g, '&quot;');
                    message += `<button class="invert-spell-btn" data-actor-id="${this.id}" data-spell-id="${sort.id}" data-options="${safeOptions}" data-inverted="${inverted}" style="margin-top: 5px; background: #d4af37; color: #fff; border: 1px solid #8b6d05; cursor: pointer;"><i class="fas fa-magic"></i> Inverser les dés (${result} ➡️ ${inverted})</button>`;
                }
            }

            message += `</div>`;
            ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: message });
        }

        if (isSuccess && (forcedResult === null || forcedResult === false)) {
            let acts = sort.system.activities || {};
            let actKeys = Object.keys(acts);
            let finalRu = (options.isTour && !options.targetId) ? 0 : ru;

            if (actKeys.length === 1) {
                await this.useActivity(sort.id, actKeys[0], finalRu);
            } else if (actKeys.length > 1) {
                let buttons = {};
                for (let k of actKeys) {
                    buttons[k] = { icon: '<i class="fas fa-bolt"></i>', label: acts[k].nom, callback: () => this.useActivity(sort.id, k, finalRu) };
                }
                new Dialog({
                    title: `✨ Effet de ${sort.name}`,
                    content: `<p style="text-align: center; font-family: 'Georgia', serif;">Le sort est réussi ! Que voulez-vous déclencher ?</p>`,
                    buttons: buttons
                }).render(true);
            }
        }
    }