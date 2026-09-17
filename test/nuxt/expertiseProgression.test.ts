import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { buildCatalog } from '../../server/utils/catalog'
import { resolveChoices, dueChoices, type Catalog } from '../../shared/rules/resolve'
import type { SkillKey } from '../../shared/rules/skills'
import { expertiseProgression, EXPERTISE_OWNER_NAME } from '../../server/db/seeds/data/expertise'

// ─────────────────────────────────────────────────────────────────────────────
// Mécanisme du point de choix d'EXPERTISE (F2). Ferme la boucle données→catalogue→résolution pour
// la progression `kind:'expertise'`, en vérifiant SURTOUT :
//  - le `count` CUMULATIF (`lookup`) : total dû au niveau, pas un delta figé ;
//  - le DELTA au level-up via `made` (2 picks déjà faits au niv 1 → remaining 2 au niv 6) ;
//  - `optionSource:{proficient_skills}` : options résolues LIVE contre la projection (aucune
//    option portée par le catalogue).
//
// On seede 2 classes (Roublard, owner « Expertise » niv 1 ; Barde, owner niv 3) via le builder de
// source `expertiseProgression`, puis on vérifie buildCatalog + resolveChoices/dueChoices.
//
// Env `nuxt` (comme buildCatalog.test) : le loader importe `~~/server/db/schema`.
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const ROUBLARD = 4
const BARDE = 5
// Compétences déjà maîtrisées d'un perso-test (source live des options d'expertise).
const PROFICIENT: SkillKey[] = ['stealth', 'perception', 'acrobatics', 'deception']

let catalog: Catalog
const progIdByClass = new Map<number, number>()

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
  const orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  await orm.insert(srcSchema.classes).values([
    { id: ROUBLARD, name: 'Roublard', hitDice: '1d8' },
    { id: BARDE, name: 'Barde', hitDice: '1d8' },
  ])

  // Owner « Expertise » (porteur de la progression) par classe. Reste `class_feature` VISIBLE : le
  // pick d'expertise est une compétence passée à `expert`, pas une feature matérialisée.
  let featureId = 200
  for (const [className, classId, levelRequired] of [
    ['Roublard', ROUBLARD, 1],
    ['Barde', BARDE, 3],
  ] as const) {
    const ownerId = featureId++
    await orm.insert(srcSchema.features).values({
      id: ownerId,
      name: EXPERTISE_OWNER_NAME,
      featureType: 'class_feature',
      classId,
      levelRequired,
    })
    const prog = expertiseProgression(className)!
    const [row] = await orm.insert(srcSchema.progression).values({
      featureId: ownerId,
      kind: prog.kind,
      count: prog.count,
      optionSource: prog.optionSource,
      replaceable: prog.replaceable ?? false,
    }).returning({ id: srcSchema.progression.id })
    progIdByClass.set(classId, row!.id)
  }

  catalog = await buildCatalog(orm, { classIds: [ROUBLARD, BARDE] })
}, 60000)

describe('progression expertise — buildCatalog', () => {
  it('une progression `expertise` par classe, SANS options catalogue (proficient_skills résolu live)', () => {
    const byClass = (classId: number) =>
      catalog.progressions.find(p => p.kind === 'expertise' && p.ownerClassId === classId)

    const roublard = byClass(ROUBLARD)
    const barde = byClass(BARDE)
    if (!roublard || !barde) throw new Error('progression expertise manquante pour Roublard ou Barde')

    // proficient_skills n'est PAS caché : le catalogue ne porte aucune option (résolu dans resolve()).
    expect(roublard.options).toBeUndefined()
    expect(barde.options).toBeUndefined()
    expect(roublard.optionSource).toEqual({ type: 'proficient_skills' })
    expect(roublard.ownerLevelRequired).toBe(1)
    expect(barde.ownerLevelRequired).toBe(3)
    expect(roublard.replaceable).toBe(false)
  })
})

describe('progression expertise — resolveChoices / dueChoices', () => {
  const projAt = (classId: number, classLevel: number, picks: number) => ({
    classLevels: { [classId]: classLevel },
    proficientSkills: PROFICIENT,
    picks: Array.from({ length: picks }, () => ({ progressionId: progIdByClass.get(classId)! })),
  })
  const expertiseOf = (classId: number, classLevel: number, picks = 0) =>
    resolveChoices(projAt(classId, classLevel, picks), catalog).choices.find(c => c.kind === 'expertise')

  it('Roublard : 2 dus dès le niveau 1, options = compétences déjà maîtrisées', () => {
    const c = expertiseOf(ROUBLARD, 1)
    expect(c, 'choix expertise Roublard niv 1').toBeDefined()
    expect(c!.count).toBe(2)
    expect(c!.made).toBe(0)
    expect(c!.remaining).toBe(2)
    // Options résolues LIVE : exactement les compétences maîtrisées de la projection.
    expect(c!.options.map(o => o.value).sort()).toEqual([...PROFICIENT].sort())
  })

  it('Roublard : au niveau 6, le count passe à 4 et le DELTA est de 2 (2 déjà pris)', () => {
    const c = expertiseOf(ROUBLARD, 6, 2)
    expect(c!.count).toBe(4)
    expect(c!.made).toBe(2)
    expect(c!.remaining).toBe(2)
    expect(dueChoices({ choices: [c!] }).map(x => x.kind)).toContain('expertise')
  })

  it('Roublard : niveau 6 avec les 4 picks faits → plus rien de dû', () => {
    const c = expertiseOf(ROUBLARD, 6, 4)
    expect(c!.remaining).toBe(0)
    expect(dueChoices({ choices: [c!] })).toHaveLength(0)
  })

  it('Barde : PAS d\'expertise avant le niveau 3, due au niveau 3 (2), à 4 au niveau 10', () => {
    expect(expertiseOf(BARDE, 2), 'Barde niv 2 : pas encore d\'expertise').toBeUndefined()

    const at3 = expertiseOf(BARDE, 3)
    expect(at3, 'Barde niv 3').toBeDefined()
    expect(at3!.count).toBe(2)
    expect(at3!.remaining).toBe(2)

    const at10 = expertiseOf(BARDE, 10, 2)
    expect(at10!.count).toBe(4)
    expect(at10!.remaining).toBe(2)
  })
})
