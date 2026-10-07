<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Référence des conditions
      </h2>
      <p class="text-sm text-muted">
        Ce que fait chaque condition, rédigé ici. Celles que le survivant subit en ce moment sont signalées.
      </p>
    </template>

    <ul class="space-y-3">
      <li
        v-for="key in KN_CONDITION_KEYS"
        :key
        class="space-y-0.5"
      >
        <p class="flex items-center gap-2 text-sm font-medium">
          {{ $t(`ker_nethalas.conditions.${key}.name`) }}
          <UBadge
            v-if="activeKeys.has(key)"
            color="warning"
            variant="subtle"
            size="md"
            label="En cours"
          />
        </p>
        <p class="text-sm text-muted">
          {{ $t(`ker_nethalas.conditions.${key}.reminder`, { value: 'X' }) }}
        </p>
      </li>
    </ul>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_CONDITION_KEYS } from '~~/shared/ker-nethalas/catalog/conditions'

const props = defineProps<{
  character: KnCharacter
}>()

const activeKeys = computed(() => new Set<string>(props.character.status.conditions.map(condition => condition.key)))
</script>
