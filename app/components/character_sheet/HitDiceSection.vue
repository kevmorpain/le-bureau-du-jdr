<template>
  <div class="rounded-xl border border-default bg-default p-3 space-y-2">
    <span class="text-xs font-bold uppercase tracking-widest text-muted">Dés de vie</span>

    <div class="space-y-2">
      <div
        v-for="{ hitDie, count } in hitDice"
        :key="hitDie"
        class="flex items-center gap-2"
      >
        <UTooltip :text="`Cliquer pour utiliser un ${hitDie}`">
          <span class="text-xs font-mono font-bold text-primary w-8">{{ hitDie }}</span>
        </UTooltip>
        <div class="flex gap-1 flex-wrap">
          <button
            v-for="i in count"
            :key="i"
            class="size-3.5 rounded-full border-2 transition-all cursor-pointer"
            :class="i > (count - getUsed(hitDie))
              ? 'bg-transparent border-muted'
              : 'bg-primary/60 border-primary hover:bg-primary/80'"
            :aria-label="`Dé de vie d${hitDie} ${i}`"
            @click="toggleDie(hitDie, i, count)"
          />
        </div>
        <span class="text-xs text-muted">{{ count - getUsed(hitDie) }}/{{ count }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
  roll?: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

const { hitDice, abilityModifiers } = useCharacterSheet(toRef(props, 'characterSheet'))

const storageKey = computed(() => `cs-hit-dice-${props.characterSheet.id}`)

const usedDice = ref<Record<string, number>>({})

onMounted(() => {
  try {
    const stored = localStorage.getItem(storageKey.value)
    if (stored) usedDice.value = JSON.parse(stored)
  } catch { /* localStorage non disponible */ }
})

watch(usedDice, (val) => {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(val))
  } catch { /* localStorage non disponible */ }
}, { deep: true })

watch(() => props.characterSheet.id, () => {
  try {
    const stored = localStorage.getItem(storageKey.value)
    usedDice.value = stored ? JSON.parse(stored) : {}
  } catch {
    usedDice.value = {}
  }
})

const getUsed = (die: string) => usedDice.value[die] ?? 0

const toggleDie = (die: string, i: number, max: number) => {
  const used = getUsed(die)
  const isUsed = i > (max - used)

  if (isUsed) {
    usedDice.value = { ...usedDice.value, [die]: Math.max(0, used - 1) }
  } else {
    usedDice.value = { ...usedDice.value, [die]: Math.min(max, used + 1) }
    const sides = parseInt(die.slice(1))
    const conMod = abilityModifiers.value.con ?? 0
    if (Number.isFinite(sides) && sides > 0) {
      props.roll?.(`Dé de vie ${die}`, Number.isFinite(conMod) ? conMod : 0, sides, 1)
    }
  }
}
</script>
