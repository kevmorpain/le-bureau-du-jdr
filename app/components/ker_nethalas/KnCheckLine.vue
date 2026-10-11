<template>
  <p class="text-sm">
    <span class="text-muted">{{ label }} :</span>
    D100 {{ check.roll }}<template v-if="check.swapped">
      lu {{ check.value }}
    </template>
    pour {{ check.target }} ·
    <span :class="check.success ? 'text-success' : 'text-error'">{{ check.success ? 'réussi' : 'raté' }}</span>
    <span
      v-if="check.critical"
      class="font-bold"
    >, {{ check.critical === 'success' ? 'réussite critique' : 'échec critique' }}</span>
  </p>
</template>

<script lang="ts" setup>
import type { KnD100Result } from '~~/shared/ker-nethalas/roll'

defineProps<{
  label: string
  check: KnD100Result
}>()
</script>
