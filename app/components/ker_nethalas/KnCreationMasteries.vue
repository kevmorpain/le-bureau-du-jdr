<template>
  <div class="max-w-4xl space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Maîtrises
      </h2>
      <p class="text-sm text-muted">
        Deux Maîtrises différentes, une aptitude chacune : le palier 1 et le trait de la Maîtrise sont débloqués. Les paliers
        suivants se prennent aux niveaux suivants, du palier 1 au palier 5.
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

      <ul class="grid gap-3 lg:grid-cols-2">
        <li
          v-for="mastery in masteries"
          :key="mastery.key"
        >
          <button
            type="button"
            class="h-full w-full space-y-3 rounded-md border p-3 text-left transition-colors"
            :class="isPicked(mastery.key) ? 'border-primary bg-primary/10' : 'border-default hover:bg-elevated'"
            :aria-pressed="isPicked(mastery.key)"
            @click="toggle(mastery.key)"
          >
            <span class="block text-lg font-semibold">{{ mastery.name }}</span>
            <span class="block text-sm text-muted">{{ mastery.summary }}</span>
            <span class="block text-sm">
              <span class="font-medium">{{ mastery.feature.name }}.</span> {{ mastery.feature.text }}
            </span>
            <span class="block space-y-3">
              <span
                v-for="ability in mastery.abilities"
                :key="ability.tier"
                class="block"
              >
                <span class="block text-sm font-medium">
                  Palier {{ ability.tier }} — {{ ability.name }}
                  <span
                    v-if="ability.magical"
                    class="ml-1 text-xs text-info"
                  >Magique</span>
                  <span
                    v-if="ability.sustained"
                    class="ml-1 text-xs text-warning"
                  >Maintenu</span>
                </span>
                <span class="block text-xs text-muted">
                  {{ ability.action }}{{ ability.cost ? ` · ${ability.cost}` : '' }}
                </span>
                <span class="block text-sm">{{ ability.text }}</span>
              </span>
            </span>
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
          D6 par Maîtrise. Le résultat est gardé dans le champ « Entraînement » du survivant ; un nouveau tirage remplace le
          précédent.
        </p>
        <ul class="space-y-3">
          <li
            v-for="mastery in picked"
            :key="mastery.key"
            class="space-y-1 rounded-md border border-default p-3"
          >
            <div class="flex items-center gap-3">
              <span class="flex-1 font-medium">{{ mastery.name }}</span>
              <UButton
                variant="soft"
                size="sm"
                @click="roll(mastery)"
              >
                {{ draft.trainingRolls[mastery.key] ? 'Relancer le D6' : 'Tirer le D6' }}
              </UButton>
            </div>
            <p
              v-if="knTrainingPlace(mastery, draft.trainingRolls)"
              class="text-sm"
            >
              <span class="font-medium">D6 : {{ draft.trainingRolls[mastery.key] }} — {{ knTrainingPlace(mastery, draft.trainingRolls)!.name }}.</span>
              {{ knTrainingPlace(mastery, draft.trainingRolls)!.text }}
            </p>
            <p
              v-else
              class="text-sm text-muted"
            >
              Pas encore tiré.
            </p>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { knTrainingPlace, type KnCreationDraft } from '~/composables/useKnCreation'
import { KN_MAX_TRAINED_MASTERIES, type KnMastery } from '~~/shared/ker-nethalas/masteries'
import { knRollDie } from '~~/shared/ker-nethalas/run'

const props = defineProps<{
  masteries: KnMastery[] | null
}>()

const draft = defineModel<KnCreationDraft>('draft', { required: true })

const isPicked = (key: string) => draft.value.masteries.includes(key)

const picked = computed(() => (props.masteries ?? []).filter(mastery => isPicked(mastery.key)))

function toggle(key: string) {
  if (isPicked(key)) {
    draft.value.masteries = draft.value.masteries.filter(other => other !== key)
    const { [key]: _forgotten, ...rolls } = draft.value.trainingRolls
    draft.value.trainingRolls = rolls
  } else if (draft.value.masteries.length < KN_MAX_TRAINED_MASTERIES) {
    draft.value.masteries = [...draft.value.masteries, key]
  }
}

function roll(mastery: KnMastery) {
  draft.value.trainingRolls = { ...draft.value.trainingRolls, [mastery.key]: knRollDie(mastery.training.length) }
}
</script>
