<template>
  <USelect
    :key="resetKey"
    :model-value="undefined"
    :items
    :placeholder
    :disabled
    @update:model-value="pick"
  />
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'

defineProps<{
  items: SelectItem[]
  placeholder: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  pick: [value: string | number]
}>()

// Le select garde la valeur choisie, et l'élément pouvant quitter la liste, il afficherait alors sa clé brute :
// on le remonte pour qu'il retrouve son libellé d'invite.
const resetKey = ref(0)

function pick(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return
  emit('pick', value)
  resetKey.value++
}
</script>
