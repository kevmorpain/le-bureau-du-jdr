import type { InjectionKey } from 'vue'
import type { ConditionKey, Effect } from '~~/server/db/schema/effects'
import type { EffectSource } from '~~/shared/rules/effectBonuses'
import {
  advantageEffectSources, availableSituations, criticalFrom, DEFAULT_CRITICAL_FROM, factRollSources, proficientCheckMinimum,
  rerollTrigger, saveAutoFailSources,
  type D20Kind, type D20Policy, type RollFacts, type RollOverride,
} from '~~/shared/rules/rolls'
import type { ProficiencyLevel } from './useCharacterAbilities'

export interface PendingRoll {
  override: RollOverride
  situations: string[]
  // Les dégâts de l'attaque en cours sont ceux d'un coup critique (attaque critique, ou cible qui le rend automatique).
  crit: boolean
}

export type RolledPolicy = D20Policy & { autoFail: string[] }

// Ce que le lanceur de dés demande à la fiche : la politique d'un jet de d20 et le surplus de dés d'un critique.
export interface RollEngine {
  characterId: number | undefined
  policy: (kind: D20Kind, situations: readonly string[]) => RolledPolicy
  situations: ComputedRef<string[]>
  criticalExtraDice: ComputedRef<number>
  pending: Ref<PendingRoll>
}

export const rollEngineKey: InjectionKey<RollEngine> = Symbol('roll-engine')

export const idlePending = (): PendingRoll => ({ override: 'auto', situations: [], crit: false })

export const useCharacterRolls = (deps: {
  characterId: number | undefined
  activeConditions: Ref<ConditionKey[]>
  exhaustionLevel: Ref<number>
  armorNonProficient: ComputedRef<boolean>
  stealthArmor: ComputedRef<boolean>
  effectSources: ComputedRef<EffectSource[]>
  allEffects: ComputedRef<Effect[]>
  getEffectiveProficiency: (skillKey: string) => ProficiencyLevel
  criticalExtraDice: ComputedRef<number>
}): RollEngine => {
  const facts = computed<RollFacts>(() => ({
    conditions: deps.activeConditions.value,
    exhaustion: deps.exhaustionLevel.value,
    armorNonProficient: deps.armorNonProficient.value,
    stealthArmor: deps.stealthArmor.value,
  }))

  const policy = (kind: D20Kind, situations: readonly string[]): RolledPolicy => {
    const effects = deps.allEffects.value
    const proficientSkill = kind.type === 'check' && !!kind.skill && deps.getEffectiveProficiency(kind.skill) !== 'none'
    return {
      sources: [
        ...factRollSources(kind, facts.value),
        ...advantageEffectSources(deps.effectSources.value, kind, situations),
      ],
      rerollOn: rerollTrigger(effects),
      minimum: proficientSkill ? proficientCheckMinimum(effects) : null,
      critFrom: kind.type === 'attack' && kind.weapon ? criticalFrom(effects) : DEFAULT_CRITICAL_FROM,
      autoFail: saveAutoFailSources(kind, deps.activeConditions.value),
    }
  }

  return {
    characterId: deps.characterId,
    policy,
    situations: computed(() => availableSituations(deps.effectSources.value)),
    criticalExtraDice: deps.criticalExtraDice,
    pending: ref(idlePending()),
  }
}
