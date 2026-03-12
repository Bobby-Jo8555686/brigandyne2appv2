export async function rollWeapon(itemId, extraOptions = {}) {
    const weapon = this.items.get(itemId);
    if (!weapon) return;

    const hasShield = this.items.some(i => i.type === "armure" && i.system.equipe && i.system.type_armure === "bouclier");
    const forIndice = this.system.stats.for.indice || 0;
    
    const typeArme = weapon.system.type_arme || "melee";
    const isDistance = typeArme === "distance";
    const statKey = isDistance ? "tir" : "com";
    const specs = weapon.system.specificites || {};

    const hasTalent = (n) => this.items.some(i => i.type === "atout" && i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(n));
    const hasAgile = hasTalent("agile");
    const hasBrute = hasTalent("brute");
    const forcedAdv = extraOptions.forcedAdv || 0;
    let alerteTirRapide = "";
    if (forcedAdv === -1) {
        alerteTirRapide = `<div style="color: #b71c1c; font-weight: bold; text-align: center; margin-bottom: 10px; padding: 5px; background: rgba(183, 28, 28, 0.1); border: 1px dashed #b71c1c;">🏹 TIR RAPIDE : 1 Désavantage forcé !</div>`;
    }

    let specialBoosts = [];
    if (!isDistance) {
        if (hasTalent("coup acrobatique")) specialBoosts.push({val: "mou", label: "Coup acrobatique (+MOU)"});
        if (hasTalent("coup adroit")) specialBoosts.push({val: "hab", label: "Coup adroit (+HAB)"});
        if (hasTalent("coup de maitre")) specialBoosts.push({val: "com", label: "Coup de maître (+COM)"});
        if (hasTalent("coup du predateur")) specialBoosts.push({val: "sur", label: "Coup du prédateur (+SUR)"});
        if (hasTalent("coup en traitre")) specialBoosts.push({val: "dis", label: "Coup en traître (+DIS)"});
        if (hasTalent("coup surnaturel")) specialBoosts.push({val: "mag", label: "Coup surnaturel (+MAG)"});
        if (hasTalent("provocation")) specialBoosts.push({val: "soc", label: "Provocation (+SOC)"});
    } else {
        if (hasTalent("tir du chasseur")) specialBoosts.push({val: "sur", label: "Tir du chasseur (+SUR)"});
        if (hasTalent("tir cible")) specialBoosts.push({val: "per", label: "Tir ciblé (+PER)"});
    }

    let talentsComboHtml = "";
    if ((hasAgile || hasBrute) && !isDistance) {
        talentsComboHtml += `<div class="b2-row" style="margin-bottom:4px;"><label>Remplacer Carac. :</label><select id="replaceStat" style="flex:1; margin-left:10px;"><option value="">- Combat (Standard) -</option>${hasAgile ? '<option value="mou">Mouvement (Agile)</option>' : ''}${hasBrute ? '<option value="for">Force (Brute)</option>' : ''}</select></div>`;
    }
    if (specialBoosts.length > 0) {
        talentsComboHtml += `<div class="b2-row"><label>Bonus Dégâts :</label><select id="bonusDmgStat" style="flex:1; margin-left:10px;"><option value="">- Aucun -</option>${specialBoosts.map(b => `<option value="${b.val}">${b.label}</option>`).join('')}</select></div>`;
    }

    // --- REFORMATAGE DE LA GRILLE DES ATOUTS ---
    const relevantAtouts = this.items.filter(i => i.type === "atout" && i.system.stat_liee === statKey);
    let atoutsHtml = "";
    if (relevantAtouts.length > 0) {
        atoutsHtml = `<div class="b2-section"><div class="b2-section-title"><i class="fas fa-star" style="color:#d4af37;"></i> Talents & Spécialités</div><div class="b2-grid">`;
        for (let a of relevantAtouts) {
            const bonus = Number(a.system.bonus) || 0;
            // Troncature de la description si trop longue (max 35 caractères)
            let rawEffet = a.system.effet || "";
            let shortEffet = rawEffet.length > 35 ? rawEffet.substring(0, 32) + "..." : rawEffet;

            if (bonus > 0) {
                atoutsHtml += `<label class="b2-talent"><input type="checkbox" class="atout-bonus" value="${bonus}" title="${rawEffet}"/><div style="flex:1;"><strong style="color:#111;">${a.name} (+${bonus})</strong><span class="b2-talent-desc">${shortEffet}</span></div></label>`;
            } else {
                atoutsHtml += `<div class="b2-talent" style="opacity:0.6; cursor:help;" title="${rawEffet} (Passif)"><div style="flex:1;"><strong style="color:#111;">${a.name}</strong><span class="b2-talent-desc">${shortEffet}</span></div></div>`;
            }
        }
        atoutsHtml += `</div></div>`;
    }

    // --- DÉTECTION GLOBALE DE LA CIBLE ---
    let target = Array.from(game.user.targets)[0];
    let targetArmorType = "none"; 
    let targetArmorName = "";     
    let targetReach = null;
    let targetWeaponName = "";

    if (target && target.actor) {
        let targetArmor = target.actor.items.find(i => i.type === "armure" && i.system.equipe && i.system.type_armure === "armure");
        if (targetArmor) {
            targetArmorName = targetArmor.name;
            targetArmorType = targetArmor.system.partielle ? "partielle" : "complete";
        }

        let targetWeapon = target.actor.items.find(i => i.type === "arme" && i.system.equipe && i.system.type_arme !== "distance");
        let targetHasShield = target.actor.items.some(i => i.type === "armure" && i.system.equipe && i.system.type_armure === "bouclier");
        
        const reachValues = { "AA": 7, "A": 6, "B": 5, "C": 4, "D": 3, "E": 2, "F": 1 };
        let myReachStr = weapon.system.allonge || "C";
        let myReach = reachValues[myReachStr] || 4;

        if (targetHasShield) {
            targetReach = myReach; 
            targetWeaponName = "Bouclier (Annule l'allonge)";
        } else if (targetWeapon) {
            targetReach = reachValues[targetWeapon.system.allonge || "C"] || 4;
            targetWeaponName = targetWeapon.name;
        } else {
            targetReach = 1; 
            targetWeaponName = "Mains nues";
        }
    }

    // --- AUTOMATISATION DE L'ALLONGE ---
    let allongeHtml = "";
    if (!isDistance) {
        const reachValues = { "AA": 7, "A": 6, "B": 5, "C": 4, "D": 3, "E": 2, "F": 1 };
        let myReachStr = weapon.system.allonge || "C";
        let myReach = reachValues[myReachStr] || 4;

        let allongeChecked = "";
        let allongeText = "Avantage d'Allonge (+5%)";
        if (targetReach !== null) {
            if (myReach > targetReach) {
                allongeChecked = "checked";
                allongeText = `Avantage d'Allonge (+5%) - Vous dominez : ${targetWeaponName}`;
            } else if (myReach < targetReach) {
                allongeText = `Bonus d'Allonge (+5%) - Cochez si garde brisée (${targetWeaponName})`;
            } else {
                allongeText = `Bonus d'Allonge (+5%) - Égalité avec ${targetWeaponName}`;
            }
        }
        
        allongeHtml = `
        <div class="b2-row" style="background: rgba(212, 175, 55, 0.1); padding: 4px 6px; border-radius: 3px; border-left: 3px solid #d4af37; margin-top: 6px;">
            <label title="Si votre arme est plus longue, ou si vous êtes entré dans la garde adverse." style="font-size: 0.85em; color: #8b6d05; font-weight: bold; flex:1;">${allongeText}</label>
            <input type="checkbox" id="bonusAllonge" ${allongeChecked} />
        </div>`;
    }

    // --- CONSTRUCTION DU DIALOGUE HTML ---
    let dialogContent = `
    <style>
        .b2-dialog { font-family: 'Signika', 'Palatino Linotype', serif; }
        .b2-section { border: 1px solid #ccc; border-radius: 4px; padding: 8px; margin-bottom: 10px; background: rgba(0,0,0,0.02); }
        .b2-section-title { font-weight: bold; font-size: 0.9em; text-transform: uppercase; color: #555; margin-bottom: 6px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
        .b2-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .b2-row label { font-size: 0.9em; cursor: pointer; color: #333; margin: 0; }
        .b2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .b2-talent { background: rgba(255, 255, 255, 0.7); border: 1px solid #e0e0e0; padding: 4px; border-radius: 3px; display: flex; align-items: flex-start; gap: 6px; margin: 0; box-shadow: 1px 1px 2px rgba(0,0,0,0.05); }
        .b2-talent input { margin: 0; margin-top: 2px; cursor: pointer; }
        .b2-talent-desc { font-size: 0.75em; color: #777; font-style: italic; display: block; line-height: 1.1; margin-top: 2px; }
    </style>

    ${alerteTirRapide}
    
    <form class="b2-dialog">
        
        <div class="b2-section">
            <div class="b2-section-title"><i class="fas fa-crosshairs"></i> Circonstances d'Attaque</div>
            ${isDistance ? `
            <div class="b2-row" style="margin-bottom: 6px;">
                <label>Difficulté du tir :</label>
                <select id="modTir" style="flex:1; margin-left: 10px;">
                    <option value="0">Normal (0)</option>
                    <option value="10">Cible grande / immobile (+10)</option>
                    <option value="-10">Cible petite / rapide / intempéries (-10)</option>
                    <option value="-20">Longue portée / Couvert partiel (-20)</option>
                </select>
            </div>
            <div class="b2-row"><label>Cible consciente du tir ?</label><input type="checkbox" id="cibleConsciente" checked /></div>
            <div class="b2-row"><label style="color: #b71c1c;">Cible dans une mêlée (Avec allié)</label><input type="checkbox" id="tirMelee" /></div>
            <div class="b2-row"><label>Tir engagé au corps-à-corps (+20)</label><input type="checkbox" id="tirBoutPortant" /></div>
            ` : `
            <div class="b2-row"><label style="color: #4a6491; font-weight: bold;">Lancer l'arme (Test de Tir)</label><input type="checkbox" id="lancerArme" /></div>
            <div class="b2-row"><label style="color: #b71c1c;">Cible incapable de riposter</label><input type="checkbox" id="sansRiposte" /></div>
            ${specs.point_faible ? `<div class="b2-row"><label style="color: #8b0000;">La cible est à terre (Ignore Armure)</label><input type="checkbox" id="cibleAterre" /></div>` : ''}
            ${specs.charge ? `<div class="b2-row"><label style="color: #8b0000;">Attaque en Charge (+1 Dégât)</label><input type="checkbox" id="attaqueCharge" /></div>` : ''}
            ${specs.espace ? `
                <div class="form-group" style="margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <label title="Votre arme nécessite de l'espace. Cochez si vous êtes dans un lieu étroit (1 Désavantage)." style="color: #8b0000; font-weight: bold;">Lieu étroit (Manque d'espace)</label>
                    <input type="checkbox" id="espaceExigu" />
                </div>` : ''}
            ${allongeHtml}
            `}
        </div>

        ${talentsComboHtml !== "" ? `
        <div class="b2-section" style="border-color: #4CAF50; background: rgba(76, 175, 80, 0.05);">
            <div class="b2-section-title" style="color: #2E7D32;"><i class="fas fa-bolt"></i> Capacités Actives</div>
            ${talentsComboHtml}
        </div>` : ""}

        ${atoutsHtml}

        <div class="b2-section">
            <div class="b2-section-title"><i class="fas fa-chess-knight"></i> Posture & Ruse</div>
            <div class="b2-row" style="margin-bottom: 6px;">
                <label>Posture de combat :</label>
                <select id="tactique" style="flex:1; margin-left: 10px;">
                    <option value="standard">Efficace (Standard)</option>
                    ${!isDistance ? `
                    <option value="force">En force (+${forIndice} Dégâts, 1 Désav.)</option>
                    <option value="finesse">En finesse (Dégâts / 2, 1 Avantage)</option>
                    <option value="defensive">Sur la défensive (0 Dégâts, ${hasShield ? '3' : '2'} Avantages)</option>
                    ` : ''}
                    ${targetArmorType === "partielle" ? `<option value="viser5">🎯 Viser défaut (${targetArmorName}) : -5</option>` : ''}
                    ${targetArmorType === "complete" ? `<option value="viser10">🎯 Viser défaut (${targetArmorName}) : -10</option>` : ''}
                    ${targetArmorType === "none" ? `
                    <option value="viser5">Viser: Armure partielle (-5)</option>
                    <option value="viser10">Viser: Armure complète (-10)</option>
                    ` : ''}
                    <option value="viser15">Viser: Complète + 1 acc. (-15)</option>
                    <option value="viser20">Viser: Complète + 2 acc. (-20)</option>
                    <option value="multi">Attaques multiples (1 Désav.)</option>
                </select>
            </div>
            <div class="b2-row" style="border-top: 1px dashed #ccc; padding-top: 6px;">
                <label style="color: #8b0000; font-weight: bold;">Tenter un Coup Tordu</label>
                <input type="checkbox" id="tenterChifoumi" />
            </div>
        </div>

        <div class="b2-section" style="background: rgba(74, 100, 145, 0.1); border-color: #4a6491; margin-bottom: 0;">
            <div class="b2-row" style="justify-content: center; gap: 10px;">
                <label style="font-weight: bold; color: #4a6491;">Avantages / Désav. circonstanciels :</label>
                <input type="number" id="advCirconstances" value="${forcedAdv}" style="width: 60px; text-align: center; border: 1px solid #4a6491; border-radius: 3px;">
            </div>
        </div>

    </form>`;

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

                    if (wantsChifoumi) {
                        chifoumiResult = await new Promise((resolve) => {
                            let chifoumiHtml = `<div style="text-align: center; margin-bottom: 10px; font-family: 'Georgia', serif;"><p style="color: #333; font-weight: bold;">Choisissez votre ruse :</p><div style="display: flex; justify-content: space-around; align-items: center;"><label class="chifoumi-choice" style="cursor: pointer; opacity: 1; border: 2px solid #8b0000; border-radius: 5px; padding: 2px; transition: all 0.2s; background: #fff;" title="Pierre"><input type="radio" name="chifoumi" value="pierre" checked style="display: none;"><img src="systems/brigandyne2appv2/assets/ui/Pierre.webp" style="width: 70px; height: 70px; border: none; border-radius: 3px; object-fit: cover;"></label><label class="chifoumi-choice" style="cursor: pointer; opacity: 0.4; border: 2px solid transparent; border-radius: 5px; padding: 2px; transition: all 0.2s;" title="Feuille"><input type="radio" name="chifoumi" value="feuille" style="display: none;"><img src="systems/brigandyne2appv2/assets/ui/Papier.webp" style="width: 70px; height: 70px; border: none; border-radius: 3px; object-fit: cover;"></label><label class="chifoumi-choice" style="cursor: pointer; opacity: 0.4; border: 2px solid transparent; border-radius: 5px; padding: 2px; transition: all 0.2s;" title="Ciseaux"><input type="radio" name="chifoumi" value="ciseaux" style="display: none;"><img src="systems/brigandyne2appv2/assets/ui/Ciseaux.webp" style="width: 70px; height: 70px; border: none; border-radius: 3px; object-fit: cover;"></label></div></div>`;
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
                                            const imgChifoumi = { pierre: "systems/brigandyne2appv2/assets/ui/Pierre.webp", feuille: "systems/brigandyne2appv2/assets/ui/Papier.webp", ciseaux: "systems/brigandyne2appv2/assets/ui/Ciseaux.webp" };
                                            let finalRes = "none"; let headerColor = ""; let chifoumiMsg = "";
                                            if (playerChoice === mjRoll) {
                                                finalRes = "none"; headerColor = "#b0bec5"; chifoumiMsg = `<b style="color: #333; font-size: 1.1em; text-transform: uppercase;">Égalité !</b><div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin: 10px 0;"><img src="${imgChifoumi[playerChoice]}" width="45" height="45" style="border: 2px solid #333; border-radius: 5px; box-shadow: 2px 2px 5px rgba(0,0,0,0.3);"><span style="font-weight: bold; font-size: 1.2em; color: #555;">VS</span><img src="${imgChifoumi[mjRoll]}" width="45" height="45" style="border: 2px solid #333; border-radius: 5px; box-shadow: 2px 2px 5px rgba(0,0,0,0.3);"></div><i style="color: #333;">Aucun avantage ni désavantage.</i>`;
                                            } else if ((playerChoice === "pierre" && mjRoll === "ciseaux") || (playerChoice === "feuille" && mjRoll === "pierre") || (playerChoice === "ciseaux" && mjRoll === "feuille")) {
                                                finalRes = "win"; headerColor = "#4CAF50"; chifoumiMsg = `<b style="color: #2E7D32; font-size: 1.1em; text-transform: uppercase;">Coup Tordu réussi !</b><div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin: 10px 0;"><img src="${imgChifoumi[playerChoice]}" width="45" height="45" style="border: 3px solid #4CAF50; border-radius: 5px; box-shadow: 0 0 10px #4CAF50;"><span style="font-weight: bold; font-size: 1.2em; color: #555;">VS</span><img src="${imgChifoumi[mjRoll]}" width="45" height="45" style="border: 2px solid #b71c1c; opacity: 0.6; border-radius: 5px; filter: grayscale(50%);"></div><i style="color: #2E7D32; font-weight: bold;">Vous gagnez +1 Avantage !</i>`;
                                            } else {
                                                finalRes = "lose"; headerColor = "#b71c1c"; chifoumiMsg = `<b style="color: #b71c1c; font-size: 1.1em; text-transform: uppercase;">Coup Tordu raté...</b><div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin: 10px 0;"><img src="${imgChifoumi[playerChoice]}" width="45" height="45" style="border: 2px solid #b71c1c; opacity: 0.6; border-radius: 5px; filter: grayscale(50%);"><span style="font-weight: bold; font-size: 1.2em; color: #555;">VS</span><img src="${imgChifoumi[mjRoll]}" width="45" height="45" style="border: 3px solid #4CAF50; border-radius: 5px; box-shadow: 0 0 10px #4CAF50;"></div><i style="color: #b71c1c; font-weight: bold;">Le MJ vous a vu venir : 1 Désavantage...</i>`;
                                            }
                                            ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: `<div style="border: 2px solid ${headerColor}; padding: 8px; border-radius: 5px; background: rgba(0,0,0,0.05); text-align: center; font-family: 'Georgia', serif;">${chifoumiMsg}</div>` });
                                            resolve(finalRes);
                                        }
                                    },
                                    annuler: { icon: '<i class="fas fa-times"></i>', label: "Annuler le coup", callback: () => resolve("none") }
                                },
                                default: "jouer", close: () => resolve("cancel")
                            }).render(true);
                        });
                    }

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
                        lancerArme: html.find('#lancerArme').is(':checked'),
                        sansRiposte: html.find('#sansRiposte').is(':checked'),
                        replaceStat: html.find('#replaceStat').val(),
                        bonusDmgStat: html.find('#bonusDmgStat').val(),
                        bonusAllonge: html.find('#bonusAllonge').is(':checked'),
                        attaqueCharge: html.find('#attaqueCharge').is(':checked'),
                        cibleAterre: html.find('#cibleAterre').is(':checked'),
                        espaceExigu: html.find('#espaceExigu').is(':checked')
                    };
                    
                    await this._executeWeaponRoll(weapon, options);
                }
            }
        },
        default: "attaquer"
    }).render(true);
}

