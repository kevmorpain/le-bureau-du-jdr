<template>
  <div class="max-w-3xl space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Maîtrises
      </h2>
      <p class="text-sm text-muted">
        Deux Maîtrises différentes, une aptitude chacune : le palier 1 et le trait de la Maîtrise sont débloqués. Les
        paliers suivants se prennent aux niveaux suivants, du palier 1 au palier 5.
      </p>
    </div>

    <p
      v-if="!masteries"
      class="rounded-md border border-warning p-3 text-sm"
    >
      Le contenu des Maîtrises n'est pas chargé : le survivant sera créé sans, et vous les choisirez sur la fiche une fois
      le contenu chargé.
    </p>

    <template v-else>
      <p class="text-sm">
        {{ draft.masteries.length }} / {{ KN_MAX_TRAINED_MASTERIES }} choisie(s)
      </p>

      <ul class="grid gap-3 sm:grid-cols-2">
        <li
          v-for="mastery in masteries"
          :key="mastery.key"
        >
          <button
            type="button"
            class="h-full w-full space-y-2 rounded-md border p-3 text-left transition-colors"
            :class="isPicked(mastery.key) ? 'border-primary bg-primary/10' : 'border-default hover:bg-elevated'"
            :aria-pressed="isPicked(mastery.key)"
            @click="toggle(mastery.key)"
          >
            <span class="block font-semibold">{{ mastery.name }}</span>
            <span class="block text-sm text-muted">{{ mastery.summary }}</span>
            <span class="block text-sm">
              <span class="font-medium">{{ mastery.feature.name }}.</span> {{ mastery.feature.text }}
            </span>
            <ul class="space-y-0.5 text-xs text-muted">
              <li
                v-for="ability in mastery.abilities"
                :key="ability.tier"
              >
                {{ ability.tier }}. {{ ability.name }} — {{ ability.action }}{{ ability.cost ? `, ${ability.cost}` : '' }}
              </li>
            </ul>
          </button>
        </li>
      </ul>

      <div
        v-if="picked.length"
        class="space-y-3"
      >
        <h3 class="font-medium">
          Où vous êtes-vous entraîné ?
        </h3>
        <p class="text-sm text-muted">
          D6 par Maîtrise ; le résultat s'ajoute à l'apparence du survivant, que vous pouvez corriger ensuite.
        </p>
        <ul class="space-y-2">
          <li
            v-for="mastery in picked"
            :key="mastery.key"
            class="flex items-center gap-3"
          >
            <span class="flex-1">{{ mastery.name }}</span>
            <UButton
              variant="soft"
              size="sm"
              @click="rollTraining(mastery)"
            >
              Tirer le D6
            </UButton>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { KnCreationDraft } from '~/composables/useKnCreation'
import { KN_MAX_TRAINED_MASTERIES, type KnMastery } from '~~/shared/ker-nethalas/masteries'
import { knRollDie } from '~~/shared/ker-nethalas/run'

const props = defineProps<{
  masteries: KnMastery[] | null
}>()

const draft = defineModel<KnCreationDraft>('draft', { required: true })

const isPicked = (key: string) => draft.value.masteries.includes(key)

const picked = computed(() => (props.masteries ?? []).filter(mastery => isPicked(mastery.key)))

function toggle(key: string) {
  if (isPicked(key)) draft.value.masteries = draft.value.masteries.filter(picked => picked !== key)
  else if (draft.value.masteries.length < KN_MAX_TRAINED_MASTERIES) draft.value.masteries = [...draft.value.masteries, key]
}

function rollTraining(mastery: KnMastery) {
  const place = mastery.training[knRollDie(mastery.training.length) - 1]!
  const line = `Entraînement (${mastery.name}) : ${place.name} — ${place.text}`
  draft.value.appearance = draft.value.appearance.trim() ? `${draft.value.appearance.trim()}\n${line}` : line
}
</script>
