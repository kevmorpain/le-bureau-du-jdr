<template>
  <div class="rounded-lg overflow-hidden bg-default ring ring-default py-1 px-2 self-start min-w-12">
    <p class="font-semibold text-muted">
      Bonus de maîtrise
    </p>
    <p>{{ formatModifier(proficiencyBonus) }}</p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  proficiencyBonus,
} = useCharacterSheet(toRef(props, 'characterSheet'))
</script>
