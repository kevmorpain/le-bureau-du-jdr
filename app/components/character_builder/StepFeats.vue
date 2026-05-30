<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">Don bonus</h2>
      <p class="text-sm text-muted">
        Optionnel — votre MJ peut accorder un don supplémentaire au début de l'aventure,
        en plus des dons obtenus aux paliers d'amélioration de caractéristique.
        Si ce n'est pas votre cas, cliquez simplement sur Suivant.
      </p>
    </header>

    <section class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4 space-y-4">
      <header class="flex items-center justify-between gap-3">
        <h3 class="text-xs font-bold uppercase tracking-widest text-muted">
          Sélection
        </h3>
        <UBadge
          v-if="state.bonusFeatureId != null"
          color="warning"
          variant="subtle"
          size="md"
        >
          {{ selectedFeat?.name ?? '—' }}
        </UBadge>
      </header>

      <div v-if="pending" class="text-sm text-muted text-center py-6">
        Chargement…
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          v-for="feat in feats"
          :key="feat.id"
          type="button"
          class="text-left px-4 py-3 rounded-xl border transition-all"
          :class="state.bonusFeatureId === feat.id
            ? 'border-amber-500/60 bg-amber-500/10'
            : 'border-(--ui-border) bg-(--ui-bg) hover:border-(--ui-border-strong)'"
          @click="toggle(feat.id)"
        >
          <div class="font-semibold text-sm" :class="state.bonusFeatureId === feat.id ? 'text-amber-400' : 'text-(--ui-text)'">
            {{ feat.name }}
          </div>
          <div class="text-xs text-muted mt-0.5 leading-snug">{{ feat.description }}</div>
        </button>
      </div>

      <!-- Choix de caractéristique (si le don en demande un) -->
      <div
        v-if="state.bonusFeatureId != null && featNeedsAbility(state.bonusFeatureId)"
        class="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 space-y-2"
      >
        <p class="text-sm font-semibold text-(--ui-text)">
          Caractéristique à augmenter (+1)
        </p>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <button
            v-for="ab in allowedAbilityOptions"
            :key="ab.value"
            type="button"
            class="py-2 rounded-lg border text-sm font-semibold transition-colors"
            :class="abilityFor(state.bonusFeatureId) === ab.value
              ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
              : 'border-(--ui-border) text-muted hover:border-(--ui-border-strong)'"
            @click="setAbility(state.bonusFeatureId, ab.value)"
          >
            {{ ab.label }}
          </button>
        </div>
      </div>

      <button
        v-if="state.bonusFeatureId != null"
        type="button"
        class="text-sm text-muted underline hover:text-(--ui-text)"
        @click="state.bonusFeatureId = null"
      >
        Retirer le don bonus
      </button>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { AbilityKey } from '~/data/character-builder'

const { state, featNeedsAbility } = useCharacterBuilder()
const { feats, pending, getById } = useFeats()

const ABILITY_OPTIONS: { label: string, value: AbilityKey }[] = [
  { label: 'FOR', value: 'str' },
  { label: 'DEX', value: 'dex' },
  { label: 'CON', value: 'con' },
  { label: 'INT', value: 'int' },
  { label: 'SAG', value: 'wis' },
  { label: 'CHA', value: 'cha' },
]

const selectedFeat = computed(() => getById(state.value.bonusFeatureId))

const allowedAbilityOptions = computed(() => {
  const allowed = featAllowedAbilities(selectedFeat.value?.effects)
  return ABILITY_OPTIONS.filter(o => allowed.includes(o.value))
})

const abilityFor = (featureId: number) => state.value.featChoices[featureId]?.ability ?? null

function setAbility(featureId: number, ability: AbilityKey) {
  state.value.featChoices = {
    ...state.value.featChoices,
    [featureId]: { ability },
  }
}

function toggle(featId: number) {
  state.value.bonusFeatureId = state.value.bonusFeatureId === featId ? null : featId
}
</script>
