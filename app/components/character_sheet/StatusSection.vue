<template>
  <div class="rounded-lg overflow-hidden bg-default ring ring-default grid grid-cols-2 divide-x divide-default w-75">
    <div class="py-1 px-2">
      <p class="font-semibold text-muted">
        Résistances
      </p>

      <ul>
        <li>
          <UIcon
            name="i-heroicons:chevron-double-up-16-solid"
            class="size-4 text-blue-400"
          /> Poison
        </li>
        <li>
          <UIcon
            name="i-heroicons:chevron-up-16-solid"
            class="size-4 text-blue-400"
          /> Charmé
        </li>
        <li>
          <UIcon
            name="i-heroicons:chevron-down-16-solid"
            class="size-4 text-red-400"
          /> Feu
        </li>
      </ul>
    </div>

    <div class="py-1 px-2">
      <p class="font-semibold text-muted">
        États
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  characterSheet: CharacterSheet
}>()
</script>
