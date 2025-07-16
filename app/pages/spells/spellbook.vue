<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <ul class="flex items-center gap-1">
        <li
          v-for="level in availableSpellSlots"
          :key="level"
        >
          {{ level }}
        </li>
      </ul>

      <div class="flex items-center gap-2">
        <p>Cacher les sorts non disponibles</p>
        <USwitch v-model="areSpellsFiltered" />
      </div>
    </div>

    <ul class="grid md:grid-cols-3 gap-4">
      <li
        v-for="spell in filteredSpellBook"
        :key="spell.id"
      >
        <SpellCard :spell />
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
provide('isSpellbook', true)

const { spellBook } = useSpellbook()
const { availableSpellSlots } = useCharacterSheet()

const areSpellsFiltered = ref(false)

const filteredSpellBook = computed(() => {
  if (!areSpellsFiltered.value) return spellBook.value

  return spellBook.value.filter((spell) => {
    return spell.level === 0 || availableSpellSlots.value.includes(spell.level)
  })
})
</script>
