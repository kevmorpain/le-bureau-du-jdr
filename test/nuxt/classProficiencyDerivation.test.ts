import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import type { Effect } from '../../server/db/schema/effects'
import { deriveClassProficiencies, deriveMainClassSavingThrows } from '../../server/utils/classProficiencyDerivation'
import { CLASS_PROFICIENCIES, type ProficiencySet } from '../../shared/rules/classProficiencies'

// Noms des porteurs (littéraux, sans importer seedClass qui dépend de hub:db). La dérivation filtre par
// featureType + classId, pas par nom → leur valeur exacte est indifférente ici.
const CARRIER_NAME = 'Maîtrises de la classe'
const MULTICLASS_CARRIER_NAME = 'Maîtrises de multiclassage'

// Dérivation des maîtrises de classe, bout en bout : `deriveClassProficiencies` doit rendre EXACTEMENT les
// effets de `CLASS_PROFICIENCIES` (équivalence source ⟺ dérivé) — maîtrises de départ pour la classe
// principale, sous-ensemble `multiclass` pour les autres —, `[]` sans porteur ; `deriveMainClassSavingThrows`
// ne rend QUE les JS de la classe visée (règle PHB : le multiclassage n'accorde pas de JS).

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any
const classIdByName = new Map<string, number>()
// Classe seedée SANS porteur → doit dériver [].
let bareClassId = 0

const norm = (es: Effect[]) => es.map(e => `${e.type}:${JSON.stringify(e.value)}`).sort()

/** JS attendus du porteur (saving_throw_proficiency), accordés par la 1re classe. */
function expectedSaves(className: string): Effect[] {
  return CLASS_PROFICIENCIES[className]!.savingThrows.map((ability): Effect => ({ type: 'saving_throw_proficiency', value: { ability } }))
}

/** Maîtrises d'armures (`proficiency`), d'armes (`weapon_proficiency`) et d'outils (`tool_proficiency`). */
function expectedGrants(set: ProficiencySet): Effect[] {
  return [
    ...set.armor.map((value): Effect => ({ type: 'proficiency', value })),
    ...set.weapon.map((value): Effect => ({ type: 'weapon_proficiency', value })),
    ...set.tools.map((value): Effect => ({ type: 'tool_proficiency', value })),
  ]
}

/** Tous les effets du porteur de départ d'une classe. */
function expectedEffects(className: string): Effect[] {
  return [...expectedSaves(className), ...expectedGrants(CLASS_PROFICIENCIES[className]!)]
}

const expectedMulticlass = (className: string): Effect[] => expectedGrants(CLASS_PROFICIENCIES[className]!.multiclass)

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()

  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  for (const file of files) {
    const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
    for (const statement of splitSqlQueries(sql)) await client.execute(statement)
  }
  orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  const carrier = async (classId: number, name: string, featureType: string, effects: Effect[]) => {
    const feature = await orm.insert(srcSchema.features)
      .values({ name, featureType, classId, levelRequired: 1 })
      .returning().get()
    for (const effect of effects) {
      const eff = await orm.insert(srcSchema.effects).values(effect).returning().get()
      await orm.insert(srcSchema.featureEffects).values({ featureId: feature.id, effectId: eff.id })
    }
  }

  // Une classe + ses porteurs par entrée de CLASS_PROFICIENCIES (celui de multiclassage seulement s'il
  // accorde quelque chose, comme le seed).
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    const cls = await orm.insert(srcSchema.classes)
      .values({ name: className, hitDice: '1d8' }).returning().get()
    classIdByName.set(className, cls.id)

    await carrier(cls.id, CARRIER_NAME, 'proficiency_grant', expectedEffects(className))
    if (expectedMulticlass(className).length) {
      await carrier(cls.id, MULTICLASS_CARRIER_NAME, 'multiclass_proficiency_grant', expectedMulticlass(className))
    }
  }

  // Classe sans porteur (aucune feature proficiency_grant) → cas [].
  const bare = await orm.insert(srcSchema.classes)
    .values({ name: 'ClasseSansPorteur', hitDice: '1d6' }).returning().get()
  bareClassId = bare.id
})

describe('deriveClassProficiencies — classe principale : maîtrises de départ', () => {
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    it(`${className} : dérive exactement ses maîtrises de base (JS + armes/armures/outils)`, async () => {
      const effects = await deriveClassProficiencies(orm, classIdByName.get(className)!, [])
      expect(norm(effects)).toEqual(norm(expectedEffects(className)))
    })
  }
})

describe('deriveClassProficiencies — classe rejointe : sous-ensemble du multiclassage', () => {
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    it(`${className} : dérive exactement ses maîtrises de multiclassage, sans JS`, async () => {
      const effects = await deriveClassProficiencies(orm, bareClassId, [classIdByName.get(className)!])
      expect(norm(effects)).toEqual(norm(expectedMulticlass(className)))
    })
  }

  it('Magicien qui rejoint Guerrier : armures légères et intermédiaires, pas les lourdes', async () => {
    const effects = await deriveClassProficiencies(orm, classIdByName.get('Magicien')!, [classIdByName.get('Guerrier')!])
    expect(norm(effects)).toEqual(norm([...expectedEffects('Magicien'), ...expectedMulticlass('Guerrier')]))
    const armor = effects.filter(e => e.type === 'proficiency').map(e => e.value).sort()
    expect(armor).toEqual(['light', 'medium', 'shield'])
  })

  it('Guerrier qui rejoint Roublard puis Magicien : outils de voleur, rien du Magicien', async () => {
    const effects = await deriveClassProficiencies(orm, classIdByName.get('Guerrier')!, [
      classIdByName.get('Roublard')!,
      classIdByName.get('Magicien')!,
    ])
    expect(norm(effects)).toEqual(norm([...expectedEffects('Guerrier'), ...expectedMulticlass('Roublard')]))
  })
})

describe('deriveClassProficiencies — cas vides', () => {
  it('rend [] sans classe', async () => {
    expect(await deriveClassProficiencies(orm, null, [])).toEqual([])
  })

  it('rend [] pour une classe sans porteur (aucune régression pré-seed)', async () => {
    expect(await deriveClassProficiencies(orm, bareClassId, [bareClassId])).toEqual([])
  })
})

describe('deriveMainClassSavingThrows — JS de la classe PRINCIPALE seulement', () => {
  it('rend exactement les 2 JS de la classe visée (et rien d\'autre)', async () => {
    const guerrier = classIdByName.get('Guerrier')!
    const effects = await deriveMainClassSavingThrows(orm, guerrier)
    expect(norm(effects)).toEqual(norm(expectedSaves('Guerrier'))) // str, con — pas d'armes/armures
  })

  it('multiclasse : n\'accorde QUE les JS de la classe principale, pas ceux de la 2e classe (PHB)', async () => {
    // On dérive avec l'id de la classe PRINCIPALE (Guerrier) ; la 2e classe (Occultiste : wis/cha) ne doit
    // PAS apparaître, même si le perso en a un porteur.
    const guerrier = classIdByName.get('Guerrier')!
    const effects = await deriveMainClassSavingThrows(orm, guerrier)
    const abilities = effects.map(e => (e.value as { ability: string }).ability).sort()
    expect(abilities).toEqual(['con', 'str']) // JS Guerrier uniquement, pas wis/cha de l'Occultiste
  })

  it('rend [] pour une classe sans porteur ou mainClassId null', async () => {
    expect(await deriveMainClassSavingThrows(orm, bareClassId)).toEqual([])
    expect(await deriveMainClassSavingThrows(orm, null)).toEqual([])
  })
})
