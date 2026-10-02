import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { loadAlwaysPreparedSpells } from '../../server/utils/alwaysPreparedSpells'
import { alwaysPreparedEffects, circleSpellEffects, CLERIC_DOMAIN_SPELLS } from '../../server/db/seeds/data/alwaysPreparedSpells'
import { replayMigrations } from '../fixtures/migrations'

// Les sorts de domaine sont dérivés de la sous-classe et du niveau de classe : rien n'est stocké.

const CLERIC = 1
const WIZARD = 2
const LIFE = 10
const DRUID = 3
const EARTH_CIRCLE = 11

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

const SPELL = { bless: 100, cureWounds: 101, spiritualWeapon: 102, blessing55: 103, spiderClimb: 104, barkskin: 105, blur: 106 }
let terrainProgressionId = 0

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
    { id: DRUID, name: 'Druide', hitDice: '1d8', spellcastingType: 'full' },
  ])
  await db.insert(schema.subclasses).values([
    { id: LIFE, classId: CLERIC, name: 'Domaine de la vie' },
    { id: EARTH_CIRCLE, classId: DRUID, name: 'Cercle de la terre' },
  ])

  const [carrier] = await db.insert(schema.features).values({ name: 'Sorts de domaine Vie', featureType: 'subclass_feature', subclassId: LIFE, levelRequired: 1 }).returning()
  for (const effect of alwaysPreparedEffects(CLERIC_DOMAIN_SPELLS['Domaine de la vie']!)) {
    const [row] = await db.insert(schema.effects).values({ type: effect.type, value: effect.value }).returning()
    await db.insert(schema.featureEffects).values({ featureId: carrier.id, effectId: row.id })
  }

  const [circle] = await db.insert(schema.features).values({ name: 'Sorts de cercle', featureType: 'subclass_feature', subclassId: EARTH_CIRCLE, levelRequired: 3 }).returning()
  for (const effect of circleSpellEffects()) {
    const [row] = await db.insert(schema.effects).values({ type: effect.type, value: effect.value }).returning()
    await db.insert(schema.featureEffects).values({ featureId: circle.id, effectId: row.id })
  }
  const [terrainOwner] = await db.insert(schema.features).values({ name: 'Terrain du cercle', featureType: 'choice_carrier', subclassId: EARTH_CIRCLE, levelRequired: 2 }).returning()
  const [terrainProgression] = await db.insert(schema.progression).values({
    featureId: terrainOwner.id, kind: 'terrain', count: { op: 'fixed', value: 1 }, optionSource: { type: 'enum', values: ['Forêt', 'Désert'] }, replaceable: false,
  }).returning()
  terrainProgressionId = terrainProgression.id

  const spell = (id: number, name: string, level: number, ruleset: '5' | '5.5' = '5') =>
    ({ id, name, level, ruleset, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 })
  // Seuls trois sorts de domaine du catalogue : les autres (Soins de groupe…) n'y sont pas encore.
  await db.insert(schema.spells).values([
    spell(SPELL.bless, 'Bénédiction', 1),
    spell(SPELL.cureWounds, 'Soins', 1),
    spell(SPELL.spiritualWeapon, 'Arme spirituelle', 2),
    spell(SPELL.blessing55, 'Bénédiction', 1, '5.5'),
    spell(SPELL.spiderClimb, 'Pattes d\'araignée', 2),
    spell(SPELL.barkskin, 'Peau d\'écorce', 2),
    spell(SPELL.blur, 'Flou', 2),
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

describe('loadAlwaysPreparedSpells — sorts de cercle selon le terrain', () => {
  const pickTerrain = (sheetId: number, terrain: string) =>
    db.insert(schema.characterChoices).values({ characterSheetId: sheetId, progressionId: terrainProgressionId, selectedValue: terrain })

  it('Druide 3, terrain forêt : les sorts de la forêt, pas ceux d\'un autre terrain', async () => {
    await sheetWith(10, [{ classId: DRUID, level: 3, subclassId: EARTH_CIRCLE }])
    await pickTerrain(10, 'Forêt')
    expect(await namesAt(10)).toEqual(['Pattes d\'araignée', 'Peau d\'écorce'])
  })

  it('un autre terrain, d\'autres sorts', async () => {
    await sheetWith(11, [{ classId: DRUID, level: 3, subclassId: EARTH_CIRCLE }])
    await pickTerrain(11, 'Désert')
    expect(await namesAt(11)).toEqual(['Flou'])
  })

  it('sans terrain choisi, aucun sort de cercle', async () => {
    await sheetWith(12, [{ classId: DRUID, level: 9, subclassId: EARTH_CIRCLE }])
    expect(await namesAt(12)).toEqual([])
  })

  it('avant le niveau 3, aucun sort de cercle, même avec un terrain', async () => {
    await sheetWith(13, [{ classId: DRUID, level: 2, subclassId: EARTH_CIRCLE }])
    await pickTerrain(13, 'Forêt')
    expect(await namesAt(13)).toEqual([])
  })

  it('le terrain d\'une fiche ne vaut que pour elle', async () => {
    expect(await loadAlwaysPreparedSpells(db, 12)).toEqual([])
  })
})
