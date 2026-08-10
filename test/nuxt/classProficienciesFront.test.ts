import { describe, it, expect } from 'vitest'
import { CLASSES, ARMOR_PROF_KEYS } from '../../app/data/character-builder'
import { CLASS_PROFICIENCIES } from '../../shared/rules/classProficiencies'

// Volet B, étape 1 — ÉQUIVALENCE des maîtrises de base de classe (blob front → source unique).
// Les maîtrises d'armes/armures de classe descendent du BLOB `app/data/character-builder.ts`
// (libellés FR) vers `shared/rules/classProficiencies.ts`, d'où elles seront posées en effets
// sur une feature porteuse (seedClass).
//
// Ce test tient la source à la CIBLE CORRIGÉE dérivée du blob (drift-protection : il lit le blob
// LIVE). La normalisation (volet B étape 1) fixe 3 défauts du mapping historique du builder :
//   - CATÉGORIES d'arme → token machine EN (`simple_weapons`/`martial_weapons`) ;
//   - ARMES PRÉCISES → nom FR de l'item (au lieu des clés EN longsword/rapier/… qui ne matchaient
//     aucun item et s'affichaient en anglais) → donc le libellé FR du blob, verbatim ;
//   - « Masse » (Druide) → « Masse d'armes » (le vrai nom de l'item).
// Les ARMURES étaient déjà correctes (token EN) → inchangées, vérifiées contre `ARMOR_PROF_KEYS`.
// Env `nuxt` (le blob importe l'alias `~~`), patron de `classesIdentityFront.test.ts`.
// Ce test disparaîtra avec la copie front (volet B, étape 4).

/** Ensemble trié dédupliqué — comparaison indépendante de l'ordre. */
const asSet = (arr: string[]): string[] => [...new Set(arr)].sort()

// Seules les CATÉGORIES d'arme deviennent des tokens machine ; toute arme précise reste en FR.
const WEAPON_CATEGORY_KEYS: Record<string, string> = {
  'Armes courantes': 'simple_weapons',
  'Armes de guerre': 'martial_weapons',
}
// Corrections de noms d'arme précise (libellé blob → nom exact de l'item).
const WEAPON_NAME_FIXES: Record<string, string> = {
  Masse: 'Masse d\'armes',
}

/** Cible corrigée d'un libellé d'arme du blob : catégorie→token, sinon nom FR (fixé au besoin). */
const normalizeWeapon = (label: string): string =>
  WEAPON_CATEGORY_KEYS[label] ?? WEAPON_NAME_FIXES[label] ?? label

/** Armures : mapping builder inchangé (elles étaient déjà en tokens EN corrects). */
const mapArmor = (labels: string[]): string[] => asSet(labels.map(p => ARMOR_PROF_KEYS[p] ?? p))

describe('maîtrises de base de classe — blob front ≡ source unique corrigée (volet B)', () => {
  it('couvre exactement les 12 classes du blob (aucune manquante ni en trop)', () => {
    expect(Object.keys(CLASS_PROFICIENCIES).sort()).toEqual(CLASSES.map(c => c.dbName).sort())
  })

  for (const cls of CLASSES) {
    it(`${cls.dbName} : armes + armures == cible corrigée du blob`, () => {
      const source = CLASS_PROFICIENCIES[cls.dbName]
      expect(source, `entrée manquante pour ${cls.dbName}`).toBeDefined()
      expect(asSet(source!.armor), `armures ${cls.dbName}`).toEqual(mapArmor(cls.armorProficiencies))
      expect(asSet(source!.weapon), `armes ${cls.dbName}`)
        .toEqual(asSet(cls.weaponProficiencies.map(normalizeWeapon)))
    })
  }

  it('les clés d\'armure sont des jetons consommés par la fiche (light/medium/heavy/shield/all_armor)', () => {
    // `useCharacterInventory.armorProficiencies` filtre les effets `proficiency` sur ces jetons.
    const valid = new Set(['light', 'medium', 'heavy', 'shield', 'all_armor'])
    for (const [name, prof] of Object.entries(CLASS_PROFICIENCIES)) {
      for (const a of prof.armor) expect(valid.has(a), `armure inattendue « ${a} » pour ${name}`).toBe(true)
    }
  })

  it('aucune clé d\'arme précise anglaise résiduelle (elles ne matchent aucun item FR)', () => {
    // Garde anti-régression : les clés EN du mapping historique du builder sont proscrites côté source.
    const forbidden = new Set(['longsword', 'rapier', 'shortsword', 'hand_crossbow', 'light_crossbow', 'longbow', 'shortbow'])
    for (const [name, prof] of Object.entries(CLASS_PROFICIENCIES)) {
      for (const w of prof.weapon) expect(forbidden.has(w), `arme précise anglaise « ${w} » pour ${name}`).toBe(false)
    }
  })
})
