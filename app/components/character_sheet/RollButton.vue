<template>
  <UButton
    :as="rollsEnabled ? 'button' : 'span'"
    :class="{ 'pointer-events-none': !rollsEnabled }"
  >
    <slot />
  </UButton>
</template>

<script lang="ts" setup>
// Jets désactivés, le bouton n'est plus qu'une étiquette : le modificateur ou les dés restent lisibles.
const rollsEnabled = useRollsEnabled()
</script>
