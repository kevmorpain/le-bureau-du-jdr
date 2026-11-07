import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { itemsData } from '../../server/db/seeds/data/items'

const sql = readFileSync(resolve(__dirname, '../../server/db/migrations/0154_starting_equipment_items.sql'), 'utf8')

const unquote = (s: string) => s.replace(/''/g, '\'')

// Un tuple par ligne : (id, 'nom', 'type', 'json', description|NULL, 0)
const ROW = /^ {2}\((\d+), '((?:[^']|'')*)', '(\w+)', '((?:[^']|'')*)', (NULL|'(?:[^']|'')*'), 0\)[,;]$/gm

describe('migration 0154 ↔ seed des objets', () => {
  const rows = [...sql.matchAll(ROW)].map(m => ({
    id: Number(m[1]),
    name: unquote(m[2]!),
    itemType: m[3]!,
    properties: JSON.parse(unquote(m[4]!)),
    description: m[5] === 'NULL' ? undefined : unquote(m[5]!.slice(1, -1)),
  }))
  const seeded = itemsData.filter(i => i.id >= 120 && i.id <= 194)

  it('insère exactement les objets 120 à 194 du seed', () => {
    expect(rows.map(r => r.id)).toEqual(seeded.map(s => s.id).sort((a, b) => a - b))
  })

  it('les lignes sont identiques à celles que le seed insère', () => {
    for (const row of rows) {
      const seed = seeded.find(s => s.id === row.id)!
      expect(row, seed.name).toEqual({ id: seed.id, name: seed.name, itemType: seed.itemType, properties: seed.properties, description: seed.description })
    }
  })

  it('les JSON gardent l\'ordre de clés du seed (une base fraîche et une base migrée sont égales)', () => {
    for (const row of rows) {
      const seed = seeded.find(s => s.id === row.id)!
      const raw = sql.match(new RegExp(`^ {2}\\(${row.id}, .*$`, 'm'))![0]
      expect(raw).toContain(`'${JSON.stringify(seed.properties).replace(/'/g, '\'\'')}'`)
    }
  })

  it('pose le type de munition sur chaque arme à munitions déjà en base', () => {
    const weapons = itemsData.filter(i => (i.properties as { ammunition_type?: string }).ammunition_type && i.itemType === 'weapon')
    for (const w of weapons) {
      const type = (w.properties as { ammunition_type: string }).ammunition_type
      const update = sql.match(new RegExp(`json_set\\(properties, '\\$\\.ammunition_type', '${type}'\\)\\nWHERE id IN \\(([^)]*)\\)`))
      expect(update, w.name).not.toBeNull()
      expect(update![1]!.split(',').map(s => Number(s.trim())), w.name).toContain(w.id)
    }
  })
})
