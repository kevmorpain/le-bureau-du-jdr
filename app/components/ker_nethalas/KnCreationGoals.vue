<template>
  <div class="max-w-4xl space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Objectifs personnels
      </h2>
      <p class="text-sm text-muted">
        Deux objectifs à la fois, non modifiables une fois pris. Quand l'un est atteint, sa récompense se récupère sur la
        fiche, et un autre objectif peut être pris ; chacun ne se prend et ne s'accomplit qu'une fois.
      </p>
    </div>

    <p
      v-if="!goals"
      class="rounded-md border border-warning p-3 text-sm"
    >
      Le contenu des objectifs personnels n'est pas chargé : le survivant sera créé sans, et vous les choisirez sur la fiche
      une fois le contenu chargé.
    </p>

    <template v-else>
      <p class="text-sm">
        {{ draft.goals.length }} / {{ KN_MAX_ACTIVE_GOALS }} choisi(s)
      </p>

      <ul class="grid gap-3 lg:grid-cols-2">
        <li
          v-for="goal in goals"
          :key="goal.key"
        >
          <button
            type="button"
            class="h-full w-full space-y-2 rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            :class="isPicked(goal.key) ? 'border-primary bg-primary/10' : 'border-default hover:bg-elevated'"
            :aria-pressed="isPicked(goal.key)"
            :disabled="!isPicked(goal.key) && draft.goals.length >= KN_MAX_ACTIVE_GOALS"
            @click="toggle(goal.key)"
          >
            <span class="flex flex-wrap items-center gap-2">
              <span class="font-semibold">{{ goal.name }}</span>
              <UBadge
                v-if="goal.recommended"
                label="Recommandé en premier"
                color="warning"
                variant="subtle"
                size="md"
              />
            </span>
            <span class="block text-sm">{{ goal.objective }}</span>
            <span class="block text-sm text-muted">
              <span class="font-medium">Récompense.</span> {{ goal.reward }}
            </span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { KnCreationDraft } from '~/composables/useKnCreation'
import { KN_MAX_ACTIVE_GOALS, type KnPersonalGoal } from '~~/shared/ker-nethalas/goals'

defineProps<{
  goals: KnPersonalGoal[] | null
}>()

const draft = defineModel<KnCreationDraft>('draft', { required: true })

const isPicked = (key: string) => draft.value.goals.includes(key)

function toggle(key: string) {
  if (isPicked(key)) draft.value.goals = draft.value.goals.filter(other => other !== key)
  else if (draft.value.goals.length < KN_MAX_ACTIVE_GOALS) draft.value.goals = [...draft.value.goals, key]
}
</script>
