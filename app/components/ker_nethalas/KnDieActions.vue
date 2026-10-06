<template>
  <div class="flex items-center gap-1">
    <UButton
      size="sm"
      variant="soft"
      @click="emit('roll')"
    >
      Lancer
    </UButton>
    <UButton
      size="sm"
      variant="outline"
      aria-label="Résultat saisi : 1 ou 2"
      @click="emit('low')"
    >
      1-2
    </UButton>
    <UButton
      size="sm"
      variant="outline"
      aria-label="Résultat saisi : 3 ou plus"
      @click="emit('high')"
    >
      3+
    </UButton>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  roll: []
  low: []
  high: []
}>()
</script>
