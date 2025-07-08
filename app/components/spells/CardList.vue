<template>
  <ul class="grid md:grid-cols-3 gap-4">
    <li
      v-for="spell in spells"
      :key="spell.id"
    >
      <SpellCard :spell />
    </li>
  </ul>
</template>

<script lang="ts" setup>
defineProps<{
  spells: Spell[]
}>()
</script>
