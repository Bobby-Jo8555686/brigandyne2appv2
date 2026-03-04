const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class BrigandyneActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  
  static DEFAULT_OPTIONS = {
    classes: ["brigandyne2appv2", "sheet", "actor"],
    position: { width: 800, height: 900 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    sheet: { template: "systems/brigandyne2appv2/templates/actor-sheet.hbs" }
  };

  get actor() { return this.document; }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    context.system = this.actor.system || {}; 
    context.actor = this.actor;
    context.editable = this.isEditable;         
    context.owner = this.document.isOwner;      

    context.pnjTypes = { "sbire": "Sbire", "intermediaire": "Intermédiaire", "boss": "Boss", "creature": "Créature" };
    context.choixStatMagie = { "cns": "Connaissances", "vol": "Volonté", "mag": "Magie" };

    // Affichage des onglets par défaut
    context.showMagicTab = true;
    context.showBioTab = true;

    if (this.actor.type === "pnj") {
        const pnjType = context.system.type_pnj;
        
        // 1. La Magie est cachée pour les Sbires
        if (pnjType === "sbire") {
            context.showMagicTab = false;
        }
        
        // 2. La Biographie est cachée pour les Sbires, Intermédiaires et Créatures
        if (["sbire", "intermediaire", "creature"].includes(pnjType)) {
            context.showBioTab = false;
        }
    }

    context.armes = []; context.armures = []; context.objets = [];
    context.atouts = []; context.sorts = []; context.origines = [];
    context.archetypes = []; context.carrieres = []; context.domaines = [];
    context.tours = []; context.sortileges = [];

    if (this.actor.items) {
        for (let i of this.actor.items) {
          if (i.type === 'arme') context.armes.push(i);
          else if (i.type === 'armure') context.armures.push(i);
          else if (i.type === 'objet') context.objets.push(i);
          else if (i.type === 'atout') context.atouts.push(i);
          else if (i.type === 'origine') context.origines.push(i);
          else if (i.type === 'archetype') context.archetypes.push(i);
          else if (i.type === 'carriere') context.carrieres.push(i);
          else if (i.type === 'domaine') context.domaines.push(i);
          else if (i.type === 'sort') {
              context.sorts.push(i);
              if (i.system.type_sort === 'tour') context.tours.push(i);
              else context.sortileges.push(i);
          }
        }
    }

    let maxDest = 0;
    if (context.origines.length > 0) maxDest = Number(context.origines[0].system.destin) || 0;
    
    context.system.destin = context.system.destin || { value: 0 };
    context.system.destin.max = maxDest;
    
    const activeCarriere = this.actor.items ? this.actor.items.find(i => i.type === 'carriere') : null;

    context.system.stats = context.system.stats || {};

    for (let [key, stat] of Object.entries(context.system.stats)) {
      stat.progressBoxes = [];
      const maxProg = activeCarriere ? (activeCarriere.system.stats[key] || 0) : 0; 
      const currentProg = stat.progression || 0;
      for (let i = 1; i <= 6; i++) {
        stat.progressBoxes.push({ value: i, statKey: key, locked: i > maxProg && i > currentProg, checked: i <= currentProg });
      }
    }

    if (this.actor.type === "personnage" || context.showMagicTab) {
      const magScore = context.system.stats.mag?.total || 0;
      
      context.maxDomaines = 0;
      if (magScore >= 1 && magScore <= 49) context.maxDomaines = 1;
      else if (magScore >= 50 && magScore <= 69) context.maxDomaines = 2;
      else if (magScore >= 70 && magScore <= 89) context.maxDomaines = 3;
      else if (magScore >= 90 && magScore <= 99) context.maxDomaines = 4;
      else if (magScore >= 100) context.maxDomaines = 5;

      context.system.magie = context.system.magie || { uses: { tours: 0, sorts: 0, rituels: 0 }, bonus_slots: 0 };
    }

    // Enrichissement du texte pour l'éditeur AppV2
    context.enrichedBiography = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.biography || "", { async: true });

    // Savoir si la fiche est verrouillée (par défaut: non)
    context.isLocked = this.actor.getFlag("brigandyne2appv2", "sheetLocked") || false;

    // PRÉPARATION DES CASES À COCHER DE MAGIE (Gère le talent Magie Innée)
    const baseMagIndice = Math.floor((this.actor.system.stats.mag?.total || 0) / 10);
    const bonusSlots = this.actor.system.magie?.bonus_slots || 0;
    const totalMagSlots = baseMagIndice + bonusSlots;

    const uses = this.actor.getFlag("brigandyne2appv2", "magicUses") || { tour: 0, sortilege: 0, rituel: 0 };
    
    context.toursBoxes = Array.from({length: totalMagSlots}, (_, i) => ({ value: i + 1, checked: i < uses.tour }));
    context.sortsBoxes = Array.from({length: totalMagSlots}, (_, i) => ({ value: i + 1, checked: i < uses.sortilege }));
    context.rituelBox = { value: 1, checked: uses.rituel > 0 };

    // ==========================================
    // VICES & VERTUS (Effet Miroir)
    // ==========================================
    const viceVertuPairs = [
        { key: 'avare', vice: 'Avare', vertu: 'Généreux' },
        { key: 'colerique', vice: 'Colérique', vertu: 'Prudent' },
        { key: 'cruel', vice: 'Cruel', vertu: 'Clément' },
        { key: 'envieux', vice: 'Envieux', vertu: 'Bienveillant' },
        { key: 'gourmand', vice: 'Gourmand', vertu: 'Sobre' },
        { key: 'lache', vice: 'Lâche', vertu: 'Valeureux' },
        { key: 'luxurieux', vice: 'Luxurieux', vertu: 'Chaste' },
        { key: 'orgueilleux', vice: 'Orgueilleux', vertu: 'Humble' },
        { key: 'paresseux', vice: 'Paresseux', vertu: 'Travailleur' },
        { key: 'trompeur', vice: 'Trompeur', vertu: 'Loyal' }
    ];

    context.vicesVertus = viceVertuPairs.map(p => {
        let val = this.actor.system.vices?.[p.key] || 0;
        return {
            ...p,
            viceVal: val > 0 ? `+${val}` : val,
            vertuVal: -val > 0 ? `+${-val}` : -val,
            isViceActive: val > 0,
            isVertuActive: val < 0
        };
    });

    // On récupère le texte de l'Archétype pour l'afficher en consigne
    const archetype = this.actor.items.find(i => i.type === 'archetype');
    context.archetypeVicesText = archetype ? archetype.system.vices_vertus : null;
    // ==========================================
    // LISTE DES EFFETS ACTIFS (Pour affichage et suppression)
    // ==========================================
    context.effetsActifs = [];
    if (this.actor.effects) {
        for (let e of this.actor.effects) {
            context.effetsActifs.push({
                id: e.id,
                name: e.name,
                img: e.img || "icons/svg/aura.svg",
                description: e.description || ""
            });
        }
    }

    return context;
  }

  // ===========================================
  // 2. GESTION DES ÉVÉNEMENTS
  // ===========================================
  _onRender(context, options) {
    super._onRender(context, options);
    const html = $(this.element); 
    if (!this.isEditable) return;

    // B. Gestion des Onglets (avec mémoire !)
    this._activeTab = this._activeTab || "stats";

    html.find('[data-action="changeTab"]').click(ev => {
        ev.preventDefault();
        const tabName = $(ev.currentTarget).data('tab');
        this._activeTab = tabName; // <== On mémorise l'onglet cliqué !
        
        html.find('[data-action="changeTab"]').removeClass('active');
        $(ev.currentTarget).addClass('active');
        html.find('.tab').hide();
        html.find(`.tab.${tabName}`).show();
    });

    // C. Clic sur l'image de profil
    html.find('[data-action="editImage"]').click(ev => {
        new FilePicker({
            type: "image",
            current: this.actor.img,
            callback: path => this.actor.update({ img: path })
        }).browse();
    });

    // CLIC SUR LES VICES ET VERTUS
    html.find('[data-action="adjustVice"]').click(async ev => {
        ev.preventDefault();
        const key = ev.currentTarget.dataset.key;
        const delta = parseInt(ev.currentTarget.dataset.delta);
        const currentVal = this.actor.system.vices?.[key] || 0;
        
        // On limite entre -3 (Vertu Max) et +3 (Vice Max)
        let newVal = Math.max(-3, Math.min(3, currentVal + delta));
        await this.actor.update({ [`system.vices.${key}`]: newVal });
    });
    
    // Au redessin, on restaure l'onglet mémorisé
    html.find(`[data-action="changeTab"][data-tab="${this._activeTab}"]`).addClass('active');
    html.find('.tab').hide();
    html.find(`.tab.${this._activeTab}`).show();

    // C. Jets de dés et Boutons
    html.find('[data-action="rollInit"]').click(async ev => {
        ev.preventDefault();
        if (game.combat) {
            await this.actor.rollInitiative({ createCombatants: true });
        } else {
            const initValue = this.actor.system.initiative?.value || 0;
            const roll = new Roll(`1d10 + ${initValue}`);
            await roll.evaluate();
            const content = `<div class="brigandyne-roll"><h3 style="border-bottom: 1px solid #444; margin-bottom: 5px; color: #fff;">Initiative</h3><div class="dice-result"><div class="dice-total success" style="font-size: 1.5em;">${roll.total}</div></div></div>`;
            ChatMessage.create({ user: game.user._id, speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: content, rolls: [roll] });
        }
    });
    // ==========================================
    // BOUTON : SUPPRIMER UN EFFET ACTIF
    // ==========================================
    html.find('[data-action="deleteEffect"]').click(async ev => {
        ev.preventDefault();
        const effectId = ev.currentTarget.dataset.id;
        const effect = this.actor.effects.get(effectId);
        
        if (effect) {
            // Nettoyage intelligent : si c'était un état (ex: aveugle), on décoche la case Handicap associée !
            if (effect.statuses && effect.statuses.size > 0) {
                let updates = {};
                for (let status of effect.statuses) {
                    if (this.actor.system.handicaps?.[status] !== undefined) {
                        updates[`system.handicaps.${status}`] = false;
                    }
                }
                if (Object.keys(updates).length > 0) {
                    await this.actor.update(updates);
                }
            }
            // On supprime définitivement l'effet
            await effect.delete();
        }
    });

    // CLIC SUR LES CASES DE MAGIE
    html.find('.spell-box').click(async ev => {
        ev.preventDefault();
        const typeBox = ev.currentTarget.dataset.type; // "tours", "sorts" ou "rituels"
        const clickedValue = parseInt(ev.currentTarget.dataset.value);
        
        const uses = this.actor.getFlag("brigandyne2appv2", "magicUses") || { tour: 0, sortilege: 0, rituel: 0 };
        const flagKey = typeBox === "tours" ? "tour" : (typeBox === "sorts" ? "sortilege" : "rituel");
        
        if (uses[flagKey] === clickedValue) {
            uses[flagKey] = clickedValue - 1;
        } else {
            uses[flagKey] = clickedValue;
        }
        
        await this.actor.setFlag("brigandyne2appv2", "magicUses", uses);
    });

    // ==========================================
    // DRAG & DROP UNIVERSEL (V12 & V13)
    // ==========================================
    if (this.isEditable) {
        this.element.ondragover = (event) => {
            event.preventDefault();
        };
        
        this.element.ondrop = (event) => {
            event.preventDefault();
            // 🛑 LE BOUCLIER ANTI-CLONES POUR LA V13 EST ICI :
            event.stopPropagation(); 
            this._onDrop(event);
        };
    }

    // D. Clic sur le cadenas (Verrouillage)
    html.find('[data-action="toggleLock"]').click(async ev => {
        ev.preventDefault();
        const currentLock = this.actor.getFlag("brigandyne2appv2", "sheetLocked") || false;
        await this.actor.setFlag("brigandyne2appv2", "sheetLocked", !currentLock);
    });

    if (context.isLocked) {
        html.addClass("locked");
    } else {
        html.removeClass("locked");
    }

    // ==========================================
    // BOUTON : REPOS DU MAGE (Reset Magie)
    // ==========================================
    const resetMagicBtn = this.element.querySelector('[data-action="resetMagic"]');
    if (resetMagicBtn) {
        resetMagicBtn.addEventListener("click", async (ev) => {
            ev.preventDefault();
            const confirmRest = await Dialog.confirm({
                title: "Repos du Mage",
                content: `<p><b>${this.actor.name}</b> s'est-il reposé au moins 8 heures ?</p><p><i>Cela remettra ses compteurs d'utilisations de sorts (Tours, Sortilèges et Rituels) à zéro.</i></p>`,
                yes: () => true,
                no: () => false,
                defaultYes: false
            });

            if (confirmRest) {
                await this.actor.setFlag("brigandyne2appv2", "magicUses", { tour: 0, sortilege: 0, rituel: 0 });
                ui.notifications.info(`✨ L'esprit de ${this.actor.name} est apaisé. Ses limites magiques sont réinitialisées !`);
            }
        });
    }

    // ==========================================
    // BOUTON : RÉINITIALISER LES ACTIVITÉS (REPOS)
    // ==========================================
    html.find('[data-action="resetActivities"]').click(async ev => {
        ev.preventDefault();
        const confirm = await new Promise((resolve) => {
            new Dialog({
                title: "Repos & Récupération",
                content: `
                    <p>Sélectionnez le type de repos pour <b>${this.actor.name}</b> :</p>
                    <form style="font-family: 'Georgia', serif; color: #333;">
                        <div style="margin-bottom: 8px;"><label style="cursor: pointer;"><input type="radio" name="restType" value="combat" checked> <b>Fin de combat</b> <span style="font-size: 0.85em; color: #777;">(Recharge les capacités "Par combat")</span></label></div>
                        <div style="margin-bottom: 8px;"><label style="cursor: pointer;"><input type="radio" name="restType" value="jour"> <b>Repos Long</b> <span style="font-size: 0.85em; color: #777;">(Recharge "Par combat" et "Par jour")</span></label></div>
                        <div style="margin-bottom: 15px;"><label style="cursor: pointer;"><input type="radio" name="restType" value="session"> <b>Fin de Session</b> <span style="font-size: 0.85em; color: #777;">(Recharge tout sauf Permanent)</span></label></div>
                    </form>
                `,
                buttons: {
                    yes: { icon: '<i class="fas fa-bed"></i>', label: "Se reposer", callback: (html) => resolve(html.find('input[name="restType"]:checked').val()) },
                    no: { icon: '<i class="fas fa-times"></i>', label: "Annuler", callback: () => resolve(false) }
                },
                default: "yes",
                close: () => resolve(false)
            }).render(true);
        });

        if (confirm) {
            let updates = [];
            for (let item of this.actor.items) {
                if (!item.system.activities || Object.keys(item.system.activities).length === 0) continue;
                
                let acts = foundry.utils.deepClone(item.system.activities);
                let changed = false;
                
                for (let key in acts) {
                    let freq = acts[key].utilisations?.frequence;
                    
                    if (
                        (confirm === "combat" && freq === "combat") ||
                        (confirm === "jour" && (freq === "combat" || freq === "jour")) ||
                        (confirm === "session" && (freq === "combat" || freq === "jour" || freq === "session"))
                    ) {
                        if (acts[key].utilisations.value > 0) {
                            acts[key].utilisations.value = 0; 
                            changed = true;
                        }
                    }
                }
                
                if (changed) updates.push({ _id: item.id, "system.activities": acts });
            }

            if (updates.length > 0) {
                await this.actor.updateEmbeddedDocuments("Item", updates);
                ui.notifications.info(`🏕️ Les capacités de ${this.actor.name} ont été rechargées !`);
            } else {
                ui.notifications.info(`🏕️ ${this.actor.name} n'avait aucune capacité à recharger pour ce type de repos.`);
            }
        }
    });

    html.find('[data-action="rollStat"]').click(this._onRoll.bind(this));
    html.find('[data-action="useActivity"]').click(ev => {
        ev.preventDefault();
        const itemId = ev.currentTarget.dataset.itemId;
        const activityId = ev.currentTarget.dataset.activityId;
        this.actor.useActivity(itemId, activityId); 
    });
    html.find('[data-action="rollWeapon"]').click(this._onItemRoll.bind(this));
    html.find('[data-action="rollSpell"]').click(this._onSpellRoll.bind(this));
    html.find('[data-action="rollItem"]').click(ev => {
        ev.preventDefault();
        const itemId = ev.currentTarget.closest(".item").dataset.itemId;
        if (itemId) this.actor.rollItem(itemId);
    });
    
    html.find('[data-action="createItem"]').click(this._onItemCreate.bind(this));
    html.find('[data-action="editItem"]').click(ev => { 
        const li = $(ev.currentTarget).closest(".item"); 
        const item = this.actor.items.get(li.data("itemId")); 
        if(item) item.sheet.render(true); 
    });
    html.find('[data-action="deleteItem"]').click(ev => { 
        const li = $(ev.currentTarget).closest(".item"); 
        this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")]); 
    });

    html.find('[data-action="toggleEquip"]').change(this._onToggleEquip.bind(this));
    html.find('[data-action="toggleSummary"]').click(ev => {
        ev.preventDefault();
        const li = $(ev.currentTarget).closest(".item");
        li.find(".item-summary").slideToggle(200); 
    });

    html.find('[data-action="progressClick"]').click(this._onProgressBoxClick.bind(this));
    html.find('[data-action="spellUseClick"]').click(this._onSpellUseBoxClick.bind(this));
    html.find('[data-action="archiveCareer"]').click(this._onArchiveCareer.bind(this));

    html.find('[data-action="ignoreHandicap"]').click(async ev => {
        ev.preventDefault();
        const sf = Number(this.actor.system.sangfroid?.value) || 0;
        if (sf >= 2) {
            await this.actor.update({"system.sangfroid.value": sf - 2});
            ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: `<div class="brigandyne-roll" style="border: 2px solid #8b0000; padding: 10px; background: rgba(0,0,0,0.8);"><h3 style="color: #ffcccc; margin-bottom: 5px; border-bottom: 1px dashed #ffcccc; padding-bottom: 5px;"><i class="fas fa-fire-alt"></i> Dépassement de soi !</h3><p style="color: #e0e0e0; font-size: 1.1em; text-align: center; margin-top: 5px;"><strong>${this.actor.name}</strong> puise dans ses ultimes réserves et dépense <strong>2 points de Sang-Froid</strong> pour ignorer l'effet de ses handicaps !</p></div>` });
        } else { ui.notifications.warn("Pas assez de Sang-Froid !"); }
    });
  }

  async _onDrop(event) {
    // 🛑 INDISPENSABLE EN APPV2 : On bloque l'événement natif pour éviter les doublons fantômes
    event.preventDefault();
    event.stopPropagation();
    
    if (this.actor.getFlag("brigandyne2appv2", "sheetLocked")) {
        ui.notifications.warn("🔒 La fiche est verrouillée ! Déverrouillez-la pour ajouter un objet.");
        return false;
    }

    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    if (data.type !== "Item") return super._onDrop(event);

    if (data.uuid && data.uuid.startsWith(this.actor.uuid)) return super._onDrop(event);

    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    const isDuplicate = this.actor.items.some(i => i.name === itemData.name && i.type === itemData.type);
    if (isDuplicate) {
        ui.notifications.info(`L'objet ${itemData.name} est déjà sur la fiche.`);
        return false;
    }

    // ==========================================
    // RÉCUPÉRATION DES STATS & XP
    // ==========================================
    const magStat = this.actor.system.stats?.mag || {};
    const cnsStat = this.actor.system.stats?.cns || {};
    
    const magScore = magStat.total !== undefined ? magStat.total : (magStat.value || 0) + ((magStat.progression || 0) * 5);
    const cnsScore = cnsStat.total !== undefined ? cnsStat.total : (cnsStat.value || 0) + ((cnsStat.progression || 0) * 5);
    const cnsIndice = Math.floor(cnsScore / 10);
    const currentXP = this.actor.system.experience?.value || 0;

    // ==========================================
    // RÈGLES DES DOMAINES MAGIQUES
    // ==========================================
    if (itemData.type === "domaine") {
        let maxDomaines = 1;
        if (magScore >= 50 && magScore <= 69) maxDomaines = 2;
        else if (magScore >= 70 && magScore <= 89) maxDomaines = 3;
        else if (magScore >= 90 && magScore <= 99) maxDomaines = 4;
        else if (magScore >= 100) maxDomaines = 5;

        const nbDomaines = this.actor.items.filter(i => i.type === "domaine").length;
        if (nbDomaines >= maxDomaines) { 
            ui.notifications.error(`Limite de Domaines atteinte (${maxDomaines} max avec ${magScore} en MAG) !`); 
            return false; 
        }
    }

    // ==========================================
    // RÈGLES D'APPRENTISSAGE DE LA MAGIE
    // ==========================================
    if (itemData.type === "sort" && this.actor.type === "personnage") {
        
        const cleanType = (str) => (str || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const incomingType = cleanType(itemData.system.type_sort);
        const isTour = incomingType === "tour";

        const spellDiff = Number(itemData.system.difficulte) || 0;
        if (!isTour && (magScore + spellDiff) < 40) {
            ui.notifications.error(`Sort trop complexe ! (MAG ${magScore} + Diff ${spellDiff} = ${magScore + spellDiff}. Requis: >= 40).`);
            return false;
        }

        const domains = this.actor.items.filter(i => i.type === "domaine");
        const domainTexts = domains.map(d => d.system.description || "").join(" ");
        const cleanName = itemData.name.replace("☠️", "").trim();
        const isInDomain = domains.length > 0 && domainTexts.includes(cleanName);

        let nbTours = 0; let nbSorts = 0;
        for (let i of this.actor.items) {
            if (i.type === "sort") {
                const existingType = cleanType(i.system.type_sort);
                if (existingType === "tour") nbTours++;
                else if (existingType === "sortilege" || existingType === "rituel") nbSorts++;
            }
        }

        let isFree = false;
        if (isInDomain) {
            if (isTour && nbTours < cnsIndice) isFree = true;
            if (!isTour && nbSorts < cnsIndice) isFree = true;
        }

        if (!isFree) {
            let xpCost = isTour ? 50 : 100;
            let cause = [];
            
            if (isTour && nbTours >= cnsIndice) cause.push(`Limite initiale de Tours atteinte`);
            if (!isTour && nbSorts >= cnsIndice) cause.push(`Limite initiale de Sorts atteinte`);
            if (!isInDomain) {
                xpCost += 50; 
                cause.push("Sort Hors-Domaine (+50 XP)");
            }

            if (currentXP < xpCost) {
                ui.notifications.error(`Pas assez d'expérience ! Ce sort coûte ${xpCost} XP (${cause.join(", ")}).`);
                return false;
            }

            const confirm = await new Promise((resolve) => {
                new Dialog({
                    title: "Apprentissage d'un nouveau sort",
                    content: `<p>L'étude de <b>${itemData.name}</b> va vous demander du temps et de l'expérience.</p>
                              <ul style="color: #8b0000; font-weight: bold;">
                                <li>Coût : ${xpCost} XP</li>
                                <li style="font-weight: normal; font-size: 0.9em; font-style: italic;">Raison : ${cause.join(" | ")}</li>
                              </ul>
                              ${!isTour ? `<p><b>Attention :</b> Le système va automatiquement lancer un test de Connaissances (CNS) pour déterminer votre temps d'étude.</p>` : `<p>Les Tours s'apprennent automatiquement en 1 journée.</p>`}
                              <p>Voulez-vous payer les XP et débuter l'apprentissage ?</p>`,
                    buttons: {
                        yes: { icon: '<i class="fas fa-book-reader"></i>', label: "Payer et Étudier", callback: () => resolve(true) },
                        no: { icon: '<i class="fas fa-times"></i>', label: "Annuler", callback: () => resolve(false) }
                    },
                    default: "yes",
                    close: () => resolve(false)
                }).render(true);
            });

            if (!confirm) return false;

            await this.actor.update({"system.experience.value": currentXP - xpCost});

            if (!isTour) {
                let scoreTest = cnsScore + spellDiff;
                let finalScore = scoreTest;
                
                let roll1 = await new Roll("1d100").evaluate({async: true});
                let result = roll1.total;
                
                if (!isInDomain) {
                    let roll2 = await new Roll("1d100").evaluate({async: true});
                    result = Math.max(roll1.total, roll2.total);
                }

                let ru = result % 10;
                let isSuccess = result <= finalScore;
                let isCrit = ru === 0 && isSuccess;
                let isFumble = ru === 0 && !isSuccess;
                let isMajSuccess = isSuccess && result <= 9;
                let isMajFail = !isSuccess && result >= 91;

                let tempsApprentissage = "";
                let couleur = "#4CAF50";

                if (isSuccess) {
                    if (isCrit) tempsApprentissage = "1 jour (Réussite Critique !)";
                    else if (isMajSuccess) tempsApprentissage = `${Math.max(1, Math.floor(ru / 2))} jour(s) (Réussite Majeure)`;
                    else tempsApprentissage = `${ru} jour(s)`;
                } else {
                    couleur = "#b71c1c";
                    if (isFumble) tempsApprentissage = "Impossible d'apprendre pour le moment. Réessayez le mois prochain (Échec Critique !)";
                    else if (isMajFail) tempsApprentissage = `${ru * 2} semaine(s) (Échec Majeur)`;
                    else tempsApprentissage = `${ru} semaine(s)`;
                }

                let chatMsg = `
                <div style="background: rgba(0,0,0,0.05); border: 2px solid ${couleur}; padding: 10px; border-radius: 5px;">
                    <h3 style="color: ${couleur}; border-bottom: 1px solid ${couleur}; margin-bottom: 5px;">Étude de ${itemData.name}</h3>
                    <p><b>Seuil (CNS ${cnsScore} + Diff ${spellDiff}) :</b> ${finalScore}% ${!isInDomain ? '<br><i>(1 Désavantage : Hors-Domaine)</i>' : ''}</p>
                    <div style="text-align: center; font-size: 1.2em; font-weight: bold; margin: 10px 0;">Jet : ${result} ${isSuccess ? '✅' : '❌'}</div>
                    <p><b>Temps d'étude requis :</b> ${tempsApprentissage}</p>
                    ${!isSuccess ? `<p style="font-size: 0.8em; font-style: italic; color: #555;">(Le sort a tout de même été ajouté au grimoire, mais il ne sera utilisable qu'après cette période d'étude intensive.)</p>` : ''}
                </div>`;

                ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: chatMsg });
            } else {
                ui.notifications.info(`Le Tour ${itemData.name} a été maîtrisé en 1 journée d'entraînement.`);
            }
        }
    }

    // ==========================================
    // RÈGLES DES CARRIÈRES ET ORIGINES
    // ==========================================
    if (["origine", "archetype", "carriere"].includes(itemData.type)) {
        if (this.actor.type === "pnj") { ui.notifications.warn("Les PNJ n'ont pas ça !"); return false; }
        if (this.actor.items.some(i => i.type === itemData.type)) { ui.notifications.error(`Un(e) ${itemData.type} existe déjà !`); return false; }
    }

    const created = await Item.create(itemData, { parent: this.actor });
    
    // Automatisation de la création de l'Origine
    if (created && created.type === "origine") {
        let ptsDestin = Number(created.system.destin) || 0;
        if (ptsDestin > 0) {
            await this.actor.update({ "system.destin.value": ptsDestin });
            ui.notifications.info(`Destin initialisé à ${ptsDestin}.`);
        }

        const talentsText = created.system.talents_auto || "";
        const specialText = created.system.special || "";
        
        const allTraits = [talentsText, specialText].join(",")
            .split(",")
            .map(t => t.trim())
            .filter(t => t.length > 2); 

        if (allTraits.length > 0) {
            const atoutsToCreate = allTraits.map(nomAtout => ({
                name: nomAtout,
                type: "atout",
                img: "icons/svg/upgrade.svg",
                system: {
                    type_atout: "Talent",
                    description: `<p><em>Obtenu automatiquement via l'Origine : <b>${created.name}</b>. N'oubliez pas de lier cet atout à une caractéristique si nécessaire en l'éditant.</em></p>`
                }
            }));
            
            await this.actor.createEmbeddedDocuments("Item", atoutsToCreate);
            ui.notifications.info(`✨ ${atoutsToCreate.length} Atouts d'Origine créés automatiquement !`);
        }
    }
  }

  async _onDropItemCreate(itemData) {
        let items = Array.isArray(itemData) ? itemData : [itemData];
        
        const isStrictDomains = game.settings.get("brigandyne2appv2", "strictMagicDomains");
        const cnsTotal = this.actor.system.stats.cns?.total || 0;
        const cnsIndice = Math.floor(cnsTotal / 10); 
        
        const sortsInventaire = this.actor.items.filter(i => i.type === "sort");
        const nbTours = sortsInventaire.filter(i => i.system.type_sort === "tour").length;
        const nbSortsRituels = sortsInventaire.filter(i => i.system.type_sort !== "tour").length;

        const domains = this.actor.items.filter(i => i.type === "domaine");
        const domainTexts = domains.map(d => d.system.description || "").join(" ");
        
        items = items.filter(item => {
            if (item.type === "sort") {
                if (item.system?.type_sort === "tour") {
                    if (nbTours >= cnsIndice) {
                        ui.notifications.error(`🧠 Mémoire saturée ! Avec un indice de *CNS* de ${cnsIndice}, ${this.actor.name} ne peut pas mémoriser plus de ${cnsIndice} Tours de magie.`);
                        return false; 
                    }
                } else {
                    if (nbSortsRituels >= cnsIndice) {
                        ui.notifications.error(`🧠 Mémoire saturée ! Avec un indice de *CNS* de ${cnsIndice}, ${this.actor.name} ne peut pas mémoriser plus de ${cnsIndice} Sortilèges/Rituels au total.`);
                        return false; 
                    }
                }

                if (isStrictDomains) {
                    if (domains.length === 0) {
                        ui.notifications.error(`🛑 Ce personnage ne possède aucun Domaine Magique !`);
                        return false;
                    }
                    
                    const cleanName = item.name.replace("☠️", "").trim();
                    if (!domainTexts.includes(cleanName)) {
                        ui.notifications.error(`🛑 Le sort "${cleanName}" n'appartient à aucun Domaine connu par ce personnage.`);
                        return false;
                    }
                }
            }
            return true; 
        });
        
        if (items.length === 0) return false;
        return super._onDropItemCreate(items);
    }

  _onRoll(event) { event.preventDefault(); const dataset = event.currentTarget.dataset; if (dataset.key) this.actor.rollStat(dataset.key); }
  _onItemRoll(event) { event.preventDefault(); const itemId = event.currentTarget.closest(".item").dataset.itemId; if (itemId) this.actor.rollWeapon(itemId); }
  _onSpellRoll(event) { event.preventDefault(); const itemId = event.currentTarget.closest(".item").dataset.itemId; if (itemId) this.actor.rollSpell(itemId); }

  async _onItemCreate(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.type;
    let defaultImg = "icons/svg/mystery-rosette.svg"; 
    if (type === "arme") defaultImg = "icons/svg/sword.svg";
    else if (type === "armure") defaultImg = "icons/svg/shield.svg";
    else if (type === "sort") defaultImg = "icons/svg/book.svg";
    else if (type === "atout") defaultImg = "icons/svg/upgrade.svg";
    else if (type === "domaine") defaultImg = "icons/svg/daze.svg";
    return Item.create({ name: `Nouveau ${type}`, type: type, img: defaultImg }, {parent: this.actor});
  }

  async _onToggleEquip(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) await item.update({ "system.equipe": !item.system.equipe });
  }

  async _onProgressBoxClick(event) {
    event.preventDefault();
    const box = event.currentTarget;
    if (box.classList.contains("locked")) return;
    const statKey = box.dataset.stat;
    const clickedValue = parseInt(box.dataset.value);
    const stat = this.actor.system.stats[statKey];
    const currentProg = stat.progression || 0;
    let newProg = clickedValue === currentProg ? clickedValue - 1 : clickedValue;
    await this.actor.update({ [`system.stats.${statKey}.progression`]: newProg });
  }

  async _onSpellUseBoxClick(event) {
    event.preventDefault();
    const box = event.currentTarget;
    const type = box.dataset.type; 
    const clickedValue = parseInt(box.dataset.value);
    let currentUses = this.actor.system.magie?.uses?.[type] || 0;
    let newUses = clickedValue === currentUses ? clickedValue - 1 : clickedValue;
    await this.actor.update({ [`system.magie.uses.${type}`]: newUses });
  }

  async _onArchiveCareer(event) {
    event.preventDefault();
    const activeCarriere = this.actor.items.find(i => i.type === 'carriere');
    if (!activeCarriere) return ui.notifications.warn("Aucune carrière active à archiver !");
    const confirm = await Dialog.confirm({ title: "Archiver la carrière", content: `<p>Voulez-vous vraiment archiver la carrière <strong>${activeCarriere.name}</strong> ?</p>`, yes: () => true, no: () => false, defaultYes: false });
    if (!confirm) return;
    let history = this.actor.system.carrieres_historiques || "";
    history = history.trim() !== "" ? history + ", " + activeCarriere.name : activeCarriere.name;
    await this.actor.update({ "system.carrieres_historiques": history });
    await this.actor.deleteEmbeddedDocuments("Item", [activeCarriere.id]);
    ui.notifications.info(`Carrière ${activeCarriere.name} archivée.`);
  }
}