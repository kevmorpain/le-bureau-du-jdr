import { describe, it, expect, beforeAll } from 'vitest'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import {
  bootstrapGoldenDb,
  serializeCharacter,
  OWNER,
  CLASS,
  SUBCLASS,
  SPECIES,
  BACKGROUND,
  ITEM,
  SPELL,
  FEATURE,
  type GoldenIds,
} from './fixtures/goldenMaster'

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN-MASTER — filet d'équivalence création / level-up (docs/consolidation-2014.md,
// dernière étape de P0, AVANT F2).
//
// On fige la sortie NORMALISÉE de `createCharacter` + `characterLevelUp` pour les quatre
// archétypes du plan, sur un catalogue « édition 5 » (2014) représentatif (cf. fixtures/
// goldenMaster.ts). Chaque instantané résout les clés étrangères en noms et retire les id
// auto-incrément / horodatages → lisible et déterministe. Quand F2 généralisera
// `progression`/`character_choices` à tout le 2014 (aujourd'hui les choix de classe — ASI,
// style, sous-classe, expertise — sont front-dupliqués, hors DB), le `git diff` du fichier de
// snapshot montrera EXACTEMENT ce que le comportement serveur change. Un diff INATTENDU = une
// régression ; un diff ATTENDU se relit et se re-génère (`vitest -u`) en connaissance de cause.
//
// Env `nuxt` (comme createCharacter.test / buildCatalog.test) : les utils importent `~~/...`.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let ids: GoldenIds

beforeAll(async () => {
  ;({ db, ids } = await bootstrapGoldenDb())
}, 60000)

// Helpers — valident l'entrée par les schémas Zod de prod (mêmes portes que les handlers).
const create = (over: Record<string, unknown>) => createCharacter(db, createCharacterSchema.parse({
  name: 'X', maxHp: 10, classId: CLASS.fighter, level: 1, speciesId: SPECIES.human,
  abilityScores: {}, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
  ...over,
}), OWNER)
const levelUp = (id: number, over: Record<string, unknown>) => characterLevelUp(db, id, levelUpSchema.parse({
  classId: CLASS.fighter, isMulticlass: false, hpGained: 1, ...over,
}))

