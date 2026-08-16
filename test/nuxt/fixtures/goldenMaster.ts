import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from '../../../server/db/schema'
import { WARLOCK_PROGRESSION_CONTRACT } from '../../fixtures/warlockProgression'

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN-MASTER — socle du filet d'équivalence création/level-up (docs/consolidation-2014.md,
// dernière étape de P0, filet NON négociable AVANT F2).
//
// Ce module fournit trois choses au test `goldenMaster.test.ts` :
//  1. `bootstrapGoldenDb()` — une base libsql en mémoire, chaîne de migrations de PROD rejouée,
//     puis un CATALOGUE représentatif hand-seedé (même patron que createCharacter.test /
//     buildCatalog.test) ;
//  2. les IDENTIFIANTS STABLES du catalogue (classes, sous-classes, features, sorts…) que le test
//     passe en entrée de `createCharacter` / `characterLevelUp` ;
//  3. `serializeCharacter()` — un instantané NORMALISÉ et DÉTERMINISTE de tout l'état `character_*`
//     d'une fiche, dont les clés étrangères sont RÉSOLUES EN NOMS (lisible en revue) et d'où sont
//     retirés les id auto-incrément et les horodatages (non déterministes).
//
// But : quand F2 généralisera `progression`/`character_choices` à tout le 2014, un `git diff` du
// fichier de snapshot montrera EXACTEMENT ce que le comportement de création/level-up change.
// Le catalogue est volontairement 100 % « édition 5 » (2014) et couvre les quatre archétypes du
// plan : martial (Guerrier), lanceur complet (Magicien), Occultiste (pacte/manifestations/arcanum),
// et multiclasse (Guerrier/Occultiste).
// ─────────────────────────────────────────────────────────────────────────────

// ── Identifiants stables du catalogue ──────────────────────────────────────────
export const OWNER = 1

export const CLASS = { warlock: 1, fighter: 2, wizard: 3 } as const
export const SUBCLASS = { champion: 10, evocation: 20 } as const
export const SPECIES = { human: 1 } as const
export const BACKGROUND = { soldier: 1 } as const
export const MAGIC_SCHOOL = { evocation: 1 } as const
export const ITEM = { longsword: 1, dagger: 2 } as const

// Features — plages par classe (id explicites → stables entre exécutions).
export const FEATURE = {
  // Occultiste : 6 porteurs de progression (contrat 5a) = ids 100..105, dans l'ordre du contrat.
  warlockProgressionOwnerBase: 100,
  warlockEldritchCasting: 110, // passif niv 1 (matérialisé)
  pactChain: 120,
  pactBlade: 121,
  pactTome: 122,
  invocationGaze: 130, // « Regard de deux esprits » — niv 1
  invocationArmor: 131, // « Armure des ombres » — niv 1, octroie « Armure de mage »
  invocationMasks: 132, // « Maître des masques » — niv 5
  // Guerrier
  fighterSecondWind: 200, // passif niv 1
  fighterActionSurge: 201, // passif niv 2
  fighterExtraAttack: 202, // passif niv 5
  championImprovedCrit: 210, // sous-classe Champion, niv 3
  // Magicien
  wizardArcaneRecovery: 300, // passif niv 1
  evocationSculptSpells: 310, // sous-classe Évocation, niv 2
} as const

export const SPELL = {
  findFamiliar: 500, // « Appel de familier » — familier du Pacte de la Chaîne
  mageArmor: 501, // « Armure de mage » — octroyé par l'invocation 131
  circleOfDeath: 600, // niv 6 — arcanum mystique (niveau 6)
  gate: 601, // niv 9 — arcanum mystique (niveau 9)
  fireBolt: 510, // sort mineur de Magicien
  magicMissile: 511, // niv 1 de Magicien
  shield: 512, // niv 1 de Magicien
} as const

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

/** Rejoue toute la chaîne de migrations (schéma de prod) sur une base libsql en mémoire. */
async function replayMigrations(): Promise<{ client: Client, db: Db }> {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()

  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  for (const file of files) {
    const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
    for (const statement of splitSqlQueries(sql)) await client.execute(statement)
  }
  const db = drizzle(client, { schema, casing: 'snake_case' })
  return { client, db }
}

/**
 * Seede le catalogue représentatif « édition 5 » (2014). Tout est en `ruleset: '5'` (défaut) :
 * le golden-master fige le socle 2014, cible de F2. Les FK sont actives (libsql) → on seede les
 * référentiels (utilisateur, école de magie, caractéristiques, espèce…).
 */
