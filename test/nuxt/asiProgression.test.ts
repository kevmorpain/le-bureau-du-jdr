import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { buildCatalog } from '../../server/utils/catalog'
import { resolveChoices, type Catalog } from '../../shared/rules/resolve'
import { asiFeatures } from '../../server/db/seeds/data/asi'
import { replayMigrations } from '../fixtures/migrations'

// ASI catalogue-driven (dernier point F2) : chaque palier d'ASI est une feature « Amélioration de
// caractéristiques » porteuse d'une progression asi_or_feat (count 1) à son niveau. Vérifie que
// buildCatalog expose une progression par palier et que resolveChoices rend le choix « dû » au bon
// niveau (ownerLevelRequired === niveau atteint), comme le style de combat.

const GUERRIER = 2
const MAGICIEN = 3

let catalog: Catalog

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  const orm = drizzle(client, { schema, casing: 'snake_case' })

  await orm.insert(schema.classes).values([
    { id: GUERRIER, name: 'Guerrier', hitDice: '1d10' },
    { id: MAGICIEN, name: 'Magicien', hitDice: '1d6' },
  ])

  let featureId = 300
  for (const [className, classId] of [['Guerrier', GUERRIER], ['Magicien', MAGICIEN]] as const) {
    for (const def of asiFeatures(className)) {
      const id = featureId++
      await orm.insert(schema.features).values({
        id, name: def.name, featureType: def.featureType, classId, levelRequired: def.levelRequired,
      })
      const prog = def.progression!
      await orm.insert(schema.progression).values({
        featureId: id, kind: prog.kind, count: prog.count, optionSource: prog.optionSource, replaceable: prog.replaceable ?? false,
      })
    }
  }

  catalog = await buildCatalog(orm, { classIds: [GUERRIER, MAGICIEN] })
}, 60000)

const asiLevelsInCatalog = (classId: number) =>
  catalog.progressions.filter(p => p.kind === 'asi_or_feat' && p.ownerClassId === classId).map(p => p.ownerLevelRequired).sort((a, b) => a - b)

const dueAtLevel = (classId: number, level: number) => {
  const { choices } = resolveChoices({ classLevels: { [classId]: level } }, catalog)
  return choices.some(c => c.kind === 'asi_or_feat' && c.ownerLevelRequired === level)
}

describe('progression asi_or_feat — buildCatalog', () => {
  it('une progression par palier, avec les niveaux corrects par classe', () => {
    expect(asiLevelsInCatalog(GUERRIER)).toEqual([4, 6, 8, 12, 14, 16, 19])
    expect(asiLevelsInCatalog(MAGICIEN)).toEqual([4, 8, 12, 16, 19])
  })
})

describe('progression asi_or_feat — resolveChoices (dû au palier atteint)', () => {
  it('Guerrier : ASI dû à 4/6/8, PAS à 5/7', () => {
    expect(dueAtLevel(GUERRIER, 4)).toBe(true)
    expect(dueAtLevel(GUERRIER, 5)).toBe(false)
    expect(dueAtLevel(GUERRIER, 6)).toBe(true)
    expect(dueAtLevel(GUERRIER, 7)).toBe(false)
    expect(dueAtLevel(GUERRIER, 8)).toBe(true)
  })

  it('Magicien : PAS d\'ASI à 6 (Guerrier-only), dû à 8', () => {
    expect(dueAtLevel(MAGICIEN, 6)).toBe(false)
    expect(dueAtLevel(MAGICIEN, 8)).toBe(true)
  })

  it('à un niveau donné, tous les paliers ≤ niveau sont résolus (choix multiples)', () => {
    const { choices } = resolveChoices({ classLevels: { [GUERRIER]: 8 } }, catalog)
    const asi = choices.filter(c => c.kind === 'asi_or_feat').map(c => c.ownerLevelRequired).sort((a, b) => a - b)
    expect(asi).toEqual([4, 6, 8])
  })
})
