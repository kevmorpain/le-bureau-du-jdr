import type { MaybeRefOrGetter } from 'vue'
import {
  mergeSheet,
  pendingGroups,
  spentSlotsInSnapshot,
  spentSlotsOnServer,
  splitSheetFields,
  type ConflictGroup,
  type SheetField,
  type SnapshotSlots,
} from '~/utils/sheetConflict'
import { readQueue, readSnapshot } from '~/utils/offlineQueue'

export type ConflictSide = 'local' | 'server'

export interface ConflictRow {
  key: string
  label: string
  local: string
  server: string
}

type SheetLike = Record<string, unknown>

export const useSyncConflict = (characterId: MaybeRefOrGetter<number>) => {
  const { t } = useI18n()
  const { resolveConflictWith } = useOfflineSync()

  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const fieldRows = ref<ConflictRow[]>([])
  const groupRows = ref<ConflictRow[]>([])
  const choices = ref<Record<string, ConflictSide>>({})

  let server: SheetLike = {}
  let local: SheetLike = {}
  let localOnly: SheetField[] = []
  let hasSheetChanges = false

  const formatValue = (field: SheetField, value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'boolean') return value ? t('sheet.conflict.yes') : t('sheet.conflict.no')
    if (field === 'concentratingSpellId') return t('sheet.conflict.spell_id', { id: String(value) })
    if (field === 'currentHitDie') return (value as { die: string, count: number }[]).map(({ die, count }) => `d${die} : ${count}`).join(' · ')
    if (field === 'classes') return (value as { level: number, class?: { name?: string } }[]).map(cls => `${cls.class?.name ?? '?'} ${cls.level}`).join(' / ')
    if (field === 'temporaryEffects') return (value as { name: string }[]).map(effect => effect.name).join(', ') || '—'
    if (field === 'preferences') return t('sheet.conflict.own_settings', Object.keys(value as object).length)
    return String(value)
  }

  const groupSummary = (group: ConflictGroup, count: number): ConflictRow => {
    if (group === 'spell-slots') {
      const localSlots = readSnapshot<SnapshotSlots>(toValue(characterId), 'slots')
      return {
        key: group,
        label: t(`sheet.conflict.groups.${group}`),
        local: t('sheet.conflict.spent_slots', { n: spentSlotsInSnapshot(localSlots) }),
        server: t('sheet.conflict.spent_slots', { n: spentSlotsOnServer(server as { spellSlots?: { used?: number }[] }) }),
      }
    }
    return {
      key: group,
      label: t(`sheet.conflict.groups.${group}`),
      local: t('sheet.conflict.pending', count),
      server: t('sheet.conflict.server_state'),
    }
  }

  const load = async () => {
    status.value = 'loading'
    try {
      const id = toValue(characterId)
      server = await $fetch<SheetLike>(`/api/character_sheets/${id}`)
      local = readSnapshot<SheetLike>(id) ?? {}
      const queue = readQueue(id)
      hasSheetChanges = queue.some(op => op.dedupeKey === 'sheet')
      const split = hasSheetChanges
        ? splitSheetFields(readSnapshot<SheetLike>(id, 'base'), local, server)
        : { conflicts: [], localOnly: [] }
      localOnly = split.localOnly
      fieldRows.value = split.conflicts.map(field => ({
        key: field,
        label: t(`sheet.conflict.fields.${field}`),
        local: formatValue(field, local[field]),
        server: formatValue(field, server[field]),
      }))
      groupRows.value = [...pendingGroups(queue)].map(([group, count]) => groupSummary(group, count))
      choices.value = Object.fromEntries([...fieldRows.value, ...groupRows.value].map(row => [row.key, 'local']))
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }

  const needsChoice = computed(() => fieldRows.value.length + groupRows.value.length > 0)

  const chooseAll = (side: ConflictSide) => {
    choices.value = Object.fromEntries(Object.keys(choices.value).map(key => [key, side]))
  }

  const apply = async () => {
    const fromLocal = [...localOnly, ...fieldRows.value.filter(row => choices.value[row.key] === 'local').map(row => row.key as SheetField)]
    await resolveConflictWith(toValue(characterId), {
      sheetBody: hasSheetChanges ? mergeSheet(server, local, fromLocal) : null,
      droppedGroups: groupRows.value.filter(row => choices.value[row.key] === 'server').map(row => row.key as ConflictGroup),
    })
  }

  return { status, fieldRows, groupRows, choices, needsChoice, load, chooseAll, apply }
}