export async function seedGoldenCatalog(db: Db): Promise<void> {
  // Référentiels
  await db.insert(schema.magicSchools).values({ id: MAGIC_SCHOOL.evocation, name: 'Invocation' })
  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'Testeur' })
  await db.insert(schema.characterSpecies).values({ id: SPECIES.human, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.abilityScores).values(
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })),
  )
  await db.insert(schema.backgrounds).values({ id: BACKGROUND.soldier, name: 'Soldat' })
  await db.insert(schema.items).values([
    { id: ITEM.longsword, name: 'Épée longue', itemType: 'weapon', properties: {} },
    { id: ITEM.dagger, name: 'Dague', itemType: 'weapon', properties: {} },
  ])

  // ── Classes ──────────────────────────────────────────────────────────────────
  await db.insert(schema.classes).values([
    { id: CLASS.warlock, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' },
    { id: CLASS.fighter, name: 'Guerrier', hitDice: '1d10', spellcastingType: 'none' },
    { id: CLASS.wizard, name: 'Magicien', hitDice: '1d6', spellcastingType: 'full' },
  ])
  await db.insert(schema.subclasses).values([
    { id: SUBCLASS.champion, classId: CLASS.fighter, name: 'Champion' },
    { id: SUBCLASS.evocation, classId: CLASS.wizard, name: 'École d\'Évocation' },
  ])

  // ── Occultiste : 6 porteurs de progression (contrat 5a) + leur progression ─────
  for (let i = 0; i < WARLOCK_PROGRESSION_CONTRACT.length; i++) {
    const c = WARLOCK_PROGRESSION_CONTRACT[i]!
    const id = FEATURE.warlockProgressionOwnerBase + i
    await db.insert(schema.features).values({ id, name: c.ownerName, featureType: 'class_feature', classId: CLASS.warlock, levelRequired: c.ownerLevelRequired })
    await db.insert(schema.progression).values({ featureId: id, kind: c.kind, count: c.count, optionSource: c.optionSource, replaceable: c.replaceable })
  }

  // Occultiste : passif matérialisé d'office (non tagué) + faveurs de pacte + manifestations
  await db.insert(schema.features).values([
    { id: FEATURE.warlockEldritchCasting, name: 'Incantation occulte', featureType: 'class_feature', classId: CLASS.warlock, levelRequired: 1 },
    { id: FEATURE.pactChain, name: 'Pacte de la Chaîne', featureType: 'class_feature', classId: CLASS.warlock, levelRequired: 3, tag: 'pact_boon' },
    { id: FEATURE.pactBlade, name: 'Pacte de la Lame', featureType: 'class_feature', classId: CLASS.warlock, levelRequired: 3, tag: 'pact_boon' },
    { id: FEATURE.pactTome, name: 'Pacte du Tome', featureType: 'class_feature', classId: CLASS.warlock, levelRequired: 3, tag: 'pact_boon' },
    { id: FEATURE.invocationGaze, name: 'Regard de deux esprits', featureType: 'eldritch_invocation', classId: CLASS.warlock, levelRequired: 1, tag: 'invocation' },
    { id: FEATURE.invocationArmor, name: 'Armure des ombres', featureType: 'eldritch_invocation', classId: CLASS.warlock, levelRequired: 1, tag: 'invocation' },
    { id: FEATURE.invocationMasks, name: 'Maître des masques', featureType: 'eldritch_invocation', classId: CLASS.warlock, levelRequired: 5, tag: 'invocation' },
  ])
  // L'invocation « Armure des ombres » octroie le sort « Armure de mage » (spell_grant).
  const [grant] = await db.insert(schema.effects).values({ type: 'spell_grant', value: { level: 1, spellcastingAbility: 'cha', spellName: 'Armure de mage', countPerLongRest: 0 } }).returning()
  await db.insert(schema.featureEffects).values({ featureId: FEATURE.invocationArmor, effectId: grant.id })

  // ── Guerrier : passifs de palier + feature de sous-classe ──────────────────────
  await db.insert(schema.features).values([
    { id: FEATURE.fighterSecondWind, name: 'Second souffle', featureType: 'class_feature', classId: CLASS.fighter, levelRequired: 1 },
    { id: FEATURE.fighterActionSurge, name: 'Fougue', featureType: 'class_feature', classId: CLASS.fighter, levelRequired: 2 },
    { id: FEATURE.fighterExtraAttack, name: 'Attaque supplémentaire', featureType: 'class_feature', classId: CLASS.fighter, levelRequired: 5 },
    { id: FEATURE.championImprovedCrit, name: 'Critique amélioré', featureType: 'subclass_feature', subclassId: SUBCLASS.champion, levelRequired: 3 },
  ])

  // ── Magicien : passif de palier + feature de sous-classe ───────────────────────
  await db.insert(schema.features).values([
    { id: FEATURE.wizardArcaneRecovery, name: 'Récupération arcanique', featureType: 'class_feature', classId: CLASS.wizard, levelRequired: 1 },
    { id: FEATURE.evocationSculptSpells, name: 'Façonnage des sorts', featureType: 'subclass_feature', subclassId: SUBCLASS.evocation, levelRequired: 2 },
  ])

  // ── Sorts ──────────────────────────────────────────────────────────────────────
  await db.insert(schema.spells).values([
    { id: SPELL.findFamiliar, name: 'Appel de familier', level: 1, castingTime: '1 action', range: 0, duration: '1 heure', schoolId: MAGIC_SCHOOL.evocation },
    { id: SPELL.mageArmor, name: 'Armure de mage', level: 1, castingTime: '1 action', range: 0, duration: '8 heures', schoolId: MAGIC_SCHOOL.evocation },
    { id: SPELL.circleOfDeath, name: 'Cercle de mort', level: 6, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: MAGIC_SCHOOL.evocation },
    { id: SPELL.gate, name: 'Portail', level: 9, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: MAGIC_SCHOOL.evocation },
    { id: SPELL.fireBolt, name: 'Trait de feu', level: 0, castingTime: '1 action', range: 36, duration: 'Instantané', schoolId: MAGIC_SCHOOL.evocation },
    { id: SPELL.magicMissile, name: 'Projectile magique', level: 1, castingTime: '1 action', range: 36, duration: 'Instantané', schoolId: MAGIC_SCHOOL.evocation },
    { id: SPELL.shield, name: 'Bouclier', level: 1, castingTime: '1 réaction', range: 0, duration: '1 round', schoolId: MAGIC_SCHOOL.evocation },
  ])
  // Sorts d'Occultiste pour les arcanums mystiques (filtrés par slug de classe « warlock »).
  await db.insert(schema.spellClasses).values([
    { spellId: SPELL.circleOfDeath, classId: CLASS.warlock },
    { spellId: SPELL.gate, classId: CLASS.warlock },
  ])
}

