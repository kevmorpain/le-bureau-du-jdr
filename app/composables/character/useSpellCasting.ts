import { classSlugFromName } from '~~/shared/rules/classSlugs'
import { canCastAsRitual } from '~~/shared/rules/ritualCasting'
import {
  baseSlotLevel,
  parseDiceNotation,
  resolveAttackCount,
  resolveDamageDie,
  resolveHealDie,
  upcastRows,
  type CastLevels,
} from '~~/shared/rules/spellScaling'
import type { CharacterSpellWithSpell, SlotType } from './useCharacterSpells'
import type { SlotsByType } from './useCharacterSpellcasting'

type CharacterSheetApi = ReturnType<typeof useCharacterSheet>

type SpellCastingDeps = Pick<CharacterSheetApi,
  'characterLevel' | 'statsForSpell' | 'spellDamageBonus' | 'abilityModifiers' | 'activateSpell'
  | 'setSelectedCaster' | 'spellcasterClasses' | 'characterSpells'
> & { spellSlots: Ref<SlotsByType> }

const ARCANUM_FEATURE_NAME_BY_LEVEL: Record<number, string> = {
  6: 'Arcanum mystique (niveau 6)',
  7: 'Arcanum mystique (niveau 7)',
  8: 'Arcanum mystique (niveau 8)',
  9: 'Arcanum mystique (niveau 9)',
}

export const isArcanumFeature = (name: string): boolean =>
  Object.values(ARCANUM_FEATURE_NAME_BY_LEVEL).includes(name)

const getArcanumLevel = (source: string | null | undefined): number | null => {
  if (!source?.startsWith('arcanum_')) return null
  const level = Number(source.split('_')[1])
  return Number.isFinite(level) ? level : null
}

