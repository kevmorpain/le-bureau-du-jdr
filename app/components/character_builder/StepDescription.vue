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

          <!-- Capacité si sélectionné (backgrounds prédéfinis) -->
          <div v-if="state.backgroundId === bg.id && bg.featureName" class="mt-3 pt-3 border-t border-(--ui-border) w-full">
            <div class="text-xs font-semibold text-amber-400 mb-0.5">{{ bg.featureName }}</div>
            <div class="text-xs text-muted leading-relaxed">{{ bg.featureDescription }}</div>
          </div>
        </button>
      </div>

      <!-- Formulaire background personnalisé -->
      <div v-if="state.backgroundId === 'custom'" class="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex flex-col gap-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Nom de l'historique</label>
          <input
            v-model="state.customBackgroundName"
            type="text"
            placeholder="Ex : Aventurier de fortune, Fugitif…"
            class="w-full px-3 py-2 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-sm text-(--ui-text) focus:outline-none"
          >
        </div>
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">
            Maîtrises de compétences
            <span class="text-amber-400 ml-1">(choisissez 2)</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="sk in SKILLS"
              :key="sk.key"
              type="button"
              class="px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer"
              :class="state.customBackgroundSkills.includes(sk.key)
                ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-medium'
                : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-amber-500/40'"
              :disabled="!state.customBackgroundSkills.includes(sk.key) && state.customBackgroundSkills.length >= 2"
              @click="toggleCustomSkill(sk.key)"
            >
              {{ sk.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Choix de maîtrises d'outils (backgrounds avec options) -->
    <div v-if="toolChoices.length > 0" class="mb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Maîtrises d'outils</p>
      <div v-for="tc in toolChoices" :key="tc.label" class="mb-4">
        <p class="text-xs text-muted mb-2">{{ tc.label }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in tc.options"
            :key="opt"
            type="button"
            class="px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer"
            :class="state.selectedToolProficiencies[tc.label] === opt
              ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-medium'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40'"
            @click="state.selectedToolProficiencies[tc.label] = opt"
          >
            {{ opt }}
          </button>
        </div>
      </div>
    </div>

    <!-- Choix de langues -->
    <div v-if="languageChoiceCount > 0" class="mb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-1">
        Langues supplémentaires
        <span class="text-amber-400 ml-1.5">{{ state.selectedLanguages.length }}/{{ languageChoiceCount }} choix</span>
      </p>
      <p class="text-xs text-muted mb-3">Votre race ou historique vous permet d'apprendre {{ languageChoiceCount === 1 ? 'une langue' : `${languageChoiceCount} langues` }} supplémentaire{{ languageChoiceCount > 1 ? 's' : '' }}.</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="lang in LANGUAGES"
          :key="lang"
          type="button"
          class="px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer"
          :class="state.selectedLanguages.includes(lang)
            ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-medium'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40'"
          :disabled="!state.selectedLanguages.includes(lang) && state.selectedLanguages.length >= languageChoiceCount"
          @click="toggleLanguage(lang)"
        >
          {{ lang }}
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
  LANGUAGES,
  languageChoiceCount,
  TOOL_CHOICE_MAP,
} = useCharacterBuilder()

// Entrées de choix d'outils pour le background courant
const toolChoices = computed(() =>
  (backgroundData.value?.toolProficiencies ?? [])
    .filter(p => TOOL_CHOICE_MAP[p])
    .map(p => ({ label: p, options: TOOL_CHOICE_MAP[p]! })),
)

const traitFields: { key: TraitKey, label: string, placeholder: string }[] = [
  { key: 'personality', label: 'Personnalité', placeholder: 'Je suis…' },
  { key: 'ideals', label: 'Idéaux', placeholder: 'Je crois que…' },
  { key: 'bonds', label: 'Liens', placeholder: 'Je tiens à…' },
  { key: 'flaws', label: 'Défauts', placeholder: 'Mon point faible…' },
]

function toggleLanguage(lang: string) {
  const idx = state.value.selectedLanguages.indexOf(lang)
  if (idx >= 0) {
    state.value.selectedLanguages.splice(idx, 1)
  }
  else if (state.value.selectedLanguages.length < languageChoiceCount.value) {
    state.value.selectedLanguages.push(lang)
  }
}

function toggleCustomSkill(key: string) {
  const idx = state.value.customBackgroundSkills.indexOf(key)
  if (idx >= 0) {
    state.value.customBackgroundSkills.splice(idx, 1)
  }
  else if (state.value.customBackgroundSkills.length < 2) {
    state.value.customBackgroundSkills.push(key)
  }
}

// Reset background-specific fields when switching background
watch(() => state.value.backgroundId, (id) => {
  if (id !== 'custom') {
    state.value.customBackgroundName = ''
    state.value.customBackgroundSkills = []
  }
  state.value.selectedToolProficiencies = {}
})
</script>
