import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { itemsData } from '../../server/db/seeds/data/items'
import { itemPricing } from '../../server/db/seeds/data/itemPricing'

const sql = readFileSync(resolve(__dirname, '../../server/db/migrations/0155_item_weight_and_cost.sql'), 'utf8')

const names = new Set(itemsData.map(i => i.name))
const priced = itemsData.filter(i => i.weightG !== undefined || i.costCp !== undefined)

describe('poids et prix du catalogue', () => {
  it('chaque entrée du tableau désigne un objet du seed', () => {
    for (const name of Object.keys(itemPricing)) expect(names.has(name), name).toBe(true)
  })

  it('les deux « Outils de voleur » reçoivent les mêmes valeurs', () => {
    const thieves = itemsData.filter(i => i.name === 'Outils de voleur')
    expect(thieves).toHaveLength(2)
    expect(new Set(thieves.map(i => `${i.weightG}/${i.costCp}`)).size).toBe(1)
  })

  it('un poids ou un prix est un entier positif ou nul', () => {
    for (const i of priced) {
      for (const value of [i.weightG, i.costCp]) {
        if (value !== null && value !== undefined) expect(Number.isInteger(value) && value >= 0, `${i.name} ${value}`).toBe(true)
      }
    }
  })

  it('les munitions se chiffrent par lot : 20 flèches, carreaux et billes, 50 aiguilles', () => {
    const lot = (name: string) => itemsData.find(i => i.name === name)!.lotSize
    expect(lot('Flèche')).toBe(20)
    expect(lot('Carreau d\'arbalète')).toBe(20)
    expect(lot('Bille de fronde')).toBe(20)
    expect(lot('Aiguille de sarbacane')).toBe(50)
  })

  it('seuls restent sans prix ni poids les objets de l\'équipement de départ que la règle ne chiffre pas', () => {
    const unpriced = itemsData
      .filter(i => i.id >= 120 && i.id <= 194 && i.weightG === undefined && i.costCp === undefined)
      .map(i => i.name)
    expect(unpriced).toEqual([
      'Boîte pour l\'aumône', 'Bâtonnet d\'encens', 'Encensoir', 'Petit sac de sable', 'Petit couteau',
      'Vêtements, communs sombres avec capuche', 'Habits de cérémonie', 'Livre de prières',
      'Lettre de recommandation de la guilde', 'Lettre de noblesse', 'Lettre d\'un collègue mort', 'Porte-bonheur',
      'Insigne de grade', 'Trophée pris sur un ennemi', 'Carte de la ville', 'Souris domestiquée',
      'Souvenir de vos parents', 'Trophée d\'animal', 'Cadeau d\'un admirateur',
      'Bouteilles bouchonnées remplies d\'un liquide coloré (10)', 'Dés truqués', 'Cartes marquées', 'Fausse chevalière de duc',
    ])
  })
})

describe('migration 0155 ↔ seed', () => {
  const UPDATE = /^UPDATE items SET weight_g = (NULL|\d+), cost_cp = (NULL|\d+) WHERE id = (\d+);$/gm
  const rows = [...sql.matchAll(UPDATE)].map(m => ({
    id: Number(m[3]),
    weightG: m[1] === 'NULL' ? null : Number(m[1]),
    costCp: m[2] === 'NULL' ? null : Number(m[2]),
  }))

  it('ajoute les trois colonnes', () => {
    expect(sql).toContain('ALTER TABLE items ADD COLUMN weight_g integer;')
    expect(sql).toContain('ALTER TABLE items ADD COLUMN cost_cp integer;')
    expect(sql).toContain('ALTER TABLE items ADD COLUMN lot_size integer DEFAULT 1 NOT NULL;')
  })

  it('chiffre exactement les objets chiffrés du seed, aux mêmes valeurs', () => {
    expect(rows.map(r => r.id)).toEqual(priced.map(i => i.id).sort((a, b) => a - b))
    for (const row of rows) {
      const seed = priced.find(i => i.id === row.id)!
      expect(row, seed.name).toEqual({ id: seed.id, weightG: seed.weightG ?? null, costCp: seed.costCp ?? null })
    }
  })

  it('pose la taille des lots', () => {
    for (const [size, ids] of [[20, ['Flèche', 'Carreau d\'arbalète', 'Bille de fronde']], [50, ['Aiguille de sarbacane']]] as const) {
      const wanted = ids.map(name => itemsData.find(i => i.name === name)!.id).sort((a, b) => a - b)
      const match = sql.match(new RegExp(`UPDATE items SET lot_size = ${size} WHERE id IN \\(([^)]*)\\);`))
      expect(match, String(size)).not.toBeNull()
      expect(match![1]!.split(',').map(s => Number(s.trim()))).toEqual(wanted)
    }
  })
})
