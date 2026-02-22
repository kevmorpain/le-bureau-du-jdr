<template>
  <div class="rounded-lg overflow-hidden bg-default ring ring-default py-1 px-2 self-start min-w-12">
    <p class="font-semibold text-muted">
      Initiative
    </p>

    <p>
      <UIcon
        name="i-game-icons:walking-boot"
        class="size-4"
      />
      {{ formatModifier(initiativeBonus) }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  formatModifier,
  initiativeBonus,
} = useCharacterSheet(toRef(props, 'characterSheet'))
</script>
