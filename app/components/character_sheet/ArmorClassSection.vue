<template>
  <UTooltip :text="armorClass.detail">
    <div class="ac-background grid place-items-center place-content-center cursor-help">
      <p class="text-xs">
        CA
      </p>
      <p class="text-2xl font-semibold">
        {{ armorClass.total }}
      </p>
    </div>
  </UTooltip>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const { armorClass } = useCharacterSheet(toRef(props, 'characterSheet'))
</script>

<style scoped>
.ac-background {
  background: no-repeat center url('~/assets/ac_background.svg');
  width: 72px;
  height: 83px;
}
</style>
