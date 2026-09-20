<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">📜</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Description</h2>
        <p class="text-sm text-muted mt-0.5">Donnez vie à votre personnage avec un nom, une histoire et une vision du monde.</p>
      </div>
    </div>

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

    <div class="mb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Historique</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="bg in filteredBackgrounds"
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

          <div v-if="state.backgroundId === bg.id && bg.featureName" class="mt-3 pt-3 border-t border-(--ui-border) w-full">
            <div class="text-xs font-semibold text-amber-400 mb-0.5">{{ bg.featureName }}</div>
            <div class="text-xs text-muted leading-relaxed">{{ bg.featureDescription }}</div>
          </div>
        </button>
      </div>

      <p
        v-if="classSkillConflicts.length"
        class="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-300"
      >
        ⚠️ Conflit : <strong>{{ conflictLabels }}</strong> {{ classSkillConflicts.length > 1 ? 'sont déjà accordées' : 'est déjà accordée' }} par ta classe. Ce doublon est gaspillé.
        <button
          type="button"
          class="underline font-semibold ml-1 hover:text-amber-200"
          @click="goTo('class')"
        >
          Revenir aux compétences de classe
        </button>
      </p>

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

    <div class="mt-6">
      <button
        type="button"
        class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted hover:text-(--ui-text) transition-colors cursor-pointer"
        @click="detailsOpen = !detailsOpen"
      >
        <span>{{ detailsOpen ? '▾' : '▸' }}</span>
        <span>Apparence & histoire</span>
        <span class="text-amber-400/70 normal-case tracking-normal font-medium">facultatif</span>
      </button>

      <div
        v-if="detailsOpen"
        class="mt-3 space-y-4"
      >
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            v-for="field in appearanceFields"
            :key="field.key"
          >
            <label class="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">{{ field.label }}</label>
            <input
              v-model="state[field.key]"
              type="text"
              :placeholder="field.placeholder"
              class="w-full px-3 py-2 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-(--ui-text) placeholder-muted focus:border-amber-500/50 focus:outline-none"
            >
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">Portrait (URL)</label>
          <input
            v-model="state.portraitUrl"
            type="url"
            placeholder="https://…"
            class="w-full px-3 py-2 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-(--ui-text) placeholder-muted focus:border-amber-500/50 focus:outline-none"
          >
        </div>

        <div
          v-for="field in storyFields"
          :key="field.key"
        >
          <label class="block text-xs font-bold uppercase tracking-widest text-muted mb-1.5">{{ field.label }}</label>
          <textarea
            v-model="state[field.key]"
            :rows="field.rows"
            :placeholder="field.placeholder"
            class="w-full px-3 py-2 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-(--ui-text) placeholder-muted focus:border-amber-500/50 focus:outline-none resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { BuilderState } from '~/composables/useCharacterBuilder'
import { isGatedSource } from '~~/shared/rules/source'

type TraitKey = 'personality' | 'ideals' | 'bonds' | 'flaws'
type AppearanceKey = 'age' | 'height' | 'weight' | 'eyes' | 'hair' | 'skin' | 'deity'
type StoryKey = 'backstory' | 'allies'

const {
  state,
  backgroundData,
  BACKGROUNDS,
  ALIGNMENTS,
  SKILLS,
  LANGUAGES,
  languageChoiceCount,
  TOOL_CHOICE_MAP,
  classSkillConflicts,
  goTo,
} = useCharacterBuilder()

const conflictLabels = computed(() => classSkillConflicts.value.map(k => SKILLS.find(s => s.key === k)?.label ?? k).join(', '))

// Gating : les historiques d'extension (source gatée) ne sont visibles qu'avec le toggle « Étendu ».
const { extended } = useExtendedContent()
const filteredBackgrounds = computed(() =>
  BACKGROUNDS.filter(b => !b.source || !isGatedSource(b.source) || extended.value),
)

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

const detailsOpen = ref(false)

const appearanceFields: { key: AppearanceKey, label: string, placeholder: string }[] = [
  { key: 'age', label: 'Âge', placeholder: '27 ans' },
  { key: 'height', label: 'Taille', placeholder: '1,75 m' },
  { key: 'weight', label: 'Poids', placeholder: '68 kg' },
  { key: 'eyes', label: 'Yeux', placeholder: 'Verts' },
  { key: 'hair', label: 'Cheveux', placeholder: 'Bruns' },
  { key: 'skin', label: 'Peau', placeholder: 'Hâlée' },
  { key: 'deity', label: 'Divinité', placeholder: 'Tyr' },
]

const storyFields: { key: StoryKey, label: string, placeholder: string, rows: number }[] = [
  { key: 'backstory', label: 'Histoire du personnage', placeholder: 'D\'où vient-il ? Qu\'est-ce qui l\'a mis sur la route ?', rows: 5 },
  { key: 'allies', label: 'Alliés & organisations', placeholder: 'Factions, mentors, contacts, dettes…', rows: 3 },
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

watch(() => state.value.backgroundId, (id) => {
  if (id !== 'custom') {
    state.value.customBackgroundName = ''
    state.value.customBackgroundSkills = []
  }
  state.value.selectedToolProficiencies = {}
})

// Le nombre de langues peut baisser (changement d'historique, « langue supplémentaire » désélectionnée) :
// on retire l'excédent, sinon il partirait quand même à la création.
watch(languageChoiceCount, (count) => {
  if (state.value.selectedLanguages.length > count) state.value.selectedLanguages.splice(count)
})
</script>
