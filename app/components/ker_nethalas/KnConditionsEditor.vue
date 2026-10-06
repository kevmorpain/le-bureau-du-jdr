<template>
  <section class="space-y-3">
    <h3 class="font-medium">
      Conditions
    </h3>

    <KnAddPicker
      :items="available"
      placeholder="Ajouter une condition"
      class="w-full sm:w-72"
      @pick="add"
    />

    <ul
      v-if="status.conditions.length"
      class="space-y-2"
    >
      <li
        v-for="(entry, index) in status.conditions"
        :key="entry.key"
        class="flex items-center gap-3"
      >
        <span class="flex-1">{{ $t(`ker_nethalas.conditions.${entry.key}.name`) }}</span>
        <KnNumberField
          v-if="KN_CONDITIONS[entry.key].value"
          :model-value="entry.value ?? 0"
          :aria-label="`${$t(`ker_nethalas.conditions.${entry.key}.name`)} : valeur`"
          :min="KN_STATUS_BOUNDS.conditionValue.min"
          :max="KN_STATUS_BOUNDS.conditionValue.max"
          class="w-24"
          @update:model-value="entry.value = $event"
        />
        <UButton
          icon="i-heroicons:trash"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="`Retirer ${$t(`ker_nethalas.conditions.${entry.key}.name`)}`"
          @click="status.conditions.splice(index, 1)"
        />
      </li>
    </ul>
  </section>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import { KN_CONDITION_KEYS, KN_CONDITIONS, type KnConditionKey } from '~~/shared/ker-nethalas/catalog/conditions'
import { KN_STATUS_BOUNDS, type KnStatus } from '~~/shared/ker-nethalas/status'

const status = defineModel<KnStatus>('status', { required: true })

const { t } = useI18n()

const available = computed<SelectItem[]>(() =>
  KN_CONDITION_KEYS
    .filter(key => !status.value.conditions.some(c => c.key === key))
    .map(key => ({ label: t(`ker_nethalas.conditions.${key}.name`), value: key })),
)

function add(key: string | number) {
  if (!KN_CONDITION_KEYS.includes(key as KnConditionKey)) return
  const condition = key as KnConditionKey
  status.value.conditions.push({ key: condition, value: KN_CONDITIONS[condition].value?.default })
}
</script>
