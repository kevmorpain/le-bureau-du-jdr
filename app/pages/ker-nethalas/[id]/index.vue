<template>
  <div
    v-if="character && resolved"
    class="space-y-6 pb-12"
  >
    <UPageHeader :title="character.name">
      <template #links>
        <span
          class="text-sm"
          :class="state === 'error' ? 'text-error' : 'text-muted'"
        >
          {{ stateLabel }}
        </span>
      </template>
    </UPageHeader>

    <KnIdentitySection v-model:character="character" />

    <KnRemindersSection :reminders="resolved.reminders" />

    <KnVitalsSection
      v-model:character="character"
      :resolved
    />

    <KnChecksSection
      v-model:character="character"
      :resolved
    />

    <KnEffectsSection v-model:character="character" />

    <KnEquipmentSection v-model:character="character" />

    <KnNotesSection v-model:character="character" />
  </div>

  <UPageBody v-else>
    <p class="text-muted">
      Ce survivant est introuvable.
    </p>
    <UButton
      to="/ker-nethalas"
      variant="soft"
      class="mt-4"
    >
      Retour à la liste
    </UButton>
  </UPageBody>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnSaveState } from '~/composables/useKnAutosave'

const route = useRoute()

const { data } = await useFetch<KnCharacter>(`/api/ker-nethalas/characters/${route.params.id}`)
// `useFetch` rend `data` superficielle : on la recopie dans une ref profonde pour que l'édition soit réactive.
const character = ref(data.value)

const { state } = useKnAutosave(character)
const resolved = useKnResolved(character)

const STATE_LABELS: Record<KnSaveState, string> = {
  idle: '',
  pending: 'Modifications en attente…',
  saving: 'Enregistrement…',
  saved: 'Enregistré',
  error: 'Échec de l\'enregistrement',
}
const stateLabel = computed(() => STATE_LABELS[state.value])
</script>