export const useSpellCasting = (characterSheet: Ref<CharacterSheet>, deps: SpellCastingDeps) => {
  const { t } = useI18n()
  const toast = useToast()
  const { roll } = useDiceRoller()
  const { characterLevel, statsForSpell, spellDamageBonus, abilityModifiers, activateSpell, setSelectedCaster, spellcasterClasses, characterSpells, spellSlots } = deps

  const isAttackSpell = (cs: CharacterSpellWithSpell): boolean => cs.spell.attackType != null
  const isArcanumSpell = (cs: CharacterSpellWithSpell): boolean => getArcanumLevel(cs.source) !== null
  const isCastable = (cs: CharacterSpellWithSpell): boolean => cs.spell.level === 0 || cs.isPrepared || isArcanumSpell(cs)

  const canRitual = (cs: CharacterSpellWithSpell): boolean => {
    const className = spellcasterClasses.value.find(c => c.classId === cs.classId)?.className
    return canCastAsRitual(cs.spell, {
      classSlug: className ? classSlugFromName(className) : undefined,
      isPrepared: cs.isPrepared,
      source: cs.source,
    })
  }

  // Slot level of the LAST cast, per spell: an attack spell rolls its damage as a second gesture, which must
  // reuse the slot just spent rather than the base level. Session state, deliberately not persisted.
  const lastCastLevel = ref<Record<number, number>>({})

  const getCastLevel = (cs: CharacterSpellWithSpell): number =>
    lastCastLevel.value[cs.spellId] ?? baseSlotLevel(cs.spell)

  const rememberCastLevel = (spellId: number, slotLevel: number) => {
    lastCastLevel.value = { ...lastCastLevel.value, [spellId]: slotLevel }
  }

  // Offered for damage even when spent: the cast has just used the slot.
  const ownedSlotLevels = computed<number[]>(() => {
    const levels = new Set<number>()
    for (const byLevel of [spellSlots.value.spellcasting, spellSlots.value.pact_magic]) {
      for (const [level, slot] of Object.entries(byLevel)) {
        if (slot.max > 0) levels.add(Number(level))
      }
    }
    return [...levels].sort((a, b) => a - b)
  })

  // A cantrip scales with the character level: only these spells have a slot level worth choosing.
  const scalingSpellIds = computed<Set<number>>(() =>
    new Set((characterSpells.value ?? [])
      .filter(cs => upcastRows(cs.spell).length > 0)
      .map(cs => cs.spellId)),
  )

  // Agonizing Blast adds the Charisma modifier to each Eldritch Blast beam.
  const charismaModifier = computed<number>(() => abilityModifiers.value.cha ?? 0)

  const eldritchBlastMods = computed(() => {
    const sourceNames: string[] = []
    let agonizing = false, repelling = false, rangeExtended = false
    for (const cf of characterSheet.value?.features ?? []) {
      const feature = cf.feature
      if (!feature || feature.featureType !== 'eldritch_invocation') continue
      for (const fe of (feature.featureEffects ?? [])) {
        const effect = fe.effect
        if (!effect || effect.type !== 'eldritch_blast_modifier') continue
        const kind = (effect.value as { kind?: string } | null)?.kind
        if (kind === 'agonizing') agonizing = true
        else if (kind === 'repelling') repelling = true
        else if (kind === 'range_extended') rangeExtended = true
        else continue
        sourceNames.push(feature.name)
      }
    }
    return { agonizing, repelling, rangeExtended, sourceNames: [...new Set(sourceNames)] }
  })

  const spendSlot = (slotLevel: number, slotType: SlotType) => {
    const slot = spellSlots.value[slotType][slotLevel]
    if (slot && slot.current > 0) slot.current--
  }

  const rollSpellEffect = (cs: CharacterSpellWithSpell, castAtLevel: number) => {
    const spell = cs.spell
    const spellcastingModifier = statsForSpell(cs)?.modifier ?? null
    const levels: CastLevels = { characterLevel: characterLevel.value, slotLevel: castAtLevel }
    // Only attack spells double their dice on a critical hit; saving-throw spells don't.
    const attackDamage = isAttackSpell(cs) ? { damage: {} } : undefined

    const damages = spell.damages ?? []
    if (damages.length) {
      for (const damage of damages) {
        const die = resolveDamageDie(damage, levels)
        if (!die) continue
        const parsed = parseDiceNotation(die)
        if (!parsed || parsed.count === 0) continue

        // Multi-attack spells: the seeded dice are the TOTAL for all attacks; modifiers apply per attack.
        const multi = resolveAttackCount(spell.multiAttack, levels)
        if (multi) {
          const diePerAttack = Math.max(1, Math.floor(parsed.count / multi.count))
          let perAttackBonus = Math.floor(parsed.flat / multi.count) + spellDamageBonus.value
          if (damage.isSpellcastingModifierAdded && spellcastingModifier !== null) perAttackBonus += spellcastingModifier
          if (spell.name === 'Décharge occulte' && eldritchBlastMods.value.agonizing) perAttackBonus += charismaModifier.value
          for (let index = 1; index <= multi.count; index++) {
            roll(t('spell_casting.roll.attack_part', { spell: spell.name, label: multi.label, index }), perAttackBonus, parsed.sides, diePerAttack, attackDamage)
          }
          continue
        }

        let bonus = parsed.flat + spellDamageBonus.value
        if (damage.isSpellcastingModifierAdded && spellcastingModifier !== null) bonus += spellcastingModifier
        const label = damage.label
          ? t('spell_casting.roll.labelled_damage', { spell: spell.name, label: damage.label, type: damage.damage_type })
          : t('spell_casting.roll.damage', { spell: spell.name, type: damage.damage_type })
        roll(label, bonus, parsed.sides, parsed.count, attackDamage)
      }
      return
    }

    if (spell.heal) {
      const die = resolveHealDie(spell.heal, levels)
      const parsed = die ? parseDiceNotation(die) : null
      if (!parsed || parsed.count === 0) return
      let bonus = parsed.flat
      if (spell.heal.isSpellcastingModifierAdded && spellcastingModifier !== null) bonus += spellcastingModifier
      roll(t('spell_casting.roll.heal', { spell: spell.name }), bonus, parsed.sides, parsed.count)
    }
  }

  // To-hit roll: one d20 per attack (one per beam for multi-attack spells).
  const rollSpellAttack = (cs: CharacterSpellWithSpell) => {
    const attackBonus = statsForSpell(cs)?.attackBonus
    if (attackBonus == null) return
    const count = resolveAttackCount(cs.spell.multiAttack, { characterLevel: characterLevel.value, slotLevel: getCastLevel(cs) })?.count ?? 1
    for (let index = 1; index <= count; index++) {
      const label = count > 1
        ? t('spell_casting.roll.attack_numbered', { spell: cs.spell.name, index })
        : t('spell_casting.roll.attack', { spell: cs.spell.name })
      roll(label, attackBonus, 20, 1, { d20: { type: 'attack', weapon: false } })
    }
  }

  const resolveCast = (cs: CharacterSpellWithSpell, slotLevel: number) => {
    activateSpell(cs.spell)
    rememberCastLevel(cs.spellId, slotLevel)
    if (isAttackSpell(cs)) rollSpellAttack(cs)
    else rollSpellEffect(cs, slotLevel)
  }

  const castWithSlot = (cs: CharacterSpellWithSpell, slotLevel: number, slotType: SlotType, casterClassId: number | null) => {
    spendSlot(slotLevel, slotType)
    if (casterClassId !== null) setSelectedCaster(casterClassId)
    resolveCast(cs, slotLevel)
  }

  const castCantrip = (cs: CharacterSpellWithSpell) => {
    activateSpell(cs.spell)
    if (isAttackSpell(cs)) rollSpellAttack(cs)
    else rollSpellEffect(cs, cs.spell.level || 0)
  }

  const castAsRitual = (cs: CharacterSpellWithSpell) => {
    resolveCast(cs, baseSlotLevel(cs.spell))
    toast.add({ title: t('spell_casting.ritual.title', { spell: cs.spell.name }), description: t('spell_casting.ritual.description'), color: 'success' })
  }

  const findArcanumFeature = (level: number) =>
    (characterSheet.value?.features ?? []).find(f => f.feature?.name === ARCANUM_FEATURE_NAME_BY_LEVEL[level])

  const getArcanumRemaining = (cs: CharacterSpellWithSpell): number | null => {
    const level = getArcanumLevel(cs.source)
    const characterFeature = level ? findArcanumFeature(level) : undefined
    return characterFeature ? Math.max(0, 1 - (characterFeature.currentUses ?? 0)) : null
  }

  // Mystic Arcanum: cast without a slot, once per long rest, tracked on the matching feature.
  const castArcanum = async (cs: CharacterSpellWithSpell) => {
    const level = getArcanumLevel(cs.source)
    if (!level) return
    const featureName = ARCANUM_FEATURE_NAME_BY_LEVEL[level]
    const characterFeature = findArcanumFeature(level)
    if (!characterFeature) {
      toast.add({ title: t('spell_casting.arcanum.missing', { name: featureName }), color: 'error' })
      return
    }
    const currentUses = characterFeature.currentUses ?? 0
    if (currentUses >= 1) {
      toast.add({ title: t('spell_casting.arcanum.used'), color: 'warning' })
      return
    }
    try {
      await $fetch(`/api/character_sheets/${characterSheet.value.id}/features`, {
        method: 'PUT',
        body: [{ featureId: characterFeature.featureId, currentUses: currentUses + 1 }],
      })
      characterFeature.currentUses = currentUses + 1
    } catch {
      toast.add({ title: t('spell_casting.arcanum.error'), color: 'error' })
      return
    }
    resolveCast(cs, cs.spell.level || level)
  }

  return {
    isAttackSpell,
    isArcanumSpell,
    isCastable,
    canRitual,
    getArcanumRemaining,
    getCastLevel,
    rememberCastLevel,
    ownedSlotLevels,
    scalingSpellIds,
    charismaModifier,
    eldritchBlastMods,
    spendSlot,
    rollSpellEffect,
    rollSpellAttack,
    castWithSlot,
    castCantrip,
    castAsRitual,
    castArcanum,
  }
}
