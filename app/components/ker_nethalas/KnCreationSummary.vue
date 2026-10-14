<template>
  <div class="space-y-4 text-sm">
    <p class="font-semibold">
      {{ draft.name.trim() || 'Sans nom' }}
    </p>

    <div>
      <p class="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
        Jauges
      </p>
      <ul class="space-y-0.5">
        <li
          v-for="vital in KN_CREATION_VITAL_KEYS"
          :key="vital"
          class="flex justify-between gap-4"
        >
          <span>{{ $t(`ker_nethalas.vitals.${vital}`) }}</span>
          <span class="tabular-nums">{{ draft.vitals[vital] ?? '—' }}</span>
        </li>
      </ul>
    </div>

    <div>
      <p class="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
        Compétences
      </p>
      <ul class="space-y-0.5">
        <li
          v-for="key in assignedSkills"
          :key
          class="flex justify-between gap-4"
        >
          <span>{{ $t(`ker_nethalas.skills.${key}`) }}</span>
          <span class="font-semibold tabular-nums text-success">{{ skills[key].score }}</span>
        </li>
        <li
          v-if="!assignedSkills.length"
          class="text-muted"
        >
          Aucune enveloppe choisie
        </li>
      </ul>
    </div>

    <div>
      <p class="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
        Résistances
      </p>
      <ul class="space-y-0.5">
        <li
          v-for="key in KN_RESISTANCE_KEYS"
          :key
          class="flex justify-between gap-4"
        >
          <span>{{ $t(`ker_nethalas.resistances.${key}`) }}</span>
          <span class="tabular-nums">{{ resistances[key] }}</span>
        </li>
      </ul>
    </div>

    <div>
      <p class="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
        Maîtrises
      </p>
      <ul
        v-if="draft.masteries.length"
        class="space-y-0.5"
      >
        <li
          v-for="key in draft.masteries"
          :key
        >
          {{ masteries?.find(mastery => mastery.key === key)?.name ?? key }}
        </li>
      </ul>
      <p
        v-else
        class="text-muted"
      >
        {{ masteries ? 'Aucune choisie' : 'Contenu non chargé : à choisir sur la fiche' }}
      </p>
    </div>

    <div>
      <p class="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
        Objectifs
      </p>
      <ul
        v-if="draft.goals.length"
        class="space-y-0.5"
      >
        <li
          v-for="key in draft.goals"
          :key
        >
          {{ goals?.find(goal => goal.key === key)?.name ?? key }}
        </li>
      </ul>
      <p
        v-else
        class="text-muted"
      >
        {{ goals ? 'Aucun choisi' : 'Contenu non chargé : à choisir sur la fiche' }}
      </p>
    </div>

    <div>
      <p class="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
        Équipement
      </p>
      <p
        v-if="!draft.kitEnabled"
        class="text-muted"
      >
        {{ draft.intro ? "Première partie : l'équipement vient du Domaine d'introduction, où la partie commence." : "Départ sans équipement, dans un Domaine ordinaire." }}
      </p>
      <ul
        v-else
        class="space-y-0.5"
      >
        <li v-if="draft.kit.weapon.trim()">
          {{ draft.kit.weapon }}
        </li>
        <li v-if="draft.kit.armor.trim()">
          Armure : {{ draft.kit.armor }}
        </li>
        <li>1 Torche</li>
        <li>{{ draft.kit.cookingIngredients ?? '—' }} Denrées</li>
        <li>{{ draft.kit.craftingSupplies ?? '—' }} Fournitures d'Artisanat</li>
        <li>{{ draft.kit.coins ?? '—' }} Pièces</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { KnCreationDraft } from '~/composables/useKnCreation'
import { defaultKnResistances } from '~~/shared/ker-nethalas/character'
import type { KnPersonalGoal } from '~~/shared/ker-nethalas/goals'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { KN_CREATION_VITAL_KEYS, knCreationResistances, knCreationSkills } from '~~/shared/ker-nethalas/creation'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS } from '~~/shared/ker-nethalas/skills'

const props = defineProps<{
  draft: KnCreationDraft
  masteries?: KnMastery[] | null
  goals?: KnPersonalGoal[] | null
}>()

const skills = computed(() => knCreationSkills(props.draft.allotments))
const resistances = computed(() => props.draft.resistanceBoost ? knCreationResistances(props.draft.resistanceBoost) : defaultKnResistances())
const assignedSkills = computed(() => KN_SKILL_KEYS.filter(key => props.draft.allotments[key]))
</script>
