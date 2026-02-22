<template>
  {{ characterSheetTitle }}
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const characterSheetTitle = computed<string>(() => props.characterSheet.name ?? 'Personnage sans nom')
</script>
