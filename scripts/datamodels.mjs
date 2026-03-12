const { HTMLField, StringField, NumberField, SchemaField, BooleanField, ArrayField, ObjectField } = foundry.data.fields;

// ==========================================
// SCHÉMA DES ACTIVITÉS (Moteur Universel)
// ==========================================
const ActivitySchema = new SchemaField({
    id: new StringField({ required: true, blank: false, initial: () => foundry.utils.randomID() }),
    nom: new StringField({ initial: "Nouvelle action" }),
    type: new StringField({ choices: ["attaque", "soin", "utilitaire", "talent", "buff"], initial: "utilitaire" }),
    cout: new SchemaField({
        valeur: new NumberField({ initial: 0, integer: true, min: 0 }),
        ressource: new StringField({ choices: ["aucun", "pv", "sf", "utilisation"], initial: "aucun" })
    }),
    utilisations: new SchemaField({
        value: new NumberField({ initial: 0, integer: true, min: 0 }),
        max: new NumberField({ initial: 0, integer: true, min: 0 }),
        frequence: new StringField({ choices: ["toujours", "combat", "jour", "session", "permanent"], initial: "toujours" })
    }),
    effet: new SchemaField({
        formule_jet: new StringField({ initial: "" }),
        degats: new StringField({ initial: "" }),
        applique_etat: new StringField({ initial: "" }),
        sauvegarde: new SchemaField({
            stat: new StringField({ initial: "" }),
            mod: new NumberField({ initial: 0, integer: true })
        }),
        buff: new SchemaField({
            stat: new StringField({ initial: "" }),
            valeur: new NumberField({ initial: 0, integer: true })
        })
    })
});

// ==========================================
// SCHÉMAS DES ACTEURS (Personnages & PNJ)
// ==========================================
export class PersonnageData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            stats: new SchemaField({
                com: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Combat" }) }),
                cns: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Connaissances" }) }),
                dis: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Discrétion" }) }),
                end: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Endurance" }) }),
                for: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Force" }) }),
                hab: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Habileté" }) }),
                mag: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Magie" }) }),
                mou: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Mouvement" }) }),
                per: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Perception" }) }),
                soc: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Sociabilité" }) }),
                sur: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Survie" }) }),
                tir: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Tir" }) }),
                vol: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), progression: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Volonté" }) })
            }),
            vitalite: new ObjectField({ initial: { value: 0, max: 0 } }),
            sangfroid: new ObjectField({ initial: { value: 0, max: 0 } }),
            destin: new ObjectField({ initial: { value: 0, max: 0 } }),
            experience: new ObjectField({ initial: { value: 0 } }),
            vices: new ObjectField({ initial: {} }),
            magie: new ObjectField({ initial: { uses: { tours: 0, sorts: 0, rituels: 0 } } }),
            options: new ObjectField({ initial: { malus_armure: true } }),
            handicaps: new ObjectField({ initial: {} }),
            biography: new HTMLField({ initial: "" }),
            carrieres_historiques: new StringField({ initial: "" })
        };
    }
}

export class PnjData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            type_pnj: new StringField({ initial: "sbire" }),
            stats: new SchemaField({
                com: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Combat" }) }),
                cns: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Connaissances" }) }),
                dis: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Discrétion" }) }),
                end: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Endurance" }) }),
                for: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Force" }) }),
                hab: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Habileté" }) }),
                mag: new SchemaField({ value: new NumberField({ initial: 0, integer: true }), label: new StringField({ initial: "Magie" }) }),
                mou: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Mouvement" }) }),
                per: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Perception" }) }),
                soc: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Sociabilité" }) }),
                sur: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Survie" }) }),
                tir: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Tir" }) }),
                vol: new SchemaField({ value: new NumberField({ initial: 30, integer: true }), label: new StringField({ initial: "Volonté" }) })
            }),
            vitalite: new ObjectField({ initial: { value: 0, max: 0 } }),
            sangfroid: new ObjectField({ initial: { value: 0, max: 0 } }),
            options: new ObjectField({ initial: { malus_armure: true } }),
            handicaps: new ObjectField({ initial: {} }),
            biography: new HTMLField({ initial: "" })
        };
    }
}

