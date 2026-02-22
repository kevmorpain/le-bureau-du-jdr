<template>
  <p class="text-toned">
    Niveau {{ characterLevel }}
  </p>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  characterLevel,
} = useCharacterSheet(toRef(props, 'characterSheet'))
</script>
