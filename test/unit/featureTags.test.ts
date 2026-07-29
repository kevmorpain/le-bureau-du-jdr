import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'
import { FEATURE_TAGS, featureTagEnum } from '../../shared/rules/featureTags'
import { warlockInvocationFeatures } from '../../server/db/seeds/data/warlock_invocations'
import { FEATURE_TAG_CONTRACT } from '../fixtures/featureTags'

// Le `tag` (feature_group) d'une feature a deux chemins d'arrivée en base : la
// MIGRATION 0081 pour les bases déjà déployées (on ne re-seede pas la prod) et le
// SEED pour les bases neuves. Les deux doivent produire exactement le contrat de
// test/fixtures/featureTags.ts, sinon la résolution `optionSource:{feature_group}`
// (progression, lot 4c) énumérerait des options différentes en prod et en local.

const MIGRATIONS_DIR = fileURLToPath(new URL('../../server/db/migrations/', import.meta.url))
const NUXTHUB_UTILS = new URL('../../node_modules/@nuxthub/core/dist/db/lib/utils.mjs', import.meta.url)
const MIGRATION = '0081_features_tag.sql'

describe('groupes de features-options — const canonique', () => {
  it('FEATURE_TAGS = l\'ensemble et l\'ordre du contrat', () => {
    expect([...FEATURE_TAGS]).toEqual(FEATURE_TAG_CONTRACT.map(c => c.tag))
  })

  it('featureTagEnum valide chaque tag du contrat', () => {
    for (const { tag } of FEATURE_TAG_CONTRACT) {
      expect(featureTagEnum.parse(tag)).toBe(tag)
    }
  })
})

describe('groupes de features-options — migration 0081', () => {
  it('pose la colonne ET tague les bonnes features sur une base peuplée', async () => {
    const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
    const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]

    const db = createClient({ url: ':memory:' })
    // `features` dans son état d'avant 0081 : minimal mais fidèle sur les colonnes
    // que le backfill lit (feature_type) — le tag n'existe pas encore.
    await db.execute('CREATE TABLE features (id integer PRIMARY KEY NOT NULL, name text NOT NULL, feature_type text NOT NULL)')

    // Options réelles de chaque groupe déjà seedé (aujourd'hui : invocation).
    const expectations: { id: number, expectTag: string | null }[] = []
    let id = 0
    for (const c of FEATURE_TAG_CONTRACT.filter(c => c.featureType)) {
      id++
      await db.execute({ sql: 'INSERT INTO features (id, name, feature_type) VALUES (?, ?, ?)', args: [id, `opt-${c.tag}`, c.featureType!] })
      expectations.push({ id, expectTag: c.tag })
    }
    // Contrôles : les features qui ne sont l'option d'aucun groupe restent à NULL.
    for (const ft of ['class_feature', 'subclass_feature', 'feat', 'species_trait']) {
      id++
      await db.execute({ sql: 'INSERT INTO features (id, name, feature_type) VALUES (?, ?, ?)', args: [id, `ctrl-${ft}`, ft] })
      expectations.push({ id, expectTag: null })
    }

    // La migration doit se suffire à elle-même : colonne + index + backfill.
    const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
    for (const statement of splitSqlQueries(sql)) {
      await db.execute(statement)
    }

    const rows = await db.execute('SELECT id, feature_type, tag FROM features ORDER BY id')
    const tagById = new Map(rows.rows.map(r => [Number(r.id), r.tag as string | null]))
    for (const { id, expectTag } of expectations) {
      expect(tagById.get(id), `feature #${id}`).toBe(expectTag)
    }
  })
})

describe('groupes de features-options — seed (base neuve)', () => {
  it('le seed tague toutes les invocations conformément au contrat', () => {
    const invocation = FEATURE_TAG_CONTRACT.find(c => c.tag === 'invocation')!

    expect(warlockInvocationFeatures.length).toBeGreaterThan(0)
    for (const feature of warlockInvocationFeatures) {
      expect({ featureType: feature.featureType, tag: feature.tag }, feature.name).toEqual({
        featureType: invocation.featureType,
        tag: invocation.tag,
      })
    }
  })
})