// ==========================================
// SCHÉMAS DES OBJETS (Inventaire & Magie)
// ==========================================
export class ArmeData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            equipe: new BooleanField({ initial: false }),
            type_arme: new StringField({ initial: "melee" }),
            allonge: new StringField({ initial: "C" }),
            portee: new StringField({ initial: "courte" }), // Ajout de la portée
            utilise_force: new BooleanField({ initial: false }),
            degats_fixe: new NumberField({ initial: 0, integer: true }),
            malus_init: new NumberField({ initial: 0, integer: true }),
            mains: new StringField({ initial: "1 main" }),
            special: new StringField({ initial: "" }),
            specificites: new ObjectField({
                initial: {
                    // Mêlée
                    anti_cavalier: false, armure_div_2: false, brise_lames: false, charge: false, choc: false,
                    corps_a_corps: false, degats_temporaires: false, destruction: false, espace: false,
                    fragile: false, ignore_armures_souples: false, ignore_boucliers: false,
                    immobilisation: false, point_faible: false, poison: false, risquee: false, saisie: false,
                    // Distance
                    assommante: false, maniable: false, peu_precise: false, lente_2: false, lente_5: false,
                    rplus_2e_tir: false, poudre: false
                }
            }),
            description: new HTMLField(),
            activities: new ObjectField({ initial: {} })
        };
    }
}

export class ArmureData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return { 
            equipe: new BooleanField({ initial: false }), 
            type_armure: new StringField({ choices: ["armure", "bouclier", "casque"], initial: "armure" }),

            souple: new BooleanField({ initial: false }), 
            partielle: new BooleanField({ initial: false }), 
            chaude_fatigante: new BooleanField({ initial: false }), 
            lente_equiper: new BooleanField({ initial: false }), 
            
            couvert_tirs: new NumberField({ initial: 0, integer: true, min: 0, max: 2 }), 
            
            protection: new NumberField({ initial: 0, integer: true }), 
            malus_init: new NumberField({ initial: 0, integer: true }), 
            malus_mou: new NumberField({ initial: 0, integer: true }), 
            malus_per: new NumberField({ initial: 0, integer: true }), 
            
            description: new HTMLField(), 
            activities: new ObjectField({ initial: {} }) 
        };
    }
}

export class ObjetData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return { 
            quantite: new NumberField({ initial: 1, integer: true }), 
            encombrement: new NumberField({ initial: 0, integer: true }), 
            prix: new StringField({ initial: "" }), 
            description: new HTMLField(), 
            activities: new ObjectField({ initial: {} }) 
        };
    }
}

export class SortData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return { 
            type_sort: new StringField({ initial: "sortilege" }), 
            domaine: new StringField({ initial: "" }), 
            difficulte: new NumberField({ initial: 0, integer: true }), 
            portee: new StringField({ initial: "Courte" }), 
            duree: new StringField({ initial: "" }), 
            resistance: new StringField({ initial: "" }), 
            formule: new StringField({ initial: "" }), 
            r_plus: new StringField({ initial: "" }), 
            description: new HTMLField(), 
            activities: new ObjectField({ initial: {} }) 
        };
    }
}

export class AtoutData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return { 
            type_atout: new StringField({ initial: "Talent" }), 
            specialite: new StringField({ initial: "" }), 
            talent: new StringField({ initial: "" }), 
            stat_liee: new StringField({ initial: "" }), 
            armeLieeId: new StringField({initial: ""}),
            bonus: new NumberField({ initial: 0, integer: true }), 
            effet: new StringField({ initial: "" }), 
            description: new HTMLField(), 
            activities: new ObjectField({ initial: {} }) 
        };
    }
}

export class DomaineData extends foundry.abstract.TypeDataModel {
    static defineSchema() { 
        return { 
            spells: new ArrayField(new ObjectField()), 
            description: new HTMLField(), 
            activities: new ObjectField({ initial: {} }) 
        }; 
    }
}

// ==========================================
// SCHÉMAS D'ÉVOLUTION (Création de perso)
// ==========================================
export class OrigineData extends foundry.abstract.TypeDataModel {
    static defineSchema() { 
        return { 
            bonus_vit: new NumberField({ initial: 0, integer: true }), 
            bonus_sf: new NumberField({ initial: 0, integer: true }), 
            destin: new NumberField({ initial: 0, integer: true }), 
            talents_auto: new StringField({ initial: "" }), 
            special: new StringField({ initial: "" }), 
            limitation: new StringField({ initial: "" }), 
            stats: new ObjectField({ initial: {} }), 
            description: new HTMLField() 
        }; 
    }
}

export class ArchetypeData extends foundry.abstract.TypeDataModel {
    static defineSchema() { 
        return { 
            vices_vertus: new StringField({ initial: "" }), 
            talents: new StringField({ initial: "" }), 
            stats: new ObjectField({ initial: {} }), 
            description: new HTMLField() 
        }; 
    }
}

export class CarriereData extends foundry.abstract.TypeDataModel {
    static defineSchema() { 
        return { 
            groupe: new StringField({ initial: "" }), 
            specialites: new StringField({ initial: "" }), 
            talents: new StringField({ initial: "" }), 
            equipement: new StringField({ initial: "" }), 
            stats: new ObjectField({ initial: {} }), 
            description: new HTMLField() 
        }; 
    }

}

