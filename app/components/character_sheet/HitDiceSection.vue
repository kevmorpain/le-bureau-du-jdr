<template>
  <div class="rounded-xl border border-default bg-default p-3 space-y-2">
    <span class="text-xs font-bold uppercase tracking-widest text-muted">Dés de vie</span>

    <div class="space-y-2">
      <div
        v-for="{ hitDie, count } in hitDice"
        :key="hitDie"
        class="flex items-center gap-2"
      >
        <UTooltip :text="`Cliquer pour utiliser un d${hitDie}`">
          <span class="text-xs font-mono font-bold text-primary w-8">d{{ hitDie }}</span>
        </UTooltip>
        <div class="flex gap-1 flex-wrap">
          <button
            v-for="i in count"
            :key="i"
            class="size-3.5 rounded-full border-2 transition-all cursor-pointer"
            :class="i <= getRemaining(hitDie)
              ? 'bg-primary/60 border-primary hover:bg-primary/80'
              : 'bg-transparent border-muted'"
            :aria-label="`Dé de vie d${hitDie} ${i}`"
            @click="toggleDie(hitDie, i, count)"
          />
        </div>
        <span class="text-xs text-muted">{{ getRemaining(hitDie) }}/{{ count }}</span>
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

const getRemaining = (die: string): number => {
  const entry = props.characterSheet.currentHitDie?.find(d => d.die === die)
  if (entry !== undefined) return entry.count
  return hitDice.value.find(h => h.hitDie === die)?.count ?? 0
}

const setRemaining = (die: string, count: number) => {
  if (!props.characterSheet.currentHitDie) {
    props.characterSheet.currentHitDie = hitDice.value.map(h => ({ die: h.hitDie, count: h.count }))
  }
  const entry = props.characterSheet.currentHitDie.find(d => d.die === die)
  if (entry) {
    entry.count = count
  }
  else {
    props.characterSheet.currentHitDie.push({ die, count })
  }
}

const toggleDie = (die: string, i: number, max: number) => {
  const remaining = getRemaining(die)
  const isAvailable = i <= remaining

  if (isAvailable) {
    setRemaining(die, remaining - 1)
    const sides = parseInt(die)
    const conMod = abilityModifiers.value.con ?? 0
    if (Number.isFinite(sides) && sides > 0) {
      props.roll?.(`Dé de vie d${die}`, conMod, sides, 1)
    }
  }
  else {
    setRemaining(die, Math.min(max, remaining + 1))
  }
}
</script>
