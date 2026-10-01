import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import type { Effect } from '../../server/db/schema/effects'
import { deriveClassGrants, loadClassProficiencyGrants } from '../../server/utils/classProficiencyDerivation'
import { CLASS_PROFICIENCY_CARRIER_NAME, MULTICLASS_PROFICIENCY_CARRIER_NAME } from '../../server/db/seeds/data/proficiencyCarriers'
import { CLASS_PROFICIENCIES } from '../../shared/rules/classProficiencies'
import { proficiencyEffects } from '../fixtures/catalogClasses'
import { replayMigrations } from '../fixtures/migrations'

// Dérivation des maîtrises de classe, bout en bout : `deriveClassGrants` doit rendre EXACTEMENT les effets de
// `CLASS_PROFICIENCIES` (équivalence source ⟺ dérivé) — maîtrises de départ et JS pour la classe principale,
// sous-ensemble `multiclass` sans JS pour les autres (règle PHB) —, `[]` sans porteur.

const BARE = 'ClasseSansPorteur'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any
const classIdByName = new Map<string, number>()

const norm = (es: Effect[]) => es.map(e => `${e.type}:${JSON.stringify(e.value)}`).sort()

/** JS attendus du porteur (saving_throw_proficiency), accordés par la 1re classe. */
function expectedSaves(className: string): Effect[] {
  return CLASS_PROFICIENCIES[className]!.savingThrows.map((ability): Effect => ({ type: 'saving_throw_proficiency', value: { ability } }))
}

const expectedStart = (className: string): Effect[] => proficiencyEffects(CLASS_PROFICIENCIES[className]!)
const expectedMulticlass = (className: string): Effect[] => proficiencyEffects(CLASS_PROFICIENCIES[className]!.multiclass)

/** Classes de la fiche : la 1re nommée est la principale. */
const sheet = (main: string, ...others: string[]) => [
  { classId: classIdByName.get(main)!, isMain: true },
  ...others.map(name => ({ classId: classIdByName.get(name)!, isMain: false })),
]

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  orm = drizzle(client, { schema, casing: 'snake_case' })

  const carrier = async (classId: number, name: string, featureType: string, effects: Effect[]) => {
    const feature = await orm.insert(schema.features)
      .values({ name, featureType, classId, levelRequired: 1 })
      .returning().get()
    for (const effect of effects) {
      const eff = await orm.insert(schema.effects).values(effect).returning().get()
      await orm.insert(schema.featureEffects).values({ featureId: feature.id, effectId: eff.id })
    }
  }

  // Une classe + ses porteurs par entrée de CLASS_PROFICIENCIES (celui de multiclassage seulement s'il
  // accorde quelque chose, comme le seed).
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    const cls = await orm.insert(schema.classes)
      .values({ name: className, hitDice: '1d8' }).returning().get()
    classIdByName.set(className, cls.id)

    await carrier(cls.id, CLASS_PROFICIENCY_CARRIER_NAME, 'proficiency_grant', [...expectedSaves(className), ...expectedStart(className)])
    if (expectedMulticlass(className).length) {
      await carrier(cls.id, MULTICLASS_PROFICIENCY_CARRIER_NAME, 'multiclass_proficiency_grant', expectedMulticlass(className))
    }
  }

  const bare = await orm.insert(schema.classes).values({ name: BARE, hitDice: '1d6' }).returning().get()
  classIdByName.set(BARE, bare.id)
})

describe('loadClassProficiencyGrants — les deux porteurs de chaque classe (source du catalogue)', () => {
  it('rend, pour chaque classe, ses maîtrises de départ, ses JS et son sous-ensemble du multiclassage', async () => {
    const names = Object.keys(CLASS_PROFICIENCIES)
    const grants = await loadClassProficiencyGrants(orm, [...names.map(n => classIdByName.get(n)!), classIdByName.get(BARE)!])
    for (const className of names) {
      const g = grants.get(classIdByName.get(className)!)!
      expect(norm(g.start), className).toEqual(norm(expectedStart(className)))
      expect(norm(g.savingThrows), className).toEqual(norm(expectedSaves(className)))
      expect(norm(g.multiclass), className).toEqual(norm(expectedMulticlass(className)))
    }
    expect(grants.get(classIdByName.get(BARE)!)).toEqual({ start: [], savingThrows: [], multiclass: [] })
  })
})

