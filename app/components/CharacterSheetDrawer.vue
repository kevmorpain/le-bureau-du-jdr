<template>
  <UDrawer
    v-model:open="open"
    :dismissible="false"
    :overlay="false"
    :handle="false"
    :modal="false"
    inset
    direction="top"
    :ui="{ header: 'flex items-center justify-between' }"
  >
    <UButton
      label="Fiche personnage"
      color="primary"
      variant="ghost"
      icon="heroicons-outline:identification"
    />

    <template #header>
      <h2 class="text-highlighted font-semibold">
        Fiche de personnage
      </h2>

      <UButton
        color="neutral"
        variant="ghost"
        icon="heroicons-solid:x-mark"
        @click="open = false"
      />
    </template>

    <template #body>
      <ul class="flex items-center justify-between text-center">
        <li
          v-for="(ability, key) in abilityScores"
          :key
        >
          <p class="font-semibold capitalize">
            {{ key }}
          </p>
          <UInput v-model="abilityScores[key]" />
          <p>{{ abilityModifiers[key] }}</p>
        </li>
      </ul>
    </template>
  </UDrawer>
</template>

<script lang="ts" setup>
const open = defineModel<boolean>('open', {
  required: true,
})

const { abilityScores, abilityModifiers } = useCharacterSheet()
</script>
