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
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const { notes } = useCharacterSheet(toRef(props, 'characterSheet'))

// Migration ponctuelle depuis l'ancien stockage localStorage (clé globale, non
// scopée par personnage) vers la colonne DB. Ne s'applique qu'une fois : dès que
// la clé legacy est lue, elle est supprimée pour ne pas être réappliquée sur un
// autre personnage.
onMounted(() => {
  if (notes.value) return
  try {
    const legacy = localStorage.getItem('cs-quick-notes')
    if (legacy) {
      notes.value = legacy
      localStorage.removeItem('cs-quick-notes')
    }
  } catch { /* localStorage non disponible */ }
})
</script>
