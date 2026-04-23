<template>
  <div>
    <p>
      {{ characterSheetDescription }}
      <EditClassesSection v-model:character-sheet="characterSheet" />
    </p>
  </div>
</template>

<script lang="ts" setup>
const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const {
  mainClass,
  multiClass,
  species,
  selectedBackground,
} = useCharacterSheet(characterSheet)

const characterSheetDescription = computed<string>(() => {
  const characterClassesText = [mainClass.value, ...multiClass.value].filter(Boolean).map(cls => `${cls.name} ${cls.level}`).join(', ')

  const characterSpecies = species.value?.name ?? 'd\'une espèce inconnue'
  const backgroundName = selectedBackground.value?.name ?? ''

  return [characterSpecies, backgroundName, characterClassesText].filter(Boolean).join(' | ')
})
</script>
