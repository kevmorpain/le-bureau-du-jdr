<template>
  <section
    v-if="table"
    class="roll-table"
    :aria-label="table.name"
  >
    <DsGroupTitle :label="$t('sheet.roll_table.title', { die: table.die })" />

    <DsButton
      v-if="!isManual"
      :label="$t('sheet.roll_table.roll', { die: table.die })"
      block
      @click="rollOnTable"
    />
    <div
      v-else
      class="roll-table__manual"
    >
      <DsNumberField
        v-model="entered"
        :label="$t('sheet.roll_table.entered', { die: table.die })"
        :placeholder="`d${table.die}`"
        :min="1"
        :max="table.die"
      />
      <span class="roll-table__hint">{{ $t('sheet.roll_table.manual_hint') }}</span>
    </div>
    <DsLinkButton
      v-if="rollsEnabled"
      :label="isManual ? $t('sheet.roll_table.use_app', { die: table.die }) : $t('sheet.roll_table.use_manual', { die: table.die })"
      class="roll-table__toggle"
      @click="isManual = !isManual"
    />

    <ol
      ref="list"
      class="roll-table__rows"
    >
      <li
        v-for="(entry, index) in table.entries"
        :key="entry.min"
        class="roll-table__row"
        :class="{ 'roll-table__row--latest': index === highlightedIndex, 'roll-table__row--previous': index === previousIndex && !isManual }"
        :aria-current="index === highlightedIndex ? 'true' : undefined"
        :data-index="index"
      >
        <span class="roll-table__range">{{ rollTableRangeLabel(entry, table.die) }}</span>
        <span>{{ entry.text }}</span>
      </li>
    </ol>

    <p class="roll-table__hint">
      {{ rolls.length ? $t('sheet.roll_table.last_rolls', { rolls: rolls.join(', ') }) : $t('sheet.roll_table.no_roll') }}
    </p>
  </section>
</template>

<script lang="ts" setup>
import { rollTableEntryIndex, rollTableRangeLabel, type RollTable } from '~~/shared/rules/rollTables'

const { rollTableId } = defineProps<{ rollTableId: number }>()

const { data: table } = useFetch<RollTable>(() => `/api/catalog/roll-tables/${rollTableId}`)
// The result shows in the drawer: the roll joins the history without a toast.
const { rolls, entered, latestIndex, previousIndex, rollsEnabled, rollOnTable } = useRollTable(table, { silent: true })

const isManual = ref(!rollsEnabled.value)
watch(rollsEnabled, (isEnabled) => {
  if (!isEnabled) isManual.value = true
})

const enteredIndex = computed(() =>
  table.value && entered.value !== null ? rollTableEntryIndex(table.value.entries, entered.value) : -1)
const highlightedIndex = computed(() => (isManual.value ? enteredIndex.value : latestIndex.value))

const list = useTemplateRef<HTMLOListElement>('list')
const scrollToIndex = (index: number) => {
  list.value?.querySelector(`[data-index="${index}"]`)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
}
watch(highlightedIndex, async (index) => {
  if (index < 0) return
  await nextTick()
  scrollToIndex(index)
})
</script>

<style scoped>
.roll-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.roll-table__manual {
  display: flex;
  align-items: center;
  gap: 10px;
}

.roll-table__toggle { align-self: flex-start; }

.roll-table__hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.roll-table__rows {
  display: flex;
  flex-direction: column;
}

.roll-table__row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 8px;
  padding: 6px 8px;
  font-size: 12.5px;
  line-height: 1.45;
  border-bottom: 1px solid var(--color-ds-line);
  transition: background 0.2s ease;
}

.roll-table__row--previous { background: var(--color-ds-panel-raised); }

.roll-table__row--latest {
  background: color-mix(in srgb, var(--color-ds-gold) 14%, var(--color-ds-panel));
  box-shadow: inset 3px 0 0 var(--color-ds-gold);
}

.roll-table__range {
  font-family: var(--font-bodoni);
  font-weight: 700;
  color: var(--color-ds-gold);
}
</style>
