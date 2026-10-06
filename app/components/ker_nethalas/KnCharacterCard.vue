<template>
  <UCard variant="soft">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-lg font-semibold truncate">
          {{ character.name }}
        </h3>

        <UButton
          v-if="deletable"
          icon="i-heroicons:trash"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="`Supprimer ${character.name}`"
          @click.prevent.stop="emit('delete')"
        />
      </div>
    </template>

    <p class="text-sm">
      Niveau {{ character.level }}
    </p>
    <p class="text-sm text-muted">
      {{ $t('ker_nethalas.vitals.health') }} {{ character.healthCurrent }}/{{ character.healthMax }}
      · {{ $t('ker_nethalas.vitals.sanity') }} {{ character.sanityCurrent }}/{{ character.sanityMax }}
    </p>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'

defineProps<{
  character: KnCharacter
  deletable?: boolean
}>()

const emit = defineEmits<{
  delete: []
}>()
</script>
