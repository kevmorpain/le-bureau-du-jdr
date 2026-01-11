<template>
  <UPageHeader title="Liste des personnages" />

  <UPageBody>
    <UPageGrid>
      <NuxtLink to="/characters/new">
        <UCard
          class="h-full place-content-center place-items-center"
        >
          <div
            class="flex items-center gap-x-4"
          >
            <h3 class="text-lg font-semibold">
              Ajouter un personnage
            </h3>

            <UIcon
              name="heroicons-outline:plus-circle"
              class="size-8 text-primary"
            />
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink
        v-for="character in characters"
        :key="character.id"
        :to="`/characters/${character.id}`"
      >
        <UCard variant="soft">
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ character.name }}
            </h3>
          </template>

          <p>
            {{ character.species?.name || '-' }}
          </p>
        </UCard>
      </NuxtLink>
    </UPageGrid>
  </UPageBody>
</template>

<script lang="ts" setup>
const { data: characters } = await useFetch<CharacterSheet[]>('/api/character_sheets')
</script>
