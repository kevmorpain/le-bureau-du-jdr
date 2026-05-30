<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">Carac. / Don</h2>
      <p class="text-sm text-muted">
        À chaque palier d'ASI, vous pouvez augmenter vos caractéristiques
        (+2 max par palier, plafond 20) <strong>ou</strong> prendre un don.
      </p>
    </header>


    <!-- Un bloc par palier d'ASI atteint -->
    <section
      v-for="lvl in asiLevelsForCharacter"
      :key="lvl"
      class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4 space-y-4"
    >
      <header class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-widest text-muted">
          Niveau {{ lvl }}
        </h3>
        <UBadge
          v-if="state.asiChoice[lvl]"
          :color="isPalierComplete(lvl) ? 'success' : 'warning'"
          variant="subtle"
          size="md"
        >
          {{ palierSummary(lvl) }}
        </UBadge>
      </header>

      <!-- Toggle ASI / Don -->
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border"
          :class="state.asiChoice[lvl] === 'asi'
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
            : 'border-(--ui-border) text-muted hover:border-(--ui-border-strong)'"
          @click="setChoice(lvl, 'asi')"
        >
          ✦ Caractéristiques
        </button>
        <button
          type="button"
          class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border"
          :class="state.asiChoice[lvl] === 'feat'
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
            : 'border-(--ui-border) text-muted hover:border-(--ui-border-strong)'"
          @click="setChoice(lvl, 'feat')"
        >
          📜 Don
        </button>
      </div>

      <!-- Bloc ASI -->
      <div v-if="state.asiChoice[lvl] === 'asi'" class="space-y-3">
        <div class="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-(--ui-border) bg-(--ui-bg) text-sm">
          <span class="text-muted flex-1">Distribuez <strong class="text-amber-400">2 points</strong>.</span>
          <span
            class="font-mono font-extrabold text-lg"
            :class="remainingForLevel(lvl) === 0 ? 'text-green-400' : 'text-amber-400'"
          >{{ remainingForLevel(lvl) }}/2</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="ab in ABILITIES"
            :key="ab"
            class="rounded-xl border p-3 transition-all"
            :class="getBonus(lvl, ab) > 0
              ? 'border-amber-500/40 bg-amber-500/6'
              : 'border-(--ui-border) bg-(--ui-bg)'"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold uppercase tracking-widest text-muted">{{ ABILITY_SHORT[ab] }}</span>
              <span class="text-xs text-muted">{{ ABILITY_LABELS[ab] }}</span>
            </div>

            <div class="flex items-baseline gap-2 mb-2">
              <span class="font-mono text-xs text-muted">{{ baseScore(ab) }}</span>
              <span class="text-muted text-sm">→</span>
              <span
                class="font-mono text-2xl font-black leading-none"
                :class="getBonus(lvl, ab) > 0 ? 'text-amber-400' : 'text-(--ui-text)'"
              >{{ Math.min(20, baseScore(ab) + getBonus(lvl, ab)) }}</span>
              <span v-if="getBonus(lvl, ab) > 0" class="text-xs text-amber-400 font-mono">+{{ getBonus(lvl, ab) }}</span>
            </div>

            <div class="text-xs text-muted mb-3">
              mod {{ formatMod(abilityMod(Math.min(20, baseScore(ab) + getBonus(lvl, ab)))) }}
            </div>

            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 py-1 rounded-lg border text-sm font-bold transition-all"
                :class="getBonus(lvl, ab) > 0
                  ? 'border-(--ui-border) text-muted hover:bg-(--ui-bg-elevated)'
                  : 'border-(--ui-border) text-muted/30 cursor-not-allowed'"
                :disabled="getBonus(lvl, ab) === 0"
                @click="adjust(lvl, ab, -1)"
              >−</button>
              <button
                type="button"
                class="flex-1 py-1 rounded-lg border text-sm font-bold transition-all"
                :class="canIncrease(lvl, ab)
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                  : 'border-(--ui-border) text-muted/30 cursor-not-allowed'"
                :disabled="!canIncrease(lvl, ab)"
                @click="adjust(lvl, ab, +1)"
              >+</button>
            </div>
            <div v-if="finalAfterAsi(lvl, ab) >= 20" class="text-xs text-red-400 text-center mt-1">max 20</div>
          </div>
        </div>
      </div>

      <!-- Bloc Don -->
      <div v-else-if="state.asiChoice[lvl] === 'feat'" class="space-y-3">
        <p class="text-xs text-muted">
          Liste complète des dons. Effets mécaniques appliqués automatiquement quand disponibles.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            v-for="feat in feats"
            :key="feat.id"
            type="button"
            class="text-left px-4 py-3 rounded-xl border transition-all"
            :class="state.asiFeats[lvl] === feat.id
              ? 'border-amber-500/60 bg-amber-500/10'
              : 'border-(--ui-border) bg-(--ui-bg) hover:border-(--ui-border-strong)'"
            @click="state.asiFeats = { ...state.asiFeats, [lvl]: feat.id }"
          >
            <div class="font-semibold text-sm" :class="state.asiFeats[lvl] === feat.id ? 'text-amber-400' : 'text-(--ui-text)'">
              {{ feat.name }}
            </div>
            <div class="text-xs text-muted mt-0.5 leading-snug">{{ feat.description }}</div>
          </button>
        </div>

        <!-- Choix de caractéristique (si le don sélectionné en demande un) -->
        <div
          v-if="state.asiFeats[lvl] != null && featNeedsAbility(state.asiFeats[lvl])"
          class="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2"
        >
          <p class="text-sm font-semibold text-(--ui-text)">
            Caractéristique à augmenter (+1)
          </p>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <button
              v-for="ab in allowedAbilities(state.asiFeats[lvl])"
              :key="ab"
              type="button"
              class="py-2 rounded-lg border text-sm font-semibold transition-colors"
              :class="abilityFor(state.asiFeats[lvl]) === ab
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                : 'border-(--ui-border) text-muted hover:border-(--ui-border-strong)'"
              @click="setAbility(state.asiFeats[lvl]!, ab)"
            >
              {{ ABILITY_SHORT[ab] }}
            </button>
          </div>
        </div>
      </div>

      <!-- Aucun choix -->
      <div
        v-else
        class="px-4 py-4 rounded-lg border border-(--ui-border) bg-(--ui-bg) text-sm text-muted text-center"
      >
        Choisissez entre améliorer vos caractéristiques ou prendre un don.
      </div>
    </section>

    <!-- Filet de sécurité -->
    <div
      v-if="!asiLevelsForCharacter.length"
      class="px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-sm text-muted"
    >
      Aucun palier ASI à ce niveau — cliquez sur Suivant.
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ABILITIES, ABILITY_SHORT, ABILITY_LABELS, type AbilityKey } from '~/data/character-builder'

