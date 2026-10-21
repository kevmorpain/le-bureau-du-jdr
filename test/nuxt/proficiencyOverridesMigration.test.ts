import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { applyMigration, readMigration, replayMigrations } from '../fixtures/migrations'
import { SKILL_KEYS } from '../../shared/rules/skills'
import { ABILITY_KEYS, savingThrowKey } from '../../shared/rules/abilities'

// Migration 0153 : chaque ligne de `character_skills` est rangée là où la fiche la retrouve au même niveau (choix,
// historique personnalisé, ajout manuel) ou supprimée quand une règle l'accorde déjà ; puis la table disparaît.

const MIGRATION = '0153_proficiency_overrides_only.sql'

const CLASS = { warlock: 1, wizard: 2, rogue: 3 }
const PROGRESSION = { warlockSkills: 1, wizardSkills: 2, rogueExpertise: 3 }
const BACKGROUND = { charlatan: 2, investigator: 16 }

let client: Client

const rows = async (sql: string, args: (string | number)[] = []) => (await client.execute({ sql, args })).rows

const choicesOf = async (sheet: number) =>
  (await rows('SELECT progression_id, selected_value FROM character_choices WHERE character_sheet_id = ? ORDER BY progression_id, selected_value', [sheet]))
    .map(r => [Number(r.progression_id), r.selected_value])

const overridesOf = async (sheet: number) =>
  (await rows('SELECT proficiency_type, value, action FROM character_proficiency_overrides WHERE character_sheet_id = ? ORDER BY proficiency_type, value', [sheet]))
    .map(r => [r.proficiency_type, r.value, r.action])

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')
  await client.execute(`INSERT INTO classes (id, name, hit_dice) VALUES (${CLASS.warlock}, 'Occultiste', '1d8'), (${CLASS.wizard}, 'Magicien', '1d6'), (${CLASS.rogue}, 'Roublard', '1d8')`)
  await client.execute(`INSERT INTO features (id, name, feature_type, class_id, level_required) VALUES
    (10, 'Compétences de classe', 'choice_carrier', ${CLASS.warlock}, 1),
    (11, 'Compétences de classe', 'choice_carrier', ${CLASS.wizard}, 1),
    (12, 'Expertise', 'class_feature', ${CLASS.rogue}, 1),
    (20, 'Maîtrises de la classe', 'proficiency_grant', ${CLASS.warlock}, 1),
    (21, 'Maîtrises de la classe', 'proficiency_grant', ${CLASS.wizard}, 1),
    (30, 'Maîtrises d''historique', 'proficiency_grant', NULL, 1)`)
  await client.execute(`INSERT INTO progression (id, feature_id, kind, count, option_source, replaceable) VALUES
    (${PROGRESSION.warlockSkills}, 10, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["arcana","deception","history","intimidation","investigation","nature","religion"]}', 0),
    (${PROGRESSION.wizardSkills}, 11, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["arcana","history","insight","investigation","medicine","religion"]}', 0),
    (${PROGRESSION.rogueExpertise}, 12, 'expertise', '{"op":"fixed","value":2}', '{"type":"proficient_skills"}', 0)`)
  await client.execute(`INSERT INTO effects (id, type, value) VALUES
    (1, 'saving_throw_proficiency', '{"ability":"wis"}'), (2, 'saving_throw_proficiency', '{"ability":"cha"}'),
    (3, 'saving_throw_proficiency', '{"ability":"int"}'),
    (4, 'skill_proficiency', '{"skill":"deception"}'), (5, 'skill_proficiency', '{"skill":"sleight_of_hand"}')`)
  await client.execute(`INSERT INTO feature_effects (feature_id, effect_id) VALUES (20, 1), (20, 2), (21, 3), (21, 1), (30, 4), (30, 5)`)
  await client.execute(`INSERT INTO backgrounds (id, name, character_sheet_id, skill_proficiencies) VALUES
    (${BACKGROUND.charlatan}, 'Charlatan', NULL, '["deception","sleight_of_hand"]'),
    (${BACKGROUND.investigator}, 'Enquêteur', 2, '[]')`)
  await client.execute(`INSERT INTO background_features (background_id, feature_id) VALUES (${BACKGROUND.charlatan}, 30)`)
  // 2 : Occultiste à l'historique personnalisé ; 3 : Magicien Charlatan ; 5 : Roublard ; 6 : fiche aux seuls ajouts manuels.
  await client.execute(`INSERT INTO character_sheets (id, name, species_id, background_id) VALUES
    (2, 'A', 1, ${BACKGROUND.investigator}), (3, 'B', 1, ${BACKGROUND.charlatan}), (5, 'C', 1, NULL), (6, 'D', 1, NULL)`)
  await client.execute(`INSERT INTO character_classes (character_sheet_id, class_id, level, is_main) VALUES
    (2, ${CLASS.warlock}, 11, 1), (3, ${CLASS.wizard}, 2, 1), (5, ${CLASS.rogue}, 3, 1)`)
  const skill = (sheet: number, key: string, level: string, source: string, override = 0) => `(${sheet}, '${key}', '${level}', '${source}', ${override})`
  await client.execute(`INSERT INTO character_skills (character_sheet_id, skill_key, proficiency_level, source, is_override) VALUES
    ${skill(2, 'investigation', 'proficient', 'background')}, ${skill(2, 'perception', 'proficient', 'background')},
    ${skill(2, 'cha_save', 'proficient', 'class')}, ${skill(2, 'wis_save', 'proficient', 'class')},
    ${skill(2, 'history', 'proficient', 'class')}, ${skill(2, 'religion', 'proficient', 'class')},
    ${skill(2, 'arcana', 'proficient', 'manual', 1)}, ${skill(2, 'insight', 'none', 'manual', 1)},
    ${skill(3, 'deception', 'proficient', 'background')}, ${skill(3, 'sleightOfHand', 'proficient', 'background')},
    ${skill(3, 'arcana', 'proficient', 'class')}, ${skill(3, 'history', 'proficient', 'class')},
    ${skill(3, 'int_save', 'proficient', 'class')}, ${skill(3, 'wis_save', 'proficient', 'class')},
    ${skill(5, 'stealth', 'expert', 'class')}, ${skill(5, 'nature', 'proficient', 'class')},
    ${skill(6, 'con_save', 'expert', 'manual', 1)}, ${skill(6, 'perception', 'proficient', 'manual', 1)},
    ${skill(6, 'perception', 'expert', 'feat')}, ${skill(6, 'voler', 'proficient', 'manual', 1)}`)
  await applyMigration(client, MIGRATION)
})

