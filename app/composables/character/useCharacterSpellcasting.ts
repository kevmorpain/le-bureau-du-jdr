import { evaluate } from '~~/shared/utils/formula'
import type { FormulaContext, Formula } from '~~/shared/utils/formula'
import type { FeatureMeta } from '~~/server/db/schema/features'

type SlotState = { max: number, current: number }
type SlotsByType = {
  spellcasting: Record<number, SlotState>
  pact_magic: Record<number, SlotState>
}

type ResolvedFeature = {
  classId: number | null
  maxUsesFormula: Formula | null
  maxUses: number | null
  meta: FeatureMeta | null
}

type SpellStats = {
  ability: string
  modifier: number
  dc: number
  attackBonus: number
}

type SpellcasterClass = {
  classId: number
  className: string
  ability: string  // 'str' | 'dex' | ... — la stat effective (subclass override > class default)
  fromSubclass: boolean
}

const emptyLevels = (): Record<number, SlotState> => ({
  1: { max: 0, current: 0 },
  2: { max: 0, current: 0 },
  3: { max: 0, current: 0 },
  4: { max: 0, current: 0 },
  5: { max: 0, current: 0 },
  6: { max: 0, current: 0 },
  7: { max: 0, current: 0 },
  8: { max: 0, current: 0 },
  9: { max: 0, current: 0 },
})

