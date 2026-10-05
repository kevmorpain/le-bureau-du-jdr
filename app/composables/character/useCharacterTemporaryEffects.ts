import type { EffectSource } from '~~/shared/rules/effectBonuses'
import { activeTemporaryEffectSources } from '~~/shared/rules/characterEffects'
import { armSpell, elapseRound as elapseEntries, endConcentrationEntries, type CastSpell, type EndedEffect } from '~~/shared/rules/durations'
import type { TemporaryEffect } from '~~/shared/utils/temporary_effects'

export type TemporaryEffectDraft = Omit<TemporaryEffect, 'id'> & { id?: number }

export const useCharacterTemporaryEffects = (characterSheet?: Ref<CharacterSheet>) => {
  const temporaryEffects = computed<TemporaryEffect[]>(() => characterSheet?.value?.temporaryEffects ?? [])

  const temporaryEffectSources = computed<EffectSource[]>(() => activeTemporaryEffectSources(temporaryEffects.value))

  // Mutation en place de la fiche (pas de réassignation de `.value`), comme `sheetTextField` : les
  // sections qui reçoivent la fiche en prop en lecture seule restent persistées par le deep watch.
  const write = (next: TemporaryEffect[]) => {
    if (characterSheet?.value) characterSheet.value.temporaryEffects = next
  }

  const saveTemporaryEffect = (draft: TemporaryEffectDraft) => {
    const list = temporaryEffects.value
    if (draft.id !== undefined && list.some(t => t.id === draft.id)) {
      write(list.map(t => (t.id === draft.id ? { ...draft, id: t.id } : t)))
      return
    }
    const id = Math.max(0, ...list.map(t => t.id)) + 1
    write([...list, { ...draft, id }])
  }

  // Réactiver un effet dont la durée s'est écoulée repart pour sa durée complète.
  const toggleTemporaryEffect = (id: number) =>
    write(temporaryEffects.value.map((t) => {
      if (t.id !== id) return t
      const active = !t.active
      const expired = active && t.countdown?.remaining === 0
      return { ...t, active, ...(expired && { countdown: { ...t.countdown!, remaining: t.countdown!.rounds } }) }
    }))

  const removeTemporaryEffect = (id: number) =>
    write(temporaryEffects.value.filter(t => t.id !== id))

  const trackSpell = (cast: CastSpell) => write(armSpell(temporaryEffects.value, cast))

  const applyEnds = (result: { entries: TemporaryEffect[], ended: EndedEffect[] }) => {
    write(result.entries)
    return result.ended
  }
  const elapseRound = () => applyEnds(elapseEntries(temporaryEffects.value))
  const endConcentration = (keepSpellId: number | null) =>
    applyEnds(endConcentrationEntries(temporaryEffects.value, keepSpellId))

  return {
    temporaryEffects,
    temporaryEffectSources,
    saveTemporaryEffect,
    toggleTemporaryEffect,
    removeTemporaryEffect,
    trackSpell,
    elapseRound,
    endConcentration,
  }
}
