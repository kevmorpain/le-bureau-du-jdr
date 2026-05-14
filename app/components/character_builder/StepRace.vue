<template>
  <div>
    <!-- En-tête -->
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">🧬</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Race</h2>
        <p class="text-sm text-muted mt-0.5">La race détermine vos bonus de caractéristiques, vos traits naturels, votre vitesse et vos langues.</p>
      </div>
    </div>

    <!-- Grille des races -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        v-for="race in RACES"
        :key="race.id"
        type="button"
        class="text-left rounded-xl border p-4 transition-colors cursor-pointer flex flex-col justify-start"
        :class="state.raceId === race.id
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-amber-500/40'"
        @click="selectRace(race.id)"
      >
        <div class="flex items-center gap-3 mb-2">
          <span class="text-3xl leading-none">{{ race.emoji }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-(--ui-text)">{{ race.name }}</div>
            <div class="text-xs font-semibold text-amber-400 mt-0.5">
              {{ formatBonuses(race.abilityBonuses) }}
              <span v-if="race.hasHalfElfBonuses" class="text-amber-400/70"> · +1+1 au choix</span>
              <span v-if="race.hasDragonAncestry" class="text-amber-400/70"> · selon ascendance</span>
            </div>
          </div>
        </div>

        <div class="text-xs text-muted leading-relaxed">{{ race.description }}</div>

        <!-- Expansion inline si sélectionnée -->
        <div v-if="state.raceId === race.id" class="mt-3 pt-3 border-t border-(--ui-border) w-full">
          <div class="text-xs font-bold uppercase tracking-wider text-muted mb-2">Traits raciaux</div>
          <ul class="space-y-1 mb-3">
            <li v-for="trait in race.traits" :key="trait" class="text-xs text-(--ui-text) flex gap-1.5">
              <span class="text-amber-400 shrink-0">·</span>
              <span>{{ trait }}</span>
            </li>
          </ul>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-if="race.darkvision"
              class="text-xs px-2 py-0.5 rounded-full border"
              style="background: rgba(96,165,250,0.15); border-color: rgba(96,165,250,0.3); color: #60a5fa"
            >Vision {{ race.darkvision }}m</span>
            <span class="text-xs px-2 py-0.5 rounded-full border border-(--ui-border) bg-(--ui-bg) text-muted">
              {{ race.size }} · {{ race.speed }}m
            </span>
            <UBadge v-for="lang in race.languages" :key="lang" color="amber" variant="subtle" size="md">{{ lang }}</UBadge>
          </div>
        </div>
      </button>
    </div>

    <!-- Section sous-races -->
    <template v-if="raceData?.subraces?.length">
      <USeparator class="my-6" />
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Sous-race — choisissez une spécialisation</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="sub in raceData.subraces"
          :key="sub.id"
          type="button"
          class="text-left rounded-xl border p-4 transition-colors cursor-pointer flex flex-col justify-start"
          :class="state.subraceId === sub.id
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-amber-500/40'"
          @click="state.subraceId = sub.id"
        >
          <div class="font-bold text-(--ui-text) text-sm">{{ sub.name }}</div>
          <div class="text-xs font-semibold text-amber-400 mt-0.5">
            {{ formatBonuses(sub.abilityBonuses) }}
            <span v-if="sub.speed && sub.speed !== raceData.speed" class="text-amber-400/70"> · Vit. {{ sub.speed }}m</span>
          </div>
          <div class="text-xs text-muted mt-1 leading-relaxed">{{ sub.description }}</div>

          <!-- Traits si sélectionnée -->
          <div v-if="state.subraceId === sub.id" class="mt-3 pt-3 border-t border-(--ui-border) w-full">
            <ul class="space-y-1">
              <li v-for="trait in sub.traits" :key="trait" class="text-xs text-(--ui-text) flex gap-1.5">
                <span class="text-amber-400 shrink-0">·</span>
                <span>{{ trait }}</span>
              </li>
            </ul>
          </div>
        </button>
      </div>
    </template>

    <!-- Cas spécial : Humain variante -->
    <template v-if="state.raceId === 'human'">
      <USeparator class="my-6" />
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Variante humaine</p>
      <div class="flex gap-2 mb-4">
        <button
          type="button"
          class="flex-1 rounded-xl border p-3 text-sm font-medium transition-colors cursor-pointer"
          :class="!state.isVariantHuman
            ? 'border-amber-500 bg-amber-500/10 text-(--ui-text)'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40'"
          @click="state.isVariantHuman = false"
        >
          Humain classique
          <div class="text-xs font-normal text-amber-400 mt-0.5">+1 à toutes les caractéristiques</div>
        </button>
        <button
          type="button"
          class="flex-1 rounded-xl border p-3 text-sm font-medium transition-colors cursor-pointer"
          :class="state.isVariantHuman
            ? 'border-amber-500 bg-amber-500/10 text-(--ui-text)'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40'"
          @click="state.isVariantHuman = true"
        >
          Humain variante
          <div class="text-xs font-normal text-amber-400 mt-0.5">+1+1 au choix + compétence bonus</div>
        </button>
      </div>

      <template v-if="state.isVariantHuman">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">Choisissez 2 caractéristiques (+1 chacune)</p>
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            v-for="ab in ABILITIES"
            :key="ab"
            type="button"
            class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
            :class="state.variantHumanBonuses.includes(ab)
              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40'"
            @click="toggleVariantHumanBonus(ab)"
          >
            {{ ABILITY_SHORT[ab] }}
          </button>
        </div>

        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">Compétence bonus</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <button
            v-for="skill in SKILLS"
            :key="skill.key"
            type="button"
            class="text-left rounded-lg border px-3 py-1.5 text-xs transition-colors cursor-pointer"
            :class="state.variantHumanSkill === skill.key
              ? 'border-amber-500 bg-amber-500/10 text-(--ui-text) font-medium'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40'"
            @click="state.variantHumanSkill = skill.key"
          >
            {{ skill.label }}
          </button>
        </div>
      </template>
    </template>

    <!-- Cas spécial : Demi-Elfe bonus +1+1 -->
    <template v-if="state.raceId === 'half-elf'">
      <USeparator class="my-6" />
      <div class="rounded-xl border border-amber-500/40 bg-(--ui-bg-elevated) p-4">
        <div class="flex items-center gap-2 mb-3">
          <p class="text-xs font-semibold text-amber-400">Bonus Demi-Elfe · choisissez 2 caractéristiques pour +1 (pas CHA)</p>
          <span
            class="text-xs font-semibold"
            :class="state.halfElfBonuses.length === 2 ? 'text-green-400' : 'text-muted'"
          >{{ state.halfElfBonuses.length }}/2</span>
        </div>
        <div class="flex gap-2">
          <button
            v-for="ab in ABILITIES.filter(a => a !== 'cha')"
            :key="ab"
            type="button"
            class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
            :class="state.halfElfBonuses.includes(ab)
              ? 'border-amber-500 bg-amber-500/10 text-amber-400 cursor-pointer'
              : state.halfElfBonuses.length >= 2
                ? 'border-(--ui-border) text-muted/40 cursor-not-allowed opacity-45'
                : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40 cursor-pointer'"
            @click="toggleHalfElfBonus(ab)"
          >
            {{ ABILITY_SHORT[ab] }}
          </button>
        </div>
      </div>
    </template>

    <!-- Cas spécial : Drakéide ascendance draconique -->
    <template v-if="state.raceId === 'dragonborn'">
      <USeparator class="my-6" />
      <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Ascendance draconique — détermine le type de souffle et la résistance</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
          <button
            v-for="ancestry in DRAGON_ANCESTRY"
            :key="ancestry.id"
            type="button"
            class="text-center rounded-xl border p-3 transition-colors cursor-pointer"
            :class="state.dragonAncestry === ancestry.id
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-(--ui-border) bg-(--ui-bg) hover:border-amber-500/40'"
            @click="state.dragonAncestry = ancestry.id"
          >
            <div class="font-bold text-sm text-(--ui-text)">{{ ancestry.name }}</div>
            <div class="text-xs text-amber-400 mt-0.5">{{ ancestry.damage }}</div>
            <div class="text-xs text-muted mt-0.5">{{ ancestry.breathShape }}</div>
          </button>
        </div>
        <div v-if="selectedAncestry" class="text-xs text-muted">
          Souffle : {{ selectedAncestry.breathShape }} · JS {{ selectedAncestry.breathSave }} · Dégâts {{ selectedAncestry.damage }} · Résistance {{ selectedAncestry.damage }}
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { AbilityKey } from '~/data/character-builder'

const {
  state,
  raceData,
  RACES,
  DRAGON_ANCESTRY,
  ABILITY_SHORT,
  ABILITIES,
  SKILLS,
} = useCharacterBuilder()

const selectedAncestry = computed(() =>
  state.value.dragonAncestry
    ? DRAGON_ANCESTRY.find(d => d.id === state.value.dragonAncestry) ?? null
    : null,
)

function formatBonuses(bonuses: Partial<Record<AbilityKey, number>>): string {
  return Object.entries(bonuses)
    .filter(([, v]) => v)
    .map(([k, v]) => `+${v} ${ABILITY_SHORT[k as AbilityKey]}`)
    .join(' ')
}

function selectRace(id: string) {
  const race = RACES.find(r => r.id === id)
  state.value.raceId = id
  // Auto-sélectionner si une seule sous-race
  state.value.subraceId = race?.subraces?.length === 1 ? race.subraces[0].id : null
  state.value.halfElfBonuses = []
  state.value.variantHumanBonuses = []
  state.value.variantHumanSkill = null
  state.value.dragonAncestry = null
  state.value.isVariantHuman = false
}

function toggleHalfElfBonus(ab: AbilityKey) {
  const list = state.value.halfElfBonuses
  const idx = list.indexOf(ab)
  if (idx >= 0) {
    list.splice(idx, 1)
  }
  else if (list.length < 2) {
    list.push(ab)
  }
}

function toggleVariantHumanBonus(ab: AbilityKey) {
  const list = state.value.variantHumanBonuses
  const idx = list.indexOf(ab)
  if (idx >= 0) {
    list.splice(idx, 1)
  }
  else if (list.length < 2) {
    list.push(ab)
  }
}
</script>
