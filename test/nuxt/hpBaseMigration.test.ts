import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { loadSheetRelations, sheetHitPointsOf } from '../../server/utils/characterSheetLoader'
import { applyMigration, migrationFiles, replayMigrations } from '../fixtures/migrations'

// Migration 0117 : `max_hp` stockait une somme qui incluait le modificateur de CON ; `hp_base` n'en garde que la part
// « dés ». Chaque fiche doit garder le MÊME maximum affiché : ce que le serveur dérive (CON actuelle × niveau) après la
// migration égale ce qui était stocké avant. Le SQL de la migration et `shared/rules/` calculent donc la CON du même
// façon — ce test le garde, sur chaque source de CON.

const MIGRATION = '0117_hp_base.sql'
const FIGHTER = 1
const RACE = 1 // porte CON +2 et FOR +2
const PLAIN = 2 // aucun bonus
const LINEAGE = 1

let client: Client
const oldMax = new Map<number, number>()

const run = (sql: string) => client.execute(sql)
const effect = (id: number, type: string, value: object) =>
  run(`INSERT INTO effects (id, type, value) VALUES (${id}, '${type}', '${JSON.stringify(value)}')`)
const feature = (id: number, type: string, extra: { classId?: number, level?: number, lineageId?: number } = {}) =>
  run(`INSERT INTO features (id, name, feature_type, class_id, level_required, lineage_id) VALUES (${id}, 'F${id}', '${type}', ${extra.classId ?? 'NULL'}, ${extra.level ?? 'NULL'}, ${extra.lineageId ?? 'NULL'})`)
const link = (featureId: number, effectId: number) =>
  run(`INSERT INTO feature_effects (feature_id, effect_id) VALUES (${featureId}, ${effectId})`)
const sheet = async (id: number, { max, con, level, species = RACE }: { max: number, con?: number, level?: number, species?: number }) => {
  await run(`INSERT INTO character_sheets (id, name, species_id, max_hp) VALUES (${id}, 'Fiche ${id}', ${species}, ${max})`)
  if (con != null) await run(`INSERT INTO character_ability_scores (character_sheet_id, ability_id, value) VALUES (${id}, 'con', ${con})`)
  if (level) await run(`INSERT INTO character_classes (character_sheet_id, class_id, level, is_main) VALUES (${id}, ${FIGHTER}, ${level}, 1)`)
  oldMax.set(id, max)
}
const hpBaseOf = async (id: number) => Number((await run(`SELECT hp_base FROM character_sheets WHERE id = ${id}`)).rows[0]!.hp_base)

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await run('PRAGMA foreign_keys = OFF')
  await run(`INSERT INTO classes (id, name, hit_dice) VALUES (${FIGHTER}, 'Guerrier', '1d10')`)
  await run(`INSERT INTO character_species (id, name, size, speed) VALUES (${RACE}, 'Nain', 'medium', 25), (${PLAIN}, 'Humain', 'medium', 30)`)
  await run(`INSERT INTO species_lineages (id, species_id, name) VALUES (${LINEAGE}, ${RACE}, 'Nain des montagnes')`)

  // Espèce : CON +2 (feature 1) ; lignée choisie : CON +1 à partir du niveau 3 (feature 2).
  await effect(1, 'ability_increase', { ability: 'con', amount: 2 })
  await effect(2, 'ability_increase', { ability: 'con', amount: 1 })
  await effect(3, 'ability_increase', { ability: 'str', amount: 2 })
  await effect(4, 'ability_increase_choice', { count: 1, amount: 1 })
  await effect(5, 'ability_max_increase', { ability: 'con', amount: 4 })
  await effect(6, 'ability_increase', { ability: 'con', amount: 4 })
  await feature(1, 'species_trait')
  await run(`INSERT INTO species_features (species_id, feature_id) VALUES (${RACE}, 1)`)
  await link(1, 1)
  await link(1, 3)
  await feature(2, 'species_trait', { lineageId: LINEAGE, level: 3 })
  await link(2, 2)
  await feature(3, 'feat') // demi-don à choix
  await link(3, 4)
  await feature(4, 'class_feature', { classId: FIGHTER, level: 20 }) // Champion primitif : CON +4, maximum +4
  await link(4, 6)
  await link(4, 5)
  await feature(5, 'class_feature', { classId: FIGHTER, level: 6 }) // débloquée au niveau 6
  await link(5, 2)

  // 1. Espèce CON +2 (le trait porte aussi FOR +2) : 14 + 2 = 16 → +3, niveau 5.
  await sheet(1, { max: 50, con: 14, level: 5 })
  // 2. Score de base absent → 10, plus l'espèce : 12 → +1.
  await sheet(2, { max: 20, level: 3 })
  // 3. Lignée choisie, trait gated au niveau 3 : niveau 2 (pas encore) puis niveau 4 (actif).
  await sheet(3, { max: 30, con: 13, level: 2 })
  await sheet(4, { max: 44, con: 13, level: 4 })
  await run('INSERT INTO character_choices (character_sheet_id, progression_id, selected_lineage_id) VALUES (3, 1, 1), (4, 1, 1)')
  // 5. ASI : seul celui dont le niveau de classe est atteint compte.
  await sheet(5, { max: 36, con: 13, level: 5 })
  await run('INSERT INTO character_ability_score_improvements (character_sheet_id, class_id, class_level, ability, amount) VALUES (5, 1, 4, \'con\', 2), (5, 1, 8, \'con\', 2), (5, 1, 4, \'str\', 2)')
  // 6. Demi-don de CON choisi : 15 + 1 + 2 (espèce) = 18 → +4.
  await sheet(6, { max: 60, con: 15, level: 6 })
  await run('INSERT INTO character_features (character_sheet_id, feature_id, current_uses, source, choices) VALUES (6, 3, 0, \'asi\', \'{"ability":"con"}\')')
  // 7. Aptitude de classe débloquée au niveau 6 (+1 CON) ; la même, non débloquée, au niveau 5.
  await sheet(7, { max: 50, con: 13, level: 6 })
  await sheet(8, { max: 40, con: 13, level: 5 })
  await run('INSERT INTO character_features (character_sheet_id, feature_id, current_uses) VALUES (7, 5, 0), (8, 5, 0)')
  // 8. Plafond : base 19 + espèce 2 → plafonné à 20 (+5) ; Champion primitif (niveau 20) : 19 + 2 + 4 = 25, plafonné au maximum relevé de 24 (+7).
  await sheet(9, { max: 100, con: 19, level: 10 })
  await sheet(10, { max: 300, con: 19, level: 20 })
  await run('INSERT INTO character_features (character_sheet_id, feature_id, current_uses) VALUES (10, 4, 0)')
  // 9. Modificateur négatif, arrondi au plancher : CON 8 → −1, CON 9 → −1 (⌊(9 − 10) / 2⌋).
  await sheet(11, { max: 30, con: 8, level: 4, species: PLAIN })
  await sheet(14, { max: 20, con: 9, level: 2, species: PLAIN })
  // 10. Fiche sans classe : rien à retrancher.
  await sheet(12, { max: 7, con: 14 })
  // 11. Maximum stocké inférieur à la CON de la fiche : jamais sous 1.
  await sheet(13, { max: 1, con: 20, level: 5 })

  await applyMigration(client, MIGRATION)
  // Le schéma Drizzle lit les colonnes des migrations suivantes : l'équivalence charge la fiche par lui.
  for (const file of (await migrationFiles()).filter(f => f > MIGRATION)) await applyMigration(client, file)
})

