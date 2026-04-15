<template>
  <div class="rounded-lg overflow-hidden bg-default ring ring-default py-1 px-2 self-start min-w-12">
    <p class="font-semibold text-muted">
      Perception passive
    </p>

    <p class="flex items-center gap-1">
      <UIcon
        name="i-heroicons:eye"
        class="size-4"
      />
      {{ passivePerception }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  passivePerception,
} = useCharacterSheet(toRef(props, 'characterSheet'))
</script>
