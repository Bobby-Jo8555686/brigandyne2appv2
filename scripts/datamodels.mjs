const { HTMLField, StringField, NumberField, BooleanField, SchemaField } = foundry.data.fields;

// Petite fonction pour éviter de réécrire 13 fois la même chose pour les stats
const StatField = (labelStr) => new SchemaField({
    value: new NumberField({ initial: 25, min: 0, integer: true }),
    progression: new NumberField({ initial: 0, min: 0, max: 6, integer: true }),
    label: new StringField({ initial: labelStr })
});

// -----------------------------------------
// 1. LE MODÈLE DE BASE (Commun aux PJ et PNJ)
// -----------------------------------------
class BrigandyneActorBase extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            stats: new SchemaField({
                com: StatField("Combat"),
                cns: StatField("Connaissances"),
                dis: StatField("Discrétion"),
                end: StatField("Endurance"),
                for: StatField("Force"),
                hab: StatField("Habileté"),
                mag: StatField("Magie"),
                mou: StatField("Mouvement"),
                per: StatField("Perception"),
                soc: StatField("Sociabilité"),
                sur: StatField("Survie"),
                tir: StatField("Tir"),
                vol: StatField("Volonté")
            }),
            vitalite: new SchemaField({
                value: new NumberField({ initial: 0, min: 0, integer: true }),
                max: new NumberField({ initial: 0, min: 0, integer: true })
            }),
            sangfroid: new SchemaField({
                value: new NumberField({ initial: 0, min: 0, integer: true }),
                max: new NumberField({ initial: 0, min: 0, integer: true })
            }),
            initiative: new SchemaField({
                value: new NumberField({ initial: 0, integer: true })
            }),
            protection: new SchemaField({
                value: new NumberField({ initial: 0, min: 0, integer: true })
            }),
            options: new SchemaField({
                malus_armure: new BooleanField({ initial: true })
            }),
            handicaps: new SchemaField({
                aveugle: new BooleanField({ initial: false }),
                affaibli: new BooleanField({ initial: false }),
                affame: new BooleanField({ initial: false }),
                demoralise: new BooleanField({ initial: false })
            }),
            biography: new HTMLField({ initial: "" })
        };
    }
}

// -----------------------------------------
// 2. LE MODÈLE DU PERSONNAGE (PJ)
// -----------------------------------------
export class PersonnageData extends BrigandyneActorBase {
    static defineSchema() {
        const common = super.defineSchema();
        return {
            ...common, // On récupère toutes les stats de base
            destin: new SchemaField({
                value: new NumberField({ initial: 0, min: 0, integer: true }),
                max: new NumberField({ initial: 0, min: 0, integer: true })
            }),
            experience: new SchemaField({
                value: new NumberField({ initial: 0, min: 0, integer: true })
            }),
            experience: new SchemaField({
                value: new NumberField({ initial: 0, min: 0, integer: true })
            }),
            vices: new SchemaField({
                avare: new NumberField({ initial: 0, integer: true }),
                colerique: new NumberField({ initial: 0, integer: true }),
                cruel: new NumberField({ initial: 0, integer: true }),
                envieux: new NumberField({ initial: 0, integer: true }),
                gourmand: new NumberField({ initial: 0, integer: true }),
                lache: new NumberField({ initial: 0, integer: true }),
                luxurieux: new NumberField({ initial: 0, integer: true }),
                orgueilleux: new NumberField({ initial: 0, integer: true }),
                paresseux: new NumberField({ initial: 0, integer: true }),
                trompeur: new NumberField({ initial: 0, integer: true })
            }),
            magie: new SchemaField({
                uses: new SchemaField({
                    tours: new NumberField({ initial: 0, min: 0, integer: true }),
                    sorts: new NumberField({ initial: 0, min: 0, integer: true }),
                    rituels: new NumberField({ initial: 0, min: 0, integer: true })
                })
            }),
            carrieres_historiques: new StringField({ initial: "" })
        };
    }
}

// -----------------------------------------
// 3. LE MODÈLE DU PNJ
// -----------------------------------------
export class PnjData extends BrigandyneActorBase {
    static defineSchema() {
        const common = super.defineSchema();
        return {
            ...common,
            // On autorise enfin les vrais types de PNJ !
            type_pnj: new StringField({ 
                initial: "intermediaire", 
                choices: ["sbire", "intermediaire", "boss", "creature"] 
            })
        };
    }
}
