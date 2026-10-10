<template>
  <div class="max-w-3xl space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Compétences
      </h2>
      <p class="text-sm text-muted">
        Chaque compétence part de son score imprimé sur la fiche. Répartissez ensuite dix enveloppes, une par compétence :
        +60 et +40 à deux compétences d'arme différentes, +30 à trois compétences, +20 à deux, +10 à trois.
      </p>
    </div>

    <ul class="flex flex-wrap gap-2">
      <li
        v-for="value in KN_ALLOTMENT_VALUES"
        :key="value"
      >
        <UBadge
          :color="count(value) === KN_ALLOTMENT_COUNTS[value] ? 'success' : 'neutral'"
          variant="subtle"
          size="md"
          :label="`+${value} : ${count(value)}/${KN_ALLOTMENT_COUNTS[value]}`"
        />
      </li>
    </ul>

    <ul class="space-y-3">
      <li
        v-for="key in KN_SKILL_KEYS"
        :key
        class="flex flex-wrap items-center gap-x-3 gap-y-2"
      >
        <span class="min-w-48 flex-1">{{ $t(`ker_nethalas.skills.${key}`) }}</span>
        <span class="w-10 text-right text-sm text-muted tabular-nums">{{ KN_SKILL_STARTING_SCORES[key] }}</span>
        <div
          class="flex gap-1"
          role="group"
          :aria-label="`${$t(`ker_nethalas.skills.${key}`)} : enveloppe`"
        >
          <UButton
            v-for="value in KN_ALLOTMENT_VALUES"
            :key="value"
            size="xs"
            :variant="draft.allotments[key] === value ? 'solid' : 'outline'"
            :color="draft.allotments[key] === value ? 'primary' : 'neutral'"
            :disabled="isDisabled(key, value)"
            :aria-pressed="draft.allotments[key] === value"
            :aria-label="`${$t(`ker_nethalas.skills.${key}`)} : +${value}`"
            @click="assign(key, value)"
          >
            +{{ value }}
          </UButton>
        </div>
        <span
          class="w-10 text-right font-semibold tabular-nums"
          :class="draft.allotments[key] ? 'text-success' : ''"
        >
          {{ KN_SKILL_STARTING_SCORES[key] + (draft.allotments[key] ?? 0) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import type { KnCreationDraft } from '~/composables/useKnCreation'
import {
  KN_ALLOTMENT_COUNTS,
  KN_ALLOTMENT_VALUES,
  type KnAllotment,
} from '~~/shared/ker-nethalas/creation'
import { KN_SKILL_KEYS, KN_SKILL_STARTING_SCORES, KN_WEAPON_SKILL_KEYS, type KnSkillKey } from '~~/shared/ker-nethalas/skills'

const draft = defineModel<KnCreationDraft>('draft', { required: true })

const WEAPON_KEYS: readonly string[] = KN_WEAPON_SKILL_KEYS

const count = (value: KnAllotment) => Object.values(draft.value.allotments).filter(v => v === value).length

// +60 et +40 vont à des compétences d'arme ; une enveloppe dont tous les exemplaires sont pris n'est plus proposée,
// sauf sur la compétence qui la porte (pour la reprendre).
function isDisabled(key: KnSkillKey, value: KnAllotment) {
  if (draft.value.allotments[key] === value) return false
  if ((value === 60 || value === 40) && !WEAPON_KEYS.includes(key)) return true
  return count(value) >= KN_ALLOTMENT_COUNTS[value]
}

function assign(key: KnSkillKey, value: KnAllotment) {
  const { [key]: current, ...others } = draft.value.allotments
  draft.value.allotments = current === value ? others : { ...others, [key]: value }
}
</script>
