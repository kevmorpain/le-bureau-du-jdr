import type { DamageTypeKey } from '~~/server/db/schema/effects'
import {
  applyDamageSources, applyHealing, gainTemporaryHp, sourceDamage, type DefenseLevel, type HitPointState, type SourcesResult,
} from '~~/shared/rules/damage'
import { useConcentrationCheck } from './useConcentrationCheck'

export interface DamageLineInput {
  amount: number
  type: DamageTypeKey | null
}

export interface DamageSourceInput {
  lines: DamageLineInput[]
  // Uncanny Dodge: the reaction halves one attack's damage.
  dodged?: boolean
}

export const useHitPointActions = (characterSheet: Ref<CharacterSheet>) => {
  const { t } = useI18n()
  const toaster = useToast()
  const { effectiveMaxHp, defenseEntries, hitPointState, setHitPointState, isConcentrating, allEffects } = useCharacterSheet(characterSheet)
  const concentration = useConcentrationCheck(characterSheet)

  const canDodge = computed(() => allEffects.value.some(e => e.type === 'halve_damage_reaction'))

  const defenseFor = (type: DamageTypeKey | null): DefenseLevel | null => {
    if (!type) return null
    const entry = defenseEntries.value.find(e => e.key === `dmg:${type}`) ?? defenseEntries.value.find(e => e.key === 'dmg:all')
    return entry?.level ?? null
  }

  const damageOf = (source: DamageSourceInput) =>
    sourceDamage(source.lines.map(line => ({ amount: line.amount, defense: defenseFor(line.type) })), { halved: !!source.dodged })

  const previewDamage = (sources: DamageSourceInput[], { critical = false } = {}): SourcesResult =>
    applyDamageSources(hitPointState.value, sources.map(damageOf), { maxHp: effectiveMaxHp.value, critical })

  const previewHealing = (amount: number): HitPointState => applyHealing(hitPointState.value, amount, { maxHp: effectiveMaxHp.value })

  const previewTemporary = (amount: number): HitPointState => gainTemporaryHp(hitPointState.value, amount)

  const applyDamage = (sources: DamageSourceInput[], { critical = false } = {}): SourcesResult => {
    const result = previewDamage(sources, { critical })
    setHitPointState(result.state)

    if (result.instantDeath) {
      toaster.add({ title: t('hit_points.instant_death.title'), description: t('hit_points.instant_death.description'), color: 'error' })
    } else if (result.deathSaveFailuresAdded > 0) {
      toaster.add({ title: t('hit_points.death_save_failures', result.deathSaveFailuresAdded), color: 'error' })
    }

    // Unconscious or dead: concentration ends by itself; otherwise one Constitution save per source.
    if (isConcentrating.value && result.state.currentHp === 0) {
      concentration.breakConcentration(t('hit_points.concentration.dropped'))
    } else if (isConcentrating.value) {
      // Damage absorbed by temporary HP still calls for the save, and counts in its DC (D39).
      concentration.enqueue(result.sources.map((_, index) => damageOf(sources[index]!)))
    }
    return result
  }

  const heal = (amount: number) => setHitPointState(previewHealing(amount))

  const gainTemporary = (amount: number) => setHitPointState(previewTemporary(amount))

  return { canDodge, defenseFor, damageOf, previewDamage, previewHealing, previewTemporary, applyDamage, heal, gainTemporary, concentration }
}
