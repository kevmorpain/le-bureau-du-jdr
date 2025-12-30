<template>
  <div class="flex items-center space-x-4">
    <UFormField
      label="Niveaux"
    >
      <USelect
        v-model="filters.levels"
        :items="levelsItems"
        value-key="value"
        placeholder="Tous les niveaux"
        multiple
        class="w-40"
      />
    </UFormField>

    <UFormField
      label="Concentration"
    >
      <URadioGroup
        v-model="filters.concentration"
        :items="booleanItems"
        value-key="value"
        orientation="horizontal"
        variant="table"
        indicator="hidden"
        size="xs"
      />
    </UFormField>

    <UFormField
      label="Rituel"
    >
      <URadioGroup
        v-model="filters.ritual"
        :items="booleanItems"
        value-key="value"
        orientation="horizontal"
        variant="table"
        indicator="hidden"
        size="xs"
      />
    </UFormField>

    <UFormField
      label="Composantes"
    >
      <UCheckboxGroup
        v-model="filters.components"
        :items="componentsItems"
        value-key="value"
        orientation="horizontal"
        variant="table"
        indicator="hidden"
        size="xs"
      />
    </UFormField>

    <UFormField
      label="Temps d'incantation"
    >
      <USelect
        v-model="filters.castingTime"
        :items="castingTimeItems"
        value-key="value"
        placeholder="Tous les temps d'incantation"
        multiple
        class="w-40"
      />
    </UFormField>
  </div>
</template>

<script lang="ts" setup>
const { booleanItems, castingTimeItems, componentsItems, filters, levelsItems } = useSpellFilters()
</script>
