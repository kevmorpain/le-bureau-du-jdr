import { useCharacterClasses } from './character/useCharacterClasses'
import { useCharacterAbilities } from './character/useCharacterAbilities'
import { useAbilityEffectInputs } from './useCharacterSheet'

// « Lentille » des pages /spells : jeu de stats éditables, volontairement DÉCOUPLÉ de
// useCharacterSheet, partagé via useState entre le drawer et les composants d'affichage.
// Deux usages : bac à sable manuel (hors-ligne / sans compte), ou snapshot d'une vraie fiche.

type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

const ABILITIES: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

type SlotState = { max: number, current: number }

export interface LensStats {
  // Clés indexées par `string` (et non `Ability`) pour autoriser l'accès direct
  // `abilityScores[key]` dans les templates (v-for / v-model), comme le faisait
  // le composant d'origine.
  abilityScores: Record<string, number>
  characterLevel: number
  proficiencyBonus: number
  spellcastingAbility: string | null
  // Emplacements par niveau de sort (1 → 9). Fusionne spellcasting + pacte.
  spellSlots: Record<number, SlotState>
}

const emptySlots = (): Record<number, SlotState> =>
  Object.fromEntries(
    Array.from({ length: 9 }, (_, i) => [i + 1, { max: 0, current: 0 }]),
  ) as Record<number, SlotState>

const defaultStats = (): LensStats => ({
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  characterLevel: 1,
  proficiencyBonus: 2,
  spellcastingAbility: null,
  spellSlots: emptySlots(),
})

// ─── Dérivation depuis une vraie fiche ──────────────────────────────────────────

// Classe principale lanceuse sinon la première : la lentille ne gère pas le multiclassage lanceur.
const deriveSpellcastingAbility = (sheet: CharacterSheet): Ability | null => {
  const casters = (sheet.classes ?? [])
    .map((cc) => {
      const cls = cc.class as { spellcastingAbility?: string | null } | undefined
      const subclass = (cc as { subclass?: { spellcastingAbility?: string | null } | null }).subclass
      const ability = subclass?.spellcastingAbility ?? cls?.spellcastingAbility ?? null
      return ability ? { ability: ability as Ability, isMain: (cc as { isMain?: boolean }).isMain } : null
    })
    .filter((c): c is { ability: Ability, isMain?: boolean } => c !== null)

  if (casters.length === 0) return null
  return (casters.find(c => c.isMain) ?? casters[0]!).ability
}

// Snapshot lu dans un effectScope DÉTACHÉ puis libéré : aucune fuite de watcher, aucun appel réseau.
const deriveStatsFromSheet = (sheet: CharacterSheet): LensStats => {
  const scope = effectScope(true)
  const snapshot = scope.run<LensStats>(() => {
    const sheetRef = shallowRef(sheet) as Ref<CharacterSheet>
    const classes = useCharacterClasses(sheetRef)

    const abilities = useCharacterAbilities(sheetRef, {
      ...useAbilityEffectInputs(sheetRef),
      proficiencyBonus: classes.proficiencyBonus,
    })

    // Emplacements : on lit directement les lignes persistées (spellcasting +
    // pact_magic fusionnés par niveau). « current » = restants (total - used).
    const slots = emptySlots()
    for (const s of sheet.spellSlots ?? []) {
      if (s.slotLevel >= 1 && s.slotLevel <= 9) {
        const slot = slots[s.slotLevel]!
        slot.max += s.total
        slot.current += s.total - s.used
      }
    }

    return {
      abilityScores: Object.fromEntries(
        ABILITIES.map(a => [a, abilities.abilityScores.value[a]?.total ?? 10]),
      ),
      characterLevel: classes.characterLevel.value || 1,
      proficiencyBonus: classes.proficiencyBonus.value,
      spellcastingAbility: deriveSpellcastingAbility(sheet),
      spellSlots: slots,
    }
  })!
  scope.stop()
  return snapshot
}

// ─── Composable ──────────────────────────────────────────────────────────────

export const useSpellLens = () => {
  const stats = useState<LensStats>('spell-lens-stats', defaultStats)
  // Fiche actuellement chargée dans la lentille (null = saisie manuelle).
  const selectedSheetId = useState<number | null>('spell-lens-sheet-id', () => null)

  // ─── Valeurs dérivées ──────────────────────────────────────────────────────

  const abilityModifiers = computed<Record<string, number>>(() =>
    Object.fromEntries(
      ABILITIES.map(a => [a, Math.floor(((stats.value.abilityScores[a] ?? 10) - 10) / 2)]),
    ),
  )

  const characterLevel = computed<number>(() => stats.value.characterLevel)

  const spellcastingModifier = computed<number | null>(() => {
    const ability = stats.value.spellcastingAbility
    if (!ability) return null
    return abilityModifiers.value[ability] ?? null
  })

  const spellSaveDC = computed<number | null>(() =>
    spellcastingModifier.value === null
      ? null
      : 8 + stats.value.proficiencyBonus + spellcastingModifier.value,
  )

  const spellAttackModifier = computed<number | null>(() =>
    spellcastingModifier.value === null
      ? null
      : stats.value.proficiencyBonus + spellcastingModifier.value,
  )

  // Niveaux où il reste au moins un emplacement castable (current = restants).
  // Aligné sur isSpellAvailable / castSpell (qui dépensent via current--).
  const availableSpellSlots = computed<number[]>(() => {
    const out: number[] = []
    for (let level = 1; level <= 9; level++) {
      const slot = stats.value.spellSlots[level]
      if (slot && slot.current > 0) out.push(level)
    }
    return out
  })

  // ─── Actions ───────────────────────────────────────────────────────────────

  // `$fetch` (et non `useFetch`) : appelable depuis un handler d'événement, hors setup.
  const loadSheet = async (id: number): Promise<void> => {
    const sheet = await $fetch<CharacterSheet>(`/api/character_sheets/${id}`)
    stats.value = deriveStatsFromSheet(sheet)
    selectedSheetId.value = id
  }

  const reset = (): void => {
    stats.value = defaultStats()
    selectedSheetId.value = null
  }

  return {
    stats,
    selectedSheetId,
    abilityModifiers,
    characterLevel,
    spellcastingModifier,
    spellSaveDC,
    spellAttackModifier,
    availableSpellSlots,
    loadSheet,
    reset,
  }
}
