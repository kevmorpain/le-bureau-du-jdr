import { describe, it, expect, beforeAll } from 'vitest'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema, CharacterValidationError } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { deriveChoiceProficiencies } from '../../server/utils/choicePicks'
import { CLASS_PROFICIENCIES } from '../../shared/rules/classProficiencies'
import { CLASS_PROFICIENCY_CARRIER_NAME, MULTICLASS_PROFICIENCY_CARRIER_NAME } from '../../server/db/seeds/data/proficiencyCarriers'
import { bootstrapGoldenDb, OWNER, CLASS, SPECIES } from './fixtures/goldenMaster'

// Outils au choix de classe : Barde, trois instruments ; rejoint par multiclassage, un instrument.
// Le porteur de départ ne vaut que pour la 1re classe, celui de multiclassage que pour une classe rejointe.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
const BARD = 61
let startProgressionId: number
let multiclassProgressionId: number

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
  await db.insert(schema.classes).values({ id: BARD, name: 'Barde', hitDice: '1d8', spellcastingType: 'full' })
  const bard = CLASS_PROFICIENCIES.Barde!
  const carrier = async (name: string, featureType: 'proficiency_grant' | 'multiclass_proficiency_grant', count: number) => {
    const [f] = await db.insert(schema.features).values({ name, featureType, classId: BARD, levelRequired: 1 }).returning()
    const [p] = await db.insert(schema.progression)
      .values({ featureId: f.id, kind: 'tool', count: { op: 'fixed', value: count }, optionSource: { type: 'tools', from: bard.toolChoice!.from } })
      .returning()
    return p.id as number
  }
  startProgressionId = await carrier(CLASS_PROFICIENCY_CARRIER_NAME, 'proficiency_grant', bard.toolChoice!.count)
  multiclassProgressionId = await carrier(MULTICLASS_PROFICIENCY_CARRIER_NAME, 'multiclass_proficiency_grant', bard.multiclass.toolChoice!.count)
}, 60000)

const create = (classId: number, choicePicks: unknown[] = []) => createCharacter(db, createCharacterSchema.parse({
  name: 'X', hpBase: 8, classId, level: 1, speciesId: SPECIES.human,
  abilityScores: {}, classSkills: [], backgroundSkills: [], spellIds: [], choicePicks,
}), OWNER)
const levelUp = (id: number, over: Record<string, unknown>) => characterLevelUp(db, id, levelUpSchema.parse({ hpDie: 5, ...over }))
const tools = async (id: number) => (await deriveChoiceProficiencies(db, id)).map(e => e.value).sort()

describe('outils au choix de classe — création', () => {
  it('Barde : trois instruments, dérivés en maîtrises d\'outils', async () => {
    const { id } = await create(BARD, ['Luth', 'Flûte', 'Lyre'].map(value => ({ progressionId: startProgressionId, value })))
    expect(await tools(id)).toEqual(['Flûte', 'Luth', 'Lyre'])
  })

  it('refuse un outil hors de la liste ou le choix réservé au multiclassage', async () => {
    await expect(create(BARD, [{ progressionId: startProgressionId, value: 'Outils de voleur' }])).rejects.toThrow(CharacterValidationError)
    await expect(create(BARD, [{ progressionId: multiclassProgressionId, value: 'Luth' }])).rejects.toThrow(CharacterValidationError)
  })
})

describe('outils au choix de classe — level-up', () => {
  it('Guerrier → Barde : un instrument, sur le porteur de multiclassage', async () => {
    const { id } = await create(CLASS.fighter)
    await levelUp(id, { classId: BARD, isMulticlass: true, choicePicks: [{ progressionId: multiclassProgressionId, value: 'Cor' }] })
    expect(await tools(id)).toEqual(['Cor'])
  })

  it('Guerrier → Barde : refuse le choix de départ (3 instruments) et un second instrument', async () => {
    const { id } = await create(CLASS.fighter)
    await expect(levelUp(id, { classId: BARD, isMulticlass: true, choicePicks: [{ progressionId: startProgressionId, value: 'Cor' }] }))
      .rejects.toThrow(CharacterValidationError)
    await expect(levelUp(id, { classId: BARD, isMulticlass: true, choicePicks: ['Cor', 'Luth'].map(value => ({ progressionId: multiclassProgressionId, value })) }))
      .rejects.toThrow(/Trop de choix/)
  })

  it('Barde 1 → 2 : aucun choix d\'outil n\'est dû', async () => {
    const { id } = await create(BARD, ['Luth', 'Flûte', 'Lyre'].map(value => ({ progressionId: startProgressionId, value })))
    await expect(levelUp(id, { classId: BARD, isMulticlass: false, choicePicks: [{ progressionId: multiclassProgressionId, value: 'Cor' }] }))
      .rejects.toThrow(CharacterValidationError)
    const [row] = await db.select().from(schema.characterClasses)
      .where(and(eq(schema.characterClasses.characterSheetId, id), eq(schema.characterClasses.classId, BARD)))
    expect(row.level).toBe(1)
  })
})
