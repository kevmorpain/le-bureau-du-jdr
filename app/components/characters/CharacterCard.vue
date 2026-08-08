<template>
  <UCard variant="soft">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-lg font-semibold">
          {{ characterName }}
        </h3>

        <UButton
          v-if="deletable"
          icon="i-heroicons:trash"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="`Supprimer ${characterName}`"
          @click.prevent.stop="emit('delete')"
        />
      </div>
    </template>

    <p>
      {{ characterDescription }}
    </p>
  </UCard>
</template>

<script lang="ts" setup>
const props = defineProps<{
  character: CharacterSheet
  deletable?: boolean
}>()

const emit = defineEmits<{
  delete: []
}>()

const { mainClass, multiClass, species } = useCharacterSheet(toRef(props, 'character'))

const characterName = computed<string>(() => props.character.name ?? 'Personnage sans nom')
const characterDescription = computed<string>(() => {
  const characterClassesText = [mainClass.value, ...multiClass.value].filter(Boolean).map(cls => `${cls.name} ${cls.level}`).join(', ')

  const characterSpecies = species.value?.name ?? 'd\'une espèce inconnue'

  return [characterClassesText, characterSpecies].join(' ')
})
</script>
