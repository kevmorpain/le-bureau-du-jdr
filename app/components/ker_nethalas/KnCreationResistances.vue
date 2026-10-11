<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Résistances
      </h2>
      <p class="text-sm text-muted">
        Une Résistance démarre à 40, les deux autres à 20. Elles ne montent pas à l'usage comme les compétences.
      </p>
    </div>

    <URadioGroup
      :model-value="draft.resistanceBoost ?? undefined"
      :items="items"
      @update:model-value="setBoost"
    />
  </div>
</template>

<script lang="ts" setup>
import type { RadioGroupItem } from '@nuxt/ui'
import type { KnCreationDraft } from '~/composables/useKnCreation'
import { KN_RESISTANCE_KEYS } from '~~/shared/ker-nethalas/skills'

const draft = defineModel<KnCreationDraft>('draft', { required: true })

const { t } = useI18n()

const items = computed<RadioGroupItem[]>(() =>
  KN_RESISTANCE_KEYS.map(key => ({
    value: key,
    label: t(`ker_nethalas.resistances.${key}`),
    description: draft.value.resistanceBoost === key ? '40' : '20',
  })),
)

function setBoost(value: unknown) {
  const key = KN_RESISTANCE_KEYS.find(candidate => candidate === value)
  if (key) draft.value.resistanceBoost = key
}
</script>
