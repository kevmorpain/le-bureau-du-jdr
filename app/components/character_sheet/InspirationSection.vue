<template>
  <div class="rounded-lg overflow-hidden bg-default ring ring-default py-1 px-2 self-start min-w-12">
    <p class="font-semibold text-muted">
      Inspiration
    </p>

    <div class="flex justify-center">
      <div
        class="rounded-full border-2 border-accented size-12 p-1 cursor-pointer"
        @click="characterSheet.inspiration = !characterSheet.inspiration"
      >
        <UIcon
          v-show="characterSheet.inspiration"
          name="i-game-icons:enlightenment"
          class="size-10"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
</script>
