import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'
import { RARITIES, rarityEnum, RARITY_LABELS_FR } from '../../shared/rules/itemRarity'

// Rareté d'objet magique : source de vérité unique (shared/rules/itemRarity.ts) dont la colonne
// `items.rarity` dérive. On vérifie l'ensemble, le Zod, les libellés FR, et que la migration 0094
// pose bien rarity/requires_attunement/attunement_note (items) + attuned (character_inventory)
// avec les bons défauts (NULL pour rarity → objet ordinaire ; false pour les booléens).

const MIGRATIONS_DIR = fileURLToPath(new URL('../../server/db/migrations/', import.meta.url))
const NUXTHUB_UTILS = new URL('../../node_modules/@nuxthub/core/dist/db/lib/utils.mjs', import.meta.url)
const MIGRATION = '0094_magic_item_modeling.sql'

describe('itemRarity — const canonique', () => {
  it('RARITIES = les 6 raretés 2014, dans l\'ordre', () => {
    expect([...RARITIES]).toEqual(['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'])
  })

  it('rarityEnum valide chaque valeur et rejette l\'inconnu', () => {
    for (const value of RARITIES) expect(rarityEnum.parse(value)).toBe(value)
    expect(rarityEnum.safeParse('mythic').success).toBe(false)
    expect(rarityEnum.safeParse('').success).toBe(false)
  })

  it('RARITY_LABELS_FR couvre chaque rareté', () => {
    for (const value of RARITIES) expect(RARITY_LABELS_FR[value]).toBeTruthy()
  })
})

describe('itemRarity — migration 0094', () => {
  it('pose rarity/requires_attunement/attunement_note + attuned avec les bons défauts', async () => {
    const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
    const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]

    const db = createClient({ url: ':memory:' })
    await db.execute('PRAGMA foreign_keys = ON')

    // État d'avant 0094 : les 2 tables sans les colonnes, avec une ligne existante à backfiller.
    await db.execute('CREATE TABLE items (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
    await db.execute('CREATE TABLE character_inventory (id integer PRIMARY KEY NOT NULL, character_sheet_id integer NOT NULL, item_id integer NOT NULL)')
    await db.execute('INSERT INTO items (id, name) VALUES (1, \'Épée\')')
    await db.execute('INSERT INTO character_inventory (id, character_sheet_id, item_id) VALUES (1, 1, 1)')

    const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
    for (const statement of splitSqlQueries(sql)) await db.execute(statement)

    // Backfill : objet ordinaire (rarity NULL, pas d'harmonisation), instance non harmonisée.
    const item = (await db.execute('SELECT rarity, requires_attunement, attunement_note FROM items WHERE id = 1')).rows[0]!
    expect(item.rarity).toBeNull()
    expect(item.requires_attunement).toBe(0)
    expect(item.attunement_note).toBeNull()
    const inv = (await db.execute('SELECT attuned FROM character_inventory WHERE id = 1')).rows[0]!
    expect(inv.attuned).toBe(0)

    // Les colonnes acceptent les valeurs d'un objet magique harmonisable.
    await db.execute('UPDATE items SET rarity = \'uncommon\', requires_attunement = 1, attunement_note = \'par un ensorceleur\' WHERE id = 1')
    await db.execute('UPDATE character_inventory SET attuned = 1 WHERE id = 1')
    const magic = (await db.execute('SELECT rarity, requires_attunement FROM items WHERE id = 1')).rows[0]!
    expect(magic.rarity).toBe('uncommon')
    expect(magic.requires_attunement).toBe(1)
    expect((await db.execute('SELECT attuned FROM character_inventory WHERE id = 1')).rows[0]!.attuned).toBe(1)
  })
})
