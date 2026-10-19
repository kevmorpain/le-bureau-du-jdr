import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0152 : les options déjà portées (manifestations, pacte, Métamagie, style de combat de la classe) deviennent des
// décisions sur le point de choix de leur classe, pour que le chemin générique puisse les remplacer.

const MIGRATION = '0152_feature_picks_backfill.sql'

const WARLOCK = 1
const FIGHTER = 2
const SORCERER = 3

const PROGRESSION = { invocations: 1, pact: 2, style: 3, metamagic: 4, additionalStyle: 5 }
const FEATURE = { invocationA: 401, invocationB: 402, pactBlade: 410, duel: 420, defense: 421, metamagicTwinned: 430, passive: 300 }

let client: Client

const choicesOf = async (sheetId: number): Promise<Array<[number, number]>> => {
  const res = await client.execute({
    sql: 'SELECT progression_id, selected_feature_id FROM character_choices WHERE character_sheet_id = ? ORDER BY progression_id, selected_feature_id',
    args: [sheetId],
  })
  return res.rows.map(r => [Number(r.progression_id), Number(r.selected_feature_id)])
}

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')
  await client.execute(`INSERT INTO classes (id, name, hit_dice) VALUES (${WARLOCK}, 'Occultiste', '1d8'), (${FIGHTER}, 'Guerrier', '1d10'), (${SORCERER}, 'Ensorceleur', '1d6')`)
  // Les porteurs des points de choix, puis les options qu'ils proposent.
  await client.execute(`INSERT INTO features (id, name, feature_type, class_id, level_required) VALUES
    (100, 'Manifestations occultes', 'class_feature', ${WARLOCK}, 2),
    (101, 'Faveur de pacte', 'choice_carrier', ${WARLOCK}, 3),
    (102, 'Style de combat', 'choice_carrier', ${FIGHTER}, 1),
    (103, 'Métamagie', 'class_feature', ${SORCERER}, 3),
    (104, 'Style de combat supplémentaire', 'subclass_feature', NULL, 10)`)
  await client.execute(`INSERT INTO features (id, name, feature_type, class_id, level_required, tag) VALUES
    (${FEATURE.invocationA}, 'Manif A', 'eldritch_invocation', ${WARLOCK}, 1, 'invocation'),
    (${FEATURE.invocationB}, 'Manif B', 'eldritch_invocation', ${WARLOCK}, 1, 'invocation'),
    (${FEATURE.pactBlade}, 'Pacte de la Lame', 'class_feature', ${WARLOCK}, 3, 'pact_boon'),
    (${FEATURE.duel}, 'Duel', 'fighting_style', ${FIGHTER}, 1, 'fighting_style'),
    (${FEATURE.defense}, 'Défense', 'fighting_style', ${FIGHTER}, 1, 'fighting_style'),
    (${FEATURE.metamagicTwinned}, 'Sort jumeau', 'class_feature', ${SORCERER}, 3, 'metamagic')`)
  await client.execute(`INSERT INTO features (id, name, feature_type, class_id, level_required) VALUES (${FEATURE.passive}, 'Second souffle', 'class_feature', ${FIGHTER}, 1)`)
  const progression = (id: number, featureId: number, kind: string, group: string) =>
    `(${id}, ${featureId}, '${kind}', '{"op":"fixed","value":1}', '{"type":"feature_group","group":"${group}"}', 0)`
  await client.execute(`INSERT INTO progression (id, feature_id, kind, count, option_source, replaceable) VALUES
    ${progression(PROGRESSION.invocations, 100, 'invocations', 'invocation')},
    ${progression(PROGRESSION.pact, 101, 'pact_boon', 'pact_boon')},
    ${progression(PROGRESSION.style, 102, 'fighting_style', 'fighting_style')},
    ${progression(PROGRESSION.metamagic, 103, 'metamagic', 'metamagic')},
    ${progression(PROGRESSION.additionalStyle, 104, 'additional_fighting_style', 'fighting_style')}`)
  // 1 : Occultiste (pacte + manifestations) ; 2 : Guerrier dont le style est déjà consigné ; 3 : Ensorceleur ;
  // 4 : Champion de niveau 10, dont le 2ᵉ style est consigné sur son point de choix et le 1er ne l'est pas.
  await client.execute(`INSERT INTO character_features (character_sheet_id, feature_id, current_uses) VALUES
    (1, ${FEATURE.pactBlade}, 0), (1, ${FEATURE.invocationA}, 0), (1, ${FEATURE.invocationB}, 0),
    (2, ${FEATURE.duel}, 0), (2, ${FEATURE.passive}, 0),
    (3, ${FEATURE.metamagicTwinned}, 0),
    (4, ${FEATURE.duel}, 0), (4, ${FEATURE.defense}, 0)`)
  await client.execute(`INSERT INTO character_choices (character_sheet_id, progression_id, selected_feature_id) VALUES
    (2, ${PROGRESSION.style}, ${FEATURE.duel}),
    (4, ${PROGRESSION.additionalStyle}, ${FEATURE.defense})`)
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0152 — options de feature déjà portées', () => {
  it('consigne le pacte et les manifestations d\'un Occultiste sur leur point de choix', async () => {
    expect(await choicesOf(1)).toEqual([
      [PROGRESSION.invocations, FEATURE.invocationA],
      [PROGRESSION.invocations, FEATURE.invocationB],
      [PROGRESSION.pact, FEATURE.pactBlade],
    ])
  })

  it('consigne la Métamagie d\'un Ensorceleur', async () => {
    expect(await choicesOf(3)).toEqual([[PROGRESSION.metamagic, FEATURE.metamagicTwinned]])
  })

  it('ne double pas un style déjà consigné, et ne prend pas un passif pour une option', async () => {
    expect(await choicesOf(2)).toEqual([[PROGRESSION.style, FEATURE.duel]])
  })

  it('ne reprend pas sur le style de la classe celui que le Champion a pris sur son propre point de choix', async () => {
    expect(await choicesOf(4)).toEqual([
      [PROGRESSION.style, FEATURE.duel],
      [PROGRESSION.additionalStyle, FEATURE.defense],
    ])
  })

  it('sur une base vierge, ne crée rien', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute('SELECT COUNT(*) AS n FROM character_choices')
    expect(Number(res.rows[0]!.n)).toBe(0)
  })
})