// ── A. Martial — Guerrier → Champion (niv 1 → 5) ───────────────────────────────
describe('golden-master · A. Guerrier Champion (martial)', () => {
  it('création niv 1 puis montée 1→5 (Fougue, sous-classe niv 3, ASI niv 4, Attaque suppl. niv 5)', async () => {
    const { id } = await create({
      name: 'Aldric', maxHp: 12, classId: CLASS.fighter, level: 1,
      backgroundId: BACKGROUND.soldier,
      abilityScores: { str: 16, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      classSkills: ['athletics', 'intimidation'],
      classSavingThrows: ['str', 'con'],
      backgroundSkills: ['perception', 'survival'],
      // Maîtrises d'armes/armures : champs vestigiaux (volet B) — ne doivent PAS se matérialiser.
      weaponProficiencyKeys: ['simple_weapons', 'martial_weapons'],
      armorProficiencyKeys: ['all_armor', 'shield'],
      toolProficiencyChoices: ['Jeu de cartes'],
      selectedLanguages: ['Orc'],
      inventoryItemIds: [ITEM.longsword],
    })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('A1 · création niv 1')

    await levelUp(id, { classId: CLASS.fighter, hpGained: 7 })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('A2 · niv 2 (Fougue)')

    await levelUp(id, { classId: CLASS.fighter, hpGained: 6, subclassId: SUBCLASS.champion })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('A3 · niv 3 (sous-classe Champion)')

    await levelUp(id, { classId: CLASS.fighter, hpGained: 6, asiChoice: 'asi', asiBonuses: { str: 2 } })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('A4 · niv 4 (ASI +2 FOR)')

    await levelUp(id, { classId: CLASS.fighter, hpGained: 6 })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('A5 · niv 5 (Attaque supplémentaire)')
  })
})

// ── B. Lanceur complet — Magicien Elfe / École d'Évocation (niv 2 → 4) ─────────
// Elfe base + lignée Haut-elfe : exerce le SEUL chemin `character_choices` déjà présent en 2014
// (le mécanisme même que F2 généralisera), en plus des emplacements dérivés et du sort appris.
describe('golden-master · B. Magicien Elfe (lanceur complet, lignée)', () => {
  it('création niv 2 (lignée → character_choices, sous-classe, emplacements) puis montée 2→4 (sort appris, ASI)', async () => {
    const { id } = await create({
      name: 'Elyndra', maxHp: 8, classId: CLASS.wizard, level: 2,
      speciesId: ids.elfBaseId, selectedLineageId: ids.highElfLineageId,
      customBackgroundName: 'Sage de la tour',
      abilityScores: { str: 8, dex: 14, con: 13, int: 16, wis: 12, cha: 10 },
      classSkills: ['arcana', 'investigation'],
      classSavingThrows: ['int', 'wis'],
      backgroundSkills: ['history', 'insight'],
      subclassId: SUBCLASS.evocation,
      spellIds: [SPELL.fireBolt, SPELL.magicMissile],
    })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('B1 · création niv 2 (lignée Haut-elfe)')

    await levelUp(id, { classId: CLASS.wizard, hpGained: 5, newSpellIds: [SPELL.shield] })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('B2 · niv 3 (Bouclier appris, emplacements recalculés)')

    await levelUp(id, { classId: CLASS.wizard, hpGained: 5, asiChoice: 'asi', asiBonuses: { int: 2 } })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('B3 · niv 4 (ASI +2 INT)')
  })
})

// ── C. Occultiste — pacte / manifestations / arcanum + ASI & dons à la création ─
// Créé niv 10 : exerce aussi les ASI et dons À LA CRÉATION (character_ability_score_improvements
// + character_features source 'asi'/'bonus') — chemin de création que F2 refactore, non couvert
// ailleurs par le golden-master.
describe('golden-master · C. Occultiste (pacte, manifestations, arcanum, ASI/dons création)', () => {
  it('création niv 10 (pacte + manifestations + ASI niv 4, don niv 8, don bonus) puis montée 10→11 (arcanum niv 6)', async () => {
    const { id } = await create({
      name: 'Vex', maxHp: 60, classId: CLASS.warlock, level: 10,
      abilityScores: { str: 8, dex: 14, con: 14, int: 10, wis: 11, cha: 17 },
      classSkills: ['arcana', 'deception'],
      classSavingThrows: ['wis', 'cha'],
      backgroundSkills: ['intimidation', 'investigation'],
      pactBoon: 'chain',
      invocationIds: [130, 131], // Regard de deux esprits + Armure des ombres (octroie « Armure de mage »)
      // Paliers d'ASI de l'Occultiste (4 et 8) matérialisés à la création :
      asiBonuses: [{ classLevel: 4, ability: 'cha', amount: 2 }], // +2 CHA au niv 4
      asiFeats: [{ classLevel: 8, featureId: FEATURE.featAlert }], // don « Vigilant » au niv 8 (source 'asi')
      bonusFeatureId: FEATURE.featTough, // don bonus homebrew MJ (source 'bonus')
    })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('C1 · création niv 10 (pacte + manifestations + ASI/dons)')

    await levelUp(id, {
      classId: CLASS.warlock, hpGained: 6,
      newInvocationIds: [132], // Maître des masques (niv 5)
      arcaneMysteriumSpellId: SPELL.circleOfDeath, // arcanum niveau 6
    })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('C2 · niv 11 (manifestation ajoutée + arcanum niv 6)')
  })
})

// ── D. Multiclasse — Guerrier 3 / Occultiste 2 ─────────────────────────────────
describe('golden-master · D. Multiclasse Guerrier/Occultiste', () => {
  it('création Guerrier 3 (Champion) puis multiclassage Occultiste (emplacements de pacte combinés)', async () => {
    const { id } = await create({
      name: 'Kael', maxHp: 28, classId: CLASS.fighter, level: 3,
      backgroundId: BACKGROUND.soldier,
      abilityScores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 14 },
      classSkills: ['athletics', 'acrobatics'],
      classSavingThrows: ['str', 'con'],
      backgroundSkills: ['intimidation', 'perception'],
      subclassId: SUBCLASS.champion,
    })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('D1 · création Guerrier 3 (Champion)')

    // Multiclassage : nouvelle classe Occultiste au niveau 1 (isMain=false).
    await levelUp(id, { classId: CLASS.warlock, isMulticlass: true, hpGained: 5 })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('D2 · Occultiste 1 (multiclassage, pacte combiné)')

    // Occultiste 1 → 2 : « Manifestations occultes » débloquées, emplacement de pacte agrandi.
    await levelUp(id, { classId: CLASS.warlock, hpGained: 5, newInvocationIds: [130] })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('D3 · Occultiste 2 (manifestation)')
  })
})

// ── E. Roublard — expertise + nouvelles compétences au level-up (niv 1 → 3) ────
// Exerce les chemins de choix « compétences » du level-up qu'aucun autre archétype ne touche :
//  - `expertiseSkills` → upsert d'une compétence de classe existante vers proficiencyLevel 'expert' ;
//  - `newSkills` → insertion d'une nouvelle compétence ;
//  - une sous-classe posée au level-up (Voleur, niv 3).
describe('golden-master · E. Roublard (expertise, nouvelles compétences)', () => {
  it('création niv 1 puis montée 1→3 (Ruse niv 2, sous-classe niv 3 + expertise + compétence apprise)', async () => {
    const { id } = await create({
      name: 'Sly', maxHp: 9, classId: CLASS.rogue, level: 1,
      abilityScores: { str: 10, dex: 16, con: 12, int: 13, wis: 11, cha: 14 },
      classSkills: ['stealth', 'perception'],
      classSavingThrows: ['dex', 'int'],
      backgroundSkills: ['deception', 'insight'],
    })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('E1 · création niv 1')

    await levelUp(id, { classId: CLASS.rogue, hpGained: 6 })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('E2 · niv 2 (Ruse)')

    // Niv 3 : sous-classe Voleur + expertise sur 2 compétences de classe + une nouvelle compétence.
    await levelUp(id, {
      classId: CLASS.rogue, hpGained: 6,
      subclassId: SUBCLASS.thief,
      expertiseSkills: ['stealth', 'perception'],
      newSkills: ['acrobatics'],
    })
    expect(await serializeCharacter(db, id)).toMatchSnapshot('E3 · niv 3 (Voleur + expertise + Acrobaties)')
  })
})
