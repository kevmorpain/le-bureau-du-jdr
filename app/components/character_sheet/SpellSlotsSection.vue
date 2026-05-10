<template>
  <div
    v-if="hasAnySlots"
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
        v-for="row in slotRows"
        :key="`${row.slotType}-${row.level}`"
        class="flex items-center gap-2"
      >
        <span class="text-xs text-muted w-4 text-right">{{ row.level }}</span>
        <div class="flex gap-1">
          <button
            v-for="i in row.slot.max"
            :key="i"
            class="size-3.5 rounded-full border-2 transition-all cursor-pointer"
            :class="row.slotType === 'pact_magic'
              ? (i <= row.slot.max - row.slot.current
                  ? 'bg-violet-500/60 border-violet-500 hover:bg-violet-500/80'
                  : 'bg-transparent border-violet-400/40 hover:border-violet-400')
              : (i <= row.slot.max - row.slot.current
                  ? 'bg-primary/60 border-primary hover:bg-primary/80'
                  : 'bg-transparent border-muted hover:border-muted')"
            :aria-label="`Emplacement ${row.slotType} niveau ${row.level} ${i}`"
            @click="toggleSlot(row.level, row.slotType, i, row.slot)"
          />
        </div>
        <UBadge
          v-if="row.slotType === 'pact_magic'"
          color="violet"
          variant="subtle"
          size="xs"
        >
          Pacte
        </UBadge>
        <span class="text-xs text-muted ml-auto">{{ row.slot.current }}/{{ row.slot.max }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
type SlotState = { max: number, current: number }
type SlotsByType = {
  spellcasting: Record<number, SlotState>
  pact_magic: Record<number, SlotState>
}
type SlotType = 'spellcasting' | 'pact_magic'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const spellSlots = inject<Ref<SlotsByType>>('spellSlots')!
const { spellSaveDC, spellAttackModifier } = useCharacterSheet(toRef(props, 'characterSheet'))

const slotRows = computed(() => {
  const rows: { level: number, slotType: SlotType, slot: SlotState }[] = []
  for (const [level, slot] of Object.entries(spellSlots.value.spellcasting)) {
    if (slot.max > 0) rows.push({ level: Number(level), slotType: 'spellcasting', slot })
  }
  for (const [level, slot] of Object.entries(spellSlots.value.pact_magic)) {
    if (slot.max > 0) rows.push({ level: Number(level), slotType: 'pact_magic', slot })
  }
  // Sort by level asc, with spellcasting before pact_magic at same level
  rows.sort((a, b) => a.level - b.level || (a.slotType === 'spellcasting' ? -1 : 1))
  return rows
})

const hasAnySlots = computed(() => slotRows.value.length > 0)

const toggleSlot = (level: number, slotType: SlotType, i: number, slot: SlotState) => {
  const used = slot.max - slot.current
  spellSlots.value[slotType][level] = {
    ...slot,
    current: i <= used ? slot.max - (i - 1) : slot.max - i,
  }
}
</script>
