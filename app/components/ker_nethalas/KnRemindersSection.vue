<template>
  <KnCard
    v-if="reminders.length"
    storage-key="reminders"
  >
    <template #summary>
      {{ reminders.length }} rappel{{ reminders.length > 1 ? 's' : '' }} en cours
    </template>

    <template #header>
      <KnCardHeader title="Rappels">
        Ce qui est en cours et que le calcul ne peut pas appliquer à votre place.
      </KnCardHeader>
    </template>

    <ul class="space-y-2">
      <li
        v-for="(reminder, index) in reminders"
        :key="index"
        class="flex items-start gap-2 text-sm"
      >
        <UIcon
          :name="ICONS[reminder.severity]"
          class="mt-0.5 size-4 shrink-0"
          :class="COLORS[reminder.severity]"
        />
        <span>
          <span class="font-medium">{{ labelText(reminder.source.label) }}</span>
          <template v-if="labelText(reminder.label) !== labelText(reminder.source.label)">
            — {{ labelText(reminder.label) }}
          </template>
        </span>
      </li>
    </ul>
  </KnCard>
</template>

<script lang="ts" setup>
import type { KnResolvedReminder } from '~~/shared/ker-nethalas/resolve'

defineProps<{
  reminders: KnResolvedReminder[]
}>()

const { labelText } = useKnLabels()

const ICONS = {
  info: 'i-heroicons:information-circle',
  warning: 'i-heroicons:exclamation-triangle',
  danger: 'i-heroicons:exclamation-circle',
} as const

const COLORS = { info: 'text-info', warning: 'text-warning', danger: 'text-error' } as const
</script>
