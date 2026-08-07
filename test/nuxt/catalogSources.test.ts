import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import {
  loadClasses,
  loadSpecies,
  loadSubclasses,
  loadFeats,
  loadInvocations,
  loadBackgrounds,
} from '../../server/utils/catalogSources'

// ─────────────────────────────────────────────────────────────────────────────
// Contrat des LOADERS de listes de référence (lot 6a). Même patron que
// `buildCatalog.test.ts` : on rejoue TOUTE la chaîne de migrations sur une base libsql en
// mémoire (schéma de prod), on seede un jeu minimal, puis on vérifie la FORME exacte que chaque
// loader produit — celle dont dépendent le builder et la fiche, et que les endpoints
// `/api/catalog/*` (ET les endpoints legacy repointés) renvoient tels quels. Le `db` est injecté
// (drizzle-sur-libsql ici, D1 en prod via `useDrizzle()`).
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

const FIGHTER = 1
const WARLOCK = 2

let orm: ReturnType<typeof drizzle>

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

  // Classes (Guerrier id 1, Occultiste id 2) — loadClasses trie par id de classe.
  await orm.insert(srcSchema.classes).values([
    { id: FIGHTER, name: 'Guerrier', hitDice: '1d10' },
    { id: WARLOCK, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' },
  ])

  // Sous-classes du Guerrier — insérées dans le désordre pour vérifier le tri par nom asc.
  // L'Occultiste n'en a AUCUNE (vérifie subclasses: []).
  await orm.insert(srcSchema.subclasses).values([
    { id: 11, classId: FIGHTER, name: 'Chevalier occulte', description: 'desc CO' },
    { id: 10, classId: FIGHTER, name: 'Champion', description: 'desc Champ' },
  ])

  // Espèces — insérées dans le désordre, loadSpecies trie par nom asc (Aasimar < Elfe < Nain).
  await orm.insert(srcSchema.characterSpecies).values([
    { id: 1, name: 'Elfe', size: 'M', speed: 30 },
    { id: 2, name: 'Nain', size: 'M', speed: 25 },
    { id: 3, name: 'Aasimar', size: 'M', speed: 30 },
  ])

  // Effets (JSON) pour tester le bakage.
  await orm.insert(srcSchema.effects).values([
    { id: 1, type: 'skill_proficiency', value: { skill: 'perception' } },
    { id: 2, type: 'proficiency', value: 'armes de guerre' },
  ])

  // Dons (feature_type='feat') — insérés dans le désordre, loadFeats trie par nom (fr).
  await orm.insert(srcSchema.features).values([
    { id: 100, name: 'Chanceux', featureType: 'feat', description: 'desc Chanceux' },
    { id: 101, name: 'Alerte', featureType: 'feat', description: 'desc Alerte', prerequisites: { minAbilityScore: { abilities: ['dex'], score: 13 } } },
  ])
  await orm.insert(srcSchema.featureEffects).values({ featureId: 100, effectId: 1 })

  // Invocations (feature_type='eldritch_invocation') — l'une avec levelRequired, l'autre null
  // (→ défaut 1) + prérequis de pacte + un effet.
  await orm.insert(srcSchema.features).values([
    { id: 200, name: 'Manifestation niv.5', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 5, tag: 'invocation' },
    { id: 201, name: 'Manifestation Lame', featureType: 'eldritch_invocation', classId: WARLOCK, tag: 'invocation', prerequisites: { requiredPactBoon: 'blade' } },
  ])
  await orm.insert(srcSchema.featureEffects).values({ featureId: 201, effectId: 2 })

  // Historiques : 2 globaux (character_sheet_id NULL) + 1 homebrew rattaché à la fiche 42.
  await orm.insert(srcSchema.backgrounds).values([
    { id: 1, name: 'Sage' },
    { id: 2, name: 'Acolyte' },
    { id: 3, name: 'Passé mystérieux', characterSheetId: 42 },
  ])

  // Contenu 5.5 (ruleset '5.5') — DOIT rester invisible aux loaders par défaut (ruleset '5'),
  // le filet anti-pollution du builder 2014 (Lot A). Tout ce qui précède est en '5' par défaut.
  await orm.insert(srcSchema.characterSpecies).values({ id: 4, name: 'Goliath', size: 'M', speed: 30, ruleset: '5.5' })
  await orm.insert(srcSchema.classes).values({ id: 3, name: 'Barde', hitDice: '1d8', ruleset: '5.5' })
  await orm.insert(srcSchema.features).values({ id: 102, name: 'Vigilant', featureType: 'feat', description: 'don 5.5', ruleset: '5.5' })
  await orm.insert(srcSchema.backgrounds).values({ id: 4, name: 'Guide', ruleset: '5.5' })
})

