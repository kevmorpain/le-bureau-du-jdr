import type { Effect } from '~~/server/db/schema/effects'
import type { SkillKey } from '~~/shared/rules/skills'
import { ABILITY_KEYS } from '~~/shared/rules/abilities'
import { CLASS_PROFICIENCIES } from '~~/shared/rules/classProficiencies'
import { useCharacterAbilities, type AbilitiesSheet } from './character/useCharacterAbilities'
import { resolveFeatEffects } from './useCharacterSheet'

type BuilderInvocation = { id: number, name: string, effects: Effect[] }

/**
 * Ce que la fiche créée affichera, calculé par SON calculateur (`useCharacterAbilities`) : l'état du
 * builder est projeté dans les canaux que le GET de la fiche lui fournit (lignes `character_skills`
 * matérialisées, effets d'espèce, de classe, d'historique, de dons et de manifestations).
 */
export function useBuilderSheetProjection() {
  const {
    state,
    speciesEffects,
    classData,
    isCustomBackground,
    backgroundSkills,
    materializedSkills,
    chosenFeatIds,
    getFeatById,
    finalAbilities,
    profBonus,
    hpMax,
    SKILLS,
  } = useCharacterBuilder()

  const { extendedQuery } = useExtendedContent()
  const { data: invocations } = useFetch<BuilderInvocation[]>('/api/invocations', {
    query: extendedQuery,
    default: () => [],
  })
  const selectedInvocations = computed<BuilderInvocation[]>(() => {
    const byId = new Map((invocations.value ?? []).map(i => [i.id, i]))
    return state.value.invocationIds
      .map(id => byId.get(id))
      .filter((i): i is BuilderInvocation => i != null)
  })

  // Les scores projetés sont déjà finaux (`finalAbilities` inclut espèce, ASI et dons) : aucun
  // `ability_increase` ne doit être rejoué par le calculateur.
  const sheet = computed<AbilitiesSheet>(() => ({
    baseAbilityScores: ABILITY_KEYS
      .filter(ab => finalAbilities.value[ab] != null)
      .map(ab => ({ abilityId: ab, value: finalAbilities.value[ab]! })),
    skills: [
      ...materializedSkills.value.map(skillKey => ({ skillKey, proficiencyLevel: 'proficient' })),
      ...state.value.expertiseSkills.map(skillKey => ({ skillKey, proficiencyLevel: 'expert' })),
    ],
    classes: [{ level: state.value.level }],
  }))
  const withoutAbilityIncreases = (effects: Effect[]) => effects.filter(e => e.type !== 'ability_increase')
  const skillEffects = (skills: string[]): Effect[] =>
    skills.map(skill => ({ type: 'skill_proficiency', value: { skill: skill as SkillKey } }))

  const abilities = useCharacterAbilities(sheet, {
    speciesEffects: computed(() => withoutAbilityIncreases(speciesEffects.value)),
    featureEffects: computed(() => withoutAbilityIncreases([
      ...chosenFeatIds.value.flatMap(id => resolveFeatEffects(getFeatById(id)?.effects ?? [], state.value.featChoices[id] ?? null)),
      ...selectedInvocations.value.flatMap(i => i.effects),
    ])),
    backgroundEffects: computed(() => isCustomBackground.value ? [] : skillEffects(backgroundSkills.value)),
    classSavingThrowEffects: computed(() => (CLASS_PROFICIENCIES[classData.value?.dbName ?? '']?.savingThrows ?? [])
      .map((ability): Effect => ({ type: 'saving_throw_proficiency', value: { ability } }))),
    classSkillEffects: computed(() => skillEffects(state.value.skills)),
    asiEffects: computed(() => []),
    proficiencyBonus: profBonus,
  })

  const masteredSkills = computed(() => SKILLS
    .map(sk => ({
      ...sk,
      proficiency: abilities.getEffectiveProficiency(sk.key),
      modifier: abilities.getSkillModifier(sk.ability, sk.key),
    }))
    .filter(sk => sk.proficiency !== 'none'))

  // Bonus rétroactif des dons (Robuste) : ajouté par la fiche au `maxHp` stocké, jamais persisté.
  const maxHp = computed(() => hpMax.value != null ? hpMax.value + abilities.hpBonusFromFeats.value : null)

  return {
    masteredSkills,
    savingThrows: abilities.savingThrows,
    passivePerception: abilities.passivePerception,
    initiative: abilities.initiativeBonus,
    maxHp,
    selectedInvocations,
  }
}
