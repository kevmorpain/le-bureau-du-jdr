import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import StepClass from '../../app/components/character_builder/StepClass.vue'
import { ABILITY_SHORT, CLASSES } from '../../app/data/character-builder'
import { CLASS_PROFICIENCIES, type ProficiencySet } from '../../shared/rules/classProficiencies'
import { CLASS_DB_NAMES } from '../../shared/rules/classSlugs'
import { ALL_TOOLS } from '../../shared/rules/tools'
import { armorProficiencyLabels, weaponProficiencyLabels } from '../../shared/utils/item'
import { catalogClasses } from '../fixtures/catalogClasses'

// Contrat de la source des porteurs de maîtrises de classe (seed), que le front lit via le catalogue. Les
// jetons d'armure sont ceux que `useCharacterInventory.armorProficiencies` reconnaît.

registerEndpoint('/api/catalog/classes', catalogClasses)

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

  it('chaque jeton d\'armure ou de catégorie d\'arme a un libellé d\'affichage', () => {
    for (const [name] of entries) {
      for (const [label, set] of setsOf(name)) {
        for (const a of set.armor) expect(armorProficiencyLabels[a], `armure « ${a} » pour ${label}`).toBeDefined()
        // Une arme précise porte déjà son nom français ; seuls les jetons snake_case demandent un libellé.
        for (const w of set.weapon.filter(w => /^[a-z_]+$/.test(w))) {
          expect(weaponProficiencyLabels[w], `arme « ${w} » pour ${label}`).toBeDefined()
        }
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

  // Multiclassage : « vous ne recevez qu'une partie des maîtrises de départ de cette nouvelle classe ».
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
  it('affiche sur chaque carte les jets de sauvegarde servis par le catalogue', async () => {
    const wrapper = await mountSuspended(StepClass)
    const cardText = (name: string) => wrapper.findAll('button').find(b => b.text().includes(name))?.text()
    await vi.waitFor(() => expect(cardText('Barbare')).toContain('JS : FOR+CON'))
    for (const cls of CLASSES) {
      const expected = CLASS_PROFICIENCIES[cls.dbName]!.savingThrows.map(s => ABILITY_SHORT[s]).join('+')
      expect(cardText(cls.name), cls.name).toContain(`JS : ${expected}`)
    }
  })
})
