<template>
  <ul class="space-y-1">
    <li
      v-for="trait in speciesTraits"
      :key="trait.id"
    >
      <UCollapsible>
        <h3 class="font-semibold mb-1">
          {{ trait.name }}
        </h3>

        <template #content>
          <p>{{ trait.description }}</p>

          <ul
            v-if="trait.traitEffects && trait.traitEffects.length > 0"
            class="mt-2 space-y-1"
          >
            <li
              v-for="(te, index) in trait.traitEffects"
              :key="index"
              class="text-sm text-muted"
            >
              - {{ te.effect?.type }}: {{ te.effect?.value }}
            </li>
          </ul>
        </template>
      </UCollapsible>
    </li>
  </ul>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  speciesTraits,
} = useCharacterSheet(toRef(props, 'characterSheet'))
</script>