describe('deriveClassGrants — classe principale : maîtrises de départ et JS', () => {
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    it(`${className} : dérive exactement ses maîtrises de départ (armes/armures/outils) et ses JS`, async () => {
      const grants = await deriveClassGrants(orm, sheet(className))
      expect(norm(grants.proficiencies)).toEqual(norm(expectedStart(className)))
      expect(norm(grants.savingThrows)).toEqual(norm(expectedSaves(className)))
    })
  }
})

describe('deriveClassGrants — classe rejointe : sous-ensemble du multiclassage, sans JS', () => {
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    it(`${className} : dérive exactement ses maîtrises de multiclassage`, async () => {
      const grants = await deriveClassGrants(orm, sheet(BARE, className))
      expect(norm(grants.proficiencies)).toEqual(norm(expectedMulticlass(className)))
      expect(grants.savingThrows).toEqual([])
    })
  }

  it('Magicien qui rejoint Guerrier : armures légères et intermédiaires, pas les lourdes', async () => {
    const grants = await deriveClassGrants(orm, sheet('Magicien', 'Guerrier'))
    expect(norm(grants.proficiencies)).toEqual(norm([...expectedStart('Magicien'), ...expectedMulticlass('Guerrier')]))
    expect(grants.proficiencies.filter(e => e.type === 'proficiency').map(e => e.value).sort()).toEqual(['light', 'medium', 'shield'])
  })

  it('Guerrier qui rejoint Roublard puis Magicien : outils de voleur, rien du Magicien', async () => {
    const grants = await deriveClassGrants(orm, sheet('Guerrier', 'Roublard', 'Magicien'))
    expect(norm(grants.proficiencies)).toEqual(norm([...expectedStart('Guerrier'), ...expectedMulticlass('Roublard')]))
  })

  it('n\'accorde QUE les JS de la classe principale, pas ceux de la classe rejointe', async () => {
    const grants = await deriveClassGrants(orm, sheet('Guerrier', 'Occultiste'))
    expect(norm(grants.savingThrows)).toEqual(norm(expectedSaves('Guerrier')))
  })
})

describe('deriveClassGrants — choix de la classe principale', () => {
  const byId = (name: string) => classIdByName.get(name)!

  it('suit `isMain`, quel que soit l\'ordre des classes', async () => {
    const grants = await deriveClassGrants(orm, [
      { classId: byId('Guerrier'), isMain: false },
      { classId: byId('Magicien'), isMain: true },
    ])
    expect(norm(grants.proficiencies)).toEqual(norm([...expectedStart('Magicien'), ...expectedMulticlass('Guerrier')]))
    expect(norm(grants.savingThrows)).toEqual(norm(expectedSaves('Magicien')))
  })

  it('sans classe marquée principale, retient la première', async () => {
    const grants = await deriveClassGrants(orm, [
      { classId: byId('Magicien'), isMain: false },
      { classId: byId('Guerrier'), isMain: false },
    ])
    expect(norm(grants.proficiencies)).toEqual(norm([...expectedStart('Magicien'), ...expectedMulticlass('Guerrier')]))
  })
})

describe('deriveClassGrants — cas vides', () => {
  it('rend [] sans classe', async () => {
    expect(await deriveClassGrants(orm, [])).toEqual({ proficiencies: [], savingThrows: [] })
  })

  it('rend [] pour une classe sans porteur (aucune régression pré-seed)', async () => {
    expect(await deriveClassGrants(orm, sheet(BARE))).toEqual({ proficiencies: [], savingThrows: [] })
  })
})