describe('migration 0153 — les maîtrises de compétence quittent character_skills', () => {
  it('compétences de classe d\'avant les choix → choix sur le point de leur classe ; JS de classe déjà dérivés', async () => {
    expect(await choicesOf(2)).toEqual([[PROGRESSION.warlockSkills, 'history'], [PROGRESSION.warlockSkills, 'religion']])
    expect(await choicesOf(3)).toEqual([[PROGRESSION.wizardSkills, 'arcana'], [PROGRESSION.wizardSkills, 'history']])
  })

  it('historique personnalisé : ses compétences rejoignent ses colonnes ; historique seedé : déjà dérivées', async () => {
    const [investigator] = await rows('SELECT skill_proficiencies FROM backgrounds WHERE id = ?', [BACKGROUND.investigator])
    expect(JSON.parse(String(investigator!.skill_proficiencies)).sort()).toEqual(['investigation', 'perception'])
    expect(await overridesOf(3)).toEqual([])
  })

  it('l\'ajout manuel reste un ajout ; « aucune » disparaît', async () => {
    expect(await overridesOf(2)).toEqual([['skill', 'arcana', 'grant']])
  })

  it('expertise de classe → choix d\'expertise ; ce qu\'aucune règle n\'accorde → ajout manuel', async () => {
    expect(await choicesOf(5)).toEqual([[PROGRESSION.rogueExpertise, 'stealth']])
    expect(await overridesOf(5)).toEqual([['skill', 'nature', 'grant']])
  })

  it('garde le plus haut niveau posé, range les JS sous leur caractéristique et écarte une clé inconnue', async () => {
    expect(await overridesOf(6)).toEqual([['saving_throw', 'con', 'expertise'], ['skill', 'perception', 'expertise']])
  })

  it('supprime character_skills et skills', async () => {
    const tables = (await rows('SELECT name FROM sqlite_master WHERE type = \'table\'')).map(r => r.name)
    expect(tables).not.toContain('character_skills')
    expect(tables).not.toContain('skills')
  })

  it('n\'écarte que des clés hors des compétences et jets de sauvegarde', async () => {
    const sql = await readMigration(MIGRATION)
    const listed = sql.match(/WHERE skill_key IN \(([^)]*)\)\nGROUP BY/)![1]!.match(/'([^']+)'/g)!.map(s => s.slice(1, -1))
    expect(listed.sort()).toEqual([...SKILL_KEYS, ...ABILITY_KEYS.map(savingThrowKey)].sort())
  })
})