/** Base + catalogue prêts à l'emploi. */
export async function bootstrapGoldenDb(): Promise<{ client: Client, db: Db }> {
  const { client, db } = await replayMigrations()
  await seedGoldenCatalog(db)
  return { client, db }
}

// ── Sérialiseur d'état normalisé ────────────────────────────────────────────────

/** Tri stable par la représentation JSON des champs (déterministe, indépendant de l'ordre DB). */
function sortStable<T>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1))
}

/**
 * Instantané NORMALISÉ de tout l'état `character_*` d'une fiche. Les clés étrangères vers le
 * catalogue sont résolues en NOMS (lisible en `git diff`) ; les id auto-incrément et horodatages
 * (non déterministes) sont écartés. Toute écriture de `createCharacter` / `characterLevelUp` a
 * ici son reflet.
 */
export async function serializeCharacter(db: Db, sheetId: number) {
  // Tables de correspondance id → nom (résolution lisible).
  const nameOf = async (rows: Promise<Array<{ id: number, name: string | null }>>) => {
    const m = new Map<number, string | null>()
    for (const r of await rows) m.set(r.id, r.name)
    return m
  }
  const featureName = await nameOf(db.select({ id: schema.features.id, name: schema.features.name }).from(schema.features))
  const spellName = await nameOf(db.select({ id: schema.spells.id, name: schema.spells.name }).from(schema.spells))
  const className = await nameOf(db.select({ id: schema.classes.id, name: schema.classes.name }).from(schema.classes))
  const subclassName = await nameOf(db.select({ id: schema.subclasses.id, name: schema.subclasses.name }).from(schema.subclasses))
  const itemName = await nameOf(db.select({ id: schema.items.id, name: schema.items.name }).from(schema.items))
  const backgroundName = await nameOf(db.select({ id: schema.backgrounds.id, name: schema.backgrounds.name }).from(schema.backgrounds))
  const lineageName = await nameOf(db.select({ id: schema.speciesLineages.id, name: schema.speciesLineages.name }).from(schema.speciesLineages))
  const speciesName = await nameOf(db.select({ id: schema.characterSpecies.id, name: schema.characterSpecies.name }).from(schema.characterSpecies))

  // progression.id → descripteur lisible (porteur + kind), pour les character_choices.
  const progRows = await db
    .select({ id: schema.progression.id, kind: schema.progression.kind, ownerFeatureId: schema.progression.featureId })
    .from(schema.progression)
  const progDesc = new Map<number, string>()
  for (const p of progRows) progDesc.set(p.id, `${p.kind}:${featureName.get(p.ownerFeatureId) ?? p.ownerFeatureId}`)

  const nullableName = (m: Map<number, string | null>, id: number | null) => (id == null ? null : m.get(id) ?? `#${id}`)

  const [sheet] = await db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, sheetId))

  const classes = await db.select().from(schema.characterClasses).where(eq(schema.characterClasses.characterSheetId, sheetId))
  const abilityScores = await db.select().from(schema.characterAbilityScores).where(eq(schema.characterAbilityScores.characterSheetId, sheetId))
  const asis = await db.select().from(schema.characterAbilityScoreImprovements).where(eq(schema.characterAbilityScoreImprovements.characterSheetId, sheetId))
  const skills = await db.select().from(schema.characterSkills).where(eq(schema.characterSkills.characterSheetId, sheetId))
  const overrides = await db.select().from(schema.characterProficiencyOverrides).where(eq(schema.characterProficiencyOverrides.characterSheetId, sheetId))
  const features = await db.select().from(schema.characterFeatures).where(eq(schema.characterFeatures.characterSheetId, sheetId))
  const choices = await db.select().from(schema.characterChoices).where(eq(schema.characterChoices.characterSheetId, sheetId))
  const slots = await db.select().from(schema.characterSpellSlots).where(eq(schema.characterSpellSlots.characterSheetId, sheetId))
  const spells = await db.select().from(schema.characterSpells).where(eq(schema.characterSpells.characterSheetId, sheetId))
  const inventory = await db.select().from(schema.characterInventory).where(eq(schema.characterInventory.characterSheetId, sheetId))

  return {
    sheet: {
      name: sheet.name,
      ruleset: sheet.ruleset,
      species: nullableName(speciesName, sheet.speciesId),
      background: nullableName(backgroundName, sheet.backgroundId),
      alignment: sheet.alignment,
      maxHp: sheet.maxHp,
      currentHp: sheet.currentHp,
      temporaryHp: sheet.temporaryHp,
      currentHitDie: sheet.currentHitDie,
      dragonbornAncestry: sheet.dragonbornAncestry,
      inspiration: sheet.inspiration,
      exhaustionLevel: sheet.exhaustionLevel,
      money: { pp: sheet.pp, po: sheet.po, pe: sheet.pe, pa: sheet.pa, pc: sheet.pc },
    },
    classes: sortStable(classes.map((c: typeof classes[number]) => ({
      class: nullableName(className, c.classId),
      level: c.level,
      isMain: c.isMain,
      subclass: nullableName(subclassName, c.subclassId),
      pactBoon: c.pactBoon,
    }))),
    abilityScores: sortStable(abilityScores.map((a: typeof abilityScores[number]) => ({ ability: a.abilityId, value: a.value }))),
    abilityScoreImprovements: sortStable(asis.map((a: typeof asis[number]) => ({
      class: nullableName(className, a.classId),
      classLevel: a.classLevel,
      ability: a.ability,
      amount: a.amount,
    }))),
    skills: sortStable(skills.map((s: typeof skills[number]) => ({ skillKey: s.skillKey, proficiencyLevel: s.proficiencyLevel, source: s.source, isOverride: s.isOverride }))),
    proficiencyOverrides: sortStable(overrides.map((o: typeof overrides[number]) => ({ type: o.proficiencyType, value: o.value, action: o.action }))),
    features: sortStable(features.map((f: typeof features[number]) => ({
      feature: nullableName(featureName, f.featureId),
      source: f.source,
      classLevel: f.classLevel,
      choices: f.choices,
    }))),
    choices: sortStable(choices.map((c: typeof choices[number]) => ({
      progression: progDesc.get(c.progressionId) ?? `#${c.progressionId}`,
      classLevel: c.classLevel,
      selectedSubclass: nullableName(subclassName, c.selectedSubclassId),
      selectedLineage: nullableName(lineageName, c.selectedLineageId),
      selectedFeature: nullableName(featureName, c.selectedFeatureId),
      selectedSpell: nullableName(spellName, c.selectedSpellId),
      selectedAbility: c.selectedAbilityId,
      selectedValue: c.selectedValue,
      payload: c.payload,
    }))),
    spellSlots: sortStable(slots.map((s: typeof slots[number]) => ({ slotLevel: s.slotLevel, slotType: s.slotType, total: s.total, used: s.used }))),
    spells: sortStable(spells.map((s: typeof spells[number]) => ({
      spell: nullableName(spellName, s.spellId),
      source: s.source,
      isKnown: s.isKnown,
      isPrepared: s.isPrepared,
    }))),
    inventory: sortStable(inventory.map((i: typeof inventory[number]) => ({
      item: nullableName(itemName, i.itemId),
      quantity: i.quantity,
      equipped: i.equipped,
      isPactWeapon: i.isPactWeapon,
    }))),
  }
}
