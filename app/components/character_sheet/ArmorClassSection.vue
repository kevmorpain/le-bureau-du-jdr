<template>
  <div class="ac-background grid place-items-center place-content-center">
    <p class="text-xs">
      CA
    </p>
    <p class="text-2xl font-semibold">
      {{ armorClass }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  armorClass,
} = useCharacterSheet(toRef(props, 'characterSheet'))
</script>

<style scoped>
.ac-background {
  background: no-repeat center url('~/assets/ac_background.svg');
  width: 72px;
  height: 83px;
}
</style>
