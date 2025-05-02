<template>
  <div>
    <ul>
      <li v-for="spell in data" :key="spell.id">
        <h2>{{ spell.name }}</h2>
        <p>{{ spell.description }}</p>
        <p>Level: {{ spell.level }}</p>
        <p>Components: {{ spell.components }}</p>
        <p>Casting Time: {{ spell.castingTime }}</p>
        <p>Range: {{ spell.range }}</p>
        <p>Duration: {{ spell.duration }}</p>
        <p>Created at: {{ spell.createdAt }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { data } = await useFetch<Spell[]>('/api/spells')
</script>
