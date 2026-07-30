import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'
import { INVOCATIONS_KNOWN, warlockPactBoonFeatures, warlockProgressionByOwner } from '../../server/db/seeds/data/warlock_progression'
import { warlockInvocations } from '../../server/db/seeds/data/warlock_invocations'
import {
  FEATURE_GROUP_RESOLUTION,
  WARLOCK_PACT_BOON_OPTIONS,
  WARLOCK_PROGRESSION_CONTRACT,
} from '../fixtures/warlockProgression'

// Le catalogue de choix de l'Occultiste (lot 4c) a deux chemins d'arrivée en base : la
// MIGRATION 0082 pour les bases déjà déployées (on ne re-seede pas la prod) et le SEED
// pour les bases neuves. Les deux doivent produire exactement le contrat de
// test/fixtures/warlockProgression.ts — sinon une fiche créée en prod et la même créée en
// local ne verraient pas les mêmes options de choix. On vérifie aussi que chaque
// optionSource:{feature_group} résout un ensemble d'options non vide.

const MIGRATIONS_DIR = fileURLToPath(new URL('../../server/db/migrations/', import.meta.url))
const NUXTHUB_UTILS = new URL('../../node_modules/@nuxthub/core/dist/db/lib/utils.mjs', import.meta.url)
const MIGRATION = '0082_progression_character_choices.sql'

describe('catalogue de choix Occultiste — seed (module propre)', () => {
  it('warlockProgressionByOwner porte exactement le contrat', () => {
    const actual = warlockProgressionByOwner.map(o => ({
      ownerName: o.ownerName,
      ownerLevelRequired: o.ownerLevelRequired,
      kind: o.progression.kind,
      count: o.progression.count,
      optionSource: o.progression.optionSource,
      replaceable: o.progression.replaceable ?? false,
    }))
    expect(actual).toEqual(WARLOCK_PROGRESSION_CONTRACT)
  })

  it('warlockPactBoonFeatures porte les 3 options du contrat', () => {
    const actual = warlockPactBoonFeatures.map(f => ({
      name: f.name,
      levelRequired: f.levelRequired,
      tag: f.tag,
      featureType: f.featureType,
    }))
    expect(actual).toEqual(WARLOCK_PACT_BOON_OPTIONS)
  })

  it('INVOCATIONS_KNOWN est la formule du count de la progression invocations (source unique)', () => {
    const invocations = WARLOCK_PROGRESSION_CONTRACT.find(c => c.kind === 'invocations')!
    expect(INVOCATIONS_KNOWN).toEqual(invocations.count)
  })

  it('le groupe invocation compte bien les 41 manifestations attendues', () => {
    expect(warlockInvocations.length).toBe(FEATURE_GROUP_RESOLUTION.invocation)
  })
})

describe('catalogue de choix Occultiste — migration 0082 sur base peuplée', () => {
  it('crée les tables, les 3 options de pacte et les 6 progressions du contrat', async () => {
    const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
    const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]

    const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()
    expect(files).toContain(MIGRATION)

    const db = createClient({ url: ':memory:' })
    await db.execute('PRAGMA foreign_keys = ON')

    // 1. Rejouer la chaîne JUSQU'AVANT 0082 → état du schéma de production.
    for (const file of files.filter(f => f < MIGRATION)) {
      const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
      for (const statement of splitSqlQueries(sql)) await db.execute(statement)
    }

    // 2. Peupler comme la prod : la classe Occultiste, ses features PROPRIÉTAIRES (celles
    //    que la migration retrouve par nom + niveau) et ses 41 invocations déjà taguées
    //    (état post-0081, puisqu'on ne re-seede pas la prod).
    await db.execute({ sql: 'INSERT INTO classes (id, name, hit_dice) VALUES (?, ?, ?)', args: [1, 'Occultiste', '1d8'] })

    let id = 10
    for (const c of WARLOCK_PROGRESSION_CONTRACT) {
      await db.execute({
        sql: 'INSERT INTO features (id, name, feature_type, class_id, level_required) VALUES (?, ?, ?, ?, ?)',
        args: [id++, c.ownerName, 'class_feature', 1, c.ownerLevelRequired],
      })
    }
    for (const inv of warlockInvocations) {
      await db.execute({
        sql: 'INSERT INTO features (id, name, feature_type, class_id, level_required, tag) VALUES (?, ?, ?, ?, ?, ?)',
        args: [id++, inv.name, 'eldritch_invocation', 1, inv.levelRequired, 'invocation'],
      })
    }

    // 3. La migration doit se suffire à elle-même : tables + backfill du catalogue.
    const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
    for (const statement of splitSqlQueries(sql)) await db.execute(statement)

    // ── 3 options de pacte, taguées, rattachées à l'Occultiste ──
    const pactRows = await db.execute('SELECT name, level_required, feature_type, tag, class_id FROM features WHERE tag = \'pact_boon\'')
    const actualPact = pactRows.rows
      .map(r => ({ name: r.name as string, levelRequired: Number(r.level_required), tag: r.tag, featureType: r.feature_type }))
      .sort((a, b) => a.name.localeCompare(b.name))
    expect(actualPact).toEqual([...WARLOCK_PACT_BOON_OPTIONS].sort((a, b) => a.name.localeCompare(b.name)))
    for (const r of pactRows.rows) expect(Number(r.class_id)).toBe(1)

    // ── 6 progressions, chacune rattachée à sa bonne feature propriétaire ──
    const progRows = await db.execute(
      'SELECT p.kind, p.count, p.option_source, p.replaceable, f.name AS owner_name, f.level_required AS owner_level '
      + 'FROM progression p JOIN features f ON p.feature_id = f.id',
    )
    expect(progRows.rows.length, 'chaque progression doit pointer une feature réelle')
      .toBe(WARLOCK_PROGRESSION_CONTRACT.length)

    const byOwner = new Map(progRows.rows.map(r => [`${r.owner_name}@${Number(r.owner_level)}`, r]))
    for (const c of WARLOCK_PROGRESSION_CONTRACT) {
      const row = byOwner.get(`${c.ownerName}@${c.ownerLevelRequired}`)
      expect(row, `progression pour ${c.ownerName} (niv.${c.ownerLevelRequired})`).toBeDefined()
      expect(row!.kind).toBe(c.kind)
      expect(JSON.parse(row!.count as string)).toEqual(c.count)
      expect(JSON.parse(row!.option_source as string)).toEqual(c.optionSource)
      expect(Boolean(row!.replaceable)).toBe(c.replaceable)
    }

    // ── Résolution optionSource:{feature_group} → ensemble non vide ──
    for (const [group, expected] of Object.entries(FEATURE_GROUP_RESOLUTION)) {
      const res = await db.execute({ sql: 'SELECT count(*) AS c FROM features WHERE tag = ?', args: [group] })
      expect(Number(res.rows[0]!.c), `résolution du groupe ${group}`).toBe(expected)
    }
  })
})
