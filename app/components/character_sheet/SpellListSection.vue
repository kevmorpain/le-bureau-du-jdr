<template>
  <div>
    <p>Emplacements de sort</p>
    <ul class="space-y-4">
      <li
        v-for="level in 9"
        :key="level"
        class="flex items-center gap-x-2"
      >
        <p>{{ level }}</p>

        <div class="flex items-center gap-1">
          <UButton
            icon="heroicons:minus-16-solid"
            variant="ghost"
            :disabled="spellSlots[level]!.max <= 0"
            @click="decrementMaxSpellSlot(level)"
          />

          <div
            v-if="spellSlots[level]!.max === 0"
            class="border border-dashed size-4 rounded-full opacity-50"
          />

          <ul class="flex items-center gap-1 group pointer-events-none">
            <li
              v-for="n in spellSlots[level]!.max"
              :key="n"
              class="pointer-events-auto border size-4 rounded-full hover:bg-primary/50 group-hover:bg-primary/50 peer peer-hover:bg-transparent"
              :class="{
                'bg-primary': n <= spellSlots[level]!.current,
              }"
              @click="setCurrentSpellSlot(level, n)"
            />
          </ul>

          <UButton
            icon="heroicons:plus-16-solid"
            variant="ghost"
            @click="spellSlots[level]!.max++"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  spellSlots,
} = useCharacterSheet(toRef(props, 'characterSheet'))

const decrementMaxSpellSlot = (level: number) => {
  if (spellSlots.value[level]!.max > 0) {
    spellSlots.value[level]!.max--

    if (spellSlots.value[level]!.current > spellSlots.value[level]!.max) {
      spellSlots.value[level]!.current = spellSlots.value[level]!.max
    }
  }
}

const setCurrentSpellSlot = (level: number, n: number) => {
  if (n === spellSlots.value[level]!.current) {
    spellSlots.value[level]!.current--
  } else if (n <= spellSlots.value[level]!.max) {
    spellSlots.value[level]!.current = n
  }
}
</script>
