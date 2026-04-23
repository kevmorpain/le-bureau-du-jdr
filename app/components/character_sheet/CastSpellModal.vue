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
            Choisissez le niveau d'emplacement à utiliser :
          </p>

          <ul class="space-y-2">
            <li
              v-for="level in availableSlotLevels"
              :key="level"
            >
              <UButton
                block
                :variant="selectedLevel === level ? 'solid' : 'outline'"
                @click="selectedLevel = level"
              >
                <span class="flex items-center justify-between w-full">
                  <span>Niveau {{ level }}</span>
                  <span class="text-muted text-sm">
                    {{ spellSlots[level]?.current }}/{{ spellSlots[level]?.max }} restant{{ spellSlots[level]?.current !== 1 ? 's' : '' }}
                  </span>
                </span>
              </UButton>
            </li>
          </ul>

          <p
            v-if="availableSlotLevels.length === 0"
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
              :disabled="selectedLevel === null || availableSlotLevels.length === 0"
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
const props = defineProps<{
  spell: Spell
  spellSlots: Record<number, { max: number, current: number }>
}>()

const emit = defineEmits<{
  cast: [slotLevel: number]
}>()

const open = defineModel<boolean>('open', { default: false })

const selectedLevel = ref<number | null>(null)

const availableSlotLevels = computed(() => {
  return Object.entries(props.spellSlots)
    .filter(([level, slot]) => Number(level) >= props.spell.level && slot.current > 0)
    .map(([level]) => Number(level))
    .sort((a, b) => a - b)
})

watch(open, (val) => {
  if (val) {
    selectedLevel.value = availableSlotLevels.value[0] ?? null
  }
})

const confirm = () => {
  if (selectedLevel.value === null) return
  emit('cast', selectedLevel.value)
  open.value = false
}
</script>
