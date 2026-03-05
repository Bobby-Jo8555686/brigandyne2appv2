export async function rollWeapon(itemId) {
        const weapon = this.items.get(itemId);
        if (!weapon) return;

        const hasShield = this.items.some(i => i.type === "armure" && i.system.equipe && i.name.toLowerCase().includes("bouclier"));
        const forIndice = this.system.stats.for.indice || 0;
        
        const typeArme = weapon.system.type_arme || "melee";
        const isDistance = typeArme === "distance";
        const statKey = isDistance ? "tir" : "com";

        // 🔥 DÉTECTION DES TALENTS OFFENSIFS (FAMILLE 4)
        const hasTalent = (n) => this.items.some(i => i.type === "atout" && i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(n));
        const hasAgile = hasTalent("agile");
        const hasBrute = hasTalent("brute");

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
            talentsComboHtml += `<div class="form-group" style="margin-bottom: 5px; border: 1px dashed #4CAF50; padding: 5px; background: rgba(76, 175, 80, 0.1); border-radius: 3px;"><label style="font-weight: bold; color: #2E7D32;">Talent [1x/S] (Jet Carac.) :</label><select id="replaceStat" style="width: 100%;"><option value="">- Jet de Combat normal -</option>${hasAgile ? '<option value="mou">Agile (Jet de MOU)</option>' : ''}${hasBrute ? '<option value="for">Brute (Jet de FOR)</option>' : ''}</select></div>`;
        }
        if (specialBoosts.length > 0) {
            talentsComboHtml += `<div class="form-group" style="margin-bottom: 10px; border: 1px dashed #4CAF50; padding: 5px; background: rgba(76, 175, 80, 0.1); border-radius: 3px;"><label style="font-weight: bold; color: #2E7D32;">Talent [1x/S] (Bonus Dégâts) :</label><select id="bonusDmgStat" style="width: 100%;"><option value="">- Aucun -</option>${specialBoosts.map(b => `<option value="${b.val}">${b.label}</option>`).join('')}</select></div>`;
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
            <div class="form-group" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <label title="L'adversaire est surpris, à terre, désarmé ou incapable de se défendre." style="color: #8b0000; font-weight: bold;">Cible incapable de riposter</label>
                <input type="checkbox" id="sansRiposte" />
            </div>
            `}

            ${talentsComboHtml}

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
                            bonusDmgStat: html.find('#bonusDmgStat').val()
                        };
                        
                        await this._executeWeaponRoll(weapon, options);
                    }
                }
            },
            default: "attaquer"
        }).render(true);
    }

    export async function _executeWeaponRoll(weapon, options, forcedResult = null) {
        const { tactique, chifoumi, advC, hasShield, forIndice, totalBonusAtouts, tirMelee, tirBoutPortant, modTir, cibleConsciente, lancerArme, sansRiposte, replaceStat, bonusDmgStat } = options;
        const handicaps = this.system.handicaps || {};
        const hasTalent = (n) => this.items.some(i => i.type === "atout" && i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(n));

        let finalDamageNum = Number(weapon.system.degats_fixe) || 0;
        let isSpecialDamage = false; 
        if (weapon.system.utilise_force) finalDamageNum += (this.system.stats.for.indice || 0);
        let rawDamage = weapon.system.utilise_force ? `FOR${weapon.system.degats_fixe > 0 ? '+'+weapon.system.degats_fixe : (weapon.system.degats_fixe < 0 ? weapon.system.degats_fixe : '')}` : `${weapon.system.degats_fixe}`;

        const typeArme = weapon.system.type_arme || "melee";
        const isDistance = typeArme === "distance" || lancerArme;
        let statLabel = isDistance ? "Tir" : "Combat";
        let statKey = isDistance ? "tir" : "com";
        
        // 🔥 FAMILLE 4 : Remplacement de Stat (Agile / Brute)
        if (replaceStat === "mou") { statKey = "mou"; statLabel = "Mouvement (Agile)"; }
        else if (replaceStat === "for") { statKey = "for"; statLabel = "Force (Brute)"; }

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

        // 🔥 FAMILLE 4 : CALCUL DES BONUS DE DÉGÂTS (TALENTS)
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

        let netAdv = Math.max(-3, Math.min(3, avantages - desavantages)); 
        let bonusAvantage = netAdv * 10; score += bonusAvantage + malusVisee;

        let target = Array.from(game.user.targets)[0];
        let explicitTargetId = target ? target.id : null;
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

        let result; let roll = null;
        if (forcedResult !== null && forcedResult !== false) {
            result = forcedResult; roll = new Roll(`${result}`); await roll.evaluate();
        } else {
            roll = new Roll("1d100"); await roll.evaluate(); result = roll.total;
        }

        let ru = result % 10; let isCrit = false; if (ru === 0) { ru = 10; isCrit = true; } 
        let isSuccess = result <= score;
        let message = ""; let cssClass = ""; let damageHtml = "";

        const rollExplosion = async () => {
            let degatsExplosion = 10; let texteExplosion = "10"; let relance = 10;
            while (relance === 10) { let exploRoll = new Roll("1d10"); await exploRoll.evaluate(); relance = exploRoll.total; degatsExplosion += relance; texteExplosion += ` + ${relance}`; }
            return { total: degatsExplosion, texte: texteExplosion };
        };

        if (isSuccess) {
            if (bloqueRPlus) { isCrit = false; message = "Réussite (R+ Bloqué !)"; cssClass = "success"; } 
            else { message = isCrit ? "Réussite Critique !" : (result <= 9 && score >= 20 ? "Réussite Majeure !" : "Réussite"); cssClass = isCrit ? "crit-success" : (result <= 9 && score >= 20 ? "major-success" : "success"); }
            
            let degatsBruts = 0; let texteJet = `${ru}`;
            if (isSpecialDamage) { damageHtml = `<div class="weapon-damage success-box" style="color:#fff;">Dégâts : <strong>${rawDamage}</strong></div>`; } 
            else {
                if (isCrit) { let explosion = await rollExplosion(); degatsBruts = explosion.total + finalDamageNum + degatsBonus; texteJet = explosion.texte; } 
                else { degatsBruts = ru + finalDamageNum + degatsBonus; }
                degatsBruts = Math.floor(degatsBruts / degatsDiviseur);
                if (bloqueRPlus) degatsBruts = Math.max(0, degatsBruts - 1);
                if (degatsNul) degatsBruts = 0;

                if (targetActor) {
                    let protection = ignoreArmor ? 0 : (Number(targetActor.system.protection?.value) || 0);
                    let armorPiercingNote = "";
                    
                    // 🔥 FAMILLE 4 : Pénétration d'Armure
                    if (!ignoreArmor) {
                        if (!isDistance && hasTalent("coups precis")) { protection = Math.floor(protection / 2); armorPiercingNote = " (Coups précis)"; }
                        if (isDistance && hasTalent("tir precis")) { protection = Math.floor(protection / 2); armorPiercingNote = " (Tir précis)"; }
                    }

                    let degatsFinaux = Math.max(0, degatsBruts - protection);
                    let noteSbire = "";
                    try {
                        let nouvelleVie = targetActor.system.vitalite.value - degatsFinaux;
                        if (game.settings.get("brigandyne2appv2", "sbireOneHit") && targetActor.type === "pnj" && targetActor.system.type_pnj === "sbire" && degatsFinaux > 0) {
                            nouvelleVie = 0; noteSbire = "<br><span style='color: #ffcccc; font-weight: bold;'>💥 Le sbire est vaincu sur le coup !</span>";
                        }
                        await targetActor.update({ "system.vitalite.value": Math.max(0, nouvelleVie) });
                    } catch(e) {}
                    damageHtml = `<div class="weapon-damage ${isCrit ? 'crit-box' : 'success-box'}">Dégâts infligés : <strong><span style="font-size: 1.2em; color: #fff;">${degatsFinaux}</span></strong><br><small style="color: #ccc;">(Base: ${texteJet} + Arme: ${finalDamageNum} ${degatsBonus>0?'+ Talents/For: '+degatsBonus:''} ${degatsDiviseur>1?'/ 2':''} - Armure cible: ${protection}${armorPiercingNote})</small>${bloqueRPlus ? '<br><span style="color:#ffcccc; font-weight:bold;">-1 Dégât (Handicap)</span>' : ''}${noteSbire}</div>`;
                    if (degatsNul) damageHtml = `<div class="weapon-damage" style="color: #aaa;"><em>Esquive et Parade pures. Aucun dégât infligé.</em></div>`;
                } else { damageHtml = `<div class="weapon-damage ${isCrit ? 'crit-box' : 'success-box'}" style="color: #fff;">Dégâts potentiels : <strong>${degatsBruts}</strong> ${bloqueRPlus ? '<span style="color:#ffcccc; font-weight:bold;">(-1 Dégât Handicap)</span>' : ''}</div>`; }
            }
        } else {
            message = isCrit ? "Échec Critique !" : (result >= 91 && score < 80 ? "Échec Majeur" : "Échec");
            cssClass = isCrit ? "crit-fail" : (result >= 91 && score < 80 ? "major-fail" : "fail");
            let noteAllie = "";
            if (tirMelee && (isCrit || (result >= 91 && score < 80))) noteAllie = `<div style="margin-top: 8px; color: #ffcccc; font-weight: bold; font-size: 1.1em; border-top: 1px dashed #ffcccc; padding-top: 5px;">💥 Aïe ! Le tir touche un allié dans la mêlée !</div>`;

            if (targetActor && typeArme === "melee" && !lancerArme) {
                if (options.sansRiposte) { damageHtml = `<div class="weapon-damage" style="background: rgba(0,0,0,0.5); border: 1px solid #444; color: #ccc;"><em>Attaque manquée. L'adversaire n'était pas en mesure de riposter.</em></div>`; } 
                else {
                    let targetWeapon = targetActor.items.find(i => i.type === "arme" && i.system.type_arme !== "distance");
                    let targetFinalDamageNum = 0;
                    // 🔥 CORRECTION BUG RIPOSTE : Utilisation de chaînages optionnels (?.)
                    if (targetWeapon) { targetFinalDamageNum = Number(targetWeapon.system.degats_fixe) || 0; if (targetWeapon.system.utilise_force) targetFinalDamageNum += (targetActor.system.stats?.for?.indice || 0); }
                    
                    let degatsBruts = 0; let texteJet = `${ru}`;
                    if (isCrit) { let explosion = await rollExplosion(); degatsBruts = explosion.total + targetFinalDamageNum; texteJet = explosion.texte; } else { degatsBruts = ru + targetFinalDamageNum; }
                    let protection = Number(this.system.protection?.value) || 0;
                    let degatsFinaux = Math.max(0, degatsBruts - protection);
                    let noteSbire = ""; let nouvelleVie = this.system.vitalite.value - degatsFinaux;
                    if (game.settings.get("brigandyne2appv2", "sbireOneHit") && this.type === "pnj" && this.system.type_pnj === "sbire" && degatsFinaux > 0) { nouvelleVie = 0; noteSbire = "<br><span style='color: #ffcccc; font-weight: bold;'>💥 Le sbire est fauché par la contre-attaque !</span>"; }
                    await this.update({ "system.vitalite.value": Math.max(0, nouvelleVie) });
                    damageHtml = `<div class="weapon-damage counter-attack-box"><strong style="color: #ffcccc;">Contre-attaque subie !</strong><br>Dégâts reçus : <strong><span style="font-size: 1.2em; color: #fff;">${degatsFinaux}</span></strong><br><small style="color: #ccc;">(Jet adverse: ${texteJet} + Son arme: ${targetFinalDamageNum} - Ton armure: ${protection})</small>${noteSbire}</div>`;
                }
            } else { damageHtml = `<div class="weapon-damage" style="background: rgba(0,0,0,0.5); border: 1px solid #444; color: #ccc;"><em>Attaque manquée.</em>${noteAllie}</div>`; }
        }

        let content = `<div class="brigandyne2-roll">`;
        if (forcedResult !== null && forcedResult !== false) content += `<div style="background: rgba(212, 175, 55, 0.2); border: 1px dashed #d4af37; color: #d4af37; padding: 5px; text-align: center; font-weight: bold; margin-bottom: 5px; border-radius: 3px;">🪄 Jet inversé par un Talent !</div>`;
        content += `<h3 style="border-bottom: 1px solid #444; margin-bottom: 5px; color: #fff;">Attaque : ${weapon.name}</h3>${recapHtml}<div class="dice-result"><div class="dice-total ${cssClass}">${result}</div></div><div class="roll-result ${cssClass}" style="text-align: center; font-weight: bold; margin-bottom: 5px;">${message}</div>${damageHtml}`;

        // ==========================================
        // 🔥 BOUTON D'INVERSION (Doué / Arme Fétiche)
        // ==========================================
        if (forcedResult === null || forcedResult === false) {
            const hasArmeFetiche = this.items.some(i => i.type === "atout" && i.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("arme fetiche"));
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