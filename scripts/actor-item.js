export async function rollItem(itemId) {
        const item = this.items.get(itemId);
        if (!item) return;

        let defaultStat = item.system.stat_liee || "hab"; 

        let statOptions = "";
        for (let [k, s] of Object.entries(this.system.stats)) {
            statOptions += `<option value="${k}" ${k === defaultStat ? 'selected' : ''}>${s.label}</option>`;
        }

        let dialogContent = `
        <div style="margin-bottom: 10px; font-style: italic; color: #555;">
            Utilisation de : <b>${item.name}</b>
        </div>
        <form>
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="font-weight: bold; color: #111;">Caractéristique à tester :</label>
                <select id="statToRoll" style="width: 100%; padding: 3px;">
                    ${statOptions}
                </select>
            </div>
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
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="font-weight: bold; color: #111;">Modificateurs divers (+/-) :</label>
                <input type="number" id="advC" value="0" style="width: 100%; text-align: center;">
            </div>
        </form>
        `;

        new Dialog({
            title: `Utiliser : ${item.name}`,
            content: dialogContent,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-dice-d20"></i>',
                    label: "Tester et Utiliser",
                    callback: async (html) => {
                        const statKey = html.find('#statToRoll').val();
                        const modDifficulte = parseInt(html.find('#difficulte').val()) || 0;
                        const advC = parseInt(html.find('#advC').val()) || 0;
                        await this._executeItemRoll(item, statKey, modDifficulte, advC);
                    }
                },
                useDirect: {
                    icon: '<i class="fas fa-bolt"></i>',
                    label: "Utiliser sans jet",
                    callback: async () => {
                        let msg = `<div class="brigandyne2-roll"><h3 style="border-bottom: 1px solid #444; margin-bottom: 5px; color: #fff;">${item.name}</h3><div style="padding: 5px; background: rgba(0,0,0,0.2); color: #ccc;"><i>L'objet est utilisé avec succès.</i></div></div>`;
                        ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: msg });
                        
                        let acts = item.system.activities || {};
                        let actKeys = Object.keys(acts);
                        if (actKeys.length === 1) {
                            await this.useActivity(item.id, actKeys[0], 0);
                        } else if (actKeys.length > 1) {
                            let buttons = {};
                            for (let k of actKeys) {
                                buttons[k] = { icon: '<i class="fas fa-bolt"></i>', label: acts[k].nom, callback: () => this.useActivity(item.id, k, 0) };
                            }
                            new Dialog({
                                title: `⚡ Capacité de ${item.name}`,
                                content: `<p style="text-align: center;">Voulez-vous déclencher un effet ?</p>`,
                                buttons: buttons
                            }).render(true);
                        }
                    }
                }
            },
            default: "roll"
        }).render(true);
    }

    export async function _executeItemRoll(item, statKey, modDifficulte, advC) {
        const stat = this.system.stats[statKey];
        let scoreBase = stat.total !== undefined ? stat.total : stat.value;
        let score = scoreBase + modDifficulte + advC;
        
        let recapHtml = `
        <div style="font-size: 0.9em; background: rgba(0,0,0,0.4); padding: 5px; border-radius: 3px; margin-bottom: 8px; text-align: left; border: 1px solid #444;">
            <div><strong style="color:#e0e0e0;">Caractéristique (${stat.label}) :</strong> <span style="color:#fff;">${scoreBase}</span></div>
            ${modDifficulte !== 0 ? `<div><strong style="color:#e0e0e0;">Difficulté :</strong> <span style="color:#85c1e9;">${modDifficulte > 0 ? '+'+modDifficulte : modDifficulte}</span></div>` : ''}
            ${advC !== 0 ? `<div><strong style="color:#e0e0e0;">Modificateurs :</strong> <span style="color:#85c1e9;">${advC > 0 ? '+'+advC : advC}</span></div>` : ''}
            <div style="border-top: 1px solid #555; margin-top: 5px; padding-top: 3px; text-align: center; font-size: 1.1em; color: #fff;">
                <strong>Seuil final : ${score}</strong>
            </div>
        </div>`;

        const roll = new Roll("1d100"); await roll.evaluate(); const result = roll.total;
        let ru = result % 10; let isCrit = (ru === 0);
        if (ru === 0) ru = 10;
        let message = "Échec"; let cssClass = "fail";
        let isSuccess = result <= score;

        if (isSuccess) {
            if (isCrit) { message = "Réussite Critique !"; cssClass = "crit-success"; }
            else if (result <= 9 && score >= 20) { message = "Réussite Majeure !"; cssClass = "major-success"; }
            else { message = "Réussite"; cssClass = "success"; }
        } else {
            if (isCrit) { message = "Échec Critique !"; cssClass = "crit-fail"; }
            else if (result >= 91 && score < 80) { message = "Échec Majeur"; cssClass = "major-fail"; }
        }

        const content = `<div class="brigandyne2-roll"><h3 style="border-bottom: 1px solid #444; padding-bottom: 3px; margin-bottom: 5px; color: #fff;">Utilisation : ${item.name}</h3>${recapHtml}<div class="dice-result"><div class="dice-total ${cssClass}">${result}</div></div><div class="roll-result ${cssClass}" style="text-align: center; font-weight: bold; margin-bottom: 5px;">${message}</div></div>`;
        ChatMessage.create({ user: game.user._id, speaker: ChatMessage.getSpeaker({ actor: this }), content: content, rolls: [roll] });

        if (isSuccess) {
            let acts = item.system.activities || {};
            let actKeys = Object.keys(acts);

            if (actKeys.length === 1) {
                await this.useActivity(item.id, actKeys[0], ru);
            } else if (actKeys.length > 1) {
                let buttons = {};
                for (let k of actKeys) {
                    buttons[k] = { icon: '<i class="fas fa-bolt"></i>', label: acts[k].nom, callback: () => this.useActivity(item.id, k, ru) };
                }
                new Dialog({
                    title: `⚡ Capacité de ${item.name}`,
                    content: `<p style="text-align: center; font-family: 'Georgia', serif;">Jet réussi ! Voulez-vous déclencher un effet ?</p>`,
                    buttons: buttons
                }).render(true);
            }
        }
    }