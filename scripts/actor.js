import { rollSpell, _executeSpellRoll } from "./actor-magie.js";
import { rollWeapon, _executeWeaponRoll } from "./actor-combat.js";
import { rollStat, _executeStatRoll, rollSave } from "./actor-stats.js";
import { rollItem, _executeItemRoll } from "./actor-item.js";
import { useActivity, _executeActivityFinal } from "./actor-activite.js";

export class BrigandyneActor extends Actor {
    
    // ============================================
    // 1. CALCULS AUTOMATIQUES (Dérivées & Familles 1-2)
    // ============================================
    prepareDerivedData() {
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

        // ==========================================
        // 🔥 LECTURE DES BUFFS & DÉBUFFS 
        // ==========================================
        
        // A. Buffs provenant des objets possédés (Passifs)
        for (let item of this.items) {
            let isActive = false;
            // Les atouts, origines, archétypes et domaines donnent leurs bonus en permanence
            if (["atout", "objet", "origine", "archetype", "domaine"].includes(item.type)) isActive = true;
            // Les armes et armures doivent être équipées pour donner leur buff
            if (["arme", "armure"].includes(item.type) && item.system.equipe) isActive = true;

            if (isActive && item.system.activities) {
                for (let act of Object.values(item.system.activities)) {
                    if (act.type === "buff" && act.effet?.buff?.stat) {
                        let statKey = act.effet.buff.stat;
                        let val = Number(act.effet.buff.valeur) || 0;
                        if (stats[statKey] && val !== 0) {
                            stats[statKey].total += val;
                            stats[statKey].isModified = true;
                        }
                    }
                }
            }
        }

        // B. Buffs temporaires provenant des Sorts/Potions (Effets Actifs de Foundry)
        for (let effect of this.effects) {
            if (!effect.disabled) {
                for (let change of effect.changes) {
                    if (change.key.startsWith("buff.")) {
                        let statKey = change.key.split(".")[1]; // ex: récupère "cns" dans "buff.cns"
                        if (stats[statKey]) {
                            stats[statKey].total += Number(change.value) || 0;
                            stats[statKey].isModified = true;
                        }
                    }
                }
            }
        }

        let totalProtection = 0;
        let totalMalusInit = 0;
        let totalMalusMou = 0;
        let originVitBonus = 0;
        let originSfBonus = 0;

        // ==========================================
        // 🔥 BONUS DE TALENTS PASSIFS (Familles 1 & 2)
        // ==========================================
        let talentVitBonus = 0;
        let talentSfBonus = 0;
        let talentInitBonus = 0;
        system.magie = system.magie || { uses: { tours: 0, sorts: 0, rituels: 0 } };
        system.magie.bonus_slots = 0;

        let hasPortArmure = false;
        let hasMaitriseBouclier = false;
        let hasEsquive = false;
        
        let hasShield = false;
        let hasHelmet = false;
        let hasHeavyArmor = false;

        for (let item of this.items) {
            if (item.type === "atout") {
                const nomLower = item.name.toLowerCase();
                // Famille 1 : Passifs purs
                if (nomLower.includes("calme")) talentSfBonus += 2;
                if (nomLower.includes("solidité") || nomLower.includes("solidite")) talentVitBonus += 2;
                if (nomLower.includes("vivacité") || nomLower.includes("vivacite")) talentInitBonus += 2;
                if (nomLower.includes("magie innée") || nomLower.includes("magie innee")) system.magie.bonus_slots += 1;
                
                // Famille 2 : Exceptions aux règles
                if (nomLower.includes("port d'armure") || nomLower.includes("port darmure")) hasPortArmure = true;
                if (nomLower.includes("maîtrise du bouclier") || nomLower.includes("maitrise du bouclier")) hasMaitriseBouclier = true;
                if (nomLower === "esquive" || nomLower.includes("esquive ")) hasEsquive = true;
            }

            if (item.type === "armure" && item.system.equipe) {
                totalProtection += Number(item.system.protection) || 0;
                totalMalusInit += Number(item.system.malus_init) || 0;
                totalMalusMou += Number(item.system.malus_mou) || 0;

                const nomArmure = item.name.toLowerCase();
                if (nomArmure.includes("bouclier") || nomArmure.includes("écu") || nomArmure.includes("ecu") || nomArmure.includes("targe") || nomArmure.includes("rondache")) hasShield = true;
                if (nomArmure.includes("casque") || nomArmure.includes("heaume") || nomArmure.includes("chapel")) hasHelmet = true;
                if ((Number(item.system.malus_mou) || 0) > 0 || (Number(item.system.malus_init) || 0) > 0) hasHeavyArmor = true;
            }
            
            if (item.type === "origine") {
                originVitBonus += Number(item.system.bonus_vit) || 0;
                originSfBonus += Number(item.system.bonus_sf) || 0;
            }
        }

        if (hasPortArmure) {
            totalMalusInit = 0;
            totalMalusMou = 0;
        }
        if (hasMaitriseBouclier && hasShield) {
            totalProtection += 1;
        }
        if (hasEsquive && !hasShield && !hasHelmet && !hasHeavyArmor) {
            totalProtection += 1;
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
            system.vitalite.max = Math.floor(stats.for.total / 5) + Math.floor(stats.end.total / 5) + stats.vol.indice + originVitBonus + talentVitBonus;
            system.sangfroid.max = Math.floor(stats.vol.total / 5) + Math.floor(stats.cns.total / 5) + stats.com.indice + originSfBonus + talentSfBonus;
        } else if (this.type === "pnj") {
            let vitMax = Math.floor(stats.for.total / 5) + Math.floor(stats.end.total / 5) + stats.vol.indice + talentVitBonus;
            let sfMax = Math.floor(stats.vol.total / 5) + Math.floor(stats.cns.total / 5) + stats.com.indice + talentSfBonus;

            if (system.type_pnj === "sbire"|| system.type_pnj === "intermediaire") {
                vitMax = Math.floor(stats.for.total / 5) + Math.floor(stats.end.total / 10);
                sfMax = Math.floor(sfMax / 2); 
            }
            system.vitalite.max = vitMax;
            system.sangfroid.max = sfMax;
        }
        
        let initBase = stats.com.indice + stats.mou.indice + stats.per.indice + talentInitBonus;
        if (system.options?.malus_armure) { initBase -= totalMalusInit; }
        system.initiative = { value: initBase };
    }

