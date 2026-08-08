import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'
import { CreatureSize } from '../../server/db/schema/character_species'
import { seedElfLineages } from '../../server/db/seeds/lib/seedElfLineages'
import { loadSpeciesLineages } from '../../server/utils/catalogSources'

// Lot 5b (chantier lignée, D17) — le loader `loadSpeciesLineages` expose la matière seedée
// (species_features + lineage_features + effets) sous la forme d'affichage du picker : bonus de
// carac. COMBINÉS base ⊕ lignée, vitesse effective, vision, traits propres (hors carac./vitesse).
// On seede l'Elfe et on vérifie l'équivalence avec les valeurs qu'avait le blob RaceData hardcodé.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any
let elfBaseId: number

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
  await seedElfLineages(orm)
  await orm.insert(srcSchema.characterSpecies).values({ name: 'Humain', ruleset: '5', size: CreatureSize.Medium, speed: 9 })

  const [base] = await orm.select().from(srcSchema.characterSpecies)
    .where(and(eq(srcSchema.characterSpecies.name, 'Elfe'), eq(srcSchema.characterSpecies.ruleset, '5')))
  elfBaseId = base.id
}, 60000)

describe('loadSpeciesLineages (D17, lot 5b)', () => {
  it('rend base + 3 lignées, triées par id d\'insertion (Haut-elfe, Elfe des bois, Drow)', async () => {
    const rich = await loadSpeciesLineages(orm, elfBaseId)
    expect(rich).not.toBeNull()
    expect(rich!.name).toBe('Elfe')
    expect(rich!.speed).toBe(9)
    expect(rich!.lineages.map(l => l.name)).toEqual(['Haut-elfe', 'Elfe des bois', 'Drow'])
  })

  it('Haut-elfe : bonus COMBINÉS {dex:2,int:1}, vitesse 9, vision 18, traits hors carac./vitesse', async () => {
    const { lineages } = (await loadSpeciesLineages(orm, elfBaseId))!
    const he = lineages.find(l => l.name === 'Haut-elfe')!
    expect(he.abilityBonuses).toEqual({ dex: 2, int: 1 })
    expect(he.speed).toBe(9)
    expect(he.darkvision).toBe(18)
    // Traits propres, SANS « Augmentation de caractéristiques » ni « Vitesse » (déjà en badges).
    expect(he.traits).toContain('Entraînement aux armes elfiques')
    expect(he.traits).toContain('Sort mineur')
    expect(he.traits).not.toContain('Augmentation de caractéristiques')
    expect(he.traits).not.toContain('Vitesse')
  })

  it('Elfe des bois : {dex:2,wis:1}, vitesse effective 10,5 (walking_speed lignée), trait descriptif gardé', async () => {
    const wood = (await loadSpeciesLineages(orm, elfBaseId))!.lineages.find(l => l.name === 'Elfe des bois')!
    expect(wood.abilityBonuses).toEqual({ dex: 2, wis: 1 })
    expect(wood.speed).toBe(10.5)
    // « Cachette naturelle » n'a aucun effet → gardé comme trait.
    expect(wood.traits).toContain('Cachette naturelle')
  })

  it('Drow : {dex:2,cha:1}, vision 36, traits drow (magie/sensibilité)', async () => {
    const drow = (await loadSpeciesLineages(orm, elfBaseId))!.lineages.find(l => l.name === 'Drow')!
    expect(drow.abilityBonuses).toEqual({ dex: 2, cha: 1 })
    expect(drow.darkvision).toBe(36)
    expect(drow.traits).toContain('Magie drow')
    expect(drow.traits).toContain('Sensibilité au soleil')
  })

  it('espèce sans lignée → lineages: []', async () => {
    const [humain] = await orm.select().from(srcSchema.characterSpecies).where(eq(srcSchema.characterSpecies.name, 'Humain'))
    const rich = await loadSpeciesLineages(orm, humain.id)
    expect(rich).not.toBeNull()
    expect(rich!.lineages).toEqual([])
  })

  it('espèce inconnue → null', async () => {
    expect(await loadSpeciesLineages(orm, 999999)).toBeNull()
  })
})
