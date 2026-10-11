<template>
  <div
    v-if="groups.length"
    class="space-y-2"
  >
    <div
      v-for="group in groups"
      :key="group.id"
      class="space-y-1 rounded-md bg-elevated p-2"
    >
      <UButton
        v-if="active && group.check"
        size="xs"
        variant="soft"
        icon="i-heroicons:cube"
        @click="emit('check', group.check)"
      >
        Test : {{ $t(`ker_nethalas.${isResistance(group.check) ? 'resistances' : 'skills'}.${group.check}`) }}
      </UButton>

      <ul class="space-y-1 text-sm">
        <li
          v-for="item in group.outcomes"
          :key="item.index"
          class="flex flex-wrap items-center gap-2"
        >
          <UButton
            v-if="active && !taken.includes(item.index)"
            size="xs"
            :variant="item.outcome.when === 'failure' ? 'outline' : 'soft'"
            :color="item.outcome.when === 'failure' ? 'error' : 'primary'"
            :disabled="!knOutcomeAvailable(outcomes, taken, item.index)"
            @click="emit('take', item.index)"
          >
            {{ title(item.outcome) }}
          </UButton>
          <span
            v-else
            class="font-medium"
          >{{ title(item.outcome) }}</span>
          <span class="text-muted">{{ effectsText(item.outcome.effects) }}</span>
          <span
            v-if="taken.includes(item.index)"
            class="text-xs text-success"
          >Appliqué</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { KN_RESISTANCE_KEYS } from '~~/shared/ker-nethalas/skills'
import { knOutcomeAvailable, knOutcomeGroup, type KnCheckKey, type KnOutcome, type KnRollTableEntry } from '~~/shared/ker-nethalas/tables'

const props = defineProps<{
  entry?: KnRollTableEntry
  taken: readonly number[]
  active?: boolean
}>()

const emit = defineEmits<{
  check: [key: KnCheckKey]
  take: [index: number]
}>()

const { effectsText } = useKnEffectText()

const isResistance = (key: KnCheckKey) => (KN_RESISTANCE_KEYS as readonly string[]).includes(key)

const outcomes = computed<readonly KnOutcome[]>(() => props.entry?.outcomes ?? [])

const TITLES = { success: 'Test réussi', failure: 'Test raté', choice: 'Choisir', always: 'Appliquer' } as const

const title = (outcome: KnOutcome) => outcome.label ?? TITLES[outcome.when]

const groups = computed(() => {
  const ids = [...new Set([
    ...(props.entry?.checks ?? []).map(check => check.group ?? 0),
    ...outcomes.value.map(knOutcomeGroup),
  ])].sort()
  return ids.map(id => ({
    id,
    check: props.entry?.checks?.find(check => (check.group ?? 0) === id)?.skill,
    outcomes: outcomes.value
      .map((outcome, index) => ({ outcome, index }))
      .filter(item => knOutcomeGroup(item.outcome) === id),
  }))
})
</script>
