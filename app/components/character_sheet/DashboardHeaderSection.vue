<template>
  <header class="sticky top-16 z-40 bg-elevated border-b border-default shadow-sm">
    <div class="flex items-center gap-4 px-5 py-2.5 flex-wrap">
      <!-- Identité -->
      <div class="shrink-0">
        <div class="flex items-baseline gap-2">
          <h1 class="text-lg font-bold">
            {{ characterSheet.name ?? 'Personnage sans nom' }}
          </h1>
          <span class="text-sm text-muted">Niv. {{ characterLevel }}</span>
        </div>
        <p class="text-xs text-muted/70 mt-0.5">
          {{ characterDescription }}
        </p>
      </div>

      <!-- Conditions actives -->
      <div
        v-if="activeConditions.length"
        class="flex flex-wrap gap-1"
      >
        <UBadge
          v-for="condition in activeConditions"
          :key="condition"
          color="primary"
          variant="subtle"
          size="sm"
          class="cursor-pointer"
          @click="toggleCondition(condition)"
        >
          {{ conditionLabels[condition] }}
          <UIcon
            name="i-heroicons:x-mark-16-solid"
            class="size-3 ml-0.5"
          />
        </UBadge>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 ml-auto flex-wrap">
        <UButton
          icon="i-game-icons:forest-camp"
          variant="outline"
          size="sm"
          :loading="isResting"
          @click="$emit('shortRest')"
        >
          Repos court
        </UButton>
        <UButton
          icon="i-game-icons:night-sleep"
          variant="outline"
          size="sm"
          :loading="isResting"
          @click="$emit('longRest')"
        >
          Repos long
        </UButton>
        <UButton
          icon="i-game-icons:crossed-swords"
          size="sm"
          :variant="combatMode ? 'solid' : 'outline'"
          color="secondary"
          @click="$emit('toggleCombat')"
        >
          {{ combatMode ? 'Combat actif' : 'Mode Combat' }}
        </UButton>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { conditionLabels } from '~~/shared/utils/labels'

const props = defineProps<{
  characterSheet: CharacterSheet
  isResting: boolean
  combatMode: boolean
  roll: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

defineEmits<{
  shortRest: []
  longRest: []
  toggleCombat: []
}>()

const csRef = toRef(props, 'characterSheet')
const {
  characterLevel,
  activeConditions,
  toggleCondition,
  mainClass,
  multiClass,
  species,
  selectedBackground,
} = useCharacterSheet(csRef)

const characterDescription = computed(() => {
  const classesText = [mainClass.value, ...multiClass.value]
    .filter(Boolean)
    .map(cls => `${cls!.name} ${cls!.level}`)
    .join(', ')
  const speciesName = species.value?.name ?? ''
  const backgroundName = selectedBackground.value?.name ?? ''
  return [speciesName, backgroundName, classesText].filter(Boolean).join(' · ')
})
</script>
