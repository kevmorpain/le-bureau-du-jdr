<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="mb-2 text-3xl font-black text-(--ui-text)">
        {{ draft.name.trim() || 'Sans nom' }}
      </h1>
      <p
        v-if="pickedNames.length"
        class="text-sm font-medium text-amber-400"
      >
        {{ pickedNames.join(' · ') }}
      </p>
      <p
        v-if="draft.appearance.trim()"
        class="mx-auto mt-2 max-w-xl whitespace-pre-line text-sm text-muted"
      >
        {{ draft.appearance }}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <div
        v-for="vital in KN_CREATION_VITAL_KEYS"
        :key="vital"
        class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3 text-center"
      >
        <div class="font-mono text-2xl font-black text-(--ui-text)">
          {{ draft.vitals[vital] ?? '—' }}
        </div>
        <div class="mt-1 text-xs uppercase tracking-wider text-muted">
          {{ $t(`ker_nethalas.vitals.${vital}`) }}
        </div>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <section class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
        <h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
          Compétences
        </h2>
        <ul class="divide-y divide-(--ui-border) text-sm">
          <li
            v-for="key in KN_SKILL_KEYS"
            :key
            class="flex items-center justify-between gap-4 py-1.5"
          >
            <span :class="draft.allotments[key] ? '' : 'text-muted'">{{ $t(`ker_nethalas.skills.${key}`) }}</span>
            <span
              class="font-mono tabular-nums"
              :class="draft.allotments[key] ? 'font-bold text-success' : 'text-muted'"
            >
              {{ skills[key].score }}
            </span>
          </li>
        </ul>
      </section>

      <div class="space-y-3">
        <section class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
            Résistances
          </h2>
          <ul class="divide-y divide-(--ui-border) text-sm">
            <li
              v-for="key in KN_RESISTANCE_KEYS"
              :key
              class="flex items-center justify-between gap-4 py-1.5"
            >
              <span>{{ $t(`ker_nethalas.resistances.${key}`) }}</span>
              <span
                class="font-mono tabular-nums"
                :class="resistances[key] > 20 ? 'font-bold text-success' : ''"
              >
                {{ resistances[key] }}
              </span>
            </li>
          </ul>
        </section>

        <section class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
            Maîtrises
          </h2>
          <ul
            v-if="picked.length"
            class="divide-y divide-(--ui-border) text-sm"
          >
            <li
              v-for="mastery in picked"
              :key="mastery.key"
              class="space-y-0.5 py-1.5"
            >
              <p class="font-semibold">
                {{ mastery.name }}
              </p>
              <p class="text-xs text-muted">
                {{ mastery.feature.name }} · palier 1 : {{ mastery.abilities[0]!.name }}
              </p>
            </li>
          </ul>
          <p
            v-else
            class="text-sm text-muted"
          >
            {{ masteries ? 'Aucune choisie' : 'Contenu non chargé : à choisir sur la fiche' }}
          </p>
        </section>

        <section class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
            Équipement
          </h2>
          <p
            v-if="!draft.kitEnabled"
            class="text-sm text-muted"
          >
            Première partie : l'équipement vient du Domaine d'introduction.
          </p>
          <ul
            v-else
            class="divide-y divide-(--ui-border) text-sm"
          >
            <li
              v-if="draft.kit.weapon.trim()"
              class="py-1.5"
            >
              {{ draft.kit.weapon }}
            </li>
            <li
              v-if="draft.kit.armor.trim()"
              class="py-1.5"
            >
              Armure : {{ draft.kit.armor }}
            </li>
            <li class="py-1.5">
              1 Torche
            </li>
            <li class="py-1.5">
              {{ draft.kit.cookingIngredients ?? '—' }} Denrées
            </li>
            <li class="py-1.5">
              {{ draft.kit.craftingSupplies ?? '—' }} Fournitures d'Artisanat
            </li>
            <li class="py-1.5">
              {{ draft.kit.coins ?? '—' }} Pièces
            </li>
          </ul>
        </section>
      </div>
    </div>

    <section
      v-if="training"
      class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3"
    >
      <h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
        Entraînement
      </h2>
      <p class="whitespace-pre-line text-sm">
        {{ training }}
      </p>
    </section>

    <section
      v-if="draft.personalGoals.trim()"
      class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3"
    >
      <h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
        Objectifs personnels
      </h2>
      <p class="whitespace-pre-line text-sm">
        {{ draft.personalGoals }}
      </p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { knTrainingText, type KnCreationDraft } from '~/composables/useKnCreation'
import { defaultKnResistances } from '~~/shared/ker-nethalas/character'
import { KN_CREATION_VITAL_KEYS, knCreationResistances, knCreationSkills } from '~~/shared/ker-nethalas/creation'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS } from '~~/shared/ker-nethalas/skills'

const props = defineProps<{
  draft: KnCreationDraft
  masteries: KnMastery[] | null
}>()

const skills = computed(() => knCreationSkills(props.draft.allotments))
const resistances = computed(() => props.draft.resistanceBoost ? knCreationResistances(props.draft.resistanceBoost) : defaultKnResistances())
const training = computed(() => knTrainingText(props.draft, props.masteries))
const picked = computed(() => (props.masteries ?? []).filter(mastery => props.draft.masteries.includes(mastery.key)))
const pickedNames = computed(() => picked.value.map(mastery => mastery.name))
</script>
