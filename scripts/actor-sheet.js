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
      const magIndice = context.system.stats.mag?.indice || 0; 
      const magScore = context.system.stats.mag?.total || 0;
      
      context.maxDomaines = 0;
      if (magScore >= 1 && magScore <= 49) context.maxDomaines = 1;
      else if (magScore >= 50 && magScore <= 69) context.maxDomaines = 2;
      else if (magScore >= 70 && magScore <= 89) context.maxDomaines = 3;
      else if (magScore >= 90 && magScore <= 99) context.maxDomaines = 4;
      else if (magScore >= 100) context.maxDomaines = 5;

      context.system.magie = context.system.magie || { uses: { tours: 0, sorts: 0, rituels: 0 } };
      const currentUses = context.system.magie.uses;

      context.toursBoxes = [];
      for (let i = 1; i <= magIndice; i++) { context.toursBoxes.push({ value: i, checked: i <= currentUses.tours }); }
      context.sortsBoxes = [];
      for (let i = 1; i <= magIndice; i++) { context.sortsBoxes.push({ value: i, checked: i <= currentUses.sorts }); }
      context.rituelBox = { checked: currentUses.rituels > 0 };
    }
    // Enrichissement du texte pour l'éditeur AppV2
      context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.biography || "", { async: true });

      // Savoir si la fiche est verrouillée (par défaut: non)
    context.isLocked = this.actor.getFlag("brigandyne2appv2", "sheetLocked") || false;

    // PRÉPARATION DES CASES À COCHER DE MAGIE
        const magIndice = Math.floor((this.actor.system.stats.mag?.total || 0) / 10);
        const uses = this.actor.getFlag("brigandyne2appv2", "magicUses") || { tour: 0, sortilege: 0, rituel: 0 };
        
        context.toursBoxes = Array.from({length: magIndice}, (_, i) => ({ value: i + 1, checked: i < uses.tour }));
        context.sortsBoxes = Array.from({length: magIndice}, (_, i) => ({ value: i + 1, checked: i < uses.sortilege }));
        context.rituelBox = { value: 1, checked: uses.rituel > 0 };

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
    
    // Au redessin, on restaure l'onglet mémorisé
    html.find(`[data-action="changeTab"][data-tab="${this._activeTab}"]`).addClass('active');
    html.find('.tab').hide();
    html.find(`.tab.${this._activeTab}`).show();

    // C. Réparation des Jets de dés et Boutons (Ciblage data-action)
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
    // CLIC SUR LES CASES DE MAGIE
        html.find('.spell-box').click(async ev => {
            ev.preventDefault();
            const typeBox = ev.currentTarget.dataset.type; // "tours", "sorts" ou "rituels"
            const clickedValue = parseInt(ev.currentTarget.dataset.value);
            
            const uses = this.actor.getFlag("brigandyne2appv2", "magicUses") || { tour: 0, sortilege: 0, rituel: 0 };
            
            // Correspondance entre ton dataset HTML et la clé de notre Flag
            const flagKey = typeBox === "tours" ? "tour" : (typeBox === "sorts" ? "sortilege" : "rituel");
            
            // Si on clique sur la case qui est actuellement la limite, on la décoche (on retire 1). Sinon, on coche jusqu'à cette valeur.
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
        // 1. On autorise le survol de la fiche
        this.element.ondragover = (event) => {
            event.preventDefault();
        };
        
        // 2. On intercepte le "lâcher"
        this.element.ondrop = (event) => {
            event.preventDefault();
            // 🛑 LE BOUCLIER ANTI-CLONES POUR LA V13 EST ICI :
            event.stopPropagation(); 
            
            // On appelle ta fonction personnalisée !
            this._onDrop(event);
        };
    }
    // D. Clic sur le cadenas (Verrouillage)
    html.find('[data-action="toggleLock"]').click(async ev => {
        ev.preventDefault();
        const currentLock = this.actor.getFlag("brigandyne2appv2", "sheetLocked") || false;
        await this.actor.setFlag("brigandyne2appv2", "sheetLocked", !currentLock);
    });

    // On applique la classe CSS "locked" sur toute la fiche si elle est verrouillée
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
            
            // Sécurité : on demande confirmation
            const confirmRest = await Dialog.confirm({
                title: "Repos du Mage",
                content: `<p><b>${this.actor.name}</b> s'est-il reposé au moins 8 heures ?</p><p><i>Cela remettra ses compteurs d'utilisations de sorts (Tours, Sortilèges et Rituels) à zéro.</i></p>`,
                yes: () => true,
                no: () => false,
                defaultYes: false
            });

            // Si le joueur confirme "Oui"
            if (confirmRest) {
                await this.actor.setFlag("brigandyne2appv2", "magicUses", { tour: 0, sortilege: 0, rituel: 0 });
                ui.notifications.info(`✨ L'esprit de ${this.actor.name} est apaisé. Ses limites magiques sont réinitialisées !`);
            }
        });
    }

    html.find('[data-action="rollStat"]').click(this._onRoll.bind(this));
    html.find('[data-action="rollWeapon"]').click(this._onItemRoll.bind(this));
    html.find('[data-action="rollSpell"]').click(this._onSpellRoll.bind(this));
    
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
    
    // 🛑 INDISPENSABLE EN APPV2 : On bloque l'événement natif pour éviter les doublons fantômes !
    event.preventDefault();
    event.stopPropagation();
    
    // 0. Sécurité : empêcher le drop si la fiche est verrouillée
    if (this.actor.getFlag("brigandyne2appv2", "sheetLocked")) {
        ui.notifications.warn("🔒 La fiche est verrouillée ! Déverrouillez-la pour ajouter un objet.");
        return false;
    }

    // 1. Récupération des données du lâcher
    const data = TextEditor.getDragEventData(event);
    if (data.type !== "Item") return super._onDrop(event);

    // 2. Si l'objet provient DÉJÀ de la fiche, on laisse Foundry faire le tri
    if (data.uuid && data.uuid.startsWith(this.actor.uuid)) return super._onDrop(event);

    // 3. Récupération des données de l'objet
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    // 4. Anti-doublon strict
    const isDuplicate = this.actor.items.some(i => i.name === itemData.name && i.type === itemData.type);
    if (isDuplicate) {
        ui.notifications.info(`L'objet ${itemData.name} est déjà sur la fiche.`);
        return false;
    }

    // ==========================================
    // CALCUL ROBUSTE DES STATS
    // ==========================================
    const magStat = this.actor.system.stats?.mag || {};
    const cnsStat = this.actor.system.stats?.cns || {};

    const magScore = magStat.total !== undefined ? magStat.total : (magStat.value || 0) + ((magStat.progression || 0) * 5);
    const cnsScore = cnsStat.total !== undefined ? cnsStat.total : (cnsStat.value || 0) + ((cnsStat.progression || 0) * 5);
    const cnsIndice = Math.floor(cnsScore / 10);

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
    // RÈGLES STRICTES DE LA MAGIE (SORTS)
    // ==========================================
    if (itemData.type === "sort") {
        const isPJ = this.actor.type === "personnage";
        
        if (isPJ) {
            // Normalisation : On force les minuscules et on retire les espaces pour éviter les bugs
            const incomingType = (itemData.system.type_sort || "").trim().toLowerCase();
            const isTour = incomingType === "tour";
            
            let nbTours = 0;
            let nbSorts = 0;
            
            // On recompte tout proprement
            for (let i of this.actor.items) {
                if (i.type === "sort") {
                    const existingType = (i.system.type_sort || "").trim().toLowerCase();
                    if (existingType === "tour") nbTours++;
                    else nbSorts++;
                }
            }

            // 👁️ LE MOUCHARD : Affiche ce que voit le système dans la console (F12)
            console.log(`[Magie Drop] CNS Indice: ${cnsIndice} | Tours connus: ${nbTours} | Sorts connus: ${nbSorts} | Drop type: ${incomingType}`);

            // A. Limite d'apprentissage (*CNS*)
            if (isTour && nbTours >= cnsIndice) {
                ui.notifications.warn(`Attention : Limite d'apprentissage de Tours dépassée (*CNS* : ${cnsIndice}).`);
                return false;
            }
            if (!isTour && nbSorts >= cnsIndice) {
                ui.notifications.warn(`Attention : Limite d'apprentissage de Sorts dépassée (*CNS* : ${cnsIndice}).`);
                return false;
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

    // 5. Création finale de l'objet
    const created = await Item.create(itemData, { parent: this.actor });
    
    if (created && created.type === "origine") {
        let ptsDestin = Number(created.system.destin) || 0;
        if (ptsDestin > 0) {
            await this.actor.update({ "system.destin.value": ptsDestin });
            ui.notifications.info(`Destin initialisé à ${ptsDestin}.`);
        }
    }
  }
  async _onDropItemCreate(itemData) {
        let items = Array.isArray(itemData) ? itemData : [itemData];
        
        // --- VARIABLES GLOBALES DE MAGIE ---
        const isStrictDomains = game.settings.get("brigandyne2appv2", "strictMagicDomains");
        
        // 1. On calcule l'Indice de CNS (*CNS*)
        const cnsTotal = this.actor.system.stats.cns?.total || 0;
        const cnsIndice = Math.floor(cnsTotal / 10); // C'est ça la vraie limite !
        
        // 2. On compte combien de sorts le PJ possède déjà dans chaque catégorie
        const sortsInventaire = this.actor.items.filter(i => i.type === "sort");
        const nbTours = sortsInventaire.filter(i => i.system.type_sort === "tour").length;
        const nbSortsRituels = sortsInventaire.filter(i => i.system.type_sort !== "tour").length;

        // 3. On prépare les Domaines pour la vérification
        const domains = this.actor.items.filter(i => i.type === "domaine");
        const domainTexts = domains.map(d => d.system.description || "").join(" ");
        
        items = items.filter(item => {
            if (item.type === "sort") {
                
                // ==========================================
                // VÉRIFICATION 1 : LA LIMITE D'APPRENTISSAGE (*CNS*)
                // ==========================================
                if (item.system?.type_sort === "tour") {
                    if (nbTours >= cnsIndice) {
                        ui.notifications.error(`🧠 Mémoire saturée ! Avec un indice de *CNS* de ${cnsIndice}, ${this.actor.name} ne peut pas mémoriser plus de ${cnsIndice} Tours de magie.`);
                        return false; // Bloque l'ajout
                    }
                } else {
                    if (nbSortsRituels >= cnsIndice) {
                        ui.notifications.error(`🧠 Mémoire saturée ! Avec un indice de *CNS* de ${cnsIndice}, ${this.actor.name} ne peut pas mémoriser plus de ${cnsIndice} Sortilèges/Rituels au total.`);
                        return false; // Bloque l'ajout
                    }
                }

                // ==========================================
                // VÉRIFICATION 2 : LE DOMAINE (Bouclier Anti-Triche)
                // ==========================================
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
            
            return true; // Tout est en règle, on l'ajoute !
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
