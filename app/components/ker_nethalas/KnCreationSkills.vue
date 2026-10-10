<template>
  <div class="max-w-3xl space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Compétences
      </h2>
      <p class="text-sm text-muted">
        Chaque compétence part de son score imprimé sur la fiche. Répartissez ensuite dix enveloppes, une par compétence :
        +60 et +40 à deux compétences d'arme différentes, +30 à trois, +20 à deux, +10 à trois.
      </p>
    </div>

    <ul class="flex flex-wrap gap-2">
      <li
        v-for="value in KN_ALLOTMENT_VALUES"
        :key="value"
      >
        <UBadge
          :color="count(value) === KN_ALLOTMENT_COUNTS[value] ? 'success' : count(value) > KN_ALLOTMENT_COUNTS[value] ? 'error' : 'neutral'"
          variant="subtle"
          size="md"
          :label="`+${value} : ${count(value)}/${KN_ALLOTMENT_COUNTS[value]}`"
        />
      </li>
    </ul>

    <ul class="space-y-2">
      <li
        v-for="key in KN_SKILL_KEYS"
        :key
        class="flex items-center gap-3"
      >
        <span class="min-w-0 flex-1">{{ $t(`ker_nethalas.skills.${key}`) }}</span>
        <span class="w-16 text-right text-sm text-muted tabular-nums">{{ KN_SKILL_STARTING_SCORES[key] }}</span>
        <USelect
          :model-value="draft.allotments[key] ?? NONE"
          :items="allotmentItems"
          :aria-label="`${$t(`ker_nethalas.skills.${key}`)} : enveloppe`"
          class="w-28"
          @update:model-value="value => setAllotment(key, value)"
        />
        <span
          class="w-12 text-right font-semibold tabular-nums"
          :class="draft.allotments[key] ? 'text-success' : ''"
        >
          {{ KN_SKILL_STARTING_SCORES[key] + (draft.allotments[key] ?? 0) }}
        </span>
      </li>
    </ul>

    <ul
      v-if="issues.length"
      class="space-y-1 text-sm text-warning"
    >
      <li
        v-for="issue in issues"
        :key="issue"
      >
        {{ issue }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCreationDraft } from '~/composables/useKnCreation'
import {
  KN_ALLOTMENT_COUNTS,
  KN_ALLOTMENT_VALUES,
  knAllotmentIssues,
  type KnAllotment,
} from '~~/shared/ker-nethalas/creation'
import { KN_SKILL_KEYS, KN_SKILL_STARTING_SCORES, type KnSkillKey } from '~~/shared/ker-nethalas/skills'

const draft = defineModel<KnCreationDraft>('draft', { required: true })

const NONE = 'none'

const allotmentItems: SelectItem[] = [
  { label: '—', value: NONE },
  ...KN_ALLOTMENT_VALUES.map(value => ({ label: `+${value}`, value })),
]

const issues = computed(() => knAllotmentIssues(draft.value.allotments))

const count = (value: KnAllotment) => Object.values(draft.value.allotments).filter(v => v === value).length

function setAllotment(key: KnSkillKey, value: unknown) {
  const allotment = KN_ALLOTMENT_VALUES.find(candidate => candidate === value)
  const { [key]: _previous, ...others } = draft.value.allotments
  draft.value.allotments = allotment === undefined ? others : { ...others, [key]: allotment }
}
</script>
