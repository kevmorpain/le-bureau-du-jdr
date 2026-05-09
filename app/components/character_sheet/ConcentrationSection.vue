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
        @click="stopConcentration"
      >
        Rompre
      </UButton>
    </div>

    <UInput
      v-model="spellName"
      placeholder="Nom du sort…"
      size="sm"
      @update:model-value="saveSpellName"
    />

    <p class="text-xs text-muted leading-relaxed">
      JS Constitution requis si vous prenez des dégâts (DD = max entre 10 et ½ dégâts).
    </p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const { activeConditions, toggleCondition } = useCharacterSheet(toRef(props, 'characterSheet'))

const isConcentrating = computed(() => activeConditions.value.includes('concentrating' as never))

const spellName = ref('')

onMounted(() => {
  try {
    spellName.value = localStorage.getItem('cs-concentration-spell') ?? ''
  } catch { /* localStorage non disponible */ }
})

const saveSpellName = (val: string) => {
  try {
    localStorage.setItem('cs-concentration-spell', val)
  } catch { /* localStorage non disponible */ }
}

const stopConcentration = () => {
  toggleCondition('concentrating' as never)
  spellName.value = ''
  try {
    localStorage.removeItem('cs-concentration-spell')
  } catch { /* localStorage non disponible */ }
}
</script>
