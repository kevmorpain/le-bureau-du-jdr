import { describe, it, expect } from 'vitest'
import { CLASSES, ARMOR_PROF_KEYS, WEAPON_PROF_KEYS } from '../../app/data/character-builder'
import { CLASS_PROFICIENCIES } from '../../shared/rules/classProficiencies'

// Volet B, étape 1 — ÉQUIVALENCE des maîtrises de base de classe (blob front → source unique).
// Les maîtrises d'armes/armures de classe descendent du BLOB `app/data/character-builder.ts`
// (libellés FR, mappés à la volée par le builder) vers `shared/rules/classProficiencies.ts`
// (clés machine), d'où elles seront posées en effets sur une feature porteuse (seedClass).
//
// Ce test prouve, AVANT toute logique de seed/dérivation, que la nouvelle source produit
// EXACTEMENT le même ENSEMBLE de clés que le builder produit aujourd'hui pour chaque classe :
//   `new Set(blob.map(p => KEYS[p] ?? p))`  (cf. app/pages/characters/new.vue).
// C'est le filet anti-transcription : un perso créé sur la source dérivée aura les mêmes
// maîtrises que le stockage actuel. Env `nuxt` (le blob importe l'alias `~~`), patron de
// `classesIdentityFront.test.ts`. Ce test disparaîtra avec la copie front (volet B, étape 4).

/** Ensemble trié dédupliqué — comparaison indépendante de l'ordre. */
const asSet = (arr: string[]): string[] => [...new Set(arr)].sort()

/** Reproduit le mapping du builder : clé machine si connue, sinon libellé FR brut. */
const mapArmor = (labels: string[]): string[] => asSet(labels.map(p => ARMOR_PROF_KEYS[p] ?? p))
const mapWeapon = (labels: string[]): string[] => asSet(labels.map(p => WEAPON_PROF_KEYS[p] ?? p))

describe('maîtrises de base de classe — blob front ≡ source unique (équivalence, volet B)', () => {
  it('couvre exactement les 12 classes du blob (aucune manquante ni en trop)', () => {
    expect(Object.keys(CLASS_PROFICIENCIES).sort()).toEqual(CLASSES.map(c => c.dbName).sort())
  })

  for (const cls of CLASSES) {
    it(`${cls.dbName} : armes + armures dérivées == mapping du builder`, () => {
      const source = CLASS_PROFICIENCIES[cls.dbName]
      expect(source, `entrée manquante pour ${cls.dbName}`).toBeDefined()
      expect(asSet(source!.armor), `armures ${cls.dbName}`).toEqual(mapArmor(cls.armorProficiencies))
      expect(asSet(source!.weapon), `armes ${cls.dbName}`).toEqual(mapWeapon(cls.weaponProficiencies))
    })
  }

  it('les clés d\'armure sont des jetons consommés par la fiche (light/medium/heavy/shield/all_armor)', () => {
    // `useCharacterInventory.armorProficiencies` filtre les effets `proficiency` sur ces jetons.
    const valid = new Set(['light', 'medium', 'heavy', 'shield', 'all_armor'])
    for (const [name, prof] of Object.entries(CLASS_PROFICIENCIES)) {
      for (const a of prof.armor) expect(valid.has(a), `armure inattendue « ${a} » pour ${name}`).toBe(true)
    }
  })
})
