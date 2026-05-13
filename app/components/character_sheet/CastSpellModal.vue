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
          <!-- Classe lanceuse (multiclasse spellcaster) -->
          <div
            v-if="casterChoices.length > 1 && selected?.slotType === 'spellcasting'"
            class="space-y-2"
          >
            <p class="text-muted text-sm">
              Lancer en tant que :
            </p>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="c in casterChoices"
                :key="c.classId"
                size="sm"
                :variant="selectedCasterId === c.classId ? 'solid' : 'outline'"
                @click="selectedCasterId = c.classId"
              >
                {{ c.className }} ({{ abilityShortLabels[c.ability] ?? c.ability.toUpperCase() }})
              </UButton>
            </div>
          </div>

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

type CasterChoice = {
  classId: number
  className: string
  ability: string
}

const props = defineProps<{
  spell: Spell
  spellSlots: SlotsByType
  casterChoices?: CasterChoice[]
  initialCasterClassId?: number | null
}>()

const emit = defineEmits<{
  cast: [slotLevel: number, slotType: SlotType, casterClassId: number | null]
}>()

const open = defineModel<boolean>('open', { default: false })

const selected = ref<SlotOption | null>(null)
const selectedCasterId = ref<number | null>(null)

const casterChoices = computed<CasterChoice[]>(() => props.casterChoices ?? [])

const abilityShortLabels: Record<string, string> = {
  str: 'FOR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'SAG', cha: 'CHA',
}

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
  result.sort((a, b) => a.level - b.level || (a.slotType === 'spellcasting' ? -1 : 1))
  return result
})

const isSelected = (opt: SlotOption) =>
  selected.value?.level === opt.level && selected.value?.slotType === opt.slotType

watch(open, (val) => {
  if (val) {
    selected.value = availableSlots.value[0] ?? null
    selectedCasterId.value = props.initialCasterClassId ?? casterChoices.value[0]?.classId ?? null
  }
})

const confirm = () => {
  if (!selected.value) return
  // Pour pact_magic, la classe lanceuse est toujours le Warlock (déterminé en amont) → on renvoie null
  const casterId = selected.value.slotType === 'pact_magic' ? null : selectedCasterId.value
  emit('cast', selected.value.level, selected.value.slotType, casterId)
  open.value = false
}
</script>
