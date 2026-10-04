import { useStorage } from '@vueuse/core'
import type { Effect, DamageTypeKey, ConditionKey } from '~~/server/db/schema/effects'
import { damageTypeLabels, conditionLabels, immunityLabels, allConditions } from '~~/shared/utils/labels'
import { dragonbornAncestryDamageType } from '~~/shared/utils/draconic_ancestry'
import type { DragonbornAncestry } from '~~/shared/utils/draconic_ancestry'
import { conditionMechanics, exhaustionImpactLines } from '~~/shared/utils/condition-effects'
import { maxHitPoints } from '~~/shared/rules/hitPoints'

// ─── Module-level constants ──────────────────────────────────────────────────

export const binaryConditions = allConditions.filter(c => c !== 'exhaustion')

// ─── Types ────────────────────────────────────────────────────────────────────

type DefenseLevel = 'immunity' | 'resistance' | 'vulnerability'
type DefenseEntry = { key: string, label: string, level: DefenseLevel, temporary?: boolean }
type SaveStatus = { disadvantage: boolean, autoFail: boolean, reasons: string[] }

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
    hpPerLevelBonus?: ComputedRef<number>
  },
) => {
  const storageKey = (suffix: string) => characterStorageKey(characterSheet?.value?.id, suffix)

  // ─── Active conditions & exhaustion ───────────────────────────────────────

  const storedActiveConditions = useStorage<ConditionKey[]>(storageKey('activeConditions'), [])

  // Concentration is persisted via DB : un sort du catalogue (concentratingSpellId) ou un libellé libre
  // (concentratingOn : effet de monstre, sort non seedé, homebrew), jamais les deux. The 'concentrating'
  // condition is derived; we never store it in localStorage.
  const concentratingSpellId = computed<number | null>({
    get: () => characterSheet?.value?.concentratingSpellId ?? null,
    set: (v) => {
      if (characterSheet?.value) characterSheet.value.concentratingSpellId = v
    },
  })
  const concentratingOn = computed<string | null>({
    get: () => characterSheet?.value?.concentratingOn ?? null,
    set: (v) => {
      if (characterSheet?.value) characterSheet.value.concentratingOn = v
    },
  })

  const isConcentrating = computed(() => concentratingSpellId.value !== null || concentratingOn.value !== null)

  const setConcentration = (spellId: number | null) => {
    concentratingSpellId.value = spellId
    concentratingOn.value = null
  }

  const setFreeConcentration = (label: string) => {
    concentratingSpellId.value = null
    concentratingOn.value = label.trim() || null
  }

  if (import.meta.client) {
    onMounted(() => {
      const idx = storedActiveConditions.value.indexOf('concentrating' as ConditionKey)
      if (idx !== -1) storedActiveConditions.value.splice(idx, 1)
    })
  }

  // 'concentrating' a sa propre UI (ConcentrationSection) et reste hors des états stockés.
  const activeConditions = storedActiveConditions

  const toggleCondition = (condition: ConditionKey) => {
    const idx = storedActiveConditions.value.indexOf(condition)
    if (idx !== -1) {
      storedActiveConditions.value.splice(idx, 1)
      return
    }
    storedActiveConditions.value.push(condition)
    // AideDD, Concentration : « Vous perdez automatiquement la concentration de votre sort si vous êtes incapable d'agir ».
    if (isConcentrating.value && conditionMechanics[condition]?.incapacitating) {
      setConcentration(null)
      useToast().add({ title: 'Concentration perdue', description: `${conditionLabels[condition]} : vous ne pouvez plus agir.`, color: 'error' })
    }
  }

  const exhaustionLevel = computed({
    get: () => characterSheet?.value?.exhaustionLevel ?? 0,
    set: (v: number) => { if (characterSheet?.value) characterSheet.value.exhaustionLevel = v },
  })

  const exhaustionTooltip = computed(() =>
    exhaustionImpactLines.slice(0, exhaustionLevel.value).join('\n'),
  )

  // ─── Draconic ancestry ────────────────────────────────────────────────────

  const dragonbornAncestry = computed({
    get: () => (characterSheet?.value?.dragonbornAncestry as DragonbornAncestry | null) ?? null,
    set: (v: DragonbornAncestry | null) => { if (characterSheet?.value) characterSheet.value.dragonbornAncestry = v },
  })

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
      } else if (effect.type === 'immunity') {
        add(`imm:${effect.value}`, immunityLabels[effect.value], 'immunity')
      } else if (effect.type === 'advantage' && effect.value.condition) {
        const cond = effect.value.condition
        const isSave = effect.value.rollType === 'saving_throw'
        const label = `${cond in conditionLabels ? conditionLabels[cond as ConditionKey] : cond} (${isSave ? 'JdS' : 'JdC'})`
        // Distinct key so it coexists with damage resistance on the same condition
        add(`${isSave ? 'jds' : 'jdc'}:${cond}`, label, 'resistance')
      }
    }

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

  const maxHitPointsFor = (exhaustionLevel: number) => maxHitPoints({
    hpBase: characterSheet?.value?.hpBase ?? 0,
    totalLevel: (characterSheet?.value?.classes ?? []).reduce((sum, c) => sum + c.level, 0),
    conMod: deps?.abilityModifiers.value.con ?? 0,
    perLevelBonus: deps?.hpPerLevelBonus?.value ?? 0,
    exhaustionLevel,
  })

  // Maximum affiché sur la fiche, avant l'épuisement ; le maximum effectif en tient compte (niveau 4 : moitié).
  const fullMaxHp = computed(() => maxHitPointsFor(0))
  const effectiveMaxHp = computed(() => maxHitPointsFor(exhaustionLevel.value))

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
    concentratingSpellId,
    concentratingOn,
    isConcentrating,
    setConcentration,
    setFreeConcentration,
    exhaustionLevel,
    exhaustionTooltip,
    hasDraconicAncestry,
    dragonbornAncestry,
    defenseEntries,
    effectiveSpeed,
    speedModifiers,
    fullMaxHp,
    effectiveMaxHp,
    maxHitPointsFor,
    skillDisadvantageReasons,
    saveStatuses,
  }
}
