<template>
  <div
    v-if="isConcentrating"
    class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2 transition-all"
  >
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-amber-400">Concentration</span>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        @click="setConcentration(null)"
      >
        Rompre
      </UButton>
    </div>

    <p class="text-sm font-medium">
      {{ concentratingSpell?.name ?? 'Sort inconnu' }}
    </p>

    <p class="text-xs text-muted leading-relaxed">
      JS Constitution requis si vous prenez des dégâts (DD = max entre 10 et ½ dégâts).
    </p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const { isConcentrating, concentratingSpell, setConcentration } = useCharacterSheet(toRef(props, 'characterSheet'))
</script>
