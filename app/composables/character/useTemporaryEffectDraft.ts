import type { Effect } from '~~/server/db/schema/effects'
import { temporaryEffectSchema, type TemporaryEffect } from '~~/shared/utils/temporary_effects'

const draftSchema = temporaryEffectSchema.omit({ id: true })

export type TemporaryEffectFormDraft = Omit<TemporaryEffect, 'id' | 'description' | 'effects'> & {
  id?: number
  description: string
  effects: Effect[]
  // Countdown inputs hold '' once cleared.
  rounds: number | ''
  remaining: number | ''
}

const emptyDraft = (): TemporaryEffectFormDraft => ({ name: '', description: '', active: true, effects: [], rounds: '', remaining: '' })

const asRounds = (v: number | '' | null) => (typeof v === 'number' && v > 0 ? v : undefined)

export const useTemporaryEffectDraft = (characterSheet: Ref<CharacterSheet>) => {
  const { saveTemporaryEffect } = useCharacterSheet(characterSheet)

  const draft = ref<TemporaryEffectFormDraft>(emptyDraft())

  // Same schema as the sheet's PUT: one invalid entry would fail the whole save.
  const draftEntry = computed(() => {
    const { rounds, remaining, ...entry } = draft.value
    const total = asRounds(rounds)
    return { ...entry, countdown: total ? { rounds: total, remaining: typeof remaining === 'number' ? remaining : total } : undefined }
  })
  const parsedDraft = computed(() => draftSchema.safeParse(draftEntry.value))

  const resetDraft = () => {
    draft.value = emptyDraft()
  }

  const editDraft = (entry: TemporaryEffect) => {
    // Deep copy: cancelling the edit must not touch the sheet.
    draft.value = { ...emptyDraft(), ...JSON.parse(JSON.stringify(entry)), rounds: entry.countdown?.rounds ?? '', remaining: entry.countdown?.remaining ?? '' }
  }

  const submitDraft = (): boolean => {
    if (!parsedDraft.value.success) return false
    saveTemporaryEffect({ ...parsedDraft.value.data, id: draft.value.id })
    resetDraft()
    return true
  }

  return { draft, parsedDraft, resetDraft, editDraft, submitDraft }
}
