export async function useActivity(itemId, activityId, forcedRU = null) {
    const item = this.items.get(itemId);
    if (!item) return;
    const act = item.system.activities[activityId];
    if (!act) return;

    let ressource = act.cout?.ressource || "aucun";
    let coutVal = Number(act.cout?.valeur) || 0;
    
    if (ressource === "sf" && (this.system.sangfroid.value < coutVal)) return ui.notifications.error(`Pas assez de Sang-Froid !`);
    if (ressource === "pv" && (this.system.vitalite.value < coutVal)) return ui.notifications.error(`Pas assez de Points de Vie !`);
    if (ressource === "utilisation" && act.utilisations?.max > 0 && act.utilisations?.value >= act.utilisations?.max) return ui.notifications.error(`Plus de charges disponibles !`);

    let rawFormula = act.effet?.degats || "";
    let parsedFormula = rawFormula ? rawFormula.toLowerCase() : "";
    let requiresRU = parsedFormula.includes("ru");

    const statKeys = ["com", "cns", "dis", "end", "for", "hab", "mag", "mou", "per", "soc", "sur", "tir", "vol"];
    for (let k of statKeys) {
        if (parsedFormula.includes(`@${k}`)) {
            let indice = this.system.stats[k]?.indice || 0;
            parsedFormula = parsedFormula.replace(new RegExp(`@${k}`, "g"), indice);
        }
    }

    if (requiresRU && forcedRU === null) {
        new Dialog({
            title: `Déclenchement : ${act.nom}`,
            content: `<div style="margin-bottom:10px;"><label style="font-weight:bold;">Entrez le RU (Unité) du dé :</label><input type="number" id="ruInput" value="0" min="0" max="10" style="width:100%; text-align:center;"></div>`,
            buttons: { valider: { icon: '<i class="fas fa-bolt"></i>', label: "Exécuter", callback: async (html) => {
                let ruVal = parseInt(html.find('#ruInput').val()) || 0;
                parsedFormula = parsedFormula.replace(/ru/g, ruVal);
                await this._executeActivityFinal(item, act, parsedFormula, ressource, coutVal);
            }}}, default: "valider"
        }).render(true);
    } else {
        let ruVal = forcedRU !== null ? forcedRU : 0;
        parsedFormula = parsedFormula.replace(/ru/g, ruVal);
        await this._executeActivityFinal(item, act, parsedFormula, ressource, coutVal);
    }
}

