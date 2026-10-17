<template>
  <KnCard storage-key="goals">
    <template #header>
      <KnCardHeader title="Objectifs personnels">
        Deux objectifs en cours au plus. Le progrès se note à la main ; une fois la cible atteinte, récupérez la récompense,
        puis choisissez un autre objectif.
      </KnCardHeader>
    </template>

    <p
      v-if="!goals"
      class="text-sm text-muted"
    >
      Le contenu des objectifs personnels n'est pas chargé : ils se choisissent ici une fois chargé, en attendant ils se
      notent dans « Autres objectifs ».
    </p>

    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="pick in active"
        :key="pick.key"
        class="space-y-2 rounded-md border border-default p-3"
      >
        <template v-if="find(pick.key)">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
              :aria-expanded="isOpen(pick.key)"
              :aria-label="`${find(pick.key)!.name} : détails`"
              @click="toggle(pick.key)"
            >
              <UIcon
                :name="isOpen(pick.key) ? 'i-heroicons:chevron-down' : 'i-heroicons:chevron-right'"
                class="size-4 shrink-0 text-muted"
              />
              <span class="truncate font-semibold">{{ find(pick.key)!.name }}</span>
              <UBadge
                v-if="reached(pick)"
                label="Atteint"
                color="success"
                variant="subtle"
                size="md"
              />
            </button>
            <span class="text-sm tabular-nums text-muted">{{ pick.progress }} / {{ find(pick.key)!.target }}</span>
            <UButton
              size="xs"
              variant="soft"
              :aria-label="`Ajouter 1 au progrès : ${find(pick.key)!.name}`"
              @click="setProgress(pick.key, pick.progress + 1)"
            >
              +1
            </UButton>
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              :aria-label="`Retirer 1 au progrès : ${find(pick.key)!.name}`"
              @click="setProgress(pick.key, pick.progress - 1)"
            >
              −1
            </UButton>
            <UButton
              v-if="reached(pick)"
              size="xs"
              @click="claim(pick.key)"
            >
              Récupérer la récompense
            </UButton>
          </div>

          <UProgress
            :model-value="Math.min(pick.progress, find(pick.key)!.target)"
            :max="find(pick.key)!.target"
            size="sm"
          />

          <div
            v-if="isOpen(pick.key)"
            class="space-y-3 pt-1"
          >
            <p class="text-sm">
              {{ find(pick.key)!.objective }}
            </p>

            <p class="rounded-md bg-elevated p-2 text-sm">
              <span class="font-medium">Récompense.</span> {{ find(pick.key)!.reward }}
            </p>

            <div class="flex flex-wrap items-end gap-3">
              <KnNumberField
                :model-value="pick.progress"
                label="Progrès"
                :aria-label="`Progrès : ${find(pick.key)!.name}`"
                :min="KN_GOAL_BOUNDS.progress.min"
                :max="KN_GOAL_BOUNDS.progress.max"
                class="w-32"
                @update:model-value="setProgress(pick.key, $event)"
              />
              <UButton
                v-if="pick.progress === 0"
                size="sm"
                variant="ghost"
                color="neutral"
                :aria-label="`Retirer l'objectif ${find(pick.key)!.name}`"
                @click="drop(pick.key)"
              >
                Retirer l'objectif
              </UButton>
            </div>
          </div>
        </template>
        <p
          v-else
          class="text-sm text-warning"
        >
          L'objectif « {{ pick.key }} » n'est plus dans le contenu chargé.
        </p>
      </article>

      <div
        v-if="active.length < KN_MAX_ACTIVE_GOALS"
        class="space-y-2"
      >
        <p class="text-sm font-medium">
          Choisir un objectif
        </p>
        <KnAddPicker
          :items="availableItems"
          placeholder="Choisir un objectif"
          class="w-full sm:w-96"
          @pick="takeGoal"
        />
      </div>

      <div
        v-if="claimed.length"
        class="space-y-2"
      >
        <h3 class="font-medium">
          Récompenses récupérées
        </h3>
        <ul class="divide-y divide-default rounded-md border border-default">
          <li
            v-for="pick in claimed"
            :key="pick.key"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm"
          >
            <span class="flex-1">
              <template v-if="find(pick.key)">
                <span class="font-medium">{{ find(pick.key)!.name }}.</span> {{ find(pick.key)!.reward }}
              </template>
              <template v-else>
                {{ pick.key }}
              </template>
            </span>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              :disabled="active.length >= KN_MAX_ACTIVE_GOALS"
              :aria-label="`Annuler la récupération : ${find(pick.key)?.name ?? pick.key}`"
              @click="unclaim(pick.key)"
            >
              Annuler
            </UButton>
          </li>
        </ul>
      </div>
    </div>
  </KnCard>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knDrawAmulet } from '~~/shared/ker-nethalas/amulets'
import { knClaimGoalReward, knUnclaimGoalReward } from '~~/shared/ker-nethalas/goalRewards'
import {
  KN_GOAL_BOUNDS,
  KN_MAX_ACTIVE_GOALS,
  knDropGoal,
  knGoalReached,
  knSetGoalProgress,
  knTakeGoal,
  type KnGoalPick,
  type KnPersonalGoal,
} from '~~/shared/ker-nethalas/goals'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'

const props = defineProps<{
  goals: KnPersonalGoal[] | null
  masteries: KnMastery[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const toast = useToast()

const find = (key: string) => props.goals?.find(goal => goal.key === key)

const active = computed(() => character.value.goalPicks.filter(pick => !pick.claimed))
const claimed = computed(() => character.value.goalPicks.filter(pick => pick.claimed))

const opened = ref<string[]>([])
const isOpen = (key: string) => opened.value.includes(key)
const toggle = (key: string) => {
  opened.value = isOpen(key) ? opened.value.filter(entry => entry !== key) : [...opened.value, key]
}

const reached = (pick: KnGoalPick) => {
  const goal = find(pick.key)
  return goal ? knGoalReached(goal, pick) : false
}

const availableItems = computed<SelectItem[]>(() =>
  (props.goals ?? [])
    .filter(goal => !character.value.goalPicks.some(pick => pick.key === goal.key))
    .map(goal => ({ label: goal.recommended ? `${goal.name} (recommandé en premier)` : goal.name, value: goal.key })),
)

const setProgress = (key: string, progress: number) => {
  character.value.goalPicks = knSetGoalProgress(character.value.goalPicks, key, progress)
}

const drop = (key: string) => {
  character.value.goalPicks = knDropGoal(character.value.goalPicks, key)
}

const unclaim = (key: string) => {
  Object.assign(character.value, knUnclaimGoalReward(character.value, key))
}

function claim(key: string) {
  const goal = find(key)
  if (!goal) return
  const c = character.value
  const result = knClaimGoalReward(c, goal)
  if ('error' in result) return
  Object.assign(c, result.patch)

  const lines = [...result.lines]
  if (result.amulet) {
    const drawn = props.masteries ? knDrawAmulet(c.amulets, c.masteryPicks, props.masteries.map(mastery => mastery.key)) : null
    if (drawn) {
      c.amulets = drawn.amulets
      lines.push(`amulette : ${props.masteries?.find(mastery => mastery.key === drawn.key)?.name ?? drawn.key}`)
    } else {
      lines.push('amulette (Maîtrises non chargées : tirez-la dans la section Maîtrises)')
    }
  }
  toast.add({ title: 'Récompense récupérée', description: lines.join(', ') || goal.reward, color: 'success' })
}

function takeGoal(key: string | number) {
  if (typeof key === 'string' && find(key)) character.value.goalPicks = knTakeGoal(character.value.goalPicks, key)
}
</script>
