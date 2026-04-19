import { useStorage } from '@vueuse/core'
import type { Effect, DamageTypeKey, ConditionKey } from '~~/server/db/schema/effects'
import { damageTypeLabels, conditionLabels, allConditions } from '~~/shared/utils/labels'
import { dragonbornAncestryDamageType } from '~~/shared/utils/draconic_ancestry'
import type { DragonbornAncestry } from '~~/shared/utils/draconic_ancestry'
import { conditionMechanics, exhaustionImpactLines } from '~~/shared/utils/condition-effects'

// ─── Module-level constants ──────────────────────────────────────────────────

export const binaryConditions = allConditions.filter(c => c !== 'exhaustion')

// ─── Types ────────────────────────────────────────────────────────────────────

type DefenseLevel = 'immunity' | 'resistance' | 'vulnerability'
export type DefenseEntry = { key: string, label: string, level: DefenseLevel, temporary?: boolean }
export type SaveStatus = { disadvantage: boolean, autoFail: boolean, reasons: string[] }

const defenseLevelPriority: Record<DefenseLevel, number> = {
  vulnerability: 0,
  resistance: 1,
  immunity: 2,
}

// ─── Composable ──────────────────────────────────────────────────────────────

export const useCharacterConditions = (
  characterSheet?: Ref<CharacterSheet>,
  deps?: {
    allEffects: ComputedRef<Effect[]>
    speed: ComputedRef<number>
    abilityModifiers: ComputedRef<Record<string, number>>
  },
) => {
  const storageKey = (suffix: string) => {
    const id = characterSheet?.value?.id
    return id ? `char:${id}:${suffix}` : suffix
  }

  // ─── Active conditions & exhaustion ───────────────────────────────────────

  const activeConditions = useStorage<ConditionKey[]>(storageKey('activeConditions'), [])

  const toggleCondition = (condition: ConditionKey) => {
    const idx = activeConditions.value.indexOf(condition)
    if (idx === -1) activeConditions.value.push(condition)
    else activeConditions.value.splice(idx, 1)
  }

  const exhaustionLevel = useStorage<number>(storageKey('exhaustionLevel'), 0)

  const exhaustionTooltip = computed(() =>
    exhaustionImpactLines.slice(0, exhaustionLevel.value).join('\n'),
  )

  // ─── Draconic ancestry ────────────────────────────────────────────────────

  const dragonbornAncestry = useStorage<DragonbornAncestry | null>(storageKey('dragonbornAncestry'), null)

  const hasDraconicAncestry = computed(() =>
    (deps?.allEffects.value ?? []).some(e => e.type === 'choice' && e.value === 'draconic_ancestry'),
  )

  const resolveDamageType = (key: DamageTypeKey): DamageTypeKey => {
    if (key !== 'draconic_ancestry') return key
    return dragonbornAncestry.value
      ? dragonbornAncestryDamageType[dragonbornAncestry.value]
      : 'draconic_ancestry'
  }

  // ─── Defense entries ──────────────────────────────────────────────────────

  const defenseEntries = computed((): DefenseEntry[] => {
    const map = new Map<string, DefenseEntry>()

    const add = (key: string, label: string, level: DefenseLevel) => {
      const existing = map.get(key)
      if (!existing || defenseLevelPriority[level] > defenseLevelPriority[existing.level]) {
        map.set(key, { key, label, level })
      }
    }

    for (const effect of (deps?.allEffects.value ?? [])) {
      if (effect.type === 'damage_immunity') {
        const dt = resolveDamageType(effect.value.damageType)
        add(`dmg:${dt}`, damageTypeLabels[dt], 'immunity')
      } else if (effect.type === 'damage_resistance') {
        const dt = resolveDamageType(effect.value.damageType)
        add(`dmg:${dt}`, damageTypeLabels[dt], 'resistance')
      } else if (effect.type === 'vulnerability') {
        const dt = resolveDamageType(effect.value.damageType)
        add(`dmg:${dt}`, damageTypeLabels[dt], 'vulnerability')
      } else if (effect.type === 'condition_immunity') {
        const cond = effect.value.condition
        add(`cond:${cond}`, conditionLabels[cond], 'immunity')
      } else if (effect.type === 'advantage' && effect.value.rollType === 'saving_throw') {
        const cond = effect.value.condition
        const label = `${cond in conditionLabels ? conditionLabels[cond as ConditionKey] : cond} (JdS)`
        // Distinct key so it coexists with damage resistance on the same condition
        add(`jds:${cond}`, label, 'resistance')
      }
    }

    // Résistances temporaires issues des états actifs
    for (const c of activeConditions.value) {
      const m = conditionMechanics[c]
      if (m?.resistAllDamage) {
        map.set('dmg:all', { key: 'dmg:all', label: 'Tous', level: 'resistance', temporary: true })
      }
      if (m?.immunePoison) {
        add('dmg:poison', damageTypeLabels['poison'], 'immunity')
        map.get('dmg:poison')!.temporary = true
      }
    }

    return Array.from(map.values())
  })

  // ─── Speed impacts ────────────────────────────────────────────────────────

  const conditionSpeedZero = computed(() =>
    exhaustionLevel.value >= 5
    || activeConditions.value.some(c => conditionMechanics[c]?.speedZero),
  )

  const effectiveSpeed = computed(() => {
    const speed = deps?.speed.value ?? 0
    if (conditionSpeedZero.value) return 0
    if (exhaustionLevel.value >= 2) return speed / 2
    return speed
  })

  const speedModifiers = computed<string[]>(() => {
    const reasons: string[] = []
    if (exhaustionLevel.value >= 5) reasons.push('Épuisement niv. 5 : vitesse = 0')
    else if (exhaustionLevel.value >= 2) reasons.push('Épuisement niv. 2 : vitesse ÷ 2')
    for (const c of activeConditions.value) {
      if (conditionMechanics[c]?.speedZero) reasons.push(`${conditionLabels[c]} : vitesse = 0`)
    }
    return reasons
  })

  // ─── HP impact ────────────────────────────────────────────────────────────

  const effectiveMaxHp = computed(() => {
    const maxHp = characterSheet?.value?.maxHp ?? 0
    return exhaustionLevel.value >= 4 ? Math.floor(maxHp / 2) : maxHp
  })

  // ─── Skill & save impacts ─────────────────────────────────────────────────

  const skillDisadvantageReasons = computed<string[]>(() => {
    const reasons: string[] = []
    if (exhaustionLevel.value >= 1) reasons.push('Épuisement niv. 1+')
    if (activeConditions.value.includes('poisoned')) reasons.push('Empoisonné')
    if (activeConditions.value.includes('frightened')) reasons.push('Effrayé (si source visible)')
    return reasons
  })

  const saveStatuses = computed<Record<string, SaveStatus>>(() => {
    const abilityKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
    const result: Record<string, SaveStatus> = {}

    for (const key of abilityKeys) {
      const reasons: string[] = []
      let disadvantage = false
      let autoFail = false

      if (exhaustionLevel.value >= 3) {
        disadvantage = true
        reasons.push('Épuisement niv. 3+')
      }

      for (const c of activeConditions.value) {
        const m = conditionMechanics[c]
        if (m?.saveAutoFail?.includes(key)) {
          autoFail = true
          reasons.push(`${conditionLabels[c]} : rate automatiquement`)
        } else if (m?.saveDisadvantage?.includes(key)) {
          disadvantage = true
          reasons.push(`${conditionLabels[c]} : désavantage`)
        }
      }

      result[key] = { disadvantage, autoFail, reasons }
    }

    return result
  })

  return {
    activeConditions,
    toggleCondition,
    exhaustionLevel,
    exhaustionTooltip,
    binaryConditions,
    hasDraconicAncestry,
    dragonbornAncestry,
    defenseEntries,
    effectiveSpeed,
    speedModifiers,
    effectiveMaxHp,
    skillDisadvantageReasons,
    saveStatuses,
  }
}
