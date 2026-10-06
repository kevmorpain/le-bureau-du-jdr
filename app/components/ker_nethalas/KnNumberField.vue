<template>
  <UFormField :label>
    <UInputNumber
      :model-value="model"
      :min
      :max
      :increment="false"
      :decrement="false"
      :aria-label="ariaLabel ?? label"
      class="w-full"
      @update:model-value="update"
    />
  </UFormField>
</template>

<script lang="ts" setup>
defineProps<{
  label?: string
  ariaLabel?: string
  min: number
  max: number
}>()

const model = defineModel<number>({ required: true })

// Un champ vidé en cours de frappe émet `null` : l'ignorer évite d'envoyer une valeur que le schéma refuserait.
function update(value: number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) model.value = value
}
</script>
