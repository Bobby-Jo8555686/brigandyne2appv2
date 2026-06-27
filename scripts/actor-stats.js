export async function rollStat(statKey) {
    const stat = this.system.stats[statKey];
    let target = Array.from(game.user.targets)[0];
    
    let statOptions = "";
    for (let [k, s] of Object.entries(this.system.stats)) {
        statOptions += `<option value="${k}" ${k === statKey ? 'selected' : ''}>${s.label}</option>`;
    }

    // --- GRILLE DES ATOUTS (SANG & ACIER - THÈME LAITON) ---
    const relevantAtouts = this.items.filter(i => i.type === "atout" && i.system.stat_liee === statKey);
    let atoutsHtml = "";
    if (relevantAtouts.length > 0) {
        atoutsHtml = `<div class="b2-section" style="border-left: 3px solid #a68a24; background: rgba(166, 138, 36, 0.05); padding-left: 5px; margin-bottom: 10px;">
            <div class="b2-section-title" style="color: #a68a24; border-bottom: 1px solid #5c4d16; margin-bottom: 8px;"><i class="fas fa-star"></i> Talents & Spécialités</div>`;
        for (let a of relevantAtouts) {
            const bonus = Number(a.system.bonus) || 0;
            let rawEffet = a.system.effet || "";
            let shortEffet = rawEffet.length > 45 ? rawEffet.substring(0, 42) + "..." : rawEffet;

            if (bonus > 0) {
                atoutsHtml += `
                <div class="b2-dialog-row">
                    <label class="b2-dialog-label" style="cursor: pointer; display: flex; flex-direction: column;">
                        <span style="font-weight: bold; color: #a68a24;">${a.name} (+${bonus})</span>
                        <span style="font-size: 0.8em; color: #777; font-style: italic; font-weight: normal;">${shortEffet}</span>
                    </label>
                    <div class="b2-dialog-controls"><input type="checkbox" class="atout-bonus" value="${bonus}" title="${rawEffet}" /></div>
                </div>`;
            } else {
                atoutsHtml += `
                <div class="b2-dialog-row" style="opacity: 0.7;">
                    <div class="b2-dialog-label" style="display: flex; flex-direction: column;">
                        <span style="font-weight: bold; color: #888;">${a.name}</span>
                        <span style="font-size: 0.8em; color: #555; font-style: italic; font-weight: normal;">${shortEffet}</span>
                    </div>
                </div>`;
            }
        }
        atoutsHtml += `</div>`;
    }

    const templateData = { target, statOptions, atoutsHtml };
    let dialogContent = await renderTemplate("systems/brigandyne2appv2/templates/dialog/stat-dialog.hbs", templateData);

    new Dialog({
        title: `Test de ${stat.label}`,
        content: dialogContent,
        render: (html) => {
        // --- NOUVEAU SCRIPT PIPS UNIFIÉ (+ et -) ---
        const updatePips = (inputId) => {
            let input = html.find(`#${inputId}`);
            let val = parseInt(input.val()) || 0;
            let pipsContainer = html.find(`.b2-pips[data-target="${inputId}"]`);
            
            pipsContainer.find('.b2-pip').each(function() {
                let pipVal = parseInt($(this).data('val'));
                $(this).removeClass('active');
                // Allume les positifs si valeur > 0
                if (val > 0 && pipVal > 0 && pipVal <= val) $(this).addClass('active');
                // Allume les négatifs si valeur < 0
                if (val < 0 && pipVal < 0 && pipVal >= val) $(this).addClass('active');
            });
        };

        html.find('.b2-pip').click(function() {
            let targetId = $(this).closest('.b2-pips').data('target');
            let input = html.find(`#${targetId}`);
            let clickedVal = parseInt($(this).data('val'));
            let currentVal = parseInt(input.val()) || 0;
            
            // Si on clique sur la case déjà active au max, ça remet à 0
            input.val(clickedVal === currentVal ? 0 : clickedVal);
            updatePips(targetId);
        });

        html.find('.b2-dialog-controls input[type="number"]').on('input change', function() { 
            updatePips($(this).attr('id')); 
        });
        
        html.find('.b2-pips').each(function() { 
            updatePips($(this).data('target')); 
        });
        // --- FIN DU SCRIPT PIPS ---
        },
        buttons: {
            roll: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: target ? "Jet d'Opposition" : "Jet Standard",
                callback: async (html) => {
                    const modDifficulte = parseInt(html.find('#modDifficulte').val()) || 0;
                    const targetStatKey = target ? html.find('#targetStat').val() : null;
                    let totalBonusAtouts = 0;
                    html.find('.atout-bonus:checked').each(function() { totalBonusAtouts += Number($(this).val()); });
                    
                    // NOUVEAU : On récupère le bonus/malus libre
                    const bonusMalusLibre = parseInt(html.find('#bonusMalusLibre').val()) || 0;
                    
                    // NOUVEAU : On le passe à la fonction d'exécution finale
                    await this._executeStatRoll(statKey, target, targetStatKey, modDifficulte, totalBonusAtouts, null, bonusMalusLibre);
                }
            }
        },
        default: "roll"
    }).render(true);
}

