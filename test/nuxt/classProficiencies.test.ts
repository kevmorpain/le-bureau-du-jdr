import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StepClass from '../../app/components/character_builder/StepClass.vue'
import { ABILITY_SHORT, CLASSES } from '../../app/data/character-builder'
import { CLASS_PROFICIENCIES, type ProficiencySet } from '../../shared/rules/classProficiencies'
import { CLASS_DB_NAMES } from '../../shared/rules/classSlugs'
import { ALL_TOOLS } from '../../shared/rules/tools'

// Contrat de la source unique des maîtrises de classe (seed des porteurs, JS du builder). Les jetons
// d'armure sont ceux que `useCharacterInventory.armorProficiencies` reconnaît.

const ARMOR_TOKENS = new Set(['light', 'medium', 'heavy', 'shield', 'all_armor'])
// Clés EN du mapping historique du builder : elles ne matchent aucun item FR.
const FORBIDDEN_WEAPON_KEYS = new Set(['longsword', 'rapier', 'shortsword', 'hand_crossbow', 'light_crossbow', 'longbow', 'shortbow'])

const entries = Object.entries(CLASS_PROFICIENCIES)
const setsOf = (name: string): Array<[string, ProficiencySet]> => [
  [`${name} (départ)`, CLASS_PROFICIENCIES[name]!],
  [`${name} (multiclassage)`, CLASS_PROFICIENCIES[name]!.multiclass],
]

describe('CLASS_PROFICIENCIES — contrat', () => {
  it('couvre exactement les 12 classes', () => {
    expect(Object.keys(CLASS_PROFICIENCIES).sort()).toEqual(Object.values(CLASS_DB_NAMES).sort())
  })

  it('les armures sont des jetons consommés par la fiche', () => {
    for (const [name] of entries) {
      for (const [label, set] of setsOf(name)) {
        for (const a of set.armor) expect(ARMOR_TOKENS.has(a), `armure « ${a} » pour ${label}`).toBe(true)
      }
    }
  })

  it('aucune clé d\'arme précise anglaise résiduelle', () => {
    for (const [name] of entries) {
      for (const [label, set] of setsOf(name)) {
        for (const w of set.weapon) expect(FORBIDDEN_WEAPON_KEYS.has(w), `arme « ${w} » pour ${label}`).toBe(false)
      }
    }
  })

  it('les outils sont des noms du catalogue', () => {
    for (const [name] of entries) {
      for (const [label, set] of setsOf(name)) {
        for (const t of set.tools) expect(ALL_TOOLS, `${label} : « ${t} »`).toContain(t)
      }
    }
  })

  it('chaque classe maîtrise deux jets de sauvegarde distincts', () => {
    for (const [name, prof] of entries) expect(new Set(prof.savingThrows).size, name).toBe(2)
  })

  // AideDD (multiclassage) : « vous ne recevez qu'une partie des maîtrises de départ de cette nouvelle classe ».
  it('le multiclassage n\'accorde qu\'une partie des maîtrises de départ', () => {
    for (const [name, prof] of entries) {
      const { armor, weapon, tools } = prof.multiclass
      for (const a of armor) {
        const coveredByAll = prof.armor.includes('all_armor') && a !== 'shield'
        expect(prof.armor.includes(a) || coveredByAll, `${name} : armure « ${a} »`).toBe(true)
      }
      for (const w of weapon) expect(prof.weapon, `${name} : arme « ${w} »`).toContain(w)
      for (const t of tools) expect(prof.tools, `${name} : outil « ${t} »`).toContain(t)
    }
  })

  it('le multiclassage n\'accorde jamais d\'armure lourde', () => {
    for (const [name, prof] of entries) {
      expect(prof.multiclass.armor.filter(a => a === 'heavy' || a === 'all_armor'), name).toEqual([])
    }
  })
})

describe('builder — étape Classe', () => {
  it('affiche sur chaque carte les jets de sauvegarde de la source unique', async () => {
    const wrapper = await mountSuspended(StepClass)
    for (const cls of CLASSES) {
      const card = wrapper.findAll('button').find(b => b.text().includes(cls.name))
      const expected = CLASS_PROFICIENCIES[cls.dbName]!.savingThrows.map(s => ABILITY_SHORT[s]).join('+')
      expect(card?.text(), cls.name).toContain(`JS : ${expected}`)
    }
  })
})