export const useCharacterSpellcasting = (
  characterSheet?: Ref<CharacterSheet>,
  deps?: {
    proficiencyBonus: ComputedRef<number>
    abilityModifiers: ComputedRef<Record<string, number>>
    resolvedFeatures?: ComputedRef<ResolvedFeature[]>
    formulaContext?: ComputedRef<FormulaContext>
    selectedCasterClassId?: Ref<number | null>
  },
) => {
  // ─── Liste des classes spellcasters du perso ─────────────────────────────

  const spellcasterClasses = computed<SpellcasterClass[]>(() => {
    const classes = characterSheet?.value?.classes ?? []
    return classes
      .map((cc) => {
        const cls = cc.class as { name?: string, spellcastingAbility?: string | null } | undefined
        const subclass = cc.subclass as { spellcastingAbility?: string | null } | undefined
        const ability = subclass?.spellcastingAbility ?? cls?.spellcastingAbility ?? null
        if (!ability) return null
        return {
          classId: cc.classId,
          className: cls?.name ?? '',
          ability,
          fromSubclass: !!subclass?.spellcastingAbility,
        } satisfies SpellcasterClass
      })
      .filter((c): c is SpellcasterClass => c !== null)
  })

  // ─── Classe lanceuse active (selected) ──────────────────────────────────

  const activeCasterClass = computed<SpellcasterClass | null>(() => {
    const list = spellcasterClasses.value
    if (list.length === 0) return null
    const selectedId = deps?.selectedCasterClassId?.value ?? null
    if (selectedId !== null) {
      const found = list.find(c => c.classId === selectedId)
      if (found) return found
    }
    // Fallback : main class spellcaster sinon premier de la liste
    const classes = characterSheet?.value?.classes ?? []
    const mainClass = classes.find(c => c.isMain)
    if (mainClass) {
      const mainSpellcaster = list.find(c => c.classId === mainClass.classId)
      if (mainSpellcaster) return mainSpellcaster
    }
    return list[0] ?? null
  })

  const spellcastingAbility = computed<string | null>(() => activeCasterClass.value?.ability ?? null)

  // ─── Pact Magic detection ──────────────────────────────────────────────────

  // Une feature avec à la fois maxUsesFormula (nb d'emplacements) et meta.slotLevelFormula
  // (niveau d'emplacement) est traitée comme la source de Magie du Pacte.
  const pactMagicFeature = computed<ResolvedFeature | null>(() =>
    deps?.resolvedFeatures?.value?.find(
      f => f.meta?.slotLevelFormula && f.maxUses !== null,
    ) ?? null,
  )

  const pactMagicAbility = computed<string | null>(() => {
    const feat = pactMagicFeature.value
    if (!feat) return null
    const charClass = characterSheet?.value?.classes?.find(cc => cc.classId === feat.classId)
    if (!charClass) return null
    const cls = charClass.class as { spellcastingAbility?: string | null } | undefined
    const subclass = charClass.subclass as { spellcastingAbility?: string | null } | undefined
    return subclass?.spellcastingAbility ?? cls?.spellcastingAbility ?? null
  })

  // ─── Stats helpers ─────────────────────────────────────────────────────────

  const computeStats = (ability: string | null): SpellStats | null => {
    if (!ability) return null
    const prof = deps?.proficiencyBonus.value ?? 2
    const mod = deps?.abilityModifiers.value[ability] ?? 0
    return {
      ability,
      modifier: mod,
      dc: 8 + prof + mod,
      attackBonus: prof + mod,
    }
  }

  const spellcastingStats = computed(() => computeStats(spellcastingAbility.value))
  const pactMagicStats = computed(() => computeStats(pactMagicAbility.value))

  // Compat backward (utilisés ailleurs dans l'app pour les stats spellcasting actives)
  const spellcastingModifier = computed<number | null>(() => spellcastingStats.value?.modifier ?? null)
  const spellSaveDC = computed<number | null>(() => spellcastingStats.value?.dc ?? null)
  const spellAttackModifier = computed<number | null>(() => spellcastingStats.value?.attackBonus ?? null)

  // ─── Spell slots ──────────────────────────────────────────────────────────

  const spellSlots = ref<SlotsByType>({
    spellcasting: emptyLevels(),
    pact_magic: emptyLevels(),
  })

  // Initialisation depuis DB + auto-gen Pact Magic
  watchEffect(() => {
    const dbSlots = characterSheet?.value?.spellSlots ?? []
    const next: SlotsByType = {
      spellcasting: emptyLevels(),
      pact_magic: emptyLevels(),
    }
    for (const slot of dbSlots) {
      const type = slot.slotType as 'spellcasting' | 'pact_magic'
      if (next[type] && slot.slotLevel >= 1 && slot.slotLevel <= 9) {
        next[type][slot.slotLevel] = {
          max: slot.total,
          current: slot.total - slot.used,
        }
      }
    }

    // Auto-génération Pact Magic
    const feat = pactMagicFeature.value
    if (feat && deps?.formulaContext) {
      const slotLevel = evaluate(feat.meta!.slotLevelFormula!, deps.formulaContext.value)
      const slotCount = feat.maxUses!
      if (slotLevel >= 1 && slotLevel <= 9 && slotCount > 0) {
        const existing = next.pact_magic[slotLevel]!
        next.pact_magic[slotLevel] = {
          max: slotCount,
          // Préserve `used` (et donc `current`) si même max ; sinon ramène à plein
          current: existing.max === slotCount ? existing.current : slotCount,
        }
      }
    }

    spellSlots.value = next
  })

  // Synchronisation vers DB (debounce 500ms)
  let syncTimeout: ReturnType<typeof setTimeout> | null = null
  watch(spellSlots, () => {
    if (!characterSheet?.value?.id) return
    if (syncTimeout) clearTimeout(syncTimeout)
    syncTimeout = setTimeout(async () => {
      const payload: Array<{ slotLevel: number, slotType: string, total: number, used: number }> = []
      for (const [level, slot] of Object.entries(spellSlots.value.spellcasting)) {
        if (slot.max > 0) {
          payload.push({
            slotLevel: Number(level),
            slotType: 'spellcasting',
            total: slot.max,
            used: slot.max - slot.current,
          })
        }
      }
      for (const [level, slot] of Object.entries(spellSlots.value.pact_magic)) {
        if (slot.max > 0) {
          payload.push({
            slotLevel: Number(level),
            slotType: 'pact_magic',
            total: slot.max,
            used: slot.max - slot.current,
          })
        }
      }
      await $fetch(`/api/character_sheets/${characterSheet!.value!.id}/spell-slots`, {
        method: 'PUT',
        body: payload,
      })
    }, 500)
  }, { deep: true })

  const availableSpellSlots = computed(() => {
    const set = new Set<number>()
    for (const [level, slot] of Object.entries(spellSlots.value.spellcasting)) {
      if (slot.max > 0 && slot.current < slot.max) set.add(Number(level))
    }
    for (const [level, slot] of Object.entries(spellSlots.value.pact_magic)) {
      if (slot.max > 0 && slot.current < slot.max) set.add(Number(level))
    }
    return [...set].sort((a, b) => a - b)
  })

  return {
    spellcastingAbility,
    spellcastingModifier,
    spellSaveDC,
    spellAttackModifier,
    spellcastingStats,
    pactMagicStats,
    pactMagicAbility,
    spellSlots,
    availableSpellSlots,
    spellcasterClasses,
    activeCasterClass,
  }
}
