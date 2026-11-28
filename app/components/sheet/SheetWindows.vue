<template>
  <SheetHitPointsWindow
    v-model:open="isHitPointsOpen"
    v-model:character-sheet="characterSheet"
    :initial-mode="hitPointsMode"
  />
  <SheetDeathSavesWindow
    v-model:open="isDeathSavesOpen"
    v-model:character-sheet="characterSheet"
    @open-hit-points="openHitPoints"
  />
  <SheetConcentrationWindow v-model:character-sheet="characterSheet" />
  <SheetRestWindow
    v-model:open="isRestOpen"
    v-model:character-sheet="characterSheet"
  />
  <SheetEffectsWindow
    v-model:open="isEffectsOpen"
    v-model:character-sheet="characterSheet"
  />
  <SheetCombatStartWindow
    v-model:open="isCombatStartOpen"
    v-model:character-sheet="characterSheet"
  />
</template>

<script lang="ts" setup>
import { useSheetWindows } from '~/composables/character/useSheetWindows'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const { openModel, openHitPoints, hitPointsMode } = useSheetWindows(characterSheet)

const isHitPointsOpen = openModel('hitPoints')
const isDeathSavesOpen = openModel('deathSaves')
const isRestOpen = openModel('rest')
const isEffectsOpen = openModel('effects')
const isCombatStartOpen = openModel('combatStart')
</script>
