<template>
  <div class="space-y-2 rounded-md border border-primary p-3">
    <div class="flex items-center gap-2">
      <span class="flex-1 text-sm font-medium">{{ request.note ?? 'Test' }}</span>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-heroicons:x-mark"
        aria-label="Fermer le test"
        @click="emit('close')"
      />
    </div>
    <KnRollPanel
      v-model:character="character"
      :selected="request.id"
      :resolved
      fixed
      :start-difficulty="request.difficulty"
      :modifier="request.bonus"
      :advantage="request.advantage"
      @rolled="success => emit('rolled', success)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { KnRollRequest } from '~~/shared/ker-nethalas/roll'

defineProps<{
  request: KnRollRequest
}>()

const emit = defineEmits<{
  rolled: [success: boolean]
  close: []
}>()

const { character, resolved } = useKnCheckContext()
</script>
