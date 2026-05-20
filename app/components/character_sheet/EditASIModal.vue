<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <p class="font-semibold text-lg">
            Amélioration de caractéristique — {{ className }}
          </p>
        </template>

        <div class="space-y-3">
          <p
            v-if="availableSlots.length === 0"
            class="text-muted text-sm text-center py-4"
          >
            Aucun slot disponible pour cette classe à votre niveau actuel.
          </p>

          <div
            v-for="slot in availableSlots"
            :key="slot.classLevel"
            class="rounded-lg bg-default ring ring-default p-3 space-y-2"
          >
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <p class="font-semibold text-sm">
                Niveau {{ slot.classLevel }}
              </p>
              <URadioGroup
                :model-value="slot.mode"
                :items="modeItems"
                value-key="value"
                orientation="horizontal"
                variant="table"
                indicator="hidden"
                size="xs"
                @update:model-value="(v) => setMode(slot.classLevel, v as SlotState['mode'])"
              />
            </div>

            <div
              v-if="slot.mode === '+2'"
              class="flex items-center gap-2"
            >
              <span class="text-sm text-muted">Caractéristique :</span>
              <USelect
                :model-value="slot.first ?? 'str'"
                :items="abilityOptions"
                size="sm"
                @update:model-value="(v) => setFirst(slot.classLevel, v as AbilityScoreKey)"
              />
            </div>

            <div
              v-else-if="slot.mode === '+1/+1'"
              class="flex flex-wrap items-center gap-2"
            >
              <USelect
                :model-value="slot.first ?? 'str'"
                :items="abilityOptions"
                size="sm"
                @update:model-value="(v) => setFirst(slot.classLevel, v as AbilityScoreKey)"
              />
              <span class="text-muted">et</span>
              <USelect
                :model-value="slot.second ?? 'dex'"
                :items="abilityOptions"
                size="sm"
                @update:model-value="(v) => setSecond(slot.classLevel, v as AbilityScoreKey)"
              />
            </div>
          </div>
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
              :loading="saving"
              @click="save"
            >
              Enregistrer
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { getASILevels } from '~~/shared/utils/asi'
import type { AbilityScoreKey } from '~~/server/db/schema/effects'

type ASIRow = {
  classId: number
  classLevel: number
  ability: AbilityScoreKey
  amount: number
}

type SlotState = {
  classLevel: number
  mode: 'none' | '+2' | '+1/+1'
  first: AbilityScoreKey | null
  second: AbilityScoreKey | null
}

const props = defineProps<{
  characterSheetId: number
  classId: number
  className: string
  classLevel: number
  allImprovements: ASIRow[]
}>()

const emit = defineEmits<{
  saved: [improvements: ASIRow[]]
}>()

const open = defineModel<boolean>('open', { default: false })

const saving = ref(false)
const toaster = useToast()

const abilityOptions = [
  { label: 'Force', value: 'str' },
  { label: 'Dextérité', value: 'dex' },
  { label: 'Constitution', value: 'con' },
  { label: 'Intelligence', value: 'int' },
  { label: 'Sagesse', value: 'wis' },
  { label: 'Charisme', value: 'cha' },
]

const modeItems = [
  { label: 'Aucun', value: 'none' },
  { label: '+2', value: '+2' },
  { label: '+1 / +1', value: '+1/+1' },
]

const slots = ref<SlotState[]>([])

const availableSlots = computed(() => slots.value)

const initSlots = () => {
  const asiLevels = getASILevels(props.className).filter(l => l <= props.classLevel)
  slots.value = asiLevels.map((classLevel) => {
    const rows = props.allImprovements.filter(a => a.classId === props.classId && a.classLevel === classLevel)
    if (rows.length === 0) {
      return { classLevel, mode: 'none', first: null, second: null }
    }
    if (rows.length === 1 && rows[0]!.amount === 2) {
      return { classLevel, mode: '+2', first: rows[0]!.ability, second: null }
    }
    if (rows.length === 2 && rows.every(r => r.amount === 1)) {
      return { classLevel, mode: '+1/+1', first: rows[0]!.ability, second: rows[1]!.ability }
    }
    // Fallback (donnée incohérente) : reset
    return { classLevel, mode: 'none', first: null, second: null }
  })
}

watch(open, (val) => {
  if (val) initSlots()
})

const setMode = (classLevel: number, mode: SlotState['mode']) => {
  const s = slots.value.find(x => x.classLevel === classLevel)
  if (!s) return
  s.mode = mode
  if (mode === '+2' && !s.first) s.first = 'str'
  if (mode === '+1/+1') {
    if (!s.first) s.first = 'str'
    if (!s.second) s.second = 'dex'
  }
}

const setFirst = (classLevel: number, ability: AbilityScoreKey) => {
  const s = slots.value.find(x => x.classLevel === classLevel)
  if (s) s.first = ability
}

const setSecond = (classLevel: number, ability: AbilityScoreKey) => {
  const s = slots.value.find(x => x.classLevel === classLevel)
  if (s) s.second = ability
}

const save = async () => {
  saving.value = true
  try {
    // Rebuild full ASI array: garde toutes les autres classes intactes, remplace celles de cette classe
    const otherClasses = props.allImprovements.filter(a => a.classId !== props.classId)
    const thisClass: ASIRow[] = []
    for (const s of slots.value) {
      if (s.mode === '+2' && s.first) {
        thisClass.push({ classId: props.classId, classLevel: s.classLevel, ability: s.first, amount: 2 })
      } else if (s.mode === '+1/+1' && s.first && s.second) {
        thisClass.push({ classId: props.classId, classLevel: s.classLevel, ability: s.first, amount: 1 })
        thisClass.push({ classId: props.classId, classLevel: s.classLevel, ability: s.second, amount: 1 })
      }
    }
    const full = [...otherClasses, ...thisClass]
    await $fetch(`/api/character_sheets/${props.characterSheetId}/asi`, {
      method: 'PUT',
      body: { improvements: full },
    })
    emit('saved', full)
    open.value = false
    toaster.add({ title: 'Améliorations enregistrées', color: 'success' })
  } catch {
    toaster.add({ title: 'Erreur lors de l\'enregistrement', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>
