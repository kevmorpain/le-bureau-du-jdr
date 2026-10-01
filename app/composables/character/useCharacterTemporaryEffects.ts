import type { EffectSource } from '~~/shared/rules/effectBonuses'
import type { TemporaryEffect } from '~~/shared/utils/temporary_effects'

export type TemporaryEffectDraft = Omit<TemporaryEffect, 'id'> & { id?: number }

export const useCharacterTemporaryEffects = (characterSheet?: Ref<CharacterSheet>) => {
  const temporaryEffects = computed<TemporaryEffect[]>(() => characterSheet?.value?.temporaryEffects ?? [])

  const temporaryEffectSources = computed<EffectSource[]>(() =>
    temporaryEffects.value
      .filter(t => t.active)
      .map(t => ({ label: t.name, effects: t.effects })),
  )

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

  const toggleTemporaryEffect = (id: number) =>
    write(temporaryEffects.value.map(t => (t.id === id ? { ...t, active: !t.active } : t)))

  const removeTemporaryEffect = (id: number) =>
    write(temporaryEffects.value.filter(t => t.id !== id))

  return {
    temporaryEffects,
    temporaryEffectSources,
    saveTemporaryEffect,
    toggleTemporaryEffect,
    removeTemporaryEffect,
  }
}