const {
  state,
  asiLevelsForCharacter,
  asiBonusByAbility,
  raceBonuses,
  abilityMod,
  formatMod,
  featNeedsAbility,
} = useCharacterBuilder()

const { feats, getById: getFeatById } = useFeats()

// Caractéristiques autorisées par le don choisi à ce palier (sous-ensemble du PHB).
const allowedAbilities = (featureId: number | undefined): AbilityKey[] =>
  featAllowedAbilities(getFeatById(featureId)?.effects) as AbilityKey[]

const abilityFor = (featureId: number) => state.value.featChoices[featureId]?.ability ?? null

function setAbility(featureId: number, ability: AbilityKey) {
  state.value.featChoices = {
    ...state.value.featChoices,
    [featureId]: { ability },
  }
}

function baseScore(ab: AbilityKey): number {
  const base = state.value.abilities[ab]
  if (base == null) return 10
  return base + (raceBonuses.value[ab] ?? 0)
}

function getBonus(lvl: number, ab: AbilityKey): number {
  return state.value.asiBonuses[lvl]?.[ab] ?? 0
}

function remainingForLevel(lvl: number): number {
  const bonuses = state.value.asiBonuses[lvl] ?? {}
  const total = Object.values(bonuses).reduce((s, v) => s + (v ?? 0), 0)
  return 2 - total
}

// Score final EN TENANT COMPTE des ASI déjà alloués sur ce palier ET les autres,
// avec le cap à 20 du PHB. Sert à grise les boutons + qui dépasseraient.
function finalAfterAsi(lvl: number, ab: AbilityKey): number {
  const base = baseScore(ab)
  // Bonus des AUTRES paliers (somme - palier courant local seulement, pas global)
  const otherAsi = (asiBonusByAbility.value[ab] ?? 0) - getBonus(lvl, ab)
  return Math.min(20, base + otherAsi + getBonus(lvl, ab))
}

function canIncrease(lvl: number, ab: AbilityKey): boolean {
  if (remainingForLevel(lvl) <= 0) return false
  if (getBonus(lvl, ab) >= 2) return false
  if (finalAfterAsi(lvl, ab) >= 20) return false
  return true
}

function adjust(lvl: number, ab: AbilityKey, delta: number) {
  const cur = getBonus(lvl, ab)
  const next = cur + delta
  if (next < 0 || next > 2) return
  if (delta > 0 && !canIncrease(lvl, ab)) return
  const bonuses = { ...(state.value.asiBonuses[lvl] ?? {}) }
  if (next === 0) delete bonuses[ab]
  else bonuses[ab] = next
  state.value.asiBonuses = { ...state.value.asiBonuses, [lvl]: bonuses }
}

function setChoice(lvl: number, choice: 'asi' | 'feat') {
  // Toggle : reclic sur le même choix → annule
  if (state.value.asiChoice[lvl] === choice) {
    const next = { ...state.value.asiChoice }
    delete next[lvl]
    state.value.asiChoice = next
    return
  }
  state.value.asiChoice = { ...state.value.asiChoice, [lvl]: choice }
  // Nettoie l'autre côté
  if (choice === 'asi') {
    const feats = { ...state.value.asiFeats }
    delete feats[lvl]
    state.value.asiFeats = feats
  }
  else {
    const bonuses = { ...state.value.asiBonuses }
    delete bonuses[lvl]
    state.value.asiBonuses = bonuses
  }
}

function isPalierComplete(lvl: number): boolean {
  const choice = state.value.asiChoice[lvl]
  if (!choice) return false
  if (choice === 'asi') return remainingForLevel(lvl) === 0
  return !!state.value.asiFeats[lvl]
}

function palierSummary(lvl: number): string {
  const choice = state.value.asiChoice[lvl]
  if (choice === 'feat') {
    const feat = getFeatById(state.value.asiFeats[lvl])
    return feat?.name ?? 'Don à choisir'
  }
  if (choice === 'asi') {
    const bonuses = state.value.asiBonuses[lvl] ?? {}
    const parts = (Object.entries(bonuses) as [AbilityKey, number][])
      .filter(([, v]) => (v ?? 0) > 0)
      .map(([ab, v]) => `+${v} ${ABILITY_SHORT[ab]}`)
    return parts.length ? parts.join(', ') : '0/2 points'
  }
  return ''
}
</script>
