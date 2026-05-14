<template>
  <div>
    <!-- En-tête -->
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">📜</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Description</h2>
        <p class="text-sm text-muted mt-0.5">Donnez vie à votre personnage avec un nom, une histoire et une vision du monde.</p>
      </div>
    </div>

    <!-- Nom -->
    <div class="mb-6">
      <label class="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Nom</label>
      <input
        v-model="state.name"
        type="text"
        placeholder="Entrez le nom de votre personnage…"
        class="w-full px-4 py-2.5 rounded-xl border text-lg font-bold text-(--ui-text) bg-(--ui-bg-elevated) focus:outline-none transition-colors"
        :class="state.name ? 'border-amber-500/50' : 'border-(--ui-border)'"
      >
    </div>

    <!-- Historique -->
    <div class="mb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Historique</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="bg in BACKGROUNDS"
          :key="bg.id"
          type="button"
          class="text-left rounded-xl border p-3 transition-colors cursor-pointer flex flex-col justify-start"
          :class="state.backgroundId === bg.id
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-amber-500/40'"
          @click="state.backgroundId = bg.id"
        >
          <div class="font-bold text-sm text-(--ui-text) mb-1">{{ bg.name }}</div>
          <div class="text-xs text-muted leading-relaxed mb-2">{{ bg.description }}</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="sk in bg.skillProficiencies"
              :key="sk"
              class="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400"
            >{{ SKILLS.find(s => s.key === sk)?.label ?? sk }}</span>
            <span
              v-for="tool in bg.toolProficiencies"
              :key="tool"
              class="text-xs px-1.5 py-0.5 rounded-full bg-(--ui-bg) border border-(--ui-border) text-muted"
            >{{ tool }}</span>
            <span
              v-if="bg.languages > 0"
              class="text-xs px-1.5 py-0.5 rounded-full bg-(--ui-bg) border border-(--ui-border) text-muted"
            >+{{ bg.languages }} langue{{ bg.languages > 1 ? 's' : '' }}</span>
          </div>

          <!-- Capacité si sélectionné -->
          <div v-if="state.backgroundId === bg.id" class="mt-3 pt-3 border-t border-(--ui-border) w-full">
            <div class="text-xs font-semibold text-amber-400 mb-0.5">{{ bg.featureName }}</div>
            <div class="text-xs text-muted leading-relaxed">{{ bg.featureDescription }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Alignement -->
    <div class="mb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Alignement</p>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="al in ALIGNMENTS"
          :key="al.id"
          type="button"
          class="text-left rounded-xl border p-3 transition-colors cursor-pointer"
          :class="state.alignment === al.id
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-amber-500/40'"
          @click="state.alignment = al.id"
        >
          <div
            class="font-black font-mono text-base mb-0.5"
            :class="state.alignment === al.id ? 'text-amber-400' : 'text-(--ui-text)'"
          >{{ al.short }}</div>
          <div class="font-semibold text-xs text-(--ui-text)">{{ al.name }}</div>
          <div class="text-xs text-muted mt-0.5 leading-snug">{{ al.description }}</div>
        </button>
      </div>
    </div>

    <!-- Traits de personnalité -->
    <div>
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Traits de personnalité</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TraitField
          v-for="field in traitFields"
          :key="field.key"
          :label="field.label"
          :placeholder="field.placeholder"
          :model-value="state[field.key as TraitKey]"
          :suggestions="backgroundData?.suggestions[field.key as keyof typeof backgroundData.suggestions] ?? []"
          @update:model-value="state[field.key as TraitKey] = $event"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { BuilderState } from '~/composables/useCharacterBuilder'

type TraitKey = 'personality' | 'ideals' | 'bonds' | 'flaws'

const {
  state,
  backgroundData,
  BACKGROUNDS,
  ALIGNMENTS,
  SKILLS,
} = useCharacterBuilder()

const traitFields: { key: TraitKey, label: string, placeholder: string }[] = [
  { key: 'personality', label: 'Personnalité', placeholder: 'Je suis…' },
  { key: 'ideals', label: 'Idéaux', placeholder: 'Je crois que…' },
  { key: 'bonds', label: 'Liens', placeholder: 'Je tiens à…' },
  { key: 'flaws', label: 'Défauts', placeholder: 'Mon point faible…' },
]
</script>
