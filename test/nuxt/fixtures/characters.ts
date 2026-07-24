import { computed, ref } from 'vue'
import type { Effect } from '../../../server/db/schema/effects'
import { useCharacterAbilities } from '../../../app/composables/character/useCharacterAbilities'

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures de personnages pour les contrats d'équivalence 2014 (cf. decisions.md D12).
//
// Chaque fixture décrit les *entrées* de la couche de dérivation (caracs de base,
// maîtrises, effets par source) telles qu'elles arriveraient du read-model GET
// (server/api/character_sheets/[id]/index.get.ts) après assemblage par
// useCharacterSheet. Les *sorties* attendues (valeurs D&D vérifiées à la main)
// vivent dans les tests, pas ici — pas de snapshot.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Slice des entrées consommées par `useCharacterAbilities`.
 * On ne modélise que ce que le composable lit réellement :
 *  - `characterSheet.baseAbilityScores` / `.skills` / `.classes`
 *  - les 4 `deps` (effets d'espèce/feature/ASI + bonus de maîtrise).
 */
export interface AbilitiesFixture {
  /** Nom affiché dans les titres de tests. */
  name: string
  /** Caractéristiques de base (avant effets), telles que stockées en base. */
  baseAbilityScores: { abilityId: string, value: number }[]
  /** Maîtrises de compétences ET jets de sauvegarde (`character_skills` : clé + niveau). */
  skills: { skillKey: string, proficiencyLevel: 'proficient' | 'expert' }[]
  /** Classes du perso — seul `level` compte ici (total de niveaux → bonus PV des dons). */
  classes: { level: number }[]
  /** Effets d'espèce (ability_increase, skill_proficiency…). */
  speciesEffects: Effect[]
  /** Effets des features débloquées (traits, sous-classe, dons, invocations…). */
  featureEffects: Effect[]
  /** Effets d'ASI (améliorations de caractéristiques) déjà résolus en ability_increase. */
  asiEffects: Effect[]
  /** Bonus de maîtrise — dérivé du niveau ; figé ici pour ancrer le contrat. */
  proficiencyBonus: number
}

/** Fixture neutre : toutes caracs à 10, aucune maîtrise, aucun effet, PB +2. */
export const blankFixture: AbilitiesFixture = {
  name: 'neutre',
  baseAbilityScores: [],
  skills: [],
  classes: [{ level: 1 }],
  speciesEffects: [],
  featureEffects: [],
  asiEffects: [],
  proficiencyBonus: 2,
}

/**
 * **Ambroise** — Nain des collines · Occultiste (Le Grand Ancien) niveau 10.
 *
 * Sources :
 *  - Caracs de base + JS de classe : `server/db/seeds/data/character_sheets.ts`.
 *  - Bonus d'espèce : `server/db/seeds/data/character_species.ts` (Nain des collines →
 *    Constitution +2, Sagesse +1 ; « Ténacité naine » n'émet AUCUN effet → 0 PV/niveau).
 *
 * Fidélité : la fiche seedée n'a **ni ASI ni don** enregistré, donc les scores finaux
 * = base + espèce (Charisme reste à 9 → modificateur −1 : cas de bord assumé et utile,
 * il exerce l'arrondi plancher sur un modificateur négatif). Les canaux `feature`/`asi`
 * et les compétences maîtrisées/expertes sont couverts par des cas ciblés dans le test.
 */
export const ambroise: AbilitiesFixture = {
  name: 'Ambroise — Nain des collines · Occultiste 10',
  baseAbilityScores: [
    { abilityId: 'str', value: 12 },
    { abilityId: 'dex', value: 14 },
    { abilityId: 'con', value: 13 },
    { abilityId: 'int', value: 13 },
    { abilityId: 'wis', value: 15 },
    { abilityId: 'cha', value: 9 },
  ],
  // Occultiste : jets de sauvegarde Sagesse + Charisme (PHB 2014).
  skills: [
    { skillKey: 'wis_save', proficiencyLevel: 'proficient' },
    { skillKey: 'cha_save', proficiencyLevel: 'proficient' },
  ],
  classes: [{ level: 10 }],
  // Nain des collines : +2 Constitution, +1 Sagesse.
  speciesEffects: [
    { type: 'ability_increase', value: { ability: 'con', amount: 2 } },
    { type: 'ability_increase', value: { ability: 'wis', amount: 1 } },
  ],
  featureEffects: [],
  asiEffects: [],
  proficiencyBonus: 4, // niveau 10 → bonus de maîtrise +4
}

/**
 * **Lixek** — Drakéide d'or · Guerrier (Champion) niveau 10. Fixture *martiale*.
 *
 * Espèce Drakéide : Force +2, Charisme +1 (l'ascendance « d'or » ne touche pas les caracs).
 * ASI Guerrier (niv 4/6/8 → 3 slots) : Force +2, Constitution +2, et le 3ᵉ slot pris par le
 * don **Alerte** (+5 à l'initiative). Compétences : classe (Survie, Intuition) + historique
 * Soldat/Gladiateur (Athlétisme, Intimidation, PHB 2014). JS de classe : Force + Constitution.
 *
 * ⚠️ « Athlète remarquable » (Champion niv 7 : +½ maîtrise aux tests FOR/DEX/CON non maîtrisés)
 * n'est PAS modélisé par le composable — les compétences non maîtrisées restent au modificateur nu.
 */
export const lixek: AbilitiesFixture = {
  name: 'Lixek — Drakéide d\'or · Guerrier (Champion) 10',
  baseAbilityScores: [
    { abilityId: 'str', value: 15 },
    { abilityId: 'dex', value: 13 },
    { abilityId: 'con', value: 14 },
    { abilityId: 'int', value: 8 },
    { abilityId: 'wis', value: 12 },
    { abilityId: 'cha', value: 10 },
  ],
  skills: [
    { skillKey: 'str_save', proficiencyLevel: 'proficient' },
    { skillKey: 'con_save', proficiencyLevel: 'proficient' },
    { skillKey: 'survival', proficiencyLevel: 'proficient' }, // Survie (classe)
    { skillKey: 'insight', proficiencyLevel: 'proficient' }, // Intuition (classe)
    { skillKey: 'athletics', proficiencyLevel: 'proficient' }, // Soldat (historique)
    { skillKey: 'intimidation', proficiencyLevel: 'proficient' }, // Soldat (historique)
  ],
  classes: [{ level: 10 }],
  speciesEffects: [
    { type: 'ability_increase', value: { ability: 'str', amount: 2 } },
    { type: 'ability_increase', value: { ability: 'cha', amount: 1 } },
  ],
  featureEffects: [
    { type: 'initiative_bonus', value: { amount: 5 } }, // don Alerte
  ],
  asiEffects: [
    { type: 'ability_increase', value: { ability: 'str', amount: 2 } },
    { type: 'ability_increase', value: { ability: 'con', amount: 2 } },
  ],
  proficiencyBonus: 4,
}

/**
 * **Uka** — Demi-orc · Barde (Collège du savoir) niveau 10. Fixture *caster* à expertise.
 *
 * Espèce Demi-orc : Force +2, Constitution +1, + maîtrise d'Intimidation (trait Menaçant, via
 * effet `skill_proficiency`). ASI Barde (niv 4/8 → 2 slots) : Charisme +2, le 2ᵉ slot pris par le
 * don **Doué** (maîtrise d'Escamotage, Perception, Tromperie). Compétences : 3 (classe) + 3
 * (Collège du savoir, niv 3) + 3 (Doué), Intimidation venant de l'espèce. **Expertise** (niv 3 + niv 10,
 * 4 au total) : Acrobaties, Représentation, Tromperie, Intimidation. JS de classe : Dextérité + Charisme.
 *
 * ⚠️ « Touche-à-tout » (Barde niv 2 : +½ maîtrise aux tests non maîtrisés, initiative comprise)
 * n'est PAS modélisé par le composable — l'initiative dérivée est le seul modificateur de Dextérité.
 */
export const uka: AbilitiesFixture = {
  name: 'Uka — Demi-orc · Barde (Collège du savoir) 10',
  baseAbilityScores: [
    { abilityId: 'str', value: 10 },
    { abilityId: 'dex', value: 14 },
    { abilityId: 'con', value: 13 },
    { abilityId: 'int', value: 8 },
    { abilityId: 'wis', value: 12 },
    { abilityId: 'cha', value: 15 },
  ],
  skills: [
    { skillKey: 'dex_save', proficiencyLevel: 'proficient' },
    { skillKey: 'cha_save', proficiencyLevel: 'proficient' },
    // Expertise (niveau expert) : classe/espèce + upgrade niv 3 & 10.
    { skillKey: 'acrobatics', proficiencyLevel: 'expert' }, // classe + expertise
    { skillKey: 'performance', proficiencyLevel: 'expert' }, // classe + expertise
    { skillKey: 'deception', proficiencyLevel: 'expert' }, // Doué + expertise
    { skillKey: 'intimidation', proficiencyLevel: 'expert' }, // espèce (Menaçant) + expertise
    // Maîtrises simples.
    { skillKey: 'arcana', proficiencyLevel: 'proficient' }, // classe
    { skillKey: 'insight', proficiencyLevel: 'proficient' }, // classe
    { skillKey: 'nature', proficiencyLevel: 'proficient' }, // classe
    { skillKey: 'medicine', proficiencyLevel: 'proficient' }, // classe
    { skillKey: 'sleight_of_hand', proficiencyLevel: 'proficient' }, // Doué
    { skillKey: 'perception', proficiencyLevel: 'proficient' }, // Doué
  ],
  classes: [{ level: 10 }],
  speciesEffects: [
    { type: 'ability_increase', value: { ability: 'str', amount: 2 } },
    { type: 'ability_increase', value: { ability: 'con', amount: 1 } },
    { type: 'skill_proficiency', value: { skill: 'intimidation' } }, // trait Menaçant
  ],
  featureEffects: [],
  asiEffects: [
    { type: 'ability_increase', value: { ability: 'cha', amount: 2 } },
  ],
  proficiencyBonus: 4,
}

// ─────────────────────────────────────────────────────────────────────────────
// Montage
// ─────────────────────────────────────────────────────────────────────────────

type SheetRef = Parameters<typeof useCharacterAbilities>[0]

/**
 * Instancie `useCharacterAbilities` à partir d'une fixture, en câblant les `deps`
 * dans des `computed` (comme le fait useCharacterSheet). Retourne l'API du composable.
 */
export function mountAbilities(f: AbilitiesFixture) {
  const sheet = ref({
    baseAbilityScores: f.baseAbilityScores,
    skills: f.skills,
    classes: f.classes,
  }) as unknown as SheetRef

  return useCharacterAbilities(sheet, {
    speciesEffects: computed(() => f.speciesEffects),
    featureEffects: computed(() => f.featureEffects),
    asiEffects: computed(() => f.asiEffects),
    proficiencyBonus: computed(() => f.proficiencyBonus),
  })
}
