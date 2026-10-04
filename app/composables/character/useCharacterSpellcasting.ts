import { evaluate } from '~~/shared/utils/formula'
import { featureFormulaContext } from '~~/shared/rules/classResources'
import type { FormulaContext, Formula } from '~~/shared/utils/formula'
import type { FeatureMeta } from '~~/server/db/schema/features'
import type { Effect } from '~~/server/db/schema/effects'
import { speciesSpellcastingAbility } from '~~/shared/rules/speciesSpellcasting'

// `max` inclut les emplacements `created` par les points de sorcellerie.
type SlotState = { max: number, current: number, created?: number }
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
    // Lazy : peut être créée après ce composable (Vue résout la dépendance à l'accès).
    allEffects?: ComputedRef<Effect[]>
    speciesEffects?: ComputedRef<Effect[]>
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

  const spellDcBonus = computed<number>(() =>
    (deps?.allEffects?.value ?? [])
      .filter(e => e.type === 'spell_save_dc_bonus')
      .reduce((sum, e) => sum + ((e.value as { amount: number }).amount ?? 0), 0),
  )
  const spellAtkBonus = computed<number>(() =>
    (deps?.allEffects?.value ?? [])
      .filter(e => e.type === 'spell_attack_bonus')
      .reduce((sum, e) => sum + ((e.value as { amount: number }).amount ?? 0), 0),
  )

  const computeStats = (ability: string | null): SpellStats | null => {
    if (!ability) return null
    const prof = deps?.proficiencyBonus.value ?? 2
    const mod = deps?.abilityModifiers.value[ability] ?? 0
    return {
      ability,
      modifier: mod,
      dc: 8 + prof + mod + spellDcBonus.value,
      attackBonus: prof + mod + spellAtkBonus.value,
    }
  }

  const spellcastingStats = computed(() => computeStats(spellcastingAbility.value))
  const pactMagicStats = computed(() => computeStats(pactMagicAbility.value))

  // Sort sans classe (espèce, don, ajout antérieur) : repli sur la classe active, comme avant `class_id`.
  const statsForCasterClass = (classId: number | null | undefined): SpellStats | null => {
    const caster = spellcasterClasses.value.find(c => c.classId === classId)
    return caster ? computeStats(caster.ability) : spellcastingStats.value
  }

  // Un sort d'espèce s'incante avec la caractéristique que l'espèce déclare, pas celle d'une classe.
  const speciesAbility = computed(() => speciesSpellcastingAbility(deps?.speciesEffects?.value ?? []))
  const statsForSpell = (spell: { classId?: number | null, source?: string | null }): SpellStats | null =>
    spell.source === 'species' && speciesAbility.value ? computeStats(speciesAbility.value) : statsForCasterClass(spell.classId)

  const spellcastingModifier = computed<number | null>(() => spellcastingStats.value?.modifier ?? null)
  const spellSaveDC = computed<number | null>(() => spellcastingStats.value?.dc ?? null)
  const spellAttackModifier = computed<number | null>(() => spellcastingStats.value?.attackBonus ?? null)

  // ─── Spell slots ──────────────────────────────────────────────────────────

  const spellSlots = ref<SlotsByType>({
    spellcasting: emptyLevels(),
    pact_magic: emptyLevels(),
  })

  const { offlineMutate } = useOfflineMutation(() => characterSheet?.value?.id ?? 0)

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
          max: slot.total + slot.created,
          current: slot.total + slot.created - slot.used,
          created: slot.created,
        }
      }
    }

    const feat = pactMagicFeature.value
    if (feat && deps?.formulaContext) {
      // Même niveau de classe que le nombre d'emplacements (`maxUses`) : celui de l'Occultiste, pas de la classe principale.
      const slotLevel = evaluate(
        feat.meta!.slotLevelFormula!,
        featureFormulaContext(deps.formulaContext.value, { featureType: 'class_feature', classId: feat.classId }, characterSheet?.value?.classes ?? []),
      )
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

    // Reload hors-ligne : si des modifs sont en attente, repartir du snapshot local
    // (le cache ne contient que l'état serveur d'avant les dépenses de slots).
    const id = characterSheet?.value?.id
    if (import.meta.client && id && hasPending(id)) {
      const snap = readSnapshot<SlotsByType>(id, 'slots')
      if (snap) {
        spellSlots.value = snap
        return
      }
    }

    spellSlots.value = next
  })

  let syncTimeout: ReturnType<typeof setTimeout> | null = null
  const normalizeSlots = (
    arr: Array<{ slotLevel: number, slotType: string, total: number, used: number, created?: number }>,
  ): string =>
    JSON.stringify([...arr].sort((a, b) => a.slotType.localeCompare(b.slotType) || a.slotLevel - b.slotLevel))

  watch(spellSlots, () => {
    const id = characterSheet?.value?.id
    if (!id) return
    // Snapshot immédiat pour survivre à un reload hors-ligne.
    if (import.meta.client) writeSnapshot(id, spellSlots.value, 'slots')
    if (syncTimeout) clearTimeout(syncTimeout)
    syncTimeout = setTimeout(() => {
      const payload: Array<{ slotLevel: number, slotType: string, total: number, used: number, created: number }> = []
      for (const [level, slot] of Object.entries(spellSlots.value.spellcasting)) {
        if (slot.max > 0) {
          const created = slot.created ?? 0
          payload.push({ slotLevel: Number(level), slotType: 'spellcasting', total: slot.max - created, used: slot.max - slot.current, created })
        }
      }
      for (const [level, slot] of Object.entries(spellSlots.value.pact_magic)) {
        if (slot.max > 0) {
          payload.push({ slotLevel: Number(level), slotType: 'pact_magic', total: slot.max, used: slot.max - slot.current, created: 0 })
        }
      }
      // Évite une écriture inutile (et une op en file hors-ligne) si rien n'a changé vs serveur.
      const serverPayload = (characterSheet?.value?.spellSlots ?? []).map(s => ({
        slotLevel: s.slotLevel, slotType: s.slotType, total: s.total, used: s.used, created: s.created,
      }))
      if (normalizeSlots(payload) === normalizeSlots(serverPayload)) return
      void offlineMutate({
        endpoint: `/api/character_sheets/${id}/spell-slots`,
        method: 'PUT',
        body: payload,
        dedupeKey: 'spell-slots',
        label: 'Slots de sorts',
      }).catch(() => {})
    }, 500)
  }, { deep: true })

  // Niveaux où il reste au moins un emplacement castable (current = restants,
  // décrémenté par castSpell). Cohérent avec isSpellAvailable (current > 0).
  const availableSpellSlots = computed(() => {
    const set = new Set<number>()
    for (const [level, slot] of Object.entries(spellSlots.value.spellcasting)) {
      if (slot.current > 0) set.add(Number(level))
    }
    for (const [level, slot] of Object.entries(spellSlots.value.pact_magic)) {
      if (slot.current > 0) set.add(Number(level))
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
    statsForCasterClass,
    statsForSpell,
    spellSlots,
    availableSpellSlots,
    spellcasterClasses,
    activeCasterClass,
  }
}
