import { describe, it, expect, beforeAll } from 'vitest'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { levelUpReplacements } from '../../server/utils/duplicateProficiencies'
import { deriveChoiceProficiencies } from '../../server/utils/choicePicks'
import { seedBackgroundProficiencies } from '../../server/db/seeds/lib/seedBackgroundProficiencies'
import { seedDuplicateReplacement } from '../../server/db/seeds/lib/seedDuplicateReplacement'
import { backgroundsData } from '../../server/db/seeds/data/backgrounds'
import { bootstrapGoldenDb, OWNER, CLASS, SPECIES, BACKGROUND } from './fixtures/goldenMaster'

// AideDD, Historiques : une maîtrise reçue de deux sources peut être remplacée. Au level-up, c'est le
// multiclassage vers une classe dont le porteur accorde une maîtrise déjà possédée qui ouvre un remplacement :
// seul le surplus est demandé, et le serveur le valide comme il valide la création.

const THIEVES_TOOLS = 'Outils de voleur'
const KNIGHT_ROGUE = 90

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let criminalId: number
let toolReplacement: number

async function addCarrier(classId: number, featureType: 'proficiency_grant' | 'multiclass_proficiency_grant') {
  const feature = await db.insert(schema.features).values({ name: 'Maîtrises', featureType, classId, levelRequired: 1 }).returning().get()
  const effect = await db.insert(schema.effects).values({ type: 'tool_proficiency', value: THIEVES_TOOLS }).returning().get()
  await db.insert(schema.featureEffects).values({ featureId: feature.id, effectId: effect.id })
}

const create = (classId: number, backgroundId: number) =>
  createCharacter(db, createCharacterSchema.parse({
    name: 'X', hpBase: 8, classId, level: 1, speciesId: SPECIES.human, backgroundId,
    abilityScores: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 14 },
    classSkills: [], backgroundSkills: [], spellIds: [],
  }), OWNER)

const joinRogue = (id: number, choicePicks: unknown[]) =>
  characterLevelUp(db, id, levelUpSchema.parse({ classId: CLASS.rogue, isMulticlass: true, hpDie: 5, choicePicks }))

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
  const criminal = backgroundsData.filter(b => b.name === 'Criminel')
  criminalId = (await db.insert(schema.backgrounds).values({ name: 'Criminel' }).returning().get()).id
  await seedBackgroundProficiencies(db, criminal)
  await seedDuplicateReplacement(db)
  const [tool] = await db.select({ id: schema.progression.id }).from(schema.progression)
    .innerJoin(schema.features, eq(schema.features.id, schema.progression.featureId))
    .where(and(eq(schema.progression.kind, 'tool'), eq(schema.features.featureType, 'choice_carrier')))
  toolReplacement = tool.id

  await addCarrier(CLASS.rogue, 'multiclass_proficiency_grant')
  await db.insert(schema.classes).values({ id: KNIGHT_ROGUE, name: 'Chevalier voleur', hitDice: '1d8', spellcastingType: 'none' })
  await addCarrier(KNIGHT_ROGUE, 'proficiency_grant')
}, 60000)

describe('level-up — remplacement d\'une maîtrise doublée par le multiclassage', () => {
  it('Guerrier Criminel qui rejoint le Roublard : un outil de remplacement, nommé et dérivé en maîtrise', async () => {
    const { id } = await create(CLASS.fighter, criminalId)
    const { choices, duplicated } = await levelUpReplacements(db, id, CLASS.rogue)
    expect(choices).toEqual([expect.objectContaining({ progressionId: toolReplacement, kind: 'tool', count: 1, remaining: 1, global: true })])
    expect(duplicated).toEqual({ skills: [], tools: [THIEVES_TOOLS] })

    await joinRogue(id, [{ progressionId: toolReplacement, value: 'Kit de déguisement' }])
    expect((await deriveChoiceProficiencies(db, id)).map(e => e.value)).toEqual(['Kit de déguisement'])
  })

  it('refuse un second remplacement, ou un remplacement quand rien n\'est doublé', async () => {
    const criminal = await create(CLASS.fighter, criminalId)
    await expect(joinRogue(criminal.id, ['Kit de déguisement', 'Outils de navigateur'].map(value => ({ progressionId: toolReplacement, value }))))
      .rejects.toThrow(/Trop de choix/)

    const soldier = await create(CLASS.fighter, BACKGROUND.soldier)
    expect((await levelUpReplacements(db, soldier.id, CLASS.rogue)).choices).toEqual([])
    await expect(joinRogue(soldier.id, [{ progressionId: toolReplacement, value: 'Kit de déguisement' }]))
      .rejects.toThrow(/n'est pas proposé/)
  })

  it('un remplacement déjà enregistré n\'est pas redemandé', async () => {
    const { id } = await create(CLASS.fighter, criminalId)
    await joinRogue(id, [{ progressionId: toolReplacement, value: 'Kit de déguisement' }])
    expect((await levelUpReplacements(db, id, CLASS.wizard)).choices).toEqual([])
  })

  it('un doublon de départ non remplacé ne revient pas : seul le surplus est demandé', async () => {
    const { id } = await create(KNIGHT_ROGUE, criminalId)
    const { choices } = await levelUpReplacements(db, id, CLASS.rogue)
    expect(choices).toEqual([expect.objectContaining({ kind: 'tool', count: 1, remaining: 1 })])
  })

  it('une classe déjà sur la fiche n\'ouvre rien', async () => {
    const { id } = await create(CLASS.fighter, criminalId)
    expect((await levelUpReplacements(db, id, CLASS.fighter)).choices).toEqual([])
  })
})
