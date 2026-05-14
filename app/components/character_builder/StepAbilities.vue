<template>
  <div>
    <!-- En-tête -->
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">💪</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Caractéristiques</h2>
        <p class="text-sm text-muted mt-0.5">Définissez vos 6 caractéristiques. Les bonus raciaux s'ajoutent automatiquement.</p>
      </div>
    </div>

    <!-- Onglets méthode -->
    <div class="flex gap-2 mb-5">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        type="button"
        class="px-4 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer"
        :class="state.abilityMethod === tab.id
          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
          : 'border-(--ui-border) bg-transparent text-muted hover:border-amber-500/40'"
        @click="switchMethod(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Pool de scores (standard + roll) -->
    <template v-if="state.abilityMethod !== 'pointbuy'">
      <div class="text-xs font-bold uppercase tracking-wider text-muted mb-3">
        <template v-if="state.abilityMethod === 'roll' && !state.rolledSets">
          Cliquez « Lancer » pour générer vos scores
        </template>
        <template v-else>
          Cliquez un score, puis une caractéristique pour l'assigner
        </template>
      </div>

      <!-- Bouton lancer + total -->
      <div v-if="state.abilityMethod === 'roll'" class="flex items-center gap-3 mb-4">
        <button
          type="button"
          class="px-4 py-2 rounded-lg border border-amber-500 bg-amber-500/15 text-amber-400 text-sm font-bold cursor-pointer hover:bg-amber-500/25 transition-colors"
          @click="rollAll"
        >
          🎲 Lancer les dés
        </button>
        <span v-if="state.rolledSets" class="text-xs text-muted">
          Total : {{ rolledTotal }}
        </span>
      </div>

      <!-- Scores disponibles -->
      <div v-if="scores.length" class="flex gap-2 flex-wrap mb-5">
        <button
          v-for="(sc, idx) in scores"
          :key="idx"
          type="button"
          class="w-13 h-13 rounded-xl border-2 text-xl font-black font-mono transition-all relative"
          :class="isUsed(idx)
            ? 'border-muted bg-(--ui-bg-elevated) text-muted/40 cursor-default opacity-45'
            : selected === idx
              ? 'border-amber-500 bg-amber-500/15 text-amber-400 cursor-pointer'
              : 'border-(--ui-border) bg-(--ui-bg) text-(--ui-text) cursor-pointer hover:border-amber-500/50'"
          @click="!isUsed(idx) && (selected = selected === idx ? null : idx)"
        >
          {{ sc }}
          <span
            v-if="state.abilityMethod === 'roll' && state.rolledSets"
            class="absolute bottom-0.5 left-0 right-0 text-center text-muted/60"
            style="font-size: 8px"
          >
            {{ state.rolledSets[idx].dice.slice(0, 3).join('+') }}
          </span>
        </button>
      </div>
    </template>

    <!-- Budget point buy -->
    <template v-if="state.abilityMethod === 'pointbuy'">
      <div class="flex items-center gap-2 mb-5">
        <span class="text-xs text-muted">Points restants :</span>
        <span
          class="text-xl font-black font-mono"
          :class="pbRemaining >= 0 ? 'text-amber-400' : 'text-red-400'"
        >{{ pbRemaining }}</span>
        <span class="text-xs text-muted">/ {{ POINT_BUY_BUDGET }}</span>
      </div>
    </template>

    <!-- Grille 3×2 des caractéristiques -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div
        v-for="ab in ABILITIES"
        :key="ab"
        class="rounded-xl border p-3 transition-all"
        :class="isTarget
          ? baseScore(ab) != null
            ? 'border-amber-500/40 bg-amber-500/6 cursor-pointer hover:bg-amber-500/12'
            : 'border-amber-500/60 bg-amber-500/12 cursor-pointer'
          : 'border-(--ui-border) bg-(--ui-bg-elevated)'"
        @click="isTarget && clickAbility(ab)"
      >
        <div class="flex justify-between items-baseline mb-1">
          <span class="text-xs font-bold uppercase tracking-wider text-muted">{{ ABILITY_SHORT[ab] }}</span>
          <span v-if="(raceBonuses[ab] ?? 0) !== 0 && baseScore(ab) != null" class="text-xs text-amber-400">+{{ raceBonuses[ab] }} racial</span>
        </div>

        <div class="flex items-baseline gap-1.5 mb-0.5">
          <span
            class="text-3xl font-black font-mono leading-none"
            :class="finalScore(ab) != null ? 'text-(--ui-text)' : 'text-muted/40'"
          >
            {{ finalScore(ab) != null ? finalScore(ab) : (isTarget ? '?' : '—') }}
          </span>
          <span v-if="baseScore(ab) != null && (raceBonuses[ab] ?? 0) !== 0" class="text-xs text-muted">
            {{ baseScore(ab) }}+{{ raceBonuses[ab] }}
          </span>
        </div>

        <div v-if="finalScore(ab) != null" class="text-xs text-muted mb-1">
          mod {{ formatMod(abilityMod(finalScore(ab)!)) }}
        </div>

        <div class="text-xs text-muted/60">{{ ABILITY_LABELS[ab] }}</div>

        <!-- Contrôles point buy -->
        <div v-if="state.abilityMethod === 'pointbuy'" class="flex items-center gap-2 mt-2">
          <button
            type="button"
            class="w-6 h-6 rounded border border-(--ui-border) text-muted text-sm leading-none cursor-pointer hover:border-amber-500/40 transition-colors"
            @click.stop="pbChange(ab, -1)"
          >−</button>
          <span class="text-xs font-mono text-amber-400 w-4 text-center">{{ state.pbScores[ab] }}</span>
          <button
            type="button"
            class="w-6 h-6 rounded border border-(--ui-border) text-muted text-sm leading-none cursor-pointer hover:border-amber-500/40 transition-colors"
            @click.stop="pbChange(ab, +1)"
          >+</button>
          <span class="text-xs text-muted/60">coût {{ POINT_BUY_COSTS[state.pbScores[ab]] ?? 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Bannière succès -->
    <div
      v-if="allDone"
      class="mt-4 px-4 py-2 rounded-lg border text-xs font-medium"
      style="background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); color: #22c55e"
    >
      ✓ Toutes les caractéristiques assignées
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ABILITY_LABELS,
  STANDARD_ARRAY,
  POINT_BUY_BUDGET,
  POINT_BUY_COSTS,
  type AbilityKey,
} from '~/data/character-builder'

const {
  state,
  raceBonuses,
  ABILITIES,
  ABILITY_SHORT,
  abilityMod,
  formatMod,
} = useCharacterBuilder()

const TABS = [
  { id: 'standard', label: '⚖ Tableau standard' },
  { id: 'pointbuy', label: '🪙 Achat de points' },
  { id: 'roll', label: '🎲 Jet de dés' },
] as const

// Index du score sélectionné dans le pool (null = aucun)
const selected = ref<number | null>(null)

// Pool de scores selon la méthode
const scores = computed<number[]>(() => {
  if (state.value.abilityMethod === 'standard') return STANDARD_ARRAY
  if (state.value.abilityMethod === 'roll') return state.value.rolledSets?.map(r => r.total) ?? []
  return []
})

const rolledTotal = computed(() =>
  state.value.rolledSets?.reduce((s, r) => s + r.total, 0) ?? 0,
)

// Index des scores déjà utilisés
const assignedIdxs = computed(() => new Set(Object.values(state.value.abilityAssigns)))

function isUsed(idx: number) {
  return assignedIdxs.value.has(idx)
}

const isTarget = computed(() => selected.value !== null && state.value.abilityMethod !== 'pointbuy')

// Score de base avant racial (null si non assigné)
function baseScore(ab: AbilityKey): number | null {
  if (state.value.abilityMethod === 'pointbuy') return state.value.pbScores[ab] ?? null
  const idx = state.value.abilityAssigns[ab]
  if (idx === undefined || !scores.value.length) return null
  return scores.value[idx] ?? null
}

function finalScore(ab: AbilityKey): number | null {
  const base = baseScore(ab)
  if (base == null) return null
  return base + (raceBonuses.value[ab] ?? 0)
}

const allDone = computed(() => ABILITIES.every(ab => finalScore(ab) !== null))

// Synchronise state.abilities depuis la méthode active
function syncAbilities() {
  const abilities: Partial<Record<AbilityKey, number | null>> = {}
  for (const ab of ABILITIES) {
    if (state.value.abilityMethod === 'pointbuy') {
      abilities[ab] = state.value.pbScores[ab]
    }
    else {
      const idx = state.value.abilityAssigns[ab]
      abilities[ab] = idx !== undefined && scores.value.length ? (scores.value[idx] ?? null) : null
    }
  }
  state.value.abilities = abilities
}

function switchMethod(m: 'standard' | 'pointbuy' | 'roll') {
  state.value.abilityMethod = m
  state.value.abilityAssigns = {}
  selected.value = null
  syncAbilities()
}

function clickAbility(ab: AbilityKey) {
  if (selected.value === null) {
    // Désassigner
    const newAssigns = { ...state.value.abilityAssigns }
    delete newAssigns[ab]
    state.value.abilityAssigns = newAssigns
  }
  else {
    const newAssigns = { ...state.value.abilityAssigns }
    // Libérer l'ancienne carac. qui avait ce score
    for (const k of ABILITIES) {
      if (newAssigns[k] === selected.value) delete newAssigns[k]
    }
    newAssigns[ab] = selected.value
    state.value.abilityAssigns = newAssigns
    selected.value = null
  }
  syncAbilities()
}

function pbChange(ab: AbilityKey, delta: number) {
  const cur = state.value.pbScores[ab] ?? 10
  const next = cur + delta
  if (next < 8 || next > 15) return
  const spent = Object.entries(state.value.pbScores).reduce((s, [k, v]) => {
    return s + (POINT_BUY_COSTS[v] ?? 0) - (k === ab ? (POINT_BUY_COSTS[cur] ?? 0) : 0)
  }, 0)
  if (delta > 0 && spent + (POINT_BUY_COSTS[next] ?? 0) > POINT_BUY_BUDGET) return
  state.value.pbScores = { ...state.value.pbScores, [ab]: next }
  syncAbilities()
}

const pbRemaining = computed(() => {
  const spent = Object.values(state.value.pbScores).reduce((s, v) => s + (POINT_BUY_COSTS[v] ?? 0), 0)
  return POINT_BUY_BUDGET - spent
})

function rollAll() {
  const sets = Array.from({ length: 6 }, () => {
    const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a)
    return { dice, total: dice.slice(0, 3).reduce((a, b) => a + b, 0) }
  })
  state.value.rolledSets = sets
  state.value.abilityAssigns = {}
  selected.value = null
  syncAbilities()
}
</script>
