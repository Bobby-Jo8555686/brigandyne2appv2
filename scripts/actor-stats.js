export async function rollStat(statKey) {
        const stat = this.system.stats[statKey];
        let target = Array.from(game.user.targets)[0];
        
        let statOptions = "";
        for (let [k, s] of Object.entries(this.system.stats)) {
            statOptions += `<option value="${k}" ${k === statKey ? 'selected' : ''}>${s.label}</option>`;
        }

        const relevantAtouts = this.items.filter(i => i.type === "atout" && (i.system.stat_liee === statKey || i.system.stat_liee === ""));
        let atoutsHtml = "";
        if (relevantAtouts.length > 0) {
            atoutsHtml = `<div style="margin-bottom: 12px; background: rgba(212, 175, 55, 0.05); padding: 5px; border: 1px dashed #d4af37; border-radius: 3px;"><div style="font-weight: bold; color: #8b6d05; font-size: 0.85em; margin-bottom: 4px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 2px;">Spécialités & Talents :</div><div style="display: flex; flex-direction: column; gap: 2px;">`;
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
            ${target ? `
            <div class="form-group" style="margin-bottom: 15px; background: rgba(139, 0, 0, 0.05); padding: 5px; border: 1px dashed #8b0000; border-radius: 3px;">
                <label style="font-weight: bold; color: #8b0000;">Opposition face à ${target.name} :</label>
                <select id="targetStat" style="width: 100%; margin-top: 5px;">${statOptions}</select>
            </div>` : ''}
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
        </form>`;

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

    export async function rollSave(statKey, mod) {
        const stat = this.system.stats[statKey];
        if (!stat) return;

        const relevantAtouts = this.items.filter(i => i.type === "atout" && (i.system.stat_liee === statKey || i.system.stat_liee === ""));
        let atoutsHtml = "";
        if (relevantAtouts.length > 0) {
            atoutsHtml = `<div style="margin-bottom: 12px; background: rgba(212, 175, 55, 0.05); padding: 5px; border: 1px dashed #d4af37; border-radius: 3px;"><div style="font-weight: bold; color: #8b6d05; font-size: 0.85em; margin-bottom: 4px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 2px;">Spécialités & Talents :</div><div style="display: flex; flex-direction: column; gap: 2px;">`;
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
            <div style="margin-bottom: 15px; background: rgba(255, 152, 0, 0.1); padding: 10px; border: 1px solid #ff9800; border-radius: 5px; text-align: center;">
                <span style="color: #e65100; font-size: 1.1em;"><b>Jet de Sauvegarde</b></span><br>
                <span style="color: #333;">Modificateur imposé : <b>${mod > 0 ? '+'+mod : mod}</b></span>
            </div>
            ${atoutsHtml}
        </form>`;

        new Dialog({
            title: `Sauvegarde : ${stat.label}`,
            content: dialogContent,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-shield-alt"></i>',
                    label: "Lancer la Sauvegarde",
                    callback: async (html) => {
                        let totalBonusAtouts = 0;
                        html.find('.atout-bonus:checked').each(function() { totalBonusAtouts += Number($(this).val()); });
                        await this._executeStatRoll(statKey, null, null, mod, totalBonusAtouts);
                    }
                }
            },
            default: "roll"
        }).render(true);
    }

    export async function _executeStatRoll(statKey, target, targetStatKey, modDifficulte, totalBonusAtouts, forcedResult = null) {
        const stat = this.system.stats[statKey];
        const handicaps = this.system.handicaps || {};
        
        let scoreBase = stat.total !== undefined ? stat.total : stat.value;
        let handicapLabels = []; let desavantages = 0;

        if (handicaps.aveugle && (statKey === "tir" || statKey === "per")) { scoreBase = 0; handicapLabels.push("Aveuglé (Score = 0)"); }
        if (handicaps.affaibli) { desavantages += 1; handicapLabels.push("Affaibli (-10)"); }
        if (handicaps.aveugle && statKey === "com") { desavantages += 2; handicapLabels.push("Aveuglé (-20)"); }

        let score = scoreBase + totalBonusAtouts + modDifficulte - (desavantages * 10);
        let modo = 0; let targetActor = null; let targetStatLabel = "";

        if (target && targetStatKey) {
            targetActor = target.actor || target;
            const targetStatScore = targetActor.system.stats[targetStatKey]?.total || targetActor.system.stats[targetStatKey]?.value || 0;
            targetStatLabel = targetActor.system.stats[targetStatKey]?.label || targetStatKey;
            modo = 50 - targetStatScore;
            score += modo;
        }

        let recapHtml = `
        <div style="font-size: 0.9em; background: rgba(0,0,0,0.4); padding: 5px; border-radius: 3px; margin-bottom: 8px; text-align: left; border: 1px solid #444;">
            <div><strong style="color:#e0e0e0;">Base (${stat.label}) :</strong> <span style="color:#fff;">${scoreBase}</span></div>
            ${totalBonusAtouts > 0 ? `<div style="color: #d4af37;"><strong>Bonus Spécialités :</strong> +${totalBonusAtouts}</div>` : ''}
            ${targetActor ? `<div><strong style="color:#e0e0e0;">MODO (${targetActor.name} - ${targetStatLabel}) :</strong> <span style="color:#ffcccc;">${modo > 0 ? '+'+modo : modo}</span></div>` : ''}
            ${modDifficulte !== 0 ? `<div><strong style="color:#e0e0e0;">Difficulté :</strong> <span style="color:#85c1e9;">${modDifficulte > 0 ? '+'+modDifficulte : modDifficulte}</span></div>` : ''}
            ${handicapLabels.length > 0 ? `<div style="color: #ff5252; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #ff5252;"><strong>Handicaps :</strong> ${handicapLabels.join(", ")}</div>` : ''}
            <div style="border-top: 1px solid #555; margin-top: 5px; padding-top: 3px; text-align: center; font-size: 1.1em; color: #fff;"><strong>Seuil final : ${score}</strong></div>
        </div>`;

        let result; let roll = null;
        if (forcedResult !== null && forcedResult !== false) {
            result = forcedResult;
            roll = new Roll(`${result}`); await roll.evaluate();
        } else {
            roll = new Roll("1d100"); await roll.evaluate(); result = roll.total;
        }

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

        let content = `<div class="brigandyne2-roll">`;
        if (forcedResult !== null && forcedResult !== false) content += `<div style="background: rgba(212, 175, 55, 0.2); border: 1px dashed #d4af37; color: #d4af37; padding: 5px; text-align: center; font-weight: bold; margin-bottom: 5px; border-radius: 3px;">🪄 Jet inversé par un Talent !</div>`;
        content += `<h3 style="border-bottom: 1px solid #444; padding-bottom: 3px; margin-bottom: 5px; color: #fff;">${targetActor ? `Opposition : ${stat.label} vs ${targetStatLabel}` : `Test : ${stat.label}`}</h3>${recapHtml}<div class="dice-result"><div class="dice-total ${cssClass}">${result}</div></div><div class="roll-result ${cssClass}" style="text-align: center; font-weight: bold; margin-bottom: 5px;">${message}</div>`;

        // GÉNÉRATION DU BOUTON DOUÉ (Famille 3) - MÉTHODE IDENTIQUE AUX ARMES
        if (forcedResult === null || forcedResult === false) {
            const hasDoue = this.items.some(i => i.type === "atout" && i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("doue") && (i.system.stat_liee === statKey || i.system.stat_liee === ""));
            
            if (hasDoue) {
                let inverted = result === 100 ? 100 : (result % 10) * 10 + Math.floor(result / 10);
                if (inverted === 0) inverted = 100;
                
                // On empaquette toutes les variables dans un objet JSON sécurisé
                let statOptions = {
                    targetId: target ? target.id : null,
                    targetStatKey: targetStatKey || null,
                    modDifficulte: modDifficulte || 0,
                    totalBonusAtouts: totalBonusAtouts || 0
                };
                let safeOptions = JSON.stringify(statOptions).replace(/"/g, '&quot;');

                content += `<button class="invert-stat-btn" data-actor-id="${this.id}" data-stat="${statKey}" data-options="${safeOptions}" data-inverted="${inverted}" style="margin-top: 5px; background: #d4af37; color: #fff; border: 1px solid #8b6d05; cursor: pointer; text-shadow: 1px 1px 2px black;"><i class="fas fa-magic"></i> Inverser les dés (${result} ➡️ ${inverted})</button>`;
            }
        }
        
        content += `</div>`;
        ChatMessage.create({ user: game.user._id, speaker: ChatMessage.getSpeaker({ actor: this }), content: content, rolls: [roll] });
    }