describe('migration 0117 — PV de base', () => {
  it('retranche la CON actuelle × niveau total', async () => {
    expect(await hpBaseOf(1)).toBe(50 - 3 * 5)
    expect(await hpBaseOf(2)).toBe(20 - 1 * 3)
  })

  it('compte la lignée choisie une fois son niveau atteint', async () => {
    // Niveau 2 : CON 13 + 2 (espèce) = 15 → +2. Niveau 4 : 13 + 2 + 1 = 16 → +3.
    expect(await hpBaseOf(3)).toBe(30 - 2 * 2)
    expect(await hpBaseOf(4)).toBe(44 - 3 * 4)
  })

  it('ne compte que les ASI dont le niveau de classe est atteint', async () => {
    // 13 + 2 (espèce) + 2 (ASI niveau 4) = 17 → +3 ; l'ASI du niveau 8 et celui de FOR ne comptent pas.
    expect(await hpBaseOf(5)).toBe(36 - 3 * 5)
  })

  it('résout le choix de caractéristique d\'un demi-don', async () => {
    expect(await hpBaseOf(6)).toBe(60 - 4 * 6)
  })

  it('applique une aptitude de classe une fois son niveau atteint, pas avant', async () => {
    // Niveau 6 : 13 + 2 + 1 = 16 → +3. Niveau 5 : 13 + 2 = 15 → +2.
    expect(await hpBaseOf(7)).toBe(50 - 3 * 6)
    expect(await hpBaseOf(8)).toBe(40 - 2 * 5)
  })

  it('plafonne à 20, ou au maximum relevé par une capacité', async () => {
    expect(await hpBaseOf(9)).toBe(100 - 5 * 10)
    expect(await hpBaseOf(10)).toBe(300 - 7 * 20)
  })

  it('arrondit le modificateur négatif au plancher (CON 8 et 9 : −1)', async () => {
    expect(await hpBaseOf(11)).toBe(30 + 1 * 4)
    expect(await hpBaseOf(14)).toBe(20 + 1 * 2)
  })

  it('laisse une fiche sans classe intacte et ne descend jamais sous 1', async () => {
    expect(await hpBaseOf(12)).toBe(7)
    expect(await hpBaseOf(13)).toBe(1)
  })
})

describe('migration 0117 — équivalence avec shared/rules', () => {
  it('chaque fiche garde le maximum qu\'elle avait avant (sauf celles que le plancher a bornées)', async () => {
    const orm = drizzle(client, { schema, casing: 'snake_case' })
    for (const [id, before] of oldMax) {
      if (id === 13) continue // fabriquée avec un maximum stocké sous sa propre CON : la migration la borne à 1
      const sheet = await loadSheetRelations(orm as never, id)
      expect(sheetHitPointsOf(sheet).maxHp, `fiche ${id}`).toBe(before)
    }
  })
})
