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
    // 1. Récupération des données du lâcher
    const data = TextEditor.getDragEventData(event);
    
    // 2. Si ce n'est pas un Item (ex: ActiveEffect, Macro), on laisse Foundry gérer
    if (data.type !== "Item") {
        return super._onDrop(event);
    }

    // 3. SÉCURITÉ ET TRI : Si l'objet provient DÉJÀ de la fiche de ce personnage 
    // (parce que le joueur essaie de trier/déplacer la ligne), on laisse Foundry faire le tri.
    if (data.uuid && data.uuid.startsWith(this.actor.uuid)) {
        return super._onDrop(event);
    }

    // --- 4. LOGIQUE DE VÉRIFICATION (Création d'un nouvel objet) ---
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    const magScore = this.actor.system.stats?.mag?.total || 0;
    const cnsIndice = this.actor.system.stats?.cns?.indice || 0; 
        
    let maxDomaines = 1;
    if (magScore >= 50 && magScore <= 69) maxDomaines = 2;
    else if (magScore >= 70 && magScore <= 89) maxDomaines = 3;
    else if (magScore >= 90 && magScore <= 99) maxDomaines = 4;
    else if (magScore >= 100) maxDomaines = 5;

    // Anti-doublon strict pour éviter de glisser deux fois la même épée
    const isDuplicate = this.actor.items.some(i => i.name === itemData.name && i.type === itemData.type);
    if (isDuplicate) {
        ui.notifications.info(`L'objet ${itemData.name} est déjà sur la fiche.`);
        return false;
    }

    if (itemData.type === "domaine") {
        const nbDomaines = this.actor.items.filter(i => i.type === "domaine").length;
        if (nbDomaines >= maxDomaines) { ui.notifications.error(`Limite de domaines atteinte (${maxDomaines}) !`); return false; }
    }

    if (itemData.type === "sort") {
        const isTour = itemData.system.type_sort === "tour";
        const nbTours = this.actor.items.filter(i => i.type === "sort" && i.system.type_sort === "tour").length;
        const nbSorts = this.actor.items.filter(i => i.type === "sort" && i.system.type_sort !== "tour").length;

        if (isTour && nbTours >= cnsIndice) ui.notifications.warn(`Attention : Limite de création de Tours dépassée.`);
        if (!isTour && nbSorts >= cnsIndice) ui.notifications.warn(`Attention : Limite de création de Sorts dépassée.`);
    }

    if (["origine", "archetype", "carriere"].includes(itemData.type)) {
        if (this.actor.type === "pnj") { ui.notifications.warn("Les PNJ n'ont pas ça !"); return false; }
        if (this.actor.items.some(i => i.type === itemData.type)) { ui.notifications.error(`Un(e) ${itemData.type} existe déjà !`); return false; }
    }

    // 5. Création manuelle de l'objet
    const created = await Item.create(itemData, { parent: this.actor });
    if (created && created.type === "origine") {
        let ptsDestin = Number(created.system.destin) || 0;
        if (ptsDestin > 0) {
            await this.actor.update({ "system.destin.value": ptsDestin });
            ui.notifications.info(`Destin initialisé à ${ptsDestin}.`);
        }
    }
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