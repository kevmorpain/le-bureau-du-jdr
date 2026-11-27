<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.conflict.title')"
    :description="$t('sheet.conflict.help')"
    width="lg"
  >
    <p class="hint">
      {{ $t('sheet.conflict.help') }}
    </p>

    <p
      v-if="status === 'loading'"
      class="hint"
    >
      {{ $t('sheet.conflict.loading') }}
    </p>
    <p
      v-else-if="status === 'error'"
      class="error"
      role="alert"
    >
      {{ $t('sheet.conflict.load_failed') }}
    </p>

    <table
      v-else-if="rows.length"
      class="choices"
    >
      <thead>
        <tr>
          <th>{{ $t('sheet.conflict.columns.field') }}</th>
          <th>
            {{ $t('sheet.conflict.columns.local') }}
            <small
              v-if="localDate"
              class="column__date"
            >{{ $t('sheet.conflict.local_changed_at', { date: localDate }) }}</small>
          </th>
          <th>
            {{ $t('sheet.conflict.columns.server') }}
            <small
              v-if="serverDate"
              class="column__date"
            >{{ $t('sheet.conflict.server_saved_at', { date: serverDate }) }}</small>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.key"
          role="radiogroup"
          :aria-label="row.label"
        >
          <th scope="row">
            {{ row.label }}
          </th>
          <td
            v-for="side in SIDES"
            :key="side"
          >
            <button
              type="button"
              role="radio"
              class="choice"
              :class="{ 'choice--on': choices[row.key] === side }"
              :aria-checked="choices[row.key] === side"
              :aria-label="`${row.label} : ${$t(`sheet.conflict.columns.${side}`)}`"
              @click="choices[row.key] = side"
            >
              <DsDiamond :state="choices[row.key] === side ? 'filled' : 'empty'" />
              <span class="choice__value">{{ row[side] }}</span>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p
      v-if="error"
      class="error"
      role="alert"
    >
      {{ $t('sheet.conflict.apply_failed') }}
    </p>

    <template #footer>
      <span class="footer__all">
        <DsLinkButton
          :label="$t('sheet.conflict.all_local')"
          @click="chooseAll('local')"
        />
        <DsLinkButton
          :label="$t('sheet.conflict.all_server')"
          @click="chooseAll('server')"
        />
      </span>
      <DsButton
        :label="$t('sheet.conflict.keep')"
        :disabled="status !== 'ready' || isApplying"
        @click="handleApply"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import { useSyncConflict, type ConflictSide } from '~/composables/useSyncConflict'

const { characterSheetId } = defineProps<{ characterSheetId: number }>()
const emit = defineEmits<{ resolved: [] }>()
const open = defineModel<boolean>('open', { default: false })

const SIDES: ConflictSide[] = ['local', 'server']

const { conflicts } = useOfflineSync()
const { status, fieldRows, groupRows, choices, needsChoice, serverSavedAt, localChangedAt, load, chooseAll, apply } = useSyncConflict(() => characterSheetId)

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const formatDate = (date: string | number | null) => {
  const parsed = date === null ? Number.NaN : new Date(date).getTime()
  return Number.isNaN(parsed) ? null : DATE_FORMAT.format(parsed)
}
const localDate = computed(() => formatDate(localChangedAt.value))
const serverDate = computed(() => formatDate(serverSavedAt.value))
const rows = computed(() => [...fieldRows.value, ...groupRows.value])

const isApplying = ref(false)
const error = ref(false)

const handleApply = async () => {
  isApplying.value = true
  error.value = false
  try {
    await apply()
    open.value = false
    emit('resolved')
  } catch {
    error.value = true
  } finally {
    isApplying.value = false
  }
}

const isInConflict = computed(() => conflicts.value.includes(characterSheetId))

// A change made on one side only goes through on its own: the window opens only when something needs a choice.
watch(isInConflict, async (inConflict) => {
  if (!inConflict) return
  await load()
  if (status.value === 'ready' && !needsChoice.value) await handleApply()
  else open.value = true
}, { immediate: true })

watch(open, (isOpen) => {
  if (isOpen && status.value === 'error') void load()
})
</script>

<style scoped>
.hint {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--color-ds-mute);
}

.error {
  font-size: 12.5px;
  color: var(--color-ds-bad);
}

.choices {
  width: 100%;
  font-size: 12.5px;
  border-collapse: collapse;
}

.choices th,
.choices td {
  padding: 6px 6px 6px 0;
  text-align: left;
  vertical-align: top;
  border-top: 1px solid var(--color-ds-line);
}

.choices thead th {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ds-faint);
  border-top: 0;
}

.column__date {
  display: block;
  margin-top: 2px;
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: normal;
  text-transform: none;
  color: var(--color-ds-mute);
}

.choices tbody th {
  font-weight: 700;
  color: var(--color-ds-mute);
}

.choice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  text-align: left;
  color: var(--color-ds-ink);
  background: var(--color-ds-panel-raised);
}

.choice--on { box-shadow: inset 0 0 0 1px var(--color-ds-gold); }

.choice__value {
  max-height: 90px;
  overflow-y: auto;
  white-space: pre-line;
}

.footer__all {
  display: flex;
  gap: 12px;
  margin-right: auto;
}
</style>
