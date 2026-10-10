<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Jauges de départ
      </h2>
      <p class="text-sm text-muted">
        Lancez les dés, ou saisissez le résultat d'un dé lancé à la table. Les jauges démarrent pleines.
      </p>
    </div>

    <ul class="space-y-4">
      <li
        v-for="vital in KN_CREATION_VITAL_KEYS"
        :key="vital"
        class="flex flex-wrap items-center gap-3"
      >
        <div class="w-40">
          <p class="font-medium">
            {{ $t(`ker_nethalas.vitals.${vital}`) }}
          </p>
          <p class="text-xs text-muted">
            {{ formula(vital) }}
          </p>
        </div>
        <UInputNumber
          :model-value="draft.vitals[vital] ?? undefined"
          :min="knVitalRange(vital).min"
          :max="knVitalRange(vital).max"
          :increment="false"
          :decrement="false"
          :aria-label="`${$t(`ker_nethalas.vitals.${vital}`)} : valeur de départ`"
          class="w-28"
          @update:model-value="value => setVital(vital, value)"
        />
        <UButton
          variant="soft"
          @click="draft.vitals[vital] = knRollStartingVital(vital)"
        >
          Lancer
        </UButton>
      </li>
    </ul>

    <UButton
      variant="outline"
      @click="rollAll"
    >
      Tout lancer
    </UButton>
  </div>
</template>

<script lang="ts" setup>
import type { KnCreationDraft } from '~/composables/useKnCreation'
import {
  KN_CREATION_VITALS,
  KN_CREATION_VITAL_KEYS,
  knRollStartingVital,
  knVitalRange,
  type KnCreationVital,
} from '~~/shared/ker-nethalas/creation'

const draft = defineModel<KnCreationDraft>('draft', { required: true })

function formula(vital: KnCreationVital) {
  const { dice, sides, bonus } = KN_CREATION_VITALS[vital]
  const { min, max } = knVitalRange(vital)
  return `${dice > 1 ? dice : ''}D${sides} + ${bonus} (${min} à ${max})`
}

// Un champ vidé en cours de frappe n'est pas écrit : la valeur précédente reste.
function setVital(vital: KnCreationVital, value: number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) draft.value.vitals[vital] = value
}

function rollAll() {
  for (const vital of KN_CREATION_VITAL_KEYS) draft.value.vitals[vital] = knRollStartingVital(vital)
}
</script>
