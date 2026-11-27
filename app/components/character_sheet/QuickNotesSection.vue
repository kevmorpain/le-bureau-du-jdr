<template>
  <div class="rounded-xl border border-default bg-default p-3 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-muted">Notes de session</span>
      <UButton
        v-if="notes"
        size="xs"
        variant="ghost"
        color="neutral"
        @click="notes = ''"
      >
        Effacer
      </UButton>
    </div>
    <UTextarea
      v-model="notes"
      placeholder="Notes rapides, rappels, PNJ rencontrés…"
      :rows="4"
      resize
      class="w-full text-sm"
    />
  </div>
</template>

<script lang="ts" setup>
import { useQuickNotes } from '~/composables/character/useQuickNotes'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const { notes } = useQuickNotes(toRef(props, 'characterSheet'))
</script>
