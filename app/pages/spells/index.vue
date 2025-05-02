<template>
  <UContainer>
    <ul class="grid grid-cols-3 gap-4">
      <li v-for="spell in data" :key="spell.id">
        <UCard variant="soft">
          <template #header>
            <h2>{{ spell.name }}</h2>
          </template>

          <p>{{ spell.description }}</p>
          <p>Level: {{ spell.level }}</p>
          <p>Components: {{ spell.components }}</p>
          <p>Casting Time: {{ spell.castingTime }}</p>
          <p>Range: {{ spell.range }}</p>
          <p>Duration: {{ spell.duration }}</p>

          <template #footer>
            <p>Created at: {{ spell.createdAt }}</p>
          </template>
        </UCard>
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
const { data } = await useFetch<Spell[]>('/api/spells')
</script>
