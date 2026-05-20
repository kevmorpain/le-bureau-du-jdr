<template>
  <div class="flex items-center gap-1">
    <p class="text-toned">
      Niveau {{ characterLevel }}
    </p>
    <UButton
      variant="ghost"
      size="xs"
      color="neutral"
      icon="i-heroicons:chevron-double-up"
      :to="`/characters/${props.characterSheet.id}/level-up`"
    />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  characterLevel,
} = useCharacterSheet(toRef(props, 'characterSheet'))
</script>
