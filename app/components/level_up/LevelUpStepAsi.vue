<template>
  <div>
    <LevelBanner
      :class-data="pickedClass"
      :from-level="state.fromLevel"
      :to-level="state.toLevel"
      :is-multiclass="state.isMulticlass"
      subtitle="Amélioration de caractéristique ou don"
    />

    <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">Carac. / Don</h2>
    <p class="text-sm text-muted mb-5">
      Augmentez vos caractéristiques (maximum +2, plafond 20) ou prenez un don.
    </p>

    <!-- Toggle -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="opt in [['asi','✦ Caractéristiques'], ['feat','📜 Don']]"
        :key="opt[0]"
        class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border"
        :class="state.asiChoice === opt[0]
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
          : 'border-(--ui-border) text-muted hover:border-(--ui-border-strong)'"
        @click="state.asiChoice = opt[0] as any"
      >
        {{ opt[1] }}
      </button>
    </div>

    <!-- ASI grid -->
    <div v-if="state.asiChoice === 'asi'">
      <div class="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-sm">
        <span class="text-muted flex-1">Distribuez <strong class="text-amber-400">2 points</strong> entre vos caractéristiques.</span>
        <span
          class="font-mono font-extrabold text-xl"
          :class="remaining === 0 ? 'text-green-400' : 'text-amber-400'"
        >{{ remaining }}/2</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          v-for="ab in ABILITIES"
          :key="ab"
          class="rounded-xl border p-3 transition-all"
          :class="(state.asiBonuses[ab] ?? 0) > 0 ? 'border-amber-500/40 bg-amber-500/6' : 'border-(--ui-border) bg-(--ui-bg-elevated)'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-bold uppercase tracking-widest text-muted">{{ ABILITY_SHORT[ab] }}</span>
            <span class="text-[10px] text-muted">{{ ABILITY_LABELS[ab] }}</span>
          </div>

          <div class="flex items-baseline gap-2 mb-2">
            <span class="font-mono text-xs text-muted">{{ baseScore(ab) }}</span>
            <span class="text-muted text-sm">→</span>
            <span
              class="font-mono text-2xl font-black leading-none"
              :class="(state.asiBonuses[ab] ?? 0) > 0 ? 'text-amber-400' : 'text-(--ui-text)'"
            >{{ baseScore(ab) + (state.asiBonuses[ab] ?? 0) }}</span>
            <span v-if="(state.asiBonuses[ab] ?? 0) > 0" class="text-xs text-amber-400 font-mono">+{{ state.asiBonuses[ab] }}</span>
          </div>

          <div class="text-xs text-muted mb-3">
            mod {{ formatMod(abilityMod(baseScore(ab) + (state.asiBonuses[ab] ?? 0))) }}
          </div>

          <div class="flex gap-2">
            <button
              class="flex-1 py-1 rounded-lg border text-sm font-bold transition-all"
              :class="(state.asiBonuses[ab] ?? 0) > 0
                ? 'border-(--ui-border) text-muted hover:bg-(--ui-bg)'
                : 'border-(--ui-border) text-muted/30 cursor-not-allowed'"
              :disabled="(state.asiBonuses[ab] ?? 0) === 0"
              @click="adjust(ab, -1)"
            >−</button>
            <button
              class="flex-1 py-1 rounded-lg border text-sm font-bold transition-all"
              :class="canIncrease(ab)
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'border-(--ui-border) text-muted/30 cursor-not-allowed'"
              :disabled="!canIncrease(ab)"
              @click="adjust(ab, +1)"
            >+</button>
          </div>
          <div v-if="baseScore(ab) + (state.asiBonuses[ab] ?? 0) >= 20" class="text-[10px] text-red-400 text-center mt-1">max 20</div>
        </div>
      </div>
    </div>

    <!-- Feat grid -->
    <div v-else-if="state.asiChoice === 'feat'">
      <p class="text-xs text-muted mb-4">
        Sélection de base — consultez votre MJ pour la liste complète.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          v-for="feat in LU_FEATS"
          :key="feat.id"
          class="text-left px-4 py-3 rounded-xl border transition-all"
          :class="state.featId === feat.id
            ? 'border-amber-500/60 bg-amber-500/10'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-strong)'"
          @click="state.featId = feat.id"
        >
          <div class="font-semibold text-sm" :class="state.featId === feat.id ? 'text-amber-400' : 'text-(--ui-text)'">
            {{ feat.name }}
          </div>
          <div class="text-xs text-muted mt-0.5 leading-snug">{{ feat.desc }}</div>
        </button>
      </div>
    </div>

    <!-- Prompt if nothing selected yet -->
    <div
      v-else
      class="px-4 py-6 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-sm text-muted text-center"
    >
      Choisissez entre améliorer vos caractéristiques ou prendre un don.
    </div>
  </div>
</template>

<script lang="ts" setup>
import { LU_FEATS, type AbilityBonuses } from '~/composables/useLevelUp'
import type { AbilityKey } from '~/data/character-builder'

const {
  state,
  pickedClass,
  finalAbilities,
  ABILITIES,
  ABILITY_SHORT,
  ABILITY_LABELS,
  abilityMod,
  formatMod,
} = useLevelUp(inject('charSheet') as any)

const remaining = computed(() =>
  2 - Object.values(state.value.asiBonuses).reduce((a, b) => a + b, 0),
)

function baseScore(ab: AbilityKey): number {
  return finalAbilities.value[ab] ?? 10
}

function canIncrease(ab: AbilityKey): boolean {
  if (remaining.value === 0) return false
  if ((state.value.asiBonuses[ab] ?? 0) >= 2) return false
  if (baseScore(ab) + (state.value.asiBonuses[ab] ?? 0) >= 20) return false
  return true
}

function adjust(ab: AbilityKey, delta: number) {
  const cur = state.value.asiBonuses[ab] ?? 0
  const next = cur + delta
  if (next < 0 || next > 2) return
  if (delta > 0 && !canIncrease(ab)) return
  state.value.asiBonuses[ab] = next
}
</script>
