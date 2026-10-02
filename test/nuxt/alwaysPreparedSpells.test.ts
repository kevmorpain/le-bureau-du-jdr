import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { loadAlwaysPreparedSpells } from '../../server/utils/alwaysPreparedSpells'
import { alwaysPreparedEffects, CLERIC_DOMAIN_SPELLS } from '../../server/db/seeds/data/alwaysPreparedSpells'
import { replayMigrations } from '../fixtures/migrations'

// Les sorts de domaine sont dérivés de la sous-classe et du niveau de classe : rien n'est stocké.

const CLERIC = 1
const WIZARD = 2
const LIFE = 10

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

const SPELL = { bless: 100, cureWounds: 101, spiritualWeapon: 102, blessing55: 103 }

async function sheetWith(id: number, classes: Array<{ classId: number, level: number, subclassId?: number }>) {
  await db.insert(schema.characterSheets).values({ id, name: `Fiche ${id}`, speciesId: 1 })
  await db.insert(schema.characterClasses).values(classes.map(c => ({ characterSheetId: id, subclassId: null, ...c })))
}
const namesAt = async (sheetId: number) => (await loadAlwaysPreparedSpells(db, sheetId)).map(r => r.spell.name).sort()

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.magicSchools).values({ id: 1, name: 'Évocation' })
  await db.insert(schema.characterSpecies).values({ id: 1, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.classes).values([
    { id: CLERIC, name: 'Clerc', hitDice: '1d8', spellcastingType: 'full' },
    { id: WIZARD, name: 'Magicien', hitDice: '1d6', spellcastingType: 'full' },
  ])
  await db.insert(schema.subclasses).values({ id: LIFE, classId: CLERIC, name: 'Domaine de la vie' })

  const [carrier] = await db.insert(schema.features).values({ name: 'Sorts de domaine Vie', featureType: 'subclass_feature', subclassId: LIFE, levelRequired: 1 }).returning()
  for (const effect of alwaysPreparedEffects(CLERIC_DOMAIN_SPELLS['Domaine de la vie']!)) {
    const [row] = await db.insert(schema.effects).values({ type: effect.type, value: effect.value }).returning()
    await db.insert(schema.featureEffects).values({ featureId: carrier.id, effectId: row.id })
  }

  const spell = (id: number, name: string, level: number, ruleset: '5' | '5.5' = '5') =>
    ({ id, name, level, ruleset, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 })
  // Seuls trois sorts de domaine du catalogue : les autres (Soins de groupe…) n'y sont pas encore.
  await db.insert(schema.spells).values([
    spell(SPELL.bless, 'Bénédiction', 1),
    spell(SPELL.cureWounds, 'Soins', 1),
    spell(SPELL.spiritualWeapon, 'Arme spirituelle', 2),
    spell(SPELL.blessing55, 'Bénédiction', 1, '5.5'),
  ])
}, 60000)

describe('loadAlwaysPreparedSpells — sorts de domaine', () => {
  it('Clerc 1 du domaine de la Vie : les deux sorts du niveau 1, pas ceux des niveaux suivants', async () => {
    await sheetWith(1, [{ classId: CLERIC, level: 1, subclassId: LIFE }])
    expect(await namesAt(1)).toEqual(['Bénédiction', 'Soins'])
  })

  it('un niveau plus tard, le palier suivant s\'ajoute', async () => {
    await sheetWith(2, [{ classId: CLERIC, level: 3, subclassId: LIFE }])
    expect(await namesAt(2)).toEqual(['Arme spirituelle', 'Bénédiction', 'Soins'])
  })

  it('ces sorts sont connus, préparés, rattachés à la classe, et portent leur sort complet', async () => {
    const [bless] = (await loadAlwaysPreparedSpells(db, 1)).filter(r => r.spellId === SPELL.bless)
    expect(bless).toMatchObject({ classId: CLERIC, isKnown: true, isPrepared: true, alwaysPrepared: true })
    expect(bless!.spell.school.name).toBe('Évocation')
  })

  it('un sort que le catalogue n\'a pas encore est ignoré, sans erreur', async () => {
    await sheetWith(3, [{ classId: CLERIC, level: 9, subclassId: LIFE }])
    expect(await namesAt(3)).toEqual(['Arme spirituelle', 'Bénédiction', 'Soins'])
  })

  it('pas de sous-classe, pas de sort de domaine ; une autre classe n\'en reçoit pas', async () => {
    await sheetWith(4, [{ classId: CLERIC, level: 5 }])
    await sheetWith(5, [{ classId: WIZARD, level: 5 }])
    expect(await namesAt(4)).toEqual([])
    expect(await namesAt(5)).toEqual([])
  })

  it('l\'homonyme d\'une autre édition n\'est pas retenu', async () => {
    const granted = await loadAlwaysPreparedSpells(db, 1)
    expect(granted.map(g => g.spellId)).not.toContain(SPELL.blessing55)
  })
})
