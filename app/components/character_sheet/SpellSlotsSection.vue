<template>
  <div
    v-if="hasSlots"
    class="rounded-xl border border-default bg-default p-3 space-y-2"
  >
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-muted">Emplacements de sort</span>
      <span
        v-if="spellSaveDC"
        class="text-xs text-muted"
      >DD {{ spellSaveDC }} · <span class="font-mono">{{ formatModifier(spellAttackModifier) }}</span></span>
    </div>

    <div class="space-y-1.5">
      <div
        v-for="[level, slot] in activeSlots"
        :key="level"
        class="flex items-center gap-2"
      >
        <span class="text-xs text-muted w-4 text-right">{{ level }}</span>
        <div class="flex gap-1">
          <button
            v-for="i in slot.max"
            :key="i"
            class="size-3.5 rounded-full border-2 transition-all cursor-pointer"
            :class="i <= slot.max - slot.current
              ? 'bg-violet-500/60 border-violet-500 hover:bg-violet-500/80'
              : 'bg-transparent border-muted hover:border-violet-400'"
            :aria-label="`Emplacement niveau ${level} ${i}`"
            @click="toggleSlot(Number(level), i, slot)"
          />
        </div>
        <span class="text-xs text-muted">{{ slot.current }}/{{ slot.max }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const spellSlots = inject<Ref<Record<number, { max: number, current: number }>>>('spellSlots')!
const { spellSaveDC, spellAttackModifier } = useCharacterSheet(toRef(props, 'characterSheet'))

const activeSlots = computed(() =>
  Object.entries(spellSlots.value).filter(([, s]) => s.max > 0),
)

const hasSlots = computed(() => activeSlots.value.length > 0)

const toggleSlot = (level: number, i: number, slot: { max: number, current: number }) => {
  const used = slot.max - slot.current
  spellSlots.value[level] = {
    ...slot,
    current: i <= used ? slot.max - (i - 1) : slot.max - i,
  }
}
</script>
