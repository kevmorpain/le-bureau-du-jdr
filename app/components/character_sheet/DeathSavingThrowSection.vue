<template>
  <div class="border border-muted rounded-md py-1 px-2">
    <p>JdS contre la mort</p>

    <div class="grid grid-cols-2 divide-x divide-x-muted">
      <ul
        v-for="(value, kind) in deathSavingThrows"
        :key="kind"
        class="flex items-center gap-1 group pointer-events-none"
        :class="{
          'place-self-end pr-2': kind === 'success',
          'place-self-start pl-2': kind === 'failure',
        }"
      >
        <li v-if="kind === 'success'">
          <UIcon
            name="i-game-icons:sundial"
            class="size-5"
          />
        </li>
        <li
          v-for="n in 3"
          :key="n"
          class="pointer-events-auto border size-4 rounded-full peer peer-hover:bg-transparent cursor-pointer"
          :class="{
            'bg-red-700': n <= value && kind === 'failure',
            'bg-green-700': n <= value && kind === 'success',
            'hover:bg-green-300 group-hover:bg-green-300': kind === 'success',
            'hover:bg-red-300 group-hover:bg-red-300': kind === 'failure',
          }"
          @click="deathSavingThrows[kind] = n === value ? n - 1 : n"
        />
        <li v-if="kind === 'failure'">
          <UIcon
            name="i-game-icons:death-skull"
            class="size-4"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  deathSavingThrows,
} = useCharacterSheet(toRef(props, 'characterSheet'))
</script>