export async function rollSave(statKey, mod) {
    const stat = this.system.stats[statKey];
    if (!stat) return;

    const relevantAtouts = this.items.filter(i => i.type === "atout" && i.system.stat_liee === statKey);
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

    const templateData = { mod, atoutsHtml };
    let dialogContent = await renderTemplate("systems/brigandyne2appv2/templates/dialog/save-dialog.hbs", templateData);

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
                    
                    // NOUVEAU : On récupère le bonus/malus libre
                    const bonusMalusLibre = parseInt(html.find('#bonusMalusLibre').val()) || 0;
                    
                    // NOUVEAU : On le passe à la fonction
                    await this._executeStatRoll(statKey, null, null, mod, totalBonusAtouts, null, bonusMalusLibre);
                }
            }
        },
        default: "roll"
    }).render(true);
}

// NOUVEAU : La fonction accepte désormais "bonusMalusLibre" à la fin de ses paramètres
export async function _executeStatRoll(statKey, target, targetStatKey, modDifficulte, totalBonusAtouts, forcedResult = null, bonusMalusLibre = 0) {
    const stat = this.system.stats[statKey];
    const handicaps = this.system.handicaps || {};
    
    let scoreBase = stat.total !== undefined ? stat.total : stat.value;
    let handicapLabels = []; let desavantages = 0;

    if (handicaps.aveugle && (statKey === "tir" || statKey === "per")) { scoreBase = 0; handicapLabels.push("Aveuglé (Score = 0)"); }
    if (handicaps.affaibli) { desavantages += 1; handicapLabels.push("Affaibli (-10)"); }
    if (handicaps.aveugle && statKey === "com") { desavantages += 2; handicapLabels.push("Aveuglé (-20)"); }

    // NOUVEAU : Le score final intègre le bonusMalusLibre
    let score = scoreBase + totalBonusAtouts + modDifficulte + bonusMalusLibre - (desavantages * 10);
    let modo = 0; let targetActor = null; let targetStatLabel = "";

    if (target && targetStatKey) {
        targetActor = target.actor || target;
        const targetStatScore = targetActor.system.stats[targetStatKey]?.total || targetActor.system.stats[targetStatKey]?.value || 0;
        targetStatLabel = targetActor.system.stats[targetStatKey]?.label || targetStatKey;
        modo = 50 - targetStatScore;
        score += modo;
    }

    let recapHtml = `
    <style>
        .b2-recap-container { background: rgba(0,0,0,0.2); padding: 5px; border-radius: 3px; margin-bottom: 8px; text-align: center; border: 1px solid #444; cursor: help; transition: background 0.2s; }
        .b2-recap-container:hover { background: rgba(0,0,0,0.4); }
        .b2-recap-details { display: none; font-size: 0.85em; text-align: left; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #666; color: #ccc; line-height: 1.4; }
        .b2-recap-container:hover .b2-recap-details { display: block; }
    </style>
    <div class="b2-recap-container" title="Survolez pour voir les détails du calcul">
        <div style="font-size: 1.1em; color: #fff;"><strong>Seuil final : ${score}</strong> <i class="fas fa-info-circle" style="color:#888; font-size:0.8em; margin-left: 5px;"></i></div>
        <div class="b2-recap-details">
            <div><strong style="color:#e0e0e0;">Base (${stat.label}) :</strong> <span style="color:#fff;">${scoreBase}</span></div>
            ${totalBonusAtouts > 0 ? `<div style="color: #d4af37;"><strong>Bonus Spécialités :</strong> +${totalBonusAtouts}</div>` : ''}
            ${targetActor ? `<div><strong style="color:#e0e0e0;">MODO (${targetActor.name} - ${targetStatLabel}) :</strong> <span style="color:#ffcccc;">${modo > 0 ? '+'+modo : modo}</span></div>` : ''}
            ${modDifficulte !== 0 ? `<div><strong style="color:#e0e0e0;">Difficulté :</strong> <span style="color:#85c1e9;">${modDifficulte > 0 ? '+'+modDifficulte : modDifficulte}</span></div>` : ''}
            ${bonusMalusLibre !== 0 ? `<div style="color: #d4af37;"><strong>Bonus/Malus libre :</strong> ${bonusMalusLibre > 0 ? '+'+bonusMalusLibre : bonusMalusLibre}</div>` : ''}
            ${handicapLabels.length > 0 ? `<div style="color: #ff5252; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #ff5252;"><strong>Handicaps :</strong> ${handicapLabels.join(", ")}</div>` : ''}
        </div>
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
                totalBonusAtouts: totalBonusAtouts || 0,
                bonusMalusLibre: bonusMalusLibre 
            };
            let safeOptions = JSON.stringify(statOptions).replace(/"/g, '&quot;');

            content += `<button class="invert-stat-btn" data-actor-id="${this.id}" data-stat="${statKey}" data-options="${safeOptions}" data-inverted="${inverted}" style="margin-top: 5px; background: #d4af37; color: #fff; border: 1px solid #8b6d05; cursor: pointer; text-shadow: 1px 1px 2px black;"><i class="fas fa-magic"></i> Inverser les dés (${result} ➡️ ${inverted})</button>`;
        }
    }
    
    content += `</div>`;
    ChatMessage.create({ user: game.user._id, speaker: ChatMessage.getSpeaker({ actor: this }), content: content, rolls: [roll] });
}
