import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { deriveWeaponMasteries } from '../../server/utils/weaponMasteryDerivation'
import { replayMigrations } from '../fixtures/migrations'

// C4 — dérivation des maîtrises d'armes. La fiche liste les armes choisies aux points de choix
// `weapon_mastery` (une ligne character_choices.selected_value par arme). No-op ([]) sans pick,
// ignore les autres kinds. FK OFF APRÈS migrations (patron abilityScoreDerivation) : test de
// logique de jointure, pas d'intégrité référentielle.

const SHEET = 1
const OTHER_SHEET = 2

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await replayMigrations(client)
  await client.execute('PRAGMA foreign_keys = OFF')
  orm = drizzle(client, { schema, casing: 'snake_case' })

  // Une progression `weapon_mastery` + une non-maîtrise (skill) à ignorer.
  await orm.insert(schema.progression).values([
    { id: 10, featureId: 10, kind: 'weapon_mastery', count: { op: 'fixed', value: 2 }, optionSource: { type: 'proficient_weapons' }, replaceable: true },
    { id: 11, featureId: 11, kind: 'skill', count: { op: 'fixed', value: 1 }, optionSource: { type: 'proficient_skills' }, replaceable: false },
  ])
  await orm.insert(schema.characterChoices).values([
    { characterSheetId: SHEET, progressionId: 10, selectedValue: 'épée longue' },
    { characterSheetId: SHEET, progressionId: 10, selectedValue: 'arc court' },
    { characterSheetId: SHEET, progressionId: 11, selectedValue: 'discretion' }, // skill → ignoré
  ])
})

describe('deriveWeaponMasteries', () => {
  it('liste les armes des points de choix weapon_mastery (ignore les autres kinds)', async () => {
    expect((await deriveWeaponMasteries(orm, SHEET)).sort()).toEqual(['arc court', 'épée longue'])
  })

  it('liste VIDE pour une fiche sans pick (toutes les fiches 2014)', async () => {
    expect(await deriveWeaponMasteries(orm, OTHER_SHEET)).toEqual([])
  })
})