export async function _executeWeaponRoll(weapon, options, forcedResult = null) {
    const { tactique, chifoumi, advC, hasShield, forIndice, totalBonusAtouts, tirMelee, tirBoutPortant, modTir, cibleConsciente, lancerArme, sansRiposte, replaceStat, bonusDmgStat, bonusAllonge, attaqueCharge, cibleAterre, espaceExigu } = options;
    const handicaps = this.system.handicaps || {};
    const hasTalent = (n) => this.items.some(i => i.type === "atout" && i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(n));
    const specs = weapon.system.specificites || {};

    let finalDamageNum = Number(weapon.system.degats_fixe) || 0;
    let isSpecialDamage = false; 
    if (weapon.system.utilise_force) finalDamageNum += (this.system.stats.for.indice || 0);
    let rawDamage = weapon.system.utilise_force ? `FOR${weapon.system.degats_fixe > 0 ? '+'+weapon.system.degats_fixe : (weapon.system.degats_fixe < 0 ? weapon.system.degats_fixe : '')}` : `${weapon.system.degats_fixe}`;

    const typeArme = weapon.system.type_arme || "melee";
    const isDistance = typeArme === "distance" || lancerArme;
    let statLabel = isDistance ? "Tir" : "Combat";
    let statKey = isDistance ? "tir" : "com";
    
    if (replaceStat === "mou") { statKey = "mou"; statLabel = "Mouvement (Agile)"; }
    else if (replaceStat === "for") { statKey = "for"; statLabel = "Force (Brute)"; }

    let scoreBase = this.system.stats[statKey].total !== undefined ? this.system.stats[statKey].total : this.system.stats[statKey].value;
    let handicapLabels = [];

    if (handicaps.aveugle && isDistance) { scoreBase = 0; handicapLabels.push("Aveuglé"); }
    let score = scoreBase + totalBonusAtouts;
    
    // SPÉCIFICITÉS DISTANCE : PRÉCISION
    if (isDistance) {
        if (specs.maniable) { 
            score += 10; 
            handicapLabels.push("Maniable (+10)"); 
        }
        if (specs.peu_precise) { 
            score -= 10; 
            handicapLabels.push("Peu précise (-10)"); 
        }
    }

    if (bonusAllonge && !isDistance) { score += 5; handicapLabels.push("+5% (Allonge)"); }

    let avantages = 0; let desavantages = 0; let malusVisee = 0;
    let ignoreArmor = false; let degatsBonus = 0; let degatsDiviseur = 1;
    let degatsNul = false; let tactiqueLabel = "Standard";

    if (attaqueCharge && specs.charge) { degatsBonus += 1; tactiqueLabel = "Charge (+1 Dégât)"; }
    if (cibleAterre && specs.point_faible) { ignoreArmor = true; }

    if (handicaps.affaibli) { desavantages += 1; handicapLabels.push("Affaibli"); }
    if (handicaps.aveugle && !isDistance) { desavantages += 2; handicapLabels.push("Aveuglé au CàC"); }
    let bloqueRPlus = handicaps.affame || handicaps.demoralise;
    if (handicaps.affame) handicapLabels.push("Affamé");
    if (handicaps.demoralise) handicapLabels.push("Démoralisé");
    if (specs.espace && espaceExigu) { desavantages += 1; handicapLabels.push("Espace exigu (-1 Avantage)"); }

    if (advC > 0) avantages += advC;
    if (advC < 0) desavantages += Math.abs(advC);
    if (tactique === "force") { desavantages += 1; degatsBonus += forIndice; tactiqueLabel = "En Force"; }
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

    let talentDmgBonus = 0;
    if (!isDistance && hasTalent("coups puissants")) talentDmgBonus += 1;
    if (isDistance && hasTalent("tireur delite")) talentDmgBonus += 1;
    if (hasTalent("sauvagerie") && this.system.vitalite.value <= (this.system.vitalite.max / 2)) talentDmgBonus += 1;
    if (bonusDmgStat) talentDmgBonus += (this.system.stats[bonusDmgStat]?.indice || 0);
    degatsBonus += talentDmgBonus;

    if (chifoumi === "win") { avantages += 1; tactiqueLabel += " (+ Coup Tordu)"; }
    else if (chifoumi === "lose") { desavantages += 1; tactiqueLabel += " (Coup Tordu raté)"; }
    if (lancerArme) { tactiqueLabel += " (Arme lancée)"; }
    if (tirMelee) { desavantages += 1; tactiqueLabel += " (Dans la mêlée)"; }
    if (tirBoutPortant) { score += 20; tactiqueLabel += " (Bout portant chargé)"; }

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
            
            for (let i of targetActor.items) {
                if (i.type === "armure" && i.system.equipe) {
                    let couvert = Number(i.system.couvert_tirs) || 0;
                    if (couvert === 1) { desavantages += 1; handicapLabels.push("Cible derrière Bouclier (1 Désav.)"); }
                    if (couvert === 2) { desavantages += 2; handicapLabels.push("Cible derrière Pavois (2 Désav.)"); }
                }
            }
        } else {
            const targetStat = targetActor.system.stats.com.total || targetActor.system.stats.com.value;
            modo = 50 - targetStat; detailResistance = `MODO Combat cible`;
        }
        score += modo; 
    } else if (isDistance) {
        modo = modTir; score += modo; detailResistance = `Difficulté du Tir`;
    }

    let netAdv = Math.max(-3, Math.min(3, avantages - desavantages)); 
    let bonusAvantage = netAdv * 10; score += bonusAvantage + malusVisee;

    let result; let roll = null;
    if (forcedResult !== null && forcedResult !== false) {
        result = forcedResult; roll = new Roll(`${result}`); await roll.evaluate();
    } else {
        roll = new Roll("1d100"); await roll.evaluate(); result = roll.total;
    }

    let ru = result % 10; let isCrit = false; if (ru === 0) { ru = 10; isCrit = true; } 
    let isSuccess = result <= score;
    let message = ""; let cssClass = ""; let damageHtml = "";
    
    // GESTION DES DOUBLÉS (Fragile / Risquée) appliqués immédiatement à l'attaquant
    let isDouble = (result % 11 === 0 || result === 100);
    let alertHtml = "";
    if (isDouble && specs.fragile) {
        alertHtml += `<div style="color: #fff; text-shadow: 1px 1px 2px black; font-weight: bold; background: rgba(183, 28, 28, 0.8); padding: 5px; margin-top: 5px; border-radius: 3px; text-align: center;">💥 ARME FRAGILE : Elle se brise en mille morceaux !</div>`;
    }
    if (isDouble && specs.risquee) {
        let dmgRisque = this.system.stats.for.indice || 0;
        let currentVit = this.system.vitalite.value;
        this.update({"system.vitalite.value": Math.max(0, currentVit - dmgRisque)});
        alertHtml += `<div style="color: #fff; text-shadow: 1px 1px 2px black; font-weight: bold; background: rgba(183, 28, 28, 0.8); padding: 5px; margin-top: 5px; border-radius: 3px; text-align: center;">🩸 ARME RISQUÉE : Vous vous blessez et perdez ${dmgRisque} PV !</div>`;
    }

    // FONCTION D'EXPLOSION (Pour les R+)
    const rollExplosion = async () => {
        let degatsExplosion = 10; let texteExplosion = "10"; let relance = 10;
        while (relance === 10) { let exploRoll = new Roll("1d10"); await exploRoll.evaluate(); relance = exploRoll.total; degatsExplosion += relance; texteExplosion += ` + ${relance}`; }
        return { total: degatsExplosion, texte: texteExplosion };
    };

    // ==========================================
    // LOGIQUE DE RÉSOLUTION TACTIQUE (Nouveau Flux)
    // ==========================================
    let hasCombatWinner = false;
    let winner = null;
    let loser = null;
    let combatIsRPlus = false;
    let combatDegatsBruts = 0;
    let combatTexteJet = "";
    let combatProtection = 0;
    let armorPiercingNote = "";
    let winnerSpecs = {};

    if (isSuccess) {
        // L'ATTAQUANT GAGNE LA PASSE
        hasCombatWinner = true;
        winner = this;
        loser = targetActor;
        winnerSpecs = specs;
        
        if (bloqueRPlus) { isCrit = false; message = "Réussite (R+ Bloqué !)"; cssClass = "success"; } 
        else { 
            combatIsRPlus = isCrit || (result <= 9 && score >= 20);
            message = isCrit ? "Réussite Critique !" : (combatIsRPlus ? "Réussite Majeure !" : "Réussite"); 
            cssClass = isCrit ? "crit-success" : (combatIsRPlus ? "major-success" : "success"); 
        }

        if (isCrit) { let explosion = await rollExplosion(); combatDegatsBruts = explosion.total + finalDamageNum + degatsBonus; combatTexteJet = explosion.texte; } 
        else { combatDegatsBruts = ru + finalDamageNum + degatsBonus; combatTexteJet = `${ru}`; }
        
        combatDegatsBruts = Math.floor(combatDegatsBruts / degatsDiviseur);
        if (bloqueRPlus) combatDegatsBruts = Math.max(0, combatDegatsBruts - 1);
        if (degatsNul) combatDegatsBruts = 0;

        if (loser) {
            combatProtection = ignoreArmor ? 0 : (Number(loser.system.protection?.value) || 0);
            if (!ignoreArmor) {
                let ignoredProt = 0;
                for (let i of loser.items) {
                    if (i.type === "armure" && i.system.equipe) {
                        if (winnerSpecs.ignore_armures_souples && i.system.souple) { ignoredProt += (Number(i.system.protection) || 0); armorPiercingNote = " (Ignore armure souple)"; }
                        if (winnerSpecs.ignore_boucliers && i.system.type_armure === "bouclier") { ignoredProt += (Number(i.system.protection) || 0); armorPiercingNote = " (Ignore bouclier)"; }
                    }
                }
                combatProtection = Math.max(0, combatProtection - ignoredProt);
                if (winnerSpecs.armure_div_2) { combatProtection = Math.floor(combatProtection / 2); armorPiercingNote = " (Armure / 2)"; }
                if (!isDistance && hasTalent("coups precis")) { combatProtection = Math.floor(combatProtection / 2); armorPiercingNote = " (Coups précis)"; }
                if (isDistance && hasTalent("tir precis")) { combatProtection = Math.floor(combatProtection / 2); armorPiercingNote = " (Tir précis)"; }
            }
        }

        // Effets Narratifs Passifs
        // ==========================================
        // EFFETS NARRATIFS ET MÉCANIQUES (SPÉCIFICITÉS MÊLÉE/DISTANCE)
        // ==========================================
        if (winnerSpecs.destruction) alertHtml += `<div style="color: #d4af37; font-weight: bold; margin-top: 5px; text-align: center;">🛡️ DESTRUCTION : L'armure ennemie perd 1 point de Protection !</div>`;
        if (winnerSpecs.degats_temporaires) alertHtml += `<div style="color: #d4af37; font-weight: bold; margin-top: 5px; text-align: center;">⏳ TEMPORAIRE : Ces blessures disparaîtront dans 1 heure.</div>`;
        if (winnerSpecs.anti_cavalier) alertHtml += `<div style="color: #b71c1c; font-weight: bold; margin-top: 5px; text-align: center;">🐎 ANTI-CAVALIER : Si la cible est montée, elle est désarçonnée (Dégâts = Chute) !</div>`;
        if (winnerSpecs.poison) alertHtml += `<div style="color: #2E7D32; font-weight: bold; margin-top: 5px; text-align: center;">🐍 EMPOISONNEMENT : 1 seule dose requise. La cible doit tester sa résistance !</div>`;
        if (winnerSpecs.saisie) alertHtml += `<div style="color: #d4af37; font-weight: bold; margin-top: 5px; text-align: center;">🤼 SAISIE : Vous pouvez choisir d'agripper la cible (Test FOR/FOR) !</div>`;
        if (winnerSpecs.choc) alertHtml += `<div style="color: #d4af37; font-weight: bold; margin-top: 5px; text-align: center;">💫 CHOC : Si vous appliquez l'effet 'Choc', le test END de la cible se fera avec 1 Désavantage.</div>`;
        
        // Effets conditionnés par une Réussite Majeure (R+)
        if (combatIsRPlus) {
            if (winnerSpecs.brise_lames) {
                alertHtml += `<div style="color: #85c1e9; font-weight: bold; margin-top: 5px; border: 1px dashed #85c1e9; padding: 3px; text-align: center;">⚔️ BRISE-LAMES (R+) : L'arme ennemie est coincée ! Il doit la lâcher ou réussir un test de FOR à 0 pour la dégager.</div>`;
            }
            if (winnerSpecs.immobilisation) {
                alertHtml += `<div style="color: #8e44ad; font-weight: bold; margin-top: 5px; border: 1px dashed #8e44ad; padding: 3px; text-align: center;">🕸️ IMMOBILISATION (R+) : La cible est bloquée ! L'attaque n'inflige aucun dégât.</div>`;
                combatDegatsBruts = 0; // Mécanique : l'arme inflige 0 dégât sur cette action spécifique
            }
        }
        // SPÉCIFICITÉS DISTANCE : RECHARGEMENT ET CHOC
        if (isDistance) {
            if (specs.lente_2) alertHtml += `<div style="color: #e65100; font-weight: bold; margin-top: 5px; text-align: center;">⌛ LENTE : 2 tours complets requis pour recharger.</div>`;
            if (specs.lente_5) alertHtml += `<div style="color: #b71c1c; font-weight: bold; margin-top: 5px; text-align: center;">⌛⌛ TRÈS LENTE : 5 tours complets requis pour recharger.</div>`;
            if (specs.assommante) alertHtml += `<div style="color: #d4af37; font-weight: bold; margin-top: 5px; text-align: center;">💫 ASSOMMANTE : Si l'effet Choc est appliqué, le test END se fait avec 1 Désavantage.</div>`;
            
            // Le bouton pour le 2ème tir (sur R+)
            if (combatIsRPlus && specs.rplus_2e_tir) {
                alertHtml += `
                <div style="margin-top: 10px; border: 1px solid #4a6491; padding: 5px; background: rgba(74, 100, 145, 0.1); border-radius: 3px; text-align: center;">
                    <p style="margin: 0 0 5px 0; font-weight: bold; color: #4a6491;">🏹 TIR RAPIDE (R+)</p>
                    <button class="rplus-tir-btn" data-actor-id="${this.id}" data-weapon-id="${weapon.id}" style="background: #4a6491; color: #fff; border: none; padding: 3px 10px; cursor: pointer; border-radius: 3px; font-weight: bold;">
                        <i class="fas fa-redo"></i> Effectuer le 2ème tir (1 Désav.)
                    </button>
                </div>`;
            }
        }
    } else {
        // L'ATTAQUANT RATE
        let isMajorFail = result >= 91 && score < 80;
        // SPÉCIFICITÉ DISTANCE : POUDRE INSTABLE
        if (isDistance && specs.poudre) {
            if (isCrit) {
                let exploPoudre = await new Roll("1d10").evaluate();
                let dmgPoudre = exploPoudre.total;
                await this.update({"system.vitalite.value": Math.max(0, this.system.vitalite.value - dmgPoudre)});
                alertHtml += `<div style="color: #fff; background: #b71c1c; padding: 5px; text-align: center; margin-top: 5px; border-radius: 3px;">💥 POUDRE INSTABLE : L'arme explose ! Vous subissez ${dmgPoudre} dégâts.</div>`;
            } else if (isMajorFail) {
                alertHtml += `<div style="color: #fff; background: #e65100; padding: 5px; text-align: center; margin-top: 5px; border-radius: 3px;">⚙️ POUDRE INSTABLE : L'arme se bloque ou devient inutilisable !</div>`;
            }
        }
        message = isCrit ? "Échec Critique !" : (isMajorFail ? "Échec Majeur" : "Échec");
        cssClass = isCrit ? "crit-fail" : (isMajorFail ? "major-fail" : "fail");
        if (tirMelee && (isCrit || isMajorFail)) alertHtml += `<div style="margin-top: 8px; color: #ffcccc; font-weight: bold; font-size: 1.1em; border-top: 1px dashed #ffcccc; padding-top: 5px;">💥 Aïe ! Le tir touche un allié dans la mêlée !</div>`;

        // LE DÉFENSEUR GAGNE LA PASSE (Si Mêlée & Pas sans riposte)
        if (targetActor && typeArme === "melee" && !lancerArme && !sansRiposte) {
            hasCombatWinner = true;
            winner = targetActor;
            loser = this;
            
            // Si l'attaquant a fait un échec critique ou majeur, c'est un R+ pour le défenseur !
            combatIsRPlus = isCrit || isMajorFail;
            
            let targetWeapon = winner.items.find(i => i.type === "arme" && i.system.equipe && i.system.type_arme !== "distance");
            let targetFinalDamageNum = 0;
            if (targetWeapon) { 
                targetFinalDamageNum = Number(targetWeapon.system.degats_fixe) || 0; 
                if (targetWeapon.system.utilise_force) targetFinalDamageNum += (winner.system.stats?.for?.indice || 0); 
                winnerSpecs = targetWeapon.system.specificites || {};
            }
            
            if (combatIsRPlus) { let explosion = await rollExplosion(); combatDegatsBruts = explosion.total + targetFinalDamageNum; combatTexteJet = explosion.texte; } 
            else { combatDegatsBruts = ru + targetFinalDamageNum; combatTexteJet = `${ru}`; }
            
            combatProtection = Number(loser.system.protection?.value) || 0;
            let ignoredProt = 0;
            for (let i of loser.items) {
                if (i.type === "armure" && i.system.equipe) {
                    if (winnerSpecs.ignore_armures_souples && i.system.souple) ignoredProt += (Number(i.system.protection) || 0);
                    if (winnerSpecs.ignore_boucliers && i.system.type_armure === "bouclier") ignoredProt += (Number(i.system.protection) || 0);
                }
            }
            combatProtection = Math.max(0, combatProtection - ignoredProt);
            if (winnerSpecs.armure_div_2) { combatProtection = Math.floor(combatProtection / 2); }
        }
    }

    // ==========================================
    // CRÉATION DE LA CARTE DE CHAT (DÉTAIL AU SURVOL)
    // ==========================================
    let recapHtml = `
    <style>
        .brigandyne2-roll .b2-recap-container { background: rgba(0,0,0,0.2); padding: 5px; border-radius: 3px; margin-bottom: 8px; text-align: center; border: 1px solid #444; cursor: help; }
        .brigandyne2-roll .b2-recap-details { display: none; font-size: 0.85em; text-align: left; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #666; color: #ccc; line-height: 1.4; }
        .brigandyne2-roll .b2-recap-container:hover .b2-recap-details { display: block !important; }
        .brigandyne2-roll .b2-recap-line { display: flex; justify-content: space-between; margin-bottom: 2px; }
    </style>
    <div class="b2-recap-container">
        <div style="font-size: 1.1em; color: #fff;"><strong>Seuil final : ${score}</strong></div>
        <div style="font-style: italic; color: #aaa; font-size: 0.85em;">Posture : ${tactiqueLabel}</div>
        
        <div class="b2-recap-details">
            <div class="b2-recap-line"><strong style="color:#e0e0e0;">Base (${statLabel}) :</strong> <span>${scoreBase}</span></div>
            ${totalBonusAtouts > 0 ? `<div class="b2-recap-line" style="color: #d4af37;"><strong>Bonus Spécialités :</strong> <span>+${totalBonusAtouts}</span></div>` : ''}
            ${tirBoutPortant ? `<div class="b2-recap-line" style="color: #85c1e9;"><strong>Bout Portant :</strong> <span>+20</span></div>` : ''}
            ${(target || isDistance) && modo !== 0 ? `<div style="border:none; padding:0; margin:0;"><div class="b2-recap-line"><strong style="color:#e0e0e0;">MODO/Diff. :</strong> <span style="color:#ffcccc;">${modo > 0 ? '+'+modo : modo}</span></div><div style="font-size:0.8em; color:#888; text-align:right;">(${detailResistance})</div></div>` : ''}
            ${netAdv !== 0 ? `<div class="b2-recap-line"><strong style="color:#e0e0e0;">Avantages net (${netAdv}) :</strong> <span style="color:#85c1e9;">${bonusAvantage > 0 ? '+'+bonusAvantage : bonusAvantage}</span></div>` : ''}
            ${malusVisee !== 0 ? `<div class="b2-recap-line"><strong style="color:#e0e0e0;">Malus de Visée :</strong> <span style="color:#ffcccc;">${malusVisee}</span></div>` : ''}
            ${handicapLabels.length > 0 ? `<div style="color: #ff5252; margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,82,82,0.3);"><strong>Circonstances :</strong> ${handicapLabels.join(", ")}</div>` : ''}
        </div>
    </div>`;

    // ==========================================
    // INITIALISATION ET AFFICHAGE DU JET
    // ==========================================
    let content = `<div class="brigandyne2-roll">`;
    content += `<h3 style="border-bottom: 1px solid #444; padding-bottom: 3px; margin-bottom: 5px; color: #fff;">Attaque : ${weapon.name}</h3>`;
    content += recapHtml;
    content += `<div class="dice-result"><div class="dice-total ${cssClass}">${result}</div></div>`;
    content += `<div class="roll-result ${cssClass}" style="text-align: center; font-weight: bold; margin-bottom: 5px;">${message}</div>`;

    // ---------------------------------------------
    // ENCART DE CHOIX TACTIQUES (Si un gagnant existe)
    // ---------------------------------------------
    if (hasCombatWinner && loser) {
        let optionsHtmlBase = `
            <option value="blesser" selected>🗡️ Blesser (Appliquer les dégâts)</option>
            <option value="bousculer">🛡️ Bousculer (Mettre à terre / Repousser)</option>
            <option value="desengager">💨 Désengager (Fuir la mêlée)</option>
        `;
        let optionsHtmlBonus = `
            <option value="none" selected>-- Choisissez un 2ème effet --</option>
            <option value="blesser">🗡️ Blesser (Si non pris au-dessus)</option>
            <option value="bousculer">🛡️ Bousculer</option>
            <option value="desengager">💨 Désengager</option>
            <optgroup label="Effets Spéciaux">
                <option value="choc">💫 Choc (Cible Sonnée)</option>
                <option value="precision">🎯 Précision (Ignore l'armure)</option>
                <option value="puissance">💪 Puissance (+1 Dégât)</option>
                <option value="lateral">🔄 Coup latéral (Dégâts à cible adjacente)</option>
                <option value="handicapant">🦵 Coup handicapant (Cible Ralentie)</option>
                <option value="illegal">👁️ Coup illégal (Cible Affaiblie)</option>
                <option value="desarmement">⚔️ Désarmement (Lâche son arme)</option>
                <option value="enchainement">⚡ Enchaînement (Attaque suppl. Dégâts/2)</option>
                <option value="saignement">🩸 Saignement (Cible Ensanglantée)</option>
                <option value="immobilisation">🤼 Immobilisation (Test FOR/FOR)</option>
            </optgroup>
        `;

       let payload = {
            winnerId: winner.uuid,
            loserId: loser.uuid,
            isRPlus: combatIsRPlus,
            degatsBruts: combatDegatsBruts,
            // --- LES DONNÉES QUE TU DEMANDES (CORRIGÉES) ---
            detDie: combatTexteJet,    // Contient le RU ou l'Explosion
            detBase: finalDamageNum,   // Contient Arme + FOR
            detBonus: degatsBonus,     // Contient Posture + Talents
            detDiv: degatsDiviseur,    // Contient 2 (Finesse) ou 1
            // ----------------------------------------------
            protection: combatProtection,
            texteJet: combatTexteJet,
            armorPiercingNote: armorPiercingNote,
            degatsNul: degatsNul,
            isCounter: (winner.id !== this.id),
            sbireOneHit: game.settings.get("brigandyne2appv2", "sbireOneHit")
        };
        let safePayload = JSON.stringify(payload).replace(/"/g, '&quot;');

        let cardHeaderColor = (winner.id === this.id) ? "#4CAF50" : "#b71c1c";
        let cardTitle = (winner.id === this.id) ? "L'Attaquant prend le dessus !" : "Le Défenseur contre-attaque !";

        content += `
        <div class="combat-tactics-card" style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.1); border: 2px solid ${cardHeaderColor}; border-radius: 5px;">
            <h4 style="margin: 0 0 5px 0; color: ${cardHeaderColor}; text-align: center; border-bottom: 1px solid ${cardHeaderColor}; padding-bottom: 3px;"><i class="fas fa-chess-knight"></i> ${cardTitle}</h4>
            <div style="text-align: center; font-size: 0.9em; font-style: italic; color: #ccc; margin-bottom: 10px;">${winner.name} gagne la passe d'armes face à ${loser.name}.</div>
            
            <div class="form-group" style="margin-bottom: 5px;">
                <label style="font-weight: bold; font-size: 0.85em; color: #333; text-shadow: 1px 1px 1px rgba(255,255,255,0.5);">Effet de Base :</label>
                <select class="tactic-effect-1" style="width: 100%; padding: 4px; background: #f9f9f9; color: #111; border: 1px solid #777; border-radius: 3px; font-family: 'Signika', sans-serif;">${optionsHtmlBase}</select>
            </div>
            
            ${combatIsRPlus ? `
            <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-weight: bold; font-size: 0.85em; color: #8b6d05; text-shadow: 1px 1px 1px rgba(255,255,255,0.5);">Effet Spécial (Réussite Majeure) :</label>
                <select class="tactic-effect-2" style="width: 100%; padding: 4px; background: #fffcf0; color: #111; border: 2px solid #d4af37; border-radius: 3px; font-family: 'Signika', sans-serif;">${optionsHtmlBonus}</select>
            </div>` : ''}
            
            <button class="resolve-tactics-btn" data-payload="${safePayload}" style="width: 100%; background: ${cardHeaderColor}; color: #fff; border: none; padding: 5px; cursor: pointer; font-weight: bold; border-radius: 3px; text-transform: uppercase;"><i class="fas fa-check-double"></i> Appliquer les effets</button>
            <div style="font-size: 0.8em; color: #aaa; text-align: center; margin-top: 5px;">(Dégâts de base potentiels de l'arme : ${combatDegatsBruts})</div>
        </div>`;
    } else if (hasCombatWinner && !loser) {
        // Tir réussi sans cible sélectionnée (Juste pour voir les dégâts potentiels)
        content += `<div class="weapon-damage success-box" style="color: #fff;">Dégâts potentiels : <strong>${combatDegatsBruts}</strong></div>`;
    } else if (!hasCombatWinner && options.sansRiposte) {
        content += `<div class="weapon-damage" style="background: rgba(0,0,0,0.5); border: 1px solid #444; color: #ccc;"><em>Attaque manquée. L'adversaire n'était pas en mesure de riposter.</em></div>`;
    } else if (!hasCombatWinner && isDistance) {
        content += `<div class="weapon-damage" style="background: rgba(0,0,0,0.5); border: 1px solid #444; color: #ccc;"><em>Tir manqué.</em></div>`;
    }

    content += alertHtml;

    // BOUTON DOUÉ (Inversion)
    if (forcedResult === null || forcedResult === false) {
        const hasArmeFetiche = this.items.some(i => i.type === "atout" && i.name.toLowerCase().includes("fétiche") && i.system.armeLieeId === weapon.id);
        const hasDoue = this.items.some(i => i.type === "atout" && i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("doue") && (i.system.stat_liee === statKey || i.system.stat_liee === ""));
        
        if (hasArmeFetiche || hasDoue) {
            let inverted = result === 100 ? 100 : (result % 10) * 10 + Math.floor(result / 10);
            if (inverted === 0) inverted = 100;
            let safeOptions = JSON.stringify(options).replace(/"/g, '&quot;');
            content += `<button class="invert-weapon-btn" data-actor-id="${this.id}" data-weapon-id="${weapon.id}" data-options="${safeOptions}" data-inverted="${inverted}" style="margin-top: 5px; background: #d4af37; color: #fff; border: 1px solid #8b6d05; cursor: pointer; text-shadow: 1px 1px 2px black;"><i class="fas fa-magic"></i> Inverser les dés (${result} ➡️ ${inverted})</button>`;
        }
    }

    content += `</div>`;
    
    ChatMessage.create({ user: game.user._id, speaker: ChatMessage.getSpeaker({ actor: this }), content: content, rolls: [roll] });

    if (isSuccess && (forcedResult === null || forcedResult === false)) {
        let acts = weapon.system.activities || {}; let actKeys = Object.keys(acts);
        if (actKeys.length === 1) { 
            this.useActivity(weapon.id, actKeys[0], ru); 
        } else if (actKeys.length > 1) {
            let buttons = {}; 
            for (let k of actKeys) { 
                buttons[k] = { icon: '<i class="fas fa-bolt"></i>', label: acts[k].nom, callback: () => this.useActivity(weapon.id, k, ru) }; 
            }
            new Dialog({ title: `⚡ Capacité de ${weapon.name}`, content: `<p style="text-align: center;">L'attaque a fait mouche ! Voulez-vous déclencher un effet d'arme ?</p>`, buttons: buttons }).render(true);
        }
    }
}