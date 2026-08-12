import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'
import type { Effect } from '../../server/db/schema/effects'
import { deriveClassProficiencies } from '../../server/utils/classProficiencyDerivation'
import { CLASS_PROFICIENCIES } from '../../shared/rules/classProficiencies'

// Nom du porteur (littéral, sans importer seedClass qui dépend de hub:db). La dérivation filtre par
// featureType + classId, pas par nom → sa valeur exacte est indifférente ici.
const CARRIER_NAME = 'Maîtrises de la classe'

// Volet B, étape 4 — dérivation des maîtrises d'armes/armures de BASE de classe, bout en bout.
// On rejoue la chaîne de migrations sur libsql, on pose pour chaque classe un porteur
// `proficiency_grant` (comme `seedClass.buildProficiencyCarrier`, mais en insert direct car
// `seedClass` dépend de `hub:db`), puis on vérifie que `deriveClassProficiencies` rend EXACTEMENT
// les effets de `CLASS_PROFICIENCIES` (filet d'équivalence source ⟺ dérivé), l'union en multiclasse
// et les cas `[]` (aucune classe, ou classe sans porteur).

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any
const classIdByName = new Map<string, number>()
// Classe seedée SANS porteur → doit dériver [].
let bareClassId = 0

/** Effets attendus du porteur d'une classe (armures = `proficiency`, armes = `weapon_proficiency`). */
function expectedEffects(className: string): Effect[] {
  const prof = CLASS_PROFICIENCIES[className]!
  return [
    ...prof.armor.map((value): Effect => ({ type: 'proficiency', value })),
    ...prof.weapon.map((value): Effect => ({ type: 'weapon_proficiency', value })),
  ]
}

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

  // Une classe + son porteur `proficiency_grant` par entrée de CLASS_PROFICIENCIES.
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    const cls = await orm.insert(srcSchema.classes)
      .values({ name: className, hitDice: '1d8' }).returning().get()
    classIdByName.set(className, cls.id)

    const carrier = await orm.insert(srcSchema.features)
      .values({ name: CARRIER_NAME, featureType: 'proficiency_grant', classId: cls.id, levelRequired: 1 })
      .returning().get()

    for (const effect of expectedEffects(className)) {
      const eff = await orm.insert(srcSchema.effects).values(effect).returning().get()
      await orm.insert(srcSchema.featureEffects).values({ featureId: carrier.id, effectId: eff.id })
    }
  }

  // Classe sans porteur (aucune feature proficiency_grant) → cas [].
  const bare = await orm.insert(srcSchema.classes)
    .values({ name: 'ClasseSansPorteur', hitDice: '1d6' }).returning().get()
  bareClassId = bare.id
})

describe('deriveClassProficiencies — équivalence dérivé == CLASS_PROFICIENCIES', () => {
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    it(`${className} : dérive exactement ses maîtrises d'armes/armures de base`, async () => {
      const effects = await deriveClassProficiencies(orm, [classIdByName.get(className)!])
      const norm = (es: Effect[]) => es.map(e => `${e.type}:${e.value}`).sort()
      expect(norm(effects)).toEqual(norm(expectedEffects(className)))
    })
  }
})

describe('deriveClassProficiencies — multiclasse & cas vides', () => {
  it('multiclasse : dérive l\'union des porteurs de toutes les classes', async () => {
    const barbare = classIdByName.get('Barbare')!
    const magicien = classIdByName.get('Magicien')!
    const effects = await deriveClassProficiencies(orm, [barbare, magicien])
    const norm = (es: Effect[]) => es.map(e => `${e.type}:${e.value}`).sort()
    expect(norm(effects)).toEqual(norm([...expectedEffects('Barbare'), ...expectedEffects('Magicien')]))
  })

  it('rend [] pour une liste de classes vide', async () => {
    expect(await deriveClassProficiencies(orm, [])).toEqual([])
  })

  it('rend [] pour une classe sans porteur (aucune régression pré-seed)', async () => {
    expect(await deriveClassProficiencies(orm, [bareClassId])).toEqual([])
  })
})
