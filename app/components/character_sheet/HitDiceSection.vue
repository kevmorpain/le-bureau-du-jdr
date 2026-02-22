<template>
  <div class="border border-muted rounded-md py-1 px-2">
    <p>Dés de vie</p>
    <ul class="md:flex gap-x-2">
      <li
        v-for="{ hitDie, count } in hitDice"
        :key="hitDie"
      >
        {{ count }}{{ hitDie }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  hitDice,
} = useCharacterSheet(toRef(props, 'characterSheet'))
</script>