describe('loadClasses', () => {
  it('classes triées par id, sous-classes imbriquées triées par nom, classe sans sous-classe → []', async () => {
    const classes = await loadClasses(orm)
    expect(classes.map(c => c.name)).toEqual(['Guerrier', 'Occultiste'])

    const fighter = classes[0]!
    expect(fighter.hitDice).toBe('1d10')
    expect(fighter.subclasses.map(s => s.name)).toEqual(['Champion', 'Chevalier occulte'])

    const warlock = classes[1]!
    expect(warlock.subclasses).toEqual([])
  })
})

describe('loadSpecies', () => {
  it('liste plate {id, name} triée par nom', async () => {
    const species = await loadSpecies(orm)
    expect(species).toEqual([
      { id: 3, name: 'Aasimar' },
      { id: 1, name: 'Elfe' },
      { id: 2, name: 'Nain' },
    ])
  })
})

describe('loadSubclasses', () => {
  it('sous-classes d\'une classe par nom {id, name, description}', async () => {
    const subs = await loadSubclasses(orm, 'Guerrier')
    expect(subs.map(s => s.name)).toEqual(['Champion', 'Chevalier occulte'])
    expect(subs[0]).toEqual({ id: 10, name: 'Champion', description: 'desc Champ' })
  })

  it('classe inconnue → []', async () => {
    expect(await loadSubclasses(orm, 'Inconnue')).toEqual([])
  })
})

describe('loadFeats', () => {
  it('dons triés par nom (fr), effets bakés, prérequis charriés', async () => {
    const feats = await loadFeats(orm)
    expect(feats.map(f => f.name)).toEqual(['Alerte', 'Chanceux'])

    const alerte = feats[0]!
    expect(alerte.prerequisites).toEqual({ minAbilityScore: { abilities: ['dex'], score: 13 } })
    expect(alerte.effects).toEqual([])

    const chanceux = feats[1]!
    expect(chanceux.effects).toHaveLength(1)
    expect(chanceux.effects[0]!.type).toBe('skill_proficiency')
    expect(chanceux.effects[0]!.value).toEqual({ skill: 'perception' })
  })
})

describe('loadInvocations', () => {
  it('levelRequired (défaut 1 si null), prérequis, effets {type, value}', async () => {
    const invs = await loadInvocations(orm)
    const byId = new Map(invs.map(i => [i.id, i]))

    expect(byId.get(200)!.levelRequired).toBe(5)
    expect(byId.get(200)!.prerequisites).toBeNull()

    const lame = byId.get(201)!
    expect(lame.levelRequired).toBe(1) // null → défaut 1
    expect(lame.prerequisites).toEqual({ requiredPactBoon: 'blade' })
    expect(lame.effects).toEqual([{ type: 'proficiency', value: 'armes de guerre' }])
  })
})

describe('loadBackgrounds', () => {
  it('sans characterSheetId → historiques globaux uniquement, triés par nom', async () => {
    const bgs = await loadBackgrounds(orm)
    expect(bgs.map(b => b.name)).toEqual(['Acolyte', 'Sage'])
  })

  it('avec characterSheetId → globaux + homebrew de la fiche, triés par nom', async () => {
    const bgs = await loadBackgrounds(orm, 42)
    expect(bgs.map(b => b.name)).toEqual(['Acolyte', 'Passé mystérieux', 'Sage'])
  })

  it('fiche sans homebrew → globaux uniquement', async () => {
    const bgs = await loadBackgrounds(orm, 99)
    expect(bgs.map(b => b.name)).toEqual(['Acolyte', 'Sage'])
  })
})

describe('filtre ruleset (défaut \'5\' → le builder 2014 ne voit jamais le 5.5)', () => {
  it('loadSpecies : défaut exclut le 5.5 ; \'5.5\' ne rend que le 5.5', async () => {
    expect((await loadSpecies(orm)).map(s => s.name)).toEqual(['Aasimar', 'Elfe', 'Nain'])
    expect(await loadSpecies(orm, '5.5')).toEqual([{ id: 4, name: 'Goliath' }])
  })

  it('loadClasses : défaut exclut le 5.5 ; \'5.5\' ne rend que le 5.5', async () => {
    expect((await loadClasses(orm)).map(c => c.name)).toEqual(['Guerrier', 'Occultiste'])
    expect((await loadClasses(orm, '5.5')).map(c => c.name)).toEqual(['Barde'])
  })

  it('loadFeats : défaut exclut le 5.5 ; \'5.5\' ne rend que le 5.5', async () => {
    expect((await loadFeats(orm)).map(f => f.name)).toEqual(['Alerte', 'Chanceux'])
    expect((await loadFeats(orm, '5.5')).map(f => f.name)).toEqual(['Vigilant'])
  })

  it('loadBackgrounds : défaut exclut le 5.5 ; \'5.5\' ne rend que le 5.5 global', async () => {
    expect((await loadBackgrounds(orm)).map(b => b.name)).toEqual(['Acolyte', 'Sage'])
    expect((await loadBackgrounds(orm, undefined, '5.5')).map(b => b.name)).toEqual(['Guide'])
  })
})