export async function _executeActivityFinal(item, act, finalFormula, ressource, coutVal) {
    // 1. PAIEMENT DES COÛTS
    if (ressource === "sf") await this.update({"system.sangfroid.value": Math.max(0, this.system.sangfroid.value - coutVal)});
    if (ressource === "pv") await this.update({"system.vitalite.value": Math.max(0, this.system.vitalite.value - coutVal)});
    if (ressource === "utilisation" && act.utilisations?.max > 0) {
        let acts = foundry.utils.deepClone(item.system.activities);
        acts[act.id].utilisations.value += 1;
        await item.update({"system.activities": acts});
    }

    // 2. CALCUL DE LA FORMULE
    let degatsFinaux = null;
    if (finalFormula.trim() !== "") {
        try {
            let roll = new Roll(finalFormula);
            await roll.evaluate();
            degatsFinaux = roll.total;
        } catch(e) { degatsFinaux = "Erreur de formule"; }
    }

    let typeColor = act.type === "soin" ? "#4CAF50" : (act.type === "attaque" ? "#b71c1c" : "#4a6491");
    let htmlChat = `<div style="border: 2px solid ${typeColor}; border-radius: 5px; padding: 10px; background: rgba(0,0,0,0.05); font-family: 'Georgia', serif;">
        <h3 style="color: ${typeColor}; margin-top: 0; margin-bottom: 5px; border-bottom: 1px solid ${typeColor};"><i class="fas fa-bolt"></i> ${act.nom}</h3>
        <div style="font-size: 0.85em; color: #555; margin-bottom: 10px; font-style: italic;">Déclenché depuis : ${item.name}</div>`;

    if (coutVal > 0 && ressource !== "utilisation" && ressource !== "aucun") htmlChat += `<div style="color: #333; font-size: 0.9em; margin-bottom: 5px;">🩸 <b>Coût payé :</b> ${coutVal} ${ressource.toUpperCase()}</div>`;
    if (degatsFinaux !== null) htmlChat += `<div style="background: rgba(0,0,0,0.1); padding: 8px; text-align: center; border-radius: 3px; font-weight: bold; color: ${typeColor}; font-size: 1.1em; margin-bottom: 8px;">Puissance / Dégâts : ${degatsFinaux}</div>`;

    let target = Array.from(game.user.targets)[0];
    let targetActor = target ? target.actor : null;

    // 3. GESTION DE LA SAUVEGARDE 
    let effectApplies = true; 

    if (act.effet?.sauvegarde && act.effet.sauvegarde.stat) {
        let statKey = act.effet.sauvegarde.stat;
        let statNom = statKey.toUpperCase();
        let mod = Number(act.effet.sauvegarde.mod) || 0;
        let modStr = mod > 0 ? `+${mod}` : (mod === 0 ? "" : mod);
        
        if (targetActor) {
            let scoreBase = targetActor.system.stats[statKey]?.total !== undefined ? targetActor.system.stats[statKey].total : (targetActor.system.stats[statKey]?.value || 0);
            let finalScore = scoreBase + mod;
            let saveRoll = new Roll("1d100");
            await saveRoll.evaluate();
            let result = saveRoll.total;
            let isSuccess = result <= finalScore;
            
            effectApplies = !isSuccess;

            let cssColor = isSuccess ? '#4CAF50' : '#b71c1c';
            htmlChat += `
            <div style="margin-top: 10px; padding: 8px; border: 2px solid ${cssColor}; background: rgba(255,255,255,0.8); border-radius: 5px;">
                <div style="font-size: 0.85em; color: #333; text-align: center; margin-bottom: 4px;">🛡️ <b>Sauvegarde de ${targetActor.name}</b></div>
                <div style="text-align: center; font-size: 1.1em; font-weight: bold; color: ${cssColor};">Jet : ${result} (Seuil : ${finalScore})</div>
                <div style="text-align: center; margin-top: 4px; font-weight: bold;">${isSuccess ? '✅ Résisté ! (Effets annulés)' : '💥 Échec ! L\'effet s\'applique.'}</div>
            </div>`;
        } else {
            effectApplies = false; 
            htmlChat += `
            <div style="margin-top: 10px; padding: 5px; border-top: 1px dashed ${typeColor}; background: rgba(255,255,255,0.5); text-align: center;">
                <div style="font-size: 0.85em; color: #333;">🛡️ <b>Jet de Sauvegarde</b></div>
                <div style="color: ${typeColor}; font-weight: bold;">Test de ${statNom} ${modStr} requis</div>
                <div style="font-size: 0.8em; color: #b71c1c; font-style: italic;">(⚠️ Aucune cible sélectionnée : Effet annulé)</div>
            </div>`;
        }
    }

    // 4. APPLICATION SOUS CONDITION
    if (effectApplies) {
        if (act.type === "attaque" && typeof degatsFinaux === "number" && targetActor) {
            let currentPV = targetActor.system.vitalite?.value || 0;
            let newPV = Math.max(0, currentPV - degatsFinaux);
            let noteSbire = "";
            if (game.settings.get("brigandyne2appv2", "sbireOneHit") && targetActor.type === "pnj" && targetActor.system.type_pnj === "sbire" && degatsFinaux > 0) {
                newPV = 0; noteSbire = `<br><span style="color: #b71c1c; font-weight: bold;">💥 Le sbire est vaincu sur le coup !</span>`;
            }
            await targetActor.update({"system.vitalite.value": newPV});
            htmlChat += `<div style="background: rgba(183, 28, 28, 0.1); border: 1px dashed #b71c1c; padding: 5px; border-radius: 3px; color: #b71c1c; text-align: center; margin-top: 8px;">⚔️ <b>${targetActor.name}</b> perd <b>${degatsFinaux} PV</b> !${noteSbire}</div>`;
        }
        
        if (act.type === "soin" && typeof degatsFinaux === "number") {
            let healTarget = targetActor ? targetActor : this;
            let newPV = Math.min(healTarget.system.vitalite.max, (healTarget.system.vitalite.value || 0) + degatsFinaux);
            await healTarget.update({"system.vitalite.value": newPV});
            htmlChat += `<div style="color: #2E7D32; font-weight: bold; text-align: center; margin-top: 8px; background: rgba(76, 175, 80, 0.2); border-radius: 3px; padding: 5px;">💚 ${healTarget.name} récupère ${degatsFinaux} PV !</div>`;
        }

        if (act.effet?.applique_etat && targetActor) {
            let etat = act.effet.applique_etat;
            let nomEtat = etat.charAt(0).toUpperCase() + etat.slice(1);
            let effectData = { name: `État : ${nomEtat}`, img: "icons/svg/blood.svg", description: `Le personnage subit l'état : ${nomEtat}.`, statuses: [etat] };
            await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            let currentHandicaps = foundry.utils.deepClone(targetActor.system.handicaps || {});
            currentHandicaps[etat] = true;
            await targetActor.update({ "system.handicaps": currentHandicaps });
            htmlChat += `<div style="color: #b71c1c; font-weight: bold; text-align: center; margin-top: 8px;">💀 ${targetActor.name} subit l'état : ${nomEtat} !</div>`;
        }

        if (act.type === "buff" && act.effet?.buff?.stat) {
            let statKey = act.effet.buff.stat; let val = Number(act.effet.buff.valeur) || 0; let statNom = statKey.toUpperCase(); let targetActorBuff = targetActor ? targetActor : this;
            let effectData = { name: act.nom || "Buff", img: item?.img || "icons/svg/aura.svg", description: `Modifie ${statNom} de ${val > 0 ? '+'+val : val}`, statuses: [`buff_${statKey}`], changes: [{ key: `buff.${statKey}`, mode: 2, value: val }] };
            await targetActorBuff.createEmbeddedDocuments("ActiveEffect", [effectData]);
            let color = val > 0 ? "#4CAF50" : "#b71c1c";
            htmlChat += `<div style="color: ${color}; font-weight: bold; text-align: center; margin-top: 8px; background: rgba(0,0,0,0.05); border: 1px dashed ${color}; border-radius: 3px; padding: 5px;">✨ ${targetActorBuff.name} reçoit un effet : ${statNom} ${val > 0 ? '+'+val : val} !</div>`;
        }
    }

    htmlChat += `</div>`;
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor: this}), content: htmlChat });
}