<template>
  <div class="flex flex-wrap items-end gap-3">
    <UButton
      size="sm"
      variant="soft"
      icon="i-heroicons:cube"
      @click="emit('draw', knRollDie(KN_ENCOUNTER_TABLE_DIE), knRollDie(KN_ENCOUNTER_CREATURE_DIE))"
    >
      Tirer une créature (D6 puis D20)
    </UButton>
    <UFormField label="Ou saisir les dés">
      <div class="flex gap-2">
        <UInputNumber
          v-model="d6"
          :min="1"
          :max="KN_ENCOUNTER_TABLE_DIE"
          :increment="false"
          :decrement="false"
          placeholder="D6"
          aria-label="Table de rencontre (D6) : résultat saisi"
          class="w-20"
        />
        <UInputNumber
          v-model="d20"
          :min="1"
          :max="KN_ENCOUNTER_CREATURE_DIE"
          :increment="false"
          :decrement="false"
          placeholder="D20"
          aria-label="Créature (D20) : résultat saisi"
          class="w-20"
        />
        <UButton
          size="sm"
          variant="outline"
          :disabled="d6 === null || d20 === null"
          aria-label="Valider la créature saisie"
          @click="submit"
        >
          Saisir
        </UButton>
      </div>
    </UFormField>
  </div>
</template>

<script lang="ts" setup>
import { KN_ENCOUNTER_CREATURE_DIE, KN_ENCOUNTER_TABLE_DIE } from '~~/shared/ker-nethalas/creatures'
import { knRollDie } from '~~/shared/ker-nethalas/run'

const emit = defineEmits<{
  draw: [d6: number, d20: number]
}>()

const d6 = ref<number | null>(null)
const d20 = ref<number | null>(null)

function submit() {
  if (d6.value === null || d20.value === null) return
  emit('draw', d6.value, d20.value)
  d6.value = null
  d20.value = null
}
</script>
