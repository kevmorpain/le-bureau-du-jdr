<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <p class="font-semibold text-lg">
            Lancer — {{ spell.name }}
          </p>
        </template>

        <div class="space-y-4">
          <p class="text-muted text-sm">
            Choisissez l'emplacement à utiliser :
          </p>

          <ul class="space-y-2">
            <li
              v-for="opt in availableSlots"
              :key="`${opt.slotType}-${opt.level}`"
            >
              <UButton
                block
                :variant="isSelected(opt) ? 'solid' : 'outline'"
                @click="selected = opt"
              >
                <span class="flex items-center justify-between w-full">
                  <span class="flex items-center gap-2">
                    <span>Niveau {{ opt.level }}</span>
                    <UBadge
                      v-if="opt.slotType === 'pact_magic'"
                      color="violet"
                      variant="subtle"
                      size="xs"
                    >
                      Pacte
                    </UBadge>
                  </span>
                  <span class="text-muted text-sm">
                    {{ opt.slot.current }}/{{ opt.slot.max }} restant{{ opt.slot.current !== 1 ? 's' : '' }}
                  </span>
                </span>
              </UButton>
            </li>
          </ul>

          <p
            v-if="availableSlots.length === 0"
            class="text-muted text-sm text-center py-4"
          >
            Aucun emplacement disponible pour ce sort.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              @click="open = false"
            >
              Annuler
            </UButton>
            <UButton
              :disabled="!selected"
              @click="confirm"
            >
              Lancer
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
type SlotState = { max: number, current: number }
type SlotsByType = {
  spellcasting: Record<number, SlotState>
  pact_magic: Record<number, SlotState>
}
type SlotType = 'spellcasting' | 'pact_magic'

type SlotOption = {
  level: number
  slotType: SlotType
  slot: SlotState
}

const props = defineProps<{
  spell: Spell
  spellSlots: SlotsByType
}>()

const emit = defineEmits<{
  cast: [slotLevel: number, slotType: SlotType]
}>()

const open = defineModel<boolean>('open', { default: false })

const selected = ref<SlotOption | null>(null)

const availableSlots = computed<SlotOption[]>(() => {
  const result: SlotOption[] = []
  for (const [level, slot] of Object.entries(props.spellSlots.spellcasting)) {
    if (Number(level) >= props.spell.level && slot.current > 0) {
      result.push({ level: Number(level), slotType: 'spellcasting', slot })
    }
  }
  for (const [level, slot] of Object.entries(props.spellSlots.pact_magic)) {
    if (Number(level) >= props.spell.level && slot.current > 0) {
      result.push({ level: Number(level), slotType: 'pact_magic', slot })
    }
  }
  // Sort by level asc, spellcasting first at same level
  result.sort((a, b) => a.level - b.level || (a.slotType === 'spellcasting' ? -1 : 1))
  return result
})

const isSelected = (opt: SlotOption) =>
  selected.value?.level === opt.level && selected.value?.slotType === opt.slotType

watch(open, (val) => {
  if (val) {
    selected.value = availableSlots.value[0] ?? null
  }
})

const confirm = () => {
  if (!selected.value) return
  emit('cast', selected.value.level, selected.value.slotType)
  open.value = false
}
</script>