    // ============================================
    // 2. JETS DE DÉS (Compétences & Oppositions)
    // ============================================
    async rollStat(statKey) {
        return rollStat.call(this, statKey); 
    }
    async _executeStatRoll(statKey, target, targetStatKey, modDifficulte, totalBonusAtouts, forcedResult = null) {
        return _executeStatRoll.call(this, statKey, target, targetStatKey, modDifficulte, totalBonusAtouts, forcedResult); 
    }
    async rollSave(statKey, mod) {
        return rollSave.call(this, statKey, mod); 
    }

    // ============================================
    // 3. JETS DE MAGIE
    // ============================================
    async rollSpell(itemId) {
        return rollSpell.call(this, itemId); 
    }

    async _executeSpellRoll(sort, options, forcedResult = null) {
        return _executeSpellRoll.call(this, sort, options, forcedResult);
    }

    // ============================================
    // 4. JETS D'ARMES
    // ============================================
    async rollWeapon(itemId) {
        return rollWeapon.call(this, itemId);
    }

    async _executeWeaponRoll(weapon, options, forcedResult = null) {
        return _executeWeaponRoll.call(this, weapon, options, forcedResult);
    }

    // ============================================
    // JETS D'OBJETS ET TALENTS (Génériques)
    // ============================================
    async rollItem(itemId) {
        return rollItem(itemId);
    }

    async _executeItemRoll(item, statKey, modDifficulte, advC) {
        return _executeItemRoll(item, statKey, modDifficulte, advC);
    }
    // ============================================
    // 5. MOTEUR D'ACTIVITÉS UNIVERSEL
    // ============================================
    async useActivity(itemId, activityId, forcedRU = null) {
        return useActivity(itemId, activityId, forcedRU = null)
    }

    async _executeActivityFinal(item, act, finalFormula, ressource, coutVal) {
        return _executeActivityFinal(item, act, finalFormula, ressource, coutVal);
    }
}
